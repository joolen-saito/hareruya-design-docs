/**
 * M05-22 出荷指示：納品書印刷（日本語）。正本: cases/M05-22_test_cases.tsv
 * 実装したケースと解釈は記録 review/M05-22_progress_2026-11-11_dev.md。
 * 出荷指示リスト編集で受注を選び、「納品書印刷（日本語）」で開いた新しい窓の納品書（HTML の画面）を読んで確かめる（M05-09 の部品）。
 * 015・019 は共有の設定（本店の適格請求書発行事業者登録番号）をケースの開始時に書き換え、終わるたびに元の値へ戻して DB で確かめる（1本だけで流す）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin, withAdminSession } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 登録番号 } from "../../db/m05_09";
import { 納品書のページ, 納品書を読む, 窓の様子, 登録番号を設定する } from "../../pages/admin/m05_09_delivery_slips";
import { StandbySlipPage } from "../../pages/admin/m05_22_standby_slips";
import { M0522_ADMIN, 作ったものの, 宅配便 } from "../../seeds/m05-22";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 番号の = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);
const 受注のページ = (pages: 納品書のページ[], 注文番号: string) => pages.filter((p) => p.注文番号 === 注文番号);
const 全部の行 = (pages: 納品書のページ[]) => pages.flatMap((p) => p.明細);
const 郵便の行 = (lines: string[]) => lines.find((s) => s.startsWith("〒")) ?? "（〒の行が無い）";
const 数字 = (s: string) => s.replace(/[^\d-]/g, "");

/** 開いた窓が納品書の画面なら読む（納品書の画面でなければ空） */
async function 読む(popup: Page): Promise<納品書のページ[]> {
  if ((await popup.locator(".ContentsAll").count()) === 0) return [];
  return 納品書を読む(popup);
}

type 確かめ = (pages: 納品書のページ[], ctx: CaseCtx, popup: Page) => void | Promise<void>;
type 前後 = { 開始時?: (ctx: CaseCtx) => Promise<void>; 終了時?: (ctx: CaseCtx) => Promise<void> };

/** 出荷指示リスト編集を開き、受注を選んで納品書を開き、読む（手順1〜3） */
function リストから(seed: string, リスト: string, 呼び名: string[], check: 確かめ, opt: 前後 = {}) {
  return async (ctx: CaseCtx): Promise<void> => {
    try { await 本体(ctx); } finally { if (opt.終了時) await opt.終了時(ctx); }
  };
  async function 本体(ctx: CaseCtx): Promise<void> {
    const { page, step, expected } = ctx;
    if (opt.開始時) await opt.開始時(ctx);
    await loginAdmin(page, M0522_ADMIN);
    const s = new StandbySlipPage(page);
    const v = 作ったものの(seed);
    let pages: 納品書のページ[] = []; let popup!: Page;
    await step(1, async () => { expect(await s.詳細を開く(番号の(ctx, リスト)), "出荷指示リスト編集画面の応答").toBeLessThan(400); });
    await step(2, async () => { await s.受注を選ぶ(呼び名.map((n) => v.受注ID[v.注文番号.indexOf(番号の(ctx, n))])); });
    await step(3, async () => {
      popup = await s.納品書印刷を押す(); pages = await 読む(popup);
      note(`開いた窓: ${popup.url()}・納品書の注文番号（ページごと）: ${pages.map((p) => `${p.注文番号}(${p.ページ})`).join("・") || "なし"}`);
    });
    await expected(async () => {
      expect.soft(popup.url(), "納品書印刷（日本語）の窓が開いた").toMatch(/\/standby\/\d+\/print\/delivery\/ja/);
      await check(pages, ctx, popup);
    });
  }
}

/** 指定の受注の納品書だけが、受注ごとに続けて出る（出ない受注も確かめる） */
const だけが出る = (呼び名: string[], 出ない: string[] = []) => (pages: 納品書のページ[], ctx: CaseCtx) => {
  const want = 呼び名.map((n) => 番号の(ctx, n));
  const 出た = [...new Set(pages.map((p) => p.注文番号))];
  expect.soft(出た, `納品書が出た注文番号（${呼び名.join("・")} の順に、受注ごとに続けて）`).toEqual(want);
  for (const n of want) expect.soft(受注のページ(pages, n).length, `注文番号 ${n} の納品書のページ数（明細1件なので1ページ）`).toBe(1);
  for (const n of 出ない) expect.soft(出た.includes(番号の(ctx, n)), `注文番号 ${番号の(ctx, n)} の納品書は出ない`).toBe(false);
};

