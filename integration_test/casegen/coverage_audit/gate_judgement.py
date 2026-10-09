#!/usr/bin/env python3
"""判定ファイルの検査。 gate_judgement.py <単位>...   （引数なしは judgement.tsv がある全単位）

1 sheet.txt の全行がいずれかの判定行に含まれる（判定漏れ0）
2 判定が6種のいずれか
3 テストIDが実在する（all_test_cases.tsv または excluded_hold_cases.tsv）
4 ケースあり・一部抜け・保留除外はテストIDを持つ。保留除外のIDは除外済みのもの、ケースありのIDは現役のもの
5 抜け・一部抜け・対象外は理由を持つ
"""
import csv, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
A = ROOT / "integration_test/casegen/coverage_audit"
C = ROOT / "integration_test/casegen"
csv.field_size_limit(10**9)
VERDICTS = {"ケースあり", "一部抜け", "抜け", "保留除外", "対象外", "説明文"}
live = {r["テストID"] for r in csv.DictReader(open(C / "all_test_cases.tsv", encoding="utf-8"), delimiter="\t")}
hold = {r["テストID"] for r in csv.DictReader(open(C / "excluded_hold_cases.tsv", encoding="utf-8"), delimiter="\t")}


def check(unit):
    d = A / "units" / unit
    n = sum(1 for _ in open(d / "sheet.txt", encoding="utf-8"))
    errs, seen = [], set()
    rows = list(csv.reader(open(d / "judgement.tsv", encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))
    if not rows or rows[0][:5] != ["行", "記述", "判定", "テストID", "理由"]:
        return [f"ヘッダが 行/記述/判定/テストID/理由 でない: {rows[:1]}"]
    for i, r in enumerate(rows[1:], 2):
        if len(r) != 5:
            errs.append(f"{i}行目: 列数が{len(r)}（5であること）")
            continue
        rng, desc, v, ids, why = [x.strip() for x in r]
        m = re.fullmatch(r"L(\d{4})(?:-L(\d{4}))?", rng)
        if not m:
            errs.append(f"{i}行目: 行の書式 {rng!r}")
            continue
        a, b = int(m.group(1)), int(m.group(2) or m.group(1))
        if not (1 <= a <= b <= n):
            errs.append(f"{i}行目: 行の範囲 {rng} が 1〜{n} の外")
            continue
        seen.update(range(a, b + 1))
        if v not in VERDICTS:
            errs.append(f"{i}行目: 判定 {v!r}")
        idl = [x for x in re.split(r"[,、\s]+", ids) if x]
        for t in idl:
            if t not in live and t not in hold:
                errs.append(f"{i}行目: 実在しないテストID {t}")
            elif v == "保留除外" and t not in hold:
                errs.append(f"{i}行目: 保留除外なのに除外済みでないID {t}")
            elif v in ("ケースあり", "一部抜け") and t not in live:
                errs.append(f"{i}行目: {v}なのに現役でないID {t}")
        if v in ("ケースあり", "一部抜け", "保留除外") and not idl:
            errs.append(f"{i}行目: {v}なのにテストIDが空")
        if v in ("抜け", "一部抜け", "対象外") and not why:
            errs.append(f"{i}行目: {v}なのに理由が空")
        if not desc:
            errs.append(f"{i}行目: 記述が空")
    miss = sorted(set(range(1, n + 1)) - seen)
    if miss:
        errs.append(f"判定されていない行 {len(miss)}件: " + ",".join(f"L{x:04d}" for x in miss[:40]))
    return errs


units = sys.argv[1:] or sorted(p.parent.name for p in (A / "units").glob("*/judgement.tsv"))
bad = 0
for u in units:
    e = check(u)
    bad += bool(e)
    for x in e[:60]:
        print(f"{u}: {x}")
print(f"検査 {len(units)}単位 / 不合格 {bad}")
sys.exit(1 if bad else 0)
