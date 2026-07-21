■API-A06-08 カード名から買取用商品情報を取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）カード名から買取用商品情報取得は GET /search とし、name はクエリパラメータで受け取る。
　api_search は /%eccube_api_v1_route%/search を methods ['POST'] で定義し、name は $request->request->get('name', '') から取得している。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2684, excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2688, excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2696 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:99, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:102）

■API-A06-08 カード名から買取用商品情報を取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）条件に一致する買取用商品が無い場合はページが見つからない扱い（404）とし、標準の例外応答JSONを返す。
　name が空の場合は HTTP 200 の JsonResponse(['cards' => []]) を返す。検索結果が空の場合も NotFoundException を投げず、formatter が ['cards' => new stdClass()] を返して HTTP 200 になる。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2639, excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2684, excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2689, excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2703, excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2763 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:104, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:117, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:123）

■API-A06-08 カード名から買取用商品情報を取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）name はカード名（商品名）の前方一致検索キーで、% と _ はエスケープして扱う。
　product.name LIKE :cardName に対して setParameter('cardName', $cardName.'%') を設定しており、入力値中の % と _ を addcslashes 等でエスケープしていない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2696 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:136, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:137）

■API-A06-08 カード名から買取用商品情報を取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）成功時レスポンスは cards オブジェクトを最上位に持ち、検索で得たカードを1始まりの連番でキー付けし直して格納する。
　formatter は $cardId = $dto->cardId をそのまま $cards[$cardId] のキーにして返す。1,2,3... への再採番処理は無い。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2689, excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2692, excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2700 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:68, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:74, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:123）

■API-A06-08 カード名から買取用商品情報を取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）conditionClasses.<conditionCode> 配下の応答フィールドは productCode、price(string)、stock(string) 等の設計名・型で返す。
　formatter は productCode ではなく productClassCode を返す。price は standardPrice の int|null、stock は DTO で int にキャストされた値を返す。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2701, excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-10:2707 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:113, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:115, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:117, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:118, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Repository/Master/GetBuyingCardsQueryResponseDto.php:43, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Repository/Master/GetBuyingCardsQueryResponseDto.php:45）
