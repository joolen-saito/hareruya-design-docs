# F03-04（カテゴリ一覧）

## 業務ロジック

### カテゴリの並び順

一覧に出すカテゴリと、その配下の子カテゴリは、いずれも表示順の降順で並べる。

### 遷移先へ引き継ぐ並び順

カテゴリ一覧から商品一覧へ遷移する導線には、並び順の既定として色順を付与する。遷移後の抽出・件数・並び替えは商品一覧（F03-01）に従う。

本機能は閲覧と導線が主であり、業務計算は行わない。

### 英語ページでの表示

英語ページでは、一覧の見出しに「Category」を、各カテゴリの名称にカテゴリの英語名を表示する（日本語ページの見出しは「商品カテゴリ一覧」）。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| マスタ取得の障害 | 共通の例外処理に委ねる。本機能固有の利用者向けメッセージは持たない |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | カテゴリ一覧の表示要求 |
| 失敗時出力 | 本機能固有のエラー表示は持たない |

## 表示メッセージ

本機能は利用者向けの画面メッセージを持たない。

## 出典
| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| カテゴリの並び順 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/CategoryRepository.php:43 |
| 遷移先へ引き継ぐ並び順 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/category.twig:54 |
| 英語ページでの表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/category.en.twig:61 |
| エラー時の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:40 |
