# M01 E2E Seed Sets

M01-02 二段階認証の再利用シードは以下の6セット。

| Seed ID | 用途 | 破壊性 |
| --- | --- | --- |
| `SEED-M01-02-2FA-SECRET` | 個別2FA ON、既知TOTP秘密鍵あり。追加認証、遷移、Cookie、ヘッダリンク確認用 | 参照系向け |
| `SEED-M01-02-2FA-RESET` | 本人再設定成功系。既知TOTP秘密鍵あり | 成功時に秘密鍵が更新されるため再適用が必要 |
| `SEED-M01-02-2FA-NOSECRET` | 個別2FA ON、秘密鍵NULL。初回設定画面の参照・異常系用 | 参照系向け |
| `SEED-M01-02-2FA-NOSECRET-ONCE` | 初回設定成功系。秘密鍵NULL | 成功時に秘密鍵が保存されるため再適用が必要 |
| `SEED-M01-02-2FA-OFF` | 個別2FA OFF。追加認証スキップ、ヘッダリンク非表示確認用 | 参照系向け |
| `SEED-M01-02-2FA-LOCK` | 試行制限確認用の専用管理者 | RateLimiter/Redis状態は別ハーネスで初期化が必要 |

適用:

```bash
e2e/seed/lib/apply.sh SEED-M01-02-2FA-SECRET SEED-M01-02-2FA-RESET SEED-M01-02-2FA-NOSECRET SEED-M01-02-2FA-NOSECRET-ONCE SEED-M01-02-2FA-OFF SEED-M01-02-2FA-LOCK
eval "$(e2e/seed/lib/seed-env.sh)"
```

破壊系の `SEED-M01-02-2FA-RESET` と `SEED-M01-02-2FA-NOSECRET-ONCE` を使うテストを再実行する前は、同じ `apply.sh` を再実行して既知状態へ戻す。

撤去:

```bash
e2e/seed/lib/teardown.sh SEED-M01-02-2FA-SECRET SEED-M01-02-2FA-RESET SEED-M01-02-2FA-NOSECRET SEED-M01-02-2FA-NOSECRET-ONCE SEED-M01-02-2FA-OFF SEED-M01-02-2FA-LOCK
```
