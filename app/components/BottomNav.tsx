"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="bottom-nav">
            <Link href="/" className={`bottom-nav-item ${pathname === "/" ? "active" : ""}`}>
                <span className="bottom-nav-icon">🏠</span>
                <span>Home</span>
            </Link>

            {/* Simple link to top + focus */}
            <a
                href="#"
                onClick={() => document.getElementById("search-input")?.focus()}
                className="bottom-nav-item"
            >
                <span className="bottom-nav-icon">🔍</span>
                <span>Search</span>
            </a>
        </nav>
    );
}
