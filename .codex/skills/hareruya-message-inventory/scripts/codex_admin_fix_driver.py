#!/usr/bin/env python3
"""レビューで wrong_fid/wrong_meta 指摘された行を、指摘を根拠に codex で再確定する（捏造ゼロ）。

各行の現状(ja/en/現fid/種別/表示条件/根拠)とレビュー指摘(detail)を渡し、実ソースを確認のうえ
正しい {fid,kind,where,disp,trigger,followup} を返させる。文言(ja/en)は不変。
fid が設計書に対応しない/共通部品で特定不能なら "要ソース確認"(→EE-ADMIN据置)。

出力: <out>/batch_NNN.json = [{id,fid,kind,where,disp,trigger,followup,note}]
使い方: python3 codex_admin_fix_driver.py --ids /tmp/admin_fix_ids.json --flags /tmp/admin_flags.json --out /tmp/admin_fix --batch 6
"""
from __future__ import annotations

import argparse
import json
import subprocess
from collections import defaultdict
from pathlib import Path

import lib_messages as L

REPO = L.DOC_ROOT
EE = L.EE_ROOT
TSV = REPO / "message_inventory" / "message_inventory.tsv"


def load_rows(ids: set[str], flags_by_id: dict):
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    out = []
    for l in lines[1:]:
        f = l.split("\t")
        if f and f[0] in ids:
            out.append({
                "id": f[0], "ja": f[ic["メッセージ内容"]], "en": f[ic["メッセージ内容(英語)"]],
                "cur_fid": f[ic["機能候補(要検証)"]], "cur_kind": f[ic["種別"]],
                "cur_where": f[ic["どこに"]], "cur_disp": f[ic["要素(表示)"]],
                "cur_trigger": f[ic["トリガー（条件）"]], "cur_followup": f[ic["後続処理"]],
                "evidence": f[ic["根拠(file:line)"]],
                "critique": " / ".join(flags_by_id.get(f[0], [])),
            })
    return out


def build_prompt(rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return (
        "読み取り専用。**創作禁止**。レビュー指摘を踏まえ、各行の機能割当とメタを実ソースで再確定する。"
        "文言(ja/en)は変更しない。実ソース: " + str(EE) + " / 設計書: " + str(REPO / "functions") + " の m*.md。\n\n"
        "各行(id/ja/en/cur_*=現状/evidence=根拠twig:line,trans key/critique=レビュー指摘):\n"
        + payload + "\n\n"
        "## 手順\n"
        "- fid: critique と実ソースに従い、描画twigを #[Template] に持つ Controller の route が指す機能ID(m*)を確定。"
        "設計書 m*.md に対応が無い/共通部品で特定不能なら \"要ソース確認\"。\n"
        "- kind/where/disp/trigger/followup: 実装の分岐条件に忠実に再記述(critique の条件を反映)。"
        "trigger は管理者視点で、内部用語を避けつつ実際の表示条件を正確に。\n\n"
        "## 出力(JSONLのみ、全行出す)\n"
        '{"id":"M05-11-MSG-032","fid":"m05-.. or 要ソース確認","kind":"..","where":"..","disp":"..",'
        '"trigger":"..","followup":"..","note":"route/Controller file:line"}'
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
                if "id" in o and "fid" in o:
                    out.append(o)
            except json.JSONDecodeError:
                pass
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", required=True)
    ap.add_argument("--flags", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--batch", type=int, default=6)
    ap.add_argument("--timeout", type=int, default=700)
    args = ap.parse_args()
    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    ids = set(json.load(open(args.ids, encoding="utf-8")))
    flags = json.load(open(args.flags, encoding="utf-8"))
    fb = defaultdict(list)
    for o in flags:
        fb[o["id"]].append(f"{o['verdict']}: {o.get('detail','')}")
    rows = load_rows(ids, fb)
    batches = [rows[i:i + args.batch] for i in range(0, len(rows), args.batch)]
    for i, b in enumerate(batches):
        rp = outdir / f"batch_{i:03d}.json"
        if rp.exists():
            print(f"[{i+1}/{len(batches)}] skip", flush=True)
            continue
        try:
            res = run_codex(build_prompt(b), args.timeout)
            if not res:
                print(f"[{i+1}/{len(batches)}] EMPTY(再試行対象)", flush=True)
                continue
            rp.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
            print(f"[{i+1}/{len(batches)}] rows={len(b)} got={len(res)}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i+1}/{len(batches)}] TIMEOUT", flush=True)
        except Exception as e:
            print(f"[{i+1}/{len(batches)}] ERROR: {e}", flush=True)


if __name__ == "__main__":
    main()
