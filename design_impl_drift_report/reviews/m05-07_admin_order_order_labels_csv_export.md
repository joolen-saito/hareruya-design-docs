OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26a9-f2ba-73c0-9eab-c0977aa5ef30
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-07_admin_order_order_labels_csv_export
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-07_admin_order_order_labels_csv_export.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html
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
差分候補と設計書、実装参照を実際に読んで監査します。読み取り専用なので、まず対象JSONと関連ファイルの構造を確認します。
exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-07_admin_order_order_labels_csv_export.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-07_admin_order_order_labels_csv_export",
  "title": "m05-07_admin_order_order_labels_csv_export（管理画面_受注管理_送り状CSV出力）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html",
  "findings": [
    {
      "dimension": "②業務ルール・計算",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html:254",
      "designQuote": "注文確定日〜配送希望時間帯 | 注文日時、確定日時、受注に紐づく出荷日時、配送日・時間帯",
      "implRef": "src/Eccube/Repository/OrderRepository.php:710",
      "difference": "設計は当該日付列群の2番目の値を『確定日時』と規定し、リニューアル移行表(html:230)で確定日時=dtb_order.confirm_date(=getConfirmDate)と対応づける。しかし実装(getLabelsCsv)の2番目はgetCommitDate()(commit_date、DBコメント『出荷指示日』)を出力しており、getConfirmDate()(confirm_date『注文確定日』)は当メソッド内で一切呼ばれずCSVに出力されない。confirm_dateとcommit_dateが異なる受注では、設計の記述する『確定日時』の値と実際のCSV値(出荷指示日)がズレる。なお実CSVヘッダはこの列群で『注文確定日/出荷指示日/出荷日/配送希望日/配送希望時間帯』の順であり(ShippingStandbyCsvExporterService.php:63-67)、ヘッダ『出荷指示日』(64)にgetCommitDate()が対応する。設計プロセ文が commit_date(出荷指示日) を『確定日時』と誤ラベルしている実質。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "OrderRepository.php:709 getOrderDate() / 710 getCommitDate() / 711 getShippingDate() / 712 getShippingDeliveryDate() / 713 getShippingDeliveryTime()。getConfirmDate()はgetLabelsCsv(655-747)内で未呼出。Entity Order.php:666-667 confirm_date(comment 注文確定日)/getConfirmDate(1847)、669-670 commit_date(comment 出荷指示日)/getCommitDate(2174) は別カラム。ShippingStandbyCsvExporterService.php:63-67 ヘッダ 注文確定日/出荷指示日/出荷日/配送希望日/配送希望時間帯。設計 html:254(値記述)・html:230(確定日時=confirm_date対応)。"
    }
  ]
}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'pwd && rg --files /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube | head -200' in /home/y-saito/Developments/hareruya-design-docs
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
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/MailUtil.php
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-18_admin_order_order_shipping_standby_list_create.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/a05-01_api_order_print_direct.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-14_admin_order_order_status_change.json
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
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/CsvImportException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/HasSmaregiStockCannotDisableAlignmentException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/PluginApiException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/CartException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/CloudFileAccessedBeforeMergeException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/HasStockCannotAbolishException.php
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-20_admin_order_order_shipping_standby_detail_edit_delete.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-27_admin_order_order_waiting_tag.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-10_admin_order_order_print_delivery_slips_en.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-03_admin_order_order_custom_csv_export.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-08_admin_order_order_stack_paper_print.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-13_admin_order_order_tracking_number.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-26_admin_order_order_shipping_result_csv_import.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-12_admin_order_order_bulk_status_change.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/a05-02_api_order_print_direct.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-15_admin_order_order_mail.json
/tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-24_admin_order_order_shipping_export_for_import.json
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DataCollector/EccubeDataCollector.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Plugin/AbstractPluginManager.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/TemplateEvent.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/IpCheckSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EventArgs.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockJoinApprovalRequiredException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockMoveInstructionCreateException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockJoinMoveToShortageValidationException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockMoveInstructionDeleteException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Admin/Stock/StockSplitApprovalRequiredException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/RepositoryExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TwigIncludeExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallPluginController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Log/Processor/SessionProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Log/Processor/TokenProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Log/Logger.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/CsrfExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/EntryInvalidSecretKeyException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TemplateEventExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaxExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/EntryAlreadyActivatedException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/EntryActivateFailedException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeBlockExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/PurchaseCartLineLimitExceededException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/Front/EventCapacityExceededException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/SafeTextmailEscaperExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IgnoreTwigSandboxErrorExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IsAccessibleRouteExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IgnoreRoutingNotFoundExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/JsonDisplayExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IntlExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/CartServiceExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/PluginException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Loader/LocaleFilesystemLoader.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Template.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/HealthcheckController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MergeCartPostLoginListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/RestrictFileUploadListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LogListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/EnterpriseEccubeRememberMeRedirectListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MissingLocaleTemplateRedirectListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginPasswordLengthCheckListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TemplateUpdateListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/SecurityListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Sandbox/SecurityPolicyDecorator.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/AdminAutoLogoutListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/IpAddrListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TwoFactorAuthListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MobileTemplatePathListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/DeckBuilder/DeckAccessDeniedException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/DeckBuilder/AuthFailedException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/DeckBuilder/DeckNotFoundException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/DeckBuilder/PlayerNotFoundException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/DeckBuilder/InvalidCredentialsException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/DeckBuilder/InvalidRequestException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/DeckBuilder/FormatNotFoundException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/DeckBuilder/InvalidTokenException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/DeckBuilder/SystemErrorException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/BaseApiException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/MissingRequiredParameterException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/InvalidParameterException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/InternalException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/InvalidRequestParameterException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/InvalidStatusTransitionException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/InvalidMemberAssignmentException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/UnauthenticatedException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/InvalidTokenException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/ShoppingException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/ArchetypeController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/MasterController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/AbstractDeckBuilderController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CardController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/README.md
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Stream/Filter/SjisToUtf8EncodingFilter.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Stream/Filter/ConvertLineFeedFilter.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductFinder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ShopUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/MemberUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/Purchase/HistorySearchDataDto.php
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
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/OtcBuyOrder/HistorySearchDataDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/OtcBuyOrder/SearchDataDto.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiSectionUpsertMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiCustomerPointAddMessage.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/PriceDownBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/HareruyaChannelBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/NewItemsBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/CartBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/SearchProductBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/CSPHeaderListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/RateLimiterListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/UsedCardController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/EntityExtension.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/CreationTenantFlow.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/CartFlow.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/OrderFlow.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/ForwardOnly.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/ShoppingFlow.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/FormAppend.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/RecentlyViewedBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/RankingBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/BottomNavBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/LatestArticlesBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/MvCarouselBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/CategoryListBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/FavoritesBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/HeaderUserBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/RestockedBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/CategoryNavPcBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/PurchaseDetailedSearchModalBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/CategoryModalBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/ProductDetailedSearchModalBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/SaleBlockListener.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/FormUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/FilesystemUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/PriceUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/CacheUtil.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/MailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseHistoryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchProductController.php

 succeeded in 117ms:
