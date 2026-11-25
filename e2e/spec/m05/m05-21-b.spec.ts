/**
 * M05-21 ピッキングリスト印刷の追加分: 基本の表示（001）・ピック数（012）・商品名の整形（013）・改ページ（021・022）・主明細と比較明細（CBPICK の11件）・並び順のケース（023〜025・027・028・062・066〜077）。正本: cases/M05-21_test_cases.tsv
 * 2026-11-23 追加。判定済みのケース（m05-21.spec.ts）の指紋を変えないため、別のファイルに書く。
 * 出荷指示リスト詳細で受注を選び、「ピッキングリスト印刷」で開いた画面の、980円未満のグループの行の順序・商品名欄・色/R欄・略称欄を確かめる。
 * 商品は M05-09 の並び順のケースと同じ作り（seeds/m05-09.ts の 並びの商品を作る）で、略称タグ・棚番号・試験用カードを印つきで作る
 * （依頼者決定 2026-11-14「マスタは作ってよい」）。商品名の先頭の [略称タグ] は、印つきの略称タグの名前で書いた（案A）。
 * 書かないもの: 026 はシード表の内部で食い違う（状態・属性は「レアリティなしの商品」、投入方法は2件ともレアリティR）。
 * 031・040・063〜065 は状態 EX を使い、開発環境のカード状態のマスタに EX が無い（判断待ち）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { PickingPrintPage, ピッキングのページ, ピッキングの行, ピッキングリストを読む } from "../../pages/admin/m05_21_picking";
import { M0521_ADMIN } from "../../seeds/m05-21";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 低 = "商品単位_980円未満";
const 行の文 = (pages: ピッキングのページ[]) => pages.map((p) => `【${p.見出し}】${p.行.map((r) => `${r.No}:${r.商品名}(略称 ${r.略称 || "空"}・色/R ${r.色R || "空"}・${r.数})`).join(" ")}`).join(" / ") || "（グループ無し）";

const 作りの補い = [
  "略称タグ・棚番号・試験用カードは印つきで作った（棚番号の名前は入力チェックを通らないので、E2E の棚番号の行だけ DB で正本の名前に書き換えた）。商品のカテゴリは「カード」へ付け替えず、グッズ商品CSV登録のカテゴリのまま（カードとサプライの分かれ目は、商品にカード詳細が付いているかで決まる）",
  "商品名の先頭の [略称タグ] は、印つきの略称タグの名前で書いた（ピッキングリストは商品の略称タグの名前で [〜] を取り除くため）。ほかの部分は正本の表記のまま",
  "色順（白＝順序1・青＝順序2）は、全員が使う色順のマスタを書き換えないため、開発環境に元からある色順「白」と「青」で読み替えた（白が青より前に並ぶ関係は正本と同じ）",
];

type 行の定め = {
  /** 期待の商品名欄の表示 */
  名: string;
  /** 期待の色/R欄（省略は確かめない。空文字は空） */
  色R?: string;
  /** 期待の略称欄（略称タグの名前。印を付けて比べる） */
  略称?: string;
};

