/**
 * F06-07 購入履歴詳細 の続き（-b）。正本: cases/F06-07_test_cases.tsv
 * 既存の spec/f06/f06-07.spec.ts（003・004。流し終えたもの）は変えない。会員・注文は、フロントの会員登録・注文と管理画面の受注情報編集で作る（seeds/f06-07-b.ts）。
 * 実装しないケースは記録 review/F06-07_progress_2026-11-07.md
 */
import { Page, test } from "@playwright/test";
import { 受注の件数 } from "../../db/f06_07";
import { caseTest, expect } from "../../lib/case";
import { available } from "../../lib/db";
import { LoginPage } from "../../pages/front/f06_03_login";
import { HistoryDetailViewPage } from "../../pages/front/f06_07_history_b";
import { mailOf, passwordOf, 会員Bの注文, 単価の変更 } from "../../seeds/f06-07-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 参照データの注記 = "注文の店舗は本店、商品は手元の販売中の商品1点で作った（シード表の共通参照データ「晴れる屋横浜店」「日本語商品A」などはDBで指定IDに登録する作り方のため作っていない）。このケースはそれらの値を確かめない";
const 日付の注記 = "注文日・出荷日はDBへ直接設定する作り方のため設定していない。このケースは注文日・出荷日の値を確かめない";

async function ログイン(page: Page, 番号: string, 前半 = `f0607-a-${番号}`, pw = passwordOf(番号)): Promise<HistoryDetailViewPage> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf(前半), pw);
  return new HistoryDetailViewPage(page);
}

