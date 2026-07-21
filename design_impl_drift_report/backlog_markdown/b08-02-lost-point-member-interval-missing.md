/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ会員
機能：ポイント失効
課題カテゴリ：実装漏れ
課題：ポイント失効バッチで会員ごとの短いインターバルを挟んでいない
設計書：0408_基本設計仕様書(バッチ_会員).xlsx

# 再現手順【必須】
1. 設計書 B08-02 の処理フロー・業務ルールで、リクエスト上限に配慮して会員ごとに短いインターバルを挟む要求を確認する
2. ベース実装 pf-eccube3 の `LostPoints::execute()` が失効対象会員ループ内で `usleep(100000)` を実行していることを確認する
3. ec-cube-enterprise の `LostPointsAction::handle()` を確認し、失効対象会員の `foreach` 内に `sleep()` / `usleep()` などの待機処理がないことを確認する

# 期待される挙動【必須】
- ポイント失効バッチは、失効対象会員ごとの処理間に短いインターバルを挟む
- スマレジ連携など外部リクエストの流量制御に配慮する

# 現在の挙動【必須】
- ec-cube-enterprise の `LostPointsAction::handle()` は失効対象会員を `foreach` で処理するが、ループ内に `sleep()`、`usleep()`、インターバル用サービス呼び出しなどの待機処理がない。

ec-cube-enterprise の LostPointsAction は会員ごとの待機なしで処理する: `ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:41-116`
```php
    public function handle(): void
    {
        $lostPointPlayers = $this->pointHistoryRepository->getPlayersForLostPoint();
        $PointType = $this->pointTypeRepository->find(MtbPointType::GRANTED_TYPE);

        if (empty($lostPointPlayers)) {
            $this->logger->info('ポイント失効処理対象なし');

            return;
        }

        foreach ($lostPointPlayers as $lostPointPlayer) {
            $Player = $lostPointPlayer['player'];
            $remainingPoint = (int) $lostPointPlayer['remainingPoint'];
            $losePoint = $remainingPoint - $Player->getPoint();

            if ($losePoint === 0) {
                // 失効分が無ければ EC・スマレジともに更新不要。
                continue;
            }

            $LostPointHistory = new DtbPointHistory();
            $job = null;

            try {
                $this->entityManager->beginTransaction();

                $Player->setPoint($remainingPoint);
                $this->entityManager->persist($Player);

                $this->pointHistoryEntityManager->save(
                    PointHistory: $LostPointHistory,
                    Customer: $Player->getCustomer(),
                    Order: null,
                    PointType: $PointType,
                    pointChange: $losePoint,
                    note: self::NOTE,
                    issueDate: (new \DateTime())->modify('+183 days'),
                    transactionId: null,
                );

                // EC 失効と同一トランザクションでスマレジ連携ジョブを積む（未連携・増減0は null）。
                $job = $this->smaregiCustomerPointEventService->registerPointAddJob($LostPointHistory);

                $this->entityManager->flush();
                $this->entityManager->commit();
            } catch (\Throwable $e) {
                try {
                    if ($this->entityManager->getConnection()->isTransactionActive()) {
                        $this->entityManager->rollback();
                    }
                } catch (\Throwable) {
                    // ロールバック自体の失敗は握りつぶす（下で打ち切り判定する）。
                }

                $this->logger->error('ポイント失効処理に失敗しました', [
                    'player_id' => $Player->getId(),
                    'smaregi_id' => $Player->getSmaregiId(),
                    'message' => $e->getMessage(),
                ]);

                if (!$this->entityManager->isOpen()) {
                    // flush 失敗等で EntityManager が閉じた場合は以降を処理できないため打ち切る（残りは次回実行で再処理）。
                    $this->logger->error('EntityManager が閉じたためポイント失効バッチを中断します（残りは次回実行で再処理）');

                    break;
                }

                continue;
            }

            // commit 成功後にのみスマレジ連携メッセージを dispatch する（アウトボックス的な順序）。
            if ($job !== null) {
                $this->smaregiCustomerPointEventService->dispatchPointAddMessage($job, $LostPointHistory);
            }
        }
```
- ベース実装(pf-eccube3)では失効対象会員の `foreach` 直後に `usleep(100000)` を実行し、会員ごとに短いインターバルを挟んでからスマレジ連携・保有ポイント更新・履歴作成へ進む。

ベース実装 pf-eccube3 の LostPoints は会員ごとに usleep する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/LostPoints.php:33-63`
```php
    public function execute()
    {
        $app = $this->app;
        $now = new \DateTime();

        $lostPointPlayers = $app['hareruya_ec.repository.point_history']->getPlayersForLostPoint($app);
        $grantedPointType = $app['hareruya_ec.repository.point_type']->find(MtbPointType::GRANTED_TYPE);
        foreach ($lostPointPlayers as $lostPointPlayer) {
            usleep(100000);
            $player = $lostPointPlayer['player'];
            $losePoint = $lostPointPlayer['remainingPoint'] - $player->getPoint();
            // スマレジ連携
            $response = $app['hareruya_ec.service.smaregi_customer']->postSmaregiPoint($player->getSmaregiId(), $losePoint, false);
            if (is_null($response) || !array_key_exists('result', $response)) {
                continue;
            }
            $player->setPoint($lostPointPlayer['remainingPoint']);

            $history = new DtbPointHistory();
            $history
                ->setCustomer($player->getCustomer())
                ->setPointChange($losePoint)
                ->setNote(self::NOTE)
                ->setIssueDate(new \DateTime())
                ->setCreateDate(new \DateTime())
                ->setPointType($grantedPointType);

            $app['orm.em']->persist($player);
            $app['orm.em']->persist($history);
        }
        $app['orm.em']->flush();
```

# 根拠
- 設計：
  - B08-02 はリクエスト上限への配慮として会員ごとの短いインターバルを要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1160-1188`
  - B08-02 の排他制御・トランザクション節も流量制御のためのインターバルを要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1215`
- ec-cube-enterprise：
  - enterprise の会員ループには sleep/usleep 等の待機処理がない: `ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:41-116`
- ベース実装：
  - pf-eccube3 は失効対象会員ごとに `usleep(100000)` を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/LostPoints.php:33-63`

# 確認メモ
- 確認コマンド: `rg -n "usleep|sleep|interval|インターバル|流量制御|foreach \\(\\$lostPointPlayers|LostPointsAction|LostPoints.php" ../ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php ../ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php ../pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/LostPoints.php excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html design_impl_drift_report/findings/b08-02_0408_sheet-4_sheet.json`
- 確認コマンド: `rg -n "sleep|usleep|インターバル|流量制御" ../ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php ../ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php`
