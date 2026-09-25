#!/usr/bin/env python3
"""
Converts Foursquare/Swarm checkins export to Atlas prototype data.json format.
Usage: python3 scripts/build-atlas-data.py <export-dir> public/prototypes/atlas/data.json \
           [--review .context/atlas/review.html]

--review also writes a local-only city + photo review page (see atlas_review.py). It links to the
photos inside the export folder, so it never belongs in public/ or in git.

Dates are the check-in's local day (createdAt is UTC; timeZoneOffset is minutes east).
"""

import json
import math
import sys
import os
from collections import defaultdict
from datetime import datetime, timedelta

import reverse_geocoder

def load_checkins(export_dir):
    items = []
    i = 1
    while True:
        path = os.path.join(export_dir, f"checkins{i}.json")
        if not os.path.exists(path):
            break
        with open(path) as f:
            data = json.load(f)
            items.extend(data["items"])
        i += 1
    return items

def local_day(checkin):
    # "2026-06-16 05:53:50.000000" UTC, offset -600 -> "2026-06-15"
    utc = datetime.strptime(checkin["createdAt"][:19], "%Y-%m-%d %H:%M:%S")
    return (utc + timedelta(minutes=checkin.get("timeZoneOffset") or 0)).strftime("%Y-%m-%d")

def haversine_km(a, b):
    to_r = math.radians
    d_lat, d_lng = to_r(b["lat"] - a["lat"]), to_r(b["lng"] - a["lng"])
    s = math.sin(d_lat / 2) ** 2 + math.cos(to_r(a["lat"])) * math.cos(to_r(b["lat"])) * math.sin(d_lng / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(s))

def build_stays(ordered, city_index, cities):
    # Consecutive check-ins in the same city collapse into one stay; each change of city is a leg.
    stays = []
    for day, key in ordered:
        idx = city_index[key]
        if stays and stays[-1]["city"] == idx:
            stays[-1]["end"] = day
            stays[-1]["count"] += 1
        else:
            stays.append({"city": idx, "start": day, "end": day, "count": 1})
    legs = []
    for prev, nxt in zip(stays, stays[1:]):
        legs.append({
            "from": prev["city"],
            "to": nxt["city"],
            "date": nxt["start"],
            "km": round(haversine_km(cities[prev["city"]], cities[nxt["city"]])),
        })
    return stays, legs

