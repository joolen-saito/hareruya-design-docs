/**
 * M04-21 在庫変更CSV登録の続き（-x）。仕分け直し（not_runnable_recheck_cases2.tsv）で流せる見込みになったケース。
 * 正本: cases/M04-21_test_cases.tsv。振り分けと解釈は記録 review/M04-21_progress_2026-11-11_dev.md。
 *
 * - 店舗「試験店舗A（M04-21）」・所属「試験所属A（M04-21）」は、開発環境の試験用の店舗「試験店舗A」・所属「試験所属A」で読む（作らない。seeds/m04-21-x.ts）。
 * - 「M04-21試験管理者」「M04-21承認者A」などの名前・ログインID、商品コード・商品名・ファイル名は、実行の印を付けた値で読む。
 * - 事前準備①のログインは、手順1の前に行う（手順1がログインのケースを除く）。
 * - 手順が「入庫/問屋仕入を選択する」だけのケースは、ほかの欄を事前準備③の入力値で入れる。
 * - DB の確認は参照だけ（db/m04_21_x.ts）。「在庫編集承認情報」は在庫編集の承認の見出しと在庫編集承認一覧の行、「入庫承認待ち在庫情報」はその明細、
 *   「在庫変更履歴」は在庫変更CSV登録履歴の行（取込の記録）、「在庫変動履歴」は在庫の履歴として読む。
 */
import fs from "node:fs";
import { BrowserContext, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import * as db from "../../db/m04_21_x";
import { openStockChangeCsv } from "../../pages/admin/m04_21_stock_change_csv";
import {
  ファイルを選ぶ, 一括登録を押す, 入力, 入力する, 承認一覧の行, 承認一覧の見出し, 承認一覧を店舗で検索する, 承認一覧を開く,
  承認対象のリンクから承認する, 承認通知先の候補, 押した結果, 確認の窓で押す, 履歴のファイルを取り出す, 履歴の見出し, 履歴の行,
} from "../../pages/admin/m04_21_x_csv";
import { caseCsvPath } from "../../seeds/m04-21";
import {
  ファイル名の, ユーザー038, 商品コードの, 商品名の, 承認者047, 承認者A, 承認者B, 登録者047, 管理者007, 試験店舗A, 試験店舗B, 試験所属A, 試験管理者,
  試験管理者のメンバーID, 長い商品コード,
} from "../../seeds/m04-21-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 読み替え = () => note("店舗「試験店舗A（M04-21）」・所属「試験所属A（M04-21）」は、開発環境の試験用の店舗「試験店舗A」・所属「試験所属A」で読んだ（シード S-M04-21-MASTER）");
const CSV画面 = (path: string) => path.endsWith("/product/stock/change/new");
const 在庫IDの = (ctx: CaseCtx, n: string) => ctx.notes.get(`〔在庫ID-M0421-${n}〕`);
const 結果の文 = (r: 押した結果 | { 結果: "閉じた"; 窓が見える: boolean }) => JSON.stringify(r);
const 分 = (iso: string) => Math.floor(new Date(iso).getTime() / 60_000);
const 前後1分 = (iso: string, t: number) => Math.abs(分(iso) - Math.floor(t / 60_000)) <= 1;

type 区分 = "入庫/問屋仕入" | "廃棄/廃棄(破損)";
/** 事前準備③の入力値（店舗・在庫区分・所属・メンバー）と、ケースの在庫変動区分・在庫変動理由 */
const 入力値 = (在庫変動区分: 区分, 在庫変動理由: string, 承認者 = [承認者A.名前]): 入力 => ({
  店舗: 試験店舗A(), 在庫区分: "EC-CUBE", 在庫変動区分, 在庫変動理由, 所属: 試験所属A, 承認者,
});

async function 試験管理者で開く(ctx: CaseCtx): Promise<void> {
  ctx.page.setDefaultTimeout(60_000);
  await loginAdmin(ctx.page, 試験管理者.account);
  読み替え();
}

/** 在庫変更CSV登録画面を開き、入力し、ファイル（正本の名前）を選んで「一括登録を実行」を押す。結果を注記に残して返す */
async function 入れて選んで押す(page: Page, v: 入力, 正本のファイル名: string, waitMs?: number): Promise<押した結果> {
  await openStockChangeCsv(page);
  await 入力する(page, v);
  await ファイルを選ぶ(page, caseCsvPath(ファイル名の(正本のファイル名)));
  const r = await 一括登録を押す(page, waitMs);
  note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
  return r;
}

/** 画面の結果の誤りの文（送ったあとの帯と、画面のスクリプトの一覧） */
const 誤りの文 = (r: 押した結果): string[] => (r.結果 === "送信" ? r.誤り : r.結果 === "画面の誤り" ? r.誤り : []);
/** 誤りの文に、CSV の n 行目の誤りがあるか（画面のスクリプトは「行 n: …」、取込は「n行目: …」の形） */
const 行の誤りがある = (errs: string[], n: number) => errs.some((e) => new RegExp(`^行 ${n}:|(^|\\D)${n}行目`).test(e));

// ---- 005: 承認通知先（メンバー選択）の候補 ----
caseTest("IT-M04-21-005", async (ctx) => {
  await 試験管理者で開く(ctx);
  let 候補: string[] = [];
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); });
  await ctx.step(2, async () => { await 入力する(ctx.page, { 店舗: 試験店舗A(), 在庫区分: "EC-CUBE" }); });
  await ctx.step(3, async () => { await 入力する(ctx.page, { 所属: 試験所属A }); });
  await ctx.step(4, async () => {
    await expect.poll(() => 承認通知先の候補(ctx.page), { message: "承認通知先（メンバー選択）の候補を読み込み終える", timeout: 60_000 }).not.toEqual([]);
    await ctx.page.waitForLoadState("networkidle").catch(() => undefined);
    候補 = await 承認通知先の候補(ctx.page);
    note(`承認通知先（メンバー選択）の候補（${候補.length}名）: ${候補.join("、")}`);
  });
  await ctx.expected(async () => {
    expect.soft(候補, "承認通知先（メンバー選択）の候補に M04-21承認者A がいる").toContain(承認者A.名前);
    expect.soft(候補, "承認通知先（メンバー選択）の候補に M04-21承認者B がいる").toContain(承認者B.名前);
  });
});

// ---- 006: 画面の必須項目を1つずつ未選択にする ----
caseTest("IT-M04-21-006", async (ctx) => {
  await 試験管理者で開く(ctx);
  const 在庫ID = 在庫IDの(ctx, "006");
  const 最大ID = db.承認の最大ID();
  const 全部 = 入力値("入庫/問屋仕入", "入力検証");
  const 外す: { 手順: number; 何: string; v: 入力 }[] = [
    { 手順: 1, 何: "店舗", v: { ...全部, 店舗: undefined, 承認者: undefined } },
    { 手順: 2, 何: "在庫区分", v: { ...全部, 在庫区分: undefined } },
    { 手順: 3, 何: "在庫変動区分", v: { ...全部, 在庫変動区分: undefined } },
    { 手順: 4, 何: "在庫変動理由", v: { ...全部, 在庫変動理由: undefined } },
    { 手順: 5, 何: "承認通知先（所属選択）", v: { ...全部, 所属: undefined } },
    { 手順: 6, 何: "承認通知先（メンバー選択）", v: { ...全部, 承認者: undefined } },
  ];
  const パス: string[] = [];
  for (const x of 外す) {
    await ctx.step(x.手順, async () => {
      if (x.何 === "店舗") note("店舗を選ばないと承認通知先（メンバー選択）の候補が出ない（画面のスクリプトが店舗で問い合わせる）ので、メンバーも選んでいない");
      const r = await 入れて選んで押す(ctx.page, x.v, `required-screen-${x.手順}-006.csv`);
      if (r.結果 === "確認の窓") await 確認の窓で押す(ctx.page, "キャンセル");
      パス.push(new URL(ctx.page.url()).pathname);
    });
  }
  let 増えた = -1;
  const 記録: Record<string, number> = {};
  await ctx.step(7, async () => {
    増えた = db.増えた承認情報の件数(最大ID, 試験管理者のメンバーID(), 試験店舗A().ID, [在庫ID]);
    for (let i = 1; i <= 6; i++) 記録[ファイル名の(`required-screen-${i}-006.csv`)] = db.ファイルの在庫変更履歴の件数(ファイル名の(`required-screen-${i}-006.csv`));
    note(`増えた在庫編集承認情報 ${増えた} 件・在庫変更履歴 ${JSON.stringify(記録)}`);
  });
  await ctx.expected(async () => {
    expect.soft(増えた, "6回の操作で増えた在庫編集承認情報").toBe(0);
    for (const [f, n] of Object.entries(記録)) expect.soft(n, `在庫変更履歴（${f}）`).toBe(0);
    パス.forEach((p, i) => expect.soft(CSV画面(p), `操作${i + 1}（${外す[i].何}を未選択）のあとの画面が在庫変更CSV登録画面（${p}）`).toBe(true));
  });
});

