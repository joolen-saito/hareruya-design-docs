### 指摘1（重大度: Major）対象: 群 RJ
主張: M15-06→M15-08 は、CSVでデッキを新規登録する1件で足りる（[report.md:18](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RJ/report.md:18)）。
実際: 設計書は、CSVのデッキIDが既存デッキと一致すれば上書きすると定め、アーキタイプを入力項目としている（[m15-06_admin_deck_deck_csv_import.md:75](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m15-06_admin_deck_deck_csv_import.md:75)、[0212 デッキ登録CSV:1825](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1825)）。下流の登録デッキ数は、アーキタイプに紐づくイベント種別のデッキ数である（[m15-08_admin_deck_deck_archetype_search.md:31](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m15-08_admin_deck_deck_archetype_search.md:31)）。既存ケースに、CSV上書き後のこの管理画面表示を確認するものはない。
判定: 取りこぼし
修正案: 既存のイベントデッキを型甲に紐づけ、型甲1件・型乙0件を確認する。同じデッキIDと型乙を指定したCSVを取り込み、アーキタイプ管理を開き直して型甲0件・型乙1件を確認するケースを追加する。

### 指摘2（重大度: Minor）対象: IT-M14-04-RJ001、IT-M14-05-RJ001
主張: 事前準備でカード登録CSVを取り込み、商品に紐づくカードを用意できる（[RJ_seed_data.tsv:12](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RJ_seed_data.tsv:12)、[同:14](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RJ_seed_data.tsv:14)）。
実際: 両シードの初回カード登録用CSVは、見出し行と全列の値が定義されず、カードセット・レアリティ・レイアウト・画像URLも「既存のデータにある任意の値」とされている。一方、取込は見出しの完全一致を要求し（[m14-05_admin_card_card_csv_import.md:5](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m14-05_admin_card_card_csv_import.md:5)）、レアリティ・レイアウト・英語画像URLは必須である（[0208 カード登録CSV:1826](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html:1826)、[同:1828](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html:1828)、[同:1838](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html:1838)）。現状の記述だけでは、ケース専用の事前状態を再現できない。
判定: 規約違反
修正案: 両シードに設計書どおりの見出し行、全列の値、参照する既存マスタと英語画像URLの具体値を記載する。

### 指摘3（重大度: Minor）対象: 群 RJ
主張: 報告の「作成したケース数」は合計7件、M15-05は3件である（[report.md:6](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RJ/report.md:6)、[同:11](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RJ/report.md:11)）。
実際: 前回反映で `IT-M15-05-RJ004` が追加され、ケースファイルは8件、M15-05は4件になっている（[RJ_test_cases.tsv:5](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RJ_test_cases.tsv:5)、[report.md:69](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RJ/report.md:69)）。
判定: 規約違反
修正案: 報告の集計表と合計を、M15-05が4件、全体が8件に更新する。
