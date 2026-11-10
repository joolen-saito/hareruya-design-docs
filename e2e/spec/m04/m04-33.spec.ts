/**
 * M04-33 戻しリストCSV（カードのマスタを使わない 003〜006・012・037〜041・043・046・049）。正本: cases/M04-33_test_cases.tsv
 * 実装しないケースは記録 review/M04-33_progress_2026-11-11_dev.md の振り分け（カードのマスタを新しく作る36件は判断待ち）。
 * 店舗の高額商品閾値は≪共有の設定≫。基盤が1本だけで流し、ケースの開始時に書き換え、終わるたびに店舗ID 1・13 を控えた値へ戻して DB で確かめる。
 */
import { Browser, test } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin, withAdminSession } from "../../lib/session";
import { 店舗の高額商品閾値 } from "../../db/m04_33";
import { ReturnListPage, setStoreThresholds } from "../../pages/admin/m04_33_return_list";
import { M0433_ADMIN, 印つきの名前, 元の閾値, 共有店舗ID, 作ったもの, 支店, 本店3F } from "../../seeds/m04-33";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

type 閾値の定め = { 店: "本店3F" | "共有A" | "共有B" | "支店"; 値: [string, string, string] };
const 店舗IDの = (k: 閾値の定め["店"]): string => (k === "本店3F" ? 本店3F : k === "支店" ? 支店 : 共有店舗ID[k === "共有A" ? "A" : "B"]);

async function 閾値を整える(browser: Browser, 定め: 閾値の定め[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const t of 定め) await setStoreThresholds(page, 店舗IDの(t.店), t.値, `事前準備: 店舗ID ${店舗IDの(t.店)} の高額商品閾値を ${t.値.join("/")} にする（共有の設定）`);
  });
}
/** 店舗ID 1・13 の高額商品閾値を、控えた値へ戻して DB で確かめる */
async function 閾値を戻す(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const id of [本店3F, 支店]) {
      const v = 元の閾値.get(id);
      if (!v) continue;
      await setStoreThresholds(page, id, v, `終わりに: 店舗ID ${id} の高額商品閾値を元の ${v.join("/")} へ戻す（共有の設定）`);
    }
  });
  for (const id of [本店3F, 支店]) {
    const v = 元の閾値.get(id);
    if (v) expect(店舗の高額商品閾値(id), `共有の設定（店舗ID ${id} の高額商品閾値）を元の値へ戻せた`).toEqual(v);
  }
}

/** 正本の商品コードの在庫移動ID */
const 移動 = (code: string): string => {
  const m = 作ったもの.get(code);
  if (!m?.在庫移動ID) throw new Error(`商品コード ${code} の在庫移動をシードが作っていない`);
  return m.在庫移動ID;
};
const 名 = (code: string): string => 作ったもの.get(code)!.商品名;
const 行の = (rows: Record<string, string>[], code: string) => rows.find((r) => r["商品名"] === 名(code) || r["商品名"]?.startsWith(名(code).replace(/\[[^\]]*\]$/, "")));

type 流しの定め = { 日付: string; 閾値: 閾値の定め[]; 選ぶ: string[]; 補い?: string };
/** 期待結果の確かめ1つ（項目は業務の言葉。実際の値は CSV のデータ行から取る） */
type 確かめの定め = { 項目: string; 実際: (rows: Record<string, string>[]) => unknown; 期待: unknown };
/** 一覧を開き（作成日・表示件数100件）、在庫移動を選んで戻しリストCSVを出力し、CSVを読む（手順1〜4） */
function 戻しリスト(d: 流しの定め, 確かめ: 確かめの定め[]) {
  return async ({ page, browser, step, expected }: CaseCtx): Promise<void> => {
    if (d.補い) supplement(d.補い);
    let rows: Record<string, string>[] = [];
    try {
      await 閾値を整える(browser, d.閾値);
      await loginAdmin(page, M0433_ADMIN.account);
      const l = new ReturnListPage(page);
      await step(1, async () => {
        await l.作成日で検索する(d.日付, d.日付);
        if (!(await l.表示件数を選ぶ("100"))) note("表示件数の選択欄に100件が無い（一覧の件数が少なく、選択欄が出ていない）");
      });
      await step(2, async () => { await l.選ぶ(d.選ぶ.map(移動)); });
      let out!: Awaited<ReturnType<ReturnListPage["戻しリストCSVを出力する"]>>;
      await step(3, async () => { out = await l.戻しリストCSVを出力する(); });
      await step(4, async () => { rows = out.行; note(`ダウンロードしたCSV ${out.ファイル名}: 見出し ${out.見出し.join("・")}／データ行 ${JSON.stringify(rows)}`); });
      await expected(async () => {
        for (const c of 確かめ) expect.soft(c.実際(rows), c.項目).toEqual(c.期待);
      });
    } finally { await 閾値を戻す(browser); }
  };
}
const 区分 = (rows: Record<string, string>[], code: string) => 行の(rows, code)?.["ピッキング区分"] ?? "（行が無い）";
const 区分が = (code: string, 項目: string, 期待: string): 確かめの定め => ({ 項目, 実際: (rows) => 区分(rows, code), 期待 });

