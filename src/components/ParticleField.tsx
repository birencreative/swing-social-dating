"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import dynamic from "next/dynamic";

const ParticleFieldComponent = memo(() => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobile = useMediaQuery("(max-width:600px)");

  const particles = useMemo(() => {
    if (!mounted) return [];
    const count = isMobile ? 15 : 50;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * (isMobile ? 4 : 6) + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * (isMobile ? 15 : 20) + 10,
      delay: -Math.random() * 20,
    }));
  }, [mounted, isMobile]);

  if (!mounted) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        opacity: 0.6,
        pointerEvents: "none",
      }}
    >
      {particles.map((particle) => (
        <Box
          key={particle.id}
          sx={{
            position: "absolute",
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: "linear-gradient(45deg, #FF2D55, #7000FF)",
            borderRadius: "50%",
            animation: `floatParticleComponent ${particle.duration}s infinite linear`,
            animationDelay: `${particle.delay}s`,
            "@keyframes floatParticleComponent": {
              "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: 0 },
              "50%": { opacity: 0.8 },
              "100%": {
                transform: "translate(100px, -100px) rotate(360deg)",
                opacity: 0,
              },
            },
          }}
        />
      ))}
    </Box>
  );
});

ParticleFieldComponent.displayName = "ParticleFieldComponent";

export const ParticleField = dynamic(
  () => Promise.resolve({ default: ParticleFieldComponent }),
  { ssr: false }
);

export default ParticleField;

