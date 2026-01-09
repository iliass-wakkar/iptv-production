"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import HilltopBanner1 from "@/components/HilltopBanner1";
import HilltopBanner2 from "@/components/HilltopBanner2";
import HilltopInPagePush from "@/components/HilltopInPagePush";
import Popunder from "@/components/Popunder";

// Types
interface Channel {
  name: string;
  logo?: string;
  group?: string;
  server_count?: number;
}

interface ChannelsMap {
  [key: string]: Channel;
}

interface Category {
  id: string;
  name: string;
  match?: string[];
}

// Categories
const CATEGORIES: Category[] = [
  { id: "all", name: "All" },
  { id: "sports", name: "Sports", match: ["SPORTS", "BEIN", "RMC", "DAZN", "EUROSPORT", "ESPN"] },
  { id: "cinema", name: "Movies", match: ["CINEMA", "MOVIE", "FILM"] },
  { id: "france", name: "France", match: ["FR|FRANCE", "FRANCE ", "TF1", "M6", "ARTE"] },
  { id: "africa", name: "Africa", match: ["AF|", "AFRIQUE", "AFRICA"] },
  { id: "music", name: "Music", match: ["MUSIQUE", "MUSIC", "MTV"] },
  { id: "kids", name: "Kids", match: ["JEUNESSE", "KIDS", "CARTOON", "DISNEY", "NICK"] },
  { id: "docs", name: "Documentary", match: ["DOCUMENTAIRE", "DISCOVERY", "NAT GEO", "HISTORY"] },
  { id: "usa", name: "USA", match: ["US|", "USA|", "NBA", "NFL", "NHL", "ABC", "CBS", "NBC", "FOX"] },
  { id: "arab", name: "Arabic", match: ["AR|", "ALGERIE", "MAROC", "TUNISIE", "ARAB"] },
];

// Helpers
function getChannelCategory(channel: Channel): string {
  const combined = (channel.name + " " + (channel.group || "")).toUpperCase();
  for (const cat of CATEGORIES) {
    if (cat.id === "all") continue;
    if (cat.match && cat.match.some((m) => combined.includes(m))) return cat.id;
  }
  return "other";
}

function getCategoryCounts(channels: ChannelsMap): Record<string, number> {
  const counts: Record<string, number> = { all: 0 };
  CATEGORIES.forEach((cat) => (counts[cat.id] = 0));
  Object.values(channels).forEach((ch) => {
    counts.all++;
    counts[getChannelCategory(ch)]++;
  });
  return counts;
}

// Get initials from channel name
function getInitials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').split(' ').filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return "TV";
}

// Get gradient class based on name hash
function getGradientClass(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = ['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5'];
  return gradients[hash % gradients.length];
}

