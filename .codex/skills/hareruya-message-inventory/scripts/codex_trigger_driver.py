#!/usr/bin/env python3
"""表示条件(トリガー)を利用者にわかる簡潔な発生条件へ codex で書き換える。

方針(ユーザ指定): 内部処理の例外処理などが条件になっているのを、簡潔でわかりやすく。
内部実装用語(例外クラス/ルート名/メソッド/フラグ名/DOMセレクタ/file:line)は書かない。

既存の条件(ソース確認済み)を要約するだけで新事実は創作しない。要ソース確認はそのまま。
結果は /tmp/trigger/<fid>.json = {id: new_trigger}。

使い方:
  python3 codex_trigger_driver.py --fids /tmp/tg_p0.json --out /tmp/trigger
"""
from __future__ import annotations

import argparse
import json
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
                        "trigger": f[ic["トリガー（条件）"]]})
    return out


def build_prompt(fid: str, rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return f"""読み取り専用。表示条件(トリガー)を、利用者にわかる簡潔な「このメッセージが出る条件」へ書き換えます。新しい事実の創作は禁止（既存の条件とソースの範囲で要約するだけ）。

機能 {fid}（画面名: {doc_title(fid)}）
設計書: {REPO}/functions  正本ソース: {EE}

各行の現行 表示条件(JSON):
{payload}

## 書き換え規則
- 「何をしたとき / どういう状態のときに出るか」を利用者視点で簡潔に。**内部実装用語は書かない**:
  例外クラス名(ForeignKeyConstraintViolationException 等)、ルート名(admin_xxx)、メソッド名($form->isValid() 等)、
  フラグ名(class_name_del_flg 等)、DOMセレクタ、file:line は書かない。
- 例:「規格CSV登録で、指定した規格が使用中で削除できないとき」/「パスワード変更を保存したとき」/
  「商品検索でエラーが起きたとき」/「必須項目が未入力のまま送信したとき」/「一括売却の登録ボタンを押したとき（送信前確認）」。
- content(メッセージ文言)と丸ごと重複する説明は避け、発生の「きっかけ・状態」に絞る。
- 現行が「要ソース確認」の行は new_trigger を "要ソース確認" のままにする。

出力はJSONLのみ（各行1オブジェクト、他の文字を書かない）:
{{"id":"{fid.upper()}-MSG-001","new_trigger":"簡潔な表示条件"}}"""


def run_codex(prompt: str, timeout: int):
    r = subprocess.run(["codex", "exec", "--sandbox", "read-only", prompt],
                       cwd=str(REPO), capture_output=True, text=True, timeout=timeout)
    out = {}
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                o = json.loads(line)
                if "id" in o and "new_trigger" in o:
                    out[o["id"]] = o["new_trigger"]
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
