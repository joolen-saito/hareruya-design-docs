/**
 * M06-03 買取詳細（残りのケース。2026-11-12 追加）。正本: cases/M06-03_test_cases.tsv
 *
 * 実装したケース: 001 008 010 019 020 028-033 035-049 053 059-062 074 080 082 083 085 086 089-096
 * 実装しないケース: 007（削除済みのメンバー・商品に紐づく買取。メンバー・商品は物理削除で、買取から参照されていると外部キーで消せず、
 *   論理削除の列も無いので、前提の状態をアプリの中に作れない）
 *
 * シードの作り方・読み替えは seeds/m06-03.ts・seeds/m06-03-more.ts（シードの報告にも出る）。
 * 決め打ちの識別の値（商品コード・商品名・申込者名・会員のメール）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 * 正本の決め打ちの商品ID（7001 など）は、シードで画面が振った番号に読み替える（シードの商品の番号をDBで引く）。
 * 082・083・094・095・096 は共有の設定（追加システム設定の固定価格商品部門ID）を書き換えるシードを使う。夜の1本流しのときだけ流れ、
 * ケースの終わりに基盤が必ず画面で戻す（lib/shared_restore.ts）。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { Notes } from "../../lib/notes";
import { rc, rcFixed } from "../../lib/run_marker";
import { adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import {
  買取の現状, 実在庫の現状, 実在庫履歴, 店舗在庫と履歴の件数, 個別入力商品の詳細, 実在庫の全部, 買取明細の件数, 買取の合計金額,
  店舗在庫を調べる, 店舗在庫の履歴, 総在庫, 規格と商品のID,
} from "../../db/m06_03";
import { OtcDetail, 数, 権限エラーの文, 送られた値, 送信先 } from "../../pages/admin/m06_03_detail";
import { OtcListPage } from "../../pages/admin/m06_otc_list";
import { StockHistoryPage, numberOf } from "../../pages/admin/m04_17_stock_history";
import { HistoryPage } from "../../pages/admin/m06_05_history";
import { 在庫検索の行, 在庫検索をする, 在庫検索一覧を開く, 在庫履歴の店舗の欄, 表示名で選ぶ } from "../../pages/admin/m06_03_links";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { PurchaseHistoryPage } from "../../pages/front/m06_otc_buy";
import { M0603_OSAKA, M0603_STOCK, L_A, 共通商品, 追加商品 } from "../../seeds/m06-03";
import { M0603_DP085, M0603_DP086, M0603_NONE, M0603_RF, QG0603_ACC, RFの商品コード } from "../../seeds/m06-03-more";
import { QG_MEMBER_PASSWORD } from "../../seeds/m06-04";
import { STORE_A } from "../../seeds/m06-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const A = () => rc(共通商品.A);
const B = () => rc(共通商品.B);
const C = () => rc(共通商品.C);
const D = () => rc(共通商品.D);
const X = (k: keyof typeof 追加商品) => rc(追加商品[k]);

const 注文ID = (notes: Notes, no: string) => notes.get(`〔注文ID-M0603-${no}〕`);
const 査定番号 = (notes: Notes, no: string) => notes.get(`〔査定番号-M0603-${no}〕`);
const { 詳細の更新, 実在庫情報登録 } = 送信先;
const 商品IDの読み替え = "正本の決め打ちの商品ID（7001）は、シードで画面が振った検索対象商品の商品IDに読み替えた（シードの商品の番号をDBで引いた）";

/** 送信が送られたことの確かめ（操作が送られずに「変わらない」で合格にしない） */
const 送られた = (r: { 状態: number } | undefined, 何: string) => expect.soft(r?.状態 ?? 0, `${何}の送信が送られ、応答があった（応答の状態）`).toBeGreaterThan(0);

// ---------------------------------------------------------------- 表示

// 001: 操作履歴の各項目
caseTest("IT-M06-03-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await expected(async () => {
    const 枠 = "操作履歴";
    expect.soft(await d.値(枠, "査定番号"), "査定番号").toBe(査定番号(notes, "共有BASE"));
    expect.soft(await d.値(枠, "査定申込者氏名"), "査定申込者氏名（氏名と氏名カナ）").toBe("試験買取 太郎（シケンカイトリ タロウ）");
    expect.soft(await d.値(枠, "会員ID"), "会員ID").toBe(notes.get("〔会員ID-M0603-共有BASE〕"));
    expect.soft(await d.値(枠, "ステータス"), "ステータス").toBe("入庫待ち");
    expect.soft(await d.値(枠, "査定申込日時"), "査定申込日時").toBe("2026/09/01 09:00:00");
    expect.soft(await d.値(枠, "買取成立日時"), "買取成立日時").toBe("2026/09/01 09:30:00");
    expect.soft(await d.値(枠, "買取キャンセル日時"), "買取キャンセル日時（未設定）").toBe("");
    expect.soft(await d.値(枠, "ダブルチェック者"), "ダブルチェック者").toBe(rcFixed("check01"));
    expect.soft(await d.値(枠, "端末取引ID"), "端末取引ID").toBe("6301");
  });
  note(`ダブルチェック者 check01 は、決まった印つきの名前「${rcFixed("check01")}」のメンバーで作った。端末取引ID は整数の列なので TX-6301 でなく 6301 で登録した（シードの報告）`);
  note("氏名は全角の空白で区切って表示されるので、空白を1つの空白にそろえて比べた");
});

// 008: 未登録の査定番号
caseTest("IT-M06-03-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const list = new OtcListPage(page);
  const d = new OtcDetail(page);
  await step(1, async () => {
    await list.open();
    await list.日時を空にする();
    await list.買取店舗を選ぶ("");
    await list.査定IDを入れる("20260999-99");
    await list.検索する();
  });
  await expected(async () => {
    await expect(list.該当件数の表示().first(), "買取一覧の検索結果の該当件数の表示（検索が終わった）").toBeVisible();
    expect.soft(await list.該当件数(), "査定番号 20260999-99 で検索した結果の該当件数").toBe(0);
    await expect.soft(page.getByRole("link", { name: "20260999-99", exact: true }), "査定番号 20260999-99 の買取詳細を開くリンク").toHaveCount(0);
    await expect.soft(page.locator(".card-header", { hasText: "操作履歴" }), "買取詳細の枠（操作履歴）").toHaveCount(0);
    expect.soft((await d.通知の文()).成功, "保存結果（成功の通知）").toEqual([]);
  });
  note("買取詳細画面は買取の内部の番号で開く作りで、査定番号を指定して開く手段は買取一覧の査定番号の検索だけなので、買取一覧で査定番号 20260999-99 を検索して開こうとした");
});

// 010: 権限なしでステータス変更
caseTest("IT-M06-03-010", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_NONE);
  const d = new OtcDetail(page);
  let 前: string[] = [];
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); 前 = await 権限エラーの文(page); });
  await step(2, async () => { await Promise.all([page.waitForLoadState("load"), d.ステータス変更のリンク().click()]); await page.waitForLoadState("load"); });
  await expected(async () => {
    const e = await 権限エラーの文(page);
    expect.soft(前, "押す前の画面には権限エラーが無い").toEqual([]);
    expect.soft(e.length, `権限エラーの表示（${e.join(" / ") || "なし"}）`).toBeGreaterThan(0);
    await expect.soft(page.locator("form#form select"), "ステータス変更の入力欄（出ていない）").toHaveCount(0);
  });
});