<td>出荷指示編集で行をチェックし「送り状出力」を押す</td><td><code>POST /{admin_route}/standby/labels</code></td><td>チェック済み行から <code>data-shipping-id</code> を読み取り、同一名の hidden <code>ids[]</code> をフォームに付け足してから送信する。出荷 ID の列表が手順どおり送られる。</td></tr><tr><td>受注一覧でチェック無しのまま送信しようとする</td><td>（クリック時点で送信しない）</td><td>クライアントの <code>alert</code> で「チェックボックスが選択されていません」と返し、<code>preventDefault</code> する。</td></tr><tr><td><code>ids</code> が空または非配列でサーバに届く</td><td><code>GET</code> または <code>POST</code> いずれも同エンドポイント</td><td>HTTP 404 応答となる。</td></tr></tbody></table></div>
   235	<p>出荷指示側のスクリプトは送信前に <code>$('#form_bulk').removeAttr('target')</code> する。受注一覧側は <code>target</code> を消さないため、直前の別操作で <code>form_bulk</code> に <code>target</code> が残っていると、ダウンロードの開き方が意図と異なる場合がある（実装を確認値とする）。</p>
   236	<hr>
   237	<h2 id="フロント挙動">フロント挙動</h2>
   238	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>受注一覧では検索結果件数が正のとき一覧カード内に <code>form_bulk</code> が描画され、その中に「送り状出力」ボタン（<code>id="labelsExport"</code>）がある。各行チェックボックスは <code>name="ids[]"</code>、<code>value</code> は当該行の出荷 ID。出荷指示編集ではチェックボックス名が <code>order_ids</code> 系であり、送り状出力時だけ hidden の <code>ids[]</code> を組み立てる。</td></tr><tr><td>JS 挙動</td><td>受注一覧では未チェック時に <code>alert</code> で止める。送り状出力クリックで <code>form_bulk</code> の <code>action</code> だけを <code>admin_labels_export</code> に差し替えて <code>submit</code> する。出荷指示側では既存の <code>ids[]</code> を一旦除去し、選択行の <code>data-shipping-id</code> から hidden を追加する。</td></tr><tr><td>CSS・レイアウト</td><td>本機能専用の追加スタイルはない。</td></tr><tr><td>モーダル・ポップアップ</td><td>出力前の確認ダイアログはない。</td></tr></tbody></table></div>
   239	<hr>
   240	<h2 id="処理フロー">処理フロー</h2>
   241	<h3 id="CSV-をダウンロードする-admin-labels-export">CSV をダウンロードする（<code>admin_labels_export</code>）</h3>
   242	<ol><li>管理画面の認証・共通制約を通過する。</li><li><code>set_time_limit(0)</code> で PHP の実行時間制限を無効にする。</li><li>リクエストから <code>ids</code> を取得する。配列でない、または空配列のとき HTTP 404 を返す。</li><li>エクスポート種別文字列 <code>labels</code> と <code>ids</code> を渡し、送り状 CSV 用エクスポータを呼ぶ。</li><li>エクスポータは <code>StreamedResponse</code> を生成する。コールバック内で共通の CSV エクスポートサービスを開き、UTF-8 の場合は BOM を付与する実装に従う。</li><li>ヘッダ行を <code>fputcsv</code> で 1 行書く。列名はサービス定数 <code>CSV_TYPES['labels']['header']</code> の順序どおりである。</li><li>受注リポジトリの「ラベル CSV 用」取得処理に出荷 ID 配列を渡し、返った各行について <code>fputcsv</code> する。0 件のときはヘッダのみのファイルとなる。</li><li>ストリームを閉じる。</li><li>ファイル名は接頭辞 <code>labels_</code> と日時（<code>YmdHis</code>）と拡張子 <code>.csv</code> を連結する。</li><li>応答ヘッダに <code>Content-Type: application/octet-stream</code> と <code>Content-Disposition: attachment; filename=…</code> を付与する。</li><li>リクエスト処理の流れのなかで情報ログに「送り状CSV出力完了」とファイル名が記録される。</li></ol>
   243	<h3 id="不正なエクスポート種別をコードから渡した場合">不正なエクスポート種別をコードから渡した場合</h3>
   244	<ol><li>エクスポータは例外を送出する。通常の受注画面からは種別文字列 <code>labels</code> 以外は呼ばれない。</li></ol>
   245	<hr>
   246	<h2 id="集計条件">集計条件</h2>
   247	<div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>商品総重量</td><td>受注に結合した各受注明細について「商品マスタの重量 × 数量」を積み上げ、同一受注 ID でグループ化した合計値を 1 行に載せる。出荷 ID だけがクエリの絞り込み条件である。</td></tr></tbody></table></div>
   248	<hr>
   249	<h2 id="データ取得クエリの要点">データ取得クエリの要点</h2>
   250	<ul><li>受注を起点に、都道府県マスタ・会員・受注明細・商品・出荷・配送方法を結合する。</li><li>出荷の主キーが <code>ids</code> に含まれる行に限定する。</li><li>受注 ID でグループ化するため、同一受注に複数の出荷が <code>ids</code> に含まれる場合、SQL 上は 1 行に畳み込まれる。データ行の配送先などは受注に紐づく出荷コレクションの先頭要素を参照する実装であり、どの出荷 ID に対応する行かと一致しない場合がある（実装を確認値とする）。</li><li>受注明細と商品の内部結合のため、該当する明細が存在しない受注は結果に現れない。</li></ul>
   251	<hr>
   252	<h2 id="出力列と値の対応-業務ルール">出力列と値の対応（業務ルール）</h2>
   253	<p>ヘッダ行の並びは送り状CSV用エクスポータ内の固定配列どおりである。データ行は取得処理が同じ順序で <code>row</code> に値を追加する。</p>
   254	<div class="table-wrap"><table><thead><tr><th>列名（ヘッダ）</th><th>内容</th></tr></thead><tbody><tr><td>注文番号</td><td>受注の注文番号。</td></tr><tr><td>注文金額合計</td><td>受注合計。</td></tr><tr><td>注文者氏名〜注文者電話番号</td><td>受注の注文者情報。電話は <code>tel01</code>〜<code>tel03</code> の連結。部署列は空文字固定。</td></tr><tr><td>贈り主氏名〜贈り主電話番号</td><td>注文者と同一の文字列を繰り返し立てる。部署列は空文字固定。</td></tr><tr><td>注文コメント</td><td>受注メッセージ。</td></tr><tr><td>注文備考(社内用)</td><td>受注備考。</td></tr><tr><td>備考(内部用)</td><td>空文字固定。</td></tr><tr><td>注文確定日〜配送希望時間帯</td><td>注文日時、確定日時、受注に紐づく出荷日時、配送日・時間帯。日時は <code>Y/m/d H:i:s</code>、無ければ空。</td></tr><tr><td>商品金額合計</td><td>受注小計。</td></tr><tr><td>送料・送料(税抜)</td><td>いずれも受注の送料合計と同一値。</td></tr><tr><td>手数料・手数料(税抜)</td><td>いずれも受注の手数料と同一値。</td></tr><tr><td>のし・ラッピング手数料、のし・ラッピング手数料(税抜)、送料・手数料税率</td><td>空文字固定。</td></tr><tr><td>配送先番号</td><td>数値リテラル <code>1</code> 固定。</td></tr><tr><td>荷物問い合わせURL</td><td>空文字固定。</td></tr><tr><td>送り状No.</td><td>空文字固定（追跡番号列はヘッダに存在するが値は埋めない）。</td></tr><tr><td>配送先氏名〜配送先電話番号</td><td>出荷のお届け先。部署名は空文字固定。電話は連結。</td></tr><tr><td>郵便種別</td><td>配送方法マスタの主キーがリポジトリ定義に存在するときだけマッピング値を立てる。例として ID <code>3</code> は <code>0</code>、ID <code>4</code> は <code>8</code>。それ以外は空。</td></tr><tr><td>発送方法</td><td>配送方法名。</td></tr><tr><td>発送先国コード</td><td>出荷の国があれば 2 文字の国コード、無ければ空。</td></tr><tr><td>商品総重量</td><td>クエリで集計した重量。</td></tr><tr><td>発送方法コード</td><td>配送方法 ID がリポジトリの別マップに存在するときコード文字列、それ以外は空。例として ID <code>8</code> は <code>111</code>、<code>9</code> は <code>521</code>、<code>11</code> は <code>321</code>。</td></tr></tbody></table></div>
   255	<p>マップのキーはソース上は文字列だが、取得 ID は整数でも参照される（実装を確認値とする）。</p>
   256	<hr>
   257	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   258	<p>本機能では画面フォームからの永続化更新は行わない。CSV の値のうち税抜と思われる列に税込と同一数値を載せる部分はリポジトリ実装どおりであり、会計上の意味は本書で確定しない。</p>
   259	<h3 id="入力項目">入力項目</h3>
   260	<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>（チェックボックスに紐づく出荷の選択）</td><td>送信時は実質必須</td><td>文字数上限はフォーム上もサーバ上も専用制約なし（配列要素は出荷 ID の整数）</td><td>受注一覧では各行の出荷 ID が <code>value</code>。</td><td>POST パラメータ名 <code>ids[]</code>。未選択のままではクライアントで送信を止める。</td></tr></tbody></table></div>

