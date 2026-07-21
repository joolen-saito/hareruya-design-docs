/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチイベント
機能：決済処理中チェックバッチ
課題カテゴリ：実装違い
課題：決済処理中チェックバッチが更新を最後に一括確定せず申込ごとに確定する
設計書：0413_基本設計仕様書(バッチ_イベント).xlsx

# 再現手順【必須】
1. 設計書 B13-01 の処理フローで、申込履歴を記録し更新を最後に確定する仕様であることを確認する
2. ベース実装 pf-eccube3 の `AbstractCheckPaymentEntry::check()` を確認し、各申込の更新・削除を積んだ後、ループ後に `createEntryHistory()` と `flush()` を実行していることを確認する
3. ec-cube-enterprise の `PaymentStatusCheckAction::handle()` を確認し、成功時は申込ごとに `beginTransaction()`、`flush()`、`commit()` を行い、取引不在・失敗時も申込ごとに `flush()` することを確認する

# 期待される挙動【必須】
- 決済処理中チェックバッチは、対象申込の照会・更新・削除・履歴記録を処理した後、最後に更新を確定する
- 途中の申込単位でDB確定せず、バッチ処理単位で整合した結果を確定する

# 現在の挙動【必須】
- ec-cube-enterprise では、取引成功時に申込ごとにトランザクションを開始し、申込ステータス更新と履歴追加を `flush()` して `commit()` する。取引不在・失敗時も申込ごとに `setDeletedAt()` 後に `flush()` するため、バッチ末尾でまとめて確定する設計・ベース実装とは確定タイミングが異なる。

ec-cube-enterprise は成功時に申込ごとに beginTransaction/flush/commit する: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:113-132`
```php
                        $this->entityManager->getConnection()->beginTransaction(); // ← トランザクション開始

                        try {
                            // イベント申込の申込ステータスを「申込済み(mtb_entry_status.id=4)」にする
                            $EventEntry->setEntryStatus($EntryStatus);
                            $this->entityManager->persist($EventEntry);

                            // イベント申込履歴を「申込ステータス＝申込済み(mtb_entry_status.id=4)」として追加する
                            $EventHistory = new DtbEntryHistory();
                            $EventHistory->setEventEntry($EventEntry);
                            $EventHistory->setEntryStatus($EntryStatus);
                            $EventHistory->setMemberId(null);
                            $EventHistory->setCreateDate(new \DateTime());
                            $this->entityManager->persist($EventHistory);
                            $this->entityManager->flush();

                            $this->entityManager->getConnection()->commit();
                        } catch (\Throwable $e) {
                            $this->entityManager->getConnection()->rollBack(); // flush失敗時はロールバック
                            throw $e;
```

ec-cube-enterprise は取引不在・失敗時も申込ごとに flush する: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:154-162`
```php
                    // 取引が存在しない・失敗している場合（決済画面での離脱やキャンセルを含む）
                    } else {
                        // イベント申込を削除（論理削除）する、トランザクション不要
                        $time = new \DateTime();
                        $EventEntry->setDeletedAt($time);
                        $this->entityManager->persist($EventEntry);
                        $this->entityManager->flush();

                        $cntDeleted++;
```
- ベース実装 pf-eccube3 では、ループ内で `execRecordOperation()` や `removeRecord()` により永続化対象を積み、ループ後に `createEntryHistory()` を実行してから `flush()` する。これにより処理した申込の履歴記録と更新確定が末尾に集約されている。

ベース実装 pf-eccube3 はループ後に履歴記録と flush を行う: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:57-74`
```php
            }

            $this->execRecordOperation($entry, $newStatus);
        }

        if (!empty($errorMessages)) {
            $transport = new \Swift_SmtpTransport('localhost', 25);
            $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
            $transport->setPassword('');
            $this->app['mailer'] = new \Swift_Mailer($transport);

            $this->app['hareruya_ec.service.mail']->sendCheckPaymentErrorMail($errorMessages);
        }

        $this->app['hareruya_ec.repository.entry_history']->createEntryHistory($this->app, $entries);
        $this->app['orm.em']->flush();

        return $this->createResult($messages);
```

ベース実装 pf-eccube3 の removeRecord は削除対象を積むだけで flush しない: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractPaymentService.php:38-49`
```php
    /**
     * 子レコードも含めて一括削除
     *
     * @param DtbEventEntry $entry
     */
    protected function removeRecord($entry)
    {
        foreach ($entry->getEntryPlayers()->getValues() as $eventPlayer) {
            $this->app['orm.em']->remove($eventPlayer);
        }
        $this->app['orm.em']->remove($entry);
    }
```

# 根拠
- 設計：
  - 詳細設計は申込履歴を記録し、更新を最後に確定することを要求している: `hareruya-design-docs/excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html:919-948`
- ec-cube-enterprise：
  - 成功時は申込ごとにトランザクションを開始して flush/commit する: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:113-132`
  - 削除時も申込ごとに flush する: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:154-162`
- ベース実装：
  - ループ後に履歴を作成し、最後に flush する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:57-74`

# 確認メモ
- 確認コマンド: `rg -n "最後に確定|更新を確定|申込履歴を記録|照会・更新" excel_to_html/output/0413_基本設計仕様書\(バッチ_イベント\).html design_impl_drift_report/findings/b13-01_0413_sheet-3_sheet.json`
- 確認コマンド: `rg -n "beginTransaction|commit|rollBack|flush\(|setDeletedAt|DtbEntryHistory" ../ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php`
- 確認コマンド: `rg -n "createEntryHistory|flush\(|removeRecord|execRecordOperation" ../pf-eccube3/app/Plugin/HareruyaEc/Service/Payment -g '*.php'`
