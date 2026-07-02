# Claude指摘対応 追加監査

Claude Codeの指摘を受け、追補後HTMLに対して改善正規化（`{year}-{month}` 等の埋め込み変数、Frontの `/{_locale}` prefix、`GET, POST` 複合表記、Smaregi設定prefix、ANY）で再照合した。

## サマリ

- controller_routes_all_scoped: 1046
- main_non_options: 1017
- block_non_options: 9
- options: 20
- html_entries: 1955
- html_unique_method_norm: 1486
- missing_after_supplement_improved_norm_front_prefix: 0
- missing_by_section: {}
- implementation_method_path_collisions: 13
- collisions_with_one_or_zero_html_entry: 7
- internal_like_matched_or_supplemented_count: 152

## 追補後も未記載に見えるルート（改善正規化後）

なし。

## 正規化衝突監査

同一 method + 正規化path に複数routeが畳み込まれるケース。利用者視点では同一URLの別名・同一入口として扱えるかの確認対象。
| method | 正規化path | route数 | HTML記載数 | routes | HTMLファイル |
|---|---|---:|---:|---|---|
| GET | `/{}/contact` | 2 | 3 | `contact` (Front/ContactController.php:61)<br>`contact_confirm` (Front/ContactController.php:62) | 0306_基本設計仕様書(フロント_会員).html<br>0307_基本設計仕様書(フロント_イベント).html |
| GET | `/contact` | 2 | 0 | `contact` (Front/ContactController.php:61)<br>`contact_confirm` (Front/ContactController.php:62) |  |
| POST | `/{}/contact` | 2 | 2 | `contact` (Front/ContactController.php:61)<br>`contact_confirm` (Front/ContactController.php:62) | 0306_基本設計仕様書(フロント_会員).html |
| POST | `/contact` | 2 | 0 | `contact` (Front/ContactController.php:61)<br>`contact_confirm` (Front/ContactController.php:62) |  |
| GET | `/{}/entry` | 2 | 2 | `entry` (Front/EntryController.php:75)<br>`entry_confirm` (Front/EntryController.php:76) | 0306_基本設計仕様書(フロント_会員).html |
| GET | `/entry` | 2 | 0 | `entry` (Front/EntryController.php:75)<br>`entry_confirm` (Front/EntryController.php:76) |  |
| POST | `/{}/entry` | 2 | 3 | `entry` (Front/EntryController.php:75)<br>`entry_confirm` (Front/EntryController.php:76) | 0306_基本設計仕様書(フロント_会員).html |
| POST | `/entry` | 2 | 0 | `entry` (Front/EntryController.php:75)<br>`entry_confirm` (Front/EntryController.php:76) |  |
| GET | `/mypage/withdraw` | 2 | 2 | `mypage_withdraw` (Front/Mypage/WithdrawController.php:58)<br>`mypage_withdraw_confirm` (Front/Mypage/WithdrawController.php:59) | 0306_基本設計仕様書(フロント_会員).html |
| GET | `/{}/mypage/withdraw` | 2 | 1 | `mypage_withdraw` (Front/Mypage/WithdrawController.php:58)<br>`mypage_withdraw_confirm` (Front/Mypage/WithdrawController.php:59) | 0306_基本設計仕様書(フロント_会員).html |
| POST | `/mypage/withdraw` | 2 | 2 | `mypage_withdraw` (Front/Mypage/WithdrawController.php:58)<br>`mypage_withdraw_confirm` (Front/Mypage/WithdrawController.php:59) | 0306_基本設計仕様書(フロント_会員).html |
| POST | `/{}/mypage/withdraw` | 2 | 1 | `mypage_withdraw` (Front/Mypage/WithdrawController.php:58)<br>`mypage_withdraw_confirm` (Front/Mypage/WithdrawController.php:59) | 0306_基本設計仕様書(フロント_会員).html |
| GET | `/%eccube_admin_route%/order/export/order` | 2 | 1 | `admin_order_export_for_input` (Admin/Order/OrderCsvController.php:191)<br>`admin_order_export_order` (Admin/Order/OrderController.php:374) | 0203_基本設計仕様書(受注管理機能).html |

