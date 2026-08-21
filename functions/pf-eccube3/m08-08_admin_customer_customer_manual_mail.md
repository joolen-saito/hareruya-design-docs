# 会員管理 — 手動メール通知

## 業務ロジック

### 対象会員とテンプレート

対象会員は指定された会員IDで特定する1名とする。会員IDの指定が無いとき、および該当する会員が存在しないときは、ページが見つからない扱い（404）とする。

テンプレートは会員向けベース（会員・会員英語・ベースなし）に該当するものだけを選択対象とし、自動送信メールのテンプレートは選択対象に含めない。選択肢はテンプレ名称の昇順に並べる。選択対象に該当しないテンプレートを指定したときはページが見つからない扱い（404）とする。

### 作成画面の初期表示

本文はテンプレートのヘッダとフッタを、そのテンプレートのベース種別の型に差し込んで組み立てる。会員ベースは冒頭に会員の氏名を置き、ヘッダとフッタの間に会員の氏名とメールアドレスを載せた案内欄を挟む。会員英語ベースは同じ構成を英語の定型で組み立てる。ベースなしはヘッダとフッタだけを並べる。

### 送信内容

宛先は会員のメールアドレスとする。差出人は店舗基本情報の送信元メールアドレスと店名、控え（Bcc）は同じ送信元メールアドレスとする。返信先は店舗基本情報の返信受付メールアドレス、返送先は店舗基本情報の送信エラー受付メールアドレスとする。件名と本文は画面で編集した内容をそのまま用いる。

### 送信できないとき

入力の検証に通らないときは送信せず作成画面へ戻す。このとき通らなかった理由は画面に表示せず、編集していた件名と本文も保持されず、選択中テンプレートの初期値に戻る。なりすまし対策トークンが一致しないときは送信せず、アクセスを拒否する扱い（403）とする。

### 送信履歴

送信のたびにメール送信履歴を1件記録する。記録する内容は会員・テンプレート・件名・本文・送信日時である。手動メールでは作成者の記録は持たない。

会員データ自体は更新しない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 会員ID、テンプレートID、件名、本文、ヘッダ・フッタ、なりすまし対策トークン |
| 成功時出力 | メール送信、メール送信履歴の記録、送信完了の通知 |
| 失敗時出力 | 会員・テンプレートが選択対象に該当しないときは404、なりすまし対策トークン不一致は403、入力の検証に通らないときは送信せず作成画面へ戻す |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 追加 | 手動メールの送信成功時にメール送信履歴を1件記録する |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M08-08-MSG-001 | 管理画面上部 | メール送信が完了しました。 | 手動メールを送信し、送信履歴の記録が完了したとき | 会員登録/編集画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象会員とテンプレート | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:201-225 |
| 対象会員とテンプレート | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Extension/Admin/MailTypeExtension.php:38-65 |
| 作成画面の初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:226-234 |
| 作成画面の初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Mail/customer.twig:1-11 |
| 作成画面の初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Mail/no_base.twig:1 |
| 送信内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:93-107 |
| 送信内容 | P1 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:99-129 |
| 送信できないとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:244-254 |
| 送信できないとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/FormValidHelper.php:19-47 |
| 送信履歴 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1799-1825 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:108 |
