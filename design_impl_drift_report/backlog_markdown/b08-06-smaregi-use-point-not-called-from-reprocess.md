/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ会員
機能：スマレジ使用ポイント連携
課題カテゴリ：実装漏れ
課題：購入完了再処理からスマレジ使用ポイント連携が起動されない
設計書：0408_基本設計仕様書(バッチ_会員).xlsx

# 再現手順【必須】
1. 設計書 B08-06 の概要・利用者視点の入口で、スマレジ使用ポイント連携が購入完了処理および購入完了再処理から別プロセスで呼び出される仕様であることを確認する
2. ベース実装 pf-eccube3 の通常購入完了処理と購入完了再処理を確認し、どちらも `smaregi:batch updatePoint <受注ID>` を別プロセス起動していることを確認する
3. ec-cube-enterprise の通常購入完了処理を確認し、`SmaregiOrderUsePointEventService` による使用ポイント連携ジョブ登録・dispatch が存在することを確認する
4. ec-cube-enterprise の管理受注編集・ステータス変更経路を確認し、出荷完了時に発生ポイント連携だけを登録・dispatch しており、使用ポイント連携ジョブを登録・dispatch していないことを確認する

# 期待される挙動【必須】
- 購入完了処理と購入完了再処理のどちらからも、受注で使用したポイントのスマレジ減算連携が別プロセスまたは非同期ジョブとして起動される
- 受注の使用ポイントは負の値としてスマレジ会員ポイントへ連携される
- 連携失敗時は受注側にエラーメッセージとエラーフラグを記録し、後続の再連携対象にできる

# 現在の挙動【必須】
- ec-cube-enterprise の通常購入完了処理には使用ポイント連携が存在する。`Front\ShoppingController` は受注確定トランザクション内で `registerUsePointJob($Order)` を呼び、commit 後に `dispatchUsePointMessage($usePointJob, $Order)` を実行する。したがって本件は使用ポイント連携全体の欠落ではなく、購入完了再処理側の起動漏れである。

ec-cube-enterprise の通常購入完了処理は使用ポイント連携ジョブを登録・dispatch する: `ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:523-602`
```php
                // 使用ポイントのスマレジ連携ジョブを受注確定と同一トランザクションで作成（dispatch は commit 後）。
                $usePointJob = $this->smaregiOrderUsePointEventService->registerUsePointJob($Order);

                $this->entityManager->flush();

                // トランザクションをコミット
                if ($this->entityManager->getConnection()->isTransactionActive()) {
                    $this->entityManager->commit();
                }

                log_info('[注文処理] 注文処理が完了しました.', [$Order->getId()]);
            } catch (ShoppingException $e) {
                log_error('[注文処理] 購入エラーが発生しました.', [$e->getMessage()]);

                // トランザクションをロールバック
                if ($this->entityManager->getConnection()->isTransactionActive()) {
                    $this->entityManager->rollback();
                }

                $this->addError($e->getMessage());

                return $this->redirectToRoute('shopping_error');
            } catch (\Exception $e) {
                log_error('[注文処理] 予期しないエラーが発生しました.', [$e->getMessage()]);

                // トランザクションをロールバック
                if ($this->entityManager->getConnection()->isTransactionActive()) {
                    $this->entityManager->rollback();
                }

                $this->addError('front.shopping.system_error');

                return $this->redirectToRoute('shopping_error');
            }

            $customerAddressId = (int) $this->session->get(OrderHelper::SESSION_SHOPPING_CUSTOMER_ADDRESS_ID);

            // カート削除
            log_info('[注文処理] カートをクリアします.', [$Order->getId()]);
            $this->cartService->clear();

            // 受注IDをセッションにセット
            $this->session->set(OrderHelper::SESSION_ORDER_ID, $Order->getId());

            // メール送信
            log_info('[注文処理] 注文メールの送信を行います.', [$Order->getId()]);
            $this->mailService->sendOrderMail($Order, $customerAddressId);

            log_info('[注文処理] 売上分析タグの登録を行います.', [$Order->getId()]);
            $taglogProducts = []; // 購入タグログ設置のための商品配列
            foreach ($Order->getProductOrderItems() as $OrderItem) {
                $Product = $OrderItem->getProduct();
                if ($Product !== null) {
                    // 購入タグログ設置のための商品配列に追加
                    $taglogProducts[] = [
                        'productId' => $Product->getId(),
                        'price' => $OrderItem->getPrice(),
                        'quantity' => $OrderItem->getQuantity(),
                    ];

                    // 商品に紐づく売上分析タグ取得
                    $TagSalesAnalyses = $Product->getTagSalesAnalysis();
                    $tagIds = [];
                    foreach ($TagSalesAnalyses as $TagSalesAnalysis) {
                        $tagIds[] = $TagSalesAnalysis->getId();
                    }

                    // 受注明細に紐づく売上分析タグ登録
                    $orderItemId = $OrderItem->getId();
                    if ($tagIds !== [] && $orderItemId !== null) {
                        $this->orderItemRepository->insertTagSalesAnalyses($orderItemId, $tagIds);
                    }
                }
            }

            $this->entityManager->flush();

            // 受注確定の commit 成功後に使用ポイント連携メッセージを送信する（アウトボックス的な順序）。
            if ($usePointJob !== null) {
                $this->smaregiOrderUsePointEventService->dispatchUsePointMessage($usePointJob, $Order);
```

