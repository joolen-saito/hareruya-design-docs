# API 店頭買取管理 — カード詳細IDから買取用商品情報を取得

## 概要

カード詳細IDを指定して、買取に用いる商品情報を取得するAPIである。pf-apiが提供するJSON APIで、MTGバイヤー（買取アプリ）から呼ばれる。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値はpf-apiの買取用商品取得処理、ルート定義、商品を扱うリポジトリを正とする。カスタマイズ区分は現行踏襲で、挙動の参照リポはpf-api、DB関連はec-cube-enterpriseを正とする。

対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない。

---

## 本書で扱うこと

- カード詳細IDによる買取用商品情報の取得
- 該当が無い場合の応答

---

## 本書で扱わないこと

以下は本書では仕様確定せず、実装または別機能の設計を正とする。

- 商品IDリスト・カード名による買取用商品取得（各APIを正とする）
- 買取査定そのもの（買取処理を正とする）

---

## リニューアル移行時の扱い

DB関連はec-cube-enterpriseを正とする。商品（`dtb_product`）・商品規格（`dtb_product_class`）・カード（`mtb_card`）・カード詳細（`mtb_card_detail`）はec-cube-enterpriseに同名で実在する。一方、現行（pf-api）が参照する商品サブ（`dtb_product_sub`）・商品サブクラス（`dtb_product_sub_class`）のビューと商品サブクラス画像（`dtb_product_sub_class_image`）は、ec-cube-enterpriseでは商品規格・商品規格画像（`dtb_product_class_image`）系へ再編されており同名ビューを確認できない。買取用の出し分けに用いる該当テーブル・列はec-cube-enterprise実装で要確認とする。挙動（取得条件・該当なし時の応答）は現行（pf-api）を正とする。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| カード詳細IDから買取用商品情報取得 | `GET /buying/{detailId}` | カード詳細IDに対応する買取用商品情報をJSONで返す。該当が無い場合は404を返す。 |

応答形式はJSON。MTGバイヤーから呼ばれる。

---

## 処理フロー

### 買取用商品情報を取得する（GET `/buying/{detailId}`）

1. パスのカード詳細ID（`detailId`）を受け取る。
2. 商品のリポジトリから、当該カード詳細IDに紐づく買取用商品を取得する。
3. 取得結果が空の場合はページが見つからない扱い（404）とする。
4. 取得できた場合は買取用商品情報をJSONで返す。

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| A06-06-MSG-001 | API応答JSON（errors配列） | 認証エラー | （英訳なし） | カード詳細ID取得時にログインユーザーがMemberでない | MTGバイヤー側で認証を行い再試行する |
| A06-06-MSG-002 | API応答JSON（errors配列） | カードが見つかりません | （英訳なし） | 指定カード詳細IDに対応する買取用カードが0件 | 対象カード詳細IDを確認して再検索する |

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
| `detailId` | パス | integer | 必須 | 取得対象のカード詳細ID。このIDが属するカードに紐づく買取用商品を取得する。 |

### レスポンス（成功）

HTTP 200。

応答はカードIDをキーとする`cards`オブジェクトを最上位に持つ階層構造とする。各カードの配下にカード詳細ID（`details`）、言語コード（`languageClasses`）、状態コード（`conditionClasses`）の順で入れ子になる。

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

### レスポンス（失敗）

| HTTPステータス | 条件 | 本文の形 |
|----------------|------|----------|
| 404 | 該当する買取用商品が無い | 標準の例外応答（メッセージを含むJSON） |

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

### 副作用

無し（参照のみ）。

応答はJSON応答整形を経て返す。プロパティはcamelCase、日時はISO8601とする。

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 参照時点 | 呼び出し時点の商品情報を返す。本APIはデータを更新しない。 |

---

## DBカラム

テーブル名・列名はec-cube-enterpriseを正とする。

| テーブル | 列 | メモ |
|---------|-----|------|
| 商品（`dtb_product`） | 商品ID・商品名 | 応答の商品情報に用いる。 |
| 商品規格（`dtb_product_class`） | 商品規格ID・商品コード・販売価格・在庫数 | 応答の規格情報に用いる。 |
| カード詳細（`mtb_card_detail`） | カード詳細ID | 取得条件（detailId）に用いる。 |
| カード（`mtb_card`） | カードID・カード名 | 応答のカード情報に用いる。 |
| 商品サブ・商品サブクラス（`dtb_product_sub`／`dtb_product_sub_class`） | 買取用の出し分け列 | 現行はビューを参照。ec-cube-enterpriseでは商品規格系へ再編済みのため要確認。 |

### DB操作

本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | dtb_product / dtb_product_class / dtb_product_sub / dtb_product_sub_class / mtb_card / mtb_card_detail | 検索条件に合致するレコードを抽出する。 |

---

## 権限・認可

| 利用者状態 | 買取用商品情報取得 |
|------------|--------------------|
| クライアント | MTGバイヤー（買取アプリ）から呼び出す。認可方式はpf-apiの方針に従う。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 該当商品なし | ページが見つからない扱い（404）。 |

---

## 排他制御・トランザクション

本APIは参照のみであり、楽観ロック・悲観ロックの対象は持たない。