caseTest("IT-M05-22-001", リストから("S-M05-22-BASE-001", "〔出荷指示リストID-M0522-001〕", ["〔注文番号-M0522-001A〕", "〔注文番号-M0522-001B〕"],
  だけが出る(["〔注文番号-M0522-001A〕", "〔注文番号-M0522-001B〕"])));

caseTest("IT-M05-22-002", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M0522_ADMIN);
  const s = new StandbySlipPage(page);
  const v = 作ったものの("S-M05-22-BASE-002");
  const リスト = 番号の(ctx, "〔出荷指示リストID-M0522-002〕");
  let 様子!: Awaited<ReturnType<typeof 窓の様子>>;
  await step(1, async () => { expect(await s.詳細を開く(リスト), "出荷指示リスト編集画面の応答").toBeLessThan(400); });
  await step(2, async () => { await s.受注を選ぶ([v.受注ID[0]]); });
  await step(3, async () => { await s.送り先を書き換える(リスト, "999999"); note("開発者ツールの代わりに、送信の直前に送り先の出荷指示リストIDを 999999 へ書き換える処理を画面に足した"); });
  await step(4, async () => { const popup = await s.納品書印刷を押す(); 様子 = await 窓の様子(popup); note(`開いた窓: ${様子.URL}・題「${様子.題}」・本文「${様子.本文.slice(0, 120)}」`); });
  await expected(async () => {
    expect.soft(様子.URL, "送り先の出荷指示リストIDが 999999 に変わった").toMatch(/\/standby\/999999\/print\/delivery\/ja/);
    expect.soft(様子.納品書のページ数, "納品書が1件も表示されない").toBe(0);
  });
});

caseTest("IT-M05-22-003", リストから("S-M05-22-CUSTOMERS-003", "〔出荷指示リストID-M0522-003〕", ["〔注文番号-M0522-003〕"], (pages, ctx) => {
  const p = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0522-003〕"))[0];
  expect.soft(p ? "出た" : "出ない", "ゲスト受注の納品書").toBe("出た");
  expect.soft(p?.送り主.find((s) => s.startsWith("会員番号")) ?? "（会員番号の行が無い）", "送り主の会員番号").toBe("会員番号 非会員");
}));
caseTest("IT-M05-22-004", リストから("S-M05-22-CUSTOMERS-004", "〔出荷指示リストID-M0522-004〕", ["〔注文番号-M0522-004A〕", "〔注文番号-M0522-004B〕"],
  だけが出る(["〔注文番号-M0522-004A〕"], ["〔注文番号-M0522-004B〕"])));
caseTest("IT-M05-22-005", リストから("S-M05-22-RELATIONS-005", "〔出荷指示リストID-M0522-005〕", ["〔注文番号-M0522-005A〕", "〔注文番号-M0522-005B〕", "〔注文番号-M0522-005C〕"],
  だけが出る(["〔注文番号-M0522-005A〕"], ["〔注文番号-M0522-005B〕", "〔注文番号-M0522-005C〕"])));
caseTest("IT-M05-22-006", リストから("S-M05-22-RELATIONS-006", "〔出荷指示リストID-M0522-006〕", ["〔注文番号-M0522-006A〕", "〔注文番号-M0522-006B〕"],
  だけが出る(["〔注文番号-M0522-006A〕"], ["〔注文番号-M0522-006B〕"])));
caseTest("IT-M05-22-008", リストから("S-M05-22-NULL-ADDRESS-008", "〔出荷指示リストID-M0522-008〕", ["〔注文番号-M0522-008A〕", "〔注文番号-M0522-008B〕"], (pages, ctx) => {
  const a = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0522-008A〕"))[0], b = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0522-008B〕"))[0];
  expect.soft([a ? "A" : "", b ? "B" : ""].join(""), "両受注の納品書が出た").toBe("AB");
  expect.soft(郵便の行(a?.お届け先 ?? []), "008A のお届け先の郵便番号の行（後ろの都道府県が空欄）").toMatch(/^〒[\d-]+$/);
  const bb = b?.お届け先 ?? [];
  expect.soft(bb.some((s) => s === "Japan" || s === "日本"), "008B のお届け先に国・地域が出ない（空欄）").toBe(false);
  expect.soft(郵便の行(bb), "008B のお届け先の郵便番号の行（都道府県は東京都のまま）").toMatch(/東京都$/);
}));

