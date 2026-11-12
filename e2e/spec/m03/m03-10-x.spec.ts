/**
 * M03-10 買取・販売価格一括編集の続き（-x）。正本: cases/M03-10_test_cases.tsv
 * 実施不可の見直し（仕分け直し recheck2）で流せる見込みになったケース（記録 review/M03-10_progress_2026-11-11_dev.md）。
 * シード（seeds/m03-10-x.ts）は画面で商品・商品規格を作り、画面で作れない状態（価格履歴の件数）だけを E2E の行に DB で書き足す。
 * 正本の「買取・基準価格一括編集ボタン」は商品マスター(検索結果)の「買取・基準価格一括編集」、「登録ボタン」は一括編集画面の「登録」、
 * 「商品検索に戻るリンク」は一括編集画面の左下の「商品一覧」。
 * 商品マスター(検索結果)で選ぶ商品は、商品コードの欄に「正本の商品コードの先頭」と「実行の印」を空白で区切って入れて検索して出す。
 */
import { Page, test } from "@playwright/test";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import * as x from "../../db/m03_10_x";
import * as w30 from "../../db/m03_30_x";
import { RUN_MARK } from "../../lib/run_marker";
import { 一括の行, 一括編集画面, 画面のメッセージ, 商品マスター, 商品マスターの結果の画面か, 欄 } from "../../pages/admin/m03_10_x";
import { M0310_ADMIN, 規格の, 商品の, 連鎖の言葉 } from "../../seeds/m03-10-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const list = (xs: string[]) => xs.join(" / ") || "なし";
/** 欄に値が表示されているか（入力欄がある、または欄の文字に数がある） */
const 表示されている = (k: 欄): boolean => k.入力欄 || /\d/.test(k.文字);
const 欄の文 = (k: 欄): string => (k.入力欄 ? `入力欄（${k.値}${k.読み取り専用 ? "・読み取り専用" : ""}）` : `「${k.文字}」`);
const 状態 = ["NM", "SP", "MP", "HP"] as const;

/** 試験管理者でログインし、商品マスターで商品コードの言葉で検索して、商品IDの行を選び、「買取・基準価格一括編集」を押す（手順1・2） */
async function 選んで一括編集を開く(ctx: CaseCtx, 言葉: string, 商品ID: string[]): Promise<一括編集画面> {
  const { page, step } = ctx;
  await loginAdmin(page, M0310_ADMIN);
  const m = new 商品マスター(page);
  await step(1, async () => {
    await m.検索する({ コード: 言葉, 初期の絞り込みを外す: true });
    supplement("商品マスター(検索入力)の初期の絞り込み（公開状態＝公開・状態＝NM・高額商品を除外する）を外して検索した（選ぶ商品が必ず出るように）");
    const ids = await m.行の商品ID();
    for (const id of 商品ID) if (!ids.includes(id)) throw new Error(`商品マスター(検索結果)の1ページ目に商品ID ${id} の行が無い（出た行: ${ids.slice(0, 20).join("、")}）`);
    for (const id of 商品ID) await m.選ぶ(id);
    note(`商品コード「${言葉}」で検索して、商品ID ${商品ID.join("・")} の行を選んだ`);
  });
  const e = new 一括編集画面(page);
  await step(2, async () => {
    await m.一括編集を押す();
    expect(await e.開いているか(), "買取・基準価格一括編集画面が開いた").toBe(true);
    note(`一括編集画面の行: ${(await e.行()).map((r) => `${r.商品ID}/${r.言語}`).join("、")}`);
  });
  return e;
}
/**
 * 商品コードの検索の言葉。正本の商品コードの先頭（「M0310-020」など）と実行の印を空白で区切って入れる
 * （商品コードの検索は、空白で区切った言葉をすべて含む規格に当たる。前の実行の同じコードの商品を出さない）
 */
const 言葉 = (番号: string): string => `M0310-${番号} ${RUN_MARK}`;

async function 行を読む(e: 一括編集画面, 商品ID: string, 言語 = "日本語"): Promise<一括の行> {
  const rows = (await e.行()).filter((r) => r.商品ID === 商品ID && r.言語 === 言語);
  if (rows.length !== 1) throw new Error(`一括編集画面に、商品ID ${商品ID}・${言語} の行が ${rows.length} 件（1件のはず）`);
  return rows[0];
}
const 行の文 = (r: 一括の行): string => `在庫数 ${状態.map((s, i) => `${s}${欄の文(r.在庫数[i])}`).join("・")}／基準価格 ${状態.map((s, i) => `${s}${欄の文(r.基準価格[i])}`).join("・")}／買取価格(NM)${欄の文(r.買取価格NM)}`;

