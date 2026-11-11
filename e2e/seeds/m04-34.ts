/**
 * M04-34 戻しリストPDF の画面シード（カードのマスタを使わない 001・003〜006・009・010・022・023・029〜045）。正本: cases/M04-34_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順。M04-33 と同じ部品で画面から作り、画面で作れない状態だけ E2E の行に DB で書き足す。依頼者決定 2026-11-10）:
 * - S-M04-34-ENV: ポップアップの許可。試験のブラウザは既定でポップアップを開ける（作るものは無い）。
 * - S-M04-34-CONFIG: 店舗ID 1（本店3F）・5（出庫元）・13（支店A）は開発環境の店舗をそのまま使う。高額商品閾値（金額閾値）は全員が使う設定なので、
 *   店舗ID 1・13 の今の値を控え、ケースの開始時に spec が書き換え、終わるたびに控えた値へ戻す（記録の「1本だけで流す」）。
 *   本店2F・本店B2F（034〜041）は、ケースごとに店舗を作らず、M04-33 と同じ「本店2F（M04-33）」「本店B2F（M04-33）」を使い回す（無ければ一度だけ登録する）。
 * - S-M04-34-ADM: 「M04-34試験管理者」。店舗ID 1・5・13・本店2F・本店B2F を編集できるシステム管理者。開発環境に手動テスト用の同じログインIDの
 *   メンバーがありうるので、ログインID・名前に実行の印を付ける。在庫の入庫・出庫の承認は、別のメンバー「M04-34承認者」（印つき）で行う（正本の外の補い）。
 * - ケースのシード: 棚番号（入力チェックを通る名前で登録し、E2E の棚番号の名前だけ DB で正本の名前に書き換える）→ グッズ商品CSV登録 →
 *   商品規格の編集（セール・棚番号・部門）→ 出庫元の在庫と入庫先の在庫10の入庫（在庫変更CSV登録と別のメンバーの承認）→
 *   在庫移動ごとに在庫移動CSV登録・承認申請・出庫承認・在庫移動指示作成・送り状No.の登録で「移動中」にする（seeds/m04-25.ts の buildInstruction）→
 *   在庫移動の作成日時を DB で正本の日時に書き換える（E2E の在庫移動だけ）。
 *
 * シードでの解釈（記録にも書く）:
 * - 商品カテゴリ: シード表は「サプライ・グッズで取り込み、サプライ以外は商品登録編集画面で単体カードのカテゴリに付け替える」。アプリはサプライかどうかを
 *   カテゴリの番号2・4（グッズ・予約グッズ）に直接入っているかで決めるので、サプライの商品は番号2、サプライ以外の商品は番号5（情報商材。
 *   グッズ商品CSVが受け付けるサプライ以外の番号）で取り込む（M04-33 と同じ。010 はシード表どおり情報商材）。
 * - 商品名・商品コード・棚番号の名前には実行の印を付ける。名前の中の「M0434-…」の部分ごとに印を付け、それ以外の名前は末尾に付ける。
 * - 在庫一覧から選んで在庫移動登録する手順は、在庫移動CSV登録で同じ商品・点数の在庫移動を作る（M04-33 と同じ部品）。
 * - 本店2F・本店B2F の代わりの店舗は店舗種別が支店（全員が使う本店の判定に関わるので本店にしない）。〔店舗ID-M0434-CB034〕などには使い回す店舗の店舗IDを控える。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
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
import { Actor, buildInstruction, ensureActor, stockInByCsv } from "./m04-25";
import { 共有の店舗を用意する } from "./m04-33";

// ---------------------------------------------------------------- 店舗・管理者

export const 出庫元 = "5";
export const 本店3F = "1";
export const 支店 = "13";
export const M0434_ADMIN: Actor = { 名前: rcFixed("M04-34試験管理者"), account: { loginId: rcFixed("m0434_admin").toLowerCase(), password: "Passw0rd!M0434" } };
const 承認者: Actor = { 名前: rcFixed("M04-34承認者"), account: { loginId: rcFixed("m0434_apr").toLowerCase(), password: "Passw0rd!M0434apr" } };

/** 店舗ID 1・13 の、書き換える前の高額商品閾値（CONFIG のシードが控える。spec が戻すのに使う） */
export const 元の閾値 = new Map<string, [string, string, string]>();
/** 本店2F・本店B2F の代わりに使い回す店舗の店舗ID */
export const 共有店舗ID: Record<"A" | "B", string> = { A: "", B: "" };

