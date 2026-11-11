/**
 * F04-03 配送先の新規登録・変更の続き（-x）。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもの。
 * 正本: cases/F04-03_test_cases.tsv。シード: seeds/f04-03-x.ts。
 * 「開発者ツールで送信値を書き換える」（036〜039）は、画面の要素をスクリプトで書き換えて同じ状態にしてから押す（F06-18 と同じ）。
 */
import { Locator, Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { アドレス帳の件数, 会員の配送先 } from "../../db/f04_02";
import { アドレス帳の住所, アドレス帳の値, アドレス帳の都道府県名, 既定のお届け先を有効に戻す, 受注の配送一覧, 都道府県の番号, 配送の住所 } from "../../db/f04_03_x";
import { 処理中受注ID一覧 } from "../../db/f04_02";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { 本店の店名 } from "../../pages/admin/f04_setup";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import { adminUrl, withAdminSession } from "../../lib/session";
import { ShippingEditPage, ShoppingPage } from "../../pages/front/f04_shopping";
import { F0403PA_ADMIN, 英語の買い物かごから開く, 状態の } from "../../seeds/f04-03-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const login = async (page: Page, seedId: string) => { await frontLogin(page, 状態の(seedId).会員); };

/** ご注文方法指定画面の、配送1件目の「新しいお届け先情報を登録する」（言語によらず、行き先の番号の形で見分ける） */
async function 新規のボタン(page: Page): Promise<Locator> {
  const paths = await page.locator('button[data-path*="/shopping/shipping_edit/"]').evaluateAll((bs) => bs.map((b) => b.getAttribute("data-path") ?? ""));
  const p = paths.find((x) => /\/shopping\/shipping_edit\/\d+\/?$/.test(x));
  if (!p) throw new Error(`ご注文方法指定画面に「新しいお届け先情報を登録する」ボタンが無い（${paths.join("、") || "配送先のボタンなし"}）`);
  return page.locator(`button[data-path="${p}"]`).first();
}
/** ご注文方法指定画面の、配送1件目の「お届け先情報を変更する」 */
async function 変更のボタン(page: Page): Promise<Locator> {
  const paths = await page.locator('button[data-path*="/shopping/shipping_edit/"]').evaluateAll((bs) => bs.map((b) => b.getAttribute("data-path") ?? ""));
  const p = paths.find((x) => /\/shopping\/shipping_edit\/\d+\/\d+\/?$/.test(x));
  if (!p) throw new Error(`ご注文方法指定画面に「お届け先情報を変更する」ボタンが無い（${paths.join("、") || "配送先のボタンなし"}）`);
  return page.locator(`button[data-path="${p}"]`).first();
}
async function 新規の入力を開く(page: Page): Promise<ShippingEditPage> {
  const sp = new ShoppingPage(page);
  await sp.買い物かごから開く();
  await sp.押して配送先画面へ(await 新規のボタン(page));
  return new ShippingEditPage(page);
}
async function 変更の入力を開く(page: Page, 名称: string): Promise<ShippingEditPage> {
  const sp = new ShoppingPage(page);
  await sp.お届け先を選ぶ(名称);
  await sp.押して配送先画面へ(await 変更のボタン(page));
  return new ShippingEditPage(page);
}

/** 国を選ぶ（選ぶと画面が送信されて作り直される） */
async function 国を選ぶ(ed: ShippingEditPage, 国: string): Promise<void> {
  if ((await ed.値(ed.国)) === 国) return;
  await Promise.all([ed.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), ed.国.selectOption({ label: 国 })]);
  await ed.page.waitForLoadState("load");
  await expect(ed.国, `国「${国}」が選ばれた`).toHaveValue(/.+/);
  expect(await ed.値(ed.国), "国").toBe(国);
}

