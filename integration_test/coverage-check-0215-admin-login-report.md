# 結合試験テストケース 網羅性チェックレポート — 0215 管理画面ログイン

点検日: 2026-06-19 / 点検者: 自動点検（設計書・ソース・テスト観点表の3軸クロスリファレンス）

## 1. 概要

`excel_to_html/output/0215_基本設計仕様書(管理画面ログイン).html`（管理画面ログイン機能の基本設計＝詳細設計）を起点に、対応する結合試験テストケースが **網羅的に記載できているか** を、ソースコード（`ec-cube-enterprise`）とテスト観点表（`integration-test-viewpoints.md`）に照らして点検した。

### 対象成果物

| 層 | ファイル |
|----|----------|
| 基本設計（起点） | `excel_to_html/output/0215_基本設計仕様書(管理画面ログイン).html` |
| 機能詳細 | `function_spec_html_preview/ec-cube-enterprise/m01-01_admin_login_login.html`, `m01-02_admin_login_two_factor_auth.html` |
| 既存IT cases | `integration_test/m01_01_admin_login_login_it_cases.md`（本体 約90ケース）, `m01_02_admin_login_two_factor_auth_it_cases.md`（本体 約90ケース） |
| テスト観点表 | `integration_test/integration-test-viewpoints.md`（IT-01〜IT-33） |
| ソース | `ec-cube-enterprise/`（管理画面ログイン・2FA・試行制限・ログイン履歴） |
| 判定基準 | `.cursor/skills/integration-test-cases/{TERMINOLOGY.md,TEMPLATE.md,CHECKLIST.md}` |

### 結論サマリ

**網羅的な記載は「可能」だが、現状の自動生成ケースは網羅できていない。** 観点の枠（IT-ID）は概ね用意され、対象外観点も理由付きで分離できているが、**設計書・ソースが明記する具体挙動（ログイン履歴のDB記録、試行制限ロック、認証済みCookie属性・分岐、2FA試行制限）が試験項目として欠落または定型文止まり**で、このままでは試験を実施できない。

| 区分 | 件数感 | 概要 |
|------|--------|------|
| (A) 不足観点 | 主要6件 | ログイン履歴DB記録(成功/失敗)、最終ログイン日時更新、試行制限ロック挙動、2FA POST試行制限、認証済みCookie有効時のスキップ分岐、セッション非保存情報 |
| (B) 観点ラベル不整合／過剰行 | 数件 | 本体に IT-11(メール)＝観点「WebSocket」など、ログインに無関係・観点表と不一致の行が混入 |
| (C) 具体化不足 | ほぼ全行（各90/90行） | `前提条件`・`操作手順` が100%定型文、`期待結果` が複合・抽象で1行1判定になっていない |
| 整合(良) | — | IT-33/IT-16/IT-24/IT-27 等の無関係観点は「対象外観点表」に理由付きで正しく分離済み |

---

## 2. 設計書0215が定義する検証対象（スコープ棚卸し）

設計書本文（根拠キーワードは設計書中の実文言）から、結合試験で確認すべき具体挙動を抽出した。

### 2.1 画面・操作
- ログイン画面（GET/POST `/{admin}/login`）：ログインID欄・パスワード欄・送信ボタン・エラー表示領域・CSRF/なりすまし対策トークン（隠し）。
- 追加認証画面（POST `/{admin}/two_factor_auth/auth`）：6桁トークン入力欄・認証ボタン。
- 初回設定画面（GET/POST `/{admin}/two_factor_auth/set`）：QRコード表示・秘密鍵候補（隠し）・トークン入力・登録ボタン。
- 本人再設定画面（GET/POST `/{admin}/setting/system/two_factor_auth/edit`）：QR・トークン（必須）・登録ボタン・再設定警告。
- ログアウト（GET `/{admin}/logout`）。

### 2.2 ログイン送信の判定順序（設計書「判定順序」）
未入力→CSRF不整合→試行制限→ID不一致→停止/不可→パスワード不一致→（成功かつ2FA要）追加認証画面→（成功かつ2FA不要）ホーム。失敗系は画面上で区別せず同一2行メッセージ「ログインできませんでした。入力内容に誤りがないかご確認ください。」。

