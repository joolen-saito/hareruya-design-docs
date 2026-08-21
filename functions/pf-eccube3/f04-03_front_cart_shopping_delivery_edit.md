# F04-03（注文時の配送先登録・変更）

## 業務ロジック

### 日本語以外のページでの入力欄

日本語以外のページでは、配送先氏名カナの入力欄を出さない。

### 国が日本以外のときの住所入力

国が日本以外のときは、海外住所用の郵便番号欄を必須入力として受け取り、都道府県には国外を設定する。

### 国と都道府県の整合

国が日本で都道府県が国外、または国が日本以外で都道府県が国外でないときは不整合とし、国の項目にエラーを付けて編集画面を再表示する。

### 郵便番号欄の外部リンク

国が日本のときは、郵便番号欄の脇に日本郵便の郵便番号検索ページを開く外部リンクを置く。英語ページでは「Search post code」と表示する。

### 配送先名称の文字数

配送先名称は128文字を超えると入力エラーとする。

### 住所の文字数

住所1・住所2は、それぞれ全角を2・半角を1として数えた長さが90を超えると入力エラーとする。

### 登録上限の判定

新規登録では、編集画面を開くときと登録を確定するときの両方でアドレス帳の登録件数を判定する。上限に達しているときは編集画面を表示せず、上限超過のエラーを表示してご注文方法指定へ戻す。既存の配送先を変更するときは登録件数を判定しない。

### 登録後の配送先への反映

登録が成立すると、登録した配送先がその注文の1件目の配送先として設定される。配送先が複数に分かれている注文でも、設定されるのは1件目だけである。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 新規登録での上限超過 | 上限超過のエラーを表示してご注文方法指定へ戻す |
| 国と都道府県の不整合 | 国にエラーを付けて編集画面を再表示する |
| 入力の検証不備 | 編集画面を再表示する |
| 指定された配送先が当人のアドレス帳に無い | お届け先が見つからない扱いとする |

## 入出力

| 種類 | 内容 |
|------|------|
| 失敗時出力 | 上限超過のときは編集画面を表示せずご注文方法指定へ戻る。検証に通らないときは編集画面を再表示する |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 登録・更新 | 登録の確定時（住所と配送先名称） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 編集画面の見出し | 配送先の新規登録・変更 | 編集画面の表示時 | — |
| — | 編集画面の見出し（英語ページ） | Register New/Change Address | 編集画面の表示時 | — |
| — | 編集画面の注意文 | 既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。 | 編集画面の表示時 | — |
| — | 編集画面の注意文（英語ページ） | After the order (including preparation) is received, destination information as well as purchase information cannot be updated, so if further changes are necessary, please contact us. | 編集画面の表示時 | — |
| — | 住所欄の下 | ※町名・番地の入力漏れにご注意ください。 | 編集画面の表示時。英語ページに対応する文言は無い | — |
| — | ご注文方法指定画面のエラー領域 | お届け先登録数の上限を超えています。 | 新規登録でアドレス帳が上限に達しているとき | ご注文方法指定へ戻す |
| — | ご注文方法指定画面のエラー領域（英語ページ） | The maximum number of addresses registration is exceeded. | 新規登録でアドレス帳が上限に達しているとき | ご注文方法指定へ戻す |
| — | 国の項目直下 | 国と都道府県の組み合わせが正しくありません。 | 国と都道府県の組合せが不整合のとき | 編集画面を再表示する |
| — | 国の項目直下（英語ページ） | The combination of country and region is incorrect. | 国と都道府県の組合せが不整合のとき | 編集画面を再表示する |

各入力欄の必須・形式エラーは項目の直下に表示する。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 登録上限の判定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/DeliveryService.php:78 |
| 国と都道府県の整合 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/DeliveryService.php:57 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:947 |
| 国が日本以外のときの住所入力 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Extension/Front/CustomerAddressTypeExtension.php:151 |
| 配送先名称の文字数 | P1 | pf-eccube3:app/Plugin/HareruyaEc/config.yml:148 |
| 住所の文字数 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Customer/CustomerAddrValidator.php:18 |
| 登録後の配送先への反映 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:1003 |
| 郵便番号欄の外部リンク | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig:119 |
| 日本語以外のページでの入力欄 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Extension/Front/CustomerAddressTypeExtension.php:109 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:998 |