// 028: 増減数編集モードの商品（高額商品と通常商品の全状態）
caseTest("IT-M06-03-028", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  let rows: string[][] = [];
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { rows = await d.実在庫の編集行(); });
  await expected(async () => {
    const 状態 = (code: string) => rows.find((r) => r[1] === code)?.[3];
    expect.soft(状態(B()), "高額商品 BASE-B-NM の行（状態）").toBe("NM");
    expect.soft(状態(A()), "BASE-A の NM の行（状態）").toBe("NM");
    expect.soft(状態(X("A_SP")), "BASE-A の SP の行（状態）").toBe("SP");
    expect.soft(状態(X("A_MP")), "BASE-A の MP の行（状態）").toBe("MP");
  });
  note("BASE-B-NM には高額商品コードを設定し、BASE-A には SP・MP の規格を商品規格登録編集で足した（シードの報告）");
});

// 029: 未買取の状態に買取金額を出さない
caseTest("IT-M06-03-029", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  let rows: string[][] = [];
  await step(1, async () => { await d.open(注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { rows = await d.実在庫の編集行(); });
  await expected(async () => {
    const 金額 = (code: string) => rows.find((r) => r[1] === code)?.[5];
    expect.soft(金額(X("A_SP")), "BASE-A の SP の買取金額（表示されない＝「-」）").toBe("-");
    expect.soft(金額(X("A_MP")), "BASE-A の MP の買取金額（表示されない＝「-」）").toBe("-");
    expect.soft(数(金額(A()) ?? ""), "比べるための BASE-A の NM の買取金額（実在庫の1,000円が出ている）").toBe(1000);
  });
  note("買取金額の欄は、値が無いとき「-」を表示する作りなので、「-」を「表示されない」とした");
});

// ---------------------------------------------------------------- 実在庫の更新できる・できないステータス

// 019: 入庫待ち・未登録在庫ありは更新できる
caseTest("IT-M06-03-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const a = 注文ID(notes, "019A"); const b = 注文ID(notes, "019B");
  await step(1, async () => { await d.open(a); await d.編集を押す(); await d.増減数を入れる(A(), 1); await d.追加品確定を押す(); });
  await step(2, async () => { await d.open(b); await d.編集を押す(); await d.増減数を入れる(X("UNREG"), 1); await d.追加品確定を押す(); });
  await step(3, async () => { 実在庫の現状(a, A()); 実在庫の現状(b, X("UNREG")); });
  await expected(async () => {
    expect.soft(実在庫の現状(a, A())?.数量, "入庫待ちの買取の BASE-A-NM の数量（5から6）").toBe(6);
    expect.soft(実在庫の現状(b, X("UNREG"))?.数量, "未登録在庫ありの買取の UNREG-A-NM の数量（2から3）").toBe(3);
  });
});

// 020: 入庫済みは更新できない
caseTest("IT-M06-03-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有INVALID");
  const code = rc("INVALID-A-NM");
  let 送信: { 状態: number } | undefined;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(code, 1); });
  await step(4, async () => { const w = d.送信を見張る(詳細の更新); await d.追加品確定を押す(); 送信 = await w(); });
  await step(5, async () => { 実在庫の現状(id, code); });
  await expected(async () => {
    送られた(送信, "追加品確定");
    expect.soft(実在庫の現状(id, code)?.数量, "INVALID-A-NM の数量（2のまま）").toBe(2);
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
    await expect.soft(d.枠("操作履歴"), "買取詳細画面").toBeVisible();
  });
});

// ---------------------------------------------------------------- 原価の按分

type 原価の期待 = { コード: () => string; 名: string; 数量: number; 小計: number; 単価?: number };

/** 増減数を入れ（増減数編集モードに行が無い規格は、商品追加で足してから入れる）、追加品確定を押し、DBの実在庫を確かめる */
function 原価のケース(no: string, 増減: [() => string, number][], 期待: 原価の期待[], 合計: number) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    await loginAdmin(page, M0603_STOCK);
    const d = new OtcDetail(page);
    const id = 注文ID(notes, no);
    const 足した: string[] = [];
    await step(1, async () => { await d.open(id); });
    await step(2, async () => { await d.編集を押す(); });
    await step(3, async () => {
      const rows = await d.実在庫の編集行();
      for (const [code, n] of 増減) {
        // 表に行がある・買取に実在庫がある規格は、表の行に入れる（実在庫があるのに行が無ければ、入れられずに落ちる＝そのまま結果にする）
        if (rows.some((r) => r[1] === code()) || 実在庫の現状(id, code()) !== null) { await d.増減数を入れる(code(), n); continue; }
        await d.商品追加でモーダルを開く();
        await d.モーダルで検索する(code());
        await d.決定して足す(await d.モーダルで規格を選ぶ(code()));
        await d.足された行の増減数を入れる(code(), n);
        足した.push(code());
      }
    });
    await step(4, async () => { await d.追加品確定を押す(); });
    await step(5, async () => { 実在庫の全部(id); });
    await expected(async () => {
      const all = 実在庫の全部(id);
      for (const e of 期待) {
        const s = all.find((r) => r.商品コード === e.コード());
        expect.soft(s?.数量, `${e.名} の数量`).toBe(e.数量);
        expect.soft(s?.小計, `${e.名} の小計`).toBe(e.小計);
        if (e.単価 !== undefined) expect.soft(s && s.数量 > 0 ? s.小計 / s.数量 : null, `${e.名} の仕入単価（小計÷数量）`).toBe(e.単価);
      }
      const sum = all.reduce((t, r) => t + r.小計, 0);
      expect.soft(sum, "明細小計の合計").toBe(合計);
      expect.soft(買取の合計金額(id), "買取合計金額（明細小計の合計と一致）").toBe(sum);
    });
    note("仕入単価は、実在庫の小計を数量で割った値（実在庫に仕入単価の列は無く、画面の買取金額も小計÷数量で出す）");
    if (足した.length) note(`増減数編集モードの表に行が無い規格（${足した.join("・")}。買取に実在庫が無い商品の規格）は、「商品追加」の商品検索モーダルで選んで行を足し、その行に増減数を入れた`);
  };
}

