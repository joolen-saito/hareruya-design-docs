■API-A02-05 更新商品規格取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）レスポンス成功時の各商品規格行は保管コードIDを `result[].strageCodeId` として返す。
　SQLは `sc.id AS storageCodeId` を返し、ResultSetMapping も `storageCodeId` に割り当てている。Controller はRepository結果をキー変換せず `result` に返す。確認お願いします。（設計根拠: excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-7:1810 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2130）

■API-A02-05 更新商品規格取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）レスポンス成功時の `result[].stock` と `result[].price02` は string として返す。
　Repository は `pc.stock AS stock`, `pc.price02 AS price02` を取得し、ResultSetMapping でどちらも `integer` としてマッピングしている。Controller はこの配列をそのままJSON化する。確認お願いします。（設計根拠: excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-7:1810 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2161）

■API-A02-05 更新商品規格取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）応答プロパティはcamelCase、日時はISO8601とする。`result[].productClassUpdateDate` と `result[].productUpdateDate` はISO8601日時文字列で返す。
　SQLは `pc.update_date AS productClassUpdateDate`, `p.update_date AS productUpdateDate` をそのまま取得し、ResultSetMapping で string として返す。Controller側で `DateTimeInterface::ATOM` や `format('c')` による出力整形は行っていない。確認お願いします。（設計根拠: excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-7:1844 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2135）
