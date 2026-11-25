/**
 * M08-10 本人確認の変更と買取の表示の連携（023・027）のシード。正本: cases/M08-10_seed_data.tsv
 * 作り方: 会員はフロントの会員登録で作り（seeds/m08-10.ts の 会員を作る）、その会員でフロントのネット買取を1件申し込む（seeds/m07-common.ts の 申込みを行う。買取番号は一覧の先頭行と照合して控える）。
 * 023 の買取依頼日（実行日の前日）は画面で指定できないので、E2E が作った買取だけ DB で書く（seeds/m07-db-prep.ts）。買取状況は申込み直後の「注文」のまま。
 * 読み替え: 会員の姓・メールアドレスは実行の印つき（注文者名で買取検索一覧の先頭行を引くので、前の実行の残りと混ざらないため）。
 *   023 の会員名「連携 試験」は姓に印を付けた「連携-<印>」・名「試験」、027 の「連鎖」「確認」も同じく姓に印を付けた。
 * マスタ（本人確認ステータス・買取状況）は既存のものを画面で確かめるだけで、足さない。
 */
import { Browser } from "@playwright/test";
import { SeedCtx } from "../lib/seeds";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { BuyListPage } from "../pages/admin/m07_buy";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { 会員を作る } from "./m08-10";
import { 申込みを行う, 試験管理者を用意する } from "./m07-common";
import { 買取依頼日をDBで設定する } from "./m07-db-prep";

export const M0810L_ADMIN: Account = { loginId: "m0810l-admin", password: "Passw0rd!M0810L" };
export const M0810RH_ADMIN: Account = { loginId: "m0810rh_admin", password: "Passw0rd-M0810RH" };

async function マスタを確かめる(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyListPage(page);
    await l.open();
    const have = (await page.locator("#admin_purchase_list_buy_order_status option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    if (!have.includes("注文")) throw new Error(`買取状況の選択肢に「注文」が無い（ある選択肢: ${have.join("、")}）`);
    const names = await page.locator('input[name*="identityConfirmStatus"]').evaluateAll((os) => os.map((o) => ((o as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
    const miss = ["未確認", "確認中", "オンライン本人確認済み", "簡易書留確認済み"].filter((n) => !names.includes(n));
    if (miss.length) throw new Error(`本人確認の選択肢に ${miss.join("・")} が無い（ある選択肢: ${names.join("、")}）`);
  });
  reportCurrentSeedIssue("本人確認ステータス4状態と買取状況「注文」は、開発環境の既存のマスタを買取検索一覧の選択肢で確かめた（足していない）");
}

defineSeed("S-M08-10-L-ADM", async ({ browser }) => { await 試験管理者を用意する(browser, M0810L_ADMIN, "M08-10連携試験管理者"); });
defineSeed("S-M08-10-L-MASTER", async ({ browser }) => { await マスタを確かめる(browser); });
defineSeed("S-M08-10-RH-ADM", async ({ browser }) => { await 試験管理者を用意する(browser, M0810RH_ADMIN, "M08-10連鎖試験管理者"); });
defineSeed("S-M08-10-RH-MASTER", async ({ browser }) => { await マスタを確かめる(browser); });

/** 実行日の前日の正午（日本時間） */
function 前日の正午(): string {
  const jst = new Date(Date.now() + 9 * 3600_000 - 24 * 3600_000);
  return `${jst.toISOString().slice(0, 10)} 12:00:00+09`;
}

async function 会員と買取を作る(ctx: SeedCtx, o: { 前半: string; 姓: string; 名: string; セイ: string; メイ: string; 電話: string; 依頼日を前日にする: boolean }): Promise<void> {
  const m = await 会員を作る(ctx, { 前半: o.前半, 姓: o.姓, 名: o.名, セイ: o.セイ, メイ: o.メイ, 電話: o.電話, 登録時の住所2: "結合ビル810", パスワード: "Passw0rd!M0810" });
  const [番号] = await 申込みを行う(ctx.browser, { 姓: o.姓, 名: o.名, メール: m.メール, パスワード: m.パスワード }, 1);
  if (o.依頼日を前日にする) 買取依頼日をDBで設定する(番号, m.メール, 前日の正午());
  for (const l of Notes.labelsIn(ctx.seed["状態・属性"] + ctx.seed.投入方法)) if (/^〔買取番号-/.test(l)) ctx.notes.set(l, 番号);
}

defineSeed("S-M08-10-L-CUST-023", async (ctx) => {
  await 会員と買取を作る(ctx, { 前半: "m0810l-023", 姓: rc("連携"), 名: "試験", セイ: "レンケイ", メイ: "シケン", 電話: "0300008123", 依頼日を前日にする: true });
  reportCurrentSeedIssue("買取依頼日（実行日の前日）は画面で指定できないので、E2E が作った買取だけ DB で書いた。会員の姓は実行の印つき");
});
defineSeed("S-M08-10-RH-CUST-027", async (ctx) => {
  await 会員と買取を作る(ctx, { 前半: "m0810rh-001", 姓: rc("連鎖"), 名: "確認", セイ: "レンサ", メイ: "カクニン", 電話: "0300008127", 依頼日を前日にする: false });
  reportCurrentSeedIssue("会員の姓・メールアドレスは実行の印つき。買取はフロントのネット買取の申込みで1件作った（買取状況は申込み直後の注文）");
});
