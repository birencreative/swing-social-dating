"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Drawer,
  TextField,
  IconButton,
  Fade,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  sharedDrawerProps,
  headerHeight,
  yourTextFieldSx,
  VerificationCodeInput,
  FloatingSaveBtn,
} from "./SharedHelper";

const EmailDrawer = ({ open, onClose, profileId, currentEmail, username, onSuccess, onNotify }: any) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [localCode, setLocalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const startTimer = () => {
    setTimer(60);
    setIsTimerActive(true);
  };

  const handleSendCode = async (email: string) => {
    setError("");
    setLoading(true);
    try {
      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      setLocalCode(generatedCode);
      const res = await fetch("/api/user/email/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, code: generatedCode })
      });
      if (!res.ok) throw new Error("Failed to send Email code.");
      onNotify("Verification code sent to your email!", "info");
      startTimer();
      setStep(2);
    } catch (e: any) {
      setError(e.message);
      onNotify(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      otp: "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Please enter a valid email address")
        .required("Email is required")
        .notOneOf([currentEmail], "New email must be different from current email"),
      otp: step === 2 ? Yup.string().required("Confirmation code is required") : Yup.string(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      if (step === 1) {
        await handleSendCode(values.email);
      } else {
        if (values.otp !== localCode) {
          setError("Invalid code");
          setSubmitting(false);
          return;
        }
        setError("");
        setLoading(true);
        try {
          const resUpdate = await fetch("/api/user/update-contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ProfileId: profileId, type: "email", value: values.email })
          });
          const updateData = await resUpdate.json();
          if (!resUpdate.ok) throw new Error(updateData.message || "Failed to update email.");

          onSuccess(values.email);
        } catch (e: any) {
          setError(e.message);
          onNotify(e.message, "error");
        } finally {
          setLoading(false);
        }
      }
      setSubmitting(false);
    }
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setError("");
      setTimer(0);
      setIsTimerActive(false);
      formik.resetForm({ values: { email: "", otp: "" } });
    }
  }, [open]);

  return (
    <Drawer open={open} onClose={onClose} {...sharedDrawerProps}>
      <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
        <Box sx={{ height: headerHeight, display: "flex", alignItems: "center", justifyContent: "space-between", px: 1 }}>
          <Box sx={{ width: 40 }} />
          <Box sx={{ display: "flex", justifyContent: "center", flex: 1 }}>
            <Box sx={{ width: 48, height: 5, borderRadius: 99, background: "linear-gradient(90deg, #FF2D55, #7000FF)", mt: 0.5, opacity: 0.6 }} />
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white", width: 40 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ background: "linear-gradient(90deg, #FF2D55, #7000FF)", height: "2px", border: "none" }} />

        <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2 }}>
          <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 4 }}>Contact Info</Typography>

          <Box component="form" onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              label="Current Email"
              value={currentEmail || "Not set"}
              InputProps={{ readOnly: true }}
              sx={{ ...yourTextFieldSx, opacity: 0.7, mb: 2 }}
            />

            <TextField
              fullWidth
              label="New Email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={step === 2}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && typeof formik.errors.email === "string" && formik.errors.email}
              sx={yourTextFieldSx}
            />

            {step === 2 && (
              <Fade in={step === 2}>
                <Box sx={{ mt: 2 }}>
                  <Typography align="center" sx={{ color: "rgba(255,255,255,0.7)", mb: 1, fontSize: "0.9rem" }}>
                    Please enter the 4-digit code sent to your email
                  </Typography>
                  <VerificationCodeInput
                    value={formik.values.otp}
                    onChange={(val: string) => formik.setFieldValue("otp", val)}
                    error={formik.touched.otp && Boolean(formik.errors.otp)}
                  />
                  {formik.touched.otp && formik.errors.otp && (
                    <Typography align="center" sx={{ color: "#ff4d6d", fontSize: "0.75rem", mt: -2, mb: 2 }}>
                      {formik.errors.otp}
                    </Typography>
                  )}

                  <Box sx={{ textAlign: "center", mt: 1, mb: 2 }}>
                    {timer > 0 ? (
                      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                        Resend code in {timer}s
                      </Typography>
                    ) : (
                      <Button
                        onClick={() => handleSendCode(formik.values.email)}
                        disabled={loading}
                        sx={{
                          color: "#ff2d86",
                          textTransform: "none",
                          fontWeight: 600,
                          "&:hover": { background: "transparent", opacity: 0.8 }
                        }}
                      >
                        Resend Email
                      </Button>
                    )}
                  </Box>
                </Box>
              </Fade>
            )}

            {step === 1 && (
              <Box sx={{ mt: 1, mb: 4, px: 2 }}>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    textAlign: "center",
                  }}
                >
                  If you enter a new email, a 4-digit verification code will be sent to your email.
                  Your email will be updated only after successful verification.
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(255, 75, 75, 0.7)",
                    fontSize: "0.82rem",
                    mt: 1.5,
                    textAlign: "center",
                    fontWeight: 600,
                    fontStyle: "italic"
                  }}
                >
                  Note: If you don&apos;t receive the email, please check your spam or junk folder.
                </Typography>
              </Box>
            )}

            {error && <Typography sx={{ color: "#ff4d6d", fontSize: "16px", fontWeight: "600", mb: 2, textAlign: "center" }}>{error}</Typography>}

            <Box sx={{ mt: 4, mb: 2, display: "flex", justifyContent: "center" }}>
              <FloatingSaveBtn
                onClick={formik.handleSubmit}
                loading={loading}
                label={step === 1 ? "Send Code" : "Verify & Update"}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default EmailDrawer;
