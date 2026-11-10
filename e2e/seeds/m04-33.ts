/**
 * M04-33 戻しリストCSV の画面シード（カードのマスタを使わない 003〜006・012・037〜041・043・046・049）。正本: cases/M04-33_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順。画面で作り、画面で作れない状態だけ E2E の行に DB で書き足す。依頼者決定 2026-11-10）:
 * - S-M04-33-CONFIG: 店舗ID 1（入庫先「本店3F」）・5（出庫元）・13（支店）は開発環境の店舗をそのまま使う。本店2F・本店B2F は、
 *   店舗登録画面で「本店2F（M04-33）」「本店B2F（M04-33）」を一度だけ登録して使い回す（〔店舗ID-M0433-共有A〕・〔店舗ID-M0433-共有B〕）。
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
import { rc, RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 棚番号の名前を書き換える } from "../db/m04_01_x";
import { 在庫移動の作成日時, 在庫移動の作成日時を書き換える, 在庫移動の明細, 商品規格ID, 店舗の高額商品閾値, 棚番号の名前がある } from "../db/m04_33";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { GOODS_ROOT_CATEGORY_ID } from "../pages/admin/product_masters";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { ClassEditPage } from "../pages/admin/m03_09_class_edit";
import { ShelfNumberPage } from "../pages/admin/m03_21_shelf_number";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { createStore, findOpenStoreId, M0424StoreInput } from "../pages/admin/m04_24_store";
import { ShortTagPage } from "../pages/admin/short_tag";
import { Actor, buildInstruction, ensureActor, stockInByCsv } from "./m04-25";

// ---------------------------------------------------------------- 店舗・管理者

export const 出庫元 = "5";
export const 本店3F = "1";
export const 支店 = "13";
export const M0433_ADMIN: Actor = { 名前: rc("M04-33試験管理者"), account: { loginId: rc("m0433_admin").toLowerCase(), password: "Passw0rd!M0433" } };
const 承認者: Actor = { 名前: rc("M04-33承認者"), account: { loginId: rc("m0433_apr").toLowerCase(), password: "Passw0rd!M0433apr" } };

const 共有の店舗: Record<"A" | "B", M0424StoreInput> = {
  A: {
    店名: "本店2F（M04-33）", 店名カナ: "ホンテンニカイ", 店名英語: "M0433 2F", 支店URL: "m0433f2", 店名略称3文字: "Q3F", ショップ名略称: "本店2F",
    会社名: "株式会社M04-33試験", 会社名カナ: "カブシキガイシャシケン", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田1-1", 住所2: "2F", 電話番号: "0300000433",
  },
  B: {
    店名: "本店B2F（M04-33）", 店名カナ: "ホンテンチカニカイ", 店名英語: "M0433 B2F", 支店URL: "m0433b2", 店名略称3文字: "Q3B", ショップ名略称: "本店B2F",
    会社名: "株式会社M04-33試験", 会社名カナ: "カブシキガイシャシケン", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田1-1", 住所2: "B2F", 電話番号: "0300000433",
  },
};

/** 店舗ID 1・13 の、書き換える前の高額商品閾値（CONFIG のシードが控える。spec が戻すのに使う） */
export const 元の閾値 = new Map<string, [string, string, string]>();
/** 共有A・共有B の店舗ID */
export const 共有店舗ID: Record<"A" | "B", string> = { A: "", B: "" };

defineSeed("S-M04-33-CONFIG", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  for (const id of [本店3F, 支店]) if (!元の閾値.has(id)) 元の閾値.set(id, 店舗の高額商品閾値(id));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const k of ["A", "B"] as const) {
      const v = 共有の店舗[k];
      let id = await findOpenStoreId(page, v.店名, v.会社名);
      if (!id) {
        try { await createStore(page, v, "支店"); } catch (e) { issue(`店舗「${v.店名}」の登録の表示: ${(e as Error).message.split("\n")[0]}`); }
        id = await findOpenStoreId(page, v.店名, v.会社名);
        if (!id) throw new Error(`店舗「${v.店名}」を登録できない`);
        issue(`店舗「${v.店名}」を店舗登録画面で登録した（店舗ID ${id}。以後は使い回す）`);
      }
      共有店舗ID[k] = id;
    }
  });
  notes.set("〔店舗ID-M0433-共有A〕", 共有店舗ID.A);
  notes.set("〔店舗ID-M0433-共有B〕", 共有店舗ID.B);
  issue(`店舗ID 1・13 の高額商品閾値（書き換える前）: 1=${元の閾値.get(本店3F)!.join("/")}・13=${元の閾値.get(支店)!.join("/")}。ケースが終わるたびにこの値へ戻す`);
});

let 管理者あり = false;
defineSeed("S-M04-33-ADM", { needs: ["S-M04-33-CONFIG"] }, async ({ browser }) => {
  if (管理者あり) return;
  const 店舗 = [本店3F, 出庫元, 支店, 共有店舗ID.A, 共有店舗ID.B];
  await ensureActor(browser, M0433_ADMIN, { 所属店舗ID: 本店3F, 編集可能店舗ID: 店舗, email: `${M0433_ADMIN.account.loginId}@example.test` });
  await ensureActor(browser, 承認者, { 所属店舗ID: 本店3F, 編集可能店舗ID: 店舗, email: `${承認者.account.loginId}@example.test` });
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
};
export type ケースの定め = { 番号: string; 日時: string; 品: 品[] };

const 入庫先の店舗ID = (k: 入庫先): string => (k === "本店3F" ? 本店3F : k === "支店" ? 支店 : 共有店舗ID[k === "共有A" ? "A" : "B"]);
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
    // 略称タグ
    for (const p of d.品.filter((x) => x.略称)) {
      const st = new ShortTagPage(page);
      await st.openNew();
      const id = await st.register({ 名称: 印つきの名前(p.略称!), 並び順: "1", アルファベット順: false }, `${seedId}: 略称タグ「${p.略称}」の登録`);
      略称ID.set(p.記号, id);
      控える(`〔略称タグID-M0433-${d.番号}${末尾(p)}〕`, id);
    }
    // 棚番号（入力チェックを通る名前で登録し、E2E の棚番号の名前だけ正本の名前に書き換える）
    for (const p of d.品.filter((x) => x.棚番号)) {
      const shelf = new ShelfNumberPage(page);
      await shelf.openNew();
      let tmp = "";
      for (let i = 0; i < 40; i++) { const c = `Q-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`; if (!棚番号の名前がある(c)) { tmp = c; break; } }
      if (!tmp) throw new Error(`${seedId}: 使われていない棚番号の名前を選べない`);
      const shelfId = await shelf.register({ 名称: tmp, 並び順: "1" }, `${seedId}: 棚番号「${tmp}」の登録`);
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

  // 入庫（入庫先に10・出庫元に移動点数。在庫変更CSV登録と別のメンバーの承認）
  const 出庫元の店名 = await 店名を読む(browser, 出庫元);
  await stockInByCsv(browser, seedId, {
    registrant: M0433_ADMIN, approver: 承認者, 店舗ID: 出庫元, 店名: 出庫元の店名,
    行: d.品.map((p) => ({ 商品コード: rc(p.商品コード), 在庫増減数: p.数量, 仕入単価: 10 })),
  });
  for (const k of [...new Set(d.品.map((p) => p.入庫先))]) {
    const id = 入庫先の店舗ID(k);
    await stockInByCsv(browser, seedId, {
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
      operator: M0433_ADMIN, approver: 承認者,
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