defineSeed("S-M04-34-ENV", async () => { /* 試験のブラウザは既定でポップアップを開ける。ケースごとの新しいブラウザセッションで始める */ });

defineSeed("S-M04-34-CONFIG", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  for (const id of [本店3F, 支店]) if (!元の閾値.has(id)) 元の閾値.set(id, 店舗の高額商品閾値(id));
  if (!共有店舗ID.A || !共有店舗ID.B) Object.assign(共有店舗ID, await 共有の店舗を用意する(browser, issue));
  issue(`本店2F・本店B2F の代わりに、店舗ID ${共有店舗ID.A}（本店2F（M04-33））・${共有店舗ID.B}（本店B2F（M04-33））を使い回す（店舗種別は支店）`);
  issue(`店舗ID 1・13 の高額商品閾値（書き換える前）: 1=${元の閾値.get(本店3F)!.join("/")}・13=${元の閾値.get(支店)!.join("/")}。ケースが終わるたびにこの値へ戻す`);
});

let 管理者あり = false;
defineSeed("S-M04-34-ADM", { needs: ["S-M04-34-CONFIG"] }, async ({ browser }) => {
  if (管理者あり) return;
  const 店舗 = [本店3F, 出庫元, 支店, 共有店舗ID.A, 共有店舗ID.B];
  await ensureActor(browser, M0434_ADMIN, { 所属店舗ID: 本店3F, 編集可能店舗ID: 店舗, email: `${M0434_ADMIN.account.loginId}@example.test` });
  await ensureActor(browser, 承認者, { 所属店舗ID: 本店3F, 編集可能店舗ID: 店舗, email: `${承認者.account.loginId}@example.test` });
  管理者あり = true;
});

// ---------------------------------------------------------------- 商品・在庫・在庫移動

/** 名前の中の「M0434-…」の部分ごとに印を付ける。無ければ末尾に付ける */
export function 印つきの名前(名前: string): string {
  const out = 名前.replace(/M0434-[A-Z0-9]+(?:-[A-Z0-9]+)*/g, (t) => rc(t));
  return out === 名前 ? rc(名前) : out;
}

export type 入庫先 = "本店3F" | "共有A" | "共有B" | "支店";
export type 品 = { 商品コード: string; 商品名: string; 基準価格: number; 販売価格?: number; セール?: boolean; サプライ: boolean; 棚番号?: string; 数量: number };
/** 在庫移動1件（呼び名は〔在庫移動・振替ID-M0434-…〕） */
export type 移動の定め = { 呼び名: string; 入庫先: 入庫先; 品: 品[] };
export type ケースの定め = { 番号: string; 日時: string; 移動: 移動の定め[]; 店舗の呼び名?: string };

export const 入庫先の店舗ID = (k: 入庫先): string => (k === "本店3F" ? 本店3F : k === "支店" ? 支店 : 共有店舗ID[k === "共有A" ? "A" : "B"]);
const 店名 = new Map<string, string>();
async function 店名を読む(browser: Browser, id: string): Promise<string> {
  if (!店名.has(id)) 店名.set(id, await withAdminSession(browser, SETUP_ADMIN, (page) => storeNameById(page, id)));
  return 店名.get(id)!;
}

/** このシードが作った商品（正本の商品コード → 商品名（印つき）・在庫移動ID） */
export const 作ったもの = new Map<string, { 商品名: string; 在庫移動ID: string }>();
/** このシードが作った在庫移動（呼び名 → 在庫移動ID） */
export const 作った移動 = new Map<string, string>();

