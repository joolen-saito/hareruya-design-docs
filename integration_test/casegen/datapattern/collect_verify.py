#!/usr/bin/env python3
"""codex の反証の出力（verify/<束>_out.txt）を集める。 collect_verify.py

verify/<接頭字>_gaps.tsv の抜けごとに、反証の判定を突き合わせて verified.tsv に書く。
出力の最後のコードブロック（TSV）を読む。判定が無い抜け・判定名の誤りは「未判定」として数え、束の名前を出す。
"""
import glob, pathlib, re, collections

P = pathlib.Path(__file__).resolve().parent
HDR = ["項目ID", "パターン", "定め", "根拠", "試すデータ", "結果", "確かめる所", "判定", "テストID", "理由"]
OK = {"妥当", "確認済み", "除外済み", "対象外", "正解未定", "読み違い"}


def last_block(text):
    blocks = re.findall(r"```(?:tsv)?\n(.*?)```", text, re.S)
    return blocks[-1] if blocks else ""


verdict, where = {}, {}
for p in sorted(glob.glob(str(P / "verify/*_out.txt"))):
    b = pathlib.Path(p).name[:-8]
    text = pathlib.Path(p).read_text(encoding="utf-8", errors="replace")
    if "tokens used" not in text:          # 実行中の出力は依頼文の例（実在の項目ID）を含むので読まない
        continue
    # 束の依頼文に載っている項目IDだけを受け付ける
    mine = set(re.findall(r"^(DP-[A-Z]\d\d-\d\d-\d{3})\t", (P / f"verify/{b}_prompt.md").read_text(encoding="utf-8").split("## 出力形式")[0], re.M))
    for l in last_block(text).split("\n"):
        c = l.split("\t")
        if len(c) >= 2 and c[0].strip() in mine:
            verdict[c[0].strip()] = [c[1].strip(), (c[2] if len(c) > 2 else "").strip(), "\t".join(c[3:]).strip()]
            where[c[0].strip()] = b
gaps = []
for p in sorted(glob.glob(str(P / "verify/*_gaps.tsv"))):
    pfx = pathlib.Path(p).name[:-9]
    for l in pathlib.Path(p).read_text(encoding="utf-8").split("\n")[1:]:
        if l.strip():
            gaps.append((pfx, dict(zip(HDR, l.split("\t")))))
miss, cnt, rows = collections.Counter(), collections.Counter(), []
for pfx, g in gaps:
    v = verdict.get(g["項目ID"])
    if not v or v[0] not in OK:
        miss[pfx] += 1
        v = ["未判定", "", ""]
    cnt[v[0]] += 1
    rows.append([g[k] for k in HDR] + v + [where.get(g["項目ID"], "")])
with open(P / "verified.tsv", "w", encoding="utf-8") as f:
    f.write("\t".join(HDR + ["反証の判定", "反証のテストID", "反証の根拠", "束"]) + "\n")
    for r in rows:
        f.write("\t".join(x.replace("\t", " ").replace("\n", " ") for x in r) + "\n")
print(f"抜け {len(rows)}件:", dict(cnt))
if miss:
    print("未判定（束の出力が無い・形式違い）:", dict(miss))
