OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26ab-e833-7ac2-a1c6-18f5ddcd2047
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-14_admin_order_order_status_change
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-14_admin_order_order_status_change.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-14_admin_order_order_status_change.html
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
読み取り専用で、まず候補JSONと設計書・実装の参照位置を確認します。対象が監査なので、既存findingを鵜呑みにせず周辺実装も追います。
exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-14_admin_order_order_status_change.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-14_admin_order_order_status_change",
  "title": "m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/ec-cube-enterprise/m05-14_admin_order_order_status_change.html",
  "findings": [
    {
      "dimension": "②業務ルール・計算",
      "severity": "med",
      "designRef": "functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:122-133",
      "designQuote": "| 8 | 変更後が発送済みかつ変更前が発送済みでない場合のみ | 付与ポイントを会員残高へ反映し、外部在庫連携サービスへ発生ポイントを連携する。 |",
      "implRef": "src/Eccube/Controller/Admin/Order/EditController.php:815-817",
      "difference": "設計の処理フロー表（順序1〜9, md:122-133）は、対応状況変更(status_change)で発生する明示的なポイント操作として『出荷完了(DELIVERED)遷移時のgainPoints』（行8）のみを列挙する。しかし実装は tryCommitOrderStatusChange のトランザクション内(L815-817)で、初回取消（新たにCANCELへ遷移し取消日が未設定）のとき pointService->cancelOrderPoints($TargetOrder) を呼び付与済みポイントを取り消しており、設計の処理フロー表・業務ルール表(md:170-179)いずれにも対応記載が無い。gainPoints を本書で明記する一方 cancelOrderPoints を記載しない非対称。確認ダイアログ文言(md:158『付与済みポイント：取り消し』)は挙動の存在を示唆する。md:40は在庫・ポイント内部計算を対象外とするがgainPointsは本書記載のため対象外扱いでは説明が付かない。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "EditController.php:815-817 `if ($isFirstCancellation) { $this->pointService->cancelOrderPoints($TargetOrder); }`（isFirstCancellation は L781 で判定）。設計処理フロー表 md:122-133 に cancelOrderPoints 相当の行が無く、gainPoints は行8(md:131)に記載。実装は register 側(L636-638)でも同処理を持つ。"
    },
    {
      "dimension": "⑦エラー処理・試行制限",
      "severity": "low",
      "designRef": "functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:302",
      "designQuote": "許可されない遷移先の指定 | 受注ステータス項目にステータス変更不可のエラーを表示する。確定処理側でも遷移適用が失敗すればトランザクションを巻き戻す。",
      "implRef": "src/Eccube/Controller/Admin/Order/EditController.php:798-824",
      "difference": "status_change確定処理 tryCommitOrderStatusChange の wrapInTransaction(L799-824)は orderStateMachine->apply()(L801)を呼ぶが、register側 tryCommitOrderRegister(L690-708)と異なり InvalidArgumentException/PurchaseException/ShoppingException を捕捉する try/catch を持たない。OrderStateMachine::apply は不許可遷移で \\InvalidArgumentException を投げる(OrderStateMachine.php:45)。ただし(a)設計md:302が確定処理側に求めるのは『トランザクション巻き戻し』のみで、wrapInTransaction はコールバック例外時に必ず rollback するため巻き戻しは満たされる。(b)通常フローでは OrderType::validateOrderStatus(L505-533)が can() 判定で不許可遷移にフォームエラーを付与し、L768 の !form->isValid() で apply 到達前にリダイレクトするため apply は到達しない。差異は『万一フォーム検証を迂回して到達した場合、例外が未捕捉で伝播し500になり addError フラッシュが出ない』点のみで、実務上到達不能。設計が確定処理側に約束するrollbackは満たされるため、規約違反かは確証不能。",
      "confidence": "low",
      "verdict": "UNCERTAIN",
      "evidence": "EditController.php:798-824 に try/catch 無し（対して register 側 L690-708 は3種例外を捕捉）。OrderStateMachine.php:45 で不許可遷移時 throw new \\InvalidArgumentException()。OrderType.php:524-531 で can()偽なら addError→!isValid()、EditController.php:768 で redirect。到達不能かつ設計の要求(rollback)は wrapInTransaction で充足されるため差異は理論上のみ。"
    }
  ]
}

exec
/bin/bash -lc 'pwd && rg --files /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise /home/y-saito/Developments/ec-cube-enterprise/src/Eccube | head -200' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/hareruya-design-docs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/EccubeNav.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/EccubeTwigBlock.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/Constant.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/ConnectionType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/PurchaseProductListOrderBy.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/ProductListDisplayMode.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/EccubeConfig.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventSubscriber/RestockNotificationPostCommitSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Log/Processor/SessionProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Log/Processor/TokenProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Log/Logger.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/CsvImportException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/HasSmaregiStockCannotDisableAlignmentException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/PluginApiException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/CartException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/CloudFileAccessedBeforeMergeException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/HasStockCannotAbolishException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiTransactionProcessMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/TestMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiProductClassDeleteMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOtcSyncMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiWebhookEventMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOtcDeleteMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderGainPointMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiCustomerUpdateMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderUsePointMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiStockProcessMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiProductClassUpsertMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiSectionUpsertMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiCustomerPointAddMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallPluginController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockJoinApprovalRequiredException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockMoveInstructionCreateException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockJoinMoveToShortageValidationException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockMoveInstructionDeleteException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockSplitApprovalRequiredException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/MailUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductFinder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ShopUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/MemberUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/ProductSearchSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/PurchaseSearchSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/UsedCardController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/EntryInvalidSecretKeyException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/EntryAlreadyActivatedException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/EntryActivateFailedException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/PurchaseCartLineLimitExceededException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/EventCapacityExceededException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/PluginException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/MailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseHistoryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchProductController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AbstractCsvImportController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/TemplateController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/PluginController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/TemplateEvent.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/IpCheckSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EventArgs.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/ProductSearchEventConstant.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BeforeSearchEvent.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BaseProductSearchEvent.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Smaregi/Api/Transaction/TransactionDetailDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Smaregi/Api/Transaction/TransactionDto.php
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
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-18_admin_order_order_shipping_standby_list_create.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/a05-01_api_order_print_direct.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-14_admin_order_order_status_change.json
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/RepositoryExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/MemberProvider.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/CustomerProvider.php
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
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/admin_product_sale_high_price_csv_export.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-06_admin_order_order_bulk_manual_mail.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-17_admin_order_order_shipping_memo.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-23_admin_order_order_shipping_standby_print_delivery_slips_en.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-11_admin_order_order_edit.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-04_admin_order_order_shipping_csv_export.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-16_admin_order_order_shop_memo.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-19_admin_order_order_shipping_standby_list_search.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-05_admin_order_order_shipping_custom_csv_export.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/admin_product_simple_low_price_csv_export.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-07_admin_order_order_labels_csv_export.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-09_admin_order_order_print_delivery_slips_ja.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/a05-04_api_order_order_smaregi_receive.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-01_admin_order_order_search_list.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-02_admin_order_order_csv_export.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-21_admin_order_order_shipping_standby_picking_list_print.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/admin_customer_point.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-20_admin_order_order_shipping_standby_detail_edit_delete.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-27_admin_order_order_waiting_tag.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-10_admin_order_order_print_delivery_slips_en.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-03_admin_order_order_custom_csv_export.json
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Stream/Filter/SjisToUtf8EncodingFilter.php
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-08_admin_order_order_stack_paper_print.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-13_admin_order_order_tracking_number.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-26_admin_order_order_shipping_result_csv_import.json
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Stream/Filter/ConvertLineFeedFilter.php
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-12_admin_order_order_bulk_status_change.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/a05-02_api_order_print_direct.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-15_admin_order_order_mail.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-24_admin_order_order_shipping_export_for_import.json
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/MasterdataController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/LogController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SystemController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/MemberController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/PermissionAccessUrlController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/AuthorityController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/LoginHistoryController.php
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m06-12_admin_store_purchase_purchase_store_product_list_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_content_js.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_content_css.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m04-34_admin_stock_stock_move_return_list_pdf_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-14_admin_order_order_status_change.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_content_maintenance.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m02-01_admin_home_home_order_status.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_order_mail.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m04-27_admin_stock_stock_move_result_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_order_tracking_number.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-15_admin_order_order_mail.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_setting_system_system_info.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m04-08_admin_stock_stock_move_transfer_search_list.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_order_status_change.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/b01-03_batch_data_stock_warning.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/batch_stock_shortage.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_order_shipping_memo.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m04-20_admin_stock_stock_shortage_history_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_purchase_store_return_list_pdf_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_order_bulk_status_change.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_content_layout.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m06-10_admin_store_purchase_purchase_store_return_list_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m10-14_admin_base_setting_setting_shop_mall_shop_list.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/api_otc_buy_order_partial_cancel_sync.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m01-02_admin_login_two_factor_auth.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m02-06_admin_home_home_recommend_plugins.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/b01-02_batch_data_stock_shortage.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_stock_move_result_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m03-44_admin_product_product_simple_low_price_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_home_shop_status.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/api_otc_buy_order_double_check_member_update.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_stock_move_transfer_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_home_sales_status.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_stock_split_join_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m04-23_admin_stock_stock_split_join_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m02-03_admin_home_home_sales_chart.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/TagSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/ProductQueryBuilderSubscriber.php
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m11-05_admin_system_setting_setting_system_masterdata.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/ProductNameSubscriber.php
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m02-04_admin_home_home_shop_status.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Loader/LocaleFilesystemLoader.php
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_home_sales_chart.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/ColorSubscriber.php
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m04-14_admin_stock_stock_split_join_csv_export.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m04-07_admin_stock_stock_warning_csv_export.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/InStockSubscriber.php
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_stock_split_join_register_edit.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/ManaCostSubscriber.php

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-14_admin_order_order_status_change.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更） - 機能仕様書</title>
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
   183	<a class="lv2" href="#本書で扱うこと">本書で扱うこと</a>
   184	<a class="lv2" href="#本書で扱わないこと">本書で扱わないこと</a>
   185	<a class="lv2" href="#リニューアル移行時の扱い">リニューアル移行時の扱い</a>
   186	<a class="lv2" href="#用語">用語</a>
   187	<a class="lv2" href="#利用者視点の入口">利用者視点の入口</a>
   188	<a class="lv2" href="#フロント挙動">フロント挙動</a>
   189	<a class="lv2" href="#処理フロー">処理フロー</a>
   190	<a class="lv3" href="#受注編集-詳細-画面の表示">受注編集（詳細）画面の表示</a>
   191	<a class="lv3" href="#対応状況変更操作の送信">対応状況変更操作の送信</a>
   192	<a class="lv2" href="#受注ステータス変更時の判定順序">受注ステータス変更時の判定順序</a>
   193	<a class="lv2" href="#表示メッセージ">表示メッセージ</a>
   194	<a class="lv3" href="#フラッシュ・トースト">フラッシュ・トースト</a>
   195	<a class="lv3" href="#エラー・警告-インライン">エラー・警告（インライン）</a>
   196	<a class="lv3" href="#確認ダイアログ-ブラウザ">確認ダイアログ（ブラウザ）</a>
   197	<a class="lv3" href="#表示しないが関連する遷移">表示しないが関連する遷移</a>
   198	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   199	<a class="lv3" href="#入力項目">入力項目</a>
   200	<a class="lv3" href="#エッジケース">エッジケース</a>
   201	<a class="lv2" href="#データ整合性">データ整合性</a>
   202	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   203	<a class="lv2" href="#入出力">入出力</a>
   204	<a class="lv2" href="#DBカラム">DBカラム</a>
   205	<a class="lv3" href="#DB操作">DB操作</a>
   206	<a class="lv2" href="#バリデーション">バリデーション</a>
   207	<a class="lv2" href="#権限・認可">権限・認可</a>
   208	<a class="lv2" href="#画面遷移">画面遷移</a>
   209	<a class="lv2" href="#エラー処理">エラー処理</a>
   210	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   211	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   212	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a></nav>
   213	    </aside>
   214	    <main class="doc-content">
   215	      <header class="page-header">
   216	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md</p>
   217	        <h1>m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）</h1>
   218	      </header>
   219	      <p>受注編集（詳細）画面で、受注の対応状況（受注ステータス）を別のステータスへ変更し、変更後の状態と関連する日時を保存する処理。</p>
   220	<h2 id="概要">概要</h2>
   221	<p>受注編集（詳細）画面の対応状況プルダウンで遷移先ステータスを選び、対応状況変更の操作を行うと、現在のステータスから選択したステータスへ受注ステータスを変更して保存する機能である。変更は受注ステータス遷移の許可規則に従い、出荷完了・取消・入金済み・ピック中への遷移では対応する受注日時を自動でセットする。</p>
   222	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。既存実装のふるまい、参照するデータ、遷移の判定境界、副作用を確認し、仕様の確からしさを把握することを目的とする。</p>
   223	<p>対象はブラウザ経由の管理画面の受注編集（詳細）画面における、対応状況変更操作（送信種別 <code>status_change</code>）に限る。受注編集画面のうち、明細・金額・配送・会員情報など受注情報全般の編集と登録（送信種別 <code>register</code>）は別機能として扱う。</p>
   224	<p>管理画面のパスプレフィックスは環境変数 <code>ECCUBE_ADMIN_ROUTE</code> を起点に <code>eccube.yaml</code> の <code>eccube_admin_route</code> で決まる。既定値は <code>admin</code> であり、URLエンドポイントでは <code>%eccube_admin_route%</code> で示す。本書では Symfony のルート name を本文の主説明とせず、URLエンドポイントを実装確認値として記載する。</p>
   225	<p>本機能のカスタマイズ区分は標準であり、挙動・DB関連ともにec-cube-enterpriseの実装を正とする。</p>
   226	<hr>
   227	<h2 id="本書で扱うこと">本書で扱うこと</h2>
   228	<ul><li>受注編集（詳細）画面で対応状況プルダウンに表示される遷移先ステータスの絞り込み方</li><li>対応状況変更操作を送信したとき、どの条件でステータスが変更・保存されるか</li><li>出荷完了・取消・入金済み・ピック中への遷移時に、出荷日・取消日・入金日・確認日をどの順序でセットするか</li><li>出荷完了への遷移時に出荷日のセット・ポイント付与・外部連携が起きること</li><li>遷移前後が同一・遷移先が許可されない場合の扱いとフラッシュメッセージ</li><li>受注更新者と更新日時の記録範囲</li></ul>
   229	<hr>
   230	<h2 id="本書で扱わないこと">本書で扱わないこと</h2>
   231	<p>以下は本書では仕様確定せず、実装または別機能の設計を正とする。</p>
   232	<ul><li>受注の明細・金額・配送・会員情報など受注情報全般の編集と登録（送信種別 <code>register</code>）</li><li>受注一覧からの対応状況の一括変更（M05-12）</li><li>問い合わせ番号の登録（M05-13）</li><li>受注完了・出荷完了等に伴うメール送信（M05-15）</li><li>受注メモの登録・編集（M05-16、M05-17）</li><li>日付クリア操作（送信種別 <code>clear_date</code>）による各日時の消去</li><li>受注ステータス遷移に連動する在庫・ポイントの加減算の内部計算（受注ステータス遷移の購入フローの設計を正とする）</li><li>受注対応状況マスタ（名称・色・件数表示）の設定（m10-11_admin_base_setting_setting_shop_order_status の設計を正とする）</li><li>管理画面のログイン・認証・権限割り当ての詳細</li></ul>
   233	<hr>
   234	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   235	<p>本機能はカスタマイズ区分が標準であり、リニューアル後の標準機能としてec-cube-enterpriseの実装を正典とする。挙動・画面・DBスキーマはいずれもec-cube-enterpriseに基づき、現行リポとの差分管理は本書では行わない。受注ステータスと自動セットする日時の参照列（dtb_order.order_status_id、payment_date、cancel_date、confirm_date、shipping_date、update_date、dtb_shipping.shipping_date、mtb_order_status.sort_no など）はec-cube-enterpriseの実装で実在を確認しており、移行先スキーマと同一とする。</p>
   236	<hr>
   237	<h2 id="用語">用語</h2>
   238	<div class="table-wrap"><table><thead><tr><th>用語</th><th>説明</th></tr></thead><tbody><tr><td>対応状況</td><td>受注の処理段階を表す受注ステータス。画面ラベルは「対応状況」。マスタは <code>mtb_order_status</code>、受注の現在値は <code>dtb_order.order_status_id</code>。</td></tr><tr><td>遷移先ステータス</td><td>対応状況プルダウンで選べる、現在のステータスから変更可能なステータス。受注ステータス遷移の許可規則で絞り込まれる。</td></tr><tr><td>受注ステータス遷移の許可規則</td><td>状態遷移の定義により、現在のステータスから到達できる遷移先を限定する仕組み。許可されない遷移先はプルダウンに出さず、強制送信時も変更を拒否する。</td></tr><tr><td>対応状況変更操作</td><td>受注編集（詳細）画面で対応状況だけを変更して保存する操作。送信時に送信種別 <code>status_change</code> を伴う。</td></tr><tr><td>現在のステータス</td><td>画面表示時点の受注の対応状況。プルダウンの直上に表示名で表示する。</td></tr></tbody></table></div>
   239	<p>主なステータスの照合値は次のとおりとする。新規受付（<code>OrderStatus::NEW</code>=1）、注文取消し（<code>CANCEL</code>=3）、対応中（<code>IN_PROGRESS</code>=4）、発送済み（<code>DELIVERED</code>=5）、入金済み（<code>PAID</code>=6）、ピック中（<code>PICKING</code>=10）。表示名は受注対応状況マスタの設定に従う。</p>
   240	<hr>
   241	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   242	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注編集（詳細）画面を開く</td><td><code>GET /%eccube_admin_route%/order/{id}/edit</code></td><td>受注の現在の対応状況を表示名で表示し、対応状況プルダウンに遷移可能なステータスを表示する。</td></tr><tr><td>対応状況変更操作を送信</td><td><code>POST /%eccube_admin_route%/order/{id}/edit</code>（送信種別 <code>status_change</code>）</td><td>選択した遷移先ステータスへ変更・保存し、同じ受注編集（詳細）画面へリダイレクトしてフラッシュメッセージを表示する。</td></tr><tr><td>新規受注登録画面を開く</td><td><code>GET /%eccube_admin_route%/order/new</code></td><td>新規受注では対応状況プルダウンと対応状況変更操作を表示しない。本機能の対象外とする。</td></tr><tr><td>未認証・管理画面へ到達できない利用者</td><td><code>GET /%eccube_admin_route%/order/{id}/edit</code></td><td>受注編集（詳細）画面自体に到達できないため、本操作も利用できない。</td></tr></tbody></table></div>
   243	<p>対応状況変更操作は、画面内の対応状況変更ボタンが受注編集フォームの送信種別を <code>status_change</code> に切り替えてフォームを送信することで届く。受注編集フォームのアクションは送信前に受注編集（詳細）画面のパスへ戻され、日付クリア操作で付与される <code>target</code> クエリを引き継がない。</p>
   244	<hr>
   245	<h2 id="フロント挙動">フロント挙動</h2>
   246	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>受注情報領域に「現在のステータス」として現在の対応状況の表示名を表示し、その下に「対応状況」プルダウンを表示する。プルダウンは既存受注（受注 ID あり）のときのみ表示する。</td></tr><tr><td>対応状況プルダウン</td><td>単一選択のプルダウン。選択肢は受注ステータス遷移の許可規則で絞り込まれた遷移先ステータスのみで構成する（現在のステータス自身は遷移定義に含まれないため選択肢に出さない。<code>OrderType</code> が同一ステータスを除外する）。現在のステータスは別途表示する。表示順は受注対応状況マスタの並び順の昇順。</td></tr><tr><td>対応状況変更ボタン</td><td>押下すると受注編集フォームの送信種別を <code>status_change</code> にし、フォームのアクションを受注編集（詳細）画面のパスへ戻したうえでフォームを送信する。</td></tr><tr><td>JS 挙動による確認ダイアログ</td><td>取消へ変更する場合と、取消から他ステータスへ変更する場合に、在庫・ポイントの変動内容を説明する確認ダイアログを表示する。利用者が取り消すと送信を中止する。確認ダイアログの文言は表示メッセージ節に示す。</td></tr><tr><td>モーダル・ポップアップ</td><td>本操作では会員検索・商品検索モーダルを使わない。これらは受注情報全般の編集の範囲とする。</td></tr><tr><td>入力項目</td><td>本操作で利用者が入力するのは対応状況プルダウンの選択のみ。テキスト入力・textarea は持たない。</td></tr></tbody></table></div>
   247	<hr>
   248	<h2 id="処理フロー">処理フロー</h2>
   249	<h3 id="受注編集-詳細-画面の表示">受注編集（詳細）画面の表示</h3>
   250	<ol><li>管理者が受注編集（詳細）画面を開く。</li><li>システムは対象受注を取得し、受注編集フォームを組み立てる。</li><li>既存受注のとき、対応状況プルダウンに、受注ステータス遷移の許可規則で現在のステータスから到達できる遷移先ステータスを選択肢として表示する。到達できないステータスおよび現在のステータス自身は選択肢から除外する。</li><li>「現在のステータス」として現在の対応状況の表示名を表示する。</li></ol>
   251	<h3 id="対応状況変更操作の送信">対応状況変更操作の送信</h3>
   252	<ol><li>利用者が対応状況プルダウンで遷移先ステータスを選び、対応状況変更ボタンを押す。</li><li>ブラウザ側で、取消への変更または取消からの変更にあたる場合は確認ダイアログを表示し、取り消されたら送信しない。</li><li>送信種別 <code>status_change</code> で受注編集（詳細）画面のパスへ送信する。</li><li>システムは受注ステータス以外の明細サブフォームが妥当であることを前提に、対応状況変更の確定処理に入る。</li><li>変更前ステータスと変更後ステータスのいずれかが取得できない、または両者が同一の場合は、何も変更せず受注編集（詳細）画面へリダイレクトする。</li><li>受注フォーム全体が妥当でない場合は、何も変更せず受注編集（詳細）画面へリダイレクトする。</li><li>変更後ステータスに応じて、出荷日・取消日・入金日・確認日を後述の判定順序でセットする。</li><li>受注のステータスをいったん変更前ステータスへ戻したうえで、トランザクション内で受注ステータス遷移の許可規則に従い変更後ステータスへ遷移を適用する。許可されない遷移のときは遷移適用が失敗し、トランザクションを巻き戻す。</li><li>受注の更新者を操作中の管理者、更新日時を現在日時として保存する。</li><li>出荷完了へ新たに遷移した場合は、付与ポイントを会員残高へ反映し、外部在庫連携サービスへ発生ポイントを連携する。</li><li>受注に外部連携コードがあり、かつ変更後ステータスが取消でない場合は、外部連携サービスへ商品情報を連携する。</li><li>変更後ステータスが取消のときは取消完了のフラッシュ、それ以外のときは保存完了のフラッシュを表示し、受注編集（詳細）画面へリダイレクトする。</li></ol>
   253	<hr>
   254	<h2 id="受注ステータス変更時の判定順序">受注ステータス変更時の判定順序</h2>
   255	<p>変更前ステータスと変更後ステータスが異なり、かつ受注フォームが妥当な場合に、現在日時を一度だけ取得し、次の順で日時をセットする。各日時は条件を満たすときだけ更新する。</p>
   256	<div class="table-wrap"><table><thead><tr><th>順序</th><th>判定</th><th>結果</th></tr></thead><tbody><tr><td>1</td><td>変更後が発送済み（DELIVERED）かつ変更前が発送済みでない</td><td>受注の出荷日に現在日時をセットし、受注配下の各配送の出荷日にも現在日時をセットする。</td></tr><tr><td>2</td><td>変更後が取消（CANCEL）かつ変更前が取消でなく、取消日が未設定</td><td>受注の取消日に現在日時をセットする。</td></tr><tr><td>3</td><td>変更後が入金済み（PAID）かつ変更前が入金済みでなく、入金日が未設定</td><td>受注の入金日に現在日時をセットする。</td></tr><tr><td>4</td><td>変更後がピック中（PICKING）かつ変更前がピック中でなく、確認日が未設定</td><td>受注の確認日に現在日時をセットする。</td></tr><tr><td>5</td><td>上記の日時セット後</td><td>受注のステータスを変更前ステータスへ戻す。</td></tr><tr><td>6</td><td>トランザクション開始後</td><td>受注ステータス遷移の許可規則に従い変更後ステータスへ遷移を適用する。許可されない遷移のときは遷移適用が失敗する。</td></tr><tr><td>7</td><td>遷移適用後</td><td>受注の更新者を操作中の管理者、更新日時を現在日時としてセットして永続化する。</td></tr><tr><td>8</td><td>変更後が発送済みかつ変更前が発送済みでない場合のみ</td><td>付与ポイントを会員残高へ反映し、外部在庫連携サービスへ発生ポイントを連携する。</td></tr><tr><td>9</td><td>受注に外部連携コードがあり、変更後ステータスが取消でない場合のみ</td><td>外部連携サービスへ商品情報を連携する。</td></tr></tbody></table></div>
   257	<p>順序 1 から 4 の日時セットは、受注ステータス遷移の許可規則による遷移可否の判定より前に行う。遷移が許可されずトランザクションを巻き戻した場合、これらの日時セットは永続化されない。入金日は受注ステータス遷移側でも入金遷移時にセットされるが、本操作では遷移適用の前に未設定時の入金日を補完する。</p>
   258	<hr>
   259	<h2 id="表示メッセージ">表示メッセージ</h2>
   260	<h3 id="フラッシュ・トースト">フラッシュ・トースト</h3>

