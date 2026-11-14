/**
 * M04-03 在庫一括編集の続き（-y）: 所属のマスタを使うケース（011・012・015〜019・021・025・027〜029・031・033・035・038〜042）。正本: cases/M04-03_test_cases.tsv
 * 依頼者決定（2026-11-14）で、所属のマスタに「在庫管理第一部（M04-03）」「在庫管理第二部（M04-03）」を足した（決まった名前で1度だけ）。
 * 承認通知先メンバーの「承認者A」「承認者B」「一般担当者」「承認者C」は「承認者A（M04-03）」などの名前で作った（seeds/m04-03-x.ts）。
 * 事前準備の「ログインしている」は、手順1の前にその管理者でログインする。「在庫ID 〔…〕を対象に在庫一括編集画面を開く」は、
 * 在庫検索一覧でその規格の商品コード・店舗で検索し、行を選んで「在庫一括編集」を押す（m04-03-x.spec.ts と同じ）。
 * 「開発者ツールで…」は、画面の中の送信対象の在庫ID（hidden の入力）を書き換える・消す・足す（ブラウザの開発者ツールと同じ操作）。
 */
import { Browser, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { RUN_MARK } from "../../lib/run_marker";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { openApprovalList, searchApprovalList, listRows } from "../../pages/admin/m04_32_approval_list";
import { StockHistoryPage } from "../../pages/admin/m04_17_stock_history";
import { 承認一覧の行, 在庫の承認明細, 在庫の数と原価, 在庫の履歴件数, メンバーID } from "../../db/m04_03_y";
import {
  一括編集の画面, 一括編集を開く, 一括編集を登録する, 行の位置, 行を入れる, 在庫を検索する, 在庫変動区分を選ぶ, 承認通知先メンバーを選ぶ,
  承認通知先所属の選択肢, 承認通知先所属を選ぶ, 承認通知先メンバーの選択肢, 承認通知先メンバーの選択中, 送信対象の在庫IDを変える, 送信対象の在庫ID,
} from "../../pages/admin/m04_03_bulk_x";
import { 在庫履歴の店舗を選ぶ } from "../../pages/admin/m04_03_bulk_x";
import { 編集可能店舗を変える } from "../../pages/admin/m04_03_member_edit";
import { deleteClassOnEdit, openClassEdit } from "../../pages/admin/m03_30_products";
import {
  TC東京, 店の読み替え, 店舗IDの, 試験管理者, 商品コードの, 承認通知先, 承認通知先の注記, 承認通知先所属, 所属の実名, 管理者, メンバー管理者, 権限変更対象, 権限変更対象の管理者ID, 連携管理者,
} from "../../seeds/m04-03-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 共通の語 = (番号: string) => `-${番号}-${RUN_MARK}`;
test.beforeEach(() => { supplement(店の読み替え()); supplement(承認通知先の注記()); });

type 行 = { 控え: string; 商品コード: string; 理由: string; 数: string; 単価?: string };
type 入力 = { 区分: string; 所属: string; メンバー: 管理者; 行: 行[] };

/** 在庫ID（呼び名の控え）を対象に在庫一括編集画面を開く（商品コードと店舗で検索し、行を選んで「在庫一括編集」を押す） */
async function 開く(ctx: CaseCtx, 番号: string, 控え: string[], 店: string[] = [TC東京.店名]): Promise<void> {
  // 049・050 の商品コードは BULK-A-L001 のように番号を含まないので、連携用の語（-L001-印）で探す
  const 語 = 番号 === "049" ? `-L001-${RUN_MARK}` : 番号 === "050" ? `-L002-${RUN_MARK}` : 共通の語(番号);
  await 在庫を検索する(ctx.page, { 商品コード: 語, 店舗: 店 });
  await 一括編集を開く(ctx.page, 控え.map((k) => ctx.notes.get(`〔在庫ID-M0403-${k}〕`)));
}
const 在庫ID = (ctx: CaseCtx, 控え: string): string => ctx.notes.get(`〔在庫ID-M0403-${控え}〕`);

/** 区分・承認通知先所属・承認通知先メンバーを選ぶ（手順の「在庫変動区分に…、承認通知先所属に…、承認通知先メンバーに…を選択する」） */
async function 選ぶ(ctx: CaseCtx, v: Pick<入力, "区分" | "所属" | "メンバー">): Promise<void> {
  await 在庫変動区分を選ぶ(ctx.page, v.区分);
  await 承認通知先所属を選ぶ(ctx.page, 所属の実名(v.所属));
  await 承認通知先メンバーを選ぶ(ctx.page, [v.メンバー.名前]);
}
/** 行ごとの在庫変動理由・在庫増減数・仕入単価を入れる */
async function 入れる(ctx: CaseCtx, rows: 行[]): Promise<void> {
  for (const r of rows) await 行を入れる(ctx.page, await 行の位置(ctx.page, 商品コードの(r.商品コード)), { 在庫変動理由: r.理由, 在庫増減数: r.数, 仕入単価: r.単価 });
}
async function 区分の値(ctx: CaseCtx): Promise<string> { return 一括編集の画面(ctx.page).locator(".js-bulk-stock-change-type-detail-global").inputValue(); }

type 登録の結果 = { パス: string; 表示: string };
/** 手順1〜4（開く→選ぶ→入れる→登録）。登録の結果を返す。在庫は呼び名の控えの順 */
async function 登録まで(ctx: CaseCtx, 番号: string, 控え: string[], v: 入力, 店: string[] = [TC東京.店名]): Promise<{ 結果: 登録の結果; 区分: string }> {
  const { step } = ctx;
  let 結果: 登録の結果 = { パス: "", 表示: "" };
  let 区分 = "";
  await step(1, async () => { await 開く(ctx, 番号, 控え, 店); });
  await step(2, async () => { await 選ぶ(ctx, v); 区分 = await 区分の値(ctx); });
  await step(3, async () => { await 入れる(ctx, v.行); });
  await step(4, async () => { 結果 = await 一括編集を登録する(ctx.page); note(`登録のあと: ${結果.パス}・${結果.表示 || "表示なし"}`); });
  return { 結果, 区分 };
}

const 入庫 = "入庫/問屋仕入";
const 廃棄 = "廃棄/廃棄(破損)";
const 第一部 = "在庫管理第一部";
const 登録後のパス = /\/product\/stock\/stock-bulk-approval\/new$/;

/** 在庫ごとに「在庫と承認関連情報が更新されない」ことを確かめる値（在庫数・総原価・承認明細の件数・履歴の件数） */
function 更新なし(ctx: CaseCtx, 控え: string[], もと: Record<string, { 在庫数: number; 総原価: number }>): { 名前: string; 実際: unknown; 期待: unknown }[] {
  return 控え.flatMap((k) => {
    const id = 在庫ID(ctx, k);
    return [
      { 名前: `在庫ID 〔${k}〕の在庫（もとのまま）`, 実際: 在庫の数と原価(id), 期待: もと[k] },
      { 名前: `在庫ID 〔${k}〕の在庫編集承認の明細（0件）`, 実際: 在庫の承認明細(id).length, 期待: 0 },
      { 名前: `在庫ID 〔${k}〕の在庫変動履歴（0件）`, 実際: 在庫の履歴件数(id), 期待: 0 },
    ];
  });
}
const 確かめる = (rows: { 名前: string; 実際: unknown; 期待: unknown }[]) => { for (const c of rows) expect.soft(c.実際, c.名前).toEqual(c.期待); };

// ---- 011・012: 承認通知先の選択肢 ----
caseTest("IT-M04-03-011", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  let 選択肢: string[] = [];
  await step(1, async () => { await 開く(ctx, "011", ["011"]); });
  await step(2, async () => { 選択肢 = await 承認通知先メンバーの選択肢(page); note(`承認通知先メンバーの初期の選択肢（${選択肢.length}件）: ${選択肢.join("、")}`); });
  await expected(async () => {
    supplement(`試験支店には、ほかの試験用の承認権限ありのメンバーも所属しているので、初期の選択肢は承認者A・Bだけにならない。承認者A・Bが含まれ名前昇順であること、一般担当者・承認者Cが含まれないことで確かめた（初期の選択肢 ${選択肢.length}件）`);
    const a = 選択肢.indexOf(承認通知先.A.名前), b = 選択肢.indexOf(承認通知先.B.名前);
    expect.soft(a >= 0, "承認者Aが選択肢にある").toBe(true);
    expect.soft(b >= 0, "承認者Bが選択肢にある").toBe(true);
    expect.soft(a < b, "承認者A・承認者Bが名前昇順（Aが先）").toBe(true);
    expect.soft(選択肢.includes(承認通知先.一般担当者.名前), "承認権限を持たない一般担当者は表示されない").toBe(false);
    expect.soft(選択肢.includes(承認通知先.C.名前), "大阪店（本店）の承認者Cは表示されない").toBe(false);
  });
});

