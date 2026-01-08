#!/usr/bin/env python3
"""
IPTV Channel Auto-Updater
Fetches M3U from GitHub, parses, validates, and updates channels.json
Run daily via cron: 0 4 * * * /path/to/update_channels.py
"""

import os
import re
import json
import time
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
from datetime import datetime

# ============================================================
# CONFIGURATION
# ============================================================

# Output directory (adjust for server)
OUTPUT_DIR = Path("/etc/openresty/data")
if not OUTPUT_DIR.exists():
    # Local development fallback
    OUTPUT_DIR = Path(__file__).parent / "data"

# GitHub M3U sources to fetch
GITHUB_SOURCES = [
    "https://raw.githubusercontent.com/victore447/M3uSportsFranceAndMore/main/M3uSportsFrance.m3u",
    "https://raw.githubusercontent.com/victore447/M3uSportsFranceAndMore/main/Playlist%20Integrale%20France%20%26%20World.m3u",
]

# Validation settings
VALIDATE_STREAMS = True
VALIDATION_TIMEOUT = 8
VALIDATION_WORKERS = 30

# ============================================================
# M3U PARSING
# ============================================================

def fetch_m3u(url):
    """Fetch M3U content from URL"""
    try:
        print(f"📥 Fetching: {url[:60]}...")
        resp = requests.get(url, timeout=30)
        if resp.status_code == 200:
            return resp.text
        print(f"   ❌ HTTP {resp.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    return None


def parse_m3u(content):
    """Parse M3U content into channel list"""
    channels = []
    current_info = None
    
    for line in content.split('\n'):
        line = line.strip()
        
        if line.startswith('#EXTINF:'):
            current_info = {
                'name': '',
                'group': '',
                'logo': '',
            }
            
            # Extract name after comma
            match = re.search(r',([^,]+)$', line)
            if match:
                current_info['name'] = match.group(1).strip()
            
            # Extract tvg-name
            match = re.search(r'tvg-name="([^"]*)"', line)
            if match and match.group(1):
                current_info['name'] = match.group(1)
            
            # Extract group
            match = re.search(r'group-title="([^"]*)"', line)
            if match:
                current_info['group'] = match.group(1)
            
            # Extract logo
            match = re.search(r'tvg-logo="([^"]*)"', line)
            if match:
                current_info['logo'] = match.group(1)
                
        elif line.startswith('http') and current_info:
            if 'plugin://' not in line:
                current_info['url'] = line
                channels.append(current_info)
            current_info = None
    
    return channels


def normalize_name(name):
    """Normalize channel name for grouping"""
    normalized = re.sub(r'\s*(FHD|UHD|HD|SD|4K|HEVC)\s*', ' ', name, flags=re.IGNORECASE)
    normalized = ' '.join(normalized.split())
    return normalized.strip(' -_:').lower()

# ============================================================
# STREAM VALIDATION
# ============================================================

def check_stream(url):
    """Check if stream URL is alive"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        
        # Try HEAD first
        try:
            resp = requests.head(url, timeout=VALIDATION_TIMEOUT, headers=headers, allow_redirects=True)
            if resp.status_code == 200:
                return True
        except:
            pass
        
        # Try GET with stream
        resp = requests.get(url, timeout=VALIDATION_TIMEOUT, headers=headers, stream=True, allow_redirects=True)
        if resp.status_code == 200:
            chunk = resp.raw.read(512)
            resp.close()
            return len(chunk) > 0
        
        return False
    except:
        return False


def validate_urls(urls):
    """Validate multiple URLs in parallel"""
    results = {}
    
    with ThreadPoolExecutor(max_workers=VALIDATION_WORKERS) as executor:
        future_to_url = {executor.submit(check_stream, url): url for url in urls}
        
        done = 0
        total = len(urls)
        
        for future in as_completed(future_to_url):
            url = future_to_url[future]
            done += 1
            
            try:
                results[url] = future.result()
            except:
                results[url] = False
            
            if done % 100 == 0 or done == total:
                alive = sum(1 for v in results.values() if v)
                print(f"   [{done}/{total}] ✅ {alive} alive")
    
    return results

# ============================================================
# MAIN UPDATE LOGIC
# ============================================================

def update_channels():
    """Main update function"""
    print("=" * 60)
    print(f"🔄 IPTV Channel Updater - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    # 1. Fetch M3U files from GitHub
    all_channels = []
    for url in GITHUB_SOURCES:
        content = fetch_m3u(url)
        if content:
            parsed = parse_m3u(content)
            print(f"   ✅ Got {len(parsed)} channels")
            all_channels.extend(parsed)
    
    if not all_channels:
        print("❌ No channels fetched, aborting")
        return False
    
    print(f"\n📊 Total parsed: {len(all_channels)} channels")
    
    # 2. Group channels by name
    grouped = defaultdict(lambda: {'info': None, 'servers': []})
    
    for ch in all_channels:
        if not ch['name'] or not ch.get('url'):
            continue
        
        key = normalize_name(ch['name'])
        
        if not grouped[key]['info']:
            grouped[key]['info'] = ch
        
        if ch['url'] not in grouped[key]['servers']:
            grouped[key]['servers'].append(ch['url'])
    
    print(f"📊 Grouped into: {len(grouped)} unique channels")
    
    # 3. Validate streams (optional but recommended)
    if VALIDATE_STREAMS:
        print(f"\n🔍 Validating streams...")
        
        # Collect all URLs
        all_urls = set()
        for data in grouped.values():
            all_urls.update(data['servers'])
        
        print(f"   Checking {len(all_urls)} unique URLs...")
        url_status = validate_urls(all_urls)
        
        alive = sum(1 for v in url_status.values() if v)
        print(f"\n✅ {alive} / {len(all_urls)} URLs alive")
    else:
        url_status = {url: True for data in grouped.values() for url in data['servers']}
    
    # 4. Build final channel list
    output = {}
    i = 0
    
    for key, data in sorted(grouped.items()):
        alive_servers = [url for url in data['servers'] if url_status.get(url, False)]
        
        if alive_servers:
            output[f"ch_{i}"] = {
                'name': data['info']['name'],
                'group': data['info']['group'],
                'logo': data['info']['logo'],
                'server_count': len(alive_servers),
                'servers': alive_servers
            }
            i += 1
    
    print(f"\n📊 Final: {len(output)} channels with working streams")
    
    # 5. Save output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    output_file = OUTPUT_DIR / "channels.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Saved to: {output_file}")
    
    # 6. Save update log
    log_file = OUTPUT_DIR / "update_log.txt"
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(f"{datetime.now().isoformat()} - Updated {len(output)} channels\n")
    
    print(f"📝 Log: {log_file}")
    print("\n✅ Update complete!")
    
    return True


if __name__ == '__main__':
    update_channels()
