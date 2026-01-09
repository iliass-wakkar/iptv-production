"use client";
import { useEffect, useRef } from "react";

export default function HilltopInPagePush() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        const script = document.createElement("script");
        script.src = "//quixoticwar.com/bHX.VVsgdEGXlr0/YpWIcd/teKme9/uDZUUzl_keP/TRY/3hNBDbQq5/NGDMYXON/j/cp0XNQDUkP0FNvwV";
        script.async = true;
        script.referrerPolicy = "no-referrer-when-downgrade";
        document.body.appendChild(script);
    }, []);

    return null;
}
