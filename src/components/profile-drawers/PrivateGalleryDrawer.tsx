"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Drawer,
  IconButton,
  Button,
  CircularProgress,
  Grid,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Trash2, Plus, Image as ImageIcon, Lock } from "lucide-react";
import Cropper, { Area } from "react-easy-crop";
import Image from "next/image";
import {
  sharedDrawerProps,
  headerHeight,
} from "./SharedHelper";

interface PrivateGalleryDrawerProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  images: any[];
  onRefresh: () => void;
  onNotify: (message: string, severity: "success" | "error" | "info") => void;
}

const PrivateGalleryDrawer: React.FC<PrivateGalleryDrawerProps> = ({
  open,
  onClose,
  profileId,
  images,
  onRefresh,
  onNotify,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Cropper States
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "dating_unsigned");
    formData.append("folder", "dating-app/private-gallery");

    const res = await fetch("https://api.cloudinary.com/v1_1/dkkf79biv/image/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 6) {
      onNotify("Maximum limit of 6 photos reached", "error");
      return;
    }

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

    canvas.width = 800;
    canvas.height = 1000;

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

      const res = await fetch("/api/user/profile/update/images/private/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, imageURL: imageUrl }),
      });

      if (!res.ok) throw new Error("Failed to upload image");

      onNotify("Private photo added successfully!", "success");
      onRefresh();
    } catch (error: any) {
      onNotify(error.message, "error");
    } finally {
      setIsUploading(false);
      if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    }
  };

  const handleDeletePhoto = async (imageId: string) => {
    setLoading(imageId);
    try {
      const res = await fetch("/api/user/profile/update/images/private/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, imageId }),
      });

      if (!res.ok) throw new Error("Failed to delete image");

      onNotify("Private photo deleted successfully!", "success");
      onRefresh();
    } catch (error: any) {
      onNotify(error.message, "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} {...sharedDrawerProps}>
      <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
        <Box sx={{ height: headerHeight, display: "flex", alignItems: "center", justifyContent: "space-between", px: 1 }}>
          <Box sx={{ width: 40 }} />
          <Box sx={{ display: "flex", justifyContent: "center", flex: 1 }}>
            <Box sx={{ width: 48, height: 5, borderRadius: 99, background: "linear-gradient(90deg, #9C27B0, #7000FF)", mt: 0.5, opacity: 0.6 }} />
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white", width: 40 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ background: "linear-gradient(90deg, #9C27B0, #7000FF)", height: "2px", border: "none" }} />

        <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 4 }}>
          <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 1, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
            <Lock size={24} color="#9C27B0" /> Private Vault
          </Typography>
          <Typography align="center" sx={{ color: "rgba(255,255,255,0.5)", mb: 4, fontSize: "0.95rem" }}>
            {images.length}/6 photos. These are only visible to users you approve.
          </Typography>

          <Grid container spacing={2}>
            {images.map((img) => (
              <Grid item xs={6} sm={4} md={3} lg={4} key={img.Id}>
                <Box sx={{
                  position: "relative",
                  aspectRatio: "3/4",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.02)", borderColor: "rgba(156,39,176,0.4)" }
                }}>
                  <Image src={img.Url} alt="Private Gallery" fill sizes="(max-width: 600px) 50vw, 200px" style={{ objectFit: "cover" }} />

                  <IconButton
                    onClick={() => handleDeletePhoto(img.Id)}
                    disabled={!!loading}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "rgba(255,0,0,0.6)",
                      backdropFilter: "blur(4px)",
                      color: "#fff",
                      "&:hover": { background: "rgba(255,0,0,0.8)" }
                    }}
                  >
                    {loading === img.Id ? <CircularProgress size={20} color="inherit" /> : <Trash2 size={18} />}
                  </IconButton>
                </Box>
              </Grid>
            ))}

            {images.length < 6 && (
              <Grid item xs={6} sm={4} md={3} lg={4}>
                <Button
                  component="label"
                  disabled={isUploading}
                  sx={{
                    width: "100%",
                    aspectRatio: "3/4",
                    borderRadius: "20px",
                    border: "2px dashed rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    color: "rgba(255,255,255,0.6)",
                    textTransform: "none",
                    "&:hover": { borderColor: "#9C27B0", background: "rgba(156,39,176,0.05)" }
                  }}
                >
                  <input type="file" hidden accept="image/*" onChange={handleAddPhoto} />
                  {isUploading ? (
                    <CircularProgress size={32} sx={{ color: "#9C27B0" }} />
                  ) : (
                    <Plus size={32} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {isUploading ? "Uploading..." : "Add Private"}
                  </Typography>
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

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
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Adjust Private Photo</Typography>
          <IconButton onClick={() => setShowCropper(false)} sx={{ color: "rgba(255,255,255,0.5)" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ position: "relative", height: 350, background: "#000", p: 0 }}>
          {cropImageUrl && (
            <Cropper
              image={cropImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
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
              background: "linear-gradient(135deg, #9C27B0 0%, #7000FF 100%)",
              fontWeight: 800,
              py: 1.5,
              borderRadius: "12px",
              textTransform: "none",
              fontSize: "1rem"
            }}
          >
            Confirm & Upload to Vault
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default PrivateGalleryDrawer;
