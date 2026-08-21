# 会員管理 — メール送信履歴

## 業務ロジック

### 会員が存在しないとき

画面のパスで指定した会員IDに一致する会員が無いときは、ページが見つからない扱い（404）とする。このとき一覧も絞り込み欄も表示しない。

### 絞り込み欄の状態

絞り込み欄の選択を変えた時点で絞り込みが実行される（実行のためのボタン操作を伴わない）。絞り込んだあとの画面では、選択したテンプレートが絞り込み欄に選ばれた状態で表示される。

### 更新の有無

本機能は閲覧だけを行う。履歴の登録・変更・削除は行わず、メールの送信も行わない。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 会員ID（画面のパスで指定する）、絞り込みのメールテンプレート |
| 成功時出力 | 当該会員のメール配信履歴の一覧 |
| 失敗時出力 | 会員が存在しないときはページが見つからない扱い（404） |

### 入出力: 一覧の表示内容

一覧の「通知メール」欄には、送信に用いたテンプレートに登録されている件名を表示する。
一覧の「件名」欄には、送信したときの件名を履歴として保持した値を表示する。
両者は別の値なので、テンプレートの件名を後から変更すると、同じ履歴でも二つの欄の表示は一致しなくなる。

## 表示メッセージ

本機能は固有の文言を持たない。表示するのは送信履歴の内容である。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 会員が存在しないとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:82-84 |
| 絞り込み欄の状態 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Customer/mail_history.twig:28 |
| 絞り込み欄の状態 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:96 |
| 更新の有無 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:78-103 |
| 入出力: 一覧の表示内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Customer/mail_history.twig:47-53 |
| 入出力: 一覧の表示内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1803 |
