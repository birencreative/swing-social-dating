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
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Accessibility,
  ChevronDown,
  Eye,
  Heart,
  Palette,
  User,
} from "lucide-react";
import {
  sharedDrawerProps,
  headerHeight,
  FloatingSaveBtn,
} from "./SharedHelper";

interface PartnerInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  data: {
    PartnerGender: string;
    PartnerSexualOrientation: string;
    PartnerBirthDay: string;
    PartnerBodyType: string;
    PartnerHairColor: string;
    PartnerEyeColor: string;
  };
  onSuccess: (updatedData: any) => void;
  onNotify: (message: string, severity: "success" | "error" | "info") => void;
}

const GENDERS = ["Male", "Female", "Non-binary", "Other"];
const BODY_TYPES = ["Slim", "Athletic", "Average", "Curvy", "Plus Size"];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Grey", "Bald"];
const EYE_COLORS = ["Black", "Brown", "Blue", "Green", "Hazel"];
const ORIENTATIONS = ["Straight", "Bisexual", "Gay", "Lesbian", "Pansexual"];

const validationSchema = Yup.object().shape({
  PartnerBodyType: Yup.string().required("Please select partner body type"),
  PartnerHairColor: Yup.string().required("Please select partner hair color"),
  PartnerEyeColor: Yup.string().required("Please select partner eye color"),
  PartnerSexualOrientation: Yup.string().required("Please select partner orientation"),
});

const PartnerInfoDrawer: React.FC<PartnerInfoDrawerProps> = ({
  open,
  onClose,
  profileId,
  data,
  onSuccess,
  onNotify,
}) => {
  const formik = useFormik({
    initialValues: {
      PartnerBodyType: data.PartnerBodyType || "",
      PartnerHairColor: data.PartnerHairColor || "",
      PartnerEyeColor: data.PartnerEyeColor || "",
      PartnerSexualOrientation: data.PartnerSexualOrientation || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const res = await fetch("/api/user/profile/update/partner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ProfileId: profileId,
            PartnerOrientation: values.PartnerSexualOrientation,
            PartnerBodyType: values.PartnerBodyType,
            PartnerHairColor: values.PartnerHairColor,
            PartnerEyeColor: values.PartnerEyeColor,
          }),
        });

        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.message || "Failed to update partner info");
        }

        onNotify("Partner information updated successfully!", "success");
        onSuccess(values);
        onClose();
      } catch (error: any) {
        console.error(error);
        onNotify(error.message, "error");
      }
    },
  });

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
            Partner Information
          </Typography>
          <Typography align="center" sx={{ color: "rgba(255,255,255,0.5)", mb: 4, fontSize: "0.95rem" }}>
            Update your partner's traits and orientation.
          </Typography>

          <Stack spacing={1.5}>
            {[
              { label: "Partner Body Type", field: "PartnerBodyType", options: BODY_TYPES, icon: <Accessibility size={18} color="#7000FF" /> },
              { label: "Partner Hair Color", field: "PartnerHairColor", options: HAIR_COLORS, icon: <Palette size={18} color="#00F2FF" /> },
              { label: "Partner Eye Color", field: "PartnerEyeColor", options: EYE_COLORS, icon: <Eye size={18} color="#FFD700" /> },
              { label: "Partner Orientation", field: "PartnerSexualOrientation", options: ORIENTATIONS, icon: <Heart size={18} color="#FF2D95" /> },
            ].map((item) => {
              const fieldName = item.field as keyof typeof formik.values;
              const hasError = formik.touched[fieldName] && Boolean(formik.errors[fieldName]);
              
              return (
                <FormControl key={item.field} fullWidth error={hasError}>
                  <Typography sx={{ color: hasError ? "#ff4d6d" : "rgba(255,255,255,0.5)", fontSize: "0.75rem", mb: 0.6, fontWeight: 800, ml: 0.5, textTransform: "uppercase", letterSpacing: "1px" }}>
                    {item.label}
                  </Typography>
                  <Select
                    name={item.field}
                    value={formik.values[fieldName]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    IconComponent={ChevronDown}
                    displayEmpty
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {item.icon}
                        <Typography sx={{ color: selected ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: 600, fontSize: '15px' }}>
                          {selected || `Select ${item.label}`}
                        </Typography>
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          mt: 1,
                          background: "rgba(15, 8, 25, 0.98)",
                          backdropFilter: "blur(25px)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "16px",
                          boxShadow: "0 15px 50px rgba(0,0,0,0.8)",
                          "& .MuiMenuItem-root": {
                            color: "rgba(255,255,255,0.7)",
                            py: 1.8,
                            px: 2.5,
                            fontSize: "0.95rem",
                            fontWeight: 500,
                            transition: "all 0.2s",
                            "&:hover": { background: "rgba(255,255,255,0.05)", color: "#fff" },
                            "&.Mui-selected": { background: "rgba(255,45,149,0.15)", color: "#FF2D95", fontWeight: 700 },
                            "&.Mui-selected:hover": { background: "rgba(255,45,149,0.2)" },
                          }
                        }
                      }
                    }}
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "14px",
                      border: "1px solid",
                      borderColor: hasError ? "#ff4d6d" : "rgba(255, 255, 255, 0.08)",
                      transition: "all 0.3s ease",
                      "& .MuiSelect-select": {
                        padding: "14px 16px !important",
                        display: "flex",
                        alignItems: "center",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        borderColor: hasError ? "#ff4d6d" : "rgba(255, 255, 255, 0.2)",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        borderColor: hasError ? "#ff4d6d" : "#FF2D95",
                        boxShadow: hasError ? "0 0 15px rgba(255, 77, 109, 0.2)" : "0 0 15px rgba(255, 45, 149, 0.2)",
                      },
                      "& .MuiSvgIcon-root": {
                        color: "rgba(255, 255, 255, 0.3)",
                        right: "12px",
                      }
                    }}
                  >
                    {item.options.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                  {hasError && (
                    <Typography sx={{ color: "#ff4d6d", fontSize: "0.7rem", mt: 0.5, ml: 1, fontWeight: 600 }}>
                      {formik.errors[fieldName]}
                    </Typography>
                  )}
                </FormControl>
              );
            })}
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

export default PartnerInfoDrawer;
