#!/usr/bin/env python3
"""依頼文の雛形に機能IDなどを差し込む。 mk_prompt.py <雛形> <機能ID>... → prompts/<機能ID>_<雛形の名前>.md

GEN_PROMPT.md は targets.tsv（build_targets.py）の組の数と開始番号を使う。
"""
import csv, pathlib, re, sys
G = pathlib.Path(__file__).resolve().parent
U = {r["機能ID"]: r for r in csv.DictReader(open(G / "units.tsv", encoding="utf-8"), delimiter="\t")}
T = {r["機能ID"]: r for r in csv.DictReader(open(G / "targets.tsv", encoding="utf-8"), delimiter="\t")} if (G / "targets.tsv").exists() else {}
tpl = (G / sys.argv[1]).read_text(encoding="utf-8")
(G / "prompts").mkdir(exist_ok=True)
PT = {(r["機能ID"], r["部"]): r for r in csv.DictReader(open(G / "parts.tsv", encoding="utf-8"), delimiter="\t")} if (G / "parts.tsv").exists() else {}
for arg in sys.argv[2:]:
    fid, _, part = arg.partition(":")
    u = U[fid]
    common = "・".join(f"`integration_test/casegen/combination/units/_common/{c.split('（')[0]}`（{c.split('（', 1)[1]}" for c in u["共通シート"].split("・") if c) or "（無し）"
    s = (tpl.replace("{FID}", fid).replace("{FNAME}", u["機能名"]).replace("{COMMON}", common)
         .replace("{FIDC}", fid.replace("-", "")).replace("{FIDL}", fid.replace("-", "").lower()))
    if "{N}" in s or "{START}" in s:
        pr = PT.get((fid, part)) or PT.get((fid, ""))
        nparts = sum(1 for k in PT if k[0] == fid)
        note = "この機能の組は全部であなたが書く" if nparts == 1 else f"この機能の組は{nparts}つの部に分け、ほかの部は別の著者が同時に書いている"
        s = (s.replace("{N}", pr["組の数"]).replace("{START}", pr["開始番号"]).replace("{RANGE}", f"{pr['組の開始']}〜{pr['組の終了']}")
             .replace("{PARTNOTE}", note).replace("{SFX}", f".{part}" if part else "").replace("{VARG}", arg))
    assert not re.search(r"\{[A-Z]+\}", s), fid
    out = G / "prompts" / f"{fid}{'_' + part if part else ''}_{pathlib.Path(sys.argv[1]).stem}.md"
    out.write_text(s, encoding="utf-8")
    print(out.relative_to(G))
