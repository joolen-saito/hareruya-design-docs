#!/usr/bin/env python3
"""エラー系候補(PHP例外/JSON直書き/twigハードコード)を codex で判定・機能割当・メタ確定（捏造ゼロ）。

非trans源のため、まず**ユーザー画面に実際に表示されるか**を検証する:
- php_exception: その例外が ExceptionListener→error.twig もしくは getMessage()→JSON でUI表示されるか。
  内部/開発用(catchされ握り潰し/ログのみ)なら not_shown。
- php_json_literal: JsonResponse がフロント/管理JSで表示されるか。
- twig_hardcoded: タグ間テキストが実画面に表示される運用メッセージか(content/label は除外)。
verdict: message(収録) / content(静的説明本文) / label(ラベル/見出し) / not_shown(UI非表示)。
message のみ fid(M/F系)＋kind/where/disp/trigger/followup を実装から確定。文言は逐語(変更禁止)。

出力: <out>/batch_NNN.json = [{occ,verdict,fid,kind,where,disp,trigger,followup,en,note}]
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import lib_messages as L

REPO = L.DOC_ROOT
EE = L.EE_ROOT


def build_prompt(rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return (
        "読み取り専用で判定。**創作禁止**。以下は flash/フォーム制約/JS/twig|trans では拾えない"
        "「エラー系」候補。各文言が**実際にユーザー画面に表示される運用メッセージか**を実ソースで検証し、"
        "表示されるもののみ機能へ割当てる。実ソース: " + str(EE) + " / 設計書: " + str(REPO / "functions") + " の *.md。\n\n"
        "各候補(cls=源クラス / occ=file:line / ja=日本語 / en=英語(空可) / key=transキー(空可)):\n"
        + payload + "\n\n"
        "## 手順\n"
        "1. verdict:\n"
        "   - message: 例外がExceptionListener→error.twigやgetMessage()→JSONで表示される/JsonResponseがJSで"
        "表示される/twigタグ間テキストが実画面に出る**運用通知**(検証エラー/失敗/不正/見つからない等)。\n"
        "   - content: 制度説明・注意書き・案内本文等の静的文。 label: 見出し/ボタン/表ヘッダ。\n"
        "   - not_shown: その例外/文言がUIに出ない(catchされ握り潰し・ログ専用・到達不能・開発用)。\n"
        "   message 以外は以降 null。\n"
        "2. fid: occ のクラス/twigを #[Template]/route で辿り設計書 m*.md/f*.md の機能ID(例 m04-13,f05-05)。"
        "共通/特定不能は \"要ソース確認\"。\n"
        "3. en: key があれば en.yaml 値、無ければハードコード英語があればそれ、無ければ \"（英訳なし）\"。\n"
        "4. kind/where/disp/trigger/followup を実装から。where例: JSONエラー→「画面上部/ダイアログ」、"
        "error.twig→「エラー画面」、twig本文→「本文テキスト」。不能は\"要ソース確認\"。\n\n"
        "## 出力(JSONLのみ、全行)\n"
        '{"occ":"..:123","verdict":"message|content|label|not_shown","fid":"m04-13 or 要ソース確認 or null",'
        '"kind":"..","where":"..","disp":"..","trigger":"..","followup":"..","en":"..","note":"根拠"}'
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
                if "occ" in o and "verdict" in o:
                    out.append(o)
            except json.JSONDecodeError:
                pass
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cands", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--batch", type=int, default=10)
    ap.add_argument("--timeout", type=int, default=800)
    args = ap.parse_args()
    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    cands = json.load(open(args.cands, encoding="utf-8"))
    batches = [cands[i:i + args.batch] for i in range(0, len(cands), args.batch)]
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
            msgs = sum(1 for o in res if o.get("verdict") == "message")
            print(f"[{i+1}/{len(batches)}] rows={len(b)} got={len(res)} message={msgs}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i+1}/{len(batches)}] TIMEOUT", flush=True)
        except Exception as e:
            print(f"[{i+1}/{len(batches)}] ERROR: {e}", flush=True)


if __name__ == "__main__":
    main()
