■バッチ-B02-05 お気に入り商品セール通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは product:batch saleNotification とし、セール中のお気に入り商品を会員ごとにまとめ、対象会員へセール通知メールを送信する。
　実装コマンド名は eccube:favorite-sale-notification。クラスコメントの使用例も bin/console eccube:favorite-sale-notification であり、設計の product:batch saleNotification では起動できない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-7:1410 ／ 実装: src/Eccube/Command/FavoriteSaleNotificationCommand.php:34）

■バッチ-B02-05 お気に入り商品セール通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）お気に入り商品は dtb_favorite_product（product_id・player_id・language_id）を使用し、会員（選手情報）は dtb_player（first_name_jp・last_name_jp・email）を通知メールの宛先・本文に使用する。
　バッチは CustomerFavoriteProductRepository::findSaleFavoriteProducts() を呼び、dtb_customer_favorite_product を表す CustomerFavoriteProduct と Customer を join して customer_id/name01/name02/email を取得している。dtb_favorite_product の player_id・language_id および dtb_player の氏名・email を抽出元にしていない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-7:1404 ／ 実装: src/Eccube/Repository/CustomerFavoriteProductRepository.php:211）

■バッチ-B02-05 お気に入り商品セール通知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）実行トリガーはスケジュール起動（Step Functions）、実行タイミングは毎週水曜17:30。
　FavoriteSaleNotificationCommand にはスケジュール・Step Functions・水曜17:30に関する定義やコメントがない。該当検索では別バッチの Step Functions コメントのみヒットした。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-7:1366 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: Step Functions, StepFunctions, 17:30, 水曜, saleNotification, product:batch））

■バッチ-B02-05 お気に入り商品セール通知
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）一定件数ごとに処理メモリを解放しながら集約する。
　findSaleFavoriteProducts() の全結果を $rows に取得し、groupByCustomer() で全件を $grouped 配列へ集約してから送信している。一定件数ごとの clear/detach/flush/バッチ分割などの処理はない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-7:1416 ／ 実装: src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:38）

■バッチ-B02-05 お気に入り商品セール通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）抽出・送信時のエラーはエラーメッセージをコンソールに出力する。
　会員ごとのメール送信例外は BatchFavoriteSaleNotificationAction で catch され、log_error に customer_id と message を出して処理継続する。例外を再throwしないため FavoriteSaleNotificationCommand の $io->error には到達せず、コンソールには送信時エラーが出ない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-7:1440 ／ 実装: src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:53）

■バッチ-B02-05 お気に入り商品セール通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）開始・完了のコンソール出力（日時付き）。
　完了相当の success メッセージは出力するが、開始メッセージはなく、出力に日時も付与していない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-7:1443 ／ 実装: src/Eccube/Command/FavoriteSaleNotificationCommand.php:55）
