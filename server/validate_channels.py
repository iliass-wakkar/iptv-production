"""
Channel Validator
Checks all stream URLs and keeps only working ones
"""

import json
import time
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict

# Paths
BASE_DIR = Path(r"c:\Users\ilias\Downloads\ip tv source\iptv-web-player\openresty\data")
INPUT_FILE = BASE_DIR / "channels.json"
OUTPUT_FILE = BASE_DIR / "channels_validated.json"
REPORT_FILE = BASE_DIR / "validation_report.txt"

# Settings
TIMEOUT = 10  # seconds
MAX_WORKERS = 20  # parallel connections
CHECK_BYTES = True  # Read first bytes to confirm video data


def check_stream(url):
    """Check if a stream URL is alive"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
        }
        
        # First try HEAD request (faster)
        try:
            resp = requests.head(url, timeout=TIMEOUT, headers=headers, allow_redirects=True)
            if resp.status_code == 200:
                return True, resp.status_code, "OK (HEAD)"
            elif resp.status_code == 405:  # Method not allowed, try GET
                pass
            else:
                return False, resp.status_code, f"HTTP {resp.status_code}"
        except:
            pass
        
        # Try GET with stream (read just first chunk)
        resp = requests.get(url, timeout=TIMEOUT, headers=headers, stream=True, allow_redirects=True)
        
        if resp.status_code != 200:
            return False, resp.status_code, f"HTTP {resp.status_code}"
        
        # Check content type
        content_type = resp.headers.get('Content-Type', '')
        
        if CHECK_BYTES:
            # Read first 1KB to confirm data
            chunk = resp.raw.read(1024)
            resp.close()
            
            if len(chunk) > 0:
                return True, 200, f"OK ({len(chunk)} bytes)"
            else:
                return False, 200, "Empty response"
        else:
            resp.close()
            return True, 200, "OK"
            
    except requests.exceptions.Timeout:
        return False, 0, "Timeout"
    except requests.exceptions.ConnectionError as e:
        return False, 0, "Connection error"
    except Exception as e:
        return False, 0, str(e)[:50]


def validate_channels():
    print("=" * 60)
    print("📡 Channel Validator")
    print("=" * 60)
    
    # Load channels
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        channels = json.load(f)
    
    total_channels = len(channels)
    total_servers = sum(ch['server_count'] for ch in channels.values())
    
    print(f"📊 Loaded {total_channels} channels with {total_servers} total servers")
    print(f"⚙️  Using {MAX_WORKERS} parallel workers, {TIMEOUT}s timeout")
    print(f"🔍 Checking first bytes: {CHECK_BYTES}")
    print()
    
    # Collect all URLs to check
    urls_to_check = []
    for ch_id, ch in channels.items():
        for i, url in enumerate(ch['servers']):
            urls_to_check.append({
                'ch_id': ch_id,
                'server_idx': i,
                'url': url,
                'name': ch['name']
            })
    
    print(f"🚀 Checking {len(urls_to_check)} URLs...")
    start_time = time.time()
    
    # Check URLs in parallel
    results = {}
    alive_count = 0
    dead_count = 0
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_url = {
            executor.submit(check_stream, item['url']): item 
            for item in urls_to_check
        }
        
        for i, future in enumerate(as_completed(future_to_url)):
            item = future_to_url[future]
            url = item['url']
            
            try:
                is_alive, status, message = future.result()
            except Exception as e:
                is_alive, status, message = False, 0, str(e)[:30]
            
            results[url] = {
                'alive': is_alive,
                'status': status,
                'message': message
            }
            
            if is_alive:
                alive_count += 1
                status_icon = "✅"
            else:
                dead_count += 1
                status_icon = "❌"
            
            # Progress update every 50 URLs
            if (i + 1) % 50 == 0 or (i + 1) == len(urls_to_check):
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed
                remaining = (len(urls_to_check) - i - 1) / rate if rate > 0 else 0
                print(f"   [{i+1}/{len(urls_to_check)}] ✅ {alive_count} alive, ❌ {dead_count} dead | ~{remaining:.0f}s remaining")
    
    elapsed = time.time() - start_time
    print(f"\n⏱️  Completed in {elapsed:.1f} seconds")
    
    # Build validated channels (keep only alive servers)
    validated = {}
    removed_channels = []
    
    for ch_id, ch in channels.items():
        alive_servers = []
        for url in ch['servers']:
            if results.get(url, {}).get('alive', False):
                alive_servers.append(url)
        
        if alive_servers:
            validated[ch_id] = {
                'name': ch['name'],
                'group': ch['group'],
                'logo': ch['logo'],
                'tvg_id': ch.get('tvg_id', ''),
                'server_count': len(alive_servers),
                'servers': alive_servers
            }
        else:
            removed_channels.append(ch['name'])
    
    # Stats
    print(f"\n📊 Results:")
    print(f"   Channels before: {total_channels}")
    print(f"   Channels after:  {len(validated)}")
    print(f"   Removed:         {len(removed_channels)}")
    
    servers_after = sum(ch['server_count'] for ch in validated.values())
    print(f"   Servers before:  {total_servers}")
    print(f"   Servers after:   {servers_after}")
    
    # Save validated channels
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(validated, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Saved to: {OUTPUT_FILE}")
    
    # Save report
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write(f"Channel Validation Report\n")
        f.write(f"=" * 50 + "\n")
        f.write(f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Channels: {total_channels} -> {len(validated)}\n")
        f.write(f"Servers: {total_servers} -> {servers_after}\n")
        f.write(f"\n\nRemoved channels ({len(removed_channels)}):\n")
        f.write("-" * 50 + "\n")
        for name in sorted(removed_channels):
            f.write(f"  {name}\n")
        
        f.write(f"\n\nDead URLs:\n")
        f.write("-" * 50 + "\n")
        for url, res in results.items():
            if not res['alive']:
                f.write(f"  {res['message']}: {url[:80]}...\n")
    
    print(f"📝 Report: {REPORT_FILE}")
    
    return validated


if __name__ == '__main__':
    validate_channels()
