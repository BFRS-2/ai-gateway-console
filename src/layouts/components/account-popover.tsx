"use client";

import { m } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { alpha } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import { useRouter } from "src/routes/hooks";
import { signOut } from "src/auth/context/jwt/action";
import { varHover } from "src/components/animate";
import { CustomPopover, usePopover } from "src/components/custom-popover";

type StoredUser = {
  name?: string;
  displayName?: string;
  email?: string;
  [k: string]: any;
};

const OPTIONS = [
  { label: "Profile", linkTo: "/dashboard/settings/profile" },
  { label: "App Settings", linkTo: "/dashboard/settings/projects" },
];

export default function AccountPopover() {
  const router = useRouter();
  const popover = usePopover();
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  // ---- local state (hydrated on client only) ----
  const [user, setUser] = useState<StoredUser>({});
  const [avatarKey, setAvatarKey] = useState<string>("01"); // fallback avatar suffix
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage safely on client
  useEffect(() => {
    setHydrated(true);
    if (typeof window === "undefined") return;

    // _user
    try {
      const raw = window.localStorage.getItem("_user");
      if (raw) {
        const parsed = JSON.parse(raw) as StoredUser;
        setUser(parsed || {});
      }
    } catch {
      setUser({});
    }

    // userAvatar
    try {
      const av = window.localStorage.getItem("userAvatar");
      // normalize to 2-digit string if you have avatar-01.webp style
      const norm = (av && av.toString().padStart(2, "0")) || "01";
      setAvatarKey(norm);
    } catch {
      setAvatarKey("01");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      popover.onClose();
      router.replace("/");
    } catch (error) {
      // optional: add snackbar or toast
      console.error(error);
    }
  };

  const handleClickItem = (path: string) => {
    popover.onClose();
    router.push(path);
  };

  const displayName = user?.displayName || user?.name || "User";
  const email = user?.email || "";

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
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
        aria-label="Account menu"
      >
        {/* Avoid broken src before hydration */}
        <Avatar
          src={hydrated ? `/assets/avatars/avatar-${avatarKey}.webp` : undefined}
          alt={displayName}
          sx={{
            width: 36,
            height: 36,
            border: (theme) => `solid 2px ${theme.palette.background.default}`,
          }}
        >
          {displayName?.charAt(0)?.toUpperCase() || "U"}
        </Avatar>
      </IconButton>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        sx={{ width: 220, p: 0 }}
        anchorEl={anchorRef.current}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {displayName}
          </Typography>

          {email ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
              {email}
            </Typography>
          ) : null}
        </Box>

        <Divider sx={{ borderStyle: "dashed" }} />

        <Stack sx={{ p: 1 }}>
          {OPTIONS.map((option) => (
            <MenuItem key={option.label} onClick={() => handleClickItem(option.linkTo)}>
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
