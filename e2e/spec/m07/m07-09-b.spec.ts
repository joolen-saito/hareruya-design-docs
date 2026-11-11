/**
 * M07-09 戻しリストPDF出力（カード商品を使うケース）。正本: cases/M07-09_test_cases.tsv
 *
 * シードは seeds/m07-09-card.ts。依頼者の方針（2026-11-10）で、共有の設定・マスタは書き換えず既存の値に読み替えている:
 * - 本店の高額商品閾値は、いまの閾値1・閾値2 を正本の 300・3000 として読む（商品仕訳の見出し・基準価格もそれに合わせて読む）。
 * - 略称タグ AAA・BBB・COL・ALP は既存の略称タグに、棚番号は既存の棚に、カードは既存のカード詳細に読み替える。
 * - 注文者名・商品コード・商品名は実行の印つき（lib/run_marker）。手順2の注文者名も印つきの値を入れる。
 * 読み替えの中身はシードの報告（エビデンスの注記）に出る。
 * 実装していないケース: 011・037（備考はDBで設定する定めで、画面から作れない）。
 */
import { Page, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BuyListPage, PDFの行, 戻しリストを読む } from "../../pages/admin/m07_buy";
import { M0709_ADMIN } from "../../seeds/m07-09";
import { 価格, 仕訳の見出し, 品コード, 注文者名, 略称名 } from "../../seeds/m07-09-card";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type PDF = { popup: Page | null; 行: PDFの行[] };
type 仕訳 = "300円未満" | "300円以上3000円未満" | "3000円以上" | "サプライ";

/** 手順1〜5（開く・注文者名で検索・1件だけチェック・戻しリストPDF・ページを見る）を行い、PDF の行を返す */
async function 手順1から5(ctx: CaseCtx, n: string): Promise<PDF> {
  const { page, notes, step } = ctx;
  await loginAdmin(page, M0709_ADMIN);
  const l = new BuyListPage(page);
  let pdf: PDF = { popup: null, 行: [] };
  await step(1, async () => { await l.open(); });
  await step(2, async () => {
    await l.注文者名を入れる(注文者名(n));
    await l.検索する();
    note(`手順2の注文者名は、実行の印つきの値「${注文者名(n)}」を入れた（前の実行の買取を消さずに分けるため）`);
  });
  await step(3, async () => { await l.対象にする(notes.get(`〔買取番号-M0709-${n}〕`)); });
  await step(4, async () => {
    const r = await l.ダウンロードを押す("戻しリストPDF");
    if (r.ダイアログ.length) note(`戻しリストPDFを押すと警告が出た: ${r.ダイアログ.join(" / ")}`);
    pdf = { popup: r.popup, 行: [] };
  });
  await step(5, async () => {
    expect(pdf.popup, "戻しリストPDFのページ（別ウィンドウ）が開いた").not.toBeNull();
    pdf = { popup: pdf.popup, 行: (await 戻しリストを読む(pdf.popup!)).行 };
  });
  return pdf;
}

const 位置 = (p: PDF, n: string, 枝: string): number => p.行.findIndex((r) => r.商品名.includes(品コード(n, 枝)));
const 行 = (p: PDF, n: string, 枝: string): PDFの行 | undefined => p.行[位置(p, n, 枝)];
const 見出し = (s: 仕訳) => 仕訳の見出し(s);
const 名 = (n: string, 枝: string) => `「M0709-${n}-${枝}」`;

/** 枝の行の商品仕訳（ページの見出し。行が無ければその旨） */
const 仕訳の = (p: PDF, n: string, 枝: string): string => 行(p, n, 枝)?.仕訳 ?? "（行が無い）";
const 仕訳の項目 = (n: string, 枝: string, s: 仕訳) => `${名(n, 枝)}の行の商品仕訳（${s}${s === "サプライ" ? "" : `＝見出しの「${見出し(s)}」`}）`;

/** 枝の順に上から出ているか（どの行も表示されている）と、表示された位置 */
function 順の(p: PDF, n: string, 枝: string[]): { ok: boolean; 項目: string } {
  const idx = 枝.map((b) => 位置(p, n, b));
  const 実際 = 枝.map((b, i) => `${b}=${idx[i] < 0 ? "無し" : `${idx[i] + 1}行目`}`).join("、");
  const ok = idx.every((x) => x >= 0) && idx.every((x, i) => i === 0 || x > idx[i - 1]);
  return { ok, 項目: `${枝.map((b) => 名(n, b)).join("")}の順に上から表示される（表示された位置: ${実際}）` };
}

