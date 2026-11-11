/**
 * M05-01 受注情報検索 一覧(検索入力)。正本: cases/M05-01_test_cases.tsv
 *
 * 2026-11-10（依頼者の承認「印つきデータは何でも」）: 画面だけでは作れなかった受注の組を、DB への書き込みを使うシードで作って実装したケース。
 *   受注は、画面で1件作った受注の行をDBで写して作る（seeds/m05-01-db.ts）。決め打ちの注文番号（M0501-…）は11文字までの列に入らないので、
 *   実行ごとの接頭辞つきの値に読み替える（注文番号の読み替え）。手順の注文番号の入力も同じ値に読み替える。
 *   手順そのものがDBへの書き込みのケース（063・160・162・164）は、印つきのデータだけに db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） で書く。
 * 実装しないケース（DB を使っても作れない・共有の設定を壊す）は、記録 review/M05-01_progress_2026-11-10.md の後続を参照。
 *
 * 決め打ちの識別の値（検索パターン名・支払方法名・語）は rc() で実行ごとに印を付けて読む（依頼者決定 2026-10-28）。
 */
import type { Dialog, Download, Page } from "@playwright/test";
import { test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import {
  会員の購入実績, 検索パターンの件数, 検索パターンを消す, 注文番号を書き換える, 受注ID, 受注の記録, 受注の削除日時,
} from "../../db/m05_01_order_write";
import { OrderSearchPage } from "../../pages/admin/m05_01_order_search_k";
import { M0501_ADMIN, 店舗Aの店名, 店舗Bの店名, 注文番号の読み替え } from "../../seeds/m05-01";
import "../../seeds/m05-01-db";
import "../../seeds/m05-01-x"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type Ctx = Parameters<Parameters<typeof caseTest>[1]>[0];
type S = () => Promise<void>;

async function signIn(page: Page): Promise<OrderSearchPage> {
  await loginAdmin(page, M0501_ADMIN);
  return new OrderSearchPage(page);
}

/** 詳細検索条件を表示する（表示されていれば何もしない）。押したときは注記に残す */
async function showDetail(p: OrderSearchPage): Promise<void> {
  if (await p.showDetail()) note("詳細検索条件が閉じていたので、開閉ボタンを押して表示した");
}

/** 正本の決め打ちの値を、シードが作った値に読み替える（同じ値の注記は1回だけ） */
function 読み替える(): (正本: string) => string {
  const seen = new Set<string>();
  return (正本) => {
    const v = 注文番号の読み替え(正本);
    if (!seen.has(正本)) { seen.add(正本); note(`「${正本}」は、シードが作った値「${v}」に読み替えた（注文番号は11文字までなので、実行ごとの接頭辞つきの値にしている）`); }
    return v;
  };
}

type H = { p: OrderSearchPage; page: Page; 号: (正本: string) => string; notes: Ctx["notes"] };
const 開く = (h: H): S => async () => { await h.p.open(); };
const 詳細を開く = (h: H): S => async () => { await showDetail(h.p); };
const 番号を入れる = (h: H, 正本: string): S => async () => { await h.p.orderNumber.fill(h.号(正本)); };
const 開いて番号を入れる = (h: H, 正本: string): S => async () => { await h.p.open(); await h.p.orderNumber.fill(h.号(正本)); };
const 検索する = (h: H): S => async () => { await h.p.clickSearch(); };
const 店舗を選ぶ = (h: H, labels: string[]): S => async () => { await h.p.selectTenants(labels); };

/** 検索条件を入れて検索し、行が出る・出ないを確かめるケース（手順の数は正本の手順の数と同じにする） */
function 検索ケース(手順数: number, build: (h: H) => { 手順: S[]; 見える: string[]; 見えない: string[] }) {
  return async ({ page, notes, step, expected }: Ctx) => {
    const p = await signIn(page);
    const h: H = { p, page, 号: 読み替える(), notes };
    const c = build(h);
    if (c.手順.length !== 手順数) throw new Error(`手順の数が正本と違う（作り方 ${c.手順.length}・正本 ${手順数}）`);
    for (const [i, s] of c.手順.entries()) await step(i + 1, async () => { await s(); });
    await expected(async () => {
      for (const n of c.見える) await expect.soft(p.row(n), `注文番号「${n}」の行が表示される`).toHaveCount(1);
      for (const n of c.見えない) await expect.soft(p.row(n), `注文番号「${n}」の行は表示されない`).toHaveCount(0);
    });
  };
}

// ---------------------------------------------------------------- 対応状況・支払方法・備考・性別・金額・自由入力

const 状態の絞り込み = (正本: string, 状態: string[], 見える: string[], 見えない: string[]) =>
  (h: H) => ({
    手順: [開く(h), 詳細を開く(h), 番号を入れる(h, 正本), async () => { await h.p.checkGroup("対応状況", 状態); }, 検索する(h)],
    見える: 見える.map(h.号), 見えない: 見えない.map(h.号),
  });

caseTest("IT-M05-01-005", 検索ケース(2, (h) => ({
  手順: [開いて番号を入れる(h, "M0501-STATUS-005"), 検索する(h)],
  見える: [h.号("M0501-STATUS-005-A")], 見えない: [h.号("M0501-STATUS-005-B")],
})));
caseTest("IT-M05-01-078", 検索ケース(3, (h) => ({
  手順: [開く(h), async () => { await h.p.orderNumber.fill(h.号("M0501-078")); note("対応状況は選択しない（既定のまま）"); }, 検索する(h)],
  見える: [h.号("M0501-078-A")], 見えない: [h.号("M0501-078-B")],
})));
caseTest("IT-M05-01-088", 検索ケース(5, 状態の絞り込み("M0501-088", ["入金済み", "出荷指示"], ["M0501-088-B", "M0501-088-C"], ["M0501-088-A", "M0501-088-D"])));
caseTest("IT-M05-01-158", 検索ケース(5, 状態の絞り込み("M0501-158", ["キャンセル"], ["M0501-158-B"], ["M0501-158-A"])));

caseTest("IT-M05-01-090", 検索ケース(5, (h) => ({
  手順: [開く(h), 詳細を開く(h), 番号を入れる(h, "M0501-090"), async () => { await h.p.checkGroup("支払方法", [rc("M0501-090-PAY1")]); }, 検索する(h)],
  見える: [h.号("M0501-090-A")], 見えない: [h.号("M0501-090-B")],
})));

const 備考の絞り込み = (正本: string, 備考: string[], 見える: string[], 見えない: string[]) =>
  (h: H) => ({
    手順: [開く(h), 詳細を開く(h), 番号を入れる(h, 正本), async () => { await h.p.checkGroup("注文備考", 備考); }, 検索する(h)],
    見える: 見える.map(h.号), 見えない: 見えない.map(h.号),
  });
caseTest("IT-M05-01-092", 検索ケース(5, 備考の絞り込み("M0501-092", ["注文備考あり"], ["M0501-092-A"], ["M0501-092-B"])));
caseTest("IT-M05-01-093", 検索ケース(5, 備考の絞り込み("M0501-093", ["注文備考なし", "注文備考あり"], ["M0501-093-A", "M0501-093-B"], [])));
caseTest("IT-M05-01-140", 検索ケース(5, 備考の絞り込み("M0501-140", ["注文備考なし"], ["M0501-140-B"], ["M0501-140-A"])));

caseTest("IT-M05-01-098", 検索ケース(5, (h) => ({
  手順: [開く(h), 詳細を開く(h), 番号を入れる(h, "M0501-098"), async () => { await h.p.checkGroup("性別", ["男性"]); }, 検索する(h)],
  見える: [h.号("M0501-098-A")], 見えない: [h.号("M0501-098-B")],
})));

caseTest("IT-M05-01-115", 検索ケース(5, (h) => ({
  手順: [
    開く(h), 詳細を開く(h), 番号を入れる(h, "M0501-115"),
    async () => { await h.p.paymentTotalStart.fill("1000"); await h.p.paymentTotalEnd.fill("2000"); },
    検索する(h),
  ],
  見える: ["MIN", "MID", "MAX"].map((k) => h.号(`M0501-115-${k}`)), 見えない: ["L", "H"].map((k) => h.号(`M0501-115-${k}`)),
})));

caseTest("IT-M05-01-119", 検索ケース(4, (h) => ({
  手順: [
    開く(h), 番号を入れる(h, "M0501-119"),
    async () => { if (await h.p.showDelivery()) note("配送先の検索条件が閉じていたので、開閉ボタン2を押して表示した"); await h.p.shippingMulti.fill(rc("M0501-119-HIT")); },
    検索する(h),
  ],
  見える: ["ADDR1", "ADDR2", "SEI", "MEI", "COMP", "INV"].map((k) => h.号(`M0501-119-${k}`)), 見えない: [h.号("M0501-119-NONE")],
})));
caseTest("IT-M05-01-129", 検索ケース(4, (h) => ({
  手順: [開く(h), 番号を入れる(h, "M0501-129"), async () => { await h.p.multi.fill(rc("M0501-129-HIT")); }, 検索する(h)],
  見える: ["COMP", "NOTE", "MEMO", "CODE"].map((k) => h.号(`M0501-129-${k}`)), 見えない: [h.号("M0501-129-NONE")],
})));

caseTest("IT-M05-01-131", 検索ケース(5, (h) => ({
  手順: [
    開く(h), 詳細を開く(h), 番号を入れる(h, "M0501-131"),
    async () => { await h.p.checkGroup("配送方法", [h.号("M0501-131-DLV1"), h.号("M0501-131-DLV2")]); },
    検索する(h),
  ],
  見える: [h.号("M0501-131-A"), h.号("M0501-131-B")], 見えない: [h.号("M0501-131-C")],
})));
caseTest("IT-M05-01-132", 検索ケース(5, (h) => ({
  手順: [
    開く(h), 詳細を開く(h), 番号を入れる(h, "M0501-132"),
    async () => { await h.p.checkGroup("顧客グループ", [h.号("M0501-132-GRP1"), h.号("M0501-132-GRP2")]); },
    検索する(h),
  ],
  見える: [h.号("M0501-132-A"), h.号("M0501-132-B")], 見えない: [h.号("M0501-132-C")],
})));

// ---------------------------------------------------------------- 店舗・受注元

const 店舗の検索 = (正本: string, tenants: () => string[], 見える: string[], 見えない: string[], 一手順で選ぶ = false) =>
  (h: H) => ({
    手順: 一手順で選ぶ
      ? [async () => { await h.p.open(); await h.p.selectTenants(tenants()); await h.p.orderNumber.fill(h.号(正本)); }, 検索する(h)]
      : [開く(h), 店舗を選ぶ(h, tenants()), 番号を入れる(h, 正本), 検索する(h)],
    見える: 見える.map(h.号), 見えない: 見えない.map(h.号),
  });
const 店舗A = () => 店舗Aの店名();
caseTest("IT-M05-01-002", 検索ケース(2, 店舗の検索("M0501-SOURCE-002", () => ["全店"], ["M0501-SOURCE-002-HQ", "M0501-SOURCE-002-BR", "M0501-SOURCE-002-SM"], [], true)));
caseTest("IT-M05-01-003", 検索ケース(3, (h) => ({
  手順: [開く(h), async () => { await h.p.orderNumber.fill(h.号("M0501-SOURCE-003")); note("店舗の選択は変更しない（管理者のデフォルト検索表示店舗のまま）"); }, 検索する(h)],
  見える: [h.号("M0501-SOURCE-003-HQ")], 見えない: [h.号("M0501-SOURCE-003-BR"), h.号("M0501-SOURCE-003-SM")],
})));
caseTest("IT-M05-01-004", 検索ケース(2, 店舗の検索("M0501-DUP-004", () => ["全店"], ["M0501-DUP-004-SM"], ["M0501-DUP-004-EC"], true)));
caseTest("IT-M05-01-079", 検索ケース(4, 店舗の検索("M0501-079", () => [店舗A(), 店舗Bの店名], ["M0501-079-HQ", "M0501-079-BR"], ["M0501-079-SM"])));
caseTest("IT-M05-01-080", 検索ケース(4, 店舗の検索("M0501-080", () => ["全店", 店舗A()], ["M0501-080-HQ", "M0501-080-BR", "M0501-080-SM"], [])));
caseTest("IT-M05-01-081", 検索ケース(4, 店舗の検索("M0501-081", () => ["全店"], ["M0501-081-HQ", "M0501-081-BR"], ["M0501-081-CL"])));
caseTest("IT-M05-01-137", 検索ケース(4, 店舗の検索("M0501-137", () => ["全店", 店舗A()], ["M0501-137-HQ", "M0501-137-BR"], ["M0501-137-CL"])));

caseTest("IT-M05-01-082", 検索ケース(3, (h) => ({
  手順: [開く(h), async () => { await h.p.orderNumber.fill(h.notes.get("〔注文番号-M0501-082A〕")); }, 検索する(h)],
  見える: [h.notes.get("〔注文番号-M0501-082B〕")], 見えない: [],
})));

// 店舗と対応状況の組み合わせ（対応状況の欄の手順がある）
const 店舗と状態 = (正本: string, tenants: () => string[], 状態: string[], 見える: string, 見えない: string) =>
  (h: H) => ({
    手順: [
      開く(h), 店舗を選ぶ(h, tenants()), 詳細を開く(h), 番号を入れる(h, 正本),
      async () => { await h.p.checkGroup("対応状況", 状態); }, 検索する(h),
    ],
    見える: [h.号(見える)], 見えない: [h.号(見えない)],
  });
caseTest("IT-M05-01-165", 検索ケース(6, 店舗と状態("M0501-CB165", () => [店舗A()], [], "M0501-CB165-B", "M0501-CB165-A")));
caseTest("IT-M05-01-166", 検索ケース(6, 店舗と状態("M0501-CB166", () => [店舗A()], ["キャンセル"], "M0501-CB166-B", "M0501-CB166-A")));
caseTest("IT-M05-01-167", 検索ケース(6, 店舗と状態("M0501-CB167", () => [店舗A()], ["入金済み"], "M0501-CB167-B", "M0501-CB167-A")));
caseTest("IT-M05-01-169", 検索ケース(6, 店舗と状態("M0501-CB169", () => ["全店"], [], "M0501-CB169-B", "M0501-CB169-A")));
caseTest("IT-M05-01-172", 検索ケース(6, 店舗と状態("M0501-CB172", () => [店舗A()], ["入金済み"], "M0501-CB172-B", "M0501-CB172-A")));
caseTest("IT-M05-01-173", 検索ケース(6, 店舗と状態("M0501-CB173", () => [店舗A()], ["キャンセル"], "M0501-CB173-B", "M0501-CB173-A")));
caseTest("IT-M05-01-170", 検索ケース(6, (h) => ({
  手順: [
    開く(h), 店舗を選ぶ(h, ["全店"]), 詳細を開く(h), 番号を入れる(h, "M0501-CB170"),
    async () => { await h.p.checkGroup("対応状況", []); }, 検索する(h),
  ],
  見える: [h.号("M0501-CB170-A")], 見えない: [],
})));

// ---------------------------------------------------------------- 日付の条件

const 項目名: Record<string, string> = { payment: "入金日", commit: "出荷指示日", shipping: "出荷日", cancel: "キャンセル日", receipt: "売上確定日", otc_rsv: "店頭予約", update: "更新日" };
/** 期間（From・To）を入れる。日時の欄は、欄の書式に合わせて入れる */
const 期間を入れる = (h: H, 項目: string, from: string, to: string): S => async () => {
  note(`${項目名[項目]}の日時の欄は、欄の書式に合わせて「${from}」「${to}」を入れた`);
  await h.p.fillDateTime(h.p.dateInput(項目, "start"), from);
  await h.p.fillDateTime(h.p.dateInput(項目, "end"), to);
};
const 期間のケース = (正本: string, 項目: string, 内: string[], 外: string[]) =>
  (h: H) => ({
    手順: [開く(h), 詳細を開く(h), 番号を入れる(h, 正本), 期間を入れる(h, 項目, "2026/09/10 00:00", "2026/09/20 00:00"), 検索する(h)],
    見える: 内.map((k) => h.号(`${正本}-${k}`)), 見えない: 外.map((k) => h.号(`${正本}-${k}`)),
  });
caseTest("IT-M05-01-100", 検索ケース(5, 期間のケース("M0501-100", "shipping", ["IN"], ["OUT"])));
caseTest("IT-M05-01-101", 検索ケース(5, 期間のケース("M0501-101", "cancel", ["IN"], ["OUT"])));
caseTest("IT-M05-01-102", 検索ケース(5, 期間のケース("M0501-102", "receipt", ["IN"], ["OUT"])));
caseTest("IT-M05-01-103", 検索ケース(5, 期間のケース("M0501-103", "otc_rsv", ["IN"], ["OUT"])));
caseTest("IT-M05-01-104", 検索ケース(5, 期間のケース("M0501-104", "payment", ["FROM", "BEFORETO"], ["BEFOREFROM", "TO"])));
caseTest("IT-M05-01-146", 検索ケース(5, 期間のケース("M0501-146", "commit", ["FROM", "BEFORETO"], ["BEFOREFROM", "TO"])));
caseTest("IT-M05-01-147", 検索ケース(5, 期間のケース("M0501-147", "shipping", ["FROM", "BEFORETO"], ["BEFOREFROM", "TO"])));
caseTest("IT-M05-01-148", 検索ケース(5, 期間のケース("M0501-148", "cancel", ["FROM", "BEFORETO"], ["BEFOREFROM", "TO"])));
caseTest("IT-M05-01-149", 検索ケース(5, 期間のケース("M0501-149", "receipt", ["FROM", "BEFORETO"], ["BEFOREFROM", "TO"])));
caseTest("IT-M05-01-150", 検索ケース(5, 期間のケース("M0501-150", "otc_rsv", ["FROM", "BEFORETO"], ["BEFOREFROM", "TO"])));
caseTest("IT-M05-01-151", 検索ケース(5, 期間のケース("M0501-151", "update", ["FROM", "BEFORETO"], ["BEFOREFROM", "TO"])));

caseTest("IT-M05-01-099", 検索ケース(7, (h) => ({
  手順: [
    開く(h), 詳細を開く(h), 番号を入れる(h, "M0501-099"),
    期間を入れる(h, "payment", "2026/09/10 00:00", "2026/09/20 00:00"),
    期間を入れる(h, "commit", "2026/09/10 00:00", "2026/09/20 00:00"),
    期間を入れる(h, "update", "2026/09/10 00:00", "2026/09/20 00:00"),
    検索する(h),
  ],
  見える: [h.号("M0501-099-IN")], 見えない: ["OUTPAY", "OUTSHIP", "OUTUPD"].map((k) => h.号(`M0501-099-${k}`)),
})));

const 過去日のケース = (正本: string, 項目: string) =>
  (h: H) => ({
    手順: [
      開く(h), 詳細を開く(h), 番号を入れる(h, 正本),
      async () => { await h.p.dateInput(項目, "since_before").fill("3"); await h.p.dateInput(項目, "until_before").fill("1"); },
      検索する(h),
    ],
    見える: [h.号(`${正本}-IN`)], 見えない: [h.号(`${正本}-OLD`), h.号(`${正本}-TODAY`)],
  });
caseTest("IT-M05-01-105", 検索ケース(5, 過去日のケース("M0501-105", "payment")));
caseTest("IT-M05-01-106", 検索ケース(5, 過去日のケース("M0501-106", "commit")));
caseTest("IT-M05-01-107", 検索ケース(5, 過去日のケース("M0501-107", "shipping")));
caseTest("IT-M05-01-108", 検索ケース(5, 過去日のケース("M0501-108", "cancel")));
caseTest("IT-M05-01-109", 検索ケース(5, 過去日のケース("M0501-109", "receipt")));
caseTest("IT-M05-01-110", 検索ケース(5, 過去日のケース("M0501-110", "otc_rsv")));
caseTest("IT-M05-01-111", 検索ケース(5, 過去日のケース("M0501-111", "update")));

const 入力状態のケース = (正本: string, 項目: string) =>
  (h: H) => ({
    手順: [開く(h), 詳細を開く(h), 番号を入れる(h, 正本), async () => { await h.p.checkEnter(項目, ["0", "1"]); }, 検索する(h)],
    見える: [h.号(`${正本}-SET`), h.号(`${正本}-UNSET`)], 見えない: [],
  });
caseTest("IT-M05-01-114", 検索ケース(5, 入力状態のケース("M0501-114", "payment")));
caseTest("IT-M05-01-152", 検索ケース(5, 入力状態のケース("M0501-152", "commit")));
caseTest("IT-M05-01-153", 検索ケース(5, 入力状態のケース("M0501-153", "shipping")));
caseTest("IT-M05-01-154", 検索ケース(5, 入力状態のケース("M0501-154", "cancel")));
caseTest("IT-M05-01-155", 検索ケース(5, 入力状態のケース("M0501-155", "receipt")));
caseTest("IT-M05-01-156", 検索ケース(5, 入力状態のケース("M0501-156", "otc_rsv")));

// ---------------------------------------------------------------- 一覧の表示

caseTest("IT-M05-01-009", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-009〕");
  const id = notes.get("〔受注ID-M0501-009〕");
  let cells: string[] = [];
  let editId = "";
  let headers: string[] = [];
  await step(1, async () => { await p.open(); await p.orderNumber.fill(no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => {
    await expect(p.row(no), `注文番号「${no}」の一覧の行`).toHaveCount(1);
    cells = await p.rowCells(no);
    editId = await p.rowEditOrderId(no);
    headers = await p.headerTexts();
    note("一覧の列は 受注日・注文番号・お名前・支払方法・購入金額・出荷指示日・対応状況・店舗。受注IDは、受注日の列のリンク先（受注情報編集画面）の受注IDで確かめた");
  });
  await expected(async () => {
    expect.soft(editId, "受注日の列のリンク先の受注ID").toBe(id);
    expect.soft(cells[2], "注文番号").toBe(no);
    expect.soft((cells[3] ?? "").replace(/\s/g, ""), "お名前").toBe("晴屋太郎");
    expect.soft(cells[4], "支払方法").toBe("銀行振込");
    expect.soft(cells[5] ?? "", "購入金額（円）").toContain("12,345");
    expect.soft(headers.join("／"), "一覧の見出しに配送方法がある").toContain("配送方法");
    expect.soft(cells.join("／"), "一覧の行に配送方法（宅配便）が表示される").toContain("宅配便");
    expect.soft(cells[6] ?? "", "出荷指示日").toContain("2026/09/02");
    expect.soft(cells[7], "対応状況").toBe("注文受領");
    expect.soft(cells[8], "店舗（店舗Aは本店）").toBe(店舗Aの店名());
  });
});

caseTest("IT-M05-01-010", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-010〕");
  let cells: string[] = [];
  await step(1, async () => { await p.open(); await p.orderNumber.fill(no); });
  await step(2, async () => { await p.clickSearch(); await expect(p.row(no), `注文番号「${no}」の一覧の行`).toHaveCount(1); cells = await p.rowCells(no); });
  await expected(async () => {
    expect(cells[3] ?? "", "お名前の欄").toContain("非会員");
  });
});

caseTest("IT-M05-01-011", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const a = 号("M0501-DISPLAY-011-A");
  const b = 号("M0501-DISPLAY-011-B");
  await step(1, async () => { await p.open(); await p.orderNumber.fill(号("M0501-DISPLAY-011")); });
  await step(2, async () => { await p.clickSearch(); });
  await expected(async () => {
    await expect.soft(p.row(a), `当日受取区分ありの受注（${a}）の行`).toHaveCount(1);
    await expect.soft(p.row(b), `当日受取区分なしの受注（${b}）の行`).toHaveCount(1);
    await expect.soft(p.pickupBadge(a), "当日受取区分ありの受注に当日受取のアイコンが表示される").toHaveCount(1);
    await expect.soft(p.pickupBadge(b), "当日受取区分なしの受注に当日受取のアイコンは表示されない").toHaveCount(0);
  });
});