caseTest("IT-M06-03-030", 原価のケース("030", [[() => X("BL_NM"), -1]], [{ コード: () => X("BL_NM"), 名: "BlackLotus(NM)", 数量: 2, 小計: 300000, 単価: 150000 }], 300000));
caseTest("IT-M06-03-031", 原価のケース("031", [[() => X("BL_NM"), 1]], [{ コード: () => X("BL_NM"), 名: "BlackLotus(NM)", 数量: 4, 小計: 300000, 単価: 75000 }], 300000));
caseTest("IT-M06-03-032", 原価のケース("032", [[() => X("BL_NM"), -1], [() => X("BL_SP"), 1]], [
  { コード: () => X("BL_NM"), 名: "BlackLotus(NM)", 数量: 2, 小計: 200000 }, { コード: () => X("BL_SP"), 名: "BlackLotus(SP)", 数量: 1, 小計: 100000 },
], 300000));
caseTest("IT-M06-03-033", 原価のケース("033", [[() => X("BL_NM"), -1], [() => X("BL_SP"), 1], [() => X("BAD_NM"), -1], [() => X("MOX_NM"), 1]], [
  { コード: () => X("BL_NM"), 名: "BlackLotus(NM)", 数量: 2, 小計: 200000 }, { コード: () => X("BL_SP"), 名: "BlackLotus(SP)", 数量: 1, 小計: 90000 },
  { コード: () => X("MOX_NM"), 名: "Mox Pearl(NM)", 数量: 1, 小計: 90000 },
], 380000));
caseTest("IT-M06-03-089", 原価のケース("089", [[() => X("BAD_NM"), -1]], [
  { コード: () => X("BAD_NM"), 名: "Badlands(NM)", 数量: 0, 小計: 0 }, { コード: () => X("BL_NM"), 名: "BlackLotus(NM)", 数量: 3, 小計: 340000 },
  { コード: () => X("MOX_NM"), 名: "Mox Pearl(NM)", 数量: 1, 小計: 90000 },
], 430000));
caseTest("IT-M06-03-090", 原価のケース("090", [[C, -1]], [
  { コード: C, 名: "BASE-C-SP", 数量: 0, 小計: 0 }, { コード: D, 名: "M0603-ORD-D-NM", 数量: 1, 小計: 2003 }, { コード: A, 名: "BASE-A-NM", 数量: 2, 小計: 1002 },
], 3005));
caseTest("IT-M06-03-091", 原価のケース("091", [[C, -1]], [
  { コード: C, 名: "BASE-C-SP", 数量: 0, 小計: 0 }, { コード: A, 名: "BASE-A-NM", 数量: 2, 小計: 2003 }, { コード: D, 名: "M0603-ORD-D-NM", 数量: 1, 小計: 1002 },
], 3005));
caseTest("IT-M06-03-092", 原価のケース("092", [[() => X("A_SP"), -1], [A, 1], [D, 1]], [
  { コード: A, 名: "BASE-A-NM", 数量: 2, 小計: 3501 }, { コード: D, 名: "M0603-ORD-D-NM", 数量: 2, 小計: 1500 }, { コード: () => X("A_SP"), 名: "BASE-A-SP", 数量: 1, 小計: 1001 },
], 6002));
caseTest("IT-M06-03-093", 原価のケース("093", [[() => X("BL_NM"), -1]], [
  { コード: () => X("BL_NM"), 名: "BlackLotus(NM)", 数量: 2, 小計: 300000, 単価: 150000 }, { コード: () => X("MOX_NM"), 名: "Mox Pearl(NM)", 数量: 1, 小計: 50000, 単価: 50000 },
], 350000));

// ---------------------------------------------------------------- 商品検索モーダル

// 035: 個別入力商品の実在庫登録ボタンでモーダル
caseTest("IT-M06-03-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有UNREG-TWO")); });
  await step(2, async () => { await d.実在庫登録を押す("個別商品A"); });
  await expected(async () => {
    await expect.soft(d.商品検索モーダル(), "商品検索モーダル").toBeVisible();
    await expect.soft(d.商品検索モーダル().locator("#searchProductModalButton"), "モーダルの検索ボタン").toBeVisible();
  });
});

/** 検索対象商品（正本の商品ID 7001）の商品ID */
const 検索対象の商品ID = () => 規格と商品のID(X("SRCH_NM")).商品ID;
const 結果の商品ID = async (d: OtcDetail) => (await d.モーダルの結果を読む()).map((r) => r.商品ID);

/** 実在庫情報の「編集」→「商品追加」で商品検索モーダルを開く */
async function 商品追加のモーダルを開く(d: OtcDetail, 受注ID: string): Promise<void> {
  await d.open(受注ID);
  await d.編集を押す();
  await d.商品追加でモーダルを開く();
}

// 036: 検索条件
caseTest("IT-M06-03-036", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 検索対象の商品ID();
  const 前の桁 = id.slice(0, -1);
  const r: Record<string, string[]> = {};
  let カテゴリ = "カード";
  await step(1, async () => { await 商品追加のモーダルを開く(d, 注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.モーダルで検索する("Black"); r.Black = await 結果の商品ID(d); });
  await step(3, async () => { await d.モーダルで検索する("BLK"); r.BLK = await 結果の商品ID(d); });
  await step(4, async () => { await d.モーダルで検索する(前の桁); r.前 = await 結果の商品ID(d); });
  await step(5, async () => { await d.モーダルで検索する(id); r.ID = await 結果の商品ID(d); });
  await step(6, async () => {
    try { await d.モーダルで検索する(null, "カード"); } catch { カテゴリ = "シングルカード"; await d.モーダルで検索する(null, カテゴリ); }
    r.カテゴリ = await 結果の商品ID(d);
  });
  await expected(async () => {
    expect.soft(r.Black, `「Black」の結果に、商品名に Black を含む検索対象商品（商品ID ${id}）がある（部分一致）`).toContain(id);
    expect.soft(r.BLK, `「BLK」の結果に、商品コードに BLK を含む検索対象商品（商品ID ${id}）がある（部分一致）`).toContain(id);
    expect.soft(r.ID, `商品ID「${id}」の結果に、検索対象商品がある（完全一致）`).toContain(id);
    expect.soft(r.前, `商品IDの先頭の桁「${前の桁}」の結果に、検索対象商品（商品ID ${id}）が無い`).not.toContain(id);
    expect.soft(r.カテゴリ, `カテゴリー「${カテゴリ}」を選んだ結果に、カテゴリーが「${カテゴリ}」の検索対象商品がある`).toContain(id);
  });
  note(`${商品IDの読み替え}。手順4の「700」は、7001 の末尾の1桁を除いた値なので、検索対象商品の商品IDの末尾の1桁を除いた「${前の桁}」にした`);
  note(`手順6は正本のとおりカテゴリーだけを選んで検索した（商品名・ID・コードの欄は手順5の値のまま）。カテゴリーの名前は、この環境の最上位のカテゴリ「${カテゴリ}」`);
  note("結果は商品IDの大きい順に出るので、新しく作った検索対象商品は1ページ目に出る");
});

