/**
 * M04-02 在庫編集の続き（-x）。仕分け直し（not_runnable_recheck_cases2.tsv）で流せる見込みになったケースのうち、在庫編集画面の登録・表示を見るもの。
 * 正本: cases/M04-02_test_cases.tsv。振り分けと解釈は記録 review/M04-02_progress_2026-11-11_dev.md。
 *
 * - 事前準備①のログインは、手順1の前に行う（M04-02担当者／権限外担当者。名前・ログインIDに実行の印つき）。
 * - ケースの文の商品コード・商品名・管理者名（「M0402-A-009」「在庫試験商品A」「M04-02担当者」「青木承認者-009」など）は、実行の印を付けた値で読む。
 * - 「在庫ID〔…〕の在庫編集画面を開く」は、在庫編集画面のアドレス（在庫ID）を直接開く。
 * - DB の確認は参照だけ（db/m04_02_x.ts）。期待結果の「在庫編集承認情報」は在庫編集の承認（承認一覧の行を含む）、「入庫承認待ち在庫情報」は在庫編集の承認の明細として読む。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import {
  在庫の, 在庫の承認待ちの明細, 在庫の承認情報, 在庫の変動履歴, 承認一覧の行の番号,
} from "../../db/m04_02_x";
import { fillStockEdit } from "../../pages/admin/m04_02_rc_stock";
import {
  在庫の表示, 在庫一覧に戻る, 在庫変動区分を選ぶ, 在庫編集画面である, 在庫編集画面を開く, 検索欄の店舗と在庫区分, 仕入単価の欄, 店舗と在庫区分で検索する, 登録を押す,
} from "../../pages/admin/m04_02_stock_x";
import { StockApprovalListPage, StockListPage } from "../../pages/admin/stock_edit";
import { TC東京2F, 共通の商品, 商品コードの, 承認者の, 担当者, 権限外担当者, 青木承認者, TC東京2FのID } from "../../seeds/m04-02-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 今日 = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
const 在庫IDの = (ctx: CaseCtx, n: string) => ctx.notes.get(`〔在庫ID-M0402-${n}〕`);

type 入力 = { 区分: string; 理由: string; 増減数: string; 仕入単価?: string; 承認者: string };
const 入れる = (page: Page, v: 入力) => fillStockEdit(page, { 在庫変動区分: v.区分, 在庫変動理由: v.理由, 在庫増減数: v.増減数, 仕入単価: v.仕入単価, 承認通知先: v.承認者 });

/** 手順1〜3（在庫編集画面を開き、入力して、登録を押す）。手順4以降と期待結果は呼ぶ側 */
async function 開いて入れて押す(ctx: CaseCtx, n: string, v: 入力, 手順の始め = 1): Promise<{ path: string; エラー: string[]; 成功: string[] }> {
  let r = { path: "", エラー: [] as string[], 成功: [] as string[] };
  await ctx.step(手順の始め, async () => { expect(await 在庫編集画面を開く(ctx.page, 在庫IDの(ctx, n)), "在庫編集画面の応答").toBe(200); });
  await ctx.step(手順の始め + 1, async () => { await 入れる(ctx.page, v); });
  await ctx.step(手順の始め + 2, async () => {
    r = await 登録を押す(ctx.page);
    note(`登録を押したあと: ${r.path}・成功の表示 ${r.成功.join(" / ") || "なし"}・エラー ${r.エラー.join(" / ") || "なし"}`);
  });
  return r;
}

