### 指摘 1
- 対象: VP-TSUHAN-08-06-01 / VP-TSUHAN-1201-01 / VP-TSUHAN-1303-03
- 主張: シナリオ002で代金引換の購入を行い、シナリオ001の項目がその結果を引き継ぐ。
- 実際: `scenario_test/markdown/16_通販受注管理.md:39-41` は「クレジットカード・代金引換以外の場合」に決済処理へ分岐し、決済処理の対象を「コンビニ決済、郵便振替、銀行振込」とする。シナリオ002は決済処理へ進む経路であり、`scenario_test/coverage/viewpoint_contracts.json:1744` の項目は、002に置いた VP-TSUHAN-1201-01 の結果に001から依存している。
- 判定: 事実の誤り
- 修正案: 代金引換の項目をシナリオ001へ移し、VP-TSUHAN-1303-03の依存先も同じ経路にそろえる。

### 指摘 2
- 対象: VP-TSUHAN-1601-01 / VP-TSUHAN-1602-01〜03 / VP-TSUHAN-1603-01
- 主張: シナリオ002の項目で、会員・商品・受注に `ST-…-001-R01`、メールに `scenario-001@example.test` を使う。
- 実際: `scenario_test/scenario/SCN-TSUHAN-お客様EC購入フロー-002_お客様EC購入フロー（決済方法確認：決済処理を行う）.md:57` は002の会員・商品・受注を `…-R02`、メールを `scenario-002@example.test` と定める。一方、`scenario_test/coverage/viewpoint_contracts.json:2073` の準備は001の `…-R01` を指定している。R01はシナリオ001のクレジットカード経路のデータである。
- 判定: 事実の誤り
- 修正案: 002に置く各項目の準備と受注番号をR02のデータへ統一する。

### 指摘 3
- 対象: VP-TSUHAN-1709-02
- 主張: 未登録のカード商品を「グッズ商品CSV登録で作成し、商品編集でカードを指定する」と準備する。
- 実際: `functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:37-39` はグッズ商品CSVで選べるカテゴリをサプライ・グッズ・予約グッズ・情報商材に限る。`functions/pf-eccube3/m03-26_admin_product_product_card_csv_import.md:74` はカード商品CSVにカード詳細IDを必須とする。契約の準備は `scenario_test/coverage/viewpoint_contracts.json:2732`。
- 判定: 実行できない
- 修正案: 3件のカード詳細IDを使ってカード商品CSV登録で商品を作成する手順に直す。

### 指摘 4
- 対象: VP-TSUHAN-08-04-01〜04 / VP-TSUHAN-1709-02
- 主張: 新規登録した商品をそのままフロントで購入し、帳票を確認できる。
- 実際: `scenario_test/coverage/viewpoint_contracts.json:988,2732` の準備には購入前の在庫投入が無い。`functions/pf-eccube3/m03-26_admin_product_product_card_csv_import.md:82` と `functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:44` は、新規規格の在庫を「数量 0 で作る」とする。
- 判定: 実行できない
- 修正案: 購入前に対象店舗の各規格へ必要数を入庫し、在庫を確認する手順を追加する。

### 指摘 5
- 対象: VP-TSUHAN-10-02-04 / VP-TSUHAN-10-02-05
- 主張: 担当者Aの画面に完了表示が出る前にBがアップロードすれば、Bは実行中エラーとなり、受注Rは更新されない。
- 実際: `scenario_test/coverage/viewpoint_contracts.json:755,798` はAの画面表示だけをBの開始条件にしている。`excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4750` の排他条件は「別の取り込みが動いているとき」であり、画面に完了表示が出ていないことは実行権の保持を示さない。
- 判定: 実行できない
- 修正案: Aが実行権を保持している状態を確認または制御してからBを開始する手順にする。

### 指摘 6
- 対象: 台帳 SV-14-08
- 主張: STI-TSUHAN-006-007により「既存項目で確認済み」。
- 実際: `scenario_test/coverage/viewpoint_application/通販受注管理.tsv:110` は確認済みとするが、参照先の `scenario_test/test_items/STI-TSUHAN-入金確認業務-006_入金確認業務（15時以降・コンビニ決済とSPLINKSの照合）_test_items.md:516-517` は「抽出条件の閾値が未確定のため実施を保留」「未実施・保留と記録し、合格にしない」と明記する。
- 判定: 判定の誤り
- 修正案: SV-14-08を確認済みから外し、抽出条件が決まるまで保留であることを台帳に反映する。

### 指摘 7
- 対象: VP-TSUHAN-08-04-01
- 主張: 「店舗登録画面」でピッキングリスト分割しきい値価格を確認する。
- 実際: `excel_to_html/output/0209_基本設計仕様書(基本情報設定).html:2486,2492` は、この項目を「データ管理」配下の「追加システム設定」に置き、初期値を980とする。契約の画面指定は `scenario_test/coverage/viewpoint_contracts.json:988`。
- 判定: 事実の誤り
- 修正案: 確認先を「追加システム設定」に直す。

**計7件**