/** 「登録」を押し、移った先と画面上部のメッセージを注記に残す */
async function 登録する(e: 一括編集画面): Promise<{ パス: string; 成功: string[]; エラー: string[] }> {
  const パス = await e.登録を押す();
  const msg = await 画面のメッセージ(e.page);
  note(`「登録」のあと: 画面 ${パス}・成功「${list(msg.成功)}」・エラー「${list(msg.エラー)}」`);
  return { パス, ...msg };
}
const 値 = (seedId: string, 呼び名: string) => x.規格の値(規格の(seedId, 呼び名).商品規格ID);
const 件数 = (seedId: string, 呼び名: string) => x.価格履歴の件数(規格の(seedId, 呼び名).商品規格ID);

// ---- 表示 ----

caseTest("IT-M03-10-001", async (ctx) => {
  const S = "S-M03-10-DISPLAY-001";
  const A = 商品の(S, "商品ID-M0310-001A"), B = 商品の(S, "商品ID-M0310-001B");
  const e = await 選んで一括編集を開く(ctx, 言葉("001"), [A.商品ID, B.商品ID]);
  let rows: 一括の行[] = [];
  await ctx.step(3, async () => { rows = await e.行(); note(`表示行（上から）: ${rows.map((r) => `${r.商品ID}・${r.商品名}・${r.言語}`).join(" / ")}`); });
  await ctx.expected(async () => {
    expect.soft(rows.map((r) => [r.商品ID, r.商品名, r.言語]), "表示行の商品ID・商品名・言語（上から）").toEqual([
      [A.商品ID, A.商品名, "日本語"], [A.商品ID, A.商品名, "英語"], [B.商品ID, B.商品名, "日本語"], [B.商品ID, B.商品名, "英語"],
    ]);
  });
});

caseTest("IT-M03-10-002", async (ctx) => {
  const P = 商品の("S-M03-10-HIGH-002", "商品ID-M0310-002");
  const e = await 選んで一括編集を開く(ctx, 言葉("002"), [P.商品ID]);
  await ctx.expected(async () => {
    const r = await 行を読む(e, P.商品ID);
    note(行の文(r));
    expect.soft(表示されている(r.在庫数[1]), `高額商品コードが設定された SP 規格の在庫数（${欄の文(r.在庫数[1])}）が表示されない`).toBe(false);
    expect.soft(表示されている(r.基準価格[1]), `高額商品コードが設定された SP 規格の基準価格（${欄の文(r.基準価格[1])}）が表示されない`).toBe(false);
  });
});

caseTest("IT-M03-10-003", async (ctx) => {
  const P = 商品の("S-M03-10-INACTIVE-003", "商品ID-M0310-003");
  const e = await 選んで一括編集を開く(ctx, 言葉("003"), [P.商品ID]);
  await ctx.expected(async () => {
    const r = await 行を読む(e, P.商品ID);
    note(行の文(r));
    expect.soft(表示されている(r.在庫数[2]), `無効な MP 規格の在庫数（${欄の文(r.在庫数[2])}）が表示されない`).toBe(false);
    expect.soft(表示されている(r.基準価格[2]), `無効な MP 規格の基準価格（${欄の文(r.基準価格[2])}）が表示されない`).toBe(false);
    for (const i of [1, 3]) {
      expect.soft(表示されている(r.在庫数[i]), `有効な ${状態[i]} 規格の在庫数（${欄の文(r.在庫数[i])}）が表示される`).toBe(true);
      expect.soft(表示されている(r.基準価格[i]), `有効な ${状態[i]} 規格の基準価格（${欄の文(r.基準価格[i])}）が表示される`).toBe(true);
    }
  });
});

caseTest("IT-M03-10-004", async (ctx) => {
  const P = 商品の("S-M03-10-INACTIVE-004", "商品ID-M0310-004");
  const e = await 選んで一括編集を開く(ctx, 言葉("004"), [P.商品ID]);
  await ctx.expected(async () => {
    const r = await 行を読む(e, P.商品ID);
    note(行の文(r));
    expect.soft(r.買取価格NM.入力欄, `表示が無効で高額商品コードの NM 規格の、買取価格(NM)の入力欄（${欄の文(r.買取価格NM)}）が表示されない`).toBe(false);
    expect.soft(r.基準価格[0].入力欄, `表示が無効で高額商品コードの NM 規格の、基準価格(NM)の入力欄（${欄の文(r.基準価格[0])}）が表示されない`).toBe(false);
  });
});

caseTest("IT-M03-10-006", async (ctx) => {
  const P = 商品の("S-M03-10-BASE-006", "商品ID-M0310-006");
  const e = await 選んで一括編集を開く(ctx, 言葉("006"), [P.商品ID]);
  let r: 一括の行 | null = null;
  await ctx.step(3, async () => { r = await 行を読む(e, P.商品ID); note(`${行の文(r)}／価格比率 ${欄の文(r.価格比率)}`); });
  await ctx.expected(async () => {
    const v = r!;
    for (const i of [1, 2, 3]) {
      expect.soft(v.基準価格[i].入力欄 && v.基準価格[i].読み取り専用, `基準価格(${状態[i]})（${欄の文(v.基準価格[i])}）が編集できない状態で表示される`).toBe(true);
    }
    expect.soft(v.価格比率.入力欄 && v.価格比率.読み取り専用, `価格比率(買取÷販売)（${欄の文(v.価格比率)}）が編集できない状態で表示される`).toBe(true);
  });
});