### 2.3 ログイン試行制限（設計書「固定窓方式 5回/30分」）
- 固定窓：5回 / 30分。判定単位＝「ログインID×IP」および「IP単体」の両方。認証成立前に評価。
- 制限時：ログイン不成立、ログイン画面に制限状態を表示。
- 解除：30分経過で消費トークン解消／ログイン成功でリセット。
- メッセージ：分数算出可「ログイン試行回数が多すぎます。{N}分後に再度お試しください。」／不可「ログイン試行回数を超えました。しばらくして再度お試しください。」
- 2FA追加認証POST：ユーザー単位 5回/30分、「試行回数の上限を超過しました。…」。

### 2.4 認証済みCookie・セッション
- 二段階認証済みCookie `eccube_2fa`：HTTPOnly、有効期限（環境変数、後述ソースで14日）、Path=管理ルート、Cookie値はJSON（管理者ID別ハッシュ＋時刻）。有効なら追加認証を省略。
- 管理Remember Me Cookie `eccube_admin_remember_me`：86400秒。
- セッションへ保存しない情報：パスワード、Cookie値、OTP、秘密鍵、認証済みCookie値。

### 2.5 DB記録（設計書「ログイン履歴」`dtb_login_history`）
- 成功：管理者ID・ログインID・成功区分・IP・店舗文脈・日時を記録、`dtb_member.login_date` 更新。
- 失敗：ログインID・失敗区分・IP・店舗文脈・日時を記録（管理者不存在時 member_id=NULL）。
- ログアウト/自動ログアウトは履歴に保存しない。

---

## 3. ソース側で確定した照合基準（実装値）

| 項目 | 実装値 | 根拠(file:line) |
|------|--------|-----------------|
| 試行制限 上限/期間 | 5回 / 30分（dev環境のみ30回） | `app/config/eccube/packages/eccube.yaml:265-266`, `dev/eccube.yaml:2` |
| 試行制限 設定 | `login_throttling: app.login_rate_limiter`、limiter=login_local/login_global | `security.yaml:62-63`, `framework.yaml:70-79` |
| 2FA Cookie名 | `eccube_2fa` | `eccube.yaml:24`, `TwoFactorAuthService.php:34` |
| 2FA Cookie 有効期限 | **14日**（`time()+14*24*60*60`、0でセッション） | `eccube.yaml:25`, `TwoFactorAuthService.php:105` |
| 2FA Cookie 属性 | HTTPOnly=true、Secure/SameSite=force_ssl連動、Path=`/{admin}/` | `TwoFactorAuthService.php:106-111` |
| 2FA トークン | 6桁固定、TimeWindow=2 | `TwoFactorAuthType.php:39-42`, `TwoFactorAuthService.php:115-118` |
| 2FA 未設定誘導 | `getTwoFactorAuthKey()`==null→設定画面、値あり→認証画面 | `TwoFactorAuthListener.php:68-71` |
| ログイン履歴テーブル | `dtb_login_history`（user_name/client_ip/status_id/member_id/日時） | `Entity/LoginHistory.php:26-61` |
| 履歴 成功記録 | REQUESTイベント＋セッションフラグ条件でpersist | `LoginHistoryListener.php:49,59-85` |
| 履歴 失敗記録 | LoginFailureEvent＋isAdmin()、直INSERT（member_id無ければnull） | `LoginHistoryListener.php:50,98,118-131` |
| 履歴ステータス | FAILURE=0 / SUCCESS=1 | `Entity/Master/LoginHistoryStatus.php:32,37` |
| ログインフォーム | login_id(NotBlank,max50) / password(NotBlank,max50) | `Form/Type/Admin/LoginType.php:41-53` |
| ログイン route/Controller | `admin_login` GET/POST、`AdminController::login()` | `Controller/Admin/AdminController.php:67-92` |
| Remember Me(管理) | lifetime=86400, name=`eccube_admin_remember_me`, secure, samesite=none | `security.yaml:53-61` |

### 設計書 ⇔ ソースの不一致（要確認）
- **パスワード最小長12桁の事前チェック（`LoginPasswordLengthCheckListener`, priority256, `<12`でCustomUserMessageAuthenticationException）は「顧客ログイン専用」で、管理画面ログインには適用されない**（`LoginPasswordLengthCheckListener.php:49,54`、対象フィールド`login_pass`）。→ 管理ログインのIT caseに「12桁未満で認証失敗」ケースを追加するのは誤り。設計書も管理画面の最小長は断定しておらず整合。
- 2FA Cookie有効期限：設計書の一部記述「デフォルト1日」に対し、ソース実装は **14日**（`eccube.yaml:25`）。設計書側の記述に揺れがあり、試験の期待値はソース＝14日を正とすべき。

