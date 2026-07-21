■バッチ-B02-03 期間別入庫数集計バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは product:batch updateProductSummaryForStockUp として実行する。
　実装コマンド名は eccube:aggregate-stock-up。updateProductSummaryForStockUp / product:batch は src/Eccube と html 配下の再検索でも見つからない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-5:1205 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php:34）

■バッチ-B02-03 期間別入庫数集計バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）指定の期間に入庫した在庫数を商品コード、店舗、在庫区分ごとに集計し、商品コード・店舗・在庫場所が一致する集計データを更新、なければ新規登録する。
　集計SQLは ps.product_class_id と sh.base_info_id のみを SELECT/GROUP BY し、dtb_stock_up_quantity エンティティも product_class_id と base_info_id だけを保持する。stock_location_id / 在庫区分は保持・集計キーに含まれない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-5:1152 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:152）

■バッチ-B02-03 期間別入庫数集計バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）取得対象（＝集計対象）の在庫変動区分は親区分が「入庫」「買取」のもののみとし、移動や分割などで入庫した在庫は集計に含まない。
　実装は MtbStockChangeType::BE_STOCKED と MtbStockChangeType::INVENTORY_ADJUSTMENT を対象にし、SQL条件も sctd.stock_change_type_id IN (:be_stocked, :inventory_adjustment) である。コメント上も「入庫・棚卸」と記載されている。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-5:1154 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:147）

■バッチ-B02-03 期間別入庫数集計バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）対象が無い場合は更新を行わずに終了する。
　handle() は集計データ取得前に clearStockUpQuantityForAggregate() を呼び、同メソッドは DELETE FROM dtb_stock_up_quantity を実行する。その後 getStockUpForAggregate() の結果が空でも復元処理はない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-5:1210 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:39）

■バッチ-B02-03 期間別入庫数集計バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）100件ごとに変更を反映しキャッシュをクリアしながら処理し、途中失敗時は反映済みの行のみ更新が残る。
　実装は connection->beginTransaction() で全体を1トランザクションにし、例外時は rollBack() する。100件ごとの flush/clear や部分反映は実装されていない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-5:1210 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:36）

■バッチ-B02-03 期間別入庫数集計バッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）エラーが発生した場合、集計できなかった旨をメールで送信する。
　AggregateStockUpCommand は例外時にコンソールへ error() を出力して FAILURE を返すだけで、BatchAggregateStockUpAction に MailService 等のメール送信依存もない。MailService には週間在庫履歴更新など他バッチ向けのエラー通知はあるが、期間別入庫数集計向けの送信処理は見つからない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-5:1172 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository））

■バッチ-B02-03 期間別入庫数集計バッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）開始・完了のコンソール出力（日時付き）。
　開始時のコンソール出力はなく、完了時も SymfonyStyle::success('期間別入庫数集計が完了しました。') のみで日時を含まない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-5:1238 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php:47）
