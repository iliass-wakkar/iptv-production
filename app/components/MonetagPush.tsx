"use client";
import { useEffect, useRef } from "react";

export default function MonetagPush() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        const script = document.createElement("script");
        script.src = "https://3nbf4.com/act/files/tag.min.js?z=10436643";
        script.setAttribute("data-cfasync", "false");
        script.async = true;
        document.body.appendChild(script);
    }, []);

    return null;
}
