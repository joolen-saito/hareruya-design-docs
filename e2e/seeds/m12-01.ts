/**
 * M12-01 日別・月別集計 集計一覧表示 のシードの作り方。正本: cases/M12-01_seed_data.tsv
 *
 * - S-M12-01-ADM: 試験管理者をメンバー管理で登録する。権限は、分析・集計管理を操作できる「システム管理者」、所属店舗は本店
 *   （正本の所属店舗「TC東京」は、店舗を新しく作らない決まり（2026-11-11）のため作れない。ケースは所属店舗を確かめない）。
 * - S-M12-01-STORES: 店舗5つ（大阪店・TC東京・休業店・非集計店・非公開店）は、依頼者決定 2026-11-11「店舗は新しく作って実行の印をつけてよい」に従い、
 *   店名に実行の印を付けた店舗を店舗登録画面で新しく作る（店名・ショップ名略称は同じ値。画面の店舗の表示名はショップ名略称）。
 * - 集計データ（日次・月次）: 画面に入れる操作が無く更新コマンド（アプリサーバでの実行）でしか作れないので、印つきの店舗の行だけ DB で足す（db/m12_01.ts）。
 *   店舗は新しく作ったので他の集計行は無く、正本の「他の行を削除する」は要らない。日付は正本のとおり（店舗が印つきの新しい店舗なので他の人の行と混ざらない）。
 *   集計データID・店舗IDの固定値（1201 など）は画面が振る値に代わり、IDは自動採番にした。
 */
import { defineSeed } from "./current_seed";
import { reportSeedIssue } from "../lib/seeds";
import { Account } from "../lib/session";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { ensureM1201Store, 店舗の定め一覧 } from "../pages/admin/m12_01_stores";
import { ゼロ, 月次を足す, 日次を足す, 店舗を控える } from "../db/m12_01";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1201_ADMIN: Account = { loginId: "m1201_admin", password: "Passw0rd!M1201" };

defineSeed("S-M12-01-ADM", async ({ browser, seed }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M12-01試験管理者", account: M1201_ADMIN, メール: "m1201_admin@example.test" });
  reportSeedIssue(seed.シードID, "読み替え: 所属店舗は、正本の「TC東京」の代わりに本店にした（店舗は新しく作らない決まり）。権限は分析・集計管理を操作できる「システム管理者」");
});

defineSeed("S-M12-01-STORES", async ({ browser, seed, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    for (const [i, d] of 店舗の定め一覧.entries()) {
      const s = await ensureM1201Store(page, d, issue);
      店舗を控える(d.名前, s);
      notes.set(`〔店舗ID-M1201-共有${"ABCDE"[i]}〕`, s.id);
    }
  });
});

const 値 = (総売上: number, 原価: number, 粗利益高: number, 販売点数: number, 取引数: number, 取引単価: number, 買取件数: number, 買取金額: number, 廃棄: number, 欠品: number) =>
  ({ 総売上, 原価, 粗利益高, 販売点数, 取引数, 取引単価, 買取件数, 買取金額, 廃棄, 欠品 });
const 同期間 = "読み替え: 集計データ・店舗IDの固定値は自動採番、店舗は印つきの新しい店舗。画面に集計行を入れる操作が無いので、印つきの店舗の集計行をDBで足した";

defineSeed("S-M12-01-DAILY-RESULT", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  日次を足す([{ 店: "TC東京", 日または月: "2026-04-15", 値: 値(1200, 400, 800, 3, 2, 600, 1, 250, 5, 6), 更新日時: "2026-04-15 23:50:00" }]);
  reportSeedIssue(seed.シードID, 同期間);
});
defineSeed("S-M12-01-MONTHLY-RESULT", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  月次を足す([{ 店: "大阪店", 日または月: "2026-04", 値: 値(3000, 1000, 2000, 10, 4, 750, 2, 500, 7, 8), 更新日時: "2026-05-01 01:00:00" }]);
  reportSeedIssue(seed.シードID, 同期間);
});
defineSeed("S-M12-01-SORT-015", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  日次を足す([["2026-04-20", "TC東京"], ["2026-04-18", "TC東京"], ["2026-04-20", "大阪店"], ["2026-04-18", "大阪店"]].map(([d, 店]) => ({ 店, 日または月: d, 値: ゼロ }))); 
  reportSeedIssue(seed.シードID, 同期間);
});
defineSeed("S-M12-01-SORT-016", { needs: ["S-M12-01-STORES", "S-M12-01-MONTHLY-RESULT"] }, async ({ seed }) => {
  月次を足す([["2026-06", "TC東京"], ["2026-05", "TC東京"], ["2026-04", "TC東京"], ["2026-06", "大阪店"], ["2026-05", "大阪店"]].map(([d, 店]) => ({ 店, 日または月: d, 値: ゼロ })));
  reportSeedIssue(seed.シードID, 同期間);
});
defineSeed("S-M12-01-TOTAL-017", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  日次を足す([
    { 店: "TC東京", 日または月: "2026-04-21", 値: 値(100, 20, 80, 2, 1, 100, 1, 30, 4, 5) },
    { 店: "大阪店", 日または月: "2026-04-21", 値: 値(200, 50, 150, 3, 2, 100, 2, 40, 6, 7) },
  ]);
  reportSeedIssue(seed.シードID, 同期間);
});
defineSeed("S-M12-01-TOTALM-045", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  月次を足す([
    { 店: "TC東京", 日または月: "2025-11", 値: 値(150, 30, 120, 4, 2, 75, 1, 25, 3, 2) },
    { 店: "大阪店", 日または月: "2025-11", 値: 値(255, 75, 180, 6, 3, 85, 2, 35, 5, 4) },
  ]);
  reportSeedIssue(seed.シードID, 同期間);
});
defineSeed("S-M12-01-DOWNLOAD-021", async () => { /* ダウンロードは Playwright が受け取る1ファイルを使う（保存先の設定は要らない） */ });
