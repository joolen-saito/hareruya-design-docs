# バッチ イベント管理 — コンビニ支払チェックバッチ

## 業務ロジック

### 対象の抽出

コンビニ決済で入金待ちのイベント申込を抽出する。抽出するのは決済番号が設定されている申込みだけで、決済番号の順に並べて処理する。対象が 0 件のときは、対象が無い旨を返して終える。

コマンド名が未指定のとき、または一致しないときは処理を行わずに終える。

### 決済サービスへの照会と申込みの扱い

決済サービスへの取引照会は、決済方法がクレジットカード決済の申込みにだけ行う。本バッチが抽出するのはコンビニ決済の申込みなので、取引照会は行われない。

抽出した申込みはいずれも「決済方法がクレジットカード決済でない」という想定外エラーとして扱い、次の 2 つを行う。

- 申込みステータスを「支払番号が存在しない」にする。
- 想定外エラーを重複を除いて 1 つにまとめ、管理者へ通知する。同じ内容は 1 回の実行につき 1 度しか通知しない。

### 決済番号が同じ申込みが続くとき

直前に処理した申込みと決済番号が同じ申込みには、ステータスの変更を行わない。入金待ちのまま残り、結果メッセージにも列挙しない。

### 申込履歴の記録

処理した申込みについて申込履歴を追加し、更新を確定する。直近の履歴と申込ステータスが変わらない申込みには追加しない。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | コマンド名 |
| 出力 | 申込みステータスの更新、申込履歴の追加、想定外エラーの管理者への通知、結果メッセージ |

### 結果と終了コード

結果メッセージの先頭には実行日時を付ける。本バッチは取引照会を行わないため、決済番号を添えたメッセージは 1 件も集まらず、対象が 1 件以上あるときはバッチが成功した旨を返して正常終了する。対象が 0 件のときも、対象が無い旨を返して正常終了する。コマンド名が未指定・不一致のときは異常終了する。

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 抽出した申込みのステータスを「支払番号が存在しない」にする。直前に処理した申込みと決済番号が同じ申込みは変更しない |
| 追加 | 申込履歴は、直近の履歴と申込ステータスが変わらない申込みには追加しない |

## 表示メッセージ

このバッチは画面へ文言を表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象の抽出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/CheckCvsPaymentEntry.php:20 |
| 対象の抽出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEventEntryRepository.php:64-72 |
| 対象の抽出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Command/EventEntryBatch.php:37-41 |
| 決済サービスへの照会と申込みの扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/SlnSearchHelper.php:50-57 |
| 決済サービスへの照会と申込みの扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/CheckCvsPaymentEntry.php:12-14 |
| 決済サービスへの照会と申込みの扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:45-69 |
| 決済サービスへの照会と申込みの扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:83-95 |
| 決済サービスへの照会と申込みの扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/CheckCvsPaymentEntry.php:34-38 |
| 決済番号が同じ申込みが続くとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:29-39 |
| 決済番号が同じ申込みが続くとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEventEntryRepository.php:72 |
| 申込履歴の記録 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:71-72 |
| 申込履歴の記録 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEntryHistoryRepository.php:32-36 |
| 結果と終了コード | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/EventEntryBatch.php:35-47 |
| 結果と終了コード | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/AbstractPaymentService.php:56-60 |
| 結果と終了コード | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/CheckCvsPaymentEntry.php:22-24 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Payment/CheckCvsPaymentEntry.php:36 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbEntryHistoryRepository.php:32-36 |