caseTest("IT-M04-33-003", 戻しリスト(
  { 日付: "2033-04-03", 閾値: [{ 店: "本店3F", 値: ["100", "200", "300"] }], 選ぶ: ["A", "B", "C", "D", "E"].map((s) => `M0433-P003-${s}`) },
  [
    区分が("M0433-P003-A", "基準価格99の商品のピッキング区分", "100円未満"),
    区分が("M0433-P003-B", "基準価格100の商品のピッキング区分", "100円以上200円未満"),
    区分が("M0433-P003-C", "基準価格200の商品のピッキング区分", "200円以上300円未満"),
    区分が("M0433-P003-D", "基準価格300の商品のピッキング区分", "300円以上"),
    区分が("M0433-P003-E", "サプライ品のピッキング区分", "サプライ"),
  ]));

caseTest("IT-M04-33-004", 戻しリスト(
  { 日付: "2033-04-04", 閾値: [{ 店: "本店3F", 値: ["4800", "", ""] }], 選ぶ: ["M0433-P004-A"] },
  [
    { 項目: "セール価格確認カードの基準価格（セール価格3000ではない）", 実際: (rows) => 行の(rows, "M0433-P004-A")?.["基準価格"] ?? "（行が無い）", 期待: "4800" },
    区分が("M0433-P004-A", "セール価格確認カードのピッキング区分", "4800円以上"),
  ]));

caseTest("IT-M04-33-005", async ({ page, browser, step, expected }) => {
  const 店ごと = [["M0433-P005-A", "3F"], ["M0433-P005-B", "2F"], ["M0433-P005-C", "B2F"], ["M0433-P005-D", "支店"]] as const;
  const csv = new Map<string, Record<string, string>[]>();
  try {
    await 閾値を整える(browser, [
      { 店: "本店3F", 値: ["4800", "", ""] }, { 店: "共有A", 値: ["3000", "", ""] }, { 店: "共有B", 値: ["2000", "", ""] }, { 店: "支店", 値: ["1000", "", ""] },
    ]);
    await loginAdmin(page, M0433_ADMIN.account);
    const l = new ReturnListPage(page);
    const 出す = async (code: string) => {
      await l.作成日で検索する("2033-04-05", "2033-04-05");
      await l.表示件数を選ぶ("100");
      await l.選ぶ([移動(code)]);
      const out = await l.戻しリストCSVを出力する();
      csv.set(code, out.行);
      note(`${code} のCSV ${out.ファイル名}: ${JSON.stringify(out.行)}`);
    };
    await step(1, async () => { await l.作成日で検索する("2033-04-05", "2033-04-05"); await l.表示件数を選ぶ("100"); });
    await step(2, async () => { await 出す("M0433-P005-A"); });
    await step(3, async () => { await 出す("M0433-P005-B"); });
    await step(4, async () => { await 出す("M0433-P005-C"); await 出す("M0433-P005-D"); });
    await step(5, async () => { note(`4ファイルを読んだ: ${[...csv.keys()].join("・")}`); });
    await expected(async () => {
      const want: Record<string, string> = { "3F": "4800円未満", "2F": "3000円未満", "B2F": "2000円以上", "支店": "1000円以上" };
      for (const [code, 先] of 店ごと) expect.soft(区分(csv.get(code) ?? [], code), `${先}向けCSVの基準価格2500の商品のピッキング区分`).toBe(want[先]);
    });
  } finally { await 閾値を戻す(browser); }
});

caseTest("IT-M04-33-006", 戻しリスト(
  { 日付: "2033-04-06", 閾値: [{ 店: "本店3F", 値: ["4800", "", ""] }], 選ぶ: ["M0433-P006-A", "M0433-P006-B"] },
  [
    区分が("M0433-P006-A", "基準価格4799の商品のピッキング区分", "4800円未満"),
    区分が("M0433-P006-B", "基準価格4800の商品のピッキング区分", "4800円以上"),
  ]));

