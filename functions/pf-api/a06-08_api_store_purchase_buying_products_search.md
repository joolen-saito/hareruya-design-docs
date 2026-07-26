# API 店頭買取管理 — カード名から買取用商品情報を取得

## 概要

検索クエリ（カード名等のパラメータ）から、買取に用いる商品情報を取得するAPIである。pf-apiが提供するJSON APIで、MTGバイヤー（買取アプリ）から呼ばれる。取得結果はカードの索引付きでまとめて返す。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値はpf-apiの買取用商品検索処理、ルート定義、商品を扱うリポジトリを正とする。カスタマイズ区分は現行踏襲で、挙動の参照リポはpf-api、DB関連はec-cube-enterpriseを正とする。

対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない。

---

## 本書で扱うこと

- 検索クエリ（カード名等）による買取用商品情報の取得
- 索引付きの応答整形
- 該当が無い場合の応答

---

## 本書で扱わないこと

以下は本書では仕様確定せず、実装または別機能の設計を正とする。

- カード詳細ID・商品IDリストによる買取用商品取得（各APIを正とする）
- 検索条件の項目仕様（実装を確認値とする）

---

## リニューアル移行時の扱い

DB関連はec-cube-enterpriseを正とする。商品（`dtb_product`）・商品規格（`dtb_product_class`）・カード（`mtb_card`）・カード詳細（`mtb_card_detail`）はec-cube-enterpriseに同名で実在する。一方、現行（pf-api）が参照する商品サブ（`dtb_product_sub`）・商品サブクラス（`dtb_product_sub_class`）のビューと商品サブクラス画像（`dtb_product_sub_class_image`）は、ec-cube-enterpriseでは商品規格・商品規格画像（`dtb_product_class_image`）系へ再編されており同名ビューを確認できない。商品名の前方一致検索と買取用の出し分けに用いる該当テーブル・列はec-cube-enterprise実装で要確認とする。挙動（検索条件・索引付け・該当なし時の応答）は現行（pf-api）を正とする。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| カード名から買取用商品情報取得 | `GET /search`（クエリパラメータで条件指定） | 条件に一致する買取用商品情報を、カードの索引付きでJSONで返す。該当が無い場合は404を返す。 |

応答形式はJSON。MTGバイヤーから呼ばれる。

---

## 処理フロー

### 買取用商品情報を検索取得する（GET `/search`）

1. クエリパラメータの検索条件（カード名等）を受け取る。
2. 商品のリポジトリから、条件に一致する買取用商品を取得する。
3. 取得結果が空の場合はページが見つからない扱い（404）とする。
4. 取得できた場合は、カードの一覧を1始まりの索引で整形してJSONで返す。

---

## 集計条件

| 指標 | 集計の要点 |
|------|------------|
| 取得対象 | クエリパラメータ（カード名等）の条件に一致する買取用商品。 |
| 応答整形 | カードの一覧を1始まりの索引付きで返す。 |

---

## 入出力

### リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `name` | クエリ | string | 任意 | カード名（商品名）の前方一致検索キー。商品名がこの値で始まる買取用商品を取得する。`%`と`_`はエスケープして扱う。 |

`name`は@QueryParam（パラメータフェッチャ）で受け取る。既定値・必須指定・書式制約はいずれも実装で定義していない。

### レスポンス（成功）

HTTP 200。

応答は`cards`オブジェクトを最上位に持つ。検索で得たカードを1始まりの連番でキー付けし直して格納する。各カードの配下はカード詳細ID（`details`）、言語コード（`languageClasses`）、状態コード（`conditionClasses`）の順で入れ子になる。

