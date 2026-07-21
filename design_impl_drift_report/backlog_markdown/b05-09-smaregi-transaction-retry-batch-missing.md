/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ受注管理
機能：スマレジ取引連携エラー再連携
課題カテゴリ：実装漏れ
課題：スマレジ取引連携エラーを期間検索して再連携するバッチが未実装
設計書：0405_基本設計仕様書(バッチ_受注管理).xlsx

# 再現手順【必須】
1. 設計書 B05-09 の利用者視点の入口で、実行方法が `smaregi:batch checkSmaregiTransaction` とされていることを確認する
2. ベース実装 pf-eccube3 の `SmaregiBatch` が `checkSmaregiTransaction` を受け付け、スマレジ取引参照APIで期間内の取引を取得してポイント履歴・会員ポイントを再連携することを確認する
3. ec-cube-enterprise の `src/Eccube/Command`、`src/Eccube/Service/Smaregi`、`src/Eccube/MessageHandler`、設定ファイルを検索し、`smaregi:batch checkSmaregiTransaction` または同等の親バッチが登録されているか確認する
4. ec-cube-enterprise では Webhook 由来の単一 `transactionHeadId` 子ジョブと未使用の `listTransactions()` はあるが、期間検索・未連携検知・再連携ループを実行するバッチ入口がないことを確認する

# 期待される挙動【必須】
- スマレジ取引連携エラー再連携は `smaregi:batch checkSmaregiTransaction` で実行できる
- バッチ駆動時刻から指定時間前まで、または手動実行時に指定された期間内のスマレジ取引データを取得する
- Webhook失敗の可能性がある取引について、ポイント不整合、ECCUBE側のスマレジ取引ID未登録、返品・キャンセル等による更新日時差異を検知して再連携する
- 取得失敗時は失敗内容をログとコンソールに出力して異常終了し、取得結果が空の場合は正常終了する

# 現在の挙動【必須】
- ec-cube-enterprise には設計の `smaregi:batch checkSmaregiTransaction` コマンドや、期間内のスマレジ取引一覧を取得して未連携・更新差異を検知する親バッチがない。近接する実装は Webhook から投入済みの `SmaregiTransactionProcessMessage` を処理する子ジョブで、単一 `transactionHeadId` を取得して action ごとに処理する経路である。

ec-cube-enterprise の取引処理は Webhook 子ジョブの MessageHandler: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:55-72`
```php
 *
 * 親ジョブ ({@see SmaregiWebhookEventMessageHandler}) は SmaregiWebhookEvent 単位での
 * 受信状態を管理し、本ハンドラは transactionHeadId 単位の処理状態を MessengerJob として管理する。
 *
 * 主な責務:
 *  1. 子 MessengerJob を {@see SmaregiMessengerJobProcessingLock} で悲観ロック + 状態遷移
 *     (PENDING/FAILED → PROCESSING、COMPLETED は skip)
 *  2. スマレジ取引取得 API 呼出
 *  3. updateDateTime ベースの dedup ({@see SmaregiTransactionJobRepository::findLatestCompletedByTransaction()})
 *     により、同一 (transactionHeadId, action) で過去に完了した updateDateTime 以下のリクエストを skip
 *  4. action ('created' / 'edited' / 'canceled' / 'disposed') 別に Pattern Handler / Processor を実行
 *  5. 処理結果を {@see SmaregiTransactionJob} に保存 (updateDateTime と共に)
 *
 * TODO: bulk-* も同パターンで子ジョブ化する
 * TODO: webhook 到着順序が逆転して対応 Order が無い canceled/disposed の救済
 */
#[AsMessageHandler]
final readonly class SmaregiTransactionProcessMessageHandler
```

ec-cube-enterprise の子ジョブは単一 transactionHeadId を getTransaction する: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:152-180`
```php
    private function processTransaction(MessengerJob $Job, SmaregiWebhookEvent $event, string $action, string $transactionHeadId): void
    {
        $accessToken = $this->accessTokenService->getAccessToken(
            $this->smaregiApiIdUrl,
            $this->smaregiApiContractId,
            $this->smaregiApiClientId,
            $this->smaregiApiClientSecret,
        );

        $response = $this->transactionApiClient->getTransaction(
            $this->smaregiApiUrl,
            $this->smaregiApiContractId,
            $accessToken,
            $transactionHeadId,
        );

        $transaction = $response['dto'] ?? null;
        if ($transaction === null) {
            throw new \RuntimeException(sprintf('Failed to fetch Smaregi transaction (transactionHeadId=%s, statusCode=%d)', $transactionHeadId, $response['statusCode']));
        }

        $updateDateTime = $transaction->updateDateTime;

        if ($this->isStaleUpdate($transactionHeadId, $action, $updateDateTime)) {
            $this->logger->info('Skip Smaregi transaction: stale updateDateTime (already processed)', [
                'jobId' => $Job->getId(),
                'webhookEventId' => $event->getId(),
                'action' => $action,
                'transactionHeadId' => $transactionHeadId,
```

