"use client";

import React, { useState, useEffect, Suspense, memo, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  Container,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import "react-toastify/dist/ReactToastify.css";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ParticleField from "@/components/ParticleField";

const theme = createTheme({
  palette: {
    primary: { main: "#FF2D55", light: "#FF617B", dark: "#CC1439" },
    secondary: { main: "#7000FF", light: "#9B4DFF", dark: "#5200CC" },
    success: { main: "#00D179" },
    background: { default: "#0A0118" },
  },
});

const validationSchema = Yup.object({
  otp: Yup.array()
    .of(
      Yup.string()
        .matches(/^[0-9]$/, "Must be a digit")
        .required("Required"),
    )
    .min(4, "Must be 4 digits")
    .max(4, "Must be 4 digits"),
});

export default function Otp({
  params,
}: {
  params: Promise<{ idEmail: string; countryCode?: string }>;
}) {
  const { idEmail, countryCode } = React.use(params);
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpData, setOtpData] = useState<{
    verificationId: string;
    mobileNumber: string;
    responseCode: string;
    timeout: string;
    transactionId: string;
  } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (phone) {
      handleVerificationPhone(phone);
    }
  }, [phone]);

  useEffect(() => {
    const storedPhone = localStorage.getItem("phone");

    if (storedPhone) {
      setPhone(storedPhone);
    }
    setId(localStorage.getItem("logged_in_profile") || idEmail);
  }, [idEmail, countryCode]);

  const formik = useFormik({
    initialValues: { otp: ["", "", "", ""] },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      console.log("otpData.", otpData);
      try {
        const enteredCode = values.otp.join("");
        const res = await fetch(
          `/api/user/otp?countryCode=${countryCode}&mobileNumber=${phone}&verificationId=${otpData?.verificationId}&code=${enteredCode}`,
          { method: "GET" },
        );

        const data = await res.json();

        if (
          res.ok &&
          (data?.responseCode === 200 || data?.responseCode === "200") &&
          data?.message === "SUCCESS" &&
          data?.data?.verificationStatus === "VERIFICATION_COMPLETED"
        ) {
          await fetch("/api/user/savestatus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: 1 }),
          });
          setMessage({ text: "OTP Verified Successfully", type: "success" });
          router.replace(`/intrested/${id}`);
          localStorage.removeItem("phone");
        } else {
          setError(true);
          setTimeout(() => {
            setError(false);
            formik.setFieldValue("otp", ["", "", "", ""]);
          }, 3000);
        }
      } catch (error) {
        console.error("OTP verification failed:", error);
        setError(true);
      }
      setLoading(false);
    },
  });

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...formik.values.otp];
    newOtp[index] = value.slice(-1);
    formik.setFieldValue("otp", newOtp);

    if (value && index < newOtp.length - 1) {
      // Move to next input
      const nextInput = document.getElementById(
        `otp-${index + 1}`,
      ) as HTMLInputElement;
      nextInput?.focus();
    }

    // ✅ Last digit entered — blur to dismiss keyboard
    if (value && index === newOtp.length - 1) {
      const lastInput = document.getElementById(
        `otp-${index}`,
      ) as HTMLInputElement;
      lastInput?.blur();

      // ✅ Auto-submit if all digits filled
      const allFilled = newOtp.every((d) => d !== "");
      if (allFilled) {
        formik.handleSubmit();
      }
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (event.key === "Backspace" && !formik.values.otp[index] && index > 0) {
      const prevInput = document.getElementById(
        `otp-${index - 1}`,
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleVerificationPhone = async (mobile: string) => {
    if (!mobile) {
      setMessage({
        text: "Phone number not found. Please try again.",
        type: "error",
      });
      return;
    }

    try {
      const res = await fetch("/api/user/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mobile,
          countryCode: countryCode,
        }),
      });

      if (!res.ok) throw new Error("Failed to send OTP");

      const data = await res.json();
      setResendTimer(65);
      setOtpData(data?.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  return (
    <>
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
            width: "100%",
            minHeight: "100vh",
            background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
          }}
        >
          <ParticleField />
          <Container
            maxWidth="sm"
            sx={{ px: { xs: 0, sm: 0, md: 0 }, py: { xs: 0, sm: 0 } }}
          >
            <Paper
              elevation={24}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
                // backdropFilter: "blur(25px)",
                color: "#fff",
                overflow: "visible",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  mt: 2,
                }}
              >
                <Grid
                  container
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    padding: "16px",
                  }}
                >
                  {/* Heading */}
                  <Grid item xs={12} textAlign="center">
                    <Typography
                      variant="h5"
                      sx={{
                        color: "#fff",
                        fontWeight: "bold",
                        mb: 1,
                        fontSize: { xs: "1.4rem", sm: "1.6rem" },
                      }}
                    >
                      Verify your phone number
                    </Typography>

                    {phone && (
                      <Typography
                        sx={{
                          color: "#c2185b",
                          fontWeight: "600",
                          mb: 3,
                          fontSize: { xs: "1rem", sm: "1.05rem" },
                        }}
                      >
                        Code sent via SMS to <br />
                        <span style={{ color: "#fff" }}>{phone}</span>
                      </Typography>
                    )}
                  </Grid>

                  {/* OTP Input */}
                  <Grid item xs={12} sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        flexWrap: "nowrap",
                        gap: { xs: 1, sm: 2 },
                        mb: 4,
                        overflowX: "auto",
                      }}
                    >
                      {formik.values.otp.map((digit, index) => (
                        <TextField
                          key={index}
                          id={`otp-${index}`}
                          value={digit}
                          onChange={(e: any) =>
                            handleOtpChange(e.target.value, index)
                          }
                          onKeyDown={(e: any) => handleKeyDown(e, index)}
                          error={Boolean(formik.errors.otp?.[index])}
                          type="tel"
                          variant="outlined"
                          inputProps={{
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                            maxLength: 1,
                            style: {
                              textAlign: "center",
                              fontSize: "1.5rem",
                              color: "#fff",
                              padding: 0,
                            },
                          }}
                          sx={{
                            width: "56px",

                            "& .MuiOutlinedInput-root": {
                              borderRadius: "14px",
                              background: "rgba(255,255,255,0.04)",
                              backdropFilter: "blur(6px)",
                              transition: "all .25s ease",

                              "& fieldset": {
                                borderColor: "rgba(255,255,255,0.15)",
                              },

                              "&:hover fieldset": {
                                borderColor: "rgba(255,255,255,0.35)",
                              },

                              "&.Mui-focused fieldset": {
                                borderColor: "#ff2d86",
                                boxShadow: "0 0 0 2px rgba(255,45,134,0.25)",
                              },

                              /* optional error state */
                              "&.Mui-error fieldset": {
                                borderColor: "#ff4d6d",
                                boxShadow: "0 0 0 1px rgba(255,77,109,0.25)",
                              },
                            },

                            "& input": {
                              textAlign: "center",
                              fontSize: "1.6rem",
                              fontWeight: 600,
                              color: "#fff",
                              height: "56px",
                              padding: 0,
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Error message */}
                  {error && (
                    <Typography
                      variant="body2"
                      color="error"
                      sx={{ textAlign: "center", mb: 2 }}
                    >
                      Please input the correct verification code
                    </Typography>
                  )}

                  {message && (
                    <Box
                      sx={{
                        textAlign: "center",
                        mb: 2,
                        px: 2,
                        py: 1.2,
                        borderRadius: "8px",
                        backgroundColor:
                          message.type === "success"
                            ? "rgba(0, 209, 121, 0.15)"
                            : "rgba(255, 45, 85, 0.15)",
                        border: `1px solid ${message.type === "success" ? "#00D179" : "#FF2D55"}`,
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            message.type === "success" ? "#00D179" : "#FF2D55",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        {message.type === "success" ? "✓" : "✕"} {message.text}
                      </Typography>
                    </Box>
                  )}

                  {/* Helper text */}
                  <Grid item xs={12} sx={{ textAlign: "center", mb: 2 }}>
                    <Typography
                      sx={{
                        color: "#aaa",
                        fontSize: "0.95rem",
                        mb: 1,
                      }}
                    >
                      Didn’t receive your code? Check your network signal.
                    </Typography>
                    <Grid item xs={12} sx={{ textAlign: "center", mt: 1 }}>
                      <Button
                        variant="text"
                        startIcon={<RefreshIcon fontSize="small" />}
                        onClick={() => {
                          const storedPhone =
                            phone || localStorage.getItem("phone");

                          if (!storedPhone) {
                            setMessage({
                              text: "Phone number missing.",
                              type: "error",
                            });
                            return;
                          }

                          setMessage({
                            text: "Code resent successfully!",
                            type: "success",
                          });
                          handleVerificationPhone(storedPhone);
                        }}
                        disabled={resendTimer > 0}
                        sx={{
                          color: resendTimer > 0 ? "#aaa" : "#e4518cff",
                          fontWeight: 500,
                          fontSize: "1rem",
                          textTransform: "none",
                          textDecoration: "underline",
                          "&:hover": {
                            textDecoration: "underline",
                            backgroundColor: "transparent",
                          },
                        }}
                      >
                        {/* {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"} */}
                        {resendTimer > 0 ? (
                          <Typography
                            sx={{
                              color: "#aaa",
                              fontSize: "0.9rem",
                              textAlign: "center",
                              mb: 1,
                            }}
                          >
                            You can resend code in {resendTimer}s
                          </Typography>
                        ) : (
                          <Typography>Resend Code</Typography>
                        )}
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Submit Button */}
                  <Box
                    sx={{
                      width: "100%",
                      mt: 3,
                      mb: 1,
                    }}
                  >
                    <Button
                      fullWidth
                      type="submit"
                      disabled={loading}
                      onClick={() => formik.handleSubmit()}
                      sx={{
                        height: 56,
                        borderRadius: "14px",

                        /* FULL WIDTH BUTTON */
                        width: "100%",

                        background:
                          "linear-gradient(90deg, #FF2D6B 0%, #7C4DFF 100%)",
                        color: "#fff",

                        fontSize: "15px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,

                        "&:hover": {
                          opacity: 0.9,
                          transform: "translateY(-1px)",
                        },

                        "&:active": {
                          transform: "scale(0.98)",
                        },

                        "&:disabled": {
                          opacity: 0.4,
                        },
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={22} sx={{ color: "#fff" }} />
                      ) : (
                        <>
                          Verify Code
                          <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
                        </>
                      )}
                    </Button>
                  </Box>

                  {/* Back Button */}
                  <Box
                    sx={{
                      width: "100%",
                      textAlign: "center",
                      mb: 2,
                    }}
                  >
                    <Button
                      variant="text"
                      onClick={() => router.push("/register")}
                      sx={{
                        color: "#aaa",
                        textTransform: "none",
                        fontSize: "14px",
                        fontWeight: 500,
                        "&:hover": {
                          color: "#fff",
                          backgroundColor: "transparent",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      ← Back to Register
                    </Button>
                  </Box>

                  {/* Footer */}
                  <Grid item xs={12} sx={{ textAlign: "center", mt: 4 }}>
                    <Typography sx={{ color: "#c2185b", fontWeight: "bold" }}>
                      Come party with us
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    </>
  );
}
