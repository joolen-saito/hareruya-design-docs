# API 店頭買取管理 — 店頭買取受注一覧取得

## 業務ロジック

### 取得対象

取得対象の買取情報は店頭買取受注IDの昇順で返す。該当が無い場合は空配列を返す。職業または国が紐づいていない受注は、対象ステータスであっても結果に含まれない。

### 店舗による絞り込み

認証した管理者会員に会員サブ情報が無く所属店舗が定まらない場合は、店舗による絞り込みを行わず、取得対象の買取情報を一律に返す。

### 認証

認証用トークンのヘッダを検証し、その利用者IDから管理者会員を特定する。署名方式はHS256である。ヘッダ欠落・署名不正・該当する管理者会員なしのいずれも認証拒否（HTTP 401）とする。トークン原値・署名シークレットは本書に記載しない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 認証不可 | 認証拒否（HTTP 401）とする |
| 受注取得・整形処理中の例外 | 共通例外処理に委ねる（HTTP 500相当） |

## 入出力

### 出力: 値の表し方と未設定時のふるまい

| フィールド | ふるまい |
|------------|----------|
| `applyDate` | ISO8601形式の日時文字列で返す。 |
| `freeComment` | 未設定の場合はnull。 |
| `memberName` | 査定担当者が紐づいていない場合はnull。 |
| `identificationId` | 本人確認が未登録の場合は0。 |
| `qualifiedInvoiceIssuerCode` | 適格請求書発行事業者の口座が紐づいていない場合はnull。 |
| `customerInfo.birth` | ISO8601形式の日時文字列で返す。 |
| `customerInfo.address` | 国が日本のときは都道府県名・住所1・住所2、それ以外の国のときは国名・住所2・住所1 の順に、半角空白区切りで連結した1つの文字列で返す。 |

## 表示メッセージ

本APIは画面メッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 取得対象 | P1 | pf-api:src/Repository/DtbOtcBuyOrderRepository.php:46 |
| 店舗による絞り込み | P1 | pf-api:src/Controller/Admin/OtcBuyOrderController.php:39-42 |
| 認証 | P1 | pf-api:src/Controller/BaseController.php:23 |
| エラー時の扱い | P1 | pf-api:src/Controller/BaseController.php:26 |
| 出力: 値の表し方と未設定時のふるまい | P2 | pf-api:src/Repository/DtbOtcBuyOrderRepository.php:64 |
