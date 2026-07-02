# HTML設計「利用者視点の入口」記載漏れエンドポイント再チェック

## サマリ
- html_files: 43
- html_endpoint_entries: 1095
- html_unique_method_path_after_normalization: 760
- controller_method_routes_total_in_scope_plus_block_options: 1048
- main_routes_non_options: 1019
- block_routes_non_options: 9
- options_routes_excluded: 20
- matched_main: 404
- missing_main: 615
- missing_block_internal: 9
- missing_main_by_section: {'Admin': 445, 'Front': 112, 'App API': 57, 'Smaregi': 1}
- normalization_notes: ['/%admin_route% and /{admin_route} => /%eccube_admin_route%', '/{_locale}{_shop} => /{_locale}', '{path variables} => {}', 'query strings ignored']

## 記載漏れ候補（主一覧）

| 区分 | HTTPメソッド | 実装パス | route名 | 機能 | 根拠 | 備考 |
|---|---|---|---|---|---|---|
| Admin | GET | /%eccube_admin_route%/analysis/format-sales | admin_analysis_format_sales | フォーマット売上分析の初期表示. | Admin/Analysis/FormatSalesController.php:44 |  |
| Admin | GET | /%eccube_admin_route%/analysis/format-sales/export | admin_analysis_format_sales_export | フォーマット売上分析結果をCSVエクスポートする. | Admin/Analysis/FormatSalesController.php:98 |  |
| Admin | POST | /%eccube_admin_route%/analysis/format-sales/search | admin_analysis_format_sales_search | フォーマット売上分析を検索する. | Admin/Analysis/FormatSalesController.php:64 |  |
| Admin | GET | /%eccube_admin_route%/analysis/product-request | admin_analysis_product_request | analysis product request | Admin/Analysis/ProductRequestController.php:46 |  |
| Admin | GET | /%eccube_admin_route%/analysis/product-request/export | admin_analysis_product_request_export | analysis product request export | Admin/Analysis/ProductRequestController.php:92 |  |
| Admin | POST | /%eccube_admin_route%/analysis/product-request/search | admin_analysis_product_request_search | analysis product request search | Admin/Analysis/ProductRequestController.php:62 |  |
| Admin | GET | /%eccube_admin_route%/analysis/sales | admin_analysis_sales | analysis sales | Admin/Analysis/SalesAnalysisController.php:43 |  |
| Admin | POST | /%eccube_admin_route%/analysis/sales/search | admin_analysis_sales_search | analysis sales search | Admin/Analysis/SalesAnalysisController.php:62 |  |
| Admin | GET | /%eccube_admin_route%/analysis/summary/daily | admin_summary_daily | summary daily | Admin/Analysis/SummaryController.php:61 |  |
| Admin | GET | /%eccube_admin_route%/analysis/summary/monthly | admin_summary_monthly | summary monthly | Admin/Analysis/SummaryController.php:71 |  |
| Admin | GET | /%eccube_admin_route%/archetype | admin_archetype_list | archetype list | Admin/Archetype/ArchetypeController.php:64 |  |
| Admin | GET | /%eccube_admin_route%/archetype/csv_import | admin_archetype_csv_import | archetype csv import | Admin/Archetype/ArchetypeCsvController.php:47 |  |
| Admin | POST | /%eccube_admin_route%/archetype/csv_import | admin_archetype_csv_import | archetype csv import | Admin/Archetype/ArchetypeCsvController.php:47 |  |
| Admin | POST | /%eccube_admin_route%/archetype/new | admin_archetype_new | アーキタイプ新規登録画面. | Admin/Archetype/ArchetypeController.php:137 |  |
| Admin | GET | /%eccube_admin_route%/archetype/search/{page_no} | admin_archetype_search | archetype search | Admin/Archetype/ArchetypeController.php:65 |  |
| Admin | POST | /%eccube_admin_route%/archetype/search/{page_no} | admin_archetype_search | archetype search | Admin/Archetype/ArchetypeController.php:65 |  |
| Admin | POST | /%eccube_admin_route%/archetype/search_card_image | admin_archetype_search_card_image | 代表カード検索（Ajax）. | Admin/Archetype/ArchetypeController.php:253 |  |
| Admin | POST | /%eccube_admin_route%/archetype/{id}/delete | admin_archetype_delete | アーキタイプ削除. | Admin/Archetype/ArchetypeController.php:179 |  |
| Admin | GET | /%eccube_admin_route%/archetype/{id}/edit | admin_archetype_edit | アーキタイプ編集画面. | Admin/Archetype/ArchetypeController.php:165 |  |
| Admin | POST | /%eccube_admin_route%/archetype/{id}/edit | admin_archetype_edit | アーキタイプ編集画面. | Admin/Archetype/ArchetypeController.php:165 |  |
| Admin | DELETE | /%eccube_admin_route%/card/bulk_delete | admin_card_bulk_delete | カード一括削除. | Admin/Card/CardController.php:308 |  |
| Admin | GET | /%eccube_admin_route%/card/csv_template | admin_card_csv_template | カードマスタ取込用 CSV テンプレートをダウンロードする。 | Admin/Card/CardCsvController.php:45 |  |
| Admin | GET | /%eccube_admin_route%/card/csv_upload | admin_card_csv_upload | カード CSV アップロード画面を表示する。 | Admin/Card/CardCsvController.php:60 |  |
| Admin | POST | /%eccube_admin_route%/card/export_csv | admin_card_export_csv | 一覧で選択したカードを CSV で出力する。 | Admin/Card/CardCsvController.php:143 |  |
| Admin | POST | /%eccube_admin_route%/card/generate_list | admin_card_generate_list | カード名リスト生成実行 (Ajax専用) | Admin/Card/CardController.php:160 |  |
| Admin | POST | /%eccube_admin_route%/card/import | admin_card_csv_import | アップロードされたカード CSV を検証し取り込む。 | Admin/Card/CardCsvController.php:73 |  |
| Admin | POST | /%eccube_admin_route%/card/new | admin_card_new | カード新規登録画面. | Admin/Card/CardController.php:192 |  |
| Admin | POST | /%eccube_admin_route%/card/search/{page_no} | admin_card_search | カード一覧・検索画面. | Admin/Card/CardController.php:65 |  |
| Admin | DELETE | /%eccube_admin_route%/card/{id}/delete | admin_card_delete | カード削除. | Admin/Card/CardController.php:269 |  |
| Admin | GET | /%eccube_admin_route%/card/{id}/edit | admin_card_edit | カード編集画面. | Admin/Card/CardController.php:204 |  |
| Admin | POST | /%eccube_admin_route%/card/{id}/edit | admin_card_edit | カード編集画面. | Admin/Card/CardController.php:204 |  |
| Admin | POST | /%eccube_admin_route%/cardset/download_each_lang | admin_cardset_download_each_lang | カード画像 ZIP（言語別フォルダに全言語分）をダウンロードする。 | Admin/Card/CardsetController.php:252 |  |
| Admin | POST | /%eccube_admin_route%/cardset/new | admin_cardset_new | カードセット新規登録画面. | Admin/Card/CardsetController.php:116 |  |
| Admin | ANY | /%eccube_admin_route%/cardset/page/{page_no} | admin_cardset_list_paged | cardset list paged | Admin/Card/CardsetController.php:50 |  |
| Admin | POST | /%eccube_admin_route%/cardset/{id}/edit | admin_cardset_edit | カードセット編集画面. | Admin/Card/CardsetController.php:148 |  |
| Admin | GET | /%eccube_admin_route%/change_password | admin_change_password | パスワード変更画面 | Admin/AdminController.php:249 |  |
| Admin | POST | /%eccube_admin_route%/change_password | admin_change_password | パスワード変更画面 | Admin/AdminController.php:249 |  |
| Admin | GET | /%eccube_admin_route%/content/branch_toppage | admin_content_branch_toppage | 支店トップページ管理の初期表示 | Admin/Content/BranchTopPageController.php:45 |  |
| Admin | POST | /%eccube_admin_route%/content/branch_toppage/register | admin_content_branch_toppage_register | 支店トップページ管理の登録 | Admin/Content/BranchTopPageController.php:72 |  |
| Admin | POST | /%eccube_admin_route%/content/branch_toppage/select | admin_content_branch_toppage_select | 支店トップページ管理の支店選択 | Admin/Content/BranchTopPageController.php:59 |  |
| Admin | GET | /%eccube_admin_route%/customer/customer_group | admin_customer_group_new | customer group new | Admin/Customer/CustomerGroupController.php:39 |  |
| Admin | POST | /%eccube_admin_route%/customer/customer_group | admin_customer_group_new | customer group new | Admin/Customer/CustomerGroupController.php:39 |  |
| Admin | GET | /%eccube_admin_route%/customer/customer_group/{id} | admin_customer_group | customer group | Admin/Customer/CustomerGroupController.php:40 |  |
| Admin | POST | /%eccube_admin_route%/customer/customer_group/{id} | admin_customer_group | customer group | Admin/Customer/CustomerGroupController.php:40 |  |
| Admin | DELETE | /%eccube_admin_route%/customer/customer_group/{id}/delete | admin_customer_group_delete | customer group delete | Admin/Customer/CustomerGroupController.php:72 |  |
| Admin | POST | /%eccube_admin_route%/customer/delete/pattern/{patternId} | admin_customer_delete_search_pattern | 検索パターン削除 | Admin/Customer/CustomerController.php:382 |  |
| Admin | GET | /%eccube_admin_route%/customer/mail/{id}/history | admin_customer_mail_history | customer mail history | Admin/Customer/CustomerMailController.php:116 |  |
| Admin | POST | /%eccube_admin_route%/customer/page/{page_no} | admin_customer_page | customer page | Admin/Customer/CustomerController.php:70 |  |
| Admin | GET | /%eccube_admin_route%/customer/pattern/{patternId} | admin_customer_search_pattern | 検索パターンでの検索 | Admin/Customer/CustomerController.php:400 |  |
| Admin | POST | /%eccube_admin_route%/customer/pattern/{patternId} | admin_customer_search_pattern | 検索パターンでの検索 | Admin/Customer/CustomerController.php:400 |  |
| Admin | POST | /%eccube_admin_route%/customer/point/{id}/{type} | admin_customer_point_update | customer point update | Admin/Customer/CustomerPointController.php:51 |  |
| Admin | GET | /%eccube_admin_route%/customer/save/pattern | admin_customer_save_search_pattern | 検索パターン保存 | Admin/Customer/CustomerController.php:360 |  |
| Admin | GET | /%eccube_admin_route%/customer/{imageUrl} | admin_identification_image | identification image | Admin/Customer/CustomerEditController.php:269 |  |
| Admin | DELETE | /%eccube_admin_route%/customer/{id}/delete | admin_customer_delete | customer delete | Admin/Customer/CustomerController.php:227 |  |
| Admin | GET | /%eccube_admin_route%/customer/{id}/delivery/new | admin_customer_delivery_new | お届け先編集画面. | Admin/Customer/CustomerDeliveryEditController.php:45 |  |
| Admin | POST | /%eccube_admin_route%/customer/{id}/delivery/new | admin_customer_delivery_new | お届け先編集画面. | Admin/Customer/CustomerDeliveryEditController.php:45 |  |
| Admin | DELETE | /%eccube_admin_route%/customer/{id}/delivery/{did}/delete | admin_customer_delivery_delete | customer delivery delete | Admin/Customer/CustomerDeliveryEditController.php:127 |  |
| Admin | GET | /%eccube_admin_route%/customer/{id}/delivery/{did}/edit | admin_customer_delivery_edit | お届け先編集画面. | Admin/Customer/CustomerDeliveryEditController.php:46 |  |
| Admin | POST | /%eccube_admin_route%/customer/{id}/delivery/{did}/edit | admin_customer_delivery_edit | お届け先編集画面. | Admin/Customer/CustomerDeliveryEditController.php:46 |  |
| Admin | GET | /%eccube_admin_route%/customer/{id}/resend | admin_customer_resend | customer resend | Admin/Customer/CustomerController.php:185 |  |
| Admin | GET | /%eccube_admin_route%/data/buy_discount | admin_data_buy_discount | data buy discount | Admin/Data/BuyDiscountController.php:37 |  |
| Admin | GET | /%eccube_admin_route%/data/buy_price_list | admin_data_buy_price_list | 買取価格対応表一覧 | Admin/Data/BuyPriceListController.php:45 |  |
| Admin | GET | /%eccube_admin_route%/data/buy_price_list/{id}/edit | admin_data_buy_price_list_edit | 買取価格編集 | Admin/Data/BuyPriceListController.php:80 |  |
| Admin | POST | /%eccube_admin_route%/data/buy_price_list/{id}/update | admin_data_buy_price_list_update | 買取価格更新 | Admin/Data/BuyPriceListController.php:97 |  |
| Admin | GET | /%eccube_admin_route%/data/discount | admin_data_discount | data discount | Admin/Data/DiscountController.php:37 |  |
| Admin | GET | /%eccube_admin_route%/data/holiday | admin_data_holiday | data holiday | Admin/Data/HolidayController.php:45 |  |
| Admin | POST | /%eccube_admin_route%/data/holiday | admin_data_holiday | data holiday | Admin/Data/HolidayController.php:45 |  |
| Admin | DELETE | /%eccube_admin_route%/data/holiday/{id}/delete | admin_data_holiday_delete | data holiday delete | Admin/Data/HolidayController.php:136 |  |
| Admin | GET | /%eccube_admin_route%/data/mtg_master_data | admin_data_mtg_master_data | data mtg master data | Admin/Data/MtgMasterDataController.php:333 |  |
| Admin | POST | /%eccube_admin_route%/data/mtg_master_data | admin_data_mtg_master_data | data mtg master data | Admin/Data/MtgMasterDataController.php:333 |  |
| Admin | GET | /%eccube_admin_route%/data/top_banner | admin_data_top_banner | data top banner | Admin/Data/TopBannerController.php:52 |  |
| Admin | POST | /%eccube_admin_route%/data/top_banner | admin_data_top_banner | data top banner | Admin/Data/TopBannerController.php:52 |  |
| Admin | DELETE | /%eccube_admin_route%/data/top_banner/delete | admin_data_top_banner_delete | data top banner delete | Admin/Data/TopBannerController.php:156 |  |
| Admin | GET | /%eccube_admin_route%/data/top_banner/{base_info_digit} | admin_data_top_banner_filter | data top banner filter | Admin/Data/TopBannerController.php:53 |  |
| Admin | POST | /%eccube_admin_route%/data/top_banner/{base_info_digit} | admin_data_top_banner_filter | data top banner filter | Admin/Data/TopBannerController.php:53 |  |
| Admin | DELETE | /%eccube_admin_route%/data/top_banner/{base_info_digit}/delete | admin_data_top_banner_delete_filter | data top banner delete filter | Admin/Data/TopBannerController.php:157 |  |
| Admin | POST | /%eccube_admin_route%/deck | admin_deck_list | deck list | Admin/Deck/DeckController.php:74 |  |
| Admin | GET | /%eccube_admin_route%/deck/archetype_card_image/{id} | admin_deck_archetype_card_image | アーキタイプに紐づく代表カード取得（Ajax）. | Admin/Deck/DeckController.php:653 |  |
| Admin | GET | /%eccube_admin_route%/deck/archetype_tags/{id} | admin_deck_archetype_tags | アーキタイプに紐づくデッキタグ取得（Ajax）. | Admin/Deck/DeckController.php:636 |  |
| Admin | POST | /%eccube_admin_route%/deck/bulk_delete | admin_deck_bulk_delete | デッキ一括削除（個別削除兼用）. | Admin/Deck/DeckController.php:139 |  |
| Admin | POST | /%eccube_admin_route%/deck/csv_export | admin_deck_csv_export | デッキCSV出力. | Admin/Deck/DeckController.php:677 |  |
| Admin | GET | /%eccube_admin_route%/deck/csv_import | admin_deck_csv_import | deck csv import | Admin/Deck/DeckCsvController.php:56 |  |
| Admin | POST | /%eccube_admin_route%/deck/csv_import | admin_deck_csv_import | deck csv import | Admin/Deck/DeckCsvController.php:56 |  |
| Admin | GET | /%eccube_admin_route%/deck/latest_event_deck | admin_latest_event_deck_list | latest event deck list | Admin/Deck/LatestEventDeckController.php:38 |  |
| Admin | POST | /%eccube_admin_route%/deck/latest_event_deck | admin_latest_event_deck_list | latest event deck list | Admin/Deck/LatestEventDeckController.php:38 |  |
| Admin | GET | /%eccube_admin_route%/deck/new | admin_deck_new | デッキ新規登録画面. | Admin/Deck/DeckController.php:247 |  |
| Admin | POST | /%eccube_admin_route%/deck/search_card_image | admin_deck_search_card_image | 代表カード検索（Ajax）. | Admin/Deck/DeckController.php:567 |  |
| Admin | POST | /%eccube_admin_route%/deck/search_event | admin_deck_search_event | イベント検索（Ajax）. | Admin/Deck/DeckController.php:488 |  |
| Admin | POST | /%eccube_admin_route%/deck/search_player | admin_deck_search_player | プレイヤー検索（Ajax）. | Admin/Deck/DeckController.php:442 |  |
| Admin | POST | /%eccube_admin_route%/deck/{id}/delete | admin_deck_delete | デッキ個別削除. | Admin/Deck/DeckController.php:344 |  |
| Admin | GET | /%eccube_admin_route%/deck/{id}/edit | admin_deck_edit | デッキ編集画面. | Admin/Deck/DeckController.php:261 |  |
| Admin | POST | /%eccube_admin_route%/deck/{id}/edit | admin_deck_edit | デッキ編集画面. | Admin/Deck/DeckController.php:261 |  |
| Admin | POST | /%eccube_admin_route%/disable_maintenance/{mode} | admin_disable_maintenance | メンテナンス解除 キャッシュ管理やプラグインのインストール等の操作時にajax経由で解除する | Admin/Content/MaintenanceController.php:82 |  |
| Admin | GET | /%eccube_admin_route%/entry_registration | admin_entry_registration | entry registration | Admin/Event/EntryRegistrationController.php:64 |  |
| Admin | POST | /%eccube_admin_route%/entry_registration | admin_entry_registration | entry registration | Admin/Event/EntryRegistrationController.php:64 |  |
| Admin | GET | /%eccube_admin_route%/entry_registration/new/{eventDetailId} | admin_entry_new | イベント申込新規（GET: フォーム表示、POST: 登録処理） | Admin/Event/EntryRegistrationController.php:137 |  |
| Admin | POST | /%eccube_admin_route%/entry_registration/new/{eventDetailId} | admin_entry_new | イベント申込新規（GET: フォーム表示、POST: 登録処理） | Admin/Event/EntryRegistrationController.php:137 |  |
| Admin | GET | /%eccube_admin_route%/entry_registration/page/{page_no} | admin_entry_registration_page | entry registration page | Admin/Event/EntryRegistrationController.php:65 |  |
| Admin | POST | /%eccube_admin_route%/entry_registration/page/{page_no} | admin_entry_registration_page | entry registration page | Admin/Event/EntryRegistrationController.php:65 |  |
| Admin | GET | /%eccube_admin_route%/entry_registration/search_player | admin_entry_registration_search_player | 申込登録画面: プレイヤー検索モーダル用 HTML 断片 | Admin/Event/EntryRegistrationController.php:192 |  |
| Admin | GET | /%eccube_admin_route%/event | admin_event_index | event index | Admin/Event/EventController.php:56 |  |
| Admin | POST | /%eccube_admin_route%/event | admin_event_index | event index | Admin/Event/EventController.php:56 |  |
| Admin | GET | /%eccube_admin_route%/event/banner | admin_event_banner | バナー一覧・設定画面を表示する。 | Admin/Event/BannerController.php:57 |  |
| Admin | DELETE | /%eccube_admin_route%/event/banner/delete | admin_event_banner_delete | S3 上のバナー画像を削除する（CSRF 検証後）。 | Admin/Event/BannerController.php:121 |  |
| Admin | POST | /%eccube_admin_route%/event/banner/image/upload | admin_event_banner_image_upload | バナー画像を S3 にアップロードする（フォーム送信）。 | Admin/Event/BannerController.php:91 |  |
| Admin | POST | /%eccube_admin_route%/event/banner/settings | admin_event_banner_settings | イベントバナー設定フォームを POST で受け取り、検証成功時は永続化して一覧へリダイレクトする（Post-Redirect-Get）。 検証失敗時は同一画面を再表示する。 | Admin/Event/BannerController.php:71 |  |
| Admin | GET | /%eccube_admin_route%/event/banner/{htmlClass} | admin_event_banner_narrow | バナー一覧・設定画面を表示する。 | Admin/Event/BannerController.php:58 |  |
| Admin | POST | /%eccube_admin_route%/event/banner/{htmlClass}/image/upload | admin_event_banner_image_upload_narrow | バナー画像を S3 にアップロードする（フォーム送信）。 | Admin/Event/BannerController.php:92 |  |
| Admin | POST | /%eccube_admin_route%/event/banner/{htmlClass}/settings | admin_event_banner_settings_narrow | イベントバナー設定フォームを POST で受け取り、検証成功時は永続化して一覧へリダイレクトする（Post-Redirect-Get）。 検証失敗時は同一画面を再表示する。 | Admin/Event/BannerController.php:72 |  |
| Admin | GET | /%eccube_admin_route%/event/create | admin_event_create | event create | Admin/Event/EventController.php:154 |  |
| Admin | GET | /%eccube_admin_route%/event/entry | admin_event_entry | event entry | Admin/Event/EntryController.php:93 |  |
| Admin | POST | /%eccube_admin_route%/event/entry | admin_event_entry | event entry | Admin/Event/EntryController.php:93 |  |
| Admin | GET | /%eccube_admin_route%/event/entry/bulk_csv_import | admin_event_entry_bulk_csv_import | event entry bulk csv import | Admin/Event/EventEntryBulkCsvController.php:59 |  |
| Admin | POST | /%eccube_admin_route%/event/entry/bulk_csv_import | admin_event_entry_bulk_csv_import | event entry bulk csv import | Admin/Event/EventEntryBulkCsvController.php:59 |  |
| Admin | GET | /%eccube_admin_route%/event/entry/bulk_csv_template | admin_event_entry_bulk_csv_template | event entry bulk csv template | Admin/Event/EventEntryBulkCsvController.php:156 |  |
| Admin | POST | /%eccube_admin_route%/event/entry/bulk_update | admin_event_entry_bulk_update | イベント申込詳細・編集（GET: 表示、POST: 更新） | Admin/Event/EntryController.php:300 |  |
| Admin | GET | /%eccube_admin_route%/event/entry/csv | admin_event_entry_csv_export | イベント申込一覧: 検索条件に一致する申込を CSV 出力（一覧のソート・検索条件と同一）. | Admin/Event/EntryController.php:340 |  |
| Admin | GET | /%eccube_admin_route%/event/entry/decklist | admin_event_entry_decklist | イベント申込一覧: 検索条件に一致するデッキを印刷用一覧表示 | Admin/Event/EntryController.php:503 |  |
| Admin | GET | /%eccube_admin_route%/event/entry/event_detail/{event_detail_id} | admin_event_entry_event_detail | event entry event detail | Admin/Event/EntryController.php:95 |  |
| Admin | GET | /%eccube_admin_route%/event/entry/page/{page_no} | admin_event_entry_page | event entry page | Admin/Event/EntryController.php:94 |  |
| Admin | POST | /%eccube_admin_route%/event/entry/page/{page_no} | admin_event_entry_page | event entry page | Admin/Event/EntryController.php:94 |  |
| Admin | GET | /%eccube_admin_route%/event/entry/search_event | admin_entry_event_html | イベント申込一覧: イベント情報検索モーダル用 | Admin/Event/EntryController.php:379 |  |
| Admin | GET | /%eccube_admin_route%/event/entry/search_event/page/{page_no} | admin_entry_event_html_page | イベント申込一覧: イベント情報検索モーダル用 | Admin/Event/EntryController.php:380 |  |
| Admin | POST | /%eccube_admin_route%/event/entry/search_event/set | admin_entry_search_event_by_id | イベント申込一覧モーダル「決定」: サーバーでイベントを解決し JSON でフォーム用データを返す | Admin/Event/EntryController.php:454 |  |
| Admin | GET | /%eccube_admin_route%/event/entry/{eventEntry}/edit | admin_event_entry_edit | イベント申込詳細・編集（GET: 表示、POST: 更新） | Admin/Event/EntryController.php:249 |  |
| Admin | POST | /%eccube_admin_route%/event/entry/{eventEntry}/edit | admin_event_entry_edit | イベント申込詳細・編集（GET: 表示、POST: 更新） | Admin/Event/EntryController.php:249 |  |
| Admin | POST | /%eccube_admin_route%/event/page/{page_no} | admin_event_index_page | event index page | Admin/Event/EventController.php:57 |  |
| Admin | GET | /%eccube_admin_route%/event/{id}/copy | admin_event_copy | event copy | Admin/Event/EventController.php:195 |  |
| Admin | POST | /%eccube_admin_route%/event/{id}/edit | admin_event_edit | event edit | Admin/Event/EventController.php:194 |  |
| Admin | GET | /%eccube_admin_route%/event/{eventId}/repeatSchedule/create | admin_repeat_schedule_create | repeat schedule create | Admin/Event/RepeatScheduleController.php:39 |  |
| Admin | POST | /%eccube_admin_route%/event/{eventId}/repeatSchedule/create | admin_repeat_schedule_create | repeat schedule create | Admin/Event/RepeatScheduleController.php:39 |  |
| Admin | POST | /%eccube_admin_route%/event/{eventId}/schedule/bulk_delete | admin_schedule_bulk_delete | スケジュール一括削除 | Admin/Event/ScheduleController.php:169 |  |
| Admin | GET | /%eccube_admin_route%/event/{eventId}/schedule/create | admin_schedule_create | スケジュール新規登録（GET: フォーム表示、POST: 登録処理） | Admin/Event/ScheduleController.php:45 |  |
| Admin | DELETE | /%eccube_admin_route%/event/{eventId}/schedule/{eventDetailId}/delete | admin_schedule_delete | スケジュール削除（デッキ登録・申込がある場合は削除不可） | Admin/Event/ScheduleController.php:129 |  |
| Admin | GET | /%eccube_admin_route%/event/{eventId}/schedule/{eventDetailId}/edit | admin_schedule_edit | スケジュール編集（GET: フォーム表示、POST: 更新処理） | Admin/Event/ScheduleController.php:87 |  |
| Admin | POST | /%eccube_admin_route%/event/{eventId}/schedule/{eventDetailId}/edit | admin_schedule_edit | スケジュール編集（GET: フォーム表示、POST: 更新処理） | Admin/Event/ScheduleController.php:87 |  |
| Admin | POST | /%eccube_admin_route%/format/new | admin_format_new | フォーマット登録画面. | Admin/Card/FormatController.php:54 |  |
| Admin | POST | /%eccube_admin_route%/format/{id}/edit | admin_format_edit | フォーマット編集画面. | Admin/Card/FormatController.php:88 |  |
| Admin | GET | /%eccube_admin_route%/mall/mail | admin_mall_mail | モール側で設定するメールテンプレート設定画面のcontroller | Admin/Mall/MallMailController.php:74 |  |
| Admin | POST | /%eccube_admin_route%/mall/mail | admin_mall_mail | モール側で設定するメールテンプレート設定画面のcontroller | Admin/Mall/MallMailController.php:74 |  |
| Admin | GET | /%eccube_admin_route%/mall/mail/preview | admin_mall_mail_preview | mall mail preview | Admin/Mall/MallMailController.php:46 |  |
| Admin | POST | /%eccube_admin_route%/mall/mail/preview | admin_mall_mail_preview | mall mail preview | Admin/Mall/MallMailController.php:46 |  |
| Admin | GET | /%eccube_admin_route%/mall/mail/{Mail} | admin_mall_mail_edit | モール側で設定するメールテンプレート設定画面のcontroller | Admin/Mall/MallMailController.php:75 |  |
| Admin | POST | /%eccube_admin_route%/mall/mail/{Mail} | admin_mall_mail_edit | モール側で設定するメールテンプレート設定画面のcontroller | Admin/Mall/MallMailController.php:75 |  |
| Admin | DELETE | /%eccube_admin_route%/mall/mail/{Mail}/delete | admin_mall_mail_delete | メールテンプレートの削除 | Admin/Mall/MallMailController.php:246 |  |
| Admin | GET | /%eccube_admin_route%/mall/tenant/create | admin_mall_tenant_create | テナント登録・編集画面 | Admin/Mall/TenantController.php:208 |  |
| Admin | POST | /%eccube_admin_route%/mall/tenant/create | admin_mall_tenant_create | テナント登録・編集画面 | Admin/Mall/TenantController.php:208 |  |
| Admin | POST | /%eccube_admin_route%/mall/tenant/detail/{id} | admin_mall_tenant_detail | テナント登録・編集画面 | Admin/Mall/TenantController.php:209 |  |
| Admin | GET | /%eccube_admin_route%/mall/tenant/image/load | admin_mall_tenant_image_load | アップロード画像を取得する際にコールされるメソッド. | Admin/Mall/TenantController.php:401 |  |
| Admin | POST | /%eccube_admin_route%/mall/tenant/image/process | admin_mall_tenant_image_process | 画像アップロード時にリクエストされるメソッド. | Admin/Mall/TenantController.php:346 |  |
| Admin | DELETE | /%eccube_admin_route%/mall/tenant/image/revert | admin_mall_tenant_image_revert | アップロード画像をすぐ削除する際にコールされるメソッド. | Admin/Mall/TenantController.php:477 |  |
| Admin | POST | /%eccube_admin_route%/mall/tenant/page/{page_no} | admin_mall_tenant_index_page | テナント一覧画面 | Admin/Mall/TenantController.php:81 |  |
| Admin | POST | /%eccube_admin_route%/order/bulk_delete | admin_order_bulk_delete | 受注複数一括削除 | Admin/Order/OrderController.php:349 |  |
| Admin | GET | /%eccube_admin_route%/order/csv_template | admin_shipping_csv_template | アップロード用CSV雛形ファイルダウンロード | Admin/Order/CsvImportController.php:189 |  |
| Admin | GET | /%eccube_admin_route%/order/export/pdf | admin_order_export_pdf | order export pdf | Admin/Order/OrderController.php:615 |  |
| Admin | POST | /%eccube_admin_route%/order/export/pdf | admin_order_export_pdf | order export pdf | Admin/Order/OrderController.php:615 |  |
| Admin | POST | /%eccube_admin_route%/order/export/pdf/download | admin_order_pdf_download | order pdf download | Admin/Order/OrderController.php:658 |  |
| Admin | GET | /%eccube_admin_route%/order/manual_mail | admin_order_manual_mail | 手動メール通知（一件分） | Admin/Order/MailController.php:218 |  |
| Admin | GET | /%eccube_admin_route%/order/manual_mail/{orderId}/{templateId} | admin_order_manual_mail_edit | 手動メール通知（一件分） | Admin/Order/MailController.php:219 |  |
| Admin | POST | /%eccube_admin_route%/order/manual_mail/{orderId}/{templateId} | admin_order_manual_mail_edit | 手動メール通知（一件分） | Admin/Order/MailController.php:219 |  |
| Admin | GET | /%eccube_admin_route%/order/print/delivery_slips/{lang} | admin_delivery_slips_export | 受注情報 納品書一括印刷 | Admin/Order/OrderController.php:731 |  |
| Admin | GET | /%eccube_admin_route%/order/search/customer/html | admin_order_search_customer_html | 顧客情報を検索する. | Admin/Order/EditController.php:1081 |  |
| Admin | POST | /%eccube_admin_route%/order/search/customer/html/page/{page_no} | admin_order_search_customer_html_page | 顧客情報を検索する. | Admin/Order/EditController.php:1082 |  |
| Admin | POST | /%eccube_admin_route%/order/search/pattern/{pattern_id} | admin_order_search_pattern | 検索パターンによる受注一覧画面. - 1ページ目の表示のみ処理し、2ページ目以降は通常のOrderControllerのindexメソッドで処理される. | Admin/Order/SearchOrderController.php:52 |  |
| Admin | GET | /%eccube_admin_route%/order/shipping_csv_upload | admin_shipping_csv_import | 出荷CSVアップロード | Admin/Order/CsvImportController.php:42 |  |
| Admin | POST | /%eccube_admin_route%/order/shipping_csv_upload | admin_shipping_csv_import | 出荷CSVアップロード | Admin/Order/CsvImportController.php:42 |  |
| Admin | POST | /%eccube_admin_route%/order/shipping_result_csv/import | admin_shipping_result_csv_upload | 出荷実績CSVアップロード | Admin/Order/OrderCsvController.php:263 |  |
| Admin | DELETE | /%eccube_admin_route%/order/{id}/delete | admin_order_delete | 受注個別削除 | Admin/Order/OrderController.php:288 |  |
| Admin | POST | /%eccube_admin_route%/product/bulk/product-status/{id} | admin_product_bulk_product_status | Bulk public action | Admin/Product/ProductController.php:1422 |  |
| Admin | POST | /%eccube_admin_route%/product/buy_sale_price_history | admin_product_buy_sale_price_history | 買取/販売価格履歴 一覧・検索 GET `/buy sale price history` … 検索フォームのみ（結果なし） | Admin/Product/BuySalePriceHistoryController.php:103 |  |
| Admin | POST | /%eccube_admin_route%/product/buy_sale_price_history/search/{page_no} | admin_product_buy_sale_price_history_search | 買取/販売価格履歴 一覧・検索 GET `/buy sale price history` … 検索フォームのみ（結果なし） | Admin/Product/BuySalePriceHistoryController.php:104 |  |
| Admin | DELETE | /%eccube_admin_route%/product/cardset/{id}/delete | admin_cardset_delete | cardset delete | Admin/Card/CardsetController.php:186 |  |
| Admin | GET | /%eccube_admin_route%/product/category/category_bulk_csv_upload | admin_product_category_bulk_csv_upload | カテゴリ登録CSVアップロード画面 | Admin/Product/Csv/CategoryCsvController.php:72 |  |
| Admin | GET | /%eccube_admin_route%/product/category/csv_template | admin_product_category_bulk_csv_template | カテゴリ登録CSV雛形ダウンロード | Admin/Product/Csv/CategoryCsvController.php:51 |  |
| Admin | POST | /%eccube_admin_route%/product/category/import | admin_product_category_bulk_import | カテゴリ登録CSV取込 | Admin/Product/Csv/CategoryCsvController.php:118 |  |
| Admin | GET | /%eccube_admin_route%/product/class_category/export/{class_name_id} | admin_product_class_category_export | 規格分類CSVの出力. | Admin/Product/ClassCategoryController.php:272 |  |
| Admin | POST | /%eccube_admin_route%/product/class_category/sort_no/move | admin_product_class_category_sort_no_move | product class category sort no move | Admin/Product/ClassCategoryController.php:244 |  |
| Admin | GET | /%eccube_admin_route%/product/class_category/{class_name_id} | admin_product_class_category | product class category | Admin/Product/ClassCategoryController.php:53 |  |
| Admin | POST | /%eccube_admin_route%/product/class_category/{class_name_id} | admin_product_class_category | product class category | Admin/Product/ClassCategoryController.php:53 |  |
| Admin | DELETE | /%eccube_admin_route%/product/class_category/{class_name_id}/{id}/delete | admin_product_class_category_delete | product class category delete | Admin/Product/ClassCategoryController.php:150 |  |
| Admin | GET | /%eccube_admin_route%/product/class_category/{class_name_id}/{id}/edit | admin_product_class_category_edit | product class category edit | Admin/Product/ClassCategoryController.php:54 |  |
| Admin | POST | /%eccube_admin_route%/product/class_category/{class_name_id}/{id}/edit | admin_product_class_category_edit | product class category edit | Admin/Product/ClassCategoryController.php:54 |  |
| Admin | PUT | /%eccube_admin_route%/product/class_category/{class_name_id}/{id}/visibility | admin_product_class_category_visibility | product class category visibility | Admin/Product/ClassCategoryController.php:200 |  |
| Admin | GET | /%eccube_admin_route%/product/class_category_csv_upload | admin_product_class_category_csv_import | 規格分類CSV登録CSVアップロード | Admin/Product/Csv/CsvImportController.php:946 |  |
| Admin | POST | /%eccube_admin_route%/product/class_category_csv_upload | admin_product_class_category_csv_import | 規格分類CSV登録CSVアップロード | Admin/Product/Csv/CsvImportController.php:946 |  |
| Admin | GET | /%eccube_admin_route%/product/class_name | admin_product_class_name | product class name | Admin/Product/ClassNameController.php:51 |  |
| Admin | POST | /%eccube_admin_route%/product/class_name | admin_product_class_name | product class name | Admin/Product/ClassNameController.php:51 |  |
| Admin | GET | /%eccube_admin_route%/product/class_name/export | admin_product_class_name_export | 規格CSVの出力. | Admin/Product/ClassNameController.php:208 |  |
| Admin | POST | /%eccube_admin_route%/product/class_name/sort_no/move | admin_product_class_name_sort_no_move | product class name sort no move | Admin/Product/ClassNameController.php:182 |  |
| Admin | DELETE | /%eccube_admin_route%/product/class_name/{id}/delete | admin_product_class_name_delete | product class name delete | Admin/Product/ClassNameController.php:153 |  |
| Admin | GET | /%eccube_admin_route%/product/class_name/{id}/edit | admin_product_class_name_edit | product class name edit | Admin/Product/ClassNameController.php:52 |  |
| Admin | POST | /%eccube_admin_route%/product/class_name/{id}/edit | admin_product_class_name_edit | product class name edit | Admin/Product/ClassNameController.php:52 |  |
| Admin | GET | /%eccube_admin_route%/product/class_name_csv_upload | admin_product_class_name_csv_import | 規格登録CSVアップロード | Admin/Product/Csv/CsvImportController.php:832 |  |
| Admin | POST | /%eccube_admin_route%/product/class_name_csv_upload | admin_product_class_name_csv_import | 規格登録CSVアップロード | Admin/Product/Csv/CsvImportController.php:832 |  |
| Admin | GET | /%eccube_admin_route%/product/classes/{id}/load | admin_product_classes_load | product classes load | Admin/Product/ProductController.php:345 |  |
| Admin | POST | /%eccube_admin_route%/product/csv_split | admin_product_csv_split | ProductCategory作成 | Admin/Product/Csv/CsvImportController.php:2187 |  |
| Admin | POST | /%eccube_admin_route%/product/csv_split_cleanup | admin_product_csv_split_cleanup | ProductCategory作成 | Admin/Product/Csv/CsvImportController.php:2284 |  |
| Admin | POST | /%eccube_admin_route%/product/csv_split_import | admin_product_csv_split_import | ProductCategory作成 | Admin/Product/Csv/CsvImportController.php:2248 |  |
| Admin | GET | /%eccube_admin_route%/product/csv_template/{type} | admin_product_csv_template | アップロード用CSV雛形ファイルダウンロード | Admin/Product/Csv/CsvImportController.php:1205 |  |
| Admin | GET | /%eccube_admin_route%/product/detail/search/id | admin_product_search_card_detail_by_id | カード詳細IDをもとに結果表示に必要な情報を得る | Admin/Product/ProductController.php:994 |  |
| Admin | POST | /%eccube_admin_route%/product/detail/search/id | admin_product_search_card_detail_by_id | カード詳細IDをもとに結果表示に必要な情報を得る | Admin/Product/ProductController.php:994 |  |
| Admin | GET | /%eccube_admin_route%/product/export | admin_product_export | 商品CSVの出力. | Admin/Product/ProductController.php:1303 |  |
| Admin | DELETE | /%eccube_admin_route%/product/format/{id}/delete | admin_format_delete | format delete | Admin/Card/FormatController.php:130 |  |
| Admin | POST | /%eccube_admin_route%/product/page/{page_no} | admin_product_page | product page | Admin/Product/ProductController.php:123 |  |
| Admin | POST | /%eccube_admin_route%/product/product/class/{id}/clear | admin_product_product_class_clear | 商品規格を初期化する. | Admin/Product/ProductClassController.php:290 |  |
| Admin | DELETE | /%eccube_admin_route%/product/product/class/{id}/delete/{productClassId} | admin_product_product_class_delete | product product class delete | Admin/Product/ProductClassController.php:262 |  |
| Admin | POST | /%eccube_admin_route%/product/product/class/{id}/new | admin_product_product_class_new | product product class new | Admin/Product/ProductClassController.php:102 |  |
| Admin | POST | /%eccube_admin_route%/product/product/class/{id}/store | admin_product_product_class_store | product product class store | Admin/Product/ProductClassController.php:125 |  |
| Admin | POST | /%eccube_admin_route%/product/product/class/{id}/update/{productClassId} | admin_product_product_class_update | product product class update | Admin/Product/ProductClassController.php:199 |  |
| Admin | GET | /%eccube_admin_route%/product/product/image/load | admin_product_image_load | アップロード画像を取得する際にコールされるメソッド. | Admin/Product/ProductController.php:432 |  |
| Admin | POST | /%eccube_admin_route%/product/product/image/process | admin_product_image_process | 画像アップロード時にリクエストされるメソッド. | Admin/Product/ProductController.php:378 |  |
| Admin | DELETE | /%eccube_admin_route%/product/product/image/revert | admin_product_image_revert | アップロード画像をすぐ削除する際にコールされるメソッド. | Admin/Product/ProductController.php:479 |  |
| Admin | POST | /%eccube_admin_route%/product/product/new | admin_product_product_new | product product new | Admin/Product/ProductController.php:504 |  |
| Admin | POST | /%eccube_admin_route%/product/product/{id}/copy | admin_product_product_copy | product product copy | Admin/Product/ProductController.php:1147 |  |
| Admin | DELETE | /%eccube_admin_route%/product/product/{id}/delete | admin_product_product_delete | product product delete | Admin/Product/ProductController.php:1050 |  |
| Admin | POST | /%eccube_admin_route%/product/product/{id}/edit | admin_product_product_edit | product product edit | Admin/Product/ProductController.php:505 |  |
| Admin | POST | /%eccube_admin_route%/product/product_all_csv_custom_export/{csvExtensionId} | admin_product_all_csv_custom_export | カスタムCSVエクスポート | Admin/Product/Csv/ProductCsvController.php:211 |  |
| Admin | GET | /%eccube_admin_route%/product/product_csv_upload | admin_product_csv_import | 商品登録CSVアップロード | Admin/Product/Csv/CsvImportController.php:132 |  |
| Admin | POST | /%eccube_admin_route%/product/product_csv_upload | admin_product_csv_import | 商品登録CSVアップロード | Admin/Product/Csv/CsvImportController.php:132 |  |
| Admin | GET | /%eccube_admin_route%/product/product_standard_price/csv_template | admin_product_product_standard_price_csv_template | 基準価格変更CSV雛形ファイルダウンロード | Admin/Product/Csv/ProductStandardPriceCsvController.php:60 |  |
| Admin | POST | /%eccube_admin_route%/product/product_standard_price/import | admin_product_product_standard_price_import | 基準価格変更CSV取込 | Admin/Product/Csv/ProductStandardPriceCsvController.php:120 |  |
| Admin | GET | /%eccube_admin_route%/product/product_standard_price_csv_upload | admin_product_product_standard_price_csv_upload | 基準価格変更CSVアップロード画面 | Admin/Product/Csv/ProductStandardPriceCsvController.php:77 |  |
| Admin | GET | /%eccube_admin_route%/product/searchCardDetail | admin_product_card_detail_html | カード詳細検索モーダル 検索結果 | Admin/Product/ProductController.php:938 |  |
| Admin | POST | /%eccube_admin_route%/product/searchCardDetail | admin_product_card_detail_html | カード詳細検索モーダル 検索結果 | Admin/Product/ProductController.php:938 |  |
| Admin | POST | /%eccube_admin_route%/product/shelf_number/store/{id} | admin_product_shelf_number_store | 登録・更新処理 | Admin/Product/ShelfNumberController.php:109 |  |
| Admin | GET | /%eccube_admin_route%/product/stock | admin_stock_list | 在庫一覧（検索・ページング表示） | Admin/Stock/StockListController.php:94 |  |
| Admin | POST | /%eccube_admin_route%/product/stock | admin_stock_list | 在庫一覧（検索・ページング表示） | Admin/Stock/StockListController.php:94 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/approval_list | admin_stock_approval_list | 在庫編集承認一覧 検索条件・ページ番号・表示件数はセッションに保持する。 | Admin/Stock/StockApprovalListController.php:77 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/approval_list | admin_stock_approval_list | 在庫編集承認一覧 検索条件・ページ番号・表示件数はセッションに保持する。 | Admin/Stock/StockApprovalListController.php:77 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/approval_list/csv | admin_stock_approval_list_csv | 検索結果に基づく在庫編集承認一覧のCSV出力 | Admin/Stock/StockApprovalListController.php:188 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/approval_list/line_items | admin_stock_approval_list_line_items | 在庫編集承認モーダル内の明細テーブルHTMLを取得する - POST: モーダル表示時の初回リクエストで、選択IDと明細の上限なし総件数をセッションに保持して明細を取得 | Admin/Stock/StockApprovalListController.php:282 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/approval_list/line_items/csv | admin_stock_approval_list_line_items_csv | 在庫編集承認モーダル明細のCSV出力（表示上限を超えた件数を含む全件） | Admin/Stock/StockApprovalListController.php:359 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/approval_list/line_items/page/{page_no} | admin_stock_approval_list_line_items_page | 在庫編集承認モーダル内の明細テーブルHTMLを取得する - POST: モーダル表示時の初回リクエストで、選択IDと明細の上限なし総件数をセッションに保持して明細を取得 | Admin/Stock/StockApprovalListController.php:287 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/approval_list/page/{page_no} | admin_stock_approval_list_page | 在庫編集承認一覧 検索条件・ページ番号・表示件数はセッションに保持する。 | Admin/Stock/StockApprovalListController.php:78 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/approval_list/page/{page_no} | admin_stock_approval_list_page | 在庫編集承認一覧 検索条件・ページ番号・表示件数はセッションに保持する。 | Admin/Stock/StockApprovalListController.php:78 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/approval_list/page/{page_no}/count/{page_count} | admin_stock_approval_list_page_count | 在庫編集承認一覧 検索条件・ページ番号・表示件数はセッションに保持する。 | Admin/Stock/StockApprovalListController.php:79 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/approval_list/page/{page_no}/count/{page_count} | admin_stock_approval_list_page_count | 在庫編集承認一覧 検索条件・ページ番号・表示件数はセッションに保持する。 | Admin/Stock/StockApprovalListController.php:79 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/approval_list/updated | admin_stock_approval_list_update | 一括却下・一括承認 | Admin/Stock/StockApprovalListController.php:227 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/barcode_replacement_list | admin_stock_barcode_replacement_list | バーコード貼替リスト画面 | Admin/Stock/BarcodeReplacementListController.php:40 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/barcode_replacement_list/csv_export | admin_stock_barcode_replacement_list_csv_export | バーコード貼替リストCSV出力 | Admin/Stock/BarcodeReplacementListController.php:58 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/bulk-edit-dispatch | admin_stock_list_bulk_edit_dispatch | 在庫一括編集: 一覧からの POST を受け、在庫一括編集画面へリダイレクトする。 | Admin/Stock/StockListController.php:430 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/change/csv-template | admin_stock_change_csv_template | 在庫変更CSV雛形ダウンロード | Admin/Stock/StockChangeCsvController.php:431 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/change/members | admin_stock_change_csv_members | 店舗IDに紐づく承認通知先メンバー一覧を返す | Admin/Stock/StockChangeCsvController.php:396 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/change/new | admin_stock_change_csv_list | 在庫変更CSV登録 画面表示 | Admin/Stock/StockChangeCsvController.php:99 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/change/new | admin_stock_change_csv_list | 在庫変更CSV登録 画面表示 | Admin/Stock/StockChangeCsvController.php:99 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/change/new/page/{page_no} | admin_stock_change_csv_page | 在庫変更CSV登録 画面表示 | Admin/Stock/StockChangeCsvController.php:100 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/change/new/page/{page_no} | admin_stock_change_csv_page | 在庫変更CSV登録 画面表示 | Admin/Stock/StockChangeCsvController.php:100 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/change/new/page/{page_no}/count/{page_count} | admin_stock_change_csv_page_count | 在庫変更CSV登録 画面表示 | Admin/Stock/StockChangeCsvController.php:101 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/change/new/page/{page_no}/count/{page_count} | admin_stock_change_csv_page_count | 在庫変更CSV登録 画面表示 | Admin/Stock/StockChangeCsvController.php:101 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/change/pre-validate | admin_stock_change_csv_pre_validate | CSVの事前検証（在庫上限・減算ゼロ以下チェック）をAJAXで行う。 クライアントサイドのフォーマットチェック通過後に呼び出される。 | Admin/Stock/StockChangeCsvController.php:326 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/change/upload | admin_stock_change_csv_upload | 在庫変更CSV登録アップロード | Admin/Stock/StockChangeCsvController.php:148 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/csv | admin_stock_list_csv | 在庫一覧CSV出力: セッションの検索条件で全件をCSV出力する。 | Admin/Stock/StockListController.php:213 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/custom-csv/{csvExtensionId} | admin_stock_list_custom_csv | 在庫情報カスタムCSV出力（M04-01） | Admin/Stock/StockListController.php:270 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/delete-pattern/{patternId} | admin_stock_list_delete_pattern | 検索パターン削除 | Admin/Stock/StockListController.php:352 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/history | admin_stock_history | 在庫履歴検索/一覧 画面表示 | Admin/Stock/StockHistoryController.php:64 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/history | admin_stock_history | 在庫履歴検索/一覧 画面表示 | Admin/Stock/StockHistoryController.php:64 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/history/csv_export | admin_stock_history_csv_export | 在庫履歴CSV出力 | Admin/Stock/StockHistoryController.php:269 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/history/disposal/csv_export | admin_stock_history_disposal_csv_export | 欠品履歴CSV出力 | Admin/Stock/StockHistoryController.php:318 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/history/page/{page_no} | admin_stock_history_page | 在庫履歴検索/一覧 画面表示 | Admin/Stock/StockHistoryController.php:65 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/history/page/{page_no} | admin_stock_history_page | 在庫履歴検索/一覧 画面表示 | Admin/Stock/StockHistoryController.php:65 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/history/page/{page_no}/count/{page_count} | admin_stock_history_page_count | 在庫履歴検索/一覧 画面表示 | Admin/Stock/StockHistoryController.php:66 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/history/page/{page_no}/count/{page_count} | admin_stock_history_page_count | 在庫履歴検索/一覧 画面表示 | Admin/Stock/StockHistoryController.php:66 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/history/updated | admin_stock_history_update | 欠品理由の編集 | Admin/Stock/StockHistoryController.php:225 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/join/new | admin_stock_join_new_redirect | 在庫IDを指定して結合新規画面へリダイレクト（一覧の「結合新規を開く」用） | Admin/Stock/StockSplitJoinController.php:509 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/join/new-source-csv-template | admin_stock_join_new_source_csv_template | 結合元商品CSV雛形（新規・編集モーダル共通・2列） | Admin/Stock/StockJoinController.php:797 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/resolve-new-source-location | admin_stock_join_resolve_new_source_location | stock join resolve new source location | Admin/Stock/StockJoinController.php:691 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/save-new-source-quantities | admin_stock_join_save_new_source_quantities | stock join save new source quantities | Admin/Stock/StockJoinController.php:636 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/update-shortage | admin_stock_join_update_shortage | stock join update shortage | Admin/Stock/StockJoinController.php:601 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/update-source-stock | admin_stock_join_update_source_stock | 結合元在庫数一括更新（使用停止：NEWステータスの結合元はSessionで管理） | Admin/Stock/StockJoinController.php:1014 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/update-source-stock-location | admin_stock_join_update_source_stock_location | 結合元の在庫区分変更（Ajax） NEWステータスの場合は Session を更新してページリロードを促す。 | Admin/Stock/StockJoinController.php:1090 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/join/{id}/approval | admin_stock_join_approval | stock join approval | Admin/Stock/StockJoinController.php:188 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/{id}/approval | admin_stock_join_approval | stock join approval | Admin/Stock/StockJoinController.php:188 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/join/{id}/edit | admin_stock_join_edit | stock join edit | Admin/Stock/StockJoinController.php:225 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/{id}/edit | admin_stock_join_edit | stock join edit | Admin/Stock/StockJoinController.php:225 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/{id}/edit-source-csv-upload | admin_stock_join_edit_source_csv_upload | 結合元商品CSV（編集画面・2列で明細全置換） CSVインポートは即時DB登録（Sessionを経由しない）。 | Admin/Stock/StockJoinController.php:872 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/{id}/registration-memo | admin_stock_join_update_registration_memo | 結合登録メモのみ保存（全ステータスで可能） | Admin/Stock/StockJoinController.php:513 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/join/{id}/shortage-csv-export | admin_stock_join_shortage_csv_export | 結合元商品CSV（編集画面・2列で明細全置換） CSVインポートは即時DB登録（Sessionを経由しない）。 | Admin/Stock/StockJoinController.php:923 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/{id}/shortage-csv-import | admin_stock_join_shortage_csv_import | 結合元商品CSV（編集画面・2列で明細全置換） CSVインポートは即時DB登録（Sessionを経由しない）。 | Admin/Stock/StockJoinController.php:939 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/join/{id}/shortage-entry | admin_stock_join_shortage_entry | stock join shortage entry | Admin/Stock/StockJoinController.php:552 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/{id}/shortage-entry | admin_stock_join_shortage_entry | stock join shortage entry | Admin/Stock/StockJoinController.php:552 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/join/{id}/source/{sourceId}/update-quantity | admin_stock_join_update_source_quantity | 結合元在庫数1行 Session 更新（Ajax） sourceId は product stock id として扱う（NEWステータス専用） | Admin/Stock/StockJoinController.php:1055 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move-instruction | admin_stock_move_instruction_list | 在庫移動指示一覧（検索・全件表示） | Admin/Stock/StockMoveInstructionController.php:66 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move-instruction | admin_stock_move_instruction_list | 在庫移動指示一覧（検索・全件表示） | Admin/Stock/StockMoveInstructionController.php:66 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move-instruction/csv-template | admin_stock_move_instruction_csv_download_record | 在庫移動実績入力用CSV雛形ダウンロード | Admin/Stock/StockMoveInstructionController.php:334 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move-instruction/csv-tracking | admin_stock_move_instruction_csv_tracking | 在庫移動実績CSV登録（送り状No.一括登録） | Admin/Stock/StockMoveInstructionController.php:368 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move-instruction/labels | admin_stock_move_instruction_labels_export | 送り状CSV出力 | Admin/Stock/StockMoveInstructionController.php:317 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move-instruction/page/{page_no} | admin_stock_move_instruction_list_page | 在庫移動指示一覧（検索・全件表示） | Admin/Stock/StockMoveInstructionController.php:67 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move-instruction/{id} | admin_stock_move_instruction_detail | 在庫移動指示詳細（表示・送り状No・備考の編集） | Admin/Stock/StockMoveInstructionController.php:161 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move-instruction/{id} | admin_stock_move_instruction_detail | 在庫移動指示詳細（表示・送り状No・備考の編集） | Admin/Stock/StockMoveInstructionController.php:161 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move-instruction/{id}/delete | admin_stock_move_instruction_delete | 在庫移動指示削除（送り状No登録後は削除不可） | Admin/Stock/StockMoveInstructionController.php:259 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move-instruction/{id}/tracking | admin_stock_move_instruction_register_tracking | 送り状No.登録（一覧画面からモーダルで登録） | Admin/Stock/StockMoveInstructionController.php:228 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move/inbound_approval/{id} | admin_stock_move_inbound_approval | 入庫承認画面 | Admin/Stock/StockMoveController.php:785 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move/inbound_approval/{id}/submit | admin_stock_move_inbound_approval_submit | 入庫承認画面の送信（再確認 or 承認を mode で分岐） | Admin/Stock/StockMoveController.php:822 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move/inbound_approval_request/{id} | admin_stock_move_inbound_approval_request | 入庫承認申請画面 | Admin/Stock/StockMoveController.php:584 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move/inbound_approval_request/{id}/csv-export | admin_stock_move_inbound_approval_request_csv_export | 入庫承認申請画面の在庫移動CSV出力 | Admin/Stock/StockMoveController.php:633 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move/inbound_approval_request/{id}/differential-csv-import | admin_stock_move_inbound_approval_request_differential_csv_import | 入庫承認申請画面の在庫移動CSV出力 | Admin/Stock/StockMoveController.php:639 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move/inbound_approval_request/{id}/update | admin_stock_move_inbound_approval_request_update | 入庫承認申請のデータ更新処理 | Admin/Stock/StockMoveController.php:701 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move/new | admin_stock_move_new | stock move new | Admin/Stock/StockMoveController.php:143 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move/new | admin_stock_move_new | stock move new | Admin/Stock/StockMoveController.php:143 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move/outbound_approval/{id} | admin_stock_move_outbound_approval | 出庫承認画面 | Admin/Stock/StockMoveController.php:455 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move/outbound_approval/{id}/submit | admin_stock_move_outbound_approval_submit | 出庫承認画面の送信（却下 or 承認を mode で分岐） | Admin/Stock/StockMoveController.php:493 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move/outbound_approval_request/{id} | admin_stock_move_outbound_approval_request | ピック・出庫承認申請画面 | Admin/Stock/StockMoveController.php:258 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move/outbound_approval_request/{id}/csv-export | admin_stock_move_outbound_approval_request_csv_export | ピック・出庫承認申請画面の在庫移動CSV出力 | Admin/Stock/StockMoveController.php:388 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move/outbound_approval_request/{id}/shortage-csv-import | admin_stock_move_shortage_csv_import | ピック・出庫承認申請画面の在庫移動CSV出力 | Admin/Stock/StockMoveController.php:394 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move/outbound_approval_request/{id}/update | admin_stock_move_outbound_approval_request_update | ピック・出庫承認申請のデータ更新処理 | Admin/Stock/StockMoveController.php:304 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move/store | admin_stock_move_store | stock move store | Admin/Stock/StockMoveController.php:186 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move/{id} | admin_stock_move | 入庫完了画面 | Admin/Stock/StockMoveController.php:898 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move_transfer | admin_stock_move_transfer | 在庫移動・振替一覧 | Admin/Stock/StockMoveTransferController.php:104 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move_transfer | admin_stock_move_transfer | 在庫移動・振替一覧 | Admin/Stock/StockMoveTransferController.php:104 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move_transfer/create_instruction | admin_stock_move_transfer_create_instruction | 移動指示作成 チェックした移動を対象に在庫移動指示を作成し、在庫移動指示一覧へ遷移する | Admin/Stock/StockMoveTransferController.php:529 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move_transfer/csv_export | admin_stock_move_transfer_csv_export | 検索結果に基づく在庫移動振替一覧のCSV出力 | Admin/Stock/StockMoveTransferController.php:410 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move_transfer/move_csv_import | admin_stock_move_transfer_move_csv_import | 在庫移動CSV登録 | Admin/Stock/StockMoveTransferController.php:222 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move_transfer/move_csv_template | admin_stock_move_transfer_move_csv_template | 在庫移動CSV雛形ダウンロード | Admin/Stock/StockMoveTransferController.php:583 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move_transfer/page/{page_no} | admin_stock_move_transfer_page | 在庫移動・振替一覧 | Admin/Stock/StockMoveTransferController.php:105 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move_transfer/return_list_csv_export | admin_stock_move_transfer_return_list_csv_export | 戻しリストCSV出力 | Admin/Stock/StockMoveTransferController.php:434 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move_transfer/return_list_pdf_export | admin_stock_move_transfer_return_list_pdf_export | 戻しリストPDF出力 別ウィンドウで表示するため、JSONレスポンスでHTMLを返す | Admin/Stock/StockMoveTransferController.php:452 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/move_transfer/transfer_csv_import | admin_stock_move_transfer_transfer_csv_import | 在庫振替CSV登録 | Admin/Stock/StockMoveTransferController.php:316 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/move_transfer/transfer_csv_template | admin_stock_move_transfer_transfer_csv_template | 在庫振替CSV雛形ダウンロード | Admin/Stock/StockMoveTransferController.php:607 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/page/{page_no} | admin_stock_list_page | 在庫一覧（検索・ページング表示） | Admin/Stock/StockListController.php:95 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/page/{page_no} | admin_stock_list_page | 在庫一覧（検索・ページング表示） | Admin/Stock/StockListController.php:95 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/page/{page_no}/count/{page_count} | admin_stock_list_page_count | 在庫一覧（検索・ページング表示） | Admin/Stock/StockListController.php:96 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/page/{page_no}/count/{page_count} | admin_stock_list_page_count | 在庫一覧（検索・ページング表示） | Admin/Stock/StockListController.php:96 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/pattern/{patternId} | admin_stock_list_pattern | 検索パターン読み込み・検索実行 | Admin/Stock/StockListController.php:385 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/recommend-csv | admin_stock_list_recommend_csv | 在庫リコメンドCSV出力（M04-16） | Admin/Stock/StockListController.php:243 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/save-pattern | admin_stock_list_save_pattern | 検索パターン保存（base info id を検索フォームの店舗選択から設定し display key='在庫一覧' で保存） | Admin/Stock/StockListController.php:303 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/split-join | admin_stock_split_join_list | 在庫分割結合一覧（検索・一覧表示） | Admin/Stock/StockSplitJoinController.php:90 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split-join | admin_stock_split_join_list | 在庫分割結合一覧（検索・一覧表示） | Admin/Stock/StockSplitJoinController.php:90 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/split-join/approval-members | admin_stock_split_join_approval_members | 店舗IDに紐づく承認権限メンバー一覧を JSON で返す（分割CSV登録モーダル用）。 | Admin/Stock/StockSplitJoinController.php:430 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/split-join/csv-export | admin_stock_split_join_csv_export | stock split join csv export | Admin/Stock/StockSplitJoinController.php:213 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/split-join/join-csv-template | admin_stock_join_csv_template | 在庫分割結合一覧（検索・一覧表示） | Admin/Stock/StockSplitJoinController.php:175 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split-join/list-join-csv-import | admin_stock_split_join_list_join_csv_import | stock split join list join csv import | Admin/Stock/StockSplitJoinController.php:317 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split-join/list-split-csv-import | admin_stock_split_join_list_split_csv_import | stock split join list split csv import | Admin/Stock/StockSplitJoinController.php:225 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/split-join/split-csv-template | admin_stock_split_csv_template | 在庫分割結合一覧（検索・一覧表示） | Admin/Stock/StockSplitJoinController.php:183 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/split-join/{id}/status-snapshot | admin_stock_split_join_status_snapshot | 在庫分割・結合のステータス照会（別タブ・他画面での更新後に画面を再読込するための軽量 GET） | Admin/Stock/StockSplitJoinController.php:74 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/split/destination-csv-template | admin_stock_split_new_destination_csv_template | 在庫分割・分割先 CSV テンプレートダウンロード | Admin/Stock/StockSplitController.php:629 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split/update-destination-stock | admin_stock_split_update_destination_stock | 在庫分割・分割先数量Ajax更新（使用停止：編集画面の分割先は Session で管理） | Admin/Stock/StockSplitController.php:436 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split/update-destination-stock-location | admin_stock_split_update_destination_stock_location | 在庫分割・分割先在庫区分Ajax更新 | Admin/Stock/StockSplitController.php:483 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/split/{id}/approval | admin_stock_split_approval | 在庫分割・承認画面 / 承認・却下処理 | Admin/Stock/StockSplitController.php:336 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split/{id}/approval | admin_stock_split_approval | 在庫分割・承認画面 / 承認・却下処理 | Admin/Stock/StockSplitController.php:336 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split/{id}/destination/{destinationId}/delete | admin_stock_split_delete_destination | 在庫分割・分割先削除処理 | Admin/Stock/StockSplitController.php:517 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split/{id}/destination/{destinationId}/update-quantity | admin_stock_split_update_destination_quantity | 在庫分割・分割先数量1行 Session 更新（Ajax） destinationId は product stock id として扱う | Admin/Stock/StockSplitController.php:446 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/split/{id}/edit | admin_stock_split_edit | 在庫分割・編集画面 / 保存処理 | Admin/Stock/StockSplitController.php:205 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split/{id}/edit | admin_stock_split_edit | 在庫分割・編集画面 / 保存処理 | Admin/Stock/StockSplitController.php:205 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split/{id}/edit-destination-csv-upload | admin_stock_split_edit_destination_csv_upload | 在庫分割・編集画面用 分割先CSV置換アップロード（Ajax JSON レスポンス） | Admin/Stock/StockSplitController.php:587 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/split/{id}/registration-memo | admin_stock_split_update_registration_memo | 在庫分割・登録メモのみ保存（全ステータスで可能） | Admin/Stock/StockSplitController.php:549 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/stock-bulk-approval/new | admin_stock_bulk_approval_new | 検索画面で選択された在庫を一括編集する画面を表示する。 GET/POST ともに productStockIds[] を受け取る。 | Admin/Stock/StockBulkApprovalController.php:52 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/stock-bulk-approval/new | admin_stock_bulk_approval_new | 検索画面で選択された在庫を一括編集する画面を表示する。 GET/POST ともに productStockIds[] を受け取る。 | Admin/Stock/StockBulkApprovalController.php:52 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/stock-bulk-approval/store | admin_stock_bulk_approval_store | stock bulk approval store | Admin/Stock/StockBulkApprovalController.php:89 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/transfer/dest-product-class-info | admin_stock_transfer_dest_product_class_info | 振替先の商品規格情報をJSONで返す（振替先セル表示・振替元との差異表示用） | Admin/Stock/StockTransferController.php:450 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/transfer/new | admin_stock_transfer_new | 在庫振替登録画面（初期表示・基本データ表示） GET または POST の product stock id / productStockIds から在庫を取得し一覧に表示する | Admin/Stock/StockTransferController.php:112 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/transfer/new | admin_stock_transfer_new | 在庫振替登録画面（初期表示・基本データ表示） GET または POST の product stock id / productStockIds から在庫を取得し一覧に表示する | Admin/Stock/StockTransferController.php:112 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/transfer/store | admin_stock_transfer_store | 在庫振替の登録処理 | Admin/Stock/StockTransferController.php:172 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/transfer/{id} | admin_stock_transfer | 在庫振替完了画面（承認済・却下後） | Admin/Stock/StockTransferController.php:253 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/transfer/{id}/approval | admin_stock_transfer_approval | 在庫振替承認待ち画面 | Admin/Stock/StockTransferController.php:286 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/transfer/{id}/approval/submit | admin_stock_transfer_approval_submit | 在庫振替承認待ち画面の送信（却下 or 承認） | Admin/Stock/StockTransferController.php:326 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/join/add-source | admin_stock_join_add_source | stock join add source | Admin/Stock/StockJoinController.php:342 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/join/apply-approval | admin_stock_join_apply_approval | stock join apply approval | Admin/Stock/StockJoinController.php:737 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/join/delete-source/{sourceId} | admin_stock_join_delete_source | stock join delete source | Admin/Stock/StockJoinController.php:409 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/join/move-to-shortage-entry | admin_stock_join_move_to_shortage_entry | stock join move to shortage entry | Admin/Stock/StockJoinController.php:451 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/{productStockId}/join/new | admin_stock_join_new | stock join new | Admin/Stock/StockJoinController.php:88 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/join/new-source-csv-upload | admin_stock_join_new_source_csv_upload | 結合元商品CSV（新規画面・DBには保存せず行データをJSONで返す） | Admin/Stock/StockJoinController.php:826 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/join/register | admin_stock_join_register | stock join register | Admin/Stock/StockJoinController.php:139 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/split/apply-approval | admin_stock_split_apply_approval | 在庫分割・承認申請処理 | Admin/Stock/StockSplitController.php:271 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/split/destination/add | admin_stock_split_add_destination | 在庫分割・分割先追加処理（編集画面からの Ajax POST） | Admin/Stock/StockSplitController.php:368 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/{productStockId}/split/new | admin_stock_split_new | 在庫分割・新規登録画面 / 分割済みステータス表示 | Admin/Stock/StockSplitController.php:78 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/split/new/session-destination | admin_stock_split_new_session_destination | 在庫分割・新規登録画面 分割先セッション操作（save/remove/clear） | Admin/Stock/StockSplitController.php:100 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/split/register | admin_stock_split_register | 在庫分割・新規登録処理 | Admin/Stock/StockSplitController.php:144 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/stock-approval/history-reason/update | admin_stock_approval_history_reason_update | 在庫変動理由の非同期更新処理 | Admin/Stock/StockApprovalController.php:137 |  |
| Admin | GET | /%eccube_admin_route%/product/stock/{productStockId}/stock-approval/new | admin_stock_approval_new | 在庫承認画面 | Admin/Stock/StockApprovalController.php:54 |  |
| Admin | POST | /%eccube_admin_route%/product/stock/{productStockId}/stock-approval/store | admin_stock_approval_store | stock approval store | Admin/Stock/StockApprovalController.php:73 |  |
| Admin | POST | /%eccube_admin_route%/product/tag/store/{id} | admin_product_tag_store | 登録・更新処理 | Admin/Product/TagController.php:104 |  |
| Admin | POST | /%eccube_admin_route%/product/tag_sales_analysis/store/{id} | admin_product_tag_sales_analysis_store | 売上分析タグ登録・更新処理 | Admin/Product/TagSalesAnalysisController.php:93 |  |
| Admin | GET | /%eccube_admin_route%/product/unisearch/feed | admin_product_unisearch_feed | product unisearch feed | Admin/Product/UniSearchFeedController.php:35 |  |
| Admin | POST | /%eccube_admin_route%/product/unisearch/feed | admin_product_unisearch_feed | product unisearch feed | Admin/Product/UniSearchFeedController.php:35 |  |
| Admin | POST | /%eccube_admin_route%/purchase/csv_export_return_list | admin_purchase_csv_export_return_list | 戻しリストCSV出力 | Admin/Purchase/PurchaseController.php:638 |  |
| Admin | DELETE | /%eccube_admin_route%/purchase/detail/{id}/delete | admin_purchase_detail_delete | 選んで買取サプライ品明細削除 | Admin/Purchase/PurchaseController.php:483 |  |
| Admin | POST | /%eccube_admin_route%/purchase/pdf_export_return_list | admin_purchase_pdf_export_return_list | 戻しリストPDF出力 | Admin/Purchase/PurchaseController.php:668 |  |
| Admin | GET | /%eccube_admin_route%/purchase/searchproduct/page/{page_no} | admin_purchase_search_product_page | 買取詳細検索 | Admin/Purchase/PurchaseController.php:255 |  |
| Admin | POST | /%eccube_admin_route%/purchase/searchproduct/page/{page_no} | admin_purchase_search_product_page | 買取詳細検索 | Admin/Purchase/PurchaseController.php:255 |  |
| Admin | DELETE | /%eccube_admin_route%/purchase/{id}/delete | admin_purchase_delete | 買取情報削除 | Admin/Purchase/PurchaseController.php:171 |  |
| Admin | GET | /%eccube_admin_route%/search/product | admin_search_product | search product | Admin/SearchProductController.php:51 |  |
| Admin | GET | /%eccube_admin_route%/setting/shop/calendar/new | admin_setting_shop_calendar_new | カレンダー設定の初期表示・登録 | Admin/Setting/Shop/CalendarController.php:47 |  |
| Admin | POST | /%eccube_admin_route%/setting/shop/delivery/sort_no/move | admin_setting_shop_delivery_sort_no_move | setting shop delivery sort no move | Admin/Setting/Shop/DeliveryController.php:380 |  |
| Admin | GET | /%eccube_admin_route%/setting/shop/delivery/{id}/minimum_delivery_time | admin_setting_shop_delivery_minimum_delivery_time_edit | setting shop delivery minimum delivery time edit | Admin/Setting/Shop/DeliveryController.php:350 |  |
| Admin | POST | /%eccube_admin_route%/setting/shop/delivery/{id}/minimum_delivery_time | admin_setting_shop_delivery_minimum_delivery_time_edit | setting shop delivery minimum delivery time edit | Admin/Setting/Shop/DeliveryController.php:350 |  |
| Admin | PUT | /%eccube_admin_route%/setting/shop/delivery/{id}/visibility | admin_setting_shop_delivery_visibility | setting shop delivery visibility | Admin/Setting/Shop/DeliveryController.php:317 |  |
| Admin | GET | /%eccube_admin_route%/setting/shop/mail | admin_setting_shop_mail | setting shop mail | Admin/Setting/Shop/MailController.php:56 |  |
| Admin | POST | /%eccube_admin_route%/setting/shop/mail | admin_setting_shop_mail | setting shop mail | Admin/Setting/Shop/MailController.php:56 |  |
| Admin | POST | /%eccube_admin_route%/setting/shop/mail/preview | admin_setting_shop_mail_preview | setting shop mail preview | Admin/Setting/Shop/MailController.php:210 |  |
| Admin | GET | /%eccube_admin_route%/setting/shop/mail/{id} | admin_setting_shop_mail_edit | setting shop mail edit | Admin/Setting/Shop/MailController.php:57 |  |
| Admin | POST | /%eccube_admin_route%/setting/shop/mail/{id} | admin_setting_shop_mail_edit | setting shop mail edit | Admin/Setting/Shop/MailController.php:57 |  |
| Admin | DELETE | /%eccube_admin_route%/setting/shop/mail/{id}/delete | admin_setting_shop_mail_delete | setting shop mail delete | Admin/Setting/Shop/MailController.php:233 |  |
| Admin | GET | /%eccube_admin_route%/setting/shop/payment/image/load | admin_payment_image_load | アップロード画像を取得する際にコールされるメソッド. | Admin/Setting/Shop/PaymentController.php:230 |  |
| Admin | POST | /%eccube_admin_route%/setting/shop/payment/image/process | admin_payment_image_process | 画像アップロード時にリクエストされるメソッド. | Admin/Setting/Shop/PaymentController.php:180 |  |
| Admin | DELETE | /%eccube_admin_route%/setting/shop/payment/image/revert | admin_payment_image_revert | アップロード画像をすぐ削除する際にコールされるメソッド. | Admin/Setting/Shop/PaymentController.php:279 |  |
| Admin | POST | /%eccube_admin_route%/setting/shop/payment/sort_no/move | admin_setting_shop_payment_sort_no_move | setting shop payment sort no move | Admin/Setting/Shop/PaymentController.php:355 |  |
| Admin | PUT | /%eccube_admin_route%/setting/shop/payment/{id}/visible | admin_setting_shop_payment_visible | アップロード画像をすぐ削除する際にコールされるメソッド. | Admin/Setting/Shop/PaymentController.php:334 |  |
| Admin | GET | /%eccube_admin_route%/setting/shop/tax/new | admin_setting_shop_tax_new | 税率設定の初期表示・登録 | Admin/Setting/Shop/TaxRuleController.php:52 |  |
| Admin | POST | /%eccube_admin_route%/setting/shop/tax/new | admin_setting_shop_tax_new | 税率設定の初期表示・登録 | Admin/Setting/Shop/TaxRuleController.php:52 |  |
| Admin | GET | /%eccube_admin_route%/setting/system/log | admin_setting_system_log | setting system log | Admin/Setting/System/LogController.php:31 |  |
| Admin | POST | /%eccube_admin_route%/setting/system/log | admin_setting_system_log | setting system log | Admin/Setting/System/LogController.php:31 |  |
| Admin | POST | /%eccube_admin_route%/setting/system/login_history/{page_no} | admin_setting_system_login_history_page | ログイン履歴検索画面を表示する. 左ナビゲーションの選択はGETで遷移する. | Admin/Setting/System/LoginHistoryController.php:48 |  |
| Admin | PUT | /%eccube_admin_route%/setting/system/member | admin_setting_system_member | setting system member | Admin/Setting/System/MemberController.php:58 |  |
| Admin | POST | /%eccube_admin_route%/setting/system/member/{id}/update | admin_setting_system_member_update | setting system member update | Admin/Setting/System/MemberController.php:189 |  |
| Admin | GET | /%eccube_admin_route%/setting/system/permission_access_url | admin_setting_system_permission_access_url | setting system permission access url | Admin/Setting/System/PermissionAccessUrlController.php:45 |  |
| Admin | POST | /%eccube_admin_route%/setting/system/permission_access_url | admin_setting_system_permission_access_url | setting system permission access url | Admin/Setting/System/PermissionAccessUrlController.php:45 |  |
| Admin | POST | /%eccube_admin_route%/setting/system/permission_access_url/delete/{PermissionAccessUrl} | admin_setting_system_permission_access_url_delete | setting system permission access url delete | Admin/Setting/System/PermissionAccessUrlController.php:104 |  |
| Admin | GET | /%eccube_admin_route%/setting/system/security | admin_setting_system_security | setting system security | Admin/Setting/System/SecurityController.php:38 |  |
| Admin | POST | /%eccube_admin_route%/setting/system/security | admin_setting_system_security | setting system security | Admin/Setting/System/SecurityController.php:38 |  |
| Admin | PUT | /%eccube_admin_route%/shipping/notify_mail/{id} | admin_shipping_notify_mail | shipping notify mail | Admin/Order/ShippingController.php:239 |  |
| Admin | GET | /%eccube_admin_route%/shipping/preview_notify_mail/{id} | admin_shipping_preview_notify_mail | shipping preview notify mail | Admin/Order/ShippingController.php:233 |  |
| Admin | GET | /%eccube_admin_route%/standby/labels | admin_labels_export | 送り状CSV出力 | Admin/Order/OrderController.php:757 |  |
| Admin | POST | /%eccube_admin_route%/standby/{id}/edit | admin_shipping_standby_edit | 出荷指示リスト 編集画面 | Admin/Order/ShippingStandbyController.php:152 |  |
| Admin | GET | /%eccube_admin_route%/standby/{id}/print/delivery/{lang} | admin_shipping_standby_print_delivery_slips | 出荷指示リスト 納品書印刷 | Admin/Order/ShippingStandbyController.php:393 |  |
| Admin | DELETE | /%eccube_admin_route%/store/plugin/api/delete/{id}/uninstall | admin_store_plugin_api_uninstall | New ways to remove plugin: using composer command | Admin/Store/OwnerStoreController.php:248 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/api/install | admin_store_plugin_api_install | Api Install plugin by composer connect with package repo | Admin/Store/OwnerStoreController.php:202 |  |
| Admin | GET | /%eccube_admin_route%/store/plugin/api/install/{id}/confirm | admin_store_plugin_install_confirm | Do confirm page | Admin/Store/OwnerStoreController.php:179 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/api/schema_update | admin_store_plugin_api_schema_update | オーナーズブラグインインストール、スキーマ更新 | Admin/Store/OwnerStoreController.php:358 |  |
| Admin | GET | /%eccube_admin_route%/store/plugin/api/search | admin_store_plugin_owners_search | Owner's Store Plugin Installation Screen - Search function | Admin/Store/OwnerStoreController.php:75 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/api/search | admin_store_plugin_owners_search | Owner's Store Plugin Installation Screen - Search function | Admin/Store/OwnerStoreController.php:75 |  |
| Admin | GET | /%eccube_admin_route%/store/plugin/api/search/page/{page_no} | admin_store_plugin_owners_search_page | Owner's Store Plugin Installation Screen - Search function | Admin/Store/OwnerStoreController.php:76 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/api/search/page/{page_no} | admin_store_plugin_owners_search_page | Owner's Store Plugin Installation Screen - Search function | Admin/Store/OwnerStoreController.php:76 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/api/update | admin_store_plugin_api_update | オーナーズブラグインインストール、更新処理 | Admin/Store/OwnerStoreController.php:404 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/api/upgrade | admin_store_plugin_api_upgrade | オーナーズブラグインインストール、アップデート | Admin/Store/OwnerStoreController.php:293 |  |
| Admin | GET | /%eccube_admin_route%/store/plugin/api/upgrade/{id}/confirm | admin_store_plugin_update_confirm | Do confirm update page | Admin/Store/OwnerStoreController.php:441 |  |
| Admin | GET | /%eccube_admin_route%/store/plugin/authentication_setting | admin_store_authentication_setting | 認証キー設定画面 | Admin/Store/PluginController.php:476 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/authentication_setting | admin_store_authentication_setting | 認証キー設定画面 | Admin/Store/PluginController.php:476 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/install | admin_store_plugin_install | プラグインファイルアップロード画面 | Admin/Store/PluginController.php:413 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/{id}/disable | admin_store_plugin_disable | 対象のプラグインを無効にします。 | Admin/Store/PluginController.php:299 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/{id}/enable | admin_store_plugin_enable | 対象のプラグインを有効にします。 | Admin/Store/PluginController.php:222 |  |
| Admin | DELETE | /%eccube_admin_route%/store/plugin/{id}/uninstall | admin_store_plugin_uninstall | 対象のプラグインを削除します。 | Admin/Store/PluginController.php:374 |  |
| Admin | POST | /%eccube_admin_route%/store/plugin/{id}/update | admin_store_plugin_update | インストール済プラグインからのアップデート | Admin/Store/PluginController.php:160 |  |
| Admin | GET | /%eccube_admin_route%/store/template | admin_store_template | テンプレート一覧画面 | Admin/Store/TemplateController.php:48 |  |
| Admin | POST | /%eccube_admin_route%/store/template | admin_store_template | テンプレート一覧画面 | Admin/Store/TemplateController.php:48 |  |
| Admin | GET | /%eccube_admin_route%/store/template/install | admin_store_template_install | テンプレートの追加画面. | Admin/Store/TemplateController.php:188 |  |
| Admin | POST | /%eccube_admin_route%/store/template/install | admin_store_template_install | テンプレートの追加画面. | Admin/Store/TemplateController.php:188 |  |
| Admin | DELETE | /%eccube_admin_route%/store/template/{id}/delete | admin_store_template_delete | テンプレート一覧からのダウンロード | Admin/Store/TemplateController.php:146 |  |
| Admin | GET | /%eccube_admin_route%/store/template/{id}/download | admin_store_template_download | テンプレート一覧からのダウンロード | Admin/Store/TemplateController.php:89 |  |
| Admin | GET | /%eccube_messenger_route%/ | admin_messenger | ダッシュボード（サマリ表示） | Admin/Messenger/DashboardController.php:52 |  |
| Admin | GET | /%eccube_messenger_route%/jobs | admin_messenger_jobs | ジョブ一覧（ページング） | Admin/Messenger/DashboardController.php:70 |  |
| Admin | GET | /%eccube_messenger_route%/jobs/page/{page_no} | admin_messenger_jobs_page | ジョブ一覧（ページング） | Admin/Messenger/DashboardController.php:71 |  |
| Admin | GET | /%eccube_messenger_route%/jobs/{id} | admin_messenger_job_detail | ジョブ詳細 | Admin/Messenger/DashboardController.php:224 |  |
| Admin | GET | /%eccube_messenger_route%/webhooks | admin_messenger_webhooks | Webhook 一覧（ページング） | Admin/Messenger/DashboardController.php:107 |  |
| Admin | GET | /%eccube_messenger_route%/webhooks/page/{page_no} | admin_messenger_webhooks_page | Webhook 一覧（ページング） | Admin/Messenger/DashboardController.php:108 |  |
| Admin | GET | /%eccube_messenger_route%/webhooks/{id} | admin_messenger_webhook_detail | Webhook 詳細 | Admin/Messenger/DashboardController.php:144 |  |
| Front | GET | /{_locale}{_shop}/%eccube_user_data_route%/{route} | user_data | user data | Front/UserDataController.php:41 |  |
| Front | GET | /{_locale}{_shop}/cart/buystep/{cart_key} | cart_buystep | カートをロック状態に設定し、購入確認画面へ遷移する. | Front/CartController.php:375 |  |
| Front | POST | /{_locale}{_shop}/cart/clear | cart_clear | カート一括削除. | Front/CartController.php:106 |  |
| Front | POST | /{_locale}{_shop}/cart/push_receive | cart_push_receive | カートをロック状態に設定し、購入確認画面へ遷移する. | Front/CartController.php:406 |  |
| Front | POST | /{_locale}{_shop}/cart/{operation}/{productClassId} | cart_handle_item | カート明細の加算/減算/削除を行う. - 加算 | Front/CartController.php:276 |  |
| Front | PUT | /{_locale}{_shop}/cart/{operation}/{productClassId} | cart_handle_item | カート明細の加算/減算/削除を行う. - 加算 | Front/CartController.php:276 |  |
| Front | GET | /{_locale}{_shop}/contact/history | contact_history | お問い合わせ履歴一覧. | Front/ContactController.php:202 |  |
| Front | GET | /{_locale}{_shop}/contact/history/{id}/detail | contact_history_detail | お問い合わせ履歴詳細. | Front/ContactController.php:222 |  |
| Front | GET | /{_locale}{_shop}/deck/ | deck_index | deck index | Front/Deck/DeckController.php:75 |  |
| Front | GET | /{_locale}{_shop}/deck/arena/{deckId} | deck_arena | Arena 形式 (JSON) でデッキリスト取得 | Front/Deck/DeckController.php:487 |  |
| Front | GET | /{_locale}{_shop}/deck/bulk/{deckId} | deck_bulk | deck bulk | Front/Deck/DeckController.php:340 |  |
| Front | POST | /{_locale}{_shop}/deck/bulk_check | deck_bulk_check | deck bulk check | Front/Deck/DeckController.php:379 |  |
| Front | GET | /{_locale}{_shop}/deck/download/{deckId} | deck_download | Magic Online 用テキストダウンロード | Front/Deck/DeckController.php:454 |  |
| Front | GET | /{_locale}{_shop}/deck/others/ | deck_others | deck others | Front/Deck/DeckController.php:286 |  |
| Front | GET | /{_locale}{_shop}/deck/result/ | deck_result | 検索結果一覧 | Front/Deck/DeckController.php:247 |  |
| Front | GET | /{_locale}{_shop}/deck/{formatId}/metagame/ | deck_metagame | deck metagame | Front/Deck/DeckController.php:111 |  |
| Front | GET | /{_locale}{_shop}/deck/{oldDeckId}/old/ | deck_old | deck old | Front/Deck/DeckController.php:221 |  |
| Front | GET | /{_locale}{_shop}/deck/{deckId}/show/ | deck_show | deck show | Front/Deck/DeckController.php:179 |  |
| Front | GET | /{_locale}{_shop}/deck/{formatId}/usage_ranking/ | deck_usage_ranking | deck usage ranking | Front/Deck/DeckController.php:139 |  |
| Front | GET | /{_locale}{_shop}/entry/activate/{secret_key}/{qtyInCart} | entry_activate | 会員のアクティベート（本会員化）を行う. | Front/EntryController.php:211 |  |
| Front | GET | /{_locale}{_shop}/events/payment_cancel | event_payment_cancel | event payment cancel | Front/Event/EventEntryController.php:219 |  |
| Front | POST | /{_locale}{_shop}/events/register | event_entry_register | event entry register | Front/Event/EventEntryController.php:146 |  |
| Front | GET | /{_locale}{_shop}/forgot | forgot | パスワードリマインダ. | Front/ForgotController.php:47 |  |
| Front | POST | /{_locale}{_shop}/forgot | forgot | パスワードリマインダ. | Front/ForgotController.php:47 |  |
| Front | GET | /{_locale}{_shop}/forgot/complete | forgot_complete | 再設定URL送信完了画面. | Front/ForgotController.php:126 |  |
| Front | GET | /{_locale}{_shop}/forgot/reset/{reset_key} | forgot_reset | パスワード再発行実行画面. | Front/ForgotController.php:146 |  |
| Front | POST | /{_locale}{_shop}/forgot/reset/{reset_key} | forgot_reset | パスワード再発行実行画面. | Front/ForgotController.php:146 |  |
| Front | GET | /{_locale}{_shop}/goods_api/redirect_goods/{cardId} | goods_api_redirect | カードIDから 対応する 商品詳細ページへ 302 redirect する画面遷移用 Controller。 popup product の href fallback (JS 無効時 / 中クリック | Front/GoodsApiController.php:40 |  |
| Front | GET | /{_locale}{_shop}/guide | help_guide | ご利用ガイド. | Front/HelpController.php:27 |  |
| Front | GET | /{_locale}{_shop}/help/about | help_about | 当サイトについて. | Front/HelpController.php:39 |  |
| Front | GET | /{_locale}{_shop}/help/agreement | help_agreement | 利用規約. | Front/HelpController.php:63 |  |
| Front | GET | /{_locale}{_shop}/help/privacy | help_privacy | プライバシーポリシー. | Front/HelpController.php:51 |  |
| Front | GET | /{_locale}{_shop}/help/tradelaw | help_tradelaw | help tradelaw | Front/TradeLawController.php:34 |  |
| Front | GET | /{_locale}{_shop}/mypage/change_complete | mypage_change_complete | 会員情報編集完了画面. | Front/Mypage/ChangeController.php:193 |  |
| Front | GET | /{_locale}{_shop}/mypage/delivery/new | mypage_delivery_new | お届け先編集画面. | Front/Mypage/DeliveryController.php:76 |  |
| Front | POST | /{_locale}{_shop}/mypage/delivery/new | mypage_delivery_new | お届け先編集画面. | Front/Mypage/DeliveryController.php:76 |  |
| Front | POST | /{_locale}{_shop}/mypage/delivery/new/complete | mypage_delivery_new_complete | mypage delivery new complete | Front/Mypage/DeliveryController.php:169 |  |
| Front | POST | /{_locale}{_shop}/mypage/delivery/{id}/edit/complete | mypage_delivery_edit_complete | mypage delivery edit complete | Front/Mypage/DeliveryController.php:170 |  |
| Front | GET | /{_locale}{_shop}/mypage/event_history | mypage_event_history | mypage event history | Front/Mypage/EventHistoryController.php:39 |  |
| Front | GET | /{_locale}{_shop}/mypage/favorite | mypage_favorite | お気に入り商品を表示する. | Front/Mypage/MypageController.php:292 |  |
| Front | POST | /{_locale}{_shop}/mypage/favorite/cart_add_bulk/{id} | favorite_cart_add_bulk | お気に入り画面からカートに追加. | Front/ProductController.php:1283 |  |
| Front | DELETE | /{_locale}{_shop}/mypage/favorite/{id}/delete/{language_code} | mypage_favorite_delete | お気に入り商品を削除する. | Front/Mypage/MypageController.php:346 |  |
| Front | GET | /{_locale}{_shop}/mypage/history/{order_no} | mypage_history | 購入履歴詳細を表示する. | Front/Mypage/MypageController.php:148 |  |
| Front | GET | /{_locale}{_shop}/mypage/identification | mypage_identification | オンライン本人確認 | Front/Mypage/IdentificationController.php:49 |  |
| Front | POST | /{_locale}{_shop}/mypage/identification/complete | mypage_identification_complete | 撮影完了画面 | Front/Mypage/IdentificationController.php:128 |  |
| Front | POST | /{_locale}{_shop}/mypage/identification/photograph | mypage_identification_photograph | 撮影画面 | Front/Mypage/IdentificationController.php:72 |  |
| Front | POST | /{_locale}{_shop}/mypage/login | mypage_login | ログイン画面. | Front/Mypage/MypageController.php:82 |  |
| Front | PUT | /{_locale}{_shop}/mypage/order/{order_no} | mypage_order | 再購入を行う. | Front/Mypage/MypageController.php:197 |  |
| Front | GET | /{_locale}{_shop}/mypage/point_history/{page_no} | mypage_point_history_page | ポイント履歴を表示する | Front/Mypage/MypageController.php:389 |  |
| Front | GET | /{_locale}{_shop}/mypage/purchase_history/net/{buyOrderId} | mypage_purchase_history_detail_net | マイページ買取履歴詳細（ネット買取） | Front/Mypage/PurchaseHistoryController.php:99 |  |
| Front | GET | /{_locale}{_shop}/mypage/purchase_history/net/{buyOrderId}/bulk | mypage_purchase_history_net_bulk | マイページまとめて買取査定結果 | Front/Mypage/PurchaseHistoryController.php:163 |  |
| Front | POST | /{_locale}{_shop}/mypage/purchase_history/net/{buyOrderId}/confirm | mypage_purchase_history_net_confirm | 査定承諾確定 | Front/Mypage/PurchaseHistoryController.php:127 |  |
| Front | GET | /{_locale}{_shop}/mypage/purchase_history/otc/{otcBuyOrderId} | mypage_purchase_history_detail_otc | マイページ買取履歴詳細（店頭買取） | Front/Mypage/PurchaseHistoryController.php:189 |  |
| Front | GET | /{_locale}{_shop}/mypage/shopping_history_detail/{order_id} | mypage_shopping_history_detail | 購入履歴詳細を表示する. | Front/Mypage/MypageController.php:472 |  |
| Front | GET | /{_locale}{_shop}/mypage/withdraw | mypage_withdraw | 退会画面. | Front/Mypage/WithdrawController.php:58 |  |
| Front | GET | /{_locale}{_shop}/mypage/withdraw | mypage_withdraw_confirm | 退会画面. | Front/Mypage/WithdrawController.php:59 |  |
| Front | POST | /{_locale}{_shop}/mypage/withdraw | mypage_withdraw | 退会画面. | Front/Mypage/WithdrawController.php:58 |  |
| Front | POST | /{_locale}{_shop}/mypage/withdraw | mypage_withdraw_confirm | 退会画面. | Front/Mypage/WithdrawController.php:59 |  |
| Front | GET | /{_locale}{_shop}/mypage/withdraw_complete | mypage_withdraw_complete | 退会完了画面. | Front/Mypage/WithdrawController.php:167 |  |
| Front | POST | /{_locale}{_shop}/notifylist/push_all_receive | push_all_receive | まとめて入荷通知 | Front/Mypage/NotifylistController.php:175 |  |
| Front | POST | /{_locale}{_shop}/notifylist/push_receive | push_receive | 入荷待ち通知変更 | Front/Mypage/NotifylistController.php:93 |  |
| Front | POST | /{_locale}{_shop}/products/add_cart/{id} | product_add_cart | カートに追加. | Front/ProductController.php:757 |  |
| Front | POST | /{_locale}{_shop}/products/add_favorite/{id}/{language_code} | product_add_favorite | お気に入り追加. | Front/ProductController.php:649 |  |
| Front | POST | /{_locale}{_shop}/products/category | product_category | ユニサーチ商品一覧の別エントリ（カテゴリツリー API 等からのリンク用）。 | Front/ProductController.php:1307 |  |
| Front | DELETE | /{_locale}{_shop}/products/remove_favorite/{id}/{language_code} | product_remove_favorite | お気に入り削除. | Front/ProductController.php:711 |  |
| Front | POST | /{_locale}{_shop}/products/search/cart_add_bulk/{id} | product_list_cart_add_bulk | 商品一覧（複数規格表示時）からの一括カート追加（お気に入り {@see addFavoriteCartBulk} と同様）. | Front/ProductController.php:1316 |  |
| Front | GET | /{_locale}{_shop}/products/search/cate/{categoryId} | product_list_category | 商品一覧画面. path を pf-eccube3 に合わせて /products/search に変更している。 | Front/ProductController.php:134 |  |
| Front | GET | /{_locale}{_shop}/products/search/cate/{categoryId}/tag/{tagId} | product_list_category_tag | 商品一覧画面. path を pf-eccube3 に合わせて /products/search に変更している。 | Front/ProductController.php:133 |  |
| Front | GET | /{_locale}{_shop}/products/search/tag/{tagId} | product_list_tag | 商品一覧画面. path を pf-eccube3 に合わせて /products/search に変更している。 | Front/ProductController.php:135 |  |
| Front | GET | /{_locale}{_shop}/products/search/unisearch | product_search_unisearch | ユニサーチからのJSON情報から一時的な商品一覧HTMLの生成 | Front/ProductController.php:1454 |  |
| Front | POST | /{_locale}{_shop}/products/search/unisearch | product_search_unisearch | ユニサーチからのJSON情報から一時的な商品一覧HTMLの生成 | Front/ProductController.php:1454 |  |
| Front | POST | /{_locale}{_shop}/products/search/unisearch/lazy | product_search_unisearch_lazy_load | 商品情報の遅延読込(ユニサーチ情報利用) | Front/ProductController.php:1469 |  |
| Front | GET | /{_locale}{_shop}/products/search/unisearch/query | product_search_unisearch_query | フォームからユニサーチ用クエリ文字列を返す（フロントの changeUnisearchQuery 用） | Front/ProductController.php:1655 |  |
| Front | POST | /{_locale}{_shop}/products/search/unisearch/query | product_search_unisearch_query | フォームからユニサーチ用クエリ文字列を返す（フロントの changeUnisearchQuery 用） | Front/ProductController.php:1655 |  |
| Front | GET | /{_locale}{_shop}/products/search/unisearch_api | product_search_unisearch_api | ユニサーチ検索APIアクセス | Front/ProductController.php:1595 |  |
| Front | POST | /{_locale}{_shop}/products/search/unisearch_api | product_search_unisearch_api | ユニサーチ検索APIアクセス | Front/ProductController.php:1595 |  |
| Front | GET | /{_locale}{_shop}/products/search/unisearch_rword_api | product_search_unisearch_rword_api | 関連ワード API プロキシ | Front/ProductController.php:1610 |  |
| Front | POST | /{_locale}{_shop}/products/search/unisearch_rword_api | product_search_unisearch_rword_api | 関連ワード API プロキシ | Front/ProductController.php:1610 |  |
| Front | GET | /{_locale}{_shop}/products/search/unisuggest_api | product_search_unisuggest_api | ユニサジェスト API プロキシ | Front/ProductController.php:1625 |  |
| Front | POST | /{_locale}{_shop}/products/search/unisuggest_api | product_search_unisuggest_api | ユニサジェスト API プロキシ | Front/ProductController.php:1625 |  |
| Front | GET | /{_locale}{_shop}/products/search/unisuggest_api/delete | product_search_unisuggest_delete_api | ユニサジェスト履歴削除 API プロキシ | Front/ProductController.php:1640 |  |
| Front | POST | /{_locale}{_shop}/products/search/unisuggest_api/delete | product_search_unisuggest_delete_api | ユニサジェスト履歴削除 API プロキシ | Front/ProductController.php:1640 |  |
| Front | POST | /{_locale}{_shop}/purchase/cart | purchase_cart_update | 買取カート更新 | Front/Purchase/PurchaseController.php:992 |  |
| Front | GET | /{_locale}{_shop}/purchase/complete | purchase_complete | 買取依頼完了 | Front/Purchase/PurchaseController.php:346 |  |
| Front | GET | /{_locale}{_shop}/purchase/fill | purchase_fill | 買取依頼入力 | Front/Purchase/PurchaseController.php:185 |  |
| Front | GET | /{_locale}{_shop}/purchase/login | purchase_login | 買取用ログイン マイページのログインtwigを利用する | Front/Purchase/PurchaseController.php:143 |  |
| Front | POST | /{_locale}{_shop}/purchase/products/search/unisearch/lazy | purchase_product_search_unisearch_lazy_load | UniSearch 遅延読込。 | Front/Purchase/PurchaseController.php:628 |  |
| Front | POST | /{_locale}{_shop}/shopping/checkout | shopping_checkout | 注文確定処理（POST `/shopping/checkout`）. `confirm()` から内部呼び出される場合と、確認画面 `Shopping/confirm.twig` から POST され | Front/ShoppingController.php:422 |  |
| Front | GET | /{_locale}{_shop}/shopping/complete | shopping_complete | 購入完了画面を表示する. | Front/ShoppingController.php:629 |  |
| Front | POST | /{_locale}{_shop}/shopping/customer | shopping_customer | お客様情報の変更(非会員) | Front/NonMemberShoppingController.php:113 |  |
| Front | GET | /{_locale}{_shop}/shopping/error | shopping_error | 購入エラー画面. | Front/ShoppingController.php:1025 |  |
| Front | GET | /{_locale}{_shop}/shopping/login | shopping_login | ログイン画面. | Front/ShoppingController.php:984 |  |
| Front | GET | /{_locale}{_shop}/shopping/nonmember | shopping_nonmember | 非会員処理 | Front/NonMemberShoppingController.php:48 |  |
| Front | POST | /{_locale}{_shop}/shopping/nonmember | shopping_nonmember | 非会員処理 | Front/NonMemberShoppingController.php:48 |  |
| Front | POST | /{_locale}{_shop}/shopping/redirect_to | shopping_redirect_to | 他画面への遷移を行う. お届け先編集画面など, 他画面へ遷移する際に, フォームの値をDBに保存してからリダイレクトさせる. | Front/ShoppingController.php:207 |  |
| Front | GET | /{_locale}{_shop}/shopping/shipping/{id} | shopping_shipping | お届け先選択画面. 会員ログイン時, お届け先を選択する画面を表示する | Front/ShoppingController.php:695 |  |
| Front | GET | /{_locale}{_shop}/shopping/shipping_edit/{id} | shopping_shipping_edit | お届け先の新規作成または編集画面. 会員時は新しいお届け先を作成し, 作成したお届け先を選択状態にして注文手続き画面へ遷移する. | Front/ShoppingController.php:775 |  |
| Front | POST | /{_locale}{_shop}/shopping/shipping_edit/{id} | shopping_shipping_edit | お届け先の新規作成または編集画面. 会員時は新しいお届け先を作成し, 作成したお届け先を選択状態にして注文手続き画面へ遷移する. | Front/ShoppingController.php:775 |  |
| Front | POST | /{_locale}{_shop}/shopping/shipping_edit/{id}/complete | shopping_shipping_edit_complete | お届け先登録処理 | Front/ShoppingController.php:864 |  |
| Front | GET | /{_locale}{_shop}/shopping/shipping_multiple | shopping_shipping_multiple | 複数配送処理 | Front/ShippingMultipleController.php:55 |  |
| Front | POST | /{_locale}{_shop}/shopping/shipping_multiple | shopping_shipping_multiple | 複数配送処理 | Front/ShippingMultipleController.php:55 |  |
| Front | GET | /{_locale}{_shop}/shopping/shipping_multiple_edit | shopping_shipping_multiple_edit | 複数配送設定時の新規お届け先の設定 会員ログイン時は会員のお届け先に追加する | Front/ShippingMultipleController.php:333 |  |
| Front | POST | /{_locale}{_shop}/shopping/shipping_multiple_edit | shopping_shipping_multiple_edit | 複数配送設定時の新規お届け先の設定 会員ログイン時は会員のお届け先に追加する | Front/ShippingMultipleController.php:333 |  |
| Front | GET | /{_locale}{_shop}/sitemap.xml | sitemap_xml | Output sitemap index | Front/SitemapController.php:56 |  |
| Front | GET | /{_locale}{_shop}/sitemap_category.xml | sitemap_category_xml | Output sitemap of product categories | Front/SitemapController.php:121 |  |
| Front | GET | /{_locale}{_shop}/sitemap_deck.xml | sitemap_deck_xml | Output sitemap of deck pages | Front/SitemapController.php:216 |  |
| Front | GET | /{_locale}{_shop}/sitemap_deck_show_{page}.xml | sitemap_deck_show_xml | Output sitemap of deck detail pages | Front/SitemapController.php:227 |  |
| Front | GET | /{_locale}{_shop}/sitemap_page.xml | sitemap_page_xml | Output sitemap of pages Output sitemap of pages without 'noindex' in meta robots. | Front/SitemapController.php:164 |  |
| Front | GET | /{_locale}{_shop}/sitemap_product_{page}.xml | sitemap_product_xml | Output sitemap of products Output sitemap of products as status is 1 | Front/SitemapController.php:134 |  |
| Front | GET | /{_locale}{_shop}/sitemap_purchase_{page}.xml | sitemap_purchase_xml | Output sitemap of purchase product detail pages | Front/SitemapController.php:196 |  |
| Front | GET | /{_locale}{_shop}/waiting_api/get_waiting_number/{base_info_id} | get_waiting_number | 店頭注文番号リストの取得 | Front/WaitingNumberController.php:56 |  |
| Front | GET | /{_locale}{_shop}/waiting_number | waiting_number | 注文番号表示画面 | Front/WaitingNumberController.php:42 |  |
| App API | POST | /%eccube_api_v1_route%/admin/buyMainCard.json | api_admin_buy_main_card | 複数ネット買取IDからネット買取受注の商品一覧を取得 | App/MTGBuyer/V1/Admin/BuyMainCardController.php:37 |  |
| App API | PUT | /%eccube_api_v1_route%/admin/buyOrder/{id}.json | api_admin_buy_order_update | ネット買取注文の査定終了処理 このAPIは、他のAPIとは異なりJSON形式のリクエストが前提となる | App/MTGBuyer/V1/Admin/BuyOrderController.php:170 |  |
| App API | PUT | /%eccube_api_v1_route%/admin/buyOrder/{id}/freeComment.json | api_admin_buy_order_update_free_comment | ネット買取受注コメント更新 | App/MTGBuyer/V1/Admin/BuyOrderController.php:93 |  |
| App API | PUT | /%eccube_api_v1_route%/admin/buyOrder/{id}/status.json | api_admin_buy_order_update_status | ネット買取受注ステータス更新 | App/MTGBuyer/V1/Admin/BuyOrderController.php:126 |  |
| App API | POST | /%eccube_api_v1_route%/admin/buyOrderIndivisualInputProduct.json | api_admin_buy_order_indivisual_input_product | 複数ネット買取IDから個別入力商品の一覧を取得 | App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductController.php:37 |  |
| App API | GET | /%eccube_api_v1_route%/admin/buyOrders.json | api_admin_buy_orders_product_arrival | ネット買取受注一覧取得 | App/MTGBuyer/V1/Admin/BuyOrderController.php:59 |  |
| App API | GET | /%eccube_api_v1_route%/admin/fixedPriceSection.json | api_admin_fixed_price_section | 固定価格部門IDの取得 | App/MTGBuyer/V1/Admin/OptionController.php:50 |  |
| App API | POST | /%eccube_api_v1_route%/admin/login.json | api_admin_login | 管理者ログイン認証API login id と password を受け取り、認証成功時にJWTトークンとメンバー情報を返す。 | App/MTGBuyer/V1/Admin/LoginController.php:45 |  |
| App API | GET | /%eccube_api_v1_route%/admin/optionBulkPurchaseId.json | api_admin_option_bulk_purchase_id | まとめて買取商品IDの取得 | App/MTGBuyer/V1/Admin/OptionController.php:35 |  |
| App API | PUT | /%eccube_api_v1_route%/admin/otcBuyOrder/{id}.json | api_admin_otc_buy_order_update | 店頭買取情報更新API このAPIは、他のAPIとは異なりJSON形式のリクエストが前提となる | App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:129 |  |
| App API | PUT | /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/doubleCheckMember.json | api_admin_otc_buy_order_update_double_check_member | ダブルチェック者の更新 | App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:231 |  |
| App API | PUT | /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json | api_admin_otc_buy_order_update_free_comment | フリーコメントの更新 | App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:156 |  |
| App API | PUT | /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json | api_admin_otc_buy_order_update_identification | 身分証明書種別の更新 | App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:273 |  |
| App API | PUT | /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/status.json | api_admin_otc_buy_order_update_status | ステータスの更新 | App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:190 |  |
| App API | GET | /%eccube_api_v1_route%/admin/otcBuyOrders.json | api_admin_otc_buy_orders | 審査未完了の店頭買取受注一覧取得 | App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:69 |  |
| App API | GET | /%eccube_api_v1_route%/admin/sections.json | api_admin_sections | 表示フラグがtrueの部門一覧の取得 | App/MTGBuyer/V1/Admin/SectionController.php:35 |  |
| App API | POST | /%eccube_api_v1_route%/buying/products | api_buying_products | 商品IDのリストから買取用商品情報を取得 | App/MTGBuyer/V1/Admin/BuyingController.php:74 |  |
| App API | GET | /%eccube_api_v1_route%/buying/{cardDetailId}.json | api_buying | カード詳細IDから買取用商品情報を取得 | App/MTGBuyer/V1/Admin/BuyingController.php:48 |  |
| App API | POST | /%eccube_api_v1_route%/search | api_search | カード名から買取用商品情報を取得 | App/MTGBuyer/V1/Admin/BuyingController.php:111 |  |
| App API | GET | /api/archetype/{id} | api_deck_builder_archetype | deck builder archetype | App/DeckBuilder/ArchetypeController.php:61 |  |
| App API | GET | /api/archetypes/{formatId} | api_deck_builder_archetypes | deck builder archetypes | App/DeckBuilder/ArchetypeController.php:38 |  |
| App API | GET | /api/card | api_deck_builder_card_search | deck builder card search | App/DeckBuilder/CardController.php:160 |  |
| App API | GET | /api/cards | api_deck_builder_cards_search | deck builder cards search | App/DeckBuilder/CardController.php:71 |  |
| App API | GET | /api/cards/{id} | api_deck_builder_card | deck builder card | App/DeckBuilder/CardController.php:142 |  |
| App API | GET | /api/categories/tree | api_categories_tree | フロント表示対象のカテゴリについて、ルート直下から全ツリー構造を取得する | App/CategoryController.php:37 |  |
| App API | GET | /api/categories/{id}/tree | api_categories_tree_by_id | 指定したカテゴリ ID をルートとしたツリー構造を取得する（本店想定・支店非表示フラグは見ない） | App/CategoryController.php:61 |  |
| App API | GET | /api/categories/{id}/tree/{branch} | api_categories_tree_by_id_branch | 支店フラグ branch に応じたツリー（true: 支店向け、branch hide flg を除外） | App/CategoryController.php:70 |  |
| App API | POST | /api/deck | api_deck_builder_deck_post | deck builder deck post | App/DeckBuilder/DeckController.php:75 |  |
| App API | POST | /api/deck/import | api_deck_builder_deck_import_post | deck builder deck import post | App/DeckBuilder/DeckController.php:667 |  |
| App API | PUT | /api/deck/import/{id} | api_deck_builder_deck_import_put | deck builder deck import put | App/DeckBuilder/DeckController.php:677 |  |
| App API | GET | /api/deck/usage_analysis/{formatId} | api_deck_builder_usage_analysis | deck builder usage analysis | App/DeckBuilder/DeckController.php:522 |  |
| App API | DELETE | /api/deck/{id} | api_deck_builder_deck_delete | deck builder deck delete | App/DeckBuilder/DeckController.php:177 |  |
| App API | GET | /api/deck/{id} | api_deck_builder_deck_get | deck builder deck get | App/DeckBuilder/DeckController.php:214 |  |
| App API | PUT | /api/deck/{id} | api_deck_builder_deck_update | deck builder deck update | App/DeckBuilder/DeckController.php:124 |  |
| App API | GET | /api/decks | api_deck_builder_decks | deck builder decks | App/DeckBuilder/DeckController.php:262 |  |
| App API | GET | /api/master/{name} | api_deck_builder_master | 各マスタ名ごとに deck-api の JMS\Expose と同等の公開フィールドを列挙する。 | App/DeckBuilder/MasterController.php:77 |  |
| App API | GET | /api/metagame | api_deck_builder_metagame | deck builder metagame | App/DeckBuilder/DeckController.php:556 |  |
| App API | POST | /api/order/prints/direct/{base_info_id} | order_direct_print | サーバダイレクト印刷API | App/OrderController.php:43 |  |
| App API | GET | /api/popup/card/{lang}/{cardId} | popup_product_by_card_id | カードIDからポップアップ用の商品情報を1件取得する | App/ProductController.php:265 |  |
| App API | GET | /api/popup/product/{lang}/{productId} | popup_product_by_product_id | 商品IDからポップアップ用の商品情報を1件取得する | App/ProductController.php:150 |  |
| App API | GET | /api/product/detail/{productId} | product_detail_by_product_id | 商品IDを検索条件として、商品情報を1件取得して返却するAPIエンドポイント | App/ProductController.php:50 |  |
| App API | GET | /api/product/detail/{productId}.json | product_detail_by_product_id_json | 商品IDを検索条件として、商品情報を1件取得して返却するAPIエンドポイント | App/ProductController.php:51 |  |
| App API | GET | /api/recent_event | api_deck_builder_recent_event | deck builder recent event | App/DeckBuilder/DeckController.php:643 |  |
| App API | GET | /api/user | api_deck_builder_user | deck builder user | App/DeckBuilder/UserController.php:43 |  |
| App API | PUT | /api/user | api_deck_builder_user_update | deck builder user update | App/DeckBuilder/UserController.php:78 |  |
| App API | POST | /api/user/login | api_deck_builder_login | deck builder login | App/DeckBuilder/LoginController.php:43 |  |
| App API | POST | /api/user/logout | api_deck_builder_logout | deck builder logout | App/DeckBuilder/LoginController.php:79 |  |
| App API | GET | /article.json | article_by_params | WordPressの投稿IDを検索条件として、記事情報を1件取得して返却するAPIエンドポイント | App/ArticleController.php:45 |  |
| App API | GET | /assets/data/events-dummy{suffix}.json | app_event_schedule | 各 endpoint が返す日付範囲の幅 (= 28 日)。フロント側が ±28 日刻みで隣接するため。 | App/EventScheduleController.php:55 |  |
| App API | GET | /assets/data/events-monthly-{year}-{month}.json | app_event_schedule_monthly | 月別タブ専用の JSON エンドポイント。指定 YYYY-MM の 1 日〜末日のスケジュールを返す。 フロント側 (hareruya-event.js) が 月別カレンダーで `/assets/da | App/EventScheduleController.php:73 |  |
| App API | GET | /assets/data/events.json | app_event_schedule_range | 月別タブ専用の JSON エンドポイント。指定 YYYY-MM の 1 日〜末日のスケジュールを返す。 フロント側 (hareruya-event.js) が 月別カレンダーで `/assets/da | App/EventScheduleController.php:87 |  |
| App API | GET | /assets/data/header-categories.json | app_header_categories_json | ヘッダー 4 段目のカテゴリバーが hover 展開時に取得する JSON エンドポイント。 hareruya-top.js が `/assets/data/header-categories.jso | App/HeaderCategoriesController.php:38 |  |
| App API | GET | /card.json | card_by_params_json | 検索クエリに一致するカード情報を1件取得する | App/CardController.php:42 |  |
| App API | GET | /popup/old/{oldProductId}.json | popup_card_by_old_product_id_json | 旧商品IDからポップアップ用のカード情報を1件取得する（言語指定なし・JP優先） | App/ProductController.php:318 |  |
| App API | GET | /popup/old/{lang}/{oldProductId}.json | popup_product_by_old_product_id_json | 旧商品IDからポップアップ用の商品情報を1件取得する | App/ProductController.php:362 |  |
| App API | GET | /topBanners/{languageCode}.json | top_banners_by_language_code_json | 言語コードを検索条件として、トップバナー情報の一覧を取得して返却するAPIエンドポイント | App/ContentController.php:86 |  |
| App API | GET | /updateProducts/{strFromDate}/{strToDate}.json | updated_product_classes_json | 更新日時が指定期間内の商品規格一覧を返却するAPIエンドポイント | App/ProductController.php:205 |  |
| Smaregi | POST | /%eccube_smaregi_webhook_route% | smaregi_webhook | スマレジ Webhook 受信エンドポイント（検証用） リクエスト内容をログに出力し、200 OK で固定レスポンスを返す。 | Smaregi/WebhookController.php:41 |  |

## Block内部（別枠）

| 区分 | HTTPメソッド | 実装パス | route名 | 機能 | 根拠 | 備考 |
|---|---|---|---|---|---|---|
| Block内部 | GET | /{_locale}{_shop}/block/auto_new_item | block_auto_new_item | block auto new item | Block/AutoNewItemController.php:35 | Block内部描画 |
| Block内部 | GET | /{_locale}{_shop}/block/calendar | block_calendar | block calendar | Block/CalendarController.php:37 | Block内部描画 |
| Block内部 | GET | /{_locale}{_shop}/block/cart | block_cart | ヘッダー右端のカートアイコンと hover popup を描画する (Ajax 更新用)。 SP 側 (block cart sp) は nav sp.twig を返し、PC 側 (block car | Block/CartController.php:41 | Block内部描画 |
| Block内部 | GET | /{_locale}{_shop}/block/cart_sp | block_cart_sp | ヘッダー右端のカートアイコンと hover popup を描画する (Ajax 更新用)。 SP 側 (block cart sp) は nav sp.twig を返し、PC 側 (block car | Block/CartController.php:42 | Block内部描画 |
| Block内部 | GET | /{_locale}{_shop}/block/deck_detailed_search_modal | block_deck_detailed_search_modal | block deck detailed search modal | Block/DeckDetailedSearchModalController.php:43 | Block内部描画 |
| Block内部 | GET | /{_locale}{_shop}/block/event_detailed_search_modal | block_event_detailed_search_modal | イベント検索モーダル | Block/EventDetailedSearchModalController.php:41 | Block内部描画 |
| Block内部 | GET | /{_locale}{_shop}/block/product_recommend | block_product_recommend | block product recommend | Block/ProductRecommendController.php:42 | Block内部描画 |
| Block内部 | GET | /{_locale}{_shop}/block/sale_two_row | block_sale_two_row | block sale two row | Block/SaleTwoRowController.php:42 | Block内部描画 |
| Block内部 | GET | /{_locale}{_shop}/block/search_event | block_search_event | イベント関連ページ (event * route) のヘッダー検索フォームを描画する Block。 商品系 `SearchProductController` の対応物で、 mainRoute が ` | Block/SearchEventController.php:43 | Block内部描画 |
