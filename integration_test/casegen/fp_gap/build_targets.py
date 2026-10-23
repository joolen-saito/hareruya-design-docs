#!/usr/bin/env python3
"""FPから見てケースを足す機能と、ケースの開始番号を出す。 build_targets.py → targets.tsv

依頼者（2026-10-23）: 「目安より少ない機能はケースを適切な観点で増やす。ケースが0件の機能（FPあり・標準やフェーズ2見送りではない）も適切な観点でケースを作る」。
対象は ../../../fp_scale/per_function/out/function_fp.tsv の判定から機械で選ぶ。
- 少ない: 判定が「少ない（P25未満）」。ただしカスタマイズ区分が「標準」の機能は、結合テストケース不要の決定（2026-10-06）により外す。
- ケース0件: 状態が「ケースなし（その他）」で FP が 0 より大きい。機能一覧で別の機能と「同一エンドポイント」とされた機能は種類を「重複登録」にし、対になる機能を書く。
機能と機能シート対応表（functions/function-sheet-map.tsv）の根拠に「廃止」とある機能は、作らずに targets_skipped.tsv へ理由を書く（M04-27。目次が廃止と記し、裁定 ADJ-050 が未決）。
開始番号は既存の連番の続き（テストから外した番号・移した番号・合流後に消した番号も避ける）。以前この作業で足した分（fg_map.tsv）は数えない。
"""
import csv, glob, pathlib, re, collections

P = pathlib.Path(__file__).resolve().parent
CG = P.parent
ROOT = CG.parents[1]
csv.field_size_limit(10**9)


def rd(p):
    with open(p, encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))


fp = rd(ROOT / "fp_scale/per_function/out/function_fp.tsv")
desc = {}
for l in open(ROOT / "functions/todo-list.md", encoding="utf-8"):
    c = [x.strip() for x in l.strip().strip("|").split("|")]
    if len(c) > 6 and re.fullmatch(r"[A-Z]\d\d-\d\d", c[4]):
        desc.setdefault(c[4], c[6])
twin_of = {}
for f, d in desc.items():
    m = re.search(r"（([A-Z]\d\d-\d\d)と同一エンドポイント）", d)
    if m:
        twin_of[f] = m.group(1); twin_of.setdefault(m.group(1), f)   # 逆向きも（A06-09 は A17-05 の側に書いてある）
sheetnote = {}
for r in rd(ROOT / "functions/function-sheet-map.tsv"):
    sheetnote.setdefault(r["機能No"], r.get("一致根拠", ""))
mine = {r["テストID"] for r in rd(P / "fg_map.tsv")} if (P / "fg_map.tsv").exists() else set()
used = collections.defaultdict(int)


def note(t):
    m = re.fullmatch(r"IT-([A-Z]\d\d-\d\d)-(\d{3})", t or "")
    if m and t not in mine:
        used[m.group(1)] = max(used[m.group(1)], int(m.group(2)))


for p in glob.glob(str(CG / "cases/*_test_cases.tsv")):
    for l in open(p, encoding="utf-8"):
        note(l.split("\t")[0])
for fn in ("excluded_hold_cases.tsv", "excluded_open_cases.tsv", "excluded_scope_cases.tsv", "excluded_dup_cases.tsv", "excluded_ut_cases.tsv"):
    for r in rd(CG / fn):
        note(r["テストID"]); note(r.get("元_テストID", ""))
for r in rd(CG / "precond/moved_cases.tsv"):
    note(r["旧テストID"]); note(r["新テストID"])
for r in rd(CG / "link_pub/merged_gone.tsv"):
    note(r["新テストID"])
# 他の作業場所が足して、まだ cases/ に合流していない分も避ける
for p in glob.glob(str(CG / "combination/cases/*_cb_test_cases*.tsv")) + glob.glob(str(CG / "ut_layer/added/*.tsv")):
    for l in open(p, encoding="utf-8"):
        note(l.split("\t")[0])

T, skipped = [], []
for x in fp:
    f = x["機能ID"]
    if x["判定"].startswith("少ない") and x["カスタマイズ区分"] != "標準":
        kind, twin = "少ない", ""
    elif x["状態"] == "ケースなし（その他）" and float(x["FP"]) > 0:
        kind, twin = ("重複登録", twin_of[f]) if f in twin_of else ("ケース0件", "")
    else:
        continue
    if "廃止" in sheetnote.get(f, ""):
        skipped.append([f, x["機能名"], kind, "機能シート対応表の根拠: " + sheetnote[f]]); continue
    T.append([f, x["機能名"], x["区分"], x["カスタマイズ区分"], kind, twin, x["処理単位数"], x["FP"], x["目安P25"], x["目安中央"], x["ケース数"],
              f"{used[f] + 1:03d}"])
with open(P / "targets.tsv", "w", encoding="utf-8", newline="") as fo:
    w = csv.writer(fo, delimiter="\t", lineterminator="\n")
    w.writerow(["機能ID", "機能名", "区分", "カスタマイズ区分", "種類", "対になる機能", "処理単位数", "FP", "目安P25", "目安中央", "いまのケース数", "開始番号"])
    w.writerows(T)
with open(P / "targets_skipped.tsv", "w", encoding="utf-8", newline="") as fo:
    w = csv.writer(fo, delimiter="\t", lineterminator="\n")
    w.writerow(["機能ID", "機能名", "種類", "作らない理由"]); w.writerows(skipped)
print(len(T), "機能", "外した", [s_[0] for s_ in skipped], collections.Counter(t[4] for t in T))