// ---- 001・051: 在庫商品情報と在庫情報の表示 ----
caseTest("IT-M04-02-001", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  let 表示: Record<string, string> = {};
  await ctx.step(1, async () => { expect(await 在庫編集画面を開く(ctx.page, 在庫IDの(ctx, "001")), "在庫編集画面の応答").toBe(200); });
  await ctx.step(2, async () => { 表示 = await 在庫の表示(ctx.page); note(`在庫編集画面の表示: ${JSON.stringify(表示)}`); });
  await ctx.expected(async () => {
    const want: Record<string, string> = {
      商品ID: ctx.notes.get("〔商品ID-M0402-共有〕"), 商品名: 共通の商品.商品名(), 商品規格ID: ctx.notes.get("〔商品規格ID-M0402-001〕"),
      商品コード: 商品コードの("M0402-A-001"), 言語: "日本語", 状態: "NM", 在庫ID: 在庫IDの(ctx, "001"), 店舗: TC東京2F.ショップ名略称, 在庫場所: "EC-CUBE", 在庫数: "10", 総原価: "¥10,000",
    };
    for (const [k, v] of Object.entries(want)) expect.soft(表示[k] ?? "（表示が無い）", `${k}${k === "在庫場所" ? "（在庫区分）" : ""}`).toBe(v);
  });
});
caseTest("IT-M04-02-051", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  let 表示: Record<string, string> = {};
  await ctx.step(1, async () => { expect(await 在庫編集画面を開く(ctx.page, 在庫IDの(ctx, "051")), "在庫編集画面の応答").toBe(200); });
  await ctx.step(2, async () => { 表示 = await 在庫の表示(ctx.page); });
  await ctx.expected(async () => { expect.soft(表示["Foil"] ?? "（表示が無い）", "在庫商品情報のFoil").toBe("通常"); });
});

// ---- 009〜013: 入庫の登録 ----
const 入庫 = (n: string, 理由: string, 増減数 = "2", 仕入単価 = "300"): 入力 => ({ 区分: "入庫/問屋仕入", 理由, 増減数, 仕入単価, 承認者: 承認者の(n).名前 });

caseTest("IT-M04-02-009", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  await 開いて入れて押す(ctx, "009", 入庫("009", "問屋からの入庫"));
  let a: ReturnType<typeof 在庫の承認情報> = [];
  let d: ReturnType<typeof 在庫の承認待ちの明細> = [];
  await ctx.step(4, async () => { a = 在庫の承認情報(在庫IDの(ctx, "009")); d = 在庫の承認待ちの明細(在庫IDの(ctx, "009")); note(`在庫編集承認情報: ${JSON.stringify(a)}`); });
  await ctx.expected(async () => {
    expect.soft(a.length, "在庫編集承認情報の件数").toBe(1);
    const x = a[0];
    expect.soft(x?.承認状態, "承認状態（1=未承認）").toBe(1);
    expect.soft(x?.承認対象, "承認対象").toBe("在庫編集");
    expect.soft(x?.店舗ID, "店舗（TC東京2F）").toBe(TC東京2FのID());
    expect.soft(x?.在庫区分, "在庫区分").toBe("EC-CUBE");
    expect.soft(x?.対象商品規格数, "対象商品規格数").toBe(1);
    expect.soft(x?.合計在庫増減数, "合計在庫増減数").toBe(2);
    expect.soft(x?.合計総原価増減数, "合計総原価増減数").toBe(600);
    expect.soft(x?.在庫変動区分, "在庫変動区分").toBe("入庫/問屋仕入");
    expect.soft(x?.在庫変動理由, "在庫変動理由").toEqual(["問屋からの入庫"]);
    expect.soft(x?.登録日, "登録日（実施日）").toBe(今日());
    expect.soft(x?.登録者, "登録者").toBe(担当者.名前);
    expect.soft(x?.承認日 ?? null, "承認日（空）").toBeNull();
    expect.soft(x?.承認者 ?? null, "承認者（承認待ち＝承認者なし）").toBeNull();
    expect.soft(d[0]?.変更前仕入単価 ?? null, "変更前の原価単価は登録されない（空）").toBeNull();
  });
});

