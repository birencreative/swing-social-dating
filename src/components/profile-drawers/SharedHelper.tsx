import React, { useRef } from "react";
import { Box, Button, CircularProgress, TextField } from "@mui/material";

export const drawerVh = 90;
export const headerHeight = 60;

export const yourTextFieldSx = {
  mb: 2,
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(6px)",
    transition: "all .25s ease",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
    "&.Mui-focused fieldset": {
      borderColor: "#ff2d86",
      boxShadow: "0 0 0 2px rgba(255,45,134,0.25)",
    },
    "&.Mui-error fieldset": {
      borderColor: "#ff4d6d",
      boxShadow: "0 0 0 1px rgba(255,77,109,0.25)",
    },
    "& input": {
      padding: "16px",
      fontSize: "15px",
      "&::placeholder": { fontSize: "14px", opacity: 0.7 },
    },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ff2d86" },
  "& .MuiFormHelperText-root": {
    marginLeft: "4px",
    marginTop: "6px",
    fontSize: "12px",
    lineHeight: 1.4,
    textAlign: "left",
  },
  "& .MuiFormHelperText-root.Mui-error": { color: "#ff4d6d", fontWeight: 400 },
} as const;

export const sharedDrawerProps = {
  anchor: "bottom" as const,
  disableScrollLock: false,
  PaperProps: {
    sx: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: `${drawerVh}vh`,
      background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
      backdropFilter: "blur(25px)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#fff",
      px: 0,
      pt: 0,
      pb: 0,
      overflow: "hidden",
      touchAction: "pan-y",
    }
  }
};

export const FloatingSaveBtn = ({ onClick, loading, label = "Send" }: { onClick: () => void; loading: boolean; label?: string }) => (
  <Button
    onClick={onClick}
    disabled={loading}
    sx={{
      px: 6,
      py: 1.5,
      borderRadius: "14px",
      width: "fit-content",
      minWidth: "120px",
      margin: "0 auto",
      display: "block",
      justifyContent: "center",
      fontSize: "1rem",
      fontWeight: 800,
      textTransform: "none",
      color: "#fff",
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
    }}
  >
    {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : label}
  </Button>
);

export const VerificationCodeInput = ({ value, onChange, error, length = 4 }: any) => {
  const inputs = useRef<any[]>([]);
  const otpArray = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleInput = (e: any, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otpArray];
    newOtp[index] = val;
    const finalOtp = newOtp.join("");
    onChange(finalOtp);

    if (val && index < length - 1) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e: any, index: number) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e: any) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim().slice(0, length);
    if (/^\d+$/.test(data)) {
      onChange(data);
      const lastIdx = Math.min(data.length - 1, length - 1);
      inputs.current[lastIdx]?.focus();
    }
  };

  return (
    <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 2 }, justifyContent: "center", mb: 3, mt: 2 }}>
      {otpArray.map((digit: string, i: number) => (
        <TextField
          key={i}
          inputRef={(el) => (inputs.current[i] = el)}
          value={digit}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={i === 0 ? handlePaste : undefined}
          autoComplete="one-time-code"
          inputProps={{
            maxLength: 1,
            inputMode: "numeric",
            style: {
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: "700",
              height: "40px",
              padding: "10px 0",
              color: "#fff"
            },
          }}
          sx={{
            width: { xs: 50, sm: 60 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "14px",
              background: "rgba(255,255,255,0.06)",
              transition: "all 0.2s ease",
              "& fieldset": {
                borderColor: error ? "#ff4d6d" : "rgba(255,255,255,0.15)",
                borderWidth: error ? "2px" : "1px"
              },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
              "&.Mui-focused fieldset": {
                borderColor: "#ff2d86",
                boxShadow: "0 0 12px rgba(255,45,134,0.2)"
              },
            },
          }}
        />
      ))}
    </Box>
  );
};
