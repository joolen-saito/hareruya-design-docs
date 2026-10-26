/**
 * M04-09 在庫移動・振替登録/編集 の画面シード。正本: cases/M04-09_seed_data.tsv
 *
 * 作り方の型（正本の投入方法の共通部分）:
 * 0. 【店舗・所属】S-M04-09-MASTER: この機能のシードとして、店舗登録画面で試験店舗A（本店）・試験店舗B（支店）を登録し（公開・開店・売上集計の検索項目
 *    表示する）、マスタデータ管理で試験所属A・試験所属Bが無ければ足す（pages/admin/m04_09_setup.ts）。管理者と商品より前に作る。
 * 1. 【商品】グッズ商品CSV登録で商品を登録する（商品IDは空・言語は日本語（英語と書いた行は英語）・基準価格1000・販売価格1000・買取価格1000
 *    （141・142 の振替先は800）・原価単価10・商品カテゴリはサプライ・グッズ）。正本が商品コードを決めているので、登録の前に商品マスターで同じ商品コードの商品が
 *    無いことを確かめる（正本に片付けの手順が無いので、残っていれば作らずに止める。流し直しは依頼者の判断）。
 *    グッズ商品CSVのアップロード後の確認モーダルは、いまの実装には無い（依頼者決定 2026-10-22: これだけでは補いとしない）。
 * 2. 【在庫数と総原価】M04-09作業者（試験店舗B の行は M04-09入庫担当者）が在庫編集で入庫/その他・在庫変動理由「M04-09結合テスト」・
 *    在庫増減数・仕入単価・承認通知先 M04-09承認者 で登録し、M04-09承認者が在庫編集承認一覧で一括承認する。在庫検索一覧で在庫・総原価を確かめる。
 * 3. 【在庫移動】在庫検索一覧 →「在庫移動登録」→ 入庫先・移動点数 →「登録」→ 確認モーダル → 在庫移動・振替IDを控える →
 *    （出庫承認申請: 所属 試験所属A・メンバー M04-09承認者）→（M04-09承認者の出庫承認／却下）→（M04-09承認者の在庫移動指示作成と送り状No.の登録で移動中）→
 *    （M04-09入庫担当者の入庫承認申請: 所属は選ばず（指定なし）・メンバー M04-09承認者。裁定 E11）→（M04-09入庫担当者の入庫承認）。
 * 4. 【在庫振替】在庫検索一覧 →「在庫振替登録」→ 振替先の商品コード・振替点数・承認通知先（試験所属A・M04-09承認者）→「登録」→ 番号を控える →
 *    （M04-09承認者の承認／却下）。
 * 5. 【管理者】所属店舗・所属はシード表のとおり（M04-09作業者・M04-09承認者は試験店舗A・試験所属A、M04-09入庫担当者は試験店舗B・試験所属B、
 *    M04-09権限なしユーザーは試験店舗A・B 以外の先頭の店舗・試験所属A）。「承認権限なし」の M04-09作業者・M04-09権限なしユーザーは、
 *    承認権限だけを外した試験用の権限（M04-09試験権限（承認なし））で、承認権限ありの M04-09承認者・M04-09入庫担当者はシステム管理者で作る。
 *
 * 画面の作りが正本の手順と合わず、補ったもの（そのシードを使ったケースの報告に「シード作成時の問題」として出す）:
 * - 欠品点数・差分点数: 正本は「欠品点数（差分点数）に n を入れて「欠品登録」（「差分登録」）を押す」。画面は、その欄が「欠品登録」（「差分登録」）を
 *   押すまで読み取り専用で、押す→入れる→「仮登録」を押す、の順でしか入らない。正本の順で入れられないときは画面の順で入れ、補いとして知らせる。
 * - 入庫承認: 正本は入庫承認申請をした M04-09入庫担当者 が入庫承認する。画面は申請した本人の承認を拒むので、M04-09承認者で承認し、知らせる。
 * - 承認通知先: 在庫編集（試験店舗B）は、M04-09承認者が出ないときだけ M04-09入庫担当者を選び、知らせる。
 *   （入庫承認申請の所属を未選択にする補いは、裁定 E11 で正本が「所属は選ばない」になったので無くなった。2026-10-23）
 * - 権限の名前: 正本は「承認権限なし」とだけ書き、権限の作り方を書かない。権限管理の表に承認権限の列があるので、その列だけを外した権限を作った。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import type { BrowserContext } from "@playwright/test";

/** 管理画面のセッション。操作が止まったまま待ち続けないよう、1つの操作の待ちを3分までにする（テスト全体の制限時間まで待たない） */
export function session<T>(browser: Browser, account: Account, fn: (page: Page, context: BrowserContext) => Promise<T>): Promise<T> {
  return withAdminSession(browser, account, (page, context) => { page.setDefaultTimeout(180_000); return fn(page, context); });
}
import { expectSaved } from "../pages/admin/common";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { countProductsByCode, ensureDepartment, ensureMemberWithDepartment, memberStoreChoices, readGoodsRootCategoryId } from "../pages/admin/m04_13_setup";
import { ensureM0409Store, ensureNoApprovalAuthority, M0409_NO_APPROVAL_AUTHORITY } from "../pages/admin/m04_09_setup";
import { MoveInstructionSearchPage } from "../pages/admin/m04_24_move_instruction";
import {
  approveStockIns, chooseApprovalTarget, confirmInStore, inboundApprovalPath, InboundRequestPage, inboundRequestPath, MoveTransferList, outboundApprovalPath,
  pressApprove, pressReject, readStock, registerMove, registerStockIn, registerTransfer, requestInbound, requestOutbound, searchStock,
  stockListRow, topMessages, transferApprovalPath, 入庫, 入庫担当者名, 在庫区分, 店, 店A, 店B, 所属A, 所属B, 承認者名, 権限なし名, 作業者名,
} from "../pages/admin/m04_09_move";
import { CategoryPage } from "../pages/admin/category";
import { chooseByLabel } from "../pages/admin/common";
import { idsByExactCode, openClassEdit, productRowsByCode, saveClass } from "../pages/admin/m04_19_masters";
import { openProductEdit } from "../pages/admin/product_edit";
import { adminUrl } from "../lib/session";

export const M0409_OP: Account = { loginId: "m0409_operator", password: "Passw0rd!M0409Op" };
export const M0409_APP: Account = { loginId: "m0409_approver", password: "Passw0rd!M0409Ap" };
export const M0409_RCV: Account = { loginId: "m0409_receiver", password: "Passw0rd!M0409Rc" };
export const M0409_NOAUTH: Account = { loginId: "m0409_noauth", password: "Passw0rd!M0409No" };

export type 役 = "作業者" | "承認者" | "入庫担当者";
export const ACCOUNTS: Record<役, Account> = { 作業者: M0409_OP, 承認者: M0409_APP, 入庫担当者: M0409_RCV };
export const NAMES: Record<役, string> = { 作業者: 作業者名, 承認者: 承認者名, 入庫担当者: 入庫担当者名 };

// ---------------------------------------------------------------- 店舗・所属・試験用の権限（S-M04-09-MASTER）

/** 試験店舗A・試験店舗B の店舗ID（このプロセスで一度だけ用意する） */
let storeIds: { A: string; B: string } | null = null;

/** S-M04-09-MASTER: 店舗（店舗登録）・所属（マスタデータ管理）。あわせて、管理者に使う試験用の権限（承認権限なし）を用意する */
export async function ensureEnv(browser: Browser, seedId: string): Promise<{ A: string; B: string }> {
  if (storeIds) return storeIds;
  mustMention("S-M04-09-MASTER", [
    `店名に「${店A}」`, "店舗種別で「本店」", `店名に「${店B}」`, "店舗種別で「支店」", "公開で「公開」", "開店で「開店」", "売上集計の検索項目で「表示する」",
    `「${所属A}」の行が無ければ`, `「${所属B}」の行を足して`,
  ]);
  const issue = (m: string) => reportSeedIssue(seedId, m);
  storeIds = await session(browser, SETUP_ADMIN, async (page) => {
    const A = await ensureM0409Store(page, { 店名: 店A, 店舗種別: "本店", 店名カナ: "シケンテンポエー", 店名英語: "Test Store A", 支店URL: "m0409a", 店名略称3文字: "Q9A" }, issue);
    const B = await ensureM0409Store(page, { 店名: 店B, 店舗種別: "支店", 店名カナ: "シケンテンポビー", 店名英語: "Test Store B", 支店URL: "m0409b", 店名略称3文字: "Q9B" }, issue);
    await ensureDepartment(page, 所属A);
    await ensureDepartment(page, 所属B);
    await ensureNoApprovalAuthority(page);
    return { A, B };
  });
  return storeIds;
}

defineSeed("S-M04-09-MASTER", async ({ browser, seed }) => { await ensureEnv(browser, seed.シードID); });

// ---------------------------------------------------------------- 管理者

/** シード表のログインID・パスワードと、ここに書いた値が同じこと */
function expectAccount(seedId: string, a: Account): void {
  const s = getSeed(seedId);
  if (!s["状態・属性"].includes(`ログインID=${a.loginId}`) || !s["状態・属性"].includes(`パスワード=${a.password}`)) {
    throw new Error(`${seedId}: シード表のログインID・パスワードが ${a.loginId} / ${a.password} でない`);
  }
}

