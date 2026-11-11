/**
 * M05-10 納品書印刷（英語）。正本: cases/M05-10_test_cases.tsv
 * 実装したケースと実装しない理由は記録 review/M05-10_progress_2026-11-11_dev.md。
 * 受注情報検索 一覧(検索結果)で受注を選び、「納品書印刷（英語）」で開いた新しい窓の英語の納品書（HTML の画面）を読んで確かめる。
 * 事前準備の「受注情報検索で受注日を指定し、受注が各1件表示され、チェックボックスが未選択」は、M05-09 と同じく、ケースの試験会員の
 * メールアドレスに共通する先頭で検索して読み替える（受注日は DB で書き足した日。正本の外の補い）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { SlipEnOrderListPage, 英語の納品書のページ, 英語の納品書を読む, 金額 } from "../../pages/admin/m05_10_delivery_slips_en";
import { M0510_ADMIN, 作ったものの, 会員の検索語, 国外の配送方法 } from "../../seeds/m05-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 注文番号の = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);
const 受注のページ = (pages: 英語の納品書のページ[], 注文番号: string) => pages.filter((p) => p.注文番号 === 注文番号);
const 全部の行 = (pages: 英語の納品書のページ[]) => pages.flatMap((p) => p.明細);

type 確かめ = (pages: 英語の納品書のページ[], ctx: CaseCtx) => void | Promise<void>;

/** 受注情報検索 一覧(検索結果)で受注を選び、英語の納品書を開いて読む（手順1〜3。005 は手順3で隠し入力を足し、手順4で押す） */
function 一覧から(番号: string, 呼び名: string[], check: 確かめ, opt: { 隠し入力?: { seed: string } } = {}) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected } = ctx;
    await loginAdmin(page, M0510_ADMIN);
    const l = new SlipEnOrderListPage(page);
    let popup!: Page; let pages: 英語の納品書のページ[] = [];
    const 検索語 = 会員の検索語(番号);
    await step(1, async () => {
      await l.会員の受注を出す(検索語);
      supplement(`事前準備の受注日での検索は、ケースの試験会員のメールアドレスに共通する先頭（${検索語}）で、全ての対応状況を選んで検索して読み替えた。前の実行の受注も検索結果に出ることがある（選ぶのはこの実行の受注だけ）`);
      note(`検索結果の注文番号: ${(await l.結果の注文番号()).join("・")}`);
    });
    await step(2, async () => { for (const n of 呼び名) await l.受注を選ぶ(注文番号の(ctx, n)); });
    const 押す = async () => {
      popup = await l.英語の納品書印刷を押す();
      pages = await 英語の納品書を読む(popup);
      note(`納品書の注文番号（ページごと）: ${pages.map((p) => `${p.注文番号}(${p.ページ})`).join("・") || "なし"}`);
    };
    if (opt.隠し入力) {
      const v = 作ったものの(opt.隠し入力.seed);
      await step(3, async () => {
        const r = await l.同じ値の隠し入力を足す(v.配送先ID[0][0]);
        note(`開発者ツールの代わりに、選んだチェックボックスと同じ名前・同じ値（配送先ID ${r.値}）の隠し入力を、送信するフォームに1個足した（同じ名前と値の入力: ${r.同じ名前と値の数}個）`);
        expect(r.同じ名前と値の数, "同じ名前と値の入力が2個（チェックボックスと足した隠し入力）").toBe(2);
      });
      await step(4, async () => { await 押す(); });
    } else {
      await step(3, async () => { await 押す(); });
    }
    await expected(async () => {
      expect.soft(popup.url(), "納品書印刷（英語）の窓が開いた").toMatch(/\/order\/print\/delivery_slips\/en/);
      await check(pages, ctx);
    });
  };
}

/** 指定の受注の納品書だけが、受注ごとに1件ずつ、この順に出る */
const だけが出る = (呼び名: string[], 出ない: string[] = []): 確かめ => (pages, ctx) => {
  const want = 呼び名.map((n) => 注文番号の(ctx, n));
  const 出た = [...new Set(pages.map((p) => p.注文番号))];
  expect.soft(出た, `納品書が出た注文番号（${呼び名.join("・")} の順に、受注ごとに1件ずつ）`).toEqual(want);
  for (const n of want) expect.soft(受注のページ(pages, n).length, `注文番号 ${n} の納品書のページ数（明細1件なので1ページ）`).toBe(1);
  for (const n of 出ない) expect.soft(出た.includes(注文番号の(ctx, n)), `注文番号 ${注文番号の(ctx, n)} の納品書は出ない`).toBe(false);
};

