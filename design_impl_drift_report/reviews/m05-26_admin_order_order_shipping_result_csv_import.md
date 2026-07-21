OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f2639-5b3e-7bf1-897c-36154610b354
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-26_admin_order_order_shipping_result_csv_import
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-26_admin_order_order_shipping_result_csv_import.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html
- 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube （必要に応じ /home/y-saito/Developments/ec-cube-enterprise 全体）

## 手順
1. 差分候補JSONの各findingについて、designRef(設計書 file:line)とimplRef(実装 file:line)を**実際に開いて**突き合わせる。
2. 次の観点で批判的に指摘（各指摘に file:line 根拠を付ける）:
   - 誤検知(FALSE_POSITIVE): 実装は別ファイル/別ルート/別名で設計どおり実現、または引用/行番号が誤り。
   - 見落とし(MISSED): 設計書の重要節（処理フロー/判定順序/バリデーション/DB操作/権限/エラー処理/セッション等）で実装と異なるのにfindingsに無い差分。
   - 根拠不備(WEAK_EVIDENCE): designRef/implRefが存在しない・的外れ・引用が創作。
   - 重要度誤り(SEVERITY): high/med/lowが業務影響と不整合。
3. 各指摘を「種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応」で簡潔に列挙。
4. 最後に必ず1行: VERDICT: false_positive=<n>, missed=<n>, weak_evidence=<n>, 総合=<信頼できる|要修正|大幅要修正>

warning: Codex could not find bubblewrap on PATH. Install bubblewrap with your OS package manager. See the sandbox prerequisites: https://developers.openai.com/codex/concepts/sandboxing#prerequisites. Codex will use the bundled bubblewrap in the meantime.
codex
読み取り専用で、まず候補JSONと設計書・実装参照の位置を確認します。対象が差分監査なので、根拠行の実在確認を優先してから実装側の周辺ルートを追います。
exec
/bin/bash -lc "pwd && rg --files /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3 | rg 'm05-26_admin_order_order_shipping_result_csv_import\\.html"'$'"' && rg --files /home/y-saito/Developments/ec-cube-enterprise/src/Eccube | head -200" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/hareruya-design-docs
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/EccubeNav.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/EccubeTwigBlock.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/Constant.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/ConnectionType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/PurchaseProductListOrderBy.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/ProductListDisplayMode.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/EccubeConfig.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventSubscriber/RestockNotificationPostCommitSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallPluginController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiSectionUpsertMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerUpdateMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiStockProcessMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/TestMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiProductClassDeleteMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/UsedCardController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/MailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseHistoryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchProductController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AbstractCsvImportController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/TemplateController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/PluginController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/EntityExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/CreationTenantFlow.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/CartFlow.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/OrderFlow.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/ForwardOnly.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/ShoppingFlow.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/FormAppend.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockBulkApprovalController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockApprovalListController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/BarcodeReplacementListController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockApprovalController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/Encoder/PasswordEncoder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Validator/EmailValidator/NoRFCEmailValidator.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Annotation/FormAppend.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/MasterdataController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/LogController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SystemController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/MemberController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/PermissionAccessUrlController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/AuthorityController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/LoginHistoryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Session.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/ShopController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/PaymentController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/TradeLawController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/CustomerCsvController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/AdditionalSystemController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/MailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/CalendarController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/CsvController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/MemberProvider.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/CustomerProvider.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallMailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Storage/Handler/SameSiteNoneCompatSessionHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeCsvController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/SearchEventController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/CartController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/DeckDetailedSearchModalController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/SaleTwoRowController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/AutoNewItemController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/EventDetailedSearchModalController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/ProductRecommendController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/CalendarController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractShoppingController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/RepeatScheduleController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/ScheduleController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryRegistrationController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/BannerController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/RepositoryExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TwigIncludeExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TemplateEventExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/SafeTextmailEscaperExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IgnoreTwigSandboxErrorExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IsAccessibleRouteExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IgnoreRoutingNotFoundExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/JsonDisplayExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IntlExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/CartServiceExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/CsrfExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaxExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeBlockExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Messenger/DashboardController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Http/Authentication/EccubeAuthenticationFailureHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Http/Authentication/EccubeAuthenticationSuccessHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Http/Authentication/EccubeLogoutSuccessHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Loader/LocaleFilesystemLoader.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Template.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Sandbox/SecurityPolicyDecorator.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/CsvFixture.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/Loader.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/Executor/DbalExecutor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Smaregi/Api/Transaction/TransactionDetailDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Smaregi/Api/Transaction/TransactionDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/RestockNotificationOnStockHistoryEntityListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/TenantEventSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/CategoryNavCacheInvalidationSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/StockMoveTransferEventSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/CustomerIdSetSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/InitSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/TaxRuleEventSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/GuestIdSetSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Repository/Master/GetBuyingCardsQueryResponseDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Repository/MypagePurchaseHistoryQueryRowDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereClause.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinClause.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereCustomizer.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByCustomizer.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/QueryCustomizer.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinCustomizer.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/Queries.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByClause.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CloudLogs/AWS/CloudWatchJsonConfigurator.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/Purchase/HistorySearchDataDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/OtcBuyOrder/HistorySearchDataDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/OtcBuyOrder/SearchDataDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/Types/UTCDateTimeTzType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/Types/UTCDateTimeType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Purchase/BulkPurchaseIdService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/CustomerDeleteFilter.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/OrderStatusFilter.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/NoStockHiddenFilter.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Calculator/OrderItemCollection.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryNetBulkCombinedLineViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryOtcIndivisualLineViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryOtcCombinedLineViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryNetBulkSectionViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryNetDetailViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryRowDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryNetIndivisualLineViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryNetLowPriceBandRowViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryNetCardLineViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryOtcProductLineViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryOtcDetailViewDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Mapping/Driver/TraitProxyAttributeDriver.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Mapping/Driver/NopAttributeDriver.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Mapping/Driver/ReloadSafeAttributeDriver.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Query/Normalize.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Query/Extract.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/DeckBuilder/BuildSaveDataResultDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/EntityManagers/WriteOnlyEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/EntityManagers/ReadOnlyEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/MailUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductFinder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ShopUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/MemberUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateBuyOrderDetailDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDetailDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateBuyOrderDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/ProductSearchSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/PurchaseSearchSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>m05-26_admin_order_order_shipping_result_csv_import（管理画面_受注管理_出荷実績インポート登録） - 機能仕様書</title>
     7	  <style>
     8	:root {
     9	  --bg: #ffffff;
    10	  --panel: #fffdf8;
    11	  --text: #2b2a26;
    12	  --muted: #7a756a;
    13	  --line: #d6cdbd;
    14	  --line-soft: #ebe2d3;
    15	  --band: #f3ede1;
    16	  --clay: #c25a37;
    17	  --clay-soft: #f4e6dd;
    18	  --olive: #5f7048;
    19	  --olive-soft: #e9ecdf;
    20	}
    21	* { box-sizing: border-box; }
    22	body {
    23	  margin: 0;
    24	  background: var(--bg);
    25	  color: var(--text);
    26	  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Yu Gothic", Meiryo, sans-serif;
    27	  font-size: 14px;
    28	  line-height: 1.7;
    29	}
    30	.page {
    31	  display: grid;
    32	  grid-template-columns: 280px minmax(0, 1fr);
    33	  gap: 32px;
    34	  max-width: 1480px;
    35	  margin: 0 auto;
    36	  padding: 28px 28px 64px;
    37	}
    38	.sidebar {
    39	  position: sticky;
    40	  top: 24px;
    41	  align-self: start;
    42	  max-height: calc(100vh - 48px);
    43	  overflow-y: auto;
    44	  padding-right: 12px;
    45	  border-right: 1px solid var(--line-soft);
    46	}
    47	.sidebar-title {
    48	  margin: 0 0 10px;
    49	  color: var(--muted);
    50	  font-size: 12px;
    51	  font-weight: 700;
    52	  letter-spacing: .06em;
    53	  text-transform: uppercase;
    54	}
    55	.toc a {
    56	  display: block;
    57	  padding: 4px 0 4px 12px;
    58	  border-left: 2px solid var(--line-soft);
    59	  color: var(--muted);
    60	  text-decoration: none;
    61	}
    62	.toc a:hover { color: var(--clay); border-left-color: var(--clay); }
    63	.toc .lv3 { padding-left: 24px; font-size: 13px; }
    64	.doc-content { min-width: 0; }
    65	header.page-header {
    66	  margin-bottom: 24px;
    67	  padding-bottom: 18px;
    68	  border-bottom: 1px solid var(--line);
    69	}
    70	.crumb {
    71	  margin: 0 0 8px;
    72	  color: var(--muted);
    73	  font-size: 13px;
    74	}
    75	h1 { margin: 0; font-size: 28px; line-height: 1.3; }
    76	h2 {
    77	  margin: 34px 0 12px;
    78	  padding-bottom: 7px;
    79	  border-bottom: 2px solid var(--clay);
    80	  font-size: 21px;
    81	}
    82	h3 { margin: 26px 0 10px; font-size: 17px; color: var(--olive); }
    83	h4 { margin: 20px 0 8px; font-size: 15px; color: var(--muted); }
    84	p { margin: 9px 0; }
    85	a { color: var(--clay); }
    86	code {
    87	  padding: 1px 5px;
    88	  border-radius: 5px;
    89	  background: var(--band);
    90	  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    91	  font-size: 90%;
    92	}
    93	pre {
    94	  overflow-x: auto;
    95	  padding: 12px 14px;
    96	  border: 1px solid var(--line);
    97	  border-radius: 8px;
    98	  background: var(--panel);
    99	}
   100	pre code { padding: 0; background: transparent; }
   101	hr { margin: 26px 0; border: 0; border-top: 1px solid var(--line); }
   102	ul, ol { margin: 9px 0; padding-left: 26px; }
   103	li { margin: 3px 0; }
   104	.table-wrap {
   105	  overflow-x: auto;
   106	  margin: 14px 0 22px;
   107	  border: 1px solid var(--line);
   108	  border-radius: 8px;
   109	  background: var(--panel);
   110	}
   111	table {
   112	  width: 100%;
   113	  min-width: 760px;
   114	  border-collapse: collapse;
   115	  font-size: 13px;
   116	}
   117	th, td {
   118	  border: 1px solid var(--line-soft);
   119	  padding: 7px 9px;
   120	  text-align: left;
   121	  vertical-align: top;
   122	}
   123	th {
   124	  position: sticky;
   125	  top: 0;
   126	  background: var(--band);
   127	  font-weight: 700;
   128	  white-space: nowrap;
   129	}
   130	tbody tr:nth-child(even) { background: #fffaf0; }
   131	.screen-item-table table { min-width: 1120px; }
   132	.section-row td {
   133	  background: var(--olive-soft);
   134	  color: var(--olive);
   135	  font-weight: 700;
   136	}
   137	.tabbed-note {
   138	  white-space: pre-wrap;
   139	  overflow-x: auto;
   140	  padding: 10px 12px;
   141	  border-left: 3px solid var(--olive);
   142	  background: var(--panel);
   143	}
   144	details {
   145	  margin: 34px 0 12px;
   146	}
   147	details > summary {
   148	  cursor: pointer;
   149	  padding-bottom: 7px;
   150	  border-bottom: 2px solid var(--clay);
   151	  font-size: 21px;
   152	  font-weight: 700;
   153	  list-style: revert;
   154	}
   155	details[open] > summary { margin-bottom: 12px; }
   156	footer {
   157	  margin-top: 48px;
   158	  padding-top: 16px;
   159	  border-top: 1px solid var(--line);
   160	  color: var(--muted);
   161	  font-size: 12px;
   162	}
   163	@media (max-width: 900px) {
   164	  .page { display: block; padding: 20px 16px 48px; }
   165	  .sidebar {
   166	    position: static;
   167	    max-height: none;
   168	    margin-bottom: 24px;
   169	    padding-right: 0;
   170	    border-right: 0;
   171	    border-bottom: 1px solid var(--line-soft);
   172	    padding-bottom: 16px;
   173	  }
   174	  h1 { font-size: 23px; }
   175	}
   176	  </style>
   177	</head>
   178	<body>
   179	  <div class="page">
   180	    <aside class="sidebar">
   181	      <p class="sidebar-title">On this page</p>
   182	      <nav class="toc"><a class="lv2" href="#概要">概要</a>
   183	<a class="lv2" href="#リニューアル移行時の扱い">リニューアル移行時の扱い</a>
   184	<a class="lv2" href="#利用者視点の入口">利用者視点の入口</a>
   185	<a class="lv2" href="#フロント挙動">フロント挙動</a>
   186	<a class="lv2" href="#処理フロー">処理フロー</a>
   187	<a class="lv3" href="#アップロード画面を開く-GET-admin-shipping-result-csv-import">アップロード画面を開く（GET `admin_shipping_result_csv_import`）</a>
   188	<a class="lv3" href="#CSVまたはTSVを取り込む-POST-admin-shipping-result-csv-upload">CSVまたはTSVを取り込む（POST `admin_shipping_result_csv_upload`）</a>
   189	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   190	<a class="lv3" href="#入力項目">入力項目</a>
   191	<a class="lv3" href="#ファイル内の論理入力-確認値">ファイル内の論理入力（確認値）</a>
   192	<a class="lv3" href="#エッジケース">エッジケース</a>
   193	<a class="lv2" href="#データ整合性">データ整合性</a>
   194	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   195	<a class="lv2" href="#入出力">入出力</a>
   196	<a class="lv2" href="#DBカラム">DBカラム</a>
   197	<a class="lv2" href="#バリデーション">バリデーション</a>
   198	<a class="lv2" href="#権限・認可">権限・認可</a>
   199	<a class="lv2" href="#画面遷移">画面遷移</a>
   200	<a class="lv2" href="#エラー処理">エラー処理</a>
   201	<a class="lv2" href="#試行制限">試行制限</a>
   202	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   203	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   204	<a class="lv2" href="#Cookie">Cookie</a>
   205	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a>
   206	<a class="lv2" href="#ec-cube-enterprise-Symfony側-での差分読みポイント">ec-cube-enterprise（Symfony側）での差分読みポイント</a>
   207	<a class="lv2" href="#調査補助-ソース位置の目安">調査補助（ソース位置の目安）</a>
   208	<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a></nav>
   209	    </aside>
   210	    <main class="doc-content">
   211	      <header class="page-header">
   212	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md</p>
   213	        <h1>m05-26_admin_order_order_shipping_result_csv_import（管理画面_受注管理_出荷実績インポート登録）</h1>
   214	      </header>
   215	      <h2 id="概要">概要</h2>
   216	<p>管理画面ナビゲーションに「出荷実績インポート登録」として現れる機能である。プラグインに定義された固定列のCSVまたはTSVをアップロードし、対象受注について出荷関連の日時・伝票・配送コミット日・一部場合に注文ステータスをまとめて反映する。</p>
   217	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。</p>
   218	<p>対象チャネルはブラウザ経由の EC-CUBE3 管理画面および HareruyaEc プラグイン（<code>pf-eccube3</code> に同梱のソースを確認値とする）。コアのみのSymfony移行済み構成（単体リポジトリ <code>ec-cube-enterprise</code> のみ）とはルートや副作用が異なりうるので、末尾の調査補助に差分の読みどころを示す。</p>
   219	<p>本機能のカスタマイズ区分は現行踏襲であり、画面挙動と処理フローは現行リポ pf-eccube3（HareruyaEc プラグイン）の実装を確認値とし、永続化に関わるテーブル・列の記述は ec-cube-enterprise を正とする。</p>
   220	<hr>
   221	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   222	<p>DB関連の記述は ec-cube-enterprise を正とする。本機能は現行ではプラグイン固有の親子モデルで実装されており、移行先とテーブル構成に差がある。</p>
   223	<div class="table-wrap"><table><thead><tr><th>観点</th><th>現行（pf-eccube3 / HareruyaEc プラグイン）</th><th>移行先（ec-cube-enterprise）</th></tr></thead><tbody><tr><td>親注文の状態</td><td><code>dtb_order</code> の状態列を出荷完了相当へ更新</td><td>同一テーブル。受注ステータスを保持する列で対応する。</td></tr><tr><td>出荷実施日時・送り状番号</td><td>プラグイン固有の注文サブ表（<code>dtb_order_sub</code>）に出荷実施日時・送り状番号を保持</td><td><code>dtb_order_sub</code> に該当するテーブルは ec-cube-enterprise に存在しない。出荷日は <code>dtb_shipping.shipping_date</code>、送り状番号は <code>dtb_shipping.tracking_number</code> が担う構成へ移行する。サブ表側に持っていた「初回のみ状態差し替え」のゲート列の移行先は ec-cube-enterprise 実装で要確認。</td></tr><tr><td>配送コミット日時</td><td>配送（<code>dtb_shipping</code> 相当）の出荷コミット日時列へ入力日を一律セット</td><td><code>dtb_shipping</code> に出荷コミット日時に相当する列があるかは ec-cube-enterprise 実装で要確認。出荷日は <code>dtb_shipping.shipping_date</code> で保持する。</td></tr><tr><td>同時実行制御</td><td>MySQL の名前付き接続ロック関数（GET_LOCK / IS_FREE_LOCK）</td><td>ec-cube-enterprise では PostgreSQL の advisory lock（<code>pg_advisory_lock</code> / <code>pg_try_advisory_lock</code>、<code>OrderRepository</code>）で実装。ロック方式が現行と異なる。</td></tr></tbody></table></div>
   224	<p>注文サブ表（<code>dtb_order_sub</code>）の有無は現行・移行先で異なるため、移行時はサブ表の各列を配送（<code>dtb_shipping</code>）側の対応列へ写像する設計確認が必要である。</p>
   225	<hr>
   226	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   227	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>側メニュー「受注管理」配下などから当画面へ遷移</td><td><code>GET /{admin_route}/order/shipping_result_csv/import</code></td><td>アップロードフォームと、列一覧のヒントとなるフォーマット表が表示される。</td></tr><tr><td>「CSV，TSVファイルのアップロード」を押してファイル送信</td><td><code>POST /{admin_route}/order/shipping_result_csv/upload</code></td><td>送信ファイルが処理され、成否メッセージとともに同系の一覧画面へリダイレクトされる構成になる。</td></tr></tbody></table></div>
   228	<hr>
   229	<h2 id="フロント挙動">フロント挙動</h2>
   230	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>画面上部がアップロードカード。見出しは「出荷実績登録CSV，TSV」に相当する文言。入力はファイル1系。視覚説明として全列ヘッダ名を並べた表が続く。</td></tr><tr><td>JS 挙動</td><td>メインHTMLブロックのみではプラグインテンプレートは送信ボタン中心の経路となる。レイアウトでスピナー用資産を参照しているが、自動抑止処理の有無はテンプレと実送信の両方から確認すること。</td></tr><tr><td>CSS・レイアウト</td><td>管理側既定のBootstrap 3系テーマに従う。</td></tr><tr><td>モーダル・ポップアップ</td><td>アップロード前の確認ダイアログは設けられていない。</td></tr></tbody></table></div>
   231	<hr>
   232	<h2 id="処理フロー">処理フロー</h2>
   233	<h3 id="アップロード画面を開く-GET-admin-shipping-result-csv-import">アップロード画面を開く（GET <code>admin_shipping_result_csv_import</code>）</h3>
   234	<ol><li>管理画面共通の認証を通過する。</li><li>管理用CSV入力フォーム型で空フォームを作り、<code>CSV_HEADER</code> 定義の連想配列をテンプレートへ渡して描画する。</li></ol>
   235	<h3 id="CSVまたはTSVを取り込む-POST-admin-shipping-result-csv-upload">CSVまたはTSVを取り込む（POST <code>admin_shipping_result_csv_upload</code>）</h3>
   236	<ol><li>管理画面共通の認証を通過する。</li><li>同一フォーム型で送信を処理する。フォーム妥当性チェック用ヘルパを呼ぶが、この呼び出しの戻りでレスポンスを打ち切る実装になっていなく、送信拒否レスポンスを返すべきときも後続に進む可能性がある（プラグインファイル列の実装順序を確認値とする）。</li><li>送信ファイルをフォーム項目から読み込む処理を走らせる。サイズ判定の分岐は空であり、サイズが0でもオブジェクト経路に残りうる（実装上の注意）。</li><li>アップロード本文を設定の一時ディレクトリへ移しUTF-8化・改行正規化・ゼロ幅除去を施したうえで <code>SplFileObject</code> 経由の取込サービスを初期化する。拡張子が <code>tsv</code> のとき区切りはタブ、それ以外は設定の既定区切りを使う。ここまでが名前付き接続ロック取得より前に走る並びにある。</li><li>取込サービス構築が失敗したときは共通の復帰へ移り、一覧GETへリダイレクトする実装となる。</li><li>MySQL関数で「当該名称のロックが他接続により保持されていない」ことを確認し、保持されていれば「既に処理中」を意味するメッセージをフラッシュへ積み一覧へ復帰する。この段階ではまだ自分でロックを取らない。</li><li>名前付き接続ロックの取得処理を試み、失敗した場合はロック失敗系の異常終了となる。</li><li>期待ヘッダ集合と、アップロード1行目の列名から「必須でない側の列」を差し引いた残りが一致することをチェックする。一致しなければフォーマット誤りとして異常終了。</li><li>データ行が1行も無ければ異常終了。</li><li>ORM側の実行時SQLログを抑止したうえでトランザクション開始し、サービス側のループへ入る。</li><li>サービス側で各行について列数・注文番号必須を検証したあと、<code>sprintf</code> で桁埋めされた注文番号でサブ注文情報を検索する。無ければ行番号付きエラーとして異常終了。</li><li>出荷日セルが空なら、その行は <code>continue</code> でスキップし、親注文の状態・サブ伝票・送り状・配送コミット日時のいずれも更新しない（現行 <code>OrderCsv.php</code>、移行先 <code>Service/Csv/OrderCsv.php</code> ともに空出荷日でスキップ）。</li><li>出荷日が空でなく親注文に会員が紐付いていない場合は異常終了。</li><li>出荷日を日時コンストラクタへ渡して解釈し、例外なら異常終了。</li><li>サブ側の出荷実施日時がこれまで無かった場合のみ、親注文の状態を「出荷完了」相当へ差し替え、サブに出荷日と送り状番号をセットし、ポイント等のために更新対象配列へ積む。いずれの場合も当該注文にぶら下がる全配送オブジェクトについて出荷コミット日時を入力した日へ揃える。</li><li>ループ終了後にフラッシュ実行し、そのトランザクション本体をサービス側で終了処理する。</li><li>コントローラの try 経路ですでにサービス側でコミットが完了している並びにある。続けて try の外側でポイント付与・出荷完了メール送信・別系ポイント付与が呼び出され、それらでの例外処理はサービス側の try と独立している確認値となる。</li><li>成功メッセージを積み、<code>render</code> が一時ファイル掃除を試みつつ一覧GETへリダイレクトさせる構成になる。</li></ol>
   237	<hr>
   238	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   239	<p>本機能本体は金額再計算などの複合計算を行わず、状態と日時・伝票文字列および配送側コミット日時の代入に限られる。</p>
   240	<p>業務コード定数で定める日本語列名の集合と、画面上のヒントとしての並びである。プラグインバージョンでは会社名〜住所〜配送先項目の並びにおいて、<code>配送先_住所3</code> 相当の区分は一覧に載らない。また取込サービス側のヘッダ比較は「必須でない側のリスト」と差し引き照合となる。</p>
   241	<h3 id="入力項目">入力項目</h3>
   242	<p>本画面のアップロードフォームにおける利用者入力はファイル選択のみとなる。</p>
   243	<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>CSV，TSVファイル選択（ラベル相当）</td><td>必須</td><td>環境により <code>eccube_csv_size</code> 等に相当するサイズ設定の上限依存</td><td>選択なし</td><td><code>import_file</code>。マッピングされない送信項目。Symfonyのファイル制約に従う。取込サービス側では一時ディレクトリへ移動してから処理する。</td></tr></tbody></table></div>
   244	<h3 id="ファイル内の論理入力-確認値">ファイル内の論理入力（確認値）</h3>
   245	<div class="table-wrap"><table><thead><tr><th>論理入力</th><th>行ごとの要件</th><th>結果への作用</th></tr></thead><tbody><tr><td>注文番号</td><td>ヘッダ照合済み行列のうち値が欠けない</td><td>桁埋め付き検索での突合鍵となる。無いときは未定義として異常終了。</td></tr><tr><td>出荷日</td><td>空許容</td><td>空のとき当該行はスキップされ、親・サブ状態・伝票・配送コミット日時のいずれも更新されない。</td></tr><tr><td>送り状No.</td><td>特に空禁止のチェックは取込サービス側の主要経路になく、型は行からそのまま文字列代入に使われる確認値となる。</td><td></td></tr></tbody></table></div>
   246	<h3 id="エッジケース">エッジケース</h3>
   247	<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>同時処理のロックが取れない</td><td>「既に処理中」を意味する種別でメッセージを見せ一覧へリダイレクト系の復帰となる。</td></tr><tr><td>フォーム無効状態のとき</td><td>妥当性関数はエラーをフラッシュへ積みリダイレクト返却オブジェクトを返しうるが、呼び出し元がそれを返却しきれない並びにある（実装上の盲点）。実機では二重処理や未定義状態に気を付ける。</td></tr><tr><td>アップロード処理のみでロックを保持したまま接続再利用</td><td>MySQL関数ベースロックを明示解放していないので、ホスティング形態によっては同時インポート制御に依存する運用となる。</td></tr></tbody></table></div>
   248	<hr>
   249	<h2 id="データ整合性">データ整合性</h2>
   250	<p>一覧・一覧からの入力用出力・本インポートの間では、プラグインが持つ親子と配送のモデルおよび固定CSV列順に収束しない差分があると取り込み失敗や列ズレとなる。親注文状態は「対応開始に近い状態」チェックなくサブ側出荷実施日時の既存のみでゲートされている。</p>
   251	<hr>
   252	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   253	<p>外部HTTP API は呼ばず、プラグインメソッドでの副作用に委ねられる。結果はフラッシュ文言と状態更新で観察する。</p>
   254	<hr>
   255	<h2 id="入出力">入出力</h2>
   256	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td><code>multipart/form-data</code> でのアップロードファイル、およびCSRF用トークン。</td></tr><tr><td>成功時出力</td><td>成功フラッシュ付き一覧GETへのリダイレクト応答が基本。別途ポイント・メール送信が同期的に実行される確認値となる。</td></tr><tr><td>失敗時出力</td><td>失敗フラッシュと一覧への復帰。トランザクションは例外時ロールバックの経路となる。</td></tr></tbody></table></div>
   257	<hr>
   258	<h2 id="DBカラム">DBカラム</h2>
   259	<p>型の細部までの網羅はスキーマ照会を正とする。本作業では少なくとも次の側面が読み変わりうる。</p>
   260	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td>親注文</td><td>状態</td><td>出荷完了相当へ代入されうる。</td></tr><tr><td>注文サブ</td><td>出荷実施の日時、送り状番号類</td><td>「初回のみ」状態差し替え時にセットされる側面がある。</td></tr><tr><td>配送先</td><td>出荷コミット日時相当</td><td><code>出荷日</code> が空の行はスキップされ更新されない。出荷日がある行で親の配送一覧を走査して出荷コミット日時をセットする。</td></tr></tbody></table></div>

exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-26_admin_order_order_shipping_result_csv_import.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-26_admin_order_order_shipping_result_csv_import",
  "title": "m05-26_admin_order_order_shipping_result_csv_import（管理画面_受注管理_出荷実績インポート登録）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html",
  "findings": [
    {
      "dimension": "②業務ルール・計算",
      "severity": "high",
      "designRef": "functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:114",
      "designQuote": "親注文状態は「対応開始に近い状態」チェックなくサブ側出荷実施日時の既存のみでゲートされている。",
      "implRef": "src/Eccube/Service/Csv/OrderCsv.php:132",
      "difference": "設計は親注文の状態差し替えを「サブ側出荷実施日時の既存有無のみ」でゲートし、受注ステータス条件は課さない（設計step15も同旨）。実装はOrderCsv.php:132で `$isPreDeliv = $order->getOrderStatus()?->getId() === OrderStatus::PRE_DELIV;` を追加し、133行 `if ($isPreDeliv && $order->getShippingDate() === null)` の両条件成立時のみ状態を出荷完了(DELIVERED)へ差し替える。出荷指示(PRE_DELIV)でない受注は設計では更新対象になり得るが、実装では親状態・出荷日・送り状番号の更新から除外される。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "src/Eccube/Service/Csv/OrderCsv.php:132-137（isPreDeliv追加＋両条件ゲート）。設計md:114および設計step15（サブ側出荷実施日時の既存のみでゲート、状態チェックなし）。"
    },
    {
      "dimension": "④DBカラム・DB操作・テーブル",
      "severity": "high",
      "designRef": "functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:22",
      "designQuote": "出荷日は `dtb_shipping.shipping_date`、送り状番号は `dtb_shipping.tracking_number` が担う構成へ移行する",
      "implRef": "src/Eccube/Service/Csv/OrderCsv.php:136",
      "difference": "設計は移行先構成として出荷日を dtb_shipping.shipping_date、送り状番号を dtb_shipping.tracking_number に保持すると規定。実装はOrderCsv.php:136-137で `$order->setShippingDate($shippingDate)`（Order.php:672 dtb_order.shipping_date）と `$order->setInvoiceNumber($invoiceNumber)`（Order.php:693 dtb_order.invoice_number）で親注文側へ保存する。配送側ループ(OrderCsv.php:144)は `setShippingCommitDate`（dtb_shipping.shipping_commit_date）のみ設定し、dtb_shipping.shipping_date / tracking_number は本取込で更新しない。保存先テーブル・列が設計と異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "OrderCsv.php:136-137,144。Order.php:672(shipping_date),693(invoice_number)はdtb_order列。Shipping.php:114(shipping_date),117(tracking_number),754(shipping_commit_date)。実装はdtb_shippingのshipping_date/tracking_numberを触らない。"
    },
    {
      "dimension": "①ルート/HTTPメソッド",
      "severity": "med",
      "designRef": "functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:229",
      "designQuote": "`admin_shipping_result_csv_upload` … `POST` … `/{admin_route}/order/shipping_result_csv/upload`",
      "implRef": "src/Eccube/Controller/Admin/Order/OrderCsvController.php:265",
      "difference": "設計はPOSTのパスを `.../shipping_result_csv/upload` とする。実装のPOSTルート(name=admin_shipping_result_csv_upload, methods=['POST'])は path が `/%eccube_admin_route%/order/shipping_result_csv/import`（265行）で、GET画面(240行 path=同 import, name=admin_shipping_result_csv_import)と同一パスをHTTPメソッドで分岐している。ルート名は一致するがURLパスが `upload` ではなく `import`。ソース全体を検索しても `shipping_result_csv/upload` パスは存在しない。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "OrderCsvController.php:240-242(GET path import),265(POST path import, name upload)。`grep -rn shipping_result_csv/upload src/` はヒット0件。"
    },
    {
      "dimension": "⑧バッチ/API入出力・再実行性",
      "severity": "med",
      "designRef": "functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:75",
      "designQuote": "続けて try の外側でポイント付与・出荷完了メール送信・別系ポイント付与が呼び出され、それらでの例外処理はサービス側の try と独立している確認値となる。",
      "implRef": "src/Eccube/Controller/Admin/Order/OrderCsvController.php:313",
      "difference": "設計は成功後処理（ポイント付与・出荷完了メール・別系ポイント）を try の外側で独立実行する。実装はポイント付与(pointService->gainPoints)とスマレジ発生ポイント連携ジョブ登録を try 内かつ beginTransaction/commit の内側（315-320行付近、commit は322行）で実行し、失敗時は import 全体がロールバックされる。commit後(324-327行)に実行されるのは dispatchGainPointMessage のみ。設計の「トランザクションと独立」ではない。加えて出荷完了メール送信に相当する処理が実装に存在しない（controllerに mail/MailService 参照が皆無）。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "OrderCsvController.php:311(beginTransaction),313-320(try内gainPoints/registerGainPointJob),322(commit),324-327(commit後dispatchのみ),328(catchでrollback)。`grep mail|MailService` はcontrollerでヒット0件。"
    },
    {
      "dimension": "④DBカラム・DB操作・テーブル",
      "severity": "med",
      "designRef": "functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:84",
      "designQuote": "プラグインバージョンでは会社名〜住所〜配送先項目の並びにおいて、`配送先_住所3` 相当の区分は一覧に載らない。",
      "implRef": "src/Eccube/Controller/Admin/Order/OrderCsvController.php:97",
      "difference": "設計（挙動の正=pf-eccube3プラグイン）では固定列一覧に `配送先_住所3` が含まれない。実装の CSV_HEADER(97行) / NOT_REQUIRED_CSV_HEADER(170行) には `配送先_住所3` が含まれ列数が1多い。ヘッダ照合(checkHeaderValues/checkHeaderSize)は必須外リスト差し引き後にサイズ一致を要求するため、pf-eccube3側の出力列数を想定したCSVでは列ズレ・取込失敗となり得る。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "OrderCsvController.php:97,170に `配送先_住所3` 定義あり。設計md:84は現行(plugin)に当該列なしと明記。OrderCsv.php:106 checkHeaderSizeで列数一致要求。"
    },
    {
      "dimension": "③バリデーション",
      "severity": "low",
      "designRef": "functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:61",
      "designQuote": "サイズ判定の分岐は空であり、サイズが0でもオブジェクト経路に残りうる（実装上の注意）。",
      "implRef": "src/Eccube/Service/Csv/AbstractCsvService.php:132",
      "difference": "設計（pf-eccube3挙動）ではサイズ0判定の分岐が空で、サイズ0でも処理経路に残る。実装 getFormFile(AbstractCsvService.php:129-134)は `if ($formFile === null || $formFile->getSize() === 0) return null;` とサイズ0を明示ガードし、呼び出し元(OrderCsvController.php:272-276)で render+一覧リダイレクトへ復帰する。設計が指摘する挙動と異なり、サイズ0は取込されない。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "AbstractCsvService.php:132（null||getSize()===0 で return null）。OrderCsvController.php:271-276（formFile===null時 render+redirect）。"
    }
  ]
}

