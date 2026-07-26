# API その他 — 商品IDに紐づく商品詳細の情報を取得

## 概要

外部連携先（任意門）が商品IDを指定して、商品の詳細情報（商品本体・カード情報・コンディション別の商品規格・画像）を取得するためのAPIである。pf-api（買取・連携用のAPIアプリケーション）が提供するJSON APIで、商品IDと言語に対応する商品詳細を返す。

本機能のカスタマイズ区分は現行踏襲であり、挙動は現行実装（pf-api）を参照し、DB関連はec-cube-enterpriseを正とする。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値はpf-apiの商品詳細取得処理、ルート定義（`config/routes.yaml`）、商品を扱うリポジトリを正とする。

対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない。本文ではフレームワークのコントローラ型名やメソッド名を主説明としない。「利用者視点の入口」にHTTPメソッドとパスパターンを書く。

---

## 本書で扱うこと

- 商品IDと言語による商品詳細情報・商品規格・カード情報・画像の取得
- 表示するコンディションの絞り込み
- 該当が無い場合の応答

---

## 本書で扱わないこと

以下は本書では仕様確定せず、実装または別APIの設計を正とする。

- 商品名による商品詳細取得（商品名から商品詳細取得APIの設計を正とする）
- 買取用商品情報の取得（買取用商品情報取得APIの設計を正とする）
- 商品の登録・編集（商品管理を正とする）

---

## リニューアル移行時の扱い

商品・商品規格は標準のEC-CUBE構成にカード関連の拡張列を加えた構成であり、現行（pf-api）と移行先（ec-cube-enterprise）でDB関連の記述は移行先を正とする。確認できた対応を以下に記録する。

| 応答フィールド | 移行先の列 |
|----------------|------------|
| `product_name` | `dtb_product.name` |
| `description_detail` | `dtb_product.description_detail`（日本語は `description_detail_jp`） |
| `region_restriction` | `dtb_product` の地域制限参照（`mtb_region_restriction`） |
| `product_code` | `dtb_product_class.product_code` |
| `high_price_code` | `dtb_product_class.high_price_code` |
| `card_condition_code` | `dtb_product_class.card_condition_id`／`card_condition_name`（コンディション） |
| `price` | `dtb_product_class.price02`（販売価格） |
| `sale_limit` | `dtb_product_class.sale_limit` |
| `stock` | `dtb_product_class.stock` |
| `product_class_images` | `dtb_product_class_image`（`product_image_id`、並び順 `rank`） |

カード情報（色・マナコスト・レアリティ等）はカードマスタ（`mtb_card`・`mtb_card_detail`）から取得する。

---

## 用語

| 用語 | 説明 |
|------|------|
| 商品規格 | 商品のコンディション等の規格単位。価格・在庫・画像を持つ。 |
| カード情報 | カード商品に紐づく詳細情報（色・マナコスト・レアリティ等）。 |
| 週間販売数 | 直近の販売数の集計値。商品規格ごとの数量を合算する。 |

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| 商品IDによる商品詳細の取得 | `GET /product/detail/{productId}` | 商品IDと言語に対応する商品詳細をJSONで返す。該当が無い場合は404を返す。 |
| 同上（拡張子あり別名） | `GET /product/detail/{productId}.json` | 上と同一処理。 |

応答形式はJSON。呼び出し元は外部連携先（任意門）。

---

## 認証・認可

| 観点 | 内容 |
|------|------|
| 認証方式 | 本APIは`jwt-token`等による認証を行わない。商品詳細の参照に限定する。 |
| 認可 | 呼び出し元は外部連携先（任意門）。アクセス経路の制御はAPI外（ネットワーク・配置）の範囲とし、本書では仕様確定しない。 |

---

## 処理フロー

### 商品IDで商品詳細を取得する（GET `/product/detail/{productId}`）

