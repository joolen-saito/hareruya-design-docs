#!/usr/bin/env python3
"""fable5戦略に基づき、要ソース確認を実ソース走査で確定する(捏造ゼロ)。

fable5戦略の要点(実ソース検証済み):
- ロケールはja固定・フォールバック無し。未定義キー→キー文字列がそのまま表示(en値は使わない)。
- $e->getMessage(): catch型を特定→try内コールグラフでその型の throw を全列挙→
  全て リテラル/trans(固定キー)/sprintf(trans(固定キー),値) なら「候補A / 候補B …」全列挙で確定。
  open catch(\\Exception/\\Throwable)+DB/IO や 変数メッセージを含むなら KEEP。
- 未定義キー: ja.yaml/validators.ja.yaml→vendor xlf の順で定義探索。あれば実値、全未定義ならキー文字列。

結果は /tmp/strat/<fid>.json = {id: {"resolved": 単一 or "A ／ B", "keep": bool, "reason": "..."}}。
resolved の各候補は後段で source_has ゲート(逐語存在)を通す。keep=true は要ソース確認維持。

使い方: python3 codex_strategy_driver.py --fids /tmp/st_p0.json --out /tmp/strat
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
    return [{"id": f[0], "evidence": f[ic["根拠(file:line)"]], "state": f[ic["解決状態"]]}
            for f in (l.split("\t") for l in lines[1:] if l.strip())
            if f[0].startswith(area + "-MSG-") and f[ic["メッセージ内容"]].startswith("要ソース確認")]


def build_prompt(fid: str, rows) -> str:
    payload = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return f"""読み取り専用で徹底走査。**創作は絶対禁止**。要ソース確認のまま残る表示文言を、次の戦略で可能な限り確定します。

正本ソース: {EE}

## 確定前提(検証済み・厳守)
- ロケールは **ja固定・フォールバック無し**。未定義キーは **キー文字列がそのまま画面表示**される(枠組みの決定的挙動)。
  **en定義値を表示文言にしてはいけない(捏造)**。近傍の似たキーの値を当てるのも捏造。
- 翻訳解決順: src/Eccube/Resource/locale/messages.ja.yaml / validators.ja.yaml → vendor/**/translations/<domain>.ja.xlf。
  この範囲に定義があればその**実値(逐語)**、全て未定義なら**キー文字列そのもの**が表示文言。

## 判定フロー(各行)
根拠(evidence)の file:line と state を起点に実コードを読む:
1. $e->getMessage() 由来:
   a. catch節の例外型を特定(\\InvalidArgumentException 等の狭い型 か \\Exception/\\Throwable か)。
   b. try内の呼び出し先(src/配下 第一者コード)から、catch型(サブタイプ含む)の `throw new` を**全列挙**。
   c. 各throwのメッセージが (固定リテラル) / (trans('固定キー')) / (sprintf(trans('固定キー'),値)) なら
      **候補として全採取**(キーはyaml/xlfで実値へ解決。sprintf/プレースホルダは実行時値注記)。
   d. 全throwがc.で列挙でき、open catch でない → resolved に「候補A ／ 候補B ／ …」で確定。
      throw に変数メッセージを含む / open catch(\\Exception,\\Throwable)+try内にDB(flush,commit)・IO・HTTP がある
      → keep=true(要ソース確認維持)。列挙不能な動的ディスパッチも keep=true。
2. addError('key')/trans('key') 由来: 上記「翻訳解決順」で実値を引く。全未定義なら resolved=キー文字列(reason に未定義=キー名表示のバグ候補)。
3. 到達不能(呼出元0)・第2引数が空(表示文言なし)・$error['message'] 等の外部可変 → keep=true、reason に理由。

## 出力(JSONLのみ、他の文字禁止)
{{"id":"{fid.upper()}-MSG-001","resolved":"確定文言 or 候補A ／ 候補B or null","keep":true/false,"reason":"根拠file:line と判定(候補列挙時は各候補のfile:lineとキー)"}}
- resolved に入れてよいのは**実ソースに逐語存在する文字列(キー実値 or リテラル or キー文字列)のみ**。後段でgrep検証し非在は不採用。
- 確定できないものは keep=true / resolved=null。無理に埋めない。

対象行:
{payload}"""


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
                    out[o["id"]] = {"resolved": o.get("resolved"), "keep": o.get("keep", True),
                                    "reason": o.get("reason", "")}
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
            got = sum(1 for v in res.values() if v.get("resolved") and not v.get("keep"))
            print(f"[{i}/{len(fids)}] {fid} todo={len(rows)} 確定={got}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}/{len(fids)}] TIMEOUT {fid}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(fids)}] ERROR {fid}: {e}", flush=True)


if __name__ == "__main__":
    main()
