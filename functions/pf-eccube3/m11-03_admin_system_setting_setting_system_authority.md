# システム設定 — 権限管理（システム設定/拒否URL）

## 業務ロジック

### 拒否URLの一覧

一覧は権限、拒否URLの順に昇順で並べる。登録が1件も無い場合は空の入力行を1つ表示する。

### 保存の扱い

入力検証に失敗した場合は登録内容を変更しない。

### アクセス拒否の判定

拒否URLと遷移先のパスの照合は先頭一致で行う。照合の条件は管理画面のパスに拒否URLをつないだもので、英字の大文字小文字は区別しない。

メンバー以外の利用者には拒否URLを適用しない。

### 特殊拒否URLによる身分証画像の閲覧制限

拒否URLには、画面のパスのほかに、機能単位で閲覧を止めるための値を登録できる。権限管理画面は、その値を「特殊拒否URL一覧」として画面右側に一覧表示する。現行で扱う値は「身分証閲覧不可権限」の1件である。

「身分証閲覧不可権限」を拒否URLとして登録した権限のメンバーは、会員詳細画面そのものは開けるが、身分証の画像は表示されず、画像の位置に「閲覧不可」と表示する。身分証の画像を直接開くURLへ要求した場合もアクセスを拒否する。

### 左ナビゲーションの抑制

左ナビゲーションは、拒否URLに該当する項目を表示しない。判定に使う値は、管理画面のパスに拒否URLをつないだものと完全に一致するかどうかである。第1階層は階層をつないだ項目、第2階層は階層をつないだ項目と項目のURLの両方、第3階層は項目のURLで判定する。

## 入出力

| 種類 | 内容 |
|------|------|
| 成功時出力 | 保存完了メッセージ、権限管理画面の再表示 |
| 失敗時出力 | 項目ごとのエラー |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M11-03-MSG-001 | 管理画面上部 | 保存しました | 権限設定を保存したとき | 権限管理画面に遷移する |
| M11-03-MSG-002 | 管理画面上部 | 保存に失敗しました | 権限設定の保存中にエラーが起きたとき | 権限管理画面に遷移する |
| — | 入力項目直下 | 入力内容に応じた項目エラー | 入力検証に失敗したとき | 同一画面を再表示する。登録内容は変更しない |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 拒否URLの一覧 | P3 | pf-eccube3:src/Eccube/Repository/AuthorityRoleRepository.php:45 |
| 拒否URLの一覧 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/System/AuthorityController.php:48 |
| 保存の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Setting/System/AuthorityController.php:58 |
| アクセス拒否の判定 | P1 | pf-eccube3:src/Eccube/Security/Voter/AuthorityVoter.php:74 |
| 特殊拒否URLによる身分証画像の閲覧制限 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/AdminController.php:43 |
| 特殊拒否URLによる身分証画像の閲覧制限 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Customer/edit.twig:599 |
| 特殊拒否URLによる身分証画像の閲覧制限 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Setting/System/authority.twig:121 |
| 左ナビゲーションの抑制 | P2 | pf-eccube3:src/Eccube/Application.php:385 |
| 左ナビゲーションの抑制 | P2 | pf-eccube3:src/Eccube/Resource/template/admin/nav.twig:23 |