/** このプロセスで内容を確かめ済みの管理者（同じケースの中で何度も確かめない） */
const ensured = new Set<string>();

/** 承認権限の有無で、権限を選ぶ（承認権限なし＝試験用の権限、あり＝システム管理者） */
async function ensureMember(browser: Browser, seedId: string, a: Account, v: { 名前: string; 所属店舗: string; 所属: string; 編集可能店舗: string[]; 承認権限: boolean }): Promise<void> {
  expectAccount(seedId, a);
  // シード表の文に、所属店舗・所属・承認権限の有無が書いてあること（写し間違いを止める）
  const attrs = getSeed(seedId)["状態・属性"];
  // M04-08 のシード表（S-M04-08-OP-A）は所属を書かない。書いてあるときだけ照合する（書いていなければ M04-09 のシード表のとおり）
  if (attrs.includes("所属=") && !attrs.includes(`所属=${v.所属}`)) throw new Error(`${seedId}: シード表の所属が「${v.所属}」でない`);
  if (v.承認権限 === attrs.includes("承認権限なし")) throw new Error(`${seedId}: シード表の承認権限の有無と作り方が合わない`);
  // 承認権限なしの権限の作り方（裁定 E10・2026-10-23）がシード表に書いてあること
  if (!v.承認権限) {
    mustMention(seedId, [`「${M0409_NO_APPROVAL_AUTHORITY}」の行の「承認権限」のチェックを外して「登録」ボタンを押す`, `権限に「${M0409_NO_APPROVAL_AUTHORITY}」`]);
  }
  if (ensured.has(a.loginId)) return;
  await ensureEnv(browser, seedId);
  await session(browser, SETUP_ADMIN, (page) => ensureMemberWithDepartment(page, {
    名前: v.名前, 所属店舗: v.所属店舗, 所属: v.所属, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
    権限: v.承認権限 ? "システム管理者" : M0409_NO_APPROVAL_AUTHORITY, デフォルト検索表示店舗: v.所属店舗, 編集可能店舗: v.編集可能店舗,
  }));
  await session(browser, a, async () => undefined); // ログインできる（稼働中）こと
  ensured.add(a.loginId);
}

export async function ensureOperator(browser: Browser, seedId: string): Promise<void> {
  await ensureMember(browser, seedId, M0409_OP, { 名前: 作業者名, 所属店舗: 店A, 所属: 所属A, 編集可能店舗: [店A], 承認権限: false });
}
export async function ensureApprover(browser: Browser, seedId: string): Promise<void> {
  await ensureMember(browser, seedId, M0409_APP, { 名前: 承認者名, 所属店舗: 店A, 所属: 所属A, 編集可能店舗: [店A, 店B], 承認権限: true });
}
export async function ensureReceiver(browser: Browser, seedId: string): Promise<void> {
  await ensureMember(browser, seedId, M0409_RCV, { 名前: 入庫担当者名, 所属店舗: 店B, 所属: 所属B, 編集可能店舗: [店B], 承認権限: true });
}
export async function ensureNoAuth(browser: Browser, seedId: string): Promise<void> {
  expectAccount(seedId, M0409_NOAUTH);
  if (ensured.has(M0409_NOAUTH.loginId)) return;
  await ensureEnv(browser, seedId);
  const other = await session(browser, SETUP_ADMIN, async (page) => {
    // 所属店舗は、メンバー登録画面の所属店舗の選択肢のうち試験店舗A・B 以外の先頭の店舗（シード表のとおり）
    const found = (await memberStoreChoices(page)).find((s) => s !== 店A && s !== 店B);
    if (!found) throw new Error(`${seedId}: 試験店舗A・B 以外の店舗が、メンバー登録の所属店舗の選択肢に無い`);
    return found;
  });
  // 編集可能店舗はシード表が決めていない（試験店舗A・B を含めない）。メンバー登録画面で必須なので、所属店舗と同じ店舗にした
  await ensureMember(browser, seedId, M0409_NOAUTH, { 名前: 権限なし名, 所属店舗: other, 所属: 所属A, 編集可能店舗: [other], 承認権限: false });
}

defineSeed("S-M04-09-OP-A", async ({ browser, seed }) => { await ensureOperator(browser, seed.シードID); });
defineSeed("S-M04-09-APP-A", async ({ browser, seed }) => { await ensureApprover(browser, seed.シードID); });
defineSeed("S-M04-09-APP-B", async ({ browser, seed }) => { await ensureReceiver(browser, seed.シードID); });
defineSeed("S-M04-09-NOAUTH", async ({ browser, seed }) => { await ensureNoAuth(browser, seed.シードID); });

// ---------------------------------------------------------------- シナリオ（商品・入庫・移動・振替）

export type Goods = { code: string; name?: string; lang?: "日本語" | "英語"; 基準価格?: number; 販売価格?: number; 買取価格?: number };
export type StockCheck = { code: string; store: 店; zone: 在庫区分; stock: number; total: number };
export type MoveUntil = "new" | "instore" | "outwait" | "outapproved" | "rejected" | "transit" | "inwait" | "done";
export type Op =
  /** free: シード表が値を決めていない（正本の外で補った）商品・入庫。シード表の文との照合をしない */
  | { op: "goods"; items: Goods[]; free?: boolean }
  | { op: "in"; items: 入庫[]; check?: StockCheck[]; free?: boolean }
  | { op: "check"; items: StockCheck[] }
  | {
    op: "move"; label: string; from: { store: 店; zone: 在庫区分 }; to: { store: string; zone: 在庫区分 };
    lines: { code: string; qty: number }[]; memo?: string; shortages?: { code: string; qty: number }[];
    until: MoveUntil; reject?: string; diffs?: { code: string; qty: number }[];
    /** 登録する管理者（既定は作業者）・承認通知先（既定は試験所属A の承認者）・出庫承認する管理者（既定は承認者） */
    by?: 役; notify?: { 所属: string; メンバー: string }; approver?: 役;
    /** シード表の文との照合を、店名でなく別の書き方で行うとき */
    mention?: string[];
  }
  | { op: "inbound"; label: string; diffs?: { code: string; qty: number }[]; until: "inwait" | "done" }
  | {
    op: "transfer"; label: string; store: 店; zone: 在庫区分; lines: { code: string; dest: string; qty: number }[];
    by?: 役; until: "wait" | "done" | "rejected"; reject?: string; memo?: string; mention?: string[];
  }
  | { op: "productId"; code: string; label: string }
  /** 商品検索の候補にする: 商品カテゴリを試験カテゴリAに変え、商品規格に高額商品コード・価格・部門・公開を入れる */
  | { op: "candidate"; code: string; highCode: string }
  /** 商品登録編集の「カード指定 >」で、カード検索の結果の先頭のカードを指定して「商品を登録」（商品名などはカードの値のまま） */
  | { op: "card"; code: string }
  /** 在庫移動・振替検索一覧で行を選んで「在庫移動指示作成」を押す（送り状No.は登録しない） */
  | { op: "instruction"; label: string; by?: 役 };

const 理由 = "M04-09結合テスト";
const 送り状No = "M0409-TEST";

/** 英語の言語ID（商品マスターの検索欄の言語の選択肢から読む） */
async function readLanguageId(page: Page, label: string): Promise<string> {
  await page.goto(adminUrl("/product"));
  const choices = await page.locator('input[name^="admin_search_product[language]"]').evaluateAll((inputs) => inputs.map((node) => {
    const input = node as HTMLInputElement;
    return { id: input.value, label: input.labels?.item(0)?.textContent?.trim() ?? "" };
  }));
  const hit = choices.filter((c) => c.label === label && /^\d+$/.test(c.id));
  if (hit.length !== 1) throw new Error(`言語「${label}」の ID を画面から一意に読めない: ${JSON.stringify(choices)}`);
  return hit[0].id;
}

/** シード表の文に、作り方に書いた値が出てくること（写し間違いを止める） */
function mustMention(seedId: string, fragments: string[]): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  const missing = fragments.filter((f) => !text.includes(f));
  if (missing.length) throw new Error(`${seedId}: 作り方の値がシード表に無い: ${missing.join(" / ")}`);
}