// ---- 007: ファイルを選ばない ----
caseTest("IT-M04-21-007", async (ctx) => {
  ctx.page.setDefaultTimeout(60_000);
  await loginAdmin(ctx.page, 管理者007.account);
  読み替え();
  let r: 押した結果 = { 結果: "押せない" };
  let n = { 承認情報: -1, 在庫変更履歴: -1 };
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "ファイル未選択検証")); });
  await ctx.step(2, async () => {
    r = await 一括登録を押す(ctx.page);
    note(`ファイルを選ばずに「一括登録を実行」を押そうとしたあと: ${結果の文(r)}${r.結果 === "押せない" ? "（ファイルを選ぶまでボタンが無効で押せない作り）" : ""}`);
  });
  await ctx.step(3, async () => { n = db.登録者の承認情報と在庫変更履歴の件数(db.メンバーIDの(管理者007.名前)); note(`登録者 ${管理者007.名前} の件数: ${JSON.stringify(n)}`); });
  await ctx.expected(async () => {
    expect.soft(n.承認情報, "在庫編集承認情報（この管理者が登録者のもの）").toBe(0);
    expect.soft(n.在庫変更履歴, "在庫変更履歴（この管理者が登録者のもの）").toBe(0);
    expect.soft(CSV画面(new URL(ctx.page.url()).pathname), `いまの画面が在庫変更CSV登録画面（${ctx.page.url()}）`).toBe(true);
  });
});

// ---- 008・009: 在庫変動理由の最大長 ----
function 理由の長さ(番号: "008" | "009", 長さ: number, ファイル: string) {
  return async (ctx: CaseCtx) => {
    await 試験管理者で開く(ctx);
    const 在庫ID = 在庫IDの(ctx, 番号);
    const 理由 = "A".repeat(長さ);
    const name = ファイル名の(ファイル);
    const 前の明細 = db.在庫の明細(在庫ID).length;
    const 最大ID = db.承認の最大ID();
    let r: 押した結果 = { 結果: "押せない" };
    await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, { 在庫変動理由: 理由 }); });
    await ctx.step(2, async () => {
      const { 在庫変動理由: _, ...rest } = 入力値("入庫/問屋仕入", 理由);
      await 入力する(ctx.page, rest);
      await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    });
    await ctx.step(3, async () => {
      r = await 一括登録を押す(ctx.page);
      if (r.結果 === "確認の窓") await 確認の窓で押す(ctx.page, "OK");
      note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
    });
    let a: db.承認情報[] = [];
    let d: db.承認待ちの明細[] = [];
    let 増えた = -1;
    await ctx.step(4, async () => {
      a = db.ファイルの承認情報(name);
      d = a.length ? db.承認の明細(a[0].承認ID) : [];
      増えた = db.増えた承認情報の件数(最大ID, 試験管理者のメンバーID(), 試験店舗A().ID, [在庫ID]);
      note(`在庫編集承認情報 ${a.length} 件（理由の長さ ${a.map((x) => x.在庫変動理由.map((y) => y.length).join("・")).join(" / ")}）・入庫承認待ち在庫情報 ${d.length} 件・増えた在庫編集承認情報 ${増えた} 件`);
    });
    await ctx.expected(async () => {
      if (長さ === 65535) {
        note("在庫編集承認情報には在庫変動理由の欄が無いので、その在庫編集承認情報の明細に入った理由を、在庫編集承認情報の理由として見た");
        expect.soft(a.length, "在庫編集承認情報の件数").toBe(1);
        expect.soft(a[0]?.在庫変動理由.length === 1 && a[0].在庫変動理由[0] === 理由, `在庫編集承認情報の在庫変動理由が半角英字Aを65535文字（長さ ${a[0]?.在庫変動理由[0]?.length ?? 0}）`).toBe(true);
        expect.soft(d.length, "入庫承認待ち在庫情報の件数").toBe(1);
        expect.soft(d[0]?.在庫変動理由 === 理由, `入庫承認待ち在庫情報の在庫変動理由が半角英字Aを65535文字（長さ ${d[0]?.在庫変動理由.length ?? 0}）`).toBe(true);
      } else {
        expect.soft(a.length, "在庫編集承認情報（このファイルのもの）").toBe(0);
        expect.soft(増えた, "増えた在庫編集承認情報").toBe(0);
        expect.soft(db.在庫の明細(在庫ID).length, "入庫承認待ち在庫情報（この在庫のもの）の件数が登録前と同じ").toBe(前の明細);
        expect.soft(CSV画面(new URL(ctx.page.url()).pathname), `いまの画面が在庫変更CSV登録画面（${ctx.page.url()}）`).toBe(true);
      }
    });
  };
}
caseTest("IT-M04-21-008", 理由の長さ("008", 65535, "max-reason-008.csv"));
caseTest("IT-M04-21-009", 理由の長さ("009", 65536, "over-reason-009.csv"));

// ---- 012: 正常な入庫の登録 ----
caseTest("IT-M04-21-012", async (ctx) => {
  await 試験管理者で開く(ctx);
  const name = ファイル名の("inbound-valid-012.csv");
  let r: 押した結果 = { 結果: "押せない" };
  await ctx.step(1, async () => {
    await openStockChangeCsv(ctx.page);
    await 入力する(ctx.page, 入力値("入庫/問屋仕入", "問屋仕入CSV登録", [承認者A.名前, 承認者B.名前]));
  });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    r = await 一括登録を押す(ctx.page);
    note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
  });
  let a: db.承認情報[] = [];
  let d: db.承認待ちの明細[] = [];
  await ctx.step(3, async () => { a = db.ファイルの承認情報(name); d = a.length ? db.承認の明細(a[0].承認ID) : []; note(`在庫編集承認情報: ${JSON.stringify(a)}`); });
  let 行: Awaited<ReturnType<typeof 履歴の行>> = [];
  let 見出し: string[] = [];
  await ctx.step(4, async () => {
    if (!CSV画面(new URL(ctx.page.url()).pathname)) await openStockChangeCsv(ctx.page);
    行 = await 履歴の行(ctx.page, name);
    見出し = await 履歴の見出し(ctx.page);
    note(`在庫変更CSV登録履歴の見出し: ${見出し.join("・")}／${name} の行: ${JSON.stringify(行)}`);
  });
  await ctx.expected(async () => {
    expect.soft(a.length, "在庫編集承認情報の件数").toBe(1);
    const x = a[0];
    const want: Record<string, unknown> = {
      承認状態の表示: "未承認", 承認対象: "在庫変更CSV登録", 店舗ID: 試験店舗A().ID, 在庫区分: "EC-CUBE", 対象商品規格数: 1, 合計在庫増減数: 3, 合計総原価増減数: 600,
      在庫変動区分: "入庫/問屋仕入", 登録者: 試験管理者.名前,
    };
    for (const [k, v] of Object.entries(want)) expect.soft((x as unknown as Record<string, unknown> | undefined)?.[k] ?? "（無い）", `在庫編集承認情報の${k}`).toBe(v);
    expect.soft(x?.在庫変動理由, "在庫編集承認情報の理由（明細の理由）").toEqual(["問屋仕入CSV登録"]);
    expect.soft(x?.承認日時 ?? null, "承認日（空）").toBeNull();
    expect.soft(x?.承認者 ?? null, "承認者（承認待ち＝承認者なし）").toBeNull();
    expect.soft(x?.ファイル名, "在庫編集承認情報のファイル名").toEqual([name]);
    expect.soft(d.length, "入庫承認待ち在庫情報の件数").toBe(1);
    const y = d[0];
    const wantD: Record<string, unknown> = {
      承認ID: x?.承認ID, 商品コード: 商品コードの("M421-IN-012"), 商品名: 商品名の("入庫商品"), 言語: "日本語", 状態: "NM", 在庫ID: 在庫IDの(ctx, "012"),
      在庫増減数: 3, 仕入単価: 200, 総原価増減数: 600,
    };
    for (const [k, v] of Object.entries(wantD)) expect.soft((y as unknown as Record<string, unknown> | undefined)?.[k] ?? "（無い）", `入庫承認待ち在庫情報の${k}`).toBe(v);
    expect.soft(y?.更新日時, "入庫承認待ち在庫情報の更新日が登録日と同じ").toBe(y?.登録日時);
    expect.soft(y?.更新者, "入庫承認待ち在庫情報の更新者が登録者と同じ").toBe(試験管理者.名前);
    note("入庫承認待ち在庫情報（明細）にはファイル名・パスの欄が無いので、その在庫編集承認情報の取込の記録のファイル名・保存先を見た");
    expect.soft(x?.保存先.length ?? 0, "ファイルの保存先（パス）がある").toBe(1);
    expect.soft(行.length, `在庫変更CSV登録履歴の ${name} の行`).toBe(1);
    expect.soft(行[0]?.承認者, "在庫変更CSV登録履歴の承認者").toBe("承認待ち");
    expect.soft(行[0]?.行の文 ?? "", "在庫変更CSV登録履歴の行に、通知送付者として M04-21承認者A が出る").toContain(承認者A.名前);
    expect.soft(行[0]?.行の文 ?? "", "在庫変更CSV登録履歴の行に、通知送付者として M04-21承認者B が出る").toContain(承認者B.名前);
  });
});

