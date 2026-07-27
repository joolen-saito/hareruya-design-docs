#!/usr/bin/env python3
"""MESSAGE_LIST の捏造を codex に**敵対的に**検証させる（read-only）。

立場: 「正しいことを確認する」のではなく **「捏造を見つけ出す」**。
迷ったら REFUTE 側に倒す（＝疑わしきは fabrication として報告させる）。

## 検出させる違反
  fabrication      文言が根拠ソースに逐語非在（言い換え/敬体化/要約/創作）
  runtime_value    プレースホルダを実行時値へ差し替えている（%maxRecord%→5010 等）
  wrong_evidence   文言は実在するが、根拠 file:line が指す場所には無い（別箇所からの流用）
  wrong_en         英語列が当該日本語の対訳でない（別キーの英語を流用/創作）
  wrong_meta       種別/表示位置/表示条件/後続処理が実装と矛盾する
  ok               違反なし

## 偽陽性ガード（過去に大量誤判定を出した論点。必ず守らせる）
- **yaml未定義でも捏造ではない**: ハードコード直リテラル（.php/.twig/.js）に逐語あれば正。
  英語の一次資料は messages.en.yaml だけでなく `.en.twig` 兄弟ファイル / validators.en.xlf も該当。
- **未定義キーがそのまま文言になっている行は正**: Symfony は未定義キーをキー文字列のまま描画する。
- **プレースホルダ保持は正**: `%name%` `{{ limit }}` `%s` は原文のまま残すのが規約。
- **「／」区切りの候補併記は正**: 実行時可変で一意に絞れない行は候補を全列挙する規約。
- **ja/en を切り詰めない**: 途中で切れて見えても「途切れ＝捏造」と判定しない。

使い方:
  python3 codex_fabrication_audit_driver.py --slices <dir> --out <dir> [--timeout 900]
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import lib_messages as L

REPO = L.DOC_ROOT
EE = L.EE_ROOT

GUARD = """
## 偽陽性ガード（違反したレビューは無効。必ず守れ）
- yaml/xlf に未定義でも、根拠ソース(.php/.twig/.js/.en.twig)に逐語あれば **捏造ではない**。
- 文言がロケールキー文字列そのもの（例 admin.product.date_range_error）の行は、
  そのキーが locale に**未定義**なら Symfony がキーをそのまま描画するため **正しい**。
- `%name%` `%s` `{{ limit }}` 等のプレースホルダは**原文のまま保持するのが規約**。
  保持は正。実行時値へ置換されていたら runtime_value 違反。
- 「候補A ／ 候補B」の併記は、実行時可変で一意に絞れない行の**規約**。各候補が逐語実在すれば正。
- 日本語/英語が途中で切れて見えても「途切れ＝捏造」と判定するな。
- 英語の一次資料は messages.en.yaml / validators.en.yaml / validators.en.xlf /
  テンプレートの `.en.twig` 兄弟ファイル のいずれでもよい。
"""


def build_prompt(payload: str, focus: str) -> str:
    return f"""読み取り専用で**敵対的に**検証せよ。目的は正しさの確認ではなく **捏造の摘発** である。
迷ったら違反側に倒せ。ただし下の偽陽性ガードに該当するものを違反にするのは誤りである。

正本ソース: {EE}
{focus}

各行は次の意味:
  id / ja=画面上の文言 / en=英語 / kind=種別 / where=表示位置 / cond=表示条件 / next=後続処理 / ev=根拠(file:line)

検証データ:
{payload}
{GUARD}

## 判定ラベル（1行につき最も重いものを1つ）
- fabrication   : ja が根拠ソースに逐語非在（言い換え/敬体化/要約/創作）
- runtime_value : プレースホルダが実行時値へ置換されている
- wrong_evidence: ja は実在するが ev が指す箇所には無い（別箇所からの流用）
- wrong_en      : en が当該 ja の対訳でない
- wrong_meta    : kind/where/cond/next が実装と矛盾する
- ok            : 違反なし

## 出力（JSONLのみ・1行1件・全行について出力）
{{"id":"M04-13-MSG-001","verdict":"ok|fabrication|runtime_value|wrong_evidence|wrong_en|wrong_meta","detail":"実ファイル:行を挙げた根拠。okなら逐語を確認した file:line を書く"}}
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
    ap.add_argument("--focus", default="")
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
            res = run_codex(build_prompt(payload, args.focus), args.timeout)
            if not res:
                print(f"[{i}] EMPTY {sp.stem} rows={n} → 保存せず再試行対象", flush=True)
                continue
            rp.write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
            bad = sum(1 for v in res.values() if v.get("verdict") != "ok")
            print(f"[{i}] {sp.stem} rows={n} got={len(res)} 違反={bad}", flush=True)
        except subprocess.TimeoutExpired:
            print(f"[{i}] TIMEOUT {sp.stem}", flush=True)
        except Exception as e:  # noqa: BLE001
            print(f"[{i}] ERROR {sp.stem}: {e}", flush=True)


if __name__ == "__main__":
    main()
