# API 店頭買取管理 — カード詳細IDから買取用商品情報を取得

## 業務ロジック

### 取得対象

パスで指定されたカード詳細IDが属するカードに紐づく買取用商品を取得する。取得結果が空のときはページが見つからない扱い（404）とする。

### 応答値の扱い

金額・税・ポイント・在庫数量の再計算や丸めは行わない。取得時点の値をJSON応答へ整形して返す。表示用の加工と表示制御は呼び出し元クライアントの設計を正とする。

### 応答の階層

応答はカードIDをキーとする `cards` オブジェクトを最上位に持つ階層構造とする。各カードの配下にカード詳細ID（`details`）、言語コード（`languageClasses`）、状態コード（`conditionClasses`）の順で入れ子になる。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 該当する買取用商品が無い | ページが見つからない扱い（404）とし、標準の例外応答（メッセージを含むJSON）を返す |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | パスのカード詳細ID（`detailId`、整数、必須）。このIDが属するカードに紐づく買取用商品を取得する |
| 成功時出力 | HTTP 200。買取用商品情報のJSON |
| 失敗時出力 | HTTP 404。該当する買取用商品が無いとき |

### 出力: 応答フィールド

| フィールド | 型 | 説明 |
|------------|----|------|
| `cards` | object | カードIDをキーとするオブジェクト。値は各カードの情報。 |
| `cards.<cardId>.cardNameJp` | string | カードの日本語名。 |
| `cards.<cardId>.cardNameEn` | string | カードの英語名。 |
| `cards.<cardId>.imageFileName` | string | カード画像のファイル名。 |
| `cards.<cardId>.details` | object | カード詳細IDをキーとするオブジェクト。値は各カード詳細の情報。 |
| `cards.<cardId>.details.<detailId>.cardsetCode` | string | カードセットのコード。カードセット未設定のときはnull。 |
| `cards.<cardId>.details.<detailId>.cardsetName` | string | カードセットの日本語名。カードセット未設定のときはnull。 |
| `cards.<cardId>.details.<detailId>.foilFlg` | boolean | フォイルか否か。 |
| `cards.<cardId>.details.<detailId>.cardNo` | string | カード番号。 |
| `cards.<cardId>.details.<detailId>.promotionName` | string | プロモーションの日本語名。プロモーション未設定のときはnull。 |
| `cards.<cardId>.details.<detailId>.productId` | integer | 商品ID。 |
| `cards.<cardId>.details.<detailId>.productNameJp` | string | 商品の日本語名。 |
| `cards.<cardId>.details.<detailId>.productNameEn` | string | 商品の英語名。 |
| `cards.<cardId>.details.<detailId>.rarityCode` | string | レアリティのコード。 |
| `cards.<cardId>.details.<detailId>.storageCodeName` | string | 保管コードの名称。未設定のときはnull。 |
| `cards.<cardId>.details.<detailId>.languageClasses` | object | 言語コードをキーとするオブジェクト。 |
| `cards.<cardId>.details.<detailId>.languageClasses.<languageCode>.conditionClasses` | object | 状態コードをキーとするオブジェクト。値は商品規格単位の情報。 |
| `…conditionClasses.<conditionCode>.productClassId` | integer | 商品規格ID。 |
| `…conditionClasses.<conditionCode>.productCode` | string | 商品コード。 |
| `…conditionClasses.<conditionCode>.buyPrice` | integer | 買取価格。未設定のときはnull。 |
| `…conditionClasses.<conditionCode>.price` | string | 販売価格（販売価格列の値）。 |
| `…conditionClasses.<conditionCode>.stock` | string | 在庫数。 |
| `…conditionClasses.<conditionCode>.sectionId` | integer | 部門ID。未設定のときはnull。 |

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

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| A06-06-MSG-001 | API応答JSON（errors配列） | 認証エラー | カード詳細ID取得時に、ログイン中の利用者が管理者でない | MTGバイヤー側で認証を行い再試行する |
| A06-06-MSG-002 | API応答JSON（errors配列） | カードが見つかりません | 指定カード詳細IDに対応する買取用カードが0件 | 対象カード詳細IDを確認して再検索する |

いずれのメッセージも英訳を持たない。
