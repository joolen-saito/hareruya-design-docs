/**
 * B06-01 買取自動入庫バッチ（店頭買取の入庫待ちを入庫する）。正本: cases/B06-01_test_cases.tsv
 * 実装したケースと解釈は記録 review/B06-01_progress_2026-11-20_dev.md。
 *
 * - 2回に分けて流す（依頼者決定 2026-11-20）。1回目（準備の回）はシードを作って控え、手順1で止める（未判定・バッチ未実行）。
 *   開発環境のバッチの環境が毎日 15:00（日本時間）に流したあと、2回目（確かめの回）に流す。シードは控えたものを使い回す（seeds/b06-01.ts）。
 * - 手順1「バッチを実行する」と手順2「バッチの実行一覧で成功を待つ」は、自動の実行を待つことに読み替える（正本の外の補い）。
 *   手順1で、準備のあとにバッチが流れたこと（026・031 は2回）を、バッチが書いた在庫履歴の行の時刻で確かめる。
 * - 店舗「TC東京2F」は試験支店に読み替える。正本の決め打ちの商品コード・査定IDは、準備の回で作った値（実行の印つき）を使う。
 * - 026・031 の「1回目の結果」（手順の途中の確かめ）は、2回の実行のあとに確かめる（1回目と2回目のあいだに流す回は設けない）。
 *   2回目の実行で二重に入庫していれば、在庫・履歴の件数が期待と違うので、期待結果で分かる。
 */
import { test } from "@playwright/test";
import { CaseBody, caseTest, CaseCtx, expect } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { 在庫の行を読む, 在庫履歴の行を読む } from "../../pages/admin/b06_01_read";
import { 在庫を検索する, 在庫履歴を検索する } from "../../pages/admin/f04_04_stock";
import { OtcOrderDetailPage } from "../../pages/admin/m06_04_status";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { 試験店舗の名前を読む } from "../../pages/admin/test_store";
import { B0601_ADM, バッチの実行を確かめる, 準備したもの } from "../../seeds/b06-01";
import "../../seeds/b06-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** 手順1・2: 自動の実行を待ったことを確かめる（手順1）／実行の時刻を記録する（手順2） */
async function バッチの手順(ctx: CaseCtx, n1: number, n2: number, seedIds: string[], 何回目 = "") {
  let 実行: string[] = [];
  await ctx.step(n1, async () => {
    supplement("買取自動入庫バッチは E2E から起動する入口が無い。開発環境のバッチの環境が毎日 15:00（日本時間）に自動で流すのを待つ形に読み替えた（依頼者決定 2026-11-20）");
    const r = バッチの実行を確かめる(seedIds);
    実行 = r.実行;
    for (const [id, p] of Object.entries(r.準備)) note(`${id}: ${p.作った日時} に準備した（査定ID ${p.査定ID}・商品コード ${p.商品コード}）`);
  });
  await ctx.step(n2, async () => {
    supplement("バッチの実行一覧の画面は無い。実行の時刻は、バッチが書いた在庫履歴の行の登録日時で見た（ほかの方の買取の分も含む）");
    note(`準備のあとの買取自動入庫バッチの実行${何回目}: ${実行.join("・")}`);
    expect(実行.length, "準備のあとに買取自動入庫バッチが流れた回数").toBeGreaterThanOrEqual(1);
  });
}

async function 店名(ctx: CaseCtx): Promise<string> {
  await loginAdmin(ctx.page, B0601_ADM);
  const s = (await 試験店舗の名前を読む(ctx.page)).試験支店;
  supplement(`店舗「TC東京2F」は試験支店（${s}）に読み替えた（依頼者決定 2026-11-13）。管理者は決まった印を付けた値（${B0601_ADM.loginId}）で作った`);
  return s;
}

/** 在庫検索一覧(検索入力)を開き（手順 open）、コードと店舗を入れて検索（手順 search）、行を読む（手順 read） */
async function 在庫を見る(ctx: CaseCtx, open: number, search: number, read: number | null, seedId: string, s: string) {
  const code = 準備したもの(seedId).商品コード;
  await ctx.step(open, async () => {
    const res = await ctx.page.goto(adminUrl("/product/stock"));
    expect(res?.status(), "在庫検索一覧(検索入力)の応答").toBe(200);
  });
  let v: Awaited<ReturnType<typeof 在庫の行を読む>> | null = null;
  const doSearch = async () => {
    const list = await 在庫を検索する(ctx.page, code, s);
    note(`検索条件のコードは、準備の回で作った ${code}（正本の値に実行の印を付けたもの）`);
    v = await 在庫の行を読む(list, code, s);
  };
  if (read === null) { await ctx.step(search, doSearch); }
  else { await ctx.step(search, doSearch); await ctx.step(read, async () => { note(`在庫検索一覧の行: ${JSON.stringify(v)}`); }); }
  return () => v!;
}

