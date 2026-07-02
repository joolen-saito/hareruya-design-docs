# E2Eテストケース生成 — 雛形

## 1. E2Eテストケース表（顧客納品物）

出力先: `integration_test/e2e/<機能No小文字>_<機能識別子>_e2e_cases.md`

**テストケースTSVは納品物であり、既存の結合試験テストケース（`integration_test/<機能No>_*_it_cases.md`）と同一の 10 列 TSV 形式を厳守する。** E2E固有の情報（セレクタ・自動化区分・仕様根拠・シード・不具合候補）は **TSV に列を足さず、TSV の後の別セクション**に置く（納品TSVの形式を汚さない）。

冒頭に次を書く（既存IT casesの体裁に合わせる）。
- タイトル `# <機能名>（<表示名>） E2Eテストケース`、元設計（正本md/機能詳細HTML）・テスト観点へのリンク。
- 「期待結果は画面表示・遷移・DB状態(間接)・URL等の観測可能な結果で判定。**期待結果は仕様(設計書/観点表/基本設計)由来**（実装の現挙動を写さない）。」
- 「Playwright は本リポジトリでは実行しない。セレクタ等は後述の別表に分離し、未検証は `要実機確認`」。

### 関連ID対応概要
| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-25 | UI部品・遷移・送信可否 |

