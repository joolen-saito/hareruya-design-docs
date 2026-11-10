/**
 * M05-21 ピッキングリスト印刷。正本: cases/M05-21_test_cases.tsv
 * 実装したのは、受注一覧しきい値が 980・4800（開発環境の値のまま）で、棚番号・略称タグ・言語/状態・カードの並びの属性を作らずに確かめられる
 * 002・003・004・006〜009・011・014〜020・029（記録 review/M05-21_progress_2026-11-10_dev.md の振り分け）。
 * シード（seeds/m05-21.ts）は画面で商品・カード・受注・出荷指示リストを作り、出荷指示リストの作成日と受注の「対応中」だけを DB で書き足す
 * （E2E の行だけ。どのケースもその値を確かめない）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { グループごとの行, PickingPrintPage, ピッキングの行, ピッキングのページ, ピッキングリストを読む } from "../../pages/admin/m05_21_picking";
import { M0521_ADMIN } from "../../seeds/m05-21";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

const 低 = "商品単位_980円未満";
const 中 = "商品単位_980円以上_4800円未満";
const 高 = "商品単位_4800円以上";
const サ = "サプライ";
const カテゴリの補い = "カード商品のカテゴリは、シード表の「カード」へ付け替えず、グッズ商品CSV登録のカテゴリ（グッズの番号2の下）のまま。ピッキングリストのカードとサプライの分かれ目は、商品にカード詳細が付いているかで決まる";

const 行の文 = (pages: ピッキングのページ[]) => pages.map((p) => `【${p.見出し}】${p.行.map((r) => `${r.No}:${r.商品名}(${r.数})`).join(" ")}${p.合計 ? ` ${p.合計}` : ""}`).join(" / ") || "（グループ無し）";
const 全部の行 = (pages: ピッキングのページ[]) => pages.flatMap((p) => p.行);
const 名前の行 = (pages: ピッキングのページ[], 名前: string) => 全部の行(pages).filter((r) => r.商品名 === 名前);
const 名前のグループ = (pages: ピッキングのページ[], 名前: string) => pages.filter((p) => p.行.some((r) => r.商品名 === 名前)).map((p) => p.グループ);

/** 出荷指示リスト詳細を開き（手順1）、受注を選び（手順2）、印刷を押す（手順3） */
async function 開いて選んで印刷する(ctx: CaseCtx, リストの呼び名: string, 選ぶ受注の呼び名: string[], opt: { 足す受注の呼び名?: string; 選ぶと印刷を1つの手順で?: boolean } = {}): Promise<{ pages: ピッキングのページ[]; popup: Page }> {
  const { page, notes, step } = ctx;
  await loginAdmin(page, M0521_ADMIN);
  const p = new PickingPrintPage(page);
  let popup!: Page;
  let s = 1;
  await step(s++, async () => {
    const status = await p.詳細を開く(notes.get(リストの呼び名));
    expect(status, "出荷指示リスト詳細画面の応答").toBeLessThan(400);
  });
  if (opt.選ぶと印刷を1つの手順で) {
    await step(s++, async () => { await p.受注を選ぶ(選ぶ受注の呼び名.map((k) => notes.get(k))); popup = await p.印刷を押す(); });
    const pages = await ピッキングリストを読む(popup);
    note(`ピッキングリスト印刷画面: ${行の文(pages)}`);
    return { pages, popup };
  }
  await step(s++, async () => { await p.受注を選ぶ(選ぶ受注の呼び名.map((k) => notes.get(k))); });
  if (opt.足す受注の呼び名) {
    await step(s++, async () => {
      await p.印刷の要求へ受注を足す(notes.get(opt.足す受注の呼び名!));
      note(`開発者ツールの代わりに、画面の送信用のフォームへ受注ID ${notes.get(opt.足す受注の呼び名!)} を選択済みの項目として足した`);
    });
  }
  await step(s++, async () => { popup = await p.印刷を押す(); });
  const pages = await ピッキングリストを読む(popup);
  note(`ピッキングリスト印刷画面: ${行の文(pages)}`);
  return { pages, popup };
}

// ---- 選んだ受注だけが出る ----
caseTest("IT-M05-21-002", async (ctx) => {
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-002〕", ["〔受注ID-M0521-002A〕"]);
  await ctx.expected(async () => {
    expect.soft(名前の行(pages, "基本カード").length, "選んだ受注（A）の明細「基本カード」が表示される").toBe(1);
    expect.soft(名前の行(pages, "未選択カード").length, "選ばない受注（B）の明細「未選択カード」が表示されない").toBe(0);
  });
});

