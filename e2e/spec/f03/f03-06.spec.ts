/**
 * F03-06 最近チェックした商品。正本: cases/F03-06_test_cases.tsv
 *
 * 実装しなかったケース: 010（商品規格のカード状態をDBへ直接設定するシード）・014（DBフィクチャで投入するシード）。
 * 記録 e2e/review/F03-06_progress_2026-10-30.md
 *
 * 閲覧履歴のCookieの設定（ブラウザーのCookie編集）は、ケースの事前準備としてここで行う。
 * 決め打ちの商品名は、シードが実行ごとの印を付けて作るので、ケースの文の値も rc() で同じ印を付けて比べる。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { FrontRecent, 入口, 閲覧履歴のCookie, 閲覧履歴を設定 } from "../../pages/front/f03_06_recent";
import { imageFileOf, productOf } from "../../seeds/f03-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const pathOf = (url: string) => new URL(url).pathname;
const 画像のファイル名 = (src: string | null) => (src ?? "").split("?")[0].split("/").pop() ?? "";

// ---- 001 ----
caseTest("IT-F03-06-001", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-F0306-001〕");
  await 閲覧履歴を設定(page.context(), [id]);
  const r = new FrontRecent(page);
  const 見出し: Record<string, boolean> = {};
  const 見る = async (画面: string) => { 見出し[画面] = await r.見出しは表示されている(); };
  await step(1, async () => { expect(await r.open(`${入口.本店}/`), "本店ECTOPの応答").toBeLessThan(400); await r.描画を待つ(); await 見る("本店ECTOP"); });
  await step(2, async () => { await r.商品一覧を開く(入口.本店); await 見る("本店の商品一覧"); });
  await step(3, async () => { await r.商品詳細を開く(入口.本店, id); await 見る("本店の商品詳細"); });
  await step(4, async () => { expect(await r.open(`${入口.TC大阪支店}/`), "TC大阪支店ECTOPの応答").toBeLessThan(400); await r.描画を待つ(); await 見る("TC大阪支店ECTOP"); });
  await step(5, async () => { await r.商品一覧を開く(入口.TC大阪支店); await 見る("TC大阪支店の商品一覧"); });
  await step(6, async () => { await r.商品詳細を開く(入口.TC大阪支店, id); await 見る("TC大阪支店の商品詳細"); });
  await expected(async () => {
    for (const 画面 of ["本店ECTOP", "本店の商品一覧", "本店の商品詳細", "TC大阪支店ECTOP", "TC大阪支店の商品一覧", "TC大阪支店の商品詳細"]) {
      expect.soft(見出し[画面], `${画面}に最近チェックした商品の見出しが表示される`).toBe(true);
    }
  });
});

// ---- 003 ----
caseTest("IT-F03-06-003", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), [notes.get("〔商品ID-F0306-003A〕"), notes.get("〔商品ID-F0306-003B〕")]);
  const r = new FrontRecent(page);
  let 並び: string[] = [];
  await step(1, async () => { await r.商品一覧を開く(入口.TC大阪支店); });
  await step(2, async () => { 並び = await r.商品名の並び(); });
  await expected(async () => {
    expect.soft(並び, "最近チェックした商品欄に、商品公開ステータスが公開の商品が表示される").toContain(rc("STATUS-PUBLIC-003"));
    expect.soft(並び, "最近チェックした商品欄に、商品公開ステータスが非公開の商品が表示されない").not.toContain(rc("STATUS-PRIVATE-003"));
  });
});

// ---- 004 ----
caseTest("IT-F03-06-004", async ({ page, notes, step, expected }) => {
  const r = new FrontRecent(page);
  let 並び: string[] = [];
  await step(1, async () => { await r.商品詳細を開く(入口.本店, notes.get("〔商品ID-F0306-004A〕")); });
  await step(2, async () => { await r.商品詳細を開く(入口.TC大阪支店, notes.get("〔商品ID-F0306-004B〕")); });
  await step(3, async () => { await r.商品一覧を開く(入口.TC大阪支店); });
  await step(4, async () => { 並び = await r.商品名の並び(); });
  await expected(async () => {
    expect.soft(並び, "TC大阪支店の最近チェックした商品欄に、本店でチェックした商品が表示される").toContain(rc("REC-HQ-SHARED-004"));
    expect.soft(並び, "TC大阪支店の最近チェックした商品欄に、TC大阪支店でチェックした商品が表示される").toContain(rc("REC-OSA-SHARED-004"));
  });
});

// ---- 005 ----
caseTest("IT-F03-06-005", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), [notes.get("〔商品ID-F0306-005A〕"), notes.get("〔商品ID-F0306-005B〕")]);
  const r = new FrontRecent(page);
  let 並び: string[] = [];
  await step(1, async () => { await r.商品一覧を開く(入口.TC大阪支店); });
  await step(2, async () => { 並び = await r.商品名の並び(); });
  await expected(async () => {
    expect.soft(並び, "支店表示フラグが立っている商品が表示される").toContain(rc("REC-FLAG-ON-005"));
    expect.soft(並び, "支店表示フラグが立っていない商品が表示されない").not.toContain(rc("REC-FLAG-OFF-005"));
  });
});

// ---- 006 ----
caseTest("IT-F03-06-006", async ({ page, step, expected }) => {
  const r = new FrontRecent(page);
  let 初回の期限 = 0;
  let 開いた時刻 = 0;
  let 更新後の期限 = 0;
  await step(1, async () => {
    await r.商品詳細を開く(入口.本店, productOf("UI-SALE-006").productId);
    初回の期限 = (await 閲覧履歴のCookie(page.context()))?.expires ?? 0;
  });
  await step(2, async () => {
    await page.waitForTimeout(5 * 60 * 1000);
    await r.商品詳細を開く(入口.本店, productOf("UI-NOSALE-006").productId);
    // 開いた時刻は、画面を開き終えた時点の時刻で記録する（画面のスクリプトが期限を決めるのはこの直前）
    開いた時刻 = Date.now();
  });
  await step(3, async () => {
    更新後の期限 = (await 閲覧履歴のCookie(page.context()))?.expires ?? 0;
  });
  await expected(async () => {
    const 日数 = (更新後の期限 * 1000 - 開いた時刻) / 86_400_000;
    note(`手順1のあとの期限=${new Date(初回の期限 * 1000).toISOString()}／手順2で開いた時刻=${new Date(開いた時刻).toISOString()}／手順3の期限=${new Date(更新後の期限 * 1000).toISOString()}（開いた時刻から ${日数.toFixed(3)} 日後）`);
    expect.soft(更新後の期限 > 初回の期限, "閲覧履歴のCookieの有効期限が、手順1のときより後に更新されている").toBe(true);
    expect.soft(日数, "手順2で商品詳細画面を開いた時刻から有効期限までの日数（730日後。1分の誤差まで）").toBeGreaterThan(730 - 1 / 1440);
    expect.soft(日数, "手順2で商品詳細画面を開いた時刻から有効期限までの日数（730日後。1分の誤差まで）").toBeLessThan(730 + 1 / 1440);
  });
});

// ---- 007 ----
caseTest("IT-F03-06-007", async ({ page, step, expected }) => {
  const r = new FrontRecent(page);
  const 名 = (i: number) => `履歴商品${String(i).padStart(2, "0")}`;
  let 並び: string[] = [];
  await step(1, async () => {
    for (let i = 1; i <= 16; i++) await r.商品詳細を開く(入口.本店, productOf(名(i)).productId);
  });
  await step(2, async () => { await r.商品一覧を開く(入口.本店); });
  await step(3, async () => { 並び = await r.商品名の並び(); });
  await expected(async () => {
    const want = Array.from({ length: 15 }, (_, k) => rc(名(16 - k)));
    expect.soft(並び, "「履歴商品16」から「履歴商品02」までが新しい順に15件表示される").toEqual(want);
    expect.soft(並び, "「履歴商品01」が表示されない").not.toContain(rc(名(1)));
  });
});

// ---- 008 ----
caseTest("IT-F03-06-008", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), [notes.get("〔商品ID-F0306-008〕")]);
  const r = new FrontRecent(page);
  let src: string | null = null;
  await step(1, async () => { await r.商品一覧を開く(入口.本店); });
  await step(2, async () => {
    const img = r.サムネイル画像(rc("UI-SALE-008"));
    if ((await img.count()) > 0) src = await img.getAttribute("src");
  });
  await expected(async () => {
    const 表示された = 画像のファイル名(src);
    note(`最近チェックした商品欄のUI-SALE-008のサムネイル=${src ?? "（商品が表示されない）"}／THUMB-FIRST-008のファイル名=${imageFileOf("THUMB-FIRST-008")}／THUMB-SECOND-008のファイル名=${imageFileOf("THUMB-SECOND-008")}`);
    expect.soft(表示された, "UI-SALE-008のサムネイルは、表示順が最も先のTHUMB-FIRST-008の画像").toBe(imageFileOf("THUMB-FIRST-008").split("/").pop());
  });
});

// ---- 009 ----
caseTest("IT-F03-06-009", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), [notes.get("〔商品ID-F0306-009A〕"), notes.get("〔商品ID-F0306-009B〕")]);
  const r = new FrontRecent(page);
  let 日本語版: string[] = [];
  let 英語版: string[] = [];
  await step(1, async () => { await r.商品一覧を開く(入口.本店); 日本語版 = await r.商品名の並び(); });
  await step(2, async () => { await r.商品一覧を開く(入口.本店英語版); 英語版 = await r.商品名の並び(); });
  await expected(async () => {
    expect.soft(日本語版, "日本語版ではREGION-JA-009だけが表示される").toEqual([rc("REGION-JA-009")]);
    expect.soft(英語版, "英語版ではREGION-EN-009だけが表示される").toEqual([rc("REGION-EN-009")]);
  });
});

// ---- 011 ----
caseTest("IT-F03-06-011", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), ["939601101", notes.get("〔商品ID-F0306-011〕")]);
  const r = new FrontRecent(page);
  let 並び: string[] = [];
  await step(1, async () => { await r.商品一覧を開く(入口.本店); });
  await step(2, async () => { 並び = await r.商品名の並び(); });
  await expected(async () => {
    expect.soft(並び, "商品情報を取得できるAVAILABLE-001-011だけが表示され、商品情報を取得できない商品ID 939601101は一覧に表示されない").toEqual([rc("AVAILABLE-001-011")]);
  });
});

// ---- 012 ----
caseTest("IT-F03-06-012", async ({ page, step, expected }) => {
  const r = new FrontRecent(page);
  const 画面: Record<string, { 文: string; 件数: number }> = {};
  const 読む = async (名: string) => { 画面[名] = { 文: await r.ブロックの文(), 件数: await r.商品カード.count() }; };
  await step(1, async () => { await r.商品一覧を開く(入口.本店); await 読む("日本語版"); });
  await step(2, async () => { await r.商品一覧を開く(入口.本店英語版); await 読む("英語版"); });
  await expected(async () => {
    expect.soft(画面["日本語版"].文, "日本語版の最近チェックした商品欄に、履歴が無い旨（最近見た商品はありません。）が表示される").toContain("最近見た商品はありません。");
    expect.soft(画面["英語版"].文, "英語版の最近チェックした商品欄に、履歴が無い旨（No Recently Seen Items）が表示される").toContain("No Recently Seen Items");
    expect.soft(画面["日本語版"].件数 + 画面["英語版"].件数, "商品サムネイル一覧が表示されない（商品の数）").toBe(0);
  });
});

// ---- 013 ----
caseTest("IT-F03-06-013", async ({ page, step, expected }) => {
  await 閲覧履歴を設定(page.context(), ["939601301", "939601302"]);
  const r = new FrontRecent(page);
  let 見出し = false;
  let 文 = "";
  let 件数 = -1;
  await step(1, async () => { await r.商品一覧を開く(入口.本店); });
  await step(2, async () => { 見出し = await r.見出しは表示されている(); 文 = await r.ブロックの文(); 件数 = await r.商品カード.count(); });
  await expected(async () => {
    expect.soft(見出し, "最近チェックした商品の見出しが表示される").toBe(true);
    expect.soft(件数, "商品サムネイル一覧が表示されない（商品の数）").toBe(0);
    expect.soft(文, "履歴が無い旨の表示が表示されない（欄の文は見出しだけ）").toBe("最近チェックした商品");
  });
});

// ---- 015 ----
caseTest("IT-F03-06-015", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), [notes.get("〔商品ID-F0306-015A〕"), notes.get("〔商品ID-F0306-015B〕")]);
  const r = new FrontRecent(page);
  const 見えた: Record<string, { 商品: number; セール: number }> = {};
  await step(1, async () => { await r.商品一覧を開く(入口.本店); });
  await step(2, async () => {
    for (const n of ["UI-SALE-015", "UI-NOSALE-015"]) {
      見えた[n] = { 商品: await r.カード(rc(n)).count(), セール: await r.セールアイコン(rc(n)).count() };
    }
  });
  await expected(async () => {
    expect.soft(見えた["UI-SALE-015"].商品, "セールフラグが立っているUI-SALE-015が表示される（商品の数）").toBe(1);
    expect.soft(見えた["UI-SALE-015"].セール, "UI-SALE-015にセールアイコンが表示される（アイコンの数）").toBe(1);
    expect.soft(見えた["UI-NOSALE-015"].商品, "セールフラグが立っていないUI-NOSALE-015が表示される（商品の数）").toBe(1);
    expect.soft(見えた["UI-NOSALE-015"].セール, "UI-NOSALE-015にセールアイコンが表示されない（アイコンの数）").toBe(0);
  });
});

// ---- 016 ----
caseTest("IT-F03-06-016", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), [notes.get("〔商品ID-F0306-016〕")]);
  const r = new FrontRecent(page);
  const 表示: Record<string, { 商品: number; 拡大: boolean }> = {};
  const 確かめる = async (版: string) => {
    const 拡大 = r.商品画像拡大(rc("UI-SALE-016"));
    表示[版] = { 商品: await r.カード(rc("UI-SALE-016")).count(), 拡大: (await 拡大.count()) > 0 && (await 拡大.isVisible()) };
  };
  await step(1, async () => { await page.setViewportSize({ width: 1280, height: 800 }); await r.商品一覧を開く(入口.本店); await 確かめる("PC版"); });
  await step(2, async () => { await page.setViewportSize({ width: 390, height: 844 }); await r.商品一覧を開く(入口.本店); await 確かめる("SP版"); });
  await expected(async () => {
    expect.soft(表示["SP版"].商品, "SP版の最近チェックした商品欄にUI-SALE-016が表示される（商品の数）").toBe(1);
    expect.soft(表示["SP版"].拡大, "商品画像拡大がSP版に表示される").toBe(true);
    expect.soft(表示["PC版"].拡大, "商品画像拡大がPC版に表示されない").toBe(false);
  });
});

// ---- 017 ----
caseTest("IT-F03-06-017", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), [notes.get("〔商品ID-F0306-017〕")]);
  const r = new FrontRecent(page);
  let 拡大画像が見える = false;
  let 拡大画像の元 = "";
  await step(1, async () => { await page.setViewportSize({ width: 390, height: 844 }); await r.商品一覧を開く(入口.本店); });
  await step(2, async () => {
    const 拡大 = r.商品画像拡大(rc("UI-SALE-017"));
    await 拡大.click({ timeout: 30_000 });
    await r.拡大画像.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    拡大画像が見える = (await r.拡大画像.count()) > 0 && (await r.拡大画像.first().isVisible());
    拡大画像の元 = (await r.拡大画像.count()) > 0 ? ((await r.拡大画像.first().getAttribute("src")) ?? "") : "";
  });
  await expected(async () => {
    expect.soft(拡大画像が見える, "UI-SALE-017の商品画像の拡大画像が表示される").toBe(true);
    expect.soft(拡大画像の元, "拡大画像の画像の取得元が空でない").not.toBe("");
  });
});

// ---- 018 ----
caseTest("IT-F03-06-018", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), [notes.get("〔商品ID-F0306-018〕")]);
  const r = new FrontRecent(page);
  let 言語: { 件数: number; 文: string } = { 件数: -1, 文: "" };
  await step(1, async () => { await r.商品一覧を開く(入口.本店); });
  await step(2, async () => {
    const l = r.カード言語(rc("UI-SALE-018"));
    言語 = { 件数: await l.count(), 文: (await l.count()) > 0 ? ((await l.first().innerText()) ?? "").trim() : "" };
  });
  await expected(async () => {
    expect.soft(言語.件数, "UI-SALE-018にカード言語の表示がある（表示の数）").toBe(1);
    expect.soft(言語.文, "UI-SALE-018に商品へ登録されている言語コードJPが表示される").toBe("JP");
  });
});

// ---- 020 ----
caseTest("IT-F03-06-020", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-F0306-020〕");
  await 閲覧履歴を設定(page.context(), [id]);
  const r = new FrontRecent(page);
  await step(1, async () => { await r.商品一覧を開く(入口.本店); });
  await step(2, async () => {
    const link = r.商品名リンク(rc("UI-SALE-020"));
    await link.first().click({ timeout: 30_000 });
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "UI-SALE-020の商品詳細画面へ遷移する").toBe(`${入口.本店}/products/detail/${id}`);
  });
});

// ---- 021 ----
caseTest("IT-F03-06-021", async ({ page, notes, step, expected }) => {
  await 閲覧履歴を設定(page.context(), [notes.get("〔商品ID-F0306-021〕")]);
  const r = new FrontRecent(page);
  let 並び: string[] = [];
  await step(1, async () => { await r.商品一覧を開く(入口.本店); });
  await step(2, async () => { 並び = await r.商品名の並び(); });
  await expected(async () => {
    expect.soft(並び, "本店の最近チェックした商品欄に、支店表示フラグが立っていないF0306-021-NOFLAGが表示される").toContain(rc("F0306-021-NOFLAG"));
  });
});
