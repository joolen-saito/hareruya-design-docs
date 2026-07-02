# スマレジAPI・関連機能抜粋設計書

## 概要

本書はpf-eccube3リポジトリのHareruyaEcプラグインと、ec-cube-enterpriseの新規スマレジ在庫連携から、スマレジAPI連携およびスマレジ連携に直接関係する機能だけを抜粋した横断リバース詳細設計である。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むための設計書とする。確認値はpf-eccube3のスマレジ受信API、スマレジ向け送信処理、スマレジ系バッチ、会員・受注・ポイントのスマレジ連携呼び出し元、およびec-cube-enterpriseのスマレジWebhook受信・在庫連携実装を正とする。

ec-cube-enterpriseで新規実装される在庫系スマレジ連携は、基本設計仕様書（Excel）と個別設計書A01-01/A01-02を正とし、本書では横断把握に必要な入口、連携方式、DB接続点だけを扱う。管理画面・フロント画面の全項目仕様は扱わず、スマレジ連携へ入る入口と副作用に絞る。

---

## 本書で扱うこと

- スマレジ取引通知を受けるAPI
- スマレジへ商品・在庫・商品削除を送信する処理
- スマレジへ会員登録・会員更新・会員停止・会員参照・ポイント更新を送信する処理
- スマレジ取引参照APIを呼び、未反映のポイント取引を補正する処理
- スマレジ連携失敗を再実行するバッチ
- スマレジとEC側ポイントの差分を検出・補正するバッチ
- pf-eccube3内でスマレジ連携を呼び出す主な入口
- ec-cube-enterpriseで新規実装される在庫系スマレジWebhook受信、個別API連携、Patch一括連携、Webhookエラー再連携の接続点

---

## 本書で扱わないこと

以下は本書では仕様確定せず、個別機能または外部システムの設計を正とする。

- スマレジ本体のAPI仕様、認証仕様、レスポンス仕様の全量
- EC-CUBE側の会員登録、会員編集、退会、受注登録、購入完了、ポイント統合画面の画面項目全量
- スマレジ連携設定値の登録画面
- ジョブスケジューラ、cron、監視設定などの運用設定
- ec-cube-enterpriseへ移行後のスマレジ連携実装全量。ただし、在庫系スマレジ連携の入口とDB接続点は本書で扱う。

---

## 抜粋対象機能

| 機能No | 機能名 | 種別 | 入口 | 役割 |
|--------|--------|------|--------------------|------|
| A01-01 | スマレジ連携処理 | API / 新規実装 | `POST /smaregi/stocks`、`POST /%eccube_smaregi_webhook_route%`（既定`smaregi/webhook`） | スマレジの在庫変動Webhook、管理画面操作による在庫個別連携、CSV等のPatch一括連携を扱う。 |
| A01-02 | スマレジwebhook連携エラー再連携 | API / 新規実装 | Step Functions等のスケジュール起動、スマレジプラットフォームAPI | Webhook失敗分のスマレジ在庫変動履歴を再取得し、未連携分を再処理する。 |
| A05-04 | スマレジ受信処理 | API | `POST /{_locale}/smaregi/transaction` | スマレジ取引通知を受け、会員ポイント・ポイント履歴・対象注文の出荷完了を更新する。 |
| B05-04 | スマレジ商品再連携 | バッチ | `order:batch resendSmaregiProduct` | 店頭注文受注の未連携商品・在庫をスマレジへ再送信する。 |
| B05-05 | スマレジ商品削除 | バッチ | `order:batch deleteSmaregiProduct` | 手続き完了後の店頭注文をスマレジ商品から削除する。 |
| B05-08 | スマレジEC受注連携エラー再連携 | バッチ | `smaregi:batch checkSmaregiErrorOrder` | スマレジポイント連携エラーの受注を再連携する。 |
| B05-09 | スマレジ取引連携エラー再連携 | バッチ | `smaregi:batch checkSmaregiTransaction` | スマレジ取引参照APIで取引を取得し、未反映・未取消のポイント履歴を補正する。 |
| B08-05 | ポイント差分発生通知 | バッチ | `customer:batch adjustPointVariance` | 保有ポイントとポイント履歴合計の差分を補正し、管理者へ通知する。 |
| B08-06 | スマレジ使用ポイント連携 | バッチ | `smaregi:batch updatePoint <受注ID>` | 指定受注で使用したポイントをスマレジへ減算連携する。 |
| - | スマレジ会員一括作成 | 運用バッチ | `smaregi:batch createCustomer <開始プレイヤーID> <終了プレイヤーID>` | スマレジID未設定の会員へ新規スマレジIDを採番し、スマレジ会員を登録する。 |
| - | スマレジ会員存在確認 | 運用バッチ | `smaregi:batch checkCustomer <開始プレイヤーID> <終了プレイヤーID>` | EC側に保持するスマレジIDがスマレジ側に存在するか確認し、存在しなければスマレジIDを初期化する。 |
| - | 会員登録・更新・退会・ポイント統合 | 機能内連携 | 会員登録、会員編集、退会、ポイント統合、管理者アカウント操作 | 会員情報をスマレジへ登録・更新・停止する。 |

---

## 利用者視点の入口

| 入口 | URLエンドポイントまたは実行方法 | 期待されるふるまい |
|------|--------------------------------|--------------------|
| スマレジ在庫変動Webhookの受信 | `POST /%eccube_smaregi_webhook_route%`（既定`smaregi/webhook`） | スマレジWebhookの契約ID、イベント、アクション、リクエスト本文を受け付け、スマレジWebhook受信テーブルへ記録し、在庫連携処理へ接続する。 |
| スマレジ在庫変動をEC-CUBEへ反映する | `POST /smaregi/stocks` | スマレジ在庫変動履歴をもとに、売上は出庫、返品は入庫としてEC-CUBE側のスマレジ在庫と在庫履歴を更新する。 |
| スマレジWebhook連携エラーを再実行する | Step Functions等のスケジュール起動 | Webhook失敗または未連携のスマレジ在庫変動履歴を検索し、スマレジ連携処理と同等の処理を再実行する。 |
| スマレジ取引通知の受信 | `POST /{_locale}/smaregi/transaction` | 取引ヘッダ・明細を受け取り、会員ポイントとポイント履歴を更新し、自店舗の商品明細に該当する注文を出荷完了にする。支店商品明細は支店システムへ転送する。 |
| 店頭注文の商品・在庫を再連携する | `order:batch resendSmaregiProduct` | スマレジ商品連携または在庫連携が未完了の受注を抽出し、未完了区分だけをスマレジへ再送信する。 |
| 店頭注文の商品をスマレジから削除する | `order:batch deleteSmaregiProduct` | 削除対象の店頭注文を抽出し、スマレジへ商品削除区分で送信する。 |
| EC受注のポイント連携エラーを再実行する | `smaregi:batch checkSmaregiErrorOrder` | 連携エラーの受注を抽出し、会員の現在ポイントをスマレジへ同期する。成功したらエラーフラグを解除する。 |
| スマレジ取引を参照して未反映取引を補正する | `smaregi:batch checkSmaregiTransaction` | 直近期間のスマレジ取引を取得し、未登録取引のポイント履歴登録、取消・打消取引のポイント履歴削除を行う。 |
| スマレジ使用ポイントを連携する | `smaregi:batch updatePoint <受注ID>` | 指定受注の使用ポイントをスマレジへ減算連携する。失敗時は受注側へエラーを記録する。 |
| ポイント差分を補正して通知する | `customer:batch adjustPointVariance` | 保有ポイントとポイント履歴合計に差がある会員の保有ポイントを補正し、差分一覧を管理者へ通知する。 |
| スマレジ会員を一括作成する | `smaregi:batch createCustomer <開始プレイヤーID> <終了プレイヤーID>` | 指定範囲のスマレジID未設定会員にスマレジIDを採番し、スマレジへ会員登録する。 |
| スマレジ会員の存在を確認する | `smaregi:batch checkCustomer <開始プレイヤーID> <終了プレイヤーID>` | 指定範囲の未検証会員についてスマレジ会員参照を行い、存在すれば確認済みにし、存在しなければスマレジIDを空に戻す。 |

---

## 外部API区分