caseTest("IT-M04-02-010", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  await 開いて入れて押す(ctx, "010", 入庫("010", "問屋からの入庫"));
  let a: ReturnType<typeof 在庫の承認情報> = [];
  let d: ReturnType<typeof 在庫の承認待ちの明細> = [];
  await ctx.step(4, async () => { a = 在庫の承認情報(在庫IDの(ctx, "010")); d = 在庫の承認待ちの明細(在庫IDの(ctx, "010")); note(`入庫承認待ち在庫情報: ${JSON.stringify(d)}`); });
  await ctx.expected(async () => {
    expect.soft(d.length, "入庫承認待ち在庫情報の件数").toBe(1);
    const x = d[0];
    const want = {
      商品コード: 商品コードの("M0402-A-010"), 商品名: 共通の商品.商品名(), 言語: "日本語", 状態: "NM", 店舗ID: TC東京2FのID(), 在庫区分: "EC-CUBE",
      在庫変動区分: "入庫/問屋仕入", 在庫変動理由: "問屋からの入庫", 在庫増減数: 2, 仕入単価: 300, 総原価増減数: 600, 登録者: 担当者.名前, 承認状態: 1,
    };
    for (const [k, v] of Object.entries(want)) expect.soft((x as unknown as Record<string, unknown> | undefined)?.[k] ?? "（無い）", k === "承認状態" ? "承認状態（1=未承認）" : k).toBe(v);
    expect.soft(x?.更新日時, "更新日が登録日と同じ").toBe(x?.登録日時);
    expect.soft(x?.更新者, "更新者が登録者と同じ").toBe(担当者.名前);
    expect.soft(x?.承認ID, "同時に登録された在庫編集承認情報を参照する").toBe(a[0]?.承認ID);
  });
});

caseTest("IT-M04-02-011", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  await 開いて入れて押す(ctx, "011", 入庫("011", "承認待ち確認"));
  let s = { 在庫数: -1, 総原価: -1 };
  await ctx.step(4, async () => { s = 在庫の(在庫IDの(ctx, "011")); });
  await ctx.expected(async () => {
    expect.soft(s.在庫数, "承認前の在庫数（更新されない）").toBe(10);
    expect.soft(s.総原価, "承認前の総原価（更新されない）").toBe(10000);
  });
});

caseTest("IT-M04-02-012", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  const r = await 開いて入れて押す(ctx, "012", 入庫("012", "遷移確認", "1"));
  await ctx.expected(async () => {
    note("アプリに「在庫承認（編集）」という題の画面は無い。登録が成功すると、同じ在庫の在庫承認（編集）の画面（在庫編集画面。アドレスは在庫ID の stock-approval/new）へ戻る作りなので、そこへ戻ったことを確かめた");
    expect.soft(r.path, "遷移した画面（在庫承認（編集）の画面）").toMatch(new RegExp(`/product/stock/${在庫IDの(ctx, "012")}/stock-approval/new$`));
    expect.soft(await 在庫編集画面である(ctx.page), "在庫承認（編集）の画面の入力欄がある").toBe(true);
    expect.soft(r.成功.length, "登録の成功の表示").toBeGreaterThan(0);
  });
});

caseTest("IT-M04-02-013", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  await 開いて入れて押す(ctx, "013", 入庫("013", "通知者確認", "1"));
  let 行の文 = "";
  await ctx.step(4, async () => {
    const a = 在庫の承認情報(在庫IDの(ctx, "013"));
    expect(a.length, "登録した在庫編集承認情報がある").toBe(1);
    const list = new StockApprovalListPage(ctx.page);
    await list.open(TC東京2F.店名);
    const row = list.rows.filter({ has: ctx.page.locator(`input[name="approval_list_ids[]"][value="${承認一覧の行の番号(a[0].承認ID)}"]`) });
    await expect(row, "在庫編集承認一覧に、登録した承認情報の行がある").toHaveCount(1);
    行の文 = (await row.innerText()).replace(/\s+/g, " ").trim();
    note(`在庫編集承認一覧の行: ${行の文}`);
  });
  await ctx.expected(async () => {
    expect.soft(行の文, "登録した承認情報の通知送付者").toContain(承認者の("013").名前);
  });
});

