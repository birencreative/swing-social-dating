"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Alert,
  Divider,
  Chip,
  FormHelperText,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";

const affiliatePaymentSchema = Yup.object({
  payoutMethod: Yup.string()
    .oneOf(["paypal", "ach"])
    .required("Please select a payout method"),

  paypalEmail: Yup.string().when("payoutMethod", {
    is: "paypal",
    then: (schema) => schema.email("Invalid email").required("PayPal email is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  achBankName: Yup.string().when("payoutMethod", {
    is: "ach",
    then: (schema) => schema.min(2, "Bank name required").required("Bank name is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  achAccountType: Yup.string().when("payoutMethod", {
    is: "ach",
    then: (schema) => schema.oneOf(["checking", "savings"]).required("Account type is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  achRoutingNumber: Yup.string().when("payoutMethod", {
    is: "ach",
    then: (schema) =>
      schema
        .matches(/^\d{9}$/, "Routing number must be 9 digits")
        .required("Routing number is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  achAccountNumber: Yup.string().when("payoutMethod", {
    is: "ach",
    then: (schema) =>
      schema
        .matches(/^\d{4,17}$/, "Invalid account number")
        .required("Account number is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  yourName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .matches(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .required("Your name is required"),

  email: Yup.string().email("Invalid email").required("Email is required"),
});



const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    borderRadius: "12px",
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

    // 🔴 ERROR STATE (important)
    "&.Mui-error fieldset": {
      borderColor: "#ff4d6d",
      boxShadow: "0 0 0 1px rgba(255,77,109,0.25)",
    },

    "& input": {
      padding: "16px",
      fontSize: "15px",

      "&::placeholder": {
        fontSize: "14px",
        opacity: 0.7,
      },
    },
  },

  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.6)",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#ff2d86",
  },

  // 🔴 ERROR TEXT STYLE (KEY FIX)
  "& .MuiFormHelperText-root": {
    marginLeft: "4px", // aligns nicely with input
    marginTop: "6px",
    fontSize: "12px",
    lineHeight: 1.4,
    textAlign: "left",
  },

  "& .MuiFormHelperText-root.Mui-error": {
    color: "#ff4d6d", // softer modern red
    fontWeight: 400,
  },
} as const;

const phoneFieldSx = {
  "& .react-tel-input": {
    width: "100%",
  },
  "& .react-tel-input .form-control": {
    width: "100%",
    height: "56px",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "white",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    fontSize: "16px",
    paddingLeft: "58px",
    transition: "border-color 0.2s ease",
  },
  "& .react-tel-input .form-control:hover": {
    borderColor: "rgba(255,255,255,0.4)",
  },
  "& .react-tel-input .form-control:focus": {
    outline: "none",
    borderColor: "rgba(255,255,255,0.4)",
  },
  "& .react-tel-input .flag-dropdown": {
    background: "transparent",
    border: "none",
    borderRadius: "12px 0 0 12px",
  },
  "& .react-tel-input .selected-flag": {
    background: "transparent",
  },
  "& .react-tel-input .selected-flag:hover": {
    background: "rgba(255,255,255,0.08)",
  },
  "& .react-tel-input .country-list": {
    backgroundColor: "#11111b",
    color: "white",
    borderRadius: "12px",
  },
};

const SuccessOverlay = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            style={{
              background: "rgba(20, 10, 35, 0.85)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 24,
              padding: "40px 32px",
              textAlign: "center",
              color: "white",
              maxWidth: 420,
              width: "90%",
            }}
          >
            {/* Floating Heart */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: 42, marginBottom: 14 }}
            >
              💖
            </motion.div>

            {/* Title */}
            <Typography variant="h5" fontWeight={800} mb={1}>
              Payment Request Sent
            </Typography>

            {/* Main Message */}
            <Typography
              variant="body1"
              sx={{
                opacity: 0.95,
                mb: 1.5,
                lineHeight: 1.6,
              }}
            >
              Your affiliate payout request has been submitted successfully.
            </Typography>

            {/* Reassurance Message */}
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                lineHeight: 1.6,
                mb: 3,
              }}
            >
              We’ll review your request and send updates to your
              <strong> entered email address</strong>.
              <br />
              Please keep an eye on your inbox 💌
            </Typography>

            {/* Done Button */}
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                px: 5,
                py: 1.2,
                fontWeight: 700,
                borderRadius: 99,
                textTransform: "none",
                background: "white",
                color: "#ff006e",
                minWidth: 140,
                "&:hover": {
                  background: "#ffe3ef",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.25s ease",
              }}
            >
              Got it 💕
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AffiliatePaymentProps {
  profileId: string;
  affiliateCode: string | null;
}