// 037: 商品単位の1行と商品コードの選択肢
caseTest("IT-M06-03-037", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 検索対象の商品ID();
  let rows: Awaited<ReturnType<OtcDetail["モーダルの結果を読む"]>> = [];
  await step(1, async () => { await 商品追加のモーダルを開く(d, 注文ID(notes, "共有BASE")); });
  await step(2, async () => { await d.モーダルで検索する(id); });
  await step(3, async () => { rows = await d.モーダルの結果を読む(); });
  await expected(async () => {
    const mine = rows.filter((r) => r.商品ID === id);
    expect.soft(mine.length, `商品ID ${id} の結果の行の数（商品単位の1行）`).toBe(1);
    const opt = (code: string) => mine[0]?.選択肢.find((o) => o.商品コード === code)?.表示 ?? "";
    const nm = opt(X("SRCH_NM")).split("/"); const sp = opt(X("SRCH_SP")).split("/");
    expect.soft(nm[0], "SRCH-BLK-NM の選択肢の商品コード").toBe(X("SRCH_NM"));
    expect.soft(nm[1], "SRCH-BLK-NM の選択肢の言語").toBe("日本語");
    expect.soft(nm[2] ?? "", "SRCH-BLK-NM の選択肢の状態（NM）").toMatch(/NM|ニアミント/);
    expect.soft(数(nm[3] ?? ""), "SRCH-BLK-NM の選択肢の基準価格").toBe(1000);
    expect.soft(nm[4], "SRCH-BLK-NM の選択肢の高額商品コード").toBe(X("高額BLK"));
    expect.soft(sp[0], "SRCH-BLK-SP の選択肢の商品コード").toBe(X("SRCH_SP"));
    expect.soft(sp[1], "SRCH-BLK-SP の選択肢の言語").toBe("英語");
    expect.soft(sp[2] ?? "", "SRCH-BLK-SP の選択肢の状態（SP）").toMatch(/SP|スライトリープレイド/);
    expect.soft(数(sp[3] ?? ""), "SRCH-BLK-SP の選択肢の基準価格").toBe(800);
    expect.soft(sp.length, "SRCH-BLK-SP の選択肢の項目の数（高額商品コードの設定が無い）").toBe(4);
  });
  note(`${商品IDの読み替え}。選択肢は「商品コード/言語/状態/\\基準価格/高額商品コード」の形で出るので、「/」で区切って比べた`);
});

// 038: 選んで決定すると最下部に1行
caseTest("IT-M06-03-038", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 検索対象の商品ID();
  let 前の行数 = 0;
  let row: import("@playwright/test").Locator | undefined;
  await step(1, async () => { await 商品追加のモーダルを開く(d, 注文ID(notes, "共有BASE")); 前の行数 = (await d.実在庫の編集行()).length; });
  await step(2, async () => { await d.モーダルで検索する(id); });
  await step(3, async () => { row = await d.モーダルで規格を選ぶ(X("SRCH_SP")); });
  await step(4, async () => { await d.決定して足す(row!); });
  await expected(async () => {
    await expect.soft(d.商品検索モーダル(), "商品検索モーダル（閉じている）").toBeHidden();
    const rows = await d.実在庫の編集行();
    expect.soft(rows.length, "実在庫情報（増減数編集モード）の行の数（1行増える）").toBe(前の行数 + 1);
    expect.soft(rows[rows.length - 1]?.[1], "最下部の行の商品コード").toBe(X("SRCH_SP"));
  });
  note(商品IDの読み替え);
});

// 039: 追加品確定を押さなければDBに入らない
caseTest("IT-M06-03-039", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  await step(1, async () => { await 商品追加のモーダルを開く(d, id); });
  await step(2, async () => { await d.モーダルで検索する(X("SRCH_SP")); await d.決定して足す(await d.モーダルで規格を選ぶ(X("SRCH_SP"))); });
  await step(3, async () => { 実在庫の現状(id, X("SRCH_SP")); });
  await expected(async () => {
    expect.soft(await d.足された行().count(), "画面には SRCH-BLK-SP の行が足されている（決定の操作が行われた）").toBe(1);
    expect.soft(実在庫の現状(id, X("SRCH_SP")), "SRCH-BLK-SP の実在庫情報（DBに無い）").toBeNull();
    expect.soft(実在庫履歴(id, X("SRCH_SP")).length, "SRCH-BLK-SP の実在庫の在庫履歴の件数").toBe(0);
  });
  note("商品コードで検索してから、商品コードの規格を選んで決定した");
});

// 040: 追加品確定で実在庫・履歴が増え、買取明細は増えない
caseTest("IT-M06-03-040", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "040");
  const code = X("SRCH_SP");
  await step(1, async () => { await 商品追加のモーダルを開く(d, id); });
  await step(2, async () => { await d.モーダルで検索する(code); await d.決定して足す(await d.モーダルで規格を選ぶ(code)); });
  await step(3, async () => { await d.足された行の増減数を入れる(code, 1); });
  await step(4, async () => { await d.追加品確定を押す(); });
  await step(5, async () => { 実在庫の現状(id, code); });
  await expected(async () => {
    const s = 実在庫の現状(id, code);
    expect.soft(s?.数量, "SRCH-BLK-SP の実在庫の数量").toBe(1);
    expect.soft(s?.小計, "SRCH-BLK-SP の実在庫の買取金額（小計）").toBe(0);
    expect.soft(実在庫履歴(id, code), "SRCH-BLK-SP の在庫履歴（変更前数量なし・変更後数量1の1件）").toEqual([{ 変更前: null, 変更後: 1 }]);
    expect.soft(買取明細の件数(id, code), "SRCH-BLK-SP の買取明細の件数（追加されない）").toBe(0);
  });
  note("買取金額は、数量1の実在庫の小計で確かめた");
});

// ---------------------------------------------------------------- 個別入力商品の実在庫登録

/** 個別入力商品の実在庫情報登録で、商品コードを検索して選び、決定する（送信を見張って返す） */
async function 登録して送る(d: OtcDetail, code: string, 細工?: (row: import("@playwright/test").Locator) => Promise<void>): Promise<{ 本文: string; 状態: number }> {
  await d.モーダルで検索する(code);
  const row = await d.モーダルで規格を選ぶ(code);
  if (細工) await 細工(row);
  const w = d.送信を見張る(実在庫情報登録);
  await d.決定して送る(row);
  return w();
}

// 041: 一部の個別入力商品を登録
caseTest("IT-M06-03-041", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "041");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.実在庫登録を押す("個別商品A"); });
  await step(3, async () => { await 登録して送る(d, X("SRCH_NM")); });
  await step(4, async () => { 個別入力商品の詳細(id); });
  await expected(async () => {
    const p = 個別入力商品の詳細(id);
    const a = p.find((x) => x.名前 === "個別商品A"); const b = p.find((x) => x.名前 === "個別商品B");
    expect.soft(a?.商品コード, "個別商品A の商品コード（実在庫登録済み）").toBe(X("SRCH_NM"));
    const s = 実在庫の現状(id, X("SRCH_NM"));
    expect.soft(s?.数量, "実在庫情報 SRCH-BLK-NM の数量").toBe(2);
    expect.soft(s?.小計, "実在庫情報 SRCH-BLK-NM の小計").toBe(2000);
    expect.soft(s && s.数量 > 0 ? s.小計 / s.数量 : null, "実在庫情報 SRCH-BLK-NM の買取金額（小計÷数量）").toBe(1000);
    expect.soft(b?.商品コード ?? null, "個別商品B（未登録のまま）").toBeNull();
    expect.soft(買取の現状(id).ステータス, "買取のステータス（未登録在庫ありのまま）").toBe("未登録在庫あり");
  });
  note("実在庫情報には販売金額・部門の項目が無い（買取の実在庫の作り）ので、引き継がれないことは、実在庫情報が数量・小計（買取金額×数量）だけで作られたことで確かめた");
});

// 042: 最後の個別入力商品を登録すると入庫待ち
caseTest("IT-M06-03-042", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "042");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.実在庫登録を押す("個別商品C"); });
  await step(3, async () => { await 登録して送る(d, X("SRCH_NM")); });
  await step(4, async () => { 個別入力商品の詳細(id); });
  await expected(async () => {
    expect.soft(個別入力商品の詳細(id).find((x) => x.名前 === "個別商品C")?.商品コード, "個別商品C の商品コード（実在庫登録済み）").toBe(X("SRCH_NM"));
    expect.soft(買取の現状(id).ステータス, "買取のステータス").toBe("入庫待ち");
  });
});

