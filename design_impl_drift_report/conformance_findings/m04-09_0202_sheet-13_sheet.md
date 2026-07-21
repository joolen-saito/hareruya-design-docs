■管理-M04-09 在庫移動・振替検索一覧(検索・結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSVファイル登録時のエラー挙動: 検索項目および一覧の選択状態は失われない
　在庫移動CSV/在庫振替CSVの取込エラー時は addError 後に admin_stock_move_transfer へ resume なしでリダイレクトする。遷移先 index の通常GET分岐は検索条件を既定値で保存し直し、一覧チェックボックスも選択状態を参照せず描画する。。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-13:4300 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:301; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:402; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:183; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:718）

■管理-M04-09 在庫移動・振替検索一覧(検索・結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索条件をクリア（3-10）は、押下すると3-1〜3-9の内容を空にする
　クリアボタンのJSは form_search_stock_move_transfer 配下のチェック済みcheckbox、通常input、店舗select、承認者select等を広くクリアする。。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-13:4360 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:448; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:451; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:461）

■管理-M04-09 在庫移動・振替検索一覧(検索・結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧は在庫移動振替IDを降順として表示する
　getQueryBuilderBySearchData() は createDate DESC を第1キー、id DESC を第2キーとして並び替える。。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-13:4304 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:56）

■管理-M04-09 在庫移動・振替検索一覧(検索・結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）移動指示作成条件を満たす場合、チェックされた移動をまとめて在庫移動指示を作成し、在庫移動指示一覧画面へ遷移する
　移動指示作成成功後は admin_stock_move_instruction_detail へリダイレクトする。別途、在庫移動指示一覧の admin_stock_move_instruction_list ルートは存在する。。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-13:4313 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:665; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:66）

■管理-M04-09 在庫移動・振替検索一覧(検索・結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）戻しリストCSV出力／戻しリストPDF出力は、在庫移動である場合にのみ出力を可能とする
　CSV/PDFとも validateReturnListExportRequest() を通るが、委譲先 validateReturnListExportIds() は対象存在、入庫先店舗、権限、ステータス、複数店舗だけを検証する。検証用取得も transferId/shopId/statusId のみで、moveTransferType を取得していない。。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-13:4324; /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-13:4328 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:474; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:491; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:115; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:326）