caseTest("IT-M05-10-002", 一覧から("002", ["〔注文番号-M0510-002A〕", "〔注文番号-M0510-002B〕"], だけが出る(["〔注文番号-M0510-002A〕"], ["〔注文番号-M0510-002B〕"])));

caseTest("IT-M05-10-005", 一覧から("005", ["〔注文番号-M0510-005〕"], (pages, ctx) => {
  const n = 注文番号の(ctx, "〔注文番号-M0510-005〕");
  expect.soft(pages.map((p) => p.注文番号), "納品書が1部だけ（注文番号の納品書のページが1つ）").toEqual([n]);
}, { 隠し入力: { seed: "S-M05-10-DUPLICATE-005" } }));

caseTest("IT-M05-10-006", 一覧から("006", ["〔注文番号-M0510-006A〕", "〔注文番号-M0510-006B〕", "〔注文番号-M0510-006C〕", "〔注文番号-M0510-006D〕"],
  だけが出る(["〔注文番号-M0510-006A〕"], ["〔注文番号-M0510-006B〕", "〔注文番号-M0510-006C〕", "〔注文番号-M0510-006D〕"])));

/** お届け先・送り主の郵便番号の行（Postal Code から始まる行） */
const 郵便の行 = (lines: string[]) => lines.find((s) => s.startsWith("Postal Code")) ?? "（Postal Code の行が無い）";
caseTest("IT-M05-10-009", 一覧から("009", ["〔注文番号-M0510-009〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const a = pages[0]?.お届け先 ?? [];
  expect.soft(郵便の行(a), "お届け先の郵便番号の後ろの国が空（郵便番号 10009 だけ）").toBe("Postal Code10009");
  expect.soft(a.some((s) => s.includes("United States")), "お届け先に国の名前が出ない").toBe(false);
}));

const 会社の値 = ["Hareruya Inc.", "ZIP/PC:169-0075", "OC building 3-12-2", "Takadanobaba,Shinjuku,Tokyo", "TEL:+81-3-5332-7517", "www.hareruyamtg.com/en/", "E-Mail:info@hareruyamtg.com"];
caseTest("IT-M05-10-010", 一覧から("010", ["〔注文番号-M0510-010A〕", "〔注文番号-M0510-010B〕"], (pages, ctx) => {
  const a = 受注のページ(pages, 注文番号の(ctx, "〔注文番号-M0510-010A〕"))[0], b = 受注のページ(pages, 注文番号の(ctx, "〔注文番号-M0510-010B〕"))[0];
  const 行 = (p: 英語の納品書のページ | undefined, k: "お届け先" | "送り主") => (p?.[k] ?? []).join(" / ");
  expect.soft(行(a, "お届け先"), "1件目のお届け先の国（US）").toContain("United States");
  for (const x of ["Shipping-A1", "Shipping-A2", "Shipping-A3"]) expect.soft(行(a, "お届け先"), `1件目のお届け先の ${x}`).toContain(x);
  expect.soft(行(a, "送り主"), "1件目の送り主の国（CA）").toContain("Canada");
  for (const x of ["Sender-A1", "Sender-A2", "Sender-A3"]) expect.soft(行(a, "送り主"), `1件目の送り主の ${x}`).toContain(x);
  expect.soft(行(b, "お届け先"), "2件目のお届け先の国（GB）").toContain("United Kingdom");
  for (const x of ["Shipping-B1", "Shipping-B2", "Shipping-B3"]) expect.soft(行(b, "お届け先"), `2件目のお届け先の ${x}`).toContain(x);
  expect.soft(行(b, "送り主"), "2件目の送り主の国（AU）").toContain("Australia");
  for (const x of ["Sender-B1", "Sender-B2", "Sender-B3"]) expect.soft(行(b, "送り主"), `2件目の送り主の ${x}`).toContain(x);
  expect.soft(a?.会社 ?? ["（1件目の納品書が無い）"], "会社の各欄が2受注で同じ").toEqual(b?.会社 ?? ["（2件目の納品書が無い）"]);
  expect.soft(a?.会社 ?? [], "会社の各欄（固定の会社情報）").toEqual(会社の値);
}));

