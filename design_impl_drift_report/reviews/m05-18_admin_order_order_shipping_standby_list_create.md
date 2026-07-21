OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26ac-c70a-7053-b7d5-e642e625459b
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-18_admin_order_order_shipping_standby_list_create
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-18_admin_order_order_shipping_standby_list_create.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html
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
差分候補、設計HTML、実装参照を読み合わせます。読み取り専用なので、まずJSONのfinding構造と参照行を確認してから、該当コードを開きます。
exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-18_admin_order_order_shipping_standby_list_create.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-18_admin_order_order_shipping_standby_list_create",
  "title": "m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html",
  "findings": [
    {
      "dimension": "④DBカラム・DB操作・テーブル",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html:252",
      "designQuote": "参照列`dtb_order.order_no`は最大255文字の文字列で、条件では数値パラメータとの比較演算が用いられる／キー`order_id_from`。入力時のみ`order_no >= パラメータ`（集計要点行242も「order_noの上下限」）",
      "implRef": "src/Eccube/Repository/OrderRepository.php:1174",
      "difference": "設計は注文番号レンジ条件の参照列を`dtb_order.order_no`（Order.php:464-465、`#[ORM\\Column(name: 'order_no', ..., length: 255)]`）と明記し、集計要点行(HTML:242)も「order_noの上下限」と記す。しかし実装OrderRepository::getOrdersForStandby()はレンジ条件を`o.order_number`（Order.php:647-648、`#[ORM\\Column(name: 'order_number', ..., length: 11, options comment '注文番号')]`）に対して掛けている（OrderRepository.php:1174 `o.order_number >= :order_id_from`／1179 `o.order_number <= :order_id_to`）。`order_no`と`order_number`はエンティティ上の別列（別データを保持しうる）であり、設計が指す条件列と実装の条件列が食い違う。抽出結果が設計記述と異なる可能性がある。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "実装: OrderRepository.php:1163-1181 getOrdersForStandby()内 andWhere('o.order_number >= :order_id_from') [1174] / andWhere('o.order_number <= :order_id_to') [1179]。エンティティ: Order.php:464-465 order_no列(STRING,length255,nullable) と Order.php:647-648 order_number列(STRING,length11,comment '注文番号') は別プロパティ・別カラム。設計HTML:252/242 は参照列を order_no と明記。"
    }
  ]
}

