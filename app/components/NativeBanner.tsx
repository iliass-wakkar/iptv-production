"use client";
import { useEffect, useRef } from "react";

export default function NativeBanner() {
    const containerRef = useRef<HTMLDivElement>(null);
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current || !containerRef.current) return;
        loaded.current = true;

        // Create and append script
        const script = document.createElement("script");
        script.src = "https://pl28433090.effectivegatecpm.com/ca2471d5d245a9a869b9044e26757c37/invoke.js";
        script.async = true;
        script.setAttribute("data-cfasync", "false");
        containerRef.current.appendChild(script);
    }, []);

    return (
        <div ref={containerRef}>
            <div id="container-ca2471d5d245a9a869b9044e26757c37"></div>
        </div>
    );
}
