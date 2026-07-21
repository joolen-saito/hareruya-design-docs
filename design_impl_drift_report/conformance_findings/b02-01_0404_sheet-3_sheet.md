■バッチ-B02-01 期間別販売数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは `product:batch updateProductSummary` とし、コマンド名が一致しない場合は処理を行わずに終了する。
　実装の Symfony Console コマンド名は `eccube:aggregate-sales`。`product:batch updateProductSummary` は src/Eccube/Command、src/Eccube/Resource、html 配下でヒットしない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-3:922 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:35）

■バッチ-B02-01 期間別販売数集計
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）本店のほか支店やスマレジの販売情報も集計対象とし、スマレジの取引データも店舗ごとにECCUBEとスマレジで分けて販売数を集計する。
　B02-01 実装コメントで `現在は EC 受注のみ対象。スマレジ実店舗販売は未実装のため除外される` と明記され、集計SQLも dtb_order_item/dtb_order/dtb_shipping のみを対象にしている。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-3:869 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:28）

■バッチ-B02-01 期間別販売数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本店の支店IDは0として処理し、実行結果は商品規格ID・支店ID・期間別販売数を販売数集計データへ更新する。
　集計SQLは `s.base_info_id` をそのまま `base_info_id` として出力する。BaseInfo::TC_TOKYO_ID は 1 で、dtb_sales_quantity の base_info_id=0 は人気商品リコメンド用として別用途に予約されている。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-3:875 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:438）

■バッチ-B02-01 期間別販売数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）受注ステータスがキャンセル・処理中の受注は各期間の合計から除外する。
　集計SQLの除外条件は `o.order_status_id != :cancel_status` のみ。OrderStatus には PENDING=7、PROCESSING=8 が存在するが、この集計SQLでは除外していない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-3:930 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:451）

■バッチ-B02-01 期間別販売数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）対象が無い場合は更新を行わずに終了／完了する。
　handle() は集計データ取得前に clearSalesQuantityForAggregate() を必ず呼び、同メソッドは `DELETE FROM dtb_sales_quantity WHERE base_info_id != :popular_shop_id` を実行する。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-3:927 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:45）

■バッチ-B02-01 期間別販売数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）途中失敗時は反映済みの行のみ更新が残る。100件ごとに変更を反映しキャッシュをクリアしながら処理し、部分反映は次回実行で回収される。
　B02-01 は明示トランザクションを開始し、全件処理後に commit、例外時に rollBack する。100件ごとの flush/clear はこの処理には存在しない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-3:936 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:43）

■バッチ-B02-01 期間別販売数集計
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）長時間処理に備えて実行時間制限を解除し、SQLロガーを無効化する。
　B02-01 の AggregateSalesCommand::execute と BatchAggregateSalesAction::handle には set_time_limit(0) や SQL logger 無効化処理がない。DtbSalesQuantityRepository 内の set_time_limit(0) / setSQLLogger(null) は人気商品リコメンド更新 updateRecommend() 用で、B02-01 から呼ばれていない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-3:927 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php））

■バッチ-B02-01 期間別販売数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）開始・完了のコンソール出力を日時付きで行う。
　成功時は `期間別販売数集計が完了しました。` のみを SymfonyStyle::success で出力する。開始出力はなく、完了出力にも日時が含まれない。例外時は `集計処理でエラーが発生しました: ...` を出力する。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-3:955 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:56）

■バッチ-B02-01 期間別販売数集計
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）移行先では補助表を設けず、商品規格 `dtb_product_class` の `order_quantity_01`〜`order_quantity_08` に販売数を反映する。
　B02-01 実装は `dtb_sales_quantity` に `sales_quantity_01`〜`sales_quantity_08` を INSERT/UPDATE する。`dtb_product_class.order_quantity_01`〜`order_quantity_08` への更新処理は B02-01 実行経路にない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-3:916 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:113）
