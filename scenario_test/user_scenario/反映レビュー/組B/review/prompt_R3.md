# レビュー依頼：ほかのフォルダへの影響の反映（組B・R3）

あなたは独立したレビュアーです。著者は別人です。成果物を読み、正本と照らして誤りと抜けを指摘してください。ファイルは書き換えないでください（読み取り専用）。

## 背景
シナリオテスト（`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/`）の各フォルダは codex レビューで閉じたが、あとから足したフォルダ（スマレジ連携・会員管理・ポイント・イベント登録から開催まで・外部連携・MTGバイヤー・イベントのキャンセル、通販の支払方法6種類＝裁定R13、買取の本人確認）の影響が、ほかのフォルダに未反映だった。作業一覧 `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/反映レビュー/cascade_worklist.md` の8フォルダ分を、著者が反映した。

## 成果物（レビュー対象。今回の変更だけを見る）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務横断/`：変更の記録 `review/cascade_2026-11-05.md`、差分 `review/cascade_2026-11-05.diff`（scenario_list.md とマトリクスの入力。matrix.md・matrix.tsv は build_matrix.py の生成物）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/分析・集計/`：変更の記録 `review/cascade_2026-11-05.md`、差分 `review/cascade_2026-11-05.diff`（scenario_list.md とマトリクスの入力。matrix.md・matrix.tsv は build_matrix.py の生成物）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/`：変更の記録 `review/cascade_2026-11-05.md`、差分 `review/cascade_2026-11-05.diff`（scenario_list.md とマトリクスの入力。matrix.md・matrix.tsv は build_matrix.py の生成物）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/`：変更の記録 `review/cascade_2026-11-05.md`、差分 `review/cascade_2026-11-05.diff`（scenario_list.md とマトリクスの入力。matrix.md・matrix.tsv は build_matrix.py の生成物）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/`：変更の記録 `review/cascade_2026-11-05.md`、差分 `review/cascade_2026-11-05.diff`（scenario_list.md とマトリクスの入力。matrix.md・matrix.tsv は build_matrix.py の生成物）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/価格管理/`：変更の記録 `review/cascade_2026-11-05.md`、差分 `review/cascade_2026-11-05.diff`（scenario_list.md とマトリクスの入力。matrix.md・matrix.tsv は build_matrix.py の生成物）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/在庫管理/`：変更の記録 `review/cascade_2026-11-05.md`、差分 `review/cascade_2026-11-05.diff`（scenario_list.md とマトリクスの入力。matrix.md・matrix.tsv は build_matrix.py の生成物）
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/仕入れ業務/`：変更の記録 `review/cascade_2026-11-05.md`、差分 `review/cascade_2026-11-05.diff`（scenario_list.md とマトリクスの入力。matrix.md・matrix.tsv は build_matrix.py の生成物）

作り方の決まりは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md`。各フォルダの以前のレビューの採否は `review/dispositions_R*.md`（却下したものは繰り返さない）。

## 前の巡の扱い

R1・R2 の指摘と扱いは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/反映レビュー/組B/review/dispositions_R1.md`・`dispositions_R2.md`。却下したものは繰り返さない。R2 で直したところを特に確かめる。今回がこの回の最後の巡。新しい事実の指摘だけを書く。

## 正本（オラクル）
- 業務フロー：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/`
- 設計書HTML（Excel由来を優先）：`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html`（巨大なので grep で）
- 新実装：`/home/y-saito/Developments/ec-cube-enterprise/`、現行：`/home/y-saito/Developments/pf-eccube3/`・`/home/y-saito/Developments/front-application/MTGBuyer/`
- 開発環境の設定：`/home/y-saito/Developments/ec-cube-enterprise/eccube_db_20260907.sql.gz`（zcat と sed/grep で該当表だけ。認証情報・個人情報は出力に絶対に書かない）
- 依頼者の裁定：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md`
- 参照先のフォルダ：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/*/scenario_list.md` と `review/dispositions_R*.md` の「閉じたときに残ったもの」

## 重点観点
1. **反映の正しさ**：作業一覧の出どころ（参照先フォルダの確定した結論）と食い違う書き方をしていないか。参照したIDが本当にその内容か
2. **根拠**：記録の根拠欄のファイル・行・引用が実在し、結論がそこから言えるか
3. **判断待ちの扱い**：判断待ちを期待値として断定していないか。逆に、正本で決まるのに判断待ちにしていないか
4. **マトリクス**（分析・集計 matrix_UAN-01・UAN-05、店頭受取 matrix_UOR-01、業務横断 matrix_UXB-16 の README など。支払方法6種類＝裁定R13 の水準のまとめ方が「水準のまとめ方」の決まりどおりか）：例外の差し込む元の条件が成立に必要十分か
5. **反映漏れ**：作業一覧のこの8フォルダの行で、反映されていないもの・理由が正しくないもの

## 指摘しないもの
- 物理名を足す提案、文体の好み、L4が無いこと、他フォルダの範囲、非機能・データ移行・現行との比較

## 出力形式
指摘が無ければ `NONE` の1語だけを出力する。
指摘があるときは、指摘ごとに次の4行を書く（各行は行頭から）。

主張: 成果物のどこが何と言っているか（ファイル名と行・シナリオID）
実際: 正本ではどうか（ファイルパス:行番号 と引用文）
判定: 事実の誤り / 根拠の捏造 / 事実の欠落 / 切り方の誤り / 禁則の誤り のいずれか
修正案: 結論を先に1文で