// ---------------------------------------------------------------- ページング（11受注・10件ずつ）

const ページ名 = (接頭: string): string[] => Array.from({ length: 11 }, (_, i) => `${接頭}-${String(i + 1).padStart(2, "0")}`);
const 選んでいる件数 = async (p: OrderSearchPage): Promise<string> => ((await p.pageCountSelect.locator("option:checked").innerText()) ?? "").trim();

caseTest("IT-M05-01-013", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  let rows = 0; let current = 0; let selected = "";
  await step(1, async () => { await p.open(); await p.orderNumber.fill(号("M0501-PAGE-013")); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { await p.selectPageCount("10件"); });
  await step(4, async () => { await p.goToPage(2); });
  await step(5, async () => {
    await p.selectPageCount("50件");
    rows = (await p.shownOrderNumbers()).length; current = await p.currentPage(); selected = await 選んでいる件数(p);
  });
  await expected(async () => {
    expect.soft(selected, "件数の選択欄").toBe("50件");
    expect.soft(current, "表示しているページ").toBe(1);
    expect.soft(new URL(page.url()).pathname, "表示している画面のアドレス（1ページ目）").toMatch(/\/order\/page\/1$/);
    expect.soft(rows, "1ページ目に表示された受注の数（11件すべて）").toBe(11);
  });
});