async function 作る(ctx: SeedCtx, d: ケースの定め): Promise<void> {
  const { browser, notes, seed } = ctx;
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 定め = getSeed(seedId).状態・属性 + getSeed(seedId).投入方法;
  const 控える = (呼び名: string, 値: string) => {
    if (!定め.includes(呼び名)) throw new Error(`${seedId}: シード表に ${呼び名} が無い（作り方の定めの誤り）`);
    notes.set(呼び名, 値);
  };
  const 品々 = d.移動.flatMap((m) => m.品);

  await withAdminSession(browser, M0434_ADMIN.account, async (page) => {
    page.setDefaultTimeout(90_000);
    // 棚番号（入力チェックを通る名前で登録し、E2E の棚番号の名前だけ正本の名前に書き換える）
    for (const p of 品々.filter((x) => x.棚番号)) {
      const shelf = new ShelfNumberPage(page);
      await shelf.openNew();
      let tmp = "";
      for (let i = 0; i < 40; i++) { const c = `Q-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`; if (!棚番号の名前がある(c)) { tmp = c; break; } }
      if (!tmp) throw new Error(`${seedId}: 使われていない棚番号の名前を選べない`);
      const shelfId = await shelf.register({ 名称: tmp, 並び順: "1" }, `${seedId}: 棚番号「${tmp}」の登録`);
      棚番号の名前を書き換える(`${seedId}: 棚番号の名前を ${p.棚番号} にする（入力チェックを通らない名前）`, shelfId, tmp, 印つきの名前(p.棚番号!));
      issue(`棚番号「${p.棚番号}」は名前の入力チェックを通らないので、「${tmp}」で画面から登録し、その棚番号の名前だけ DB で「${印つきの名前(p.棚番号!)}」に書き換えた（棚番号IDは画面が振った番号）`);
    }
    // グッズ商品CSV登録
    const region = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId: GOODS_ROOT_CATEGORY_ID,
      common: { ...region },
      lines: 品々.map((p) => ({
        code: rc(p.商品コード), nameJp: 印つきの名前(p.商品名), nameEn: 印つきの名前(p.商品名),
        values: {
          "基準価格": String(p.基準価格), "販売価格": String(p.基準価格), "買取価格": "1000", "原価単価": "10",
          "商品カテゴリ(ID)": p.サプライ ? GOODS_ROOT_CATEGORY_ID : "5",
        },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    if (品々.some((p) => !p.サプライ)) issue("サプライかどうかはカテゴリの番号2・4に直接入っているかで決まるので、サプライ以外の商品は番号5で取り込んだ（商品登録編集画面での単体カードへの付け替えの代わり）");
    // 商品規格の編集（セール・棚番号）
    for (const p of 品々) {
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
      作ったもの.set(p.商品コード, { 商品名: 印つきの名前(p.商品名), 在庫移動ID: "" });
    }
  });

  // 入庫（出庫元に移動点数・入庫先に10。在庫変更CSV登録と別のメンバーの承認）
  const 出庫元の店名 = await 店名を読む(browser, 出庫元);
  await stockInByCsv(browser, seedId, {
    registrant: M0434_ADMIN, approver: 承認者, 店舗ID: 出庫元, 店名: 出庫元の店名,
    行: 品々.map((p) => ({ 商品コード: rc(p.商品コード), 在庫増減数: p.数量, 仕入単価: 10 })),
  });
  for (const k of [...new Set(d.移動.map((m) => m.入庫先))]) {
    const id = 入庫先の店舗ID(k);
    await stockInByCsv(browser, seedId, {
      registrant: M0434_ADMIN, approver: 承認者, 店舗ID: id, 店名: await 店名を読む(browser, id),
      行: d.移動.filter((m) => m.入庫先 === k).flatMap((m) => m.品).map((p) => ({ 商品コード: rc(p.商品コード), 在庫増減数: 10, 仕入単価: 10 })),
    });
  }

  // 在庫移動ごとに、在庫移動指示を作り、送り状No.を登録して移動中にする
  for (const [i, m] of d.移動.entries()) {
    const local = new Notes();
    await buildInstruction({ browser, notes: local, seed }, {
      出庫元: { 店舗ID: 出庫元, 店名: 出庫元の店名 }, 入庫先: { 店舗ID: 入庫先の店舗ID(m.入庫先) },
      operator: M0434_ADMIN, approver: 承認者,
      moves: [{ 方法: "csv" as const, 行: m.品.map((p) => ({ 商品コード: rc(p.商品コード), 移動点数: p.数量 })), 呼び名: "〔在庫移動〕" }],
      呼び名: "〔在庫移動指示〕", 送り状No: `TRACK-M0434-${d.番号}-${i + 1}`,
    });
    const id = local.get("〔在庫移動〕");
    作った移動.set(m.呼び名, id);
    for (const p of m.品) 作ったもの.get(p.商品コード)!.在庫移動ID = id;
  }

  // 作成日時（画面で指定できない）を DB で書き換え、在庫移動・振替IDを控える
  const moveIds = d.移動.map((m) => 作った移動.get(m.呼び名)!);
  在庫移動の作成日時を書き換える(`${seedId}: 在庫移動の作成日時を ${d.日時} にする（画面で指定できない）`, moveIds, d.日時);
  for (const id of moveIds) if (在庫移動の作成日時(id) !== d.日時) throw new Error(`${seedId}: 在庫移動 ${id} の作成日時が ${在庫移動の作成日時(id)}（${d.日時} のはず）`);
  issue(`在庫移動 ${moveIds.join("・")} の作成日時を DB で ${d.日時} にした（E2E の在庫移動だけ）`);
  for (const m of d.移動) {
    const id = 作った移動.get(m.呼び名)!;
    const det = 在庫移動の明細(id);
    const want = m.品.map((p) => rc(p.商品コード)).sort();
    if (det.map((x) => x.商品コード).sort().join("|") !== want.join("|")) {
      throw new Error(`${seedId}: 在庫移動 ${id} の明細の商品が ${det.map((x) => x.商品コード).join("・")}（${want.join("・")} のはず）`);
    }
    控える(m.呼び名, id);
  }
  if (d.店舗の呼び名) {
    const k = d.移動[0].入庫先;
    控える(d.店舗の呼び名, 入庫先の店舗ID(k));
    issue(`${d.店舗の呼び名} には、使い回す店舗「${k === "共有A" ? "本店2F（M04-33）" : "本店B2F（M04-33）"}」の店舗ID ${入庫先の店舗ID(k)} を控えた（正本はケースごとに店舗種別「本店」の店舗を作る。店舗種別は支店）`);
  }
}

function ケース(seedId: string, d: ケースの定め): void {
  defineSeed(seedId, { needs: ["S-M04-34-ADM", "S-M04-34-CONFIG"] }, async (ctx) => { await 作る(ctx, d); });
}
const 品 = (商品コード: string, 商品名: string, 基準価格: number, 追加: Partial<品> = {}): 品 => ({ 商品コード, 商品名, 基準価格, サプライ: false, 数量: 1, ...追加 });
const 移 = (key: string, 入庫先: 入庫先, 品々: 品[]): 移動の定め => ({ 呼び名: `〔在庫移動・振替ID-M0434-${key}〕`, 入庫先, 品: 品々 });

ケース("S-M04-34-SELECT-001", { 番号: "001", 日時: "2034-04-01 10:00:00", 移動: [
  移("001A", "本店3F", [品("M0434-P001-A", "選択商品A", 1000), 品("M0434-P001-B", "選択商品B", 1000)]),
  移("001B", "本店3F", [品("M0434-P001-C", "非選択商品-001", 1000)]),
] });
ケース("S-M04-34-THRESHOLD-003", { 番号: "003", 日時: "2034-04-03 10:00:00", 移動: [
  移("003", "本店3F", [品("M0434-P003-A", "境界下商品-003", 4799), 品("M0434-P003-B", "境界値商品-003", 4800)]),
] });
ケース("S-M04-34-THRESHOLD-004", { 番号: "004", 日時: "2034-04-04 10:00:00", 移動: [
  移("004A", "本店3F", [品("M0434-P004-A", "本店閾値超商品-004", 5500)]),
  移("004B", "支店", [品("M0434-P004-B", "支店閾値内商品-004", 5500)]),
] });
ケース("S-M04-34-THRESHOLD-005", { 番号: "005", 日時: "2034-04-05 10:00:00", 移動: [
  移("005", "本店3F", [品("M0434-P005-A", "セール中商品-005", 4800, { セール: true, 販売価格: 3000 })]),
] });
ケース("S-M04-34-THRESHOLD-006", { 番号: "006", 日時: "2034-04-06 10:00:00", 移動: [
  移("006", "本店3F", [品("M0434-P006-A", "低額商品-006", 1000), 品("M0434-P006-B", "高額商品-006", 7000), 品("M0434-P006-C", "サプライ商品-006", 2000, { サプライ: true })]),
] });
ケース("S-M04-34-DISPLAY-009", { 番号: "009", 日時: "2034-04-09 10:00:00", 移動: [
  移("009", "本店3F", [品("M0434-P009-A", "サプライ表示商品-009", 2000, { サプライ: true, 数量: 2 })]),
] });
ケース("S-M04-34-DISPLAY-010", { 番号: "010", 日時: "2034-04-10 10:00:00", 移動: [
  移("010", "本店3F", [品("M0434-P010-A", "非シングル商品-010", 3500)]),
] });
ケース("S-M04-34-SELECT-022", { 番号: "022", 日時: "2034-04-22 10:00:00", 移動: [
  移("022", "本店3F", [品("M0434-P022-A", "選択商品A", 3500), 品("M0434-P022-B", "選択商品B", 3500)]),
] });
ケース("S-M04-34-SELECT-023", { 番号: "023", 日時: "2034-04-23 10:00:00", 移動: [
  移("023", "本店3F", [品("M0434-P023-A", "選択商品A", 3500), 品("M0434-P023-B", "選択商品B", 3500)]),
] });
ケース("S-M04-34-SELECT-029", { 番号: "029", 日時: "2034-04-29 10:00:00", 移動: [
  移("029A", "本店3F", [品("M0434-P029-A", "複数選択商品A", 1000)]),
  移("029B", "本店3F", [品("M0434-P029-B", "複数選択商品B", 1000)]),
] });
ケース("S-M04-34-DISPLAY-030", { 番号: "030", 日時: "2034-04-30 10:00:00", 移動: [
  移("030", "本店3F", [品("M0434-P030-A", "数量1確認商品-030", 3500)]),
] });

/** 031〜044: 確認商品 M0434-CBxxx を1点だけ入れた在庫移動 */
function CB(seedId: string, 番号: string, 日: string, 入庫先: 入庫先, 基準価格: number, サプライ: boolean): void {
  const n = `CB${番号}`;
  ケース(seedId, {
    番号: n, 日時: `2034-05-${日} 10:00:00`,
    移動: [移(n, 入庫先, [品(`M0434-${n}-P`, `確認商品M0434-${n}`, 基準価格, { サプライ, 棚番号: `M0434-${n}-SH` })])],
    店舗の呼び名: 入庫先 === "共有A" || 入庫先 === "共有B" ? `〔店舗ID-M0434-${n}〕` : undefined,
  });
}
CB("S-M04-34-CB3FLOW-031", "031", "01", "本店3F", 50, false);
CB("S-M04-34-CB3FMID-032", "032", "02", "本店3F", 150, false);
CB("S-M04-34-CB3FSUP-033", "033", "03", "本店3F", 150, true);
CB("S-M04-34-CB2FLOW-034", "034", "04", "共有A", 50, false);
CB("S-M04-34-CB2FMID-035", "035", "05", "共有A", 150, false);
CB("S-M04-34-CB2FHIGH-036", "036", "06", "共有A", 250, false);
CB("S-M04-34-CB2FSUP-037", "037", "07", "共有A", 150, true);
CB("S-M04-34-CBB2FLOW-038", "038", "08", "共有B", 50, false);
CB("S-M04-34-CBB2FMID-039", "039", "09", "共有B", 150, false);
CB("S-M04-34-CBB2FHIGH-040", "040", "10", "共有B", 250, false);
CB("S-M04-34-CBB2FSUP-041", "041", "11", "共有B", 150, true);
CB("S-M04-34-CBBRMID-042", "042", "12", "支店", 150, false);
CB("S-M04-34-CBBRHIGH-043", "043", "13", "支店", 250, false);
CB("S-M04-34-CBBRSUP-044", "044", "14", "支店", 150, true);
ケース("S-M04-34-CBBAND-045", { 番号: "045", 日時: "2034-07-01 10:00:00", 移動: [
  移("045", "支店", [
    品("M0434-CB045-A", "低額商品-M0434-CB045", 1000), 品("M0434-CB045-B", "高額商品-M0434-CB045", 7000),
    品("M0434-CB045-C", "サプライ商品-M0434-CB045", 2000, { サプライ: true }),
  ]),
] });