---

## 4. 既存IT cases の現状

両ファイルとも本体TSVは **約90ケース**。操作手順は **90/90行が定型文「対象画面を表示する／〜を確認する／画面表示と後続状態を確認する」**（具体操作なし）。

### 本体で使用している観点(I/FID)分布

| ファイル | 観点分布（本体） |
|----------|------------------|
| m01_01（パスワード認証） | IT-22×35, IT-25×23, IT-20×11, IT-12×7, IT-03×7, IT-15×5, IT-13×1, IT-11×1 |
| m01_02（二段階認証） | IT-22×35, IT-23×22, IT-26×16, IT-25×9, IT-03×7, IT-13×1 |

> 注: 自動カウントの再現は `awk '/^```tsv/{f=1;next}/^```/{f=0}f' <file> | awk -F'\t' 'NR>1{print $3}' | sort | uniq -c`（複数行セルの継続行は空欄として除外）。

**観察:**
- m01_01（ログイン処理本体）に **IT-23（DB検索）/IT-26（DB登録）が0件**。ログインは `dtb_login_history` に成功/失敗を記録し `dtb_member.login_date` を更新する＝DB書込みが中核挙動であるにも関わらず、DB状態を検証する観点が本体に無い。
- IT-33/IT-16/IT-24/IT-27/IT-28/IT-29/IT-18 等は本体ではなく **対象外観点表に「元設計HTMLに該当する処理・I/Fがないため」として正しく分離**されている（過剰カバーは概ね回避できている）。

---

## 5. ギャップ一覧

類型: (A)不足 / (B)観点不整合・過剰 / (C)具体化不足

| # | 機能観点 | 該当IT-ID | 設計書・ソース根拠 | 既存ケース | 類型 | 是正提案 |
|---|----------|-----------|--------------------|-----------|------|----------|
| 1 | ログイン成功の履歴記録 | IT-26(登録) | 設計書「ログイン成功→履歴記録」/ `LoginHistoryListener.php:77-85`, status SUCCESS=1 | m01_01本体に無し（履歴は IT-22数値バリデーション行に複合言及のみ） | A | `dtb_login_history` に成功区分=1・管理者ID・IP・日時が1件登録されることを検証するDB登録ケースを追加 |
| 2 | ログイン失敗の履歴記録 | IT-26(登録) | 設計書「失敗→失敗区分で記録、member_id NULL可」/ `LoginHistoryListener.php:118-131`, FAILURE=0 | 無し | A | 存在しないID/パスワード不一致で失敗区分=0・user_name・IPが登録、管理者不存在時 member_id=NULL を検証 |
| 3 | 最終ログイン日時更新 | IT-26(更新) | 設計書「最終ログイン日時を更新」/ `dtb_member.login_date` | 無し（複合言及のみ） | A | 成功時に `dtb_member.login_date` が更新され、失敗時は更新されないことを検証 |
| 4 | 試行制限ロックの具体挙動 | IT-22(必須制御)/IT-12 | 設計書「5回/30分・{N}分メッセージ・ID×IPとIP単体」/ `eccube.yaml:265-266` | 「試行制限」言及はあるが複合・抽象（「入力値,CSRF,試行制限…を評価し認証可否を判定」） | A/C | 5回連続失敗で6回目がロック、画面に「{N}分後に…」表示、成功でリセット、30分経過で解除、ID×IP/IP単体の各カウント単位を別ケース化 |
| 5 | 認証済みCookie有効時のスキップ分岐 | IT-25/IT-12 | 設計書「認証済みCookie有効→追加認証省略」/ `TwoFactorAuthService.php:65-86` | 限定的（ホーム/省略の言及3行のみ、Cookie属性は抽象） | A/C | Cookie有効でホーム直行・無効/期限切れで追加認証画面、Cookie値JSON・HTTPOnly・Path・14日期限を観測値で検証 |
| 6 | 2FA追加認証POSTの試行制限 | IT-22(必須制御) | 設計書「追加認証POST ユーザー単位5回/30分・専用文言」 | m01_02本体に「試行」0件 | A | 6桁トークン誤りを上限回繰り返した後ロックし「試行回数の上限を超過しました。…」表示を検証 |
| 7 | セッション非保存情報 | IT-15(セキュリティ)/IT-20 | 設計書「セッションへ保存しない情報：パスワード/OTP/秘密鍵/Cookie値」 | 無し | A | ログイン後セッションにパスワード・OTP・秘密鍵原値が保持されないことを検証 |
| 8 | IT-11行の観点不整合 | IT-11 | 観点表 IT-11＝「メール処理/実行結果」。当該行は観点列「WebSocket」、内容はタブ`<title>`確認。ログインにメール/WebSocketは無い | m01_01本体に混入 | B | 観点表に整合する観点へ付け替え（タブtitleは IT-25表示結果へ）、IT-11(メール)は対象外観点表へ移動 |
| 9 | 操作手順・前提の定型文 | 全観点 | CHECKLIST「期待結果は1行1判定・観測可能な一文」「項目名は行ごと具体化」 | 90/90行が定型文 | C | 各ケースの前提（DB初期状態・2FA設定状態）と操作（URL・入力値・ボタン）を機能固有値で記述し直す |
| 10 | 期待結果の複合記述 | IT-22 等 | TERMINOLOGY「1行1判定」 | 「入力値,CSRF,試行制限,管理者状態,パスワードを評価し認証可否を判定」等の複合一文が散見 | C | 判定単位（未入力/CSRF/試行制限/ID/停止/パスワード）ごとに行分割し、各行を観測可能な単一判定に |