| 連携先処理 | スマレジ処理名 | 送信タイミング | 主な内容 |
|------------|----------------|----------------|----------|
| 在庫変動Webhook受信 | スマレジプラットフォームWebhook | スマレジ側の取引完了、取引全キャンセル、在庫変動時 | 契約ID、イベント、アクション、在庫変動履歴IDリストを受け、EC-CUBE側のスマレジ在庫更新へ接続する。 |
| 在庫変動履歴取得 | スマレジプラットフォームAPI | Webhook受信後、またはWebhookエラー再連携時 | 在庫変更履歴ID、商品ID、店舗IDをもとにスマレジ在庫変動履歴を取得する。 |
| 在庫相対値更新 | スマレジプラットフォームAPI | EC-CUBE管理画面の在庫編集、一括編集、移動・分割結合等 | スマレジ在庫に対する個別の相対値更新を送信する。 |
| 在庫一括相対値更新 | スマレジプラットフォームAPI | CSV登録、棚卸し、件数上限超過時の一括処理 | Patch一括方式でスマレジ在庫更新データを登録し、非同期結果を受ける。 |
| 取引通知受信 | - | スマレジからECへの通知 | 取引ヘッダ・取引明細を受け、ポイントと注文状態を更新する。 |
| 商品更新 | `product_upd` | 店頭注文の商品連携、再連携 | 商品ID・商品コード・商品名・価格・部門ID・税区分を送信する。 |
| 商品削除 | `product_upd` | 店頭注文完了後の商品削除 | 処理区分を削除にして商品IDを送信する。 |
| 在庫更新 | `stock_upd` | 店頭注文の在庫連携、再連携 | 店舗ID・商品ID・在庫数1・在庫区分15を送信する。 |
| 会員参照 | `customer_ref` | スマレジID採番時の重複確認、既存会員確認、会員存在確認 | スマレジ会員IDまたは会員コードで会員を検索する。 |
| 会員登録・更新・削除・停止 | `customer_upd` | 会員登録、会員編集、退会、ポイント統合、一括会員作成 | スマレジ会員情報を登録・更新・削除・利用停止にする。 |
| ポイント更新 | `point_upd` | 使用ポイント連携、付与ポイント連携、連携エラー再実行 | 絶対値同期または相対増減でスマレジ会員ポイントを更新する。 |
| 取引参照 | `transaction_ref` | スマレジ取引連携エラー再連携 | 直近期間の取引ヘッダを取得し、EC側ポイント履歴との差分を補正する。 |

---

## APIリクエスト・レスポンス詳細

### スマレジAPI送信の共通仕様

pf-eccube3からスマレジへ送信するAPIは、処理名が異なっても送信形式は共通である。

| 項目 | 内容 |
|------|------|
| HTTPメソッド | `POST` |
| 送信先URL | `smaregi_request_url`設定値 |
| Content-Type | `application/x-www-form-urlencoded;charset=UTF-8` |
| 契約IDヘッダ | `X_contract_id: <smaregi_contract_id>` |
| アクセストークンヘッダ | `X_access_token: <smaregi_access_token>` |
| フォーム項目 | `proc_name=<処理名>&params=<JSON文字列>` |
| 成功判定 | 応答JSONに`result`キーが存在すること |
| 失敗判定 | cURL結果が空、JSONとして解釈できない、または応答JSONに`result`キーが存在しないこと |

送信する`params`は処理ごとにJSONを組み立て、フォーム値として送信する。実装上はURLエンコードを必ずしも明示していない箇所があるため、呼び出し側のHTTPクライアント仕様に依存しないよう、設計上はフォーム値として安全に送信できる文字列にする。

### スマレジ在庫変動Webhook受信API

ec-cube-enterpriseで新規実装される在庫系スマレジ連携では、スマレジからのWebhook受信を起点に在庫変動履歴を取得し、EC-CUBE側のスマレジ在庫へ反映する。

| 項目 | 内容 |
|------|------|
| EC側エンドポイント | `POST /%eccube_smaregi_webhook_route%`（既定`smaregi/webhook`） |
| Excel設計上のエンドポイント | `POST /smaregi/stocks` |
| 呼び出し元 | スマレジプラットフォームWebhook、またはスマレジ在庫連携処理の呼び出し元 |
| 認証・制限 | Excel設計ではIP制限あり。実装上の署名・認可・ルート設定はec-cube-enterpriseを正とする。 |
| リクエスト形式 | JSON |
| レスポンス形式 | Excel設計ではステータスコードのみ。実装レスポンスはec-cube-enterpriseを正とする。 |

Webhook受信データは次の内容を持つ。

| 項目 | 内容 |
|------|------|
| 契約ID | スマレジ契約ID。 |
| イベント名 | `pos:stock`など、スマレジ側イベントを示す。 |
| アクション | `edited`、`bulk-update`など、更新または一括更新を示す。 |
| 在庫変動履歴IDリスト | 在庫変更履歴ID、商品ID、店舗IDを1組にした配列。 |

受信したWebhookは、ec-cube-enterpriseのスマレジWebhook受信テーブルへ記録する。記録後、スマレジ在庫変動履歴を取得し、在庫区分が`02:取引`の場合は出庫、`12:返品`の場合は入庫としてEC-CUBE側のスマレジ在庫を更新する。店頭受取分の商品IDや、対象外の在庫変動区分は更新対象外とする。

### スマレジWebhook連携エラー再連携

Webhookで連携に失敗した、またはEC-CUBE側に未登録のスマレジ在庫変動履歴は、A01-02で再連携する。

| 項目 | 内容 |
|------|------|
| 起動方式 | Step Functions等のスケジュール起動。Excel設計上は毎時16分を確認値とする。 |
| 入力データ元 | スマレジプラットフォームAPI。 |
| 対象期間 | バッチ駆動時刻から指定時間前まで。Excel設計では5時間前までを確認値とするが、実行頻度・エラー率・運用時間で可変にする。 |
| 対象条件 | 在庫変動区分が`02:取引`または`12:返品`、EC-CUBE側に在庫変動履歴IDが未登録、店頭受取データではない。 |
| 成功時 | スマレジ連携処理A01-01のWebhook方式と同等の処理が完了した状態にする。 |

### スマレジ取引通知受信API

| 項目 | 内容 |
|------|------|
| EC側エンドポイント | `POST /{_locale}/smaregi/transaction` |
| 呼び出し元 | スマレジ、または支店システムからの転送 |
| Content-Type | `application/x-www-form-urlencoded;charset=UTF-8`想定 |
| リクエスト項目 | `params` |
| `params`形式 | JSON文字列 |
| 認証情報 | 支店転送時のみ`X_contract_id`、`X_access_token`を引き継ぐ |

リクエストの基本構造は次のとおりである。

```json
{
  "data": [
    {
      "table_name": "TransactionHead",
      "rows": [
        {
          "transactionHeadId": "取引ID",
          "cancelDivision": "取消区分",
          "disposeDivision": "打消区分",
          "disposeServerTransactionHeadId": "打消元取引ID",
          "customerId": "スマレジ会員ID",
          "newPoint": "付与ポイント",
          "spendPoint": "使用ポイント"
        }
      ]
    },
    {
      "table_name": "TransactionDetail",
      "rows": [
        {
          "productCode": "商品コード"
        }
      ]
    }
  ]
}
```

取引ヘッダは`table_name = TransactionHead`、取引明細は`table_name = TransactionDetail`として判定する。実装で参照する主な項目は次のとおりである。

| テーブル | 項目 | 用途 |
|----------|------|------|
| `TransactionHead` | `transactionHeadId` | ポイント履歴のスマレジ取引IDとして登録・取消照合に使用する。 |
| `TransactionHead` | `cancelDivision` | 取消取引かどうかを判定する。 |
| `TransactionHead` | `disposeDivision` | 打消レコードかどうかを判定する。 |
| `TransactionHead` | `disposeServerTransactionHeadId` | 打消元取引IDとしてポイント履歴削除に使用する。 |
| `TransactionHead` | `customerId` | EC会員のスマレジID検索に使用する。 |
| `TransactionHead` | `newPoint` | 付与ポイントとして会員ポイント・ポイント履歴に反映する。 |
| `TransactionHead` | `spendPoint` | 使用ポイントとして会員ポイント・ポイント履歴に反映する。 |
| `TransactionDetail` | `productCode` | 店舗判定および対象受注検索に使用する。 |

