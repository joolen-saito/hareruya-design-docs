■API-A16-02 言語コードに紐づいたトップバナーの情報一覧を取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）指定言語の設定済みトップバナー一覧を取得する。トップバナーマスタは設定状態・言語で絞り込み、取得対象は指定言語の設定済みトップバナーとする。
　A16-02 Controller は言語コードで MtbLanguage を取得した後、$Language->getTopBanners() をそのまま返す。disp_type=1（表示）、画像URL空でないこと、sort_no順などを条件にする MtbTopBannerRepository::findWhereUrlIsNotEmpty() は存在するが、この API からは呼ばれていない。確認お願いします。（設計根拠: excel_to_html/output/0516_基本設計仕様書(API_データ管理).html#sheet-4:1023,1177,1185,1188,1222 ／ 実装: src/Eccube/Controller/App/ContentController.php:91,102; src/Eccube/Repository/Master/MtbTopBannerRepository.php:38）

■API-A16-02 言語コードに紐づいたトップバナーの情報一覧を取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示順は既存実装のデフォルトと上限に従い、取得後に業務値を再計算しない。移行先トップバナーマスタは sort_no を持ち、表示順に用いる。
　A16-02 は $Language->getTopBanners() の Collection を TopBannersResponseBuilder に渡しており、MtbTopBanner の ManyToMany 定義には sort_no の OrderBy がない。一方、未使用の MtbTopBannerRepository::findWhereUrlIsNotEmpty() には orderBy('tb.sortNo', 'ASC') がある。確認お願いします。（設計根拠: excel_to_html/output/0516_基本設計仕様書(API_データ管理).html#sheet-4:1177,1216,1222 ／ 実装: src/Eccube/Controller/App/ContentController.php:102,110; src/Eccube/Entity/Master/MtbTopBanner.php:55; src/Eccube/Repository/Master/MtbTopBannerRepository.php:50）

■API-A16-02 言語コードに紐づいたトップバナーの情報一覧を取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧が空、または当該言語コードが言語マスタに存在しない場合はコード404のJSONを返す。失敗レスポンス本文は {code, message}（"Language code is not found"）。
　言語未存在または TopBanners が空の場合、NotFoundException('Not Found') を投げ、catch で {'code': 404, 'errors': ['Not Found']} を返す。確認お願いします。（設計根拠: excel_to_html/output/0516_基本設計仕様書(API_データ管理).html#sheet-4:1045,1185,1197,1231 ／ 実装: src/Eccube/Controller/App/ContentController.php:95,99,103,107,113; src/Eccube/Exception/App/NotFoundException.php:27; src/Eccube/Exception/App/BaseApiException.php:48）
