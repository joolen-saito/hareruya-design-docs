/**
 * F10-03 閲覧商品の連携（フロント アクセス解析）。正本: cases/F10-03_test_cases.tsv
 *
 * - 「ブラウザの開発者ツールのコンソールで受け渡し領域（dataLayer）の内容を表示する」は、ページの中で受け渡し領域の値を読み出して代える
 *   （F10-01 と同じ）。読んだ中身は手順の注記に残す。
 * - 「商品名F1003-001-Aの商品詳細画面を開く」は、シードが控えた、その商品名（実行の印つき）の商品の商品IDで商品詳細画面を開く。
 * - 「商品規格NM（SP）を選んで」: グッズの商品の商品詳細には状態の欄が出ないので、その商品規格の行の数量の欄に数量を入れ、ほかの行の数量を0にして選ぶ。
 * - 「画面上で商品規格／表示言語を切り替える」: 画面の切替の操作（状態の欄のリンク・言語のボタン）を押す。画面に無ければ手順が実行できないとして落とす。
 * - 値の比べ方: 「その値が X」は値の文字で比べる。「数値の X」「数値の配列」は型も含めて比べる（文字の "500" は数値の 500 と違う）。
 * 実装しないケース（記録 review/F10-03_progress_2026-11-10.md・2026-11-11）: 025・026・029・030・038・040〜043・053〜056（特定の商品が索引に載る前提。既存の商品で代えると期待を弱める）、
 * 046（共有のページ＝買い物かご画面のレイアウトへ試験用ブロックを置く。共有のレイアウトは書き換えない）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 商品の公開状態, 商品名で検索して編集を開く, 商品規格の表 } from "../../pages/admin/f10_03_setup";
import { FrontRestock } from "../../pages/front/f03_07_restock_notify";
import { FrontFavorite } from "../../pages/front/f03_08_favorite";
import {
  ご利用規約を開く, 入口, 入荷待ち商品一覧のリンク, 再計算ボタン, 受け渡し領域の要素, 商品詳細を開く, 数量の加算を押す, 数量を入れてカートに入れる,
  画面で商品規格を切り替える, 画面で言語を切り替える, 買い物かごの明細, 買い物かごを開く, 項目を持つ要素, 読んだ領域,
} from "../../pages/front/f10_03_retargeting";
import { FrontProductList, 店舗の入口 } from "../../pages/front/f03_01_product_list";
import { F1003_GF_ADMIN, 検索語の値, メールの値, パスワードの値, 商品名, 規格IDの値 } from "../../seeds/f10-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 受け渡し領域を読み、中身を注記に残す（コンソールで表示する代わり） */
async function 表示する(page: Page): Promise<読んだ領域> {
  const d = await 受け渡し領域の要素(page);
  note(`受け渡し領域（${new URL(page.url()).pathname}）: ${d.配列か ? `配列・${d.要素.length}要素 ${d.要素.map((e) => e.文).join(" , ").slice(0, 2000)}` : `配列でない（型 ${d.型}）`}`);
  return d;
}

const 並びの文 = (v: unknown): string => (Array.isArray(v) ? v.map(String).join("、") : `（並びでない: ${JSON.stringify(v)}）`);
const 値の文 = (v: unknown): string => (v === undefined ? "（無い）" : typeof v === "object" ? JSON.stringify(v) : String(v));
/** 項目を持つ要素の、その項目の値（積まれた順） */
const 値の並び = (d: 読んだ領域, 項目名: string): unknown[] => 項目を持つ要素(d, 項目名).map((e) => e.値[項目名]);
const 値の一覧 = (d: 読んだ領域, 項目名: string): string => 値の並び(d, 項目名).map(値の文).join(" / ") || "なし";

/** 商品詳細画面を開き、数量を入れて「カートに入れる」を押す */
async function 詳細でカートに入れる(page: Page, 店: 入口, 商品ID: string, a: { 数量: number; 規格ID?: string }, what: string): Promise<void> {
  const res = await 商品詳細を開く(page, 店, 商品ID);
  if ((res?.status() ?? 0) >= 400) throw new Error(`${what}: 商品詳細画面（商品ID ${商品ID}）の応答が ${res?.status()}`);
  await 数量を入れてカートに入れる(page, 商品ID, a, what);
}

/** 買い物かご画面を開き、明細を注記に残す */
async function かごを開く(page: Page, 店: 入口 = 入口.日本語): Promise<{ 商品名: string; 数量: string }[]> {
  await 買い物かごを開く(page, 店);
  const rows = await 買い物かごの明細(page);
  note(`買い物かごの明細（上から）: ${rows.map((r) => `${r.商品名}×${r.数量}`).join("、") || "なし"}`);
  return rows;
}

