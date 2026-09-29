"""
Local-only review page for Atlas: every city, the trips detected in the stays, the Swarm photos
that belong to each, and the numbers behind each cleanup theory. Called from
build-atlas-data.py with --review; the output links straight into the export's pix/ folder, so
it only works on this machine and must stay out of git (.context/ is gitignored).
"""

import html
import json
import math
import os
from collections import defaultdict
from datetime import date

AWAY_KM = 150        # same threshold as MIN_ARC_KM in the prototype
HOME_WINDOW = 180    # days of history that decide where "home" is at any moment
METRO_KM = 40


def km(a, b):
    to_r = math.radians
    d_lat, d_lng = to_r(b["lat"] - a["lat"]), to_r(b["lng"] - a["lng"])
    s = math.sin(d_lat / 2) ** 2 + math.cos(to_r(a["lat"])) * math.cos(to_r(b["lat"])) * math.sin(d_lng / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(s))


def day_num(s):
    return date.fromisoformat(s).toordinal()


def load_photos(export_dir, checkin_places):
    path = os.path.join(export_dir, "photos1.json")
    if not os.path.exists(path):
        return []
    photos = []
    for p in json.load(open(path))["items"]:
        cid = p.get("relatedItemUrl", "").rsplit("/", 1)[-1]
        place = checkin_places.get(cid)
        file = os.path.join(export_dir, "pix", p["suffix"].strip("/"))
        photos.append({
            "day": place[0] if place else p["createdAt"][:10],
            "city": place[1] if place else None,
            "file": file if os.path.exists(file) else None,
            "public": p.get("visibility") == "public",
        })
    return photos


def home_anchors(stays):
    # For each stay, the city with the most check-ins over the trailing HOME_WINDOW days.
    anchors = []
    lo = 0
    window = defaultdict(int)
    for i, s in enumerate(stays):
        start = day_num(s["start"])
        while day_num(stays[lo]["start"]) < start - HOME_WINDOW:
            window[stays[lo]["city"]] -= stays[lo]["count"]
            lo += 1
        window[s["city"]] += s["count"]
        anchors.append(max(window, key=window.get))
    return anchors


def detect_trips(stays, anchors, cities):
    trips, cur = [], None
    for s, a in zip(stays, anchors):
        away = km(cities[s["city"]], cities[a]) > AWAY_KM
        if away:
            if cur is None:
                cur = {"home": a, "start": s["start"], "end": s["end"], "cities": [], "count": 0, "far": 0}
            cur["end"] = s["end"]
            cur["count"] += s["count"]
            if s["city"] not in cur["cities"]:
                cur["cities"].append(s["city"])
            cur["far"] = max(cur["far"], km(cities[s["city"]], cities[cur["home"]]))
        elif cur is not None:
            trips.append(cur)
            cur = None
    if cur is not None:
        trips.append(cur)
    return trips


def metro_clusters(cities):
    # Greedy: the biggest unassigned city claims everything within METRO_KM.
    assigned, clusters = set(), []
    for i, c in enumerate(cities):
        if i in assigned:
            continue
        members = [j for j, d in enumerate(cities) if j not in assigned and km(c, d) <= METRO_KM]
        assigned.update(members)
        clusters.append((i, members))
    return clusters


def esc(s):
    return html.escape(str(s))


def thumbs(photos):
    out = []
    for p in photos:
        if not p["file"]:
            continue
        badge = "" if p["public"] else '<span class="badge">friends</span>'
        out.append(f'<figure><img loading="lazy" src="file://{esc(p["file"])}">'
                   f'<figcaption>{esc(p["day"])}{badge}</figcaption></figure>')
    return f'<div class="thumbs">{"".join(out)}</div>' if out else ""


