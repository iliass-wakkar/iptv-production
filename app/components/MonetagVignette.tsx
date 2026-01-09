"use client";
import { useEffect, useRef } from "react";

export default function MonetagVignette() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        const script = document.createElement("script");
        script.dataset.zone = "10436641";
        script.src = "https://gizokraijaw.net/vignette.min.js";
        document.body.appendChild(script);
    }, []);

    return null;
}
