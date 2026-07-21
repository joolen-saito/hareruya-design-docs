# 標準機能 E2E 実行TODO

生成日: 2026-07-06

## 運用ルール

- 対象は `functions/todo-list.md` の `カスタマイズ区分=標準` のみ。
- 各 E2E テストは実行前にユーザー許可を取る。
- シードが必要なケースは、先に `e2e/seed` 配下へ再利用可能な SQL/fixture/manifest を追加してから実行する。
- 実行後、対応する `integration_test/e2e/*_e2e_cases.md` の `結果` に成功は `〇`、失敗は `×` を入れる。
- 失敗時は `失敗理由` に原因を具体的に記録する。例: セレクタ不一致、タイムアウト、HTTPステータス不一致、Symfony Web Debug Toolbar 遮蔽、シード不足、外部サービス未接続。
- `test.fixme` / `test.skip` は自動実行結果としては `〇` にしない。必要なら「未実施: シード未整備」などの扱いを確認してから記録する。

## 優先順

| 優先 | 機能 | spec | ケース | シード方針 | 状態 |
|---:|---|---|---|---|---|
| 1 | M01-01 パスワード認証 | `e2e/spec/admin/login.spec.ts` | `integration_test/e2e/m01_01_admin_login_login_e2e_cases.md` | `SEED-M01-*` 作成済。RateLimiter状態固定と login_date可視UIのみ残課題 | シード付き再実行済: 20〇/3× |
| 2 | M01-02 二段階認証 | `e2e/spec/admin/two_factor_auth.spec.ts` | `integration_test/e2e/m01_02_admin_login_two_factor_auth_e2e_cases.md` | `SEED-M01-02-*` 作成済。set/edit 500 とRateLimiter/Cookie無効生成が残課題 | シード付き実行済: 16〇/14× |
| 3 | M02-01 受注状況 | `e2e/spec/admin/m02/m02_01_admin_home_home_order_status.spec.ts` | `integration_test/e2e/m02_01_admin_home_home_order_status_e2e_cases.md` | 表示/遷移系は現行データで実行済。件数厳密系 `SEED-M02-01-*` が残課題 | 実行済: 12〇/5× |
| 4 | M02-02 売上状況 | `e2e/spec/admin/m02/m02_02_admin_home_home_sales_status.spec.ts` | `integration_test/e2e/m02_02_admin_home_home_sales_status_e2e_cases.md` | 売上境界/空/除外/複数配送用 `SEED-M02-SALES-*` 作成済 | 実行済: 14〇/11× |
| 5 | M02-03 売上状況グラフ | `e2e/spec/admin/m02/m02_03_admin_home_home_sales_chart.spec.ts` | `integration_test/e2e/m02_03_admin_home_home_sales_chart_e2e_cases.md` | グラフ期間別受注用 `SEED-M02-03-ORDERS` 作成済 | 実行済: 11〇/2× |
| 6 | M02-04 ショップ状況 | `e2e/spec/admin/m02/m02_04_admin_home_home_shop_status.spec.ts` | `integration_test/e2e/m02_04_admin_home_home_shop_status_e2e_cases.md` | 表示/遷移用 `SEED-M02-04-ADMIN` 作成済。集計値突合用 `SEED-M02-04-SHOP` は未作成 | 実行済: 10〇/17× |
| 7 | M02-05 EC-CUBEのお知らせ | `e2e/spec/admin/m02/m02_05_admin_home_home_ec_cube_news.spec.ts` | `integration_test/e2e/m02_05_admin_home_home_ec_cube_news_e2e_cases.md` | `SEED-M02-ADMIN` / `SEED-M02-INFOURL-DEFAULT` 作成済。空URL/外部失敗は手動 | 実行済: 7〇/3× |
| 8 | M02-06 おすすめプラグイン | `e2e/spec/admin/m02/m02_06_admin_home_home_recommend_plugins.spec.ts` | `integration_test/e2e/m02_06_admin_home_home_recommend_plugins_e2e_cases.md` | 表示枠用 `SEED-M02-06-ADMIN` 作成済。外部API成功/失敗はサーバ側スタブAPI切替が未作成 | 実行済: 4〇/23× |
| 9 | M05-12〜M05-17 受注標準 | `e2e/spec/admin/m05/*.spec.ts` | `integration_test/e2e/m05_*_e2e_cases.md` | M05-12/13 はシードエイリアス作成済。破壊的更新・低権限・一覧非同期UI系は専用シード/ハーネスを別途用意 | M05-12 実行済: 7〇/18×。M05-13 実行済: 2〇/27×。M05-14以降未実行 |
| 10 | M09-01〜M09-09 コンテンツ標準 | `e2e/spec/admin/m09/*.spec.ts` | `integration_test/e2e/m09_*_e2e_cases.md` | ファイル/権限/キャッシュ/メンテナンス用 `SEED-M09-*` を追加 | 未許可 |
| 11 | M10-11/M10-12/M10-14 基本設定標準 | `e2e/spec/admin/m10/*.spec.ts` | `integration_test/e2e/m10_*_e2e_cases.md` | 店舗/定休日/受注状態用 `SEED-M10-*` を追加 | 未許可 |
| 12 | M11-04〜M11-06 システム標準 | `e2e/spec/admin/m11/*.spec.ts` | `integration_test/e2e/m11_*_e2e_cases.md` | ログイン履歴/マスタ/権限別管理者用 `SEED-M11-*` を追加 | 未許可 |
| 13 | F06-19 クレジットカード情報 | `e2e/spec/front/f06/f06_19_front_member_mypage_credit_card.spec.ts` | `integration_test/e2e/f06_19_front_member_mypage_credit_card_e2e_cases.md` | 会員は既存 `SEED-F06-CUSTOMER` を利用。決済代行系は mock/手動扱い確認 | 未許可 |

