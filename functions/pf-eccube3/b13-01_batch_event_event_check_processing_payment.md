# バッチ イベント管理 — 決済処理中チェックバッチ

## 業務ロジック

### 対象が無いとき・バッチ名が一致しないとき

対象の申込みが0件のときは、照会を行わず、対象が無い旨を結果メッセージとして返して正常終了する。実行時に渡すバッチ名が未指定のとき、または定義済みのバッチ名と一致しないときは、何も処理せず異常終了する。

### 決済番号が同じ申込みが続くとき

対象の申込みは決済番号の順に処理する。直前に処理した申込みと決済番号が同じ申込みは、決済サービスへ照会し直さない。直前の照会で取引が成立していたときは、その申込みも取引が成立したものとして扱う。直前の照会が成立していなかったときは、その申込みには更新も削除も行わず、結果メッセージにも列挙しない。この申込みは決済中のまま残る。

### 決済完了メールが送れなかったとき

取引が成立した申込みについて会員向けのメール送信に失敗しても、その申込みの処理は中断せず、申込みステータスの更新と申込履歴の記録は取り消さない。後続の申込みの処理も続ける。

## 入出力

### 入力と実行結果

| 種類 | 内容 |
| --- | --- |
| 入力 | 実行するバッチ名 |
| 成功時出力 | 終了コードは正常。結果メッセージとして、対象が無い旨、またはバッチが成功した旨を出す |
| 失敗時出力 | 終了コードは異常。取引が不在・未完了・取引エラーとなった申込みについて、決済番号を添えたメッセージを結果メッセージに列挙する |

結果メッセージの先頭には実行日時を付ける。

### 出力: メール

想定外のエラーの通知は、同じ内容のエラーを重複を除いて1つにまとめ、1回の実行につき1通だけ送る。取引が不在・未完了・取引エラーとなった申込みは、この通知には含めず結果メッセージ側に出す。通知先のメールアドレスは複数を設定でき、1件も設定されていないときは送信せずに終了する。

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 削除 | 申込みを削除するとき、その申込みに紐づく参加プレイヤーの記録も併せて削除する |
| 追加 | 申込履歴は、直近の履歴と申込ステータスが変わらない申込みには追加しない |

## 表示メッセージ

本バッチは画面の文言を持たない。出力するのは対象が無い旨と、照会結果のメッセージである。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象が無いとき・バッチ名が一致しないとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/CheckProcessingPaymentEntry.php:23 |
| 対象が無いとき・バッチ名が一致しないとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/EventEntryBatch.php:37 |
| 決済番号が同じ申込みが続くとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:29-39 |
| 決済番号が同じ申込みが続くとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEventEntryRepository.php:72 |
| 決済完了メールが送れなかったとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:98-104 |
| 入力と実行結果 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/EventEntryBatch.php:35-47 |
| 入力と実行結果 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractPaymentService.php:56 |
| 出力: メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:45-69 |
| 出力: メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1711-1718 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractPaymentService.php:43-49 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEntryHistoryRepository.php:32-36 |