/** 期待結果の確かめ1つ（実際の値・何を確かめたか・期待の値）。ケースの expected の中で expect.soft で確かめる */
type 確かめ = { 実際: unknown; 何: string; 期待: unknown };
const c = (実際: unknown, 何: string, 期待: unknown): 確かめ => ({ 実際, 何, 期待 });

const 商品ID注記 = (正本の名: string, id: string) => note(`商品名${正本の名}（実際の商品名 ${商品名(正本の名)}）の商品詳細画面は、シードが控えた商品ID ${id} で開いた`);

// ---------------------------------------------------------------------------
// 買い物かご
// ---------------------------------------------------------------------------

/** 1件の要素の値が、商品IDの並び（この順）であることと、各商品IDが1回だけ含まれること */
function かごの並び(d: 読んだ領域, ids: string[], 一回だけ?: string): 確かめ[] {
  const els = 項目を持つ要素(d, "gtm_cart_ids");
  const v = els[0]?.値.gtm_cart_ids;
  const out = [
    c(els.length, `項目名 gtm_cart_ids を持つ要素の数（値: ${値の一覧(d, "gtm_cart_ids")}）`, 1),
    c(並びの文(v), "項目名 gtm_cart_ids の値（商品IDの並び）", ids.join("、")),
  ];
  if (一回だけ) out.push(c(Array.isArray(v) ? v.filter((x) => String(x) === 一回だけ).length : 0, `項目名 gtm_cart_ids の値に商品ID ${一回だけ} が含まれる回数`, 1));
  return out;
}
/** 項目名 gtm_cart_value を持つ要素が1件あり、その値が金額であること */
function かごの金額(d: 読んだ領域, 金額: string): 確かめ[] {
  return 一件で値(d, "gtm_cart_value", 金額);
}

caseTest("IT-F10-03-001", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔商品ID-F1003-001A〕"), B = notes.get("〔商品ID-F1003-001B〕");
  let d: 読んだ領域 | undefined;
  await step(1, async () => { 商品ID注記("F1003-001-A", A); await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 2 }, "商品A"); });
  await step(2, async () => { 商品ID注記("F1003-001-B", B); await 詳細でカートに入れる(page, 入口.日本語, B, { 数量: 1 }, "商品B"); });
  await step(3, async () => { await かごを開く(page); });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => { for (const x of かごの並び(d!, [A, B])) expect.soft(x.実際, x.何).toBe(x.期待); });
});

caseTest("IT-F10-03-002", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔商品ID-F1003-002A〕"), B = notes.get("〔商品ID-F1003-002B〕");
  let d: 読んだ領域 | undefined;
  await step(1, async () => { 商品ID注記("F1003-002-C", A); await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 2 }, "商品A"); });
  await step(2, async () => { 商品ID注記("F1003-002-D", B); await 詳細でカートに入れる(page, 入口.日本語, B, { 数量: 1 }, "商品B"); });
  await step(3, async () => { await かごを開く(page); });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => { for (const x of かごの金額(d!, "2200")) expect.soft(x.実際, x.何).toBe(x.期待); });
});

caseTest("IT-F10-03-003", async ({ page, notes, step, expected }) => {
  const seed = "S-F10-03-CART-DUP-003";
  const A = notes.get("〔商品ID-F1003-003A〕"), B = notes.get("〔商品ID-F1003-003B〕");
  let d: 読んだ領域 | undefined;
  await step(1, async () => {
    商品ID注記("F1003-003-A", A);
    note("商品規格NMを選ぶ: グッズの商品詳細には状態の欄が出ないので、NMの商品規格の行に数量1を入れ、ほかの行は0にした");
    await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 1, 規格ID: 規格IDの値(seed, "A", "JP", "NM") }, "商品A（NM）");
  });
  await step(2, async () => { 商品ID注記("F1003-003-B", B); await 詳細でカートに入れる(page, 入口.日本語, B, { 数量: 1 }, "商品B"); });
  await step(3, async () => {
    note("商品規格SPを選ぶ: SPの商品規格の行に数量1を入れ、ほかの行は0にした");
    await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 1, 規格ID: 規格IDの値(seed, "A", "JP", "SP") }, "商品A（SP）");
  });
  await step(4, async () => { await かごを開く(page); });
  await step(5, async () => { d = await 表示する(page); });
  await expected(async () => { for (const x of かごの並び(d!, [A, B], A)) expect.soft(x.実際, x.何).toBe(x.期待); });
});

