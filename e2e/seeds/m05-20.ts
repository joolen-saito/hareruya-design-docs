/**
 * M05-20 出荷指示リスト編集の画面シード。正本: cases/M05-20_seed_data.tsv
 *
 * 方針（依頼者 2026-11-10）: シード表が「DBで登録」とするものも、まず画面で作る。画面で作れない部分は、E2E が作った「実行の印つき」のデータに限り、
 * db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通して DB に書く（db/m05_20.ts・db/m05_01_order_write.ts）。共有のマスタ・設定・ほかの人のデータは書き換えない。
 *
 * 作り方:
 * 1. 商品: 実行の印つきの試験商品を、M05-01 と同じ方法（グッズ商品CSV登録＋在庫変更CSV登録＋承認。seeds/m05-01.ts・pages/admin/m05_01_orders.ts）で1実行に1件作る。
 *    共有の商品は注文しない（在庫を減らさない）。注文の明細の商品コードが実行の印を含むことが、DB へ書く対象の確かめになる。
 * 2. 注文: フロントに試験用の会員（M05-01 の会員）でログインし、印つきの商品を1点注文する（配送方法は出荷指示リストから除外されないもの、
 *    支払方法は外部決済を使わない代金引換）。2件の受注が要るシードは、間にほかの注文が入らないよう続けて注文する。
 * 3. 出荷指示リスト: 管理画面の出荷指示リスト検索の生成欄で注文番号（from・to）を指定して生成し、検索して出荷指示番号を控える。
 *    生成したリストの受注が、いま注文した受注だけであることを確かめる。備考が定められているものは、詳細画面で入れて登録する。
 * 4. 画面で指定できない値（リストの登録日・更新日・最終更新者、受注の日付・氏名・支払方法の表示・金額・数量、注文番号の未設定）だけ DB で設定する
 *    （注記に「DBで〜を〜に設定した」を残す）。
 *
 * 読み替え（シード作成時の問題にも残す）:
 *  - 出荷指示リストID・受注ID・注文番号は、シード表の決め打ち（5202002 など）でなく、画面が振った値（控える）に読み替えた。
 *  - 会員は、シード表の「新規会員登録＋仮登録メール」でなく、M05-01 の試験用の会員（フロントの会員登録で作る共有の試験用会員）で注文した。
 *  - 受注タイプ「通常注文」は、リスト生成が振る値のまま。
 *  - 注文番号 8桁の数字は画面が振る。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import {
  会員IDを読む, 管理者IDを読む, 管理者の件数, 出荷指示リストの受注ID, 出荷指示リストを整える, 受注の状態を読む, 受注の明細ID, 範囲内のほかの受注の件数, 注文タイプの名前一覧, 注文番号を空にする, 明細を整える,
} from "../db/m05_20";
import { 受注を整える } from "../db/m05_01_order_write";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { createMember } from "../pages/admin/member";
import { ensureM05Admin, 本店の店名 } from "../pages/admin/m05_admin_member";
import { 注文番号から受注IDを読む, 試験商品を用意する } from "../pages/admin/m05_01_orders";
import { StandbyDetailPage, メンバーを削除する, 備考を登録する, 出荷指示リストを範囲で生成する } from "../pages/admin/m05_20_standby";
import { ensureFrontMember, 会員が注文する } from "../pages/front/m05_front_order";
import { M0501_ADMIN, M0501_BUYER } from "./m05-01";

export const M0520_ADMIN: Account = { loginId: "m0520_admin", password: "Passw0rd!M0520" };
export const M0520_RE_ADMIN: Account = { loginId: "m0520re_admin", password: "Passw0rd-M0520RE" };
const PREV_ADMIN = { 名前: "M0520-032-前任管理者", account: { loginId: "m0520-032-prev", password: "Passw0rd!M0520Prev" } as Account, メール: "m0520-032-prev@example.test" };
const APPROVER = { 名前: "M05-01試験管理者", account: M0501_ADMIN };

defineSeed("S-M05-20-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-20管理者", account: M0520_ADMIN, メール: "m0520_admin@example.test" });
  reportSeedIssue("S-M05-20-ADM", "権限は、受注管理を操作できる「システム管理者」にした。所属・店舗・メールアドレスは任意の値（本店・m0520_admin@example.test）");
});
defineSeed("S-M05-20-RE-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-20機能間連携管理者", account: M0520_RE_ADMIN, メール: "m0520re_admin@example.com" });
  reportSeedIssue("S-M05-20-RE-ADM", "権限は「システム管理者」。所属・所属店舗は本店（店舗ID 1。無ければ先頭の店舗）");
});
defineSeed("S-M05-20-RE-TYPE", async ({ seed }) => {
  const names = 注文タイプの名前一覧();
  for (const n of ["通常", "予約", "大量"]) {
    if (!names.includes(n)) throw new Error(`注文タイプ「${n}」がこの環境に無い（ある注文タイプ: ${names.join("・")}）。注文タイプは共有のマスタなので、試験の値を足さずに止めた`);
  }
  reportSeedIssue(seed.シードID, "読み替え: 注文タイプ（通常・予約・大量）は共有のマスタ。登録済みであることを確かめただけで、書き換えていない");
});

// ---------------------------------------------------------------- 受注・出荷指示リストを作る共通の部品

export type 作った受注 = { 注文番号: string; 受注ID: string };
export type 作ったリスト = { 受注: 作った受注[]; リストID: string };

let buyerReady = false;

/** 印つきの商品を、試験用の会員がフロントで1点注文し、受注IDを読む */
async function 注文する(browser: Browser, admin: Account, what: string, issue: (m: string) => void): Promise<作った受注> {
  const item = await 試験商品を用意する(browser, APPROVER, rc("M0501-ITEM"), rc("M0501試験商品"), issue);
  if (!buyerReady) { await ensureFrontMember(browser, M0501_BUYER); buyerReady = true; }
  const 注文番号 = await 会員が注文する(browser, M0501_BUYER, what, { 出荷指示リストに載る配送: true, 商品ID: item.商品ID });
  const 受注ID = await withAdminSession(browser, admin, (page) => 注文番号から受注IDを読む(page, 注文番号, issue));
  return { 注文番号, 受注ID };
}

