"use client";
import { useEffect, useRef } from "react";

export default function MonetagInPagePush() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        const script = document.createElement("script");
        script.dataset.zone = "10436651";
        script.src = "https://nap5k.com/tag.min.js";
        document.body.appendChild(script);
    }, []);

    return null;
}