caseTest("IT-M05-01-014", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  let rows = 0; let current = 0; let selected = "";
  await step(1, async () => { await p.open(); await p.orderNumber.fill(号("M0501-PAGE-014")); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { await p.selectPageCount("10件"); });
  await step(4, async () => {
    await p.rewritePageCountOption("10件", "page_count=10", "page_count=11");
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), p.pageCountSelect.selectOption({ label: "10件" })]);
    await expect(p.totalCount, "検索結果の件数の表示").toBeVisible();
  });
  await step(5, async () => {
    await p.goToPage(2);
    rows = (await p.shownOrderNumbers()).length; current = await p.currentPage(); selected = await 選んでいる件数(p);
  });
  await expected(async () => {
    expect.soft(current, "表示しているページ").toBe(2);
    expect.soft(rows, "2ページ目に表示された受注の数（表示件数10で11件のうち1件）").toBe(1);
    expect.soft(selected, "件数の選択欄（11は無視され10件のまま）").toBe("10件");
  });
});

caseTest("IT-M05-01-015", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const all = ページ名("M0501-PAGE-015").map(号);
  let first: string[] = []; let second: string[] = []; let current = 0;
  await step(1, async () => { await p.open(); await p.orderNumber.fill(号("M0501-PAGE-015")); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { await p.selectPageCount("10件"); });
  await step(4, async () => { first = await p.shownOrderNumbers(); });
  await step(5, async () => { await p.goToPage(2); second = await p.shownOrderNumbers(); current = await p.currentPage(); });
  await expected(async () => {
    expect.soft(current, "遷移した後のページ").toBe(2);
    expect.soft(first.length, "1ページ目の受注の数").toBe(10);
    expect.soft(second.length, "2ページ目の受注の数").toBe(1);
    expect.soft([...first, ...second].sort(), "2ページを通して M0501-PAGE-015-01〜11 が重複・欠落なく1回ずつ表示される").toEqual([...all].sort());
  });
});

