import { useCallback, useRef, useState } from "react";

/** Callback signature for direct DOM manipulation during vertical drag */
export type VerticalDragHandler = (
    deltaY: number,
    phase?: 'end-snap' | 'end-accepted'
) => void;

export const useSwipe = (
    currentProfile: any,
    isUserPremium: () => boolean,
    hasReachedSwipeLimit: () => boolean,
    setShowLimitPopup: (show: boolean) => void,
    onVerticalSwipe?: (direction: 'up' | 'down') => void,
    hasMultipleImages?: boolean,
    verticalDragFrameRef?: React.MutableRefObject<VerticalDragHandler | null>,
) => {
    const isSwiping = useRef(false);
    const startPoint = useRef({ x: 0, y: 0 });
    const swipeDeltaRef = useRef({ x: 0, y: 0 });
    const lastSwipeTimeRef = useRef(0);
    const SWIPE_THROTTLE_MS = 0;
    const directionLocked = useRef<'horizontal' | 'vertical' | null>(null);
    const DIRECTION_LOCK_THRESHOLD = 10;

    const [cardStyles, setCardStyles] = useState<any>({ active: {}, next: {} });
    const [isExiting, setIsExiting] = useState(false);
    const [pendingSwipeAction, setPendingSwipeAction] = useState<string | null>(null);
    const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);

    const triggerExitAnimation = useCallback((action: string) => {
        const now = Date.now();
        if (now - lastSwipeTimeRef.current < SWIPE_THROTTLE_MS) return;
        lastSwipeTimeRef.current = now;

        if (isProcessingSwipe || isExiting) return;

        const targetProfile = currentProfile;
        if (!targetProfile) return;

        setIsExiting(true);
        setIsProcessingSwipe(true);
        setPendingSwipeAction(action);

        let exitTransform = "";
        let finalRotate = 0;
        let yOffset = 0;
        let scale = 1;

        if (action === "like") {
            exitTransform = "translateX(200vw)";
            finalRotate = 30;
            yOffset = -55;
            scale = 0.96;
        } else if (action === "delete") {
            exitTransform = "translateX(-200vw)";
            finalRotate = -30;
            yOffset = 55;
            scale = 0.96;
        } else if (action === "maybe") {
            exitTransform = "translateY(200vh)";
            finalRotate = 0;
            yOffset = 0;
            scale = 1;
        }

        const transform = `${exitTransform} translateY(${yOffset}px) scale(${scale}) rotate(${finalRotate}deg)`;

        setCardStyles((prev: any) => ({
            ...prev,
            active: {
                transform,
                transition:
                    action === "maybe"
                        ? `transform 0.6s cubic-bezier(0.36, 0, 0.66, -0.56)`
                        : `transform 0.33s cubic-bezier(0.22, 1, 0.36, 1)`,
                swipeType: action,
                swipeOpacity: 1,
            },
            next: {
                transform: "scale(1)",
                transition: `transform 0.01s ease-in`,
            },
        }));
    }, [currentProfile, isProcessingSwipe, isExiting]);

    const handleSwipeStart = useCallback((e: any) => {
        if (!currentProfile || isProcessingSwipe || isExiting) return;

        e.preventDefault?.();

        isSwiping.current = true;
        directionLocked.current = null;
        const point = e.touches ? e.touches[0] : e;
        startPoint.current = { x: point.clientX, y: point.clientY };
        swipeDeltaRef.current = { x: 0, y: 0 };

        setCardStyles((prev: any) => ({
            ...prev,
            active: { ...prev.active, transition: "transform 0s" },
        }));
    }, [currentProfile, isProcessingSwipe, isExiting]);

    const handleSwipeMove = useCallback((e: any) => {
        if (!isSwiping.current || isProcessingSwipe || isExiting) return;

        e.preventDefault?.();

        const point = e.touches ? e.touches[0] : e;
        const deltaX = point.clientX - startPoint.current.x;
        const deltaY = point.clientY - startPoint.current.y;

        swipeDeltaRef.current = { x: deltaX, y: deltaY };

        // Lock direction after threshold
        if (!directionLocked.current) {
            const absDx = Math.abs(deltaX);
            const absDy = Math.abs(deltaY);
            if (absDx > DIRECTION_LOCK_THRESHOLD || absDy > DIRECTION_LOCK_THRESHOLD) {
                if (absDy > absDx && hasMultipleImages) {
                    directionLocked.current = 'vertical';
                } else {
                    directionLocked.current = 'horizontal';
                }
            } else {
                return;
            }
        }

        // Vertical drag — direct DOM update via frame handler, NO React state
        if (directionLocked.current === 'vertical') {
            verticalDragFrameRef?.current?.(deltaY);
            return;
        }

        // Horizontal drag — move the card as before
        const rotate = deltaX * 0.1;
        const yOffset = deltaY * 0.2;

        const swipeType = deltaX > 20 ? "like" : deltaX < -20 ? "delete" : null;
        const swipeOpacity = Math.min(Math.abs(deltaX) / 100, 1);

        setCardStyles({
            active: {
                transform: `translate3d(${deltaX}px, ${yOffset}px, 0) rotate(${rotate}deg) scale(1)`,
                swipeType,
                swipeOpacity,
                transition: "transform 0s",
            },
            next: {
                transform: `scale(${0.95 + Math.min(Math.abs(deltaX) / 2000, 0.05)})`,
                transition: `transform 0.1s ease-out`,
            },
        });
    }, [isProcessingSwipe, isExiting, hasMultipleImages, verticalDragFrameRef]);

    const handleSwipeEnd = useCallback(() => {
        isSwiping.current = false;

        const { x: deltaX, y: deltaY } = swipeDeltaRef.current;
        const swipeThreshold = 120;
        const verticalSwipeThreshold = 60;
        const lockedDirection = directionLocked.current;
        directionLocked.current = null;

        // Vertical swipe – direct DOM snap, then change image index
        if (lockedDirection === 'vertical') {
            const accepted = Math.abs(deltaY) > verticalSwipeThreshold && !!onVerticalSwipe;
            if (accepted) {
                // Instant DOM snap, then update React state for image src swap
                verticalDragFrameRef?.current?.(0, 'end-accepted');
                onVerticalSwipe!(deltaY < 0 ? 'up' : 'down');
            } else {
                // Smooth CSS transition back to resting position
                verticalDragFrameRef?.current?.(0, 'end-snap');
            }
            return;
        }

        let action: string | null = null;
        if (deltaX > swipeThreshold) action = "like";
        else if (deltaX < -swipeThreshold) action = "delete";

        if (action) {
            if (!isUserPremium() && hasReachedSwipeLimit()) {
                setShowLimitPopup(true);
                // Reset styles
                setCardStyles({
                    active: { transform: "scale(1)", transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" },
                    next: { transform: "scale(0.95)" },
                });
                return;
            }
            triggerExitAnimation(action);
        } else {
            setCardStyles({
                active: { transform: "scale(1)", transition: "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" },
                next: { transform: "scale(0.95)" },
            });
        }
    }, [triggerExitAnimation, isUserPremium, hasReachedSwipeLimit, setShowLimitPopup, onVerticalSwipe, verticalDragFrameRef]);

    const handleMaybe = useCallback(() => {
        triggerExitAnimation("maybe");
    }, [triggerExitAnimation]);

    return {
        cardStyles,
        setCardStyles,
        isExiting,
        setIsExiting,
        pendingSwipeAction,
        setPendingSwipeAction,
        isProcessingSwipe,
        setIsProcessingSwipe,
        handleSwipeStart,
        handleSwipeMove,
        handleSwipeEnd,
        triggerExitAnimation,
        handleMaybe,
    };
};