caseTest("IT-M04-33-012", 戻しリスト(
  { 日付: "2033-04-12", 閾値: [{ 店: "本店3F", 値: ["100", "200", ""] }], 選ぶ: ["A", "B", "C", "D"].map((s) => `M0433-P012-${s}`) },
  [{ 項目: "データ行のピッキング区分の並び", 実際: (rows) => rows.map((r) => r["ピッキング区分"]), 期待: ["100円未満", "100円以上200円未満", "200円以上", "サプライ"] }]));

caseTest("IT-M04-33-037", 戻しリスト(
  { 日付: "2033-04-07", 閾値: [{ 店: "本店3F", 値: ["4800", "", ""] }], 選ぶ: ["M0433-P037-A"] },
  [{ 項目: "数量1確認カードのデータ行の数", 実際: (rows) => 行の(rows, "M0433-P037-A")?.["数"] ?? "（行が無い）", 期待: "1" }]));

/** サプライの1行（038〜049）の流しと確かめ */
function サプライ(番号: string, 日付: string, 閾値: 閾値の定め, 棚番号あり: boolean, 期待の商品名: string, 補い?: string): [流しの定め, 確かめの定め[]] {
  const 一行目 = (rows: Record<string, string>[]) => rows[0] ?? {};
  return [{ 日付, 閾値: [閾値], 選ぶ: [`M0433-P${番号}-A`], 補い }, [
    { 項目: "CSVのデータ行の数（1行だけ）", 実際: (rows) => rows.length, 期待: 1 },
    { 項目: "ピッキング区分", 実際: (rows) => 一行目(rows)["ピッキング区分"] ?? "", 期待: "サプライ" },
    { 項目: 棚番号あり ? "棚番号" : "棚番号の列（空）", 実際: (rows) => 一行目(rows)["棚番号"] ?? "", 期待: 棚番号あり ? 印つきの名前(`M0433-SH-CB${番号}`) : "" },
    { 項目: "言語/状態", 実際: (rows) => 一行目(rows)["言語/状態"] ?? "", 期待: "サプライ品" },
    { 項目: "略称（空）", 実際: (rows) => 一行目(rows)["略称"] ?? "（列が無い）", 期待: "" },
    { 項目: "商品名", 実際: (rows) => 一行目(rows)["商品名"] ?? "", 期待: 期待の商品名 },
  ]];
}
const 名前 = (s: string) => 印つきの名前(s);
const 店の補い = "共有A／共有B の店舗は「本店2F（M04-33）」「本店B2F（M04-33）」（店舗種別は支店）で作った。正本の「店名を本店2F・店舗種別を本店」は、全員が使う本店の判定に関わるので書き換えていない（ケースは店名・店舗種別を見ない）";
caseTest("IT-M04-33-038", 戻しリスト(...サプライ("038", "2033-05-07", { 店: "本店3F", 値: ["100", "200", ""] }, true, 名前("スリーブM0433-CB038-A[M0433-CB038-TAG]"))));
caseTest("IT-M04-33-039", 戻しリスト(...サプライ("039", "2033-05-08", { 店: "本店3F", 値: ["100", "200", ""] }, true, 名前("スリーブM0433-CB039-A"))));
caseTest("IT-M04-33-040", 戻しリスト(...サプライ("040", "2033-05-09", { 店: "支店", 値: ["700", "800", ""] }, false, 名前("スリーブM0433-CB040-A[M0433-CB040-TAG]"))));
caseTest("IT-M04-33-041", 戻しリスト(...サプライ("041", "2033-05-10", { 店: "支店", 値: ["700", "800", ""] }, false, 名前("スリーブM0433-CB041-A"))));
caseTest("IT-M04-33-043", 戻しリスト(...サプライ("043", "2033-05-12", { 店: "共有A", 値: ["300", "400", ""] }, true, 名前("スリーブM0433-CB043-A"), 店の補い)));
caseTest("IT-M04-33-046", 戻しリスト(...サプライ("046", "2033-05-15", { 店: "共有B", 値: ["500", "600", ""] }, true, 名前("スリーブM0433-CB046-A[M0433-CB046-TAG]"), 店の補い)));
caseTest("IT-M04-33-049", 戻しリスト(...サプライ("049", "2033-05-18", { 店: "共有A", 値: ["300", "400", ""] }, true, 名前("スリーブM0433-CB049-A[M0433-CB049-TAG]"), 店の補い)));
