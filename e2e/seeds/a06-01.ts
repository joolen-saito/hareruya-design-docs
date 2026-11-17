/**
 * A06-01 ログイン（MTGBuyer の管理者のログイン API）のシードの作り方（画面操作）。
 * 値はシード表（integration_test/casegen/cases/A06-01_seed_data.tsv）の状態・属性と投入方法のとおり。
 *
 * シードでの解釈（正本の外の補い）:
 * - 管理者ごとの専用店舗（「A06-01店舗-NNN」）は、試験店舗の使い回し（依頼者決定 2026-11-13）で作らず、試験支店（pages/admin/test_store.ts）に所属させる。
 *   ケースの店舗名・店舗住所は、試験支店の店名・住所として読む（エビデンスの注記に残す）。
 * - 管理者は、実行をまたいで使い回す決まった印（rcFixed）を名前・ログインIDに付けて1度だけ作る（依頼者決定 2026-11-11）。
 * - S-A06-01-NOUSER-006 は「DB で消して0件を確かめる」作り方。開発環境ではデータを消すシードとして、基盤がケースを流さない。
 *   ここでは消さずに、0件であることだけを確かめる（消してよいと仕分けられたときに使う）。
 */
import { SETUP_ADMIN } from "../config/env";
import { ログインIDの管理者の数 } from "../db/a06";
import { rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberFixed } from "../pages/admin/member";
import { 店舗読み替えの注記, 試験支店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";

/** 標準認証値（S-A06-01-CREDENTIALS） */
export const A0601_PASSWORD = "Passw0rd!A0601";

/** S-A06-01-ADM-NNN の管理者（ログインIDは決まった印つき） */
export const A0601の管理者 = (n: string): Account & { 名前: string } => ({
  loginId: rcFixed(`a0601_admin-${n}`).toLowerCase(), password: A0601_PASSWORD, 名前: rcFixed(`A06-01管理者-${n}`),
});

defineSeed("S-A06-01-CREDENTIALS", async () => undefined);

/** S-A06-01-ADM-NNN: 試験支店に所属するシステム管理者を、メンバー登録画面で（無ければ）登録し、管理者IDを控える */
const 管理者のシード = (n: string): SeedBuilder => async ({ browser, notes, seed }) => {
  const a = A0601の管理者(n);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = (await 試験店舗の名前を読む(page)).試験支店;
    reportSeedIssue(seed.シードID, 店舗読み替えの注記(`A06-01店舗-${n}`, 店名, 試験支店ID));
    notes.set(`〔店舗ID-A0601-${n}〕`, 試験支店ID);
    notes.set(`〔管理者ID-A0601-${n}〕`, await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店名, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    }, (m) => reportSeedIssue(seed.シードID, m)));
  });
  reportSeedIssue(seed.シードID, "所属は選択肢の先頭、デフォルト検索表示店舗・編集可能店舗は所属店舗と同じ試験支店（シード表に記載なし）");
};
defineSeed("S-A06-01-ADM-002", { needs: ["S-A06-01-CREDENTIALS"] }, 管理者のシード("002"));
defineSeed("S-A06-01-ADM-007", { needs: ["S-A06-01-CREDENTIALS"] }, 管理者のシード("007"));
defineSeed("S-A06-01-ADM-008", { needs: ["S-A06-01-CREDENTIALS"] }, 管理者のシード("008"));

defineSeed("S-A06-01-NOUSER-006", async () => {
  const n = ログインIDの管理者の数("a0601_missing-006");
  if (n !== 0) throw new Error(`S-A06-01-NOUSER-006: ログインID a0601_missing-006 の管理者が ${n} 件ある（0件の前提を満たせない）`);
});
