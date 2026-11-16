"use client";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  createTheme,
  Paper,
  ThemeProvider,
  Typography,
  useMediaQuery,
  LinearProgress,
  Stack,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Carousel from "@/commonPage/Carousel";
import ParticleField from "@/components/ParticleField";

const C = {
  bg: "#0D0B1E",
  card: "#13112A",
  cardBorder: "rgba(124,77,255,0.18)",
  inputBg: "#1A1535",
  inputBorder: "rgba(124,77,255,0.22)",
  inputFocus: "rgba(124,77,255,0.55)",
  textPrimary: "#FFFFFF",
  textSub: "rgba(255,255,255,0.60)",
  textMuted: "rgba(255,255,255,0.35)",
  accent: "#7C4DFF",
  rose: "#FF2D6B",
  gradBtn: "linear-gradient(90deg, #FF2D6B 0%, #7C4DFF 100%)",
  success: "#00D084",
  warning: "#FFA733",
  error: "#FF4E6A",
  placeholder: "rgba(255,255,255,0.22)",
  divider: "rgba(124,77,255,0.15)",
  charCount: "rgba(255,255,255,0.28)",
} as const;

const theme = createTheme({
  palette: {
    primary: { main: "#FF2D6B", light: "#FF6B95", dark: "#CC2456" },
    secondary: { main: "#7C4DFF", light: "#B47EFF", dark: "#5A35CC" },
    success: { main: "#00D084" },
    background: { default: C.bg },
  },
});

type StrengthLevel = "empty" | "weak" | "medium" | "good" | "great";

const getTaglineStrength = (val: string): StrengthLevel => {
  const len = val.trim().length;
  if (!len) return "empty";
  if (len < 8) return "weak";
  if (len < 20) return "medium";
  if (len < 50) return "good";
  return "great";
};

const getAboutStrength = (val: string): StrengthLevel => {
  const len = val.trim().length;
  if (!len) return "empty";
  if (len < 20) return "weak";
  if (len < 60) return "medium";
  if (len < 150) return "good";
  return "great";
};

const strengthConfig: Record<
  StrengthLevel,
  { pct: number; label: string; color: string }
> = {
  empty: { pct: 0, label: "", color: "rgba(124,77,255,0.3)" },
  weak: { pct: 25, label: "Too short", color: C.error },
  medium: { pct: 55, label: "Getting there…", color: C.warning },
  good: { pct: 80, label: "Looking good!", color: C.accent },
  great: { pct: 100, label: "Excellent!", color: C.success },
};

type FieldStrengthBarProps = {
  value: string;
  getStrength: (val: string) => StrengthLevel;
  emptyLabel: string;
};

const FieldStrengthBar = ({
  value,
  getStrength,
  emptyLabel,
}: FieldStrengthBarProps) => {
  const level = getStrength(value);
  const cfg = strengthConfig[level];
  return (
    <Box sx={{ mt: 1 }}>
      <LinearProgress
        variant="determinate"
        value={cfg.pct}
        sx={{
          height: 4,

          borderRadius: 2,
          backgroundColor: "rgba(124,77,255,0.18)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: cfg.color,
            transition: "transform 0.35s ease, background-color 0.35s ease",
          },
        }}
      />
      {(cfg.label || level === "empty") && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            fontSize: "11px",
            color: level === "empty" ? C.textSub : cfg.color,
            transition: "color 0.3s",
          }}
        >
          {level === "empty" ? emptyLabel : cfg.label}
        </Typography>
      )}
    </Box>
  );
};

const textareaBaseSx = (hasContent: boolean, hasError: boolean) => ({
  width: "100%",
  background: "rgba(255,255,255,0.02)", // softer bg
  border: `1px solid ${hasError
      ? C.error
      : hasContent
        ? "rgba(124,77,255,0.35)"
        : "rgba(255,255,255,0.08)"
    }`,
  borderRadius: "14px",
  color: "#fff",
  fontSize: "14px",
  lineHeight: 1.6,
  padding: "14px 16px",
  resize: "none",
  outline: "none",
  fontFamily: "inherit",
  transition: "all 0.25s ease",

  // 👇 subtle inner shadow like input fields
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",

  "&:focus": {
    borderColor: "#7C4DFF",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 0 0 2px rgba(124,77,255,0.25)", // glow effect
  },

  "&::placeholder": {
    color: "rgba(255,255,255,0.35)",
    fontStyle: "normal",
    whiteSpace: "pre-line",
  },
});

type Params = Promise<{ id: string }>;

