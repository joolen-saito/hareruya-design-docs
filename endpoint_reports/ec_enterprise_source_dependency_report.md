# ec-cube-enterprise ソース起点の機能間依存関係

## 目的

不具合修正後の影響範囲特定とリグレッションテスト選定に使うため、設計書の機能IDを ec-cube-enterprise 実装へ突合し、ルート・DBテーブル・Repository・Service・Twig遷移の依存候補を整理した。

## 抽出対象

- 設計書機能ID: 389 件（ec-cube-enterprise設計書を優先し、不足分はpf-eccube3/pf-api設計書で補完）。
- ソースファイル: 3039 件（`ec-cube-enterprise/src/Eccube`, `app`, `html/template`, `html/assets/hareruya`）。
- ソースに突合できた機能: 238 件。
- 依存候補エッジ: 4236 件。

## 判定ルール

| 依存理由 | 意味 | リグレッション優先度 |
|---|---|---|
| `source_route_call` | PHP/Twigが相手機能のRouteを呼ぶ | 高 |
| `source_shared_table` | 同一Entity/Tableに触る | 高（更新・集計・検索条件変更時） |
| `source_shared_repository` | 同一Repositoryに依存 | 中から高 |
| `source_shared_service` | 同一Serviceに依存 | 中から高 |
| `same_domain_cross_layer` | 同一業務ドメインで画面/API/バッチ層が異なる | 中 |
| `doc_direct_ref` | 設計書本文で相手機能IDを参照 | 中 |

## 使い方

1. 修正したController/Service/Entity/Twigから `ec_enterprise_source_function_inventory.tsv` の `source_files` / `source_tables` / `services` を検索する。
2. 見つかった機能IDを `ec_enterprise_source_dependency_edges.tsv` の `source_id` で引く。
3. `source_route_call` と `source_shared_table` をまず対象化し、次に同一Repository/Serviceを確認する。
4. 対象機能の結合試験観点表で P1/P2、DB更新、外部連携、再実行、CSV/PDF/API応答を優先して回す。

## サマリ

- Route呼び出し由来の依存: 922 件。
- 共有テーブル由来の依存: 4227 件。

## 共有テーブル上位

| テーブル | 機能数 |
|---|---:|
| `dtb_product_class` | 113 |
| `dtb_member` | 108 |
| `dtb_base_info` | 98 |
| `dtb_product` | 88 |
| `dtb_product_stock` | 65 |
| `mtb_card_detail` | 60 |
| `dtb_category` | 58 |
| `dtb_player` | 57 |
| `mtb_card_condition` | 55 |
| `dtb_order` | 55 |
| `mtb_card` | 54 |
| `mtb_language` | 53 |
| `dtb_customer` | 50 |
| `dtb_otc_buy_order` | 48 |
| `mtb_product_status` | 47 |
| `dtb_product_category` | 46 |
| `dtb_product_tag` | 46 |
| `dtb_buy_order` | 43 |
| `mtb_csv_type` | 42 |
| `mtb_cardset` | 40 |
| `dtb_product_image` | 38 |
| `mtb_option` | 37 |
| `dtb_product_sub_class` | 37 |
| `mtb_format` | 37 |
| `dtb_card_color` | 36 |

## 共有Service上位

| Service | 機能数 |
|---|---:|
| `CsvExportService` | 62 |
| `MailService` | 54 |
| `FileManager` | 24 |
| `PurchaseFlow` | 23 |
| `OrderStateMachine` | 15 |
| `ShippingStandbyCsvExporterService` | 15 |
| `OrderPdfService` | 15 |
| `GenerateShippingStandbyListAction` | 15 |
| `UpdateStackListAction` | 15 |
| `UpdateStackListInput` | 15 |
| `GenerateListInput` | 15 |
| `UniSearchService` | 15 |
| `CsvColumnInterface` | 15 |
| `RowValidatorInterface` | 15 |
| `CsvImporter` | 14 |
| `RegisterIndividualStockInput` | 14 |
| `RegisterIndividualStockAction` | 14 |
| `SmaregiProductClassEventService` | 12 |
| `PurchaseContext` | 11 |
| `TopCategoryListBuilder` | 11 |

## 共有Repository上位

