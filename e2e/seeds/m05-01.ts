/**
 * M05-01 受注管理（受注一覧系）の画面シード。正本: cases/M05-01_seed_data.tsv
 *
 * - S-M05-01-ADM: メンバー管理で登録し、店舗Aをデフォルト検索表示店舗にする。
 *   店舗Aは本店（店舗ID 1）とする。シード表の受注は「店舗Aの商品をフロントで注文する（店舗Aの受注になる）」「本店の…-HQ」と、
 *   店舗Aを本店として書いている（2026-11-10 に読み替えた。前回までは試験用に作った支店「試験店舗A（M05-01）」を店舗Aにしていた）。
 *   店舗Bは、店舗登録画面で登録した「試験店舗B（M05-01）」（検索パターン保存のケース IT-M05-01-056 が店舗の選択肢に使う）。
 *   所属店舗・デフォルト検索表示店舗は本店、編集可能店舗は本店・店舗B。権限はシード表の「受注管理を操作できる」を満たすシステム管理者
 *   （シード表に権限の指定は無い）。登録済みで内容が違えば、メンバー編集画面でそろえる。
 * - 検索パターン系: 受注情報検索 一覧(検索入力)画面の検索条件保存・削除で作る。
 * - 受注系（依頼者の方針 2026-11-10 で画面から作る）: pages/admin/m05_01_orders.ts。DB での準備は一切しない。
 *   ・会員: シード表は「管理画面の会員登録編集画面で会員を登録する」とするが、管理画面に会員の新規登録の画面が無い。
 *     M05-01 の試験用の会員1人（フロントの会員登録で作る。共有の開発環境では登録済みのものを使う）を全部の受注で使う。
 *   ・商品: グッズ商品CSV登録と在庫変更CSV登録（承認つき）で作る。1回の実行で1件だけ作り、その実行の注文で使い回す。
 *   ・注文番号: 購入時に画面が8桁の数字で振る。シード表の決め打ちの注文番号（M0501-…-A など）は、作った受注に振られた注文番号に読み替え、
 *     ケースの手順の注文番号の入力（M0501-… の部分一致）も、その受注の注文番号に読み替える。読み替えは「シード作成時の問題」に残す。
 *     複数の受注を注文番号の部分一致で1回の検索にまとめる前提は作れないので、そういうケースは実装していない（記録の振り分け）。
 *
 * 決め打ちの識別の値（検索パターン名・注文番号・メールアドレスの前半・お名前・支払方法名・商品コード）には、実行ごとの印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。
 * 入力チェックの確かめに使う値（フリガナのカタカナでない値）にも印を付ける（値の書式を確かめるケースではなく、カタカナでないことが要るだけ）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 受注の状態 } from "../db/m05_01_orders";
import { 検索パターンの有無 } from "../db/m05_01_search_pattern";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { StockSearchPatternPage } from "../pages/admin/m04_01_search_pattern";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { OrderSearchPage } from "../pages/admin/m05_01_order_search_k";
import {
  ensureMemberAligned, storeName, 会員が商品を注文する, 対応状況をそろえる, 注文番号から受注IDを読む, 表示件数マスタを読む, 本店ID, 試験商品を用意する,
} from "../pages/admin/m05_01_orders";
import { PaymentPage } from "../pages/admin/m10_04_payment";
import { FrontMember } from "../pages/front/member_entry";

export const M0501_ADMIN: Account = { loginId: "m0501_admin", password: "Passw0rd!M0501" };
const ADMIN_NAME = "M05-01試験管理者";

const COMPANY = "M05-01試験会社";
const STORE_B: M0424StoreInput = {
  店名: "試験店舗B（M05-01）", 店名カナ: "シケンテンポビー", 店名英語: "Test Store B Mfive", 支店URL: "m0501storeb", 店名略称3文字: "R5B", ショップ名略称: "試験店舗B",
  会社名: COMPANY, 会社名カナ: "シケンガイシャ", 郵便番号: "160-0023", 都道府県: "東京都", 住所1: "新宿区西新宿4-9-2", 住所2: "試験ビル2F", 電話番号: "03-0501-0002",
};
let storeAName = "";
/** 店舗A（本店）の店名。S-M05-01-ADM が画面から読む */
export function 店舗Aの店名(): string {
  if (!storeAName) throw new Error("店舗A（本店）の店名をまだ読んでいない（S-M05-01-ADM のあとで使う）");
  return storeAName;
}
export const 店舗Bの店名 = STORE_B.店名;

