/**
 * A07-01 まとめて買取商品IDの取得（MTGバイヤーの API）のシード。正本: cases/A07-01_seed_data.tsv
 *
 * 作り方（読み替えた点は、シードの注記と記録 review/A07-01_progress_2026-11-17_dev.md に書く）:
 * - API の試験環境（S-A07-01-API）: 共有の開発環境では、認証の秘密の値・署名方式・送信元IPの許可を書き換えない。認証トークンは管理者ログインの API で受け取る。
 * - 試験管理者（ADM・ADM-004）: メンバー管理で登録する。実行をまたいで使い回す決まった印を名前・ログインIDに付ける（rcFixed。依頼者決定 2026-11-11）。
 *   店舗は作らず、正本の「A07-01試験店舗」を試験支店（店舗ID 1574）で読み替える（依頼者決定 2026-11-13）。〔店舗ID-A0701-共有〕には 1574 を控える。
 * - 管理者なしの利用者（NOMEMBER-005）: 管理者を登録して番号を控え、管理者ログインの API で認証トークンを受け取ってから、メンバー管理で削除する。
 * - まとめて買取商品ID（SETTING）: ≪共有の設定≫。追加システム設定の全項目を控えてから書き換え、ケースの終わりに控えた値へ戻す（seeds/add-system-restore.ts）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc, rcFixed } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberFixed, findMemberIdByLoginId } from "../pages/admin/member";
import { メンバーの編集可能店舗を外す, メンバーを削除する } from "../pages/admin/m05_20_standby";
import { 試験支店ID, 試験店舗の名前を読む, 店舗読み替えの注記 } from "../pages/admin/test_store";
import { 管理者のトークン } from "../pages/admin/a07_api";
import { 追加システム設定を控えて書き換える, 追加システム設定の表示値 } from "./add-system-restore";

export const A0701管理者 = { 名前: rcFixed("A07-01試験管理者"), account: { loginId: rcFixed("a0701_admin").toLowerCase(), password: "ZxA0701c001" } as Account };
export const A0701署名確認 = { 名前: rcFixed("A07-01署名確認管理者"), account: { loginId: rcFixed("a0701_admin_004").toLowerCase(), password: "Passw0rd!A0701S" } as Account };
const 削除用005 = { 名前: rc("A07-01削除用005"), account: { loginId: rc("a0701_del005").toLowerCase(), password: "Passw0rd!A0701D" } as Account };
/** 削除した管理者の認証トークン（削除の前に受け取る。プロセスの中だけ） */
export const A0701控えたトークン = new Map<string, string>();

async function 管理者を用意する(browser: Browser, seedId: string, a: { 名前: string; account: Account }): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 店 = await 試験店舗の名前を読む(page);
    const id = await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店.試験支店, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`, パスワード: a.account.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店.試験支店, 編集可能店舗: [店.試験支店],
    }, (m) => reportSeedIssue(seedId, `シード作成時の問題: ${m}`));
    reportSeedIssue(seedId, `シード作成時の問題: 管理者はメンバー管理で登録した（名前「${a.名前}」・決まった印つき。所属・権限は任意の値＝システム管理者。${店舗読み替えの注記("A07-01試験店舗", 店.試験支店, 試験支店ID)}）。あれば使い回した（管理者ID ${id}。ログイン失敗回数・ロックはケースで変えない）`);
    return id;
  });
}

defineSeed("S-A07-01-API", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "シード作成時の問題: 共有の開発環境では、APIの認証の秘密の値・署名方式・送信元IPの許可を書き換えず、環境に設定済みの値のまま使った。認証トークンは、管理者のログインIDとパスワードで管理者ログインのAPIを呼んで受け取った（シード表の署名シークレットでは作っていない）");
});

defineSeed("S-A07-01-ADM", async ({ browser, seed, notes }) => {
  notes.set("〔店舗ID-A0701-共有〕", 試験支店ID);
  notes.set("〔管理者会員ID-A0701-共有〕", await 管理者を用意する(browser, seed.シードID, A0701管理者));
});

defineSeed("S-A07-01-ADM-004", async ({ browser, seed, notes }) => {
  notes.set("〔店舗ID-A0701-共有〕", 試験支店ID);
  notes.set("〔管理者会員ID-A0701-004〕", await 管理者を用意する(browser, seed.シードID, A0701署名確認));
  reportSeedIssue(seed.シードID, "シード作成時の問題: シード表は「既存試験データを削除してから登録」。決まった印つきの管理者を使い回し、削除はしていない（ケースはこの管理者の有効な認証トークンを書き換えて送るだけで、管理者の状態は変えない）");
});

defineSeed("S-A07-01-NOMEMBER-005", async ({ browser, seed, notes }) => {
  const id = await 管理者を用意する(browser, seed.シードID, 削除用005);
  notes.set("〔管理者会員ID-A0701-005〕", id);
  A0701控えたトークン.set("005", await 管理者のトークン(削除用005.account.loginId, 削除用005.account.password));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await メンバーの編集可能店舗を外す(page, id);
    await メンバーを削除する(page, id);
    if (await findMemberIdByLoginId(page, 削除用005.account.loginId, 削除用005.名前)) throw new Error(`管理者ID ${id} を削除したが、まだ残っている`);
  });
  reportSeedIssue(seed.シードID, `シード作成時の問題: 「結合試験補助コードの認証トークン生成」の代わりに、削除の前に管理者ログインのAPIで認証トークンを受け取って控え、そのあとメンバー管理で削除した（管理者ID ${id}。削除の前に編集可能店舗を外した）`);
});

defineSeed("S-A07-01-SETTING", async ({ browser, seed, notes }) => {
  const 無い = await 追加システム設定を控えて書き換える(browser, seed.シードID, { まとめて買取商品ID: "70101" });
  if (無い.length) throw new Error(`追加システム設定に「${無い.join("・")}」の入力欄が無い`);
  const 今 = await 追加システム設定の表示値(browser, ["まとめて買取商品ID"]);
  if (今["まとめて買取商品ID"] !== "70101") throw new Error(`開き直した追加システム設定のまとめて買取商品IDが「${今["まとめて買取商品ID"]}」（70101 のはず）`);
  // シード表は IT-A07-01-008 の開始値の商品IDも控えると書くが、008 は正本のケースに無い（除外済み）。基盤の突き合わせのため、控えない旨を値にして残す
  notes.set("〔商品ID-A0701-008A〕", "控えない（IT-A07-01-008 は正本のケースに無い）");
  reportSeedIssue(seed.シードID, "シード作成時の問題: ≪共有の設定≫ 追加システム設定のまとめて買取商品IDを、全項目の今の値を控えてから「70101」にした（保存と、開き直した表示を確かめた）。ケースの終わりに控えた値へ戻す。シード表の〔商品ID-A0701-008A〕は、IT-A07-01-008 が正本に無いので控えていない");
});
