# レビュー依頼：購入シナリオへの法令（申込みの表示）の確認項目の追加（R2）

あなたは独立したレビュアーです。著者は別人です。成果物を読み、正本と照らして誤りと抜けを指摘してください。ファイルは書き換えないでください（読み取り専用）。

## 成果物（レビュー対象）

- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/legal_check.md`（LC-01〜LC-14）と、`通販/scenario_list.md` の `## 法令の表示の確認（SV-16）` の節・UTS-01／UTS-04 の L3 の追記、`通販/matrix/README.md` の追記
- `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/legal_check.md`（LO-01〜LO-13）と、`店頭受取受注管理/scenario_list.md` の同じ節・UOR-01／UOR-06 の L3 の追記、`matrix_UOR-01/README.md` の追記

ほかの部分（シナリオの切り方、マトリクスの表）はレビュー済み。指摘しない。

## 前の巡の扱い

指摘と扱いは同じフォルダの `dispositions_R1.md` にある。却下したものは繰り返さない。前の巡で直したところを特に確かめること。新しい事実の指摘だけを書く。

## 作り方の決まり

- 観点の体系 `/home/y-saito/Developments/hareruya-design-docs/scenario_test/シナリオテスト観点.md` の SV-16（法令・規制（EC の申込み表示））を、購入のシナリオで毎回確かめる確認項目にする
- 表示事項はガイドライン（出典 S11 消費者庁「通信販売の申込み段階における表示についてのガイドライン」）に基づく。原文の抜粋は `/home/y-saito/Developments/hareruya-design-docs/scenario_test/外部資料観点/evidence.tsv`
- 設計書に無い表示事項は期待値を作らず「設計書の不足」として記録する。起票しない
- 範囲外：非機能・データ移行・現行との比較

## 正本

- ガイドラインの引用：上の evidence.tsv（SV-16 の行）
- 設計書：`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html`（買い物かご・ご注文方法指定・決済~購入完了）、`0303_…(フロント_商品).html`、ほか grep で見つかる特定商取引法の表記・ヘルプの設計書
- 新実装：`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/`・`src/Eccube/Resource/locale/messages.ja.yaml`・`src/Eccube/Controller/Front/ShoppingController.php` ほか
- 開発環境の設定：`/home/y-saito/Developments/ec-cube-enterprise/eccube_db_20260907.sql.gz`（zcat と grep で該当表だけ読む。個人情報・認証情報は出力しない）
- 依頼者の裁定：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md`

## 重点観点

1. ガイドラインの表示事項の引用が evidence.tsv に実在し、解釈が言い過ぎていないか。当てはまるのに抜けている表示事項は無いか
2. 設計書の画面項目・文言との突き合わせが正しいか（引用文が別のシート・別の画面の記述ではないか）。「設計書に無い」と書いたものが本当に無いか
3. 新実装との食い違いの記述が、コード・テンプレート・文言ファイル・設定の実在する記述から言えるか
4. 最終確認画面の特定（ご注文方法指定画面）と、クレジットカード決済の外部画面の扱いが、ガイドラインと正本から言えるか
5. 店頭受取・店頭PCへの当てはめの判断が、根拠から言えるか
6. 確認項目が、各シナリオの L3 とマトリクスの README で矛盾なく参照されているか

## 指摘しないもの

- 物理名を足す提案、文体の好み、L4 が無いこと
- 法務の最終判断（成果物が「法務の判断」と明記しているもの）

## 出力形式

指摘が無ければ `NONE` の1語だけを出力する。
指摘があるときは、指摘ごとに次の4行を書く（各行は行頭から）。

主張: 成果物のどこが何と言っているか（ファイル名と行・確認項目ID）
実際: 正本ではどうか（ファイルパス:行番号 と引用文）
判定: 事実の誤り / 根拠の捏造 / 事実の欠落 のいずれか
修正案: 結論を先に1文で