ec-cube-enterprise の取引一覧API部品は定義のみで呼び出し元がない: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiTransactionApiClient.php:90-118`
```php
    /**
     * 取引一覧を取得する（Webhook 未達期間の受信漏れを補完する再連携バッチ等で使用する）.
     *
     * ページング（page / limit）と期間指定は公式 API のクエリキーに準拠して呼び出し側が $query に指定し、
     * ページ送りのループも呼び出し側で制御する（在庫の {@see SmaregiStockApiClient::listStocks} と同方針）。
     * 参考: https://developers.smaregi.dev/platform-api-reference/apis/pos/operations/gettransactions/
     *
     * @param array<string,string> $query page / limit / 期間指定 等の公式クエリキー
     *
     * @return array{statusCode:int,headers:array<string,array<string>>,body:string,json:array<int,array<string,mixed>>|null}
     */
    public function listTransactions(
        string $apiUrl,
        string $contractId,
        string $accessToken,
        array $query = [],
    ): array {
        $url = sprintf('%s/%s/pos/transactions', rtrim($apiUrl, '/'), $contractId);

        return $this->requestGet(
            SmaregiPlatformApiCallLog::OPERATION_TRANSACTION_LIST,
            $url,
            $accessToken,
            $query,
            [
                'queryKeys' => array_keys($query),
            ],
        );
    }
```

ec-cube-enterprise はスマレジAPI設定を環境変数由来で注入している: `ec-cube-enterprise/app/config/eccube/services.yaml:28-80`
```yaml
    smaregi_api_id_url: '%env(SMAREGI_API_ID_URL)%'
    smaregi_api_url: '%env(SMAREGI_API_URL)%'
    smaregi_api_client_id: '%env(SMAREGI_API_CLIENT_ID)%'
    smaregi_api_client_secret: '%env(SMAREGI_API_CLIENT_SECRET)%'
    smaregi_api_contract_id: '%env(SMAREGI_API_CONTRACT_ID)%'
    env(SMAREGI_RATE_LIMIT_REFERENCE_PER_SECOND): '10'
    env(SMAREGI_RATE_LIMIT_MUTATION_PER_SECOND): '4'

services:
    # default configuration for services in *this* file
    _defaults:
        # automatically injects dependencies in your services
        autowire: true
        # automatically registers your services as commands, event subscribers, etc.
        autoconfigure: true
        # this means you cannot fetch services directly from the container via $container->get()
        # if you need to do this, you can override this setting on individual services
        public: false

        bind:
          $kernelProjectDir: '%kernel.project_dir%'
          $s3ServiceIdentification: '@s3_service.identification'
          $categoryNavCache: '@cache.category_nav'
          $createTenantManager: '@enterprise.eccube.tenant_creation.flow.creation'
          $cartPurchaseFlow: '@eccube.purchase.flow.cart'
          $shoppingPurchaseFlow: '@eccube.purchase.flow.shopping'
          $orderPurchaseFlow: '@eccube.purchase.flow.order'
          $_orderStateMachine: '@state_machine.order'
          $__connectionType: '%preferred_read_connection%'
          $__writeOnlyEntityManager: '@doctrine.orm.write_only_entity_manager'
          $__readOnlyEntityManager: '@doctrine.orm.read_only_entity_manager'
          $__readOnlyNewsRepository: '@eccube.readonly.repository.news_repository'
          $__readOnlyBaseInfoRepository: '@eccube.readonly.repository.base_info_repository'
          $__readOnlyPageRepository: '@eccube.readonly.repository.page_repository'
          $__readOnlyPageLayoutRepository: '@eccube.readonly.repository.page_layout_repository'
          $__readOnlyBlockPositionRepository: '@eccube.readonly.block_position_repository'
          $__readOnlyDeviceTypeRepository: '@eccube.readonly.repository.device_type_repository'
          $__readOnlyAuthorityRoleRepository: '@eccube.readonly.repository.authority_role_repository'
          $__readOnlyLayoutRepository: '@eccube.readonly.repository.layout_repository'
          $__readOnlyCategoryRepository: '@eccube.readonly.repository.category_repository'
          $__readOnlyPluginRepository: '@eccube.readonly.repository.plugin_repository'
          $__readOnlyProductRepository: '@eccube.readonly.repository.product_repository'
          $__readOnlyProductListMaxRepository: '@eccube.readonly.repository.product_list_max'
          $__readOnlyProductListOrderByRepository: '@eccube.readonly.repository.product_list_order_by'
          $__readOnlyTaxRuleRepository: '@eccube.readonly.repository.tax_rule_repository'
          $__readOnlyCartRepository: '@eccube.readonly.repository.cart_repository'
          $__readonlyOrderRepository: '@eccube.readonly.repository.order_repository'
          $__readOnlyCustomerRepository: '@eccube.readonly.repository.customer_repository'
          $smaregiApiIdUrl: '%smaregi_api_id_url%'
          $smaregiApiUrl: '%smaregi_api_url%'
          $smaregiApiClientId: '%smaregi_api_client_id%'
          $smaregiApiClientSecret: '%smaregi_api_client_secret%'
          $smaregiApiContractId: '%smaregi_api_contract_id%'
