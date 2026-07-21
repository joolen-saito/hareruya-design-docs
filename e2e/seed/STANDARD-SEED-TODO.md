# 標準機能シード整備TODO

生成日: 2026-07-06

## 方針

- `e2e/seed/README.md` の規約に合わせ、SQL は `sets/<module>/SEED-*.sql` と `.down.sql` で管理する。
- `manifest.json` に `tables` / `fixedIds` / `envVars` / `e2eCaseIds` を必ず追記する。
- 固定IDは `id-bands.md` に予約してから使う。
- 正常系・異常系・境界系を同じ機能単位でまとめ、再適用しても同じ状態に収束するよう UPSERT で作る。
- CSVや画像など入力ファイルで表現する異常系は `e2e/fixtures` 側に置き、DBシードと分離する。

## 追加予定セット

| 優先 | セット | 対象 | 観点 | 状態 |
|---:|---|---|---|---|
| 1 | `SEED-M01-ADMIN` | M01-01 | 正常ログイン、ログアウト、ログイン履歴 | 作成済 |
| 2 | `SEED-M01-DISABLED` | M01-01 | 停止中管理者の認証失敗 | 作成済 |
| 3 | `SEED-M01-LOCK` | M01-01 | 試行制限、ロック解除、リセット | 部分作成済（専用管理者のみ。RateLimiter状態はspec/setupで生成） |
| 4 | `SEED-M01-CUSTOMER` | M01-01 | フロント会員は管理画面不可 | 作成済 |
| 5 | `SEED-M01-02-2FA-SECRET` | M01-02 | 2FA成功、TOTP検証 | 作成済 |
| 6 | `SEED-M01-02-2FA-RESET` | M01-02 | 本人再設定成功で秘密鍵が変わる使い捨てユーザー | 作成済 |
| 7 | `SEED-M01-02-2FA-NOSECRET` | M01-02 | 初回設定画面・形式不正・TOTP不一致 | 作成済 |
| 8 | `SEED-M01-02-2FA-NOSECRET-ONCE` | M01-02 | 初回設定成功で秘密鍵が確定する使い捨てユーザー | 作成済 |
| 9 | `SEED-M01-02-2FA-OFF` | M01-02 | 2FA不要ユーザー | 作成済 |
| 10 | `SEED-M01-02-2FA-LOCK` | M01-02 | 2FA失敗・ロック系 | 部分作成済（専用管理者のみ。RateLimiter状態は未生成） |
| 11 | `SEED-M02-01-ORDER-STATUS` | M02-01 | 受注状況の表示対象/除外ステータス | 未作成 |
| 12 | `SEED-M02-01-ZERO-STATUS` | M02-01 | 0件ステータス表示 | 未作成 |
| 13 | `SEED-M02-SALES-INCLUDE` | M02-02/M02-03 | 今日/昨日/月次/年次売上集計 | 作成済（`SEED-M02-SALES-DASHBOARD` 実体） |
| 14 | `SEED-M02-SALES-EXCLUDE` | M02-02/M02-03 | 除外ステータス・キャンセル等 | 作成済（`SEED-M02-SALES-DASHBOARD` 実体） |
| 14-1 | `SEED-M02-SALES-ZERO` | M02-02/M02-03 | payment_total=0 | 作成済（`SEED-M02-SALES-DASHBOARD` 実体） |
| 14-2 | `SEED-M02-SALES-MULTILINE` | M02-02/M02-03 | 複数配送/複数明細 | 作成済（`SEED-M02-SALES-DASHBOARD` 実体） |
| 14-3 | `SEED-M02-SALES-BOUNDARY` | M02-02/M02-03 | 今日/昨日/月初/月末境界 | 作成済（`SEED-M02-SALES-DASHBOARD` 実体） |
| 14-4 | `SEED-M02-03-ORDERS` | M02-03 | 売上グラフ初期取得用の直近受注 | 作成済（`SEED-M02-SALES-DASHBOARD` 実体へのmanifestエイリアス） |
| 15 | `SEED-M02-04-ADMIN` | M02-04 | 表示/遷移系の有効管理者 | 作成済（`SEED-M01-ADMIN` 実体へのmanifestエイリアス） |
| 15-1 | `SEED-M02-04-SHOP` | M02-04 | 在庫切れ/取扱商品/会員数の集計値突合 | 未作成 |
| 15-2 | `SEED-M02-ADMIN` | M02-05 | ホーム表示用の有効管理者 | 作成済（`SEED-M01-ADMIN` 実体へのmanifestエイリアス） |
| 15-3 | `SEED-M02-INFOURL-DEFAULT` | M02-05 | お知らせiframe srcの既定非空URL | 作成済（DB変更なしのno-opシード） |
| 15-4 | `SEED-M02-INFOURL-EMPTY` | M02-05 | 空URL設定 | 未作成（環境設定変更が必要） |
| 15-5 | `SEED-M02-06-ADMIN` | M02-06 | 表示枠/遷移系の有効管理者 | 作成済（`SEED-M01-ADMIN` 実体へのmanifestエイリアス） |
| 15-6 | `SEED-M02-06-RECOMMEND` | M02-06 | 外部プラグインAPI推奨応答・状態別CTA | 未作成（サーバ側スタブAPI切替が必要） |
| 15-7 | `SEED-M02-06-APIFAIL` | M02-06 | 外部プラグインAPI失敗応答 | 未作成（サーバ側スタブAPI切替が必要） |
| 16 | `SEED-M05-12-ADMIN` / `SEED-M05-12-ORDER` | M05-12 | 対応状況一括変更の参照・選択・未選択警告（非破壊）。同一/遷移不可/配送完了など破壊的実行系は専用隔離データが別途必要 | 部分作成済（`SEED-M01-ADMIN` / `SEED-M05-ORDERS` 実体へのmanifestエイリアス） |
| 17 | `SEED-M05-13-ADMIN` / `SEED-M05-13-ORDER` | M05-13 | 問い合わせ番号の受注編集表示・文字種・空保存系。低権限管理者/一覧非同期UI/障害系は別途必要 | 部分作成済（`SEED-M01-ADMIN` / `SEED-M05-15-ORDER` 実体へのmanifestエイリアス） |
| 18 | `SEED-M05-14-ORDER` | M05-14 | 対応状況変更、キャンセル可否 | 未作成 |
| 19 | `SEED-M05-16-ORDER` | M05-16 | ショップ用メモの有無/更新 | 未作成 |
| 20 | `SEED-M05-17-ORDER` | M05-17 | 配達用メモ単一/複数配送 | 未作成 |
| 21 | `SEED-M09-CONTENT` | M09-01/02/03/05/06/08/09 | 新着/ファイル/レイアウト/CSS/JS/キャッシュ/メンテ | 未作成 |
| 22 | `SEED-M10-SETTING` | M10-11/12/14 | 受注状態/定休日/店舗一覧 | 未作成 |
| 23 | `SEED-M11-SYSTEM` | M11-04/05/06 | ログイン履歴/マスタ/システム情報/権限 | 未作成 |

## 最初に作る候補

M01-01 は `SEED-M01-ADMIN` / `SEED-M01-DISABLED` / `SEED-M01-2FA-ON` / `SEED-M01-CUSTOMER` / `SEED-M01-LOCK` を作成済み。
M01-02 は `SEED-M01-02-2FA-SECRET` / `RESET` / `NOSECRET` / `NOSECRET-ONCE` / `OFF` / `LOCK` を作成済み。
次は M02 系の集計・表示データをシード化する。

理由:
- M01-01 は標準機能の先頭で、現在の監査未完了箇所でもある。
- 初期表示はシード不要で実行可能。
- 認証成功/失敗/停止中/ログアウトは小さい固定データで再利用しやすい。
- M01-02 の 2FA ユーザーにも同じ管理者テーブルの知識を流用できる。