/** 手順1〜4: 出荷指示リスト詳細を開き、受注を選び、ピッキングリスト印刷を押し、980円未満のグループの行の順序と商品名欄などを確かめる */
function 並びを見る(番号: string, 順: 行の定め[], 補い: string[] = []) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, notes, step, expected } = ctx;
    await loginAdmin(page, M0521_ADMIN);
    const p = new PickingPrintPage(page);
    let popup!: Page; let pages: ピッキングのページ[] = []; let 行: ピッキングの行[] = [];
    await step(1, async () => { expect(await p.詳細を開く(notes.get(`〔出荷指示リストID-M0521-${番号}〕`)), "出荷指示リスト詳細画面の応答").toBeLessThan(400); });
    await step(2, async () => {
      await p.受注を選ぶ([notes.get(`〔受注ID-M0521-${番号}〕`)]);
      note(`注文番号 ${notes.get(`〔注文番号-M0521-${番号}〕`)} の受注（受注ID ${notes.get(`〔受注ID-M0521-${番号}〕`)}）の行を選んだ`);
    });
    // 手順が3つのケース（023・024・027 など）は、印刷を押した手順の中で画面を読む。4つのケースは手順4で読む
    const 手順の数 = (ctx.c.手順.match(/(?:^|／)\s*\d+[.．]/g) ?? []).length;
    const 読む = async () => {
      pages = await ピッキングリストを読む(popup);
      行 = pages.filter((x) => x.グループ === 低).flatMap((x) => x.行);
      note(`ピッキングリスト印刷画面: ${行の文(pages)}`);
    };
    await step(3, async () => { popup = await p.印刷を押す(); if (手順の数 < 4) await 読む(); });
    if (手順の数 >= 4) await step(4, async () => { await 読む(); });
    await expected(async () => {
      for (const m of [...作りの補い, ...補い]) supplement(m);
      expect.soft(pages.some((x) => x.グループ === 低), `「${低}」のグループがある`).toBe(true);
      const names = 行.map((r) => r.商品名);
      const 位置 = 順.map((r) => names.indexOf(r.名));
      expect.soft(位置.every((i) => i >= 0), `${低}のグループに ${順.map((r) => `「${r.名}」`).join("・")} の行がある（商品名欄の表示）`).toBe(true);
      expect.soft(位置, `${低}のグループの行が ${順.map((r) => `「${r.名}」`).join("→")} の順`).toEqual([...位置].sort((a, b) => a - b));
      for (const r of 順) {
        const row = 行.find((x) => x.商品名 === r.名);
        if (r.色R !== undefined) expect.soft(row?.色R ?? "（行が無い）", `「${r.名}」の行の色/R欄`).toBe(r.色R);
        if (r.略称 !== undefined) expect.soft(row?.略称 ?? "（行が無い）", `「${r.名}」の行の略称欄（印つきの略称タグの名前）`).toBe(rc(r.略称));
      }
    });
  };
}

const 白R = (名: string): 行の定め => ({ 名, 色R: "白/R" });

caseTest("IT-M05-21-062", 並びを見る("062", [{ 名: "並び甲-M0521-CB062" }, { 名: "並び乙-M0521-CB062" }]));
caseTest("IT-M05-21-066", 並びを見る("066", [白R("末尾甲-M0521-CB066"), 白R("末尾乙-M0521-CB066")]));
caseTest("IT-M05-21-067", 並びを見る("067", [白R("角括弧甲-M0521-CB067 [注記甲]"), 白R("角括弧乙-M0521-CB067 [注記乙]")]));
caseTest("IT-M05-21-068", 並びを見る("068", [
  { 名: "前半甲-M0521-CB068 後半甲-M0521-CB068", 色R: "白/R", 略称: "M0521CB068A" },
  { 名: "前半乙-M0521-CB068 後半乙-M0521-CB068", 色R: "白/R", 略称: "M0521CB068B" },
], ["略称タグ M0521CB068A は並び順1、M0521CB068B は並び順2で登録した（シード表に並び順の定めが無いので、A を先にした）"]));
caseTest("IT-M05-21-069", 並びを見る("069", [
  { 名: "並び甲-M0521-CB069", 略称: "M0521CB069A" },
  { 名: "並び乙-M0521-CB069", 略称: "M0521CB069B" },
], ["略称タグ M0521CB069A は並び順1、M0521CB069B は並び順2で登録した（シード表に並び順の定めが無いので、A を先にした）"]));
caseTest("IT-M05-21-070", 並びを見る("070", [{ 名: "前半甲-M0521-CB070 後半甲-M0521-CB070" }, 白R("前半乙-M0521-CB070 後半乙-M0521-CB070")],
  ["甲の商品はシード表のとおりカード指定をしていない（カード詳細を持たない）"]));
caseTest("IT-M05-21-071", 並びを見る("071", [{ 名: "並び甲-M0521-CB071" }, { 名: "並び乙-M0521-CB071" }],
  ["甲の商品はシード表のとおりカード指定をしていない（カード詳細を持たない）"]));
