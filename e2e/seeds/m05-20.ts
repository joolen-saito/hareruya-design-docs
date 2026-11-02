/**
 * M05-20 出荷指示リスト編集の画面シード。正本: cases/M05-20_seed_data.tsv
 *
 * 実装したシード: S-M05-20-ADM、NOTFOUND-006・UPDATE-NOTFOUND-013・UPDATE-NOTCREATE-014・DELETE-NOTFOUND-025・DP-DELETE-TWICE-033
 * （画面だけで作れるもの）。ほかのシードは、投入方法に「DBで」の準備、または支払方法を受注編集で「クレジットカード」に変える操作
 * （決済代行が絡む）が含まれるので実装しない（記録 e2e/review/M05-20_progress_2026-10-31.md）。
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 出荷指示リスト検索で出荷指示番号 999999 を検索し、行が出れば削除する（出荷指示リストID 999999 が未登録）。
 * 2. フロントに会員でログインし、販売中の商品を1点注文する（配送方法は出荷指示リストから除外されないもの、支払方法は外部決済を使わない代金引換）。
 * 3. 管理画面で受注の受注IDを控え、出荷指示リスト検索の生成欄で注文番号（from・to）に同じ注文番号を入れて生成し、検索して出荷指示番号を控える。
 * 4. 備考が定められているものは、出荷指示リスト詳細画面で備考を入れて登録する。
 * 会員は共有の試験用会員（無ければ新規会員登録で登録。本登録のメールは手元のメールの受け口で読む。依頼者決定 2026-10-31）。
 * 備考の「保護対象備考」は、ケースが値そのものを見るので、実行の印は付けない。
 */
import { Browser } from "@playwright/test";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { StandbyDetailPage, 受注IDを読む, 備考を登録する, 出荷指示リストを生成する } from "../pages/admin/m05_20_standby";
import { ensureBuyer, M05_BUYER, 会員が注文する } from "../pages/front/m05_front_order";

export const M0520_ADMIN: Account = { loginId: "m0520_admin", password: "Passw0rd!M0520" };

defineSeed("S-M05-20-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-20管理者", account: M0520_ADMIN, メール: "m0520_admin@example.test" });
  reportSeedIssue("S-M05-20-ADM", "権限は、受注管理を操作できる「システム管理者」にした。所属・店舗・メールアドレスは任意の値（本店・m0520_admin@example.test）");
});

function noteLabels(seedId: string, notes: Notes, v: Record<string, string>): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(.+?)-M0520-\d+〕$/.exec(label);
    const val = m ? v[m[1]] : undefined;
    if (!val) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, val);
  }
}

async function build(browser: Browser, seedId: string, notes: Notes, 備考?: string): Promise<void> {
  // 出荷指示リストID 999999 が未登録であること（詳細画面が見つからない応答になる）
  await withAdminSession(browser, M0520_ADMIN, async (page) => {
    const status = await new StandbyDetailPage(page).open("999999");
    if (status !== 404) throw new Error(`${seedId}: 出荷指示リストID 999999 が未登録のはずなのに、詳細画面の応答が ${status}。削除は自動ではしない`);
  });
  await ensureBuyer(browser);
  const 注文番号 = await 会員が注文する(browser, M05_BUYER, `${seedId} の注文`, { 出荷指示リストに載る配送: true });
  const r = await withAdminSession(browser, M0520_ADMIN, async (page) => {
    const 受注ID = await 受注IDを読む(page, 注文番号, seedId);
    const リストID = await 出荷指示リストを生成する(page, 注文番号, seedId);
    if (備考) await 備考を登録する(page, リストID, 備考, seedId);
    return { 受注ID, リストID };
  });
  noteLabels(seedId, notes, { 受注ID: r.受注ID, 出荷指示リストID: r.リストID, 注文番号 });
}

defineSeed("S-M05-20-NOTFOUND-006", { needs: ["S-M05-20-ADM"] }, async ({ browser, notes }) => build(browser, "S-M05-20-NOTFOUND-006", notes));
defineSeed("S-M05-20-UPDATE-NOTFOUND-013", { needs: ["S-M05-20-ADM"] }, async ({ browser, notes }) => build(browser, "S-M05-20-UPDATE-NOTFOUND-013", notes, "保護対象備考"));
defineSeed("S-M05-20-UPDATE-NOTCREATE-014", { needs: ["S-M05-20-ADM"] }, async ({ browser, notes }) => build(browser, "S-M05-20-UPDATE-NOTCREATE-014", notes, "保護対象備考"));
defineSeed("S-M05-20-DELETE-NOTFOUND-025", { needs: ["S-M05-20-ADM"] }, async ({ browser, notes }) => build(browser, "S-M05-20-DELETE-NOTFOUND-025", notes, "保護対象備考"));
defineSeed("S-M05-20-DP-DELETE-TWICE-033", { needs: ["S-M05-20-ADM"] }, async ({ browser, notes }) => build(browser, "S-M05-20-DP-DELETE-TWICE-033", notes, "保護対象備考-M0520-033"));