type 入力 = { 名称: string; 姓?: string; 名?: string; カナ姓?: string; カナ名?: string; 電話?: [string, string, string]; 郵便?: [string, string]; 都道府県?: string; 住所1?: string; 住所2?: string; 会社名?: string };
/** 日本の住所を入れる（入れない欄は正本の「有効な値」: 晴 花子・03-1111-2222・100-0001・東京都・千代田区千代田・1-1） */
async function 日本の住所を入れる(ed: ShippingEditPage, v: 入力): Promise<void> {
  await ed.配送先名称.fill(v.名称);
  await ed.姓.fill(v.姓 ?? "晴");
  await ed.名.fill(v.名 ?? "花子");
  if (v.カナ姓 !== undefined) await ed.カナ姓.fill(v.カナ姓);
  if (v.カナ名 !== undefined) await ed.カナ名.fill(v.カナ名);
  const tel = v.電話 ?? ["03", "1111", "2222"];
  await ed.電話1.fill(tel[0]); await ed.電話2.fill(tel[1]); await ed.電話3.fill(tel[2]);
  const zip = v.郵便 ?? ["100", "0001"];
  await ed.郵便番号1.fill(zip[0]); await ed.郵便番号2.fill(zip[1]);
  // 郵便番号から都道府県・住所1が自動で入ることがあるので、郵便番号のあとに入れ直す
  await ed.page.waitForTimeout(500);
  await ed.都道府県.selectOption({ label: v.都道府県 ?? "東京都" });
  await ed.住所1.fill(v.住所1 ?? "千代田区千代田");
  await ed.住所2.fill(v.住所2 ?? "1-1");
  if (v.会社名 !== undefined) await ed.会社名.fill(v.会社名);
}
/** 国が United States のときの住所を入れる */
async function 海外の住所を入れる(ed: ShippingEditPage, v: { 名称: string; 住所3?: string }): Promise<void> {
  await ed.配送先名称.fill(v.名称);
  await ed.姓.fill("晴"); await ed.名.fill("花子");
  await ed.電話1.fill("03"); await ed.電話2.fill("1111"); await ed.電話3.fill("2222");
  await ed.住所1.fill("1 Main St");
  await ed.住所2.fill("New York");
  if (v.住所3 !== undefined) await ed.住所3.fill(v.住所3);
  await ed.海外郵便番号.fill("10001");
}

/** 確認画面の欄（項目の区切りのクラス）の表示 */
async function 確認の値(page: Page, 欄: string): Promise<string> {
  const dd = page.locator(`.p-hareruya-entry__${欄} dd`).first();
  if ((await dd.count()) === 0) return "";
  return ((await dd.innerText()) ?? "").replace(/\s+/g, " ").trim();
}
async function 確認画面で戻る(page: Page): Promise<void> {
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), page.locator('button[name="mode"][value="back"]').first().click({ timeout: 30_000 })]);
  await page.waitForLoadState("load");
}

/** 都道府県の送信値を書き換える（欄が無ければ同じ名前の隠し欄を足す）。開発者ツールでの書き換えの代わり */
async function 都道府県の送信値を書き換える(ed: ShippingEditPage, 値: string): Promise<string> {
  const name = (await ed.住所1.getAttribute("name"))?.replace(/\[addr01\]$/, "[pref]") ?? "";
  return ed.page.evaluate(({ name, 値 }) => {
    const form = document.querySelector("form.h-adr") as HTMLFormElement;
    const sel = form.querySelector(`[name="${name}"]`) as HTMLSelectElement | HTMLInputElement | null;
    if (sel && sel instanceof HTMLSelectElement) {
      if (!Array.from(sel.options).some((o) => o.value === 値)) { const o = document.createElement("option"); o.value = 値; o.textContent = 値; sel.appendChild(o); }
      sel.value = 値;
      return `都道府県の選択欄の値を ${値} にした`;
    }
    if (sel) { sel.value = 値; return `都道府県の欄の値を ${値} にした`; }
    const h = document.createElement("input"); h.type = "hidden"; h.name = name; h.value = 値; form.appendChild(h);
    return `都道府県の欄が画面に無いので、同じ名前の隠し欄を足して値を ${値} にした`;
  }, { name, 値 });
}

// ---- 新規登録画面の表示 ----

caseTest("IT-F04-03-002", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-002");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.押して配送先画面へ(await 新規のボタン(page)); });
  await expected(async () => {
    expect(await ed.値(ed.国), "配送先の新規登録・変更画面の国の初期値").toBe("Japan");
  });
});

caseTest("IT-F04-03-003", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-003");
  let ed = new ShippingEditPage(page);
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "United States"); });
  await expected(async () => {
    expect.soft(await ed.表示されている(ed.都道府県), "都道府県の欄が表示されている").toBe(false);
    expect.soft(await ed.表示されている(ed.郵便番号1), "日本国内用の郵便番号（1）の欄が表示されている").toBe(false);
    expect.soft(await ed.表示されている(ed.郵便番号2), "日本国内用の郵便番号（2）の欄が表示されている").toBe(false);
    expect.soft(await ed.表示されている(ed.住所3), "住所3の欄が表示されている").toBe(true);
  });
});

caseTest("IT-F04-03-004", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-004");
  let ed = new ShippingEditPage(page);
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "United States"); });
  await step(3, async () => { await 国を選ぶ(ed, "Japan"); });
  await expected(async () => {
    expect.soft(await ed.表示されている(ed.住所3), "住所3の欄が表示されている").toBe(false);
    expect.soft(await ed.表示されている(ed.郵便番号1), "郵便番号1の欄が表示されている").toBe(true);
    expect.soft(await ed.表示されている(ed.郵便番号2), "郵便番号2の欄が表示されている").toBe(true);
    expect.soft(await ed.表示されている(ed.都道府県), "都道府県の欄が表示されている").toBe(true);
  });
});