caseTest("IT-M03-10-008", async (ctx) => {
  const P = 商品の("S-M03-10-DISPLAY-008", "商品ID-M0310-008");
  const e = await 選んで一括編集を開く(ctx, 言葉("008"), [P.商品ID]);
  await ctx.step(3, async () => { await e.戻るを押す(); note(`移った画面: ${new URL(ctx.page.url()).pathname}`); });
  await ctx.expected(async () => {
    expect.soft(await 商品マスターの結果の画面か(ctx.page), `商品マスター(検索結果)へ移った（${new URL(ctx.page.url()).pathname}）`).toBe(true);
    await expect.soft(ctx.page.getByText(/^検索結果：\d+件が該当しました$/).first(), "商品マスター(検索結果)の該当件数の表示").toBeVisible();
  });
});

/** 009・016: 連鎖商品を商品名で検索し、表示件数10件で2ページ目を開く（事前準備の「表示件数を10件に設定し、A が2ページ目」も確かめる） */
async function 連鎖の2ページ目(page: Page, 番号: "009" | "016", A: string): Promise<商品マスター> {
  await loginAdmin(page, M0310_ADMIN);
  const m = new 商品マスター(page);
  await m.検索する({ 商品名: 連鎖の言葉(番号) });
  await m.表示件数を選ぶ(10);
  return m;
}

caseTest("IT-M03-10-009", async (ctx) => {
  const A = 商品の("S-M03-10-SEARCHSTATE-009", "商品ID-M0310-009A");
  let m: 商品マスター;
  await ctx.step(1, async () => {
    m = await 連鎖の2ページ目(ctx.page, "009", A.商品ID);
    supplement(`商品名の検索の言葉「連鎖商品-009」は、前の実行の商品が混ざらないよう「${連鎖の言葉("009")}」で検索した。表示件数を10件にした（事前準備）`);
  });
  await ctx.step(2, async () => {
    await m.ページを開く(2);
    const ids = await m.行の商品ID();
    note(`2ページ目の行: ${ids.join("、")}`);
    expect(ids, "事前準備: 商品ID 〔商品ID-M0310-009A〕が2ページ目に表示される").toContain(A.商品ID);
  });
  await ctx.step(3, async () => { await m.一括編集を押す(); });
  await ctx.expected(async () => {
    const msg = await 画面のメッセージ(ctx.page);
    note(`押したあとの画面 ${new URL(ctx.page.url()).pathname}・エラー「${list(msg.エラー)}」`);
    expect.soft(await 商品マスターの結果の画面か(ctx.page), "商品マスター(検索結果)へ戻った").toBe(true);
    expect.soft(msg.エラー.join(" "), "選択を促すエラーが表示される").toMatch(/選択してください/);
    expect.soft(await m.商品名の条件(), "商品名の検索条件が維持される").toBe(連鎖の言葉("009"));
    expect.soft(await m.今のページ(), "2ページ目の表示が維持される").toBe("2");
  });
});

// ---- 登録 ----

caseTest("IT-M03-10-010", async (ctx) => {
  const S = "S-M03-10-BASE-010";
  const P = 商品の(S, "商品ID-M0310-010");
  const e = await 選んで一括編集を開く(ctx, 言葉("010"), [P.商品ID]);
  await ctx.step(3, async () => {
    for (const l of ["日本語", "英語"]) await e.入れる(P.商品ID, l, { 買取価格NM: 5000, 基準価格NM: 10000 });
  });
  await ctx.step(4, async () => { await 登録する(e); });
  let jp: x.規格の値, en: x.規格の値;
  await ctx.step(5, async () => { jp = 値(S, "規格ID-M0310-010A"); en = 値(S, "規格ID-M0310-010E"); note(`日本語 NM ${JSON.stringify(jp)}・英語 NM ${JSON.stringify(en)}`); });
  await ctx.expected(async () => {
    for (const [l, v] of [["日本語", jp!], ["英語", en!]] as const) {
      expect.soft({ 買取価格: v.買取価格, 基準価格: v.基準価格 }, `${l}の NM 規格の買取価格・基準価格`).toEqual({ 買取価格: "5000", 基準価格: "10000" });
    }
  });
});