caseTest("IT-M04-03-012", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  let 所属の選択肢: string[] = [];
  let 選択中: string[] = [];
  let 選択肢: string[] = [];
  await step(1, async () => { await 開く(ctx, "012", ["012"]); });
  await step(2, async () => { await 承認通知先メンバーを選ぶ(page, [承認通知先.A.名前]); });
  await step(3, async () => {
    所属の選択肢 = await 承認通知先所属の選択肢(page);
    await 承認通知先所属を選ぶ(page, 承認通知先所属.第二部);
    await page.waitForTimeout(500);
    選択中 = await 承認通知先メンバーの選択中(page);
    選択肢 = await 承認通知先メンバーの選択肢(page);
    note(`所属の選択肢: ${所属の選択肢.join("、")}・所属変更後の選択中: ${選択中.join("、") || "なし"}・メンバーの選択肢: ${選択肢.join("、")}`);
  });
  await expected(async () => {
    expect.soft(選択中, "「承認者A」の入力値が保持される").toEqual([承認通知先.A.名前]);
    expect.soft(選択肢.includes(承認通知先.B.名前), "メンバーの選択肢に在庫管理第二部所属の承認者Bがある").toBe(true);
    expect.soft(選択肢.includes(承認通知先.A.名前), "第一部所属の承認者Aは選択肢から外れる（承認者Bの一覧へ差し替わる）").toBe(false);
  });
});

