#!/usr/bin/env python3
"""要素/要素(表示)/どこに/トリガー/後続処理/根拠 の要ソース確認を実ソースで確定する。

方針(捏造ゼロ): 実ソースを読んで確定できるものだけ埋める。真に不能なら要ソース確認のまま。
- 要素(操作トリガー): その文言を出すきっかけのボタン/リンク/操作を利用者視点で(例「削除ボタン押下」)。
- 要素(表示): 表示手段の種別。フラッシュ→「フラッシュメッセージ」/ JS confirm→「確認ダイアログ」/
  alert→「警告ダイアログ」/ モーダル→「モーダル」/ トースト→「トースト」/ インライン→「入力項目付近」。
- どこに: 表示位置。フラッシュ→「管理画面上部」/ ダイアログ→「画面中央(ダイアログ)」/
  トースト→「画面隅」/ インライン→「入力項目付近」。
- トリガー(条件)/後続処理: 未確定なら実装から利用者視点で簡潔に(内部用語禁止)。
- 根拠(file:line): 現在が「要ソース確認: …」の説明文なら、実ファイル:行 を先頭に付け直す(説明は後ろへ)。

結果は /tmp/meta/<fid>.json = {id:{"element":..,"disp":..,"where":..,"trigger":..,"followup":..,"evidence":..}}。
値は実ソース由来のみ / 要ソース確認 / null(不要)。

使い方: python3 codex_meta_driver.py --fids /tmp/mt_p0.json --out /tmp/meta
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
COLS = {"要素": "element", "要素(表示)": "disp", "どこに": "where",
        "トリガー（条件）": "trigger", "後続処理": "followup", "根拠(file:line)": "evidence"}


def rows_for(fid: str):
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    area = fid.upper()
    out = []
    for l in lines[1:]:
        f = l.split("\t")
        if not f[0].startswith(area + "-MSG-"):
            continue
        need = {v: f[ic[k]].strip().startswith("要ソース確認") for k, v in COLS.items()}
        if any(need.values()):
            out.append({"id": f[0], "content": f[ic["メッセージ内容"]][:45], "kind": f[ic["種別"]],
                        "need": need, "evidence": f[ic["根拠(file:line)"]][:120]})
    return out


def build_prompt(fid: str, rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return f"""読み取り専用で確定。**創作禁止**。各行の未確定メタ項目(need=true)を実ソースから埋めます。

正本ソース: {EE}
各行(id / content=文言(参考) / kind=種別 / need=確定が必要な項目 / evidence=根拠):
{payload}

## 判定(need が true の項目のみ)
- element(要素/操作トリガー): その文言を出す**きっかけの操作**を利用者視点で。例「削除ボタン押下」「登録ボタン押下」
  「CSVアップロード実行」「一覧リンク押下」。JSダイアログは押下ボタン名。不能なら"要ソース確認"。
- disp(要素[表示]/表示手段): フラッシュ→「フラッシュメッセージ」/ JS confirm()→「確認ダイアログ」/
  alert()→「警告ダイアログ」/ モーダル内→「モーダル」/ トースト→「トースト」/ フォーム項目下→「入力項目付近」。
- where(どこに/表示位置): フラッシュ→「管理画面上部」/ ダイアログ→「画面中央(ダイアログ)」/
  トースト→「画面隅」/ インライン→「入力項目付近」。
- trigger(表示条件): 未確定なら「何をしたとき出るか」を簡潔に(内部用語=例外/ルート/メソッド/DOM禁止)。
- followup(後続処理): 未確定なら「処理結果＋遷移先画面」or「モーダルは開いたまま/閉じる」。
- evidence(根拠): 現在が「要ソース確認: 説明」の形なら、実ファイル:行 を特定して "path:line | 説明" の形へ。

## 出力(JSONLのみ)
{{"id":"{fid.upper()}-MSG-001","element":"..or 要ソース確認 or null","disp":"..or null","where":"..or null","trigger":"..or null","followup":"..or null","evidence":"path:line.. or null","note":"根拠"}}
null は need=false の意。実ソース由来のみ・推測で埋めない。"""


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