/** 正本の商品コードの商品が残っていないことを確かめてから、グッズ商品CSVで登録する */
async function registerGoods(browser: Browser, seedId: string, items: Goods[], free = false): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  if (!free) {
    mustMention(seedId, items.map((g) => `「${g.code}」`));
    // 共通の値（1000）と違う価格は、シード表のその行に書いてあること
    for (const g of items.filter((x) => x.基準価格 !== undefined)) mustMention(seedId, [`商品コードは「${g.code}」`, `基準価格${g.基準価格}・販売価格${g.販売価格}・買取価格${g.買取価格}`]);
  }
  await session(browser, SETUP_ADMIN, async (page) => {
    for (const g of items) {
      const n = await countProductsByCode(page, g.code);
      if (n > 0) throw new Error(`${seedId}: 商品コード ${g.code} の商品が既に${n}件ある（前の実行の残り。正本に片付けの手順が無いので作らずに止めた。流し直しは依頼者の判断）`);
    }
    const categoryId = await readGoodsRootCategoryId(page);
    const english = items.some((g) => g.lang === "英語") ? await readLanguageId(page, "英語") : "";
    const args = (extra: Record<string, string>) => ({
      what: `${seedId}: グッズ商品CSV登録（${items.map((g) => g.code).join("・")}）`, fileName: "m04-09-goods.csv", categoryId, onWarning: issue,
      common: { "基準価格": "1000", "販売価格": "1000", "買取価格": "1000", "原価単価": "10", ...extra },
      lines: items.map((g) => {
        const values: Record<string, string> = {};
        if (g.lang === "英語") values["言語(ID)"] = english;
        if (g.基準価格 !== undefined) values["基準価格"] = String(g.基準価格);
        if (g.販売価格 !== undefined) values["販売価格"] = String(g.販売価格);
        if (g.買取価格 !== undefined) values["買取価格"] = String(g.買取価格);
        const name = g.name ?? g.code;
        return { code: g.code, nameJp: name, nameEn: name, values };
      }),
    });
    // シード表の「地域別販売制限は0・スマレジ連携フラグは0」。雛形にその列が無ければ、入れずに登録して知らせる
    try {
      await registerGoodsCsv(page, args({ "地域別販売制限": "0", "スマレジ連携フラグ": "0" }));
    } catch (e) {
      const m = (e as Error).message;
      if (!m.includes("雛形に正本指定列")) throw e;
      issue(`グッズ商品CSVの雛形に列が無いので、地域別販売制限・スマレジ連携フラグを入れずに登録した（${m.split("\n")[0]}）`);
      await registerGoodsCsv(page, args({}));
    }
  });
  issue("グッズ商品CSVのアップロードのあと、確認モーダルは出ず、そのまま取り込まれた（依頼者決定 2026-10-22: これだけでは補いとしない）");
}

/** 入庫（店舗A は作業者、店舗B は入庫担当者が登録）→ 承認者が承認 → 在庫検索一覧で確かめる */
async function stockIn(browser: Browser, seedId: string, items: 入庫[], check?: StockCheck[], free = false): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  if (!free) mustMention(seedId, items.map((s) => `在庫増減数=${s.qty}`).concat(items.map((s) => `仕入単価=${s.unit}`)));
  for (const store of [店A, 店B] as const) {
    const mine = items.filter((s) => s.store === store);
    if (!mine.length) continue;
    const who: 役 = store === 店A ? "作業者" : "入庫担当者";
    await session(browser, ACCOUNTS[who], async (page) => {
      for (const s of mine) await registerStockIn(page, s, 理由, 承認者名, issue, store === 店B ? 入庫担当者名 : undefined);
    });
    await session(browser, M0409_APP, (page) => approveStockIns(page, store, mine, NAMES[who], issue));
  }
  const expected = check ?? items.map((s) => ({ code: s.code, store: s.store, zone: s.zone, stock: s.qty, total: s.qty * s.unit }));
  await checkStock(browser, seedId, expected);
}

async function checkStock(browser: Browser, seedId: string, items: StockCheck[]): Promise<void> {
  await session(browser, M0409_APP, async (page) => {
    for (const c of items) {
      const v = await readStock(page, c.code, c.store, c.zone);
      if (v.在庫 !== c.stock || v.総原価 !== c.total) {
        throw new Error(`${seedId}: ${c.code}（${c.store}・${c.zone}）の在庫・総原価が ${v.在庫}・${v.総原価}（シード表は ${c.stock}・${c.total}）`);
      }
    }
  });
}

/** 一覧で行を選んで開いた画面のアドレスが、求める画面であること */
async function openRow(page: Page, id: string, want: RegExp, what: string): Promise<void> {
  const list = new MoveTransferList(page);
  await list.searchById(id);
  await list.openFromRow(id);
  if (!want.test(new URL(page.url()).pathname)) throw new Error(`${what}: 在庫移動・振替検索一覧の行から開いた画面が求める画面でない（${page.url()}）`);
}

async function statusOf(page: Page, id: string): Promise<{ ステータス: string; 移動指示リストID: string }> {
  const list = new MoveTransferList(page);
  await list.searchById(id);
  return list.rowState(id);
}

async function expectStatus(page: Page, seedId: string, id: string, want: string): Promise<void> {
  const s = await statusOf(page, id);
  if (s.ステータス !== want) throw new Error(`${seedId}: 在庫移動・振替 ${id} のステータスが「${s.ステータス}」（「${want}」のはず）`);
  // シード表の「入庫完了」の状態は、画面の表示名が「入庫済み」（表示名の食い違いは 066・086・110 などのケースが確かめる）
  if (want === "入庫済み") reportSeedIssue(seedId, `在庫移動・振替 ${id} の入庫完了の状態は、一覧のステータスの表示名が「入庫済み」（シード表は「入庫完了」）。同じ状態として先へ進んだ`);
}

async function inbound(browser: Browser, seedId: string, id: string, diffs: { code: string; qty: number }[], until: "inwait" | "done"): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  mustMention(seedId, diffs.map((d) => `${d.code}の差分点数に${d.qty}`));
  await session(browser, M0409_RCV, async (page): Promise<"done" | "retry" | void> => {
    await openRow(page, id, inboundRequestPath(id), `${seedId}: 在庫移動 ${id} の入庫承認申請`);
    const req = page.locator("#stock_move_inbound_approval_request_form");
    await expect(req, `${seedId}: 移動入庫承認申請画面`).toBeVisible();
    // 差分の仮登録と承認通知先（requestInbound と同じ操作。承認通知先だけ所属の扱いを変える）
    const p = new InboundRequestPage(page);
    for (const d of diffs) await p.registerDiffAsWritten(d.code, d.qty, issue);
    // 入庫承認申請の承認通知先は、所属を選ばず（指定なし）メンバーに M04-09承認者 を選ぶ（裁定 E11・2026-10-23）
    mustMention(seedId, ["入庫承認申請画面を開き", `承認通知先の所属は選ばず（指定なしのまま）、メンバー=${承認者名}`]);
    await chooseApprovalTarget(page, "admin_stock_move_inbound_approval_request", "", [承認者名]);
    await p.submit.click();
    const modal = page.locator("#stockMoveInboundConfirmModal");
    await expect(modal, `${seedId}: 入庫承認申請の確認モーダル`).toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
    for (const w of await expectSaved(page, `${seedId}: 在庫移動 ${id} の入庫承認申請`)) issue(w);
    if (!inboundApprovalPath(id).test(new URL(page.url()).pathname)) throw new Error(`${seedId}: 入庫承認申請のあと、入庫承認画面へ移らない（${page.url()}）`);
    await expectStatus(page, seedId, id, "入庫承認待ち");
    if (until === "inwait") return;
    await openRow(page, id, inboundApprovalPath(id), `${seedId}: 在庫移動 ${id} の入庫承認`);
    await pressApprove(page, "inbound_approval_approve_btn");
    const m = await topMessages(page);
    if (m.エラー.length) {
      // 画面は、入庫承認申請をした管理者（更新者）の入庫承認を拒む。シード表は入庫担当者が申請と承認の両方を行うとするので、
      // 承認できなかったときは、試験店舗B を編集できる M04-09承認者 で承認し、シードの問題として報告に出す
      issue(`入庫担当者で入庫承認を押すと「${m.エラー.join(" / ")}」で承認できなかった（申請した本人は承認できない作り）。M04-09承認者で入庫承認した`);
      return "retry";
    }
    for (const w of await expectSaved(page, `${seedId}: 在庫移動 ${id} の入庫承認`)) issue(w);
    await expectStatus(page, seedId, id, "入庫済み");
    return "done";
  }).then(async (r) => {
    if (r !== "retry") return;
    await session(browser, M0409_APP, async (page) => {
      await openRow(page, id, inboundApprovalPath(id), `${seedId}: 在庫移動 ${id} の入庫承認（M04-09承認者）`);
      await pressApprove(page, "inbound_approval_approve_btn");
      for (const w of await expectSaved(page, `${seedId}: 在庫移動 ${id} の入庫承認（M04-09承認者）`)) issue(w);
      await expectStatus(page, seedId, id, "入庫済み");
    });
  });
}

