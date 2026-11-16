"use client";

import AppHeaderMobile from "@/layout/AppHeaderMobile";
import AppHeaderDesktop from "@/layout/AppHeaderDesktop";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppFooterDesktop from "@/layout/AppFooterDesktop";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  CircularProgress,
  IconButton,
  Container,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Button from "@mui/material/Button";
import Cropper from "react-easy-crop";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Upload, CheckCircle2 } from "lucide-react";
import Alert from "@mui/material/Alert";

export default function CreatePost() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [postImage, setPostImage] = useState<string | null>(null);
  const [postImageCropped, setPostImageCropped] = useState<any>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [openCropper, setOpenCropper] = useState(false);
  const [currentCropType, setCurrentCropType] = useState<string>("postImage");
  const [croppedArea, setCroppedArea] = useState(null);
  const [caption, setCaption] = useState("");
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<any>();
  const [errors, setErrors] = useState<any>({
    caption: null,
    postImageCropped: null,
  });

  const IMAGE_DIMENSIONS = {
    width: 800,
    height: 800,
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfileId(localStorage.getItem("logged_in_profile"));
    }
  }, []);

  const onFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    cropType: "postImage" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPostImage(reader.result as string);
        setCurrentCropType(cropType);
        setOpenCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedArea(croppedAreaPixels);
  };

  const handleCropConfirm = () => {
    if (!croppedArea) return;

    const canvas = document.createElement("canvas");
    const image = new Image();

    canvas.width = IMAGE_DIMENSIONS.width;
    canvas.height = IMAGE_DIMENSIONS.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    image.src = postImage!;
    image.onload = () => {
      const { x, y, width: cropWidth, height: cropHeight } = croppedArea!;
      ctx.drawImage(
        image,
        x,
        y,
        cropWidth,
        cropHeight,
        0,
        0,
        IMAGE_DIMENSIONS.width,
        IMAGE_DIMENSIONS.height
      );

      const croppedDataURL = canvas.toDataURL("image/jpeg", 0.95);
      setPostImageCropped(croppedDataURL);
      setOpenCropper(false);
    };
  };

  const handleSubmitPost = async () => {
    try {
      const uploadImage = async (imageData: string): Promise<string | null> => {
        try {
          const blob = await (await fetch(imageData)).blob();
          const formData = new FormData();
          formData.append("image", blob, `${Date.now()}.jpg`);

          const response = await fetch("/api/user/upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to upload image");
          }

          return data?.blobUrl || null;
        } catch (error) {
          console.error("Error during image upload:", error);
          return null;
        }
      };

      let hasError = false;
      const newErrors = { caption: "", postImageCropped: "" };

      if (!postImageCropped) {
        newErrors.postImageCropped = "Please upload an image.";
        hasError = true;
      }

      if (!caption || caption.trim() === "") {
        newErrors.caption = "Caption is required.";
        hasError = true;
      } else if (caption.length > 300) {
        newErrors.caption = "Caption must not exceed 300 characters.";
        hasError = true;
      }

      setErrors(newErrors);

      if (!hasError) {
        setLoading(true);
        const imageUrl = await uploadImage(postImageCropped);

        const response = await fetch("/api/user/whatshot/post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: imageUrl,
            caption: caption.trim(),
            profileId: profileId,
          }),
        });

        const data = await response.json();
        setLoading(false);

        if (response.ok) {
          setOpenSuccess(true);
          setTimeout(() => {
            router.push("/whatshot");
          }, 1500);
        } else {
          throw new Error(data.message || "Failed to create post");
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("Error submitting post:", error);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#0a0a0a",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "white",
      }}
    >
      {isMobile ? <AppHeaderMobile /> : <AppHeaderDesktop />}

      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: 4,
          mt: { xs: 0, md: 8 }, // Account for desktop header height
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: "white",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
            Create New Post
          </Typography>
        </Box>

        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(10px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: { xs: 3, sm: 4 },
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Image Upload Area */}
          <Box
            sx={{
              width: "100%",
              aspectRatio: "1/1",
              border: `2px dashed ${
                errors.postImageCropped ? "#ff1744" : "rgba(255, 255, 255, 0.2)"
              }`,
              borderRadius: "20px",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: errors.postImageCropped ? "#ff1744" : "#f50057",
                backgroundColor: "rgba(245, 0, 87, 0.05)",
              },
            }}
          >
            {postImageCropped ? (
              <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                <img
                  src={postImageCropped}
                  alt="Cropped Post"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <IconButton
                  onClick={() => {
                    setPostImage(null);
                    setPostImageCropped(null);
                  }}
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    backdropFilter: "blur(4px)",
                    "&:hover": { backgroundColor: "rgba(255, 23, 68, 0.8)" },
                  }}
                >
                  <ArrowLeft size={16} />
                </IconButton>
              </Box>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileChange(e, "postImage")}
                  style={{ display: "none" }}
                  id="upload-post-image"
                />
                <label htmlFor="upload-post-image" style={{ width: "100%", height: "100%", display: "flex" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        backgroundColor: "rgba(245, 0, 87, 0.1)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#f50057",
                      }}
                    >
                      <Camera size={32} />
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                        Upload a photo
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                        PNG, JPG or JPEG (Max. 10MB)
                      </Typography>
                    </Box>
                  </Box>
                </label>
              </>
            )}
          </Box>
          {errors.postImageCropped && (
            <Typography variant="caption" sx={{ color: "#ff1744", mt: 1, display: "block" }}>
              {errors.postImageCropped}
            </Typography>
          )}

          {/* Caption Field */}
          <Box sx={{ mt: 4 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: "rgba(255, 255, 255, 0.7)",
                fontWeight: 600,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                letterSpacing: "1px",
              }}
            >
              Caption
            </Typography>
            <TextField
              placeholder="What's on your mind?..."
              multiline
              rows={3}
              fullWidth
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                setErrors((prev: any) => ({ ...prev, caption: "" }));
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "16px",
                  color: "white",
                  "& fieldset": {
                    borderColor: errors.caption ? "#ff1744" : "rgba(255, 255, 255, 0.1)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#f50057",
                  },
                },
                "& .MuiInputBase-input": {
                  fontSize: "1rem",
                  lineHeight: 1.5,
                },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: errors.caption ? "#ff1744" : "rgba(255, 255, 255, 0.3)" }}>
                {errors.caption || `${caption.length}/300`}
              </Typography>
            </Box>
          </Box>

          {/* Action Button */}
          <Button
            fullWidth
            onClick={handleSubmitPost}
            disabled={loading}
            sx={{
              mt: 4,
              height: "56px",
              borderRadius: "16px",
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 700,
              background: loading
                ? "rgba(255, 255, 255, 0.1)"
                : "linear-gradient(45deg, #f50057 30%, #ff4081 90%)",
              color: "white",
              boxShadow: "0 8px 16px rgba(245, 0, 87, 0.3)",
              "&:hover": {
                background: "linear-gradient(45deg, #c51162 30%, #f50057 90%)",
                transform: "translateY(-2px)",
                boxShadow: "0 12px 20px rgba(245, 0, 87, 0.4)",
              },
              transition: "all 0.2s ease",
              "&.Mui-disabled": {
                color: "rgba(255, 255, 255, 0.3)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              <>
                <Upload size={18} style={{ marginRight: "8px" }} />
                Create Post
              </>
            )}
          </Button>
        </Box>
      </Container>

      {/* Cropper Dialog */}
      <Dialog
        open={openCropper}
        onClose={() => setOpenCropper(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#121212",
            borderRadius: "24px",
            maxWidth: "500px",
            width: "95%",
          },
        }}
      >
        <DialogContent
          sx={{
            padding: 0,
            height: "400px",
            position: "relative",
            backgroundColor: "#000",
          }}
        >
          {currentCropType && (
            <Cropper
              image={postImage || undefined}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: "#121212" }}>
          <Button
            onClick={() => setOpenCropper(false)}
            sx={{ color: "rgba(255, 255, 255, 0.5)", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCropConfirm}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              px: 4,
              backgroundColor: "#f50057",
              "&:hover": { backgroundColor: "#c51162" },
            }}
          >
            Confirm Crop
          </Button>
        </DialogActions>
      </Dialog>

      {isMobile ? <AppFooterMobile /> : <AppFooterDesktop />}

      <Snackbar
        open={openSuccess}
        autoHideDuration={3000}
        onClose={() => setOpenSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          icon={<CheckCircle2 size={20} />}
          severity="success"
          variant="filled"
          sx={{
            borderRadius: "16px",
            backgroundColor: "#00c853",
            "& .MuiAlert-icon": { color: "white" },
          }}
        >
          Post created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