caseTest("IT-F04-03-005", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-005");
  let ed = new ShippingEditPage(page);
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "Japan"); });
  await step(3, async () => {
    // 自動入力は入力の操作（キー入力）で動くので、1文字ずつ打つ
    await ed.郵便番号1.pressSequentially("100", { delay: 50 });
    await ed.郵便番号2.pressSequentially("0001", { delay: 50 });
    await ed.郵便番号2.blur();
  });
  await expected(async () => {
    await expect.poll(async () => ed.値(ed.都道府県), { message: "自動入力された都道府県", timeout: 15_000 }).toBe("東京都");
    await expect.poll(async () => ed.値(ed.住所1), { message: "自動入力された住所1", timeout: 15_000 }).toBe("千代田区千代田");
  });
});

caseTest("IT-F04-03-006", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-006");
  let ed = new ShippingEditPage(page);
  let opened = "";
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "Japan"); });
  await step(3, async () => {
    const links = page.locator("a[href*='post.japanpost.jp']");
    if ((await links.count()) === 0) {
      const all = await page.locator("form.h-adr a[href]").evaluateAll((as) => as.map((a) => `${(a.textContent ?? "").trim()}（${(a as HTMLAnchorElement).href}）`));
      throw new Error(`郵便番号の欄の脇に、日本郵便の郵便番号検索ページへの外部リンクが無い（入力欄のリンク: ${all.join("、") || "なし"}）`);
    }
    const link = links.first();
    const [popup] = await Promise.all([page.context().waitForEvent("page", { timeout: 30_000 }).catch(() => null), link.click({ timeout: 30_000 })]);
    if (popup) { await popup.waitForLoadState("domcontentloaded").catch(() => undefined); opened = popup.url(); }
    else opened = page.url();
  });
  await expected(async () => {
    expect(opened, "開いたページ").toMatch(/^https?:\/\/www\.post\.japanpost\.jp\/zipcode\//);
  });
});

caseTest("IT-F04-03-007", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-007");
  const ed = new ShippingEditPage(page);
  await step(1, async () => { await 英語の買い物かごから開く(page); });
  await step(2, async () => { await new ShoppingPage(page).押して配送先画面へ(await 新規のボタン(page)); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "英語の配送先の新規登録・変更画面").toMatch(/^\/en\/shopping\/shipping_edit\//);
    expect.soft(await ed.表示されている(ed.カナ姓), "配送先氏名カナ（姓）の入力欄が表示されている").toBe(false);
    expect.soft(await ed.表示されている(ed.カナ名), "配送先氏名カナ（名）の入力欄が表示されている").toBe(false);
  });
});

// ---- 登録上限 ----

caseTest("IT-F04-03-008", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-CAP20-008");
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => {
    const btn = await 新規のボタン(page);
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => undefined), btn.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
    await page.waitForURL(/\/shopping(\?.*)?$/, { timeout: 30_000 }).catch(() => undefined);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "配送先の新規登録・変更画面へ移っていない").not.toMatch(/\/shopping\/shipping_edit\//);
    await expect.soft(page.locator(".p-hareruya-message-box--error").filter({ hasText: /\S/ }).first(), "ご注文方法指定画面のエラー領域").toBeVisible();
  });
});

caseTest("IT-F04-03-009", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-CAP20-009");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("上限確認住所01-009"); });
  await step(3, async () => { await sp.押して配送先画面へ(await 変更のボタン(page)); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "配送先の新規登録・変更画面").toMatch(/\/shopping\/shipping_edit\//);
    expect.soft(await ed.値(ed.配送先名称), "選択した配送先の配送先名称").toBe("上限確認住所01-009");
  });
});

// ---- 入力・確認・登録 ----

caseTest("IT-F04-03-021", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-021");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  const 入れた: 入力 = { 名称: "確認経由住所", 姓: "晴", 名: "花子", 電話: ["03", "1111", "2222"], 郵便: ["100", "0001"], 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "2-2" };
  await sp.買い物かごから開く();
  note("事前準備のご注文方法指定画面はシードが開いて閉じたので、ケースの開始時に買い物かごから開き直した（手順1の前の準備）");
  await step(1, async () => { await sp.押して配送先画面へ(await 新規のボタン(page)); });
  await step(2, async () => { await 国を選ぶ(ed, "Japan"); await 日本の住所を入れる(ed, 入れた); await ed.確認画面へ(); });
  await step(3, async () => { await 確認画面で戻る(page); });
  const 値 = { 名称: "", 姓: "", 名: "", 電話: ["", "", ""], 国: "", 郵便: ["", ""], 都道府県: "", 住所1: "", 住所2: "" };
  await step(4, async () => {
    Object.assign(値, {
      名称: await ed.値(ed.配送先名称), 姓: await ed.値(ed.姓), 名: await ed.値(ed.名),
      電話: [await ed.値(ed.電話1), await ed.値(ed.電話2), await ed.値(ed.電話3)], 国: await ed.値(ed.国),
      郵便: [await ed.値(ed.郵便番号1), await ed.値(ed.郵便番号2)], 都道府県: await ed.値(ed.都道府県), 住所1: await ed.値(ed.住所1), 住所2: await ed.値(ed.住所2),
    });
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "再表示された配送先の新規登録・変更画面").toMatch(/\/shopping\/shipping_edit\//);
    expect.soft(値.名称, "配送先名称").toBe("確認経由住所");
    expect.soft([値.姓, 値.名], "配送先氏名").toEqual(["晴", "花子"]);
    expect.soft(値.電話, "電話番号").toEqual(["03", "1111", "2222"]);
    expect.soft(値.国, "国").toBe("Japan");
    expect.soft(値.郵便, "郵便番号").toEqual(["100", "0001"]);
    expect.soft(値.都道府県, "都道府県").toBe("東京都");
    expect.soft([値.住所1, 値.住所2], "住所1・住所2").toEqual(["千代田区千代田", "2-2"]);
  });
});

