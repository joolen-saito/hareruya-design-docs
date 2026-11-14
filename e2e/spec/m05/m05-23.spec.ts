/**
 * M05-23 出荷指示：納品書印刷（英語）。正本: cases/M05-23_test_cases.tsv
 * 実装したケースと解釈は記録 review/M05-23_progress_2026-11-14_dev.md。
 * 出荷指示リスト編集で受注を選び、「納品書印刷（英語）」で開いた新しい窓の英語の納品書（HTML の画面）を読んで確かめる（M05-10・M05-22 の部品）。
 * 共有の設定（本店の適格請求書発行事業者登録番号）は書き換えない（015 は今の値のまま確かめる。シード表の BASEINFO の定めどおり）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 登録番号 } from "../../db/m05_09";
import { 窓の様子 } from "../../pages/admin/m05_09_delivery_slips";
import { 英語の納品書のページ, 英語の納品書を読む } from "../../pages/admin/m05_10_delivery_slips_en";
import { StandbySlipPage } from "../../pages/admin/m05_22_standby_slips";
import { StandbySlipEnPage, 窓の本文 } from "../../pages/admin/m05_23_standby_slips_en";
import { M0523_ADMIN, 作ったものの, 国際配送 } from "../../seeds/m05-23";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 番号の = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);
const 受注のページ = (pages: 英語の納品書のページ[], 注文番号: string) => pages.filter((p) => p.注文番号 === 注文番号);
const 全部の明細 = (pages: 英語の納品書のページ[]) => pages.flatMap((p) => p.明細);

/** 開いた窓が英語の納品書の画面なら読む（納品書の画面でなければ空） */
async function 読む(popup: Page): Promise<英語の納品書のページ[]> {
  if ((await popup.locator(".ContentsAll").count()) === 0) return [];
  return 英語の納品書を読む(popup);
}

type 確かめ = (pages: 英語の納品書のページ[], ctx: CaseCtx, popup: Page) => void | Promise<void>;

/** 出荷指示リスト編集を開き、受注を選んで（選ばないときは空）英語の納品書を開き、読む（手順1〜3） */
function リストから(seed: string, リスト: string, 呼び名: string[], check: 確かめ, opt: { 足す受注?: string } = {}) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected } = ctx;
    await loginAdmin(page, M0523_ADMIN);
    const s = new StandbySlipEnPage(page);
    const v = 作ったものの(seed);
    const 受注IDの = (n: string) => v.受注ID[v.注文番号.indexOf(番号の(ctx, n))];
    let pages: 英語の納品書のページ[] = []; let popup!: Page;
    let i = 1;
    await step(i++, async () => { expect(await s.詳細を開く(番号の(ctx, リスト)), "出荷指示リスト編集画面の応答").toBeLessThan(400); });
    if (呼び名.length > 0) await step(i++, async () => { await s.受注を選ぶ(呼び名.map(受注IDの)); });
    if (opt.足す受注) {
      const 足す = 番号の(ctx, opt.足す受注);
      await step(i++, async () => { await s.印刷の要求へ受注を足す(足す); note(`開発者ツールの代わりに、印刷の要求の選択受注へ受注ID ${足す} を足した（画面の送信用のフォームに隠し項目を足した）`); });
    }
    await step(i, async () => {
      if (呼び名.length === 0) await s.受注を選ぶ([]);
      popup = await s.英語の納品書印刷を押す(); pages = await 読む(popup);
      const 様子 = await 窓の様子(popup);
      note(`開いた窓: ${様子.URL}・題「${様子.題}」・納品書の注文番号（ページごと）: ${pages.map((p) => `${p.注文番号}(${p.ページ})`).join("・") || "なし"}`);
    });
    await expected(async () => {
      expect.soft(popup.url(), "納品書印刷（英語）の窓が開いた").toMatch(/\/standby\/\d+\/print\/delivery\/en/);
      await check(pages, ctx, popup);
    });
  };
}