### テストケースTSV（10列固定・既存IT casesと同一形式）
タブ区切り。改行や `"` を含むセルはダブルクォートで囲む。**1行目が列見出し**、2行目以降がケース（各10列）。`機能名` は **既存IT casesと同一の `<機能No小文字>_<機能識別子>（表示名）` 形式**（例 `m01-01_admin_login_login（管理画面_認証機能）`）で全行同一。`テストID` で一意（E2E は `E2E-<機能No>-NNN`）。優先度は **P1／P2／P3**。**期待結果／レスポンスは1行1判定**（メッセージ表示と画面滞留など複数判定は行分割。期待結果は仕様正典の文言で、実装/POM由来の見出し文言等をオラクル化しない）。期待結果以外で複数項目はセル内 LF 改行。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m01-01_admin_login_login（管理画面_認証機能）	E2E-M01-01-001	IT-25	操作起点	P1	正しいID/PWでログイン成功しホームへ遷移	未ログイン／SEED-M01-ADMIN	有効なログインID・パスワード	"1. /admin/login を開く
2. ログインID・パスワードを入力
3. ログインボタンを押下"	ホーム画面へ遷移すること。
m01-01_admin_login_login（管理画面_認証機能）	E2E-M01-01-010	IT-22	必須バリデーション	P1	ID未入力で送信すると認証失敗メッセージ(2行)が表示される	未ログイン	ログインID＝空、パスワード＝任意	"1. ログイン画面を開く
2. IDを空のままパスワードを入力
3. 送信"	「ログインできませんでした。」「入力内容に誤りがないかご確認ください。」の2行が表示されること。
```

### 列の対応（E2E固有→納品10列への落とし込み）
- `テストID`＝E2EケースID（`E2E-<機能No>-NNN`）。`I/FID`・`テスト観点`は観点表に一致。
- `テスト項目名`＝当該行の判定が分かる具体名（1行1判定）。
- `前提条件`＝ログイン状態・シードセットID（例: `SEED-M01-ADMIN`）。`入力データ`＝入力値。`操作手順`＝UI操作。
- `期待結果／レスポンス`＝**仕様由来のUI観測**（1判定）。実装の現挙動を写さない。

---

## 1b. E2E自動化区分・セレクタ・仕様根拠（TSV外の付帯表）

納品TSVに載せないE2E固有情報を、`テストID` で対応づける付帯表として置く。

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド／コマンド(根拠 file:line / 要実機確認) | 仕様根拠(設計書節・行/IT-ID) | 元ITケースID |
|----------|---------|-------------------------------------------|------------------------------|--------------|
| E2E-M01-01-001 | E2E自動化(UI) | #login_id(login.twig:26) / #password(POM login.page.ts) / button trans admin.login.login(login.twig:37) | 判定順序#8 | IT-M01-01-...-008相当 |
| E2E-M01-01-010 | E2E自動化(UI) | .text-danger(login.twig:33) | 判定順序#1＋validators.ja.yaml:20-21 | IT-M01-01-...-001相当 |
| E2E-A01-01-001 | E2E自動化(API/統合) | POST /smaregi/stocks(SmaregiController.php:NN, IP制限) | 受信検証・在庫更新(処理フロー#x) | IT-A01-01-...相当 |
| E2E-A01-01-050 | E2E自動化(UI) | 在庫検索一覧の在庫数セル(stock_list.twig:NN) | 在庫更新結果のUI反映 | IT-A01-01-...相当 |
| E2E-B01-02-001 | E2E自動化(API/統合) | bin/console <command-name>(StockShortageCommand.php:NN) | バッチ実行結果・終了ステータス(IT-30) | IT-B01-02-...相当 |

`元ITケースID` 列で既存IT cases（`<機能No>_*_it_cases.md`）の該当行へトレースし、観点の取りこぼしを照合できるようにする。

- `E2E可否`: **必ず次の4区分のいずれか**＝`E2E自動化(UI)` / `E2E自動化(API/統合)` / `手動` / `対象外`。手動・対象外は理由併記。
  - **`要実機確認` は区分値ではなく修飾子**。区分の後に括弧で添える（例: `E2E自動化(API/統合)（要実機確認）`）。分類サマリ（付帯表2）の集計上はあくまで該当の4区分に数える（`要実機確認` を独立カウントしない）。`要確認` も同様に修飾子であり区分値にしない。
- **UIレイヤ**のセレクタは Twig 由来（位置情報のみ）。Form/Type は id/name 確認にのみ使い、制約を期待結果へ流用しない。
- **API/統合レイヤ**は APIコントローラのルート（HTTPメソッド＋パス・認証方式）／コンソールコマンド名を `file:line` 根拠で記す。**レスポンス形・ステータスの意味は設計書/観点表由来**で判定し、コードの現挙動を期待値にしない。根拠が取れなければ `要実機確認`。

### 分類サマリ（既存IT casesの全関連IDを照合・未分類0）
`自動化(UI)` と `自動化(API/統合)` を分けて集計する（画面仕様書は API/統合列が 0 でよい。機能仕様書 `a*`/`b*` は両列に分布する）。

| IT-ID | 観点(要約) | 自動化(UI) | 自動化(API/統合) | 手動/間接 | 対象外 | 備考 |
|-------|-----------|:---------:|:----------------:|:--------:|:------:|------|
| IT-22 | バリデーション・試行制限 | 5 | 0 | 1 | 1 | |
| IT-33 | スマレジ受信・在庫更新 | 2 | 6 | 0 | 3 | （a*の例） |
| 合計 | | n | n | n | n | 未分類 0 |

### 不具合候補（仕様乖離）
仕様と実装(Twig/ソース)の食い違い。テストは仕様どおりに書き、実装が違えば落ちて検出する。**期待値を実装へ書き換えない。**

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 認証失敗は2行表示 | validators.ja.yaml:20-24＋login.twig:33(nl2br) | 文言は静的確認済。nl2brの2行レンダリングのみ要確認 | E2E-..-010 | 要確認 |

### 設計書網羅マトリクス（設計書節→テストID・未カバー0）
設計書の各節を歩き、テスト可能な挙動が E2Eケースへ写像されていることを照合する。設計書にあって観点表に無い挙動も拾う。

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口 | ログイン画面表示・保護URL誘導 | E2E-..-013 | カバー |
| 判定順序 #1〜#8 | 各分岐（未入力/CSRF/試行制限/不存在/停止/不一致/2FA/成功） | E2E-..-010,020,030,040,050,060,070,001 | カバー |
| 表示メッセージ | 認証失敗2行・試行制限文言 | E2E-..-010,030 | カバー |
| 画面遷移 | 2FA誘導・ログアウト・ログイン済み→ホーム | E2E-..-070,080,002 | カバー |
| DB操作 | 成功/失敗履歴・最終ログイン日時(間接) | E2E-..-090,091,092 | 手動/間接 |
| 試行制限 | 5回/30分・{N}分・リセット | E2E-..-030,031,032 | カバー(一部手動/対象外) |
| ログ・監査 | サーバログ | （対象外＝観測外） | 対象外(理由付き) |

未カバーが残る場合は理由（観測不能・別機能委譲等）を明記し、放置しない。

---

## 1b. シードデータ要件（ケースの前提から集約）

各E2Eケースの「前提(ログイン/データ)」を集約し、**個別に流し込めるシードセット**として定義する。実装は後工程だが、要件はここで確定する。

設計方針:
- **個別流し込み**: シードは機能/シナリオ単位の **独立した「シードセット」** とし、他に依存せず単独で適用・撤去できる（べき等・安定キー）。一括投入を強制しない。
- **データ源は選択可**: 各シードセットに源を明記する。`synthetic`（faker/factory でテスト内生成）／`fixture`（JSON/SQL 等の固定データ）／`migration`（現行システム pf-eccube3 からの移行データ）。同一セットを源を変えて差し替えられるよう、**論理的な要件（必要なレコードと値の条件）を源非依存で書く**。
- **最小・自己完結を優先**: ログインのような共通アカウントは既存 `config/default_login_information.json` を流用。シナリオ固有データは可能ならテスト内(UI操作/faker)で作る。大規模・関係データは fixture か現行移行を充てる。
- **後始末**: 生成データは識別可能な接頭辞/タグを付け、撤去（または使い捨て）できるようにする。

| シードセットID | 対象(entity/テーブル) | 必要レコードの要点(キー項目・値条件) | データ源(synthetic/fixture/migration) | べき等/後始末 | 使用E2EケースID |
|----------------|------------------------|--------------------------------------|----------------------------------------|----------------|------------------|
| SEED-M01-ADMIN | dtb_member(管理者) | 有効な管理者1（ログインID/パスワードは config 既定。2FA OFF） | fixture(config既定) | 既存利用・撤去不要 | E2E-M01-01-001 |
| SEED-M01-LOCK | （試行制限状態）/ 専用login_id＋専用IP | 同一ID×IPで失敗5回到達 | synthetic(UI失敗)＋setup(リミッタ初期化) | **専用ID＋IP隔離＋テスト前にリミッタ(Redis)初期化でべき等化（自然解除に依存しない）** | E2E-M01-01-030 |
| SEED-M01-2FA-ON | dtb_member(個別2FA ON・秘密鍵設定済) | 個別2FA=ON、two_factor_auth_key設定済の管理者1 | fixture もしくは migration | 専用アカウント・撤去 | E2E-M01-01-070 |

注: `migration` を選ぶ場合は、現行(pf-eccube3)の該当データを ec-cube-enterprise スキーマへ移すため、DB対応は reverse-design 1c（DB=ec-cube-enterprise 正典）に従い、移行元/先の対応を別途定義する。

---

## 2. Page Object 雛形（`ec-cube-enterprise/e2e-tests/pages/<area>/<module>/<screen>.page.ts`）

既存 `login.page.ts`（独立クラス）または `AdminAbstractPage` 継承形に合わせる。**`expect` を使うなら必ず import する**（独立形は `@playwright/test` から、既存 `login.page.ts` は fixture から import している）。`import` の相対パス（`../` の数）は生成先の階層に合わせて算出する。Locator はコンストラクタで定義し、根拠 Twig を file:line コメントで残す。

独立クラス形（`login.page.ts` 相当）:
```ts
import {Locator, Page, expect} from "@playwright/test";   // expect を使うなら必須
import {ECCUBE_ADMIN_ROUTE} from "<相対>/config/default.config";
// 構造参考: ec-cube-enterprise/e2e-tests の既存 Page Object。本ファイルは設計書+Twig由来の未実行雛形。