/** 在庫履歴検索一覧(検索入力)を開き、キーワードと店舗で検索して行を読む */
async function 履歴を読む(ctx: CaseCtx, seedId: string, s: string) {
  const code = 準備したもの(seedId).商品コード;
  const h = await 在庫履歴を検索する(ctx.page, code, s);
  note(`キーワードは、準備の回で作った ${code}（正本の値に実行の印を付けたもの）`);
  const rows = await 在庫履歴の行を読む(h);
  note(`在庫履歴の行（${code}・${s}）: ${JSON.stringify(rows)}`);
  return rows;
}

const 在庫の期待 = (v: { 行の数: number; 在庫: number | null; 原価単価: number | null; 総原価: number | null }, 在庫: number, 総原価: number, 原価単価: number, 何: string) => {
  expect(v.行の数, `${何}: 在庫検索一覧の行の数`).toBe(1);
  expect(v.在庫, `${何}: 在庫`).toBe(在庫);
  expect(v.総原価, `${何}: 総原価`).toBe(総原価);
  expect(v.原価単価, `${何}: 原価単価`).toBe(原価単価);
};

const 履歴の期待 = (rows: Record<string, string | number>[], v: Record<string, string | number>, 何: string) => {
  expect(rows.length, `${何}: 在庫履歴の行の数`).toBe(1);
  for (const [k, x] of Object.entries(v)) expect(rows[0][k], `${何}: ${k}`).toBe(x);
};

/** 015・022: 在庫検索一覧で1商品を確かめる */
function 在庫のケース(seedId: string, 期待: [number, number, number]): CaseBody {
  return async (ctx) => {
    await バッチの手順(ctx, 1, 2, [seedId]);
    const s = await 店名(ctx);
    const read = await 在庫を見る(ctx, 3, 4, 5, seedId, s);
    await ctx.expected(async () => {
      expect(read().行の数, "在庫検索一覧の行の数").toBe(1);
      在庫の期待(read(), 期待[0], 期待[1], 期待[2], 準備したもの(seedId).商品コード);
    });
  };
}
caseTest("IT-B06-01-015", 在庫のケース("S-B06-01-L-STORE-015", [11, 10900, 991]));
caseTest("IT-B06-01-022", 在庫のケース("S-B06-01-DP-STORE-022", [10, 9700, 970]));

/** 016・027: 在庫履歴検索一覧で1商品の履歴を確かめる */
function 履歴のケース(seedId: string, 期待: Record<string, string | number>): CaseBody {
  return async (ctx) => {
    await バッチの手順(ctx, 1, 2, [seedId]);
    const s = await 店名(ctx);
    let rows: Record<string, string | number>[] = [];
    await ctx.step(3, async () => { await ctx.page.waitForLoadState("load"); note("在庫履歴検索一覧(検索入力)は、手順4の検索の部品が開く"); });
    await ctx.step(4, async () => { rows = await 履歴を読む(ctx, seedId, s); });
    await ctx.step(5, async () => { note(`読んだ列: ${Object.keys(rows[0] ?? {}).join("・")}`); });
    await ctx.expected(async () => {
      expect(rows.length, "在庫履歴の行の数").toBe(1);
      履歴の期待(rows, { 店舗: s, ...期待 }, 準備したもの(seedId).商品コード);
    });
  };
}
caseTest("IT-B06-01-016", 履歴のケース("S-B06-01-L-STORE-016", { 変更前在庫: 10, 変更後在庫: 11, 在庫増減数: 1, 仕入単価: 900, 変更前原価単価: 1000, 変更後原価単価: 991, 変更前総原価: 10000, 変更後総原価: 10900, 登録者: "システム" }));
caseTest("IT-B06-01-027", 履歴のケース("S-B06-01-DP-STORE-027", { 変更前在庫: 7, 変更後在庫: 10, 在庫増減数: 3, 仕入単価: 900, 登録者: "システム" }));