caseTest("IT-M03-10-012", async (ctx) => {
  const S = "S-M03-10-BASE-012";
  const P = 商品の(S, "商品ID-M0310-012");
  const e = await 選んで一括編集を開く(ctx, 言葉("012"), [P.商品ID]);
  await ctx.step(3, async () => { for (const l of ["日本語", "英語"]) await e.入れる(P.商品ID, l, { 買取価格NM: 5000, 基準価格NM: 10000 }); });
  await ctx.step(4, async () => { await 登録する(e); });
  const got: { 呼び名: string; 件数: number; 最後の基準価格: string; 規格の基準価格: string }[] = [];
  await ctx.step(5, async () => {
    for (const k of "ABCDEFGH") {
      const c = 規格の(S, `規格ID-M0310-012${k}`);
      const h = x.価格履歴の件数(c.商品規格ID);
      const last = w30.価格履歴の行(c.商品規格ID).pop();
      got.push({ 呼び名: `012${k}`, 件数: h, 最後の基準価格: last?.基準価格 ?? "", 規格の基準価格: x.規格の値(c.商品規格ID).基準価格 });
    }
    note(`価格履歴: ${JSON.stringify(got)}`);
  });
  await ctx.expected(async () => {
    for (const g of got) {
      expect.soft(g.件数, `規格 ${g.呼び名} の価格履歴が追加された（0件から）`).toBe(1);
      expect.soft(g.最後の基準価格, `規格 ${g.呼び名} の価格履歴に更新後の基準価格（${g.規格の基準価格}）が登録された`).toBe(g.規格の基準価格);
    }
  });
});

caseTest("IT-M03-10-013", async (ctx) => {
  const S = "S-M03-10-BASE-013";
  const P = 商品の(S, "商品ID-M0310-013");
  const before = "ABCDEFGH".split("").map((k) => x.規格の在庫数(規格の(S, `規格ID-M0310-013${k}`).商品規格ID));
  const e = await 選んで一括編集を開く(ctx, 言葉("013"), [P.商品ID]);
  await ctx.step(3, async () => { for (const l of ["日本語", "英語"]) await e.入れる(P.商品ID, l, { 買取価格NM: 5000, 基準価格NM: 10000 }); });
  await ctx.step(4, async () => { await 登録する(e); });
  let after: number[] = [];
  await ctx.step(5, async () => { after = "ABCDEFGH".split("").map((k) => x.規格の在庫数(規格の(S, `規格ID-M0310-013${k}`).商品規格ID)); note(`在庫数（登録前→後）: ${before.join("・")} → ${after.join("・")}`); });
  await ctx.expected(async () => {
    expect.soft(before, "登録前の在庫数（日本語 NM・SP・MP・HP、英語 NM・SP・MP・HP）").toEqual([11, 12, 13, 14, 21, 22, 23, 24]);
    expect.soft(after, "登録後の在庫数が登録前の値から更新されない").toEqual(before);
  });
});

caseTest("IT-M03-10-014", async (ctx) => {
  const S = "S-M03-10-BASE-014";
  const A = 商品の(S, "商品ID-M0310-014A"), B = 商品の(S, "商品ID-M0310-014B");
  const Bk = "IJKL".split("").map((k) => `規格ID-M0310-014${k}`);
  const before = Bk.map((k) => 値(S, k));
  const e = await 選んで一括編集を開く(ctx, 言葉("014A"), [A.商品ID]);
  await ctx.step(3, async () => { for (const l of ["日本語", "英語"]) await e.入れる(A.商品ID, l, { 買取価格NM: 5000, 基準価格NM: 10000 }); });
  await ctx.step(4, async () => { await 登録する(e); });
  let after: x.規格の値[] = [], hist: number[] = [];
  await ctx.step(5, async () => { after = Bk.map((k) => 値(S, k)); hist = Bk.map((k) => 件数(S, k)); note(`未選択の商品ID ${B.商品ID} の規格（登録前→後）: ${JSON.stringify(before)} → ${JSON.stringify(after)}・価格履歴 ${hist.join("・")}`); });
  await ctx.expected(async () => {
    expect.soft(after, `未選択の商品ID ${B.商品ID} の価格が登録前の値から更新されない`).toEqual(before);
    expect.soft(hist, `未選択の商品ID ${B.商品ID} の価格履歴が追加されない（0件のまま）`).toEqual([0, 0, 0, 0]);
  });
});

caseTest("IT-M03-10-015", async (ctx) => {
  const S = "S-M03-10-HIGH-015";
  const P = 商品の(S, "商品ID-M0310-015");
  const e = await 選んで一括編集を開く(ctx, 言葉("015"), [P.商品ID]);
  await ctx.step(3, async () => { await e.入れる(P.商品ID, "日本語", { 買取価格NM: 3500, 基準価格NM: 7000 }); });
  await ctx.step(4, async () => { await 登録する(e); });
  let sp: x.規格の値, h = -1;
  await ctx.step(5, async () => { sp = 値(S, "規格ID-M0310-015B"); h = 件数(S, "規格ID-M0310-015B"); note(`高額商品コードの SP 規格: ${JSON.stringify(sp)}・価格履歴 ${h} 件`); });
  await ctx.expected(async () => {
    expect.soft({ 買取価格: sp!.買取価格, 基準価格: sp!.基準価格 }, "SP 規格の買取価格・基準価格が登録前の 2500・5000 から更新されない").toEqual({ 買取価格: "2500", 基準価格: "5000" });
    expect.soft(h, "SP 規格の価格履歴が追加されない（0件のまま）").toBe(0);
  });
});