caseTest("IT-M05-22-010", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M0522_ADMIN);
  const s = new StandbySlipPage(page);
  const v = 作ったものの("S-M05-22-EXTERNAL-010");
  const A = v.受注ID[v.注文番号.indexOf(番号の(ctx, "〔注文番号-M0522-010A〕"))];
  const B = 番号の(ctx, "〔受注ID-M0522-010B〕");
  let pages: 納品書のページ[] = []; let 様子!: Awaited<ReturnType<typeof 窓の様子>>;
  await step(1, async () => { expect(await s.詳細を開く(番号の(ctx, "〔出荷指示リストID-M0522-010A〕")), "出荷指示リスト編集画面の応答").toBeLessThan(400); });
  await step(2, async () => { await s.受注を選ぶ([A]); });
  await step(3, async () => { await s.選択した受注IDを書き換える(A, B); note(`開発者ツールの代わりに、選んだ受注の選択欄の名前（受注ID ${A}）を受注ID ${B} へ書き換えた`); });
  await step(4, async () => {
    const popup = await s.納品書印刷を押す(); 様子 = await 窓の様子(popup); pages = await 読む(popup);
    note(`開いた窓: ${様子.URL}・題「${様子.題}」・本文「${様子.本文.slice(0, 120)}」・納品書の注文番号: ${pages.map((p) => p.注文番号).join("・") || "なし"}`);
  });
  await expected(async () => {
    expect.soft(pages.map((p) => p.注文番号), "リストに含まれない受注の納品書が出る").toContain(番号の(ctx, "〔注文番号-M0522-010B〕"));
  });
});

caseTest("IT-M05-22-011", リストから("S-M05-22-ADDRESSES-011", "〔出荷指示リストID-M0522-011〕", ["〔注文番号-M0522-011〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const a = p?.お届け先 ?? [], b = p?.送り主 ?? [];
  expect.soft(a.indexOf("United States") >= 0 && a.indexOf("United States") < a.findIndex((s) => s.includes("12345")), "お届け先の国「United States」が郵便番号「12345」の上").toBe(true);
  expect.soft(a.find((s) => s.includes("12345")) ?? "", "お届け先の郵便番号の後ろに都道府県が無い").toMatch(/^〒?12345$/);
  expect.soft(b.indexOf("Canada") >= 0 && b.indexOf("Canada") < b.findIndex((s) => s.includes("A1B2C3")), "送り主の国「Canada」が郵便番号「A1B2C3」の上").toBe(true);
  expect.soft(b.find((s) => s.includes("A1B2C3")) ?? "", "送り主の郵便番号の後ろに都道府県が無い").toMatch(/^〒?A1B2C3$/);
}));
caseTest("IT-M05-22-012", リストから("S-M05-22-ADDRESSES-012", "〔出荷指示リストID-M0522-012〕", ["〔注文番号-M0522-012〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const a = p?.お届け先 ?? [], b = p?.送り主 ?? [];
  expect.soft([...a, ...b].filter((s) => s === "Japan" || s === "日本"), "お届け先と送り主に国・地域名が出ない").toEqual([]);
  expect.soft(郵便の行(a), "お届け先の郵便番号の後ろに東京都").toMatch(/東京都$/);
  expect.soft(郵便の行(b), "送り主の郵便番号の後ろに大阪府").toMatch(/大阪府$/);
}));
caseTest("IT-M05-22-013", リストから("S-M05-22-CUSTOMERS-013", "〔出荷指示リストID-M0522-013〕", ["〔注文番号-M0522-013〕"], (pages) => {
  expect.soft(pages.length, "納品書が出た").toBeGreaterThan(0);
  expect.soft(pages[0]?.送り主.find((s) => s.startsWith("会員番号")) ?? "（会員番号の行が無い）", "送り主の会員番号").toBe("会員番号 SMR-52213");
}));
caseTest("IT-M05-22-014", リストから("S-M05-22-SIGNATURE-014", "〔出荷指示リストID-M0522-014〕", ["〔注文番号-M0522-014A〕", "〔注文番号-M0522-014B〕"], (pages, ctx) => {
  const a = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0522-014A〕"))[0], b = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0522-014B〕"))[0];
  expect.soft(a?.受取人署名 ?? "（納品書が無い）", "スムーズ店頭受取の受注の納品書に受取人署名の欄が出る").toBe(true);
  expect.soft(b?.受取人署名 ?? "（納品書が無い）", "宅配便の受注の納品書に受取人署名の欄が出ない").toBe(false);
}));