// ---- 015: 編集権限の無い管理者 ----
caseTest("IT-M04-02-015", async (ctx) => {
  await loginAdmin(ctx.page, 権限外担当者.account);
  const id = 在庫IDの(ctx, "015");
  const 前 = { 承認: 在庫の承認情報(id).length, 明細: 在庫の承認待ちの明細(id).length, 履歴: 在庫の変動履歴(id).length };
  let 入れた = false;
  await ctx.step(1, async () => { note(`在庫編集画面の応答 ${await 在庫編集画面を開く(ctx.page, id)}`); });
  await ctx.step(2, async () => {
    try { await 入れる(ctx.page, { 区分: "入庫/問屋仕入", 理由: "権限外登録", 増減数: "1", 仕入単価: "300", 承認者: 青木承認者.名前 }); 入れた = true; }
    catch (e) { note(`編集権限の無い管理者の画面では入力できなかった（${String(e).split("\n")[0].slice(0, 160)}）。期待結果は DB で確かめられるので続けた`); }
  });
  await ctx.step(3, async () => {
    if (!入れた) { note("入力できなかったので、登録ボタンは押していない"); return; }
    const r = await 登録を押す(ctx.page);
    note(`登録を押したあと: ${r.path}・成功 ${r.成功.join(" / ") || "なし"}・エラー ${r.エラー.join(" / ") || "なし"}`);
  });
  let 後 = { 承認: 0, 明細: 0, 履歴: 0 };
  await ctx.step(4, async () => { 後 = { 承認: 在庫の承認情報(id).length, 明細: 在庫の承認待ちの明細(id).length, 履歴: 在庫の変動履歴(id).length }; });
  await ctx.expected(async () => {
    expect.soft(後.承認, "在庫編集承認情報が追加されない").toBe(前.承認);
    expect.soft(後.明細, "入庫承認待ち在庫情報が追加されない").toBe(前.明細);
    expect.soft(後.履歴, "在庫変動履歴が追加されない").toBe(前.履歴);
  });
});

// ---- 018〜026・054: 入庫の境界の値 ----
function 入庫の値(n: string, v: 入力, 手順の前?: string, 確かめ?: (d: ReturnType<typeof 在庫の承認待ちの明細>) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    await loginAdmin(ctx.page, 担当者.account);
    const off = 手順の前 ? 1 : 0;
    if (手順の前) await ctx.step(1, async () => { note(手順の前); });
    await 開いて入れて押す(ctx, n, v, 1 + off);
    let d: ReturnType<typeof 在庫の承認待ちの明細> = [];
    await ctx.step(4 + off, async () => { d = 在庫の承認待ちの明細(在庫IDの(ctx, n)); note(`入庫承認待ち在庫情報: ${JSON.stringify(d.map((x) => ({ ...x, 在庫変動理由: `${x.在庫変動理由.slice(0, 20)}…（${x.在庫変動理由.length}文字）` })))}`); });
    await ctx.expected(async () => {
      expect.soft(d.length, "入庫承認待ち在庫情報の件数").toBe(1);
      確かめ?.(d);
    });
  };
}
const a65535 = "a".repeat(65535);
const a16383 = "a".repeat(16383);
caseTest("IT-M04-02-018", 入庫の値("018", { 区分: "入庫/問屋仕入", 理由: a65535, 増減数: "1", 仕入単価: "0", 承認者: 承認者の("018").名前 },
  "半角英字aを65535回連結した文字列を作った（65535byte）",
  (d) => { expect.soft(d[0]?.在庫変動理由.length, "在庫変動理由の文字数").toBe(65535); expect.soft(d[0]?.在庫変動理由 === a65535, "在庫変動理由が半角英字aの65535文字").toBe(true); }));
caseTest("IT-M04-02-054", 入庫の値("054", { 区分: "入庫/問屋仕入", 理由: a16383, 増減数: "1", 仕入単価: "0", 承認者: 承認者の("054").名前 },
  "半角英字aを16383回連結した文字列を作った",
  (d) => { expect.soft(d[0]?.在庫変動理由.length, "在庫変動理由の文字数").toBe(16383); expect.soft(d[0]?.在庫変動理由 === a16383, "在庫変動理由が半角英字aの16383文字").toBe(true); }));
caseTest("IT-M04-02-021", 入庫の値("021", { 区分: "入庫/問屋仕入", 理由: "入庫下限", 増減数: "1", 仕入単価: "0", 承認者: 承認者の("021").名前 }, undefined,
  (d) => { expect.soft(d[0]?.在庫増減数, "在庫増減数").toBe(1); }));