caseTest("IT-M05-21-072", 並びを見る("072", [白R("前半甲-M0521-CB072 後半甲-M0521-CB072"), { 名: "前半乙-M0521-CB072 後半乙-M0521-CB072", 色R: "青/R" }]));
caseTest("IT-M05-21-073", 並びを見る("073", [{ 名: "並び甲-M0521-CB073" }, { 名: "並び乙-M0521-CB073" }]));
caseTest("IT-M05-21-074", 並びを見る("074", [白R("末尾甲-M0521-CB074"), 白R("末尾乙-M0521-CB074"), 白R("末尾丙-M0521-CB074")],
  ["英語カード名は印つきで登録した（印は名前の末尾に同じものが付くので、名前の順は変わらない）"]));
caseTest("IT-M05-21-075", 並びを見る("075", [{ 名: "並び甲-M0521-CB075" }, { 名: "並び乙-M0521-CB075" }, { 名: "並び丙-M0521-CB075" }],
  ["英語カード名は印つきで登録した（印は名前の末尾に同じものが付くので、名前の順は変わらない）"]));
caseTest("IT-M05-21-076", 並びを見る("076", [白R("括弧乙-M0521-CB076 (限定)"), 白R("括弧甲-M0521-CB076 (限定)")]));
caseTest("IT-M05-21-077", 並びを見る("077", [白R("角括弧乙-M0521-CB077 [注記乙]"), 白R("角括弧甲-M0521-CB077 [注記甲]")]));

const SORTの補い = "シード表がレアリティ・Foil の値を定めないカードは、レアリティ「レア」・Foil「なし」にした。試験用カードは商品ごとに1枚ずつ作った（シード表は1枚のカードにカード詳細を足す作りのものがある。並びはカード詳細の値で決まる）";
caseTest("IT-M05-21-023", 並びを見る("023", [{ 名: "M0521棚番カードA-023" }, { 名: "M0521棚番カードB-023" }], [SORTの補い]));
caseTest("IT-M05-21-024", 並びを見る("024", [{ 名: "M0521非Foilカード-024" }, { 名: "M0521Foilカード-024" }], [SORTの補い]));
caseTest("IT-M05-21-025", 並びを見る("025", [{ 名: "M0521略称カードAAA-025" }, { 名: "M0521略称カードBBB-025" }], [SORTの補い]));
caseTest("IT-M05-21-027", 並びを見る("027", [{ 名: "M0521神話カード-027" }, { 名: "M0521レアカード-027" }], [SORTの補い, "神話のカードはレアリティ「神話レア」（コード M）で登録した"]));

// 028: アルファベット順の略称タグ（M0521F1）かつカード番号ありの商品が先に、英語カード名の順（Alpha Card→Zulu Card）で並ぶ。
// アルファベット順でない略称タグ（M0521F0）の商品はカード番号の順（002→010）
caseTest("IT-M05-21-028", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, M0521_ADMIN);
  const p = new PickingPrintPage(page);
  let popup!: Page; let pages: ピッキングのページ[] = []; let 行: ピッキングの行[] = [];
  await step(1, async () => { expect(await p.詳細を開く(notes.get("〔出荷指示リストID-M0521-028〕")), "出荷指示リスト詳細画面の応答").toBeLessThan(400); });
  await step(2, async () => { await p.受注を選ぶ([notes.get("〔受注ID-M0521-028〕")]); });
  await step(3, async () => { popup = await p.印刷を押す(); });
  await step(4, async () => {
    pages = await ピッキングリストを読む(popup);
    行 = pages.filter((x) => x.グループ === 低).flatMap((x) => x.行);
    note(`ピッキングリスト印刷画面: ${行の文(pages)}`);
  });
  await expected(async () => {
    for (const m of [...作りの補い, SORTの補い,
      "商品名は、シード表の「カード指定で自動で入った値のまま」ではなく、行を見分けるため正本の商品名（M0521並びカード1〜5-028）にした。英語カード名・カード番号は商品ごとのカードに入れた",
      "英語カード名 Zulu Card・Alpha Card のカードのコレクターNo は、シード表に値が無いので 028001・028003 にした。カード番号なしのカード（3）の英語カード名は Middle Card にした"]) supplement(m);
    const names = 行.map((r) => r.商品名);
    const at = (n: number) => names.indexOf(`M0521並びカード${n}-028`);
    const [Z, A, N, F10, F02] = [1, 2, 3, 4, 5].map(at);
    expect.soft([Z, A, N, F10, F02].every((i) => i >= 0), `${低}のグループに5商品の行がある`).toBe(true);
    expect.soft(A < Z, "アルファベット順の略称タグの商品が英語カード名の順（Alpha Card→Zulu Card）").toBe(true);
    expect.soft([N, F10, F02].every((i) => Z < i && A < i), "アルファベット順かつカード番号ありの商品（Alpha Card・Zulu Card）が、アルファベット順でない商品・カード番号なしの商品より前").toBe(true);
    expect.soft(F02 < F10, "アルファベット順でない略称タグの商品がカード番号の順（002→010）").toBe(true);
  });
});

