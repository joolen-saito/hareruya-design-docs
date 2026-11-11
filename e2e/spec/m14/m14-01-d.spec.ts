/**
 * M14-01 カード検索（一覧・条件抽出）の続き（検索条件確認カード・削除試験カード・カード名リスト作成）。正本: cases/M14-01_test_cases.tsv
 *
 * 画面で作れない更新日時だけ、シードが DB で設定している（db/m14_01.ts）。
 * カード名リストのファイルは共有のデータなので、消さない・書き換えない（作成後の内容だけを確かめる）。
 * 実装しない: 036・038（12001件）、045（共有のマスターへ試験の値を足す）、064・101・103（作成前のファイルの内容を設定する）、065（特別サジェストの追加）。
 */
import { test, Page } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { BASE_URL } from "../../config/env";
import { カードの記録 as 記録, type カードの記録 } from "../../db/m14_01";
import { CardSearchPage, select2に入れる, 検索欄, 展開式を選ぶ } from "../../pages/admin/m14_card";
import { M1401_ADMIN } from "../../seeds/m14-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ID群 = (notes: { get(l: string): string }, prefix: string, 文字: string) => [...文字].map((c) => notes.get(`〔カードID-${prefix}${c}〕`));
const FILTER = "M1401-共有FILTER-";
const DELREAD = "M1401-共有DELREAD-";

// ---- 検索条件確認カード（FILTER） ----
caseTest("IT-M14-01-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const [A, B] = ID群(notes, FILTER, "AB");
  await l.open();
  await step(1, async () => { await l.キーワードで検索する(`${rc("M1401FILTER")} Alpha`); });
  await step(2, async () => { await l.並び順を選ぶ("カードID", "昇順"); });
  await expected(async () => {
    expect.soft(await l.表示中のカードID(), "表示されたカードID（昇順）").toEqual([A, B]);
    expect.soft(await l.キーワード.inputValue(), "復元された検索条件（カード名・テキスト）").toContain("Alpha");
  });
});

caseTest("IT-M14-01-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する("存在しないカード名XYZ"); });
  await expected(async () => {
    expect.soft(await l.検索結果の文(), "検索結果の見出し").toBe("検索条件に合致するデータが見つかりませんでした");
    expect.soft(await l.行.count(), "表示されたカードの行数").toBe(0);
  });
});

caseTest("IT-M14-01-031", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await l.open();
  await step(1, async () => { await l.キーワードで検索する(`${rc("M1401FILTER")} Alpha`); });
  await expected(async () => {
    expect.soft(await l.検索結果件数(), "検索結果件数").toBe(2);
  });
});

caseTest("IT-M14-01-032", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const ids = ID群(notes, FILTER, "ABCD");
  let 前: カードの記録[] = [], 後: カードの記録[] = [];
  await l.open();
  await step(1, async () => { 前 = 記録(ids); });
  await step(2, async () => {
    await l.キーワード.fill(rc("M1401FILTER"));
    await l.検索条件を展開する();
    await select2に入れる(page, 検索欄.カードタイプ, "クリーチャー", true);
    await 展開式を選ぶ(page, "color", "白");
    await 展開式を選ぶ(page, "foil", "なし");
    await l.検索する();
  });
  await step(3, async () => { 後 = 記録(ids); });
  await expected(async () => {
    expect.soft(前.length, "検索前に記録したカードの件数").toBe(4);
    expect.soft(後.length, "検索後のカードの件数").toBe(4);
    expect.soft(後, "検索の前後で値・件数・更新日時が変わっていない").toEqual(前);
  });
});

caseTest("IT-M14-01-055", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const [A] = ID群(notes, FILTER, "A");
  await l.open();
  await step(1, async () => {
    await l.キーワードで検索する(`${rc("M1401FILTER")} 蒼天`);
    expect(await l.表示中のカードID(), "検索で表示されたカードID").toEqual([A]);
  });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.行のカード(A).locator("td:nth-child(3) a").click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード詳細）").toMatch(new RegExp(`/card/${A}/edit$`));
    expect.soft(await page.locator("form#form1").count(), "カード詳細の入力フォーム").toBe(1);
  });
});

// ---- 削除試験カード（DELETE-READ） ----
async function 三件を検索する(page: Page): Promise<CardSearchPage> {
  const l = new CardSearchPage(page);
  await l.open();
  await l.キーワードで検索する(rc("M1401DELREAD"));
  return l;
}