caseTest("IT-M03-10-016", async (ctx) => {
  const A = 商品の("S-M03-10-SEARCHSTATE-016", "商品ID-M0310-016A");
  let m: 商品マスター;
  await ctx.step(1, async () => {
    m = await 連鎖の2ページ目(ctx.page, "016", A.商品ID);
    supplement(`商品名の検索の言葉「連鎖商品-016」は、前の実行の商品が混ざらないよう「${連鎖の言葉("016")}」で検索した。表示件数を10件にした（事前準備）`);
  });
  await ctx.step(2, async () => {
    await m.ページを開く(2);
    const ids = await m.行の商品ID();
    note(`2ページ目の行: ${ids.join("、")}`);
    expect(ids, "事前準備: 商品ID 〔商品ID-M0310-016A〕が2ページ目に表示される").toContain(A.商品ID);
    await m.選ぶ(A.商品ID);
  });
  const e = new 一括編集画面(ctx.page);
  await ctx.step(3, async () => { await m.一括編集を押す(); expect(await e.開いているか(), "買取・基準価格一括編集画面が開いた").toBe(true); });
  await ctx.step(4, async () => { await e.入れる(A.商品ID, "日本語", { 買取価格NM: 1500, 基準価格NM: 3500 }); });
  let r: { パス: string; 成功: string[]; エラー: string[] };
  await ctx.step(5, async () => { r = await 登録する(e); });
  await ctx.expected(async () => {
    expect.soft(await 商品マスターの結果の画面か(ctx.page), "商品マスター(検索結果)へ戻った").toBe(true);
    expect.soft(r!.成功.join(" "), "完了メッセージが表示される").toMatch(/登録が完了しました/);
    expect.soft(await m.商品名の条件(), "商品名の検索条件が維持される").toBe(連鎖の言葉("016"));
    expect.soft(await m.今のページ(), "2ページ目の表示が維持される").toBe("2");
  });
});

/** 020・021・049: 2商品（A・B）の NM に値を入れて登録する */
async function 二つ入れて登録(ctx: CaseCtx, 番号: string, A: string, B: string, a: [number, number], b: [number, number]): Promise<{ e: 一括編集画面; r: { パス: string; 成功: string[]; エラー: string[] } }> {
  const e = await 選んで一括編集を開く(ctx, 言葉(番号), [A, B]);
  await ctx.step(3, async () => {
    await e.入れる(A, "日本語", { 買取価格NM: a[0], 基準価格NM: a[1] });
    await e.入れる(B, "日本語", { 買取価格NM: b[0], 基準価格NM: b[1] });
  });
  let r = { パス: "", 成功: [] as string[], エラー: [] as string[] };
  await ctx.step(4, async () => { r = await 登録する(e); });
  return { e, r };
}

caseTest("IT-M03-10-020", async (ctx) => {
  const S = "S-M03-10-ROLLBACK-020";
  const A = 商品の(S, "商品ID-M0310-020A"), B = 商品の(S, "商品ID-M0310-020B");
  const { e, r } = await 二つ入れて登録(ctx, "020", A.商品ID, B.商品ID, [4000, 8000], [9000, 8000]);
  await ctx.expected(async () => {
    expect.soft(await e.開いているか(), "買取・基準価格一括編集画面が再表示される").toBe(true);
    expect.soft(r.エラー.length, `エラーが表示される（${list(r.エラー)}）`).toBeGreaterThan(0);
    const ra = await 行を読む(e, A.商品ID), rb = await 行を読む(e, B.商品ID);
    note(`再表示: A ${欄の文(ra.買取価格NM)}・${欄の文(ra.基準価格[0])}／B ${欄の文(rb.買取価格NM)}・${欄の文(rb.基準価格[0])}`);
    expect.soft([ra.買取価格NM.値, ra.基準価格[0].値], `商品ID ${A.商品ID} には登録済み価格 3000・7000 が表示される`).toEqual(["3000", "7000"]);
    expect.soft([rb.買取価格NM.値, rb.基準価格[0].値], `商品ID ${B.商品ID} には登録済み価格 2000・6000 が表示される`).toEqual(["2000", "6000"]);
  });
});

caseTest("IT-M03-10-021", async (ctx) => {
  const S = "S-M03-10-ROLLBACK-021";
  const A = 商品の(S, "商品ID-M0310-021A"), B = 商品の(S, "商品ID-M0310-021B");
  await 二つ入れて登録(ctx, "021", A.商品ID, B.商品ID, [4000, 8000], [9000, 8000]);
  let va: x.規格の値, vb: x.規格の値, h: number[] = [];
  await ctx.step(5, async () => {
    va = 値(S, "規格ID-M0310-021A"); vb = 値(S, "規格ID-M0310-021B");
    h = [件数(S, "規格ID-M0310-021A"), 件数(S, "規格ID-M0310-021B")];
    note(`A ${JSON.stringify(va)}・B ${JSON.stringify(vb)}・価格履歴 ${h.join("・")}`);
  });
  await ctx.expected(async () => {
    expect.soft([va!.買取価格, va!.基準価格], `商品ID ${A.商品ID} の価格が登録前の 3000・7000 から更新されない`).toEqual(["3000", "7000"]);
    expect.soft([vb!.買取価格, vb!.基準価格], `商品ID ${B.商品ID} の価格が登録前の 2000・6000 から更新されない`).toEqual(["2000", "6000"]);
    expect.soft(h, "両商品の価格履歴が0件のまま").toEqual([0, 0]);
  });
});