/** 個別入力商品が更新されない・実在庫が増えないことの確かめ */
async function 個別が変わらない(id: string, 名前: string, d: OtcDetail, page: Page, 遷移も: boolean): Promise<void> {
  expect.soft(個別入力商品の詳細(id).find((x) => x.名前 === 名前)?.商品コード ?? null, `${名前} の商品コード（未登録のまま）`).toBeNull();
  expect.soft(実在庫の現状(id, X("SRCH_NM")), "実在庫情報 SRCH-BLK-NM（追加されない）").toBeNull();
  if (遷移も) {
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
    await expect.soft(d.枠("操作履歴"), "買取詳細画面").toBeVisible();
  }
}

// 043: 入庫済みでは登録できない
caseTest("IT-M06-03-043", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有INVALID");
  const 名前 = rc("M0603-INVALID-個別商品");
  let 送信: { 状態: number } | undefined;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.実在庫登録を押す(名前); });
  await step(3, async () => { 送信 = await 登録して送る(d, X("SRCH_NM")); });
  await step(4, async () => { 個別入力商品の詳細(id); });
  await expected(async () => { expect.soft(送信?.状態 ?? 0, "実在庫情報登録の送信が送られ、応答があった（応答の状態）").toBeGreaterThan(0);
    await 個別が変わらない(id, 名前, d, page, false); });
});

// 044: 他店舗の担当者は登録できない
caseTest("IT-M06-03-044", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_OSAKA);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有UNREG-ONE");
  let 送信: { 状態: number } | undefined;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.実在庫登録を押す("個別商品C"); });
  await step(3, async () => { 送信 = await 登録して送る(d, X("SRCH_NM")); });
  await step(4, async () => { 個別入力商品の詳細(id); });
  await expected(async () => { expect.soft(送信?.状態 ?? 0, "実在庫情報登録の送信が送られ、応答があった（応答の状態）").toBeGreaterThan(0);
    await 個別が変わらない(id, "個別商品C", d, page, false); });
  note("大阪店舗は買取店舗B（M06-01 の試験店舗）、東京店舗は買取店舗A に読み替えた");
});

// 045: 存在しない商品規格ID
caseTest("IT-M06-03-045", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有UNREG-ONE");
  let row: import("@playwright/test").Locator | undefined;
  let 送信: { 本文: string; 状態: number } | undefined;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.実在庫登録を押す("個別商品C"); });
  await step(3, async () => {
    await d.モーダルで検索する(X("SRCH_NM"));
    row = await d.モーダルで規格を選ぶ(X("SRCH_NM"));
    await d.選んだ規格の値を変える(row, "999999");
  });
  await step(4, async () => { const w = d.送信を見張る(実在庫情報登録); await d.決定して送る(row!); 送信 = await w(); });
  await step(5, async () => { 個別入力商品の詳細(id); });
  await expected(async () => {
    expect.soft(送られた値(送信?.本文 ?? "", "商品規格ID"), "送られた商品規格ID").toBe("999999");
    expect.soft(送信?.状態 ?? 0, "実在庫情報登録の送信が送られ、応答があった（応答の状態）").toBeGreaterThan(0);
      await 個別が変わらない(id, "個別商品C", d, page, true);
  });
  note("開発者ツールでの値の変更は、画面のスクリプトで、選んだ規格の選択肢の値を書き換えて行った。手順3では、まず商品コード SRCH-BLK-NM を検索して選んだ");
});

// 046: 登録後の遷移
caseTest("IT-M06-03-046", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "046");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.実在庫登録を押す("個別商品C"); });
  await step(3, async () => { await 登録して送る(d, X("SRCH_NM")); });
  await expected(async () => {
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
    await expect.soft(d.枠("操作履歴"), "買取詳細画面").toBeVisible();
  });
});

/** 047・048: なりすまし対策トークンを細工して送る */
function トークンのケース(値: string | null) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    await loginAdmin(page, M0603_STOCK);
    const d = new OtcDetail(page);
    const id = 注文ID(notes, "共有UNREG-ONE");
    let row: import("@playwright/test").Locator | undefined;
    let 送信: { 本文: string; 状態: number } | undefined;
    await step(1, async () => { await d.open(id); });
    await step(2, async () => { await d.実在庫登録を押す("個別商品C"); });
    await step(3, async () => { await d.モーダルで検索する(X("SRCH_NM")); row = await d.モーダルで規格を選ぶ(X("SRCH_NM")); });
    await step(4, async () => { await d.実在庫登録のトークンを細工する(値); });
    await step(5, async () => { const w = d.送信を見張る(実在庫情報登録); await d.決定して送る(row!); 送信 = await w(); });
    await step(6, async () => { 個別入力商品の詳細(id); });
    await expected(async () => {
      expect.soft(送られた値(送信?.本文 ?? "", "トークン"), 値 === null ? "送られた内容のなりすまし対策トークン（無い）" : "送られたなりすまし対策トークンの値").toBe(値);
      expect.soft(送信?.状態 ?? 0, "実在庫情報登録の送信が送られ、応答があった（応答の状態）").toBeGreaterThan(0);
      await 個別が変わらない(id, "個別商品C", d, page, true);
    });
    note("トークンの入力要素は、決定を押した瞬間に画面のスクリプトが送信のフォームに足して送る。開発者ツールでの操作は、フォームを送る直前にその入力要素を"
      + (値 === null ? "消す" : `「${値}」に変える`) + "よう、画面のスクリプトで送信の関数を差し替えて行った（送られた内容で確かめた）");
  };
}
caseTest("IT-M06-03-047", トークンのケース(null));
caseTest("IT-M06-03-048", トークンのケース("invalid-token"));

// 049: 登録状態の混在の表示
caseTest("IT-M06-03-049", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  await step(1, async () => { await d.open(注文ID(notes, "共有INDIV-MIX")); });
  await step(2, async () => { await d.表の行("買取情報", "実在庫情報登録"); });
  await expected(async () => {
    await expect.soft(d.実在庫登録ボタン("個別商品D"), "未登録の個別商品D の実在庫情報登録ボタン").toHaveCount(1);
    await expect.soft(d.実在庫登録ボタン("個別商品E"), "登録済みの個別商品E の実在庫情報登録ボタン（無い）").toHaveCount(0);
    const e = (await d.個別入力商品の行("個別商品E").first().locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    expect.soft(e[1], "個別商品E の商品コード").toBe(X("SRCH_NM"));
    expect.soft(e[7], "個別商品E の実在庫情報登録の欄").toBe("実在庫登録済み");
  });
});

// ---------------------------------------------------------------- 権限なし担当者

// 053: 経理払い出し済
caseTest("IT-M06-03-053", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_NONE);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有ACCOUNTING-NONE");
  let 送信: { 状態: number } | undefined;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => {
    const w = d.送信を見張る(送信先.経理払い出し済);
    await d.経理払い出し済を押す();
    await d.確認ダイアログに応える(true);
    送信 = await w();
  });
  await step(3, async () => { 買取の現状(id); });
  await expected(async () => {
    送られた(送信, "経理払い出し済");
    expect.soft(買取の現状(id).ステータス, "ステータス（経理払い出し待ちのまま）").toBe("経理払い出し待ち");
    expect.soft(page.url(), "買取詳細画面のアドレス").toMatch(d.詳細のURL(id));
  });
  note("経理払い出し済のボタンは確認のダイアログを出すので、手順2でダイアログを「OK」で閉じた");
});