const 言語状態の = (p: PDF, n: string, 枝: string): string => 行(p, n, 枝)?.言語状態 ?? "（行が無い）";
const 商品名の = (p: PDF, n: string, 枝: string): string => 行(p, n, 枝)?.商品名 ?? "（行が無い）";
const 閾値の注記 = (s: 仕訳[]) => `商品仕訳は、本店のいまの閾値で読み替えて確かめた（${s.map((x) => `「${x}」→ 見出し「${見出し(x)}」`).join("、")}）`;
const 表記 = (tag: string) => `[${tag}]【JP/NM】赤M`;

/** 2行（または3行以上）の上下の順だけを見るケース */
function 順のケース(n: string, 枝: string[], 注記?: () => string) {
  return async (ctx: CaseCtx) => {
    const p = await 手順1から5(ctx, n);
    await ctx.expected(async () => {
      if (注記) note(注記());
      const o = 順の(p, n, 枝);
      expect.soft(o.ok, o.項目).toBe(true);
    });
  };
}

/** シングルカード: 商品仕訳に A・B があり、A の行の言語 / 状態・商品名が正本どおりで、A が B より上 */
function CB型(n: string, s: 仕訳, 言語状態A: string, 外れる表記: string) {
  return async (ctx: CaseCtx) => {
    const p = await 手順1から5(ctx, n);
    await ctx.expected(async () => {
      note(閾値の注記([s]));
      expect.soft(仕訳の(p, n, "A"), 仕訳の項目(n, "A", s)).toContain(見出し(s));
      expect.soft(仕訳の(p, n, "B"), 仕訳の項目(n, "B", s)).toContain(見出し(s));
      expect.soft(言語状態の(p, n, "A"), `${名(n, "A")}の行の言語 / 状態`).toBe(言語状態A);
      expect.soft(商品名の(p, n, "A"), `${名(n, "A")}の行の商品名（「${外れる表記}」は表示されない）`).toBe(品コード(n, "A"));
      const o = 順の(p, n, ["A", "B"]);
      expect.soft(o.ok, o.項目).toBe(true);
    });
  };
}

/** シングルカード: 商品仕訳に A・B の2行があり、どちらも言語 / 状態・商品名が正本どおり（上下の順は問わない） */
function CB同じ(n: string, s: 仕訳) {
  return async (ctx: CaseCtx) => {
    const p = await 手順1から5(ctx, n);
    await ctx.expected(async () => {
      note(閾値の注記([s]));
      for (const b of ["A", "B"]) {
        expect.soft(仕訳の(p, n, b), 仕訳の項目(n, b, s)).toContain(見出し(s));
        expect.soft(言語状態の(p, n, b), `${名(n, b)}の行の言語 / 状態`).toBe("JP/NM");
        expect.soft(商品名の(p, n, b), `${名(n, b)}の行の商品名（「${表記("AAA")}」は表示されない）`).toBe(品コード(n, b));
      }
    });
  };
}

// ---- 商品仕訳・価格・項目 ----

caseTest("IT-M07-09-008", async (ctx) => {
  const p = await 手順1から5(ctx, "008");
  await ctx.expected(async () => {
    note(閾値の注記(["300円未満", "300円以上3000円未満", "3000円以上"]));
    const want: [string, 仕訳][] = [["A", "300円未満"], ["B", "300円以上3000円未満"], ["E", "300円以上3000円未満"], ["C", "3000円以上"], ["D", "サプライ"]];
    for (const [b, s] of want) expect.soft(仕訳の(p, "008", b), 仕訳の項目("008", b, s)).toContain(見出し(s));
  });
});

caseTest("IT-M07-09-009", async (ctx) => {
  const p = await 手順1から5(ctx, "009");
  await ctx.expected(async () => {
    note(`${閾値の注記(["300円未満", "3000円以上"])}。基準価格・セール価格は A: ${価格(299)}円・${価格(3500)}円、B: ${価格(3000)}円・100円で作った`);
    expect.soft(仕訳の(p, "009", "A"), 仕訳の項目("009", "A", "300円未満")).toContain(見出し("300円未満"));
    expect.soft(仕訳の(p, "009", "B"), 仕訳の項目("009", "B", "3000円以上")).toContain(見出し("3000円以上"));
  });
});