`productCode`の4文字目から3文字分を店舗IDとして扱い、`smaregi_store_id`を3桁ゼロ埋めした値と一致する場合だけ自EC側で出荷完了更新を行う。一致しない明細は支店システムへ転送する。

レスポンスはJSONで返す。

```json
{
  "result": [
    {
      "TransactionHead": 1
    }
  ]
}
```

| レスポンス項目 | 内容 |
|----------------|------|
| `result[0].TransactionHead` | EC側で更新した取引ヘッダ件数と支店転送先の更新件数の合算値。 |
| HTTPステータス | 正常時は`200`。実装上、業務エラーも例外化されない限り同じJSON形式で返る。 |
| レスポンスヘッダ | `Content-Type: application/json;charset=UTF-8`、`Cache-Control: no-store`、`Pragma: no-cache`、`Access-Control-Allow-Origin: *` |

### 支店システムへの取引通知転送

自店舗以外の商品明細を含む場合、受信した取引通知の一部を支店システムへ転送する。

| 項目 | 内容 |
|------|------|
| 送信先URL | `hareruya_ec.config.api.branch_api_url` + `hareruya_ec.config.api.endpoint_smaregi_transaction` |
| HTTPメソッド | `POST` |
| フォーム項目 | `proc_name=<処理名>&params=<転送用JSON>` |
| 転送ヘッダ | 受信リクエストの`X_contract_id`、`X_access_token`を引き継ぐ |
| Content-Type | `application/x-www-form-urlencoded;charset=UTF-8` |

転送用JSONは、元リクエストから`TransactionHead`と支店対象の`TransactionDetail`だけを残した構造にする。支店レスポンスに`result[0].TransactionHead`がある場合、その値をEC側更新件数へ加算する。

### 商品更新API `product_upd`

店頭注文をスマレジ商品として登録・更新する場合は、`proc_division = U`で送信する。

```json
{
  "proc_info": {
    "proc_division": "U"
  },
  "data": [
    {
      "table_name": "Product",
      "rows": [
        {
          "productId": "スマレジ商品ID",
          "categoryId": "スマレジ部門ID",
          "productCode": "スマレジ商品ID",
          "productName": "注文番号/注文者または店頭注文名",
          "price": 1000,
          "taxFreeDivision": "1"
        }
      ]
    }
  ]
}
```

| 項目 | 設定内容 |
|------|----------|
| `productId` | 受注拡張情報のスマレジコード。 |
| `categoryId` | `smaregi_category_id`設定値。 |
| `productCode` | `productId`と同じスマレジコード。 |
| `productName` | `注文番号/店頭注文: <待ち番号> のご注文`、または`注文番号/ <購入者カナ> 様のご注文`。 |
| `price` | 通常は支払合計。店頭受取系配送の場合は`0`。 |
| `taxFreeDivision` | 固定値`1`。 |

応答JSONに`result`が存在すれば成功とし、当該受注のスマレジ商品連携済みフラグを更新する。`result`が存在しない場合は、エラーメール送信対象とし、連携済みフラグは更新しない。

### 商品削除API `product_upd`

手続き完了後の店頭注文をスマレジ商品から削除する場合は、同じ`product_upd`へ削除区分で送信する。

```json
{
  "proc_info": {
    "proc_division": "D"
  },
  "data": [
    {
      "table_name": "Product",
      "rows": [
        {
          "productId": "スマレジ商品ID"
        }
      ]
    }
  ]
}
```

成功判定は商品更新と同じく`result`キーの有無で行う。成功した場合だけスマレジ商品削除済みフラグを更新する。

### 在庫更新API `stock_upd`

店頭注文の商品をスマレジ在庫として有効化する場合は、`stock_upd`へ送信する。

```json
{
  "proc_info": {
    "proc_division": "U",
    "proc_detail_division": "1"
  },
  "data": [
    {
      "table_name": "Stock",
      "rows": [
        {
          "storeId": "店舗ID",
          "productId": "スマレジ商品ID",
          "stockAmount": 1,
          "stockDivision": 15
        }
      ]
    }
  ]
}
```

| 項目 | 設定内容 |
|------|----------|
| `storeId` | `smaregi_store_id`設定値。 |
| `productId` | 受注拡張情報のスマレジコード。 |
| `stockAmount` | 固定値`1`。 |
| `stockDivision` | 固定値`15`。 |

成功した場合だけスマレジ在庫連携済みフラグを更新する。

### 会員参照API `customer_ref`

スマレジ会員の重複確認、存在確認、旧会員検索では`customer_ref`を使用する。

```json
{
  "fields": [
    "customerId",
    "customerCode",
    "lastName",
    "firstName",
    "point",
    "pointExpireDate"
  ],
  "conditions": [
    {
      "customerId": "スマレジ会員ID",
      "customerCode": "スマレジ会員コード"
    }
  ],
  "table_name": "Customer"
}
```

| 項目 | 内容 |
|------|------|
| `fields` | EC側で参照する会員ID、会員コード、氏名、ポイント、有効期限を指定する。 |
| `conditions.customerId` | スマレジIDで検索する場合に指定する。 |
| `conditions.customerCode` | スマレジ会員コードで検索する場合に指定する。 |
| `table_name` | 固定値`Customer`。 |

応答に`result`があり、対象会員が存在する場合はEC側のスマレジID確認済みフラグや会員更新処理を進める。存在しない場合、存在確認バッチではEC側スマレジIDを空に戻す。

### 会員登録・更新API `customer_upd`

会員登録・会員編集・会員ランク更新・一括会員作成では、`customer_upd`へ更新区分で送信する。

```json
{
  "proc_info": {
    "proc_division": "U"
  },
  "data": [
    {
      "table_name": "Customer",
      "rows": [
        {
          "customerId": "スマレジ会員ID",
          "customerNo": "スマレジ会員ID",
          "customerCode": "スマレジ会員コード",
          "lastName": "姓",
          "firstName": "名",
          "lastKana": "セイ",
          "firstKana": "メイ",
          "phoneNumber": "電話番号",
          "sex": 0,
          "point": 100,
          "rank": "会員ランク"
        }
      ]
    }
  ]
}
```

| 項目 | 内容 |
|------|------|
| `customerId` | EC側で採番・保持するスマレジID。 |
| `customerNo` | `customerId`と同じ値。 |
| `customerCode` | 固定接頭値と桁数設定に従うスマレジ会員コード。 |
| `lastName`、`firstName` | スマレジ連携用に文字種・長さ検証した氏名。 |
| `lastKana`、`firstKana` | スマレジ連携用に文字種・長さ検証したカナ。 |
| `phoneNumber` | EC会員の電話番号をハイフン連結した値。 |
| `sex` | 固定値`0`。 |
| `point` | 新規登録時など、会員ポイントも同時に登録する場合に指定する。 |
| `rank` | 会員ランク更新時に指定する。 |

`point`と`rank`は常に送信される項目ではなく、呼び出し元の処理に応じて付加される。成功した場合はEC側会員のスマレジIDや確認済み状態を保存する。

### 会員停止・削除API `customer_upd`

退会やポイント統合では、スマレジ会員を停止または削除する。

停止更新の例は次のとおりである。

```json
{
  "proc_info": {
    "proc_division": "U"
  },
  "data": [
    {
      "table_name": "Customer",
      "rows": [
        {
          "customerId": "停止対象スマレジ会員ID",
          "customerCode": "停止対象スマレジ会員コード",
          "lastName": "姓",
          "firstName": "名",
          "lastKana": "セイ",
          "firstKana": "メイ",
          "sex": 0,
          "status": "1"
        }
      ]
    }
  ]
}
```

削除更新の例は次のとおりである。

```json
{
  "proc_info": {
    "proc_division": "D"
  },
  "data": [
    {
      "table_name": "Customer",
      "rows": [
        {
          "customerId": "削除対象スマレジ会員ID"
        }
      ]
    }
  ]
}
```

`status = 1`は利用停止を表す。削除はスマレジ側に異常作成された会員データを戻す用途でも使用する。

### ポイント更新API `point_upd`

使用ポイント連携、付与ポイント連携、連携エラー再実行では`point_upd`を使用する。