caseTest("IT-F10-03-004", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔商品ID-F1003-004〕");
  let d: 読んだ領域 | undefined;
  await step(1, async () => { 商品ID注記("F1003-004", A); await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 1 }, "商品A"); });
  await step(2, async () => { await かごを開く(page); });
  await step(3, async () => {
    await 数量の加算を押す(page, 商品名("F1003-004"), "商品A");
    note(`加算ボタンを押したあとの明細: ${(await 買い物かごの明細(page)).map((r) => `${r.商品名}×${r.数量}`).join("、")}`);
  });
  await step(4, async () => {
    const btn = 再計算ボタン(page);
    if ((await btn.count()) === 0) throw new Error("買い物かご画面に「再計算」ボタンが無い（数量の加算は画面を表示し直さずに反映される作り）。手順を実行できない");
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), btn.first().click({ timeout: 30_000 })]);
  });
  await step(5, async () => { d = await 表示する(page); });
  await expected(async () => { for (const x of かごの金額(d!, "1100")) expect.soft(x.実際, x.何).toBe(x.期待); });
});

function 空のかご(項目名: "gtm_cart_ids" | "gtm_cart_value") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    let d: 読んだ領域 | undefined;
    await step(1, async () => { await かごを開く(page); });
    await step(2, async () => { d = await 表示する(page); });
    await expected(async () => {
      const els = 項目を持つ要素(d!, 項目名);
      expect.soft(els.length, `項目名 ${項目名} を持つ要素の数（値: ${値の一覧(d!, 項目名)}）`).toBe(1);
      const v = els[0]?.値[項目名];
      if (項目名 === "gtm_cart_ids") expect.soft(Array.isArray(v) ? `並び・${v.length}個` : `並びでない（${値の文(v)}）`, "項目名 gtm_cart_ids の値").toBe("並び・0個");
      else expect.soft(値の文(v), "項目名 gtm_cart_value の値").toBe("0");
    });
  };
}
caseTest("IT-F10-03-006", 空のかご("gtm_cart_ids"));
caseTest("IT-F10-03-007", 空のかご("gtm_cart_value"));

caseTest("IT-F10-03-008", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔商品ID-F1003-008〕");
  let d: 読んだ領域 | undefined;
  await step(1, async () => { 商品ID注記("F1003-008", A); await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 1 }, "商品A"); });
  await step(2, async () => { await かごを開く(page); });
  await step(3, async () => { d = await 表示する(page); });
  await expected(async () => { for (const x of かごの金額(d!, "550")) expect.soft(x.実際, x.何).toBe(x.期待); });
});

caseTest("IT-F10-03-010", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔商品ID-F1003-010〕");
  let d: 読んだ領域 | undefined;
  await step(1, async () => { 商品ID注記("F1003-010", A); await 詳細でカートに入れる(page, 入口.英語, A, { 数量: 1 }, "商品A（英語版）"); });
  await step(2, async () => { await かごを開く(page, 入口.英語); });
  await step(3, async () => { d = await 表示する(page); });
  await expected(async () => { for (const x of かごの金額(d!, "660")) expect.soft(x.実際, x.何).toBe(x.期待); });
});

/** 商品を1つかごに入れ、かごを開いて受け渡し領域を読む（032・033・034・047） */
function かごに1つ(label: string, 正本の名: string, check: (d: 読んだ領域, id: string) => 確かめ[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const A = notes.get(label);
    let d: 読んだ領域 | undefined;
    await step(1, async () => { 商品ID注記(正本の名, A); await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 1 }, "商品A"); });
    await step(2, async () => { await かごを開く(page); });
    await step(3, async () => { d = await 表示する(page); });
    await expected(async () => { for (const x of check(d!, A)) expect.soft(x.実際, x.何).toBe(x.期待); });
  };
}
caseTest("IT-F10-03-032", かごに1つ("〔商品ID-F1003-032〕", "F1003-032", (d) => {
  const n = d.要素.filter((e) => [...e.項目名].sort().join(",") === "gtm_cart_ids,gtm_cart_value").length;
  return [
    c(n, `項目名 gtm_cart_ids と gtm_cart_value の2項目だけを持つ要素の数（各要素の項目名: ${d.要素.map((e) => `[${e.項目名.join(",")}]`).join(" ") || "なし"}）`, 1),
  ];
}));
caseTest("IT-F10-03-033", かごに1つ("〔商品ID-F1003-033〕", "F1003-033", (d, id) => {
  const v = 値の並び(d, "gtm_cart_ids");
  return [
    c(v.length > 0, "項目名 gtm_cart_ids を持つ要素がある", true),
    c(JSON.stringify(v[0]), "項目名 gtm_cart_ids の値（型も含めて。数値の配列）", JSON.stringify([Number(id)])),
  ];
}));
caseTest("IT-F10-03-034", かごに1つ("〔商品ID-F1003-034〕", "F1003-034", (d) => {
  const v = 値の並び(d, "gtm_cart_value");
  return [
    c(v.length > 0, "項目名 gtm_cart_value を持つ要素がある", true),
    c(JSON.stringify(v[0]), "項目名 gtm_cart_value の値（型も含めて。数値）", "550"),
  ];
}));
caseTest("IT-F10-03-047", かごに1つ("〔商品ID-F1003-047〕", "F1003-047-A", (d) => {
  return [
    c(項目を持つ要素(d, "gtm_cart_ids").length, `項目名 gtm_cart_ids を持つ要素の数（値: ${値の一覧(d, "gtm_cart_ids")}）`, 1),
  ];
}));