caseTest("IT-M07-09-010", async (ctx) => {
  const p = await 手順1から5(ctx, "010");
  await ctx.expected(async () => {
    note(`基準価格2900円・セール価格1800円は、いまの閾値に読み替えた値（${価格(2900)}円・${価格(1800)}円）で作った（値が同じなら読み替えていない）`);
    expect.soft(行(p, "010", "A")?.価格.replace(/[,円\s]/g, "") ?? "（行が無い）", `${名("010", "A")}の行の価格（基準価格 ${価格(2900)}円。セール価格 ${価格(1800)}円ではない）`).toBe(String(価格(2900)));
  });
});

caseTest("IT-M07-09-013", async (ctx) => {
  const p = await 手順1から5(ctx, "013");
  await ctx.expected(async () => {
    expect.soft(行(p, "013", "A") !== undefined, `サプライ品${名("013", "A")}の行が表示されている`).toBe(true);
    expect.soft(行(p, "013", "A")?.略称 ?? "（行が無い）", `サプライ品${名("013", "A")}の行の略称（略称タグ「AAA」＝読み替えた「${略称名("AAA")}」が表示されない）`).not.toContain(略称名("AAA"));
  });
});

caseTest("IT-M07-09-015", async (ctx) => {
  const p = await 手順1から5(ctx, "015");
  await ctx.expected(async () => {
    for (const b of ["A", "B"]) expect.soft(行(p, "015", b)?.No ?? "（行が無い）", `${名("015", b)}の行の行番号`).toMatch(/^\d+$/);
  });
});

caseTest("IT-M07-09-040", async (ctx) => {
  const p = await 手順1から5(ctx, "040");
  await ctx.expected(async () => {
    expect.soft(言語状態の(p, "040", "A"), `Foilの${名("040", "A")}の行の言語 / 状態`).toBe("FoilJP/NM");
  });
});

// ---- 並び ----

const 略称の注記 = (tags: ("AAA" | "BBB" | "COL" | "ALP")[]) => () => `略称${tags.join("・")}は既存の略称タグ${tags.map((t) => `「${略称名(t)}」`).join("")}に読み替えた`;
caseTest("IT-M07-09-016", 順のケース("016", ["C", "D", "A", "B"], () => 閾値の注記(["300円未満", "300円以上3000円未満", "3000円以上", "サプライ"])));
caseTest("IT-M07-09-017", 順のケース("017", ["B", "A"]));
caseTest("IT-M07-09-018", 順のケース("018", ["A", "B", "C"]));
caseTest("IT-M07-09-019", 順のケース("019", ["A", "B"]));
caseTest("IT-M07-09-020", 順のケース("020", ["A", "B"]));
caseTest("IT-M07-09-021", 順のケース("021", ["A", "B"], 略称の注記(["AAA", "BBB"])));
caseTest("IT-M07-09-022", 順のケース("022", ["A", "B"]));
caseTest("IT-M07-09-023", 順のケース("023", ["A", "B"]));
caseTest("IT-M07-09-024", 順のケース("024", ["A", "B"], () => `${略称の注記(["COL"])()}。コレクター番号001・002は、既存のカード詳細の番号（大小が同じもの）に読み替えた`));
caseTest("IT-M07-09-025", 順のケース("025", ["A", "B"], () => `${略称の注記(["ALP"])()}。英語カード名Alpha・Betaは、既存のカードの英語カード名（大小が同じもの）に読み替えた`));
caseTest("IT-M07-09-026", 順のケース("026", ["B", "A"]));
caseTest("IT-M07-09-027", 順のケース("027", ["A", "B"], () => 閾値の注記(["300円未満", "3000円以上"])));
caseTest("IT-M07-09-028", 順のケース("028", ["B", "A"]));
caseTest("IT-M07-09-029", 順のケース("029", ["A", "B"]));
caseTest("IT-M07-09-030", 順のケース("030", ["A", "B"], 略称の注記(["AAA", "BBB"])));
caseTest("IT-M07-09-031", 順のケース("031", ["A", "B"], 略称の注記(["AAA", "BBB"])));
caseTest("IT-M07-09-032", 順のケース("032", ["A", "B"]));
caseTest("IT-M07-09-033", 順のケース("033", ["A", "B"], () => `${略称の注記(["COL"])()}。コレクター番号002・001は、既存のカード詳細の番号（B のほうが小さいもの）に読み替えた`));
caseTest("IT-M07-09-034", 順のケース("034", ["A", "B"], () => `${略称の注記(["ALP"])()}。英語カード名Beta・Alphaは、既存のカードの英語カード名（B のほうが先のもの）に読み替えた`));

