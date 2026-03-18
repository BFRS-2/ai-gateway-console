"use client";

import { z as zod } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";

import { RouterLink } from "src/routes/components";

import { Form, Field } from "src/components/hook-form";
import authService from "src/api/services/auth.service";

const ForgotPasswordSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: "Email is required!" })
    .email({ message: "Email must be a valid email address!" }),
});

type ForgotPasswordForm = zod.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordView() {
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const methods = useForm<ForgotPasswordForm>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const res = await authService.forgotPassword({ email: normalizedEmail });

      const apiErrorMessage =
        (res as any)?.error?.payload?.data?.message ||
        (res as any)?.error?.payload?.message ||
        (res as any)?.error?.message ||
        (res as any)?.data?.message ||
        (res as any)?.message;

      if (!res || (res as any)?.success === false || (res as any)?.error) {
        setErrorMsg(
          apiErrorMessage || "Failed to submit forgot password request."
        );
        return;
      }

      setSuccessMsg(
        (res as any)?.data?.message ||
          (res as any)?.message ||
          "Request submitted successfully."
      );
    } catch (e: any) {
      console.error(e);
      const apiErrorMessage =
        e?.error?.payload?.data?.message ||
        e?.error?.payload?.message ||
        e?.payload?.message ||
        e?.data?.message ||
        e?.message ||
        "Failed to submit forgot password request.";

      setErrorMsg(apiErrorMessage);
    }
  });

  return (
    <>
      <Stack spacing={1.5} sx={{ mb: 5 }}>
        <Typography variant="h5">Forgot your password?</Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your registered email address to receive a password reset link. The link will remain valid for 10 minutes.
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
          <Field.Text
            name="email"
            label="Email address"
            InputLabelProps={{ shrink: true }}
          />

          <Stack direction="row" spacing={0.5}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Remembered it?
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
            loadingIndicator="Submitting..."
          >
            Send reset link
          </LoadingButton>
        </Stack>
      </Form>
    </>
  );
}
