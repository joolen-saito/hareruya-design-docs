#!/usr/bin/env python3
"""シート単位の判定ファイル（parts/<sheet-id>.tsv）を検証・結合する。

並列で判定を書く場合、1冊まとめての build まで待つと手戻りが大きい。
本ツールは1シート分だけを同じゲートで検査するので、書いた本人がその場で直せる。

  python3 audit_part.py check --doc 0203 --sheet sheet-11   # 1シート分を検査
  python3 audit_part.py merge --doc 0203                    # parts/*.tsv を verdicts.tsv へ結合
  python3 audit_part.py status --doc 0203                   # シート別の判定済み件数
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import design_audit_harness as H  # noqa: E402

ROOT = Path(__file__).resolve().parent
AUDIT = ROOT / "design_audit"


def _load(doc: str):
    outdir = AUDIT / doc
    with (outdir / "requirements.tsv").open(encoding="utf-8") as fh:
        reqs = list(csv.DictReader(fh, delimiter="\t"))
    return outdir, reqs


def check(doc: str, sheet: str) -> int:
    outdir, reqs = _load(doc)
    part = outdir / "parts" / f"{sheet}.tsv"
    if not part.is_file():
        print(f"NG: {part} が無い")
        return 1
    want = [r for r in reqs if r["シート"] == sheet]
    if not want:
        print(f"NG: {sheet} は requirements.tsv に存在しない")
        return 1
    with part.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        missing_cols = [c for c in H.VERDICT_COLUMNS if c not in (reader.fieldnames or [])]
        rows = list(reader)
    errors: list[str] = []
    if missing_cols:
        errors.append(f"列不足: {missing_cols}")
        _report(errors)
        return 1

    sheets = H.Sheets(doc)
    by_id = {r["要求ID"]: r for r in want}
    seen: set[str] = set()
    for v in rows:
        rid = (v.get("要求ID") or "").strip()
        if rid not in by_id:
            errors.append(f"{rid}: このシートの要求IDではない")
            continue
        if rid in seen:
            errors.append(f"{rid}: 重複行")
        seen.add(rid)
        errors.extend(H.validate_verdict(v, by_id[rid], sheets))

    unjudged = [r["要求ID"] for r in want if r["要求ID"] not in seen]
    if unjudged:
        errors.append(f"判定漏れ {len(unjudged)}件: {unjudged[:15]}")
    if errors:
        _report(errors)
        return 1
    counts: dict[str, int] = {}
    for v in rows:
        counts[v["判定"]] = counts.get(v["判定"], 0) + 1
    print(f"OK: {sheet} {len(rows)}要求 " + " ".join(f"{k}={n}" for k, n in sorted(counts.items())))
    return 0


def _report(errors: list[str]) -> None:
    print(f"NG: ゲート違反 {len(errors)}件")
    for e in errors:
        print("  - " + e)


def merge(doc: str) -> int:
    outdir, reqs = _load(doc)
    parts = sorted((outdir / "parts").glob("*.tsv"))
    rows: dict[str, dict] = {}
    for p in parts:
        with p.open(encoding="utf-8") as fh:
            for v in csv.DictReader(fh, delimiter="\t"):
                rows[v["要求ID"]] = v
    with (outdir / "verdicts.tsv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=H.VERDICT_COLUMNS, delimiter="\t", lineterminator="\n")
        w.writeheader()
        for r in reqs:
            v = rows.get(r["要求ID"])
            if v:
                w.writerow({c: v.get(c, "") for c in H.VERDICT_COLUMNS})
    print(f"merge: {len(parts)}シート / {len(rows)}要求 -> {outdir / 'verdicts.tsv'}"
          f"（未判定 {len(reqs) - len(rows)}）")
    return 0


def status(doc: str) -> int:
    outdir, reqs = _load(doc)
    done = {p.stem for p in (outdir / "parts").glob("*.tsv")}
    by_sheet: dict[str, list] = {}
    for r in reqs:
        by_sheet.setdefault(r["シート"], []).append(r)
    for sid in sorted(by_sheet, key=lambda x: int(x.split("-")[1])):
        mark = "DONE" if sid in done else "    "
        print(f"{mark}\t{sid}\t{len(by_sheet[sid]):>4}要求\t{by_sheet[sid][0]['シート名']}")
    print(f"{len(done)}/{len(by_sheet)} シート")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["check", "merge", "status"])
    ap.add_argument("--doc", required=True)
    ap.add_argument("--sheet")
    a = ap.parse_args()
    if a.command == "check":
        if not a.sheet:
            raise SystemExit("--sheet が要る")
        sys.exit(check(a.doc, a.sheet))
    elif a.command == "merge":
        sys.exit(merge(a.doc))
    else:
        sys.exit(status(a.doc))


if __name__ == "__main__":
    main()
