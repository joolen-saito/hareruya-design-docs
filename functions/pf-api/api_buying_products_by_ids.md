# API 店頭買取管理 — 商品IDリストから買取用商品情報を取得

## 概要

商品IDのリストを指定して、買取に用いる商品情報をまとめて取得するAPIである。pf-apiが提供するJSON APIで、MTGバイヤー（買取アプリ）から呼ばれる。カード商品以外のIDが渡された場合に0件となり得るが、それをエラーとはしない。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値はpf-apiの買取用商品一括取得処理、ルート定義、商品を扱うリポジトリを正とする。カスタマイズ区分は現行踏襲で、挙動の参照リポはpf-api、DB関連はec-cube-enterpriseを正とする。

対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない。

---

## 本書で扱うこと

- 商品IDリストによる買取用商品情報の一括取得
- 0件時の扱い（エラーとしない）

---

## 本書で扱わないこと

以下は本書では仕様確定せず、実装または別機能の設計を正とする。

- カード詳細ID・カード名による買取用商品取得（各APIを正とする）
- 買取査定そのもの（買取処理を正とする）

---

## リニューアル移行時の扱い

DB関連はec-cube-enterpriseを正とする。商品（`dtb_product`）・商品規格（`dtb_product_class`）・カード（`mtb_card`）・カード詳細（`mtb_card_detail`）はec-cube-enterpriseに同名で実在する。一方、現行（pf-api）が参照する商品サブ（`dtb_product_sub`）・商品サブクラス（`dtb_product_sub_class`）のビューと商品サブクラス画像（`dtb_product_sub_class_image`）は、ec-cube-enterpriseでは商品規格・商品規格画像（`dtb_product_class_image`）系へ再編されており同名ビューを確認できない。買取用の出し分けに用いる該当テーブル・列はec-cube-enterprise実装で要確認とする。挙動（取得条件・0件許容）は現行（pf-api）を正とする。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| 商品IDリストから買取用商品情報取得 | `POST /buying/products` | カンマ区切りの商品IDリストに対応する買取用商品情報をJSONで返す。0件でもエラーとしない。 |

応答形式はJSON。MTGバイヤーから呼ばれる。

---

## 処理フロー

### 買取用商品情報を一括取得する（POST `/buying/products`）

1. リクエストの商品IDリスト（`ids`、カンマ区切り）を受け取り、IDの配列に分解する。
2. 商品のリポジトリから、当該商品IDリストに対応する買取用商品を取得する。
3. カード商品以外のIDのみで0件となった場合もエラーとせず、取得結果（空を含む）をJSONで返す。

---

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 対象データ | リクエストで指定された条件に一致するデータを取得対象とする。抽出条件、除外条件、並び順、ページングは入出力・データ整合性・ページネーションの各節を正とする。 |
| 集計・件数 | 件数や一覧を返す場合は、検索条件適用後の対象を基準にする。金額・税・ポイント・在庫数量の再計算は行わない。 |
| 応答値 | DBまたはリポジトリで取得した値をJSON応答へ整形して返す。表示用の丸め・税計算・ポイント計算は本APIでは行わない。 |

---

## 入出力

### リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `ids` | ボディ | string | 任意 | カンマ区切りの商品IDリスト。カンマで分解してIDの配列とし、当該商品IDに紐づく買取用商品を取得する。 |

`ids`が空または未指定のときは空文字列をカンマ分解した配列で検索するため、結果は0件となる。

### レスポンス（成功）

HTTP 200。

応答はカードIDをキーとする`cards`オブジェクトを最上位に持つ階層構造とする。各カードの配下にカード詳細ID（`details`）、言語コード（`languageClasses`）、状態コード（`conditionClasses`）の順で入れ子になる。0件のときは空配列を返す。

| フィールド | 型 | 説明 |
|------------|----|------|
| `cards` | object | カードIDをキーとするオブジェクト。値は各カードの情報。0件のときは応答全体が空配列。 |
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

### レスポンス（失敗）

本APIは該当0件をエラーとせず、専用の失敗ステータスを返さない（0件時もHTTP 200で空配列を返す）。

### サンプルレスポンス

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

### 副作用

無し（参照のみ）。

応答はJSON応答整形を経て返す。プロパティはcamelCase、日時はISO8601とする。

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 参照時点 | 呼び出し時点の商品情報を返す。本APIはデータを更新しない。 |
| 0件許容 | カード商品以外のIDのみのときは0件を正常応答とする。 |

---

## DBカラム

テーブル名・列名はec-cube-enterpriseを正とする。

| テーブル | 列 | メモ |
|---------|-----|------|
| 商品（`dtb_product`） | 商品ID・商品名 | 取得条件（idsの商品ID）・応答の商品情報に用いる。 |
| 商品規格（`dtb_product_class`） | 商品規格ID・商品コード・販売価格・在庫数 | 応答の規格情報に用いる。 |
| カード詳細（`mtb_card_detail`） | カード詳細ID | 応答のカード詳細情報に用いる。 |
| カード（`mtb_card`） | カードID・カード名 | 応答のカード情報に用いる。 |
| 商品サブ・商品サブクラス（`dtb_product_sub`／`dtb_product_sub_class`） | 買取用の出し分け列 | 現行はビューを参照。ec-cube-enterpriseでは商品規格系へ再編済みのため要確認。 |

### DB操作

本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | dtb_product / dtb_product_class / dtb_product_sub / dtb_product_sub_class / mtb_card / mtb_card_detail | 検索条件に合致するレコードを抽出する。 |

---

## 権限・認可

| 利用者状態 | 買取用商品情報一括取得 |
|------------|------------------------|
| クライアント | MTGバイヤー（買取アプリ）から呼び出す。認可方式はpf-apiの方針に従う。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 0件（カード商品以外のID） | エラーとせず空を返す。 |

---

## 排他制御・トランザクション

本APIは参照のみであり、楽観ロック・悲観ロックの対象は持たない。