caseTest("IT-M14-01-044", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const ids = ID群(notes, DELREAD, "ABC");
  let l!: CardSearchPage;
  await step(1, async () => { l = await 三件を検索する(page); });
  await step(2, async () => { await page.locator("#chose_all").check(); });
  await expected(async () => {
    expect.soft(await l.表示中のカードID(), "表示中のカードID").toEqual(expect.arrayContaining(ids));
    for (const id of ids) expect.soft(await l.行のカード(id).locator('input[name="cardIds[]"]').isChecked(), `カードID ${id} の選択`).toBe(true);
  });
});

/** 一括削除を押して出る確認（選択が無いときの案内・削除の確認）を受ける */
async function 一括削除を押す(page: Page) {
  const dialogP = page.waitForEvent("dialog", { timeout: 30_000 });
  const clickP = page.locator("#form_bulk button.action-submit").filter({ hasText: /^\s*一括削除\s*$/ }).click({ timeout: 30_000 });
  const dialog = await dialogP;
  return { 文: dialog.message(), 閉じる: async (受ける: boolean) => { await (受ける ? dialog.accept() : dialog.dismiss()); await clickP.catch(() => undefined); } };
}


caseTest("IT-M14-01-047", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const ids = ID群(notes, DELREAD, "ABC");
  let l!: CardSearchPage;
  let 前: カードの記録[] = [], 後: カードの記録[] = [];
  await step(1, async () => { l = await 三件を検索する(page); 前 = 記録(ids); });
  await step(2, async () => { const d = await 一括削除を押す(page); note(`選択が無いときの案内（${d.文}）が画面のダイアログで表示された`); await d.閉じる(true); });
  await step(3, async () => { 後 = 記録(ids); });
  await expected(async () => {
    expect.soft(前.length, "削除前のカードの件数").toBe(3);
    expect.soft(後, "削除前の状態から変更されていない（値・件数・更新日時）").toEqual(前);
  });
});

caseTest("IT-M14-01-048", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  let l!: CardSearchPage;
  await step(1, async () => { l = await 三件を検索する(page); });
  await step(2, async () => { const d = await 一括削除を押す(page); note(`選択が無いときの案内（${d.文}）が画面のダイアログで表示された`); await d.閉じる(true); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード検索）").toMatch(/\/card(\/search(\/\d+)?)?$/);
    expect.soft(await l.form.count(), "カード検索の検索欄").toBe(1);
  });
});

caseTest("IT-M14-01-051", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const [A, B] = ID群(notes, DELREAD, "AB");
  let l!: CardSearchPage;
  await step(1, async () => { l = await 三件を検索する(page); });
  await step(2, async () => { await l.カードを選択する([A, B]); });
  let d!: Awaited<ReturnType<typeof 一括削除を押す>>;
  await step(3, async () => { d = await 一括削除を押す(page); note("確認ポップアップは画面の確認ダイアログとして表示された"); });
  await step(4, async () => { await d.閉じる(false); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード検索）").toMatch(/\/card(\/search(\/\d+)?)?$/);
    expect.soft(await l.form.count(), "カード検索の検索欄").toBe(1);
  });
});

caseTest("IT-M14-01-052", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const [A] = ID群(notes, DELREAD, "A");
  let l!: CardSearchPage;
  await step(1, async () => { l = await 三件を検索する(page); });
  await step(2, async () => { await l.三点リーダーを押す(A); });
  await expected(async () => {
    expect.soft(await l.行のカード(A).locator('button[data-bs-target="#DeleteModal"]').isVisible(), `カードID ${A} の削除ボタンの表示`).toBe(true);
  });
});

caseTest("IT-M14-01-054", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const [A] = ID群(notes, DELREAD, "A");
  let l!: CardSearchPage;
  await step(1, async () => { l = await 三件を検索する(page); });
  await step(2, async () => { await l.三点リーダーを押す(A); });
  await step(3, async () => { await l.削除を押す(A); });
  await step(4, async () => { await l.確認ポップアップでキャンセルする(); });
  await expected(async () => {
    expect.soft(await page.locator("#DeleteModal").isVisible(), "確認ポップアップの表示").toBe(false);
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード検索）").toMatch(/\/card(\/search(\/\d+)?)?$/);
    expect.soft(await l.form.count(), "カード検索の検索欄").toBe(1);
  });
});