export class Admin<Screen>Page {
    readonly page: Page;
    readonly url: string;

    // セレクタは Twig 由来（src/Eccube/Resource/template/...:LINE）。未確認は要実機確認。
    readonly someInput: Locator;     // 由来: <template>.twig:LINE (name=...)
    readonly submitButton: Locator;  // 由来: <template>.twig:LINE (ボタン trans キー)

    constructor(page: Page) {
        this.page = page;
        this.url = `${ECCUBE_ADMIN_ROUTE}/<path>`;
        this.someInput = page.locator("#<id>");
        this.submitButton = page.getByRole("button", {name: "<文言>"});
    }

    async goto() { await this.page.goto(this.url); }
    async <action>(/* ... */) { /* fill / click / select */ }
    async see<Observation>() {
        await expect(this.page.locator("<selector>")).toContainText("<期待文言>");
    }
}
```

`AdminAbstractPage` 継承形（メニュー遷移を持つ画面。`login_history.page.ts` 相当）:
```ts
import {AdminAbstractPage} from "<相対>/pages/admin/AdminAbstract.page";
import {Locator, Page} from "@playwright/test";
import {ECCUBE_ADMIN_ROUTE} from "<相対>/config/default.config";

export class Admin<Screen>Page extends AdminAbstractPage {
    someInput: Locator;
    constructor(protected page: Page) {
        super(`${ECCUBE_ADMIN_ROUTE}/<path>`, page);
        this.someInput = page.locator("#<id>");   // 由来: <template>.twig:LINE
    }
    async gotoViaMenu() { /* getByRole('link',{name:'<親>'}).click() → 子メニュー */ }
}
```

---

## 3. spec 雛形（`ec-cube-enterprise/e2e-tests/spec/<area>/<module>/<screen>.spec.ts`）

import の相対パス（`../` の数）は生成先の階層に合わせて算出する（例: `spec/admin/<module>/<screen>.spec.ts` なら `fixtures/` まで `../../../`）。

**管理画面（ログイン必須）— 管理 fixture を使う:**
```ts
// 自動生成の雛形。ec-cube-enterprise の Playwright 規約に準拠。本リポジトリでは未実行。
import {expect, test} from "<相対>/fixtures/admin_login.fixture";
import {Admin<Screen>Page} from "<相対>/pages/admin/<module>/<screen>.page";

