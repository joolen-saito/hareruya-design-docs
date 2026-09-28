# カート — 決済〜購入完了

## 業務ロジック

### 購入完了時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 引き継いだ受注があるか | 無ければトップページへ戻す |
| 2 | 受注ステータスが注文受領または入金待ちか | いずれでもなければ購入処理異常のアラートメールを送信し、引き継いだ受注情報を初期化して購入処理エラー画面を表示する |
| 3 | SPLINKS決済で対応する決済記録があるか | SPLINKS支払いだが記録が無ければ受注ステータスを処理中へ戻し、決済記録不整合のエラー画面を表示する |
| 4 | 上記を通過 | 完了処理を行い購入完了画面を表示する |

受注ステータス異常のときは、更新による再通知を避けるため引き継いだ受注情報を初期化する。決済記録不整合のときは初期化しないため、再表示しても同じエラー画面になる。

### 注文番号の書式

ご注文番号は8桁のゼロ埋めで表示する。TC注文番号は呼び出し番号の下4桁を4桁のゼロ埋めで表示する。

### 購入グループ別の完了画面の表示

購入者の顧客グループが店内アカウントのときは、注文確定時に受注の呼び出し番号を登録する。

受注に呼び出し番号があるときは、ご注文番号に代えてTC注文番号を表示し、その下に「※店内のパソコンからご注文のお客様は、商品の用意が完了すると、店内注文モニターにTC注文番号が表示されます。TC注文番号が表示されましたら、レジカウンターまでお越しください。」を表示する。

受注に呼び出し番号が無いときは、ご注文番号を表示し、その下に「注文完了メールをお送りしました。届かない場合はお手数ですが当店のヘルプページを御覧ください。」を表示する。文中の「ヘルプページ」の遷移先は、オンラインショップのヘルプページ（/ja/user_data/help_onlineshop#block20）とする。

### ポイントの消費時期

注文を確定した時点で使用ポイントを消費する。ただしSPLINKS決済（コンビニ・クレジットカード）のときは、注文確定時ではなく購入完了画面の表示時に消費する。

### 完了処理で行う連携

受注明細ごとに、その商品へ設定された売上分析タグを受注明細へ登録する。表示言語の切り替えが保留されているときは、その言語のURLへ遷移し直したうえで完了画面を表示する。消費ポイントがあるときは、スマレジのポイント連携を別プロセスで実行する。購入完了タグログ（購入商品の商品ID・単価・数量）と、eコマース計測用の取引情報（受注ID・配送方法名・商品小計・送料・会員のメールアドレス・購入商品の明細）を送信する。取引情報の税額は常に0とする。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 引き継いだ受注 |
| 成功時出力 | 購入完了画面、ポイントの消費とスマレジポイント連携、購入完了タグログとeコマース計測用取引情報の送信 |
| 失敗時出力 | 受注ステータス異常・決済記録不整合のエラー画面、受注を引き継いでいないときはトップページへの遷移 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 追加 | 完了処理で受注明細へ商品の売上分析タグを登録する |
| 更新 | 決済記録不整合のときは受注ステータスを処理中へ戻す |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| — | 購入完了画面の見出し | ご注文完了 | 購入完了画面の表示時 | 静的表示 |
| — | 購入完了画面本文 | ご注文ありがとうございました。 | 購入完了画面の表示時 | 静的表示 |
| — | 購入完了画面本文 | ご注文番号／TC注文番号（呼び出し番号がある場合） | 購入完了画面の表示時 | 静的表示 |
| — | 共通エラー画面 | 購入処理エラーの文言（ロケールメッセージを正とする） | 受注ステータスが注文受領・入金待ち以外のとき | アラートメールを送信し、受注情報を初期化する |
| — | 共通エラー画面 | 決済記録不整合エラーの文言（ロケールメッセージを正とする） | SPLINKS支払いだが決済記録が無いとき | 受注ステータスを処理中へ戻す |
| F04-04-MSG-001 | 購入処理エラー画面 | 「%name%」の在庫が足りません。 | 購入手続きで、在庫管理対象（在庫無制限でない）商品の注文数が在庫を超えたとき | 更新を取り消し、エラーメッセージを表示して購入エラー画面へ遷移する |
| F04-04-MSG-002 | 購入エラー画面 | 「%name%」の在庫が足りません。 | 購入手続きで、在庫管理対象（在庫無制限でない）商品の注文数が在庫を超えたとき | 更新を取り消し、エラーメッセージを表示して購入エラー画面へ遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 購入完了時の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:404-458 |
| 注文番号の書式 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:34-40 |
| 注文番号の書式 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:474-475 |
| 購入グループ別の完了画面の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/ShoppingService.php:536-541 |
| 購入グループ別の完了画面の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:33-53 |
| ポイントの消費時期 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:338 |
| ポイントの消費時期 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:520-523 |
| 完了処理で行う連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:460-468 |
| 完了処理で行う連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:494-503 |
| 完了処理で行う連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:540-548 |
| 完了処理で行う連携 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/ecommerce_js.twig:1-12 |
| 完了処理で行う連携 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:477-492 |
| 完了処理で行う連携 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:554-563 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:450 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:502 |