1. パスの商品IDと、クエリの言語を受け取る。言語が未指定の場合は日本語を既定とする。
2. 商品IDと言語で商品詳細を取得する。該当が無い場合は該当なし（HTTP 404）とする。
3. 先頭の明細から商品本体の情報（商品名・言語・説明・カテゴリ・地域制限）を設定する。カード商品の場合は商品名の先頭に言語コードを付し、カード情報を組み立てる。
4. 各明細について週間販売数を合算する。
5. 各明細のうち、良品（NM）または価格が表示下限以上のものだけを商品規格として加え、画像はファイル名からURLへ変換して並べる。
6. コード200・週間販売数・商品情報・カード情報・商品規格をJSONで返す。

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| A17-04-MSG-001 | API応答JSON（errors配列） | 商品詳細の取得に失敗しました | （英訳なし） | 商品詳細レスポンス生成中に例外が発生 | API呼出元でHTTP 500とerrors配列を処理する |

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 対象データ | リクエストで指定されたID・条件に一致するデータを取得対象とする。抽出条件と該当なし時の扱いは処理フロー・入出力の各節を正とする。 |
| 計算処理 | 本APIでは金額・税・ポイント・在庫数量の再計算や丸めを行わない。DBまたはリポジトリから取得した値をJSON応答へ整形して返す。 |
| 応答値 | 応答フィールドは取得時点の値を返す。表示用の加工やフロントエンド側の表示制御は呼び出し元クライアントの設計を正とする。 |

---

## 入出力

### リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `productId` | パス | integer | 必須 | 取得対象の商品ID。 |
| `lang` | クエリ | string | 任意 | 言語区分。未指定の場合は日本語（`JP`）を既定とする。 |

### レスポンス（成功）

HTTP 200。

| フィールド | 型 | 説明 |
|------------|----|------|
| `code` | integer | 処理結果コード。成功時は200。 |
| `weekly_sold` | integer | 週間販売数。商品規格ごとの数量を合算した値。 |
| `product_id` | integer | 商品ID。 |
| `product_name` | string | 商品名。カード商品は先頭に言語コードを付す。 |
| `language_code` | string | 言語コード。 |
| `description_detail` | string | 商品説明。 |
| `categories` | array | カテゴリ名の配列。 |
| `region_restriction` | string | 地域制限の名称。 |
| `card_detail` | object | カード情報。カード商品でない場合はnull。 |
| `card_detail.card_name` | string | カード名。 |
| `card_detail.colors` | string | 色。 |
| `card_detail.mana_cost` | string | マナコスト。 |
| `card_detail.rarity` | string | レアリティ名。 |
| `card_detail.card_type` | string | カードタイプ。 |
| `card_detail.card_text` | string | カードテキスト。 |
| `card_detail.flavor` | string | フレーバーテキスト。 |
| `card_detail.power_toughness` | string | パワー／タフネス。該当が無い場合はnull。 |
| `card_detail.loyalty` | string | 忠誠度。該当が無い場合はnull。 |
| `card_detail.cardset` | string | カードセット名。 |
| `card_detail.cardsetblock` | string | カードセットブロック名。 |
| `card_detail.illustrator` | string | イラストレーター名。 |
| `card_detail.formats` | array | フォーマット情報。 |
| `product_classes` | array | 商品規格の配列。 |
| `product_classes[].product_class_id` | integer | 商品規格ID。 |
| `product_classes[].product_code` | string | 商品コード。 |
| `product_classes[].high_price_code` | string | 高額商品コード。 |
| `product_classes[].card_condition_code` | string | カードコンディションコード。 |
| `product_classes[].price` | integer | 販売価格。 |
| `product_classes[].sale_limit` | integer | 販売上限数。該当が無い場合はnull。 |
| `product_classes[].stock` | integer | 在庫数。 |
| `product_classes[].product_class_images` | array | 商品規格画像のURLの配列。 |

### レスポンス（失敗）

| HTTPステータス | 条件 | 本文の形 |
|----------------|------|----------|
| 404 | 商品IDに該当する商品詳細が無い | `{code, message}`（"Not Found"） |

### サンプルレスポンス

