■API-A01-01 スマレジ連携処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）管理画面の在庫編集・在庫一括編集で在庫場所区分がスマレジの場合、編集結果をスマレジ側に反映し、1回の管理画面操作での実行件数上限を設定し、上限を越えたらエラーを表示してCSV登録を促す。
　在庫編集・在庫一括編集の保存処理は承認/履歴/在庫DBを作成・更新するが、スマレジ在庫相対値更新APIを呼び出していない。SmaregiStockApiClient の公開メソッドも add/getStockChange/listStocks/listStockChanges のみで、在庫相対値更新API用メソッドが存在しない。件数上限超過時にCSV登録を促す専用エラー文言・分岐も確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html#sheet-3:889,890,1041-1046 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml））

■API-A01-01 スマレジ連携処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）在庫変更CSV登録等の一括処理でスマレジ在庫が変動する場合、在庫一括相対値更新APIでスマレジへ一括登録し、CSVファイルをS3に保存し、100件以上は100件毎にCSVを分割してS3に上げ、CSV履歴として処理結果を明示できるようにする。
　在庫変更CSV登録は承認明細と承認一覧を作成するだけで、スマレジ在庫一括相対値更新API、callback URL、問合せID、S3保存、100件毎分割、スマレジ処理結果のCSV履歴反映を確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html#sheet-3:891,1086-1097,1101-1118,1123-1136 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock））

■API-A01-01 スマレジ連携処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）在庫一括相対値更新APIの処理結果がリクエストパラメータに登録したURLへ非同期で返ってきたら、問合せ用IDやcallback URLパラメータに従って対象CSVを特定し、S3よりダウンロードしてECCUBE側の在庫データを更新し、処理結果をCSV処理履歴に登録する。
　スマレジWebhook受信エンドポイントは pos:stock の在庫変動履歴IDリストを受けて処理する実装であり、在庫一括相対値更新APIのcallback結果（問合せID、結果.在庫変動履歴ID/商品ID/店舗ID、エラーメッセージ）を受ける専用処理、S3から対象CSVを取得する処理、CSV処理履歴へ結果を登録する処理は確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html#sheet-3:1098-1100,1141-1153 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler））
