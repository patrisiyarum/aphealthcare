"""
Pre-geocode all facility addresses using geopy (ArcGIS geocoder).
ArcGIS is free, needs no API key, and handles messy US addresses well.
"""
import json, time, re, sys
from geopy.geocoders import ArcGIS

INPUT = "src/data/facilities.json"
OUTPUT = INPUT

geolocator = ArcGIS(timeout=10)

def clean_address(addr):
    """Clean address for better geocoding."""
    if not addr:
        return addr
    s = addr.strip()
    # Replace non-breaking spaces
    s = s.replace('\xa0', ' ')
    # Remove newlines
    s = s.replace('\n', ' ').replace('\r', ' ')
    # Remove suite/unit info (confuses geocoders)
    s = re.sub(r',?\s*(Suite|Ste\.?|Unit|Bldg\.?|Building|#)\s*\S+', '', s, flags=re.IGNORECASE)
    # Clean up double commas/spaces
    s = re.sub(r',\s*,', ',', s)
    s = re.sub(r'\s{2,}', ' ', s).strip().rstrip(',').strip()
    # Add GA if not present
    if not re.search(r'\bGA\b', s, re.IGNORECASE) and not re.search(r'\bGeorgia\b', s, re.IGNORECASE):
        zip_match = re.search(r'(\d{5})(-\d{4})?$', s)
        if zip_match:
            before = s[:zip_match.start()].rstrip(', ')
            s = f"{before}, GA {zip_match.group()}"
        else:
            s = s + ", GA"
    return s

with open(INPUT) as f:
    data = json.load(f)

# Reset all
for d in data:
    d.pop("lat", None)
    d.pop("lng", None)

total = len(data)
geocoded = 0
skipped = 0
failed = 0
failed_list = []

for i, facility in enumerate(data):
    addr = facility.get("address", "") or ""
    is_virtual = (
        not addr
        or "virtual" in addr.lower()
        or "tele" in addr.lower()
        or len(addr.strip()) < 10
    )

    if is_virtual:
        facility["lat"] = None
        facility["lng"] = None
        skipped += 1
    else:
        search_addr = clean_address(addr)
        try:
            location = geolocator.geocode(search_addr)
            if location:
                facility["lat"] = round(location.latitude, 6)
                facility["lng"] = round(location.longitude, 6)
                geocoded += 1
            else:
                facility["lat"] = None
                facility["lng"] = None
                failed += 1
                failed_list.append(addr)
                print(f"  FAILED: {addr}")
        except Exception as e:
            facility["lat"] = None
            facility["lng"] = None
            failed += 1
            failed_list.append(f"{addr} -> {e}")
            print(f"  ERROR: {addr} -> {e}")

        # Small delay to be polite
        time.sleep(0.3)

    done = i + 1
    if done % 25 == 0 or done == total:
        print(f"  [{done}/{total}] geocoded={geocoded} skipped={skipped} failed={failed}")

    # Save every 100
    if done % 100 == 0:
        with open(OUTPUT, "w") as f:
            json.dump(data, f, indent=2)

# Final save
with open(OUTPUT, "w") as f:
    json.dump(data, f, indent=2)

print(f"\nDone! geocoded={geocoded}, skipped={skipped}, failed={failed}")
if failed_list:
    print(f"\nFailed addresses ({len(failed_list)}):")
    for a in failed_list:
        print(f"  - {a}")
print(f"Saved to {OUTPUT}")
