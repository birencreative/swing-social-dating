"use client";

import { useMediaQuery } from "@mui/material";
import MobileSent from "./components/MobileSent";
import DesktopSent from "./components/DesktopSent";

export default function SentPage() {
  const isMobile = useMediaQuery("(max-width:768px)");

  return isMobile ? <MobileSent /> : <DesktopSent />;
}