/** 新規の入力を開き、入れて確認画面へ進み、確認画面で登録する（022・023・025・033） */
async function 入れて登録する(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, v: 入力): Promise<ShippingEditPage> {
  let ed = new ShippingEditPage(page);
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "Japan"); await 日本の住所を入れる(ed, v); await ed.確認画面へ(); });
  await step(3, async () => { await ed.確認画面で登録する(); });
  return ed;
}

caseTest("IT-F04-03-022", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-NEW-022");
  const 会員ID = notes.get("〔会員ID-F0403-022〕");
  const 名称 = "A".repeat(128);
  await 入れて登録する(page, step, { 名称, 姓: "姓".repeat(16), 名: "名".repeat(16), 電話: ["12345", "12345", "12345"], 郵便: ["100", "0001"], 住所1: "千代田区千代田", 住所2: "1-1" });
  let 件数 = -1; let row: Record<string, string> | null = null;
  await step(4, async () => { 件数 = アドレス帳の件数(会員ID); row = アドレス帳の値(会員ID, 名称); });
  await expected(async () => {
    expect.soft(件数, "アドレス帳の件数").toBe(1);
    expect.soft(row?.配送先名称, "配送先名称（128文字）").toBe(名称);
    expect.soft([row?.姓, row?.名], "配送先氏名の姓・名（各16文字）").toEqual(["姓".repeat(16), "名".repeat(16)]);
    expect.soft([row?.電話1, row?.電話2, row?.電話3], "電話番号1〜3（各5桁）").toEqual(["12345", "12345", "12345"]);
    expect.soft(row?.郵便番号.slice(0, 3), "郵便番号1（3桁）").toBe("100");
  });
});

caseTest("IT-F04-03-023", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-NEW-023");
  const 会員ID = notes.get("〔会員ID-F0403-023〕");
  await 入れて登録する(page, step, { 名称: "F0403-023-住所", 住所1: "a".repeat(90), 住所2: "あ".repeat(45) });
  let 件数 = -1; let row: Record<string, string> | null = null;
  await step(4, async () => { 件数 = アドレス帳の件数(会員ID); row = アドレス帳の値(会員ID, "F0403-023-住所"); });
  await expected(async () => {
    expect.soft(件数, "アドレス帳の件数").toBe(1);
    expect.soft(row?.住所1, "住所1（半角90文字）").toBe("a".repeat(90));
    expect.soft(row?.住所2, "住所2（全角45文字）").toBe("あ".repeat(45));
  });
});

caseTest("IT-F04-03-025", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-NEW-025");
  const 会員ID = notes.get("〔会員ID-F0403-025〕");
  note("配送先名称は正本が示さないので「F0403-025-住所」（ほかの必須項目の有効な値）");
  await 入れて登録する(page, step, { 名称: "F0403-025-住所", カナ姓: "はれ", カナ名: "タロウ" });
  let 件数 = -1; let row: Record<string, string> | null = null;
  await step(4, async () => { 件数 = アドレス帳の件数(会員ID); row = アドレス帳の値(会員ID, "F0403-025-住所"); });
  await expected(async () => {
    expect.soft(件数, "アドレス帳の件数").toBe(1);
    expect.soft([row?.カナ姓, row?.カナ名], "配送先氏名カナ（姓・名）").toEqual(["ハレ", "タロウ"]);
  });
});