export default function HomePage() {
  const [channels, setChannels] = useState<ChannelsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const CHANNELS_PER_PAGE = 48;
  const sliderRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch channels on mount
  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch("/api/channels");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setChannels(data);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }
    loadChannels();
  }, []);

  // State for top channels from stats
  const [topChannelIds, setTopChannelIds] = useState<string[]>([]);

  // Fetch top channels from public endpoint (only IDs, no sensitive data)
  useEffect(() => {
    async function loadTopChannels() {
      try {
        const res = await fetch("/api/top-channels");
        if (res.ok) {
          const data = await res.json();
          if (data.topChannels && data.topChannels.length > 0) {
            setTopChannelIds(data.topChannels);
          }
        }
      } catch {
        // Silently fail, will use fallback
      }
    }
    loadTopChannels();
  }, []);

  // Keyboard shortcut for search (Ctrl+K)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  // Get category counts
  const counts = getCategoryCounts(channels);

  // Filter trending - use top channels from stats, fallback to sports
  const trendingChannels = topChannelIds.length > 0
    ? topChannelIds
      .filter(id => channels[id]) // Only include channels that exist
      .map(id => [id, channels[id]] as [string, Channel])
    : Object.entries(channels)
      .filter(([, ch]) => getChannelCategory(ch) === "sports")
      .slice(0, 10);

  // Filter channels by category and search
  let filteredChannels = Object.entries(channels);
  if (currentCategory !== "all") {
    filteredChannels = filteredChannels.filter(
      ([, ch]) => getChannelCategory(ch) === currentCategory
    );
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredChannels = filteredChannels.filter(
      ([, ch]) =>
        ch.name.toLowerCase().includes(q) ||
        (ch.group || "").toLowerCase().includes(q)
    );
  }
  filteredChannels.sort((a, b) => a[1].name.localeCompare(b[1].name));

  // Pagination
  const totalPages = Math.ceil(filteredChannels.length / CHANNELS_PER_PAGE);
  const startIndex = (currentPage - 1) * CHANNELS_PER_PAGE;
  const paginatedChannels = filteredChannels.slice(startIndex, startIndex + CHANNELS_PER_PAGE);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentCategory, searchQuery]);

  // Slider controls
  const slideLeft = useCallback(() => {
    sliderRef.current?.scrollBy({ left: -400, behavior: "smooth" });
  }, []);
  const slideRight = useCallback(() => {
    sliderRef.current?.scrollBy({ left: 400, behavior: "smooth" });
  }, []);

  // Check if logo is valid
  const isValidLogo = (logo?: string) => logo && logo !== "Logo N/A" && !logo.includes("undefined");

  return (
    <>
      {/* Adsterra Popunder */}
      <Popunder />

      {/* Header */}
      <header className="header">
        <Link href="/" className="logo">
          <img src="/logo.png" alt="IPTV" className="logo-img" />
        </Link>
        <div className="header-center">
          <div className="search-wrapper">
            <span className="search-icon">⌕</span>
            <input
              ref={searchRef}
              type="text"
              className="search-input"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-shortcut">Ctrl + K</span>
          </div>
        </div>
        <div className="header-right">
          {/* Reserved for future ads */}
        </div>
      </header>

      {/* Trending Section - Full Width */}
      <section className="trending-section">
        <div className="section-header" style={{ padding: '40px 48px 0' }}>
          <h2 className="section-title">Trending Now</h2>
        </div>
        <div className="slider-container" style={{ padding: '0 48px' }}>
          <button className="slider-arrow left" onClick={slideLeft} aria-label="Scroll left">
            ‹
          </button>
          <div className="trending-slider" ref={sliderRef}>
            {trendingChannels.map(([channelId, channel], idx) => (
              <Link
                key={channelId}
                href={`/watch/${channelId}`}
                className="trending-card"
              >
                <span className="trending-rank-bg">{idx + 1}</span>
                <div className="trending-content">
                  <div className="trending-thumb">
                    {isValidLogo(channel.logo) && (
                      <div
                        className="trending-thumb-bg"
                        style={{ backgroundImage: `url('${channel.logo}')` }}
                      />
                    )}
                    {isValidLogo(channel.logo) ? (
                      <img src={channel.logo} alt={channel.name} />
                    ) : (
                      <div className={`channel-placeholder ${getGradientClass(channel.name)}`}>
                        {getInitials(channel.name)}
                      </div>
                    )}
                    <span className="trending-live">LIVE</span>
                  </div>
                  <div className="trending-info">
                    <div className="trending-name">{channel.name}</div>
                    <div className="trending-category">
                      {channel.group || "Live TV"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <button className="slider-arrow right" onClick={slideRight} aria-label="Scroll right">
            ›
          </button>
          <div className="slider-fade" />
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <main className="main">
        <div className="main-layout">
          {/* Left: Channel Content */}
          <div className="main-content">
            {/* Category Bar */}
            <div className="category-bar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-tab ${cat.id === currentCategory ? "active" : ""}`}
                  onClick={() => setCurrentCategory(cat.id)}
                >
                  {cat.name} <span className="category-count">{counts[cat.id] || 0}</span>
                </button>
              ))}
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
                <div className="spinner" />
                <span style={{ color: 'var(--text-muted)' }}>Loading channels...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
                <span style={{ fontSize: '48px' }}>⚠️</span>
                <span style={{ color: 'var(--text-muted)' }}>Failed to load channels</span>
              </div>
            )}

            {/* Channel Grid */}
            {!loading && !error && (
              <>
                {filteredChannels.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
                    <span style={{ fontSize: '48px', opacity: 0.4 }}>🔍</span>
                    <span style={{ color: 'var(--text-muted)' }}>No channels found</span>
                  </div>
                ) : (
                  <>
                    <div className="channel-grid">
                      {paginatedChannels.map(([channelId, channel]) => (
                        <Link
                          key={channelId}
                          href={`/watch/${channelId}`}
                          className="channel-card"
                        >
                          {isValidLogo(channel.logo) && (
                            <div
                              className="channel-bg"
                              style={{ backgroundImage: `url('${channel.logo}')` }}
                            />
                          )}
                          <div className="channel-content">
                            {isValidLogo(channel.logo) ? (
                              <img
                                className="channel-logo"
                                src={channel.logo}
                                alt={channel.name}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const sibling = e.currentTarget.nextElementSibling;
                                  if (sibling) sibling.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`channel-placeholder ${getGradientClass(channel.name)} ${isValidLogo(channel.logo) ? 'hidden' : ''}`}>
                              {getInitials(channel.name)}
                            </div>
                            <div className="channel-name">{channel.name}</div>
                            <div className="channel-category">{channel.group || "Live TV"}</div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          className="pagination-btn"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          ← Previous
                        </button>
                        <div className="pagination-pages">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <span className="pagination-info">
                          Page {currentPage} of {totalPages} ({filteredChannels.length} channels)
                        </span>
                        <button
                          className="pagination-btn"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Right: Ad Sidebar */}
          <aside className="ad-sidebar">
            <div className="ad-slot">
              <HilltopBanner1 />
            </div>
            <div className="ad-slot">
              <HilltopBanner2 />
            </div>
            <div className="ad-slot">
              <HilltopInPagePush />
            </div>
          </aside>
        </div>
      </main>

      <footer className="footer">
        ⚡ Secure streaming powered by OpenResty
      </footer>
    </>
  );
}