async function move(ctx: SeedCtx, o: Extract<Op, { op: "move" }>): Promise<void> {
  const { browser, notes } = ctx;
  const seedId = ctx.seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  mustMention(seedId, o.mention ?? [o.label, `入庫先店舗=${o.to.store}`, `入庫先在庫区分=${o.to.zone}`, ...o.lines.map((l) => `移動点数=${l.qty}`)]);
  if (o.memo) mustMention(seedId, [`「${o.memo}」`]);
  for (const s of o.shortages ?? []) mustMention(seedId, [`${s.code}の欠品点数に${s.qty}`]);
  const notify = o.notify ?? { 所属: 所属A, メンバー: 承認者名 };
  const id = await session(browser, ACCOUNTS[o.by ?? "作業者"], async (page) => {
    const id = await registerMove(page, { from: o.from, to: o.to, lines: o.lines, memo: o.memo }, `${seedId}: 在庫移動の登録`, issue);
    notes.set(o.label, id);
    if (o.until === "new") return id;
    if (o.until === "instore") {
      await confirmInStore(page, id, { shortages: o.shortages }, `${seedId}: 在庫移動 ${id} の店舗内入庫確定`, issue);
      return id;
    }
    await requestOutbound(page, id, { 所属: notify.所属, メンバー: notify.メンバー, shortages: o.shortages }, `${seedId}: 在庫移動 ${id} の出庫承認申請`, issue);
    return id;
  });
  if (o.until === "new" || o.until === "instore") return;
  await session(browser, ACCOUNTS[o.approver ?? "承認者"], async (page) => {
    await expectStatus(page, seedId, id, "出庫承認待ち");
    if (o.until === "outwait") return;
    await openRow(page, id, outboundApprovalPath(id), `${seedId}: 在庫移動 ${id} の出庫承認`);
    if (o.until === "rejected") {
      const r = await pressReject(page, "outbound_approval_reject_btn", o.reject ?? "M04-09結合テスト却下");
      if (!r.modal) throw new Error(`${seedId}: 在庫移動 ${id} の「却下」で確認モーダルが出ない（${r.invalid.join(" / ")}）`);
      for (const w of await expectSaved(page, `${seedId}: 在庫移動 ${id} の出庫却下`)) issue(w);
      await expectStatus(page, seedId, id, "却下");
      return;
    }
    await pressApprove(page, "outbound_approval_approve_btn");
    for (const w of await expectSaved(page, `${seedId}: 在庫移動 ${id} の出庫承認`)) issue(w);
    await expectStatus(page, seedId, id, "出庫承認済み");
    if (o.until === "outapproved") return;
    // 移動中にする: 在庫移動指示作成 → 在庫移動指示一覧で送り状No.を登録（一覧の検索は出庫元・入庫先の店舗が必須）
    const list = new MoveTransferList(page);
    await list.searchById(id);
    const r = await list.pressCreateInstruction([id]);
    if (!r.moved) throw new Error(`${seedId}: 在庫移動 ${id} の「在庫移動指示作成」で画面が移らない（ポップアップ: ${r.dialogs.join(" / ") || "なし"}）`);
    for (const w of await expectSaved(page, `${seedId}: 在庫移動 ${id} の在庫移動指示作成`)) issue(w);
    const state = await statusOf(page, id);
    if (!/^\d+$/.test(state.移動指示リストID)) throw new Error(`${seedId}: 在庫移動指示作成のあと、在庫移動 ${id} の移動指示リストIDが「${state.移動指示リストID}」`);
    const ids = await ensureEnv(browser, seedId);
    const search = new MoveInstructionSearchPage(page);
    await search.open();
    if (o.to.store !== 店A && o.to.store !== 店B) throw new Error(`${seedId}: 試験店舗A・B 以外への移動を移動中にする作り方は無い`);
    const s = await search.searchById(state.移動指示リストID, { 出庫元店舗ID: ids[o.from.store === 店A ? "A" : "B"], 入庫先店舗ID: ids[o.to.store === 店A ? "A" : "B"] });
    if (!s.sent) throw new Error(`${seedId}: 在庫移動指示検索の検索が止まった: ${s.止めた項目.join(" / ")}`);
    await search.pressTrackingRegister(state.移動指示リストID);
    const t = await search.submitTracking(state.移動指示リストID, 送り状No);
    if (!t.sent) throw new Error(`${seedId}: 送り状No.の登録が止まった: ${t.止めた項目.join(" / ")}`);
    for (const w of await expectSaved(page, `${seedId}: 在庫移動指示 ${state.移動指示リストID} の送り状No.の登録`)) issue(w);
    await expectStatus(page, seedId, id, "移動中");
  });
  if (o.until === "outwait" || o.until === "rejected" || o.until === "outapproved" || o.until === "transit") return;
  await inbound(browser, seedId, id, o.diffs ?? [], o.until);
}

async function transfer(ctx: SeedCtx, o: Extract<Op, { op: "transfer" }>): Promise<void> {
  const { browser, notes } = ctx;
  const seedId = ctx.seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  mustMention(seedId, o.mention ?? [o.label, ...o.lines.map((l) => `振替点数=${l.qty}`)]);
  const by = o.by ?? "作業者";
  const id = await session(browser, ACCOUNTS[by], async (page) => {
    const id = await registerTransfer(page, { store: o.store, zone: o.zone, lines: o.lines, 所属: 所属A, メンバー: 承認者名, memo: o.memo }, `${seedId}: 在庫振替の登録`, issue);
    notes.set(o.label, id);
    return id;
  });
  await session(browser, M0409_APP, async (page) => {
    await expectStatus(page, seedId, id, "振替承認待ち");
    if (o.until === "wait") return;
    await openRow(page, id, transferApprovalPath(id), `${seedId}: 在庫振替 ${id} の承認`);
    if (o.until === "rejected") {
      const r = await pressReject(page, "transfer_approval_reject_btn", o.reject ?? "M04-09結合テスト却下");
      if (!r.modal) throw new Error(`${seedId}: 在庫振替 ${id} の「却下」で確認モーダルが出ない（${r.invalid.join(" / ")}）`);
      for (const w of await expectSaved(page, `${seedId}: 在庫振替 ${id} の却下`)) issue(w);
      await expectStatus(page, seedId, id, "却下");
      return;
    }
    await pressApprove(page, "transfer_approval_approve_btn");
    for (const w of await expectSaved(page, `${seedId}: 在庫振替 ${id} の承認`)) issue(w);
    await expectStatus(page, seedId, id, "入庫済み");
  });
}

/** 在庫検索一覧で商品コードの行の商品IDを読んで控える */
async function noteProductId(ctx: SeedCtx, code: string, label: string): Promise<void> {
  mustMention(ctx.seed.シードID, [label]);
  const id = await session(ctx.browser, M0409_OP, async (page) => {
    await searchStock(page, 店A, "EC-CUBE", code);
    const row = stockListRow(page, code, 店A, "EC-CUBE");
    await expect(row, `在庫検索一覧の「${code}」の行`).toHaveCount(1);
    return ((await row.locator("td.col-id").innerText()) ?? "").trim();
  });
  if (!/^\d+$/.test(id)) throw new Error(`${ctx.seed.シードID}: 在庫検索一覧の商品IDを読めない: 「${id}」`);
  ctx.notes.set(label, id);
}

/**
 * カテゴリ登録/編集画面に試験カテゴリAが無ければ登録する。カテゴリIDを返す。
 * 画面は最上位（ルート直下）への登録を提供しない（設計書 M03-11 L0130。入力欄は親カテゴリを選んだときだけ出る）。
 * シード表は登録する階層を書いていないので、商品の元のカテゴリ「サプライ・グッズ」の子として登録する（正本の外の補い。報告に出す）。
 */
async function ensureTestCategoryA(page: Page, issue: (m: string) => void): Promise<string> {
  const rootId = await readGoodsRootCategoryId(page);
  const cat = new CategoryPage(page);
  await cat.openChildrenOf(rootId);
  const has = (await cat.rowValues()).filter((r) => r.nameJp === "試験カテゴリA");
  if (has.length > 1) throw new Error("サプライ・グッズの下に「試験カテゴリA」が複数ある");
  issue("カテゴリ「試験カテゴリA」は、最上位に登録する画面が無いので、サプライ・グッズの子として使う（正本の外の補い）");
  if (has.length === 1) return has[0].id;
  return cat.createChild(rootId, { nameJp: "試験カテゴリA", nameEn: "Test Category A" }, issue);
}

async function makeCandidate(ctx: SeedCtx, code: string, highCode: string): Promise<void> {
  const seedId = ctx.seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  mustMention(seedId, [`高額商品コードに「${highCode}」`, "試験カテゴリA"]);
  await session(ctx.browser, SETUP_ADMIN, async (page) => {
    const catId = await ensureTestCategoryA(page, issue);
    const productId = idsByExactCode(await productRowsByCode(page, code), [code]).get(code)!;
    await openProductEdit(page, productId);
    const form = page.locator("form#form1");
    for (const box of await form.locator('input[name="admin_product[Category][]"]:checked').all()) await box.uncheck();
    await form.locator(`#admin_product_category_${catId}`).check();
    const discount = form.locator('select[name="admin_product[Discount]"]');
    const opts = await discount.locator("option").evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLOptionElement).value, l: (n.textContent ?? "").trim() })).filter((o) => o.v));
    if (!opts.length) throw new Error(`${seedId}: 割引率に選べる値が無い`);
    await discount.selectOption(opts[0].v);
    issue(`割引率に「${opts[0].l}」を選んだ（シード表: 販売割引率に登録済みのもの）`);
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click()]);
    for (const w of await expectSaved(page, `${seedId}: ${code} の商品登録編集`)) issue(w);
    await openClassEdit(page, productId, code);
    const cf = page.locator("form#form");
    await cf.locator("#admin_product_class_high_price_code").fill(highCode);
    await cf.locator("#admin_product_class_standard_price").fill("1000");
    await cf.locator("#admin_product_class_price02").fill("1000");
    await cf.locator("#admin_product_class_buy_price").fill("1000");
    const section = cf.locator("#admin_product_class_Section");
    const sv = await section.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).filter(Boolean));
    if (!sv.length) throw new Error(`${seedId}: 部門に選べる値が無い`);
    await section.selectOption(sv[0]);
    await chooseByLabel(cf.locator("#admin_product_class_Status"), "公開");
    await saveClass(page, `${seedId}: ${code} の商品規格登録`, issue);
  });
}

