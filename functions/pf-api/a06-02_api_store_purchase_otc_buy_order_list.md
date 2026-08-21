# API 店頭買取管理 — 店頭買取受注一覧取得

## 業務ロジック

### 取得対象

店頭買取ステータスが商品到着・査定中・振込前・保留・査定再開のいずれかである店頭買取受注を、受注ID昇順で返す。該当が無い場合は空配列を返す。

### 店舗による絞り込み

認証した管理者会員の会員サブ情報から所属店舗を決める。店舗が得られた場合はその店舗の受注に限定し、会員サブ情報が無い場合は店舗による絞り込みを行わず査定対象の受注を一律に返す。絞り込み対象の店舗はクライアントから指定できない。

### 認証

認証用トークンのヘッダを検証し、その利用者IDから管理者会員を特定する。署名方式はHS256である。ヘッダ欠落・署名不正・該当する管理者会員なしのいずれも認証拒否（HTTP 401）とする。呼び出し可能なクライアントは買取アプリである。トークン原値・署名シークレットは本書に記載しない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 認証不可 | 認証拒否（HTTP 401）とする |
| 受注取得・整形処理中の例外 | 共通例外処理に委ねる（HTTP 500相当） |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 認証用トークンのヘッダのみ。ほかのリクエストパラメータを持たない |
| 成功時出力 | HTTP 200。査定対象の店頭買取受注の配列。ラッパオブジェクトや件数フィールドを持たない。該当が無い場合は空配列 |
| 失敗時出力 | 認証できないときはHTTP 401（本文を持たない）。取得・整形中の例外はHTTP 500として共通例外処理に委ねる |

### 出力: 受注ごとのフィールド

| フィールド | 型 | 説明 |
|------------|----|------|
| `otcBuyOrderId` | integer | 店頭買取受注ID。 |
| `assessmentId` | integer | 査定ID。 |
| `applyDate` | string | 申込日時。ISO8601形式の日時文字列。 |
| `freeComment` | string | 受注に付与されたフリーコメント。未設定の場合はnull。 |
| `memberName` | string | 査定担当者の会員名。紐づく会員が無い場合はnull。 |
| `otcOrderStatusId` | integer | 店頭買取ステータスのID。 |
| `returnSupply` | integer | 返送品の扱いを表す区分値。 |
| `callFlg` | boolean | 連絡要否のフラグ。 |
| `adultFlg` | boolean | 成人区分のフラグ。 |
| `playingFlg` | boolean | プレイ用区分のフラグ。 |
| `orderStatusName` | string | 店頭買取ステータスの名称。 |
| `identificationId` | integer | 本人確認のID。未登録の場合は0。 |
| `qualifiedInvoiceIssuerFlg` | boolean | 適格請求書発行事業者の該当フラグ。 |
| `qualifiedInvoiceIssuerConfirmationFlg` | boolean | 適格請求書発行事業者の確認済みフラグ。 |
| `qualifiedInvoiceIssuerCode` | string | 適格請求書発行事業者の登録番号。紐づく口座が無い場合はnull。 |
| `customerInfo` | object | 申込者情報のオブジェクト。 |
| `customerInfo.firstName` | string | 申込者の名。 |
| `customerInfo.lastName` | string | 申込者の姓。 |
| `customerInfo.birth` | string | 申込者の生年月日。ISO8601形式の日時文字列。 |
| `customerInfo.telNo` | string | 申込者の電話番号。 |
| `customerInfo.zipcode` | string | 申込者の郵便番号。 |
| `customerInfo.jobName` | string | 申込者の職業名。 |
| `customerInfo.address` | string | 申込者の住所。国に応じて都道府県名または国名と住所1・住所2を半角空白区切りで連結した文字列。 |

成功時の応答例（実装確認値に基づく代表値。個人情報は最小限の代表値とする）。

```json
[
  {
    "otcBuyOrderId": 2001,
    "assessmentId": 30001,
    "applyDate": "2026-06-01T11:00:00+09:00",
    "freeComment": null,
    "memberName": "買取担当 太郎",
    "otcOrderStatusId": 6,
    "returnSupply": 0,
    "callFlg": false,
    "adultFlg": true,
    "playingFlg": false,
    "orderStatusName": "査定中",
    "identificationId": 0,
    "qualifiedInvoiceIssuerFlg": false,
    "qualifiedInvoiceIssuerConfirmationFlg": false,
    "qualifiedInvoiceIssuerCode": null,
    "customerInfo": {
      "firstName": "一郎",
      "lastName": "山田",
      "birth": "1990-01-01T00:00:00+09:00",
      "telNo": "0312345678",
      "zipcode": "1000001",
      "jobName": "会社員",
      "address": "東京都 千代田区千代田 1-1"
    }
  }
]
```

### 入出力: 永続化

本APIは業務データを更新しない。

## 表示メッセージ

本APIは画面メッセージを扱わない。