// 001: 選んだ受注（A）の明細の各欄（棚番号・Foil/言語/状態・略称・色/R・ピック数・商品名・価格）と、出荷指示リスト番号・作成日が出る
caseTest("IT-M05-21-001", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, M0521_ADMIN);
  const p = new PickingPrintPage(page);
  let popup!: Page; let pages: ピッキングのページ[] = [];
  await step(1, async () => { expect(await p.詳細を開く(notes.get("〔出荷指示リストID-M0521-001〕")), "出荷指示リスト詳細画面の応答").toBeLessThan(400); });
  await step(2, async () => { await p.受注を選ぶ([notes.get("〔受注ID-M0521-001A〕")]); note(`注文番号 ${notes.get("〔注文番号-M0521-001A〕")} の受注の行を選んだ`); });
  await step(3, async () => { popup = await p.印刷を押す(); });
  await step(4, async () => { pages = await ピッキングリストを読む(popup); note(`ピッキングリスト印刷画面: ${行の文(pages)}・出荷指示リスト番号 ${pages.map((x) => x.出荷指示リスト番号).join("・")}・作成日 ${pages.map((x) => x.作成日).join("・")}`); });
  await expected(async () => {
    for (const m of [...作りの補い, SORTの補い]) supplement(m);
    await expect.soft(popup.locator(".ContentsAll"), "ピッキングリスト印刷画面が表示された").toBeAttached();
    expect.soft(pages.length > 0 && pages.every((x) => x.出荷指示リスト番号 === notes.get("〔出荷指示リストID-M0521-001〕")), "出荷指示リスト番号").toBe(true);
    const 日 = (pages[0]?.作成日 ?? "").replace(/\D/g, "");
    expect.soft(日.startsWith("202609011020"), `作成日（シードの作成日 2026-09-01 10:20:30 に当たる日時。表示: ${pages[0]?.作成日 ?? "なし"}）`).toBe(true);
    const 行 = pages.flatMap((x) => x.行);
    const a = 行.find((r) => r.商品名 === "基本カード");
    expect.soft(!!a, "商品名「基本カード」の行がある").toBe(true);
    expect.soft(a?.棚番号 ?? "", "棚番号（印つきの A-01-M0521-001）").toBe(rc("A-01-M0521-001"));
    expect.soft(a?.言語状態 ?? "", "Foil・言語コード・状態コード").toBe("FoilJP/NM");
    expect.soft(a?.略称 ?? "", "略称（印つきの TST）").toBe(rc("TST"));
    expect.soft(a?.色R ?? "", "色名・レアリティコード").toBe("白/R");
    expect.soft(a?.数 ?? "", "ピック数").toBe("1");
    expect.soft((a?.価格 ?? "").replace(/[^0-9]/g, ""), `価格（表示: ${a?.価格 ?? "なし"}）`).toBe("1000");
    expect.soft(行.some((r) => r.商品名 === "未選択カード"), "選ばない受注（B）の明細は出ない").toBe(false);
  });
});