export default function About(props: { params: Params }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    props.params.then((p) => setId(p.id));
  }, [props.params]);

  const validationSchema = Yup.object({
    tagline: Yup.string().required("Tagline is required."),
    about: Yup.string()
      .required("About me is required.")
      .min(20, "About must be at least 20 characters."),
  });

  const savedDraft = useMemo(() => {
    if (!id || typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem(`register_step5_${id}`) || "null");
  }, [id]);

  // test

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: savedDraft || { tagline: "", about: "" },
    validationSchema,
    onSubmit: async (values) => {
      setIsUploading(true);
      try {
        const res = await fetch("/api/user/about", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pid: id,
            aboutme: values.about,
            tagline: values.tagline,
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        await router.push(`/plan/${id}`);
      } catch (err) {
        console.error(err);
        setIsUploading(false);
      }
    },
  });

  useEffect(() => {
    if (id)
      localStorage.setItem(
        `register_step5_${id}`,
        JSON.stringify(formik.values),
      );
  }, [JSON.stringify(formik.values), id]);

  const fieldLabelSx = {
    fontSize: "13px",
    fontWeight: 500,
    color: "rgba(255,255,255,0.75)",
    mb: 0.5,
  };

  return (
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
              p: { xs: 2, sm: 3, md: 4 },
              background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
              backdropFilter: "blur(25px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              color: "#fff",
              overflow: "visible",
            }}
          >
            {/* ── Header ── */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
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
                Tell us about yourself
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
                  This shows on your public profile and helps others connect
                  with you.
                </Typography>
              </Stack>
            </Box>

            <form onSubmit={formik.handleSubmit}>
              {/* ── Tagline ── */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={fieldLabelSx}>
                  Tagline{" "}
                  <Box component="span" sx={{ color: C.rose }}>
                    *
                  </Box>
                </Typography>

                <Box sx={{ position: "relative" }}>
                  <Box
                    component="textarea"
                    id="tagline"
                    name="tagline"
                    rows={4}
                    maxLength={100}
                    placeholder={`Example:
Easy-going couple looking to connect`}
                    value={formik.values.tagline}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    sx={textareaBaseSx(
                      !!formik.values.tagline,
                      !!(formik.touched.tagline && formik.errors.tagline),
                    )}
                  />
                  <Typography
                    sx={{
                      position: "absolute",
                      bottom: "10px",
                      right: "14px",
                      fontSize: "11px",
                      pointerEvents: "none",
                      color:
                        formik.values.tagline.length > 85
                          ? C.warning
                          : C.charCount,
                    }}
                  >
                    {formik.values.tagline.length} / 100
                  </Typography>
                </Box>

                {formik.touched.tagline && formik.errors.tagline && (
                  <Typography
                    sx={{ fontSize: "11px", color: C.error, mt: 0.75 }}
                  >
                    {formik.errors.tagline as string}
                  </Typography>
                )}
                <FieldStrengthBar
                  value={formik.values.tagline}
                  getStrength={getTaglineStrength}
                  emptyLabel="Start typing your tagline"
                />
              </Box>

              {/* Divider */}
              <Box
                sx={{
                  height: "1px",
                  background: `linear-gradient(90deg, transparent, ${C.divider}, transparent)`,
                  my: 2.5,
                }}
              />

              {/* ── About ── */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={fieldLabelSx}>
                  About me{" "}
                  <Box component="span" sx={{ color: C.rose }}>
                    *
                  </Box>
                </Typography>

                <Box sx={{ position: "relative" }}>
                  <Box
                    component="textarea"
                    id="about"
                    name="about"
                    rows={4}
                    maxLength={500}
                    placeholder={`Example:
We are an easy-going couple who enjoy traveling, meeting new people, and having fun conversations.`}
                    value={formik.values.about}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    sx={textareaBaseSx(
                      !!formik.values.about,
                      !!(formik.touched.about && formik.errors.about),
                    )}
                  />
                  <Typography
                    sx={{
                      position: "absolute",
                      bottom: "10px",
                      right: "14px",
                      fontSize: "11px",
                      pointerEvents: "none",
                      color:
                        formik.values.about.length > 430
                          ? C.warning
                          : formik.values.about.length >= 20
                            ? C.success
                            : C.charCount,
                    }}
                  >
                    {formik.values.about.length} / 500
                  </Typography>
                </Box>

                {formik.touched.about && formik.errors.about && (
                  <Typography
                    sx={{ fontSize: "11px", color: C.error, mt: 0.75 }}
                  >
                    {formik.errors.about as string}
                  </Typography>
                )}
                <FieldStrengthBar
                  value={formik.values.about}
                  getStrength={getAboutStrength}
                  emptyLabel="Minimum 20 characters required"
                />
              </Box>

              {/* ── Actions ── */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  mt: 1,
                  mb: 2,
                }}
              >
                <Button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isUploading}
                  sx={{
                    width: 52,
                    height: 52,
                    minWidth: 52,
                    borderRadius: "50%",
                    backgroundColor: "rgba(124,77,255,0.10)",
                    border: "1px solid rgba(124,77,255,0.25)",
                    color: "#fff",
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor: "rgba(124,77,255,0.20)",
                      borderColor: C.accent,
                    },
                  }}
                >
                  <ArrowBackIcon fontSize="small" />
                </Button>

                <Button
                  type="submit"
                  disabled={isUploading}
                  sx={{
                    flex: 1,
                    maxWidth: 220,
                    height: 52,
                    borderRadius: "14px",
                    background: C.gradBtn,
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

            <Carousel title="This is the last screen!" />
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
