/**
 * M13-03 日程登録/編集 の追加シード（画面操作）。正本: cases/M13-03_seed_data.tsv
 *
 * - 未登録のイベントID 999999（NOTFOUND-030 など）は、DB での削除を行わず確かめもしない（F07-03 の前例）。登録されていればケースの期待が満たされず不合格に出る。
 * - 権限外店舗のイベント（NOAUTH-034・040・045）: 店舗Bを編集できる管理者（m1303_b_admin。権限「店舗オーナー」・店舗Bだけ）で店舗Bのイベントを登録する。
 *   日程の登録者は、シード表では共有の管理者だが、店舗Bの管理者になる（ケースは登録者を確かめない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { registerEvent } from "../pages/admin/event";
import { ensureMember } from "../pages/admin/member";
import { registerSchedule } from "../pages/admin/schedule";
import { 基本イベント, M1303_ADMIN } from "./m13-03";

export const M1303_ADMIN_B: Account = { loginId: "m1303_b_admin", password: "Passw0rd!M1303B" };

/** 店舗Bだけを編集できる管理者を、無ければ作る（シード表に無い。権限外店舗のイベントを作るために足す） */
async function 店舗B管理者を用意する(browser: Browser, seedId: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "M13-03 店舗B試験管理者", 所属店舗: "店舗B", ログインID: M1303_ADMIN_B.loginId, メールアドレス: "m1303_b_admin@example.test",
      パスワード: M1303_ADMIN_B.password, 権限: "店舗オーナー", デフォルト検索表示店舗: "店舗B", 編集可能店舗: ["店舗B"],
    });
  });
  reportSeedIssue(seedId, "権限外店舗（店舗B）のイベントを作るため、店舗Bだけを編集できる管理者 m1303_b_admin を足した（シード表には無い）");
}

defineSeed("S-M13-03-NOTFOUND-030", { needs: ["S-M13-03-ADM"] }, async () => { /* イベントID 999999 は未登録（確かめない） */ });

function 基本(seedId: string, label: string, 名前: string): void {
  defineSeed(seedId, { needs: ["S-M13-03-ADM"] }, async ({ browser, notes }) => {
    await withAdminSession(browser, M1303_ADMIN, async (page) => { notes.set(label, await registerEvent(page, 基本イベント(名前))); });
  });
}
基本("S-M13-03-BASE-031", "〔イベントID-M1303-031〕", "M1303-031基本イベント");
基本("S-M13-03-BASE-056", "〔イベントID-M1303-056〕", "M1303-056基本イベント");

/** 店舗Bのイベント（日程つきなら 2026-10-01 18:00・定員16・参加費500・公開・オプションはすべてオフ） */
function 権限外(seedId: string, no: string, 名前: string, 日程あり: boolean): void {
  defineSeed(seedId, { needs: ["S-M13-03-ADM"] }, async ({ browser, notes, seed }) => {
    await 店舗B管理者を用意する(browser, seed.シードID);
    await withAdminSession(browser, M1303_ADMIN_B, async (page) => {
      const id = await registerEvent(page, 基本イベント(名前, { 店舗: "店舗B" }));
      notes.set(`〔イベントID-M1303-${no}〕`, id);
      if (日程あり) notes.set(`〔日程ID-M1303-${no}〕`, await registerSchedule(page, id, { 開始時間: "2026-10-01 18:00", 受付あり: false, デッキ登録あり: false, 定員: "16", 参加費: "500", 公開状態: "公開" }));
    });
  });
}
権限外("S-M13-03-NOAUTH-034", "034", "M1303-034権限外店舗イベント", false);
権限外("S-M13-03-NOAUTH-040", "040", "M1303-040権限外店舗イベント", true);
権限外("S-M13-03-NOAUTH-045", "045", "M1303-045権限外店舗イベント", true);
