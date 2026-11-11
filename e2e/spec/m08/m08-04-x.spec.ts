/**
 * M08-04 会員登録/編集の続き（-x）。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもの。
 * 正本: cases/M08-04_test_cases.tsv。シード: seeds/m08-04-x.ts（試験管理者は seeds/m08-04.ts の S-M08-04-ADM）。
 * 本人確認ステータス変更の確認は、ブラウザの確認ダイアログ。「続行」は OK、「取り消し」はキャンセルで答える（spec/m08/m08-04.spec.ts と同じ）。
 * 国・都道府県・性別・職業・顧客グループの試験用の値（S-M08-04-MASTERS）は足さず、開発環境に既にある値で読み替える（読み替えのマスタ）。
 */
import { Locator, Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { 会員の保存内容 } from "../../db/m08_04";
import { 会員のお届け先 } from "../../db/m08_04_x";
import { M08CustomerEditPage } from "../../pages/admin/m08_customer_edit";
import { M0804_ADMIN } from "../../seeds/m08-04";
import { 受注の } from "../../seeds/m08-04-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** 試験用のマスタの値の読み替え（開発環境に既にある値） */
const 読み替えのマスタ = { 国: "United States", 都道府県: "大阪府", 性別: "女性", 職業: "その他" } as const;

async function 開く(page: Page, id: string): Promise<M08CustomerEditPage> {
  await loginAdmin(page, M0804_ADMIN);
  const e = new M08CustomerEditPage(page);
  const st = await e.open(id);
  if (st !== 200) throw new Error(`会員ID ${id} の会員登録/編集画面を開けない（応答 ${st}）`);
  return e;
}
const 保存内容 = (id: string) => {
  const r = 会員の保存内容(id);
  if (!r) throw new Error(`会員ID ${id} の保存内容をDBの参照で読めない`);
  return r;
};
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** 会員登録/編集画面の、見出し（左の欄）が名前の行の値（右の欄）の文 */
async function 行の値(page: Page, 見出し: string): Promise<string> {
  const row = page.locator("div.row").filter({ has: page.locator("div.col-3 > span", { hasText: new RegExp(`^\\s*${見出し}\\s*$`) }) }).last();
  await expect(row, `「${見出し}」の行`).toHaveCount(1);
  return norm(await row.locator("div.col").first().innerText());
}

// ---- 累計・スマレジID ----

caseTest("IT-M08-04-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-002〕");
  let 回数 = ""; let 金額 = "";
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 回数 = await 行の値(page, "累計注文回数"); 金額 = await 行の値(page, "累計注文金額"); });
  await expected(async () => {
    expect.soft(回数, "累計注文回数").toBe("12回");
    expect.soft(金額.replace(/[,\s円￥¥]/g, ""), `累計注文金額（表示「${金額}」）`).toBe("345600");
  });
});

caseTest("IT-M08-04-070", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-070〕");
  let e!: M08CustomerEditPage; let 表示 = ""; let 入力欄 = 0; let 入力欄の値 = "";
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    表示 = await 行の値(page, "スマレジID");
    const box = e.f("Player][smaregiId");
    入力欄 = await box.evaluateAll((ns) => ns.filter((n) => {
      const el = n as HTMLInputElement;
      return el.type !== "hidden" && !el.readOnly && !el.disabled && (el.offsetWidth > 0 || el.offsetHeight > 0);
    }).length);
    入力欄の値 = (await box.count()) > 0 ? await box.first().inputValue() : "";
  });
  await expected(async () => {
    expect.soft(`${表示} ${入力欄の値}`.includes("7080070"), `スマレジID「7080070」が表示される（行の文「${表示}」・入力欄の値「${入力欄の値}」）`).toBe(true);
    expect.soft(表示, "スマレジIDが文として表示される").toContain("7080070");
    expect.soft(入力欄, "スマレジIDの編集用の入力欄（表示され、書き込めるもの）の数").toBe(0);
  });
});

// ---- マスタの値の保存（読み替え） ----

