■管理-M16-08 販売割引率一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧表示（GET /{admin_route}/discount ）および一覧を表示する（GET admin_discount_list ）として、販売割引率一覧の HTML 応答を返す。
　実装は GET /%eccube_admin_route%/data/discount、ルート名 admin_data_discount。ナビも admin_data_discount を参照する。admin_discount_list は ec-cube-enterprise 全体検索で不在。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-7:1766,1774,1842 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/DiscountController.php:37, /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:365）

■管理-M16-08 販売割引率一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）Twig の {% block title %} は「割引率管理」、{% block sub_title %} は「割引率一覧」。親ナビ側の項目名は「販売割引率一覧」であり文言は一致しない。
　title は admin.data.discount_management の翻訳「販売割引率一覧」、sub_title は admin.data.data_management の翻訳「データ管理」。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-7:1770 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Data/discount.twig:15, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Data/discount.twig:16, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5852）

■管理-M16-08 販売割引率一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）交差情報が無いセルには固定文言「未定義」を出す。各セルでは discountMap[condition.id][discount.id] が定義されていれば値を、その他は「未定義」を表示する。
　discountMap[CardCondition.id][Discount.id] が未定義の場合、Twig は「-」を表示する。販売割引率テンプレート内に「未定義」は不在。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-7:1758,1767,1770,1775,1785,1788 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Data/discount.twig:64）

■管理-M16-08 販売割引率一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）mtb_discount に対応するエンティティをリポジトリの findAll() で読み込む。一覧の行数は mtb_discount を findAll() で得た集合の要素数。
　実装は $this->discountRepository->findBy([], ['id' => 'ASC']) で mtb_discount を取得する。MtbDiscountRepository は findAll の独自上書きを持たない。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-7:1775,1779 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/DiscountController.php:42, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbDiscountRepository.php:25）
