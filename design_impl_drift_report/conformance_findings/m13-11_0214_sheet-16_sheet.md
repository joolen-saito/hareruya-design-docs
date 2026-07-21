■管理-M13-11 イベント申込登録(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）権限を保持している店舗のイベントの情報のみ表示を可能とする。
　メンバーのデフォルト店舗は初期選択されるが、店舗選択肢は BaseInfo 全件を表示し、base_info 未指定時は店舗権限による絞り込みがかからない。検索結果の新規登録リンクも表示側では店舗権限で抑止していない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-16:4376 ／ 実装: src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:71; src/Eccube/Form/Type/Admin/EntryRegisterSearchType.php:50; src/Eccube/Repository/DtbEventRepository.php:194; src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig:109）

■管理-M13-11 イベント申込登録(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）申込登録のイベント検索は POST /{admin_route}/entry/search/event/html、ページ送りは GET /{admin_route}/entry/search/event/html/{page_no} の非同期リクエストで行い、検索結果をモーダル内に表示する。
　M13-11 の申込登録検索は /{admin_route}/entry_registration と /{admin_route}/entry_registration/page/{page_no} の同期画面として実装され、通常フォーム POST と同一ページ内の一覧表示を行う。別機能の Event/EntryController には /event/entry/search_event のモーダル検索があるが、URL・HTTPメソッド・対象画面が設計と異なる。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-16:4452 ／ 実装: src/Eccube/Controller/Admin/Event/EntryRegistrationController.php:64; src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig:29; src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig:76; src/Eccube/Controller/Admin/Event/EntryController.php:379）

■管理-M13-11 イベント申込登録(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）イベントIDによる直接検索として POST /{admin_route}/entry/search/event/id で指定IDのイベントを取得する。
　M13-11 の EntryRegistration 検索画面にはイベントID入力欄も POST /entry/search/event/id 相当のルートもない。別機能の admin_entry_search_event_by_id は /event/entry/search_event/set で、イベント申込一覧モーダルのフォーム反映用 JSON である。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-16:4452 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Event, src/Eccube/Form/Type/Admin, src/Eccube/Resource/template/admin/Event, src/Eccube/Repository/DtbEventRepository.php。検索語: entry/search/event/id, search/event/id, admin_entry_search_event_by_id, event ID, event_detail_id））

■管理-M13-11 イベント申込登録(検索入力)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）非同期リクエストでない場合は、空の検索結果でモーダル枠のみ表示する。
　EntryRegistrationController のイベント検索は通常リクエストを前提にページ全体を描画し、非同期でないイベント検索を空の結果付きモーダル枠として返す分岐はない。isXmlHttpRequest() 分岐はプレイヤー検索モーダル用 search_player にのみ存在する。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-16:4460 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Event/EntryRegistrationController.php, src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig, src/Eccube/Resource/template/admin/Event/Entry/search_event_modal_list.twig。検索語: isXmlHttpRequest, XmlHttpRequest, search_event_modal, empty pagination, 空の検索結果））
