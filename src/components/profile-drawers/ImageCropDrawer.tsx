"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Drawer,
  IconButton,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Slider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Camera, Image as ImageIcon, Check, User, ShieldCheck, Sparkles } from "lucide-react";
import Cropper, { Area } from "react-easy-crop";
import {
  sharedDrawerProps,
  headerHeight,
} from "./SharedHelper";
import { Stack } from "@mui/material";

interface ImageCropDrawerProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  type: "avatar" | "banner";
  onSuccess: (url: string) => void;
  onNotify: (message: string, severity: "success" | "error" | "info") => void;
}

const ImageCropDrawer: React.FC<ImageCropDrawerProps> = ({
  open,
  onClose,
  profileId,
  type,
  onSuccess,
  onNotify,
}) => {
  const isAvatar = type === "avatar";
  const title = isAvatar ? "Profile Image" : "Profile Banner";
  const aspectRatio = isAvatar ? 1 : 3;
  const endpoint = isAvatar ? "/api/user/profile/update-avatar" : "/api/user/profile/update-banner";
  const payloadKey = isAvatar ? "Avatar" : "Banner";

  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Safety check error state
  const [showSafetyError, setShowSafetyError] = useState(false);
  const [safetyErrorType, setSafetyErrorType] = useState<"nsfw" | "no-face">("nsfw");
  const [flaggedImageUrl, setFlaggedImageUrl] = useState<string | null>(null);

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "dating_unsigned");
    formData.append("folder", `dating-app/${payloadKey.toLowerCase()}`);

    const res = await fetch("https://api.cloudinary.com/v1_1/dkkf79biv/image/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCropFile(file);
    setCropImageUrl(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setShowCropper(true);
    e.target.value = "";
  };

  const generateCroppedImage = async (): Promise<Blob | null> => {
    if (!croppedAreaPixels || !cropFile) return null;
    const imageBitmap = await createImageBitmap(cropFile);
    const canvas = document.createElement("canvas");

    // Set resolution based on aspect ratio
    if (aspectRatio === 1) {
      canvas.width = 800;
      canvas.height = 800;
    } else {
      // 3:1 ratio for banner to align perfectly with profile header
      canvas.width = 1500;
      canvas.height = 500;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      imageBitmap,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  };

  const handleCropConfirm = async () => {
    const blob = await generateCroppedImage();
    if (!blob) return;

    setShowCropper(false);
    setIsUploading(true);

    try {

      const croppedFile = new File([blob], "upload.jpg", { type: "image/jpeg" });
      const imageUrl = await uploadToCloudinary(croppedFile);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ProfileId: profileId, [payloadKey]: imageUrl }),
      });

      if (!res.ok) throw new Error("Failed to update image");

      onNotify(`${title} updated successfully!`, "success");
      onSuccess(imageUrl);
      
      if (isAvatar && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("avatarUpdated", { detail: imageUrl }));
      }
      
      onClose();
    } catch (error: any) {
      onNotify(error.message, "error");
    } finally {
      setIsUploading(false);
      if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    }
  };

  return (
    <>
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

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", p: 4, overflowY: "auto" }}>
            <Box sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
              position: "relative",
              flexShrink: 0,
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: -3,
                borderRadius: "50%",
                padding: "2px",
                background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }
            }}>
              <Box sx={{
                position: "absolute",
                inset: -15,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,45,85,0.1) 0%, transparent 70%)",
                zIndex: 0
              }} />
              <Box sx={{ position: "relative", zIndex: 1, display: "flex" }}>
                <Camera size={38} color="rgba(255,255,255,0.4)" />
              </Box>
            </Box>
            <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 1, color: "#fff" }}>
              Edit {title}
            </Typography>
            <Typography align="center" sx={{ color: "rgba(255,255,255,0.5)", mb: 4, px: 2 }}>
              Choose a new photo and adjust it perfectly for your profile.
            </Typography>

            <Button
              component="label"
              variant="contained"
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <ImageIcon size={20} />}
              sx={{
                background: "linear-gradient(135deg, #FF2D95 0%, #9C27B0 100%)",
                fontWeight: 800,
                py: 2,
                px: 6,
                borderRadius: "100px",
                textTransform: "none",
                fontSize: "1.1rem",
                boxShadow: "0 10px 25px rgba(255,45,149,0.3)",
                mb: 6
              }}
            >
              <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
              {isUploading ? "Uploading..." : "Select Photo"}
            </Button>

            {/* Guidelines Section */}
            {/* <Box sx={{ width: "100%", maxWidth: 350, mt: 2 }}>
              <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "2px", mb: 3, display: "block", textAlign: "center" }}>
                Community Guidelines
              </Typography>
              <Stack spacing={3}>
                <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
                  <Box sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, rgba(255,45,149,0.2) 0%, rgba(255,45,149,0.05) 100%)",
                    color: "#FF2D95",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,45,149,0.2)",
                    flexShrink: 0
                  }}>
                    <User size={22} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>Face required</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", lineHeight: 1.4 }}>Your photo must clearly show your face for verification.</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
                  <Box sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, rgba(112,0,255,0.2) 0%, rgba(112,0,255,0.05) 100%)",
                    color: "#7000FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(112,0,255,0.2)",
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={22} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>Safety Scan</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", lineHeight: 1.4 }}>Images are automatically screened for inappropriate content.</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
                  <Box sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)",
                    color: "rgba(255,255,255,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.1)",
                    flexShrink: 0
                  }}>
                    <Sparkles size={22} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>Quality Matters</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", lineHeight: 1.4 }}>Clear, well-lit photos get more engagement and matches.</Typography>
                  </Box>
                </Box>
              </Stack>
            </Box> */}
          </Box>
        </Box>
      </Drawer>

      {/* Cropper Modal */}
      <Dialog
        open={showCropper}
        maxWidth="md"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
            },
          },
        }}
        PaperProps={{
          sx: {
            background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
            color: "#fff",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.8)",
            overflow: "hidden"
          }
        }}
      >
        <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Adjust Photo</Typography>
          <IconButton onClick={() => setShowCropper(false)} sx={{ color: "rgba(255,255,255,0.5)" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ position: "relative", height: 400, background: "#000", p: 0 }}>
          {cropImageUrl && (
            <Cropper
              image={cropImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, flexDirection: "column", gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleCropConfirm}
            sx={{
              background: "linear-gradient(135deg, #FF2D95 0%, #9C27B0 100%)",
              fontWeight: 800,
              py: 1.5,
              borderRadius: "12px",
              textTransform: "none",
              fontSize: "1rem"
            }}
          >
            Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Safety Error Dialog */}
      <Dialog
        open={showSafetyError}
        onClose={() => setShowSafetyError(false)}
        PaperProps={{
          sx: {
            background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
            color: "#fff",
            borderRadius: "24px",
            border: "2px solid rgba(255,45,149,0.3)",
            boxShadow: "0 0 40px rgba(255,45,149,0.2)",
            maxWidth: 400
          }
        }}
      >
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Box sx={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(255,45,149,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
            border: "2px solid #FF2D95"
          }}>
            <CloseIcon sx={{ color: "#FF2D95", fontSize: 32 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, background: "linear-gradient(90deg, #FF2D55, #FF6A88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {safetyErrorType === "no-face" ? "No Face Detected" : "Safety Check Failed"}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 3 }}>
            {safetyErrorType === "no-face"
              ? "We couldn't detect a face in your photo. For security and community trust, your profile photo must clearly show your face."
              : "Our automated safety system detected content that may violate our community guidelines. Please choose a different photo."}
          </Typography>

          {flaggedImageUrl && (
            <Box sx={{
              width: "100%",
              height: 200,
              borderRadius: "16px",
              overflow: "hidden",
              mb: 3,
              border: "1px solid rgba(255,255,255,0.1)",
              position: "relative"
            }}>
              <img
                src={flaggedImageUrl}
                alt="Flagged content"
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(4px)" }}
              />
              <Box sx={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Flagged Content
                </Typography>
              </Box>
            </Box>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setShowSafetyError(false);
              if (flaggedImageUrl) URL.revokeObjectURL(flaggedImageUrl);
              setFlaggedImageUrl(null);
            }}
            sx={{
              background: "linear-gradient(135deg, #FF2D95 0%, #9C27B0 100%)",
              fontWeight: 800,
              py: 1.5,
              borderRadius: "12px",
              textTransform: "none"
            }}
          >
            I Understand
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default ImageCropDrawer;
