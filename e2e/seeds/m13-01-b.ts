/**
 * M13-01 イベント一覧 の追加シード（画面操作）。正本: cases/M13-01_seed_data.tsv
 *
 * - 大阪店・名古屋店: 手元・開発環境に同名の店舗が複数あり画面の選択肢で決められないので、既存の店舗は使わず、機能専用の試験店舗
 *   「M1301大阪店」「M1301名古屋店」（固定名。あれば使い、無ければ登録）に読み替える。手順の「大阪店」「名古屋店」はこの店名として読む。
 *   各店舗の編集権限は、その店舗だけを編集できる試験管理者（m1301_osaka_admin・m1301_nagoya_admin。権限「店舗オーナー」）が持つ。
 *   m1301_admin（東京店だけ）は大阪店・名古屋店の編集権限を持たない（シード表のとおり）。
 * - 作らないシード（ケースを実装しない）: 登録済みのマスタの種類を「3種だけ」「4店舗だけ」にするもの（OPTFMT-037・OPTSHOP-038・OPTRULE-039。共有のマスタ・既存の店舗を書き換えない）、
 *   500件超の大量登録（MAX・COUNTSEL-042〜044）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { EventInput, registerEvent } from "../pages/admin/event";
import { ensureMember } from "../pages/admin/member";
import { ensureTenant } from "../pages/admin/tenant";
import { 日程を足す, 月次イベント } from "../pages/admin/m13_01_event_list";
import { en, 登録 } from "./m13-01";

export const OSAKA = { 店名: "M1301大阪店", 店名カナ: "エムオオサカテン", 店名英語: "M Osaka", 支店URL: "m1301osaka", 店名略称3文字: "OSK", ショップ名略称: "M1301大阪" };
export const NAGOYA = { 店名: "M1301名古屋店", 店名カナ: "エムナゴヤテン", 店名英語: "M Nagoya", 支店URL: "m1301nagoya", 店名略称3文字: "NGY", ショップ名略称: "M1301名古屋" };
export const OSAKA_ADMIN: Account = { loginId: "m1301_osaka_admin", password: "Passw0rd!M1301O" };
export const NAGOYA_ADMIN: Account = { loginId: "m1301_nagoya_admin", password: "Passw0rd!M1301N" };

const 店舗の注記 = "「大阪店」「名古屋店」は、同名の店舗が複数あって決められないので、機能専用の試験店舗「M1301大阪店」「M1301名古屋店」（あれば使い、無ければ登録）に読み替えた。" +
  "各店舗は、その店舗だけを編集できる試験管理者（権限は「店舗オーナー」）が編集権限を持つ";

/** 試験店舗と、その店舗だけを編集できる管理者を用意する（あれば使う） */
async function 試験店舗を用意する(browser: Browser, seedId: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    for (const [shop, admin, mail] of [[OSAKA, OSAKA_ADMIN, "m1301_osaka_admin@example.test"], [NAGOYA, NAGOYA_ADMIN, "m1301_nagoya_admin@example.test"]] as const) {
      await ensureTenant(page, shop, issue);
      await ensureMember(page, {
        名前: `${shop.店名}管理者`, 所属店舗: shop.店名, ログインID: admin.loginId, メールアドレス: mail,
        パスワード: admin.password, 権限: "店舗オーナー", デフォルト検索表示店舗: shop.店名, 編集可能店舗: [shop.店名],
      });
    }
  });
  reportSeedIssue(seedId, 店舗の注記);
}

async function 店舗の管理者で登録(browser: Browser, account: Account, items: { 名日: string; 名英: string; 店舗: string; 日程?: string[]; over?: EventInput }[]): Promise<string[]> {
  const ids: string[] = [];
  await withAdminSession(browser, account, async (page) => {
    for (const it of items) {
      const id = await registerEvent(page, 月次イベント(it.名日, it.名英, { 店舗: it.店舗, ...it.over }));
      for (const d of it.日程 ?? []) await 日程を足す(page, id, d);
      ids.push(id);
    }
  });
  return ids;
}

// 複合条件の5件（2026/08/15 10:00 などの日程つき）
defineSeed("S-M13-01-COMBINATION", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes, seed }) => {
  await 試験店舗を用意する(browser, seed.シードID);
  const k = rc("複合条件");
  const 東京 = await 登録(browser, [
    { 名日: `${k}A`, 名英: en("M1301 COMBI A"), 日程: ["2026-08-15 10:00"], over: { フォーマット: ["スタンダード"], ルール適用度: "競技" } },
    { 名日: `${k}B`, 名英: en("M1301 COMBI B"), 日程: ["2026-08-14 10:00"], over: { フォーマット: ["スタンダード"], ルール適用度: "競技" } },
    { 名日: `${k}C`, 名英: en("M1301 COMBI C"), 日程: ["2026-08-15 10:00"], over: { フォーマット: ["モダン"], ルール適用度: "競技" } },
    { 名日: `${k}D`, 名英: en("M1301 COMBI D"), 日程: ["2026-08-15 10:00"], over: { フォーマット: ["スタンダード"], ルール適用度: "一般" } },
  ]);
  const [e] = await 店舗の管理者で登録(browser, OSAKA_ADMIN, [
    { 名日: `${k}E`, 名英: en("M1301 COMBI E"), 店舗: OSAKA.店名, 日程: ["2026-08-15 10:00"], over: { フォーマット: ["スタンダード"], ルール適用度: "競技" } },
  ]);
  [...東京, e].forEach((id, i) => notes.set(`〔イベントID-M1301-共有-COMBI-${"ABCDE"[i]}〕`, id));
});

// 権限の違う2件（東京店・大阪店）
defineSeed("S-M13-01-MIXPERM-048", { needs: ["S-M13-01-MASTER"] }, async ({ browser, notes, seed }) => {
  await 試験店舗を用意する(browser, seed.シードID);
  const [t] = await 登録(browser, [{ 名日: `${rc("M1301-048")}-東京`, 名英: en("M1301 048 Tokyo") }]);
  const [o] = await 店舗の管理者で登録(browser, OSAKA_ADMIN, [{ 名日: `${rc("M1301-048")}-大阪`, 名英: en("M1301 048 Osaka"), 店舗: OSAKA.店名 }]);
  notes.set("〔イベントID-M1301-048T〕", t);
  notes.set("〔イベントID-M1301-048O〕", o);
});
