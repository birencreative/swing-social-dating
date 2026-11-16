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
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { User, Crown, Hash, UserCheck } from "lucide-react";
import {
  sharedDrawerProps,
  headerHeight,
  FloatingSaveBtn,
  yourTextFieldSx,
} from "./SharedHelper";

interface BasicInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  data: {
    Username: string;
    AccountType: string;
    Gender: string;
    Age: number | string;
    BirthDay: string;
    PartnerGender: string;
    PartnerAge: number | string;
    PartnerBirthDay: string;
  };
  onSuccess: (updatedData: any) => void;
  onNotify: (message: string, severity: "success" | "error" | "info") => void;
}

const calculateAge = (birthDate: string) => {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  return age;
};

const ageToBirthDay = (age: number) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  return date.toISOString().split("T")[0];
};

const validationSchema = Yup.object().shape({
  Username: Yup.string().required("Username is required").min(3, "Too short"),
  Identity: Yup.string().required("Identity is required"),
  Age: Yup.number().required("Age is required").min(18, "Must be at least 18").max(99, "Invalid age"),
  Gender: Yup.string().required("Gender is required"),
  PartnerAge: Yup.number().when("Identity", {
    is: (val: string) => val === "Couple" || val === "Throuple",
    then: (schema) => schema.required("Partner age is required").min(18, "Must be at least 18").max(99, "Invalid age"),
    otherwise: (schema) => schema.nullable(),
  }),
  PartnerGender: Yup.string().when("Identity", {
    is: (val: string) => val === "Couple" || val === "Throuple",
    then: (schema) => schema.required("Partner gender is required"),
    otherwise: (schema) => schema.nullable(),
  }),
});