defineSeed("S-M05-01-ADM", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    storeAName = await storeName(page, 本店ID);
    const b = await ensureStore(page, STORE_B, issue);
    await ensureMemberAligned(page, {
      名前: ADMIN_NAME, ログインID: M0501_ADMIN.loginId, メールアドレス: "m0501_admin@example.test", パスワード: M0501_ADMIN.password,
      権限: "システム管理者", 所属店舗ID: 本店ID, デフォルト検索表示店舗ID: 本店ID, 編集可能店舗ID: [本店ID, b],
    }, issue);
  });
  await withAdminSession(browser, M0501_ADMIN, async (page) => {
    await new OrderSearchPage(page).open();
  });
});

// ---- 表示件数マスタ（共有のマスタ。書き換えずに、シード表の状態であることを確かめるだけ） ----
const PAGE_COUNTS = ["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000"];

// ---- 受注（画面で作る） ----

/** M05-01 の試験用の会員（全部の受注で使う） */
export const M0501_BUYER: FrontMember = {
  姓: "試験", 名: "購入者", セイ: "シケン", メイ: "コウニュウシャ", メール: "e2e-m0501-buyer@example.test", パスワード: "Passw0rd!M0501",
};
const APPROVER = { 名前: ADMIN_NAME, account: M0501_ADMIN };

export type 作った受注 = { 注文番号: string; 受注ID: string };

/** 正本の決め打ちの注文番号 → 作った受注に振られた注文番号（spec が手順・期待結果の注文番号を読み替えるのに使う） */
const 読み替え = new Map<string, string>();
export function 注文番号の読み替えを登録(正本の値: string, 値: string): void {
  読み替え.set(正本の値, 値);
}
export function 注文番号の読み替え(正本の値: string): string {
  const v = 読み替え.get(正本の値);
  if (!v) throw new Error(`注文番号「${正本の値}」の読み替えが無い（シードが作っていない）`);
  return v;
}

/** 本店の画面で試験用の会員が注文し、受注IDを読み、対応状況をそろえる */
export async function 受注を作る(browser: Browser, seedId: string, 状態: string, issue: (m: string) => void): Promise<作った受注> {
  const item = await 試験商品を用意する(browser, APPROVER, rc("M0501-ITEM"), rc("M0501試験商品"), issue);
  const r = await 会員が商品を注文する(browser, M0501_BUYER, item.商品ID, `${seedId} の注文`);
  return withAdminSession(browser, M0501_ADMIN, async (page) => {
    const 受注ID = await 注文番号から受注IDを読む(page, r.注文番号, issue);
    await 対応状況をそろえる(page, 受注ID, 状態, issue);
    return { 注文番号: r.注文番号, 受注ID };
  });
}

type 受注の定め = {
  /** 控える呼び名（〔注文番号-…〕・〔受注ID-…〕）。シード表が控えると定めたものだけ */
  注文番号?: string; 受注ID?: string;
  /** 正本の決め打ちの注文番号（作った受注の注文番号に読み替える） */
  正本の注文番号?: string[];
  状態?: string;
};

/**
 * 受注を作るシード。defs の順に1件ずつ作る。
 * omit: シード表と違えたこと（画面で作れないので作らない受注など）と、その理由（読み替えとして報告に残す）。
 */