def write_review(data, checkin_places, export_dir, out_path):
    cities, stays = data["cities"], data["stays"]
    photos = load_photos(export_dir, checkin_places)
    anchors = home_anchors(stays)
    trips = detect_trips(stays, anchors, cities)
    clusters = metro_clusters(cities)

    per_city = defaultdict(lambda: {"stays": 0, "longest": 0, "days": 0})
    for s in stays:
        c = per_city[s["city"]]
        span = day_num(s["end"]) - day_num(s["start"]) + 1
        c["stays"] += 1
        c["days"] += span
        c["longest"] = max(c["longest"], span)
    photos_by_city = defaultdict(list)
    for p in photos:
        if p["city"] is not None:
            photos_by_city[p["city"]].append(p)

    home_cities = sorted(set(anchors), key=lambda i: -cities[i]["count"])
    ever_away = {s["city"] for s, a in zip(stays, anchors) if km(cities[s["city"]], cities[a]) > AWAY_KM}
    trip_cities = {c for t in trips for c in t["cities"]}
    thresholds = {n: sum(1 for c in cities if c["count"] >= n) for n in (5, 10, 25)}
    big_clusters = sorted((cl for cl in clusters if len(cl[1]) > 1), key=lambda cl: -len(cl[1]))[:6]

    def city_name(i):
        return f'{cities[i]["city"]}, {cities[i]["countryCode"]}'

    # A long trip can outweigh a quiet stretch at home inside the window, which briefly makes the
    # trip's city "home" and splits that trip in two.
    home_days = defaultdict(int)
    for k, a in enumerate(anchors):
        nxt = stays[k + 1]["start"] if k + 1 < len(stays) else stays[k]["end"]
        home_days[a] += day_num(nxt) - day_num(stays[k]["start"])
    lasting = [i for i in home_cities if home_days[i] >= 365]
    false_homes = [i for i in home_cities if home_days[i] < 120
                   and not any(km(cities[i], cities[j]) <= METRO_KM for j in lasting)]
    caveat = ("" if not false_homes else
              " Caveat: the window also crowns " + ", ".join(city_name(i) for i in false_homes[:6])
              + " as home for a while, because a long trip outweighed a quiet stretch at home; those "
              "trips split in two. Naming the homes by hand (Bay Area, then New York) fixes that.")

    theories = [
        ("Count threshold",
         f"Keep cities over N check-ins: {thresholds[5]} cities at 5+, {thresholds[10]} at 10+, "
         f"{thresholds[25]} at 25+ (out of {len(cities)}). Simple, but {city_name(0)} "
         f"({cities[0]['count']:,}) still dominates every view."),
        ("Trip detection",
         f"A stay more than {AWAY_KM} km from wherever home was over the previous {HOME_WINDOW} days "
         f"counts as travel. That finds {len(trips)} trips across {len(trip_cities)} cities; "
         f"the rest is daily life. Listed in full below." + caveat),
        ("Distance from home",
         f"Arcs and emphasis only beyond {AWAY_KM} km of home: {len(ever_away)} cities qualify at least once."),
        ("Metro collapse",
         f"Merge everything within {METRO_KM} km of a bigger city: {len(cities)} cities become "
         f"{len(clusters)} nodes. Biggest merges: "
         + "; ".join(f"{city_name(i)} absorbs {len(m) - 1}" for i, m in big_clusters) + "."),
        ("Home as ground",
         "Home cities render as a soft, persistent glow with no arcs; travel gets arcs and photos. "
         "Homes that held for a year or more in the rolling window: "
         + ", ".join(f"{city_name(i)} ({home_days[i] // 365}y)" for i in sorted(lasting, key=lambda i: -home_days[i]))
         + "."),
        ("Hand-picked chapters",
         "A curated list of trips drives the arcs and photos; everything else stays ambient. "
         "Use the trip list below as the starting point, then add each chosen moment to moments.json."),
    ]

    trip_rows = []
    for t in sorted(trips, key=lambda t: t["start"]):
        s0, s1 = day_num(t["start"]), day_num(t["end"])
        pics = [p for p in photos if p["city"] in t["cities"] and s0 <= day_num(p["day"]) <= s1]
        route = " → ".join(esc(city_name(i)) for i in t["cities"][:10])
        more = f" (+{len(t['cities']) - 10} more)" if len(t["cities"]) > 10 else ""
        trip_rows.append(
            f'<section class="trip"><h3>{esc(t["start"])} – {esc(t["end"])}'
            f'<span>{s1 - s0 + 1} days · {t["count"]} check-ins · {round(t["far"]):,} km from '
            f'{esc(city_name(t["home"]))} · {len(pics)} photos</span></h3>'
            f'<p>{route}{more}</p>{thumbs(pics)}</section>')

    city_rows = []
    for i, c in enumerate(cities):
        pc = per_city[i]
        home = " home" if i in home_cities else ""
        city_rows.append(
            f'<tr class="{home.strip()}"><td>{esc(c["city"])}</td><td>{esc(c["countryCode"])}</td>'
            f'<td class="n">{c["count"]:,}</td><td>{esc(c["firstVisit"])}</td><td>{esc(c["lastVisit"])}</td>'
            f'<td class="n">{pc["stays"]}</td><td class="n">{pc["longest"]}</td>'
            f'<td class="n">{len(photos_by_city[i])}</td></tr>')

    public = sum(1 for p in photos if p["public"])
    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Atlas review</title>