test.describe("<機能の和名> > <画面>", {tag: ["@<area>"]}, () => {
    test("E2E-...-001 正常系: <シナリオ名>", async ({loginPage, page}) => {
        await loginPage.seeAfterLoginSuccess();
        const target = new Admin<Screen>Page(page);
        await target.goto();
        await expect(page.locator("h2")).toContainText("<期待>");   // 期待は仕様由来
    });
});
```

**フロント（ログイン不要）— base test を直接使う:**
```ts
import {expect, test} from "@playwright/test";   // 管理fixtureを強制しない
import {<Screen>Page} from "<相対>/pages/front/<module>/<screen>.page";

test.describe("<和名> > <画面>", {tag: ["@front"]}, () => {
    test("E2E-...-001 正常系", async ({page}) => { /* ... */ });
});
```

**spec に残すケースの方針（ノイズ防止）:**
- `E2E自動化`（実装済み）と、自動化予定だが未実装/`要実機確認` のケースのみ spec に置く。後者は理由付きで `test.fixme`。
- `手動`・`対象外` は **ケース表で全量管理**し、spec に大量の fixme を残さない。
```ts
// 自動化予定だが未実装/要実機確認のみ fixme で残す
test.fixme("E2E-...-010 ID未入力で認証失敗表示(セレクタ要実機確認)", async () => {
    // 期待は仕様(判定順序#1)由来。失敗メッセージ領域のセレクタを実機確認後に実装。
});
```

### 命名・配置
- E2EケースID: `E2E-<機能No>-<連番>`。
- Page Object/spec の `<area>` は `admin`/`front`、`<module>` は機能の分類。
- spec の describe 名は和名、tag は機能分類（既存に倣う）。

---

## 4. API/統合レイヤ 雛形（機能仕様書 `a*`/`b*` 用・両レイヤ網羅）

画面を伴わない機能仕様（API・スマレジWebhook・バッチ）は、**UIレイヤ（§2-3 の Page Object/spec）に加えて API/統合レイヤの spec** を生成する。API/統合レイヤは Playwright の `request`（APIRequestContext）でエンドポイントへ送信し、レスポンス/ステータス/冪等性を観測する。**期待値は設計書/観点表由来**（レスポンス形・スマレジ実装挙動を流用しない）。

### 4a. ペイロード／ヘルパ（`pages/api/<module>/<id>.api.ts` 等）
Webhookペイロードや既知データは、創作値ではなく**設計書のリクエスト仕様**に基づき定義する。スマレジ実環境は使わず、設計書記載のフィールドのみを最小構成で組む。
```ts
// 構造参考: ec-cube-enterprise/e2e-tests。本ファイルは設計書(a01-01)由来の未実行雛形。
// 由来: POST /smaregi/stocks(src/Eccube/.../SmaregiController.php:NN, IP制限認証)
export const SMAREGI_STOCKS_PATH = "/smaregi/stocks";

