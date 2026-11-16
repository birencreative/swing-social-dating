"use client";
import React, { memo, Suspense, useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  ThemeProvider,
  createTheme,
  Container,
  Paper,
  useMediaQuery,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { useRouter } from "next/navigation";
import PaymentDialog, { DialogType } from "@/components/PaymentDialog";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import Divider from "@mui/material/Divider";
import MathCaptcha from "@/components/MathCaptcha";
import * as Yup from "yup";
import { FormHelperText } from "@mui/material";

import ParticleField from "@/components/ParticleField";



type Params = Promise<{ id: string }>;

interface ReferralValidationResult {
  valid: boolean;
  affiliateCode?: string | null;
  profileId?: string | null;
  message?: string;
}

const theme = createTheme({
  palette: {
    primary: { main: "#FF2D55", light: "#FF617B", dark: "#CC1439" },
    secondary: { main: "#7000FF", light: "#9B4DFF", dark: "#5200CC" },
    success: { main: "#00D179" },
    background: { default: "#0A0118" },
  },
});

export default function Payment(props: { params: Params }) {
  const [id, setId] = useState<string>("");
  const router = useRouter();

  const [promoCode, setPromoCode] = useState<any>("");
  const [promoCodeMessage, setPromocodeMessage] = useState<any>(null);
  const [promoCodeList, setPromoCodeList] = useState<any>([]);
  const [firstMonthFree, setFirstMonthFree] = useState(false);
  const [address, setAddress] = useState<any>("");
  const [state, setState] = useState<any>("");
  const [isValidPromoCode, setValidPromoCode] = useState<any>(false);
  const [price, setPrice] = useState<any>("");
  const [plan, setPlan] = useState<any>("");
  const [unit, setUnit] = useState<any>("");
  const [email, setEmail] = useState<any>("");
  const [phone, setPhone] = useState("");
  const [userName, setUsername] = useState<any>("");
  const [password, setPassword] = useState<any>("");
  const [getAffCode, setGetAffCode] = useState<any>("");
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [perrors, setPErrors] = useState<any>({
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    qstreetAddress: "",
    qzipCode: "",
    qcity: "",
    qcountry: "",
    phone: "",
  });
  const [apiErrorMessage, setApiErrorMessage] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogDescription, setDialogDescription] = useState("");
  const [confirmText, setConfirmText] = useState("OK");
  const [cancelText, setCancelText] = useState("Cancel");
  const [dialogConfirmAction, setDialogConfirmAction] = useState<
    (() => void) | null
  >(null);
  const [showCancelButton, setShowCancelButton] = useState(true);
  const [dialogPlanName, setDialogPlanName] = useState("");
  const [dialogPlanPrice, setDialogPlanPrice] = useState("");
  const [dialogBillingCycle, setDialogBillingCycle] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>("");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [captchaExpected, setCaptchaExpected] = useState<number | null>(null);




  useEffect(() => {
    const getIdFromParam = async () => {
      const params = await props.params;
      const pid: any = params.id;
      console.log(pid);
      setId(pid);
    };
    getIdFromParam();
    handlePromoState();
  }, [props]);

  const handleChangePromoCode = (promoCodeText: string) => {
    setPromoCode(promoCodeText);
    if (promoCodeText) {
      let filter = promoCodeList.filter(
        (val: any) => val?.PromoCodeText === promoCodeText,
      );
      if (filter?.length > 0) {
        console.log(filter[0].DisplayMessage, "=====filter");
        setPromocodeMessage(filter[0]?.DisplayMessage);
        setValidPromoCode(true);
      } else {
        setPromocodeMessage("Promo Code is Invalid");
        setValidPromoCode(false);
      }
    } else {
      setPromocodeMessage(null);
      setValidPromoCode(true);
    }
  };

  const handleSubmitPromoCode = async () => {
    try {
      const response = await fetch("/api/user/promocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pid: id, promocode: promoCode }),
      });

      console.log(response);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const getLocationName = async (latitude: number, longitude: number) => {
    const apiKey = "AIzaSyBEr0k_aQ_Sns6YbIQ4UBxCUTdPV9AhdF0";

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      console.error("No results found or status not OK:", data);
      return "Unknown Location";
    } catch (error) {
      console.error("Error fetching location name:", error);
      return "Unknown Location";
    }
  };

  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = await getLocationName(latitude, longitude);
          setAddress(locationName);
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const handleGetAllPromoCodes = async () => {
    try {
      const apiUrl = `/api/user/promocode/check`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch event data");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setPromoCodeList(result.promocodes);
    } catch (error) { }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ssprice = localStorage.getItem("ssprice");
      const ssplan = localStorage.getItem("ssplan");
      const ssunit = localStorage.getItem("ssunit");
      const emailVal = localStorage.getItem("email");
      const userNameVal = localStorage.getItem("userName");
      const passwordVal = localStorage.getItem("password");
      const affCodeVal = localStorage.getItem("affiliate_code");

      setPrice(ssprice);
      setPlan(ssplan);
      setUnit(ssunit);
      setEmail(emailVal);
      setUsername(userNameVal);
      setPassword(passwordVal);
      setGetAffCode(affCodeVal);
    }
    getCurrentLocation();
    handleGetAllPromoCodes();
  }, [address]);

  const handlePhoneChange = (event: any) => {
    let value = event.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.substring(0, 10);

    if (value.length > 6) {
      value = `(${value.substring(0, 3)}) ${value.substring(
        3,
        6,
      )}-${value.substring(6)}`;
    } else if (value.length > 3) {
      value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }

    setPhone(value);
  };

  const onClose = () => {
    setOpen(false);
  };

  const handleCardNumberChange = (e: any) => {
    const input = e.target.value.replace(/\D/g, "");
    const formatted = input.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted.trim());

    if (input.length !== 16) {
      setPErrors((prev: any) => ({
        ...prev,
        cardNumber: "Invalid card number. Must be 16 digits.",
      }));
    } else {
      setPErrors((prev: any) => ({ ...prev, cardNumber: "" }));
    }
  };

  const handleExpiryChange = (e: any) => {
    const input = e.target.value.replace(/\D/g, "");
    let formatted = input;

    if (input.length >= 2) {
      formatted = `${input.substring(0, 2)}/${input.substring(2, 4)}`;
    }

    setExpiry(formatted);

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formatted)) {
      setPErrors((prev: any) => ({
        ...prev,
        expiry: "Invalid expiry date. Use MM/YY format.",
      }));
    } else {
      setPErrors((prev: any) => ({ ...prev, expiry: "" }));
    }
  };

  const handleCvcChange = (e: any) => {
    const value = e.target.value;
    setCvc(value);

    if (!/^\d{3,4}$/.test(value)) {
      setPErrors((prev: any) => ({
        ...prev,
        cvc: "Invalid CVC. Must be 3-4 digits.",
      }));
    } else {
      setPErrors((prev: any) => ({ ...prev, cvc: "" }));
    }
  };

  const handleUpdateMembershipStatus = async (userid: string, pprice: any) => {
    try {
      const response = await fetch("/api/user/membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileId: userid, price: pprice }),
      });

      const checkData = await response.json();
      localStorage.setItem("memberShip", "1");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const validateReferral = async (
    code?: string | null,
  ): Promise<ReferralValidationResult> => {
    if (!code) {
      console.log("No referral code provided — skipping validation.");
      return { valid: false, message: "No referral code provided" };
    }

    try {
      const res = await fetch("/api/user/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const json = await res.json();

      if (res.ok && json?.is_valid) {
        console.log("✅ Referral code is valid:", json?.affiliate_code);
        return {
          valid: true,
          affiliateCode: json?.affiliate_code,
          profileId: json?.profile_id,
          message: json?.message,
        };
      } else {
        console.warn("❌", json?.message || "Referral code not found");
        return {
          valid: false,
          message: json?.message || "Referral code not found",
        };
      }
    } catch (err) {
      console.error("Referral validation error:", err);
      return {
        valid: false,
        message: "Unable to validate referral at this time",
      };
    }
  };

  const handleLogin = async (userName: string, password: string) => {
    const payload = {
      email: userName,
      pwd: password,
    };

    const result = await fetch("/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await result.json();

    if (getAffCode) {
      try {
        const isValid = await validateReferral(getAffCode);
        if (isValid) {
          const referralRes = await fetch("/api/user/create-referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              affiliateCode: getAffCode,
              referredUserId: data.currentProfileId,
              referredUserName: data.currentuserName,
              referredEmail: email,
              subscriptionId: null,
              memberShipCheck: data?.memberShip === 0 ? "Free" : "Paid",
            }),
          });
          const referralData = await referralRes.json();
          localStorage.removeItem("affiliate_code");
          setGetAffCode(null);
        } else {
          console.warn("Affiliate code invalid or not available:", getAffCode);
        }
      } catch (err) {
        console.error("Referral API error:", err);
      }
    }

    localStorage.setItem("loginInfo", data.jwtToken);
    localStorage.setItem("logged_in_profile", data.currentProfileId);
    localStorage.setItem("profileUsername", data.currentuserName);
    localStorage.setItem("memberalarm", data.memberAlarm);
    localStorage.setItem("memberShip", data.memberShip);
    router.push("/home");
  };

  const handlePromoState = async () => {
    const params = await props.params;
    const userid: any = params.id;
    const response = await fetch(`/api/user/state?userid=${userid}`);
    if (!response.ok) {
      console.log("Error : please check it out");
    }
    const { user: advertiserData } = await response.json();
    const [city, userState] = advertiserData.Location.split(", ");
    setState(userState);
    const result = await fetch("/api/user/promostate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state: userState,
      }),
    });

    const data = await result.json();

    if (data.result == 1) {
      setFirstMonthFree(true);
      console.log("Free Month");
    } else {
      console.log("Premium Month");
      setFirstMonthFree(false);
    }
  };

  const handleConfirm = async () => {
    if (captchaExpected !== null && Number(captchaAnswer) !== captchaExpected) {
      setDialogTitle("Verification Required");
      setDialogDescription("Incorrect CAPTCHA answer. Please solve the equation.");
      setConfirmText("Okay");
      setShowCancelButton(false);
      setDialogOpen(true);
      return;
    }
    if (isProcessing) {
      console.log("Payment already in progress, ignoring duplicate request");
      return;
    }

    if (!cardNumber || !expiry || !cvc) {
      setPErrors({
        cardNumber: cardNumber ? "" : "Card number is required.",
        expiry: expiry ? "" : "Expiry date is required.",
        cvc: cvc ? "" : "CVC is required.",
      });
      return;
    }

    if (!errors.cardNumber && !errors.expiry && !errors.cvc) {
      setIsProcessing(true);

      try {
        var ssunit = unit;
        var planName = "";
        var billingCycle = "1";
        var pprice = "17.95";
        if (ssunit == "1") {
          planName = plan + " Monthly";
          billingCycle = "1";
          pprice = "17.95";
        } else if (ssunit == "12") {
          planName = plan + " Annually";
          billingCycle = "12";
          pprice = "129.95";
        } else if (ssunit == "3") {
          planName = plan + " Quarterly";
          billingCycle = "3";
          pprice = "39.95";
        } else {
          planName = plan + "Bi-Annually";
          billingCycle = "6";
          pprice = "69.95";
        }

        if (promoCode !== "") {
          pprice = "1";
        }

        const response = await fetch("/api/user/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            price: price,
            pprice: pprice,
            length: billingCycle,
            cardNumber: cardNumber,
            expiry: expiry,
            cvc: cvc,
            firstName: formData.firstName,
            lastName: formData.lastName,
            plan: planName,
            isPromoCode: isValidPromoCode,
            city: formData?.qcity,
            country: formData?.qcountry,
            state: state,
            streetAddress: formData?.qstreetAddress,
            phone: formData?.phone,
            zipCode: formData?.qzipCode,
            firstMonthFree: firstMonthFree,
            promocode: promoCode,
            email: email,
            username: userName,
            userid: id,
            captchaAnswer: captchaAnswer,
            captchaToken: captchaToken,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const respondCode = data.respondCode;
          if (respondCode === "1") {
            if (promoCode === "") {
              await handleUpdateMembershipStatus(id, pprice);
            } else {
              await handleSubmitPromoCode();
              await handleUpdateMembershipStatus(id, pprice);
            }
            setOpen(false);

            setDialogTitle(`Thank you ${userName}!`);
            setDialogDescription(
              "Your premium membership is now active. Welcome to the community!",
            );
            setConfirmText("Continue");
            setCancelText("Close");

            setDialogConfirmAction(() => async () => {
              await handleLogin(userName, password);
            });
            setShowCancelButton(false);
            setDialogPlanName(planName);
            setDialogPlanPrice(pprice);
            setDialogBillingCycle(
              ssunit == "1"
                ? "Monthly"
                : ssunit == "12"
                  ? "Annually"
                  : ssunit == "3"
                    ? "Quarterly"
                    : "Bi-Annually",
            );
            setDialogOpen(true);
          } else {
            setOpen(false);
            setDialogTitle("Payment Failed");
            setDialogDescription(
              data.message || "Sorry, we are unable to process your payment.",
            );
            setConfirmText("Edit Card");
            setCancelText("Continue as Free Member");
            setShowCancelButton(false);

            setDialogConfirmAction(() => () => {
              setOpen(true); // reopen card dialog
            });

            setDialogOpen(true);
          }
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        setOpen(false);

        setDialogTitle("Unexpected Error");
        setDialogDescription(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
        );
        setConfirmText("OK");
        setCancelText("Close");

        setDialogConfirmAction(() => () => {
          setDialogOpen(false);
        });

        setDialogOpen(true);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDialogClose = async () => {
    setDialogOpen(false);
    // await handleLogin(userName, password);
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    if (name == "phone") {
      handlePhoneChange(e);
    }
    setFormData({ ...formData, [name]: value });
  };

  const planFormValidationSchema = (captchaExpected: number | null) =>
    Yup.object().shape({
      firstName: Yup.string().required("First Name is required."),
      lastName: Yup.string().required("Last Name is required."),
      streetAddress: Yup.string().required("Street Address is required."),
      zipCode: Yup.string()
        .required("Valid Zip Code is required (5 digits).")
        .matches(/^\d{5}$/, "Valid Zip Code is required (5 digits)."),
      city: Yup.string().required("City is required."),
      country: Yup.string().required("Country is required."),
      phone: Yup.string().required("Phone is required (format: (123) 456-7890)."),
      captchaInput: Yup.string()
        .required("Please solve the CAPTCHA equation first.")
        .test("captcha-correct", "Incorrect CAPTCHA answer.", (value) => {
          return captchaExpected === null || Number(value) === captchaExpected;
        }),
    });

  const validateForm = () => {
    const newErrors: any = {};
    try {
      planFormValidationSchema(captchaExpected).validateSync(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          streetAddress: formData.qstreetAddress,
          zipCode: formData.qzipCode,
          city: formData.qcity,
          country: formData.qcountry,
          phone: formData.phone,
          captchaInput: captchaAnswer,
        },
        { abortEarly: false }
      );
      setErrors({});
      return true;
    } catch (err: any) {
      if (err instanceof Yup.ValidationError) {
        err.inner.forEach((validationError) => {
          if (validationError.path) {
            newErrors[validationError.path === "captchaInput" ? "captcha" : validationError.path] = validationError.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handlePaymentProcess = () => {
    if (validateForm()) {
      setOpen(true);
    }
  };

  const yourTextFieldSx = {
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

  if (isRedirecting) {
    return null; // or loader
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            width: "100%",
            minHeight: "100vh",
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
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 3, sm: 3, md: 5 },
                background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
                backdropFilter: "blur(25px)",
                // border: "2px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                color: "#fff",
                overflow: "visible",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 4,
                  gap: 2,
                }}
              >
                <Button
                  onClick={() => router.back()}
                  sx={{
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexShrink: 0,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  <ArrowBackIcon fontSize="small" />
                </Button>
                <Typography variant="h5" align="center">
                  Payment Details
                </Typography>
                <Box sx={{ width: 40 }} />
              </Box>

              <Typography variant="h6" mb={3} align="center">
                Payment for {plan} Subscription
              </Typography>

              <Grid container spacing={2}>
                {/* First Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    variant="outlined"
                    InputLabelProps={{ style: { color: "#fff" } }}
                    sx={yourTextFieldSx}
                  />
                </Grid>

                {/* Last Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    variant="outlined"
                    InputLabelProps={{ style: { color: "#fff" } }}
                    sx={yourTextFieldSx}
                  />
                </Grid>

                {/* Street Address */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    name="qstreetAddress"
                    value={formData.qstreetAddress}
                    onChange={handleInputChange}
                    error={!!errors.streetAddress}
                    helperText={errors.streetAddress}
                    variant="outlined"
                    InputLabelProps={{ style: { color: "#fff" } }}
                    sx={yourTextFieldSx}
                  />
                </Grid>

                {/* City */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="qcity"
                    value={formData.qcity}
                    onChange={handleInputChange}
                    error={!!errors.city}
                    helperText={errors.city}
                    variant="outlined"
                    InputLabelProps={{ style: { color: "#fff" } }}
                    sx={yourTextFieldSx}
                  />
                </Grid>

                {/* Country */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="qcountry"
                    value={formData.qcountry}
                    onChange={handleInputChange}
                    error={!!errors.country}
                    helperText={errors.country}
                    variant="outlined"
                    InputLabelProps={{ style: { color: "#fff" } }}
                    sx={yourTextFieldSx}
                  />
                </Grid>

                {/* Zip Code */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    name="qzipCode"
                    value={formData.qzipCode}
                    onChange={handleInputChange}
                    error={!!errors.zipCode}
                    helperText={errors.zipCode}
                    variant="outlined"
                    InputLabelProps={{ style: { color: "#fff" } }}
                    sx={yourTextFieldSx}
                  />
                </Grid>

                {/* Phone */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={phone}
                    onChange={handleInputChange}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    placeholder="(123) 456-7890"
                    variant="outlined"
                    InputLabelProps={{ style: { color: "#fff" } }}
                    sx={yourTextFieldSx}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <MathCaptcha
                  onChange={({ answer, token, correctAnswer }) => {
                    setCaptchaAnswer(answer);
                    setCaptchaToken(token);
                    setCaptchaExpected(correctAnswer);
                  }}
                />
                {errors.captcha && (
                  <FormHelperText error sx={{ mt: 0.5, textAlign: "center", fontWeight: "bold" }}>
                    {errors.captcha}
                  </FormHelperText>
                )}
              </Box>

              {/* Pay Button */}
              <Button
                onClick={handlePaymentProcess}
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 3,
                  height: 46,
                  borderRadius: "14px",
                  background:
                    "linear-gradient(90deg, #FF2D6B 0%, #7C4DFF 100%)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
                startIcon={<CreditCardIcon />}
              >
                Pay with Card
              </Button>

              <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                BackdropProps={{
                  sx: {
                    backdropFilter: "blur(6px)",
                  },
                }}
                PaperProps={{
                  sx: {
                    width: "100%",
                    maxWidth: 600,
                    borderRadius: 4,
                    p: 3,
                    background: "rgba(20, 10, 35, 0.85)",
                    backdropFilter: "blur(25px)",
                    border: "2px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    color: "#fff",
                    position: "relative",
                    margin: "10px !important",
                  },
                }}
              >
                {/* HEADER */}
                <Stack spacing={2} alignItems="center" textAlign="center">
                  {/* ICON */}

                  <Box
                    sx={{
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FF2D55, #7000FF)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CreditCardIcon sx={{ color: "#fff", fontSize: 30 }} />
                  </Box>

                  {/* TITLE */}

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}
                  >
                    Enter Payment Details
                  </Typography>
                </Stack>

                {/* FORM */}
                <DialogContent sx={{ px: 0, mt: 2 }}>
                  <Stack spacing={2}>
                    {/* Card Number */}
                    <TextField
                      fullWidth
                      placeholder="Card Number"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      sx={yourTextFieldSx}
                      error={Boolean(perrors.cardNumber)}
                      helperText={perrors.cardNumber}
                    />

                    {/* Expiry + CVC */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        fullWidth
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        sx={yourTextFieldSx}
                        error={Boolean(perrors.expiry)}
                        helperText={perrors.expiry}
                      />

                      <TextField
                        fullWidth
                        placeholder="CVC"
                        value={cvc}
                        onChange={handleCvcChange}
                        sx={yourTextFieldSx}
                        error={Boolean(perrors.cvc)}
                        helperText={perrors.cvc}
                      />
                    </Stack>

                    {/* Promo Code */}
                    <TextField
                      fullWidth
                      placeholder="Promo Code"
                      value={promoCode}
                      disabled={firstMonthFree}
                      onChange={(e) => handleChangePromoCode(e.target.value)}
                      sx={yourTextFieldSx}
                    />

                    {promoCodeMessage && (
                      <Typography
                        sx={{
                          fontSize: "0.8rem",
                          color: isValidPromoCode ? "#00D179" : "#ff4d6d",
                        }}
                      >
                        {promoCodeMessage}
                      </Typography>
                    )}
                  </Stack>
                </DialogContent>

                {/* ACTIONS */}
                <DialogActions sx={{ px: 0, mt: 2 }}>
                  <Stack direction="row" spacing={2} width="100%">
                    {/* CANCEL */}
                    <Button
                      fullWidth
                      onClick={onClose}
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        fontWeight: 600,
                        py: 1.2,
                        borderColor: "rgba(255,255,255,0.3)",
                        color: "#fff",
                        "&:hover": {
                          borderColor: "#FF2D55",
                          backgroundColor: "rgba(255,45,85,0.1)",
                        },
                      }}
                    >
                      Cancel
                    </Button>

                    {/* CONFIRM */}
                    <Button
                      fullWidth
                      onClick={handleConfirm}
                      // disabled={isProcessing}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 700,
                        py: 1.2,
                        background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                        color: "#fff",
                        "&:hover": {
                          opacity: 0.9,
                        },
                      }}
                    >
                      {isProcessing ? "Processing..." : "Confirm"}
                    </Button>
                  </Stack>
                </DialogActions>
              </Dialog>

              <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                BackdropProps={{
                  sx: { backdropFilter: "blur(6px)" },
                }}
                PaperProps={{
                  sx: {
                    width: "100%",
                    margin: "20px !important",
                    maxWidth: 380,
                    borderRadius: 4,
                    p: 2,
                    maxHeight: "90vh",
                    background: "rgba(20, 10, 35, 0.92)",
                    backdropFilter: "blur(25px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    color: "#fff",
                    position: "relative",
                    overflowY: "auto",
                    "&::-webkit-scrollbar": { display: "none" },
                    scrollbarWidth: "none",
                  },
                }}
              >
                {/* Confetti dots background */}
                {dialogTitle.startsWith("Thank") && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      overflow: "hidden",
                    }}
                  >
                    {[...Array(18)].map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          position: "absolute",
                          width: i % 3 === 0 ? 8 : 5,
                          height: i % 3 === 0 ? 8 : 5,
                          borderRadius: "50%",
                          background: [
                            "#FF2D55",
                            "#7000FF",
                            "#FFD700",
                            "#00E5FF",
                            "#FF6B35",
                          ][i % 5],
                          top: `${Math.random() * 100}%`,
                          left: `${(i / 18) * 100}%`,
                          opacity: 0.7,
                          animation: `float${i % 3} 3s ease-in-out infinite`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </Box>
                )}

                <DialogContent
                  sx={{
                    textAlign: "center",
                    p: "0 !important",
                    position: "relative",
                    zIndex: 1,
                    overflow: "visible",
                  }}
                >
                  {/* {!dialogTitle.startsWith("Thank") && (
            <IconButton
              onClick={handleDialogClose}
              sx={{
                position: "absolute",
                right: -8,
                top: -8,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <CloseIcon />
            </IconButton>
          )} */}

                  <Stack spacing={2.5} alignItems="center">
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        background: dialogTitle.startsWith("Thank")
                          ? "linear-gradient(135deg, #FF2D55, #7000FF)"
                          : "linear-gradient(135deg, #f44336, #b71c1c)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {dialogTitle.startsWith("Thank") ? (
                        <WorkspacePremiumIcon
                          sx={{ color: "#fff", fontSize: 38 }}
                        />
                      ) : (
                        <CreditCardIcon sx={{ color: "#fff", fontSize: 34 }} />
                      )}
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, fontSize: "1.2rem" }}
                    >
                      {dialogTitle}
                    </Typography>

                    {/* Description */}
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        color: "rgba(255,255,255,0.7)",
                        lineHeight: 1.5,
                      }}
                    >
                      {dialogDescription}
                    </Typography>

                    {/* Plan Summary Card — only on success */}
                    {dialogTitle.startsWith("Thank") && dialogPlanName && (
                      <Box
                        sx={{
                          width: "100%",
                          borderRadius: 3,
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          p: 2,
                        }}
                      >
                        <Stack spacing={1.2}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                color: "rgba(255,255,255,0.5)",
                              }}
                            >
                              Plan
                            </Typography>
                            <Typography
                              sx={{ fontSize: "0.85rem", fontWeight: 700 }}
                            >
                              {dialogPlanName}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                color: "rgba(255,255,255,0.5)",
                              }}
                            >
                              Billing
                            </Typography>
                            <Typography
                              sx={{ fontSize: "0.85rem", fontWeight: 700 }}
                            >
                              {dialogBillingCycle}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                color: "rgba(255,255,255,0.5)",
                              }}
                            >
                              Amount Paid
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.95rem",
                                fontWeight: 800,
                                color: "#FF2D55",
                              }}
                            >
                              ${dialogPlanPrice}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    )}

                    {/* Member Benefits — only on success */}
                    {dialogTitle.startsWith("Thank") && (
                      <>
                        <Divider
                          sx={{
                            width: "100%",
                            borderColor: "rgba(255,255,255,0.08)",
                          }}
                        />
                        <Stack
                          spacing={1}
                          sx={{ width: "100%", textAlign: "left" }}
                        >
                          {[
                            "Unlimited access to all premium features",
                            "Connect with members near you",
                            "Exclusive events & community access",
                          ].map((benefit, i) => (
                            <Stack
                              key={i}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <CheckCircleIcon
                                sx={{ fontSize: 16, color: "#FF2D55" }}
                              />
                              <Typography
                                sx={{
                                  fontSize: "0.8rem",
                                  color: "rgba(255,255,255,0.75)",
                                }}
                              >
                                {benefit}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </>
                    )}

                    {/* Buttons */}
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{ width: "100%", pt: 1 }}
                    >
                      {showCancelButton && (
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={handleDialogClose}
                          sx={{
                            borderRadius: 3,
                            fontWeight: 600,
                            py: 1.2,
                            borderColor: "rgba(255,255,255,0.3)",
                            color: "#fff",
                          }}
                        >
                          {cancelText.toUpperCase()}
                        </Button>
                      )}
                      {dialogConfirmAction && (
                        <Button
                          fullWidth
                          onClick={async () => {
                            setDialogOpen(false);
                            setIsRedirecting(true);
                            await dialogConfirmAction?.();
                          }}
                          sx={{
                            borderRadius: 3,
                            fontWeight: 700,
                            py: 1.2,
                            background:
                              "linear-gradient(90deg, #FF2D55, #7000FF)",
                            color: "#fff",
                          }}
                        >
                          {confirmText.toUpperCase()}
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </DialogContent>
              </Dialog>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    </>
  );
}
