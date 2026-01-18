"use client";
import { useEffect, useRef } from "react";

// Detect if device is mobile or TV (not desktop)
function isMobileOrTV(): boolean {
    if (typeof navigator === "undefined") return false;

    const ua = navigator.userAgent.toLowerCase();

    // Mobile devices
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);

    // TV devices (Samsung Tizen, LG WebOS, Android TV, etc.)
    const isTV = /tv|tizen|webos|smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast/i.test(ua);

    return isMobile || isTV;
}

export default function Popunder() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        // Only load popunder on desktop devices
        if (isMobileOrTV()) {
            console.log("[Ads] Popunder disabled on mobile/TV device");
            return;
        }

        console.log("[Ads] Loading popunder for desktop");
        const script = document.createElement("script");
        script.src = "https://pl28432581.effectivegatecpm.com/fb/78/5e/fb785e0cb2214d69623a3fae79611bfb.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    return null; // Popunder injects itself
}
