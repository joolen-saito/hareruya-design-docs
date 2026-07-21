■管理-M16-06 買取価格対応表(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口は、一覧が GET /{admin_route}/buy_price_list、一覧の金額セルが GET /{admin_route}/buy_price_list/{id} で編集画面へ遷移する。調査補助上のルート名は admin_buy_price_list / admin_buy_price_list_edit とされている。
　一覧は name='admin_data_buy_price_list' path='/%eccube_admin_route%/data/buy_price_list'、編集は name='admin_data_buy_price_list_edit' path='/%eccube_admin_route%/data/buy_price_list/{id}/edit' として実装され、セルリンクも admin_data_buy_price_list_edit を参照している。admin_buy_price_list / admin_buy_price_list_edit / '/{admin_route}/buy_price_list/{id}' の別実装は rg 検索で見つからない。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-8:1963,1970-1971,2003,2028 ／ 実装: src/Eccube/Controller/Admin/Data/BuyPriceListController.php:45,80 / src/Eccube/Resource/template/admin/Data/buy_price_list.twig:73）

■管理-M16-06 買取価格対応表(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示要素は、block title が「買取価格対応表」、サブタイトルが「一覧」、メニューが menus = ['data_menu', 'buy_price_list'] である。
　Twig は menus = ['data_management', 'buy_price_list_management']、title は 'admin.data.buy_price_list_management' = 「買取価格対応表」、sub_title は 'admin.data.data_management' = 「データ管理」を表示する。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-8:1966 ／ 実装: src/Eccube/Resource/template/admin/Data/buy_price_list.twig:13,15-16 / src/Eccube/Resource/locale/messages.ja.yaml:5824,5873）

■管理-M16-06 買取価格対応表(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）処理フローでは、カード状態マスタを識別子昇順で全件取得し、買取価格対応表マスタを識別子順で全件取得する（リポジトリの findAll に依存）。行の並びは三次元配列の最外層キー（NM価格）の列挙順に従う。
　カード状態は id IN (SP, MP, HP) で取得し、明示的な識別子昇順指定はない。買取価格対応表は findBy([], ['nmPrice' => 'ASC', 'specialFlg' => 'ASC']) で取得し、さらに ksort($buyPriceMap, SORT_NUMERIC) でNM価格順に並べ替えている。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-8:1971 ／ 実装: src/Eccube/Controller/Admin/Data/BuyPriceListController.php:49-57,67）

■管理-M16-06 買取価格対応表(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）データ整合性では、マスタに存在しない組み合わせはセル自体が無い。欠けの検知や警告は一覧では行わない。
　buyPriceForFlg[specialFlg][CardCondition.id] が存在しない場合、実装は <td>-</td> を描画する。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-8:1981 ／ 実装: src/Eccube/Resource/template/admin/Data/buy_price_list.twig:72-75）

■管理-M16-06 買取価格対応表(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表頭は二段で、ノーマルカード／FOil&プロモ版カードを表示し、補足ではノーマルカード colspan="3"、FOil&プロモ版カード colspan="4" が静的に書かれている。
　実装は通常版見出しと特別版見出しの colspan をどちらも CardConditions|length で動的に決める。実装の表示文言は 'ノーマルカード' と 'Foil&プロモ版カード' である。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-8:1966-1967 ／ 実装: src/Eccube/Resource/template/admin/Data/buy_price_list.twig:53-63 / src/Eccube/Resource/locale/messages.ja.yaml:5879-5880）