codex
候補JSONのdesignRefはMarkdown行番号ですが、実際に提示された正本はHTMLです。HTML側の該当箇所は確認できたので、次に実装の参照行と周辺の検索結果を開いて、引用が実コードと一致しているかを見ます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php | sed -n '1,380p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Controller\Admin\Order;
    17	
    18	use Eccube\Controller\AbstractController;
    19	use Eccube\Form\Type\Admin\CsvImportType;
    20	use Eccube\Repository\Master\OrderStatusRepository;
    21	use Eccube\Repository\OrderRepository;
    22	use Eccube\Service\Csv\OrderCsv;
    23	use Eccube\Service\CsvExportService;
    24	use Eccube\Service\PointService;
    25	use Eccube\Service\Smaregi\SmaregiOrderGainPointEventService;
    26	use Symfony\Bridge\Twig\Attribute\Template;
    27	use Symfony\Component\HttpFoundation\Request;
    28	use Symfony\Component\HttpFoundation\Response;
    29	use Symfony\Component\Routing\Attribute\Route;
    30	
    31	class OrderCsvController extends AbstractController
    32	{
    33	    public function __construct(
    34	        protected OrderCsv $orderCsv,
    35	        protected CsvExportService $csvExportService,
    36	        protected OrderRepository $orderRepository,
    37	        protected OrderStatusRepository $orderStatusRepository,
    38	        private readonly PointService $pointService,
    39	        private readonly SmaregiOrderGainPointEventService $smaregiOrderGainPointEventService,
    40	    ) {
    41	    }
    42	
    43	    public const CSV_HEADER = [
    44	        '注文番号' => '注文番号',
    45	        '会員ID' => '会員ID',
    46	        'お名前(姓)' => 'お名前(姓)',
    47	        'お名前(名)' => 'お名前(名)',
    48	        'お名前(セイ)' => 'お名前(セイ)',
    49	        'お名前(メイ)' => 'お名前(メイ)',
    50	        '会社名' => '会社名',
    51	        '郵便番号1' => '郵便番号1',
    52	        '郵便番号2' => '郵便番号2',
    53	        '都道府県(ID)' => '都道府県(ID)',
    54	        '都道府県(名称)' => '都道府県(名称)',
    55	        '住所1' => '住所1',
    56	        '住所2' => '住所2',
    57	        '住所3' => '住所3',
    58	        'メールアドレス' => 'メールアドレス',
    59	        'TEL1' => 'TEL1',
    60	        'TEL2' => 'TEL2',
    61	        'TEL3' => 'TEL3',
    62	        'FAX1' => 'FAX1',
    63	        'FAX2' => 'FAX2',
    64	        'FAX3' => 'FAX3',
    65	        '性別(ID)' => '性別(ID)',
    66	        '性別(名称)' => '性別(名称)',
    67	        '職業(ID)' => '職業(ID)',
    68	        '職業(名称)' => '職業(名称)',
    69	        '誕生日' => '誕生日',
    70	        'ショップ用メモ欄' => 'ショップ用メモ欄',
    71	        '小計' => '小計',
    72	        '値引き' => '値引き',
    73	        '送料合計' => '送料合計',
    74	        '税金' => '税金',
    75	        '合計' => '合計',
    76	        '支払合計' => '支払合計',
    77	        '対応状況(ID)' => '対応状況(ID)',
    78	        '対応状況(名称)' => '対応状況(名称)',
    79	        '支払方法(ID)' => '支払方法(ID)',
    80	        '支払方法(名称)' => '支払方法(名称)',
    81	        '注文日' => '注文日',
    82	        '注文確定日' => '注文確定日',
    83	        '入金日' => '入金日',
    84	        '出荷指示日' => '出荷指示日',
    85	        '出荷日' => '出荷日',
    86	        '配送先_お名前(姓)' => '配送先_お名前(姓)',
    87	        '配送先_お名前(名)' => '配送先_お名前(名)',
    88	        '配送先_お名前(セイ)' => '配送先_お名前(セイ)',
    89	        '配送先_お名前(メイ)' => '配送先_お名前(メイ)',
    90	        '配送先_会社名' => '配送先_会社名',
    91	        '配送先_郵便番号1' => '配送先_郵便番号1',
    92	        '配送先_郵便番号2' => '配送先_郵便番号2',
    93	        '配送先_都道府県(ID)' => '配送先_都道府県(ID)',
    94	        '配送先_都道府県(名称)' => '配送先_都道府県(名称)',
    95	        '配送先_住所1' => '配送先_住所1',
    96	        '配送先_住所2' => '配送先_住所2',
    97	        '配送先_住所3' => '配送先_住所3',
    98	        '配送先_TEL1' => '配送先_TEL1',
    99	        '配送先_TEL2' => '配送先_TEL2',
   100	        '配送先_TEL3' => '配送先_TEL3',
   101	        '配送先_FAX1' => '配送先_FAX1',
   102	        '配送先_FAX2' => '配送先_FAX2',
   103	        '配送先_FAX3' => '配送先_FAX3',
   104	        '配送方法(ID)' => '配送方法(ID)',
   105	        '配送方法(名称)' => '配送方法(名称)',
   106	        '送り状No.' => '送り状No.',
   107	        'お届け時間ID' => 'お届け時間ID',
   108	        'お届け時間(名称)' => 'お届け時間(名称)',
   109	        // TODO:DateTime型のカラムを追加
   110	        // 'お届け希望日' => "お届け希望日",
   111	    ];
   112	
   113	    public const REQUIRED_CSV_HEADER = [
   114	        '注文番号' => '注文番号',
   115	    ];
   116	
   117	    public const NOT_REQUIRED_CSV_HEADER = [
   118	        '会員ID' => '会員ID',
   119	        'お名前(姓)' => 'お名前(姓)',
   120	        'お名前(名)' => 'お名前(名)',
   121	        'お名前(セイ)' => 'お名前(セイ)',
   122	        'お名前(メイ)' => 'お名前(メイ)',
   123	        '会社名' => '会社名',
   124	        '郵便番号1' => '郵便番号1',
   125	        '郵便番号2' => '郵便番号2',
   126	        '都道府県(ID)' => '都道府県(ID)',
   127	        '都道府県(名称)' => '都道府県(名称)',
   128	        '住所1' => '住所1',
   129	        '住所2' => '住所2',
   130	        '住所3' => '住所3',
   131	        'メールアドレス' => 'メールアドレス',
   132	        'TEL1' => 'TEL1',
   133	        'TEL2' => 'TEL2',
   134	        'TEL3' => 'TEL3',
   135	        'FAX1' => 'FAX1',
   136	        'FAX2' => 'FAX2',
   137	        'FAX3' => 'FAX3',
   138	        '性別(ID)' => '性別(ID)',
   139	        '性別(名称)' => '性別(名称)',
   140	        '職業(ID)' => '職業(ID)',
   141	        '職業(名称)' => '職業(名称)',
   142	        '誕生日' => '誕生日',
   143	        'ショップ用メモ欄' => 'ショップ用メモ欄',
   144	        '小計' => '小計',
   145	        '値引き' => '値引き',
   146	        '送料合計' => '送料合計',
   147	        '税金' => '税金',
   148	        '合計' => '合計',
   149	        '支払合計' => '支払合計',
   150	        '対応状況(ID)' => '対応状況(ID)',
   151	        '対応状況(名称)' => '対応状況(名称)',
   152	        '支払方法(ID)' => '支払方法(ID)',
   153	        '支払方法(名称)' => '支払方法(名称)',
   154	        '注文日' => '注文日',
   155	        '注文確定日' => '注文確定日',
   156	        '入金日' => '入金日',
   157	        '出荷指示日' => '出荷指示日',
   158	        '出荷日' => '出荷日',
   159	        '配送先_お名前(姓)' => '配送先_お名前(姓)',
   160	        '配送先_お名前(名)' => '配送先_お名前(名)',
   161	        '配送先_お名前(セイ)' => '配送先_お名前(セイ)',
   162	        '配送先_お名前(メイ)' => '配送先_お名前(メイ)',
   163	        '配送先_会社名' => '配送先_会社名',
   164	        '配送先_郵便番号1' => '配送先_郵便番号1',
   165	        '配送先_郵便番号2' => '配送先_郵便番号2',
   166	        '配送先_都道府県(ID)' => '配送先_都道府県(ID)',
   167	        '配送先_都道府県(名称)' => '配送先_都道府県(名称)',
   168	        '配送先_住所1' => '配送先_住所1',
   169	        '配送先_住所2' => '配送先_住所2',
   170	        '配送先_住所3' => '配送先_住所3',
   171	        '配送先_TEL1' => '配送先_TEL1',
   172	        '配送先_TEL2' => '配送先_TEL2',
   173	        '配送先_TEL3' => '配送先_TEL3',
   174	        '配送先_FAX1' => '配送先_FAX1',
   175	        '配送先_FAX2' => '配送先_FAX2',
   176	        '配送先_FAX3' => '配送先_FAX3',
   177	        '配送方法(ID)' => '配送方法(ID)',
   178	        '配送方法(名称)' => '配送方法(名称)',
   179	        '送り状No.' => '送り状No.',
   180	        'お届け時間ID' => 'お届け時間ID',
   181	        'お届け時間(名称)' => 'お届け時間(名称)',
   182	        // TODO:DateTime型のカラムを追加
   183	        // 'お届け希望日' => "お届け希望日",
   184	    ];
   185	
   186	    /**
   187	     * 出荷実績インポート用CSVエクスポート
   188	     *
   189	     * @param Request $request
   190	     *
   191	     * @return Response
   192	     */
   193	    #[Route(path: '/%eccube_admin_route%/order/export/order', name: 'admin_order_export_for_input', methods: ['GET', 'POST'])]
   194	    public function exportForInput(Request $request)
   195	    {
   196	        // タイムアウトを無効にする
   197	        set_time_limit(0);
   198	        // SQL Loggerを無効にする
   199	        $em = $this->entityManager;
   200	        $em->getConfiguration()->setSQLLogger(null);
   201	        // 注文情報IDを取得する
   202	        $rawOrderIds = $request->get('order_ids', []);
   203	        if (!is_array($rawOrderIds) || empty($rawOrderIds)) {
   204	            $this->addError('admin.common.select', 'admin');
   205	
   206	            $referer = $request->headers->get('referer');
   207	            if ($referer !== null && $referer !== '') {
   208	                return $this->redirect($referer);
   209	            }
   210	
   211	            return $this->redirectToRoute('admin_order');
   212	        }
   213	        $orderIdList = array_keys($rawOrderIds);
   214	
   215	        // CSVを出力する
   216	        try {
   217	            $response = $this->orderCsv->exportCsv($orderIdList);
   218	        } catch (\RuntimeException $e) {
   219	            $this->addError($e->getMessage(), 'admin');
   220	
   221	            $referer = $request->headers->get('referer');
   222	            if ($referer !== null && $referer !== '') {
   223	                return $this->redirect($referer);
   224	            }
   225	
   226	            return $this->redirectToRoute('admin_order');
   227	        }
   228	
   229	        return $response;
   230	    }
   231	
   232	    /**
   233	     * 出荷実績CSVアップロード画面
   234	     *
   235	     * @param Request $request
   236	     *
   237	     * @return Response
   238	     */
   239	    #[Route(
   240	        path: '/%eccube_admin_route%/order/shipping_result_csv/import',
   241	        name: 'admin_shipping_result_csv_import',
   242	        methods: ['GET'])
   243	    ]
   244	    #[Template(template: '@admin/Order/shipping_result_csv_import.twig')]
   245	    public function shippingResultCsv(Request $request)
   246	    {
   247	        $form = $this->formFactory->createBuilder(CsvImportType::class)->getForm();
   248	        $headers = self::CSV_HEADER;
   249	
   250	        return $this->render('@admin/Order/shipping_result_csv_import.twig', [
   251	            'form' => $form->createView(),
   252	            'headers' => $headers,
   253	            'errors' => [],
   254	            'warnings' => [],
   255	        ]);
   256	    }
   257	
   258	    /**
   259	     * 出荷実績CSVアップロード
   260	     *
   261	     * @param Request $request
   262	     *
   263	     * @return Response
   264	     */
   265	    #[Route(path: '/%eccube_admin_route%/order/shipping_result_csv/import', name: 'admin_shipping_result_csv_upload', methods: ['POST'], ),]
   266	    public function shippingResultImport(Request $request)
   267	    {
   268	        $form = $this->formFactory->createBuilder(CsvImportType::class)->getForm()->handleRequest($request);
   269	
   270	        $this->orderCsv->checkFormValid($form);
   271	        $formFile = $this->orderCsv->getFormFile($form);
   272	        if ($formFile === null) {
   273	            $this->orderCsv->render();
   274	
   275	            return $this->redirectToRoute('admin_shipping_result_csv_import');
   276	        }
   277	
   278	        $data = $this->orderCsv->getImportData($formFile);
   279	        if ($data === false) {
   280	            $this->orderCsv->render();
   281	
   282	            return $this->redirectToRoute('admin_shipping_result_csv_import');
   283	        }
   284	
   285	        if (!$this->orderRepository->isFree('registerShippingResult')) {
   286	            $this->orderCsv->render();
   287	
   288	            $message = trans('admin.csv.error.data.already_executing', ['%csvName%' => '出荷実績CSV']);
   289	            $this->addError($message, 'admin');
   290	
   291	            return $this->redirectToRoute('admin_shipping_result_csv_import');
   292	        } else {
   293	            try {
   294	                if (!$this->orderRepository->getLock('registerShippingResult')) {
   295	                    throw new \RuntimeException('admin.csv.error.data.lock_failed');
   296	                }
   297	                // ヘッダーの値が一致するかチェック
   298	                $headers = self::CSV_HEADER;
   299	                $notRequiredCsvHeader = self::NOT_REQUIRED_CSV_HEADER;
   300	                $columnHeaders = $data->getColumnHeaders();
   301	                $this->orderCsv->checkHeaderValues(array_keys($headers), $columnHeaders, array_keys($notRequiredCsvHeader));
   302	                $headerSize = count($columnHeaders);
   303	
   304	                // CSVデータが空でないかチェック
   305	                $this->orderCsv->checkDataSize($data);
   306	
   307	                $this->entityManager->getConfiguration()->setSQLLogger(null);
   308	                $this->entityManager->beginTransaction();
   309	
   310	                // CSVファイルの登録処理
   311	                $updatedOrders = $this->orderCsv->registerShippingResult($headers, $headerSize, $data);
   312	                $gainPointDispatch = [];
   313	                foreach ($updatedOrders as $updateOrder) {
   314	                    $this->pointService->gainPoints($updateOrder['order']);
   315	                    // 発生ポイントのスマレジ連携ジョブを同一トランザクションで積む（dispatch は commit 後）.
   316	                    $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($updateOrder['order']);
   317	                    if ($gainPointJob !== null) {
   318	                        $gainPointDispatch[] = ['job' => $gainPointJob, 'order' => $updateOrder['order']];
   319	                    }
   320	                }
   321	                $this->entityManager->flush();
   322	                $this->entityManager->commit();
   323	
   324	                // commit 成功後に発生ポイント連携メッセージをまとめて送信する（アウトボックス的な順序）。
   325	                foreach ($gainPointDispatch as $gainPointEntry) {
   326	                    $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointEntry['job'], $gainPointEntry['order']);
   327	                }
   328	            } catch (\Throwable $e) {
   329	                if ($this->entityManager->getConnection()->isTransactionActive()) {
   330	                    // トランザクション内でエラーが発生した場合はロールバック
   331	                    $this->entityManager->rollback();
   332	                }
   333	
   334	                $this->addError($e->getMessage(), 'admin');
   335	
   336	                $this->orderCsv->render();
   337	
   338	                return $this->redirectToRoute('admin_shipping_result_csv_import');
   339	            }
   340	
   341	            $this->addSuccess('admin.register.complete', 'admin');
   342	
   343	            $this->orderCsv->render();
   344	
   345	            return $this->redirectToRoute('admin_shipping_result_csv_import');
   346	        }
   347	    }
   348	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Service\Csv;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Common\EccubeConfig;
    20	use Eccube\Controller\Admin\Order\OrderCsvController;
    21	use Eccube\Entity\Master\OrderStatus;
    22	use Eccube\Entity\Order;
    23	use Eccube\Repository\DtbPlayerRepository;
    24	use Eccube\Repository\Master\OrderStatusRepository;
    25	use Eccube\Repository\OrderRepository;
    26	use Eccube\Service\CsvExportService;
    27	use Eccube\Service\CsvImportService;
    28	use Symfony\Component\HttpFoundation\Response;
    29	use Symfony\Component\HttpFoundation\StreamedResponse;
    30	use Symfony\Contracts\Translation\TranslatorInterface;
    31	
    32	class OrderCsv extends AbstractCsvService
    33	{
    34	    public function __construct(
    35	        protected EntityManagerInterface $entityManager,
    36	        protected TranslatorInterface $translator,
    37	        protected EccubeConfig $eccubeConfig,
    38	        protected CsvExportService $csvExportService,
    39	        protected OrderRepository $orderRepository,
    40	        protected DtbPlayerRepository $playerRepository,
    41	        protected OrderStatusRepository $orderStatusRepository,
    42	    ) {
    43	        parent::__construct(
    44	            $entityManager,
    45	            $translator,
    46	            $eccubeConfig,
    47	            OrderCsvController::CSV_HEADER,
    48	            OrderCsvController::REQUIRED_CSV_HEADER,
    49	        );
    50	    }
    51	
    52	    /**
    53	     * 出荷実績インポート用CSVを出力する
    54	     *
    55	     * @param array<int> $orderIdList
    56	     */
    57	    public function exportCsv(array $orderIdList): StreamedResponse
    58	    {
    59	        if (!$csvRows = $this->orderRepository->generateResultCsv($orderIdList)) {
    60	            throw new \RuntimeException($this->translator->trans('admin.csv.error.export.not_registered'));
    61	        }
    62	
    63	        $response = new StreamedResponse();
    64	
    65	        // $response->setCallback(function () use ($app, $csvRows) {
    66	        $response->setCallback(function () use ($csvRows): void {
    67	            // $csvService = $app['eccube.service.csv.export'];
    68	            $csvService = $this->csvExportService;
    69	            $csvService->fopen();
    70	
    71	            // ヘッダ行出力
    72	            $csvService->fputcsv(array_keys($this->csvHeader));
    73	
    74	            // データ出力
    75	            foreach ($csvRows as $csvRow) {
    76	                $csvService->fputcsv($csvRow);
    77	            }
    78	
    79	            $csvService->fclose();
    80	        });
    81	
    82	        $filename = $this->createFileName('order_');
    83	        $this->setCsvResponseHeader($response, $filename);
    84	
    85	        log_info('CSV出力ファイル名', [$filename]);
    86	
    87	        return $response;
    88	    }
    89	
    90	    /**
    91	     * 出荷実績登録処理
    92	     * 対応状況が出荷指示かつ出荷日が入力されている受注情報を更新
    93	     *
    94	     * @param array<string, string> $headers
    95	     * @param CsvImportService<int, array<int|string, string>> $data
    96	     *
    97	     * @return array<int, array{order: Order, player: \Eccube\Entity\DtbPlayer|null}>
    98	     */
    99	    public function registerShippingResult(array $headers, int $headerSize, CsvImportService $data): array
   100	    {
   101	        $requiredHeaders = $this->requiredCsvHeader;
   102	
   103	        $updatedOrders = [];
   104	        foreach ($data as $row) {
   105	            $rowIndex = $data->key() + 1;
   106	
   107	            // ヘッダーサイズチェック
   108	            $this->checkHeaderSize($headerSize, $row, $rowIndex);
   109	            // CSV必須項目入力チェック
   110	            $this->checkRequiredHeaders($requiredHeaders, $row, $rowIndex);
   111	
   112	            $order = $this->orderRepository->findOneBy(['order_number' => $row['注文番号']]);
   113	
   114	            if ($order === null) {
   115	                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered'), '注文番号', $row['注文番号'], $rowIndex));
   116	            }
   117	            if (empty($row['出荷日'])) {
   118	                continue;
   119	            }
   120	            // 非会員の場合エラーを出力
   121	            if ($order->getCustomer() === null) {
   122	                throw new \RuntimeException($this->translator->trans('admin.csv.error.customer.not_member', ['%row%' => $rowIndex]));
   123	            }
   124	            try {
   125	                $shippingDate = new \DateTime($row['出荷日']);
   126	            } catch (\Exception $e) {
   127	                $message = $this->translator->trans('admin.csv.error.exception.datetime', ['%row%' => $rowIndex, '%column%' => '出荷日']);
   128	                throw new \RuntimeException($message, $rowIndex, $e);
   129	            }
   130	            $invoiceNumber = $row['送り状No.'];
   131	            $newStatus = $this->orderStatusRepository->find(OrderStatus::DELIVERED);
   132	            $isPreDeliv = $order->getOrderStatus()?->getId() === OrderStatus::PRE_DELIV;
   133	            if ($isPreDeliv && $order->getShippingDate() === null) {
   134	                $order->setOrderStatus($newStatus);
   135	                $order
   136	                    ->setShippingDate($shippingDate)
   137	                    ->setInvoiceNumber($invoiceNumber);
   138	                $updatedOrders[] = [
   139	                    'order' => $order,
   140	                    'player' => $this->playerRepository->findOneByCustomer($order->getCustomer()),
   141	                ];
   142	            }
   143	            foreach ($order->getShippings() as $shipping) {
   144	                $shipping->setShippingCommitDate($shippingDate);
   145	            }
   146	        }
   147	
   148	        $this->entityManager->flush();
   149	
   150	        return $updatedOrders;
   151	    }
   152	
   153	    /**
   154	     * 登録、更新時の画面表示
   155	     *
   156	     * @return Response
   157	     */
   158	    public function render(): Response
   159	    {
   160	        if (!empty($this->getFileName())) {
   161	            try {
   162	                $this->deleteTempData();
   163	            } catch (\Exception $e) {
   164	                // エラーが発生しても無視する
   165	            }
   166	        }
   167	
   168	        return new Response();
   169	    }
   170	}