/** 選択欄で、いまと違う選択肢（空の選択肢を除く）の先頭を選び、選んだ表示を返す */
async function 違う選択肢を選ぶ(sel: Locator): Promise<string> {
  const opts = await sel.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim(), s: (o as HTMLOptionElement).selected })));
  const pick = opts.find((o) => o.v !== "" && !o.s);
  if (!pick) throw new Error(`いまと違う選択肢が無い（${opts.map((o) => o.t).join("、")}）`);
  await sel.selectOption({ value: pick.v });
  return pick.t;
}

caseTest("IT-M08-04-008", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-008〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>; let 顧客グループ = "";
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    await e.選ぶ("country", 読み替えのマスタ.国);
    await e.選ぶ("address][pref", 読み替えのマスタ.都道府県);
    await e.ラジオを選ぶ("sex", 読み替えのマスタ.性別);
    await e.選ぶ("job", 読み替えのマスタ.職業);
    顧客グループ = await 違う選択肢を選ぶ(e.f("Player][CustomerGroup"));
    supplement(`試験用のマスタの値は既存の値で読み替えた: 国「${読み替えのマスタ.国}」・都道府県「${読み替えのマスタ.都道府県}」・性別「${読み替えのマスタ.性別}」・職業「${読み替えのマスタ.職業}」・顧客グループ「${顧客グループ}」`);
  });
  await step(3, async () => { const p = await e.登録する(); if (p.ダイアログ) note(`確認ダイアログが出た: ${p.ダイアログ}`); });
  await step(4, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(r.国, "国").toBe(読み替えのマスタ.国);
    expect.soft(r.都道府県, "都道府県").toBe(読み替えのマスタ.都道府県);
    expect.soft(r.性別, "性別").toBe(読み替えのマスタ.性別);
    expect.soft(r.職業 ?? "", "職業").toMatch(new RegExp(`^${読み替えのマスタ.職業}`));
    expect.soft(r.顧客グループ, "顧客グループ").toBe(顧客グループ);
  });
});

caseTest("IT-M08-04-027", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-027〕");
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  let p!: Awaited<ReturnType<M08CustomerEditPage["登録を押す"]>>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    await e.選ぶ("country", 読み替えのマスタ.国);
    await e.set("postalCode][postalCode01", "101"); await e.set("postalCode][postalCode02", "0001");
    await e.set("abroadPostalCode", "123456");
    await e.選ぶ("address][pref", 読み替えのマスタ.都道府県);
    await e.set("address][addr01", "変更住所1"); await e.set("address][addr02", "変更住所2");
    supplement(`国「試験国A」・都道府県「試験都道府県A」は既存の「${読み替えのマスタ.国}」「${読み替えのマスタ.都道府県}」で読み替えた`);
  });
  await step(3, async () => { p = await e.登録を押す(); });
  await step(4, async () => { note(`本人確認ステータス変更の確認ダイアログ: ${p.ダイアログの文 ?? "出なかった"}`); await p.答える("続行"); });
  await step(5, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(p.ダイアログの文 !== null, "本人確認ステータス変更の確認が表示された").toBe(true);
    expect.soft(r.本人確認ステータス, "本人確認ステータス").toBe("未確認");
  });
});

caseTest("IT-M08-04-029", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-029〕");
  const 前 = 保存内容(id);
  let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
  let p!: Awaited<ReturnType<M08CustomerEditPage["登録を押す"]>>;
  await step(1, async () => { e = await 開く(page, id); });
  await step(2, async () => {
    await e.選ぶ("country", 読み替えのマスタ.国);
    await e.set("address][addr01", "取消確認住所");
    supplement(`国「試験国A」は既存の「${読み替えのマスタ.国}」で読み替えた`);
  });
  await step(3, async () => { p = await e.登録を押す(); });
  await step(4, async () => { note(`本人確認ステータス変更の確認ダイアログ: ${p.ダイアログの文 ?? "出なかった"}`); await p.答える("取り消し"); });
  await step(5, async () => { r = 保存内容(id); });
  await expected(async () => {
    expect.soft(p.ダイアログの文 !== null, "本人確認ステータス変更の確認が表示された").toBe(true);
    expect.soft([r.国, r.住所1, r.本人確認ステータス], "国・住所1・本人確認ステータス（保存前の値のまま）").toEqual([前.国, 前.住所1, 前.本人確認ステータス]);
  });
});

