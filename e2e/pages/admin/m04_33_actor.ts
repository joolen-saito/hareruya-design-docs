/**
 * M04-33・M04-34 の試験管理者を用意する（seeds/m04-25.ts の ensureActor と同じだが、E2E の管理者の編集可能店舗が前の店舗のままなら付け替えて使う）。
 * 2026-11-18: 支店を店舗ID 13 から試験支店（店舗ID 1574）へ読み替えたので、決まった名前で1度だけ作った管理者（編集可能店舗 1・5・13）の店舗を 1・5・1574 へ付け替える。
 * 付け替えるのは E2E の管理者（rcFixed の名前）だけ。ほかの方のメンバーには触らない。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { withAdminSession } from "../../lib/session";
import { ensureMemberByStoreIdsFix } from "./m04_24_reuse_k";
import type { Actor } from "../../seeds/m04-25";

export async function ensureActorWithStores(browser: Browser, a: Actor, v: { 所属店舗ID: string; 編集可能店舗ID: string[]; email: string }): Promise<string> {
  const id = await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIdsFix(page, {
    名前: a.名前, ログインID: a.account.loginId, メールアドレス: v.email, パスワード: a.account.password,
    権限: "システム管理者", 所属店舗ID: v.所属店舗ID, デフォルト検索表示店舗ID: v.所属店舗ID, 編集可能店舗ID: v.編集可能店舗ID,
  }));
  await withAdminSession(browser, a.account, async () => undefined); // ログインできる（ロックされていない）こと
  return id;
}