function orderSeed(seedId: string, defs: 受注の定め[], opt: { omit?: string; note?: string; after?: (ctx: { browser: Browser; made: 作った受注[]; issue: (m: string) => void }) => Promise<void> } = {}): void {
  defineSeed(seedId, { needs: ["S-M05-01-ADM"] }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const made: 作った受注[] = [];
    for (const d of defs) {
      const o = await 受注を作る(browser, seedId, d.状態 ?? "注文受領", issue);
      made.push(o);
      if (d.注文番号) notes.set(d.注文番号, o.注文番号);
      if (d.受注ID) notes.set(d.受注ID, o.受注ID);
      for (const v of d.正本の注文番号 ?? []) 読み替え.set(v, o.注文番号);
      if (d.正本の注文番号?.length) issue(`読み替え: 注文番号 ${d.正本の注文番号.join("・")} は画面で指定できないので、本店の画面で注文した受注の注文番号 ${o.注文番号} に読み替えた（ケースの注文番号の入力も同じ）`);
    }
    issue("読み替え: 会員はシード表の管理画面の会員登録（新規登録の画面が無い）でなく、M05-01の試験用の会員1人（フロントの会員登録）で注文した。" +
      "商品はこの実行で1件だけ作った試験商品（印つき）。注文は本店の画面で、支払方法は銀行振込以外で外部の画面へ移らないもの");
    if (opt.omit) issue(`読み替え: ${opt.omit}`);
    if (opt.note) issue(`読み替え: ${opt.note}`);
    if (opt.after) await opt.after({ browser, made, issue });
  });
}

const one = (n: string, 受注ID = false): 受注の定め => ({ 注文番号: `〔注文番号-M0501-${n}〕`, ...(受注ID ? { 受注ID: `〔受注ID-M0501-${n}〕` } : {}) });
const ONLY_ONE = (no: string, others: string, what: string) =>
  `受注 ${others} は作らず ${no} の1件だけにした（注文番号は画面が数字で振るので、注文番号の部分一致で複数の受注を1回の検索にまとめられない）。ケースの期待結果（${what}）は検索結果の件数に依らない`;

orderSeed("S-M05-01-SOURCE-001", [{ 正本の注文番号: ["M0501-SOURCE-001-HQ", "M0501-SOURCE-001"] }],
  { omit: "店舗Bの受注 M0501-SOURCE-001-BR（支店の画面での購入）とスマレジ由来の受注 M0501-SOURCE-001-SM（スマレジの連携でしか作られない）は作らず、店舗A（本店）の受注1件だけにした。ケースの期待結果（件数の初期値）は受注の件数に依らない" });
orderSeed("S-M05-01-DISPLAY-008", [one("008", true)]);
for (const n of ["017", "018", "020", "021", "024", "025"]) orderSeed(`S-M05-01-CSV-${n}`, [one(n)]);
for (const n of ["029", "031", "033"]) {
  orderSeed(`S-M05-01-CSV-${n}`, [{ 正本の注文番号: [`M0501-CSV-${n}-A`, `M0501-CSV-${n}`] }],
    { omit: ONLY_ONE(`M0501-CSV-${n}-A`, `M0501-CSV-${n}-B・C`, "受注を選ばずに押したときのエラー") });
}
for (const n of ["036", "037"]) {
  orderSeed(`S-M05-01-INVOICE-${n}`, [{ 正本の注文番号: [`M0501-INVOICE-${n}-JP`, `M0501-INVOICE-${n}`] }],
    { omit: ONLY_ONE(`国内の配送の M0501-INVOICE-${n}-JP`, `M0501-INVOICE-${n}-EN（国外配送区分ありの配送方法）`, "受注を選ばずに押したときのエラー") });
}
for (const n of ["038", "039", "040"]) {
  orderSeed(`S-M05-01-DISPLAY-${n}`, [one(n, true)],
    n === "040" ? { omit: "通知先メール m0501-040@example.test は、注文した試験用の会員のメールアドレス（受注の通知先）に読み替えた" } : {});
}

