/**
 * M04-33 戻しリストCSV の画面シード（カードのマスタを使わない 003〜006・012・037〜041・043・046・049）。正本: cases/M04-33_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順。画面で作り、画面で作れない状態だけ E2E の行に DB で書き足す。依頼者決定 2026-11-10）:
 * - S-M04-33-CONFIG: 店舗ID 1（入庫先「本店3F」）・5（出庫元）・13（支店）は開発環境の店舗をそのまま使う。本店2F・本店B2F（共有A・共有B）は、
 *   試験店舗の使い回し（2026-11-13 依頼者決定。pages/admin/reuse_store.ts）で店舗を作らない。共有A・共有B の店舗の高額商品閾値を書き換える
 *   ケース（005・043・046・049）は、使い回す試験支店・本店の設定を書き換えることになるので流さない（シード表が控えると定める〔店舗ID-M0433-共有A〕・〔店舗ID-M0433-共有B〕には、
 *   店舗IDの代わりに「用意しない」と書いた文を控える。F04-01 の〔店舗ID-F0401-共有B〕と同じ）。
 *   高額商品閾値は≪共有の設定≫。店舗ID 1・13 の今の値を控え、ケースの開始時に spec が書き換え、終わるたびに控えた値へ戻す。
 * - S-M04-33-ADM: 「M04-33試験管理者」。店舗ID 1・5・13・共有A・共有B を編集できるシステム管理者。開発環境に手動テスト用の同じログインIDの
 *   メンバーがありうるので、ログインID・名前に実行の印を付ける（M03-26・M04-01 と同じ）。承認（在庫の入庫・出庫承認）は、シード表の
 *   「承認通知先（メンバー選択）」に当たる別のメンバー「M04-33承認者」（同じ店舗を編集できる。印つき）で行う（正本の外の補い）。
 * - ケースのシード: 略称タグ（略称タグ登録）→ 棚番号（入力チェックを通る名前で棚番登録し、E2E の棚番号の名前だけ DB で正本の名前に書き換える）→
 *   グッズ商品CSV登録 → 商品規格の編集（セールフラグ・販売価格・棚番号・部門）→ 入庫先の在庫10と出庫元の在庫の入庫（在庫変更CSV登録と別のメンバーの承認）→
 *   在庫移動CSV登録・ピック/出庫承認申請・出庫承認・在庫移動指示作成・送り状No.の登録で「移動中」にする（seeds/m04-25.ts の buildInstruction）→
 *   在庫移動の作成日時を DB で正本の日時に書き換える（E2E の在庫移動だけ）→ 明細ID・入庫先の在庫IDを DB の参照で控える。
 *
 * シードでの解釈（記録にも書く）:
 * - 商品カテゴリ: シード表は「サプライ・グッズで取り込み、商品登録編集画面でサプライ／サプライ以外のカテゴリに付け替える」。アプリはサプライかどうかを
 *   カテゴリの番号2・4（グッズ・予約グッズ）に直接入っているかで決めるので、サプライの商品はグッズの番号2、サプライ以外の商品は番号5（情報商材。
 *   グッズ商品CSVが受け付けるサプライ以外の番号）で取り込む（付け替えの操作の代わり）。
 * - 商品名・商品コード・略称タグ・棚番号の名前には実行の印を付ける。名前の中の「M0433-…」の部分ごとに印を付け、それ以外の名前は末尾に付ける。
 *   ケースの文の同じ値も同じく読む。
 * - 店舗ID 1 の店名（本店3F）・共有A／B の店名（本店2F・本店B2F）と店舗種別（本店）は、全員が使う店舗・本店の判定に関わるので書き換えない。
 *   ケースの期待結果は店名・店舗種別を見ない（ピッキング区分は入庫先の高額商品閾値、棚番号は入庫先が店舗ID 1 かどうかで決まる）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 棚番号の名前を書き換える } from "../db/m04_01_x";
import { 在庫移動の作成日時, 在庫移動の作成日時を書き換える, 在庫移動の明細, 商品規格ID, 店舗の高額商品閾値, 棚番号の名前がある, 言語コードのID, 商品規格の状態を書き換える, 商品規格の状態 } from "../db/m04_33";
import { カードを登録する, カード詳細IDs } from "../pages/admin/m14_card";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { GOODS_ROOT_CATEGORY_ID } from "../pages/admin/product_masters";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { ClassEditPage } from "../pages/admin/m03_09_class_edit";
import { ShelfNumberPage } from "../pages/admin/m03_21_shelf_number";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { ShortTagPage } from "../pages/admin/short_tag";
import { Actor, buildInstruction, ensureActor } from "./m04-25";
import { 入庫して承認する } from "../pages/admin/m04_33_stock_in";

// ---------------------------------------------------------------- 店舗・管理者

export const 出庫元 = "5";
export const 本店3F = "1";
export const 支店 = "13";
// 2026-11-13 試験店舗の使い回しで編集できる店舗が 1・5・13 だけになったので、前の試験管理者（本店2F（M04-33）も編集できる）とは別の名前で作る
export const M0433_ADMIN: Actor = { 名前: rcFixed("M04-33試験管理者3店"), account: { loginId: rcFixed("m0433_admin3").toLowerCase(), password: "Passw0rd!M0433" } };
const 承認者: Actor = { 名前: rcFixed("M04-33承認者3店"), account: { loginId: rcFixed("m0433_apr3").toLowerCase(), password: "Passw0rd!M0433apr" } };
// 出庫承認申請の承認通知先の選択肢は「出庫元の店舗に所属するメンバー」だけ（アプリの作り）。本店所属の承認者は出ないので、出庫元（店舗ID 5）所属の承認者を別に作る（正本の外の補い・2026-11-14）
const 出庫承認者: Actor = { 名前: rcFixed("M04-33出庫承認者"), account: { loginId: rcFixed("m0433_outapr").toLowerCase(), password: "Passw0rd!M0433out" } };

/** 店舗ID 1・13 の、書き換える前の高額商品閾値（CONFIG のシードが控える。spec が戻すのに使う） */
export const 元の閾値 = new Map<string, [string, string, string]>();
/** 共有A・共有B の店舗ID */
export const 共有店舗ID: Record<"A" | "B", string> = { A: "", B: "" };

