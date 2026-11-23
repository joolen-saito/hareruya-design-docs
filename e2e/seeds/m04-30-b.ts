/**
 * M04-30 バーコード貼替リストCSV出力の続き（2026-11-23 依頼者「DB の直接の設定は E2E の行だけなら流してよい」）。正本: cases/M04-30_seed_data.tsv
 * 判定済みの 001・002 のシード（seeds/m04-30.ts）は変えず、グッズ商品だけで作れるケースのシードをこのファイルに置く。
 *
 * 作り方（シード表のとおり画面で操作するもの）:
 * - グッズ商品CSV登録で商品を作る（商品コード・商品名(日/英)は正本の値に実行の印。基準価格・販売価格は正本の値、買取価格・原価単価0、
 *   商品カテゴリはサプライ・グッズ）。取り込みで、開店中の各店舗にスマレジの在庫（数量0）と価格変更履歴1件ができる。
 * - 商品規格登録編集画面で、基準価格・スマレジ商品コードを入れ、公開状態を公開にして登録する。
 * - 在庫数1は、在庫編集（入庫/その他・入庫1）と在庫編集承認一覧の承認で作る（M04-09 のシードの部品。作業者・承認者は M04-09 の試験管理者）。
 * 正本の外で補ったもの（エビデンスの注記に出る）:
 * - 店舗A は試験支店（店舗ID 1574）、店舗B は本店（店舗ID 1）で読み替える（店舗は作らない 2026-11-13）。
 * - スマレジ連携フラグは「連携しない」で登録し、「連携有効」は E2E の商品規格の行だけ DB で書く。画面で「連携する」にして登録すると、
 *   アプリが外部のスマレジ（試験環境。stg・本番と同じ契約）の商品APIを呼ぶため（2026-11-10 依頼者「スマレジは後回し」）。
 * - スマレジ商品ID・価格変更日時・在庫数-1・在庫の行が無い状態・在庫を持ったままの廃止/非公開は、シード表のとおり DB で書く（E2E の行だけ）。
 * - スマレジ商品IDは、正本の値（商品コードと同じ）に実行の印を付けた値（商品コードと同じ値）。
 * - 前の実行の残り（同じ商品コードに別の実行の印・30分より前に作ったもの）は、スマレジ連携を外しスマレジ商品コードを空にしてから作る（同じ日付の価格変更履歴を持つ
 *   前の実行の商品が CSV に出ないように。スマレジ商品コードは重ねて登録できない）。
 */
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { goodsCategoryIdForCsv } from "../pages/admin/m04_19_masters";
import { 店A, 店B } from "../pages/admin/m04_09_move";
import { 規格にスマレジ商品コードを入れて公開する } from "../pages/admin/m04_30_setup";
import { 本店の店舗ID, 試験支店の店舗ID } from "../pages/admin/reuse_store";
import * as db30 from "../db/m04_30";
import { runScenario } from "./m04-09";

/** 1つの商品（正本の1件） */
type 商品 = {
  /** 控える呼び名の末尾（〔商品ID-M0430-003A〕の「003A」、〔商品ID-M0430-CB015-OK〕の「CB015-OK」） */
  key: string;
  /** 正本の商品コード（＝商品名・スマレジ商品ID） */
  code: string;
  基準価格?: number;
  スマレジ商品コード: string | null;
  /** false でスマレジ商品IDを空にする */
  スマレジ商品IDあり?: boolean;
  連携?: boolean;
  /** 店舗A（試験支店）のスマレジの在庫数。"なし" で行を消す。既定 1 */
  店舗A?: number | "なし";
  /** 店舗B（本店）のスマレジの在庫数（入庫で作る） */
  店舗B?: number;
  商品の状態?: db30.公開状態;
  規格の状態?: db30.公開状態;
  /** 価格変更日時（日本時間） */
  日時: string;
};

/** このファイルが作る正本の商品コードの全部（前の実行の残りを外すのに使う） */
const 全商品コード: string[] = [];