const formatEarningsFromApi = (val: string | number | undefined | null) => {
  if (val === undefined || val === null) return "$0.00";
  const s = typeof val === "string" ? val : String(val);
  const n = Number(s);
  if (isNaN(n)) return "$0.00";
  if (n > 1000) {
    return `$${(n / 100).toFixed(2)}`;
  } else {
    return `$${n.toFixed(2)}`;
  }
};

const parseAmount = (val: string) => {
  const n = Number(val.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};

const AffiliatePayment = ({
  profileId,
  affiliateCode,
}: AffiliatePaymentProps) => {
  const [submitStatus, setSubmitStatus] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!affiliateCode) return;
    const fetchAffiliate = async () => {
      try {
        setLoading(true);
        setError(null);

        const getRes = await fetch("/api/user/get-affiliate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateCode: affiliateCode,
            limit: 300,
          }),
        });

        const data = await getRes.json();

        if (!getRes.ok) {
          throw new Error(data?.message || "Failed to fetch affiliate data");
        }

        setAffiliateData(data?.stats?.total_earnings);
      } catch (err: any) {
        console.error("Affiliate fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        if (!profileId) return;
        const res = await fetch(`/api/user/affiliate/payout-history?profileId=${profileId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setPayoutHistory(data.history || []);
        }
      } catch (err) {
        console.error("Failed to load payout history:", err);
      }
    };

    fetchAffiliate();
    fetchHistory();
  }, [affiliateCode, profileId]);

  const formik = useFormik({
    initialValues: {
      affiliateId: affiliateCode ? affiliateCode : "-",
      minThreshold: "$50",
      yourName: "",
      email: "",
      payoutMethod: "paypal",
      paypalEmail: "",
      achBankName: "",
      achAccountType: "checking",
      achRoutingNumber: "",
      achAccountNumber: "",
    },
    validationSchema: affiliatePaymentSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { resetForm }) => {
      try {
        setSubmitStatus("submitting");
        setIsLocked(true);

        const res = await fetch("/api/user/affiliate/request-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...values,
            profileId,
            affiliateCode,
            totalAmount: parseAmount(formatEarningsFromApi(affiliateData)),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Request failed");
        }

        // Trigger automatic payout execution
        if (data.requestId) {
          try {
            const currentEarnings = parseAmount(formatEarningsFromApi(affiliateData));
            const execRes = await fetch("/api/admin/affiliate/execute-payout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                requestId: data.requestId,
                // totalAmount: currentEarnings,
                totalAmount: 1,
              }),
            });

            const execData = await execRes.json();
            if (!execRes.ok || !execData.success) {
              console.error("Auto execute-payout failed:", execData);
            } else {
              console.log("Payout successfully auto-executed:", execData);
            }
          } catch (execErr) {
            console.error("Failed to call execute-payout auto-trigger:", execErr);
          }
        }

        setSubmitStatus("success");
        setTimeout(() => {
          setShowSuccess(true);
          resetForm();
          setSubmitStatus("");
          setIsLocked(false);
        }, 800);
      } catch (error: any) {
        console.error("Affiliate payout error:", error);

        setApiError(error.message || "Something went wrong");
        setSubmitStatus("error");
        setIsLocked(false);
      }
    },
  });



  const MIN_PAYOUT = 50;

  const totalIncomeFormatted = formatEarningsFromApi(affiliateData);
  const totalIncomeNumber = parseAmount(totalIncomeFormatted);

  const hasReachedMinThreshold = totalIncomeNumber >= MIN_PAYOUT;

  const formatDateTime = (isoDate: any) => {
    if (!isoDate) return "-";

    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };


  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: { xs: 8, md: 0 },
      }}
    >
      <SuccessOverlay
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.1)" }} />
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            background:
              "linear-gradient(135deg, #ff5fa2 0%, #ff2f92 50%, #ff006e 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 4px 18px rgba(255, 0, 110, 0.35)",
            mb: 1,
            fontSize: { xs: "1.75rem", md: "2.125rem" },
            textAlign: "center",
          }}
        >
          Payment Information
        </Typography>

        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            color: "rgba(255, 180, 210, 0.9)",
            letterSpacing: "0.3px",
          }}
        >
          Complete your affiliate payout details
        </Typography>
      </Box>

      <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.1)" }} />

      <Paper
        sx={{
          p: 2,
          mb: 4,
          bgcolor: "rgba(219, 68, 55, 0.1)",
          border: "1px solid rgba(219, 68, 55, 0.3)",
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              Affiliate ID
            </Typography>
            <Typography variant="h6" sx={{ color: "#ff4081", fontWeight: 600 }}>
              {formik.values.affiliateId}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              Minimum Payment Threshold
            </Typography>
            <Typography variant="h6" sx={{ color: "#ff4081", fontWeight: 600 }}>
              {formik.values.minThreshold}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        sx={{
          p: 2,
          mb: 4,
          bgcolor: hasReachedMinThreshold
            ? "rgba(156, 39, 176, 0.12)"
            : "rgba(233, 30, 99, 0.12)",
          border: "1px solid",
          borderColor: hasReachedMinThreshold
            ? "rgba(156, 39, 176, 0.4)"
            : "rgba(233, 30, 99, 0.4)",
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.8)" }}
            >
              Total Earnings
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: hasReachedMinThreshold ? "#ab47bc" : "#f50057",
              }}
            >
              {totalIncomeFormatted}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            {hasReachedMinThreshold ? (
              <Alert
                severity="success"
                sx={{
                  bgcolor: "rgba(156, 39, 176, 0.15)",
                  color: "#e1bee7",
                }}
              >
                You're eligible to request a payout 💝
              </Alert>
            ) : (
              <Alert
                severity="warning"
                sx={{
                  bgcolor: "rgba(233, 30, 99, 0.15)",
                  color: "#f8bbd9",
                }}
              >
                You need{" "}
                <strong>
                  ${Math.max(MIN_PAYOUT - totalIncomeNumber, 0).toFixed(2)}
                </strong>{" "}
                more to reach the minimum payout of ${MIN_PAYOUT}
              </Alert>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ position: "relative" }}>
        {!hasReachedMinThreshold && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "start",
              justifyContent: "center",
              top: 40,
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            <Paper
              sx={{
                px: 4,
                py: 3,
                borderRadius: 3,
                bgcolor: "rgba(20,20,30,0.75)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)",
                textAlign: "center",
                maxWidth: 360,
              }}
            >
              <Typography variant="h6" sx={{ color: "white", fontWeight: 700 }}>
                Payout Not Available Yet
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.8)", mt: 1 }}
              >
                Your earnings haven’t reached the minimum payout threshold.
                <br />
                Earn{" "}
                <strong>
                  ${(MIN_PAYOUT - totalIncomeNumber).toFixed(2)}
                </strong>{" "}
                more to unlock the payout request.
              </Typography>
            </Paper>
          </Box>
        )}

        <Box
          sx={{
            filter: !hasReachedMinThreshold ? "blur(6px)" : "none",
            pointerEvents: !hasReachedMinThreshold ? "none" : "auto",
            opacity: !hasReachedMinThreshold ? 0.6 : 1,
            transition: "all 0.3s ease",
          }}
        >
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Payout Method */}
              <Grid item xs={12}>
                <Typography
                  variant="body1"
                  sx={{ color: "white", mb: 1, fontWeight: 500 }}
                >
                  Payout Method
                </Typography>

                <RadioGroup
                  row
                  name="payoutMethod"
                  value={formik.values.payoutMethod}
                  onChange={formik.handleChange}
                  sx={{ gap: 2 }}
                >
                  {[
                    { value: "paypal", label: "PayPal" },
                    { value: "ach", label: "Direct Deposit (ACH)" },
                  ].map((option) => {
                    const selected = formik.values.payoutMethod === option.value;
                    return (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio sx={{ display: "none" }} />}
                        sx={{ m: 0 }}
                        label={
                          <Box
                            sx={{
                              minWidth: 160,
                              textAlign: "center",
                              px: 3,
                              py: 1.5,
                              borderRadius: 2,
                              cursor: "pointer",
                              fontWeight: 600,
                              color: selected ? "#ff5fa2" : "white",
                              border: "1px solid",
                              borderColor: selected
                                ? "#ff5fa2"
                                : "rgba(255,255,255,0.25)",
                              backgroundColor: selected
                                ? "rgba(255,95,162,0.12)"
                                : "transparent",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: "#ff5fa2",
                              },
                            }}
                          >
                            {option.label}
                          </Box>
                        }
                      />
                    );
                  })}
                </RadioGroup>
              </Grid>

              {/* PayPal Fields */}
              {formik.values.payoutMethod === "paypal" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="PayPal Email Address"
                    name="paypalEmail"
                    type="email"
                    value={formik.values.paypalEmail}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.paypalEmail && Boolean(formik.errors.paypalEmail)
                    }
                    helperText={
                      formik.touched.paypalEmail && formik.errors.paypalEmail
                    }
                    sx={textFieldSx}
                  />
                </Grid>
              )}

              {/* ACH Fields */}
              {formik.values.payoutMethod === "ach" && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      label="Bank Name"
                      name="achBankName"
                      value={formik.values.achBankName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.achBankName && Boolean(formik.errors.achBankName)
                      }
                      helperText={
                        formik.touched.achBankName && formik.errors.achBankName
                      }
                      sx={textFieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.6)", mb: 0.5, pl: 1 }}
                    >
                      Account Type
                    </Typography>
                    <RadioGroup
                      row
                      name="achAccountType"
                      value={formik.values.achAccountType}
                      onChange={formik.handleChange}
                      sx={{ gap: 2, pl: 1, mt: 0.5 }}
                    >
                      <FormControlLabel
                        value="checking"
                        control={<Radio sx={{ color: "rgba(255,255,255,0.5)", "&.Mui-checked": { color: "#ff2d86" } }} />}
                        label={<Typography sx={{ color: "white" }}>Checking</Typography>}
                      />
                      <FormControlLabel
                        value="savings"
                        control={<Radio sx={{ color: "rgba(255,255,255,0.5)", "&.Mui-checked": { color: "#ff2d86" } }} />}
                        label={<Typography sx={{ color: "white" }}>Savings</Typography>}
                      />
                    </RadioGroup>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      label="Routing Number"
                      name="achRoutingNumber"
                      value={formik.values.achRoutingNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.achRoutingNumber && Boolean(formik.errors.achRoutingNumber)
                      }
                      helperText={
                        formik.touched.achRoutingNumber && formik.errors.achRoutingNumber
                      }
                      sx={textFieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      label="Account Number"
                      name="achAccountNumber"
                      value={formik.values.achAccountNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.achAccountNumber && Boolean(formik.errors.achAccountNumber)
                      }
                      helperText={
                        formik.touched.achAccountNumber && formik.errors.achAccountNumber
                      }
                      sx={textFieldSx}
                    />
                  </Grid>
                </>
              )}

              {/*Your Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Your Name"
                  name="yourName"
                  value={formik.values.yourName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.yourName && Boolean(formik.errors.yourName)
                  }
                  helperText={formik.touched.yourName && formik.errors.yourName}
                  sx={textFieldSx}
                />
              </Grid>

              {/* Email Address */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={
                    formik.touched.email && formik.errors.email
                      ? formik.errors.email
                      : "We’ll send payout confirmations and updates to this email"
                  }
                  sx={{
                    ...textFieldSx,
                    "& .MuiFormHelperText-root": {
                      color:
                        formik.touched.email && formik.errors.email
                          ? "#f44336"
                          : "rgba(255,180,210,0.85)",
                      fontSize: "0.75rem",
                      mt: 0.5,
                    },
                  }}
                />
              </Grid>
            </Grid>

            {submitStatus && (
              <Box sx={{ mt: 3 }}>
                {submitStatus === "success" && (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Payment request submitted successfully!
                  </Alert>
                )}
                {submitStatus === "error" && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {apiError || "An error occurred. Please try again."}
                  </Alert>
                )}
              </Box>
            )}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
              <Button
                type="submit"
                size="large"
                variant="contained"
                disabled={submitStatus === "submitting" || isLocked}
                sx={{
                  px: 6,
                  py: 1.5,
                  borderRadius: "14px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  textTransform: "none",
                  color: "#fff",
                  background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    opacity: 0.9,
                    transform: "translateY(-1px)",
                  },
                  "&:active": { transform: "translateY(0)" },
                  "&.Mui-disabled": {
                    background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                    opacity: 0.5,
                    color: "#fff",
                  },
                }}
              >
                {submitStatus === "submitting"
                  ? "Processing..."
                  : "Request Payout"}
              </Button>

              {!formik.isValid && formik.submitCount > 0 && (
                <Typography
                  variant="body2"
                  sx={{ color: "#ff4d8d", textAlign: "center", mt: 2 }}
                >
                  Please fix the errors above before submitting
                </Typography>
              )}
            </Box>
          </form>

          {/* Payout History Section */}
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" sx={{ color: "white", mb: 3, fontWeight: 700 }}>
              Payout History
            </Typography>
            <TableContainer component={Paper} sx={{ backgroundColor: "rgba(255,255,255,0.04)", backdropFilter: "blur(6px)", borderRadius: "12px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Date</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Amount</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Method</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Status</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Transaction ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ color: "white", textAlign: "center", py: 4, borderBottom: "none" }}>
                        No past payouts yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payoutHistory.map((row) => (
                      <TableRow key={row.Id || row.TransactionId}>
                        <TableCell sx={{ color: "white", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          {formatDateTime(row.CreatedAt)}
                        </TableCell>
                        <TableCell sx={{ color: "white", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: 600 }}>
                          ${Number(row.Amount).toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: "white", borderBottom: "1px solid rgba(255,255,255,0.05)", textTransform: "capitalize" }}>
                          {row.PayoutMethod}
                        </TableCell>
                        <TableCell sx={{ color: "white", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <Chip label={row.Status} size="small" sx={{
                            backgroundColor: row.Status === "paid" ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 152, 0, 0.2)",
                            color: row.Status === "paid" ? "#4caf50" : "#ff9800",
                            textTransform: "capitalize",
                            fontWeight: 600
                          }} />
                        </TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
                          {row.TransactionId}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AffiliatePayment;
