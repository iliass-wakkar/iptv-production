"use client";
import { useEffect, useRef } from "react";

export default function SocialBar() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        const script = document.createElement("script");
        script.src = "https://pl28433054.effectivegatecpm.com/c9/54/2f/c9542fc28aca70c7f4ef89fcb1efbd9a.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    return null; // Social bar injects itself
}