caseTest("IT-F10-03-049", async ({ page, notes, step, expected }) => {
  const seed = "S-F10-03-CART-LANGDUP-049";
  const A = notes.get("〔商品ID-F1003-049A〕"), B = notes.get("〔商品ID-F1003-049B〕");
  let d: 読んだ領域 | undefined;
  await step(1, async () => { 商品ID注記("F1003-049-A", A); await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 1 }, "商品A（日本語版）"); });
  await step(2, async () => { 商品ID注記("F1003-049-B", B); await 詳細でカートに入れる(page, 入口.日本語, B, { 数量: 1 }, "商品B"); });
  await step(3, async () => {
    const res = await 商品詳細を開く(page, 入口.日本語, A);
    if ((res?.status() ?? 0) >= 400) throw new Error(`商品詳細画面（商品ID ${A}）の応答が ${res?.status()}`);
    await 画面で言語を切り替える(page, "EN");
    await 数量を入れてカートに入れる(page, A, { 数量: 1, 規格ID: 規格IDの値(seed, "A", "EN", "NM") }, "商品A（英語版）");
  });
  await step(4, async () => { await かごを開く(page); });
  await step(5, async () => { d = await 表示する(page); });
  await expected(async () => { for (const x of かごの並び(d!, [A, B], A)) expect.soft(x.実際, x.何).toBe(x.期待); });
});

// ---------------------------------------------------------------------------
// 商品詳細
// ---------------------------------------------------------------------------

/** 項目名を持つ要素が1件あり、その値が期待の文であること */
function 一件で値(d: 読んだ領域, 項目名: string, 値: string): 確かめ[] {
  const els = 項目を持つ要素(d, 項目名);
  return [
    c(els.length, `項目名 ${項目名} を持つ要素の数（値: ${値の一覧(d, 項目名)}）`, 1),
    c(値の文(els[0]?.値[項目名]), `項目名 ${項目名} の値`, 値),
  ];
}

/** 商品詳細画面を開き（言語・商品規格の指定つき）、受け渡し領域を読む */
function 詳細を開いて読む(label: string, 正本の名: string, 店: 入口, query: (notes: CaseCtx["notes"]) => { lang?: string; class?: string }, check: (d: 読んだ領域, id: string) => 確かめ[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const id = notes.get(label);
    const q = query(notes);
    let d: 読んだ領域 | undefined;
    await step(1, async () => {
      商品ID注記(正本の名, id);
      note(`開いた画面: ${店 === 入口.英語 ? "英語サイト" : "日本語サイト"}・言語の指定 ${q.lang ?? "なし"}・商品規格IDの指定 ${q.class ?? "なし"}`);
      const res = await 商品詳細を開く(page, 店, id, q);
      note(`商品詳細画面の応答 ${res?.status() ?? "なし"}`);
    });
    await step(2, async () => { d = await 表示する(page); });
    await expected(async () => { for (const x of check(d!, id)) expect.soft(x.実際, x.何).toBe(x.期待); });
  };
}
const 指定なし = () => ({});

