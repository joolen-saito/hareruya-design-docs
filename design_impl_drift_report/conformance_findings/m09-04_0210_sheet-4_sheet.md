■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）言語に応じて twig ファイル拡張子は日本語 .ja.twig、英語 .en.twig とし、ページ新規登録時は日英2種類のファイルを作成する。
　画面は .ja.twig / .en.twig を表示するが、保存処理は日本語 localeSuffix を空文字にして foo.twig を作成し、英語のみ foo.en.twig を作成する。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:1956, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:1960, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:1987 ／ 実装: src/Eccube/Controller/Admin/Content/PageController.php:99, src/Eccube/Controller/Admin/Content/PageController.php:100, src/Eccube/Controller/Admin/Content/PageController.php:200, src/Eccube/Controller/Admin/Content/PageController.php:231, src/Eccube/Resource/template/admin/Content/page_edit.twig:186）

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）コード内に {% set noShopName = true %} を設定すると、titleタグのサフィックス「 | 日本最大級 MTG通販サイト『晴れる屋』」が追加されない。
　default_frame.twig の title は BaseInfo.shop_name を無条件に出力し、noShopName を判定しない。固定文言「日本最大級 MTG通販サイト『晴れる屋』」の付与制御も見つからない。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:1970, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:1971, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:1972 ／ 実装: 不在（探索範囲: src/Eccube/Resource/template/default/default_frame.twig:17, src/Eccube/Resource/template/default/**/*.twig, html/template/default/assets/hareruya/js。noShopName は src/Eccube/Resource/template/default/Purchase/index.twig:2 の設定のみで参照実装なし））

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索語が入力されている場合は、ページ名・ルーティング名・URL・ファイル名・レイアウト名を部分一致条件にする。検索条件はGETリクエスト内で扱い、セッションに載せない。
　検索ボックスの input イベントで searchWord によるクライアント側DOMフィルタを行うだけで、Controller は request query を読まず getPageList() を無条件で呼ぶ。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2094, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2115, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2157 ／ 実装: src/Eccube/Resource/template/admin/Content/page.twig:20, src/Eccube/Resource/template/admin/Content/page.twig:22, src/Eccube/Controller/Admin/Content/PageController.php:65）

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧の操作はドロップダウンメニューで開き、各行にレイアウト編集・ページ編集・削除の操作を表示する。
　ページ名リンクでページ編集へ遷移し、操作列には利用者作成ページの削除アイコンだけを表示する。操作ドロップダウンとレイアウト編集リンクはない。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2085, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2088 ／ 実装: src/Eccube/Resource/template/admin/Content/page.twig:64, src/Eccube/Resource/template/admin/Content/page.twig:93, src/Eccube/Resource/template/admin/Content/page.twig:116; 不在（探索範囲: src/Eccube/Resource/template/admin/Content/page.twig の dropdown/admin_content_layout 系リンク））

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）指定ページの編集フォームを表示する。ファイル名が未設定のページではページ編集リンクを無効化する。
　Page.file_name の有無に関係なく Page.name は admin_content_page_edit へのリンクになる。file_name が空の場合はファイル名列だけ空表示になる。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2085, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2120 ／ 実装: src/Eccube/Resource/template/admin/Content/page.twig:64, src/Eccube/Resource/template/admin/Content/page.twig:77）

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレート本文欄は行数15・等幅小サイズの複数行入力 textarea で表示し、専用のリッチエディタやプレビュー切替は持たない。
　Ace editor を初期化し、表示上は div#editor を使う。Symfony の tpl_data textarea は display:none で隠される。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:1989, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2088 ／ 実装: src/Eccube/Resource/template/admin/Content/page_edit.twig:45, src/Eccube/Resource/template/admin/Content/page_edit.twig:46, src/Eccube/Resource/template/admin/Content/page_edit.twig:205, src/Eccube/Resource/template/admin/Content/page_edit.twig:206）

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除リンク押下時は確認ダイアログ「このページを削除してもよろしいですか？」を表示する。
　共通文言「この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？」をページ名付きで表示する。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2106 ／ 実装: src/Eccube/Resource/template/admin/Content/page.twig:112, src/Eccube/Resource/locale/messages.ja.yaml:1600）

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除対象ページが存在しないときは「削除に失敗しました（削除対象なしメッセージ）」を表示する。
　対象ページがない場合 deleteMessage() を呼び、警告キー admin.common.delete_error_already_deleted（既に削除されています）を表示する。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2108, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2149 ／ 実装: src/Eccube/Controller/Admin/Content/PageController.php:353, src/Eccube/Controller/AbstractController.php:174, src/Eccube/Controller/AbstractController.php:177, src/Eccube/Resource/locale/messages.ja.yaml:1410）

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）行の削除は、利用者作成ページのときだけファイルとレコードを削除し、初期投入ページは削除しない。ページ存在、削除可否、初期ページ制限はサーバ側で判定する。
　EDIT_TYPE_USER のときはレコードと user_data ファイルを削除するが、それ以外の初期投入ページでも DEFAULT_PAGE_PATH 側のS3ファイル削除を実行する else 分岐がある。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2085, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2090, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2120 ／ 実装: src/Eccube/Controller/Admin/Content/PageController.php:361, src/Eccube/Controller/Admin/Content/PageController.php:362, src/Eccube/Controller/Admin/Content/PageController.php:391, src/Eccube/Controller/Admin/Content/PageController.php:392, src/Eccube/Controller/Admin/Content/PageController.php:393）

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）URL重複時は URL 欄直下に「※ 同じURLのデータが存在しています。別のURLを入力してください。」を表示する。
　URL重複時は admin.content.page_url_exists を付与し、実文言は「既にURLが存在しています。」である。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2111 ／ 実装: src/Eccube/Form/Type/Admin/MainEditType.php:212, src/Eccube/Resource/locale/messages.ja.yaml:2719）

■管理-M09-04 ページ管理(登録・編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）追加metaタグは任意、最大長99999文字（lltext_len、Length）とする。
　MainEditType は meta_tags の Length max に eccube_ltext_len を使う。設定値は eccube_ltext_len=3000、eccube_lltext_len=99999。Entity の dtb_page.meta_tags は length=4000。確認お願いします。（設計根拠: excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2117, excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html#sheet-4:2140 ／ 実装: src/Eccube/Form/Type/Admin/MainEditType.php:127, src/Eccube/Form/Type/Admin/MainEditType.php:131, app/config/eccube/packages/eccube.yaml:95, app/config/eccube/packages/eccube.yaml:96, src/Eccube/Entity/Page.php:102）