// 013: 受注詳細の商品名から略称・言語/状態・色/レアリティの表記が取り除かれる
caseTest("IT-M05-21-013", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, M0521_ADMIN);
  const p = new PickingPrintPage(page);
  let popup!: Page; let pages: ピッキングのページ[] = [];
  await step(1, async () => { expect(await p.詳細を開く(notes.get("〔出荷指示リストID-M0521-013〕")), "出荷指示リスト詳細画面の応答").toBeLessThan(400); });
  await step(2, async () => { await p.受注を選ぶ([notes.get("〔受注ID-M0521-013〕")]); note(`注文番号 ${notes.get("〔注文番号-M0521-013〕")} の受注の行を選んだ`); });
  await step(3, async () => { popup = await p.印刷を押す(); });
  await step(4, async () => { pages = await ピッキングリストを読む(popup); note(`ピッキングリスト印刷画面: ${行の文(pages)}`); });
  await expected(async () => {
    for (const m of [...作りの補い, SORTの補い]) supplement(m);
    const names = pages.flatMap((x) => x.行).map((r) => r.商品名);
    expect.soft(names, "商品名欄（略称・言語/状態・色/レアリティの表記を取り除いた「項目除去カード」だけ）").toEqual(["項目除去カード"]);
  });
});

// 021・022: 同じグループの明細が30行で改ページし、No. が通しで振られ、グループの合計は最後のページの最終行にだけ出る
function 改ページを見る(番号: string, 数: number) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, notes, step, expected } = ctx;
    await loginAdmin(page, M0521_ADMIN);
    const p = new PickingPrintPage(page);
    let popup!: Page; let pages: ピッキングのページ[] = [];
    await step(1, async () => { expect(await p.詳細を開く(notes.get(`〔出荷指示リストID-M0521-${番号}〕`)), "出荷指示リスト詳細画面の応答").toBeLessThan(400); });
    await step(2, async () => { await p.受注を選ぶ([notes.get(`〔受注ID-M0521-${番号}〕`)]); note(`注文番号 ${notes.get(`〔注文番号-M0521-${番号}〕`)} の受注の行を選んだ`); });
    await step(3, async () => {
      popup = await p.印刷を押す();
      pages = await ピッキングリストを読む(popup);
      note(`ピッキングリスト印刷画面: ${pages.map((x) => `【${x.見出し}】${x.行.length}行${x.合計 ? `・合計「${x.合計}」` : ""}`).join(" / ") || "（グループ無し）"}`);
    });
    await expected(async () => {
      supplement("試験用カードは1枚に商品の数だけカード詳細を足し、商品ごとに別のカード詳細を指定した（シード表は1件のカード詳細を全商品に指定する。グループはカード詳細の有無と価格で決まる）。商品のカテゴリは「カード」へ付け替えていない");
      const g = pages.filter((x) => x.グループ === 低);
      const 期待のページ数 = Math.ceil(数 / 30);
      expect.soft(pages.map((x) => x.グループ), `グループは「${低}」だけ`).toEqual(g.map(() => 低));
      expect.soft(g.map((x) => x.行.length), `ページごとの行の数（${数}明細）`).toEqual(Array.from({ length: 期待のページ数 }, (_, i) => Math.min(30, 数 - i * 30)));
      expect.soft(g.map((x) => x.ページ), "ページ表示").toEqual(Array.from({ length: 期待のページ数 }, (_, i) => `${i + 1}/${期待のページ数}`));
      expect.soft(g.flatMap((x) => x.行).map((r) => r.No), `No. が 1〜${数}`).toEqual(Array.from({ length: 数 }, (_, i) => String(i + 1)));
      expect.soft(g.map((x) => !!x.合計), "グループ合計は最後のページだけ").toEqual(g.map((_, i) => i === g.length - 1));
      const 合計 = (g[g.length - 1]?.合計 ?? "").replace(/\s/g, "");
      expect.soft(合計.includes(`${数}`), `最終行のグループ合計が ${数} 点（表示: ${g[g.length - 1]?.合計 ?? "なし"}）`).toBe(true);
    });
  };
}
caseTest("IT-M05-21-021", 改ページを見る("021", 30));
caseTest("IT-M05-21-022", 改ページを見る("022", 31));

