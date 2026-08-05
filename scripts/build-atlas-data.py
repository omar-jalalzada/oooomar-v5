#!/usr/bin/env python3
"""
Converts Foursquare/Swarm checkins export to Atlas prototype data.json format.
Usage: python3 scripts/build-atlas-data.py <export-dir> public/prototypes/atlas/data.json
"""

import json
import sys
import os
from collections import defaultdict

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

def month_str(created_at):
    # "2026-06-16 05:53:50.000000" -> "2026-06"
    return created_at[:7]

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

    for checkin, geo in zip(checkins, results):
        city_name = geo["name"]
        country_code = geo["cc"]
        country = geo["admin1"]  # state/province — use cc for country lookup
        month = month_str(checkin["createdAt"])

        key = f"{city_name}|{country_code}"
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
    }

    output_cities = []
    for key, c in cities.items():
        city_name = key.split("|")[0]
        cc = c["countryCode"]
        lat = sum(c["lats"]) / len(c["lats"])
        lng = sum(c["lngs"]) / len(c["lngs"])
        output_cities.append({
            "city": city_name,
            "country": country_names.get(cc, cc),
            "countryCode": cc,
            "lat": round(lat, 4),
            "lng": round(lng, 4),
            "count": c["count"],
            "firstVisit": c["firstVisit"],
            "lastVisit": c["lastVisit"],
            "categories": {},
            "visitsByMonth": dict(sorted(c["visitsByMonth"].items())),
        })

    output_cities.sort(key=lambda x: -x["count"])

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
    }

    return {"meta": meta, "cities": output_cities}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: build-atlas-data.py <export-dir> <output-data.json>", file=sys.stderr)
        sys.exit(1)

    export_dir = sys.argv[1]
    output_path = sys.argv[2]

    checkins = load_checkins(export_dir)
    print(f"Loaded {len(checkins)} checkins", file=sys.stderr)

    data = build_data(checkins)

    with open(output_path, "w") as f:
        json.dump(data, f, separators=(",", ":"))

    print(f"Wrote {data['meta']['cities']} cities, {data['meta']['countries']} countries, "
          f"{data['meta']['totalCheckins']} checkins -> {output_path}", file=sys.stderr)
