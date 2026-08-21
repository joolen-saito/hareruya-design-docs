# API 店頭買取管理 — 商品名から商品詳細の情報を取得

## 業務ロジック

### 検索対象

指定された商品名から対象の商品ID群を取得し、その商品サブクラス情報を取得する。商品名が未指定のとき、該当する商品が無いとき、該当する商品サブクラス情報が無いときは、いずれも該当なし（HTTP 404）とする。

### 商品のまとめ方

商品ID・言語・高額商品コードの組み合わせを単位に商品をまとめ、商品ごとにカテゴリ・地域制限・商品名を設定する。カード詳細を持つ商品は商品名の先頭に言語コードを付す。商品の件数が100件に達した時点で打ち切る。

### 返す商品規格の絞り込み

各商品規格のうち、良品（NM）または価格が表示下限以上のものだけを商品規格として加える。画像はファイル名からURLへ変換して並べる。商品ごとにその他コンディションの表示可否を判定し、表示しないときは良品（NM）の規格のみに絞る。

金額・ポイント・数量・ステータス・日時は永続化済みの値を返し、応答生成時の丸め・補正は行わない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 商品名が未指定 | 該当なし（HTTP 404）・「Not Found」のJSONを返す |
| 該当する商品・商品サブクラスが無い | 該当なし（HTTP 404）・「Not Found」のJSONを返す |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索する商品名 |
| 成功時出力 | HTTP 200。処理結果コード200と該当商品の配列（最大100件） |
| 失敗時出力 | HTTP 404。商品名未指定、または該当する商品・商品サブクラスが無いとき |

### 入力: リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `product` | クエリ | string | 必須 | 検索する商品名。未指定（空）の場合は該当なし（HTTP 404）となる |

### 出力: レスポンス（成功）

| フィールド | 型 | 説明 |
|------------|----|------|
| `code` | integer | 処理結果コード。成功時は200 |
| `products` | array | 該当した商品の配列。最大100件 |
| `products[].product_id` | integer | 商品ID |
| `products[].product_name` | string | 商品名。カード詳細を持つ商品は先頭に言語コードを付す |
| `products[].language_code` | string | 言語コード |
| `products[].high_price_code` | string | 高額商品コード |
| `products[].categories` | array | カテゴリ名の配列 |
| `products[].region_restriction` | string | 地域制限の名称 |
| `products[].product_classes` | array | 商品規格の配列 |
| `products[].product_classes[].product_class_id` | integer | 商品規格ID |
| `products[].product_classes[].product_code` | string | 商品コード |
| `products[].product_classes[].card_condition_code` | string | カードコンディションコード |
| `products[].product_classes[].price` | integer | 販売価格 |
| `products[].product_classes[].stock` | integer | 在庫数 |
| `products[].product_classes[].product_class_images` | array | 商品規格画像のURLの配列 |

```json
{
  "code": 200,
  "products": [
    {
      "product_id": 100001,
      "product_name": "【JP】サンプルカード",
      "language_code": "JP",
      "high_price_code": "H001",
      "categories": ["シングルカード", "サンプルセット"],
      "region_restriction": "制限なし",
      "product_classes": [
        {
          "product_class_id": 200001,
          "product_code": "CARD-0001",
          "card_condition_code": "NM",
          "price": 480,
          "stock": 12,
          "product_class_images": [
            "https://example.com/s3/sample_1.jpg"
          ]
        }
      ]
    }
  ]
}
```

### 出力: レスポンス（失敗）

| HTTPステータス | 条件 | 本文の形 |
|----------------|------|----------|
| 404 | 商品名が未指定、または該当する商品・商品サブクラスが無い | 処理結果コードと "Not Found" のメッセージ |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| — | API応答JSON | Not Found | 商品名が未指定、または該当する商品・商品サブクラスが無いとき | HTTP 404を返して終了する |
