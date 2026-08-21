# バッチ 商品管理 — 在庫初期化

## 業務ロジック

### 実行できる条件

バッチ名と、複製先となる新規店舗の支店IDを引数に指定して実行する。支店IDを指定しないときは、支店IDの指定を促すメッセージを出力し、複製を行わずに終了する。バッチ名が未指定のとき、またはこのバッチで実行できる名称と一致しないときは、その旨を出力し、複製を行わずに終了する。

### 複製先に設定する値

作成日時と更新日時には実行時刻を設定する。登録者には固定の管理者（ID 1）を設定する。複製先はピックアップ商品にしない。

### 再実行したとき

すでに同じ支店IDで複製済みかどうかは判定しない。同じ支店IDで繰り返し実行すると、そのたびに基準店舗の在庫と同じ件数が追加される。

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| バッチ名が未指定のとき、または一致しないとき | 複製を行わずに終了する。開始と完了の出力も行わない |
| 支店IDの引数が無いとき | 指定を促すメッセージを出力して終了する。完了の出力は行わない |
| 複製の登録に失敗したとき | 完了のメッセージを出力しない |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | バッチ名、複製先となる新規店舗の支店ID |
| 実行条件 | 複製先の支店IDが引数で指定されていること |
| 成功時出力 | 実行時刻を伴う開始と完了の処理経過の出力 |
| 失敗時出力 | 支店IDの指定を促すメッセージ、またはバッチ名が未指定・不一致である旨の出力 |

## 表示メッセージ

本バッチは画面に表示する文言を持たない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 実行できる条件 | P2 | ec-cube:app/Customize/Command/ProductStockBatch.php:53-63 |
| 実行できる条件 | P2 | ec-cube:app/Customize/Service/Product/InitialStockRegistration.php:43-46 |
| 複製先に設定する値 | P1 | ec-cube:app/Customize/Service/Product/InitialStockRegistration.php:58-66 |
| 再実行したとき | P1 | ec-cube:app/Customize/Service/Product/InitialStockRegistration.php:48-67 |
| エラー時の扱い | P2 | ec-cube:app/Customize/Command/ProductStockBatch.php:57-69 |
| エラー時の扱い | P2 | ec-cube:app/Customize/Service/Product/InitialStockRegistration.php:43-46 |
