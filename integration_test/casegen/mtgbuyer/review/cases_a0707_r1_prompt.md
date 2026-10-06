# 敵対レビュー依頼：A07-07（複数ネット買取IDから個別入力商品の一覧を取得）の結合テストケース12件

あなたはレビュアーである。著者とは別人として、下のケースを根拠と突き合わせ、誤りを指摘せよ。ファイルは変更しない。出力は日本語。

## 対象

`hareruya-design-docs/integration_test/casegen/mtgbuyer/cases/A07-07_mb_test_cases.tsv`（12列）と `A07-07_mb_seed_data.tsv`。著者の報告は `mtgbuyer/gen_A07-07/report.md`。

## 根拠（正）

- HTML設計書 0507 のシート「複数ネット買取IDから個別入力商品の一覧を取得」のExcel由来の部分。行は `hareruya-design-docs/integration_test/casegen/mtgbuyer/materials/A07-07_requirements.tsv`（REQ-0507-sheet-9-R001〜R026）。
- 機能設計書 `hareruya-design-docs/functions/pf-api/a07-07_api_online_purchase_buy_order_indivisual_input_product.md`。これは現行ソース `pf-api/`（`/home/y-saito/Developments/pf-api`）から起こしたもの。機能設計書やケースの期待結果が現行ソースと食い違っていたら指摘せよ（判定「設計書の誤り」）。エンドポイントは `src/Controller/Admin/BuyOrderIndivisualInputProductController.php`、認証は `src/Controller/BaseController.php`。
- HTML設計書の同シートに埋め込まれた「現行仕様」は A07-06 のもの（埋め込みの取り違え）なので根拠にしていない。
- 規約は `mtgbuyer/GEN_A0707_PROMPT.md`、前提条件は `precond/README.md`（P1〜P13）、判定単位は `viewpoint_canonical/viewpoints_canonical.tsv`。手本にした既存ケースは `casegen/cases/A07-06_test_cases.tsv`。

## 意図的であり指摘対象外のもの

- 連鎖IDが空欄であること。パス・項目名をバッククォートで書いていること。
- `ids` 欠落時と許可IP拒否時のケースが無いこと（拒否時のふるまいが根拠に無い）。ただし、現行ソースから見て根拠（設計書）に書くべき明確なふるまいがあるなら「設計書の誤り・欠落」として指摘してよい。
- 返す順序を期待結果にしていないこと。

## 重点観点

1. 期待結果が根拠から出るか。現行ソースで実際にそうなるか（メソッド、パス、`ids` の渡し方＝クエリか本文か、応答の項目名と型、未設定値の扱い、0件、認証失敗時のステータスと本文）。
2. 事前準備の状態から手順を実行して期待結果に到達できるか。各ケースが単独で成立するか。
3. 判定IDの当て方、重複、1ケースに複数の期待結果、物理名の混入。
4. 根拠の行のうち、ケースが無いもの。

## 出力形式

指摘が無ければ `NONE` の1語。あれば1件ごとに次の形で書く。最大15件。

```
### 指摘N（テストID または 機能ID）
- 主張: ケースの記述（要点の引用）
- 実際: 設計書または実ソースの事実（file:line）
- 判定: 期待結果の誤り／設計書に無い期待／成立しない前提・手順／判定IDの誤り／取りこぼし／重複／設計書の誤り
- 修正案: 結論を先に置いた1〜2文
```
