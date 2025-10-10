import { useMemo, useState } from 'react';
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TablePagination,
  Chip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip, Typography, Stack,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/ModeEditOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import { User } from './types';
import { RolesEditDrawer } from './RolesEditDrawer';
import { AccessDrawer } from './AccessDrawer';
import { ConfirmDialog } from './ConfirmDialog';

export function UserTable({ rows }: { rows: User[] }) {
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(10);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);

  const [editRolesUser, setEditRolesUser] = useState<User | null>(null);
  const [accessUser, setAccessUser] = useState<User | null>(null);

  const [confirm, setConfirm] = useState<{ open: boolean; title: string; desc?: string; onYes: () => void }>({
    open: false, title: '', desc: '', onYes: () => {},
  });

  const openMenu = Boolean(anchorEl);

  const paged = useMemo(() => rows.slice(page * rpp, page * rpp + rpp), [rows, page, rpp]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>, u: User) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(u);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const confirmAction = (title: string, desc: string, onYes: () => void) =>
    setConfirm({ open: true, title, desc, onYes });

  // TODO: wire these with API calls
  const onDelete = (u: User) => confirmAction('Delete user?', `This will permanently remove ${u.name}.`, () => console.log('delete', u.id));
  const onBlockToggle = (u: User) =>
    confirmAction(
      `${u.status === 'active' ? 'Block' : 'Unblock'} user?`,
      `${u.name} will be ${u.status === 'active' ? 'blocked' : 'unblocked'}.`,
      () => console.log('blockToggle', u.id)
    );

  return (
    <>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {u.roles.map((r) => (
                        <Chip key={r} size="small" label={r} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={u.status}
                      color={u.status === 'active' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{u.lastActiveAt ?? '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="More">
                      <IconButton size="small" onClick={(e) => handleMenu(e, u)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rpp}
          onRowsPerPageChange={(e) => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      {/* actions menu */}
      <Menu
        open={openMenu}
        anchorEl={anchorEl}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => { setEditRolesUser(menuUser); closeMenu(); }}
        >
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit roles</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => { setAccessUser(menuUser); closeMenu(); }}
        >
          <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Give / Revoke access</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => { if (menuUser) onBlockToggle(menuUser); closeMenu(); }}
        >
          <ListItemIcon>{menuUser?.status === 'active' ? <BlockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}</ListItemIcon>
          <ListItemText>{menuUser?.status === 'active' ? 'Block' : 'Unblock'}</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => { if (menuUser) onDelete(menuUser); closeMenu(); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* drawers & dialogs */}
      <RolesEditDrawer
        user={editRolesUser}
        open={!!editRolesUser}
        onClose={() => setEditRolesUser(null)}
        onSave={(nextRoles) => {
          console.log('save roles', editRolesUser?.id, nextRoles);
          setEditRolesUser(null);
        }}
      />

      <AccessDrawer
        user={accessUser}
        open={!!accessUser}
        onClose={() => setAccessUser(null)}
        onSave={(nextAccesses) => {
          console.log('save access', accessUser?.id, nextAccesses);
          setAccessUser(null);
        }}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.desc}
        onClose={() => setConfirm({ ...confirm, open: false })}
        onConfirm={() => { confirm.onYes(); setConfirm({ ...confirm, open: false }); }}
      />
    </>
  );
}