def build_data(checkins):
    # Filter out checkins without lat/lng
    checkins = [c for c in checkins if c.get("lat") and c.get("lng")]

    # Batch reverse geocode
    coords = [(c["lat"], c["lng"]) for c in checkins]
    print(f"Reverse geocoding {len(coords)} checkins...", file=sys.stderr)
    results = reverse_geocoder.search(coords, verbose=False)

    cities = defaultdict(lambda: {
        "count": 0,
        "lats": [],
        "lngs": [],
        "visitsByMonth": defaultdict(int),
        "country": "",
        "countryCode": "",
        "firstVisit": None,
        "lastVisit": None,
    })

    ordered = []  # (utc createdAt, local day, city key), sorted below
    for checkin, geo in zip(checkins, results):
        city_name = geo["name"]
        country_code = geo["cc"]
        day = local_day(checkin)
        month = day[:7]

        key = f"{city_name}|{country_code}"
        ordered.append((checkin["createdAt"], day, key, checkin["id"]))
        c = cities[key]
        c["count"] += 1
        c["lats"].append(checkin["lat"])
        c["lngs"].append(checkin["lng"])
        c["visitsByMonth"][month] += 1
        c["countryCode"] = country_code
        c["adminName"] = geo.get("admin1", "")
        if c["firstVisit"] is None or month < c["firstVisit"]:
            c["firstVisit"] = month
        if c["lastVisit"] is None or month > c["lastVisit"]:
            c["lastVisit"] = month

    # Country code -> full name mapping (common ones)
    country_names = {
        "US": "United States", "JP": "Japan", "FR": "France", "PE": "Peru",
        "CO": "Colombia", "CL": "Chile", "AR": "Argentina", "GB": "United Kingdom",
        "DE": "Germany", "IT": "Italy", "ES": "Spain", "MX": "Mexico",
        "CA": "Canada", "AU": "Australia", "NL": "Netherlands", "PT": "Portugal",
        "BR": "Brazil", "KR": "South Korea", "TH": "Thailand", "SG": "Singapore",
        "AE": "United Arab Emirates", "TR": "Turkey", "GR": "Greece",
        "CH": "Switzerland", "SE": "Sweden", "NO": "Norway", "DK": "Denmark",
        "AT": "Austria", "BE": "Belgium", "PL": "Poland", "CZ": "Czech Republic",
        "HU": "Hungary", "RO": "Romania", "HR": "Croatia", "IS": "Iceland",
        "NZ": "New Zealand", "ZA": "South Africa", "MA": "Morocco",
        "IN": "India", "CN": "China", "HK": "Hong Kong", "TW": "Taiwan",
        "ID": "Indonesia", "VN": "Vietnam", "PH": "Philippines", "MY": "Malaysia",
        "UY": "Uruguay", "BZ": "Belize", "GI": "Gibraltar",
    }

    output_cities = []
    for key, c in cities.items():
        city_name = key.split("|")[0]
        cc = c["countryCode"]
        lat = sum(c["lats"]) / len(c["lats"])
        lng = sum(c["lngs"]) / len(c["lngs"])
        output_cities.append({
            "key": key,
            "city": city_name,
            "country": country_names.get(cc, cc),
            "countryCode": cc,
            # 2 decimals is ~1 km: a one-check-in city's centroid is the venue itself at 4.
            "lat": round(lat, 2),
            "lng": round(lng, 2),
            "count": c["count"],
            "firstVisit": c["firstVisit"],
            "lastVisit": c["lastVisit"],
            "categories": {},
            "visitsByMonth": dict(sorted(c["visitsByMonth"].items())),
        })

    output_cities.sort(key=lambda x: -x["count"])
    city_index = {c.pop("key"): i for i, c in enumerate(output_cities)}

    ordered.sort()
    stays, legs = build_stays([(day, key) for _, day, key, _ in ordered], city_index, output_cities)
    # Local-only: lets the review list place each Swarm photo in a city. Never written to data.json.
    checkin_places = {cid: (day, city_index[key]) for _, day, key, cid in ordered}

    all_months = [c["firstVisit"] for c in output_cities if c["firstVisit"]]
    all_last = [c["lastVisit"] for c in output_cities if c["lastVisit"]]
    unique_countries = len(set(c["countryCode"] for c in output_cities))

    meta = {
        "sample": False,
        "totalCheckins": sum(c["count"] for c in output_cities),
        "cities": len(output_cities),
        "countries": unique_countries,
        "firstVisit": min(all_months) if all_months else "",
        "lastVisit": max(all_last) if all_last else "",
        "firstDay": stays[0]["start"] if stays else "",
        "lastDay": stays[-1]["end"] if stays else "",
    }

    return {"meta": meta, "cities": output_cities, "stays": stays, "legs": legs}, checkin_places

if __name__ == "__main__":
    args = sys.argv[1:]
    review_path = None
    if "--review" in args:
        i = args.index("--review")
        review_path = args[i + 1]
        del args[i:i + 2]
    if len(args) < 2:
        print("Usage: build-atlas-data.py <export-dir> <output-data.json> [--review .context/atlas/review.html]",
              file=sys.stderr)
        sys.exit(1)

    export_dir, output_path = args[0], args[1]

    checkins = load_checkins(export_dir)
    print(f"Loaded {len(checkins)} checkins", file=sys.stderr)

    data, checkin_places = build_data(checkins)

    if review_path:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from atlas_review import write_review
        write_review(data, checkin_places, export_dir, review_path)
        print(f"Wrote review list -> {review_path}", file=sys.stderr)

    with open(output_path, "w") as f:
        json.dump(data, f, separators=(",", ":"))

    print(f"Wrote {data['meta']['cities']} cities, {data['meta']['countries']} countries, "
          f"{data['meta']['totalCheckins']} checkins, {len(data['stays'])} stays, "
          f"{len(data['legs'])} legs -> {output_path}", file=sys.stderr)
