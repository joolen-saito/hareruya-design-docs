■管理-M16-08 買取減額率一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口およびHTTPルートは、ナビまたは直接GETで `GET /{admin_route}/buy_discount` に到達し、コード探索用ルート名は `admin_buy_discount_list` とする。
　実装は `#[Route(path: '/%eccube_admin_route%/data/buy_discount', name: 'admin_data_buy_discount', methods: ['GET'])]` で、サイドナビも `url: admin_data_buy_discount` を指している。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-10:2311,2386 ／ 実装: src/Eccube/Controller/Admin/Data/BuyDiscountController.php:37 / app/config/eccube/packages/eccube_nav.yaml:371）

■管理-M16-08 買取減額率一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）Twig の `{% block title %}` は「買取減額率管理」、`{% block sub_title %}` は「買取減額率一覧」。親ナビの項目名は「買取減額率一覧」であり、タイトル帯の「買取減額率管理」とは文言が一部異なる。
　`block title` は `admin.data.buy_discount_management` で、翻訳値は「買取減額率一覧」。`block sub_title` は `admin.data.data_management` で、翻訳値は「データ管理」。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-10:2314 ／ 実装: src/Eccube/Resource/template/admin/Data/buy_discount.twig:15 / src/Eccube/Resource/template/admin/Data/buy_discount.twig:16 / src/Eccube/Resource/locale/messages.ja.yaml:5824 / src/Eccube/Resource/locale/messages.ja.yaml:5881）

■管理-M16-08 買取減額率一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSS・レイアウトは、表ラッパーに `table-responsive with-border`。本テンプレート単体での追加スタイル読み込み指定はない（親フレームの既定に従う）。表は Bootstrap の `table table-striped`。
　テンプレート内に `{% block stylesheet %}` があり、`.buy-discount-table` の罫線・背景色などを定義している。表は `class="table table-striped buy-discount-table"`。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-10:2314 ／ 実装: src/Eccube/Resource/template/admin/Data/buy_discount.twig:18 / src/Eccube/Resource/template/admin/Data/buy_discount.twig:49）

■管理-M16-08 買取減額率一覧
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）表頭行のひとつの要素 id はテンプレート上 `news_list_box__list_header` という識別子になっている。
　実装テンプレートの表頭行 `<tr>` および `<th>` に `news_list_box__list_header` id は設定されていない。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-10:2315 ／ 実装: 不在（探索範囲: src/Eccube/Resource/template/admin/Data/buy_discount.twig, src/Eccube, app, html。検索語: news_list_box__list_header））
