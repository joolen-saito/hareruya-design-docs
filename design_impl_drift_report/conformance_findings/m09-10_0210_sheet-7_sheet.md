■管理-M09-10 支店トップページ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）支店トップページ管理を開く/支店選択変更は GET /{admin_route}/integration/toppage_management/{id} で指定IDの支店設定を表示し、id省略時は0として扱う。
　GET入口は /{admin_route}/content/branch_toppage のみで{id}を持たず、支店選択は /content/branch_toppage/select へのPOST送信で画面を再描画する。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-7:2863,2914 ／ 実装: src/Eccube/Controller/Admin/Content/BranchTopPageController.php:45,59; src/Eccube/Resource/template/admin/Content/branch_toppage.twig:48）

■管理-M09-10 支店トップページ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）登録は POST /{admin_route}/integration/toppage_management/register/{id} で行い、成功/失敗時は同じ支店IDの同一画面へ302リダイレクトする。
　登録POSTは /{admin_route}/content/branch_toppage/register で{id}を持たず、成功時もエラー時もrenderPage()で同画面を200再描画する。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-7:2863,2898,2914 ／ 実装: src/Eccube/Controller/Admin/Content/BranchTopPageController.php:72,95,97,109,113,119,121）

■管理-M09-10 支店トップページ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）保存成功時は画面上部の成功メッセージに「登録しました。」を表示する。
　保存成功時は admin.common.save_complete をaddSuccessし、翻訳は「保存しました」。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-7:2881 ／ 実装: src/Eccube/Controller/Admin/Content/BranchTopPageController.php:95,119; src/Eccube/Resource/locale/messages.ja.yaml:1559）

■管理-M09-10 支店トップページ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）支店共通設定が無効で既存画像も新規画像もない状態で保存したときは「バナーイメージファイルを指定してください。」を画面上部エラーに表示し、DB保存しない。
　画像未指定時も admin.content.branch_toppage.banner_image_required をaddErrorし、表示文言は「バナー画像の登録に失敗しました。」になる。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-7:2881,2889,2917 ／ 実装: src/Eccube/Controller/Admin/Content/BranchTopPageController.php:243,244,248,249; src/Eccube/Resource/locale/messages.ja.yaml:4134）

■管理-M09-10 支店トップページ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）支店トップ表示では各タイルの商品規格を最大3件取得する。
　ShopTopControllerのTILE_PRODUCT_LIMITは8で、ピックアップ/タグ商品の取得に8件上限を渡している。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-7:2878,2885 ／ 実装: src/Eccube/Controller/Shop/ShopTopController.php:38,138,142; src/Eccube/Repository/ProductRepository.php:512,553）

■管理-M09-10 支店トップページ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）タイル属性がピックアップ商品の場合、「もっと見る」を押下するとピックアップ商品（ピックアップフラグが1の商品）で検索された商品一覧を表示する。
　ピックアップ商品タイルのもっと見るリンクは url('product_list') で、商品一覧側にもpickup条件を受ける検索パラメータは確認できない。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-7:2771,2776 ／ 実装: src/Eccube/Resource/template/default/Block/shop_item_list.twig:26,28; src/Eccube/Controller/Front/ProductController.php:135）

■管理-M09-10 支店トップページ管理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）フロント表示時に未設定のタイル位置があれば、リニューアル後の4枠（上段左、上段右、下段左、下段右）を対象に補完する。
　ShopTopController::buildTilesは保存済みTilesをsection順に並べてforeachするだけで、欠けた4枠を補完しない。管理画面JSには不足フォーム生成があるが、フロント表示補完はない。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-7:2878,2885,2892 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Shop/ShopTopController.php:127-161, src/Eccube/Resource/template/default/Block/shop_item_list.twig:25-52, DtbTile::SECTIONS/補完/missing/fill検索））

■管理-M09-10 支店トップページ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）新規画像を選択した場合、既存画像がS3に存在すれば削除してから新規画像をアップロードする。
　storeBannerImageは新規画像をuploadFileした後に、既存画像が存在すればdeleteする。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-7:2885,2889,2892 ／ 実装: src/Eccube/Controller/Admin/Content/BranchTopPageController.php:319,326,327,330）

■管理-M09-10 支店トップページ管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画像ファイルは5MBまで、許可拡張子は環境設定の許可拡張子のみを許可する。
　image_fileはAssert\Image(maxSize='5M')で、mimeTypesをimage/jpeg,image/png,image/gif,image/webpに固定している。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-7:2887,2908 ／ 実装: src/Eccube/Form/Type/Admin/Content/BranchTopPageManagementType.php:73,77,79,80,81,82,83）