async function assignFirstCard(ctx: SeedCtx, code: string): Promise<void> {
  const seedId = ctx.seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  mustMention(seedId, [`商品コードに「${code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「カード指定 >」`]);
  await session(ctx.browser, SETUP_ADMIN, async (page) => {
    const productId = idsByExactCode(await productRowsByCode(page, code), [code]).get(code)!;
    await openProductEdit(page, productId);
    const form = page.locator("form#form1");
    await page.locator('button[data-bs-target="#searchCardDetailModal"]').click();
    const modal = page.locator("#searchCardDetailModal");
    await expect(modal, "カード検索ポップアップ").toBeVisible();
    await modal.locator("#searchCardDetailModalButton").click();
    const first = modal.locator("#searchCardDetailModalList tbody tr").first();
    await expect(first, "カード検索の結果の先頭の行").toBeVisible({ timeout: 60_000 });
    issue(`${code}: カード検索の結果の先頭の行（${(await first.innerText()).replace(/\s+/g, " ").trim().slice(0, 80)}）を指定した`);
    await first.getByRole("button", { name: "決定", exact: true }).click();
    await expect(modal, "カードを決定するとカード検索が閉じる").toBeHidden();
    // 必須（「必須」の印がある行）で未選択の選択欄に、先頭の選択肢を選ぶ（シード表: 割引率に販売割引率に登録済みのもの）。
    // 未入力の必須の入力欄は値を推測しない（どの欄かを挙げて止める）
    const requiredRows = form.locator(".row").filter({ has: page.locator(":scope > .col-3 .badge", { hasText: "必須" }) });
    const emptyInputs: string[] = [];
    for (const r of await requiredRows.all()) {
      const label = ((await r.locator(":scope > .col-3 span").first().textContent()) ?? "").trim();
      for (const select of await r.locator(":scope > .col select").all()) {
        if (await select.inputValue()) continue;
        const opts = await select.locator("option").evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLOptionElement).value, l: (n.textContent ?? "").trim() })).filter((o) => o.v));
        if (!opts.length) throw new Error(`${seedId}: 必須の「${label}」に選べる値が無い`);
        await select.selectOption(opts[0].v);
        issue(`${code}: 必須で未選択の「${label}」に「${opts[0].l}」を選んだ`);
      }
      for (const input of await r.locator(':scope > .col input[type="text"], :scope > .col input[type="number"], :scope > .col textarea').all()) {
        if (await input.isVisible() && !(await input.inputValue())) emptyInputs.push(`${label}（${await input.getAttribute("name")}）`);
      }
    }
    if (emptyInputs.length) throw new Error(`${seedId}: カードを指定したあと、必須の入力欄が空: ${emptyInputs.join(" / ")}（シード表はカードの値をそのままにするとし、値を決めていない）`);
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click()]);
    for (const w of await expectSaved(page, `${seedId}: ${code} のカード指定`)) issue(w);
  });
}

export async function runScenario(ctx: SeedCtx, ops: Op[]): Promise<void> {
  const seedId = ctx.seed.シードID;
  await ensureEnv(ctx.browser, seedId);
  await ensureOperator(ctx.browser, "S-M04-09-OP-A");
  await ensureApprover(ctx.browser, "S-M04-09-APP-A");
  if (ops.some((o) => (o.op === "in" && o.items.some((s) => s.store === 店B)) || (o.op === "move" && ["inwait", "done"].includes(o.until)) || o.op === "inbound")) {
    await ensureReceiver(ctx.browser, "S-M04-09-APP-B");
  }
  for (const o of ops) {
    switch (o.op) {
      case "goods": await registerGoods(ctx.browser, seedId, o.items, o.free); break;
      case "in": await stockIn(ctx.browser, seedId, o.items, o.check, o.free); break;
      case "check": await checkStock(ctx.browser, seedId, o.items); break;
      case "move": await move(ctx, o); break;
      case "inbound": {
        mustMention(seedId, [o.label]);
        await inbound(ctx.browser, seedId, ctx.notes.get(o.label), o.diffs ?? [], o.until);
        break;
      }
      case "transfer": await transfer(ctx, o); break;
      case "productId": await noteProductId(ctx, o.code, o.label); break;
      case "candidate": await makeCandidate(ctx, o.code, o.highCode); break;
      case "card": await assignFirstCard(ctx, o.code); break;
      case "instruction": {
        const id = ctx.notes.get(o.label);
        await session(ctx.browser, ACCOUNTS[o.by ?? "作業者"], async (page) => {
          const list = new MoveTransferList(page);
          await list.searchById(id);
          const r = await list.pressCreateInstruction([id]);
          if (!r.moved) throw new Error(`${seedId}: 在庫移動 ${id} の「在庫移動指示作成」で画面が移らない（ポップアップ: ${r.dialogs.join(" / ") || "なし"}）`);
          for (const w of await expectSaved(page, `${seedId}: 在庫移動 ${id} の在庫移動指示作成`)) reportSeedIssue(seedId, w);
          const st = await statusOf(page, id);
          if (!/^\d+$/.test(st.移動指示リストID)) throw new Error(`${seedId}: 在庫移動指示作成のあと、在庫移動 ${id} の移動指示リストIDが「${st.移動指示リストID}」`);
        });
        break;
      }
    }
  }
}

// ---------------------------------------------------------------- シードの作り方を短く書く部品

const EC = "EC-CUBE" as const;
const SM = "スマレジ" as const;
const g = (code: string, extra: Partial<Goods> = {}): Goods => ({ code, ...extra });
const inA = (code: string, qty: number, unit: number, zone: 在庫区分 = EC): 入庫 => ({ code, store: 店A, zone, qty, unit });
const inB = (code: string, qty: number, unit: number, zone: 在庫区分 = EC): 入庫 => ({ code, store: 店B, zone, qty, unit });
type 端 = { store: 店; zone: 在庫区分 };
const AtoB: { from: 端; to: 端 } = { from: { store: 店A, zone: EC }, to: { store: 店B, zone: EC } };
const AtoAsm: { from: 端; to: 端 } = { from: { store: 店A, zone: EC }, to: { store: 店A, zone: SM } };
const chk = (code: string, store: 店, zone: 在庫区分, stock: number, total: number): StockCheck => ({ code, store, zone, stock, total });

function defineScenarioSeed(seedId: string, ops: Op[], needs: string[] = []): void {
  defineSeed(seedId, { needs }, (ctx) => runScenario(ctx, ops));
}

/** 商品1件（A・EC-CUBE に入庫）だけのシード */
function defineProductSeed(seedId: string, code: string, opts: { name?: string; lang?: "日本語" | "英語"; qty?: number; unit?: number; b?: [number, number] } = {}): void {
  const ins = [inA(code, opts.qty ?? 10, opts.unit ?? 100)];
  if (opts.b) ins.push(inB(code, opts.b[0], opts.b[1]));
  defineScenarioSeed(seedId, [{ op: "goods", items: [g(code, { name: opts.name, lang: opts.lang })] }, { op: "in", items: ins }]);
}

/** 1商品（A・EC-CUBE に10点・仕入単価100）を A→B へ移動点数 qty で登録し、until まで進めるシード */
function defineMoveSeed(seedId: string, code: string, label: string, until: MoveUntil, opts: {
  qty?: number; inQty?: number; b?: [number, number]; shortages?: number; diff?: number; reject?: string; after?: (Op)[]; postCheck?: StockCheck[];
} = {}): void {
  const ins = [inA(code, opts.inQty ?? 10, 100)];
  if (opts.b) ins.push(inB(code, opts.b[0], opts.b[1]));
  const ops: Op[] = [{ op: "goods", items: [g(code)] }, { op: "in", items: ins }];
  const lines = [{ code, qty: opts.qty ?? 3 }];
  const shortages = opts.shortages ? [{ code, qty: opts.shortages }] : undefined;
  if (opts.after) {
    ops.push({ op: "move", label, ...AtoB, lines, until: "transit", shortages });
    ops.push(...opts.after);
    ops.push({ op: "inbound", label, diffs: opts.diff !== undefined ? [{ code, qty: opts.diff }] : [], until: until as "inwait" | "done" });
  } else {
    ops.push({ op: "move", label, ...AtoB, lines, until, shortages, reject: opts.reject, diffs: opts.diff !== undefined ? [{ code, qty: opts.diff }] : undefined });
  }
  if (opts.postCheck) ops.push({ op: "check", items: opts.postCheck });
  defineScenarioSeed(seedId, ops);
}

