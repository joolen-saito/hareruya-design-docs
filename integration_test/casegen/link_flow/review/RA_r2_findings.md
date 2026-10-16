### 指摘1（重大度: Major）対象: IT-M03-10-RA004
主張: シードの店頭買取を「買取成立」まで進め、入庫待ちの買取詳細画面を開ける。
実際: シードは申込時に適格請求書発行事業者を「はい」とする一方、MTGバイヤーで登録番号を「確認済み」にする操作が無い（`integration_test/casegen/link_flow/cases/RA_seed_data.tsv:22`）。この確認欄は未確認で始まり、未確認のままでは買取成立が中止される（`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:117-126`）。
判定: 前提不成立
修正案: シード作成手順に登録番号の確認済み操作を加える。あるいは申込時の回答を「いいえ」に変更する。

### 指摘2（重大度: Major）対象: 群RA
主張: M03-02→M04-01・M04-02は、商品名を下流が表示する根拠が無いため不採用とした（`integration_test/casegen/link_flow/gen_RA/report.md:16`）。
実際: 商品編集画面は商品名の変更を受け付ける（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:1576,1607`）。在庫検索一覧は商品情報を使って一覧を作り、商品名を表示する（`excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:1498-1499,1548`）。在庫編集にも参照中の在庫の商品名欄がある（同`:1735-1736`）。既存ケースに、商品編集で商品名を変えてこれらの画面で確認する手順は見当たらない。
判定: 取りこぼし
修正案: ケース専用の在庫がある商品の名称をM03-02で変更し、操作前後のM04-01およびM04-02の商品名を確認するケースを追加する。

### 指摘3（重大度: Major）対象: 群RA
主張: M03-09→M06-03は店頭買取のシードを作れないため不採用とした（`integration_test/casegen/link_flow/gen_RA/report.md:19`）。
実際: 今回追加したRA004は、そのシードを用意してM06-03の商品検索モーダルを開く構成である（`integration_test/casegen/link_flow/cases/RA_test_cases.tsv:10`）。M03-09は規格の価格を保存でき（`functions/pf-eccube3/m03-09_admin_product_product_class_edit.md:13-22`）、モーダルの規格選択肢は基準価格を表示する（`excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html:2197-2206,2219`）。既存ケースにこの上流・下流の組は見当たらない。
判定: 取りこぼし
修正案: RA004のシード作成手順を指摘1に従って直したうえで、M03-09の規格編集による基準価格の変更前後をM06-03の商品検索モーダルで確認するケースを追加する。

### 指摘4（重大度: Minor）対象: IT-M03-02-RA001
主張: CSVで作った商品には「M0302RAカテゴリAだけ」が付いている（`integration_test/casegen/link_flow/cases/RA_test_cases.tsv:2`、`integration_test/casegen/link_flow/cases/RA_seed_data.tsv:4`）。
実際: グッズ商品CSV登録は指定カテゴリに祖先カテゴリも付ける（`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md:34-39`）。このシードでは祖先の「グッズ」も付く。商品編集後も選択カテゴリと上位カテゴリを登録し直す（`functions/pf-eccube3/m03-02_admin_product_product_edit.md:22-26`）。
判定: 規約違反
修正案: 事前準備とシードのカテゴリを「M0302RAカテゴリAと祖先のグッズ」に訂正する。
