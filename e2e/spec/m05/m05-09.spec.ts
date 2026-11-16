/**
 * M05-09 納品書印刷（日本語）。正本: cases/M05-09_test_cases.tsv
 * 実装したケースと実装しない理由は記録 review/M05-09_progress_2026-11-11_dev.md。
 * 受注情報検索 一覧(検索結果)か出荷指示リスト編集で受注を選び、「納品書印刷（日本語）」で開いた新しい窓の納品書（HTML の画面）を読んで確かめる。
 * 023 は共有の設定（本店の適格請求書発行事業者登録番号）をケースの開始時に書き換え、終わるたびに元の値へ戻して DB で確かめる。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin, withAdminSession } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 流す前の登録番号, 登録番号 } from "../../db/m05_09";
import { SlipOrderListPage, SlipStandbyPage, 納品書のページ, 納品書を読む, 窓の様子, 登録番号を設定する } from "../../pages/admin/m05_09_delivery_slips";
import { M0509_ADMIN, 作ったものの, 会員のメール } from "../../seeds/m05-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 注文番号の = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);
/** 注文番号ごとのページ */
const 受注のページ = (pages: 納品書のページ[], 注文番号: string) => pages.filter((p) => p.注文番号 === 注文番号);
const 全部の行 = (pages: 納品書のページ[]) => pages.flatMap((p) => p.明細);

/** 受注情報検索 一覧(検索結果)で受注を選んで納品書を開き、読む（手順1〜3） */
function 一覧から(seed: string, 番号: string, 呼び名: string[], check: (pages: 納品書のページ[], ctx: CaseCtx) => void | Promise<void>,
  opt: { 検索語?: string; 開始時?: (ctx: CaseCtx) => Promise<void>; 終了時?: (ctx: CaseCtx) => Promise<void> } = {}) {
  return async (ctx: CaseCtx): Promise<void> => {
    try { await 一覧から_本体(ctx); } finally { if (opt.終了時) await opt.終了時(ctx); }
  };
  async function 一覧から_本体(ctx: CaseCtx): Promise<void> {
    const { page, step, expected } = ctx;
    if (opt.開始時) await opt.開始時(ctx);
    await loginAdmin(page, M0509_ADMIN);
    const l = new SlipOrderListPage(page);
    let popup!: Page; let pages: 納品書のページ[] = [];
    const 検索語 = opt.検索語 ?? 会員のメール(番号);
    await step(1, async () => {
      await l.会員の受注を出す(検索語);
      note(`受注情報検索を、ケースの試験会員のメールアドレス（${検索語}）で絞り、全ての対応状況を選んで検索した（検索結果: ${(await l.結果の注文番号()).join("・")}）`);
    });
    await step(2, async () => { for (const n of 呼び名) await l.受注を選ぶ(注文番号の(ctx, n)); });
    await step(3, async () => { popup = await l.納品書印刷を押す(); pages = await 納品書を読む(popup); note(`納品書の注文番号（ページごと）: ${pages.map((p) => `${p.注文番号}(${p.ページ})`).join("・") || "なし"}`); });
    await expected(async () => {
      expect.soft(popup.url(), "納品書印刷（日本語）の窓が開いた").toMatch(/\/order\/print\/delivery_slips\/ja/);
      await check(pages, ctx);
    });
    void seed;
  }
}

/** 出荷指示リスト編集で受注を選んで納品書を開き、読む（手順1〜3） */
function リストから(seed: string, 呼び名: string[], check: (pages: 納品書のページ[], ctx: CaseCtx) => void | Promise<void>) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, step, expected } = ctx;
    await loginAdmin(page, M0509_ADMIN);
    const s = new SlipStandbyPage(page);
    const v = 作ったものの(seed);
    let pages: 納品書のページ[] = []; let url = "";
    await step(1, async () => { expect(await s.詳細を開く(v.出荷指示リストID), "出荷指示リスト編集画面の応答").toBeLessThan(400); });
    await step(2, async () => { await s.受注を選ぶ(呼び名.map((n) => v.受注ID[v.注文番号.indexOf(注文番号の(ctx, n))])); });
    await step(3, async () => { const popup = await s.納品書印刷を押す(); url = popup.url(); pages = await 納品書を読む(popup); note(`納品書の注文番号（ページごと）: ${pages.map((p) => `${p.注文番号}(${p.ページ})`).join("・") || "なし"}`); });
    await expected(async () => {
      expect.soft(url, "納品書印刷（日本語）の窓が開いた").toMatch(/\/standby\/\d+\/print\/delivery\/ja/);
      await check(pages, ctx);
    });
  };
}

