"use client";
import { useEffect, useRef } from "react";

export default function Popunder() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        const script = document.createElement("script");
        script.src = "https://pl28432581.effectivegatecpm.com/fb/78/5e/fb785e0cb2214d69623a3fae79611bfb.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    return null; // Popunder injects itself
}