```json
{
  "proc_info": {
    "proc_division": "U",
    "proc_detail_division": "1"
  },
  "data": [
    {
      "table_name": "Point",
      "rows": [
        {
          "customerId": "スマレジ会員ID",
          "point": 100
        }
      ]
    }
  ]
}
```

| 項目 | 内容 |
|------|------|
| `proc_division` | 固定値`U`。 |
| `proc_detail_division` | `1`は絶対値同期、`2`は相対増減。 |
| `customerId` | ポイント更新対象のスマレジ会員ID。 |
| `point` | 絶対値同期では同期後ポイント、相対増減では増減値。使用ポイント連携では負の値を送る。 |

成功時は追加のレスポンス項目を参照せず正常終了する。失敗時は、受注または会員処理側にスマレジ連携エラー情報を保存し、再実行バッチの対象にする。

### 取引参照API `transaction_ref`

スマレジ取引連携エラー再連携では、直近期間の取引ヘッダをスマレジから取得する。

```json
{
  "conditions": [
    {
      "transactionHeadDivision": "1",
      "updDateTime >=": "YYYY-MM-DD HH:MM:SS",
      "updDateTime <": "YYYY-MM-DD HH:MM:SS"
    }
  ],
  "order": [
    "transactionHeadId"
  ],
  "table_name": "TransactionHead"
}
```

| 項目 | 内容 |
|------|------|
| `transactionHeadDivision` | 固定値`1`。通常の取引ヘッダを対象にする。 |
| `updDateTime >=` | 現在時刻から`smaregi.transaction_period_hours`時間だけ遡った日時。 |
| `updDateTime <` | バッチ実行時点の現在日時。 |
| `order` | `transactionHeadId`昇順。 |
| `table_name` | 固定値`TransactionHead`。 |

エラー応答の例は次の形式で扱う。

```json
{
  "error": "エラーコード",
  "error_description": "エラー内容"
}
```

`error`が存在する場合はログとコンソールへ出力して異常終了する。`result`が空の場合は処理対象なしとして正常終了する。`result`に取引ヘッダがある場合は、取消・打消・通常取引を判定し、EC側ポイント履歴の不足または過剰を補正する。

---

## 共通連携設定

| 設定 | 用途 |
|------|------|
| `smaregi_contract_id` | スマレジAPIの契約IDヘッダに使用する。 |
| `smaregi_access_token` | スマレジAPIのアクセストークンヘッダに使用する。 |
| `smaregi_request_url` | スマレジAPIの送信先URL。既定値はスマレジWeb APIのアクセスURL。 |
| `smaregi_store_id` | 店舗ID。商品コードの自店舗判定と在庫更新に使用する。 |
| `smaregi_category_id` | スマレジ商品連携時の部門ID。 |
| `smaregi_error_mail_address` | スマレジ連携エラー通知の送信先。 |
| `smaregi.customer_id.length` | 新規スマレジID採番の桁数。 |
| `smaregi.customer_id.min` | 新規スマレジID採番の下限。 |
| `smaregi.customer_code.fix_no` | スマレジ会員コードの固定接頭値。 |
| `smaregi.customer_code.length` | スマレジ会員コードの桁数。 |
| `smaregi.transaction_period_hours` | 取引参照バッチで遡る時間幅。 |
| `eccube_smaregi_webhook_route` | ec-cube-enterpriseのスマレジWebhook受信ルート。既定は`smaregi/webhook`。 |

契約ID・アクセストークン・送信先URLの実値は本書に記載しない。

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| ブラウザ画面 | 本書の主対象はAPIとバッチであり、スマレジ連携専用のブラウザ画面は持たない。 |
| 管理画面表示 | 受注編集画面や受注一覧では、スマレジポイント連携エラーがある場合に警告表示を行う。表示内容は受注管理の個別設計を正とする。 |
| 会員画面 | 会員登録、会員情報変更、退会、ポイント統合などの画面操作がスマレジ会員登録・更新・停止を呼び出す。各画面の入力項目は個別設計を正とする。 |
| 非同期処理 | 購入完了やメール再送処理から、スマレジ使用ポイント連携を別プロセスで起動する。 |

---

## 処理フロー

### スマレジ在庫変動Webhookを受信する

1. スマレジから契約ID、イベント、アクション、在庫変動履歴IDリストを含むWebhookを受ける。
2. リクエストヘッダーとリクエスト本文をスマレジWebhook受信テーブルへ記録する。
3. 在庫変更履歴ID、商品ID、店舗IDをもとにスマレジ在庫変動履歴を取得する。
4. 在庫区分が`02:取引`の場合は、EC-CUBE側のスマレジ在庫を出庫として更新する。
5. 在庫区分が`12:返品`の場合は、EC-CUBE側のスマレジ在庫を入庫として更新する。
6. 対象外の在庫区分、店頭受取分の商品ID、既に処理済みの在庫変動履歴は更新対象外とする。
7. スマレジ在庫変動履歴IDをEC-CUBE側の在庫変動履歴に紐づけて保存する。

### スマレジWebhook連携エラーを再実行する

1. スケジュール起動で、指定期間内のスマレジ在庫変動履歴をスマレジプラットフォームAPIから取得する。
2. 在庫区分が`02:取引`または`12:返品`のデータに絞る。
3. EC-CUBE側の在庫変動履歴にスマレジ在庫変動履歴IDが保存済みか確認する。
4. 未保存の在庫変動履歴を再連携対象にする。
5. スマレジ連携処理A01-01のWebhook方式と同じ入庫・出庫更新を実行する。
6. 実行結果をDBとログへ記録する。

### スマレジ取引通知を受信する

1. POSTされた`params`をJSONとして読み取り、取引ヘッダと取引明細を取り出す。
2. 自店舗のスマレジ店舗IDを3桁文字列として取得する。
3. 取引が取消の場合は、取引IDに紐づくポイント履歴を削除し、会員ポイントを巻き戻す。
4. 取引が打消レコードの場合は、打消元取引IDを使い、付与ポイント・使用ポイントの正負を反転して巻き戻す。
5. 通常取引の場合は、スマレジ会員IDで会員を探し、付与ポイントと使用ポイントを会員ポイントへ反映し、ポイント履歴を登録する。
6. 通常取引の明細ごとに、商品コードが自店舗の店舗IDを含む場合は、スマレジコードから対象注文を探して出荷完了に更新する。
7. 商品コードが自店舗以外の場合は、明細を支店システム向けに集める。
8. 支店明細がある場合は、受信した契約ID・アクセストークンヘッダを引き継ぎ、支店システムのスマレジ受信APIへ転送する。
9. 自EC側更新件数と支店転送の更新件数を合算し、JSONで返す。

### スマレジへ商品・在庫・削除を送信する

1. オプションマスタから契約ID、アクセストークン、送信先URL、店舗ID、部門IDを取得する。
2. 商品削除区分が指定された場合は、`product_upd`へ削除区分とスマレジ商品IDを送信する。
3. 商品連携区分が指定された場合は、注文番号、店頭注文番号または購入者カナ、支払合計、部門IDを使って商品情報を組み立て、`product_upd`へ更新区分で送信する。
4. 在庫連携区分が指定された場合は、店舗ID、商品ID、在庫数1、在庫区分15を`stock_upd`へ送信する。
5. スマレジ応答に`result`が無い場合はエラーメールを送信し、当該区分の連携済みフラグは立てない。
6. 成功した区分だけ受注のスマレジ連携フラグを更新して保存する。

### スマレジ使用ポイントを連携する

1. コマンド引数の受注IDが未指定または数値でない場合は処理を終了する。
2. 受注IDから受注拡張情報を取得し、受注会員に紐づくスマレジIDを取得する。
3. 使用ポイントを負の値にして`point_upd`へ送信する。
4. 成功した場合は追加更新せず終了する。
5. 失敗した場合は受注側にエラーメッセージとスマレジ連携エラーフラグを保存する。

### スマレジ連携エラー受注を再連携する

1. スマレジ連携エラーフラグが立っている受注と会員を取得する。
2. 会員のスマレジIDとEC側の現在ポイントを使い、`point_upd`へ絶対値同期として送信する。
3. 成功した場合はエラーフラグを解除する。
4. 失敗した場合は受注側にエラーメッセージを保存する。
5. 1秒あたり10回のリクエストを超えないよう、受注ごとに0.1秒待機する。
6. 処理結果を保存する。