// ---- 013: 廃棄の登録（仕入単価を使わない） ----
caseTest("IT-M04-21-013", async (ctx) => {
  await 試験管理者で開く(ctx);
  const 在庫ID = 在庫IDの(ctx, "013");
  const name = ファイル名の("discard-cost-013.csv");
  let r: 押した結果 = { 結果: "押せない" };
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("廃棄/廃棄(破損)", "破損廃棄")); });
  await ctx.step(2, async () => { await ファイルを選ぶ(ctx.page, caseCsvPath(name)); r = await 一括登録を押す(ctx.page); note(`「一括登録を実行」を押したあと: ${結果の文(r)}`); });
  let s: db.在庫 | null = null;
  let a: db.承認情報[] = [];
  let h: db.変動履歴[] = [];
  await ctx.step(3, async () => {
    s = db.在庫の(在庫ID); a = db.ファイルの承認情報(name); h = db.在庫の変動履歴(在庫ID).filter((x) => x.履歴登録元 === "在庫変更CSV登録");
    note(`在庫: ${JSON.stringify(s)}・在庫編集承認情報: ${JSON.stringify(a)}・在庫変動履歴（登録元 在庫変更CSV登録）: ${JSON.stringify(h)}`);
  });
  await ctx.expected(async () => {
    expect.soft(s?.在庫数, "M421-WASTE-013 の在庫数").toBe(7);
    expect.soft(s?.総原価, "M421-WASTE-013 の総原価（仕入単価999を使わない）").toBe(700);
    expect.soft(a.length, "在庫編集承認情報の件数").toBe(1);
    expect.soft(h.length, "在庫変動履歴（登録元 在庫変更CSV登録）の件数").toBe(1);
    const x = h[0];
    expect.soft(x?.変更前在庫, "変更前在庫").toBe(10);
    expect.soft(x?.変更前総原価, "変更前総原価").toBe(1000);
    expect.soft(x?.変更後在庫, "変更後在庫").toBe(7);
    expect.soft(x?.変更後総原価, "変更後総原価").toBe(700);
    expect.soft(x?.履歴登録元ID ?? "（無い）", "在庫変動履歴の在庫編集承認ID").toBe(a[0]?.承認ID ?? "（在庫編集承認情報が無い）");
    expect.soft(x?.承認日時 ?? null, "未承認（承認日時が空）").toBeNull();
    expect.soft(a[0]?.承認状態の表示, "在庫編集承認情報の承認状態").toBe("未承認");
  });
});

// ---- 014: 確認の窓のキャンセル・× ----
caseTest("IT-M04-21-014", async (ctx) => {
  await 試験管理者で開く(ctx);
  const A = 在庫IDの(ctx, "014A"), B = 在庫IDの(ctx, "014B");
  const 前 = { A: db.在庫の(A), B: db.在庫の(B), 明細: db.在庫の明細(A).length + db.在庫の明細(B).length, 履歴: db.在庫の変動履歴(A).length + db.在庫の変動履歴(B).length };
  const 最大ID = db.承認の最大ID();
  await ctx.step(1, async () => {
    const r = await 入れて選んで押す(ctx.page, 入力値("入庫/問屋仕入", "確認モーダル取消"), "alert-plus-014.csv");
    expect(r.結果, "100件増加の確認の窓が出る").toBe("確認の窓");
    note(`キャンセルを押したあと: ${結果の文(await 確認の窓で押す(ctx.page, "キャンセル"))}`);
  });
  await ctx.step(2, async () => {
    const r = await 入れて選んで押す(ctx.page, 入力値("廃棄/廃棄(破損)", "確認モーダル取消"), "alert-minus-014.csv");
    expect(r.結果, "100件減少の確認の窓が出る").toBe("確認の窓");
    note(`右上の×を押したあと: ${結果の文(await 確認の窓で押す(ctx.page, "×"))}`);
  });
  let 後 = { A: 前.A, B: 前.B, 明細: -1, 履歴: -1, ファイル: -1, 増えた: -1 };
  await ctx.step(3, async () => {
    後 = {
      A: db.在庫の(A), B: db.在庫の(B), 明細: db.在庫の明細(A).length + db.在庫の明細(B).length, 履歴: db.在庫の変動履歴(A).length + db.在庫の変動履歴(B).length,
      ファイル: db.ファイルの承認情報(ファイル名の("alert-plus-014.csv")).length + db.ファイルの承認情報(ファイル名の("alert-minus-014.csv")).length,
      増えた: db.増えた承認情報の件数(最大ID, 試験管理者のメンバーID(), 試験店舗A().ID, [A, B]),
    };
    note(`操作の前: ${JSON.stringify(前)}／あと: ${JSON.stringify(後)}`);
  });
  await ctx.expected(async () => {
    expect.soft(後.増えた, "増えた在庫編集承認情報").toBe(0);
    expect.soft(後.ファイル, "両ファイルの在庫編集承認情報").toBe(0);
    expect.soft(後.明細, "入庫承認待ち在庫情報（両商品）の件数が操作の前と同じ").toBe(前.明細);
    expect.soft(後.履歴, "在庫変動履歴（両商品）の件数が操作の前と同じ").toBe(前.履歴);
    expect.soft(後.A.在庫数, "M421-QMAX-014 の在庫数（変わらない）").toBe(0);
    expect.soft(後.B.在庫数, "M421-QMIN-014 の在庫数（変わらない）").toBe(99999999);
  });
});

