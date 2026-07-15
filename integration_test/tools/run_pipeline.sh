#!/usr/bin/env bash
# 結合テスト再生成パイプライン runner（Phase1-4）
#
# usage: run_pipeline.sh <正本HTML> <母集合it_cases.md> [--review]
#   Phase1-2  spec_parser + judge_viewpoints    … 構造化＋判定コード
#   Phase3    generate_cases                    … 実施ケース土台（期待=正本verbatim）
#   Phase4    gate_check                         … 捏造ゼロ・ゲート機械検査（一次防御）
#   --review  codex 敵対レビュー（LLM二次防御）  … 機械ゲート通過後のみ推奨
#
# gate_check が非0（違反あり）なら exit 1。CI に組み込める。
set -euo pipefail

HTML="${1:?正本HTMLを指定}"; IT="${2:?母集合it_casesを指定}"; REVIEW="${3:-}"
T="$(cd "$(dirname "$0")" && pwd)"
OUT="integration_test/_gen_$(basename "$IT" _it_cases.md).md"

echo "=== Phase1-2: 判定コード自動付与 ==="
python3 "$T/judge_viewpoints.py" --html "$HTML" --it "$IT"

echo; echo "=== Phase3: 実施ケース生成 → $OUT ==="
python3 "$T/generate_cases.py" --html "$HTML" --it "$IT" --out "$OUT"

echo; echo "=== Phase4: 捏造ゼロ・ゲート機械検査 ==="
if python3 "$T/gate_check.py" "$OUT" --html "$HTML"; then
  GATE_OK=1
else
  GATE_OK=0
  echo "→ 機械ゲート違反あり。上記を是正するまで敵対レビューへ進めない。"
fi

if [ "$REVIEW" = "--review" ] && [ "${GATE_OK:-0}" = "1" ]; then
  echo; echo "=== Phase4: 敵対レビュー（codex・read-only） ==="
  codex exec --sandbox read-only <<PROMPT
あなたは厳格なQAレビュアーです。日本語・重大度順・所見のみ。基準: 正本HTMLを唯一の正とし捏造（期待の振る舞いが仕様追跡不能/矛盾・誤根拠引用）を許さない／品質を落とさない。合成SEED値は捏造の論点外。
対象: $OUT（各期待は正本verbatim・prose未整形の土台）
正本: $HTML
判定: 1. 期待の振る舞いに捏造・誤根拠があるか。2. OUT/NO_IF/要判定の妥当性。3. prose整形時に必要な観点。4. 総合(承認可/要修正)。
PROMPT
fi
