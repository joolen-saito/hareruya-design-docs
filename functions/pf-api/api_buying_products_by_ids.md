# API 店頭買取管理 — 商品IDリストから買取用商品情報を取得

## 業務ロジック

### 取得対象

商品IDリストをカンマで分解してIDの配列とし、当該商品IDに紐づく買取用商品を取得する。商品IDリストが空または未指定のときは空文字列をカンマ分解した配列で検索するため、結果は0件になる。

カード商品以外のIDだけを指定して0件になったときもエラーとせず、取得結果（空を含む）を返す。

### 応答値の扱い

取得した値を応答へ整形して返す。表示用の丸め・税計算・ポイント計算・在庫数量の再計算は行わない。件数や一覧を返すときは、検索条件適用後の対象を基準にする。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 0件（カード商品以外のID） | エラーとせず空を返す |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | カンマ区切りの商品IDリスト |
| 成功時出力 | HTTP 200。カードIDをキーとする階層構造の買取用商品情報。0件のときは空配列 |
| 失敗時出力 | 専用の失敗ステータスを持たない。0件のときもHTTP 200で空配列を返す |

### 入力: リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `ids` | ボディ | string | 任意 | カンマ区切りの商品IDリスト。カンマで分解してIDの配列とし、当該商品IDに紐づく買取用商品を取得する |

### 出力: 応答フィールド

応答はカードIDをキーとする`cards`オブジェクトを最上位に持つ階層構造とする。各カードの配下にカード詳細ID、言語コード、状態コードの順で入れ子になる。

| フィールド | 型 | 説明 |
|------------|----|------|
| `cards` | object | カードIDをキーとするオブジェクト。値は各カードの情報。0件のときは応答全体が空配列 |
| `cards.<cardId>.cardNameJp` | string | カードの日本語名 |
| `cards.<cardId>.cardNameEn` | string | カードの英語名 |
| `cards.<cardId>.imageFileName` | string | カード画像のファイル名 |
| `cards.<cardId>.details` | object | カード詳細IDをキーとするオブジェクト。値は各カード詳細の情報 |
| `cards.<cardId>.details.<detailId>.cardsetCode` | string | カードセットのコード。カードセット未設定のときはnull |
| `cards.<cardId>.details.<detailId>.cardsetName` | string | カードセットの日本語名。カードセット未設定のときはnull |
| `cards.<cardId>.details.<detailId>.foilFlg` | boolean | フォイルか否か |
| `cards.<cardId>.details.<detailId>.cardNo` | string | カード番号 |
| `cards.<cardId>.details.<detailId>.promotionName` | string | プロモーションの日本語名。プロモーション未設定のときはnull |
| `cards.<cardId>.details.<detailId>.productId` | integer | 商品ID |
| `cards.<cardId>.details.<detailId>.productNameJp` | string | 商品の日本語名 |
| `cards.<cardId>.details.<detailId>.productNameEn` | string | 商品の英語名 |
| `cards.<cardId>.details.<detailId>.rarityCode` | string | レアリティのコード |
| `cards.<cardId>.details.<detailId>.storageCodeName` | string | 保管コードの名称。未設定のときはnull |
| `cards.<cardId>.details.<detailId>.languageClasses` | object | 言語コードをキーとするオブジェクト |
| `cards.<cardId>.details.<detailId>.languageClasses.<languageCode>.conditionClasses` | object | 状態コードをキーとするオブジェクト。値は商品規格単位の情報 |
| `…conditionClasses.<conditionCode>.productClassId` | integer | 商品規格ID |
| `…conditionClasses.<conditionCode>.productCode` | string | 商品コード |
| `…conditionClasses.<conditionCode>.buyPrice` | integer | 買取価格。未設定のときはnull |
| `…conditionClasses.<conditionCode>.price` | string | 販売価格（販売価格列の値） |
| `…conditionClasses.<conditionCode>.stock` | string | 在庫数 |
| `…conditionClasses.<conditionCode>.sectionId` | integer | 部門ID。未設定のときはnull |

成功時の応答例（実装確認値に基づく代表値）。

```json
{
  "cards": {
    "10001": {
      "cardNameJp": "サンプルカード",
      "cardNameEn": "Sample Card",
      "imageFileName": "10001.jpg",
      "details": {
        "20001": {
          "cardsetCode": "SET",
          "cardsetName": "サンプルセット",
          "foilFlg": false,
          "cardNo": "123",
          "promotionName": null,
          "productId": 30001,
          "productNameJp": "サンプルカード",
          "productNameEn": "Sample Card",
          "rarityCode": "R",
          "storageCodeName": null,
          "languageClasses": {
            "JP": {
              "conditionClasses": {
                "NM": {
                  "productClassId": 40001,
                  "productCode": "P-40001",
                  "buyPrice": 100,
                  "price": "300",
                  "stock": "5",
                  "sectionId": 1
                }
              }
            }
          }
        }
      }
    }
  }
}
```

0件時の応答例。

```json
[]
```

## 表示メッセージ

本APIは画面メッセージを扱わない。