const BasicInfoDrawer: React.FC<BasicInfoDrawerProps> = ({
  open,
  onClose,
  profileId,
  data,
  onSuccess,
  onNotify,
}) => {
  const formik = useFormik({
    initialValues: {
      Username: data.Username || "",
      Identity: data.AccountType === "Man" ? (data.Gender === "Male" ? "Man" : "Woman") : data.AccountType,
      Age: parseInt(data.Age as string) > 18
        ? data.Age
        : (data.BirthDay ? new Date().getFullYear() - new Date(data.BirthDay).getFullYear() : ""),
      Gender: data.Gender || "",
      PartnerAge: parseInt(data.PartnerAge as string) > 18
        ? data.PartnerAge
        : (data.PartnerBirthDay ? new Date().getFullYear() - new Date(data.PartnerBirthDay).getFullYear() : ""),
      PartnerGender: data.PartnerGender || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const accountType = values.Identity;
        const primaryGender = values.Identity === "Man" ? "Male" : (values.Identity === "Woman" ? "Female" : values.Gender);

        const res = await fetch("/api/user/profile/update/basics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ProfileId: profileId,
            Username: values.Username,
            AccountType: accountType,
            Gender: primaryGender,
            Age: Number(values.Age),
            DateOfBirth: ageToBirthDay(Number(values.Age)),
            PartnerAge: (values.Identity === "Couple" || values.Identity === "Throuple") ? Number(values.PartnerAge) : null,
            PartnerGender: (values.Identity === "Couple" || values.Identity === "Throuple") ? values.PartnerGender : null,
            PartnerDateOfBirth: (values.Identity === "Couple" || values.Identity === "Throuple") ? ageToBirthDay(Number(values.PartnerAge)) : null,
          }),
        });

        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.message || "Failed to update basic info");
        }

        onNotify("Basic information updated successfully!", "success");
        onSuccess({
          ...values,
          AccountType: accountType,
          Gender: primaryGender,
        });
        onClose();
      } catch (error: any) {
        console.error(error);
        onNotify(error.message, "error");
      }
    },
  });

  useEffect(() => {
    if (open) {
      formik.resetForm();
    }
  }, [open]);

  const showPartner = formik.values.Identity === "Couple" || formik.values.Identity === "Throuple";

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
          <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 1, color: "#fff", letterSpacing: "-0.5px" }}>
            Account Basics
          </Typography>
          <Typography align="center" sx={{ color: "rgba(255,255,255,0.4)", mb: 5, fontSize: "0.95rem" }}>
            Manage your core identity and account type.
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Box sx={{
                position: "relative",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "20px",
                border: formik.touched.Username && formik.errors.Username ? "1px solid #ff2d55" : "1px solid rgba(255, 255, 255, 0.08)",
                p: "12px 20px",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                "&:focus-within": {
                  background: "rgba(255, 255, 255, 0.05)",
                  borderColor: formik.touched.Username && formik.errors.Username ? "#ff2d55" : "rgba(255, 45, 149, 0.6)",
                }
              }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 600, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Username
                </Typography>
                <TextField
                  fullWidth
                  name="Username"
                  placeholder="Enter username"
                  value={formik.values.Username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    "& .MuiInputBase-root": { color: "#fff", fontSize: "1.05rem", fontWeight: 700, height: "30px" }
                  }}
                />
              </Box>
              {formik.touched.Username && formik.errors.Username && (
                <Typography sx={{ color: "#ff2d55", fontSize: "0.75rem", mt: 1, ml: 1 }}>{formik.errors.Username}</Typography>
              )}
            </Box>

            <Box>
              <Box sx={{
                position: "relative",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "20px",
                border: formik.touched.Identity && formik.errors.Identity ? "1px solid #ff2d55" : "1px solid rgba(255, 255, 255, 0.08)",
                p: "12px 20px",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                "&:focus-within": {
                  background: "rgba(255, 255, 255, 0.05)",
                  borderColor: formik.touched.Identity && formik.errors.Identity ? "#ff2d55" : "rgba(255, 45, 149, 0.6)",
                }
              }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 600, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  I am a
                </Typography>
                <TextField
                  select
                  fullWidth
                  name="Identity"
                  value={formik.values.Identity}
                  onChange={(e) => {
                    formik.handleChange(e);
                    if (e.target.value === "Male") formik.setFieldValue("Gender", "Male");
                    if (e.target.value === "Woman") formik.setFieldValue("Gender", "Female");
                  }}
                  onBlur={formik.handleBlur}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: "#0F0F1E",
                          backgroundImage: "none",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "20px",
                          mt: 1,
                          "& .MuiMenuItem-root": {
                            fontSize: "0.95rem",
                            py: 1.5,
                            color: "rgba(255,255,255,0.7)",
                            "&.Mui-selected": { bgcolor: "rgba(255,45,149,0.15)", color: "#FF2D95", fontWeight: 700 }
                          }
                        }
                      }
                    }
                  }}
                  sx={{
                    "& .MuiInputBase-root": { color: "#fff", fontSize: "1.05rem", fontWeight: 700, height: "30px" }
                  }}
                >
                  <MenuItem value="Male">Man</MenuItem>
                  <MenuItem value="Woman">Woman</MenuItem>
                  <MenuItem value="Couple">Couple</MenuItem>
                  <MenuItem value="Throuple">Throuple</MenuItem>
                </TextField>
              </Box>
              {formik.touched.Identity && formik.errors.Identity && (
                <Typography sx={{ color: "#ff2d55", fontSize: "0.75rem", mt: 1, ml: 1 }}>{formik.errors.Identity}</Typography>
              )}
            </Box>

            <Box>
              <Box sx={{
                position: "relative",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "20px",
                border: formik.touched.Age && formik.errors.Age ? "1px solid #ff2d55" : "1px solid rgba(255, 255, 255, 0.08)",
                p: "12px 20px",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                "&:focus-within": {
                  background: "rgba(255, 255, 255, 0.05)",
                  borderColor: formik.touched.Age && formik.errors.Age ? "#ff2d55" : "rgba(255, 45, 149, 0.6)",
                }
              }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 600, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Age
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  name="Age"
                  value={formik.values.Age}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                    formik.setFieldValue("Age", val);
                  }}
                  onBlur={formik.handleBlur}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  sx={{ "& .MuiInputBase-root": { color: "#fff", fontSize: "1.05rem", fontWeight: 700, height: "30px" } }}
                />
              </Box>
              {formik.touched.Age && formik.errors.Age && (
                <Typography sx={{ color: "#ff2d55", fontSize: "0.75rem", mt: 1, ml: 1 }}>{formik.errors.Age}</Typography>
              )}
            </Box>

            <Box>
              <Box sx={{
                position: "relative",
                background: formik.values.Identity === "Man" || formik.values.Identity === "Woman" ? "rgba(255, 255, 255, 0.01)" : "rgba(255, 255, 255, 0.03)",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                p: "12px 20px",
                opacity: formik.values.Identity === "Man" || formik.values.Identity === "Woman" ? 0.5 : 1,
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                "&:focus-within": {
                  background: "rgba(255, 255, 255, 0.05)",
                  borderColor: "rgba(255, 45, 149, 0.6)",
                }
              }}>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 600, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Gender
                </Typography>
                <TextField
                  select
                  fullWidth
                  name="Gender"
                  disabled={formik.values.Identity === "Man" || formik.values.Identity === "Woman"}
                  value={formik.values.Gender}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: "#0F0F1E",
                          backgroundImage: "none",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "20px",
                          "& .MuiMenuItem-root": { fontSize: "0.95rem", py: 1.5, color: "rgba(255,255,255,0.7)", "&.Mui-selected": { bgcolor: "rgba(255,45,149,0.15)", color: "#FF2D95", fontWeight: 700 } }
                        }
                      }
                    }
                  }}
                  sx={{ "& .MuiInputBase-root": { color: "#fff", fontSize: "1.05rem", fontWeight: 700, height: "30px" } }}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Transgender">Transgender</MenuItem>
                  <MenuItem value="Non-binary">Non-binary</MenuItem>
                </TextField>
              </Box>
            </Box>

            {/* Partner Info Section */}
            {showPartner && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}>
                  <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,45,149,0.2))" }} />
                  <Typography sx={{ color: "#FF2D55", fontSize: "0.9rem", fontWeight: 900, letterSpacing: "3px", textTransform: "uppercase", opacity: 0.8 }}>
                    Partner Details
                  </Typography>
                  <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(255,45,149,0.2), transparent)" }} />
                </Box>

                <Stack spacing={2}>
                  <Box>
                    <Box sx={{
                      position: "relative",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "20px",
                      border: formik.touched.PartnerAge && formik.errors.PartnerAge ? "1px solid #ff2d55" : "1px solid rgba(255, 255, 255, 0.08)",
                      p: "12px 20px",
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: "column",
                      "&:focus-within": {
                        background: "rgba(255, 255, 255, 0.05)",
                        borderColor: formik.touched.PartnerAge && formik.errors.PartnerAge ? "#ff2d55" : "rgba(255, 45, 149, 0.6)",
                      }
                    }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 600, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Partner's Age
                      </Typography>
                      <TextField
                        fullWidth
                        type="number"
                        name="PartnerAge"
                        placeholder="00"
                        value={formik.values.PartnerAge}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                          formik.setFieldValue("PartnerAge", val);
                        }}
                        onBlur={formik.handleBlur}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{ "& .MuiInputBase-root": { color: "#fff", fontSize: "1.05rem", fontWeight: 700, height: "30px" } }}
                      />
                    </Box>
                    {formik.touched.PartnerAge && formik.errors.PartnerAge && (
                      <Typography sx={{ color: "#ff2d55", fontSize: "0.75rem", mt: 1, ml: 1 }}>{formik.errors.PartnerAge}</Typography>
                    )}
                  </Box>

                  <Box>
                    <Box sx={{
                      position: "relative",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "20px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      p: "12px 20px",
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: "column",
                      "&:focus-within": {
                        background: "rgba(255, 255, 255, 0.05)",
                        borderColor: "rgba(255, 45, 149, 0.6)",
                      }
                    }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 600, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Partner's Gender
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        name="PartnerGender"
                        value={formik.values.PartnerGender}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              sx: {
                                bgcolor: "#0F0F1E",
                                backgroundImage: "none",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "20px",
                                "& .MuiMenuItem-root": { fontSize: "0.95rem", py: 1.5, color: "rgba(255,255,255,0.7)", "&.Mui-selected": { bgcolor: "rgba(255,45,149,0.15)", color: "#FF2D95", fontWeight: 700 } }
                              }
                            }
                          }
                        }}
                        sx={{ "& .MuiInputBase-root": { color: "#fff", fontSize: "1.05rem", fontWeight: 700, height: "30px" } }}
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Transgender">Transgender</MenuItem>
                        <MenuItem value="Non-binary">Non-binary</MenuItem>
                      </TextField>
                    </Box>
                  </Box>
                </Stack>

              </Box>
            )}
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

export default BasicInfoDrawer;
