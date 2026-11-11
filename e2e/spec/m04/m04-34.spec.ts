/**
 * M04-34 戻しリストPDF（カードのマスタを使わない 001・003〜006・009・010・022・023・029〜045）。正本: cases/M04-34_test_cases.tsv
 * 実装しないケースは記録 review/M04-34_progress_2026-11-11_dev.md の振り分け（カードのマスタを新しく作る20件は判断待ち・002 は未着手）。
 * 店舗の高額商品閾値（金額閾値）は全員が使う設定。config/solo_cases.tsv で機能ごと1本だけで流し、ケースの開始時に書き換え、
 * 終わるたびに店舗ID 1・13 を控えた値へ戻して DB で確かめる。本店2F・本店B2F の代わりの店舗（E2E が作った店舗）は戻さない。
 */
import { Browser, test } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin, withAdminSession } from "../../lib/session";
import { 店舗の高額商品閾値 } from "../../db/m04_33";
import { ReturnListPage, setStoreThresholds } from "../../pages/admin/m04_33_return_list";
import { 全行, 戻しリスト, 戻しリストPDFを出力する } from "../../pages/admin/m04_34_return_list_pdf";
import { M0434_ADMIN, 入庫先, 入庫先の店舗ID, 印つきの名前, 作ったもの, 作った移動, 元の閾値, 支店, 本店3F } from "../../seeds/m04-34";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type 閾値の定め = { 店: 入庫先; 値: [string, string, string] };
const 金額閾値 = (店: 入庫先, 値: string): 閾値の定め => ({ 店, 値: [値, "", ""] });
const 閾値100_200 = (店: 入庫先): 閾値の定め => ({ 店, 値: ["100", "200", ""] });

async function 閾値を整える(browser: Browser, 定め: 閾値の定め[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const t of 定め) {
      const id = 入庫先の店舗ID(t.店);
      const 共有 = t.店 === "本店3F" || t.店 === "支店";
      await setStoreThresholds(page, id, t.値, `事前準備: 店舗ID ${id} の高額商品閾値を ${t.値.join("/")} にする（${共有 ? "全員が使う設定。終わりに戻す" : "E2E が作った店舗"}）`);
    }
  });
}
/** 店舗ID 1・13 の高額商品閾値を、控えた値へ戻して DB で確かめる */
async function 閾値を戻す(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const id of [本店3F, 支店]) {
      const v = 元の閾値.get(id);
      if (v) await setStoreThresholds(page, id, v, `終わりに: 店舗ID ${id} の高額商品閾値を元の ${v.join("/")} へ戻す（全員が使う設定）`);
    }
  });
  for (const id of [本店3F, 支店]) {
    const v = 元の閾値.get(id);
    if (v) expect(店舗の高額商品閾値(id), `全員が使う設定（店舗ID ${id} の高額商品閾値）を元の値へ戻せた`).toEqual(v);
  }
}

/** 呼び名の在庫移動・振替ID */
const 移動 = (key: string): string => {
  const id = 作った移動.get(`〔在庫移動・振替ID-M0434-${key}〕`);
  if (!id) throw new Error(`在庫移動 ${key} をシードが作っていない`);
  return id;
};
/** 正本の商品コードの、画面に出る商品名（印つき） */
const 名 = (code: string): string => {
  const m = 作ったもの.get(code);
  if (!m) throw new Error(`商品コード ${code} の商品をシードが作っていない`);
  return m.商品名;
};
const 行の = (list: 戻しリスト | null, code: string) => 全行(list).find((r) => r.商品名 === 名(code));
const 仕訳 = (list: 戻しリスト | null, code: string) => 行の(list, code)?.商品仕訳 ?? "（行が無い）";
const 名前の並び = (list: 戻しリスト | null) => 全行(list).map((r) => r.商品名);
const 読んだ = (list: 戻しリスト | null) => note(`ポップアップの戻しリスト: ${JSON.stringify(list?.ページ.map((p) => ({ 見出し: p.見出し, 作成日: p.作成日, 合計: p.合計, 行: p.行 })) ?? null)}`);

