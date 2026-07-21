■管理-M13-13 イベント一括登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）イベント一括登録の外部導線は GET /%eccube_admin_route%/entry/bulkentry、POST /%eccube_admin_route%/entry/bulkentry/upload、GET /%eccube_admin_route%/entry/entry_csv_template とする。
　実装は GET/POST 共通で /%eccube_admin_route%/event/entry/bulk_csv_import、テンプレートCSVは /%eccube_admin_route%/event/entry/bulk_csv_template。Twig と管理メニューも admin_event_entry_bulk_csv_import / admin_event_entry_bulk_csv_template を参照している。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-19:5098 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:59）

■管理-M13-13 イベント一括登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSVファイル選択は accept type=text/csv,text/tsv とし、CSV/TSV を選択可能にする。アップロード実行時は JavaScript でスピナーを表示する。
　hidden file input の accept は text/csv,.csv のみ。submit 時 JS は upload/download ボタンを disable するだけで、スピナーや ladda 表示はこのテンプレートに存在しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-19:5102 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:13）

■管理-M13-13 イベント一括登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）アップロードCSVは 5000 行以上を登録不可とし、上限行数エラーを表示する。
　ADMIN_CSV_IMPORT_MAX_ROWS は 5010。EventEntryBulkCsvController は countCsvRows($formFile) > static::ADMIN_CSV_IMPORT_MAX_ROWS の場合だけエラーにする。メッセージの %maxRecord% も 5010 で展開される。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-19:5109 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:364）

■管理-M13-13 イベント一括登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSV登録成功時は flash message として「イベント情報を登録しました。」を表示する。
　成功時は addSuccess('admin.common.csv_upload_complete', 'admin') を使用し、messages.ja.yaml:1570 の表示文言は「CSVファイルをアップロードしました」。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-19:5148 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:138）

■管理-M13-13 イベント一括登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSV登録ログは開始ログ、異常終了ログ「イベント一括登録 異常終了」、完了時の取込件数ログを出力する。
　開始ログ「イベント一括登録CSV登録開始」と完了ログ「イベント一括登録CSV登録完了」はあるが、異常終了ログはなく、完了ログにも取込件数を含めていない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-19:5160 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:103）

■管理-M13-13 イベント一括登録
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）親イベントのクレジットカード支払い設定が未設定で、日程のオンライン受付が「あり」かつ有料の場合はエラーにする。
　クレジットカード支払い列の選択肢検証と Payment 紐付け、オンライン受付の From/To 入力検証はあるが、クレジット未設定・オンライン受付あり・有料日程の組合せ検証はない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-19:5036 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/CsvImporter.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml。検索語: クレジット, credit, Payment, オンライン受付, onlineReception, 参加費））

■管理-M13-13 イベント一括登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSV列は設計フォーマットに従い、「店舗・会場」「定員・チーム人数」「備考（日）・備考（英）」を扱い、「公開状態_日程」は任意項目とする。
　ORDERED_HEADERS は「店舗」「チーム戦」「フリー入力エリア...」「公開状態_日程」等で構成され、「会場」「チーム人数」「備考(日/英)」という設計上の列名はない。公開状態_日程は column definition で required=true、開始時間がある場合も非空必須として検証される。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-19:5116 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:55）

■管理-M13-13 イベント一括登録
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）CSV取込時はゼロ幅スペースを正規化または除去する。
　CSV取込経路は CsvImporter.php から CsvImportService を使い、SJIS-win から UTF-8 変換、改行変換、ヘッダーBOM除去は行うが、ゼロ幅スペース除去処理はない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-19:5111 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/CsvImporter.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvImportService.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php。検索語: ゼロ幅, zero, 200B, FEFF, BOM, preg_replace））

■管理-M13-13 イベント一括登録
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）CSVアップロードPOST処理では実行時間制限を無効化する。
　EventEntryBulkCsvController の POST 処理および CsvImporter/EventBulkCsvImportHandler に実行時間制限を無効化する処理はない。別機能の EntryController.php には set_time_limit(0) があるが本機能では使われていない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-19:5109 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/CsvImporter.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php。検索語: set_time_limit, max_execution_time, time_limit））
