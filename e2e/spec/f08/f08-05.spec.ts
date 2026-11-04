/** F08-05 店頭買取査定申込履歴（買取詳細のステータス変更履歴）。正本: cases/F08-05_test_cases.tsv（画面だけで準備できる 074 を実装） */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { ステータス変更履歴, 会員IDで検索する, 履歴の行 } from "../../pages/admin/f08_05_otc_detail";
import { MemberApplyPage } from "../../pages/front/f08_05_apply";
import { F0805_ADMIN, PD_STORE, PD_MEMBER_PASSWORD, pdMemberEmail } from "../../seeds/f08-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

// 会員ログインでの申込で作られるステータス変更履歴
caseTest("IT-F08-05-074", async ({ page, notes, step, expected }) => {
  const apply = new MemberApplyPage(page);
  let 姓名 = { 姓: "", 名: "" };
  await step(1, async () => { await apply.申込前ログイン画面を開く(PD_STORE.支店URL); });
  await step(2, async () => { await apply.ログインする(pdMemberEmail(), PD_MEMBER_PASSWORD); });
  await step(3, async () => {
    姓名 = await apply.申込者の姓名();
    expect.soft(姓名, "申込情報入力画面に設定された会員情報（お名前の姓・名）").toEqual({ 姓: "履歴丙", 名: "三郎" });
    await apply.同意して次へ進む();
  });
  await step(4, async () => {
    await apply.査定申込みする();
    await expect(apply.完了の表示(), "店頭買取査定申込登録完了画面").toBeVisible({ timeout: 30_000 });
  });
  const list = new OtcListPage(page);
  await step(5, async () => {
    // 別のブラウザセッション: 会員のログインを含む全てのクッキーを消した新しいセッションで管理画面にログインする
    await page.context().clearCookies();
    await loginAdmin(page, F0805_ADMIN);
    await list.open();
  });
  await step(6, async () => { await 会員IDで検索する(list, notes.get("〔会員ID-F0805-003〕")); });
  await step(7, async () => {
    const rows = await list.行();
    const mine = rows.filter((r) => r.申込者.replace(/\s+/g, "") === "履歴丙三郎");
    expect(mine.length, "会員IDの検索結果のうち申込者が「履歴丙 三郎」の行の数").toBeGreaterThan(0);
    await list.詳細を開く(mine[0].査定ID);
  });
  let 履歴: 履歴の行[] = [];
  await step(8, async () => { 履歴 = await ステータス変更履歴(page); });
  await expected(async () => {
    expect.soft(履歴.length, "ステータス変更履歴の行数（申込で作成された履歴）").toBeGreaterThan(0);
    expect.soft(履歴[0]?.ステータス ?? "", "申込で作成された履歴の行のステータス").not.toBe("");
  });
  note("別のブラウザセッションは、同じブラウザのクッキーを全て消して始め直して代えた（画面のキャプチャを1つのセッションに残すため）。管理者の権限は、正本が定める細かな権限の代わりにシステム管理者にした。店舗は再実行で同じものを使う");
});