caseTest("IT-F10-03-011", 詳細を開いて読む("〔商品ID-F1003-011〕", "F1003-011", 入口.日本語, 指定なし, (d, id) => 一件で値(d, "gtm_product_id", id)));
caseTest("IT-F10-03-012", 詳細を開いて読む("〔商品ID-F1003-012〕", "F1003-012", 入口.日本語, 指定なし, (d) => 一件で値(d, "gtm_product_value", "500")));
caseTest("IT-F10-03-013", 詳細を開いて読む("〔商品ID-F1003-013〕", "F1003-013", 入口.日本語, (n) => ({ class: n.get("〔商品規格ID-F1003-013〕") }), (d) => 一件で値(d, "gtm_product_value", "400")));
caseTest("IT-F10-03-014", 詳細を開いて読む("〔商品ID-F1003-014〕", "F1003-014", 入口.日本語, () => ({ lang: "EN" }), (d) => 一件で値(d, "gtm_product_value", "700")));
caseTest("IT-F10-03-015", 詳細を開いて読む("〔商品ID-F1003-015〕", "F1003-015", 入口.日本語, 指定なし, (d) => 一件で値(d, "gtm_product_value", "700")));
caseTest("IT-F10-03-016", 詳細を開いて読む("〔商品ID-F1003-016〕", "F1003-016", 入口.日本語, () => ({ lang: "EN" }), (d) => 一件で値(d, "gtm_product_value", "500")));
caseTest("IT-F10-03-017", 詳細を開いて読む("〔商品ID-F1003-017〕", "F1003-017", 入口.日本語, (n) => ({ class: n.get("〔商品規格ID-F1003-017〕") }), (d) => 一件で値(d, "gtm_product_value", "500")));
caseTest("IT-F10-03-018", 詳細を開いて読む("〔商品ID-F1003-018〕", "F1003-018", 入口.英語, 指定なし, (d) => 一件で値(d, "gtm_product_value", "700")));
caseTest("IT-F10-03-023", 詳細を開いて読む("〔商品ID-F1003-023〕", "F1003-023", 入口.日本語, 指定なし, (d) => {
  return [
    c(項目を持つ要素(d, "gtm_product_id").length, `項目名 gtm_product_id を持つ要素の数（値: ${値の一覧(d, "gtm_product_id")}）`, 0),
    c(項目を持つ要素(d, "gtm_product_value").length, `項目名 gtm_product_value を持つ要素の数（値: ${値の一覧(d, "gtm_product_value")}）`, 0),
  ];
}));
caseTest("IT-F10-03-035", 詳細を開いて読む("〔商品ID-F1003-035〕", "F1003-035", 入口.日本語, 指定なし, (d) => {
  const n = d.要素.filter((e) => [...e.項目名].sort().join(",") === "gtm_product_id,gtm_product_value").length;
  return [
    c(n, `項目名 gtm_product_id と gtm_product_value の2項目だけを持つ要素の数（各要素の項目名: ${d.要素.map((e) => `[${e.項目名.join(",")}]`).join(" ") || "なし"}）`, 1),
  ];
}));
caseTest("IT-F10-03-036", 詳細を開いて読む("〔商品ID-F1003-036〕", "F1003-036", 入口.日本語, 指定なし, (d, id) => {
  const v = 値の並び(d, "gtm_product_id");
  return [
    c(v.length > 0, "項目名 gtm_product_id を持つ要素がある", true),
    c(JSON.stringify(v[0]), "項目名 gtm_product_id の値（型も含めて。数値）", JSON.stringify(Number(id))),
  ];
}));
caseTest("IT-F10-03-037", 詳細を開いて読む("〔商品ID-F1003-037〕", "F1003-037", 入口.日本語, 指定なし, (d) => {
  const v = 値の並び(d, "gtm_product_value");
  return [
    c(v.length > 0, "項目名 gtm_product_value を持つ要素がある", true),
    c(JSON.stringify(v[0]), "項目名 gtm_product_value の値（型も含めて。数値）", "500"),
  ];
}));
caseTest("IT-F10-03-057", 詳細を開いて読む("〔商品ID-F1003-057〕", "F1003-057", 入口.日本語, (n) => ({ lang: "EN", class: n.get("〔商品規格ID-F1003-057〕") }), (d) => 一件で値(d, "gtm_product_value", "300")));

/** 058・059: gtm_product_value を持つ要素が1件で値が400、同じ要素の gtm_product_id が商品ID */
function 価格と商品IDが同じ要素(d: 読んだ領域, id: string): 確かめ[] {
  const el = 項目を持つ要素(d, "gtm_product_value")[0];
  return [
    ...一件で値(d, "gtm_product_value", "400"),
    c(値の文(el?.値.gtm_product_id), "項目名 gtm_product_value を持つ要素の、項目名 gtm_product_id の値", id),
  ];
}
caseTest("IT-F10-03-058", 詳細を開いて読む("〔商品ID-F1003-CB058〕", "F1003-CB058", 入口.英語, (n) => ({ lang: "JP", class: n.get("〔商品規格ID-F1003-CB058〕") }), 価格と商品IDが同じ要素));
caseTest("IT-F10-03-059", 詳細を開いて読む("〔商品ID-F1003-CB059〕", "F1003-CB059", 入口.英語, (n) => ({ class: n.get("〔商品規格ID-F1003-CB059〕") }), 価格と商品IDが同じ要素));

