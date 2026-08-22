# API 店頭買取管理 — カード詳細IDから買取用商品情報を取得

## 業務ロジック

### 取得の対象

指定されたカード詳細IDが属するカードに紐づく買取用商品を取得する。取得結果が空のときは、ページが見つからない扱い（404）とする。

### 応答の組み立て

応答はカードIDをキーとする階層構造とし、カードの配下にカード詳細ID、言語コード、状態コードの順で入れ子にする。応答フィールドは取得時点の値を返し、金額・税・ポイント・在庫数量の再計算や表示用の丸めは行わない。表示用の加工は呼び出し元の設計に委ねる。

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| 該当する買取用商品が無い | ページが見つからない扱い（404）とし、メッセージを含む標準の例外応答を返す |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | カード詳細ID |
| 成功時出力 | HTTP 200。買取用商品情報のJSON |
| 失敗時出力 | HTTP 404。該当する買取用商品が無いとき |

### 入出力: リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
| --- | --- | --- | --- | --- |
| `detailId` | パス | integer | 必須 | 取得対象のカード詳細ID。このIDが属するカードに紐づく買取用商品を取得する |

### 入出力: 応答フィールド

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `cards` | object | カードIDをキーとするオブジェクト。値は各カードの情報 |
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