### スマレジ取引を参照してポイント履歴を補正する

1. オプションマスタからスマレジ接続設定を取得する。
2. 現在時刻から設定時間分だけ遡り、取引ヘッダの更新日時条件を組み立てる。
3. `transaction_ref`へ取引参照を送信する。
4. エラー応答の場合はログとコンソールへ出力し、異常終了する。
5. 結果が空の場合は正常終了する。
6. 取得した取引ごとに、取消・打消・通常取引を判定する。
7. 未登録の通常取引は、会員ポイント加減算とポイント履歴登録を行う。
8. 未削除の取消取引または打消取引は、対象取引IDのポイント履歴を削除し、会員ポイントを巻き戻す。
9. 更新件数がある場合は処理件数をログへ出力する。

### スマレジ会員を一括作成する

1. 開始プレイヤーIDと終了プレイヤーIDが数値で指定されていない場合はメッセージを出して終了する。
2. 指定範囲内でスマレジID未設定の会員を取得する。
3. 会員ごとに重複しないスマレジIDを採番する。
4. `customer_upd`へ会員登録を送信する。
5. 成功した場合はEC側会員へスマレジIDを保存する。
6. 失敗した会員は保存せず、次の会員へ進む。
7. 例外発生時は、スマレジ側に作成済みの異常データ削除を試み、DBトランザクションをロールバックする。
8. 1秒あたり10回のリクエストを超えないよう、会員ごとに0.1秒待機する。

### スマレジ会員の存在を確認する

1. 開始プレイヤーIDと終了プレイヤーIDが数値で指定されていない場合はメッセージを出して終了する。
2. スマレジIDを持ち、スマレジ側会員登録が未検証の会員を取得する。
3. 会員ごとに`customer_ref`でスマレジ会員を検索する。
4. 取得結果が不正な場合はメッセージを出し、当該会員の更新を行わない。
5. スマレジ側に会員が存在する場合は、EC側のスマレジ会員存在フラグを有効にする。
6. 存在しない場合は、EC側のスマレジIDを空に戻す。
7. 会員ごとに0.1秒待機する。

### ポイント差分を補正して通知する

1. 保有ポイントとポイント履歴合計に差分がある会員を取得する。
2. 会員ごとに保有ポイントをポイント履歴合計へ更新する。
3. 補正前ポイント、履歴合計、差分を通知用一覧に積む。
4. 更新を確定する。
5. 通知用一覧が空でない場合、管理者へポイント差分通知メールを送信する。

---

## 判定順序

### 取引通知受信時

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 取引ヘッダの取消区分が取消 | 付与・使用ポイントを元にポイント履歴を削除し、会員ポイントを巻き戻す。 |
| 2 | 取引ヘッダの打消区分が打消レコード | 打消元取引IDを使い、付与・使用ポイントの正負を反転してポイント履歴を削除し、会員ポイントを巻き戻す。 |
| 3 | 通常取引 | 会員ポイントを加減算し、付与・使用ポイント履歴を登録する。 |
| 4 | 通常取引明細の商品コードが自店舗IDを含む | スマレジコードに対応する注文を出荷完了にする。 |
| 5 | 通常取引明細の商品コードが自店舗IDを含まない | 支店システムへ転送する明細として保持する。 |

### スマレジ送信結果

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 応答が空、または`result`キーが無い | 失敗として扱い、エラーメールまたは受注側エラー記録を行う。 |
| 2 | `result`キーがある | 成功として扱い、対象の連携済みフラグやエラーフラグを更新する。 |

---

## 表示メッセージ・ログ

| 種別 | 表示・記録内容 | 条件 |
|------|----------------|------|
| コンソール | `Nothing args or command.` | バッチ名が未指定、または対応するバッチ名でない場合。 |
| コンソール | `プレイヤーIDの範囲を引数で指定してください。` | スマレジ会員一括作成・存在確認でID範囲が不正な場合。 |
| コンソール | `会員情報APIの返り値が不正です。` | スマレジ会員存在確認で会員参照応答を解釈できない場合。 |
| コンソール | `登録されたスマレジIDが存在しません。スマレジIDを初期化します。` | スマレジ会員存在確認でスマレジ側に会員が存在しない場合。 |
| ログ | `スマレジ通知支店転送エラー` | 支店システムへの転送結果に`result`が無い場合。 |
| ログ | `取引情報取得失敗` | スマレジ取引参照APIがエラー応答を返した場合。 |
| ログ | `未削除のキャンセルスマレジ取引ID` | 取消取引でEC側ポイント履歴が残っている場合。 |
| ログ | `未登録のスマレジ取引ID` | 通常取引でEC側ポイント履歴が未登録の場合。 |
| ログ | `スマレジ取引処理件数` | スマレジ取引参照による補正件数が1件以上ある場合。 |
| 管理画面 | スマレジポイント連携エラーの警告 | 受注側にスマレジ連携エラーフラグが立っている場合。 |

---

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 会員ポイント加算 | 通常取引で付与ポイントがある場合、会員ポイントへ加算し、ポイント履歴に正の増減として登録する。 |
| 会員ポイント減算 | 通常取引で使用ポイントがある場合、会員ポイントから減算し、ポイント履歴に負の増減として登録する。 |
| 取消時の巻き戻し | 取消取引では、対象取引IDのポイント履歴を削除し、付与ポイントを減算、使用ポイントを加算して会員ポイントを戻す。 |
| 打消時の巻き戻し | 打消レコードは付与・使用ポイントが負値で渡るため、正負を反転して取消と同じ巻き戻しを行う。 |
| スマレジ使用ポイント連携 | 受注の使用ポイントを負値としてスマレジへ送信する。 |
| スマレジエラー受注再連携 | 会員の現在ポイントを絶対値同期としてスマレジへ送信する。 |
| ポイント差分補正 | EC側の保有ポイントをポイント履歴合計へ上書きする。差分は補正前の保有ポイントと履歴合計の差で算出する。 |
| リクエスト流量制御 | 会員一括作成、会員存在確認、連携エラー受注再連携では、1秒あたり10回を超えないよう0.1秒待機する。 |

---

## 入出力

| 種類 | 入力 | 成功時出力 | 失敗時出力 |
|------|------|------------|------------|
| スマレジ取引通知API | POSTの`params`、取引ヘッダ、取引明細、連携用ヘッダ | 更新件数を含むJSON | 明示的な異常JSONは返さず、処理できない対象は更新件数0またはログ記録となる。 |
| スマレジ商品・在庫送信 | 受注拡張情報、スマレジ連携区分、スマレジ接続設定 | 連携済みフラグ更新 | エラーメール送信、フラグ未更新。 |
| スマレジ使用ポイント連携 | 受注ID、受注の使用ポイント、会員スマレジID | 追加更新なし | 受注側へエラーメッセージとエラーフラグを保存。 |
| 連携エラー受注再連携 | エラーフラグが立つ受注、会員スマレジID、会員ポイント | エラーフラグ解除 | エラーメッセージ更新。 |
| スマレジ取引参照 | スマレジ接続設定、取引更新日時範囲 | ポイント履歴登録または取消、ログ記録 | 取得失敗をログ・コンソールへ出力。 |
| スマレジ会員一括作成 | プレイヤーID範囲 | スマレジID採番、スマレジ会員登録、EC側スマレジID保存 | 失敗会員は保存しない。例外時はロールバックし、スマレジ側異常データ削除を試みる。 |
| スマレジ会員存在確認 | プレイヤーID範囲 | 存在フラグ更新 | 参照不能時は当該会員を更新しない。存在しない場合はスマレジIDを空に戻す。 |
| ポイント差分補正 | ポイント履歴合計と保有ポイントに差がある会員 | 保有ポイント補正、通知メール送信 | 通知対象が無い場合はメール送信しない。 |
| スマレジ在庫変動Webhook | 契約ID、イベント、アクション、在庫変動履歴IDリスト | Webhook受信記録、在庫変動履歴取得、EC-CUBE側スマレジ在庫更新 | 対象外区分は更新しない。連携失敗分は再連携対象として扱う。 |
| スマレジWebhook連携エラー再連携 | 指定期間内のスマレジ在庫変動履歴 | 未連携分の入庫・出庫再処理、受信/処理状態更新 | API取得失敗、対象なし、対象外区分は実装側のエラーハンドリングに従う。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 取引ID単位 | ポイント履歴はスマレジ取引IDを保持し、取消・打消時の巻き戻し対象を特定する。 |
| 会員ポイントと履歴 | 通常取引受信と取引参照補正は、会員ポイントとポイント履歴を同時に更新する。差分補正バッチは履歴合計を正として保有ポイントを上書きする。 |
| 商品・在庫連携状態 | 商品・在庫・削除の各送信成功時だけ連携済みフラグを更新する。失敗時は未完了状態を残し、再連携対象にできる。 |
| スマレジとDBのトランザクション | スマレジAPI呼び出しとEC側DB更新は単一トランザクションではない。スマレジ送信成功後のDB保存失敗、またはDB更新後の外部API失敗は個別に補正・再実行が必要になる。 |
| 支店転送 | 自店舗以外の商品明細は支店システムへ転送する。転送失敗時はログに残るが、スマレジへの応答自体はEC側更新件数を元に返す。 |
| 会員一括作成 | スマレジ会員登録後にEC側保存で例外が起きた場合、スマレジ側会員削除を試みてからDBトランザクションをロールバックする。削除失敗時はコンソールへ出力する。 |
| 在庫変動履歴ID | ec-cube-enterpriseの在庫系スマレジ連携では、スマレジ在庫変動履歴IDをEC-CUBE側の在庫変動履歴に紐づけ、再連携時の二重反映を避ける。 |
| Webhook受信状態 | スマレジWebhook受信テーブルのステータス、開始日時、完了日時で処理状態を管理する。 |

