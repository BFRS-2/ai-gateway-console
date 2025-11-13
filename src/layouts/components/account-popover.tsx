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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import LoadingButton from "@mui/lab/LoadingButton";

import { z as zod } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "src/routes/hooks";
import { signOut } from "src/auth/context/jwt/action";
import { varHover } from "src/components/animate";
import { CustomPopover, usePopover } from "src/components/custom-popover";
import { Iconify } from "src/components/iconify"; // using your Iconify wrapper
import userService from "src/api/services/user.service";

type StoredUser = {
  name?: string;
  displayName?: string;
  email?: string;
  [k: string]: any;
};

const ChangePasswordSchema = zod
  .object({
    oldPassword: zod.string().min(1, "Current password is required"),
    newPassword: zod.string().min(6, "New password must be at least 6 characters"),
    confirmNewPassword: zod.string().min(6, "Please confirm new password"),
  })
  .refine((vals) => vals.newPassword === vals.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type ChangePasswordForm = zod.infer<typeof ChangePasswordSchema>;

export default function AccountPopover() {
  const router = useRouter();
  const popover = usePopover();
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  // ---- local state (hydrated on client only) ----
  const [user, setUser] = useState<StoredUser>({});
  const [avatarKey, setAvatarKey] = useState<string>("01"); // fallback avatar suffix
  const [hydrated, setHydrated] = useState(false);

  // Change password dialog state
  const [openPwd, setOpenPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string>("");
  const [pwdSuccess, setPwdSuccess] = useState<string>("");

  // Password visibility toggles
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    handleSubmit: handlePwdSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

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
      console.error(error);
    }
  };

  const handleOpenChangePassword = () => {
    setPwdError("");
    setPwdSuccess("");
    reset();
    popover.onClose();
    setOpenPwd(true);
  };

  const handleCloseChangePassword = () => {
    if (!isSubmitting) setOpenPwd(false);
  };

  const onSubmitChangePassword = handlePwdSubmit(async (data) => {
    setPwdError("");
    setPwdSuccess("");
    try {
      await userService.updatePassword(data.oldPassword, data.newPassword);
      setPwdSuccess("Password updated successfully.");
      // Optionally close after short delay
      setTimeout(() => {
        setOpenPwd(false);
      }, 800);
    } catch (e: any) {
      console.error(e);
      setPwdError(e?.message || "Failed to update password. Please try again.");
    }
  });

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
          <MenuItem onClick={handleOpenChangePassword}>
            <Iconify icon="solar:key-minimalistic-2-bold" width={20} />
            Change password
          </MenuItem>
        </Stack>

        <Divider sx={{ borderStyle: "dashed" }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ m: 1, fontWeight: "fontWeightBold", color: "error.main" }}
        >
          Logout
        </MenuItem>
      </CustomPopover>

      {/* ---- Change Password Dialog ---- */}
      <Dialog open={openPwd} onClose={handleCloseChangePassword} fullWidth maxWidth="xs">
        <DialogTitle>Change password</DialogTitle>
        <DialogContent dividers>
          {!!pwdError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {pwdError}
            </Alert>
          )}
          {!!pwdSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {pwdSuccess}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              label="Current password"
              type={showOld ? "text" : "password"}
              fullWidth
              {...register("oldPassword")}
              error={!!errors.oldPassword}
              helperText={errors.oldPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowOld((s) => !s)} edge="end">
                      <Iconify icon={showOld ? "solar:eye-bold" : "solar:eye-closed-bold"} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="New password"
              type={showNew ? "text" : "password"}
              fullWidth
              {...register("newPassword")}
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNew((s) => !s)} edge="end">
                      <Iconify icon={showNew ? "solar:eye-bold" : "solar:eye-closed-bold"} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Confirm new password"
              type={showConfirm ? "text" : "password"}
              fullWidth
              {...register("confirmNewPassword")}
              error={!!errors.confirmNewPassword}
              helperText={errors.confirmNewPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm((s) => !s)} edge="end">
                      <Iconify icon={showConfirm ? "solar:eye-bold" : "solar:eye-closed-bold"} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChangePassword} disabled={isSubmitting}>
            Cancel
          </Button>
          <LoadingButton
            onClick={onSubmitChangePassword}
            variant="contained"
            loading={isSubmitting}
          >
            Update password
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