const 共有BASEの商品 = () => [A(), B(), C(), D()];

// 062: 入庫済みにする
caseTest("IT-M06-03-062", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_NONE);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有BASE");
  const 前 = { ステータス: 買取の現状(id).ステータス, 店舗: 共有BASEの商品().map(店舗在庫と履歴の件数) };
  let 状態 = 0;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { 状態 = await d.入庫済みにするを押して応答を待つ(); });
  await step(3, async () => { 買取の現状(id); });
  await expected(async () => {
    expect.soft(状態, "入庫済みにするの送信の応答があった（応答の状態）").toBeGreaterThan(0);
    expect.soft({ ステータス: 買取の現状(id).ステータス, 店舗: 共有BASEの商品().map(店舗在庫と履歴の件数) }, "ステータス、ECCUBE在庫と在庫履歴の件数（更新前のまま）").toEqual(前);
  });
});

// ---------------------------------------------------------------- 入庫済みにする

// 059: 店舗在庫・総在庫・総原価・原価単価
caseTest("IT-M06-03-059", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "059");
  const 店 = notes.get(L_A);
  const 品 = [
    { 名: "BASE-A-NM-059", code: rc("BASE-A-NM-059"), 数量: 5, 後在庫: 15, 後総原価: 15000, 後単価: 1000 },
    { 名: "BASE-B-NM-059", code: rc("BASE-B-NM-059"), 数量: 3, 後在庫: 23, 後総原価: 42400, 後単価: 1843 },
    { 名: "BASE-C-SP-059", code: rc("BASE-C-SP-059"), 数量: 1, 後在庫: 1, 後総原価: 500, 後単価: 500 },
  ];
  const 前の総在庫 = 品.map((p) => 総在庫(p.code));
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.入庫済みにするを押して応答を待つ(); });
  await step(3, async () => { 品.map((p) => 店舗在庫を調べる(p.code, 店)); });
  await expected(async () => {
    品.forEach((p, i) => {
      const s = 店舗在庫を調べる(p.code, 店);
      expect.soft(s?.在庫, `${p.名} の買取店舗A の ECCUBE在庫（実在庫の数量 ${p.数量} を加算）`).toBe(p.後在庫);
      expect.soft(総在庫(p.code), `${p.名} の総在庫（全店舗・全在庫区分の合計。入庫前 ${前の総在庫[i]} に ${p.数量} を加算）`).toBe(前の総在庫[i] + p.数量);
      expect.soft(s?.総原価, `${p.名} の総原価（入庫前の総原価に、買取単価×数量を加算）`).toBe(p.後総原価);
      expect.soft(s && s.在庫 > 0 ? Math.round(s.総原価 / s.在庫) : null, `${p.名} の原価単価（総原価÷在庫を四捨五入）`).toBe(p.後単価);
    });
  });
  note("東京店舗は買取店舗A。期待の値は、シードの店舗在庫（10・20・0、総原価 10,000・40,000・0）に、実在庫（数量5・3・1、買取単価1,000・800・500）を仕入単価として足した値: 在庫15・23・1、総原価15,000・42,400・500、原価単価1,000・1,843・500");
  note("総在庫は、その規格の全店舗・全在庫区分の在庫の合計とし、入庫の前の合計に実在庫の数量を足した値と比べた。原価単価はDBに持たず、総原価÷在庫（四捨五入）で計算する作りなので、その計算で確かめた");
});

// 060: 入庫の在庫履歴（仕入単価・登録元）
caseTest("IT-M06-03-060", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "060");
  const 店 = notes.get(L_A);
  const 番号 = 査定番号(notes, "060");
  const 品 = [{ 名: "BASE-A-NM-060", code: rc("BASE-A-NM-060"), 単価: 1000 }, { 名: "BASE-B-NM-060", code: rc("BASE-B-NM-060"), 単価: 800 }, { 名: "BASE-C-SP-060", code: rc("BASE-C-SP-060"), 単価: 500 }];
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.入庫済みにするを押して応答を待つ(); });
  await step(3, async () => { 品.map((p) => 店舗在庫を調べる(p.code, 店)); });
  await expected(async () => {
    for (const p of 品) {
      const s = 店舗在庫を調べる(p.code, 店);
      const h = s ? 店舗在庫の履歴(s.ID) : [];
      expect.soft(h.length, `${p.名} の在庫履歴の件数（入庫の1件）`).toBe(1);
      const x = h[0];
      const 仕入単価 = x && x.増減数 ? ((x.変更後総原価 ?? 0) - (x.変更前総原価 ?? 0)) / x.増減数 : null;
      expect.soft(仕入単価, `${p.名} の在庫履歴の仕入単価（総原価の増えた分÷在庫増減数）`).toBe(p.単価);
      expect.soft(x?.登録元 ?? "", `${p.名} の在庫履歴の登録元機能`).toBe("店頭買取");
      expect.soft(x?.登録元ID ?? "", `${p.名} の在庫履歴の登録元ID`).toBe(番号);
    }
  });
  note("在庫履歴には仕入単価の列が無く、変更前・変更後の総原価と在庫増減数を持つので、仕入単価は（変更後総原価−変更前総原価）÷在庫増減数で確かめた");
});

// 074: 在庫変動区分・在庫変動理由
caseTest("IT-M06-03-074", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "074");
  const 店 = notes.get(L_A);
  const code = rc("M0603-074-A-NM");
  const 番号 = 査定番号(notes, "074");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.入庫済みにするを押して応答を待つ(); });
  await step(3, async () => { 店舗在庫を調べる(code, 店); });
  await expected(async () => {
    const s = 店舗在庫を調べる(code, 店);
    const h = s ? 店舗在庫の履歴(s.ID) : [];
    expect.soft(h.length, "M0603-074-A-NM の店舗在庫に追加された在庫履歴の件数").toBe(1);
    expect.soft(h[0]?.在庫変動区分 ?? "", "在庫変動区分（「区分/詳細」の詳細が店頭買取）").toMatch(/(^|\/)店頭買取$/);
    expect.soft(h[0]?.在庫変動理由 ?? "", "在庫変動理由").toBe(`店頭買取による入庫 査定ID：${番号}`);
  });
  note("在庫変動区分は「区分名/詳細の区分名」の形で読み、詳細の区分名が「店頭買取」であることを確かめた");
});