---

## 6. 観点整合の評価

### 6.1 良好な点
- 無関係観点（IT-33数量・金額、IT-16/IT-24ファイル取込・出力、IT-27ファイル操作、IT-18帳票、IT-28メール、IT-29電文）は **対象外観点表に理由付きで分離**されており、過剰カバーは概ね回避できている。

### 6.2 是正が必要な点（観点表との不整合）
- m01_01本体の **IT-11行に観点「WebSocket」** 等、テスト観点表の `観点` 列文言と一致しないラベルが存在（CHECKLIST「テスト観点列＝観点表の観点列と一致」違反）。本体行の `I/FID`・`テスト観点` を観点表ベースで再整合する必要がある。
- ログインの中核DB挙動（履歴登録・日時更新）に対する **IT-23/IT-26 が m01_01本体で未使用**。「関連ID対応概要」に IT-26 を加え、本体にDB登録/更新ケースを設けるべき。

---

## 7. 結論：網羅的に記載できるか

- **記載は可能**。テスト観点表（IT-01〜33）の枠組みは十分で、設計書0215・ソースは試験に必要な具体値（5回/30分、6桁、`eccube_2fa`14日、`dtb_login_history`の区分・カラム、判定順序）をすべて提供している。
- **ただし現状の自動生成ケースは網羅していない。** 主因は (C) ほぼ全行が定型文で観測可能な1行1判定になっていないこと、(A) DB記録・試行制限・Cookie分岐・セッション非保存など中核挙動の欠落、(B) 一部観点ラベルの不整合。
- **網羅に必要な作業規模感（目安）**
  - 追加（A）: ログイン履歴(成功/失敗)・日時更新・試行制限ロック・2FA POST試行制限・Cookie分岐・セッション非保存で **十数ケース**。
  - 是正（B）: 観点ラベル不整合の数行を観点表準拠に付け替え、IT-11等を対象外へ移動。
  - 具体化（C）: 既存約90×2ケースの前提・操作・期待結果を機能固有値へ書き換え（最も工数大）。
- **注意点**: 管理画面ログインに「パスワード12桁未満で認証失敗」ケースを足さないこと（顧客ログイン専用機能）。2FA Cookie期限はソース＝14日を期待値の正とすること。

> （初版）本レポートは点検のみで、`*_it_cases.md` 本体は変更していない。上記(A)(B)(C)の反映は別途の生成・修正タスクとして実施する。

---

## 8. 改善後（2026-06-19 反映結果）

設計書・スキル・IT生成器を改修し、ログインをパイロットとして再生成・再点検した結果。

### 8.1 実施した改善

