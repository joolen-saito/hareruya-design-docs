# F05-01（ネット買取トップページ）

## 業務ロジック

### 目玉買取商品の抽出

抽出条件は固定で、画面から指定できない。高額商品コードを持つ商品サブクラスは対象から外す。取り扱う言語は日本語と英語に限り、それ以外の言語で登録された商品サブクラスは表示しない。販売価格が0円の規格は対象から外す。該当が0件のときは一覧を空で表示し、エラーとしない。抽出結果は30秒間保持され、その間に商品データを更新しても表示には反映されない。

### 一覧の表示

商品画像は先に読み込み中の画像を表示し、読み進めて表示位置に入った時点で実画像へ差し替える。商品画像が登録されていないときは、画像なしを表す代替画像を同じ手順で表示する。買取価格は商品データの登録値をそのまま表示するだけで、本機能では計算しない。本ページではショップ名の見出しを表示しない。

### カート追加の応答

「カートに追加」の押下は画面遷移を伴わず非同期で行い、処理中は押下したボタンの位置に読み込み中の表示を出す。処理が終わると読み込み中の表示を消してボタンを元に戻し、成否いずれの結果も押下した商品の位置にダイアログで知らせる。ダイアログの文言と、閉じるまでのふるまい（自動的に閉じるか、利用者が閉じるまで残るか）はF05-05を正とする。買取カートへ追加するふるまいもF05-05を正とする。

### 商品数の入力範囲

商品数の初期値は1とする。増減ボタンで設定できる値は1から20までとする。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | なし（検索条件・絞り込み条件を受け取らない） |
| 成功時出力 | 目玉買取商品の一覧を含むトップページのHTML |
| 失敗時出力 | 本機能固有のエラー応答は持たない |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | ページ見出し | 目玉買取商品 | トップページの表示時 | 見出しの下に目玉買取商品の一覧を表示する |

本機能は固有のエラー文言を生成しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 目玉買取商品の抽出 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:861-923 |
| 目玉買取商品の抽出 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:58-70 |
| 一覧の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig:19-20 |
| 一覧の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig:6-12 |
| 一覧の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Purchase/index.twig:1 |
| カート追加の応答 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/purchase_js.twig:3-42 |
| 商品数の入力範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig:29-31 |
| 商品数の入力範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/assets/js/ec.js:288-317 |
