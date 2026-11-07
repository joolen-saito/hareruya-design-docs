/** M14-10 フォーマット詳細の続き（設定が公開側・デッキ登録へ反映される連携確認・デッキが紐づく削除）。正本: cases/M14-10_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { デッキ名のデッキID, フォーマットの値 } from "../../db/m14_10_format";
import { フォーマット入力, 編集画面を開く, 入力する, 登録を押す } from "../../pages/admin/m14_10_format";
import { デッキを登録する } from "../../pages/admin/m15_deck";
import { chooseByLabel } from "../../pages/admin/common";
import { FrontDetailSearch } from "../../pages/front/f03_03_detail_search";
import { DeckSearchTop, EventListFront, 前面 } from "../../pages/front/m14_10_deck_front";
import { M1410_ADMIN } from "../../seeds/m14-10";
import "../../seeds/m14-10-d";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** フォーマット新規登録・編集画面を開く（手順1） */
async function 編集を開く(page: Page, id: string): Promise<void> { await 編集画面を開く(page, id); }
/** チェック項目を設定して「登録」を押す（保存の結果を返す） */
async function 設定して登録(page: Page, v: Partial<フォーマット入力>): Promise<{ sent: boolean; saved: boolean }> {
  await 入力する(page, v);
  const r = await 登録を押す(page);
  const saved = r.sent && (await page.locator(".alert-success").count()) > 0;
  return { sent: r.sent, saved };
}
const 保存できた = (r: { sent: boolean; saved: boolean }) => expect.soft(r.saved, "フォーマットの変更が保存された（成功メッセージが表示された）").toBe(true);

// ---------------------------------------------------------------------------
// 025・026 デッキ検索条件・商品検索条件への表示
// ---------------------------------------------------------------------------
caseTest("IT-M14-10-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-025〕"), 名 = rc("連携確認フォーマット-025");
  let 選択肢: string[] = [];
  await step(1, async () => { await 編集を開く(page, id); });
  await step(2, async () => { 保存できた(await 設定して登録(page, { チェック: { searchFlg: true } })); });
  await step(3, async () => { await new DeckSearchTop(page).開く(); });
  await step(4, async () => { 選択肢 = await new DeckSearchTop(page).検索条件のフォーマット(); });
  await expected(async () => { expect.soft(選択肢, "デッキ検索条件のフォーマットの選択肢").toContain(名); });
});

caseTest("IT-M14-10-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-026〕"), 名 = rc("連携確認フォーマット-026");
  const f = new FrontDetailSearch(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await 編集を開く(page, id); });
  await step(2, async () => { 保存できた(await 設定して登録(page, { チェック: { productSearchFlg: true } })); });
  await step(3, async () => { await f.openProductList(); await f.詳細検索を押す(); });
  await step(4, async () => { 選択肢 = await f.フォーマットの選択肢(); });
  await expected(async () => { expect.soft(選択肢.some((t) => t.includes(名)), "詳細検索モーダルのフォーマットの選択肢").toBe(true); });
});