caseTest("IT-F04-03-026", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-CAP19-026");
  const 会員ID = notes.get("〔会員ID-F0403-026〕");
  const s = 状態の("S-F04-03-CAP19-026");
  let ed = new ShippingEditPage(page);
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "Japan"); await 日本の住所を入れる(ed, { 名称: "上限再判定住所" }); await ed.確認画面へ(); });
  let 足した後 = -1;
  await step(3, async () => {
    expect(page.locator('button[name="mode"][value="back"]'), "配送先の新規登録_確認画面").toHaveCount(1);
    // アドレス帳に1件足す: シードで削除の印を付けておいたこの会員の既定のお届け先を、有効に戻す（E2E の会員の行だけ）
    既定のお届け先を有効に戻す("IT-F04-03-026 手順3", s.会員.メール);
    足した後 = アドレス帳の件数(会員ID);
    note(`アドレス帳に1件足す操作は、シードで削除の印を付けておいたこの会員の既定のお届け先を有効に戻して行った（足した後の件数 ${足した後}）`);
  });
  await step(4, async () => { await ed.確認画面で登録する(); });
  let 件数 = -1; let row: unknown = undefined;
  await step(5, async () => { 件数 = アドレス帳の件数(会員ID); row = 会員の配送先(会員ID, "上限再判定住所"); });
  await expected(async () => {
    expect.soft(row, "「上限再判定住所」の登録").toBeNull();
    expect.soft(件数, "アドレス帳の件数").toBe(20);
  });
});

caseTest("IT-F04-03-029", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-MULTI-029");
  const 会員ID = notes.get("〔会員ID-F0403-029〕");
  const 受注ID = () => 処理中受注ID一覧(会員ID).slice(-1)[0] ?? "";
  let 記録: ReturnType<typeof 受注の配送一覧> = [];
  let ed = new ShippingEditPage(page);
  await step(1, async () => { 記録 = 受注の配送一覧(受注ID()); expect(記録.length, "注文手続き中の配送の件数").toBe(2); });
  await step(2, async () => { ed = await 新規の入力を開く(page); });
  await step(3, async () => { await 国を選ぶ(ed, "Japan"); await 日本の住所を入れる(ed, { 名称: "複数配送確認住所", 住所1: "港区芝公園" }); await ed.確認画面へ(); });
  await step(4, async () => { await ed.確認画面で登録する(); });
  let 後: ReturnType<typeof 受注の配送一覧> = [];
  await step(5, async () => { 後 = 受注の配送一覧(受注ID()); });
  await expected(async () => {
    const 一件目 = 後.find((x) => x.配送ID === notes.get("〔配送ID-F0403-029〕"));
    expect.soft(一件目?.住所1, "1件目の配送先の住所1").toBe("港区芝公園");
    const 二件目の記録 = 記録.find((x) => x.配送ID !== notes.get("〔配送ID-F0403-029〕"));
    const 二件目 = 後.find((x) => x.配送ID === 二件目の記録?.配送ID);
    expect.soft(二件目, "2件目の配送先（手順1で記録した住所のまま）").toEqual(二件目の記録);
  });
});

caseTest("IT-F04-03-031", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-031");
  let ed = new ShippingEditPage(page);
  let 住所欄 = "";
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "United States"); });
  await step(3, async () => { await 海外の住所を入れる(ed, { 名称: "F0403-031-住所", 住所3: "Apt 5" }); await ed.確認画面へ(); });
  await step(4, async () => { 住所欄 = await 確認の値(page, "address"); });
  await expected(async () => {
    expect.soft(住所欄, "確認画面の住所（住所1）").toContain("1 Main St");
    expect.soft(住所欄, "確認画面の住所（住所2）").toContain("New York");
    expect.soft(住所欄, "確認画面の住所（住所3）").toContain("Apt 5");
  });
});

caseTest("IT-F04-03-032", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-032");
  let ed = new ShippingEditPage(page);
  let n = -1;
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { expect(await ed.値(ed.国), "国").toBe("Japan"); });
  await step(3, async () => { n = await page.locator("form.h-adr").getByText("郵便番号から自動入力").count(); });
  await expected(async () => {
    expect(n, "「郵便番号から自動入力」ボタンの数").toBe(0);
  });
});

caseTest("IT-F04-03-033", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-033");
  await 入れて登録する(page, step, { 名称: "F0403-033-住所" });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "登録後の画面（ご注文方法指定画面）").toMatch(/\/shopping\/?$/);
  });
});

caseTest("IT-F04-03-035", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-NEW-035");
  const 会員ID = notes.get("〔会員ID-F0403-035〕");
  let ed = new ShippingEditPage(page);
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "United States"); });
  await step(3, async () => { await 海外の住所を入れる(ed, { 名称: "F0403-035-住所" }); await ed.確認画面へ(); });
  await step(4, async () => { await ed.確認画面で登録する(); });
  let 都道府県: string[] = [];
  await step(5, async () => { 都道府県 = アドレス帳の都道府県名(会員ID); });
  await expected(async () => {
    expect.soft(都道府県.length, "アドレス帳の件数").toBe(1);
    expect.soft(都道府県[0], "登録された1件の都道府県").toBe("日本国外");
  });
});