// ---- シングルカード（CB）: 商品仕訳・並び・言語 / 状態・商品名 ----

caseTest("IT-M07-09-041", async (ctx) => {
  const p = await 手順1から5(ctx, "CB041");
  await ctx.expected(async () => {
    note(閾値の注記(["300円未満", "300円以上3000円未満"]));
    expect.soft(仕訳の(p, "CB041", "A"), 仕訳の項目("CB041", "A", "300円未満")).toContain(見出し("300円未満"));
    expect.soft(仕訳の(p, "CB041", "B"), 仕訳の項目("CB041", "B", "300円以上3000円未満")).toContain(見出し("300円以上3000円未満"));
    const 未満 = p.行.findIndex((r) => r.仕訳.includes(見出し("300円未満")));
    const 中 = p.行.findIndex((r) => r.仕訳.includes(見出し("300円以上3000円未満")));
    expect.soft(未満 >= 0 && 中 >= 0 && 未満 < 中, `「300円未満」の商品仕訳が「300円以上3000円未満」の商品仕訳より先に表示される（最初の行: ${未満 + 1}行目・${中 + 1}行目）`).toBe(true);
    expect.soft(言語状態の(p, "CB041", "A"), `${名("CB041", "A")}の行の言語 / 状態`).toBe("JP/NM");
    expect.soft(商品名の(p, "CB041", "A"), `${名("CB041", "A")}の行の商品名（「[ZZZ]【JP/NM】赤M」は表示されない）`).toBe(品コード("CB041", "A"));
  });
});

caseTest("IT-M07-09-042", CB型("CB042", "3000円以上", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-043", CB型("CB043", "300円未満", "FoilJP/NM", 表記("AAA")));
caseTest("IT-M07-09-044", CB型("CB044", "300円未満", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-045", CB型("CB045", "300円未満", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-046", CB型("CB046", "300円未満", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-047", CB型("CB047", "300円未満", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-048", CB型("CB048", "300円未満", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-049", CB型("CB049", "300円未満", "JP/NM", 表記("COL")));
caseTest("IT-M07-09-050", CB同じ("CB050", "300円未満"));
caseTest("IT-M07-09-061", CB型("CB061", "300円以上3000円未満", "FoilJP/NM", 表記("AAA")));
caseTest("IT-M07-09-062", CB型("CB062", "300円以上3000円未満", "JP/NM", 表記("AAA")));

caseTest("IT-M07-09-063", async (ctx) => {
  const p = await 手順1から5(ctx, "CB063");
  await ctx.expected(async () => {
    note(閾値の注記(["3000円以上"]));
    expect.soft(仕訳の(p, "CB063", "A"), 仕訳の項目("CB063", "A", "3000円以上")).toContain(見出し("3000円以上"));
    expect.soft(仕訳の(p, "CB063", "B"), 仕訳の項目("CB063", "B", "サプライ")).toContain(見出し("サプライ"));
    const 以上 = p.行.findIndex((r) => r.仕訳.includes(見出し("3000円以上")));
    const サプライ = p.行.findIndex((r) => r.仕訳.includes(見出し("サプライ")));
    expect.soft(以上 >= 0 && サプライ >= 0 && 以上 < サプライ, `「3000円以上」の商品仕訳が「サプライ」の商品仕訳より先に表示される（最初の行: ${以上 + 1}行目・${サプライ + 1}行目）`).toBe(true);
    expect.soft(言語状態の(p, "CB063", "A"), `${名("CB063", "A")}の行の言語 / 状態`).toBe("JP/NM");
    expect.soft(商品名の(p, "CB063", "A"), `${名("CB063", "A")}の行の商品名（「${表記("AAA")}」は表示されない）`).toBe(品コード("CB063", "A"));
  });
});

caseTest("IT-M07-09-064", CB型("CB064", "3000円以上", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-065", CB型("CB065", "3000円以上", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-066", CB型("CB066", "3000円以上", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-067", CB型("CB067", "3000円以上", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-068", CB型("CB068", "3000円以上", "JP/NM", 表記("AAA")));
caseTest("IT-M07-09-069", CB型("CB069", "3000円以上", "JP/NM", 表記("COL")));
caseTest("IT-M07-09-070", CB同じ("CB070", "3000円以上"));