1. **設計書の混入除去**: `functions/ec-cube-enterprise/m01-01_admin_login_login.md` の「ログイン送信時の判定順序」節に誤混入していたコンテンツ管理画面の項目仕様 116行を除去し、分断されていた認証エラー文を復元。`### DB操作` 節を追加（ログイン履歴の登録(成功/失敗)・最終ログイン日時の更新を明記）。`m01-02` の2FA Cookie有効期限を実装確認値 14日に具体化。再生成で `0215_...html` と `function_spec_html_preview/...m01-01...html` から混入が消失（指標語ヒット0）。
2. **網羅性ハーネスの新設**: `.cursor/skills/reverse-design/SOURCE-COVERAGE-CHECKLIST.md`（ソース↔設計書 双方向網羅）を新設し reverse-design SKILL(手順10b)/CHECKLIST から必須参照、doc-parity-check・spec-consistency-check からクロスリンク。分類別参照ソースに pf-article を追加。DB操作は ec-cube-enterprise を正典（Excel優先の例外）と明記。
3. **IT生成器の真因修正**: 本文・`### DB操作` からのDB書込み検出、通知/WebSocket観点の除外、DB・認証系の操作手順具体化、`--only` 部分再生成。

### 8.2 ギャップの解消状況

| 類型 | 初版の問題 | 改善後 |
|------|-----------|--------|
| (A) 不足 | m01_01 本体に IT-23/IT-26 が0件（ログイン履歴のDB記録・日時更新が未ケース化） | **解消**: m01_01 本体に IT-26×29・IT-23×3 が出現。`### DB操作`（登録/更新）からDB書込みケースを生成 |
| (B) 観点不整合 | 本体に IT-11「WebSocket」混入（ログインに無関係） | **解消**: 本体内 WebSocket=0（対象外観点表へ正しく分離） |
| (C) 具体化不足 | 操作手順が 90/90 行で定型「対象画面を表示する」一律 | **改善**: 定型行 90→52。DB操作32行・認証系6行が機能固有の手順に |
| 観点バランス | （改善作業中に判明）DB観点がログイン固有の IT-20(ログ監査)・IT-15(管理画面セキュリティ)を圧迫 | **是正**: スコアリング調整で IT-15×4・IT-20×2 を本体に確保 |

### 8.3 検証コマンドと結果

- `grep -cE 'noShopName|\.ja\.twig' 0215.../m01-01.html` ＝ **0**（混入消失）。
- m01_01 本体 I/FID 分布: IT-22×35, IT-26×29, IT-25×9, IT-03×7, IT-15×4, IT-23×3, IT-20×2, IT-13×1。
- 本体内 WebSocket ＝ **0**（両ファイル）。
- `format_tsv.py --check` ＝ **exit 0**（両ファイル）。
- 禁止句 `rg 'UI標準|設計書に記載のとおり|設計どおり'` ＝ **0件**。

### 8.4 ソース↔設計書 網羅性チェックリスト適用（m01-01）

`SOURCE-COVERAGE-CHECKLIST.md` を m01-01 へ適用した結果（標準＝ec-cube-enterprise 正典）。

| 節 | ソース根拠（ec-cube-enterprise） | 状態 |
|----|----------------------------------|------|
| 利用者視点の入口 | `Controller/Admin/AdminController.php:67-92`（admin_login） | 反映済 |
| 入力項目/バリデーション | `Form/Type/Admin/LoginType.php:41-53`（max50） | 反映済（実装確認値50を補記） |
| 判定順序 | form_login＋判定表8段 | 反映済（混入除去で復元） |
| DBカラム/DB操作 | `Entity/LoginHistory.php:26-61`, `EventListener/LoginHistoryListener.php:77-131`, status `LoginHistoryStatus.php:32,37` | 反映済（`### DB操作` 追加。DB=1c で ece 正典） |
| 試行制限 | `eccube.yaml:265-266`(5回/30分), `security.yaml:62` | 反映済 |
| Cookie/セッション | `security.yaml:53-61`(Remember Me 86400), 2FAは m01-02 `TwoFactorAuthService.php:105`(14日) | 反映済（14日を具体化） |
| ログ・監査 | 失敗履歴保存・ログ非出力方針 | 反映済 |
| 表示メッセージ | `messages.ja.yaml`/`validators.ja.yaml` | 反映済 |
| パスワード下限 | `LoginPasswordLengthCheckListener`（顧客専用） | 対象外を明記（管理ログインには非適用） |

A〜E 全項目を根拠付きで確認可能＝チェックリストが機能し、設計書が ec-cube-enterprise 実装を網羅していることの証跡。

### 8.5 横展開（別タスク）

本パイロットは分類=標準のログインで実証した。現行踏襲164・カスタマイズ157・新規実装45件への適用（現行リポ pf-article 含む基準＋Excel優先＋DB=ec-cube-enterprise正典）と、全function docの誤混入スキャンは別タスクとする。各機能適用時は `SOURCE-COVERAGE-CHECKLIST.md` を実施する。