---

## DBカラム

本書ではスマレジ連携に直接関係する主な列だけを記載する。

| テーブル | 列 | メモ |
|---------|-----|------|
| `mtb_option` | `option_key`、`option_value` | スマレジ契約ID、アクセストークン、送信先URL、店舗ID、部門ID、エラー通知先を保持する。 |
| `dtb_player` | `smaregi_id` | スマレジ会員ID。会員参照・ポイント更新・取引通知の会員照合に使用する。 |
| `dtb_player` | `point` | EC側の保有ポイント。取引通知、取引参照補正、ポイント差分補正で更新する。 |
| `dtb_player` | `exists_smaregi_flg` | スマレジ側会員存在確認済みの状態を保持する。 |
| `dtb_point_history` | `point_change`、`note`、`issue_date`、`point_type_id`、`transaction_id` | スマレジ取引の付与・使用ポイント履歴を保持する。取消・打消時は`transaction_id`で削除対象を特定する。 |
| `dtb_order_sub` | `smaregi_code` | スマレジ商品ID・商品コード。取引明細から対象注文を探すキーにもなる。 |
| `dtb_order_sub` | `smaregi_product_flg`、`smaregi_stock_flg`、`smaregi_del_flg` | 商品・在庫・削除の連携済み状態を保持する。 |
| `dtb_order_sub` | `smaregi_error_flg`、`point_error_message` | ポイント連携失敗状態とエラー内容を保持する。 |
| `dtb_order_sub` | `spended_points`、`gained_points` | スマレジへの使用ポイント連携、出荷完了時の付与ポイント連携に使用する。 |
| `dtb_member_sub` | `smaregi_member_flg` | スマレジ用管理メンバーを特定し、スマレジ取引通知による出荷完了更新の担当者へ設定する。 |
| `dtb_smaregi_webhook_request` | `contract_id`、`smaregi_event_id`、`event`、`action`、`request_headers`、`request_body`、`received_at`、`status` | ec-cube-enterpriseのスマレジWebhook受信内容と処理状態を保持する。 |
| `dtb_smaregi_webhook_request` | `started_at`、`completed_at`、`create_date`、`update_date` | Webhook処理開始・完了・更新日時を保持し、再連携や監査に使用する。 |

### DB操作

永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_member_sub / dtb_order_sub / dtb_player / dtb_point_history / mtb_option | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |
| 登録/更新 | dtb_smaregi_webhook_request | ec-cube-enterpriseのスマレジWebhook受信、処理開始、処理完了、再連携で受信内容と状態を保存する。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| スマレジ商品・在庫・削除送信の応答に`result`が無い | スマレジエラーメールを送信し、連携済みフラグを更新しない。 |
| スマレジポイント連携の応答に`result`が無い | 受注側へエラーメッセージを保存し、スマレジ連携エラーフラグを立てる。 |
| スマレジ取引参照APIがエラーを返す | ログとコンソールへ取得失敗を出力し、処理を終了する。 |
| 取引通知の会員が見つからない | 当該会員のポイント更新は行わず、更新件数0として扱う。 |
| 取消・打消対象のポイント履歴が見つからない | 巻き戻しを行わず、更新件数0として扱う。 |
| スマレジ会員一括作成中のDB例外 | スマレジ側に作成済みの異常データ削除を試み、DBトランザクションをロールバックする。 |
| スマレジ会員存在確認でAPI結果が不正 | メッセージを出力し、当該会員の存在確認状態を更新しない。 |
| スマレジ在庫変動Webhookの処理失敗 | Webhook受信状態を失敗として扱い、再連携または運用確認の対象にする。 |
| スマレジWebhook連携エラー再連携で対象なし | 更新せず正常終了する。対象なし自体は業務エラーにしない。 |

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 支店転送失敗 | 支店転送エラーとレスポンス内容をログ出力する。 |
| 取引参照失敗 | スマレジ取引情報取得失敗のエラー内容をログ出力する。 |
| 未削除の取消取引検出 | 対象スマレジ取引IDをログ出力する。 |
| 未登録の通常取引検出 | 対象スマレジ取引IDをログ出力する。 |
| 取引参照補正完了 | 処理件数が1件以上の場合、処理件数をログ出力する。 |
| ポイント差分補正 | 差分一覧を管理者宛メールとして送信する。 |
| スマレジWebhook受信 | 受信ヘッダー、受信本文、スマレジイベントID、処理状態をDBへ記録する。 |
| スマレジWebhook処理失敗 | 失敗状態と処理日時を残し、再連携・監視の根拠にする。 |

### ログに出してはいけないもの

- スマレジアクセストークンの実値
- スマレジ契約IDの実値
- 顧客個人情報の不要な全量
- セッションID、Cookie、なりすまし対策トークンの完全値

---

## セキュリティ

| 観点 | 内容 |
|------|------|
| スマレジ受信API | pf-eccube3実装上、スマレジ取引通知API自体ではログイン認証を要求しない。支店転送時には受信ヘッダの契約ID・アクセストークンを転送先へ引き継ぐ。 |
| スマレジ送信API | オプションマスタの契約ID・アクセストークンをヘッダとして送信する。 |
| ec-cube-enterpriseのスマレジWebhook | `%eccube_smaregi_webhook_route%`配下のPOSTをWebhook受信用として扱う。ルート値とセキュリティ設定はec-cube-enterpriseの設定を正とする。 |
| バッチ | コンソール実行前提であり、Web利用者の権限ではなくサーバ側の実行権限に依存する。 |
| 秘密値 | 契約ID・アクセストークン・送信先URLの実値は設計書、ログ、画面に出さない。 |

---

## 排他制御・トランザクション

| 観点 | 内容 |
|------|------|
| 通常のスマレジ送信 | 商品・在庫・削除の各区分ごとにスマレジ送信後、成功時にDBを保存する。外部APIとDB保存は一体のトランザクションではない。 |
| 取引通知受信 | 会員ポイント・ポイント履歴・注文更新ごとにDB保存を行う。支店転送は別HTTP呼び出しであり、EC側DB更新とは一体化しない。 |
| 会員一括作成 | 範囲内会員の処理をDBトランザクション内で行い、例外時はロールバックする。ただしスマレジAPI側の登録は外部副作用のため、削除APIで補償する。 |
| 同時実行 | 同じ会員・同じ受注・同じスマレジ取引を複数処理が同時更新する場合の楽観ロック・悲観ロックは本機能内では確認できない。運用上は同種バッチの多重起動を避ける。 |

---

## ec-cube-enterprise実装との差分追記（2026-06-19）

本章は、既存のpf-eccube3横断設計書と、`ec-cube-enterprise`リポジトリの実装を照合して確認した差分である。pf-eccube3由来のAPI名・バッチ名は移行元仕様として残し、現行実装で確認できる入口、非同期処理、DB、APIクライアント、未実装箇所を追記する。

