# unexpanded / promotion パイプラインは廃止（上限撤廃により役割終了）

> 2026-07-22 ／ codexレビュー確定

## 背景
`unexpanded_*` と promotion（export/triage/decision/promote）系スクリプトは、
1機能あたりの上限（旧90件）で**溢れたケースを後から昇格**するための仕組みだった。

## 廃止理由（実測・codex確認）
生成器の上限を撤廃（既定90→0）した結果、**上限による未収載＝0**になった。
適用述語ロード・上限なしで再計算した生成集合は、既存 `all_it_cases.tsv` と
**実行キーが完全一致（不足0・余剰0）**する。

残る「未収載」は**重複除去（同一実行キー）による正当な除外**であり、これを昇格すると
**重複テストになる**ため、昇格対象は存在しない。

## 恒久チェック（promotionの代替）
`scripts/verify_no_unexpanded.py`（本コミットで追加）が
「上限なし・適用述語ロードありの再計算 vs 既存 all_it_cases.tsv の実行キー差分＝0」を検証する。
CIでこれを回せば、母集合の欠落・余剰を継続的に検知できる。

## 削除したファイル（stale・旧母数30k/26k基準で陳腐化）
unexpanded_it_candidates*.tsv / *_summary.md / *_triage* / *_adoption* /
unexpanded_promotion_* / unexpanded_drift_* / unexpanded_adopted_* / unexpanded_promotion_rules.md

promotion を再び使うのは「上限を再導入する」場合に限る。