ec-cube-enterprise の使用ポイント連携サービスは使用ポイント0・スマレジIDなしを除外してジョブ化する: `ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:25-83`
```php
/**
 * 注文完了時の使用ポイントをスマレジ会員ポイントへ非同期反映するための連携ジョブを扱う.
 *
 * 受注確定と同一トランザクションで MessengerJob を INSERT し（{@see registerUsePointJob()}）、
 * commit 成功後に {@see dispatchUsePointMessage()} でメッセージを送る（アウトボックス的な順序）。
 */
class SmaregiOrderUsePointEventService
{
    public function __construct(
        private readonly MessageBusInterface $messageBus,
        private readonly EntityManagerInterface $entityManager,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * 受注確定と同一 DB トランザクションで連携ジョブを積む（flush は呼び出し側）.
     *
     * スマレジ未連携（smaregi_id 無し）や使用ポイント 0 の場合は連携不要のため null を返す。
     */
    public function registerUsePointJob(Order $Order): ?MessengerJob
    {
        $smaregiId = $Order->getCustomer()?->getPlayer()?->getSmaregiId();
        if ($smaregiId === null || $smaregiId === '') {
            return null;
        }

        $spendedPoints = $Order->getSpendedPoints();
        if ($spendedPoints === null || $spendedPoints === 0) {
            return null;
        }

        $job = new MessengerJob();
        $job->setMessageClass(SmaregiOrderUsePointMessage::class);
        $job->setStatus(MessengerJob::STATUS_PENDING);
        $job->setPayloadSummary(sprintf('orderId=%s spendedPoints=%d', $Order->getId(), $spendedPoints));
        $this->entityManager->persist($job);

        return $job;
    }

    /**
     * registerUsePointJob の flush / commit 成功後にのみ呼ぶ。
     * メッセージバス投入に失敗しても例外は投げず、ジョブを FAILED にしてログする（受注は既に確定済み）。
     */
    public function dispatchUsePointMessage(MessengerJob $job, Order $Order): void
    {
        $jobId = (int) $job->getId();
        if ($jobId < 1) {
            $this->logger->error('Smaregi order use-point job has no id; cannot dispatch message bus.', [
                'orderId' => $Order->getId(),
            ]);

            return;
        }

        try {
            $this->messageBus->dispatch(new SmaregiOrderUsePointMessage((int) $Order->getId(), $jobId));
        } catch (\Throwable $e) {
```
- 一方、ec-cube-enterprise の管理受注編集・ステータス変更経路では、出荷完了時に `SmaregiOrderGainPointEventService` で発生ポイント連携ジョブを積み、commit 後に `dispatchGainPointMessage()` だけを呼んでいる。`Admin\Order\EditController` 内に `registerUsePointJob()` / `dispatchUsePointMessage()` / `SmaregiOrderUsePointEventService` の使用はなく、設計が要求する購入完了再処理からの使用ポイント減算連携起動を満たしていない。

