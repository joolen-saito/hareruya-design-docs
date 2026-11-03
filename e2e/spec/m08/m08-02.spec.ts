/**
 * M08-02 メール一括送信。正本: cases/M08-02_test_cases.tsv
 * 実装しないケース（記録 review/M08-02_progress_*.md）: 会員の更新日時をDBで設定するシードのもの（005〜009）、メール文字コード・店舗基本設定を書き換えて試験用メールサーバの受信を確かめるもの、
 * メールの受信内容を確かめるもの。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 送信履歴の件数 } from "../../db/m08_02";
import { M08CustomerListPage } from "../../pages/admin/m08_customer_list";
import { M08CustomerMailPage } from "../../pages/admin/m08_customer_mail";
import { M0802_ADMIN, 検索語 } from "../../seeds/m08-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 会員検索一覧で語を検索して結果画面を開く（事前準備の「検索結果画面を開く」） */
async function 結果を開く(ctx: Pick<CaseCtx, "page">, 語: string): Promise<M08CustomerListPage> {
  await loginAdmin(ctx.page, M0802_ADMIN);
  const list = new M08CustomerListPage(ctx.page);
  await list.open();
  await list.searchMulti(語);
  return list;
}

caseTest("IT-M08-02-001", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0802-001${x}〕`));
  await 結果を開く(ctx, 検索語("001"));
  const m = new M08CustomerMailPage(page);
  let 対象: { 会員ID: string; 氏名: string }[] = []; let 確認: { 件名: string; 本文: string } = { 件名: "", 本文: "" };
  await step(1, async () => { await m.一覧で選ぶ([a, b, c]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.入力する("一括Mail-01", "本文Body-01"); });
  await step(3, async () => {
    const before = await m.会員IDリストを読む();
    const sep = before.includes(",") ? "," : "\n";
    await m.会員IDリストを変える([c, "999999", a, b].join(sep));
  });
  await step(4, async () => { await m.送信内容を確認を押す(); 対象 = await m.配信対象者(); 確認 = await m.確認画面の件名と本文(); });
  await expected(async () => {
    expect.soft(await m.確認画面である(), "メール一括送信確認画面が表示されている").toBe(true);
    expect.soft(確認.件名, "確認画面のタイトル").toContain("一括Mail-01");
    expect.soft(確認.本文, "確認画面の本文").toBe("本文Body-01");
    expect.soft(対象.map((x) => x.会員ID), "配信対象者の会員ID（会員ID昇順の3件だけ）").toEqual([a, b, c]);
    expect.soft(対象.map((x) => x.氏名), "配信対象者の氏名").toEqual(["青山 一郎", "井上 二郎", "上田 三郎"]);
  });
});

caseTest("IT-M08-02-002", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-002〕");
  await 結果を開く(ctx, 検索語("002"));
  const m = new M08CustomerMailPage(page);
  await step(1, async () => { await m.一覧で選ぶ([id]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.入力画面である(); });
  await expected(async () => {
    expect.soft(await m.入力画面である(), "メール一括送信画面が表示されている").toBe(true);
    expect.soft(await m.ids.isVisible(), "対象会員IDリストの欄が画面上に表示されない").toBe(false);
    const text = await page.locator("main, #main, .c-contentsArea, body").first().innerText();
    expect.soft(text.includes(id), `会員ID ${id} が画面上に表示されない`).toBe(false);
  });
});

caseTest("IT-M08-02-003", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-003〕");
  const 語 = 検索語("003");
  await loginAdmin(page, M0802_ADMIN);
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  let 件名 = "", 本文 = "";
  await step(1, async () => { await list.open(); await list.searchMulti(語); await m.一覧で選ぶ([id]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.入力する("戻る確認Title", "戻る確認Body"); await m.送信内容を確認を押す(); });
  await step(3, async () => { await m.戻るを押す(); 件名 = await m.件名を読む(); 本文 = await m.本文を読む(); });
  await expected(async () => {
    expect.soft(await m.入力画面である(), "メール一括送信画面に戻っている").toBe(true);
    expect.soft(件名, "再表示されたタイトル").toBe("戻る確認Title");
    expect.soft(本文, "再表示された本文").toBe("戻る確認Body");
  });
});

caseTest("IT-M08-02-004", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const id = notes.get("〔会員ID-M0802-004〕");
  const 語 = 検索語("004");
  await loginAdmin(page, M0802_ADMIN);
  const list = new M08CustomerListPage(page);
  const m = new M08CustomerMailPage(page);
  await step(1, async () => { await list.open(); await list.searchMulti(語); await m.一覧で選ぶ([id]); await m.その他からメール一括送信を押す(); });
  await step(2, async () => { await m.入力する("会員遷移Title", "会員遷移Body"); await m.送信内容を確認を押す(); });
  await step(3, async () => { await m.配信対象者の氏名を押す(id); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, `会員ID ${id} の会員登録/編集画面のアドレス`).toBe(`/admin/customer/${id}/edit`);
    expect.soft(await page.locator('[name="admin_customer[email]"]').count(), "会員登録/編集画面が表示されている").toBe(1);
  });
});

caseTest("IT-M08-02-012", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const ids = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0802-012${x}〕`));
  await 結果を開く(ctx, 検索語("012"));
  const m = new M08CustomerMailPage(page);
  let r: { 遷移した: boolean; ダイアログ: string | null } = { 遷移した: false, ダイアログ: null };
  let 件数: number[] = [];
  await step(1, async () => { await m.一覧で全部外す(); });
  await step(2, async () => { r = await m.その他からメール一括送信を押す(); note(`押した結果: 画面遷移${r.遷移した ? "あり" : "なし"}、ダイアログ ${r.ダイアログ ?? "なし"}`); });
  await step(3, async () => { 件数 = ids.map(送信履歴の件数); });
  await expected(async () => {
    ids.forEach((id, i) => expect.soft(件数[i], `会員ID ${id} の送信履歴の件数（0件のまま）`).toBe(0));
  });
});