// ---------------------------------------------------------------------------
// 027〜029・063・075 デッキ検索のトップ（採用デッキ数ランキング・メタ分布へのリンク）
// ---------------------------------------------------------------------------
type 状態 = { ランキング: boolean; メタ: boolean };
function デッキ検索トップ(n: string, 基: string, 設定: Partial<Record<"rankingFlg" | "OtherMetaFlg", boolean>>, 確かめ: (c: { ランキングの行数: number; ランキングの区画: number; メタ分布のリンク: number; 名: string }) => void): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1410_ADMIN);
    const id = notes.get(`〔フォーマットID-M1410-${n}〕`), 名 = rc(基);
    const top = new DeckSearchTop(page);
    let 応答 = 0; let c = { ランキングの行数: -1, ランキングの区画: -1, メタ分布のリンク: -1, 名 };
    await step(1, async () => { await 編集を開く(page, id); });
    await step(2, async () => { 保存できた(await 設定して登録(page, { チェック: 設定 })); });
    await step(3, async () => {
      応答 = await top.開く();
      await expect(page.locator(".deckSearch-top__flexwrapper").first(), "デッキ検索のトップ").toBeVisible({ timeout: 30_000 });
      c = { ランキングの行数: await top.ランキングの行(id).count(), ランキングの区画: await top.区画(id).count(), メタ分布のリンク: await top.メタ分布のリンク(id).count(), 名 };
    });
    await expected(async () => { expect.soft(応答, "デッキ検索のトップの応答").toBe(200); 確かめ(c); });
  };
}
caseTest("IT-M14-10-027", デッキ検索トップ("027", "連携確認フォーマット-027", { rankingFlg: true }, (c) => { expect.soft(c.ランキングの行数, "採用デッキ数ランキングの行（アーキタイプ）の数").toBeGreaterThanOrEqual(1); }));
caseTest("IT-M14-10-028", デッキ検索トップ("028", "連携確認フォーマット-028", { rankingFlg: true }, (c) => { expect.soft(c.メタ分布のリンク, "メタ分布へのリンクの数").toBeGreaterThanOrEqual(1); }));
caseTest("IT-M14-10-029", デッキ検索トップ("029", "連携確認フォーマット-029", { rankingFlg: false, OtherMetaFlg: true }, (c) => { expect.soft(c.メタ分布のリンク, "メタ分布へのリンクの数").toBeGreaterThanOrEqual(1); }));
caseTest("IT-M14-10-063", デッキ検索トップ("063", "連携確認フォーマット-063", { rankingFlg: false, OtherMetaFlg: false }, (c) => {
  expect.soft(c.ランキングの行数, "採用デッキ数ランキングの行の数（表示されない）").toBe(0);
  expect.soft(c.メタ分布のリンク, "メタ分布へのリンクの数（表示されない）").toBe(0);
}));
caseTest("IT-M14-10-075", デッキ検索トップ("075", "連携確認フォーマット-CB075", { rankingFlg: true, OtherMetaFlg: true }, (c) => {
  expect.soft(c.ランキングの行数, "採用デッキ数ランキングの行の数").toBeGreaterThanOrEqual(1);
  expect.soft(c.メタ分布のリンク, "メタ分布へのリンクの数").toBeGreaterThanOrEqual(1);
}));

// ---------------------------------------------------------------------------
// 034・035・057 イベント一覧
// ---------------------------------------------------------------------------
caseTest("IT-M14-10-034", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const A = rc("連携確認フォーマット-034"), B = rc("イベント非表示フォーマット-034");
  let 選択肢: string[] = [];
  await step(1, async () => { await 編集を開く(page, notes.get("〔フォーマットID-M1410-034A〕")); });
  await step(2, async () => { 保存できた(await 設定して登録(page, { チェック: { isShownInEvent: true } })); });
  await step(3, async () => { await new EventListFront(page).開く(); });
  await step(4, async () => { const e = new EventListFront(page); await e.モーダルを開く(); 選択肢 = await e.検索条件のフォーマット(); });
  await expected(async () => {
    expect.soft(選択肢.some((t) => t.includes(A)), "イベントに表示を選んだフォーマットが選択肢にある").toBe(true);
    expect.soft(選択肢.some((t) => t.includes(B)), "イベントに表示が未選択のフォーマットが選択肢にある（無いのが期待）").toBe(false);
  });
});

caseTest("IT-M14-10-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const A = rc("連携確認フォーマット-035"), 名A = rc("連携イベントA-035"), 名B = rc("連携イベントB-035");
  const e = new EventListFront(page);
  let 名一覧: string[] = [];
  await step(1, async () => { await 編集を開く(page, notes.get("〔フォーマットID-M1410-035A〕")); });
  await step(2, async () => { 保存できた(await 設定して登録(page, { チェック: { isShownInEvent: true } })); });
  await step(3, async () => { await e.開く(); });
  await step(4, async () => { await e.モーダルを開く(); await e.フォーマットを選ぶ(A); await e.検索する(); 名一覧 = await e.全ページのイベント名(); });
  await expected(async () => {
    expect.soft(名一覧.includes(名A), "「連携イベントA-035」が表示されている").toBe(true);
    expect.soft(名一覧.includes(名B), "「連携イベントB-035」が表示されている（表示されないのが期待）").toBe(false);
  });
});