// 削除系: シード表は「会員との関連なし」（非会員の受注）。フロントに非会員の購入の入口が無く、受注情報編集画面にも会員を外す欄が無いので、
// 会員の受注で作る（期待結果は削除済み区分・画面の戻り先で、会員との関連に依らない）
const NONMEMBER = "会員との関連なし（非会員の受注）は画面で作れないので、試験用の会員の受注に読み替えた。ケースの期待結果（削除済み区分・戻り先の画面）は会員との関連に依らない";
for (const n of ["041", "042", "046", "047"]) orderSeed(`S-M05-01-DEL-NONMEM-${n}`, [one(n, true)], { omit: NONMEMBER });
orderSeed("S-M05-01-DEL-CONCURRENT-048", [one("048", true)], { omit: NONMEMBER });

// スタック用紙印刷: 担当者「M05-01印刷前担当者」は受注情報編集画面に担当者の欄が無く画面で指定できない（シード表の文）
orderSeed("S-M05-01-STACK-030", [one("030")], {
  omit: "受注の担当者「M05-01印刷前担当者」は画面で指定できないので登録・設定しない（購入直後の受注の担当者のまま）。期待結果の担当者は、印刷のあと M05-01試験管理者 になったことで確かめる",
  after: async ({ made, issue }) => {
    const s = 受注の状態(made[0].受注ID);
    if (s.ブラウザ印刷フラグ !== "false" || s.注文確定日 !== null || s.対応状況 !== "注文受領") {
      issue(`購入直後の受注の状態がシード表と違う（対応状況「${s.対応状況}」・ブラウザ印刷フラグ ${s.ブラウザ印刷フラグ}・注文確定日 ${s.注文確定日 ?? "未設定"}）`);
    }
    issue(`印刷前の受注の担当者: ${s.担当者 ?? "未設定"}`);
  },
});

/** 検索パターンを（同じ名前があれば消して）保存する */
export async function savePatterns(browser: Browser, list: { 名前: string; 注文番号: string }[]): Promise<void> {
  await withAdminSession(browser, M0501_ADMIN, async (page) => {
    const p = new OrderSearchPage(page);
    for (const v of list) {
      await p.removePatternIfExists(v.名前);
      await p.savePattern({ 注文番号: v.注文番号, パターン名: v.名前 });
    }
  });
}
/** 名前の検索パターンが無いことを確かめる（あれば選んで削除する） */
async function absentPattern(browser: Browser, name: string): Promise<void> {
  await withAdminSession(browser, M0501_ADMIN, async (page) => {
    const p = new OrderSearchPage(page);
    await p.removePatternIfExists(name);
    await p.open();
    expect(await p.patternNames(), `検索パターン「${name}」が無いこと`).not.toContain(name);
  });
}

// 検索パターン保存・呼び出し
orderSeed("S-M05-01-PATAFTER-053", [one("053A"), one("053B")], { after: ({ browser }) => absentPattern(browser, rc("M0501-053-PAT")) });
orderSeed("S-M05-01-PATLINK-057", [one("057A"), one("057B")], {
  after: ({ browser, made }) => savePatterns(browser, [
    { 名前: rc("M0501-057-PAT-A"), 注文番号: made[0].注文番号 }, { 名前: rc("M0501-057-PAT-B"), 注文番号: made[1].注文番号 },
  ]),
});
orderSeed("S-M05-01-PATNONEKEEP-136", [one("136")], {
  after: async ({ browser, made }) => {
    await savePatterns(browser, [{ 名前: rc("M0501-136-PAT"), 注文番号: made[0].注文番号 }]);
  },
});
orderSeed("S-M05-01-PATSAVEDMSG-139", [one("139A"), one("139B")], { after: ({ browser }) => absentPattern(browser, rc("M0501-139-PAT")) });

// 初期表示・検索条件
orderSeed("S-M05-01-NOCOND-072", [one("072")]);
orderSeed("S-M05-01-TOGGLE1-085", [one("085")]);
orderSeed("S-M05-01-TOGGLE2-086", [one("086")]);
orderSeed("S-M05-01-STATUSOPT-087", [one("087")]);

