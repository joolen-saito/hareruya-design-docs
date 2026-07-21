/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチイベント
機能：決済処理中チェックバッチ
課題カテゴリ：実装漏れ
課題：同一決済番号のイベント申込で前回の照会結果を流用しない
設計書：0413_基本設計仕様書(バッチ_イベント).xlsx

# 再現手順【必須】
1. 設計書 B13-01 の処理フローで、直前と同じ決済番号の申込みは前回の照会結果に従って同様の処理を行う仕様であることを確認する
2. ベース実装 pf-eccube3 の `AbstractCheckPaymentEntry::check()` を確認し、`$prePaymentNo` と前回の `$message` / `$newStatus` により同一決済番号では取引照会を繰り返さず同様の処理を行うことを確認する
3. ec-cube-enterprise の `PaymentStatusCheckAction::handle()` を確認し、`paymentNo` 順に取得した申込をループしているが、前回の決済番号・照会結果を保持する変数や、同一決済番号時に前回結果を流用する分岐がないことを確認する

# 期待される挙動【必須】
- 決済処理中チェックバッチは、直前と同じ決済番号のイベント申込について、前回の取引照会結果に従って同様の更新・削除・保留処理を行う
- 同一決済番号の連続申込では、決済サービスへの重複照会を避け、前回結果を再利用する

# 現在の挙動【必須】
- ec-cube-enterprise の `PaymentStatusCheckAction::handle()` は、対象イベント申込をループし、各申込ごとに `$paymentNo = $EventEntry->getPaymentNo()` を取得して `getApiResponse($paymentNo)` を呼ぶ。前回の `paymentNo`、前回の照会結果、前回の新ステータスを保持する変数や、同一決済番号を検出して照会結果を流用する分岐はない。

ec-cube-enterprise は申込ごとに paymentNo を取得して getApiResponse を呼ぶ: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:76-108`
```php
        try {
            // イベント申込情報を取得
            $EventEntries = $this->eventEntryRepository->getBeforeMinutesEntry(30);

            // 件数(初期値)
            $cntEntries = count($EventEntries);
            $cntUpdate = 0;
            $cntPending = 0;
            $cntDeleted = 0;
            $cntError = 0;

            // 商品情報を取得
            foreach ($EventEntries as $EventEntry) {
                // イベント申込履歴の重複チェック：「申込ステータス＝申込済み(mtb_entry_status.id=4)」のレコード
                $EventHistories = $this->entryHistoryRepository->findBy([
                    'EventEntry' => $EventEntry->getId(),
                    'EntryStatus' => MtbEntryStatus::ENTERED,
                ]);
                if (count($EventHistories) > 0) {
                    $cntEntries--;
                    continue;
                }

                // SP.LINKS取引照会用データを取得
                $paymentNo = $EventEntry->getPaymentNo();
                $payingCustomerId = $EventEntry->getPayingCustomer()->getId();

                try {
                    // SP.LINKS取引照会API
                    $resultApi = $this->getApiResponse($paymentNo);  // TODO APIからのレスポンスから取得

                    // 取引が成功している場合
                    if ($resultApi === 'OK') {
```

ec-cube-enterprise の分岐は現在申込の resultApi のみで処理する: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:149-163`
```php
                    // 参照に失敗しているコードの場合は決済結果はわからないため、イベント申し込みは保留
                    } elseif (array_key_exists($resultApi, $this->pendingResponseCds)) {
                        log_error('決済処理中チェックで参照に失敗: PaymentNo: '.$paymentNo.', Error: '.$this->pendingResponseCds[$resultApi]);
                        $cntPending++;
                        continue;
                    // 取引が存在しない・失敗している場合（決済画面での離脱やキャンセルを含む）
                    } else {
                        // イベント申込を削除（論理削除）する、トランザクション不要
                        $time = new \DateTime();
                        $EventEntry->setDeletedAt($time);
                        $this->entityManager->persist($EventEntry);
                        $this->entityManager->flush();

                        $cntDeleted++;
                    }
```
- ベース実装 pf-eccube3 では、`AbstractCheckPaymentEntry::check()` が `$prePaymentNo` を保持し、現在申込の決済番号が直前と同じ場合は `$message` の前回値を見て `execRecordOperation()` または `removeRecord()` を実行し、`execSearch()` による取引照会をスキップする。

ベース実装 pf-eccube3 は同一 paymentNo の場合に前回結果を流用する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:23-43`
```php
        $message = '';
        $messages = [];
        $errorMessages = [];
        $prePaymentNo = '';
        foreach ($entries as $entry) {
            // 1つ前のpaymentNoと同じ時に、前回の結果($message)から判断して同様の処理を行う
            if ($prePaymentNo === $entry->getPaymentNo()) {
                switch ($message) {
                    case '':
                        $this->execRecordOperation($entry, $newStatus);
                        break;
                    case $this->notExistingTransuctionMessage:
                        $this->removeRecord($entry);
                        break;
                }
                continue;
            }
            $result = $this->execSearch($entry, true);
            $message = $result[0];
            $newStatus = $result[1];
            $prePaymentNo = $entry->getPaymentNo();
```

# 根拠
- 設計：
  - 詳細設計は同一決済番号の申込で前回の照会結果を流用することを要求している: `hareruya-design-docs/excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html:919-943`
- ec-cube-enterprise：
  - 対象申込をループして毎回 getApiResponse を呼び、前回結果流用用の変数・分岐がない: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:76-108`
- ベース実装：
  - 前回の決済番号と照会結果を保持し、同一決済番号では照会せず前回結果で処理する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:23-43`

# 確認メモ
- 確認コマンド: `rg -n "直前と同じ決済番号|同一決済番号|前回結果|checkProssesingPayment" excel_to_html/output/0413_基本設計仕様書\(バッチ_イベント\).html design_impl_drift_report/findings/b13-01_0413_sheet-3_sheet.json`
- 確認コマンド: `rg -n "prePaymentNo|前回|同じ決済番号|execSearch\(|getPaymentNo\(\)" ../pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php`
- 確認コマンド: `rg -n "prePaymentNo|previous|前回|同一決済番号|getApiResponse\(|getPaymentNo\(\)" ../ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php ../ec-cube-enterprise/src/Eccube/Repository/DtbEventEntryRepository.php`
