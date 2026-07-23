#!/usr/bin/env python3
"""各メッセージの翻訳キーを codex で特定し、英語値を en.yaml から決定的に引く。

方針(捏造ゼロ): codex に英語文を書かせない(誤訳防止)。codex は実ソースから
翻訳キー(または英語ハードコードリテラル)を返すだけ。英語値は messages.en.yaml から引く。
- key があり en 定義あり → en = en.yaml値
- key があり en 未定義 → en = キー文字列(ja固定でなくenでも未定義なら表示はキー)
- 英語リテラルが実在 → en = そのリテラル(逐語検証)
- 日本語ハードコード(英語対訳なし) → en = ""(ja固定文言)

結果は /tmp/en/<fid>.json = {id: {"key": "...", "en_literal": "...", "note": "..."}}。

使い方: python3 codex_en_driver.py --fids /tmp/en_p0.json --out /tmp/en
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


def rows_for(fid: str):
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    area = fid.upper()
    out = []
    for l in lines[1:]:
        f = l.split("\t")
        if f[0].startswith(area + "-MSG-") and not f[ic["メッセージ内容(英語)"]].strip():
            out.append({"id": f[0], "ja": f[ic["メッセージ内容"]][:60],
                        "evidence": f[ic["根拠(file:line)"]][:120]})
    return out


def build_prompt(fid: str, rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return f"""読み取り専用。各メッセージの**翻訳キー**を実ソースから特定します。英語文の創作は禁止(キーを返すだけ)。

正本ソース: {EE}  (ja値=messages.ja.yaml, en値=messages.en.yaml。同一キーで対訳)

各行(id / ja=日本語文言(参考) / evidence=根拠file:line):
{payload}

各行について evidence の実コードを読み、その文言の出所を判定:
- addError('key')/trans('key')/制約message:'key' 等で**翻訳キー**を渡している → key にそのキー文字列。
  (キーが変数・連結で単一に定まらなければ key=null)
- コードに**英語のハードコードリテラル**(例 'success', 'Not Found')が直接書かれ表示される → en_literal にそのリテラル。
- 日本語のハードコードリテラルで英語対訳が無い → key=null, en_literal=null, note="ja固定"。
- 多候補(例外の全throw列挙)なら、各候補のキー or リテラルを key に「keyA,keyB」/ en_literalに「litA ／ litB」で。

出力JSONLのみ(他の文字禁止):
{{"id":"{fid.upper()}-MSG-001","key":"翻訳キー or カンマ区切り複数 or null","en_literal":"英語リテラル or null","note":"根拠file:line と判定"}}
英語文言は絶対に創作しない。キー/リテラルは実ソースに逐語存在するものだけ。"""


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
                    out[o["id"]] = {"key": o.get("key"), "en_literal": o.get("en_literal"),
                                    "note": o.get("note", "")}
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
            got = sum(1 for v in res.values() if v.get("key") or v.get("en_literal"))
            print(f"[{i}/{len(fids)}] {fid} empty={len(rows)} 特定={got}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}/{len(fids)}] TIMEOUT {fid}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(fids)}] ERROR {fid}: {e}", flush=True)


if __name__ == "__main__":
    main()