function mention(seedId: string, fragments: string[]): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  const missing = fragments.filter((f) => !text.includes(f));
  if (missing.length) throw new Error(`${seedId}: 作り方の値がシード表に無い: ${missing.join(" / ")}`);
}

async function build(ctx: SeedCtx, items: 商品[]): Promise<void> {
  const { browser, notes, seed } = ctx;
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  mention(seedId, items.flatMap((p) => [p.code, ...(p.スマレジ商品コード ? [p.スマレジ商品コード] : [])]));
  const 自分 = items.map((p) => p.code);
  const 外した = db30.前の実行の残りを外す(`${seedId}: 前の実行の残り`, 自分, 全商品コード.filter((c) => !自分.includes(c)));
  if (外した) issue(`前の実行の残りの商品規格 ${外した} 件のスマレジ連携を外し、スマレジ商品コードを空にした（E2E が作った行だけ）`);
  const 店舗A = 試験支店の店舗ID();
  const 店舗B = 本店の店舗ID;
  // 1. グッズ商品CSV登録
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const categoryId = await goodsCategoryIdForCsv(page, issue);
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録（${items.length}行）`, fileName: `${seedId.toLowerCase()}-goods.csv`, categoryId,
      lines: items.map((p) => {
        const price = String(p.基準価格 ?? 100);
        return { code: rc(p.code), nameJp: rc(p.code), nameEn: rc(p.code), values: { "基準価格": price, "販売価格": price, "買取価格": "0", "原価単価": "0" } };
      }),
      onWarning: issue, uploadWaitMs: 600_000,
    });
  });
  const ids = new Map(items.map((p) => [p.key, db30.規格(rc(p.code))]));
  // 2. 商品規格登録編集で基準価格・スマレジ商品コード・公開（スマレジ連携フラグは「連携しない」のまま）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const p of items) {
      const x = ids.get(p.key)!;
      await 規格にスマレジ商品コードを入れて公開する(page, { ...x, 基準価格: p.基準価格 ?? 100, スマレジ商品コード: p.スマレジ商品コード }, `${seedId}: ${p.code} の商品規格`, issue);
    }
  });
  // 3. 在庫数1（店舗A・店舗Bのスマレジ）は、在庫編集で入庫して承認する
  const ins = [
    ...items.filter((p) => (p.店舗A ?? 1) !== "なし" && Number(p.店舗A ?? 1) > 0).map((p) => ({ code: rc(p.code), store: 店A, zone: "スマレジ" as const, qty: Number(p.店舗A ?? 1), unit: 100 })),
    ...items.filter((p) => (p.店舗B ?? 0) > 0).map((p) => ({ code: rc(p.code), store: 店B, zone: "スマレジ" as const, qty: p.店舗B!, unit: 100 })),
  ];
  if (ins.length) await runScenario(ctx, [{ op: "in", items: ins, free: true }]);
  // 4. 画面で指定できない値を、E2E の行だけ DB で書く
  for (const p of items) {
    const x = ids.get(p.key)!;
    const what = `${seedId}: ${p.code}`;
    db30.スマレジの値を整える(what, x.規格ID, { スマレジ商品ID: p.スマレジ商品IDあり === false ? null : rc(p.code), 連携: p.連携 ?? true });
    const 在庫A = db30.スマレジの在庫ID(x.規格ID, 店舗A);
    if (!在庫A) throw new Error(`${what}: 店舗A（試験支店）のスマレジの在庫の行が無い（取り込みで作られるはず）`);
    if (typeof p.店舗A === "number" && p.店舗A < 0) db30.在庫数を整える(`${what} の在庫数`, 在庫A, p.店舗A);
    if (p.店舗A === "なし") db30.在庫の行を消す(`${what} の店舗Aの在庫の行`, 在庫A);
    if (p.商品の状態 && p.商品の状態 !== "公開") db30.公開状態を整える(`${what} の商品の公開状態`, { 商品ID: x.商品ID, 状態: p.商品の状態 });
    if (p.規格の状態 && p.規格の状態 !== "公開") db30.公開状態を整える(`${what} の商品規格の公開状態`, { 規格ID: x.規格ID, 状態: p.規格の状態 });
    const 履歴 = db30.価格変更日時を整える(`${what} の価格変更日時`, x.規格ID, `${p.日時}+09`);
    if (履歴.length !== 1) issue(`${p.code}: 価格変更履歴が ${履歴.length} 件あった（シード表は1件だけ）。すべてを ${p.日時} にした`);
    notes.set(`〔商品ID-M0430-${p.key}〕`, x.商品ID);
    notes.set(`〔商品規格ID-M0430-${p.key}〕`, x.規格ID);
    notes.set(`〔価格変更履歴ID-M0430-${p.key}〕`, 履歴[0]);
    notes.set(`〔在庫ID-M0430-${p.key}〕`, p.店舗A === "なし" ? db30.スマレジの在庫ID(x.規格ID, 店舗B) : 在庫A);
    issue(`${p.code}: ${JSON.stringify(db30.規格の今(x.規格ID, 店舗A))}`);
  }
  const promised = `〔種類-M0430-ケース番号と英字〕`;
  if ((getSeed(seedId)["状態・属性"] + getSeed(seedId).投入方法).includes(promised)) {
    notes.set(promised, "（呼び名の書き方の例。控える番号ではない）");
    issue(`シード表の ${promised} は呼び名の書き方の例（控える番号ではない）なので、その旨の文を控えた`);
  }
  issue("店舗A は試験支店、店舗B は本店で読み替えた。スマレジ連携フラグは「連携しない」で商品規格を登録し、連携有効は E2E の行だけ DB で書いた（画面で「連携する」にすると外部のスマレジの商品APIが呼ばれるため）");
}

function defineGoodsSeed(seedId: string, items: 商品[]): void {
  全商品コード.push(...items.map((p) => p.code));
  defineSeed(seedId, { needs: ["S-M04-30-STORES"] }, (ctx) => build(ctx, items));
}

defineGoodsSeed("S-M04-30-STOCK-003", [
  { key: "003A", code: "STK-0-003", スマレジ商品コード: "300301", 店舗A: 0, 日時: "2026-08-11 12:00:00" },
  { key: "003B", code: "STK-N1-003", スマレジ商品コード: "300302", 店舗A: -1, 日時: "2026-08-11 12:00:00" },
  { key: "003C", code: "STK-OTHER-003", スマレジ商品コード: "300303", 店舗A: "なし", 店舗B: 1, 日時: "2026-08-11 12:00:00" },
]);
defineGoodsSeed("S-M04-30-ATTR-004", [
  { key: "004A", code: "ATTR-OK-004", スマレジ商品コード: "400401", 日時: "2026-08-12 12:00:00" },
  { key: "004B", code: "ATTR-NOID-004", スマレジ商品コード: "400402", スマレジ商品IDあり: false, 日時: "2026-08-12 12:00:00" },
  { key: "004C", code: "ATTR-OFF-004", スマレジ商品コード: "400403", 連携: false, 日時: "2026-08-12 12:00:00" },
]);
defineGoodsSeed("S-M04-30-STATUS-005", [
  { key: "005A", code: "STAT-PUBLIC-005", スマレジ商品コード: "500501", 日時: "2026-08-13 12:00:00" },
  { key: "005B", code: "STAT-NONPUBLIC-005", スマレジ商品コード: "500502", 商品の状態: "非公開", 規格の状態: "非公開", 日時: "2026-08-13 12:00:00" },
  { key: "005C", code: "STAT-PRODUCT-RETIRED-005", スマレジ商品コード: "500503", 商品の状態: "廃止", 日時: "2026-08-13 12:00:00" },
  { key: "005D", code: "STAT-CLASS-RETIRED-005", スマレジ商品コード: "500504", 規格の状態: "廃止", 日時: "2026-08-13 12:00:00" },
]);
defineGoodsSeed("S-M04-30-TIME-006", [
  { key: "006A", code: "TIME-FROM-006", スマレジ商品コード: "600601", 日時: "2026-08-14 00:00:00" },
  { key: "006B", code: "TIME-TO-006", スマレジ商品コード: "600602", 日時: "2026-08-14 23:59:59" },
  { key: "006C", code: "TIME-BEFORE-006", スマレジ商品コード: "600603", 日時: "2026-08-13 23:59:59" },
  { key: "006D", code: "TIME-AFTER-006", スマレジ商品コード: "600604", 日時: "2026-08-15 00:00:00" },
]);
defineGoodsSeed("S-M04-30-DP-RANGE-009", [
  { key: "009A", code: "M0430-009-MID", スマレジ商品コード: "900901", 日時: "2026-08-18 12:00:00" },
  { key: "009B", code: "M0430-009-BEFORE", スマレジ商品コード: "900902", 日時: "2026-08-16 12:00:00" },
  { key: "009C", code: "M0430-009-AFTER", スマレジ商品コード: "900903", 日時: "2026-08-20 12:00:00" },
]);
defineGoodsSeed("S-M04-30-CBSTKNEG-015", [
  { key: "CB015-OK", code: "M0430-CB015-OK", スマレジ商品コード: "715430", 日時: "2026-09-06 12:00:00" },
  { key: "CB015-NG", code: "M0430-CB015-NG", スマレジ商品コード: "715431", 店舗A: -1, 日時: "2026-09-06 12:00:00" },
]);
defineGoodsSeed("S-M04-30-CBSIDNONE-016", [
  { key: "CB016-OK", code: "M0430-CB016-OK", スマレジ商品コード: "716430", 日時: "2026-09-07 12:00:00" },
  { key: "CB016-NG", code: "M0430-CB016-NG", スマレジ商品コード: "716431", スマレジ商品IDあり: false, 日時: "2026-09-07 12:00:00" },
]);
defineGoodsSeed("S-M04-30-CBFLGOFF-017", [
  { key: "CB017-OK", code: "M0430-CB017-OK", スマレジ商品コード: "717430", 日時: "2026-09-08 12:00:00" },
  { key: "CB017-NG", code: "M0430-CB017-NG", スマレジ商品コード: "717431", 連携: false, 日時: "2026-09-08 12:00:00" },
]);
defineGoodsSeed("S-M04-30-CBPRDRET-018", [
  { key: "CB018-OK", code: "M0430-CB018-OK", スマレジ商品コード: "718430", 日時: "2026-09-09 12:00:00" },
  { key: "CB018-NG", code: "M0430-CB018-NG", スマレジ商品コード: "718431", 商品の状態: "廃止", 日時: "2026-09-09 12:00:00" },
]);
defineGoodsSeed("S-M04-30-CBCLSRET-019", [
  { key: "CB019-OK", code: "M0430-CB019-OK", スマレジ商品コード: "719430", 日時: "2026-09-10 12:00:00" },
  { key: "CB019-NG", code: "M0430-CB019-NG", スマレジ商品コード: "719431", 規格の状態: "廃止", 日時: "2026-09-10 12:00:00" },
]);
defineGoodsSeed("S-M04-30-CBOUTRNG-020", [
  { key: "CB020-OK", code: "M0430-CB020-OK", スマレジ商品コード: "720430", 日時: "2026-09-11 12:00:00" },
  { key: "CB020-NG", code: "M0430-CB020-NG", スマレジ商品コード: "720431", 日時: "2026-08-11 12:00:00" },
]);
defineGoodsSeed("S-M04-30-CBSUPPLY-024", [
  { key: "CB024-A", code: "M0430-CB024-A", スマレジ商品コード: "724430", 日時: "2026-09-15 12:00:00" },
]);
defineGoodsSeed("S-M04-30-CBBCODE-025", [
  { key: "CB025-A", code: "M0430-CB025-A", 基準価格: 1200, スマレジ商品コード: "725430", 日時: "2026-09-16 12:00:00" },
]);
defineGoodsSeed("S-M04-30-CBBEMPTY-026", [
  { key: "CB026-A", code: "M0430-CB026-A", 基準価格: 1200, スマレジ商品コード: null, 日時: "2026-09-17 12:00:00" },
]);