/** 本店2F・本店B2F（共有A・共有B）は使わない（試験店舗の使い回し・2026-11-13）。使うケースは流さない */
const 共有の店舗は無い = (k: string): never => { throw new Error(`共有${k} の店舗（本店2F・本店B2F）は用意しない（試験店舗の使い回し・2026-11-13 依頼者決定。使うケースは流さない）`); };

defineSeed("S-M04-33-CONFIG", async ({ seed, notes }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  for (const id of [本店3F, 支店]) if (!元の閾値.has(id)) 元の閾値.set(id, 店舗の高額商品閾値(id));
  issue(`店舗ID 1・13 の高額商品閾値（書き換える前）: 1=${元の閾値.get(本店3F)!.join("/")}・13=${元の閾値.get(支店)!.join("/")}。ケースが終わるたびにこの値へ戻す`);
  // 本店2F・本店B2F は作らない（試験店舗の使い回し・2026-11-13 依頼者決定）。シード表が控えると定める呼び名には、用意しないことを書いた文を控える。
  // この呼び名を使うケース（005・043・046・049）は流さない（流すケースはこの呼び名を読まない）
  notes.set("〔店舗ID-M0433-共有A〕", "（本店2Fは用意しない。試験店舗の使い回しで、本店2Fを使うケースは流さない）");
  notes.set("〔店舗ID-M0433-共有B〕", "（本店B2Fは用意しない。試験店舗の使い回しで、本店B2Fを使うケースは流さない）");
  issue("本店2F・本店B2F は作らない（試験店舗の使い回し・2026-11-13 依頼者決定）。〔店舗ID-M0433-共有A〕・〔店舗ID-M0433-共有B〕には店舗IDの代わりに「用意しない」と書いた文を控えた（正本の外の補い）");
});

let 管理者あり = false;
defineSeed("S-M04-33-ADM", { needs: ["S-M04-33-CONFIG"] }, async ({ browser }) => {
  if (管理者あり) return;
  const 店舗 = [本店3F, 出庫元, 支店];
  await ensureActor(browser, M0433_ADMIN, { 所属店舗ID: 本店3F, 編集可能店舗ID: 店舗, email: `${M0433_ADMIN.account.loginId}@example.test` });
  await ensureActor(browser, 承認者, { 所属店舗ID: 本店3F, 編集可能店舗ID: 店舗, email: `${承認者.account.loginId}@example.test` });
  await ensureActor(browser, 出庫承認者, { 所属店舗ID: 出庫元, 編集可能店舗ID: 店舗, email: `${出庫承認者.account.loginId}@example.test` });
  管理者あり = true;
});

// ---------------------------------------------------------------- 商品・在庫・在庫移動

/** 名前の中の「M0433-…」の部分ごとに印を付ける。無ければ末尾に付ける */
export function 印つきの名前(名前: string): string {
  const out = 名前.replace(/M0433-[A-Z0-9]+(?:-[A-Z0-9]+)*/g, (t) => rc(t));
  return out === 名前 ? rc(名前) : out;
}

export type 入庫先 = "本店3F" | "共有A" | "共有B" | "支店";
export type 品 = {
  記号: string; 商品コード: string; 商品名: string; 基準価格: number; 販売価格?: number; セール?: boolean;
  サプライ: boolean; 略称?: string; 棚番号?: string; 数量: number; 入庫先: 入庫先;
  /** 略称タグの並び順・アルファベット順ソートフラグ（同じ略称の品は1つの略称タグを使う。省略すると並び順1・OFF） */
  略称並び順?: string; 略称アルファベット?: boolean;
  /** 棚番号の並び順（同じ棚番号の品は1つの棚番号を使う。省略すると1） */
  棚並び順?: string;
  /** 言語コード（グッズ商品CSVの言語(ID)。省略すると CSV に入れない） */
  言語?: string;
  /** 状態コード（グッズ商品CSVは NM の規格を作る。NM 以外は E2E の商品規格だけ DB で書き換える） */
  状態?: string;
  /** カード（依頼者決定 2026-11-14「マスタは作ってよい」。印つきの試験用カードを作り、商品登録編集の「カード指定」で紐づける） */
  カード?: { 英名?: string; レアリティ?: string; Foil?: "なし" | "通常" | "特殊"; カード番号?: string; 色順?: string };
};
export type ケースの定め = { 番号: string; 日時: string; 品: 品[] };