/** 074〜079: 本人確認用の住所の項目を変えて続行すると、オンライン本人確認済みが未確認になる */
function 住所で降格(k: string, 変更: (e: M08CustomerEditPage) => Promise<void>, 補い?: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const id = notes.get(`〔会員ID-M0804-${k}〕`);
    const 前 = 保存内容(id).本人確認ステータス;
    let e!: M08CustomerEditPage; let r!: ReturnType<typeof 保存内容>;
    let p!: Awaited<ReturnType<M08CustomerEditPage["登録を押す"]>>;
    await step(1, async () => { e = await 開く(page, id); });
    await step(2, async () => { await 変更(e); if (補い) supplement(補い); });
    await step(3, async () => { p = await e.登録を押す(); });
    await step(4, async () => { note(`本人確認ステータス変更の確認ダイアログ: ${p.ダイアログの文 ?? "出なかった"}`); await p.答える("続行"); });
    await step(5, async () => { r = 保存内容(id); });
    await expected(async () => {
      expect.soft(前, "変更前の本人確認ステータス").toBe("オンライン本人確認済み");
      expect.soft(p.ダイアログの文 !== null, "本人確認ステータス変更の確認が表示された").toBe(true);
      expect.soft(r.本人確認ステータス, "本人確認ステータス").toBe("未確認");
    });
  };
}
caseTest("IT-M08-04-074", 住所で降格("074", (e) => e.選ぶ("country", 読み替えのマスタ.国), `国「試験国A」は既存の「${読み替えのマスタ.国}」で読み替えた`));
caseTest("IT-M08-04-075", 住所で降格("075", async (e) => { await e.set("postalCode][postalCode01", "101"); await e.set("postalCode][postalCode02", "0001"); }));
caseTest("IT-M08-04-076", 住所で降格("076", (e) => e.set("abroadPostalCode", "123456")));
caseTest("IT-M08-04-077", 住所で降格("077", (e) => e.選ぶ("address][pref", 読み替えのマスタ.都道府県), `都道府県「試験都道府県A」は既存の「${読み替えのマスタ.都道府県}」で読み替えた`));
caseTest("IT-M08-04-078", 住所で降格("078", (e) => e.set("address][addr01", "変更住所1")));
caseTest("IT-M08-04-079", 住所で降格("079", (e) => e.set("address][addr02", "変更住所2")));

// ---- お届け先住所欄 ----

/** お届け先住所欄の、お名前の列が「配送 太郎」などの行 */
function お届け先の行(page: Page, 名前: string): Locator {
  return page.locator("#delivery table tbody tr").filter({ has: page.locator("td", { hasText: new RegExp(`^\\s*${名前.replace(" ", "\\s+")}\\s*$`) }) });
}
async function 行の文(row: Locator): Promise<string[]> {
  return (await row.locator("td").allInnerTexts()).map(norm);
}

caseTest("IT-M08-04-033", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-033〕");
  let 行数 = -1; let 文: string[] = [];
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行数 = await page.locator("#delivery table tbody tr").count(); 文 = await 行の文(お届け先の行(page, "配送 太郎")); });
  await expected(async () => {
    expect.soft(行数, "お届け先住所欄の行数").toBe(1);
    expect.soft(文.join(" | "), "お届け先住所欄のお名前").toMatch(/配送\s+太郎/);
    expect.soft(文.join(" | "), "お届け先住所欄の住所").toContain("東京都千代田区1-1");
    expect.soft(文.join(" | "), "お届け先住所欄の電話番号").toContain("03-1111-2222");
  });
});

