import { m } from "framer-motion";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { alpha } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import { useRouter } from "src/routes/hooks";


import { useAuthContext } from "src/auth/hooks";
import { signOut } from 'src/auth/context/jwt/action';
import { varHover } from "src/components/animate";
import { CustomPopover, usePopover } from "src/components/custom-popover";
import { useRef } from "react";

// ----------------------------------------------------------------------

const OPTIONS = [
  {
    label: "Profile",
    linkTo: "/dashboard/settings/profile",
  },
  {
    label: "App Settings",
    linkTo: "/dashboard/settings/projects",
  },
];

// ----------------------------------------------------------------------

export default function AccountPopover() {
  const router = useRouter();

  const user = JSON.parse(localStorage.getItem("_user") || "{}") || {};
  const avatar =localStorage.getItem("userAvatar")

  const popover = usePopover();

  const handleLogout = async () => {
    try {
      await signOut();
      popover.onClose();
      router.replace("/");
    } catch (error) {
      console.error(error);
    }
  };

  const handleClickItem = (path: string) => {
    popover.onClose();
    router.push(path);
  };
  const anchorRef= useRef(null)

  return (
    <div style={{ display: "inline-block", position:"relative" }}>
      <IconButton
        className="accountSettings"
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={popover.onOpen}
        sx={{
          width: 40,
          height: 40,
          background: (theme) => alpha(theme.palette.grey[500], 0.08),
          ...(popover.open && {
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          }),
        }}
        ref={anchorRef}
      >
        <Avatar
          src={`/assets/avatars/avatar-${avatar}.webp`}
          alt={user?.name}
          sx={{
            width: 36,
            height: 36,
            border: (theme) => `solid 2px ${theme.palette.background.default}`,
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
      </IconButton>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        sx={{ width: 200, p: 0, top:0 }}
        anchorEl={anchorRef.current}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.displayName}
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
            {user?.email}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed" }} />

        <Stack sx={{ p: 1 }}>
          {OPTIONS.map((option) => (
            <MenuItem
              key={option.label}
              onClick={() => handleClickItem(option.linkTo)}
            >
              {option.label}
            </MenuItem>
          ))}
        </Stack>

        <Divider sx={{ borderStyle: "dashed" }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ m: 1, fontWeight: "fontWeightBold", color: "error.main" }}
        >
          Logout
        </MenuItem>
      </CustomPopover>
    </div>
  );
}
