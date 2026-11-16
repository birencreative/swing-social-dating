"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  TextField,
  Grid,
  Button,
  Box,
  ThemeProvider,
  createTheme,
  Alert,
  CircularProgress,
  InputAdornment,
  Fade,
  Card,
  CardContent,
  Collapse,
  Chip,
  useMediaQuery,
  IconButton,
  Stack,
  Divider,
} from "@mui/material";
import {
  CreditCard,
  Calendar,
  Lock,
  ArrowLeft,
  ArrowRight,
  User,
  MapPin,
  Phone,
  Tag,
  Sparkles,
  ChevronLeft,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import CheckCircle from "@mui/icons-material/CheckCircle";
import CustomDialog from "@/components/CustomDialog";
import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import Loader from "@/commonPage/Loader";
import MathCaptcha from "@/components/MathCaptcha";
import * as Yup from "yup";
import { FormHelperText } from "@mui/material";


// Premium Theme Logic
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#FF2D55",
      dark: "#7000FF",
    },
    background: {
      default: "#0a0412",
      paper: "#14071f",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

const yourTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "12px",
    transition: "all 0.3s ease",
    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
    "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
    "&.Mui-focused fieldset": { borderColor: "#7000FF", borderWidth: "2px" },
    "&.Mui-error fieldset": { borderColor: "#ff4b4b" },
    "& input": { color: "#fff", py: 2 },
  },
  "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.5)", fontSize: "0.9rem" },
  "& .MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
    transform: "translate(14px, 16px) scale(1)",
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#7000FF" },
  "& .MuiInputLabel-root.Mui-error": { color: "#ff4b4b" },
  "& .MuiFormHelperText-root": {
    marginLeft: "4px",
    marginTop: "4px",
    fontSize: "12px",
    textAlign: "left",
  },
  "& .MuiFormHelperText-root.Mui-error": {
    color: "#ff4b4b",
  },
  mb: 1,
};

const cardStyle = {
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(20px)",
  borderRadius: "24px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  overflow: "visible",
};

interface FormData {
  firstName: string;
  lastName: string;
  streetAddress: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  phoneNumber: string;
  membershipOption: string;
  cardNumber: string;
  expDate: string;
  cvv: string;
  promoCode: string;
  captchaInput?: string;
}

const steps = ["Plan", "Details", "Payment"];

