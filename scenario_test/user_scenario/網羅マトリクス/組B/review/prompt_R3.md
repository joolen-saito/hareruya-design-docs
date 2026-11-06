# レビュー依頼：網羅マトリクスの対応表（組B・R3）

あなたは独立したレビュアーです。著者は別人です。成果物を読み、正本と照らして誤りを指摘してください。ファイルは書き換えないでください（読み取り専用）。

## 目的
依頼者の指示「マトリクスで整理して抜け漏れがないか確認できるようにしたい」。業務フローの工程×シナリオ、業務条件×シナリオの表（Excel `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/網羅マトリクス.xlsx` は対応表から機械で作る）で、どの工程・条件の値がどのシナリオで通るか、どこが抜けかを見せる。**偽の○（通っていないのに通るとした）と、偽の対象外（システムを触る工程や範囲内の値を、システムの外・範囲外・適用外・他層とした）が最も重い誤り**。抜けを示すだけで、シナリオは足さない。

## 成果物（レビュー対象）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/商品登録・編集/`：steps.tsv（機械）・step_scope.tsv・step_map.tsv・factors.tsv・cond_map.tsv
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/価格管理/`：steps.tsv（機械）・step_scope.tsv・step_map.tsv・factors.tsv・cond_map.tsv
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/`：steps.tsv（機械）・step_scope.tsv・step_map.tsv・factors.tsv・cond_map.tsv

列と決まりは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/tools/build_coverage_matrix.py` の冒頭。ゲート（引用がそのシナリオ自身の行・L4・matrix_<ID>/・通しシナリオのフォルダにそのまま有ること、業務フローパターンの網羅・対象外・判断待ち・食い違い・関係の節は数えないこと）は機械で通っている。前回（2026-10-30）の同じ作り方の決まりと罠は `/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/scenario_pattern_matrix/README.md`。

## 前の巡の扱い

指摘と扱いは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/組B/review/` の `dispositions_R1_価格管理.md`・`dispositions_R1_在庫管理.md`・`dispositions_R2_価格・商品.md`・`dispositions_R2_在庫管理.md`。却下・一部採用の理由を確かめ、同じ指摘を繰り返さない。前の巡で直したところと、同じ型の誤り（偽の○・偽の対象外）がほかの行に残っていないかを特に確かめる。新しい事実の指摘だけを書く。今回が最後の巡。

## 正本
- 業務フロー：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05〜18_*.md`
- シナリオ：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/*/scenario_list.md`・L4・`matrix_*/`、`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通しシナリオ/*/`
- 依頼者の決定：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md`（R13 支払方法6種類ほか）、`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md`（範囲外）、`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/PROGRESS.md`
- 設計書HTML：`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html`（grep で）。新実装 `/home/y-saito/Developments/ec-cube-enterprise/`

## 重点観点
1. **偽の○**：step_map・cond_map の引用の文が、その工程・値を実際に通す手順・行・水準か（題名だけ・前提だけ・準備の定型文・別の条件の文でないか。工程の作業内容とシナリオの操作が一致するか）
2. **偽の対象外**：step_scope の「システムの外」「範囲外」「見出し」と、factors の「適用外」「他層」「他業務」「判断待ち」の理由が正本どおりか（システムを触る工程・依頼者の決定で範囲内の値を外していないか）
3. **factors の値**：出典と引用が実在し、値が今の決定（R13 など）と合っているか。業務フローや設計書にある重要な条件の値が欠けていないか
4. **抜けの判定**：抜けとした工程・値が、実はどれかのシナリオで通っていないか（その逆も）

## 指摘しないもの
- 物理名を足す提案、文体、シナリオを足す提案（抜けを示すのが目的）、非機能・データ移行・現行との比較

## 出力形式
指摘が無ければ `NONE` の1語だけを出力する。
指摘があるときは、指摘ごとに次の4行を書く（各行は行頭から）。

主張: 成果物のどこが何と言っているか（ファイル名と行・工程R番号・値ID）
実際: 正本ではどうか（ファイルパス:行番号 と引用文）
判定: 偽の○ / 偽の対象外 / 事実の誤り / 根拠の捏造 / 事実の欠落 のいずれか
修正案: 結論を先に1文で
