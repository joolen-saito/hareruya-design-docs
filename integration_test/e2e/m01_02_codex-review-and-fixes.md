# Codexレビュー結果と対応（m01-02 二段階認証 E2E）

`codex exec`（読み取り専用）で本機能のE2E成果物（ケース表・Playwright雛形）を2巡レビューし、反映した。

## 対象成果物
- ケース表: `integration_test/e2e/m01_02_admin_login_two_factor_auth_e2e_cases.md`
- Playwright: `e2e/pages/admin/two_factor_auth.page.ts` / `e2e/spec/admin/two_factor_auth.spec.ts` / `e2e/helpers/totp.ts`

## 自検証で裏付けた事実（ec-cube-enterprise 現行ソース）
- フォーム getBlockPrefix=`admin_two_factor_auth`（`TwoFactorAuthType.php:62-64`）→ DOM id は `#admin_two_factor_auth_device_token` / `_auth_key` / `__token`。追加認証画面は `auth_key` を `remove`（`TwoFactorAuthController.php:52`）。
- 追加認証は失敗理由を区別せず `invalid_message__reinput`（Controller.php:65,71 / messages.ja.yaml:3027）。初回設定・本人再設定は形式不正=`invalid_message__invalid`（:154 / :3028）、TOTP不一致=`reinput`（:151）。
- 成功メッセージ `...complete_message`（:3025）、再設定警告 `...configured_warning`（:3024）、試行制限 `exception.error_message_rate_limit`（:3585）。
- TOTPは RobThree 既定（SHA1/30秒/6桁/base32）、`verifyCode($authKey,$token,2)`（Service:115-117）。認証済みCookie `eccube_2fa`（:34）HttpOnly=true（:109）、Secure/SameSite は force_ssl 連動（:108-111）。TOTPヘルパは RFC6238 公式ベクタ3件で一致確認済。

## 1巡目の指摘と対応（高→低）
| 指摘 | 深刻度 | 対応 |
|------|--------|------|
| 母集合90行の「未分類0」が監査不能（行単位対応が別途扱い） | 高 | **付帯表2bに全90行の行単位分類**を追加。サマリ(自動化/手動/対象外)をその集計に一致させた |
| 設計書網羅マトリクスの#1誤り（055を判定順序#1と誤記） | 高 | #1〜#8を行単位に分解。**#1=システム2FA無効を独立ケースE2E-M01-02-057(手動・設定切替要)**化。title/noscript/著作権/Cookie期限/メンバー画面も行単位で区分明示 |
| Cookie名 `eccube_2fa` 固定＝オラクル混入 | 高 | ケース表090とspecを**「認証前後のCookie差分＋HttpOnly」**判定へ。名称は環境変数 `ECCUBE_2FA_COOKIE_NAME` 由来で仕様非固定と明記 |
| 本人再設定(012)が共通SECRET秘密鍵を破壊 | 高 | **使い捨て SEED-M01-02-2FA-RESET(TFA_RESET_*)** に分離 |
| ケース表とspecの「1:1」表明が不正確 | 中 | ヘッダを「自動化のみ実装/056・080はfixme/手動はケース表管理」に修正 |
| URLアサーションが弱い（auth/login以外、で判定） | 中 | 成功遷移を `HOME_RE`(/<route>/) で明示確認 |
| `mismatchTotp` のフレーク余地 | 中 | 現在時刻±2ステップの全有効コードを除外する実装へ |
| 管理fixture規約からの逸脱理由が未記載 | 中 | 既存 `login.spec.ts` に倣う旨と複数シードユーザー事情をヘッダに明記 |
| セレクタ根拠 file:line のずれ | 低 | 現行ソース基準（remove=52, error=65/71/151/154, httpOnly=109 等）へ更新 |
| 本人再設定UIアサーション不足 | 低 | 004 にサブタイトル「システム設定」・必須バッジを追加 |

## 2巡目（是正確認）の残指摘と対応
| 指摘 | 深刻度 | 対応 |
|------|--------|------|
| Cookie判定がまだ偽陽性（baselineがログイン前＋名称無しで任意HttpOnly採用） | 高 | **baselineを追加認証画面到達後**に変更し、TOTP送信後の差分から**`COOKIE_NAME` のCookieを必須**確認（任意HttpOnlyフォールバックを廃止） |
| `mismatchTotp` 境界時刻フレーク（30秒境界跨ぎで+3stepが有効化し得る） | 中 | 除外範囲を**±3ステップ**へ拡張 |
| 観点行分類の内部矛盾（IT-25 012/013 の観点と対応E2Eがずれ） | 中 | 012(確認ダイアログ)・013(送信可否制御)を**対象外へ再分類**（本機能は当該機構を持たない）。IT-25集計を 2/0/7、合計 27/3/60 に更新 |

2巡目で codex は「1,2の大枠・4・5・6・8 は妥当」と確認。上記3点も本対応で是正済み。

## 総評
追加認証／初回設定／本人再設定の3画面の正常系・異常系（判定順序#1-8・形式不正/TOTP不一致の文言差・成功メッセージ・再設定警告・誘導遷移・Cookie付与）を設計書本文起点で網羅。オラクルは設計書・messages.ja.yaml 由来で固定し、Form/Type 制約や Cookie 名を期待値に流用していない。残課題: 元ITケースID（接頭辞 `IT-M01-02-ADMIN-LOGIN-TWO-FACTOR-AUTH-`）の個別対応付けの精緻化、試行制限(080)・本人再設定Cookie無効(056)の実行基盤整備。