caseTest("IT-M03-10-022", async (ctx) => {
  const S = "S-M03-10-NONM-022";
  const A = 商品の(S, "商品ID-M0310-022A"), B = 商品の(S, "商品ID-M0310-022B");
  const Ak = ["規格ID-M0310-022A", "規格ID-M0310-022B", "規格ID-M0310-022C"];
  const beforeA = Ak.map((k) => 値(S, k));
  const e = await 選んで一括編集を開く(ctx, 言葉("022"), [A.商品ID, B.商品ID]);
  await ctx.step(3, async () => {
    const ra = await 行を読む(e, A.商品ID);
    if (ra.基準価格[0].入力欄) await e.入れる(A.商品ID, "日本語", { 買取価格NM: 2000, 基準価格NM: 5000 });
    else {
      // NM の規格が無い商品は、基準価格(NM)の欄が「-」で入力欄が無い。買取価格(NM)だけを入れる
      const buy = ctx.page.locator(`form#product-class-form tbody tr:has(input[type=hidden][id$="_product_id"][value="${A.商品ID}"]) input.js-buy-price`);
      await buy.fill("2000");
      supplement(`NM 規格が無い商品ID ${A.商品ID} の行は基準価格(NM)の欄が${欄の文(ra.基準価格[0])}で入力欄が無いので、買取価格(NM)の 2000 だけを入れた`);
    }
    await e.入れる(B.商品ID, "日本語", { 買取価格NM: 2000, 基準価格NM: 5000 });
  });
  await ctx.step(4, async () => { await 登録する(e); });
  let afterA: x.規格の値[] = [], hA: number[] = [], vB: x.規格の値, hB = -1;
  await ctx.step(5, async () => {
    afterA = Ak.map((k) => 値(S, k)); hA = Ak.map((k) => 件数(S, k));
    vB = 値(S, "規格ID-M0310-022D"); hB = 件数(S, "規格ID-M0310-022D");
    note(`A（SP・MP・HP）${JSON.stringify(afterA)}・価格履歴 ${hA.join("・")}／B（NM）${JSON.stringify(vB)}・価格履歴 ${hB}`);
  });
  await ctx.expected(async () => {
    expect.soft(afterA, `NM 規格が無い商品ID ${A.商品ID} の価格が変わらない`).toEqual(beforeA);
    expect.soft(hA, `NM 規格が無い商品ID ${A.商品ID} の価格履歴が変わらない（0件のまま）`).toEqual([0, 0, 0]);
    expect.soft([vB!.買取価格, vB!.基準価格], `NM 規格がある商品ID ${B.商品ID} の買取価格・基準価格が 2000・5000 に更新される`).toEqual(["2000", "5000"]);
    expect.soft(hB, `商品ID ${B.商品ID} の価格履歴が追加される`).toBeGreaterThan(0);
  });
});

caseTest("IT-M03-10-023", async (ctx) => {
  const S = "S-M03-10-ZERO-023";
  const P = 商品の(S, "商品ID-M0310-023");
  const ks = "ABCD".split("").map((k) => `規格ID-M0310-023${k}`);
  const e = await 選んで一括編集を開く(ctx, 言葉("023"), [P.商品ID]);
  await ctx.step(3, async () => { await e.入れる(P.商品ID, "日本語", { 買取価格NM: 0, 基準価格NM: 10000 }); });
  await ctx.step(4, async () => { await 登録する(e); });
  let v: x.規格の値[] = [], h: number[] = [];
  await ctx.step(5, async () => { v = ks.map((k) => 値(S, k)); h = ks.map((k) => 件数(S, k)); note(`NM・SP・MP・HP: ${JSON.stringify(v)}・価格履歴 ${h.join("・")}`); });
  await ctx.expected(async () => {
    expect.soft(v.map((r) => r.買取価格), "NM・SP・MP・HP の買取価格がすべて0").toEqual(["0", "0", "0", "0"]);
    expect.soft(h, "4規格の価格履歴が追加される（0件から1件）").toEqual([1, 1, 1, 1]);
  });
});

