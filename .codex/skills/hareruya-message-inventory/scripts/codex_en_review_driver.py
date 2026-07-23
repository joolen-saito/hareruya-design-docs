#!/usr/bin/env python3
"""ja/en対訳の妥当性を codex で批判的レビューする(誤キー・誤対訳・捏造の摘発)。

各メッセージの ja値/en値 が、実ソースで**同一の翻訳キー**の ja/en 値であることを検証する。
en値がその文言の正しい英訳(=同キーのen.yaml値、または未翻訳時のjaフォールバック)か、
別キーの値や創作英語が混入していないかを摘発する。ファイルは編集せずレポートのみ。

結果は /tmp/enrev/<fid>.json = [{id,verdict,detail}]。verdict: ok|wrong_en|fabrication。

使い方: python3 codex_en_review_driver.py --fids /tmp/er_p0.json --out /tmp/enrev
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
            ja, en = f[ic["メッセージ内容"]], f[ic["メッセージ内容(英語)"]]
            if en and en != ja and en != "要ソース確認":
                out.append({"id": f[0], "ja": ja[:60], "en": en[:70],
                            "evidence": f[ic["根拠(file:line)"]][:110]})
    return out


def build_prompt(fid: str, rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return f"""読み取り専用で批判的にレビュー。ja/en対訳の正しさを {EE} 実ソースで検証します。忖度せず疑わしきは指摘。

前提: ja値=messages.ja.yaml, en値=messages.en.yaml(同一キーで対訳)。未翻訳キーはjaへフォールバック。

各行(id / ja=日本語 / en=英語 / evidence=根拠file:line):
{payload}

各行について: evidence の実コードで使われている翻訳キーを特定し、
- その **同一キー** の en.yaml値 が en と一致するか。一致 → ok。
- en が**別キーの値**や**創作英語**(en.yaml/vendor en.xlf に存在しない文字列)なら → wrong_en / fabrication。
- en が ja と同一のはず(未翻訳=jaフォールバック)なのに英訳が入っている、逆に英訳があるべきなのにjaのまま等も指摘。
- en値が messages.en.yaml か vendor/**/*.en.xlf に逐語存在するか必ず確認する。

出力JSONLのみ(問題なしもok行を返す):
{{"id":"{fid.upper()}-MSG-001","verdict":"ok|wrong_en|fabrication","detail":"キーとen.yaml file:line、判定理由"}}"""


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
            flags = sum(1 for v in res if v.get("verdict") != "ok")
            print(f"[{i}/{len(fids)}] {fid} rows={len(rows)} flags={flags}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}/{len(fids)}] TIMEOUT {fid}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(fids)}] ERROR {fid}: {e}", flush=True)


if __name__ == "__main__":
    main()