```
- ベース実装(pf-eccube3)では `smaregi:batch` が `checkSmaregiTransaction` を受け付け、オプションマスタからスマレジ接続設定を取得し、取引参照APIへ期間条件を渡す。取得失敗時はログとコンソールへ出力して `return 1`、空結果は `return 0`、取得結果がある場合は未登録・キャンセル・打消レコードを処理して会員ポイントとポイント履歴を更新する。

ベース実装 pf-eccube3 は smaregi:batch checkSmaregiTransaction を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/SmaregiBatch.php:12-26`
```php
    const BATCH_NAMES = [
        'createCustomer' => 'Plugin\HareruyaEc\Service\Smaregi\CreateCustomer',
        'checkCustomer' => 'Plugin\HareruyaEc\Service\Smaregi\CheckCustomer',
        'updatePoint' => 'Plugin\HareruyaEc\Service\Smaregi\UpdatePoint',
        'checkSmaregiErrorOrder' => 'Plugin\HareruyaEc\Service\Smaregi\CheckSmaregiErrorOrder',
        'checkSmaregiTransaction' => 'Plugin\HareruyaEc\Service\Smaregi\CheckSmaregiTransaction',
    ];

    const LAST_ARG = 10;

    protected function configure()
    {
        $this->setName('smaregi:batch')
            ->setDescription('smaregi batchs')
            ->addArgument('batch_name', InputArgument::OPTIONAL);
```

ベース実装 pf-eccube3 は batch_name に応じたサービスを実行する: `pf-eccube3/app/Plugin/HareruyaEc/Command/SmaregiBatch.php:33-52`
```php
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $app = $this->getSilexApplication();

        $name = $input->getArgument('batch_name');
        $batchNames = self::BATCH_NAMES;
        $resultMessage = '[' . date('Y/m/d H:i') . '] ';

        if (!isset($batchNames[$name])) {
            echo $resultMessage . " Nothing args or command.\n";

            return 1;
        }

        $accountList = new $batchNames[$name]($app, $this->createOptions($input));
        echo sprintf("Command start:%s \n", date('Y/m/d H:i:s'));
        $accountList->execute();
        echo sprintf("Command complete:%s \n", date('Y/m/d H:i:s'));

        return 0;
```