/** 036〜039: 送信値を書き換えて登録するボタンを押す */
async function 組み合わせの誤り(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, a: { 番号: string; 国: "Japan" | "United States" }): Promise<ShippingEditPage> {
  let ed = new ShippingEditPage(page);
  const 番号 = 都道府県の番号();
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, a.国); });
  await step(3, async () => {
    if (a.国 === "Japan") await 日本の住所を入れる(ed, { 名称: `F0403-${a.番号}-住所` });
    else await 海外の住所を入れる(ed, { 名称: `F0403-${a.番号}-住所` });
  });
  await step(4, async () => {
    const what = await 都道府県の送信値を書き換える(ed, a.国 === "Japan" ? 番号.国外 : 番号.東京都);
    note(`開発者ツールの代わりに、画面の要素をスクリプトで書き換えた（${what}）`);
  });
  await step(5, async () => { await ed.確認画面へ(); });
  return ed;
}
async function 国の欄の文(page: Page): Promise<string> {
  return ((await page.locator(".p-hareruya-entry__country").first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
}

caseTest("IT-F04-03-036", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-036");
  await 組み合わせの誤り(page, step, { 番号: "036", 国: "Japan" });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "再表示された配送先の新規登録・変更画面").toMatch(/\/shopping\/shipping_edit\//);
    expect.soft(await 国の欄の文(page), "国の項目の下のエラー文言").toMatch(/国と都道府県の組み合わせが/);
  });
});

caseTest("IT-F04-03-037", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-037");
  await 組み合わせの誤り(page, step, { 番号: "037", 国: "United States" });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "再表示された配送先の新規登録・変更画面").toMatch(/\/shopping\/shipping_edit\//);
    expect.soft(await 国の欄の文(page), "国の項目の下のエラー文言").toMatch(/国と都道府県の組み合わせが/);
  });
});

caseTest("IT-F04-03-038", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-NEW-038");
  await 組み合わせの誤り(page, step, { 番号: "038", 国: "Japan" });
  let 件数 = -1;
  await step(6, async () => { 件数 = アドレス帳の件数(notes.get("〔会員ID-F0403-038〕")); });
  await expected(async () => { expect(件数, "試験会員のアドレス帳の件数").toBe(0); });
});

caseTest("IT-F04-03-039", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-NEW-039");
  await 組み合わせの誤り(page, step, { 番号: "039", 国: "United States" });
  let 件数 = -1;
  await step(6, async () => { 件数 = アドレス帳の件数(notes.get("〔会員ID-F0403-039〕")); });
  await expected(async () => { expect(件数, "試験会員のアドレス帳の件数").toBe(0); });
});

caseTest("IT-F04-03-045", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-NEW-045");
  let ed = new ShippingEditPage(page);
  let 件数 = -1;
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "Japan"); await 日本の住所を入れる(ed, { 名称: "F0403-045-住所" }); await ed.確認画面へ(); });
  await step(3, async () => {
    await expect(page.locator('button[name="mode"][value="back"]'), "配送先の新規登録_確認画面").toHaveCount(1);
    件数 = アドレス帳の件数(notes.get("〔会員ID-F0403-045〕"));
  });
  await expected(async () => { expect(件数, "試験会員のアドレス帳の件数").toBe(0); });
});

caseTest("IT-F04-03-047", async ({ page, step, expected }) => {
  await login(page, "S-F04-03-NEW-047");
  let ed = new ShippingEditPage(page);
  const 表示: Record<string, string> = {};
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => {
    await 国を選ぶ(ed, "Japan");
    await 日本の住所を入れる(ed, { 名称: "F0403-047-確認表示", カナ姓: "ハレ", カナ名: "ハナコ", 住所2: "2-2", 会社名: "F0403-047-商事" });
    await ed.確認画面へ();
  });
  await step(3, async () => {
    for (const k of ["delivery-name", "name", "name-kana", "tel", "country", "postcode", "address", "company-name"]) 表示[k] = await 確認の値(page, k);
  });
  await expected(async () => {
    expect.soft(表示["delivery-name"], "名称").toBe("F0403-047-確認表示");
    expect.soft(表示.name, "お名前").toBe("晴 花子");
    expect.soft(表示["name-kana"], "お名前（フリガナ）").toBe("ハレ ハナコ");
    expect.soft(表示.tel, "電話番号").toBe("03-1111-2222");
    expect.soft(表示.country, "国").toBe("Japan");
    expect.soft(表示.postcode, "郵便番号").toMatch(/100-0001$/);
    expect.soft(表示.address, "住所（都道府県・住所1・住所2）").toBe("東京都 千代田区千代田 2-2");
    expect.soft(表示["company-name"], "会社名").toBe("F0403-047-商事");
  });
});

// ---- 件数の境界・変更 ----