// CBPICK: 主明細（X）の行の各欄と、比較明細（並び確認A・B）の並び（B→A）
const 中 = "商品単位_980円以上_4800円未満", 高 = "商品単位_4800円以上", サ = "サプライ";
type 主の期待 = { グループ: string; 名: string; 略称タグ?: string; 色R: string; 数: string; サプライ?: true };
function 主と比較を見る(番号: string, 主: 主の期待, 比較のグループ: string, opt: { 両方?: true; 補い?: string[] } = {}) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, notes, step, expected } = ctx;
    await loginAdmin(page, M0521_ADMIN);
    const p = new PickingPrintPage(page);
    const 受注 = opt.両方 ? [`〔受注ID-M0521-${番号}A〕`, `〔受注ID-M0521-${番号}B〕`] : [`〔受注ID-M0521-${番号}〕`];
    const 注文 = opt.両方 ? [`〔注文番号-M0521-${番号}A〕`, `〔注文番号-M0521-${番号}B〕`] : [`〔注文番号-M0521-${番号}〕`];
    let popup!: Page; let pages: ピッキングのページ[] = [];
    await step(1, async () => { expect(await p.詳細を開く(notes.get(`〔出荷指示リストID-M0521-${番号}〕`)), "出荷指示リスト詳細画面の応答").toBeLessThan(400); });
    await step(2, async () => { await p.受注を選ぶ(受注.map((k) => notes.get(k))); note(`注文番号 ${注文.map((k) => notes.get(k)).join("・")} の受注の行を選んだ`); });
    await step(3, async () => { popup = await p.印刷を押す(); });
    await step(4, async () => { pages = await ピッキングリストを読む(popup); note(`ピッキングリスト印刷画面: ${行の文(pages)}`); });
    await expected(async () => {
      for (const m of [...作りの補い, ...(opt.補い ?? [])]) supplement(m);
      const 名 = 主.略称タグ ? 主.名.replace(`[${主.略称タグ}]`, `[${rc(主.略称タグ)}]`) : 主.名;
      const 主の行 = pages.filter((x) => x.グループ === 主.グループ).flatMap((x) => x.行).filter((r) => r.商品名 === 名);
      expect.soft(主の行.length, `「${主.グループ}」のグループに商品名欄「${名}」の行が1行`).toBe(1);
      const r = 主の行[0];
      if (主.サプライ) {
        expect.soft(r?.言語状態 ?? "（行が無い）", "言語/状態欄").toBe("サプライ品");
        expect.soft(r?.略称 ?? "（行が無い）", "略称欄（空）").toBe("");
      } else {
        expect.soft(r?.略称 ?? "（行が無い）", "略称欄（印つきの略称タグの名前）").toBe(rc(`M0521-CB${番号}-T1`));
      }
      expect.soft(r?.色R ?? "（行が無い）", `色/R欄${主.色R ? "" : "（空）"}`).toBe(主.色R);
      expect.soft(r?.数 ?? "（行が無い）", "ピック数").toBe(主.数);
      const names = pages.filter((x) => x.グループ === 比較のグループ).flatMap((x) => x.行).map((x) => x.商品名);
      const [b, a] = [`M0521-CB${番号}-並びB`, `M0521-CB${番号}-並びA`].map((n) => names.indexOf(n));
      expect.soft(a >= 0 && b >= 0, `「${比較のグループ}」のグループに M0521-CB${番号}-並びA・並びB の行がある`).toBe(true);
      expect.soft(b < a, `「${比較のグループ}」のグループで M0521-CB${番号}-並びB→並びA の順`).toBe(true);
    });
  };
}
const 二件の補い = "2件の受注は、1件目に主明細と並び確認A・B、2件目に主明細だけを入れて続けて注文した";
caseTest("IT-M05-21-032", 主と比較を見る("032", { グループ: 高, 名: "M0521-CB032-角括弧カード [注記]", 色R: "白/R", 数: "1" }, 低));
caseTest("IT-M05-21-035", 主と比較を見る("035", { グループ: 低, 名: "M0521-CB035-前半[注記] 後半", 色R: "白/R", 数: "1" }, 高));
caseTest("IT-M05-21-036", 主と比較を見る("036", { グループ: サ, 名: "M0521-CB036-表記なしカード[注記]", 色R: "", 数: "1", サプライ: true }, 低));
caseTest("IT-M05-21-041", 主と比較を見る("041", { グループ: サ, 名: "[M0521-CB041-T1]M0521-CB041-角括弧カード 白/R[注記]", 略称タグ: "M0521-CB041-T1", 色R: "", 数: "2", サプライ: true }, 低,
  { 両方: true, 補い: [二件の補い, "並び確認B のカードは、カード詳細(登録)画面でレアリティを選んで登録したあと、E2E のカード詳細の行だけ DB でレアリティを外した（画面ではレアリティを外せない）"] }));