/** 一覧を開き（作成日・表示件数100件）、在庫移動の行を選ぶ */
async function 一覧で選ぶ(l: ReturnListPage, 日付: string, ids: string[]): Promise<void> {
  await l.作成日で検索する(日付, 日付);
  if (!(await l.表示件数を選ぶ("100"))) note("表示件数の選択欄に100件が無い（一覧の件数が少なく、選択欄が出ていない）");
  await l.選ぶ(ids);
}
async function 出力する(l: ReturnListPage): Promise<戻しリスト> {
  const dialogs: string[] = [];
  const list = await 戻しリストPDFを出力する(l, dialogs);
  if (!list) throw new Error(`戻しリストのポップアップが開かない（メッセージ: ${dialogs.join(" / ") || "なし"}）`);
  読んだ(list);
  return list;
}

type 確かめ = { 項目: string; 実際: (list: 戻しリスト | null) => unknown; 期待: unknown };
type 流しの定め = { 日付: string; 閾値: 閾値の定め[]; 選ぶ: string[]; 補い?: string };
/** 手順「1. 一覧を開く／2. 行だけを選ぶ／3. 戻しリストPDF出力を押す（／4. ポップアップを確かめる）」の流し */
function 戻しリストPDF(d: 流しの定め, 確かめ: 確かめ[]) {
  return async ({ page, browser, c, step, expected }: CaseCtx): Promise<void> => {
    if (d.補い) supplement(d.補い);
    const 手順の数 = c.手順.split(/／(?=\d+\.\s)/).length;
    let list = null as 戻しリスト | null;
    try {
      await 閾値を整える(browser, d.閾値);
      await loginAdmin(page, M0434_ADMIN.account);
      const l = new ReturnListPage(page);
      await step(1, async () => {
        await l.作成日で検索する(d.日付, d.日付);
        if (!(await l.表示件数を選ぶ("100"))) note("表示件数の選択欄に100件が無い（一覧の件数が少なく、選択欄が出ていない）");
      });
      await step(2, async () => { await l.選ぶ(d.選ぶ.map(移動)); });
      await step(3, async () => { list = await 出力する(l); });
      if (手順の数 >= 4) await step(4, async () => { await list!.画面.bringToFront(); note(`商品仕訳を上から: ${list!.ページ.map((p) => p.見出し).join(" → ")}`); });
      await expected(async () => {
        await list!.画面.bringToFront();
        for (const k of 確かめ) expect.soft(k.実際(list), k.項目).toEqual(k.期待);
      });
    } finally { await 閾値を戻す(browser); }
  };
}
const 仕訳が = (code: string, 項目: string, 期待: string): 確かめ => ({ 項目, 実際: (list) => 仕訳(list, code), 期待 });
const 本店4800 = [金額閾値("本店3F", "4800")];

caseTest("IT-M04-34-001", 戻しリストPDF({ 日付: "2034-04-01", 閾値: 本店4800, 選ぶ: ["001A"] }, [
  { 項目: "ポップアップに選択商品Aが表示される", 実際: (list) => 名前の並び(list).includes(名("M0434-P001-A")), 期待: true },
  { 項目: "ポップアップに選択商品Bが表示される", 実際: (list) => 名前の並び(list).includes(名("M0434-P001-B")), 期待: true },
  { 項目: "ポップアップに非選択商品-001が表示されない", 実際: (list) => 名前の並び(list).includes(名("M0434-P001-C")), 期待: false },
]));

caseTest("IT-M04-34-003", 戻しリストPDF({ 日付: "2034-04-03", 閾値: 本店4800, 選ぶ: ["003"] }, [
  仕訳が("M0434-P003-A", "基準価格4799円の境界下商品-003の商品仕訳", "4800円未満"),
  仕訳が("M0434-P003-B", "基準価格4800円の境界値商品-003の商品仕訳", "4800円以上"),
]));