const 入庫先の店舗ID = (k: 入庫先): string => (k === "本店3F" ? 本店3F : k === "支店" ? 支店 : 共有の店舗は無い(k === "共有A" ? "A" : "B"));
const 店名 = new Map<string, string>();
async function 店名を読む(browser: Browser, id: string): Promise<string> {
  if (!店名.has(id)) 店名.set(id, await withAdminSession(browser, SETUP_ADMIN, (page) => storeNameById(page, id)));
  return 店名.get(id)!;
}

/** このシードが作った商品（正本の商品コード → 商品ID・商品規格ID・在庫移動ID） */
export const 作ったもの = new Map<string, { 商品ID: string; 商品規格ID: string; 在庫移動ID: string; 商品名: string }>();

async function 作る(ctx: SeedCtx, d: ケースの定め): Promise<void> {
  const { browser, notes, seed } = ctx;
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 定め = getSeed(seedId).状態・属性 + getSeed(seedId).投入方法;
  const 控える = (呼び名: string, 値: string) => { if (定め.includes(呼び名)) notes.set(呼び名, 値); };
  const 末尾 = (p: 品) => (d.品.length === 1 ? "" : p.記号);
  const 略称ID = new Map<string, string>();

  await withAdminSession(browser, M0433_ADMIN.account, async (page) => {
    page.setDefaultTimeout(90_000);
    // 略称タグ（同じ名前の品は1つの略称タグを使う）
    const 略称の名前ID = new Map<string, string>();
    for (const p of d.品.filter((x) => x.略称)) {
      if (!略称の名前ID.has(p.略称!)) {
        const st = new ShortTagPage(page);
        await st.openNew();
        const id = await st.register({ 名称: 印つきの名前(p.略称!), 並び順: p.略称並び順 ?? "1", アルファベット順: p.略称アルファベット ?? false }, `${seedId}: 略称タグ「${p.略称}」の登録`);
        略称の名前ID.set(p.略称!, id);
      }
      const id = 略称の名前ID.get(p.略称!)!;
      略称ID.set(p.記号, id);
      控える(`〔略称タグID-M0433-${d.番号}${末尾(p)}〕`, id);
      控える(`〔略称タグID-M0433-${d.番号}〕`, id);
    }
    // 棚番号（入力チェックを通る名前で登録し、E2E の棚番号の名前だけ正本の名前に書き換える）
    const 作った棚 = new Set<string>();
    for (const p of d.品.filter((x) => x.棚番号)) {
      if (作った棚.has(p.棚番号!)) continue;
      作った棚.add(p.棚番号!);
      const shelf = new ShelfNumberPage(page);
      await shelf.openNew();
      let tmp = "";
      for (let i = 0; i < 40; i++) { const c = `Q-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`; if (!棚番号の名前がある(c)) { tmp = c; break; } }
      if (!tmp) throw new Error(`${seedId}: 使われていない棚番号の名前を選べない`);
      const shelfId = await shelf.register({ 名称: tmp, 並び順: p.棚並び順 ?? "1" }, `${seedId}: 棚番号「${tmp}」の登録`);
      棚番号の名前を書き換える(`${seedId}: 棚番号の名前を ${p.棚番号} にする（入力チェックを通らない名前）`, shelfId, tmp, 印つきの名前(p.棚番号!));
      issue(`棚番号「${p.棚番号}」は名前の入力チェックを通らないので、「${tmp}」で画面から登録し、その棚番号の名前だけ DB で「${印つきの名前(p.棚番号!)}」に書き換えた`);
    }
    // グッズ商品CSV登録
    const region = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId: GOODS_ROOT_CATEGORY_ID,
      common: { ...region },
      lines: d.品.map((p) => ({
        code: rc(p.商品コード), nameJp: 印つきの名前(p.商品名), nameEn: 印つきの名前(p.商品名),
        values: {
          "基準価格": String(p.基準価格), "販売価格": String(p.基準価格), "買取価格": "10", "原価単価": "10",
          "商品カテゴリ(ID)": p.サプライ ? GOODS_ROOT_CATEGORY_ID : "5",
          ...(略称ID.has(p.記号) ? { "略称タグ(ID)": 略称ID.get(p.記号)! } : {}),
          ...(p.言語 ? { "言語(ID)": 言語コードのID(p.言語) } : {}),
        },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    issue("サプライかどうかはカテゴリの番号2・4に直接入っているかで決まるので、サプライの商品は番号2、サプライ以外は番号5で取り込んだ（商品登録編集画面での付け替えの代わり）");
    // 商品ID・商品規格ID、商品規格の編集（セール・棚番号）
    for (const p of d.品) {
      const code = rc(p.商品コード);
      const 商品ID = await openProductEditByCode(page, code);
      const ids = 商品規格ID(code);
      if (ids.length !== 1) throw new Error(`${seedId}: 商品コード ${code} の商品規格が ${ids.length} 件（1件のはず）`);
      if (p.セール || p.棚番号) {
        const ce = new ClassEditPage(page);
        await ce.編集で開く(商品ID, ids[0]);
        if (p.セール) { await ce.セールフラグ.check(); await ce.販売価格.fill(String(p.販売価格 ?? p.基準価格)); }
        if (p.棚番号) await chooseByLabel(page.locator("#admin_product_class_ShelfNumber"), 印つきの名前(p.棚番号));
        if (!(await ce.部門.inputValue())) await ce.部門.selectOption({ index: 1 });
        await ce.登録を押す();
        await expectSaved(page, `${seedId}: 商品規格 ${code} の登録（${[p.セール ? "セール" : "", p.棚番号 ? "棚番号" : ""].filter(Boolean).join("・")}）`);
      }
      作ったもの.set(p.商品コード, { 商品ID, 商品規格ID: ids[0], 在庫移動ID: "", 商品名: 印つきの名前(p.商品名) });
      控える(`〔商品ID-M0433-${d.番号}${末尾(p)}〕`, 商品ID);
      控える(`〔商品規格ID-M0433-${d.番号}${末尾(p)}〕`, ids[0]);
    }
  });

  // カード（印つきの試験用カードを作り、商品登録編集の「カード指定」で紐づける。依頼者決定 2026-11-14「マスタは作ってよい」）
  const カード付き = d.品.filter((p) => p.カード);
  if (カード付き.length > 0) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const p of カード付き) {
        const c = p.カード!;
        const 名 = rc(p.商品コード);
        const 英名 = c.英名 ? rc(c.英名) : 名;
        const カードID = await カードを登録する(page, {
          カード名日: 名, カード名英: 英名, 点数で見たマナ: "0", 色順: c.色順,
          詳細: { レアリティ: c.レアリティ, Foil: c.Foil ?? "なし", カード番号: c.カード番号 },
        }, `${seedId}: ${名} のカードの登録`, issue);
        const ids = await カード詳細IDs(page);
        if (ids.length !== 1) throw new Error(`${seedId}: ${名} のカードのカード詳細が ${ids.length} 件（1件のはず）`);
        const m = 作ったもの.get(p.商品コード)!;
        await assignCardOnProductEdit(page, { productId: m.商品ID, cardNameJp: 名, cardDetailId: ids[0], productNameJp: m.商品名, productNameEn: m.商品名 }, issue);
        控える(`〔カードID-M0433-${d.番号}${末尾(p)}〕`, カードID);
        控える(`〔カード詳細ID-M0433-${d.番号}${末尾(p)}〕`, ids[0]);
      }
    });
    issue(`印つきの試験用カードを ${カード付き.length} 枚作り（${カード付き.map((p) => `${rc(p.商品コード)}: 英語名 ${p.カード!.英名 ? rc(p.カード!.英名) : rc(p.商品コード)}・レアリティ ${p.カード!.レアリティ ?? "選択肢の先頭"}・Foil ${p.カード!.Foil ?? "なし"}${p.カード!.カード番号 ? `・コレクター番号 ${p.カード!.カード番号}` : ""}${p.カード!.色順 ? `・色順 ${p.カード!.色順}` : ""}`).join("／")}）、商品登録編集の「カード指定」で紐づけた（依頼者決定 2026-11-14「マスタは作ってよい」）`);
  }
  // 状態（グッズ商品CSVは NM の規格を作り、商品規格の編集画面では状態を選べないので、E2E の商品規格だけ DB で書き換える）
  for (const p of d.品.filter((x) => x.状態 && x.状態 !== "NM")) {
    const id = 作ったもの.get(p.商品コード)!.商品規格ID;
    商品規格の状態を書き換える(`${seedId}: 商品規格 ${id} の状態を ${p.状態} にする（画面で選べない）`, id, p.状態!);
    if (商品規格の状態(id) !== p.状態) throw new Error(`${seedId}: 商品規格 ${id} の状態が ${商品規格の状態(id)}（${p.状態} のはず）`);
    issue(`商品規格 ${id}（${rc(p.商品コード)}）の状態を DB で ${p.状態} にした（グッズ商品CSV登録は NM の規格を作り、商品規格の編集画面では状態を選べない。E2E の商品規格だけ）`);
  }

  // 入庫（入庫先に10・出庫元に移動点数。在庫変更CSV登録と別のメンバーの承認）
  const 出庫元の店名 = await 店名を読む(browser, 出庫元);
  await 入庫して承認する(browser, seedId, {
    registrant: M0433_ADMIN, approver: 承認者, 店舗ID: 出庫元, 店名: 出庫元の店名,
    行: d.品.map((p) => ({ 商品コード: rc(p.商品コード), 在庫増減数: p.数量, 仕入単価: 10 })),
  });
  for (const k of [...new Set(d.品.map((p) => p.入庫先))]) {
    const id = 入庫先の店舗ID(k);
    await 入庫して承認する(browser, seedId, {
      registrant: M0433_ADMIN, approver: 承認者, 店舗ID: id, 店名: await 店名を読む(browser, id),
      行: d.品.filter((p) => p.入庫先 === k).map((p) => ({ 商品コード: rc(p.商品コード), 在庫増減数: 10, 仕入単価: 10 })),
    });
  }

  // 在庫移動（入庫先ごとに在庫移動指示を作り、送り状No.を登録して移動中にする）
  for (const k of [...new Set(d.品.map((p) => p.入庫先))]) {
    const ps = d.品.filter((p) => p.入庫先 === k);
    const local = new Notes();
    await buildInstruction({ browser, notes: local, seed }, {
      出庫元: { 店舗ID: 出庫元, 店名: 出庫元の店名 }, 入庫先: { 店舗ID: 入庫先の店舗ID(k) },
      operator: M0433_ADMIN, approver: 出庫承認者,
      moves: ps.map((p) => ({ 方法: "csv" as const, 行: [{ 商品コード: rc(p.商品コード), 移動点数: p.数量 }], 呼び名: `〔在庫移動-${p.記号}〕` })),
      呼び名: "〔在庫移動指示〕", 送り状No: `TRACK-M0433-${d.番号}`,
    });
    for (const p of ps) 作ったもの.get(p.商品コード)!.在庫移動ID = local.get(`〔在庫移動-${p.記号}〕`);
  }

  // 作成日時（画面で指定できない）を DB で書き換え、明細ID・入庫先の在庫IDを控える
  const moveIds = d.品.map((p) => 作ったもの.get(p.商品コード)!.在庫移動ID);
  在庫移動の作成日時を書き換える(`${seedId}: 在庫移動の作成日時を ${d.日時} にする（画面で指定できない）`, moveIds, d.日時);
  for (const id of moveIds) if (在庫移動の作成日時(id) !== d.日時) throw new Error(`${seedId}: 在庫移動 ${id} の作成日時が ${在庫移動の作成日時(id)}（${d.日時} のはず）`);
  issue(`在庫移動 ${moveIds.join("・")} の作成日時を DB で ${d.日時} にした（E2E の在庫移動だけ）`);
  for (const p of d.品) {
    const m = 作ったもの.get(p.商品コード)!;
    控える(`〔在庫移動ID-M0433-${d.番号}${末尾(p)}〕`, m.在庫移動ID);
    const det = 在庫移動の明細(m.在庫移動ID);
    if (det.length !== 1) throw new Error(`${seedId}: 在庫移動 ${m.在庫移動ID} の明細が ${det.length} 件（1件のはず）`);
    控える(`〔明細ID-M0433-${d.番号}${末尾(p)}〕`, det[0].明細ID);
    控える(`〔入庫先実在庫ID-M0433-${d.番号}${末尾(p)}〕`, det[0].入庫先在庫ID);
  }
}