export type リスト作成の指定 ={ 件数?: number; 備考?: string; 管理者?: Account };

/** 受注を件数分（続けて）注文し、注文番号の範囲で出荷指示リストを生成し、備考を入れる。生成されたリストの受注が、いま注文した受注だけであることを確かめる */
export async function リストを作る(browser: Browser, seedId: string, issue: (m: string) => void, opt: リスト作成の指定 = {}): Promise<作ったリスト> {
  const admin = opt.管理者 ?? M0520_ADMIN;
  // 出荷指示リストID 999999 が未登録であること（見つからない応答の確かめの前提）
  await withAdminSession(browser, admin, async (page) => {
    const status = await new StandbyDetailPage(page).open("999999");
    if (status !== 404) throw new Error(`${seedId}: 出荷指示リストID 999999 が未登録のはずなのに、詳細画面の応答が ${status}。削除は自動ではしない`);
  });
  const 受注: 作った受注[] = [];
  for (let i = 0; i < (opt.件数 ?? 1); i++) 受注.push(await 注文する(browser, admin, `${seedId} の注文 ${i + 1}`, issue));
  const nums = 受注.map((o) => o.注文番号).sort((a, b) => Number(a) - Number(b));
  // 生成の前に、注文番号の範囲に、ほかの人の受注が入っていないことを確かめる（入っていると、その受注まで出荷指示リストに入り状態が変わるため、生成せずに止める）
  const 他 = 範囲内のほかの受注の件数(nums[0], nums[nums.length - 1], 受注.map((o) => o.受注ID));
  if (他 > 0) throw new Error(`${seedId}: 注文番号 ${nums[0]}〜${nums[nums.length - 1]} の範囲に、いま注文した受注以外の受注が ${他} 件ある。ほかの人の受注を出荷指示リストに入れないため、生成せずに止めた`);
  const リストID = await withAdminSession(browser, admin, async (page) => {
    const id = await 出荷指示リストを範囲で生成する(page, nums[0], nums[nums.length - 1], 受注[0].注文番号, seedId);
    if (opt.備考) await 備考を登録する(page, id, opt.備考, seedId);
    return id;
  });
  const got = 出荷指示リストの受注ID(リストID);
  const want = 受注.map((o) => o.受注ID).sort((a, b) => Number(a) - Number(b));
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`${seedId}: 生成した出荷指示リスト ${リストID} の受注（${got.join("・")}）が、注文した受注（${want.join("・")}）と違う。注文の間にほかの注文が入った可能性がある`);
  }
  // 対応状況が「出荷指示」であること（出荷指示リストの生成で変わる。違えば DB で設定する）
  for (const o of 受注) {
    const s = 受注の状態を読む(o.受注ID);
    if (s?.対応状況 !== "出荷指示") {
      受注を整える(o.受注ID, { 対応状況: ["出荷指示"] });
      issue(`DBで受注 ${o.注文番号} の対応状況を「出荷指示」に設定した（リスト生成後の対応状況は「${s?.対応状況}」だった）`);
    }
  }
  return { 受注, リストID };
}

