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
  FormHelperText,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  sharedDrawerProps,
  headerHeight,
  yourTextFieldSx,
  VerificationCodeInput,
  FloatingSaveBtn,
} from "./SharedHelper";

const PhoneDrawer = ({ open, onClose, profileId, currentPhone, onSuccess, onNotify }: any) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [verificationId, setVerificationId] = useState("");
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

  const handleSendCode = async (phone: string, countryCode: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, countryCode: countryCode.replace('+', '') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send SMS code.");
      if (data.data?.verificationId) setVerificationId(data.data.verificationId);
      onNotify("SMS verification code sent!", "info");
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
      phone: "",
      countryCode: "+1",
      otp: "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      phone: Yup.string()
        .matches(/^[0-9]{10}$/, "Please enter a valid phone number (10 digits)")
        .required("Phone is required")
        .test("different-phone", "New phone number must be different from current phone number", function (value) {
          const { countryCode } = this.parent;
          const normalizedNewFull = ((countryCode || "") + (value || "")).replace(/\D/g, "");
          const normalizedCurrent = currentPhone ? currentPhone.replace(/\D/g, "") : "";
          const normalizedNewLocal = (value || "").replace(/\D/g, "");
          return normalizedNewFull !== normalizedCurrent && normalizedNewLocal !== normalizedCurrent;
        }),
      otp: step === 2 ? Yup.string().required("Confirmation code is required") : Yup.string(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      if (step === 1) {
        await handleSendCode(values.phone, values.countryCode);
      } else {
        setError("");
        setLoading(true);
        try {
          const formattedCountryCode = values.countryCode.replace('+', '');
          const res = await fetch(`/api/user/otp?countryCode=${formattedCountryCode}&mobileNumber=${values.phone}&verificationId=${verificationId}&code=${values.otp}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Invalid code");

          const resUpdate = await fetch("/api/user/update-contact", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ProfileId: profileId, type: "phone", value: values.phone, countryCode: formattedCountryCode })
          });
          const updateData = await resUpdate.json();
          if (!resUpdate.ok) throw new Error(updateData.message || "Failed to update phone number.");

          onSuccess(values.phone);
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
      formik.resetForm();
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
              label="Current Phone"
              value={currentPhone || "Not set"}
              InputProps={{ readOnly: true }}
              sx={{ ...yourTextFieldSx, opacity: 0.7, mb: 2 }}
            />

            <Box sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: "white",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
              },
              "& .MuiInputLabel-root": { display: "none" },
              "& .react-tel-input .form-control": {
                width: "100%", height: "56px", backgroundColor: "rgba(255,255,255,0.05)", color: "white", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)",
              },
              "& .react-tel-input .flag-dropdown": { border: "none", backgroundColor: "transparent", color: "#000" },
            }}>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", mb: 0.5, ml: "4px" }}>New Phone Number</Typography>
              <PhoneInput
                country={"us"}
                enableSearch={true}
                searchPlaceholder="Search country..."
                searchClass="country-search-input"
                dropdownClass="country-dropdown"
                value={formik.values.countryCode + formik.values.phone}
                onChange={(value, country) => {
                  const c = country as CountryData;
                  formik.setFieldValue("countryCode", `+${c.dialCode}`);
                  const numberWithoutCode = value.replace(c.dialCode, "");
                  formik.setFieldValue("phone", numberWithoutCode);
                }}
                inputProps={{ name: "phone", required: true }}
                specialLabel=""
              />
              {formik.touched.phone && formik.errors.phone && (
                <FormHelperText sx={{ color: "#ff4d6d", fontSize: "12px", mt: 0.5, ml: "4px", textAlign: "left" }}>
                  {formik.errors.phone}
                </FormHelperText>
              )}
            </Box>

            {step === 2 && (
              <Fade in={step === 2}>
                <Box sx={{ mt: 2 }}>
                  <Typography align="center" sx={{ color: "rgba(255,255,255,0.7)", mb: 1, fontSize: "0.9rem" }}>
                    Please enter the 4-digit code sent to your mobile
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
                      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>Resend code in {timer}s</Typography>
                    ) : (
                      <Button onClick={() => handleSendCode(formik.values.phone, formik.values.countryCode)} disabled={loading} sx={{ color: "#ff2d86", textTransform: "none", fontWeight: 600, "&:hover": { background: "transparent", opacity: 0.8 } }}>
                        Resend Code
                      </Button>
                    )}
                  </Box>
                </Box>
              </Fade>
            )}

            {step === 1 && (
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", mt: 1, mb: 4, lineHeight: 1.5, textAlign: "center", px: 2 }}>
                If you enter a new phone number, a verification code will be sent to your mobile.
                Your number will be updated only after successful verification.
              </Typography>
            )}

            <Box sx={{ mt: 4, mb: 2, display: "flex", justifyContent: "center" }}>
              <FloatingSaveBtn onClick={formik.handleSubmit} loading={loading} label={step === 1 ? "Send Code" : "Verify & Update"} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default PhoneDrawer;
