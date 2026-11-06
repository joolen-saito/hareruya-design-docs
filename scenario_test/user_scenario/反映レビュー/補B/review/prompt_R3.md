# レビュー依頼：網羅マトリクスの抜けを埋めたシナリオの追加（補B・R3）

あなたは独立したレビュアーです。著者は別人です。成果物を読み、正本と照らして誤りと抜けを指摘してください。ファイルは書き換えないでください（読み取り専用）。

## 背景
依頼者の指示（2026-11-06「足して」）で、網羅マトリクス（`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/網羅マトリクス.xlsx`、README あり）で見つかった抜け（業務フローの工程・業務条件の値で、どのシナリオも個別に通していなかったもの）を、各業務のシナリオに足した。足し方は、マトリクスの水準・例外の追加、L3 にその値だけを確かめる手順と期待値を書く、新しい L2、のどれか。正本で期待値が言えないものは判断待ち、システムを触らない工程はシステムの外にした。あわせて網羅マトリクスの対応表（`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/<業務>/step_map.tsv`・`cond_map.tsv`・`factors.tsv`・`step_scope.tsv`）も直した。指示は抜けごとの足し方の表（各フォルダの記録）を見ること。

## 前の巡の扱い

指摘と扱いは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/反映レビュー/補B/review/` の `dispositions_R1.md`・`dispositions_R2.md`。却下したものは繰り返さない。前の巡で直したところを特に確かめる。新しい事実の指摘だけを書く。今回がこの回の最後の巡。

## 成果物（レビュー対象。今回の変更だけを見る）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/`：変更の記録 `review/gapfill_2026-11-06.md`、差分 `review/gapfill_2026-11-06.diff`（27行）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/価格管理/`：変更の記録 `review/gapfill_2026-11-06.md`、差分 `review/gapfill_2026-11-06.diff`（22行）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/在庫管理/`：変更の記録 `review/gapfill_2026-11-06.md`、差分 `review/gapfill_2026-11-06.diff`（48行）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/`：変更の記録 `review/gapfill_2026-11-06.md`、差分 `review/gapfill_2026-11-06.diff`（21行）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/分析・集計/`：変更の記録 `review/gapfill_2026-11-06.md`、差分 `review/gapfill_2026-11-06.diff`（12行）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/外部連携/`：変更の記録 `review/gapfill_2026-11-06.md`、差分 `review/gapfill_2026-11-06.diff`（12行）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/商品登録・編集/`：変更の記録 `review/gapfill_2026-11-06.md`、差分 `review/gapfill_2026-11-06.diff`（54行）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/価格管理/`：変更の記録 `review/gapfill_2026-11-06.md`、差分 `review/gapfill_2026-11-06.diff`（34行）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/`：変更の記録 `review/gapfill_2026-11-06.md`、差分 `review/gapfill_2026-11-06.diff`（174行）

作り方の決まりは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md`。各フォルダの以前のレビューの採否は `review/dispositions_R*.md`。

## 正本（オラクル）
- 業務フロー：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/`
- 設計書HTML（Excel由来を優先）：`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html`（巨大なので grep で）
- 新実装：`/home/y-saito/Developments/ec-cube-enterprise/`、現行：`/home/y-saito/Developments/pf-eccube3/`・`/home/y-saito/Developments/front-application/MTGBuyer/`
- 開発環境の設定：`/home/y-saito/Developments/ec-cube-enterprise/eccube_db_20260907.sql.gz`（zcat と sed/grep で該当表だけ。認証情報・個人情報は出力に絶対に書かない）
- 依頼者の裁定：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md`
- 通しシナリオ：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通しシナリオ/*/scenario_list.md`・`review/dispositions_R3.md`

## 重点観点
1. **足した手順が抜けを本当に埋めるか**：その工程・値だけを個別に確かめる手順と期待値になっているか（選択肢を並べただけ・題名だけになっていないか）。網羅マトリクスの対応表の引用がその足した文か
2. **足した手順・期待値の根拠**：業務フロー・設計書・新実装から言えるか（書き過ぎ・捏造が無いか）。抜けとして足した機能の画面・CSVの名前と操作が設計書どおりか
3. **判断待ちの扱い**：判断待ちを期待値として断定していないか。逆に、正本で決まるのに判断待ちにしていないか
4. **マトリクス**：変えたマトリクスの禁則・例外の差し込む元の条件が成立に必要十分か
5. **逃げの扱い**：判断待ち・システムの外・適用外・他業務にした抜けの理由が正本どおりか（期待値が正本から言えるのに判断待ちにしていないか、システムを触る作業をシステムの外にしていないか）

## 指摘しないもの
- 物理名を足す提案、文体の好み、他フォルダの範囲、非機能・データ移行・現行との比較

## 出力形式
指摘が無ければ `NONE` の1語だけを出力する。
指摘があるときは、指摘ごとに次の4行を書く（各行は行頭から）。

主張: 成果物のどこが何と言っているか（ファイル名と行・シナリオID）
実際: 正本ではどうか（ファイルパス:行番号 と引用文）
判定: 事実の誤り / 根拠の捏造 / 事実の欠落 / 切り方の誤り / 禁則の誤り のいずれか
修正案: 結論を先に1文で