codex
候補JSONには1件だけあります。次に、その参照先の実装行と周辺のルート/エクスポータ/テンプレートを確認し、候補以外の見落としがないか設計の主要節と照合します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html | sed -n '260,420p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   260	<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>（チェックボックスに紐づく出荷の選択）</td><td>送信時は実質必須</td><td>文字数上限はフォーム上もサーバ上も専用制約なし（配列要素は出荷 ID の整数）</td><td>受注一覧では各行の出荷 ID が <code>value</code>。</td><td>POST パラメータ名 <code>ids[]</code>。未選択のままではクライアントで送信を止める。</td></tr></tbody></table></div>
   261	<p>本機能は店舗設定フォームの保存を持たない。一覧から渡るのはチェックされた出荷 ID の列表のみである。</p>
   262	<h3 id="エッジケース">エッジケース</h3>
   263	<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>POST の <code>ids</code> が空または非配列</td><td>HTTP 404 応答。</td></tr><tr><td><code>ids</code> に存在しない出荷 ID のみが含まれる</td><td>データ行は 0 件となり、ヘッダのみの CSV を返す（エラーにしない）。</td></tr><tr><td>同一受注に複数出荷があり、複数 ID を同時に選ぶ</td><td>クエリは受注 ID で畳み込み、データ行は 1 行にまとまりうる。配送先などは受注に紐づく出荷コレクションの先頭参照に依存する。</td></tr><tr><td>受注に商品明細が無く結合に合わない</td><td>結果セットに現れない。</td></tr><tr><td>クライアントの <code>target</code> が前操作のまま残る（受注一覧）</td><td>新しいタブや別ウィンドウでダウンロードが開く場合がある（実装を確認値とする）。</td></tr></tbody></table></div>
   264	<hr>
   265	<h2 id="データ整合性">データ整合性</h2>
   266	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧の表示値と CSV</td><td>CSV は実行時点で DB を再取得して組み立てる。一覧表示直後に別セッションでデータが変わっていれば CSV は変更後の内容となる。</td></tr><tr><td>出荷単位の一意性</td><td>クエリは受注単位で畳み込む。複数出荷を同時に選んだ場合、出力される配送先は受注に紐づく出荷コレクションの先頭に依存し、選択した各行 ID との 1 対 1 対応は保証されない。</td></tr><tr><td>受注明細なし</td><td>商品明細の結合に合致しない受注は行として返らない。</td></tr></tbody></table></div>
   267	<hr>
   268	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   269	<p>本機能では外部 HTTP API 呼び出し・バッチ実行を扱わない。</p>
   270	<hr>
   271	<h2 id="入出力">入出力</h2>
   272	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>POST（または GET）の <code>ids</code> 配列。要素は出荷 ID の整数。受注一覧のフォームには CSRF 用 hidden がある。</td></tr><tr><td>成功時出力</td><td><code>labels_</code> + 日時 + <code>.csv</code>。本文はストリーミング。</td></tr><tr><td>失敗時出力</td><td><code>ids</code> 不備時は HTTP 404。不正種別は例外（画面経路では通常発生しない）。</td></tr><tr><td>副作用</td><td>DB の更新・削除は行わない。</td></tr></tbody></table></div>
   273	<hr>
   274	<h2 id="DBカラム">DBカラム</h2>
   275	<p>本機能は参照のみ行う。主に参照しうる列の例を挙げる。型の細部はスキーマを正とする。</p>
   276	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_order</code></td><td>注文番号、合計、氏名、カナ、住所、電話、メッセージ、備考、各種日時、小計、送料、手数料</td><td>注文者・金額・日付のソース。</td></tr><tr><td><code>dtb_shipping</code></td><td>お届け先、配送日・時間、配送方法、国</td><td>配送先と配送サービス。</td></tr><tr><td><code>dtb_order_item</code></td><td>数量</td><td>重量集計に使用。</td></tr><tr><td><code>dtb_product</code></td><td>重量</td><td>集計に使用。</td></tr><tr><td><code>dtb_delivery</code></td><td>ID、名称</td><td>郵便種別・発送方法コードのマッピングキー。</td></tr></tbody></table></div>
   277	<h3 id="DB操作">DB操作</h3>
   278	<p>本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。</p>
   279	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>検索</td><td>dtb_delivery / dtb_order / dtb_order_item / dtb_product / dtb_shipping</td><td>検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。</td></tr></tbody></table></div>
   280	<hr>
   281	<h2 id="バリデーション">バリデーション</h2>
   282	<p>サーバ側でフォーム型による検証は行わない。出荷 ID の存在確認で 404 にする実装もなく、存在しない ID は結果 0 行となりヘッダのみの CSV となりうる。</p>
   283	<hr>
   284	<h2 id="権限・認可">権限・認可</h2>
   285	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>送り状CSV出力</th></tr></thead><tbody><tr><td>管理画面に入れない利用者</td><td>当エンドポイントへ到達できない。</td></tr><tr><td>管理画面の通常運用者</td><td>受注・出荷業務の一部として同一コントローラ群の権限制約に従う（詳細は管理画面共通の認可設定を正とする）。</td></tr></tbody></table></div>
   286	<hr>
   287	<h2 id="画面遷移">画面遷移</h2>
   288	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>送り状出力が成功</td><td>現状ページを離れず、ブラウザがファイルダウンロードとして応答を扱う。</td></tr><tr><td><code>ids</code> 不備</td><td>HTTP 404 応答。</td></tr></tbody></table></div>
   289	<h3 id="遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</h3>
   290	<p>受注一覧の検索セッションは本リクエストでは更新しない。CSV の対象件数はセッションではなく POST パラメータの ID 集合で決まる。</p>
   291	<hr>
   292	<h2 id="エラー処理">エラー処理</h2>
   293	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td><code>ids</code> が配列でない、または空</td><td>HTTP 404 応答。</td></tr><tr><td>エクスポート種別が未知</td><td>例外により処理が中断される。画面経路では種別は固定文字列のみ。</td></tr></tbody></table></div>
   294	<hr>
   295	<h2 id="試行制限">試行制限</h2>
   296	<p>本機能では試行制限を扱わない。</p>
   297	<hr>
   298	<h2 id="ログ・監査">ログ・監査</h2>
   299	<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>ストリーム応答の組み立て完了時</td><td>情報ログに「送り状CSV出力完了」とファイル名。</td></tr></tbody></table></div>
   300	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   301	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie 値</li><li>セッション ID の完全値</li><li>Remember Me トークンの原値</li></ul>
   302	<hr>
   303	<h2 id="セッション">セッション</h2>
   304	<p>本機能の処理本体は受注検索セッションを読み書きしない。フォームに CSRF トークンが載るのは画面描画時の仕組みどおりである。</p>
   305	<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
   306	<p>CSV の中身や選択 ID 一覧をセッションに残す処理はない。</p>
   307	<hr>
   308	<h2 id="Cookie">Cookie</h2>
   309	<p>本機能単体で新たに Cookie を設定しない。</p>
   310	<hr>
   311	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   312	<p>読取のみであり、楽観・悲観ロックや明示トランザクション境界は本機能が持たない。</p>
   313	<hr>
   314	<h2 id="調査補助-grep-向け">調査補助（grep 向け）</h2>
   315	<p>次の文字列やシンボル名は実装照合用であり、業務説明の主語にはしない。</p>
   316	<ul><li>ルート名 <code>admin_labels_export</code></li><li><code>ShippingStandbyCsvExporterService::exportByIds</code></li><li><code>OrderRepository::getLabelsCsv</code></li><li>定数 <code>POST_TYPE</code> / <code>WORLD_POST_TYPE</code>（<code>OrderRepository</code> 内）</li><li>ID 不備時にコントローラが送出する HTTP 層の 404 例外型</li><li>種別不正時にエクスポータが送出する実行時例外型</li></ul>
   317	<hr>
   318	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   319	<ul><li><code>admin_labels_export</code> … <code>GET, POST</code> … <code>/{admin_route}/standby/labels</code>（リクエストの <code>ids</code>（配列）を出荷 ID として解釈し、該当する受注単位の固定フォーマット CSV をストリーム返却する。）</li></ul>
   320	<h2 id="関連機能との違い-混同防止">関連機能との違い（混同防止）</h2>
   321	<div class="table-wrap"><table><thead><tr><th>項目</th><th>送り状CSV（本書）</th><th>出荷CSVダウンロード（別）</th></tr></thead><tbody><tr><td>ルート</td><td><code>admin_labels_export</code></td><td><code>admin_order_export_shipping</code></td></tr><tr><td>列定義</td><td>コード内固定</td><td><code>dtb_csv</code>（配送種別）と画面設定</td></tr><tr><td>行の単位</td><td>受注クエリ結果（実質受注＋集計重量。複数出荷選択時は注意）</td><td>受注明細をループし CSV 行を増やす</td></tr><tr><td>検索条件の反映</td><td>受注一覧フォームからの POST では検索セッションと無関係に ID のみ</td><td>GET で開き、セッションの検索条件で対象受注を決める</td></tr></tbody></table></div>
   322	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   323	    </main>
   324	  </div>
   325	</body>
   326	</html>

