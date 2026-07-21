# b05-05_0405_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-05_0405_sheet-7_sheet.json#b05-05_0405_sheet-7_sheet-conformance-b4cd2e3f7de2`
- 機能: B05-05 B05-05 スマレジ商品削除
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は本バッチが楽観ロック・悲観ロックの対象を持たないと明記するが、実装は MessengerJob に対し悲観ロック(PESSIMISTIC_WRITE)を取得している。

## 判定理由
設計書 sheet-7『排他制御・トランザクション』の本文(行1633)は『本バッチは削除連携が主であり、楽観ロック・悲観ロックの対象は持たない。』と明記している。一方、実装の SmaregiOtcDeleteMessageHandler は SmaregiMessengerJobProcessingLock を注入(行45)し、__invoke 内で tryBeginProcessingJob($Job) を呼んで削除本線に入る(行73)。当該ロッククラス SmaregiMessengerJobProcessingLock::tryBeginProcessingJob は Doctrine の EntityManager::lock($Job, LockMode::PESSIMISTIC_WRITE) を実行して MessengerJob 行に悲観ロックを取得しており(行43)、クラスの docblock も『重複実行抑止（悲観ロック + 状態遷移）』と記す(行24)。したがって『悲観ロックの対象は持たない』とする設計に反し、実装は削除処理の本線で悲観ロックを使用している。別経路（重複実行抑止を悲観ロック以外で実現している等）を確認するため MessageHandler / ProcessingLock 実体を精査したが、削除本線のロックは PESSIMISTIC_WRITE で確定しており設計との相違は事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1632-1633` — 設計要求（排他制御・トランザクション）

```html
          <h2 id="function-design-b05-05-b05-05_batch_order_order_delete_smaregi_product-排他制御・トランザクション">排他制御・トランザクション</h2>
          <p>本バッチは削除連携が主であり、楽観ロック・悲観ロックの対象は持たない。</p>
```

## ec-cube-enterprise 実装
削除本線に入る前に tryBeginProcessingJob を呼ぶ
`ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:45-73` — MessageHandler がロックを注入・実行

```php
        private SmaregiMessengerJobProcessingLock $smaregiMessengerJobProcessingLock,
        private MessengerJobRepository $messengerJobRepository,
        private OrderRepository $orderRepository,
        private SmaregiAccessTokenService $accessTokenService,
        private SmaregiOtcDeleteService $deleteService,
        private SmaregiMessengerJobContext $smaregiMessengerJobContext,
        private string $smaregiApiIdUrl,
        private string $smaregiApiUrl,
        private string $smaregiApiClientId,
        private string $smaregiApiClientSecret,
        private string $smaregiApiContractId,
    ) {
    }

    public function __invoke(SmaregiOtcDeleteMessage $message): void
    {
        $Job = $this->messengerJobRepository->find($message->getJobId());
        if (!$Job instanceof MessengerJob) {
            $this->logger->error('MessengerJob not found for SmaregiOtcDeleteMessage', [
                'jobId' => $message->getJobId(),
                'orderId' => $message->getOrderId(),
            ]);

            return;
        }

        $this->smaregiMessengerJobContext->setJobId((int) $Job->getId());
        try {
            if (!$this->smaregiMessengerJobProcessingLock->tryBeginProcessingJob($Job)) {
```

Doctrine LockMode::PESSIMISTIC_WRITE を MessengerJob 行に適用
`ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiMessengerJobProcessingLock.php:24-43` — ロック実体は悲観ロックを取得

```php
 * スマレジ連携用 MessengerJob の重複実行抑止（悲観ロック + 状態遷移）.
 */
final readonly class SmaregiMessengerJobProcessingLock
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * 同一 job の重複実行を防ぐため、行ロックのうえで pending / failed のときのみ processing へ遷移する.
     *
     * @return bool 処理を続行する場合 true、スキップする場合 false
     */
    public function tryBeginProcessingJob(MessengerJob $Job): bool
    {
        $this->entityManager->beginTransaction();
        try {
            $this->entityManager->lock($Job, LockMode::PESSIMISTIC_WRITE);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証5観点すべて試みたが崩せず、指摘は維持。(1)引用の正確性: 設計 0405_基本設計仕様書(バッチ_受注管理).html:1633 は heading『排他制御・トランザクション』(1632) 直下で『本バッチは削除連携が主であり、楽観ロック・悲観ロックの対象は持たない。』と明記(実読確認済み)。実装 SmaregiMessengerJobProcessingLock.php:43 は `$this->entityManager->lock($Job, LockMode::PESSIMISTIC_WRITE)` を実行、docblock(24行)も『悲観ロック + 状態遷移』、Handler は 45行で注入・73行で tryBeginProcessingJob($Job) を削除本線で呼ぶ。引用は全て正確。(2)別実装/回避: PESSIMISTIC_WRITE を使いつつ『悲観ロックを持たない』を満たす別経路は原理上存在しない。Command/Dispatcher/Handler を全読したが、削除本線のロックはこの1経路で確定。(3)設計側除外: 近傍(1600-1637)に Ph2/対象外/現行踏襲/MessengerJob 除外 等の注記なし。設計文は無条件で『ロック対象を持たない』と断言しており、除外注記どころか指摘を補強する。(4)要求読み違い: 『本バッチ』は B05-05 機能全体を指し、非同期ワーカーである MessageHandler もこの機能の実装。設計は排他制御セクションで機能の排他制御方針を述べ『持たない』と断言、実装は MessengerJob 行に悲観ロックを持つ。文言と実装は直接矛盾。ロック対象が業務データ(dtb_order)でなく MessengerJob(重複実行抑止)である点も、設計文が無条件断言のため免責にならない。(5)重複: 本チャンク単一項目で重複なし。以上より実装は設計に反して悲観ロックを使用しており事実として乖離が確定。