// ---- カード名リスト作成 ----
type ファイル = { 状態: number; 配列: string[] | null };
/** ユーザーデータの公開パス配下の /list/<名前> を開く（JSON の配列として読めれば配列を返す） */
async function リストを開く(page: Page, 名前: string): Promise<ファイル> {
  const res = await page.request.get(`${BASE_URL}/user_data/list/${名前}`, { failOnStatusCode: false, timeout: 60_000 });
  let 配列: string[] | null = null;
  if (res.status() === 200) {
    try { const j = JSON.parse(await res.text()); if (Array.isArray(j)) 配列 = j.map(String); } catch { /* JSON の配列ではない */ }
  }
  return { 状態: res.status(), 配列 };
}

/** バッチの結果が反映されるまで（目印のカード名が入るまで）待ってから、ファイルを読む */
async function 反映後に開く(page: Page, 名前: string, 目印: string): Promise<ファイル> {
  let f: ファイル = { 状態: 0, 配列: null };
  await expect.poll(async () => { f = await リストを開く(page, 名前); return f.配列?.includes(目印) ?? false; }, { timeout: 60_000, message: `${名前} にカード名「${目印}」が入るまで` }).toBe(true).catch(() => undefined);
  return f;
}

/** 検索画面を開き、カード名リスト作成を押して確認の「実行」を受ける（手順 1〜3）。完了のメッセージを返す */
async function 作成する(page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>): Promise<string[]> {
  const l = new CardSearchPage(page);
  let 実行!: () => Promise<string[]>;
  let msgs: string[] = [];
  await step(1, async () => { await l.open(); });
  await step(2, async () => { const r = await l.カード名リスト作成を押す(); 実行 = r.実行する; });
  await step(3, async () => { msgs = await 実行(); note(`確認ポップアップは画面の確認ダイアログとして表示された。完了の表示: ${msgs[1]}`); });
  return msgs;
}
const 前置き = "カード名リストのファイルは共有のデータのため、開始時に削除せず、作成後の内容に印つきのカード名が入ることで作成されたことを確かめた";

caseTest("IT-M14-01-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const T = "M1401Card006";
  void notes; note(前置き);
  const 名 = ["A", "B"].map((c) => `${rc(T)}${c}`);
  let 全: ファイル = { 状態: 0, 配列: null }, 標準: ファイル = { 状態: 0, 配列: null }, 現代: ファイル = { 状態: 0, 配列: null };
  await 作成する(page, step);
  await step(4, async () => {
    全 = await 反映後に開く(page, "cardNameList.json", 名[0]);
    標準 = await 反映後に開く(page, "cardNameList_St.json", 名[0]);
    現代 = await 反映後に開く(page, "cardNameList_Mo.json", 名[0]);
  });
  await expected(async () => {
    for (const [f, ファイル名] of [[全, "cardNameList.json"], [標準, "cardNameList_St.json"], [現代, "cardNameList_Mo.json"]] as const) {
      expect.soft(f.状態, `${ファイル名} の応答`).toBe(200);
      expect.soft(f.配列 !== null, `${ファイル名} は JSON の配列`).toBe(true);
      for (const n of 名) expect.soft(f.配列?.includes(n), `${ファイル名} にカード名(英)「${n}」が含まれる`).toBe(true);
    }
  });
});

caseTest("IT-M14-01-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  note(前置き);
  const msgs = await 作成する(page, step);
  await expected(async () => {
    const l = new CardSearchPage(page);
    expect.soft(msgs.length, "確認と完了の表示").toBe(2);
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード検索）").toMatch(/\/card(\/search(\/\d+)?)?$/);
    expect.soft(await l.form.count(), "カード検索の検索欄").toBe(1);
  });
});

caseTest("IT-M14-01-066", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  note(前置き);
  const T = "M1401-066";
  const [英A, 英B] = [`${rc(T)}-A`, `${rc(T)}-B`];
  const [日A, 日B] = [rc("カード名リスト試験066A"), rc("カード名リスト試験066B")];
  let 標準: ファイル = { 状態: 0, 配列: null }, 現代: ファイル = { 状態: 0, 配列: null };
  await 作成する(page, step);
  await step(4, async () => {
    標準 = await 反映後に開く(page, "cardNameList_St.json", 英A);
    現代 = await 反映後に開く(page, "cardNameList_Mo.json", 英B);
  });
  await expected(async () => {
    expect.soft(標準.配列 !== null, "cardNameList_St.json は JSON の配列").toBe(true);
    expect.soft(現代.配列 !== null, "cardNameList_Mo.json は JSON の配列").toBe(true);
    expect.soft(標準.配列?.includes(英A), `cardNameList_St.json にカード名(英)「${英A}」が含まれる`).toBe(true);
    expect.soft(標準.配列?.includes(日A), `cardNameList_St.json にカード名(日)「${日A}」が含まれる`).toBe(true);
    expect.soft(現代.配列?.includes(英B), `cardNameList_Mo.json にカード名(英)「${英B}」が含まれる`).toBe(true);
    expect.soft(現代.配列?.includes(日B), `cardNameList_Mo.json にカード名(日)「${日B}」が含まれる`).toBe(true);
  });
});

