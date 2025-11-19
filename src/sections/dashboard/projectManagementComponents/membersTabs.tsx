"use client";

import {
  Box,
  Typography,
  TextField,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  TablePagination,
  Button,
  Chip,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import userManagementService from "src/api/services/user.service";
import { useSelector } from "react-redux";
import { RootState } from "src/stores/store";

type ApiUser = {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  organizations: Array<{ organization_id: string; role: string }>;
  status: string;
};

type MembersTabProps = {
  organizationId: string;
  projectId: string;
  selectedProject?: { id: string; name: string };
  onInvite?: () => void;
};

// small debounce hook
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function MembersTab({
  organizationId,
  projectId,
  selectedProject,
  onInvite,
}: MembersTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const [userSearch, setUserSearch] = useState("");
  const debouncedSearch = useDebouncedValue(userSearch, 350);

  const [userLoading, setUserLoading] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [userTotal, setUserTotal] = useState(0);

  // external refetch trigger
  const [refreshTick, setRefreshTick] = useState(0);

  // Abort/collision guards
  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const fetchUsers = useCallback(
    async (name: string, page: number, limit: number) => {
      if (!organizationId || !projectId) return;
      // cancel previous request (Strict Mode renders/effects included)
      if (abortRef.current) abortRef.current.abort();
      const aborter = new AbortController();
      abortRef.current = aborter;

      const myReqId = ++reqIdRef.current;

      try {
        setUserLoading(true);
        const res = await (userManagementService as any).listUsers(
          {
            name: name || undefined,
            page: page + 1, // API 1-based
            limit,
            organization_id: organizationId,
            project_id: projectId,
          },
          { signal: aborter.signal }
        );

        // ignore stale responses
        if (myReqId !== reqIdRef.current) return;

        if (res?.success && res?.data) {
          const items: ApiUser[] = res.data.items || [];
          const total = res.data.pagination?.total_count ?? items.length;
          setUsers(items);
          setUserTotal(total);
        } else {
          setUsers([]);
          setUserTotal(0);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("listUsers failed", err);
          setUsers([]);
          setUserTotal(0);
          enqueueSnackbar("Failed to load members", { variant: "error" });
        }
      } finally {
        if (myReqId === reqIdRef.current) setUserLoading(false);
      }
    },
    [organizationId, projectId, enqueueSnackbar]
  );

  // Single source of truth for fetching:
  // Fires on mount, on debounced search, page/rows changes, project/org changes, or external refresh tick
  useEffect(() => {
    fetchUsers(debouncedSearch, userPage, userRowsPerPage);
  }, [
    debouncedSearch,
    userPage,
    userRowsPerPage,
    organizationId,
    projectId,
    refreshTick,
    fetchUsers,
  ]);

  // reset page when search changes (state only; fetching is driven by effect above)
  useEffect(() => {
    setUserPage(0);
  }, [debouncedSearch]);

  // external refetch event -> nudge refreshTick; no direct fetch here
  useEffect(() => {
    const handler = () => setRefreshTick((x) => x + 1);
    window.addEventListener("refetch_members", handler);
    return () => window.removeEventListener("refetch_members", handler);
  }, []);

  // clean up in-flight on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);
  const userRole = useSelector((state: RootState) => {
    return state.user.userRole;
  });
  console.log("🚀 ~ MembersTab ~ userRole:", userRole)
  const userPermission = useSelector(
    (state: RootState) => state.user.userPermission
  );
  console.log("🚀 ~ MembersTab ~ userPermission:", userPermission)

  const isEdittingAllowed = useMemo(() => {
    
    if (userRole === "admin" || userRole === "owner") return true;
    if (userRole === "member" && userPermission === "write") return true;
    return false;
  }, [userRole, userPermission]);
  console.log("🚀 ~ MembersTab ~ isEdittingAllowed:", isEdittingAllowed)
  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 1,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h4">
          Members for :{" "}
          {(() => {
            const name = selectedProject?.name ?? "";
            return name
              ? name.length > 20
                ? `${name.slice(0, 20)}...`
                : name
              : "Current context";
          })()}
        </Typography>

        {isEdittingAllowed && (
          <Button variant="contained" onClick={onInvite} disabled={!projectId}>
            Invite Member
          </Button>
        )}
      </Box>

      <TextField
        size="small"
        label="Search members"
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 280 }}
      />

      <Paper variant="outlined">
        {userLoading ? (
          <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length ? (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>
                        {u.is_admin
                          ? "admin"
                          : u.organizations?.[0]?.role || "member"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.status.toUpperCase()}
                          color={u.status === "active" ? "success" : "error"}
                          size="small"
                        ></Chip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2">No Member Found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={userTotal}
              page={userPage}
              onPageChange={(_, newPage) => {
                setUserPage(newPage); // effect will fetch
              }}
              rowsPerPage={userRowsPerPage}
              onRowsPerPageChange={(e) => {
                const newRows = parseInt(e.target.value, 10);
                setUserRowsPerPage(newRows);
                setUserPage(0); // effect will fetch with page 0
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
