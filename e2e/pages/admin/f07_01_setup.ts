/**
 * F07-01 イベント大会TOP のシードが使う、管理画面の操作の組み合わせ（試験店舗・イベント・日程の登録）。
 * 店舗は店舗登録画面、イベントはイベント登録画面、日程はイベント編集画面の「日程追加」から登録する。
 * 画面が振る番号（店舗ID・イベントID）は、一覧・編集画面のアドレスから読む。
 */
import { Page } from "@playwright/test";
import { RUN_MARK } from "../../lib/run_marker";
import { EventInput, registerEvent } from "./event";
import { registerSchedule, ScheduleInput } from "./schedule";
import { Account } from "../../lib/session";
import { ensureMember } from "./member";
import { ensureTenant } from "./tenant";

/** 「他の店舗と重ならない」支店URL（半角英数字）。実行の印と通し番号から作る */
export const 支店URLを作る = (ns: string): string => `f07${ns.toLowerCase().replace(/[^0-9a-z]/g, "")}${RUN_MARK.toLowerCase()}`;
/** 「他の店舗と重ならない」店名略称（3文字）。支店URLから決まる英大文字 */
export const 略称を作る = (s: string): string => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; const L = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return [h % 24, (h >>> 5) % 24, (h >>> 10) % 24].map((i) => L[i]).join(""); };

/** 公開・開店で、支店URLを持つ（店舗の詳細ページがある）試験店舗を登録し、店舗一覧に出た店舗IDを返す */
export async function 試験店舗を登録する(page: Page, 店名: string, 通番: string, onIssue: (m: string) => void): Promise<string> {
  const url = 支店URLを作る(通番);
  return ensureTenant(page, { 店名, 店名カナ: "シケンテン", 店名英語: "Test Shop", 支店URL: url, 店名略称3文字: 略称を作る(url), ショップ名略称: 店名 }, onIssue);
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
 * 所属店舗とデフォルト検索表示店舗は先頭の店舗。ログインIDは実行の印つき。
 */
export async function 試験店舗の管理者を用意する(page: Page, 通番: string, 店名一覧: string[]): Promise<Account> {
  const id = `f07a${通番.toLowerCase().replace(/[^0-9a-z]/g, "")}${RUN_MARK.toLowerCase()}`;
  await ensureMember(page, {
    名前: `F0701管理者${通番}-${RUN_MARK}`, 所属店舗: 店名一覧[0], ログインID: id, メールアドレス: `${id}@example.test`, パスワード: PASS,
    権限: "システム管理者", デフォルト検索表示店舗: 店名一覧[0], 編集可能店舗: 店名一覧,
  });
  return { loginId: id, password: PASS };
}