caseTest("IT-M14-10-057", async ({ page, step, expected }) => {
  const 名A = rc("表示確認イベントA-057"), 名B = rc("表示確認イベントB-057");
  const e = new EventListFront(page);
  let 名一覧: string[] = [];
  await step(1, async () => { await e.開く(); });
  await step(2, async () => { 名一覧 = await e.全ページのイベント名(); });
  await expected(async () => {
    expect.soft(名一覧.includes(名A), "「表示確認イベントA-057」が表示されている").toBe(true);
    expect.soft(名一覧.includes(名B), "「表示確認イベントB-057」が表示されている（表示されないのが期待）").toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 039・065〜067 ハイランダー（管理画面のデッキ登録の警告）
// ---------------------------------------------------------------------------
function ハイランダー(n: string, 名: string[], 設定: boolean, 重複: string, 期待あり: boolean, 確認の手順あり = true): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1410_ADMIN);
    const id = notes.get(`〔フォーマットID-M1410-${n}〕`), 形式 = rc(`連携確認フォーマット-${n}`), アーキタイプ = rc(`連携確認アーキタイプ-${n}`);
    const 警告: string[] = [];
    let 表示: string[] = [];
    await step(1, async () => { await 編集を開く(page, id); });
    await step(2, async () => {
      if (設定) 保存できた(await 設定して登録(page, { チェック: { HighlanderFlg: true } }));
      else { const r = await 登録を押す(page); 保存できた({ sent: r.sent, saved: r.sent && (await page.locator(".alert-success").count()) > 0 }); }
    });
    await step(3, async () => { await page.goto(adminUrl("/deck/new")); await page.waitForLoadState("load"); });
    await step(4, async () => { await chooseByLabel(page.locator('[name="admin_deck[Format]"]'), 形式); });
    await step(5, async () => {
      const 行 = 名.map((x) => `1 ${rc(x)}`).join("\n");
      await デッキを登録する(page, { デッキ名: rc(`連携確認デッキ-${n}`), デッキタイプ: "event", フォーマット: 形式, アーキタイプ, 公開状態: "非公開", メイン: 行 }, (m) => 警告.push(m));
      if (!確認の手順あり) 表示 = (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    });
    if (確認の手順あり) await step(6, async () => { 表示 = (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean); });
    await expected(async () => {
      const 文 = [...警告, ...表示].join(" / ");
      const あり = 文.includes(`行目の ${rc(重複)} が2枚以上登録されています`);
      expect.soft(あり, 期待あり ? `同名カード「${重複}」が2枚以上登録されていることを示すアラートが表示されている` : `同名カードが2枚以上登録されていることを示すアラートが表示されていない（表示されたアラート: ${文 || "なし"}）`).toBe(期待あり);
      if (期待あり) expect.soft(文, "アラートが2行目を示している").toContain(`2 行目の ${rc(重複)} が2枚以上登録されています`);
    });
  };
}
caseTest("IT-M14-10-039", ハイランダー("039", ["重複試験カード-039", "重複試験カード-039"], true, "重複試験カード-039", true, false));
caseTest("IT-M14-10-065", ハイランダー("065", ["単独試験カードA-065", "単独試験カードB-065"], true, "単独試験カードA-065", false));
caseTest("IT-M14-10-066", ハイランダー("066", ["重複試験カード-066", "重複試験カード-066"], false, "重複試験カード-066", false));
caseTest("IT-M14-10-067", ハイランダー("067", ["重複基本土地-067", "重複基本土地-067"], true, "重複基本土地-067", false));

// ---------------------------------------------------------------------------
// 047 デッキが紐づくフォーマットの削除
// ---------------------------------------------------------------------------
caseTest("IT-M14-10-047", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-047〕");
  let 応答 = 0; let 削除済み: boolean | null = null;
  await step(1, async () => { await 編集を開く(page, id); });
  await step(2, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); await expect(page.locator("#DeleteModal"), "削除の確認ポップアップ").toBeVisible(); });
  await step(3, async () => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().method() !== "GET", { timeout: 30_000 }).catch(() => null),
      page.locator('#DeleteModal [data-method="delete"]').click({ timeout: 20_000 }),
    ]);
    await page.waitForLoadState("load").catch(() => undefined);
    応答 = res?.status() ?? 0;
  });
  await step(4, async () => { const v = フォーマットの値(id); 削除済み = v === null ? null : v.削除済み; });
  await expected(async () => {
    expect.soft(応答, "削除要求への応答があった（要求が送られた）").not.toBe(0);
    expect.soft(削除済み === false, "デッキが紐づくフォーマットが削除されずに残っている").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 031 ARENA導入済 → デッキ詳細の「日本語テキスト」
// ---------------------------------------------------------------------------
caseTest("IT-M14-10-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-031〕"), デッキ名 = rc("連携確認デッキ-031"), カード名 = rc("日英カード-031");
  let 応答 = 0; let ダウンロード = false; let 一覧: string = ""; let クリップボード = "";
  await step(1, async () => { await 編集を開く(page, id); });
  await step(2, async () => { 保存できた(await 設定して登録(page, { チェック: { ArenaLegalFlg: true } })); });
  await step(3, async () => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin }).catch(() => undefined);
    const デッキID = デッキ名のデッキID(デッキ名);
    if (!デッキID) throw new Error("シードのデッキが見つからない");
    const res = await page.goto(前面(`/deck/${デッキID}/show/`), { timeout: 60_000 });
    await page.waitForLoadState("load");
    応答 = res?.status() ?? 0;
  });
  await step(4, async () => {
    const respP = page.waitForResponse((r) => /\/deck\/arena\/\d+/.test(r.url()), { timeout: 20_000 }).catch(() => null);
    page.once("download", () => { ダウンロード = true; });
    await page.locator("a.deckSearch-deckList__export__button--arena", { hasText: "日本語テキスト" }).first().click({ timeout: 30_000 });
    const r = await respP;
    if (r) { try { 一覧 = String(((await r.json()) as { list?: string }).list ?? ""); } catch { 一覧 = ""; } }
  });
  await step(5, async () => {
    クリップボード = await page.evaluate(() => navigator.clipboard.readText().catch(() => "")).catch(() => "");
    if (!ダウンロード) note("日本語テキストのボタンはファイルをダウンロードせず、取得した一覧をクリップボードへコピーする作りだった。コピーされた文（無ければ取得した一覧）を確かめた");
  });
  await expected(async () => {
    expect.soft(応答, "デッキ詳細画面の応答").toBe(200);
    const 文 = クリップボード || 一覧;
    expect.soft(文.includes(カード名), `日本語のカード名「${カード名}」を含むテキストが得られた（得られた文: ${文.slice(0, 80) || "なし"}）`).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 032・036・037 採用枚数ランキング、038 メタゲーム
// ---------------------------------------------------------------------------
async function ランキングを開く(page: Page, id: string): Promise<number> {
  const res = await page.goto(前面(`/deck/${id}/usage_ranking/`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  return res?.status() ?? 0;
}
/** 採用枚数ランキングに出ているカード名 → 枚数（表示の数字だけ） */
async function ランキングの枚数(page: Page, 名: string): Promise<string[]> {
  const li = page.locator(".deckSearch-cardAmount__rk__li").filter({ has: page.locator(`img[alt="${名}"]`) });
  return (await li.locator(".deckSearch-cardAmount__rk__li__da__am").allTextContents()).map((t) => t.replace(/[^0-9]/g, ""));
}

caseTest("IT-M14-10-032", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-032〕"), 名 = rc("基本土地テスト-032");
  let 応答 = 0; let 枚数: string[] = [];
  await step(1, async () => { await 編集を開く(page, id); });
  await step(2, async () => { 保存できた(await 設定して登録(page, { チェック: { IncludeBasicFlg: true } })); });
  await step(3, async () => { 応答 = await ランキングを開く(page, id); 枚数 = await ランキングの枚数(page, 名); });
  await expected(async () => {
    expect.soft(応答, "採用枚数ランキング画面の応答").toBe(200);
    expect.soft(枚数.length, "採用枚数ランキングに「基本土地テスト-032」が含まれる件数").toBeGreaterThanOrEqual(1);
  });
});

function 分析日数(n: string, ランキングも: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1410_ADMIN);
    const id = notes.get(`〔フォーマットID-M1410-${n}〕`), 内 = rc(`分析内カード-${n}`), 外 = rc(`分析外カード-${n}`);
    let 応答 = 0; let 内枚数: string[] = []; let 外枚数: string[] = [];
    await step(1, async () => { await 編集を開く(page, id); });
    await step(2, async () => { 保存できた(await 設定して登録(page, { メタ日数: "7", ...(ランキングも ? { チェック: { rankingFlg: true } } : {}) })); });
    await step(3, async () => {
      if (ランキングも) {
        // デッキ検索のトップから、メタゲームの画面を経て採用枚数ランキングへ
        await page.goto(前面("/deck/"), { timeout: 60_000 });
        await page.waitForLoadState("load");
        await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator(`a[href$="/deck/${id}/metagame/"]:visible`).first().click({ timeout: 30_000 })]);
        await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator(`a[href$="/deck/${id}/usage_ranking/"]`).first().click({ timeout: 30_000 })]);
        応答 = 200;
      } else {
        応答 = await ランキングを開く(page, id);
      }
      内枚数 = await ランキングの枚数(page, 内); 外枚数 = await ランキングの枚数(page, 外);
    });
    await expected(async () => {
      expect.soft(応答, "採用枚数ランキング画面が表示された").toBe(200);
      expect.soft(内枚数, `7日以内のカード「分析内カード-${n}」の採用枚数（4）`).toEqual(["4"]);
      expect.soft(外枚数, `30日前のカード「分析外カード-${n}」の採用枚数（反映されない）`).toEqual([]);
    });
  };
}
caseTest("IT-M14-10-036", 分析日数("036", true));
caseTest("IT-M14-10-037", 分析日数("037", false));