caseTest("IT-M04-02-023", 入庫の値("023", { 区分: "入庫/問屋仕入", 理由: "在庫8桁上限", 増減数: "99999999", 仕入単価: "0", 承認者: 承認者の("023").名前 }, undefined,
  (d) => { expect.soft(d[0]?.在庫増減数, "在庫増減数").toBe(99999999); }));
caseTest("IT-M04-02-025", 入庫の値("025", { 区分: "入庫/GOOD抜き", 理由: "単価0円入庫", 増減数: "1", 仕入単価: "0", 承認者: 承認者の("025").名前 }, undefined,
  (d) => { expect.soft(d[0]?.仕入単価, "仕入単価").toBe(0); expect.soft(d[0]?.総原価増減数, "総原価増減数").toBe(0); }));
caseTest("IT-M04-02-026", 入庫の値("026", { 区分: "入庫/問屋仕入", 理由: "単価上限", 増減数: "1", 仕入単価: "999999999", 承認者: 承認者の("026").名前 }, undefined,
  (d) => { expect.soft(d[0]?.仕入単価, "仕入単価").toBe(999999999); expect.soft(d[0]?.総原価増減数, "総原価増減数").toBe(999999999); }));

// ---- 029: 廃棄へ変えると仕入単価が入力できない ----
caseTest("IT-M04-02-029", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  let 状態 = { 入力できる: true, 値: "" };
  await ctx.step(1, async () => { expect(await 在庫編集画面を開く(ctx.page, 在庫IDの(ctx, "029")), "在庫編集画面の応答").toBe(200); });
  await ctx.step(2, async () => { await 在庫変動区分を選ぶ(ctx.page, "入庫/問屋仕入"); await 仕入単価の欄(ctx.page).fill("300"); });
  await ctx.step(3, async () => { await 在庫変動区分を選ぶ(ctx.page, "廃棄/廃棄(破損)"); await ctx.page.waitForTimeout(500); });
  await ctx.step(4, async () => {
    const f = 仕入単価の欄(ctx.page);
    状態 = { 入力できる: await f.isEditable(), 値: await f.inputValue() };
    note(`仕入単価の欄: ${JSON.stringify(状態)}`);
  });
  await ctx.expected(async () => {
    expect.soft(状態.入力できる, "仕入単価に入力できない").toBe(false);
    expect.soft(状態.値, "入力済みの300が削除される").toBe("");
  });
});

