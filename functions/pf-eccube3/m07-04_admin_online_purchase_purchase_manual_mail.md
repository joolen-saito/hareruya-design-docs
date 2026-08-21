# ネット買取管理 — 手動メール通知

## 業務ロジック

### 対象の買取受注

買取番号で買取受注を1件取得する。買取番号の指定が無いとき、および該当する買取受注が無いときはHTTP 404とする。画面に出す買取番号は、7桁に満たないとき先頭を0で埋める。

### テンプレートの候補

候補は、自動送信専用として予約されたテンプレートを除き、雛形が買取向け（買取受付・査定・送料込み、およびそれぞれの旧版）のものと、雛形を使わないものに限る。並び順はテンプレート名の昇順とする。この条件に当たらないテンプレートを指定したときはHTTP 404とする。

### 本文の初期値

本文の初期値は、選んだテンプレートの雛形に、そのテンプレートのヘッダーとフッター・対象の買取受注・店舗情報を渡して組み立てた文字列とする。

### 検証に通らなかったときの扱い

入力の検証に通らなかったときはメールを送らない。このとき項目ごとのエラーは表示せず、手動メール通知の入力画面を開き直すため、入力していた件名と本文は残らない。

### 送信するメール

本文はプレーンテキストだけとする。件名と本文は入力画面で確定した値をそのまま用いる。宛先は買取受注に登録されたメールアドレスとする。送信元・Bcc・返信先には買取用のメール送信元アドレスと店舗名を用い、差し戻し先には店舗情報のエラー通知メールアドレスを用いる。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 買取番号。表示するテンプレートの指定。なりすまし対策トークン |
| 失敗時出力 | 該当する買取受注が無いとき、および買取向けではないテンプレートを指定したときはHTTP 404 |

### 出力: メール

| 宛先 | 契機 |
| --- | --- |
| 買取受注に登録されたメールアドレス | 入力の検証に通ったとき |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 追加 | メールを送ったあとの、通知の送信履歴1件。件名・本文・送信日時と、選んだテンプレート・対象の買取受注・その会員を記録する |

買取受注そのものは更新しない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M07-04-MSG-001 | 管理画面上部 | メールを送信しました。 | 手動メール通知を送信したとき | 買取情報編集（買取詳細）画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象の買取受注 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Purchase/MailController.php:211 |
| 対象の買取受注 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Purchase/MailController.php:216 |
| 対象の買取受注 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Purchase/manual_mail.twig:43 |
| テンプレートの候補 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Extension/Admin/MailTypeExtension.php:45-64 |
| テンプレートの候補 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Purchase/MailController.php:222-238 |
| テンプレートの候補 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/MailTemplate.php:121 |
| 本文の初期値 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Purchase/MailController.php:242-247 |
| 本文の初期値 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1289 |
| 検証に通らなかったときの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Purchase/MailController.php:267-277 |
| 検証に通らなかったときの扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/FormValidHelper.php:18 |
| 送信するメール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:120-140 |
| 出力: メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:127 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:137 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1799-1824 |