成功時の応答例（実装確認値に基づく代表値）。

```json
{
  "code": 200,
  "weekly_sold": 5,
  "product_id": 100001,
  "product_name": "【JP】サンプルカード",
  "language_code": "JP",
  "description_detail": "サンプルの商品説明。",
  "categories": ["シングルカード", "サンプルセット"],
  "region_restriction": "制限なし",
  "card_detail": {
    "card_name": "サンプルカード",
    "colors": "白",
    "mana_cost": "{1}{W}",
    "rarity": "レア",
    "card_type": "クリーチャー",
    "card_text": "サンプルの効果文。",
    "flavor": "サンプルのフレーバー。",
    "power_toughness": "2/2",
    "loyalty": null,
    "cardset": "サンプルセット",
    "cardsetblock": "サンプルブロック",
    "illustrator": "Sample Illustrator",
    "formats": ["スタンダード"]
  },
  "product_classes": [
    {
      "product_class_id": 200001,
      "product_code": "CARD-0001",
      "high_price_code": "H001",
      "card_condition_code": "NM",
      "price": 480,
      "sale_limit": null,
      "stock": 12,
      "product_class_images": [
        "https://example.com/s3/sample_1.jpg"
      ]
    }
  ]
}
```

### 副作用

無し（参照のみ）。

応答はJSON応答整形を経て返す。本APIのフィールド名はコントローラで組み立てたsnake_caseのキーである。

---

## バリデーション

| 項目 | 内容 |
|------|------|
| `productId` | パスの商品ID。該当する商品詳細が無い場合は該当なし（HTTP 404）とする。 |
| `lang` | 任意。未指定の場合は日本語（`JP`）を既定とする。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 参照時点 | 呼び出し時点の商品・商品規格・在庫・価格を返す。本APIはデータを更新しない。 |
| 言語 | 指定言語に対応する商品詳細を返す。未指定時は日本語を返す。 |
| 表示条件 | 表示下限価格や良品（NM）判定により、応答に含まれる商品規格は実在の規格の一部となることがある。 |

---

## DBカラム

機能に直接関係する範囲のみ記載する。型や一覧の細部はスキーマを参照する。

テーブル名・列名はec-cube-enterpriseを正とする。

| テーブル | 列 | メモ |
|----------|-----|------|
| 商品（`dtb_product`） | 識別子（`id`）・商品名（`name`）・説明（`description_detail`／`description_detail_jp`）・地域制限（`region_restriction_id`） | 取得条件・応答の商品情報に用いる。カテゴリは商品カテゴリ参照で取得する。 |
| 商品規格（`dtb_product_class`） | 識別子（`id`）・商品コード（`product_code`）・高額商品コード（`high_price_code`）・コンディション（`card_condition_id`／`card_condition_name`）・販売価格（`price02`）・販売上限（`sale_limit`）・在庫（`stock`） | 応答の商品規格に用いる。 |
| 商品規格画像（`dtb_product_class_image`） | 商品規格（`product_class_id`）・商品画像（`product_image_id`）・並び順（`rank`） | 応答の商品規格画像に用いる。 |
| カードマスタ（`mtb_card`・`mtb_card_detail`） | 色・マナコスト・レアリティ・カードタイプ・テキスト・セット等 | カード商品の応答に用いる。 |

### DB操作

本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | dtb_product / dtb_product_class / dtb_product_class_image / mtb_card / mtb_card_detail | 検索条件に合致するレコードを抽出する。 |

---

## 権限・認可

| 利用者状態 | 商品詳細取得 |
|------------|--------------|
| クライアント | 外部連携先（任意門）から呼び出す。本APIは認証を行わない。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 商品IDに該当する商品詳細が無い | 該当なし（HTTP 404）・「Not Found」のJSONを返す。 |

---

## ログ・監査

### ログに出してはいけないもの

- API接続の認証情報
- Cookie値・セッションIDの完全値

---

## 排他制御・トランザクション

本APIは参照のみであり、楽観ロック・悲観ロックの対象は持たない。