/** 指定の受注の納品書だけが、受注ごとに1件ずつ、この順に出る */
const だけが出る = (呼び名: string[], 出ない: string[] = []) => (pages: 納品書のページ[], ctx: CaseCtx) => {
  const want = 呼び名.map((n) => 注文番号の(ctx, n));
  const 出た = [...new Set(pages.map((p) => p.注文番号))];
  expect.soft(出た, `納品書が出た注文番号（${呼び名.join("・")} の順に、受注ごとに1件ずつ）`).toEqual(want);
  for (const n of want) expect.soft(受注のページ(pages, n).length, `注文番号 ${n} の納品書のページ数（明細1件なので1ページ）`).toBe(1);
  for (const n of 出ない) expect.soft(出た.includes(注文番号の(ctx, n)), `注文番号 ${注文番号の(ctx, n)} の納品書は出ない`).toBe(false);
};

caseTest("IT-M05-09-002", リストから("S-M05-09-STANDBY-002", ["〔注文番号-M0509-002A〕", "〔注文番号-M0509-002B〕"], だけが出る(["〔注文番号-M0509-002A〕", "〔注文番号-M0509-002B〕"])));
caseTest("IT-M05-09-003", 一覧から("S-M05-09-CLASSIFICATION-003", "003", ["〔注文番号-M0509-003〕"], だけが出る(["〔注文番号-M0509-003〕"])));
caseTest("IT-M05-09-004", 一覧から("S-M05-09-CLASSIFICATION-004", "004", ["〔注文番号-M0509-004A〕", "〔注文番号-M0509-004B〕"], だけが出る(["〔注文番号-M0509-004A〕"], ["〔注文番号-M0509-004B〕"])));
caseTest("IT-M05-09-007", 一覧から("S-M05-09-CUSTOMERS-007", "007", ["〔注文番号-M0509-007〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBeGreaterThan(0);
  expect.soft(pages[0]?.送り主.find((s) => s.startsWith("会員番号")) ?? "（会員番号の行が無い）", "送り主の会員番号").toBe("会員番号 SMR-50907-007");
}));
caseTest("IT-M05-09-008", 一覧から("S-M05-09-CUSTOMERS-008", "008", ["〔注文番号-M0509-008A〕", "〔注文番号-M0509-008B〕"], だけが出る(["〔注文番号-M0509-008A〕"], ["〔注文番号-M0509-008B〕"]), {
  検索語: "m0509-008-",
  開始時: async () => { supplement("2人の試験会員（A・B）の受注を1つの検索結果に出すため、2人のメールアドレスに共通する先頭（m0509-008-）で検索した。前の実行の 008 の受注も検索結果に出ることがある（選ぶのはこの実行の2件だけ）"); },
}));
caseTest("IT-M05-09-010", リストから("S-M05-09-RELATIONS-010", ["〔注文番号-M0509-010A〕", "〔注文番号-M0509-010B〕"], だけが出る(["〔注文番号-M0509-010A〕"], ["〔注文番号-M0509-010B〕"])));