/** メール一括通知の遷移先に渡った配送ID（アドレスの ids） */
const 渡った配送ID = (page: Page): string[] =>
  [...new URL(page.url()).searchParams.entries()].filter(([k]) => k.startsWith("ids")).map(([, v]) => v).sort();

caseTest("IT-M05-01-028", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const n1 = 号("M0501-PAGE-028-01");
  const n11 = 号("M0501-PAGE-028-11");
  let id1 = ""; let id11 = "";
  await step(1, async () => { await p.open(); await p.orderNumber.fill(号("M0501-PAGE-028")); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { await p.selectPageCount("10件"); });
  await step(4, async () => { id1 = await p.rowShippingId(n1); await p.checkRow(n1); });
  await step(5, async () => { await p.goToPage(2); id11 = await p.rowShippingId(n11); await p.checkRow(n11); });
  await step(6, async () => {
    const item = await p.openToolMenu("その他", "メール一括通知");
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), item.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面（手動メール通知）").toMatch(/manual_mail/);
    expect.soft(渡った配送ID(page), "通知対象（表示中の2ページ目で選んだ M0501-PAGE-028-11 だけ）").toEqual([id11]);
    expect.soft(渡った配送ID(page), "1ページ目で選んだ M0501-PAGE-028-01 は通知対象に含まれない").not.toContain(id1);
  });
});

