■管理-M14-01 カード一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索実行時は POST /{admin_route}/card/search/1 に送信し、検索フォームの action は常に page_no=1 の検索ルートを指すこと。
　検索フォームは url('admin_card_list') を action にして POST /{admin_route}/card に送信している。/card/search/{page_no} ルートは存在するが、検索ボタン送信先として使われていない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-3:1046 ／ 実装: src/Eccube/Resource/template/admin/Card/index.twig:176; src/Eccube/Controller/Admin/Card/CardController.php:64）

■管理-M14-01 カード一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索フォームは CSRF 保護を明示的に無効化すること。
　SearchCardType の configureOptions で csrf_protection が true に設定され、index.twig の検索フォームに適用される。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-3:1084 ／ 実装: src/Eccube/Form/Type/Admin/SearchCardType.php:208）

■管理-M14-01 カード一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）GET /{admin_route}/card の初期表示では admin.card.search、admin.card.search.page_no、admin.card.search.page_count などの検索セッションを削除すること。
　初期GET分岐では session remove を行わず、card と card.page_no を set して画面を返す。検索Trait側の永続キーは eccube.admin.card.search.* だが、CardController/SearchControllerTrait 内に初期表示時の削除処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-3:1053 ／ 実装: src/Eccube/Controller/Admin/Card/CardController.php:98; src/Eccube/Controller/Admin/SearchControllerTrait.php:110）

■管理-M14-01 カード一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）複数検索欄は半角スペース・全角スペース・カンマで分割し、各語は日本語名/英語名/テキストの OR、語同士は AND で検索すること。
　admin検索の getQueryBuilderBySearchData() は入力文字列全体を1つの LIKE 値として name_jp/name_en/text_jp/text_en に OR 適用している。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-3:1071 ／ 実装: src/Eccube/Repository/Master/MtbCardRepository.php:224）

■管理-M14-01 カード一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索結果一覧のカード名はリンクで、GET /{admin_route}/card/{id} に遷移してカード編集画面を表示すること。
　カード名セルはテキスト表示のみでリンクではない。編集遷移は別のアイコンリンクから admin_card_edit、実URL /card/{id}/edit に遷移する。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-3:1046 ／ 実装: src/Eccube/Resource/template/admin/Card/index.twig:423; src/Eccube/Resource/template/admin/Card/index.twig:428; src/Eccube/Controller/Admin/Card/CardController.php:204）

■管理-M14-01 カード一覧(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）カード名リスト作成ボタンのAJAX成功/失敗alert後、常に全画面リロードを行うこと。
　AJAX完了時に alert を出し、always でボタンを再有効化するが、location.reload() 等の全画面リロード処理はない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-3:1049 ／ 実装: src/Eccube/Resource/template/admin/Card/index.twig:137）

■管理-M14-01 カード一覧(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）CSV出力ボタン押下時は送信中の二重実行防止として type=submit 化し、pointer-events を約500ms無効化してから復帰させること。
　CSV出力ボタンは type=button のまま、クリック時の共通bulk処理で確認・CSRF付与・submitは行うが、CSVボタン固有の約500ms pointer-events 無効化/復帰処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-3:1160 ／ 実装: 不在（探索範囲: src/Eccube/Resource/template/admin/Card/index.twig, html/template/admin/assets/js/function.js, html/template/admin/assets/js））
