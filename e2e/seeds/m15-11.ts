/**
 * M15-11 直近の大会管理（管理画面）のシードの作り方（画面操作）。正本: cases/M15-11_seed_data.tsv
 *
 * - 管理者 m1511qm-adm: メンバー管理で登録する。権限は「システム管理者」（シード表どおり。M15-05 と同じ部品）。
 *   名前は「m1511 連携試験の管理者」、所属店舗・編集可能店舗は本店（直近の大会・フォーマットは店舗に属さない）。
 * - フォーマット名（決め打ちの識別の値）は、同じDBで流し直すと同じ名前のフォーマットが増えて、直近の大会の選択肢で
 *   選べなくなる。名前の前半に実行の印を付けて作る（「QM1511-001-フォーマット」→「QM1511-001-<印>-フォーマット」、
 *   名(英)も同じ形）。大会名は直近の大会の行（全体で1組）に入れるだけで増えないので、正本の値のまま。
 * - フォーマットコード・デッキ検索条件に表示などシード表に無い項目は、新規登録の画面の初期値のまま。
 * - 直近の大会の行は全体で1組の共有の設定。どのケースも e2e/config/solo_cases.tsv に載せて1本だけで流す。
 */
import { Browser, Page } from "@playwright/test";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { フォーマットを新規登録する, 大会の行, 直近の大会を空にしてから入れる } from "../pages/admin/m15_11_latest_event";

export const M1511_ADMIN: Account = { loginId: "m1511qm-adm", password: "Passw0rd-M1511QM" };

/** 正本のフォーマット名の前半（「QM1511-001」など）から、実行の印つきのフォーマット名(日)・(英) */
export const フォーマット名 = (前半: string) => `${rc(前半)}-フォーマット`;
export const フォーマット名英 = (前半: string) => `${rc(前半)}-Format`;

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, M1511_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

defineSeed("S-M15-11-QM-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "m1511 連携試験の管理者", account: M1511_ADMIN, メール: "m1511qm-adm@example.test" });
});

/** ケース専用: フォーマットを登録し、直近の大会の5行を空にして保存し、行があれば入れて保存する */
function defineLatestSeed(seedId: string, 前半: string, 並び順: string, 行: Omit<大会の行, "フォーマット">[]): void {
  defineSeed(seedId, { needs: ["S-M15-11-QM-ADM"] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      await フォーマットを新規登録する(page, { 名日: フォーマット名(前半), 名英: フォーマット名英(前半), 並び順, メタ日数: "14" }, issue);
      await 直近の大会を空にしてから入れる(page, 行.map((r) => ({ ...r, フォーマット: フォーマット名(前半) })), seedId, issue);
    });
  });
}

defineLatestSeed("S-M15-11-QM-LATEST-024", "QM1511-001", "9111", []);
defineLatestSeed("S-M15-11-QM-LATEST-025", "QM1511-002", "9112", [
  { 開催日時: "2026-09-01 10:00", 大会名日: "QM1511-002-大会", 大会名英: "QM1511-002-大会", 参加人数: "36" },
]);
defineLatestSeed("S-M15-11-OVW-026", "DPM1511-026", "9126", [
  { 開催日時: "2026-09-01 10:00", 大会名日: "DPM1511-026-旧大会", 大会名英: "DPM1511-026-Old", 参加人数: "36" },
]);
defineLatestSeed("S-M15-11-QM-PART-027", "DPM1511-027", "9127", [
  { 開催日時: "2026-09-01 10:00", 大会名日: "DPM1511-027-大会A", 大会名英: "DPM1511-027-EventA", 参加人数: "36" },
  { 開催日時: "2026-09-08 11:00", 大会名日: "DPM1511-027-大会B", 大会名英: "DPM1511-027-EventB", 参加人数: "24" },
]);
defineLatestSeed("S-M15-11-QM-TWICE-028", "DPM1511-028", "9128", []);
defineLatestSeed("S-M15-11-FGNOSAVE-030", "M1511-FG030", "9430", [
  { 開催日時: "2026-09-01 10:00", 大会名日: "M1511-FG030-旧", 大会名英: "M1511-FG030-OldE", 参加人数: "30" },
]);
defineLatestSeed("S-M15-11-FGCSRFKEEP-031", "M1511-FG031", "9431", [
  { 開催日時: "2026-09-01 10:00", 大会名日: "M1511-FG031-旧", 大会名英: "M1511-FG031-OldE", 参加人数: "31" },
]);
defineLatestSeed("S-M15-11-FGCSRFMSG-032", "M1511-FG032", "9432", [
  { 開催日時: "2026-09-01 10:00", 大会名日: "M1511-FG032-旧", 大会名英: "M1511-FG032-OldE", 参加人数: "32" },
]);
defineLatestSeed("S-M15-11-FGMSGOK-033", "M1511-FG033", "9433", []);
defineLatestSeed("S-M15-11-FGFIVE-034", "M1511-FG034", "9434", []);
defineLatestSeed("S-M15-11-FGGAP-035", "M1511-FG035", "9435", []);
