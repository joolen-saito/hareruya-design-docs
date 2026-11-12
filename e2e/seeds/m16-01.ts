/**
 * M16-01 バナー設定・画像のアップロード（トップバナー管理）のシード（画面操作）。正本: cases/M16-01_seed_data.tsv
 *
 * 読み替え（依頼者の方針 2026-11-11。共有の設定・共有のマスタは書き換えない）:
 * - 店舗A・店舗B（店舗ID 161601・161602、パス指定値 store-a・store-b）は、E2E が画面で作る印つきの試験店舗（店名の末尾に「-M1601」、店名略称 zx1・zx2）に読み替える。
 *   画像の保管先のフォルダ名は店名略称（保管先の「banner/top/略称/」）。店舗IDは画面が振る。
 * - 管理者 S-M16-01-ADM は、メンバー登録画面で登録する（ログインID m1601_admin）。権限は「システム管理者」にした（データ管理を操作でき、店舗の行の制限を受けず全店舗が選択肢に出る）。
 *   編集可能店舗は店舗Aと店舗B。S-M16-01-NOEDIT-ADM（ログインID m1601_noedit）は同じ権限で、編集可能店舗を店舗Bだけにした（店舗Aは編集不可）。所属店舗はどちらも本店。
 * - 保管先へ名前を決めた画像を置く準備（S-M16-01-PREP-nnn の「店舗Aのフォルダには…だけが存在する」）は、ケースの中で試験店舗Aへ画面から画像をアップロード
 *   （ファイル名は画面が採番する）に読み替える。
 * - 入力ファイル（S-M16-01-UPLOAD-FILES）は e2e/fixtures/m16-02/ のものを使う（limit.png は m1602-520000.png、valid.gif・valid.jpg・valid.png は m1602-valid.gif・jpeg・png）。
 * - 共有トップバナー設定（S-M16-01-BASE）の書き換え、2000件超のファイルの準備、保管先の直接の配置は行わない（それを使うケースは実装しない）。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser } from "@playwright/test";
import { REPO_ROOT, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { 店舗の店名と略称, 画像の種別, 画像の種別を見る } from "../pages/admin/m16_02_top_banner";
import { ensureTenant } from "../pages/admin/tenant";

export const M1601_ADMIN: Account = { loginId: "m1601_admin", password: "Passw0rd!M1601" };
export const M1601_NOEDIT: Account = { loginId: "m1601_noedit", password: "Passw0rd!NoEdit" };

export const 店舗A = { 店名: "トップバナー試験店舗A-M1601", 略称: "zx1" };
export const 店舗B = { 店名: "トップバナー試験店舗B-M1601", 略称: "zx2" };

export const M1601_FILES = path.join(REPO_ROOT, "e2e", "fixtures", "m16-02");
export const 入力ファイル = (name: string): string => path.join(M1601_FILES, name);

defineSeed("S-M16-01-SHOPS", async ({ browser, seed }) => {
  const id = seed.シードID;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const { 店, 英語, url } of [
      { 店: 店舗A, 英語: "Banner Test Store Alpha", url: "m1601a" },
      { 店: 店舗B, 英語: "Banner Test Store Bravo", url: "m1601b" },
    ]) {
      const sid = await ensureTenant(page, {
        店名: 店.店名, 店名カナ: "トップバナーシケンテンポ", 店名英語: 英語, 支店URL: url, 店名略称3文字: 店.略称, ショップ名略称: 店.店名,
      }, (m) => reportSeedIssue(id, m));
      const v = await 店舗の店名と略称(page, sid);
      if (v.略称 !== 店.略称) throw new Error(`${id}: 店名「${店.店名}」の店舗（店舗ID ${sid}）の店名略称が「${v.略称}」で、決めた「${店.略称}」と違う（共有の店舗は書き換えない）`);
    }
    reportSeedIssue(id, `シード表の店舗A（店舗ID 161601・store-a）・店舗B（161602・store-b）は、画面で作った印つきの試験店舗「${店舗A.店名}」（略称 ${店舗A.略称}）・「${店舗B.店名}」（略称 ${店舗B.略称}）に読み替えた。`);
  });
});

async function 管理者を作る(browser: Browser, account: Account, 名前: string, 編集可能: string[]): Promise<void> {
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMember(page, {
      名前, 所属店舗: shop, ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`,
      パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: 編集可能[0], 編集可能店舗: 編集可能,
    });
  });
}

defineSeed("S-M16-01-ADM", { needs: ["S-M16-01-SHOPS"] }, async ({ browser }) => {
  await 管理者を作る(browser, M1601_ADMIN, "m1601 トップバナー試験管理者", [店舗A.店名, 店舗B.店名]);
});
defineSeed("S-M16-01-NOEDIT-ADM", { needs: ["S-M16-01-SHOPS"] }, async ({ browser }) => {
  await 管理者を作る(browser, M1601_NOEDIT, "m1601 店舗A編集権限なし管理者", [店舗B.店名]);
});

function 入力ファイルを確かめる(seedId: string, name: string, want: 画像の種別, ちょうど?: number): void {
  const p = 入力ファイル(name);
  if (!fs.existsSync(p)) throw new Error(`${seedId}: 入力ファイル ${name} が e2e/fixtures/m16-02/ に無い`);
  const b = fs.readFileSync(p);
  const got = 画像の種別を見る(b);
  if (got !== want) throw new Error(`${seedId}: ${name} の中身が${got}で、シード表の${want}と違う`);
  if (ちょうど !== undefined && b.length !== ちょうど) throw new Error(`${seedId}: ${name} が ${b.length} バイトで、${ちょうど} バイトでない`);
}

defineSeed("S-M16-01-UPLOAD-FILES", async ({ seed }) => {
  const id = seed.シードID;
  入力ファイルを確かめる(id, "m1602-520000.png", "PNG", 520000);
  入力ファイルを確かめる(id, "m1602-valid.gif", "GIF");
  入力ファイルを確かめる(id, "m1602-valid.jpeg", "JPEG");
  入力ファイルを確かめる(id, "m1602-valid.png", "PNG");
  reportSeedIssue(id, "入力ファイルは e2e/fixtures/m16-02/ のもの（limit.png=m1602-520000.png、valid.gif/jpg/png=m1602-valid.gif/jpeg/png）を使う");
});

const 画面から用意する = "シード表の「保管先へ名前を決めた画像を置く」は、ケースの中の事前の準備として試験店舗Aへ画面から画像をアップロードし、増えた画像（ファイル名は画面が採番する）を使う、に読み替えた";
for (const n of ["002", "027", "032", "034", "035", "036", "038", "039", "040", "041", "042", "044"]) {
  const sid = `S-M16-01-PREP-${n}`;
  defineSeed(sid, { needs: ["S-M16-01-SHOPS"] }, async () => { reportSeedIssue(sid, 画面から用意する); });
}

defineSeed("S-M16-01-BASE", async () => {
  reportSeedIssue("S-M16-01-BASE", "共有トップバナー設定（ID 1〜11の固定枠）は機能全体で1組の共有設定なので、E2E は書き換えない。この設定を使う IT-M16-01-049 は、いまの設定を読むだけにした");
});
defineSeed("S-M16-01-LANGOPT-049", async () => {
  reportSeedIssue("S-M16-01-LANGOPT-049", "言語の選択肢は設定の値によらないので、いまの設定のID 1とID 2の行を読む（設定は変えない）");
});
