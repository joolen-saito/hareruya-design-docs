# バッチ 会員管理 — スマレジ使用ポイント連携

## 業務ロジック

### 受注IDが数値でないとき

引数として渡された受注IDが数値でないときは、連携を行わずに終了する。

### 連携の失敗とみなす条件

スマレジからの応答に処理結果が含まれないときを、この連携の失敗として扱う。

### 失敗した受注の再連携

連携エラーの区分が立ったままの受注は、スマレジ連携エラー受注の再連携処理が対象として拾う。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 実行するバッチの名称 |

### 起動する契機

注文完了メールが送信されないまま残っている受注を再処理する処理からも、その受注IDを渡してこの連携が起動される。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | — | 本機能は利用者向けの文言を持たない | — | — |

## 出典
| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 受注IDが数値でないとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/UpdatePoint.php:32 |
| 連携の失敗とみなす条件 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/UpdatePoint.php:41-47 |
| 失敗した受注の再連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:31 |
| 失敗した受注の再連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:182-189 |
| 起動する契機 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Order/ResendMail.php:52-59 |
| 起動する契機 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:1443-1454 |
