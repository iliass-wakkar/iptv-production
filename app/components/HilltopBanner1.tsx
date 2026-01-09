"use client";
import { useEffect, useRef } from "react";

export default function HilltopBanner1() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        const script = document.createElement("script");
        script.src = "//quixoticwar.com/bXXsV.sLd/GLlH0PY/WHcx/IeCmp9Du_ZMUglSkIPITEYW3bNkDiQS5cM/z/g/tONvjece0vNTDdk/zVOcQG";
        script.async = true;
        script.referrerPolicy = "no-referrer-when-downgrade";
        document.body.appendChild(script);
    }, []);

    return null;
}