caseTest("IT-M05-01-027", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const a = 号("M0501-CSV-027-A"); const c = 号("M0501-CSV-027-C");
  let idA = ""; let idC = "";
  await step(1, async () => { await p.open(); await p.orderNumber.fill(号("M0501-CSV-027")); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { idA = await p.rowShippingId(a); idC = await p.rowShippingId(c); await p.checkRow(a); await p.checkRow(c); });
  await step(4, async () => {
    const item = await p.openToolMenu("その他", "メール一括通知");
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), item.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面（手動メール通知）").toMatch(/manual_mail/);
    expect.soft(渡った配送ID(page), "通知対象（M0501-CSV-027-A と M0501-CSV-027-C）").toEqual([idA, idC].sort());
  });
});

caseTest("IT-M05-01-032", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const a = 号("M0501-CSV-032-A"); const b = 号("M0501-CSV-032-B"); const c = 号("M0501-CSV-032-C");
  let dl: Download | null = null;
  let body = "";
  await step(1, async () => { await p.open(); await p.orderNumber.fill(号("M0501-CSV-032")); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { await p.checkRow(a); await p.checkRow(c); });
  await step(4, async () => {
    dl = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), p.bulkButton("送り状CSV").click()]).then(([d]) => d, () => null);
  });
  await step(5, async () => {
    const path = dl ? await (dl as Download).path() : null;
    body = path ? readFileSync(path).toString("latin1") : "";
    note(`ダウンロードしたCSVの行数: ${body.split(/\r?\n/).filter(Boolean).length}（見出しを含む）`);
  });
  await expected(async () => {
    expect(dl !== null, "送り状CSVがダウンロードされた").toBe(true);
    expect.soft(body, `CSVの出力対象に M0501-CSV-032-A（${a}）が含まれる`).toContain(a);
    expect.soft(body, `CSVの出力対象に M0501-CSV-032-C（${c}）が含まれる`).toContain(c);
    expect.soft(body, `CSVの出力対象に選ばなかった M0501-CSV-032-B（${b}）は含まれない`).not.toContain(b);
  });
});

