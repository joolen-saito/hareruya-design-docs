# 敵対レビュー依頼：B16-09（サイトマップ生成処理）の機能設計書

あなたはレビュアーである。著者とは別人として、下の機能設計書をソースと突き合わせ、誤りを指摘せよ。ファイルは変更しない。出力は日本語。事実確認に限る。スクリプトやコマンドは読むだけで、絶対に実行しない。パスワード・鍵・個別の会員の識別子などは出力に書かない。
`hareruya-design-docs/integration_test/casegen/sheetmap/review/` にある他のファイルは読まない。

## 対象

`hareruya-design-docs/functions/ec-cube-enterprise/b16-09_batch_infra_sitemap_generation.md`

インフラのバッチ「サイトマップ生成処理」の仕様を、新システム（`/home/y-saito/Developments/ec-cube-enterprise`）のソースから起こしたもの（依頼者の決定で、この機能は新システムから起こす）。HTML設計書の 0416「サイトマップ生成処理」シートに埋め込む。

新システムでは、サイトマップは S3 へ上げるバッチではなく、アクセスのたびに組み立てて返す画面側の機能として実装されている（プルリクエスト #1655 ほか、チケット ECCUBE_HARERUYA-782）。設計書はその実装を書いたもの。Excel のシートが定める方式（クローラーで集めて S3 へ上げる日次バッチ）と方式が違うこと自体は指摘しない。

## 正（突き合わせる相手）

- ソース: `ec-cube-enterprise/` の `src/Eccube/Controller/Front/SitemapController.php`、`src/Eccube/Resource/template/default/sitemap*.twig`、`src/Eccube/Repository/`（ProductRepository、DtbDeckRepository、Master/MtbFormatRepository ほか）、`app/config/eccube/packages/eccube.yaml`、経路の定義
- Excel基本設計の内容: `hareruya-design-docs/integration_test/casegen/sheetmap/materials/B16-09_sheet.txt`。

## 書き方の規約（これに従っている箇所は指摘しない）

- 書くのは、Excel基本設計が定めていない入出力とふるまいだけ。Excel が値・条件まで定めていることは、同じでも違っても書かない（Excel が正。ソースと食い違う値をソース側の値で書いていたら指摘する）。Excel が上位概念や項目名だけ書いていて細部が無いものは書く。
- 関数名・変数名・環境変数名・DB物理名・コマンド名などの実装用語は書かない（業務上の呼び名で書く）。Excel が使う呼び名と、出力される文言は逐語で書いてよい。
- 節は「業務ロジック」「入出力」「表示メッセージ」と末尾の「出典」。
- 設定で外から与える値は「設定で与える」と書き、値を決めつけない。

## 重点観点

1. 設計書の各文が、ソースで実際にそうなるか（条件、順序、名前の付け方、待ち方、失敗時に中断するか続けるか、終了の状態、後片付け、出力される文言）。
2. ソースにあって、Excel が定めておらず、設計書にも無い、外から見えるふるまい（取りこぼし）。
3. 規約違反（Excel が定めていることの重複・矛盾、実装用語、推測、到達しない処理の記述）。
4. 出典の行（ファイルと行番号）が、その小見出しの内容の根拠になっているか。

## 出力形式

指摘が無ければ `NONE` の1語。あれば1件ごとに次の形で書く。最大12件。確信の持てないものは挙げない。

```
### 指摘N（小見出し）
- 主張: 設計書の記述（引用）
- 実際: ソースの事実（file:line）または Excel の記述（sheet.txt の行）
- 判定: 事実の誤り／取りこぼし／Excelとの重複・矛盾／実装用語／出典の誤り
- 修正案: 結論を先に置いた1〜2文
```
