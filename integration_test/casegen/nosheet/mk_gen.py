#!/usr/bin/env python3
"""著者への依頼文を標準出力へ。 mk_gen.py F09-01"""
import csv, pathlib, sys
G = pathlib.Path(__file__).resolve().parent
fid = sys.argv[1]
r = next(r for r in csv.DictReader(open(G / "targets.tsv", encoding="utf-8"), delimiter="\t") if r["機能ID"] == fid)
kind = fid[0]
ex = {"F": "`integration_test/casegen/cases/F06-15_test_cases.tsv`（フロント画面）、`F10-01_test_cases.tsv`",
      "A": "`integration_test/casegen/cases/A15-01_test_cases.tsv`・`A15-13_test_cases.tsv`（同じ冊子のAPI。要求の送り方・トークンの得方の書き方を合わせる）",
      "B": "`integration_test/casegen/cases/B08-07_test_cases.tsv`・`B16-11_test_cases.tsv`（バッチ）"}[kind]
style = {"F": "", "A": "同じ冊子の既存ケース（見本）の、要求の送り方と応答の見方の書き方に合わせる。",
         "B": "バッチの起動方法が設計書に無ければ、手順は「<バッチ名>を実行する」と書き、起動方法は共有シードの投入方法に「未確定」として残す。"}[kind]
has = sum(1 for _ in open(G / f"materials/{fid}_requirements.tsv", encoding="utf-8")) > 1
reqnote = (f"同じ内容に要求IDを振ったものが `{fid}_requirements.tsv`（`現HTML`=無 の行は抽出が古く、sheet.txt を正とする）" if has
           else "この機能には要求表が無い")
reqrule = ("そのケースが確かめる要求ID（requirements.tsv の 要求ID）をカンマ区切りで書く。空欄にしない。sheet.txt にあるのに要求表に行が無い記述は、いちばん近い見出し行の要求IDを書き、report.md に「要求表に行が無い」と書く（決まりM）。" if has
           else "空欄にする（要求表が無い）。")
t = (G / "GEN_NOSHEET_PROMPT.md").read_text(encoding="utf-8")
for k, v in {"{FID}": fid, "{FIDC}": fid.replace("-", ""), "{FNAME}": r["機能名"], "{BOOK}": r["書番"], "{EXAMPLES}": ex,
             "{STYLE}": style, "{REQNOTE}": reqnote, "{REQRULE}": reqrule}.items():
    t = t.replace(k, v)
print(t)
