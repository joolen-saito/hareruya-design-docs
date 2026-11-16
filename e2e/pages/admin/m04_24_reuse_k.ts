/**
 * 店舗を作らずに使い回す（依頼者 2026-11-15「店舗は作るのもう禁止。１個だけを使い回す」。lib/store_create_ban.ts）ための、
 * M04-24 の店舗・メンバーの部品の栗野担当の機能向けの版。
 * 齋藤さんの機能の部品（pages/admin/m04_24_store.ts・m04_24_member.ts・m04_21_stock_change_csv.ts・m04_25_move_chain.ts）は変えずに、ここで包む。
 * - 店舗: 使い回す店舗の入力（店舗ID つき）なら、店舗一覧にあることを確かめて店舗IDを返す。店舗IDの無い入力は、店舗を作らずに止める。
 * - メンバー: 「店舗は付け替える」なら、登録済みの E2E の管理者の所属店舗・デフォルト検索表示店舗・編集可能店舗だけが違うとき、
 *   止めずにメンバー編集画面で付け替えて保存する（前に作った店舗から使い回す店舗へ替えたため）。そのほかが違えば止める。
 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { 店舗の作成は禁止 } from "../../lib/store_create_ban";
import { 店舗の実際を読む, 読み替えの文 } from "../../lib/store_pick";
import { expectSaved } from "./common";
import { findMemberId } from "./member";
import { createMemberByStoreIds, expectMemberByStoreIds, M0424MemberInput as 元のメンバーの入力 } from "./m04_24_member";
import { expectStore, findOpenStoreId, M0424StoreInput as 元の店舗の入力 } from "./m04_24_store";
import { ensureMemberWithDept as 元のensureMemberWithDept, MemberWithDept as 元の所属つきメンバー } from "./m04_21_stock_change_csv";
import { ensureStoreWithThresholds as 元のensureStoreWithThresholds } from "./m04_25_move_chain";

export { createMemberByStoreIds, expectMemberByStoreIds, expectStore, findOpenStoreId };

export type M0424StoreInput = 元の店舗の入力 & {
  /** 店舗を作らず使い回す店舗（既存の店舗）の店舗ID。ensureStore は作らず、この店舗が店舗一覧にあることを確かめて返す */
  店舗ID?: string; 正本の店名?: string;
};
export type M0424MemberInput = 元のメンバーの入力 & { 店舗は付け替える?: boolean };
export type MemberWithDept = 元の所属つきメンバー & { 店舗は付け替える?: boolean };

/**
 * 店舗を作らずに、使い回す店舗の表の店舗IDで表す入力。店名・支店URLは、その店舗のいまの値を読む（実行の中で読んだときに決まる）。
 * 正本の店名（シード表の店名）は、読み替えの記録に使う。
 */
export function 使い回す店舗の入力(店舗ID: string, 正本の店名: string): M0424StoreInput {
  return {
    get 店名() { return 店舗の実際を読む(店舗ID).店名; }, get 支店URL() { return 店舗の実際を読む(店舗ID).支店URL; },
    店名カナ: "", 店名英語: "", 店名略称3文字: "", ショップ名略称: "", 会社名: "", 会社名カナ: "", 郵便番号: "", 都道府県: "", 住所1: "", 住所2: "", 電話番号: "",
    店舗ID, 正本の店名,
  };
}

