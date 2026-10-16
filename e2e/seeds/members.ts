/**
 * イベント申込のシードが使う、会員登録済みの会員。
 * シード表（例: S-M13-02-DATES-004）は「プレイヤー検索に会員登録済みの会員（この日程にまだ申込していない会員。
 * 該当する会員が無ければ、フロントの新規会員登録画面で会員を登録しておく）の名前を入れて」と定める。
 * E2E_MEMBER_NAMES で会員の名前を与えなければ、試験用の会員を会員一覧で探し、いなければフロントの新規会員登録画面で登録する
 * （依頼者決定 2026-10-16）。本登録のメールを読むので、登録できるのは local だけ。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, ENV_NAME, MEMBER_NAMES, SETUP_ADMIN } from "../config/env";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { customerStateByEmail } from "../pages/admin/customer";
import { FrontMember, registerFrontMember } from "../pages/front/member_entry";

/** 試験用の会員。プレイヤー検索には「姓 名」で入れる（語ごとに絞り込まれるので、ほかの会員と取り違えない） */
const ENTRY_MEMBERS: FrontMember[] = [
  { 姓: "試験会員", 名: "申込一", セイ: "シケンカイイン", メイ: "モウシコミイチ", メール: "e2e-entry-1@example.test", パスワード: "Passw0rd!E2EEntry1" },
  { 姓: "試験会員", 名: "申込二", セイ: "シケンカイイン", メイ: "モウシコミニ", メール: "e2e-entry-2@example.test", パスワード: "Passw0rd!E2EEntry2" },
];

/** このワーカーで、先頭から何人まで本会員になっていることを確かめたか */
let ready = 0;

/** 申込に使う会員の名前（プレイヤー検索に入れる文字）を、先頭から n 人ぶん返す。いなければ画面から登録する */
export async function entryMemberNames(browser: Browser, n: number): Promise<string[]> {
  if (MEMBER_NAMES.length) {
    if (MEMBER_NAMES.length < n) throw new Error(`申込を登録するのに会員が ${n} 人要る。E2E_MEMBER_NAMES の会員は ${MEMBER_NAMES.length} 人`);
    return MEMBER_NAMES.slice(0, n);
  }
  if (n > ENTRY_MEMBERS.length) throw new Error(`申込を登録するのに会員が ${n} 人要るが、試験用の会員は ${ENTRY_MEMBERS.length} 人しか定めていない`);
  for (const m of ENTRY_MEMBERS.slice(ready, n)) {
    const state = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, m.メール));
    if (state === "仮会員") throw new Error(`試験用の会員 ${m.メール} が仮会員のまま。本登録のメールのURLを開いて本会員にしてから流す`);
    if (state === null) {
      if (ENV_NAME !== "local") throw new Error(`E2E_ENV=${ENV_NAME} では試験用の会員を登録できない（本登録のメールを読めない）。会員登録済みの会員の名前を E2E_MEMBER_NAMES で与える`);
      const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(context);
        await registerFrontMember(await context.newPage(), m);
      } finally {
        await context.close();
      }
      const after = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, m.メール));
      if (after !== "本会員") throw new Error(`試験用の会員 ${m.メール} を登録したが、会員一覧で本会員にならない（${after ?? "見つからない"}）`);
    }
  }
  ready = Math.max(ready, n);
  return ENTRY_MEMBERS.slice(0, n).map((m) => `${m.姓} ${m.名}`);
}