/** 指定の受注の英語の納品書だけが、受注ごとに続けて出る（出ない受注も確かめる） */
const だけが出る = (呼び名: string[], 出ない: string[] = []) => (pages: 英語の納品書のページ[], ctx: CaseCtx) => {
  const want = 呼び名.map((n) => 番号の(ctx, n));
  const 出た = [...new Set(pages.map((p) => p.注文番号))];
  expect.soft(出た, `英語の納品書が出た注文番号（${呼び名.join("・")} の順に、受注ごとに続けて）`).toEqual(want);
  for (const n of want) expect.soft(受注のページ(pages, n).length, `注文番号 ${n} の納品書のページ数（明細1件なので1ページ）`).toBe(1);
  for (const n of 出ない) expect.soft(出た.includes(番号の(ctx, n)), `注文番号 ${番号の(ctx, n)} の納品書は出ない`).toBe(false);
};
const 国の行 = (lines: string[]) => lines.filter((s) => /\b(Japan|日本)\b/.test(s));

caseTest("IT-M05-23-001", リストから("S-M05-23-BASE-001", "〔出荷指示リストID-M0523-001〕", ["〔注文番号-M0523-001A〕"],
  だけが出る(["〔注文番号-M0523-001A〕"], ["〔注文番号-M0523-001B〕"])));
caseTest("IT-M05-23-002", リストから("S-M05-23-BASE-002", "〔出荷指示リストID-M0523-002〕", ["〔注文番号-M0523-002A〕", "〔注文番号-M0523-002B〕"],
  だけが出る(["〔注文番号-M0523-002A〕", "〔注文番号-M0523-002B〕"])));
caseTest("IT-M05-23-003", リストから("S-M05-23-BASE-003", "〔出荷指示リストID-M0523-003〕", [], async (pages, _ctx, popup) => {
  expect.soft(popup.url(), "納品書印刷（英語）の画面が開く").toMatch(/\/standby\/\d+\/print\/delivery\/en/);
  expect.soft(pages.length, "納品書が1件も表示されない").toBe(0);
}));
caseTest("IT-M05-23-005", リストから("S-M05-23-EXTERNAL-005", "〔出荷指示リストID-M0523-005A〕", ["〔注文番号-M0523-005A〕"], (pages, ctx) => {
  const 出た = [...new Set(pages.map((p) => p.注文番号))];
  expect.soft(出た.includes(番号の(ctx, "〔注文番号-M0523-005A〕")), "選んだ 005A の納品書が出る").toBe(true);
  expect.soft(出た.includes(番号の(ctx, "〔注文番号-M0523-005B〕")), "リストに含まれない 005B の納品書も出る").toBe(true);
}, { 足す受注: "〔受注ID-M0523-005B〕" }));
caseTest("IT-M05-23-007", リストから("S-M05-23-RELATIONS-007", "〔出荷指示リストID-M0523-007〕",
  ["〔注文番号-M0523-007A〕", "〔注文番号-M0523-007B〕", "〔注文番号-M0523-007C〕", "〔注文番号-M0523-007D〕", "〔注文番号-M0523-007E〕"],
  だけが出る(["〔注文番号-M0523-007A〕"], ["〔注文番号-M0523-007B〕", "〔注文番号-M0523-007C〕", "〔注文番号-M0523-007D〕", "〔注文番号-M0523-007E〕"])));
caseTest("IT-M05-23-008", リストから("S-M05-23-RELATIONS-008", "〔出荷指示リストID-M0523-008〕",
  ["〔注文番号-M0523-008A〕", "〔注文番号-M0523-008B〕", "〔注文番号-M0523-008C〕", "〔注文番号-M0523-008D〕"], async (pages, _ctx, popup) => {
    const msgs = await StandbySlipPage.窓のメッセージ(popup);
    note(`開いた窓の画面メッセージの枠: ${msgs.join(" / ") || "なし"}・納品書のページ数: ${pages.length}`);
    expect.soft(msgs, "納品書が作られない結果に警告が表示されない").toEqual([]);
  }));
