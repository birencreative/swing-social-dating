"use client";
import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Typography,
  Divider,
  Drawer,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  sharedDrawerProps,
  headerHeight,
  FloatingSaveBtn,
} from "./SharedHelper";

interface AboutMeDrawerProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  data: {
    Tagline: string;
    About: string;
  };
  onSuccess: (updatedData: any) => void;
  onNotify: (message: string, severity: "success" | "error" | "info") => void;
}

const validationSchema = Yup.object().shape({
  Tagline: Yup.string()
    .max(100, "Tagline must be less than 100 characters")
    .required("Tagline is required"),
  About: Yup.string()
    .min(20, "Minimum 20 characters required")
    .max(500, "Bio must be less than 500 characters")
    .required("About section is required"),
});

const AboutMeDrawer: React.FC<AboutMeDrawerProps> = ({
  open,
  onClose,
  profileId,
  data,
  onSuccess,
  onNotify,
}) => {
  const formik = useFormik({
    initialValues: {
      Tagline: data.Tagline || "",
      About: data.About || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const res = await fetch("/api/user/profile/update/about", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ProfileId: profileId,
            Tagline: values.Tagline,
            About: values.About,
          }),
        });

        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.message || "Failed to update profile content");
        }

        onNotify("Profile content updated successfully!", "success");
        onSuccess(values);
        onClose();
      } catch (error: any) {
        console.error(error);
        onNotify(error.message, "error");
      }
    },
  });

  // Reset form when drawer opens to ensure fresh data
  useEffect(() => {
    if (open) {
      formik.resetForm({
        values: {
          Tagline: data.Tagline || "",
          About: data.About || "",
        }
      });
    }
  }, [open, data]);

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

        <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 4 }}>
          <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 1, color: "#fff" }}>
            Edit About Me
          </Typography>
          <Typography align="center" sx={{ color: "rgba(255,255,255,0.5)", mb: 4, fontSize: "0.95rem" }}>
            Share your story and catch attention with a great tagline.
          </Typography>

          <Stack spacing={3}>
            {/* Tagline Section */}
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem", mb: 1.5, fontWeight: 600, letterSpacing: "0.5px" }}>
                Tagline <span style={{ color: "#ff2d55" }}>*</span>
              </Typography>

              <Box sx={{
                position: "relative",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "20px",
                border: `1px solid ${formik.touched.Tagline && formik.errors.Tagline ? "#ff2d55" : "rgba(255, 255, 255, 0.08)"}`,
                minHeight: "150px",
                p: "20px",
                transition: "all 0.3s ease",
                "&:focus-within": {
                  background: "rgba(255, 255, 255, 0.05)",
                  borderColor: formik.touched.Tagline && formik.errors.Tagline ? "#ff2d55" : "rgba(255, 255, 255, 0.15)",
                }
              }}>
                {!formik.values.Tagline && (
                  <Box sx={{ position: "absolute", top: 20, left: 20, pointerEvents: "none", opacity: 0.25 }}>
                    <Typography sx={{ color: "#fff", fontSize: "0.95rem", mb: 0.5, fontWeight: 500 }}>Example:</Typography>
                    <Typography sx={{ color: "#fff", fontSize: "0.95rem", fontWeight: 400 }}>Easy-going couple looking to connect</Typography>
                  </Box>
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="Tagline"
                  value={formik.values.Tagline}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      fontSize: "1rem",
                      p: 0,
                      alignItems: "flex-start",
                      minHeight: "110px",
                    },
                    "& .MuiInputBase-input": {
                      lineHeight: 1.6,
                    }
                  }}
                />

                <Typography sx={{
                  position: "absolute",
                  bottom: 16,
                  right: 20,
                  color: formik.touched.Tagline && formik.errors.Tagline ? "#ff2d55" : "rgba(255,255,255,0.25)",
                  fontSize: "0.75rem",
                  fontWeight: 600
                }}>
                  {formik.values.Tagline.length} / 100
                </Typography>
              </Box>

              <Box sx={{ width: "100%", height: "2px", background: formik.touched.Tagline && formik.errors.Tagline ? "#ff2d55" : "rgba(112, 0, 255, 0.25)", mt: 1, borderRadius: 1 }} />
              <Typography sx={{
                color: formik.touched.Tagline && formik.errors.Tagline ? "#ff2d55" : "rgba(255,255,255,0.4)",
                fontSize: "0.8rem",
                mt: 1,
                fontWeight: 500,
                ml: 0.5
              }}>
                {formik.touched.Tagline && formik.errors.Tagline ? formik.errors.Tagline : "Start typing your tagline"}
              </Typography>
            </Box>

            {/* About Me Section */}
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem", mb: 1.5, fontWeight: 600, letterSpacing: "0.5px" }}>
                About me <span style={{ color: "#ff2d55" }}>*</span>
              </Typography>

              <Box sx={{
                position: "relative",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "20px",
                border: `1px solid ${formik.touched.About && formik.errors.About ? "#ff2d55" : "rgba(255, 255, 255, 0.08)"}`,
                minHeight: "150px",
                p: "20px",
                transition: "all 0.3s ease",
                "&:focus-within": {
                  background: "rgba(255, 255, 255, 0.05)",
                  borderColor: formik.touched.About && formik.errors.About ? "#ff2d55" : "rgba(255, 255, 255, 0.15)",
                }
              }}>
                {!formik.values.About && (
                  <Box sx={{ position: "absolute", top: 20, left: 20, pointerEvents: "none", opacity: 0.25 }}>
                    <Typography sx={{ color: "#fff", fontSize: "0.95rem", mb: 0.5, fontWeight: 500 }}>Example:</Typography>
                    <Typography sx={{ color: "#fff", fontSize: "0.95rem", lineHeight: 1.6, fontWeight: 400 }}>
                      We are an easy-going couple who enjoy traveling, meeting new people, and having fun conversations.
                    </Typography>
                  </Box>
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="About"
                  value={formik.values.About}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      fontSize: "1rem",
                      p: 0,
                      alignItems: "flex-start",
                      minHeight: "110px",
                    },
                    "& .MuiInputBase-input": {
                      lineHeight: 1.6,
                    }
                  }}
                />

                <Typography sx={{
                  position: "absolute",
                  bottom: 16,
                  right: 20,
                  color: formik.touched.About && formik.errors.About ? "#ff2d55" : "rgba(255,255,255,0.25)",
                  fontSize: "0.75rem",
                  fontWeight: 600
                }}>
                  {formik.values.About.length} / 500
                </Typography>
              </Box>

              <Box sx={{ width: "100%", height: "2px", background: formik.touched.About && formik.errors.About ? "#ff2d55" : "rgba(112, 0, 255, 0.25)", mt: 1, borderRadius: 1 }} />
              <Typography sx={{
                color: formik.touched.About && formik.errors.About ? "#ff2d55" : "rgba(255,255,255,0.4)",
                fontSize: "0.8rem",
                mt: 1,
                fontWeight: 500,
                ml: 0.5
              }}>
                {formik.touched.About && formik.errors.About ? formik.errors.About : "Minimum 20 characters required"}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
          <FloatingSaveBtn
            onClick={formik.handleSubmit}
            loading={formik.isSubmitting}
            label="Save Changes"
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default AboutMeDrawer;