exec
/bin/bash -lc 'rg -n "shipping_standby|standby|ShippingStandby|order_shipping_standby|出荷待ち|csv|CSV|create" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube | head -200' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:54:    // create
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:111:    public const ADMIN_CUSTOMER_CSV_EXPORT = 'admin.customer.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:172:    public const ADMIN_ORDER_CSV_EXPORT_ORDER = 'admin.order.csv.export.order';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:175:    public const ADMIN_ORDER_CSV_EXPORT_SHIPPING = 'admin.order.csv.export.shipping';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:195:    public const ADMIN_PRODUCT_CATEGORY_CSV_EXPORT = 'admin.product.category.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:218:    public const ADMIN_PRODUCT_CLASS_CATEGORY_CSV_EXPORT = 'admin.product.class.category.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:231:    public const ADMIN_PRODUCT_CLASS_NAME_CSV_EXPORT = 'admin.product.class.name.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:236:    // csvProduct
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:238:    // csvCategory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:240:    // csvTemplate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:280:    public const ADMIN_PRODUCT_CSV_EXPORT = 'admin.product.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:296:    public const ADMIN_STOCK_SPLIT_JOIN_LIST_SPLIT_CSV_IMPORT_COMPLETE = 'admin.stock.split_join.list.split.csv.import.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:297:    public const ADMIN_STOCK_SPLIT_JOIN_LIST_JOIN_CSV_IMPORT_COMPLETE = 'admin.stock.split_join.list.join.csv.import.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:303:    public const ADMIN_SETTING_SHOP_CSV_INDEX_INITIALIZE = 'admin.setting.shop.csv.index.initialize';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:304:    public const ADMIN_SETTING_SHOP_CSV_INDEX_COMPLETE = 'admin.setting.shop.csv.index.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventSubscriber/RestockNotificationPostCommitSubscriber.php:41:            EccubeEvents::ADMIN_STOCK_SPLIT_JOIN_LIST_SPLIT_CSV_IMPORT_COMPLETE => 'onStockUpdateComplete',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventSubscriber/RestockNotificationPostCommitSubscriber.php:42:            EccubeEvents::ADMIN_STOCK_SPLIT_JOIN_LIST_JOIN_CSV_IMPORT_COMPLETE => 'onStockUpdateComplete',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php:120:                    (member_id, user_name, login_history_status_id, client_ip, base_info_id, create_date, update_date)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php:121:                VALUES (:member_id, :user_name, :status_id, :client_ip, :base_info_id, :created_at, :updated_at)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php:128:                    'created_at' => (new \DateTime())->format('Y-m-d H:i:s'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php:139:                'created_at' => (new \DateTime())->format('Y-m-d H:i:s'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/functions/log.php:24:    $logger = LoggerFacade::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/functions/log.php:35:    $logger = LoggerFacade::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/functions/log.php:46:    $logger = LoggerFacade::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/functions/log.php:57:    $logger = LoggerFacade::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/functions/log.php:68:    $logger = LoggerFacade::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/functions/log.php:79:    $logger = LoggerFacade::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/functions/log.php:90:    $logger = LoggerFacade::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/functions/log.php:101:    $logger = LoggerFacade::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/functions/trans.php:23:    $Translator = TranslatorFacade::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/RateLimiterListener.php:79:                $limiter = $factory->create((string) $User->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/RateLimiterListener.php:85:                $limiter = $factory->create($request->getClientIp());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:92:            $Event = $this->eventService->createEventFromRequest($request);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:96:            log_info('Webhook event created', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:339:                $parameters[$k] = $v->createView();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:361:    protected const ADMIN_CSV_IMPORT_HISTORY_PAGE_COUNT_OPTIONS = [10, 50, 100, 300, 500, 1000, 2000, 10000, 12000];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:364:    protected const ADMIN_CSV_IMPORT_MAX_ROWS = 5010;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:367:     * CSVの行数を概算する（ダブルクォート内の改行は除いてカウント）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:388:     * CSV取込履歴のページネーション状態をセッション・クエリから解決する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:400:        $pageCountOptions = static::ADMIN_CSV_IMPORT_HISTORY_PAGE_COUNT_OPTIONS;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:421:     * ヘッダー行のみのCSV雛形をダウンロードする StreamedResponse を生成する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:423:     * @param array<string, string> $headersKeyed キーがCSV列名（getCsvHeader() 形式）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:425:    protected function csvTemplateStreamedResponse(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:426:        CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:431:        $response->setCallback(function () use ($csvExportService, $headersKeyed) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:432:            $csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:433:            $csvExportService->fputcsv(array_keys($headersKeyed));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:434:            $csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:445:            'admin.csv.error.upload.maxrecord',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:446:            ['%maxRecord%' => static::ADMIN_CSV_IMPORT_MAX_ROWS]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:144:            ->createBuilder(Step1Type::class)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:165:            'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:205:        $finder = Finder::create()->in($eccubeDirs);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:294:            ->createBuilder(Step3Type::class)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:307:            'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:338:            ->createBuilder(Step4Type::class)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:356:            'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:376:            ->createBuilder(Step5Type::class)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:386:            $url = $this->createDatabaseUrl($sessionData);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:389:                $conn = $this->createConnection(['url' => $url]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:390:                $em = $this->createEntityManager($conn);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:402:                    $this->createTables($em);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:417:                    'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:437:            'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:457:        $databaseUrl = $this->createDatabaseUrl($sessionData);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:458:        $mailerUrl = $this->createMailerUrl($sessionData);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:568:    protected function createConnection(array $params): Connection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:594:    protected function createEntityManager(Connection $conn): EntityManager
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:600:        $config = ORMSetup::createConfiguration(true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:611:    public function createDatabaseUrl(array $params): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:683:    public function createMailerUrl(array $params): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:810:    protected function createTables(EntityManager $em): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:814:        $schemaTool->createSchema($metadatas);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:826:        $loader->loadFromDirectory($this->getParameter('kernel.project_dir').'/src/Eccube/Resource/doctrine/import_csv/'.$localeDir);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:874:                'create_date' => new \DateTime(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:879:                'create_date' => Types::DATETIMETZ_MUTABLE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:912:                $sth = $conn->prepare("INSERT INTO dtb_member (login_id, password, work_id, authority_id, creator_id, sort_no, update_date, create_date,name,department) VALUES (:login_id, :password, '1', '0', '1', '1', current_timestamp, current_timestamp,'管理者','EC-CUBE SHOP');");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:942:    public function createAppData(array $params, EntityManager $em): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:965:            $query = http_build_query($this->createAppData($params, $em));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:970:            $context = stream_context_create(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:1003:        $version = $em->createNativeQuery($sql, $rsm)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:1:- mtb_authority.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:2:- mtb_country.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:3:- mtb_csv_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:4:- mtb_customer_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:5:- mtb_customer_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:6:- mtb_device_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:7:- mtb_product_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:8:- mtb_job.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:9:- mtb_login_history_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:10:- mtb_order_item_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:11:- mtb_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:12:- mtb_order_status_color.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:13:- mtb_page_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:14:- mtb_pref.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:15:- mtb_product_list_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:16:- mtb_product_list_order_by.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:17:- mtb_sale_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:18:- mtb_sex.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:19:- mtb_shipping_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:20:- mtb_tax_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:21:- mtb_tax_display_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:22:- mtb_work.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:23:- dtb_tenant.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:24:- dtb_member.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:25:- dtb_tax_rule.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:26:- dtb_block.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:27:- dtb_page.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:28:- dtb_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:29:- dtb_page_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:30:- dtb_block_position.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:31:- dtb_authority_role.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:32:- dtb_base_info.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:33:- dtb_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:34:- dtb_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:35:- dtb_class_name.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:36:- dtb_class_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:37:- dtb_csv.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:38:- dtb_customer.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:39:- dtb_customer_address.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:40:- dtb_customer_favorite_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:41:- dtb_delivery.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:42:- dtb_delivery_duration.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:43:- dtb_delivery_fee.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:44:- dtb_delivery_time.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:45:- dtb_mail_history.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:46:- dtb_mail_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:47:- dtb_news.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:48:- dtb_order.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:49:- dtb_payment.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:50:- dtb_payment_option.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:51:- dtb_plugin.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:52:- dtb_plugin_event_handler.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:53:- dtb_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:54:- dtb_product_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:55:- dtb_product_class.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:56:- dtb_product_image.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:57:- dtb_product_stock.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:58:- dtb_product_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:59:- dtb_order_item.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:60:- dtb_shipping.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:61:- dtb_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:62:- dtb_tradelaw.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_order.csv:1:id,customer_id,country_id,pref_id,sex_id,job_id,payment_id,device_type_id,pre_order_id,order_no,message,name01,name02,kana01,kana02,company_name,email,phone_number,postal_code,addr01,addr02,birth,subtotal,discount,delivery_fee_total,charge,tax,total,payment_total,payment_method,note,create_date,update_date,order_date,payment_date,order_status_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_class_name.csv:1:id,creator_id,base_info_id,backend_name,name,sort_no,create_date,update_date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:47:            return $this->createCorsResponse(new JsonResponse(null, Response::HTTP_NO_CONTENT));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:55:            return $this->createErrorResponse(Response::HTTP_BAD_REQUEST, trans('api.deck_builder.login.required'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:61:            return $this->createErrorResponse(Response::HTTP_UNAUTHORIZED, trans('api.deck_builder.login.invalid_credentials'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:63:            return $this->createErrorResponse(Response::HTTP_UNAUTHORIZED, trans('api.deck_builder.login.auth_failed'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:71:        return $this->createCorsResponse(new JsonResponse([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:83:            return $this->createCorsResponse(new JsonResponse(null, Response::HTTP_NO_CONTENT));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:88:            return $this->createErrorResponse(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:97:            return $this->createErrorResponse(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:102:            return $this->createErrorResponse(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:108:        return $this->createCorsResponse(new JsonResponse([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_plugin.csv:1:id,name,code,enabled,version,source,initialized,create_date,update_date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_class_category.csv:1:id,class_name_id,creator_id,base_info_id,backend_name,name,sort_no,create_date,update_date,visible
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_product_stock.csv:1:id,product_class_id,base_info_id,creator_id,stock,create_date,update_date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_mail_template.csv:1:id,creator_id,mail_key,base_info_id,name,file_name,mail_subject,deletable,create_date,update_date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/format_sales.twig:138:                            {{ 'admin.common.csv_download'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_delivery_time.csv:1:id,delivery_id,delivery_time,base_info_id,sort_no,create_date,update_date,visible
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig:260:                                <a class="btn btn-ec-regular" href="{{ path('admin_analysis_sales_export') }}">{{ 'admin.common.csv_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:52:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:60:        path: '/%eccube_admin_route%/event/entry/bulk_csv_import',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:61:        name: 'admin_event_entry_bulk_csv_import',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:65:    #[Template(template: '@admin/Event/Entry/event_bulk_csv_import.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:68:        $form = $this->createForm(CsvImportType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:84:                if ($this->countCsvRows($formFile) > static::ADMIN_CSV_IMPORT_MAX_ROWS) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:86:                        'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:89:                            $this->translator->trans('admin.csv.error.upload.maxrecord', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:90:                                '%maxRecord%' => static::ADMIN_CSV_IMPORT_MAX_ROWS,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:98:                        'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:103:                log_info('イベント一括登録CSV登録開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:137:                    log_info('イベント一括登録CSV登録完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:138:                    $this->addSuccess('admin.common.csv_upload_complete', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:140:                    return $this->redirectToRoute('admin_event_entry_bulk_csv_import');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:150:            'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:157:        path: '/%eccube_admin_route%/event/entry/bulk_csv_template',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:158:        name: 'admin_event_entry_bulk_csv_template',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:169:        return $this->csvTemplateStreamedResponse(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:170:            $this->csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:172:            'event_entry.csv'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_product_class.csv:1:id,product_id,base_info_id,sale_type_id,class_category_id1,class_category_id2,delivery_duration_id,creator_id,product_code,stock,stock_unlimited,sale_limit,price01,price02,delivery_fee,create_date,update_date,visible,currency_code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:47:        $searchForm = $this->createForm(SalesType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:51:            'searchForm' => $searchForm->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:66:        $searchForm = $this->createForm(SalesType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:71:                'searchForm' => $searchForm->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:89:            'searchForm' => $searchForm->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:110:        $searchForm = $this->createForm(SalesType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:73:            ->createBuilder(SearchEventType::class, null, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:138:                    'searchForm' => $searchForm->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:194:            'searchForm' => $searchForm->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:204:    #[Route(path: '/%eccube_admin_route%/event/create', name: 'admin_event_create', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:206:    public function create(Request $request): RedirectResponse|array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:214:        $builder = $this->formFactory->createBuilder(EventType::class, $Event, ['Member' => $Member]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:233:            'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:253:        $builder = $this->formFactory->createBuilder(EventType::class, $Event, ['Member' => $Member]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:292:            'form' => $form->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php:78:        $monthStart = \DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%s-%s-01', $year, $month));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php:80:            throw $this->createNotFoundException();

exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成） - 機能仕様書</title>
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
   187	<a class="lv3" href="#出荷指示リストを作成する-POST-admin-order-generate-standby-list">出荷指示リストを作成する（POST `admin_order_generate_standby_list`）</a>
   188	<a class="lv2" href="#集計条件">集計条件</a>
   189	<a class="lv2" href="#区分振り分けの判定順序">区分振り分けの判定順序</a>
   190	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   191	<a class="lv3" href="#入力項目">入力項目</a>
   192	<a class="lv3" href="#エッジケース">エッジケース</a>
   193	<a class="lv2" href="#データ整合性">データ整合性</a>
   194	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   195	<a class="lv2" href="#入出力">入出力</a>
   196	<a class="lv2" href="#DBカラム">DBカラム</a>
   197	<a class="lv3" href="#DB操作">DB操作</a>
   198	<a class="lv2" href="#バリデーション">バリデーション</a>
   199	<a class="lv2" href="#権限・認可">権限・認可</a>
   200	<a class="lv2" href="#画面遷移">画面遷移</a>
   201	<a class="lv3" href="#遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</a>
   202	<a class="lv2" href="#エラー処理">エラー処理</a>
   203	<a class="lv2" href="#試行制限">試行制限</a>
   204	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   205	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   206	<a class="lv2" href="#セッション">セッション</a>
   207	<a class="lv3" href="#本機能におけるセッション">本機能におけるセッション</a>
   208	<a class="lv3" href="#セッションへ保存しない情報">セッションへ保存しない情報</a>
   209	<a class="lv2" href="#Cookie">Cookie</a>
   210	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a>
   211	<a class="lv2" href="#調査補助-grep-用">調査補助（grep 用）</a>
   212	<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a></nav>
   213	    </aside>
   214	    <main class="doc-content">
   215	      <header class="page-header">
   216	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.md</p>
   217	        <h1>m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）</h1>
   218	      </header>
   219	      <h2 id="概要">概要</h2>
   220	<p>管理画面「受注管理」配下の「出荷指示」画面から、注文番号レンジと受注日時レンジで条件を付け、条件に合う受注を抽出し、区分（通常・予約・大量）ごとに出荷指示リストを新規登録する。登録と同時に、対象受注へ出荷指示日時を記録し、対応状況を「出荷指示」（マスタID 9）へ一括更新する。</p>
   221	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認対象はec-cube-enterpriseの現行実装とする。</p>
   222	<p>対象はブラウザ経由の管理画面に限定する。出荷指示一覧の検索表示・ページング、リストの編集・削除・CSV・印刷・送り状出力、受注一覧・受注編集の個別操作の詳細は別範囲とする。</p>
   223	<p>コントローラのメソッド名単位の解剖は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。</p>
   224	<p>本機能のカスタマイズ区分は現行踏襲であり、出荷指示機能は現行リポ（pf-eccube3 の HareruyaEc プラグイン）と移行先（ec-cube-enterprise コア）の双方に同名で実装される。挙動は現行リポの実装を踏襲し、DB（永続化先のテーブル・列）は ec-cube-enterprise の実装を正とする。</p>
   225	<hr>
   226	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   227	<p>出荷指示機能は、現行は pf-eccube3 の HareruyaEc プラグイン（<code>app/Plugin/HareruyaEc</code>）に、移行先は ec-cube-enterprise コア（<code>src/Eccube</code>）に同名で実装される。永続化先の出荷指示リスト（<code>dtb_shipping_standby</code>）・出荷指示と受注の中間表（<code>dtb_order_shipping_standby</code>）・受注（<code>dtb_order</code>）・受注タイプマスタ（<code>mtb_order_type</code>）は、両者で同一スキーマである。<code>dtb_shipping_standby</code> の列構成（<code>id</code>・<code>member_id</code>・<code>order_type_id</code>・<code>create_date</code>・<code>update_date</code>・<code>comment</code>）と中間表の列（<code>standby_id</code>・<code>order_id</code>）は ec-cube-enterprise の定義を正とする。対応状況「出荷指示」（ID 9）への更新先 <code>dtb_order.order_status_id</code>、出荷指示日の <code>dtb_order.commit_date</code> も両者同一である。現行と移行先で差異が判明した場合は、DB記述は ec-cube-enterprise 実装を正とする。</p>
   228	<hr>
   229	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   230	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>ナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条件を入れ送信</td><td><code>POST /{admin_route}/order/generate/standby</code></td><td>検証成功かつ抽出が1件以上なら区分ごとにリストが増え、対象受注に出荷指示日と対応状況「出荷指示」が入る。成功フラッシュのうえ同画面ルートへ戻る</td></tr><tr><td>同上だが抽出0件</td><td><code>POST /{admin_route}/order/generate/standby</code></td><td>エラーフラッシュのうえ一覧ルートへ戻る。DBは更新しない</td></tr><tr><td>同上だがフォーム検証失敗</td><td><code>POST /{admin_route}/order/generate/standby</code></td><td>エラーフラッシュのうえ一覧ルートへ戻る</td></tr></tbody></table></div>
   231	<hr>
   232	<h2 id="フロント挙動">フロント挙動</h2>
   233	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td><code>@admin/ShippingStandby/index.twig</code>内の独立フォーム<code>generate_form</code>。<code>action</code>は<code>admin_order_generate_standby_list</code>。カード見出しは<code>admin.order.shipping_standby_generate_list</code>（表示は翻訳YAML）。1行目はラベル「注文番号」・始端欄・区切り（<code>admin.common.separator__range</code>）・終端欄。2行目はラベル「注文日時」・始端・区切り・終端。プレースホルダは日時欄に「年-月-日 時:分」。送信ボタンは<code>form</code>属性で<code>generate_form</code>に紐付く。生成ブロックはBootstrapの<code>collapse</code>（<code>#generateList</code>）。ヘッダ右の矢印で開閉</td></tr><tr><td>JS</td><td>当ページの<code>javascript</code>ブロックは空。送信は通常のフォームPOSTのみ</td></tr><tr><td>CSS・レイアウト</td><td>同一テンプレート先頭で<code>.table-responsive</code>の<code>overflow</code>を上書き（主に一覧表向け）</td></tr><tr><td>モーダル・ポップアップ</td><td>生成フローでは使わない</td></tr></tbody></table></div>
   234	<hr>
   235	<h2 id="処理フロー">処理フロー</h2>
   236	<h3 id="出荷指示リストを作成する-POST-admin-order-generate-standby-list">出荷指示リストを作成する（POST <code>admin_order_generate_standby_list</code>）</h3>
   237	<ol><li>管理画面の認証・共通制約を通過する。</li><li>生成専用フォーム種別をリクエストにバインドする。ブロックプレフィックスは<code>admin_generate_shipping_standby</code>。</li><li>未送信または検証失敗の場合、管理向けエラーフラッシュ（キー<code>admin.common.save_error</code>）を積み、<code>admin_shipping_standby</code>へリダイレクトする。</li><li>検証成功時、フォーム配列を条件として、出荷指示リスト除外が偽の配送方法エンティティ一覧を取得し、受注リポジトリの待機対象抽出に渡す。</li><li>戻りが空配列なら、<code>admin.common.save_error</code>を積み同ルートへリダイレクトする（永続化処理は呼ばない）。</li><li>空でない場合、区分別の受注配列と操作者の管理者アカウントを引数に、リスト生成用アクションを呼ぶ。</li><li>アクションはトランザクション開始後、区分IDごとに次を繰り返す。</li></ol>
   238	<ul><li><code>mtb_order_type</code>を区分IDで取得する。行がなければ引数例外を投げる。</li><li>出荷指示リスト行を新規作成し、当該区分の受注コレクション・操作者の会員ID・区分参照を設定して永続化する（ORMの<code>persist</code>と<code>flush</code>）。</li><li>続けて受注リポジトリの一括更新を呼び、当該受注すべての対応状況を「出荷指示」（ID 9）にし、<code>commit_date</code>を処理実行時刻（日時を<code>Y-m-d H:i:s</code>形式の文字列としてバルク更新）にする。</li></ul>
   239	<ol><li>全区分処理後にコミットする。途中で例外が出ればロールバックし例外を再送出する。</li><li>コントローラは引数例外だけを捕捉し、そのメッセージをフラッシュに載せ<code>admin_shipping_standby</code>へリダイレクトする。</li><li>成功時は成功フラッシュ（<code>admin.common.save_complete</code>）を積み<code>admin_shipping_standby</code>へリダイレクトする。</li></ol>
   240	<hr>
   241	<h2 id="集計条件">集計条件</h2>
   242	<div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>抽出対象受注</td><td>受注エンティティを起点に、対応状況が「購入処理中」（ID 8）および「注文取消し」（ID 3）以外であること。いずれかの配送が、配送方法の<code>is_shipping_standby_list_exclusion</code>が偽であるものに紐づくこと。<code>commit_date</code>がNULLであること。オプションで<code>order_no</code>の上下限（フォームの注文番号始端・終端に対応）および<code>order_date</code>の始端（以上）・終端（未満）を付与する</td></tr></tbody></table></div>
   243	<hr>
   244	<h2 id="区分振り分けの判定順序">区分振り分けの判定順序</h2>
   245	<p>抽出後の各受注は、次の順でちょうど一つの区分キー（<code>mtb_order_type</code>のID）に入る。</p>
   246	<div class="table-wrap"><table><thead><tr><th>順序</th><th>判定</th><th>結果</th></tr></thead><tbody><tr><td>1</td><td>受注明細コレクションの先頭行の商品名に、マスタ定数で定義された文字列 <code>予約</code> が部分一致する</td><td>区分キーは予約（ID 2）</td></tr><tr><td>2</td><td>上記以外で、受注明細件数（受注の明細件数カウント）が 150 以上</td><td>区分キーは大量（ID 3）</td></tr><tr><td>3</td><td>上記以外</td><td>区分キーは通常（ID 1）</td></tr></tbody></table></div>
   247	<p>画面上の区分表示名は<code>mtb_order_type.name</code>のデータに依存する。</p>
   248	<hr>
   249	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   250	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>作成されるリスト行数</td><td>抽出結果に受注が現れる区分ごとに1行。3区分すべてに受注があれば、同一トランザクションで3行作成される</td></tr><tr><td>対象外の配送</td><td>配送方法の「出荷指示リストから除外」が真のものだけを使う配送は、結合条件から外れる</td></tr><tr><td>受注の更新</td><td>各リスト行の<code>flush</code>の直後に、その行に紐づく受注へ対応状況と出荷指示日を一括適用する。区分ループのたびに呼ばれる</td></tr></tbody></table></div>
   251	<h3 id="入力項目">入力項目</h3>
   252	<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>注文番号</td><td>任意</td><td>整数種別。PHPが扱える整数範囲。参照列<code>dtb_order.order_no</code>は最大255文字の文字列で、条件では数値パラメータとの比較演算が用いられる</td><td>空欄</td><td>キー<code>order_id_from</code>。入力時のみ<code>order_no &gt;= パラメータ</code></td></tr><tr><td>～</td><td>任意</td><td>同上</td><td>空欄</td><td>キー<code>order_id_to</code>。ラベルはフォーム定義上「～」。入力時のみ<code>order_no &lt;= パラメータ</code></td></tr><tr><td>注文日時</td><td>任意</td><td>単一行日時（<code>DateTimeType</code>、<code>input</code>はdatetime、<code>widget</code>は<code>single_text</code>）</td><td>空欄</td><td>キー<code>order_date_from</code>。入力時のみ<code>order_date</code>が<code>Y-m-d H:i:s</code>に整形した値以上</td></tr><tr><td>～</td><td>任意</td><td>同上</td><td>空欄</td><td>キー<code>order_date_to</code>。ラベルはフォーム定義上「～」。入力時のみ<code>order_date</code>が同形式の値未満（終端は未満比較）</td></tr></tbody></table></div>
   253	<h3 id="エッジケース">エッジケース</h3>
   254	<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>全条件未入力</td><td>配送・対応状況・出荷指示日・除外フラグの条件のみで抽出する（集合は広くなりうる）</td></tr><tr><td>区分ごとの受注0件</td><td>当該区分キーは結果連想配列にキーが現れず、当該区分のリスト行は作られない</td></tr><tr><td>全区分で0件</td><td>コントローラが配列空と判断し、永続化前にエラーフラッシュで終了する</td></tr><tr><td>受注明細が0件の受注</td><td>区分判定で先頭明細参照があり、実装上エラーになりうる</td></tr><tr><td><code>mtb_order_type</code>に期待IDがない</td><td>引数例外となり、コントローラがその文言をフラッシュして一覧へ戻す</td></tr><tr><td>配送に結合する複数行</td><td>SQL上は受注が重複行になりうる。ORMの結果配列に同一受注が複数回含まれると、永続化処理へ重複が渡りうる</td></tr></tbody></table></div>
   255	<hr>
   256	<h2 id="データ整合性">データ整合性</h2>
   257	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧再表示</td><td>成功後は<code>admin_shipping_standby</code>へGET相当で戻る。新規リストがすぐ一覧に見えるかは、一覧側の初期表示と検索セッションの扱いに従う</td></tr><tr><td>リストと受注</td><td>同一トランザクションでリスト行・中間テーブル・受注の対応状況と出荷指示日が更新される</td></tr><tr><td>同時更新</td><td>楽観ロックは用いず、バルク更新は実行時点の行へ上書きする。他画面との同時編集の衝突解決は本機能の範囲外とする</td></tr></tbody></table></div>
   258	<hr>
   259	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   260	<p>本機能ではAPI呼び出し・バッチ実行を扱わない。</p>

codex
JSONには1件だけ載っています。設計の後半にDB操作・バリデーション・セッション等が続くため、候補外の見落とし確認も含めて該当実装一式を絞り込みます。
exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html | sed -n '260,430p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   260	<p>本機能ではAPI呼び出し・バッチ実行を扱わない。</p>
   261	<hr>
   262	<h2 id="入出力">入出力</h2>
   263	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>HTTP POST。フォーム名プレフィックス<code>admin_generate_shipping_standby</code>。CSRFはフォームトークンに従う</td></tr><tr><td>成功時出力</td><td>302で<code>admin_shipping_standby</code>へ遷移。成功フラッシュ</td></tr><tr><td>失敗時出力</td><td>同上ルートへ遷移。エラーフラッシュ（共通文言または引数例外メッセージ）</td></tr><tr><td>副作用</td><td><code>dtb_shipping_standby</code>へのINSERT、中間テーブルへのINSERT、対象<code>dtb_order</code>の<code>order_status_id</code>と<code>commit_date</code>の更新</td></tr></tbody></table></div>
   264	<hr>
   265	<h2 id="DBカラム">DBカラム</h2>
   266	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_shipping_standby</code></td><td><code>id</code></td><td>連番。画面では出荷指示番号として扱われる</td></tr><tr><td><code>dtb_shipping_standby</code></td><td><code>member_id</code></td><td>作成時の操作者（<code>dtb_member</code>）のID</td></tr><tr><td><code>dtb_shipping_standby</code></td><td><code>order_type_id</code></td><td><code>mtb_order_type</code>への外部キー</td></tr><tr><td><code>dtb_shipping_standby</code></td><td><code>comment</code></td><td>作成処理では設定しない（NULLのままとなりうる）</td></tr><tr><td><code>dtb_shipping_standby</code></td><td><code>create_date</code>, <code>update_date</code></td><td>作成処理の当該アクションではエンティティ上セットしない（NULLのままとなりうる。テスト固めでは別経路で明示セットあり）</td></tr><tr><td><code>dtb_order_shipping_standby</code></td><td><code>standby_id</code>, <code>order_id</code></td><td>中間テーブル</td></tr><tr><td><code>dtb_order</code></td><td><code>order_status_id</code></td><td>出荷指示（9）へ更新</td></tr><tr><td><code>dtb_order</code></td><td><code>commit_date</code></td><td>処理日時を一括設定</td></tr></tbody></table></div>
   267	<h3 id="DB操作">DB操作</h3>
   268	<p>永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。</p>
   269	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>登録/更新</td><td>dtb_member / dtb_order / dtb_order_shipping_standby / dtb_shipping_standby / mtb_order_type</td><td>当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。</td></tr></tbody></table></div>
   270	<hr>
   271	<h2 id="バリデーション">バリデーション</h2>
   272	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>CSRF</td><td>フォーム組み立てに従うトークン検証</td></tr><tr><td>注文番号の各欄</td><td><code>IntegerType</code>・任意。型・範囲外はフォームエラーで保存処理に進まない</td></tr><tr><td>注文日時の各欄</td><td><code>DateTimeType</code>・任意。単一行日時の解析に従う</td></tr></tbody></table></div>
   273	<hr>
   274	<h2 id="権限・認可">権限・認可</h2>
   275	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>本機能（POST生成）</th></tr></thead><tbody><tr><td>管理画面<code>admin</code>ファイアウォールにログインした管理者</td><td>ルート単位の追加拒否はなく、到達できれば実行できる</td></tr><tr><td>未ログイン</td><td>管理画面のログインへ誘導される（共通設定に従う）</td></tr></tbody></table></div>
   276	<hr>
   277	<h2 id="画面遷移">画面遷移</h2>
   278	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>生成POSTが成功</td><td><code>admin_shipping_standby</code>（出荷指示一覧の検索ルート）へリダイレクト</td></tr><tr><td>検証失敗・抽出0件・引数例外</td><td>同上</td></tr></tbody></table></div>
   279	<h3 id="遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</h3>
   280	<div class="table-wrap"><table><thead><tr><th>起点</th><th>遷移前の処理</th><th>遷移後の初期状態</th></tr></thead><tbody><tr><td>生成POST</td><td>フラッシュへ成功またはエラーを格納</td><td>一覧側のGET初期表示または一覧が持つセッション復元規則に従う。生成フォームは空の新規状態で再描画されうる</td></tr></tbody></table></div>
   281	<hr>
   282	<h2 id="エラー処理">エラー処理</h2>
   283	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>フォーム未送信／検証エラー</td><td><code>admin.common.save_error</code>を表示し一覧へ</td></tr><tr><td>抽出0件</td><td>同上</td></tr><tr><td>区分マスタ欠落などの引数例外</td><td>例外メッセージをフラッシュに載せ一覧へ</td></tr><tr><td>トランザクション内のその他の例外</td><td>ロールバック後に再送出。利用者向け表示はフレームワークのエラーハンドリングに委ねる</td></tr></tbody></table></div>
   284	<hr>
   285	<h2 id="試行制限">試行制限</h2>
   286	<p>本機能では試行制限を扱わない。</p>
   287	<hr>
   288	<h2 id="ログ・監査">ログ・監査</h2>
   289	<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>本処理専用の情報ログ</td><td>実装されていない</td></tr></tbody></table></div>
   290	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   291	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie 値</li><li>セッションIDの完全値</li><li>Remember Meトークンの原値</li></ul>
   292	<hr>
   293	<h2 id="セッション">セッション</h2>
   294	<h3 id="本機能におけるセッション">本機能におけるセッション</h3>
   295	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>生成POST</td><td>出荷指示一覧検索のセッションキー（実装では<code>shipping_standby</code>）を本処理は直接書き換えない</td></tr><tr><td>フラッシュ</td><td>リダイレクト先で一度表示されるメッセージに成功・失敗を載せる</td></tr></tbody></table></div>
   296	<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
   297	<p>生成条件をセッションへ複製する処理は持たない。</p>
   298	<hr>
   299	<h2 id="Cookie">Cookie</h2>
   300	<p>本機能単体で新たなCookieを設定しない。セッションCookieは管理画面の共通仕様に従う。</p>
   301	<hr>
   302	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   303	<p>作成処理は単一のデータベーストランザクションで囲む。受注は当処理でエンティティとして読み出して楽観ロック列を確認する経路ではなく、バルク更新で上書きする。</p>
   304	<hr>
   305	<h2 id="調査補助-grep-用">調査補助（grep 用）</h2>
   306	<ul><li>ルート名 <code>admin_order_generate_standby_list</code></li><li>フォーム <code>src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php</code></li><li>コントローラ <code>src/Eccube/Controller/Admin/Order/OrderController.php</code>（パス <code>order/generate/standby</code>）</li><li>抽出・一括更新 <code>src/Eccube/Repository/OrderRepository.php</code> の <code>getOrdersForStandby</code>、<code>changeOrderStatus</code></li><li>永続化サービス <code>src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php</code></li><li>画面 <code>src/Eccube/Resource/template/admin/ShippingStandby/index.twig</code> の <code>generate_form</code></li><li>マスタ定数 <code>src/Eccube/Entity/Master/MtbOrderType.php</code>、<code>src/Eccube/Entity/Master/OrderStatus.php</code></li></ul>
   307	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   308	<ul><li><code>admin_order_generate_standby_list</code> … <code>POST</code> … <code>/{admin_route}/order/generate/standby</code>（生成フォーム受信。条件付き抽出・区分別のリスト永続化・対象受注の対応状況と出荷指示日の更新。成否にかかわらず<code>admin_shipping_standby</code>へリダイレクトする）</li></ul>
   309	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   310	    </main>
   311	  </div>
   312	</body>
   313	</html>

exec
/bin/bash -lc 'rg -n "admin_order_generate_standby_list|generate_standby|generateStandby|getOrdersForStandby|ShippingStandby|shipping_standby" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:33:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:60:    protected CustomerRepository|DtbArchetypeRepository|DtbBuyOrderRepository|DtbBuyOrderStockHistoryRepository|DtbDeckRepository|DtbInventoryPlanRepository|DtbPriceHistoryRepository|MtbCardRepository|DtbShippingStandbyRepository $repository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:31:use Eccube\Form\Type\Admin\Order\GenerateShippingStandbyType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:39:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:54:use Eccube\Service\Admin\Order\GenerateShippingStandbyListAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:56:use Eccube\Service\Csv\Exporter\ShippingStandbyCsvExporterService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:104:        protected DtbShippingStandbyRepository $dtbShippingStandbyRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:105:        protected ShippingStandbyCsvExporterService $shippingStandbyCsvExporterService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:109:        protected GenerateShippingStandbyListAction $generateShippingStandbyListAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:743:        $DeliverySlips = $this->dtbShippingStandbyRepository->generateDeliverySlips($lang !== 'ja', $ids);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:746:        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:786:    #[Route(path: '/%eccube_admin_route%/order/generate/standby', name: 'admin_order_generate_standby_list', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:787:    public function generateShippingStandbyList(Request $request): RedirectResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:789:        $form = $this->createForm(GenerateShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:795:            return $this->redirectToRoute('admin_shipping_standby');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:800:        $DeliveryList = $this->deliveryRepository->findByIsShippingStandbyListExclusion(false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:801:        $OrderTypes = $this->orderRepository->getOrdersForStandby($conditions, $DeliveryList);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:806:            return $this->redirectToRoute('admin_shipping_standby');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:810:            $this->generateShippingStandbyListAction->handle(new GenerateListInput(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:817:            return $this->redirectToRoute('admin_shipping_standby');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:822:        return $this->redirectToRoute('admin_shipping_standby');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:42:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:104:     * @param DtbShippingStandbyRepository       $dtbShippingStandbyRepository 編集画面用：納品書
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:125:        private readonly DtbShippingStandbyRepository $dtbShippingStandbyRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1333:        $DeliverySlips = $this->dtbShippingStandbyRepository->generateDeliverySlips($lang !== 'ja', [$Shipping->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1336:        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:22:use Eccube\Form\Type\Admin\Order\GenerateShippingStandbyType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:23:use Eccube\Form\Type\Admin\Order\ShippingStandbyType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:24:use Eccube\Form\Type\Admin\ShippingStandbyCommentType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:26:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:32:use Eccube\Service\Admin\ShippingStandby\ActionInput\UpdateCommentInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:33:use Eccube\Service\Admin\ShippingStandby\DeleteListAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:34:use Eccube\Service\Admin\ShippingStandby\UpdateCommentAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:44:class ShippingStandbyController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:58:     * ShippingStandbyController constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:62:     * @param DtbShippingStandbyRepository $shippingStandbyRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:68:        protected DtbShippingStandbyRepository $shippingStandbyRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:81:        $this->sessionKey = 'shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:82:        $this->formType = ShippingStandbyType::class;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:84:        $this->formName = 'admin_shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:85:        $this->redirect = 'admin_shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:96:            name: 'admin_shipping_standby',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:103:            name: 'admin_shipping_standby_page',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:108:    #[Template(template: '@admin/ShippingStandby/index.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:128:            $form = $this->createForm(ShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:130:            $builder = $this->formFactory->createBuilder(GenerateShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:153:    #[Route(path: '/%eccube_admin_route%/standby/{id}/edit', name: 'admin_shipping_standby_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:172:            ShippingStandbyCommentType::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:176:        return $this->render('@admin/ShippingStandby/edit.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:191:    #[Route(path: '/%eccube_admin_route%/standby/{id}/update', name: 'admin_shipping_standby_update', requirements: ['id' => '\d+'], methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:194:        $ShippingStandby = $this->shippingStandbyRepository->find($id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:195:        if ($ShippingStandby === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:199:        $form = $this->createForm(ShippingStandbyCommentType::class, $ShippingStandby);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:205:            return $this->redirectToRoute('admin_shipping_standby_edit', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:212:                ShippingStandby: $ShippingStandby,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:219:            return $this->redirectToRoute('admin_shipping_standby_edit', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:226:        return $this->redirectToRoute('admin_shipping_standby_edit', ['id' => $id]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:236:    #[Route(path: '/%eccube_admin_route%/standby/{id}/delete', name: 'admin_shipping_standby_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:253:            return $this->redirectToRoute('admin_shipping_standby_edit', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:261:        return !empty($pageNo) ? $this->redirectToRoute('admin_shipping_standby_search', ['page_no' => $pageNo]) : ($this->redirectToRoute('admin_shipping_standby'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:270:        $builder = $this->formFactory->createBuilder(GenerateShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:284:    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/picking', name: 'admin_shipping_standby_print_picking_list', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:383:        return $this->render('@admin/ShippingStandby/picking_list.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:400:    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/delivery/{lang}', name: 'admin_shipping_standby_print_delivery_slips', requirements: ['id' => '\d+', 'lang' => 'ja|en'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:403:        $ShippingStandby = $this->shippingStandbyRepository->findOneById($id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:404:        if ($ShippingStandby === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:416:        foreach ($ShippingStandby->getOrders() as $Order) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:439:        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:21:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:29: * @extends AbstractRepository<DtbShippingStandby>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:31:class DtbShippingStandbyRepository extends AbstractRepository implements ServiceEntityRepositoryInterface
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:48:        parent::__construct($registry, DtbShippingStandby::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1161:    public function getOrdersForStandby(array $conditions, array $deliveryList): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2629:admin.order.shipping_standby_export: 出荷指示リストエクスポート
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2630:admin.order.shipping_standby_no: 出荷指示番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2631:admin.order.shipping_standby_generate_list: 生成
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2632:admin.order.shipping_standby_search: 出荷指示リスト検索
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2633:admin.order.shipping_standby_search_multi: 検索する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2634:admin.order.shipping_standby_search_result: 検索結果
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2635:admin.order.shipping_standby_search_result_count: 件が該当しました
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2636:admin.order.shipping_standby_order_type: 区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2637:admin.order.shipping_standby_order_count: 注文件数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2638:admin.order.shipping_standby_delete: リスト削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2639:admin.order.shipping_standby_list_print: ピッキングリスト印刷
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2640:admin.order.shipping_standby_order_payment_total: 購入金額(円)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2641:admin.order.shipping_standby_order_quantity: 合計点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2642:admin.order.shipping_standby_order_date: 受注日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2650:admin.picking_item_list.shipping_standby_id: 出荷指示リスト番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3057:admin.setting.shop.delivery.is_shipping_standby_list_exclusion: 出荷指示リストから除外
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:45:                      action="{{ path('admin_order_generate_standby_list') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:53:                                            {{ 'admin.order.shipping_standby_generate_list'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:101:                                                    {{ 'admin.order.shipping_standby_generate_list'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:119:                                        {{ 'admin.order.shipping_standby_search'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:123:                                    action="{{ path('admin_shipping_standby', { page_no: 1 }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:129:                                                    class="form-label">{{ searchForm.standby_id.vars.label }}{{ 'admin.order.shipping_standby_no'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:196:                        {{ 'admin.order.shipping_standby_search_multi'|trans }}<i class="fa fa-angle-right ms-1" aria-hidden="true"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:217:                                                        value="{{ path('admin_shipping_standby_page', {'page_no': 1, 'page_count': pageMax.name}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:232:                                                                <th id="result_list_main__header_id">{{ 'admin.order.shipping_standby_no'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:233:                                                                <th id="result_list_main__header_type">{{ 'admin.order.shipping_standby_order_type'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:234:                                                                <th id="result_list_main__header_count">{{ 'admin.order.shipping_standby_order_count'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:244:                                                                    <a href="{{ path('admin_shipping_standby_edit', {'id': StandbyList.id }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:262:                                                                                <li><a class="dropdown-item" href="{{ path('admin_shipping_standby_edit', { 'id':StandbyList.id }) }}">{{ 'admin.common.edit'|trans }}</a></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:263:                                                                                <li><a class="dropdown-item" href="{{ path('admin_shipping_standby_delete', { 'id':StandbyList.id }) }}" {{ csrf_token_for_anchor() }} data-method="delete">{{ 'admin.common.delete'|trans }}</a></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:269:                                                                <div class="modal fade" id="admin_shipping_standby_delete" tabindex="-1" role="dialog" aria-labelledby="discontinuance" aria-hidden="true" data-bs-keyboard="false" data-bs-backdrop="static">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:302:                                            {% include "@admin/pager.twig" with { 'pages' : pagination.paginationData, 'routes' : 'admin_shipping_standby' } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:2:{% set menus = ['order', 'shipping_standby'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:4:{% block sub_title %}{{ 'admin.order.shipping_standby_export'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:14:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_picking_list', { 'id' : shippingStandby.id }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:23:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'ja' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:31:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'en' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:72:                            <form method='POST' action='{{ path('admin_shipping_standby_update', {'id': shippingStandby.id}) }}'>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:77:                                            <p id="number_info_box__standby_id">{{ 'admin.order.shipping_standby_no'|trans }}：{{ shippingStandby.id }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:97:                                            <a href="{{ path('admin_shipping_standby_delete', { 'id': shippingStandby.id }) }}" class="btn btn-danger w-100" {{ csrf_token_for_anchor() }} data-method="delete">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:98:                                                {{ 'admin.order.shipping_standby_delete'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:118:                                                        {{ 'admin.order.shipping_standby_list_print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:146:                                                                <th id="result_list_main__header_payment_total">{{ 'admin.order.shipping_standby_order_payment_total'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:147:                                                                <th id="result_list_main__header_total_count">{{ 'admin.order.shipping_standby_order_quantity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:148:                                                                <th id="result_list_main__header_order_date">{{ 'admin.order.shipping_standby_order_date'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:38:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:124:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:210:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:294:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:562:                                    {{ form_widget(form.is_shipping_standby_list_exclusion) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:563:                                    {{ form_errors(form.is_shipping_standby_list_exclusion) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingStandbyCommentType.php:24:class ShippingStandbyCommentType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingStandbyCommentType.php:49:        return 'admin_shipping_standby_edit';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:75:            ->add('is_shipping_standby_list_exclusion', CheckboxType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:77:                'label' => 'admin.setting.shop.delivery.is_shipping_standby_list_exclusion',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:23:class GenerateShippingStandbyType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:64:        return 'admin_generate_shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/ShippingStandbyType.php:25:class ShippingStandbyType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/ShippingStandbyType.php:90:        return 'admin_shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/ActionInput/UpdateCommentInput.php:16:namespace Eccube\Service\Admin\ShippingStandby\ActionInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/ActionInput/UpdateCommentInput.php:18:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/ActionInput/UpdateCommentInput.php:24:        public DtbShippingStandby $ShippingStandby,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:20:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:26:class GenerateShippingStandbyListAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:47:                $shippingStandby = new DtbShippingStandby();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:154:     * 受注管理ピッキングリストと同様のロジック（ShippingStandbyController参照）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:22:class ShippingStandbyCsvExporterService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/UpdateCommentAction.php:16:namespace Eccube\Service\Admin\ShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/UpdateCommentAction.php:19:use Eccube\Service\Admin\ShippingStandby\ActionInput\UpdateCommentInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/UpdateCommentAction.php:33:            $input->ShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/UpdateCommentAction.php:37:            $this->entityManager->persist($input->ShippingStandby);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:23:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:25:#[ORM\Table(name: 'dtb_shipping_standby')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:27:#[ORM\Entity(repositoryClass: DtbShippingStandbyRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:28:class DtbShippingStandby extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:54:    #[ORM\JoinTable(name: 'dtb_order_shipping_standby')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:70:    public function setMemberId(int $memberId): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:82:    public function setCreateDate(?\DateTime $createDate): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:94:    public function setUpdateDate(?\DateTime $updateDate): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:106:    public function setComment(?string $comment): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:118:    public function setOrderType(MtbOrderType $OrderType): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:130:    public function addOrder(Order $order): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:145:    public function setOrders(Collection $orders): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/DeleteListAction.php:16:namespace Eccube\Service\Admin\ShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/DeleteListAction.php:19:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/DeleteListAction.php:30:    public function handle(DtbShippingStandby $shippingStandby): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:484:        #[ORM\Column(name: 'is_shipping_standby_list_exclusion', type: Types::BOOLEAN, options: ['default' => false, 'comment' => '出荷指示リスト除外フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:485:        private bool $isShippingStandbyListExclusion = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:487:        public function isShippingStandbyListExclusion(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:489:            return $this->isShippingStandbyListExclusion;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:492:        public function setIsShippingStandbyListExclusion(bool $isShippingStandbyListExclusion): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:494:            $this->isShippingStandbyListExclusion = $isShippingStandbyListExclusion;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:23:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:52:     * @var Collection<int, DtbShippingStandby>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:99:     * @param Eccube\EntityDtbShippingStandby $shippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:104:    public function addOrder(Eccube\EntityDtbShippingStandby $shippingStandby)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:115:     * @param Eccube\EntityDtbShippingStandby $shippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:118:    public function removeOrder(Eccube\EntityDtbShippingStandby $shippingStandby)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:125:     * @param Collection<int, DtbShippingStandby> $shippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:127:    public function setShippingStandby(Collection $shippingStandby): MtbOrderType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:135:     * @return Collection<int, DtbShippingStandby>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:137:    public function getShippingStandby(): Collection

exec
/bin/bash -lc 'rg -n "order_number|order_no" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:135:     *         order_number?:string,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:136:     *         order_no?:string,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:258:        // order_number
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:259:        if (isset($searchData['order_number']) && StringUtil::isNotBlank($searchData['order_number'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:261:                ->andWhere('o.order_number LIKE :order_number')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:262:                ->setParameter('order_number', '%'.$searchData['order_number'].'%');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174:                ->andWhere('o.order_number >= :order_id_from')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179:                ->andWhere('o.order_number <= :order_id_to')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1271:        return (string) $this->getEntityManager()->getConnection()->fetchOne('SELECT NEXTVAL(\'dtb_order_no_seq\')');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1326:            , o.order_number
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1349:            ->addScalarResult('order_number', 'order_number')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1378:                'o.order_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1514:            'o.order_number AS order_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1525:            ->andWhere('o.order_number IS NOT NULL')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1572:                    o.order_number,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1583:                  AND o.order_number IS NOT NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1594:                    o.order_number,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1604:                    AND o.order_number IS NOT NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1615:            ->addScalarResult('order_number', 'order_number')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1826:            ->andWhere('o.order_number IS NOT NULL')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1847:            AND o.order_number IS NOT NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2071:     *  2. 各グループについて、紐づく店頭受取受注の order_date 最大値と order_number 一覧を 1 クエリずつ取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2191:     * next_order_id ごとに、統合グループに含まれる全受注の order_number を id 昇順で返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2208:            ->select('o.id AS orderId, o.nextOrderId AS nextOrderId, o.order_number AS orderNumber')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2210:            ->andWhere('o.order_number IS NOT NULL')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:47:     * @method Order setOrderNumber(?string $order_number)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:149:    #[ORM\Index(columns: ['order_no'], name: 'dtb_order_order_no_idx')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464:        #[ORM\Column(name: 'order_no', type: Types::STRING, length: 255, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:465:        private ?string $order_no = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:647:        #[ORM\Column(name: 'order_number', type: Types::STRING, length: 11, nullable: true, options: ['unsigned' => true, 'comment' => '注文番号'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:648:        private ?string $order_number = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:790:         * 統合グループに含まれる全受注の order_number を id 昇順で格納。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:879:            $this->order_no = $orderNo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:889:            return $this->order_no;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1770:            return $this->order_number;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1773:        public function setOrderNumber(?string $order_number): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1775:            $this->order_number = $order_number;

codex
候補の参照行自体は存在しています。次に、フォーム、コントローラ、抽出、一括更新、永続化アクションの実コードを開き、設計全体との差分を確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1156,1218p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1156	     * @param array<string, mixed> $conditions
  1157	     * @param Delivery[] $deliveryList
  1158	     *
  1159	     * @return array<int, Order[]>
  1160	     */
  1161	    public function getOrdersForStandby(array $conditions, array $deliveryList): array
  1162	    {
  1163	        $qb = $this->createQueryBuilder('o');
  1164	        $qb->select('o')
  1165	            ->join('o.OrderStatus', 'st', 'WITH', 'st.id NOT IN (:ignore_status)')
  1166	            ->join('o.Shippings', 's', 'WITH', 's.Delivery IN (:deliveryList)')
  1167	            ->where('o.commitDate IS NULL')
  1168	            ->setParameter('deliveryList', $deliveryList)
  1169	            ->setParameter('ignore_status', [OrderStatus::PROCESSING, OrderStatus::CANCEL]);
  1170	
  1171	        // order id
  1172	        if (!empty($conditions['order_id_from'])) {
  1173	            $qb
  1174	                ->andWhere('o.order_number >= :order_id_from')
  1175	                ->setParameter('order_id_from', $conditions['order_id_from']);
  1176	        }
  1177	        if (!empty($conditions['order_id_to'])) {
  1178	            $qb
  1179	                ->andWhere('o.order_number <= :order_id_to')
  1180	                ->setParameter('order_id_to', $conditions['order_id_to']);
  1181	        }
  1182	
  1183	        // order date
  1184	        $this->addDateCondition(
  1185	            $qb,
  1186	            'o.order_date',
  1187	            $conditions['order_date_from'] ?? null,
  1188	            $conditions['order_date_to'] ?? null
  1189	        );
  1190	
  1191	        $orders = $qb
  1192	            ->getQuery()
  1193	            ->getResult();
  1194	
  1195	        $result = [];
  1196	
  1197	        foreach ($orders as $order) {
  1198	            $orderItems = $order->getOrderItems();
  1199	            $firstProduct = $orderItems[0];
  1200	            if (strpos($firstProduct->getProductName(), MtbOrderType::PREORDER_TEXT) !== false) {
  1201	                if (!isset($result[MtbOrderType::PREORDER])) {
  1202	                    $result[MtbOrderType::PREORDER] = [];
  1203	                }
  1204	                $result[MtbOrderType::PREORDER][] = $order;
  1205	            } elseif ($order->getTotalType() >= MtbOrderType::LARGE_TYPE) {
  1206	                if (!isset($result[MtbOrderType::LARGE])) {
  1207	                    $result[MtbOrderType::LARGE] = [];
  1208	                }
  1209	                $result[MtbOrderType::LARGE][] = $order;
  1210	            } else {
  1211	                if (!isset($result[MtbOrderType::COMMON])) {
  1212	                    $result[MtbOrderType::COMMON] = [];
  1213	                }
  1214	                $result[MtbOrderType::COMMON][] = $order;
  1215	            }
  1216	        }
  1217	
  1218	        return $result;

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php | sed -n '780,826p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   780	     * 出荷指示リストを生成
   781	     *
   782	     * @param Request $request
   783	     *
   784	     * @return RedirectResponse
   785	     */
   786	    #[Route(path: '/%eccube_admin_route%/order/generate/standby', name: 'admin_order_generate_standby_list', methods: ['POST'])]
   787	    public function generateShippingStandbyList(Request $request): RedirectResponse
   788	    {
   789	        $form = $this->createForm(GenerateShippingStandbyType::class);
   790	        $form->handleRequest($request);
   791	
   792	        if (!$form->isSubmitted() || !$form->isValid()) {
   793	            $this->addError('admin.common.save_error', 'admin');
   794	
   795	            return $this->redirectToRoute('admin_shipping_standby');
   796	        }
   797	
   798	        // 出荷指示リスト生成処理
   799	        $conditions = $form->getData();
   800	        $DeliveryList = $this->deliveryRepository->findByIsShippingStandbyListExclusion(false);
   801	        $OrderTypes = $this->orderRepository->getOrdersForStandby($conditions, $DeliveryList);
   802	
   803	        if (empty($OrderTypes)) {
   804	            $this->addError('admin.common.save_error', 'admin');
   805	
   806	            return $this->redirectToRoute('admin_shipping_standby');
   807	        }
   808	
   809	        try {
   810	            $this->generateShippingStandbyListAction->handle(new GenerateListInput(
   811	                OrderTypes: $OrderTypes,
   812	                Member: $this->getMember(),
   813	            ));
   814	        } catch (\InvalidArgumentException $e) {
   815	            $this->addError($e->getMessage(), 'admin');
   816	
   817	            return $this->redirectToRoute('admin_shipping_standby');
   818	        }
   819	
   820	        $this->addSuccess('admin.common.save_complete', 'admin');
   821	
   822	        return $this->redirectToRoute('admin_shipping_standby');
   823	    }
   824	
   825	    /**
   826	     * スタック用紙印刷用のウィンドウを表示

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php | sed -n '1,110p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Admin\Order;
    17	
    18	use Doctrine\Common\Collections\ArrayCollection;
    19	use Doctrine\ORM\EntityManagerInterface;
    20	use Eccube\Entity\DtbShippingStandby;
    21	use Eccube\Entity\Master\OrderStatus;
    22	use Eccube\Repository\Master\MtbOrderTypeRepository;
    23	use Eccube\Repository\OrderRepository;
    24	use Eccube\Service\Admin\Order\ActionInput\GenerateListInput;
    25	
    26	class GenerateShippingStandbyListAction
    27	{
    28	    public function __construct(
    29	        private readonly EntityManagerInterface $entityManager,
    30	        protected MtbOrderTypeRepository $mtbOrderTypeRepository,
    31	        protected OrderRepository $orderRepository,
    32	    ) {
    33	    }
    34	
    35	    public function handle(GenerateListInput $input): void
    36	    {
    37	        $this->entityManager->beginTransaction();
    38	
    39	        try {
    40	            foreach ($input->OrderTypes as $orderTypeId => $orders) {
    41	                $orderType = $this->mtbOrderTypeRepository->find($orderTypeId);
    42	
    43	                if ($orderType === null) {
    44	                    throw new \InvalidArgumentException(sprintf('注文タイプが見つかりません (id: %s)。', $orderTypeId));
    45	                }
    46	
    47	                $shippingStandby = new DtbShippingStandby();
    48	                $shippingStandby
    49	                    ->setOrders(new ArrayCollection($orders))
    50	                    ->setMemberId($input->Member->getId())
    51	                    ->setOrderType($orderType);
    52	
    53	                $this->entityManager->persist($shippingStandby);
    54	                $this->entityManager->flush();
    55	                $this->orderRepository->changeOrderStatus(OrderStatus::PRE_DELIV, $orders);
    56	            }
    57	
    58	            $this->entityManager->commit();
    59	        } catch (\Throwable $e) {
    60	            $this->entityManager->rollback();
    61	
    62	            throw $e;
    63	        }
    64	    }
    65	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php | sed -n '1,90p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Form\Type\Admin\Order;
    17	
    18	use Symfony\Component\Form\AbstractType;
    19	use Symfony\Component\Form\Extension\Core\Type\DateTimeType;
    20	use Symfony\Component\Form\Extension\Core\Type\IntegerType;
    21	use Symfony\Component\Form\FormBuilderInterface;
    22	
    23	class GenerateShippingStandbyType extends AbstractType
    24	{
    25	    /**
    26	     * {@inheritdoc}
    27	     */
    28	    public function buildForm(FormBuilderInterface $builder, array $options)
    29	    {
    30	        $builder
    31	            // From
    32	            ->add('order_id_from', IntegerType::class, [
    33	                'label' => '注文番号',
    34	                'required' => false,
    35	            ])
    36	            // To
    37	            ->add('order_id_to', IntegerType::class, [
    38	                'label' => '～',
    39	                'required' => false,
    40	            ])
    41	            // From
    42	            ->add('order_date_from', DateTimeType::class, [
    43	                'label' => '注文日時',
    44	                'required' => false,
    45	                'input' => 'datetime',
    46	                'attr' => ['placeholder' => '年-月-日 時:分'],
    47	                'widget' => 'single_text',
    48	            ])
    49	            // To
    50	            ->add('order_date_to', DateTimeType::class, [
    51	                'label' => '～',
    52	                'required' => false,
    53	                'input' => 'datetime',
    54	                'attr' => ['placeholder' => '年-月-日 時:分'],
    55	                'widget' => 'single_text',
    56	            ]);
    57	    }
    58	
    59	    /**
    60	     * {@inheritdoc}
    61	     */
    62	    public function getBlockPrefix()
    63	    {
    64	        return 'admin_generate_shipping_standby';
    65	    }
    66	}

codex
抽出の区分判定で「明細件数」と実装メソッド名がずれて見えるため、ここは見落とし候補として追加検証します。合わせて日付条件と受注更新の中身も確認します。
exec
/bin/bash -lc 'rg -n "function addDateCondition|function changeOrderStatus|getTotalType|setOrderNo|getOrderNo|setOrderNumber|getOrderNumber" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:46:     * @method string|null getOrderNumber()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:47:     * @method Order setOrderNumber(?string $order_number)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:877:        public function setOrderNo(?string $orderNo = null): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:887:        public function getOrderNo(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1768:        public function getOrderNumber(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1773:        public function setOrderNumber(?string $order_number): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2311:        public function getTotalType(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:682:            $row[] = $order->getOrderNumber() ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1058:    private function addDateCondition(QueryBuilder $qb, string $alias, ?\DateTimeInterface $startDate, ?\DateTimeInterface $endDate): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1205:            } elseif ($order->getTotalType() >= MtbOrderType::LARGE_TYPE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1229:    public function changeOrderStatus(int $orderStatusId, array $orders): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2094:                $orderNumber = $Order->getOrderNumber();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2128:            $fallbackOrderNumber = $Order->getOrderNumber();

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1218,1260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1218	        return $result;
  1219	    }
  1220	
  1221	    /**
  1222	     * 注文ステータス一括変更
  1223	     *
  1224	     * @param int $orderStatusId
  1225	     * @param Order[] $orders
  1226	     *
  1227	     * @return int
  1228	     */
  1229	    public function changeOrderStatus(int $orderStatusId, array $orders): int
  1230	    {
  1231	        $time = new \DateTime();
  1232	        $qb = $this->createQueryBuilder('o');
  1233	        $result = $qb->update('Eccube\Entity\Order', 'o')
  1234	            ->where('o IN (:orders)')
  1235	            ->set('o.OrderStatus', $orderStatusId)
  1236	            ->set('o.commitDate', $qb->expr()->literal($time->format(self::MYSQL_DATE_FORMAT)))
  1237	            ->setParameter('orders', $orders)
  1238	            ->getQuery()
  1239	            ->execute();
  1240	
  1241	        return $result;
  1242	    }
  1243	
  1244	    /**
  1245	     * 出荷指示日一括削除
  1246	     *
  1247	     * @param Order[] $orders Orderエンティティの配列
  1248	     *
  1249	     * @return int
  1250	     */
  1251	    public function removeCommitDate(array $orders): int
  1252	    {
  1253	        $qb = $this->createQueryBuilder('o');
  1254	        $result = $qb->update('Eccube\Entity\Order', 'o')
  1255	            ->where('o IN (:orders)')
  1256	            ->set('o.commitDate', 'NULL')
  1257	            ->setParameter('orders', $orders)
  1258	            ->getQuery()
  1259	            ->execute();
  1260	

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php | sed -n '1,55p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Entity\Master;
    17	
    18	use Doctrine\Common\Collections\ArrayCollection;
    19	use Doctrine\Common\Collections\Collection;
    20	use Doctrine\DBAL\Types\Types;
    21	use Doctrine\ORM\Mapping as ORM;
    22	use Eccube\Entity\AbstractEntity;
    23	use Eccube\Entity\DtbShippingStandby;
    24	use Eccube\Repository\Master\MtbOrderTypeRepository;
    25	
    26	#[ORM\Table(name: 'mtb_order_type')]
    27	#[ORM\HasLifecycleCallbacks]
    28	#[ORM\Entity(repositoryClass: MtbOrderTypeRepository::class)]
    29	class MtbOrderType extends AbstractEntity implements \Stringable
    30	{
    31	    public const COMMON = 1;   // 通常
    32	    public const PREORDER = 2; // 予約
    33	    public const LARGE = 3;    // 大量
    34	
    35	    // 商品名に特定の文字列を含む商品が受注に含まれる場合、受注タイプを「予約」とする
    36	    public const PREORDER_TEXT = '予約';
    37	    // 購入種類数が閾値以上の場合、受注タイプを「大量」とする
    38	    public const LARGE_TYPE = 150;
    39	
    40	    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '受注タイプID'])]
    41	    #[ORM\Id]
    42	    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    43	    private int $id;
    44	
    45	    #[ORM\Column(name: 'name', type: Types::STRING, length: 32, options: ['comment' => 'タイプ名'])]
    46	    private string $name;
    47	
    48	    #[ORM\Column(name: 'sort_no', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '並び順'])]
    49	    private int $sortNo;
    50	
    51	    /**
    52	     * @var Collection<int, DtbShippingStandby>
    53	     */
    54	    private Collection $shippingStandby;
    55	

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '450,470p;640,652p;860,895p;1758,1780p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
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

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig | sed -n '35,110p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    35	    <style>
    36	        .table-responsive {
    37	            overflow: visible !important;
    38	        }
    39	    </style>
    40	    <div class="c-contentsArea__cols">
    41	        <div class="c-contentsArea__primaryCol">
    42	            <div class="c-primaryCol">
    43	                {# 生成用フォーム #}
    44	                <form id="generate_form" method="post"
    45	                      action="{{ path('admin_order_generate_standby_list') }}">
    46	                    {{ form_widget(generateForm._token) }}
    47	                    <div class="row mb-4">
    48	                        <div class="col-md-12">
    49	                            <div class="card rounded border shadow-sm mb-4">
    50	                                <div class="card-header bg-white">
    51	                                    <div class="row">
    52	                                        <div class="card-title col-8 h5 font-weight-bold">
    53	                                            {{ 'admin.order.shipping_standby_generate_list'|trans }}
    54	                                        </div>
    55	                                        <div class="col-4 text-end"><a data-bs-toggle="collapse" href="#generateList" aria-expanded="false" aria-controls="generateList"><i class="fa fa-angle-up fa-lg"></i></a></div>
    56	                                    </div>
    57	                                </div>
    58	                                <div class="collapse ec-cardCollapse" id="generateList">
    59	                                    <div class="card-body">
    60	                                        <div class="row mb-4">
    61	                                            <div class="col-12">
    62	                                                <div class="row align-items-center">
    63	                                                    <div class="col-auto">
    64	                                                        <label for="{{ generateForm.order_id_from.vars.id }}" 
    65	                                                            class="form-label">{{ generateForm.order_id_from.vars.label }}</label>
    66	                                                    </div>
    67	                                                    <div class="col">
    68	                                                        {{ form_widget(generateForm.order_id_from) }} 
    69	                                                        {{ form_errors(generateForm.order_id_from) }}
    70	                                                    </div>
    71	                                                    <div class="col-auto"><span>{{ 'admin.common.separator__range'|trans }}</span></div>
    72	                                                    <div class="col">
    73	                                                        {{ form_widget(generateForm.order_id_to) }}
    74	                                                        {{ form_errors(generateForm.order_id_to) }}
    75	                                                    </div>
    76	                                                </div>
    77	                                            </div>
    78	                                        </div>
    79	                                        <div class="row mb-4">
    80	                                            <div class="col-12">
    81	                                                <div class="row align-items-center">
    82	                                                    <div class="col-auto">
    83	                                                        <label for="{{ generateForm.order_date_from.vars.id }}" 
    84	                                                            class="form-label">{{ generateForm.order_date_from.vars.label }}</label>
    85	                                                    </div>
    86	                                                    <div class="col">
    87	                                                        {{ form_widget(generateForm.order_date_from) }} 
    88	                                                        {{ form_errors(generateForm.order_date_from) }}
    89	                                                    </div>
    90	                                                    <div class="col-auto"><span>{{ 'admin.common.separator__range'|trans }}</span></div>
    91	                                                    <div class="col">
    92	                                                        {{ form_widget(generateForm.order_date_to) }}
    93	                                                        {{ form_errors(generateForm.order_date_to) }}
    94	                                                    </div>
    95	                                                </div>
    96	                                            </div>
    97	                                        </div>
    98	                                        <div class="row mb-4">
    99	                                            <div class="text-center my-4 admin-product-search-submit-wrap">
   100	                                                <button class="btn btn-ec-conversion px-5" type="submit" form="generate_form">
   101	                                                    {{ 'admin.order.shipping_standby_generate_list'|trans }}
   102	                                                </button>
   103	                                            </div>
   104	                                        </div>
   105	                                    </div>
   106	                                </div>
   107	                            </div>
   108	                        </div>
   109	                    </div>
   110	                </form>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1048,1068p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1048	    /**
  1049	     * 日付範囲の検索条件を追加
  1050	     *
  1051	     * @param QueryBuilder $qb
  1052	     * @param string $alias
  1053	     * @param \DateTimeInterface|null $startDate
  1054	     * @param \DateTimeInterface|null $endDate
  1055	     *
  1056	     * @return void
  1057	     */
  1058	    private function addDateCondition(QueryBuilder $qb, string $alias, ?\DateTimeInterface $startDate, ?\DateTimeInterface $endDate): void
  1059	    {
  1060	        if (!empty($startDate)) {
  1061	            $startDate = $startDate->format('Y-m-d H:i:s');
  1062	            $qb
  1063	                ->andWhere("{$alias} >= :date_start")
  1064	                ->setParameter('date_start', $startDate);
  1065	        }
  1066	
  1067	        if (!empty($endDate)) {
  1068	            $endDate = $endDate->format('Y-m-d H:i:s');

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '2298,2320p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  2298	         */
  2299	        public function setNextOrderId(?int $nextOrderId): Order
  2300	        {
  2301	            $this->nextOrderId = $nextOrderId;
  2302	
  2303	            return $this;
  2304	        }
  2305	
  2306	        /**
  2307	         * Get total type
  2308	         *
  2309	         * @return int
  2310	         */
  2311	        public function getTotalType(): int
  2312	        {
  2313	            return $this->getOrderItems()->count();
  2314	        }
  2315	
  2316	        /**
  2317	         * Get deletedAt.
  2318	         */
  2319	        public function getDeletedAt(): ?\DateTime
  2320	        {

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php | sed -n '1,160p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Entity;
    17	
    18	use Doctrine\Common\Collections\ArrayCollection;
    19	use Doctrine\Common\Collections\Collection;
    20	use Doctrine\DBAL\Types\Types;
    21	use Doctrine\ORM\Mapping as ORM;
    22	use Eccube\Entity\Master\MtbOrderType;
    23	use Eccube\Repository\DtbShippingStandbyRepository;
    24	
    25	#[ORM\Table(name: 'dtb_shipping_standby')]
    26	#[ORM\HasLifecycleCallbacks]
    27	#[ORM\Entity(repositoryClass: DtbShippingStandbyRepository::class)]
    28	class DtbShippingStandby extends AbstractEntity
    29	{
    30	    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '出荷指示ID'])]
    31	    #[ORM\Id]
    32	    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    33	    private int $id;
    34	
    35	    #[ORM\Column(name: 'member_id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '最終更新者ID'])]
    36	    private int $memberId;
    37	
    38	    #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '作成日時'])]
    39	    private ?\DateTime $createDate = null;
    40	
    41	    #[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '更新日時'])]
    42	    private ?\DateTime $updateDate = null;
    43	
    44	    #[ORM\Column(name: 'comment', type: Types::TEXT, nullable: true, options: ['comment' => '備考欄'])]
    45	    private ?string $comment = null;
    46	
    47	    #[ORM\JoinColumn(name: 'order_type_id', nullable: true, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => '受注タイプID'])]
    48	    #[ORM\ManyToOne(targetEntity: MtbOrderType::class)]
    49	    private ?MtbOrderType $OrderType = null;
    50	
    51	    /**
    52	     * @var Collection<int, Order>
    53	     */
    54	    #[ORM\JoinTable(name: 'dtb_order_shipping_standby')]
    55	    #[ORM\JoinColumn(name: 'standby_id', referencedColumnName: 'id')]
    56	    #[ORM\InverseJoinColumn(name: 'order_id', referencedColumnName: 'id')]
    57	    #[ORM\ManyToMany(targetEntity: Order::class)]
    58	    private Collection $Orders;
    59	
    60	    public function __construct()
    61	    {
    62	        $this->Orders = new ArrayCollection();
    63	    }
    64	
    65	    public function getId(): int
    66	    {
    67	        return $this->id;
    68	    }
    69	
    70	    public function setMemberId(int $memberId): DtbShippingStandby
    71	    {
    72	        $this->memberId = $memberId;
    73	
    74	        return $this;
    75	    }
    76	
    77	    public function getMemberId(): int
    78	    {
    79	        return $this->memberId;
    80	    }
    81	
    82	    public function setCreateDate(?\DateTime $createDate): DtbShippingStandby
    83	    {
    84	        $this->createDate = $createDate;
    85	
    86	        return $this;
    87	    }
    88	
    89	    public function getCreateDate(): ?\DateTime
    90	    {
    91	        return $this->createDate;
    92	    }
    93	
    94	    public function setUpdateDate(?\DateTime $updateDate): DtbShippingStandby
    95	    {
    96	        $this->updateDate = $updateDate;
    97	
    98	        return $this;
    99	    }
   100	
   101	    public function getUpdateDate(): ?\DateTime
   102	    {
   103	        return $this->updateDate;
   104	    }
   105	
   106	    public function setComment(?string $comment): DtbShippingStandby
   107	    {
   108	        $this->comment = $comment;
   109	
   110	        return $this;
   111	    }
   112	
   113	    public function getComment(): ?string
   114	    {
   115	        return $this->comment;
   116	    }
   117	
   118	    public function setOrderType(MtbOrderType $OrderType): DtbShippingStandby
   119	    {
   120	        $this->OrderType = $OrderType;
   121	
   122	        return $this;
   123	    }
   124	
   125	    public function getOrderType(): MtbOrderType
   126	    {
   127	        return $this->OrderType;
   128	    }
   129	
   130	    public function addOrder(Order $order): DtbShippingStandby
   131	    {
   132	        $this->Orders[] = $order;
   133	
   134	        return $this;
   135	    }
   136	
   137	    public function removeOrder(Order $order): void
   138	    {
   139	        $this->Orders->removeElement($order);
   140	    }
   141	
   142	    /**
   143	     * @param Collection<int, Order> $orders
   144	     */
   145	    public function setOrders(Collection $orders): DtbShippingStandby
   146	    {
   147	        $this->Orders = $orders;
   148	
   149	        return $this;
   150	    }
   151	
   152	    /**
   153	     * @return Collection<int, Order>
   154	     */
   155	    public function getOrders(): Collection
   156	    {
   157	        return $this->Orders;
   158	    }
   159	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1060,1078p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1060	        if (!empty($startDate)) {
  1061	            $startDate = $startDate->format('Y-m-d H:i:s');
  1062	            $qb
  1063	                ->andWhere("{$alias} >= :date_start")
  1064	                ->setParameter('date_start', $startDate);
  1065	        }
  1066	
  1067	        if (!empty($endDate)) {
  1068	            $endDate = $endDate->format('Y-m-d H:i:s');
  1069	            $qb
  1070	                ->andWhere("{$alias} < :date_end")
  1071	                ->setParameter('date_end', $endDate);
  1072	        }
  1073	    }
  1074	
  1075	    /**
  1076	     * $since日以内、$until日以上前の条件を追加
  1077	     *
  1078	     * @param QueryBuilder $qb

codex
現時点では候補1件は設計・実装の参照が揃っており、誤検知には見えません。別実装で設計どおり処理している可能性を潰すため、対象リポジトリ全体でも同名ルート・条件キーの実装を確認します。
exec
/bin/bash -lc "rg -n \"admin_order_generate_standby_list|getOrdersForStandby|order_id_from|order_id_to|order_no >=|order_no <=|o\\.order_no\" /home/y-saito/Developments/ec-cube-enterprise" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "findByIsShippingStandbyListExclusion|function findByIsShippingStandbyListExclusion" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "admin_generate_shipping_standby|GenerateShippingStandbyType|generateForm" /home/y-saito/Developments/ec-cube-enterprise' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 137ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:800:        $DeliveryList = $this->deliveryRepository->findByIsShippingStandbyListExclusion(false);

 succeeded in 151ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:45:                      action="{{ path('admin_order_generate_standby_list') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:64:                                                        <label for="{{ generateForm.order_id_from.vars.id }}" 
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:65:                                                            class="form-label">{{ generateForm.order_id_from.vars.label }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:68:                                                        {{ form_widget(generateForm.order_id_from) }} 
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:69:                                                        {{ form_errors(generateForm.order_id_from) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:73:                                                        {{ form_widget(generateForm.order_id_to) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:74:                                                        {{ form_errors(generateForm.order_id_to) }}

 succeeded in 191ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:31:use Eccube\Form\Type\Admin\Order\GenerateShippingStandbyType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:789:        $form = $this->createForm(GenerateShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:22:use Eccube\Form\Type\Admin\Order\GenerateShippingStandbyType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:130:            $builder = $this->formFactory->createBuilder(GenerateShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:131:            $generateForm = $builder->getForm();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:135:                'generateForm' => $generateForm->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:270:        $builder = $this->formFactory->createBuilder(GenerateShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:271:        $result['generateForm'] = $builder->getForm()->createView();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:23:class GenerateShippingStandbyType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:64:        return 'admin_generate_shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:19:{% form_theme generateForm '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:46:                    {{ form_widget(generateForm._token) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:64:                                                        <label for="{{ generateForm.order_id_from.vars.id }}" 
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:65:                                                            class="form-label">{{ generateForm.order_id_from.vars.label }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:68:                                                        {{ form_widget(generateForm.order_id_from) }} 
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:69:                                                        {{ form_errors(generateForm.order_id_from) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:73:                                                        {{ form_widget(generateForm.order_id_to) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:74:                                                        {{ form_errors(generateForm.order_id_to) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:83:                                                        <label for="{{ generateForm.order_date_from.vars.id }}" 
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:84:                                                            class="form-label">{{ generateForm.order_date_from.vars.label }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:87:                                                        {{ form_widget(generateForm.order_date_from) }} 
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:88:                                                        {{ form_errors(generateForm.order_date_from) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:92:                                                        {{ form_widget(generateForm.order_date_to) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:93:                                                        {{ form_errors(generateForm.order_date_to) }}

codex
監査結果: 差分候補1件は妥当です。設計参照・実装参照はいずれも実在し、別ルートで `order_no` 条件を実装している箇所も確認できませんでした。

SEVERITY | ④DBカラム・DB操作・テーブル | 候補findingの `med` は過小評価の可能性があります。設計は注文番号レンジを `dtb_order.order_no` に掛けると明記している一方、実装は `o.order_number` に掛けています。この条件は抽出後にリスト作成と受注ステータス・出荷指示日の一括更新へ直結するため、レンジ指定時に誤った受注を更新し得ます。 | 設計: `function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html:252`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179`, 更新処理: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:55`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1235` | 重要度を `high` に上げることを推奨

FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | 誤検知ではありません。対象リポジトリ全体で `order_id_from` / `order_id_to` は `OrderRepository::getOrdersForStandby()` の `o.order_number` 条件のみ確認でき、設計どおり `o.order_no` へ掛ける別実装は確認できません。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1161`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179` | 候補findingは維持

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | 根拠不備はありません。設計HTMLの該当行は `order_no` 条件を記載し、実装行は `order_number` 条件を記載しています。両カラムも別プロパティとして存在します。 | 設計: `function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html:242`, `:252`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:647` | 対応不要

MISSED | - | 追加の見落とし差分は確認できませんでした。処理フロー、フォーム検証、日付条件、区分判定順序、永続化、例外処理、セッション非保存は設計記述と概ね一致します。 | 例: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:792`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:32`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1063`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1200` | 追加finding不要

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=要修正
tokens used
119,389
監査結果: 差分候補1件は妥当です。設計参照・実装参照はいずれも実在し、別ルートで `order_no` 条件を実装している箇所も確認できませんでした。

SEVERITY | ④DBカラム・DB操作・テーブル | 候補findingの `med` は過小評価の可能性があります。設計は注文番号レンジを `dtb_order.order_no` に掛けると明記している一方、実装は `o.order_number` に掛けています。この条件は抽出後にリスト作成と受注ステータス・出荷指示日の一括更新へ直結するため、レンジ指定時に誤った受注を更新し得ます。 | 設計: `function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html:252`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179`, 更新処理: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:55`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1235` | 重要度を `high` に上げることを推奨

FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | 誤検知ではありません。対象リポジトリ全体で `order_id_from` / `order_id_to` は `OrderRepository::getOrdersForStandby()` の `o.order_number` 条件のみ確認でき、設計どおり `o.order_no` へ掛ける別実装は確認できません。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1161`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179` | 候補findingは維持

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | 根拠不備はありません。設計HTMLの該当行は `order_no` 条件を記載し、実装行は `order_number` 条件を記載しています。両カラムも別プロパティとして存在します。 | 設計: `function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html:242`, `:252`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:647` | 対応不要

MISSED | - | 追加の見落とし差分は確認できませんでした。処理フロー、フォーム検証、日付条件、区分判定順序、永続化、例外処理、セッション非保存は設計記述と概ね一致します。 | 例: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:792`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:32`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1063`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1200` | 追加finding不要

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=要修正
