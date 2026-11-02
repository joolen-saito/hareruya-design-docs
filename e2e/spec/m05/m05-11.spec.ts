/** M05-11 受注情報編集。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { Row } from "../../lib/db";
import { 手動変更履歴の件数, 受注, 配送情報の出荷日 } from "../../db/m05_11";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import { ADMIN_A_NAME, M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => note(`ダイアログを受け入れた: ${m}`);

/** 手順1「受注番号〔…〕の受注情報編集画面を開く」（事前準備: 店舗Aを編集可能な管理者でログイン済み） */
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

/** 変更後のステータスだけを選んで「受注ステータスを変更」を押し、DBで受注を確かめるケース */
function ステータス変更DB(n: string, 変更後: string, 欄: string, 項目: string, 追加?: (r: Row) => void): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage;
    let r!: Row;
    await step(1, async () => { p = await 開く(browser, page, notes.get(key(n))); });
    await step(2, async () => { await p.ステータスを選ぶ(変更後); });
    await step(3, async () => { await p.ステータスを変更する(onDialog); });
    await step(4, async () => { r = 受注(notes.get(key(n))); });
    await expected(async () => {
      expect.soft(r[欄], `${項目}が登録される`).not.toBeNull();
      if (追加) 追加(r);
    });
  };
}

/** 変更後のステータスを選んで「受注ステータスを変更」を押し、受注情報編集画面へ遷移することを確かめるケース */
function ステータス変更遷移(n: string, 変更後: string): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage;
    await step(1, async () => { p = await 開く(browser, page, notes.get(key(n))); });
    await step(2, async () => { await p.ステータスを選ぶ(変更後); });
    await step(3, async () => { await p.ステータスを変更する(onDialog); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "受注情報編集画面へ遷移する").toMatch(/\/order\/\d+\/edit$/);
      await expect.soft(p.status, "受注情報編集画面の変更後のステータス欄が表示される").toBeVisible();
    });
  };
}

/** ショップ用メモ欄を変えて「受注情報を登録」を押すケース。DBの確かめは取り出し方を渡す */
function メモ登録(n: string, メモ: string, 取る?: (no: string) => unknown, 確かめ?: (v: unknown) => void): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    let p!: OrderEditPage;
    let v: unknown;
    await step(1, async () => { p = await 開く(browser, page, notes.get(key(n))); });
    await step(2, async () => { await p.note.fill(メモ); });
    await step(3, async () => { await p.受注情報を登録する(onDialog); });
    if (取る) await step(4, async () => { v = 取る(notes.get(key(n))); });
    await expected(async () => {
      if (確かめ) { 確かめ(v); return; }
      expect.soft(new URL(page.url()).pathname, "受注情報編集画面へ遷移する").toMatch(/\/order\/\d+\/edit$/);
      await expect.soft(p.note, "ショップ用メモ欄が保存した値で表示される").toHaveValue(メモ);
    });
  };
}

caseTest("IT-M05-11-014", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let r!: Row;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("014"))); });
  await step(2, async () => { await p.ステータスを選ぶ("入金済み"); await p.注文者姓を入れる("保存対象外姓"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { r = 受注(notes.get(key("014"))); });
  await expected(async () => {
    expect.soft(r.ステータス, "受注のステータス").toBe("入金済み");
    expect.soft(r.注文者姓, "注文者のお名前（姓）は画面で入れた値で保存されない").toBe("試験姓");
  });
});

caseTest("IT-M05-11-015", ステータス変更DB("015", "入金済み", "入金日", "入金日"));
caseTest("IT-M05-11-016", ステータス変更DB("016", "ピック中", "注文確定日", "注文確定日"));
caseTest("IT-M05-11-017", ステータス変更DB("017", "店頭予約", "店頭予約日", "店頭予約日"));
caseTest("IT-M05-11-018", ステータス変更DB("018", "出荷完了", "出荷日", "受注の出荷日", (r) => {
  const ships = 配送情報の出荷日(r.受注ID!);
  expect.soft(ships.length > 0 && ships.every((d) => d !== null), `配送情報の出荷日が登録される（配送先 ${ships.length} 件）`).toBe(true);
}));
caseTest("IT-M05-11-020", ステータス変更遷移("020", "入金済み"));
caseTest("IT-M05-11-025", ステータス変更遷移("025", "キャンセル"));
caseTest("IT-M05-11-028", メモ登録("028", "通常保存遷移"));
caseTest("IT-M05-11-029", メモ登録("029", "履歴登録確認", (no) => 手動変更履歴の件数(受注(no).受注ID!), (v) => {
  expect.soft(v, "この受注に対する手動変更履歴の件数").toBe(1);
}));
caseTest("IT-M05-11-045", メモ登録("045", "担当者更新確認", (no) => 受注(no).担当者, (v) => {
  expect.soft(v, `受注の担当者（操作したメンバー ${ADMIN_A_NAME}）`).toBe(ADMIN_A_NAME);
}));

caseTest("IT-M05-11-046", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let r!: Row;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("046"))); });
  await step(2, async () => { await p.ステータスを選ぶ("入金済み"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { r = 受注(notes.get(key("046"))); });
  await expected(async () => {
    expect.soft(r.担当者, `受注の担当者（操作したメンバー ${ADMIN_A_NAME}）`).toBe(ADMIN_A_NAME);
  });
});

caseTest("IT-M05-11-071", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let r!: Row;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("071"))); });
  await step(2, async () => { await p.メールを入れる("m0511@example.com"); });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { r = 受注(notes.get(key("071"))); });
  await expected(async () => {
    expect.soft(r.メール, "受注のメールアドレス").toBe("m0511@example.com");
  });
});