/** 店舗一覧の店舗ID・店名 */
async function 店舗一覧(page: Page): Promise<{ id: string; 店名: string }[]> {
  const res = await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"));
  if (!res || !res.ok()) throw new Error(`店舗一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  return page.locator('table.table tbody tr[id^="ex-tenant-"]').evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { id: td(1), 店名: td(2) };
  }));
}

/** 使い回す店舗が店舗一覧にあることを確かめて、店舗IDを返す（作らない）。読み替えを onIssue に残す */
export async function 使い回す店舗を確かめる(page: Page, v: M0424StoreInput, onIssue: (message: string) => void): Promise<string> {
  const id = v.店舗ID ?? "";
  const hit = (await 店舗一覧(page)).filter((s) => s.id === id);
  if (hit.length !== 1) throw new Error(`使い回す店舗（店舗ID ${id}）が店舗一覧に無い`);
  onIssue(読み替えの文(v.正本の店名 ?? "（正本の店名なし）", { id, 店名: hit[0].店名 }));
  return id;
}

/** 店舗は作らない。店舗の登録は必ず止める */
export async function createStore(_page: Page, _v: M0424StoreInput, _店舗種別: "本店" | "支店" = "支店"): Promise<void> {
  店舗の作成は禁止("pages/admin/m04_24_reuse_k.ts の createStore");
}

/**
 * 使い回す店舗の入力（店舗ID つき）なら、店舗一覧にあることを確かめて店舗IDを返す。
 * 店舗IDの無い入力は、店名・会社名が一致する開店の店舗があればそれを使い、無ければ作らずに止める。
 */
export async function ensureStore(page: Page, v: M0424StoreInput, onIssue: (message: string) => void, _店舗種別: "本店" | "支店" = "支店"): Promise<string> {
  if (v.店舗ID) return 使い回す店舗を確かめる(page, v, onIssue);
  const id = await findOpenStoreId(page, v.店名, v.会社名);
  if (!id) 店舗の作成は禁止(`pages/admin/m04_24_reuse_k.ts の ensureStore（店舗「${v.店名}」）`);
  await expectStore(page, id, v);
  return id;
}

const 店舗の項目 = /^(所属店舗ID|デフォルト検索表示店舗ID|編集可能店舗ID):/;

/** 「内容が違う: …」の誤りが、店舗の項目（所属・デフォルト検索表示・編集可能）だけの違いか */
function 店舗だけが違う(e: unknown): boolean {
  const m = /内容が違う: ([\s\S]*)$/.exec((e as Error).message ?? "");
  return !!m && m[1].split(" / ").every((d) => 店舗の項目.test(d));
}

/** メンバー編集画面で、所属店舗・編集可能店舗・デフォルト検索表示店舗を求める店舗に付け替えて保存する（パスワードは触らない） */
async function 店舗を付け替える(page: Page, 管理者ID: string, v: { 名前: string; 所属店舗ID: string; デフォルト検索表示店舗ID: string; 編集可能店舗ID: string[] }): Promise<void> {
  await page.goto(adminUrl(`/setting/system/member/${管理者ID}/edit`));
  await page.waitForLoadState("load");
  const 選択肢 = async (selector: string) => page.locator(`${selector} option`).evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  const 確かめる = async (selector: string, ids: string[], what: string) => {
    const values = await 選択肢(selector);
    const missing = ids.filter((id) => !values.includes(id));
    if (missing.length) throw new Error(`${what}に店舗ID ${missing.join("・")} の選択肢が無い`);
  };
  await 確かめる('[name="admin_member[baseInfo]"]', [v.所属店舗ID], "所属店舗");
  await page.locator('[name="admin_member[baseInfo]"]').selectOption(v.所属店舗ID);
  await 確かめる('[name="admin_member[editableBaseInfos][]"]', v.編集可能店舗ID, "編集可能店舗");
  await page.locator('[name="admin_member[editableBaseInfos][]"]').selectOption(v.編集可能店舗ID);
  await 確かめる('[name="admin_member[defaultSearchBaseInfo]"]', [v.デフォルト検索表示店舗ID], "デフォルト検索表示店舗");
  await page.locator('[name="admin_member[defaultSearchBaseInfo]"]').selectOption(v.デフォルト検索表示店舗ID);
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `メンバー「${v.名前}」の店舗の付け替え`);
}

/** 登録済みのメンバーの所属・編集可能・デフォルト検索表示店舗だけが違うときは付け替えて保存し、そのほかが違えば止める */
export async function 店舗の付け替えを許して確かめる(page: Page, 管理者ID: string, v: M0424MemberInput): Promise<void> {
  try { await expectMemberByStoreIds(page, 管理者ID, v); } catch (e) {
    if (!店舗だけが違う(e)) throw e;
    await 店舗を付け替える(page, 管理者ID, v);
    await expectMemberByStoreIds(page, 管理者ID, v);
  }
}

/** あれば内容を確かめて使い、無ければ登録する。管理者IDを返す（「店舗は付け替える」なら店舗だけの違いは付け替える） */
export async function ensureMemberByStoreIds(page: Page, v: M0424MemberInput): Promise<string> {
  const found = await findMemberId(page, v.名前);
  if (!found) return createMemberByStoreIds(page, v);
  if (v.店舗は付け替える) await 店舗の付け替えを許して確かめる(page, found, v);
  else await expectMemberByStoreIds(page, found, v);
  return found;
}

/** ensureMemberByStoreIds と同じだが、E2E の管理者の店舗が前の店舗のままなら付け替えて使う */
export const ensureMemberByStoreIdsFix = (page: Page, v: M0424MemberInput): Promise<string> => ensureMemberByStoreIds(page, { ...v, 店舗は付け替える: true });

/** pages/admin/m04_21_stock_change_csv.ts の ensureMemberWithDept と同じだが、「店舗は付け替える」なら店舗だけの違いは付け替えて使う */
export async function ensureMemberWithDept(page: Page, v: MemberWithDept): Promise<string> {
  try {
    return await 元のensureMemberWithDept(page, v);
  } catch (e) {
    if (!v.店舗は付け替える || !店舗だけが違う(e)) throw e;
    const id = /（管理者ID (\d+)）/.exec((e as Error).message)?.[1];
    if (!id) throw e;
    await 店舗を付け替える(page, id, v);
    return 元のensureMemberWithDept(page, v);
  }
}

/**
 * pages/admin/m04_25_move_chain.ts の ensureStoreWithThresholds と同じだが、店舗が無ければ作らずに止める
 * （店名・会社名が一致する開店の店舗があれば、元の部品で高額商品閾値を確かめて使う）
 */
export async function ensureStoreWithThresholds(page: Page, v: Parameters<typeof 元のensureStoreWithThresholds>[1], onIssue: (m: string) => void): Promise<string> {
  const id = await findOpenStoreId(page, v.店名, v.会社名);
  if (!id) 店舗の作成は禁止(`pages/admin/m04_24_reuse_k.ts の ensureStoreWithThresholds（店舗「${v.店名}」）`);
  return 元のensureStoreWithThresholds(page, v, onIssue);
}
