# m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）

## 業務ロジック

### 確認前の画面

確認を始める前の画面は、表示だけを行い、データの参照をしない。

### 抽出する対象

重複を数える単位も、結果に並べる単位も商品規格である。ひとつの商品コードが複数の商品規格に付いているとき、その商品コードを持つ商品規格を全件取り出す。削除済みの商品・商品規格は取り出さない。商品サブ情報を持たない商品は取り出さない。

### 結果の表示

同じ商品コードを持つ商品規格が複数あるときは、商品規格ごとに1行を置き、行ごとに導線を持つ。

### 他機能との境界

利用者が入力する検索条件を持たない。参照だけを行い、データを更新しない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 認証・認可の失敗 | 管理画面に共通のふるまい（ログインへの誘導など）による |
| データベースアクセスの失敗 | 共通のエラー処理に委ねる。本機能が個別に利用者向けの文言を出すことはない |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 無し。検索条件を受け取らない |
| 失敗時出力 | 管理画面に共通のエラー扱いによる。本機能固有の検証エラー画面は無い |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-25-MSG-001 | 画面上部 | 重複している商品コードはありません。 | 重複商品コード確認を実行し、重複コードが1件もないとき。 | 重複商品コード確認画面に留まる。 |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 確認前の画面 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductController.php:454 |
| 抽出する対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/ProductClassRepository.php:296 |
| 抽出する対象 | P2 | pf-eccube3:src/Eccube/ServiceProvider/EccubeServiceProvider.php:282 |
| 結果の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/doubling_check.twig |
| 他機能との境界 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductController.php:465 |
| エラー時の扱い | P1 | pf-eccube3:src/Eccube/Application.php:596 |
| エラー時の扱い | P2 | pf-eccube3:src/Eccube/Application.php:151 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductController.php:465 |
