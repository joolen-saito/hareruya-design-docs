# バッチ 買取管理 — 買取集計バッチ

## 業務ロジック

### 集計対象とする明細

明細は元数量が0より大きい行、個別入力商品は数量が0より大きい行を集計する。

### 集計する値

| 項目 | 算出 |
| --- | --- |
| 買取金額 | 明細と個別入力商品のそれぞれで単価と数量を掛け、合算する |
| 売価金額 | 明細と個別入力商品のそれぞれで売価単価と数量を掛け、合算する |
| 端数調整分 | オプションで指定した特定部門の買取金額として計上し、当該分の売価金額は0とする。端数が0以下になる買取は計上しない |

### エラー時の扱い

| エラー内容 | 処理 |
| --- | --- |
| コマンド名が未指定・不一致 | 処理を行わずに終了する |
| 集計対象が0件 | 集計データの登録を行わずに完了する |
| 集計・登録中の例外 | 登録を取り消し、エラー内容を添えた集計エラーの通知を管理者へ送る |
| 通知の宛先が未設定 | 通知を送らずに当該処理を終了する |

コマンド名が未指定・不一致のときは、終了コード1で終了する。このとき、実行日時を添えた「Nothing args or command.」をコンソールへ出力する。

### 部門未設定商品の通知

通知の本文には商品名と商品コードを1件1行で並べる。個別入力商品は商品コードを空欄とする。通知の対象は集計対象日に買取が成立した店頭買取のすべてで、集計対象の状態による絞り込みは行わない。

### 通知の宛先

部門未設定商品の通知と集計エラーの通知は同じ宛先設定を用いる。宛先はカンマ区切りで複数を指定でき、未設定のときはいずれの通知も送らずに終える。

## 入出力

### 引数と結果

| 種類 | 内容 |
| --- | --- |
| 入力 | 実行するバッチのコマンド名 |
| 出力 | 管理者への通知（部門未設定商品の一覧・集計エラーの内容） |

起動コマンドは `otcBuyOrder:batch` で、コマンド名を第1引数に渡す。有効なコマンド名は `updateSummary` の1つだけである。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 管理者への通知 | 部門未設定商品の一覧（商品名・商品コード） | 集計日の店頭買取に部門未設定の商品があるとき | 通知を送り、集計を続ける |
| — | 管理者への通知 | 集計エラーの内容 | 集計・登録の途中で例外が発生したとき | 登録を取り消して終了する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 集計対象とする明細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderRepository.php:277 |
| 集計する値 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderRepository.php:247-326 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/OtcBuyOrder/SummaryService.php:61 |
| 部門未設定商品の通知 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderRepository.php:354 |
| 部門未設定商品の通知 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1168-1177 |
| 通知の宛先 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1179-1187 |
| 通知の宛先 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1219-1227 |
| 引数と結果 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Command/OtcBuyOrderBatch.php:37 |
| 引数と結果 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/OtcBuyOrder/SummaryService.php:58-66 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Command/OtcBuyOrderBatch.php:33-41 |
| 引数と結果 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Command/OtcBuyOrderBatch.php:12-22 |