function ケース(seedId: string, d: ケースの定め): void {
  defineSeed(seedId, { needs: ["S-M04-33-ADM", "S-M04-33-CONFIG"] }, async (ctx) => { await 作る(ctx, d); });
}
const 品 = (記号: string, 番号: string, 名前: string, 基準価格: number, 追加: Partial<品> = {}): 品 =>
  ({ 記号, 商品コード: `M0433-P${番号}-${記号}`, 商品名: 名前, 基準価格, サプライ: false, 数量: 1, 入庫先: "本店3F", ...追加 });

ケース("S-M04-33-THRESHOLD-003", { 番号: "003", 日時: "2033-04-03 10:00:00", 品: [
  品("A", "003", "閾値99商品-003", 99), 品("B", "003", "閾値100商品-003", 100), 品("C", "003", "閾値200商品-003", 200),
  品("D", "003", "閾値300商品-003", 300), 品("E", "003", "サプライ商品-003", 150, { サプライ: true }),
] });
ケース("S-M04-33-SALE-004", { 番号: "004", 日時: "2033-04-04 10:00:00", 品: [品("A", "004", "セール価格確認カード", 4800, { セール: true, 販売価格: 3000 })] });
ケース("S-M04-33-STORES-005", { 番号: "005", 日時: "2033-04-05 10:00:00", 品: [
  品("A", "005", "3F閾値商品-005", 2500, { 入庫先: "本店3F" }), 品("B", "005", "2F閾値商品-005", 2500, { 入庫先: "共有A" }),
  品("C", "005", "B2F閾値商品-005", 2500, { 入庫先: "共有B" }), 品("D", "005", "支店閾値商品-005", 2500, { 入庫先: "支店" }),
] });
ケース("S-M04-33-4800-006", { 番号: "006", 日時: "2033-04-06 10:00:00", 品: [品("A", "006", "3F境界下カード-006", 4799), 品("B", "006", "3F境界値カード-006", 4800)] });
ケース("S-M04-33-THRESHOLD-SORT-012", { 番号: "012", 日時: "2033-04-12 10:00:00", 品: [
  品("A", "012", "高額商品-012", 250), 品("B", "012", "低額商品-012", 50), 品("C", "012", "中額商品-012", 150),
  品("D", "012", "サプライ商品-012", 150, { サプライ: true }),
] });
ケース("S-M04-33-QTY1-037", { 番号: "037", 日時: "2033-04-07 10:00:00", 品: [品("A", "037", "数量1確認カード", 3000)] });
const サプライ = (番号: string, 日時: string, 基準価格: number, 入庫先: 入庫先, 名前に略称: boolean): ケースの定め => ({
  番号, 日時, 品: [品("A", 番号, `スリーブM0433-CB${番号}-A${名前に略称 ? `[M0433-CB${番号}-TAG]` : "[注記]"}`, 基準価格, {
    サプライ: true, 略称: `M0433-CB${番号}-TAG`, 棚番号: `M0433-SH-CB${番号}`, 入庫先,
  })],
});
ケース("S-M04-33-CBSUPPLY-038", サプライ("038", "2033-05-07 10:00:00", 150, "本店3F", true));
ケース("S-M04-33-CBSUPPLY-039", サプライ("039", "2033-05-08 10:00:00", 150, "本店3F", false));
ケース("S-M04-33-CBSUPPLY-040", サプライ("040", "2033-05-09 10:00:00", 750, "支店", true));
ケース("S-M04-33-CBSUPPLY-041", サプライ("041", "2033-05-10 10:00:00", 750, "支店", false));
ケース("S-M04-33-CBSUPPLY-043", サプライ("043", "2033-05-12 10:00:00", 350, "共有A", false));
ケース("S-M04-33-CBSUPPLY-046", サプライ("046", "2033-05-15 10:00:00", 550, "共有B", true));
ケース("S-M04-33-CBSUPPLY-049", サプライ("049", "2033-05-18 10:00:00", 450, "共有A", true));