/** 2商品（A・B とも A・EC-CUBE に10点・仕入単価100）を A→B へ移動するシード */
function defineTwoMoveSeed(seedId: string, a: string, b: string, label: string, until: MoveUntil, qa: number, qb: number): void {
  defineScenarioSeed(seedId, [
    { op: "goods", items: [g(a), g(b)] },
    { op: "in", items: [inA(a, 10, 100), inA(b, 10, 100)] },
    { op: "move", label, ...AtoB, lines: [{ code: a, qty: qa }, { code: b, qty: qb }], until },
  ]);
}

/** 振替元（10点・100）と振替先（4点・150）を作り、振替点数 qty で登録して until まで進めるシード */
function defineTransferSeed(seedId: string, src: string, dest: string, label: string, until: "wait" | "done" | "rejected", opts: { qty?: number; by?: 役; reject?: string; check?: boolean } = {}): void {
  const ops: Op[] = [
    { op: "goods", items: [g(src), g(dest)] },
    { op: "in", items: [inA(src, 10, 100), inA(dest, 4, 150)] },
    { op: "transfer", label, store: 店A, zone: EC, lines: [{ code: src, dest, qty: opts.qty ?? 3 }], by: opts.by, until, reject: opts.reject },
  ];
  if (opts.check !== false && until === "wait") ops.push({ op: "check", items: [chk(src, 店A, EC, 7, 700), chk(dest, 店A, EC, 4, 600)] });
  defineScenarioSeed(seedId, ops);
}

/** 振替2件（1件目・2件目）を登録して承認待ちのままにするシード */
function defineTwoTransfersSeed(seedId: string, n: string): void {
  const [a, ta, b, tb] = [`M409-TR-A-${n}`, `M409-TR-TO-A-${n}`, `M409-TR-B-${n}`, `M409-TR-TO-B-${n}`];
  defineScenarioSeed(seedId, [
    { op: "goods", items: [g(a), g(ta), g(b), g(tb)] },
    { op: "in", items: [inA(a, 10, 100), inA(ta, 4, 150), inA(b, 10, 100), inA(tb, 4, 150)] },
    { op: "transfer", label: `〔在庫振替ID-M0409-${n}A〕`, store: 店A, zone: EC, lines: [{ code: a, dest: ta, qty: 3 }], until: "wait" },
    { op: "transfer", label: `〔在庫振替ID-M0409-${n}B〕`, store: 店A, zone: EC, lines: [{ code: b, dest: tb, qty: 3 }], until: "wait" },
    { op: "check", items: [chk(a, 店A, EC, 7, 700), chk(ta, 店A, EC, 4, 600), chk(b, 店A, EC, 7, 700), chk(tb, 店A, EC, 4, 600)] },
  ]);
}

// ---------------------------------------------------------------- 共有のシード（完了・却下の表示データ。使う各ケースの開始時に作り直す）

defineScenarioSeed("S-M04-09-MOVE-FINAL", [
  { op: "goods", items: [g("M409-FIN-DONE"), g("M409-FIN-REJ")] },
  { op: "in", items: [inA("M409-FIN-DONE", 10, 100), inA("M409-FIN-REJ", 10, 100)] },
  { op: "move", label: "〔在庫移動ID-M0409-共有A〕", ...AtoB, lines: [{ code: "M409-FIN-DONE", qty: 1 }], memo: "完了メモ", until: "done" },
  { op: "move", label: "〔在庫移動ID-M0409-共有B〕", ...AtoB, lines: [{ code: "M409-FIN-REJ", qty: 1 }], memo: "却下メモ", until: "rejected" },
], ["S-M04-09-APP-B"]);

defineScenarioSeed("S-M04-09-TRANSFER-FINAL", [
  { op: "goods", items: [g("M409-TRF-DONE-A"), g("M409-TRF-DONE-TO"), g("M409-TRF-REJ-A"), g("M409-TRF-REJ-TO")] },
  { op: "in", items: [inA("M409-TRF-DONE-A", 10, 100), inA("M409-TRF-DONE-TO", 4, 150), inA("M409-TRF-REJ-A", 10, 100), inA("M409-TRF-REJ-TO", 4, 150)] },
  { op: "transfer", label: "〔在庫振替ID-M0409-共有A〕", store: 店A, zone: EC, lines: [{ code: "M409-TRF-DONE-A", dest: "M409-TRF-DONE-TO", qty: 1 }], until: "done" },
  { op: "transfer", label: "〔在庫振替ID-M0409-共有B〕", store: 店A, zone: EC, lines: [{ code: "M409-TRF-REJ-A", dest: "M409-TRF-REJ-TO", qty: 1 }], until: "rejected", reject: "振替内容不一致" },
]);

// ---------------------------------------------------------------- 在庫移動の登録（商品と在庫だけ）

defineProductSeed("S-M04-09-PRODUCTS-015", "M409-MOV-A-015", { name: "移動商品A" });
defineProductSeed("S-M04-09-PRODUCTS-017", "M409-MOV-A-017");
defineProductSeed("S-M04-09-PRODUCTS-018", "M409-MOV-A-018");
defineScenarioSeed("S-M04-09-BOUNDARY-019", [
  { op: "goods", items: [g("M409-MOV-MIN-019"), g("M409-MOV-MAX-019")] },
  { op: "in", items: [inA("M409-MOV-MIN-019", 1, 100), inA("M409-MOV-MAX-019", 1000000, 1)] },
]);
defineProductSeed("S-M04-09-PRODUCTS-021", "M409-MOV-A-021");
defineProductSeed("S-M04-09-PRODUCTS-022", "M409-MOV-A-022");
defineProductSeed("S-M04-09-PRODUCTS-024", "M409-MOV-B-024", { unit: 200 });
defineProductSeed("S-M04-09-PRODUCTS-026", "M409-MOV-A-026");
defineProductSeed("S-M04-09-PRODUCTS-027", "M409-MOV-A-027");
defineProductSeed("S-M04-09-PRODUCTS-028", "M409-MOV-A-028");
defineProductSeed("S-M04-09-GF-STOCK-095", "M0409-095-A", { b: [5, 100] });
defineProductSeed("S-M04-09-GF-STOCK-096", "M0409-096-A");
defineProductSeed("S-M04-09-GF-STOCK-099", "M0409-099-A");
defineProductSeed("S-M04-09-GF-PRODUCTS-102", "M0409-102-A", { name: "M0409-102-A 日本語商品名", lang: "英語" });
defineProductSeed("S-M04-09-GF-PRODUCTS-103", "M0409-103-A", { name: "M0409-103-A 日本語商品名", lang: "英語" });
defineProductSeed("S-M04-09-CBMOVEREG-170", "M0409-CB170-A");

// ---------------------------------------------------------------- 在庫移動（新規登録のまま）

defineTwoMoveSeed("S-M04-09-MOVE-NEW-031", "M409-MOV-A-031", "M409-MOV-B-031", "〔在庫移動ID-M0409-031〕", "new", 3, 2);
defineMoveSeed("S-M04-09-MOVE-NEW-033", "M409-MOV-A-033", "〔在庫移動ID-M0409-033〕", "new");
defineMoveSeed("S-M04-09-MOVE-NEW-034", "M409-MOV-A-034", "〔在庫移動ID-M0409-034〕", "new");
defineMoveSeed("S-M04-09-MOVE-NEW-035", "M409-MOV-A-035", "〔在庫移動ID-M0409-035〕", "new");
defineTwoMoveSeed("S-M04-09-MOVE-NEW-039", "M409-MOV-A-039", "M409-MOV-B-039", "〔在庫移動ID-M0409-039〕", "new", 1, 1);
defineTwoMoveSeed("S-M04-09-MOVE-NEW-040", "M409-MOV-A-040", "M409-MOV-B-040", "〔在庫移動ID-M0409-040〕", "new", 1, 1);
defineMoveSeed("S-M04-09-GF-MOVE-NEW-106", "M0409-106-A", "〔在庫移動ID-M0409-106〕", "new");
defineMoveSeed("S-M04-09-GF-MOVE-NEW-115", "M0409-115-A", "〔在庫移動ID-M0409-115〕", "new", { postCheck: [chk("M0409-115-A", 店A, EC, 7, 700)] });
defineMoveSeed("S-M04-09-GF-MOVE-NEW-116", "M0409-116-A", "〔在庫移動ID-M0409-116〕", "new");

/** 店舗内の移動（A・EC-CUBE 10点 → A・スマレジ 4点。移動点数3。新規登録のまま） */
function defineInternalMoveSeed(seedId: string, code: string, label: string): void {
  defineScenarioSeed(seedId, [
    { op: "goods", items: [g(code)] },
    { op: "in", items: [inA(code, 10, 100), inA(code, 4, 100, SM)] },
    { op: "move", label, ...AtoAsm, lines: [{ code, qty: 3 }], until: "new" },
    { op: "check", items: [chk(code, 店A, EC, 7, 700), chk(code, 店A, SM, 4, 400)] },
  ]);
}
defineInternalMoveSeed("S-M04-09-MOVE-INTERNAL-038", "M409-MOV-A-038", "〔在庫移動ID-M0409-038〕");
defineInternalMoveSeed("S-M04-09-GF-MOVE-INTERNAL-114", "M0409-114-A", "〔在庫移動ID-M0409-114〕");
defineInternalMoveSeed("S-M04-09-DP-MOVE-INTERNAL-158", "M0409-158-A", "〔在庫移動ID-M0409-158〕");