// ---------------------------------------------------------------- 検索パターン

/** 検索パターンの更新アイコンを押して、件数が入るまで待つ */
async function 更新して件数を読む(p: OrderSearchPage, name: string): Promise<string> {
  await p.pressReload(name);
  return p.countTextAfterReload(name);
}

caseTest("IT-M05-01-059", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-059-PAT");
  let before = ""; let urlBefore = ""; let after = "";
  await step(1, async () => { await p.open(); urlBefore = page.url(); });
  await step(2, async () => { before = await p.countText(name); });
  await step(3, async () => { after = await 更新して件数を読む(p, name); });
  await expected(async () => {
    expect.soft(before, "更新アイコンを押す前の該当件数欄").toBe("*");
    expect.soft(page.url(), "画面が遷移しない").toBe(urlBefore);
    expect(after, "検索パターンM0501-059-PATの該当件数欄").toBe("3");
  });
});

caseTest("IT-M05-01-060", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const a = rc("M0501-060-PAT-A"); const b = rc("M0501-060-PAT-B");
  let ca = ""; let cb = "";
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    await page.locator("#reload_all_pattern").click();
    ca = await p.countTextAfterReload(a); cb = await p.countTextAfterReload(b);
  });
  await expected(async () => {
    expect.soft(ca, "検索パターンM0501-060-PAT-Aの該当件数欄").toBe("2");
    expect.soft(cb, "検索パターンM0501-060-PAT-Bの該当件数欄").toBe("3");
  });
});

caseTest("IT-M05-01-062", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-062-PAT");
  let after = "";
  await step(1, async () => { await p.open(); });
  await step(2, async () => { after = await 更新して件数を読む(p, name); });
  await expected(async () => {
    expect(after, "検索パターンM0501-062-PATの該当件数欄（受注の件数2でなく受注明細ごとの3）").toBe("3");
  });
});

caseTest("IT-M05-01-070", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-070-PAT");
  let before = ""; let after = "";
  await step(1, async () => { await p.open(); before = await p.countText(name); });
  await step(2, async () => { after = await 更新して件数を読む(p, name); });
  await expected(async () => {
    expect.soft(before, "更新アイコンを押す前の該当件数欄").toBe("*");
    expect(after, "フリガナの条件が検証エラーとなる検索パターンの該当件数欄").toBe("1");
  });
});

caseTest("IT-M05-01-063", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const name = rc("M0501-063-PAT");
  const bId = 受注ID(号("M0501-063-B"));
  let first = ""; let second = ""; let at2 = 0; let elapsed = 0;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { first = await 更新して件数を読む(p, name); at2 = Date.now(); });
  await step(3, async () => {
    注文番号を書き換える(bId, `${号("M0501-063")}02`);
    note("「DBで受注M0501-063-Bを登録する」は、シードで画面から作って写した受注Bの注文番号を、検索パターンの条件に一致する値に書き換えて行った（印つきの受注だけに書く）");
  });
  await step(4, async () => {
    await p.pressReload(name);
    await page.waitForTimeout(2000);
    second = await p.countText(name); elapsed = Date.now() - at2;
  });
  await expected(async () => {
    expect.soft(elapsed, "手順2から手順4までの経過時間（10秒以内）").toBeLessThan(10_000);
    expect.soft(first, "手順2で表示される該当件数").toBe("1");
    expect.soft(second, "手順4で表示される該当件数（件数の取得結果が使い回される）").toBe("1");
  });
});

caseTest("IT-M05-01-160", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const name = rc("M0501-160-PAT");
  const bId = 受注ID(号("M0501-160-B"));
  let first = ""; let second = "";
  await step(1, async () => { await p.open(); });
  await step(2, async () => { first = await 更新して件数を読む(p, name); });
  await step(3, async () => {
    注文番号を書き換える(bId, `${号("M0501-160")}02`);
    note("「DBで受注M0501-160-Bを登録する」は、シードで画面から作って写した受注Bの注文番号を、検索パターンの条件に一致する値に書き換えて行った（印つきの受注だけに書く）");
  });
  await step(4, async () => { await page.waitForTimeout(11_500); });
  await step(5, async () => { await p.pressReload(name); second = await p.countTextChanged(name, first); });
  await expected(async () => {
    expect.soft(first, "手順2の該当件数").toBe("1");
    expect.soft(second, "手順5の該当件数（手順2より1件多い）").toBe("2");
  });
});

const 警告文 = async (page: Page): Promise<string> => (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).join(" / ");

caseTest("IT-M05-01-162", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-162-PAT");
  let msg = "";
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.choosePattern(name); });
  await step(3, async () => { 検索パターンを消す(name); note("検索パターン「M0501-162-PAT」（名前に実行の印を含む）だけを、印を確かめてから消した"); });
  await step(4, async () => { await p.clickDelete(); msg = await 警告文(page); });
  await expected(async () => {
    expect(msg, "管理画面上部のメッセージ").toContain("検索条件を削除できませんでした");
  });
});