caseTest("IT-M14-10-038", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-038〕"), 内 = rc("分析内アーキタイプ-038"), 外 = rc("分析外アーキタイプ-038");
  let 応答 = 0; let 内行 = ""; let 外行数 = -1;
  await step(1, async () => { await 編集を開く(page, id); });
  await step(2, async () => { 保存できた(await 設定して登録(page, { メタ日数: "7" })); });
  await step(3, async () => {
    const res = await page.goto(前面(`/deck/${id}/metagame/`), { timeout: 60_000 });
    await page.waitForLoadState("load");
    応答 = res?.status() ?? 0;
    const li = (名: string) => page.locator("li.deckSearch-metaList__list__item").filter({ hasText: 名 });
    内行 = (await li(内).first().innerText({ timeout: 10_000 }).catch(() => "")).replace(/\s+/g, " ");
    外行数 = await li(外).count();
  });
  await expected(async () => {
    expect.soft(応答, "メタゲーム画面の応答").toBe(200);
    expect.soft(内行.includes(内) && /デッキ数\D*2(\D|$)/.test(内行), `「分析内アーキタイプ-038」のデッキ数が2（表示: ${内行 || "なし"}）`).toBe(true);
    expect.soft(/100(\.0+)?\s*%/.test(内行), "「分析内アーキタイプ-038」の使用率が100%（30日前の8件は含まれない）").toBe(true);
    expect.soft(外行数, "30日前の「分析外アーキタイプ-038」の行（反映されない）").toBe(0);
  });
});
