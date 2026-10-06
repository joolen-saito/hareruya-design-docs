# 敵対レビュー依頼：F08-05（店頭買取査定申込確認）の機能設計書

あなたはレビュアーである。著者とは別人として、下の機能設計書を現行ソースと突き合わせ、誤りを指摘せよ。ファイルは変更しない。出力は日本語。事実確認に限る。
`hareruya-design-docs/integration_test/casegen/sheetmap/review/` にある他のファイルは読まない。

## 対象

`hareruya-design-docs/functions/pf-eccube3/f08-05_front_store_purchase_otc_buy_entry_confirm.md`

カスタマイズのフロント画面「店頭買取査定申込確認」の現行仕様を、現行ソース（`/home/y-saito/Developments/pf-eccube3`）から起こしたもの。HTML設計書の 0308「店頭買取査定申込確認」シートに「現行仕様」として埋め込む。

## 正（突き合わせる相手）

- 現行ソース: `pf-eccube3/app/Plugin/HareruyaEc/Controller/OtcBuyController.php`、`Resource/template/default/OtcBuy/`（confirm.twig とその英語版）、`Resource/template/default/Block/js/` の店頭買取用スクリプト、`Form/Type/Front/OtcBuy/`、検証の定義、翻訳資源、設定ファイル。`ec-cube-enterprise` は根拠にしない。
- Excel基本設計の内容: `hareruya-design-docs/integration_test/casegen/sheetmap/materials/F08-05_sheet.txt`（「現行仕様」より前の部分）。
- 隣の機能の設計書（矛盾が無いかだけ見る）: `hareruya-design-docs/functions/pf-eccube3/f08-02_front_store_purchase_otc_buy_entry_input.md`、`f08-03_front_store_purchase_otc_buy_entry_complete.md`。

## 書き方の規約（これに従っている箇所は指摘しない）

- 書くのは、Excel基本設計が定めていない、画面・応答・メール・DBに現れる入出力とふるまいだけ。Excel が値・条件まで定めていることは、同じでも違っても書かない（Excel が正）。Excel が上位概念や項目名だけ書いていて細部が無いものは書く。
- クラス名・メソッド名・DB物理名・設定キー名などの実装用語は書かない（業務上の呼び名で書く）。
- 節は「業務ロジック」「入出力」「表示メッセージ」と末尾の「出典」。
- 隣の機能（F08-02・F08-03）の設計書が既に書いていることは、重ねて書いていない。確認・登録の判定順序、申込みの登録内容、完了画面、メッセージの文言は F08-03 にある。

## 重点観点

1. 設計書の各文が、現行ソースで実際にそうなるか（条件、境界値、順序、初期値、出る文言、エラー時の扱い。画面のスクリプトとサーバー側の両方で確かめる）。
2. 現行ソースにあって、Excel にも隣の設計書にも無く、この設計書にも無い、外から見えるこの画面のふるまい（取りこぼし）。
3. 規約違反（Excel が定めていることの重複・矛盾、実装用語、推測、到達しない処理の記述）。
4. 出典の行（ファイルと行番号）が、その小見出しの内容の根拠になっているか。

## 出力形式

指摘が無ければ `NONE` の1語。あれば1件ごとに次の形で書く。最大12件。確信の持てないものは挙げない。

```
### 指摘N（小見出し）
- 主張: 設計書の記述（引用）
- 実際: 現行ソースの事実（file:line）または Excel の記述（sheet.txt の行）
- 判定: 事実の誤り／取りこぼし／Excelとの重複・矛盾／実装用語／出典の誤り
- 修正案: 結論を先に置いた1〜2文
```