// ---------------------------------------------------------------- カードのマスタを使う並び順のケース（依頼者決定 2026-11-14「マスタは作ってよい」）
// どの品も、カード（レアリティ M＝神話レア・非Foil）・言語 JP・状態 NM・基準価格150・入庫先 本店3F が既定。ケースが変える属性だけを上書きする。
const M = "神話レア";
const カード品 = (記号: string, 番号: string, 名前: string, 追加: Partial<品> = {}, カード: 品["カード"] = {}): 品 =>
  品(記号, 番号, 名前, 150, { 言語: "JP", 略称: `M0433-COM-${番号}`, 棚番号: `M0433-SH-COM-${番号}`, ...追加, カード: { レアリティ: M, Foil: "なし", ...カード } });

ケース("S-M04-33-SHELF-SORT-013", { 番号: "013", 日時: "2033-04-13 10:00:00", 品: [
  カード品("A", "013", "棚B商品-013", { 棚番号: "3F-B02", 棚並び順: "2" }),
  カード品("B", "013", "棚A商品-013", { 棚番号: "3F-A01", 棚並び順: "1" }),
] });
ケース("S-M04-33-BRANCH-SORT-014", { 番号: "014", 日時: "2033-04-14 10:00:00", 品: [
  カード品("A", "014", "支店JPカード", { 棚番号: "B02", 棚並び順: "2", 言語: "JP", 入庫先: "支店" }),
  カード品("B", "014", "支店ENカード", { 棚番号: "A01", 棚並び順: "1", 言語: "EN", 入庫先: "支店" }),
] });
ケース("S-M04-33-LANGUAGE-SORT-015", { 番号: "015", 日時: "2033-04-15 10:00:00", 品: [
  カード品("A", "015", "言語FRカード", { 言語: "FR" }), カード品("B", "015", "言語ENカード", { 言語: "EN" }), カード品("C", "015", "言語JPカード", { 言語: "JP" }),
] });
ケース("S-M04-33-CONDITION-SORT-016", { 番号: "016", 日時: "2033-04-16 10:00:00", 品: [
  カード品("A", "016", "状態HPカード", { 状態: "HP" }), カード品("B", "016", "状態NMカード", { 状態: "NM" }),
] });
ケース("S-M04-33-FOIL-SORT-017", { 番号: "017", 日時: "2033-04-17 10:00:00", 品: [
  カード品("A", "017", "Foilカード", {}, { Foil: "通常" }), カード品("B", "017", "非Foilカード", {}, { Foil: "なし" }),
] });
ケース("S-M04-33-ABBR-SORT-018", { 番号: "018", 日時: "2033-04-18 10:00:00", 品: [
  カード品("A", "018", "略称BBB商品-018", { 略称: "BBB", 略称並び順: "2" }), カード品("B", "018", "略称AAA商品-018", { 略称: "AAA", 略称並び順: "1" }),
] });
ケース("S-M04-33-RARITY-SORT-019", { 番号: "019", 日時: "2033-04-19 10:00:00", 品: [
  カード品("A", "019", "レアリティC商品-019", {}, { レアリティ: "コモン" }), カード品("B", "019", "レアリティM商品-019", {}, { レアリティ: M }),
] });
ケース("S-M04-33-COLOR-SORT-020", { 番号: "020", 日時: "2033-04-20 10:00:00", 品: [
  カード品("A", "020", "赤商品-020", {}, { 色順: "赤" }), カード品("B", "020", "青商品-020", {}, { 色順: "青" }),
] });
ケース("S-M04-33-COLLECTOR-SORT-021", { 番号: "021", 日時: "2033-04-21 10:00:00", 品: [
  カード品("A", "021", "コレクター010商品-021", { 略称: "COL", 略称アルファベット: false }, { カード番号: "010" }),
  カード品("B", "021", "コレクター002商品-021", { 略称: "COL", 略称アルファベット: false }, { カード番号: "002" }),
] });
ケース("S-M04-33-ALPHA-SORT-022", { 番号: "022", 日時: "2033-04-22 10:00:00", 品: [
  カード品("A", "022", "Zulu商品-022", { 略称: "ALP", 略称アルファベット: true }, { 英名: "Zulu Card" }),
  カード品("B", "022", "Alpha商品-022", { 略称: "ALP", 略称アルファベット: true }, { 英名: "Alpha Card" }),
] });

