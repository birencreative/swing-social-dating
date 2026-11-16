import { useEffect } from "react";

const LOCATION_CACHE_KEY = "user_location_cache";
const CACHE_DURATION_MS = 5 * 60 * 1000;

export const useLocation = (profileId: string | undefined) => {
    useEffect(() => {
        if (profileId) getCurrentLocation(profileId);
    }, [profileId]);
};

const getCurrentLocation = (profileId: string) => {
    if (!navigator.geolocation) return;

    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
        const { latitude, longitude, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION_MS) {
            sendLocationToAPI(profileId, latitude, longitude);
            return;
        }
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;

                localStorage.setItem(
                    LOCATION_CACHE_KEY,
                    JSON.stringify({ latitude, longitude, timestamp: Date.now() })
                );

                await sendLocationToAPI(profileId, latitude, longitude);
            } catch (error) {
                console.error("Error processing location:", error);
            }
        },
        (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.warn("User denied location permission.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    console.warn("Location information unavailable.");
                    break;
                case error.TIMEOUT:
                    console.warn("Location request timed out.");
                    break;
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
};

const sendLocationToAPI = async (
    profileId: string,
    latitude: number,
    longitude: number
) => {
    try {
        const response = await fetch("/api/user/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId, latitude, longitude }),
        });

        if (!response.ok) {
            const data = await response.json();
            console.error("Error sending location:", data.message);
        }
    } catch (error) {
        console.error("Error sending location to API:", error);
    }
};