### 入口・認証・非同期化の差分

| 観点 | 既存設計の記載 | ec-cube-enterprise実装 | 追記・扱い |
|------|----------------|------------------------|------------|
| Webhook入口 | 在庫は`/smaregi/stocks`、取引通知は`/{_locale}/smaregi/transaction`として個別に記載している。 | `/%eccube_smaregi_webhook_route%`配下のPOSTを共通Webhook入口とする。初期値は`smaregi/webhook`で、`WebhookController`が`POST ''`を受ける。 | 現行実装ではスマレジWebhook入口を1本化している。旧URLはpf-eccube3仕様として扱う。 |
| Webhook認証 | IP制限や契約ID・アクセストークンヘッダを中心に記載している。 | `SMAREGI_WEBHOOK_SECRET_HEADER`で指定したヘッダ値を`SMAREGI_WEBHOOK_SECRET`と`hash_equals`で照合する。Symfony firewallはWebhookルートを`security: false`にし、アプリケーション側で秘密値を検証する。 | Webhook受信の認証方式は、ヘッダ秘密値検証を現行実装として追記する。 |
| イベントID | 既存記載では重複排除キーが明確でない。 | `smaregi-event-id`ヘッダが必須。欠落時は400、認証失敗は401、重複イベントは200で正常重複として返す。 | `smaregi-event-id`をWebhook冪等性キーとして扱う。 |
| 応答タイミング | API内で取引・在庫処理まで行う前提の記載がある。 | 受信時点で`SmaregiWebhookEvent`を保存し、`SmaregiWebhookEventMessage`をdispatchして200を返す。重い処理はMessengerへ委譲する。 | Webhookは3秒以内応答を優先し、後続処理は非同期ジョブ化する。 |
| 親子ジョブ | 旧設計ではバッチ・API単位の処理説明が中心。 | Webhookイベントごとに親`MessengerJob`を作成し、在庫変動IDまたは取引ID単位の子`MessengerJob`を作成する。 | 監査・再処理の単位はWebhookイベント、親ジョブ、子ジョブの3層で整理する。 |

### Webhookイベント種別とaction差分

| イベント | ec-cube-enterprise実装 | 補足 |
|----------|------------------------|------|
| `pos:stock` | `StockEventDispatcher`が処理する。対応actionは`edited`のみ。`ids[]`内の`id`、`productId`、`storeId`を在庫変動処理メッセージへ展開する。 | 不明actionは警告ログのみで失敗扱いにしない。不完全な行はスキップする。 |
| `pos:transactions` | `TransactionEventDispatcher`が処理する。`transactionHeadIds`を取引処理メッセージへ展開する。 | `created`、`canceled`、`disposed`は子ジョブ処理が実装されている。`edited`はハンドラが存在するが、子ジョブ側の実処理は未対応扱いのログになる。`bulk-update`、`bulk-deleted`はハンドラ上で未実装警告ログを出す。 |
| その他イベント | 在庫ディスパッチャと取引ディスパッチャがそれぞれ対象イベントだけを処理し、対象外は無視する。 | 共通Webhook入口に集約しているため、イベント名で後続処理を振り分ける。 |

### 在庫連携差分

| 観点 | ec-cube-enterprise実装 |
|------|------------------------|
| API方式 | `SmaregiStockApiClient`がスマレジPlatform APIをBearerトークンで呼び出す。旧設計の契約ID・アクセストークン固定ヘッダ方式ではない。 |
| 在庫変動取得 | `GET /{contractId}/pos/stock/changes/{productId}/{storeId}?id={stockChangeId}`でスマレジ在庫変動を取得する。 |
| 反映対象 | 取引区分`02`（売上）と`12`（返品）のみをEC在庫へ反映する。その他区分、数量なし、数量0はスキップする。 |
| 店舗解決 | `BaseInfo.smaregiShopId`でスマレジ店舗IDを解決する。店舗が見つからない場合は処理できない。 |
| 在庫解決 | スマレジ商品ID、支店、スマレジ在庫ロケーションの`ProductStock`を対象にする。見つからない場合は店頭受取・一時商品などEC在庫管理外としてスキップする。 |
| 冪等性 | `SmaregiStockChangeId`の履歴有無で二重反映を防止する。`ProductStock`には悲観ロックを取得する。 |
| 履歴 | 在庫更新時にスマレジ同期由来の在庫履歴を保存する。売上は減算、返品は加算として理由を残す。 |

### 取引連携差分

| 観点 | ec-cube-enterprise実装 |
|------|------------------------|
| 取引取得 | `SmaregiTransactionApiClient`が`GET /{contractId}/pos/transactions/{transactionHeadId}`を呼び出す。`with_details=all`、`with_payments=none`、`with_discounts=all`、`with_store=all`、`with_customer=all`、`with_staff=all`を固定指定する。 |
| 重複・順序制御 | `dtb_smaregi_transaction_job`で取引ID、action、スマレジ更新日時、処理結果を記録する。既に完了済みの同一取引・同一actionより古い更新日時は処理をスキップする。 |
| 購買パターン | スマレジ取引を9種類の`PurchasePattern`に分類する。EC店頭受取、スムース店頭受取、店頭PC会員・ゲスト、通常店頭会員・ゲスト、追加購入ありを区別する。 |
| EC注文更新 | 既存EC受注に紐づくスマレジ取引では、配送済み化、通過済み化、新規受注作成、次受注ID設定などをパターン別に行う。 |
| 店頭のみ購入 | EC受注に紐づかないスマレジ取引は、会員またはゲストの新規EC受注として作成する。取引ID単位のアドバイザリロックで重複作成を抑止する。 |
| ポイントのみ取引 | スマレジ取引区分`6`をポイント付与、`7`をポイント減算として扱い、受注を作らず会員ポイント履歴を保存する。 |
| 取消・打消 | ポイントのみ取引は取消・打消時に逆方向のポイント履歴を追加して差し戻す。通常取引は取消・打消用ProcessorでEC受注側を処理する。 |
| 未対応action | 子ジョブ実装上、`edited`、`bulk-update`、`bulk-deleted`の実処理は未対応または警告ログ扱いである。 |

### 店頭受取商品・在庫・削除差分

| 観点 | ec-cube-enterprise実装 |
|------|------------------------|
| 商品・在庫登録バッチ | `eccube:order:otc-smaregi-post`が店頭受取受注を対象にスマレジ商品登録と在庫追加を行う。基準時刻は実行時点の30分前である。 |
| 削除バッチ | `eccube:smaregi:otc:delete`が完了・配送済み・キャンセル済みの店頭受取受注から、スマレジ削除未済の商品を子ジョブ化して削除する。 |
| 商品コード | `Order.smaregiCode`が空の場合は`SmaregiOtcProductCodeGenerator`で生成する。商品登録済みの場合は再利用する。 |
| 商品登録 | 先にスマレジ商品コードで検索し、存在すればローカルを連携済みにする。存在しなければスマレジ商品を作成する。作成失敗時は競合作成を考慮して再検索する。 |
| 在庫追加 | 商品ID解決後、`POST /{contractId}/pos/stock/{productId}/add`へ`storeId`と`stockAmount`を送信する。 |
| エラー再試行 | 商品・在庫同期失敗時は`smaregiErrorFlg`を立てる。エラー受注は次回バッチで自動再試行せず、運用側のフラグ解除を前提にする実装コメントがある。 |
| 商品削除 | スマレジ側に商品が見つからない場合はローカルを削除済みにする。スマレジAPIエラー時は削除済みにせず、子ジョブ失敗として残す。 |

### 商品・部門マスタ連携差分

| 観点 | ec-cube-enterprise実装 |
|------|------------------------|
| 商品規格連携 | `ProductClass.smaregiAlignmentFlg`が有効で、`smaregiProductCode`がある商品規格だけをスマレジ商品upsert対象にする。 |
| 商品upsert | 既存スマレジ商品IDがあれば更新する。IDがなければ商品コードで検索し、存在すればID保存後に更新、存在しなければカテゴリID必須で作成する。 |
| 商品削除 | 商品規格削除時にスマレジ商品削除ジョブを同一DBトランザクション内で登録し、コミット後にdispatchする。EC削除自体はスマレジdispatch失敗でロールバックしない。 |
| 部門連携 | `MtbSection`をスマレジカテゴリとしてupsertする。スマレジカテゴリIDがない場合はカテゴリコード検索、なければ作成、あれば名称更新する。 |
| API | 商品は`/pos/products`、部門は`/pos/categories`をPlatform API Bearer認証で呼び出す。 |