/** シード表の呼び名（〔…-M0520-NNN〕）に、作った値を控える */
function 控える(seedId: string, notes: Notes, r: 作ったリスト, extra: Record<string, string> = {}, 番号 = ""): void {
  const no = 番号 || /-(\d{3})$/.exec(seedId)![1];
  const map: Record<string, string> = { [`出荷指示リストID-M0520-${no}`]: r.リストID, ...extra };
  r.受注.forEach((o, i) => {
    const sfx = r.受注.length === 1 ? "" : "ABCDEFGHIJKL"[i];
    map[`受注ID-M0520-${no}${sfx}`] = o.受注ID;
    map[`注文番号-M0520-${no}${sfx}`] = o.注文番号;
    map[`受注明細ID-M0520-${no}${sfx}`] = 受注の明細ID(o.受注ID);
  });
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const v = map[label.slice(1, -1)];
    if (!v) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v);
  }
}

const 保護対象 = "保護対象備考";

function 共通の注記(seedId: string, issue: (m: string) => void): void {
  issue("読み替え: 出荷指示リストID・受注ID・注文番号は、画面が振った値（控えた値）を使う。会員は M05-01 の試験用の会員で注文した（シード表の新規会員登録・仮登録メールは使わない）。" +
    "商品は、実行の印つきの試験商品（グッズ商品CSV登録・在庫変更CSV登録・承認で作る）。配送方法は出荷指示リストから除外されないもの、支払方法は外部決済を使わない代金引換");
}

type 定義 = { 件数?: number; 備考?: string; 後?: (c: { r: 作ったリスト; issue: (m: string) => void; browser: Browser; notes: Notes }) => Promise<Record<string, string> | void>; needs?: string[] };

function defineListSeed(seedId: string, d: 定義 = {}): void {
  defineSeed(seedId, { needs: ["S-M05-20-ADM", "S-M05-01-ADM", ...(d.needs ?? [])] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    共通の注記(seedId, issue);
    const r = await リストを作る(browser, seedId, issue, { 件数: d.件数, 備考: d.備考 });
    const extra = (await d.後?.({ r, issue, browser, notes })) ?? {};
    控える(seedId, notes, r, extra);
  });
}

// ---- 受注・リストを DB で整える部品 ----

/** 日付だけの値（時刻は昼の12時。画面の日付表示が時差でずれないため） */
const 日 = (d: string) => `${d} 12:00:00`;
type 受注の値 = { 氏名: [string, string]; 支払: string; 金額: number; 点数: number; 受注日: string; 出荷指示日: string; 商品名?: string; 単価?: number };
function 受注を値にする(o: 作った受注, v: 受注の値): void {
  受注を整える(o.受注ID, { 氏名: v.氏名, 支払方法の表示名: v.支払, 購入金額: v.金額, 受注日: v.受注日, 出荷指示日: 日(v.出荷指示日), 対応状況: ["出荷指示"] });
  明細を整える(o.受注ID, { 数量: v.点数, ...(v.単価 !== undefined ? { 単価: v.単価 } : {}), ...(v.商品名 ? { 商品名: v.商品名 } : {}) });
}
function 出荷指示日だけ(o: 作った受注, d: string): void {
  受注を整える(o.受注ID, { 出荷指示日: 日(d), 対応状況: ["出荷指示"] });
}
const 登録日 = "2026-08-01 10:20:30";
const 更新日 = "2026-08-02 11:22:33";

