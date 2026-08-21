# F01-01（本店トップページ表示）

## 業務ロジック

### 本店TOPの所在

本店TOPは、表示言語の区分を先頭に持つサイトルート直下に置く。言語区分を含まないサイトルートを開いたときは、その時点の言語区分を付けた本店TOPのURLへリダイレクトする。支店ページはサイトルートからの店舗ページとして別に扱う。

### ページタイトル

本店TOPのページタイトルには、他の画面で末尾に付く店名を付けない。

### ログイン用モーダル

本店TOPには、未ログイン・ログイン済みを問わずログイン用モーダルをページ内に用意する。日本語版サイトでは日本語のモーダル、英語版サイトでは英語のモーダルを表示する。

### 掲載商品の取得結果のキャッシュ

TOPのタグで抽出する商品ブロックは、取得した商品の並びを対象のタグごとに30秒間キャッシュする。キャッシュが有効な間は、同じタグを対象とするPC版・SP版のブロックへ同じ取得結果を表示する。

### タグログ送信

画面読込時に検索ワード解析用タグログを送信する。送信内容には表示中の画面のURLと遷移元のURLを含める。ログイン会員のときはハッシュ化した会員識別子を、モバイル端末からの閲覧かどうかに応じたsp／pcの表示種別を併せて送る。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 描画・データ取得の障害 | 共通例外処理に委ねる。本機能専用の利用者向けメッセージは設けない |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 本店TOPの表示要求（日本語版サイト／英語版サイトのいずれか） |
| 成功時出力 | 本店TOPの画面、およびページ内に用意するログイン用モーダル |
| 失敗時出力 | 描画失敗時は共通例外処理に委ねる。本機能固有のフォールバック文言は持たない |

本機能はデータを更新しない。金額計算・税計算・丸めは行わない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |

本機能固有の画面メッセージは無い。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 本店TOPの所在 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:94 |
| 本店TOPの所在 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:37-43 |
| 本店TOPの所在 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/LocaleController.php:19 |
| 本店TOPの所在 | P1 | pf-eccube3:app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:256-258 |
| ページタイトル | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/index_top.twig:1 |
| ページタイトル | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/default_frame.twig:21-24 |
| ログイン用モーダル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/index_top.twig:50-56 |
| 掲載商品の取得結果のキャッシュ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Block/EcTopProductController.php:15 |
| 掲載商品の取得結果のキャッシュ | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Block/EcTopProductController.php:84 |
| タグログ送信 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/index_top.twig:27-45 |