// ---------------------------------------------------------------- 在庫移動（出庫承認待ち）

function defineOutwaitSeed(seedId: string, code: string, n: string, opts: { shortages?: number } = {}): void {
  defineMoveSeed(seedId, code, `〔在庫移動ID-M0409-${n}〕`, "outwait", { shortages: opts.shortages, postCheck: [chk(code, 店A, EC, 7, 700)] });
}
defineOutwaitSeed("S-M04-09-MOVE-OUTWAIT-042", "M409-MOV-A-042", "042");
defineOutwaitSeed("S-M04-09-MOVE-OUTWAIT-043", "M409-MOV-A-043", "043");
defineOutwaitSeed("S-M04-09-MOVE-OUTWAIT-044", "M409-MOV-A-044", "044");
defineOutwaitSeed("S-M04-09-MOVE-OUTWAIT-045", "M409-MOV-A-045", "045");
defineOutwaitSeed("S-M04-09-MOVE-OUTWAIT-046", "M409-MOV-A-046", "046");
defineMoveSeed("S-M04-09-GF-MOVE-OUTWAIT-107", "M0409-107-A", "〔在庫移動ID-M0409-107〕", "outwait");
defineOutwaitSeed("S-M04-09-GF-MOVE-OUTWAIT-122", "M0409-122-A", "122");
defineOutwaitSeed("S-M04-09-GF-MOVE-OUTWAIT-123", "M0409-123-A", "123");
defineOutwaitSeed("S-M04-09-GF-MOVE-OUTWAIT-131", "M0409-131-A", "131");
defineOutwaitSeed("S-M04-09-DP-MOVE-OUTWAIT-157", "M0409-157-A", "157");
defineOutwaitSeed("S-M04-09-CBOUTWAIT-178", "M0409-CB178-A", "178");
defineOutwaitSeed("S-M04-09-CBOUTWAIT-179", "M0409-CB179-A", "179", { shortages: 1 });
defineScenarioSeed("S-M04-09-DP-MOVE-OUTWAIT-153", [
  { op: "goods", items: [g("M0409-153-A"), g("M0409-153-B")] },
  { op: "in", items: [inA("M0409-153-A", 10, 100), inA("M0409-153-B", 10, 100)] },
  { op: "move", label: "〔在庫移動ID-M0409-153〕", ...AtoB, lines: [{ code: "M0409-153-A", qty: 3 }, { code: "M0409-153-B", qty: 2 }], shortages: [{ code: "M0409-153-A", qty: 1 }], until: "outwait" },
  { op: "check", items: [chk("M0409-153-A", 店A, EC, 7, 700), chk("M0409-153-B", 店A, EC, 8, 800)] },
]);
defineScenarioSeed("S-M04-09-DP-MOVE-OUTWAIT-156", [
  { op: "goods", items: [g("M0409-156-A"), g("M0409-156-B")] },
  { op: "in", items: [inA("M0409-156-A", 10, 100), inA("M0409-156-B", 10, 100)] },
  { op: "move", label: "〔在庫移動ID-M0409-156〕", ...AtoB, lines: [{ code: "M0409-156-A", qty: 3 }, { code: "M0409-156-B", qty: 2 }], until: "outwait" },
  { op: "check", items: [chk("M0409-156-A", 店A, EC, 7, 700), chk("M0409-156-B", 店A, EC, 8, 800)] },
]);

// ---------------------------------------------------------------- 在庫移動（移動中）

defineTwoMoveSeed("S-M04-09-MOVE-TRANSIT-041", "M409-MOV-A-041", "M409-MOV-B-041", "〔在庫移動ID-M0409-041〕", "transit", 1, 1);
defineTwoMoveSeed("S-M04-09-MOVE-TRANSIT-047", "M409-MOV-A-047", "M409-MOV-B-047", "〔在庫移動ID-M0409-047〕", "transit", 1, 1);
defineTwoMoveSeed("S-M04-09-MOVE-TRANSIT-048", "M409-MOV-A-048", "M409-MOV-B-048", "〔在庫移動ID-M0409-048〕", "transit", 3, 2);
defineMoveSeed("S-M04-09-MOVE-TRANSIT-050", "M409-MOV-A-050", "〔在庫移動ID-M0409-050〕", "transit");
defineMoveSeed("S-M04-09-MOVE-TRANSIT-053", "M409-MOV-A-053", "〔在庫移動ID-M0409-053〕", "transit", { qty: 1 });
defineTwoMoveSeed("S-M04-09-MOVE-TRANSIT-056", "M409-MOV-A-056", "M409-MOV-B-056", "〔在庫移動ID-M0409-056〕", "transit", 1, 1);
defineTwoMoveSeed("S-M04-09-MOVE-TRANSIT-058", "M409-MOV-A-058", "M409-MOV-B-058", "〔在庫移動ID-M0409-058〕", "transit", 1, 1);
defineMoveSeed("S-M04-09-GF-MOVE-TRANSIT-108", "M0409-108-A", "〔在庫移動ID-M0409-108〕", "transit");
defineMoveSeed("S-M04-09-GF-MOVE-TRANSIT-126", "M0409-126-A", "〔在庫移動ID-M0409-126〕", "transit");
defineMoveSeed("S-M04-09-GF-MOVE-TRANSIT-128", "M0409-128-A", "〔在庫移動ID-M0409-128〕", "transit");
/** 移動中の在庫移動（M0409-CB<n>-A・移動点数1）と、明細に無い差分商品の候補（M0409-CB<n>-B。別のCSVで登録） */
function defineDiffCandidateSeed(seedId: string, n: string): void {
  const a = `M0409-CB${n}-A`;
  const b = `M0409-CB${n}-B`;
  defineScenarioSeed(seedId, [
    { op: "goods", items: [g(a)] },
    { op: "goods", items: [g(b)] },
    { op: "in", items: [inA(a, 10, 100)] },
    { op: "move", label: `〔在庫移動ID-M0409-${n}〕`, ...AtoB, lines: [{ code: a, qty: 1 }], until: "transit" },
  ]);
}
defineDiffCandidateSeed("S-M04-09-CBDIFFADD-195", "195");
defineDiffCandidateSeed("S-M04-09-CBDIFFSTAT-196", "196");

// ---------------------------------------------------------------- 在庫移動（入庫承認待ち・入庫完了・却下）

