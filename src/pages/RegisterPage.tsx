"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Dialog,
  Autocomplete,
  CircularProgress,
  LinearProgress,
  createTheme,
  useMediaQuery,
  ThemeProvider,
  Container,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Link as MUILink,
  Stack,
  FormControlLabel,
  Checkbox,
  Popper,
  PopperProps,
  FormHelperText,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CloseIcon from "@mui/icons-material/Close";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import Link from "next/link";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import ParticleField from "@/components/ParticleField";

const theme = createTheme({
  palette: {
    primary: { main: "#FF2D55", light: "#FF617B", dark: "#CC1439" },
    secondary: { main: "#7000FF", light: "#9B4DFF", dark: "#5200CC" },
    success: { main: "#00D179" },
    background: { default: "#0A0118" },
  },
});

type CityType = {
  id: number;
  City: string;
};

type PolicyRowProps = { supportEmail: string };

const PolicyRow = ({ supportEmail }: PolicyRowProps) => (
  <Stack
    spacing={1.5}
    sx={{
      mt: 2,
      alignItems: "center",
      px: { xs: 2, sm: 0 },
    }}
  >
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 1, sm: 2 }}
      sx={{
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Divider
        orientation="vertical"
        flexItem
        sx={{
          display: { xs: "none", sm: "block" },
        }}
      />

      <MUILink href={`mailto:${supportEmail}`} underline="hover" sx={linkSx}>
        Contact support
      </MUILink>
    </Stack>
  </Stack>
);

const linkSx = {
  color: "#c2185b",
  fontWeight: 600,
  display: "block",
  px: 1,
  py: 0.75,
  borderRadius: 1,
  lineHeight: 1.4,
  textAlign: "center",
  "&:focus-visible": {
    outline: "2px solid rgba(194,24,91,0.5)",
    outlineOffset: 2,
    borderRadius: 6,
  },
} as const;

type RegisterFormValues = {
  userName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  repeatPassword: string;
  city: string;
  user_name: string;
  consent: boolean;
  isAdult: boolean;
  referral_code: string;
};

const getCookie = (name: string) => {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
};

const RegisterPage = () => {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const userNameRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [cityOption, setCityOption] = useState<CityType[] | []>([]);
  const [cityInput, setCityInput] = useState<string | "">("");

  const isMobile = useMediaQuery("(max-width:600px)");
  const [showPassword, setShowPassword] = useState(false);
  const [checkPassword, setCheckPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [supportEmail, setSupportEmail] = useState("info@swingsocial.co");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const aff = urlParams.get("aff");
      if (aff) {
        localStorage.setItem("affiliate_code", aff);
      }
    }
  }, []);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.match(/[a-z]+/)) strength += 20;
    if (password.match(/[A-Z]+/)) strength += 20;
    if (password.match(/[0-9]+/)) strength += 20;
    if (password.match(/[$@#&!]+/)) strength += 20;
    return strength;
  };

  const handleTogglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleToggleCheckPasswordVisibility = () =>
    setCheckPassword((prev) => !prev);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (!openCity) setCityOption([]);
  }, [openCity]);

  useEffect(() => {
    if (!openCity) return;
    if (cityInput === "") return;

    const fetchData = async () => {
      setCityLoading(true);
      try {
        const response = await fetch(`/api/user/city?city=${cityInput}`);
        if (!response.ok) {
          console.error("Failed to fetch event data:", response.statusText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { cities }: { cities: CityType[] } = await response.json();
        const uniqueCities = cities.filter(
          (city, index, self) =>
            index === self.findIndex((t) => t.City === city.City),
        );
        setCityOption(uniqueCities);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setCityLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [cityInput, openCity]);

  const validationSchema = Yup.object({
    userName: Yup.string().required("Name is required"),
    email: Yup.string()
      .email("Please enter a valid email address")
      .required("Email is required"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Please enter a valid phone number (10 digits)")
      .required("Phone is required"),
    password: Yup.string()
      .required("Password is required")
      .test(
        "password-strength",
        "Password is not strong enough",
        (value) => calculatePasswordStrength(value || "") >= 60,
      ),
    repeatPassword: Yup.string()
      .required("Repeat your password")
      .oneOf([Yup.ref("password")], "Passwords must match"),
    city: Yup.string().required("City is required"),
    user_name: Yup.string().required("User Name is required"),
    consent: Yup.boolean().oneOf(
      [true],
      "Please agree to the Privacy Policy & Terms",
    ),
    isAdult: Yup.boolean().oneOf(
      [true],
      "You must confirm you are 18 years or older",
    ),
  });

  const [initialValues, setInitialValues] = useState<RegisterFormValues>({
    userName: "",
    email: "",
    phone: "",
    countryCode: "",
    password: "",
    repeatPassword: "",
    city: "",
    user_name: "",
    consent: false,
    isAdult: false,
    referral_code: "",
  });
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await fetch("/api/user/draft");
        if (res.ok) {
          const data = await res.json();
          if (data.draft) {
            setInitialValues({
              userName: data.draft.userName || "",
              email: data.draft.email || "",
              phone: data.draft.phone || "",
              countryCode: data.draft.countryCode || "",
              password: data.draft.password || "",
              repeatPassword: data.draft.repeatPassword || "",
              city: data.draft.city || "",
              user_name: data.draft.user_name || "",
              consent: data.draft.consent || false,
              isAdult: data.draft.isAdult || false,
              referral_code: data.draft.referral_code || "",
            });
            if (data.draft.city) {
              setCityInput(data.draft.city);
            }
          }
        }
      } catch (err) {
        console.error("Error loading draft:", err);
      } finally {
        setDraftLoaded(true);
      }
    };
    fetchDraft();
  }, []);

  const formik = useFormik<RegisterFormValues>({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        setIsUploading(true);
        const savedProfileId = localStorage.getItem("register_profile_id") || getCookie("register_profile_id");

        const urlParams = new URLSearchParams(window.location.search);
        const src = urlParams.get("refer");
        const aff = urlParams.get("aff");

        const getOS = () => {
          const userAgent = window.navigator.userAgent;
          if (userAgent.includes("Win")) return "Windows";
          if (userAgent.includes("Mac")) return "MacOS";
          if (userAgent.includes("Linux")) return "Linux";
          if (userAgent.includes("Android")) return "Android";
          if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
            return "iOS";
          return "Unknown";
        };

        // 🔹 Track hit
        const hitRes = await fetch("/api/user/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliate: aff,
            referral: src,
            OS: getOS(),
            page: "Register",
            url: window.location.href,
            userid: null,
          }),
        });

        const hitData = await hitRes.json();
        const hitId = hitData?.data?.HitId || null;

        // 🔹 Username check
        const usernameCheck = await fetch("/api/user/screenname/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ search: values.user_name.trim(), excludeProfileId: savedProfileId }),
        }).then((res) => res.json());

        if (usernameCheck.exists) {
          setErrors({ user_name: "Username already taken" });
          setSubmitting(false);
          setIsUploading(false);
          setTimeout(() => {
            userNameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            userNameRef.current?.focus();
          }, 100);
          return;
        }

        // 🔹 Email check
        const emailCheck = await fetch("/api/user/profile/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ search: values.email.trim(), excludeProfileId: savedProfileId }),
        }).then((res) => res.json());

        if (emailCheck.exists) {
          setErrors({ email: "Email already taken" });
          setSubmitting(false);
          setIsUploading(false);
          setTimeout(() => {
            emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            emailRef.current?.focus();
          }, 100);
          return;
        }

        // 🔹 Phone check
        const phoneCheck = await fetch("/api/user/phone/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ search: values.phone.trim(), excludeProfileId: savedProfileId }),
        }).then((res) => res.json());

        if (phoneCheck.exists) {
          setErrors({ phone: "Phone number already registered" });
          setSubmitting(false);
          setIsUploading(false);
          setTimeout(() => {
            const el = document.querySelector('input[name="phone"]');
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            (el as HTMLElement)?.focus();
          }, 100);
          return;
        }

        let profileIdToUse: string | null = savedProfileId || null;

        if (profileIdToUse) {
          await fetch("/api/user/update-register", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileIdToUse: profileIdToUse,
              ...values,
              affiliate: aff,
              hitid: hitId,
            }),
          });
        } else {
          const createRes = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...values,
              age: "01/01/0101",
              affiliate: aff,
              hitid: hitId,
            }),
          });

          const createData = await createRes.json();

          if (!createData?.profileId) {
            throw new Error("Profile creation failed");
          }

          const newProfileId: string | undefined = createData?.profileId;

          if (!newProfileId) {
            throw new Error("Profile creation failed");
          }

          profileIdToUse = newProfileId;

          localStorage.setItem("register_profile_id", newProfileId);
          document.cookie = `register_profile_id=${newProfileId}; path=/; max-age=604800; SameSite=Lax`;
        }

        if (profileIdToUse) {
          localStorage.setItem("email", values.email);
          localStorage.setItem("userName", values.user_name);
          localStorage.setItem("password", values.password);
          localStorage.setItem("phone", values.phone);
          localStorage.setItem("logged_in_profile", profileIdToUse);
          document.cookie = `register_profile_id=${profileIdToUse}; path=/; max-age=604800; SameSite=Lax`;

          const verifyRes = await fetch("/api/user/mark-otp-verified", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: profileIdToUse }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.emailVerified === 1) {
            router.push(`/intrested/${profileIdToUse}`);
          } else {
            handleOpen();
          }
        }
      } catch (error) {
        console.error("❌ Registration failed:", error);
        alert("Something went wrong!");
      } finally {
        setIsUploading(false);
        setSubmitting(false);
      }
    },
  });

  const lastSubmitCountRef = useRef(0);
  useEffect(() => {
    if (formik.submitCount > lastSubmitCountRef.current) {
      lastSubmitCountRef.current = formik.submitCount;
      setTimeout(() => {
        const errorFields = Object.keys(formik.errors);
        if (errorFields.length > 0) {
          const firstErrorKey = errorFields[0];

          if (firstErrorKey === "user_name" && userNameRef.current) {
            userNameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            userNameRef.current.focus();
          } else if (firstErrorKey === "email" && emailRef.current) {
            emailRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            emailRef.current.focus();
          } else {
            const fieldIdMap: Record<string, string> = {
              userName: "register-fullname",
              password: "register-password",
              repeatPassword: "register-repeat-password",
              phone: 'input[name="phone"]',
              city: "city-autocomplete",
            };

            const selector = fieldIdMap[firstErrorKey];
            if (selector) {
              const el = selector.includes('[name=')
                ? document.querySelector(selector)
                : document.getElementById(selector);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                (el as HTMLElement).focus();
              }
            }
          }
        }
      }, 100);
    }
  }, [formik.submitCount]);

  // Debounced auto-save to API/database
  useEffect(() => {
    if (!draftLoaded) return;
    if (!formik.dirty) return;

    const delayDebounceFn = setTimeout(() => {
      fetch("/api/user/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formik.values),
      }).catch((err) => console.error("Error saving registration draft:", err));
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [formik.values, draftLoaded, formik.dirty]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ref = document.referrer;
    }
  }, []);

  const handleContinue = async () => {
    const countryCode = formik.values.countryCode.replace("+", "");
    const storedProfileId = localStorage.getItem("register_profile_id") || getCookie("register_profile_id");
    await router.push(`/otp/${storedProfileId}/${countryCode}`);
    handleClose();
  };

  const yourTextFieldSx = {
    mb: 2,

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
    "& .MuiFormHelperText-root": {
      marginLeft: "4px",
      marginTop: "6px",
      fontSize: "12px",
      lineHeight: 1.4,
      textAlign: "left",
    },

    "& .MuiFormHelperText-root.Mui-error": {
      color: "#ff4d6d",
      fontWeight: 400,
    },
  } as const;

  function CustomPopper(props: PopperProps) {
    return <Popper {...props} placement="top-start" />;
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
            component="main"
            maxWidth="sm"
            sx={{ px: { xs: 0, sm: 0, md: 0 }, py: { xs: 0, sm: 0 } }}
          >
            <Paper
              elevation={24}
              sx={{
                p: { xs: 1.5, sm: 3, md: 4 },
                background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
                backdropFilter: "blur(25px)",
                // border: "2px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                color: "#fff",
                overflow: "visible",
              }}
            >
              <Box sx={{ mb: 2, textAlign: "center" }}>
                <Box sx={{ mb: 2 }}>
                  <img
                    src="/logo.png"
                    alt="SwingSocial Logo"
                    style={{
                      width: "250px",
                      height: "auto",
                      display: "block",
                      margin: "0 auto",
                      objectFit: "cover",
                    }}
                  />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textAlign: "center",
                    fontSize: { xs: "1.6rem", sm: "1.9rem" },
                    background:
                      "linear-gradient(90deg, #FF2D55 0%, #FF6A88 40%, #7000FF 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textShadow: "0 4px 20px rgba(255,45,85,0.35)",
                    mt: 1.5,
                    mb: 1,
                  }}
                >
                  Create your account
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                  alignItems="center"
                  sx={{ mb: 2, px: 1 }}
                >
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.75)",
                      fontSize: { xs: "0.85rem", sm: "0.95rem" },
                      textAlign: "center",
                      lineHeight: 1.5,
                      maxWidth: "320px",
                    }}
                  >
                    Join a trusted community — every profile is reviewed to keep
                    things real, safe, and fun.
                  </Typography>
                </Stack>
              </Box>

              <form onSubmit={formik.handleSubmit}>
                <TextField
                  fullWidth
                  id="register-fullname"
                  label="Name (Never shared)"
                  name="userName"
                  placeholder="Your full name"
                  variant="outlined"
                  value={formik.values.userName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  autoComplete="name"
                  inputProps={{ maxLength: 60 }}
                  error={
                    (formik.touched.userName || formik.submitCount > 0) && Boolean(formik.errors.userName)
                  }
                  helperText={(formik.touched.userName || formik.submitCount > 0) && formik.errors.userName}
                  sx={yourTextFieldSx}
                />

                <TextField
                  fullWidth
                  id="register-profilename"
                  label="Profile Name"
                  name="user_name"
                  placeholder="Choose a unique handle"
                  variant="outlined"
                  inputRef={userNameRef}
                  value={formik.values.user_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  autoComplete="username"
                  error={
                    (formik.touched.user_name || formik.submitCount > 0) && Boolean(formik.errors.user_name)
                  }
                  helperText={
                    (formik.touched.user_name || formik.submitCount > 0) && formik.errors.user_name
                  }
                  sx={yourTextFieldSx}
                />

                {/* EMAIL */}
                <TextField
                  fullWidth
                  id="register-email"
                  label="Email"
                  name="email"
                  inputRef={emailRef}
                  placeholder="you@example.com"
                  variant="outlined"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  autoComplete="email"
                  inputProps={{ inputMode: "email", spellCheck: "false" }}
                  error={(formik.touched.email || formik.submitCount > 0) && Boolean(formik.errors.email)}
                  helperText={
                    (formik.touched.email || formik.submitCount > 0) && formik.errors.email
                      ? formik.errors.email
                      : undefined
                  }
                  sx={yourTextFieldSx}
                />

                {/* PASSWORD */}
                <TextField
                  fullWidth
                  id="register-password"
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  variant="outlined"
                  value={formik.values.password}
                  onChange={(e) => {
                    const value = e.target.value;
                    formik.setFieldValue("password", value);
                    const strength = calculatePasswordStrength(value);
                    setPasswordStrength(strength);
                  }}
                  onBlur={formik.handleBlur}
                  autoComplete="new-password"
                  error={
                    formik.touched.password && Boolean(formik.errors.password)
                  }
                  helperText={formik.touched.password && formik.errors.password}
                  sx={yourTextFieldSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          aria-label="toggle password visibility"
                          style={{ color: "white" }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {formik.values.password.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength}
                      color={
                        passwordStrength < 40
                          ? "error"
                          : passwordStrength < 60
                            ? "warning"
                            : "success"
                      }
                      sx={{ height: 8, borderRadius: 4, mt: 1, mb: 0.5 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      Password Strength:
                      <span
                        style={{
                          color:
                            passwordStrength < 40
                              ? "#FF0000"
                              : passwordStrength < 60
                                ? "#FFA000"
                                : "#00C853",
                        }}
                      >
                        {passwordStrength < 40 && "Weak"}
                        {passwordStrength >= 40 &&
                          passwordStrength < 60 &&
                          "Medium"}
                        {passwordStrength >= 60 && "Strong"}
                      </span>
                    </Typography>
                  </Box>
                )}

                <TextField
                  fullWidth
                  id="register-repeat-password"
                  label="Repeat Password"
                  name="repeatPassword"
                  type={checkPassword ? "text" : "password"}
                  variant="outlined"
                  autoComplete="new-password"
                  value={formik.values.repeatPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.repeatPassword &&
                    Boolean(formik.errors.repeatPassword)
                  }
                  helperText={
                    formik.touched.repeatPassword &&
                    formik.errors.repeatPassword
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleToggleCheckPasswordVisibility}
                          edge="end"
                          aria-label="toggle repeat password visibility"
                          style={{ color: "white" }}
                        >
                          {checkPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={yourTextFieldSx}
                />

                <Box
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                      "&:hover fieldset": {
                        borderColor: "rgba(255,255,255,0.4)",
                      },
                    },
                    "& .MuiInputLabel-root": { display: "none" },
                    "& .react-tel-input .form-control": {
                      width: "100%",
                      height: "56px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "white",
                      borderRadius: "12px",
                      border: (formik.touched.phone || formik.submitCount > 0) && Boolean(formik.errors.phone)
                        ? "1px solid #ff4d6d"
                        : "1px solid rgba(255,255,255,0.2)",
                      boxShadow: (formik.touched.phone || formik.submitCount > 0) && Boolean(formik.errors.phone)
                        ? "0 0 0 1px rgba(255,77,109,0.25)"
                        : "none",
                    },
                    "& .react-tel-input .flag-dropdown": {
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#000",
                    },
                  }}
                >
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
                    inputProps={{
                      name: "phone",
                      required: true,
                    }}
                    specialLabel=""
                  />
                  {(formik.touched.phone || formik.submitCount > 0) && formik.errors.phone && (
                    <FormHelperText
                      sx={{
                        color: "#ff4d6d",
                        fontSize: "12px",
                        mt: 0.5,
                        ml: "4px",
                        textAlign: "left",
                      }}
                    >
                      {formik.errors.phone}
                    </FormHelperText>
                  )}
                </Box>

                {/* CITY */}
                <Autocomplete
                  id="city-autocomplete"
                  open={openCity}
                  onOpen={() => setOpenCity(true)}
                  onClose={(event, reason) => {
                    if (isMobile && reason === "blur") return;
                    setOpenCity(false);
                  }}
                  disableClearable
                  disablePortal
                  PopperComponent={CustomPopper}
                  isOptionEqualToValue={(option, value) =>
                    option.City === value.City
                  }
                  getOptionLabel={(option) => option.City}
                  options={cityOption.map((city) => ({
                    ...city,
                    key: city.id,
                  }))}
                  loading={cityLoading}
                  inputValue={cityInput}
                  onInputChange={(event, newInputValue) => {
                    if (event?.type === "change" || event?.type === "click") {
                      setCityInput(newInputValue);
                    }
                  }}
                  onChange={(event, newValue) => {
                    if (newValue?.City) {
                      formik.setFieldValue("city", newValue.City);
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name="city"
                      variant="outlined"
                      label="City"
                      autoComplete="address-level2"
                      error={(formik.touched.city || formik.submitCount > 0) && Boolean(formik.errors.city)}
                      helperText={(formik.touched.city || formik.submitCount > 0) && formik.errors.city}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {cityLoading ? (
                              <CircularProgress color="inherit" size={15} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={yourTextFieldSx}
                    />
                  )}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      name="consent"
                      checked={formik.values.consent}
                      onChange={formik.handleChange}
                      sx={{
                        color: "#fff",
                        p: 0.5,
                        marginRight: "5px",
                        "& .MuiSvgIcon-root": { fontSize: 22 },
                      }}
                    />
                  }
                  label={
                    <Typography
                      component="span"
                      sx={{
                        color: "#ddd",
                        fontSize: { xs: "0.85rem", sm: "0.95rem" },
                        lineHeight: 1.5,
                        whiteSpace: "normal",
                      }}
                    >
                      I agree to the{" "}
                      <Link
                        href="https://swingsocial.co/privacy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#c2185b",
                          textDecoration: "underline",
                          fontWeight: 500,
                        }}
                      >
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="https://swingsocial.co/terms-and-conditions/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#c2185b",
                          textDecoration: "underline",
                          fontWeight: 500,
                        }}
                      >
                        Terms of Use
                      </Link>
                      .
                    </Typography>
                  }
                  sx={{
                    alignItems: "center", // keeps checkbox at top
                    mt: 0.3,
                    ml: 0,
                  }}
                />

                {(formik.touched.consent || formik.submitCount > 0) && formik.errors.consent && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#ff4d6d",
                      display: "block",
                      mt: 0.5,
                      ml: "4px",
                      fontSize: "12px",
                      textAlign: "left",
                    }}
                  >
                    {formik.errors.consent}
                  </Typography>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      name="isAdult"
                      checked={formik.values.isAdult}
                      onChange={(e) => {
                        formik.setFieldValue("isAdult", e.target.checked);
                      }}
                      sx={{
                        color: "#fff",
                        p: 0.5,
                        marginRight: "5px",
                        "& .MuiSvgIcon-root": { fontSize: 22 },
                      }}
                    />
                  }
                  label={
                    <Typography
                      component="span"
                      sx={{
                        color: "#ddd",
                        fontSize: { xs: "0.85rem", sm: "0.95rem" },
                        lineHeight: 1.5,
                      }}
                    >
                      I confirm that I am 18 years of age or older.
                    </Typography>
                  }
                  sx={{
                    alignItems: "center",
                    mt: 0.5,
                    ml: 0,
                  }}
                />

                {(formik.touched.isAdult || formik.submitCount > 0) && formik.errors.isAdult && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#ff4d6d",
                      display: "block",
                      mt: 0.5,
                      ml: "4px",
                      fontSize: "12px",
                      textAlign: "left",
                    }}
                  >
                    {formik.errors.isAdult}
                  </Typography>
                )}

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.5,
                    mt: 2,
                    mb: 2,
                  }}
                >
                  <Button
                    type="submit"
                    disabled={isUploading}
                    sx={{
                      flex: 1,
                      maxWidth: 220,
                      height: 52,
                      borderRadius: "14px",
                      background:
                        "linear-gradient(90deg, #FF2D6B 0%, #7C4DFF 100%)",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      "&:hover": {
                        opacity: 0.88,
                      },
                      "&:disabled": { opacity: 0.4 },
                    }}
                  >
                    {isUploading ? (
                      <CircularProgress size={22} sx={{ color: "#fff" }} />
                    ) : (
                      <>
                        {" "}
                        Continue{" "}
                        <ArrowForwardIosIcon sx={{ fontSize: 13 }} />{" "}
                      </>
                    )}
                  </Button>
                </Box>
              </form>

              <Stack spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                <Typography
                  sx={{
                    color: "#c2185b",
                    fontWeight: "bold",
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                  }}
                >
                  Come party with us
                </Typography>
              </Stack>

              <PolicyRow supportEmail={supportEmail} />

              <Link
                href="/login"
                style={{
                  color: "#c2185b",
                  marginTop: 8,
                  textDecoration: "underline",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                Already have an account? Login
              </Link>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>

      <Dialog
        open={open}
        onClose={handleClose}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(6px)",
          },
        }}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 380,
            borderRadius: 4,
            p: 3,
            background: "rgba(20, 10, 35, 0.85)",
            backdropFilter: "blur(25px)",
            border: "2px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            color: "#fff",
            position: "relative",
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 10,
            top: 10,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <CloseIcon />
        </IconButton>

        <Stack spacing={3} alignItems="center" textAlign="center">
          {/* Gradient Icon */}
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
            <PhoneAndroidIcon sx={{ fontSize: 30, color: "#fff" }} />
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            Confirm Your Phone Number
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
            }}
          >
            We’ll send a secure one-time verification code to your registered
            phone number to confirm your identity.
          </Typography>

          {/* Buttons */}
          <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClose}
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

            <Button
              fullWidth
              onClick={handleContinue}
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
              Send Code
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </>
  );
};

export default RegisterPage;
