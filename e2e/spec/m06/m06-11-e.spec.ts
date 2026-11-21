/**
 * M06-11 戻しリストPDF出力（店頭買取）（追加分）。正本: cases/M06-11_test_cases.tsv（002・003・015・023）
 *
 * シードは seeds/m06-11-e.ts。読み替えは spec/m06/m06-11.spec.ts と同じ（本店・支店Aの閾値は、同じ閾値の使い回す試験用の店舗で確かめる／買取番号は買取一覧の「査定ID」の欄の値／商品名・略称タグは実行の印つき）。
 * 実装していないケース（理由は報告）: 004・029（棚番号の並びは本店（店舗ID 1）限定。本店の閾値は共有の設定）。
 */
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { PDFの行, 戻しリストを読む } from "../../pages/admin/m07_buy";
import { M0611_ADMIN } from "../../seeds/m06-11";
import { 支店A, 本店 } from "../../seeds/m06-11-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type PDF = { popup: Page | null; 行: PDFの行[] };
type 店 = "main" | "branch";

const f = (n: number) => n.toLocaleString("en-US");
const 閾値の = (k: 店): number[] => (k === "main" ? 本店 : 支店A).閾値.map(Number);
/** 店の閾値と基準価格から、商品仕訳の見出しの部分（戻しリストの「（商品単位_…円未満）」） */
function 見出し(k: 店, 価格: number): string {
  const t = 閾値の(k);
  const i = t.filter((x) => 価格 >= x).length;
  if (i === 0) return `（商品単位_${f(t[0])}円未満）`;
  if (i === t.length) return `（商品単位_${f(t[t.length - 1])}円以上）`;
  return `（商品単位_${f(t[i - 1])}円以上_${f(t[i])}円未満）`;
}
const 店の名 = (k: 店) => (k === "main" ? "本店" : "支店A");
const 閾値の文 = (k: 店) => `「${店の名(k)}」は、同じ閾値の使い回す試験用の店舗（${閾値の(k).map(f).join("円・")}円）で確かめた`;
const サプライの見出し = "（サプライ）";

/** 手順1〜5。PDF の行を返す */
async function 手順1から5(ctx: CaseCtx, 買取番号: string): Promise<PDF> {
  const { page, step } = ctx;
  await loginAdmin(page, M0611_ADMIN);
  const list = new OtcListPage(page);
  let pdf: PDF = { popup: null, 行: [] };
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    await list.査定IDを入れる(買取番号);
    note("手順2の「買取番号」は、買取一覧の検索欄の「査定ID」の欄に入れた（一覧の査定IDの欄が買取番号）");
    await list.検索する();
  });
  await step(3, async () => { await list.対象にする(買取番号); });
  await step(4, async () => {
    const r = await list.ダウンロードを押す("戻しリストPDF");
    if (r.ダイアログ.length) note(`戻しリストPDFを押すと警告が出た: ${r.ダイアログ.join(" / ")}`);
    pdf = { popup: r.popup, 行: [] };
  });
  await step(5, async () => {
    expect(pdf.popup, "戻しリストPDFのページ（別ウィンドウ）が開いた").not.toBeNull();
    const r = await 戻しリストを読む(pdf.popup!);
    pdf = { popup: pdf.popup, 行: r.行 };
  });
  return pdf;
}

const 位置 = (p: PDF, 名: string): number => p.行.findIndex((r) => r.商品名.trim() === rc(名));
const 行 = (p: PDF, 名: string): PDFの行 | undefined => p.行[位置(p, 名)];
const q = (名: string) => `「${名}」`;

/** 名の順に上から出ているか */
function 順(p: PDF, 名: string[]): { ok: boolean; 項目: string } {
  const idx = 名.map((n) => 位置(p, n));
  const 実際 = 名.map((n, i) => `${n}=${idx[i] < 0 ? "無し" : `${idx[i] + 1}行目`}`).join("、");
  return { ok: idx.every((x) => x >= 0) && idx.every((x, i) => i === 0 || x > idx[i - 1]), 項目: `${名.map(q).join("")}の順に上から表示される（表示された位置: ${実際}）` };
}