/** 商品詳細を開き、画面上で商品規格・表示言語を切り替えてから受け渡し領域を読む（019〜022・050） */
function 切り替えて読む(seedId: string, label: string, 正本の名: string, 切替: { 規格: "SP" } | { 言語: "EN" }, check: (d: 読んだ領域, id: string) => 確かめ[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const id = notes.get(label);
    let d: 読んだ領域 | undefined;
    await step(1, async () => {
      商品ID注記(正本の名, id);
      const res = await 商品詳細を開く(page, 入口.日本語, id);
      if ((res?.status() ?? 0) >= 400) throw new Error(`商品詳細画面（商品ID ${id}）の応答が ${res?.status()}`);
      note(`切替の前の受け渡し領域: ${(await 受け渡し領域の要素(page)).要素.map((e) => e.文).join(" , ").slice(0, 1000) || "なし"}`);
    });
    await step(2, async () => {
      if ("規格" in 切替) await 画面で商品規格を切り替える(page, 規格IDの値(seedId, "A", "JP", "SP"));
      else await 画面で言語を切り替える(page, 切替.言語);
    });
    await step(3, async () => { d = await 表示する(page); });
    await expected(async () => { for (const x of check(d!, id)) expect.soft(x.実際, x.何).toBe(x.期待); });
  };
}
const 一件 = (項目名: string) => (d: 読んだ領域): 確かめ[] => {
  return [
    c(項目を持つ要素(d, 項目名).length, `項目名 ${項目名} を持つ要素の数（値: ${値の一覧(d, 項目名)}）`, 1),
  ];
};
const どれも値 = (項目名: string, 値: string | ((id: string) => string)) => (d: 読んだ領域, id: string): 確かめ[] => {
  const want = typeof 値 === "function" ? 値(id) : 値;
  const vs = 値の並び(d, 項目名).map(値の文);
  return [
    c(vs.length > 0, `項目名 ${項目名} を持つ要素がある`, true),
    c(vs.join(" / "), `項目名 ${項目名} を持つ要素の値`, vs.map(() => want).join(" / ") || want),
  ];
};
caseTest("IT-F10-03-019", 切り替えて読む("S-F10-03-DET-SWSPECN-019", "〔商品ID-F1003-019〕", "F1003-019", { 規格: "SP" }, 一件("gtm_product_value")));
caseTest("IT-F10-03-020", 切り替えて読む("S-F10-03-DET-SWSPECV-020", "〔商品ID-F1003-020〕", "F1003-020", { 規格: "SP" }, どれも値("gtm_product_value", "500")));
caseTest("IT-F10-03-021", 切り替えて読む("S-F10-03-DET-SWLANGN-021", "〔商品ID-F1003-021〕", "F1003-021", { 言語: "EN" }, 一件("gtm_product_value")));
caseTest("IT-F10-03-022", 切り替えて読む("S-F10-03-DET-SWLANGV-022", "〔商品ID-F1003-022〕", "F1003-022", { 言語: "EN" }, どれも値("gtm_product_value", "500")));
caseTest("IT-F10-03-050", 切り替えて読む("S-F10-03-DET-SWSPECID-050", "〔商品ID-F1003-050〕", "F1003-050", { 規格: "SP" }, どれも値("gtm_product_id", (id) => id)));

// ---------------------------------------------------------------------------
// 商品の並びを差し込まない画面
// ---------------------------------------------------------------------------

caseTest("IT-F10-03-031", async ({ page, step, expected }) => {
  let d: 読んだ領域 | undefined;
  await step(1, async () => { await ご利用規約を開く(page); });
  await step(2, async () => { d = await 表示する(page); });
  await expected(async () => {
    const keys = ["gtm_cart_ids", "gtm_cart_value", "gtm_product_id", "gtm_product_value", "gtm_search_ids"];
    const hit = d!.要素.filter((e) => e.項目名.some((k) => keys.includes(k)));
    expect.soft(hit.length, `項目名 gtm_cart_ids・gtm_cart_value・gtm_product_id・gtm_product_value・gtm_search_ids のいずれかを持つ要素の数（${hit.map((e) => e.文).join(" , ") || "なし"}）`).toBe(0);
  });
});