// 支払方法（支払方法設定画面で登録する。表示順の値は画面で指定できないので、登録の順で決まる表示順に読み替える）
export async function 支払方法を登録する(browser: Browser, names: string[], 削除: string[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const pay = new PaymentPage(page);
    for (const name of names) {
      await pay.openNew();
      await pay.入れる({ 方法: name, 英: `Mfive payment ${names.indexOf(name) + 1}`, 手数料: "0" });
      await pay.登録を押す();
      await expectSuccess(page, `支払方法「${name}」の登録`);
    }
    for (const name of 削除) {
      await pay.openList();
      await pay.削除を押す(pay.行(name));
      const st = await pay.モーダルで削除する();
      if (st !== null && st >= 400) throw new Error(`支払方法「${name}」の削除の応答が ${st}`);
      await pay.openList();
      await expect(pay.行(name), `支払方法「${name}」が一覧から消えた`).toHaveCount(0);
    }
  });
}
async function expectSuccess(page: Page, what: string): Promise<void> {
  if ((await page.locator(".alert-success").count()) > 0) return;
  const err = (await page.locator(".alert-danger, .invalid-feedback, .form-error-message").allInnerTexts()).map((t) => t.trim()).filter((t) => t && !/デバッグモード/.test(t));
  throw new Error(`${what}: 保存されない（${err.join(" / ") || "成功の表示なし"}）`);
}
const PAY_ORDER = "支払方法の表示順の値（9100〜・13500〜）は支払方法設定画面に入力欄が無く画面で指定できないので、名前の番号の順に1件ずつ登録し、登録の順で決まる表示順（後に登録したものほど大きい）に読み替えた。支払方法名には実行ごとの印を付けた";
orderSeed("S-M05-01-PAYOPT-091", [one("091")], {
  note: PAY_ORDER,
  after: ({ browser }) => 支払方法を登録する(browser, [1, 2, 3, 4].map((i) => rc(`M0501-091-PAY${i}`)), [rc("M0501-091-PAY4")]),
});
orderSeed("S-M05-01-PAYOPT-135", [one("135")], {
  note: PAY_ORDER,
  after: ({ browser }) => 支払方法を登録する(browser, [1, 2, 3].map((i) => rc(`M0501-135-PAY${i}`)), []),
});

type Pat = { 注文番号?: string; お名前?: string; フリガナ?: string; メール?: string; パターン名: string };

/** 検索パターンを作るシード。先に同じ名前があれば作らずに止める代わりに、選んで削除して作り直す */
function patternSeed(seedId: string, make: Pat[], absent: string[] = []): void {
  defineSeed(seedId, { needs: ["S-M05-01-ADM"] }, async ({ browser }) => {
    await withAdminSession(browser, M0501_ADMIN, async (page) => {
      const p = new OrderSearchPage(page);
      for (const a of absent) {
        await p.removePatternIfExists(a);
        await p.open();
        expect(await p.patternNames(), `検索パターン「${a}」が無いこと`).not.toContain(a);
      }
      for (const m of make) {
        await p.removePatternIfExists(m.パターン名);
        await p.savePattern(m);
      }
    });
  });
}

// ---- 0件の確認（受注） ----
defineSeed("S-M05-01-NOTFOUND-007", { needs: ["S-M05-01-ADM"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, M0501_ADMIN, async (page) => {
    const p = new OrderSearchPage(page);
    await p.open();
    // 店舗は全店を選ぶ
    await p.tenants.selectOption({ label: "全店" });
    await p.orderNumber.fill(rc("M0501-NOT-FOUND"));
    await p.clickSearch();
    const total = (await page.locator("#search_total_count").innerText()).replace(/\s+/g, "");
    if (!/0件/.test(total)) {
      reportSeedIssue(seed.シードID, `注文番号「${rc("M0501-NOT-FOUND")}」の受注が0件でない（${total}）。シード表は受注を削除して0件にするとあるが、印を付けた値なので該当しないはず`);
    }
    expect(total, "注文番号に印つきの M0501-NOT-FOUND を含む受注が0件").toMatch(/0件/);
  });
});

