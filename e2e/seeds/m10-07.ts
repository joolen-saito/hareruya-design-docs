/**
 * M10-07 税率設定 の画面シード。正本: cases/M10-07_seed_data.tsv
 *
 * ≪共有の設定を書き換える≫ 税率設定はアプリ全体の共有の設定（一覧は店舗で分かれず、足した税率は全員に効く）。
 *   シードが足した税率（A・B・C）と、ケースが足した税率は、基盤が必ず消す（lib/shared_restore.ts の registerRestore。消したあと、
 *   足す前の一覧の行がそのまま残り、足した行が無いことを画面で確かめる）。
 *   税率は注文の金額に効くので、足す日時は適用日時が未来のものを基本とし、書き換えている時間を短くするため、足すのはケースの直前（このシード）、消すのはケースの終わり。
 *
 * シードでの解釈（アプリの作りに合わせたもの）:
 * - 店舗は作らない。税率設定は店舗で分かれない共有の設定なので、〔店舗ID-M1007-nnn〕は操作する店舗＝本店（店舗ID 1）の番号を控える。店舗コード（M10-07-STORE-nnn）は画面で指定できないので設定しない。
 * - 税率A（消費税率10・四捨五入・適用日時2020-01-01 00:00）は適用日時が過去で、今の税率の計算に効くので、いま有効な税率が「消費税率10・四捨五入」のときだけ正本のとおりに足す。
 *   違うときは、いま有効な税率と同じ消費税率・課税規則で足す（計算を変えないため）。適用日時2020-01-01 00:00の税率が既にあるときは、足さずその行を A として使う（消さない）。
 * - 税率D（論理削除済み）は、足してすぐ画面で削除する。アプリは削除で行を残さないので、「論理削除済み」は「一覧にもDBにも無い」状態とする。
 * - 商品・商品規格に紐づく税率（ID 201014 など）は、商品別税率機能を使う作りが一覧に出ない対象で、使うケースは確かめない（006・028 は実装しない）ので作らない。
 * 作らないシード: 006・028・044 のケース用。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { registerRestore } from "../lib/shared_restore";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { TaxPage, 税率の入力, 税率の行, 日時に直す } from "../pages/admin/m10_07_tax";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1007_ADMIN: Account = { loginId: "m1007_admin", password: "Passw0rd!M1007" };

defineSeed("S-M10-07-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-07試験管理者", account: M1007_ADMIN, メール: "m1007_admin@example.test" });
});

const A日時 = "2020-01-01 00:00";
const 標準: Record<"B" | "C" | "D", 税率の入力> = {
  B: { 税率: "8", 規則: "切り捨て", 日時: "2030-01-01 09:00" },
  C: { 税率: "5", 規則: "切り上げ", 日時: "2030-06-01 12:34" },
  D: { 税率: "7", 規則: "四捨五入", 日時: "2029-01-01 00:00" },
};

const 今の日時 = (): string => new Date().toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }).slice(0, 16);
const 同じ行か = (a: 税率の行, b: 税率の行): boolean => a.id === b.id && a.税率 === b.税率 && a.規則 === b.規則 && 日時に直す(a.日時) === 日時に直す(b.日時);

async function 一覧を読む(browser: Browser): Promise<税率の行[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new TaxPage(page);
    await p.開く();
    return p.一覧を読む();
  });
}
async function IDで消す(browser: Browser, ids: string[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new TaxPage(page);
    for (const id of ids) await p.あれば削除する(id);
  });
}
/** 適用日時が日時のどれかの行を消す（除くID＝元からある行は消さない） */
async function 日時で消す(browser: Browser, 日時: string[], 除くID: string[]): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new TaxPage(page);
    await p.開く();
    const 消す = (await p.一覧を読む()).filter((r) => 日時.includes(日時に直す(r.日時)) && !除くID.includes(r.id)).map((r) => r.id);
    for (const id of 消す) await p.あれば削除する(id);
  });
}
/** 元の一覧の行がそのまま残り、足した行（ID・日時）が無いか */
async function 元のとおりか(browser: Browser, 元: 税率の行[], 足したID: string[], 足した日時: string[]): Promise<boolean> {
  const 今 = await 一覧を読む(browser);
  const 残っている = 元.every((o) => 今.some((r) => 同じ行か(o, r)));
  const 足しが無い = 今.every((r) => 元.some((o) => o.id === r.id) || (!足したID.includes(r.id) && !足した日時.includes(日時に直す(r.日時))));
  return 残っている && 足しが無い;
}