caseTest("IT-M04-34-004", async ({ page, browser, step, expected }) => {
  let 本店 = null as 戻しリスト | null;
  let 支店の = null as 戻しリスト | null;
  try {
    await 閾値を整える(browser, [金額閾値("本店3F", "4800"), 金額閾値("支店", "6000")]);
    await loginAdmin(page, M0434_ADMIN.account);
    const l = new ReturnListPage(page);
    await step(1, async () => {
      await l.作成日で検索する("2034-04-04", "2034-04-04");
      if (!(await l.表示件数を選ぶ("100"))) note("表示件数の選択欄に100件が無い（一覧の件数が少なく、選択欄が出ていない）");
      for (const k of ["004A", "004B"]) await expect(l.row(移動(k)), `在庫移動・振替ID ${移動(k)} の行が同じ一覧ページにある`).toHaveCount(1);
    });
    await step(2, async () => { await l.選ぶ([移動("004A")]); 本店 = await 出力する(l); });
    await step(3, async () => {
      note(`本店3F の商品仕訳: ${仕訳(本店, "M0434-P004-A")}`);
      await 本店!.画面.close();
    });
    await step(4, async () => {
      await page.bringToFront();
      await l.選ぶ([移動("004B")]);
      await expect(l.check(移動("004A")), `在庫移動・振替ID ${移動("004A")} の選択を外した`).not.toBeChecked();
      支店の = await 出力する(l);
    });
    await expected(async () => {
      expect.soft(仕訳(本店, "M0434-P004-A"), "本店3F の戻しリストで、基準価格5500円の商品の商品仕訳").toBe("4800円以上");
      expect.soft(仕訳(支店の, "M0434-P004-B"), "支店A の戻しリストで、基準価格5500円の商品の商品仕訳").toBe("6000円未満");
    });
  } finally { await 閾値を戻す(browser); }
});

caseTest("IT-M04-34-005", 戻しリストPDF({ 日付: "2034-04-05", 閾値: 本店4800, 選ぶ: ["005"] }, [
  仕訳が("M0434-P005-A", "セール中商品-005の商品仕訳（基準価格による）", "4800円以上"),
  { 項目: "セール中商品-005の価格（基準価格4800。セール価格3000ではない）", 実際: (list) => 行の(list, "M0434-P005-A")?.価格 ?? "（行が無い）", 期待: "4800" },
]));

caseTest("IT-M04-34-006", 戻しリストPDF({ 日付: "2034-04-06", 閾値: 本店4800, 選ぶ: ["006"] }, [
  { 項目: "商品仕訳の並び（上から）", 実際: (list) => list?.ページ.map((p) => p.商品仕訳), 期待: ["4800円未満", "4800円以上", "サプライ"] },
]));

caseTest("IT-M04-34-009", 戻しリストPDF({ 日付: "2034-04-09", 閾値: 本店4800, 選ぶ: ["009"] }, [
  { 項目: "サプライ表示商品-009の言語 / 状態", 実際: (list) => 行の(list, "M0434-P009-A")?.言語状態 ?? "（行が無い）", 期待: "サプライ品" },
  { 項目: "サプライ表示商品-009の略称（表示されない）", 実際: (list) => 行の(list, "M0434-P009-A")?.略称 ?? "（行が無い）", 期待: "" },
  { 項目: "サプライ表示商品-009の色 / R（表示されない）", 実際: (list) => 行の(list, "M0434-P009-A")?.色R ?? "（行が無い）", 期待: "" },
]));

caseTest("IT-M04-34-010", 戻しリストPDF({ 日付: "2034-04-10", 閾値: 本店4800, 選ぶ: ["010"] }, [
  { 項目: "非シングル商品-010の色 / R（表示されない）", 実際: (list) => 行の(list, "M0434-P010-A")?.色R ?? "（行が無い）", 期待: "" },
]));

