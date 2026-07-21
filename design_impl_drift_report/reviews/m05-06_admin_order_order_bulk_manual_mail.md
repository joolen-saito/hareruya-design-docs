OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26a9-798c-7b83-a0c6-9385d2f0fc57
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-06_admin_order_order_bulk_manual_mail
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-06_admin_order_order_bulk_manual_mail.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html
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
差分候補と該当設計書、実装参照を実ファイルで確認します。まずJSONの内容と周辺ファイル構成を読みます。
exec
/bin/bash -lc "pwd && rg --files /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings | rg 'm05-06_admin_order_order_bulk_manual_mail|Order|Mail|manual|bulk'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/hareruya-design-docs
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-12_admin_order_order_bulk_status_change.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-06_admin_order_order_bulk_manual_mail.json
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m15-04_admin_deck_deck_bulk_update.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m14-03_admin_card_card_bulk_delete.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m08-08_admin_customer_customer_manual_mail.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m15-03_admin_deck_deck_bulk_delete.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m13-07_admin_event_event_entry_bulk_update.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m07-04_admin_online_purchase_purchase_manual_mail.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f06-12_front_member_mypage_bulk_purchase_result.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/PurchaseProductListOrderBy.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStatusHistoryRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/OrderFlow.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/BuyOrderAutoStockCommand.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderIndivisualInputProductRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderIndivisualInputProductRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderApproverRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderPdfRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MailTemplateRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderItemType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByCustomizer.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByClause.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/ProductListOrderByType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/MailTemplateType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/OrderStatusFilter.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderDetailRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderDetailType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderMailType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerManualMailType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderItemType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/MailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MailType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbOrderTypeRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderItemTypeRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/CustomerOrderStatusRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbBuyOrderStatusRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/MailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusColorRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/ProductListOrderByRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbOtcBuyOrderStatusRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MailHistoryRepository.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Calculator/OrderItemCollection.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/ResendMailCommand.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderGainPointMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderUsePointMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderHistoryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/ShippingStandbyType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BuyOrderStockType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseManualMailType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BuyOrderIndivisualInputProductsType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderManualMailType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerMailHistoryType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerMailType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderManualMailAllType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallMailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/OtcBuyOrder/HistorySearchDataDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/OtcBuyOrder/SearchDataDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/Purchase/purchase_bulk_info_ec_modal.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Enterprise/Tenant/CreateProcessor/GenerateTenantMailTemplatesProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/deck_bulk_js.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/SmaregiOtcOrderLock.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/WaitingTagController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/MailUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/customer.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_cvs.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_complete.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_include_delivery_fee_old.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_cash_on_delivery.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/customer.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_assessment.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content_tax.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/stock_approval_alert.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_cash_on_delivery.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_bank_transfer.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_old.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/customer_migration.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_cash_on_carry.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_payment_none.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_post_transfer.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderPdfService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_cash_on_carry.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_post_transfer.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_include_delivery_fee.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_cvs.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateBuyOrderDetailDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDetailDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateBuyOrderDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Deck/bulk.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Deck/bulk.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/entry_complete.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_cvs.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/entry_confirm.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/assessment_approval.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_cash_on_delivery.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/team_member_invitation.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_cash_and_carry.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/evententry_complete.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/point_expire_notification.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/otc_buy_order_no_section_alert.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content_tax.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/point_expire_notification.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_cash_on_delivery.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_bank_transfer.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/id_expire_notification.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/entry_confirm.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_cash_on_carry.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/entry_complete.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/customer_withdraw_mail.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/customer_change_notify.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/evententry_complete.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_payment_none.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_post_transfer.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/deck_entry_complete.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/deck_entry_complete.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/evententry_cvs.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_cash_on_carry.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/evententry_cvs.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/customer_withdraw_mail.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_post_transfer.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/otc_buy_order_accounting_payment_pending.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/team_member_invitation.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/forgot_mail.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/sale_notification.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/notification_of_arrival.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/entry_complete.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_cvs.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/evententry_credit.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/evententry_credit.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/customer_change_notify.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/contact_mail.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/sale_notification.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/entry_confirm.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_credit.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/identification_confirm.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/evententry_credit_error.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/forgot_mail.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_payment_none.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/assessment_approval_old.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_bank_transfer.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/reset_complete_mail.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_credit.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/contact_mail.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderDetailEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStockHistoryEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderApproverEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/BuyOrderStock/BuyMainCardSaleStockService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStockEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/no_base.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/customer_migration.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_assessment_old.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_credit.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_payment_none.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_bank_transfer.en.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_credit.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_net_bulk.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Stock/RestockNotificationMailSender.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStockEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderIndivisualInputProductEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/MailHistoryEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStockHistoryEntityManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateFreeCommentAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderItemCleanupProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderSequenceNoProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PreOrderIdValidator.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStock.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStock.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderSummary.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/ActionInput/UpdateStatusInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/RebuildOtcBuyOrderStockAndHistory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/ActionInput/UpdateBuyOrderInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateDoubleCheckMemberAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/ActionInput/UpdateFreeCommentInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateIdentificationAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/RebuildOtcBuyOrderDetail.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateFreeCommentAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/BuildBuyMainCard.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/RebuildOtcBuyOrderIndivisualInputProduct.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/BuildOtcBuyOrderDetailUpdatePlan.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderApprover.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailTemplate.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/RebuildOtcBuyOrderStockAndHistoryInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateDoubleCheckMemberInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/RebuildOtcBuyOrderIndivisualInputProductInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateFreeCommentInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/RebuildOtcBuyOrderDetailInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderDetail.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderIndivisualInputProduct.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStockHistory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbUserMailHistory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateIdentificationInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateOtcBuyOrderActionInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateStatusInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/ServiceInput/SendManualPurchaseMailInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/mail_manual_confirm.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/mail_manual.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNo.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/SummaryByDateAggregator.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateOtcBuyOrderStockAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderStockInbound.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RecalculateSummaryAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RegisterIndividualStockAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/ActionInput/UpsertBuyOrderStockInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/ActionInput/BuyOrderStockInboundInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderStockInbound.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/UpsertBuyOrderStockExecutor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatusColor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/WaitingTagDeleteAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderItemType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpsertOtcBuyOrderStockExecutor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAutoStockAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStockHistory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNumber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderIndivisualInputProduct.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderItem.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/ActionInput/UpdateStatusInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/ActionInput/UpsertOtcBuyOrderStockInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/ActionInput/RecalculateSummaryInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/ActionInput/OtcBuyOrderStockInboundInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/ActionInput/UpdateOtcBuyOrderStockInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/ActionInput/RegisterIndividualStockInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailHistory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ActionInput/UpdateStackListInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ActionInput/UpdatePrintedOrderStatusInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ActionInput/GenerateListInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ActionInput/OrderDirectPrintInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/TruncateWaitingNumberAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/WaitingTagStoreAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/manual_mail.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/manual_mail_confirm.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/ProductListOrderBy.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyOrderStatus.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CustomerOrderStatus.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/AutoMail/detail.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/ActionInput/PurchaseOrderSubmitInput.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_item_prototype.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail_confirm.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_item_type.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_confirm.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/search_customer.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/waiting_tag.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/confirmationModal_js.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all_confirm.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/status.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/summary.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/bulkapproval.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category_bulk.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-06_admin_order_order_bulk_manual_mail.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 198ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括） - 機能仕様書</title>
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
   187	<a class="lv3" href="#一覧から当機能へ入る">一覧から当機能へ入る</a>
   188	<a class="lv3" href="#入力画面を表示する-GET">入力画面を表示する（GET）</a>
   189	<a class="lv3" href="#確認画面へ進む-POST-mode-confirm">確認画面へ進む（POST `mode=confirm`）</a>
   190	<a class="lv3" href="#送信する-POST-mode-complete">送信する（POST `mode=complete`）</a>
   191	<a class="lv3" href="#本文-createManualBody-の要点">本文 `createManualBody` の要点</a>
   192	<a class="lv2" href="#集計条件">集計条件</a>
   193	<a class="lv2" href="#入力項目">入力項目</a>
   194	<a class="lv2" href="#エッジケース">エッジケース</a>
   195	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   196	<a class="lv2" href="#データ整合性">データ整合性</a>
   197	<a class="lv2" href="#API-バッチ">API／バッチ</a>
   198	<a class="lv2" href="#副作用">副作用</a>
   199	<a class="lv2" href="#画面遷移">画面遷移</a>
   200	<a class="lv2" href="#エラー処理">エラー処理</a>
   201	<a class="lv2" href="#ログと秘匿情報">ログと秘匿情報</a>
   202	<a class="lv2" href="#調査補助-grep用">調査補助（grep用）</a>
   203	<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a>
   204	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a></nav>
   205	    </aside>
   206	    <main class="doc-content">
   207	      <header class="page-header">
   208	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.md</p>
   209	        <h1>m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）</h1>
   210	      </header>
   211	      <h2 id="概要">概要</h2>
   212	<p>管理画面の受注一覧から、チェックした配送行に対応する受注宛てに、指定したメールテンプレート（販売用注文メール日本語・英語・ベースなしの3系統）と任意編集した件名・ヘッダー・フッターを用いたplaintextメールを順次送る機能である。一覧上の文言はドロップダウンで「メール一括通知」と表示される（翻訳キーは無固定文字列）。画面見出し・サブタイトルでは「手動メール通知」「一括メール通知」など既存の受注メール用ラベルが使われる。</p>
   213	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とするソースは <code>src/Eccube/Controller/Admin/Order/MailController.php</code>、<code>src/Eccube/Form/Type/Admin/OrderManualMailAllType.php</code>、<code>src/Eccube/Service/MailService.php</code>（<code>replaceBody</code>、<code>getBody</code>、<code>sendManualMailForBulk</code>）、<code>src/Eccube/Resource/template/admin/Order/index.twig</code>、<code>manual_mail_all.twig</code>、<code>manual_mail_all_confirm.twig</code>、<code>src/Eccube/Entity/MailTemplate.php</code>、<code>src/Eccube/Repository/OrderRepository.php</code>（<code>findForOrderMail</code>）、<code>src/Eccube/Util/OrderUtil.php</code> とする。</p>
   214	<p>対象はブラウザ経由の管理画面に限定する。</p>
   215	<p>本機能のカスタマイズ区分はカスタマイズである。現行挙動は pf-eccube3 のHareruyaEcプラグイン実装を参照し、リニューアル移行後の挙動とDBは ec-cube-enterprise を確認値とする。DB関連の記述は ec-cube-enterprise を正とする。</p>
   216	<p>受注一覧の検索・セッションの詳細は別設計（<code>m05-01_admin_order_order_search_list</code>）を正とする。一覧の「メールを送信」ボタン（<code>bulkSendMail</code>）から開く出荷通知メールの一括確認モーダル・XHR送信、受注詳細からの単票手動メール（ルート <code>m05-15_admin_order_order_mail</code>）、メールテンプレートマスタの運用全般は本書の主題としない。</p>
   217	<p>コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。</p>
   218	<hr>
   219	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   220	<p>メール一括送信は現行 pf-eccube3 では HareruyaEc プラグインで実装し、送信履歴を補助テーブル <code>dtb_user_mail_history</code>（主キー <code>send_id</code>）に保存する。移行先 ec-cube-enterprise では送信履歴を <code>dtb_mail_history</code>（主キー <code>id</code>）へ統合する。DB関連は ec-cube-enterprise を正とし、本書のテーブル・列名は移行先名で記す。</p>
   221	<div class="table-wrap"><table><thead><tr><th>項目</th><th>現行 pf-eccube3（HareruyaEc）</th><th>移行先 ec-cube-enterprise</th></tr></thead><tbody><tr><td>メール送信履歴テーブル</td><td><code>dtb_user_mail_history</code>（主キー <code>send_id</code>）</td><td><code>dtb_mail_history</code>（主キー <code>id</code>）</td></tr><tr><td>履歴の紐付け</td><td>テンプレート・受注・顧客・買取注文・操作会員</td><td><code>template_id</code>, <code>order_id</code>, <code>customer_id</code>, <code>buy_order_id</code>, <code>creator_id</code>, <code>base_info_id</code></td></tr><tr><td>件名・本文</td><td>件名・本文を保持</td><td><code>mail_subject</code>, <code>mail_body</code>, <code>mail_html_body</code></td></tr><tr><td>メールテンプレートマスタ</td><td><code>dtb_mail_template</code></td><td><code>dtb_mail_template</code>（同一）</td></tr><tr><td>一括送信の確認画面</td><td>確認画面なし。POST で直接フォーム検証し送信する（<code>manual_mail_all.twig</code> 単一画面、<code>MailController</code> のbulkメソッド）</td><td>確認画面あり（<code>mode=confirm</code> で文面プレビュー → <code>mode=complete</code> で送信、<code>manual_mail_all_confirm.twig</code>）</td></tr><tr><td>対象受注パラメータ</td><td><code>order_ids[受注ID]</code> 形式</td><td><code>ids[]</code> 形式</td></tr><tr><td>送信成功フラッシュ</td><td><code>admin.mail.send_success</code></td><td><code>admin.order.mail_send_complete</code></td></tr><tr><td>送信後リダイレクト</td><td>遷移元（Referer）へ戻る</td><td><code>admin_order</code> へ</td></tr></tbody></table></div>
   222	<p>本書の副作用節・入力項目の保存先記述は移行先 ec-cube-enterprise の名称（<code>dtb_mail_history</code> 等）に合わせている。現行の補助テーブル名は上表で対応づける。</p>
   223	<p>注: 本書の「利用者視点の入口」「処理フロー」「表示メッセージ」節は移行先 ec-cube-enterprise の確認画面フロー（<code>mode=confirm</code>／<code>complete</code>）を基準に記述している。現行 pf-eccube3（HareruyaEc）は確認画面を持たず、入力画面の送信で直接一括送信する点が上表のとおり異なる。</p>
   224	<hr>
   225	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   226	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧で1件以上の配送行にチェックを入れ、「その他」→「メール一括通知」を押す</td><td><code>GET /{admin_route}/order/manual_mail/mail_all?ids[]=…</code>（<code>form_bulk</code> をmethod GETに切り替えて送信するため、他の隠し項目がクエリに載る場合がある）</td><td>テンプレート未選択の一括手動メール入力画面が開く。件名・確認ボタンはテンプレート選択まで無効扱い</td></tr><tr><td>一覧で未チェックのまま「メール一括通知」を押す</td><td>（ブラウザが当ルートへ遷移しない）</td><td><code>alert</code> で「チェックボックスが選択されていません」と表示し、遷移を止める</td></tr><tr><td>入力画面でテンプレートプルダウンを変更する</td><td><code>GET /{admin_route}/order/manual_mail/mail_all/{templateId}?ids[]=…</code></td><td>選択IDをクエリに付けたまま、本文プレビュー欄が再構築される（フルページ遷移）</td></tr><tr><td>入力画面で「確認」を押す</td><td><code>POST /{admin_route}/order/manual_mail/mail_all/{templateId}?ids[]=…</code>（<code>mode=confirm</code>）</td><td>検証成功時、先頭受注を用いた文面プレビュー付き確認画面を返す</td></tr><tr><td>確認画面で「送信」を押す</td><td><code>POST</code> 同上（<code>mode=complete</code>）</td><td>受注ごとにメールを送り、成功フラッシュのうえ <code>admin_order</code> へリダイレクトする</td></tr><tr><td>確認画面で「手動メール通知画面に戻る」</td><td><code>GET /{admin_route}/order/manual_mail/mail_all/{templateId}?ids[]=…</code></td><td>入力画面に戻る</td></tr><tr><td>入力画面で「受注一覧に戻る」</td><td><code>GET /{admin_route}/order/page/{page_no}</code> または相当（セッション <code>eccube.admin.order.search.page_no</code> の既定 1）</td><td>一覧へ戻る。離脱確認メッセージは共通リンクラベル用翻訳に依存する</td></tr></tbody></table></div>
   227	<hr>
   228	<h2 id="フロント挙動">フロント挙動</h2>
   229	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>一覧は検索結果件数が正のときだけ一括用 <code>form_bulk</code> と「その他」ドロップダウンが描画される。一括手動メール画面は2カラムで、左にテンプレ選択・件名・本文プレビュー、右に送信先テーブル（注文番号・注文者名。複数配送を選んだ受注は注文番号セル内に複数 hidden <code>ids[]</code> を並べる）。確認画面ではテンプレ名・件名・本文を読み取り専用表示</td></tr><tr><td>JS挙動</td><td>テンプレ選択変更時、全 <code>ids_*</code> hidden の値を拾って <code>ids%5B%5D=</code> を連結し、ルート <code>admin_order_manual_mail_all</code> または <code>admin_order_manual_mail_all_edit</code> へ <code>location.href</code> する。一覧側は <code>#manualMailAll</code> クリックで未チェックなら <code>alert</code>、済なら <code>form_bulk</code> を GET にして送信</td></tr><tr><td>CSS・レイアウト</td><td><code>page_admin_order_manual_mail_all</code> 接頭の body id に対し、ページタイトル行の flex 調整用インラインスタイルがある</td></tr><tr><td>モーダル・ポップアップ</td><td>本機能専用の確認モーダルはない（確認は別テンプレートの画面遷移）</td></tr></tbody></table></div>
   230	<hr>
   231	<h2 id="処理フロー">処理フロー</h2>
   232	<h3 id="一覧から当機能へ入る">一覧から当機能へ入る</h3>
   233	<ol><li>利用者が配送行のチェックボックスを1件以上オンにする。一覧の一括操作ラッパは <code>toggleBtnBulk</code> で表示される。</li><li>「その他」内「メール一括通知」を押す。JavaScript が <code>form_bulk</code> の <code>method</code> を <code>GET</code>、<code>action</code> を <code>admin_order_manual_mail_all</code> にし、送信する。</li><li>サーバが <code>ids</code> 互換パラメータを配列として読む。空または非配列なら <code>NotFoundHttpException</code>（404）。</li><li>配送リポジトリで <code>id IN ids</code> を検索する。</li><li>見つからない配送IDがあるとき、欠けたIDごとに翻訳キー <code>admin.order.mail_all.error.missing</code> を渡したエラーフラッシュを積む（メッセージ文言は「注文ID」とあるが、実装で埋め込むのは欠落した配送ID。実装を確認値とする）。ここで <code>admin_order</code> へリダイレクトし、以降の手順は実行しない。</li><li>配送から受注IDを取り出し <code>array_unique</code> する。受注IDごとに <code>findBy</code> した <code>Orders</code> を以降の画面と送信ループに使う。</li></ol>
   234	<h3 id="入力画面を表示する-GET">入力画面を表示する（GET）</h3>
   235	<ol><li><code>templateId</code> 付き GET なら、ID とファイル名（上記3種のいずれか）でメールテンプレートを1件取得する。不一致なら 404。</li><li>テンプレートがある場合、Twigローダーからファイルソースを読み、<code>replaceBody</code> で <code>{{ include('Mail/order_content.twig'…)}}</code> 等を静的に展開し、<code>{{ header }}</code> / <code>{{ footer }}</code> をtextarea付きHTMLに置換した文字列を本文欄にraw出力する。</li><li><code>OrderManualMailAllType</code> のフォームを作成し、テンプレ選択肢を上記ファイル名に限定する。テンプレがある場合は <code>template</code> と <code>subject</code> フィールドにそのテンプレを反映する。</li><li>右カラムのテーブルで各受注の表示用注文番号は <code>OrderUtil::getOrderNumbers</code>（<code>Order#getOrderNo()</code>）を用いる。受注に紐づく配送のうち、当初選択に含まれる ID だけ hidden で再送する。</li></ol>
   236	<h3 id="確認画面へ進む-POST-mode-confirm">確認画面へ進む（POST <code>mode=confirm</code>）</h3>
   237	<ol><li>フォームを <code>handleRequest</code> する。<code>template</code>、<code>subject</code>、<code>header</code>、<code>footer</code> はいずれも未入力不可（<code>NotBlank</code>）。</li><li><code>header</code> / <code>footer</code> は入力画面ではSymfonyの <code>form_row</code> ではなく、<code>replaceBody</code> が埋め込んだ <code>mail[header]</code> / <code>mail[footer]</code> のtextareaと、テンプレ未選択時に空になるhiddenが同居しうる。送信時は同名フィールドの最終値がリクエスト解釈に使われる（ブラウザの一般的な挙動に依存。textareaが存在するケースではそちらが後段に配置される）。</li><li>検証成功かつテンプレオブジェクト取得済みなら、ループ対象の「先頭」の受注に対し <code>createManualBody</code> を呼び、確認テンプレートへ <code>previewBody</code> として渡す。先頭受注が無ければプレビュー本文は空文字。</li><li>確認テンプレートでは、送信後も POST できるよう <code>mail[template]</code> と <code>mail[subject]</code> を hidden にし、<code>header</code> / <code>footer</code> は非表示だが <code>form_widget</code> で載せる。</li></ol>
   238	<h3 id="送信する-POST-mode-complete">送信する（POST <code>mode=complete</code>）</h3>
   239	<ol><li>フォーム検証とテンプレ存在を満たすとき、受注ユニーク集合の各要素について本文 <code>createManualBody</code> を組み立て、<code>sendManualMailForBulk</code> を呼ぶ。件名はリクエストの <code>mail[subject]</code>（確認画面 hidden 経由の連続 POST を想定）。</li><li>各メールは <code>Email</code> の plaintext。From は基準店舗の問い合わせ用メール01と店名、To は受注のメールアドレス、Bcc はメール01、Reply-To はメール03、Return-Path はメール04。共通ユーティリティで本文 charset 等を設定したうえ送信する。</li><li>送信のたびメール履歴を永続化し、その場で <code>flush</code> する。テンプレート参照・受注・顧客・ゲストIDを履歴に載せる実装である。</li><li>ループ後、成功フラッシュ <code>admin.order.mail_send_complete</code> を積み、<code>admin_order</code> へリダイレクトする。</li></ol>
   240	<h3 id="本文-createManualBody-の要点">本文 <code>createManualBody</code> の要点</h3>
   241	<ol><li><code>orderRepository-&gt;findForOrderMail(受注ID)</code> で受注・配送・明細・商品・配送方法をまとめて取得し直す（一覧行の受注よりメール用に結合が揃う）。</li><li>小計・送料・手数料から値引を差し引いた額に対し <code>PriceUtil::taxCalculation</code> を適用した税額表示用値と、受注番号、基準店舗、置換後ヘッダー・フッター等を <code>getBody(テンプレファイル名, …)</code> に渡し、Twigを文字列テンプレートとしてレンダリングした結果を返す。</li></ol>
   242	<hr>
   243	<h2 id="集計条件">集計条件</h2>
   244	<p>本機能は売上集計を行わない。送信対象件数は「選択配送に紐づく受注IDを一意化した個数」に等しい。</p>
   245	<hr>
   246	<h2 id="入力項目">入力項目</h2>
   247	<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>テンプレ選択</td><td>必須</td><td>選択式（フォームの文字長上限は該当しない）</td><td>プレースホルダ相当の空選択または GET で渡したテンプレ</td><td><code>MailTemplateType</code>。候補は <code>mt.file_name</code> が <code>Mail/sell_order.twig</code>、<code>Mail/sell_order.en.twig</code>、<code>Mail/no_base.twig</code> のものに限定。変更時は同一画面を別 <code>templateId</code> で GET し直す</td></tr><tr><td>件名</td><td>必須</td><td>フォームに <code>Length</code> 制約は無い</td><td>選択テンプレの <code>mail_subject</code>。確認・送信時は hidden で再送</td><td>送信時に <code>sendManualMailForBulk</code> の件名として使われ、履歴の件名にもなる。マスタ側 <code>mail_subject</code> 列は255だが、入力値の検証はこのフォームでは255に切らない</td></tr><tr><td>ヘッダー</td><td>必須</td><td>フォームに <code>Length</code> 制約は無い（DB上メールテンプレの <code>header</code> 列は TEXT）</td><td>選択テンプレのヘッダ</td><td><code>replaceBody</code> が本文プレビュー内に <code>name="mail[header]"</code> の textarea を埋め込む。<code>getBody</code> に渡る置換後文字列として本文生成に使われる</td></tr><tr><td>フッター</td><td>必須</td><td>同上</td><td>選択テンプレのフッター</td><td><code>name="mail[footer]"</code> の textarea。本文生成に使われる</td></tr></tbody></table></div>
   248	<p>テンプレ未確定の間、確認ボタンは <code>disabled</code> である。</p>
   249	<hr>
   250	<h2 id="エッジケース">エッジケース</h2>
   251	<div class="table-wrap"><table><thead><tr><th>状況</th><th>結果</th></tr></thead><tbody><tr><td><code>ids</code> が空・非配列</td><td>404</td></tr><tr><td>一部の配送IDがDBに存在しない</td><td>欠落IDごとにエラーフラッシュ、<code>admin_order</code> へ戻る</td></tr><tr><td>同一受注の複数配送を選択</td><td>受注は1件として扱い、メールは1通</td></tr><tr><td><code>templateId</code> が数値でない・許可外ファイル</td><td>404</td></tr><tr><td>確認画面で先頭受注が無い（理論上、受注配列が空）</td><td>プレビュー本文は空。送信ループも回らない</td></tr><tr><td>一覧の検索結果0件</td><td>一括フォーム自体が無いため、当入口からは操作できない</td></tr></tbody></table></div>
   252	<hr>
   253	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   254	<ul><li>本機能の判定・集計・表示条件は既存実装のリポジトリ、サービス、フォーム定義を正とする。</li><li>金額・ポイント・数量・ステータス・日時は永続化済み値または既存サービスの計算結果を使用し、画面・API層で独自補正しない。</li><li>条件不一致、権限不足、検証エラー時は業務データを更新せず、既存のエラー形式または画面遷移に従う。</li></ul>
   255	<h2 id="データ整合性">データ整合性</h2>
   256	<p>一覧上の注文番号表示（<code>order_number</code>）と、本機能右カラム・履歴まわりで参照する <code>getOrderNo()</code> は別フィールドであり、同一値とは限らない。受注メール本文内の注文番号表記は <code>createManualBody</code> が <code>Order#getOrderNo()</code> を渡す実装に従う。</p>
   257	<p>送信直後に一覧へ戻るため、当画面は一覧の最新検索状態を自動では再読込しない。検索セッションは既存の受注一覧仕様に従う。</p>
   258	<hr>
   259	<h2 id="API-バッチ">API／バッチ</h2>
   260	<p>本機能では扱わない。</p>

 succeeded in 172ms:
{
  "functionId": "m05-06_admin_order_order_bulk_manual_mail",
  "title": "m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html",
  "findings": [
    {
      "dimension": "②業務ルール・計算 / データ整合性",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:256",
      "designQuote": "受注メール本文内の注文番号表記は createManualBody が Order#getOrderNo() を渡す実装に従う。",
      "implRef": "src/Eccube/Controller/Admin/Order/MailController.php:464",
      "difference": "設計はメール本文へ渡す注文番号を Order#getOrderNo()(order_no列)としているが、実装 createManualBody は 'orderNumber' => $Order->getOrderNumber()(order_number列)を渡している。設計自身がデータ整合性節で order_number と getOrderNo() は別フィールドで同一値とは限らないと明記しており、顧客宛メール本文および履歴に表示される注文番号が設計と異なる値になりうる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "src/Eccube/Controller/Admin/Order/MailController.php:464 で 'orderNumber' => $Order->getOrderNumber()。Entity/Order.php:1768-1770 getOrderNumber() は order_number 列(647-648: length 11, comment '注文番号')を返す。getOrderNo()(887-889)は別の order_no 列(464-465: length 255)を返す。両者は別フィールド。設計HTML:256 は createManualBody が getOrderNo() を渡すと記述しており実装と食い違う。"
    },
    {
      "dimension": "②業務ルール・計算 / 画面表示",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:235",
      "designQuote": "右カラムのテーブルで各受注の表示用注文番号は OrderUtil::getOrderNumbers（Order#getOrderNo()）を用いる。",
      "implRef": "src/Eccube/Util/OrderUtil.php:37",
      "difference": "設計は入力画面右カラムの表示用注文番号を OrderUtil::getOrderNumbers 経由で Order#getOrderNo()(order_no列)から取ると記すが、実装 OrderUtil::getOrderNumbers は $order->getOrderNumber()(order_number列)を返す。設計で別フィールドと明記された二値のうち実装は order_number を用いており、画面表示の注文番号が設計注記と異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "src/Eccube/Util/OrderUtil.php:37 で $orderNumbers[$order->getid()] = $order->getOrderNumber(); を返す。getOrderNumber() は order_number 列(Order.php:1768-1770, 647-648)。設計HTML:235 の括弧注記は getOrderNo() としており実装(getOrderNumber)と食い違う。"
    }
  ]
}