/** お届け先の郵便番号の行（〒から始まる行） */
const 郵便の行 = (lines: string[]) => lines.find((s) => s.startsWith("〒")) ?? "（〒の行が無い）";
caseTest("IT-M05-09-012", 一覧から("S-M05-09-NULL-ADDRESS-012", "012", ["〔注文番号-M0509-012〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(郵便の行(pages[0]?.お届け先 ?? []), "お届け先の郵便番号の行（後ろの都道府県が空欄）").toMatch(/^〒[\d-]+$/);
}));
caseTest("IT-M05-09-013", 一覧から("S-M05-09-NULL-ADDRESS-013", "013", ["〔注文番号-M0509-013〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const a = pages[0]?.お届け先 ?? [];
  expect.soft(a.some((s) => s === "Japan" || s === "日本"), "お届け先に国・地域が出ない（空欄）").toBe(false);
  expect.soft(郵便の行(a), "お届け先の郵便番号の行（都道府県は東京都のまま）").toMatch(/東京都$/);
}));
caseTest("IT-M05-09-016", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M0509_ADMIN);
  const s = new SlipStandbyPage(page);
  const v = 作ったものの("S-M05-09-STANDBY-016");
  let 様子!: Awaited<ReturnType<typeof 窓の様子>>;
  await step(1, async () => { expect(await s.詳細を開く(v.出荷指示リストID), "出荷指示リスト編集画面の応答").toBeLessThan(400); });
  await step(2, async () => { await s.受注を選ぶ([v.受注ID[0]]); });
  await step(3, async () => { await s.送り先の出荷指示リストIDを書き換える(v.出荷指示リストID, "999999"); note("開発者ツールの代わりに、送信の直前に送り先の出荷指示リストIDを 999999 へ書き換える処理を画面に足した"); });
  await step(4, async () => { const popup = await s.納品書印刷を押す(); 様子 = await 窓の様子(popup); note(`開いた窓: ${様子.URL}・題「${様子.題}」・本文「${様子.本文.slice(0, 120)}」`); });
  await expected(async () => {
    expect.soft(様子.URL, "送り先の出荷指示リストIDが 999999 に変わった").toMatch(/\/standby\/999999\/print\/delivery\/ja/);
    expect.soft(様子.納品書のページ数, "納品書（日本語）の画面が表示されない（納品書のページが無い）").toBe(0);
  });
});
caseTest("IT-M05-09-018", 一覧から("S-M05-09-ADDRESSES-018", "018", ["〔注文番号-M0509-018〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const a = p?.お届け先 ?? [], b = p?.送り主 ?? [];
  expect.soft(a.indexOf("United States") >= 0 && a.indexOf("United States") < a.findIndex((s) => s.includes("12345")), "お届け先の国「United States」が郵便番号「12345」の上").toBe(true);
  expect.soft(a.find((s) => s.includes("12345")) ?? "", "お届け先の郵便番号の後ろに都道府県が無い").toMatch(/^〒?\s*12345$/);
  expect.soft(b.indexOf("Canada") >= 0 && b.indexOf("Canada") < b.findIndex((s) => s.includes("A1B2C3")), "送り主の国「Canada」が郵便番号「A1B2C3」の上").toBe(true);
  expect.soft(b.find((s) => s.includes("A1B2C3")) ?? "", "送り主の郵便番号の後ろに都道府県が無い").toMatch(/^〒?\s*A1B2C3$/);  // 送り主の欄は「〒 A1B2C3」と空白を挟んで出る（2026-11-13）
}));
caseTest("IT-M05-09-019", 一覧から("S-M05-09-ADDRESSES-019", "019", ["〔注文番号-M0509-019〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const a = p?.お届け先 ?? [], b = p?.送り主 ?? [];
  expect.soft([...a, ...b].filter((s) => s === "Japan" || s === "日本"), "お届け先と送り主に国・地域名が出ない").toEqual([]);
  expect.soft(郵便の行(a), "お届け先の郵便番号の後ろに東京都").toMatch(/東京都$/);
  expect.soft(郵便の行(b), "送り主の郵便番号の後ろに大阪府").toMatch(/大阪府$/);
}));
caseTest("IT-M05-09-020", 一覧から("S-M05-09-SIGNATURE-020", "020", ["〔注文番号-M0509-020〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(pages[0]?.受取人署名 ?? false, "受取人署名の欄が表示される").toBe(true);
}));
caseTest("IT-M05-09-021", 一覧から("S-M05-09-SIGNATURE-021", "021", ["〔注文番号-M0509-021〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(pages[0]?.受取人署名 ?? true, "受取人署名の欄が表示されない").toBe(false);
}));
let 元の登録番号: string | null = null;
async function 登録番号を別の窓で設定する(ctx: CaseCtx, 値: string): Promise<void> {
  await withAdminSession(ctx.browser, M0509_ADMIN, async (p) => { p.setDefaultTimeout(60_000); await 登録番号を設定する(p, 値, note); });
}
caseTest("IT-M05-09-023", 一覧から("S-M05-09-COMPANY-023", "023", ["〔注文番号-M0509-023〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(pages[0]?.会社.find((s) => s.startsWith("登録番号")) ?? "（登録番号の行が無い）", "会社の適格請求書発行事業者登録番号").toBe("登録番号:T1234567890123");
}, {
  // 事前準備③: ケースの開始時に本店の登録番号を設定する（共有の設定）。終わるたびに元の値へ戻して DB で確かめる
  開始時: async (ctx) => {
    const 元 = 登録番号();
    // 流す前の値と違えば、前の回が戻し損ねた。その値を「元」と控えると狂った値へ戻すので、書き換えずに止める（2026-11-15）
    if (元 !== 流す前の登録番号) throw new Error(`本店の適格請求書発行事業者登録番号が流す前の値（${流す前の登録番号}）でなく「${元 || "空"}」。前の回が戻し損ねたので、書き換えずに止める`);
    元の登録番号 = 流す前の登録番号; // 書き換える前に控える（書き換えに入る前に止まっても、戻す値を取り違えない）
    await 登録番号を別の窓で設定する(ctx, "T1234567890123");
    note(`事前準備③: 本店の適格請求書発行事業者登録番号を、元の値（${元の登録番号 || "空"}）から T1234567890123 にした（終わったら戻す）`);
  },
  終了時: async (ctx) => {
    if (元の登録番号 === null) return; // 控える前に止まった（書き換えていない）
    const 元 = 流す前の登録番号; // 控えた値でなく、流す前の決まった値へ戻す
    if (登録番号() !== 元) await 登録番号を別の窓で設定する(ctx, 元);
    expect(登録番号(), "共有の設定（本店の適格請求書発行事業者登録番号）を元の値へ戻せた").toBe(元);
    元の登録番号 = null;
  },
}));
caseTest("IT-M05-09-024", 一覧から("S-M05-09-POINTS-024", "024", ["〔注文番号-M0509-024A〕", "〔注文番号-M0509-024B〕"], (pages, ctx) => {
  const a = 受注のページ(pages, 注文番号の(ctx, "〔注文番号-M0509-024A〕"))[0], b = 受注のページ(pages, 注文番号の(ctx, "〔注文番号-M0509-024B〕"))[0];
  expect.soft(a?.ポイント使用 ?? "（納品書が無い）", "値引き額250の受注のポイント使用").toBe("250ポイント");
  expect.soft(b?.ポイント使用 ?? "（納品書が無い）", "値引き額0の受注のポイント使用").toBe("0ポイント");
}));
caseTest("IT-M05-09-025", 一覧から("S-M05-09-PRODUCT-SNAPSHOT-025", "025", ["〔注文番号-M0509-025〕"], (pages) => {
  const names = 全部の行(pages).map((r) => r.商品名);
  expect.soft(names.includes(rc("受注時商品名")), "商品情報に受注時商品名が表示される").toBe(true);
  expect.soft(names.includes(rc("変更後商品名")), "商品情報に変更後商品名が表示されない").toBe(false);
}));
caseTest("IT-M05-09-026", 一覧から("S-M05-09-PAGE30-026", "026", ["〔注文番号-M0509-026〕"], (pages) => {
  expect.soft(pages.length, "1ページで出る").toBe(1);
  expect.soft(pages[0]?.明細.length ?? 0, "1ページの明細の数（30）").toBe(30);
  expect.soft(pages[0]?.ページ ?? "", "ページ数").toBe("1/1");
  expect.soft(pages[0]?.合計の数量 ?? "", "ページ最終行の商品数").toBe("30/30");
}));
caseTest("IT-M05-09-027", 一覧から("S-M05-09-PAGE31-027", "027", ["〔注文番号-M0509-027〕"], (pages) => {
  expect.soft(pages.length, "2ページに分かれる").toBe(2);
  expect.soft(pages.map((p) => p.明細.length), "ページごとの明細の数（30・1）").toEqual([30, 1]);
  expect.soft(pages.map((p) => p.ページ), "ページ数").toEqual(["1/2", "2/2"]);
  expect.soft(pages.map((p) => p.合計の数量), "各ページ最終行の商品数").toEqual(["30/31", "31/31"]);
}));
caseTest("IT-M05-09-028", 一覧から("S-M05-09-TAX-028", "028", ["〔注文番号-M0509-028〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const t = pages[0]?.請求金額 ?? "";
  expect.soft(t, "請求金額（税込金額1100と内税額100）").toMatch(/1,100\s*\(内税:\s*[^\d]*100\)/);
}));
const 送り先の値 = { 住所1: "渋谷区道玄坂1-2-3", 住所2: "ビル5F", 電話: "TEL：0312345678", 氏名: "山田 太郎" };
const 注文者の値 = { 住所1: "大阪市北区梅田4-5-6", 住所2: "タワー9F", 電話: "0698765432", 氏名: "佐藤 花子" };
caseTest("IT-M05-09-041", 一覧から("S-M05-09-ADDR-SHIPTO-041", "041", ["〔注文番号-M0509-041〕"], (pages) => {
  const a = (pages[0]?.お届け先 ?? []).join(" / ");
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(a, "お届け先の住所1").toContain(送り先の値.住所1);
  expect.soft(a, "お届け先の住所2").toContain("M0509-041-ビル5F");
  expect.soft(a, "お届け先の電話番号（03・1234・5678）").toContain(送り先の値.電話);
  expect.soft(a, "お届け先の姓・名").toContain(送り先の値.氏名);
  for (const [k, v] of Object.entries(注文者の値)) expect.soft(a.includes(v), `注文者の${k}がお届け先に出ない`).toBe(false);
}));
caseTest("IT-M05-09-042", 一覧から("S-M05-09-ADDR-SENDER-042", "042", ["〔注文番号-M0509-042〕"], (pages) => {
  const b = (pages[0]?.送り主 ?? []).join(" / ");
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(b, "送り主の住所1").toContain(注文者の値.住所1);
  expect.soft(b, "送り主の住所2").toContain("M0509-042-タワー9F");
  expect.soft(b, "送り主の電話番号（06・9876・5432）").toContain(注文者の値.電話);
  expect.soft(b, "送り主の姓・名").toContain(注文者の値.氏名);
  for (const [k, v] of Object.entries(送り先の値)) expect.soft(b.includes(v.replace("TEL：", "")), `配送先の${k}が送り主に出ない`).toBe(false);
}));
caseTest("IT-M05-09-046", 一覧から("S-M05-09-CBBASE-046", "046", ["〔注文番号-M0509-CB046〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(全部の行(pages).map((r) => r.商品名), "商品情報の行").toContain(rc("M0509-CB046-P1"));
}));
caseTest("IT-M05-09-047", 一覧から("S-M05-09-CBLINE-047", "047", ["〔注文番号-M0509-CB047〕"], (pages) => {
  const names = 全部の行(pages).map((r) => r.商品名);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(names.includes(rc("M0509-CB047-OK")), "商品を持つ明細の行が表示される").toBe(true);
  expect.soft(names.includes(rc("M0509-CB047-NG")), "商品規格を持たない明細の行が表示されない").toBe(false);
}));