ec-cube-enterprise の管理受注編集保存は出荷完了時に発生ポイント連携だけを登録・dispatch する: `ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:676-713`
```php
                // 新たに出荷完了へ遷移した場合、確定後の発生ポイント（applyOrderPointAndOperatorFromForm 反映後の最終値）を
                // 会員残高へ反映し、同一トランザクションでスマレジ連携ジョブを積む（dispatch は commit 後）.
                if ($statusChangedToDelivered) {
                    $this->pointService->gainPoints($TargetOrder);
                    $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
                }

                if ($TargetOrder->getSmaregiCode()
                    && $TargetOrder->getOrderStatus() !== null
                    && $TargetOrder->getOrderStatus()->getId() !== OrderStatus::CANCEL) {
                    $this->smaregiApiService->postSmaregiProcess($TargetOrder, ['product']);
                }
                // wrapInTransaction が成功時に最終 flush + DB commit する（失敗時は rollback）
            });
        } catch (PurchaseException $e) {
            $this->addError($e->getMessage(), 'admin');

            return null;
        } catch (ShoppingException $e) {
            $this->addError($e->getMessage(), 'admin');

            return null;
        } catch (\InvalidArgumentException $e) {
            log_error('受注ステータス遷移に失敗しました', ['exception' => $e]);
            $old = $OriginOrder->getOrderStatus();
            $new = $TargetOrder->getOrderStatus();
            $this->addError(trans('admin.order.failed_to_change_status__short', [
                '%from%' => $old?->getName() ?? '-',
                '%to%' => $new?->getName() ?? '-',
            ]), 'admin');

            return null;
        }

        // 受注確定の commit 成功後に発生ポイント連携メッセージを送信する（アウトボックス的な順序）。
        if ($gainPointJob !== null) {
            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
        }
```

ec-cube-enterprise の管理受注ステータス変更も発生ポイント連携だけを登録・dispatch する: `ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:798-829`
```php
        $gainPointJob = null;
        $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $statusChangedToDelivered, $isFirstCancellation, $OldOrderStatus, $NewOrderStatus, &$gainPointJob): void {
            if ($OldOrderStatus !== null && $NewOrderStatus !== null) {
                $this->orderStateMachine->apply($TargetOrder, $NewOrderStatus);
            }

            $TargetOrder
                ->setMember($this->getMember())
                ->setUpdateDate(new \DateTime());
            $this->entityManager->persist($TargetOrder);

            // 新たに出荷完了になった場合、ポイントを付加
            if ($statusChangedToDelivered) {
                $this->pointService->gainPoints($TargetOrder);
                // 発生ポイントのスマレジ連携ジョブを同一トランザクションで積む（dispatch は commit 後）.
                $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
            }
            if ($isFirstCancellation) {
                $this->pointService->cancelOrderPoints($TargetOrder);
            }

            if ($TargetOrder->getSmaregiCode()
                && $TargetOrder->getOrderStatus() !== null
                && $TargetOrder->getOrderStatus()->getId() !== OrderStatus::CANCEL) {
                $this->smaregiApiService->postSmaregiProcess($TargetOrder, ['product']);
            }
        });

        // 受注確定の commit 成功後に発生ポイント連携メッセージを送信する（アウトボックス的な順序）。
        if ($gainPointJob !== null) {
            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
        }
```
- ベース実装 pf-eccube3 では、通常購入完了処理と購入完了再処理の両方で使用ポイントがある場合に `smaregi:batch updatePoint <受注ID>` を別プロセス起動する。`UpdatePoint` は受注サブの使用ポイントを負の値で `postSmaregiPoint()` に渡し、失敗時は受注サブへエラーを保存する。

