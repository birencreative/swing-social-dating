"use client";

import { useEffect, useState } from "react";
import { Box, Button, Container, Stack, Typography, useMediaQuery } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

import dynamic from "next/dynamic";

const ProfileImgCheckerModel = dynamic(() => import("@/components/ProfileImgCheckerModel"), { ssr: false });
const AppFooterMobile = dynamic(() => import("@/layout/AppFooterMobile"), { ssr: true });
const AppFooterDesktop = dynamic(() => import("@/layout/AppFooterDesktop"), { ssr: true });
const AppHeaderMobile = dynamic(() => import("@/layout/AppHeaderMobile"), { ssr: true });
const AppHeaderDesktop = dynamic(() => import("@/layout/AppHeaderDesktop"), { ssr: true });
const TestEventDesktopList = dynamic(() => import("@/components/TestEventDesktopList"), { ssr: true });
const TestEventMobileList = dynamic(() => import("@/components/TestEventMobileList"), { ssr: true });
import Loader from "@/commonPage/Loader";

export default function TestEventsPageClient({
  initialEvents,
  initialIsMobile,
  initialProfileId = null,
  jsonLd
}: {
  initialEvents: any[],
  initialIsMobile: boolean,
  initialProfileId?: string | null,
  jsonLd?: any
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isMobileMediaQuery = useMediaQuery("(max-width: 900px)") ? true : false;
  const isMobile = mounted ? isMobileMediaQuery : initialIsMobile;
  const [profileId, setProfileId] = useState<any>(initialProfileId);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("loginInfo");
      if (token) {
        try {
          const decodeToken = jwtDecode<any>(token);
          setProfileId(decodeToken?.profileId || null);
        } catch (e) {
          console.warn("Failed to decode token", e);
          setProfileId(null);
        }
      } else {
        setProfileId(null);
      }
    }
  }, [router]);

  if (!mounted && !initialEvents) {
    const headerHeight = 68;
    const footerHeight = 72;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0e27",
          minHeight: "100vh"
        }}
      >
        <Box
          sx={{
            height: `calc(100dvh - ${headerHeight}px - ${footerHeight}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader />
        </Box>
      </Box>
    );
  }

  return (
    <>
      {profileId && <ProfileImgCheckerModel profileId={profileId} />}
      <Box
        sx={{
          background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
          color: "white",
          minHeight: "100vh"
        }}
      >
        {jsonLd && (
          <div style={{ display: "none" }}>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          </div>
        )}
        {profileId && (isMobile ? <AppHeaderMobile /> : <AppHeaderDesktop />)}

        <Container
          component="main"
          maxWidth={false}
          sx={{
            px: { xs: 0.5, sm: 4, md: 4 },
            pb: { xs: 8 },
            pt: !profileId ? 1 : 0
          }}
        >
          {isMobile ? (
            <TestEventMobileList profileId={profileId} initialEvents={initialEvents} />
          ) : (
            <Box sx={{ pt: profileId ? "100px" : 5 }}>
              <TestEventDesktopList initialEvents={initialEvents} profileId={profileId} />
            </Box>
          )}
        </Container>

        {profileId && (isMobile ? <AppFooterMobile /> : <AppFooterDesktop />)}
      </Box>
    </>
  );
}
