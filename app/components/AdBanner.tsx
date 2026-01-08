"use client";
import { useEffect, useRef } from "react";

interface AdBannerProps {
    adKey: string;
    width: number;
    height: number;
}

export default function AdBanner({ adKey, width, height }: AdBannerProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current || !adRef.current) return;
        loaded.current = true;

        // Set atOptions on window
        (window as any).atOptions = {
            key: adKey,
            format: "iframe",
            height: height,
            width: width,
            params: {},
        };

        // Create and append script
        const script = document.createElement("script");
        script.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
        script.async = true;
        adRef.current.appendChild(script);
    }, [adKey, width, height]);

    return (
        <div
            ref={adRef}
            style={{ width: `${width}px`, height: `${height}px`, overflow: "hidden" }}
        />
    );
}