caseTest("IT-M05-01-164", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-164-PAT");
  const keep = rc("M0501-164-KEEP");
  let kept = -1;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.choosePattern(name); });
  await step(3, async () => { 検索パターンを消す(name); note("検索パターン「M0501-164-PAT」（名前に実行の印を含む）だけを、印を確かめてから消した"); });
  await step(4, async () => { await p.clickDelete(); });
  await step(5, async () => { kept = 検索パターンの件数(keep); });
  await expected(async () => {
    expect(kept, `名称「${keep}」の検索パターンの件数`).toBe(1);
  });
});

caseTest("IT-M05-01-066", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const prefix = 号("M0501-066");
  let shown: string[] = []; let current = 0;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.choosePattern(rc("M0501-066-PAT")); });
  await step(3, async () => { await p.selectPageCount("10件"); });
  await step(4, async () => { await p.goToPage(2); shown = await p.shownOrderNumbers(); current = await p.currentPage(); });
  await expected(async () => {
    expect.soft(current, "表示しているページ").toBe(2);
    expect.soft(shown.length, "2ページ目に表示された受注の数").toBe(1);
    expect.soft(shown[0] ?? "", "2ページ目の受注の注文番号が M0501-066 で始まる").toMatch(new RegExp(`^${prefix}`));
  });
});

caseTest("IT-M05-01-067", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  let current = 0; let rows = 0;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(号("M0501-067")); await p.clickSearch(); });
  await step(3, async () => { await p.selectPageCount("10件"); });
  await step(4, async () => { await p.goToPage(2); });
  await step(5, async () => { await p.choosePattern(rc("M0501-067-PAT")); current = await p.currentPage(); rows = (await p.shownOrderNumbers()).length; });
  await expected(async () => {
    expect.soft(current, "ページ番号").toBe(1);
    expect.soft(rows, "1ページ目に受注が表示される").toBeGreaterThan(0);
  });
});

caseTest("IT-M05-01-068", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const name = rc("M0501-068-PAT");
  let rows = 0; let current = 0; let nextPage = -1;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.appendToPatternLink(name, "page_count=10"); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), p.patternLink(name).click()]);
    await expect(p.totalCount, "検索結果の件数の表示").toBeVisible();
    rows = (await p.shownOrderNumbers()).length; current = await p.currentPage(); nextPage = await p.pageLink(2).count();
  });
  await expected(async () => {
    expect.soft(rows, "1ページ目に表示された受注の数（11件すべて）").toBe(11);
    expect.soft(current, "表示しているページ").toBe(1);
    expect.soft(nextPage, "2ページ目のリンクが無い").toBe(0);
  });
});

caseTest("IT-M05-01-074", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const all = ページ名("M0501-074").map(号);
  let selected = ""; let current = 0; let total: number | null = null; let shown: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(号("M0501-074")); await p.clickSearch(); });
  await step(3, async () => { await p.selectPageCount("10件"); });
  await step(4, async () => { await p.goToPage(2); });
  await step(5, async () => { await p.openFromMenu(); });
  await step(6, async () => {
    await p.orderNumber.fill(号("M0501-074")); await p.clickSearch();
    selected = await 選んでいる件数(p); current = await p.currentPage(); total = await p.totalCountNumber(); shown = await p.shownOrderNumbers();
  });
  await expected(async () => {
    expect.soft(selected, "件数の選択欄（初期値）").toBe("300件");
    expect.soft(current, "表示しているページ").toBe(1);
    expect.soft(total, "該当件数").toBe(11);
    expect.soft([...shown].sort(), "M0501-074-01〜11の11件が表示される").toEqual([...all].sort());
  });
});

// ---------------------------------------------------------------- 更新日時が変わらない

type 記録 = ReturnType<typeof 受注の記録>;
caseTest("IT-M05-01-075", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  const idA = 受注ID(号("M0501-075-A")); const idB = 受注ID(号("M0501-075-B"));
  let before: 記録[] = [];
  let after: 記録[] = [];
  await step(1, async () => { before = [受注の記録(idA), 受注の記録(idB)]; });
  await step(2, async () => { await p.open(); });
  await step(3, async () => { await p.orderNumber.fill(号("M0501-075")); await p.clickSearch(); });
  await step(4, async () => { await showDetail(p); await p.patternName.fill(rc("M0501-075-PAT")); await p.clickSave(); });
  await step(5, async () => { await p.pressReload(rc("M0501-075-PAT")); await page.waitForTimeout(1500); });
  await step(6, async () => { after = [受注の記録(idA), 受注の記録(idB)]; });
  await expected(async () => {
    expect.soft(before[0]?.更新日時, "手順1で記録したM0501-075-Aの更新日時").toBe("2026-09-01 10:00:00");
    expect.soft(after[0]?.対応状況, "M0501-075-Aの対応状況").toBe("注文受領");
    expect.soft(after[1]?.対応状況, "M0501-075-Bの対応状況").toBe("入金待ち");
    expect.soft(after[0]?.更新日時, "M0501-075-Aの更新日時").toBe("2026-09-01 10:00:00");
    expect.soft(after[1]?.更新日時, "M0501-075-Bの更新日時").toBe("2026-09-01 10:00:00");
    expect.soft(after[0]?.削除日時 ?? null, "M0501-075-Aの削除済み区分（無効のまま）").toBeNull();
    expect.soft(after[1]?.削除日時 ?? null, "M0501-075-Bの削除済み区分（無効のまま）").toBeNull();
  });
});

// ---------------------------------------------------------------- 削除と会員の購入実績

type 押した削除 = { dialog: Dialog; clicked: Promise<unknown> };
async function 削除を押す(page: Page, p: OrderSearchPage, no: string): Promise<押した削除> {
  const item = await p.openRowMenu(no, "削除");
  const shown = page.waitForEvent("dialog", { timeout: 20_000 });
  const clicked = item.click({ noWaitAfter: true }).catch(() => undefined);
  const dialog = await shown;
  note(`確認ダイアログの文: 「${dialog.message()}」`);
  return { dialog, clicked };
}
async function OKを押す(page: Page, d: 押した削除): Promise<void> {
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 60_000 });
  await d.dialog.accept();
  await d.clicked;
  const res = await nav;
  note(`削除の要求のあと: 応答 ${res?.status() ?? "なし"}・移った画面 ${new URL(page.url()).pathname}`);
}
const 実績の注記 = "会員の購入実績は、試験用の会員を写した印つきの専用の会員のもの（シードが作った）";
type 実績 = ReturnType<typeof 会員の購入実績>;