codex
候補JSONは2件でした。1件目はポイント取消の扱い、2件目は不許可遷移例外の捕捉に関するものなので、該当コントローラ、フォーム、ステートマシン、テンプレートの実線を開きます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '730,845p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-14_admin_order_order_status_change.html | sed -n '259,430p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php | sed -n '480,545p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   480	
   481	        // 新規登録時は, 新規受付ステータスで登録する.
   482	        if (null === $Order->getOrderStatus()) {
   483	            $Order->setOrderStatus($this->orderStatusRepository->find(OrderStatus::NEW));
   484	            // 会員受注の場合、会員の性別/職業/誕生日をエンティティにコピーする
   485	            if ($Customer = $Order->getCustomer()) {
   486	                $Order->setSex($Customer->getSex());
   487	                $Order->setJob($Customer->getJob());
   488	                $Order->setBirth($Customer->getBirth());
   489	            }
   490	        } else {
   491	            // 編集時は, mapped => falseで定義しているため, フォームから変更後データを取得する.
   492	            $form = $event->getForm();
   493	            $Order->setOrderStatus($form['OrderStatus']->getData());
   494	        }
   495	
   496	        // 新規登録時は受注日を登録する.
   497	        if (null === $Order->getOrderDate()) {
   498	            $Order->setOrderDate(new \DateTime());
   499	        }
   500	    }
   501	
   502	    /**
   503	     * 受注ステータスのバリデーションを行う.
   504	     */
   505	    public function validateOrderStatus(FormEvent $event): void
   506	    {
   507	        /** @var Order $Order */
   508	        $Order = $event->getData();
   509	        if (!$Order->getId()) {
   510	            return;
   511	        }
   512	
   513	        $form = $event->getForm();
   514	        if (!$form['OrderStatus']->isValid()) {
   515	            return;
   516	        }
   517	        // mapped => falseで定義しているため, Orderのステータスは変更されない
   518	        $oldStatus = $Order->getOrderStatus();
   519	        // 変更後のステータスはFormから直接取得する.
   520	        $newStatus = $form['OrderStatus']->getData();
   521	
   522	        // ステータスに変更があった場合のみチェックする.
   523	        if ($oldStatus->getId() != $newStatus->getId()) {
   524	            if (!$this->orderStateMachine->can($Order, $newStatus)) {
   525	                $form['OrderStatus']->addError(
   526	                    new FormError(trans('admin.order.failed_to_change_status__short', [
   527	                        '%from%' => $oldStatus->getName(),
   528	                        '%to%' => $newStatus->getName(),
   529	                    ]))
   530	                );
   531	            }
   532	        }
   533	    }
   534	
   535	    /**
   536	     * 受注明細のバリデーションを行う.
   537	     * 商品明細が1件も登録されていない場合はエラーとする.
   538	     */
   539	    public function validateOrderItems(FormEvent $event): void
   540	    {
   541	        /** @var Order $Order */
   542	        $Order = $event->getData();
   543	        $OrderItems = $Order->getOrderItems();
   544	
   545	        $count = 0;

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php | sed -n '1,90p'" in /home/y-saito/Developments/hareruya-design-docs
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
    14	namespace Eccube\Service;
    15	
    16	use Eccube\Entity\Master\OrderStatus;
    17	use Eccube\Entity\Order;
    18	use Eccube\Repository\Master\OrderStatusRepository;
    19	use Eccube\Service\PurchaseFlow\Processor\PointProcessor;
    20	use Eccube\Service\PurchaseFlow\Processor\StockReduceProcessor;
    21	use Eccube\Service\PurchaseFlow\PurchaseContext;
    22	use Symfony\Component\EventDispatcher\EventSubscriberInterface;
    23	use Symfony\Component\Workflow\Event\Event;
    24	use Symfony\Component\Workflow\Transition;
    25	use Symfony\Component\Workflow\WorkflowInterface;
    26	
    27	class OrderStateMachine implements EventSubscriberInterface
    28	{
    29	    public function __construct(private readonly WorkflowInterface $_orderStateMachine, private readonly OrderStatusRepository $orderStatusRepository, private readonly PointProcessor $pointProcessor, private readonly StockReduceProcessor $stockReduceProcessor)
    30	    {
    31	    }
    32	
    33	    /**
    34	     * 指定ステータスに遷移.
    35	     *
    36	     * @param Order $Order 受注
    37	     * @param OrderStatus $OrderStatus 遷移先ステータス
    38	     */
    39	    public function apply(Order $Order, OrderStatus $OrderStatus, ?string $transitionName = null): void
    40	    {
    41	        $transition = $this->getEnabledTransition($Order, $OrderStatus, $transitionName);
    42	        if ($transition) {
    43	            $this->_orderStateMachine->apply($this->newContext($Order), $transition->getName());
    44	        } else {
    45	            throw new \InvalidArgumentException();
    46	        }
    47	    }
    48	
    49	    /**
    50	     * 指定ステータスに遷移できるかどうかを判定.
    51	     *
    52	     * @param Order $Order 受注
    53	     * @param OrderStatus $OrderStatus 遷移先ステータス
    54	     *
    55	     * @return bool 指定ステータスに遷移できる場合はtrue
    56	     */
    57	    public function can(Order $Order, OrderStatus $OrderStatus, ?string $transitionName = null): bool
    58	    {
    59	        return $this->getEnabledTransition($Order, $OrderStatus, $transitionName) !== null;
    60	    }
    61	
    62	    public function getEnabledTransition(Order $Order, OrderStatus $OrderStatus, ?string $transitionName = null): ?Transition
    63	    {
    64	        // OrderStatusが設定されていない場合は遷移不可
    65	        if (!$Order->getOrderStatus()) {
    66	            return null;
    67	        }
    68	
    69	        return $this->getTransition($this->newContext($Order), $OrderStatus, $transitionName);
    70	    }
    71	
    72	    private function getTransition(OrderStateMachineContext $context, OrderStatus $OrderStatus, ?string $transitionName = null): ?Transition
    73	    {
    74	        $transitions = $this->_orderStateMachine->getEnabledTransitions($context);
    75	        foreach ($transitions as $t) {
    76	            if ($transitionName !== null && $t->getName() !== $transitionName) {
    77	                continue;
    78	            }
    79	            if (in_array($OrderStatus->getId(), $t->getTos())) {
    80	                return $t;
    81	            }
    82	        }
    83	
    84	        return null;
    85	    }
    86	
    87	    /**
    88	     * {@inheritdoc}
    89	     */
    90	    #[\Override]

 succeeded in 142ms:
   730	        if ($newStatusId === OrderStatus::CANCEL) {
   731	            $this->addSuccess('admin.order.cancel.complete', 'admin');
   732	        } elseif ($isPartCancel) {
   733	            $this->addSuccess('admin.order.part_cancel.complete', 'admin');
   734	        } else {
   735	            $this->addSuccess('admin.order.save.complete', 'admin');
   736	        }
   737	
   738	        log_info('受注登録完了', [$TargetOrder->getId()]);
   739	
   740	        if ($returnLink = $form->get('return_link')->getData()) {
   741	            try {
   742	                $pattern = '/^'.preg_quote($request->getBasePath(), '/').'/';
   743	                $returnLink = preg_replace($pattern, '', (string) $returnLink);
   744	                $result = $router->match($returnLink);
   745	                $params = array_filter($result, fn ($key) => !str_starts_with((string) $key, '_'), ARRAY_FILTER_USE_KEY);
   746	
   747	                return $this->redirectToRoute($result['_route'], $params);
   748	            } catch (\Exception) {
   749	                log_warning('URLの形式が不正です。');
   750	            }
   751	        }
   752	
   753	        return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   754	    }
   755	
   756	    /**
   757	     * 「ステータス更新」押下時の確定処理。ステータス遷移と日付更新のみを行う.
   758	     */
   759	    private function tryCommitOrderStatusChange(Order $TargetOrder, Order $OriginOrder, FormInterface $form): RedirectResponse
   760	    {
   761	        $prevStatusId = $OriginOrder->getOrderStatus()?->getId();
   762	        $newStatusId = $TargetOrder->getOrderStatus()?->getId();
   763	
   764	        if ($prevStatusId === null || $newStatusId === null || $prevStatusId === $newStatusId) {
   765	            return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   766	        }
   767	
   768	        if (!$form->isValid()) {
   769	            return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   770	        }
   771	
   772	        $now = new \DateTime();
   773	        $statusChangedToDelivered = $newStatusId === OrderStatus::DELIVERED && $prevStatusId !== OrderStatus::DELIVERED;
   774	
   775	        if ($statusChangedToDelivered) {
   776	            $TargetOrder->setShippingDate($now);
   777	            foreach ($TargetOrder->getShippings() as $Shipping) {
   778	                $Shipping->setShippingDate($now);
   779	            }
   780	        }
   781	        $isFirstCancellation = $newStatusId === OrderStatus::CANCEL && $prevStatusId !== OrderStatus::CANCEL && $TargetOrder->getCancelDate() === null;
   782	        if ($isFirstCancellation) {
   783	            $TargetOrder->setCancelDate($now);
   784	        }
   785	        if ($newStatusId === OrderStatus::PAID && $prevStatusId !== OrderStatus::PAID && $TargetOrder->getPaymentDate() === null) {
   786	            $TargetOrder->setPaymentDate($now);
   787	        }
   788	        if ($newStatusId === OrderStatus::PICKING && $prevStatusId !== OrderStatus::PICKING && $TargetOrder->getConfirmDate() === null) {
   789	            $TargetOrder->setConfirmDate($now);
   790	        }
   791	
   792	        $OldOrderStatus = $OriginOrder->getOrderStatus();
   793	        $NewOrderStatus = $TargetOrder->getOrderStatus();
   794	        if ($OldOrderStatus !== null && $NewOrderStatus !== null) {
   795	            $TargetOrder->setOrderStatus($OldOrderStatus);
   796	        }
   797	
   798	        $gainPointJob = null;
   799	        $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $statusChangedToDelivered, $isFirstCancellation, $OldOrderStatus, $NewOrderStatus, &$gainPointJob): void {
   800	            if ($OldOrderStatus !== null && $NewOrderStatus !== null) {
   801	                $this->orderStateMachine->apply($TargetOrder, $NewOrderStatus);
   802	            }
   803	
   804	            $TargetOrder
   805	                ->setMember($this->getMember())
   806	                ->setUpdateDate(new \DateTime());
   807	            $this->entityManager->persist($TargetOrder);
   808	
   809	            // 新たに出荷完了になった場合、ポイントを付加
   810	            if ($statusChangedToDelivered) {
   811	                $this->pointService->gainPoints($TargetOrder);
   812	                // 発生ポイントのスマレジ連携ジョブを同一トランザクションで積む（dispatch は commit 後）.
   813	                $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
   814	            }
   815	            if ($isFirstCancellation) {
   816	                $this->pointService->cancelOrderPoints($TargetOrder);
   817	            }
   818	
   819	            if ($TargetOrder->getSmaregiCode()
   820	                && $TargetOrder->getOrderStatus() !== null
   821	                && $TargetOrder->getOrderStatus()->getId() !== OrderStatus::CANCEL) {
   822	                $this->smaregiApiService->postSmaregiProcess($TargetOrder, ['product']);
   823	            }
   824	        });
   825	
   826	        // 受注確定の commit 成功後に発生ポイント連携メッセージを送信する（アウトボックス的な順序）。
   827	        if ($gainPointJob !== null) {
   828	            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
   829	        }
   830	
   831	        if ($newStatusId === OrderStatus::CANCEL) {
   832	            $this->addSuccess('admin.order.cancel.complete', 'admin');
   833	        } else {
   834	            $this->addSuccess('admin.order.save.complete', 'admin');
   835	        }
   836	
   837	        return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   838	    }
   839	
   840	    /**
   841	     * 商品規格ごとの数量差分から一部キャンセルかどうかを判定する.
   842	     */
   843	    private function isPartCancel(Order $TargetOrder, Order $OriginOrder): bool
   844	    {
   845	        $fromQuantities = $this->getProductQuantitiesByProductClass($OriginOrder);

 succeeded in 138ms:
   259	<h2 id="表示メッセージ">表示メッセージ</h2>
   260	<h3 id="フラッシュ・トースト">フラッシュ・トースト</h3>
   261	<div class="table-wrap"><table><thead><tr><th>種別</th><th>表示文言（日本語）</th><th>表示文言（英語）</th><th>条件</th></tr></thead><tbody><tr><td>成功</td><td>全キャンセルが完了しました。</td><td>-</td><td>対応状況変更が成立し、変更後ステータスが取消のとき。ロケールキーadmin.order.cancel.completeは日本語のみで英語ロケール資源を持たない。</td></tr><tr><td>成功</td><td>保存しました</td><td>Saved</td><td>対応状況変更が成立し、変更後ステータスが取消以外のとき。ロケールキーadmin.order.save.complete。</td></tr></tbody></table></div>
   262	<h3 id="エラー・警告-インライン">エラー・警告（インライン）</h3>
   263	<div class="table-wrap"><table><thead><tr><th>表示文言（日本語）</th><th>表示文言（英語）</th><th>表示条件（利用者視点）</th><th>表示位置</th><th>備考</th></tr></thead><tbody><tr><td>%from% から %to% にはステータス変更できません</td><td>You are not allowed to change the status from %from% to %to%</td><td>許可されない遷移先を強制的に選んで送信したとき。%from% は変更前、%to% は変更後のステータス表示名。</td><td>対応状況プルダウン直下のフォームエラー</td><td>受注編集フォームの受注ステータス検証で表示する。調査補助のキーは <code>admin.order.failed_to_change_status__short</code>。</td></tr></tbody></table></div>
   264	<h3 id="確認ダイアログ-ブラウザ">確認ダイアログ（ブラウザ）</h3>
   265	<div class="table-wrap"><table><thead><tr><th>表示文言（日本語）</th><th>表示条件（利用者視点）</th></tr></thead><tbody><tr><td>過去にキャンセルされているため、在庫数やポイントの変動はありません。\nキャンセルしてもよろしいですか？</td><td>変更後が取消で、変更前が取消でなく、取消日が既に設定済みのとき。</td></tr><tr><td>全キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：払い戻し\n付与済みポイント：取り消し</td><td>変更後が取消で、変更前が取消でなく、取消日が未設定のとき。</td></tr><tr><td>キャンセルからステータスを変更する場合は、在庫の変動はありません。\n別途、在庫の減算操作を行ってください。</td><td>変更前が取消で、変更後が取消以外のとき。</td></tr></tbody></table></div>
   266	<h3 id="表示しないが関連する遷移">表示しないが関連する遷移</h3>
   267	<div class="table-wrap"><table><thead><tr><th>事象</th><th>画面でのメッセージ</th></tr></thead><tbody><tr><td>変更前後が同一ステータス</td><td>メッセージなしで受注編集（詳細）画面を再表示する。</td></tr><tr><td>受注フォームが妥当でない、または変更前後のいずれかのステータスが取得できない</td><td>フラッシュなしで受注編集（詳細）画面を再表示する。</td></tr></tbody></table></div>
   268	<hr>
   269	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   270	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>遷移先の絞り込み</td><td>対応状況プルダウンの選択肢は、受注ステータス遷移の許可規則で現在のステータスから到達できる遷移先に限る。到達できないステータスおよび現在のステータス自身は表示しない。</td></tr><tr><td>変更の成立条件</td><td>変更前ステータスと変更後ステータスがともに取得でき、両者が異なり、受注フォームが妥当であることを成立条件とする。</td></tr><tr><td>日時の自動セット</td><td>出荷完了・取消・入金済み・ピック中への遷移で、それぞれ出荷日・取消日・入金日・確認日を現在日時でセットする。取消日・入金日・確認日は既設定のときは上書きしない。出荷日は受注と各配送の双方にセットする。</td></tr><tr><td>出荷完了時のポイント</td><td>出荷完了へ新たに遷移したときのみ、付与ポイントを会員残高へ反映し、外部在庫連携へ発生ポイントを連携する。本操作ではポイントの入力欄を持たず、ポイント値の再計算は行わない。</td></tr><tr><td>更新者・更新日時</td><td>変更成立時に受注の更新者を操作中の管理者、更新日時を現在日時で更新する。</td></tr><tr><td>外部連携</td><td>受注に外部連携コードがあり変更後ステータスが取消でない場合のみ、外部連携サービスへ商品情報を連携する。</td></tr></tbody></table></div>
   271	<h3 id="入力項目">入力項目</h3>
   272	<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>対応状況</td><td>必須</td><td>単一選択（受注ステータスマスタの 1 行）</td><td>現在のステータス</td><td><code>dtb_order.order_status_id</code>。受注フォームのキー <code>order[OrderStatus]</code>。受注フォーム側ではマッピング対象外で扱い、確定処理が変更前後のステータスを比較してから受注へ反映する。選択肢は受注ステータス遷移の許可規則で絞り込む。未選択は不可（空送信は検証エラー）。</td></tr></tbody></table></div>
   273	<p>対応状況は受注ステータスマスタ（<code>mtb_order_status</code>）の行から選ぶ単一選択であり、自由入力ではない。選択肢の絞り込みと遷移可否の最終判定は受注ステータス遷移の許可規則で行う。</p>
   274	<h3 id="エッジケース">エッジケース</h3>
   275	<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>変更前と変更後が同一ステータス</td><td>変更せず受注編集（詳細）画面へリダイレクトする。日時セット・遷移適用・更新者更新を行わない。</td></tr><tr><td>変更前または変更後のステータスが取得できない</td><td>変更せず受注編集（詳細）画面へリダイレクトする。</td></tr><tr><td>許可されない遷移先を強制送信</td><td>受注フォームの受注ステータス検証でステータス変更不可のエラーを表示し、確定処理に入っても遷移適用が失敗してトランザクションを巻き戻す。</td></tr><tr><td>取消日・入金日・確認日が既に設定済み</td><td>これらは上書きしない。出荷日は条件成立時に常にセットする。</td></tr><tr><td>出荷完了へ遷移、ただし変更前が既に出荷完了</td><td>同一ステータスのため変更が成立せず、出荷日セットもポイント付与も行わない。</td></tr><tr><td>取消から他ステータスへ戻す</td><td>ブラウザ側で在庫変動なしの確認ダイアログを表示する。受注ステータス遷移の許可規則で許可される範囲でのみ変更できる。</td></tr><tr><td>受注フォーム全体が妥当でない</td><td>何も変更せずリダイレクトする。</td></tr></tbody></table></div>
   276	<hr>
   277	<h2 id="データ整合性">データ整合性</h2>
   278	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>参照時点</td><td>遷移先プルダウンの選択肢と現在のステータス表示は、受注編集（詳細）画面表示時点の受注ステータスに基づく。表示後に他操作でステータスが変わっても、表示中のプルダウンは自動更新しない。</td></tr><tr><td>変更の原子性</td><td>日時の一部は遷移可否判定の前にメモリ上でセットするが、遷移適用・更新者更新・ポイント反映・外部連携はひとつのトランザクション内で行い、遷移適用が失敗したときは巻き戻す。</td></tr><tr><td>出荷日の整合</td><td>出荷完了へ遷移したとき、受注の出荷日と各配送の出荷日に同一の現在日時をセットする。</td></tr><tr><td>一覧との整合</td><td>受注一覧で表示するステータス・各日時は、本操作の保存完了後の永続化済みデータに従う。表示中の一覧との即時一致は保証しない。</td></tr><tr><td>外部連携との整合</td><td>外部在庫連携・外部連携サービスへの反映タイミングは各連携機能の設計を正とする。本操作は連携呼び出しを起動するのみとする。</td></tr></tbody></table></div>
   279	<hr>
   280	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   281	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>API</td><td>本操作はサーバ側でフォーム送信を受けて処理する。出荷完了へ新たに遷移したとき、および外部連携コードを持ち取消以外へ遷移したときに、外部在庫連携・外部連携サービスを呼び出す。連携の成否判定と再実行の扱いは各連携機能の設計を正とする。</td></tr><tr><td>バッチ</td><td>本操作はバッチを起動しない。</td></tr><tr><td>失敗時</td><td>受注ステータス遷移の許可規則に反する遷移は遷移適用が失敗し、トランザクションを巻き戻して受注編集（詳細）画面へ戻す。購入処理上の例外時もエラーを表示して画面を再表示する。</td></tr></tbody></table></div>
   282	<hr>
   283	<h2 id="入出力">入出力</h2>
   284	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>受注編集（詳細）画面からの送信種別 <code>status_change</code> の POST。対応状況プルダウンの選択値を含む受注フォーム。</td></tr><tr><td>成功時出力</td><td>受注ステータスと関連日時・更新者・更新日時を保存し、受注編集（詳細）画面へリダイレクトしてフラッシュメッセージを表示する。</td></tr><tr><td>失敗時出力</td><td>変更せずに受注編集（詳細）画面へリダイレクトする、または受注ステータス検証エラーや購入処理例外のメッセージを表示して画面を再表示する。</td></tr><tr><td>副作用</td><td>受注ステータス遷移に伴う在庫・ポイントの加減算、出荷完了時の付与ポイント反映、外部連携の呼び出し、更新者・更新日時の記録。</td></tr></tbody></table></div>
   285	<hr>
   286	<h2 id="DBカラム">DBカラム</h2>
   287	<p>当機能に直接関係する列のみを以下に列挙する。型や一覧の細部はスキーマを参照する。</p>
   288	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td>dtb_order</td><td>order_status_id</td><td>変更対象の対応状況。受注ステータスマスタを参照する。</td></tr><tr><td>dtb_order</td><td>payment_date</td><td>入金済みへ新たに遷移し未設定のときに現在日時をセット。</td></tr><tr><td>dtb_order</td><td>cancel_date</td><td>取消へ新たに遷移し未設定のときに現在日時をセット。</td></tr><tr><td>dtb_order</td><td>confirm_date</td><td>ピック中へ新たに遷移し未設定のときに現在日時をセット。</td></tr><tr><td>dtb_order</td><td>shipping_date</td><td>出荷完了へ新たに遷移したときに現在日時をセット。</td></tr><tr><td>dtb_order</td><td>update_date</td><td>変更成立時に現在日時で更新。</td></tr><tr><td>dtb_shipping</td><td>shipping_date</td><td>出荷完了へ新たに遷移したとき、受注配下の各配送にも現在日時をセット。</td></tr><tr><td>mtb_order_status</td><td>id</td><td>受注ステータスの照合キー。プルダウンの選択肢の母集合。</td></tr><tr><td>mtb_order_status</td><td>name</td><td>プルダウンと現在のステータスの表示名。</td></tr><tr><td>mtb_order_status</td><td>sort_no</td><td>プルダウンの選択肢の並び順（昇順）。</td></tr></tbody></table></div>
   289	<h3 id="DB操作">DB操作</h3>
   290	<p>永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。</p>
   291	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>登録/更新</td><td>dtb_order / dtb_shipping / mtb_order_status</td><td>当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。</td></tr></tbody></table></div>
   292	<hr>
   293	<h2 id="バリデーション">バリデーション</h2>
   294	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>対応状況</td><td>未選択は不可。空送信は受注フォームの受注ステータス項目の検証で弾く。</td></tr><tr><td>遷移可否</td><td>変更前後でステータスが異なる場合に、受注ステータス遷移の許可規則で遷移可否を判定する。許可されない遷移はステータス変更不可のエラーを受注ステータス項目に表示する。確定処理側でも遷移適用が失敗すればトランザクションを巻き戻す。</td></tr><tr><td>明細の妥当性</td><td>確定処理に入る前提として、受注明細サブフォームが妥当であることを要求する。受注フォーム全体が妥当でない場合は変更しない。</td></tr></tbody></table></div>
   295	<hr>
   296	<h2 id="権限・認可">権限・認可</h2>
   297	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>受注編集（詳細）画面の対応状況変更</th></tr></thead><tbody><tr><td>未認証</td><td>利用不可。管理画面の認証要件によりログインへ誘導される。</td></tr><tr><td>管理者として認証済み</td><td>受注編集（詳細）画面を開き、対応状況を変更・保存できる。</td></tr><tr><td>新規受注登録画面</td><td>対応状況プルダウンと対応状況変更操作を表示しないため、本操作は行えない。</td></tr></tbody></table></div>
   298	<p>管理画面の URL は管理画面ファイアウォールの対象であり、認証済みの管理者のみが到達できる。個別の権限割り当ての詳細は管理画面の権限機能の設計を正とする。</p>
   299	<hr>
   300	<h2 id="画面遷移">画面遷移</h2>
   301	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>受注編集（詳細）画面を開く</td><td>同一画面に現在のステータスと対応状況プルダウンを表示。</td></tr><tr><td>対応状況変更が成立</td><td>同じ受注編集（詳細）画面へリダイレクトし、フラッシュメッセージを表示。</td></tr><tr><td>変更前後が同一・フォーム不妥当・ステータス取得不可</td><td>同じ受注編集（詳細）画面へリダイレクト（変更なし）。</td></tr><tr><td>許可されない遷移を強制送信</td><td>受注編集（詳細）画面を再表示し、ステータス変更不可のエラーを表示。</td></tr></tbody></table></div>
   302	<p>対応状況変更の送信前に、受注編集フォームのアクションを受注編集（詳細）画面のパスへ戻し、日付クリア操作の <code>target</code> クエリを引き継がない。送信は通常の管理画面内ページ遷移として扱う。</p>
   303	<hr>
   304	<h2 id="エラー処理">エラー処理</h2>
   305	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>許可されない遷移先の指定</td><td>受注ステータス項目にステータス変更不可のエラーを表示する。確定処理側でも遷移適用が失敗すればトランザクションを巻き戻す。文言は表示メッセージ節を正とする。</td></tr><tr><td>変更前後が同一・ステータス取得不可</td><td>変更せず受注編集（詳細）画面へリダイレクトする。専用の利用者向けメッセージは出さない。</td></tr><tr><td>購入処理上の例外</td><td>エラーメッセージを表示し、受注編集（詳細）画面を再表示する。</td></tr><tr><td>指定 ID の受注が存在しない</td><td>受注が見つからない（HTTP 404）として扱う。</td></tr></tbody></table></div>
   306	<hr>
   307	<h2 id="ログ・監査">ログ・監査</h2>
   308	<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>対応状況変更操作のみ</td><td>本操作単体では業務監査ログを追加で書く処理は持たない。受注登録（送信種別 <code>register</code>）側の開始・完了ログは別機能の範囲とする。</td></tr></tbody></table></div>
   309	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   310	<ul><li>セッション識別子の完全値</li><li>なりすまし対策トークンや Cookie の原値</li><li>会員の個人情報に該当する本文を、ステータス変更の説明に書くこと</li></ul>
   311	<hr>
   312	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   313	<p>対応状況変更の確定処理は、受注ステータス遷移の適用・更新者と更新日時の更新・出荷完了時のポイント反映・外部連携の呼び出しをひとつのトランザクション内で行い、遷移適用が失敗したときは巻き戻す。本操作に固有の悲観ロック取得は持たず、受注ステータス遷移に伴う在庫処理側のロックは購入フローの設計を正とする。</p>
   314	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   315	    </main>
   316	  </div>
   317	</body>
   318	</html>

codex
設計HTMLの該当行は存在しますが、JSON内の `md:302` はHTMLでは画面遷移節で、エラー処理はHTML 304-305です。Markdown由来の行番号とHTML行番号がずれている可能性があるため、実体のMarkdown有無も確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md | sed -n '150,182p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md | sed -n '110,135p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   150	|-------------------|-------------------|----------------------|----------|------|
   151	| %from% から %to% にはステータス変更できません | You are not allowed to change the status from %from% to %to% | 許可されない遷移先を強制的に選んで送信したとき。%from% は変更前、%to% は変更後のステータス表示名。 | 対応状況プルダウン直下のフォームエラー | 受注編集フォームの受注ステータス検証で表示する。調査補助のキーは `admin.order.failed_to_change_status__short`。 |
   152	
   153	### 確認ダイアログ（ブラウザ）
   154	
   155	| 表示文言（日本語） | 表示条件（利用者視点） |
   156	|-------------------|----------------------|
   157	| 過去にキャンセルされているため、在庫数やポイントの変動はありません。\nキャンセルしてもよろしいですか？ | 変更後が取消で、変更前が取消でなく、取消日が既に設定済みのとき。 |
   158	| 全キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：払い戻し\n付与済みポイント：取り消し | 変更後が取消で、変更前が取消でなく、取消日が未設定のとき。 |
   159	| キャンセルからステータスを変更する場合は、在庫の変動はありません。\n別途、在庫の減算操作を行ってください。 | 変更前が取消で、変更後が取消以外のとき。 |
   160	
   161	### 表示しないが関連する遷移
   162	
   163	| 事象 | 画面でのメッセージ |
   164	|------|-------------------|
   165	| 変更前後が同一ステータス | メッセージなしで受注編集（詳細）画面を再表示する。 |
   166	| 受注フォームが妥当でない、または変更前後のいずれかのステータスが取得できない | フラッシュなしで受注編集（詳細）画面を再表示する。 |
   167	
   168	---
   169	
   170	## 業務ルール・計算
   171	
   172	| 項目 | 内容 |
   173	|------|------|
   174	| 遷移先の絞り込み | 対応状況プルダウンの選択肢は、受注ステータス遷移の許可規則で現在のステータスから到達できる遷移先に限る。到達できないステータスおよび現在のステータス自身は表示しない。 |
   175	| 変更の成立条件 | 変更前ステータスと変更後ステータスがともに取得でき、両者が異なり、受注フォームが妥当であることを成立条件とする。 |
   176	| 日時の自動セット | 出荷完了・取消・入金済み・ピック中への遷移で、それぞれ出荷日・取消日・入金日・確認日を現在日時でセットする。取消日・入金日・確認日は既設定のときは上書きしない。出荷日は受注と各配送の双方にセットする。 |
   177	| 出荷完了時のポイント | 出荷完了へ新たに遷移したときのみ、付与ポイントを会員残高へ反映し、外部在庫連携へ発生ポイントを連携する。本操作ではポイントの入力欄を持たず、ポイント値の再計算は行わない。 |
   178	| 更新者・更新日時 | 変更成立時に受注の更新者を操作中の管理者、更新日時を現在日時で更新する。 |
   179	| 外部連携 | 受注に外部連携コードがあり変更後ステータスが取消でない場合のみ、外部連携サービスへ商品情報を連携する。 |
   180	
   181	### 入力項目
   182	

 succeeded in 0ms:
   110	8. 受注のステータスをいったん変更前ステータスへ戻したうえで、トランザクション内で受注ステータス遷移の許可規則に従い変更後ステータスへ遷移を適用する。許可されない遷移のときは遷移適用が失敗し、トランザクションを巻き戻す。
   111	9. 受注の更新者を操作中の管理者、更新日時を現在日時として保存する。
   112	10. 出荷完了へ新たに遷移した場合は、付与ポイントを会員残高へ反映し、外部在庫連携サービスへ発生ポイントを連携する。
   113	11. 受注に外部連携コードがあり、かつ変更後ステータスが取消でない場合は、外部連携サービスへ商品情報を連携する。
   114	12. 変更後ステータスが取消のときは取消完了のフラッシュ、それ以外のときは保存完了のフラッシュを表示し、受注編集（詳細）画面へリダイレクトする。
   115	
   116	---
   117	
   118	## 受注ステータス変更時の判定順序
   119	
   120	変更前ステータスと変更後ステータスが異なり、かつ受注フォームが妥当な場合に、現在日時を一度だけ取得し、次の順で日時をセットする。各日時は条件を満たすときだけ更新する。
   121	
   122	| 順序 | 判定 | 結果 |
   123	|------|------|------|
   124	| 1 | 変更後が発送済み（DELIVERED）かつ変更前が発送済みでない | 受注の出荷日に現在日時をセットし、受注配下の各配送の出荷日にも現在日時をセットする。 |
   125	| 2 | 変更後が取消（CANCEL）かつ変更前が取消でなく、取消日が未設定 | 受注の取消日に現在日時をセットする。 |
   126	| 3 | 変更後が入金済み（PAID）かつ変更前が入金済みでなく、入金日が未設定 | 受注の入金日に現在日時をセットする。 |
   127	| 4 | 変更後がピック中（PICKING）かつ変更前がピック中でなく、確認日が未設定 | 受注の確認日に現在日時をセットする。 |
   128	| 5 | 上記の日時セット後 | 受注のステータスを変更前ステータスへ戻す。 |
   129	| 6 | トランザクション開始後 | 受注ステータス遷移の許可規則に従い変更後ステータスへ遷移を適用する。許可されない遷移のときは遷移適用が失敗する。 |
   130	| 7 | 遷移適用後 | 受注の更新者を操作中の管理者、更新日時を現在日時としてセットして永続化する。 |
   131	| 8 | 変更後が発送済みかつ変更前が発送済みでない場合のみ | 付与ポイントを会員残高へ反映し、外部在庫連携サービスへ発生ポイントを連携する。 |
   132	| 9 | 受注に外部連携コードがあり、変更後ステータスが取消でない場合のみ | 外部連携サービスへ商品情報を連携する。 |
   133	
   134	順序 1 から 4 の日時セットは、受注ステータス遷移の許可規則による遷移可否の判定より前に行う。遷移が許可されずトランザクションを巻き戻した場合、これらの日時セットは永続化されない。入金日は受注ステータス遷移側でも入金遷移時にセットされるが、本操作では遷移適用の前に未設定時の入金日を補完する。
   135	

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md | sed -n '286,310p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   286	
   287	| 条件 | 遷移先 |
   288	|------|--------|
   289	| 受注編集（詳細）画面を開く | 同一画面に現在のステータスと対応状況プルダウンを表示。 |
   290	| 対応状況変更が成立 | 同じ受注編集（詳細）画面へリダイレクトし、フラッシュメッセージを表示。 |
   291	| 変更前後が同一・フォーム不妥当・ステータス取得不可 | 同じ受注編集（詳細）画面へリダイレクト（変更なし）。 |
   292	| 許可されない遷移を強制送信 | 受注編集（詳細）画面を再表示し、ステータス変更不可のエラーを表示。 |
   293	
   294	対応状況変更の送信前に、受注編集フォームのアクションを受注編集（詳細）画面のパスへ戻し、日付クリア操作の `target` クエリを引き継がない。送信は通常の管理画面内ページ遷移として扱う。
   295	
   296	---
   297	
   298	## エラー処理
   299	
   300	| エラー内容 | 処理 |
   301	|------------|------|
   302	| 許可されない遷移先の指定 | 受注ステータス項目にステータス変更不可のエラーを表示する。確定処理側でも遷移適用が失敗すればトランザクションを巻き戻す。文言は表示メッセージ節を正とする。 |
   303	| 変更前後が同一・ステータス取得不可 | 変更せず受注編集（詳細）画面へリダイレクトする。専用の利用者向けメッセージは出さない。 |
   304	| 購入処理上の例外 | エラーメッセージを表示し、受注編集（詳細）画面を再表示する。 |
   305	| 指定 ID の受注が存在しない | 受注が見つからない（HTTP 404）として扱う。 |
   306	
   307	---
   308	
   309	## ログ・監査
   310	

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 104ms:
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
    18	use Doctrine\Common\Collections\ArrayCollection;
    19	use Eccube\Controller\AbstractController;
    20	use Eccube\Entity\Customer;
    21	use Eccube\Entity\DtbStockoutHistory;
    22	use Eccube\Entity\Master\CustomerStatus;
    23	use Eccube\Entity\Master\MtbOption;
    24	use Eccube\Entity\Master\OrderItemType;
    25	use Eccube\Entity\Master\OrderStatus;
    26	use Eccube\Entity\Master\TaxType;
    27	use Eccube\Entity\Member;
    28	use Eccube\Entity\Order;
    29	use Eccube\Entity\OrderItem;
    30	use Eccube\Entity\Payment;
    31	use Eccube\Entity\Shipping;
    32	use Eccube\Event\EccubeEvents;
    33	use Eccube\Event\EventArgs;
    34	use Eccube\Exception\ShoppingException;
    35	use Eccube\Form\Type\Admin\OrderType;
    36	use Eccube\Form\Type\Admin\SearchCustomerType;
    37	use Eccube\Form\Type\Admin\SearchProductType;
    38	use Eccube\Repository\BaseInfoRepository;
    39	use Eccube\Repository\CategoryRepository;
    40	use Eccube\Repository\CustomerRepository;
    41	use Eccube\Repository\DeliveryRepository;
    42	use Eccube\Repository\DtbShippingStandbyRepository;
    43	use Eccube\Repository\DtbWaitingNumberRepository;
    44	use Eccube\Repository\Master\DeviceTypeRepository;
    45	use Eccube\Repository\Master\MtbOptionRepository;
    46	use Eccube\Repository\Master\OrderItemTypeRepository;
    47	use Eccube\Repository\Master\OrderStatusRepository;
    48	use Eccube\Repository\OrderRepository;
    49	use Eccube\Repository\ProductClassRepository;
    50	use Eccube\Repository\ProductRepository;
    51	use Eccube\Service\OrderHelper;
    52	use Eccube\Service\OrderStateMachine;
    53	use Eccube\Service\PointService;
    54	use Eccube\Service\PurchaseFlow\Processor\OrderNoProcessor;
    55	use Eccube\Service\PurchaseFlow\PurchaseContext;
    56	use Eccube\Service\PurchaseFlow\PurchaseException;
    57	use Eccube\Service\PurchaseFlow\PurchaseFlow;
    58	use Eccube\Service\PurchaseFlow\PurchaseFlowResult;
    59	use Eccube\Service\Smaregi\SmaregiApiService;
    60	use Eccube\Service\Smaregi\SmaregiOrderGainPointEventService;
    61	use Eccube\Service\TaxRuleService;
    62	use Knp\Component\Pager\Pagination\SlidingPagination;
    63	use Knp\Component\Pager\PaginatorInterface;
    64	use Symfony\Bridge\Twig\Attribute\Template;
    65	use Symfony\Component\Form\FormBuilderInterface;
    66	use Symfony\Component\Form\FormInterface;
    67	use Symfony\Component\HttpFoundation\JsonResponse;
    68	use Symfony\Component\HttpFoundation\RedirectResponse;
    69	use Symfony\Component\HttpFoundation\Request;
    70	use Symfony\Component\HttpFoundation\Response;
    71	use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
    72	use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
    73	use Symfony\Component\Routing\Attribute\Route;
    74	use Symfony\Component\Routing\RouterInterface;
    75	use Symfony\Component\Serializer\SerializerInterface;
    76	
    77	/**
    78	 * 管理画面の受注新規作成・編集、および編集画面用の顧客／商品検索・明細種別 Ajax を提供する.
    79	 *
    80	 * 受注の本処理（`index`）は GET/POST 同一アクションとし、表示準備・POST 時の検証・登録確定を private メソッドに分割.
    81	 */
    82	class EditController extends AbstractController
    83	{
    84	    private const TEMP_ORDER_ITEM_PROCESSOR_NAME = self::class.'::temporaryFinancialItems';
    85	
    86	    /**
    87	     * @param TaxRuleService                    $taxRuleService            税計算（他アクション・継承先で利用される場合あり）
    88	     * @param DeviceTypeRepository              $deviceTypeRepository      端末種別
    89	     * @param ProductRepository                 $productRepository       商品（検索等）
    90	     * @param CategoryRepository                $categoryRepository      カテゴリ（検索等）
    91	     * @param CustomerRepository                $customerRepository      会員（検索等）
    92	     * @param PurchaseFlow                      $orderPurchaseFlow       受注用 PurchaseFlow（検証・prepare/commit）
    93	     * @param OrderRepository                   $orderRepository         受注の取得・会員購入サマリ更新
    94	     * @param OrderNoProcessor                  $orderNoProcessor        受注番号採番
    95	     * @param OrderItemTypeRepository           $OrderItemTypeRepository 明細種別マスタ
    96	     * @param OrderStatusRepository             $orderStatusRepository   受注ステータスマスタ
    97	     * @param OrderStateMachine                 $orderStateMachine       受注ステータス遷移
    98	     * @param OrderHelper                       $orderHelper             受注ヘルパ（仮受注 ID・税表示タイプ等）
    99	     * @param DeliveryRepository                $deliveryRepository      編集画面用：配送業者・お届け時間
   100	     * @param MtbOptionRepository               $optionRepository        編集画面用：一覧閾値オプション等
   101	     * @param DtbWaitingNumberRepository        $waitingNumberRepository 編集画面用：店頭待ち番号
   102	     * @param SerializerInterface               $serializer              編集画面用：配送時間 JSON
   103	     * @param ProductClassRepository            $productClassRepository  編集画面用：商品規格サブ情報
   104	     * @param DtbShippingStandbyRepository       $dtbShippingStandbyRepository 編集画面用：納品書
   105	     * @param BaseInfoRepository                $baseInfoRepository      編集画面用：基本情報
   106	     */
   107	    public function __construct(
   108	        protected TaxRuleService $taxRuleService,
   109	        protected DeviceTypeRepository $deviceTypeRepository,
   110	        protected ProductRepository $productRepository,
   111	        protected CategoryRepository $categoryRepository,
   112	        protected CustomerRepository $customerRepository,
   113	        protected PurchaseFlow $orderPurchaseFlow,
   114	        protected OrderRepository $orderRepository,
   115	        protected OrderNoProcessor $orderNoProcessor,
   116	        protected OrderItemTypeRepository $OrderItemTypeRepository,
   117	        protected OrderStatusRepository $orderStatusRepository,
   118	        protected OrderStateMachine $orderStateMachine,
   119	        private readonly OrderHelper $orderHelper,
   120	        private readonly DeliveryRepository $deliveryRepository,
   121	        private readonly MtbOptionRepository $optionRepository,
   122	        private readonly DtbWaitingNumberRepository $waitingNumberRepository,
   123	        private readonly SerializerInterface $serializer,
   124	        private readonly ProductClassRepository $productClassRepository,
   125	        private readonly DtbShippingStandbyRepository $dtbShippingStandbyRepository,
   126	        private readonly BaseInfoRepository $baseInfoRepository,
   127	        private readonly PointService $pointService,
   128	        private readonly SmaregiApiService $smaregiApiService,
   129	        private readonly SmaregiOrderGainPointEventService $smaregiOrderGainPointEventService,
   130	    ) {
   131	    }
   132	
   133	    /**
   134	     * 受注登録/編集画面.
   135	     *
   136	     * POST かつ `mode=register` で確定保存し、成功時はリダイレクトする。検証エラー時は同画面を再表示.
   137	     *
   138	     * @param Request         $request リクエスト（フォーム入力・mode 判定）
   139	     * @param RouterInterface $router  `return_link` からのリダイレクト先解決に使用
   140	     * @param int|null        $id      受注 ID.(null のとき新規作成画面)
   141	     *
   142	     * @return RedirectResponse|array<string, mixed> 登録成功時は RedirectResponse、表示時は Twig へ渡す連想配列
   143	     *
   144	     * @throws NotFoundHttpException 指定 ID の受注が存在しない場合
   145	     */
   146	    #[Route(path: '/%eccube_admin_route%/order/new', name: 'admin_order_new', methods: ['GET', 'POST'])]
   147	    #[Route(path: '/%eccube_admin_route%/order/{id}/edit', name: 'admin_order_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
   148	    #[Template(template: '@admin/Order/edit.twig')]
   149	    public function index(Request $request, RouterInterface $router, ?int $id = null): RedirectResponse|array
   150	    {
   151	        $TargetOrder = $this->loadTargetOrderForEdit($id);
   152	        [$OriginOrder, $OriginItems] = $this->cloneOriginOrderAndItems($TargetOrder);
   153	
   154	        $builder = $this->formFactory->createBuilder(OrderType::class, $TargetOrder);
   155	        $this->dispatchOrderEditIndexInitialize($builder, $OriginOrder, $TargetOrder, $request);
   156	
   157	        $form = $builder->getForm();
   158	        $lineDisplay = $this->presetOrderItemRowsForDisplay($form);
   159	        $form->handleRequest($request);
   160	
   161	        $purchaseContext = new PurchaseContext($OriginOrder, $OriginOrder->getCustomer());
   162	        $this->ensureTaxDisplayTypesOnOrderItems($TargetOrder);
   163	
   164	        $redirect = $this->handleSubmittedOrderEdit(
   165	            $request,
   166	            $router,
   167	            $form,
   168	            $builder,
   169	            $TargetOrder,
   170	            $OriginOrder,
   171	            $OriginItems,
   172	            $purchaseContext
   173	        );
   174	        if ($redirect instanceof RedirectResponse) {
   175	            return $redirect;
   176	        }
   177	
   178	        [$searchCustomerModalForm, $searchProductModalForm] = $this->createSearchModalForms($request, $OriginOrder, $TargetOrder);
   179	        $viewContext = $this->buildAdminOrderEditViewContext($TargetOrder);
   180	

codex
Markdown参照自体は存在し、候補1の行番号は正確です。候補2もMarkdown行302としては正しい一方、設計は「購入処理上の例外」も別行で要求しているため、そこを実装確定処理と照合します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '620,725p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "rg -n \"status_change|OrderStatus|confirm\\(|cancelOrderPoints|gainPoints|failed_to_change_status|admin.order.cancel.complete\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app /home/y-saito/Developments/ec-cube-enterprise/templates 2>/dev/null" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '180,320p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   180	
   181	        return array_merge(
   182	            [
   183	                'form' => $form->createView(),
   184	                'searchCustomerModalForm' => $searchCustomerModalForm->createView(),
   185	                'searchProductModalForm' => $searchProductModalForm->createView(),
   186	                'Order' => $TargetOrder,
   187	                'id' => $id,
   188	                'arrQuantity' => $lineDisplay['arrQuantity'],
   189	                'arrStockout' => $lineDisplay['arrStockout'],
   190	                'arrDifferentPrice' => $lineDisplay['arrDifferentPrice'],
   191	            ],
   192	            $viewContext
   193	        );
   194	    }
   195	
   196	    /**
   197	     * 編集対象の {@see Order} を返す。新規の場合は空の受注と初期 Shipping・仮受注 ID を設定する.
   198	     *
   199	     * @param int|null $id 受注 ID。null なら新規
   200	     *
   201	     * @throws NotFoundHttpException 既存 ID が DB に存在しない場合
   202	     */
   203	    private function loadTargetOrderForEdit(?int $id): Order
   204	    {
   205	        if ($id === null) {
   206	            $TargetOrder = new Order();
   207	            $TargetOrder->setBaseInfo($this->getMember()->getBaseInfo());
   208	            $TargetOrder->addShipping((new Shipping())->setOrder($TargetOrder));
   209	            $TargetOrder->setPreOrderId($this->orderHelper->createPreOrderId());
   210	
   211	            return $TargetOrder;
   212	        }
   213	
   214	        $TargetOrder = $this->orderRepository->getOrderItemList($id);
   215	        if ($TargetOrder === null) {
   216	            throw new NotFoundHttpException();
   217	        }
   218	
   219	        return $TargetOrder;
   220	    }
   221	
   222	    /**
   223	     * 保存前比較用に、編集前の受注クローンと当時の明細エンティティ参照のコレクションを返す.
   224	     *
   225	     * @param Order $TargetOrder 編集対象の受注
   226	     *
   227	     * @return array{0: Order, 1: ArrayCollection<int, OrderItem>} [編集前受注クローン, 編集前の OrderItem 参照（削除判定用）]
   228	     */
   229	    private function cloneOriginOrderAndItems(Order $TargetOrder): array
   230	    {
   231	        $OriginOrder = clone $TargetOrder;
   232	        $OriginItems = new ArrayCollection();
   233	        foreach ($TargetOrder->getOrderItems() as $OrderItem) {
   234	            $OriginItems->add($OrderItem);
   235	        }
   236	
   237	        return [$OriginOrder, $OriginItems];
   238	    }
   239	
   240	    /**
   241	     * 受注フォーム組み立て直後の拡張ポイント。{@see EccubeEvents} `ADMIN_ORDER_EDIT_INDEX_INITIALIZE` を送出する.
   242	     *
   243	     * @param FormBuilderInterface $builder     `OrderType` のフォームビルダ
   244	     * @param Order                $OriginOrder 編集前スナップショット（クローン）
   245	     * @param Order                $TargetOrder 編集対象の受注
   246	     * @param Request              $request     リクエスト
   247	     */
   248	    private function dispatchOrderEditIndexInitialize(FormBuilderInterface $builder, Order $OriginOrder, Order $TargetOrder, Request $request): void
   249	    {
   250	        $event = new EventArgs(
   251	            [
   252	                'builder' => $builder,
   253	                'OriginOrder' => $OriginOrder,
   254	                'TargetOrder' => $TargetOrder,
   255	            ],
   256	            $request
   257	        );
   258	        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_INDEX_INITIALIZE);
   259	    }
   260	
   261	    /**
   262	     * 商品明細行のフォーム初期表示用データをセットし、Twig 用の数量・欠品・価格差異マップを組み立てる.
   263	     *
   264	     * @param FormInterface $form `OrderType` のフォーム（`OrderItems` サブフォームを持つ）
   265	     *
   266	     * @return array{arrQuantity: array<int, int>, arrStockout: array<int, int>, arrDifferentPrice: array<int, string>}
   267	     *               キーはいずれも product_class_id => 値
   268	     */
   269	    private function presetOrderItemRowsForDisplay(FormInterface $form): array
   270	    {
   271	        $arrQuantity = [];
   272	        $arrStockout = [];
   273	        $arrDifferentPrice = [];
   274	
   275	        foreach ($form->get('OrderItems') as $OrderItemForm) {
   276	            $OrderItem = $OrderItemForm->getData();
   277	            if (!$OrderItem instanceof OrderItem || !$OrderItem->isProduct()) {
   278	                continue;
   279	            }
   280	            $ProductClass = $OrderItem->getProductClass();
   281	            if ($ProductClass === null) {
   282	                continue;
   283	            }
   284	
   285	            $OrderItemForm->get('stockout')->setData($OrderItem->getStockout() ?? 0);
   286	            $classId = $ProductClass->getId();
   287	            if (null !== $classId) {
   288	                $arrQuantity[$classId] = (int) $OrderItem->getQuantity();
   289	                $arrStockout[$classId] = $OrderItem->getStockout() ?? 0;
   290	                if ($OrderItem->getPrice() !== $ProductClass->getPrice02()) {
   291	                    $arrDifferentPrice[$classId] = $OrderItem->getProductName();
   292	                }
   293	            }
   294	            $OrderItemForm->get('operator')->setData($OrderItem->getMember());
   295	            $DtbShelfNumber = $ProductClass->getShelfNumber();
   296	            if (null !== $DtbShelfNumber && $DtbShelfNumber->getName() !== '') {
   297	                $OrderItemForm->get('shelfNumber')->setData($DtbShelfNumber->getName());
   298	            }
   299	        }
   300	
   301	        return [
   302	            'arrQuantity' => $arrQuantity,
   303	            'arrStockout' => $arrStockout,
   304	            'arrDifferentPrice' => $arrDifferentPrice,
   305	        ];
   306	    }
   307	
   308	    /**
   309	     * 明細ごとに税表示タイプが未設定のとき、明細種別に応じたデフォルトを {@see OrderHelper::getTaxDisplayType} で補完する.
   310	     *
   311	     * @param Order $TargetOrder 編集対象の受注
   312	     */
   313	    private function ensureTaxDisplayTypesOnOrderItems(Order $TargetOrder): void
   314	    {
   315	        foreach ($TargetOrder->getOrderItems() as $OrderItem) {
   316	            if ($OrderItem->getTaxDisplayType() !== null) {
   317	                continue;
   318	            }
   319	            $orderItemType = $OrderItem->getOrderItemType();
   320	            if ($orderItemType === null) {

exec
/bin/bash -lc "rg -n \"wrapInTransaction|function wrapInTransaction|class EntityManager\" /home/y-saito/Developments/ec-cube-enterprise -g '*.php' | head -50" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 111ms:
   620	                    $statusChangedToDelivered = $NewOrderStatus->getId() === OrderStatus::DELIVERED;
   621	                    $statusChangedToCancel = $NewOrderStatus->getId() === OrderStatus::CANCEL;
   622	
   623	                    if ($statusChangedToDelivered) {
   624	                        $TargetOrder->getShippings()->map(function (Shipping $Shipping): void {
   625	                            if (!$Shipping->isShipped()) {
   626	                                $Shipping->setShippingDate(new \DateTime());
   627	                            }
   628	                        });
   629	                    }
   630	                    $isFirstCancellation = $statusChangedToCancel && $TargetOrder->getCancelDate() === null;
   631	                    if ($isFirstCancellation) {
   632	                        $TargetOrder->setCancelDate(new \DateTime());
   633	                    }
   634	                    $TargetOrder->setOrderStatus($OldOrderStatus);
   635	                    $this->orderStateMachine->apply($TargetOrder, $NewOrderStatus);
   636	                    if ($isFirstCancellation) {
   637	                        $this->pointService->cancelOrderPoints($TargetOrder);
   638	                    }
   639	                }
   640	
   641	                $now = new \DateTime();
   642	                if ($TargetOrder->getId() === null) {
   643	                    $TargetOrder->setCreateDate($now);
   644	                    $TargetOrder->setUpdateDate($now);
   645	
   646	                    foreach ($TargetOrder->getShippings() as $Shipping) {
   647	                        if ($Shipping->getId() === null) {
   648	                            $Shipping->setCreateDate($now);
   649	                            $Shipping->setUpdateDate($now);
   650	                        }
   651	                    }
   652	                } else {
   653	                    $TargetOrder->setUpdateDate($now);
   654	                }
   655	
   656	                $this->entityManager->persist($TargetOrder);
   657	                // IDENTITY の場合、新規受注は OrderNoProcessor が PK を参照するため同一トランザクション内で 1 回 flush が必要
   658	                if ($TargetOrder->getId() === null) {
   659	                    $this->entityManager->flush();
   660	                }
   661	
   662	                foreach ($OriginItems as $OrderItem) {
   663	                    if (!$TargetOrder->getOrderItems()->contains($OrderItem)) {
   664	                        $this->entityManager->remove($OrderItem);
   665	                    }
   666	                }
   667	
   668	                $this->orderNoProcessor->process($TargetOrder, $purchaseContext);
   669	
   670	                $Customer = $TargetOrder->getCustomer();
   671	                if ($Customer instanceof Customer) {
   672	                    $this->orderRepository->updateOrderSummary($Customer);
   673	                }
   674	                $this->applyOrderPointAndOperatorFromForm($TargetOrder, $OriginOrder, $form);
   675	
   676	                // 新たに出荷完了へ遷移した場合、確定後の発生ポイント（applyOrderPointAndOperatorFromForm 反映後の最終値）を
   677	                // 会員残高へ反映し、同一トランザクションでスマレジ連携ジョブを積む（dispatch は commit 後）.
   678	                if ($statusChangedToDelivered) {
   679	                    $this->pointService->gainPoints($TargetOrder);
   680	                    $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
   681	                }
   682	
   683	                if ($TargetOrder->getSmaregiCode()
   684	                    && $TargetOrder->getOrderStatus() !== null
   685	                    && $TargetOrder->getOrderStatus()->getId() !== OrderStatus::CANCEL) {
   686	                    $this->smaregiApiService->postSmaregiProcess($TargetOrder, ['product']);
   687	                }
   688	                // wrapInTransaction が成功時に最終 flush + DB commit する（失敗時は rollback）
   689	            });
   690	        } catch (PurchaseException $e) {
   691	            $this->addError($e->getMessage(), 'admin');
   692	
   693	            return null;
   694	        } catch (ShoppingException $e) {
   695	            $this->addError($e->getMessage(), 'admin');
   696	
   697	            return null;
   698	        } catch (\InvalidArgumentException $e) {
   699	            log_error('受注ステータス遷移に失敗しました', ['exception' => $e]);
   700	            $old = $OriginOrder->getOrderStatus();
   701	            $new = $TargetOrder->getOrderStatus();
   702	            $this->addError(trans('admin.order.failed_to_change_status__short', [
   703	                '%from%' => $old?->getName() ?? '-',
   704	                '%to%' => $new?->getName() ?? '-',
   705	            ]), 'admin');
   706	
   707	            return null;
   708	        }
   709	
   710	        // 受注確定の commit 成功後に発生ポイント連携メッセージを送信する（アウトボックス的な順序）。
   711	        if ($gainPointJob !== null) {
   712	            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
   713	        }
   714	
   715	        $Customer = $TargetOrder->getCustomer();
   716	
   717	        $event = new EventArgs(
   718	            [
   719	                'form' => $form,
   720	                'OriginOrder' => $OriginOrder,
   721	                'TargetOrder' => $TargetOrder,
   722	                'Customer' => $Customer,
   723	            ],
   724	            $request
   725	        );

 exited 2 in 147ms:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:275:            - '@Eccube\Repository\Master\OrderStatusRepository'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:23:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:79:        $otcBuyOrders = $this->dtbOtcBuyOrderRepository->getOtcBuyOrdersByShopIdAndStatus($shopId, MtbOtcBuyOrderStatus::ASSESSMENT_UNCOMPLETED_STATUSES);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:100:                'otcOrderStatusId' => $otcBuyOrder['otcOrderStatusId'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:105:                'orderStatusName' => $otcBuyOrder['otcOrderStatusName'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:204:        $Status = $this->entityManager->find(MtbOtcBuyOrderStatus::class, $statusId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:205:        if (!$Status instanceof MtbOtcBuyOrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/doctrine.yaml:79:                        class: Eccube\Doctrine\Filter\OrderStatusFilter
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/doctrine.yaml:117:                        class: Eccube\Doctrine\Filter\OrderStatusFilter
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/doctrine.yaml:155:                        class: Eccube\Doctrine\Filter\OrderStatusFilter
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:35:use Eccube\Repository\DtbBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:38:use Eccube\Repository\Master\MtbBuyOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:92:        protected DtbBuyOrderStatusHistoryRepository $buyOrderStatusHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:94:        protected MtbBuyOrderStatusRepository $buyOrderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:222:            'original_buy_order_status_id' => $BuyOrder->getBuyOrderStatus()->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:376:        $originalBuyOrderStatusId = $BuyOrder->getBuyOrderStatus()->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:380:            'original_buy_order_status_id' => $originalBuyOrderStatusId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:432:                originalBuyOrderStatusId: $originalBuyOrderStatusId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:472:            'StatusHistories' => $this->buyOrderStatusHistoryRepository->findBy(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:476:            'statusList' => $this->buyOrderStatusRepository->getAllStatusName(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:21:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:30:use Eccube\Repository\Master\MtbBuyOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:49:        private readonly MtbBuyOrderStatusRepository $buyOrderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:76:                'netOrderStatusId' => (string) $buyOrder['buyOrderStatusId'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:140:        $BuyOrderStatus = $this->buyOrderStatusRepository->find((int) $statusId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:141:        if (!$BuyOrderStatus instanceof MtbBuyOrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:152:            $input = new UpdateStatusInput($BuyOrder, $Member, $BuyOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:183:        $BuyOrderStatus = $this->buyOrderStatusRepository->find($updateBuyOrderDto->orderStatusId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:184:        if (!$BuyOrderStatus instanceof MtbBuyOrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:192:                $BuyOrderStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:23:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:34:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:55:    private array $excludes = [OrderStatus::CANCEL, OrderStatus::PENDING, OrderStatus::PROCESSING, OrderStatus::RETURNED];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:60:    public function __construct(protected AuthorizationCheckerInterface $authorizationChecker, protected AuthenticationUtils $helper, protected MemberRepository $memberRepository, protected UserPasswordHasherInterface $passwordHasher, protected OrderRepository $orderRepository, protected OrderStatusRepository $orderStatusRepository, protected CustomerRepository $customerRepository, protected ProductRepository $productRepository, protected PluginApiService $pluginApiService)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:115:        $excludes[] = OrderStatus::CANCEL;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:116:        $excludes[] = OrderStatus::DELIVERED;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:117:        $excludes[] = OrderStatus::PENDING;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:118:        $excludes[] = OrderStatus::PROCESSING;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:119:        $excludes[] = OrderStatus::RETURNED;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:138:        $OrderStatuses = $this->orderStatusRepository->matching($Criteria);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:174:                'OrderStatuses' => $OrderStatuses,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:195:            'OrderStatuses' => $OrderStatuses,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:386:            ->andWhere('o.OrderStatus NOT IN (:excludes)');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:423:            ->andWhere('o.OrderStatus NOT IN (:excludes)');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:494:            ->andWhere('o.OrderStatus NOT IN (:excludes)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:23:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:40:        OrderStatus::NEW,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:41:        OrderStatus::PAY_WAIT,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:42:        // OrderStatus::ORDER_BACK_ORDER,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:43:        OrderStatus::PAID,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:44:        OrderStatus::PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:45:        OrderStatus::PRE_DELIV,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:46:        OrderStatus::PICKING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:17:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:118:        $randomOrderStatus = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:119:            OrderStatus::NEW,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:120:            OrderStatus::CANCEL,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:121:            OrderStatus::IN_PROGRESS,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:122:            OrderStatus::DELIVERED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:123:            OrderStatus::PAID,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:124:            OrderStatus::PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:125:            OrderStatus::PROCESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:126:            OrderStatus::RETURNED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:144:                $Status = $this->entityManager->find(OrderStatus::class, $faker->randomElement($randomOrderStatus));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:145:                $Order->setOrderStatus($Status);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:28:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:39:    public const CANCEL_STATUS_ID = MtbOtcBuyOrderStatus::STATUS_CANCEL;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:72:            ->join('obo.OtcBuyOrderStatus', 'obos')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:91:        if (!empty($searchData->otcBuyOrderStatus)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:92:            $qb->andWhere('obos.id = :otcBuyOrderStatus')->setParameter(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:93:                'otcBuyOrderStatus',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:94:                $searchData->otcBuyOrderStatus->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:98:            $qb->andWhere('obos.id != :otcBuyOrderStatusCancel')->setParameter(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:99:                'otcBuyOrderStatusCancel',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:720:    // public function updateOtcBuyOrderStatusInExport(Application $app, array $otcBuyOrderIds): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:724:    //         'statusId' => MtbOtcBuyOrderStatus::STATUS_INPUT,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:757:            ->set('o.OtcBuyOrderStatus', ':next')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:759:            ->andWhere('o.OtcBuyOrderStatus = :pending')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:760:            ->setParameter('next', MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:762:            ->setParameter('pending', MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:777:                'obo.OtcBuyOrderStatus',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:785:                MtbOtcBuyOrderStatus::STATUS_DOUBLE_CHECKED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:803:            ->join('obo.OtcBuyOrderStatus', 'status')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:830:        $statusIds = implode(',', MtbOtcBuyOrderStatus::SUMMARY_STATUSES);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:995:     * @return array<int, array{id: int, assessmentId: string, applyDate: ?\DateTime, freeComment: ?string, memberName: ?string, otcOrderStatusId: int, returnSupply: ?string, callFlg: bool, adultFlg: bool, playingFlg: bool, otcOrderStatusName: string, identificationId: ?int, qualifiedInvoiceIssuerFlg: bool, qualifiedInvoiceIssuerConfirmationFlg: bool, qualifiedInvoiceIssuerCode: ?string, firstName: string, lastName: string, birth: ?\DateTime, telNo: string, zipcode: string, jobName: ?string, countryId: ?int, countryName: ?string, prefName: ?string, addr01: string, addr02: string, addr03: ?string}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1006:            ->join('otcBuyOrder.OtcBuyOrderStatus', 'otcBuyOrderStatus', Join::WITH, 'otcBuyOrderStatus.id IN (:statusIds)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1029:                'otcBuyOrderStatus.id as otcOrderStatusId',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1040:                'otcBuyOrderStatus.name as otcOrderStatusName',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1048:            ->andWhere('otcBuyOrderStatus.id IN (:statusIds)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:24:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:42:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:93:        protected OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:277:            'OrderStatuses' => $this->orderStatusRepository->findBy([], ['sort_no' => 'ASC']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:322:                $this->orderRepository->updateOrderSummary($Customer, OrderStatus::RECALC_TARGETS_ON_ORDER_DELETE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:473:    public function updateOrderStatus(Request $request, Shipping $Shipping): JsonResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:480:        $OrderStatus = $this->entityManager->find(OrderStatus::class, $request->get('order_status'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:482:        if (!$OrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:488:            if ($Order->getOrderStatus()->getId() == $OrderStatus->getId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:492:                if ($this->orderStateMachine->can($Order, $OrderStatus)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:493:                    if ($OrderStatus->getId() == OrderStatus::DELIVERED) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:505:                            $this->orderStateMachine->apply($Order, $OrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:508:                        $this->orderStateMachine->apply($Order, $OrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:519:                    if ($OrderStatus->getId() == OrderStatus::IN_PROGRESS || $OrderStatus->getId() == OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:542:                    $from = $Order->getOrderStatus()->getName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:543:                    $to = $OrderStatus->getName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:544:                    $result = ['message' => trans('admin.order.failed_to_change_status', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:898:            if ($Order['status'] === OrderStatus::NEW) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:20:use Eccube\Entity\DtbOtcBuyOrderStatusHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:24: * @extends AbstractRepository<DtbOtcBuyOrderStatusHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:26:class DtbOtcBuyOrderStatusHistoryRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:30:        parent::__construct($registry, DtbOtcBuyOrderStatusHistory::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:34:     * insert otcBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:36:    public function insertOtcBuyOrderStatusHistory(DtbOtcBuyOrder $dtbOtcBuyOrder, int $statusIds, ?Member $member = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:40:            $dtbOtcBuyOrderStatusHistory = new DtbOtcBuyOrderStatusHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:41:            $dtbOtcBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:43:                ->setOtcBuyOrderStatusId($statusId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:48:            $this->getEntityManager()->persist($dtbOtcBuyOrderStatusHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:55:    public function getTargetStatusLatestDate(int $otcBuyOrderId, int $otcBuyOrderStatusId): ?DtbOtcBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:59:            ->andWhere($qb->expr()->eq('obosh.otcBuyOrderStatusId', ':otcBuyOrderStatusId'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStatusHistoryRepository.php:61:            ->setParameter('otcBuyOrderStatusId', $otcBuyOrderStatusId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:25:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:33:    public const CANCEL_STATUS_ID = MtbOtcBuyOrderStatus::STATUS_CANCEL;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:94:            ->join('obo.OtcBuyOrderStatus', 'obosStatus')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:162:            $searchData->otcBuyOrderStatus !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:163:            && !$searchData->otcBuyOrderStatus->isEmpty()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:166:                $qb->expr()->in('obo.OtcBuyOrderStatus', ':otcBuyOrderStatus'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:168:                'otcBuyOrderStatus',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:169:                $searchData->otcBuyOrderStatus->getValues(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:22:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:30:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:67:        private readonly OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:141:        $newStatus = $this->orderStatusRepository->find(OrderStatus::NEW);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:142:        if (!$newStatus instanceof OrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:143:            $io->error('OrderStatus NEW が見つかりません。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:194:    private function buildOrder(BaseInfo $baseInfo, OrderStatus $newStatus, string $price, \DateTime $orderDate): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockRepository.php:56:            ->join('obo.OtcBuyOrderStatus', 'obos')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:17:use Eccube\Form\Type\Admin\OrderStatusSettingType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:18:use Eccube\Repository\Master\CustomerOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:19:use Eccube\Repository\Master\OrderStatusColorRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:20:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:27:class OrderStatusController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:29:    public function __construct(protected OrderStatusRepository $orderStatusRepository, protected OrderStatusColorRepository $orderStatusColorRepository, protected CustomerOrderStatusRepository $customerOrderStatusRepository)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:42:        $OrderStatuses = $this->orderStatusRepository->findBy([], ['sort_no' => 'ASC']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:46:                'OrderStatuses',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:49:                    'entry_type' => OrderStatusSettingType::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:50:                    'data' => $OrderStatuses,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:57:            foreach ($form['OrderStatuses'] as $child) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:58:                $OrderStatus = $child->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:59:                $this->entityManager->persist($OrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:61:                $CustomerOrderStatus = $this->customerOrderStatusRepository->find($OrderStatus->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:62:                if (null !== $CustomerOrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:63:                    $CustomerOrderStatus->setName($child['customer_order_status_name']->getData());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:64:                    $this->entityManager->persist($CustomerOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:67:                $OrderStatusColor = $this->orderStatusColorRepository->find($OrderStatus->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:68:                if (null !== $OrderStatusColor) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:69:                    $OrderStatusColor->setName($child['color']->getData());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:70:                    $this->entityManager->persist($OrderStatusColor);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:25:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:47:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:96:     * @param OrderStatusRepository             $orderStatusRepository   受注ステータスマスタ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:117:        protected OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:503:        if ($request->get('mode') === 'status_change') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:504:            return $this->tryCommitOrderStatusChange($TargetOrder, $OriginOrder, $form);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:615:                $OldOrderStatus = $OriginOrder->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:616:                $NewOrderStatus = $TargetOrder->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:619:                if ($TargetOrder->getId() && $OldOrderStatus->getId() !== $NewOrderStatus->getId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:620:                    $statusChangedToDelivered = $NewOrderStatus->getId() === OrderStatus::DELIVERED;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:621:                    $statusChangedToCancel = $NewOrderStatus->getId() === OrderStatus::CANCEL;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:634:                    $TargetOrder->setOrderStatus($OldOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:635:                    $this->orderStateMachine->apply($TargetOrder, $NewOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:637:                        $this->pointService->cancelOrderPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:679:                    $this->pointService->gainPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:684:                    && $TargetOrder->getOrderStatus() !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:685:                    && $TargetOrder->getOrderStatus()->getId() !== OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:700:            $old = $OriginOrder->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:701:            $new = $TargetOrder->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:702:            $this->addError(trans('admin.order.failed_to_change_status__short', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:728:        $newStatusId = $TargetOrder->getOrderStatus()?->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:730:        if ($newStatusId === OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:731:            $this->addSuccess('admin.order.cancel.complete', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:759:    private function tryCommitOrderStatusChange(Order $TargetOrder, Order $OriginOrder, FormInterface $form): RedirectResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:761:        $prevStatusId = $OriginOrder->getOrderStatus()?->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:762:        $newStatusId = $TargetOrder->getOrderStatus()?->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:773:        $statusChangedToDelivered = $newStatusId === OrderStatus::DELIVERED && $prevStatusId !== OrderStatus::DELIVERED;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:781:        $isFirstCancellation = $newStatusId === OrderStatus::CANCEL && $prevStatusId !== OrderStatus::CANCEL && $TargetOrder->getCancelDate() === null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:785:        if ($newStatusId === OrderStatus::PAID && $prevStatusId !== OrderStatus::PAID && $TargetOrder->getPaymentDate() === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:788:        if ($newStatusId === OrderStatus::PICKING && $prevStatusId !== OrderStatus::PICKING && $TargetOrder->getConfirmDate() === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:792:        $OldOrderStatus = $OriginOrder->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:793:        $NewOrderStatus = $TargetOrder->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:794:        if ($OldOrderStatus !== null && $NewOrderStatus !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:795:            $TargetOrder->setOrderStatus($OldOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:799:        $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $statusChangedToDelivered, $isFirstCancellation, $OldOrderStatus, $NewOrderStatus, &$gainPointJob): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:800:            if ($OldOrderStatus !== null && $NewOrderStatus !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:801:                $this->orderStateMachine->apply($TargetOrder, $NewOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:811:                $this->pointService->gainPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:816:                $this->pointService->cancelOrderPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:820:                && $TargetOrder->getOrderStatus() !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:821:                && $TargetOrder->getOrderStatus()->getId() !== OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:831:        if ($newStatusId === OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:832:            $this->addSuccess('admin.order.cancel.complete', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:956:        if ($TargetOrder->getOrderStatus()?->getId() === OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStatusHistoryRepository.php:20:use Eccube\Entity\DtbBuyOrderStatusHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStatusHistoryRepository.php:23: * @extends AbstractRepository<DtbBuyOrderStatusHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStatusHistoryRepository.php:25:class DtbBuyOrderStatusHistoryRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStatusHistoryRepository.php:29:        parent::__construct($registry, DtbBuyOrderStatusHistory::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStatusHistoryRepository.php:35:    public function hasBuyOrderStatusHistory(DtbBuyOrder $BuyOrder, int $buyOrderStatusId): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStatusHistoryRepository.php:40:            ->andWhere('IDENTITY(h.BuyOrderStatus) = :statusId')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStatusHistoryRepository.php:42:            ->setParameter('statusId', $buyOrderStatusId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:18:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:166:            $OrderStatus = $this->entityManager->find(OrderStatus::class, OrderStatus::DELIVERED);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:168:                if ($this->orderStateMachine->can($Order, $OrderStatus)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:169:                    $this->orderStateMachine->apply($Order, $OrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:171:                    $currentOrderStatus = $Order->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:172:                    if ($currentOrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:173:                        $from = $currentOrderStatus->getName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:174:                        $to = $OrderStatus->getName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:175:                        $errors[] = trans('admin.order.failed_to_change_status', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:30:use Eccube\Entity\DtbBuyOrderStatusHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:32:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:84:            ->join('b.BuyOrderStatus', 'bos');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:87:        $BuyOrderStatuses = $searchData['buy_order_status'] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:88:        if ($BuyOrderStatuses instanceof ArrayCollection) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:89:            $BuyOrderStatuses = $BuyOrderStatuses->toArray();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:91:        if ($BuyOrderStatuses !== []) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:92:            $qb->andWhere('b.BuyOrderStatus IN (:BuyOrderStatuses)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:93:            ->setParameter('BuyOrderStatuses', $BuyOrderStatuses);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:97:        foreach (MtbBuyOrderStatus::BUY_ORDER_STATUS as $buyOrderStatusId => $buyOrderStatusName) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:99:            $dateFromStatus = $buyOrderStatusName.self::DATE_FROM;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:100:            $dateToStatus = $buyOrderStatusName.self::DATE_TO;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:106:            $periodQueryArr[] = $qb->expr()->eq('b', "bh{$buyOrderStatusId}.BuyOrder");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:107:            $periodQueryArr[] = $qb->expr()->eq("IDENTITY(bh{$buyOrderStatusId}.BuyOrderStatus)", $buyOrderStatusId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:112:                $periodQueryArr[] = $qb->expr()->gte("bh{$buyOrderStatusId}.createDate", ":from{$buyOrderStatusId}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:113:                $qb->setParameter("from{$buyOrderStatusId}", $fromDate);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:119:                $periodQueryArr[] = $qb->expr()->lt("bh{$buyOrderStatusId}.createDate", ":to{$buyOrderStatusId}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:120:                $qb->setParameter("to{$buyOrderStatusId}", $toDate);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:122:            $qb->join(DtbBuyOrderStatusHistory::class, "bh{$buyOrderStatusId}", Join::WITH, new Andx($periodQueryArr));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:283:     * @return array<int, array{id: int, orderDate: \DateTime, firstName: string, lastName: string, telNo: ?string, zipcode: string, memo: ?string, memberName: ?string, buyOrderStatusId: int, prefName: ?string, addr01: string, addr02: string}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:288:            MtbBuyOrderStatus::PRODUCT_ARRIVAL,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:289:            MtbBuyOrderStatus::ASSESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:290:            MtbBuyOrderStatus::PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:291:            MtbBuyOrderStatus::RESUMPTION,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:306:                'IDENTITY(buyOrder.BuyOrderStatus) AS buyOrderStatusId',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:311:            ->where('IDENTITY(buyOrder.BuyOrderStatus) IN (:targetStatusIds)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:325:            ->innerJoin('bo.BuyOrderStatus', 'bos')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:683:                'cancelledStatusId' => MtbBuyOrderStatus::CANCELED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:707:    //             ->join('bo.buyOrderStatus', 'bos')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:742:     * DB レベルで WHERE BuyOrderStatus = WAITING_FOR_STOCK の条件付き UPDATE を行う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:751:            ->set('b.BuyOrderStatus', ':next')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:753:            ->andWhere('b.BuyOrderStatus = :waiting')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:754:            ->setParameter('next', MtbBuyOrderStatus::STOCKING_COMPLETE)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:756:            ->setParameter('waiting', MtbBuyOrderStatus::WAITING_FOR_STOCK)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:871:                'cancel_status_id' => MtbBuyOrderStatus::CANCELED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php:23:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php:42:    public function __construct(protected CustomerRepository $customerRepository, protected PaymentRepository $paymentRepository, protected SexRepository $sexRepository, protected OrderStatusRepository $orderStatusRepository, protected PageMaxRepository $pageMaxRepository, protected ProductStatusRepository $productStatusRepository, protected ProductStockRepository $productStockRepository, protected OrderRepository $orderRepository, protected ValidatorInterface $validator, protected DtbSearchPatternRepository $dtbSearchPatternRepository)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php:125:            'OrderStatuses' => $this->orderStatusRepository->findBy([], ['sort_no' => 'ASC']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:20:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:37:        protected OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:314:                    $this->pointService->gainPoints($updateOrder['order']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:24:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:71:            ->join('bo.BuyOrderStatus', 'boStatus');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:112:            $searchData->buyOrderStatus !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:113:            && !$searchData->buyOrderStatus->isEmpty()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:116:                $qb->expr()->in('bo.BuyOrderStatus', ':buyOrderStatus'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:118:                'buyOrderStatus',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:119:                $searchData->buyOrderStatus->getValues(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:124:        $qb->setParameter('tcStatus', MtbBuyOrderStatus::TRANSFER_COMPLETE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:127:                '(SELECT MAX(%s.createDate) FROM Eccube\Entity\DtbBuyOrderStatusHistory %s WHERE %s.BuyOrder = bo AND %s.BuyOrderStatus = :tcStatus)',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:230:        $existsQuery = '(SELECT 1 FROM Eccube\Entity\DtbBuyOrderStatusHistory bosh_tc_null WHERE bosh_tc_null.BuyOrder = bo AND bosh_tc_null.BuyOrderStatus = :tcStatus)';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:246:        foreach ($order->getBuyOrderStatusHistories() as $history) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:247:            if ($history->getBuyOrderStatus()->getId() === MtbBuyOrderStatus::TRANSFER_COMPLETE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:308:        $qb->setParameter('tcStatus', MtbBuyOrderStatus::TRANSFER_COMPLETE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:309:        $tcSubQuery = '(SELECT MAX(bosh_tc_sort.createDate) FROM Eccube\Entity\DtbBuyOrderStatusHistory bosh_tc_sort WHERE bosh_tc_sort.BuyOrder = bo AND bosh_tc_sort.BuyOrderStatus = :tcStatus)';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:311:        $existsQuery = '(SELECT 1 FROM Eccube\Entity\DtbBuyOrderStatusHistory bosh_tc_null WHERE bosh_tc_null.BuyOrder = bo AND bosh_tc_null.BuyOrderStatus = :tcStatus)';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:24:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:28:use Eccube\Form\Type\Admin\OtcBuyOrder\OtcBuyOrderStatusType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:33:use Eccube\Repository\DtbOtcBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:35:use Eccube\Repository\Master\MtbOtcBuyOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:67:        protected DtbOtcBuyOrderStatusHistoryRepository $otcBuyOrderStatusHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:68:        protected MtbOtcBuyOrderStatusRepository $otcBuyOrderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:246:        $StatusHistories = $this->otcBuyOrderStatusHistoryRepository->findBy(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:253:        foreach ($this->otcBuyOrderStatusRepository->findAll() as $Status) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:310:        $form = $this->createForm(OtcBuyOrderStatusType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:345:        $form = $this->createForm(OtcBuyOrderStatusType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:420:        $NextStatus = $this->otcBuyOrderStatusRepository->find(MtbOtcBuyOrderStatus::STATUS_COMPLETE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:422:        if ($OtcBuyOrder->getOtcBuyOrderStatus()->getId() !== MtbOtcBuyOrderStatus::STATUS_ACCOUNTING_PAYMENT_PENDING) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:479:        $NextStatus = $this->otcBuyOrderStatusRepository->find(MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:16:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:24:class OrderStatusType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:27:     * OrderStatusType constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:41:        /** @var OrderStatus[] $OrderStatuses */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:42:        $OrderStatuses = $options['choice_loader']->loadChoiceList()->getChoices();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:43:        foreach ($OrderStatuses as $OrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:44:            $id = $OrderStatus->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:45:            if ($OrderStatus->isDisplayOrderCount()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:46:                $count = $this->orderRepository->countByOrderStatus($id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/OrderStatusType.php:63:            'class' => OrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php:19:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php:23: * OrderStatusRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php:28: * @extends AbstractRepository<OrderStatus>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php:30:class OrderStatusRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php:33:     * OrderStatusRepository constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php:37:        parent::__construct($registry, OrderStatus::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php:50:     * @return list<OrderStatus>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php:92:            ->createQuery('SELECT os FROM Eccube\Entity\Master\OrderStatus os INDEX BY os.id ORDER BY os.sort_no ASC')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php:18:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php:35:        #[Assert\Choice(choices: MtbOtcBuyOrderStatus::ASSESSMENT_COMPLETED_STATUSES, message: 'order_status is invalid')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/CustomerOrderStatusRepository.php:17:use Eccube\Entity\Master\CustomerOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/CustomerOrderStatusRepository.php:21: * CustomerOrderStatusRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/CustomerOrderStatusRepository.php:26: * @extends AbstractRepository<CustomerOrderStatus>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/CustomerOrderStatusRepository.php:28:class CustomerOrderStatusRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/CustomerOrderStatusRepository.php:32:        parent::__construct($registry, CustomerOrderStatus::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:111:        if (confirm('{{ 'front.cart.delete_all_item_confirm'|trans }}')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbBuyOrderStatusRepository.php:19:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbBuyOrderStatusRepository.php:23: * @extends AbstractRepository<MtbBuyOrderStatus>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbBuyOrderStatusRepository.php:25:class MtbBuyOrderStatusRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbBuyOrderStatusRepository.php:29:        parent::__construct($registry, MtbBuyOrderStatus::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:93:                $response = $this->smaregiCustomerService->gainPoints($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:95:                // gainPoints は通常例外を投げないが、想定外例外は適用有無が不明なため自動リトライせず手動照合へ回す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:254:    public function confirm(Request $request): RedirectResponse|array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:28:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:38:use Eccube\Repository\DtbOtcBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:84:    protected DtbOtcBuyOrderStatusHistoryRepository $otcBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:99:        DtbOtcBuyOrderStatusHistoryRepository $otcBuyOrderStatusHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:113:        $this->otcBuyOrderStatusHistoryRepository = $otcBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:290:    public function confirm(Request $request, string $name): Response|RedirectResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:386:        $otcBuyOrder->setOtcBuyOrderStatus(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:387:            $this->entityManager->getReference(MtbOtcBuyOrderStatus::class, MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PENDING)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:432:        $this->otcBuyOrderStatusHistoryRepository->insertOtcBuyOrderStatusHistory($otcBuyOrder, MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PENDING);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:17:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:19:use Eccube\Repository\Master\CustomerOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:20:use Eccube\Repository\Master\OrderStatusColorRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:30:class OrderStatusSettingType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:32:    public function __construct(protected EccubeConfig $eccubeConfig, protected OrderStatusColorRepository $orderStatusColorRepository, protected CustomerOrderStatusRepository $customerOrderStatusRepository)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:80:            $OrderStatusColor = $this->orderStatusColorRepository->find($data->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:81:            if (null !== $OrderStatusColor) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:82:                $form->get('color')->setData($OrderStatusColor->getName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:84:            $CustomerOrderStatus = $this->customerOrderStatusRepository->find($data->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:85:            if (null !== $CustomerOrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:86:                $form->get('customer_order_status_name')->setData($CustomerOrderStatus->getName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:98:            'data_class' => OrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:96:     * `confirm()` から内部呼び出しで {@see checkout()} に渡すフラグ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:291:    public function confirm(Request $request): RedirectResponse|Response|array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:396:     * `confirm()` から内部呼び出される場合と、確認画面 `Shopping/confirm.twig` から POST される場合の両方がある。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:20:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:70:                OrderStatus::PICKED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:78:                    OrderStatus::DELIVERED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:19:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:40:        MtbBuyOrderStatus::TRANSFER_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:41:        MtbBuyOrderStatus::UNREGISTERED_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:42:        MtbBuyOrderStatus::WAITING_FOR_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:43:        MtbBuyOrderStatus::STOCKING_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:73:                'class' => MtbBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:21:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:111:            ->add('BuyOrderStatus', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:112:                'class' => MtbBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:332:     * 実在庫の増減は {@see MtbBuyOrderStatus::BUY_ORDER_STOCK_EDITABLE_STATUS_IDS} に含まれる買取状況のときのみ許可する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:348:        if ($data->getBuyOrderStatus()->isBuyOrderStockEditable()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:375:        $BuyOrderStatus = $data->getBuyOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:376:        if ($BuyOrderStatus->getId() !== MtbBuyOrderStatus::TRANSFER_REQUESTED) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:382:            $form->get('BuyOrderStatus')->addError(new FormError(trans('admin.purchase.online.detail.error_identification_required', [], 'validators')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:396:            $form->get('BuyOrderStatus')->addError(new FormError(trans('admin.purchase.online.detail.error_player_not_found', [], 'validators')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:402:            $form->get('BuyOrderStatus')->addError(new FormError(trans('admin.purchase.online.detail.error_identity_unconfirmed', [], 'validators')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:413:        if ($originalStatusId === null || $originalStatusId !== MtbBuyOrderStatus::STOCKING_COMPLETE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:422:        $BuyOrderStatus = $data->getBuyOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:423:        if ($BuyOrderStatus->getId() === MtbBuyOrderStatus::STOCKING_COMPLETE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:427:        $form->get('BuyOrderStatus')->addError(new FormError(trans('admin.purchase.online.detail.error_stocking_complete_status_immutable', [], 'validators')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:20:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:47:        MtbBuyOrderStatus::ORDERED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:48:        MtbBuyOrderStatus::PRODUCT_ARRIVAL,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:49:        MtbBuyOrderStatus::ASSESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:50:        MtbBuyOrderStatus::APPRAISAL_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:51:        MtbBuyOrderStatus::COMMUNICATED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:52:        MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:53:        MtbBuyOrderStatus::TRANSFER_REQUESTED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:54:        MtbBuyOrderStatus::TRANSFER_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:55:        MtbBuyOrderStatus::STOCKING_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:56:        MtbBuyOrderStatus::CANCELED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:83:            'class' => MtbBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:91:            $buyOrderStatusName = MtbBuyOrderStatus::BUY_ORDER_STATUS[$statusId];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:94:                $buyOrderStatusName.DtbBuyOrderRepository::DATE_FROM,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:95:                $buyOrderStatusName.DtbBuyOrderRepository::DATE_TO,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:106:                    $statusId === MtbBuyOrderStatus::ORDERED
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:107:                    && $dateColumn === $buyOrderStatusName.DtbBuyOrderRepository::DATE_FROM
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Event/EventEntryController.php:93:    public function confirm(Request $request): Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:557:    public function gainPoints(Order $Order): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MasterdataType.php:19:use Eccube\Entity\Master\CustomerOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MasterdataType.php:21:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MasterdataType.php:22:use Eccube\Entity\Master\OrderStatusColor;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MasterdataType.php:58:            // OrderStatus/OrderStatusColor/CustomerOrderStatus/MtbColorSequence/Contry は対象外
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MasterdataType.php:59:            if (in_array($meta->getName(), [OrderStatus::class, OrderStatusColor::class, CustomerOrderStatus::class, MtbColorSequence::class, Country::class], true)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php:21:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php:142:        if ($buyOrder->getBuyOrderStatus()->getId() !== MtbBuyOrderStatus::COMMUNICATED) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:23:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:29:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:51:        private OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:172:        $orderStatus = $this->orderStatusRepository->find(OrderStatus::PASSED);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:173:        if (!$orderStatus instanceof OrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:174:            throw new \RuntimeException('OrderStatus PASSED is not found.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:118:            $this->pointService->gainPoints($order, $transactionId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:20:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:23:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:44:        private OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:92:        if ($Order->getOrderStatus()?->getId() === OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:103:        $CancelStatus = $this->orderStatusRepository->find(OrderStatus::CANCEL);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:104:        if (!$CancelStatus instanceof OrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:105:            throw new \RuntimeException('OrderStatus CANCEL is not found.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:109:        $Order->setOrderStatus($CancelStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusColorRepository.php:17:use Eccube\Entity\Master\OrderStatusColor;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusColorRepository.php:21: * OrderStatusColorRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusColorRepository.php:26: * @extends AbstractRepository<OrderStatusColor>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusColorRepository.php:28:class OrderStatusColorRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusColorRepository.php:32:        parent::__construct($registry, OrderStatusColor::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbOtcBuyOrderStatusRepository.php:19:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbOtcBuyOrderStatusRepository.php:23: * @extends AbstractRepository<MtbOtcBuyOrderStatus>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbOtcBuyOrderStatusRepository.php:25:class MtbOtcBuyOrderStatusRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbOtcBuyOrderStatusRepository.php:29:        parent::__construct($registry, MtbOtcBuyOrderStatus::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:29:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:429:        $cancelStatus = OrderStatus::CANCEL;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberRepository.php:47:            ->join(Order::class, 'o', 'WITH', 'wn.orderId = o.id AND o.OrderStatus = :statusId')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:33:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:453:                ->andWhere($qb->expr()->notIn('o.OrderStatus', ':order_status'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:455:                ->setParameter('order_status', [OrderStatus::PROCESSING, OrderStatus::PENDING]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:21:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:32:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:54:    public function __construct(protected EntityManagerInterface $entityManager, protected EccubeConfig $eccubeConfig, protected OrderStateMachine $orderStateMachine, protected OrderStatusRepository $orderStatusRepository)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:327:        $builder->addEventListener(FormEvents::POST_SET_DATA, $this->addOrderStatusForm(...));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:330:        $builder->addEventListener(FormEvents::POST_SUBMIT, $this->validateOrderStatus(...));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:405:    public function addOrderStatusForm(FormEvent $event): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:413:        /** @var OrderStatus[] $OrderStatuses */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:414:        $OrderStatuses = $this->orderStatusRepository->findBy([], ['sort_no' => 'ASC']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:415:        $OrderStatuses = new ArrayCollection($OrderStatuses);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:417:        foreach ($OrderStatuses as $Status) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:419:            if ($Order->getOrderStatus()->getId() == $Status->getId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:424:                $OrderStatuses->removeElement($Status);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:429:        $form->add('OrderStatus', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:430:            'class' => OrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:431:            'choices' => $OrderStatuses,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:438:            'data' => $Order->getOrderStatus(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:482:        if (null === $Order->getOrderStatus()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:483:            $Order->setOrderStatus($this->orderStatusRepository->find(OrderStatus::NEW));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:493:            $Order->setOrderStatus($form['OrderStatus']->getData());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:505:    public function validateOrderStatus(FormEvent $event): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:514:        if (!$form['OrderStatus']->isValid()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:518:        $oldStatus = $Order->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:520:        $newStatus = $form['OrderStatus']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:525:                $form['OrderStatus']->addError(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:526:                    new FormError(trans('admin.order.failed_to_change_status__short', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:22:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:23:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:73:            (string) MtbBuyOrderStatus::TRANSFER_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:74:            (string) MtbBuyOrderStatus::CANCELED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:75:            (string) MtbBuyOrderStatus::STOCKING_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:76:            (string) MtbBuyOrderStatus::UNREGISTERED_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:77:            (string) MtbBuyOrderStatus::WAITING_FOR_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:80:            (string) MtbBuyOrderStatus::ORDERED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:81:            (string) MtbBuyOrderStatus::PRODUCT_ARRIVAL,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:82:            (string) MtbBuyOrderStatus::APPRAISAL_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:83:            (string) MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:84:            (string) MtbBuyOrderStatus::IDENTIFY_VERIFIED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:85:            (string) MtbBuyOrderStatus::TRANSFER_REQUESTED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:86:            (string) MtbBuyOrderStatus::TRANSFER_FAILED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:87:            (string) MtbBuyOrderStatus::ASSESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:88:            (string) MtbBuyOrderStatus::PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:89:            (string) MtbBuyOrderStatus::RESUMPTION,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:90:            (string) MtbBuyOrderStatus::COMMUNICATED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:116:            (string) MtbOtcBuyOrderStatus::STATUS_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:117:            (string) MtbOtcBuyOrderStatus::STATUS_CANCEL,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:118:            (string) MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:119:            (string) MtbOtcBuyOrderStatus::STATUS_HAS_UNREGISTERED_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:120:            (string) MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:123:            (string) MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:124:            (string) MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_IN_PROGRESS,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:125:            (string) MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PAUSED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:126:            (string) MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_RESUMED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:127:            (string) MtbOtcBuyOrderStatus::STATUS_ACCOUNTING_PAYMENT_PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:131:        $revokedByAdminStatusId = (string) MtbOtcBuyOrderStatus::STATUS_REVOKED_BY_ADMIN;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:158:            WHEN '.MtbBuyOrderStatus::ORDERED.' THEN 1
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:159:            WHEN '.MtbBuyOrderStatus::PRODUCT_ARRIVAL.' THEN 2
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:160:            WHEN '.MtbBuyOrderStatus::ASSESSING.' THEN 4
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:161:            WHEN '.MtbBuyOrderStatus::PENDING.' THEN 5
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:162:            WHEN '.MtbBuyOrderStatus::RESUMPTION.' THEN 6
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:163:            WHEN '.MtbBuyOrderStatus::APPRAISAL_COMPLETE.' THEN 7
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:164:            WHEN '.MtbBuyOrderStatus::COMMUNICATED.' THEN 11
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:165:            WHEN '.MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE.' THEN 12
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:166:            WHEN '.MtbBuyOrderStatus::IDENTIFY_VERIFIED.' THEN 13
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:167:            WHEN '.MtbBuyOrderStatus::TRANSFER_REQUESTED.' THEN 14
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:168:            WHEN '.MtbBuyOrderStatus::TRANSFER_FAILED.' THEN 15
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:179:            WHEN '.MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PENDING.' THEN 3
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:180:            WHEN '.MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_IN_PROGRESS.' THEN 8
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:181:            WHEN '.MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PAUSED.' THEN 9
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:182:            WHEN '.MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_RESUMED.' THEN 10
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MypagePurchaseHistoryRepository.php:183:            WHEN '.MtbOtcBuyOrderStatus::STATUS_ACCOUNTING_PAYMENT_PENDING.' THEN 16
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:39:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:66:        'order' => 'o.name01', 'orderer' => 'o.id', 'shipping_id' => 's.id', 'purchase_product' => 'oi.product_name', 'quantity' => 'oi.quantity', 'payment_method' => 'o.payment_method', 'order_status' => 'o.OrderStatus', 'purchase_price' => 'o.total', 'shipping_status' => 's.shipping_date', 'tracking_number' => 's.tracking_number', 'delivery' => 's.name01',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:112:    public function changeStatus(int $orderId, OrderStatus $Status): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:116:            ->setOrderStatus($Status)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:144:     *         status?:OrderStatus[]|int[],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:290:                ->andWhere($qb->expr()->in('o.OrderStatus', ':status'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:297:            $qb->andWhere($qb->expr()->notIn('o.OrderStatus', ':status'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:298:                ->setParameter('status', [OrderStatus::CANCEL, OrderStatus::PASSED]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:603:    public function countByOrderStatus(int $OrderStatusOrId): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:607:            ->where('o.OrderStatus = :OrderStatus')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:608:            ->setParameter('OrderStatus', $OrderStatusOrId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:616:     * @param array<int, int> $OrderStatuses
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:620:    public function updateOrderSummary(Customer $Customer, array $OrderStatuses = [OrderStatus::NEW, OrderStatus::PAID, OrderStatus::DELIVERED, OrderStatus::IN_PROGRESS]): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:626:                ->andWhere('o.OrderStatus in (:OrderStatuses)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:628:                ->setParameter('OrderStatuses', $OrderStatuses)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:774:     * - OrderStatus = NEW (受取前)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:790:            ->andWhere('o.OrderStatus = :orderNew')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:798:            ->setParameter('orderNew', OrderStatus::NEW)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:838:            ->andWhere('o.OrderStatus NOT IN (:excludedStatuses)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:842:                OrderStatus::CANCEL,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:843:                OrderStatus::DELIVERED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:844:                OrderStatus::PASSED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:845:                OrderStatus::RETURNED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:871:            ->where($qb->expr()->in('o.OrderStatus', ':statusIds'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:874:            ->setParameter('statusIds', [OrderStatus::CANCEL, OrderStatus::DELIVERED, OrderStatus::PASSED])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1165:            ->join('o.OrderStatus', 'st', 'WITH', 'st.id NOT IN (:ignore_status)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1169:            ->setParameter('ignore_status', [OrderStatus::PROCESSING, OrderStatus::CANCEL]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1229:    public function changeOrderStatus(int $orderStatusId, array $orders): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1235:            ->set('o.OrderStatus', $orderStatusId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1455:            ->join('o.OrderStatus', 'ost')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1518:            'IDENTITY(o.OrderStatus) AS status',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1529:                    'o.OrderStatus = :orderNew'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1533:                    'o.OrderStatus <> :processing',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1547:            ->setParameter('orderNew', OrderStatus::NEW)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1549:            ->setParameter('processing', OrderStatus::PROCESSING)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1629:                'orderNew' => OrderStatus::NEW,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1665:     * @param array<int, int> $OrderStatuses
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1669:    public function getCustomerCount(Customer $Customer, array $OrderStatuses): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1674:            ->andWhere('o.OrderStatus in (:OrderStatuses)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1676:            ->setParameter('OrderStatuses', $OrderStatuses)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1718:            ->setParameter('status', OrderStatus::CANCEL)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1772:            ->setParameter('status', OrderStatus::CANCEL)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1827:            ->andWhere('o.OrderStatus IN (:orderStatus)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1829:            ->setParameter('orderStatus', [OrderStatus::NEW, OrderStatus::PAY_WAIT, OrderStatus::PAID, OrderStatus::PICKED, OrderStatus::PICKING]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1878:            ->join('o.OrderStatus', 'os', 'WITH', 'os.id IN (:statusList)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1885:                OrderStatus::NEW,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1886:                OrderStatus::PAY_WAIT,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1887:                OrderStatus::PICKING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:24:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:129:            ->setParameter('processing_status', OrderStatus::PROCESSING)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:144:            ->andWhere('o.OrderStatus <> :processing')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:148:            ->setParameter('processing', OrderStatus::PROCESSING)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:238:                ->setParameter('cancelStatus', OrderStatus::CANCEL);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:241:                ->setParameter('cancelStatus', OrderStatus::CANCEL);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:20:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:23:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:35: * - OrderStatus は CANCEL に更新
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:44:        private OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:81:        if ($Order->getOrderStatus()?->getId() === OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:91:        $CancelStatus = $this->orderStatusRepository->find(OrderStatus::CANCEL);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:92:        if (!$CancelStatus instanceof OrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:93:            throw new \RuntimeException('OrderStatus CANCEL is not found.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:97:        $Order->setOrderStatus($CancelStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:20:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:22:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:37:        private OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:49:        $delivered = $this->orderStatusRepository->find(OrderStatus::DELIVERED);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:50:        if (!$delivered instanceof OrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:51:            throw new \RuntimeException('OrderStatus DELIVERED is not found.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:63:            $order->setOrderStatus($delivered);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:22:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:24:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:67:        private OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:85:        $passed = $this->orderStatusRepository->find(OrderStatus::PASSED);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:86:        if (!$passed instanceof OrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:87:            throw new \RuntimeException('OrderStatus PASSED is not found.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:116:                $existingOrder->setOrderStatus($passed);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:42:    public function gainPoints(Order $Order, ?int $transactionId = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:96:    public function cancelOrderPoints(Order $Order): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:22:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:38:        MtbOtcBuyOrderStatus::STATUS_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:39:        MtbOtcBuyOrderStatus::STATUS_CANCEL,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:40:        MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:41:        MtbOtcBuyOrderStatus::STATUS_HAS_UNREGISTERED_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:42:        MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:43:        MtbOtcBuyOrderStatus::STATUS_REVOKED_BY_ADMIN,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:95:                'class' => MtbOtcBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:19:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:20:use Eccube\Repository\Master\MtbOtcBuyOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:27:class OtcBuyOrderStatusType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:51:                'class' => MtbOtcBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:57:                'query_builder' => function (MtbOtcBuyOrderStatusRepository $repository): QueryBuilder {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:60:                        ->setParameter('deprecated', MtbOtcBuyOrderStatus::DEPRECATED_STATUSES)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:21:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:24:use Eccube\Repository\Master\MtbOtcBuyOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:134:                'class' => MtbOtcBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:136:                'query_builder' => function (MtbOtcBuyOrderStatusRepository $repository): QueryBuilder {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:139:                        ->setParameter('deprecated', MtbOtcBuyOrderStatus::DEPRECATED_STATUSES)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:20:use Eccube\Entity\DtbBuyOrderStatusHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:21:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:24:class BuyOrderStatusHistoryEntityManager
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:30:    public function save(DtbBuyOrder $BuyOrder, MtbBuyOrderStatus $BuyOrderStatus, Member $Member, ?\DateTime $createDate = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:32:        $BuyOrderStatusHistory = new DtbBuyOrderStatusHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:33:        $BuyOrderStatusHistory->setBuyOrder($BuyOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:34:        $BuyOrderStatusHistory->setBuyOrderStatus($BuyOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:35:        $BuyOrderStatusHistory->setMember($Member);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:36:        $BuyOrderStatusHistory->setCreateDate($createDate ?? new \DateTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:38:        $this->entityManager->persist($BuyOrderStatusHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:44:    public function saveCustomerOperation(DtbBuyOrder $BuyOrder, MtbBuyOrderStatus $BuyOrderStatus, ?\DateTime $createDate = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:46:        $BuyOrderStatusHistory = new DtbBuyOrderStatusHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:47:        $BuyOrderStatusHistory->setBuyOrder($BuyOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:48:        $BuyOrderStatusHistory->setBuyOrderStatus($BuyOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:49:        $BuyOrderStatusHistory->setMember(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:50:        $BuyOrderStatusHistory->setCreateDate($createDate ?? new \DateTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/BuyOrderStatusHistoryEntityManager.php:52:        $this->entityManager->persist($BuyOrderStatusHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:20:use Eccube\Entity\DtbOtcBuyOrderStatusHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:21:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:24:class OtcBuyOrderStatusHistoryEntityManager
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:30:    public function save(DtbOtcBuyOrder $OtcBuyOrder, MtbOtcBuyOrderStatus $NextStatus, Member $Member, ?\DateTime $currentTime = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:32:        $OtcBuyOrderStatusHistory = new DtbOtcBuyOrderStatusHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:33:        $OtcBuyOrderStatusHistory->setOtcBuyOrder($OtcBuyOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:34:        $OtcBuyOrderStatusHistory->setOtcBuyOrderStatusId($NextStatus->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:35:        $OtcBuyOrderStatusHistory->setMember($Member);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:36:        $OtcBuyOrderStatusHistory->setCreateDate($currentTime ?? new \DateTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderStatusHistoryEntityManager.php:38:        $this->entityManager->persist($OtcBuyOrderStatusHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:24:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:31:        private readonly OtcBuyOrderStatusHistoryEntityManager $otcBuyOrderStatusHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:40:    public function update(DtbOtcBuyOrder $OtcBuyOrder, MtbOtcBuyOrderStatus $OtcBuyOrderStatus, ?bool $qualifiedInvoiceIssuerConfirmationFlg, ?int $smaregiTransactionId, int $totalPrice, Collection $OtcBuyOrderDetails, Collection $OtcBuyOrderIndivisualInputProducts, Collection $OtcBuyOrderStocks, Member $Member, \DateTime $currentTime): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:43:            ->setOtcBuyOrderStatus($OtcBuyOrderStatus)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:52:        if ($OtcBuyOrderStatus->isComplete()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:58:        } elseif ($OtcBuyOrderStatus->isCancel()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:70:     * @param MtbOtcBuyOrderStatus $OtcBuyOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:72:    public function updateStatus(DtbOtcBuyOrder $OtcBuyOrder, MtbOtcBuyOrderStatus $OtcBuyOrderStatus): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:74:        $OtcBuyOrder->setOtcBuyOrderStatus($OtcBuyOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:83:        MtbOtcBuyOrderStatus $NextStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:88:        $this->otcBuyOrderStatusHistoryEntityManager->save($OtcBuyOrder, $NextStatus, $Member, $currentTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:24:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:29:use Eccube\Form\Type\Master\OrderStatusType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:136:            ->add('status', OrderStatusType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:146:                            OrderStatus::PASSED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:18:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:120:     * - OrderStatusが新規受付、入金済み、対応中、発送済みのどれかであること
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:134:        if (!$itemHolder->getOrderStatus()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:138:        switch ($itemHolder->getOrderStatus()->getId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:139:            case OrderStatus::NEW:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:140:            case OrderStatus::IN_PROGRESS:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:141:            case OrderStatus::DELIVERED:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:142:            case OrderStatus::PAID:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:21:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:80:            if ($To->getOrderStatus() && $To->getOrderStatus()->getId() == OrderStatus::CANCEL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:81:                && $From->getOrderStatus() && $From->getOrderStatus()->getId() != OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:86:            } elseif ($To->getOrderStatus() && $To->getOrderStatus()->getId() == OrderStatus::IN_PROGRESS
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:87:                && $From->getOrderStatus() && $From->getOrderStatus()->getId() == OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:292:        if ($To->getOrderStatus()?->getId() === OrderStatus::CANCEL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:293:            && $From->getOrderStatus()?->getId() !== OrderStatus::CANCEL) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:17:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:20:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:31:    public function __construct(private readonly OrderStatusRepository $orderStatusRepository)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:46:            ? OrderStatus::PAY_WAIT
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:47:            : OrderStatus::NEW;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:49:        /** @var OrderStatus $OrderStatus */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:50:        $OrderStatus = $this->orderStatusRepository->find($statusId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:51:        $target->setOrderStatus($OrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:16:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:18:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:29:    public function __construct(private readonly WorkflowInterface $_orderStateMachine, private readonly OrderStatusRepository $orderStatusRepository, private readonly PointProcessor $pointProcessor, private readonly StockReduceProcessor $stockReduceProcessor)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:37:     * @param OrderStatus $OrderStatus 遷移先ステータス
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:39:    public function apply(Order $Order, OrderStatus $OrderStatus, ?string $transitionName = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:41:        $transition = $this->getEnabledTransition($Order, $OrderStatus, $transitionName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:53:     * @param OrderStatus $OrderStatus 遷移先ステータス
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:57:    public function can(Order $Order, OrderStatus $OrderStatus, ?string $transitionName = null): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:59:        return $this->getEnabledTransition($Order, $OrderStatus, $transitionName) !== null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:62:    public function getEnabledTransition(Order $Order, OrderStatus $OrderStatus, ?string $transitionName = null): ?Transition
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:64:        // OrderStatusが設定されていない場合は遷移不可
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:65:        if (!$Order->getOrderStatus()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:69:        return $this->getTransition($this->newContext($Order), $OrderStatus, $transitionName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:72:    private function getTransition(OrderStateMachineContext $context, OrderStatus $OrderStatus, ?string $transitionName = null): ?Transition
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:79:            if (in_array($OrderStatus->getId(), $t->getTos())) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:185:     * {@link StateMachine}によって遷移が終了したときには{@link Order#OrderStatus}のidが変更されるだけなのでOrderStatusを設定し直す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:192:        $CompletedOrderStatus = $this->orderStatusRepository->find($context->getStatus());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:193:        $Order->setOrderStatus($CompletedOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:198:        $orderStatus = $Order->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/OrderStatusFilter.php:18:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/OrderStatusFilter.php:21:class OrderStatusFilter extends SQLFilter
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/OrderStatusFilter.php:28:            return $targetTableAlias.'.order_status_id <> '.OrderStatus::PENDING.' AND '.$targetTableAlias.'.order_status_id <> '.OrderStatus::PROCESSING;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/OrderStatusFilter.php:32:        if ($targetEntity->reflClass->getName() === OrderStatus::class) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/OrderStatusFilter.php:33:            return $targetTableAlias.'.id <> '.OrderStatus::PENDING.' AND '.$targetTableAlias.'.id <> '.OrderStatus::PROCESSING;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:29:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:42:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:86:    public function __construct(protected EntityManagerInterface $entityManager, protected OrderRepository $orderRepository, protected OrderItemTypeRepository $orderItemTypeRepository, protected OrderStatusRepository $orderStatusRepository, protected DeliveryRepository $deliveryRepository, protected PaymentRepository $paymentRepository, protected DeviceTypeRepository $deviceTypeRepository, protected PrefRepository $prefRepository, protected MobileDetect $mobileDetector, protected Session $session, protected AuthorizationCheckerInterface $authorizationChecker, protected TokenStorageInterface $tokenStorage, protected CartService $cartService)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:97:        $OrderStatus = $this->orderStatusRepository->find(OrderStatus::PROCESSING);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:99:        $Order->setOrderStatus($OrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:250:            'OrderStatus' => OrderStatus::PROCESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:20:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:31:        MtbBuyOrderStatus::WAITING_FOR_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:32:        MtbBuyOrderStatus::STOCKING_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:107:            $foundById[$BuyOrder->getId()] = $BuyOrder->getBuyOrderStatus()->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:19:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:22:use Eccube\Service\EntityManager\BuyOrderStatusHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:36:        private readonly BuyOrderStatusHistoryEntityManager $buyOrderStatusHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:42:        if (!$input->BuyOrder->getBuyOrderStatus()->isBuyOrderStockEditable()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:87:                    MtbBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:88:                    MtbBuyOrderStatus::WAITING_FOR_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:91:                    $input->BuyOrder->setBuyOrderStatus($WaitingForStockStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:93:                    $this->buyOrderStatusHistoryEntityManager->save(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/ActionInput/PurchaseDetailUpdateInput.php:33:        public int $originalBuyOrderStatusId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BatchAutoStockAction.php:19:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BatchAutoStockAction.php:51:        $BuyOrders = $this->buyOrderRepository->findBy(['BuyOrderStatus' => MtbBuyOrderStatus::WAITING_FOR_STOCK]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:25:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:31:use Eccube\Repository\DtbBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:33:use Eccube\Repository\Master\MtbBuyOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:39:use Eccube\Service\EntityManager\BuyOrderStatusHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:50:        private readonly MtbBuyOrderStatusRepository $buyOrderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:51:        private readonly BuyOrderStatusHistoryEntityManager $buyOrderStatusHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:55:        private readonly DtbBuyOrderStatusHistoryRepository $buyOrderStatusHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:76:            // ※ステータス更新は updateStatusIfWaitingForStock 内でも行われる（persistBuyOrderStatusChange と冪等）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:77:            $stockInboundNeeded = $BuyOrder->getBuyOrderStatus()->getId() === MtbBuyOrderStatus::STOCKING_COMPLETE
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:81:            $hadTransferCompleteHistoryBeforeThisSave = $this->buyOrderStatusHistoryRepository->hasBuyOrderStatusHistory(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:83:                MtbBuyOrderStatus::TRANSFER_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:86:            $hadAppraisalAcceptanceHistoryBeforeThisSave = $this->buyOrderStatusHistoryRepository->hasBuyOrderStatusHistory(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:88:                MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:95:            $this->persistBuyOrderStatusChange($BuyOrder, $input->originalBuyOrderStatusId, $input->Member, $currentTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:98:            $isTransferCompleteStage = $this->isBuyOrderStatusTransferComplete($BuyOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:106:                && $BuyOrder->getBuyOrderStatus()->getId() === MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:157:    private function isBuyOrderStatusTransferComplete(DtbBuyOrder $BuyOrder): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:159:        return $BuyOrder->getBuyOrderStatus()->getId() === MtbBuyOrderStatus::TRANSFER_COMPLETE;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:170:        $nextStatusId = MtbBuyOrderStatus::WAITING_FOR_STOCK;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:176:                $nextStatusId = MtbBuyOrderStatus::UNREGISTERED_STOCK;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:181:        $NextStatus = $this->buyOrderStatusRepository->find($nextStatusId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:186:        $BuyOrder->setBuyOrderStatus($NextStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:187:        $this->buyOrderStatusHistoryEntityManager->save($BuyOrder, $NextStatus, $Member, $currentTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:279:    private function persistBuyOrderStatusChange(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:281:        int $originalBuyOrderStatusId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:285:        $RequestStatus = $BuyOrder->getBuyOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:288:        if ($originalBuyOrderStatusId !== $requestStatusId) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:289:            $BuyOrderStatus = $this->buyOrderStatusRepository->find($requestStatusId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:290:            if ($BuyOrderStatus !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:291:                $BuyOrder->setBuyOrderStatus($BuyOrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:292:                $this->buyOrderStatusHistoryEntityManager->save($BuyOrder, $BuyOrderStatus, $Member, $currentTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:21:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:24:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:41:        protected OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:131:            $newStatus = $this->orderStatusRepository->find(OrderStatus::DELIVERED);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:132:            $isPreDeliv = $order->getOrderStatus()?->getId() === OrderStatus::PRE_DELIV;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:134:                $order->setOrderStatus($newStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php:28:use Eccube\Service\EntityManager\BuyOrderStatusHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php:43:        private readonly BuyOrderStatusHistoryEntityManager $buyOrderStatusHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php:60:            $oldStatusId = $input->BuyOrder->getBuyOrderStatus()->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php:104:                ->setBuyOrderStatus($input->NewBuyOrderStatus)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php:111:            if ($oldStatusId !== $input->NewBuyOrderStatus->getId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php:112:                $this->buyOrderStatusHistoryEntityManager->save(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php:114:                    $input->NewBuyOrderStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/ActionInput/UpdateStatusInput.php:19:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/ActionInput/UpdateStatusInput.php:27:        public MtbBuyOrderStatus $NewBuyOrderStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/ActionInput/UpdateBuyOrderInput.php:20:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/ActionInput/UpdateBuyOrderInput.php:31:        public MtbBuyOrderStatus $NewBuyOrderStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:19:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:23:use Eccube\Service\EntityManager\BuyOrderStatusHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:30:        MtbBuyOrderStatus::PRODUCT_ARRIVAL => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:31:            MtbBuyOrderStatus::ASSESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:32:            MtbBuyOrderStatus::PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:33:            MtbBuyOrderStatus::RESUMPTION,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:36:        MtbBuyOrderStatus::ASSESSING => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:37:            MtbBuyOrderStatus::PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:38:            MtbBuyOrderStatus::RESUMPTION,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:41:        MtbBuyOrderStatus::PENDING => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:42:            MtbBuyOrderStatus::ASSESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:43:            MtbBuyOrderStatus::RESUMPTION,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:46:        MtbBuyOrderStatus::RESUMPTION => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:47:            MtbBuyOrderStatus::ASSESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:48:            MtbBuyOrderStatus::PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:55:        private readonly BuyOrderStatusHistoryEntityManager $buyOrderStatusHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:67:        $CurrentStatus = $input->BuyOrder->getBuyOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:69:        $nextStatusId = $input->NewBuyOrderStatus->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:78:            $message = $input->NewBuyOrderStatus->isAssessmentActive()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:93:            && $input->NewBuyOrderStatus->isAssessmentActive()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:103:                ->setBuyOrderStatus($input->NewBuyOrderStatus)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:107:            $this->buyOrderStatusHistoryEntityManager->save($input->BuyOrder, $input->NewBuyOrderStatus, $input->Member, $now);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:20:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:27:use Eccube\Service\EntityManager\OtcBuyOrderStatusHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:41:        private readonly OtcBuyOrderStatusHistoryEntityManager $otcBuyOrderStatusHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:48:        $OtcBuyOrderStatus = $this->entityManager->find(MtbOtcBuyOrderStatus::class, $input->UpdateOtcBuyOrderDto->orderStatusId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:49:        if (!$OtcBuyOrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:53:        $PrevStatus = $input->OtcBuyOrder->getOtcBuyOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:71:                $OtcBuyOrderStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:83:            if ($PrevStatus !== $OtcBuyOrderStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:84:                $this->otcBuyOrderStatusHistoryEntityManager->save($input->OtcBuyOrder, $OtcBuyOrderStatus, $input->Member, $currentTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:88:            if ($OtcBuyOrderStatus->isComplete()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:90:                    MtbOtcBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateOtcBuyOrderAction.php:99:            if ($OtcBuyOrderStatus->isAccountingPaymentPending()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateStatusInput.php:19:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/ActionInput/UpdateStatusInput.php:27:        public MtbOtcBuyOrderStatus $NextStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php:20:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php:120:                $data['statusId'] !== MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php:121:                && $data['statusId'] !== MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateOtcBuyOrderStockAction.php:19:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateOtcBuyOrderStockAction.php:44:        $statusId = $input->OtcBuyOrder->getOtcBuyOrderStatus()?->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateOtcBuyOrderStockAction.php:46:            MtbOtcBuyOrderStatus::STATUS_HAS_UNREGISTERED_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateOtcBuyOrderStockAction.php:47:            MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RecalculateSummaryAction.php:18:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RecalculateSummaryAction.php:36:        $wasInSummary = in_array($input->oldStatusId, MtbOtcBuyOrderStatus::SUMMARY_STATUSES, true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RecalculateSummaryAction.php:37:        $isInSummary = in_array($input->newStatusId, MtbOtcBuyOrderStatus::SUMMARY_STATUSES, true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:19:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:37:        MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PENDING => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:38:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_IN_PROGRESS,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:39:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PAUSED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:40:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_RESUMED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:43:        MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_IN_PROGRESS => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:44:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PAUSED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:45:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_RESUMED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:48:        MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PAUSED => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:49:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_IN_PROGRESS,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:50:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_RESUMED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:53:        MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_RESUMED => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:54:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_IN_PROGRESS,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:55:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PAUSED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:67:        $CurrentStatus = $input->OtcBuyOrder->getOtcBuyOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RegisterIndividualStockAction.php:19:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RegisterIndividualStockAction.php:49:        $statusId = $input->OtcBuyOrder->getOtcBuyOrderStatus()?->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RegisterIndividualStockAction.php:50:        if ($statusId !== MtbOtcBuyOrderStatus::STATUS_HAS_UNREGISTERED_STOCK) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RegisterIndividualStockAction.php:93:                    MtbOtcBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/RegisterIndividualStockAction.php:94:                    MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/ActionInput/UpdateStatusInput.php:19:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/ActionInput/UpdateStatusInput.php:26:        public MtbOtcBuyOrderStatus $NextStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAutoStockAction.php:19:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAutoStockAction.php:45:        $OtcBuyOrders = $this->otcBuyOrderRepository->findBy(['OtcBuyOrderStatus' => MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:20:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:43:        $CurrentStatus = $input->OtcBuyOrder->getOtcBuyOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:55:            && $CurrentStatus->getId() === MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:56:            && $input->NextStatus->getId() !== MtbOtcBuyOrderStatus::STATUS_REVOKED_BY_ADMIN
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:62:        if ($input->NextStatus->getId() === MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:73:            $stockInboundNeeded = $input->NextStatus->getId() === MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:130:     * @return ?MtbOtcBuyOrderStatus 2段階目のステータス。買取成立以外の場合は null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:132:    private function resolvePostCompleteStatus(UpdateStatusInput $input): ?MtbOtcBuyOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateStatusAction.php:140:        return $this->entityManager->find(MtbOtcBuyOrderStatus::class, $nextStatusId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:274:                                                            {{ Purchase.getBuyOrderStatus.getName }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:40:                    {% set statusId = Order.OrderStatus.id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:42:                        constant('Eccube\\Entity\\Master\\OrderStatus::DELIVERED'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:43:                        constant('Eccube\\Entity\\Master\\OrderStatus::PAID')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:47:                        constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:48:                        constant('Eccube\\Entity\\Master\\OrderStatus::RETURNED')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:111:                                    <span class="c-hareruya-label--status c-hareruya-label--status-{{ statusCssModifier }}">{{ Order.CustomerOrderStatus }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:99:        constant('Eccube\\Entity\\Master\\MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE') ~ '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:100:        constant('Eccube\\Entity\\Master\\MtbBuyOrderStatus::IDENTIFY_VERIFIED') ~ '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:101:        constant('Eccube\\Entity\\Master\\MtbBuyOrderStatus::TRANSFER_REQUESTED') ~ '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:102:        constant('Eccube\\Entity\\Master\\MtbBuyOrderStatus::TRANSFER_COMPLETE') ~ '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:103:        constant('Eccube\\Entity\\Master\\MtbBuyOrderStatus::TRANSFER_FAILED') ~ '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:104:        constant('Eccube\\Entity\\Master\\MtbBuyOrderStatus::COMMUNICATED') ~ ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:106:    transferRequestedStatus: constant('Eccube\\Entity\\Master\\MtbBuyOrderStatus::TRANSFER_REQUESTED') ~ '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:249:                                        {{ form_widget(form.BuyOrderStatus) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:250:                                        {{ form_errors(form.BuyOrderStatus) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:294:                                            <td id="detail__item_status--{{ i }}">{{ statusList[statusHistory.buyOrderStatus.id] }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:42:                            <dd>{{ Order.CustomerOrderStatus }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:148:            if (confirm(message)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:84:                        {% set statusId = Order.OrderStatus.id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:86:                            constant('Eccube\\Entity\\Master\\OrderStatus::DELIVERED'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:87:                            constant('Eccube\\Entity\\Master\\OrderStatus::PAID'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:88:                            constant('Eccube\\Entity\\Master\\OrderStatus::PASSED')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:91:                        {% elseif statusId == constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:189:                                        <span class="c-hareruya-label--status c-hareruya-label--status-{{ statusCssModifier }}">{{ Order.OrderStatus.name }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:26:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:31:use Eccube\Service\EntityManager\BuyOrderStatusHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:45:        private readonly BuyOrderStatusHistoryEntityManager $buyOrderStatusHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:79:            $BuyOrderStatus = $this->entityManager->find(MtbBuyOrderStatus::class, MtbBuyOrderStatus::ORDERED);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:80:            if ($BuyOrderStatus === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:81:                throw new \RuntimeException('MtbBuyOrderStatus::ORDERED not found');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:88:                $BuyOrderStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:97:            $this->buyOrderStatusHistoryEntityManager->saveCustomerOperation($BuyOrder, $BuyOrderStatus, $now);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:129:        MtbBuyOrderStatus $BuyOrderStatus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:149:            ->setBuyOrderStatus($BuyOrderStatus)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:364:                        <span class="fw-bold">{{ 'admin.stock.split_join.status_change_history'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:19:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:21:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:23:use Eccube\Service\Admin\Order\ActionInput\UpdatePrintedOrderStatusInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:26:class UpdatePrintedOrderStatusAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:31:        private readonly OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:40:     * @param UpdatePrintedOrderStatusInput $input
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:44:    public function handle(UpdatePrintedOrderStatusInput $input): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:62:        $pickingStatus = $this->orderStatusRepository->find(OrderStatus::PICKING);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:90:                    $Order->setOrderStatus($pickingStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ActionInput/UpdatePrintedOrderStatusInput.php:18:final readonly class UpdatePrintedOrderStatusInput
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:21:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:24:use Eccube\Service\EntityManager\BuyOrderStatusHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:36:        private readonly BuyOrderStatusHistoryEntityManager $buyOrderStatusHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:94:                MtbBuyOrderStatus::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:95:                MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:97:            if ($appraisalAcceptanceStatus !== null && $buyOrder->getBuyOrderStatus()->getId() !== $appraisalAcceptanceStatus->getId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:98:                $buyOrder->setBuyOrderStatus($appraisalAcceptanceStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:99:                $this->buyOrderStatusHistoryEntityManager->saveCustomerOperation($buyOrder, $appraisalAcceptanceStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:21:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:55:                $this->orderRepository->changeOrderStatus(OrderStatus::PRE_DELIV, $orders);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:27:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:46:            $buyOrder->getBuyOrderStatus()->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:65:        $saleIntentEditable = $buyOrder->getBuyOrderStatus()->getId() === MtbBuyOrderStatus::COMMUNICATED;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:71:            appraisalAt: $this->parseHistoryDate($statusHistories[MtbBuyOrderStatus::BUY_ORDER_STATUS[MtbBuyOrderStatus::APPRAISAL_COMPLETE]] ?? null),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:72:            acceptanceAt: $this->parseHistoryDate($statusHistories[MtbBuyOrderStatus::BUY_ORDER_STATUS[MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE]] ?? null),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:73:            transferCompletedAt: $this->parseHistoryDate($statusHistories[MtbBuyOrderStatus::BUY_ORDER_STATUS[MtbBuyOrderStatus::TRANSFER_COMPLETE]] ?? null),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:19:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:20:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:30:        private readonly OrderStatusRepository $orderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:52:                    $Order->setOrderStatus($this->orderStatusRepository->find(OrderStatus::PICKING));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryOtcDetailAction.php:41:        $status = $order->getOtcBuyOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryRowBuilder.php:90:            $buyOrder->getBuyOrderStatus()->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryRowBuilder.php:126:        $otcStatus = $otcBuyOrder->getOtcBuyOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_approval.twig:248:                        <span class="fw-bold">{{ 'admin.stock.split_join.status_change_history'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:18:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:19:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:33:    public function resolveMappedStatusLabelForNet(int $buyOrderStatusId): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:35:        return match ($buyOrderStatusId) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:36:            MtbBuyOrderStatus::ORDERED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:37:            MtbBuyOrderStatus::PRODUCT_ARRIVAL => self::MAPPED_STATUS_RECEPTION_COMPLETED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:39:            MtbBuyOrderStatus::ASSESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:40:            MtbBuyOrderStatus::PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:41:            MtbBuyOrderStatus::RESUMPTION,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:42:            MtbBuyOrderStatus::APPRAISAL_COMPLETE => self::MAPPED_STATUS_ASSESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:44:            MtbBuyOrderStatus::COMMUNICATED => self::MAPPED_STATUS_ASSESSMENT_COMPLETED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:46:            MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:47:            MtbBuyOrderStatus::IDENTIFY_VERIFIED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:48:            MtbBuyOrderStatus::TRANSFER_REQUESTED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:49:            MtbBuyOrderStatus::TRANSFER_FAILED => self::MAPPED_STATUS_TRANSFER_PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:51:            MtbBuyOrderStatus::TRANSFER_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:52:            MtbBuyOrderStatus::UNREGISTERED_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:53:            MtbBuyOrderStatus::WAITING_FOR_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:54:            MtbBuyOrderStatus::STOCKING_COMPLETE => self::MAPPED_STATUS_PURCHASE_COMPLETED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:56:            MtbBuyOrderStatus::CANCELED => self::MAPPED_STATUS_CANCELED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:65:    public function resolveMappedStatusLabelForOtc(int $otcBuyOrderStatusId): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:67:        return match ($otcBuyOrderStatusId) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:68:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PENDING => self::MAPPED_STATUS_RECEPTION_COMPLETED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:70:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_IN_PROGRESS,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:71:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_PAUSED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:72:            MtbOtcBuyOrderStatus::STATUS_ASSESSMENT_RESUMED => self::MAPPED_STATUS_ASSESSING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:74:            MtbOtcBuyOrderStatus::STATUS_CANCEL => self::MAPPED_STATUS_CANCELED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:76:            MtbOtcBuyOrderStatus::STATUS_ACCOUNTING_PAYMENT_PENDING => self::MAPPED_STATUS_TRANSFER_PENDING,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:78:            MtbOtcBuyOrderStatus::STATUS_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:79:            MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:80:            MtbOtcBuyOrderStatus::STATUS_HAS_UNREGISTERED_STOCK,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:81:            MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING => self::MAPPED_STATUS_PURCHASE_COMPLETED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:84:            MtbOtcBuyOrderStatus::STATUS_REVOKED_BY_ADMIN => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:425:                        <span class="fw-bold">{{ 'admin.stock.split_join.status_change_history'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail_confirm.twig:75:                            <div class="col-10"><span class="badge badge-ec-blue" style="background-color: #fff; color: {{ Order.OrderStatusColor }}; border-color: {{ Order.OrderStatusColor }}">{{ Order.OrderStatus }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1112:                                                {% for status in OrderStatuses %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1287:                                                    <span class="badge badge-ec-blue" style="background-color: #fff; color: {{ Order.OrderStatusColor }}; border-color: {{ Order.OrderStatusColor }}">{{ Order.OrderStatus }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1313:                                                               data-update-status-id="{{ constant('Eccube\\Entity\\Master\\OrderStatus::DELIVERED') }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_approval.twig:215:                        <span class="fw-bold">{{ 'admin.stock.split_join.status_change_history'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:61:                                {% for OrderStatus in form.OrderStatuses %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:64:                                            {{ OrderStatus.vars.data.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:67:                                            {{ form_widget(OrderStatus.customer_order_status_name) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:68:                                            {{ form_errors(OrderStatus.customer_order_status_name) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:71:                                            {{ form_widget(OrderStatus.name) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:72:                                            {{ form_errors(OrderStatus.name) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:76:                                                {{ form_widget(OrderStatus.color, {'attr': {'class': 'form-control-color'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:78:                                            {{ form_errors(OrderStatus.color) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:81:                                            {{ form_widget(OrderStatus.display_order_count) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig:82:                                            {{ form_errors(OrderStatus.display_order_count) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:532:                $form.find('input[name="mode"]').val('status_change');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:589:        const orderStatusCancelId = '{{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:590:        const renderedInitialOrderStatusId = {% if Order.OrderStatus is not null %}{{ Order.OrderStatus.id }}{% else %}null{% endif %};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:634:            return targetMode === 'register' || targetMode === 'status_change';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:641:            const $orderStatus = $('#order_OrderStatus');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:647:                && renderedInitialOrderStatusId !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:648:                && renderedInitialOrderStatusId !== {{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:650:                if (!confirm("過去にキャンセルされているため、在庫数やポイントの変動はありません。\nキャンセルしてもよろしいですか？")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:655:                && renderedInitialOrderStatusId !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:656:                && renderedInitialOrderStatusId !== {{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:657:                if (!confirm("全キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：払い戻し\n付与済みポイント：取り消し")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:661:                && renderedInitialOrderStatusId === {{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:662:                && String(renderedInitialOrderStatusId) !== orderStatusVal) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:663:                if (!confirm("キャンセルからステータスを変更する場合は、在庫の変動はありません。\n別途、在庫の減算操作を行ってください。")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:674:                    if (!confirm("一部キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：変動なし\n付与予定ポイント：再計算\n付与済みポイント：変動なし")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:690:                            if (!confirm("一部キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：変動なし\n付与予定ポイント：再計算\n付与済みポイント：変動なし")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:711:                            if (!confirm("商品名：" + $('input[name="' + orderItemFieldName(elem.name, '[product_name]') + '"]').val() + "\n欠品により上記商品の数量が0に更新され、欠品数を戻すことができなくなります。よろしいですか？")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:731:                if (!confirm("以下の商品は価格が購入時と差異があります。\n更新してもよろしいですか？\n" + arrAlertTarget.join('\n'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:760:    {% if Order.OrderStatus is not empty and Order.OrderStatus.id in [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:761:        constant('Eccube\\Entity\\Master\\OrderStatus::PROCESSING'), constant('Eccube\\Entity\\Master\\OrderStatus::PENDING')] -%}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:836:                                                <div class="col">{{ Order.OrderStatus.name }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:843:                                                    {{ form_widget(form.OrderStatus) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:844:                                                    {{ form_errors(form.OrderStatus) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/status.twig:31:                                {{ OtcBuyOrder.OtcBuyOrderStatus ? OtcBuyOrder.OtcBuyOrderStatus.name : '' }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail.twig:84:                            <div class="col-10"><span class="badge badge-ec-blue" style="background-color: #fff; color: {{ Order.OrderStatusColor }}; border-color: {{ Order.OrderStatusColor }}">{{ Order.OrderStatus }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:225:                                    <td id="result_list_main__member1--{{ OtcBuyOrder.id }}">{{ OtcBuyOrder.getLatestUpdaterByStatus(constant('Eccube\\Entity\\Master\\MtbOtcBuyOrderStatus::STATUS_COMPLETE')).name ?? OtcBuyOrder.Member.name ?? '' }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:227:                                    <td id="result_list_main__otc_buy_order_status--{{ OtcBuyOrder.id }}">{{ OtcBuyOrder.OtcBuyOrderStatus.name }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:53:                            <div class="col-9">{{ OtcBuyOrder.otcBuyOrderStatus ? OtcBuyOrder.otcBuyOrderStatus.name : '' }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:138:                                        <td>{{ statusList[StatusHistory.otcBuyOrderStatusId] is defined ? statusList[StatusHistory.otcBuyOrderStatusId] : '' }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:653:        if (!confirm('経理払出し済みに変更します。よろしいですか？')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:667:                if (!confirm('編集した内容は元に戻ります。解除しますか？')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:503:                                                                data-update-status-id="{{ constant('Eccube\\Entity\\Master\\OrderStatus::DELIVERED') }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:177:                                                                        {{ Order.OrderStatus }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:128:                                {% for OrderStatus in OrderStatuses %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:130:                                        <a href="{{ url('admin_order', { 'order_status_id': OrderStatus.id }) }}" class="p-3 d-block">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:133:                                                    <span class="align-middle">{{ OrderStatus.name }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:136:                                                    <span class="h4 align-middle fw-normal text-dark">{{ Orders is not empty and Orders[OrderStatus.id] is defined ? Orders[OrderStatus.id] : 0 }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:405:                <button type="submit" id="bulk_delete" class="btn btn-ec-conversion" onclick="return confirm('{{ 'admin.deck.bulk_delete_confirm'|trans|e('js') }}');">{{ 'admin.deck.bulk_delete'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:599:                                                <button type="submit" class="dropdown-item px-3 py-1" onclick="return confirm('{{ 'admin.deck.delete_confirm'|trans|e('js') }}');">{{ 'admin.common.delete'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:193:                                            <form method="post" action="{{ url('admin_archetype_delete', {id: Archetype.id}) }}" onsubmit="return confirm('{{ 'admin.archetype.delete_confirm'|trans|e('js') }}');">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:583:         * Set optionMypageOrderStatusDisplay.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:585:        public function setOptionMypageOrderStatusDisplay(bool $optionMypageOrderStatusDisplay): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:587:            $this->option_mypage_order_status_display = $optionMypageOrderStatusDisplay;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:593:         * Get optionMypageOrderStatusDisplay.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:595:        public function isOptionMypageOrderStatusDisplay(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:64:                if (confirm('{{ 'admin.archetype.delete_confirm'|trans|e('js') }}')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:688:        if (confirm('{{ "admin.deck.delete_confirm"|trans }}')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:24:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:37:        MtbBuyOrderStatus::ORDERED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:38:        MtbBuyOrderStatus::PRODUCT_ARRIVAL,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:39:        MtbBuyOrderStatus::APPRAISAL_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:40:        MtbBuyOrderStatus::COMMUNICATED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:41:        MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:42:        MtbBuyOrderStatus::TRANSFER_COMPLETE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:43:        MtbBuyOrderStatus::CANCELED,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:132:    #[ORM\ManyToOne(targetEntity: MtbBuyOrderStatus::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:133:    private MtbBuyOrderStatus $BuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:181:     * @var Collection<int, DtbBuyOrderStatusHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:183:    #[ORM\OneToMany(targetEntity: DtbBuyOrderStatusHistory::class, mappedBy: 'BuyOrder')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:184:    private Collection $BuyOrderStatusHistories;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:198:        $this->BuyOrderStatusHistories = new ArrayCollection();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:232:        foreach ($this->getBuyOrderStatusHistories() as $History) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:233:            if ($History->getBuyOrderStatus()->getId() === MtbBuyOrderStatus::APPRAISAL_ACCEPTANCE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:249:        foreach ($this->getBuyOrderStatusHistories() as $History) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:250:            if ($History->getBuyOrderStatus()->getId() === MtbBuyOrderStatus::APPRAISAL_COMPLETE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:581:    public function getBuyOrderStatus(): MtbBuyOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:583:        return $this->BuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:586:    public function setBuyOrderStatus(MtbBuyOrderStatus $BuyOrderStatus): DtbBuyOrder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:588:        $this->BuyOrderStatus = $BuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:969:     * @return Collection<int, DtbBuyOrderStatusHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:971:    public function getBuyOrderStatusHistories(): Collection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:973:        return $this->BuyOrderStatusHistories;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:980:     * @return array<string, string|null> キーは MtbBuyOrderStatus::BUY_ORDER_STATUS の値、値は 'Y-m-d H:i:s' または null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:984:        $buyOrderStatusHistories = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:986:            $statusName = MtbBuyOrderStatus::BUY_ORDER_STATUS[$statusId];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:987:            $buyOrderStatusHistories[$statusName] = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:989:        foreach ($this->getBuyOrderStatusHistories() as $BuyOrderStatusHistory) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:990:            $statusId = $BuyOrderStatusHistory->getBuyOrderStatus()->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:991:            if (!isset(MtbBuyOrderStatus::BUY_ORDER_STATUS[$statusId])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:994:            $statusName = MtbBuyOrderStatus::BUY_ORDER_STATUS[$statusId];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:995:            $buyOrderStatusHistories[$statusName] = $BuyOrderStatusHistory->getCreateDate()->format('Y-m-d H:i:s');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:998:        return $buyOrderStatusHistories;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:1002:     * @param Collection<int, DtbBuyOrderStatusHistory> $BuyOrderStatusHistories
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:1004:    public function setBuyOrderStatusHistories(Collection $BuyOrderStatusHistories): DtbBuyOrder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:1006:        $this->BuyOrderStatusHistories = $BuyOrderStatusHistories;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:23:use Eccube\Entity\Master\CustomerOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:26:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:27:use Eccube\Entity\Master\OrderStatusColor;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:627:         * OrderStatusより先にプロパティを定義しておかないとセットされなくなる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:629:        #[ORM\ManyToOne(targetEntity: CustomerOrderStatus::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:631:        private ?CustomerOrderStatus $CustomerOrderStatus = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:634:         * OrderStatusより先にプロパティを定義しておかないとセットされなくなる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:636:        #[ORM\ManyToOne(targetEntity: OrderStatusColor::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:638:        private ?OrderStatusColor $OrderStatusColor = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:640:        #[ORM\ManyToOne(targetEntity: OrderStatus::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:642:        private ?OrderStatus $OrderStatus = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:800:        public function __construct(?OrderStatus $OrderStatus = null)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:814:            if ($OrderStatus !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:815:                $this->setOrderStatus($OrderStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1684:         * Set customerOrderStatus.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1686:        public function setCustomerOrderStatus(?CustomerOrderStatus $customerOrderStatus = null): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1688:            $this->CustomerOrderStatus = $customerOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1694:         * Get customerOrderStatus.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1696:        public function getCustomerOrderStatus(): ?CustomerOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1698:            return $this->CustomerOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1704:        public function setOrderStatusColor(?OrderStatusColor $orderStatusColor = null): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1706:            $this->OrderStatusColor = $orderStatusColor;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1714:        public function getOrderStatusColor(): ?OrderStatusColor
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1716:            return $this->OrderStatusColor;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1722:        public function setOrderStatus(?OrderStatus $orderStatus = null): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1724:            $this->OrderStatus = $orderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1732:        public function getOrderStatus(): ?OrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1734:            return $this->OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2496:            $OrderStatus = $this->getOrderStatus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2497:            if ($OrderStatus === null || $OrderStatus->getId() !== OrderStatus::DELIVERED) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/index.twig:21:                    if (!confirm('{{ 'common.delete_confirm'|trans }}')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:64:                if (confirmMessage && !confirm(confirmMessage)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:124:                if ($btn.prop('disabled') || !confirm('カード名リスト作成バッチを実行しますか？')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:39:                    if (window.confirm(message)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:968:                                                        <span class="badge badge-ec-blue">{{ BuyOrder.BuyOrderStatus }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:75:                    if (!window.confirm(categorySortDragConfirmMessage)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:95:                if (!window.confirm(categorySortDragConfirmMessage)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:108:                if (!window.confirm(categorySortDragConfirmMessage)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:20:use Eccube\Entity\Master\MtbBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:21:use Eccube\Repository\DtbBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:25:#[ORM\Entity(repositoryClass: DtbBuyOrderStatusHistoryRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:26:class DtbBuyOrderStatusHistory extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:37:    #[ORM\ManyToOne(targetEntity: DtbBuyOrder::class, inversedBy: 'BuyOrderStatusHistories')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:45:    #[ORM\ManyToOne(targetEntity: MtbBuyOrderStatus::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:46:    private MtbBuyOrderStatus $BuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:53:    public function setId(int $id): DtbBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:65:    public function setCreateDate(\DateTime $createDate): DtbBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:77:    public function setBuyOrder(DtbBuyOrder $BuyOrder): DtbBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:89:    public function setMember(?Member $Member): DtbBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:96:    public function getBuyOrderStatus(): MtbBuyOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:98:        return $this->BuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:101:    public function setBuyOrderStatus(MtbBuyOrderStatus $BuyOrderStatus): DtbBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderStatusHistory.php:103:        $this->BuyOrderStatus = $BuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2359:admin.order.failed_to_change_status: "%name%: You are not allowed to change the status from %from% to %to%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2360:admin.order.failed_to_change_status__short: "You are not allowed to change the status from %from% to %to%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2361:admin.order.cancel.complete: Order cancellation completed.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3454:admin.stock.split_join.status_change_history: Status Change History
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:17:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:130:    public function getOrderStatus(): ?OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2562:admin.order.failed_to_change_status: "%name%: %from% から %to% にはステータス変更できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2563:admin.order.failed_to_change_status__short: "%from% から %to% にはステータス変更できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2566:admin.order.cancel.complete: 全キャンセルが完了しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4887:admin.stock.split_join.status_change_history: ステータス変更履歴
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:85:"84","3",,"Eccube\\Entity\\Order","OrderStatus","id","対応状況(ID)","28","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:86:"85","3",,"Eccube\\Entity\\Order","OrderStatus","name","対応状況(名称)","29","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:155:"155","4",,"Eccube\\Entity\\Order","OrderStatus","id","対応状況(ID)","28","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:156:"156","4",,"Eccube\\Entity\\Order","OrderStatus","name","対応状況(名称)","29","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatusColor.php:17:use Eccube\Repository\Master\OrderStatusColorRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatusColor.php:19:if (!class_exists(OrderStatusColor::class, false)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatusColor.php:21:     * OrderStatusColor
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatusColor.php:25:    #[ORM\Entity(repositoryClass: OrderStatusColorRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatusColor.php:27:    class OrderStatusColor extends AbstractMasterEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:20:use Eccube\Repository\DtbOtcBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:24:#[ORM\Entity(repositoryClass: DtbOtcBuyOrderStatusHistoryRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:25:class DtbOtcBuyOrderStatusHistory extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:33:    private int $otcBuyOrderStatusId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:51:    public function setOtcBuyOrderStatusId(int $otcBuyOrderStatusId): DtbOtcBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:53:        $this->otcBuyOrderStatusId = $otcBuyOrderStatusId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:58:    public function getOtcBuyOrderStatusId(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:60:        return $this->otcBuyOrderStatusId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:63:    public function setCreateDate(?\DateTime $createDate): DtbOtcBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:75:    public function setOtcBuyOrder(DtbOtcBuyOrder $OtcBuyOrder): DtbOtcBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStatusHistory.php:87:    public function setMember(?Member $Member): DtbOtcBuyOrderStatusHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderIndivisualInputProduct.php:21:use Eccube\Repository\DtbOtcBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderIndivisualInputProduct.php:25:#[ORM\Entity(repositoryClass: DtbOtcBuyOrderStatusHistoryRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:22:use Eccube\Entity\Master\OrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:417:        public function getOrderStatus(): ?OrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:18:use Eccube\Repository\Master\OrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:20:if (!class_exists(OrderStatus::class, false)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:22:     * OrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:26:    #[ORM\Entity(repositoryClass: OrderStatusRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:28:    class OrderStatus extends AbstractMasterEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CustomerOrderStatus.php:17:use Eccube\Repository\Master\CustomerOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CustomerOrderStatus.php:19:if (!class_exists(CustomerOrderStatus::class, false)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CustomerOrderStatus.php:21:     * CustomerOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CustomerOrderStatus.php:25:    #[ORM\Entity(repositoryClass: CustomerOrderStatusRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CustomerOrderStatus.php:27:    class CustomerOrderStatus extends AbstractMasterEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:21:use Eccube\Repository\Master\MtbOtcBuyOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:25:#[ORM\Entity(repositoryClass: MtbOtcBuyOrderStatusRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:26:class MtbOtcBuyOrderStatus extends AbstractEntity implements \Stringable
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:132:    public function setName(string $name): MtbOtcBuyOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyOrderStatus.php:21:use Eccube\Repository\Master\MtbBuyOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyOrderStatus.php:25:#[ORM\Entity(repositoryClass: MtbBuyOrderStatusRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyOrderStatus.php:26:class MtbBuyOrderStatus extends AbstractEntity implements \Stringable
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyOrderStatus.php:124:    public function setName(?string $name): MtbBuyOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyOrderStatus.php:136:    public function setRank(?int $rank): MtbBuyOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:25:use Eccube\Entity\Master\MtbOtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:35:        MtbOtcBuyOrderStatus::STATUS_COMPLETE => 'setCompleteDate',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:36:        MtbOtcBuyOrderStatus::STATUS_CANCEL => 'setCancelDate',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:37:        MtbOtcBuyOrderStatus::STATUS_STOCKING_COMPLETE => 'setRestockedDate',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:46:    #[ORM\ManyToOne(targetEntity: MtbOtcBuyOrderStatus::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:47:    private ?MtbOtcBuyOrderStatus $OtcBuyOrderStatus = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:181:     * @var Collection<int, DtbOtcBuyOrderStatusHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:183:    #[ORM\OneToMany(targetEntity: DtbOtcBuyOrderStatusHistory::class, mappedBy: 'OtcBuyOrder', cascade: ['persist', 'remove'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:184:    private Collection $OtcBuyOrderStatusHistories;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:528:    public function setOtcBuyOrderStatus(?MtbOtcBuyOrderStatus $OtcBuyOrderStatus): DtbOtcBuyOrder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:530:        $this->OtcBuyOrderStatus = $OtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:535:    public function getOtcBuyOrderStatus(): ?MtbOtcBuyOrderStatus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:537:        return $this->OtcBuyOrderStatus;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:565:     * @return Collection<int, DtbOtcBuyOrderStatusHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:567:    public function getOtcBuyOrderStatusHistories(): Collection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:569:        return $this->OtcBuyOrderStatusHistories;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:649:            ? MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:650:            : MtbOtcBuyOrderStatus::STATUS_HAS_UNREGISTERED_STOCK;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:772:    public function setStatusChangedDateTime(MtbOtcBuyOrderStatus $newStatus): DtbOtcBuyOrder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:774:        $statusId = $this->getOtcBuyOrderStatus()->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:779:        if (!empty($this->completeDate) && $newStatus->getId() === MtbOtcBuyOrderStatus::STATUS_COMPLETE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:793:        $latestOtcBuyOrderStatusHistory = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:796:        foreach ($this->OtcBuyOrderStatusHistories as $OtcBuyOrderStatusHistory) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:797:            if ($OtcBuyOrderStatusHistory->getOtcBuyOrderStatusId() !== $statusId) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:801:            $createDate = $OtcBuyOrderStatusHistory->getCreateDate();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:808:                $latestOtcBuyOrderStatusHistory = $OtcBuyOrderStatusHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:812:        return $latestOtcBuyOrderStatusHistory?->getMember();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php:833:        $this->OtcBuyOrderStatusHistories = new ArrayCollection();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:85:84,3,,Eccube\\Entity\\Order,OrderStatus,id,Order Status (ID),28,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:86:85,3,,Eccube\\Entity\\Order,OrderStatus,name,Order Status (Name),29,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:155:155,4,,Eccube\\Entity\\Order,OrderStatus,id,Order Status (ID),28,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:156:156,4,,Eccube\\Entity\\Order,OrderStatus,name,Order Status (Name),29,1,2017-03-07 10:14:00,2017-03-07 10:14:00

 succeeded in 128ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:502:        $this->entityManager->wrapInTransaction(function () use ($BuyMainCard, $BuyOrder): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:236:                $this->entityManager->wrapInTransaction(function () use ($activateCreationFlow, $BaseInfo) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:592:            $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $OriginOrder, $OriginItems, $purchaseContext, $form, &$gainPointJob): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:688:                // wrapInTransaction が成功時に最終 flush + DB commit する（失敗時は rollback）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:799:        $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $statusChangedToDelivered, $isFirstCancellation, $OldOrderStatus, $NewOrderStatus, &$gainPointJob): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitRegisterAction.php:94:        $this->entityManager->wrapInTransaction(function () use (
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:107:        $this->entityManager->wrapInTransaction(function () use ($newOrder, $matchedOrders, $passed): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinRegisterAction.php:71:        $this->entityManager->wrapInTransaction(function () use ($StockSplitJoin, $Status, $Member, $now): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Entry/EntryStatusBulkUpdateAction.php:36:        $this->entityManager->wrapInTransaction(function () use ($input): void {
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandlerTest.php:69:        // 新規受注作成と既存受注更新は wrapInTransaction で 1 トランザクションにまとめる。
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandlerTest.php:72:        $entityManager->method('wrapInTransaction')->willReturnCallback(
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandlerTest.php:123:        $entityManager->method('wrapInTransaction')->willReturnCallback(
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandlerTest.php:212:        $entityManager->method('wrapInTransaction')->willReturnCallback(
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandlerTest.php:340:        $entityManager->method('wrapInTransaction')->willReturnCallback(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryRegistrationStoreAction.php:41:        return $this->entityManager->wrapInTransaction(function () use ($input): DtbEventEntry {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryUpdateAction.php:41:        $this->entityManager->wrapInTransaction(function () use ($input): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/LatestEventDeck/LatestEventDeckUpdateAction.php:35:        $this->entityManager->wrapInTransaction(function () use ($LatestEventDecks): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:53:        $BuyOrder = $this->entityManager->wrapInTransaction(function () use ($input): DtbBuyOrder {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventEntryRegisterAction.php:53:        return $this->entityManager->wrapInTransaction(function () use ($input): array {
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/OrderStateMachineTest.php:365:        $this->entityManager->wrapInTransaction(function () use ($Order): void {
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/OrderStateMachineTest.php:428:        $this->entityManager->wrapInTransaction(function () use ($Order): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventEntryCancelAction.php:41:        $this->entityManager->wrapInTransaction(function () use ($paymentNo): void {
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmActionTest.php:67:        $em->method('wrapInTransaction')->willReturnCallback(static function (callable $callback): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:51:        $this->entityManager->wrapInTransaction(function () use ($buyOrder, $query, $saleLowPriceProductFlg): void {

codex
実装の通常ルートではフォーム検証が不許可遷移を止めていますが、候補2は「確定処理側の購入処理例外表示」まで含めると弱い指摘ではなく、未捕捉例外として成立する可能性があります。念のため、画面側の `status_change` 送信と文言資源も確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '520,610p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   520	        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_INDEX_PROGRESS);
   521	
   522	        $rollbackStockoutChanges = $this->applyStockoutChangesBeforeOrderPurchaseFlowValidate($TargetOrder, $OriginOrder);
   523	
   524	        $rollbackTemporaryItems = $this->appendTemporaryFinancialOrderItemsForFlow($TargetOrder);
   525	        try {
   526	            $flowResult = $this->orderPurchaseFlow->validate($TargetOrder, $purchaseContext);
   527	        } finally {
   528	            $rollbackTemporaryItems();
   529	        }
   530	
   531	        if ($flowResult->hasWarning()) {
   532	            foreach ($flowResult->getWarning() as $warning) {
   533	                $this->addWarning($warning->getMessage(), 'admin');
   534	            }
   535	        }
   536	
   537	        if ($flowResult->hasError()) {
   538	            $rollbackStockoutChanges();
   539	            foreach ($flowResult->getErrors() as $error) {
   540	                $this->addError($error->getMessage(), 'admin');
   541	            }
   542	        }
   543	
   544	        if ($request->get('mode') === 'register') {
   545	            return $this->tryCommitOrderRegister($request, $router, $form, $TargetOrder, $OriginOrder, $OriginItems, $purchaseContext, $flowResult);
   546	        }
   547	
   548	        return null;
   549	    }
   550	
   551	    /**
   552	     * 「登録」ボタン（`mode=register`）押下時の確定処理。PurchaseFlow prepare/commit、ステータス遷移、永続化、リダイレクトまでを行う.
   553	     *
   554	     * @param Request                         $request         リクエスト（`return_link` 等）
   555	     * @param RouterInterface                 $router          `return_link` のルート解決
   556	     * @param FormInterface                   $form            受注フォーム
   557	     * @param Order                           $TargetOrder     保存対象の受注
   558	     * @param Order                           $OriginOrder     編集前スナップショット（ステータス比較等）
   559	     * @param ArrayCollection<int, OrderItem> $OriginItems     編集前明細。フォームから外れた明細を remove するために使用
   560	     * @param PurchaseContext                 $purchaseContext PurchaseFlowコンテキスト
   561	     * @param PurchaseFlowResult              $flowResult      直前の validate 結果（エラー時は処理しない）
   562	     *
   563	     * @return RedirectResponse|null 検証エラー・PurchaseFlow 例外・ステートマシン例外時は null（画面再表示）
   564	     */
   565	    private function tryCommitOrderRegister(
   566	        Request $request,
   567	        RouterInterface $router,
   568	        FormInterface $form,
   569	        Order $TargetOrder,
   570	        Order $OriginOrder,
   571	        ArrayCollection $OriginItems,
   572	        PurchaseContext $purchaseContext,
   573	        PurchaseFlowResult $flowResult,
   574	    ): ?RedirectResponse {
   575	        log_info('受注登録開始', [$TargetOrder->getId()]);
   576	
   577	        if ($flowResult->hasError() || !$form->isValid()) {
   578	            return null;
   579	        }
   580	
   581	        foreach ($TargetOrder->getShippings() as $Shipping) {
   582	            $Shipping->setBaseInfo($TargetOrder->getBaseInfo());
   583	        }
   584	        foreach ($TargetOrder->getOrderItems() as $OrderItem) {
   585	            $OrderItem->setBaseInfo($TargetOrder->getBaseInfo());
   586	        }
   587	
   588	        $gainPointJob = null;
   589	
   590	        try {
   591	            // StockDiffProcessor 等が悲観ロックを使うため、prepare/commit から永続化まで同一 DB トランザクション内で行う
   592	            $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $OriginOrder, $OriginItems, $purchaseContext, $form, &$gainPointJob): void {
   593	                $rollbackTemporaryItems = $this->appendTemporaryFinancialOrderItemsForFlow($TargetOrder);
   594	                try {
   595	                    $this->orderPurchaseFlow->prepare($TargetOrder, $purchaseContext);
   596	                    $this->orderPurchaseFlow->commit($TargetOrder, $purchaseContext);
   597	                } finally {
   598	                    $rollbackTemporaryItems();
   599	                }
   600	
   601	                // prepare/commit 後に差し替えられた明細等へ店舗を再付与（新規受注 flush 時の base_info_id NOT NULL 対策）
   602	                $baseInfo = $TargetOrder->getBaseInfo();
   603	                foreach ($TargetOrder->getShippings() as $Shipping) {
   604	                    $Shipping->setBaseInfo($baseInfo);
   605	                    foreach ($Shipping->getOrderItems() as $item) {
   606	                        if ($item instanceof OrderItem) {
   607	                            $item->setBaseInfo($baseInfo);
   608	                        }
   609	                    }
   610	                }

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '2558,2568p' && nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml | sed -n '2356,2364p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  2558	admin.order.delivery_note_line3: 3行目
  2559	admin.order.delivery_note_save_input: 入力内容を保存する
  2560	admin.order.delivery_note_download_error: "ダウンロードに失敗しました"
  2561	admin.order.delivery_note_parameter_error: "出荷IDが指定されていません"
  2562	admin.order.failed_to_change_status: "%name%: %from% から %to% にはステータス変更できません"
  2563	admin.order.failed_to_change_status__short: "%from% から %to% にはステータス変更できません"
  2564	admin.order.skip_change_status: "%name%: ステータス変更をスキップしました"
  2565	admin.order.customer.note: 会員備考
  2566	admin.order.cancel.complete: 全キャンセルが完了しました。
  2567	admin.order.part_cancel.complete: 一部キャンセルが完了しました
  2568	admin.order.save.complete: 保存しました
  2356	admin.order.delivery_note_save_input: Save Entry
  2357	admin.order.delivery_note_download_error: "Failed to Download"
  2358	admin.order.delivery_note_parameter_error: "Shipping ID is not specified"
  2359	admin.order.failed_to_change_status: "%name%: You are not allowed to change the status from %from% to %to%"
  2360	admin.order.failed_to_change_status__short: "You are not allowed to change the status from %from% to %to%"
  2361	admin.order.cancel.complete: Order cancellation completed.
  2362	admin.order.part_cancel.complete: Partial cancellation completed.
  2363	admin.order.save.complete: Saved
  2364	admin.order.skip_change_status: "%name%: Status change has been skipped"

exec
/bin/bash -lc "rg -n \"status_change|mode|OrderStatus|cancel_date|confirm\\(\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig /home/y-saito/Developments/ec-cube-enterprise/app/template/admin/Order/edit.twig 2>/dev/null" in /home/y-saito/Developments/hareruya-design-docs
 exited 2 in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:382:                $('#form1').find('input[name="mode"]').val('register');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:493:                    $('#form1').append('<input type="hidden" name="mode" value="register">');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:524:            // 共通submit処理でボタンがdisabledになってもmodeが送信されるようhiddenへ反映する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:525:            $(document).on('click', '#form1 button[type="submit"][name="mode"]', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:526:                $('#form1').find('input[type="hidden"][name="mode"]').val($(this).val());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:532:                $form.find('input[name="mode"]').val('status_change');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:541:                $form.find('input[name="mode"]').val('clear_date');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:589:        const orderStatusCancelId = '{{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:590:        const renderedInitialOrderStatusId = {% if Order.OrderStatus is not null %}{{ Order.OrderStatus.id }}{% else %}null{% endif %};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:625:            const modeViaSubmitter = sub && sub.getAttribute('name') === 'mode' ? sub.getAttribute('value') : null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:626:            let modeViaHiddenInput = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:627:            formElement.querySelectorAll('input[name="mode"]').forEach(function (el) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:629:                    modeViaHiddenInput = el.value;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:633:            const targetMode = modeViaSubmitter || modeViaHiddenInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:634:            return targetMode === 'register' || targetMode === 'status_change';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:641:            const $orderStatus = $('#order_OrderStatus');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:647:                && renderedInitialOrderStatusId !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:648:                && renderedInitialOrderStatusId !== {{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:650:                if (!confirm("過去にキャンセルされているため、在庫数やポイントの変動はありません。\nキャンセルしてもよろしいですか？")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:655:                && renderedInitialOrderStatusId !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:656:                && renderedInitialOrderStatusId !== {{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:657:                if (!confirm("全キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：払い戻し\n付与済みポイント：取り消し")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:661:                && renderedInitialOrderStatusId === {{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:662:                && String(renderedInitialOrderStatusId) !== orderStatusVal) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:663:                if (!confirm("キャンセルからステータスを変更する場合は、在庫の変動はありません。\n別途、在庫の減算操作を行ってください。")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:674:                    if (!confirm("一部キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：変動なし\n付与予定ポイント：再計算\n付与済みポイント：変動なし")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:690:                            if (!confirm("一部キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：変動なし\n付与予定ポイント：再計算\n付与済みポイント：変動なし")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:711:                            if (!confirm("商品名：" + $('input[name="' + orderItemFieldName(elem.name, '[product_name]') + '"]').val() + "\n欠品により上記商品の数量が0に更新され、欠品数を戻すことができなくなります。よろしいですか？")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:731:                if (!confirm("以下の商品は価格が購入時と差異があります。\n更新してもよろしいですか？\n" + arrAlertTarget.join('\n'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:760:    {% if Order.OrderStatus is not empty and Order.OrderStatus.id in [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:761:        constant('Eccube\\Entity\\Master\\OrderStatus::PROCESSING'), constant('Eccube\\Entity\\Master\\OrderStatus::PENDING')] -%}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:790:        <input type="hidden" name="mode" value="">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:836:                                                <div class="col">{{ Order.OrderStatus.name }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:843:                                                    {{ form_widget(form.OrderStatus) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:844:                                                    {{ form_errors(form.OrderStatus) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:894:                                            <div class="col">{{ Order.cancel_date ? Order.cancel_date|date_sec : '' }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:895:                                            {% if Order.cancel_date %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:896:                                                <div class="col"><button type="button" class="btn btn-ec-regular clear-date" data-target="cancel_date">クリア</button></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1170:                                        <button type="submit" class="btn btn-ec-regular me-2" name="mode" value="register">{{ 'admin.order.register_order'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1268:                                <button type="submit" class="btn btn-ec-conversion col-6" name="mode" value="register">受注情報を登録</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1879:                                <button type="submit" class="btn btn-ec-conversion col-6" name="mode" value="register">受注情報を登録</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1909:                                <button type="submit" class="btn btn-ec-conversion px-5 ladda-button" name="mode" value="register"{{ action_disabled ? ' disabled="disabled"' }}>{{ 'admin.common.registration'|trans }}</button>

exec
/bin/bash -lc 'nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php | rg -n "cancelOrderPoints|gainPoints|function" -C 3' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
26-    26	
27-    27	class PointService
28-    28	{
29:    29	    public function __construct(
30-    30	        private readonly DtbPlayerRepository $playerRepository,
31-    31	        private readonly MtbPointTypeRepository $pointTypeRepository,
32-    32	        private readonly PointHistoryEntityManager $pointHistoryEntityManager,
--
39-    39	     *
40-    40	     * @param ?int $transactionId スマレジ取引由来の場合に履歴へ記録する取引ID (冪等性判定用)
41-    41	     */
42:    42	    public function gainPoints(Order $Order, ?int $transactionId = null): void
43-    43	    {
44-    44	        $Customer = $Order->getCustomer();
45-    45	        if (!$Customer instanceof Customer) {
--
77-    77	     *
78-    78	     * @param ?int $transactionId スマレジ取引由来の場合に履歴へ記録する取引ID (冪等性判定用)
79-    79	     */
80:    80	    public function spendPoints(Order $Order, ?int $transactionId = null): void
81-    81	    {
82-    82	        $this->changeSpentPoints($Order, -1, $transactionId);
83-    83	    }
--
85-    85	    /**
86-    86	     * 受注の利用ポイントを会員ポイント残高へ戻し、履歴へ反映する.
87-    87	     */
88:    88	    public function rollbackSpentPoints(Order $Order): void
89-    89	    {
90-    90	        $this->changeSpentPoints($Order, 1);
91-    91	    }
--
93-    93	    /**
94-    94	     * 受注に紐づくポイント変動を取り消し、会員ポイント残高からも差し戻す.
95-    95	     */
96:    96	    public function cancelOrderPoints(Order $Order): void
97-    97	    {
98-    98	        $Customer = $Order->getCustomer();
99-    99	        if (!$Customer instanceof Customer) {
--
125-   125	        $this->entityManager->persist($Player);
126-   126	    }
127-   127	
128:   128	    private function changeSpentPoints(Order $Order, int $sign, ?int $transactionId = null): void
129-   129	    {
130-   130	        $Customer = $Order->getCustomer();
131-   131	        if (!$Customer instanceof Customer) {

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig | sed -n '520,666p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   520	                }
   521	            });
   522	
   523	            {% if Order.id is not empty %}
   524	            // 共通submit処理でボタンがdisabledになってもmodeが送信されるようhiddenへ反映する
   525	            $(document).on('click', '#form1 button[type="submit"][name="mode"]', function () {
   526	                $('#form1').find('input[type="hidden"][name="mode"]').val($(this).val());
   527	            });
   528	
   529	            // ステータスを更新ボタンクリック
   530	            $(document).on('click', '.change-status', function () {
   531	                const $form = $('#form1');
   532	                $form.find('input[name="mode"]').val('status_change');
   533	                // clear-date 押下後の target 付き action を引きずらないように毎回ベースURLへ戻す
   534	                $form.attr('action', '{{ url('admin_order_edit', {'id': Order.id }) }}').submit();
   535	                return false;
   536	            });
   537	
   538	            // 日付クリアボタンクリック
   539	            $(document).on('click', '.clear-date', function () {
   540	                const $form = $('#form1');
   541	                $form.find('input[name="mode"]').val('clear_date');
   542	                $form.attr('action', '{{ url('admin_order_edit', {'id': Order.id }) }}?target=' + $(this).data('target')).submit();
   543	                return false;
   544	            });
   545	            {% endif %}
   546	        });
   547	
   548	        {# ポイント機能が有効かつ会員の場合のみポイントの割引金額を変更する #}
   549	        {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
   550	            $(document).on('submit', '#form1', function (e) {
   551	                updatePointItem();
   552	                // 必要ならここで e.preventDefault() を入れる
   553	            });
   554	            // 再計算時のポイントの割引金額の更新
   555	            function updatePointItem() {
   556	                // 利用ポイント
   557	                const usePoint = $('#order_spendedPoints').val();
   558	
   559	                // 利用ポイントが数値以外の時は割引金額を更新しない
   560	                if (isNaN(usePoint)) return;
   561	
   562	                // 割引金額を計算
   563	                const discountPrice = (-1) * usePoint;
   564	
   565	                // ポイント明細の金額の要素を取得
   566	                const $pointPrice = $('.pointPrice');
   567	
   568	                // ポイント明細の金額の要素がある場合はポイントの更新
   569	                if ($pointPrice.length) {
   570	                    $pointPrice.val(discountPrice);
   571	                }
   572	            }
   573	        {% endif %}
   574	
   575	        $('#zip-search-orderer').click(function() {
   576	            AjaxZip3.zip2addr('order[postalCode][postalCode01]', 'order[postalCode][postalCode02]', 'order[address][pref]', 'order[address][addr01]');
   577	        });
   578	
   579	        $('#zip-search-shipping').click(function() {
   580	            AjaxZip3.zip2addr('order[Shipping][postalCode][postalCode01]', 'order[Shipping][postalCode][postalCode02]', 'order[Shipping][address][pref]', 'order[Shipping][address][addr01]');
   581	        });
   582	
   583	        // 欠品関連
   584	        // 受注時の数量・欠品数量・価格差異（EditController より JSON）。form の name は order[OrderItems][n][quantity] 形式（OrderType block_prefix: order）。
   585	        const arrQuantity = {{ (arrQuantity ?? {})|json_encode(constant('JSON_HEX_TAG') b-or constant('JSON_HEX_AMP') b-or constant('JSON_HEX_APOS') b-or constant('JSON_HEX_QUOT'))|raw }};
   586	        const arrStockout = {{ (arrStockout ?? {})|json_encode(constant('JSON_HEX_TAG') b-or constant('JSON_HEX_AMP') b-or constant('JSON_HEX_APOS') b-or constant('JSON_HEX_QUOT'))|raw }};
   587	        const arrDifferentPrice = {{ (arrDifferentPrice ?? {})|json_encode(constant('JSON_HEX_TAG') b-or constant('JSON_HEX_AMP') b-or constant('JSON_HEX_APOS') b-or constant('JSON_HEX_QUOT'))|raw }};
   588	        let arrAlertTarget = [];
   589	        const orderStatusCancelId = '{{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}';
   590	        const renderedInitialOrderStatusId = {% if Order.OrderStatus is not null %}{{ Order.OrderStatus.id }}{% else %}null{% endif %};
   591	        const isNewOrderRegistration = {{ Order.id is empty ? 'true' : 'false' }};
   592	
   593	        function orderItemFieldName(quantityInputName, segment) {
   594	            return quantityInputName.replace('[quantity]', segment);
   595	        }
   596	
   597	        // 欠品登録ボタンクリック時
   598	        $(".btn-stockout").click(function () {
   599	            const stockoutRow = $(this).parent().parent().parent().find(".edit-stockout");
   600	            if (stockoutRow.css("display") === "none") {
   601	                $(this).addClass("active").addClass("btn-danger");
   602	                stockoutRow.slideDown(300);
   603	            }
   604	            return false;
   605	        });
   606	
   607	        // 増加した商品について価格変化の確認（商品規格行のみ arrQuantity のキーが存在する行を対象）
   608	        function setAlertTargetProducts() {
   609	            $('input[name$="[quantity]"]').each(function (index, elem) {
   610	                const quantity = parseInt(elem.value, 10) || 0;
   611	                const productClassId = $('input[name="' + orderItemFieldName(elem.name, '[ProductClass]') + '"]').val();
   612	                if (!productClassId || !Object.prototype.hasOwnProperty.call(arrQuantity, productClassId)) {
   613	                    return;
   614	                }
   615	                const beforeQuantity = parseInt(arrQuantity[productClassId], 10) || 0;
   616	                if ((beforeQuantity < quantity) && (Object.prototype.hasOwnProperty.call(arrDifferentPrice, productClassId))) {
   617	                    arrAlertTarget.push(arrDifferentPrice[productClassId]);
   618	                }
   619	            });
   620	        }
   621	
   622	        function shouldRunRegisterValidationChecks(e, formElement) {
   623	            const orig = e.originalEvent;
   624	            const sub = orig && orig.submitter;
   625	            const modeViaSubmitter = sub && sub.getAttribute('name') === 'mode' ? sub.getAttribute('value') : null;
   626	            let modeViaHiddenInput = null;
   627	            formElement.querySelectorAll('input[name="mode"]').forEach(function (el) {
   628	                if (el.value) {
   629	                    modeViaHiddenInput = el.value;
   630	                }
   631	            });
   632	
   633	            const targetMode = modeViaSubmitter || modeViaHiddenInput;
   634	            return targetMode === 'register' || targetMode === 'status_change';
   635	        }
   636	
   637	        function runRegisterValidationChecks() {
   638	
   639	            arrAlertTarget = [];
   640	
   641	            const $orderStatus = $('#order_OrderStatus');
   642	            const orderStatusVal = $orderStatus.length ? String($orderStatus.val()) : null;
   643	            const hasCancelDate = {{ Order.cancelDate is not null ? 'true' : 'false' }};
   644	
   645	            if ($orderStatus.length
   646	                && orderStatusVal === orderStatusCancelId
   647	                && renderedInitialOrderStatusId !== null
   648	                && renderedInitialOrderStatusId !== {{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}
   649	                && hasCancelDate) {
   650	                if (!confirm("過去にキャンセルされているため、在庫数やポイントの変動はありません。\nキャンセルしてもよろしいですか？")) {
   651	                    return false;
   652	                }
   653	            } else if ($orderStatus.length
   654	                && orderStatusVal === orderStatusCancelId
   655	                && renderedInitialOrderStatusId !== null
   656	                && renderedInitialOrderStatusId !== {{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}) {
   657	                if (!confirm("全キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：払い戻し\n付与済みポイント：取り消し")) {
   658	                    return false;
   659	                }
   660	            } else if ($orderStatus.length
   661	                && renderedInitialOrderStatusId === {{ constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') }}
   662	                && String(renderedInitialOrderStatusId) !== orderStatusVal) {
   663	                if (!confirm("キャンセルからステータスを変更する場合は、在庫の変動はありません。\n別途、在庫の減算操作を行ってください。")) {
   664	                    return false;
   665	                }
   666	                setAlertTargetProducts();

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md | sed -n '140,148p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   140	### フラッシュ・トースト
   141	
   142	| 種別 | 表示文言（日本語） | 表示文言（英語） | 条件 |
   143	|------|-------------------|-------------------|------|
   144	| 成功 | 全キャンセルが完了しました。 | - | 対応状況変更が成立し、変更後ステータスが取消のとき。ロケールキーadmin.order.cancel.completeは日本語のみで英語ロケール資源を持たない。 |
   145	| 成功 | 保存しました | Saved | 対応状況変更が成立し、変更後ステータスが取消以外のとき。ロケールキーadmin.order.save.complete。 |
   146	
   147	### エラー・警告（インライン）
   148	

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php | sed -n '88,124p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig | sed -n '828,850p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    88	    public function rollbackSpentPoints(Order $Order): void
    89	    {
    90	        $this->changeSpentPoints($Order, 1);
    91	    }
    92	
    93	    /**
    94	     * 受注に紐づくポイント変動を取り消し、会員ポイント残高からも差し戻す.
    95	     */
    96	    public function cancelOrderPoints(Order $Order): void
    97	    {
    98	        $Customer = $Order->getCustomer();
    99	        if (!$Customer instanceof Customer) {
   100	            return;
   101	        }
   102	
   103	        $Player = $this->playerRepository->findOneByCustomer($Customer);
   104	        if ($Player === null) {
   105	            return;
   106	        }
   107	
   108	        $Order->setGainedPoints(0);
   109	        $this->entityManager->persist($Order);
   110	
   111	        $pointDiffTotal = 0;
   112	        $PointHistories = $this->entityManager
   113	            ->getRepository(DtbPointHistory::class)
   114	            ->findBy(['Order' => $Order]);
   115	        foreach ($PointHistories as $PointHistory) {
   116	            $pointDiffTotal += (int) $PointHistory->getPointChange();
   117	            $this->entityManager->remove($PointHistory);
   118	        }
   119	
   120	        if ($pointDiffTotal === 0) {
   121	            return;
   122	        }
   123	
   124	        $Player->setPoint($Player->getPoint() - $pointDiffTotal);

 succeeded in 0ms:
   828	                                        {% endif %}
   829	                                        <div class="row mb-3">
   830	                                            <div class="col-3" data-bs-placement="top" title="注文者">注文者<i class="fa fa-lg ms-1"></i></div>
   831	                                            <div class="col">{{ Order.full_name }}</div>
   832	                                        </div>
   833	                                        {% if Order.id is not empty %}
   834	                                            <div class="row mb-3">
   835	                                                <div class="col-3" data-bs-placement="top" title="現在のステータス">現在のステータス<i class="fa fa-lg ms-1"></i></div>
   836	                                                <div class="col">{{ Order.OrderStatus.name }}</div>
   837	                                            </div>
   838	                                        {% endif %}
   839	                                        <div class="row mb-3">
   840	                                            <label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.order_status'|trans }}">{{ 'admin.order.order_status'|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>
   841	                                            <div class="col">
   842	                                                {% if Order.id is not empty %}
   843	                                                    {{ form_widget(form.OrderStatus) }}
   844	                                                    {{ form_errors(form.OrderStatus) }}
   845	                                                {% endif %}
   846	                                            </div>
   847	                                        </div>
   848	                                    </div>
   849	                                    <div class="col-6">
   850	                                        <div class="row mb-3">

codex
追加で設計と実装が明確に食い違う箇所を1件見つけました。取消完了フラッシュの英語資源について、設計は「英語なし」としますが実装には英語キーがあります。
exec
/bin/bash -lc "rg -n \"OrderStatus.*choices|orderStateMachine|choice_filter|sort_no|findBy\\(\\[\\], \\['sort_no'\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php | sed -n '1,130p'" in /home/y-saito/Developments/hareruya-design-docs
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
    14	namespace Eccube\Form\Type\Admin;
    15	
    16	use Doctrine\Common\Collections\ArrayCollection;
    17	use Doctrine\ORM\EntityManagerInterface;
    18	use Eccube\Common\EccubeConfig;
    19	use Eccube\Entity\Customer;
    20	use Eccube\Entity\Master\Country;
    21	use Eccube\Entity\Master\OrderStatus;
    22	use Eccube\Entity\Order;
    23	use Eccube\Entity\Payment;
    24	use Eccube\Form\DataTransformer\EntityToIdTransformer;
    25	use Eccube\Form\Type\AddressType;
    26	use Eccube\Form\Type\KanaType;
    27	use Eccube\Form\Type\NameType;
    28	use Eccube\Form\Type\PriceType;
    29	use Eccube\Form\Type\SplitPhoneNumberType;
    30	use Eccube\Form\Type\SplitPostalType;
    31	use Eccube\Form\Validator\Email;
    32	use Eccube\Repository\Master\OrderStatusRepository;
    33	use Eccube\Service\OrderStateMachine;
    34	use Symfony\Bridge\Doctrine\Form\Type\EntityType;
    35	use Symfony\Component\Form\AbstractType;
    36	use Symfony\Component\Form\Extension\Core\Type\CollectionType;
    37	use Symfony\Component\Form\Extension\Core\Type\EmailType;
    38	use Symfony\Component\Form\Extension\Core\Type\HiddenType;
    39	use Symfony\Component\Form\Extension\Core\Type\IntegerType;
    40	use Symfony\Component\Form\Extension\Core\Type\TextareaType;
    41	use Symfony\Component\Form\Extension\Core\Type\TextType;
    42	use Symfony\Component\Form\FormBuilderInterface;
    43	use Symfony\Component\Form\FormError;
    44	use Symfony\Component\Form\FormEvent;
    45	use Symfony\Component\Form\FormEvents;
    46	use Symfony\Component\OptionsResolver\OptionsResolver;
    47	use Symfony\Component\Validator\Constraints as Assert;
    48	
    49	class OrderType extends AbstractType
    50	{
    51	    /**
    52	     * OrderType constructor.
    53	     */
    54	    public function __construct(protected EntityManagerInterface $entityManager, protected EccubeConfig $eccubeConfig, protected OrderStateMachine $orderStateMachine, protected OrderStatusRepository $orderStatusRepository)
    55	    {
    56	    }
    57	
    58	    /**
    59	     * {@inheritdoc}
    60	     *
    61	     * @param array<string, mixed> $options
    62	     */
    63	    #[\Override]
    64	    public function buildForm(FormBuilderInterface $builder, array $options): void
    65	    {
    66	        $Order = $options['data'] ?? null;
    67	
    68	        $builder
    69	            ->add('name', NameType::class, [
    70	                'required' => false,
    71	                'options' => [
    72	                    'constraints' => [
    73	                        new Assert\NotBlank(),
    74	                    ],
    75	                ],
    76	            ])
    77	            ->add('kana', KanaType::class, [
    78	                'required' => false,
    79	                'options' => [
    80	                    'constraints' => [
    81	                        new Assert\NotBlank(),
    82	                    ],
    83	                ],
    84	            ])
    85	            ->add('company_name', TextType::class, [
    86	                'required' => false,
    87	                'constraints' => [
    88	                    new Assert\Length(max: $this->eccubeConfig['eccube_stext_len']),
    89	                ],
    90	            ])
    91	            ->add('postalCode', SplitPostalType::class, [
    92	                'mapped' => false,
    93	                'required' => false,
    94	                'initial_postal_code' => $Order?->getPostalCode(),
    95	            ])
    96	            ->add('address', AddressType::class, [
    97	                'required' => false,
    98	                'pref_options' => [
    99	                    'constraints' => [
   100	                        new Assert\NotBlank(),
   101	                    ],
   102	                    'attr' => ['class' => 'p-region-id'],
   103	                ],
   104	                'addr01_options' => [
   105	                    'constraints' => [
   106	                        new Assert\NotBlank(),
   107	                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   108	                    ],
   109	                    'attr' => ['class' => 'p-locality p-street-address'],
   110	                ],
   111	                'addr02_options' => [
   112	                    'required' => false,
   113	                    'constraints' => [
   114	                        new Assert\NotBlank(),
   115	                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   116	                    ],
   117	                    'attr' => ['class' => 'p-extended-address'],
   118	                ],
   119	                'addr03_options' => [
   120	                    'required' => false,
   121	                    'constraints' => [
   122	                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   123	                    ],
   124	                    'attr' => [
   125	                        'class' => 'p-extended-address',
   126	                        'placeholder' => 'admin.common.address_sample_03',
   127	                    ],
   128	                ],
   129	            ])
   130	            ->add('email', EmailType::class, [

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php | sed -n '90,180p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    90	    #[\Override]
    91	    public static function getSubscribedEvents(): array
    92	    {
    93	        return [
    94	            'workflow.order.completed' => ['onCompleted'],
    95	            'workflow.order.transition.pay' => ['updatePaymentDate'],
    96	            'workflow.order.transition.cancel' => [['rollbackStock'], ['rollbackUsePoint']],
    97	            'workflow.order.transition.admin_cancel' => [['rollbackStock'], ['rollbackUsePoint']],
    98	            'workflow.order.transition.back_to_in_progress' => [['commitStock'], ['commitUsePoint']],
    99	            'workflow.order.transition.ship' => [['commitAddPoint']],
   100	            'workflow.order.transition.return' => [['rollbackUsePoint'], ['rollbackAddPoint']],
   101	            'workflow.order.transition.cancel_return' => [['commitUsePoint'], ['commitAddPoint']],
   102	        ];
   103	    }
   104	
   105	    /*
   106	     * Event handlers.
   107	     */
   108	    /**
   109	     * 入金日を更新する.
   110	     */
   111	    public function updatePaymentDate(Event $event): void
   112	    {
   113	        /* @var Order $Order */
   114	        $Order = $event->getSubject()->getOrder();
   115	        $Order->setPaymentDate(new \DateTime());
   116	    }
   117	
   118	    /**
   119	     * 会員の保有ポイントを減らす.
   120	     *
   121	     * @throws PurchaseFlow\PurchaseException
   122	     */
   123	    public function commitUsePoint(Event $event): void
   124	    {
   125	        /* @var Order $Order */
   126	        $Order = $event->getSubject()->getOrder();
   127	        $this->pointProcessor->prepare($Order, new PurchaseContext());
   128	    }
   129	
   130	    /**
   131	     * 利用ポイントを会員に戻す.
   132	     */
   133	    public function rollbackUsePoint(Event $event): void
   134	    {
   135	        /* @var Order $Order */
   136	        $Order = $event->getSubject()->getOrder();
   137	        $this->pointProcessor->rollback($Order, new PurchaseContext());
   138	    }
   139	
   140	    /**
   141	     * 在庫を減らす.
   142	     *
   143	     * @throws PurchaseFlow\PurchaseException
   144	     */
   145	    public function commitStock(Event $event): void
   146	    {
   147	        /* @var Order $Order */
   148	        $Order = $event->getSubject()->getOrder();
   149	        $this->stockReduceProcessor->prepare($Order, new PurchaseContext());
   150	    }
   151	
   152	    /**
   153	     * 在庫を戻す.
   154	     */
   155	    public function rollbackStock(Event $event): void
   156	    {
   157	        /* @var Order $Order */
   158	        $Order = $event->getSubject()->getOrder();
   159	        $this->stockReduceProcessor->rollback($Order, new PurchaseContext());
   160	    }
   161	
   162	    /**
   163	     * 会員に加算ポイントを付与する.
   164	     *
   165	     * Hareruyaのポイント付与は Order.gained_points をもとに PointService 側で行う。
   166	     * EC-CUBE標準の Order.add_point / Customer.point は使用しない。
   167	     */
   168	    public function commitAddPoint(Event $event): void
   169	    {
   170	        // 何もしない
   171	    }
   172	
   173	    /**
   174	     * 会員に付与した加算ポイントを取り消す.
   175	     *
   176	     * Hareruyaのポイント付与取消は Order.gained_points / Player.point 側で扱う。
   177	     */
   178	    public function rollbackAddPoint(Event $event): void
   179	    {
   180	        // 何もしない

 succeeded in 110ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/OrderStatusRepository.php:92:            ->createQuery('SELECT os FROM Eccube\Entity\Master\OrderStatus os INDEX BY os.id ORDER BY os.sort_no ASC')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:54:    public function __construct(protected EntityManagerInterface $entityManager, protected EccubeConfig $eccubeConfig, protected OrderStateMachine $orderStateMachine, protected OrderStatusRepository $orderStatusRepository)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:248:                    ->addOrderBy('p.sort_no', 'ASC'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:414:        $OrderStatuses = $this->orderStatusRepository->findBy([], ['sort_no' => 'ASC']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:423:            if (!$this->orderStateMachine->can($Order, $Status)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:524:            if (!$this->orderStateMachine->can($Order, $newStatus)) {

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php | sed -n '400,430p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   400	     * 受注ステータスのフォームを追加する
   401	     * 新規登録の際は, ユーザ編集不可のため追加しない.
   402	     *
   403	     * ステータスのプルダウンは, ステートマシンで遷移可能なステータスのみ表示する.
   404	     */
   405	    public function addOrderStatusForm(FormEvent $event): void
   406	    {
   407	        /** @var Order|null $Order */
   408	        $Order = $event->getData();
   409	        if (null === $Order || null === $Order->getId()) {
   410	            return;
   411	        }
   412	
   413	        /** @var OrderStatus[] $OrderStatuses */
   414	        $OrderStatuses = $this->orderStatusRepository->findBy([], ['sort_no' => 'ASC']);
   415	        $OrderStatuses = new ArrayCollection($OrderStatuses);
   416	
   417	        foreach ($OrderStatuses as $Status) {
   418	            // 同一ステータスはスキップ
   419	            if ($Order->getOrderStatus()->getId() == $Status->getId()) {
   420	                continue;
   421	            }
   422	            // 遷移できないステータスはリストから除外する.
   423	            if (!$this->orderStateMachine->can($Order, $Status)) {
   424	                $OrderStatuses->removeElement($Status);
   425	            }
   426	        }
   427	
   428	        $form = $event->getForm();
   429	        $form->add('OrderStatus', EntityType::class, [
   430	            'class' => OrderStatus::class,

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php | sed -n '428,455p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   428	        $form = $event->getForm();
   429	        $form->add('OrderStatus', EntityType::class, [
   430	            'class' => OrderStatus::class,
   431	            'choices' => $OrderStatuses,
   432	            'choice_label' => 'name',
   433	            'constraints' => [
   434	                new Assert\NotBlank(),
   435	            ],
   436	            // 変更前後のステータスチェックが必要なのでmapped => false で定義する.
   437	            'mapped' => false,
   438	            'data' => $Order->getOrderStatus(),
   439	        ]);
   440	    }
   441	
   442	    /**
   443	     * 単一配送時に, Shippingのフォームを追加する.
   444	     * 複数配送時はShippingの編集は行わない.
   445	     */
   446	    public function addShippingForm(FormEvent $event): void
   447	    {
   448	        /** @var Order|null $Order */
   449	        $Order = $event->getData();
   450	
   451	        // 複数配送時はShippingの編集は行わない
   452	        if ($Order && $Order->isMultiple()) {
   453	            return;
   454	        }
   455	

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '470,548p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   470	                $item->setMember($member);
   471	            }
   472	        };
   473	    }
   474	
   475	    /**
   476	     * フォーム送信後の処理。PurchaseFlow による検証とフラッシュメッセージ設定、`mode=register` 時は登録処理を実行.
   477	     *
   478	     * @param Request                         $request         リクエスト
   479	     * @param RouterInterface                 $router          登録完了後の `return_link` 解決に使用（{@see tryCommitOrderRegister} へ伝播）
   480	     * @param FormInterface                   $form            バインド済み受注フォーム
   481	     * @param FormBuilderInterface            $builder         イベント引数用（progress イベント）
   482	     * @param Order                           $TargetOrder     編集対象の受注
   483	     * @param Order                           $OriginOrder     編集前スナップショット
   484	     * @param ArrayCollection<int, OrderItem> $OriginItems     編集前に存在した明細（削除済み明細の remove 用）
   485	     * @param PurchaseContext                 $purchaseContext PurchaseFlowコンテキスト
   486	     *
   487	     * @return RedirectResponse|null 登録完了してリダイレクトするときのみ Response。再表示のときは null
   488	     */
   489	    private function handleSubmittedOrderEdit(
   490	        Request $request,
   491	        RouterInterface $router,
   492	        FormInterface $form,
   493	        FormBuilderInterface $builder,
   494	        Order $TargetOrder,
   495	        Order $OriginOrder,
   496	        ArrayCollection $OriginItems,
   497	        PurchaseContext $purchaseContext,
   498	    ): ?RedirectResponse {
   499	        if (!$form->isSubmitted() || !$form['OrderItems']->isValid()) {
   500	            return null;
   501	        }
   502	
   503	        if ($request->get('mode') === 'status_change') {
   504	            return $this->tryCommitOrderStatusChange($TargetOrder, $OriginOrder, $form);
   505	        }
   506	
   507	        if ($request->get('mode') === 'clear_date') {
   508	            return $this->tryClearOrderDate($request, $TargetOrder);
   509	        }
   510	
   511	        $event = new EventArgs(
   512	            [
   513	                'builder' => $builder,
   514	                'OriginOrder' => $OriginOrder,
   515	                'TargetOrder' => $TargetOrder,
   516	                'PurchaseContext' => $purchaseContext,
   517	            ],
   518	            $request
   519	        );
   520	        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_INDEX_PROGRESS);
   521	
   522	        $rollbackStockoutChanges = $this->applyStockoutChangesBeforeOrderPurchaseFlowValidate($TargetOrder, $OriginOrder);
   523	
   524	        $rollbackTemporaryItems = $this->appendTemporaryFinancialOrderItemsForFlow($TargetOrder);
   525	        try {
   526	            $flowResult = $this->orderPurchaseFlow->validate($TargetOrder, $purchaseContext);
   527	        } finally {
   528	            $rollbackTemporaryItems();
   529	        }
   530	
   531	        if ($flowResult->hasWarning()) {
   532	            foreach ($flowResult->getWarning() as $warning) {
   533	                $this->addWarning($warning->getMessage(), 'admin');
   534	            }
   535	        }
   536	
   537	        if ($flowResult->hasError()) {
   538	            $rollbackStockoutChanges();
   539	            foreach ($flowResult->getErrors() as $error) {
   540	                $this->addError($error->getMessage(), 'admin');
   541	            }
   542	        }
   543	
   544	        if ($request->get('mode') === 'register') {
   545	            return $this->tryCommitOrderRegister($request, $router, $form, $TargetOrder, $OriginOrder, $OriginItems, $purchaseContext, $flowResult);
   546	        }
   547	
   548	        return null;

codex
FALSE_POSITIVE | なし | 候補1・2とも、参照先自体に実装差分の根は存在するため誤検知とは判断しない | - | -

MISSED | ⑦エラー処理・試行制限 | 許可されない遷移先を強制送信した場合、設計は「受注編集画面を再表示し、ステータス変更不可エラーを表示」とするが、実装は `OrderType` でフォームエラーを付けた後、`tryCommitOrderStatusChange()` の `!$form->isValid()` でリダイレクトするため、インラインエラー表示が失われる可能性が高い | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:150-151`, `:292`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:523-531`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:768-769` | findingsへ追加。リダイレクトではなく再表示、またはフラッシュ等でエラーを保持する差分として扱う。

MISSED | ⑤画面表示・メッセージ | 設計は `admin.order.cancel.complete` に英語ロケール資源がないとして英語表示を `-` とするが、実装には英語文言 `Order cancellation completed.` が存在する | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:142-144`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2361` | 設計またはfindingに反映。重要度はlow相当。

SEVERITY | ⑦エラー処理・試行制限 | 候補2のlow/UNCERTAIN扱いは過小。設計は「購入処理上の例外」はエラーメッセージ表示・画面再表示を要求しているが、status_change確定処理は `wrapInTransaction()` 周辺に `PurchaseException` / `ShoppingException` / `InvalidArgumentException` のcatchがない。`OrderStateMachine` の購読処理は在庫・ポイント処理で `PurchaseException` を投げ得るため、通常の許可遷移でも500化し得る | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:304`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:798-824`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:690-708`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:121-128`, `:143-149` | 候補2はmed以上でCONFIRMED寄りに修正。register側と同等のcatch有無を差分根拠にする。

WEAK_EVIDENCE | ⑦エラー処理・試行制限 | 候補2は `md:302` の「不許可遷移時rollback」だけを主根拠にしており、より直接の設計根拠である `md:304` の「購入処理上の例外」を使っていない。また「実務上到達不能」とするが、PurchaseException系はステートマシン購読処理から到達し得るため根拠が弱い | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:302-304`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:123-128`, `:145-149` | designRefと説明を修正し、到達不能という断定を削除する。

VERDICT: false_positive=0, missed=2, weak_evidence=1, 総合=要修正
tokens used
149,158
FALSE_POSITIVE | なし | 候補1・2とも、参照先自体に実装差分の根は存在するため誤検知とは判断しない | - | -

MISSED | ⑦エラー処理・試行制限 | 許可されない遷移先を強制送信した場合、設計は「受注編集画面を再表示し、ステータス変更不可エラーを表示」とするが、実装は `OrderType` でフォームエラーを付けた後、`tryCommitOrderStatusChange()` の `!$form->isValid()` でリダイレクトするため、インラインエラー表示が失われる可能性が高い | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:150-151`, `:292`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:523-531`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:768-769` | findingsへ追加。リダイレクトではなく再表示、またはフラッシュ等でエラーを保持する差分として扱う。

MISSED | ⑤画面表示・メッセージ | 設計は `admin.order.cancel.complete` に英語ロケール資源がないとして英語表示を `-` とするが、実装には英語文言 `Order cancellation completed.` が存在する | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:142-144`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2361` | 設計またはfindingに反映。重要度はlow相当。

SEVERITY | ⑦エラー処理・試行制限 | 候補2のlow/UNCERTAIN扱いは過小。設計は「購入処理上の例外」はエラーメッセージ表示・画面再表示を要求しているが、status_change確定処理は `wrapInTransaction()` 周辺に `PurchaseException` / `ShoppingException` / `InvalidArgumentException` のcatchがない。`OrderStateMachine` の購読処理は在庫・ポイント処理で `PurchaseException` を投げ得るため、通常の許可遷移でも500化し得る | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:304`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:798-824`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:690-708`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:121-128`, `:143-149` | 候補2はmed以上でCONFIRMED寄りに修正。register側と同等のcatch有無を差分根拠にする。

WEAK_EVIDENCE | ⑦エラー処理・試行制限 | 候補2は `md:302` の「不許可遷移時rollback」だけを主根拠にしており、より直接の設計根拠である `md:304` の「購入処理上の例外」を使っていない。また「実務上到達不能」とするが、PurchaseException系はステートマシン購読処理から到達し得るため根拠が弱い | `/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:302-304`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:123-128`, `:145-149` | designRefと説明を修正し、到達不能という断定を削除する。

VERDICT: false_positive=0, missed=2, weak_evidence=1, 総合=要修正