caseTest("IT-M08-04-034", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-034〕");
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => {
    const link = お届け先の行(page, "配送 太郎").locator('a[href*="/delivery/"]').first();
    await Promise.all([page.waitForURL(/\/delivery\/\d+\/edit/, { timeout: 60_000 }), link.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "「配送 太郎」のお届け先登録画面").toBe(new URL(adminUrl(`/customer/${id}/delivery/${notes.get("〔お届け先ID-M0804-034〕")}/edit`)).pathname);
  });
});

caseTest("IT-M08-04-035", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-035〕");
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => {
    const add = page.locator(`a[href$="/customer/${id}/delivery/new"]`).first();
    await Promise.all([page.waitForURL(/\/delivery\/new/, { timeout: 60_000 }), add.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect(new URL(page.url()).pathname, `会員ID ${id} のお届け先登録画面`).toBe(new URL(adminUrl(`/customer/${id}/delivery/new`)).pathname);
  });
});

/** お届け先住所欄の「配送 太郎」の削除ボタンを押し、モーダルの削除ボタンを押す */
async function 太郎を削除する(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, お届け先ID: string): Promise<void> {
  const modal = page.locator(`#discontinuance-${お届け先ID}`);
  await step(2, async () => {
    await お届け先の行(page, "配送 太郎").locator(`[data-bs-target="#discontinuance-${お届け先ID}"]`).first().click({ timeout: 30_000 });
    await expect(modal, "削除の確認モーダル").toBeVisible();
  });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), modal.locator("a.btn-ec-delete").click({ timeout: 30_000 })]);
  });
}

caseTest("IT-M08-04-036", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-036〕");
  let 残り: ReturnType<typeof 会員のお届け先> = [];
  await step(1, async () => { await 開く(page, id); });
  await 太郎を削除する(page, step, notes.get("〔お届け先ID-M0804-036〕"));
  await step(4, async () => { 残り = 会員のお届け先(id); });
  await expected(async () => {
    expect.soft(残り.filter((a) => a.お届け先ID === notes.get("〔お届け先ID-M0804-036〕")).length, "「配送 太郎」のお届け先住所（削除されていないもの）").toBe(0);
  });
});

caseTest("IT-M08-04-088", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-088〕");
  let 行数 = -1; let 太郎: string[] = []; let 花子: string[] = [];
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => {
    行数 = await page.locator("#delivery table tbody tr").count();
    太郎 = await 行の文(お届け先の行(page, "配送 太郎")); 花子 = await 行の文(お届け先の行(page, "配送 花子"));
  });
  await expected(async () => {
    expect.soft(行数, "お届け先住所欄の行数").toBe(2);
    expect.soft(太郎.join(" | "), "「配送 太郎」の住所").toContain("東京都千代田区1-1");
    expect.soft(太郎.join(" | "), "「配送 太郎」の電話番号").toContain("03-0884-1111");
    expect.soft(花子.join(" | "), "「配送 花子」の住所").toContain("東京都港区2-2");
    expect.soft(花子.join(" | "), "「配送 花子」の電話番号").toContain("03-0884-2222");
  });
});

caseTest("IT-M08-04-089", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-089〕");
  let 残り: ReturnType<typeof 会員のお届け先> = [];
  await step(1, async () => { await 開く(page, id); });
  await 太郎を削除する(page, step, notes.get("〔お届け先ID-M0804-089-A〕"));
  await step(4, async () => { 残り = 会員のお届け先(id); });
  await expected(async () => {
    expect.soft(残り.map((a) => `${a.姓} ${a.名}`), "会員のお届け先住所").toEqual(["配送 花子"]);
  });
});

// ---- 購入履歴 ----

type 履歴の行 = { 注文日時: string; 受注番号: string; 受注のリンク: string; 購入金額: string; 発送日: string; 支払方法: string };
async function 購入履歴(page: Page): Promise<履歴の行[]> {
  const rows = page.locator("#orderHistory table tbody tr");
  const out: 履歴の行[] = [];
  for (let i = 0; i < (await rows.count()); i++) {
    const td = rows.nth(i).locator("td");
    const href = (await td.nth(1).locator("a").getAttribute("href").catch(() => null)) ?? "";
    out.push({ 注文日時: norm(await td.nth(0).innerText()), 受注番号: norm(await td.nth(1).innerText()), 受注のリンク: href, 購入金額: norm(await td.nth(2).innerText()), 発送日: norm(await td.nth(3).innerText()), 支払方法: norm(await td.nth(4).innerText()) });
  }
  return out;
}
const 受注IDの = (href: string) => /\/order\/(\d+)\/edit/.exec(href)?.[1] ?? "";

