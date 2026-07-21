■バッチ-B02-03 期間別入庫数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは `product:batch updateProductSummaryForStockUp` で実行する。コマンド名が一致しない場合は処理を行わずに終了する。
　実装コマンド名は `eccube:aggregate-stock-up`。設計コマンド名 `product:batch updateProductSummaryForStockUp` は実装内に存在しない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-5:1163-1167 ／ 実装: src/Eccube/Command/AggregateStockUpCommand.php:32, src/Eccube/Command/AggregateStockUpCommand.php:34）

■バッチ-B02-03 期間別入庫数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）在庫変動区分が入庫・マスタ更新の在庫履歴を集計対象にする。
　実装は `MtbStockChangeType::BE_STOCKED` と `MtbStockChangeType::INVENTORY_ADJUSTMENT` を対象にしている。コメント上も「入庫・棚卸」と記載され、`INVENTORY_ADJUSTMENT` は棚卸区分である。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-5:1120-1125, excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-5:1171-1174 ／ 実装: src/Eccube/Repository/DtbStockUpQuantityRepository.php:147, src/Eccube/Repository/DtbStockUpQuantityRepository.php:177, src/Eccube/Entity/Master/MtbStockChangeType.php:27, src/Eccube/Entity/Master/MtbStockChangeType.php:31）

■バッチ-B02-03 期間別入庫数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）対象が無い場合は更新を行わずに終了する。
　実装は集計取得前に `DELETE FROM dtb_stock_up_quantity` を実行し、その後に集計データを取得する。対象なし判定前に既存集計行が削除される。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-5:1168, excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-5:1192-1193 ／ 実装: src/Eccube/Service/Product/BatchAggregateStockUpAction.php:39, src/Eccube/Service/Product/BatchAggregateStockUpAction.php:40, src/Eccube/Repository/DtbStockUpQuantityRepository.php:99, src/Eccube/Repository/DtbStockUpQuantityRepository.php:102）

■バッチ-B02-03 期間別入庫数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）途中失敗時は反映済みの行のみ更新が残る。部分反映は次回実行で回収される。
　実装はバッチ全体を単一トランザクションで囲み、例外時に `rollBack()` する。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-5:1177-1183 ／ 実装: src/Eccube/Service/Product/BatchAggregateStockUpAction.php:37, src/Eccube/Service/Product/BatchAggregateStockUpAction.php:44, src/Eccube/Service/Product/BatchAggregateStockUpAction.php:45, src/Eccube/Service/Product/BatchAggregateStockUpAction.php:46）

■バッチ-B02-03 期間別入庫数集計
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）100件ごとに変更を反映しキャッシュをクリアしながら処理する。
　集計結果を foreach で更新し、最後に一度だけ commit する。100件単位の反映、EntityManager clear、キャッシュクリアに相当する処理はない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-5:1168 ／ 実装: 不在（探索範囲: src/Eccube/Command/AggregateStockUpCommand.php, src/Eccube/Service/Product/BatchAggregateStockUpAction.php, src/Eccube/Repository/DtbStockUpQuantityRepository.php; 検索語: 100件, flush, clear, batch, commit））

■バッチ-B02-03 期間別入庫数集計
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）処理開始・完了を日時付きでコンソール出力する。
　`SymfonyStyle` で完了メッセージのみを出力する。開始メッセージ、および開始・完了日時の出力はない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-5:1195-1196 ／ 実装: src/Eccube/Command/AggregateStockUpCommand.php:45, src/Eccube/Command/AggregateStockUpCommand.php:55）

■バッチ-B02-03 期間別入庫数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本店の支店IDは0として処理する。
　集計は `sh.base_info_id` をそのまま `base_info_id` としてグループ化・登録する。本店判定は `BaseInfo::TC_TOKYO_ID = 1` を使う実装で、B02-03 集計内に本店を支店ID 0へ変換する処理はない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-5:1116 ／ 実装: src/Eccube/Repository/DtbStockUpQuantityRepository.php:153, src/Eccube/Repository/DtbStockUpQuantityRepository.php:179, src/Eccube/Repository/DtbStockUpQuantityRepository.php:205, src/Eccube/Repository/DtbStockUpQuantityRepository.php:219, src/Eccube/Entity/BaseInfo.php:45, src/Eccube/Entity/BaseInfo.php:1643）