caseTest("IT-M14-01-079", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  note(前置き);
  const T = "M1401-079";
  const [英A, 英B] = [`${rc(T)}-A`, `${rc(T)}-B`];
  const [日A, 日B] = [rc("カード名リスト試験079A"), rc("カード名リスト試験079B")];
  let 標準: ファイル = { 状態: 0, 配列: null }, 現代: ファイル = { 状態: 0, 配列: null };
  await 作成する(page, step);
  await step(4, async () => {
    // 作成されたこと（自分の側のカードが入ったこと）を待ってから、反対側のカードが入っていないことを読む
    標準 = await 反映後に開く(page, "cardNameList_St.json", 英A);
    現代 = await 反映後に開く(page, "cardNameList_Mo.json", 英B);
  });
  await expected(async () => {
    expect.soft(標準.配列?.includes(英A), "（前提）cardNameList_St.json が作成され、スタンダードのカードが含まれる").toBe(true);
    expect.soft(現代.配列?.includes(英B), "（前提）cardNameList_Mo.json が作成され、モダンのカードが含まれる").toBe(true);
    expect.soft(標準.配列?.includes(英B), `cardNameList_St.json にカード名(英)「${英B}」が含まれない`).toBe(false);
    expect.soft(標準.配列?.includes(日B), `cardNameList_St.json にカード名(日)「${日B}」が含まれない`).toBe(false);
    expect.soft(現代.配列?.includes(英A), `cardNameList_Mo.json にカード名(英)「${英A}」が含まれない`).toBe(false);
    expect.soft(現代.配列?.includes(日A), `cardNameList_Mo.json にカード名(日)「${日A}」が含まれない`).toBe(false);
  });
});

caseTest("IT-M14-01-084", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  note(`${前置き}。フォーマット「コード無し試験フォーマット084」は新しく登録せず、コードが空の「試験フォーマット」を使った`);
  const 英A = `${rc("M1401DP084")}-A`;
  let 全: ファイル = { 状態: 0, 配列: null }, コード無し: ファイル = { 状態: 0, 配列: null };
  await 作成する(page, step);
  await step(4, async () => {
    全 = await 反映後に開く(page, "cardNameList.json", 英A);
    コード無し = await リストを開く(page, "cardNameList_.json");
  });
  await expected(async () => {
    expect.soft(全.配列?.includes(英A), "（前提）cardNameList.json が作成され、カードが含まれる").toBe(true);
    expect.soft(コード無し.状態, "cardNameList_.json の応答（取得できない）").toBeGreaterThanOrEqual(400);
    expect.soft(コード無し.配列, "cardNameList_.json は JSON の配列として取得できない").toBeNull();
  });
});

caseTest("IT-M14-01-102", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  note(前置き);
  const T = rc("M1401-CB102");
  const X = `${T}+${T}-X`, Y = `${T}-Y`;
  let 全: ファイル = { 状態: 0, 配列: null }, 標準: ファイル = { 状態: 0, 配列: null };
  await 作成する(page, step);
  await step(4, async () => {
    全 = await 反映後に開く(page, "cardNameList.json", X);
    標準 = await 反映後に開く(page, "cardNameList_St.json", Y);
  });
  await expected(async () => {
    expect.soft(全.配列?.includes(X), `cardNameList.json に「${X}」（スラッシュはプラスに置き換わる）が含まれる`).toBe(true);
    expect.soft(全.配列?.includes(Y), `cardNameList.json に「${Y}」が含まれる`).toBe(true);
    expect.soft(標準.配列?.includes(Y), `cardNameList_St.json に「${Y}」が含まれる`).toBe(true);
    expect.soft(標準.配列?.includes(X), `cardNameList_St.json に「${X}」が含まれない`).toBe(false);
    expect.soft(標準.配列?.some((n) => n.includes(`${T}-X`)), "cardNameList_St.json にモダンだけのカードの名前が含まれない").toBe(false);
  });
});