caseTest("IT-F06-07-002", async ({ page, notes, step, expected }) => {
  const h = new HistoryDetailViewPage(page);
  let 状態 = 0;
  await step(1, async () => { 状態 = await h.直接開く(notes.get("〔注文ID-F0607-002〕")); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（会員ログイン画面）のアドレス").toMatch(/\/mypage\/login/);
    expect.soft(await new LoginPage(page).ログイン画面である(), "会員ログイン画面が表示されている").toBe(true);
    expect.soft(await h.詳細の見出し.count(), "購入履歴詳細の見出しは表示されない").toBe(0);
    note(参照データの注記); note(日付の注記); note(`最初の応答の状態: ${状態}（ログイン画面へ移ったあとの最終の応答）`);
  });
});
caseTest("IT-F06-07-005", async ({ page, step, expected }) => {
  const h = await ログイン(page, "005");
  let 状態 = 0, 件数 = -1;
  await step(1, async () => { 件数 = available ? 受注の件数("999999") : -1; 状態 = await h.開く("999999"); });
  await expected(async () => {
    expect.soft(件数, "注文ID 999999の受注の件数（未登録）").toBe(0);
    expect.soft(状態, "HTTPステータス").toBe(404);
    expect.soft(await h.詳細の見出し.count(), "購入履歴詳細の見出しは表示されない").toBe(0);
    supplement("シード表は「関連データがあれば削除して未登録であることを確認する」と定めるが、DBへは書き込まない決まりのため、未登録であることをDBの参照で確かめるだけにした");
  });
});
caseTest("IT-F06-07-006", async ({ page, step, expected }) => {
  const h = await ログイン(page, "006", "f0607-a-006", passwordOf("006A"));
  let 状態 = 0;
  await step(1, async () => { 状態 = await h.直接開く(会員Bの注文.ID ?? ""); });
  await expected(async () => {
    expect.soft(会員Bの注文.ID !== undefined, "会員Bの注文を作ってある").toBe(true);
    expect.soft(状態, "HTTPステータス").toBe(404);
    expect.soft(await h.詳細の見出し.count(), "購入履歴詳細の見出しは表示されない").toBe(0);
    supplement("シード表はDBで会員・注文を指定IDで登録する作り方（注文ID 607006006）のため、会員Bの注文はフロントの注文と管理画面で作った別の注文IDにした");
  });
});
caseTest("IT-F06-07-016", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "016");
  let 出荷日: string | null = null;
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-016〕")); 出荷日 = await h.項目の値("出荷日"); });
  await expected(async () => {
    expect.soft(await h.詳細の見出し.count(), "購入履歴詳細画面が表示されている").toBeGreaterThan(0);
    expect.soft(出荷日, "出荷日の欄（項目があり、値は空欄）").toBe("");
    note(参照データの注記); note(日付の注記);
  });
});
caseTest("IT-F06-07-017", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "017");
  let 送り主 = "", お届け先 = "";
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-017〕")); });
  await step(2, async () => { 送り主 = (await h.送り主欄.innerText()).replace(/\s+/g, ""); お届け先 = (await h.お届け先欄.innerText()).replace(/\s+/g, ""); });
  await expected(async () => {
    expect.soft(送り主, "送り主の住所3「送主ビル3F」").toContain("送主ビル3F");
    expect.soft(お届け先, "お届け先の住所3「届け先タワー8F」").toContain("届け先タワー8F");
    note(参照データの注記);
    note("送り主・お届け先の住所は、受注情報編集で住所3だけをシード表の値にした（郵便番号・都道府県・住所1・住所2は、注文時の既定の値のまま）");
  });
});
caseTest("IT-F06-07-018", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "018");
  let 本文 = "";
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-018〕")); });
  await step(2, async () => { 本文 = await h.本文(); });
  await expected(async () => {
    expect.soft(本文.length, "購入履歴詳細の本文が表示されている").toBeGreaterThan(50);
    for (const v of ["支払い先コンビニ", "お客様番号", "確認番号", "第1番号", "第2番号", "オンライン決済番号", "払込票番号"]) expect.soft(本文, `「${v}」が表示されない`).not.toContain(v);
    note(参照データの注記);
  });
});
caseTest("IT-F06-07-019", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "019");
  let 本文 = "";
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-019〕")); 本文 = await h.本文(); });
  await expected(async () => {
    expect.soft(本文, "注文時から商品価格が変更されていることを示す注意が表示される").toContain("※金額が変更されている商品があるため、再注文時はご注意ください。");
    expect.soft(h.path, "購入履歴詳細画面に留まる").toMatch(new RegExp(`/mypage/shopping_history_detail/${notes.get("〔注文ID-F0607-019〕")}$`));
    const t = 単価の変更.get("S-F06-07-CASE-019");
    supplement(`シード表は「日本語商品Aの単価を1,000円（現在価格1,200円）」と定めるが、手元の販売中の商品の注文時単価をいまの値（${t?.前 ?? "?"}円）から別の値（${t?.後 ?? "?"}円）に受注情報編集で変えて、現在価格と違う状態にした`);
  });
});
caseTest("IT-F06-07-021", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "021");
  let 件数 = -1;
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-021〕")); 件数 = await h.領収書発行リンク.count(); });
  await expected(async () => {
    expect.soft(await h.詳細の見出し.count(), "購入履歴詳細画面が表示されている").toBeGreaterThan(0);
    expect.soft(件数, "領収書発行リンクの数（支払い状態が未払いのため表示されない）").toBe(0);
    note(参照データの注記);
    note("支払方法の「クレジットカード」は「クレジットカード決済（GMO）」で代えた（理由は、シード作成時の問題の欄）。領収書の対象外の支払方法ではないので、表示されない理由は未払いだけ");
  });
});
caseTest("IT-F06-07-022", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "022");
  let 件数 = -1;
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-022〕")); 件数 = await h.領収書発行リンク.count(); });
  await expected(async () => {
    expect.soft(await h.詳細の見出し.count(), "購入履歴詳細画面が表示されている").toBeGreaterThan(0);
    expect.soft(件数, "領収書発行リンクの数（受注ステータスが出荷完了ではないため表示されない）").toBe(0);
    note(参照データの注記);
    note("支払方法の「クレジットカード」は「クレジットカード決済（GMO）」で代えた（理由は、シード作成時の問題の欄）。領収書の対象外の支払方法ではないので、表示されない理由は受注ステータスだけ");
  });
});
caseTest("IT-F06-07-023", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "023");
  const 件数: Record<string, number> = {};
  for (const [i, suf] of ["A", "B", "C"].entries()) {
    await step(i + 1, async () => { await h.開く(notes.get(`〔注文ID-F0607-023${suf}〕`)); 件数[suf] = await h.領収書発行リンク.count(); });
  }
  await expected(async () => {
    for (const [suf, 名] of [["A", "郵便振替"], ["B", "銀行振込"], ["C", "代金引換"]]) expect.soft(件数[suf], `支払い方法が${名}の注文の領収書発行リンクの数（表示されない）`).toBe(0);
    note(参照データの注記);
  });
});
caseTest("IT-F06-07-024", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "024");
  let 開いた先 = "", 元のアドレス = "";
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-024〕")); });
  await step(2, async () => {
    const [popup] = await Promise.all([page.waitForEvent("popup", { timeout: 30_000 }), h.領収書発行リンク.first().click({ timeout: 20_000 })]);
    await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
    開いた先 = popup.url();
    元のアドレス = page.url();
    await popup.close();
  });
  await expected(async () => {
    expect.soft(元のアドレス, "購入履歴詳細画面を表示したウィンドウが残っている").toMatch(new RegExp(`/mypage/shopping_history_detail/${notes.get("〔注文ID-F0607-024〕")}$`));
    expect.soft(開いた先, "領収書が別ウィンドウで開く").toMatch(/printOrderReceipt/);
    note(参照データの注記);
  });
});
caseTest("IT-F06-07-029", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "029");
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-029〕")); });
  await step(2, async () => { await h.押して遷移する(h.マイページへ戻る); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（マイページ）のアドレス").toMatch(/\/mypage\/?$/);
    note(参照データの注記);
  });
});
caseTest("IT-F06-07-042", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "042");
  let 本文 = "";
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-042〕")); });
  await step(2, async () => { 本文 = await h.本文(); });
  await expected(async () => {
    expect.soft(本文.length, "購入履歴詳細の本文が表示されている").toBeGreaterThan(50);
    expect.soft(本文, "「※金額が変更されている商品があるため、再注文時はご注意ください。」が表示されない").not.toContain("※金額が変更されている商品があるため、再注文時はご注意ください。");
    expect.soft(h.path, "購入履歴詳細画面に留まる").toMatch(new RegExp(`/mypage/shopping_history_detail/${notes.get("〔注文ID-F0607-042〕")}$`));
    supplement("シード表は「日本語商品Aの注文時単価1,200円（現在価格と同額）」と定める。手元の販売中の商品を注文した（注文時単価は現在価格と同額。DBで参照する確かめは行っていない）");
  });
});
caseTest("IT-F06-07-046", async ({ page, notes, step, expected }) => {
  const h = await ログイン(page, "046");
  let 件数 = -1;
  await step(1, async () => { await h.開く(notes.get("〔注文ID-F0607-046〕")); 件数 = await h.領収書発行リンク.count(); });
  await expected(async () => {
    expect.soft(await h.詳細の見出し.count(), "購入履歴詳細画面が表示されている").toBeGreaterThan(0);
    expect.soft(件数, "領収書発行リンクの数（種別EC・店頭受取でない・支払い済み・出荷完了・クレジットカードのため表示される）").toBeGreaterThan(0);
    note(参照データの注記);
    note("支払方法の「クレジットカード」は、手元の環境の受注情報編集がSPLINKSのクレジットカード決済でシステムエラーになるため、プラグインを使わない「クレジットカード決済（GMO）」で代えた（領収書の対象外の支払方法ではない）");
  });
});