/** 017: 買取詳細のステータス */
caseTest("IT-B06-01-017", async (ctx) => {
  const seedId = "S-B06-01-L-STORE-017";
  await バッチの手順(ctx, 1, 2, [seedId]);
  await 店名(ctx);
  const 査定ID = 準備したもの(seedId).査定ID;
  const list = new OtcListPage(ctx.page);
  await ctx.step(3, async () => { await list.open(); });
  await ctx.step(4, async () => {
    note(`査定IDは、準備の回で申し込んだ ${査定ID}（正本の SA-B0601L-003 の代わり。画面が振った番号）`);
    await list.日時を空にする();
    await list.査定IDを入れる(査定ID);
    await list.検索する();
  });
  await ctx.step(5, async () => { await list.詳細を開く(査定ID); });
  let ステータス = "";
  await ctx.step(6, async () => { ステータス = await new OtcOrderDetailPage(ctx.page).項目("ステータス"); });
  await ctx.expected(async () => { expect(ステータス, `査定ID ${査定ID} の買取詳細のステータス`).toBe("入庫済み"); });
});

/** 023・025: 在庫検索一覧で2商品を確かめる（手順6で同じ画面のまま2つ目を検索する） */
function 二つの在庫のケース(a: string, b: string, 期待A: [number, number, number], 期待B: [number, number, number]): CaseBody {
  return async (ctx) => {
    await バッチの手順(ctx, 1, 2, [a, b]);
    const s = await 店名(ctx);
    const readA = await 在庫を見る(ctx, 3, 4, 5, a, s);
    let vB: Awaited<ReturnType<typeof 在庫の行を読む>> | null = null;
    await ctx.step(6, async () => {
      const code = 準備したもの(b).商品コード;
      const list = await 在庫を検索する(ctx.page, code, s);
      vB = await 在庫の行を読む(list, code, s);
      note(`2つ目の検索のコードは ${code}・在庫検索一覧の行: ${JSON.stringify(vB)}`);
    });
    await ctx.expected(async () => {
      expect([readA().行の数, vB!.行の数], "在庫検索一覧の行の数（1つ目・2つ目）").toEqual([1, 1]);
      在庫の期待(readA(), 期待A[0], 期待A[1], 期待A[2], 準備したもの(a).商品コード);
      在庫の期待(vB!, 期待B[0], 期待B[1], 期待B[2], 準備したもの(b).商品コード);
    });
  };
}
caseTest("IT-B06-01-023", 二つの在庫のケース("S-B06-01-DP-STORE-A-023", "S-B06-01-DP-STORE-B-023", [11, 10900, 991], [11, 10900, 991]));
caseTest("IT-B06-01-025", 二つの在庫のケース("S-B06-01-DP-STOREQ-025", "S-B06-01-DP-STORER-025", [11, 10900, 991], [10, 10000, 1000]));

/** 028・030: 在庫履歴検索一覧で2商品の履歴を確かめる（030 は2つ目が0件） */
function 二つの履歴のケース(a: string, b: string, 期待B: Record<string, string | number> | null): CaseBody {
  return async (ctx) => {
    await バッチの手順(ctx, 1, 2, [a, b]);
    const s = await 店名(ctx);
    let rowsA: Record<string, string | number>[] = [];
    let rowsB: Record<string, string | number>[] = [];
    await ctx.step(3, async () => { await ctx.page.waitForLoadState("load"); note("在庫履歴検索一覧(検索入力)は、手順4の検索の部品が開く"); });
    await ctx.step(4, async () => { rowsA = await 履歴を読む(ctx, a, s); });
    await ctx.step(5, async () => { note(`1つ目の行の数: ${rowsA.length}`); });
    await ctx.step(6, async () => { rowsB = await 履歴を読む(ctx, b, s); });
    await ctx.step(7, async () => { note(`2つ目の行の数: ${rowsB.length}`); });
    await ctx.expected(async () => {
      expect(rowsA.length, "1つ目の在庫履歴の行の数").toBe(1);
      履歴の期待(rowsA, { 店舗: s, 変更前在庫: 10, 変更後在庫: 11, 在庫増減数: 1, 仕入単価: 900, 登録者: "システム" }, 準備したもの(a).商品コード);
      if (期待B) 履歴の期待(rowsB, { 店舗: s, ...期待B }, 準備したもの(b).商品コード);
      else expect(rowsB.length, `${準備したもの(b).商品コード}: 在庫履歴の行の数（該当なし）`).toBe(0);
    });
  };
}
caseTest("IT-B06-01-028", 二つの履歴のケース("S-B06-01-DP-STORE-A-028", "S-B06-01-DP-STORE-B-028", { 変更前在庫: 10, 変更後在庫: 11, 在庫増減数: 1, 仕入単価: 900, 登録者: "システム" }));
caseTest("IT-B06-01-030", 二つの履歴のケース("S-B06-01-DP-STOREQ-030", "S-B06-01-DP-STORER-030", null));

