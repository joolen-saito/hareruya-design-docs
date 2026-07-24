# 商品管理 — 更新商品規格取得（API）

## 概要

指定期間内に更新された商品規格を取得するAPIである。pf-apiが提供するJSON APIで、SEOや広告などの外部用途で更新分の商品規格をまとめて取得する。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値はpf-apiの更新商品規格取得処理、ルート定義、商品規格を扱うリポジトリを正とする。

本機能のカスタマイズ区分は現行踏襲で、挙動の参照リポはpf-api、DB関連の記述はec-cube-enterpriseを正とする。

対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない。

---

## 本書で扱うこと

- 指定期間内に更新された商品規格の取得
- 件数と結果の応答

---

## 本書で扱わないこと

以下は本書では仕様確定せず、実装または別機能の設計を正とする。

- 商品規格の更新そのもの（商品管理を正とする）
- 取得結果を利用する外部側（SEO・広告等）の仕様

---

## リニューアル移行時の扱い

挙動は現行（pf-api）を正とし、DBスキーマは移行先のec-cube-enterpriseを正とする。現行と移行先で次の差がある。

| 観点 | 現行（pf-api） | 移行先（ec-cube-enterprise） |
|------|----------------|------------------------------|
| 更新日時の絞り込み | 商品`dtb_product`・商品規格`dtb_product_class`の`update_date`で期間絞り込みする。 | 同一スキーマ。`dtb_product.update_date`・`dtb_product_class.update_date`で絞り込む。 |
| 規格の補助列 | カードコンディション・言語・保管コード・スマレジコード等を補助表`dtb_product_sub_class`に分離して持つ。 | 同等の列を商品規格`dtb_product_class`へ統合する（`card_condition_id`・`language_id`・`smaregi_product_code`等）。補助表は持たない。 |
| カテゴリ・画像 | 応答の`categoryId`・`imageFileName`は商品カテゴリ・商品画像の各表を連結して返す。 | 同一スキーマ。商品カテゴリ`dtb_product_category`・商品画像`dtb_product_image`から連結する。 |

応答フィールドの命名（camelCase）は移行後も挙動仕様としてpf-apiを正とする。

---

## 用語

| 用語 | 説明 |
|------|------|
| 商品規格 | 商品に紐づく規格単位。 |
| 更新期間 | 取得対象を絞る更新日時の範囲。 |

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| 更新商品規格の取得 | `GET /updateProducts/{strFromDate}/{strToDate}` | 指定期間内に更新された商品規格を、件数とともにJSONで返す。 |

応答形式はJSON。

---

## 処理フロー

### 更新商品規格を取得する（GET `/updateProducts/{strFromDate}/{strToDate}`）

1. パスの開始日・終了日を受け取る。
2. 開始日を当日0時0分0秒、終了日を当日23時59分59秒として期間を組み立てる。
3. 商品規格のリポジトリから、更新日時が当該期間内の商品規格を取得する。
4. 件数（`count`）と結果（`result`）をJSONで返す。

大量件数に備えてメモリ上限を引き上げて処理する。

---

## 集計条件

| 指標 | 集計の要点 |
|------|------------|
| 取得対象 | 更新日時が指定期間（開始日0時〜終了日23時59分59秒）内の商品規格。 |
| 応答 | 件数と結果一覧を返す。 |

---

## 入出力

### リクエスト

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `strFromDate` | パス | string | 必須 | 取得期間の開始日。当日0時0分0秒に丸めて期間下限とする。日時として解釈できる文字列を渡す。 |
| `strToDate` | パス | string | 必須 | 取得期間の終了日。当日23時59分59秒に丸めて期間上限とする。日時として解釈できる文字列を渡す。 |

商品情報・商品規格のいずれかの更新日時が当該期間内にある商品規格を取得対象とする。

### レスポンス（成功）

HTTP 200。

| フィールド | 型 | 説明 |
|------------|----|------|
| `count` | integer | 取得した商品規格の件数。 |
| `result` | array | 商品規格行の配列。各要素は以下のフィールドを持つオブジェクト。0件のときは空配列。 |
| `result[].productId` | integer | 商品ID。 |
| `result[].productCode` | string | 商品コード。 |
| `result[].name` | string | 商品の日本語名。 |
| `result[].nameEn` | string | 商品の英語名。 |
| `result[].descriptionDetail` | string | 商品説明（詳細）。 |
| `result[].descriptionDetailEn` | string | 商品説明（詳細・英語）。 |
| `result[].statusId` | integer | 商品ステータスのID。 |
| `result[].statusName` | string | 商品ステータスの名称。 |
| `result[].stock` | string | 在庫数。 |
| `result[].price02` | string | 販売価格列の値。 |
| `result[].imageFileName` | string | 商品画像ファイル名を連結した文字列（カンマ区切り）。 |
| `result[].categoryId` | string | カテゴリIDを連結した文字列（カンマ区切り）。 |
| `result[].categoryName` | string | カテゴリ名を連結した文字列（カンマ区切り）。 |
| `result[].strageCodeId` | integer | 保管コードのID。未設定のときはnull。 |
| `result[].storageCodeName` | string | 保管コードの名称。未設定のときはnull。 |
| `result[].languageCode` | string | 言語コード。未設定のときはnull。 |
| `result[].cardsetCode` | string | カードセットのコード。未設定のときはnull。 |
| `result[].cardConditionCode` | string | カード状態のコード。未設定のときはnull。 |
| `result[].productClassUpdateDate` | string | 商品規格の更新日時。 |
| `result[].productUpdateDate` | string | 商品情報の更新日時。 |