// ---- 015〜019・021: 登録の結果 ----
const AB = (n: string): { 控え: string[]; もと: Record<string, { 在庫数: number; 総原価: number }> } => ({
  控え: [`${n}A`, `${n}B`], もと: { [`${n}A`]: { 在庫数: 10, 総原価: 10000 }, [`${n}B`]: { 在庫数: 20, 総原価: 16000 } },
});
const 通常入庫 = (理由: string, a: [string, string], b: [string, string], n: string): 入力 => ({
  区分: 入庫, 所属: 第一部, メンバー: 承認通知先.A,
  行: [{ 控え: `${n}A`, 商品コード: `BULK-A-${n}`, 理由, 数: a[0], 単価: a[1] }, { 控え: `${n}B`, 商品コード: `BULK-B-${n}`, 理由, 数: b[0], 単価: b[1] }],
});

caseTest("IT-M04-03-015", async (ctx) => {
  const { step, expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  const { 控え } = AB("015");
  const { 区分 } = await 登録まで(ctx, "015", 控え, 通常入庫("一括入庫試験", ["2", "500"], ["3", "600"], "015"));
  let 明細A: ReturnType<typeof 在庫の承認明細> = [], 明細B: ReturnType<typeof 在庫の承認明細> = [];
  await step(5, async () => { 明細A = 在庫の承認明細(在庫ID(ctx, "015A")); 明細B = 在庫の承認明細(在庫ID(ctx, "015B")); note(`承認明細 A: ${JSON.stringify(明細A)}・B: ${JSON.stringify(明細B)}`); });
  await expected(async () => {
    const a = 明細A[0], b = 明細B[0];
    expect.soft(明細A.length + 明細B.length, "在庫編集承認の明細が2件（両行）").toBe(2);
    expect.soft(a?.承認ID, "両行が同じ在庫編集承認情報1件にまとまる").toBe(b?.承認ID);
    const 行 = a ? 承認一覧の行(a.承認ID) : undefined;
    expect.soft(a?.承認ステータス, "承認状態「未承認」").toBe(1);
    expect.soft(行?.件数, "承認対象「在庫一括編集」の承認一覧の行が1件").toBe(1);
    expect.soft(a?.店舗ID, "店舗「TC東京」").toBe(店舗IDの("TC東京"));
    expect.soft(行?.在庫区分ID, "在庫区分「EC-CUBE」（1）").toBe("1");
    expect.soft(a?.区分ID, "在庫変動区分「入庫/問屋仕入」").toBe(区分);
    expect.soft(a?.登録者ID, "登録者「M04-03試験管理者」").toBe(メンバーID(試験管理者.account.loginId));
    expect.soft(a?.承認日時, "承認日が空").toBeNull();
    expect.soft(a?.承認者ID, "承認者「承認待ち」（承認者が未設定）").toBeNull();
  });
});

caseTest("IT-M04-03-016", async (ctx) => {
  const { step, expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  const { 控え } = AB("016");
  await 登録まで(ctx, "016", 控え, 通常入庫("一括入庫明細", ["2", "500"], ["3", "600"], "016"));
  let A: ReturnType<typeof 在庫の承認明細> = [], B: ReturnType<typeof 在庫の承認明細> = [];
  await step(5, async () => { A = 在庫の承認明細(在庫ID(ctx, "016A")); B = 在庫の承認明細(在庫ID(ctx, "016B")); note(`承認明細 A: ${JSON.stringify(A)}・B: ${JSON.stringify(B)}`); });
  await expected(async () => {
    expect.soft(A.length, "商品規格 016A の入庫承認待ち在庫情報が1件").toBe(1);
    expect.soft(B.length, "商品規格 016B の入庫承認待ち在庫情報が1件").toBe(1);
    expect.soft([A[0]?.在庫増減数, A[0]?.仕入単価, A[0]?.承認ステータス], "016A: 在庫増減数2・仕入単価500・未承認").toEqual([2, 500, 1]);
    expect.soft([B[0]?.在庫増減数, B[0]?.仕入単価, B[0]?.承認ステータス], "016B: 在庫増減数3・仕入単価600・未承認").toEqual([3, 600, 1]);
  });
});

caseTest("IT-M04-03-017", async (ctx) => {
  const { step, expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  const { 控え } = AB("017");
  await 登録まで(ctx, "017", 控え, 通常入庫("承認ID確認", ["1", "500"], ["1", "500"], "017"));
  let A: ReturnType<typeof 在庫の承認明細> = [], B: ReturnType<typeof 在庫の承認明細> = [];
  await step(5, async () => { A = 在庫の承認明細(在庫ID(ctx, "017A")); B = 在庫の承認明細(在庫ID(ctx, "017B")); note(`承認明細 A: ${JSON.stringify(A)}・B: ${JSON.stringify(B)}`); });
  await expected(async () => {
    expect.soft(A.length === 1 && B.length === 1, "2件の入庫承認待ち在庫情報が登録される").toBe(true);
    expect.soft(A[0]?.承認ID && A[0]?.承認ID === B[0]?.承認ID, "2件に、先に発番された同一の在庫編集承認IDが登録される").toBeTruthy();
    expect.soft(承認一覧の行(A[0]?.承認ID ?? "0").件数, "同じ承認IDの承認一覧の行は1件").toBe(1);
  });
});

caseTest("IT-M04-03-018", async (ctx) => {
  const { step, expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  await 登録まで(ctx, "018", ["018"], { 区分: 入庫, 所属: 第一部, メンバー: 承認通知先.A, 行: [{ 控え: "018", 商品コード: "BULK-A-018", 理由: "承認前在庫確認", 数: "2", 単価: "500" }] });
  let 在庫 = { 在庫数: NaN, 総原価: NaN };
  await step(5, async () => { 在庫 = 在庫の数と原価(在庫ID(ctx, "018")); note(`在庫: ${JSON.stringify(在庫)}`); });
  await expected(async () => { expect.soft(在庫, "承認前の在庫は在庫数10・総原価10000のまま").toEqual({ 在庫数: 10, 総原価: 10000 }); });
});

caseTest("IT-M04-03-019", async (ctx) => {
  const { step, expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  await 登録まで(ctx, "019", ["019"], { 区分: 入庫, 所属: 第一部, メンバー: 承認通知先.A, 行: [{ 控え: "019", 商品コード: "BULK-A-019", 理由: "通知先確認", 数: "1", 単価: "500" }] });
  let 明細: ReturnType<typeof 在庫の承認明細> = [];
  await step(5, async () => { 明細 = 在庫の承認明細(在庫ID(ctx, "019")); note(`承認明細: ${JSON.stringify(明細)}`); });
  await expected(async () => {
    const a = メンバーID(承認通知先.A.account.loginId);
    expect.soft(明細.length, "在庫編集承認情報が1件登録される").toBe(1);
    note("在庫編集承認情報にも承認明細にも、通知送付者（承認通知先に選んだメンバー）を持つ項目は無い。承認者の項目（承認待ちの間は空）がいちばん近いので、そこを見る");
    expect.soft(明細[0]?.承認者ID, "選択した「承認者A」が在庫編集承認情報の通知送付者として関連付けられる").toBe(a);
  });
});

caseTest("IT-M04-03-021", async (ctx) => {
  const { expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  const { 結果 } = await 登録まで(ctx, "021", ["021"], { 区分: 入庫, 所属: 第一部, メンバー: 承認通知先.A, 行: [{ 控え: "021", 商品コード: "BULK-A-021", 理由: "正常遷移確認", 数: "1", 単価: "500" }] });
  await expected(async () => {
    expect.soft(結果.パス, "登録と承認通知の完了後、在庫一括編集画面へ遷移する").toMatch(登録後のパス);
    expect.soft(結果.表示, "「保存しました」と表示される").toContain("保存しました");
  });
});

// ---- 025・027・028: 入力の制限で登録されない ----
function 更新されない(番号: string, 入力: 入力, 控え: string[], もと: Record<string, { 在庫数: number; 総原価: number }>, 期待の言葉: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { step, expected } = ctx;
    await loginAdmin(ctx.page, 試験管理者.account);
    const { 結果 } = await 登録まで(ctx, 番号, 控え, 入力);
    let 確認: ReturnType<typeof 更新なし> = [];
    await step(5, async () => { 確認 = 更新なし(ctx, 控え, もと); note(`確認: ${JSON.stringify(確認)}`); });
    await expected(async () => {
      note(`登録のあとの画面: ${結果.パス}・${結果.表示 || "表示なし"}`);
      expect.soft(結果.表示 !== "" && !結果.表示.includes("保存しました"), `${期待の言葉}（入力の誤りが表示される。実際: ${結果.表示 || "表示なし"}）`).toBe(true);
      確かめる(確認);
    });
  };
}
const 十と二十 = (n: string) => AB(n).もと;
caseTest("IT-M04-03-025", 更新されない("025", 通常入庫("ゼロ行確認", ["0", "500"], ["1", "500"], "025"), AB("025").控え, 十と二十("025"), "刷新後の入庫時入力制限により検証エラーとなる"));
caseTest("IT-M04-03-027", 更新されない("027", 通常入庫("在庫上限超過", ["99999990", "500"], ["1", "500"], "027"), AB("027").控え, 十と二十("027"), "入庫後の在庫が8桁を超えるため検証エラーとなる"));
caseTest("IT-M04-03-028", 更新されない("028", {
  区分: 廃棄, 所属: 第一部, メンバー: 承認通知先.A,
  行: [{ 控え: "028A", 商品コード: "BULK-A-028", 理由: "在庫下限超過", 数: "-11" }, { 控え: "028B", 商品コード: "BULK-B-028", 理由: "在庫下限超過", 数: "-1" }],
}, AB("028").控え, 十と二十("028"), "廃棄後の在庫が0未満になるため検証エラーとなる"));

// ---- 029・031・033・035: 境界値で登録される ----
caseTest("IT-M04-03-029", async (ctx) => {
  const { step, expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  const 理由 = "あ".repeat(16384);
  await 登録まで(ctx, "029", ["029"], { 区分: 入庫, 所属: 第一部, メンバー: 承認通知先.A, 行: [{ 控え: "029", 商品コード: "BULK-A-029", 理由, 数: "1", 単価: "500" }] });
  let 明細: ReturnType<typeof 在庫の承認明細> = [];
  await step(5, async () => { 明細 = 在庫の承認明細(在庫ID(ctx, "029")); note(`承認明細の件数 ${明細.length}・在庫変動理由の文字数 ${明細[0]?.在庫変動理由.length}`); });
  await expected(async () => {
    expect.soft(明細.length, "入庫承認待ち在庫情報が1件登録される").toBe(1);
    expect.soft(明細[0]?.在庫変動理由 === 理由, "在庫変動理由が最大文字数16384文字の値で登録される").toBe(true);
  });
});

caseTest("IT-M04-03-031", async (ctx) => {
  const { step, expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  await 登録まで(ctx, "031", ["031"], { 区分: 入庫, 所属: 第一部, メンバー: 承認通知先.A, 行: [{ 控え: "031", 商品コード: "M0403-ZERO-031", 理由: "増減数上限", 数: "99999999", 単価: "0" }] });
  let 明細: ReturnType<typeof 在庫の承認明細> = [];
  await step(5, async () => { 明細 = 在庫の承認明細(在庫ID(ctx, "031")); note(`承認明細: ${JSON.stringify(明細)}`); });
  await expected(async () => {
    expect.soft(明細.length, "入庫承認待ち在庫情報が1件登録される").toBe(1);
    expect.soft(明細[0]?.在庫増減数, "在庫増減数が上限値99999999").toBe(99999999);
  });
});

caseTest("IT-M04-03-033", async (ctx) => {
  const { step, expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  await 登録まで(ctx, "033", ["033"], { 区分: 廃棄, 所属: 第一部, メンバー: 承認通知先.A, 行: [{ 控え: "033", 商品コード: "M0403-MAX-033", 理由: "増減数下限", 数: "-99999999" }] });
  let 明細: ReturnType<typeof 在庫の承認明細> = [];
  await step(5, async () => { 明細 = 在庫の承認明細(在庫ID(ctx, "033")); note(`承認明細: ${JSON.stringify(明細)}`); });
  await expected(async () => {
    expect.soft(明細.length, "在庫編集承認情報が1件登録される").toBe(1);
    expect.soft(明細[0]?.在庫増減数, "在庫増減数が下限値-99999999").toBe(-99999999);
  });
});

caseTest("IT-M04-03-035", async (ctx) => {
  const { step, expected } = ctx;
  await loginAdmin(ctx.page, 試験管理者.account);
  await 登録まで(ctx, "035", ["035A", "035B"], 通常入庫("仕入単価境界", ["1", "0"], ["1", "999999999"], "035"));
  let A: ReturnType<typeof 在庫の承認明細> = [], B: ReturnType<typeof 在庫の承認明細> = [];
  await step(5, async () => { A = 在庫の承認明細(在庫ID(ctx, "035A")); B = 在庫の承認明細(在庫ID(ctx, "035B")); note(`承認明細 A: ${JSON.stringify(A)}・B: ${JSON.stringify(B)}`); });
  await expected(async () => {
    expect.soft(A[0]?.仕入単価, "商品規格 035A に仕入単価0が登録される").toBe(0);
    expect.soft(B[0]?.仕入単価, "商品規格 035B に仕入単価999999999が登録される").toBe(999999999);
  });
});

// ---- 038〜042: 開発者ツールで送信対象の在庫IDを変えて送る ----
const 正常値 = (n: string, 商品コード: string): 入力 => ({ 区分: 入庫, 所属: 第一部, メンバー: 承認通知先.A, 行: [{ 控え: n, 商品コード, 理由: "正常値確認", 数: "1", 単価: "500" }] });

/** 手順1〜2（開く・正常値を入れる）。単一行なら 一括編集の1行目に入れる */
async function 正常値まで(ctx: CaseCtx, 番号: string, 控え: string[], 入力v: 入力): Promise<string> {
  const { step } = ctx;
  let 区分 = "";
  await step(1, async () => { await 開く(ctx, 番号, 控え); });
  await step(2, async () => { await 選ぶ(ctx, 入力v); 区分 = await 区分の値(ctx); await 入れる(ctx, 入力v.行); });
  return 区分;
}

caseTest("IT-M04-03-038", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  await 正常値まで(ctx, "038", ["038"], 正常値("038", "BULK-A-038"));
  let r = { パス: "", 表示: "" };
  await step(3, async () => { await 送信対象の在庫IDを変える(page, { 消す: true }); note(`送信対象の在庫ID: ${(await 送信対象の在庫ID(page)).join("、") || "なし"}`); });
  await step(4, async () => { r = await 一括編集を登録する(page); note(`登録のあと: ${r.パス}・${r.表示 || "表示なし"}`); });
  await expected(async () => { expect.soft(r.パス, "在庫一括編集画面へ遷移する").toMatch(登録後のパス); });
});

caseTest("IT-M04-03-039", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  await 正常値まで(ctx, "039", ["039"], 正常値("039", "BULK-A-039"));
  await step(3, async () => { await 送信対象の在庫IDを変える(page, { 消す: true }); });
  await step(4, async () => { const r = await 一括編集を登録する(page); note(`登録のあと: ${r.パス}・${r.表示 || "表示なし"}`); });
  let 確認: ReturnType<typeof 更新なし> = [];
  await step(5, async () => { 確認 = 更新なし(ctx, ["039"], { "039": { 在庫数: 10, 総原価: 10000 } }); note(`確認: ${JSON.stringify(確認)}`); });
  await expected(async () => { for (const c of 確認) expect.soft(c.実際, c.名前).toEqual(c.期待); });
});

caseTest("IT-M04-03-040", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  await 正常値まで(ctx, "040", ["040"], 正常値("040", "BULK-A-040"));
  let r = { パス: "", 表示: "" };
  await step(3, async () => {
    await 送信対象の在庫IDを変える(page, { 置換: { [在庫ID(ctx, "040")]: "999999" } });
    note(`送信対象の在庫ID: ${(await 送信対象の在庫ID(page)).join("、")}`);
  });
  await step(4, async () => { r = await 一括編集を登録する(page); note(`登録のあと: ${r.パス}・${r.表示 || "表示なし"}`); });
  await expected(async () => { expect.soft(r.パス, "在庫一括編集画面へ遷移する").toMatch(登録後のパス); });
});

caseTest("IT-M04-03-041", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  const v: 入力 = {
    ...正常値("041", "BULK-A-041"),
    行: [{ 控え: "041A", 商品コード: "BULK-A-041", 理由: "正常値確認", 数: "1", 単価: "500" }, { 控え: "041B", 商品コード: "BULK-B-041", 理由: "正常値確認", 数: "1", 単価: "500" }],
  };
  await step(1, async () => { await 開く(ctx, "041", ["041A", "041B"]); });
  await step(2, async () => { await 選ぶ(ctx, v); await 入れる(ctx, v.行); });
  await step(3, async () => {
    await 送信対象の在庫IDを変える(page, { 置換: { [在庫ID(ctx, "041A")]: "999999" } });
    note(`送信対象の在庫ID: ${(await 送信対象の在庫ID(page)).join("、")}`);
  });
  await step(4, async () => { const r = await 一括編集を登録する(page); note(`登録のあと: ${r.パス}・${r.表示 || "表示なし"}`); });
  let 確認: ReturnType<typeof 更新なし> = [];
  await step(5, async () => { 確認 = 更新なし(ctx, ["041A", "041B"], { "041A": { 在庫数: 10, 総原価: 10000 }, "041B": { 在庫数: 20, 総原価: 16000 } }); note(`確認: ${JSON.stringify(確認)}`); });
  await expected(async () => { for (const c of 確認) expect.soft(c.実際, c.名前).toEqual(c.期待); });
});

caseTest("IT-M04-03-042", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  await step(1, async () => { await 開く(ctx, "042", ["042A"]); });
  await step(2, async () => {
    await 選ぶ(ctx, 正常値("042", "BULK-A-042"));
    await 入れる(ctx, 正常値("042", "BULK-A-042").行);
  });
  await step(3, async () => {
    await 送信対象の在庫IDを変える(page, { 追加: [在庫ID(ctx, "042B")] });
    note(`送信対象の在庫ID: ${(await 送信対象の在庫ID(page)).join("、")}（042B は大阪店＝本店の在庫）`);
  });
  let r = { パス: "", 表示: "" };
  await step(4, async () => { r = await 一括編集を登録する(page); note(`登録のあと: ${r.パス}・${r.表示 || "表示なし"}`); });
  await expected(async () => { expect.soft(r.パス, "在庫一覧画面へ遷移する").toMatch(/\/product\/stock\/?$/); });
});

// ---- 043・044・045・051: ほかのブラウザ（ブラウザB）の操作のあとで、ブラウザAが登録する ----
async function ブラウザBを開く(browser: Browser, account: { loginId: string; password: string }) {
  const bctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  await hideDebugToolbar(bctx);
  const page = await bctx.newPage();
  await loginAdmin(page, account);
  return { bctx, page };
}

/** 043・051: ブラウザBでメンバー管理から、権限を外される管理者の編集可能店舗から試験支店（正本の TC東京）を外す */
function 権限を外される(番号: "043" | "051", 在庫の控え: string, 商品コード: string, 検証: (ctx: CaseCtx) => { 実際: () => unknown; 名前: string; 期待: unknown }[], パス期待?: RegExp) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, browser, step, expected } = ctx;
    const 対象 = 権限変更対象(番号);
    await loginAdmin(page, 対象.account);
    const B = await ブラウザBを開く(browser, メンバー管理者.account);
    let 結果 = { パス: "", 表示: "" };
    try {
      await step(1, async () => {
        await 開く(ctx, 番号, [在庫の控え]);
        await 選ぶ(ctx, 正常値(番号, 商品コード));
        await 入れる(ctx, 正常値(番号, 商品コード).行);
      });
      await step(2, async () => {
        await 編集可能店舗を変える(B.page, 権限変更対象の管理者ID(番号), ["1"], "1", `${対象.名前}から試験支店（正本の TC東京）の在庫編集権限を外す`);
        note(`ブラウザB: 「${対象.名前}」の編集可能店舗を本店だけにした（試験支店＝正本の TC東京を外した）`);
      });
      await step(3, async () => { 結果 = await 一括編集を登録する(page); note(`登録のあと: ${結果.パス}・${結果.表示 || "表示なし"}`); });
      await expected(async () => {
        if (パス期待) expect.soft(結果.パス, "在庫一覧画面へ遷移する").toMatch(パス期待);
        for (const c of 検証(ctx)) expect.soft(c.実際(), c.名前).toEqual(c.期待);
      });
    } finally { await B.bctx.close(); }
  };
}
caseTest("IT-M04-03-043", 権限を外される("043", "043", "BULK-A-043", () => [], /\/product\/stock\/?$/));
caseTest("IT-M04-03-051", 権限を外される("051", "051", "BULK-A-051", (ctx) => {
  const id = 在庫ID(ctx, "051");
  return [
    { 名前: "在庫編集承認の明細が登録されない（0件）", 実際: () => 在庫の承認明細(id).length, 期待: 0 },
    { 名前: "在庫変動履歴が登録されない（0件）", 実際: () => 在庫の履歴件数(id), 期待: 0 },
    { 名前: "在庫がもとのまま", 実際: () => 在庫の数と原価(id), 期待: { 在庫数: 10, 総原価: 10000 } },
  ];
}));

