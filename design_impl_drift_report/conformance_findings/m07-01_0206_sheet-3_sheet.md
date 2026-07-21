■管理-M07-01 買取一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取番号は最大文字数50で入力できる。
　purchase_number は TextType で、Length 最大値に eccube_stext_len を使用している。eccube_stext_len は app/config/eccube/packages/eccube.yaml:137 で 255。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-3:959 ／ 実装: src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:119）

■管理-M07-01 買取一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）AND/OR検索のラベルを表示する。
　Twig は admin.purchase.online.form.product_name_select.label を表示し、翻訳は messages.ja.yaml:5518 で「AND/OR選択」。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-3:966 ／ 実装: src/Eccube/Resource/template/admin/Purchase/index.twig:97）

■管理-M07-01 買取一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）戻し未完了のみ表示チェックボックスを表示する。
　restock_incomplete_only は追加されているが、ラベルは admin.purchase.store.form.restock_incomplete_only.label を使い、messages.ja.yaml:5486 で「棚戻し未完了のみ表示」。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-3:948 ／ 実装: src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:171）

■管理-M07-01 買取一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索条件をクリアリンクは、入力された各項目の値を空白にする。
　.search-clear の click 処理は #admin_purchase_list_buy_order_status の val(null).trigger('change') のみ実行し、買取番号、注文者名、利用回数、商品名、AND/OR、本人確認、日付、戻し未完了チェックは消さない。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-3:989 ／ 実装: html/template/admin/assets/js/Purchase/purchase.js:8）

■管理-M07-01 買取一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索ボタンは「検索する >」として表示し、入力項目一覧で設定された値をもとに検索を実行する。
　検索ボタンは admin.common.search を表示しており、messages.ja.yaml:1607 で「検索」。一方、messages.ja.yaml:5540 には「検索する」の専用キーがあるが未使用。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-3:990 ／ 実装: src/Eccube/Resource/template/admin/Purchase/index.twig:144）
