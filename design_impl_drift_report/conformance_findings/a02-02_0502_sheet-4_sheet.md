■API-A02-02 ポップアップ用カード情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）パスのカードID・言語、クエリのフォイル有無（foil_flg）・価格（price）を受け取り、当該カードID・言語・フォイル有無・価格に対応するポップアップ用商品情報を取得する。foil_flg指定時はフォイル区分の並び順に反映し、price=highで販売価格の降順、それ以外で昇順に並べる。
　カードIDAPIは /api/popup/card/{lang}/{cardId} として存在し、cardId/langのみを ProductRepository::findPopupProductByCardId($cardId, $languageCode) に渡す。Requestを受け取らず foil_flg / price クエリを読まない。リポジトリ側も引数は cardId と languageCode のみで、ORDER BY は cd.foil_flg ASC 固定、price02の昇降順指定は無い。確認お願いします。（設計根拠: excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-4:1171,1178 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:265, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:278, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2226）

■API-A02-02 ポップアップ用カード情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）該当する商品規格が無い場合は HTTP 404 で本文 {code, message}（"Not Found"）のJSONを返す。
　該当なし時は NotFoundException('Not Found') をthrowし、BaseApiException catchで {'code': 404, 'errors': ['Not Found']} を返す。messageキーは返さない。確認お願いします。（設計根拠: excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-4:1182,1183 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:279, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:291, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:79）
