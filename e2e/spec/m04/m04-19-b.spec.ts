/**
 * M04-19 欠品履歴検索一覧の続き（2026-11-23 依頼者「DB の直接の設定は E2E の行だけなら流してよい」）。正本: cases/M04-19_test_cases.tsv
 * 判定済みのケースの指紋を変えないため、spec/m04/m04-19.spec.ts とは別のファイルにした。
 */
import { Page, test } from "@playwright/test";
import * as dbx19 from "../../db/m04_19_x";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { ShortageHistoryPage, 数字だけ, 欠品履歴の行 } from "../../pages/admin/m04_19_shortage_history";
import { M0419_ADMIN } from "../../seeds/m04-19";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** 事前準備①: M04-19試験管理者でログインする（テストごとの新しいブラウザセッション。本機能の保持値は無い） */
async function signIn(page: Page): Promise<ShortageHistoryPage> {
  await loginAdmin(page, M0419_ADMIN);
  return new ShortageHistoryPage(page);
}

/** 一覧の、商品コードの行（1行のはず）を読む */
async function rowOf(h: ShortageHistoryPage, code: string): Promise<欠品履歴の行> {
  await expect(h.rowByCode(code), `欠品履歴一覧の「${code}」の行`).toHaveCount(1);
  return (await h.readRows()).filter((r) => r.商品コード === code)[0];
}

/** 1. 開く／2. 検索条件をクリア／3. 欠品履歴一覧を表示にチェック／4. 商品名(日/英）・カード名・商品コードに語を入力／5. 検索 */
async function clearAndSearch(h: ShortageHistoryPage, step: CaseCtx["step"], 語: string): Promise<void> {
  await step(1, () => h.openFromMenu());
  await step(2, () => h.clearConditions());
  await step(3, () => h.checkShortageList());
  await step(4, () => h.fillKeyword(語));
  await step(5, () => h.search());
}

caseTest("IT-M04-19-006", async ({ page, notes, step, expected }) => {
  const h = await signIn(page);
  const code = rc("M419-DISPLAY-006");
  await clearAndSearch(h, step, code);
  await expected(async () => {
    const r = await rowOf(h, code);
    note(`行: ${JSON.stringify(r)}`);
    if (r.履歴ID) note(`DB の欠品の履歴 ${r.履歴ID}: ${JSON.stringify(dbx19.欠品履歴(r.履歴ID))}`);
    const 本店の店名 = dbx19.本店の店名();
    supplement(`店舗は、正本の「本店」を本店（店舗ID 1）の今の店名「${本店の店名}」で読んだ（ほかの方が店名を変えることがある）。登録元は、受注の欠品の行で「受注」を含むかで見た（IT-M04-19-007 と同じ）`);
    expect.soft(r.商品コード, "商品コード").toBe(code);
    expect.soft(r.商品名, "商品名").toBe("欠品表示商品");
    expect.soft(r.言語, "言語").toBe("日本語");
    expect.soft(r.状態, "状態").toBe("NM");
    expect.soft(r.Foil, "Foil").toBe("通常");
    expect.soft(r.店舗, "店舗（本店）").toBe(本店の店名);
    expect.soft(r.在庫区分, "在庫区分").toBe("EC-CUBE");
    expect.soft(r.登録元, "登録元（受注）").toContain("受注");
    expect.soft(r.登録元ID, "登録元ID（受注ID）").toBe(notes.get("〔受注ID-M0419-006〕"));
    expect.soft(r.欠品点数, "欠品点数").toBe("2");
    expect.soft(数字だけ(r.欠品時販売価格), `欠品時販売価格（表示「${r.欠品時販売価格}」）`).toBe("1980");
    expect.soft(r.欠品理由, "欠品理由").toBe("棚卸差異");
    expect.soft(r.登録日, "登録日").toBe("2026/04/10 09:30");
    expect.soft(r.登録者, "登録者").toBe("M04-19登録者");
    expect.soft(r.最終更新日, "最終更新日").toBe("2026/04/11 10:45");
    expect.soft(r.最終更新者, "最終更新者").toBe("M04-19更新者");
  });
});
