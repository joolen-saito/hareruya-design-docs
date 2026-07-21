■API-A01-02 スマレジwebhook連携エラー再連携
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）APIでバッチ駆動時間から5時間前までの間のスマレジの在庫変動履歴データを取得し、取得する期間は可変で実装する。入力データ検索条件は「スマレジ在庫変動履歴データ.取引更新時間 バッチ駆動時間(X)からバッチ駆動時間よりY時間前(X-Y hours)の間」。
　再連携バッチは存在するが、取得条件は任意引数 target-date（未指定時は駆動日）をスマレジAPIの target_date に渡す日付指定のみ。バッチ駆動時刻XからY時間前まで、または5時間前までの時間幅を計算・指定する実装は確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html#sheet-4:1384,1389,1403 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiStockBackfillCommand.php:44 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:65 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:169）