caseTest("IT-F04-03-053", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-DP-CAP19-053");
  const 会員ID = notes.get("〔会員ID-F0403-053〕");
  let ed = new ShippingEditPage(page);
  await step(1, async () => { ed = await 新規の入力を開く(page); });
  await step(2, async () => { await 国を選ぶ(ed, "Japan"); await 日本の住所を入れる(ed, { 名称: "件数境界新規-053" }); await ed.確認画面へ(); });
  await step(3, async () => { await ed.確認画面で登録する(); });
  let 件数 = -1; let row: unknown = null;
  await step(4, async () => { 件数 = アドレス帳の件数(会員ID); row = 会員の配送先(会員ID, "件数境界新規-053"); });
  await expected(async () => {
    expect.soft(row, "「件数境界新規-053」の登録").not.toBeNull();
    expect.soft(件数, "アドレス帳の件数").toBe(20);
  });
});

caseTest("IT-F04-03-054", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-DP-CAP20-054");
  const 会員ID = notes.get("〔会員ID-F0403-054〕");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("変更確定住所01-054"); });
  await step(3, async () => { await sp.押して配送先画面へ(await 変更のボタン(page)); });
  await step(4, async () => { await ed.住所2.fill("2-2"); await ed.確認画面へ(); });
  await step(5, async () => { await ed.確認画面で登録する(); });
  let 件数 = -1; let row: ReturnType<typeof アドレス帳の住所> = null;
  await step(6, async () => { 件数 = アドレス帳の件数(会員ID); row = アドレス帳の住所(会員ID, "変更確定住所01-054"); });
  await expected(async () => {
    expect.soft(件数, "アドレス帳の件数").toBe(20);
    expect.soft(row?.配送先ID, "更新された配送先の番号").toBe(notes.get("〔配送先ID-F0403-054〕"));
    expect.soft(row?.住所2, "配送先の住所2").toBe("2-2");
  });
});

/** 055・060・061: 配送1件目の配送先を変更する */
async function 一件目を変更する(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, 名称: string): Promise<void> {
  const sp = new ShoppingPage(page);
  let ed = new ShippingEditPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ(名称); });
  await step(3, async () => { ed = await (async () => { await sp.押して配送先画面へ(await 変更のボタン(page)); return new ShippingEditPage(page); })(); });
  await step(4, async () => { await ed.住所1.fill("港区芝公園"); await ed.確認画面へ(); });
  await step(5, async () => { await ed.確認画面で登録する(); });
}

caseTest("IT-F04-03-055", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-DP-MULTI-055");
  const 会員ID = notes.get("〔会員ID-F0403-055〕");
  await 一件目を変更する(page, step, "複数変更住所F0403-A-055");
  let 配送: ReturnType<typeof 受注の配送一覧> = [];
  await step(6, async () => { 配送 = 受注の配送一覧(処理中受注ID一覧(会員ID).slice(-1)[0] ?? "0"); });
  await expected(async () => {
    const 一件目 = 配送.find((x) => x.配送ID === notes.get("〔配送ID-F0403-055〕"));
    const 二件目 = 配送.find((x) => x.配送ID !== notes.get("〔配送ID-F0403-055〕"));
    expect.soft([一件目?.住所1, 一件目?.住所2], "1件目の配送先（住所1・住所2）").toEqual(["港区芝公園", "1-1"]);
    expect.soft([二件目?.住所1, 二件目?.住所2], "2件目の配送先（住所1・住所2）").toEqual(["台東区上野", "2-2"]);
  });
});