ベース実装 pf-eccube3 の通常購入完了処理は updatePoint を別プロセス起動する: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:540-543`
```php
        // スマレジポイント連携を別プロセスで実行
        if ($orderSub->getSpendedPoints()) {
            $process = new Process("nohup php {$app['config']['root_dir']}/app/console smaregi:batch updatePoint {$order->getId()} &");
            $process->run();
```

ベース実装 pf-eccube3 の購入完了再処理は updatePoint を別プロセス起動する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/ResendMail.php:52-59`
```php
                if ($orderSub->getSpendedPoints()) {
                    // ポイント履歴を確認して履歴がない場合はポイント処理を行う
                    if (empty($this->app['hareruya_ec.repository.point_history']->findByOrder($order))) {
                        $this->app['hareruya_ec.service.point']->spendPoints($order);
                    }
                    // スマレジポイント連携を別プロセスで実行
                    $process = new Process("nohup php {$this->app['config']['root_dir']}/app/console smaregi:batch updatePoint {$order->getId()} &");
                    $process->run();
```

ベース実装 pf-eccube3 の UpdatePoint は使用ポイントを負の値でスマレジへ連携し、失敗時に受注サブへ保存する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/UpdatePoint.php:32-49`
```php
        if (empty($options) || !is_numeric($options[0])) {
            return;
        }

        $orderId = $options[0];
        $orderSub = $app['hareruya_ec.repository.order_sub']->find($orderId);
        $player = $app['hareruya_ec.repository.player']->findOneByCustomer($orderSub->getOrder()->getCustomer());

        $response = $app['hareruya_ec.service.smaregi_customer']->postSmaregiPoint($player->getSmaregiId(), -$orderSub->getSpendedPoints(), false);
        if (array_key_exists('result', $response)) {
            return;
        }

        $orderSub
            ->setPointErrorMessage(json_encode($response, JSON_UNESCAPED_UNICODE))
            ->setSmaregiErrorFlg(true);
        $app['orm.em']->persist($orderSub);
        $app['orm.em']->flush();
```

# 根拠
- 設計：
  - B08-06 は購入完了処理・購入完了再処理から別プロセスで起動し、使用ポイントを減算連携することを要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1681-1717`
- ec-cube-enterprise：
  - 通常購入完了では使用ポイント連携ジョブを登録・dispatch している: `ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:523-602`
  - 管理受注編集保存では発生ポイント連携だけを登録・dispatch しており、使用ポイント連携の呼び出しがない: `ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:676-713`
  - 管理受注ステータス変更でも発生ポイント連携だけを登録・dispatch しており、使用ポイント連携の呼び出しがない: `ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:798-829`
- ベース実装：
  - pf-eccube3 の購入完了再処理は使用ポイントがある受注で `smaregi:batch updatePoint` を別プロセス起動する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/ResendMail.php:52-59`
  - pf-eccube3 の通常購入完了処理も使用ポイントがある受注で `smaregi:batch updatePoint` を別プロセス起動する: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:540-543`
  - pf-eccube3 の UpdatePoint は使用ポイントを負の値でスマレジへ連携し、失敗時にエラーを保存する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/UpdatePoint.php:32-49`

# 確認メモ
- 確認コマンド: `rg -n "B08-06|スマレジ使用ポイント連携|smaregi:batch updatePoint|購入完了再処理|消費ポイント|減算連携" excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html design_impl_drift_report/findings/b08-06_0408_sheet-8_sheet.json`
- 確認コマンド: `rg -n "SmaregiOrderUsePointEventService|registerUsePointJob|dispatchUsePointMessage|SmaregiOrderGainPointEventService|registerGainPointJob|dispatchGainPointMessage|spendedPoints|postSmaregiProcess" ../ec-cube-enterprise/src/Eccube/Controller/Front ../ec-cube-enterprise/src/Eccube/Controller/Admin/Order ../ec-cube-enterprise/src/Eccube/Service -g '*.php'`
- 確認コマンド: `rg -n "smaregi:batch updatePoint|UpdatePoint|ResendMail|spendedPoints|postSmaregiPoint|setPointErrorMessage|setSmaregiErrorFlg" ../pf-eccube3/app/Plugin/HareruyaEc/Controller ../pf-eccube3/app/Plugin/HareruyaEc/Service ../pf-eccube3/app/Plugin/HareruyaEc/Command -g '*.php'`
