/**
 * M04-30 バーコード貼替リストCSV出力の続き（カードの色順・カードタイプ・マナコストで並ぶケースと、カテゴリ・言語・状態のケース）。
 * 正本: cases/M04-30_seed_data.tsv。seeds/m04-30-b.ts と同じ作り方（グッズ商品CSV登録 → 商品規格の編集 → 在庫を入庫して承認 → DB で書く）に、
 * シード表のとおり画面で作る次を足した。
 * - MTGマスターデータ管理で色順・カードタイプを登録し、カード新規登録でカードを作り、商品登録編集の「カード指定」で商品に紐づける
 *   （依頼者決定 2026-11-14「マスタは作ってよい」。カード名は実行の印つき、マスタの名称は正本の値）。
 * - 最上位カテゴリをカテゴリ登録CSVで作り（同名があれば使い回す）、商品CSVの商品カテゴリ(ID)に指定する。
 * - 商品規格登録編集で言語に「英語」を選ぶ。
 * 正本の外で補ったもの（エビデンスの注記に出る）:
 * - 店舗A は試験支店（店舗ID 1574）で読み替える（店舗は作らない 2026-11-13）。
 * - カードタイプ・色順の並び順は、画面が「既存の最大＋1」を入れる。正本の値（0・1・2 など）そのものではないが、並びの大小は同じ。
 * - スマレジ連携フラグは「連携しない」で登録し、「連携有効」は E2E の商品規格の行だけ DB で書く（画面で「連携する」にすると外部のスマレジが呼ばれるため）。
 * - 言語・状態を空にする指定（022・023）は、シード表のとおり E2E の商品規格の行だけ DB で書く。
 * - 前の実行の残り（同じ商品コードに別の実行の印）は、スマレジ連携を外しスマレジ商品コードを空にしてから作る（seeds/m04-30-b.ts と同じ）。
 */
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { adminUrl } from "../lib/session";
import { expect, Page } from "@playwright/test";
import { CategoryPage, createTopByCsv } from "../pages/admin/category";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { ensureMaster, カード詳細IDs, カードを登録する } from "../pages/admin/m14_card";
import { 行を用意する } from "../pages/admin/m14_04_master";
import { goodsCategoryIdForCsv } from "../pages/admin/m04_19_masters";
import { 店A } from "../pages/admin/m04_09_move";
import { 規格にスマレジ商品コードを入れて公開する } from "../pages/admin/m04_30_setup";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { 試験支店の店舗ID } from "../pages/admin/reuse_store";
import * as db30 from "../db/m04_30";
import * as dbc from "../db/m04_30_c";
import { runScenario } from "./m04-09";

type カード = { 色順: string; カードタイプ: string; マナ: number };
type 商品 = {
  key: string;
  code: string;
  基準価格: number;
  スマレジ商品コード: string;
  日時: string;
  カード?: カード;
  /** 最上位カテゴリの名称（無ければサプライ・グッズ） */
  カテゴリ?: string;
  言語?: "英語" | "なし";
  状態なし?: boolean;
};
type マスタ = { 色順: string[]; カードタイプ: { 日: string; 英: string; コード: string }[] };

/** このファイルが作る正本の商品コードの全部と、seeds/m04-30-b.ts の 009（価格変更日が 008 と重なる）の商品コード */
const 全商品コード: string[] = [];
const 九の商品コード = ["M0430-009-MID", "M0430-009-BEFORE", "M0430-009-AFTER"];

function mention(seedId: string, fragments: string[]): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  const missing = fragments.filter((f) => !text.includes(f));
  if (missing.length) throw new Error(`${seedId}: 作り方の値がシード表に無い: ${missing.join(" / ")}`);
}