caseTest("IT-M05-23-009", リストから("S-M05-23-NULL-ADDRESS-009", "〔出荷指示リストID-M0523-009〕", ["〔注文番号-M0523-009〕"],
  だけが出る(["〔注文番号-M0523-009〕"])));
caseTest("IT-M05-23-010", リストから("S-M05-23-NULL-ADDRESS-010", "〔出荷指示リストID-M0523-010〕", ["〔注文番号-M0523-010〕"], (pages, ctx) => {
  const p = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0523-010〕"))[0];
  expect.soft(p ? "出た" : "出ない", "010 の納品書").toBe("出た");
  note(`お届け先の欄: ${(p?.お届け先 ?? []).join(" / ")}`);
  expect.soft(国の行(p?.お届け先 ?? []), "お届け先の国の欄が空（国名が出ない）").toEqual([]);
}));
caseTest("IT-M05-23-012", リストから("S-M05-23-ADDRESS-012", "〔出荷指示リストID-M0523-012〕", ["〔注文番号-M0523-012〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft((p?.お届け先 ?? []).some((s) => s.includes("配送先住所523")), "お届け先の欄に「配送先住所523」").toBe(true);
  expect.soft((p?.送り主 ?? []).some((s) => s.includes("注文者住所523")), "送り主の欄に「注文者住所523」").toBe(true);
}));
caseTest("IT-M05-23-013", リストから("S-M05-23-RAW-VALUES-013", "〔出荷指示リストID-M0523-013〕", ["〔注文番号-M0523-013〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft([...(p?.お届け先 ?? []), ...(p?.送り主 ?? [])].some((s) => s.includes("東京都新宿区未翻訳町523")), "住所「東京都新宿区未翻訳町523」がそのまま出る").toBe(true);
  expect.soft(全部の明細(pages).map((r) => r.商品名), "商品名「日本語商品名523」がそのまま出る").toContain(rc("日本語商品名523"));
}));
caseTest("IT-M05-23-014", リストから("S-M05-23-COMPANY-014", "〔出荷指示リストID-M0523-014〕", ["〔注文番号-M0523-014A〕", "〔注文番号-M0523-014B〕"], (pages, ctx) => {
  const a = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0523-014A〕"))[0], b = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0523-014B〕"))[0];
  expect.soft([a ? "A" : "", b ? "B" : ""].join(""), "2件の納品書が出た").toBe("AB");
  note(`014A の会社欄: ${(a?.会社 ?? []).join(" / ")}`);
  expect.soft(a?.会社.length ?? 0, "会社欄に情報が出る").toBeGreaterThan(0);
  expect.soft(b?.会社 ?? [], "2件の納品書の会社欄（名称・郵便番号・住所・電話番号・URL・メールアドレス）が同じ").toEqual(a?.会社 ?? ["（A の納品書が無い）"]);
}));
caseTest("IT-M05-23-015", リストから("S-M05-23-OMISSION-015", "〔出荷指示リストID-M0523-015〕", ["〔注文番号-M0523-015〕"], async (pages, _ctx, popup) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const 本文 = await 窓の本文(popup);
  const 番号 = 登録番号();
  supplement(`本店の適格請求書発行事業者登録番号は全員が使う設定なので T5230000000000 にせず、今の値（${番号 || "空"}）が出ないことを確かめた（シード表の定めどおり）`);
  expect.soft(/\b987\b/.test(本文), "消費税額（987）が表示されない").toBe(false);
  expect.soft(/tax/i.test(本文), "消費税・内税の欄（Tax）が表示されない").toBe(false);
  if (番号) expect.soft(本文.includes(番号), `適格請求書発行事業者の登録番号（${番号}）が表示されない`).toBe(false);
  expect.soft(/T\d{13}/.test(本文), "登録番号の形（T＋13桁）が表示されない").toBe(false);
}));
caseTest("IT-M05-23-016", リストから("S-M05-23-AMOUNTS-016", "〔出荷指示リストID-M0523-016〕", ["〔注文番号-M0523-016〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(p?.お買上額 ?? "", "お買い上げ額に「12,345」").toContain("12,345");
  expect.soft(p?.送料 ?? "", "送料に「1,234」").toContain("1,234");
  expect.soft(p?.手数料 ?? "", "手数料に「56」").toContain("56");
  expect.soft(p?.ポイント使用 ?? "", "ポイント使用に桁区切りのない「1234 Points」").toBe("1234 Points");
  supplement(`配送方法名「International Express」は、開発環境の「${国際配送}」（海外向け）で読み替えた（配送方法のマスタは全員が使うので名前を書き換えない）`);
  expect.soft(p?.発送方法 ?? "", `発送方法に配送方法名（International Express＝${国際配送}）`).toBe(国際配送);
  expect.soft(p?.請求金額 ?? "", "請求金額に「12,401」").toContain("12,401");
}));
caseTest("IT-M05-23-017", リストから("S-M05-23-AMOUNTS-017", "〔出荷指示リストID-M0523-017〕", ["〔注文番号-M0523-017〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(pages[0]?.ポイント使用 ?? "（納品書が無い）", "値引き額0の受注のポイント使用").toBe("0 Points");
}));
caseTest("IT-M05-23-018", リストから("S-M05-23-SNAPSHOT-018", "〔出荷指示リストID-M0523-018〕", ["〔注文番号-M0523-018〕"], (pages) => {
  const names = 全部の明細(pages).map((r) => r.商品名);
  expect.soft(names.includes(rc("Ordered Product 523")), "商品情報に受注時の商品名「Ordered Product 523」が表示される").toBe(true);
  expect.soft(names.includes(rc("Renamed Product 523")), "商品情報に今の商品名「Renamed Product 523」が表示されない").toBe(false);
}));
caseTest("IT-M05-23-019", リストから("S-M05-23-BASE-019", "〔出荷指示リストID-M0523-019〕", ["〔注文番号-M0523-019〕"], async (pages, _ctx, popup) => {
  expect.soft(pages.length, "納品書が表示された").toBe(1);
  const msgs = await StandbySlipPage.窓のメッセージ(popup);
  note(`納品書の窓の画面メッセージの枠: ${msgs.join(" / ") || "なし"}`);
  expect.soft(msgs, "納品書印刷（英語）の画面に本機能固有の画面メッセージが表示されない").toEqual([]);
}));
caseTest("IT-M05-23-021", リストから("S-M05-23-CBDETAILS-021", "〔出荷指示リストID-M0523-021〕", ["〔注文番号-M0523-021〕"], (pages) => {
  const names = 全部の明細(pages).map((r) => r.商品名);
  expect.soft(pages.length, "英語の納品書が別の窓に出た").toBeGreaterThan(0);
  expect.soft(names, "すべてを持つ VALID-ITEM-021 の明細行だけが出る").toEqual([rc("VALID-ITEM-021")]);
  for (const n of ["NO-PRODUCT-021", "NO-PRODUCT-CLASS-021", "NO-PRODUCT-SUB-021", "NO-PRODUCT-CLASS-SUB-021"]) {
    expect.soft(names.includes(rc(n)), `「${n}」の明細行が出ない`).toBe(false);
  }
}));
caseTest("IT-M05-23-022", リストから("S-M05-23-CBDOMESTIC-022", "〔出荷指示リストID-M0523-022〕", ["〔注文番号-M0523-022A〕", "〔注文番号-M0523-022B〕"],
  だけが出る(["〔注文番号-M0523-022B〕"], ["〔注文番号-M0523-022A〕"])));
