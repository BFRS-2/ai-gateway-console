"use client";

import { z as zod } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";

import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";

import { RouterLink } from "src/routes/components";
import { Form, Field } from "src/components/hook-form";
import authService from "src/api/services/auth.service";

const ResetPasswordSchema = zod
  .object({
    password: zod.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: zod.string().min(6, "Please confirm your password"),
  })
  .refine((vals) => vals.password === vals.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = zod.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordView() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token")?.trim() || "";

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const methods = useForm<ResetPasswordForm>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!token) {
      setErrorMsg("Reset token is missing or invalid. Please use the latest reset link from your email.");
      return;
    }

    try {
      const res = await authService.resetPassword({
        token,
        password: data.password,
      });

      const apiErrorMessage =
        (res as any)?.error?.payload?.data?.message ||
        (res as any)?.error?.payload?.message ||
        (res as any)?.error?.message ||
        (res as any)?.data?.message ||
        (res as any)?.message;

      if (!res || (res as any)?.success === false || (res as any)?.error) {
        setErrorMsg(apiErrorMessage || "Failed to reset password. Please try again.");
        return;
      }

      setSuccessMsg(
        (res as any)?.data?.message ||
          (res as any)?.message ||
          "Password reset successfully. You can now sign in."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (e: any) {
      console.error(e);
      const apiErrorMessage =
        e?.error?.payload?.data?.message ||
        e?.error?.payload?.message ||
        e?.payload?.message ||
        e?.data?.message ||
        e?.message ||
        "Failed to reset password. Please try again.";

      setErrorMsg(apiErrorMessage);
    }
  });

  return (
    <>
      <Stack spacing={1.5} sx={{ mb: 5 }}>
        <Typography variant="h5">Reset your password</Typography>
        <Typography variant="body2" color="text.secondary">
          Enter a new password for your account and confirm it to continue.
        </Typography>
      </Stack>

      {!token && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Reset token is missing. Please open the password reset link from your email again.
        </Alert>
      )}

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      {!!successMsg && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Field.Text
            name="password"
            label="New password"
            type="password"
            placeholder="Enter your new password"
            InputLabelProps={{ shrink: true }}
          />

          <Field.Text
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            placeholder="Re-enter your new password"
            InputLabelProps={{ shrink: true }}
          />

          <Stack direction="row" spacing={0.5}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Back to login?
            </Typography>
            <Link component={RouterLink} href="/login" variant="subtitle2">
              Sign in
            </Link>
          </Stack>

          <LoadingButton
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Resetting..."
            disabled={!token}
          >
            Reset password
          </LoadingButton>
        </Stack>
      </Form>
    </>
  );
}