/** 作成日時（"YYYY/MM/DD HH:MM:SS"・日本時間）を秒の数にする */
const 秒 = (s: string): number => {
  const m = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(s.trim());
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5], +m[6]) / 1000 : NaN;
};
const 日本時間 = (ms: number): string => new Date(ms + 9 * 3600_000).toISOString().replace("T", " ").slice(0, 19).replace(/-/g, "/");
caseTest("IT-M04-34-022", async ({ page, browser, step, expected }) => {
  let t1 = 0, t4 = 0;
  let list = null as 戻しリスト | null;
  try {
    await 閾値を整える(browser, 本店4800);
    await loginAdmin(page, M0434_ADMIN.account);
    const l = new ReturnListPage(page);
    await step(1, async () => { t1 = Date.now(); note(`手順1の現在日時: ${日本時間(t1)}`); });
    await step(2, async () => {
      await l.作成日で検索する("2034-04-22", "2034-04-22");
      if (!(await l.表示件数を選ぶ("100"))) note("表示件数の選択欄に100件が無い（一覧の件数が少なく、選択欄が出ていない）");
    });
    await step(3, async () => { await l.選ぶ([移動("022")]); list = await 出力する(l); });
    await step(4, async () => { t4 = Date.now(); note(`手順4の現在日時: ${日本時間(t4)}`); });
    await expected(async () => {
      const 作成日 = list!.ページ.map((p) => p.作成日);
      note(`戻しリストの作成日: ${作成日.join("・")}`);
      const s = 秒(作成日[0] ?? "");
      expect.soft(作成日.length > 0 && 作成日.every((x) => x === 作成日[0]), "戻しリストの全ページに同じ作成日時が表示される").toBe(true);
      expect.soft(s >= Math.floor(t1 / 1000) && s <= Math.ceil(t4 / 1000), `作成日時「${作成日[0] ?? ""}」が手順1（${日本時間(t1)}）から手順4（${日本時間(t4)}）までの日時`).toBe(true);
    });
  } finally { await 閾値を戻す(browser); }
});

caseTest("IT-M04-34-023", 戻しリストPDF({ 日付: "2034-04-23", 閾値: 本店4800, 選ぶ: ["023"] }, [
  {
    項目: "選択商品Aと選択商品Bを含む金額閾値グループのページ数（ページ/総ページ）",
    実際: (list) => {
      const g = (list?.ページ ?? []).filter((p) => p.行.some((r) => r.商品名 === 名("M0434-P023-A") || r.商品名 === 名("M0434-P023-B")));
      return g.map((p) => `${p.ページ}/${p.総ページ}`);
    },
    期待: ["1/1"],
  },
  {
    項目: "選択商品Aと選択商品Bが同じページにある",
    実際: (list) => (list?.ページ ?? []).some((p) => p.行.some((r) => r.商品名 === 名("M0434-P023-A")) && p.行.some((r) => r.商品名 === 名("M0434-P023-B"))),
    期待: true,
  },
]));

caseTest("IT-M04-34-029", 戻しリストPDF({ 日付: "2034-04-29", 閾値: 本店4800, 選ぶ: ["029A", "029B"] }, [
  { 項目: "ポップアップに複数選択商品Aが表示される", 実際: (list) => 名前の並び(list).includes(名("M0434-P029-A")), 期待: true },
  { 項目: "ポップアップに複数選択商品Bが表示される", 実際: (list) => 名前の並び(list).includes(名("M0434-P029-B")), 期待: true },
  { 項目: "ポップアップの商品の数（2商品）", 実際: (list) => 全行(list).length, 期待: 2 },
]));

caseTest("IT-M04-34-030", 戻しリストPDF({ 日付: "2034-04-30", 閾値: 本店4800, 選ぶ: ["030"] }, [
  { 項目: "数量1確認商品-030の行の数", 実際: (list) => 行の(list, "M0434-P030-A")?.数 ?? "（行が無い）", 期待: "1" },
]));

