# レビュー依頼：機能の一覧とシナリオの突き合わせ（R2）

あなたは独立したレビュアーです。判定者は別人です。判定を読み、正本と照らして誤りを指摘してください。ファイルは書き換えないでください（読み取り専用）。

## 目的
シナリオテスト（`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/`）は、機能を全部通すことが目的ではない（機能単位の確認は結合テストの役割）。この突き合わせの目的は、**業務の流れに出てくる機能なのに、どのシナリオにも入っていない抜け**を見つけること。

## 成果物（レビュー対象）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/機能との突き合わせ/judge_all.tsv`：411機能の判定（列：機能ID / 機能名 / 判定 / 通るシナリオID / 根拠 / 抜けのとき足す先の案 / 備考 / 機械照合）。判定は「通る」271・「業務の流れに出ない（結合テストで足りる）」86・「範囲外」42・「抜け（要確認）」12
- 機械照合の元：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/機能との突き合わせ/mechanical_hits.tsv`

## 前の巡の扱い

R1 の指摘と扱いは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/機能との突き合わせ/review/dispositions_R1.md`。却下・一部採用の理由を確かめ、同じ指摘を繰り返さない。R1 で直したところと、同じ型の誤り（通常CSVとカスタムCSVの取り違え、名前に触れているだけを通るとする等）がほかの行に残っていないかを特に確かめる。新しい事実の指摘だけを書く。

## 判定の決まり
- 通る：あるシナリオの手順・区間・マトリクスの行・例外で、この機能の画面・処理を実際に使う（対象外として触れているだけは通らない）
- 業務の流れに出ない：業務フローの工程に出てこない（マスタ設定、照会・CSV出力だけ、管理用など）
- 抜け：業務フローの工程に出てくる（または利用者の目的を果たす流れで必ず通る）のに、どのシナリオにも入っていない
- 範囲外：フェーズ2・実装しない・廃止・データ移行・標準機能で工程に出ないもの・非機能

## 正本
- シナリオ：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/*/scenario_list.md`・`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通しシナリオ/*/scenario_list.md`・L4（`U*_*.md`）・`matrix_*/`
- 業務フロー：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05〜18_*.md`
- 機能：`/home/y-saito/Developments/hareruya-design-docs/functions/todo-list.md`、設計書HTML `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html`（grep で）
- 範囲外の台帳：`/home/y-saito/Developments/hareruya-design-docs/functions/phase2_specs.json`・`phase2_candidates.tsv`、`/home/y-saito/Developments/hareruya-design-docs/integration_test/` の除外台帳

## 重点観点
1. **見落とした抜け（最重要）**：「業務の流れに出ない」「範囲外」とした機能のうち、実は業務フローの工程（作業内容にその画面・CSV・処理が出る）に出てくるもの
2. **見かけの「通る」**：「通る」としたが、シナリオでは名前に触れているだけ・対象外・前提としてだけ書かれ、手順や期待値で通していないもの
3. **範囲外の根拠**：フェーズ2・廃止・標準機能の根拠が台帳・設計書にあるか
4. **抜けの10件**：本当に抜けか、足す先の案が適切か

## 出力形式
指摘が無ければ `NONE` の1語だけを出力する。
指摘があるときは、指摘ごとに次の4行を書く（各行は行頭から）。

主張: 判定のどの行（機能ID）が何としているか
実際: 正本ではどうか（ファイルパス:行番号 と引用文）
判定: 事実の誤り / 根拠の捏造 / 事実の欠落 のいずれか
修正案: 結論を先に1文で
