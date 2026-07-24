#!/usr/bin/env python3
"""ja/en対訳の言語の正しさを codex で批判的レビュー(en列に日本語混入・ja列誤り等の摘発)。

結果は /tmp/langrev/<fid>.json = [{id,verdict,detail}]。verdict: en_has_jp|ja_wrong|en_wrong|fabrication。
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
        if f[0].startswith(area + "-MSG-"):
            out.append({"id": f[0], "ja": f[ic["メッセージ内容"]][:300],
                        "en": f[ic["メッセージ内容(英語)"]][:300],
                        "evidence": f[ic["根拠(file:line)"]][:110]})
    return out


def build_prompt(fid: str, rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return (
        "ja/en対訳の言語の正しさを批判的にレビュー。読み取り専用、忖度なし。実ソース "
        + str(EE) + " で確認。\n\n"
        "各行(id / ja=画面上の文言 / en=画面上の文言(英語) / evidence=根拠):\n"
        + payload + "\n\n"
        "## 検証\n"
        "- ja: 日本語ロケールの実表示。キーなら messages.ja.yaml/validators.ja.yaml(+vendor validators.ja.xlf)値、"
        "ハードコードならその文言、未定義キーならキー名。開発者が alert('English') 等で英語をハードコードしている"
        "場合は ja表示も英語=正しい(捏造ではない)。\n"
        "- en: 英語ロケールの英訳。messages.en.yaml/vendor en.xlf値。英訳が無いキーは (英訳なし) で正しい。"
        "enに日本語が入っている((英訳なし)表記でなく)なら誤り。別キーの英訳や創作英語も誤り。\n"
        "- 多候補 A / B は候補ごと。\n\n"
        "## 出力(JSONLのみ、問題行だけ。問題なければ何も出さない)\n"
        '{"id":"' + fid.upper() + '-MSG-001","verdict":"en_has_jp|ja_wrong|en_wrong|fabrication","detail":"実キーとja/en.yaml file:line、理由"}'
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
            rp.write_text("[]", encoding="utf-8")
            continue
        try:
            res = run_codex(build_prompt(fid, rows), args.timeout)
            rp.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
            print(f"[{i}/{len(fids)}] {fid} rows={len(rows)} flags={len(res)}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}/{len(fids)}] TIMEOUT {fid}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(fids)}] ERROR {fid}: {e}", flush=True)


if __name__ == "__main__":
    main()
