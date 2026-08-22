# API 店頭買取管理 — 商品IDリストから買取用商品情報を取得

## 業務ロジック

### 取得の対象

商品IDリストをカンマで分解して商品IDの配列とし、その商品IDに紐づく買取用商品を取得する。商品IDリストが空または未指定のときは、空文字列を分解した配列で検索するため結果は0件になる。カード商品以外のIDだけを指定して0件になったときもエラーとしない。

### 応答の組み立て

応答はカードIDをキーとする階層構造とし、カードの配下にカード詳細ID、言語コード、状態コードの順で入れ子にする。0件のときは空配列を返す。取得した値をそのまま応答へ整形し、金額・税・ポイント・在庫数量の再計算や表示用の丸めは行わない。件数や一覧は検索条件を適用した後の対象を基準とする。

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| カード商品以外のIDのみで該当0件 | エラーとせず空配列を返す |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 商品IDリスト（カンマ区切り） |
| 成功時出力 | HTTP 200。買取用商品情報のJSON。0件のときは空配列 |
| 失敗時出力 | 該当0件をエラーとしないため、専用の失敗ステータスを返さない |

### 入出力: リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
| --- | --- | --- | --- | --- |
| `ids` | ボディ | string | 任意 | カンマ区切りの商品IDリスト。カンマで分解した各商品IDに紐づく買取用商品を取得する |

### 入出力: 応答フィールド

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `cards` | object | カードIDをキーとするオブジェクト。値は各カードの情報。0件のときは応答全体が空配列 |
| `cards.<cardId>.cardNameJp` | string | カードの日本語名 |
| `cards.<cardId>.cardNameEn` | string | カードの英語名 |
| `cards.<cardId>.imageFileName` | string | カード画像のファイル名 |
| `cards.<cardId>.details` | object | カード詳細IDをキーとするオブジェクト。値は各カード詳細の情報 |
| `…details.<detailId>.cardsetCode` | string | カードセットのコード。カードセット未設定のときはnull |
| `…details.<detailId>.cardsetName` | string | カードセットの日本語名。カードセット未設定のときはnull |
| `…details.<detailId>.foilFlg` | boolean | フォイルか否か |
| `…details.<detailId>.cardNo` | string | カード番号 |
| `…details.<detailId>.promotionName` | string | プロモーションの日本語名。プロモーション未設定のときはnull |
| `…details.<detailId>.productId` | integer | 商品ID |
| `…details.<detailId>.productNameJp` | string | 商品の日本語名 |
| `…details.<detailId>.productNameEn` | string | 商品の英語名 |
| `…details.<detailId>.rarityCode` | string | レアリティのコード |
| `…details.<detailId>.storageCodeName` | string | 保管コードの名称。未設定のときはnull |
| `…details.<detailId>.languageClasses` | object | 言語コードをキーとするオブジェクト |
| `…languageClasses.<languageCode>.conditionClasses` | object | 状態コードをキーとするオブジェクト。値は商品規格単位の情報 |
| `…conditionClasses.<conditionCode>.productClassId` | integer | 商品規格ID |
| `…conditionClasses.<conditionCode>.productCode` | string | 商品コード |
| `…conditionClasses.<conditionCode>.buyPrice` | integer | 買取価格。未設定のときはnull |
| `…conditionClasses.<conditionCode>.price` | string | 販売価格 |
| `…conditionClasses.<conditionCode>.stock` | string | 在庫数 |
| `…conditionClasses.<conditionCode>.sectionId` | integer | 部門ID。未設定のときはnull |

## 表示メッセージ

この機能は画面を持たないためメッセージを扱わない。