// 共有の設定（本店の適格請求書発行事業者登録番号）を書き換えるケース（015・019）。開始時に控えて書き換え、終わるたびに戻して DB で確かめる
let 元の登録番号: string | null = null;
async function 登録番号を別の窓で設定する(ctx: CaseCtx, 値: string): Promise<void> {
  await withAdminSession(ctx.browser, M0522_ADMIN, async (p) => { p.setDefaultTimeout(60_000); await 登録番号を設定する(p, 値); });
}
const 登録番号を書き換える: 前後 = {
  開始時: async (ctx) => {
    const 元 = 登録番号();
    元の登録番号 = 元;
    await 登録番号を別の窓で設定する(ctx, "T5220000000001");
    note(`事前準備: 本店の適格請求書発行事業者登録番号を、元の値（${元 || "空"}）から T5220000000001 にした（終わったら戻す）`);
  },
  終了時: async (ctx) => {
    if (元の登録番号 === null) return;
    const 元 = 元の登録番号;
    if (登録番号() !== 元) await 登録番号を別の窓で設定する(ctx, 元);
    expect(登録番号(), "共有の設定（本店の適格請求書発行事業者登録番号）を元の値へ戻せた").toBe(元);
    元の登録番号 = null;
  },
};

caseTest("IT-M05-22-015", リストから("S-M05-22-COMPANY-015", "〔出荷指示リストID-M0522-015〕", ["〔注文番号-M0522-015A〕", "〔注文番号-M0522-015B〕"], (pages, ctx) => {
  const a = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0522-015A〕"))[0], b = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0522-015B〕"))[0];
  expect.soft([a ? "A" : "", b ? "B" : ""].join(""), "2件の納品書が出た").toBe("AB");
  expect.soft(a?.会社.length ?? 0, "会社欄に情報が出る").toBeGreaterThan(0);
  expect.soft(b?.会社 ?? [], "2件の納品書の会社欄が同じ").toEqual(a?.会社 ?? ["（A の納品書が無い）"]);
}, 登録番号を書き換える));

