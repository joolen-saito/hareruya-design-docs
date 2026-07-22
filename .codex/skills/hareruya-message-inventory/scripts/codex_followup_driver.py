#!/usr/bin/env python3
"""後続処理列を「処理結果＋遷移先画面」の簡潔形へ codex で書き換える。

方針(ユーザ指定): 詳細な内部処理(DOM操作・フォーム生成等)は書かない。
「XXX画面に遷移する / XXX画面に留まる / メッセージ表示後に正常終了しXXX画面に遷移する」
のように、処理結果と遷移先画面がわかれば良い。遷移先は画面名で(ルート名は補助)。

既存の後続処理(ソース確認済み)を要約・再整形するだけで、新事実は創作しない。
要ソース確認の行はそのまま。結果は /tmp/followup/<fid>.json = {id: new_followup}。

使い方:
  python3 codex_followup_driver.py --fids /tmp/fu_p0.json --out /tmp/followup
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


def doc_title(fid: str) -> str:
    for md in FUNCTIONS.rglob(f"{fid.lower()}_*.md"):
        for line in md.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("# "):
                return line[2:].strip()
    return fid


def rows_for(fid: str):
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    area = fid.upper()
    out = []
    for l in lines[1:]:
        f = l.split("\t")
        if f[0].startswith(area + "-MSG-"):
            out.append({"id": f[0], "content": f[ic["メッセージ内容"]],
                        "trigger": f[ic["トリガー（条件）"]], "followup": f[ic["後続処理"]]})
    return out


def build_prompt(fid: str, rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return f"""読み取り専用。後続処理列を簡潔な標準形へ書き換えます。新しい事実の創作は禁止（既存の後続処理とソースの範囲で要約するだけ）。

機能 {fid}（画面名: {doc_title(fid)}）
設計書: {REPO}/functions  正本ソース: {EE}

各行の現行 後続処理(JSON):
{payload}

## 書き換え規則
- 「処理結果＋遷移先画面」だけを残す。詳細な内部処理(DOM操作・フォーム生成・変数・関数名・return等)は書かない。
- 形の例: 「パスワード変更画面に遷移する」/「会員一覧画面に留まる」/「送信せず現在の画面に留まる」/
  「エラーを表示するが処理は正常終了し、注文編集画面に遷移する」。
- 遷移先は**画面名**で書く(ルート名 admin_xxx ではなく、対応する設計書の画面名)。画面名が特定できない場合のみ
  ルート名を括弧補助で残してよい。リダイレクトなら「〜画面に遷移する」、中止/留まるなら「〜画面に留まる」。
- 現行が「要ソース確認」の行は new_followup を "要ソース確認" のままにする。

出力はJSONLのみ（各行1オブジェクト、他の文字を書かない）:
{{"id":"{fid.upper()}-MSG-001","new_followup":"簡潔な後続処理"}}"""


def run_codex(prompt: str, timeout: int):
    r = subprocess.run(["codex", "exec", "--sandbox", "read-only", prompt],
                       cwd=str(REPO), capture_output=True, text=True, timeout=timeout)
    out = {}
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                o = json.loads(line)
                if "id" in o and "new_followup" in o:
                    out[o["id"]] = o["new_followup"]
            except json.JSONDecodeError:
                pass
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fids", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--timeout", type=int, default=560)
    args = ap.parse_args()
    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    fids = json.load(open(args.fids, encoding="utf-8"))
    for i, fid in enumerate(fids, 1):
        rp = outdir / f"{fid}.json"
        if rp.exists():
            print(f"[{i}/{len(fids)}] skip {fid}", flush=True)
            continue
        rows = rows_for(fid)
        try:
            res = run_codex(build_prompt(fid, rows), args.timeout)
            rp.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
            print(f"[{i}/{len(fids)}] {fid} rows={len(rows)} rewritten={len(res)}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}/{len(fids)}] TIMEOUT {fid}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(fids)}] ERROR {fid}: {e}", flush=True)


if __name__ == "__main__":
    main()