// ---- 015: 確認の窓の OK ----
caseTest("IT-M04-21-015", async (ctx) => {
  await 試験管理者で開く(ctx);
  const name = ファイル名の("alert-ok-015.csv");
  await ctx.step(1, async () => {
    const r = await 入れて選んで押す(ctx.page, 入力値("入庫/問屋仕入", "確認モーダル確定"), "alert-ok-015.csv");
    expect(r.結果, "100件増加の確認の窓が出る").toBe("確認の窓");
  });
  await ctx.step(2, async () => { note(`OK を押したあと: ${結果の文(await 確認の窓で押す(ctx.page, "OK"))}`); });
  let a: db.承認情報[] = [];
  let d: db.承認待ちの明細[] = [];
  await ctx.step(3, async () => { a = db.ファイルの承認情報(name); d = a.length ? db.承認の明細(a[0].承認ID) : []; note(`在庫編集承認情報: ${JSON.stringify(a)}・明細: ${JSON.stringify(d)}`); });
  await ctx.expected(async () => {
    expect.soft(a.length, "在庫編集承認情報の件数").toBe(1);
    expect.soft(a[0]?.合計在庫増減数, "在庫編集承認情報の在庫増減数").toBe(100);
    expect.soft(d.length, "入庫承認待ち在庫情報の件数").toBe(1);
    expect.soft(d[0]?.在庫増減数, "入庫承認待ち在庫情報の在庫増減数").toBe(100);
    expect.soft(d[0]?.在庫ID, "対象商品の在庫").toBe(在庫IDの(ctx, "015"));
  });
});

// ---- 016: CSV の必須列 ----
caseTest("IT-M04-21-016", async (ctx) => {
  await 試験管理者で開く(ctx);
  const 在庫ID = 在庫IDの(ctx, "016");
  const name = ファイル名の("required-columns-016.csv");
  const 前の明細 = db.在庫の明細(在庫ID).length;
  const 最大ID = db.承認の最大ID();
  let r: 押した結果 = { 結果: "押せない" };
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "必須列検証")); });
  await ctx.step(2, async () => { await ファイルを選ぶ(ctx.page, caseCsvPath(name)); });
  await ctx.step(3, async () => { r = await 一括登録を押す(ctx.page); note(`「一括登録を実行」を押したあと: ${結果の文(r)}`); });
  let a = -1, 増えた = -1, 明細 = -1;
  await ctx.step(4, async () => { a = db.ファイルの承認情報(name).length; 増えた = db.増えた承認情報の件数(最大ID, 試験管理者のメンバーID(), 試験店舗A().ID, [在庫ID]); 明細 = db.在庫の明細(在庫ID).length; });
  await ctx.expected(async () => {
    const errs = 誤りの文(r);
    for (const n of [2, 3, 4]) expect.soft(行の誤りがある(errs, n), `${n}行目がエラー行として表示される（表示: ${errs.join(" / ")}）`).toBe(true);
    expect.soft(a, "在庫編集承認情報（このファイルのもの）").toBe(0);
    expect.soft(増えた, "増えた在庫編集承認情報").toBe(0);
    expect.soft(明細, "入庫承認待ち在庫情報（この商品のもの）の件数が登録前と同じ").toBe(前の明細);
  });
});

// ---- 017: 商品コード255文字 ----
caseTest("IT-M04-21-017", async (ctx) => {
  await 試験管理者で開く(ctx);
  const name = ファイル名の("code-255-017.csv");
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "最大長検証")); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    const r = await 一括登録を押す(ctx.page);
    note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
  });
  let d: db.承認待ちの明細[] = [];
  await ctx.step(3, async () => { const a = db.ファイルの承認情報(name); d = a.length ? db.承認の明細(a[0].承認ID) : []; note(`入庫承認待ち在庫情報 ${d.length} 件（商品コードの長さ ${d.map((x) => x.商品コード.length).join("・")}）`); });
  await ctx.expected(async () => {
    expect.soft(d.length, "入庫承認待ち在庫情報の件数").toBe(1);
    expect.soft(d[0]?.商品コード === 長い商品コード, `入庫承認待ち在庫情報の商品コードが半角英字Lを255文字（長さ ${d[0]?.商品コード.length ?? 0}）`).toBe(true);
  });
});

// ---- 019: 在庫増減数の最大値 ----
caseTest("IT-M04-21-019", async (ctx) => {
  await 試験管理者で開く(ctx);
  const name = ファイル名の("quantity-max-019.csv");
  let r: 押した結果 = { 結果: "押せない" };
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "数量最大値")); });
  await ctx.step(2, async () => { await ファイルを選ぶ(ctx.page, caseCsvPath(name)); r = await 一括登録を押す(ctx.page); note(`「一括登録を実行」を押したあと: ${結果の文(r)}`); });
  await ctx.step(3, async () => {
    expect(r.結果, "確認の窓が出る").toBe("確認の窓");
    note(`OK を押したあと: ${結果の文(await 確認の窓で押す(ctx.page, "OK"))}`);
  });
  let d: db.承認待ちの明細[] = [];
  await ctx.step(4, async () => { const a = db.ファイルの承認情報(name); d = a.length ? db.承認の明細(a[0].承認ID) : []; note(`入庫承認待ち在庫情報: ${JSON.stringify(d)}`); });
  await ctx.expected(async () => {
    expect.soft(d.length, "入庫承認待ち在庫情報の件数").toBe(1);
    expect.soft(d[0]?.在庫増減数, "入庫承認待ち在庫情報の在庫増減数").toBe(99999999);
  });
});

// ---- 020: 在庫増減数の最小値 ----
caseTest("IT-M04-21-020", async (ctx) => {
  await 試験管理者で開く(ctx);
  const 在庫ID = 在庫IDの(ctx, "020");
  const name = ファイル名の("quantity-min-020.csv");
  let r: 押した結果 = { 結果: "押せない" };
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("廃棄/廃棄(破損)", "数量最小値")); });
  await ctx.step(2, async () => { await ファイルを選ぶ(ctx.page, caseCsvPath(name)); r = await 一括登録を押す(ctx.page); note(`「一括登録を実行」を押したあと: ${結果の文(r)}`); });
  await ctx.step(3, async () => {
    expect(r.結果, "確認の窓が出る").toBe("確認の窓");
    note(`OK を押したあと: ${結果の文(await 確認の窓で押す(ctx.page, "OK"))}`);
  });
  let s: db.在庫 | null = null;
  let h: db.変動履歴[] = [];
  await ctx.step(4, async () => { s = db.在庫の(在庫ID); h = db.在庫の変動履歴(在庫ID).filter((x) => x.履歴登録元 === "在庫変更CSV登録"); note(`在庫: ${JSON.stringify(s)}・在庫変動履歴: ${JSON.stringify(h)}`); });
  await ctx.expected(async () => {
    expect.soft(s?.在庫数, "M421-QMIN-020 の在庫数").toBe(0);
    expect.soft(h.length, "在庫変動履歴（登録元 在庫変更CSV登録）の件数").toBe(1);
    expect.soft(h[0]?.在庫増減数, "在庫変動履歴の在庫増減数（-99999999 が受理される）").toBe(-99999999);
    expect.soft(h[0]?.変更前在庫, "在庫変動履歴の変更前在庫").toBe(99999999);
    expect.soft(h[0]?.変更後在庫, "在庫変動履歴の変更後在庫").toBe(0);
  });
});

// ---- 022: 仕入単価の境界 ----
caseTest("IT-M04-21-022", async (ctx) => {
  await 試験管理者で開く(ctx);
  const name = ファイル名の("cost-boundary-022.csv");
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "仕入単価境界")); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    const r = await 一括登録を押す(ctx.page);
    note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
  });
  let d: db.承認待ちの明細[] = [];
  await ctx.step(3, async () => { d = db.ファイルの承認情報(name).flatMap((a) => db.承認の明細(a.承認ID)); note(`入庫承認待ち在庫情報: ${JSON.stringify(d)}`); });
  await ctx.expected(async () => {
    const of = (c: string) => d.filter((x) => x.商品コード === 商品コードの(c));
    expect.soft(of("M421-COST0-022").length, "M421-COST0-022 の入庫承認待ち在庫情報").toBe(1);
    expect.soft(of("M421-COST0-022")[0]?.仕入単価, "M421-COST0-022 の仕入単価").toBe(0);
    expect.soft(of("M421-COSTMAX-022").length, "M421-COSTMAX-022 の入庫承認待ち在庫情報").toBe(1);
    expect.soft(of("M421-COSTMAX-022")[0]?.仕入単価, "M421-COSTMAX-022 の仕入単価").toBe(999999999);
  });
});