/** 044・045: ブラウザBで商品規格編集画面を開いて削除する（商品ID・商品規格IDは控えた番号） */
async function 規格を削除する(B: { page: import("@playwright/test").Page }, 商品ID: string, 規格ID: string): Promise<void> {
  await openClassEdit(B.page, 商品ID, 規格ID);
  await deleteClassOnEdit(B.page, `商品規格ID ${規格ID} の削除`, (m) => note(m));
}

caseTest("IT-M04-03-044", async (ctx) => {
  const { page, browser, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  const B = await ブラウザBを開く(browser, 試験管理者.account);
  let 結果 = { パス: "", 表示: "" };
  try {
    await step(1, async () => {
      await 開く(ctx, "044", ["044"]);
      await 選ぶ(ctx, 正常値("044", "DELETE-A-044"));
      await 入れる(ctx, 正常値("044", "DELETE-A-044").行);
    });
    await step(2, async () => { await 規格を削除する(B, ctx.notes.get("〔商品ID-M0403-044〕"), ctx.notes.get("〔商品規格ID-M0403-044〕")); });
    await step(3, async () => { 結果 = await 一括編集を登録する(page); note(`登録のあと: ${結果.パス}・${結果.表示 || "表示なし"}`); });
    await expected(async () => { expect.soft(結果.パス, "在庫一括編集画面に留まる").toMatch(登録後のパス); });
  } finally { await B.bctx.close(); }
});

caseTest("IT-M04-03-045", async (ctx) => {
  const { page, browser, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  const B = await ブラウザBを開く(browser, 試験管理者.account);
  const 入力v: 入力 = {
    ...正常値("045", "BULK-A-045"),
    行: [{ 控え: "045A", 商品コード: "BULK-A-045", 理由: "正常値確認", 数: "1", 単価: "500" }, { 控え: "045B", 商品コード: "DELETE-A-045", 理由: "正常値確認", 数: "1", 単価: "500" }],
  };
  let 確認: ReturnType<typeof 更新なし> = [];
  try {
    await step(1, async () => { await 開く(ctx, "045", ["045A", "045B"]); await 選ぶ(ctx, 入力v); await 入れる(ctx, 入力v.行); });
    await step(2, async () => { await 規格を削除する(B, ctx.notes.get("〔商品ID-M0403-045〕"), ctx.notes.get("〔商品規格ID-M0403-045B〕")); });
    await step(3, async () => { const r = await 一括編集を登録する(page); note(`登録のあと: ${r.パス}・${r.表示 || "表示なし"}`); });
    await step(4, async () => {
      // 削除された規格の在庫は在庫ごと消えるので、在庫がまだあるものだけを数える（消えていれば、在庫が無いことを注記に残す）
      const 残り: string[] = [];
      for (const k of ["045A", "045B"]) { try { 在庫の数と原価(在庫ID(ctx, k)); 残り.push(k); } catch { note(`在庫ID 〔${k}〕の在庫は、規格の削除で無くなっている`); } }
      確認 = 更新なし(ctx, 残り, { "045A": { 在庫数: 10, 総原価: 10000 }, "045B": { 在庫数: 8, 総原価: 8000 } });
      note(`確認: ${JSON.stringify(確認)}`);
    });
    await expected(async () => { for (const c of 確認) expect.soft(c.実際, c.名前).toEqual(c.期待); });
  } finally { await B.bctx.close(); }
});

// ---- 049・050: 登録のあと、承認一覧・在庫履歴に反映される ----
caseTest("IT-M04-03-049", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 連携管理者.account);
  const 理由 = "連携入庫試験-001";
  await step(1, async () => { await 開く(ctx, "049", ["049A", "049B"]); });
  await step(2, async () => { await 選ぶ(ctx, { 区分: 入庫, 所属: 第一部, メンバー: 承認通知先.A }); });
  await step(3, async () => {
    await 入れる(ctx, [
      { 控え: "049A", 商品コード: "BULK-A-L001", 理由, 数: "2", 単価: "500" },
      { 控え: "049B", 商品コード: "BULK-B-L001", 理由, 数: "3", 単価: "600" },
    ]);
  });
  await step(4, async () => { const r = await 一括編集を登録する(page); note(`登録のあと: ${r.パス}・${r.表示 || "表示なし"}`); });
  await step(5, async () => { await openApprovalList(page); });
  let rows: Awaited<ReturnType<typeof listRows>> = [];
  await step(6, async () => {
    await searchApprovalList(page, { 店舗: TC東京.店名, 承認可能のみ: false, 登録者: [連携管理者.名前] });
    rows = await listRows(page);
    note(`承認一覧の行: ${JSON.stringify(rows)}`);
  });
  await expected(async () => {
    const 対象 = rows.filter((r) => r.承認対象 === "在庫一括編集");
    expect.soft(対象.length, "承認対象「在庫一括編集」の行が1件表示される").toBe(1);
    const r = 対象[0];
    expect.soft(r?.承認状態, "承認状態「未承認」").toBe("未承認");
    expect.soft(r?.店舗在庫区分.includes(TC東京.ショップ名略称) && r?.店舗在庫区分.includes("EC-CUBE"), `店舗/在庫区分「${TC東京.店名}」「EC-CUBE」（実際: ${r?.店舗在庫区分}）`).toBe(true);
    expect.soft(r?.在庫変動区分?.endsWith("入庫/問屋仕入"), `在庫変動区分「入庫/問屋仕入」（実際: ${r?.在庫変動区分}）`).toBe(true);
    expect.soft(r?.登録者, "登録者「M04-03連携管理者-001」").toBe(連携管理者.名前);
    expect.soft(r?.承認日, "承認日「-」").toBe("-");
    expect.soft(r?.承認者, "承認者「承認待ち」").toBe("承認待ち");
  });
});