### レスポンス（失敗）

本APIは期間に該当が無い場合もエラーとせず、HTTP 200で`count`が0・`result`が空配列の応答を返す。専用の失敗ステータスは返さない。

### サンプルレスポンス

成功時の応答例（実装確認値に基づく代表値）。

```json
{
  "count": 1,
  "result": [
    {
      "productId": 30001,
      "productCode": "P-40001",
      "name": "サンプル商品",
      "nameEn": "Sample Product",
      "descriptionDetail": "商品説明",
      "descriptionDetailEn": "Product description",
      "statusId": 1,
      "statusName": "公開",
      "stock": "5",
      "price02": "300",
      "imageFileName": "30001.jpg",
      "categoryId": "10,20",
      "categoryName": "カテゴリA,カテゴリB",
      "strageCodeId": null,
      "storageCodeName": null,
      "languageCode": "JP",
      "cardsetCode": "SET",
      "cardConditionCode": "NM",
      "productClassUpdateDate": "2026-06-01T10:00:00+09:00",
      "productUpdateDate": "2026-06-01T10:00:00+09:00"
    }
  ]
}
```

### 副作用

無し（参照のみ）。大量件数に備え、処理中はメモリ上限を引き上げる。

応答はJSON応答整形を経て返す。プロパティはcamelCase、日時はISO8601とする。

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| A02-05-MSG-002 | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | Sorry, we are unable to delete %name%, because it has related data. | 規格CSV登録で、削除指定した規格が使用中で削除できないとき | 規格CSV登録画面に留まる |
| A02-05-MSG-003 | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | Sorry, we are unable to delete %name%, because it has related data. | 規格CSV登録で、削除指定した規格分類が使用中で削除できないとき | 規格分類CSV登録画面に留まる |

## 業務ルール・計算

- 更新対象はリクエストで指定されたIDと認証・権限条件で特定できる既存レコードに限定する。
- 入力値は既存バリデーション、状態遷移可否、店舗・支店条件を満たす場合のみ保存する。
- 金額・ポイント・数量など派生値が関係する場合は既存サービスの計算結果を正とし、API層で独自の丸め・補正を行わない。
- 検証エラー、対象なし、権限不足、状態不整合では保存せず、既存のエラー形式で返す。

## データ整合性

| 観点 | 内容 |
|------|------|
| 参照時点 | 呼び出し時点で当該期間に更新された商品規格を返す。本APIはデータを更新しない。 |

---

## DBカラム

移行先（ec-cube-enterprise）の名称を主とし、現行（pf-api）の配置が異なる場合は括弧で添える。

| テーブル | 列 | メモ |
|---------|-----|------|
| 商品規格`dtb_product_class` | `update_date`・`product_code`・`price02`・`card_condition_id`・`language_id`・`smaregi_product_code`（現行は補助列を補助表`dtb_product_sub_class`に持つ） | 期間絞り込み・応答内容に使用する。 |
| 商品`dtb_product` | `update_date`・`name`・`name_en`・商品説明（詳細）各列 | 期間絞り込み・応答内容に使用する。 |
| 在庫`dtb_product_stock` | 在庫数 | 応答の`stock`に使用する。 |
| 商品カテゴリ`dtb_product_category`・商品画像`dtb_product_image` | カテゴリID・画像ファイル名 | 応答の`categoryId`・`imageFileName`の連結に使用する。 |

### DB操作

永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_product / dtb_product_category / dtb_product_class / dtb_product_image / dtb_product_stock / dtb_product_sub_class | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## 権限・認可

| 利用者状態 | 更新商品規格取得 |
|------------|------------------|
| クライアント | クライアントから呼び出す。認可方式はpf-apiの方針に従う。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 期間に該当なし | 件数0・空の結果を返す。 |

---

## 排他制御・トランザクション

本APIは参照のみであり、楽観ロック・悲観ロックの対象は持たない。
