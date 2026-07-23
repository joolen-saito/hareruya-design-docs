#!/usr/bin/env python3
"""種別/表示条件/後続処理の要ソース確認、および定数(キー名)の画面上の文言を再点検する。

方針(捏造ゼロ): 実ソースを読んで確定できるものだけ埋める。真に不能なら要ソース確認のまま。
- 種別: addSuccess→インフォ(成功) / addError,addDanger→エラー / addWarning→警告 / addInfo→インフォ /
        JS confirm→確認 / alert→警告 / フォーム制約→バリデーション(エラー)。
- トリガー/後続処理: 実装(条件分岐・redirect先)から利用者視点で簡潔に。DOM/変数/例外クラス名は書かない。
- 画面上の文言が定数(キー名 例 admin.error.sort)の行: そのキーが本当に全ロケール未定義か再確認。
  定義があれば実値、未定義ならキー名のまま(reason に確認結果)。

結果は /tmp/recheck/<fid>.json = {id:{"kind":..,"trigger":..,"followup":..,"content":..,"note":..}}。
値は「実ソース由来のみ / 要ソース確認」。content は定数行のみ返す(定義発見時の実値 or キー名)。

使い方: python3 codex_recheck_driver.py --fids /tmp/rc_p0.json --out /tmp/recheck
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
KEYISH = re.compile(r"^[a-z][a-z0-9_.]+\.[a-z0-9_]+$")


def rows_for(fid: str):
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    area = fid.upper()
    out = []
    for l in lines[1:]:
        f = l.split("\t")
        if not f[0].startswith(area + "-MSG-"):
            continue
        kind_todo = f[ic["種別"]].strip().startswith("要ソース確認")
        trig_todo = f[ic["トリガー（条件）"]].strip().startswith("要ソース確認")
        fu_todo = f[ic["後続処理"]].strip().startswith("要ソース確認")
        const = any(KEYISH.match(c.strip()) for c in f[ic["メッセージ内容"]].split(" ／ "))
        if kind_todo or trig_todo or fu_todo or const:
            out.append({"id": f[0], "content": f[ic["メッセージ内容"]][:60],
                        "need": {"kind": kind_todo, "trigger": trig_todo, "followup": fu_todo, "const": const},
                        "evidence": f[ic["根拠(file:line)"]][:120]})
    return out


def build_prompt(fid: str, rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return f"""読み取り専用で再点検。**創作禁止**。各行の未確定項目を実ソースから確定します。

正本ソース: {EE}
各行(id / content=文言(参考) / need=再点検が必要な項目 / evidence=根拠file:line):
{payload}

## 判定(need が true の項目のみ返す)
- kind(種別): 根拠の呼出で決定。addSuccess→「インフォ(成功)」/ addError,addDanger,addRequestError→「エラー」/
  addWarning→「警告」/ addInfo→「インフォ」/ JS confirm()→「確認」/ alert()→「警告」/
  フォーム制約(Assert/NotBlank等)→「バリデーション(エラー)」。判別不能なら"要ソース確認"。
- trigger(表示条件): 「何をしたとき/どういう状態で出るか」を利用者視点で簡潔に。
  内部用語(例外クラス/ルート名/メソッド/フラグ/DOMセレクタ/file:line)は書かない。不能なら"要ソース確認"。
- followup(後続処理): 「処理結果＋遷移先画面」。例「一覧画面に留まる」「編集画面に遷移する」。不能なら"要ソース確認"。
- const=true の行(content にキー名 admin.xxx が含まれる): そのキーを
  messages.ja.yaml/validators.ja.yaml/vendor xlf/messages.en.yaml で再検索。**定義があれば実値**(逐語)、
  全ロケール未定義ならキー名のまま。content フィールドに確定文言(単一 or 「A ／ B」)を返す。定義発見時のみ。

## 出力(JSONLのみ、他の文字禁止)
{{"id":"{fid.upper()}-MSG-001","kind":"種別 or 要ソース確認 or null","trigger":"..or 要ソース確認 or null","followup":"..or 要ソース確認 or null","content":"確定文言 or null","note":"根拠file:line"}}
- null は「再点検不要(need=false)」の意。実ソース由来の値のみ。推測で埋めない。"""


def run_codex(prompt: str, timeout: int):
    r = subprocess.run(["codex", "exec", "--sandbox", "read-only", prompt],
                       cwd=str(REPO), capture_output=True, text=True, timeout=timeout)
    out = {}
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                o = json.loads(line)
                if "id" in o:
                    out[o["id"]] = o
            except json.JSONDecodeError:
                pass
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fids", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--timeout", type=int, default=600)
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
        if not rows:
            rp.write_text("{}", encoding="utf-8")
            continue
        try:
            res = run_codex(build_prompt(fid, rows), args.timeout)
            rp.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
            print(f"[{i}/{len(fids)}] {fid} rows={len(rows)} got={len(res)}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}/{len(fids)}] TIMEOUT {fid}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(fids)}] ERROR {fid}: {e}", flush=True)


if __name__ == "__main__":
    main()
