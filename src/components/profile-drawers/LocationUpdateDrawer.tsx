"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Drawer,
  TextField,
  IconButton,
  Autocomplete,
  CircularProgress,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Navigation, MapPin, CheckCircle, Save } from "lucide-react";
import {
  sharedDrawerProps,
  headerHeight,
  yourTextFieldSx,
} from "./SharedHelper";

const LocationUpdateDrawer = ({ open, onClose, profileId, currentCity, onSuccess, onNotify }: any) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tempCoords, setTempCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [editableLocation, setEditableLocation] = useState("");
  const [isGpsCaptured, setIsGpsCaptured] = useState(false);
  const [detectedLocationName, setDetectedLocationName] = useState("");

  // City Autocomplete States
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [selectedCity, setSelectedCity] = useState<any>(null);

  const [permStatus, setPermStatus] = useState<"prompt" | "granted" | "denied">("prompt");

  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        setPermStatus(result.state as any);
        result.onchange = () => {
          setPermStatus(result.state as any);
        };
      });
    }
  }, []);

  // Fetch cities for Autocomplete
  useEffect(() => {
    if (!cityInput || cityInput.length < 2) {
      setCityOptions([]);
      return;
    }

    const fetchCities = async () => {
      setCityLoading(true);
      try {
        const response = await fetch(`/api/user/city?city=${encodeURIComponent(cityInput)}`);
        const data = await response.json();
        const unique = (data.cities || []).filter(
          (city: any, index: number, self: any[]) =>
            index === self.findIndex((t) => t.City === city.City)
        );
        setCityOptions(unique);
      } catch (err) {
        console.error("City fetch error:", err);
      } finally {
        setCityLoading(false);
      }
    };

    const debounce = setTimeout(fetchCities, 500);
    return () => clearTimeout(debounce);
  }, [cityInput]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      onNotify("Geolocation is not supported", "error");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setTempCoords({ lat, lng });
        setIsGpsCaptured(true);
        // Clear search fields to force manual selection
        setSelectedCity(null);
        setEditableLocation("");

        try {
          const cityRes = await fetch(`/api/user/geocode?lat=${lat}&lng=${lng}`);
          const cityData = await cityRes.json();
          if (cityRes.ok && cityData.locationName) {
            setDetectedLocationName(cityData.locationName);
          }
        } catch (e) {
          console.error(e);
        }

        setLoading(false);
        onNotify("GPS coordinates captured! Please select your city.", "success");
      },
      (err) => {
        setLoading(false);
        setIsGpsCaptured(false);
        let msg = "Failed to get location";
        if (err.code === 1) msg = "Location access denied. Please enable it in browser settings.";
        else if (err.code === 2) msg = "Locating failed. Try searching manually below.";
        else if (err.code === 3) msg = "Request timed out. Try searching manually below.";
        setError(msg);
        onNotify(msg, "error");
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleSelectCity = async (city: any) => {
    if (!city) {
      setSelectedCity(null);
      setEditableLocation("");
      if (!isGpsCaptured) setTempCoords(null);
      return;
    }

    setSelectedCity(city);
    setEditableLocation(city.City);

    // If GPS was already captured, we don't fetch new coordinates
    if (isGpsCaptured && tempCoords) {
      onNotify(`Linked ${city.City} to your GPS location`, "info");
      return;
    }

    // Otherwise, fetch city-center coordinates
    setLoading(true);
    try {
      const res = await fetch(`/api/user/geocode?address=${encodeURIComponent(city.City)}`);
      const data = await res.json();
      if (res.ok && data.latitude) {
        setTempCoords({ lat: data.latitude, lng: data.longitude });
      } else {
        throw new Error("Could not find coordinates for this city");
      }
    } catch (err: any) {
      onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!tempCoords || !editableLocation) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/update-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ProfileId: profileId,
          latitude: tempCoords.lat,
          longitude: tempCoords.lng,
          Location: editableLocation
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update location");

      onNotify(`Profile updated to ${editableLocation}`, "success");
      onSuccess(editableLocation);
    } catch (err: any) {
      onNotify(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (open) {
      setError("");
      setLoading(false);
      setSubmitting(false);
      setTempCoords(null);
      setEditableLocation("");
      setCityInput("");
      setSelectedCity(null);
      setIsGpsCaptured(false);
      setDetectedLocationName("");

      // Automatically trigger location detection
      handleDetectLocation();
    }
  }, [open]);

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

        <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2 }}>
          <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 1 }}>Location</Typography>
          <Typography align="center" sx={{ color: "rgba(255,255,255,0.6)", mb: 4, px: 3, fontSize: "0.9rem" }}>
            Update your City and Coordinates
          </Typography>

          <TextField
            fullWidth
            label="Current Registered Location"
            value={currentCity || "Unknown Location"}
            InputProps={{ readOnly: true }}
            sx={{ ...yourTextFieldSx, opacity: 0.7, mb: 4 }}
          />

          {permStatus === "prompt" && !tempCoords && !error && (
            <Box sx={{
              p: 3,
              borderRadius: "24px",
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.15)",
              textAlign: "center"
            }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: "16px",
                background: "linear-gradient(135deg, #FF2D95 0%, #7000FF 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                mx: "auto", mb: 2, boxShadow: "0 8px 20px rgba(255,45,149,0.3)"
              }}>
                <Navigation size={28} color="#fff" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Location Access</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", mb: 3, fontSize: "0.9rem", lineHeight: 1.5 }}>
                We need your coordinates to keep our community safe and localized.
                Please grant access to proceed with auto-detection.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={handleDetectLocation}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MapPin size={20} />}
                sx={{
                  py: 1.8,
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #FF2D55 0%, #7000FF 100%)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textTransform: "none"
                }}
              >
                {loading ? "Detecting Location..." : "Retry Detection"}
              </Button>
            </Box>
          )}

          {(permStatus !== "prompt" || tempCoords || error) && (
            <Box sx={{ animation: "fadeIn 0.5s ease" }}>
              <Autocomplete
                fullWidth
                options={cityOptions}
                getOptionLabel={(option: any) => option.City || ""}
                loading={cityLoading}
                value={selectedCity}
                onChange={(_, newValue) => handleSelectCity(newValue)}
                onInputChange={(_, newInputValue) => setCityInput(newInputValue)}
                componentsProps={{
                  paper: {
                    sx: {
                      backgroundColor: "#1c0d30 !important",
                      background: "#1c0d30 !important",
                      backgroundImage: "none !important",
                      color: "#ffffff !important",
                      border: "1px solid rgba(255, 27, 107, 0.4)",
                      borderRadius: "16px",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.95)",
                      mt: 1,
                      zIndex: 9999,
                      "& .MuiAutocomplete-option": {
                        color: "#ffffff !important",
                        px: 2,
                        py: 1.5,
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        "&:hover, &.Mui-focused": {
                          backgroundColor: "rgba(255, 27, 107, 0.25) !important",
                        },
                        '&[aria-selected="true"]': {
                          backgroundColor: "rgba(112, 0, 255, 0.4) !important",
                        },
                      },
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Enter Location"
                    placeholder="Search for your city..."
                    sx={yourTextFieldSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {cityLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                          <IconButton onClick={handleDetectLocation} sx={{ color: "#FF2D55", ml: 1 }}>
                            <Navigation size={20} />
                          </IconButton>
                        </React.Fragment>
                      ),
                    }}
                    FormHelperTextProps={{ sx: { color: "rgba(255,255,255,0.4)" } }}
                  />
                )}
              />

              {tempCoords && (
                <Box sx={{ mt: 2, mb: 4, px: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, color: isGpsCaptured && !editableLocation ? "#ffb703" : "#4ade80", alignItems: "center" }}>
                    {isGpsCaptured && !editableLocation ? <Navigation size={16} /> : <CheckCircle size={16} />}
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {isGpsCaptured && !editableLocation
                        ? `GPS captured${detectedLocationName ? ` at ${detectedLocationName}` : ""}! Please select your city above.`
                        : "Location Ready for Update"}
                    </Typography>
                  </Box>
                  {tempCoords && (
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", mt: 0.5, pl: 3 }}>
                      Coords: {tempCoords.lat.toFixed(4)}, {tempCoords.lng.toFixed(4)}
                    </Typography>
                  )}
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleFinalSubmit}
                disabled={submitting || !tempCoords || !editableLocation.trim()}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
                sx={{
                  py: 2,
                  mt: 2,
                  borderRadius: "14px",
                  background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    opacity: 0.9,
                    transform: "translateY(-1px)",
                  },
                  "&:active": { transform: "translateY(0)" },
                  "&.Mui-disabled": {
                    background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                    opacity: 0.5,
                    color: "#fff",
                  },
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  textTransform: "none",
                }}
              >
                {submitting ? "Updating..." : "Update Location"}
              </Button>
            </Box>
          )}

          {error && (
            <Typography sx={{ color: "#ff4d6d", mt: 2, textAlign: "center", fontSize: "0.85rem", fontWeight: 600 }}>
              {error}
            </Typography>
          )}
        </Box>

        <Box sx={{ p: 3, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
          Your exact coordinates will never be displayed publicly.
        </Box>
      </Box>
    </Drawer>
  );
};

export default LocationUpdateDrawer;