const Crown = ({ size, color }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const membershipPlans = [
  {
    id: "Monthly - $17.95",
    name: "Monthly",
    price: "$17.95",
    period: "/month",
    savings: null,
    popular: false,
    icon: <User size={24} />,
    features: ["Unlimited swipes", "Premium filters", "Message priority"],
  },
  {
    id: "Quarterly - $39.95",
    name: "Quarterly",
    price: "$39.95",
    period: "/3 months",
    savings: "25%",
    popular: false,
    icon: <Calendar size={24} />,
    features: ["Everything in Monthly", "3 months commitment", "Save $14"],
  },
  {
    id: "BiAnnually - $69.95",
    name: "Bi-Annual",
    price: "$69.95",
    period: "/6 months",
    savings: "35%",
    popular: true,
    icon: <Crown size={24} />,
    features: ["Everything in Quarterly", "6 months commitment", "Save $38"],
  },
  {
    id: "Annually - $129.95",
    name: "Annual",
    price: "$129.95",
    period: "/year",
    savings: "40%",
    popular: false,
    icon: <Sparkles size={24} />,
    features: ["Everything in Bi-Annual", "12 months commitment", "Save $86"],
  },
];


const BillingUpgrade: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    streetAddress: "",
    country: "",
    state: "",
    city: "",
    zipCode: "",
    phoneNumber: "",
    membershipOption: "",
    cardNumber: "",
    expDate: "",
    cvv: "",
    promoCode: "",
  });

  const [profileId, setProfileId] = useState<string>("");
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoCodeMessage, setPromocodeMessage] = useState<string>("");
  const [promoCodeList, setPromoCodeList] = useState<any[]>([]);
  const [userName, setUsername] = useState<string>("");
  const [membership, setMembership] = useState(0);
  const [advertiser, setAdvertiser] = useState<any>({});
  const [state, setState] = useState<string>("");
  const [firstMonthFree, setFirstMonthFree] = useState(false);
  const [isValidPromoCode, setIsValidPromoCode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const [captchaAnswer, setCaptchaAnswer] = useState<string>("");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [captchaExpected, setCaptchaExpected] = useState<number | null>(null);


  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<"success" | "error" | null>(null);

  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatCardNumber = useCallback((value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  }, []);

  const formatExpiryDate = useCallback((value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  }, []);

  const validateCardNumber = useCallback((cardNumber: string) => {
    const num = cardNumber.replace(/\s/g, "");
    if (!/^\d+$/.test(num)) return false;
    return num.length >= 13 && num.length <= 19;
  }, []);

  const handleGetAllPromoCodes = async () => {
    try {
      const response = await fetch("/api/user/promocode/check");
      if (!response.ok) throw new Error("Failed to fetch promo codes");

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      setPromoCodeList(result.promocodes || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    handleGetAllPromoCodes();
    const userid = localStorage.getItem("logged_in_profile");
    if (userid) {
      setProfileId(userid);

      const getState = async () => {
        try {
          const response = await fetch(`/api/user/state?userid=${userid}`);
          if (!response.ok) return;

          const { user: advertiserData } = await response.json();
          const [city, state] = advertiserData.Location.split(", ");
          setState(state);

          const result = await fetch("/api/user/promostate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: state }),
          });
          const data = await result.json();
          setFirstMonthFree(data.result === 1);
        } catch (error) {
          console.error("Error fetching state data:", error);
        }
      };

      getState();
    }

    const token = localStorage.getItem("loginInfo");
    if (token) {
      try {
        const decodeToken = jwtDecode<any>(token);
        setMembership(decodeToken?.membership || 0);
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }

    setUsername(localStorage.getItem("profileUsername") || "");

    const getData = async () => {
      try {
        const response = await fetch(`/api/user/sweeping/user?id=${userid}`);
        if (!response.ok) return;

        const { user: advertiserData } = await response.json();
        setAdvertiser(advertiserData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (userid) getData();
  }, [mounted]);

  const handleChangePromoCode = (promoCodeText: string) => {
    setPromoCode(promoCodeText);
    setFormData((prev) => ({ ...prev, promoCode: promoCodeText }));

    if (promoCodeText) {
      const filter = promoCodeList.find((val) => val?.PromoCodeText === promoCodeText);
      if (filter) {
        setPromocodeMessage(filter.DisplayMessage);
        setIsValidPromoCode(true);
      } else {
        setPromocodeMessage("Invalid promo code");
        setIsValidPromoCode(false);
      }
    } else {
      setPromocodeMessage("");
      setIsValidPromoCode(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "cardNumber") {
      processedValue = formatCardNumber(value);
    } else if (name === "expDate") {
      processedValue = formatExpiryDate(value);
    } else if (name === "cvv") {
      processedValue = value.replace(/[^0-9]/g, "").substring(0, 4);
    } else if (name === "phoneNumber") {
      processedValue = value.replace(/[^0-9+\-\s()]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (formError) setFormError("");
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "");
    let formatted = input;
    if (input.length >= 3) {
      formatted = `${input.substring(0, 2)}/${input.substring(2, 4)}`;
    }
    setFormData((prev) => ({ ...prev, expDate: formatted }));
    setErrors((prev) => ({ ...prev, expDate: "" }));

    if (!/^\d{2}\/\d{2}$/.test(formatted)) {
      setFormError("Invalid expiry date. Use MM/YY format.");
      return;
    }

    const [month, year] = formatted.split("/").map((num) => parseInt(num, 10));
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (month < 1 || month > 12) {
      setFormError("Invalid month. Use 01–12.");
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setFormError("Card expired.");
    } else {
      setFormError("");
    }
  };

  const billingValidationSchema = Yup.object().shape({
    firstName: Yup.string().required("First Name is required."),
    lastName: Yup.string().required("Last Name is required."),
    streetAddress: Yup.string().required("Street Address is required."),
    country: Yup.string().required("Country is required."),
    state: Yup.string().required("State is required."),
    city: Yup.string().required("City is required."),
    zipCode: Yup.string().required("Zip Code is required."),
    phoneNumber: Yup.string().required("Phone number is required."),
  });

  const paymentValidationSchema = (captchaExpected: number | null) =>
    Yup.object().shape({
      cardNumber: Yup.string()
        .required("Card Number is required.")
        .test("valid-card", "Invalid card number.", (value) => validateCardNumber(value || ""))
        .test("no-amex", "AMEX cards are not currently accepted.", (value) => {
          const cleaned = (value || "").replace(/\D/g, "");
          return !cleaned.startsWith("3");
        }),
      expDate: Yup.string()
        .required("Expiry Date is required.")
        .matches(/^\d{2}\/\d{2}$/, "Use MM/YY format.")
        .test("not-expired", "Card expired.", (value) => {
          if (!value) return false;
          const [month, year] = value.split("/").map((num) => parseInt(num));
          const now = new Date();
          const currentYear = now.getFullYear() % 100;
          const currentMonth = now.getMonth() + 1;
          return year > currentYear || (year === currentYear && month >= currentMonth);
        }),
      cvv: Yup.string()
        .required("CVV is required.")
        .matches(/^\d{3,4}$/, "CVV must be 3 or 4 digits."),
      captchaInput: Yup.string()
        .required("Please solve the CAPTCHA equation first.")
        .test("captcha-correct", "Incorrect CAPTCHA answer. Please try again.", (value) => {
          return captchaExpected === null || Number(value) === captchaExpected;
        }),
    });

  const validateStep = (step: number) => {
    const tempErrors: any = {};
    try {
      if (step === 0) {
        if (!formData.membershipOption) {
          setFormError("Please select a membership plan");
          setDialogTitle("Validation Error");
          setDialogMessage("Please select a membership plan before continuing.");
          setDialogAction("error");
          setDialogOpen(true);
          return false;
        }
      } else if (step === 1) {
        billingValidationSchema.validateSync(formData, { abortEarly: false });
      } else if (step === 2) {
        paymentValidationSchema(captchaExpected).validateSync(
          {
            cardNumber: formData.cardNumber,
            expDate: formData.expDate,
            cvv: formData.cvv,
            captchaInput: captchaAnswer,
          },
          { abortEarly: false }
        );
      }
      setErrors({});
      setFormError("");
      return true;
    } catch (err: any) {
      if (err instanceof Yup.ValidationError) {
        err.inner.forEach((validationError) => {
          if (validationError.path) {
            tempErrors[validationError.path] = validationError.message;
          }
        });
        setErrors(tempErrors);
        setFormError("Please check the fields and correct any errors.");
        setDialogTitle("Validation Error");
        setDialogMessage("Please fill in all required fields correctly.");
        setDialogAction("error");
        setDialogOpen(true);
      }
      return false;
    }
  };


  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
      setFormError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateAffiliate = async (userid: string) => {
    try {
      await fetch("/api/user/upgrade-anytime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: userid }),
      });
    } catch (error) {
      console.error("Error updating affiliate:", error);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    if (!isValidPromoCode && promoCode) {
      setFormError("Please enter a valid promo code or leave it empty.");
      setDialogTitle("Validation Error");
      setDialogMessage("Please enter a valid promo code or leave it empty.");
      setDialogAction("error");
      setDialogOpen(true);
      return;
    }
    setLoading(true);

    try {
      const match = formData.membershipOption.match(/^([\w\s-]+) - \$([\d.]+)$/);
      let unit = match?.[1];
      let length = "1";
      let planName = "";
      let pprice = "17.95";

      switch (unit) {
        case "Monthly": length = "1"; planName = "Premium Monthly"; pprice = "17.95"; break;
        case "Quarterly": length = "3"; planName = "Premium Quarterly"; pprice = "39.95"; break;
        case "BiAnnually":
        case "Bi-Annual": length = "6"; planName = "BiAnnually"; pprice = "69.95"; break;
        case "Annual":
        case "Annually": length = "12"; planName = "Annually"; pprice = "129.95"; break;
      }

      if (promoCode !== "") pprice = "1";

      const paymentPayload = {
        price: pprice, pprice, length,
        cardNumber: formData.cardNumber,
        expiry: formData.expDate,
        cvc: formData.cvv,
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: planName,
        isPromoCode: isValidPromoCode,
        country: formData.country,
        city: formData.city,
        state: formData.state,
        streetAddress: formData.streetAddress,
        phone: formData.phoneNumber,
        zipCode: formData.zipCode,
        promocode: promoCode,
        email: advertiser.Email,
        username: advertiser?.Username,
        firstMonthFree,
        userid: profileId,
        captchaAnswer,
        captchaToken,
      };

      const response = await fetch("/api/user/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      });

      const data = await response.json();
      if (data.success) {
        if (promoCode !== "") await handleSubmitPromoCode();
        await handleUpdateMembershipStatus(profileId, pprice);
        await handleUpdateAffiliate(profileId);
        setDialogTitle("Payment Successful! 🎉");
        setDialogMessage(data.message);
        setDialogAction("success");
        setDialogOpen(true);
      } else {
        setFormError(data.message || "Payment failed. Please try again.");
        setDialogTitle("Payment Failed");
        setDialogMessage(data.message || "Payment failed. Please try again.");
        setDialogAction("error");
        setDialogOpen(true);
      }
    } catch (error) {
      setFormError("We're experiencing technical difficulties. Please try again.");
      setDialogTitle("Error");
      setDialogMessage("We're experiencing technical difficulties. Please try again.");
      setDialogAction("error");
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPromoCode = async () => {
    try {
      await fetch("/api/user/promocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: profileId, promocode: promoCode }),
      });
    } catch (error) {
      console.error("Error submitting promo code:", error);
    }
  };

  const handleUpdateMembershipStatus = async (userid: string, pprice: string) => {
    try {
      const response = await fetch("/api/user/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: userid, price: pprice, username: advertiser?.Username, avatar: advertiser?.Avatar }),
      });
      const data = await response.json();
      if (data.success && data.updatedToken) {
        localStorage.setItem("loginInfo", data.updatedToken);
        localStorage.setItem("memberShip", "1");
        setMembership(1);
      }
    } catch (error) {
      console.error("Error updating membership:", error);
    }
  };

  if (!mounted) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#0a0412", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)", pb: { xs: 12, md: 8 } }}>
        {isMobile ? <AppHeaderMobile /> : <AppHeaderDesktop />}

        <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 6 }, pb: { xs: 2, md: 6 }, px: { xs: 1.5, sm: 3 } }}>

          <Box sx={{ maxWidth: 800, mx: "auto" }}>
            {/* Header Area */}
            <Box sx={{ textAlign: "center", mb: { xs: 3, md: 4 } }}>
              <Typography variant="h3" sx={{
                fontWeight: 900,
                mb: 1.5,
                background: "linear-gradient(90deg, #FF2D55 0%, #7000FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: "2rem", md: "3.5rem" },
                letterSpacing: "-1px"
              }}>
                {membership === 1 ? "Premium Status" : "Elevate Your Experience"}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem" }}>
                {membership === 1 ? "Your membership is active and full of perks!" : "Unlock premium features and connect with the community."}
              </Typography>
            </Box>

            {membership === 1 ? (
              <Fade in={true}>
                <Card sx={{ ...cardStyle, textAlign: "center", p: { xs: 4, md: 8 } }}>
                  <Box sx={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: "rgba(76, 175, 80, 0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 3, border: "1px solid rgba(76, 175, 80, 0.3)"
                  }}>
                    <Check size={40} color="#4caf50" />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Premium Active</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.6)", mb: 4, maxWidth: 500, mx: "auto" }}>
                    You are already a Premium member. To manage your subscription or billing details, please reach out to our team.
                  </Typography>
                  <Button
                    href="mailto:info@swingsocial.co"
                    variant="contained"
                    size="large"
                    sx={{
                      borderRadius: "16px", px: 6, py: 2,
                      background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                      fontWeight: 700
                    }}
                  >
                    Contact Support
                  </Button>
                </Card>
              </Fade>
            ) : (
              <Box>
                {/* Custom Stepper */}
                <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
                  {steps.map((label, index) => (
                    <Box key={label} sx={{ textAlign: "center" }}>
                      <Box sx={{
                        width: 12, height: 12, borderRadius: "50%",
                        background: activeStep === index ? "linear-gradient(90deg, #FF2D55, #7000FF)" : "rgba(255,255,255,0.1)",
                        mx: "auto", mb: 1,
                        boxShadow: activeStep === index ? "0 0 15px rgba(255, 45, 85, 0.5)" : "none",
                        transition: "all 0.3s ease"
                      }} />
                      <Typography sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: activeStep === index ? "#fff" : "rgba(255,255,255,0.3)"
                      }}>{label}</Typography>
                    </Box>
                  ))}
                </Stack>

                {formError && (
                  <Fade in={true}>
                    <Alert severity="error" sx={{ mb: 4, borderRadius: "16px", background: "rgba(255, 75, 75, 0.1)", border: "1px solid rgba(255, 75, 75, 0.2)", color: "#ff4b4b" }}>
                      {formError}
                    </Alert>
                  </Fade>
                )}

                <Card sx={cardStyle}>
                  <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>

                    {/* Step 0: Plan Selection */}
                    {activeStep === 0 && (
                      <Fade in={activeStep === 0}>
                        <Box>
                          <Grid container spacing={2}>
                            {membershipPlans.map((plan) => (
                              <Grid item xs={12} sm={6} key={plan.id}>
                                <Box
                                  onClick={() => setFormData(p => ({ ...p, membershipOption: plan.id }))}
                                  sx={{
                                    p: 3, cursor: "pointer", borderRadius: "20px", position: "relative",
                                    background: formData.membershipOption === plan.id ? "rgba(112, 0, 255, 0.08)" : "rgba(255,255,255,0.02)",
                                    border: formData.membershipOption === plan.id ? "2px solid #7000FF" : "1px solid rgba(255,255,255,0.05)",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": { transform: "translateY(-4px)", background: "rgba(255,255,255,0.05)" }
                                  }}
                                >
                                  {plan.popular && (
                                    <Chip label="Popular" size="small" sx={{ position: "absolute", top: 12, right: 12, background: "linear-gradient(90deg, #FF2D55, #7000FF)", fontWeight: 800, fontSize: "0.65rem" }} />
                                  )}
                                  <Box sx={{ color: formData.membershipOption === plan.id ? "#FF2D55" : "rgba(255,255,255,0.5)", mb: 2 }}>{plan.icon}</Box>
                                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{plan.name}</Typography>
                                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 1 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 900 }}>{plan.price}</Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>{plan.period}</Typography>
                                  </Box>
                                  {plan.savings && <Chip label={`Save ${plan.savings}`} size="small" sx={{ background: "rgba(76, 175, 80, 0.1)", color: "#4caf50", fontWeight: 700, mb: 2, height: 20 }} />}
                                  <Stack spacing={1}>
                                    {plan.features.map(f => (
                                      <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Check size={14} color="#4caf50" />
                                        <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>{f}</Typography>
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </Fade>
                    )}

                    {/* Step 1: Details */}
                    {activeStep === 1 && (
                      <Fade in={activeStep === 1}>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 800, mb: { xs: 2, md: 3 }, textAlign: "center" }}>Billing Details</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} error={Boolean(errors.firstName)} helperText={errors.firstName} sx={yourTextFieldSx} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} error={Boolean(errors.lastName)} helperText={errors.lastName} sx={yourTextFieldSx} /></Grid>
                            <Grid item xs={12}><TextField fullWidth label="Street Address" name="streetAddress" value={formData.streetAddress} onChange={handleChange} error={Boolean(errors.streetAddress)} helperText={errors.streetAddress} sx={yourTextFieldSx} /></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth label="City" name="city" value={formData.city} onChange={handleChange} error={Boolean(errors.city)} helperText={errors.city} sx={yourTextFieldSx} /></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth label="State" name="state" value={formData.state} onChange={handleChange} error={Boolean(errors.state)} helperText={errors.state} sx={yourTextFieldSx} /></Grid>
                            <Grid item xs={12} sm={4}><TextField fullWidth label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} error={Boolean(errors.zipCode)} helperText={errors.zipCode} sx={yourTextFieldSx} /></Grid>
                            <Grid item xs={12}><TextField fullWidth label="Country" name="country" value={formData.country} onChange={handleChange} error={Boolean(errors.country)} helperText={errors.country} sx={yourTextFieldSx} /></Grid>
                            <Grid item xs={12}><TextField fullWidth label="Phone" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} error={Boolean(errors.phoneNumber)} helperText={errors.phoneNumber} sx={yourTextFieldSx} /></Grid>
                          </Grid>
                        </Box>
                      </Fade>
                    )}

                    {/* Step 2: Payment */}
                    {activeStep === 2 && (
                      <Fade in={activeStep === 2}>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 800, mb: { xs: 2, md: 3 }, textAlign: "center" }}>Secure Payment</Typography>

                          <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center">
                            {/* Left: Virtual Credit Card */}
                            <Grid item xs={12} md={5.5} sx={{ display: "flex", justifyContent: "center", mb: { xs: 3, md: 0 } }}>
                              <Box sx={{
                                width: "100%",
                                maxWidth: "320px",
                                height: "190px",
                                borderRadius: "20px",
                                background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
                                boxShadow: "0 15px 35px rgba(112, 0, 255, 0.3)",
                                position: "relative",
                                p: 3,
                                color: "#fff",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                overflow: "hidden",
                                transition: "all 0.4s ease",
                                "&::before": {
                                  content: '""',
                                  position: "absolute",
                                  top: "-50%",
                                  left: "-50%",
                                  width: "200%",
                                  height: "200%",
                                  background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 60%)",
                                  pointerEvents: "none",
                                }
                              }}>
                                {/* Top: Chip & Brand */}
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  {/* Golden Chip */}
                                  <Box sx={{
                                    width: "42px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    background: "linear-gradient(135deg, #fce881 0%, #cba135 100%)",
                                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
                                    position: "relative",
                                    "&::after": {
                                      content: '""',
                                      position: "absolute",
                                      top: "20%",
                                      left: "20%",
                                      width: "60%",
                                      height: "60%",
                                      border: "1px solid rgba(0,0,0,0.15)",
                                      borderRadius: "3px"
                                    }
                                  }} />

                                  {/* Card Network Brand */}
                                  <Typography sx={{
                                    fontWeight: 900,
                                    fontStyle: "italic",
                                    fontSize: "15px",
                                    letterSpacing: "1px",
                                    opacity: 0.95,
                                    textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
                                  }}>
                                    {(() => {
                                      const cleaned = formData.cardNumber.replace(/\D/g, "");
                                      if (cleaned.startsWith("4")) return "VISA";
                                      if (cleaned.startsWith("5")) return "MASTERCARD";
                                      if (cleaned.startsWith("3")) return "AMEX";
                                      if (cleaned.startsWith("6")) return "DISCOVER";
                                      return "SWING SOCIAL";
                                    })()}
                                  </Typography>
                                </Box>

                                {/* Card Number Display */}
                                <Typography sx={{
                                  fontSize: { xs: "18px", sm: "20px" },
                                  letterSpacing: "2.5px",
                                  textAlign: "center",
                                  fontFamily: "'Courier New', Courier, monospace",
                                  fontWeight: "bold",
                                  textShadow: "2px 2px 4px rgba(0,0,0,0.4)",
                                  my: 1
                                }}>
                                  {formData.cardNumber || "•••• •••• •••• ••••"}
                                </Typography>

                                {/* Bottom Info (Name + Expiry) */}
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                  <Box sx={{ maxWidth: "180px", overflow: "hidden" }}>
                                    <Typography sx={{ fontSize: "7.5px", textTransform: "uppercase", opacity: 0.6, letterSpacing: "1px", mb: 0.5 }}>Cardholder</Typography>
                                    <Typography sx={{
                                      fontSize: "12px",
                                      fontWeight: "bold",
                                      textTransform: "uppercase",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      fontFamily: "system-ui, sans-serif"
                                    }}>
                                      {`${formData.firstName} ${formData.lastName}`.trim() || "YOUR NAME"}
                                    </Typography>
                                  </Box>

                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography sx={{ fontSize: "7.5px", textTransform: "uppercase", opacity: 0.6, letterSpacing: "1px", mb: 0.5 }}>Expires</Typography>
                                    <Typography sx={{
                                      fontSize: "13px",
                                      fontWeight: "bold",
                                      fontFamily: "'Courier New', Courier, monospace"
                                    }}>
                                      {formData.expDate || "MM/YY"}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>

                            {/* Right: Input Fields */}
                            <Grid item xs={12} md={6.5}>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <TextField fullWidth label="Card Number" name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="0000 0000 0000 0000" error={Boolean(errors.cardNumber)} helperText={errors.cardNumber} inputProps={{ maxLength: 19 }} sx={yourTextFieldSx} />
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField fullWidth label="Expiry Date" name="expDate" value={formData.expDate} onChange={handleExpiryChange} placeholder="MM/YY" error={Boolean(errors.expDate)} helperText={errors.expDate} inputProps={{ maxLength: 5 }} sx={yourTextFieldSx} />
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField fullWidth label="CVV" name="cvv" value={formData.cvv} onChange={handleChange} placeholder="000" error={Boolean(errors.cvv)} helperText={errors.cvv} inputProps={{ maxLength: 4 }} sx={yourTextFieldSx} />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField fullWidth label="Promo Code" name="promoCode" value={promoCode} onChange={(e) => handleChangePromoCode(e.target.value)} sx={yourTextFieldSx} />
                                </Grid>
                              </Grid>
                            </Grid>
                          </Grid>

                          {promoCodeMessage && (
                            <Alert severity={isValidPromoCode ? "success" : "error"} sx={{ mt: 3, borderRadius: "12px", background: "rgba(255,255,255,0.03)" }}>
                              {promoCodeMessage}
                            </Alert>
                          )}

                          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <MathCaptcha
                              onChange={({ answer, token, correctAnswer }) => {
                                setCaptchaAnswer(answer);
                                setCaptchaToken(token);
                                setCaptchaExpected(correctAnswer);
                              }}
                            />
                            {errors.captchaInput && (
                              <FormHelperText error sx={{ mt: 0.5, textAlign: "center", fontWeight: "bold" }}>
                                {errors.captchaInput}
                              </FormHelperText>
                            )}
                          </Box>

                          <Alert severity="info" sx={{ mt: 2, background: "rgba(33, 150, 243, 0.05)", border: "1px solid rgba(33, 150, 243, 0.1)", color: "#2196f3", borderRadius: "12px" }}>
                            AMEX cards are not currently accepted.
                          </Alert>
                        </Box>
                      </Fade>
                    )}

                    {/* Navigation */}
                    <Box sx={{ mt: { xs: 3, md: 4 }, display: "flex", gap: 2, flexDirection: isMobile ? "column" : "row" }}>
                      {activeStep > 0 && (
                        <Button
                          onClick={handleBack}
                          fullWidth
                          variant="outlined"
                          startIcon={<ChevronLeft />}
                          sx={{
                            borderRadius: "16px", py: 2,
                            borderColor: "rgba(255,255,255,0.1)", color: "#fff",
                            "&:hover": { borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)" }
                          }}
                        >
                          Back
                        </Button>
                      )}
                      <Button
                        onClick={activeStep === 2 ? handleSubmit : handleNext}
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                          borderRadius: "16px", py: 2,
                          background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                          fontWeight: 700,
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (activeStep === 2 ? "Verify & Pay" : "Continue")}
                      </Button>
                    </Box>

                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Container>

        {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}
      </Box>

      <CustomDialog
        open={dialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        confirmText={dialogAction === "success" ? "Go to Members" : "OK"}
        cancelText="Close"
        onClose={() => {
          setDialogOpen(false);
          setFormError("");
        }}
        onConfirm={() => {
          setDialogOpen(false);
          setFormError("");
          if (dialogAction === "success") router.push("/members");
        }}
      />
    </ThemeProvider>
  );
};

export default BillingUpgrade;