caseTest("IT-M03-10-024", async (ctx) => {
  const S = "S-M03-10-SAME-024";
  const P = 商品の(S, "商品ID-M0310-024");
  const ks = "ABCD".split("").map((k) => `規格ID-M0310-024${k}`);
  const before = ks.map((k) => 値(S, k).基準価格);
  const e = await 選んで一括編集を開く(ctx, 言葉("024"), [P.商品ID]);
  await ctx.step(3, async () => { await e.入れる(P.商品ID, "日本語", { 買取価格NM: 4000, 基準価格NM: 8000 }); });
  await ctx.step(4, async () => { await 登録する(e); });
  let after: string[] = [], total = -1;
  await ctx.step(5, async () => { after = ks.map((k) => 値(S, k).基準価格); total = ks.reduce((s, k) => s + 件数(S, k), 0); note(`基準価格（登録前→後）: ${before.join("・")} → ${after.join("・")}・価格履歴 ${total} 件`); });
  await ctx.expected(async () => {
    expect.soft(after, "基準価格が登録前の値から更新されない").toEqual(before);
    expect.soft(total, "価格履歴件数が2件から増えない").toBe(2);
  });
});

/** 025・026: 2商品を選んで一括編集を開いたあと、A の NM 規格を DB で削除済みにし、両方に値を入れて登録する */
async function 開いたあと削除して登録(ctx: CaseCtx, S: string, 番号: "025" | "026"): Promise<{ e: 一括編集画面; r: { パス: string; 成功: string[]; エラー: string[] }; A: string; B: string }> {
  const A = 商品の(S, `商品ID-M0310-${番号}A`), B = 商品の(S, `商品ID-M0310-${番号}B`);
  const e = await 選んで一括編集を開く(ctx, 言葉(番号), [A.商品ID, B.商品ID]);
  await ctx.step(3, async () => {
    const c = 規格の(S, `規格ID-M0310-${番号}A`);
    x.規格を削除済みにする(`IT-M03-10-${番号} の手順3: 〔規格ID-M0310-${番号}A〕を削除済みにする`, c);
    expect(x.規格の値(c.商品規格ID).削除済み, "〔規格ID-M0310-" + 番号 + "A〕が削除済みになった").toBe(true);
    note(`DB で商品規格 ${c.商品コード} を削除済みにした（E2E の行だけ）`);
  });
  await ctx.step(4, async () => {
    await e.入れる(A.商品ID, "日本語", { 買取価格NM: 3500, 基準価格NM: 7500 });
    await e.入れる(B.商品ID, "日本語", { 買取価格NM: 2500, 基準価格NM: 6500 });
  });
  let r = { パス: "", 成功: [] as string[], エラー: [] as string[] };
  await ctx.step(5, async () => { r = await 登録する(e); });
  return { e, r, A: A.商品ID, B: B.商品ID };
}

caseTest("IT-M03-10-025", async (ctx) => {
  const S = "S-M03-10-DELETE-025";
  const { A, B } = await 開いたあと削除して登録(ctx, S, "025");
  let va: x.規格の値, vb: x.規格の値, h: number[] = [];
  await ctx.step(6, async () => {
    va = 値(S, "規格ID-M0310-025A"); vb = 値(S, "規格ID-M0310-025B"); h = [件数(S, "規格ID-M0310-025A"), 件数(S, "規格ID-M0310-025B")];
    note(`A ${JSON.stringify(va)}・B ${JSON.stringify(vb)}・価格履歴 ${h.join("・")}`);
  });
  await ctx.expected(async () => {
    expect.soft([va!.買取価格, va!.基準価格], `削除済み NM 規格を持つ商品ID ${A} の価格が変わらない（3000・7000）`).toEqual(["3000", "7000"]);
    expect.soft(h[0], `商品ID ${A} の価格履歴が変わらない（0件のまま）`).toBe(0);
    expect.soft([vb!.買取価格, vb!.基準価格], `商品ID ${B} の買取価格・基準価格が 2500・6500 に更新される`).toEqual(["2500", "6500"]);
    expect.soft(h[1], `商品ID ${B} の価格履歴が追加される`).toBeGreaterThan(0);
  });
});

caseTest("IT-M03-10-026", async (ctx) => {
  const { e, r } = await 開いたあと削除して登録(ctx, "S-M03-10-DELETE-026", "026");
  await ctx.expected(async () => {
    expect.soft(await e.開いているか(), "買取・基準価格一括編集画面が再表示される").toBe(true);
    expect.soft(r.エラー.join(" "), "規格が存在しない旨のエラーが表示される").toMatch(/削除されています|存在しません/);
  });
});

caseTest("IT-M03-10-035", async (ctx) => {
  const S = "S-M03-10-OVER-035";
  const P = 商品の(S, "商品ID-M0310-035");
  const e = await 選んで一括編集を開く(ctx, 言葉("035"), [P.商品ID]);
  await ctx.step(3, async () => { await e.入れる(P.商品ID, "日本語", { 買取価格NM: 10050, 基準価格NM: 20000 }); });
  await ctx.step(4, async () => { await 登録する(e); });
  let v: x.規格の値;
  await ctx.step(5, async () => { v = 値(S, "規格ID-M0310-035"); note(`NM 規格: ${JSON.stringify(v)}`); });
  await ctx.expected(async () => {
    expect.soft([v!.買取価格, v!.基準価格], "NM 規格が、買取価格 10050 を100円単位で切り上げた 10100、基準価格 20000 で保存される").toEqual(["10100", "20000"]);
  });
});

