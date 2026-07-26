#!/usr/bin/env python3
"""新規追加した twig メッセージ行(front/admin共通)を codex で批判的レビューする。

codex_front_review_driver.py の汎用・非切詰め版（ja/en を切り詰めず偽陽性を排除）。
対象は --ids で渡す新規メッセージID行。実ソース {EE} で検証し問題のみ指摘:
- fabrication: ja が *.yaml に逐語存在しない / en が創作。
- wrong_fid: 描画 twig が割当機能(fid)の画面でない。
- not_message: 運用メッセージでなく静的説明/ラベル。
- wrong_meta: 種別/表示条件/後続処理が実装と食い違う。

出力: <out>/batch_NNN.json
使い方: python3 codex_twig_review_driver.py --ids /tmp/admin_new_ids.json --out /tmp/admin_review --batch 10
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


def rows_for(ids: set[str]):
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    out = []
    for l in lines[1:]:
        f = l.split("\t")
        if f and f[0] in ids:
            out.append({"id": f[0], "screen": f[ic["画面"]], "ja": f[ic["メッセージ内容"]],
                        "en": f[ic["メッセージ内容(英語)"]], "kind": f[ic["種別"]],
                        "trigger": f[ic["トリガー（条件）"]], "fid": f[ic["機能候補(要検証)"]],
                        "evidence": f[ic["根拠(file:line)"]]})
    return out


def build_prompt(rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return (
        "読み取り専用で批判的にレビュー。忖度なし。実ソース: " + str(EE)
        + " / 設計書: " + str(REPO / "functions") + " の *.md。\n\n"
        "各行(id / screen=画面 / ja / en / kind=種別 / trigger=表示条件 / fid=割当機能 / evidence=根拠twig:line,trans key):\n"
        + payload + "\n\n"
        "## 検証(問題のみ指摘)\n"
        "- fabrication: ja が **evidence の根拠元(messages.ja.yaml/validators.ja.yaml **または** "
        "根拠に示された .php/.twig/.en.twig 等のソース file:line)のいずれにも逐語存在しない**、または "
        "en が創作(en.yaml/対応 .en.twig いずれにも非在。ただし『（英訳なし）』は正当表記でOK)。"
        "※ハードコード直リテラル(例外/JsonResponse/twig直書き)は yaml 非在でも**ソースに逐語あれば捏造でない**。\n"
        "- wrong_fid: evidence の twig を #[Template] に持つ Controller の route が指す機能が fid と異なる。\n"
        "- not_message: 静的説明文/注意書き/ラベル等、運用メッセージでない(収録すべきでない)。\n"
        "- wrong_meta: 種別や表示条件が実装と食い違う。\n\n"
        "## 出力(JSONLのみ、問題行だけ。問題なければ何も出さない)\n"
        '{"id":"M04-12-MSG-007","verdict":"fabrication|wrong_fid|not_message|wrong_meta","detail":"実キー/yaml file:line/正しいfid等、理由"}'
    )


def run_codex(prompt: str, timeout: int):
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
    ap.add_argument("--ids", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--batch", type=int, default=10)
    ap.add_argument("--timeout", type=int, default=900)
    args = ap.parse_args()
    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    ids = json.load(open(args.ids, encoding="utf-8"))
    rows = rows_for(set(ids))
    batches = [rows[i:i + args.batch] for i in range(0, len(rows), args.batch)]
    for i, b in enumerate(batches):
        rp = outdir / f"batch_{i:03d}.json"
        if rp.exists():
            print(f"[{i+1}/{len(batches)}] skip", flush=True)
            continue
        try:
            res = run_codex(build_prompt(b), args.timeout)
            rp.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
            print(f"[{i+1}/{len(batches)}] rows={len(b)} flags={len(res)}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i+1}/{len(batches)}] TIMEOUT", flush=True)
        except Exception as e:
            print(f"[{i+1}/{len(batches)}] ERROR: {e}", flush=True)


if __name__ == "__main__":
    main()
