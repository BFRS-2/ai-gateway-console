"use client";

import { z as zod } from "zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";

import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";

import { Form, Field } from "src/components/hook-form";
import authService from "src/api/services/auth.service";

const SetPasswordSchema = zod.object({
  email: zod.string().min(1, "Email is required").email("Enter a valid email"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: zod.string().min(6, "Please confirm your password"),
}).refine((vals) => vals.password === vals.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SetPasswordForm = zod.infer<typeof SetPasswordSchema>;

export default function SetPasswordView() {
  const router = useRouter();
  const params = useSearchParams();

  const prefillEmail = params.get("email") || "";
  // If you later add invite tokens:
  // const inviteToken = params.get("token") || "";

  const methods = useForm<SetPasswordForm>({
    resolver: zodResolver(SetPasswordSchema),
    defaultValues: { email: prefillEmail, password: "", confirmPassword: "" },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    setValue,
  } = methods;

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useMemo(() => {
    if (prefillEmail) setValue("email", prefillEmail);
  }, [prefillEmail, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    setErrorMsg("");
    try {
      const res = await authService.setPassword({
        email: data.email,
        password: data.password,
        // invite_token: inviteToken,
      });

      const apiErrorMessage =
        (res as any)?.error?.payload?.message ||
        (res as any)?.error?.message ||
        (res as any)?.message;

      if (!res || (res as any)?.success !== true) {
        setErrorMsg(
          apiErrorMessage || "Failed to set password. Please try again."
        );
        return;
      }

      setSuccessMsg(
        (res as any)?.message ||
          "Password set successfully. You can now sign in."
      );
      // Give the user a moment to read, then go to login with email prefilled
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(data.email)}&set=ok`);
      }, 800);
    } catch (e: any) {
      console.error(e);
      const apiErrorMessage =
        e?.error?.payload?.message ||
        e?.payload?.message ||
        e?.message ||
        "Failed to set password. Please try again.";

      setErrorMsg(apiErrorMessage);
    }
  });

  return (
    <>
      <Stack spacing={1.5} sx={{ mb: 5 }}>
        <Typography variant="h5">Set your password</Typography>
        <Typography variant="body2" color="text.secondary">
          This activates your account from the invite.
        </Typography>
      </Stack>

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
          <Field.Text name="email" label="Email address" InputLabelProps={{ shrink: true }} />
          <Field.Text
            name="password"
            label="New password"
            type="password"
            placeholder="Enter a strong password"
            InputLabelProps={{ shrink: true }}
          />
          <Field.Text
            name="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="Re-enter your password"
            InputLabelProps={{ shrink: true }}
          />
          <LoadingButton
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Setting..."
          >
            Set password
          </LoadingButton>
        </Stack>
      </Form>
    </>
  );
}
