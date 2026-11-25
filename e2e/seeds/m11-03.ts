/**
 * M11-03 権限管理のシード（開発環境で作れる 036 の会員だけ）。正本: cases/M11-03_seed_data.tsv
 *
 * - S-M11-03-FRONT-MEMBER-036: フロントの会員登録で本会員を作る（seeds/f06-member.ts の 本会員を作る。本登録のメールの URL を開く）。
 *   メールアドレスの前半に実行の印を付ける（正本は m1103-036-member@example.test。同じアドレスの会員が開発環境にあると作れないため。依頼者決定 2026-10-28）。
 *   お名前は「結合」「太郎」、パスワードは正本どおり。会員IDは管理画面の会員一覧で控える（〔会員ID-M1103-036〕）。
 *
 * 権限グループ・拒否設定のシード（NAV・VIEW-ONLY・PREFIX・CASE・DPNAV。依頼者決定 2026-11-14「権限のマスタは、試験用の権限グループなどを足すだけなら作ってよい」）:
 *   権限のマスターへの行（マスタデータ管理画面）と、メンバー（メンバー登録画面）は画面で作る。権限の名前・ログインID・メンバーの名前に実行の印を付ける。
 *   権限の拒否設定は「記載の拒否URLだけ」にするので、権限管理の画面ではなく DB で足す（シード表の「画面で指定できないためDBへ直接設定する」のとおり。
 *   lib/db_write.ts の insertOwnRows。E2E が作った権限だけ。既存の権限・拒否URL・権限URLのマスタには触れない）。
 *   正本の権限グループID（26085 など）は画面が振る番号に読み替える。
 *
 * 権限URLマスターを全件消して置き換えるシード（L-URL・L-CATEGORY ほか）と、身分証画像のシードは作らない
 * （review/recheck_not_buildable_M11-03.tsv・review/M11-03_progress_2026-11-11_dev.md）。
 */
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { RUN_MARK } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { SETUP_ADMIN } from "../config/env";
import { ensureAuthorityMasterRow } from "../pages/admin/m04_22_move_transfer_csv";
import { ensureMember } from "../pages/admin/member";
import { 試験支店 } from "../pages/admin/reuse_store";
import { 権限に拒否URLを足す } from "../db/m11_03";
import { markedMail, 本会員を作る } from "./f06-member";

export const M1103_036 = { 前半: "m1103-036-member", パスワード: "Pw-M1103-036!" };
export const M1103_036のメール = (): string => markedMail(M1103_036.前半);

defineSeed("S-M11-03-FRONT-MEMBER-036", async ({ browser, notes, seed }) => {
  const id = await 本会員を作る(browser, { 姓: "結合", 名: "太郎", セイ: "ケツゴウ", メイ: "タロウ", 前半: M1103_036.前半, パスワード: M1103_036.パスワード });
  const s = getSeed(seed.シードID);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes("〔会員ID-M1103-036〕")) notes.set("〔会員ID-M1103-036〕", id);
});

// ---- 権限グループ・拒否設定のシード ----

export type 試験権限の定め = { 控え: string; 権限名: string; 名前: string; ログインID: string; パスワード: string; 拒否URL: string[] };

/** ケースが使うログインの情報（シードを作ったあとに読む） */
const accounts = new Map<string, Account>();
export function M1103のアカウント(seedId: string): Account {
  const a = accounts.get(seedId);
  if (!a) throw new Error(`${seedId} のシードがまだ作られていない（管理者のログイン情報が無い）`);
  return a;
}

export function 試験権限を定める(seedId: string, d: 試験権限の定め): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const 権限名 = `${d.権限名}-${RUN_MARK}`;
    const account: Account = { loginId: `${d.ログインID}-${RUN_MARK}`.toLowerCase(), password: d.パスワード };
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(120_000);
      const id = await ensureAuthorityMasterRow(page, 権限名);
      reportSeedIssue(seedId, `権限「${d.権限名}」は、実行の印を付けた「${権限名}」で権限のマスターに足した（正本の権限グループID は画面が振った番号 ${id} に読み替え）。拒否URLは ${d.拒否URL.join("、")} だけを DB で足した（E2E が作った権限だけ。既存の権限・拒否URLには触れない）`);
      権限に拒否URLを足す(権限名, d.拒否URL);
      const メンバーID = await ensureMember(page, {
        名前: `${d.名前}-${RUN_MARK}`, 所属店舗: 試験支店.店名, ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`,
        パスワード: account.password, 権限: 権限名, デフォルト検索表示店舗: 試験支店.店名, 編集可能店舗: [試験支店.店名],
      });
      const s = getSeed(seed.シードID);
      if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(d.控え)) notes.set(d.控え, メンバーID);
    });
    await withAdminSession(browser, account, async () => undefined); // 作ったメンバーでログインできること
    accounts.set(seedId, account);
  });
}

試験権限を定める("S-M11-03-DPNAV-041", { 控え: "〔メンバーID-M1103-041〕", 権限名: "左ナビ混在確認権限M1103-041", 名前: "左ナビ混在確認メンバー041", ログインID: "m1103_nav-041", パスワード: "Passw0rd-M1103041", 拒否URL: ["/product"] });
試験権限を定める("S-M11-03-PREFIX-034", { 控え: "〔メンバーID-M1103-034〕", 権限名: "配下拒否試験権限-M1103-034", 名前: "配下拒否試験メンバー034", ログインID: "m1103-034-member", パスワード: "Pw-M1103-034!", 拒否URL: ["/product"] });
試験権限を定める("S-M11-03-CASE-035", { 控え: "〔メンバーID-M1103-035〕", 権限名: "大文字拒否試験権限-M1103-035", 名前: "大文字拒否試験メンバー035", ログインID: "m1103-035-member", パスワード: "Pw-M1103-035!", 拒否URL: ["/PRODUCT/LIST"] });
試験権限を定める("S-M11-03-VIEW-ONLY-023", { 控え: "〔メンバーID-M1103-023〕", 権限名: "閲覧専用権限-023", 名前: "閲覧専用メンバー023", ログインID: "view_only-023", パスワード: "Passw0rd-023!M1103V-023", 拒否URL: ["/product/product/new", "/product/edit"] });