caseTest("IT-M05-10-015", 一覧から("015", ["〔注文番号-M0510-015〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(金額(p?.お買上額 ?? ""), `お買い上げ額（表示: ${p?.お買上額}）`).toBe(123456);
  expect.soft(金額(p?.送料 ?? ""), `送料（表示: ${p?.送料}）`).toBe(1200);
  expect.soft(金額(p?.手数料 ?? ""), `手数料（表示: ${p?.手数料}）`).toBe(300);
  supplement(`発送方法の「Global Express」は、国外配送区分の配送方法を新しく登録せず開発環境の「${国外の配送方法}」で読み替えたので、「${国外の配送方法}」と比べた`);
  expect.soft(p?.発送方法 ?? "", "発送方法（国外配送区分の配送方法の名前）").toBe(国外の配送方法);
  expect.soft(金額(p?.請求金額 ?? ""), `請求金額（受注合計。表示: ${p?.請求金額}）`).toBe(123722);
  expect.soft(/税|tax|11,?247/i.test(p?.請求金額 ?? ""), "請求金額に消費税額が併記されない").toBe(false);
}));
caseTest("IT-M05-10-016", 一覧から("016", ["〔注文番号-M0510-016〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const v = pages[0]?.ポイント使用 ?? "";
  expect.soft(v, "ポイント使用の数値が値引き額 1234（「¥」・桁区切りなし）").toMatch(/^1234\s*Points$/);
  expect.soft(/99/.test(v), "ポイント数 99 は出ない").toBe(false);
}));
caseTest("IT-M05-10-017", 一覧から("017", ["〔注文番号-M0510-017〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(pages[0]?.ポイント使用 ?? "", "値引き額0のポイント使用の数値「0」").toMatch(/^0\s*Points$/);
}));
caseTest("IT-M05-10-020", 一覧から("020", ["〔注文番号-M0510-020〕"], (pages) => {
  const names = 全部の行(pages).map((r) => r.商品名);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(names.includes(rc("注文時商品A")), "商品情報に受注時の商品名「注文時商品A」が表示される").toBe(true);
  expect.soft(names.includes(rc("変更後商品A")), "商品情報に現在の商品名「変更後商品A」が表示されない").toBe(false);
}));
caseTest("IT-M05-10-022", 一覧から("022", ["〔注文番号-M0510-022〕"], (pages) => {
  expect.soft(pages.length, "1ページで出る").toBe(1);
  expect.soft(pages[0]?.明細.length ?? 0, "1ページの明細の数（30）").toBe(30);
  expect.soft(pages[0]?.ページ ?? "", "ページ数").toBe("1/1");
  expect.soft(pages[0]?.合計の数量 ?? "", "ページ最終行の合計欄の商品数").toBe("30/30");
}));
caseTest("IT-M05-10-023", 一覧から("023", ["〔注文番号-M0510-023〕"], (pages, ctx) => {
  expect.soft(pages.length, "2ページに分かれる").toBe(2);
  expect.soft(pages.map((p) => p.明細.length), "ページごとの明細の数（30・1）").toEqual([30, 1]);
  expect.soft(pages.map((p) => p.ページ), "ページ数").toEqual(["1/2", "2/2"]);
  expect.soft(pages.map((p) => p.合計の数量), "各ページ最終行の合計欄の商品数").toEqual(["30/31", "31/31"]);
  const p2 = pages[1];
  expect.soft(p2?.見出し ?? "", "2ページ目の見出し").toBe("Delivery Slip");
  expect.soft(p2?.注文番号 ?? "", "2ページ目の注文番号").toBe(注文番号の(ctx, "〔注文番号-M0510-023〕"));
  expect.soft((p2?.お届け先 ?? []).length, "2ページ目のお届け先の欄").toBeGreaterThan(1);
  expect.soft((p2?.送り主 ?? []).length, "2ページ目の送り主の欄").toBeGreaterThan(1);
  expect.soft(p2?.会社 ?? [], "2ページ目の自社情報の欄").toEqual(会社の値);
  expect.soft([p2?.お買上額, p2?.送料, p2?.手数料, p2?.ポイント使用, p2?.発送方法, p2?.請求金額].every((x) => !!x), "2ページ目の金額の各欄").toBe(true);
}));
caseTest("IT-M05-10-035", 一覧から("035", ["〔注文番号-M0510-CB035A〕", "〔注文番号-M0510-CB035B〕"], だけが出る(["〔注文番号-M0510-CB035A〕"], ["〔注文番号-M0510-CB035B〕"])));
