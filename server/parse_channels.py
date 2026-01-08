"""
Channel Data Parser & Structurer
Parses all M3U files and creates structured JSON with grouped servers
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

# Base directory
BASE_DIR = Path(r"c:\Users\ilias\Downloads\ip tv source")

# M3U files to parse (relative to BASE_DIR)
M3U_FILES = [
    # Main sports files (highest priority)
    "M3uSportsFranceAndMore/M3uSportsFrance.m3u",
    "M3uSportsFranceAndMore/Playlist Integrale France & World.m3u",
    # Additional sources
    "sources/IP4ON_-BEIN-max-VIP-tme-_ip4on.m3u",
]

# Skip these files (truly not usable)
SKIP_FILES = [
    "VavooTo",      # plugin:// URLs only - not streamable
    "Live/Adult",   # Adult content - skip
    "Live/Radio",   # Radio streams - not video
]


def parse_m3u_file(filepath):
    """Parse a single M3U file and return list of channels"""
    channels = []
    
    try:
        # Try different encodings
        content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                with open(filepath, 'r', encoding=encoding) as f:
                    content = f.read()
                break
            except UnicodeDecodeError:
                continue
        
        if not content:
            print(f"  ⚠️ Could not read: {filepath}")
            return []
        
        current_info = None
        
        for line in content.split('\n'):
            line = line.strip()
            
            if line.startswith('#EXTINF:'):
                current_info = {
                    'name': '',
                    'group': '',
                    'logo': '',
                    'tvg_id': '',
                    'source_file': str(filepath.name)
                }
                
                # Extract name after last comma
                match = re.search(r',([^,]+)$', line)
                if match:
                    current_info['name'] = match.group(1).strip()
                
                # Extract tvg-name (override name if present)
                match = re.search(r'tvg-name="([^"]*)"', line)
                if match and match.group(1):
                    current_info['name'] = match.group(1)
                
                # Extract group-title
                match = re.search(r'group-title="([^"]*)"', line)
                if match:
                    current_info['group'] = match.group(1)
                
                # Extract tvg-logo
                match = re.search(r'tvg-logo="([^"]*)"', line)
                if match:
                    current_info['logo'] = match.group(1)
                
                # Extract tvg-id
                match = re.search(r'tvg-id="([^"]*)"', line)
                if match:
                    current_info['tvg_id'] = match.group(1)
                    
            elif line.startswith('http') and current_info:
                # Skip non-streamable URLs
                if 'plugin://' in line or '.php' in line:
                    current_info = None
                    continue
                    
                current_info['url'] = line
                channels.append(current_info)
                current_info = None
                
    except Exception as e:
        print(f"  ❌ Error parsing {filepath}: {e}")
    
    return channels


def normalize_channel_name(name):
    """Normalize channel name for grouping"""
    # Remove quality suffixes
    normalized = re.sub(r'\s*(FHD|UHD|HD|SD|4K|HEVC|H\.?265|H\.?264)\s*', ' ', name, flags=re.IGNORECASE)
    # Remove extra whitespace
    normalized = ' '.join(normalized.split())
    # Remove leading/trailing punctuation
    normalized = normalized.strip(' -_:')
    return normalized


def get_sort_key(name):
    """Create sort key for channel name"""
    return normalize_channel_name(name).lower()


def main():
    print("=" * 60)
    print("📺 Channel Data Parser")
    print("=" * 60)
    
    all_channels = []
    
    # Find all M3U files
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            if file.endswith(('.m3u', '.m3u8')):
                filepath = Path(root) / file
                relative = filepath.relative_to(BASE_DIR)
                
                # Skip excluded files
                skip = False
                for skip_pattern in SKIP_FILES:
                    if skip_pattern in str(relative):
                        skip = True
                        break
                
                if skip:
                    print(f"⏭️  Skipping: {relative}")
                    continue
                
                print(f"📄 Parsing: {relative}")
                channels = parse_m3u_file(filepath)
                print(f"   Found {len(channels)} channels")
                all_channels.extend(channels)
    
    print(f"\n📊 Total channels parsed: {len(all_channels)}")
    
    # Group channels by normalized name
    grouped = defaultdict(lambda: {
        'name': '',
        'group': '',
        'logo': '',
        'tvg_id': '',
        'servers': []
    })
    
    for ch in all_channels:
        if not ch['name'] or not ch.get('url'):
            continue
            
        key = get_sort_key(ch['name'])
        
        # Use first channel's info as base
        if not grouped[key]['name']:
            grouped[key]['name'] = ch['name']
            grouped[key]['group'] = ch['group']
            grouped[key]['logo'] = ch['logo']
            grouped[key]['tvg_id'] = ch['tvg_id']
        
        # Add server (avoid duplicates)
        server_url = ch['url']
        if server_url not in grouped[key]['servers']:
            grouped[key]['servers'].append(server_url)
    
    # Build final output
    output = {}
    for i, (key, data) in enumerate(sorted(grouped.items())):
        ch_id = f"ch_{i}"
        output[ch_id] = {
            'name': data['name'],
            'group': data['group'],
            'logo': data['logo'],
            'tvg_id': data['tvg_id'],
            'server_count': len(data['servers']),
            'servers': data['servers']
        }
    
    # Statistics
    total = len(output)
    multi_server = sum(1 for ch in output.values() if ch['server_count'] > 1)
    
    print(f"\n✅ Grouped into {total} unique channels")
    print(f"   {multi_server} channels have multiple servers")
    
    # Group statistics
    groups = defaultdict(int)
    for ch in output.values():
        groups[ch['group'] or 'Uncategorized'] += 1
    
    print(f"\n📁 Channels by group:")
    for group, count in sorted(groups.items(), key=lambda x: -x[1])[:10]:
        print(f"   {group}: {count}")
    
    # Save output
    output_path = BASE_DIR / "iptv-web-player" / "openresty" / "data" / "channels.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Saved to: {output_path}")
    
    # Also save a simple list for debugging
    debug_path = BASE_DIR / "iptv-web-player" / "openresty" / "data" / "channels_list.txt"
    with open(debug_path, 'w', encoding='utf-8') as f:
        for ch_id, ch in sorted(output.items(), key=lambda x: x[1]['name'].lower()):
            f.write(f"{ch['name']} ({ch['server_count']} servers) - {ch['group']}\n")
    
    print(f"📝 Debug list: {debug_path}")
    
    return output


if __name__ == '__main__':
    main()
