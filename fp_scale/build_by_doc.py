#!/usr/bin/env python3
"""HTML設計書ファイル（書）ごとに、テストケース数と不具合の密度を分解する。

FP を書別に割れないため（理由は BY_DOCUMENT.md 参照）、規模の分母には
正本HTMLから機械抽出した「要求数」を使う。要求数は45冊すべてで欠測がない。
"""
from __future__ import annotations

import collections
import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRIFT = ROOT / "design_impl_drift_report"
OUT = Path(__file__).resolve().parent / "out"

VERDICT_ORDER = ["MATCHED", "OUT_OF_SCOPE", "DRIFT", "NOT_IMPLEMENTED",
                 "UNVERIFIABLE", "DESIGN_ISSUE"]


def read_tsv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def progress_denominators() -> dict[str, tuple[int, int]]:
    """AUDIT_PROGRESS.md の進捗表から 書→(要求数, シート数) を採る。45冊すべてを含む。"""
    out = {}
    pat = re.compile(r"^\|\s*([^|\s*]+)\s*\|\s*([0-9]+)\s*\|\s*([0-9]+)\s*\|")
    for ln in (DRIFT / "AUDIT_PROGRESS.md").read_text(encoding="utf-8").splitlines():
        m = pat.match(ln)
        if m:
            out[m.group(1)] = (int(m.group(2)), int(m.group(3)))
    return out


def verdict_counts() -> dict[str, collections.Counter]:
    """design_audit/<書>/verdicts.tsv の判定分布。判定が終わった書だけ存在する。"""
    out = {}
    for d in sorted((DRIFT / "design_audit").iterdir()):
        f = d / "verdicts.tsv"
        if f.exists():
            out[d.name] = collections.Counter(r["判定"] for r in read_tsv(f))
    return out


def published_findings() -> dict[str, tuple[int, collections.Counter]]:
    """AUDIT_<書>.tsv の掲載指摘（集約・重複除外後）と重要度分布。"""
    out = {}
    for f in sorted(DRIFT.glob("AUDIT_*.tsv")):
        key = f.stem[len("AUDIT_"):]
        if key in ("UNREGISTERED",):
            continue
        rows = read_tsv(f)
        out[key] = (len(rows), collections.Counter((r.get("重要度") or "").strip() for r in rows))
    return out


def doc_functions() -> dict[str, set[str]]:
    inv = read_tsv(ROOT / "endpoint_reports" / "html_sheet_inventory.tsv")
    out = collections.defaultdict(set)
    for r in inv:
        for fid in r["function_ids"].split(","):
            if fid.strip():
                out[r["doc_code"]].add(fid.strip().lower())
    return out


def function_facts() -> tuple[dict[str, int], dict[str, set[str]], dict[str, set[str]]]:
    fd = read_tsv(ROOT / "endpoint_reports" / "function_dependency_inventory.tsv")
    fi = read_tsv(ROOT / "endpoint_reports" / "ec_enterprise_source_function_inventory.tsv")
    cases = {r["id"].lower(): int(r["test_case_count"] or 0) for r in fd}
    tables = {r["id"].lower(): {x for x in r["tables"].split(",") if x} for r in fd}
    routes = {r["id"].lower(): {x for x in r["source_routes"].split(",") if x} for r in fi}
    return cases, tables, routes


def main() -> None:
    OUT.mkdir(exist_ok=True)
    denom = progress_denominators()
    verdicts = verdict_counts()
    findings = published_findings()
    dfn = doc_functions()
    cases, ftables, froutes = function_facts()

    rows = []
    for key in sorted(denom):
        req, sheets = denom[key]
        v = verdicts.get(key)
        judged = sum(v.values()) if v else 0
        oos = v["OUT_OF_SCOPE"] if v else 0
        target = judged - oos
        n_find, sev = findings.get(key, (0, collections.Counter()))
        fns = dfn.get(key, set())
        # ITケース数は機能単位で重複除去する（同じ機能が複数シートから参照されるため）
        it = sum(cases.get(f, 0) for f in fns)
        rts = set().union(*[froutes.get(f, set()) for f in fns]) if fns else set()
        tbs = set().union(*[ftables.get(f, set()) for f in fns]) if fns else set()
        fn_with_route = sum(1 for f in fns if froutes.get(f))
        rows.append({
            "書": key,
            "シート数": sheets,
            "要求数": req,
            "判定済要求数": judged if v else "―",
            "対象要求数": target if v else "―",
            "MATCHED": v["MATCHED"] if v else "―",
            "対象外": oos if v else "―",
            "掲載指摘": n_find,
            "P1": sev.get("P1", 0),
            "P2": sev.get("P2", 0),
            "P3": sev.get("P3", 0),
            "指摘率(対象要求あたり)": f"{n_find/target*100:.2f}%" if v and target else "―",
            "指摘率(千要求あたり)": round(n_find / target * 1000, 1) if v and target else "―",
            "ITケース数": it,
            "ケース/要求": round(it / req, 1) if req else "―",
            "紐づく機能数": len(fns),
            "うちルート帰属済": fn_with_route,
            "ルート帰属率": f"{fn_with_route/len(fns)*100:.0f}%" if fns else "―",
            "到達ルート数": len(rts),
            "到達テーブル数": len(tbs),
        })

    cols = list(rows[0])
    with (OUT / "by_document.tsv").open("w", encoding="utf-8") as f:
        f.write("\t".join(cols) + "\n")
        for r in rows:
            f.write("\t".join(str(r[c]) for c in cols) + "\n")

    judged_rows = [r for r in rows if r["対象要求数"] != "―"]
    tot_req = sum(r["要求数"] for r in rows)
    tot_target = sum(r["対象要求数"] for r in judged_rows)
    tot_find = sum(r["掲載指摘"] for r in judged_rows)
    print(f"書 {len(rows)} 冊 / 要求数 {tot_req:,}")
    print(f"判定済 {len(judged_rows)} 冊 / 対象要求 {tot_target:,} / 掲載指摘 {tot_find:,}")
    print(f"全体の指摘率 {tot_find/tot_target*100:.2f}% = {tot_find/tot_target*1000:.1f} 件/千要求")
    tot_fn = sum(r["紐づく機能数"] for r in rows)
    tot_fr = sum(r["うちルート帰属済"] for r in rows)
    print(f"機能紐付け {tot_fn} / うちルート帰属済 {tot_fr} ({tot_fr/tot_fn*100:.0f}%)"
          f" / ルート帰属ゼロの書 "
          f"{sum(1 for r in rows if r['紐づく機能数'] and not r['うちルート帰属済'])} 冊")


if __name__ == "__main__":
    main()
