# F02-02（本店スマホ版ナビ）

## 業務ロジック

### 英語版サイトのナビ項目

英語版サイトのスマホ版ナビでは、買取とデッキ構築を表示しない。記事と選手一覧は、いずれも英語表示の外部ページを開く。項目名は英語で表示し、Shop / Article / Sponsored Player / Deck Search / Shop Info / Event Schedule / Help を並べる。商品カテゴリの導線は Category、検索ボタンは Search と表示する。

### 商品検索のキーワード再表示

商品検索のキーワードを伴って開いた画面では、そのキーワードを商品検索の入力欄に表示した状態で描画する。

### 候補リスト

商品検索の入力欄への入力のたびに、入力中の文字列をキーワードとしてユニサーチへ候補を要求する。要求する候補の件数は16件で、検索履歴も併せて求める。ログイン中は、会員を識別するハッシュ値を添えて要求する。候補リストには、返された検索履歴・キーワード・カードセット・商品名サジェストを表示する。

商品検索の候補リストを取得できないときは、候補リストを表示しない。このときも、入力したキーワードでの検索の送信は続けられる。

### フェーズ2対応（フェーズ1では実装しない）

Excel基本設計 0302「スマホ版ナビゲーション上の通知」はフェーズ2対応とし、フェーズ1ではこの項目だけ実装しない。Excel原文は「※通知はフェーズ2以降で設計予定とする」である。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 本店各画面の表示要求（表示言語を含む）、商品検索のキーワード |
| 出力 | スマホ版ナビと商品検索の表示 |

## 表示メッセージ

本機能は固有の文言を持たない。表示するのはナビの項目名である。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 英語版サイトのナビ項目 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/base_sp_navigator_unisuggest.en.twig:8 |
| 英語版サイトのナビ項目 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/block.twig:10 |
| 商品検索のキーワード再表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/base_sp_navigator_unisuggest.twig:26 |
| 候補リスト | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/unisuggest_js.twig:146 |
| 候補リスト | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/base_sp_navigator_unisuggest.twig:25 |
| 候補リスト | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/unisuggest_js.twig:47-49 |
| 候補リスト | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/unisuggest_js.twig:137-141 |
| 候補リスト | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/unisuggest_js.twig:152-195 |
| フェーズ2対応（フェーズ1では実装しない） | P3 | 0302:sheet-4 |
