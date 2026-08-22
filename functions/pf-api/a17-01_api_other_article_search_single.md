# API その他 — 検索クエリに一致する記事情報1件を取得

## 業務ロジック

### 取得できない記事

削除日時が入っている記事は検索の対象から外れる。指定されたWPの投稿IDが削除済みの記事のものだけであれば、該当データなしとして扱う。

### 一件に絞り込めないとき

WPの投稿IDには一意性の保証がなく、同じWPの投稿IDを持つ記事が複数登録されている状態があり得る。そのWPの投稿IDを指定した場合は1件に絞り込めずエラーとなり、正常応答も該当データなしの応答も返さない。

## 入出力

### 受け付けるURL

拡張子を付けないURL `/article` でも、同じ取得ができる。

### 該当データなしのときの応答本文

該当データなしのときの応答本文は、コードとメッセージの2項目だけを持つJSONである。コードには応答のステータスコードと同じ値が入る。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | API応答JSON | Not Found | 条件に一致する記事が無いとき | HTTP 404 を返す |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 取得できない記事 | P2 | pf-api:config/packages/doctrine.yaml:28-31 |
| 取得できない記事 | P2 | pf-api:src/Entity/DtbArticle.php:10-16 |
| 一件に絞り込めないとき | P2 | pf-api:src/Repository/DtbArticleRepository.php:19-29 |
| 一件に絞り込めないとき | P2 | pf-api:src/Resources/config/doctrine/DtbArticle.orm.yml:16-25 |
| 受け付けるURL | P2 | pf-api:config/routes.yaml:145-151 |
| 受け付けるURL | P2 | pf-api:config/packages/fos_rest.yaml:2-8 |
| 該当データなしのときの応答本文 | P2 | pf-api:src/Controller/ArticleController.php:92-108 |
