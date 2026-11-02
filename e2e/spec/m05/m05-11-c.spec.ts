/** M05-11 受注情報編集（会員リンク・会員備考・受注データ更新履歴・注文番号の表示）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-c";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
const 履歴リンクの注記 = () => test.info().annotations.push({ type: "手順の注記", description: "受注データ更新履歴のリンクの文言は「画面操作変更」。これを正本の「変更」として押した（別タブで履歴画面が開く）" });

async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

caseTest("IT-M05-11-111", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("111"))); });
  await step(2, async () => { await p.注文者情報を開く(); });
  await step(3, async () => { await Promise.all([page.waitForURL(/\/customer\/\d+\/edit/), p.会員IDのリンク.click({ timeout: 20_000 })]); await page.waitForLoadState("load"); });
  await expected(async () => {
    const id = notes.get("〔会員ID-M0511-111〕");
    expect.soft(new URL(page.url()).pathname, `会員ID ${id} の会員情報編集画面`).toMatch(new RegExp(`/customer/${id}/edit$`));
  });
});

caseTest("IT-M05-11-122", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let text = "";
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("122"))); });
  await step(2, async () => { await p.注文者情報を開く(); });
  await step(3, async () => { text = await p.会員備考(); });
  await expected(async () => { expect.soft(text, "会員備考の表示").toContain("会員メモM0511-122"); });
});

caseTest("IT-M05-11-156", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let before = "", after = "", inputs = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("156"))); });
  await step(2, async () => { await p.注文者情報を開く(); });
  await step(3, async () => {
    before = await p.会員備考();
    inputs = await p.会員備考の入力欄の数();
    await page.locator('div.row:has(> label:text-is("会員備考")) > div.col').first().click({ timeout: 20_000 });
    await page.keyboard.type("入力試験");
    after = await p.会員備考();
  });
  await expected(async () => {
    expect.soft(inputs, "会員備考の入力欄の数").toBe(0);
    expect.soft(after, "文字入力を試みたあとの会員備考").toBe(before);
  });
});

/** 履歴画面を開いて、注文者情報／お届け先情報を開いて値を読むケース */
function 履歴の値(n: string, 欄: "注文者" | "お届け先", 姓: string, 住所3: string): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage, h!: OrderEditPage;
    let 読んだ姓 = "", 読んだ住所3 = "";
    await step(1, async () => { p = await 開く(browser, page, notes.get(key(n))); });
    await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); });
    await step(3, async () => {
      if (欄 === "注文者") { await h.注文者情報を開く(); 読んだ姓 = await h.注文者姓欄.inputValue(); 読んだ住所3 = await h.注文者住所3.inputValue(); }
      else { await h.お届け先情報を開く(); 読んだ姓 = await h.お届け先姓.inputValue(); 読んだ住所3 = await h.お届け先住所3.inputValue(); }
    });
    await expected(async () => {
      expect.soft(読んだ姓, `履歴画面の${欄}のお名前（姓）`).toBe(姓);
      expect.soft(読んだ住所3, `履歴画面の${欄}の住所3`).toBe(住所3);
    });
  };
}
caseTest("IT-M05-11-136", 履歴の値("136", "注文者", "履歴姓136", "履歴住所3-136"));
caseTest("IT-M05-11-138", 履歴の値("138", "お届け先", "履歴配送姓138", "履歴配送住所3-138"));

/** 履歴画面で、ある表示が出ない（0件）ことを確かめるケース */
function 履歴に出ない(n: string, 何: "整理番号" | "スマレジ取引ID"): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage, h!: OrderEditPage;
    let 数 = -1, 注文番号 = "";
    await step(1, async () => { p = await 開く(browser, page, notes.get(key(n))); });
    await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); });
    await step(3, async () => {
      await h.status.waitFor({ state: "attached", timeout: 30_000 });
      注文番号 = await h.注文番号の欄();
      数 = 何 === "整理番号" ? await h.整理番号の表示数() : await h.スマレジ取引IDの表示数();
    });
    await expected(async () => {
      expect.soft(注文番号, "履歴画面が開いて注文番号が表示されている").toContain(notes.get(key(n)));
      expect.soft(数, `履歴画面の${何 === "整理番号" ? "店頭販売用整理番号" : "スマレジ取引ID"}の表示数`).toBe(0);
    });
  };
}
caseTest("IT-M05-11-142", 履歴に出ない("142", "整理番号"));
caseTest("IT-M05-11-198", 履歴に出ない("198", "スマレジ取引ID"));

caseTest("IT-M05-11-208", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let 履歴数 = 0;
  const メモ: { 日時: string; 履歴ID: number; 値: string }[] = [];
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("208"))); });
  await step(2, async () => { await p.note.fill("履歴メモ208一回目"); });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { await p.note.fill("履歴メモ208二回目"); });
  await step(5, async () => { await p.受注情報を登録する(onDialog); });
  await step(6, async () => {
    履歴リンクの注記();
    const rows = await p.履歴の行();
    履歴数 = rows.length;
    for (const r of rows) {
      const h = await p.履歴を開く(r.index);
      await h.note.waitFor({ state: "attached", timeout: 30_000 });
      メモ.push({ 日時: r.日時, 履歴ID: r.履歴ID, 値: await h.note.inputValue() });
      await h.page.close();
    }
  });
  await expected(async () => {
    expect.soft(履歴数, "受注データ更新履歴の件数").toBe(2);
    const 古い順 = [...メモ].sort((a, b) => a.日時.localeCompare(b.日時) || a.履歴ID - b.履歴ID);
    expect.soft(古い順[0]?.値, "変更日時の古い履歴のショップ用メモ欄").toBe("履歴メモ208一回目");
    expect.soft(古い順[1]?.値, "変更日時の新しい履歴のショップ用メモ欄").toBe("履歴メモ208二回目");
  });
});

caseTest("IT-M05-11-221", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let 欄 = "", smaregi = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("221"))); });
  await step(2, async () => { 欄 = await p.注文番号の欄(); smaregi = await p.スマレジ取引IDの表示数(); });
  await expected(async () => {
    expect.soft(欄, "画面上部の注文番号の欄（括弧内の注文番号を伴わない）").toBe(notes.get(key("221")));
    expect.soft(smaregi, "スマレジ取引IDの表示数").toBe(0);
  });
});