caseTest("IT-M05-21-003", async (ctx) => {
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-003A〕", ["〔受注ID-M0521-003A〕"], { 足す受注の呼び名: "〔受注ID-M0521-003B〕" });
  await ctx.expected(async () => {
    expect.soft(名前の行(pages, "M0521所属内カード-003").length, "このリストに属する受注（A）の明細が表示される").toBe(1);
    expect.soft(名前の行(pages, "M0521所属外カード-003").length, "別のリストに属する受注（B）の明細が表示されない").toBe(0);
    expect.soft(pages.every((p) => p.出荷指示リスト番号 === ctx.notes.get("〔出荷指示リストID-M0521-003A〕")), "表示された出荷指示リスト番号（リストA）").toBe(true);
  });
});

caseTest("IT-M05-21-004", async (ctx) => {
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-004〕", [], { 選ぶと印刷を1つの手順で: true });
  await ctx.expected(async () => {
    expect.soft(pages.map((p) => p.グループ), "表示されたグループ（980円未満・980円以上4800円未満・4800円以上・サプライのどれも無い）").toEqual([]);
    expect.soft(全部の行(pages).length, "受注明細の行（表示されない）").toBe(0);
  });
});

// ---- 集約・グループ ----
caseTest("IT-M05-21-006", async (ctx) => {
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-006〕", ["〔受注ID-M0521-006A〕", "〔受注ID-M0521-006B〕"]);
  await ctx.expected(async () => {
    const rows = 名前の行(pages, "集約カード");
    expect.soft(rows.length, "2受注の「集約カード」の明細が1行にまとめられる").toBe(1);
    expect.soft(Number(rows[0]?.数 ?? "NaN"), "その行のピック数").toBe(5);
    const g = pages.filter((p) => p.行.some((r) => r.商品名 === "集約カード"));
    const 合計 = g.map((p) => p.合計).filter(Boolean).pop() ?? "";
    expect.soft(/^全\s*(\S+)\s*点/.exec(合計)?.[1] ?? 合計, "そのグループの合計").toBe("5");
  });
});

function 価格帯(番号: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    supplement(カテゴリの補い);
    const { pages } = await 開いて選んで印刷する(ctx, `〔出荷指示リストID-M0521-${番号}〕`, [`〔受注ID-M0521-${番号}〕`]);
    await ctx.expected(async () => {
      expect.soft(名前のグループ(pages, `M0521境界カード979-${番号}`), "受注明細価格979円の商品のグループ").toEqual([低]);
      expect.soft(名前のグループ(pages, `M0521境界カード980-${番号}`), "受注明細価格980円の商品のグループ").toEqual([中]);
      expect.soft(名前のグループ(pages, `M0521境界カード4799-${番号}`), "受注明細価格4799円の商品のグループ").toEqual([中]);
      expect.soft(名前のグループ(pages, `M0521境界カード4800-${番号}`), "受注明細価格4800円の商品のグループ").toEqual([高]);
    });
  };
}
caseTest("IT-M05-21-007", 価格帯("007"));
caseTest("IT-M05-21-009", async (ctx) => {
  supplement(カテゴリの補い);
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-009〕", ["〔受注ID-M0521-009〕"]);
  await ctx.step(4, async () => { note(`グループの並び: ${pages.map((p) => p.グループ).join(" → ")}`); });
  await ctx.expected(async () => {
    const order = [...new Set(pages.map((p) => p.グループ))];
    expect.soft(order, "グループの表示順（カードの980円未満・980円以上4800円未満・4800円以上が先、サプライが最後）").toEqual([低, 中, 高, サ]);
  });
});

caseTest("IT-M05-21-008", async (ctx) => {
  supplement(カテゴリの補い);
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-008〕", ["〔受注ID-M0521-008〕"]);
  await ctx.expected(async () => {
    expect.soft(名前のグループ(pages, "グッズ商品"), "グッズカテゴリの「グッズ商品」のグループ").toEqual([サ]);
    expect.soft(名前のグループ(pages, "予約グッズ商品"), "予約グッズカテゴリの「予約グッズ商品」のグループ").toEqual([サ]);
    for (const k of ["1", "2", "3", "4"]) {
      const g = 名前のグループ(pages, `M0521分類カード${k}-008`);
      expect.soft(g.length === 1 && [低, 中, 高].includes(g[0]), `カードの商品「M0521分類カード${k}-008」が価格帯別のグループに表示される（実際 ${g.join("・") || "無い"}）`).toBe(true);
    }
  });
});

caseTest("IT-M05-21-011", async (ctx) => {
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-011〕", ["〔受注ID-M0521-011〕"]);
  await ctx.expected(async () => {
    expect.soft(名前のグループ(pages, "価格差カード"), "受注明細価格500円の「価格差カード」のグループ").toEqual([低]);
    expect.soft((名前の行(pages, "価格差カード")[0]?.価格 ?? "").replace(/,/g, ""), "その行の価格欄（商品規格の販売価格）").toBe("6000");
  });
});