caseTest("IT-M05-22-016", リストから("S-M05-22-AMOUNTS-016", "〔出荷指示リストID-M0522-016〕", ["〔注文番号-M0522-016〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(数字(p?.お買上額 ?? ""), "お買上額（受注の小計 1000）").toBe("1000");
  expect.soft(数字(p?.送料 ?? ""), "送料（500）").toBe("500");
  expect.soft(数字(p?.手数料 ?? ""), "手数料（200）").toBe("200");
  supplement(`配送方法名「宅配便」は、開発環境の「${宅配便}」で読み替えた（配送方法のマスタは全員が使うので足さない）`);
  expect.soft(p?.発送方法 ?? "", `発送方法に配送方法名（宅配便＝${宅配便}）`).toBe(宅配便);
}));
caseTest("IT-M05-22-017", リストから("S-M05-22-AMOUNTS-017", "〔出荷指示リストID-M0522-017〕", ["〔注文番号-M0522-017A〕", "〔注文番号-M0522-017B〕"], (pages, ctx) => {
  const a = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0522-017A〕"))[0], b = 受注のページ(pages, 番号の(ctx, "〔注文番号-M0522-017B〕"))[0];
  expect.soft(a?.ポイント使用 ?? "（納品書が無い）", "値引き額250の受注のポイント使用").toBe("250ポイント");
  expect.soft(b?.ポイント使用 ?? "（納品書が無い）", "値引き額0の受注のポイント使用").toBe("0ポイント");
}));
caseTest("IT-M05-22-018", リストから("S-M05-22-PRODUCT-SNAPSHOT-018", "〔出荷指示リストID-M0522-018〕", ["〔注文番号-M0522-018〕"], (pages) => {
  const names = 全部の行(pages).map((r) => r.商品名);
  expect.soft(names.includes(rc("受注時商品名")), "商品情報に受注時商品名が表示される").toBe(true);
  expect.soft(names.includes(rc("変更後商品名")), "商品情報に変更後商品名が表示されない").toBe(false);
}));
caseTest("IT-M05-22-019", リストから("S-M05-22-PAGE31-019", "〔出荷指示リストID-M0522-019〕", ["〔注文番号-M0522-019〕"], (pages) => {
  expect.soft(pages.length, "2ページに分かれる").toBe(2);
  expect.soft(pages.map((p) => p.明細.length), "ページごとの明細の数（30・1）").toEqual([30, 1]);
  const p2 = pages[1];
  expect.soft(p2?.ページ ?? "", "2ページ目のページ数").toBe("2/2");
  expect.soft(p2?.注文番号 ?? "", "2ページ目の注文番号").toBe(pages[0]?.注文番号 ?? "（1ページ目が無い）");
  expect.soft(p2?.受取人署名 ?? false, "2ページ目に受取人署名の欄が再表示される（スムーズ店頭受取）").toBe(true);
  expect.soft((p2?.お届け先.length ?? 0) > 0 && (p2?.送り主.length ?? 0) > 0 && (p2?.会社.length ?? 0) > 0, "2ページ目にお届け先・送り主・会社情報の欄が再表示される").toBe(true);
  expect.soft(p2?.お買上額 ?? "", "2ページ目に金額の欄が再表示される").not.toBe("");
}, 登録番号を書き換える));
caseTest("IT-M05-22-020", リストから("S-M05-22-BASE-020", "〔出荷指示リストID-M0522-020〕", ["〔注文番号-M0522-020〕"], async (pages, _ctx, popup) => {
  expect.soft(pages.length, "納品書が表示された").toBe(1);
  const msgs = await StandbySlipPage.窓のメッセージ(popup);
  note(`納品書の窓の画面メッセージの枠: ${msgs.join(" / ") || "なし"}`);
  expect.soft(msgs, "表示された納品書に画面メッセージが表示されない").toEqual([]);
}));
caseTest("IT-M05-22-022", リストから("S-M05-22-ADDRESSES-022", "〔出荷指示リストID-M0522-022〕", ["〔注文番号-M0522-022〕"], (pages) => {
  const p = pages[0];
  expect.soft(pages.length, "納品書が出た").toBe(1);
  const a = p?.お届け先 ?? [], b = p?.送り主 ?? [];
  expect.soft(a.indexOf("United States") >= 0 && a.indexOf("United States") < a.findIndex((s) => s.includes("77022")), "お届け先の国「United States」が郵便番号「77022」の上").toBe(true);
  expect.soft(a.find((s) => s.includes("77022")) ?? "", "お届け先の郵便番号の後ろに都道府県が無い").toMatch(/^〒?77022$/);
  expect.soft(b.filter((s) => s === "Japan" || s === "日本"), "送り主に国・地域名が出ない").toEqual([]);
  expect.soft(郵便の行(b), "送り主の郵便番号の後ろに東京都").toMatch(/東京都$/);
}));
caseTest("IT-M05-22-023", リストから("S-M05-22-CBDETAILS-023", "〔出荷指示リストID-M0522-023〕", ["〔注文番号-M0522-023〕"], (pages) => {
  const names = 全部の行(pages).map((r) => r.商品名);
  expect.soft(pages.length, "納品書が出た").toBeGreaterThan(0);
  expect.soft(names, "商品・商品規格・サブ情報をすべて持つ明細だけが出る").toEqual([rc("M0522-023-正常明細")]);
  for (const n of ["M0522-023-商品なし明細", "M0522-023-規格なし明細", "M0522-023-サブ情報なし明細", "M0522-023-規格サブ情報なし明細"]) {
    expect.soft(names.includes(rc(n)), `「${n}」の明細行が出ない`).toBe(false);
  }
}));
caseTest("IT-M05-22-024", リストから("S-M05-22-CBABROAD-024", "〔出荷指示リストID-M0522-024〕", ["〔注文番号-M0522-024A〕", "〔注文番号-M0522-024B〕"],
  だけが出る(["〔注文番号-M0522-024A〕"], ["〔注文番号-M0522-024B〕"])));