exec
/bin/bash -lc 'rg -n "shipping_result_csv|admin_shipping_result_csv|ShippingResult|出荷実績|shipping_commit|tracking_number|setTrackingNumber|setShippingDate|setInvoiceNumber|send.*Mail|MailService|gainPoints|registerGainPointJob|dispatchGainPointMessage" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app /home/y-saito/Developments/ec-cube-enterprise/config 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 exited 2 in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/MailController.php:24:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/MailController.php:35:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/MailController.php:99:                        $this->mailService->sendManualPurchaseMail($input);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:43:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:88:    protected MailService $mailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:103:        MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:607:            $this->mailService->sendCustomerConfirmMail($Customer, $activateUrl);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockBulkApprovalController.php:30:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockBulkApprovalController.php:42:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockBulkApprovalController.php:168:                    $this->mailService->sendStockApprovalAlertMail($approvalMember, $this->generateUrl('admin_stock_approval_list', [], UrlGeneratorInterface::ABSOLUTE_URL));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:53:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:92:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:22:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:38:    public function __construct(protected ValidatorInterface $validator, protected MailService $mailService, protected RegisterCustomerViewRepository $registerCustomerViewRepository, protected UserPasswordHasherInterface $passwordHasher)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:100:                $this->mailService->sendPasswordResetNotificationMail($Customer, $reset_url);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:43:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:68:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:330:            $this->mailService->sendStockApprovalAlertMail($approvalMember, $approvalUrl);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:38:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:104:    public function __construct(protected CartService $cartService, protected MailService $mailService, protected OrderRepository $orderRepository, protected OrderHelper $orderHelper, protected ContainerInterface $serviceContainer, protected TradeLawRepository $tradeLawRepository, protected RateLimiterFactoryInterface $shoppingConfirmIpLimiter, protected RateLimiterFactoryInterface $shoppingConfirmCustomerLimiter, protected RateLimiterFactoryInterface $shoppingCheckoutIpLimiter, protected RateLimiterFactoryInterface $shoppingCheckoutCustomerLimiter, protected BaseInfoRepository $baseInfoRepository, protected OrderItemRepository $orderItemRepository, protected UniSearchService $uniSearchService, protected DtbWaitingNumberRepository $waitingNumberRepository, protected ShoppingService $shoppingService, protected SmaregiOrderUsePointEventService $smaregiOrderUsePointEventService)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:559:            $this->mailService->sendOrderMail($Order, $customerAddressId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:53:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:82:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:517:                $this->mailService->sendStockApprovalAlertMail($approvalMember, $approvalUrl);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:822:            $this->mailService->sendStockApprovalAlertMail($approvalMember, $approvalUrl);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:36:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:62:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:175:                        $this->mailService->sendCustomerConfirmMail($Customer, $activateUrl);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:305:        $this->mailService->sendCustomerCompleteMail($Customer);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockApprovalController.php:30:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockApprovalController.php:43:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockApprovalController.php:120:                    $this->mailService->sendStockApprovalAlertMail($approvalMember, $this->generateUrl('admin_stock_approval_list', [], UrlGeneratorInterface::ABSOLUTE_URL));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:27:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:41:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:148:            $this->mailService->sendDeckEntryCompleteMail($Customer, $Deck);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:26:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:43:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:59:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:93:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:400:                    $this->mailService->sendStockApprovalAlertMail($approvalMember, $approvalUrl);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:928:                    $this->mailService->sendStockApprovalAlertMail($approvalMember, $approvalUrl);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/WithdrawController.php:26:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/WithdrawController.php:42:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/WithdrawController.php:144:                    $this->mailService->sendCustomerWithdrawMail($Customer, $email);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:39:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:66:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:305:            $this->sendApprovalNotificationMails($csvBag['approval_notification_target_members'] ?? []);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:396:            $this->sendApprovalNotificationMails($csvBag['approval_notification_target_members'] ?? []);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:410:    private function sendApprovalNotificationMails(mixed $rawIds): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:420:            $this->mailService->sendStockApprovalAlertMail($approvalMember, $approvalUrl);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php:29:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php:52:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShippingMultipleController.php:31:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShippingMultipleController.php:46:    public function __construct(protected PrefRepository $prefRepository, protected OrderRepository $orderRepository, protected OrderItemTypeRepository $orderItemTypeRepository, protected OrderHelper $orderHelper, protected CartService $cartService, protected PurchaseFlow $cartPurchaseFlow, protected BaseInfoRepository $baseInfoRepository, protected MailService $mailService)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShippingMultipleController.php:389:                    $this->mailService->sendCustomerChangeNotifyMail($Customer, $userData, trans('front.mypage.delivery.notify_title'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:35:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:83:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:266:                    $this->mailService->sendStockApprovalAlertMail($approvalMember, $this->generateUrl('admin_stock_approval_list', [], UrlGeneratorInterface::ABSOLUTE_URL));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:32:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:46:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:29:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:38:    public function __construct(private readonly MailService $mailService, private readonly CustomerRepository $customerRepository, private readonly MailHistoryRepository $mailHistoryRepository, private readonly MailHistoryEntityManager $mailHistoryEntityManager)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:92:                            $message = $this->mailService->sendCustomerMail($Customer, $formParams);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:195:                        $message = $this->mailService->sendCustomerManualMail($Customer, $formParams);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerController.php:37:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerController.php:60:    public function __construct(protected PageMaxRepository $pageMaxRepository, protected CustomerRepository $customerRepository, protected SexRepository $sexRepository, protected PrefRepository $prefRepository, protected MailService $mailService, protected CsvExportService $csvExportService, protected DtbSearchPatternRepository $dtbSearchPatternRepository, protected CsrfTokenManagerInterface $csrfTokenManager)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerController.php:208:        $this->mailService->sendAdminCustomerConfirmMail($Customer, $activateUrl);
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:122:                    url: admin_shipping_result_csv_import
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:58:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:101:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:495:                            $Shipping->setShippingDate(new \DateTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:512:                        $this->mailService->sendShippingNotifyMail($Shipping);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:565:    #[Route(path: '/%eccube_admin_route%/shipping/{id}/tracking_number', name: 'admin_shipping_update_tracking_number', requirements: ['id' => '\d+'], methods: ['PUT'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:572:        $trackingNumber = $request->get('tracking_number') ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:581:                    ['pattern' => '/^[0-9a-zA-Z-]+$/u', 'message' => trans('admin.order.tracking_number_error')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:598:            $shipping->setTrackingNumber($trackingNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:602:            $message = ['status' => 'OK', 'shipping_id' => $shipping->getId(), 'tracking_number' => $trackingNumber];
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260224000000.php:208:        $this->addSql("INSERT INTO dtb_csv (csv_type_id, creator_id, entity_name, field_name, reference_field_name, disp_name, sort_no, enabled, create_date, update_date) VALUES (3, NULL,'Eccube\\\\Entity\\\\Shipping', 'tracking_number', NULL,'出荷伝票番号', 69, True, NOW(), NOW());");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:626:                                $Shipping->setShippingDate(new \DateTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:679:                    $this->pointService->gainPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:680:                    $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:712:            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:776:            $TargetOrder->setShippingDate($now);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:778:                $Shipping->setShippingDate($now);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:811:                $this->pointService->gainPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:813:                $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:828:            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:908:                $TargetOrder->setShippingDate(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:910:                    $Shipping->setShippingDate(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:135:            if (isset($row[$columnNames['tracking_number']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:137:                if (!preg_match('/^[0-9a-zA-Z-]*$/u', $row[$columnNames['tracking_number']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:138:                    $errors[] = trans('admin.common.csv_invalid_format_line_name', ['%line%' => $line + 1, '%name%' => $columnNames['tracking_number']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:142:                $Shipping->setTrackingNumber($row[$columnNames['tracking_number']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:154:                $Shipping->setShippingDate($shippingDate);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:208:            'tracking_number' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:209:                'name' => trans('admin.order.shipping_csv.tracking_number_col'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:210:                'description' => trans('admin.order.shipping_csv.tracking_number_description'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:27:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:49:    public function __construct(protected MailService $mailService, protected OrderItemRepository $orderItemRepository, protected CategoryRepository $categoryRepository, protected DeliveryRepository $deliveryRepository, protected TaxRuleService $taxRuleService, protected ShippingRepository $shippingRepository, protected SerializerInterface $serializer, protected OrderStateMachine $orderStateMachine, protected PurchaseFlow $orderPurchaseFlow)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:244:        $this->mailService->sendShippingNotifyMail($Shipping);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:31:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:51:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:148:                        $message = $this->mailService->sendAdminOrderMail($Order, $data);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:276:                        $this->mailService->sendManualMailForBulk($Order, $mail, $bodyText, $request->request->all());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:395:                            $this->mailService->sendManualMailForBulk($Order, $mail, $body, $request->request->all());
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260226000001.php:231:        $this->addSql("INSERT INTO dtb_csv (csv_type_id, creator_id, entity_name, field_name, reference_field_name, disp_name, sort_no, enabled, create_date, update_date) VALUES (4,NULL,'Eccube\\\\Entity\\\\Shipping', 'tracking_number',NULL,'出荷伝票番号',69, True,NOW(),NOW());");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:93:                $response = $this->smaregiCustomerService->gainPoints($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:95:                // gainPoints は通常例外を投げないが、想定外例外は適用有無が不明なため自動リトライせず手動照合へ回す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:187:     * 出荷実績インポート用CSVエクスポート
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:233:     * 出荷実績CSVアップロード画面
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:240:        path: '/%eccube_admin_route%/order/shipping_result_csv/import',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:241:        name: 'admin_shipping_result_csv_import',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:244:    #[Template(template: '@admin/Order/shipping_result_csv_import.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:250:        return $this->render('@admin/Order/shipping_result_csv_import.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:259:     * 出荷実績CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:265:    #[Route(path: '/%eccube_admin_route%/order/shipping_result_csv/import', name: 'admin_shipping_result_csv_upload', methods: ['POST'], ),]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:275:            return $this->redirectToRoute('admin_shipping_result_csv_import');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:282:            return $this->redirectToRoute('admin_shipping_result_csv_import');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:285:        if (!$this->orderRepository->isFree('registerShippingResult')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:288:            $message = trans('admin.csv.error.data.already_executing', ['%csvName%' => '出荷実績CSV']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:291:            return $this->redirectToRoute('admin_shipping_result_csv_import');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:294:                if (!$this->orderRepository->getLock('registerShippingResult')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:311:                $updatedOrders = $this->orderCsv->registerShippingResult($headers, $headerSize, $data);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:314:                    $this->pointService->gainPoints($updateOrder['order']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:316:                    $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($updateOrder['order']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:326:                    $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointEntry['job'], $gainPointEntry['order']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:338:                return $this->redirectToRoute('admin_shipping_result_csv_import');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:345:            return $this->redirectToRoute('admin_shipping_result_csv_import');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/ResendMailCommand.php:18:use Eccube\Service\Admin\Order\ResendMailAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/ResendMailCommand.php:35:class ResendMailCommand extends Command
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/ResendMailCommand.php:38:        private readonly ResendMailAction $resendMailAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/ResendMailCommand.php:49:            $summary = $this->resendMailAction->handle();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:557:    public function gainPoints(Order $Order): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:197:            ->add('tracking_number', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:28: * ポイント付与と同一トランザクションで MessengerJob を INSERT し（{@see registerGainPointJob()}）、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:29: * commit 成功後に {@see dispatchGainPointMessage()} でメッセージを送る（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:45:    public function registerGainPointJob(Order $Order): ?MessengerJob
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:67:     * registerGainPointJob の flush / commit 成功後にのみ呼ぶ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:70:    public function dispatchGainPointMessage(MessengerJob $job, Order $Order): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:118:            $this->pointService->gainPoints($order, $transactionId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:185:            ->add('tracking_number', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:186:                'label' => 'admin.order.tracking_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:71:class MailService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:80:     * MailService constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:121:    public function sendCustomerConfirmMail(Customer $Customer, string $activateUrl): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:188:    public function sendCustomerCompleteMail(Customer|RegisterCustomerView $Customer): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:253:    public function sendCustomerWithdrawMail(Customer $Customer, string $email): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:318:    public function sendContactMail(array $formData, ?Customer $Customer): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:404:    public function sendOrderMail(Order $Order, int $customerAddressId): Email
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:523:    public function sendAdminCustomerConfirmMail(Customer $Customer, string $activateUrl): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:593:    public function sendAdminOrderMail(Order $Order, array $formData): Email
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:636:    public function sendPasswordResetNotificationMail(Customer|RegisterCustomerView $Customer, string $reset_url): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:704:    public function sendPasswordResetCompleteMail(Customer $Customer, string $password): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:768:    public function sendShippingNotifyMail(Shipping $Shipping): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:874:    public function sendCustomerChangeNotifyMail(Customer $Customer, array $userData, string $eventName): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:998:    public function sendCustomerMail(Customer $Customer, mixed $formData): Email
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1024:    public function sendCustomerManualMail(Customer $Customer, mixed $formData): Email
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1050:    public function sendIdentificationConfirmMail(Customer $Customer): Email
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1094:    public function sendPointExpireNotificationMail(DtbPlayer $player, int $point, \DateTimeInterface $expireDate): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1136:    public function sendOtcBuyOrderAccountingPaymentPendingMail(DtbOtcBuyOrder $OtcBuyOrder): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1192:    public function sendNoSectionAlertMail(array $products): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1230:    public function sendUpdateOtcBuyOrderSummaryErrorMail(string $errorMessage): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1268:    public function sendBlankRequiredItemCustomerAlertMail(array $blankRequiredItemCustomers): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1318:    public function sendAdjustPointVarianceMail(array $pointVarianceList): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1387:    public function sendBuyOrderCompleteMail(DtbBuyOrder $buyOrder): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1444:    public function sendBuyOrderTransferCompleteMail(DtbBuyOrder $BuyOrder): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1500:    public function sendBuyOrderAssessmentApprovalMail(DtbBuyOrder $buyOrder): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1556:    public function sendManualPurchaseMail(SendManualPurchaseMailInput $input): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1595:    public function sendCreditPaymentCompleteMail(Customer $Customer, DtbEvent $Event, DtbEventEntry $EventEntry): Email
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1642:    public function sendEventPaymentErrorAlertMail(DtbEventEntry $EventEntry, ?string $message = null): Email
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1695:    public function sendStockApprovalAlertMail(Member $Member, string $approvalUrl): ?Email
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1750:    public function sendWeeklyStockHistoryErrorMail(string $errorMessage): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1795:    public function sendFavoriteSaleNotificationMail(Customer $Customer, array $data): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1834:    public function sendProductRestockNotificationMail(DtbProductRequest $ProductRequest): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2092:    public function sendManualMailForBulk(Order $order, MailTemplate $template, string $body, array $content): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2153:    public function sendDeckEntryCompleteMail(Customer $Customer, DtbDeck $Deck): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2235:    public function sendOrderDuplicateNotificationMail(array $orderNumbers): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2283:    public function sendNotReflectedPointUsageAlertMail(array $notReflectedPointsUsage): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2329:    public function resendOrderMail(Order $Order, string $lang = ''): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Stock/RestockNotificationMailSender.php:23:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Stock/RestockNotificationMailSender.php:34:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Stock/RestockNotificationMailSender.php:80:            $this->sendMails((int) $productClassId, $baseInfoId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Stock/RestockNotificationMailSender.php:87:    private function sendMails(int $productClassId, int $baseInfoId): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Stock/RestockNotificationMailSender.php:107:            $this->sendMail($ProductRequest);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Stock/RestockNotificationMailSender.php:114:    private function sendMail(DtbProductRequest $ProductRequest): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Stock/RestockNotificationMailSender.php:116:        $sent = $this->mailService->sendProductRestockNotificationMail($ProductRequest);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:42:    public function gainPoints(Order $Order, ?int $transactionId = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:41:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:56:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:147:                    $this->mailService->sendBuyOrderTransferCompleteMail($BuyOrderForMail);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:66:        'order' => 'o.name01', 'orderer' => 'o.id', 'shipping_id' => 's.id', 'purchase_product' => 'oi.product_name', 'quantity' => 'oi.quantity', 'payment_method' => 'o.payment_method', 'order_status' => 'o.OrderStatus', 'purchase_price' => 'o.total', 'shipping_status' => 's.shipping_date', 'tracking_number' => 's.tracking_number', 'delivery' => 's.name01',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:150:     *         tracking_number?:string,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1367:     * 出荷実績インポート用CSVに出力する情報を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:29:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:57:        protected MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:141:                            $this->mailService->sendCreditPaymentCompleteMail($Customer, $Event, $EventEntry);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:166:                        $this->mailService->sendEventPaymentErrorAlertMail($EventEntry, $e->getMessage());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:20:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:27:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:54:                $this->mailService->sendFavoriteSaleNotificationMail($Customer, $customerData);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:20:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:29:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:78:            $this->mailService->sendWeeklyStockHistoryErrorMail($e->getMessage());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:20:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:28:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:73:        $this->mailService->sendAdjustPointVarianceMail($pointVarianceList);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/CheckBlankRequiredItemCustomerAction.php:19:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/CheckBlankRequiredItemCustomerAction.php:26:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/CheckBlankRequiredItemCustomerAction.php:41:        $this->mailService->sendBlankRequiredItemCustomerAlertMail($blankRequiredItemCustomers);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:20:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:27:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:52:                $this->mailService->sendPointExpireNotificationMail($player, $lostPoint, $expireDate);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:24:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:29:class ResendMailAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:33:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:43:     * メール再送処理（resendMail）のロックを非ブロッキングで取得し、メールが送られていないオーダーを取得してメールを再送信する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:49:        // メール再送処理（resendMail）のロックを非ブロッキングで取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:50:        if (!$this->orderRepository->getLock('resendMail', 0)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:51:            log_info('Resend Mail Batch Not Finished.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:90:                $this->mailService->resendOrderMail($Order, $this->getLang($Order->getCustomer()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:20:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:29:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:48:        $this->mailService->sendOrderDuplicateNotificationMail($orderNumbers);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:19:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:26:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:44:        $this->mailService->sendNotReflectedPointUsageAlertMail($notReflectedPointsUsage);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:39:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:74:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:140:                $this->mailService->sendStockApprovalAlertMail($approvalMember, $approvalUrl);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:21:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:29:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:52:                $this->mailService->sendNoSectionAlertMail($noSectionProducts);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:55:            $this->mailService->sendUpdateOtcBuyOrderSummaryErrorMail($exception->getMessage());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:33:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:47:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:116:        $this->mailService->sendBuyOrderCompleteMail($BuyOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:11:{% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:12:お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:569:                                         title="{{ 'tooltip.setting.shop.delivery.tracking_number_url'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:570:                                        <span>{{ 'admin.setting.shop.delivery.tracking_number_url'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:32:                            {% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:34:                                お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:11:{% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:12:お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:32:                            {% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:34:                                お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:11:{% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:12:お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:32:                            {% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:34:                                お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:53:     * 出荷実績インポート用CSVを出力する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:91:     * 出荷実績登録処理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:99:    public function registerShippingResult(array $headers, int $headerSize, CsvImportService $data): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:136:                    ->setShippingDate($shippingDate)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:137:                    ->setInvoiceNumber($invoiceNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:11:{% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:12:お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/ContactCreateAction.php:22:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/ContactCreateAction.php:29:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/ContactCreateAction.php:42:            $this->mailService->sendContactMail($input->formData, $input->Customer);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:32:                            {% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:34:                                お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:26:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:37:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:118:        $this->mailService->sendBuyOrderAssessmentApprovalMail($buyOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/IdentificationUpdateAction.php:28:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/IdentificationUpdateAction.php:46:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/IdentificationUpdateAction.php:82:            $this->mailService->sendIdentificationConfirmMail($input->Player->getCustomer());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:36:            // 出荷実績入力用CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:204:            var updateTrackingNumber = function(id, url, tracking_number, callback) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:208:                    data: {'tracking_number': tracking_number}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:211:                        $('#tracking_number_' + id).val(data['tracking_number']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:243:            $('button.update_tracking_number').prop('disabled', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:245:            $('input.update_tracking_number').on('keyup', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:246:                var $tracking_number = $(this);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:247:                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:254:            $('input.update_tracking_number').on('keypress', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:255:                var $tracking_number = $(this);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:256:                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:261:                    var index = $('input.update_tracking_number').index(this);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:267:                        $('input.update_tracking_number:gt(' + index + '):first').focus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:269:                    updateTrackingNumber($tracking_number.data('shipping_id'), $tracking_number.data('url'), $tracking_number.val(), callback);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:274:            $('button.update_tracking_number').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:278:                var tracking_number = $target.val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:285:        updateTrackingNumber($target.data('shipping_id'), $target.data('url'), tracking_number, callback);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1765:                                                <label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.shipping_info.tracking_number'|trans }}">{{ 'admin.order.tracking_number'|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1767:                                                    {{ form_widget(form.Shipping.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1768:                                                    {{ form_errors(form.Shipping.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:604:     * MailService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:13:{% set menus = ['order', 'admin_shipping_result_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:15:{% block title %}出荷実績管理{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:16:{% block sub_title %}出荷実績登録CSVアップロード{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:43:                    <div class="d-inline-block" data-bs-placement="top"><span>出荷実績CSVアップロード</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:45:                <form id="upload-form" method="post" action="{{ url('admin_shipping_result_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:76:                    <h3 class="box-title mb-12">出荷実績登録CSVファイルフォーマット</h3>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:449:                                                    {{ 'admin.order.tracking_number'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:452:                                                    {{ form_widget(shippingForm.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:453:                                                    {{ form_errors(shippingForm.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:125:"125","3",,"Eccube\\Entity\\Shipping","tracking_number",,"出荷伝票番号","69","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:195:"196","4",,"Eccube\\Entity\\Shipping","tracking_number",,"出荷伝票番号","69","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:117:        #[ORM\Column(name: 'tracking_number', type: Types::STRING, length: 255, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:118:        private ?string $tracking_number = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:441:        public function setShippingDate(?\DateTime $shippingDate = null): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:665:        public function setTrackingNumber(?string $trackingNumber): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:667:            $this->tracking_number = $trackingNumber;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:677:            return $this->tracking_number;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:754:        #[ORM\Column(name: 'shipping_commit_date', nullable: true, type: Types::DATETIMETZ_MUTABLE)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:755:        private ?\DateTime $shipping_commit_date = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:759:            return $this->shipping_commit_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:762:        public function setShippingCommitDate(?\DateTime $shipping_commit_date): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:764:            $this->shipping_commit_date = $shipping_commit_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:28:use Eccube\Service\MailService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:42:        private readonly MailService $mailService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:100:                $this->mailService->sendOtcBuyOrderAccountingPaymentPendingMail($input->OtcBuyOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:61:     * @method Order setShippingDate(?\DateTime $shippingDate)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:75:     * @method Order setInvoiceNumber(?string $invoiceNumber)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1852:        public function setShippingDate(?\DateTime $shippingDate): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1936:        public function setInvoiceNumber(?string $invoiceNumber): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailHistory.php:91:        public function setSendDate(?\DateTime $sendDate = null): MailHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:125:125,3,,Eccube\\Entity\\Shipping,tracking_number,,Tracking No. ,69,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:195:196,4,,Eccube\\Entity\\Shipping,tracking_number,,Tracking No. ,69,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbUserMailHistory.php:67:    public function setSendDate(\DateTime $sendDate): DtbUserMailHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2282:admin.order.tracking_number: Tracking No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2283:admin.order.tracking_number_error: Only Roman alphabets, numbers and hyphens are accepted for tracking numbers.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2369:admin.order.shipping_csv.tracking_number_col: Tracking No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2370:admin.order.shipping_csv.tracking_number_description: Enter alphanumeric characters or hyphens
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2664:admin.setting.shop.delivery.tracking_number_url: Tracking URL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3144:tooltip.order.shipping_info.tracking_number: If you have a tracking number (delivery slip number), you can enter from here. You can also bulk-input from All Orders.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3195:tooltip.setting.shop.delivery.tracking_number_url: Enter the URL of the shipping tracker of the delivery company.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2485:admin.order.tracking_number: 送り状No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2486:admin.order.tracking_number_error: 送り状No.は半角英数字かハイフンのみを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2578:admin.order.shipping_csv.tracking_number_col: お問い合わせ番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2579:admin.order.shipping_csv.tracking_number_description: 半角英数字かハイフンのみで設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3058:admin.setting.shop.delivery.tracking_number_url: お問い合わせ番号URL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3570:tooltip.order.shipping_info.tracking_number: お問い合せ番号（出荷伝票番号）がある場合、こちらから入力できます。受注一覧からまとめて入力することも可能です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3623:tooltip.setting.shop.delivery.tracking_number_url: 配送業者のお問い合わせページURLを指定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4054:# 受注管理：出荷実績インポート登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4058:admin.order.shipping_export_for_import: 出荷実績入力用CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4059:admin.order.shipping_import: 出荷実績インポート登録

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php | sed -n '1,220p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Service\Csv;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Common\EccubeConfig;
    20	use Eccube\Entity\Master\MtbFormat;
    21	use Eccube\Exception\CsvImportException;
    22	use Eccube\Repository\Master\MtbFormatRepository;
    23	use Eccube\Service\CsvImportService;
    24	use Eccube\Util\StringUtil;
    25	use Symfony\Component\Filesystem\Filesystem;
    26	use Symfony\Component\Form\FormInterface;
    27	use Symfony\Component\HttpFoundation\File\UploadedFile;
    28	use Symfony\Component\HttpFoundation\Response;
    29	use Symfony\Contracts\Translation\TranslatorInterface;
    30	
    31	abstract class AbstractCsvService
    32	{
    33	    private ?string $fileName = null;
    34	
    35	    /** @var CsvImportException[] */
    36	    private array $errors = [];
    37	
    38	    /**
    39	     * getImportData() で保存した一時ファイル名。未アップロード時は null。
    40	     */
    41	    protected function getFileName(): ?string
    42	    {
    43	        return $this->fileName;
    44	    }
    45	
    46	    /**
    47	     * @param array<string, string> $csvHeader
    48	     * @param array<string, string> $requiredCsvHeader
    49	     */
    50	    public function __construct(
    51	        protected EntityManagerInterface $entityManager,
    52	        protected TranslatorInterface $translator,
    53	        protected EccubeConfig $eccubeConfig,
    54	        protected array $csvHeader = [],
    55	        protected array $requiredCsvHeader = [],
    56	        protected string $importTwig = '',
    57	        protected string $sessionKey = '',
    58	        protected ?MtbFormatRepository $formatRepository = null,
    59	    ) {
    60	    }
    61	
    62	    /**
    63	     * @param array<int, string> $headers
    64	     * @param int $headerSize
    65	     * @param \Iterator<array<string, string>> $data
    66	     */
    67	    public function register(array $headers, int $headerSize, \Iterator $data): void
    68	    {
    69	    }
    70	
    71	    /**
    72	     * @param array<int, mixed> $ids
    73	     */
    74	    public function exportCsv(array $ids): Response
    75	    {
    76	        return new Response();
    77	    }
    78	
    79	    /**
    80	     * @param \Symfony\Component\HttpFoundation\Request $request
    81	     *
    82	     * @return array<int, mixed>
    83	     */
    84	    public function getIds(\Symfony\Component\HttpFoundation\Request $request): array
    85	    {
    86	        return [];
    87	    }
    88	
    89	    /**
    90	     * @param array<int, mixed> $entity
    91	     *
    92	     * @return array<int, mixed>
    93	     */
    94	    public function convertExportCsvRows(array $entity): array
    95	    {
    96	        return [];
    97	    }
    98	
    99	    /**
   100	     * カードレイアウト毎に点数で見たマナコスト(CMC)を取得
   101	     *
   102	     * @param array<string, mixed> $row
   103	     *
   104	     * @return int|string CMC
   105	     */
   106	    public function getCmc(array $row): int|string
   107	    {
   108	        $layout = $row['layout'] ?? 'Normal';
   109	        $cmc = $row['cmc'] ?? 0;
   110	        if ($cmc === '' || (\is_string($cmc) && trim($cmc) === '')) {
   111	            $cmc = 0;
   112	        }
   113	
   114	        return match ($layout) {
   115	            'Split' => array_sum(array_map('intval', explode('/', (string) $cmc))),
   116	            'Flip' => (int) explode('/', (string) $cmc)[0],
   117	            'Normal', 'Double Faced', 'Meld', 'Double Faced,Meld' => is_numeric($cmc) ? (int) $cmc : $cmc,
   118	            default => is_numeric($cmc) ? (int) $cmc : $cmc,
   119	        };
   120	    }
   121	
   122	    /**
   123	     * 入力CSVファイルをフォームから取得する
   124	     *
   125	     * @param FormInterface $form
   126	     *
   127	     * @return UploadedFile|null
   128	     */
   129	    public function getFormFile(FormInterface $form): ?UploadedFile
   130	    {
   131	        $formFile = $form->get('import_file')->getData();
   132	        if ($formFile === null || $formFile->getSize() === 0) {
   133	            return null;
   134	        }
   135	
   136	        return $formFile;
   137	    }
   138	
   139	    /**
   140	     * アップロードされたCSVファイルの行ごとの処理
   141	     *
   142	     * @param UploadedFile $formFile
   143	     *
   144	     * @return CsvImportService<int, array<int|string, string>>|false
   145	     */
   146	    public function getImportData(UploadedFile $formFile): CsvImportService|false
   147	    {
   148	        $tempDir = $this->eccubeConfig['eccube_csv_temp_realdir'] ?? null;
   149	        if ($tempDir === null) {
   150	            return false;
   151	        }
   152	
   153	        $this->fileName = 'upload_'.StringUtil::random().'.'.$formFile->getClientOriginalExtension();
   154	        $formFile->move($tempDir, $this->fileName);
   155	
   156	        $path = $tempDir.'/'.$this->fileName;
   157	        $fileContent = file_get_contents($path);
   158	
   159	        if ($fileContent === false) {
   160	            return false;
   161	        }
   162	
   163	        if (str_starts_with($fileContent, "\xEF\xBB\xBF")) {
   164	            $fileContent = substr($fileContent, 3);
   165	        }
   166	
   167	        $encode = StringUtil::characterEncoding($fileContent);
   168	        // UTF-8以外（Shift-JISなど）なら、UTF-8に変換する
   169	        if ($encode !== null && $encode !== 'UTF-8') {
   170	            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', $encode);
   171	        }
   172	
   173	        $fileContent = StringUtil::convertLineFeed($fileContent);
   174	        $fileContent = $this->removeWhite($fileContent);
   175	
   176	        $tmp = tmpfile();
   177	        if ($tmp === false) {
   178	            return false;
   179	        }
   180	
   181	        fwrite($tmp, $fileContent);
   182	        rewind($tmp);
   183	
   184	        $meta = stream_get_meta_data($tmp);
   185	        $file = new \SplFileObject($meta['uri']);
   186	
   187	        set_time_limit(0);
   188	
   189	        $delimiter = $formFile->getClientOriginalExtension() === 'tsv'
   190	            ? "\t"
   191	            : ($this->eccubeConfig['eccube_csv_import_delimiter'] ?? ',');
   192	
   193	        $enclosure = $this->eccubeConfig['eccube_csv_import_enclosure'] ?? '"';
   194	
   195	        $data = new CsvImportService($file, $delimiter, $enclosure);
   196	
   197	        return $data->setHeaderRowNumber(0) ? $data : false;
   198	    }
   199	
   200	    /**
   201	     * 一時ファイルを削除する
   202	     */
   203	    public function deleteTempData(): void
   204	    {
   205	        if ($this->fileName !== null && $this->fileName !== '') {
   206	            try {
   207	                $fs = new Filesystem();
   208	                $dir = $this->eccubeConfig['eccube_csv_temp_realdir'] ?? null;
   209	                if ($dir !== null) {
   210	                    $fs->remove($dir.'/'.$this->fileName);
   211	                }
   212	            } catch (\Exception $e) {
   213	            }
   214	            $this->fileName = null;
   215	        }
   216	    }
   217	
   218	    /**
   219	     * フォームのバリデーションチェック
   220	     *

codex
実装参照はおおむね実在していますが、候補の一部は「移行先DBを正とする」という設計書の注記を読み落としている可能性があります。見落とし有無も見るため、設計書の後半と関連エンティティ・テンプレートを追加で確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php | sed -n '100,130p;432,446p;658,678p;748,766p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   100	
   101	        /**
   102	         * お届け予定日/お届け希望日
   103	         *
   104	         * @var \DateTime|null
   105	         */
   106	        #[ORM\Column(name: 'delivery_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   107	        private $shipping_delivery_date;
   108	
   109	        /**
   110	         * 出荷日
   111	         *
   112	         * @var \DateTime|null
   113	         */
   114	        #[ORM\Column(name: 'shipping_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   115	        private $shipping_date;
   116	
   117	        #[ORM\Column(name: 'tracking_number', type: Types::STRING, length: 255, nullable: true)]
   118	        private ?string $tracking_number = null;
   119	
   120	        #[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)]
   121	        private ?string $note = null;
   122	
   123	        #[ORM\Column(name: 'sort_no', type: Types::SMALLINT, nullable: true, options: ['unsigned' => true])]
   124	        private ?int $sort_no = null;
   125	
   126	        /**
   127	         * @var \DateTime
   128	         */
   129	        #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE)]
   130	        private $create_date;
   432	         */
   433	        public function getShippingDeliveryDate(): ?\DateTime
   434	        {
   435	            return $this->shipping_delivery_date;
   436	        }
   437	
   438	        /**
   439	         * Set shippingDate.
   440	         */
   441	        public function setShippingDate(?\DateTime $shippingDate = null): Shipping
   442	        {
   443	            $this->shipping_date = $shippingDate;
   444	
   445	            return $this;
   446	        }
   658	        {
   659	            return $this->Order;
   660	        }
   661	
   662	        /**
   663	         * Set trackingNumber
   664	         */
   665	        public function setTrackingNumber(?string $trackingNumber): Shipping
   666	        {
   667	            $this->tracking_number = $trackingNumber;
   668	
   669	            return $this;
   670	        }
   671	
   672	        /**
   673	         * Get trackingNumber
   674	         */
   675	        public function getTrackingNumber(): ?string
   676	        {
   677	            return $this->tracking_number;
   678	        }
   748	
   749	        public function getCustomer(): ?Customer
   750	        {
   751	            return $this->Customer;
   752	        }
   753	
   754	        #[ORM\Column(name: 'shipping_commit_date', nullable: true, type: Types::DATETIMETZ_MUTABLE)]
   755	        private ?\DateTime $shipping_commit_date = null;
   756	
   757	        public function getShippingCommitDate(): ?\DateTime
   758	        {
   759	            return $this->shipping_commit_date;
   760	        }
   761	
   762	        public function setShippingCommitDate(?\DateTime $shipping_commit_date): Shipping
   763	        {
   764	            $this->shipping_commit_date = $shipping_commit_date;
   765	
   766	            return $this;

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html | sed -n '258,360p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   258	<h2 id="DBカラム">DBカラム</h2>
   259	<p>型の細部までの網羅はスキーマ照会を正とする。本作業では少なくとも次の側面が読み変わりうる。</p>
   260	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td>親注文</td><td>状態</td><td>出荷完了相当へ代入されうる。</td></tr><tr><td>注文サブ</td><td>出荷実施の日時、送り状番号類</td><td>「初回のみ」状態差し替え時にセットされる側面がある。</td></tr><tr><td>配送先</td><td>出荷コミット日時相当</td><td><code>出荷日</code> が空の行はスキップされ更新されない。出荷日がある行で親の配送一覧を走査して出荷コミット日時をセットする。</td></tr></tbody></table></div>
   261	<hr>
   262	<h2 id="バリデーション">バリデーション</h2>
   263	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>アップロードファイル</td><td>Symfonyのサイズおよびフォーム側必須。</td></tr><tr><td>ヘッダ行全体</td><td>「必須でない側の列」を除いた残余が期待と順序完全一致であることの静的照合（翻訳化前キーでの比較）。</td></tr><tr><td>各行</td><td>列数一致、必須列の空禁止、親注文に会員がいないときの異常終了、日付解釈エラーなど。</td></tr></tbody></table></div>
   264	<hr>
   265	<h2 id="権限・認可">権限・認可</h2>
   266	<p>管理画面共通のログイン状態で当プレフィックス配下へ到達する前提とし、本作業専用の細かなロール分岐は本文では固定しない。</p>
   267	<hr>
   268	<h2 id="画面遷移">画面遷移</h2>
   269	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>画面初期表示または成功・失敗復帰</td><td><code>GET …/shipping_result_csv/import</code> 相当へ戻り、フラッシュのみが変わる。</td></tr></tbody></table></div>
   270	<hr>
   271	<h2 id="エラー処理">エラー処理</h2>
   272	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>ロック混雑</td><td>メッセージを積んで一覧復帰。</td></tr><tr><td>CSV整形・項目欠落など</td><td>メッセージを積み、ORMトランザクションはロールバックが走る並びにある。</td></tr></tbody></table></div>
   273	<hr>
   274	<h2 id="試行制限">試行制限</h2>
   275	<p>アプリ側のユーザー単位レートリミットは本作業だけでは持たず、ロックとファイル妥当性チェックによる抑止となる。</p>
   276	<hr>
   277	<h2 id="ログ・監査">ログ・監査</h2>
   278	<p>プラグインテンプレートはスクリプトでのローディング演出を準備しているが、この画面処理本体が必ずしも詳細な監査ログを残すとは限られない。</p>
   279	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   280	<ul><li>アップロードファイル本文の複製を平文ログへ出す運用</li><li>アップロード済み認証関連トークンの完全値</li></ul>
   281	<hr>
   282	<h2 id="Cookie">Cookie</h2>
   283	<p>本作業だけで特有のブラウザ常駐 Cookie を増やさない。</p>
   284	<hr>
   285	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   286	<p>名前付き接続ロック関数で「同種CSV処理の並行」を避ける方針と、Doctrineのトランザクション開始が組み合わさるが、ロック解放タイミングについては環境側のコネクション寿命に依存する面があると整理する。</p>
   287	<hr>
   288	<h2 id="ec-cube-enterprise-Symfony側-での差分読みポイント">ec-cube-enterprise（Symfony側）での差分読みポイント</h2>
   289	<p>同一業務でもリポジトリ統合側ではパスや副作用がプラグイン版と異なりうる。</p>
   290	<div class="table-wrap"><table><thead><tr><th>観点</th><th>確認の目安</th></tr></thead><tbody><tr><td>POSTパス名</td><td>Symfony版は <code>shipping_result_csv/import</code> と <code>upload</code> の同一系統でありうるので、環境ごとのルート定義ファイルを確認する。</td></tr><tr><td>ロック実装</td><td>PostgreSQL向け名前付き方法に寄せている構成もあり、MySQLロックと論理構造が同じとは限らない。</td></tr><tr><td>成功後処理</td><td>メール送信等がコメントアウトされていてプラグイン版と異なる並びになりうる。</td></tr><tr><td>CSV列数</td><td>親リポジトリのクエリ側にだけ存在する住所系列により、プラグインテンプレの列リストと桁が食い違うリスクがある。</td></tr></tbody></table></div>
   291	<hr>
   292	<h2 id="調査補助-ソース位置の目安">調査補助（ソース位置の目安）</h2>
   293	<ul><li>プラグインファイル：<code>pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Order/OrderCsvController.php</code>、<code>Service/Csv/OrderCsv.php</code>、<code>Service/Csv/AbstractCsvService.php</code>、<code>Repository/DtbOrderSubRepository.php</code>、<code>Repository/OrderRepository.php</code>、<code>ServiceProvider/Admin/OrderServiceProvider.php</code></li><li>Symfony統合側（比較用）：<code>ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php</code>、<code>Service/Csv/OrderCsv.php</code>、<code>Repository/OrderRepository.php</code></li></ul>
   294	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   295	<ul><li><code>admin_shipping_result_csv_import</code> … <code>GET</code> … <code>/{admin_route}/order/shipping_result_csv/import</code>（アップロード画面を返す（フォーマット一覧のヘッダ定義も渡す）。）</li><li><code>admin_shipping_result_csv_upload</code> … <code>POST</code> … <code>/{admin_route}/order/shipping_result_csv/upload</code>（送信されたCSVまたはTSVの検証・一括反映・成功時の付随処理へ進む。）</li></ul>
   296	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   297	    </main>
   298	  </div>
   299	</body>
   300	</html>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig | sed -n '1,130p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	{#
     2	This file is part of EC-CUBE
     3	
     4	Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     5	
     6	http://www.ec-cube.co.jp/
     7	
     8	For the full copyright and license information, please view the LICENSE
     9	file that was distributed with this source code.
    10	#}
    11	{% extends '@admin/default_frame.twig' %}
    12	
    13	{% set menus = ['order', 'admin_shipping_result_csv_import'] %}
    14	
    15	{% block title %}出荷実績管理{% endblock %}
    16	{% block sub_title %}出荷実績登録CSVアップロード{% endblock %}
    17	
    18	{% form_theme form '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}
    19	
    20	{% block javascript %}
    21	    <script nonce="{{ csp_nonce }}">
    22	        $(function() {
    23	            $('#file-select').click(function() {
    24	                $('#admin_csv_import_import_file').click();
    25	                $('#admin_csv_import_import_file').on('change', function() {
    26	                    var files = $(this).prop('files');
    27	                    if (files.length) {
    28	                        $('#admin_csv_import_import_file_name').text(files[0].name);
    29	                        $('#upload-button').prop('disabled', false);
    30	                    }
    31	                });
    32	            });
    33	        });
    34	    </script>
    35	{% endblock javascript %}
    36	
    37	{% block main %}
    38	<div class="c-contentsArea__cols" style="table-layout: fixed;">
    39	    <div class="c-contentsArea__primaryCol" style="width: 100%; min-width: 0;">
    40	        <div class="c-primaryCol">
    41	            <div class="card rounded border-0 mb-4">
    42	                <div class="card-header">
    43	                    <div class="d-inline-block" data-bs-placement="top"><span>出荷実績CSVアップロード</span></div>
    44	                </div>
    45	                <form id="upload-form" method="post" action="{{ url('admin_shipping_result_csv_import') }}" enctype="multipart/form-data">
    46	                    <div id="ex-csv_product_card-upload" class="card-body">
    47	                        <div class="row">
    48	                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
    49	                                <div class="col">
    50	                                    {{ form_widget(form._token) }}
    51	                                    <div class="mb-2">
    52	                                        <span id="file-select" class="btn btn-ec-regular me-2">{{ 'admin.common.file_select'|trans }}</span>
    53	                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
    54	                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
    55	                                        {{ form_errors(form.import_file) }}
    56	                                    </div>
    57	
    58	                                    {% for error in errors %}
    59	                                        <div class="text-danger mt-2">{{ error }}</div>
    60	                                    {% endfor %}
    61	
    62	                                    {% for warning in warnings %}
    63	                                        <div class="text-warning mt-2">{{ warning }}</div>
    64	                                    {% endfor %}
    65	                                </div>  
    66	                            </div>
    67	                        </div>
    68	                        <div id="button_box__upload_button" class="card-footer text-center">
    69	                            <button id="upload-button" type="submit" class="btn btn-primary btn-sm">CSVファイルのアップロード</button>
    70	                        </div>
    71	                    </div>
    72	                </form>
    73	            </div>
    74	            <div id="file_format" class="card rounded border-0 mb-4" style="min-width: 0; max-width: 100%;">
    75	                <div class="card-header">
    76	                    <h3 class="box-title mb-12">出荷実績登録CSVファイルフォーマット</h3>
    77	                </div>
    78	                <div id="file_format_box__body_inner" class="card-body p-0 w-100" style="min-width: 0; max-width: 100%; overflow-x: auto;">
    79	                    <table class="table table-striped mb-12" style="width: max-content; max-width: none;">
    80	                        <thead>
    81	                            <tr id="file_format_box__header" class="text-nowrap">
    82	                                {% for header in headers|keys %}
    83	                                    <th id="file_format_box__header--{{ loop.index }}">{{ header }}</th>
    84	                                {% endfor %}
    85	                            </tr>
    86	                        </thead>
    87	                        <tbody>
    88	                            <tr id="file_format_box__list" class="text-nowrap">
    89	                                {% for key, value in headers %}
    90	                                    <td id="file_format_box__{{ key }}">{{ value|nl2br }}</td>
    91	                                {% endfor %}
    92	                            </tr>
    93	                        </tbody>
    94	                    </table>
    95	                </div>
    96	            </div>
    97	        </div>
    98	    </div>
    99	</div>
   100	
   101	{% endblock %}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '1840,1860p;1928,1942p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1840	        public function setConfirmDate(?\DateTime $confirmDate): Order
  1841	        {
  1842	            $this->confirmDate = $confirmDate;
  1843	
  1844	            return $this;
  1845	        }
  1846	
  1847	        public function getConfirmDate(): ?\DateTime
  1848	        {
  1849	            return $this->confirmDate;
  1850	        }
  1851	
  1852	        public function setShippingDate(?\DateTime $shippingDate): Order
  1853	        {
  1854	            $this->shippingDate = $shippingDate;
  1855	
  1856	            return $this;
  1857	        }
  1858	
  1859	        public function getShippingDate(): ?\DateTime
  1860	        {
  1928	            return $this;
  1929	        }
  1930	
  1931	        public function getDueDate(): ?\DateTime
  1932	        {
  1933	            return $this->dueDate;
  1934	        }
  1935	
  1936	        public function setInvoiceNumber(?string $invoiceNumber): Order
  1937	        {
  1938	            $this->invoiceNumber = $invoiceNumber;
  1939	
  1940	            return $this;
  1941	        }
  1942	

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php | sed -n '1,240p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	/*
     4	 * This file is part of EC-CUBE
     5	 *
     6	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     7	 *
     8	 * http://www.ec-cube.co.jp/
     9	 *
    10	 * For the full copyright and license information, please view the LICENSE
    11	 * file that was distributed with this source code.
    12	 */
    13	
    14	namespace Eccube\Controller\Admin\Order;
    15	
    16	use Doctrine\DBAL\ConnectionException;
    17	use Eccube\Controller\Admin\AbstractCsvImportController;
    18	use Eccube\Entity\Master\OrderStatus;
    19	use Eccube\Entity\Shipping;
    20	use Eccube\Form\Type\Admin\CsvImportType;
    21	use Eccube\Repository\ShippingRepository;
    22	use Eccube\Service\CsvImportService;
    23	use Eccube\Service\OrderStateMachine;
    24	use Symfony\Bridge\Twig\Attribute\Template;
    25	use Symfony\Component\HttpFoundation\Request;
    26	use Symfony\Component\HttpFoundation\StreamedResponse;
    27	use Symfony\Component\Routing\Attribute\Route;
    28	
    29	class CsvImportController extends AbstractCsvImportController
    30	{
    31	    public function __construct(private readonly ShippingRepository $shippingRepository, protected OrderStateMachine $orderStateMachine)
    32	    {
    33	    }
    34	
    35	    /**
    36	     * 出荷CSVアップロード
    37	     *
    38	     * @return array<string, mixed>
    39	     *
    40	     * @throws ConnectionException
    41	     */
    42	    #[Route(path: '/%eccube_admin_route%/order/shipping_csv_upload', name: 'admin_shipping_csv_import', methods: ['GET', 'POST'])]
    43	    #[Template(template: '@admin/Order/csv_shipping.twig')]
    44	    public function csvShipping(Request $request): array
    45	    {
    46	        $form = $this->formFactory->createBuilder(CsvImportType::class)->getForm();
    47	        $columnConfig = $this->getColumnConfig();
    48	        $errors = [];
    49	
    50	        if ($request->getMethod() === 'POST') {
    51	            $form->handleRequest($request);
    52	            if ($form->isValid()) {
    53	                $formFile = $form['import_file']->getData();
    54	
    55	                if (!empty($formFile)) {
    56	                    $csv = $this->getImportData($formFile);
    57	
    58	                    try {
    59	                        $this->entityManager->getConfiguration()->setSQLLogger();
    60	                        $this->entityManager->getConnection()->beginTransaction();
    61	
    62	                        $this->loadCsv($csv, $errors);
    63	
    64	                        if ($errors) {
    65	                            $this->entityManager->getConnection()->rollBack();
    66	                        } else {
    67	                            $this->entityManager->flush();
    68	                            $this->entityManager->getConnection()->commit();
    69	
    70	                            $this->addInfo('admin.common.csv_upload_complete', 'admin');
    71	                        }
    72	                    } finally {
    73	                        $this->removeUploadedFile();
    74	                    }
    75	                }
    76	            }
    77	        }
    78	
    79	        return [
    80	            'form' => $form->createView(),
    81	            'headers' => $columnConfig,
    82	            'errors' => $errors,
    83	        ];
    84	    }
    85	
    86	    /**
    87	     * @param CsvImportService<int, mixed>|bool $csv
    88	     * @param array<int, string> $errors
    89	     */
    90	    protected function loadCsv(CsvImportService|bool $csv, array &$errors): void
    91	    {
    92	        if (!$csv) {
    93	            $errors[] = trans('admin.common.csv_invalid_format');
    94	
    95	            return;
    96	        }
    97	
    98	        $columnConfig = $this->getColumnConfig();
    99	
   100	        // 必須カラムの確認
   101	        $requiredColumns = array_map(fn ($value) => $value['name'], array_filter($columnConfig, fn ($value) => $value['required']));
   102	        $csvColumns = $csv->getColumnHeaders();
   103	        if (count(array_diff(array_values($requiredColumns), $csvColumns)) > 0) {
   104	            $errors[] = trans('admin.common.csv_invalid_format');
   105	
   106	            return;
   107	        }
   108	
   109	        // 行数の確認
   110	        $size = count($csv);
   111	        if ($size < 1) {
   112	            $errors[] = trans('admin.common.csv_invalid_format');
   113	
   114	            return;
   115	        }
   116	
   117	        $columnNames = array_combine(array_keys($columnConfig), array_column($columnConfig, 'name'));
   118	
   119	        foreach ($csv as $line => $row) {
   120	            // 出荷IDがなければエラー
   121	            if (!isset($row[$columnNames['id']])) {
   122	                $errors[] = trans('admin.common.csv_invalid_required', ['%line%' => $line + 1, '%name%' => $columnNames['id']]);
   123	                continue;
   124	            }
   125	
   126	            /* @var Shipping $Shipping */
   127	            $Shipping = is_numeric($row[$columnNames['id']]) ? $this->shippingRepository->find($row[$columnNames['id']]) : null;
   128	
   129	            // 存在しない出荷IDはエラー
   130	            if (is_null($Shipping)) {
   131	                $errors[] = trans('admin.common.csv_invalid_not_found', ['%line%' => $line + 1, '%name%' => $columnNames['id']]);
   132	                continue;
   133	            }
   134	
   135	            if (isset($row[$columnNames['tracking_number']])) {
   136	                // 半角英数字ハイフン以外エラー
   137	                if (!preg_match('/^[0-9a-zA-Z-]*$/u', $row[$columnNames['tracking_number']])) {
   138	                    $errors[] = trans('admin.common.csv_invalid_format_line_name', ['%line%' => $line + 1, '%name%' => $columnNames['tracking_number']]);
   139	                    continue;
   140	                }
   141	
   142	                $Shipping->setTrackingNumber($row[$columnNames['tracking_number']]);
   143	            }
   144	
   145	            if (isset($row[$columnNames['shipping_date']])) {
   146	                // 日付フォーマットが異なる場合はエラー
   147	                $shippingDate = \DateTime::createFromFormat('Y-m-d', $row[$columnNames['shipping_date']]);
   148	                if ($shippingDate === false) {
   149	                    $errors[] = trans('admin.common.csv_invalid_date_format', ['%line%' => $line + 1, '%name%' => $columnNames['shipping_date']]);
   150	                    continue;
   151	                }
   152	
   153	                $shippingDate->setTime(0, 0, 0);
   154	                $Shipping->setShippingDate($shippingDate);
   155	            }
   156	
   157	            $Order = $Shipping->getOrder();
   158	            $RelateShippings = $Order->getShippings();
   159	            $allShipped = true;
   160	            foreach ($RelateShippings as $RelateShipping) {
   161	                if (!$RelateShipping->getShippingDate()) {
   162	                    $allShipped = false;
   163	                    break;
   164	                }
   165	            }
   166	            $OrderStatus = $this->entityManager->find(OrderStatus::class, OrderStatus::DELIVERED);
   167	            if ($allShipped) {
   168	                if ($this->orderStateMachine->can($Order, $OrderStatus)) {
   169	                    $this->orderStateMachine->apply($Order, $OrderStatus);
   170	                } else {
   171	                    $currentOrderStatus = $Order->getOrderStatus();
   172	                    if ($currentOrderStatus) {
   173	                        $from = $currentOrderStatus->getName();
   174	                        $to = $OrderStatus->getName();
   175	                        $errors[] = trans('admin.order.failed_to_change_status', [
   176	                            '%name%' => $Shipping->getId(),
   177	                            '%from%' => $from,
   178	                            '%to%' => $to,
   179	                        ]);
   180	                    }
   181	                }
   182	            }
   183	        }
   184	    }
   185	
   186	    /**
   187	     * アップロード用CSV雛形ファイルダウンロード
   188	     */
   189	    #[Route(path: '/%eccube_admin_route%/order/csv_template', name: 'admin_shipping_csv_template', methods: ['GET'])]
   190	    public function csvTemplate(Request $request): StreamedResponse
   191	    {
   192	        $columns = array_column($this->getColumnConfig(), 'name');
   193	
   194	        return $this->sendTemplateResponse($request, $columns, 'shipping.csv');
   195	    }
   196	
   197	    /**
   198	     * @return array<string, array<string, bool|string>>
   199	     */
   200	    protected function getColumnConfig(): array
   201	    {
   202	        return [
   203	            'id' => [
   204	                'name' => trans('admin.order.shipping_csv.shipping_id_col'),
   205	                'description' => trans('admin.order.shipping_csv.shipping_id_description'),
   206	                'required' => true,
   207	            ],
   208	            'tracking_number' => [
   209	                'name' => trans('admin.order.shipping_csv.tracking_number_col'),
   210	                'description' => trans('admin.order.shipping_csv.tracking_number_description'),
   211	                'required' => false,
   212	            ],
   213	            'shipping_date' => [
   214	                'name' => trans('admin.order.shipping_csv.shipping_date_col'),
   215	                'description' => trans('admin.order.shipping_csv.shipping_date_description'),
   216	                'required' => true,
   217	            ],
   218	        ];
   219	    }
   220	}

codex
関連する別の出荷CSVインポート機能は存在しますが、対象機能IDのルート・テンプレートとは別物です。候補の誤検知判定に加えて、候補にない差分として注文番号検索やフォーム無効時の扱いが残っていないかを確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php | sed -n '218,360p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   218	    /**
   219	     * フォームのバリデーションチェック
   220	     *
   221	     * @param FormInterface $form
   222	     */
   223	    public function checkFormValid(FormInterface $form): bool
   224	    {
   225	        if ($form->isSubmitted() && $form->isValid()) {
   226	            return true;
   227	        }
   228	        foreach ($form->getErrors(true) as $error) {
   229	            $this->addErrors($error->getMessage());
   230	        }
   231	
   232	        return false;
   233	    }
   234	
   235	    /**
   236	     * CSVヘッダーの値が一致するかチェック
   237	     *
   238	     * @param array<int, string> $keys 期待するヘッダーキー
   239	     * @param array<int, string> $columnHeaders CSVのヘッダー行
   240	     * @param array<int, string> $notRequiredHeaders 必須外ヘッダー（比較から除外）
   241	     */
   242	    public function checkHeaderValues(array $keys, array $columnHeaders, array $notRequiredHeaders): void
   243	    {
   244	        $keysFiltered = array_values(array_diff($keys, $notRequiredHeaders));
   245	        $headersFiltered = array_values(array_diff($columnHeaders, $notRequiredHeaders));
   246	        if ($keysFiltered !== $headersFiltered) {
   247	            throw new \RuntimeException($this->translator->trans('admin.csv.error.format.header'));
   248	        }
   249	    }
   250	
   251	    /**
   252	     * CSVデータが空でないかチェック
   253	     *
   254	     * @param \Countable $data
   255	     */
   256	    public function checkDataSize(\Countable $data): void
   257	    {
   258	        if ($data->count() < 1) {
   259	            throw new \RuntimeException($this->translator->trans('admin.csv.error.data.empty'));
   260	        }
   261	    }
   262	
   263	    /**
   264	     * CSV ヘッダー列数とデータ列数が一致するかチェック
   265	     *
   266	     * @param int $headerSize
   267	     * @param array<string, string> $row
   268	     * @param int $rowIndex
   269	     */
   270	    protected function checkHeaderSize(int $headerSize, array $row, int $rowIndex): void
   271	    {
   272	        if ($headerSize !== count($row)) {
   273	            $message = sprintf(
   274	                $this->translator->trans('admin.csv.error.format.body', [], 'messages'),
   275	                $rowIndex
   276	            );
   277	            throw new \RuntimeException($message);
   278	        }
   279	    }
   280	
   281	    /**
   282	     * 必須項目が入力されているかチェック
   283	     *
   284	     * @param array<string, string> $requiredHeaders 必須ヘッダー（表示名 => キー）
   285	     * @param array<string, string> $row
   286	     * @param int $rowIndex
   287	     */
   288	    protected function checkRequiredHeaders(array $requiredHeaders, array $row, int $rowIndex): void
   289	    {
   290	        foreach ($requiredHeaders as $key => $label) {
   291	            $value = $row[$key] ?? '';
   292	            if ((string) $value === '') {
   293	                $message = sprintf(
   294	                    $this->translator->trans('admin.csv.error.data.require', [], 'messages'),
   295	                    $label,
   296	                    $rowIndex
   297	                );
   298	                throw new \RuntimeException($message);
   299	            }
   300	        }
   301	    }
   302	
   303	    /**
   304	     * フォーマット(レギュレーション)が正しく入力されているかチェック
   305	     * サブクラスでオーバーライドして使用（カード系など）。
   306	     *
   307	     * @param array<string, string> $headers
   308	     * @param array<string, mixed> $row
   309	     * @param int $rowIndex
   310	     *
   311	     * @return MtbFormat|null 検証したエンティティ等（サブクラスで定義）
   312	     */
   313	    protected function checkFormat(array $headers, array $row, int $rowIndex): ?MtbFormat
   314	    {
   315	        $formatName = (string) ($row['format'] ?? '');
   316	        $mtbFormat = $this->formatRepository->findOneByNameEn($formatName);
   317	
   318	        if ($mtbFormat === null) {
   319	            $message = sprintf(
   320	                $this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'),
   321	                $formatName,
   322	                $rowIndex
   323	            );
   324	            throw new \RuntimeException($message);
   325	        }
   326	
   327	        return $mtbFormat;
   328	    }
   329	
   330	    /**
   331	     * 登録失敗時の処理（DBへの永続化をキャンセルして復元）
   332	     */
   333	    public function registerFail(string $message): void
   334	    {
   335	        if ($this->entityManager->getConnection()->isTransactionActive()) {
   336	            $this->entityManager->getConnection()->rollBack();
   337	        }
   338	        if (function_exists('log_error')) {
   339	            log_error('エラーが発生しました', [$message]);
   340	        }
   341	    }
   342	
   343	    /**
   344	     * @return CsvImportException[]
   345	     */
   346	    public function getErrors(): array
   347	    {
   348	        return $this->errors;
   349	    }
   350	
   351	    /**
   352	     * 取込エラーが1件以上蓄積されているか。
   353	     */
   354	    public function hasErrors(): bool
   355	    {
   356	        return count($this->errors) > 0;
   357	    }
   358	
   359	    /**
   360	     * 登録・更新時のエラーを追加

exec
/bin/bash -lc "rg -n \"function (isFree|getLock|generateResultCsv)|isFree\\(|getLock\\(|generateResultCsv\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube -g '*.php'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:934:    public function isFree(string $lockName): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:964:    public function getLock(string $lockName, int $timeout = -1): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1373:    public function generateResultCsv(array $orderIdList): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:784:        if (!$this->inventoryPlanRepository->getLock($lockName)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:421:    public static function getLockTimeout(EntityManagerInterface $em): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:934:    public function isFree(string $lockName): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:964:    public function getLock(string $lockName, int $timeout = -1): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1373:    public function generateResultCsv(array $orderIdList): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:285:        if (!$this->orderRepository->isFree('registerShippingResult')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:294:                if (!$this->orderRepository->getLock('registerShippingResult')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbInventoryPlanRepository.php:133:    public function getLock(string $lockName, int $timeout = 1): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:116:        public function getLock(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/OtcGuestPatternHandler.php:46:        if (!$this->orderRepository->getLock($lockName, SmaregiOtcOrderLock::TIMEOUT_SECONDS)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/OtcMemberPatternHandler.php:53:        if (!$this->orderRepository->getLock($lockName, SmaregiOtcOrderLock::TIMEOUT_SECONDS)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CsvImportHandlerInterface.php:54:    public function getLockTimeout(): int;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/CsvImporter.php:303:    protected function getLockTimeout(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/BaseCsvImportHandler.php:120:    public function getLockTimeout(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:59:        if (!$csvRows = $this->orderRepository->generateResultCsv($orderIdList)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:50:        if (!$this->orderRepository->getLock('resendMail', 0)) {

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1,260p;760,880p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Repository;
    17	
    18	use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepositoryInterface;
    19	use Doctrine\Common\Collections\ArrayCollection;
    20	use Doctrine\DBAL\ArrayParameterType;
    21	use Doctrine\DBAL\Types\Types;
    22	use Doctrine\ORM\EntityManagerInterface;
    23	use Doctrine\ORM\NonUniqueResultException;
    24	use Doctrine\ORM\NoResultException;
    25	use Doctrine\ORM\Query\ResultSetMapping;
    26	use Doctrine\ORM\QueryBuilder;
    27	use Doctrine\Persistence\ManagerRegistry as RegistryInterface;
    28	use Eccube\Common\ConnectionType;
    29	use Eccube\Common\Constant;
    30	use Eccube\Doctrine\Query\Queries;
    31	use Eccube\Entity\BaseInfo;
    32	use Eccube\Entity\Customer;
    33	use Eccube\Entity\Delivery;
    34	use Eccube\Entity\DtbCustomerGroup;
    35	use Eccube\Entity\DtbPlayer;
    36	use Eccube\Entity\Master\Country;
    37	use Eccube\Entity\Master\MtbOption;
    38	use Eccube\Entity\Master\MtbOrderType;
    39	use Eccube\Entity\Master\OrderStatus;
    40	use Eccube\Entity\Master\Pref;
    41	use Eccube\Entity\Master\Sex;
    42	use Eccube\Entity\Order;
    43	use Eccube\Entity\Payment;
    44	use Eccube\Repository\Master\MtbOptionRepository;
    45	use Eccube\Repository\Traits\SortProductTrait;
    46	use Eccube\Util\SqlUtil;
    47	use Eccube\Util\StringUtil;
    48	
    49	/**
    50	 * OrderRepository
    51	 *
    52	 * This class was generated by the Doctrine ORM. Add your own custom
    53	 * repository methods below.
    54	 *
    55	 * @extends AbstractEnterpriseRepository<Order>
    56	 */
    57	class OrderRepository extends AbstractEnterpriseRepository implements ServiceEntityRepositoryInterface
    58	{
    59	    use SortProductTrait;
    60	
    61	    private MtbOptionRepository $optionRepository;
    62	
    63	    public const MYSQL_DATE_FORMAT = 'Y-m-d H:i:s';
    64	
    65	    public const COLUMNS = [
    66	        'order' => 'o.name01', 'orderer' => 'o.id', 'shipping_id' => 's.id', 'purchase_product' => 'oi.product_name', 'quantity' => 'oi.quantity', 'payment_method' => 'o.payment_method', 'order_status' => 'o.OrderStatus', 'purchase_price' => 'o.total', 'shipping_status' => 's.shipping_date', 'tracking_number' => 's.tracking_number', 'delivery' => 's.name01',
    67	    ];
    68	
    69	    private const COLUMN_DATE_ENTER = [
    70	        'otc_rsv_datetime' => 'o.otc_rsv_date',
    71	        'receipt_datetime' => 'o.receiptDate',
    72	        'cancel_datetime' => 'o.cancel_date',
    73	        'commit_datetime' => 'o.commitDate',
    74	        'payment_datetime' => 'o.payment_date',
    75	        'shipping_datetime' => 'o.shippingDate',
    76	        'confirm_datetime' => 'o.confirmDate',
    77	    ];
    78	
    79	    private const POST_TYPE = [
    80	        '3' => '0',
    81	        '4' => '8',
    82	    ];
    83	    private const WORLD_POST_TYPE = [
    84	        '8' => '111',
    85	        '9' => '521',
    86	        '11' => '321',
    87	    ];
    88	
    89	    public const CSV_DATE_FORMAT = 'Y/m/d H:i:s';
    90	
    91	    /** アドバイザリロック第2キー用サフィックス（取得・解放・空き判定で同一であること） */
    92	    private const ADVISORY_LOCK_KEY2_SUFFIX = '::eccube_named_lock';
    93	
    94	    /**
    95	     * OrderRepository constructor.
    96	     */
    97	    public function __construct(
    98	        RegistryInterface $registry,
    99	        protected Queries $queries,
   100	        MtbOptionRepository $optionRepository,
   101	        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
   102	    ) {
   103	        $em = $registry->getManager($connectionName->value);
   104	        assert($em instanceof EntityManagerInterface);
   105	        parent::__construct(
   106	            $em,
   107	            $em->getClassMetadata(Order::class)
   108	        );
   109	        $this->optionRepository = $optionRepository;
   110	    }
   111	
   112	    public function changeStatus(int $orderId, OrderStatus $Status): void
   113	    {
   114	        $Order = $this
   115	            ->find($orderId)
   116	            ->setOrderStatus($Status)
   117	        ;
   118	
   119	        switch ($Status->getId()) {
   120	            case '6': // 入金済へ
   121	                $Order->setPaymentDate(new \DateTime());
   122	                break;
   123	        }
   124	
   125	        $em = $this->getEntityManager();
   126	        $em->persist($Order);
   127	        $em->flush();
   128	    }
   129	
   130	    /**
   131	     * 管理画面の受注検索用。SearchOrderType のフォームデータを想定。
   132	     *
   133	     * @param array{
   134	     *         order_id?:string|int,
   135	     *         order_number?:string,
   136	     *         order_no?:string,
   137	     *         order_id_start?:string|int,
   138	     *         order_id_end?:string|int,
   139	     *         name_multi?:string,
   140	     *         multi?:string|null,
   141	     *         shipping_multi?:string,
   142	     *         waiting_number?:int|string|null,
   143	     *         smaregi_receipt_no?:int|string|null,
   144	     *         status?:OrderStatus[]|int[],
   145	     *         name?:string,
   146	     *         kana?:string,
   147	     *         company_name?:string,
   148	     *         email?:string,
   149	     *         phone_number?:string|array<string, string>|null,
   150	     *         tracking_number?:string,
   151	     *         shipping_mail?:array<int, int>,
   152	     *         payment?:Payment[]|ArrayCollection<int, Payment>,
   153	     *         payment_total_start?:string|int|null,
   154	     *         payment_total_end?:string|int|null,
   155	     *         buy_product_name?:string,
   156	     *         buy_product_name1?:string,
   157	     *         buy_product_name2?:string,
   158	     *         buy_product_name3?:string,
   159	     *         product_name_select?:string,
   160	     *         buy_product_code?:string,
   161	     *         customer_group?:array<int, DtbCustomerGroup>|ArrayCollection<int, DtbCustomerGroup>,
   162	     *         message_flg?:array<int, string>,
   163	     *         delivery?:Delivery[]|ArrayCollection<int, Delivery>,
   164	     *         sex?:Sex[]|ArrayCollection<int, Sex>,
   165	     *         sortkey?:string,
   166	     *         sorttype?:string,
   167	     *         tenants?:BaseInfo[]|ArrayCollection<int, BaseInfo>|null,
   168	     *         search_pattern_name?:string,
   169	     *         shipping_name?:string,
   170	     *         shipping_kana?:string,
   171	     *         shipping_zipcode?:string,
   172	     *         shipping_tel?:string,
   173	     *         shipping_country?:Country|null,
   174	     *         shipping_pref?:Pref|null,
   175	     *         order_date_start?:\DateTimeInterface|null,
   176	     *         order_datetime_start?:\DateTimeInterface|null,
   177	     *         order_date_end?:\DateTimeInterface|null,
   178	     *         order_datetime_end?:\DateTimeInterface|null,
   179	     *         order_datetime_since_before?:int|string|null,
   180	     *         order_datetime_until_before?:int|string|null,
   181	     *         payment_date_start?:\DateTimeInterface|null,
   182	     *         payment_datetime_start?:\DateTimeInterface|null,
   183	     *         payment_date_end?:\DateTimeInterface|null,
   184	     *         payment_datetime_end?:\DateTimeInterface|null,
   185	     *         payment_datetime_since_before?:int|string|null,
   186	     *         payment_datetime_until_before?:int|string|null,
   187	     *         payment_datetime_enter?:array<int, string>|null,
   188	     *         update_date_start?:\DateTimeInterface|null,
   189	     *         update_datetime_start?:\DateTimeInterface|null,
   190	     *         update_date_end?:\DateTimeInterface|null,
   191	     *         update_datetime_end?:\DateTimeInterface|null,
   192	     *         update_datetime_since_before?:int|string|null,
   193	     *         update_datetime_until_before?:int|string|null,
   194	     *         update_datetime_enter?:array<int, string>|null,
   195	     *         confirm_date_start?:\DateTimeInterface|null,
   196	     *         confirm_datetime_start?:\DateTimeInterface|null,
   197	     *         confirm_date_end?:\DateTimeInterface|null,
   198	     *         confirm_datetime_end?:\DateTimeInterface|null,
   199	     *         confirm_datetime_since_before?:int|string|null,
   200	     *         confirm_datetime_until_before?:int|string|null,
   201	     *         confirm_datetime_enter?:array<int, string>|null,
   202	     *         commit_date_start?:\DateTimeInterface|null,
   203	     *         commit_datetime_start?:\DateTimeInterface|null,
   204	     *         commit_date_end?:\DateTimeInterface|null,
   205	     *         commit_datetime_end?:\DateTimeInterface|null,
   206	     *         commit_datetime_since_before?:int|string|null,
   207	     *         commit_datetime_until_before?:int|string|null,
   208	     *         commit_datetime_enter?:array<int, string>|null,
   209	     *         shipping_date_start?:\DateTimeInterface|null,
   210	     *         shipping_datetime_start?:\DateTimeInterface|null,
   211	     *         shipping_date_end?:\DateTimeInterface|null,
   212	     *         shipping_datetime_end?:\DateTimeInterface|null,
   213	     *         shipping_datetime_since_before?:int|string|null,
   214	     *         shipping_datetime_until_before?:int|string|null,
   215	     *         shipping_datetime_enter?:array<int, string>|null,
   216	     *         cancel_date_start?:\DateTimeInterface|null,
   217	     *         cancel_datetime_start?:\DateTimeInterface|null,
   218	     *         cancel_date_end?:\DateTimeInterface|null,
   219	     *         cancel_datetime_end?:\DateTimeInterface|null,
   220	     *         cancel_datetime_since_before?:int|string|null,
   221	     *         cancel_datetime_until_before?:int|string|null,
   222	     *         cancel_datetime_enter?:array<int, string>|null,
   223	     *         receipt_date_start?:\DateTimeInterface|null,
   224	     *         receipt_datetime_start?:\DateTimeInterface|null,
   225	     *         receipt_date_end?:\DateTimeInterface|null,
   226	     *         receipt_datetime_end?:\DateTimeInterface|null,
   227	     *         receipt_datetime_since_before?:int|string|null,
   228	     *         receipt_datetime_until_before?:int|string|null,
   229	     *         receipt_datetime_enter?:array<int, string>|null,
   230	     *         otc_rsv_date_start?:\DateTimeInterface|null,
   231	     *         otc_rsv_datetime_start?:\DateTimeInterface|null,
   232	     *         otc_rsv_date_end?:\DateTimeInterface|null,
   233	     *         otc_rsv_datetime_end?:\DateTimeInterface|null,
   234	     *         otc_rsv_datetime_since_before?:int|string|null,
   235	     *         otc_rsv_datetime_until_before?:int|string|null,
   236	     *         otc_rsv_datetime_enter?:array<int, string>|null,
   237	     *     } $searchData
   238	     */
   239	    public function getQueryBuilderBySearchDataForAdmin(array $searchData): QueryBuilder
   240	    {
   241	        $qb = $this->createQueryBuilder('o')
   242	            ->select('o, s')
   243	            ->addSelect('oi', 'pref')
   244	            ->leftJoin('o.OrderItems', 'oi')
   245	            ->leftJoin('o.Pref', 'pref')
   246	            ->innerJoin('o.Shippings', 's')
   247	            ->innerJoin('s.Country', 'sc')
   248	            ->innerJoin('s.Pref', 'sp')
   249	            ->innerJoin('o.Customer', 'c');
   250	
   251	        // tenants
   252	        if (!empty($searchData['tenants']) && count($searchData['tenants']) > 0) {
   253	            $qb
   254	                ->andWhere($qb->expr()->in('s.baseInfo', ':BaseInfo'))
   255	                ->setParameter('BaseInfo', $searchData['tenants']);
   256	        }
   257	
   258	        // order_number
   259	        if (isset($searchData['order_number']) && StringUtil::isNotBlank($searchData['order_number'])) {
   260	            $qb
   760	                $qb->expr()->eq('os.smaregi_stock_flg', ':stockFlg')
   761	            ))
   762	            ->setParameter('delFlg', Constant::DISABLED)
   763	            ->setParameter('productFlg', Constant::DISABLED)
   764	            ->setParameter('stockFlg', Constant::DISABLED)
   765	            ->getQuery()
   766	            ->getResult();
   767	    }
   768	
   769	    /**
   770	     * 店頭受取注文 (Delivery::OTC_GROUP) のうち、スマレジ商品/在庫の連携が未完了な受注を返す。
   771	     *
   772	     * 取得条件:
   773	     * - Shipping.Delivery が OTC または SMOOTH_OTC
   774	     * - OrderStatus = NEW (受取前)
   775	     * - smaregi_del_flg = false (削除対象でない)
   776	     * - smaregi_error_flg = false (エラー受注は本バッチでは扱わない)
   777	     * - smaregi_product_flg = false または smaregi_stock_flg = false (いずれかが未連携)
   778	     *
   779	     * 1 受注 = 1 スマレジ商品の前提で、productCode は注文番号+店舗IDから決定論的に採番する。
   780	     *
   781	     * @return list<Order>
   782	     */
   783	    public function findOtcOrdersAwaitingSmaregiSync(int $limit = 100): array
   784	    {
   785	        $qb = $this->createQueryBuilder('o');
   786	        $qb
   787	            ->distinct()
   788	            ->innerJoin(\Eccube\Entity\Shipping::class, 's', 'WITH', 's.Order = o')
   789	            ->where('s.Delivery IN (:deliveryIds)')
   790	            ->andWhere('o.OrderStatus = :orderNew')
   791	            ->andWhere('o.smaregi_del_flg = :flgFalse')
   792	            ->andWhere('o.smaregi_error_flg = :flgFalse')
   793	            ->andWhere($qb->expr()->orX(
   794	                'o.smaregi_product_flg = :flgFalse',
   795	                'o.smaregi_stock_flg = :flgFalse',
   796	            ))
   797	            ->setParameter('deliveryIds', Delivery::OTC_GROUP)
   798	            ->setParameter('orderNew', OrderStatus::NEW)
   799	            ->setParameter('flgFalse', Constant::DISABLED)
   800	            ->orderBy('o.id', 'ASC')
   801	            ->setMaxResults($limit);
   802	
   803	        /** @var list<Order> $result */
   804	        $result = $qb->getQuery()->getResult();
   805	
   806	        return $result;
   807	    }
   808	
   809	    /**
   810	     * 店頭受取注文 (Delivery::OTC_GROUP) のうち `smaregi_code` (= 13桁 productCode) が
   811	     * 指定リストに含まれ、かつ確定済み (CANCEL/DELIVERED/PASSED/RETURNED) でない Order を返す。
   812	     *
   813	     * スマレジ Webhook で受信した取引明細の `productCode` を突合キーに、対応する
   814	     * EC-CUBE 既存 OTC 受注を逆引きするのに使う。Smaregi 側 `productId` は EC-CUBE 側に
   815	     * 保存していないため、両者で共有可能なキーである `productCode` を採用している
   816	     * ({@see \Eccube\Service\Smaregi\Otc\SmaregiOtcOrderSyncService} が
   817	     *  `Order.smaregi_code` に保存する 13 桁インストアコード)。
   818	     *
   819	     * @param list<string> $smaregiCodes
   820	     *
   821	     * @return list<Order>
   822	     */
   823	    public function findOtcOrdersBySmaregiCodes(array $smaregiCodes): array
   824	    {
   825	        if ($smaregiCodes === []) {
   826	            return [];
   827	        }
   828	
   829	        $qb = $this->createQueryBuilder('o');
   830	        $qb
   831	            ->distinct()
   832	            ->innerJoin(\Eccube\Entity\Shipping::class, 's', 'WITH', 's.Order = o')
   833	            ->where('o.smaregi_code IN (:smaregiCodes)')
   834	            ->andWhere('s.Delivery IN (:deliveryIds)')
   835	            // 確定済み (引渡し/出荷完了/キャンセル/返品) の受注は突合対象外。
   836	            // 突合成功後に Pattern Handler が PASSED へ遷移させるため、これを除外しないと
   837	            // 後続取引で productCode が重なった際に処理済み受注を再突合してしまう。
   838	            ->andWhere('o.OrderStatus NOT IN (:excludedStatuses)')
   839	            ->setParameter('smaregiCodes', $smaregiCodes)
   840	            ->setParameter('deliveryIds', Delivery::OTC_GROUP)
   841	            ->setParameter('excludedStatuses', [
   842	                OrderStatus::CANCEL,
   843	                OrderStatus::DELIVERED,
   844	                OrderStatus::PASSED,
   845	                OrderStatus::RETURNED,
   846	            ])
   847	            ->orderBy('o.id', 'ASC');
   848	
   849	        /** @var list<Order> $result */
   850	        $result = $qb->getQuery()->getResult();
   851	
   852	        return $result;
   853	    }
   854	
   855	    /**
   856	     * スマレジ削除対象の受注を取得
   857	     *
   858	     * TODO (パフォーマンス): 現状 dtb_order には smaregi_del_flg / smaregi_code / order_status_id を
   859	     * 含む複合インデックスが無いため、本クエリは全件スキャンになり得る。
   860	     * 受注テーブルが肥大化した時点で部分インデックス
   861	     *   `CREATE INDEX dtb_order_smaregi_delete_idx
   862	     *      ON dtb_order (order_status_id) WHERE smaregi_del_flg = false AND smaregi_code IS NOT NULL`
   863	     * 等の追加を検討する。バッチが日次 4 時実行のため当面は許容範囲を想定。
   864	     *
   865	     * @return list<Order>
   866	     */
   867	    public function getDeleteSmaregiProduct(int $limit = 100): array
   868	    {
   869	        $qb = $this->createQueryBuilder('o');
   870	        $qb
   871	            ->where($qb->expr()->in('o.OrderStatus', ':statusIds'))
   872	            ->andWhere('o.smaregi_code IS NOT NULL')
   873	            ->andWhere('o.smaregi_del_flg = :flgFalse')
   874	            ->setParameter('statusIds', [OrderStatus::CANCEL, OrderStatus::DELIVERED, OrderStatus::PASSED])
   875	            ->setParameter('flgFalse', Constant::DISABLED)
   876	            ->orderBy('o.id', 'ASC')
   877	            ->setMaxResults($limit);
   878	
   879	        /** @var list<Order> $result */
   880	        $result = $qb->getQuery()->getResult();

exec
/bin/bash -lc "rg -n \"sprintf|桁|注文番号|order_number|DtbOrderSub|出荷完了メール|sendShippingNotifyMail|shipping_notify|checkFormValid|isValid\\(\" /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:223:    public function checkFormValid(FormInterface $form): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:225:        if ($form->isSubmitted() && $form->isValid()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:273:            $message = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:293:                $message = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:319:            $message = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:44:        '注文番号' => '注文番号',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:114:        '注文番号' => '注文番号',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:270:        $this->orderCsv->checkFormValid($form);
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html:236:<ol><li>管理画面共通の認証を通過する。</li><li>同一フォーム型で送信を処理する。フォーム妥当性チェック用ヘルパを呼ぶが、この呼び出しの戻りでレスポンスを打ち切る実装になっていなく、送信拒否レスポンスを返すべきときも後続に進む可能性がある（プラグインファイル列の実装順序を確認値とする）。</li><li>送信ファイルをフォーム項目から読み込む処理を走らせる。サイズ判定の分岐は空であり、サイズが0でもオブジェクト経路に残りうる（実装上の注意）。</li><li>アップロード本文を設定の一時ディレクトリへ移しUTF-8化・改行正規化・ゼロ幅除去を施したうえで <code>SplFileObject</code> 経由の取込サービスを初期化する。拡張子が <code>tsv</code> のとき区切りはタブ、それ以外は設定の既定区切りを使う。ここまでが名前付き接続ロック取得より前に走る並びにある。</li><li>取込サービス構築が失敗したときは共通の復帰へ移り、一覧GETへリダイレクトする実装となる。</li><li>MySQL関数で「当該名称のロックが他接続により保持されていない」ことを確認し、保持されていれば「既に処理中」を意味するメッセージをフラッシュへ積み一覧へ復帰する。この段階ではまだ自分でロックを取らない。</li><li>名前付き接続ロックの取得処理を試み、失敗した場合はロック失敗系の異常終了となる。</li><li>期待ヘッダ集合と、アップロード1行目の列名から「必須でない側の列」を差し引いた残りが一致することをチェックする。一致しなければフォーマット誤りとして異常終了。</li><li>データ行が1行も無ければ異常終了。</li><li>ORM側の実行時SQLログを抑止したうえでトランザクション開始し、サービス側のループへ入る。</li><li>サービス側で各行について列数・注文番号必須を検証したあと、<code>sprintf</code> で桁埋めされた注文番号でサブ注文情報を検索する。無ければ行番号付きエラーとして異常終了。</li><li>出荷日セルが空なら、その行は <code>continue</code> でスキップし、親注文の状態・サブ伝票・送り状・配送コミット日時のいずれも更新しない（現行 <code>OrderCsv.php</code>、移行先 <code>Service/Csv/OrderCsv.php</code> ともに空出荷日でスキップ）。</li><li>出荷日が空でなく親注文に会員が紐付いていない場合は異常終了。</li><li>出荷日を日時コンストラクタへ渡して解釈し、例外なら異常終了。</li><li>サブ側の出荷実施日時がこれまで無かった場合のみ、親注文の状態を「出荷完了」相当へ差し替え、サブに出荷日と送り状番号をセットし、ポイント等のために更新対象配列へ積む。いずれの場合も当該注文にぶら下がる全配送オブジェクトについて出荷コミット日時を入力した日へ揃える。</li><li>ループ終了後にフラッシュ実行し、そのトランザクション本体をサービス側で終了処理する。</li><li>コントローラの try 経路ですでにサービス側でコミットが完了している並びにある。続けて try の外側でポイント付与・出荷完了メール送信・別系ポイント付与が呼び出され、それらでの例外処理はサービス側の try と独立している確認値となる。</li><li>成功メッセージを積み、<code>render</code> が一時ファイル掃除を試みつつ一覧GETへリダイレクトさせる構成になる。</li></ol>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html:245:<div class="table-wrap"><table><thead><tr><th>論理入力</th><th>行ごとの要件</th><th>結果への作用</th></tr></thead><tbody><tr><td>注文番号</td><td>ヘッダ照合済み行列のうち値が欠けない</td><td>桁埋め付き検索での突合鍵となる。無いときは未定義として異常終了。</td></tr><tr><td>出荷日</td><td>空許容</td><td>空のとき当該行はスキップされ、親・サブ状態・伝票・配送コミット日時のいずれも更新されない。</td></tr><tr><td>送り状No.</td><td>特に空禁止のチェックは取込サービス側の主要経路になく、型は行からそのまま文字列代入に使われる確認値となる。</td><td></td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html:290:<div class="table-wrap"><table><thead><tr><th>観点</th><th>確認の目安</th></tr></thead><tbody><tr><td>POSTパス名</td><td>Symfony版は <code>shipping_result_csv/import</code> と <code>upload</code> の同一系統でありうるので、環境ごとのルート定義ファイルを確認する。</td></tr><tr><td>ロック実装</td><td>PostgreSQL向け名前付き方法に寄せている構成もあり、MySQLロックと論理構造が同じとは限らない。</td></tr><tr><td>成功後処理</td><td>メール送信等がコメントアウトされていてプラグイン版と異なる並びになりうる。</td></tr><tr><td>CSV列数</td><td>親リポジトリのクエリ側にだけ存在する住所系列により、プラグインテンプレの列リストと桁が食い違うリスクがある。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html:293:<ul><li>プラグインファイル：<code>pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Order/OrderCsvController.php</code>、<code>Service/Csv/OrderCsv.php</code>、<code>Service/Csv/AbstractCsvService.php</code>、<code>Repository/DtbOrderSubRepository.php</code>、<code>Repository/OrderRepository.php</code>、<code>ServiceProvider/Admin/OrderServiceProvider.php</code></li><li>Symfony統合側（比較用）：<code>ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php</code>、<code>Service/Csv/OrderCsv.php</code>、<code>Repository/OrderRepository.php</code></li></ul>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:112:            $order = $this->orderRepository->findOneBy(['order_number' => $row['注文番号']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:115:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered'), '注文番号', $row['注文番号'], $rowIndex));

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '920,985p;1360,1448p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   920	
   921	        return $returnArray;
   922	    }
   923	
   924	    /**
   925	     * 指定した名前のアドバイザリロックが、他セッションにより取得されていないかを返す。
   926	     *
   927	     * PostgreSQL の pg_locks を参照し、{@see self::ADVISORY_LOCK_KEY2_SUFFIX} を用いた
   928	     * 2 整数キー（hashtext）と一致する granted ロックの有無で判定する。
   929	     *
   930	     * @param string $lockName 論理ロック名。同一文字列同士で getLock / releaseLock と対になること
   931	     *
   932	     * @return bool true のとき、当該キーのロックは誰も保持していない（空いている）
   933	     */
   934	    public function isFree(string $lockName): bool
   935	    {
   936	        $conn = $this->getEntityManager()->getConnection();
   937	
   938	        $sql = 'SELECT NOT EXISTS (
   939	            SELECT 1
   940	            FROM pg_locks l
   941	            WHERE l.locktype = \'advisory\'
   942	              AND l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
   943	              AND l.granted
   944	              AND l.classid = hashtext(CAST(? AS TEXT))
   945	              AND l.objid = hashtext(CAST(? AS TEXT) || ?)
   946	        ) AS is_free';
   947	
   948	        $result = $conn->fetchOne($sql, [$lockName, $lockName, self::ADVISORY_LOCK_KEY2_SUFFIX]);
   949	
   950	        return $this->dbalResultToBool($result);
   951	    }
   952	
   953	    /**
   954	     * 名前付きアドバイザリロックを取得する（PostgreSQL: pg_try_advisory_lock / pg_advisory_lock）。
   955	     *
   956	     * ロックキーは hashtext($lockName) と hashtext($lockName . ADVISORY_LOCK_KEY2_SUFFIX) の組である。
   957	     * 正の $timeout では pg_try_advisory_lock を約 50ms 間隔で繰り返し、期限までに取得できなければ false。
   958	     *
   959	     * @param string $lockName 論理ロック名。isFree / releaseLock と同一の文字列を渡すこと
   960	     * @param int    $timeout  待機の最大時間（秒）。0 は非ブロッキングで 1 回のみ試行。負数はブロッキングで無制限待機
   961	     *
   962	     * @return bool ロックを取得できた場合 true。取得できなかった場合 false
   963	     */
   964	    public function getLock(string $lockName, int $timeout = -1): bool
   965	    {
   966	        $conn = $this->getEntityManager()->getConnection();
   967	
   968	        $k1Sql = 'hashtext(CAST(? AS TEXT))';
   969	        $k2Sql = 'hashtext(CAST(? AS TEXT) || ?)';
   970	
   971	        if ($timeout === 0) {
   972	            $sql = "SELECT pg_try_advisory_lock({$k1Sql}, {$k2Sql}) AS acquired";
   973	            $result = $conn->fetchOne($sql, [$lockName, $lockName, self::ADVISORY_LOCK_KEY2_SUFFIX]);
   974	
   975	            return $this->dbalResultToBool($result);
   976	        }
   977	
   978	        if ($timeout < 0) {
   979	            $sql = "SELECT pg_advisory_lock({$k1Sql}, {$k2Sql})";
   980	            $conn->executeStatement($sql, [$lockName, $lockName, self::ADVISORY_LOCK_KEY2_SUFFIX]);
   981	
   982	            return true;
   983	        }
   984	
   985	        $deadline = microtime(true) + $timeout;
  1360	            ->setParameter('shippingIds', $shippingIds, ArrayParameterType::INTEGER)
  1361	            ->setParameter('stackPaperThresholdPrice', (int) $optionValues['stack_paper_threshold_price'])
  1362	            ->getResult();
  1363	    }
  1364	
  1365	    /**
  1366	     * 受注管理
  1367	     * 出荷実績インポート用CSVに出力する情報を取得
  1368	     *
  1369	     * @param array<int> $orderIdList
  1370	     *
  1371	     * @return array<int, mixed>
  1372	     */
  1373	    public function generateResultCsv(array $orderIdList): array
  1374	    {
  1375	        $qb = $this->getEntityManager()->createQueryBuilder()
  1376	            ->from('Eccube\Entity\Order', 'o')
  1377	            ->select([
  1378	                'o.order_number',
  1379	                'c.id AS customer_id',
  1380	                'c.name01 AS customer_name01',
  1381	                'c.name02 AS customer_name02',
  1382	                'c.kana01 AS customer_kana01',
  1383	                'c.kana02 AS customer_kana02',
  1384	                'c.company_name AS customer_company_name',
  1385	                // TODO：顧客郵便番号はテーブルでカラムが01，02に分かれていない。一旦ここで分割して出力する。
  1386	                'SUBSTRING(c.postal_code, 1, 3) AS customer_zip01',
  1387	                'SUBSTRING(c.postal_code, 4, 4) AS customer_zip02',
  1388	                'cp.id AS customer_pref_id',
  1389	                'cp.name AS customer_pref_name',
  1390	                'c.addr01 AS customer_addr01',
  1391	                'c.addr02 AS customer_addr02',
  1392	                'c.addr03 AS customer_addr03',
  1393	                'c.email AS customer_email',
  1394	                'c.tel01 AS customer_tel01',
  1395	                'c.tel02 AS customer_tel02',
  1396	                'c.tel03 AS customer_tel03',
  1397	                'c.fax01 AS customer_fax01',
  1398	                'c.fax02 AS customer_fax02',
  1399	                'c.fax03 AS customer_fax03',
  1400	                'cs.id AS customer_sex_id',
  1401	                'cs.name AS customer_sex',
  1402	                'cj.id AS customer_job_id',
  1403	                'cj.name AS customer_job',
  1404	                'c.birth AS customer_birth',
  1405	                'c.note AS customer_note',
  1406	                'o.subtotal',
  1407	                'o.discount',
  1408	                'o.delivery_fee_total',
  1409	                'o.tax',
  1410	                'o.total',
  1411	                'o.payment_total',
  1412	                'ost.id AS status_id',
  1413	                'ost.name AS status',
  1414	                'py.id AS payment_id',
  1415	                'py.method',
  1416	                'o.order_date',
  1417	                'o.confirmDate',
  1418	                'o.payment_date',
  1419	                'o.commitDate',
  1420	                'o.shippingDate',
  1421	                's.name01 AS shipping_name01',
  1422	                's.name02 AS shipping_name02',
  1423	                's.kana01 AS shipping_kana01',
  1424	                's.kana02 AS shipping_kana02',
  1425	                's.company_name AS shipping_company_name',
  1426	                // TODO：配送先郵便番号はテーブルでカラムが01，02に分かれていない。一旦ここで分割して出力する。
  1427	                'SUBSTRING(s.postal_code, 1, 3) AS shipping_zip01',
  1428	                'SUBSTRING(s.postal_code, 4, 4) AS shipping_zip02',
  1429	                'sp.id AS shipping_pref_id',
  1430	                'sp.name AS shipping_pref_name',
  1431	                's.addr01 AS shipping_addr01',
  1432	                's.addr02 AS shipping_addr02',
  1433	                's.addr03 AS shipping_addr03',
  1434	                's.tel01 AS shipping_tel01',
  1435	                's.tel02 AS shipping_tel02',
  1436	                's.tel03 AS shipping_tel03',
  1437	                // TODO：配送先Fax番号はテーブルにカラムなし。一旦空文字を出力する。
  1438	                "'' AS shipping_fax01",
  1439	                "'' AS shipping_fax02",
  1440	                "'' AS shipping_fax03",
  1441	                'd.id AS delivery_id',
  1442	                'd.name AS delivery_name',
  1443	                'o.invoiceNumber',
  1444	                't.id AS delivery_time_id',
  1445	                't.delivery_time',
  1446	            ])
  1447	            ->join('o.Pref', 'op')
  1448	            ->leftJoin('o.Country', 'oc')

exec
/bin/bash -lc 'rg -n "shipping_result_csv/import|shipping_result_csv/upload|admin_shipping_result_csv_import|admin_shipping_result_csv_upload" /home/y-saito/Developments/ec-cube-enterprise' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "shippingDate|invoiceNumber|shipping_date|invoice_number" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | head -80' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 198ms:
 succeeded in 186ms:
61:     * @method Order setShippingDate(?\DateTime $shippingDate)
75:     * @method Order setInvoiceNumber(?string $invoiceNumber)
672:        #[ORM\Column(name: 'shipping_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '出荷日'])]
673:        private ?\DateTime $shippingDate = null;
693:        #[ORM\Column(name: 'invoice_number', type: Types::STRING, length: 64, nullable: true, options: ['comment' => '送り状No.'])]
694:        private ?string $invoiceNumber = null;
1852:        public function setShippingDate(?\DateTime $shippingDate): Order
1854:            $this->shippingDate = $shippingDate;
1861:            return $this->shippingDate;
1936:        public function setInvoiceNumber(?string $invoiceNumber): Order
1938:            $this->invoiceNumber = $invoiceNumber;
1945:            return $this->invoiceNumber;

codex
候補JSON内の `functions/...md` 参照も実在確認します。HTMLとMarkdownで行番号がずれる場合、根拠不備として扱う必要があります。
exec
/bin/bash -lc "test -f /home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md && nl -ba /home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md | sed -n '1,260p' || true" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	# m05-26_admin_order_order_shipping_result_csv_import（管理画面_受注管理_出荷実績インポート登録）
     2	
     3	## 概要
     4	
     5	管理画面ナビゲーションに「出荷実績インポート登録」として現れる機能である。プラグインに定義された固定列のCSVまたはTSVをアップロードし、対象受注について出荷関連の日時・伝票・配送コミット日・一部場合に注文ステータスをまとめて反映する。
     6	
     7	本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。
     8	
     9	対象チャネルはブラウザ経由の EC-CUBE3 管理画面および HareruyaEc プラグイン（`pf-eccube3` に同梱のソースを確認値とする）。コアのみのSymfony移行済み構成（単体リポジトリ `ec-cube-enterprise` のみ）とはルートや副作用が異なりうるので、末尾の調査補助に差分の読みどころを示す。
    10	
    11	本機能のカスタマイズ区分は現行踏襲であり、画面挙動と処理フローは現行リポ pf-eccube3（HareruyaEc プラグイン）の実装を確認値とし、永続化に関わるテーブル・列の記述は ec-cube-enterprise を正とする。
    12	
    13	---
    14	
    15	## リニューアル移行時の扱い
    16	
    17	DB関連の記述は ec-cube-enterprise を正とする。本機能は現行ではプラグイン固有の親子モデルで実装されており、移行先とテーブル構成に差がある。
    18	
    19	| 観点 | 現行（pf-eccube3 / HareruyaEc プラグイン） | 移行先（ec-cube-enterprise） |
    20	|------|--------------------------------------------|------------------------------|
    21	| 親注文の状態 | `dtb_order` の状態列を出荷完了相当へ更新 | 同一テーブル。受注ステータスを保持する列で対応する。 |
    22	| 出荷実施日時・送り状番号 | プラグイン固有の注文サブ表（`dtb_order_sub`）に出荷実施日時・送り状番号を保持 | `dtb_order_sub` に該当するテーブルは ec-cube-enterprise に存在しない。出荷日は `dtb_shipping.shipping_date`、送り状番号は `dtb_shipping.tracking_number` が担う構成へ移行する。サブ表側に持っていた「初回のみ状態差し替え」のゲート列の移行先は ec-cube-enterprise 実装で要確認。 |
    23	| 配送コミット日時 | 配送（`dtb_shipping` 相当）の出荷コミット日時列へ入力日を一律セット | `dtb_shipping` に出荷コミット日時に相当する列があるかは ec-cube-enterprise 実装で要確認。出荷日は `dtb_shipping.shipping_date` で保持する。 |
    24	| 同時実行制御 | MySQL の名前付き接続ロック関数（GET_LOCK / IS_FREE_LOCK） | ec-cube-enterprise では PostgreSQL の advisory lock（`pg_advisory_lock` / `pg_try_advisory_lock`、`OrderRepository`）で実装。ロック方式が現行と異なる。 |
    25	
    26	注文サブ表（`dtb_order_sub`）の有無は現行・移行先で異なるため、移行時はサブ表の各列を配送（`dtb_shipping`）側の対応列へ写像する設計確認が必要である。
    27	
    28	---
    29	
    30	## 利用者視点の入口
    31	
    32	| 入口 | URLエンドポイント | 期待されるふるまい |
    33	|------|-------------------|---------------------|
    34	| 側メニュー「受注管理」配下などから当画面へ遷移 | `GET /{admin_route}/order/shipping_result_csv/import` | アップロードフォームと、列一覧のヒントとなるフォーマット表が表示される。 |
    35	| 「CSV，TSVファイルのアップロード」を押してファイル送信 | `POST /{admin_route}/order/shipping_result_csv/upload` | 送信ファイルが処理され、成否メッセージとともに同系の一覧画面へリダイレクトされる構成になる。 |
    36	
    37	---
    38	
    39	## フロント挙動
    40	
    41	| 観点 | 内容 |
    42	|------|------|
    43	| 表示要素 | 画面上部がアップロードカード。見出しは「出荷実績登録CSV，TSV」に相当する文言。入力はファイル1系。視覚説明として全列ヘッダ名を並べた表が続く。 |
    44	| JS 挙動 | メインHTMLブロックのみではプラグインテンプレートは送信ボタン中心の経路となる。レイアウトでスピナー用資産を参照しているが、自動抑止処理の有無はテンプレと実送信の両方から確認すること。 |
    45	| CSS・レイアウト | 管理側既定のBootstrap 3系テーマに従う。 |
    46	| モーダル・ポップアップ | アップロード前の確認ダイアログは設けられていない。 |
    47	
    48	---
    49	
    50	## 処理フロー
    51	
    52	### アップロード画面を開く（GET `admin_shipping_result_csv_import`）
    53	
    54	1. 管理画面共通の認証を通過する。
    55	2. 管理用CSV入力フォーム型で空フォームを作り、`CSV_HEADER` 定義の連想配列をテンプレートへ渡して描画する。
    56	
    57	### CSVまたはTSVを取り込む（POST `admin_shipping_result_csv_upload`）
    58	
    59	1. 管理画面共通の認証を通過する。
    60	2. 同一フォーム型で送信を処理する。フォーム妥当性チェック用ヘルパを呼ぶが、この呼び出しの戻りでレスポンスを打ち切る実装になっていなく、送信拒否レスポンスを返すべきときも後続に進む可能性がある（プラグインファイル列の実装順序を確認値とする）。
    61	3. 送信ファイルをフォーム項目から読み込む処理を走らせる。サイズ判定の分岐は空であり、サイズが0でもオブジェクト経路に残りうる（実装上の注意）。
    62	4. アップロード本文を設定の一時ディレクトリへ移しUTF-8化・改行正規化・ゼロ幅除去を施したうえで `SplFileObject` 経由の取込サービスを初期化する。拡張子が `tsv` のとき区切りはタブ、それ以外は設定の既定区切りを使う。ここまでが名前付き接続ロック取得より前に走る並びにある。
    63	5. 取込サービス構築が失敗したときは共通の復帰へ移り、一覧GETへリダイレクトする実装となる。
    64	6. MySQL関数で「当該名称のロックが他接続により保持されていない」ことを確認し、保持されていれば「既に処理中」を意味するメッセージをフラッシュへ積み一覧へ復帰する。この段階ではまだ自分でロックを取らない。
    65	7. 名前付き接続ロックの取得処理を試み、失敗した場合はロック失敗系の異常終了となる。
    66	8. 期待ヘッダ集合と、アップロード1行目の列名から「必須でない側の列」を差し引いた残りが一致することをチェックする。一致しなければフォーマット誤りとして異常終了。
    67	9. データ行が1行も無ければ異常終了。
    68	10. ORM側の実行時SQLログを抑止したうえでトランザクション開始し、サービス側のループへ入る。
    69	11. サービス側で各行について列数・注文番号必須を検証したあと、`sprintf` で桁埋めされた注文番号でサブ注文情報を検索する。無ければ行番号付きエラーとして異常終了。
    70	12. 出荷日セルが空なら、その行は `continue` でスキップし、親注文の状態・サブ伝票・送り状・配送コミット日時のいずれも更新しない（現行 `OrderCsv.php`、移行先 `Service/Csv/OrderCsv.php` ともに空出荷日でスキップ）。
    71	13. 出荷日が空でなく親注文に会員が紐付いていない場合は異常終了。
    72	14. 出荷日を日時コンストラクタへ渡して解釈し、例外なら異常終了。
    73	15. サブ側の出荷実施日時がこれまで無かった場合のみ、親注文の状態を「出荷完了」相当へ差し替え、サブに出荷日と送り状番号をセットし、ポイント等のために更新対象配列へ積む。いずれの場合も当該注文にぶら下がる全配送オブジェクトについて出荷コミット日時を入力した日へ揃える。
    74	16. ループ終了後にフラッシュ実行し、そのトランザクション本体をサービス側で終了処理する。
    75	17. コントローラの try 経路ですでにサービス側でコミットが完了している並びにある。続けて try の外側でポイント付与・出荷完了メール送信・別系ポイント付与が呼び出され、それらでの例外処理はサービス側の try と独立している確認値となる。
    76	18. 成功メッセージを積み、`render` が一時ファイル掃除を試みつつ一覧GETへリダイレクトさせる構成になる。
    77	
    78	---
    79	
    80	## 業務ルール・計算
    81	
    82	本機能本体は金額再計算などの複合計算を行わず、状態と日時・伝票文字列および配送側コミット日時の代入に限られる。
    83	
    84	業務コード定数で定める日本語列名の集合と、画面上のヒントとしての並びである。プラグインバージョンでは会社名〜住所〜配送先項目の並びにおいて、`配送先_住所3` 相当の区分は一覧に載らない。また取込サービス側のヘッダ比較は「必須でない側のリスト」と差し引き照合となる。
    85	
    86	### 入力項目
    87	
    88	本画面のアップロードフォームにおける利用者入力はファイル選択のみとなる。
    89	
    90	| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
    91	|--------|------------|--------|--------|----------------|
    92	| CSV，TSVファイル選択（ラベル相当） | 必須 | 環境により `eccube_csv_size` 等に相当するサイズ設定の上限依存 | 選択なし | `import_file`。マッピングされない送信項目。Symfonyのファイル制約に従う。取込サービス側では一時ディレクトリへ移動してから処理する。 |
    93	
    94	### ファイル内の論理入力（確認値）
    95	
    96	| 論理入力 | 行ごとの要件 | 結果への作用 |
    97	|-----------|---------------|----------------|
    98	| 注文番号 | ヘッダ照合済み行列のうち値が欠けない | 桁埋め付き検索での突合鍵となる。無いときは未定義として異常終了。 |
    99	| 出荷日 | 空許容 | 空のとき当該行はスキップされ、親・サブ状態・伝票・配送コミット日時のいずれも更新されない。 |
   100	| 送り状No. | 特に空禁止のチェックは取込サービス側の主要経路になく、型は行からそのまま文字列代入に使われる確認値となる。 |
   101	
   102	### エッジケース
   103	
   104	| ケース | 扱い |
   105	|--------|------|
   106	| 同時処理のロックが取れない | 「既に処理中」を意味する種別でメッセージを見せ一覧へリダイレクト系の復帰となる。 |
   107	| フォーム無効状態のとき | 妥当性関数はエラーをフラッシュへ積みリダイレクト返却オブジェクトを返しうるが、呼び出し元がそれを返却しきれない並びにある（実装上の盲点）。実機では二重処理や未定義状態に気を付ける。 |
   108	| アップロード処理のみでロックを保持したまま接続再利用 | MySQL関数ベースロックを明示解放していないので、ホスティング形態によっては同時インポート制御に依存する運用となる。 |
   109	
   110	---
   111	
   112	## データ整合性
   113	
   114	一覧・一覧からの入力用出力・本インポートの間では、プラグインが持つ親子と配送のモデルおよび固定CSV列順に収束しない差分があると取り込み失敗や列ズレとなる。親注文状態は「対応開始に近い状態」チェックなくサブ側出荷実施日時の既存のみでゲートされている。
   115	
   116	---
   117	
   118	## API/バッチ結果
   119	
   120	外部HTTP API は呼ばず、プラグインメソッドでの副作用に委ねられる。結果はフラッシュ文言と状態更新で観察する。
   121	
   122	---
   123	
   124	## 入出力
   125	
   126	| 種類 | 内容 |
   127	|------|------|
   128	| 入力 | `multipart/form-data` でのアップロードファイル、およびCSRF用トークン。 |
   129	| 成功時出力 | 成功フラッシュ付き一覧GETへのリダイレクト応答が基本。別途ポイント・メール送信が同期的に実行される確認値となる。 |
   130	| 失敗時出力 | 失敗フラッシュと一覧への復帰。トランザクションは例外時ロールバックの経路となる。 |
   131	
   132	---
   133	
   134	## DBカラム
   135	
   136	型の細部までの網羅はスキーマ照会を正とする。本作業では少なくとも次の側面が読み変わりうる。
   137	
   138	| テーブル | 列 | メモ |
   139	|---------|-----|------|
   140	| 親注文 | 状態 | 出荷完了相当へ代入されうる。 |
   141	| 注文サブ | 出荷実施の日時、送り状番号類 | 「初回のみ」状態差し替え時にセットされる側面がある。 |
   142	| 配送先 | 出荷コミット日時相当 | `出荷日` が空の行はスキップされ更新されない。出荷日がある行で親の配送一覧を走査して出荷コミット日時をセットする。 |
   143	
   144	---
   145	
   146	## バリデーション
   147	
   148	| 項目 | 内容 |
   149	|------|------|
   150	| アップロードファイル | Symfonyのサイズおよびフォーム側必須。 |
   151	| ヘッダ行全体 | 「必須でない側の列」を除いた残余が期待と順序完全一致であることの静的照合（翻訳化前キーでの比較）。 |
   152	| 各行 | 列数一致、必須列の空禁止、親注文に会員がいないときの異常終了、日付解釈エラーなど。 |
   153	
   154	---
   155	
   156	## 権限・認可
   157	
   158	管理画面共通のログイン状態で当プレフィックス配下へ到達する前提とし、本作業専用の細かなロール分岐は本文では固定しない。
   159	
   160	---
   161	
   162	## 画面遷移
   163	
   164	| 条件 | 遷移先 |
   165	|------|--------|
   166	| 画面初期表示または成功・失敗復帰 | `GET …/shipping_result_csv/import` 相当へ戻り、フラッシュのみが変わる。 |
   167	
   168	---
   169	
   170	## エラー処理
   171	
   172	| エラー内容 | 処理 |
   173	|------------|------|
   174	| ロック混雑 | メッセージを積んで一覧復帰。 |
   175	| CSV整形・項目欠落など | メッセージを積み、ORMトランザクションはロールバックが走る並びにある。 |
   176	
   177	---
   178	
   179	## 試行制限
   180	
   181	アプリ側のユーザー単位レートリミットは本作業だけでは持たず、ロックとファイル妥当性チェックによる抑止となる。
   182	
   183	---
   184	
   185	## ログ・監査
   186	
   187	プラグインテンプレートはスクリプトでのローディング演出を準備しているが、この画面処理本体が必ずしも詳細な監査ログを残すとは限られない。
   188	
   189	### ログに出してはいけないもの
   190	
   191	- アップロードファイル本文の複製を平文ログへ出す運用
   192	- アップロード済み認証関連トークンの完全値
   193	
   194	---
   195	
   196	## Cookie
   197	
   198	本作業だけで特有のブラウザ常駐 Cookie を増やさない。
   199	
   200	---
   201	
   202	## 排他制御・トランザクション
   203	
   204	名前付き接続ロック関数で「同種CSV処理の並行」を避ける方針と、Doctrineのトランザクション開始が組み合わさるが、ロック解放タイミングについては環境側のコネクション寿命に依存する面があると整理する。
   205	
   206	---
   207	
   208	## ec-cube-enterprise（Symfony側）での差分読みポイント
   209	
   210	同一業務でもリポジトリ統合側ではパスや副作用がプラグイン版と異なりうる。
   211	
   212	| 観点 | 確認の目安 |
   213	|------|-------------|
   214	| POSTパス名 | Symfony版は `shipping_result_csv/import` と `upload` の同一系統でありうるので、環境ごとのルート定義ファイルを確認する。 |
   215	| ロック実装 | PostgreSQL向け名前付き方法に寄せている構成もあり、MySQLロックと論理構造が同じとは限らない。 |
   216	| 成功後処理 | メール送信等がコメントアウトされていてプラグイン版と異なる並びになりうる。 |
   217	| CSV列数 | 親リポジトリのクエリ側にだけ存在する住所系列により、プラグインテンプレの列リストと桁が食い違うリスクがある。 |
   218	
   219	---
   220	
   221	## 調査補助（ソース位置の目安）
   222	
   223	- プラグインファイル：`pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Order/OrderCsvController.php`、`Service/Csv/OrderCsv.php`、`Service/Csv/AbstractCsvService.php`、`Repository/DtbOrderSubRepository.php`、`Repository/OrderRepository.php`、`ServiceProvider/Admin/OrderServiceProvider.php`
   224	- Symfony統合側（比較用）：`ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php`、`Service/Csv/OrderCsv.php`、`Repository/OrderRepository.php`
   225	
   226	### HTTPルート名とパス（コード探索用・旧入口節より退避）
   227	
   228	- `admin_shipping_result_csv_import` … `GET` … `/{admin_route}/order/shipping_result_csv/import`（アップロード画面を返す（フォーマット一覧のヘッダ定義も渡す）。）
   229	- `admin_shipping_result_csv_upload` … `POST` … `/{admin_route}/order/shipping_result_csv/upload`（送信されたCSVまたはTSVの検証・一括反映・成功時の付随処理へ進む。）

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/docs/testing/symfony_routes.contract.json | sed -n '2318,2336p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  2318	      "method": "PUT",
  2319	      "name": "admin_shipping_notify_mail"
  2320	    },
  2321	    {
  2322	      "method": "GET",
  2323	      "name": "admin_shipping_preview_notify_mail"
  2324	    },
  2325	    {
  2326	      "method": "GET",
  2327	      "name": "admin_shipping_result_csv_import"
  2328	    },
  2329	    {
  2330	      "method": "DELETE",
  2331	      "name": "admin_shipping_standby_delete"
  2332	    },
  2333	    {
  2334	      "method": "GET",
  2335	      "name": "admin_shipping_standby_edit"
  2336	    },

codex
監査結果です。候補6件は、参照行の実在性と主要な差分内容はいずれも確認できました。誤検知・根拠不備は見つかりません。

MISSED | ③バリデーション/②業務ルール | 注文番号の突合方法差分がfindingsに無い。設計は `sprintf` で桁埋めされた注文番号でサブ注文情報を検索すると規定するが、実装はCSV値をそのまま `order_number` に `findOneBy` しており、桁埋めもサブ注文検索もない。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:69`, `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:98`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:112` | 差分として追加。入力CSVの注文番号フォーマット互換に影響するため med 相当。

SEVERITY | ①ルート/HTTPメソッド | POSTパス差分は確認できるが、画面テンプレートは `admin_shipping_result_csv_import` へPOSTし、実装側も同じ `/import` パスをPOSTで受けるため、画面操作上は成立する。外部URL契約の差分としては妥当だが、業務影響は med より low 寄り。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:228-229`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:240-265`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:45` | severityを low に下げる検討。

SEVERITY | ⑧バッチ/API入出力・再実行性 | 成功後の出荷完了メール送信欠落は候補の指摘どおり確認できる。ポイント処理のトランザクション内実行も確認済み。顧客通知が設計上の成功時出力に含まれるため、medでは過小評価の可能性がある。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:75`, `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:129`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:313-327`、同controller内に `MailService` 参照なし | severityを high に上げる検討。

FALSE_POSITIVE | 全体 | なし。 | 確認不能ではなく、候補6件の主要根拠は実在確認済み。 | 対応不要。

WEAK_EVIDENCE | 全体 | なし。 | designRefのMarkdown行、implRefの実装行はいずれも実在。 | 対応不要。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
79,199
監査結果です。候補6件は、参照行の実在性と主要な差分内容はいずれも確認できました。誤検知・根拠不備は見つかりません。

MISSED | ③バリデーション/②業務ルール | 注文番号の突合方法差分がfindingsに無い。設計は `sprintf` で桁埋めされた注文番号でサブ注文情報を検索すると規定するが、実装はCSV値をそのまま `order_number` に `findOneBy` しており、桁埋めもサブ注文検索もない。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:69`, `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:98`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:112` | 差分として追加。入力CSVの注文番号フォーマット互換に影響するため med 相当。

SEVERITY | ①ルート/HTTPメソッド | POSTパス差分は確認できるが、画面テンプレートは `admin_shipping_result_csv_import` へPOSTし、実装側も同じ `/import` パスをPOSTで受けるため、画面操作上は成立する。外部URL契約の差分としては妥当だが、業務影響は med より low 寄り。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:228-229`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:240-265`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:45` | severityを low に下げる検討。

SEVERITY | ⑧バッチ/API入出力・再実行性 | 成功後の出荷完了メール送信欠落は候補の指摘どおり確認できる。ポイント処理のトランザクション内実行も確認済み。顧客通知が設計上の成功時出力に含まれるため、medでは過小評価の可能性がある。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:75`, `/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md:129`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:313-327`、同controller内に `MailService` 参照なし | severityを high に上げる検討。

FALSE_POSITIVE | 全体 | なし。 | 確認不能ではなく、候補6件の主要根拠は実在確認済み。 | 対応不要。

WEAK_EVIDENCE | 全体 | なし。 | designRefのMarkdown行、implRefの実装行はいずれも実在。 | 対応不要。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