// 061: 未登録の個別入力商品があると入庫しない
caseTest("IT-M06-03-061", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "共有INBOUND-BLOCKED");
  const 店 = notes.get(L_A);
  const 読む = () => { const s = 店舗在庫を調べる(A(), 店); return { ステータス: 買取の現状(id).ステータス, 在庫: s?.在庫 ?? null, 履歴件数: s ? 店舗在庫の履歴(s.ID).length : null }; };
  const 前 = 読む();
  let 状態 = 0;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { 状態 = await d.入庫済みにするを押して応答を待つ(); });
  await step(3, async () => { 読む(); });
  await expected(async () => {
    expect.soft(状態, "入庫済みにするの送信の応答があった（応答の状態）").toBeGreaterThan(0);
    expect.soft(前, "比べるための入庫前の状態（未登録在庫あり・買取店舗A の BASE-A-NM の ECCUBE在庫10・在庫履歴0件）").toEqual({ ステータス: "未登録在庫あり", 在庫: 10, 履歴件数: 0 });
    expect.soft(読む(), "買取ステータス、BASE-A-NM の ECCUBE在庫と在庫履歴の件数（入庫前のまま）").toEqual(前);
  });
  note("東京店舗は買取店舗A。ECCUBE在庫と在庫履歴は、買取店舗A の BASE-A-NM の EC-CUBE 在庫の行で数えた");
});

// ---------------------------------------------------------------- 商品検索の結果（080）

caseTest("IT-M06-03-080", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_STOCK);
  const d = new OtcDetail(page);
  const pid = notes.get("〔商品ID-M0603-080〕");
  let rows: Awaited<ReturnType<OtcDetail["モーダルの結果を読む"]>> = [];
  await step(1, async () => { await d.open(注文ID(notes, "080")); });
  await step(2, async () => { await d.編集を押す(); await d.商品追加でモーダルを開く(); });
  await step(3, async () => { await d.モーダルで検索する(pid); });
  await step(4, async () => { rows = await d.モーダルの結果を読む(); });
  await expected(async () => {
    const mine = rows.filter((r) => r.商品ID === pid);
    expect.soft(mine.length, `商品ID ${pid} の行の数`).toBe(1);
    expect.soft(mine[0]?.商品名, "その行の商品名").toBe(rc("M0603-080-検索商品"));
  });
});

// ---------------------------------------------------------------- 編集可能店舗（085・086）

caseTest("IT-M06-03-085", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_DP085);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "085");
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.フリーコメントを入れる("複数店舗更新"); });
  await step(3, async () => { await d.保存を押す(); });
  await step(4, async () => { 買取の現状(id); });
  await expected(async () => { expect.soft(買取の現状(id).コメント, "フリーコメント（更新前コメントから）").toBe("複数店舗更新"); });
  note("東京店舗・大阪店舗は買取店舗A・B に読み替えた（買取は買取店舗B）");
});

caseTest("IT-M06-03-086", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_DP086);
  const d = new OtcDetail(page);
  const id = 注文ID(notes, "086");
  let 送信: { 状態: number } | undefined;
  await step(1, async () => { await d.open(id); });
  await step(2, async () => { await d.編集を押す(); });
  await step(3, async () => { await d.増減数を入れる(A(), 1); });
  await step(4, async () => { const w = d.送信を見張る(詳細の更新); await d.追加品確定を押す(); 送信 = await w(); });
  await step(5, async () => { 実在庫の現状(id, A()); });
  await expected(async () => {
    送られた(送信, "追加品確定");
    expect.soft(実在庫の現状(id, A())?.数量, "BASE-A-NM の数量（5のまま）").toBe(5);
    expect.soft(実在庫履歴(id, A()).length, "BASE-A-NM の在庫履歴の件数（0件のまま）").toBe(0);
    const e = (await d.通知の文()).エラー;
    expect.soft(e.length, `更新できない旨のエラーメッセージ（${e.join(" / ") || "なし"}）`).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------- 会員の買取履歴との連動（082・083）

/** ブラウザB（管理画面）で、買取一覧で買取番号を検索して買取詳細を開く */
async function 一覧から詳細を開く(pageB: Page, 番号: string): Promise<void> {
  const list = new OtcListPage(pageB);
  await list.open();
  await list.日時を空にする();
  await list.買取店舗を選ぶ("");
  await list.査定IDを入れる(番号);
  await list.検索する();
  await list.詳細を開く(番号);
}

/** 開いている買取詳細で「経理払い出し済」を押し、確認のポップアップで確定する */
async function 経理払い出し済にする(pageB: Page): Promise<void> {
  const d = new OtcDetail(pageB);
  await d.経理払い出し済を押す();
  await d.確認ダイアログに応える(true);
}

const 今日 = () => {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("-").map(Number);
  return { y, m, d };
};

caseTest("IT-M06-03-082", async ({ page, browser, notes, step, expected }) => {
  const no = notes.get("〔買取番号-M0603-QG001〕");
  const email = `${rc("qg0603-001")}@example.test`;
  const contextB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(contextB);
    const pageB = await contextB.newPage();
    pageB.setDefaultTimeout(60_000);
    const a = new PurchaseHistoryPage(page);
    let r2 = { 処理状態: "", 買取金額合計: "" }; let r5 = { 処理状態: "", 買取金額合計: "" };
    await step(1, async () => { await frontLogin(page, { メール: email, パスワード: QG_MEMBER_PASSWORD }); await a.openList(); });
    await step(2, async () => { r2 = await a.一覧の行(no); });
    await step(3, async () => { await loginAdmin(pageB, QG0603_ACC); await 一覧から詳細を開く(pageB, no); });
    await step(4, async () => { await 経理払い出し済にする(pageB); });
    await step(5, async () => { await a.openList(); r5 = await a.一覧の行(no); });
    await expected(async () => {
      expect.soft(r2.処理状態, "手順2の処理状態").toContain("振込待ち");
      expect.soft(r5.処理状態, "手順5の処理状態").toContain("買取完了");
      expect.soft(r2.買取金額合計.replace(/[^\d]/g, ""), "手順2の買取金額合計（数字だけ）").toBe("45678");
      expect.soft(r5.買取金額合計.replace(/[^\d]/g, ""), "手順5の買取金額合計（数字だけ）").toBe("45678");
    });
    note("買取金額合計は桁区切りと通貨記号を問わないので、数字だけを取り出して比べた。会員のメールアドレスの前半に実行の印を付けた");
  } finally {
    await contextB.close();
  }
});

caseTest("IT-M06-03-083", async ({ page, browser, notes, step, expected }) => {
  const no = notes.get("〔買取番号-M0603-QG002〕");
  const email = `${rc("qg0603-002")}@example.test`;
  const contextB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(contextB);
    const pageB = await contextB.newPage();
    pageB.setDefaultTimeout(60_000);
    const a = new PurchaseHistoryPage(page);
    let s2 = ""; let s5 = ""; let d5 = "";
    await step(1, async () => { await frontLogin(page, { メール: email, パスワード: QG_MEMBER_PASSWORD }); await a.openList(); });
    await step(2, async () => { await a.openDetail(no); s2 = await a.detailValue("処理状態"); });
    await step(3, async () => { await loginAdmin(pageB, QG0603_ACC); await 一覧から詳細を開く(pageB, no); });
    let 押した日 = 今日();
    await step(4, async () => { 押した日 = 今日(); await 経理払い出し済にする(pageB); });
    await step(5, async () => { await a.openList(); await a.openDetail(no); s5 = await a.detailValue("処理状態"); d5 = await a.detailValue("成立日"); });
    await expected(async () => {
      expect.soft(s2, "手順2の処理状態").toContain("振込待ち");
      expect.soft(s5, "手順5の処理状態").toContain("買取完了");
      const nums = (d5.match(/\d+/g) ?? []).map(Number);
      expect.soft(nums.slice(0, 3), `成立日（手順4で押した日 ${押した日.y}/${押した日.m}/${押した日.d}。表示は「${d5}」）`).toEqual([押した日.y, 押した日.m, 押した日.d]);
    });
    note("成立日は書式を問わないので、表示の先頭の年・月・日の数で比べた");
  } finally {
    await contextB.close();
  }
});

