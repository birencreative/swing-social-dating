"use client";
import React, { useEffect, useMemo, memo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  createTheme,
  Grid,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Carousel from "@/commonPage/Carousel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Drawer from "@mui/material/Drawer";
import ParticleField from "@/components/ParticleField";

const theme = createTheme({
  palette: {
    primary: { main: "#FF2D55", light: "#FF617B", dark: "#CC1439" },
    secondary: { main: "#7000FF", light: "#9B4DFF", dark: "#5200CC" },
    success: { main: "#00D179" },
    background: { default: "#0A0118" },
  },
});

// ── Shared design tokens ──────────────────────────────────────────────
const FIELD_BG = "rgba(255,255,255,0.04)";
const FIELD_BG_SELECTED = "rgba(255,45,85,0.06)";
const BORDER_DEFAULT = "rgba(255,255,255,0.1)";
const BORDER_SELECTED = "rgba(255,45,85,0.4)";
const BORDER_HOVER = "rgba(255,45,85,0.5)";
const BORDER_ERROR = "#FF2D55";
const BORDER_FOCUS = "#FF2D55";
const LABEL_COLOR = "rgba(255,255,255,0.5)";
const TEXT_COLOR = "#fff";
const TEXT_PLACEHOLDER = "rgba(255,255,255,0.25)";

const linkSx = {
  mb: 2,
  "& .MuiOutlinedInput-root": {
    color: TEXT_COLOR,
    backgroundColor: FIELD_BG,
    borderRadius: "12px",
    textAlign: "left",
    "& fieldset": { borderColor: BORDER_DEFAULT },
    "&:hover fieldset": { borderColor: BORDER_HOVER },
    "&.Mui-focused fieldset": {
      borderColor: BORDER_FOCUS,
      borderWidth: "1.5px",
    },
    "&.Mui-error fieldset": { borderColor: BORDER_ERROR },
  },
  "& .MuiInputLabel-root": { color: LABEL_COLOR },
  "& .MuiInputLabel-root.Mui-focused": { color: BORDER_FOCUS },
  "& .MuiInputLabel-root.Mui-error": { color: BORDER_ERROR },
  "& .MuiFormHelperText-root": {
    color: BORDER_ERROR,
    fontSize: "0.75rem",
    ml: 0,
  },
} as const;

const emptyValues = {
  selectedOption: "",
  age: "",
  gender: "",
  sexualOrientation: "",
  partnerBirthday: "",
  partnerGender: "",
  partnerOrientation: "",
};

const drawerOptions: Record<string, { label: string; value: string }[]> = {
  selectedOption: [
    { label: "Man", value: "Male" },
    { label: "Woman", value: "Woman" },
    { label: "Throuple", value: "Throuple" },
    { label: "Couple", value: "Couple" },
  ],
  sexualOrientation: [
    { label: "Straight", value: "Straight" },
    { label: "Bisexual", value: "Bisexual" },
    { label: "Gay", value: "Gay" },
    { label: "Lesbian", value: "Lesbian" },
    { label: "Pansexual", value: "Pansexual" },
  ],
  gender: [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ],
  partnerGender: [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ],
  partnerOrientation: [
    { label: "Straight", value: "Straight" },
    { label: "Bisexual", value: "Bisexual" },
    { label: "Gay", value: "Gay" },
    { label: "Lesbian", value: "Lesbian" },
    { label: "Pansexual", value: "Pansexual" },
  ],
};

const drawerLabels: Record<string, string> = {
  selectedOption: "I am a",
  sexualOrientation: "Sexual Orientation",
  gender: "Gender",
  partnerGender: "Partner's Gender",
  partnerOrientation: "Partner's Orientation",
};

function BottomDrawerPicker({
  fieldName,
  value,
  openDrawer,
  setOpenDrawer,
  setFieldValue,
  error,
  helperText,
}: {
  fieldName: string;
  value: string;
  openDrawer: string | null;
  setOpenDrawer: (v: string | null) => void;
  setFieldValue: (field: string, value: string) => void;
  error?: boolean;
  helperText?: string;
}) {
  const options = drawerOptions[fieldName] || [];
  const label = drawerLabels[fieldName] || fieldName;
  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const borderColor = error
    ? BORDER_ERROR
    : selectedLabel
      ? BORDER_DEFAULT
      : BORDER_DEFAULT;

  const bgColor = selectedLabel ? FIELD_BG_SELECTED : FIELD_BG;

  return (
    <>
      {/* Trigger Button */}
      <Box
        onClick={() => setOpenDrawer(fieldName)}
        sx={{
          mb: 2,
          px: 2,
          py: 1.8,
          borderRadius: "12px",
          background: FIELD_BG,
          border: `1px solid ${borderColor}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            border: `1px solid ${BORDER_HOVER}`,
            background: "rgba(255,45,85,0.05)",
          },
        }}
      >
        <Box sx={{ textAlign: "left" }}>
          <Typography
            sx={{
              color: LABEL_COLOR,
              fontSize: "0.75rem",
              mb: 0.3,
              letterSpacing: "0.02em",
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              color: selectedLabel ? TEXT_COLOR : TEXT_PLACEHOLDER,
              fontSize: "0.95rem",
              fontWeight: selectedLabel ? 600 : 400,
            }}
          >
            {selectedLabel || `Select ${label}`}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            background: selectedLabel
              ? "linear-gradient(135deg, #FF2D55, #7000FF)"
              : "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
        >
          <ArrowForwardIosIcon sx={{ color: "#fff", fontSize: "0.75rem" }} />
        </Box>
      </Box>

      {error && helperText && (
        <Typography
          sx={{
            color: BORDER_ERROR,
            fontSize: "0.75rem",
            mt: -1.5,
            mb: 1.5,
            ml: 0,
            textAlign: "left",
          }}
        >
          {helperText}
        </Typography>
      )}

      {/* Bottom Drawer */}
      <Drawer
        anchor="bottom"
        open={openDrawer === fieldName}
        onClose={() => setOpenDrawer(null)}
        PaperProps={{
          sx: {
            background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            pb: 5,
            maxWidth: 680,
            mx: "auto",
            left: 0,
            right: 0,
          },
        }}
      >
        {/* Drag handle */}
        <Box
          sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5 }}
        >
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 99,
              backgroundColor: "rgba(255,255,255,0.15)",
            }}
          />
        </Box>

        {/* Header */}
        <Box sx={{ px: 3, pt: 2, pb: 2.5 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #FF2D55, #7000FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ArrowForwardIosIcon
                sx={{ color: "#fff", fontSize: "0.85rem" }}
              />
            </Box>
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.1rem",
                letterSpacing: 0.2,
              }}
            >
              {label}
            </Typography>
          </Box>
          <Box
            sx={{
              height: "1.5px",
              background:
                "linear-gradient(90deg, transparent, #FF2D55, #7000FF, transparent)",
              mt: 2,
              borderRadius: 99,
            }}
          />
        </Box>

        {/* Options */}
        <Box sx={{ px: 2 }}>
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <Box
                key={opt.value}
                onClick={() => {
                  setFieldValue(fieldName, opt.value);
                  setOpenDrawer(null);
                }}
                sx={{
                  px: 2.5,
                  py: 1.8,
                  mb: 1,
                  borderRadius: "14px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: isSelected ? FIELD_BG_SELECTED : FIELD_BG,
                  border: `1px solid ${isSelected ? BORDER_SELECTED : BORDER_DEFAULT}`,
                  transition: "all 0.18s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,45,85,0.08)",
                    border: `1px solid ${BORDER_HOVER}`,
                  },
                }}
              >
                <Typography
                  sx={{
                    color: isSelected ? TEXT_COLOR : "rgba(255,255,255,0.75)",
                    fontSize: "0.95rem",
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  {opt.label}
                </Typography>

                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: isSelected
                      ? "linear-gradient(135deg, #FF2D55, #7000FF)"
                      : "transparent",
                    border: isSelected
                      ? "none"
                      : `1.5px solid ${BORDER_DEFAULT}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.18s ease",
                  }}
                >
                  {isSelected && (
                    <Typography
                      sx={{
                        color: "#fff",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Drawer>
    </>
  );
}

export default function ShowInterest({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedValues, setFetchedValues] = useState<typeof emptyValues | null>(
    null,
  );
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await params;
      setId(p.id);
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/user/sweeping/user?id=${id}`);
        const data = await res.json();
        const user = data?.user;
        if (!user?.AccountType) return;
        setFetchedValues({
          selectedOption: user.AccountType || "",
          age: user.Age ? String(user.Age) : "",
          gender: user.Gender || "",
          sexualOrientation: user.SexualOrientation || "",
          partnerBirthday: user.PartnerAge ? String(user.PartnerAge) : "",
          partnerGender: user.PartnerGender || "",
          partnerOrientation: user.PartnerSexualOrientation || "",
        });
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    fetchUserData();
  }, [id]);

  const validationSchema = Yup.object({
    selectedOption: Yup.string().required("Please select an option"),
    age: Yup.string().when("selectedOption", {
      is: (val: string) =>
        ["Male", "Woman", "Throuple", "Couple"].includes(val),
      then: (schema) => schema.required("Age is required").test(
        "is-18",
        "Age must be 18 or older",
        (val) => {
          if (!val) return false;
          const num = parseInt(val, 10);
          return !isNaN(num) && num >= 18;
        }
      ),
    }),
    gender: Yup.string().when("selectedOption", {
      is: (val: string) => ["Throuple", "Couple"].includes(val),
      then: (schema) => schema.required("Gender is required"),
    }),
    sexualOrientation: Yup.string().required("Sexual orientation is required"),
    partnerBirthday: Yup.string().when("selectedOption", {
      is: (val: string) => ["Throuple", "Couple"].includes(val),
      then: (schema) => schema.required("Partner's age is required").test(
        "is-18",
        "Partner must be 18 or older",
        (val) => {
          if (!val) return false;
          const num = parseInt(val, 10);
          return !isNaN(num) && num >= 18;
        }
      ),
    }),
    partnerGender: Yup.string().when("selectedOption", {
      is: (val: string) => ["Throuple", "Couple"].includes(val),
      then: (schema) => schema.required("Partner's gender is required"),
    }),
    partnerOrientation: Yup.string().when("selectedOption", {
      is: (val: string) => ["Throuple", "Couple"].includes(val),
      then: (schema) => schema.required("Partner's orientation is required"),
    }),
  });

  const handleSubmit = async (values: typeof emptyValues) => {
    setLoading(true);
    const isSingle =
      values.selectedOption === "Woman" || values.selectedOption === "Male";

    const requestBody = isSingle
      ? {
        pid: id,
        accounttype: values.selectedOption,
        age: values.age,
        orientation1: values.sexualOrientation,
        gender1: values.selectedOption === "Woman" ? "Female" : "Male",
      }
      : {
        pid: id,
        accounttype: values.selectedOption,
        gender1: values.gender,
        age: values.age,
        orientation1: values.sexualOrientation,
        partnerbirthday: values.partnerBirthday,
        partnergender: values.partnerGender,
        partnerorientation: values.partnerOrientation,
      };

    const url = isSingle
      ? "/api/user/intrested"
      : "/api/user/intrested/partner";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error("Failed to submit form");
      await router.push(`/upload/${id}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          // pt: { xs: 3, sm: 5 },
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          width: "100%",
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
              color: "#fff",
              overflow: "visible",
            }}
          >
            <Formik
              initialValues={fetchedValues ?? emptyValues}
              validationSchema={validationSchema}
              enableReinitialize
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, handleChange, setFieldValue }) => (
                <Form>
                  <Grid item xs={12} sx={{ textAlign: "center" }}>
                    <Grid
                      item
                      xs={12}
                      sx={{ textAlign: "center", mb: { xs: 2, sm: 3 } }}
                    >
                      <Typography
                        variant="h6"
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
                        }}
                      >
                        Tell Us About Yourself
                      </Typography>
                      {/* <Typography
                        sx={{
                          color: "#bbb",
                          fontSize: { xs: "0.85rem", sm: "1rem" },
                          maxWidth: { xs: "90%", sm: "420px" },
                          margin: "0 auto",
                          lineHeight: 1.5,
                          px: { xs: 1, sm: 0 },
                        }}
                      >
                        Choose your identity and share a few details so we can
                        personalize your experience.
                      </Typography> */}
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
                          Choose your identity and share a few details so we can
                          personalize your experience.
                        </Typography>
                      </Stack>
                    </Grid>

                    <BottomDrawerPicker
                      fieldName="selectedOption"
                      value={values.selectedOption}
                      openDrawer={openDrawer}
                      setOpenDrawer={setOpenDrawer}
                      setFieldValue={setFieldValue}
                      error={
                        touched.selectedOption && Boolean(errors.selectedOption)
                      }
                      helperText={
                        touched.selectedOption &&
                          typeof errors.selectedOption === "string"
                          ? errors.selectedOption
                          : ""
                      }
                    />

                    {["Male", "Woman"].includes(values.selectedOption) ? (
                      <>
                        <TextField
                          fullWidth
                          label="Age"
                          name="age"
                          placeholder="What's your age?"
                          variant="outlined"
                          value={values.age}
                          type="tel"
                          autoComplete="tel"
                          onChange={handleChange}
                          error={!!(touched.age && errors.age)}
                          helperText={
                            touched.age && typeof errors.age === "string"
                              ? errors.age
                              : ""
                          }
                          sx={linkSx}
                        />
                        <BottomDrawerPicker
                          fieldName="sexualOrientation"
                          value={values.sexualOrientation}
                          openDrawer={openDrawer}
                          setOpenDrawer={setOpenDrawer}
                          setFieldValue={setFieldValue}
                          error={
                            touched.sexualOrientation &&
                            Boolean(errors.sexualOrientation)
                          }
                          helperText={
                            touched.sexualOrientation &&
                              typeof errors.sexualOrientation === "string"
                              ? errors.sexualOrientation
                              : ""
                          }
                        />
                      </>
                    ) : ["Throuple", "Couple"].includes(
                      values.selectedOption,
                    ) ? (
                      <>
                        <Typography
                          variant="h6"
                          sx={{
                            color: "#fff",
                            fontWeight: "bold",
                            mb: 2,
                            textAlign: "left",
                          }}
                        >
                          My Information
                        </Typography>

                        <TextField
                          fullWidth
                          label="Age"
                          name="age"
                          placeholder="What's your age?"
                          variant="outlined"
                          value={values.age}
                          type="tel"
                          autoComplete="tel"
                          onChange={handleChange}
                          error={!!(touched.age && errors.age)}
                          helperText={
                            touched.age && typeof errors.age === "string"
                              ? errors.age
                              : ""
                          }
                          sx={linkSx}
                        />
                        <BottomDrawerPicker
                          fieldName="gender"
                          value={values.gender}
                          openDrawer={openDrawer}
                          setOpenDrawer={setOpenDrawer}
                          setFieldValue={setFieldValue}
                          error={touched.gender && Boolean(errors.gender)}
                          helperText={
                            touched.gender && typeof errors.gender === "string"
                              ? errors.gender
                              : ""
                          }
                        />
                        <BottomDrawerPicker
                          fieldName="sexualOrientation"
                          value={values.sexualOrientation}
                          openDrawer={openDrawer}
                          setOpenDrawer={setOpenDrawer}
                          setFieldValue={setFieldValue}
                          error={
                            touched.sexualOrientation &&
                            Boolean(errors.sexualOrientation)
                          }
                          helperText={
                            touched.sexualOrientation &&
                              typeof errors.sexualOrientation === "string"
                              ? errors.sexualOrientation
                              : ""
                          }
                        />

                        <Typography
                          variant="h6"
                          sx={{
                            color: "#fff",
                            fontWeight: "bold",
                            mt: 2,
                            mb: 2,
                            textAlign: "left",
                          }}
                        >
                          Your Partner's Info
                        </Typography>

                        <TextField
                          fullWidth
                          name="partnerBirthday"
                          label="Partner's age"
                          placeholder="What's your Partner's age?"
                          variant="outlined"
                          value={values.partnerBirthday}
                          type="tel"
                          autoComplete="tel"
                          onChange={handleChange}
                          error={
                            !!(
                              touched.partnerBirthday && errors.partnerBirthday
                            )
                          }
                          helperText={
                            touched.partnerBirthday &&
                              typeof errors.partnerBirthday === "string"
                              ? errors.partnerBirthday
                              : ""
                          }
                          sx={linkSx}
                        />
                        <BottomDrawerPicker
                          fieldName="partnerGender"
                          value={values.partnerGender}
                          openDrawer={openDrawer}
                          setOpenDrawer={setOpenDrawer}
                          setFieldValue={setFieldValue}
                          error={
                            touched.partnerGender &&
                            Boolean(errors.partnerGender)
                          }
                          helperText={
                            touched.partnerGender &&
                              typeof errors.partnerGender === "string"
                              ? errors.partnerGender
                              : ""
                          }
                        />
                        <BottomDrawerPicker
                          fieldName="partnerOrientation"
                          value={values.partnerOrientation}
                          openDrawer={openDrawer}
                          setOpenDrawer={setOpenDrawer}
                          setFieldValue={setFieldValue}
                          error={
                            touched.partnerOrientation &&
                            Boolean(errors.partnerOrientation)
                          }
                          helperText={
                            touched.partnerOrientation &&
                              typeof errors.partnerOrientation === "string"
                              ? errors.partnerOrientation
                              : ""
                          }
                        />
                      </>
                    ) : null}
                  </Grid>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1.5,
                      mt: 4,
                      mb: 2,
                    }}
                  >
                    <Button
                      type="button"
                      onClick={() => router.back()}
                      disabled={loading}
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
                          borderColor:
                            "linear-gradient(90deg, #FF2D6B 0%, #7C4DFF 100%)",
                        },
                      }}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading}
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
                      {loading ? (
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

                  <Grid item xs={12} sx={{ textAlign: "center", mt: 4 }}>
                    <Typography sx={{ color: "#c2185b", fontWeight: "bold" }}>
                      Come party with us
                    </Typography>
                  </Grid>
                </Form>
              )}
            </Formik>
            <Carousel title="Wild Events and Real Profiles are Waiting!" />
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