| Repository | 機能数 |
|---|---:|
| `PageMaxRepository` | 83 |
| `BaseInfoRepository` | 76 |
| `ProductClassRepository` | 68 |
| `ProductRepository` | 52 |
| `ProductStockRepository` | 51 |
| `ProductStatusRepository` | 36 |
| `CategoryRepository` | 34 |
| `MemberRepository` | 33 |
| `DtbCsvExtensionRepository` | 29 |
| `CustomerRepository` | 29 |
| `TagRepository` | 27 |
| `OrderRepository` | 26 |
| `MtbOptionRepository` | 24 |
| `DtbPlayerRepository` | 23 |
| `DtbSearchPatternRepository` | 21 |
| `DtbDeckRepository` | 21 |
| `DtbShippingStandbyRepository` | 20 |
| `DeliveryRepository` | 19 |
| `TaxRuleRepository` | 19 |
| `OrderStatusRepository` | 18 |

## Route定義に突合できた主な機能

| 機能ID | 機能名 | Route | 主ソース |
|---|---|---|---|
| `a02-02` | API 商品管理 — ポップアップ用カード情報取得 | `favorite_cart_add_bulk`, `product_add_cart`, `product_add_favorite`, `product_category`, `product_detail` | `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php`, `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php` |
| `a02-03` | API 商品管理 — ポップアップ用商品情報取得（旧商品ID） |  | `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php` |
| `a02-04` | API 商品管理 — ポップアップ用カード情報取得（旧商品ID） |  | `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php`, `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php` |
| `a02-05` | API 商品管理 — 更新商品規格取得 | `admin_product`, `admin_product_bulk_product_status`, `admin_product_card_detail_html`, `admin_product_category_csv_import`, `admin_product_class_category_csv_import` | `ec-cube-enterprise/src/Eccube/Command/Seeder/ProductSeederCommand.php`, `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php` |
| `a06-02` | API 店頭買取管理 — 店頭買取受注一覧取得 | `api_admin_otc_buy_order_update`, `api_admin_otc_buy_order_update_double_check_member`, `api_admin_otc_buy_order_update_free_comment`, `api_admin_otc_buy_order_update_identification`, `api_admin_otc_buy_order_update_status` | `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php`, `ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php` |
| `a06-03` | API 店頭買取管理 — 店頭買取受注詳細更新 |  | `ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php`, `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/ActionInput/UpdateStatusInput.php` |
| `a06-04` | API 店頭買取管理 — 店頭買取受注コメント更新 |  | `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateFreeCommentInput.php` |
| `a06-05` | API 店頭買取管理 — 店頭買取受注ステータス更新 |  | `ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php` |
| `a06-06` | API 店頭買取管理 — カード詳細IDから買取用商品情報を取得 |  | `ec-cube-enterprise/src/Eccube/Repository/DtbStockSplitJoinDetailRepository.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php` |
| `a06-07` | API 店頭買取管理 — 商品IDリストから買取用商品情報を取得 |  | `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php` |
| `a06-08` | API 店頭買取管理 — カード名から買取用商品情報を取得 |  | `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php`, `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php` |
| `a06-09` | API 店頭買取管理 — 商品名から商品詳細の情報を取得 |  | `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php` |
| `a06-10` | API 店頭買取管理 — 商品IDリストから買取用商品情報を取得 |  | `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php` |
| `a06-13` | API 店頭買取管理 — 本人確認更新 |  | `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateIdentificationInput.php` |
| `a06-14` | A06-14（店頭買取情報一部キャンセル情報連携） |  | `ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php`, `ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php` |
| `a06-16` | A06-16（店頭買取情報ダブルチェック者更新） |  | `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateDoubleCheckMemberInput.php`, `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateDoubleCheckMemberAction.php` |
| `a06-17` | API 店頭買取管理 — カード詳細IDから買取用商品情報を取得 |  | `ec-cube-enterprise/src/Eccube/Repository/DtbStockSplitJoinDetailRepository.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php` |
| `a06-18` | API 店頭買取管理 — 商品IDリストから買取用商品情報を取得 |  | `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php` |
| `a07-02` | API ネット買取管理 — ネット買取受注一覧取得 |  | `ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php` |
| `a07-03` | API ネット買取管理 — ネット買取受注コメント更新 |  | `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/ActionInput/UpdateFreeCommentInput.php` |
| `a07-04` | API ネット買取管理 — ネット買取受注ステータス更新 |  | `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/ActionInput/UpdateStatusInput.php`, `ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php` |
| `a07-05` | API ネット買取管理 — ネット買取注文の査定終了処理 |  | `ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php`, `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php` |
| `a07-06` | API ネット買取管理 — 複数ネット買取IDからネット買取受注の商品一覧を取得 |  | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BuyMainBulkCardType.php`, `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BuyMainCardType.php` |
| `a07-07` | API ネット買取管理 — 複数ネット買取IDから個別入力商品の一覧を取得 | `api_admin_buy_order_indivisual_input_product` | `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductController.php`, `ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderIndivisualInputProduct.php` |
| `a15-05` | API デッキビルダー — ユーザー情報変更 |  | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateUserAction.php` |
| `a15-06` | API デッキビルダー — マスタ検索 | `admin_data_mtg_master_data` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Data/MtgMasterDataController.php`, `ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCardType.php` |
| `a15-09` | API デッキビルダー — デッキ情報登録 |  | `ec-cube-enterprise/src/Eccube/Service/DeckService.php`, `ec-cube-enterprise/src/Eccube/Service/EntityManager/DeckBuilderDeckEntityManager.php` |
| `a15-10` | API デッキビルダー — デッキ情報更新 |  | `ec-cube-enterprise/src/Eccube/Service/DeckService.php`, `ec-cube-enterprise/src/Eccube/Service/EntityManager/DeckBuilderDeckEntityManager.php` |
| `a15-12` | API デッキビルダー — デッキ情報参照 |  | `ec-cube-enterprise/src/Eccube/Entity/DtbDeck.php`, `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php` |
| `a15-14` | API デッキビルダー — メタゲーム情報参照 |  | `ec-cube-enterprise/src/Eccube/Dto/App/DeckBuilder/BuildSaveDataResultDto.php`, `ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php` |
| `a15-15` | API デッキビルダー — 採用枚数情報参照 |  | `ec-cube-enterprise/src/Eccube/Dto/App/DeckBuilder/BuildSaveDataResultDto.php`, `ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php` |
| `a15-17` | API デッキビルダー — デッキ登録インポート |  | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php`, `ec-cube-enterprise/src/Eccube/Service/DeckService.php` |
| `a15-18` | API デッキビルダー — デッキ更新インポート |  | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php`, `ec-cube-enterprise/src/Eccube/Service/DeckService.php` |
| `a17-01` | API その他 — 検索クエリに一致する記事情報1件を取得 |  | `ec-cube-enterprise/src/Eccube/Repository/DtbArticleRepository.php` |
| `a17-02` | API その他 — 記事IDに関連する記事情報を取得 |  | `ec-cube-enterprise/src/Eccube/Repository/DtbArticleRepository.php` |
| `a17-04` | API その他 — 商品IDに紐づく商品詳細の情報を取得 |  | `ec-cube-enterprise/src/Eccube/Repository/DtbStockSplitJoinDetailRepository.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php` |
| `a17-05` | API 店頭買取管理 — 商品名から商品詳細の情報を取得 |  | `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php` |
| `b02-05` | バッチ 商品管理 — お気に入り商品セール通知 |  | `ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php` |
| `b02-07` | バッチ 商品管理 — 週間在庫履歴更新 |  | `ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryRepository.php`, `ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php` |
| `f03-01` | F03-01（商品一覧） | `favorite_cart_add_bulk`, `product_add_cart`, `product_add_favorite`, `product_category`, `product_detail` | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php` |
| `f03-02` | F03-02（商品詳細） | `favorite_cart_add_bulk`, `product_add_cart`, `product_add_favorite`, `product_category`, `product_detail` | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php`, `ec-cube-enterprise/src/Eccube/Repository/CustomerFavoriteProductRepository.php` |
| `f03-03` | F03-03（商品詳細検索） |  | `ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php`, `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php` |
| `f03-04` | F03-04（カテゴリ一覧） |  | `ec-cube-enterprise/src/Eccube/Service/ProductList/ProductListDetailedSearchBreadcrumbBuilder.php` |
| `f03-05` | 商品 — 商品リコメンド（おすすめ商品ブロック） | `favorite_cart_add_bulk`, `product_add_cart`, `product_add_favorite`, `product_category`, `product_detail` | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php`, `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php` |
| `f04-02` | F04-02（ご注文方法指定 — 注文情報の入力・確認・注文） | `shopping`, `shopping_checkout`, `shopping_complete`, `shopping_confirm`, `shopping_error` | `ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php` |
| `f05-02` | F05-02（ネット買取商品検索） | `favorite_cart_add_bulk`, `product_add_cart`, `product_add_favorite`, `product_category`, `product_detail` | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php` |
| `f05-03` | F05-03（ネット買取商品一覧） | `favorite_cart_add_bulk`, `product_add_cart`, `product_add_favorite`, `product_category`, `product_detail` | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php` |
| `f05-04` | F05-04（ネット買取商品詳細） | `favorite_cart_add_bulk`, `product_add_cart`, `product_add_favorite`, `product_category`, `product_detail` | `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php`, `ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php` |
| `f05-06` | F05-06（ネット買取買取手続き〜完了） | `purchase_add`, `purchase_cart`, `purchase_cart_update`, `purchase_complete`, `purchase_confirm` | `ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php`, `ec-cube-enterprise/src/Eccube/Service/Front/Purchase/ActionInput/PurchaseOrderSubmitInput.php` |
| `f06-07` | F06-07（購入履歴詳細） |  | `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig` |
| `f06-10` | F06-10（ポイント履歴） |  | `ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php` |
| `f06-11` | F06-11（買取履歴一覧） |  | `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php`, `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php` |
| `f06-12` | 会員 — まとめて買取査定結果 |  | `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php`, `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryRowBuilder.php` |
| `f06-13` | 会員 — オンライン本人確認 |  | `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/IdentificationUpdateAction.php` |
| `f06-14` | F06-14（予約済み大会一覧） | `admin_entry_new`, `admin_entry_registration`, `admin_entry_registration_page`, `admin_entry_registration_search_player` | `ec-cube-enterprise/app/DoctrineMigrations/Version20251117010327.php`, `ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php` |
| `f06-16` | F06-16（大会デッキ登録編集） |  | `ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php`, `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php` |
| `f06-17` | F06-17（大会に登録するデッキの確認・登録） |  | `ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php`, `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php` |
| `f06-18` | F06-18（会員情報変更） | `mypage_change`, `mypage_change_complete` | `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php` |
| `f06-20` | F06-20（会員の配送先登録・編集） | `mypage_delivery`, `mypage_delivery_delete`, `mypage_delivery_edit`, `mypage_delivery_edit_complete`, `mypage_delivery_new` | `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php` |
| `f06-26` | F06-26（店頭PC用アカウントで通常会員と異なる制御） | `otc_buy`, `otc_buy_complete`, `otc_buy_confirm`, `otc_buy_entry`, `otc_buy_register_customer` | `ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php` |
| `f07-02` | F07-02（大会詳細検索） |  | `ec-cube-enterprise/src/Eccube/Service/Front/Event/EventScheduleJsonBuilder.php` |
| `f07-03` | F07-03（大会詳細） |  | `ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php`, `ec-cube-enterprise/src/Eccube/Service/Front/Event/EventEntryRegisterAction.php` |
| `f07-04` | F07-04（大会申込～完了） | `entry`, `entry_activate`, `entry_complete`, `entry_confirm`, `entry_regist_error` | `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php` |
| `f08-03` | F08-03（店頭買取査定申込登録確認〜完了） | `otc_buy`, `otc_buy_complete`, `otc_buy_confirm`, `otc_buy_entry`, `otc_buy_register_customer` | `ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php` |
| `m03-01` | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧） | `admin_change_password`, `admin_homepage`, `admin_homepage_customer`, `admin_homepage_nonstock`, `admin_homepage_sale` | `ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php`, `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php` |
| `m03-02` | M03-02（商品編集機能） | `admin_product`, `admin_product_bulk_product_status`, `admin_product_card_detail_html`, `admin_product_category_csv_import`, `admin_product_class_category_csv_import` | `ec-cube-enterprise/src/Eccube/Command/Seeder/ProductSeederCommand.php`, `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php` |
| `m03-03` | m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力） | `admin_product`, `admin_product_bulk_product_status`, `admin_product_card_detail_html`, `admin_product_classes_load`, `admin_product_doubling_check` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php` |
| `m03-04` | m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力） | `admin_product`, `admin_product_bulk_product_status`, `admin_product_card_detail_html`, `admin_product_classes_load`, `admin_product_doubling_check` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php` |
| `m03-05` | m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力） | `admin_product`, `admin_product_all_csv_custom_export`, `admin_product_bulk_product_status`, `admin_product_card_csv_export`, `admin_product_card_detail_html` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php`, `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php` |
| `m03-06` | 商品管理 — カスタムデータ CSV ダウンロード（商品情報） | `admin_custom_export`, `admin_product_all_csv_custom_export`, `admin_product_card_csv_export`, `admin_product_goods_csv_export`, `admin_product_price_csv_export` | `ec-cube-enterprise/src/Eccube/Controller/Admin/CustomExportCsvController.php`, `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php` |
| `m03-08` | m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧） | `admin_product_product_class`, `admin_product_product_class_clear`, `admin_product_product_class_delete`, `admin_product_product_class_edit`, `admin_product_product_class_new` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php` |
| `m03-09` | M03-09（商品規格登録/編集） | `admin_product_product_class`, `admin_product_product_class_clear`, `admin_product_product_class_delete`, `admin_product_product_class_edit`, `admin_product_product_class_new` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php`, `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php` |
| `m03-10` | m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集） | `admin_product`, `admin_product_bulk_product_status`, `admin_product_bulk_update_buy_price`, `admin_product_card_detail_html`, `admin_product_classes_load` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductBulkUpdateBuyPriceController.php`, `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php` |
| `m03-11` | m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集） | `admin_product_category`, `admin_product_category_create`, `admin_product_category_delete`, `admin_product_category_edit`, `admin_product_category_export` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php` |
| `m03-12` | 商品管理 — カテゴリ CSV 出力 | `admin_product_category`, `admin_product_category_create`, `admin_product_category_delete`, `admin_product_category_edit`, `admin_product_category_export` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php` |
| `m03-14` | m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集） | `admin_product_storage_code`, `admin_product_storage_code_csv`, `admin_product_storage_code_csv_template`, `admin_product_storage_code_delete`, `admin_product_storage_code_edit` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php` |
| `m03-15` | 商品管理 — 略称タグCSV出力 | `admin_product_storage_code`, `admin_product_storage_code_csv`, `admin_product_storage_code_csv_template`, `admin_product_storage_code_delete`, `admin_product_storage_code_edit` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php` |
| `m03-16` | 商品管理 — 略称タグCSV入力 | `admin_product_storage_code`, `admin_product_storage_code_csv`, `admin_product_storage_code_csv_template`, `admin_product_storage_code_delete`, `admin_product_storage_code_edit` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php` |
| `m03-17` | 商品管理 — 売上分析タグ登録/編集 | `admin_product_tag_sales_analysis`, `admin_product_tag_sales_analysis_delete`, `admin_product_tag_sales_analysis_edit`, `admin_product_tag_sales_analysis_edit_page`, `admin_product_tag_sales_analysis_page` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php`, `ec-cube-enterprise/src/Eccube/Entity/Master/MtbTagSalesAnalysis.php` |
| `m03-20` | 商品管理 — 部門CSV入力 | `admin_product_category_csv_import`, `admin_product_class_category_csv_import`, `admin_product_class_name_csv_import`, `admin_product_csv_import`, `admin_product_csv_split` | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php` |

## 成果物

- `ec_enterprise_source_function_inventory.tsv`: 機能IDごとの突合ソース、Route、Table、Repository、Service。
- `ec_enterprise_source_dependency_edges.tsv`: ソース根拠つき依存候補。
- `ec_enterprise_route_inventory.tsv`: ec-cube-enterprise内のRoute定義一覧。
- `build_ec_enterprise_source_dependency_report.py`: 再生成スクリプト。

## 注意点

- 正規表現ベースの静的解析であり、DI設定・動的Route名・動的Service呼び出しは完全には拾わない。
- 共有テーブルは影響候補であり、実際の同一レコード・同一条件はPR差分で確認する。
- 設計書がpf-eccube3由来の機能は、ec-cube-enterpriseソースへの突合結果を優先して扱う。