caseTest("IT-M08-04-038", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-共有購入〕");
  const [受注] = 受注の("S-M08-04-PURCHASE-READ");
  let 行: 履歴の行[] = [];
  note(`正本の受注番号 920001 は、画面が振った受注番号「${受注.受注番号}」（受注ID ${受注.受注ID}）で読み替えた`);
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = (await 購入履歴(page)).filter((r) => 受注IDの(r.受注のリンク) === 受注.受注ID); });
  await expected(async () => {
    expect(行.length, "受注の行").toBe(1);
    expect.soft(行[0]?.注文日時, "注文日時").toMatch(/^2026\/0?8\/0?1 10:00/);
    expect.soft(行[0]?.購入金額.replace(/[,\s円￥¥]/g, ""), "購入金額").toBe("1200");
    expect.soft(行[0]?.発送日, "発送日").toMatch(/^2026\/0?8\/0?2/);
    expect.soft(行[0]?.支払方法, "支払方法").toBe("試験支払A");
  });
});

caseTest("IT-M08-04-043", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-共有購入〕");
  const [受注] = 受注の("S-M08-04-PURCHASE-READ");
  note(`正本の受注番号 920001 は、画面が振った受注番号「${受注.受注番号}」（受注ID ${受注.受注ID}）で読み替えた`);
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => {
    const link = page.locator(`#orderHistory a[href$="/order/${受注.受注ID}/edit"]`).first();
    await Promise.all([page.waitForURL(/\/order\/\d+\/edit/, { timeout: 60_000 }), link.click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "受注管理編集画面").toBe(new URL(adminUrl(`/order/${受注.受注ID}/edit`)).pathname);
  });
});

caseTest("IT-M08-04-042", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-042〕");
  const [受注] = 受注の("S-M08-04-PURCHASE-042");
  let 行: 履歴の行[] = [];
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = (await 購入履歴(page)).filter((r) => 受注IDの(r.受注のリンク) === 受注.受注ID); });
  await expected(async () => {
    expect(行.length, "受注番号と発送日を持たない受注の行").toBe(1);
    expect.soft(行[0]?.受注番号, "受注番号欄").toBe("-");
    expect.soft(行[0]?.発送日, "発送日欄").toBe("未発送");
  });
});

caseTest("IT-M08-04-039", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-039〕");
  const 受注 = 受注の("S-M08-04-PURCHASE-STATUS-039");
  let 行: 履歴の行[] = [];
  note(`正本の受注番号 930001（決済処理中）・930002（購入処理中）は、受注ID ${受注.map((x) => x.受注ID).join("・")} の受注で読み替えた`);
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = await 購入履歴(page); });
  await expected(async () => {
    expect.soft(行.filter((r) => 受注IDの(r.受注のリンク) === 受注[0].受注ID).length, "決済処理中の受注の行").toBe(0);
    expect.soft(行.filter((r) => 受注IDの(r.受注のリンク) === 受注[1].受注ID).length, "購入処理中の受注の行").toBe(0);
  });
});

caseTest("IT-M08-04-082", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔会員ID-M0804-082〕");
  const 受注 = 受注の("S-M08-04-MIXED-082");
  let 行: 履歴の行[] = [];
  note(`正本の受注番号 940821（入金済み）・940822（決済処理中）は、受注ID ${受注.map((x) => x.受注ID).join("・")} の受注で読み替えた`);
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { 行 = await 購入履歴(page); });
  await expected(async () => {
    expect.soft(行.map((r) => 受注IDの(r.受注のリンク)), "購入履歴の行（受注ID）").toEqual([受注[0].受注ID]);
  });
});
