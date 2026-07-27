#!/usr/bin/env python3
"""『根拠(file:line)』が指す場所に文言もキーも無い行を、実際の生成元へ張り替える（read-only codex）。

## 背景
`check_evidence_anchor.py` の MISS ＝ 根拠の file:line 周辺に文言もキーも存在しない行。
典型は controller の `$e->getMessage()` 行や `addError($error->getMessage())` 行を指しており、
**文言を実際に生成しているのは Action / Service / Form Type / locale yaml 側**というパターン。
文言そのものは正しいので捏造ではないが、根拠として機能していない。

## 出力
{"id":..,"verdict":"fixable|keep","evidence":"生成元 file:line; 表示 file:line; ...","detail":".."}
- fixable … 生成元を特定できた。`evidence` に**張り替え後の根拠**（生成元を先頭に、表示経路を後ろに）
- keep    … 現行根拠が妥当、または生成元を特定できない（推測で書かせない）

**文言・メタ列は対象外**。根拠列だけを扱う。

使い方:
  python3 codex_evidence_fix_driver.py --slices <dir> --out <dir> [--timeout 900]
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import lib_messages as L

REPO = L.DOC_ROOT
EE = L.EE_ROOT


def build_prompt(payload: str) -> str:
    return f"""読み取り専用で調査せよ。創作禁止。正本ソース: {EE}

以下の行は『根拠(file:line)』が指す箇所に**文言もロケールキーも存在しない**。
多くは controller の `$e->getMessage()` / `addError($error->getMessage())` を指しており、
実際に文言を生成しているのは Action / Service / Form Type / locale yaml 側である。

各行の意味: id / ja=画面上の文言（「／」区切りは候補併記）/ ev=現行の根拠

検証データ:
{payload}

## やること
1. ja（複数候補ならその全て）を**逐語で生成している箇所**を実ソースで特定する。
   - ロケールキー経由なら「キー参照箇所 file:line」と「locale定義 file:line」の両方
   - 直リテラルなら その file:line
2. 張り替え後の根拠文字列を組み立てる。書式:
   `文言生成元 <path:line>[, <path:line>...]; 表示経路 <path:line>`
   現行根拠が指す表示経路（controller等）は捨てずに「表示経路」として残すこと。
3. 生成元を特定できない、または現行根拠で妥当なら keep とせよ。**推測で書くな。**

## 注意
- ja が「候補A ／ 候補B」の併記なら、**各候補の生成元をすべて**挙げること。
- 文言そのものやメタ列（表示位置・種別・条件・後続処理）の変更は提案するな。根拠列だけが対象。
- パスは {EE} からの相対（例 `src/Eccube/Service/...php:123`）で書くこと。

## 出力（JSONLのみ・1行1件・全行について出力）
{{"id":"M04-08-MSG-019","verdict":"fixable|keep","evidence":"文言生成元 src/...php:123, src/Eccube/Resource/locale/messages.ja.yaml:456; 表示経路 src/...Controller.php:658","detail":"根拠"}}
"""


def run_codex(prompt: str, timeout: int) -> dict:
    r = subprocess.run(["codex", "exec", "--sandbox", "read-only", prompt],
                       cwd=str(REPO), capture_output=True, text=True, timeout=timeout)
    out = {}
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                o = json.loads(line)
                if "id" in o and "verdict" in o:
                    out[o["id"]] = o
            except json.JSONDecodeError:
                pass
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--slices", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--timeout", type=int, default=900)
    args = ap.parse_args()

    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    for i, sp in enumerate(sorted(Path(args.slices).glob("*.jsonl")), 1):
        rp = outdir / (sp.stem + ".json")
        if rp.exists():
            print(f"[{i}] skip {sp.stem}", flush=True)
            continue
        payload = sp.read_text(encoding="utf-8").strip()
        n = len(payload.splitlines())
        try:
            res = run_codex(build_prompt(payload), args.timeout)
            if not res:
                print(f"[{i}] EMPTY {sp.stem} rows={n} → 保存せず再試行対象", flush=True)
                continue
            rp.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
            fx = sum(1 for v in res.values() if v.get("verdict") == "fixable")
            print(f"[{i}] {sp.stem} rows={n} got={len(res)} fixable={fx}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}] TIMEOUT {sp.stem}", flush=True)
        except Exception as e:  # noqa: BLE001
            print(f"[{i}] ERROR {sp.stem}: {e}", flush=True)


if __name__ == "__main__":
    main()