ベース実装 pf-eccube3 は取引参照APIを呼び、失敗/空結果/成功時の戻り値を分岐する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:32-59`
```php
    public function execute()
    {
        $app = $this->app;
        $optionValues = $this->getOptionValues($app);

        $now = new \DateTime();

        $result = $this->cURLSmaregi(
            $optionValues[MtbOption::SMAREGI_REQUEST_URL],
            $this->getHeader($optionValues),
            'transaction_ref',
            json_encode($this->getTransactionParams($app, $now))
        );

        if (isset($result['error'])) {
            log_info("取引情報取得失敗：{$result['error']}：詳細：{$result['error_description']}");
            echo "取引情報取得失敗：{$result['error']}：{$result['error_description']}";

            return 1;
        }

        if (empty($result['result'])) {
            return 0;
        }

        $this->updateSmaregiTransaction($app, $result['result']);

        return 0;
```

ベース実装 pf-eccube3 はオプションマスタからスマレジ接続設定を取得する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:68-95`
```php
    private function getOptionValues($app)
    {
        $options = $app['hareruya_ec.repository.option']->findListArray([
            MtbOption::SMAREGI_CONTRACT_ID,
            MtbOption::SMAREGI_ACCESS_TOKEN,
            MtbOption::SMAREGI_REQUEST_URL,
            MtbOption::SMAREGI_STORE_ID,
            MtbOption::SMAREGI_CATEGORY_ID]
        );

        return array_column($options, 'optionValue', 'optionKey');
    }

    /**
     * スマレジAPIヘッダ取得
     *
     * @param array $optionValues
     * @return array
     */
    private function getHeader($optionValues)
    {
        $header = [
            "X_contract_id: {$optionValues[MtbOption::SMAREGI_CONTRACT_ID]}",
            "X_access_token: {$optionValues[MtbOption::SMAREGI_ACCESS_TOKEN]}",
            'Content-Type: application/x-www-form-urlencoded;charset=UTF-8',
        ];

        return $header;
```

ベース実装 pf-eccube3 は現在時刻から設定時間前までの取引更新日時条件を組み立てる: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:136-153`
```php
    private function getTransactionParams(Application $app, $now)
    {
        $nowStr = $now->format('Y-m-d H:i:s');
        $startDatetime = $now->modify("-{$app['config']['HareruyaEc']['const']['smaregi']['transaction_period_hours']} hours");

        return [
            'conditions' => [
                [
                    'transactionHeadDivision' => '1',
                    'updDateTime >=' => $startDatetime->format('Y-m-d H:i:s'), // 取引日時の検索開始日時
                    'updDateTime <' => $nowStr,
                ],
            ],
            'order' => [
                'transactionHeadId'
            ],
            'table_name' => 'TransactionHead' ,
        ];
```

ベース実装 pf-eccube3 は未登録・キャンセル・打消レコードを検知してポイント再連携する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:159-188`
```php
    private function updateSmaregiTransaction(Application $app, $transactions)
    {
        $updateCount = 0;
        foreach ($transactions as $transaction) {
            $transactionId = $transaction['transactionHeadId'];
            $pointHistories = $app['hareruya_ec.repository.point_history']->findByTransactionId($transactionId);

            if (((int)$transaction['cancelDivision'] === self::IS_CANCEL) && !empty($pointHistories)) {
                log_info("未削除のキャンセルスマレジ取引ID：{$transactionId}");

                $updateCount += $this->cancelCustomerPoint(
                    $app, $transaction['customerId'], $transaction['newPoint'], $transaction['spendPoint'], $transactionId
                );
            } elseif ((int)$transaction['disposeDivision'] === self::IS_DISPOSE) {
                // 打消レコードの場合はnewPoint,spendPointともに負の値を持つので正負を反転させる
                $updateCount += $this->cancelCustomerPoint(
                    $app, $transaction['customerId'], -$transaction['newPoint'], -$transaction['spendPoint'], $transaction['disposeServerTransactionHeadId']
                );
            } elseif (((int)$transaction['cancelDivision'] !== self::IS_CANCEL) && ((int)$transaction['disposeDivision'] !== self::IS_DISPOSE) && empty($pointHistories)) {
                log_info("未登録のスマレジ取引ID：{$transactionId}");

                $updateCount += $this->updateCustomerPoint(
                    $app, $transaction['customerId'], $transaction['newPoint'], $transaction['spendPoint'], $transactionId
                );
            }
        }

        if ($updateCount > 0) {
            log_info("スマレジ取引処理件数:{$updateCount}");
        }
```

ベース実装 pf-eccube3 は会員ポイントとポイント履歴を登録・削除する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:201-271`
```php
    private function updateCustomerPoint(Application $app, $smaregiId, $gainPoint, $spendPoint, $transactionHeadId)
    {
        $player = $app['hareruya_ec.repository.player']->findOneBySmaregiId($smaregiId);
        if (is_null($player)) {
            return 0;
        }

        $newPoint = $player->getPoint() + $gainPoint - $spendPoint;
        $player->setPoint($newPoint);
        $app['orm.em']->persist($player);

        $purchaseType = $app['hareruya_ec.repository.point_type']->find(MtbPointType::PURCHASE_TYPE);
        if ($gainPoint > 0) {
            $gainPointHistory = new DtbPointHistory();
            $gainPointHistory
                ->setCustomer($player->getCustomer())
                ->setPointChange($gainPoint)
                ->setNote($app->trans('front.smaregi.shop.gain'))
                ->setIssueDate(new \DateTime())
                ->setCreateDate(new \DateTime())
                ->setPointType($purchaseType)
                ->setTransactionId($transactionHeadId);
            $app['orm.em']->persist($gainPointHistory);
        }
        if ($spendPoint > 0) {
            $spendPointHistory = new DtbPointHistory();
            $spendPointHistory
                ->setCustomer($player->getCustomer())
                ->setPointChange(-$spendPoint)
                ->setNote($app->trans('front.smaregi.shop.spend'))
                ->setIssueDate(new \DateTime())
                ->setCreateDate(new \DateTime())
                ->setPointType($purchaseType)
                ->setTransactionId($transactionHeadId);
            $app['orm.em']->persist($spendPointHistory);
        }

        $app['orm.em']->flush();

        return 1;
    }

    /**
     * 会員の取消通知ポイント情報関連を更新する
     *
     * @param Application $app
     * @param string $smaregiId
     * @param integer $gainPoint
     * @param integer $spendPoint
     * @param integer $transactionId
     * @return integer
     */
    private function cancelCustomerPoint(Application $app, $smaregiId, $gainPoint, $spendPoint, $transactionId)
    {
        $player = $app['hareruya_ec.repository.player']->findOneBySmaregiId($smaregiId);
        $pointHistories = $app['hareruya_ec.repository.point_history']->findByTransactionId($transactionId);
        if (is_null($player) || empty($pointHistories)) {
            return 0;
        }

        $newPoint = $player->getPoint() - $gainPoint + $spendPoint;
        $player->setPoint($newPoint);
        $app['orm.em']->persist($player);

        foreach ($pointHistories as $pointHistory) {
            $app['orm.em']->remove($pointHistory);
        }

        $app['orm.em']->flush();

        return 1;
```

# 根拠
- 設計：
  - B05-09 は Webhook 連携エラーになったスマレジ取引を再連携する機能で、5時間前までまたは指定期間内の取引を取得することを要求している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1999-2043`
  - B05-09 詳細設計は pf-eccube3 を正とし、利用者視点の入口を `smaregi:batch checkSmaregiTransaction` と定義している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:2056-2083`
  - B05-09 は取得失敗時の異常終了、空結果時の正常終了、取引情報による連携更新を要求している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:2081-2112`
- ec-cube-enterprise：
  - enterprise の取引処理は Webhook 子ジョブであり、期間検索して失敗Webhookを発見するCommandではない: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:55-72`
  - enterprise の単一取引取得処理は getTransaction に transactionHeadId を渡すだけで、一覧取得ループではない: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:152-180`
  - `listTransactions()` は存在するが、`rg 'listTransactions\('` では定義以外の呼び出し元がなく、B05-09のバッチ処理に未配線: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiTransactionApiClient.php:90-118`
- ベース実装：
  - pf-eccube3 は `smaregi:batch` の batch_name として `checkSmaregiTransaction` を受け付ける: `pf-eccube3/app/Plugin/HareruyaEc/Command/SmaregiBatch.php:12-26`
  - pf-eccube3 は取引参照API、失敗時ログ・コンソール出力、空結果正常終了、取得結果更新を実装している: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:32-59`
  - pf-eccube3 は取引更新日時の期間条件を組み立て、未登録・キャンセル・打消レコードを処理する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:136-188`

# 確認メモ
- 確認コマンド: `rg -n "checkSmaregiTransaction|スマレジ取引連携エラー|取引連携|5時間|transaction|Transaction" excel_to_html/output/0405_基本設計仕様書\(バッチ_受注管理\).html`
- 確認コマンド: `rg -n "checkSmaregiTransaction|class CheckSmaregiTransaction|function execute|transaction_ref|取引" ../pf-eccube3/app/Plugin/HareruyaEc -g '*.php' -g '*.yml'`
- 確認コマンド: `rg -n "checkSmaregiTransaction|listTransactions|getTransaction\(|SmaregiTransactionProcessMessageHandler|SmaregiTransactionProcessMessage|AsCommand|eccube:smaregi" ../ec-cube-enterprise/src/Eccube -g '*.php'`
- 確認コマンド: `rg -n "listTransactions\(" ../ec-cube-enterprise/src/Eccube -g '*.php'`
- 確認コマンド: `rg -n "checkSmaregiTransaction|smaregi:batch|SmaregiTransaction.*Command|transaction.*backfill|取引連携エラー|listTransactions\(" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Service ../ec-cube-enterprise/src/Eccube/MessageHandler ../ec-cube-enterprise/app/config/eccube -g '*.php' -g '*.yaml' -g '*.yml'`