caseTest("IT-F10-03-045", async ({ page, notes, step, expected }) => {
  const seedId = "S-F10-03-FAV-045";
  const fav = new FrontFavorite(page);
  let d: 読んだ領域 | undefined;
  await step(1, async () => { await fav.login(メールの値(seedId), パスワードの値(seedId)); note(`ログインのメールアドレスは前半に実行の印を付けた値 ${メールの値(seedId)}`); });
  await step(2, async () => {
    await fav.openFavoriteList();
    const names = await fav.一覧の商品名();
    note(`お気に入り登録商品一覧の商品: ${names.join("、") || "なし"}（商品ID ${notes.get("〔商品ID-F1003-045〕")}）`);
    expect(names.some((n) => n.includes(商品名("F1003-045-X"))), `お気に入り登録商品一覧に商品「${商品名("F1003-045-X")}」が表示される`).toBe(true);
  });
  await step(3, async () => { d = await 表示する(page); });
  await expected(async () => {
    expect.soft(項目を持つ要素(d!, "gtm_search_ids").length, `項目名 gtm_search_ids を持つ要素の数（値: ${値の一覧(d!, "gtm_search_ids")}）`).toBe(0);
  });
});

caseTest("IT-F10-03-048", async ({ page, step, expected }) => {
  const seedId = "S-F10-03-WAITLIST-048";
  const front = new FrontRestock(page);
  let d: 読んだ領域 | undefined;
  await step(1, async () => { await front.login(メールの値(seedId), パスワードの値(seedId)); note(`ログインのメールアドレスは前半に実行の印を付けた値 ${メールの値(seedId)}`); });
  await step(2, async () => { await front.openMypage(); });
  await step(3, async () => {
    const link = 入荷待ち商品一覧のリンク(page);
    await expect(link.first(), "マイページの「入荷待ち商品一覧」のリンク").toBeVisible({ timeout: 30_000 });
    await Promise.all([page.waitForURL(/\/mypage\/notifylist/, { timeout: 60_000 }), link.first().click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
    const names = await front.入荷待ち商品名一覧();
    note(`入荷待ち商品一覧の商品: ${names.join("、") || "なし"}`);
    expect(names.some((n) => n.includes(商品名("F1003-048-X"))), `入荷待ち商品一覧に商品「${商品名("F1003-048-X")}」が表示される`).toBe(true);
  });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => {
    expect.soft(項目を持つ要素(d!, "gtm_search_ids").length, `項目名 gtm_search_ids を持つ要素の数（値: ${値の一覧(d!, "gtm_search_ids")}）`).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 業務データを書き換えない
// ---------------------------------------------------------------------------

caseTest("IT-F10-03-051", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔商品ID-F1003-051〕");
  let 前: { 商品名: string; 数量: string }[] = [];
  let 後: { 商品名: string; 数量: string }[] = [];
  await step(1, async () => { 商品ID注記("F1003-051", A); await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 2 }, "商品A"); });
  await step(2, async () => { 前 = await かごを開く(page); });
  await step(3, async () => { await 商品詳細を開く(page, 入口.日本語, A); });
  await step(4, async () => { 後 = await かごを開く(page); });
  await expected(async () => {
    const 文 = (rows: { 商品名: string; 数量: string }[]) => rows.map((r) => `${r.商品名}×${r.数量}`).join("、");
    expect.soft(文(後), "手順4の買い物かごの明細（商品名×数量）").toBe(`${商品名("F1003-051")}×2`);
    expect.soft(文(後), "手順4の明細が手順2の表示から変わっていない").toBe(文(前));
  });
});

caseTest("IT-F10-03-052", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔商品ID-F1003-052〕");
  await step(1, async () => { 商品ID注記("F1003-052", A); await 詳細でカートに入れる(page, 入口.日本語, A, { 数量: 1 }, "商品A"); });
  await step(2, async () => { await かごを開く(page); });
  await step(3, async () => { await 商品詳細を開く(page, 入口.日本語, A); });
  await step(4, async () => { await loginAdmin(page, F1003_GF_ADMIN); });
  await step(5, async () => {
    const id = await 商品名で検索して編集を開く(page, 商品名("F1003-052"));
    note(`商品マスターを商品名 ${商品名("F1003-052")} で検索し、商品ID ${id} の商品登録編集画面を開いた`);
  });
  await expected(async () => {
    expect.soft(await 商品の公開状態(page), "商品の公開状態").toBe("公開");
    const rows = await 商品規格の表(page);
    note(`商品規格の表: ${rows.map((r) => `${r.言語}・${r.状態}・${r.商品コード}・在庫${r.在庫}・${r.価格}`).join(" / ")}`);
    const nm = rows.filter((r) => /^(日本語|JP)$/.test(r.言語) && /^(NM|ニアミント)$/.test(r.状態));
    expect.soft(nm.length, "日本語版の商品規格NMの行の数").toBe(1);
    expect.soft(nm[0]?.在庫 ?? "", "日本語版の商品規格NMの在庫").toBe("10");
    expect.soft((nm[0]?.価格 ?? "").replace(/[^0-9]/g, ""), "日本語版の商品規格NMの価格（税抜。桁区切り・通貨の記号を除いた数字）").toBe("500");
  });
});

// ---------------------------------------------------------------------------
// 商品一覧・商品詳細（同名の商品の並び）の受け渡し領域
// ---------------------------------------------------------------------------

caseTest("IT-F10-03-027", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 検索語の値("S-F10-03-LIST-ZERO-027");
  let d: 読んだ領域 | undefined;
  await step(1, async () => { await list.open(店舗の入口.本店); });
  await step(2, async () => {
    note(`商品名「F1003-027」は、実行の印を付けた「${f.検索語}」で検索した（商品一覧画面のヘッダーの商品検索）`);
    await list.ヘッダーで検索する(f.検索語);
    // 手順の括弧書き（検索結果が0件になる）: 検索が済んで0件の案内が出ていること（読み込みが終わっていない・失敗では先へ進めない）
    await expect(list.該当なしの案内, "検索結果が0件になる（お探しの商品は見つかりませんでした）").toBeVisible({ timeout: 30_000 });
  });
  await step(3, async () => { d = await 表示する(page); });
  await expected(async () => {
    const els = 項目を持つ要素(d!, "gtm_search_ids");
    expect.soft(els.length, `項目名 gtm_search_ids を持つ要素の数（空の並びを持つ要素も含む。値: ${値の一覧(d!, "gtm_search_ids")}）`).toBe(0);
  });
});

