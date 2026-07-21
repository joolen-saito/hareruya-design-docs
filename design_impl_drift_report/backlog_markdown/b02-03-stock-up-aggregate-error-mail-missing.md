/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ在庫管理
機能：期間別入庫数集計バッチ
課題カテゴリ：実装漏れ
課題：期間別入庫数集計バッチでエラー時のメール通知が実装されていない
設計書：0402_基本設計仕様書(バッチ_在庫管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise のローカル環境で、`BatchAggregateStockUpAction::handle()` 内のリポジトリ処理が例外になる条件を用意する（例: 一時的にDB接続/対象テーブルを不整合にする、またはローカル検証用にリポジトリ例外を発生させる）
2. `bin/console eccube:aggregate-stock-up` を実行する
3. 例外時にコンソールへエラーが出力されることと、期間別入庫数集計バッチ向けに「集計できなかった旨」を通知するメール送信処理が呼ばれないことを確認する
4. 0402 の B02-03 設計「エラーが発生した場合集計できなかった旨をメールで送信する」と、ec-cube-enterprise の `AggregateStockUpCommand` / `BatchAggregateStockUpAction` を照合する

# 期待される挙動【必須】
- 0402 の B02-03 設計を正とする場合、期間別入庫数集計バッチでエラーが発生したら、集計できなかった旨をメールで送信する
- メール送信処理は、B02-03 の例外ハンドリング経路から実行される

# 現在の挙動【必須】
- ec-cube-enterprise の `AggregateStockUpCommand::execute()` は、`BatchAggregateStockUpAction::handle()` の例外を捕捉して `$io->error('集計処理でエラーが発生しました: '.$e->getMessage())` を出力し、`Command::FAILURE` を返すだけで、メール送信処理を呼び出していない。

ec-cube-enterprise AggregateStockUpCommand は例外時にコンソール出力のみを行う: `ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php:43-58`
```php
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        try {
            $this->batchAggregateStockUpAction->handle();
        } catch (\Exception $e) {
            $io->error('集計処理でエラーが発生しました: '.$e->getMessage());

            return Command::FAILURE;
        }

        $io->success('期間別入庫数集計が完了しました。');

        return Command::SUCCESS;
    }
```
- ec-cube-enterprise の `BatchAggregateStockUpAction` は `DtbStockUpQuantityRepository` と `EntityManagerInterface` だけを注入しており、`MailService` 依存や B02-03 向けメール送信呼び出しがない。例外時はロールバックして再スローするだけである。

ec-cube-enterprise BatchAggregateStockUpAction は MailService を注入していない: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:18-27`
```php
use Doctrine\ORM\EntityManagerInterface;
use Eccube\Repository\DtbStockUpQuantityRepository;

class BatchAggregateStockUpAction
{
    public function __construct(
        private readonly DtbStockUpQuantityRepository $stockUpQuantityRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }
```

ec-cube-enterprise BatchAggregateStockUpAction は例外時に rollback して再スローするだけ: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:34-49`
```php
    public function handle(): void
    {
        $connection = $this->entityManager->getConnection();
        $connection->beginTransaction();
        try {
            $this->stockUpQuantityRepository->clearStockUpQuantityForAggregate();
            $stockUpData = $this->stockUpQuantityRepository->getStockUpForAggregate();
            foreach ($stockUpData as $data) {
                $this->stockUpQuantityRepository->updateStockUpQuantityColumns($data);
            }
            $connection->commit();
        } catch (\Throwable $e) {
            $connection->rollBack();
            throw $e;
        }
    }
```
- ec-cube-enterprise には近傍バッチとして、週間在庫履歴更新で `MailService` を注入し、例外時に `sendWeeklyStockHistoryErrorMail($e->getMessage())` を呼ぶ実装がある。しかしこれは `BatchUpdateWeeklyStockHistoryAction` 専用で、B02-03 の `AggregateStockUpCommand` / `BatchAggregateStockUpAction` からは参照されていない。

ec-cube-enterprise 近傍実装では MailService 注入とエラー通知呼び出しがある: `ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:20-30`
```php
use Eccube\Service\MailService;

class BatchUpdateWeeklyStockHistoryAction
{
    public const BATCH_SIZE = 20000;

    public function __construct(
        private readonly DtbWeeklyStockHistoryTempRepository $weeklyStockHistoryTempRepository,
        private readonly DtbWeeklyStockHistoryRepository $weeklyStockHistoryRepository,
        private readonly MailService $mailService,
    ) {
```

ec-cube-enterprise 近傍実装の週間在庫履歴更新は例外時にメール送信する: `ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:75-80`
```php
            // ③④ 本テーブル TRUNCATE → 一時テーブルからコピー（トランザクションでラップ）
            $this->weeklyStockHistoryRepository->replaceFromTemp();
        } catch (\Exception $e) {
            $this->mailService->sendWeeklyStockHistoryErrorMail($e->getMessage());
            throw $e;
        }
```

ec-cube-enterprise MailService には週間在庫履歴更新向けのエラー通知メールだけがある: `ec-cube-enterprise/src/Eccube/Service/MailService.php:1744-1780`
```php
     * 週間在庫履歴更新バッチのエラー通知メールを送信する。
     */
    public function sendWeeklyStockHistoryErrorMail(string $errorMessage): void
    {
        log_info('週間在庫履歴更新エラー通知メール送信開始');

        $address = $this->mtbOptionRepository
            ->findOneBy(['option_key' => MtbOption::WEEKLY_STOCK_HISTORY_ERROR_MAIL_ADDRESS])
            ?->getOptionValue() ?? '';

        if (empty($address)) {
            log_info('週間在庫履歴更新エラー通知メールアドレス未設定のため送信せずに終了');

            return;
        }

        $body = <<<EOT
        週間在庫履歴更新バッチでエラーが発生しました。
        週間在庫履歴の更新処理が正常に完了していません。

        エラー内容:
        {$errorMessage}
        EOT;

        $baseInfo = $this->BaseInfoRepository->getMallBaseInfo();

        $message = (new Email())
            ->subject('週間在庫履歴更新エラー通知メール')
            ->text($body)
            ->from(new Address($baseInfo->getEmail01(), $baseInfo->getShopName()))
            ->to($this->convertRFCViolatingEmail($address))
            ->replyTo($baseInfo->getEmail03())
            ->returnPath($baseInfo->getEmail04());

        try {
            $this->mailer->send($message);
            log_info('週間在庫履歴更新エラー通知メール送信完了');
```
- ベース実装(pf-eccube3)では `ProductBatch` が `updateProductSummaryForStockUp` を `UpdateProductSummaryForStockUp` に対応させて実行するが、共通入口は開始・完了出力と `$product->execute()` 呼び出しだけで、例外捕捉やメール送信処理はない。

ベース実装 pf-eccube3 ProductBatch は updateProductSummaryForStockUp を実行対象に登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-20`
```php
    const BATCH_NAMES = [
        'displayReleasedProduct' => 'Plugin\HareruyaEc\Service\Product\DisplayReleasedProduct',
        'updateProductSummary' => 'Plugin\HareruyaEc\Service\Product\UpdateProductSummary',
        'attachCategory' => 'Plugin\HareruyaEc\Service\Product\AttachCategory',
        'deleteProductRequest' => 'Plugin\HareruyaEc\Service\Product\DeleteProductRequest',
        'exportWeeklyStockHistoryCsv' => 'Plugin\HareruyaEc\Service\Product\ExportWeeklyStockHistoryCsv',
        'ExportPopularProductRecommendCsv' => 'Plugin\HareruyaEc\Service\Product\ExportPopularProductRecommendCsv',
        'insertStockHistory' => 'Plugin\HareruyaEc\Service\Product\InsertStockHistory',
        'updateProductSummaryForStockUp' => 'Plugin\HareruyaEc\Service\Product\UpdateProductSummaryForStockUp',
```

ベース実装 pf-eccube3 ProductBatch は execute を呼ぶだけでエラーメール送信を行わない: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:43-58`
```php
        $name = $input->getArgument('batch_name');
        $batchNames = self::BATCH_NAMES;
        $resultMessage = '[' . date('Y/m/d H:i') . '] ';

        if (!isset($batchNames[$name])) {
            echo $resultMessage . " Nothing args or command.\n";

            return 1;
        }

        $product = new $batchNames[$name]($app, $this->createOptions($input));
        echo $resultMessage . "{$name}: Command start.\n";
        $product->execute();
        echo $product->getErrorMassage() ?? $resultMessage . "{$name}: Command complete.\n";

        return 0;
```
- ベース実装(pf-eccube3)の `UpdateProductSummaryForStockUp::execute()` は、在庫履歴取得、商品規格サブの入庫数更新、100件ごとの flush/cache clear、最終 flush だけを行っており、`MailService` や `hareruya_ec.service.mail` の呼び出しはない。したがって、ベースにも B02-03 のエラー時メール通知は確認できず、enterprise 側にも 0402 要求を満たす追加実装がない。

ベース実装 pf-eccube3 UpdateProductSummaryForStockUp は集計更新のみを行う: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php:8-41`
```php
class UpdateProductSummaryForStockUp extends ProductBatchService
{
    protected $commandName = 'updateProductSummaryForStockUp';
    protected $app;
    protected $options = [];

    /**
     * Constructor
     * @param Eccube\Application $app
     * @param array $options
     */
    function __construct(Application $app, $options = [])
    {
        $this->app = $app;
        $this->options = $options;
    }

    /**
     * storage stock
     */
    public function execute()
    {
        set_time_limit(0);
        $this->app['orm.em']->getConnection()->getConfiguration()->setSQLLogger(null);
        $stockHistories = $this->app['hareruya_ec.repository.stock_history']->getStockUpForUpdateSummary($this->app);
        foreach ($stockHistories as $index => $history) {
            $this->app['hareruya_ec.repository.product_sub_class']->updateProductSummaryColumnsForStockUp($this->app, $history);
            if ($index % 100 === 0) {
                $this->app['orm.em']->flush();
                EntityManagerUtil::clearCache($this->app['orm.em']);
            }
        }
        $this->app['orm.em']->flush();
    }
```

# 根拠
- 設計：
  - 0402 の B02-03 はエラーハンドリングとして、エラー時に集計できなかった旨をメールで送信すると定義している: `hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html:1126-1172`
- ec-cube-enterprise：
  - enterprise の B02-03 コマンドは例外時にコンソール出力だけを行い、メール送信処理を呼んでいない: `ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php:43-58`
  - enterprise の B02-03 実処理は MailService を注入せず、例外時は rollback 後に再スローする: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:18-49`
  - 近傍の週間在庫履歴更新では MailService 経由のエラー通知があるが、B02-03 ではない: `ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:20-80`
- ベース実装：
  - pf-eccube3 は updateProductSummaryForStockUp を ProductBatch 経由で実行するが、共通入口にメール送信処理はない: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-58`
  - pf-eccube3 の B02-03 相当処理は集計更新と flush/cache clear のみで、MailService 呼び出しはない: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php:8-41`

# 確認メモ
- 確認コマンド: `rg -n "エラーが発生した場合|集計できなかった|期間別入庫数集計|B02-03|updateProductSummaryForStockUp|product:batch" excel_to_html/output/0402_基本設計仕様書\(バッチ_在庫管理\).html excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html design_impl_drift_report/findings/b02-03_0402_sheet-5_sheet.json design_impl_drift_report/findings/b02-03_0404_sheet-5_sheet.json`
- 確認コマンド: `rg -n "WeeklyStockHistory|weekly_stock|send.*Error|ErrorMail|エラー通知|期間別入庫|入庫数|aggregate-stock-up|集計できなかった|stock_up|StockUp" ../ec-cube-enterprise/src/Eccube/Service/MailService.php ../ec-cube-enterprise/src/Eccube/Service/Product ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml`
- 確認コマンド: `rg -n "sendWeeklyStockHistoryErrorMail|MailService|send.*ErrorMail|AggregateStockUp|集計できなかった|期間別入庫" ../ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php ../ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php ../ec-cube-enterprise/src/Eccube/Service/MailService.php`
- 確認コマンド: `rg -n "hareruya_ec.service.mail|MailService|send.*Error|集計できなかった|updateProductSummaryForStockUp|ProductSummaryForStockUp" ../pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php ../pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php ../pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php`
- 0404 側にも B02-03 のコマンド名や100件単位反映など別差分があるが、本件は 0402 のエラー時メール通知要求だけを対象とする。
- MailService には週間在庫履歴更新など他バッチ向けエラー通知はあるが、期間別入庫数集計バッチ向けの送信処理は確認できない。