// 並び順の優先順位（028〜036）
const 優先 = (番号: string, 日時: string, 品々: 品[]): ケースの定め => ({ 番号, 日時, 品: 品々 });
ケース("S-M04-33-PRIORITY-THRESH-028", 優先("028", "2033-04-28 10:00:00", [
  カード品("A", "028", "高額商品-028", { 基準価格: 250, 略称: "M0433-028-COM", 棚番号: "M0433-SH-028-A", 棚並び順: "1" }),
  カード品("B", "028", "低額商品-028", { 略称: "M0433-028-COM", 棚番号: "M0433-SH-028-B", 棚並び順: "2" }),
]));
ケース("S-M04-33-PRIORITY-SHELF-029", 優先("029", "2033-04-29 10:00:00", [
  カード品("A", "029", "英語商品-029", { 言語: "EN", 略称: "M0433-029-COM", 棚番号: "M0433-SH-029-A", 棚並び順: "1" }),
  カード品("B", "029", "日本語商品-029", { 言語: "JP", 略称: "M0433-029-COM", 棚番号: "M0433-SH-029-B", 棚並び順: "2" }),
]));
ケース("S-M04-33-PRIORITY-FOIL-030", 優先("030", "2033-04-30 10:00:00", [
  カード品("A", "030", "Foil商品-030", { 略称: "M0433-030-AAA", 略称並び順: "1", 棚番号: "M0433-SH-030" }, { Foil: "通常" }),
  カード品("B", "030", "非Foil商品-030", { 略称: "M0433-030-ZZZ", 略称並び順: "2", 棚番号: "M0433-SH-030" }, { Foil: "なし" }),
]));
ケース("S-M04-33-PRIORITY-RARITY-031", 優先("031", "2033-05-01 10:00:00", [
  カード品("A", "031", "赤M商品-031", { 略称: "M0433-031-COM", 棚番号: "M0433-SH-031" }, { 色順: "赤", レアリティ: M }),
  カード品("B", "031", "青C商品-031", { 略称: "M0433-031-COM", 棚番号: "M0433-SH-031" }, { 色順: "青", レアリティ: "コモン" }),
]));
ケース("S-M04-33-PRIORITY-LANG-COND-032", 優先("032", "2033-05-02 10:00:00", [
  カード品("A", "032", "英語NM商品-032", { 言語: "EN", 状態: "NM", 略称: "M0433-032-COM", 棚番号: "M0433-SH-032" }),
  カード品("B", "032", "日本語HP商品-032", { 言語: "JP", 状態: "HP", 略称: "M0433-032-COM", 棚番号: "M0433-SH-032" }),
]));
ケース("S-M04-33-PRIORITY-COND-FOIL-033", 優先("033", "2033-05-03 10:00:00", [
  カード品("A", "033", "NMFoil商品-033", { 状態: "NM", 略称: "M0433-033-COM", 棚番号: "M0433-SH-033" }, { Foil: "通常" }),
  カード品("B", "033", "HP非Foil商品-033", { 状態: "HP", 略称: "M0433-033-COM", 棚番号: "M0433-SH-033" }, { Foil: "なし" }),
]));
ケース("S-M04-33-PRIORITY-ABBR-RARITY-034", 優先("034", "2033-05-04 10:00:00", [
  カード品("A", "034", "略称AAAのC商品-034", { 略称: "M0433-034-AAA", 略称並び順: "1", 棚番号: "M0433-SH-034" }, { レアリティ: "コモン" }),
  カード品("B", "034", "略称BBBのM商品-034", { 略称: "M0433-034-BBB", 略称並び順: "2", 棚番号: "M0433-SH-034" }, { レアリティ: M }),
]));
ケース("S-M04-33-PRIORITY-COLOR-COLLECTOR-035", 優先("035", "2033-05-05 10:00:00", [
  カード品("A", "035", "赤002商品-035", { 略称: "M0433-035-COL", 略称アルファベット: false, 棚番号: "M0433-SH-035" }, { 色順: "赤", カード番号: "002" }),
  カード品("B", "035", "青010商品-035", { 略称: "M0433-035-COL", 略称アルファベット: false, 棚番号: "M0433-SH-035" }, { 色順: "青", カード番号: "010" }),
]));
ケース("S-M04-33-PRIORITY-COLOR-ALPHA-036", 優先("036", "2033-05-06 10:00:00", [
  カード品("A", "036", "赤Alpha商品-036", { 略称: "M0433-036-ALP", 略称アルファベット: true, 棚番号: "M0433-SH-036" }, { 色順: "赤", 英名: "Alpha Card" }),
  カード品("B", "036", "青Zulu商品-036", { 略称: "M0433-036-ALP", 略称アルファベット: true, 棚番号: "M0433-SH-036" }, { 色順: "青", 英名: "Zulu Card" }),
]));

