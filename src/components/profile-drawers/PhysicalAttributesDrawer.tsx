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
  Palette
} from "lucide-react";
import {
  sharedDrawerProps,
  headerHeight,
  FloatingSaveBtn,
  yourTextFieldSx,
} from "./SharedHelper";

interface PhysicalAttributesDrawerProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  data: {
    BodyType: string;
    HairColor: string;
    EyeColor: string;
    SexualOrientation: string;
    Gender: string;
    BirthDay: string;
    AccountType: string;
    Location: string;
  };
  onSuccess: (updatedData: any) => void;
  onNotify: (message: string, severity: "success" | "error" | "info") => void;
}

const BODY_TYPES = ["Slim", "Athletic", "Average", "Curvy", "Plus Size"];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Grey", "Bald"];
const EYE_COLORS = ["Black", "Brown", "Blue", "Green", "Hazel"];
const ORIENTATIONS = ["Straight", "Bisexual", "Gay", "Lesbian", "Pansexual"];

const validationSchema = Yup.object().shape({
  BodyType: Yup.string().required("Please select your body type"),
  HairColor: Yup.string().required("Please select your hair color"),
  EyeColor: Yup.string().required("Please select your eye color"),
  SexualOrientation: Yup.string().required("Please select your orientation"),
});

const PhysicalAttributesDrawer: React.FC<PhysicalAttributesDrawerProps> = ({
  open,
  onClose,
  profileId,
  data,
  onSuccess,
  onNotify,
}) => {
  const formik = useFormik({
    initialValues: {
      BodyType: data.BodyType || "",
      HairColor: data.HairColor || "",
      EyeColor: data.EyeColor || "",
      SexualOrientation: data.SexualOrientation || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const res = await fetch("/api/user/profile/update/physical", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ProfileId: profileId,
            BodyType: values.BodyType,
            HairColor: values.HairColor,
            EyeColor: values.EyeColor,
            Orientation: values.SexualOrientation,
          }),
        });

        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.message || "Failed to update physical attributes");
        }

        onNotify("Physical attributes updated successfully!", "success");
        onSuccess(values);
        onClose();
      } catch (error: any) {
        console.error(error);
        onNotify(error.message, "error");
      }
    },
  });

  const calculateAge = (birthdayStr: string) => {
    if (!birthdayStr) return 25;
    const birthDate = new Date(birthdayStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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
            Physical Attributes
          </Typography>
          <Typography align="center" sx={{ color: "rgba(255,255,255,0.5)", mb: 4, fontSize: "0.95rem" }}>
            Manage your physical traits and orientation.
          </Typography>

          <Stack spacing={1.5}>
            {[
              { label: "Body Type", field: "BodyType", options: BODY_TYPES, icon: <Accessibility size={18} color="#FF2D95" /> },
              { label: "Hair Color", field: "HairColor", options: HAIR_COLORS, icon: <Palette size={18} color="#7000FF" /> },
              { label: "Eye Color", field: "EyeColor", options: EYE_COLORS, icon: <Eye size={18} color="#00F2FF" /> },
              { label: "Sexual Orientation", field: "SexualOrientation", options: ORIENTATIONS, icon: <Heart size={18} color="#FFD700" /> },
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

export default PhysicalAttributesDrawer;