caseTest("IT-M05-01-043", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-043〕");
  const mid = notes.get("〔会員ID-M0501-043〕");
  let d: 押した削除 | null = null;
  let r: 実績 | null = null;
  await step(1, async () => { await p.open(); await p.orderNumber.fill(no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { d = await 削除を押す(page, p, no); });
  await step(4, async () => { await OKを押す(page, d!); });
  await step(5, async () => { r = 会員の購入実績(mid); note(実績の注記); });
  await expected(async () => {
    const v = r as 実績;
    expect.soft(Number(v.購入回数), "購入回数").toBe(5);
    expect.soft(Number(v.購入金額), "購入金額").toBe(1500);
  });
});

caseTest("IT-M05-01-045", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-045A〕");
  const mid = notes.get("〔会員ID-M0501-045〕");
  let d: 押した削除 | null = null;
  let t0 = 0;
  let r: 実績 | null = null;
  await step(1, async () => { await p.open(); await p.orderNumber.fill(no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { t0 = Date.now(); note(`削除を実行する直前の日時を記録した: ${new Date(t0).toISOString()}`); });
  await step(4, async () => { d = await 削除を押す(page, p, no); });
  await step(5, async () => { await OKを押す(page, d!); });
  await step(6, async () => { r = 会員の購入実績(mid); note(実績の注記); });
  await expected(async () => {
    const v = r as 実績;
    expect(v.初回購入日時, "初回購入日時が設定された").not.toBeNull();
    const at = new Date(`${(v.初回購入日時 ?? "").replace(" ", "T")}+09:00`).getTime();
    expect.soft(at, "初回購入日時が、手順3で記録した日時以降（数秒の時計のずれは許す）").toBeGreaterThanOrEqual(t0 - 5000);
    expect.soft(v.初回購入日時, "残った受注の注文日（2026-08-01 10:00:00）ではない").not.toBe("2026-08-01 10:00:00");
  });
});

caseTest("IT-M05-01-174", async ({ page, notes, step, expected }) => {
  const p = await signIn(page);
  const no = notes.get("〔注文番号-M0501-174A〕");
  const mid = notes.get("〔会員ID-M0501-174〕");
  let d: 押した削除 | null = null;
  let deleted: string | null = null;
  let r: 実績 | null = null;
  await step(1, async () => { await p.open(); await p.orderNumber.fill(no); });
  await step(2, async () => { await p.clickSearch(); });
  await step(3, async () => { d = await 削除を押す(page, p, no); });
  await step(4, async () => { await OKを押す(page, d!); });
  await step(5, async () => { deleted = 受注の削除日時(受注ID(no)); r = 会員の購入実績(mid); note(実績の注記); });
  await expected(async () => {
    const v = r as 実績;
    expect.soft(deleted, "削除されずに残り、削除済み区分が有効（削除日時が入る）").not.toBeNull();
    expect.soft(Number(v.購入回数), "購入回数（再計算）").toBe(2);
    expect.soft(Number(v.購入金額), "購入金額（再計算）").toBe(500);
    expect.soft(v.初回購入日時, "初回購入日時（設定済みのまま）").toBe("2026-07-01 10:00:00");
  });
});

// ---------------------------------------------------------------- 警告表示

const 赤字か = (色: string): boolean => {
  const rgb = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(色)?.slice(1).map(Number) ?? [0, 0, 0];
  return rgb[0] >= 180 && rgb[1] < 100 && rgb[2] < 100;
};
/** 注文番号の欄の赤字と警告文言の行の数（注文番号の行を除く）を確かめるケース */
function 警告のケース(正本: string, 赤字: boolean, 警告の行: number) {
  return async ({ page, step, expected }: Ctx) => {
    const p = await signIn(page);
    const no = 注文番号の読み替え(正本);
    note(`注文番号「${正本}」は、シードが作った受注の注文番号 ${no} に読み替えた`);
    let lines: string[] = []; let color = "";
    await step(1, async () => { await p.open(); });
    await step(2, async () => { await p.orderNumber.fill(注文番号の読み替え(正本.replace(/-A$/, ""))); note("店舗は初期表示の店舗Aのまま"); });
    await step(3, async () => { await p.clickSearch(); });
    await step(4, async () => { lines = await p.numberCellLines(no); color = (await p.numberCell(no)).文字の色; });
    await expected(async () => {
      await expect.soft(p.row(no), `注文番号「${no}」の行が表示される`).toHaveCount(1);
      expect.soft(赤字か(color) ? `赤字（${color}）` : `赤字でない（${color}）`, "注文番号の文字の色").toMatch(赤字 ? /^赤字（/ : /^赤字でない/);
      expect.soft(lines.slice(1).length, `注文番号の下の警告文言の行（${lines.slice(1).join(" / ") || "なし"}）`).toBe(警告の行);
    });
  };
}
caseTest("IT-M05-01-175", 警告のケース("M0501-CB175-A", true, 2));
caseTest("IT-M05-01-178", 警告のケース("M0501-CB178-A", true, 1));

// 該当件数は、受注明細ごとでなく受注の件数
caseTest("IT-M05-01-159", async ({ page, step, expected }) => {
  const p = await signIn(page);
  const 号 = 読み替える();
  let total: number | null = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.orderNumber.fill(号("M0501-159")); });
  await step(3, async () => { await p.clickSearch(); });
  await step(4, async () => { total = await p.totalCountNumber(); });
  await expected(async () => {
    expect(total, "該当件数（受注明細ごとの3でなく、受注の件数2）").toBe(2);
  });
});
