/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチイベント
機能：決済処理中チェックバッチ
課題カテゴリ：実装違い
課題：取引不在・未完了時のメッセージを収集せず削除件数だけを返す
設計書：0413_基本設計仕様書(バッチ_イベント).xlsx

# 再現手順【必須】
1. 設計書 B13-01 の入出力・エラー処理で、取引不在・未完了等のメッセージ収集が失敗時出力として定義されていることを確認する
2. ベース実装 pf-eccube3 の `AbstractCheckPaymentEntry::check()` を確認し、取引不在・未完了・取引エラー時に `$messages[]` へ `OrderId<決済番号>...` を追加し、最後に `createResult($messages)` で返すことを確認する
3. ec-cube-enterprise の `PaymentStatusCheckAction::handle()` を確認し、取引不在・失敗時は `deletedAt` を設定して `flush()` し、戻り値は件数集計の `detail` のみで、個別メッセージを収集・返却しないことを確認する

# 期待される挙動【必須】
- 取引不在・未完了の場合は、記録除去などの所定処理を行ったうえで、対象の決済番号と理由が分かるメッセージを収集する
- バッチ結果として、失敗時出力に取引不在・未完了等のメッセージを含める
- 想定外エラーは重複を除いてまとめ、管理者へ通知する

# 現在の挙動【必須】
- ec-cube-enterprise の `PaymentStatusCheckAction::handle()` は、取引が存在しない・失敗している場合に `deletedAt` を設定して `flush()` し、`$cntDeleted++` するだけである。`OrderId<...>` やエラー理由を保持する配列はなく、戻り値の `detail` も対象・更新・保留・削除・エラーの件数集計に限られる。

ec-cube-enterprise は取引不在・失敗時に論理削除して削除件数だけを加算する: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:149-163`
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

ec-cube-enterprise のバッチ結果 detail は件数集計のみ: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:175-178`
```php
            $result = [
                'error' => $cntError,
                'detail' => '対象：'.$cntEntries.'件、更新：'.$cntUpdate.'件、保留：'.$cntPending.'件、削除：'.$cntDeleted.'件、エラー：'.$cntError.'件',
            ];
```
- ベース実装 pf-eccube3 では、`AbstractCheckPaymentEntry::check()` が取引不在・未完了・取引エラーのメッセージを `$messages[]` に追加し、`AbstractPaymentService::createResult()` がメッセージを改行連結して失敗結果として返す。

ベース実装 pf-eccube3 は取引不在・未完了メッセージを収集する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:45-59`
```php
            if ($message !== '') {
                if (
                    $message === $this->notExistingTransuctionMessage ||
                    $message === $this->transactionIncompleteMessage ||
                    $message === $this->transactionErrorMessage
                ) {
                    $messages[] = "OrderId<{$prePaymentNo}>{$message}";
                    continue;
                } elseif (!in_array($message, $errorMessages)) {
                    // SPLINKS取引不在/未完了 以外のエラーを1つにまとめてメールで通知する
                    $errorMessages[] = $message;
                }
            }

            $this->execRecordOperation($entry, $newStatus);
```

ベース実装 pf-eccube3 は収集メッセージをバッチ結果として返す: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractPaymentService.php:51-61`
```php
    /**
     * messagesの数によって異なる結果生成して返す
     * @param array
     * @return array(integer, string)
     */
    protected function createResult($messages)
    {
        return (count($messages) > 0) ?
            [$this::FAILED, implode("\n", $messages) . "\n"] :
            [$this::SUCCESS, $this->getCommandName() . " batch is success\n"];
    }
```

# 根拠
- 設計：
  - 詳細設計は失敗時出力として取引不在・未完了等のメッセージ収集を定義している: `hareruya-design-docs/excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html:944-965`
- ec-cube-enterprise：
  - 取引不在・失敗時は論理削除と件数加算のみで、個別メッセージを収集しない: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:154-178`
- ベース実装：
  - 取引不在・未完了・取引エラーを OrderId 付きメッセージとして収集する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:45-74`
  - 収集済みメッセージがある場合はバッチ結果を失敗として返す: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractPaymentService.php:51-61`

# 確認メモ
- 確認コマンド: `rg -n "取引不在・未完了|失敗時出力|メッセージ収集|想定外エラー" excel_to_html/output/0413_基本設計仕様書\(バッチ_イベント\).html design_impl_drift_report/findings/b13-01_0413_sheet-3_sheet.json`
- 確認コマンド: `rg -n "messages\[\]|createResult\(|notExistingTransuctionMessage|transactionIncompleteMessage|transactionErrorMessage|OrderId" ../pf-eccube3/app/Plugin/HareruyaEc/Service/Payment -g '*.php'`
- 確認コマンド: `rg -n "cntDeleted|detail|messages|OrderId|取引が存在しない・失敗|setDeletedAt" ../ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php`