// 在庫変動区分: 02=売上, 12=返品（設計書 a01-01 受信検証より。実装挙動でなく仕様由来）
export function buildStockWebhookPayload(opts: { transactionType: "02" | "12"; /* ... */ }) {
    return { /* 設計書記載の必須フィールドのみ。未記載は要実機確認コメント */ };
}
```

### 4b. API/統合 spec（`spec/api/<module>/<id>.api.spec.ts`）
```ts
// 自動生成の雛形。本リポジトリでは未実行。期待結果は設計書/観点表(a01-01)由来。
import {expect, test, request} from "@playwright/test";
import {E2E_BASE_URL} from "../../../config/default.config";
import {SMAREGI_STOCKS_PATH, buildStockWebhookPayload} from "../../../pages/api/stock/a01_01.api";

// スマレジ用アカウント・既知在庫・IP許可は SEED/環境ガードで表現
const HAS_API = !!process.env.SMAREGI_WEBHOOK_ALLOWED;

test.describe("API > スマレジ連携処理(Webhook受信)", {tag: ["@api", "@smaregi"]}, () => {
    test("E2E-A01-01-001 正常系: 売上(02)受信で在庫が更新されレスポンス2xx", async ({}, testInfo) => {
        test.skip(!HAS_API, "SMAREGI_WEBHOOK_ALLOWED(IP許可)未設定");
        const ctx = await request.newContext({baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true});
        const res = await ctx.post(SMAREGI_STOCKS_PATH, {data: buildStockWebhookPayload({transactionType: "02"})});
        expect(res.status()).toBe(200);   // 期待は設計書「受信検証・正常応答」由来
        await ctx.dispose();
    });

    // 異常系（形式不正・重複・順序・部分失敗・スロットリング時ロールバック）は設計書の各分岐ごとに対で用意
    test.fixme("E2E-A01-01-080 スロットリング/不通時は連携をロールバックし在庫不変", async () => {
        // 期待は設計書(共通処理1-3-1)由来。外部障害の再現は要実機確認のため fixme。
    });
});
```

### 4c. バッチ起動 spec（`spec/batch/<module>/<id>.batch.spec.ts`）
バッチは起動口（コンソール／cron／トリガーAPI）が実機依存のため、**起動口が本リポジトリから叩けない場合は `test.fixme`（理由付き）**で設計を残し、結果のUI観測（在庫切れ/警告一覧・通知）が可能なら §3 のUI spec で補完する。
```ts
// 自動生成の雛形。未実行。期待は設計書/観点表(b01-02)由来。
import {test, expect} from "@playwright/test";

test.describe("バッチ > 在庫切れ", {tag: ["@batch"]}, () => {
    // 由来: bin/console <command-name>(src/Eccube/.../StockShortageCommand.php:NN)
    test.fixme("E2E-B01-02-001 対象ありで実行→終了ステータス0・対象が処理される", async () => {
        // 起動口(コンソール)が実機依存のため fixme。終了ステータス/出力は設計書(IT-30)由来で判定。
    });
    test.fixme("E2E-B01-02-010 対象0件で実行→終了ステータス0・no-op", async () => {});
    // 結果のUI観測が可能な分（在庫切れ一覧・通知）は spec/admin 側でUIレイヤ実装する
});
```

### 命名・配置（API/統合レイヤ）
- API spec: `spec/api/<module>/<id>.api.spec.ts`、ヘルパ: `pages/api/<module>/<id>.api.ts`。
- バッチ spec: `spec/batch/<module>/<id>.batch.spec.ts`。
- spec に残すのは `E2E自動化(API/統合)`（実装可能分）と、起動口/外部依存で未実行の `test.fixme`（理由付き）のみ。`手動`/`対象外` はケース表で全量管理。
