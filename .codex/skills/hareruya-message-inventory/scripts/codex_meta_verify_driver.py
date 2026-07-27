#!/usr/bin/env python3
"""wrong_meta 指摘を**反証側にバイアスをかけて**独立検証し、確定分の是正値を得る（read-only）。

## 前提
1回目の敵対的レビューは「捏造を摘発せよ」というバイアスで走らせたため、指摘は過剰に出る
（実績: fabrication 2件中1件が偽陽性、wrong_en 37件中28件が偽陽性）。
そのまま適用すると正しい行を壊す。よって**2回目は逆バイアス**をかける:

  既定は refuted。**反証できなかった場合のみ confirmed** とし、その場合に限り是正値を出させる。

## 出力
{"id":..,"verdict":"refuted|confirmed","fix":{"kind":..,"where":..,"disp":..,"cond":..,"next":..},"detail":".."}
fix は**是正が必要な列だけ**。据え置く列は null。文言（ja/en）は対象外＝絶対に変更させない。

使い方:
  python3 codex_meta_verify_driver.py --slices <dir> --out <dir> [--timeout 900]
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import lib_messages as L

REPO = L.DOC_ROOT
EE = L.EE_ROOT

VOCAB = """
## 統制語彙（是正値はこれに合わせる。実UIが異なる場合のみ実体を書く）
種別: インフォ(成功) / インフォ / 警告 / エラー / エラー(バリデーション) / 確認
  addSuccess→インフォ(成功) / addInfo→インフォ / addWarning→警告 / addError・addDanger→エラー
  Form制約 'message'→エラー(バリデーション) / JS confirm→確認 / JS alert→警告
表示位置: 管理画面上部（管理画面フラッシュ）/ 画面上部（フロントフラッシュ）/ 入力項目直下（フォーム検証）
  / 画面中央(ダイアログ)（confirm・alert）。トースト・右下・モーダル内・本文中など実UIが違う場合は実体を書く。
要素(表示): フラッシュメッセージ / フォームバリデーション / 確認ダイアログ / 警告ダイアログ / トースト / モーダル / 本文テキスト
後続処理: 「処理結果＋遷移先画面」または「同一画面を再表示する」「画面にとどまる」「処理を中止する」等。
"""


def build_prompt(payload: str) -> str:
    return f"""読み取り専用で検証せよ。正本ソース: {EE}

以下は**別のレビュアーが「メタ列が実装と矛盾する」と指摘した行**である。
その指摘が本当に正しいかを、あなたが**反証する側**として検証せよ。

**既定は refuted（指摘は誤り）である。** 実ソースを読んで指摘が動かしがたく正しいと確認できた
場合に限り confirmed とせよ。判断がつかない場合も refuted とせよ。

各行の意味:
  id / kind=種別 / where=表示位置 / disp=要素(表示) / cond=表示条件 / next=後続処理 / ev=根拠
  claim=前レビュアーの指摘内容

検証データ:
{payload}
{VOCAB}

## 注意（誤って confirmed にしやすい論点）
- 前レビュアーは「より詳しい記述が可能」という理由でも指摘を出している。
  **現在値が誤りでない限り confirmed にするな**（粒度が粗いだけ・言い換えの範囲は refuted）。
- 表示位置の統制語彙（管理画面上部など）は概括的な既定値であり、
  実UIがその範疇に収まるなら refuted。**明確に別の場所**（トースト/モーダル内/本文中等）のときだけ confirmed。
- 文言(ja/en)は検証対象外。絶対に変更を提案するな。
- 到達不能なコード（デッドルート/未参照ハンドラ）に対する記述は、そう注記されていれば refuted。

## 出力（JSONLのみ・1行1件・全行について出力）
{{"id":"M04-13-MSG-001","verdict":"refuted|confirmed","fix":{{"kind":null,"where":null,"disp":null,"cond":null,"next":null}},"detail":"実ファイル:行を挙げた理由"}}
confirmed のときだけ fix に**是正が必要な列の値**を入れよ（不要な列は null）。
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
            conf = sum(1 for v in res.values() if v.get("verdict") == "confirmed")
            print(f"[{i}] {sp.stem} rows={n} got={len(res)} confirmed={conf}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}] TIMEOUT {sp.stem}", flush=True)
        except Exception as e:  # noqa: BLE001
            print(f"[{i}] ERROR {sp.stem}: {e}", flush=True)


if __name__ == "__main__":
    main()