// ---------------------------------------------------------------- 各シード

// 001: 基本表示（2件の受注・リストの日付）
defineListSeed("S-M05-20-BASE-001", {
  件数: 2, 備考: "更新前備考",
  後: async ({ r, issue }) => {
    受注を値にする(r.受注[0], { 氏名: ["山田", "太郎"], 支払: "クレジットカード", 金額: 1100, 点数: 2, 受注日: "2026-07-30 09:00:00", 出荷指示日: "2026-08-03" });
    受注を値にする(r.受注[1], { 氏名: ["鈴木", "花子"], 支払: "銀行振込", 金額: 2200, 点数: 3, 受注日: "2026-07-31 09:30:00", 出荷指示日: "2026-08-04" });
    出荷指示リストを整える(r.リストID, { 登録日, 更新日 });
    issue("DBで、リストの登録日を 2026-08-01 10:20:30・更新日を 2026-08-02 11:22:33 に、2受注のお名前（山田 太郎・鈴木 花子）・支払方法の表示（クレジットカード・銀行振込。決済の設定は変えていない）・" +
      "購入金額（1100・2200円）・合計点数（2・3）・受注日（2026-07-30 09:00・2026-07-31 09:30）・出荷指示日（2026-08-03・2026-08-04）を設定した（画面で指定できない。受注の登録画面で支払方法をクレジットカードにする操作は、決済代行が絡むので行わない）");
  },
});

