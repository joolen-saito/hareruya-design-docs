#!/usr/bin/env python3
"""確定済みメッセージ割当を codex CLI で批判的に独立レビューする（捏造/誤りの摘発）。

機能ごとに codex(read-only) を1回呼び、その機能の全メッセージについて
  (1) 捏造: メッセージ内容が根拠(file:line)の実ソースに逐語存在するか
  (2) 誤割当: その機能への帰属が実装(ルート/画面)と整合するか
を独立に判定させ、指摘を JSONL で集約する。結果ファイルは編集せず、レポートのみ出す
（是正は人手/別工程で判断）。

使い方:
  python3 codex_review_driver.py --groups /tmp/review_groups.json --out /tmp/review_out
  python3 codex_review_driver.py --groups ... --only m02-06
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

import lib_messages as L

REPO = L.DOC_ROOT
EE = L.EE_ROOT
TSV = REPO / "message_inventory" / "message_inventory.tsv"
FUNCTIONS = REPO / "functions"


def rows_for(fid: str) -> list[dict]:
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    area = fid.upper()
    out = []
    for l in lines[1:]:
        f = l.split("\t")
        if f[0].startswith(area + "-MSG-"):
            out.append({
                "id": f[0], "content": f[ic["メッセージ内容"]],
                "trigger": f[ic["トリガー（条件）"]], "evidence": f[ic["根拠(file:line)"]],
            })
    return out


def doc_path(fid: str) -> str:
    hits = sorted(FUNCTIONS.rglob(f"{fid.lower()}_*.md"))
    return str(hits[0]) if hits else ""


def build_prompt(fid: str, rows: list[dict]) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return f"""読み取り専用で批判的にレビューしてください。忖度せず、疑わしきは指摘する。創作禁止。

機能 {fid} に割り当てられた確定メッセージを検証します。
設計書: {doc_path(fid)}
正本ソース: {EE}

各メッセージ行(JSON):
{payload}

各行について次を判定:
(1) fabrication(捏造): メッセージ内容(content)が根拠(evidence の file:line)の実ソースに**逐語**存在するか。
    存在しない・言い換え・要約・敬体化・実行時値の差し替え(%maxRecord%→5010等)は捏造。
    content が「要ソース確認」なら判定対象外(ok扱い)。%name% 等のプレースホルダは原文どおりならok。
(2) misassignment(誤割当): この行が機能 {fid} に帰属するのが実装(Route/画面/処理)と整合するか。
    別機能のメッセージが紛れていれば指摘し、正しい機能IDが分かれば示す。
(3) trigger_wrong(条件誤り): 表示条件(trigger)が実装と明確に矛盾していれば指摘(軽微な表現差は不問)。

出力はJSONLのみ(他の文字を書かない)。問題なしの行も verdict:"ok" で1行返す:
{{"id":"...","verdict":"ok|fabrication|misassignment|trigger_wrong","severity":"none|low|high","detail":"根拠 file:line と理由","correct_fid":"m..-.. or null"}}"""


def run_codex(prompt: str, timeout: int) -> list[dict]:
    r = subprocess.run(["codex", "exec", "--sandbox", "read-only", prompt],
                       cwd=str(REPO), capture_output=True, text=True, timeout=timeout)
    out = []
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                o = json.loads(line)
                if "id" in o and "verdict" in o:
                    out.append(o)
            except json.JSONDecodeError:
                pass
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--groups", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--only")
    ap.add_argument("--timeout", type=int, default=560)
    args = ap.parse_args()
    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)

    groups = json.load(open(args.groups, encoding="utf-8"))
    if args.only:
        groups = [g for g in groups if g["fid"] == args.only]

    for i, g in enumerate(groups, 1):
        fid = g["fid"]
        rp = outdir / f"{fid}.json"
        if rp.exists():
            print(f"[{i}/{len(groups)}] skip {fid}", flush=True)
            continue
        rows = rows_for(fid)
        try:
            verdicts = run_codex(build_prompt(fid, rows), args.timeout)
            rp.write_text(json.dumps(verdicts, ensure_ascii=False), encoding="utf-8")
            flags = [v for v in verdicts if v.get("verdict") != "ok"]
            print(f"[{i}/{len(groups)}] {fid}  rows={len(rows)} verdicts={len(verdicts)} "
                  f"flags={len(flags)}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}/{len(groups)}] TIMEOUT {fid}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(groups)}] ERROR {fid}: {e}", flush=True)


if __name__ == "__main__":
    main()