caseTest("IT-M04-03-050", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 試験管理者.account);
  const 理由 = "連携廃棄試験-002";
  await step(1, async () => { await 開く(ctx, "050", ["050A", "050B"]); });
  await step(2, async () => { await 選ぶ(ctx, { 区分: 廃棄, 所属: 第一部, メンバー: 承認通知先.A }); });
  await step(3, async () => {
    await 入れる(ctx, [
      { 控え: "050A", 商品コード: "BULK-A-L002", 理由, 数: "-3" },
      { 控え: "050B", 商品コード: "BULK-B-L002", 理由, 数: "-4" },
    ]);
  });
  await step(4, async () => { const r = await 一括編集を登録する(page); note(`登録のあと: ${r.パス}・${r.表示 || "表示なし"}`); });
  const h = new StockHistoryPage(page);
  await step(5, async () => { await h.open(); });
  let rows: Awaited<ReturnType<StockHistoryPage["rows"]>> = [];
  await step(6, async () => {
    supplement(`在庫履歴検索一覧には前の実行の同じ商品の行も出るので、商品名・カード名・商品コードの欄には「L002」の代わりに、この実行の印つきの値「-L002-${RUN_MARK}」（商品コードの共通の部分）を入れた`);
    await h.clearConditions();
    await h.fillKeyword(`-L002-${RUN_MARK}`);
    await 在庫履歴の店舗を選ぶ(page, TC東京.店名);
    expect(await h.submit(), "在庫履歴検索一覧の検索の応答").toBeLessThan(400);
    rows = await h.rows();
    note(`在庫履歴の行: ${JSON.stringify(rows)}`);
  });
  await expected(async () => {
    const a = rows.find((r) => r["商品コード"] === 商品コードの("BULK-A-L002")), b = rows.find((r) => r["商品コード"] === 商品コードの("BULK-B-L002"));
    expect.soft(!!a && !!b, "商品コードBULK-A-L002・BULK-B-L002の行が表示される").toBe(true);
    for (const [r, 数, 名] of [[a, "-3", "A"], [b, "-4", "B"]] as const) {
      expect.soft(r?.["在庫変動数"] ?? r?.["在庫増減数"], `${名}の行の在庫増減数`).toBe(数);
      expect.soft(r?.["店舗"], `${名}の行の店舗`).toBe(TC東京.ショップ名略称);
      expect.soft(r?.["在庫場所"] ?? r?.["在庫区分"], `${名}の行の在庫区分`).toBe("EC-CUBE");
      expect.soft(r?.["在庫変動理由区分"], `${名}の行の在庫変動理由区分`).toBe("廃棄(破損)");
      expect.soft(r?.["在庫変動理由"], `${名}の行の在庫変動理由`).toBe(理由);
      expect.soft(r?.["登録者"], `${名}の行の登録者`).toBe(試験管理者.名前);
      expect.soft(r?.["承認日"], `${名}の行の承認日`).toBe("-");
      expect.soft(r?.["承認者"], `${名}の行の承認者`).toBe("承認待ち");
    }
  });
});
