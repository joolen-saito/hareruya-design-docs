#!/usr/bin/env python3
"""Backlog「不具合（バグ）」未対応・処理中 277件 と 設計書乖離 1034件 の重複候補を出す。

突合の手掛かりは4つ。どれが効いたかは出力に残す（人が確かめられるように）。

  1. 機能No     チケット本文の `F01-01` 形式
  2. 設計書     `0301_基本設計仕様書` の4桁コード
  3. 実装ファイル チケットの「現在の挙動」「補足情報」に出る path と、乖離側 実装参照/現実装
  4. 本文類似度  チケット(期待される挙動＋現在の挙動＋課題) と 乖離(設計期待値＋実装実態＋差分内容)
                 を正規化した文字2-gram の Jaccard

判定はしない。候補と根拠を並べるだけで、クローズ可否は人が決める。

入力: backlog_wip/issues_bug_open.json（fetch_backlog_bug_open.py が取得）
      drift_findings_list_effort.tsv
出力: backlog_wip/backlog_drift_candidates.tsv  チケット×候補（上位3件）
"""
import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

csv.field_size_limit(10 ** 9)

BASE = Path(__file__).resolve().parent
ISSUES = BASE / "backlog_wip" / "issues_bug_open.json"
DRIFT = BASE / "drift_findings_list_effort.tsv"
OUT = BASE / "backlog_wip" / "backlog_drift_candidates.tsv"

FNO = re.compile(r"([A-Z]\d{2}-\d{2})")
BOOK = re.compile(r"(\d{4})_基本設計仕様書")
PATH = re.compile(r"[\w./\-]+\.(?:php|twig|yaml|yml|js|sql)")
NOISE = re.compile(r"[\s　]+|[、。，．・「」『』（）()\[\]{}<>:：;；/／\\|,.\-–—_＿\"'`*#＞>▼■]+")
TOPN = 3


def norm(t: str) -> str:
    return NOISE.sub("", unicodedata.normalize("NFKC", t or "")).lower()


def bigrams(t: str) -> set:
    return {t[i:i + 2] for i in range(len(t) - 1)} if len(t) > 1 else ({t} if t else set())


def jaccard(a: set, b: set) -> float:
    return len(a & b) / len(a | b) if a and b else 0.0


def files(t: str) -> set:
    out = set()
    for m in PATH.finditer(t or ""):
        name = m.group(0).split("/")[-1]
        # 拡張子だけ、あるいは汎用すぎる名前は手掛かりにならない
        if len(name) > 6 and name not in {"index.twig", "messages.ja.yaml", "messages.en.yaml"}:
            out.add(name)
    return out


def section(text: str, *names: str) -> str:
    """`# 期待される挙動【必須】` や `■ 課題` 形式の節を取り出す。"""
    got = []
    for n in names:
        m = re.search(rf"(?:^|\n)\s*[#■]\s*{n}[^\n]*\n(.*?)(?=\n\s*[#■]\s|\Z)", text, re.S)
        if m:
            got.append(m.group(1))
        else:
            m = re.search(rf"(?:^|\n)\s*{n}[：:](.*?)(?=\n\s*[#■]|\n\s*\w+[：:]|\Z)", text, re.S)
            if m:
                got.append(m.group(1))
    return "\n".join(got)


def main() -> int:
    issues = json.load(ISSUES.open(encoding="utf-8"))
    rows = list(csv.DictReader(DRIFT.open(encoding="utf-8"), delimiter="\t"))
    for i, r in enumerate(rows):
        r["_row"] = i + 2
        r["_fno"] = r["機能No"]
        m = BOOK.search(r["設計書参照"])
        r["_book"] = m.group(1) if m else ""
        r["_files"] = files(r["実装参照"] + " " + r["現実装"] + " " + r["対応の根拠(現develop)"])
        r["_bg"] = bigrams(norm(r["設計期待値"] + r["実装実態"] + r["差分内容"]))

    out = []
    for it in issues:
        text = (it["summary"] or "") + "\n" + (it.get("description") or "")
        body = section(text, "期待される挙動", "現在の挙動", "課題", "あるべき仕様", "課題状況")
        if len(norm(body)) < 30:
            body = text
        bg = bigrams(norm(body))
        fnos = set(FNO.findall(text))
        books = set(BOOK.findall(text))
        tfiles = files(text)

        scored = []
        for r in rows:
            s_txt = jaccard(bg, r["_bg"])
            f_hit = r["_fno"] in fnos
            b_hit = r["_book"] in books and r["_book"] != ""
            shared = tfiles & r["_files"]
            score = s_txt + (0.30 if f_hit else 0.0) + (0.08 if b_hit else 0.0) \
                + min(len(shared), 3) * 0.10
            if score <= 0:
                continue
            scored.append((score, s_txt, f_hit, b_hit, shared, r))
        scored.sort(key=lambda x: -x[0])

        for rank, (score, s_txt, f_hit, b_hit, shared, r) in enumerate(scored[:TOPN], 1):
            hits = []
            if f_hit:
                hits.append("機能No")
            if b_hit:
                hits.append("設計書")
            if shared:
                hits.append("実装ファイル")
            out.append({
                "課題キー": it["issueKey"],
                "状態": it["status"]["name"],
                "件名": it["summary"].replace("\t", " ").replace("\n", " "),
                "候補順位": rank,
                "スコア": f"{score:.3f}",
                "本文類似度": f"{s_txt:.3f}",
                "一致した手掛かり": "＋".join(hits),
                "共通実装ファイル": ",".join(sorted(shared))[:120],
                "チケット機能No": ",".join(sorted(fnos)),
                "チケット設計書": ",".join(sorted(books)),
                "drift行番号": r["_row"],
                "乖離機能No": r["機能No"],
                "乖離機能名": r["機能名"],
                "乖離優先度": r["優先度"],
                "乖離トリアージ区分": r["トリアージ区分"],
                "乖離codex工数": r["codex工数"],
                "乖離設計期待値": r["設計期待値"].replace("\t", " ").replace("\n", " ")[:400],
                "乖離差分内容": r["差分内容"].replace("\t", " ").replace("\n", " ")[:400],
                "チケット期待挙動": section(text, "期待される挙動").replace("\t", " ").replace("\n", " ")[:400],
                "チケット現在挙動": section(text, "現在の挙動", "課題").replace("\t", " ").replace("\n", " ")[:400],
            })

    with OUT.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out[0].keys()), delimiter="\t",
                           lineterminator="\n")
        w.writeheader()
        w.writerows(out)

    top = [o for o in out if o["候補順位"] == 1]
    print(f"チケット {len(issues)}件 / 乖離 {len(rows)}件 → 候補 {len(out)}行")
    for lo, hi in ((0.60, 9), (0.45, 0.60), (0.35, 0.45), (0.0, 0.35)):
        n = sum(1 for o in top if lo <= float(o["スコア"]) < hi)
        print(f"  1位スコア {lo:.2f}以上: {n}件")
    print(f"保存: {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
