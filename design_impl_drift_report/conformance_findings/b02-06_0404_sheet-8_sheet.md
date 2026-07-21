■バッチ-B02-06 在庫初期化
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店舗登録時、TC大阪(支店ID:1)の商品規格在庫全データを新規店舗用にカスタマイズした上で登録(複製)するバッチ
　店舗登録時の初期在庫生成自体は GenerateInitialTenantStock から BatchInitialStockRegistrationAction::handle() が呼ばれるが、複製元は BaseInfo::TC_TOKYO_ID であり、BaseInfo.php:45 では TC_TOKYO_ID = 1 と定義されている。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-8:1481 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchInitialStockRegistrationAction.php:43）

■バッチ-B02-06 在庫初期化
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）複製範囲は「商品規格コード」および「拡張タイプ」のみ。それ以外は初期値(在庫数0など)が設定される。
　INSERT ... SELECT で dtb_product_stock の product_class_id, stock_location_id を複製し、stock=0, total_cost=0, pick_up_flg=false, create_date/update_date=now を設定している。商品規格コードおよび拡張タイプのみを複製する実装ではない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-8:1482 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:431）

■バッチ-B02-06 在庫初期化
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）コンソールのバッチコマンド product:batch insertStockHistory <開始日> <終了日> で、指定した受注日範囲の受注をたどり、受注分の在庫減算の在庫履歴を作成する。引数不足時のメッセージ、受注日の昇順取得、受注日より前の最新在庫履歴参照、stock_change_reason による重複判定、登録済み/登録結果/開始完了のコンソール出力を含む。
　src/Eccube/Command 配下に product:batch insertStockHistory または insertStockHistory の Command は存在しない。B02-06 として存在する Command は InitialStockRegistrationCommand.php:35 の eccube:initial-stock-registration で、引数も target_base_info_id の1つのみ。StockDiffProcessor には通常受注フローの在庫履歴処理があるが、開始日・終了日を受けて過去受注から在庫履歴を再作成するバッチ入口ではない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-8:1522 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository, /home/y-saito/Developments/ec-cube-enterprise/html））