// ---------------------------------------------------------------- 連携（094・095・096）

/** 買取一覧で査定番号を検索して買取詳細を開く */
async function 査定番号で詳細を開く(page: Page, 番号: string): Promise<void> {
  const list = new OtcListPage(page);
  await list.open();
  await list.日時を空にする();
  await list.買取店舗を選ぶ("");
  await list.査定IDを入れる(番号);
  await list.検索する();
  await list.詳細を開く(番号);
}

/** 在庫履歴検索一覧で、検索条件をクリアし、店舗とキーワードで検索する */
async function 在庫履歴を検索する(h: StockHistoryPage, 店名: string, code: string): Promise<void> {
  await 表示名で選ぶ(在庫履歴の店舗の欄(h.page), [店名], "在庫履歴検索一覧の店舗");
  await h.fillKeyword(code);
  await h.submit();
}

caseTest("IT-M06-03-094", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_RF);
  const h = new StockHistoryPage(page);
  const d = new OtcDetail(page);
  const code = RFの商品コード("001");
  const 番号 = notes.get("〔査定番号-M0603-001〕");
  const 店名 = STORE_A.店名;
  const 店頭買取の行 = (rows: Record<string, string>[]) => rows.filter((r) => (r["登録元"] ?? "").includes("店頭買取"));
  let 前: Record<string, string>[] = []; let 後: Record<string, string>[] = [];
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.clearConditions(); });
  await step(3, async () => { await 在庫履歴を検索する(h, 店名, code); });
  await step(4, async () => { 前 = 店頭買取の行(await h.rows()); });
  await step(5, async () => { await 査定番号で詳細を開く(page, 番号); });
  await step(6, async () => { await d.入庫済みにするを押して応答を待つ(); });
  await step(7, async () => { await h.open(); });
  await step(8, async () => { await h.clearConditions(); });
  await step(9, async () => { await 在庫履歴を検索する(h, 店名, code); });
  await step(10, async () => { 後 = 店頭買取の行(await h.rows()); });
  await expected(async () => {
    expect.soft(前.length, "手順4: 登録元が店頭買取の行（表示されない）").toBe(0);
    expect.soft(後.length, "手順10: 登録元が店頭買取の行の数").toBe(1);
    const r = 後[0] ?? {};
    expect.soft(r["店舗"], "店舗").toBe(店名);
    expect.soft(r["在庫場所"], "在庫区分（在庫場所）").toBe("EC-CUBE");
    expect.soft(numberOf(r["変更前在庫"] ?? ""), "変更前在庫").toBe(10);
    expect.soft(numberOf(r["変更後在庫"] ?? ""), "変更後在庫").toBe(15);
    expect.soft(numberOf(r["在庫変動数"] ?? ""), "在庫増減数（在庫変動数）").toBe(5);
    expect.soft(numberOf(r["仕入単価"] ?? ""), "仕入単価").toBe(1000);
    expect.soft(numberOf(r["変更前総原価"] ?? ""), "変更前総原価").toBe(10000);
    expect.soft(numberOf(r["変更後総原価"] ?? ""), "変更後総原価").toBe(15000);
  });
  note(`東京店舗は買取店舗A（${店名}）。画面の「在庫場所」「在庫変動数」を、正本の「在庫区分」「在庫増減数」とした。金額・数は桁区切りと通貨記号を除いて比べた`);
});

caseTest("IT-M06-03-095", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_RF);
  const d = new OtcDetail(page);
  const code = RFの商品コード("002");
  const 番号 = notes.get("〔査定番号-M0603-002〕");
  const 店名 = STORE_A.店名;
  const 行 = async () => (await 在庫検索の行(page)).filter((r) => r.商品コード === code && r.店舗 === 店名 && r.在庫区分 === "EC-CUBE");
  let 前: Awaited<ReturnType<typeof 行>> = []; let 後: Awaited<ReturnType<typeof 行>> = [];
  await step(1, async () => { await 在庫検索一覧を開く(page); });
  await step(2, async () => { await 在庫検索をする(page, 店名, code); });
  await step(3, async () => { 前 = await 行(); });
  await step(4, async () => { await 査定番号で詳細を開く(page, 番号); });
  await step(5, async () => { await d.入庫済みにするを押して応答を待つ(); });
  await step(6, async () => { await 在庫検索一覧を開く(page); });
  await step(7, async () => { await 在庫検索をする(page, 店名, code); });
  await step(8, async () => { 後 = await 行(); });
  await expected(async () => {
    const 値 = (r: (typeof 前)[number] | undefined) => r ? [numberOf(r.在庫), numberOf(r.原価単価), numberOf(r.総原価)] : null;
    expect.soft(前.length, "手順3: 買取店舗A・EC-CUBE の行の数").toBe(1);
    expect.soft(値(前[0]), "手順3: 在庫・原価単価・総原価").toEqual([10, 1000, 10000]);
    expect.soft(後.length, "手順8: 買取店舗A・EC-CUBE の行の数").toBe(1);
    expect.soft(値(後[0]), "手順8: 在庫・原価単価・総原価").toEqual([15, 1000, 15000]);
  });
  note(`東京店舗は買取店舗A（${店名}）。在庫検索一覧は、在庫の下に総原価、買取価格の下に原価単価を出すので、それを読んだ。金額は桁区切りを除いて比べた`);
});

caseTest("IT-M06-03-096", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0603_RF);
  const h = new HistoryPage(page);
  const d = new OtcDetail(page);
  const code = RFの商品コード("003");
  const 番号 = notes.get("〔査定番号-M0603-003〕");
  const 対象 = (rows: Awaited<ReturnType<HistoryPage["行を読む"]>>) => rows.filter((r) => r.査定番号 === 番号 && r.商品コード === code);
  let 前: Awaited<ReturnType<HistoryPage["行を読む"]>> = []; let 後: typeof 前 = [];
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.商品コードを入れる(code); await h.検索する(); });
  await step(3, async () => { 前 = (await h.行を読む()).filter((r) => r.入庫数 === "7" && r.増減数 === "2"); });
  await step(4, async () => { await 査定番号で詳細を開く(page, 番号); });
  await step(5, async () => { await d.編集を押す(); });
  await step(6, async () => { await d.増減数を入れる(code, 2); });
  await step(7, async () => { await d.追加品確定を押す(); });
  await step(8, async () => { await h.open(); });
  await step(9, async () => { await h.商品コードを入れる(code); await h.検索する(); });
  await step(10, async () => { 後 = 対象(await h.行を読む()); });
  await expected(async () => {
    expect.soft(前.length, "手順3: 入庫数7・増減数2の行（表示されない）").toBe(0);
    expect.soft(後.map((r) => [r.入庫数, r.増減数]), `手順10: 査定番号 ${番号}・商品コード ${code} の行の入庫数と増減数`).toContainEqual(["7", "2"]);
  });
});
