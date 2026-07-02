/**
 * 管理画面 商品管理「重複商品コード確認」E2E。
 * 納品ケース表 integration_test/e2e/m03_25_admin_product_product_duplicate_product_code_check_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装する。要シードの値依存ケースは専用シードID（env）未設定なら test.skip（理由付き）で
 * 安全に飛ばす。手動/間接・対象外はケース表で全量管理し、specに大量のfixmeを残さない。
 * 期待結果は仕様(functions/pf-eccube3/m03-25_admin_product_product_duplicate_product_code_check.md ＋ 観点表)由来（オラクル独立性）。
 * 画面文言（「重複商品コード確認」「重複している商品コードはありません。」等）は設計書 functions md:5/44/103 に明記された値を根拠とし、
 * 実装側の messages.ja.yaml / Twig 現挙動を期待値に流用しない。本機能は入力フォーム・バリデーション・DB更新を持たない GET 参照系。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証方針: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 login.spec.ts も
 * @playwright/test を直接使う。これに倣い @playwright/test + AdminLoginPage 直利用とする。
 * 資格情報は環境変数 ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（未設定時は認証必須ケースを test.skip）。
 *
 * シード（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 当画面へ到達できる管理者（2FA等無効の共通アカウント前提）
 *  - DUP_HAS_DOUBLING : 同一 product_code を2件以上持つ規格が存在する環境なら "1"（SEED-M03-25-DUP）
 *  - DUP_NO_DOUBLING  : 重複 product_code が1件も無い環境なら "1"（SEED-M03-25-NODUP）
 *    ※ DUP/NODUP は同一DBで両立しない。実行環境のデータ状態に合わせ片方を設定する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductDuplicateProductCodeCheckPage } from "../../../pages/admin/m03/m03_25_admin_product_product_duplicate_product_code_check.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const HAS_DUP = HAS_CREDS && process.env.DUP_HAS_DOUBLING === "1"; // SEED-M03-25-DUP
const HAS_NODUP = HAS_CREDS && process.env.DUP_NO_DOUBLING === "1"; // SEED-M03-25-NODUP

// URLアサーションは管理ルート（ECCUBE_ADMIN_ROUTE）配下まで含めて検証する（同形URL誤判定を防ぐ）。
const R = ECCUBE_ADMIN_ROUTE;
const HOME_RE = new RegExp(`/${R}/?(\\?|$)`);
const LOGIN_RE = new RegExp(`/${R}/login(\\?|$)`);
const PRE_RE = new RegExp(`/${R}/product/pre_doubling_check(\\?|$)`);
const RESULT_RE = new RegExp(`/${R}/product/doubling_check(\\?|$)`);
// 規格編集ルート admin_product_product_class_edit …/product/product/class/{id}/edit/{productClassId}
const CLASS_EDIT_RE = new RegExp(`/${R}/product/product/class/\\d+/edit/\\d+`);

/** 管理ログインしてホームへ到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).toHaveURL(HOME_RE);
}

test.describe(
  "管理画面 > 商品管理 > 重複商品コード確認",
  { tag: ["@admin", "@product"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M03-25-009 未ログインで前ページURL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      // 仕様(権限・認可/エラー処理): 未ログインは画面本文に到達せず管理ログインへ誘導される。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/pre_doubling_check`);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    test("E2E-M03-25-010 未ログインで結果ページURL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/doubling_check`);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== 前ページ／遷移／共通フレーム（資格情報のみ） =====

    test("E2E-M03-25-001 前ページにサブタイトル「重複商品コード確認」と「重複確認する」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoPre();
      await view.seePreForm(); // 仕様(フロント挙動): sub_title + 単一プライマリボタン「重複確認する」
    });

    test("E2E-M03-25-002 前ページ「重複確認する」押下で結果ページ /product/doubling_check へ遷移", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoPre();
      await view.executeLink.click();
      await expect(page).toHaveURL(RESULT_RE); // 仕様(画面遷移): GET …/product/doubling_check
    });

    test("E2E-M03-25-007 ナビ「重複コード確認」リンクが前ページへ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      // 仕様(利用者視点の入口): 商品管理配下「重複コード確認」→ admin_product_pre_doubling_check。
      // サイドバーの展開（親メニュー「商品管理」クリック）が必要な場合があり、リンク可視化は要実機確認。
      await view.navLink.click();
      await expect(page).toHaveURL(PRE_RE);
    });

    test("E2E-M03-25-008 前ページが共通フレームを継承する（サイドナビ等共通要素が表示）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoPre();
      // 仕様(フロント挙動): @admin/default_frame.twig 継承。共通サイドナビ領域が描画される。
      // セレクタは実ソース由来（admin/default_frame.twig:189 の .c-mainNavArea）。創作しない。
      await expect(view.commonNavArea).toBeVisible();
    });

    test("E2E-M03-25-011 前ページGETが HTTP 200 を返す", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      const res = await view.gotoPre();
      expect(res?.status()).toBe(200); // 仕様(入出力): 成功時 HTTP 200
    });

    test("E2E-M03-25-012 結果ページGETが HTTP 200 を返す", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      const res = await view.gotoResult();
      expect(res?.status()).toBe(200); // 仕様(入出力): 成功時 HTTP 200
    });

    test("E2E-M03-25-018 結果ページにサブタイトル「重複商品コード」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoResult();
      // 仕様(フロント挙動 functions md:44): 結果ページの sub_title は「重複商品コード」。重複の有無に依らず表示される。
      await view.seeResultSubTitle();
    });

    test("E2E-M03-25-023 ウィンドウタイトルに「商品管理」が含まれる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoPre();
      // 仕様(フロント挙動 functions md:44): ウィンドウタイトルブロックは「商品管理」のロケール。
      await expect(page).toHaveTitle(/商品管理/);
    });

    test("E2E-M03-25-021 ログアウト（セッション破棄）後に保護URLへアクセス→管理ログイン画面へ誘導", async ({ page, context }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      // 仕様(権限・認可/エラー処理 functions md:163-168): 認証状態を失った後は画面本文に到達せずログインへ誘導。
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      expect((await view.gotoResult())?.status()).toBe(200); // 認証済みでは到達できる（前提）
      // セッション Cookie を破棄して認証状態を失わせる。
      await context.clearCookies();
      await view.gotoResult();
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== 結果ページ 重複あり（SEED-M03-25-DUP） =====

    test("E2E-M03-25-003 結果ページに重複一覧テーブルとコードリンクが表示される", async ({ page }) => {
      test.skip(!HAS_DUP, "SEED-M03-25-DUP 未設定（DUP_HAS_DOUBLING=1）");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoResult();
      // 仕様(フロント挙動/エッジケース): 重複ありのとき table.table-striped の1列テーブル、セルはコード文字列のリンク。
      await expect(view.resultTable).toBeVisible();
      expect(await view.codeLinks.count()).toBeGreaterThan(0);
    });

    test("E2E-M03-25-005 コードリンクの href が規格編集ルートを指す", async ({ page }) => {
      test.skip(!HAS_DUP, "SEED-M03-25-DUP 未設定（DUP_HAS_DOUBLING=1）");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoResult();
      // 仕様(利用者視点の入口/画面遷移): 各セルのリンクは規格編集 …/product/product/class/{id}/edit/{productClassId}。
      await expect(view.codeLinks.first()).toHaveAttribute("href", CLASS_EDIT_RE);
    });

    test("E2E-M03-25-006 コードリンクが別タブ（target=_blank・rel=noopener）で規格編集を開く", async ({ page, context }) => {
      test.skip(!HAS_DUP, "SEED-M03-25-DUP 未設定（DUP_HAS_DOUBLING=1）");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoResult();
      const first = view.codeLinks.first();
      await expect(first).toHaveAttribute("target", "_blank"); // 仕様(フロント挙動): 別タブで開く
      await expect(first).toHaveAttribute("rel", /noopener/);
      // 別タブ遷移先が規格編集画面であること（仕様: 該当規格の編集画面を別タブで開く）。
      const [popup] = await Promise.all([context.waitForEvent("page"), first.click()]);
      await popup.waitForLoadState();
      await expect(popup).toHaveURL(CLASS_EDIT_RE);
    });

    test("E2E-M03-25-013 同一コードがN件あるとき重複一覧にN行表示される", async ({ page }) => {
      test.skip(!HAS_DUP, "SEED-M03-25-DUP 未設定（DUP_HAS_DOUBLING=1）");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoResult();
      // 仕様(集計条件/エッジケース functions md:101): 同一コードのテキストが該当規格行数だけ並び、
      // 各行のリンク先 URL は規格ごとに異なる。
      const rows = await view.resultRows.count();
      expect(rows).toBeGreaterThan(0);
      const texts = await view.codeLinks.allInnerTexts();
      const hrefs = await view.codeLinks.evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute("href") ?? "")
      );
      // 行数＝コードリンク数（各行1リンク）。
      expect(texts.length).toBe(rows);
      // 同一コードが2行以上ある（＝重複が一覧化されている）こと。
      const byCode = new Map<string, number>();
      for (const t of texts) byCode.set(t, (byCode.get(t) ?? 0) + 1);
      expect([...byCode.values()].some((n) => n >= 2)).toBe(true);
      // 各行のリンク先 URL は規格ごとに異なる（規格 ID 単位で別 URL）。
      expect(new Set(hrefs).size).toBe(hrefs.length);
    });

    test("E2E-M03-25-014 重複コードが product_code 昇順で並ぶ", async ({ page }) => {
      test.skip(!HAS_DUP, "SEED-M03-25-DUP 未設定（DUP_HAS_DOUBLING=1。複数コードの重複が必要）");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoResult();
      // 仕様(集計条件 functions md:74): product_code 昇順 → product.id 昇順 → 規格ID 昇順。
      // DOM から観測できる一次キー（product_code 昇順）のみをオラクル化する。
      // 二次/三次キー（product.id・規格ID）は表示テキストに現れず観測不可のため対象外（ケース表 付帯表5 参照）。
      // 並びの確認は (a) 同一コードが連続してまとまる（ORDER BY product_code の帰結。DB照合順序非依存）
      //          (b) 異なるコード同士が非減少順 で行う。
      const texts = await view.codeLinks.allInnerTexts();
      // (a) 同一コードは連続（グルーピング）していること。
      const seen = new Set<string>();
      let prev = "";
      for (const t of texts) {
        if (t !== prev && seen.has(t)) {
          throw new Error(`同一コード "${t}" が非連続で出現（product_code 昇順に反する）`);
        }
        seen.add(t);
        prev = t;
      }
      // (b) コード文字列が非減少順（要確認: 厳密な大小は DB照合順序に依存。コードポイント比較で代表確認）。
      const distinct = [...new Set(texts)];
      const sorted = [...distinct].sort();
      expect(distinct).toEqual(sorted);
    });

    test("E2E-M03-25-019 重複一覧に出る各コードはいずれも2件以上で単独コードは出ない", async ({ page }) => {
      test.skip(!HAS_DUP, "SEED-M03-25-DUP 未設定（DUP_HAS_DOUBLING=1。単独コードも併存させる）");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoResult();
      // 仕様(集計条件/重複判定条件#3 functions md:72,84): 件数2超のコードだけが一覧に載る＝単独コードは除外される。
      // 一覧に出る全コード文字列が、それぞれ2件以上であることを検証（異常系＝単独コードは載らない）。
      const texts = await view.codeLinks.allInnerTexts();
      expect(texts.length).toBeGreaterThan(0);
      const byCode = new Map<string, number>();
      for (const t of texts) byCode.set(t, (byCode.get(t) ?? 0) + 1);
      expect([...byCode.values()].every((n) => n >= 2)).toBe(true);
    });

    test("E2E-M03-25-020 同一コード内の規格行が商品ID昇順→規格ID昇順で並ぶ", async ({ page }) => {
      test.skip(!HAS_DUP, "SEED-M03-25-DUP 未設定（DUP_HAS_DOUBLING=1。同一コードが複数商品/規格に跨る必要）");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoResult();
      // 仕様(集計条件 functions md:74): product_code 昇順 → product.id 昇順 → 規格ID 昇順。
      // href（…/product/product/class/{商品ID}/edit/{規格ID}）に商品ID・規格IDが現れるため二次/三次キーは DOM 観測可能。
      const rows = await view.codeLinks.evaluateAll((els) =>
        els.map((e) => {
          const a = e as HTMLAnchorElement;
          const m = (a.getAttribute("href") ?? "").match(/\/class\/(\d+)\/edit\/(\d+)/);
          return {
            text: a.textContent ?? "",
            productId: m ? Number(m[1]) : NaN,
            classId: m ? Number(m[2]) : NaN,
          };
        })
      );
      // 同一コード内で (商品ID, 規格ID) が非減少順に並ぶこと。
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].text !== rows[i - 1].text) continue; // コードが変われば一次キー境界
        const prev = rows[i - 1];
        const cur = rows[i];
        const ok =
          cur.productId > prev.productId ||
          (cur.productId === prev.productId && cur.classId >= prev.classId);
        expect(ok).toBe(true);
      }
    });

    // ===== 結果ページ 重複なし（SEED-M03-25-NODUP） =====

    test("E2E-M03-25-004 重複が無いとき固定メッセージのみ表示しテーブルを出さない", async ({ page }) => {
      test.skip(!HAS_NODUP, "SEED-M03-25-NODUP 未設定（DUP_NO_DOUBLING=1）");
      await loginToHome(page);
      const view = new ProductProductDuplicateProductCodeCheckPage(page);
      await view.gotoResult();
      // 仕様(エッジケース): 重複なしはテーブルを出さず「重複している商品コードはありません。」のみ表示。
      await view.seeNoDoublingMessage();
    });

    // ===== 保留（自動化予定だが要実機/要データ。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-25-015 NULL/空文字の product_code は重複一覧に出ない（要: NULL/空コードを含むシード・間接確認）",
      async () => {
        // 期待は仕様(重複判定時の条件#1/#2: NULL・空文字は母集団から除外)由来。
        // NULL/空コードのみの状態で「重複なしメッセージ」になることの間接確認。専用シード整備後に実装。
      }
    );

    test.fixme(
      "E2E-M03-25-016 空白のみ/制御文字のみの product_code でも完全一致が複数あれば重複として一覧に出る（要: 特殊コードシード）",
      async () => {
        // 期待は仕様(エッジケース functions md:103: SQL はトリムしないため値が完全一致する複数行は重複として載る)由来。
        // 空白のみ/制御文字のみのコードを同値で複数規格に投入し、結果ページの一覧にその行が出ることを確認。
        // 表示テキストが空白で視認しづらいため getAttribute("href") 等で行存在を判定。専用シード整備後に実装。
      }
    );

    test.fixme(
      "E2E-M03-25-017 dtb_product と内部結合できない孤立規格行は重複一覧に出ない（要: 孤立規格シード・障害注入）",
      async () => {
        // 期待は仕様(集計条件 functions md:73: dtb_product と内部結合、孤立行は結果に含まれない)由来。
        // 商品が存在しない規格行を作る/壊す検証で、整合性制約により通常運用では作りにくいため手動/障害注入。
      }
    );
  }
);
