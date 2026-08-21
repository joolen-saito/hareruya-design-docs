# 商品管理 — 更新商品規格取得（API）

## 業務ロジック

### 取得の対象期間

パスで受け取った開始日は当日0時0分0秒、終了日は当日23時59分59秒として期間を組み立てる。商品情報・商品規格のいずれかの更新日時が当該期間内にある商品規格を取得対象とする。期間に該当が無いときもエラーとしない。

### 応答の組み立て

件数と商品規格行の配列を返す。0件のときは件数0・空配列とする。商品画像ファイル名・カテゴリID・カテゴリ名は、それぞれカンマ区切りで連結した文字列として返す。金額・ポイント・数量などの派生値は取得した値をそのまま返し、丸め・補正は行わない。大量件数に備え、扱えるメモリの上限を引き上げて処理する。

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| 期間に該当なし | 件数0・空の結果を返す。専用の失敗ステータスは返さない |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 取得期間の開始日と終了日 |
| 成功時出力 | HTTP 200。件数と商品規格行の配列 |
| 失敗時出力 | 該当なしをエラーとしないため、専用の失敗ステータスを返さない |

### 入出力: リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
| --- | --- | --- | --- | --- |
| `strFromDate` | パス | string | 必須 | 取得期間の開始日。当日0時0分0秒に丸めて期間下限とする。日時として解釈できる文字列を渡す |
| `strToDate` | パス | string | 必須 | 取得期間の終了日。当日23時59分59秒に丸めて期間上限とする。日時として解釈できる文字列を渡す |

### 入出力: 応答フィールド

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `count` | integer | 取得した商品規格の件数 |
| `result` | array | 商品規格行の配列。0件のときは空配列 |
| `result[].productId` | integer | 商品ID |
| `result[].productCode` | string | 商品コード |
| `result[].name` | string | 商品の日本語名 |
| `result[].nameEn` | string | 商品の英語名 |
| `result[].descriptionDetail` | string | 商品説明（詳細） |
| `result[].descriptionDetailEn` | string | 商品説明（詳細・英語） |
| `result[].statusId` | integer | 商品ステータスのID |
| `result[].statusName` | string | 商品ステータスの名称 |
| `result[].stock` | string | 在庫数 |
| `result[].price02` | string | 販売価格 |
| `result[].imageFileName` | string | 商品画像ファイル名をカンマ区切りで連結した文字列 |
| `result[].categoryId` | string | カテゴリIDをカンマ区切りで連結した文字列 |
| `result[].categoryName` | string | カテゴリ名をカンマ区切りで連結した文字列 |
| `result[].strageCodeId` | integer | 保管コードのID。未設定のときはnull |
| `result[].storageCodeName` | string | 保管コードの名称。未設定のときはnull |
| `result[].languageCode` | string | 言語コード。未設定のときはnull |
| `result[].cardsetCode` | string | カードセットのコード。未設定のときはnull |
| `result[].cardConditionCode` | string | カード状態のコード。未設定のときはnull |
| `result[].productClassUpdateDate` | string | 商品規格の更新日時 |
| `result[].productUpdateDate` | string | 商品情報の更新日時 |

### 入出力: 永続化

本機能はデータを更新しない。

## 表示メッセージ

この機能は画面を持たないためメッセージを扱わない。