caseTest("IT-F10-03-028", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 検索語の値("S-F10-03-LIST-ONCE-028");
  let d: 読んだ領域 | undefined;
  await step(1, async () => { await list.open(店舗の入口.本店); });
  await step(2, async () => {
    note(`商品名「F1003-028」は、既存の商品が複数当たる検索語「${f.検索語}」で代えた（商品一覧画面のヘッダーの商品検索）`);
    await list.ヘッダーで検索する(f.検索語);
    note(`一覧に出た商品カード（本表示）の数 ${await list.本表示のカード.count()}`);
  });
  await step(3, async () => { d = await 表示する(page); });
  await expected(async () => {
    expect.soft(項目を持つ要素(d!, "gtm_search_ids").length, `項目名 gtm_search_ids を持つ要素の数（値: ${値の一覧(d!, "gtm_search_ids")}）`).toBe(1);
  });
});

caseTest("IT-F10-03-039", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 検索語の値("S-F10-03-STRUCT-LISTNEST-039");
  let d: 読んだ領域 | undefined;
  await step(1, async () => { await list.open(店舗の入口.本店); });
  await step(2, async () => {
    note(`商品名「F1003-039」は、既存の商品が複数当たる検索語「${f.検索語}」で代えた（商品一覧画面のヘッダーの商品検索）`);
    await list.ヘッダーで検索する(f.検索語);
  });
  await step(3, async () => { await list.並び順を選ぶ("価格(低い順)"); });
  await step(4, async () => { d = await 表示する(page); });
  await expected(async () => {
    const els = 項目を持つ要素(d!, "gtm_search_ids");
    expect.soft(els.length, `項目名 gtm_search_ids を持つ要素の数（値: ${値の一覧(d!, "gtm_search_ids")}）`).toBe(1);
    expect.soft((els[0]?.項目名 ?? []).join(","), "その要素が持つ項目の名前").toBe("gtm_search_ids");
  });
});

caseTest("IT-F10-03-044", 詳細を開いて読む("〔商品ID-F1003-044〕", "F1003-044-X", 入口.日本語, 指定なし, (d) => [
  c(項目を持つ要素(d, "gtm_search_ids").length, `項目名 gtm_search_ids を持つ要素の数（値: ${値の一覧(d, "gtm_search_ids")}）`, 0),
]));