### 会員・ポイントAPIの実装状態差分

| 観点 | ec-cube-enterprise実装 |
|------|------------------------|
| ポイント送信コマンド | `eccube:smaregi:update-point [orderId]`が受注利用ポイントをスマレジへ反映する入口として存在する。 |
| ポイント送信処理 | 受注、利用ポイント、会員、会員拡張情報を確認し、`SmaregiCustomerService::postSmaregiPoint`へ負の利用ポイントを渡す。例外または`result`欠落時は受注へエラー内容を保存し、スマレジエラーフラグを立てる。 |
| 未実装・仮実装 | `SmaregiCustomerService`の`postSmaregiPoint`、`deleteCustomer`、`gainPoints`はTODO付きの仮実装で、固定の成功応答または`true`を返す。会員作成・削除・ポイントAPIの実スマレジ連携は現行実装上未完成として扱う。 |

### DB・監査差分

| 対象 | ec-cube-enterprise実装 |
|------|------------------------|
| Webhook受信 | `dtb_smaregi_webhook_request`相当の`SmaregiWebhookEvent`へイベントID、イベント名、action、ヘッダ、本文、受信日時、処理状態、親ジョブIDを保存する。 |
| Messengerジョブ | `dtb_messenger_job`で親子ジョブ、message class、message id、status、payload summary、エラー、開始・完了日時を管理する。 |
| 取引ジョブ | `dtb_smaregi_transaction_job`で取引ID、action、スマレジ更新日時、処理済み判定を管理する。 |
| Platform APIログ | `dtb_smaregi_platform_api_call_log`でアクセストークン、商品、部門、在庫、取引APIのリクエスト・レスポンス、所要時間、エラーを記録する。Messengerジョブコンテキストがある場合にジョブへ紐づく。 |
| 受注連携項目 | pf-eccube3設計では`dtb_order_sub`を中心に記載しているが、ec-cube-enterpriseでは`dtb_order`上の`smaregi_code`、`smaregi_product_flg`、`smaregi_stock_flg`、`smaregi_del_flg`、`smaregi_error_flg`、`smaregi_receipt_no`、`smaregi_memo`、`smaregi_transaction_id`、`next_order_id`などを使用する。 |
| 会員連携項目 | pf-eccube3設計では`dtb_member_sub`を中心に記載しているが、ec-cube-enterpriseでは会員側に`smaregi_member_flg`などの連携項目を持つ。 |

### API基盤差分

| 観点 | ec-cube-enterprise実装 |
|------|------------------------|
| アクセストークン | `SmaregiAccessTokenService`がClient Credentialsで`${idUrl}/app/${contractId}/token`を呼び、Basic認証とscope指定でアクセストークンを取得する。 |
| キャッシュ | アクセストークンは契約ID単位でキャッシュし、有効期限の300秒前を目安に失効扱いにする。ただし最小TTLは60秒とする。 |
| レート制御 | 参照系と更新系でrate limiterを分け、環境変数未指定時は参照10req/sec、更新4req/secを初期値にする。 |
| モック | スマレジAPIクライアントIDが空の場合にモックファクトリを使う設定がある。 |
| ログ保護 | APIログはAuthorizationなどの機密ヘッダをマスクし、URLや本文は上限長で切り詰める。 |

### 未反映・要確認事項

| 項目 | 状態 |
|------|------|
| 旧API名 | `customer_ref`、`customer_upd`、`point_upd`、`transaction_ref`などの旧API名はpf-eccube3仕様として残る。ec-cube-enterpriseではPlatform APIクライアントへ置き換わっている箇所と、会員・ポイント系の仮実装箇所が混在する。 |
| 取引action | `edited`、`bulk-update`、`bulk-deleted`は入口・ハンドラ定義があるが、子ジョブ側の業務反映は未対応または警告ログ扱いである。 |
| Webhookエラー再連携 | 現行ソースではWebhookイベント・Messengerジョブの失敗状態は確認できる。一方、Step Functions起動や未連携Webhookを抽出する専用Commandは、今回確認した`ec-cube-enterprise`ソース上では明確に確認できない。 |
| 在庫Webhook URL | A01-01の設計書には`/smaregi/stocks`の記載があるが、現行実装は環境変数で変更可能な共通Webhookルートを使用する。 |

---

## 調査補助

論理説明と切り離し、ソース照合用に主なファイルを列挙する。

```text
pf-eccube3/app/Plugin/HareruyaEc/Controller/SmaregiController.php
pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php
pf-eccube3/app/Plugin/HareruyaEc/Command/SmaregiBatch.php
pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php
pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php
pf-eccube3/app/Plugin/HareruyaEc/Service/SmaregiService.php
pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CustomerService.php
pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CreateCustomer.php
pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckCustomer.php
pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/UpdatePoint.php
pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php
pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php
pf-eccube3/app/Plugin/HareruyaEc/Service/Order/ResendSmaregiProduct.php
pf-eccube3/app/Plugin/HareruyaEc/Service/Order/DeleteSmaregiProduct.php
pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/AdjustPointVariance.php
pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php
pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php
pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/ChangeController.php
pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php
pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/PointConsolidationController.php
pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/PointConsolidationController.php
pf-eccube3/app/Plugin/HareruyaEc/Event/Admin/AccountEvent.php
pf-eccube3/app/Plugin/HareruyaEc/config.yml
ec-cube-enterprise/app/config/eccube/routes.yaml
ec-cube-enterprise/app/config/eccube/packages/eccube.yaml
ec-cube-enterprise/app/config/eccube/packages/security.yaml
ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php
ec-cube-enterprise/src/Eccube/Entity/SmaregiWebhookEvent.php
ec-cube-enterprise/src/Eccube/Repository/SmaregiWebhookEventRepository.php
ec-cube-enterprise/src/Eccube/Message/SmaregiWebhookEventMessage.php
ec-cube-enterprise/src/Eccube/Message/SmaregiStockProcessMessage.php
ec-cube-enterprise/src/Eccube/Message/SmaregiTransactionProcessMessage.php
ec-cube-enterprise/src/Eccube/Message/SmaregiProductClassUpsertMessage.php
ec-cube-enterprise/src/Eccube/Message/SmaregiProductClassDeleteMessage.php
ec-cube-enterprise/src/Eccube/Message/SmaregiSectionUpsertMessage.php
ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php
ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiStockProcessMessageHandler.php
ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php
ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php
ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiProductClassDeleteMessageHandler.php
ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiSectionUpsertMessageHandler.php
ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php
ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php
ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/EventService.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/StockEventDispatcher.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CreatedHandler.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CanceledHandler.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/DisposedHandler.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/EditedHandler.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/BulkUpdateHandler.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/BulkDeletedHandler.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/ProductClass/SmaregiProductClassEventService.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Section/SmaregiSectionEventService.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePattern.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternResolver.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiAccessTokenService.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiTransactionApiClient.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiProductApiClient.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiSectionApiClient.php
ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiPlatformApiCallRecorder.php
ec-cube-enterprise/src/Eccube/Entity/MessengerJob.php
ec-cube-enterprise/src/Eccube/Entity/SmaregiTransactionJob.php
ec-cube-enterprise/src/Eccube/Entity/SmaregiPlatformApiCallLog.php
```

既存の個別設計書:

```text
functions/ec-cube-enterprise/a01-01_api_stock_smaregi_stock_sync.md
functions/ec-cube-enterprise/a01-02_api_stock_smaregi_webhook_error_retry.md
functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md
functions/pf-eccube3/b05-04_batch_order_order_resend_smaregi_product.md
functions/pf-eccube3/b05-05_batch_order_order_delete_smaregi_product.md
functions/pf-eccube3/b05-08_batch_order_smaregi_check_error_order.md
functions/pf-eccube3/b05-09_batch_order_smaregi_check_transaction.md
functions/pf-eccube3/b08-05_batch_customer_customer_adjust_point_variance.md
functions/pf-eccube3/b08-06_batch_customer_smaregi_update_point.md
```
