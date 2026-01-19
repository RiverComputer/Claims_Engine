#!/usr/bin/env python3
import json
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path

DB_PATH = Path("dev.db")
OUT_PATH = Path("prisma/seed/demo_seed.sql")
PLACEHOLDER_IMAGE_URL = "https://placehold.co/400x300/png?text=Evidence"

PROJECT_TITLES = [
    "Mida Creek Mangrove Planting",
    "The Conference of Landstewards",
    "Nalubaaga Valley Community Mapping",
]

def esc(value):
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value).replace("'", "''")
    return f"'{s}'"

def load_projects(cur):
    rows = cur.execute(
        "select * from Project where title in (?, ?, ?)",
        PROJECT_TITLES
    ).fetchall()
    projects = {row["title"]: row for row in rows}
    missing = [title for title in PROJECT_TITLES if title not in projects]
    if missing:
        raise SystemExit(f"Missing projects in dev.db: {missing}")
    return projects

def normalize_node_data(node):
    try:
        data = json.loads(node["data"])
    except Exception:
        return node["data"]

    now = datetime.utcnow().isoformat() + "Z"
    node_type = node["type"]

    if node_type == "evidence":
        return json.dumps({
            "title": data.get("title") or "Evidence",
            "content": "Evidence placeholder",
            "shortDescription": data.get("shortDescription") or "",
            "fileRef": PLACEHOLDER_IMAGE_URL,
            "thumbnailRef": PLACEHOLDER_IMAGE_URL,
            "color": data.get("color"),
            "createdAt": data.get("createdAt") or now,
        })

    if node_type == "validation":
        return json.dumps({
            "shortSummary": data.get("shortSummary") or "",
            "validatorNames": data.get("validatorNames") or [],
            "validationType": data.get("validationType") or "",
            "evidenceCID": data.get("evidenceCID") or [],
            "color": data.get("color"),
            "createdAt": data.get("createdAt") or now,
        })

    if node_type in ("claim", "claim_root"):
        return json.dumps({
            "title": data.get("title") or "Claim",
            "shortDescription": data.get("shortDescription") or "",
            "evidenceCID": data.get("evidenceCID") or [],
            "validationCID": data.get("validationCID") or [],
            "color": data.get("color"),
            "createdAt": data.get("createdAt") or now,
        })

    if node_type == "shape":
        return json.dumps({
            "shape": data.get("shape") or "rectangle",
            "width": data.get("width") or 220,
            "height": data.get("height") or 140,
            "fill": data.get("fill") or "rgba(148, 163, 184, 0.2)",
            "stroke": data.get("stroke") or "rgba(71, 85, 105, 0.6)",
            "strokeWidth": data.get("strokeWidth") or 2,
            "borderRadius": data.get("borderRadius") or 16,
            "createdAt": data.get("createdAt") or now,
        })

    if node_type == "text":
        return json.dumps({
            "text": data.get("text") or "Text",
            "fontSize": data.get("fontSize") or 16,
            "color": data.get("color") or "#111827",
            "width": data.get("width") or 220,
            "height": data.get("height") or 120,
            "align": data.get("align") or "left",
            "createdAt": data.get("createdAt") or now,
        })

    return json.dumps(data)

