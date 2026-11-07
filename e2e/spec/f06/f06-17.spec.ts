/** F06-17 大会デッキ登録確認〜完了（フロント）。正本: cases/F06-17_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { DeckEditPage, 前面 } from "../../pages/front/f06_16_deck_entry";
import { DeckCheckPage } from "../../pages/front/f06_17_deck_check";
import * as DB from "../../db/f06_16";
import { カード名 } from "../../pages/admin/f06_17_setup";
import { 会員一覧, 大会一覧, 提出したデッキ } from "../../seeds/f06-17";
import "../../seeds/f06-17";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 会員 = (n: string) => { const m = 会員一覧.get(n); if (!m) throw new Error(`会員 ${n} が作られていない`); return m; };
const 大会 = (n: string) => { const d = 大会一覧.get(n); if (!d) throw new Error(`大会 ${n} が作られていない`); return d; };
const デッキ = (n: string) => { const d = 提出したデッキ.get(n); if (!d) throw new Error(`デッキ ${n} が提出されていない`); return d; };
const 行 = (text: string): string[] => text.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);

async function ログイン(page: Page, n: string): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await frontLogin(page, 会員(n));
}
const A = () => カード名.通常A();
const B = () => カード名.通常B();

caseTest("IT-F06-17-001", async ({ page, notes, step, expected }) => {
  await ログイン(page, "001");
  const e = new DeckEditPage(page);
  const d = 大会("001");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", `1 ${A()}`); await e.入力する("サイド", `1 ${B()}`); });
  await step(3, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(4, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("001").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "新規作成されたデッキの件数").toBe(1);
    const k = decks[0];
    if (!k) return;
    expect.soft(k.フォーマット名, "フォーマット").toBe("スタンダード試験");
    expect.soft(k.プレイヤー名, "選手の英字姓名").toBe("TEST TARO");
    expect.soft(k.大会名, "大会名").toBe(d.大会名);
    expect.soft(k.開催日時, "大会日").toBe("2099-12-20 10:00");
    expect.soft(k.公開設定, "公開区分").toBe("非公開");
    expect.soft(k.デッキタイプ, "デッキ種別（大会）").toBe("イベント");
    expect.soft(DB.デッキのカード情報(k.デッキID).map((c) => `${c.ボード}:${c.枚数}`).sort(), "メインボードとサイドボードのカード").toEqual(["Main Board:1", "Side Board:1"]);
  });
});

caseTest("IT-F06-17-003", async ({ page, step, expected }) => {
  await ログイン(page, "003");
  const e = new DeckEditPage(page);
  await step(1, async () => { await e.開く(大会("003").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", `1 ${A()}`); await e.入力する("サイド", `1 ${B()}`); });
  await step(3, async () => { await e.提出する(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（デッキ登録完了画面）").toMatch(/^\/ja\/deckentry\/\d+\/check\/?$/);
  });
});

caseTest("IT-F06-17-007", async ({ page, step, expected }) => {
  await ログイン(page, "007");
  const e = new DeckEditPage(page);
  const d = 大会("007");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", `1 ${A()}`); await e.入力する("サイド", `1 ${B()}`); });
  await step(3, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(4, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("007").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "登録されたデッキの件数").toBe(1);
    expect.soft(decks[0]?.プレイヤー名, "プレイヤー名（会員カナ氏名）").toBe("ヤマダ ハナコ");
  });
});

caseTest("IT-F06-17-008", async ({ page, step, expected }) => {
  await ログイン(page, "008");
  const e = new DeckEditPage(page);
  const d = 大会("008");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", `1 ${A()}`); await e.入力する("サイド", `1 ${B()}`); });
  await step(3, async () => { await e.トークン.evaluate((o) => o.remove()); });
  await step(4, async () => { await e.提出する(); });
  let n = -1;
  await step(5, async () => { n = DB.大会デッキ一覧(d.日程ID, 会員("008").選手ID).length; });
  await expected(async () => { expect.soft(n, "登録されたデッキの件数").toBe(0); });
});

caseTest("IT-F06-17-009", async ({ page, step, expected }) => {
  await ログイン(page, "009");
  const e = new DeckEditPage(page);
  const d = 大会("009");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", `1 ${A()}`); await e.入力する("サイド", `1 ${B()}`); });
  await step(3, async () => { await e.トークン.evaluate((o) => { (o as HTMLInputElement).value = "invalid-token"; }); });
  await step(4, async () => { await e.提出する(); });
  let n = -1;
  await step(5, async () => { n = DB.大会デッキ一覧(d.日程ID, 会員("009").選手ID).length; });
  await expected(async () => { expect.soft(n, "登録されたデッキの件数").toBe(0); });
});

caseTest("IT-F06-17-014", async ({ page, notes, step, expected }) => {
  await ログイン(page, "014");
  const e = new DeckEditPage(page);
  const b = 大会("014B");
  await step(1, async () => { await e.開く(大会("014").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => {
    const fid = notes.get("〔フォーマットID-F0617-共有D〕");
    await page.locator("form#decklist_submit").evaluate((f, [id]) => { (f as HTMLFormElement).action = (f as HTMLFormElement).action.replace(/\/deckentry\/\d+\/update/, `/deckentry/${id}/update`); }, [b.日程ID]);
    await page.locator('form#decklist_submit input[name="format"]').first().evaluate((o, v) => { (o as HTMLInputElement).value = v; }, fid);
  });
  await step(3, async () => { await e.入力する("メイン", `1 ${A()}`); await e.入力する("サイド", `1 ${B()}`); await e.提出する(); });
  let n = -1;
  await step(4, async () => { n = DB.日程の大会デッキ件数(b.日程ID); });
  await expected(async () => { expect.soft(n, "送信先の日程の大会デッキの件数（登録期限を過ぎているので登録されない）").toBe(0); });
});

const 不明 = "不明カードX";
async function エラー形式の入力(e: DeckEditPage): Promise<void> {
  await e.入力する("メイン", [`1 ${不明}`, `1 ${カード名.禁止B()}`, `2 ${カード名.制限R()}`, `5 ${A()}`].join("\n"));
  await e.入力する("サイド", `3 ${カード名.範囲外O()}`);
}

caseTest("IT-F06-17-015", async ({ page, step, expected }) => {
  await ログイン(page, "015");
  const e = new DeckEditPage(page);
  const d = 大会("015");
  note(`事前準備の「不明カードX の現行カード情報が無いこと」は、DBの参照で確かめた（${DB.カードの件数(不明)}件）`);
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", [`1 ${不明}`, `1 ${カード名.禁止B()}`, `2 ${カード名.制限R()}`, `5 ${A()}`].join("\n")); });
  await step(3, async () => { await e.入力する("サイド", `3 ${カード名.範囲外O()}`); });
  await step(4, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(5, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員("015").選手ID); });
  await expected(async () => {
    expect.soft(decks.length, "保存されたデッキの件数").toBe(1);
    expect.soft(行(decks[0]?.メイン ?? ""), "メインボードの入力内容").toEqual([`1 ${不明}`, `1 ${カード名.禁止B()}`, `2 ${カード名.制限R()}`, `5 ${A()}`]);
    expect.soft(行(decks[0]?.サイド ?? ""), "サイドボードの入力内容").toEqual([`3 ${カード名.範囲外O()}`]);
  });
});

caseTest("IT-F06-17-016", async ({ page, step, expected }) => {
  await ログイン(page, "016");
  const e = new DeckEditPage(page);
  const c = new DeckCheckPage(page);
  note(`事前準備の「不明カードX の現行カード情報が無いこと」は、DBの参照で確かめた（${DB.カードの件数(不明)}件）`);
  await step(1, async () => { await e.開く(大会("016").日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", [`1 ${不明}`, `1 ${カード名.禁止B()}`, `2 ${カード名.制限R()}`, `5 ${A()}`].join("\n")); });
  await step(3, async () => { await e.入力する("サイド", `3 ${カード名.範囲外O()}`); });
  await step(4, async () => { await e.提出する(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示している画面（デッキ登録完了画面）").toMatch(/^\/ja\/deckentry\/\d+\/check\/?$/);
    const main = await c.区画のエラー("メインボード");
    const side = await c.区画のエラー("サイドボード");
    expect.soft(main, "メインボードのエラー（最大枚数・不明カード・禁止カード・制限カード・投入枚数超過）").toContain(不明);
    expect.soft(main, "メインボードのエラーに禁止カードの名前").toContain(カード名.禁止B());
    expect.soft(main, "メインボードのエラーに制限カードの名前").toContain(カード名.制限R());
    expect.soft(main, "メインボードのエラーに投入枚数超過のカードの名前").toContain(A());
    expect.soft(main, "メインボードのエラーに最大枚数").toMatch(/最大|上限|3/);
    expect.soft(side, "サイドボードのエラーに範囲外カードの名前").toContain(カード名.範囲外O());
    expect.soft(side, "サイドボードのエラーに最大枚数").toMatch(/最大|上限|2/);
  });
});

caseTest("IT-F06-17-017", async ({ page, step, expected }) => {
  await ログイン(page, "017");
  const c = new DeckCheckPage(page);
  const d = 大会("017");
  await step(1, async () => { await c.開く(デッキ("017")); await expect(c.見出し).toBeVisible(); });
  const r = { 名: "", 情報: "", main: "", side: "", mc: "", sc: "", 画像: 0, 単独: 0, 枚数: [] as string[] };
  await step(2, async () => {
    r.名 = (await c.大会名.innerText()).trim();
    r.情報 = (await c.大会情報.innerText()).replace(/\s+/g, " ");
    r.main = await c.区画の内容("メインボード"); r.side = await c.区画の内容("サイドボード");
    r.mc = await c.区画の枚数表示("メインボード"); r.sc = await c.区画の枚数表示("サイドボード");
    r.画像 = await page.locator(".p-hareruya-deckentry-check__card-image").count();
    r.枚数 = await page.locator(".p-hareruya-deckentry-check__card-count").allInnerTexts();
    r.単独 = await c.フォーマット単独項目.count();
  });
  await expected(async () => {
    expect.soft(r.名, "大会名にフォーマットが括弧付きで添えられる").toMatch(new RegExp(`^${d.大会名}[（(]スタンダード試験[）)]$`));
    expect.soft(r.情報, "開催店舗").toContain("晴れる屋テスト店");
    expect.soft(r.情報, "選手の英字姓名").toContain("TEST TARO");
    expect.soft(行(r.main), "メインボードの登録内容").toEqual([`1 ${A()}`]);
    expect.soft(行(r.side), "サイドボードの登録内容").toEqual([`1 ${B()}`]);
    expect.soft(r.mc, "メインボードの合計枚数").toBe("(1)");
    expect.soft(r.sc, "サイドボードの合計枚数").toBe("(1)");
    expect.soft(r.画像, "カード画像の数").toBe(2);
    expect.soft(r.枚数, "カード画像ごとのカード枚数").toEqual(["1", "1"]);
    expect.soft(r.単独, "フォーマットの単独項目の数（表示されない）").toBe(0);
  });
});

caseTest("IT-F06-17-018", async ({ page, step, expected }) => {
  await ログイン(page, "018");
  const c = new DeckCheckPage(page);
  const d = 大会("018");
  await step(1, async () => { await c.開く(デッキ("018")); await expect(c.見出し).toBeVisible(); });
  let 名 = "", 単独 = "";
  await step(2, async () => { 名 = (await c.大会名.innerText()).trim(); 単独 = await c.フォーマット単独項目の値.first().innerText().catch(() => ""); });
  await expected(async () => {
    expect.soft(名, "大会名に大会の全フォーマットが括弧付きで添えられる").toMatch(new RegExp(`^${d.大会名}[（(]スタンダード試験.*モダン試験[）)]$`));
    expect.soft(単独.trim(), "フォーマットの単独項目").toBe("モダン試験");
  });
});

caseTest("IT-F06-17-019", async ({ page, step, expected }) => {
  await ログイン(page, "019");
  const c = new DeckCheckPage(page);
  await step(1, async () => { await c.開く(デッキ("019")); await expect(c.見出し).toBeVisible(); });
  let src = "", 枚数 = "", loaded = false, alt = "";
  await step(2, async () => {
    const item = c.カード画像の項目.first();
    await expect(item).toBeVisible();
    const img = item.locator("img");
    src = (await img.getAttribute("src")) ?? ""; alt = (await img.getAttribute("alt")) ?? "";
    枚数 = (await item.locator(".p-hareruya-deckentry-check__card-count").innerText()).trim();
    await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const i = document.querySelector(".p-hareruya-deckentry-check__card-image") as HTMLImageElement | null; return !!i && i.complete; }, undefined, { timeout: 30_000 }).catch(() => undefined);
    loaded = await img.evaluate((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0);
  });
  await expected(async () => {
    expect.soft(alt, "カード画像の対象のカード名").toBe(カード名.画像なし());
    expect.soft(src, "代替画像のアドレス").not.toBe("");
    expect.soft(loaded, "代替画像が表示されている").toBe(true);
    expect.soft(枚数, "登録枚数").toBe("1");
  });
});

caseTest("IT-F06-17-020", async ({ page, step, expected }) => {
  await ログイン(page, "020");
  const c = new DeckCheckPage(page);
  await step(1, async () => { await c.開く(デッキ("020")); await expect(c.見出し).toBeVisible(); });
  let 領域 = "", 項目名: string[] = [];
  await step(2, async () => { 領域 = (await c.大会情報.innerText()).replace(/\s+/g, " "); 項目名 = (await c.大会情報.locator("dt").allInnerTexts()).map((t) => t.trim()); });
  await expected(async () => {
    expect.soft(領域.includes("DCI"), "DCIナンバーの表示").toBe(false);
    expect.soft(項目名.includes("名前"), "項目「名前」の表示").toBe(false);
    expect.soft(領域, "プレイヤー名").toContain("TEST TARO");
  });
});

caseTest("IT-F06-17-021", async ({ page, step, expected }) => {
  await ログイン(page, "021");
  const c = new DeckCheckPage(page);
  await step(1, async () => { await c.開く(デッキ("021")); await expect(c.見出し).toBeVisible(); });
  let リンク = -1, url0 = "", url1 = "";
  await step(2, async () => {
    await expect(c.パンくずの現在ページ).toBeVisible();
    リンク = await c.パンくずの現在ページ.locator("xpath=ancestor-or-self::a").count();
    url0 = page.url();
    await c.パンくずの現在ページ.click({ timeout: 5_000 }).catch(() => undefined);
    url1 = page.url();
  });
  await expected(async () => {
    expect.soft(リンク, "現在表示中ページがリンクになっている数").toBe(0);
    expect.soft(url1, "押したあとの画面のアドレス").toBe(url0);
  });
});

caseTest("IT-F06-17-022", async ({ page, step, expected }) => {
  await ログイン(page, "022");
  const c = new DeckCheckPage(page);
  await step(1, async () => { await c.開く(デッキ("022")); await expect(c.見出し).toBeVisible(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), c.パンくずのホーム.click({ timeout: 60_000, noWaitAfter: true })]); await page.waitForLoadState("load"); });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, "遷移先（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});

caseTest("IT-F06-17-023", async ({ page, step, expected }) => {
  await ログイン(page, "023");
  const c = new DeckCheckPage(page);
  await step(1, async () => { await c.開く(デッキ("023")); await expect(c.見出し).toBeVisible(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), c.大会一覧に戻る.click({ timeout: 60_000, noWaitAfter: true })]); await page.waitForLoadState("load"); });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, "遷移先（イベント・大会のトップページ）").toMatch(/^\/ja\/events\/?$/); });
});

caseTest("IT-F06-17-024", async ({ page, step, expected }) => {
  await ログイン(page, "024");
  const c = new DeckCheckPage(page);
  const d = 大会("024");
  await step(1, async () => { await c.開く(デッキ("024")); await expect(c.見出し).toBeVisible(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), c.デッキ編集に戻る.click({ timeout: 60_000, noWaitAfter: true })]); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（デッキ編集画面）").toBe(`/ja/deckentry/${d.日程ID}/edit`);
    expect.soft(await new DeckEditPage(page).表示されている(), "デッキ編集画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-17-029", async ({ page, step, expected }) => {
  await ログイン(page, "029");
  const c = new DeckCheckPage(page);
  await step(1, async () => { await c.開く(デッキ("029")); await expect(c.見出し).toBeVisible(); });
  await step(2, async () => {
    const en = page.locator("a.p-hareruya-header__nav-link[aria-label=\"言語切替\"]").first();
    await expect(en, "言語切替の「EN」").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), en.click({ timeout: 60_000, noWaitAfter: true })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（デッキ登録完了画面の英語表示）").toMatch(/^\/en\/deckentry\/\d+\/check\/?$/);
    expect.soft(await c.表示されている(), "デッキ登録完了画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-17-030", async ({ page, step, expected }) => {
  await ログイン(page, "030");
  const e = new DeckEditPage(page);
  const d = 大会("030");
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await e.入力する("メイン", `1 ${A()}\n${B()}`); await e.入力する("サイド", `1 ${B()}`); });
  await step(3, async () => { await e.提出する(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示している画面（デッキ編集画面）").toBe(`/ja/deckentry/${d.日程ID}/update`);
    expect.soft(await e.表示されている(), "デッキ編集画面が表示される").toBe(true);
    expect.soft(行(await e.メイン.inputValue()), "メインボードの入力内容").toEqual([`1 ${A()}`, B()]);
    expect.soft(行(await e.サイド.inputValue()), "サイドボードの入力内容").toEqual([`1 ${B()}`]);
  });
});

caseTest("IT-F06-17-027", async ({ page, step, expected }) => {
  await ログイン(page, "027");
  const c = new DeckCheckPage(page);
  let status = 0;
  await step(1, async () => { status = (await c.開く(デッキ("027")))?.status() ?? 0; });
  await expected(async () => {
    expect.soft(await c.表示されている(), "大会デッキ登録完了画面が表示される").toBe(false);
    expect.soft(status, "応答の状態").toBe(404);
  });
});