// 002: 最終更新者が削除済み管理者
defineSeed("S-M05-20-DELETED-UPDATER-002", { needs: ["S-M05-20-ADM", "S-M05-01-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M05-20-DELETED-UPDATER-002";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  共通の注記(seedId, issue);
  const r = await リストを作る(browser, seedId, issue);
  const shop = await 本店の店名(browser);
  const mark = RUN_MARK.toLowerCase();
  const 管理者ID = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return createMember(page, {
      名前: "削除済担当者", 所属店舗: shop, ログインID: `m0520del${mark}`, メールアドレス: `m0520del-${mark}@example.test`, パスワード: "Passw0rd!M0520Del",
      権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
  出荷指示リストを整える(r.リストID, { 最終更新者ID: 管理者ID });
  await withAdminSession(browser, SETUP_ADMIN, (page) => メンバーを削除する(page, 管理者ID));
  if (管理者の件数(管理者ID) !== 0) throw new Error(`${seedId}: 管理者ID ${管理者ID} を削除したのに、まだ残っている`);
  issue(`削除済み管理者は、メンバー管理の画面で「削除済担当者」（ログインID m0520del${mark}。印つき）を登録して削除して作った。DBで、リストの最終更新者をこの管理者ID（${管理者ID}。削除済み）に設定した。` +
    "アプリのメンバー削除は行を消す作りなので、削除後の管理者の名前は残らない");
  控える(seedId, notes, r);
});

// 003: 最終更新者IDに対応する管理者がいない
defineSeed("S-M05-20-MISSING-UPDATER-003", { needs: ["S-M05-20-ADM", "S-M05-01-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M05-20-MISSING-UPDATER-003";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  共通の注記(seedId, issue);
  if (管理者の件数("520290003") !== 0) {
    throw new Error(`${seedId}: 管理者ID 520290003 の管理者がこの環境にある。シード表は削除するとするが、ほかの人のデータなので消さずに止めた`);
  }
  const r = await リストを作る(browser, seedId, issue);
  出荷指示リストを整える(r.リストID, { 最終更新者ID: "520290003" });
  issue("DBで、リストの最終更新者IDを 520290003 に設定した（この管理者IDの管理者がいないことを確かめた。画面で指定できない）");
  控える(seedId, notes, r);
});

// 004: 2件の受注のうち1件の注文番号が未設定
defineListSeed("S-M05-20-MISSING-ORDERNO-004", {
  件数: 2,
  後: async ({ r, issue }) => {
    受注を値にする(r.受注[0], { 氏名: ["番号あり", "太郎"], 支払: "クレジットカード", 金額: 1000, 点数: 1, 受注日: "2026-08-01 12:00:00", 出荷指示日: "2026-08-03" });
    受注を値にする(r.受注[1], { 氏名: ["番号なし", "花子"], 支払: "銀行振込", 金額: 2000, 点数: 2, 受注日: "2026-08-02 12:00:00", 出荷指示日: "2026-08-04" });
    注文番号を空にする(r.受注[1].受注ID);
    issue("DBで、2受注のお名前・支払方法の表示・購入金額・合計点数・受注日・出荷指示日を設定し、2件目の受注の注文番号を未設定にした（画面で指定できない）");
    // シード表の呼び名〔注文番号-M0520-004〕は、注文番号を持つ受注（1件目）の注文番号
    return { "注文番号-M0520-004": r.受注[0].注文番号 };
  },
});

// 005: 登録日・更新日が未設定
defineListSeed("S-M05-20-NULL-DATES-005", {
  後: async ({ r, issue }) => {
    出荷指示リストを整える(r.リストID, { 登録日: null, 更新日: null });
    issue("DBで、リストの登録日・更新日をどちらも未設定にした（画面で指定できない）");
  },
});

// 006・013・014・025・033: 画面だけで作る
defineListSeed("S-M05-20-NOTFOUND-006");
defineListSeed("S-M05-20-UPDATE-NOTFOUND-013", { 備考: 保護対象 });
defineListSeed("S-M05-20-UPDATE-NOTCREATE-014", { 備考: 保護対象 });
defineListSeed("S-M05-20-DELETE-NOTFOUND-025", { 備考: 保護対象 });
defineListSeed("S-M05-20-DP-DELETE-TWICE-033", { 備考: "保護対象備考-M0520-033" });

// 008: 更新（備考・更新日・最終更新者）
defineListSeed("S-M05-20-UPDATE-008", {
  備考: "更新前備考",
  後: async ({ r, issue }) => {
    出荷指示日だけ(r.受注[0], "2026-08-03");
    出荷指示リストを整える(r.リストID, { 登録日, 更新日 });
    issue("DBで、リストの登録日を 2026-08-01 10:20:30・更新日を 2026-08-02 11:22:33 に、受注の出荷指示日を 2026-08-03 に設定した（画面で指定できない）");
  },
});

// 009: 備考を空にする
defineListSeed("S-M05-20-CLEAR-009", {
  備考: "更新前備考",
  後: async ({ r, issue }) => {
    出荷指示日だけ(r.受注[0], "2026-08-03");
    issue("DBで、受注の出荷指示日を 2026-08-03 に設定した（画面で指定できない）");
  },
});

// 010: 構成の維持（2受注・商品名・数量・単価）
defineListSeed("S-M05-20-STRUCTURE-010", {
  件数: 2, 備考: "更新前備考",
  後: async ({ r, issue }) => {
    受注を整える(r.受注[0].受注ID, { 出荷指示日: 日("2026-08-03"), 対応状況: ["出荷指示"] });
    受注を整える(r.受注[1].受注ID, { 出荷指示日: 日("2026-08-04"), 対応状況: ["出荷指示"] });
    明細を整える(r.受注[0].受注ID, { 商品名: "構成確認商品A", 数量: 1, 単価: 1000 });
    明細を整える(r.受注[1].受注ID, { 商品名: "構成確認商品B", 数量: 2, 単価: 2000 });
    issue("読み替え: 商品「構成確認商品A・B」（商品コード M0520-010-A・B）は作らず、実行の印つきの試験商品の注文の明細を、DBで商品名（構成確認商品A・B）・数量（1・2）・単価（1000・2000円）に設定した。" +
      "受注の出荷指示日も DBで 2026-08-03・2026-08-04 に設定した");
  },
});

// 011: 登録後の遷移
defineListSeed("S-M05-20-REDIRECT-011", {
  備考: "更新前備考",
  後: async ({ r, issue }) => {
    出荷指示日だけ(r.受注[0], "2026-08-03");
    issue("DBで、受注の出荷指示日を 2026-08-03 に設定した（画面で指定できない）");
  },
});

// 016〜018・020〜024・027・030・031
defineListSeed("S-M05-20-DELETE-CANCEL-016", { 備考: 保護対象 });
defineListSeed("S-M05-20-DELETE-LIST-017", { 件数: 2 });
defineListSeed("S-M05-20-DELETE-SIDE-EFFECT-018", {
  件数: 2,
  後: async ({ r, issue }) => {
    for (const o of r.受注) 出荷指示日だけ(o, "2026-08-03");
    issue("DBで、2受注の出荷指示日を 2026-08-03 に設定した（画面で指定できない）");
  },
});
defineListSeed("S-M05-20-DELETE-INITIAL-020");
defineListSeed("S-M05-20-CSRF-021", { 備考: 保護対象 });
defineListSeed("S-M05-20-CSRF-KEEP-022", { 備考: 保護対象 });
defineListSeed("S-M05-20-DELETE-MISSING-ID-023", { 備考: 保護対象 });
defineListSeed("S-M05-20-DELETE-MISSING-ID-KEEP-024", { 備考: 保護対象 });
defineListSeed("S-M05-20-DELETE-GET-027", { 備考: 保護対象 });
defineListSeed("S-M05-20-ORDER-LINK-030", {
  後: async ({ issue }) => {
    issue("読み替え: シード表は受注登録画面で支払方法を「クレジットカード」に変えるが、決済代行が絡むので行わず、注文時の支払方法（代金引換）のままにした。" +
      "ケースが確かめるのは注文番号のリンクの遷移先で、支払方法に依らない");
  },
});
defineListSeed("S-M05-20-CHECK-ALL-031", { 件数: 2 });

// 032: 最終更新者が別の稼働中の管理者
defineSeed("S-M05-20-UPDATE-OTHER-032", { needs: ["S-M05-20-ADM", "S-M05-01-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M05-20-UPDATE-OTHER-032";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  共通の注記(seedId, issue);
  await ensureM05Admin(browser, { 名前: PREV_ADMIN.名前, account: PREV_ADMIN.account, メール: PREV_ADMIN.メール });
  const prevId = 管理者IDを読む(PREV_ADMIN.account.loginId);
  if (!prevId) throw new Error(`${seedId}: 前任管理者（ログインID ${PREV_ADMIN.account.loginId}）の管理者IDを読めない`);
  const r = await リストを作る(browser, seedId, issue, { 備考: "更新前備考" });
  出荷指示リストを整える(r.リストID, { 最終更新者ID: prevId });
  issue(`前任管理者「${PREV_ADMIN.名前}」（ログインID ${PREV_ADMIN.account.loginId}。権限はシステム管理者、パスワードは12文字以上の規則に合わせた）をメンバー管理の画面で登録し、` +
    `DBで、リストの最終更新者をこの管理者（管理者ID ${prevId}）に設定した（画面の登録では操作者が最終更新者になるため）`);
  控える(seedId, notes, r, { "管理者ID-M0520-032": prevId });
});

// 034: 機能間連携（出荷指示リスト削除後の受注の表示）
defineSeed("S-M05-20-RE-LIST-034", { needs: ["S-M05-20-RE-ADM", "S-M05-20-RE-TYPE", "S-M05-01-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M05-20-RE-LIST-034";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  共通の注記(seedId, issue);
  const r = await リストを作る(browser, seedId, issue, { 管理者: M0520_RE_ADMIN });
  明細を整える(r.受注[0].受注ID, { 商品名: "通常商品RE020" });
  issue("読み替え: 商品「通常商品RE020」・配送方法「M0520RE配送001」・会員 re0520-buyer-001@example.test は作らず、実行の印つきの試験商品・出荷指示リストから除外されない既存の配送方法・" +
    "M05-01 の試験用の会員の注文にした（会員・配送方法は共有の設定を増やさないため）。DBで、受注の先頭商品名を「通常商品RE020」に設定した。" +
    "受注サブ情報は、対応するデータの置き場がアプリの画面・DB から特定できないため設定していない（ケースの確かめ対象は対応状況と出荷指示日）");
  控える(seedId, notes, r, { "会員ID-M0520-RE001": 会員IDを読む(M0501_BUYER.メール) }, "RE001");
});