// ---- 030・031・048・049・060・061: 廃棄の登録（承認を待たずに在庫が減り、履歴が残る） ----
function 廃棄(n: string, 理由: string, 増減数: string, 確かめ: (ctx: CaseCtx, r: { 在庫: ReturnType<typeof 在庫の>; 承認: ReturnType<typeof 在庫の承認情報>; 履歴: ReturnType<typeof 在庫の変動履歴>; 押した: number }) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    await loginAdmin(ctx.page, 担当者.account);
    let 押した = 0;
    await ctx.step(1, async () => { expect(await 在庫編集画面を開く(ctx.page, 在庫IDの(ctx, n)), "在庫編集画面の応答").toBe(200); });
    await ctx.step(2, async () => { await 入れる(ctx.page, { 区分: "廃棄/廃棄(破損)", 理由, 増減数, 承認者: 承認者の(n).名前 }); });
    await ctx.step(3, async () => { 押した = Date.now(); const r = await 登録を押す(ctx.page); note(`登録を押したあと: ${r.path}・成功 ${r.成功.join(" / ") || "なし"}・エラー ${r.エラー.join(" / ") || "なし"}`); });
    let r = { 在庫: { 在庫数: -1, 総原価: -1 }, 承認: [] as ReturnType<typeof 在庫の承認情報>, 履歴: [] as ReturnType<typeof 在庫の変動履歴>, 押した: 0 };
    await ctx.step(4, async () => {
      const id = 在庫IDの(ctx, n);
      r = { 在庫: 在庫の(id), 承認: 在庫の承認情報(id), 履歴: 在庫の変動履歴(id), 押した };
      note(`在庫 ${JSON.stringify(r.在庫)}・在庫編集承認情報 ${r.承認.length}件・在庫変動履歴 ${JSON.stringify(r.履歴)}`);
    });
    await ctx.expected(async () => {
      expect.soft(r.履歴.length, "在庫変動履歴の件数（1件登録される）").toBe(1);
      確かめ(ctx, r);
    });
  };
}
caseTest("IT-M04-02-030", 廃棄("030", "汚れによる廃棄", "-1", (_c, r) => {
  expect.soft(r.在庫.在庫数, "在庫数").toBe(9);
  expect.soft(r.在庫.総原価, "総原価").toBe(9000);
  expect.soft(r.承認.length, "在庫編集承認情報の件数").toBe(1);
  expect.soft(r.承認[0]?.承認状態, "承認状態（1=未承認）").toBe(1);
  const h = r.履歴[0];
  expect.soft(h?.承認ID, "在庫変動履歴の在庫編集承認ID（承認情報と同じ）").toBe(r.承認[0]?.承認ID);
  expect.soft([h?.在庫増減数, h?.変更前在庫, h?.変更後在庫, h?.変更前総原価, h?.変更後総原価], "在庫増減数・変更前在庫・変更後在庫・変更前総原価・変更後総原価").toEqual([-1, 10, 9, 10000, 9000]);
}));
caseTest("IT-M04-02-031", 廃棄("031", "全数廃棄", "-99999999", (_c, r) => {
  expect.soft(r.在庫.在庫数, "在庫数").toBe(0);
  expect.soft(r.在庫.総原価, "総原価").toBe(0);
  const h = r.履歴[0];
  expect.soft([h?.変更前在庫, h?.変更後在庫, h?.変更前総原価, h?.変更後総原価], "変更前在庫・変更後在庫・変更前総原価・変更後総原価").toEqual([99999999, 0, 99999999, 0]);
}));
caseTest("IT-M04-02-048", 廃棄("048", "M0402-048 履歴項目確認", "-3", (_c, r) => {
  const h = r.履歴[0];
  const want = {
    商品コード: 商品コードの("M0402-048-A"), 商品名: 共通の商品.商品名(), 言語: "日本語", 状態: "NM", 店舗ID: TC東京2FのID(), 在庫区分: "EC-CUBE",
    在庫変動区分: "廃棄/廃棄(破損)", 在庫変動理由: "M0402-048 履歴項目確認", 在庫増減数: -3, 総原価増減数: -4500,
  };
  for (const [k, v] of Object.entries(want)) expect.soft((h as unknown as Record<string, unknown> | undefined)?.[k] ?? "（無い）", k).toBe(v);
}));
caseTest("IT-M04-02-049", 廃棄("049", "M0402-049 登録情報確認", "-1", (_c, r) => {
  const h = r.履歴[0];
  const 登録 = h ? new Date(h.登録日時).getTime() : 0;
  expect.soft(Math.abs(登録 - r.押した) < 5 * 60_000, `登録日が登録ボタンを押した日時（押した ${new Date(r.押した).toISOString()}・登録日 ${h?.登録日時}）`).toBe(true);
  expect.soft(h?.登録者, "登録者").toBe(担当者.名前);
  expect.soft(h?.更新日時, "更新日が登録日と同じ値").toBe(h?.登録日時);
  expect.soft(h?.更新者, "更新者").toBe(担当者.名前);
  expect.soft(r.承認.find((a) => a.承認ID === h?.承認ID)?.承認状態, "承認状態（1=未承認。履歴の在庫編集承認の状態）").toBe(1);
}));
caseTest("IT-M04-02-060", 廃棄("060", "M0402-060 登録元確認", "-1", (_c, r) => {
  expect.soft(r.履歴[0]?.履歴登録元, "履歴登録元").toBe("在庫編集");
}));
caseTest("IT-M04-02-061", 廃棄("061", "M0402-061 販売価格確認", "-1", (_c, r) => {
  expect.soft(r.履歴[0]?.変更時販売価格, "変更時販売価格").toBe(1800);
}));