/** 並び順のケース: 商品情報の行（商品名＝印つきの商品コード）が、この順に並ぶ。試験用カードは印つきで作って紐づけた（シードの注記・2026-11-14 依頼者決定「マスタは作ってよい」） */
function 行の位置(pages: 納品書のページ[], コード: string[]): number[] {
  const names = 全部の行(pages).map((r) => r.商品名);
  note(`納品書の商品情報の行: ${names.join("・")}`);
  supplement("試験用のカードは印つきでカード詳細(登録)画面から作り、商品登録編集の「カード指定」で紐づけた。商品カテゴリの付け替えはしていない（並びはカード詳細で決まる。実ソース SortProductTrait）");
  return コード.map((c) => names.findIndex((n) => n.includes(rc(c))));
}
caseTest("IT-M05-09-030", 一覧から("S-M05-09-SORT-CARD-030", "030", ["〔注文番号-M0509-030〕"], (pages) => {
  const 位置 = 行の位置(pages, ["M0509-030-CARD", "M0509-030-GOODS"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-030-CARD・M0509-030-GOODS がある").toBe(true);
  expect.soft(位置, "商品情報の行がカードの商品が先（M0509-030-CARD→M0509-030-GOODS）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-035", 一覧から("S-M05-09-SORT-FOIL-035", "035", ["〔注文番号-M0509-035〕"], (pages) => {
  const 位置 = 行の位置(pages, ["M0509-035-PLAIN", "M0509-035-FOIL"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-035-PLAIN・M0509-035-FOIL がある").toBe(true);
  expect.soft(位置, "商品情報の行が非Foil が先（M0509-035-PLAIN→M0509-035-FOIL）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-037", 一覧から("S-M05-09-SORT-RARITY-037", "037", ["〔注文番号-M0509-037〕"], (pages) => {
  const 位置 = 行の位置(pages, ["M0509-037-M", "M0509-037-C"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-037-M・M0509-037-C がある").toBe(true);
  expect.soft(位置, "商品情報の行がレアリティ M が先（M0509-037-M→M0509-037-C）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-039", 一覧から("S-M05-09-SORT-COLLNO-039", "039", ["〔注文番号-M0509-039〕"], (pages) => {
  const 位置 = 行の位置(pages, ["M0509-039-N02", "M0509-039-N10"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-039-N02・M0509-039-N10 がある").toBe(true);
  expect.soft(位置, "商品情報の行がコレクター番号 002 が先（M0509-039-N02→M0509-039-N10）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-053", 一覧から("S-M05-09-CBSORTCARD-053", "053", ["〔注文番号-M0509-CB053〕"], (pages) => {
  const 位置 = 行の位置(pages, ["M0509-CB053-CARD", "M0509-CB053-GOODS"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-CB053-CARD・M0509-CB053-GOODS がある").toBe(true);
  expect.soft(位置, "商品情報の行がカードの商品が先（M0509-CB053-CARD→M0509-CB053-GOODS）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-055", 一覧から("S-M05-09-CBSORTFOIL-055", "055", ["〔注文番号-M0509-CB055〕"], (pages) => {
  const 位置 = 行の位置(pages, ["M0509-CB055-PLAIN", "M0509-CB055-FOIL"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-CB055-PLAIN・M0509-CB055-FOIL がある").toBe(true);
  expect.soft(位置, "商品情報の行が非Foil が先（M0509-CB055-PLAIN→M0509-CB055-FOIL）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-057", 一覧から("S-M05-09-CBSORTRARITY-057", "057", ["〔注文番号-M0509-CB057〕"], (pages) => {
  const 位置 = 行の位置(pages, ["M0509-CB057-M", "M0509-CB057-C"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-CB057-M・M0509-CB057-C がある").toBe(true);
  expect.soft(位置, "商品情報の行がレアリティ M が先（M0509-CB057-M→M0509-CB057-C）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-059", 一覧から("S-M05-09-CBSORTCOLLNO-059", "059", ["〔注文番号-M0509-CB059〕"], (pages) => {
  const 位置 = 行の位置(pages, ["M0509-CB059-N02", "M0509-CB059-N10"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-CB059-N02・M0509-CB059-N10 がある").toBe(true);
  expect.soft(位置, "商品情報の行がコレクター番号 002 が先（M0509-CB059-N02→M0509-CB059-N10）の順").toEqual([...位置].sort((a, b) => a - b));
}));

// ---- 2026-11-16 追加（棚番号・言語・状態・略称タグ・色順・英語カード名・明細の価格と数量。依頼者決定 2026-11-14「マスタは作ってよい」） ----
const 色の補い = "色マスターの順序（色M…-WHITE＝順序1・色M…-BLUE＝順序2）は、全員が使う色順のマスタを書き換えないため、開発環境に元からある色順「白」（並び順2）と「青」（並び順3）で読み替えた（白が青より前に並ぶ関係は正本と同じ）";
const 状態の補い = "状態 HP の規格は、取り込みでできた NM の規格の状態を DB で HP に書き換えて作った（シード表は HP の規格を足して NM の規格を削除する。並びは規格の状態で決まり、規格の数は見ない）";
const 略称の補い = "略称タグは印つきで登録し、商品へはグッズ商品CSVの略称タグ(ID)で付けた";
const 英名の補い = "略称タグは印つきで登録し（アルファベット順）、英語カード名は印つきで登録した（印は両方の名前の末尾に同じものが付くので、名前の順は変わらない）";
caseTest("IT-M05-09-031", 一覧から("S-M05-09-SORT-SHELF-HQ-031", "031", ["〔注文番号-M0509-031〕"], (pages) => {
  supplement("棚番号は印つきで登録し、名前は入力チェックを通らないので DB で正本の名前（印つき）に書き換えた");
  const 位置 = 行の位置(pages, ["M0509-031-EN", "M0509-031-JP"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-031-EN・M0509-031-JP がある").toBe(true);
  expect.soft(位置, "商品情報の行が棚番の並び順が小さい方が先（本店）（M0509-031-EN→M0509-031-JP）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-033", 一覧から("S-M05-09-SORT-LANG-033", "033", ["〔注文番号-M0509-033〕"], (pages) => {
  const 位置 = 行の位置(pages, ["M0509-033-JP", "M0509-033-EN", "M0509-033-KR"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-033-JP・M0509-033-EN・M0509-033-KR がある").toBe(true);
  expect.soft(位置, "商品情報の行が言語が日本語→英語→それ以外（M0509-033-JP→M0509-033-EN→M0509-033-KR）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-034", 一覧から("S-M05-09-SORT-COND-034", "034", ["〔注文番号-M0509-034〕"], (pages) => {
  supplement(状態の補い);
  const 位置 = 行の位置(pages, ["M0509-034-NM", "M0509-034-HP"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-034-NM・M0509-034-HP がある").toBe(true);
  expect.soft(位置, "商品情報の行が状態 NM が先（M0509-034-NM→M0509-034-HP）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-036", 一覧から("S-M05-09-SORT-ABBR-036", "036", ["〔注文番号-M0509-036〕"], (pages) => {
  supplement(略称の補い);
  const 位置 = 行の位置(pages, ["M0509-036-A", "M0509-036-B"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-036-A・M0509-036-B がある").toBe(true);
  expect.soft(位置, "商品情報の行が略称タグの並び順が小さい方が先（M0509-036-A→M0509-036-B）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-038", 一覧から("S-M05-09-SORT-COLOR-038", "038", ["〔注文番号-M0509-038〕"], (pages) => {
  supplement(色の補い);
  const 位置 = 行の位置(pages, ["M0509-038-W", "M0509-038-B"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-038-W・M0509-038-B がある").toBe(true);
  expect.soft(位置, "商品情報の行が色の順序が小さい方が先（M0509-038-W→M0509-038-B）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-040", 一覧から("S-M05-09-SORT-ALPHA-040", "040", ["〔注文番号-M0509-040〕"], (pages) => {
  supplement(英名の補い);
  const 位置 = 行の位置(pages, ["M0509-040-ALPHA", "M0509-040-ZULU"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-040-ALPHA・M0509-040-ZULU がある").toBe(true);
  expect.soft(位置, "商品情報の行がアルファベット順の略称タグで英語カード名の順（M0509-040-ALPHA→M0509-040-ZULU）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-054", 一覧から("S-M05-09-CBSORTCOND-054", "054", ["〔注文番号-M0509-CB054〕"], (pages) => {
  supplement(状態の補い);
  const 位置 = 行の位置(pages, ["M0509-CB054-NM", "M0509-CB054-HP"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-CB054-NM・M0509-CB054-HP がある").toBe(true);
  expect.soft(位置, "商品情報の行が状態 NM が先（M0509-CB054-NM→M0509-CB054-HP）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-056", 一覧から("S-M05-09-CBSORTABBR-056", "056", ["〔注文番号-M0509-CB056〕"], (pages) => {
  supplement(略称の補い);
  const 位置 = 行の位置(pages, ["M0509-CB056-A", "M0509-CB056-B"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-CB056-A・M0509-CB056-B がある").toBe(true);
  expect.soft(位置, "商品情報の行が略称タグの並び順が小さい方が先（M0509-CB056-A→M0509-CB056-B）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-058", 一覧から("S-M05-09-CBSORTCOLOR-058", "058", ["〔注文番号-M0509-CB058〕"], (pages) => {
  supplement(色の補い);
  const 位置 = 行の位置(pages, ["M0509-CB058-W", "M0509-CB058-B"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-CB058-W・M0509-CB058-B がある").toBe(true);
  expect.soft(位置, "商品情報の行が色の順序が小さい方が先（M0509-CB058-W→M0509-CB058-B）の順").toEqual([...位置].sort((a, b) => a - b));
}));
caseTest("IT-M05-09-060", 一覧から("S-M05-09-CBSORTALPHA-060", "060", ["〔注文番号-M0509-CB060〕"], (pages) => {
  supplement(英名の補い);
  const 位置 = 行の位置(pages, ["M0509-CB060-ALPHA", "M0509-CB060-ZULU"]);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(位置.every((i) => i >= 0), "商品情報の行に M0509-CB060-ALPHA・M0509-CB060-ZULU がある").toBe(true);
  expect.soft(位置, "商品情報の行がアルファベット順の略称タグで英語カード名の順（M0509-CB060-ALPHA→M0509-CB060-ZULU）の順").toEqual([...位置].sort((a, b) => a - b));
}));

/** 明細行の値（商品名に印つきの商品コードを含む行） */
function 明細の行(pages: 納品書のページ[], コード: string) {
  return 全部の行(pages).find((r) => r.商品名.includes(rc(コード)));
}
const 数 = (v: string | undefined): number => Number((v ?? "").replace(/[^0-9.-]/g, ""));
caseTest("IT-M05-09-043", 一覧から("S-M05-09-LINE-PRICE-043", "043", ["〔注文番号-M0509-043〕"], (pages) => {
  const a = 明細の行(pages, "M0509-043-A"), b = 明細の行(pages, "M0509-043-B");
  note(`明細: A ${JSON.stringify(a)}・B ${JSON.stringify(b)}`);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(数(a?.価格), "商品M0509-043-Aの明細行の価格が取得元の1500と同じ").toBe(1500);
  expect.soft(数(b?.価格), "商品M0509-043-Bの明細行の価格が取得元の2800と同じ").toBe(2800);
}));
caseTest("IT-M05-09-044", 一覧から("S-M05-09-LINE-QTY-044", "044", ["〔注文番号-M0509-044〕"], (pages) => {
  const a = 明細の行(pages, "M0509-044-A"), b = 明細の行(pages, "M0509-044-B");
  note(`明細: A ${JSON.stringify(a)}・B ${JSON.stringify(b)}`);
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft((a?.数量 ?? "").trim(), "商品M0509-044-Aの明細行の数量").toBe("3");
  expect.soft((b?.数量 ?? "").trim(), "商品M0509-044-Bの明細行の数量").toBe("2");
}));