/** 031〜044: 確認商品 M0434-CBxxx の商品仕訳と行（棚番号・サプライなら言語 / 状態と略称） */
const 店の補い = "本店2F・本店B2F は、ケースごとに店舗種別「本店」の店舗を作らず、E2E が作った「本店2F（M04-33）」「本店B2F（M04-33）」（店舗種別は支店）を使い回した。" +
  "全員が使う本店の判定に関わるので、店舗種別を本店にしていない";
function CB(番号: string, 日: string, 店: 入庫先, 期待の仕訳: string, サプライ: boolean, 棚番号あり: boolean): [流しの定め, 確かめ[]] {
  const n = `CB${番号}`;
  const code = `M0434-${n}-P`;
  const 行 = (list: 戻しリスト | null) => 行の(list, code);
  const 確: 確かめ[] = [
    { 項目: `確認商品M0434-${n}の商品仕訳`, 実際: (list) => 仕訳(list, code), 期待: 期待の仕訳 },
    ...(サプライ ? [
      { 項目: "その行の言語 / 状態", 実際: (list: 戻しリスト | null) => 行(list)?.言語状態 ?? "（行が無い）", 期待: "サプライ品" },
      { 項目: "その行の略称（表示されない）", 実際: (list: 戻しリスト | null) => 行(list)?.略称 ?? "（行が無い）", 期待: "" },
    ] : []),
    {
      項目: 棚番号あり ? `その行の棚番号（M0434-${n}-SH）` : "その行の棚番号（表示されない）",
      実際: (list) => 行(list)?.棚番号 ?? "（行が無い）", 期待: 棚番号あり ? 印つきの名前(`M0434-${n}-SH`) : "",
    },
  ];
  return [{
    日付: `2034-05-${日}`, 閾値: [閾値100_200(店)], 選ぶ: [n], 補い: 店 === "共有A" || 店 === "共有B" ? 店の補い : undefined,
  }, 確];
}
caseTest("IT-M04-34-031", 戻しリストPDF(...CB("031", "01", "本店3F", "100円未満", false, true)));
caseTest("IT-M04-34-032", 戻しリストPDF(...CB("032", "02", "本店3F", "100円以上200円未満", false, true)));
caseTest("IT-M04-34-033", 戻しリストPDF(...CB("033", "03", "本店3F", "サプライ", true, true)));
caseTest("IT-M04-34-034", 戻しリストPDF(...CB("034", "04", "共有A", "100円未満", false, true)));
caseTest("IT-M04-34-035", 戻しリストPDF(...CB("035", "05", "共有A", "100円以上200円未満", false, true)));
caseTest("IT-M04-34-036", 戻しリストPDF(...CB("036", "06", "共有A", "200円以上", false, true)));
caseTest("IT-M04-34-037", 戻しリストPDF(...CB("037", "07", "共有A", "サプライ", true, true)));
caseTest("IT-M04-34-038", 戻しリストPDF(...CB("038", "08", "共有B", "100円未満", false, true)));
caseTest("IT-M04-34-039", 戻しリストPDF(...CB("039", "09", "共有B", "100円以上200円未満", false, true)));
caseTest("IT-M04-34-040", 戻しリストPDF(...CB("040", "10", "共有B", "200円以上", false, true)));
caseTest("IT-M04-34-041", 戻しリストPDF(...CB("041", "11", "共有B", "サプライ", true, true)));
caseTest("IT-M04-34-042", 戻しリストPDF(...CB("042", "12", "支店", "100円以上200円未満", false, false)));
caseTest("IT-M04-34-043", 戻しリストPDF(...CB("043", "13", "支店", "200円以上", false, false)));
caseTest("IT-M04-34-044", 戻しリストPDF(...CB("044", "14", "支店", "サプライ", true, false)));

caseTest("IT-M04-34-045", 戻しリストPDF({ 日付: "2034-07-01", 閾値: [金額閾値("支店", "6000")], 選ぶ: ["045"] }, [
  { 項目: "支店Aの戻しリストの商品仕訳の並び（上から）", 実際: (list) => list?.ページ.map((p) => p.商品仕訳), 期待: ["6000円未満", "6000円以上", "サプライ"] },
]));