// 非サプライの1行（042・047・048。044・045 は共有A／B の店舗なので作らない）
const 非サプライ = (番号: string, 日時: string, 基準価格: number, 入庫先: 入庫先, 名前に略称: boolean): ケースの定め => ({
  番号, 日時, 品: [カード品("A", 番号, `戻しカードM0433-CB${番号}-A${名前に略称 ? `[M0433-CB${番号}-TAG]` : "[注記]"}`, {
    基準価格, 入庫先, 略称: `M0433-CB${番号}-TAG`, 棚番号: `M0433-SH-CB${番号}`,
  })],
});
ケース("S-M04-33-CBPRODUCT-042", 非サプライ("042", "2033-05-11 10:00:00", 150, "本店3F", true));
ケース("S-M04-33-CBPRODUCT-047", 非サプライ("047", "2033-05-16 10:00:00", 750, "支店", true));
ケース("S-M04-33-CBPRODUCT-048", 非サプライ("048", "2033-05-17 10:00:00", 850, "支店", false));

// 支店の並び（050〜057）。甲（A）と乙（B）
const 支店2 = (番号: string, 日時: string, 甲: Partial<品>, 乙: Partial<品>, 甲カード: 品["カード"] = {}, 乙カード: 品["カード"] = {}): ケースの定め => ({
  番号, 日時, 品: [
    カード品("A", 番号, `戻し甲M0433-CB${番号}-A`, { 基準価格: 750, 入庫先: "支店", 略称: `M0433-CB${番号}-TAG`, 棚番号: `M0433-SH-CB${番号}-A`, ...甲 }, 甲カード),
    カード品("B", 番号, `戻し乙M0433-CB${番号}-B`, { 基準価格: 750, 入庫先: "支店", 略称: `M0433-CB${番号}-TAG`, 棚番号: `M0433-SH-CB${番号}-B`, ...乙 }, 乙カード),
  ],
});
ケース("S-M04-33-CBBAND-050", 支店2("050", "2033-05-19 10:00:00", { 基準価格: 850 }, {}));
ケース("S-M04-33-CBCONDITION-051", 支店2("051", "2033-05-20 10:00:00", { 状態: "HP" }, { 状態: "NM" }));
ケース("S-M04-33-CBFOIL-052", 支店2("052", "2033-05-21 10:00:00", {}, {}, { Foil: "通常" }, { Foil: "なし" }));
ケース("S-M04-33-CBTAG-053", 支店2("053", "2033-05-22 10:00:00", { 略称: "M0433-CB053-TB", 略称並び順: "2" }, { 略称: "M0433-CB053-TA", 略称並び順: "1" }));
ケース("S-M04-33-CBRARITY-054", 支店2("054", "2033-05-23 10:00:00", {}, {}, { レアリティ: "コモン" }, { レアリティ: M }));
ケース("S-M04-33-CBCOLOR-055", 支店2("055", "2033-05-24 10:00:00", {}, {}, { 色順: "赤" }, { 色順: "青" }));
ケース("S-M04-33-CBCOLLECTOR-056", 支店2("056", "2033-05-25 10:00:00", { 略称: "M0433-CB056-COL", 略称アルファベット: false }, { 略称: "M0433-CB056-COL", 略称アルファベット: false }, { カード番号: "010" }, { カード番号: "002" }));
ケース("S-M04-33-CBALPHA-057", 支店2("057", "2033-05-26 10:00:00", { 略称: "M0433-CB057-ALP", 略称アルファベット: true }, { 略称: "M0433-CB057-ALP", 略称アルファベット: true }, { 英名: "M0433-CB057-ZULU" }, { 英名: "M0433-CB057-ALPHA" }));