// ---- 032・033・056: 登録できない値（何も増えない） ----
function 増えない(n: string, v: 入力, 在庫の前: { 在庫数: number; 総原価: number }, 見るもの: ("承認" | "明細" | "履歴")[]) {
  return async (ctx: CaseCtx): Promise<void> => {
    await loginAdmin(ctx.page, 担当者.account);
    const id = 在庫IDの(ctx, n);
    const 数 = () => ({ 承認: 在庫の承認情報(id).length, 明細: 在庫の承認待ちの明細(id).length, 履歴: 在庫の変動履歴(id).length });
    const 前 = 数();
    await 開いて入れて押す(ctx, n, v);
    let 後 = 前; let s = { 在庫数: -1, 総原価: -1 };
    await ctx.step(4, async () => { 後 = 数(); s = 在庫の(id); });
    await ctx.expected(async () => {
      expect.soft(s.在庫数, "在庫数（更新されない）").toBe(在庫の前.在庫数);
      expect.soft(s.総原価, "総原価（更新されない）").toBe(在庫の前.総原価);
      const 名: Record<string, string> = { 承認: "在庫編集承認情報", 明細: "入庫承認待ち在庫情報", 履歴: "在庫変動履歴" };
      for (const k of 見るもの) expect.soft(後[k], `${名[k]}が追加されない`).toBe(前[k]);
    });
  };
}
caseTest("IT-M04-02-032", 増えない("032", { 区分: "廃棄/廃棄(破損)", 理由: "在庫超過廃棄", 増減数: "-11", 承認者: 青木承認者.名前 }, { 在庫数: 10, 総原価: 10000 }, ["承認", "履歴"]));
caseTest("IT-M04-02-033", 増えない("033", { 区分: "廃棄/廃棄(破損)", 理由: "廃棄下限超過", 増減数: "-100000000", 承認者: 青木承認者.名前 }, { 在庫数: 99999999, 総原価: 99999999 }, ["承認", "履歴"]));
caseTest("IT-M04-02-056", 増えない("056", { 区分: "入庫/問屋仕入", 理由: "M0402-056 合算8桁超過", 増減数: "99999990", 仕入単価: "0", 承認者: 承認者の("056").名前 }, { 在庫数: 10, 総原価: 10000 }, ["承認", "明細"]));

// ---- 039: 在庫一覧に戻る ----
caseTest("IT-M04-02-039", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  let 欄 = { 店舗: [] as string[], 在庫区分: [] as string[] };
  let list!: StockListPage;
  await ctx.step(1, async () => { list = await 店舗と在庫区分で検索する(ctx.page, TC東京2F.店名, "EC-CUBE"); });
  await ctx.step(2, async () => {
    const row = list.row(商品コードの("M0402-A-039"), TC東京2F.店名, "EC-CUBE");
    await expect(row, `検索結果に商品コード ${商品コードの("M0402-A-039")} の行がある`).toHaveCount(1);
    await list.openEdit(row);
  });
  await ctx.step(3, async () => {
    await Promise.all([ctx.page.waitForNavigation({ waitUntil: "load" }), 在庫一覧に戻る(ctx.page).click()]);
    欄 = await 検索欄の店舗と在庫区分(ctx.page);
    note(`戻った画面: ${new URL(ctx.page.url()).pathname}・検索欄 ${JSON.stringify(欄)}`);
  });
  await ctx.expected(async () => {
    expect.soft(new URL(ctx.page.url()).pathname, "在庫検索一覧画面").toMatch(/\/product\/stock\/?(page\/\d+)?$/);
    expect.soft(欄.店舗, "検索条件の店舗").toEqual([TC東京2F.店名]);
    expect.soft(欄.在庫区分, "検索条件の在庫区分").toEqual(["EC-CUBE"]);
  });
});

