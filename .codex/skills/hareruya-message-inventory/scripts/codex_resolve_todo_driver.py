#!/usr/bin/env python3
"""要ソース確認(メッセージ内容が未確定)の行を codex で実ソース調査し、解決可能なら逐語で埋める。

方針: 創作は絶対にしない。$e->getMessage() 等の可変でも、例外送出箇所に具体的リテラルが
あれば逐語で拾う。単一に確定できない/真に動的なら 要ソース確認 のまま理由を書く。
undefined key は「キー文字列がそのまま表示される(実装バグ候補)」等を明記。

結果は /tmp/todo/<fid>.json = {id: {"resolved": "逐語文言 or null", "reason": "..."}}。
resolved は後段で source_has ゲートに通し、逐語存在しなければ採用しない(捏造ゼロ)。

使い方:
  python3 codex_resolve_todo_driver.py --fids /tmp/td_p0.json --out /tmp/todo
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
        if f[0].startswith(area + "-MSG-") and f[ic["メッセージ内容"]].startswith("要ソース確認"):
            out.append({"id": f[0], "trigger": f[ic["トリガー（条件）"]],
                        "evidence": f[ic["根拠(file:line)"]], "state": f[ic["解決状態"]]})
    return out


def build_prompt(fid: str, rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return f"""読み取り専用で徹底調査。**創作は絶対禁止**。要ソース確認のまま残っているメッセージ文言を、{EE} 実ソースから可能な限り確定します。

機能 {fid}
各行(JSON: id / trigger=表示条件 / evidence=根拠file:line / state=解決状態):
{payload}

各行について根拠の実コードを読み、次を判定:
- 表示文言が実ソースに**逐語で存在する固定リテラル**として特定できるか。
  $message/$e->getMessage() 等の可変でも、例外送出箇所(throw new XxxException('…'))や
  分岐先の addError('key')→messages.ja.yaml のキー値に**具体的リテラル**があれば、それを拾う。
  複数候補があり単一に絞れない場合は resolved=null とし reason に候補を列挙(創作しない)。
- undefined key(ロケール未定義)の場合、キー文字列がそのまま画面表示される(=表示文言はキー名)なら
  resolved にキー文字列、reason に「未定義キーのため翻訳されずキー名が表示(実装バグ候補)」。
- 到達不能分岐・第2引数が空(表示文言なし)・真に動的で確定不能なら resolved=null、reason に理由。

**resolved に入れてよいのは実ソースに逐語存在する文字列のみ**(後段でgrep検証し、非在なら不採用)。

出力はJSONLのみ(各行1オブジェクト、他の文字を書かない):
{{"id":"{fid.upper()}-MSG-001","resolved":"逐語文言 or null","reason":"根拠file:line と判定理由(簡潔)"}}"""


def run_codex(prompt: str, timeout: int):
    r = subprocess.run(["codex", "exec", "--sandbox", "read-only", prompt],
                       cwd=str(REPO), capture_output=True, text=True, timeout=timeout)
    out = {}
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                o = json.loads(line)
                if "id" in o and "resolved" in o:
                    out[o["id"]] = {"resolved": o.get("resolved"), "reason": o.get("reason", "")}
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
            got = sum(1 for v in res.values() if v.get("resolved"))
            print(f"[{i}/{len(fids)}] {fid} todo={len(rows)} 解決={got}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}/{len(fids)}] TIMEOUT {fid}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(fids)}] ERROR {fid}: {e}", flush=True)


if __name__ == "__main__":
    main()