// ---- 024: 在庫増減数0の行を飛ばす ----
caseTest("IT-M04-21-024", async (ctx) => {
  await 試験管理者で開く(ctx);
  supplement("M421-ZERO-024 の在庫数5・総原価500、M421-IN-024 の在庫数10・総原価1000は画面で指定できないので、シードが E2E の在庫へ DB で書き足した値（シード表の投入方法のとおり）");
  const Z = 在庫IDの(ctx, "024A"), I = 在庫IDの(ctx, "024B");
  const name = ファイル名の("zero-then-valid-024.csv");
  const 前 = { Z承認: db.在庫の承認情報(Z).length, Z明細: db.在庫の明細(Z).length };
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "0件行検証")); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    const r = await 一括登録を押す(ctx.page);
    note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
  });
  let z = { 在庫: db.在庫の(Z), 承認: -1, 明細: -1 };
  let ia: db.承認情報[] = [];
  let id: db.承認待ちの明細[] = [];
  await ctx.step(3, async () => {
    z = { 在庫: db.在庫の(Z), 承認: db.在庫の承認情報(Z).length, 明細: db.在庫の明細(Z).length };
    ia = db.在庫の承認情報(I).filter((a) => a.ファイル名.includes(name));
    id = db.在庫の明細(I).filter((d) => ia.some((a) => a.承認ID === d.承認ID));
    note(`M421-ZERO-024: ${JSON.stringify(z)}・M421-IN-024 の在庫編集承認情報: ${JSON.stringify(ia)}・明細: ${JSON.stringify(id)}`);
  });
  await ctx.expected(async () => {
    expect.soft(z.在庫.在庫数, "M421-ZERO-024 の在庫数（変わらない）").toBe(5);
    expect.soft(z.在庫.総原価, "M421-ZERO-024 の総原価（変わらない）").toBe(500);
    expect.soft(z.承認, "M421-ZERO-024 の在庫編集承認情報の件数（増えない）").toBe(前.Z承認);
    expect.soft(z.明細, "M421-ZERO-024 の入庫承認待ち在庫情報の件数（増えない）").toBe(前.Z明細);
    expect.soft(ia.length, "M421-IN-024 の在庫編集承認情報").toBe(1);
    expect.soft(ia[0]?.合計在庫増減数, "M421-IN-024 の在庫編集承認情報の在庫増減数").toBe(1);
    expect.soft(id.length, "M421-IN-024 の入庫承認待ち在庫情報").toBe(1);
    expect.soft(id[0]?.在庫増減数, "M421-IN-024 の入庫承認待ち在庫情報の在庫増減数").toBe(1);
  });
});

// ---- 026: 商品の相関の誤りを最終行まで ----
caseTest("IT-M04-21-026", async (ctx) => {
  await 試験管理者で開く(ctx);
  const V = 在庫IDの(ctx, "026A");
  const name = ファイル名の("db-errors-026.csv");
  const 前の明細 = db.在庫の明細(V).length;
  const 最大ID = db.承認の最大ID();
  let r: 押した結果 = { 結果: "押せない" };
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "商品相関検証")); });
  await ctx.step(2, async () => { await ファイルを選ぶ(ctx.page, caseCsvPath(name)); r = await 一括登録を押す(ctx.page); note(`「一括登録を実行」を押したあと: ${結果の文(r)}`); });
  let a = -1, 増えた = -1, 明細 = -1;
  await ctx.step(3, async () => {
    a = db.ファイルの承認情報(name).length; 増えた = db.増えた承認情報の件数(最大ID, 試験管理者のメンバーID(), 試験店舗A().ID, [V]); 明細 = db.在庫の明細(V).length;
    note(`在庫編集承認情報（このファイル） ${a} 件・増えた在庫編集承認情報 ${増えた} 件・M421-VALID-026 の入庫承認待ち在庫情報 ${明細} 件（登録前 ${前の明細} 件）`);
  });
  await ctx.expected(async () => {
    const errs = 誤りの文(r);
    for (const n of [2, 4, 5, 6]) expect.soft(行の誤りがある(errs, n), `${n}行目がエラー行として表示される（表示: ${errs.join(" / ")}）`).toBe(true);
    expect.soft(行の誤りがある(errs, 3), "有効な3行目はエラー行にならない").toBe(false);
    expect.soft(a, "在庫編集承認情報（このファイルのもの）").toBe(0);
    expect.soft(増えた, "増えた在庫編集承認情報").toBe(0);
    expect.soft(明細, "有効な3行目（M421-VALID-026）の入庫承認待ち在庫情報の件数が登録前と同じ").toBe(前の明細);
  });
});

// ---- 027・028: 更新後の在庫の上限・0を下回る ----
function 更新後の在庫(番号: "027" | "028", 区分: 区分, 理由: string, ファイル: string, 在庫数: number) {
  return async (ctx: CaseCtx) => {
    await 試験管理者で開く(ctx);
    const 在庫ID = 在庫IDの(ctx, 番号);
    const name = ファイル名の(ファイル);
    const 前 = { 明細: db.在庫の明細(在庫ID).length, 履歴: db.在庫の変動履歴(在庫ID).length };
    const 最大ID = db.承認の最大ID();
    await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値(区分, 理由)); });
    await ctx.step(2, async () => {
      await ファイルを選ぶ(ctx.page, caseCsvPath(name));
      const r = await 一括登録を押す(ctx.page);
      note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
    });
    let 後 = { 在庫: db.在庫の(在庫ID), ファイル: -1, 増えた: -1, 明細: -1, 履歴: -1 };
    await ctx.step(3, async () => {
      後 = { 在庫: db.在庫の(在庫ID), ファイル: db.ファイルの承認情報(name).length, 増えた: db.増えた承認情報の件数(最大ID, 試験管理者のメンバーID(), 試験店舗A().ID, [在庫ID]), 明細: db.在庫の明細(在庫ID).length, 履歴: db.在庫の変動履歴(在庫ID).length };
      note(`登録前: ${JSON.stringify(前)}／あと: ${JSON.stringify(後)}`);
    });
    await ctx.expected(async () => {
      expect.soft(後.在庫.在庫数, "在庫数（変わらない）").toBe(在庫数);
      expect.soft(後.ファイル, "在庫編集承認情報（このファイルのもの）").toBe(0);
      expect.soft(後.増えた, "増えた在庫編集承認情報").toBe(0);
      if (番号 === "027") expect.soft(後.明細, "入庫承認待ち在庫情報の件数が登録前と同じ").toBe(前.明細);
      else expect.soft(後.履歴, "在庫変動履歴の件数が登録前と同じ").toBe(前.履歴);
    });
  };
}
caseTest("IT-M04-21-027", 更新後の在庫("027", "入庫/問屋仕入", "更新後上限", "post-upper-027.csv", 99999999));
caseTest("IT-M04-21-028", 更新後の在庫("028", "廃棄/廃棄(破損)", "在庫不足検証", "below-zero-028.csv", 5));

// ---- 030: 直近に取り込んだ同じ名前のファイル ----
caseTest("IT-M04-21-030", async (ctx) => {
  await 試験管理者で開く(ctx);
  supplement("直近の同名の取込は、シードが画面から同じ名前のファイルを一度取り込み、その登録日時を10分前へ DB で書き換えたもの");
  const name = ファイル名の("repeat-030.csv");
  const 前 = { 承認情報: db.ファイルの承認情報(name).length, 在庫変更履歴: db.ファイルの在庫変更履歴の件数(name) };
  let r: 押した結果 = { 結果: "押せない" };
  await ctx.step(1, async () => {
    await openStockChangeCsv(ctx.page);
    await 入力する(ctx.page, 入力値("入庫/問屋仕入", "同名確認"));
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
  });
  await ctx.step(2, async () => { r = await 一括登録を押す(ctx.page); note(`「一括登録を実行」を押したあと: ${結果の文(r)}`); });
  let 後 = { 承認情報: -1, 在庫変更履歴: -1 };
  await ctx.step(3, async () => { 後 = { 承認情報: db.ファイルの承認情報(name).length, 在庫変更履歴: db.ファイルの在庫変更履歴の件数(name) }; note(`登録前: ${JSON.stringify(前)}／あと: ${JSON.stringify(後)}`); });
  await ctx.expected(async () => {
    expect.soft(後.承認情報, `${name} の在庫編集承認情報の件数（増えない）`).toBe(前.承認情報);
    expect.soft(後.在庫変更履歴, `${name} の在庫変更履歴の件数（増えない）`).toBe(前.在庫変更履歴);
    expect.soft(CSV画面(new URL(ctx.page.url()).pathname), `いまの画面が在庫変更CSV登録画面（${ctx.page.url()}）`).toBe(true);
  });
});

