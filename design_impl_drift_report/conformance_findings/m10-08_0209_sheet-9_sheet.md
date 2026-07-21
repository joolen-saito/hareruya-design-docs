■管理-M10-08 自動送信メール
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示要素はページタイトル「ショップ設定」、サブタイトル「メール管理」、メイン見出し「自動送信メールテンプレート編集」と表示する。
　実装はtitleに「自動送信メール」、sub_titleに「基本情報設定」、カード見出しに「テンプレート編集」を表示する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2803 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:5, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:6, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:58, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2941, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3101, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4153）

■管理-M10-08 自動送信メール
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）初期表示は識別ID:1-3「テンプレ選択」、識別ID:1-4「テンプレ名称」、識別ID:1-5「件名」のみ表示する。
　GET /mall/auto_mail のMail未指定時はMailがnullのまま返され、Twigの「{% if Mail and Mail.id %}」配下にあるテンプレ名称・件名は描画されず、テンプレ選択のみが表示される。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2724 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:55, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:115, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:66, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:71, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:84, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:91）

■管理-M10-08 自動送信メール
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレ選択は必須・空不可で、候補は自動送信対象のみ、画面では名称昇順で並ぶ。
　実装はtemplateフィールドをrequired=falseにし、isAutoSend=trueで候補を絞る一方、並び順はmt.id ASC。空選択肢はJSでdisabledにするだけで、サーバ側NotBlankはない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2807, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2821, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2848 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:46, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:47, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:51, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:53, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:54, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:27）

■管理-M10-08 自動送信メール
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレ名称は任意、最大長はstext_lenで、空白のみはフォーム検証上通り得る。
　実装はテンプレ名称にNotBlank制約を付け、画面上も必須バッジを表示する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2828, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2848 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:56, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:58, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:59, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:85）

■管理-M10-08 自動送信メール
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）自動送信対象外の識別子をURL等で直接指定した場合は、検索条件に合致しないため404相当の応答にする。
　ルート引数のMailTemplateはidで解決され、Controller側ではMailがisAutoSendかどうかを検査しない。isAutoSend条件はフォームの候補リストにだけ適用される。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2800, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2830, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2859 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:48, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:49, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:55, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:81, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:49, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:51）

■管理-M10-08 自動送信メール
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）POSTで現在行がnullの場合はエラーメッセージを積み、識別子なしの一覧相当表示へリダイレクトする。
　POST時に$Mail->getId()を直接呼び、null行用のaddError/addFlashとredirectToRoute('admin_mall_auto_mail')はない。画面側はMail.idなしではsubmitボタンを出さず、JSでalert抑止するだけ。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2811, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2830, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2854 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:91, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:92, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:93, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:39, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:43, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:167）

■管理-M10-08 自動送信メール
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）FormValidHelperによりCSRFトークンを検証し、不正ならアクセス拒否例外を投げ、検証後は当フォーム名に対応するCSRFトークンを更新する。
　実装はform._tokenを描画し、POST時はhandleRequest後のisSubmitted/isValidに依存する。FormValidHelper、明示的なアクセス拒否例外、トークン更新処理は当機能に存在しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2813, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2848, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2859 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:53, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:96, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:98）

■管理-M10-08 自動送信メール
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本文プレビューはTwig本文ファイルを文字列として読み、注釈ブロックを除去し、改行を<br>に置換し、{{ header }}/{{ footer }}位置にヘッダー・フッター用textareaまたは静的HTMLを挿入し、注文内容インクルード相当の文字列を設定済み文言へ置換する。
　replaceBodyは{{ header }}と{{ footer }}の位置で文字列を分割するだけ。注釈除去、改行の<br>化、注文内容インクルード相当の置換はなく、本文はreadonly textarea、ヘッダー/フッターは別行のフォームtextareaとして表示される。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2803, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2809 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:83, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:87, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:129, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:135, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:141, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:102, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:109, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:117, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:125）

■管理-M10-08 自動送信メール
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）本文ソース読み込み時にTwigローダへプラグイン既定本文ディレクトリを追加登録する。
　当機能のControllerはTwigローダへ追加パスを登録せず、既存ローダでMailTemplate.file_nameを直接読み込む。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2785, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2809, /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2839 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php。実装はMallAutoMailController.php:83-84でgetSourceContextを直読するのみ。rg 'addPath|prependPath|setPaths' で当機能0件））

■管理-M10-08 自動送信メール
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）最終更新者（管理者名）・最終更新日時を、テンプレ行と更新日時が揃った場合に表示する条件があり、Twig上は更新日の年が2018より大きい場合のみ日時表示する。
　実装はMail.idがあれば最終更新者を表示し、Mail.update_dateがあれば年条件なしで日時を表示する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-9:2803 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:71, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:75, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig:81）