codex
JSON上のfindingは2件で、どちらも `order_no` と `order_number` の扱いが焦点です。次に実装の該当行、テンプレート、フォーム、ルート周辺を開いて、誤検知や追加見落としがないか確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php | sed -n '1,120p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php | sed -n '1,560p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Util;
    17	
    18	use Eccube\Repository\OrderRepository;
    19	
    20	/**
    21	 * 受注に関するユーティリティクラス。
    22	 */
    23	class OrderUtil
    24	{
    25	    /**
    26	     * 受注情報IDから注文番号を取得する
    27	     *
    28	     * @param OrderRepository $orderRepository
    29	     * @param int[] $orderIds
    30	     *
    31	     * @return array <int, string|null>
    32	     */
    33	    public static function getOrderNumbers(mixed $orderRepository, array $orderIds): array
    34	    {
    35	        $orderNumbers = [];
    36	        foreach ($orderRepository->findBy(['id' => $orderIds]) as $order) {
    37	            $orderNumbers[$order->getid()] = $order->getOrderNumber();
    38	        }
    39	
    40	        return $orderNumbers;
    41	    }
    42	}

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
    16	use Doctrine\Common\Collections\Criteria;
    17	use Eccube\Controller\AbstractController;
    18	use Eccube\Entity\MailHistory;
    19	use Eccube\Entity\MailTemplate;
    20	use Eccube\Entity\Order;
    21	use Eccube\Event\EccubeEvents;
    22	use Eccube\Event\EventArgs;
    23	use Eccube\Form\Type\Admin\OrderMailType;
    24	use Eccube\Form\Type\Admin\OrderManualMailAllType;
    25	use Eccube\Form\Type\Admin\OrderManualMailType;
    26	use Eccube\Repository\BaseInfoRepository;
    27	use Eccube\Repository\MailHistoryRepository;
    28	use Eccube\Repository\MailTemplateRepository;
    29	use Eccube\Repository\OrderRepository;
    30	use Eccube\Repository\ShippingRepository;
    31	use Eccube\Service\MailService;
    32	use Eccube\Util\OrderUtil;
    33	use Eccube\Util\PriceUtil;
    34	use Symfony\Bridge\Twig\Attribute\Template;
    35	use Symfony\Component\HttpFoundation\RedirectResponse;
    36	use Symfony\Component\HttpFoundation\Request;
    37	use Symfony\Component\HttpFoundation\Response;
    38	use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
    39	use Symfony\Component\Routing\Attribute\Route;
    40	use Twig\Environment;
    41	use Twig\Error\LoaderError;
    42	use Twig\Error\RuntimeError;
    43	use Twig\Error\SyntaxError;
    44	
    45	class MailController extends AbstractController
    46	{
    47	    /**
    48	     * MailController constructor.
    49	     */
    50	    public function __construct(
    51	        protected MailService $mailService,
    52	        protected MailHistoryRepository $mailHistoryRepository,
    53	        protected OrderRepository $orderRepository,
    54	        protected Environment $twig,
    55	        protected ShippingRepository $shippingRepository,
    56	        protected MailTemplateRepository $mailTemplateRepository,
    57	        protected BaseInfoRepository $baseInfoRepository,
    58	    ) {
    59	    }
    60	
    61	    /**
    62	     * @return Response|RedirectResponse|array<string, mixed>
    63	     *
    64	     * @throws LoaderError  When the template cannot be found
    65	     * @throws SyntaxError  When an error occurred during compilation
    66	     * @throws RuntimeError When an error occurred during rendering
    67	     */
    68	    #[Route(path: '/%eccube_admin_route%/order/{id}/mail', name: 'admin_order_mail', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
    69	    #[Template(template: '@admin/Order/mail.twig')]
    70	    public function index(Request $request, Order $Order): Response|RedirectResponse|array
    71	    {
    72	        $MailHistories = $this->mailHistoryRepository->findBy(['Order' => $Order]);
    73	
    74	        $builder = $this->formFactory->createBuilder(OrderMailType::class);
    75	
    76	        $event = new EventArgs(
    77	            [
    78	                'builder' => $builder,
    79	                'Order' => $Order,
    80	                'MailHistories' => $MailHistories,
    81	            ],
    82	            $request
    83	        );
    84	        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_MAIL_INDEX_INITIALIZE);
    85	
    86	        $form = $builder->getForm();
    87	
    88	        if ('POST' === $request->getMethod()) {
    89	            $form->handleRequest($request);
    90	
    91	            $mode = $request->get('mode');
    92	
    93	            $body = null;
    94	            // テンプレート変更の場合は. バリデーション前に内容差し替え.
    95	            switch ($mode) {
    96	                case 'change':
    97	                    if ($form->get('template')->isValid()) {
    98	                        /** @var MailTemplate|null $MailTemplate */
    99	                        $MailTemplate = $form->get('template')->getData();
   100	
   101	                        if ($MailTemplate) {
   102	                            $twig = $MailTemplate->getFileName();
   103	                            if (!$twig) {
   104	                                $twig = 'Mail/order.twig';
   105	                            }
   106	
   107	                            // 本文確認用
   108	                            $body = $this->createBody($Order, $twig);
   109	                        }
   110	
   111	                        $form = $builder->getForm();
   112	                        $event = new EventArgs(
   113	                            [
   114	                                'form' => $form,
   115	                                'Order' => $Order,
   116	                                'MailTemplate' => $MailTemplate,
   117	                            ],
   118	                            $request
   119	                        );
   120	                        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_MAIL_INDEX_CHANGE);
   121	                        $form->get('template')->setData($MailTemplate);
   122	                        if ($MailTemplate) {
   123	                            $form->get('mail_subject')->setData($MailTemplate->getMailSubject());
   124	                        }
   125	                        $form->get('tpl_data')->setData($body);
   126	                    }
   127	                    break;
   128	                case 'confirm':
   129	                    if ($form->isSubmitted() && $form->isValid()) {
   130	                        $builder->setAttribute('freeze', true);
   131	                        $builder->setAttribute('freeze_display_text', false);
   132	                        $form = $builder->getForm();
   133	                        $form->handleRequest($request);
   134	
   135	                        return $this->render('@admin/Order/mail_confirm.twig', [
   136	                            'form' => $form->createView(),
   137	                            'Order' => $Order,
   138	                            'MailHistories' => $MailHistories,
   139	                        ]);
   140	                    }
   141	                    break;
   142	                case 'complete':
   143	                    if ($form->isSubmitted() && $form->isValid()) {
   144	                        $data = $form->getData();
   145	                        $data['tpl_data'] = $form->get('tpl_data')->getData();
   146	
   147	                        // メール送信
   148	                        $message = $this->mailService->sendAdminOrderMail($Order, $data);
   149	
   150	                        // 送信履歴を保存.
   151	                        $MailTemplate = $form->get('template')->getData();
   152	                        $MailHistory = new MailHistory();
   153	                        $MailHistory
   154	                            ->setMailSubject($message->getSubject())
   155	                            ->setBaseInfo($this->getMember()->getBaseInfo())
   156	                            ->setMailBody($message->getTextBody())
   157	                            ->setCustomer($Order->getCustomer())
   158	                            ->setSendDate(new \DateTime())
   159	                            ->setOrder($Order);
   160	
   161	                        $this->entityManager->persist($MailHistory);
   162	                        $this->entityManager->flush();
   163	
   164	                        $event = new EventArgs(
   165	                            [
   166	                                'form' => $form,
   167	                                'Order' => $Order,
   168	                                'MailTemplate' => $MailTemplate,
   169	                                'MailHistory' => $MailHistory,
   170	                            ],
   171	                            $request
   172	                        );
   173	                        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_MAIL_INDEX_COMPLETE);
   174	
   175	                        $this->addSuccess('admin.order.mail_send_complete', 'admin');
   176	
   177	                        return $this->redirectToRoute('admin_order_edit', ['id' => $Order->getId()]);
   178	                    }
   179	                    break;
   180	                default:
   181	                    break;
   182	            }
   183	        }
   184	
   185	        return [
   186	            'form' => $form->createView(),
   187	            'Order' => $Order,
   188	            'MailHistories' => $MailHistories,
   189	        ];
   190	    }
   191	
   192	    private function createBody(Order $Order, string $twig = 'Mail/order.twig'): string
   193	    {
   194	        $body = '';
   195	        try {
   196	            $body = $this->renderView($twig, [
   197	                'Order' => $Order,
   198	            ]);
   199	        } catch (LoaderError $e) {
   200	            $this->addError('admin.order.mail_template_not_found_error', 'admin');
   201	            log_warning($e->getMessage());
   202	        } catch (\Exception $e) {
   203	            log_warning($e->getMessage());
   204	        }
   205	
   206	        return $body;
   207	    }
   208	
   209	    /**
   210	     * 手動メール通知（一件分）
   211	     *
   212	     * @param Request $request
   213	     * @param int $orderId
   214	     * @param int $templateId
   215	     *
   216	     * @return array<string, mixed>|Response
   217	     */
   218	    #[Route(path: '/%eccube_admin_route%/order/manual_mail', name: 'admin_order_manual_mail', methods: ['GET'])]
   219	    #[Route(path: '/%eccube_admin_route%/order/manual_mail/{orderId}/{templateId}', name: 'admin_order_manual_mail_edit', requirements: ['orderId' => '\d+', 'templateId' => '\d+'], methods: ['GET', 'POST'])]
   220	    #[Template(template: '@admin/Order/manual_mail.twig')]
   221	    public function manualMail(Request $request, ?int $orderId = null, ?int $templateId = null)
   222	    {
   223	        $orderId = $orderId ?? $request->query->getInt('orderId');
   224	        if ($orderId <= 0) {
   225	            throw new NotFoundHttpException();
   226	        }
   227	
   228	        $Order = $this->orderRepository->find($orderId);
   229	        if (!$Order instanceof Order) {
   230	            throw new NotFoundHttpException();
   231	        }
   232	
   233	        $mail = null;
   234	        if ($templateId) {
   235	            $mail = $this->getManualMailTemplate($templateId);
   236	            $body = $this->createManualBody($mail, $Order);
   237	        }
   238	
   239	        $form = $this->formFactory
   240	            ->createBuilder(OrderManualMailType::class, $mail, ['autoMail' => false, 'baseFiles' => [MailTemplate::BASE_SELL_ORDER, MailTemplate::BASE_SELL_ORDER_EN]])
   241	            ->getForm();
   242	
   243	        if ($mail) {
   244	            $form->get('template')->setData($mail);
   245	            $form->get('subject')->setData($mail->getMailSubject());
   246	            // 編集画面の本文は mail[body]（テンプレ組み立て済みを初期表示）
   247	            $form->get('body')->setData($body);
   248	        }
   249	
   250	        if ('POST' === $request->getMethod()) {
   251	            $form->handleRequest($request);
   252	            $mode = $request->get('mode');
   253	
   254	            switch ($mode) {
   255	                // 確認画面
   256	                case 'confirm':
   257	                    if ($form->isSubmitted() && $form->isValid() && $mail) {
   258	                        // テキストエリアで編集した内容をプレビュー表示
   259	                        $previewBody = (string) $form->get('body')->getData();
   260	
   261	                        return $this->render('@admin/Order/manual_mail_confirm.twig', [
   262	                            'form' => $form->createView(),
   263	                            'id' => $templateId,
   264	                            'Order' => $Order,
   265	                            'previewSubject' => $form->get('subject')->getData(),
   266	                            'previewBody' => $previewBody,
   267	                            'mail' => $mail,
   268	                        ]);
   269	                    }
   270	                    break;
   271	                    // 送信する
   272	                case 'complete':
   273	                    if ($form->isSubmitted() && $form->isValid() && $mail) {
   274	                        $bodyText = (string) $form->get('body')->getData();
   275	
   276	                        $this->mailService->sendManualMailForBulk($Order, $mail, $bodyText, $request->request->all());
   277	
   278	                        $this->addSuccess('admin.order.mail_send_complete', 'admin');
   279	
   280	                        return $this->redirectToRoute('admin_order_edit', ['id' => $Order->getId()]);
   281	                    }
   282	                    break;
   283	            }
   284	        }
   285	
   286	        return [
   287	            'form' => $form->createView(),
   288	            'id' => $templateId,
   289	            'Order' => $Order,
   290	            'body' => $body ?? '',
   291	            'mail' => $mail,
   292	        ];
   293	    }
   294	
   295	    /**
   296	     * 一括手動メール通知
   297	     *
   298	     * @param Request $request
   299	     * @param int $templateId
   300	     *
   301	     * @return Response
   302	     */
   303	    #[Route(path: '/%eccube_admin_route%/order/manual_mail/mail_all', name: 'admin_order_manual_mail_all', methods: ['GET'])]
   304	    #[Route(path: '/%eccube_admin_route%/order/manual_mail/mail_all/{templateId}', name: 'admin_order_manual_mail_all_edit', requirements: ['templateId' => '\d+'], methods: ['GET', 'POST'])]
   305	    #[Template(template: '@admin/Order/manual_mail_all.twig')]
   306	    public function manualMailAll(Request $request, $templateId = null)
   307	    {
   308	        $shippingIds = $request->get('ids', []);
   309	        if (!is_array($shippingIds) || $shippingIds === []) {
   310	            throw new NotFoundHttpException();
   311	        }
   312	
   313	        // 配送IDの存在チェックを先に行う
   314	        $Shippings = $this->shippingRepository->findBy(['id' => $shippingIds]);
   315	        $foundShippingIds = array_map(fn ($Shipping) => $Shipping->getId(), $Shippings);
   316	        $missingShippingIds = array_diff($shippingIds, $foundShippingIds);
   317	        if ($missingShippingIds !== []) {
   318	            foreach ($missingShippingIds as $missingId) {
   319	                $this->addError(
   320	                    sprintf($this->translator->trans('admin.order.mail_all.error.missing'), $missingId),
   321	                    'admin'
   322	                );
   323	            }
   324	
   325	            return $this->redirectToRoute('admin_order');
   326	        }
   327	
   328	        // 注文IDの重複を排除
   329	        $orderIds = array_unique(
   330	            array_map(fn ($Shipping) => $Shipping->getOrder()->getId(), $Shippings)
   331	        );
   332	        $Orders = $this->orderRepository->findBy(['id' => $orderIds]);
   333	
   334	        // 注文番号を取得
   335	        $orderNumbers = OrderUtil::getOrderNumbers($this->orderRepository, $orderIds);
   336	
   337	        $mail = null;
   338	        $templateBody = '';
   339	        if ($templateId) {
   340	            $mail = $this->getManualMailTemplate($templateId);
   341	            $source = $this->twig->getLoader()->getSourceContext($mail->getFileName())->getCode();
   342	            $templateBody = $this->mailService->replaceBody($source, $mail);
   343	        }
   344	
   345	        $form = $this->formFactory
   346	        ->createBuilder(OrderManualMailAllType::class, $mail, [
   347	            'autoMail' => false,
   348	            'baseFiles' => [
   349	                MailTemplate::BASE_SELL_ORDER,
   350	                MailTemplate::BASE_SELL_ORDER_EN,
   351	                MailTemplate::BASE_NO_BASE,
   352	            ],
   353	        ])
   354	        ->getForm();
   355	
   356	        if ($mail) {
   357	            $form->get('template')->setData($mail);
   358	            $form->get('subject')->setData($mail->getMailSubject());
   359	        }
   360	
   361	        if ('POST' === $request->getMethod()) {
   362	            $form->handleRequest($request);
   363	            $mode = $request->get('mode');
   364	
   365	            $header = $form->get('header')->getData();
   366	            $footer = $form->get('footer')->getData();
   367	
   368	            switch ($mode) {
   369	                // 確認画面
   370	                case 'confirm':
   371	                    if ($form->isSubmitted() && $form->isValid() && $mail) {
   372	                        $firstOrder = reset($Orders) ?: null;
   373	                        $previewBody = $firstOrder
   374	                            ? $this->createManualBody($mail, $firstOrder, $header, $footer)
   375	                            : '';
   376	
   377	                        return $this->render('@admin/Order/manual_mail_all_confirm.twig', [
   378	                            'form' => $form->createView(),
   379	                            'id' => $templateId,
   380	                            'Orders' => $Orders,
   381	                            'firstOrder' => $firstOrder,
   382	                            'previewSubject' => $form->get('subject')->getData(),
   383	                            'previewBody' => $previewBody,
   384	                            'mail' => $mail,
   385	                            'orderNumbers' => $orderNumbers,
   386	                            'shippingIds' => $shippingIds,
   387	                        ]);
   388	                    }
   389	                    break;
   390	                    // 送信する
   391	                case 'complete':
   392	                    if ($form->isSubmitted() && $form->isValid() && $mail) {
   393	                        foreach ($Orders as $Order) {
   394	                            $body = $this->createManualBody($mail, $Order, $header, $footer);
   395	                            $this->mailService->sendManualMailForBulk($Order, $mail, $body, $request->request->all());
   396	                        }
   397	
   398	                        $this->addSuccess('admin.order.mail_send_complete', 'admin');
   399	
   400	                        return $this->redirectToRoute('admin_order');
   401	                    }
   402	                    break;
   403	            }
   404	        }
   405	
   406	        return $this->render('@admin/Order/manual_mail_all.twig', [
   407	            'form' => $form->createView(),
   408	            'id' => $templateId,
   409	            'Orders' => $Orders,
   410	            'body' => $templateBody,
   411	            'mail' => $mail,
   412	            'orderNumbers' => $orderNumbers,
   413	            'shippingIds' => $shippingIds,
   414	        ]);
   415	    }
   416	
   417	    /**
   418	     * 手動メールテンプレートを取得
   419	     *
   420	     * @param int $templateId
   421	     *
   422	     * @return MailTemplate
   423	     */
   424	    private function getManualMailTemplate(int $templateId): MailTemplate
   425	    {
   426	        $criteria = new Criteria();
   427	        $criteria->andWhere($criteria->expr()->eq('id', $templateId))
   428	            ->andWhere($criteria->expr()->in('file_name', [
   429	                MailTemplate::BASE_FILES[MailTemplate::BASE_SELL_ORDER],
   430	                MailTemplate::BASE_FILES[MailTemplate::BASE_SELL_ORDER_EN],
   431	                MailTemplate::BASE_FILES[MailTemplate::BASE_NO_BASE],
   432	            ]));
   433	
   434	        $mail = $this->mailTemplateRepository->matching($criteria)->first();
   435	        if (!$mail) {
   436	            throw new NotFoundHttpException();
   437	        }
   438	
   439	        return $mail;
   440	    }
   441	
   442	    /**
   443	     * 手動メール本文を作成
   444	     *
   445	     * @param MailTemplate $mail
   446	     * @param Order $Order
   447	     * @param string|null $header
   448	     * @param string|null $footer
   449	     *
   450	     * @return string
   451	     */
   452	    private function createManualBody(MailTemplate $mail, Order $Order, ?string $header = null, ?string $footer = null): string
   453	    {
   454	        $baseInfo = $this->baseInfoRepository->get();
   455	        list($Order, $Delivery) = $this->orderRepository->findForOrderMail($Order->getId());
   456	
   457	        $total = ((int) $Order->getSubtotal() + (int) $Order->getDeliveryFeeTotal() + (int) $Order->getCharge()) - (int) $Order->getDiscount();
   458	
   459	        return $this->mailService->getBody($mail->getFileName(), [
   460	            'header' => $header ?? $mail->getHeader(),
   461	            'footer' => $footer ?? $mail->getFooter(),
   462	            'Order' => $Order,
   463	            'taxPrice' => PriceUtil::taxCalculation($total),
   464	            'orderNumber' => $Order->getOrderNumber(),
   465	            'Delivery' => $Delivery,
   466	            'BaseInfo' => $baseInfo,
   467	        ]);
   468	    }
   469	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '430,910p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '1740,1785p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   430	                    $OrderItem = $orderItemArray[$productClassId];
   431	                    $quantity = bcadd($OrderItem->getQuantity(), $ProductOrderItem->getQuantity(), 0);
   432	                    $OrderItem->setQuantity($quantity);
   433	                } else {
   434	                    // 新規規格の商品は新しく追加する
   435	                    $OrderItem = new OrderItem();
   436	                    $OrderItem->copyProperties($ProductOrderItem, ['id']);
   437	                    $orderItemArray[$productClassId] = $OrderItem;
   438	                }
   439	            }
   440	
   441	            return array_values($orderItemArray);
   442	        }
   443	
   444	        /**
   445	         * 合計金額を計算
   446	         *
   447	         * @deprecated
   448	         */
   449	        public function getTotalPrice(): string
   450	        {
   451	            @trigger_error('The '.__METHOD__.' method is deprecated.', E_USER_DEPRECATED);
   452	
   453	            return $this->getPaymentTotal();
   454	        }
   455	
   456	        #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true])]
   457	        #[ORM\Id]
   458	        #[ORM\GeneratedValue(strategy: 'IDENTITY')]
   459	        private ?int $id = null;
   460	
   461	        #[ORM\Column(name: 'pre_order_id', type: Types::STRING, length: 255, nullable: true)]
   462	        private ?string $pre_order_id = null;
   463	
   464	        #[ORM\Column(name: 'order_no', type: Types::STRING, length: 255, nullable: true)]
   465	        private ?string $order_no = null;
   466	
   467	        #[ORM\Column(name: 'message', type: Types::STRING, length: 4000, nullable: true)]
   468	        private ?string $message = null;
   469	
   470	        #[ORM\Column(name: 'name01', type: Types::STRING, length: 255)]
   471	        private ?string $name01 = null;
   472	
   473	        #[ORM\Column(name: 'name02', type: Types::STRING, length: 255)]
   474	        private ?string $name02 = null;
   475	
   476	        #[ORM\Column(name: 'kana01', type: Types::STRING, length: 255, nullable: true)]
   477	        private ?string $kana01 = null;
   478	
   479	        #[ORM\Column(name: 'kana02', type: Types::STRING, length: 255, nullable: true)]
   480	        private ?string $kana02 = null;
   481	
   482	        #[ORM\Column(name: 'company_name', type: Types::STRING, length: 255, nullable: true)]
   483	        private ?string $company_name = null;
   484	
   485	        #[ORM\Column(name: 'email', type: Types::STRING, length: 255, nullable: true)]
   486	        private ?string $email = null;
   487	
   488	        #[ORM\Column(name: 'postal_code', type: Types::STRING, length: 8, nullable: true)]
   489	        private ?string $postal_code = null;
   490	
   491	        #[ORM\Column(name: 'addr01', type: Types::STRING, length: 255, nullable: true)]
   492	        private ?string $addr01 = null;
   493	
   494	        #[ORM\Column(name: 'addr02', type: Types::STRING, length: 255, nullable: true)]
   495	        private ?string $addr02 = null;
   496	
   497	        /**
   498	         * @var \DateTimeInterface|null
   499	         */
   500	        #[ORM\Column(name: 'birth', type: Types::DATE_MUTABLE, nullable: true)]
   501	        private ?\DateTimeInterface $birth = null;
   502	
   503	        #[ORM\Column(name: 'subtotal', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   504	        private ?string $subtotal = '0';
   505	
   506	        #[ORM\Column(name: 'discount', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   507	        private ?string $discount = '0';
   508	
   509	        #[ORM\Column(name: 'delivery_fee_total', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   510	        private ?string $delivery_fee_total = '0';
   511	
   512	        #[ORM\Column(name: 'charge', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   513	        private ?string $charge = '0';
   514	
   515	        /**
   516	         * @deprecated 明細ごとに集計した税額と差異が発生する場合があるため非推奨
   517	         */
   518	        #[ORM\Column(name: 'tax', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   519	        private ?string $tax = '0';
   520	
   521	        #[ORM\Column(name: 'total', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   522	        private ?string $total = '0';
   523	
   524	        #[ORM\Column(name: 'payment_total', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   525	        private ?string $payment_total = '0';
   526	
   527	        #[ORM\Column(name: 'payment_method', type: Types::STRING, length: 255, nullable: true)]
   528	        private ?string $payment_method = null;
   529	
   530	        #[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)]
   531	        private ?string $note = null;
   532	
   533	        /**
   534	         * @var \DateTime
   535	         */
   536	        #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE)]
   537	        private $create_date;
   538	
   539	        /**
   540	         * @var \DateTime
   541	         */
   542	        #[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE)]
   543	        private $update_date;
   544	
   545	        /**
   546	         * @var \DateTime|null
   547	         */
   548	        #[ORM\Column(name: 'order_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   549	        private $order_date;
   550	
   551	        /**
   552	         * @var \DateTime|null
   553	         */
   554	        #[ORM\Column(name: 'payment_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   555	        private $payment_date;
   556	
   557	        #[ORM\Column(name: 'currency_code', type: Types::STRING, nullable: true)]
   558	        private ?string $currency_code = null;
   559	
   560	        /**
   561	         * 注文完了画面に表示するメッセージ
   562	         *
   563	         * プラグインから注文完了時にメッセージを表示したい場合, このフィールドにセットすることで, 注文完了画面で表示されます。
   564	         * 複数のプラグインから利用されるため, appendCompleteMesssage()で追加してください.
   565	         * 表示する際にHTMLは利用可能です。
   566	         */
   567	        #[ORM\Column(name: 'complete_message', type: Types::TEXT, nullable: true)]
   568	        private ?string $complete_message = null;
   569	
   570	        /**
   571	         * 注文完了メールに表示するメッセージ
   572	         *
   573	         * プラグインから注文完了メールにメッセージを表示したい場合, このフィールドにセットすることで, 注文完了メールで表示されます。
   574	         * 複数のプラグインから利用されるため, appendCompleteMailMesssage()で追加してください.
   575	         */
   576	        #[ORM\Column(name: 'complete_mail_message', type: Types::TEXT, nullable: true)]
   577	        private ?string $complete_mail_message = null;
   578	
   579	        /**
   580	         * @var Collection<int, OrderItem>
   581	         */
   582	        #[ORM\OneToMany(targetEntity: OrderItem::class, mappedBy: 'Order', cascade: ['persist', 'remove'])]
   583	        private $OrderItems;
   584	
   585	        /**
   586	         * @var Collection<int, Shipping>
   587	         */
   588	        #[ORM\OneToMany(targetEntity: Shipping::class, mappedBy: 'Order', cascade: ['persist', 'remove'])]
   589	        private $Shippings;
   590	
   591	        /**
   592	         * @var Collection<int, MailHistory>
   593	         */
   594	        #[ORM\OneToMany(targetEntity: MailHistory::class, mappedBy: 'Order', cascade: ['remove'])]
   595	        #[ORM\OrderBy(['send_date' => 'DESC'])]
   596	        private $MailHistories;
   597	
   598	        #[ORM\ManyToOne(targetEntity: Customer::class, inversedBy: 'Orders')]
   599	        #[ORM\JoinColumn(name: 'customer_id', referencedColumnName: 'id')]
   600	        private ?Customer $Customer = null;
   601	
   602	        #[ORM\ManyToOne(targetEntity: Country::class)]
   603	        #[ORM\JoinColumn(name: 'country_id', referencedColumnName: 'id')]
   604	        private ?Country $Country = null;
   605	
   606	        #[ORM\ManyToOne(targetEntity: Pref::class)]
   607	        #[ORM\JoinColumn(name: 'pref_id', referencedColumnName: 'id')]
   608	        private ?Pref $Pref = null;
   609	
   610	        #[ORM\ManyToOne(targetEntity: Sex::class)]
   611	        #[ORM\JoinColumn(name: 'sex_id', referencedColumnName: 'id')]
   612	        private ?Sex $Sex = null;
   613	
   614	        #[ORM\ManyToOne(targetEntity: Job::class)]
   615	        #[ORM\JoinColumn(name: 'job_id', referencedColumnName: 'id')]
   616	        private ?Job $Job = null;
   617	
   618	        #[ORM\ManyToOne(targetEntity: Payment::class)]
   619	        #[ORM\JoinColumn(name: 'payment_id', referencedColumnName: 'id')]
   620	        private ?Payment $Payment = null;
   621	
   622	        #[ORM\ManyToOne(targetEntity: DeviceType::class)]
   623	        #[ORM\JoinColumn(name: 'device_type_id', referencedColumnName: 'id')]
   624	        private ?DeviceType $DeviceType = null;
   625	
   626	        /**
   627	         * OrderStatusより先にプロパティを定義しておかないとセットされなくなる
   628	         */
   629	        #[ORM\ManyToOne(targetEntity: CustomerOrderStatus::class)]
   630	        #[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]
   631	        private ?CustomerOrderStatus $CustomerOrderStatus = null;
   632	
   633	        /**
   634	         * OrderStatusより先にプロパティを定義しておかないとセットされなくなる
   635	         */
   636	        #[ORM\ManyToOne(targetEntity: OrderStatusColor::class)]
   637	        #[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]
   638	        private ?OrderStatusColor $OrderStatusColor = null;
   639	
   640	        #[ORM\ManyToOne(targetEntity: OrderStatus::class)]
   641	        #[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]
   642	        private ?OrderStatus $OrderStatus = null;
   643	
   644	        #[ORM\Column(name: 'waiting_number', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => '店舗販売用整理番号'])]
   645	        private ?int $waitingNumber = null;
   646	
   647	        #[ORM\Column(name: 'order_number', type: Types::STRING, length: 11, nullable: true, options: ['unsigned' => true, 'comment' => '注文番号'])]
   648	        private ?string $order_number = null;
   649	
   650	        #[ORM\JoinColumn(name: 'operator_id', referencedColumnName: 'id')]
   651	        #[ORM\ManyToOne(targetEntity: Member::class)]
   652	        private ?Member $Member = null;
   653	
   654	        #[ORM\Column(name: 'gained_points', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント発生'])]
   655	        private ?int $gained_points = null;
   656	
   657	        #[ORM\Column(name: 'spended_points', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント使用'])]
   658	        private ?int $spended_points = null;
   659	
   660	        #[ORM\Column(name: 'payment_detail', type: Types::STRING, length: 255, nullable: true, options: ['comment' => '支払詳細'])]
   661	        private ?string $payment_detail = null;
   662	
   663	        #[ORM\Column(name: 'credit_payment_total', type: Types::INTEGER, nullable: true, options: ['comment' => '与信時金額合計'])]
   664	        private ?int $credit_payment_total = null;
   665	
   666	        #[ORM\Column(name: 'confirm_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '注文確定日'])]
   667	        private ?\DateTime $confirmDate = null;
   668	
   669	        #[ORM\Column(name: 'commit_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '出荷指示日'])]
   670	        private ?\DateTime $commitDate = null;
   671	
   672	        #[ORM\Column(name: 'shipping_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '出荷日'])]
   673	        private ?\DateTime $shippingDate = null;
   674	
   675	        #[ORM\Column(name: 'picking_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'ピック開始日'])]
   676	        private ?\DateTime $picking_date = null;
   677	
   678	        #[ORM\Column(name: 'pick_finish_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'ピック完了日'])]
   679	        private ?\DateTime $pick_finish_date = null;
   680	
   681	        #[ORM\Column(name: 'closing_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '販売完了日'])]
   682	        private ?\DateTime $closing_date = null;
   683	
   684	        #[ORM\Column(name: 'cancel_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'キャンセル日'])]
   685	        private ?\DateTime $cancel_date = null;
   686	
   687	        #[ORM\Column(name: 'receipt_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '売上確定日'])]
   688	        private ?\DateTime $receiptDate = null;
   689	
   690	        #[ORM\Column(name: 'due_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '支払期限日'])]
   691	        private ?\DateTime $dueDate = null;
   692	
   693	        #[ORM\Column(name: 'invoice_number', type: Types::STRING, length: 64, nullable: true, options: ['comment' => '送り状No.'])]
   694	        private ?string $invoiceNumber = null;
   695	
   696	        #[ORM\Column(name: 'otc_rsv_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '店頭予約日'])]
   697	        private ?\DateTime $otc_rsv_date = null;
   698	
   699	        #[ORM\Column(name: 'smaregi_code', type: Types::STRING, length: 20, nullable: true, options: ['comment' => 'スマレジ用商品コード'])]
   700	        private ?string $smaregi_code = null;
   701	
   702	        #[ORM\Column(name: 'smaregi_product_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'スマレジ商品連携フラグ'])]
   703	        private bool $smaregi_product_flg = false;
   704	
   705	        #[ORM\Column(name: 'smaregi_stock_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'スマレジ在庫連携フラグ'])]
   706	        private bool $smaregi_stock_flg = false;
   707	
   708	        #[ORM\Column(name: 'smaregi_del_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'スマレジ削除フラグ'])]
   709	        private bool $smaregi_del_flg = false;
   710	
   711	        #[ORM\Column(name: 'smaregi_error_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'スマレジ連携エラーフラグ'])]
   712	        private bool $smaregi_error_flg = false;
   713	
   714	        #[ORM\Column(name: 'smaregi_receipt_no', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'スマレジレシート番号'])]
   715	        private ?int $smaregiReceiptNo = null;
   716	
   717	        #[ORM\Column(name: 'point_error_message', type: Types::TEXT, nullable: true, options: ['comment' => 'ポイント連携エラーメッセージ'])]
   718	        private ?string $point_error_message = null;
   719	
   720	        #[ORM\Column(name: 'point_percentage', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント還元率(%)'])]
   721	        private ?int $pointPercentage = null;
   722	
   723	        #[ORM\Column(name: 'abroad_postal_code', type: Types::STRING, length: 10, nullable: true, options: ['comment' => '国外郵便番号'])]
   724	        private ?string $abroadPostalCode = null;
   725	
   726	        #[ORM\Column(name: 'fax01', type: Types::STRING, length: 5, nullable: true, options: ['comment' => 'FAX番号1'])]
   727	        private ?string $fax01 = null;
   728	
   729	        #[ORM\Column(name: 'fax02', type: Types::STRING, length: 5, nullable: true, options: ['comment' => 'FAX番号2'])]
   730	        private ?string $fax02 = null;
   731	
   732	        #[ORM\Column(name: 'fax03', type: Types::STRING, length: 5, nullable: true, options: ['comment' => 'FAX番号3'])]
   733	        private ?string $fax03 = null;
   734	
   735	        #[ORM\Column(name: 'browser_print_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'ブラウザ印刷フラグ'])]
   736	        private bool $browser_print_flg = false;
   737	
   738	        #[ORM\Column(name: 'addr03', type: Types::STRING, length: 255, nullable: true)]
   739	        private ?string $addr03;
   740	
   741	        #[ORM\Column(name: 'tel01', type: Types::STRING, length: 5, nullable: true, options: ['comment' => '電話番号1'])]
   742	        private ?string $tel01 = null;
   743	
   744	        #[ORM\Column(name: 'tel02', type: Types::STRING, length: 5, nullable: true, options: ['comment' => '電話番号2'])]
   745	        private ?string $tel02 = null;
   746	
   747	        #[ORM\Column(name: 'tel03', type: Types::STRING, length: 5, nullable: true, options: ['comment' => '電話番号3'])]
   748	        private ?string $tel03 = null;
   749	
   750	        #[ORM\Column(name: 'pickup_today', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'ピックアップ当日フラグ'])]
   751	        private bool $pickupToday = false;
   752	
   753	        #[ORM\Column(name: 'tax_free', type: Types::INTEGER, nullable: true, options: ['comment' => '免税額'])]
   754	        private ?int $taxFree = null;
   755	
   756	        #[ORM\Column(name: 'coupon_discount', type: Types::INTEGER, nullable: true, options: ['comment' => 'クーポン値引き'])]
   757	        private ?int $couponDiscount = null;
   758	
   759	        #[ORM\Column(name: 'subtotal_discount_division', type: Types::INTEGER, nullable: true, options: ['comment' => '小計値引き/割引区分'])]
   760	        private ?int $subtotalDiscountDivision = null;
   761	
   762	        #[ORM\Column(name: 'smaregi_memo', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'スマレジメモ'])]
   763	        private ?string $smaregiMemo = null;
   764	
   765	        #[ORM\Column(name: 'smaregi_transaction_id', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'スマレジ取引ID'])]
   766	        private ?string $smaregiTransactionId = null;
   767	
   768	        #[ORM\Column(name: 'next_order_id', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => '移行先受注ID (スマレジ Webhook により上位の統合受注へ移行された際の参照先)'])]
   769	        private ?int $nextOrderId = null;
   770	
   771	        #[ORM\Column(name: 'deleted_at', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '削除日時'])]
   772	        private ?\DateTime $deletedAt = null;
   773	
   774	        /**
   775	         * 購入履歴区分判定用（DB 非永続）。
   776	         * 他受注の next_order_id がこの受注 ID を指している場合 true。
   777	         * OrderRepository::applyPredecessorFlagsToOrders 適用前は false。
   778	         */
   779	        private bool $hasPredecessorOrder = false;
   780	
   781	        /**
   782	         * 店頭受取→スマレジ取引の購入日表示用（DB 非永続）。
   783	         * 関連する店頭受取受注の order_date のうち最も新しい日付。
   784	         * OrderRepository::applyOtcSmaregiLinkedDisplayData 適用前は null。
   785	         */
   786	        private ?\DateTime $otcSmaregiLinkedPurchaseDate = null;
   787	
   788	        /**
   789	         * 店頭受取→スマレジ取引の注文番号一覧表示用（DB 非永続）。
   790	         * 統合グループに含まれる全受注の order_number を id 昇順で格納。
   791	         * OrderRepository::applyOtcSmaregiLinkedDisplayData 適用前は空配列。
   792	         *
   793	         * @var list<string>
   794	         */
   795	        private array $otcSmaregiLinkedOrderNumbers = [];
   796	
   797	        /**
   798	         * Constructor
   799	         */
   800	        public function __construct(?OrderStatus $OrderStatus = null)
   801	        {
   802	            $this->setDiscount('0')
   803	                ->setSubtotal('0')
   804	                ->setTotal('0')
   805	                ->setPaymentTotal('0')
   806	                ->setCharge('0')
   807	                ->setTax('0')
   808	                ->setDeliveryFeeTotal('0');
   809	
   810	            $this->OrderItems = new ArrayCollection();
   811	            $this->Shippings = new ArrayCollection();
   812	            $this->MailHistories = new ArrayCollection();
   813	
   814	            if ($OrderStatus !== null) {
   815	                $this->setOrderStatus($OrderStatus);
   816	            }
   817	        }
   818	
   819	        /**
   820	         * Clone
   821	         */
   822	        public function __clone()
   823	        {
   824	            $OrderItems = new ArrayCollection();
   825	            foreach ($this->OrderItems as $OrderItem) {
   826	                $OrderItems->add(clone $OrderItem);
   827	            }
   828	            $this->OrderItems = $OrderItems;
   829	
   830	            //            // ShippingとOrderItemが循環参照するため, 手動でヒモ付を変更する.
   831	            //            $Shippings = new ArrayCollection();
   832	            //            foreach ($this->Shippings as $Shipping) {
   833	            //                $CloneShipping = clone $Shipping;
   834	            //                foreach ($OriginOrderItems as $OrderItem) {
   835	            //                    //$CloneShipping->removeOrderItem($OrderItem);
   836	            //                }
   837	            //                foreach ($this->OrderItems as $OrderItem) {
   838	            //                    if ($OrderItem->getShipping() && $OrderItem->getShipping()->getId() == $Shipping->getId()) {
   839	            //                        $OrderItem->setShipping($CloneShipping);
   840	            //                    }
   841	            //                    $CloneShipping->addOrderItem($OrderItem);
   842	            //                }
   843	            //                $Shippings->add($CloneShipping);
   844	            //            }
   845	            //            $this->Shippings = $Shippings;
   846	        }
   847	
   848	        /**
   849	         * Get id.
   850	         */
   851	        public function getId(): ?int
   852	        {
   853	            return $this->id;
   854	        }
   855	
   856	        /**
   857	         * Set preOrderId.
   858	         */
   859	        public function setPreOrderId(?string $preOrderId = null): Order
   860	        {
   861	            $this->pre_order_id = $preOrderId;
   862	
   863	            return $this;
   864	        }
   865	
   866	        /**
   867	         * Get preOrderId.
   868	         */
   869	        public function getPreOrderId(): ?string
   870	        {
   871	            return $this->pre_order_id;
   872	        }
   873	
   874	        /**
   875	         * Set orderNo
   876	         */
   877	        public function setOrderNo(?string $orderNo = null): Order
   878	        {
   879	            $this->order_no = $orderNo;
   880	
   881	            return $this;
   882	        }
   883	
   884	        /**
   885	         * Get orderNo
   886	         */
   887	        public function getOrderNo(): ?string
   888	        {
   889	            return $this->order_no;
   890	        }
   891	
   892	        /**
   893	         * Set message.
   894	         */
   895	        public function setMessage(?string $message = null): Order
   896	        {
   897	            $this->message = $message;
   898	
   899	            return $this;
   900	        }
   901	
   902	        /**
   903	         * Get message.
   904	         */
   905	        public function getMessage(): ?string
   906	        {
   907	            return $this->message;
   908	        }
   909	
   910	        /**
  1740	            if ($item instanceof OrderItem) {
  1741	                $this->OrderItems->add($item);
  1742	            }
  1743	        }
  1744	
  1745	        #[\Override]
  1746	        public function getQuantity(): string
  1747	        {
  1748	            $quantity = '0';
  1749	            foreach ($this->getItems() as $item) {
  1750	                $quantity = bcadd($quantity, $item->getQuantity(), 0);
  1751	            }
  1752	
  1753	            return $quantity;
  1754	        }
  1755	
  1756	        public function setWaitingNumber(?int $waitingNumber): Order
  1757	        {
  1758	            $this->waitingNumber = $waitingNumber;
  1759	
  1760	            return $this;
  1761	        }
  1762	
  1763	        public function getWaitingNumber(): ?int
  1764	        {
  1765	            return $this->waitingNumber;
  1766	        }
  1767	
  1768	        public function getOrderNumber(): ?string
  1769	        {
  1770	            return $this->order_number;
  1771	        }
  1772	
  1773	        public function setOrderNumber(?string $order_number): Order
  1774	        {
  1775	            $this->order_number = $order_number;
  1776	
  1777	            return $this;
  1778	        }
  1779	
  1780	        public function getMember(): ?Member
  1781	        {
  1782	            return $this->Member;
  1783	        }
  1784	
  1785	        public function setMember(?Member $member): Order

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig | sed -n '1,260p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all_confirm.twig | sed -n '1,240p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	{% extends '@admin/default_frame.twig' %}
     2	
     3	{% set menus = ['order', 'order_master'] %}
     4	
     5	{% block title %}{{ 'admin.order.order_management'|trans }}{% endblock %}
     6	{% block sub_title %}{{ 'admin.order.manual_mail'|trans }}{% endblock %}
     7	
     8	{% form_theme form '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}
     9	
    10	{% block stylesheet %}
    11	    {{ parent() }}
    12	    <style>
    13	        body[id^="page_admin_order_manual_mail_all"] .c-pageTitle__titles {
    14	            display: flex;
    15	            align-items: center;
    16	            width: 100%;
    17	        }
    18	
    19	        body[id^="page_admin_order_manual_mail_all"] .c-pageTitle__subTitle {
    20	            display: flex;
    21	            flex: 1;
    22	            align-items: center;
    23	        }
    24	    </style>
    25	{% endblock %}
    26	
    27	{% block javascript %}
    28	    <script nonce="{{ csp_nonce }}">
    29	        $(function(){
    30	            $("#mail_template").on("change", function(){
    31	                var templateId = $(this).val();
    32	                var params = '';
    33	                $('[id^=ids_]').each(function (id, elm) {
    34	                    params += 'ids%5B%5D=' + $(this).attr('value') + '&';
    35	                });
    36	                if (templateId) {
    37	                    location.href = '{{ path('admin_order_manual_mail_all_edit', {'templateId': 0}) }}'.replace(/\/0$/, '/' + templateId) + '?' + params;
    38	                } else {
    39	                    location.href = '{{ path('admin_order_manual_mail_all') }}?' + params;
    40	                }
    41	            });
    42	        });
    43	    </script>
    44	{% endblock javascript%}
    45	
    46	{% block main %}
    47	    <form name="form1" role="form" class="form-horizontal" id="form1" method="post" action="">
    48	        {{ form_widget(form._token) }}
    49	        <input type="hidden" name="mail[header]" value="{{ mail ? mail.header : '' }}">
    50	        <input type="hidden" name="mail[footer]" value="{{ mail ? mail.footer : '' }}">
    51	        <div class="c-contentsArea__cols">
    52	            <div class="c-contentsArea__primaryCol">
    53	                <div class="c-primaryCol">
    54	                    <div class="card rounded border-0 mb-4">
    55	                        <div class="card-header">
    56	                            <div class="row">
    57	                                <div class="col-8">
    58	                                    <div class="d-inline-block">
    59	                                    <span class="card-title">
    60	                                        {{ 'admin.order.manual_mail.box_title'|trans }}
    61	                                    </span> 
    62	                                    </div>
    63	                                </div>
    64	                            </div>
    65	                        </div>
    66	                        <div class="card-header">
    67	                            <div class="row">
    68	                                <div class="col mb-4">
    69	                                    <div class="d-inline-block" >
    70	                                    <span class="card-title">
    71	                                        <div id="order_info">
    72	                                            {{ 'admin.order.manual_mail_all'|trans }}
    73	                                        </div>
    74	                                    </span> 
    75	                                    </div>
    76	                                </div>
    77	                            </div>
    78	
    79	                            {{ form_row(form.template) }}
    80	                            {{ form_row(form.subject) }}
    81	                        </div>
    82	                        <div class="card-body">
    83	                            <div id="mail_edit_box__body" class="row mb-3 form-group">
    84	                                <label class="col-sm-2 col-form-label">{{ 'admin.order.manual_mail_body'|trans }}
    85	</label>
    86	                                <div class="col-sm-10">
    87	                                    <div class="mt-2">{{ body|raw }}</div>
    88	                                </div>
    89	                            </div>
    90	                        </div>
    91	                    </div>
    92	                </div>
    93	            </div>      
    94	
    95	            <div class="c-contentsArea__secondaryCol">
    96	                <div class="c-secondaryCol">
    97	                    <div class="card rounded border-0 mb-4">
    98	                        <div class="card-body">
    99	                            <div id="common_info_box" class="box">
   100	                                <div id="common_info_box__header" class="box-header">
   101	                                    {{ 'admin.order.manual_mail_destination_info'|trans }}
   102	                                </div>
   103	                                <div id="common_info_box__body" class="box-body">
   104	                                    <table class="table table-striped">
   105	                                        <thead>
   106	                                            <tr>
   107	                                                <th>{{ 'admin.order.order_number'|trans }}</th>
   108	                                                <th>{{ 'admin.order.orderer_name'|trans }}
   109	</th>
   110	                                            </tr>
   111	                                        </thead>
   112	                                        <tbody>
   113	                                            {% for Order in Orders %}
   114	                                                <tr>
   115	                                                    <td>
   116	                                                        {{ attribute(orderNumbers, Order.id) }}
   117	                                                        {% for Shipping in Order.Shippings %}
   118	                                                            {% if Shipping.id in shippingIds %}
   119	                                                                <input type="hidden" id="ids_{{ Shipping.id }}" name="ids[]" value="{{ Shipping.id }}">
   120	                                                            {% endif %}
   121	                                                        {% endfor %}
   122	                                                    </td>
   123	                                                    <td>
   124	                                                        {{ Order.customer.name01 }} {{ Order.customer.name02 }}
   125	                                                    </td>
   126	                                                </tr>
   127	                                            {% endfor %}
   128	                                        </tbody>
   129	                                    </table>
   130	                                </div>
   131	                            </div>
   132	                        </div>
   133	                    </div>
   134	                </div>
   135	            </div>
   136	        </div>
   137	        <div class="c-conversionArea">
   138	            <div class="c-conversionArea__container">
   139	                <div class="row justify-content-between align-items-center">
   140	                    <div class="col-6">
   141	                        <div class="c-conversionArea__leftBlockItem">
   142	
   143	                            <a class="c-baseLink"
   144	                               href="{{ path('admin_order', { page_no : app.session.get('eccube.admin.order.search.page_no')|default('1') } ) }}"
   145	                               data-action="confirm"
   146	                               title="{{ 'admin.common.move_to_confirm_message'|trans({'%name%' : 'admin.order.order_list'|trans }) }}">
   147	                                <i class="fa fa-backward"
   148	                                   aria-hidden="true"></i><span>{{ 'admin.order.back_to_list'|trans }}</span>
   149	                            </a>
   150	                        </div>
   151	                    </div>
   152	                    <div class="col-6">
   153	                        <div id="ex-conversion-action" class="row align-items-center justify-content-end">
   154	                            <div class="col-auto">
   155	                                <button class="btn btn-ec-conversion px-5"
   156	                                        type="submit"
   157	                                        name="mode"
   158	                                        value="confirm"
   159	                                        {% if not id %}disabled{% endif %}>
   160	                                    {{ 'common.repeated_confirm'|trans }}
   161	                                </button>
   162	                            </div>
   163	                        </div>
   164	                    </div>
   165	                </div>
   166	            </div>
   167	        </div>
   168	    </form>
   169	{% endblock %}
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
    13	{% set menus = ['order', 'order_master'] %}
    14	
    15	{% block title %}{{ 'admin.order.order_management'|trans }}{% endblock %}
    16	{% block sub_title %}{{ 'admin.order.manual_mail'|trans }}{% endblock %}
    17	
    18	{% form_theme form '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}
    19	
    20	{% block stylesheet %}
    21	    {{ parent() }}
    22	    <style>
    23	        body[id^="page_admin_order_manual_mail_all"] .c-pageTitle__titles {
    24	            display: flex;
    25	            align-items: center;
    26	            width: 100%;
    27	        }
    28	
    29	        body[id^="page_admin_order_manual_mail_all"] .c-pageTitle__subTitle {
    30	            display: flex;
    31	            flex: 1;
    32	            align-items: center;
    33	        }
    34	    </style>
    35	{% endblock %}
    36	
    37	{% set backUrl = path('admin_order_manual_mail_all_edit', {'templateId': id}) %}
    38	{% set idsQuery = '' %}
    39	{% for sid in shippingIds %}
    40	    {% set idsQuery = idsQuery ~ 'ids%5B%5D=' ~ sid ~ (loop.last ? '' : '&') %}
    41	{% endfor %}
    42	
    43	{% block javascript %}
    44	    {{ parent() }}
    45	    <script nonce="{{ csp_nonce }}" src="{{ asset('assets/js/manual_mail.js', 'admin') }}"></script>
    46	{% endblock %}
    47	
    48	{% block main %}
    49	    <form name="form1" id="form1" method="post" action="{{ path('admin_order_manual_mail_all_edit', {'templateId': id}) }}?{{ idsQuery }}">
    50	        {{ form_widget(form._token) }}
    51	        <input type="hidden" name="mail[template]" value="{{ mail.id }}">
    52	        <input type="hidden" name="mail[subject]" value="{{ previewSubject }}">
    53	        <div class="d-none" aria-hidden="true">
    54	            {{ form_widget(form.header) }}
    55	            {{ form_widget(form.footer) }}
    56	        </div>
    57	
    58	        <div class="c-contentsArea__cols">
    59	            <div class="c-contentsArea__primaryCol">
    60	                <div class="c-primaryCol">
    61	                    <div class="card rounded border-0 mb-4">
    62	                        <div class="card-header">
    63	                            <div class="row">
    64	                                <div class="col">
    65	                                    <span class="card-title">{{ 'admin.order.manual_mail.box_title'|trans }}</span>
    66	                                </div>
    67	                            </div>
    68	                        </div>
    69	                        <div class="card-body">
    70	                            <div class="col mb-4">
    71	                                <div class="d-inline-block" >
    72	                                <span class="card-title">
    73	                                    <div id="order_info">
    74	                                        {{ 'admin.order.manual_mail_all'|trans }}
    75	                                    </div>
    76	                                </span> 
    77	                                </div>
    78	                            </div>
    79	
    80	                            <div class="row mb-3">
    81	                                <label class="col-sm-2 col-form-label">{{ 'admin.order.manual_mail.template'|trans }}</label>
    82	                                <div class="col-sm-10">
    83	                                    {{ mail.name }}
    84	                                </div>
    85	                            </div>
    86	                            <div class="row mb-3">
    87	                                <label class="col-sm-2 col-form-label">{{ 'admin.order.mail_subject'|trans }}</label>
    88	                                <div class="col-sm-10">
    89	                                    {{ previewSubject }}
    90	                                </div>
    91	                            </div>
    92	                            <div class="row mb-3">
    93	                                <label class="col-sm-2 col-form-label">{{ 'admin.order.manual_mail_body'|trans }}</label>
    94	                                <div class="col-sm-10">
    95	                                    <pre class="m-0 p-3">{{ previewBody }}</pre>
    96	                                </div>
    97	                            </div>
    98	                        </div>
    99	                    </div>
   100	                </div>
   101	            </div>
   102	
   103	            <div class="c-contentsArea__secondaryCol">
   104	                <div class="c-secondaryCol">
   105	                    <div class="card rounded border-0 mb-4">
   106	                        <div class="card-body">
   107	                            <div id="common_info_box" class="box">
   108	                                <div id="common_info_box__header" class="box-header">
   109	                                    <h4>{{ 'admin.order.manual_mail_destination_info'|trans }}</h4>
   110	                                </div>
   111	                                <div id="common_info_box__body" class="box-body">
   112	                                    <table class="table table-striped">
   113	                                        <thead>
   114	                                        <tr>
   115	                                            <th>{{ 'admin.order.order_number'|trans }}</th>
   116	                                            <th>{{ 'admin.order.orderer_name'|trans }}</th>
   117	                                        </tr>
   118	                                        </thead>
   119	                                        <tbody>
   120	                                        {% for Order in Orders %}
   121	                                            <tr>
   122	                                                <td>
   123	                                                    {{ attribute(orderNumbers, Order.id) }}
   124	                                                    {% for shipping in Order.Shippings %}
   125	                                                        {% if shipping.id in shippingIds %}
   126	                                                            <input type="hidden" name="ids[]" value="{{ shipping.id }}">
   127	                                                        {% endif %}
   128	                                                    {% endfor %}
   129	                                                </td>
   130	                                                <td>
   131	                                                    {{ Order.customer.name01 }} {{ Order.customer.name02 }}
   132	                                                </td>
   133	                                            </tr>
   134	                                        {% endfor %}
   135	                                        </tbody>
   136	                                    </table>
   137	                                </div>
   138	                            </div>
   139	                        </div>
   140	                    </div>
   141	                </div>
   142	            </div>
   143	        </div>
   144	
   145	        <div class="c-conversionArea">
   146	            <div class="c-conversionArea__container">
   147	                <div class="row justify-content-between align-items-center">
   148	                    <div class="col-6">
   149	                        <div class="c-conversionArea__leftBlockItem">
   150	                            <a class="c-baseLink"
   151	                               href="{{ backUrl }}?{{ idsQuery }}">
   152	                                <i class="fa fa-backward" aria-hidden="true"></i>
   153	                                <span>
   154	                                    {{ 'admin.order.back_to_manual_mail_edit'|trans }}
   155	                                </span>
   156	                            </a>
   157	                        </div>
   158	                    </div>
   159	                    <div class="col-6">
   160	                        <div class="row align-items-center justify-content-end">
   161	                            <div class="col-auto">
   162	                                <button type="submit"
   163	                                        id="send_mail"
   164	                                        class="btn btn-ec-conversion px-5"
   165	                                        name="mode"
   166	                                        value="complete">
   167	                                        {{ 'admin.order.mail_send'|trans }}
   168	                                </button>
   169	                            </div>
   170	                        </div>
   171	                    </div>
   172	                </div>
   173	            </div>
   174	        </div>
   175	    </form>
   176	{% endblock %}

codex
該当2件は行番号・引用とも実在し、実装は `getOrderNumber()` を使っていることを確認しました。追加見落としの有無を見るため、送信履歴保存、フォーム制約、一覧入口JS、メール本文テンプレートの実使用箇所を横断確認します。
exec
/bin/bash -lc "rg -n \"sendManualMailForBulk|replaceBody|getBody\\(|mail_all|manualMailAll|manualMail|MailTemplate::BASE|OrderManualMailAllType|manualMailAll\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderManualMailAllType.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailHistory.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailTemplate.php" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php | sed -n '1,260p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php | sed -n '260,560p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderManualMailAllType.php | sed -n '1,220p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Form\Type\Admin;
    17	
    18	use Doctrine\ORM\EntityRepository;
    19	use Eccube\Entity\MailTemplate;
    20	use Eccube\Form\Type\Master\MailTemplateType;
    21	use Symfony\Component\Form\AbstractType;
    22	use Symfony\Component\Form\Extension\Core\Type\TextareaType;
    23	use Symfony\Component\Form\Extension\Core\Type\TextType;
    24	use Symfony\Component\Form\FormBuilderInterface;
    25	use Symfony\Component\OptionsResolver\OptionsResolver;
    26	use Symfony\Component\Validator\Constraints as Assert;
    27	
    28	class OrderManualMailAllType extends AbstractType
    29	{
    30	    /**
    31	     * {@inheritdoc}
    32	     *
    33	     * @param array<string, mixed> $options
    34	     */
    35	    #[\Override]
    36	    public function buildForm(FormBuilderInterface $builder, array $options): void
    37	    {
    38	        $baseFileNames = array_values(array_intersect_key(
    39	            MailTemplate::BASE_FILES,
    40	            array_flip($options['baseFiles']),
    41	        ));
    42	
    43	        $builder
    44	            ->add('template', MailTemplateType::class, [
    45	                'label' => 'テンプレ選択',
    46	                'required' => true,
    47	                'mapped' => false,
    48	                'constraints' => [
    49	                    new Assert\NotBlank(),
    50	                ],
    51	                'query_builder' => fn (EntityRepository $er) => $er->createQueryBuilder('mt')
    52	                    ->where('mt.file_name IN (:fileNames)')
    53	                    ->setParameter('fileNames', $baseFileNames)
    54	                    ->orderBy('mt.id', 'ASC'),
    55	            ])
    56	            ->add('subject', TextType::class, [
    57	                'label' => '件名',
    58	                'required' => true,
    59	                'mapped' => false,
    60	                'constraints' => [
    61	                    new Assert\NotBlank(),
    62	                ],
    63	            ])
    64	            ->add('header', TextareaType::class, [
    65	                'label' => 'ヘッダー',
    66	                'required' => true,
    67	                'mapped' => false,
    68	                'constraints' => [
    69	                    new Assert\NotBlank(),
    70	                ],
    71	                'attr' => [
    72	                    'rows' => 10,
    73	                ],
    74	            ])
    75	            ->add('footer', TextareaType::class, [
    76	                'label' => 'フッター',
    77	                'required' => true,
    78	                'mapped' => false,
    79	                'constraints' => [
    80	                    new Assert\NotBlank(),
    81	                ],
    82	                'attr' => [
    83	                    'rows' => 10,
    84	                ],
    85	            ])
    86	        ;
    87	    }
    88	
    89	    /**
    90	     * {@inheritdoc}
    91	     */
    92	    #[\Override]
    93	    public function configureOptions(OptionsResolver $resolver): void
    94	    {
    95	        $resolver->setDefaults([
    96	            'data_class' => null,
    97	            'autoMail' => false,
    98	            'baseFiles' => [],
    99	        ]);
   100	    }
   101	
   102	    /**
   103	     * {@inheritdoc}
   104	     */
   105	    #[\Override]
   106	    public function getBlockPrefix(): string
   107	    {
   108	        return 'mail';
   109	    }
   110	}

 succeeded in 130ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderManualMailAllType.php:28:class OrderManualMailAllType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderManualMailAllType.php:39:            MailTemplate::BASE_FILES,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:136:            $('#manualMailAll').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1196:                                                <a class="dropdown-item" href="{{ url('admin_order_manual_mail_all') }}" id="manualMailAll">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2005:    public function replaceBody(string $body, MailTemplate $mail, string $formName = 'mail', bool $isForm = true): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2092:    public function sendManualMailForBulk(Order $order, MailTemplate $template, string $body, array $content): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2213:    public function getBody(string $view, array $params): string

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '1,260p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '260,620p'" in /home/y-saito/Developments/hareruya-design-docs
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
    12	{% set menus = ['order', 'order_master'] %}
    13	
    14	{% block title %}{{ 'admin.order.order_list'|trans }}{% endblock %}
    15	{% block sub_title %}{{ 'admin.order.order_management'|trans }}{% endblock %}
    16	
    17	{% block stylesheet %}
    18	<style>
    19	    .pickup-today-badge {
    20	        display: inline-block;
    21	        padding: 0 8px;
    22	        border: 1px solid #ff0000;
    23	        border-radius: 4px;
    24	        background-color: white;
    25	        color: red;
    26	        font-size: 80%;
    27	        font-weight: bold;
    28	        margin-left: 1em;
    29	    }
    30	    .pickup-today-badge:before {
    31	        content: "!";
    32	        display: inline-block;
    33	        width: 1.2em;
    34	        height: 1.2em;
    35	        border-radius: 50%;
    36	        background-color: red;
    37	        color: white;
    38	        text-align: center;
    39	        line-height: 1.2em;
    40	        margin-right: 0.2em;
    41	    }
    42	    .btn-print-stack {
    43	        background-color: var(--bs-orange);
    44	        border-color: transparent;
    45	    }
    46	    .btn-print-stack:hover,
    47	    .btn-print-stack:focus,
    48	    .btn-print-stack:active {
    49	        background-color: #e76f00;
    50	        border-color: transparent;
    51	    }
    52	    /* 1行に1項目だけある検索入力は中央に配置する */
    53	    #search_form .row > .col-6:only-child {
    54	        margin-right: auto;
    55	        margin-left: auto;
    56	    }
    57	    /* 入力欄サイズは維持し、詳細検索ボタンだけ右隣に表示 */
    58	    #search_form .search-field-with-toggle {
    59	        position: relative;
    60	    }
    61	    #search_form .search-field-with-toggle .search-field-main {
    62	        width: 100%;
    63	    }
    64	    #search_form .search-field-with-toggle .search-detail-toggle {
    65	        position: absolute;
    66	        left: calc(100%);
    67	        top: 50%;
    68	        transform: translateY(-50%);
    69	        white-space: nowrap;
    70	        margin-bottom: 0 !important;
    71	    }
    72	</style>
    73	{% endblock stylesheet %}
    74	
    75	{% form_theme searchForm '@admin/Form/bootstrap_4_layout.html.twig' %}
    76	{% block javascript %}
    77	    <script src="{{ asset('assets/js/select2.min.js', 'admin') }}"></script>
    78	    <script nonce="{{ csp_nonce }}">
    79	        $(function() {
    80	            const hasCheckedBulkTarget = function() {
    81	                return $('input[id^="check_"]:checked').length > 0;
    82	            };
    83	            const preventIfNoCheckedBulkTarget = function() {
    84	                if (hasCheckedBulkTarget()) {
    85	                    return false;
    86	                }
    87	                alert("チェックボックスが選択されていません");
    88	                return true;
    89	            };
    90	
    91	            const select2Ids = [
    92	                '#admin_search_order_tenants'
    93	            ];
    94	            const select2Selector = $(select2Ids.join(','));
    95	            select2Selector.select2({width:'100%'});
    96	
    97	            toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
    98	            $('input[id^="check_"]').on('change', function() {
    99	                $('#toggle_check_all').prop('checked', false);
   100	                toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
   101	            });
   102	
   103	            $('#page_count_pulldown').on('change',  function () {
   104	                //event.preventDefault();
   105	                const targetUrl = $(this).val();
   106	                if (targetUrl) {
   107	                    window.location.href = targetUrl;
   108	                }
   109	            });
   110	
   111	            // 登録チェックボックス
   112	            $('#toggle_check_all').on('change', function() {
   113	                var checked = $(this).prop('checked');
   114	                if (checked) {
   115	                    $('input[id^="check_"]').prop('checked', true);
   116	                } else {
   117	                    $('input[id^="check_"]').prop('checked', false);
   118	                }
   119	                toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
   120	            });
   121	
   122	            $('#btn_bulk_delete').on('click', function(event) {
   123	                event.preventDefault();
   124	                $('input[id^="check_"]:checked').each(function() {
   125	                    $(this).val($(this).data('order-id'));
   126	                });
   127	                $('`#form_bulk`')
   128	                    .attr('method', 'POST')
   129	                    .removeAttr('target')
   130	                    .attr('action', "{{ url('admin_order_bulk_delete') }}")
   131	                    .submit();
   132	                return false;
   133	            });
   134	
   135	            // メール一括通知
   136	            $('#manualMailAll').on('click', function(event) {
   137	                if (preventIfNoCheckedBulkTarget()) {
   138	                    event.preventDefault();
   139	                    return false;
   140	                }
   141	                event.preventDefault();
   142	                var href = $(this).attr('href');
   143	                $('#form_bulk').attr('method', 'GET').attr('action', href).submit();
   144	                return false;
   145	            });
   146	
   147	            // PDF出力(複数)
   148	            $('#bulkExportPdf').on('click', function(event) {
   149	                if (preventIfNoCheckedBulkTarget()) {
   150	                    event.preventDefault();
   151	                    return false;
   152	                }
   153	                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
   154	                $('#form_bulk').attr('action', "{{ url('admin_order_export_pdf') }}");
   155	                $('#form_bulk').attr('target', 'newwin');
   156	                $('#form_bulk').submit();
   157	                return false;
   158	            });
   159	
   160	            // PDF出力(単一)
   161	            $('.pdf-print').click(function() {
   162	                window.open(this.href, 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
   163	                return false;
   164	            });
   165	
   166	            // 納品書印刷(日本語)
   167	            $('#printDeliverySlipsJp').on('click', function(event) {
   168	                if (preventIfNoCheckedBulkTarget()) {
   169	                    event.preventDefault();
   170	                    return false;
   171	                }
   172	                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
   173	                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'ja' }) }}");
   174	                $('#form_bulk').attr('target', 'newwin');
   175	                $('#form_bulk').submit();
   176	                return false;
   177	            });
   178	
   179	            // 納品書印刷(英語)
   180	            $('#printDeliverySlipsEn').on('click', function(event) {
   181	                if (preventIfNoCheckedBulkTarget()) {
   182	                    event.preventDefault();
   183	                    return false;
   184	                }
   185	                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
   186	                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'en' }) }}");
   187	                $('#form_bulk').attr('target', 'newwin');
   188	                $('#form_bulk').submit();
   189	                return false;
   190	            });
   191	
   192	            // 送り状CSV出力
   193	            $('#labelsExport').on('click', function(event) {
   194	                if (preventIfNoCheckedBulkTarget()) {
   195	                    event.preventDefault();
   196	                    return false;
   197	                }
   198	                $('#form_bulk').attr('action', "{{ url('admin_labels_export') }}");
   199	                $('#form_bulk').submit();
   200	                return false;
   201	            });
   202	
   203	            // 送り状番号
   204	            var updateTrackingNumber = function(id, url, tracking_number, callback) {
   205	                $.ajax({
   206	                    type: 'PUT',
   207	                    url: url,
   208	                    data: {'tracking_number': tracking_number}
   209	                }).done(function(data, textStatus, jqXHR) {
   210	                    if (data['status'] == 'OK') {
   211	                        $('#tracking_number_' + id).val(data['tracking_number']);
   212	                        if (typeof callback == 'function') {
   213	                            callback();
   214	                        }
   215	                    } else {
   216	                        alert('Update failed.');
   217	                    }
   218	                    return true;
   219	                }).fail(function(jqXHR, textStatus, errorThrown) {
   220	                    var response = JSON.parse(jqXHR.responseText);
   221	                    var messages = '';
   222	                    for (var i = 0; i < response.messages.length; i++) {
   223	                        messages += response.messages[i] + "\n";
   224	                    }
   225	                    alert(messages);
   226	                    return false;
   227	                });
   228	            };
   229	
   230	            // スタック用紙印刷
   231	            $('#printStack').click(function (event) {
   232	                if (preventIfNoCheckedBulkTarget()) {
   233	                    event.preventDefault();
   234	                    return false;
   235	                }
   236	                window.open('', 'newwin', 'toolbar=no, width=450, height=400');
   237	                $('#form_bulk').attr('action', "{{ url('admin_order_print_stack_window') }}");
   238	                $('#form_bulk').attr('target', 'newwin');
   239	                $('#form_bulk').submit();
   240	                return false;
   241	            });
   242	
   243	            $('button.update_tracking_number').prop('disabled', true);
   244	            // フォームに変更があったら更新ボタンを有効にする
   245	            $('input.update_tracking_number').on('keyup', function(event) {
   246	                var $tracking_number = $(this);
   247	                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
   248	                $button.prop('disabled', false);
   249	                $button.children('i')
   250	                    .removeClass('text-secondary')
   251	                    .addClass('text-success');
   252	            });
   253	            // enter キーで更新し、次のフォームへフォーカスを移動する
   254	            $('input.update_tracking_number').on('keypress', function(event) {
   255	                var $tracking_number = $(this);
   256	                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
   257	
   258	                var code = event.which ? event.which : event.keyCode;
   259	
   260	                if (code == 13) { // on press to enter
   260	                if (code == 13) { // on press to enter
   261	                    var index = $('input.update_tracking_number').index(this);
   262	                    var callback = function() {
   263	                        $button.prop('disabled', true);
   264	                        $button.children('i')
   265	                            .removeClass('text-success')
   266	                            .addClass('text-secondary');
   267	                        $('input.update_tracking_number:gt(' + index + '):first').focus();
   268	                    };
   269	                    updateTrackingNumber($tracking_number.data('shipping_id'), $tracking_number.data('url'), $tracking_number.val(), callback);
   270	                    event.preventDefault();
   271	                }
   272	            });
   273	            // 更新ボタンの制御
   274	            $('button.update_tracking_number').on('click', function(event) {
   275	                event.preventDefault();
   276	                var $button = $(this);
   277	                var $target = $($(this).data('target'));
   278	                var tracking_number = $target.val();
   279	                var callback = function() {
   280	                    $button.prop('disabled', true);
   281	                    $button.children('i')
   282	                        .removeClass('text-success')
   283	                        .addClass('text-secondary');
   284	                };
   285	        updateTrackingNumber($target.data('shipping_id'), $target.data('url'), tracking_number, callback);
   286	    });
   287	
   288	    // 完了ボタン
   289	    $('#bulkChangeComplete').on('click', function() {
   290	        location.href = '{{ url('admin_order', { 'resume': 1 }) }}';
   291	    });
   292	
   293	    // 検索条件保存ボタン
   294	    $('#save_pattern').on('click', function() {
   295	        $('#search_form').attr('action', "{{ url('admin_order_save_pattern') }}");
   296	        $('#search_form').submit();
   297	    });
   298	
   299	    {% if searchForm.vars.value.pattern_id is defined and searchForm.vars.value.pattern_id != '' %}
   300	        // 検索条件削除ボタン
   301	        $('#delete_pattern').on('click', function() {
   302	            $('#search_form').attr('action', "{{ url('admin_order_delete_pattern', { 'pattern_id': searchForm.vars.value.pattern_id }) }}");
   303	            $('#search_form').submit();
   304	        });
   305	    {% endif %}
   306	
   307	    {% if SearchPatterns is defined %}
   308	        <!-- 検索パターン別件数取得 -->
   309	        function get_pattern_count(id) {
   310	            $.ajax({
   311	                type: 'GET',
   312	                url: '{{ url('admin_order_count_pattern') }}/' + id,
   313	            }).done(function(data, textStatus, jqXHR) {
   314	                $('#pattern_id_' + id).text(data['count']);
   315	                return true;
   316	            }).fail(function(jqXHR, textStatus, errorThrown) {
   317	                var response = JSON.parse(jqXHR.responseText);
   318	                var messages = '';
   319	                for (var i = 0; i < response.messages.length; i++) {
   320	                    messages += response.messages[i] + "\n";
   321	                }
   322	                alert(messages);
   323	                return false;
   324	            });
   325	        }
   326	
   327	        <!-- 個別パターン更新 -->
   328	        $('.get_count_pattern').on('click', function() {
   329	            get_pattern_count($(this).data('pattern-id'));
   330	        });
   331	
   332	        <!-- 全件更新 -->
   333	        $('#reload_all_pattern').on('click', function() {
   334	            {% for SearchPattern in SearchPatterns %}
   335	                get_pattern_count({{ SearchPattern.id }});
   336	            {% endfor %}
   337	        });
   338	    {% endif %}
   339	    
   340	    function setupCollapseToggle(targetId) {
   341	        const searchDetailEl = document.getElementById(targetId);
   342	        const searchDetailToggleBtn = document.querySelector(`[data-bs-target="#${targetId}"]`);
   343	        if (searchDetailEl && searchDetailToggleBtn) {
   344	            const toggleExpanded = searchDetailToggleBtn.querySelector('.admin-product-search-detail-toggle-expanded');
   345	            const toggleCollapsed = searchDetailToggleBtn.querySelector('.admin-product-search-detail-toggle-collapsed');
   346	        const syncState = () => {
   347	            const isExpanded = searchDetailEl.classList.contains('show');
   348	            if (toggleExpanded) { toggleExpanded.classList.toggle('d-none', !isExpanded); }
   349	            if (toggleCollapsed) { toggleCollapsed.classList.toggle('d-none', isExpanded); }
   350	            searchDetailToggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
   351	        };
   352	
   353	        syncState();
   354	            searchDetailEl.addEventListener('shown.bs.collapse', function () {
   355	                if (toggleExpanded) { toggleExpanded.classList.remove('d-none'); }
   356	                if (toggleCollapsed) { toggleCollapsed.classList.add('d-none'); }
   357	                searchDetailToggleBtn.setAttribute('aria-expanded', 'true');
   358	            });
   359	            searchDetailEl.addEventListener('hidden.bs.collapse', function () {
   360	                if (toggleExpanded) { toggleExpanded.classList.add('d-none'); }
   361	                if (toggleCollapsed) { toggleCollapsed.classList.remove('d-none'); }
   362	                searchDetailToggleBtn.setAttribute('aria-expanded', 'false');
   363	            });
   364	        }
   365	    }
   366	    setupCollapseToggle('searchDetail');
   367	    setupCollapseToggle('searchDetailDelivery');
   368	
   369	});
   370	</script>
   371	{{ include('@admin/Order/confirmationModal_js.twig') }}
   372	{% endblock javascript %}
   373	
   374	{% block main %}
   375	    {% set hasPattern = searchForm.vars.value.pattern_id is defined and searchForm.vars.value.pattern_id != '' %}
   376	
   377	    <!--検索条件設定テーブルここから-->
   378	    <div class="c-outsideBlock search-box-inner">
   379	        <form name="search_form" id="search_form" method="POST" action="{{ url('admin_order') }}">
   380	            <div class="c-outsideBlock__contents">
   381	                <div class="row justify-content-center align-items-end">
   382	                    <div class="col-12">
   383	                        {{ form_widget(searchForm._token) }}
   384	                        <div class="row">
   385	                            <div class="col-6">
   386	                                {{ form_widget(searchForm.tenants) }}
   387	                                {{ form_errors(searchForm.tenants) }}
   388	                            </div>
   389	                        </div>
   390	                        <div class="row">
   391	                            <div class="col-6">
   392	                                <!-- admin_search_order[order_number] 注文番号 -->
   393	                                {{ form_widget(searchForm.order_number) }}
   394	                                {{ form_errors(searchForm.order_number) }}
   395	                            </div>
   396	                        </div>
   397	                        <div class="row">
   398	                            <div class="col-6">
   399	                                <!-- admin_search_order[name_multi] 注文者名 -->
   400	                                {{ form_widget(searchForm.name_multi) }}
   401	                                {{ form_errors(searchForm.name_multi) }}
   402	                            </div>
   403	                        </div>
   404	                        <div class="row">
   405	                            <div class="col-6 search-field-with-toggle">
   406	                                <div class="search-field-main">
   407	                                    <!-- admin_search_order[multi] 注文者会社名・注文備考 -->
   408	                                    {{ form_widget(searchForm.multi) }}
   409	                                    {{ form_errors(searchForm.multi) }}
   410	                                </div>
   411	                                <div class="d-inline-block mb-3 search-detail-toggle">
   412	                                    <button type="button" class="btn btn-ec-regular admin-product-search-detail-toggle px-3" data-bs-toggle="collapse" data-bs-target="#searchDetail" aria-expanded="{{ hasPattern or has_errors ? 'true' : 'false' }}" aria-controls="searchDetail" aria-label="{{ 'admin.common.search_detail'|trans }}" title="{{ 'admin.common.search_detail'|trans }}">
   413	                                        <i class="fa fa-minus admin-product-search-detail-toggle-expanded d-none" aria-hidden="true"></i>
   414	                                        <i class="fa fa-plus admin-product-search-detail-toggle-collapsed" aria-hidden="true"></i>
   415	                                        <span class="visually-hidden">{{ 'admin.common.search_detail'|trans }}</span>
   416	                                    </button>
   417	                                </div>
   418	                            </div>
   419	                        </div>
   420	                    </div>
   421	                </div>
   422	            </div>
   423	            <div class="c-subContents ec-collapse collapse{{ hasPattern or has_errors ? ' show' }} search-box-inner" id="searchDetail">
   424	                <div class="row">
   425	                    <div class="col-6">
   426	                        {{ form_widget(searchForm.pattern_name) }}
   427	                        {{ form_errors(searchForm.pattern_name) }}
   428	                        {{ form_widget(searchForm.pattern_id) }}
   429	                    </div>
   430	                    <div class="col">
   431	                        <button class="btn btn-ec-conversion px-5" type="button" id="save_pattern">{{ 'admin.order.search_pattern_save'|trans }}</button>
   432	                        {% if hasPattern %}
   433	                            <button class="btn btn-ec-conversion px-5" type="button" id="delete_pattern">{{ 'admin.order.search_pattern_delete'|trans }}</button>
   434	                        {% endif %}
   435	                    </div>
   436	                </div>
   437	                <div class="row">
   438	                    <div class="col">
   439	                        <label class="col-form-label"  data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.order_search_status'|trans }}">{{ 'admin.order.order_status'|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>
   440	                        <div id="admin_search_order_status">
   441	                            {% set statusForm = searchForm.status %}
   442	                            <!-- 各対応状況の件数を表示する -->
   443	                            {% for status_id, child in statusForm.children %}
   444	                                <div class="form-check form-check-inline">
   445	                                    <input type="checkbox"
   446	                                            id="{{ child.vars.id }}"
   447	                                            name="{{ child.vars.full_name }}"
   448	                                            class="form-check-input"
   449	                                            value="{{ child.vars.value }}"{{ child.vars.checked ? ' checked="checked"' }}>
   450	                                    <label class="form-check-label" for="{{ child.vars.id }}">{{ child.vars.label }}</label>
   451	                                    {%- if statusForm.vars.order_count[status_id].display -%}
   452	                                        (<a href="{{ url('admin_order', { 'order_status_id': status_id }) }}">{{ statusForm.vars.order_count[status_id].count }}</a>)
   453	                                    {%- endif %}
   454	                                </div>
   455	                            {% endfor %}
   456	                        </div>
   457	                    </div>
   458	                </div>
   459	                <div class="row">
   460	                    <div class="col">
   461	                        <p class="col-form-label">{{ 'admin.common.payment_method'|trans }}</p>
   462	                        {{ form_widget(searchForm.payment, { 'label_attr': { 'class': 'checkbox-inline'}}) }}
   463	                        {{ form_errors(searchForm.payment) }}
   464	                    </div>
   465	                </div>
   466	                <div class="row">
   467	                    <div class="col">
   468	                        <label class="col-form-label">{{ 'admin.order.delivery_provider'|trans }}</label>
   469	                        {{ form_widget(searchForm.delivery, { 'label_attr': { 'class': 'checkbox-inline'}}) }}
   470	                        {{ form_errors(searchForm.delivery) }}
   471	                    </div>
   472	                </div>
   473	                <div class="row">
   474	                    <div class="col">
   475	                        <label class="col-form-label">顧客グループ</label>
   476	                    </div>
   477	                    <div class="col">
   478	                        <label class="col-form-label">{{ 'admin.order.message_flg'|trans }}</label>
   479	                        {{ form_widget(searchForm.message_flg, { 'label_attr': { 'class': 'checkbox-inline'}}) }}
   480	                        {{ form_errors(searchForm.message_flg) }}
   481	                    </div>
   482	                </div>
   483	
   484	                <div class="row">
   485	                    <div class="col">
   486	                        <label class="col-form-label">{{ 'admin.common.phone_number'|trans }}</label>
   487	                        {{ form_widget(searchForm.phone_number) }}
   488	                        {{ form_errors(searchForm.phone_number) }}
   489	                    </div>
   490	                    <div class="col">
   491	                        <label class="col-form-label">{{ 'admin.common.mail_address'|trans }}</label>
   492	                        {{ form_widget(searchForm.email) }}
   493	                        {{ form_errors(searchForm.email) }}
   494	                    </div>
   495	                </div>
   496	
   497	                <div class="row">
   498	                    <div class="col">
   499	                        <label class="col-form-label">{{ 'admin.order.orderer_name'|trans }}</label>
   500	                        {{ form_widget(searchForm.name) }}
   501	                        {{ form_errors(searchForm.name) }}
   502	                    </div>
   503	                    <div class="col">
   504	                        <label class="col-form-label">{{ 'admin.order.orderer_kana'|trans }}</label>
   505	                        {{ form_widget(searchForm.kana) }}
   506	                        {{ form_errors(searchForm.kana) }}
   507	                    </div>
   508	                </div>
   509	
   510	                <div class="row">
   511	                    <div class="col">
   512	                        <!-- 性別 -->
   513	                        <label class="col-form-label">{{ 'admin.common.gender'|trans }}</label>
   514	                        {{ form_widget(searchForm.sex, { 'label_attr': { 'class': 'checkbox-inline'}}) }}
   515	                        {{ form_errors(searchForm.sex) }}
   516	                    </div>
   517	                </div>
   518	
   519	                <div class="row">
   520	                    <div class="col">
   521	                        <label class="col-form-label">{{ 'admin.order.order_date'|trans }}</label>
   522	                        <div class="row align-items-center">
   523	                            <div class="col">
   524	                                {{ form_widget(searchForm.order_datetime_start) }}
   525	                                {{ form_errors(searchForm.order_datetime_start) }}
   526	                            </div>
   527	                            <div class="col-auto text-center">{{ 'admin.common.separator__range'|trans }}</div>
   528	                            <div class="col">
   529	                                {{ form_widget(searchForm.order_datetime_end) }}
   530	                                {{ form_errors(searchForm.order_datetime_end) }}
   531	                            </div>
   532	                        </div>
   533	                        <div class="row align-items-center">
   534	                            <div class="col-auto text-left">
   535	                                {{ 'admin.order.search_day_before_label'|trans }}
   536	                            </div>
   537	                            <div class="col-auto text-left">
   538	                                {{ form_widget(searchForm.order_datetime_since_before) }}
   539	                                {{ form_errors(searchForm.order_datetime_since_before) }}
   540	                            </div>
   541	                            <div class="col-auto text-left">
   542	                                {{ 'admin.order.search_day_since_before_label'|trans }}
   543	                            </div>
   544	                            <div class="col-auto text-left">
   545	                                {{ form_widget(searchForm.order_datetime_until_before) }}
   546	                                {{ form_errors(searchForm.order_datetime_until_before) }}
   547	                            </div>
   548	                            <div class="col-auto text-left">
   549	                                {{ 'admin.order.search_day_until_before_label'|trans }}
   550	                            </div>
   551	                        </div>
   552	                    </div>
   553	                    <div class="col">
   554	                        <label class="col-form-label">{{ 'admin.order.confirm_date'|trans }}</label>
   555	                        <div class="row align-items-center">
   556	                            <div class="col">
   557	                                {{ form_widget(searchForm.confirm_datetime_start) }}
   558	                                {{ form_errors(searchForm.confirm_datetime_start) }}
   559	                            </div>
   560	                            <div class="col-auto text-center">{{ 'admin.common.separator__range'|trans }}</div>
   561	                            <div class="col">
   562	                                {{ form_widget(searchForm.confirm_datetime_end) }}
   563	                                {{ form_errors(searchForm.confirm_datetime_end) }}
   564	                            </div>
   565	                        </div>
   566	                        <div class="row align-items-center">
   567	                            <div class="col-auto text-left">
   568	                                {{ 'admin.order.search_day_before_label'|trans }}
   569	                            </div>
   570	                            <div class="col-auto text-left">
   571	                                {{ form_widget(searchForm.confirm_datetime_since_before) }}
   572	                                {{ form_errors(searchForm.confirm_datetime_since_before) }}
   573	                            </div>
   574	                            <div class="col-auto text-left">
   575	                                {{ 'admin.order.search_day_since_before_label'|trans }}
   576	                            </div>
   577	                            <div class="col-auto text-left">
   578	                                {{ form_widget(searchForm.confirm_datetime_until_before) }}
   579	                                {{ form_errors(searchForm.confirm_datetime_until_before) }}
   580	                            </div>
   581	                            <div class="col-auto text-left">
   582	                                {{ 'admin.order.search_day_until_before_label'|trans }}
   583	                            </div>
   584	                        </div>
   585	                        <div class="row align-items-center">
   586	                            <div class="col-auto text-left">
   587	                                {{ form_widget(searchForm.confirm_datetime_enter,  { 'label_attr': { 'class': 'checkbox-inline' }}) }}
   588	                                {{ form_errors(searchForm.confirm_datetime_enter) }}
   589	                            </div>
   590	                        </div>
   591	                    </div>
   592	                </div>
   593	
   594	                <div class="row">
   595	                    <div class="col">
   596	                        <label class="col-form-label">{{ 'admin.order.payment_date'|trans }}</label>
   597	                        <div class="row align-items-center">
   598	                            <div class="col">
   599	                                {{ form_widget(searchForm.payment_datetime_start) }}
   600	                                {{ form_errors(searchForm.payment_datetime_start) }}
   601	                            </div>
   602	                            <div class="col-auto text-center">{{ 'admin.common.separator__range'|trans }}</div>
   603	                            <div class="col">
   604	                                {{ form_widget(searchForm.payment_datetime_end) }}
   605	                                {{ form_errors(searchForm.payment_datetime_end) }}
   606	                            </div>
   607	                        </div>
   608	                        <div class="row align-items-center">
   609	                            <div class="col-auto text-left">
   610	                                {{ 'admin.order.search_day_before_label'|trans }}
   611	                            </div>
   612	                            <div class="col-auto text-left">
   613	                                {{ form_widget(searchForm.payment_datetime_since_before) }}
   614	                                {{ form_errors(searchForm.payment_datetime_since_before) }}
   615	                            </div>
   616	                            <div class="col-auto text-left">
   617	                                {{ 'admin.order.search_day_since_before_label'|trans }}
   618	                            </div>
   619	                            <div class="col-auto text-left">
   620	                                {{ form_widget(searchForm.payment_datetime_until_before) }}

 succeeded in 140ms:
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
    16	namespace Eccube\Service;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Doctrine\ORM\NonUniqueResultException;
    20	use Eccube\Common\EccubeConfig;
    21	use Eccube\Entity\BaseInfo;
    22	use Eccube\Entity\Customer;
    23	use Eccube\Entity\DtbBuyOrder;
    24	use Eccube\Entity\DtbDeck;
    25	use Eccube\Entity\DtbEvent;
    26	use Eccube\Entity\DtbEventEntry;
    27	use Eccube\Entity\DtbOtcBuyOrder;
    28	use Eccube\Entity\DtbPlayer;
    29	use Eccube\Entity\DtbProductRequest;
    30	use Eccube\Entity\MailHistory;
    31	use Eccube\Entity\MailTemplate;
    32	use Eccube\Entity\Master\MtbContactSubject;
    33	use Eccube\Entity\Master\MtbOption;
    34	use Eccube\Entity\Master\Pref;
    35	use Eccube\Entity\Member;
    36	use Eccube\Entity\Order;
    37	use Eccube\Entity\OrderItem;
    38	use Eccube\Entity\Payment;
    39	use Eccube\Entity\Product;
    40	use Eccube\Entity\ProductClass;
    41	use Eccube\Entity\Shipping;
    42	use Eccube\Entity\Views\RegisterCustomerView;
    43	use Eccube\Event\EccubeEvents;
    44	use Eccube\Event\EventArgs;
    45	use Eccube\Repository\BaseInfoRepository;
    46	use Eccube\Repository\CustomerAddressRepository;
    47	use Eccube\Repository\MailTemplateRepository;
    48	use Eccube\Repository\Master\MtbOptionRepository;
    49	use Eccube\Repository\OrderRepository;
    50	use Eccube\Repository\PaymentRepository;
    51	use Eccube\Request\Context;
    52	use Eccube\Service\Admin\Purchase\ServiceInput\SendManualPurchaseMailInput;
    53	use Eccube\Service\EntityManager\MailHistoryEntityManager;
    54	use Eccube\Util\MailUtil;
    55	use Eccube\Util\PaymentUtil;
    56	use Eccube\Util\PriceUtil;
    57	use Symfony\Component\EventDispatcher\EventDispatcherInterface;
    58	use Symfony\Component\HttpFoundation\RequestStack;
    59	use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
    60	use Symfony\Component\Mailer\MailerInterface;
    61	use Symfony\Component\Mime\Address;
    62	use Symfony\Component\Mime\Email;
    63	use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
    64	use Symfony\Component\Routing\RouterInterface;
    65	use Twig\Environment;
    66	use Twig\Error\LoaderError;
    67	use Twig\Error\RuntimeError;
    68	use Twig\Error\SyntaxError;
    69	use Twig\Markup;
    70	
    71	class MailService
    72	{
    73	    protected BaseInfo $BaseInfo;
    74	
    75	    private RequestStack $requestStack;
    76	
    77	    private EntityManagerInterface $entityManager;
    78	
    79	    /**
    80	     * MailService constructor.
    81	     */
    82	    public function __construct(
    83	        protected MailerInterface $mailer,
    84	        protected MailTemplateRepository $mailTemplateRepository,
    85	        protected MailHistoryEntityManager $mailHistoryEntityManager,
    86	        BaseInfoRepository $__readOnlyBaseInfoRepository,
    87	        protected EventDispatcherInterface $eventDispatcher,
    88	        protected Environment $twig,
    89	        protected EccubeConfig $eccubeConfig,
    90	        RequestStack $requestStack,
    91	        EntityManagerInterface $entityManager,
    92	        protected MtbOptionRepository $mtbOptionRepository,
    93	        protected BaseInfoRepository $BaseInfoRepository,
    94	        protected RouterInterface $router,
    95	        private readonly Context $context,
    96	        protected CustomerAddressRepository $customerAddressRepository,
    97	        protected OrderRepository $orderRepository,
    98	        protected PaymentRepository $paymentRepository,
    99	    ) {
   100	        $this->BaseInfo = $__readOnlyBaseInfoRepository->get();
   101	        $this->requestStack = $requestStack;
   102	        $this->entityManager = $entityManager;
   103	        $this->mtbOptionRepository = $mtbOptionRepository;
   104	    }
   105	
   106	    protected function getCurrentLocale(): string
   107	    {
   108	        return $this->requestStack->getCurrentRequest()?->getLocale() ?? 'ja';
   109	    }
   110	
   111	    /**
   112	     * Send customer confirm mail.
   113	     *
   114	     * @param Customer $Customer 会員情報
   115	     * @param string $activateUrl アクティベート用url
   116	     *
   117	     * @throws LoaderError
   118	     * @throws RuntimeError
   119	     * @throws SyntaxError
   120	     */
   121	    public function sendCustomerConfirmMail(Customer $Customer, string $activateUrl): void
   122	    {
   123	        log_info('仮会員登録メール送信開始');
   124	
   125	        $MailTemplate = $this->mailTemplateRepository->findOneBy([
   126	            'mail_key' => $this->eccubeConfig['eccube_entry_confirm_mail_template_id'],
   127	        ]);
   128	
   129	        $body = $this->twig->render($MailTemplate->getFileName(), [
   130	            'Customer' => $Customer,
   131	            'BaseInfo' => $this->BaseInfo,
   132	            'activateUrl' => $activateUrl,
   133	            'header' => $MailTemplate->getHeader(),
   134	            'footer' => $MailTemplate->getFooter(),
   135	        ]);
   136	
   137	        $message = (new Email())
   138	            ->subject('['.$this->BaseInfo->getShopName().'] '.$MailTemplate->getMailSubject())
   139	            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
   140	            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
   141	            ->bcc($this->BaseInfo->getEmail01())
   142	            ->replyTo($this->BaseInfo->getEmail03())
   143	            ->returnPath($this->BaseInfo->getEmail04());
   144	
   145	        // HTMLテンプレートが存在する場合
   146	        $htmlFileName = $this->getHtmlTemplate($MailTemplate->getFileName());
   147	        if (!is_null($htmlFileName)) {
   148	            $htmlBody = $this->twig->render($htmlFileName, [
   149	                'Customer' => $Customer,
   150	                'BaseInfo' => $this->BaseInfo,
   151	                'activateUrl' => $activateUrl,
   152	            ]);
   153	
   154	            $message
   155	                ->text($body)
   156	                ->html($htmlBody);
   157	        } else {
   158	            $message->text($body);
   159	        }
   160	
   161	        $event = new EventArgs(
   162	            [
   163	                'message' => $message,
   164	                'Customer' => $Customer,
   165	                'BaseInfo' => $this->BaseInfo,
   166	                'activateUrl' => $activateUrl,
   167	            ]
   168	        );
   169	        $this->eventDispatcher->dispatch($event, EccubeEvents::MAIL_CUSTOMER_CONFIRM);
   170	
   171	        try {
   172	            $this->mailer->send($message);
   173	            log_info('仮会員登録メール送信完了');
   174	        } catch (TransportExceptionInterface $e) {
   175	            log_critical($e->getMessage());
   176	        }
   177	    }
   178	
   179	    /**
   180	     * Send customer complete mail.
   181	     *
   182	     * @param Customer $Customer 会員情報
   183	     *
   184	     * @throws LoaderError
   185	     * @throws RuntimeError
   186	     * @throws SyntaxError
   187	     */
   188	    public function sendCustomerCompleteMail(Customer|RegisterCustomerView $Customer): void
   189	    {
   190	        log_info('会員登録完了メール送信開始');
   191	
   192	        $MailTemplate = $this->mailTemplateRepository->findOneBy([
   193	            'mail_key' => $this->eccubeConfig['eccube_entry_complete_mail_template_id'][$this->getCurrentLocale()],
   194	        ]);
   195	
   196	        $body = $this->twig->render($MailTemplate->getFileName(), [
   197	            'Customer' => $Customer,
   198	            'BaseInfo' => $this->BaseInfo,
   199	            'header' => $MailTemplate->getHeader(),
   200	            'footer' => $MailTemplate->getFooter(),
   201	        ]);
   202	
   203	        $message = (new Email())
   204	            ->subject('['.$this->BaseInfo->getShopName().'] '.$MailTemplate->getMailSubject())
   205	            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
   206	            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
   207	            ->bcc($this->BaseInfo->getEmail01())
   208	            ->replyTo($this->BaseInfo->getEmail03())
   209	            ->returnPath($this->BaseInfo->getEmail04());
   210	
   211	        // HTMLテンプレートが存在する場合
   212	        $htmlFileName = $this->getHtmlTemplate($MailTemplate->getFileName());
   213	        if (!is_null($htmlFileName)) {
   214	            $htmlBody = $this->twig->render($htmlFileName, [
   215	                'Customer' => $Customer,
   216	                'BaseInfo' => $this->BaseInfo,
   217	            ]);
   218	
   219	            $message
   220	                ->text($body)
   221	                ->html($htmlBody);
   222	        } else {
   223	            $message->text($body);
   224	        }
   225	
   226	        $event = new EventArgs(
   227	            [
   228	                'message' => $message,
   229	                'Customer' => $Customer,
   230	                'BaseInfo' => $this->BaseInfo,
   231	            ]
   232	        );
   233	        $this->eventDispatcher->dispatch($event, EccubeEvents::MAIL_CUSTOMER_COMPLETE);
   234	
   235	        try {
   236	            $this->mailer->send($message);
   237	            log_info('会員登録完了メール送信完了');
   238	        } catch (TransportExceptionInterface $e) {
   239	            log_critical($e->getMessage());
   240	        }
   241	    }
   242	
   243	    /**
   244	     * Send withdraw mail.
   245	     *
   246	     * @param $Customer Customer
   247	     * @param $email string
   248	     *
   249	     * @throws LoaderError
   250	     * @throws RuntimeError
   251	     * @throws SyntaxError
   252	     */
   253	    public function sendCustomerWithdrawMail(Customer $Customer, string $email): void
   254	    {
   255	        log_info('退会手続き完了メール送信開始');
   256	
   257	        $MailTemplate = $this->mailTemplateRepository->findOneBy(['mail_key' => $this->eccubeConfig['eccube_customer_withdraw_mail_template_id'][$this->getCurrentLocale()]]);
   258	
   259	        $body = $this->twig->render($MailTemplate->getFileName(), [
   260	            'Customer' => $Customer,
   260	            'Customer' => $Customer,
   261	            'BaseInfo' => $this->BaseInfo,
   262	            'header' => $MailTemplate->getHeader(),
   263	            'footer' => $MailTemplate->getFooter(),
   264	        ]);
   265	
   266	        $message = (new Email())
   267	            ->subject('['.$this->BaseInfo->getShopName().'] '.$MailTemplate->getMailSubject())
   268	            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
   269	            ->to($this->convertRFCViolatingEmail($email))
   270	            ->bcc($this->BaseInfo->getEmail01())
   271	            ->replyTo($this->BaseInfo->getEmail03())
   272	            ->returnPath($this->BaseInfo->getEmail04());
   273	
   274	        // HTMLテンプレートが存在する場合
   275	        $htmlFileName = $this->getHtmlTemplate($MailTemplate->getFileName());
   276	        if (!is_null($htmlFileName)) {
   277	            $htmlBody = $this->twig->render($htmlFileName, [
   278	                'Customer' => $Customer,
   279	                'BaseInfo' => $this->BaseInfo,
   280	                'header' => $MailTemplate->getHeader(),
   281	                'footer' => $MailTemplate->getFooter(),
   282	            ]);
   283	
   284	            $message
   285	                ->text($body)
   286	                ->html($htmlBody);
   287	        } else {
   288	            $message->text($body);
   289	        }
   290	
   291	        $event = new EventArgs(
   292	            [
   293	                'message' => $message,
   294	                'Customer' => $Customer,
   295	                'BaseInfo' => $this->BaseInfo,
   296	                'email' => $email,
   297	            ]
   298	        );
   299	        $this->eventDispatcher->dispatch($event, EccubeEvents::MAIL_CUSTOMER_WITHDRAW);
   300	
   301	        try {
   302	            $this->mailer->send($message);
   303	            log_info('退会手続き完了メール送信完了');
   304	        } catch (TransportExceptionInterface $e) {
   305	            log_critical($e->getMessage());
   306	        }
   307	    }
   308	
   309	    /**
   310	     * Send contact mail.
   311	     *
   312	     * @param array<string, string> $formData お問い合わせ内容
   313	     *
   314	     * @throws LoaderError
   315	     * @throws RuntimeError
   316	     * @throws SyntaxError
   317	     */
   318	    public function sendContactMail(array $formData, ?Customer $Customer): void
   319	    {
   320	        log_info('お問い合わせ受付メール送信開始');
   321	
   322	        $mailKey = $this->context->isLocaleJa() ? $this->eccubeConfig['eccube_contact_mail_template_id'] : $this->eccubeConfig['eccube_contact_en_mail_template_id'];
   323	
   324	        $MailTemplate = $this->mailTemplateRepository->findOneBy([
   325	            'mail_key' => $mailKey,
   326	        ]);
   327	
   328	        $body = $this->twig->render($MailTemplate->getFileName(), [
   329	            'header' => $MailTemplate->getHeader(),
   330	            'footer' => $MailTemplate->getFooter(),
   331	            'data' => $formData,
   332	            'BaseInfo' => $this->BaseInfo,
   333	            'Customer' => $Customer,
   334	        ]);
   335	
   336	        $subjectEmail = null;
   337	        /** @var mixed $subject */
   338	        $subject = $formData['subject'] ?? null;
   339	        if ($subject instanceof MtbContactSubject) {
   340	            $subjectEmail = $subject->getEmail();
   341	        }
   342	
   343	        $baseEmail02 = (string) $this->BaseInfo->getEmail02();
   344	
   345	        $adminEmail = ($subjectEmail !== null && $subjectEmail !== '')
   346	            ? $subjectEmail
   347	            : $baseEmail02;
   348	
   349	        $adminEmail = (string) $adminEmail;
   350	        if ($adminEmail === '') {
   351	            throw new \LogicException('from,bcc,reply toに設定するメールアドレスが取得できませんでした。');
   352	        }
   353	
   354	        // 問い合わせ者にメール送信
   355	        $message = (new Email())
   356	            ->subject('['.$this->BaseInfo->getShopName().'] '.$MailTemplate->getMailSubject())
   357	            ->from(new Address($adminEmail, $this->BaseInfo->getShopName()))
   358	            ->to($this->convertRFCViolatingEmail($formData['email']))
   359	            ->bcc($adminEmail)
   360	            ->replyTo($adminEmail)
   361	            ->returnPath($this->BaseInfo->getEmail04());
   362	
   363	        // HTMLテンプレートが存在する場合
   364	        $htmlFileName = $this->getHtmlTemplate($MailTemplate->getFileName());
   365	        if (!is_null($htmlFileName)) {
   366	            $htmlBody = $this->twig->render($htmlFileName, [
   367	                'data' => $formData,
   368	                'BaseInfo' => $this->BaseInfo,
   369	                'customer' => $Customer,
   370	            ]);
   371	
   372	            $message
   373	                ->text($body)
   374	                ->html($htmlBody);
   375	        } else {
   376	            $message->text($body);
   377	        }
   378	
   379	        $event = new EventArgs(
   380	            [
   381	                'message' => $message,
   382	                'formData' => $formData,
   383	                'BaseInfo' => $this->BaseInfo,
   384	            ]
   385	        );
   386	        $this->eventDispatcher->dispatch($event, EccubeEvents::MAIL_CONTACT);
   387	
   388	        try {
   389	            $this->mailer->send($message);
   390	            log_info('お問い合わせ受付メール送信完了');
   391	        } catch (TransportExceptionInterface $e) {
   392	            log_critical($e->getMessage());
   393	        }
   394	    }
   395	
   396	    /**
   397	     * Send order mail.
   398	     *
   399	     * @param Order $Order 受注情報
   400	     * @param int $customerAddressId 顧客住所ID
   401	     *
   402	     * @throws \RuntimeException ロケールに対応する受注メールテンプレートが未設定の場合
   403	     */
   404	    public function sendOrderMail(Order $Order, int $customerAddressId): Email
   405	    {
   406	        log_info('受注メール送信開始');
   407	
   408	        // 購入ロケール別にテンプレートを取得
   409	        if ($this->getCurrentLocale() === 'ja') {
   410	            $MailTemplate = $Order->getPayment()->getMailTemplateJp();
   411	        } else {
   412	            $MailTemplate = $Order->getPayment()->getMailTemplateEn();
   413	        }
   414	
   415	        if ($MailTemplate === null) {
   416	            log_critical('受注完了メールテンプレートが見つかりません。', [
   417	                'order_id' => $Order->getId(),
   418	                'payment_id' => $Order->getPayment()->getId(),
   419	                'locale' => $this->getCurrentLocale(),
   420	            ]);
   421	            throw new \RuntimeException('受注完了メールテンプレートが見つかりません。');
   422	        }
   423	
   424	        // 受注 = 国内 - ロケール = 英語
   425	        $isEnTax = false;
   426	        if ($Order->getCountry()->isJapan() && !$this->context->isLocaleJa()) {
   427	            $isEnTax = true;
   428	        }
   429	
   430	        // 顧客住所を取得
   431	        $CustomerAddress = null;
   432	        if ($customerAddressId) {
   433	            $CustomerAddress = $this->customerAddressRepository->find($customerAddressId);
   434	        }
   435	
   436	        $PaymentLink = null;
   437	        $header = $MailTemplate->getHeader();
   438	        if ($Order->getPayment()->getMethod() === Payment::EC_CVS_METHOD) {
   439	            $PaymentLink = PaymentUtil::getCvsPaymentLink(
   440	                $this->entityManager,
   441	                $Order->getId()
   442	            );
   443	
   444	            if ($PaymentLink !== null && $PaymentLink !== '') {
   445	                $header = $this->twig->createTemplate($header)->render([
   446	                    'PaymentLink' => new Markup($PaymentLink, 'UTF-8'),
   447	                ]);
   448	            }
   449	        }
   450	
   451	        $taxTargetTotal = (int) $Order->getSubtotal() + (int) $Order->getDeliveryFeeTotal() + (int) $Order->getCharge() - (int) $Order->getDiscount();
   452	
   453	        $templateParameters = [
   454	            'Order' => $Order,
   455	            'data' => $Order,
   456	            'header' => new Markup($header, 'UTF-8'),
   457	            'footer' => $MailTemplate->getFooter(),
   458	            'isEnTax' => $isEnTax,
   459	            'taxPrice' => PriceUtil::taxCalculation($taxTargetTotal),
   460	            'CustomerAddress' => $CustomerAddress,
   461	            'PaymentLink' => $PaymentLink,
   462	        ];
   463	
   464	        $body = $this->twig->render($MailTemplate->getFileName(), $templateParameters);
   465	
   466	        $message = (new Email())
   467	            ->subject('['.$Order->getBaseInfo()->getShopName().'] '.$MailTemplate->getMailSubject())
   468	            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
   469	            ->to($this->convertRFCViolatingEmail($Order->getEmail()))
   470	            ->bcc($this->BaseInfo->getEmail01())
   471	            ->replyTo($this->BaseInfo->getEmail03())
   472	            ->returnPath($this->BaseInfo->getEmail04());
   473	
   474	        // HTMLテンプレートが存在する場合
   475	        $htmlFileName = $this->getHtmlTemplate($MailTemplate->getFileName());
   476	        if (!is_null($htmlFileName)) {
   477	            $htmlBody = $this->twig->render($htmlFileName, $templateParameters);
   478	
   479	            $message
   480	                ->text($body)
   481	                ->html($htmlBody);
   482	        } else {
   483	            $message->text($body);
   484	        }
   485	
   486	        $event = new EventArgs(
   487	            [
   488	                'message' => $message,
   489	                'Order' => $Order,
   490	                'MailTemplate' => $MailTemplate,
   491	                'BaseInfo' => $this->BaseInfo,
   492	            ]
   493	        );
   494	        $this->eventDispatcher->dispatch($event, EccubeEvents::MAIL_ORDER);
   495	
   496	        MailUtil::convertMessage($this->eccubeConfig, $message);
   497	        MailUtil::setParameterForCharset($this->eccubeConfig, $message);
   498	
   499	        try {
   500	            $this->mailer->send($message);
   501	        } catch (TransportExceptionInterface $e) {
   502	            log_critical($e->getMessage());
   503	        }
   504	
   505	        $this->mailHistoryEntityManager->save($message, $Order->getBaseInfo(), $Order, $MailTemplate);
   506	        $this->entityManager->flush();
   507	
   508	        log_info('受注メール送信完了');
   509	
   510	        return $message;
   511	    }
   512	
   513	    /**
   514	     * Send admin customer confirm mail.
   515	     *
   516	     * @param Customer $Customer 会員情報
   517	     * @param string $activateUrl アクティベート用url
   518	     *
   519	     * @throws LoaderError
   520	     * @throws RuntimeError
   521	     * @throws SyntaxError
   522	     */
   523	    public function sendAdminCustomerConfirmMail(Customer $Customer, string $activateUrl): void
   524	    {
   525	        log_info('仮会員登録再送メール送信開始');
   526	
   527	        /** @var MailTemplate $MailTemplate */
   528	        $MailTemplate = $this->mailTemplateRepository->findOneBy([
   529	            'mail_key' => $this->eccubeConfig['eccube_entry_confirm_mail_template_id'][$this->getCurrentLocale()],
   530	        ]);
   531	
   532	        $body = $this->twig->render($MailTemplate->getFileName(), [
   533	            'BaseInfo' => $this->BaseInfo,
   534	            'Customer' => $Customer,
   535	            'activateUrl' => $activateUrl,
   536	            'header' => $MailTemplate->getHeader(),
   537	            'footer' => $MailTemplate->getFooter(),
   538	        ]);
   539	
   540	        $message = (new Email())
   541	            ->subject('['.$this->BaseInfo->getShopName().'] '.$MailTemplate->getMailSubject())
   542	            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
   543	            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
   544	            ->bcc($this->BaseInfo->getEmail01())
   545	            ->replyTo($this->BaseInfo->getEmail03())
   546	            ->returnPath($this->BaseInfo->getEmail04());
   547	
   548	        // HTMLテンプレートが存在する場合
   549	        $htmlFileName = $this->getHtmlTemplate($MailTemplate->getFileName());
   550	        if (!is_null($htmlFileName)) {
   551	            $htmlBody = $this->twig->render($htmlFileName, [
   552	                'BaseInfo' => $this->BaseInfo,
   553	                'Customer' => $Customer,
   554	                'activateUrl' => $activateUrl,
   555	            ]);
   556	
   557	            $message
   558	                ->text($body)
   559	                ->html($htmlBody);
   560	        } else {

codex
設計の大半は実装に沿っていますが、送信履歴の「テンプレート参照」記述に追加差分の可能性があります。そこを保存処理の実体とエンティティで確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php | sed -n '1988,2240p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/MailHistoryEntityManager.php | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\EntityManager;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Entity\BaseInfo;
    20	use Eccube\Entity\Customer;
    21	use Eccube\Entity\DtbBuyOrder;
    22	use Eccube\Entity\MailHistory;
    23	use Eccube\Entity\MailTemplate;
    24	use Eccube\Entity\Order;
    25	use Symfony\Component\Mime\Email;
    26	
    27	class MailHistoryEntityManager
    28	{
    29	    public function __construct(private readonly EntityManagerInterface $entityManager)
    30	    {
    31	    }
    32	
    33	    public function save(
    34	        Email $Message,
    35	        BaseInfo $BaseInfo,
    36	        Customer|Order|DtbBuyOrder|null $ContextInfo = null,
    37	        ?MailTemplate $MailTemplate = null,
    38	    ): void {
    39	        $MailHistory = new MailHistory();
    40	        $MailHistory
    41	            ->setMailSubject($Message->getSubject())
    42	            ->setBaseInfo($BaseInfo)
    43	            ->setMailBody($Message->getTextBody())
    44	            ->setSendDate(new \DateTime());
    45	
    46	        $htmlBody = $Message->getHtmlBody();
    47	        if (!empty($htmlBody)) {
    48	            $MailHistory->setMailHtmlBody($htmlBody);
    49	        }
    50	
    51	        if ($MailTemplate !== null) {
    52	            $MailHistory->setMailTemplate($MailTemplate);
    53	        }
    54	
    55	        if ($ContextInfo instanceof Customer) {
    56	            $MailHistory->setCustomer($ContextInfo);
    57	        } elseif ($ContextInfo instanceof Order) {
    58	            $MailHistory
    59	                ->setOrder($ContextInfo)
    60	                ->setCustomer($ContextInfo->getCustomer());
    61	        } elseif ($ContextInfo instanceof DtbBuyOrder) {
    62	            $MailHistory
    63	                ->setBuyOrder($ContextInfo)
    64	                ->setCustomer($ContextInfo->getCustomer());
    65	        }
    66	
    67	        $this->entityManager->persist($MailHistory);
    68	    }
    69	}

 succeeded in 110ms:
  1988	                'product_class_id' => $ProductClass->getId(),
  1989	            ]);
  1990	        }
  1991	
  1992	        return '';
  1993	    }
  1994	
  1995	    /**
  1996	     * テンプレートファイルを解析し、{{ header }} と {{ footer }} の間の本文部分を返す
  1997	     *
  1998	     * @param string $body テンプレートファイルの内容
  1999	     * @param MailTemplate $mail メールテンプレート
  2000	     * @param string $formName フォーム名
  2001	     * @param bool $isForm フォームを使用するかどうか
  2002	     *
  2003	     * @return string 本文部分
  2004	     */
  2005	    public function replaceBody(string $body, MailTemplate $mail, string $formName = 'mail', bool $isForm = true): string
  2006	    {
  2007	        $orderContentText = $this->getOrderContentText();
  2008	        $body = str_replace(
  2009	            [
  2010	                "{{ include('Mail/order_content.twig', {'data': data}) }}",
  2011	                "{{ include('Mail/order_content.en.twig', {'data': data}) }}",
  2012	            ],
  2013	            [
  2014	                $orderContentText['ja'],
  2015	                $orderContentText['en'],
  2016	            ],
  2017	            $body
  2018	        );
  2019	
  2020	        $body = preg_replace(['/\n/', '/\{#.*?#\}/'], ['<br>', ''], $body);
  2021	        // isFormがtrueの場合はtextareaで入力可能にし、falseの場合はhtmlに変換(defaultはtrue)
  2022	        if ($isForm) {
  2023	            $headerForm = <<< HF
  2024	<div class="form-group">
  2025	    <div class="col-sm-12">
  2026	        <textarea id="mail_header" name="{$formName}[header]" class="form-control" rows="10">{$mail->getHeader()}</textarea>
  2027	    </div>
  2028	</div>
  2029	HF;
  2030	
  2031	            $footerForm = <<< FF
  2032	<div class="form-group">
  2033	    <div class="col-sm-12">
  2034	        <textarea id="mail_footer" name="{$formName}[footer]" class="form-control" rows="10">{$mail->getFooter()}</textarea>
  2035	    </div>
  2036	</div>
  2037	FF;
  2038	        } else {
  2039	            $headerForm = <<< HF
  2040	<div class="form-group">
  2041	    <div class="col-sm-12">
  2042	        {$mail->getHeader()}
  2043	    </div>
  2044	</div>
  2045	HF;
  2046	
  2047	            $footerForm = <<< FF
  2048	<div class="form-group">
  2049	    <div class="col-sm-12">
  2050	        {$mail->getFooter()}
  2051	    </div>
  2052	</div>
  2053	FF;
  2054	            $headerForm = preg_replace(['/\n/', '/\{#.*?#\}/'], ['<br>', ''], $headerForm);
  2055	            $footerForm = preg_replace(['/\n/', '/\{#.*?#\}/'], ['<br>', ''], $footerForm);
  2056	        }
  2057	
  2058	        return str_replace(
  2059	            [
  2060	                '{{ header }}',
  2061	                '{{ footer }}',
  2062	            ],
  2063	            [
  2064	                $headerForm,
  2065	                $footerForm,
  2066	            ],
  2067	            $body
  2068	        );
  2069	    }
  2070	
  2071	    /**
  2072	     * 注文内容テンプレートを取得
  2073	     *
  2074	     * @return array<string, string>
  2075	     */
  2076	    private function getOrderContentText(): array
  2077	    {
  2078	        return [
  2079	            'ja' => $this->twig->getLoader()->getSourceContext('Mail/order_content.twig')->getCode(),
  2080	            'en' => $this->twig->getLoader()->getSourceContext('Mail/order_content.en.twig')->getCode(),
  2081	        ];
  2082	    }
  2083	
  2084	    /**
  2085	     * 一括用手動メール送信
  2086	     *
  2087	     * @param Order $order
  2088	     * @param MailTemplate $template
  2089	     * @param string $body
  2090	     * @param array{mail: array{subject: string}} $content
  2091	     */
  2092	    public function sendManualMailForBulk(Order $order, MailTemplate $template, string $body, array $content): void
  2093	    {
  2094	        $message = (new Email())
  2095	            ->subject($content['mail']['subject'])
  2096	            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
  2097	            ->to(new Address($order->getEmail()))
  2098	            ->bcc(new Address($this->BaseInfo->getEmail01()))
  2099	            ->replyTo(new Address($this->BaseInfo->getEmail03()))
  2100	            ->returnPath(new Address($this->BaseInfo->getEmail04()))
  2101	            ->text($body);
  2102	
  2103	        MailUtil::convertMessage($this->eccubeConfig, $message);
  2104	        MailUtil::setParameterForCharset($this->eccubeConfig, $message);
  2105	
  2106	        $this->mailer->send($message);
  2107	        $this->saveUserMailHistory($message, $template, $order);
  2108	
  2109	        return;
  2110	    }
  2111	
  2112	    /**
  2113	     * Save user mail history
  2114	     */
  2115	    private function saveUserMailHistory(Email $message, ?MailTemplate $mailTemplate = null, Customer|Order|DtbBuyOrder|null $info = null, ?Member $creator = null): void
  2116	    {
  2117	        $mailHistory = new MailHistory();
  2118	        $mailHistory
  2119	            ->setMailSubject($message->getSubject())
  2120	            ->setMailBody($message->getTextBody())
  2121	            ->setSendDate(new \DateTime())
  2122	            ->setCreator($creator);
  2123	
  2124	        if (!is_null($mailTemplate)) {
  2125	            $mailHistory->setMailTemplate($mailTemplate);
  2126	            $mailHistory->setBaseInfo($mailTemplate->getBaseInfo());
  2127	        }
  2128	
  2129	        if ($info instanceof Customer) {
  2130	            $mailHistory->setCustomer($info);
  2131	        } elseif ($info instanceof Order) {
  2132	            $mailHistory
  2133	                ->setOrder($info)
  2134	                ->setCustomer($info->getCustomer());
  2135	            // ゲストIDを設定
  2136	            $guestId = $info->getGuestId();
  2137	            if ($guestId !== null && $guestId !== '') {
  2138	                $mailHistory->setGuestId($guestId);
  2139	            }
  2140	        } elseif ($info instanceof DtbBuyOrder) {
  2141	            $mailHistory
  2142	                ->setBuyOrder($info)
  2143	                ->setCustomer($info->getCustomer());
  2144	        }
  2145	
  2146	        $this->entityManager->persist($mailHistory);
  2147	        $this->entityManager->flush();
  2148	    }
  2149	
  2150	    /**
  2151	     * デッキ登録完了メール送信
  2152	     */
  2153	    public function sendDeckEntryCompleteMail(Customer $Customer, DtbDeck $Deck): void
  2154	    {
  2155	        log_info('デッキ登録完了メール送信開始');
  2156	
  2157	        $isAbroad = $Customer->getPref()?->getId() === Pref::PREF_ABROAD;
  2158	        $templateId = $isAbroad ? MailTemplate::DECK_ENTRY_COMPLETE_EN : MailTemplate::DECK_ENTRY_COMPLETE_JP;
  2159	
  2160	        /** @var ?MailTemplate $MailTemplate */
  2161	        $MailTemplate = $this->mailTemplateRepository->find($templateId);
  2162	        if ($MailTemplate === null) {
  2163	            log_warning('デッキ登録完了メールテンプレートが存在しません。templateId='.$templateId);
  2164	
  2165	            return;
  2166	        }
  2167	
  2168	        try {
  2169	            $body = $this->twig->render($MailTemplate->getFileName(), [
  2170	                'Customer' => $Customer,
  2171	                'Deck' => $Deck,
  2172	                'header' => $MailTemplate->getHeader(),
  2173	                'footer' => $MailTemplate->getFooter(),
  2174	            ]);
  2175	        } catch (\Throwable $e) {
  2176	            log_critical('デッキ登録完了メールテンプレートのレンダリングに失敗しました。templateFile='.$MailTemplate->getFileName().', customerId='.$Customer->getId().', deckId='.$Deck->getId().': '.$e->getMessage());
  2177	
  2178	            return;
  2179	        }
  2180	
  2181	        $message = (new Email())
  2182	            ->subject('['.$this->BaseInfo->getShopName().'] '.$MailTemplate->getMailSubject())
  2183	            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
  2184	            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
  2185	            ->bcc($this->BaseInfo->getEmail01())
  2186	            ->replyTo($this->BaseInfo->getEmail03())
  2187	            ->returnPath($this->BaseInfo->getEmail04());
  2188	
  2189	        $htmlFileName = $this->getHtmlTemplate($MailTemplate->getFileName());
  2190	        if ($htmlFileName !== null) {
  2191	            $htmlBody = $this->twig->render($htmlFileName, [
  2192	                'Customer' => $Customer,
  2193	                'Deck' => $Deck,
  2194	            ]);
  2195	            $message->text($body)->html($htmlBody);
  2196	        } else {
  2197	            $message->text($body);
  2198	        }
  2199	
  2200	        try {
  2201	            $this->mailer->send($message);
  2202	            log_info('デッキ登録完了メール送信完了');
  2203	        } catch (TransportExceptionInterface $e) {
  2204	            log_critical($e->getMessage());
  2205	        }
  2206	    }
  2207	
  2208	    /**
  2209	     * 対応する本文を取得
  2210	     *
  2211	     * @param array<string, mixed> $params
  2212	     */
  2213	    public function getBody(string $view, array $params): string
  2214	    {
  2215	        $twig = $this->twig;
  2216	
  2217	        // twigファイルのソースコードを読み込み, 文字列化.
  2218	        $source = $twig->getLoader()->getSourceContext($view)->getCode();
  2219	
  2220	        // イベントの実行.
  2221	        // プラグインにはテンプレートファイル名、文字列化されたtwigファイル、パラメータを渡す
  2222	        $event = new \Eccube\Event\TemplateEvent($view, $source, [], null);
  2223	        $this->eventDispatcher->dispatch($event, (string) $view);
  2224	        $template = $twig->createTemplate($event->getSource());
  2225	        $content = $template->render($params);
  2226	
  2227	        return $content;
  2228	    }
  2229	
  2230	    /**
  2231	     * ポイント重複登録通知メール送信
  2232	     *
  2233	     * @param array<int, string|null> $orderNumbers
  2234	     */
  2235	    public function sendOrderDuplicateNotificationMail(array $orderNumbers): void
  2236	    {
  2237	        log_info('ポイント重複登録通知メール送信開始');
  2238	
  2239	        $address = $this->mtbOptionRepository
  2240	            ->findOneBy(['option_key' => MtbOption::SMAREGI_ERROR_MAIL_ADDRESS])

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailHistory.php | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
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
    14	namespace Eccube\Entity;
    15	
    16	use Doctrine\DBAL\Types\Types;
    17	use Doctrine\ORM\Mapping as ORM;
    18	use Eccube\Entity\Traits\GuestTrait;
    19	use Eccube\Repository\MailHistoryRepository;
    20	
    21	if (!class_exists(MailHistory::class)) {
    22	    /**
    23	     * MailHistory
    24	     */
    25	    #[ORM\Table(name: 'dtb_mail_history')]
    26	    #[ORM\HasLifecycleCallbacks]
    27	    #[ORM\Entity(repositoryClass: MailHistoryRepository::class)]
    28	    class MailHistory extends AbstractEntity implements \Stringable
    29	    {
    30	        use GuestTrait;
    31	
    32	        #[ORM\ManyToOne(targetEntity: BaseInfo::class, inversedBy: 'MailHistories')]
    33	        #[ORM\JoinColumn(name: 'base_info_id', referencedColumnName: 'id', nullable: false)]
    34	        public BaseInfo $baseInfo;
    35	
    36	        #[\Override]
    37	        public function __toString(): string
    38	        {
    39	            return (string) $this->getMailSubject();
    40	        }
    41	
    42	        #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true])]
    43	        #[ORM\Id]
    44	        #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    45	        private ?int $id = null;
    46	
    47	        /**
    48	         * @var \DateTime|null
    49	         */
    50	        #[ORM\Column(name: 'send_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
    51	        private $send_date;
    52	
    53	        #[ORM\Column(name: 'mail_subject', type: Types::STRING, length: 255, nullable: true)]
    54	        private ?string $mail_subject = null;
    55	
    56	        #[ORM\Column(name: 'mail_body', type: Types::TEXT, nullable: true)]
    57	        private ?string $mail_body = null;
    58	
    59	        #[ORM\Column(name: 'mail_html_body', type: Types::TEXT, nullable: true)]
    60	        private ?string $mail_html_body = null;
    61	
    62	        #[ORM\ManyToOne(targetEntity: Order::class, inversedBy: 'MailHistories')]
    63	        #[ORM\JoinColumn(name: 'order_id', referencedColumnName: 'id', nullable: true)]
    64	        private ?Order $Order = null;
    65	
    66	        #[ORM\ManyToOne(targetEntity: Member::class)]
    67	        #[ORM\JoinColumn(name: 'creator_id', referencedColumnName: 'id', nullable: true)]
    68	        private ?Member $Creator = null;
    69	
    70	        #[ORM\ManyToOne(targetEntity: Customer::class, inversedBy: 'MailHistories')]
    71	        #[ORM\JoinColumn(name: 'customer_id', referencedColumnName: 'id', nullable: true)]
    72	        private ?Customer $Customer = null;
    73	
    74	        #[ORM\JoinColumn(name: 'buy_order_id', referencedColumnName: 'id', nullable: true)]
    75	        #[ORM\ManyToOne(targetEntity: DtbBuyOrder::class)]
    76	        private ?DtbBuyOrder $BuyOrder = null;
    77	
    78	        /**
    79	         * Get id.
    80	         *
    81	         * @return int
    82	         */
    83	        public function getId(): ?int
    84	        {
    85	            return $this->id;
    86	        }
    87	
    88	        /**
    89	         * Set sendDate.
    90	         */
    91	        public function setSendDate(?\DateTime $sendDate = null): MailHistory
    92	        {
    93	            $this->send_date = $sendDate;
    94	
    95	            return $this;
    96	        }
    97	
    98	        /**
    99	         * Get sendDate.
   100	         */
   101	        public function getSendDate(): ?\DateTime
   102	        {
   103	            return $this->send_date;
   104	        }
   105	
   106	        /**
   107	         * Set mailSubject.
   108	         */
   109	        public function setMailSubject(?string $mailSubject = null): MailHistory
   110	        {
   111	            $this->mail_subject = $mailSubject;
   112	
   113	            return $this;
   114	        }
   115	
   116	        /**
   117	         * Get mailSubject.
   118	         */
   119	        public function getMailSubject(): ?string
   120	        {
   121	            return $this->mail_subject;
   122	        }
   123	
   124	        /**
   125	         * Set mailBody.
   126	         */
   127	        public function setMailBody(?string $mailBody = null): MailHistory
   128	        {
   129	            $this->mail_body = $mailBody;
   130	
   131	            return $this;
   132	        }
   133	
   134	        /**
   135	         * Get mailBody.
   136	         */
   137	        public function getMailBody(): ?string
   138	        {
   139	            return $this->mail_body;
   140	        }
   141	
   142	        /**
   143	         * Set mailHtmlBody.
   144	         */
   145	        public function setMailHtmlBody(?string $mailHtmlBody = null): MailHistory
   146	        {
   147	            $this->mail_html_body = $mailHtmlBody;
   148	
   149	            return $this;
   150	        }
   151	
   152	        /**
   153	         * Get mailHtmlBody.
   154	         */
   155	        public function getMailHtmlBody(): ?string
   156	        {
   157	            return $this->mail_html_body;
   158	        }
   159	
   160	        /**
   161	         * Set order.
   162	         */
   163	        public function setOrder(?Order $order = null): MailHistory
   164	        {
   165	            $this->Order = $order;
   166	
   167	            return $this;
   168	        }
   169	
   170	        /**
   171	         * Get order.
   172	         */
   173	        public function getOrder(): ?Order
   174	        {
   175	            return $this->Order;
   176	        }
   177	
   178	        /**
   179	         * Set creator.
   180	         */
   181	        public function setCreator(?Member $creator = null): MailHistory
   182	        {
   183	            $this->Creator = $creator;
   184	
   185	            return $this;
   186	        }
   187	
   188	        /**
   189	         * Get creator.
   190	         */
   191	        public function getCreator(): ?Member
   192	        {
   193	            return $this->Creator;
   194	        }
   195	
   196	        public function setCustomer(?Customer $Customer): MailHistory
   197	        {
   198	            $this->Customer = $Customer;
   199	
   200	            return $this;
   201	        }
   202	
   203	        public function getCustomer(): ?Customer
   204	        {
   205	            return $this->Customer;
   206	        }
   207	
   208	        public function getBaseInfo(): BaseInfo
   209	        {
   210	            return $this->baseInfo;
   211	        }
   212	
   213	        public function setBaseInfo(BaseInfo $baseInfo): MailHistory
   214	        {
   215	            $this->baseInfo = $baseInfo;
   216	
   217	            return $this;
   218	        }
   219	
   220	        public function getBuyOrder(): ?DtbBuyOrder
   221	        {
   222	            return $this->BuyOrder;
   223	        }
   224	
   225	        public function setBuyOrder(?DtbBuyOrder $BuyOrder): MailHistory
   226	        {
   227	            $this->BuyOrder = $BuyOrder;
   228	
   229	            return $this;
   230	        }
   231	
   232	        #[ORM\JoinColumn(name: 'template_id', referencedColumnName: 'id')]
   233	        #[ORM\ManyToOne(targetEntity: MailTemplate::class)]
   234	        private ?MailTemplate $MailTemplate = null;
   235	
   236	        public function getMailTemplate(): ?MailTemplate
   237	        {
   238	            return $this->MailTemplate;
   239	        }
   240	
   241	        public function setMailTemplate(?MailTemplate $mailTemplate): MailHistory
   242	        {
   243	            $this->MailTemplate = $mailTemplate;
   244	
   245	            return $this;
   246	        }
   247	    }
   248	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1,240p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '240,520p'" in /home/y-saito/Developments/hareruya-design-docs
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
   261	                ->andWhere('o.order_number LIKE :order_number')
   262	                ->setParameter('order_number', '%'.$searchData['order_number'].'%');
   263	        }
   264	
   265	        // name_multi
   266	        if (isset($searchData['name_multi']) && StringUtil::isNotBlank($searchData['name_multi'])) {
   267	            // 半角スペース、全角スペース、カンマで分割
   268	            $texts = preg_split('/[\s, ]+/u', $searchData['name_multi']);
   269	            $searchColumns = [
   270	                'o' => ['name01', 'name02', 'kana01', 'kana02'],
   271	            ];
   272	            SqlUtil::multiTextQuery($qb, $texts, $searchColumns);
   273	        }
   274	
   275	        // multi
   276	        if (isset($searchData['multi']) && StringUtil::isNotBlank($searchData['multi'])) {
   277	            // 半角スペース、全角スペース、カンマで分割
   278	            $texts = preg_split('/[\s, ]+/u', $searchData['multi']);
   279	            $searchColumns = [
   280	                'o' => ['company_name', 'message', 'note'],
   281	                'oi' => ['product_code'],
   282	            ];
   283	            SqlUtil::multiTextQuery($qb, $texts, $searchColumns);
   284	        }
   285	
   286	        // status
   287	        $filterStatus = false;
   288	        if (isset($searchData['status']) && count($searchData['status']) > 0) {
   289	            $qb
   290	                ->andWhere($qb->expr()->in('o.OrderStatus', ':status'))
   291	                ->setParameter('status', $searchData['status']);
   292	            $filterStatus = true;
   293	        }
   294	
   295	        if (!$filterStatus) {
   296	            // キャンセル・引渡し済みは検索対象から除外
   297	            $qb->andWhere($qb->expr()->notIn('o.OrderStatus', ':status'))
   298	                ->setParameter('status', [OrderStatus::CANCEL, OrderStatus::PASSED]);
   299	        }
   300	
   301	        // payment
   302	        if (!empty($searchData['payment']) && count($searchData['payment']) > 0) {
   303	            $payments = [];
   304	            foreach ($searchData['payment'] as $payment) {
   305	                $payments[] = $payment->getId();
   306	            }
   307	            $qb
   308	                ->leftJoin('o.Payment', 'p')
   309	                ->andWhere($qb->expr()->in('p.id', ':payments'))
   310	                ->setParameter('payments', $payments);
   311	        }
   312	
   313	        // delivery
   314	        if (!empty($searchData['delivery']) && count($searchData['delivery']) > 0) {
   315	            $deliveries = [];
   316	            foreach ($searchData['delivery'] as $delivery) {
   317	                $deliveries[] = $delivery->getId();
   318	            }
   319	            $qb
   320	                ->andWhere($qb->expr()->in('s.Delivery', ':deliveries'))
   321	                ->setParameter('deliveries', $deliveries);
   322	        }
   323	
   324	        // customer_group - TBD
   325	
   326	        // message_flg
   327	        if (!empty($searchData['message_flg'])) {
   328	            if (in_array(1, $searchData['message_flg'], true)) {
   329	                $qb->andWhere('o.message IS NOT NULL');
   330	            }
   331	            if (in_array(0, $searchData['message_flg'], true)) {
   332	                $qb->andWhere('o.message IS NULL');
   333	            }
   334	        }
   335	
   336	        // tel
   337	        if (isset($searchData['phone_number']) && StringUtil::isNotBlank($searchData['phone_number'])) {
   338	            $tel = preg_replace('/[^0-9]/', '', $searchData['phone_number']);
   339	            $qb
   340	                ->andWhere('CONCAT(COALESCE(o.tel01, \'\'), COALESCE(o.tel02, \'\'), COALESCE(o.tel03, \'\')) LIKE :phone_number')
   341	                ->setParameter('phone_number', '%'.$tel.'%');
   342	        }
   343	
   344	        // email
   345	        if (isset($searchData['email']) && StringUtil::isNotBlank($searchData['email'])) {
   346	            $qb
   347	                ->andWhere('o.email like :email')
   348	                ->setParameter('email', '%'.$searchData['email'].'%');
   349	        }
   350	
   351	        // name
   352	        if (isset($searchData['name']) && StringUtil::isNotBlank($searchData['name'])) {
   353	            $clean_name = preg_replace('/\s+|[　]+/u', '', $searchData['name']);
   354	            $qb
   355	                ->andWhere('CONCAT(o.name01, o.name02) LIKE :name')
   356	                ->setParameter('name', '%'.$clean_name.'%');
   357	        }
   358	
   359	        // kana
   360	        if (isset($searchData['kana']) && StringUtil::isNotBlank($searchData['kana'])) {
   361	            $clean_kana = preg_replace('/\s+|[　]+/u', '', $searchData['kana']);
   362	            $qb
   363	                ->andWhere("CONCAT(COALESCE(o.kana01, ''), COALESCE(o.kana02, '')) LIKE :kana")
   364	                ->setParameter('kana', '%'.$clean_kana.'%');
   365	        }
   366	
   367	        // sex
   368	        if (!empty($searchData['sex']) && count($searchData['sex']) > 0) {
   369	            $qb
   370	                ->andWhere($qb->expr()->in('o.Sex', ':sex'))
   371	                ->setParameter('sex', $searchData['sex']->toArray());
   372	        }
   373	
   374	        // order_datetime
   375	        // start - end
   376	        $this->addDateCondition($qb, 'o.order_date', $searchData['order_datetime_start'], $searchData['order_datetime_end']);
   377	        // since - before
   378	        $this->addSinceAndUntilCondition($qb, 'o.order_date', $searchData['order_datetime_since_before'], $searchData['order_datetime_until_before']);
   379	
   380	        // confirm_datetime
   381	        // start - end
   382	        $this->addDateCondition($qb, 'o.confirmDate', $searchData['confirm_datetime_start'], $searchData['confirm_datetime_end']);
   383	        // since - before
   384	        $this->addSinceAndUntilCondition($qb, 'o.confirmDate', $searchData['confirm_datetime_since_before'], $searchData['confirm_datetime_until_before']);
   385	
   386	        // payment_datetime
   387	        // start - end
   388	        $this->addDateCondition($qb, 'o.payment_date', $searchData['payment_datetime_start'], $searchData['payment_datetime_end']);
   389	        // since - before
   390	        $this->addSinceAndUntilCondition($qb, 'o.payment_date', $searchData['payment_datetime_since_before'], $searchData['payment_datetime_until_before']);
   391	
   392	        // commit_datetime - TBD ～ エンティティに存在しない ～ DB定義書含めて確認
   393	        // start - end
   394	        $this->addDateCondition($qb, 'o.commitDate', $searchData['commit_datetime_start'], $searchData['commit_datetime_end']);
   395	        // since - before
   396	        $this->addSinceAndUntilCondition($qb, 'o.commitDate', $searchData['commit_datetime_since_before'], $searchData['commit_datetime_until_before']);
   397	
   398	        // shipping_datetime
   399	        // start - end
   400	        $this->addDateCondition($qb, 'o.shippingDate', $searchData['shipping_datetime_start'], $searchData['shipping_datetime_end']);
   401	        // since - before
   402	        $this->addSinceAndUntilCondition($qb, 'o.shippingDate', $searchData['shipping_datetime_since_before'], $searchData['shipping_datetime_until_before']);
   403	
   404	        // cancel_datetime
   405	        // start - end
   406	        $this->addDateCondition($qb, 'o.cancel_date', $searchData['cancel_datetime_start'], $searchData['cancel_datetime_end']);
   407	        // since - before
   408	        $this->addSinceAndUntilCondition($qb, 'o.cancel_date', $searchData['cancel_datetime_since_before'], $searchData['cancel_datetime_until_before']);
   409	
   410	        // receipt_datetime
   411	        // start - end
   412	        $this->addDateCondition($qb, 'o.receiptDate', $searchData['receipt_datetime_start'], $searchData['receipt_datetime_end']);
   413	        // since - before
   414	        $this->addSinceAndUntilCondition($qb, 'o.receiptDate', $searchData['receipt_datetime_since_before'], $searchData['receipt_datetime_until_before']);
   415	
   416	        // otc_rsv_datetime
   417	        // start - end
   418	        $this->addDateCondition($qb, 'o.otc_rsv_date', $searchData['otc_rsv_datetime_start'], $searchData['otc_rsv_datetime_end']);
   419	        // since - before
   420	        $this->addSinceAndUntilCondition($qb, 'o.otc_rsv_date', $searchData['otc_rsv_datetime_since_before'], $searchData['otc_rsv_datetime_until_before']);
   421	
   422	        // update_datetime
   423	        // start - end
   424	        $this->addDateCondition($qb, 'o.update_date', $searchData['update_datetime_start'], $searchData['update_datetime_end']);
   425	        // since - before
   426	        $this->addSinceAndUntilCondition($qb, 'o.update_date', $searchData['update_datetime_since_before'], $searchData['update_datetime_until_before']);
   427	
   428	        foreach (self::COLUMN_DATE_ENTER as $key => $date) {
   429	            $value = $searchData["{$key}_enter"];
   430	            $condColumn = self::COLUMN_DATE_ENTER[$key];
   431	            if (!empty($value) && count($value) == 1) {
   432	                // 入力・未入力のいずれかが選択されている場合
   433	                $cond = ('0' === $value[0]) ? "{$condColumn} is null" : "{$condColumn} is not null";
   434	                $qb->andWhere($cond);
   435	            }
   436	        }
   437	
   438	        // payment_total
   439	        if (isset($searchData['payment_total_start']) && StringUtil::isNotBlank($searchData['payment_total_start'])) {
   440	            $qb
   441	                ->andWhere('o.payment_total >= :payment_total_start')
   442	                ->setParameter('payment_total_start', $searchData['payment_total_start']);
   443	        }
   444	        if (isset($searchData['payment_total_end']) && StringUtil::isNotBlank($searchData['payment_total_end'])) {
   445	            $qb
   446	                ->andWhere('o.payment_total <= :payment_total_end')
   447	                ->setParameter('payment_total_end', $searchData['payment_total_end']);
   448	        }
   449	
   450	        // buy_product_name1, buy_product_name2, buy_product_name3（OrderItem の product_name に対する AND/OR 検索）
   451	        $productNameConditions = [];
   452	        for ($i = 1; $i <= 3; $i++) {
   453	            $key = 'buy_product_name'.$i;
   454	            if (isset($searchData[$key]) && StringUtil::isNotBlank($searchData[$key])) {
   455	                $productNameConditions[$key] = '%'.$searchData[$key].'%';
   456	            }
   457	        }
   458	        if ($productNameConditions !== []) {
   459	            $isAnd = isset($searchData['product_name_select']) && $searchData['product_name_select'] === '0';
   460	            if ($isAnd) {
   461	                // AND検索: 同一 OrderItem の product_name がすべての語句を含む
   462	                foreach ($productNameConditions as $key => $value) {
   463	                    $qb
   464	                        ->andWhere('oi.product_name LIKE :'.$key)
   465	                        ->setParameter($key, $value);
   466	                }
   467	            } else {
   468	                // OR検索: いずれかの語句に一致する OrderItem が存在する
   469	                $orParts = [];
   470	                foreach (array_keys($productNameConditions) as $key) {
   471	                    $orParts[] = 'oi.product_name LIKE :'.$key;
   472	                }
   473	                $qb->andWhere($qb->expr()->orX(...$orParts));
   474	                foreach ($productNameConditions as $key => $value) {
   475	                    $qb->setParameter($key, $value);
   476	                }
   477	            }
   478	        }
   479	
   480	        // buy_product_code
   481	        if (isset($searchData['buy_product_code']) && StringUtil::isNotBlank($searchData['buy_product_code'])) {
   482	            $qb
   483	                ->andWhere('oi.product_code LIKE :buy_product_code')
   484	                ->setParameter('buy_product_code', '%'.$searchData['buy_product_code'].'%');
   485	        }
   486	
   487	        // shipping_multi
   488	        $shippingMulti = $searchData['shipping_multi'];
   489	        if (!empty($shippingMulti) && StringUtil::isNotBlank($shippingMulti)) {
   490	            // 半角スペース、全角スペース、カンマで分割
   491	            $texts = preg_split('/[\s, ]+/u', $shippingMulti);
   492	            $searchColumns = [
   493	                's' => ['addr01', 'addr02', 'addr03', 'name01', 'name02', 'company_name'],
   494	                'o' => ['invoiceNumber'],
   495	            ];
   496	
   497	            SqlUtil::multiTextQuery($qb, $texts, $searchColumns);
   498	        }
   499	
   500	        // shipping_name
   501	        if (!empty($searchData['shipping_name'])) {
   502	            $qb
   503	                ->andWhere('CONCAT(s.name01, s.name02) LIKE :shipping_name')
   504	                ->setParameter('shipping_name', '%'.$searchData['shipping_name'].'%');
   505	        }
   506	
   507	        // shipping_kana
   508	        if (!empty($searchData['shipping_kana'])) {
   509	            $qb
   510	                ->andWhere('CONCAT(COALESCE(s.kana01, \'\'), COALESCE(s.kana02, \'\') LIKE :shipping_kana')
   511	                ->setParameter('shipping_kana', '%'.$searchData['shipping_kana'].'%');
   512	        }
   513	
   514	        // shipping_zipcode
   515	        if (!empty($searchData['shipping_zipcode'])) {
   516	            $qb
   517	                ->andWhere('s.postal_code LIKE :shipping_zipcode')
   518	                ->setParameter('shipping_zipcode', '%'.$searchData['shipping_zipcode'].'%');
   519	        }
   520	

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '1080,1225p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1080	                        </a>
  1081	                        <button type="button" class="get_count_pattern btn p-0 border-0 bg-transparent" id="get_count_pattern_{{ SearchPattern.id }}" data-pattern-id="{{ SearchPattern.id }}">
  1082	                            <i class="fa fa-refresh" aria-hidden="true"></i>
  1083	                        </button>
  1084	                    {% endif %}
  1085	                </div>
  1086	                {% endfor %}
  1087	            </div>
  1088	        </div>
  1089	    {% endif %}
  1090	
  1091	    <div class="c-contentsArea__cols">
  1092	        <div class="c-contentsArea__primaryCol">
  1093	            <div class="c-primaryCol">
  1094	                {% if pagination and pagination.totalItemCount %}
  1095	                    <form id="form_bulk" method="POST" action="">
  1096	                        <input type="hidden" name="{{ constant('Eccube\\Common\\Constant::TOKEN_NAME') }}" value="{{ csrf_token(constant('Eccube\\Common\\Constant::TOKEN_NAME')) }}">
  1097	                        <div class="row justify-content-between mb-2">
  1098	                            <div class="col-7">
  1099	                                <div class="row justify-content-between">
  1100	                                    <div class="col-auto d-none btn-bulk-wrapper">
  1101	                                        <label class="me-2" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.bulk_actions'|trans }}">{{ 'admin.common.bulk_actions'|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>
  1102	                                        <button id="bulkSendMail" type="button" class="btn btn-ec-regular me-2" data-type="mail" data-bulk-update="true">
  1103	                                            {{ 'admin.order.send_mail'|trans }}
  1104	                                        </button>
  1105	                                        <button type="button" id="bulkExportPdf" class="btn btn-ec-regular me-2">{{ 'admin.order.output_delivery_note_short'|trans }}</button>
  1106	                                        <button type="button" class="btn btn-ec-delete" data-bs-toggle="modal" data-bs-target="#bulkDeleteModal">{{ 'admin.common.delete'|trans }}</button>
  1107	                                    </div>
  1108	                                    <div class="col d-none btn-bulk-wrapper">
  1109	                                        <div class="d-inline-block me-2">
  1110	                                            <select class="form-select" id="option_bulk_status">
  1111	                                                <option value="" selected>{{ 'admin.order.change_status'|trans }}</option>
  1112	                                                {% for status in OrderStatuses %}
  1113	                                                    <option value="{{ status.id }}">{{ status.name }}</option>
  1114	                                                {% endfor %}
  1115	                                            </select>
  1116	                                        </div>
  1117	                                        <button type="button" id="btn_bulk_status" class="btn btn-ec-regular me-2 progressModal" data-type="status" data-bulk-update="true" data-submit="bulk">
  1118	                                            {{ 'admin.common.decision'|trans }}
  1119	                                        </button>
  1120	                                    </div>
  1121	                                </div>
  1122	                            </div>
  1123	                            <div class="col-12 text-end mb-2">
  1124	                                <div class="d-inline-block me-2 align-bottom">
  1125	                                    <select id="page_count_pulldown" class="form-select">
  1126	                                        {% for pageMax in pageMaxis %}
  1127	                                            <option {% if pageMax.name == page_count %} selected {% endif %}
  1128	                                                    value="{{ path('admin_order_page', {'page_no': 1, 'page_count': pageMax.name}) }}">
  1129	                                                {{ 'admin.common.count'|trans({ '%count%': pageMax.name }) }}</option>
  1130	                                        {% endfor %}
  1131	                                    </select>
  1132	                                </div>
  1133	                                <div class="d-inline-block">
  1134	                                    <div class="btn-group" role="group">
  1135	                                        <div class="btn-group" role="group">
  1136	                                            <button type="button" class="btn btn-ec-regular dropdown-menu-toggle" id="csvDownloadDropDown">
  1137	                                                <i class="fa fa-cloud-download me-1 text-secondary"></i>
  1138	                                                <span>{{ 'admin.common.csv_download'|trans }}</span>
  1139	                                            </button>
  1140	                                            <div class="dropdown-menu">
  1141	                                                <a class="dropdown-item" href="{{ url('admin_order_export_order') }}" id="orderCsvDownload">
  1142	                                                    {{ 'admin.order.order_csv.download'|trans }}
  1143	                                                </a>
  1144	                                                <a class="dropdown-item" href="{{ url('admin_order_export_shipping') }}" id="shippingCsvDownload">
  1145	                                                    {{ 'admin.order.shipping_csv.download'|trans }}
  1146	                                                </a>
  1147	                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_ORDER') }) }}" id="orderCsvSetting">
  1148	                                                    {{ 'admin.order.order_csv.setting'|trans }}
  1149	                                                </a>
  1150	                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_SHIPPING') }) }}" id="shippingCsvSetting">
  1151	                                                    {{ 'admin.order.shipping_csv.setting'|trans }}
  1152	                                                </a>
  1153	                                            </div>
  1154	                                        </div>
  1155	
  1156	                                        <div class="btn-group" role="group">
  1157	                                            <button type="button" class="btn btn-ec-regular dropdown-menu-toggle" id="customOrderCsvDownloadDropDown">
  1158	                                                <i class="fa fa-cloud-download me-1 text-secondary"></i>
  1159	                                                <span>{{ 'admin.order.custom_order_csv.download'|trans }}</span>
  1160	                                            </button>
  1161	                                            <div class="dropdown-menu">
  1162	                                                {% for CsvEx in OrderCsvExtensions %}
  1163	                                                    <a class="dropdown-item" href="{{ url('admin_custom_export', {'csvExtensionId': CsvEx.id}) }}">
  1164	                                                        {{ CsvEx.name }}
  1165	                                                    </a>
  1166	                                                {% endfor %}
  1167	                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv_custom', {'csvTypeId': constant('Eccube\\Entity\\Master\\CsvType::CSV_TYPE_ORDER') }) }}">
  1168	                                                    {{ 'admin.order.order.custom_csv.setting'|trans }}
  1169	                                                </a>
  1170	                                            </div>
  1171	                                        </div>
  1172	
  1173	                                        <div class="btn-group" role="group">
  1174	                                            <button type="button" class="btn btn-ec-regular dropdown-menu-toggle" id="customShippingCsvDownloadDropDown">
  1175	                                                <i class="fa fa-cloud-download me-1 text-secondary"></i>
  1176	                                                <span>{{ 'admin.order.custom_shipping_csv.download'|trans }}</span>
  1177	                                            </button>
  1178	                                            <div class="dropdown-menu">
  1179	                                                {% for CsvEx in ShippingCsvExtensions %}
  1180	                                                    <a class="dropdown-item" href="{{ url('admin_custom_export', {'csvExtensionId': CsvEx.id}) }}">
  1181	                                                        {{ CsvEx.name }}
  1182	                                                    </a>
  1183	                                                {% endfor %}
  1184	                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv_custom', {'csvTypeId': constant('Eccube\\Entity\\Master\\CsvType::CSV_TYPE_SHIPPING') }) }}">
  1185	                                                    {{ 'admin.order.order.custom_csv.setting'|trans }}
  1186	                                                </a>
  1187	                                            </div>
  1188	                                        </div>
  1189	
  1190	                                        <div class="btn-group" role="group">
  1191	                                            <button type="button" class="btn btn-ec-regular dropdown-menu-toggle" id="otherDropDown">
  1192	                                                <i class="fa fa-cloud-download me-1 text-secondary"></i>
  1193	                                                <span>{{ 'admin.order.other'|trans }}</span>
  1194	                                            </button>
  1195	                                            <div id="dropmenu" class="dropdown-menu">
  1196	                                                <a class="dropdown-item" href="{{ url('admin_order_manual_mail_all') }}" id="manualMailAll">
  1197	                                                    {{ 'admin.order.mail_bulk'|trans }}
  1198	                                                </a>
  1199	                                            </div>
  1200	                                        </div>
  1201	                                    </div>
  1202	                                </div>
  1203	                            </div>
  1204	                            <div class="col-12">
  1205	                                <div class="row justify-content-between mb-3">
  1206	                                    <div class="col-12">
  1207	                                        <button type="button" id="printStack" class="btn btn-ec-conversion px-5 btn-print-stack">
  1208	                                            {{ 'admin.order.print_stack_paper'|trans }}
  1209	                                        </button>
  1210	                                        <div class="float-end">
  1211	                                            <button type="button" id="labelsExport" class="btn btn-ec-conversion px-5">
  1212	                                                {{ 'admin.order.output_labels_Export'|trans }}
  1213	                                            </button>
  1214	                                            <button type="button" id="printDeliverySlipsJp" class="btn btn-ec-conversion px-5">
  1215	                                                {{ 'admin.order.print_delivery_slips_ja'|trans }}
  1216	                                            </button>
  1217	                                            <button type="button" id="printDeliverySlipsEn" class="btn btn-ec-conversion px-5">
  1218	                                                {{ 'admin.order.print_delivery_slips_en'|trans }}
  1219	                                            </button>
  1220	                                        </div>
  1221	                                    </div>
  1222	                                </div>
  1223	                            </div>
  1224	                        </div>
  1225	                        <div class="card rounded border-0 mb-4 d-block">

codex
送信履歴は `sendManualMailForBulk()` から `saveUserMailHistory()` に入り、テンプレート・受注・顧客・ゲストID・baseInfoは保存されていました。ただし操作会員（creator）は渡されておらず、設計の「操作会員」記述とは異なります。final concise. Need maybe confirm design lines for 副作用, transition, errors.
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html | sed -n '259,330p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   259	<h2 id="API-バッチ">API／バッチ</h2>
   260	<p>本機能では扱わない。</p>
   261	<hr>
   262	<h2 id="副作用">副作用</h2>
   263	<div class="table-wrap"><table><thead><tr><th>種別</th><th>内容</th></tr></thead><tbody><tr><td>外部メール</td><td>受注ごとに1通ずつ SMTP 等へ送信する（ループ内順次）。Bcc で店舗のメール01も受け取る</td></tr><tr><td>DB</td><td>送信のたび <code>dtb_mail_history</code> に行を追加し都度 <code>flush</code> する。履歴にメールテンプレ・受注・顧客・ゲストIDを紐付ける</td></tr><tr><td>セッション</td><td>一覧のページ番号は戻りリンクで <code>eccube.admin.order.search.page_no</code> を参照する。当機能は検索条件自体は書き換えない</td></tr><tr><td>ログ</td><td>本コントローラは送信ログを独自に追記しない（メーラー層のログに依存）</td></tr><tr><td>フラッシュ</td><td>欠落配送ID時はエラー複数、送信完了時は成功1件</td></tr></tbody></table></div>
   264	<hr>
   265	<h2 id="画面遷移">画面遷移</h2>
   266	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>一覧から入口URLへ遷移成功</td><td>一括手動メール入力（テンプレ未選または選択済み）</td></tr><tr><td>入力で確認POST成功</td><td>確認画面</td></tr><tr><td>確認で送信POST成功</td><td><code>admin_order</code>（受注一覧。クエリは付けない）</td></tr><tr><td>配送ID欠落エラー</td><td><code>admin_order</code></td></tr><tr><td><code>ids</code> 不正</td><td>404</td></tr></tbody></table></div>
   267	<hr>
   268	<h2 id="エラー処理">エラー処理</h2>
   269	<div class="table-wrap"><table><thead><tr><th>起き方</th><th>利用者への見え方</th><th>補足</th></tr></thead><tbody><tr><td><code>ids</code> 空・非配列</td><td>404ページ</td><td>一覧側JSで未選択を弾くが、直リンクでは起きうる</td></tr><tr><td>存在しない配送ID</td><td>フラッシュに欠番メッセージ（文言は翻訳ファイルの確認値）</td><td>一覧へ戻る</td></tr><tr><td>不正テンプレID</td><td>404</td><td>—</td></tr><tr><td>フォーム検証失敗</td><td>入力画面または確認POST時の再描画（Symfony標準のエラー表示に委ねる）</td><td><code>mode</code> により分岐</td></tr></tbody></table></div>
   270	<hr>
   271	<h2 id="ログと秘匿情報">ログと秘匿情報</h2>
   272	<p>メール本文・宛先は画面と履歴テーブルに残る。CSRFトークン値やパスワードを本書に記さない。一覧から GET で遷移するとき、一括フォーム内の他 hidden が URL に含まれうるため、ブックマーク共有時の注意は利用者オペレーションに委ねる。</p>
   273	<hr>
   274	<h2 id="調査補助-grep用">調査補助（grep用）</h2>
   275	<ul><li>ルート定義属性: <code>MailController</code> の <code>manualMailAll</code></li><li>Twig: <code>@admin/Order/manual_mail_all.twig</code>、<code>manual_mail_all_confirm.twig</code></li><li>一覧導線: <code>index.twig</code> の <code>#manualMailAll</code>、<code>#form_bulk</code></li></ul>
   276	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   277	<ul><li><code>admin_order_manual_mail_all</code> … <code>GET</code> … <code>/{admin_route}/order/manual_mail/mail_all</code>（クエリ <code>ids[]</code> に配送IDを渡し、テンプレート未選択の入力画面を返す。<code>ids</code> が空・非配列のとき 404）</li><li><code>admin_order_manual_mail_all_edit</code> … <code>GET</code> … <code>/{admin_route}/order/manual_mail/mail_all/{templateId}</code>（同上のうえ <code>templateId</code> でメールテンプレートを特定し、本文プレビュー用HTMLを組み立てた入力画面を返す。テンプレートが許可リスト外なら 404）</li></ul>
   278	<hr>
   279	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   280	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>トランザクション境界</td><td>複数受注へのメール送信全体を包む明示トランザクションは持たない。送信ループ内で1通送るたびにメール履歴を永続化し、その場で<code>flush</code>する。</td></tr><tr><td>ロック</td><td>受注、配送、メール履歴に対する行ロック・悲観ロック・楽観ロック・ロックファイルは使用しない。送信中に受注や配送が更新された場合も、送信時に読み取った値で本文と履歴を作る。</td></tr><tr><td>例外時</td><td>途中の送信または履歴保存で例外が起きた場合、すでに送信済みのメールとflush済みのメール履歴は戻らない。未送信分だけが残る。</td></tr></tbody></table></div>
   281	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   282	    </main>
   283	  </div>
   284	</body>
   285	</html>

exec
/bin/bash -lc "rg -n \"name=\\\"ids\\[\\]|id=\\\"check_|data-order-id|check_\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
81:                return $('input[id^="check_"]:checked').length > 0;
97:            toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
98:            $('input[id^="check_"]').on('change', function() {
99:                $('#toggle_check_all').prop('checked', false);
100:                toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
112:            $('#toggle_check_all').on('change', function() {
115:                    $('input[id^="check_"]').prop('checked', true);
117:                    $('input[id^="check_"]').prop('checked', false);
119:                toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
124:                $('input[id^="check_"]:checked').each(function() {
1231:                                            <input type="checkbox" id="toggle_check_all" name="filter" value="open">
1249:                                                    <input type="checkbox" id="check_{{ Shipping.id }}" data-id="{{ Shipping.id }}" data-order-id="{{ Order.id }}" name="ids[]" value="{{ Shipping.id }}"

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '1225,1395p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "Order#getOrderNo|操作会員|creator|テンプレート参照|履歴|flush|副作用|エラー|NotFound|404|確認不能" /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 128ms:
  1225	                        <div class="card rounded border-0 mb-4 d-block">
  1226	                            <div class="card-body p-0">
  1227	                                <table class="table table-sm" id="search_result">
  1228	                                    <thead>
  1229	                                    <tr>
  1230	                                        <th class="border-top-0 pt-2 pb-2 text-center ps-3">
  1231	                                            <input type="checkbox" id="toggle_check_all" name="filter" value="open">
  1232	                                        </th>
  1233	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.order_date'|trans }}<a href="#" class="js-listSort" data-sortkey="order_date"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1234	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.order_no'|trans }}<a href="#" class="js-listSort" data-sortkey="order_number"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1235	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.common.name'|trans }}<a href="#" class="js-listSort" data-sortkey="orderer"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1236	                                        <th class="border-top-0 pt-2 pb-2 text-center text-nowrap">{{ 'admin.common.payment_method'|trans }}<a href="#" class="js-listSort" data-sortkey="payment_method"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1237	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.purchase_price'|trans }}<a href="#" class="js-listSort" data-sortkey="purchase_price"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1238	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.commit_date'|trans }}<a href="#" class="js-listSort" data-sortkey="order_commit_date"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1239	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.order_status'|trans }}<a href="#" class="js-listSort" data-sortkey="order_status"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1240	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'enterprise.admin.shop.name'|trans }}<a href="#" class="js-listSort" data-sortkey="delivery"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1241	                                        <th class="border-top-0 pt-2 pb-2 text-center pe-3"></th>
  1242	                                    </tr>
  1243	                                    </thead>
  1244	                                    <tbody>
  1245	                                    {% for Order in pagination %}
  1246	                                        {% for Shipping in Order.Shippings %}
  1247	                                            <tr>
  1248	                                                <td class="align-middle text-center ps-3">
  1249	                                                    <input type="checkbox" id="check_{{ Shipping.id }}" data-id="{{ Shipping.id }}" data-order-id="{{ Order.id }}" name="ids[]" value="{{ Shipping.id }}"
  1250	                                                           data-preview-notify-mail-url="{{ url('admin_shipping_preview_notify_mail', { id: Shipping.id}) }}"
  1251	                                                           data-notify-mail-url="{{ url('admin_shipping_notify_mail', { id: Shipping.id}) }}"
  1252	                                                           data-update-status-url="{{ url('admin_shipping_update_order_status', { id: Shipping.id}) }}"
  1253	                                                    />
  1254	                                                </td>
  1255	                                                <td class="align-middle text-start">
  1256	                                                    <a class="action-edit" href="{{ url('admin_order_edit', { id : Order.id }) }}">
  1257	                                                        {{ Order.order_date|date_min }}
  1258	                                                        {% if Order.pickup_today %}
  1259	                                                        <span class="pickup-today-badge">当日</span>
  1260	                                                        {% endif %}
  1261	                                                    </a>
  1262	                                                </td>
  1263	                                                <td class="align-middle text-start">
  1264	                                                    <!-- TODO: アラート + ポイントエラーの場合、スタイル変更 -->
  1265	                                                    <a class="action-edit" href="{{ url('admin_order_edit', { id : Order.id }) }}">
  1266	                                                        {{ Order.order_number }}
  1267	                                                    </a>
  1268	                                                </td>
  1269	                                                <td class="align-middle text-start">
  1270	                                                    {% if Order.Customer is null %}
  1271	                                                        非会員
  1272	                                                    {% else %}
  1273	                                                        {{ Order.name01 ~ Order.name02 }}
  1274	                                                    {% endif %}
  1275	                                                </td>
  1276	                                                <td class="align-middle text-center">
  1277	                                                    {{ Order.payment_method }}
  1278	                                                </td>
  1279	                                                <td class="align-middle text-end">
  1280	                                                    {{ Order.payment_total|price }}
  1281	                                                </td>
  1282	                                                <td class="align-middle text-start">
  1283	                                                    {{ Order.commitDate|date_min }}
  1284	                                                </td>
  1285	
  1286	                                                <td class="align-middle text-center">
  1287	                                                    <span class="badge badge-ec-blue" style="background-color: #fff; color: {{ Order.OrderStatusColor }}; border-color: {{ Order.OrderStatusColor }}">{{ Order.OrderStatus }}</span>
  1288	                                                </td>
  1289	                                                <td class="align-middle text-center">
  1290	                                                    {{ Shipping.BaseInfo.shop_name }}
  1291	                                                </td>
  1292	
  1293	                                                <!-- TODO: 編集系UIは各機能実装時に調整する -->
  1294	                                                <td class="align-middle pe-3">
  1295	                                                    <div class="text-end">
  1296	                                                        <div class="px-1 d-inline-block">
  1297	                                                            <a class="btn btn-ec-actionIcon confirmationModal"
  1298	                                                               data-type="mail" data-bulk-update="false"
  1299	                                                               data-preview-notify-mail-url="{{ url('admin_shipping_preview_notify_mail', { id: Shipping.id}) }}"
  1300	                                                               data-notify-mail-url="{{ url('admin_shipping_notify_mail', { id: Shipping.id}) }}"
  1301	                                                               data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'admin.order.shipping_mail_send'|trans }}">
  1302	                                                                <i class="fa fa-send fa-lg text-secondary" aria-hidden="true"></i>
  1303	                                                            </a>
  1304	                                                        </div>
  1305	                                                        <div class="px-1 d-inline-block">
  1306	                                                            <a class="btn btn-ec-actionIcon pdf-print" href="{{ url('admin_order_export_pdf') }}?ids[]={{ Shipping.id }}" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'admin.order.output_delivery_note_short'|trans }}">
  1307	                                                                <i class="fa fa-table fa-lg text-secondary" aria-hidden="true"></i>
  1308	                                                            </a>
  1309	                                                        </div>
  1310	                                                        <div class="px-1 d-inline-block">
  1311	                                                            <a class="btn btn-ec-actionIcon confirmationModal" href="javascript:;"
  1312	                                                               data-id="{{ Shipping.id }}" data-type="status" data-bulk-update="false"
  1313	                                                               data-update-status-id="{{ constant('Eccube\\Entity\\Master\\OrderStatus::DELIVERED') }}"
  1314	                                                               data-update-status-url="{{ url('admin_shipping_update_order_status', { id: Shipping.id}) }}"
  1315	                                                               data-preview-notify-mail-url="{{ url('admin_shipping_preview_notify_mail', { id: Shipping.id}) }}"
  1316	                                                               data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'admin.order.to_shipped'|trans }}">
  1317	                                                                <i class="fa fa-check fa-lg text-secondary" aria-hidden="true"></i>
  1318	                                                            </a>
  1319	                                                        </div>
  1320	
  1321	                                                        <!-- 編集・削除・メール通知メニュー -->
  1322	                                                        <div class="d-inline-grid text-center">
  1323	                                                            <div class="dropdown history_dropdown">
  1324	                                                                <button class="btn dropdown-menu-toggle" type="button" aria-expanded="false" id="dropdown_{{ Order.id }}">
  1325	                                                                    <i class="fa-solid fa-ellipsis"></i>
  1326	                                                                </button>
  1327	                                                                <div class="dropdown-menu dropdown-menu-end">
  1328	                                                                    <a class="dropdown-item" href="{{ path('admin_order_edit', { 'id':Order.id }) }}">{{ 'admin.common.edit'|trans }}</a>
  1329	                                                                    <a class="dropdown-item" href="{{ path('admin_order_delete', { 'id':Order.id }) }}" {{ csrf_token_for_anchor() }} data-method="delete">{{ 'admin.common.delete'|trans }}</a>
  1330	                                                                    <a class="dropdown-item" href="{{ path('admin_order_manual_mail', { 'orderId': Order.id }) }}">{{ 'admin.order.mail'|trans }}</a>
  1331	                                                                </div>
  1332	                                                            </div>
  1333	                                                        </div>
  1334	                                                    </div>
  1335	                                                </td>
  1336	                                            </tr>
  1337	                                        {% endfor %}
  1338	                                    {% endfor %}
  1339	                                    </tbody>
  1340	                                </table>
  1341	                                <div class="row justify-content-md-center"></div>
  1342	                            </div>
  1343	                            <div class="row justify-content-md-center pb-4 mb-4">
  1344	                                {% if pagination.totalItemCount > 0 %}
  1345	                                    {% include "@admin/pager.twig" with { 'pages' : pagination.paginationData, 'routes' : 'admin_order_page' } %}
  1346	                                {% endif %}
  1347	                            </div>
  1348	                        </div>
  1349	                    </form>
  1350	                    {# 検索条件エラー時 #}
  1351	                {% elseif has_errors %}
  1352	                    <div class="card rounded border-0">
  1353	                        <div class="card-body p-4">
  1354	                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_invalid_condition'|trans }}</div>
  1355	                            <div class="text-center text-muted">{{ 'admin.common.search_try_change_condition'|trans }}</div>
  1356	                        </div>
  1357	                    </div>
  1358	                    {# 検索結果なし #}
  1359	                {% else %}
  1360	                    <div class="card rounded border-0">
  1361	                        <div class="card-body p-4">
  1362	                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
  1363	                            <div class="text-center text-muted">{{ 'admin.common.search_try_change_condition'|trans }}</div>
  1364	                            <div class="text-center text-muted">{{ 'admin.common.search_try_advanced_search'|trans }}</div>
  1365	                        </div>
  1366	                    </div>
  1367	                {% endif %}
  1368	
  1369	                <!-- 出荷済にする確認モーダル -->
  1370	                <div class="modal fade" id="sentUpdateModal" tabindex="-1" role="dialog" aria-labelledby="sentUpdateModal" aria-hidden="true" data-bs-keyboard="false" data-bs-backdrop="static">
  1371	                    <div class="modal-dialog modal-lg" role="document">
  1372	                        <div class="modal-content">
  1373	                            <div class="modal-header">
  1374	                                <h5 class="modal-title fw-bold"><!--confirmationModal_js.twig--></h5>
  1375	                                <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
  1376	                            </div>
  1377	                            <div class="modal-body">
  1378	                                <p class="modal-message"></p>
  1379	                                <ul id="bulkErrors"></ul>
  1380	                                <div id="bulk-options">
  1381	                                    <div class="fw-bold mb-2 notificationMail">{{ 'admin.order.to_shipped__confirm_send_mail'|trans }}</div>
  1382	                                    <div class="form-check form-check-inline">
  1383	                                        <input class="form-check-input" type="checkbox" id="notificationMail">
  1384	                                        <label class="form-check-label notificationMail" for="notificationMail">
  1385	                                            {{ 'admin.order.to_shipped__confirm_send_mail_in_same_time'|trans }}
  1386	                                        </label>
  1387	                                    </div>
  1388	                                    <div>
  1389	                                        <div class="d-inline-block" data-bs-toggle="collapse" href="#viewEmail" aria-expanded="false" aria-controls="viewEmail"><a><i class="fa fa-plus-square-o fw-bold me-1"></i><span class="fw-bold">{{ 'admin.order.bulk_action__confirm_view_mail_body'|trans }}</span></a></div>
  1390	                                        <div class="collapse bg-light p-4 ec-collapse bg-ec-formGray" id="viewEmail" style="word-wrap: break-word; word-break:break-all">
  1391	                                            <pre></pre>
  1392	                                        </div>
  1393	                                    </div>
  1394	                                </div>
  1395	                                <div class="progress" style="display: none">

 succeeded in 115ms:
198:<a class="lv2" href="#副作用">副作用</a>
200:<a class="lv2" href="#エラー処理">エラー処理</a>
220:<p>メール一括送信は現行 pf-eccube3 では HareruyaEc プラグインで実装し、送信履歴を補助テーブル <code>dtb_user_mail_history</code>（主キー <code>send_id</code>）に保存する。移行先 ec-cube-enterprise では送信履歴を <code>dtb_mail_history</code>（主キー <code>id</code>）へ統合する。DB関連は ec-cube-enterprise を正とし、本書のテーブル・列名は移行先名で記す。</p>
221:<div class="table-wrap"><table><thead><tr><th>項目</th><th>現行 pf-eccube3（HareruyaEc）</th><th>移行先 ec-cube-enterprise</th></tr></thead><tbody><tr><td>メール送信履歴テーブル</td><td><code>dtb_user_mail_history</code>（主キー <code>send_id</code>）</td><td><code>dtb_mail_history</code>（主キー <code>id</code>）</td></tr><tr><td>履歴の紐付け</td><td>テンプレート・受注・顧客・買取注文・操作会員</td><td><code>template_id</code>, <code>order_id</code>, <code>customer_id</code>, <code>buy_order_id</code>, <code>creator_id</code>, <code>base_info_id</code></td></tr><tr><td>件名・本文</td><td>件名・本文を保持</td><td><code>mail_subject</code>, <code>mail_body</code>, <code>mail_html_body</code></td></tr><tr><td>メールテンプレートマスタ</td><td><code>dtb_mail_template</code></td><td><code>dtb_mail_template</code>（同一）</td></tr><tr><td>一括送信の確認画面</td><td>確認画面なし。POST で直接フォーム検証し送信する（<code>manual_mail_all.twig</code> 単一画面、<code>MailController</code> のbulkメソッド）</td><td>確認画面あり（<code>mode=confirm</code> で文面プレビュー → <code>mode=complete</code> で送信、<code>manual_mail_all_confirm.twig</code>）</td></tr><tr><td>対象受注パラメータ</td><td><code>order_ids[受注ID]</code> 形式</td><td><code>ids[]</code> 形式</td></tr><tr><td>送信成功フラッシュ</td><td><code>admin.mail.send_success</code></td><td><code>admin.order.mail_send_complete</code></td></tr><tr><td>送信後リダイレクト</td><td>遷移元（Referer）へ戻る</td><td><code>admin_order</code> へ</td></tr></tbody></table></div>
222:<p>本書の副作用節・入力項目の保存先記述は移行先 ec-cube-enterprise の名称（<code>dtb_mail_history</code> 等）に合わせている。現行の補助テーブル名は上表で対応づける。</p>
233:<ol><li>利用者が配送行のチェックボックスを1件以上オンにする。一覧の一括操作ラッパは <code>toggleBtnBulk</code> で表示される。</li><li>「その他」内「メール一括通知」を押す。JavaScript が <code>form_bulk</code> の <code>method</code> を <code>GET</code>、<code>action</code> を <code>admin_order_manual_mail_all</code> にし、送信する。</li><li>サーバが <code>ids</code> 互換パラメータを配列として読む。空または非配列なら <code>NotFoundHttpException</code>（404）。</li><li>配送リポジトリで <code>id IN ids</code> を検索する。</li><li>見つからない配送IDがあるとき、欠けたIDごとに翻訳キー <code>admin.order.mail_all.error.missing</code> を渡したエラーフラッシュを積む（メッセージ文言は「注文ID」とあるが、実装で埋め込むのは欠落した配送ID。実装を確認値とする）。ここで <code>admin_order</code> へリダイレクトし、以降の手順は実行しない。</li><li>配送から受注IDを取り出し <code>array_unique</code> する。受注IDごとに <code>findBy</code> した <code>Orders</code> を以降の画面と送信ループに使う。</li></ol>
235:<ol><li><code>templateId</code> 付き GET なら、ID とファイル名（上記3種のいずれか）でメールテンプレートを1件取得する。不一致なら 404。</li><li>テンプレートがある場合、Twigローダーからファイルソースを読み、<code>replaceBody</code> で <code>{{ include('Mail/order_content.twig'…)}}</code> 等を静的に展開し、<code>{{ header }}</code> / <code>{{ footer }}</code> をtextarea付きHTMLに置換した文字列を本文欄にraw出力する。</li><li><code>OrderManualMailAllType</code> のフォームを作成し、テンプレ選択肢を上記ファイル名に限定する。テンプレがある場合は <code>template</code> と <code>subject</code> フィールドにそのテンプレを反映する。</li><li>右カラムのテーブルで各受注の表示用注文番号は <code>OrderUtil::getOrderNumbers</code>（<code>Order#getOrderNo()</code>）を用いる。受注に紐づく配送のうち、当初選択に含まれる ID だけ hidden で再送する。</li></ol>
239:<ol><li>フォーム検証とテンプレ存在を満たすとき、受注ユニーク集合の各要素について本文 <code>createManualBody</code> を組み立て、<code>sendManualMailForBulk</code> を呼ぶ。件名はリクエストの <code>mail[subject]</code>（確認画面 hidden 経由の連続 POST を想定）。</li><li>各メールは <code>Email</code> の plaintext。From は基準店舗の問い合わせ用メール01と店名、To は受注のメールアドレス、Bcc はメール01、Reply-To はメール03、Return-Path はメール04。共通ユーティリティで本文 charset 等を設定したうえ送信する。</li><li>送信のたびメール履歴を永続化し、その場で <code>flush</code> する。テンプレート参照・受注・顧客・ゲストIDを履歴に載せる実装である。</li><li>ループ後、成功フラッシュ <code>admin.order.mail_send_complete</code> を積み、<code>admin_order</code> へリダイレクトする。</li></ol>
247:<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>テンプレ選択</td><td>必須</td><td>選択式（フォームの文字長上限は該当しない）</td><td>プレースホルダ相当の空選択または GET で渡したテンプレ</td><td><code>MailTemplateType</code>。候補は <code>mt.file_name</code> が <code>Mail/sell_order.twig</code>、<code>Mail/sell_order.en.twig</code>、<code>Mail/no_base.twig</code> のものに限定。変更時は同一画面を別 <code>templateId</code> で GET し直す</td></tr><tr><td>件名</td><td>必須</td><td>フォームに <code>Length</code> 制約は無い</td><td>選択テンプレの <code>mail_subject</code>。確認・送信時は hidden で再送</td><td>送信時に <code>sendManualMailForBulk</code> の件名として使われ、履歴の件名にもなる。マスタ側 <code>mail_subject</code> 列は255だが、入力値の検証はこのフォームでは255に切らない</td></tr><tr><td>ヘッダー</td><td>必須</td><td>フォームに <code>Length</code> 制約は無い（DB上メールテンプレの <code>header</code> 列は TEXT）</td><td>選択テンプレのヘッダ</td><td><code>replaceBody</code> が本文プレビュー内に <code>name="mail[header]"</code> の textarea を埋め込む。<code>getBody</code> に渡る置換後文字列として本文生成に使われる</td></tr><tr><td>フッター</td><td>必須</td><td>同上</td><td>選択テンプレのフッター</td><td><code>name="mail[footer]"</code> の textarea。本文生成に使われる</td></tr></tbody></table></div>
251:<div class="table-wrap"><table><thead><tr><th>状況</th><th>結果</th></tr></thead><tbody><tr><td><code>ids</code> が空・非配列</td><td>404</td></tr><tr><td>一部の配送IDがDBに存在しない</td><td>欠落IDごとにエラーフラッシュ、<code>admin_order</code> へ戻る</td></tr><tr><td>同一受注の複数配送を選択</td><td>受注は1件として扱い、メールは1通</td></tr><tr><td><code>templateId</code> が数値でない・許可外ファイル</td><td>404</td></tr><tr><td>確認画面で先頭受注が無い（理論上、受注配列が空）</td><td>プレビュー本文は空。送信ループも回らない</td></tr><tr><td>一覧の検索結果0件</td><td>一括フォーム自体が無いため、当入口からは操作できない</td></tr></tbody></table></div>
254:<ul><li>本機能の判定・集計・表示条件は既存実装のリポジトリ、サービス、フォーム定義を正とする。</li><li>金額・ポイント・数量・ステータス・日時は永続化済み値または既存サービスの計算結果を使用し、画面・API層で独自補正しない。</li><li>条件不一致、権限不足、検証エラー時は業務データを更新せず、既存のエラー形式または画面遷移に従う。</li></ul>
256:<p>一覧上の注文番号表示（<code>order_number</code>）と、本機能右カラム・履歴まわりで参照する <code>getOrderNo()</code> は別フィールドであり、同一値とは限らない。受注メール本文内の注文番号表記は <code>createManualBody</code> が <code>Order#getOrderNo()</code> を渡す実装に従う。</p>
262:<h2 id="副作用">副作用</h2>
263:<div class="table-wrap"><table><thead><tr><th>種別</th><th>内容</th></tr></thead><tbody><tr><td>外部メール</td><td>受注ごとに1通ずつ SMTP 等へ送信する（ループ内順次）。Bcc で店舗のメール01も受け取る</td></tr><tr><td>DB</td><td>送信のたび <code>dtb_mail_history</code> に行を追加し都度 <code>flush</code> する。履歴にメールテンプレ・受注・顧客・ゲストIDを紐付ける</td></tr><tr><td>セッション</td><td>一覧のページ番号は戻りリンクで <code>eccube.admin.order.search.page_no</code> を参照する。当機能は検索条件自体は書き換えない</td></tr><tr><td>ログ</td><td>本コントローラは送信ログを独自に追記しない（メーラー層のログに依存）</td></tr><tr><td>フラッシュ</td><td>欠落配送ID時はエラー複数、送信完了時は成功1件</td></tr></tbody></table></div>
266:<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>一覧から入口URLへ遷移成功</td><td>一括手動メール入力（テンプレ未選または選択済み）</td></tr><tr><td>入力で確認POST成功</td><td>確認画面</td></tr><tr><td>確認で送信POST成功</td><td><code>admin_order</code>（受注一覧。クエリは付けない）</td></tr><tr><td>配送ID欠落エラー</td><td><code>admin_order</code></td></tr><tr><td><code>ids</code> 不正</td><td>404</td></tr></tbody></table></div>
268:<h2 id="エラー処理">エラー処理</h2>
269:<div class="table-wrap"><table><thead><tr><th>起き方</th><th>利用者への見え方</th><th>補足</th></tr></thead><tbody><tr><td><code>ids</code> 空・非配列</td><td>404ページ</td><td>一覧側JSで未選択を弾くが、直リンクでは起きうる</td></tr><tr><td>存在しない配送ID</td><td>フラッシュに欠番メッセージ（文言は翻訳ファイルの確認値）</td><td>一覧へ戻る</td></tr><tr><td>不正テンプレID</td><td>404</td><td>—</td></tr><tr><td>フォーム検証失敗</td><td>入力画面または確認POST時の再描画（Symfony標準のエラー表示に委ねる）</td><td><code>mode</code> により分岐</td></tr></tbody></table></div>
272:<p>メール本文・宛先は画面と履歴テーブルに残る。CSRFトークン値やパスワードを本書に記さない。一覧から GET で遷移するとき、一括フォーム内の他 hidden が URL に含まれうるため、ブックマーク共有時の注意は利用者オペレーションに委ねる。</p>
277:<ul><li><code>admin_order_manual_mail_all</code> … <code>GET</code> … <code>/{admin_route}/order/manual_mail/mail_all</code>（クエリ <code>ids[]</code> に配送IDを渡し、テンプレート未選択の入力画面を返す。<code>ids</code> が空・非配列のとき 404）</li><li><code>admin_order_manual_mail_all_edit</code> … <code>GET</code> … <code>/{admin_route}/order/manual_mail/mail_all/{templateId}</code>（同上のうえ <code>templateId</code> でメールテンプレートを特定し、本文プレビュー用HTMLを組み立てた入力画面を返す。テンプレートが許可リスト外なら 404）</li></ul>
280:<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>トランザクション境界</td><td>複数受注へのメール送信全体を包む明示トランザクションは持たない。送信ループ内で1通送るたびにメール履歴を永続化し、その場で<code>flush</code>する。</td></tr><tr><td>ロック</td><td>受注、配送、メール履歴に対する行ロック・悲観ロック・楽観ロック・ロックファイルは使用しない。送信中に受注や配送が更新された場合も、送信時に読み取った値で本文と履歴を作る。</td></tr><tr><td>例外時</td><td>途中の送信または履歴保存で例外が起きた場合、すでに送信済みのメールとflush済みのメール履歴は戻らない。未送信分だけが残る。</td></tr></tbody></table></div>

codex
FALSE_POSITIVE | 対象finding 2件 | 誤検知なし。どちらも設計引用・実装引用は実在し、実装は `getOrderNo()` ではなく `getOrderNumber()` を使用している | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:235`, `:256` / 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:459`, `:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php:37`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`, `:647`, `:887`, `:1768` | findingsは維持

WEAK_EVIDENCE | 対象finding 2件 | 根拠不備なし。JSONの `designRef` / `implRef` は参照可能で、引用内容も概ね該当行と一致 | 同上 | 修正不要

MISSED | 送信履歴 / 操作会員 | 設計の移行先履歴紐付けには `creator_id` が含まれるが、本機能の送信実装は `saveUserMailHistory()` に操作会員を渡さず、既定値 `null` のまま `setCreator($creator)` している。なお設計の送信フロー・副作用節は「テンプレート参照・受注・顧客・ゲストID」までしか明記しておらず、設計内にも粒度差がある | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:221` / 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2092`, `:2107`, `:2115`, `:2122` | findingsへ低〜中程度の差分として追加、または設計側で本機能では `creator_id` 非設定と明記

SEVERITY | 既存2 finding | `med` は妥当。顧客向け本文・確認画面表示に出る番号差分だが、送信不能やDB破壊ではないため `high` までは不要、顧客表示値の相違なので `low` でもない | 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:393`, `:394`, `:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:116` | severity維持

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
177,521
FALSE_POSITIVE | 対象finding 2件 | 誤検知なし。どちらも設計引用・実装引用は実在し、実装は `getOrderNo()` ではなく `getOrderNumber()` を使用している | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:235`, `:256` / 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:459`, `:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php:37`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`, `:647`, `:887`, `:1768` | findingsは維持

WEAK_EVIDENCE | 対象finding 2件 | 根拠不備なし。JSONの `designRef` / `implRef` は参照可能で、引用内容も概ね該当行と一致 | 同上 | 修正不要

MISSED | 送信履歴 / 操作会員 | 設計の移行先履歴紐付けには `creator_id` が含まれるが、本機能の送信実装は `saveUserMailHistory()` に操作会員を渡さず、既定値 `null` のまま `setCreator($creator)` している。なお設計の送信フロー・副作用節は「テンプレート参照・受注・顧客・ゲストID」までしか明記しておらず、設計内にも粒度差がある | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html:221` / 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2092`, `:2107`, `:2115`, `:2122` | findingsへ低〜中程度の差分として追加、または設計側で本機能では `creator_id` 非設定と明記

SEVERITY | 既存2 finding | `med` は妥当。顧客向け本文・確認画面表示に出る番号差分だが、送信不能やDB破壊ではないため `high` までは不要、顧客表示値の相違なので `low` でもない | 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:393`, `:394`, `:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:116` | severity維持

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
