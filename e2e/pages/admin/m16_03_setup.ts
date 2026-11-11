/**
 * M16-03 祝日追加・削除 のシードと後片付けが使う部品。
 * 祝日は共有のマスタなので、手元の祝日（本来の祝日）がある年月日は使わない。ケースごとに、遠い将来（2030年以降）の日付を割り当てる
 * （専用の日付。前の実行の残りがあれば消してから始め、ケースの終わりに自分が足したものを消す）。2030年より前の日付は、消す操作を拒む。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { rc } from "../../lib/run_marker";
import { Account, withAdminSession } from "../../lib/session";
import { expectSaved } from "./common";
import { EventInput, ensureNoEvent, registerEvent } from "./event";
import { 本店の店名 } from "./m05_admin_member";
import { HolidayPage } from "./m16_03_holiday";
import { registerSchedule } from "./schedule";

/** 2056-01-01 → 2056/01/01 */
export const 斜線 = (iso: string) => iso.replace(/-/g, "/");

function 専用の日付か(日付: string): void {
  const y = Number(/^(\d{4})/.exec(日付)?.[1] ?? 0);
  if (y < 2030) throw new Error(`祝日 ${日付} は専用の日付（2030年以降）でない。手元の祝日を消す・書き換えることになるので止める`);
}

/** 期間（2031/01/01 の形、両端を含む）の祝日を、あれば1行ずつ削除して0件にする。消した件数を返す */
export async function 期間の祝日を消す(page: Page, 開始: string, 終了: string): Promise<number> {
  専用の日付か(開始);
  専用の日付か(終了);
  const h = new HolidayPage(page);
  let total = 0;
  for (let guard = 0; guard < 60; guard++) {
    await h.open();
    const hit = (await h.一覧の内容()).findIndex((r) => r.日付 >= 開始 && r.日付 <= 終了);
    if (hit < 0) return total;
    const row = h.一覧の行.nth(hit);
    page.once("dialog", (d) => void d.accept());
    await Promise.all([page.waitForLoadState("load"), row.locator("a", { hasText: "削除" }).first().click({ timeout: 30_000 })]);
    total += 1;
  }
  throw new Error(`祝日 ${開始}〜${終了} を空にできない`);
}

/** 祝日を画面で足し、振られた祝日IDを返す（一覧の、その日付の行の削除リンクのリンク先から読む） */
export async function 祝日を足す(page: Page, 名称: string, 日付ISO: string): Promise<string> {
  専用の日付か(日付ISO);
  const h = new HolidayPage(page);
  await h.open();
  await h.新規登録を押す();
  await h.名称欄.fill(名称);
  await h.日付欄.fill(日付ISO);
  await Promise.all([page.waitForLoadState("load"), h.追加ボタン.click({ timeout: 30_000 })]);
  await expectSaved(page, `祝日「${名称}」（${日付ISO}）の追加`);
  await h.open();
  const row = h.日付の行(斜線(日付ISO));
  if ((await row.count()) !== 1) throw new Error(`祝日「${名称}」（${日付ISO}）を足せていない（その日付の行が ${await row.count()} 件）`);
  const id = await h.行の番号(row);
  if (!id) throw new Error(`祝日「${名称}」の祝日IDを削除リンクから読めない`);
  return id;
}

/** 祝日の管理（シードの準備・後片付け）に使う、全権限の管理者のセッション */
export function 祝日の管理者で<T>(browser: Browser, fn: (page: Page) => Promise<T>): Promise<T> {
  return withAdminSession(browser, SETUP_ADMIN, (page) => fn(page));
}

/** イベント1件と日程（「2045-04-15 13:00」の形）を画面で登録し、日程のID（イベント詳細ID）を順に返す */
export async function イベントと日程を足す(browser: Browser, 管理者: Account, 名前: string, 日程: string[]): Promise<string[]> {
  const 店舗 = await 本店の店名(browser);
  return withAdminSession(browser, 管理者, async (page) => {
    const v: EventInput = {
      イベント名日: rc(名前), イベント名英: rc(`Holiday Flag Event ${名前.replace(/^.*(M1603-\d+)$/, "$1")}`), 店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
      公開状態: "非公開", 定員: "8", 参加費: "0", 支払方法: [],
    };
    const イベントID = await registerEvent(page, v);
    const ids: string[] = [];
    for (const 開始時間 of 日程) {
      ids.push(await registerSchedule(page, イベントID, {
        開始時間, 受付あり: true, 受付時間: { 開始: "10:00", 終了: "12:00" }, デッキ登録あり: false, 公開状態: "非公開", 定員: "8", 参加費: "0",
      }));
    }
    return ids;
  });
}

/** ケースの終わりの後片付け。このケースが足した（専用の日付の）祝日と、このケースが登録したイベントを消す。失敗しても落とさず、残った旨を返す */
export async function 後片付け(browser: Browser, v: { 期間?: [string, string][]; イベント名?: string[]; 管理者?: Account }): Promise<string[]> {
  const left: string[] = [];
  try {
    if (v.イベント名?.length && v.管理者) {
      await withAdminSession(browser, v.管理者, async (page) => { for (const n of v.イベント名!) await ensureNoEvent(page, rc(n)); });
    }
  } catch (e) { left.push(`イベントの後片付けができなかった: ${String(e).slice(0, 200)}`); }
  try {
    if (v.期間?.length) {
      await 祝日の管理者で(browser, async (page) => { for (const [a, b] of v.期間!) await 期間の祝日を消す(page, 斜線(a), 斜線(b)); });
    }
  } catch (e) { left.push(`祝日の後片付けができなかった: ${String(e).slice(0, 200)}`); }
  return left;
}

