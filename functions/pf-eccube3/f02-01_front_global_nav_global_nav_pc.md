# F02-01（本店PC版グローバルナビ）

## 業務ロジック

### フェーズ2対応（フェーズ1では実装しない）
- Excel基本設計 0302「PC版ナビゲーション上の通知」はフェーズ2対応。フェーズ1では実装しない。

### 表示言語による導線の違い

英語表示のときは、グローバルナビにもメニューにも買取の導線を表示しない。メニューではデッキ構築の導線も表示しない。日本語表示のときはいずれも表示する。

### 言語切替先の決め方

言語切替の遷移先は、表示中の画面のURLのロケール接頭辞を反対の言語へ置き換えたものとする。日本語ページで対象画面に英語版が無いときは、遷移先を英語のトップへ差し替える。商品一覧（検索結果）は常に英語版が無いものとして扱う。商品詳細は、商品に設定された表示可能言語に英語が含まれないときに英語版が無いものとして扱う。言語切替が無効な画面のときは、言語切替を表示しない。

### カート内商品数の取得

ヘッダのカートに出す商品数は、画面の読み込みが終わった後に取得して表示する。取得できなかったときは商品数を表示しない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 本店の各画面の表示要求（表示言語を伴う） |
| 成功時出力 | 表示要求の言語に応じたグローバルナビとECヘッダの表示 |
| 失敗時出力 | 描画に失敗したときはアプリケーションの共通例外処理に委ねる |

## 表示メッセージ

本機能に固有のメッセージは無い。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 表示言語による導線の違い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/ec_navigator.twig:4-6 |
| 表示言語による導線の違い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/ec_navigator.en.twig:1-24 |
| 表示言語による導線の違い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/base_header.twig:13-24 |
| 表示言語による導線の違い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/base_header.en.twig:9-34 |
| 表示言語による導線の違い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Event/LocaleEvent.php:41-52 |
| 言語切替先の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Block/HeaderController.php:30-58 |
| 言語切替先の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:93-94 |
| 言語切替先の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:157-158 |
| 言語切替先の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:296-303 |
| 言語切替先の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/base_header.twig:71-78 |
| 言語切替先の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_header.twig:3 |
| カート内商品数の取得 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/ec_header_unisuggest.twig:33-40 |
| カート内商品数の取得 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/header_js.twig:1-20 |
