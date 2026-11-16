/**
 * M13-04 繰返日程追加 の追加シード（025・026・039・040・043・045。画面操作）。正本: cases/M13-04_seed_data.tsv
 *
 * - S-M13-04-NO-EVENT（イベントID 999999 が未登録）: DB での削除を行わず確かめもしない（M13-03-c・F07-03 の前例）。
 *   登録されていればケースの期待（404）が満たされず不合格に出る。
 * - EVENT-026・DPNOEVENT-043: seeds/m13-04.ts と同じ形（店舗A-E2E・定員64・参加費3000・公開・クレジットカード決済）で、イベント登録画面から登録する。
 * - QK-EVENT-039・040: QK連携店舗と qk1302admin は M13-02 の共有シード（seeds/m13-02-qk.ts）。イベント名には実行の印を付ける（rc。
 *   「イベント名に〜を含むイベントはこの1件だけ」は、実行の印で満たす）。
 * - RI-ADM: 店舗「連携店舗M1304」は作らず、元からある店舗 店舗ID 6（名古屋店）に読み替える（店舗は作らない。依頼者 2026-11-15）。管理者 m1304_ri_admin の権限は、
 *   M13-12・M13-13 の連携の管理者と同じ「店舗オーナー」（所属店舗＝連携店舗M1304・編集可能店舗は連携店舗M1304だけ）で代える。
 * - RI-EVENT-045: m1304_ri_admin でイベント登録画面から登録する。イベント名には実行の印を付ける（rc）。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { EventInput, openEventCreate, registerEvent } from "../pages/admin/event";
import { ensureMemberFixed as ensureMember } from "../pages/admin/member";
import { 印店名 } from "../pages/admin/m13_marked_shop";
import { 店舗IDで選ぶ, 表の店舗 } from "../pages/admin/store_pick";
import { QK1302_ADMIN, QK連携店舗 } from "./m13-02-qk";
import { M1304_ADMIN } from "./m13-04";

export const M1304_RI_ADMIN: Account = { loginId: "m1304_ri_admin", password: "Passw0rd-M1304RI" };
export const M1304連携店舗 = 表の店舗("6").店名; // 正本の「連携店舗M1304」は店舗ID 6（店舗は作らない）

/** ケースの文に出るイベント名（実行の印つき） */
export const M1304B名 = {
  QK001: rc("QK繰返大会-1304-001"),
  QK002: rc("QK繰返継承大会-1304-002"),
  RI001: rc("RI繰返大会-001"),
};

defineSeed("S-M13-04-NO-EVENT", { needs: ["S-M13-04-ADM"] }, async () => { /* イベントID 999999 は未登録（DB での削除も確かめもしない。前例 M13-03-c） */ });

function 基本イベント(名前: string): EventInput {
  return {
    イベント名日: rc(名前), イベント名英: `${rc(名前)} EN`, 店舗: 印店名.A, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
    公開状態: "公開", 定員: "64", 参加費: "3000", 支払方法: ["クレジットカード決済"],
  };
}
for (const [seedId, n] of [["S-M13-04-EVENT-026", "026"], ["S-M13-04-DPNOEVENT-043", "043"]] as const) {
  defineSeed(seedId, { needs: ["S-M13-04-ADM"] }, async ({ browser, notes }) => {
    await withAdminSession(browser, M1304_ADMIN, async (page) => {
      notes.set(`〔イベントID-M1304-${n}〕`, await registerEvent(page, 基本イベント(`M1304-${n}基本イベント`)));
    });
  });
}

function QKイベント(seedId: string, label: string, 名前: string, 英: string, 定員: string, 参加費: string): void {
  defineSeed(seedId, { needs: ["S-M13-02-QK-ADM"] }, async ({ browser, notes }) => {
    await withAdminSession(browser, QK1302_ADMIN, async (page) => {
      notes.set(label, await registerEvent(page, {
        イベント名日: 名前, イベント名英: 英, 店舗: QK連携店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
        公開状態: "公開", 定員, 参加費,
      }));
    });
  });
}
QKイベント("S-M13-04-QK-EVENT-039", "〔イベントID-M1304-QK001〕", M1304B名.QK001, "QK Repeat 1304-001", "16", "500");
QKイベント("S-M13-04-QK-EVENT-040", "〔イベントID-M1304-QK002〕", M1304B名.QK002, "QK Inherit 1304-002", "24", "800");

defineSeed("S-M13-04-RI-ADM", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    notes.set("〔店舗ID-M1304-RI共有〕", (await 店舗IDで選ぶ(page, "6", "連携店舗M1304", issue)).id);
    await ensureMember(page, {
      名前: "M13-04連携試験管理者", 所属店舗: M1304連携店舗, ログインID: M1304_RI_ADMIN.loginId, メールアドレス: "m1304_ri_admin@example.test",
      パスワード: M1304_RI_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: M1304連携店舗, 編集可能店舗: [M1304連携店舗],
    });
  });
  issue("管理者 m1304_ri_admin の権限は、M13-12・M13-13 の連携の管理者と同じ「店舗オーナー」（編集可能店舗は連携店舗M1304だけ）にした");
  // ログインでき（有効・ロックなし）、イベント管理の画面を開けることを、別のセッションで確かめる
  await withAdminSession(browser, M1304_RI_ADMIN, async (page) => { await openEventCreate(page); });
});

defineSeed("S-M13-04-RI-EVENT-045", { needs: ["S-M13-04-RI-ADM"] }, async ({ browser, notes }) => {
  await withAdminSession(browser, M1304_RI_ADMIN, async (page) => {
    // 支払方法はイベント登録画面の初期値（クレジットカード決済）のまま
    notes.set("〔イベントID-M1304-RI001〕", await registerEvent(page, {
      イベント名日: M1304B名.RI001, イベント名英: "RI Repeat Cup 001", 店舗: M1304連携店舗, フォーマット: ["スタンダード"], ルール適用度: "初心者歓迎",
      公開状態: "公開", 定員: "16", 参加費: "0",
    }));
  });
});