caseTest("IT-M05-21-042", 主と比較を見る("042", { グループ: サ, 名: "[M0521-CB042-T1]M0521-CB042-括弧カード[注記] 白/R(限定)", 略称タグ: "M0521-CB042-T1", 色R: "", 数: "1", サプライ: true }, 低));
caseTest("IT-M05-21-043", 主と比較を見る("043", { グループ: サ, 名: "[M0521-CB043-T1]M0521-CB043-角括弧カード 白/R[注記]", 略称タグ: "M0521-CB043-T1", 色R: "", 数: "1", サプライ: true }, 低));
caseTest("IT-M05-21-045", 主と比較を見る("045", { グループ: 低, 名: "M0521-CB045-表記なしカード[注記]", 色R: "", 数: "1" }, 高));
caseTest("IT-M05-21-046", 主と比較を見る("046", { グループ: 低, 名: "M0521-CB046-括弧カード[注記] (限定)", 色R: "白/R", 数: "2" }, 高, { 両方: true, 補い: [二件の補い] }));
caseTest("IT-M05-21-048", 主と比較を見る("048", { グループ: 中, 名: "M0521-CB048-末尾カード[注記]", 色R: "白/R", 数: "2" }, 低, { 両方: true, 補い: [二件の補い] }));
caseTest("IT-M05-21-060", 主と比較を見る("060", { グループ: 低, 名: "M0521-CB060-末尾カード[注記]", 色R: "白/R", 数: "1" }, 高));
caseTest("IT-M05-21-061", 主と比較を見る("061", { グループ: 低, 名: "M0521-CB061-角括弧カード [注記]", 色R: "白/R", 数: "1" }, 高));

// 012: 色数・カテゴリ数の違う2商品のピック数がどちらも2
caseTest("IT-M05-21-012", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, M0521_ADMIN);
  const p = new PickingPrintPage(page);
  let popup!: Page; let pages: ピッキングのページ[] = [];
  await step(1, async () => { expect(await p.詳細を開く(notes.get("〔出荷指示リストID-M0521-012〕")), "出荷指示リスト詳細画面の応答").toBeLessThan(400); });
  await step(2, async () => { await p.受注を選ぶ([notes.get("〔受注ID-M0521-012〕")]); note(`注文番号 ${notes.get("〔注文番号-M0521-012〕")} の受注の行を選んだ`); });
  await step(3, async () => { popup = await p.印刷を押す(); pages = await ピッキングリストを読む(popup); note(`ピッキングリスト印刷画面: ${行の文(pages)}`); });
  await expected(async () => {
    for (const m of [...作りの補い, SORTの補い, "商品のカテゴリ（「カード」を含む3件・2件）は、カテゴリ「カード」を最上位に作れないため、グッズのカテゴリ（番号2とその下）を3件・2件付けて読み替えた"]) supplement(m);
    const 行 = pages.flatMap((x) => x.行);
    for (const 名 of ["複数色数量カード", "色なし数量カード"]) {
      const r = 行.filter((x) => x.商品名 === 名);
      expect.soft(r.length, `「${名}」の行が1行`).toBe(1);
      expect.soft(r[0]?.数 ?? "（行が無い）", `「${名}」のピック数`).toBe("2");
    }
  });
});