caseTest("IT-M03-10-043", async (ctx) => {
  const S = "S-M03-10-DEFRATE-043";
  const P = 商品の(S, "商品ID-M0310-043");
  const ks = "ABCD".split("").map((k) => `規格ID-M0310-043${k}`);
  const e = await 選んで一括編集を開く(ctx, 言葉("043"), [P.商品ID]);
  await ctx.step(3, async () => { await e.入れる(P.商品ID, "日本語", { 買取価格NM: 12000, 基準価格NM: 3000 }); });
  await ctx.step(4, async () => { await 登録する(e); });
  let v: string[] = [];
  await ctx.step(5, async () => { v = ks.map((k) => 値(S, k).買取価格); note(`NM・SP・MP・HP の買取価格: ${v.join("・")}`); });
  await ctx.expected(async () => {
    expect.soft(v, "NM の買取価格が 12000、SP・MP が 12000×75% の 9000、HP が 12000×50% の 6000").toEqual(["12000", "9000", "9000", "6000"]);
  });
});

caseTest("IT-M03-10-049", async (ctx) => {
  const S = "S-M03-10-BASE-049";
  const A = 商品の(S, "商品ID-M0310-049A"), B = 商品の(S, "商品ID-M0310-049B");
  await 二つ入れて登録(ctx, "049", A.商品ID, B.商品ID, [4000, 8000], [2500, 6500]);
  let va: x.規格の値, vb: x.規格の値, h: number[] = [];
  await ctx.step(5, async () => {
    va = 値(S, "規格ID-M0310-049A"); vb = 値(S, "規格ID-M0310-049B"); h = [件数(S, "規格ID-M0310-049A"), 件数(S, "規格ID-M0310-049B")];
    note(`A ${JSON.stringify(va)}・B ${JSON.stringify(vb)}・価格履歴 ${h.join("・")}`);
  });
  await ctx.expected(async () => {
    expect.soft([va!.買取価格, va!.基準価格], `商品ID ${A.商品ID} の NM 規格が 4000・8000 に更新される`).toEqual(["4000", "8000"]);
    expect.soft([vb!.買取価格, vb!.基準価格], `商品ID ${B.商品ID} の NM 規格が 2500・6500 に更新される`).toEqual(["2500", "6500"]);
    expect.soft(h, "両商品とも価格履歴が1件追加される（0件から）").toEqual([1, 1]);
  });
});

// ---- 表示在庫切替え ----

/** 034・078・079: 一括編集を開いて、表示在庫切替えで TC東京を選び、日本語の行を読む（手順1〜4） */
async function TC東京で読む(ctx: CaseCtx, S: string, 番号: string, 呼び名: string): Promise<一括の行> {
  const P = 商品の(S, 呼び名);
  const e = await 選んで一括編集を開く(ctx, 言葉(番号), [P.商品ID]);
  await ctx.step(3, async () => { await e.表示在庫を選ぶ("TC東京(通販＋TC東京スマレジ)"); });
  let r: 一括の行 | null = null;
  await ctx.step(4, async () => { r = await 行を読む(e, P.商品ID); note(行の文(r)); });
  return r!;
}

caseTest("IT-M03-10-034", async (ctx) => {
  const r = await TC東京で読む(ctx, "S-M03-10-NMSTOCK-034", "034", "商品ID-M0310-034");
  await ctx.expected(async () => {
    expect.soft(表示されている(r.在庫数[0]), `表示無効の NM 規格の在庫数(NM)（${欄の文(r.在庫数[0])}）が表示されない`).toBe(false);
  });
});

caseTest("IT-M03-10-078", async (ctx) => {
  const r = await TC東京で読む(ctx, "S-M03-10-CBDISP-078", "CB078", "商品ID-M0310-CB078");
  await ctx.expected(async () => {
    expect.soft(r.買取価格NM.入力欄, `表示有効の NM 規格の買取価格(NM)の入力欄が表示される（${欄の文(r.買取価格NM)}）`).toBe(true);
    expect.soft(r.基準価格[0].入力欄, `表示有効の NM 規格の基準価格(NM)の入力欄が表示される（${欄の文(r.基準価格[0])}）`).toBe(true);
    expect.soft(r.在庫数[0].文字, "在庫数(NM)が5と表示される").toBe("5");
  });
});

caseTest("IT-M03-10-079", async (ctx) => {
  const r = await TC東京で読む(ctx, "S-M03-10-CBDISP-079", "CB079", "商品ID-M0310-CB079");
  await ctx.expected(async () => {
    for (const i of [1, 2, 3]) {
      expect.soft(表示されている(r.在庫数[i]), `表示無効の ${状態[i]} 規格の在庫数(${状態[i]})（${欄の文(r.在庫数[i])}）が表示されない`).toBe(false);
      expect.soft(表示されている(r.基準価格[i]), `表示無効の ${状態[i]} 規格の基準価格(${状態[i]})（${欄の文(r.基準価格[i])}）が表示されない`).toBe(false);
    }
  });
});