/** 5つの商品を、価格→見出しの対応と順で確かめる（002・003） */
function 五区分(no: string, k: 店, 商品: { 名: string; 価格: number }[], サプライ: string) {
  return async (ctx: CaseCtx) => {
    const p = await 手順1から5(ctx, ctx.notes.get(`〔買取番号-M0611-${no}〕`));
    await ctx.expected(async () => {
      note(`${閾値の文(k)}。カードの基準価格で区分され、サプライ品は最後の「サプライ」の区分。商品名は実行の印つき`);
      for (const x of 商品) {
        expect.soft(行(p, x.名)?.仕訳 ?? "（行が無い）", `${q(x.名)}の商品仕訳（基準価格${f(x.価格)}円の見出し「${見出し(k, x.価格)}」）`).toContain(見出し(k, x.価格));
      }
      expect.soft(行(p, サプライ)?.仕訳 ?? "（行が無い）", `${q(サプライ)}の商品仕訳（サプライ品の見出し「${サプライの見出し}」）`).toContain(サプライの見出し);
      const o = 順(p, [...商品.map((x) => x.名), サプライ]);
      expect.soft(o.ok, `${o.項目}。金額閾値の昇順、最後にサプライ`).toBe(true);
    });
  };
}

caseTest("IT-M06-11-002", 五区分("002", "main", [
  { 名: "M-0900", 価格: 900 }, { 名: "M-1000", 価格: 1000 }, { 名: "M-5000", 価格: 5000 }, { 名: "M-10000", 価格: 10000 },
], "M-SUPPLY"));

caseTest("IT-M06-11-003", 五区分("003", "branch", [
  { 名: "B-1900", 価格: 1900 }, { 名: "B-2000", 価格: 2000 }, { 名: "B-7000", 価格: 7000 }, { 名: "B-12000", 価格: 12000 },
], "B-SUPPLY"));

caseTest("IT-M06-11-015", async (ctx) => {
  const p = await 手順1から5(ctx, ctx.notes.get("〔買取番号-M0611-015〕"));
  await ctx.expected(async () => {
    note(`${閾値の文("main")}。カードの色「金」・レアリティRは既存のマスタの白・Cで代えた（ケースは確かめない）。「FIELD-CARD-015」の価格欄は表示された数字だけを比べた`);
    const r = 行(p, "FIELD-CARD-015");
    expect.soft((r?.価格 ?? "（行が無い）").replace(/[^\d]/g, ""), "「FIELD-CARD-015」の価格欄（セール中価格100円ではなく基準価格6000円）").toBe("6000");
    expect.soft(r?.仕訳 ?? "（行が無い）", `「FIELD-CARD-015」の商品仕訳（基準価格6,000円の見出し「${見出し("main", 6000)}」）`).toContain(見出し("main", 6000));
  });
});

caseTest("IT-M06-11-023", async (ctx) => {
  const p = await 手順1から5(ctx, ctx.notes.get("〔買取番号-M0611-023〕"));
  await ctx.expected(async () => {
    note("サプライ品に略称タグを持たせることは、サプライ品がカード属性のない商品のため作れない（サプライ品は略称タグなしで作った）。略称タグは共有に足さず、印つきの名称でカードに付けた");
    const タグ = rc("M0611-023-TAG-S-M06-11-ABBR-DISPLAY-023");
    expect.soft(行(p, "M0611-023-CARD")?.略称 ?? "（行が無い）", "「M0611-023-CARD」の略称欄（略称タグ）").toBe(タグ);
    const s = 行(p, "M0611-023-SUPPLY");
    expect.soft(s ? s.略称 : "（行が無い）", "「M0611-023-SUPPLY」の略称欄（何も表示されない）").toBe("");
  });
});
