"use client";

import React, { useEffect, useRef, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Box, IconButton, Typography } from "@mui/material";

interface MathCaptchaProps {
  onChange: (data: { answer: string; token: string; correctAnswer: number }) => void;
}

export const MathCaptcha: React.FC<MathCaptchaProps> = ({ onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [num1, setNum1] = useState<number | null>(null);
  const [num2, setNum2] = useState<number | null>(null);
  const [token, setToken] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");

  const fetchCaptcha = async () => {
    try {
      const response = await fetch("/api/user/captcha");
      const data = await response.json();
      if (data.success) {
        setNum1(data.num1);
        setNum2(data.num2);
        setToken(data.captchaToken);
        setInputValue("");
        onChange({ answer: "", token: data.captchaToken, correctAnswer: data.num1 + data.num2 });
      }
    } catch (error) {
      console.error("Failed to fetch CAPTCHA:", error);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  useEffect(() => {
    if (num1 !== null && num2 !== null && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fill background with light grey
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add random noise dots (black and white pixels)
        for (let i = 0; i < 250; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? "#000000" : "#ffffff";
          ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            1.5,
            1.5
          );
        }

        // Add random noise lines
        for (let i = 0; i < 5; i++) {
          ctx.strokeStyle = Math.random() > 0.5 ? "#555555" : "#aaaaaa";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.stroke();
        }

        // Draw equation text
        ctx.font = "italic bold 18px Courier New, Courier, monospace";
        ctx.fillStyle = "#000000";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // Draw distorted text
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        // Add random slight rotation
        ctx.rotate((Math.random() - 0.5) * 0.15);
        ctx.fillText(`${num1} + ${num2}`, 0, 0);
        ctx.restore();
      }
    }
  }, [num1, num2]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange({ answer: val, token: token, correctAnswer: (num1 || 0) + (num2 || 0) });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 1, sm: 2 },
        mt: 2,
        mb: 2,
        width: "100%",
        maxWidth: "400px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* Distorted Captcha Canvas */}
        <Box sx={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", overflow: "hidden", display: "flex", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
          <canvas ref={canvasRef} width={130} height={38} style={{ display: "block" }} />
        </Box>

        {/* Refresh Button */}
        <IconButton onClick={fetchCaptcha} size="small" sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }} title="Refresh equation">
          <RefreshIcon fontSize="small" />
        </IconButton>

        {/* Equals Sign */}
        <Typography variant="body1" sx={{ color: "#fff", fontWeight: "bold" }}>
          =
        </Typography>

        {/* Input Box */}
        <input
          type="text"
          pattern="[0-9]*"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="?"
          style={{
            width: "55px",
            height: "38px",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            backgroundColor: "rgba(255,255,255,0.9)",
            color: "#000",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#FF2D55")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.2)")}
        />
      </Box>

      {/* Label */}
      <Typography
        variant="body2"
        sx={{
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: "13px",
          pl: { xs: 0.5, sm: 0 },
          alignSelf: { xs: "flex-start", sm: "center" }
        }}
      >
        Solve the equation
      </Typography>
    </Box>
  );
};

export default MathCaptcha;
