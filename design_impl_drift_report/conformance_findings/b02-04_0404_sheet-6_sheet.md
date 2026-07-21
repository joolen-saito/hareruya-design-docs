■バッチ-B02-04 商品部門未設定チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンド product:batch checkNoSectionProduct で部門未設定チェックを実行し、公開中かつ部門未設定の商品を抽出して該当があれば管理者へアラートメールを送信する。
　実装済みの近似コマンドは eccube:otc-buy-order:aggregate-summary で、商品管理バッチ product:batch checkNoSectionProduct は存在しない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-6:1289 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45 / 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Product, src/Eccube/Repository/ProductClassRepository.php, src/Eccube/Repository/ProductRepository.php, html; 検索語: product:batch, checkNoSectionProduct, NoSection, 部門未設定, section_id））

■バッチ-B02-04 商品部門未設定チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）公開中かつ部門未設定の商品規格を dtb_product.product_status_id と dtb_product_class.section_id を使って抽出する。
　有効な抽出処理は dtb_otc_buy_order_detail.section_id / dtb_otc_buy_order_indivisual_input_product.section_id が NULL の店頭買取データを対象にしている。ProductClassRepository には商品規格向けの NoSection メソッド痕跡があるが全体がコメントアウトされている。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-6:1282 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:949 / /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2325）

■バッチ-B02-04 商品部門未設定チェック
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）件数の範囲で、一定件数（10000件）ずつ部門未設定の商品規格を取得することを繰り返す。一覧は最大10,000件まで取得し、それ以降は省略する。
　有効な部門未設定通知処理には 10000 件単位の繰り返し取得、または最大10000件で省略する制御がない。ProductClassRepository の LIMIT/OFFSET 付き NoSection 取得はコメントアウトされている。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-6:1236 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Product, src/Eccube/Repository/ProductClassRepository.php, src/Eccube/Repository/ProductRepository.php, src/Eccube/Service/Admin/OtcBuyOrder, src/Eccube/Repository/DtbOtcBuyOrderRepository.php））

■バッチ-B02-04 商品部門未設定チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「部門未設定商品通知メール」という件名で管理者にメール通知され、本文には検索に該当した「商品名,商品コード」の一覧が記載される。
　近似テンプレートは mail_key eccube.mail.mall.otc_buy_order_no_section_alert、件名は「【店頭買取】部門未設定商品通知」。本文は「商品名, 商品コード」と products の product_name/product_code を出力する。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-6:1235 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260303143331.php:38 / /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/otc_buy_order_no_section_alert.twig:1）

■バッチ-B02-04 商品部門未設定チェック
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）開始・完了のコンソール出力（日時付き）を行い、抽出・送信時のエラーではエラーメッセージをコンソールに出力する。
　商品管理バッチ product:batch checkNoSectionProduct 自体がなく、B02-04 としての開始・完了日時付きコンソール出力、抽出・送信時エラーのコンソール出力は確認できない。近似の店頭買取集計バッチは集計対象日、例外時エラー、完了メッセージを出すが日時付き開始・完了ではない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-6:1319 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Product; 近似: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:78））
