/**
 * F07-01 イベント大会TOP のシードが使う、管理画面の操作の組み合わせ（試験店舗・イベント・日程の登録）。
 * 店舗は店舗登録画面、イベントはイベント登録画面、日程はイベント編集画面の「日程追加」から登録する。
 * 画面が振る番号（店舗ID・イベントID）は、一覧・編集画面のアドレスから読む。
 */
import { Page } from "@playwright/test";
import { FIXED_MARK, RUN_MARK } from "../../lib/run_marker";
import { EventInput, registerEvent } from "./event";
import { registerSchedule, ScheduleInput } from "./schedule";
import { Account } from "../../lib/session";
import { ensureMember } from "./member";
import { findTenantId } from "./tenant_k";
import { 店名で使い回す店舗を探す, 店舗の実際を読む } from "../../lib/store_pick";

/** 「他の店舗と重ならない」支店URL（半角英数字）。実行の印と通し番号から作る */
export const 支店URLを作る = (ns: string): string => `f07${ns.toLowerCase().replace(/[^0-9a-z]/g, "")}${RUN_MARK.toLowerCase()}`;
/** 「他の店舗と重ならない」店名略称（3文字）。支店URLから決まる英大文字 */
export const 略称を作る = (s: string): string => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; const L = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return [h % 24, (h >>> 5) % 24, (h >>> 10) % 24].map((i) => L[i]).join(""); };

/**
 * 公開・開店で、支店URLを持つ（店舗の詳細ページがある）試験店舗の店舗IDを返す。店舗は作らない（依頼者 2026-11-15「店舗は作るのもう禁止」）。
 * 店名は、使い回す店舗の表の店舗のいまの店名（呼び出し側が店舗IDから読んだ名）。店舗一覧にあることを確かめる。
 */
export async function 試験店舗を登録する(page: Page, 店名: string, _通番: string, onIssue: (m: string) => void): Promise<string> {
  const s = 店名で使い回す店舗を探す(店名);
  const id = await findTenantId(page, 店名);
  if (id !== s.id) throw new Error(`使い回す店舗「${店名}」（店舗ID ${s.id}）が店舗一覧に無い（${id ?? "なし"}）`);
  onIssue(`試験店舗は作らず、使い回す店舗「${店名}」（店舗ID ${id}）を使った（依頼者 2026-11-15「店舗は作るのもう禁止」）`);
  return id;
}

/** 決まった試験店舗の支店URL。店舗は作らないので、店名の店舗のいまの支店URLを読む（通番は使わない） */
export const 決まった試験店舗の支店URL = (_通番: string, 店名?: string): string => {
  if (!店名) throw new Error("決まった試験店舗の支店URL: 店名を渡す（店舗は作らず、使い回す店舗の支店URLを読む）");
  return 店舗の実際を読む(店名で使い回す店舗を探す(店名).id).支店URL;
};
/** 使い回す店舗の店舗IDを返す（作らない）。試験店舗を登録する と同じ */
export async function 決まった試験店舗を用意する(page: Page, 店名: string, 通番: string, onIssue: (m: string) => void): Promise<string> {
  return 試験店舗を登録する(page, 店名, 通番, onIssue);
}

/** 日程の公開状態を「公開」にして、開始時間だけ指定する。受付・デッキ登録・オンライン受付は付けない */
export const 日程 = (開始時間: string, 公開状態: "公開" | "非公開" = "公開"): ScheduleInput => ({ 開始時間, 受付あり: false, デッキ登録あり: false, 公開状態 });

/** 「任意の有効な値」として固定で入れる、イベントの必須項目 */
const 任意の値: EventInput = { フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎", 定員: "16", 参加費: "0" };

/** イベントを登録し、日程を順に登録して、イベントIDと日程IDの並びを返す */
export async function イベントと日程を登録する(page: Page, v: EventInput, 日程一覧: ScheduleInput[]): Promise<{ イベントID: string; 日程ID: string[] }> {
  const イベントID = await registerEvent(page, { ...任意の値, イベント名英: v.イベント名日, ...v });
  const 日程ID: string[] = [];
  for (const s of 日程一覧) 日程ID.push(await registerSchedule(page, イベントID, s));
  return { イベントID, 日程ID };
}

const p2 = (n: number): string => String(n).padStart(2, "0");
/** ケース実行日（いま）の n 日後の時刻 hh:mm を「2026-11-04 15:00」の形で */
export function 実行日から(日数: number, 時刻: string): string {
  const d = new Date(Date.now() + 日数 * 86_400_000);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${時刻}`;
}

const PASS = "Passw0rd!F0701";
/**
 * 登録した試験店舗を編集できる管理者を用意する（イベント登録画面の「店舗」には、編集できる店舗だけが並ぶ）。
 * 所属店舗とデフォルト検索表示店舗は先頭の店舗。ログインIDは通番と決まった印（実行をまたいで使い回す。依頼者の指示 2026-11-12
 * 「毎回作らずに1個でいけるやつは使い回す」。以前は実行の印つきで、流すたびに管理者が増えていた）。
 * あれば内容（所属・編集可能店舗など）を確かめて使い、無ければ登録する（ensureMember）。
 */
export async function 試験店舗の管理者を用意する(page: Page, 通番: string, 店名一覧: string[]): Promise<Account> {
  // 店舗が替わっても前の内容と食い違わないよう、店舗IDをログインIDに含める（依頼者 2026-11-15: 店舗は作らず使い回す店舗にした）
  const 店舗IDs = 店名一覧.map((n) => 店名で使い回す店舗を探す(n).id).join("");
  const id = `f07a${通番.toLowerCase().replace(/[^0-9a-z]/g, "")}${FIXED_MARK.toLowerCase()}s${店舗IDs}`;
  await ensureMember(page, {
    名前: `F0701管理者${通番}-${FIXED_MARK}`, 所属店舗: 店名一覧[0], ログインID: id, メールアドレス: `${id}@example.test`, パスワード: PASS,
    権限: "システム管理者", デフォルト検索表示店舗: 店名一覧[0], 編集可能店舗: 店名一覧,
  });
  return { loginId: id, password: PASS };
}
