/**
 * M01-01 パスワード認証（管理画面のログイン）の連携ケース 001・002 のシード。正本: cases/M01-01_seed_data.tsv
 *
 * シードでの解釈（正本の外の補い。記録 review/M01-01_progress_2026-11-21_dev.md にも書く）:
 * - 管理者はメンバー管理で登録する。ログインID・名前には、実行をまたいで使い回す決まった印を付け、1度だけ作る（2回目からは、あれば内容を確かめて使う）。
 *   パスワード・権限（システム管理者）・稼働・2段階認証の無効はシード表のとおり。
 * - 「登録後、このログインIDでは一度もログインを試みない」を守るため、シードではログインしない（作った直後のログイン確認もしない）。
 * - 「履歴が残っていればDBで削除する」は行わない（E2E が消す権限を持たない行・ログイン履歴を消す画面も無い）。
 *   使い回す管理者の履歴は流すたびに増えるので、ケースは「ログインの前後で、新しい履歴の行が増えたか」で確かめる（ケースの注記に書く）。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, SeedCtx } from "../lib/seeds";
import { rcFixed } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { ensureMember } from "../pages/admin/member";

export type M0101管理者 = Account & { 名前: string };

/** 正本のログインID m0101l001・m0101l002 に、決まった印を付けた値（小文字） */
export const M0101_L_ADM: Record<"001" | "002", M0101管理者> = {
  "001": { loginId: rcFixed("m0101l001").toLowerCase(), password: "Passw0rd!M0101001", 名前: rcFixed("M01-01連携試験管理者001") },
  "002": { loginId: rcFixed("m0101l002").toLowerCase(), password: "Passw0rd!M0101002", 名前: rcFixed("M01-01連携試験管理者002") },
};

async function 管理者を用意する({ browser }: SeedCtx, a: M0101管理者): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店舗 = await storeNameById(page, "1");
    await ensureMember(page, {
      名前: a.名前, 所属店舗: 店舗, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`,
      パスワード: a.password, 権限: "システム管理者", デフォルト検索表示店舗: 店舗, 編集可能店舗: [店舗],
    });
  });
}

defineSeed("S-M01-01-L-ADM-001", (ctx) => 管理者を用意する(ctx, M0101_L_ADM["001"]));
defineSeed("S-M01-01-L-ADM-002", (ctx) => 管理者を用意する(ctx, M0101_L_ADM["002"]));