caseTest("IT-F04-03-059", async ({ page, browser, notes, step, expected }) => {
  const s = 状態の("S-F04-03-CBORDCAP-059");
  await login(page, "S-F04-03-CBORDCAP-059");
  const 会員ID = notes.get("〔会員ID-F0403-059〕");
  const sp = new ShoppingPage(page);
  const ed = new ShippingEditPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("住所CBF0403-059-01"); await sp.押して配送先画面へ(await 変更のボタン(page)); });
  await step(3, async () => { await ed.住所2.fill("2-2"); await ed.確認画面へ(); });
  await step(4, async () => { await ed.確認画面で登録する(); });
  const 管理: { 住所1: string; 住所2: string; 件数: number } = { 住所1: "", 住所2: "", 件数: -1 };
  const 本店 = await 本店の店名(browser);
  await step(5, async () => {
    note("ブラウザBは、別のブラウザの文脈で開いた（実行の印つきの試験管理者でログイン）。手順5〜8の画面はブラウザBのもの");
  });
  await withAdminSession(browser, F0403PA_ADMIN, async (b) => {
    b.setDefaultTimeout(60_000);
    await step(6, async () => {
      await b.goto(adminUrl("/order"));
      await b.waitForLoadState("load");
      const form = b.locator("form#search_form");
      const tenants = form.locator("#admin_search_order_tenants");
      if ((await tenants.count()) > 0) {
        await tenants.evaluate((node, shop) => {
          const sel = node as HTMLSelectElement;
          for (const o of Array.from(sel.options)) o.selected = (o.textContent ?? "").trim() === shop;
          const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
          if (w.jQuery) w.jQuery(sel).trigger("change"); else sel.dispatchEvent(new Event("change", { bubbles: true }));
        }, 本店);
      }
      const name = form.locator("#admin_search_order_name");
      if (!(await name.isVisible())) await b.locator('button[data-bs-target="#searchDetail"]').first().click().catch(() => undefined);
      await name.fill(s.会員.姓);
      await Promise.all([b.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator("#search_submit").click()]);
      await b.waitForLoadState("load");
      管理.件数 = await b.locator('a.action-edit[href*="/order/"]').count();
    });
    await step(7, async () => {
      const link = b.locator('a.action-edit[href*="/order/"]').first();
      await Promise.all([b.waitForURL(/\/order\/\d+\/edit/), link.click()]);
      await b.waitForLoadState("load");
    });
    await step(8, async () => {
      const oe = new OrderEditPage(b);
      await oe.お届け先情報を開く();
      管理.住所1 = await b.locator("#order_Shipping_address_addr01").inputValue();
      管理.住所2 = await b.locator("#order_Shipping_address_addr02").inputValue();
    });
  });
  let 住所: ReturnType<typeof アドレス帳の住所> = null; let 処理中: ReturnType<typeof 配送の住所> = null;
  await step(9, async () => {
    住所 = アドレス帳の住所(会員ID, "住所CBF0403-059-01");
    const 受注 = 処理中受注ID一覧(会員ID).slice(-1)[0] ?? "0";
    処理中 = 受注の配送一覧(受注)[0] ?? null;
  });
  await expected(async () => {
    expect.soft(管理.件数, "受注情報検索の検索結果の件数").toBe(1);
    expect.soft([管理.住所1, 管理.住所2], "受注情報編集画面のお届け先情報（住所1・住所2）").toEqual(["渋谷区神宮前", "1-1"]);
    expect.soft(住所?.住所2, "アドレス帳「住所CBF0403-059-01」の住所2").toBe("2-2");
    expect.soft([処理中?.住所1, 処理中?.住所2], "注文手続き中の1件目の配送先（住所1・住所2）").toEqual(["渋谷区神宮前", "2-2"]);
  });
});

caseTest("IT-F04-03-060", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-CBMULTICAP-060");
  const 会員ID = notes.get("〔会員ID-F0403-060〕");
  await 一件目を変更する(page, step, "住所CBF0403-060-01");
  let 住所: ReturnType<typeof アドレス帳の住所> = null; let 一件目: ReturnType<typeof 配送の住所> = null; let 二件目: ReturnType<typeof 配送の住所> = null;
  await step(6, async () => {
    住所 = アドレス帳の住所(会員ID, "住所CBF0403-060-01");
    一件目 = 配送の住所(notes.get("〔配送ID-F0403-060〕"));
    二件目 = 配送の住所(notes.get("〔配送ID-F0403-060B〕"));
  });
  await expected(async () => {
    expect.soft([住所?.住所1, 住所?.住所2], "アドレス帳「住所CBF0403-060-01」（住所1・住所2）").toEqual(["港区芝公園", "1-1"]);
    expect.soft([一件目?.住所1, 一件目?.住所2], "注文手続き中の1件目の配送先（住所1・住所2）").toEqual(["港区芝公園", "1-1"]);
    expect.soft([二件目?.住所1, 二件目?.住所2], "注文手続き中の2件目の配送先（住所1・住所2）").toEqual(["台東区上野", "2-2"]);
  });
});

caseTest("IT-F04-03-061", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-03-CBORDMULTICAP-061");
  const 会員ID = notes.get("〔会員ID-F0403-061〕");
  await 一件目を変更する(page, step, "住所CBF0403-061-01");
  let 住所: ReturnType<typeof アドレス帳の住所> = null; let 一件目: ReturnType<typeof 配送の住所> = null; let 二件目: ReturnType<typeof 配送の住所> = null; let 完了: ReturnType<typeof 配送の住所> = null;
  await step(6, async () => {
    住所 = アドレス帳の住所(会員ID, "住所CBF0403-061-01");
    一件目 = 配送の住所(notes.get("〔配送ID-F0403-061〕"));
    二件目 = 配送の住所(notes.get("〔配送ID-F0403-061B〕"));
    完了 = 配送の住所(notes.get("〔受注の配送ID-F0403-061〕"));
  });
  await expected(async () => {
    expect.soft([住所?.住所1, 住所?.住所2], "アドレス帳「住所CBF0403-061-01」（住所1・住所2）").toEqual(["港区芝公園", "1-1"]);
    expect.soft([一件目?.住所1, 一件目?.住所2], "注文手続き中の1件目の配送先（住所1・住所2）").toEqual(["港区芝公園", "1-1"]);
    expect.soft([二件目?.住所1, 二件目?.住所2], "注文手続き中の2件目の配送先（住所1・住所2）").toEqual(["台東区上野", "2-2"]);
    expect.soft([完了?.住所1, 完了?.住所2], "購入完了済みの受注のお届け先（住所1・住所2）").toEqual(["新宿区西新宿", "1-1"]);
  });
});