/** ケースが足す税率の日時を、基盤の後始末に登録する（税率を足す操作の前に呼ぶ） */
export async function ケースが足す税率を後始末に登録する(browser: Browser, 日時: string[]): Promise<void> {
  const 元 = await 一覧を読む(browser);
  registerRestore(`ケースが足す税率（適用日時 ${日時.join("・")}）`, 元, () => 日時で消す(browser, 日時, 元.map((r) => r.id)), () => 元のとおりか(browser, 元, [], 日時));
}

export type 作った税率 = { A: string; B: string; C: string; D: string };
const 作った = new Map<string, 作った税率>();
export function 税率IDの(番号: string): 作った税率 {
  const x = 作った.get(番号);
  if (!x) throw new Error(`M10-07 の ${番号} のシードをまだ作っていない`);
  return x;
}

/** 標準の4件（A・B・C と、足してすぐ消すD）を足す。足す前に元の一覧を控え、足した行を消す手続きを基盤へ登録する */
async function 標準の4件を足す(browser: Browser, seedId: string, 番号: string): Promise<作った税率> {
  const 元 = await 一覧を読む(browser);
  const 足したID: string[] = [];
  registerRestore(`M10-07 の税率（${seedId}）`, 元, () => IDで消す(browser, 足したID), () => 元のとおりか(browser, 元, 足したID, []));
  for (const k of ["B", "C", "D"] as const) {
    if (元.some((r) => 日時に直す(r.日時) === 標準[k].日時)) throw new Error(`${seedId}: 適用日時 ${標準[k].日時} の税率が既にある（ほかの人のデータ）ので足せない`);
  }
  // いま有効な税率（適用日時が今以前で最も新しいもの。無ければ基本税率設定）
  const 有効 = 元.filter((r) => /^\d{4}\/\d{1,2}\/\d{1,2}/.test(r.日時) && 日時に直す(r.日時) <= 今の日時()).sort((a, b) => 日時に直す(b.日時).localeCompare(日時に直す(a.日時)))[0]
    ?? 元.find((r) => !/^\d{4}\/\d{1,2}\/\d{1,2}/.test(r.日時));
  const 既存A = 元.find((r) => 日時に直す(r.日時) === A日時);
  const A: 税率の入力 = { 税率: "10", 規則: "四捨五入", 日時: A日時 };
  if (!既存A && 有効 && !(有効.税率 === "10" && 有効.規則 === "四捨五入")) {
    A.税率 = 有効.税率; A.規則 = 有効.規則;
    reportSeedIssue(seedId, `いま有効な税率が消費税率${有効.税率}・${有効.規則}のため、税率A（正本は消費税率10・四捨五入）は、計算を変えないよう同じ消費税率・課税規則で足した`);
  }
  const ids = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new TaxPage(page);
    const out: Record<string, string> = {};
    const 足す = async (k: string, v: 税率の入力) => {
      await p.新規追加する(v, `${seedId} 税率${k}の登録`);
      await p.開く();
      const id = await p.日時でIDを探す(v.日時);
      if (!id) throw new Error(`${seedId}: 足した税率${k}（${v.日時}）が一覧に見つからない`);
      足したID.push(id);
      out[k] = id;
    };
    if (既存A) out.A = 既存A.id; else await 足す("A", A);
    await 足す("B", 標準.B);
    await 足す("C", 標準.C);
    await 足す("D", 標準.D);
    await p.あれば削除する(out.D);
    return out;
  });
  const x = { A: ids.A, B: ids.B, C: ids.C, D: ids.D };
  作った.set(番号, x);
  return x;
}

export const 対象の番号 = ["001", "003", "005", "007", "014", "015", "016", "017", "018", "019", "022", "024", "025", "027", "029", "030", "031", "032", "033", "034", "036", "037", "038", "039", "040", "041"];
for (const n of 対象の番号) {
  defineSeed(`S-M10-07-CASE-${n}`, { needs: ["S-M10-07-ADM"] }, async ({ browser, seed, notes }) => {
    const x = await 標準の4件を足す(browser, seed.シードID, n);
    notes.set(`〔店舗ID-M1007-${n}〕`, "1");
    for (const k of ["A", "B", "C", "D"] as const) notes.set(`〔税率ID-M1007-${n}${k}〕`, x[k]);
  });
}