/** 026: 2回目の実行で二重に入庫しない（在庫検索一覧） */
caseTest("IT-B06-01-026", async (ctx) => {
  const seedId = "S-B06-01-DP-STORE-026";
  await バッチの手順(ctx, 1, 2, [seedId], "（1回目）");
  const s = await 店名(ctx);
  const 査定ID = 準備したもの(seedId).査定ID;
  const code = 準備したもの(seedId).商品コード;
  const list = new OtcListPage(ctx.page);
  await ctx.step(3, async () => {
    await list.open();
    await list.日時を空にする();
    await list.査定IDを入れる(査定ID);
    await list.検索する();
    note(`査定IDは、準備の回で申し込んだ ${査定ID}（正本の SA-B0601-026-A の代わり）`);
  });
  await ctx.step(4, async () => {
    supplement("「1回目の結果」は、1回目と2回目の実行のあいだに流す回を設けていないので、2回の実行のあとに確かめた");
    await list.詳細を開く(査定ID);
    expect(await new OtcOrderDetailPage(ctx.page).項目("ステータス"), "買取詳細のステータス").toBe("入庫済み");
  });
  await ctx.step(5, async () => {
    const l = await 在庫を検索する(ctx.page, code, s);
    const v = await 在庫の行を読む(l, code, s);
    expect(v.在庫, "在庫（中止の判定）").toBe(11);
  });
  await ctx.step(6, async () => { note("2回目の実行は、準備のあとの2回目の自動の実行（手順1・2で確かめた時刻の2つ目）"); });
  await ctx.step(7, async () => { note(`2回目の実行の時刻は、手順2の注記の2つ目`); });
  const read = await 在庫を見る(ctx, 8, 9, 10, seedId, s);
  await ctx.expected(async () => {
    expect(read().在庫, `${code}: 在庫（2回目の実行のあと）`).toBe(11);
    在庫の期待(read(), 11, 10900, 991, code);
  });
});

/** 031: 2回目の実行で二重に入庫しない（在庫履歴検索一覧） */
caseTest("IT-B06-01-031", async (ctx) => {
  const seedId = "S-B06-01-DP-STORE-031";
  await バッチの手順(ctx, 1, 2, [seedId], "（1回目）");
  const s = await 店名(ctx);
  let 一回目: Record<string, string | number>[] = [];
  await ctx.step(3, async () => {
    supplement("「1回目の結果」は、1回目と2回目の実行のあいだに流す回を設けていないので、2回の実行のあとに確かめた");
    一回目 = await 履歴を読む(ctx, seedId, s);
  });
  await ctx.step(4, async () => {
    expect(一回目.length, "在庫履歴の行の数（中止の判定）").toBe(1);
    expect([一回目[0].変更前在庫, 一回目[0].変更後在庫, 一回目[0].在庫増減数], "変更前在庫・変更後在庫・在庫増減数（中止の判定）").toEqual([10, 11, 1]);
  });
  await ctx.step(5, async () => { note("2回目の実行は、準備のあとの2回目の自動の実行（手順1・2で確かめた時刻の2つ目）"); });
  await ctx.step(6, async () => { note("2回目の実行の時刻は、手順2の注記の2つ目"); });
  let rows: Record<string, string | number>[] = [];
  await ctx.step(7, async () => { await ctx.page.waitForLoadState("load"); note("在庫履歴検索一覧(検索入力)は、手順8の検索の部品が開く"); });
  await ctx.step(8, async () => { rows = await 履歴を読む(ctx, seedId, s); });
  await ctx.step(9, async () => { note(`行の数: ${rows.length}`); });
  await ctx.expected(async () => {
    expect(rows.length, "在庫履歴の行の数（2回目の実行のあとも1件のまま）").toBe(1);
    履歴の期待(rows, { 店舗: s, 変更前在庫: 10, 変更後在庫: 11, 在庫増減数: 1, 仕入単価: 900, 登録者: "システム" }, 準備したもの(seedId).商品コード);
  });
});
