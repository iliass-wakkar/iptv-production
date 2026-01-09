"use client";
import { useEffect, useRef } from "react";

export default function HilltopBanner2() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        const script = document.createElement("script");
        script.src = "//quixoticwar.com/bDXaVXsxd.GflT0eYFW/cd/AeBms9vu/ZYU/lNkkPCT/YO3/NADLQz5eNeDqIFtVN_j/c/0nNDDXkn0vMLwH";
        script.async = true;
        script.referrerPolicy = "no-referrer-when-downgrade";
        document.body.appendChild(script);
    }, []);

    return null;
}
