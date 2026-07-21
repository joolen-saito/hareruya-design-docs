■管理-M13-11 イベント申込登録(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）申込登録のイベント検索は POST /{admin_route}/entry/search/event/html（非同期）、ページ送りは GET /{admin_route}/entry/search/event/html/{page_no}（非同期）、イベントIDによる直接検索は POST /{admin_route}/entry/search/event/id（非同期）で提供し、非同期リクエストでない場合は空の検索結果でモーダル枠のみ表示する。
　実装はイベント検索HTMLを GET /%eccube_admin_route%/event/entry/search_event、ページ送りを GET /%eccube_admin_route%/event/entry/search_event/page/{page_no}、直接検索を POST /%eccube_admin_route%/event/entry/search_event/set としている。entryEventHtml 内に非同期リクエスト判定はなく、通常GETでも検索・描画処理に進む。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-17:4624-4625,4631-4636,4668-4669 ／ 実装: src/Eccube/Controller/Admin/Event/EntryController.php:379, src/Eccube/Controller/Admin/Event/EntryController.php:380, src/Eccube/Controller/Admin/Event/EntryController.php:454）

■管理-M13-11 イベント申込登録(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）権限を保持している店舗のイベントのみ登録が可能とし、識別ID:4「新規登録」ボタンは権限を保持している店舗のイベントのみ表示する。
　イベント申込登録一覧では店舗選択肢が全BaseInfoから作られ、検索時は選択されたbase_infoがある場合だけ絞り込む。未選択時にログイン管理者の編集可能店舗へ限定する条件はなく、一覧の「新規登録」リンクも各行に無条件表示される。遷移先の create では isEditableShop により拒否する。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-17:4548-4553,4570 ／ 実装: src/Eccube/Form/Type/Admin/EntryRegisterSearchType.php:41, src/Eccube/Form/Type/Admin/EntryRegisterSearchType.php:50, src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:108, src/Eccube/Repository/DtbEventRepository.php:194, src/Eccube/Repository/DtbEventRepository.php:199, src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig:109, src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig:110, src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:141）