def main():
    if not DB_PATH.exists():
        raise SystemExit("dev.db not found. Generate seed from a local DB first.")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    projects = load_projects(cur)
    project_rows = [projects[t] for t in PROJECT_TITLES]

    project_nodes = {}
    project_edges = {}
    for proj in project_rows:
        pid = proj["id"]
        project_nodes[pid] = cur.execute("select * from Node where projectId = ?", (pid,)).fetchall()
        project_edges[pid] = cur.execute("select * from Edge where projectId = ?", (pid,)).fetchall()

    all_project_id = str(uuid.uuid4())
    all_project_title = "All Projects Canvas"
    all_project_desc = "Combined canvas for Mida Creek, Conference of Landstewards, and Nalubaaga Valley"
    all_project_owner = "guest"
    now = datetime.utcnow().isoformat() + "Z"

    offsets = {}
    current_x = 0.0
    margin = 800.0
    for proj in project_rows:
        nodes = project_nodes[proj["id"]]
        if not nodes:
            offsets[proj["id"]] = current_x
            continue
        min_x = min(n["positionX"] for n in nodes)
        max_x = max(n["positionX"] for n in nodes)
        width = max_x - min_x
        offsets[proj["id"]] = current_x - min_x
        current_x += width + margin

    combined_nodes = []
    combined_edges = []
    node_id_map = {}

    for proj in project_rows:
        pid = proj["id"]
        for node in project_nodes[pid]:
            new_id = str(uuid.uuid4())
            node_id_map[node["id"]] = new_id
            combined_nodes.append({
                "id": new_id,
                "projectId": all_project_id,
                "type": node["type"],
                "status": node["status"],
                "positionX": node["positionX"] + offsets[pid],
                "positionY": node["positionY"],
                "data": normalize_node_data(node),
                "cid": node["cid"],
                "attestationUID": node["attestationUID"],
                "createdAt": node["createdAt"],
                "updatedAt": node["updatedAt"],
            })
        for edge in project_edges[pid]:
            combined_edges.append({
                "id": str(uuid.uuid4()),
                "projectId": all_project_id,
                "fromNodeId": node_id_map[edge["fromNodeId"]],
                "toNodeId": node_id_map[edge["toNodeId"]],
                "type": edge["type"],
                "locked": edge["locked"],
                "createdAt": edge["createdAt"],
            })

    lines = []
    lines.append("-- Demo seed data for Postgres")
    lines.append("BEGIN;")
    lines.append('DELETE FROM "Commit";')
    lines.append('DELETE FROM "Edge";')
    lines.append('DELETE FROM "Node";')
    lines.append('DELETE FROM "Project";')

    for proj in project_rows:
        lines.append(
            'INSERT INTO \"Project\" (\"id\",\"title\",\"description\",\"ownerUserId\",\"createdAt\",\"updatedAt\") VALUES ('
            + ",".join([
                esc(proj["id"]),
                esc(proj["title"]),
                esc(proj["description"]),
                esc(proj["ownerUserId"]),
                esc(proj["createdAt"]),
                esc(proj["updatedAt"]),
            ]) + ");"
        )

    lines.append(
        'INSERT INTO \"Project\" (\"id\",\"title\",\"description\",\"ownerUserId\",\"createdAt\",\"updatedAt\") VALUES ('
        + ",".join([
            esc(all_project_id),
            esc(all_project_title),
            esc(all_project_desc),
            esc(all_project_owner),
            esc(now),
            esc(now),
        ]) + ");"
    )

    for proj in project_rows:
        for node in project_nodes[proj["id"]]:
            lines.append(
                'INSERT INTO \"Node\" (\"id\",\"projectId\",\"type\",\"status\",\"positionX\",\"positionY\",\"data\",\"cid\",\"attestationUID\",\"createdAt\",\"updatedAt\") VALUES ('
                + ",".join([
                    esc(node["id"]),
                    esc(node["projectId"]),
                    esc(node["type"]),
                    esc(node["status"]),
                    esc(node["positionX"]),
                    esc(node["positionY"]),
                    esc(normalize_node_data(node)),
                    esc(node["cid"]),
                    esc(node["attestationUID"]),
                    esc(node["createdAt"]),
                    esc(node["updatedAt"]),
                ]) + ");"
            )

    for node in combined_nodes:
        lines.append(
            'INSERT INTO \"Node\" (\"id\",\"projectId\",\"type\",\"status\",\"positionX\",\"positionY\",\"data\",\"cid\",\"attestationUID\",\"createdAt\",\"updatedAt\") VALUES ('
            + ",".join([
                esc(node["id"]),
                esc(node["projectId"]),
                esc(node["type"]),
                esc(node["status"]),
                esc(node["positionX"]),
                esc(node["positionY"]),
                esc(node["data"]),
                esc(node["cid"]),
                esc(node["attestationUID"]),
                esc(node["createdAt"]),
                esc(node["updatedAt"]),
            ]) + ");"
        )

    for proj in project_rows:
        for edge in project_edges[proj["id"]]:
            lines.append(
                'INSERT INTO \"Edge\" (\"id\",\"projectId\",\"fromNodeId\",\"toNodeId\",\"type\",\"locked\",\"createdAt\") VALUES ('
                + ",".join([
                    esc(edge["id"]),
                    esc(edge["projectId"]),
                    esc(edge["fromNodeId"]),
                    esc(edge["toNodeId"]),
                    esc(edge["type"]),
                    esc(edge["locked"]),
                    esc(edge["createdAt"]),
                ]) + ");"
            )

    for edge in combined_edges:
        lines.append(
            'INSERT INTO \"Edge\" (\"id\",\"projectId\",\"fromNodeId\",\"toNodeId\",\"type\",\"locked\",\"createdAt\") VALUES ('
            + ",".join([
                esc(edge["id"]),
                esc(edge["projectId"]),
                esc(edge["fromNodeId"]),
                esc(edge["toNodeId"]),
                esc(edge["type"]),
                esc(edge["locked"]),
                esc(edge["createdAt"]),
            ]) + ");"
        )

    lines.append("COMMIT;")
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text("\\n".join(lines))
    print(f"Wrote seed SQL to {OUT_PATH}")


if __name__ == "__main__":
    main()