exec
/bin/bash -lc 'rg -n "getLabelsCsv|labels|labelsExport|admin_labels_export|ShippingStandbyCsvExporterService|送り状CSV|送り状出力|output_labels" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app /home/y-saito/Developments/ec-cube-enterprise/templates 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 exited 2 in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:315:     * 送り状CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:317:    #[Route(path: '/%eccube_admin_route%/product/stock/move-instruction/labels', name: 'admin_stock_move_instruction_labels_export', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:56:use Eccube\Service\Csv\Exporter\ShippingStandbyCsvExporterService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:105:        protected ShippingStandbyCsvExporterService $shippingStandbyCsvExporterService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:753:     * 送り状CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:757:    #[Route(path: '/%eccube_admin_route%/standby/labels', name: 'admin_labels_export', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:764:        $exportType = 'labels';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:209:        $labels = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:212:                $labels[] = $label;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:216:        return $labels;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:389:        $labels = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:392:                $labels[] = $label;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:396:        return $labels;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Event/list.twig:15:    {% set _chip_labels = [] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Event/list.twig:17:        {% set _chip_labels = _chip_labels|merge([_chip.label]) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Event/list.twig:19:    {% set subtitle = 'front.seo.event_list.subtitle'|trans({'%chips%': _chip_labels|join('/')}) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Event/index.twig:280:        <script type="application/json" data-event-labels{% if csp_nonce is defined %} nonce="{{ csp_nonce }}"{% endif %}>{{ {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:32:        const labels = {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:146:            $header.append($('<p class="p-hareruya-header__search-history-title"></p>').text(labels.history));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:147:            const $clearAll = $('<button type="button" class="p-hareruya-header__search-history-clear-all" data-search-history-clear-all></button>').text(labels.deleteAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:166:                    $delete.attr('aria-label', word + labels.deleteOneSuffix);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:480:                    $delete.attr('aria-label', word + labels.deleteOneSuffix);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/format_sales.twig:58:                data: { labels: days, datasets: datasets },
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:343:                <form id="form_stock_move_instruction_label_csv" method="post" action="{{ url('admin_stock_move_instruction_labels_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:213:     * 送り状CSV用の移動指示一覧を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:651:     * 受注管理　送り状CSV用データ取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:655:    public function getLabelsCsv(array $ids): mixed
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryListRowBuilder.php:79:                $labels = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryListRowBuilder.php:83:                    $labels[] = $full !== '' ? $full : trim($p->getNickname() ?? '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryListRowBuilder.php:85:                $name01 = implode('、', array_filter($labels));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:43:            // 送り状CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:44:            $('#labelsExport').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:46:                $('#form_bulk').attr('action', "{{ url('admin_labels_export') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:129:                                                    <button type="button" id="labelsExport" class="btn btn-primary btn-sm edit submit">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:25: * 在庫移動指示向け送り状CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:87:        $filename = 'stock_move_instruction_labels_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:91:        log_info('在庫移動指示 送り状CSV出力完了. ファイル名: '.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:133:     * 店舗の会社名と店名を、送り状CSV用に「会社名 + 半角空白 + 店名」で連結する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:142:     * 店舗の会社名カナと店名カナを、送り状CSV用に「会社名(カナ) + 半角空白 + 店名(カナ)」で連結する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:22:class ShippingStandbyCsvExporterService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:31:     * CSVヘッダー定義 - 送り状CSV向け
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:33:     * @var array{labels: array{header: array<int, string>}}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:36:        'labels' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:140:        log_info('送り状CSV出力完了. ファイル名: '.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:155:            'labels' => $this->orderRepository->getLabelsCsv(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:486:front.privacy.s9.li2: "When entrusting the handling of personal information to contracted companies with confidentiality agreements, within the scope necessary to achieve the stated purposes of use (e.g., contracted companies include delivery companies, printing companies for catalog address labels, credit card companies when card payment is requested, etc.)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1572:# action labels
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:64:                    var labels = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:69:                        labels.push(key);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:80:                            labels: labels,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:192:            // 送り状CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:193:            $('#labelsExport').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:198:                $('#form_bulk').attr('action', "{{ url('admin_labels_export') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1211:                                            <button type="button" id="labelsExport" class="btn btn-ec-conversion px-5">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1212:                                                {{ 'admin.order.output_labels_Export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2450:admin.order.output_labels_Export: 送り状出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5236:admin.stock.move_instruction.csv_download_invoice: 送り状CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5237:admin.stock.move_instruction.csv_invoice_select_rows: 送り状CSVを出力する在庫移動指示にチェックを入れてください。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:70667:	 (36118,22621,1,1,183,849,1,NULL,'','My doors are called trespassing, my signatures, forgeries. They don''t respect my talents, and I don''t respect their labels.','(２)(青)：クリーチャー１体を対象とする。このターン、それはブロックされない。','','','','50',0,false,0,'2018-10-03 20:42:14+09','2025-07-31 21:47:33+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:82186:	 (41334,22621,1,1,183,849,1,NULL,'','My doors are called trespassing, my signatures, forgeries. They don''t respect my talents, and I don''t respect their labels.','(２)(青)：クリーチャー１体を対象とする。このターン、それはブロックされない。','','','','50',1,false,0,'2019-03-12 02:05:19+09','2025-07-31 21:47:33+09'),

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '620,770p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   620	    public function updateOrderSummary(Customer $Customer, array $OrderStatuses = [OrderStatus::NEW, OrderStatus::PAID, OrderStatus::DELIVERED, OrderStatus::IN_PROGRESS]): void
   621	    {
   622	        try {
   623	            $result = $this->createQueryBuilder('o')
   624	                ->select('COUNT(o.id) AS buy_times, SUM(o.total) AS buy_total, MIN(o.id) AS first_order_id, MAX(o.id) AS last_order_id')
   625	                ->where('o.Customer = :Customer')
   626	                ->andWhere('o.OrderStatus in (:OrderStatuses)')
   627	                ->setParameter('Customer', $Customer)
   628	                ->setParameter('OrderStatuses', $OrderStatuses)
   629	                ->groupBy('o.Customer')
   630	                ->getQuery()
   631	                ->getSingleResult();
   632	        } catch (NoResultException) {
   633	            // 受注データが存在しなければ初期化
   634	            $Customer->setFirstBuyDate();
   635	            $Customer->setLastBuyDate();
   636	            $Customer->setBuyTimes('0');
   637	            $Customer->setBuyTotal('0');
   638	
   639	            return;
   640	        }
   641	
   642	        $FirstOrder = $this->find(['id' => $result['first_order_id']]);
   643	        $LastOrder = $this->find(['id' => $result['last_order_id']]);
   644	        $Customer->setBuyTimes((string) $result['buy_times']);
   645	        $Customer->setBuyTotal((string) $result['buy_total']); // buy_totalはdecimal(12,2)のためstring
   646	        $Customer->setFirstBuyDate($FirstOrder->getOrderDate());
   647	        $Customer->setLastBuyDate($LastOrder->getOrderDate());
   648	    }
   649	
   650	    /**
   651	     * 受注管理　送り状CSV用データ取得
   652	     *
   653	     * @param int[] $ids
   654	     */
   655	    public function getLabelsCsv(array $ids): mixed
   656	    {
   657	        // 受注を基準に、総重量は商品.重量 × 受注明細.注文数を積算する
   658	        $qb = $this->createQueryBuilder('o');
   659	        $qb->select('o', 'sum(p.weight * oi.quantity) as totalWeight')
   660	            ->join('o.Pref', 'op')
   661	            ->join('o.OrderItems', 'oi')
   662	            ->join('oi.Product', 'p')
   663	            ->join('o.Customer', 'c')
   664	            ->join('o.Shippings', 's')
   665	            ->join('s.Delivery', 'd')
   666	            ->where($qb->expr()->in('s.id', ':ids'))
   667	            ->groupBy('o.id')
   668	            ->setParameter('ids', $ids)
   669	        ;
   670	
   671	        $rtn = [];
   672	        foreach ($qb->getQuery()->getResult() as $value) {
   673	            $row = [];
   674	            $totalWeight = $value['totalWeight'];
   675	            $order = $value[0];
   676	            $pref = $order->getPref();
   677	            $shipping = $order->getShippings()[0];
   678	            $country = $shipping->getCountry();
   679	            $customer = $order->getCustomer();
   680	
   681	            // 注文番号
   682	            $row[] = $order->getOrderNumber() ?? '';
   683	            // 注文者
   684	            $row[] = $order->getTotal();
   685	            $row[] = $order->getName01().' '.$order->getName02();
   686	            $row[] = trim(($order->getKana01() ?? '').' '.($order->getKana02() ?? ''));
   687	            $row[] = $order->getPostalCode() ?? '';
   688	            $row[] = $order->getPref()->getName();
   689	            $row[] = $order->getAddr01() ?? '';
   690	            $row[] = $order->getAddr02() ?? '';
   691	            $row[] = $order->getAddr03() ?? '';
   692	            $row[] = $order->getCompanyName() ?? '';
   693	            $row[] = '';
   694	            $row[] = ($order->getTel01() ?? '').($order->getTel02() ?? '').($order->getTel03() ?? '');
   695	            // 贈り主
   696	            $row[] = $order->getName01().' '.$order->getName02();
   697	            $row[] = trim(($order->getKana01() ?? '').' '.($order->getKana02() ?? ''));
   698	            $row[] = $order->getPostalCode() ?? '';
   699	            $row[] = $order->getPref()->getName();
   700	            $row[] = $order->getAddr01() ?? '';
   701	            $row[] = $order->getAddr02() ?? '';
   702	            $row[] = $order->getAddr03() ?? '';
   703	            $row[] = $order->getCompanyName() ?? '';
   704	            $row[] = '';
   705	            $row[] = ($order->getTel01() ?? '').($order->getTel02() ?? '').($order->getTel03() ?? '');
   706	            $row[] = $order->getMessage() ?? '';
   707	            $row[] = $order->getNote() ?? '';
   708	            $row[] = '';
   709	            $row[] = $order->getOrderDate() ? $order->getOrderDate()->format('Y/m/d H:i:s') : '';
   710	            $row[] = $order->getCommitDate() ? $order->getCommitDate()->format('Y/m/d H:i:s') : '';
   711	            $row[] = $order->getShippingDate() ? $order->getShippingDate()->format('Y/m/d H:i:s') : '';
   712	            $row[] = $shipping->getShippingDeliveryDate() ? $shipping->getShippingDeliveryDate()->format('Y/m/d H:i:s') : '';
   713	            $row[] = $shipping->getShippingDeliveryTime() ?? '';
   714	            $row[] = $order->getSubTotal();
   715	            $row[] = $order->getDeliveryFeeTotal();
   716	            $row[] = $order->getDeliveryFeeTotal();
   717	            $row[] = $order->getCharge();
   718	            $row[] = $order->getCharge();
   719	            $row[] = '';
   720	            $row[] = '';
   721	            $row[] = '';
   722	            $row[] = 1;
   723	            $row[] = '';
   724	            $row[] = '';
   725	            // 配送先
   726	            $row[] = $shipping->getName01().' '.$shipping->getName02();
   727	            $row[] = trim(($shipping->getKana01() ?? '').' '.($shipping->getKana02() ?? ''));
   728	            $row[] = $shipping->getPostalCode() ?? '';
   729	            $row[] = $shipping->getPref()?->getName() ?? '';
   730	            $row[] = $shipping->getAddr01() ?? '';
   731	            $row[] = $shipping->getAddr02() ?? '';
   732	            $row[] = $shipping->getAddr03() ?? '';
   733	            $row[] = $shipping->getCompanyName() ?? '';
   734	            $row[] = '';
   735	            $row[] = ($shipping->getTel01() ?? '').($shipping->getTel02() ?? '').($shipping->getTel03() ?? '');
   736	            $deliveryId = $shipping->getDelivery()->getId();
   737	            // 国オブジェクトが存在する場合 国ID（例: "JP", "US"）を $row 配列に追加、存在しない場合は空文字列を追加
   738	            $row[] = isset(self::POST_TYPE[$deliveryId]) ? self::POST_TYPE[$deliveryId] : '';
   739	            $row[] = $shipping->getDelivery()->getName();
   740	            $row[] = $shipping->getCountry() ? $shipping->getCountry()->getCountryCode2() : '';
   741	            $row[] = $totalWeight;
   742	            $row[] = isset(self::WORLD_POST_TYPE[$deliveryId]) ? self::WORLD_POST_TYPE[$deliveryId] : '';
   743	            $rtn[] = $row;
   744	        }
   745	
   746	        return $rtn;
   747	    }
   748	
   749	    /**
   750	     * スマレジ再送信対象の受注を取得
   751	     */
   752	    public function getResendSmaregiProduct(): mixed
   753	    {
   754	        $qb = $this->createQueryBuilder('os');
   755	
   756	        return $qb->where('os.smaregi_code is not null')
   757	            ->andWhere('os.smaregi_del_flg = :delFlg')
   758	            ->andWhere($qb->expr()->orX(
   759	                $qb->expr()->eq('os.smaregi_product_flg', ':productFlg'),
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

codex
実装側では、候補が参照している `getLabelsCsv` は存在し、日付列の実装も確認できました。見落とし確認のため、コントローラ、CSVヘッダ定数、画面JS、Entityの対象カラム定義を続けて読んでいます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php | sed -n '730,785p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   730	     */
   731	    #[Route(path: '/%eccube_admin_route%/order/print/delivery_slips/{lang}', name: 'admin_delivery_slips_export', requirements: ['lang' => 'ja|en'], methods: ['GET', 'POST'])]
   732	    public function bulkPrintDeliverySlip(Request $request, string $lang): Response
   733	    {
   734	        // タイムアウトを無効にする.
   735	        set_time_limit(0);
   736	
   737	        $ids = $request->get('ids', []);
   738	
   739	        if (!is_array($ids) || $ids === []) {
   740	            throw new NotFoundHttpException();
   741	        }
   742	
   743	        $DeliverySlips = $this->dtbShippingStandbyRepository->generateDeliverySlips($lang !== 'ja', $ids);
   744	        $BaseInfo = $this->baseInfoRepository->getMallBaseInfo();
   745	
   746	        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
   747	            'DeliverySlips' => $DeliverySlips,
   748	            'BaseInfo' => $BaseInfo,
   749	        ]);
   750	    }
   751	
   752	    /**
   753	     * 送り状CSV出力
   754	     *
   755	     * @return Response
   756	     */
   757	    #[Route(path: '/%eccube_admin_route%/standby/labels', name: 'admin_labels_export', methods: ['GET', 'POST'])]
   758	    public function exportLabelCsv(Request $request): Response
   759	    {
   760	        // タイムアウトを無効にする.
   761	        set_time_limit(0);
   762	
   763	        // CSV出力タイプ.
   764	        $exportType = 'labels';
   765	
   766	        // 受注一覧 / 出荷指示一覧の双方から ids(shipping_id) を受け取る
   767	        $ids = $request->get('ids', []);
   768	
   769	        if (!is_array($ids) || $ids === []) {
   770	            throw new NotFoundHttpException();
   771	        }
   772	
   773	        return $this->shippingStandbyCsvExporterService->exportByIds(
   774	            $exportType,
   775	            $ids,
   776	        );
   777	    }
   778	
   779	    /**
   780	     * 出荷指示リストを生成
   781	     *
   782	     * @param Request $request
   783	     *
   784	     * @return RedirectResponse
   785	     */

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php | sed -n '1,190p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Csv\Exporter;
    17	
    18	use Eccube\Repository\OrderRepository;
    19	use Eccube\Service\CsvExportService;
    20	use Symfony\Component\HttpFoundation\StreamedResponse;
    21	
    22	class ShippingStandbyCsvExporterService
    23	{
    24	    public function __construct(
    25	        protected CsvExportService $csvExportService,
    26	        protected OrderRepository $orderRepository,
    27	    ) {
    28	    }
    29	
    30	    /**
    31	     * CSVヘッダー定義 - 送り状CSV向け
    32	     *
    33	     * @var array{labels: array{header: array<int, string>}}
    34	     */
    35	    private const CSV_TYPES = [
    36	        'labels' => [
    37	            'header' => [
    38	                '注文番号',
    39	                '注文金額合計',
    40	                '注文者氏名',
    41	                '注文者カナ',
    42	                '注文者郵便番号',
    43	                '注文者都道府県',
    44	                '注文者住所',
    45	                '注文者住所2',
    46	                '注文者住所3',
    47	                '注文者会社',
    48	                '注文者部署',
    49	                '注文者電話番号',
    50	                '贈り主氏名',
    51	                '贈り主カナ',
    52	                '贈り主郵便番号',
    53	                '贈り主都道府県',
    54	                '贈り主住所',
    55	                '贈り主住所2',
    56	                '贈り主住所3',
    57	                '贈り主会社',
    58	                '贈り主部署',
    59	                '贈り主電話番号',
    60	                '注文コメント',
    61	                '注文備考(社内用)',
    62	                '備考(内部用)',
    63	                '注文確定日',
    64	                '出荷指示日',
    65	                '出荷日',
    66	                '配送希望日',
    67	                '配送希望時間帯',
    68	                '商品金額合計',
    69	                '送料',
    70	                '送料(税抜)',
    71	                '手数料',
    72	                '手数料(税抜)',
    73	                'のし・ラッピング手数料',
    74	                'のし・ラッピング手数料(税抜)',
    75	                '送料・手数料税率',
    76	                '配送先番号',
    77	                '荷物問い合わせURL',
    78	                '送り状No.',
    79	                '配送先氏名',
    80	                '配送先カナ',
    81	                '配送先郵便番号',
    82	                '配送先都道府県',
    83	                '配送先住所',
    84	                '配送先住所2',
    85	                '配送先住所3',
    86	                '配送先会社名',
    87	                '配送先部署名',
    88	                '配送先電話番号',
    89	                '郵便種別',
    90	                '発送方法',
    91	                '発送先国コード',
    92	                '商品総重量',
    93	                '発送方法コード',
    94	            ],
    95	        ],
    96	    ];
    97	
    98	    /**
    99	     * @param array<int, int> $ids
   100	     */
   101	    public function exportByIds(
   102	        string $exportType,
   103	        array $ids,
   104	    ): StreamedResponse {
   105	        if (!isset(self::CSV_TYPES[$exportType])) {
   106	            throw new \InvalidArgumentException('Invalid export type: '.$exportType);
   107	        }
   108	
   109	        $header = self::CSV_TYPES[$exportType]['header'];
   110	
   111	        $response = new StreamedResponse();
   112	        $response->setCallback(function () use (
   113	            $header,
   114	            $exportType,
   115	            $ids,
   116	        ): void {
   117	            $this->csvExportService->fopen();
   118	
   119	            // ヘッダー出力
   120	            $this->csvExportService->fputcsv($header);
   121	
   122	            // データ取得（選択されたIDでフィルタリング）
   123	            $datas = $this->getDataByExportType($exportType, $ids);
   124	
   125	            foreach ($datas as $row) {
   126	                // データ出力
   127	                $this->csvExportService->fputcsv($row);
   128	            }
   129	
   130	            $this->csvExportService->fclose();
   131	        });
   132	        $now = new \DateTime();
   133	        $filename = $exportType.'_'.$now->format('YmdHis').'.csv';
   134	        $response->headers->set('Content-Type', 'application/octet-stream');
   135	        $response->headers->set(
   136	            'Content-Disposition',
   137	            'attachment; filename='.$filename,
   138	        );
   139	
   140	        log_info('送り状CSV出力完了. ファイル名: '.$filename);
   141	
   142	        return $response;
   143	    }
   144	
   145	    /**
   146	     * @param array<int, int> $ids
   147	     *
   148	     * @return iterable<array<int, int|string>>
   149	     */
   150	    private function getDataByExportType(
   151	        string $exportType,
   152	        array $ids,
   153	    ): iterable {
   154	        return match ($exportType) {
   155	            'labels' => $this->orderRepository->getLabelsCsv(
   156	                $ids
   157	            ),
   158	            default => throw new \InvalidArgumentException('Invalid export type: '.$exportType),
   159	        };
   160	    }
   161	}

exec
/bin/bash -lc 'rg -n "confirm_date|commit_date|function getConfirmDate|function getCommitDate|OrderNumber|order_no" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
46:     * @method string|null getOrderNumber()
47:     * @method Order setOrderNumber(?string $order_number)
141:     * @method list<string> getOtcSmaregiLinkedOrderNumbers()
142:     * @method Order setOtcSmaregiLinkedOrderNumbers(list<string> $otcSmaregiLinkedOrderNumbers)
149:    #[ORM\Index(columns: ['order_no'], name: 'dtb_order_order_no_idx')]
464:        #[ORM\Column(name: 'order_no', type: Types::STRING, length: 255, nullable: true)]
465:        private ?string $order_no = null;
666:        #[ORM\Column(name: 'confirm_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '注文確定日'])]
669:        #[ORM\Column(name: 'commit_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '出荷指示日'])]
795:        private array $otcSmaregiLinkedOrderNumbers = [];
879:            $this->order_no = $orderNo;
889:            return $this->order_no;
1768:        public function getOrderNumber(): ?string
1773:        public function setOrderNumber(?string $order_number): Order
1847:        public function getConfirmDate(): ?\DateTime
2174:        public function getCommitDate(): ?\DateTime
2412:        public function getOtcSmaregiLinkedOrderNumbers(): array
2414:            return $this->otcSmaregiLinkedOrderNumbers;
2420:         * @param list<string> $otcSmaregiLinkedOrderNumbers
2422:        public function setOtcSmaregiLinkedOrderNumbers(array $otcSmaregiLinkedOrderNumbers): Order
2424:            $this->otcSmaregiLinkedOrderNumbers = $otcSmaregiLinkedOrderNumbers;

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '180,205p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '1190,1220p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig | sed -n '38,58p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig | sed -n '120,135p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
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
    38	                $('#form_bulk').removeAttr('target');
    39	                $('#form_bulk').attr('action', "{{ url('admin_order_export_for_input') }}");
    40	                $('#form_bulk').submit();
    41	                return false;
    42	            });
    43	            // 送り状CSV出力
    44	            $('#labelsExport').on('click', function(event) {
    45	                $('#form_bulk').removeAttr('target');
    46	                $('#form_bulk').attr('action', "{{ url('admin_labels_export') }}");
    47	                $('#form_bulk input[name="ids[]"]').remove();
    48	                $('#form_bulk input[type="checkbox"][name^="order_ids"]:checked').each(function() {
    49	                    var shippingId = $(this).data('shipping-id');
    50	                    if (shippingId) {
    51	                        $('#form_bulk').append($('<input>', {
    52	                            type: 'hidden',
    53	                            name: 'ids[]',
    54	                            value: shippingId
    55	                        }));
    56	                    }
    57	                });
    58	                $('#form_bulk').submit();
   120	                                                    <button type="button" id="printDeliverySlipsJp" class="btn btn-primary btn-sm edit">
   121	                                                        {{ 'admin.order.print_delivery_slips_ja'|trans }}
   122	                                                    </button>
   123	                                                    <button type="button" id="printDeliverySlipsEn" class="btn btn-primary btn-sm edit">
   124	                                                        {{ 'admin.order.print_delivery_slips_en'|trans }}
   125	                                                    </button>
   126	                                                    <button type="button" id="orderExportForInput" class="btn btn-primary btn-sm edit submit">
   127	                                                        {{ 'admin.order.shipping_export_for_import'|trans }}
   128	                                                    </button>
   129	                                                    <button type="button" id="labelsExport" class="btn btn-primary btn-sm edit submit">
   130	                                                        {{ 'admin.stock.move_instruction.csv_download_invoice'|trans }}
   131	                                                    </button>
   132	                                                </ul>
   133	                                            </div>
   134	                                        </div>
   135	                                        <div id="result_list_main__body" class="box-body">

codex
候補の「confirm_date と commit_date の取り違え」については、設計書の移行表・本文・CSVヘッダ・Entityコメントまで根拠が揃っています。一方で設計主要節を読むと、CSVストリームのBOM記述に追加で怪しい点があるため、共通CSVサービス側を確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php | sed -n '1,220p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	use Doctrine\Common\Collections\Collection;
    17	use Doctrine\Common\Util\ClassUtils;
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Doctrine\ORM\QueryBuilder;
    20	use Eccube\Common\EccubeConfig;
    21	use Eccube\Entity\AbstractEntity;
    22	use Eccube\Entity\Csv;
    23	use Eccube\Entity\DtbCsvExtension;
    24	use Eccube\Entity\Master\CsvType;
    25	use Eccube\Entity\Order;
    26	use Eccube\Entity\Product;
    27	use Eccube\Entity\ProductStock;
    28	use Eccube\Form\Type\Admin\SearchCustomerType;
    29	use Eccube\Form\Type\Admin\SearchOrderType;
    30	use Eccube\Form\Type\Admin\SearchProductType;
    31	use Eccube\Form\Type\Admin\SearchStockListType;
    32	use Eccube\Repository\CsvRepository;
    33	use Eccube\Repository\CustomerRepository;
    34	use Eccube\Repository\Master\CsvTypeRepository;
    35	use Eccube\Repository\OrderRepository;
    36	use Eccube\Repository\ProductRepository;
    37	use Eccube\Repository\ProductStockRepository;
    38	use Eccube\Repository\ShippingRepository;
    39	use Eccube\Service\Admin\Stock\ActionInput\StockListSearchInput;
    40	use Eccube\Util\FormUtil;
    41	use Knp\Component\Pager\Pagination\AbstractPagination;
    42	use Knp\Component\Pager\PaginatorInterface;
    43	use Symfony\Component\Form\FormFactoryInterface;
    44	use Symfony\Component\HttpFoundation\Request;
    45	
    46	class CsvExportService
    47	{
    48	    /**
    49	     * @var resource|null
    50	     */
    51	    protected $fp;
    52	
    53	    protected bool $closed = false;
    54	
    55	    protected ?\Closure $convertEncodingCallBack = null;
    56	
    57	    protected ?QueryBuilder $qb = null;
    58	
    59	    protected ?CsvType $CsvType = null;
    60	
    61	    /**
    62	     * @var Csv[]|null
    63	     */
    64	    protected ?array $Csvs = null;
    65	
    66	    /**
    67	     * CsvExportService constructor.
    68	     */
    69	    public function __construct(protected ?EntityManagerInterface $entityManager, protected CsvRepository $csvRepository, protected CsvTypeRepository $csvTypeRepository, protected OrderRepository $orderRepository, protected ShippingRepository $shippingRepository, protected CustomerRepository $customerRepository, protected ProductRepository $productRepository, protected EccubeConfig $eccubeConfig, protected FormFactoryInterface $formFactory, protected PaginatorInterface $paginator, protected ?ProductStockRepository $productStockRepository = null)
    70	    {
    71	    }
    72	
    73	    public function setConfig(EccubeConfig $config): void
    74	    {
    75	        $this->eccubeConfig = $config;
    76	    }
    77	
    78	    public function setCsvRepository(CsvRepository $csvRepository): void
    79	    {
    80	        $this->csvRepository = $csvRepository;
    81	    }
    82	
    83	    public function setCsvTypeRepository(CsvTypeRepository $csvTypeRepository): void
    84	    {
    85	        $this->csvTypeRepository = $csvTypeRepository;
    86	    }
    87	
    88	    public function setOrderRepository(OrderRepository $orderRepository): void
    89	    {
    90	        $this->orderRepository = $orderRepository;
    91	    }
    92	
    93	    public function setCustomerRepository(CustomerRepository $customerRepository): void
    94	    {
    95	        $this->customerRepository = $customerRepository;
    96	    }
    97	
    98	    public function setProductRepository(ProductRepository $productRepository): void
    99	    {
   100	        $this->productRepository = $productRepository;
   101	    }
   102	
   103	    public function setEntityManager(EntityManagerInterface $entityManager): void
   104	    {
   105	        $this->entityManager = $entityManager;
   106	    }
   107	
   108	    public function getEntityManager(): EntityManagerInterface
   109	    {
   110	        return $this->entityManager;
   111	    }
   112	
   113	    public function setExportQueryBuilder(QueryBuilder $qb): void
   114	    {
   115	        $this->qb = $qb;
   116	    }
   117	
   118	    /**
   119	     * Csv種別からServiceの初期化を行う.
   120	     */
   121	    public function initCsvType(CsvType|int $CsvType): void
   122	    {
   123	        if ($CsvType instanceof CsvType) {
   124	            $this->CsvType = $CsvType;
   125	        } else {
   126	            $this->CsvType = $this->csvTypeRepository->find($CsvType);
   127	        }
   128	
   129	        $criteria = [
   130	            'CsvType' => $CsvType,
   131	            'enabled' => true,
   132	        ];
   133	        $orderBy = [
   134	            'sort_no' => 'ASC',
   135	        ];
   136	        $this->Csvs = $this->csvRepository->findBy($criteria, $orderBy);
   137	    }
   138	
   139	    /**
   140	     * Csv拡張から必要な情報をセット(initCsvTypeの代わり).
   141	     *
   142	     * @param DtbCsvExtension $CsvExtension
   143	     */
   144	    public function setCsvsAndCsvType(DtbCsvExtension $CsvExtension): void
   145	    {
   146	        $this->CsvType = $CsvExtension->getCsvType();
   147	        $this->Csvs = $CsvExtension->getCsvs();
   148	    }
   149	
   150	    /**
   151	     * @return Csv[]
   152	     */
   153	    public function getCsvs(): array
   154	    {
   155	        return $this->Csvs;
   156	    }
   157	
   158	    /**
   159	     * ヘッダ行を出力する.
   160	     * このメソッドを使う場合は, 事前にinitCsvType($CsvType)で初期化しておく必要がある.
   161	     */
   162	    public function exportHeader(): void
   163	    {
   164	        if (is_null($this->CsvType) || empty($this->Csvs)) {
   165	            throw new \LogicException('init csv type incomplete.');
   166	        }
   167	
   168	        $row = [];
   169	        foreach ($this->Csvs as $Csv) {
   170	            $row[] = $Csv->getDispName();
   171	        }
   172	
   173	        $this->fopen();
   174	        $this->fputcsv($row);
   175	        $this->fclose();
   176	    }
   177	
   178	    /**
   179	     * クエリビルダにもとづいてデータ行を出力する.
   180	     * このメソッドを使う場合は, 事前にsetExportQueryBuilder($qb)で出力対象のクエリビルダをわたしておく必要がある.
   181	     *
   182	     * @param \Closure(mixed $result, CsvExportService $service): void $closure
   183	     */
   184	    public function exportData(\Closure $closure): void
   185	    {
   186	        if (is_null($this->qb) || is_null($this->entityManager)) {
   187	            throw new \LogicException('query builder not set.');
   188	        }
   189	
   190	        $this->fopen();
   191	
   192	        $page = 1;
   193	        $limit = 100;
   194	        while ($results = $this->paginator->paginate($this->qb, $page, $limit)) {
   195	            /** @var AbstractPagination<int, mixed> $results */
   196	            if (!$results->valid()) {
   197	                break;
   198	            }
   199	
   200	            foreach ($results as $result) {
   201	                $closure($result, $this);
   202	                flush();
   203	            }
   204	
   205	            $this->entityManager->clear();
   206	            $page++;
   207	        }
   208	
   209	        $this->fclose();
   210	    }
   211	
   212	    /**
   213	     * CSV出力項目と比較し, 合致するデータを返す.
   214	     */
   215	    public function getData(Csv $Csv, AbstractEntity $entity): ?string
   216	    {
   217	        // エンティティ名が一致するかどうかチェック.
   218	        $csvEntityName = str_replace('\\\\', '\\', $Csv->getEntityName());
   219	        $entityName = ClassUtils::getClass($entity);
   220	        if ($csvEntityName !== $entityName) {

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '650,675p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '1838,1855p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '2166,2182p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
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
  1838	        }
  1839	
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
  2166	            return $this;
  2167	        }
  2168	
  2169	        public function getPhoneNumber(): ?string
  2170	        {
  2171	            return sprintf('%s%s%s', $this->getTel01(), $this->getTel02(), $this->getTel03());
  2172	        }
  2173	
  2174	        public function getCommitDate(): ?\DateTime
  2175	        {
  2176	            return $this->commitDate;
  2177	        }
  2178	
  2179	        public function setCommitDate(?\DateTime $commitDate): Order
  2180	        {
  2181	            $this->commitDate = $commitDate;
  2182	

exec
/bin/bash -lc 'rg -n "class CsvExportService|function fopen|fwrite|BOM|bom|UTF-8|fputcsv|php://output|convert" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Stream /home/y-saito/Developments/ec-cube-enterprise/config 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 exited 2 in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Stream/Filter/SjisToUtf8EncodingFilter.php:102:        return \mb_convert_encoding($string, 'UTF-8', 'SJIS-win');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Stream/Filter/ConvertLineFeedFilter.php:30:            $bucket->data = StringUtil::convertLineFeed($bucket->data);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvImportService.php:103:        if (!\mb_check_encoding($file->current(), 'UTF-8')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvImportService.php:104:            // UTF-8 が検出できなかった場合は SJIS-win の stream filter を適用する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvImportService.php:178:        // UTF-8 BOM (U+FEFF) を各ヘッダー先頭から除去（Excel等で保存したCSVで付くことがあるため）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvImportService.php:350:                fwrite($tempFile, $line);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/QrCodeService.php:53:            encoding: new Encoding('UTF-8'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:94:    public function convertExportCsvRows(array $entity): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:168:        // UTF-8以外（Shift-JISなど）なら、UTF-8に変換する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:169:        if ($encode !== null && $encode !== 'UTF-8') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:170:            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', $encode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:173:        $fileContent = StringUtil::convertLineFeed($fileContent);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:181:        fwrite($tmp, $fileContent);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:400:     * ゼロ幅スペース・BOM を除去する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryCsv.php:59:        $csvRows = $this->convertExportCsvRows($StockHistories);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryCsv.php:68:            $this->csvExportService->fputcsv($headerKeys);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryCsv.php:70:                $this->csvExportService->fputcsv(array_map(fn (string $key) => $row[$key] ?? '', $headerKeys));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryCsv.php:90:    public function convertExportCsvRows(array $StockHistories): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityProxyService.php:208:        $newTraitTokens = $this->convertTraitNameToTokens($trait);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityProxyService.php:288:    private function convertTraitNameToTokens(string $name): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:226:        $csvRows = $this->convertExportCsvRows($Cards);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:235:            $this->csvExportService->fputcsv($headerKeys);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:237:                $this->csvExportService->fputcsv(array_map(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:292:    public function convertExportCsvRows(array $Cards): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:582:            ->setManaCost($this->convertManaCost((string) ($row['mana_cost'] ?? '')))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:1001:    private function convertManaCost(string $manaCost): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:252:            $this->csvExportService->fputcsv(array_keys($csvHeader));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:255:                $this->csvExportService->fputcsv($this->convertExportCsvRow($inventoryPlanDetail, $csvHeader));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:273:    public function convertExportCsvRow(array $inventoryPlanDetail, array $csvHeader): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:742:     * php://output に CSV を書き込むコールバック（StreamedResponse 用）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:753:            $out = fopen('php://output', 'w');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:755:                throw new \RuntimeException('ProductAllCsv: could not open php://output');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:757:            if ($enc === '' || strcasecmp($enc, 'UTF-8') === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:758:                fwrite($out, "\xEF\xBB\xBF");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:760:            fputcsv($out, $this->encodeCsvRow($headers, $enc), $sep, '"', '\\');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:794:            fputcsv($out, $this->encodeCsvRow($line, $enc), $sep, '"', '\\');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:1369:        if ($enc === '' || strcasecmp($enc, 'UTF-8') === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:1375:            $out[] = mb_convert_encoding($f, $toEnc, 'UTF-8');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:1382:     * eccube_csv_export_encoding を mb_convert_encoding の第2引数向けに正規化する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:140:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:206:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:269:            ->to($this->convertRFCViolatingEmail($email))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:358:            ->to($this->convertRFCViolatingEmail($formData['email']))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:446:                    'PaymentLink' => new Markup($PaymentLink, 'UTF-8'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:456:            'header' => new Markup($header, 'UTF-8'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:469:            ->to($this->convertRFCViolatingEmail($Order->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:496:        MailUtil::convertMessage($this->eccubeConfig, $message);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:543:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:600:            ->to($this->convertRFCViolatingEmail($Order->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:655:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:721:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:787:            ->to($this->convertRFCViolatingEmail($Order->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:898:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:929:            $message->to($this->convertRFCViolatingEmail($userData['preEmail']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:969:    public function convertRFCViolatingEmail(string $email): Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1005:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1031:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1068:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1114:            ->to($this->convertRFCViolatingEmail($customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1173:            ->to($this->convertRFCViolatingEmail($otcBuyOrderAccountingPaymentPendingMailAddress->getOptionValue()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1301:            ->to($this->convertRFCViolatingEmail($address))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1356:            ->to($this->convertRFCViolatingEmail($address))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1421:            ->to($this->convertRFCViolatingEmail($buyOrder->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1478:            ->to($this->convertRFCViolatingEmail($BuyOrder->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1534:            ->to($this->convertRFCViolatingEmail($buyOrder->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1573:            ->to($this->convertRFCViolatingEmail($input->BuyOrder->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1618:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1671:            ->to($this->convertRFCViolatingEmail($alertMailAddress))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1718:            ->to($this->convertRFCViolatingEmail($Member->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1778:            ->to($this->convertRFCViolatingEmail($address))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1813:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1919:            ->to($this->convertRFCViolatingEmail($email))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2103:        MailUtil::convertMessage($this->eccubeConfig, $message);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2184:            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2266:            ->to($this->convertRFCViolatingEmail($address))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2311:            ->to($this->convertRFCViolatingEmail($mailAddressString))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2316:        MailUtil::convertMessage($this->eccubeConfig, $message);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2369:                    'PaymentLink' => new Markup($PaymentLink, 'UTF-8'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2379:            'header' => new Markup($header, 'UTF-8'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2391:            ->to($this->convertRFCViolatingEmail($Order->getEmail()))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2405:        MailUtil::convertMessage($this->eccubeConfig, $message);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:46:class CsvExportService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:55:    protected ?\Closure $convertEncodingCallBack = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:174:        $this->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:262:        return fn ($value) => mb_convert_encoding(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:263:            (string) $value, $config['eccube_csv_export_encoding'], 'UTF-8'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:267:    public function fopen(): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:270:            $this->fp = fopen('php://output', 'w');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:275:            if (strtoupper((string) $encoding) === 'UTF-8') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:276:                fwrite($this->fp, "\xEF\xBB\xBF");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:284:    public function fputcsv(array $row): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:286:        if (is_null($this->convertEncodingCallBack)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:287:            $this->convertEncodingCallBack = $this->getConvertEncodingCallback();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:290:        fputcsv($this->fp, array_map($this->convertEncodingCallBack, $row), $this->eccubeConfig['eccube_csv_export_separator'], '"', '\\');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:399:            $csvExportService->fputcsv($ExportCsvRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:429:            $csvExportService->fputcsv($ExportCsvRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:484:        $csvExportService->fputcsv($ExportCsvRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:508:            $csvExportService->fputcsv($ExportCsvRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:187:        $file->fwrite($this->buildTsvLine($this->normalizeRowToUtf8($this->getHeader())));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:419:            $file->fwrite($this->buildTsvLine($formatted));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:543:                    ['UTF-8', 'SJIS-win', 'SJIS', 'EUC-JP', 'JIS', 'ISO-2022-JP', 'ASCII'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:546:                if ($enc && $enc !== 'UTF-8') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:547:                    return mb_convert_encoding($v, 'UTF-8', $enc);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:756:        fwrite($handle, (string) getmypid());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:120:                    $item = $this->convertCardsetNode($cardsetNode, $locale);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:194:            $item['children'][] = $this->convertCardsetNode($cardsetNode, $locale);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:209:    private function convertCardsetNode(array $cardsetNode, string $locale): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:215:        $converted = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:225:            $converted['children'] = array_map(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:226:                fn (array $child): array => $this->convertCardsetNode($child, $locale),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:231:        return $converted;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvValue.php:40:    private ConverterInterface $converter;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvValue.php:54:        $this->converter = NoActionConverter::getInstance();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvValue.php:70:        return $this->converter->convert($this->originalValue);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvValue.php:106:     * @param ConverterInterface $converter 値を変換するもの
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvValue.php:110:    public function setConverter(ConverterInterface $converter): self
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvValue.php:112:        $this->converter = $converter;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Converter/StringArrayConverter.php:41:    public function convert(string $value): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Converter/ConverterInterface.php:28:    public function convert(string $value): mixed;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:59:        $csvRows = $this->convertExportCsvRows($StockHistories);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:68:            $this->csvExportService->fputcsv($headerKeys);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:70:                $this->csvExportService->fputcsv(array_map(fn (string $key) => $row[$key] ?? '', $headerKeys));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:90:    public function convertExportCsvRows(array $StockHistories): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Converter/IntArrayConverter.php:41:    public function convert(string $value): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventSearchInput.php:157:        $normalized = trim(mb_convert_kana($this->term, 's', 'UTF-8'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Converter/Repository/PromotionIdByNameJpConverter.php:43:    public function convert(string $value): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:86:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:93:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvColumn.php:43:    private ConverterInterface $converter;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvColumn.php:56:        $this->converter = NoActionConverter::getInstance();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvColumn.php:126:     * @param ConverterInterface $converter 値の変換を行うもの
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvColumn.php:130:    public function setConverter(ConverterInterface $converter): self
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvColumn.php:132:        $this->converter = $converter;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvColumn.php:214:        $value->setConverter($this->converter);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCsvImporter.php:71:     * 在庫移動実績CSV用の CsvImportService（BOM除去・列数パディング対応）を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCsvImportService.php:22: * テンプレートDLのBOM付きUTF-8・列数ずれに対応するため setColumnHeaders / current をオーバーライドする。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCsvImportService.php:27:     * ヘッダー設定時に先頭列からUTF-8 BOMを除去する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:58:                $this->csvExportService->fputcsv(self::CSV_HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:61:                    $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:132:            $csvService->fputcsv($exportCsvRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Converter/Repository/SellGroupIdByNameConverter.php:43:    public function convert(string $value): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:43:            $this->csvExportService->fputcsv($header);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:52:                $this->csvExportService->fputcsv($line);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:57:                $this->csvExportService->fputcsv(self::CSV_HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:60:                    $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Util/SmaregiFieldFormatter.php:24:     * 商品名 (productName) の文字数上限 (UTF-8 文字基準).
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Util/SmaregiFieldFormatter.php:30:        if (mb_strlen($name, 'UTF-8') <= self::PRODUCT_NAME_MAX_LENGTH) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Util/SmaregiFieldFormatter.php:34:        return mb_substr($name, 0, self::PRODUCT_NAME_MAX_LENGTH, 'UTF-8');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Converter/IntConverter.php:30:    public function convert(string $value): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:77:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:136:            $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:83:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:90:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Converter/NoActionConverter.php:51:    public function convert(string $value): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:52:                // exportHeader と exportData で二度 fopen すると BOM がデータ先頭にも付くため、ヘッダーは exportData
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:65:                            $csvService->fputcsv($headerRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:85:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:93:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:70:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:88:                    $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:63:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:74:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:71:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:78:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:72:            $csvService->fputcsv(array_keys($this->csvHeader));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:76:                $csvService->fputcsv($csvRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:51:        $csvRows = $this->convertExportCsvRows($Products, $this->baseInfoRepository->getMallBaseInfo());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:58:            $this->csvExportService->fputcsv(array_keys($this->csvHeader));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:61:                $this->csvExportService->fputcsv($csvRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:82:    public function convertExportCsvRows(array $Products, ?BaseInfo $mainBaseInfo = null): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:120:            $this->csvExportService->fputcsv($header);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:127:                $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:117:        $csvExportService->fputcsv($exportRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:49:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:60:                    $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:58:        $csvRows = $this->convertExportCsvRows($Products, $this->baseInfoRepository->getMallBaseInfo());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:67:            $this->csvExportService->fputcsv($headerKeys);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:69:                $this->csvExportService->fputcsv(array_map(fn (string $key) => $row[$key] ?? '', $headerKeys));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:92:    public function convertExportCsvRows(array $Products, ?BaseInfo $mainBaseInfo = null): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:88:            $this->csvExportService->fputcsv($headerRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:98:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:108:            $this->csvExportService->fputcsv($exportHeader);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:110:                $this->csvExportService->fputcsv([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:92:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:100:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:56:        $csvRows = $this->convertExportCsvRows($Products, $this->baseInfoRepository->getMallBaseInfo());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:65:            $this->csvExportService->fputcsv($headerKeys);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:67:                $this->csvExportService->fputcsv(array_map(fn (string $key) => $row[$key] ?? '', $headerKeys));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:90:    public function convertExportCsvRows(array $Products, ?BaseInfo $mainBaseInfo = null): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:74:                $this->csvExportService->fputcsv(self::HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:79:                    $this->csvExportService->fputcsv($this->buildRow($Instruction));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:63:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:70:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:73:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:86:                    $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:78:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:85:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:48:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:55:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:290:                $mainList = $this->convertCardsToText($mainCards);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:582:    private function convertCardsToText(array $cards): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:70:            $this->csvExportService->fputcsv(self::CSV_HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:73:                $this->csvExportService->fputcsv([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:100:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:111:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:37:    /** カテゴリ名(日)・カテゴリ名(英)・検索パラメータの CSV 最大文字数（UTF-8） */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:78:            $this->csvExportService->fputcsv($header);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:80:                $this->csvExportService->fputcsv($this->buildCsvRow($Deck));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:88:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:95:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:78:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:85:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:75:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:82:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:49:            $this->csvExportService->fputcsv([self::HEADER_PRODUCT_CODE, self::HEADER_SHORTAGE_QTY]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:52:                $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:75:        $orderName = htmlspecialchars($Order['name_kana'] ?: $Order['name'], ENT_XML1, 'UTF-8');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:77:        $orderNumber = htmlspecialchars((string) $Order['order_number'], ENT_XML1, 'UTF-8');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:78:        $smaregiCode = htmlspecialchars((string) $Order['smaregi_code'], ENT_XML1, 'UTF-8');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/StringMaxLengthValidator.php:22: * 文字列項目に対し、UTF-8 の文字数（コードポイント）の上限を検証する ValidatorInterface 実装。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/StringMaxLengthValidator.php:52:        if (mb_strlen($value->getOriginalValue(), 'UTF-8') > $this->maxLength) {

codex
BOMの記述は共通サービス実装と一致しており、見落とし候補からは外しました。残りは候補JSON自体の根拠の強さと、設計全体に対する追加の重大差分有無をまとめます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php | sed -n '250,295p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   250	            // スカラ値の場合はそのまま.
   251	            return $data;
   252	        }
   253	    }
   254	
   255	    /**
   256	     * 文字エンコーディングの変換を行うコールバック関数を返す.
   257	     */
   258	    public function getConvertEncodingCallback(): \Closure
   259	    {
   260	        $config = $this->eccubeConfig;
   261	
   262	        return fn ($value) => mb_convert_encoding(
   263	            (string) $value, $config['eccube_csv_export_encoding'], 'UTF-8'
   264	        );
   265	    }
   266	
   267	    public function fopen(): void
   268	    {
   269	        if (is_null($this->fp) || $this->closed) {
   270	            $this->fp = fopen('php://output', 'w');
   271	            $this->closed = false;
   272	
   273	            $encoding = $this->eccubeConfig['eccube_csv_export_encoding'] ?? 'SJIS-win';
   274	            // Excelを開いたときに文字化けを防ぐため
   275	            if (strtoupper((string) $encoding) === 'UTF-8') {
   276	                fwrite($this->fp, "\xEF\xBB\xBF");
   277	            }
   278	        }
   279	    }
   280	
   281	    /**
   282	     * @param array<int, string|int> $row
   283	     */
   284	    public function fputcsv(array $row): void
   285	    {
   286	        if (is_null($this->convertEncodingCallBack)) {
   287	            $this->convertEncodingCallBack = $this->getConvertEncodingCallback();
   288	        }
   289	
   290	        fputcsv($this->fp, array_map($this->convertEncodingCallBack, $row), $this->eccubeConfig['eccube_csv_export_separator'], '"', '\\');
   291	    }
   292	
   293	    public function fclose(): void
   294	    {
   295	        if (!$this->closed) {

codex
追加で、候補JSONに無いUI文言差分を1件確認しました。対象機能の主処理ではなく表示文言なので影響は低いですが、設計書の「画面上のボタン文言」と出荷指示編集画面の実装が一致していません。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '2446,2453p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '5233,5239p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  2446	admin.order.orderer_name: 注文者名
  2447	admin.order.orderer_kana: 注文者名(カナ)
  2448	admin.order.orderer_company_name: 注文者会社名
  2449	admin.order.copy_orderer: 注文者情報をコピー
  2450	admin.order.output_labels_Export: 送り状出力
  2451	admin.order.output_delivery_note: 納品書を出力
  2452	admin.order.output_delivery_note_short: 納品書出力
  2453	admin.order.print_delivery_slips_ja: 納品書印刷（日本語）
  5233	admin.stock.move_instruction.shipment_status_done: 済
  5234	admin.stock.move_instruction.search_first: 検索条件を入力し、検索ボタンをクリックしてください。
  5235	admin.stock.move_instruction.csv_download_record: 在庫移動実績入力用CSVダウンロード
  5236	admin.stock.move_instruction.csv_download_invoice: 送り状CSVダウンロード
  5237	admin.stock.move_instruction.csv_invoice_select_rows: 送り状CSVを出力する在庫移動指示にチェックを入れてください。
  5238	admin.stock.move_instruction.section_title: 在庫移動指示
  5239	admin.stock.move_instruction.page_title: 在庫移動指示

exec
/bin/bash -lc 'rg -n "admin.order.output_labels_Export|admin.stock.move_instruction.csv_download_invoice" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2450:admin.order.output_labels_Export: 送り状出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5236:admin.stock.move_instruction.csv_download_invoice: 送り状CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:130:                                                        {{ 'admin.stock.move_instruction.csv_download_invoice'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1212:                                                {{ 'admin.order.output_labels_Export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:161:                                    <button type="button" id="stockMoveInstructionLabelsExport" class="btn btn-ec-conversion">{{ 'admin.stock.move_instruction.csv_download_invoice'|trans }}</button>

codex
監査結果です。差分候補JSONの1件は、designRef/implRefとも実在し、内容も概ね妥当でした。誤検知・根拠不備・重要度誤りは確認していません。

| 種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応 |
|---|---|---|---|---|
| MISSED | フロント挙動 | 設計書は「画面上のボタン文言」を `admin.order.output_labels_Export` =「送り状出力」としているが、出荷指示編集画面の実装は `admin.stock.move_instruction.csv_download_invoice` =「送り状CSVダウンロード」を使用している。受注一覧側は設計どおりなので、出荷指示編集側だけの低影響な文言差分。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html:222`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1212`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:130`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2450`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5236` | 設計書に画面別文言を明記するか、出荷指示編集側の翻訳キーを設計に合わせる。 |

確認済み補足: 候補JSONの「確定日時/出荷指示日」差分は有効です。設計は `confirm_date` を確定日時として対応付けていますが、実装のCSVデータ2列目は `getCommitDate()` です。根拠は設計HTML `:230`, `:254`、実装 `OrderRepository.php:709-713`、Entity `Order.php:666-670`, `:1847`, `:2174`、CSVヘッダ `ShippingStandbyCsvExporterService.php:63-67` で確認しました。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
92,580
監査結果です。差分候補JSONの1件は、designRef/implRefとも実在し、内容も概ね妥当でした。誤検知・根拠不備・重要度誤りは確認していません。

| 種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応 |
|---|---|---|---|---|
| MISSED | フロント挙動 | 設計書は「画面上のボタン文言」を `admin.order.output_labels_Export` =「送り状出力」としているが、出荷指示編集画面の実装は `admin.stock.move_instruction.csv_download_invoice` =「送り状CSVダウンロード」を使用している。受注一覧側は設計どおりなので、出荷指示編集側だけの低影響な文言差分。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-07_admin_order_order_labels_csv_export.html:222`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1212`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:130`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2450`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5236` | 設計書に画面別文言を明記するか、出荷指示編集側の翻訳キーを設計に合わせる。 |

確認済み補足: 候補JSONの「確定日時/出荷指示日」差分は有効です。設計は `confirm_date` を確定日時として対応付けていますが、実装のCSVデータ2列目は `getCommitDate()` です。根拠は設計HTML `:230`, `:254`、実装 `OrderRepository.php:709-713`、Entity `Order.php:666-670`, `:1847`, `:2174`、CSVヘッダ `ShippingStandbyCsvExporterService.php:63-67` で確認しました。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