## 内部処理寄りとして混入確認が必要なルート候補

Ajax/モーダル/一括/プレビュー等の名称を含むもの。入口追補としては過剰寄りだが、利用者操作で到達するAPI・ファイル出力を含むため、必要に応じて文言調整対象。
| 区分 | method | path | route | 根拠 |
|---|---|---|---|---|
| App API | GET | `/api/popup/product/{lang}/{productId}` | `popup_product_by_product_id` | `App/ProductController.php:150` |
| App API | GET | `/api/popup/card/{lang}/{cardId}` | `popup_product_by_card_id` | `App/ProductController.php:265` |
| App API | GET | `/popup/old/{oldProductId}` | `popup_card_by_old_product_id` | `App/ProductController.php:317` |
| App API | GET | `/popup/old/{oldProductId}.json` | `popup_card_by_old_product_id_json` | `App/ProductController.php:318` |
| App API | GET | `/popup/old/{lang}/{oldProductId}` | `popup_product_by_old_product_id` | `App/ProductController.php:361` |
| App API | GET | `/popup/old/{lang}/{oldProductId}.json` | `popup_product_by_old_product_id_json` | `App/ProductController.php:362` |
| Front | GET | `/forgot/reset/{reset_key}` | `forgot_reset` | `Front/ForgotController.php:146` |
| Front | POST | `/forgot/reset/{reset_key}` | `forgot_reset` | `Front/ForgotController.php:146` |
| Front | GET | `/products/search/unisearch` | `product_search_unisearch` | `Front/ProductController.php:1454` |
| Front | POST | `/products/search/unisearch` | `product_search_unisearch` | `Front/ProductController.php:1454` |
| Front | GET | `/products/search/unisearch/lazy` | `product_search_unisearch_lazy_load` | `Front/ProductController.php:1469` |
| Front | POST | `/products/search/unisearch/lazy` | `product_search_unisearch_lazy_load` | `Front/ProductController.php:1469` |
| Front | GET | `/products/search/unisearch_api` | `product_search_unisearch_api` | `Front/ProductController.php:1595` |
| Front | POST | `/products/search/unisearch_api` | `product_search_unisearch_api` | `Front/ProductController.php:1595` |
| Front | GET | `/products/search/unisearch_rword_api` | `product_search_unisearch_rword_api` | `Front/ProductController.php:1610` |
| Front | POST | `/products/search/unisearch_rword_api` | `product_search_unisearch_rword_api` | `Front/ProductController.php:1610` |
| Front | GET | `/products/search/unisuggest_api` | `product_search_unisuggest_api` | `Front/ProductController.php:1625` |
| Front | POST | `/products/search/unisuggest_api` | `product_search_unisuggest_api` | `Front/ProductController.php:1625` |
| Front | GET | `/products/search/unisuggest_api/delete` | `product_search_unisuggest_delete_api` | `Front/ProductController.php:1640` |
| Front | POST | `/products/search/unisuggest_api/delete` | `product_search_unisuggest_delete_api` | `Front/ProductController.php:1640` |
| Front | GET | `/products/search/unisearch/query` | `product_search_unisearch_query` | `Front/ProductController.php:1655` |
| Front | POST | `/products/search/unisearch/query` | `product_search_unisearch_query` | `Front/ProductController.php:1655` |
| App API | GET | `/%eccube_api_v1_route%/admin/optionBulkPurchaseId.json` | `api_admin_option_bulk_purchase_id` | `App/MTGBuyer/V1/Admin/OptionController.php:35` |
| Front | POST | `/deck/bulk_check` | `deck_bulk_check` | `Front/Deck/DeckController.php:379` |
| Front | GET | `/deck/download/{deckId}` | `deck_download` | `Front/Deck/DeckController.php:454` |
| Front | POST | `/purchase/products/search/unisearch/lazy` | `purchase_product_search_unisearch_lazy_load` | `Front/Purchase/PurchaseController.php:628` |
| Admin | GET | `/%eccube_admin_route%/product/unisearch/feed` | `admin_product_unisearch_feed` | `Admin/Product/UniSearchFeedController.php:35` |
| Admin | POST | `/%eccube_admin_route%/product/unisearch/feed` | `admin_product_unisearch_feed` | `Admin/Product/UniSearchFeedController.php:35` |
| Admin | GET | `/%eccube_admin_route%/product/section/master_csv_upload` | `admin_product_section_master_csv_upload` | `Admin/Product/SectionController.php:260` |
| Admin | PUT | `/%eccube_admin_route%/product/class_category/{class_name_id}/{id}/visibility` | `admin_product_class_category_visibility` | `Admin/Product/ClassCategoryController.php:200` |
| Admin | POST | `/%eccube_admin_route%/product/class_category/sort_no/move` | `admin_product_class_category_sort_no_move` | `Admin/Product/ClassCategoryController.php:244` |
| Admin | GET | `/%eccube_admin_route%/product/edit_bulk_update_buy_price` | `admin_product_edit_bulk_update_buy_price` | `Admin/Product/ProductBulkUpdateBuyPriceController.php:46` |
| Admin | POST | `/%eccube_admin_route%/product/edit_bulk_update_buy_price` | `admin_product_edit_bulk_update_buy_price` | `Admin/Product/ProductBulkUpdateBuyPriceController.php:46` |
| Admin | POST | `/%eccube_admin_route%/product/bulk_update_buy_price` | `admin_product_bulk_update_buy_price` | `Admin/Product/ProductBulkUpdateBuyPriceController.php:72` |
| Admin | GET | `/%eccube_admin_route%/product/shelf_number/master_csv_upload` | `admin_product_shelf_number_master_csv_upload` | `Admin/Product/ShelfNumberController.php:247` |
| Admin | POST | `/%eccube_admin_route%/product/category/sort_no/move` | `admin_product_category_sort_no_move` | `Admin/Product/CategoryController.php:488` |
| Admin | POST | `/%eccube_admin_route%/product/class_name/sort_no/move` | `admin_product_class_name_sort_no_move` | `Admin/Product/ClassNameController.php:182` |
| Admin | GET | `/%eccube_admin_route%/product/classes/{id}/load` | `admin_product_classes_load` | `Admin/Product/ProductController.php:345` |
| Admin | POST | `/%eccube_admin_route%/product/product/image/process` | `admin_product_image_process` | `Admin/Product/ProductController.php:378` |
| Admin | GET | `/%eccube_admin_route%/product/product/image/load` | `admin_product_image_load` | `Admin/Product/ProductController.php:432` |
| Admin | DELETE | `/%eccube_admin_route%/product/product/image/revert` | `admin_product_image_revert` | `Admin/Product/ProductController.php:479` |
| Admin | GET | `/%eccube_admin_route%/product/searchCardDetail` | `admin_product_card_detail_html` | `Admin/Product/ProductController.php:938` |
| Admin | POST | `/%eccube_admin_route%/product/searchCardDetail` | `admin_product_card_detail_html` | `Admin/Product/ProductController.php:938` |
| Admin | POST | `/%eccube_admin_route%/product/bulk/product-status/{id}` | `admin_product_bulk_product_status` | `Admin/Product/ProductController.php:1422` |
| Admin | POST | `/%eccube_admin_route%/deck/bulk_delete` | `admin_deck_bulk_delete` | `Admin/Deck/DeckController.php:139` |
| Admin | POST | `/%eccube_admin_route%/deck/bulk_update` | `admin_deck_bulk_update` | `Admin/Deck/DeckController.php:185` |
| Admin | GET | `/%eccube_admin_route%/order/shipping_csv_upload` | `admin_shipping_csv_import` | `Admin/Order/CsvImportController.php:42` |
| Admin | POST | `/%eccube_admin_route%/order/shipping_csv_upload` | `admin_shipping_csv_import` | `Admin/Order/CsvImportController.php:42` |
| Admin | GET | `/%eccube_admin_route%/shipping/preview_notify_mail/{id}` | `admin_shipping_preview_notify_mail` | `Admin/Order/ShippingController.php:233` |
| Admin | GET | `/%eccube_admin_route%/order/search/customer/html` | `admin_order_search_customer_html` | `Admin/Order/EditController.php:1081` |
| Admin | POST | `/%eccube_admin_route%/order/search/customer/html` | `admin_order_search_customer_html` | `Admin/Order/EditController.php:1081` |
| Admin | GET | `/%eccube_admin_route%/order/search/customer/html/page/{page_no}` | `admin_order_search_customer_html_page` | `Admin/Order/EditController.php:1082` |
| Admin | POST | `/%eccube_admin_route%/order/search/customer/html/page/{page_no}` | `admin_order_search_customer_html_page` | `Admin/Order/EditController.php:1082` |
| Admin | POST | `/%eccube_admin_route%/order/bulk_delete` | `admin_order_bulk_delete` | `Admin/Order/OrderController.php:349` |
| Admin | POST | `/%eccube_admin_route%/order/export/pdf/download` | `admin_order_pdf_download` | `Admin/Order/OrderController.php:658` |
| Admin | POST | `/%eccube_admin_route%/order/generate/standby` | `admin_order_generate_standby_list` | `Admin/Order/OrderController.php:786` |
| Admin | POST | `/%eccube_admin_route%/disable_maintenance/{mode}` | `admin_disable_maintenance` | `Admin/Content/MaintenanceController.php:82` |
| Admin | POST | `/%eccube_admin_route%/content/layout/{id}/preview` | `admin_content_layout_preview` | `Admin/Content/LayoutController.php:226` |
| Admin | GET | `/%eccube_admin_route%/content/file_download` | `admin_content_file_download` | `Admin/Content/FileController.php:254` |
| Admin | GET | `/%eccube_admin_route%/card/csv_upload` | `admin_card_csv_upload` | `Admin/Card/CardCsvController.php:60` |
| Admin | ANY | `/%eccube_admin_route%/cardset` | `admin_cardset_list` | `Admin/Card/CardsetController.php:49` |
| Admin | POST | `/%eccube_admin_route%/cardset/download` | `admin_cardset_download` | `Admin/Card/CardsetController.php:233` |
| Admin | POST | `/%eccube_admin_route%/card/generate_list` | `admin_card_generate_list` | `Admin/Card/CardController.php:160` |
| Admin | DELETE | `/%eccube_admin_route%/card/bulk_delete` | `admin_card_bulk_delete` | `Admin/Card/CardController.php:308` |
| Admin | POST | `/%eccube_admin_route%/event/banner/image/upload` | `admin_event_banner_image_upload` | `Admin/Event/BannerController.php:91` |
| Admin | POST | `/%eccube_admin_route%/event/banner/{htmlClass}/image/upload` | `admin_event_banner_image_upload_narrow` | `Admin/Event/BannerController.php:92` |
| Admin | POST | `/%eccube_admin_route%/event/{eventId}/schedule/bulk_delete` | `admin_schedule_bulk_delete` | `Admin/Event/ScheduleController.php:169` |
| Admin | POST | `/%eccube_admin_route%/event/entry/bulk_update` | `admin_event_entry_bulk_update` | `Admin/Event/EntryController.php:300` |
| Admin | GET | `/%eccube_admin_route%/event/entry/search_event` | `admin_entry_event_html` | `Admin/Event/EntryController.php:379` |
| Admin | GET | `/%eccube_admin_route%/event/entry/search_event/page/{page_no}` | `admin_entry_event_html_page` | `Admin/Event/EntryController.php:380` |
| Admin | POST | `/%eccube_admin_route%/event/entry/search_event/set` | `admin_entry_search_event_by_id` | `Admin/Event/EntryController.php:454` |
| Admin | GET | `/%eccube_admin_route%/event/entry/bulk_csv_import` | `admin_event_entry_bulk_csv_import` | `Admin/Event/EventEntryBulkCsvController.php:59` |
| Admin | POST | `/%eccube_admin_route%/event/entry/bulk_csv_import` | `admin_event_entry_bulk_csv_import` | `Admin/Event/EventEntryBulkCsvController.php:59` |
| Admin | GET | `/%eccube_admin_route%/event/entry/bulk_csv_template` | `admin_event_entry_bulk_csv_template` | `Admin/Event/EventEntryBulkCsvController.php:156` |
| Admin | GET | `/%eccube_admin_route%/mall/mail/preview` | `admin_mall_mail_preview` | `Admin/Mall/MallMailController.php:46` |
| Admin | POST | `/%eccube_admin_route%/mall/mail/preview` | `admin_mall_mail_preview` | `Admin/Mall/MallMailController.php:46` |
| Admin | POST | `/%eccube_admin_route%/mall/tenant/image/process` | `admin_mall_tenant_image_process` | `Admin/Mall/TenantController.php:346` |
| Admin | GET | `/%eccube_admin_route%/mall/tenant/image/load` | `admin_mall_tenant_image_load` | `Admin/Mall/TenantController.php:401` |
| Admin | DELETE | `/%eccube_admin_route%/mall/tenant/image/revert` | `admin_mall_tenant_image_revert` | `Admin/Mall/TenantController.php:477` |
| Admin | POST | `/%eccube_admin_route%/product/stock/change/upload` | `admin_stock_change_csv_upload` | `Admin/Stock/StockChangeCsvController.php:148` |
| Admin | GET | `/%eccube_admin_route%/product/stock/split-join/{id}/status-snapshot` | `admin_stock_split_join_status_snapshot` | `Admin/Stock/StockSplitJoinController.php:74` |
| Admin | GET | `/%eccube_admin_route%/product/stock/split-join` | `admin_stock_split_join_list` | `Admin/Stock/StockSplitJoinController.php:90` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split-join` | `admin_stock_split_join_list` | `Admin/Stock/StockSplitJoinController.php:90` |
| Admin | GET | `/%eccube_admin_route%/product/stock/split-join/join-csv-template` | `admin_stock_join_csv_template` | `Admin/Stock/StockSplitJoinController.php:175` |
| Admin | GET | `/%eccube_admin_route%/product/stock/split-join/split-csv-template` | `admin_stock_split_csv_template` | `Admin/Stock/StockSplitJoinController.php:183` |
| Admin | GET | `/%eccube_admin_route%/product/stock/split-join/csv-export` | `admin_stock_split_join_csv_export` | `Admin/Stock/StockSplitJoinController.php:213` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split-join/list-split-csv-import` | `admin_stock_split_join_list_split_csv_import` | `Admin/Stock/StockSplitJoinController.php:225` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split-join/list-join-csv-import` | `admin_stock_split_join_list_join_csv_import` | `Admin/Stock/StockSplitJoinController.php:317` |
| Admin | GET | `/%eccube_admin_route%/product/stock/split-join/approval-members` | `admin_stock_split_join_approval_members` | `Admin/Stock/StockSplitJoinController.php:430` |
| Admin | POST | `/%eccube_admin_route%/product/stock/{productStockId}/join/new-source-csv-upload` | `admin_stock_join_new_source_csv_upload` | `Admin/Stock/StockJoinController.php:826` |
| Admin | POST | `/%eccube_admin_route%/product/stock/join/{id}/edit-source-csv-upload` | `admin_stock_join_edit_source_csv_upload` | `Admin/Stock/StockJoinController.php:872` |
| Admin | GET | `/%eccube_admin_route%/product/stock/{productStockId}/split/new` | `admin_stock_split_new` | `Admin/Stock/StockSplitController.php:78` |
| Admin | POST | `/%eccube_admin_route%/product/stock/{productStockId}/split/new/session-destination` | `admin_stock_split_new_session_destination` | `Admin/Stock/StockSplitController.php:100` |
| Admin | POST | `/%eccube_admin_route%/product/stock/{productStockId}/split/register` | `admin_stock_split_register` | `Admin/Stock/StockSplitController.php:144` |
| Admin | GET | `/%eccube_admin_route%/product/stock/split/{id}/edit` | `admin_stock_split_edit` | `Admin/Stock/StockSplitController.php:205` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split/{id}/edit` | `admin_stock_split_edit` | `Admin/Stock/StockSplitController.php:205` |
| Admin | POST | `/%eccube_admin_route%/product/stock/{productStockId}/split/apply-approval` | `admin_stock_split_apply_approval` | `Admin/Stock/StockSplitController.php:271` |
| Admin | GET | `/%eccube_admin_route%/product/stock/split/{id}/approval` | `admin_stock_split_approval` | `Admin/Stock/StockSplitController.php:336` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split/{id}/approval` | `admin_stock_split_approval` | `Admin/Stock/StockSplitController.php:336` |
| Admin | POST | `/%eccube_admin_route%/product/stock/{productStockId}/split/destination/add` | `admin_stock_split_add_destination` | `Admin/Stock/StockSplitController.php:368` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split/update-destination-stock` | `admin_stock_split_update_destination_stock` | `Admin/Stock/StockSplitController.php:436` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split/{id}/destination/{destinationId}/update-quantity` | `admin_stock_split_update_destination_quantity` | `Admin/Stock/StockSplitController.php:446` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split/update-destination-stock-location` | `admin_stock_split_update_destination_stock_location` | `Admin/Stock/StockSplitController.php:483` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split/{id}/destination/{destinationId}/delete` | `admin_stock_split_delete_destination` | `Admin/Stock/StockSplitController.php:517` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split/{id}/registration-memo` | `admin_stock_split_update_registration_memo` | `Admin/Stock/StockSplitController.php:549` |
| Admin | POST | `/%eccube_admin_route%/product/stock/split/{id}/edit-destination-csv-upload` | `admin_stock_split_edit_destination_csv_upload` | `Admin/Stock/StockSplitController.php:587` |
| Admin | GET | `/%eccube_admin_route%/product/stock/split/destination-csv-template` | `admin_stock_split_new_destination_csv_template` | `Admin/Stock/StockSplitController.php:629` |
| Admin | GET | `/%eccube_admin_route%/product/stock/stock-bulk-approval/new` | `admin_stock_bulk_approval_new` | `Admin/Stock/StockBulkApprovalController.php:52` |
| Admin | POST | `/%eccube_admin_route%/product/stock/stock-bulk-approval/new` | `admin_stock_bulk_approval_new` | `Admin/Stock/StockBulkApprovalController.php:52` |
| Admin | POST | `/%eccube_admin_route%/product/stock/stock-bulk-approval/store` | `admin_stock_bulk_approval_store` | `Admin/Stock/StockBulkApprovalController.php:89` |
| Admin | POST | `/%eccube_admin_route%/product/stock/bulk-edit-dispatch` | `admin_stock_list_bulk_edit_dispatch` | `Admin/Stock/StockListController.php:430` |
| Admin | GET | `/%eccube_admin_route%/store/template/{id}/download` | `admin_store_template_download` | `Admin/Store/TemplateController.php:89` |
| Admin | GET | `/%eccube_admin_route%/purchase/{id}/bulkpurchaseload` | `admin_purchase_bulk_purchase_load` | `Admin/Purchase/PurchaseController.php:324` |
| Admin | POST | `/%eccube_admin_route%/purchase/bulk/detail/{id}/sell` | `admin_purchase_bulk_detail_sell` | `Admin/Purchase/PurchaseController.php:519` |
| Admin | GET | `/%eccube_admin_route%/product/status/csv_upload` | `admin_product_status_csv_upload` | `Admin/Product/Csv/ProductStatusCsvController.php:69` |
| Admin | GET | `/%eccube_admin_route%/product/product_price/product_price_csv_upload` | `admin_product_product_price_csv_upload` | `Admin/Product/Csv/ProductPriceCsvController.php:75` |
| Admin | GET | `/%eccube_admin_route%/product/product_card_csv_upload` | `admin_product_card_csv_import` | `Admin/Product/Csv/CardCsvController.php:83` |
| Admin | POST | `/%eccube_admin_route%/product/product_card_csv_upload` | `admin_product_card_csv_upload` | `Admin/Product/Csv/CardCsvController.php:127` |
| Admin | GET | `/%eccube_admin_route%/product/sale_high_price/csv_upload` | `admin_product_sale_high_price_csv_upload` | `Admin/Product/Csv/ProductSaleHighPriceCsvController.php:65` |
| Admin | GET | `/%eccube_admin_route%/product/product_csv_upload` | `admin_product_csv_import` | `Admin/Product/Csv/CsvImportController.php:132` |
| Admin | POST | `/%eccube_admin_route%/product/product_csv_upload` | `admin_product_csv_import` | `Admin/Product/Csv/CsvImportController.php:132` |
| Admin | GET | `/%eccube_admin_route%/product/category_csv_upload` | `admin_product_category_csv_import` | `Admin/Product/Csv/CsvImportController.php:673` |
| Admin | POST | `/%eccube_admin_route%/product/category_csv_upload` | `admin_product_category_csv_import` | `Admin/Product/Csv/CsvImportController.php:673` |
| Admin | GET | `/%eccube_admin_route%/product/class_name_csv_upload` | `admin_product_class_name_csv_import` | `Admin/Product/Csv/CsvImportController.php:832` |
| Admin | POST | `/%eccube_admin_route%/product/class_name_csv_upload` | `admin_product_class_name_csv_import` | `Admin/Product/Csv/CsvImportController.php:832` |
| Admin | GET | `/%eccube_admin_route%/product/class_category_csv_upload` | `admin_product_class_category_csv_import` | `Admin/Product/Csv/CsvImportController.php:946` |
| Admin | POST | `/%eccube_admin_route%/product/class_category_csv_upload` | `admin_product_class_category_csv_import` | `Admin/Product/Csv/CsvImportController.php:946` |
| Admin | GET | `/%eccube_admin_route%/product/department_csv_upload` | `admin_product_department_csv_import` | `Admin/Product/Csv/CsvImportController.php:1077` |
| Admin | POST | `/%eccube_admin_route%/product/department_csv_upload` | `admin_product_department_csv_import` | `Admin/Product/Csv/CsvImportController.php:1077` |
| Admin | POST | `/%eccube_admin_route%/product/csv_split` | `admin_product_csv_split` | `Admin/Product/Csv/CsvImportController.php:2187` |
| Admin | POST | `/%eccube_admin_route%/product/csv_split_import` | `admin_product_csv_split_import` | `Admin/Product/Csv/CsvImportController.php:2248` |
| Admin | POST | `/%eccube_admin_route%/product/csv_split_cleanup` | `admin_product_csv_split_cleanup` | `Admin/Product/Csv/CsvImportController.php:2284` |
| Admin | GET | `/%eccube_admin_route%/product/section/csv_upload` | `admin_product_section_csv_upload` | `Admin/Product/Csv/ProductSectionCsvController.php:69` |
| Admin | GET | `/%eccube_admin_route%/product/product_goods_csv_upload` | `admin_product_goods_csv_import` | `Admin/Product/Csv/GoodsCsvController.php:75` |
| Admin | POST | `/%eccube_admin_route%/product/product_goods_csv_upload` | `admin_product_goods_csv_upload` | `Admin/Product/Csv/GoodsCsvController.php:118` |
| Admin | GET | `/%eccube_admin_route%/product/product_standard_price_csv_upload` | `admin_product_product_standard_price_csv_upload` | `Admin/Product/Csv/ProductStandardPriceCsvController.php:77` |
| Admin | GET | `/%eccube_admin_route%/product/category/csv_template` | `admin_product_category_bulk_csv_template` | `Admin/Product/Csv/CategoryCsvController.php:51` |
| Admin | GET | `/%eccube_admin_route%/product/category/category_bulk_csv_upload` | `admin_product_category_bulk_csv_upload` | `Admin/Product/Csv/CategoryCsvController.php:72` |
| Admin | POST | `/%eccube_admin_route%/product/category/import` | `admin_product_category_bulk_import` | `Admin/Product/Csv/CategoryCsvController.php:118` |
| Admin | POST | `/%eccube_admin_route%/product/product_shelf_number_csv_upload` | `admin_product_shelf_number_csv_upload` | `Admin/Product/Csv/ProductShelfNumberCsvController.php:114` |
| Admin | GET | `/%eccube_admin_route%/product/tag_sales_analysis/csv_upload` | `admin_product_tag_sales_analysis_csv_upload` | `Admin/Product/Csv/TagSalesAnalysisCsvController.php:67` |
| Admin | GET | `/%eccube_admin_route%/product/simple_high_price/csv_upload` | `admin_product_simple_high_price_csv_upload` | `Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:67` |
| Admin | GET | `/%eccube_admin_route%/product/product_tag_csv_upload` | `admin_product_product_tag_csv_upload` | `Admin/Product/Csv/ProductTagCsvController.php:67` |
| Admin | PUT | `/%eccube_admin_route%/setting/shop/delivery/{id}/visibility` | `admin_setting_shop_delivery_visibility` | `Admin/Setting/Shop/DeliveryController.php:317` |
| Admin | POST | `/%eccube_admin_route%/setting/shop/delivery/sort_no/move` | `admin_setting_shop_delivery_sort_no_move` | `Admin/Setting/Shop/DeliveryController.php:380` |
| Admin | POST | `/%eccube_admin_route%/setting/shop/mail/preview` | `admin_setting_shop_mail_preview` | `Admin/Setting/Shop/MailController.php:210` |
| Admin | POST | `/%eccube_admin_route%/setting/shop/payment/image/process` | `admin_payment_image_process` | `Admin/Setting/Shop/PaymentController.php:180` |
| Admin | GET | `/%eccube_admin_route%/setting/shop/payment/image/load` | `admin_payment_image_load` | `Admin/Setting/Shop/PaymentController.php:230` |
| Admin | DELETE | `/%eccube_admin_route%/setting/shop/payment/image/revert` | `admin_payment_image_revert` | `Admin/Setting/Shop/PaymentController.php:279` |
| Admin | POST | `/%eccube_admin_route%/setting/shop/payment/sort_no/move` | `admin_setting_shop_payment_sort_no_move` | `Admin/Setting/Shop/PaymentController.php:355` |
| Admin | GET | `/%eccube_admin_route%/two_factor_auth/set` | `admin_two_factor_auth_set` | `Admin/Setting/System/TwoFactorAuthController.php:81` |
| Admin | POST | `/%eccube_admin_route%/two_factor_auth/set` | `admin_two_factor_auth_set` | `Admin/Setting/System/TwoFactorAuthController.php:81` |