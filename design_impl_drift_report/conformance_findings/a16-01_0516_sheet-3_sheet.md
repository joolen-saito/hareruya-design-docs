■API-A16-01 トップバナー情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）レスポンス（成功）はHTTP 200で、トップバナー情報をJSONで返す。詳細設計の応答フィールドは id, imageUrl, link, dispType, languages[].id, languages[].nameJp, languages[].nameEn, languages[].code とする。
　TopBannerResponseBuilder は id, image_url, link, disp_type, languages[].id, languages[].name_jp, languages[].name_en, languages[].code を返す。ContentController はこの配列をそのまま JSON 200 で返す。確認お願いします。（設計根拠: excel_to_html/output/0516_基本設計仕様書(API_データ管理).html#sheet-3:955 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Content/TopBannerResponseBuilder.php:41）

■API-A16-01 トップバナー情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）レスポンス（失敗）は、該当IDのトップバナーが存在しない場合にHTTP 404で本文 {code, message}（"Not Found"）を返す。
　該当なし時は NotFoundException('Not Found') を投げ、catch(BaseApiException) で {'code': 404, 'errors': ['Not Found']} を返す。確認お願いします。（設計根拠: excel_to_html/output/0516_基本設計仕様書(API_データ管理).html#sheet-3:958 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:70）