// ---- 商品名の整え ----
caseTest("IT-M05-21-014", async (ctx) => {
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-014〕", ["〔受注ID-M0521-014〕"]);
  let r: ピッキングの行 | undefined;
  await ctx.step(4, async () => { r = グループごとの行(pages).get(サ)?.find((x) => x.商品名 === "サプライ[限定] 白/R"); });
  await ctx.expected(async () => {
    expect.soft(r?.商品名 ?? "（サプライのグループに行が無い）", "サプライのグループの商品名（そのまま）").toBe("サプライ[限定] 白/R");
    expect.soft(r?.言語状態, "言語/状態欄").toBe("サプライ品");
    expect.soft(r?.略称, "略称欄（空）").toBe("");
    expect.soft(r?.色R, "色/R欄（空）").toBe("");
  });
});

function 名前の整え(番号: string, 見る行: (rows: ピッキングの行[]) => ピッキングの行 | undefined, 色R: string | null, 名前: string, 説明: string, 元の文字で比べる = false) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { pages } = await 開いて選んで印刷する(ctx, `〔出荷指示リストID-M0521-${番号}〕`, [`〔受注ID-M0521-${番号}〕`]);
    let r: ピッキングの行 | undefined;
    await ctx.step(4, async () => { r = 見る行(全部の行(pages)); note(`確かめた行: ${r ? `${r.商品名}（色/R: ${r.色R}）` : "無い"}`); });
    await ctx.expected(async () => {
      if (色R !== null) expect.soft(r?.色R ?? "（行が無い）", "色/R欄").toBe(色R);
      expect.soft(r ? (元の文字で比べる ? r.商品名の元 : r.商品名) : "（行が無い）", `商品名欄（${説明}）`).toBe(名前);
    });
  };
}
// 015 は「注記A」「注記B」を含まず「角括弧除去カード」が出ること
caseTest("IT-M05-21-015", async (ctx) => {
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-015〕", ["〔受注ID-M0521-015〕"]);
  let r: ピッキングの行 | undefined;
  await ctx.step(4, async () => { r = 全部の行(pages).find((x) => x.商品名.includes("角括弧除去カード")); });
  await ctx.expected(async () => {
    expect.soft(r?.商品名 ?? "（行が無い）", "商品名欄に「角括弧除去カード」が表示される").toContain("角括弧除去カード");
    expect.soft(r?.商品名.includes("注記A") ?? true, "商品名欄に「注記A」が表示されない").toBe(false);
    expect.soft(r?.商品名.includes("注記B") ?? true, "商品名欄に「注記B」が表示されない").toBe(false);
  });
});
const 白Rの行 = (前: string) => (rows: ピッキングの行[]) => rows.find((x) => x.商品名.startsWith(前));
caseTest("IT-M05-21-016", 名前の整え("016", 白Rの行("末尾カード"), "白/R", "末尾カード", "末尾の「白/R」を除いた名前"));
caseTest("IT-M05-21-017", 名前の整え("017", 白Rの行("括弧カード"), "白/R", "括弧カード (限定)", "開き括弧を残した名前"));
caseTest("IT-M05-21-018", 名前の整え("018", 白Rの行("前半"), "白/R", "前半 後半", "表記を空白1個に置き換えた名前", true));
caseTest("IT-M05-21-019", 名前の整え("019", 白Rの行("角括弧カード"), "白/R", "角括弧カード [注記]", "角括弧を残した名前"));

// ---- No と合計 ----
caseTest("IT-M05-21-020", async (ctx) => {
  const { pages } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-020〕", ["〔受注ID-M0521-020〕"]);
  await ctx.expected(async () => {
    const g = グループごとの行(pages);
    expect.soft((g.get(低) ?? []).map((r) => r.No), "980円未満グループのNo.").toEqual(["1", "2"]);
    expect.soft((g.get(高) ?? [])[0]?.No ?? "（行が無い）", "4800円以上グループのNo.の始まり").toBe("1");
    const 最終頁の合計 = (名: string) => { const ps = pages.filter((p) => p.グループ === 名); return /^全\s*(\S+)\s*点/.exec(ps[ps.length - 1]?.合計 ?? "")?.[1] ?? "（合計の行が無い）"; };
    expect.soft(最終頁の合計(低), "980円未満グループの最終頁の合計ピック数").toBe("5");
    expect.soft(最終頁の合計(高), "4800円以上グループの最終頁の合計ピック数").toBe("4");
  });
});

// ---- 画面メッセージ ----
caseTest("IT-M05-21-029", async (ctx) => {
  const { popup } = await 開いて選んで印刷する(ctx, "〔出荷指示リストID-M0521-029〕", ["〔受注ID-M0521-029A〕"]);
  await ctx.expected(async () => {
    const msgs = (await popup.locator(".alert, .alert-danger, .alert-success, .alert-warning, .text-danger, .invalid-feedback, [role=alert]").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    expect.soft(msgs, "ピッキングリスト印刷画面の画面メッセージ（表示されない）").toEqual([]);
    await expect.soft(popup.locator(".ContentsAll"), "ピッキングリスト印刷画面が表示された").toBeAttached();
  });
});