// ---- 検索パターンが無い ----
patternSeed("S-M05-01-PATNEW-051", [], [rc("M0501-051-PAT")]);
patternSeed("S-M05-01-PATBODY-052", [], [rc("M0501-052-PAT")]);
patternSeed("S-M05-01-PATSTORE-056", [], [rc("M0501-056-PAT")]);
patternSeed("S-M05-01-VALSAVE-069", [], [rc("M0501-069-PAT")]);

// ---- 注文番号を条件に含む検索パターンが無い ----
for (const [id, no] of [["S-M05-01-PATEMPTY-054", "M0501-054-NEW"], ["S-M05-01-PATEMPTY-133", "M0501-133-NEW"], ["S-M05-01-PATEMPTYMSG-138", "M0501-138-NEW"]] as const) {
  defineSeed(id, { needs: ["S-M05-01-ADM"] }, async ({ browser }) => {
    await withAdminSession(browser, M0501_ADMIN, async (page) => {
      const p = new OrderSearchPage(page);
      await p.removePatternsWithOrderNumber(rc(no));
    });
  });
}

// ---- 検索パターンが登録されている ----
patternSeed("S-M05-01-PATUPD-055", [{ 注文番号: rc("M0501-055-A"), パターン名: rc("M0501-055-OLD") }], [rc("M0501-055-NEW")]);
patternSeed("S-M05-01-PATFORM-065", [{ 注文番号: rc("M0501-065"), メール: `${rc("m0501-065")}@example.test`, お名前: rc("M0501-065-NAME"), パターン名: rc("M0501-065-PAT") }]);
patternSeed("S-M05-01-VALCALL-071", [{ 注文番号: rc("M0501-071"), フリガナ: rc("M0501-071-BAD"), パターン名: rc("M0501-071-PAT") }]);
patternSeed("S-M05-01-PATDEL-161", [{ 注文番号: rc("M0501-161"), パターン名: rc("M0501-161-PAT") }]);
patternSeed("S-M05-01-PATDELTRANS-163", [{ 注文番号: rc("M0501-163"), パターン名: rc("M0501-163-PAT") }]);

defineSeed("S-M05-01-PATNONE-064", { needs: ["S-M05-01-ADM"] }, async ({ browser }) => {
  await withAdminSession(browser, M0501_ADMIN, async (page) => {
    const p = new OrderSearchPage(page);
    await p.removePatternIfExists(rc("M0501-064-PAT"));
    await p.savePattern({ 注文番号: rc("M0501-064"), パターン名: rc("M0501-064-PAT") });
  });
  expect(検索パターンの有無("106499999"), "検索パターンID 106499999 の検索パターンが無い").toBe(0);
});

// ---- 検索パターンを全部消して、決まった3件（と在庫一覧の1件）だけにする ----
function listSeed(seedId: string, no: string, withStock: boolean): void {
  defineSeed(seedId, { needs: ["S-M05-01-ADM"] }, async ({ browser }) => {
    await withAdminSession(browser, M0501_ADMIN, async (page) => {
      const p = new OrderSearchPage(page);
      await p.removeAllPatterns();
      for (const k of ["C", "A", "B"]) {
        await p.savePattern({ 注文番号: rc(`M0501-${no}-${k}`), パターン名: rc(`M0501-${no}-PAT-${k}`) });
      }
      if (withStock) {
        const s = new StockSearchPatternPage(page);
        await s.open();
        await s.showPatternArea();
        await s.patternName.fill(rc(`M0501-${no}-PAT-STOCK`));
        await s.clickSave();
        await expect(page.locator(".alert-success"), "在庫一覧の検索パターンの保存").toBeVisible();
      }
    });
  });
}
listSeed("S-M05-01-PATLIST-058", "058", true);
listSeed("S-M05-01-PATLIST-134", "134", false);