| フィールド | 型 | 説明 |
|------------|----|------|
| `cards` | object | 1始まりの連番をキーとするオブジェクト。値は各カードの情報。 |
| `cards.<n>.cardNameJp` | string | カードの日本語名。 |
| `cards.<n>.cardNameEn` | string | カードの英語名。 |
| `cards.<n>.imageFileName` | string | カード画像のファイル名。 |
| `cards.<n>.details` | object | カード詳細IDをキーとするオブジェクト。値は各カード詳細の情報。 |
| `cards.<n>.details.<detailId>.cardsetCode` | string | カードセットのコード。カードセット未設定のときはnull。 |
| `cards.<n>.details.<detailId>.cardsetName` | string | カードセットの日本語名。カードセット未設定のときはnull。 |
| `cards.<n>.details.<detailId>.foilFlg` | boolean | フォイルか否か。 |
| `cards.<n>.details.<detailId>.cardNo` | string | カード番号。 |
| `cards.<n>.details.<detailId>.promotionName` | string | プロモーションの日本語名。プロモーション未設定のときはnull。 |
| `cards.<n>.details.<detailId>.productId` | integer | 商品ID。 |
| `cards.<n>.details.<detailId>.productNameJp` | string | 商品の日本語名。 |
| `cards.<n>.details.<detailId>.productNameEn` | string | 商品の英語名。 |
| `cards.<n>.details.<detailId>.rarityCode` | string | レアリティのコード。 |
| `cards.<n>.details.<detailId>.storageCodeName` | string | 保管コードの名称。未設定のときはnull。 |
| `cards.<n>.details.<detailId>.languageClasses` | object | 言語コードをキーとするオブジェクト。 |
| `cards.<n>.details.<detailId>.languageClasses.<languageCode>.conditionClasses` | object | 状態コードをキーとするオブジェクト。値は商品規格単位の情報。 |
| `…conditionClasses.<conditionCode>.productClassId` | integer | 商品規格ID。 |
| `…conditionClasses.<conditionCode>.productCode` | string | 商品コード。 |
| `…conditionClasses.<conditionCode>.buyPrice` | integer | 買取価格。未設定のときはnull。 |
| `…conditionClasses.<conditionCode>.price` | string | 販売価格（販売価格列の値）。 |
| `…conditionClasses.<conditionCode>.stock` | string | 在庫数。 |
| `…conditionClasses.<conditionCode>.sectionId` | integer | 部門ID。未設定のときはnull。 |

ページング用の件数フィールド（`total_count`・`per_page`等）は持たない。

### レスポンス（失敗）

| HTTPステータス | 条件 | 本文の形 |
|----------------|------|----------|
| 404 | 条件に一致する買取用商品が無い | 標準の例外応答（メッセージを含むJSON） |

### サンプルレスポンス

成功時の応答例（実装確認値に基づく代表値）。

```json
{
  "cards": {
    "1": {
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

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| A06-08-MSG-001 | API応答JSON（errors配列） | 認証エラー | （英訳なし） | カード名検索時にログインユーザーがMemberでない | MTGバイヤー側で認証を行い再試行する |

## 業務ルール・計算

- 検索・一覧・取得条件はリクエストパラメータ、ログイン状態、公開状態、店舗・支店条件、既存リポジトリの絞り込み順序を正とする。
- 件数、ページ番号、表示順は既存実装のデフォルトと上限に従い、取得後に業務値を再計算しない。
- 金額、ポイント、数量、ステータス、日時はDBまたは連携元の永続化済み値を返却し、レスポンス生成時の丸め・補正は行わない。
- 条件に一致しない、権限がない、または非公開のデータは空結果または既存のエラー形式で返す。

## データ整合性

| 観点 | 内容 |
|------|------|
| 参照時点 | 呼び出し時点の商品情報を返す。本APIはデータを更新しない。 |

---

## DBカラム

テーブル名・列名はec-cube-enterpriseを正とする。

| テーブル | 列 | メモ |
|---------|-----|------|
| 商品（`dtb_product`） | 商品ID・商品名 | 商品名の前方一致検索・応答の商品情報に用いる。 |
| 商品規格（`dtb_product_class`） | 商品規格ID・商品コード・販売価格・在庫数 | 応答の規格情報に用いる。 |
| カード詳細（`mtb_card_detail`） | カード詳細ID | 応答のカード詳細情報に用いる。 |
| カード（`mtb_card`） | カードID・カード名 | 応答のカード情報・索引付けに用いる。 |
| 商品サブ・商品サブクラス（`dtb_product_sub`／`dtb_product_sub_class`） | 検索・買取用の出し分け列 | 現行はビューを参照。ec-cube-enterpriseでは商品規格系へ再編済みのため要確認。 |

### DB操作

本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | dtb_product / dtb_product_class / dtb_product_sub / dtb_product_sub_class / mtb_card / mtb_card_detail | 検索条件に合致するレコードを抽出する。 |

---

## 権限・認可

| 利用者状態 | カード名から買取用商品情報取得 |
|------------|--------------------------------|
| クライアント | MTGバイヤー（買取アプリ）から呼び出す。認可方式はpf-apiの方針に従う。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 該当商品なし | ページが見つからない扱い（404）。 |

---

## 排他制御・トランザクション

本APIは参照のみであり、楽観ロック・悲観ロックの対象は持たない。
