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
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import userManagementService from "src/api/services/user.service";

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
  onInvite?: () => void; // <-- NEW
};

export function MembersTab({
  organizationId,
  projectId,
  selectedProject,
  onInvite,
}: MembersTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const [userSearch, setUserSearch] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [userTotal, setUserTotal] = useState(0);

  const fetchUsers = async (
    name: string,
    page: number,
    limit: number
  ): Promise<void> => {
    try {
      setUserLoading(true);
      const res = await (userManagementService as any).listUsers({
        name: name || undefined,
        page: page + 1,
        limit,
      });

      if (res?.success && res?.data) {
        const items: ApiUser[] = res.data.items || [];
        const pagination = res.data.pagination;
        setUsers(items);
        setUserTotal(pagination?.total_count ?? items.length);
      } else {
        setUsers([]);
        setUserTotal(0);
      }
    } catch (err) {
      console.error("listUsers failed", err);
      setUsers([]);
      setUserTotal(0);
      enqueueSnackbar("Failed to load members", { variant: "error" });
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(userSearch, userPage, userRowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUserPage(0);
    fetchUsers(userSearch, 0, userRowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch]);

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
          Members for: {selectedProject?.name || "Current context"}
        </Typography>

        <Button
          variant="contained"
          onClick={onInvite}
          disabled={!projectId}
        >
          Invite member
        </Button>
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
                      <TableCell>{u.status}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2">
                        No users found.
                      </Typography>
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
                setUserPage(newPage);
                fetchUsers(userSearch, newPage, userRowsPerPage);
              }}
              rowsPerPage={userRowsPerPage}
              onRowsPerPageChange={(e) => {
                const newRows = parseInt(e.target.value, 10);
                setUserRowsPerPage(newRows);
                setUserPage(0);
                fetchUsers(userSearch, 0, newRows);
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
