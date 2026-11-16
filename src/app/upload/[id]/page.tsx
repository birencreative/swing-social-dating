"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  CircularProgress,
  useMediaQuery,
  createTheme,
  ThemeProvider,
  Container,
  Paper,
  LinearProgress,
  Stack,
} from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Cropper from "react-easy-crop";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import LazyIcon from '@/components/LazyIcon';
import Carousel from "@/commonPage/Carousel";
import { useDropzone } from "react-dropzone";
// Lazy load heic2any – imported only when needed
let heic2anyPromise: Promise<any> | null = null;
const loadHeic2Any = async () => {
  if (!heic2anyPromise) heic2anyPromise = import('heic2any');
  return heic2anyPromise;
};
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ParticleField from "@/components/ParticleField";

type Params = Promise<{ id: string }>;
type UploadStatus = "idle" | "uploading" | "done" | "error";

const theme = createTheme({
  palette: {
    primary: { main: "#FF2D55", light: "#FF617B", dark: "#CC1439" },
    secondary: { main: "#7000FF", light: "#9B4DFF", dark: "#5200CC" },
    success: { main: "#00D179" },
    background: { default: "#0A0118" },
  },
});

export default function UploadAvatar({ params }: { params: Params }) {
  const router = useRouter();

  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [croppedAvatar, setCroppedAvatar] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<any>(null);
  const [openCropper, setOpenCropper] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storedAvatar, setStoredAvatar] = useState<string | null>(null);
  const [checkingVerification, setCheckingVerification] = useState<
    string | null
  >(null);

  const uploadStatusRef = useRef<UploadStatus>("idle");
  const uploadedUrlRef = useRef<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    (async () => {
      const p = await params;
      setUserId(p.id);
    })();
  }, [params]);

  useEffect(() => {
    if (!userId) return;
    const fetchUserAvatar = async () => {
      try {
        const res = await fetch(`/api/user/sweeping/user?id=${userId}`);
        const data = await res.json();
        const avatar = data?.user?.Avatar;
        setCheckingVerification(data?.user?.selfie_verification_status);
        console.log("Fetched user avatar:", data?.user);

        const isValidAvatar =
          avatar &&
          !avatar.includes("default-avatar") &&
          !avatar.startsWith("/images/") &&
          !avatar.startsWith("/avatars/");

        if (isValidAvatar && !uploadedUrlRef.current) {
          setStoredAvatar(avatar);
          uploadedUrlRef.current = avatar;
          uploadStatusRef.current = "done";
          setUploadStatus("done");
          formik.setFieldValue("avatar", avatar);
        }
      } catch (err) {
        console.error("Failed to fetch user avatar:", err);
      }
    };
    fetchUserAvatar();
  }, [userId]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    let file = acceptedFiles[0];
    try {
      if (
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif")
      ) {
        const heicModule = await loadHeic2Any();
        const converted = await heicModule.default({
          blob: file,
          toType: "image/jpeg",
          quality: 0.95,
        });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        file = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
          type: "image/jpeg",
        });
      }
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
      setSelectedFile(file);
      setAvatarImage(URL.createObjectURL(file));
      setOpenCropper(true);
    } catch (error) {
      console.error("File processing failed:", error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".gif", ".jpg"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    multiple: false,
    maxFiles: 1,
  });

  const runBackgroundUpload = async (blob: Blob) => {
    uploadStatusRef.current = "uploading";
    setUploadStatus("uploading");
    setUploadProgress(20);
    formik.setFieldValue("avatar", "");

    try {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "dating_unsigned");
      formData.append("folder", "dating-app/avatars");

      setUploadProgress(50);

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dkkf79biv/image/upload",
        { method: "POST", body: formData },
      );
      if (!res.ok) throw new Error("Cloudinary upload failed");

      const data = await res.json();
      const optimizedUrl = data.secure_url.replace(
        "/upload/",
        "/upload/w_800,h_1000,c_fill,q_auto,f_auto/",
      );

      setUploadProgress(80);

      if (userId) {
        const apiRes = await fetch("/api/user/avatarUpload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pid: userId,
            Questionable: 1,
            avatar: optimizedUrl,
          }),
        });
        if (!apiRes.ok) throw new Error("Avatar API save failed");
      }

      uploadedUrlRef.current = optimizedUrl;
      uploadStatusRef.current = "done";
      setUploadStatus("done");
      setUploadProgress(100);
      formik.setFieldValue("avatar", optimizedUrl);
    } catch (err) {
      console.error("Background avatar upload failed:", err);
      uploadStatusRef.current = "error";
      setUploadStatus("error");
      setUploadProgress(0);
      formik.setFieldValue("avatar", "");
    }
  };

  const handleCropConfirm = async () => {
    if (!croppedArea || !selectedFile) return;
    try {
      const imageBitmap = await createImageBitmap(selectedFile);
      const { x, y, width, height } = croppedArea;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imageBitmap, x, y, width, height, 0, 0, width, height);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject("Blob creation failed")),
          "image/jpeg",
          0.85,
        );
      });

      const previewUrl = URL.createObjectURL(blob);
      setCroppedAvatar(previewUrl);
      setOpenCropper(false);
      runBackgroundUpload(blob);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  const handleSubmit = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched({ avatar: true });
      return;
    }

    setIsSubmitting(true);

    try {
      if (uploadStatusRef.current === "uploading") {
        await new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (uploadStatusRef.current === "done") {
              clearInterval(interval);
              resolve();
            } else if (uploadStatusRef.current === "error" || attempts > 100) {
              clearInterval(interval);
              reject(new Error("Upload did not complete in time"));
            }
          }, 300);
        });
      }

      if (checkingVerification === "true") {
        router.push(`/bannerupload/${userId}`);
      } else {
        router.push(`/verify-identity/${userId}`);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      setIsSubmitting(false);
    }
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedArea(croppedAreaPixels);
  };

  const handleCloseCropper = () => {
    setOpenCropper(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const formik = useFormik({
    initialValues: { avatar: "" },
    validationSchema: Yup.object().shape({
      avatar: Yup.string().required("Please upload your avatar"),
    }),
    onSubmit: async () => {},
  });

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
                p: { xs: 1.5, sm: 3, md: 4 },
                background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
                backdropFilter: "blur(25px)",
                // border: "2px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                color: "#fff",
                overflow: "visible",
              }}
            >
              <form style={{ width: "100%" }}>
                <Grid>
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
                    Profile Picture
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
                      Look your best! Upload a clear, confident photo of you. A
                      great pic gets great results.
                    </Typography>
                  </Stack>

                  <Grid item xs={12} sx={{ mt: 2, textAlign: "center" }}>
                    {/* <Typography
                      variant="h6"
                      sx={{ color: "#c2185b", fontWeight: "bold", mb: 2 }}
                    >
                      Primary Profile Picture
                    </Typography> */}

                    <Box
                      {...getRootProps()}
                      sx={{
                        width: 210,
                        aspectRatio: "4 / 5",
                        mx: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        cursor: "pointer",
                        borderRadius: "16px",

                        /* glass background like input fields */
                        background:
                          "linear-gradient(160deg,#1a0f2e 0%, #120722 100%)",

                        /* purple border like inputs */
                        border: "1px solid rgba(255,255,255,0.08)",

                        /* subtle glow */
                        boxShadow: `
      0 10px 30px rgba(0,0,0,0.6),
      inset 0 0 0 1px rgba(255,255,255,0.03)
    `,

                        backdropFilter: "blur(10px)",

                        transition: "all .25s ease",

                        "&:hover": {
                          border: "1px solid rgba(255,45,107,0.6)",
                          boxShadow: `
        0 0 0 1px rgba(255,45,107,0.3),
        0 15px 35px rgba(0,0,0,0.8)
      `,
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <input {...getInputProps()} multiple={false} />
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 4,
                          borderRadius: "12px",
                          border: "1px dashed rgba(255,255,255,0.15)",
                          pointerEvents: "none",
                        }}
                      />
                      {croppedAvatar || storedAvatar ? (
                        <>
                          <Box
                            component="img"
                            src={croppedAvatar || storedAvatar || ""}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            sx={{
                              position: "absolute",
                              bottom: 8,
                              right: 8,
                              backgroundColor: "rgba(0,0,0,0.6)",
                              color: "#fff",
                            }}
                          >
                            <LazyIcon name="EditIcon" />
                          </IconButton>
                        </>
                      ) : (
                        <PhotoCameraOutlinedIcon
                          sx={{
                            fontSize: 42,
                            color: "#FF2D6B",
                            opacity: 0.9,
                          }}
                        />
                      )}
                    </Box>

                    {formik.touched.avatar && formik.errors.avatar && (
                      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        {formik.errors.avatar}
                      </Typography>
                    )}
                  </Grid>

                  {uploadStatus === "uploading" && (
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress}
                      sx={{
                        mt: 1.5,
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        "& .MuiLinearProgress-bar": {
                          background:
                            "linear-gradient(90deg, #FF2D55, #7000FF)",
                        },
                      }}
                    />
                  )}

                  {uploadStatus === "uploading" && (
                    <Typography
                      sx={{
                        textAlign: "center",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.7rem",
                        mt: 0.8,
                        animation: "fadeInOut 2s ease-in-out infinite",
                        "@keyframes fadeInOut": {
                          "0%, 100%": { opacity: 0.5 },
                          "50%": { opacity: 1 },
                        },
                      }}
                    >
                      Uploading your photo in the background...
                    </Typography>
                  )}

                  {uploadStatus === "error" && (
                    <Typography
                      sx={{
                        textAlign: "center",
                        color: "#FF2D55",
                        fontSize: "0.7rem",
                        mt: 0.8,
                        fontWeight: 600,
                      }}
                    >
                      ✕ Upload failed — please re-select your photo
                    </Typography>
                  )}

                  <Typography
                    sx={{
                      textAlign: "center",
                      color: "#fff",
                      fontWeight: "bold",
                      mt: 2,
                      fontSize: "0.675rem",
                    }}
                  >
                    No nudity, vulgarity, cartoons, or objects. Real faces only
                    - this is a community of real people.
                  </Typography>

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
                      disabled={isSubmitting}
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
                      onClick={handleSubmit}
                      disabled={isSubmitting || uploadStatus === "uploading"}
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
                      {isSubmitting ? (
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

                  <Box sx={{ mt: 2, textAlign: "center", px: 2 }}>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        mb: 1,
                      }}
                    >
                      Selfie Verification Guidelines
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.75)",
                        fontSize: "0.8rem",
                        lineHeight: 1.6,
                      }}
                    >
                      This photo will be used for selfie verification to confirm
                      your identity. Make sure:
                    </Typography>
                    <Box
                      component="ul"
                      sx={{
                        textAlign: "left",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: "0.8rem",
                        mt: 1,
                        pl: 3,
                      }}
                    >
                      <li>Your full face is clearly visible</li>
                      <li>No sunglasses, masks, or heavy filters</li>
                      <li>Good lighting and no blur</li>
                      <li>No nudity or inappropriate content</li>
                    </Box>
                    <Typography
                      sx={{
                        color: "#c2185b",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        mt: 1,
                      }}
                    >
                      Please use a real photo of yourself, it helps us keep our
                      community safe and genuine.
                    </Typography>
                  </Box>
                </Grid>
              </form>

              <Carousel title="Exciting Events and Real Connections Start Here!" />
            </Paper>
          </Container>
        </Box>

        <Dialog
          open={openCropper}
          onClose={handleCloseCropper}
          maxWidth="sm"
          fullWidth
        >
          <DialogContent
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              height: "400px",
              position: "relative",
              padding: 0,
              overflow: "hidden",
            }}
          >
            <Cropper
              key={avatarImage}
              image={avatarImage || undefined}
              crop={crop}
              zoom={zoom}
              objectFit="contain"
              aspect={4 / 5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={() => setTimeout(() => setZoom(1), 50)}
            />
          </DialogContent>
          <DialogActions
            sx={{
              background: "linear-gradient(145deg, #0A0118 0%, #1A0B2E 100%)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              justifyContent: "center",
              p: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={handleCloseCropper}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.3)",
                "&:hover": {
                  borderColor: "#fff",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCropConfirm}
              sx={{
                backgroundColor: "#c2185b",
                "&:hover": { backgroundColor: "#ad1457" },
                ml: 1,
              }}
            >
              Crop & Upload
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </>
  );
}
