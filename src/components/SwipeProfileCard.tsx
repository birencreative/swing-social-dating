"use client";
import React, { useMemo, useRef, useEffect, useCallback } from "react";
import {
    Box,
    IconButton,
    Typography,
    useTheme,
} from "@mui/material";
import Image from "next/image";
import { getAge } from "@/utils/profileUtils";
import { mdiAlphaICircleOutline, mdiTuneVariant, mdiChevronLeft, mdiChevronRight } from '@mdi/js';
import Icon from '@mdi/react';
import type { VerticalDragHandler } from "@/hooks/useSwipe";

interface SwipeProfileCardProps {
    profile: any;
    isActive: boolean;
    imageIndex: number;
    setImageIndex: (i: number) => void;
    membership: number;
    data: any;
    imageContainerRef: React.RefObject<HTMLDivElement | null>;
    verticalDragFrameRef?: React.MutableRefObject<VerticalDragHandler | null>;
    swipeIndicator?: {
        type?: string;
        opacity?: number;
    };
    onOpenDetail: (id: string) => void;
    onOpenPrefs: () => void;
}

export default function SwipeProfileCard({
    profile,
    isActive,
    imageIndex,
    setImageIndex,
    membership,
    data,
    imageContainerRef,
    verticalDragFrameRef,
    swipeIndicator,
    onOpenDetail,
    onOpenPrefs,
}: SwipeProfileCardProps) {
    const theme = useTheme();

    // ── Image refs for direct DOM manipulation (zero re-renders during drag) ──
    const prevImgRef = useRef<HTMLImageElement>(null);
    const currImgRef = useRef<HTMLImageElement>(null);
    const nextImgRef = useRef<HTMLImageElement>(null);
    const imageBoxRef = useRef<HTMLDivElement>(null);

    // Build photo array
    const photos = useMemo(() => {
        const urls: string[] = [];
        if (profile?.Avatar) urls.push(profile.Avatar);
        for (let i = 1; i <= 6; i++) {
            const key = `imgpub${i}`;
            const url = profile?.[key];
            if (url && typeof url === 'string' && url.trim() !== '') {
                urls.push(url);
            }
        }
        return urls;
    }, [profile]);

    const totalPhotos = photos.length;
    const hasGallery = totalPhotos > 1;

    // Use imageIndex directly — no local photoIndex state to keep in sync
    const safeIndex = Math.min(imageIndex, Math.max(0, totalPhotos - 1));

    const activePhotoUrl = photos.length > 0
        ? photos[safeIndex]
        : "/fallback-profile.jpg";

    // Wrap-around indices for carousel
    const prevIndex = hasGallery ? (safeIndex === 0 ? totalPhotos - 1 : safeIndex - 1) : 0;
    const nextIndex = hasGallery ? (safeIndex === totalPhotos - 1 ? 0 : safeIndex + 1) : 0;

    const handleDotPress = (index: number) => {
        setImageIndex(index);
    };

    const handlePrevPhoto = () => {
        const newIndex = safeIndex === 0 ? totalPhotos - 1 : safeIndex - 1;
        setImageIndex(newIndex);
    };

    const handleNextPhoto = () => {
        const newIndex = safeIndex === totalPhotos - 1 ? 0 : safeIndex + 1;
        setImageIndex(newIndex);
    };

    // ── Register direct-DOM drag handler (performance-critical path) ──
    // This callback runs on every pointer-move event but NEVER triggers a React render.
    // It reads the container height once and writes only to element.style.transform.
    useEffect(() => {
        if (!hasGallery || !verticalDragFrameRef) return;

        let snapTimeout: ReturnType<typeof setTimeout> | null = null;

        const handler: VerticalDragHandler = (deltaY, phase) => {
            const containerH = imageBoxRef.current?.clientHeight || window.innerHeight;
            const pct = Math.max(-100, Math.min(100, (deltaY / containerH) * 100));

            if (phase === 'end-accepted') {
                // Swipe accepted → instant snap to defaults (React will swap srcs next frame)
                if (prevImgRef.current) {
                    prevImgRef.current.style.transition = 'none';
                    prevImgRef.current.style.transform = 'translate3d(0, -100%, 0)';
                }
                if (currImgRef.current) {
                    currImgRef.current.style.transition = 'none';
                    currImgRef.current.style.transform = 'translate3d(0, 0, 0)';
                }
                if (nextImgRef.current) {
                    nextImgRef.current.style.transition = 'none';
                    nextImgRef.current.style.transform = 'translate3d(0, 100%, 0)';
                }
                return;
            }

            if (phase === 'end-snap') {
                // Swipe rejected → smooth CSS transition back to resting positions
                const ease = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                if (prevImgRef.current) {
                    prevImgRef.current.style.transition = ease;
                    prevImgRef.current.style.transform = 'translate3d(0, -100%, 0)';
                }
                if (currImgRef.current) {
                    currImgRef.current.style.transition = ease;
                    currImgRef.current.style.transform = 'translate3d(0, 0, 0)';
                }
                if (nextImgRef.current) {
                    nextImgRef.current.style.transition = ease;
                    nextImgRef.current.style.transform = 'translate3d(0, 100%, 0)';
                }
                // Remove transition after animation completes
                if (snapTimeout) clearTimeout(snapTimeout);
                snapTimeout = setTimeout(() => {
                    if (prevImgRef.current) prevImgRef.current.style.transition = 'none';
                    if (currImgRef.current) currImgRef.current.style.transition = 'none';
                    if (nextImgRef.current) nextImgRef.current.style.transition = 'none';
                }, 350);
                return;
            }

            // ── Active drag: direct transform writes, no transition, no React ──
            if (prevImgRef.current) {
                prevImgRef.current.style.transition = 'none';
                prevImgRef.current.style.transform = `translate3d(0, ${-100 + pct}%, 0)`;
            }
            if (currImgRef.current) {
                currImgRef.current.style.transition = 'none';
                currImgRef.current.style.transform = `translate3d(0, ${pct}%, 0)`;
            }
            if (nextImgRef.current) {
                nextImgRef.current.style.transition = 'none';
                nextImgRef.current.style.transform = `translate3d(0, ${100 + pct}%, 0)`;
            }
        };

        verticalDragFrameRef.current = handler;

        return () => {
            if (snapTimeout) clearTimeout(snapTimeout);
            if (verticalDragFrameRef.current === handler) {
                verticalDragFrameRef.current = null;
            }
        };
    }, [hasGallery, verticalDragFrameRef]);

    const badgeType = swipeIndicator?.type;
    const badgeOpacity = swipeIndicator?.opacity || 0;

    const borderColor = useMemo(() => {
        const type = swipeIndicator?.type;
        const opacity = swipeIndicator?.opacity || 0;
        if (type === "like") return `rgba(0, 230, 118, ${opacity})`;
        if (type === "delete") return `rgba(255, 82, 82, ${opacity})`;
        return "rgba(255,255,255,0.1)";
    }, [swipeIndicator]);

    return (
        <Box
            sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: "32px",
                overflow: "hidden",
                backgroundColor: "#242424",
                border: `1px solid ${borderColor}`,
                boxShadow: "0px 22px 50px rgba(0,0,0,0.42)",
                touchAction: "none",
            }}
        >
            <Box
                ref={imageContainerRef}
                sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                }}
            >
                {hasGallery ? (
                    /* ── Gallery mode: 3 pre-rendered images for zero-lag vertical swiping ── */
                    <div
                        ref={imageBoxRef}
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        {/* Previous image (parked above, off-screen) */}
                        <img
                            ref={prevImgRef}
                            src={photos[prevIndex]}
                            alt="previous"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: "translate3d(0, -100%, 0)",
                                willChange: "transform",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                            }}
                            onError={(e) => {
                                if (!e.currentTarget.dataset.errored) {
                                    e.currentTarget.dataset.errored = "true";
                                    e.currentTarget.src = "/noavatar.png";
                                }
                            }}
                        />
                        {/* Current image (centered) */}
                        <img
                            ref={currImgRef}
                            src={activePhotoUrl}
                            alt={profile?.Username}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: "translate3d(0, 0, 0)",
                                willChange: "transform",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                            }}
                            onError={(e) => {
                                if (!e.currentTarget.dataset.errored) {
                                    e.currentTarget.dataset.errored = "true";
                                    e.currentTarget.src = "/noavatar.png";
                                }
                            }}
                        />
                        {/* Next image (parked below, off-screen) */}
                        <img
                            ref={nextImgRef}
                            src={photos[nextIndex]}
                            alt="next"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: "translate3d(0, 100%, 0)",
                                willChange: "transform",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                            }}
                            onError={(e) => {
                                if (!e.currentTarget.dataset.errored) {
                                    e.currentTarget.dataset.errored = "true";
                                    e.currentTarget.src = "/noavatar.png";
                                }
                            }}
                        />
                    </div>
                ) : (
                    /* ── Single image mode ── */
                    <img
                        src={activePhotoUrl}
                        alt={profile?.Username}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                        onError={(e) => {
                            if (!e.currentTarget.dataset.errored) {
                                e.currentTarget.dataset.errored = "true";
                                e.currentTarget.src = "/noavatar.png";
                            }
                        }}
                    />
                )}

                {/* Gradients */}
                <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: "26%", background: "linear-gradient(to bottom, rgba(0,0,0,0.42), transparent)" }} />
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "22%", background: "linear-gradient(to top, rgba(0,0,0,0.28), transparent)" }} />
                    <Box sx={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "20%", background: "linear-gradient(to right, rgba(0,0,0,0.38), transparent)" }} />
                    <Box sx={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "20%", background: "linear-gradient(to left, rgba(0,0,0,0.38), transparent)" }} />
                </Box>

                {/* Top Buttons */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "14px",
                        left: "14px",
                        right: "14px",
                        display: "flex",
                        justifyContent: "space-between",
                        zIndex: 10,
                    }}
                >
                    <IconButton onClick={onOpenPrefs} sx={{ width: 44, height: 44, bgcolor: "rgba(0,0,0,0.38)", backdropFilter: "blur(4px)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.28)" }}>
                        <Icon path={mdiTuneVariant} size={1} />
                    </IconButton>

                    <IconButton onClick={() => onOpenDetail(profile?.Id)} sx={{ width: 44, height: 44, bgcolor: "rgba(0,0,0,0.38)", backdropFilter: "blur(4px)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.28)" }}>
                        <Icon path={mdiAlphaICircleOutline} size={1} />
                    </IconButton>
                </Box>

                {/* Vertical Dots - Right Side */}
                {hasGallery && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            right: "16px",
                            transform: "translateY(-50%)",
                            zIndex: 12,
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            pointerEvents: "auto",
                        }}
                    >
                        {photos.map((_, idx) => (
                            <Box
                                key={idx}
                                onClick={() => handleDotPress(idx)}
                                sx={{
                                    width: 8,
                                    height: idx === safeIndex ? 14 : 8,
                                    borderRadius: "50%",
                                    backgroundColor: idx === safeIndex ? "#ffffff" : "rgba(255,255,255,0.5)",
                                    transition: "all 0.2s ease",
                                    cursor: "pointer",
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* Bottom Right Arrows */}
                {hasGallery && (
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: "24px",
                            right: "16px",
                            zIndex: 13,
                            display: "flex",
                            gap: "8px",
                            pointerEvents: "auto",
                        }}
                    >
                        <IconButton
                            onClick={handlePrevPhoto}
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                backdropFilter: "blur(4px)",
                                "&:active": { bgcolor: "rgba(194,24,91,0.6)" },
                            }}
                        >
                            <Icon path={mdiChevronLeft} size={1} />
                        </IconButton>

                        <IconButton
                            onClick={handleNextPhoto}
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                backdropFilter: "blur(4px)",
                                "&:active": { bgcolor: "rgba(194,24,91,0.6)" },
                            }}
                        >
                            <Icon path={mdiChevronRight} size={1} />
                        </IconButton>
                    </Box>
                )}

                {/* Swipe Badges */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "72px",
                        left: "20px",
                        zIndex: 15,
                        padding: "7px 16px",
                        borderRadius: "14px",
                        border: "3px solid #00e676",
                        backgroundColor: "rgba(0,0,0,0.38)",
                        opacity: badgeType === "like" ? badgeOpacity : 0,
                        transform: `scale(${0.75 + (badgeType === "like" ? badgeOpacity : 0) * 0.25}) rotate(-14deg)`,
                        transition: "all 0.3s ease-out",
                        pointerEvents: "none",
                    }}
                >
                    <Typography sx={{ fontSize: "30px", fontWeight: 900, letterSpacing: 2, color: "#00e676" }}>YES</Typography>
                </Box>

                <Box
                    sx={{
                        position: "absolute",
                        top: "72px",
                        right: "62px",
                        zIndex: 15,
                        padding: "7px 16px",
                        borderRadius: "14px",
                        border: "3px solid #ff5252",
                        backgroundColor: "rgba(0,0,0,0.38)",
                        opacity: badgeType === "delete" ? badgeOpacity : 0,
                        transform: `scale(${0.75 + (badgeType === "delete" ? badgeOpacity : 0) * 0.25}) rotate(14deg)`,
                        transition: "all 0.3s ease-out",
                        pointerEvents: "none",
                    }}
                >
                    <Typography sx={{ fontSize: "30px", fontWeight: 900, letterSpacing: 2, color: "#ff5252" }}>NO</Typography>
                </Box>

                {/* Info Area */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "18px",
                        zIndex: 5,
                        background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 68%, transparent 100%)",
                    }}
                >
                    {/* Name + Age/Gender — all inline */}
                    {(() => {
                        const username = profile?.Username || "";
                        const nameLen = username.length;
                        const nameFontSize = {
                            xs: nameLen > 20 ? "1.1rem" : nameLen > 14 ? "1.3rem" : "1.55rem",
                            sm: nameLen > 20 ? "1.25rem" : nameLen > 14 ? "1.45rem" : "1.75rem",
                        };
                        const ageFontSize = {
                            xs: nameLen > 20 ? "0.95rem" : nameLen > 14 ? "1.1rem" : "1.25rem",
                            sm: nameLen > 20 ? "1.05rem" : nameLen > 14 ? "1.2rem" : "1.4rem",
                        };
                        const iconSize = nameLen > 20 ? 14 : 18;
                        const hasPartner = profile?.PartnerDateOfBirth && profile?.PartnerGender;
                        const hasAgeInfo = profile?.DateOfBirth && profile?.Gender;

                        return (
                            <Box sx={{ mb: "6px", lineHeight: 1.4 }}>
                                <Typography
                                    component="span"
                                    sx={{
                                        fontSize: nameFontSize,
                                        fontWeight: 900,
                                        color: "#ffffff",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {username}
                                </Typography>

                                {hasAgeInfo && (
                                    <Box
                                        component="span"
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "5px",
                                            ml: "8px",
                                            whiteSpace: "nowrap",
                                            verticalAlign: "baseline",
                                        }}
                                    >
                                        <Typography
                                            component="span"
                                            sx={{ fontSize: ageFontSize, fontWeight: 900, color: "#ffffff" }}
                                        >
                                            {getAge(profile.DateOfBirth)}
                                        </Typography>
                                        <Image
                                            src={profile.Gender === "Male" ? "/swiping-card/male.svg" : "/swiping-card/female.svg"}
                                            alt=""
                                            width={iconSize}
                                            height={iconSize}
                                            style={{ verticalAlign: "middle" }}
                                        />

                                        {hasPartner && (
                                            <>
                                                <Image src="/swiping-card/separator.svg" alt="|" width={2} height={nameLen > 20 ? 18 : 25} style={{ verticalAlign: "middle" }} />
                                                <Typography
                                                    component="span"
                                                    sx={{ fontSize: ageFontSize, fontWeight: 900, color: "#ffffff" }}
                                                >
                                                    {getAge(profile.PartnerDateOfBirth)}
                                                </Typography>
                                                <Image
                                                    src={profile.PartnerGender === "Male" ? "/swiping-card/male.svg" : "/swiping-card/female.svg"}
                                                    alt=""
                                                    width={iconSize}
                                                    height={iconSize}
                                                    style={{ verticalAlign: "middle" }}
                                                />
                                            </>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        );
                    })()}

                    <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mt: "4px" }}>
                        <Image src="/swiping-card/location.svg" alt="location" width={16} height={16} />
                        <Typography sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" }, fontWeight: 700, color: "#ffffff" }}>
                            {profile?.Location?.replace(", USA", "") || "Nearby"}
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            fontSize: { xs: "0.82rem", sm: "0.9rem" },
                            lineHeight: { xs: "1.35", sm: "1.4" },
                            mt: "10px",
                            color: "rgba(255,255,255,0.88)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                        dangerouslySetInnerHTML={{ __html: profile?.About || "." }}
                    />

                    <Box sx={{ mt: "12px", px: { xs: "12px", sm: "14px" }, py: { xs: "5px", sm: "6px" }, borderRadius: "999px", backgroundColor: "#c2185b", display: "inline-block" }}>
                        <Typography sx={{ color: "#ffffff", fontWeight: 800, fontSize: { xs: "0.78rem", sm: "0.85rem" } }}>
                            {profile?.SwingStyleTags?.[0] || "Meet & Greet"}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}