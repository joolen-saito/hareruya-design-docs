#!/usr/bin/env python3
"""反証で「妥当」と残った抜けを機能ごとに束ねる。 build_targets.py

targets/<機能ID>_gaps.tsv  その機能のケースにする抜け（監査の10列＋反証の根拠）
targets.tsv                機能ごとの件数・開始番号（既存の連番の続き。テストから外した番号・移した番号・合流後に消した番号も避ける）
dropped.tsv                ケースにしない抜け（反証が妥当以外・標準機能）と理由

標準機能（functions/todo-list.md の区分が「標準」）は結合テストケース不要の決定（2026-10-06）により外す。
"""
import csv, glob, pathlib, re, collections

P = pathlib.Path(__file__).resolve().parent
CG = P.parent
ROOT = CG.parents[1]
csv.field_size_limit(10**9)
HDR = ["項目ID", "パターン", "定め", "根拠", "試すデータ", "結果", "確かめる所", "判定", "テストID", "理由"]


def rd(p):
    with open(p, encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))


cat = {}
for l in open(ROOT / "functions/todo-list.md", encoding="utf-8"):
    c = [x.strip() for x in l.split("|")]
    if len(c) > 7 and re.fullmatch(r"[A-Z]\d\d-\d\d", c[5]):
        cat[c[5]] = c[6]
names = {r["機能ID"]: r["機能名"] for r in rd(P / "units.tsv")}

dp = set()
if (P / "dp_map.tsv").exists():          # 以前の実行で足した分は開始番号に数えない（何度流しても同じ開始番号）
    dp = {r["テストID"] for r in rd(P / "dp_map.tsv")}
used = collections.defaultdict(int)


def note(t):
    m = re.fullmatch(r"IT-([A-Z]\d\d-\d\d)-(\d{3})", t or "")
    if m and t not in dp:
        used[m.group(1)] = max(used[m.group(1)], int(m.group(2)))


for p in glob.glob(str(CG / "cases/*_test_cases.tsv")):
    for l in open(p, encoding="utf-8"):
        note(l.split("\t")[0])
for fn in ("excluded_hold_cases.tsv", "excluded_open_cases.tsv"):
    for r in rd(CG / fn):
        note(r["テストID"]); note(r.get("元_テストID", ""))
for r in rd(CG / "precond/moved_cases.tsv"):
    note(r["旧テストID"]); note(r["新テストID"])
for r in rd(CG / "link_pub/merged_gone.tsv"):
    note(r["新テストID"])

by, drop = collections.defaultdict(list), []
for r in rd(P / "verified.tsv"):
    f = r["項目ID"][3:9]
    if cat.get(f) == "標準":
        drop.append([r["項目ID"], "標準機能", "標準機能は結合テストケース不要（依頼者決定 2026-10-06）"])
    elif r["反証の判定"] != "妥当":
        drop.append([r["項目ID"], r["反証の判定"], r["反証の根拠"]])
    else:
        by[f].append(r)


def wr(p, head, rows):
    with open(p, "w", encoding="utf-8", newline="") as fp:
        fp.write("\t".join(head) + "\n")
        for x in rows:
            fp.write("\t".join(str(v).replace("\t", " ").replace("\n", " ") for v in x) + "\n")


(P / "targets").mkdir(exist_ok=True)
for old in glob.glob(str(P / "targets/*_gaps.tsv")):   # 今回の対象に無くなった機能のファイルだけ消す（著者が読んでいる最中のファイルは消さない）
    if pathlib.Path(old).name[:6] not in by:
        pathlib.Path(old).unlink()
T = []
for f in sorted(by):
    wr(P / f"targets/{f}_gaps.tsv", HDR + ["反証の根拠"], [[r[k] for k in HDR] + [r["反証の根拠"]] for r in by[f]])
    T.append([f, names.get(f, ""), len(by[f]), f"{used[f] + 1:03d}"])
wr(P / "targets.tsv", ["機能ID", "機能名", "抜けの件数", "開始番号"], T)
wr(P / "dropped.tsv", ["項目ID", "扱い", "理由"], drop)
print(len(T), "機能", sum(t[2] for t in T), "件 / ケースにしない", len(drop), dict(collections.Counter(d[1] for d in drop)))
