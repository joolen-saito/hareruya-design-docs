/**
 * A06（買取用カード一覧取得の API）のシードの組み立てのうち、店舗B・関連の欠けた商品・値の無い商品の部品（2026-11-21）。
 * seeds/a06-buying.ts の部品を使い、足りない形だけをここに足す（a06-buying.ts の既定の動きは変えない）。
 *
 * 正本の外の補い（記録にも書く）:
 * - 店舗B は、店舗を作らない決まり（2026-11-13 依頼者決定）で試験支店（店舗ID 1574）に読み替える。管理者B の所属店舗も試験支店にする。
 * - 画面で作れない状態（カード詳細のレアリティ・カードセット・プロモーションが無い、商品規格の言語・状態・部門・買取価格が無い、
 *   EC 以外・ほかの店舗の在庫数）は、E2E が作った行にだけ DB で書く（db/a06_rel.ts。依頼者決定 2026-11-10）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { ensureMemberFixed } from "../pages/admin/member";
import { 店舗読み替えの注記, 試験支店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";
import { 買取の管理者 } from "./a06-buying";

/** 試験支店に所属する管理者を（無ければ）登録し、管理者IDと店舗IDを返す */
export async function 試験支店の管理者を用意する(browser: Browser, seedId: string, a: 買取の管理者, シード表の店名: string): Promise<{ 管理者ID: string; 店舗ID: string; 店名: string }> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = (await 試験店舗の名前を読む(page)).試験支店;
    issue(店舗読み替えの注記(シード表の店名, 店名, 試験支店ID));
    const id = await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店名, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    }, issue);
    issue("管理者は決まった印（-E2E。ログインIDは小文字）を付けて1度だけ作る。所属店舗は試験支店、権限はシステム管理者（シード表の「登録済みの値」）");
    return { 管理者ID: id, 店舗ID: 試験支店ID, 店名 };
  });
}
