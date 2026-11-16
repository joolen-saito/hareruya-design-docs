/**
 * F01-01 本店ECTOP のシードが使う、トップバナー管理（メニュー「データ管理」→「トップバナー管理」）のバナー設定欄の読み書き。セレクタはここだけ。
 *
 * 画面の作り（アプリのテンプレート Data/top_banner・フォーム TopBannerType・保存処理 TopBannerStoreAction で確かめた。期待値はここに書かない）:
 * - バナーは決まった行の集まり（行の追加・削除は無い）。行ごとに 画像URL・リンク先URL・言語（日本語/英語のチェック）・表示タイプ（表示/非表示）・
 *   画像alt属性・並び順 の欄がある。欄の名前の末尾が行の番号（バナーID）。
 * - 並び順の欄の初期表示は、その行のバナーIDになる。保存すると、並び順の小さい順に、バナーIDの小さい行から詰めて書き直す。
 *   だから「行の内容を、並び順の欄をバナーIDのままにして送る」と、行の並びは変わらない（戻すときもこの形で送る）。
 * - 画像URLが空の行は、表示タイプを選んでも非表示で保存される。
 * - 保存（「バナー設定」）のあとは同じ画面へ戻り、「保存しました」が出る。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { registerRestore } from "../../lib/shared_restore";
import { adminUrl, withAdminSession } from "../../lib/session";
import { expectSaved } from "./common";

/** バナー設定欄の1行の内容（画面の欄の値） */
export type バナー行 = {
  /** バナーID（欄の名前の末尾の番号） */
  id: string;
  画像URL: string;
  リンク先URL: string;
  /** チェックの入った言語の表示名（「日本語」「英語」） */
  言語: string[];
  /** 表示タイプの選択肢の表示名（「表示」「非表示」） */
  表示タイプ: string;
  画像alt: string;
  並び順: string;
};

const 欄 = (page: Page, name: string) => page.locator(`[name="top_banner[${name}]"]`);

/** トップバナー管理を開き、バナー設定欄の表示を待つ */
export async function トップバナー管理を開く(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/data/top_banner"));
  if (!res || !res.ok()) throw new Error(`トップバナー管理を開けない（応答 ${res?.status() ?? "なし"}）`);
  await page.waitForLoadState("load");
  await expect(page.locator('input[name^="top_banner[image_url_"]').first(), "トップバナー管理のバナー設定欄").toBeVisible({ timeout: 60_000 });
}

/** バナー設定欄の全行を、バナーIDの小さい順に読む */
export async function バナー設定を読む(page: Page): Promise<バナー行[]> {
  await トップバナー管理を開く(page);
  const ids = (await page.locator('input[name^="top_banner[image_url_"]').evaluateAll((ns) => ns.map((n) => /image_url_(\d+)\]$/.exec((n as HTMLInputElement).name)?.[1] ?? "")))
    .filter(Boolean).sort((a, b) => Number(a) - Number(b));
  const rows: バナー行[] = [];
  for (const id of ids) {
    const 言語 = await page.locator(`input[type=checkbox][name="top_banner[language_${id}][]"]`).evaluateAll((ns) => ns
      .filter((n) => (n as HTMLInputElement).checked).map((n) => ((n as HTMLInputElement).labels?.[0]?.textContent ?? "").replace(/\s+/g, " ").trim()));
    rows.push({
      id,
      画像URL: await 欄(page, `image_url_${id}`).inputValue(),
      リンク先URL: await 欄(page, `link_${id}`).inputValue(),
      言語,
      表示タイプ: ((await 欄(page, `disp_type_${id}`).locator("option:checked").textContent()) ?? "").trim(),
      画像alt: await 欄(page, `image_alt_${id}`).inputValue(),
      並び順: await 欄(page, `sort_no_${id}`).inputValue(),
    });
  }
  if (rows.length === 0) throw new Error("トップバナー管理のバナー設定欄に行が無い");
  return rows;
}

/** バナー設定欄の全行に内容を入れて「バナー設定」を押す（rows は画面の全行を、バナーIDごとに指定する） */
export async function バナー設定を保存する(page: Page, rows: バナー行[], what: string, issue: (m: string) => void): Promise<void> {
  await トップバナー管理を開く(page);
  const ids = await page.locator('input[name^="top_banner[image_url_"]').evaluateAll((ns) => ns.map((n) => /image_url_(\d+)\]$/.exec((n as HTMLInputElement).name)?.[1] ?? ""));
  const missing = ids.filter((id) => !rows.some((r) => r.id === id));
  if (missing.length) throw new Error(`${what}: 画面にあるバナー（ID ${missing.join("・")}）の内容を指定していない`);
  for (const r of rows) {
    await 欄(page, `image_url_${r.id}`).fill(r.画像URL);
    await 欄(page, `link_${r.id}`).fill(r.リンク先URL);
    for (const box of await page.locator(`input[type=checkbox][name="top_banner[language_${r.id}][]"]`).all()) {
      const label = await box.evaluate((n) => ((n as HTMLInputElement).labels?.[0]?.textContent ?? "").replace(/\s+/g, " ").trim());
      await box.setChecked(r.言語.includes(label));
    }
    await 欄(page, `disp_type_${r.id}`).selectOption({ label: r.表示タイプ });
    await 欄(page, `image_alt_${r.id}`).fill(r.画像alt);
    await 欄(page, `sort_no_${r.id}`).fill(r.並び順);
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    page.locator("form").filter({ has: page.locator('input[name^="top_banner[image_url_"]') }).locator('button[type="submit"]').filter({ hasText: /^\s*バナー設定\s*$/ }).first().click({ noWaitAfter: true }),
  ]);
  for (const w of await expectSaved(page, `${what}: トップバナー管理の「バナー設定」`)) issue(w);
}

/** 行の比べ方（並び順はバナーIDのまま表示されるので比べる。言語は並びを問わない） */
const 行の形 = (r: バナー行) => JSON.stringify({ ...r, 言語: [...r.言語].sort() });

/**
 * 共有のトップバナーの全行を控え、戻す処理を登録してから、作る(控え) が返す内容で保存する。
 * 戻すときは控えた全行をそのまま送り（並び順はバナーIDのまま）、開き直して全行が控えと同じかを確かめる。
 */
export async function 共有のバナーを書き換える(browser: Browser, seedId: string, 作る: (控え: バナー行[]) => バナー行[], issue: (m: string) => void): Promise<バナー行[]> {
  const 控え = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return バナー設定を読む(page); });
  registerRestore(
    "共有のトップバナー（全行）",
    { 元の内容: 控え },
    async () => {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => {
        page.setDefaultTimeout(60_000);
        await バナー設定を保存する(page, 控え, `${seedId}: 戻す`, () => undefined);
      });
    },
    async () => withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const now = await バナー設定を読む(page);
      return JSON.stringify(now.map(行の形)) === JSON.stringify(控え.map(行の形));
    }),
  );
  const 新 = 作る(控え);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await バナー設定を保存する(page, 新, `${seedId}: 書き換える`, issue);
    const now = await バナー設定を読む(page);
    // 画像URLが空の行は非表示で保存される（画面の作り）。それ以外は送ったとおりに保存されたこと
    for (const r of 新) {
      const got = now.find((x) => x.id === r.id)!;
      const want = r.画像URL === "" ? { ...r, 表示タイプ: "非表示" } : r;
      if (行の形(got) !== 行の形(want)) throw new Error(`${seedId}: バナーID ${r.id} が送った内容で保存されていない（${行の形(got)}）`);
    }
  });
  return 新;
}