/** 商品規格登録編集で、言語を選んで登録する（スマレジ連携フラグは「連携しない」のまま） */
async function 言語を選ぶ(page: Page, a: { 商品ID: string; 規格ID: string }, 言語: string, what: string, issue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${a.商品ID}/edit/${a.規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  await chooseByLabel(form.locator("#admin_product_class_Language"), 言語);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click({ noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: 言語「${言語}」の登録`)) issue(`${what}: 警告「${w}」`);
}

async function 最上位カテゴリを用意する(page: Page, 名称: string, what: string, issue: (m: string) => void): Promise<string> {
  const cat = new CategoryPage(page);
  await cat.openTop();
  const hit = (await cat.rowValues()).filter((r) => r.nameJp === 名称);
  if (hit.length > 1) throw new Error(`${what}: 最上位のカテゴリ「${名称}」が ${hit.length} 件ある（1件のはず）`);
  if (hit.length === 1) { issue(`最上位のカテゴリ「${名称}」は前からあるので使い回した（カテゴリID ${hit[0].id}）`); return hit[0].id; }
  const id = await createTopByCsv(page, { nameJp: 名称, nameEn: 名称, frontHide: "0", branchHide: "0" }, `m0430c-top-${Date.now()}.csv`, issue);
  issue(`最上位のカテゴリ「${名称}」を作った（カテゴリID ${id}）`);
  return id;
}

async function build(ctx: SeedCtx, items: 商品[], master: マスタ): Promise<void> {
  const { browser, notes, seed } = ctx;
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  mention(seedId, items.flatMap((p) => [p.code, p.スマレジ商品コード]));
  const 自分 = items.map((p) => p.code);
  const 外した = db30.前の実行の残りを外す(`${seedId}: 前の実行の残り`, 自分, [...全商品コード.filter((c) => !自分.includes(c)), ...九の商品コード]);
  if (外した) issue(`前の実行の残りの商品規格 ${外した} 件のスマレジ連携を外し、スマレジ商品コードを空にした（E2E が作った行だけ）`);
  const 店舗A = 試験支店の店舗ID();
  // 0. マスタ（色順・カードタイプ）。あれば使い、無ければ登録する
  if (master.色順.length || master.カードタイプ.length) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      for (const 名 of master.色順) if (await 行を用意する(page, "色順", 名, 名, `${seedId}: 色順`)) issue(`色順「${名}」を登録した（並び順は画面が既存の最大＋1を入れた）`);
      for (const t of master.カードタイプ) if (await ensureMaster(page, "カードタイプ", t.日, t.英, `${seedId}: カードタイプ`, t.コード)) issue(`カードタイプ「${t.日}」を登録した（並び順は画面が既存の最大＋1を入れた）`);
    });
  }
  // 1. グッズ商品CSV登録（商品ごとにカテゴリが違うので1件ずつ）
  const カテゴリID = new Map<string, string>();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 既定 = await goodsCategoryIdForCsv(page, issue);
    for (const p of items) {
      if (p.カテゴリ && !カテゴリID.has(p.カテゴリ)) カテゴリID.set(p.カテゴリ, await 最上位カテゴリを用意する(page, p.カテゴリ, seedId, issue));
    }
    for (const p of items) {
      const price = String(p.基準価格);
      await registerGoodsCsv(page, {
        what: `${seedId} のグッズ商品CSV登録（${p.code}）`, fileName: `${seedId.toLowerCase()}-${p.key.toLowerCase()}-goods.csv`,
        categoryId: p.カテゴリ ? カテゴリID.get(p.カテゴリ)! : 既定,
        lines: [{ code: rc(p.code), nameJp: rc(p.code), nameEn: rc(p.code), values: { "基準価格": price, "販売価格": price, "買取価格": "0", "原価単価": "0" } }],
        onWarning: issue, uploadWaitMs: 600_000,
      });
    }
  });
  const ids = new Map(items.map((p) => [p.key, db30.規格(rc(p.code))]));
  // 2. カードを作り、商品に紐づける（商品の登録順＝商品規格IDの順は、items の順）
  const カード付き = items.filter((p) => p.カード);
  if (カード付き.length) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const p of カード付き) {
        const c = p.カード!;
        const 名 = rc(p.code);
        const カードID = await カードを登録する(page, { カード名日: 名, カード名英: 名, 点数で見たマナ: String(c.マナ), 色順: c.色順, カードタイプ: [c.カードタイプ] }, `${seedId}: ${名} のカードの登録`, issue);
        const 詳細 = await カード詳細IDs(page);
        if (詳細.length !== 1) throw new Error(`${seedId}: ${名} のカードのカード詳細が ${詳細.length} 件（1件のはず）`);
        await assignCardOnProductEdit(page, { productId: ids.get(p.key)!.商品ID, cardNameJp: 名, cardDetailId: 詳細[0], productNameJp: 名, productNameEn: 名 }, issue);
        notes.set(`〔カードID-M0430-${p.key}〕`, カードID);
        notes.set(`〔カード詳細ID-M0430-${p.key}〕`, 詳細[0]);
      }
    });
    issue(`印つきの試験用カードを ${カード付き.length} 枚作り（${カード付き.map((p) => `${rc(p.code)}: 色順 ${p.カード!.色順}・カードタイプ ${p.カード!.カードタイプ}・マナコスト ${p.カード!.マナ}`).join("／")}）、商品登録編集の「カード指定」で紐づけた（依頼者決定 2026-11-14「マスタは作ってよい」。レアリティ・レイアウト・プロモ種別は選択肢の先頭）`);
  }
  // 3. 商品規格登録編集で基準価格・スマレジ商品コード・公開（連携フラグは「連携しない」のまま）。言語の指定があれば選ぶ
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const p of items) {
      const x = ids.get(p.key)!;
      await 規格にスマレジ商品コードを入れて公開する(page, { ...x, 基準価格: p.基準価格, スマレジ商品コード: p.スマレジ商品コード }, `${seedId}: ${p.code} の商品規格`, issue);
      if (p.言語 === "英語") await 言語を選ぶ(page, x, "英語", `${seedId}: ${p.code} の商品規格`, issue);
    }
  });
  // 4. 在庫数1（店舗A のスマレジ）は、在庫編集で入庫して承認する
  await runScenario(ctx, [{ op: "in", items: items.map((p) => ({ code: rc(p.code), store: 店A, zone: "スマレジ" as const, qty: 1, unit: 100 })), free: true }]);
  // 5. 画面で指定できない値を、E2E の行だけ DB で書く
  for (const p of items) {
    const x = ids.get(p.key)!;
    const what = `${seedId}: ${p.code}`;
    db30.スマレジの値を整える(what, x.規格ID, { スマレジ商品ID: rc(p.code), 連携: true });
    const 在庫A = db30.スマレジの在庫ID(x.規格ID, 店舗A);
    if (!在庫A) throw new Error(`${what}: 店舗A（試験支店）のスマレジの在庫の行が無い（取り込みで作られるはず）`);
    if (p.言語 === "なし") { dbc.言語を未設定にする(`${what} の言語`, x.規格ID); issue(`${p.code}: 言語を DB で未設定にした（画面で空にできない。E2E の商品規格だけ）`); }
    if (p.状態なし) { dbc.状態を未設定にする(`${what} の状態`, x.規格ID); issue(`${p.code}: 状態を DB で未設定にした（画面で空にできない。E2E の商品規格だけ）`); }
    const 履歴 = db30.価格変更日時を整える(`${what} の価格変更日時`, x.規格ID, `${p.日時}+09`);
    if (履歴.length !== 1) issue(`${p.code}: 価格変更履歴が ${履歴.length} 件あった（シード表は1件だけ）。すべてを ${p.日時} にした`);
    notes.set(`〔商品ID-M0430-${p.key}〕`, x.商品ID);
    notes.set(`〔商品規格ID-M0430-${p.key}〕`, x.規格ID);
    notes.set(`〔価格変更履歴ID-M0430-${p.key}〕`, 履歴[0]);
    notes.set(`〔在庫ID-M0430-${p.key}〕`, 在庫A);
    issue(`${p.code}: ${JSON.stringify(db30.規格の今(x.規格ID, 店舗A))}`);
  }
  const promised = `〔種類-M0430-ケース番号と英字〕`;
  if ((getSeed(seedId)["状態・属性"] + getSeed(seedId).投入方法).includes(promised)) {
    notes.set(promised, "（呼び名の書き方の例。控える番号ではない）");
    issue(`シード表の ${promised} は呼び名の書き方の例（控える番号ではない）なので、その旨の文を控えた`);
  }
  issue("店舗A は試験支店で読み替えた。スマレジ連携フラグは「連携しない」で商品規格を登録し、連携有効は E2E の商品規格の行だけ DB で書いた（画面で「連携する」にすると外部のスマレジの商品APIが呼ばれるため）");
}

function define(seedId: string, items: 商品[], master: マスタ): void {
  全商品コード.push(...items.map((p) => p.code));
  defineSeed(seedId, { needs: ["S-M04-30-STORES"] }, (ctx) => build(ctx, items, master));
}

const 日 = (n: number): string => `2026-09-${String(n).padStart(2, "0")} 12:00:00`;
/** カードタイプの登録の値。コードは日本語名から決まる値（既にあるマスタは登録しないので、毎回同じ値になる） */
const 型 = (n: string, 英: string, _並び: number) => {
  let h = 0;
  for (const ch of n) h = (h * 31 + ch.codePointAt(0)!) % 99991;
  return { 日: n, 英, コード: `M43T${String(h).padStart(5, "0")}` };
};

// 008: 色順→カードタイプ→マナコスト→基準価格の降順の4段（SID-S01〜S05）
define("S-M04-30-SORT-008", [
  { key: "008A", code: "SID-S01-008", 基準価格: 100, スマレジ商品コード: "800801", 日時: "2026-08-16 12:00:00", カード: { 色順: "試験色一", カードタイプ: "試験種別一", マナ: 1 } },
  { key: "008B", code: "SID-S02-008", 基準価格: 200, スマレジ商品コード: "800802", 日時: "2026-08-16 12:00:00", カード: { 色順: "試験色一", カードタイプ: "試験種別一", マナ: 1 } },
  { key: "008C", code: "SID-S03-008", 基準価格: 900, スマレジ商品コード: "800803", 日時: "2026-08-16 12:00:00", カード: { 色順: "試験色一", カードタイプ: "試験種別一", マナ: 2 } },
  { key: "008D", code: "SID-S04-008", 基準価格: 999, スマレジ商品コード: "800804", 日時: "2026-08-16 12:00:00", カード: { 色順: "試験色一", カードタイプ: "試験種別二", マナ: 0 } },
  { key: "008E", code: "SID-S05-008", 基準価格: 999, スマレジ商品コード: "800805", 日時: "2026-08-16 12:00:00", カード: { 色順: "試験色二", カードタイプ: "試験種別零", マナ: 0 } },
], { 色順: ["試験色一", "試験色二"], カードタイプ: [型("試験種別零", "Test Type Zero", 0), 型("試験種別一", "Test Type One", 1), 型("試験種別二", "Test Type Two", 2)] });

// 010: 出力順を決める段が色の並び順
define("S-M04-30-CBORDC-010", [
  { key: "CB010-A", code: "M0430-CB010-A", 基準価格: 200, スマレジ商品コード: "710430", 日時: 日(1), カード: { 色順: "M0430-CB010-色二", カードタイプ: "M0430-CB010-種別", マナ: 1 } },
  { key: "CB010-B", code: "M0430-CB010-B", 基準価格: 100, スマレジ商品コード: "710431", 日時: 日(1), カード: { 色順: "M0430-CB010-色一", カードタイプ: "M0430-CB010-種別", マナ: 1 } },
], { 色順: ["M0430-CB010-色一", "M0430-CB010-色二"], カードタイプ: [型("M0430-CB010-種別", "M0430 CB010 Type", 1)] });

// 011: カードタイプの並び順
define("S-M04-30-CBORDT-011", [
  { key: "CB011-A", code: "M0430-CB011-A", 基準価格: 200, スマレジ商品コード: "711430", 日時: 日(2), カード: { 色順: "M0430-CB011-色", カードタイプ: "M0430-CB011-種別二", マナ: 1 } },
  { key: "CB011-B", code: "M0430-CB011-B", 基準価格: 100, スマレジ商品コード: "711431", 日時: 日(2), カード: { 色順: "M0430-CB011-色", カードタイプ: "M0430-CB011-種別一", マナ: 5 } },
], { 色順: ["M0430-CB011-色"], カードタイプ: [型("M0430-CB011-種別一", "M0430 CB011 Type One", 1), 型("M0430-CB011-種別二", "M0430 CB011 Type Two", 2)] });

// 012: マナコスト
define("S-M04-30-CBORDM-012", [
  { key: "CB012-A", code: "M0430-CB012-A", 基準価格: 200, スマレジ商品コード: "712430", 日時: 日(3), カード: { 色順: "M0430-CB012-色", カードタイプ: "M0430-CB012-種別", マナ: 5 } },
  { key: "CB012-B", code: "M0430-CB012-B", 基準価格: 100, スマレジ商品コード: "712431", 日時: 日(3), カード: { 色順: "M0430-CB012-色", カードタイプ: "M0430-CB012-種別", マナ: 1 } },
], { 色順: ["M0430-CB012-色"], カードタイプ: [型("M0430-CB012-種別", "M0430 CB012 Type", 1)] });

// 013: 基準価格の高い順
define("S-M04-30-CBORDP-013", [
  { key: "CB013-A", code: "M0430-CB013-A", 基準価格: 100, スマレジ商品コード: "713430", 日時: 日(4), カード: { 色順: "M0430-CB013-色", カードタイプ: "M0430-CB013-種別", マナ: 1 } },
  { key: "CB013-B", code: "M0430-CB013-B", 基準価格: 200, スマレジ商品コード: "713431", 日時: 日(4), カード: { 色順: "M0430-CB013-色", カードタイプ: "M0430-CB013-種別", マナ: 1 } },
], { 色順: ["M0430-CB013-色"], カードタイプ: [型("M0430-CB013-種別", "M0430 CB013 Type", 1)] });

// 014: すべて同じなら商品規格IDの小さい順
define("S-M04-30-CBORDI-014", [
  { key: "CB014-A", code: "M0430-CB014-A", 基準価格: 100, スマレジ商品コード: "714430", 日時: 日(5), カード: { 色順: "M0430-CB014-色", カードタイプ: "M0430-CB014-種別", マナ: 1 } },
  { key: "CB014-B", code: "M0430-CB014-B", 基準価格: 100, スマレジ商品コード: "714431", 日時: 日(5), カード: { 色順: "M0430-CB014-色", カードタイプ: "M0430-CB014-種別", マナ: 1 } },
], { 色順: ["M0430-CB014-色"], カードタイプ: [型("M0430-CB014-種別", "M0430 CB014 Type", 1)] });

// 021〜023: 言語・状態の列
define("S-M04-30-CBLNGBOTH-021", [
  { key: "CB021-A", code: "M0430-CB021-A", 基準価格: 100, スマレジ商品コード: "721430", 日時: 日(12), カテゴリ: "M0430-CB021-カテゴリ", 言語: "英語" },
], { 色順: [], カードタイプ: [] });
define("S-M04-30-CBLNGNONE-022", [
  { key: "CB022-A", code: "M0430-CB022-A", 基準価格: 100, スマレジ商品コード: "722430", 日時: 日(13), カテゴリ: "M0430-CB022-カテゴリ", 言語: "なし" },
], { 色順: [], カードタイプ: [] });
define("S-M04-30-CBCNDNONE-023", [
  { key: "CB023-A", code: "M0430-CB023-A", 基準価格: 100, スマレジ商品コード: "723430", 日時: 日(14), カテゴリ: "M0430-CB023-カテゴリ", 言語: "英語", 状態なし: true },
], { 色順: [], カードタイプ: [] });
