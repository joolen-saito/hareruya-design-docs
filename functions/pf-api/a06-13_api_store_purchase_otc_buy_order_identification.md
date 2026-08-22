# API 店頭買取管理 — 本人確認更新

## 業務ロジック

### 認証

認証用トークンをヘッダ `jwt-token` で受け取り、署名方式 HS256 で検証したうえで、トークンが指す管理者会員を特定する。ヘッダが無いとき、署名が不正なとき、トークンが指す管理者会員が存在しないときは、いずれも認証拒否（HTTP 401）とし、更新しない。

### 判定の順序

認証、店頭買取受注の取得、証明書IDの妥当性の順に判定し、成立しないものが出た時点で処理を打ち切り、以降の判定は行わない。認証できないときは受注IDと証明書IDの誤りは判定されず、受注が存在しないときは証明書IDの誤りは判定されない。

証明書IDを送っていないときは、マスタに存在しない値を送ったときと同じ扱いになる。

### 更新する項目

証明書のほかに、更新担当者へ認証で特定した管理者会員を、更新日時へ更新時点の日時を設定する。

## 入出力

### 入力: 認証情報

| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
|------------|------|----|-----------|------|
| `jwt-token` | ヘッダ | string | 必須 | 認証用のトークン |

### 出力: 認証できないとき

| HTTPステータス | 条件 |
|----------------|------|
| 401 | 認証用トークンの欠落・署名不正・トークンが指す管理者会員なしのとき |

### 入出力: エンドポイントの別名

拡張子 `.json` を付けないパス（`/api/admin/otcBuyOrder/{id}/identification`）でも、同じメソッドで同じ更新を受け付ける。

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 本人確認更新（本人確認証明書・更新担当者・更新日時） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| A06-13-MSG-001 | API応答JSON（errors配列） | 買取情報が見つかりません | 本人確認更新で、パスの受注IDに対応する店頭買取受注が存在しないとき | HTTP 404・`{code, errors}`を返し、更新しない |
| A06-13-MSG-002 | API応答JSON（errors配列） | 正しい証明書IDを入力してください | 本人確認更新で本人確認証明書のIDが未指定のとき | HTTP 400・`{code, errors}`を返し、更新しない |
| A06-13-MSG-003 | API応答JSON（errors配列） | 正しい証明書IDを入力してください | 本人確認更新で指定した本人確認証明書のIDがマスタに存在しないとき | HTTP 404・`{code, errors}`を返し、更新しない |
| A06-13-MSG-004 | API応答JSON（errors配列） | 認証エラー | 本人確認更新で認証済み利用者を管理者会員として取得できないとき | HTTP 401・`{code, errors}`を返し、更新しない |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 認証 | P1 | pf-api:src/Controller/BaseController.php:23-45 |
| 判定の順序 | P1 | pf-api:src/Controller/Admin/OtcBuyOrderIdentificationController.php:20-44 |
| 更新する項目 | P1 | pf-api:src/Controller/Admin/OtcBuyOrderIdentificationController.php:46-53 |
| 入力: 認証情報 | P1 | pf-api:src/Controller/BaseController.php:25-29 |
| 出力: 認証できないとき | P1 | pf-api:src/Controller/BaseController.php:26-42 |
| 入出力: エンドポイントの別名 | P2 | pf-api:config/routes.yaml:53-56 |
| 入出力: 永続化 | P1 | pf-api:src/Controller/Admin/OtcBuyOrderIdentificationController.php:47-53 |