defineScenarioSeed("S-M04-09-MOVE-INWAIT-SHORT-059", [
  { op: "goods", items: [g("M409-MOV-A-059"), g("M409-MOV-B-059")] },
  { op: "in", items: [inA("M409-MOV-A-059", 10, 100), inA("M409-MOV-B-059", 10, 100)] },
  { op: "move", label: "〔在庫移動ID-M0409-059〕", ...AtoB, lines: [{ code: "M409-MOV-A-059", qty: 3 }, { code: "M409-MOV-B-059", qty: 1 }], until: "inwait", diffs: [{ code: "M409-MOV-A-059", qty: 1 }] },
], ["S-M04-09-APP-B"]);
const inwaitAB = (code: string) => [chk(code, 店A, EC, 7, 700), chk(code, 店B, EC, 5, 500)];
defineMoveSeed("S-M04-09-MOVE-INWAIT-SHORT-060", "M409-MOV-A-060", "〔在庫移動ID-M0409-060〕", "inwait", { b: [5, 100], diff: 1, postCheck: inwaitAB("M409-MOV-A-060") });
defineMoveSeed("S-M04-09-MOVE-INWAIT-NORMAL-061", "M409-MOV-A-061", "〔在庫移動ID-M0409-061〕", "inwait", { b: [5, 100], postCheck: inwaitAB("M409-MOV-A-061") });
defineMoveSeed("S-M04-09-MOVE-INWAIT-SHORT-062", "M409-MOV-A-062", "〔在庫移動ID-M0409-062〕", "inwait", { b: [5, 100], diff: 1, postCheck: inwaitAB("M409-MOV-A-062") });
/** 出庫元を在庫9・総原価1800にする（移動中のあと、2点・仕入単価550の入庫） */
const topUp = (code: string): Op[] => [
  { op: "in", items: [inA(code, 2, 550)], check: [chk(code, 店A, EC, 9, 1800), chk(code, 店B, EC, 0, 0)] },
];
defineMoveSeed("S-M04-09-MOVE-INWAIT-SURPLUS-063", "M409-MOV-A-063", "〔在庫移動ID-M0409-063〕", "inwait", { diff: -1, after: topUp("M409-MOV-A-063") });
defineMoveSeed("S-M04-09-MOVE-INWAIT-NOSTOCK-064", "M409-MOV-A-064", "〔在庫移動ID-M0409-064〕", "inwait", {
  inQty: 3, diff: -1, postCheck: [chk("M409-MOV-A-064", 店A, EC, 0, 0), chk("M409-MOV-A-064", 店B, EC, 0, 0)],
});
defineMoveSeed("S-M04-09-MOVE-INWAIT-SHORT-065", "M409-MOV-A-065", "〔在庫移動ID-M0409-065〕", "inwait", { b: [5, 100], diff: 1, postCheck: inwaitAB("M409-MOV-A-065") });
defineMoveSeed("S-M04-09-GF-MOVE-INWAIT-109", "M0409-109-A", "〔在庫移動ID-M0409-109〕", "inwait");
defineMoveSeed("S-M04-09-GF-MOVE-INWAIT-127", "M0409-127-A", "〔在庫移動ID-M0409-127〕", "inwait", { b: [5, 100], diff: 1, postCheck: inwaitAB("M0409-127-A") });
defineMoveSeed("S-M04-09-GF-MOVE-INWAIT-130", "M0409-130-A", "〔在庫移動ID-M0409-130〕", "inwait", { b: [5, 100], postCheck: [chk("M0409-130-A", 店B, EC, 5, 500)] });
defineMoveSeed("S-M04-09-GF-MOVE-INWAIT-132", "M0409-132-A", "〔在庫移動ID-M0409-132〕", "inwait", { b: [5, 100], diff: 1, postCheck: inwaitAB("M0409-132-A") });
defineMoveSeed("S-M04-09-GF-MOVE-INWAIT-133", "M0409-133-A", "〔在庫移動ID-M0409-133〕", "inwait", { diff: -1, after: topUp("M0409-133-A") });
defineScenarioSeed("S-M04-09-DP-MOVE-INWAIT-155", [
  { op: "goods", items: [g("M0409-155-A"), g("M0409-155-B"), g("M0409-155-C")] },
  { op: "in", items: [inA("M0409-155-A", 10, 100), inA("M0409-155-B", 10, 100), inA("M0409-155-C", 10, 100), inB("M0409-155-A", 5, 100), inB("M0409-155-B", 5, 100)] },
  { op: "move", label: "〔在庫移動ID-M0409-155〕", ...AtoB, lines: [{ code: "M0409-155-A", qty: 3 }, { code: "M0409-155-B", qty: 3 }, { code: "M0409-155-C", qty: 3 }], until: "transit" },
  { op: "in", items: [inA("M0409-155-C", 2, 550)], check: [chk("M0409-155-C", 店A, EC, 9, 1800), chk("M0409-155-C", 店B, EC, 0, 0)] },
  { op: "inbound", label: "〔在庫移動ID-M0409-155〕", diffs: [{ code: "M0409-155-B", qty: 1 }, { code: "M0409-155-C", qty: -1 }], until: "inwait" },
  { op: "check", items: [...inwaitAB("M0409-155-A"), ...inwaitAB("M0409-155-B")] },
], ["S-M04-09-APP-B"]);
defineScenarioSeed("S-M04-09-GF-MOVE-FINAL-110", [
  { op: "goods", items: [g("M0409-110-A"), g("M0409-110-B")] },
  { op: "in", items: [inA("M0409-110-A", 10, 100), inA("M0409-110-B", 10, 100)] },
  { op: "move", label: "〔在庫移動ID-M0409-110A〕", ...AtoB, lines: [{ code: "M0409-110-A", qty: 3 }], until: "done" },
  { op: "move", label: "〔在庫移動ID-M0409-110B〕", ...AtoB, lines: [{ code: "M0409-110-B", qty: 3 }], until: "rejected" },
], ["S-M04-09-APP-B"]);

// ---------------------------------------------------------------- 在庫振替

defineScenarioSeed("S-M04-09-TRANSFER-PRODUCTS-067", [
  { op: "goods", items: [g("M409-TR-A-067"), g("M409-TR-B-067")] },
  { op: "card", code: "M409-TR-A-067" },
  { op: "card", code: "M409-TR-B-067" },
  { op: "in", items: [inA("M409-TR-A-067", 10, 100), inA("M409-TR-B-067", 10, 100)] },
]);
defineScenarioSeed("S-M04-09-TRANSFER-PRODUCTS-068", [
  { op: "goods", items: [g("M409-TR-A-068"), g("M409-TR-TO-A-068")] },
  { op: "card", code: "M409-TR-A-068" },
  { op: "card", code: "M409-TR-TO-A-068" },
  { op: "in", items: [inA("M409-TR-A-068", 10, 100), inA("M409-TR-TO-A-068", 4, 150)] },
]);
defineScenarioSeed("S-M04-09-SEARCH-PRODUCTS", [
  { op: "goods", items: [g("M409-DIFF-01", { name: "差分候補商品" })] },
  { op: "candidate", code: "M409-DIFF-01", highCode: "M409DIFF01" },
  { op: "productId", code: "M409-DIFF-01", label: "〔商品ID-M0409-共有〕" },
]);
defineScenarioSeed("S-M04-09-TRANSFER-PRODUCTS-069", [
  { op: "goods", items: [g("M409-TR-A-069"), g("M409-TR-TO-A-069", { name: "振替候補商品" })] },
  { op: "candidate", code: "M409-TR-TO-A-069", highCode: "M409TRTOA069" },
  { op: "in", items: [inA("M409-TR-A-069", 10, 100), inA("M409-TR-TO-A-069", 4, 150)] },
  { op: "productId", code: "M409-TR-TO-A-069", label: "〔商品ID-M0409-069〕" },
]);
defineProductSeed("S-M04-09-TRANSFER-PRODUCTS-078", "M409-TR-A-078");
defineProductSeed("S-M04-09-GF-TRANSFER-PRODUCTS-139", "M0409-139-A");
defineScenarioSeed("S-M04-09-TRANSFER-PRODUCTS-074", [
  { op: "goods", items: [g("M409-TR-A-074"), g("M409-TR-TO-A-074")] },
  { op: "in", items: [inA("M409-TR-A-074", 10, 100), inA("M409-TR-TO-A-074", 4, 150)] },
]);
defineScenarioSeed("S-M04-09-GF-TRANSFER-PRODUCTS-141", [
  { op: "goods", items: [g("M0409-141-A"), g("M0409-141-B", { name: "M0409-141-B 振替先商品", lang: "英語", 基準価格: 800, 販売価格: 800, 買取価格: 800 })] },
  { op: "in", items: [inA("M0409-141-A", 10, 100), inA("M0409-141-B", 4, 150)] },
]);
defineScenarioSeed("S-M04-09-GF-TRANSFER-PRODUCTS-142", [
  { op: "goods", items: [g("M0409-142-A"), g("M0409-142-B", { name: "M0409-142-B 振替候補", lang: "英語", 基準価格: 800, 販売価格: 800, 買取価格: 800 })] },
  { op: "in", items: [inA("M0409-142-A", 10, 100), inA("M0409-142-B", 4, 150)] },
  { op: "productId", code: "M0409-142-B", label: "〔商品ID-M0409-142〕" },
]);
defineTwoTransfersSeed("S-M04-09-TRANSFER-WAIT-080", "080");
defineTwoTransfersSeed("S-M04-09-TRANSFER-WAIT-081", "081");
defineTwoTransfersSeed("S-M04-09-TRANSFER-WAIT-085", "085");
defineTransferSeed("S-M04-09-TRANSFER-WAIT-082", "M409-TR-A-082", "M409-TR-TO-A-082", "〔在庫振替ID-M0409-082〕", "wait");
defineTransferSeed("S-M04-09-TRANSFER-WAIT-083", "M409-TR-A-083", "M409-TR-TO-A-083", "〔在庫振替ID-M0409-083〕", "wait");
defineTransferSeed("S-M04-09-TRANSFER-WAIT-084", "M409-TR-A-084", "M409-TR-TO-A-084", "〔在庫振替ID-M0409-084〕", "wait");
defineTransferSeed("S-M04-09-GF-TRANSFER-WAIT-124", "M0409-124-A", "M0409-124-B", "〔在庫振替ID-M0409-124〕", "wait");
defineTransferSeed("S-M04-09-GF-TRANSFER-WAIT-125", "M0409-125-A", "M0409-125-B", "〔在庫振替ID-M0409-125〕", "wait");
defineTransferSeed("S-M04-09-GF-TRANSFER-WAIT-135", "M0409-135-A", "M0409-135-B", "〔在庫振替ID-M0409-135〕", "wait");
defineTransferSeed("S-M04-09-GF-TRANSFER-WAIT-136", "M0409-136-A", "M0409-136-B", "〔在庫振替ID-M0409-136〕", "wait");
defineTransferSeed("S-M04-09-GF-TRANSFER-WAIT-144", "M0409-144-A", "M0409-144-B", "〔在庫振替ID-M0409-144〕", "wait", { check: false });
defineTransferSeed("S-M04-09-GF-TRANSFER-WAIT-145", "M0409-145-A", "M0409-145-B", "〔在庫振替ID-M0409-145〕", "wait", { by: "承認者" });
defineTransferSeed("S-M04-09-GF-TRANSFER-WAIT-146", "M0409-146-A", "M0409-146-B", "〔在庫振替ID-M0409-146〕", "wait", { by: "承認者" });

/** 試験店舗A・B の店舗ID（シードが用意したもの） */
export function m0409StoreIds(): { A: string; B: string } {
  if (!storeIds) throw new Error("試験店舗A・B の店舗IDをまだ読んでいない（シードを作る前）");
  return storeIds;
}