// ---- 038: 編集権限の無い店舗 ----
caseTest("IT-M04-21-038", async (ctx) => {
  ctx.page.setDefaultTimeout(60_000);
  note("店舗「M0421-038-ST-A」「M0421-038-ST-B」は、開発環境の試験用の店舗「試験店舗A」「試験店舗B」で読んだ（シード S-M04-21-STOREPERM-038）");
  const name = ファイル名の("perm-b-038.csv");
  let r: 押した結果 = { 結果: "押せない" };
  await ctx.step(1, async () => { await loginAdmin(ctx.page, ユーザー038.account); });
  await ctx.step(2, async () => {
    await openStockChangeCsv(ctx.page);
    await 入力する(ctx.page, { 店舗: 試験店舗B(), 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/問屋仕入", 在庫変動理由: "権限検証", 所属: 試験所属A });
    await ctx.page.waitForLoadState("networkidle").catch(() => undefined);
    const 候補 = await 承認通知先の候補(ctx.page);
    if (候補.includes(承認者A.名前)) await 入力する(ctx.page, { 承認者: [承認者A.名前] });
    else note(`店舗「${試験店舗B().店名}」の承認通知先（メンバー選択）の候補に M04-21承認者A がいない（承認者Aは試験店舗Aだけを編集できる）ので選べなかった。候補: ${候補.join("、") || "なし"}`);
  });
  await ctx.step(3, async () => { await ファイルを選ぶ(ctx.page, caseCsvPath(name)); r = await 一括登録を押す(ctx.page); note(`「一括登録を実行」を押したあと: ${結果の文(r)}`); });
  let 行 = -1;
  let 表示: string[] = [];
  await ctx.step(4, async () => {
    表示 = [...誤りの文(r), ...(r.結果 === "送信" ? r.警告 : [])];
    if (!CSV画面(new URL(ctx.page.url()).pathname)) await openStockChangeCsv(ctx.page);
    行 = (await 履歴の行(ctx.page, name)).length;
    note(`画面のエラー表示: ${表示.join(" / ") || "なし"}・在庫変更CSV登録履歴の ${name} の行 ${行} 件`);
  });
  await ctx.expected(async () => {
    expect.soft(表示.some((t) => /編集権限/.test(t)), `編集権限のない店舗への登録が権限エラーになる（表示: ${表示.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(行, `在庫変更CSV登録履歴の ${name} の行`).toBe(0);
  });
});

// ---- 039: 9999件のCSV ----
caseTest("IT-M04-21-039", async (ctx) => {
  await 試験管理者で開く(ctx);
  test.setTimeout(30 * 60_000);
  const name = ファイル名の("rows-9999-039.csv");
  let r: 押した結果 = { 結果: "押せない" };
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "件数上限内検証")); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    r = await 一括登録を押す(ctx.page, 20 * 60_000);
    if (r.結果 === "確認の窓") { note("確認の窓が出たので OK を押した"); r = await 確認の窓で押す(ctx.page, "OK", 20 * 60_000) as 押した結果; }
    note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
  });
  let 行: Awaited<ReturnType<typeof 履歴の行>> = [];
  await ctx.step(3, async () => {
    if (!CSV画面(new URL(ctx.page.url()).pathname)) await openStockChangeCsv(ctx.page);
    行 = await 履歴の行(ctx.page, name);
    note(`在庫変更CSV登録履歴の ${name} の行 ${行.length} 件（表示しているページの分）: ${JSON.stringify(行.slice(0, 3))}`);
  });
  await ctx.expected(async () => {
    const errs = [...誤りの文(r), ...(r.結果 === "送信" ? r.警告 : [])];
    expect.soft(errs.filter((e) => /行を超える|件を超えて/.test(e)), "CSVの行数上限を超えたことを示すエラー").toEqual([]);
    expect.soft(行.length, `在庫変更CSV登録履歴に ${name} の行がある`).toBeGreaterThan(0);
    expect.soft(行.every((x) => x.承認状態 === "未承認"), `${name} の行の承認状態が「未承認」（${[...new Set(行.map((x) => x.承認状態))].join("・")}）`).toBe(true);
  });
});

// ---- 040: 入庫の登録項目 ----
caseTest("IT-M04-21-040", async (ctx) => {
  await 試験管理者で開く(ctx);
  const name = ファイル名の("inbound-meta-040.csv");
  let 押した時刻 = 0;
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "問屋仕入CSV登録")); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    押した時刻 = Date.now();
    const r = await 一括登録を押す(ctx.page);
    note(`「一括登録を実行」を押した時刻 ${new Date(押した時刻).toISOString()}・押したあと: ${結果の文(r)}`);
  });
  let a: db.承認情報[] = [];
  let d: db.承認待ちの明細[] = [];
  await ctx.step(3, async () => { a = db.ファイルの承認情報(name); d = a.length ? db.承認の明細(a[0].承認ID) : []; note(`在庫編集承認情報: ${JSON.stringify(a)}・明細: ${JSON.stringify(d)}`); });
  await ctx.expected(async () => {
    expect.soft(a.length, "在庫編集承認情報の件数").toBe(1);
    expect.soft(a[0] ? 前後1分(a[0].登録日時, 押した時刻) : false, `在庫編集承認情報の登録日（${a[0]?.登録日時}）が押した時刻の前後1分以内`).toBe(true);
    expect.soft(d.length, "入庫承認待ち在庫情報の件数").toBe(1);
    const y = d[0];
    expect.soft(y?.店舗ID, "入庫承認待ち在庫情報の店舗（試験店舗A）").toBe(試験店舗A().ID);
    expect.soft(y?.在庫区分, "入庫承認待ち在庫情報の在庫区分").toBe("EC-CUBE");
    expect.soft(y?.在庫変動区分, "入庫承認待ち在庫情報の在庫変動区分").toBe("入庫/問屋仕入");
    expect.soft(y ? 前後1分(y.登録日時, 押した時刻) : false, `入庫承認待ち在庫情報の登録日（${y?.登録日時}）が押した時刻の前後1分以内`).toBe(true);
    expect.soft(y?.登録者, "入庫承認待ち在庫情報の登録者").toBe(試験管理者.名前);
    expect.soft(y?.承認状態, "入庫承認待ち在庫情報の承認状態（1=未承認）").toBe(1);
  });
});

// ---- 041・042: 廃棄の在庫変動履歴 ----
caseTest("IT-M04-21-041", async (ctx) => {
  await 試験管理者で開く(ctx);
  const 在庫ID = 在庫IDの(ctx, "041");
  const name = ファイル名の("discard-detail-041.csv");
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("廃棄/廃棄(破損)", "破損廃棄")); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    const r = await 一括登録を押す(ctx.page);
    note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
  });
  let h: db.変動履歴[] = [];
  await ctx.step(3, async () => { h = db.在庫の変動履歴(在庫ID); note(`在庫変動履歴: ${JSON.stringify(h)}`); });
  await ctx.expected(async () => {
    expect.soft(h.length, "M0421-041-A の在庫変動履歴の件数").toBe(1);
    const x = h[0];
    const want: Record<string, unknown> = {
      商品コード: 商品コードの("M0421-041-A"), 商品名: 商品名の("M0421-041-廃棄商品"), 言語: "日本語", 状態: "NM", 店舗ID: 試験店舗A().ID, 在庫区分: "EC-CUBE",
      在庫変動区分: "廃棄/廃棄(破損)", 在庫変動理由: "破損廃棄", 在庫増減数: -5,
    };
    for (const [k, v] of Object.entries(want)) expect.soft((x as unknown as Record<string, unknown> | undefined)?.[k] ?? "（無い）", `在庫変動履歴の${k}${k === "店舗ID" ? "（試験店舗A）" : ""}`).toBe(v);
  });
});

caseTest("IT-M04-21-042", async (ctx) => {
  await 試験管理者で開く(ctx);
  const 在庫ID = 在庫IDの(ctx, "042");
  const name = ファイル名の("discard-meta-042.csv");
  let 押した時刻 = 0;
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("廃棄/廃棄(破損)", "破損廃棄")); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    押した時刻 = Date.now();
    const r = await 一括登録を押す(ctx.page);
    note(`「一括登録を実行」を押した時刻 ${new Date(押した時刻).toISOString()}・押したあと: ${結果の文(r)}`);
  });
  let h: db.変動履歴[] = [];
  await ctx.step(3, async () => { h = db.在庫の変動履歴(在庫ID); note(`在庫変動履歴: ${JSON.stringify(h)}`); });
  let 同じ内容 = false;
  await ctx.step(4, async () => {
    note("「ファイルパスが示す保存先のファイルを開く」は、保存先（在庫変動履歴の登録元の取込の記録の保存先）のファイルを、在庫変更CSV登録履歴のその行のファイル名のリンクから取り出して開いた");
    const 記録 = db.ファイルの在庫変更履歴の番号(name);
    if (!CSV画面(new URL(ctx.page.url()).pathname)) await openStockChangeCsv(ctx.page);
    if (記録.length !== 1) { note(`${name} の取込の記録が ${記録.length} 件で、開くファイルが決まらない`); return; }
    const 取り出した = await 履歴のファイルを取り出す(ctx.page, 記録[0]);
    const 送った = fs.readFileSync(caseCsvPath(name));
    同じ内容 = 取り出した.equals(送った);
    note(`取り出したファイル ${取り出した.length} バイト・アップロードしたファイル ${送った.length} バイト・同じ内容 ${同じ内容}`);
  });
  await ctx.expected(async () => {
    expect.soft(h.length, "M0421-042-A の在庫変動履歴の件数").toBe(1);
    const x = h[0];
    expect.soft(x ? 前後1分(x.登録日時, 押した時刻) : false, `在庫変動履歴の登録日（${x?.登録日時}）が押した時刻の前後1分以内`).toBe(true);
    expect.soft(x?.登録者, "在庫変動履歴の登録者").toBe(試験管理者.名前);
    expect.soft(x?.更新日時, "在庫変動履歴の更新日が登録日と同じ").toBe(x?.登録日時);
    expect.soft(x?.更新者, "在庫変動履歴の更新者が登録者と同じ").toBe(x?.登録者);
    note("在庫変動履歴にはファイル名・ファイルパスの欄が無いので、在庫変動履歴の登録元（在庫変更CSV登録の在庫編集承認情報）の取込の記録のファイル名・保存先を見た");
    expect.soft(x?.ファイル名, "在庫変動履歴のファイル名").toEqual([name]);
    expect.soft(x?.保存先.length ?? 0, "在庫変動履歴のファイルパス（保存先）がある").toBe(1);
    expect.soft(同じ内容, "保存先に、アップロードしたファイルと同じ内容のファイルがある").toBe(true);
  });
});

// ---- 047: 別のメンバーが承認したあとの在庫 ----
caseTest("IT-M04-21-047", async (ctx) => {
  ctx.page.setDefaultTimeout(60_000);
  読み替え();
  supplement("M0421-047-A の在庫数10・総原価10000は画面で指定できないので、シードが E2E の在庫へ DB で書き足した値（シード表の投入方法のとおり）");
  const 在庫ID = 在庫IDの(ctx, "047");
  const name = ファイル名の("inbound-approve-047.csv");
  const 前の履歴 = db.在庫の変動履歴(在庫ID).map((h) => h.履歴ID);
  let B: { page: Page; context: BrowserContext } | null = null;
  try {
    await ctx.step(1, async () => {
      await loginAdmin(ctx.page, 登録者047.account);
      await openStockChangeCsv(ctx.page);
      await 入力する(ctx.page, 入力値("入庫/問屋仕入", "仕入れによる入庫"));
    });
    await ctx.step(2, async () => {
      await ファイルを選ぶ(ctx.page, caseCsvPath(name));
      const r = await 一括登録を押す(ctx.page);
      note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
    });
    await ctx.step(3, async () => {
      const context = await ctx.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      await hideDebugToolbar(context);
      const page = await context.newPage();
      page.setDefaultTimeout(60_000);
      B = { page, context };
      await loginAdmin(page, 承認者047.account);
      await 承認一覧を開く(page);
    });
    await ctx.step(4, async () => { await 承認一覧を店舗で検索する(B!.page, 試験店舗A().店名); });
    await ctx.step(5, async () => {
      const a = db.ファイルの承認情報(name);
      if (a.length !== 1) throw new Error(`${name} の在庫編集承認情報が ${a.length} 件（1件のはず）`);
      const 一覧ID = db.承認一覧の番号(a[0].承認ID);
      const 行 = (await 承認一覧の行(B!.page)).find((x) => x.一覧ID === 一覧ID);
      note(`在庫編集承認一覧の M0421-047-登録者 の行: ${JSON.stringify(行)}`);
      expect(行?.登録者, "行の登録者").toBe(登録者047.名前);
      expect(行?.承認対象, "行の承認対象").toBe("在庫変更CSV登録");
      note(`確認の文: ${await 承認対象のリンクから承認する(B!.page, 一覧ID, "在庫変更CSV登録の承認", (m) => note(m))}`);
    });
  } finally {
    const b = B as { context: BrowserContext } | null;
    if (b) await b.context.close().catch(() => undefined);
  }
  let s: db.在庫 | null = null;
  let h: db.変動履歴[] = [];
  await ctx.step(6, async () => { s = db.在庫の(在庫ID); h = db.在庫の変動履歴(在庫ID).filter((x) => !前の履歴.includes(x.履歴ID)); note(`在庫: ${JSON.stringify(s)}・増えた在庫変動履歴: ${JSON.stringify(h)}`); });
  await ctx.expected(async () => {
    expect.soft(s?.在庫数, "M0421-047-A の在庫数").toBe(11);
    expect.soft(s?.総原価, "M0421-047-A の総原価").toBe(10900);
    expect.soft(h.length, "増えた在庫変動履歴の件数").toBe(1);
    const x = h[0];
    const want: Record<string, unknown> = {
      在庫変動区分: "入庫/問屋仕入", 在庫増減数: 1, 仕入総価格: 900, 変更前総原価: 10000, 変更後総原価: 10900, 変更前原価単価: 1000, 変更後原価単価: 991,
    };
    for (const [k, v] of Object.entries(want)) expect.soft((x as unknown as Record<string, unknown> | undefined)?.[k] ?? "（無い）", `在庫変動履歴の${k}`).toBe(v);
    expect.soft(x?.履歴登録元ID ?? null, "在庫変動履歴の履歴登録元ID（空）").toBeNull();
  });
});

// ---- 048: 通知送付者の表示 ----
caseTest("IT-M04-21-048", async (ctx) => {
  await 試験管理者で開く(ctx);
  const name = ファイル名の("notify-048.csv");
  let 行: Awaited<ReturnType<typeof 承認一覧の行>>[number] | undefined;
  let 見出し: string[] = [];
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "通知送付者検証")); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    const r = await 一括登録を押す(ctx.page);
    note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
  });
  await ctx.step(3, async () => { await 承認一覧を開く(ctx.page); });
  await ctx.step(4, async () => { await 承認一覧を店舗で検索する(ctx.page, 試験店舗A().店名); });
  await ctx.step(5, async () => {
    const a = db.ファイルの承認情報(name);
    if (a.length !== 1) throw new Error(`${name} の在庫編集承認情報が ${a.length} 件（1件のはず）`);
    const 一覧ID = db.承認一覧の番号(a[0].承認ID);
    行 = (await 承認一覧の行(ctx.page)).find((x) => x.一覧ID === 一覧ID);
    見出し = await 承認一覧の見出し(ctx.page);
    note(`在庫編集承認一覧の見出し: ${見出し.join("・")}／登録者 M04-21試験管理者 の行（承認対象 在庫変更CSV登録）: ${JSON.stringify(行)}`);
  });
  await ctx.expected(async () => {
    expect.soft(行 ? "あり" : "（行が無い）", "手順5の行（登録者 M04-21試験管理者・承認対象 在庫変更CSV登録）").toBe("あり");
    expect.soft(行?.登録者, "手順5の行の登録者").toBe(試験管理者.名前);
    expect.soft(行?.行の文 ?? "", "手順5の行に、通知送付者として M04-21承認者A が表示される").toContain(承認者A.名前);
  });
});

// ---- 053・055: 廃棄（仕入単価が空）・端数 ----
function 廃棄の結果(番号: "053-A" | "055-A", ファイル: string, 前: [number, number], 後: [number, number], 増減数: number) {
  return async (ctx: CaseCtx) => {
    await 試験管理者で開く(ctx);
    const 在庫ID = 在庫IDの(ctx, 番号);
    const name = ファイル名の(ファイル);
    let r: 押した結果 = { 結果: "押せない" };
    await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("廃棄/廃棄(破損)", "破損廃棄")); });
    await ctx.step(2, async () => { await ファイルを選ぶ(ctx.page, caseCsvPath(name)); r = await 一括登録を押す(ctx.page); note(`「一括登録を実行」を押したあと: ${結果の文(r)}`); });
    let s: db.在庫 | null = null;
    let a: db.承認情報[] = [];
    let h: db.変動履歴[] = [];
    await ctx.step(3, async () => {
      s = db.在庫の(在庫ID); a = db.ファイルの承認情報(name); h = db.在庫の変動履歴(在庫ID).filter((x) => x.履歴登録元 === "在庫変更CSV登録");
      note(`在庫: ${JSON.stringify(s)}・在庫編集承認情報: ${JSON.stringify(a)}・在庫変動履歴（登録元 在庫変更CSV登録）: ${JSON.stringify(h)}`);
    });
    await ctx.expected(async () => {
      if (番号 === "053-A") {
        expect.soft(r.結果, "エラーにならず送られる").toBe("送信");
        expect.soft(誤りの文(r), "エラーの表示").toEqual([]);
        expect.soft(a.length, `ファイル名 ${name} の在庫編集承認情報の件数`).toBe(1);
      }
      expect.soft(s?.在庫数, "在庫数").toBe(後[0]);
      expect.soft(s?.総原価, "総原価").toBe(後[1]);
      expect.soft(h.length, "在庫変動履歴の件数").toBe(1);
      const x = h[0];
      if (番号 === "053-A") expect.soft(x?.在庫増減数, "在庫変動履歴の増減数").toBe(増減数);
      expect.soft(x?.変更前在庫, "変更前在庫").toBe(前[0]);
      expect.soft(x?.変更前総原価, "変更前総原価").toBe(前[1]);
      expect.soft(x?.変更後在庫, "変更後在庫").toBe(後[0]);
      expect.soft(x?.変更後総原価, "変更後総原価").toBe(後[1]);
      expect.soft(x?.承認日時 ?? null, "未承認（承認日時が空）").toBeNull();
    });
  };
}
caseTest("IT-M04-21-053", 廃棄の結果("053-A", "waste-blank-m0421-053.csv", [10, 1000], [8, 800], -2));
caseTest("IT-M04-21-055", 廃棄の結果("055-A", "waste-round-m0421-055.csv", [3, 1000], [2, 667], -1));

// ---- 054: 入庫2行 ----
caseTest("IT-M04-21-054", async (ctx) => {
  await 試験管理者で開く(ctx);
  const name = ファイル名の("inbound-two-m0421-054.csv");
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, 入力値("入庫/問屋仕入", "問屋仕入CSV登録")); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(name));
    const r = await 一括登録を押す(ctx.page);
    note(`「一括登録を実行」を押したあと: ${結果の文(r)}`);
  });
  let a: db.承認情報[] = [];
  let d: db.承認待ちの明細[] = [];
  await ctx.step(3, async () => { a = db.ファイルの承認情報(name); d = a.flatMap((x) => db.承認の明細(x.承認ID)); note(`在庫編集承認情報: ${JSON.stringify(a)}・明細: ${JSON.stringify(d)}`); });
  await ctx.expected(async () => {
    expect.soft(a.length, `ファイル名 ${name} の在庫編集承認情報の件数`).toBe(2);
    const 組 = a.map((x) => `${x.対象商品規格数}・${x.合計在庫増減数}・${x.合計総原価増減数}`).sort();
    expect.soft(組, "在庫編集承認情報（対象商品規格数・合計在庫増減数・合計総原価増減数）").toEqual(["1・1・200", "1・3・900"]);
    const of = (c: string) => d.filter((x) => x.商品コード === 商品コードの(c));
    expect.soft(of("M0421-054-A").map((x) => `${x.在庫増減数}・${x.仕入単価}`), "M0421-054-A の入庫承認待ち在庫情報（増減数・仕入単価）").toEqual(["1・200"]);
    expect.soft(of("M0421-054-B").map((x) => `${x.在庫増減数}・${x.仕入単価}`), "M0421-054-B の入庫承認待ち在庫情報（増減数・仕入単価）").toEqual(["3・300"]);
    expect.soft(of("M0421-054-A")[0]?.承認ID !== undefined && of("M0421-054-A")[0]?.承認ID !== of("M0421-054-B")[0]?.承認ID, "両商品の入庫承認待ち在庫情報が別の在庫編集承認ID").toBe(true);
  });
});

// ---- 056: 同じ内容・別の名前のファイルを続けて ----
caseTest("IT-M04-21-056", async (ctx) => {
  await 試験管理者で開く(ctx);
  const A = ファイル名の("same-a-m0421-056.csv"), B = ファイル名の("same-b-m0421-056.csv");
  const v = 入力値("入庫/問屋仕入", "問屋仕入CSV登録");
  await ctx.step(1, async () => { await openStockChangeCsv(ctx.page); await 入力する(ctx.page, v); });
  await ctx.step(2, async () => {
    await ファイルを選ぶ(ctx.page, caseCsvPath(A));
    const r = await 一括登録を押す(ctx.page);
    note(`same-a を登録したあと: ${結果の文(r)}`);
  });
  await ctx.step(3, async () => {
    note("登録のあと画面が開き直して入力欄が空になるので、同じ入力値を入れ直してから same-b を選んだ");
    await openStockChangeCsv(ctx.page);
    await 入力する(ctx.page, v);
    await ファイルを選ぶ(ctx.page, caseCsvPath(B));
    const r = await 一括登録を押す(ctx.page);
    note(`same-b を登録したあと: ${結果の文(r)}`);
  });
  const 読む = (f: string) => { const a = db.ファイルの承認情報(f); return { a, d: a.flatMap((x) => db.承認の明細(x.承認ID)) }; };
  let x = { a: [] as db.承認情報[], d: [] as db.承認待ちの明細[] }, y = { a: [] as db.承認情報[], d: [] as db.承認待ちの明細[] };
  await ctx.step(4, async () => { x = 読む(A); y = 読む(B); note(`same-a: ${JSON.stringify(x)}／same-b: ${JSON.stringify(y)}`); });
  await ctx.expected(async () => {
    expect.soft(x.a.length, `${A} の在庫編集承認情報の件数`).toBe(1);
    expect.soft(y.a.length, `${B} の在庫編集承認情報の件数`).toBe(1);
    for (const [f, z] of [[A, x], [B, y]] as const) {
      expect.soft(z.d.map((q) => `${q.商品コード}・${q.在庫増減数}・${q.仕入単価}`), `${f} の入庫承認待ち在庫情報（商品コード・増減数・仕入単価）`)
        .toEqual([`${商品コードの("M0421-056-A")}・1・200`]);
    }
  });
});