// ---- 071・072: 続けて2回登録する ----
caseTest("IT-M04-02-071", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  const id = 在庫IDの(ctx, "071");
  await ctx.step(1, async () => { expect(await 在庫編集画面を開く(ctx.page, id), "在庫編集画面の応答").toBe(200); });
  await ctx.step(2, async () => { await 入れる(ctx.page, 入庫("071", "問屋からの入庫")); const r = await 登録を押す(ctx.page); note(`1回目: 成功 ${r.成功.join(" / ") || "なし"}・エラー ${r.エラー.join(" / ") || "なし"}`); });
  await ctx.step(3, async () => {
    expect(await 在庫編集画面を開く(ctx.page, id), "在庫編集画面の応答（開き直し）").toBe(200);
    await 入れる(ctx.page, 入庫("071", "追加の入庫", "3", "400"));
    const r = await 登録を押す(ctx.page); note(`2回目: 成功 ${r.成功.join(" / ") || "なし"}・エラー ${r.エラー.join(" / ") || "なし"}`);
  });
  let a: ReturnType<typeof 在庫の承認情報> = []; let d: ReturnType<typeof 在庫の承認待ちの明細> = []; let s = { 在庫数: -1, 総原価: -1 };
  await ctx.step(4, async () => { a = 在庫の承認情報(id); d = 在庫の承認待ちの明細(id); s = 在庫の(id); });
  await ctx.expected(async () => {
    const 承認の組 = a.map((x) => [x.合計在庫増減数, x.合計総原価増減数]).sort((p, q) => p[0] - q[0]);
    expect.soft(承認の組, "在庫編集承認情報（合計在庫増減数・合計総原価増減数）").toEqual([[2, 600], [3, 1200]]);
    const 明細の組 = d.map((x) => [x.在庫増減数, x.仕入単価]).sort((p, q) => Number(p[0]) - Number(q[0]));
    expect.soft(明細の組, "入庫承認待ち在庫情報（在庫増減数・仕入単価）").toEqual([[2, 300], [3, 400]]);
    expect.soft(new Set(a.map((x) => x.承認ID)).size, "2件の承認情報の在庫編集承認IDが異なる").toBe(2);
    expect.soft([s.在庫数, s.総原価], "在庫数・総原価（そのまま）").toEqual([10, 10000]);
  });
});

caseTest("IT-M04-02-072", async (ctx) => {
  await loginAdmin(ctx.page, 担当者.account);
  const id = 在庫IDの(ctx, "072");
  let 二回目 = { path: "", エラー: [] as string[], 成功: [] as string[] };
  let 一回目の後 = { 承認: 0, 履歴: 0 };
  await ctx.step(1, async () => { expect(await 在庫編集画面を開く(ctx.page, id), "在庫編集画面の応答").toBe(200); });
  await ctx.step(2, async () => {
    await 入れる(ctx.page, { 区分: "廃棄/廃棄(破損)", 理由: "破損の廃棄", 増減数: "-3", 承認者: 承認者の("072").名前 });
    const r = await 登録を押す(ctx.page); note(`1回目: 成功 ${r.成功.join(" / ") || "なし"}・エラー ${r.エラー.join(" / ") || "なし"}`);
    一回目の後 = { 承認: 在庫の承認情報(id).length, 履歴: 在庫の変動履歴(id).length };
  });
  await ctx.step(3, async () => {
    expect(await 在庫編集画面を開く(ctx.page, id), "在庫編集画面の応答（開き直し）").toBe(200);
    await 入れる(ctx.page, { 区分: "廃棄/廃棄(破損)", 理由: "再度の破損の廃棄", 増減数: "-3", 承認者: 承認者の("072").名前 });
    二回目 = await 登録を押す(ctx.page); note(`2回目: 成功 ${二回目.成功.join(" / ") || "なし"}・エラー ${二回目.エラー.join(" / ") || "なし"}`);
  });
  let s = { 在庫数: -1, 総原価: -1 }; let 後 = { 承認: 0, 履歴: 0 };
  await ctx.step(4, async () => { s = 在庫の(id); 後 = { 承認: 在庫の承認情報(id).length, 履歴: 在庫の変動履歴(id).length }; });
  await ctx.expected(async () => {
    expect.soft(二回目.エラー.length > 0 && 二回目.成功.length === 0, `2回目の登録はエラーとなる（エラー ${二回目.エラー.join(" / ") || "なし"}・成功 ${二回目.成功.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(s.在庫数, "在庫数（2のまま）").toBe(2);
    expect.soft([一回目の後.承認, 後.承認], "在庫編集承認情報（1回目の1件から増えない）").toEqual([1, 1]);
    expect.soft([一回目の後.履歴, 後.履歴], "在庫変動履歴（1回目の1件から増えない）").toEqual([1, 1]);
  });
});