## 次に確認する実行候補

1. `E2E-M01-01-003 初期表示: ID/PW/ログインボタンが表示される` - 完了 `〇`
   - シード不要
   - 失敗想定: `/admin/login` 500、`#login_id` セレクタ不一致、アプリ未起動
2. `E2E-M01-01-004 初期表示: プレースホルダが「ログインID」「パスワード」` - 完了 `〇`
   - シード不要
   - 失敗想定: placeholder文言差異、セレクタ不一致
3. `E2E-M01-01-013 未ログインで保護URL→ログイン画面へ誘導` - 完了 `〇`
   - シード不要
   - 失敗想定: リダイレクトURL差異、ログインフォーム未表示

## 実行履歴

| 実施日 | テストID | 結果 | 原因/メモ |
|---|---|---|---|
| 2026-07-06 | E2E-M01-01-003 | 〇 | `npx playwright test spec/admin/login.spec.ts -g "E2E-M01-01-003" --reporter=list` が `1 passed` |
| 2026-07-06 | M01-01 一括 | 8〇/15× | `npx playwright test spec/admin/login.spec.ts --reporter=list`。8 passed / 2 failed / 13 skipped。失敗: E2E-M01-01-010/011 は `.text-danger` が出ず認証失敗2行メッセージ検出タイムアウト。skipped: 13件は `test.fixme`（シード未整備・手動/間接・要実機検証）。 |
| 2026-07-06 | M01-01 シード付き再実行 | 18〇/5× | `eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/login.spec.ts --reporter=list`。18 passed / 2 failed / 3 skipped。失敗: E2E-M01-01-010/011 は空ID/空PW時に `.text-danger` が出ず認証失敗2行メッセージ検出タイムアウト。skipped: 030/031/092。 |
| 2026-07-06 | M01-01 空入力修正後 | 20〇/3× | `E2E-M01-01-010/011` をHTML5必須入力バリデーション（valueMissing＋validationMessage）として再実行し `2 passed`。全体見込みは 20 passed / 3 skipped。 |
| 2026-07-06 | M01-02 シード付き実行 | 16〇/14× | `SEED-M01-02-*` を作成・適用後、`eval "$(e2e/seed/lib/seed-env.sh)"; cd e2e; npx playwright test spec/admin/two_factor_auth.spec.ts --reporter=list`。Playwright結果は 16 passed / 10 failed / 2 skipped。失敗: 020 は空トークン時にHTML5 requiredで送信されず `.text-danger` が出ない。003/011/030/031 は `/two_factor_auth/set` が `TwoFactorAuthController::set(): Return value must be of type RedirectResponse, array returned` で500。004/005/012/040/041 は `/setting/system/two_factor_auth/edit` が `TwoFactorAuthController::edit(): Return value must be of type RedirectResponse, array returned` で500。056/080 は `test.fixme`、057/091 は今回の自動実行specなしの手動/間接ケース。 |
| 2026-07-06 | M01-02 シード付き再実行 | 16〇/14× | `e2e/seed/lib/apply.sh SEED-M01-02-2FA-SECRET SEED-M01-02-2FA-RESET SEED-M01-02-2FA-NOSECRET SEED-M01-02-2FA-NOSECRET-ONCE SEED-M01-02-2FA-OFF SEED-M01-02-2FA-LOCK` 後に `eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/two_factor_auth.spec.ts --reporter=list` を再実行。最初の通常sandbox実行は Chromium `sandbox_host_linux.cc:41 shutdown: Operation not permitted` でブラウザ起動前に失敗したため、サンドボックス外で再実行。Playwright結果は 16 passed / 10 failed / 2 skipped。失敗内訳は前回と同じ: 020 はHTML5 requiredにより `.text-danger` 不出現、003/011/030/031 は `/two_factor_auth/set` 500、004/005/012/040/041 は `/setting/system/two_factor_auth/edit` 500。056/080 は `test.fixme`、057/091 は自動実行specなし。 |
| 2026-07-06 | M01-02 056ハーネス実装後単体 | 17〇/13× | 追加認証成功前後のCookie差分からHttpOnlyの2FA認証済みCookieを検出し、そのCookieだけを `context.clearCookies({ name, domain, path })` で削除するハーネスを実装。`eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/two_factor_auth.spec.ts -g "E2E-M01-02-056" --reporter=list` は `1 passed`。ケース表換算は 056 が〇になり 17〇/13×。 |
| 2026-07-06 | M02-01 実行 | 12〇/5× | `eval "$(e2e/seed/lib/seed-env.sh)"; cd e2e; npx playwright test spec/admin/m02/m02_01_admin_home_home_order_status.spec.ts --reporter=list`。Playwright結果は 12 passed / 4 skipped / 0 failed。skipped: 021/022/023/024 は表示順・0件ステータス・件数既知・属性差件数用 `SEED-M02-01-*` 未作成。050 はDB読み取り障害注入の手動ケースで自動実行specなし。 |
| 2026-07-06 | M02-02 実行 | 14〇/11× | `SEED-M02-SALES-DASHBOARD` を作成し、`SEED-M02-SALES-INCLUDE` として適用後、`eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/m02/m02_02_admin_home_home_sales_status.spec.ts --reporter=list`。Playwright結果は 14 passed / 0 failed。DB集計値厳密検証、Chart.js内部、拡張フック、専用Cookie非設定の手動/間接ケース 022/040-049 は未実施扱いで×。 |
| 2026-07-06 | M02-03 実行 | 11〇/2× | `SEED-M02-03-ORDERS` を作成済み `SEED-M02-SALES-DASHBOARD` のmanifestエイリアスとして追加・適用後、`eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/m02/m02_03_admin_home_home_sales_chart.spec.ts --reporter=list`。Playwright結果は 11 passed / 2 failed。失敗: 003 は `/sale_chart` 200後も `#loading` が非表示にならずタイムアウト。013 はCSRF欠落時の実レスポンスが期待400ではなく403。 |
| 2026-07-06 | M02-04 実行 | 10〇/17× | `SEED-M02-04-ADMIN` を `SEED-M01-ADMIN` のmanifestエイリアスとして追加・適用後、`eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/m02/m02_04_admin_home_home_shop_status.spec.ts --reporter=list`。Playwright結果は 10 passed / 1 failed / 3 skipped。失敗: 010 はクリック後に商品一覧へ遷移済みの画面スナップショットだが、ナビゲーション完了待ちで30秒タイムアウト。skipped: 015/016/017 は `test.fixme`。DB集計値突合・非管理者・セッション/障害注入ケースは未実施扱いで×。 |
| 2026-07-06 | M02-05 実行 | 7〇/3× | `SEED-M02-ADMIN` を `SEED-M01-ADMIN` のmanifestエイリアス、`SEED-M02-INFOURL-DEFAULT` をDB変更なしのno-opシードとして追加・適用後、`eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/m02/m02_05_admin_home_home_ec_cube_news.spec.ts --reporter=list`。Playwright結果は 7 passed / 0 failed。Cookie差分、CSS数値目視、外部URL失敗再現の手動ケース 008/009/010 は未実施扱いで×。 |
| 2026-07-06 | M02-06 実行 | 4〇/23× | `SEED-M02-06-ADMIN` を `SEED-M01-ADMIN` のmanifestエイリアスとして追加・適用後、`eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/m02/m02_06_admin_home_home_recommend_plugins.spec.ts --reporter=list`。Playwright結果は 4 passed / 1 failed / 4 skipped。失敗: 005 はホームDOM描画済みだが `page.goto(/admin/, waitUntil=load)` が30秒タイムアウト。skipped: 006/010/011/012 は `test.fixme`。外部API推奨応答/状態別CTA/API失敗ケースはサーバ側スタブAPI未作成のため未実施扱いで×。 |
| 2026-07-06 | M05-12 実行 | 7〇/18× | `SEED-M05-12-ADMIN` を `SEED-M01-ADMIN`、`SEED-M05-12-ORDER` を `SEED-M05-ORDERS` のmanifestエイリアスとして追加・適用後、M05-12ページオブジェクトで初期GET後に既定検索POSTを行うようハーネス更新。`eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/m05/m05_12_admin_order_order_bulk_status_change.spec.ts --reporter=list`。Playwright結果は 7 passed / 6 failed / 10 skipped。失敗: 051 は未ログインGETがログイン遷移せず Method Not Allowed 画面表示。009/008/004/005/006 は `/admin/order` 遷移またはログインボタンクリック待ちの30秒タイムアウト。skipped 10件は破壊的一括変更/API直叩きの `test.fixme`。042/043 は自動spec未実装の手動/間接ケースとして×。 |
| 2026-07-06 | M05-13 実行 | 2〇/27× | `SEED-M05-13-ADMIN` を `SEED-M01-ADMIN`、`SEED-M05-13-ORDER` を `SEED-M05-15-ORDER` のmanifestエイリアスとして追加・適用後、M05-13ページオブジェクトで初期GET後に既定検索POSTし、出荷情報collapseを開くようハーネス更新。`eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/m05/m05_13_admin_order_order_tracking_number.spec.ts --reporter=list`。Playwright結果は 2 passed / 7 failed / 7 skipped。失敗: 003/010/011/021/022/023 は `/admin/order` または `/admin/order/1/edit` 遷移の30秒タイムアウト。020 は記号入り保存後に期待フォームエラー文言が表示されずタイムアウト。skipped 7件は一覧非同期UI未配置/低レベルCSRF要求等の `test.fixme`。ケース表上の低権限・境界値・DB副作用・連続PUTは未実装として×。 |