<style>
  body {{ font: 13px/1.5 ui-monospace, "JetBrains Mono", Menlo, monospace; color: #0b0b0c;
         background: #fcfcfd; margin: 40px auto; max-width: 1100px; padding: 0 24px; }}
  h1 {{ font-size: 15px; letter-spacing: 0.3em; text-transform: uppercase; }}
  h2 {{ font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; margin-top: 48px; color: #195cff; }}
  .note {{ color: #5c5c66; max-width: 72ch; }}
  dl dt {{ font-weight: 600; margin-top: 16px; }}
  dl dd {{ margin: 4px 0 0; color: #5c5c66; max-width: 80ch; }}
  .trip {{ border-top: 0.5px solid #dadeea; padding: 16px 0; }}
  .trip h3 {{ margin: 0; font-size: 13px; }}
  .trip h3 span {{ font-weight: 400; color: #5c5c66; margin-left: 12px; }}
  .trip p {{ margin: 6px 0 0; }}
  .thumbs {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }}
  figure {{ margin: 0; width: 120px; }}
  figure img {{ width: 120px; height: 120px; object-fit: cover; border-radius: 3px; display: block; }}
  figcaption {{ font-size: 10px; color: #9b9ba6; margin-top: 2px; }}
  .badge {{ margin-left: 6px; color: #b4570b; }}
  table {{ border-collapse: collapse; width: 100%; margin-top: 12px; }}
  th, td {{ text-align: left; padding: 4px 8px; border-bottom: 0.5px solid #eceef4; }}
  th {{ font-weight: 600; color: #5c5c66; position: sticky; top: 0; background: #fcfcfd; }}
  td.n {{ text-align: right; font-variant-numeric: tabular-nums; }}
  tr.home td {{ color: #195cff; }}
</style></head><body>
<h1>Atlas review</h1>
<p class="note">Local only; links into {esc(export_dir)}. {len(cities)} cities, {len(stays)} stays,
{len(photos)} Swarm photos ({public} public, {len(photos) - public} friends-only; friends-only ones
are marked). Pick photo moments from the trips, choose a cleanup theory, and hand both back.</p>

<h2>Cleanup theories</h2>
<dl>{"".join(f"<dt>{esc(t)}</dt><dd>{esc(d)}</dd>" for t, d in theories)}</dl>

<h2>Trips ({len(trips)})</h2>
{"".join(trip_rows)}

<h2>Cities ({len(cities)})</h2>
<p class="note">Blue rows were home at some point (by the rolling {HOME_WINDOW}-day window).
Longest stay is in days.</p>
<table><thead><tr><th>City</th><th>CC</th><th>Check-ins</th><th>First</th><th>Last</th>
<th>Stays</th><th>Longest</th><th>Photos</th></tr></thead><tbody>
{"".join(city_rows)}
</tbody></table>
</body></html>
"""
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w") as f:
        f.write(doc)
