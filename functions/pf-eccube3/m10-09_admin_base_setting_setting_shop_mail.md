# メールテンプレートの編集（pf-eccube3）

## 業務ロジック

### 編集できるテンプレートの範囲

編集対象のテンプレートを指定して開く画面である。指定されたテンプレートが存在しないとき、または自動送信メールとして扱うテンプレートを直接指定したときは、画面を表示しない。自動送信メールは自動送信メールの設定画面で扱う。

削除済みのテンプレートは選択肢に出ない。

### テンプレートの切り替え

テンプレートの選択を変えると、その場で選び直したテンプレートの編集画面へ移る。選択を空に戻すと、テンプレート未選択の画面へ移る。

選択肢はテンプレ名称の昇順で並ぶ。

テンプレートを選ばないまま登録すると、新規登録は行えない旨のエラーを表示してテンプレート未選択の画面へ戻り、何も保存しない。新規のテンプレートはこの画面では作れない。

### 編集できる項目

テンプレートごとの名称（テンプレ名称）も、この画面で編集する。

### 本文の表し方

本文は、テンプレートごとに決まった定型文をそのまま表示する。定型文のうち編集できるのはヘッダーとフッターに当たる2箇所だけで、定型文そのものは画面から変更できない。

本文中の注文明細の差し込み箇所は、明細の定型文を展開したうえで表示する。定型文中の注釈は表示しない。

### 保存

登録すると、テンプレ名称・件名と、本文のうち編集できるヘッダー・フッターの2箇所を保存する。定型文は保存の対象にならない。あわせて最終更新者を操作した担当者に、最終更新日を保存時刻に更新する。

保存後は、いま編集していたテンプレートの編集画面へ戻る。

### 画面に出る更新履歴

画面上部に、そのテンプレートの最終更新者の氏名と最終更新日時を表示する。最終更新者として記録された担当者が削除済みであっても氏名を表示する。テンプレートを選んでいないとき、および更新履歴が無いときは何も表示しない。

### ほかの画面への導線

画面見出しの横に、新規作成の画面へ移る導線と、テンプレート一覧の画面へ移る導線を置く。テンプレート一覧の画面は、自動送信メール以外の各テンプレートの本文を、編集欄ではなく文面として並べて表示する。並び順はテンプレ名称の昇順で、編集画面の選択肢と揃える。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 編集対象のテンプレートの指定、テンプレ名称、件名、本文のヘッダー、本文のフッター |
| 成功時出力 | 保存完了のメッセージを表示し、同じテンプレートの編集画面を再表示する |
| 失敗時出力 | 同一画面を再表示し、項目ごとのエラーを表示する。テンプレート未選択のまま登録したときは、エラーを表示してテンプレート未選択の画面へ戻る |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 登録で、対象テンプレートのテンプレ名称・件名・本文のヘッダー・本文のフッターと、最終更新者・最終更新日を上書きする |
| 登録 | 行わない。この画面からテンプレートを新規に作ることはできない |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 管理画面上部 | 保存しました | メールテンプレートを編集して保存したとき | メールテンプレート編集画面に遷移する |
| — | 入力項目直下 | 入力されていません。 | 必須項目が未入力のまま登録したとき | メールテンプレート編集画面に留まる |
| — | 入力項目直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | テンプレート名または件名が255文字を超えたまま登録したとき | メールテンプレート編集画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 編集できるテンプレートの範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/MailController.php:21-42 |
| 編集できるテンプレートの範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/Admin/SettingServiceProvider.php:64-79 |
| テンプレートの切り替え | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Setting/Shop/mail.twig:17-30 |
| テンプレートの切り替え | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/MailController.php:52-59 |
| テンプレートの切り替え | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Extension/Admin/MailTypeExtension.php:38-65 |
| 編集できる項目 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Extension/Admin/MailTypeExtension.php:32-37 |
| 本文の表し方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1306-1370 |
| 本文の表し方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Setting/Shop/mail.twig:52-57 |
| 保存 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/MailController.php:61-70 |
| 画面に出る更新履歴 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Setting/Shop/mail.twig:44-51 |
| ほかの画面への導線 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Setting/Shop/mail.twig:6-13 |
| ほかの画面への導線 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/MailController.php:186-214 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/MailController.php:53-70 |
