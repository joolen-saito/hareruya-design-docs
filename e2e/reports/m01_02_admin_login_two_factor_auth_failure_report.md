# M01-02 二段階認証 E2E 失敗ケースのみレポート

実施日: 2026-07-06

実行コマンド:

```bash
e2e/seed/lib/apply.sh SEED-M01-02-2FA-SECRET SEED-M01-02-2FA-RESET SEED-M01-02-2FA-NOSECRET SEED-M01-02-2FA-NOSECRET-ONCE SEED-M01-02-2FA-OFF SEED-M01-02-2FA-LOCK
eval "$(e2e/seed/lib/seed-env.sh)" && cd e2e && npx playwright test spec/admin/two_factor_auth.spec.ts --reporter=list
```

結果: 056ハーネス実装前の全体実行は 16 passed / 10 failed / 2 skipped。056単体再実行は 1 passed。ケース表換算は 17〇 / 13×（skipped 1件と自動実行specなし2件を未実施扱いの×として含む）。

## × 明細

| テストID | 結果 | 失敗理由 |
|---|---|---|
| E2E-M01-02-003 | × | 初回設定画面GETで500。`admin_two_factor_auth_set` がシステムエラー画面になり、見出し `h5`「2段階認証」が存在しない。原因は `TwoFactorAuthController::set()` の戻り値型不整合（`RedirectResponse` 指定に対し array 返却）。 |
| E2E-M01-02-004 | × | 本人再設定画面GETで500。`admin_setting_system_two_factor_auth_edit` がシステムエラー画面になり、本文に「システム設定」が表示されない。原因は `TwoFactorAuthController::edit()` の戻り値型不整合（`RedirectResponse` 指定に対し array 返却）。 |
| E2E-M01-02-005 | × | 本人再設定画面GETで500。再設定警告の検出前にシステムエラー画面へ遷移する。原因は `TwoFactorAuthController::edit()` の戻り値型不整合。 |
| E2E-M01-02-011 | × | 初回設定画面が500のため、隠し項目 `#admin_two_factor_auth_auth_key` が出現せずタイムアウト。原因は `TwoFactorAuthController::set()` の戻り値型不整合。 |
| E2E-M01-02-012 | × | 本人再設定画面が500のため、隠し項目 `#admin_two_factor_auth_auth_key` が出現せずタイムアウト。原因は `TwoFactorAuthController::edit()` の戻り値型不整合。 |
| E2E-M01-02-020 | × | トークン空送信時にブラウザのHTML5 `required` 制約で送信が止まり、サーバー側 `.text-danger` の「トークンに誤りがあります。再度入力してください。」が表示されない。入力欄は追加認証画面に留まる。 |
| E2E-M01-02-030 | × | 初回設定画面が500のため、`#admin_two_factor_auth_device_token` が出現せずタイムアウト。原因は `TwoFactorAuthController::set()` の戻り値型不整合。 |
| E2E-M01-02-031 | × | 初回設定画面が500のため、隠し項目 `#admin_two_factor_auth_auth_key` が出現せずタイムアウト。原因は `TwoFactorAuthController::set()` の戻り値型不整合。 |
| E2E-M01-02-040 | × | 本人再設定画面が500のため、`#admin_two_factor_auth_device_token` が出現せずタイムアウト。原因は `TwoFactorAuthController::edit()` の戻り値型不整合。 |
| E2E-M01-02-041 | × | 本人再設定画面が500のため、隠し項目 `#admin_two_factor_auth_auth_key` が出現せずタイムアウト。原因は `TwoFactorAuthController::edit()` の戻り値型不整合。 |
| E2E-M01-02-057 | × | 未実施。システム2FA無効化は共有設定変更を伴う手動/隔離環境ケースで、今回の自動実行specなし。 |
| E2E-M01-02-080 | × | `test.fixme` で未実行。専用IP隔離とRateLimiter/Redis状態初期化ハーネスが未実装。 |
| E2E-M01-02-091 | × | 未実施。本人再設定成功後の旧秘密鍵無効化は、再設定画面が500で到達不能かつ複数手順の手動/間接ケースのため今回の自動実行specなし。 |
