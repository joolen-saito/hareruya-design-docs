#!/usr/bin/env python3
"""既に書かれた判定に、根本原因キーを後から付ける。

同じ1つの実装欠陥から出た指摘に同じキーを書くと、build が1件に畳んで代表行に要求IDを併記する。
これが無いと、設計書が同じ欠陥を項目表・機能仕様・現行仕様で繰り返し要求している分だけ件数が膨らむ。

  python3 audit_rootcause.py extract --doc 0202   # 指摘の一覧を rootcause_input.tsv に出す
  python3 audit_rootcause.py apply   --doc 0202   # rootcause_map.tsv を parts/*.tsv へ書き戻す
  python3 audit_rootcause.py stat    --doc 0202   # 集約の効き具合を見る
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import design_audit_harness as H  # noqa: E402

ROOT = Path(__file__).resolve().parent
FINDING = ("DRIFT", "NOT_IMPLEMENTED")


def _parts(doc: str) -> list[Path]:
    return sorted((ROOT / "design_audit" / doc / "parts").glob("*.tsv"),
                  key=lambda p: int(p.stem.split("-")[1]))


def extract(doc: str) -> int:
    d = ROOT / "design_audit" / doc
    reqs = {r["要求ID"]: r for r in csv.DictReader((d / "requirements.tsv").open(encoding="utf-8"),
                                                   delimiter="\t")}
    out = []
    for p in _parts(doc):
        for v in csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"):
            if v["判定"] not in FINDING:
                continue
            r = reqs[v["要求ID"]]
            out.append({
                "要求ID": v["要求ID"], "シート": p.stem, "シート名": r["シート名"],
                "区分": r["区分"], "判定": v["判定"], "重要度": v["重要度"],
                "設計期待値": v["設計期待値"], "実装実態": v["実装実態"],
                "実装参照": v["実装参照"], "根本原因": v.get("根本原因", ""),
            })
    path = d / "rootcause_input.tsv"
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out[0]), delimiter="\t", lineterminator="\n")
        w.writeheader(); w.writerows(out)
    print(f"extract: 指摘 {len(out)}件 -> {path}")
    return 0


def apply(doc: str) -> int:
    d = ROOT / "design_audit" / doc
    m = d / "rootcause_map.tsv"
    if not m.is_file():
        print(f"NG: {m} が無い（列: 要求ID / 根本原因）")
        return 1
    mapping = {r["要求ID"]: r["根本原因"].strip()
               for r in csv.DictReader(m.open(encoding="utf-8"), delimiter="\t")}
    written = 0
    for p in _parts(doc):
        rows = list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"))
        changed = False
        for v in rows:
            if v["判定"] in FINDING and mapping.get(v["要求ID"]):
                if v.get("根本原因", "") != mapping[v["要求ID"]]:
                    v["根本原因"] = mapping[v["要求ID"]]
                    changed = True; written += 1
        if changed:
            with p.open("w", encoding="utf-8", newline="") as fh:
                w = csv.DictWriter(fh, fieldnames=H.VERDICT_COLUMNS, delimiter="\t",
                                   lineterminator="\n")
                w.writeheader()
                for v in rows:
                    w.writerow({c: v.get(c, "") for c in H.VERDICT_COLUMNS})
    missing = [p.stem for p in _parts(doc)]
    print(f"apply: {written}件に根本原因を書き込んだ")
    return 0


def stat(doc: str) -> int:
    d = ROOT / "design_audit" / doc
    reqs = {r["要求ID"]: r for r in csv.DictReader((d / "requirements.tsv").open(encoding="utf-8"),
                                                   delimiter="\t")}
    find = []
    for p in _parts(doc):
        find += [v for v in csv.DictReader(p.open(encoding="utf-8"), delimiter="\t")
                 if v["判定"] in FINDING]
    pub = [v for v in find if v["実装実態"].strip() and reqs[v["要求ID"]]["区分"] != "表示メッセージ"]
    kept, folded, n = H.dedupe_by_impl_actual(pub, reqs)
    keyed = sum(1 for v in find if (v.get("根本原因") or "").strip())
    print(f"指摘 {len(find)}件（根本原因つき {keyed}件）→ 掲載 {len(kept)}件（{n}件を代表へ折り畳み）")
    groups: dict[str, int] = {}
    for v in pub:
        k = (v.get("根本原因") or "").strip() or "（キー無し）"
        groups[k] = groups.get(k, 0) + 1
    for k, c in sorted(groups.items(), key=lambda x: -x[1])[:12]:
        if c > 1:
            print(f"  {c:3}件 → {k}")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["extract", "apply", "stat"])
    ap.add_argument("--doc", required=True)
    a = ap.parse_args()
    sys.exit({"extract": extract, "apply": apply, "stat": stat}[a.command](a.doc))


if __name__ == "__main__":
    main()
