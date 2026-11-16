/**
 * M12-01 日別・月別集計 集計一覧表示 のシードの作り方。正本: cases/M12-01_seed_data.tsv
 *
 * - S-M12-01-ADM: 試験管理者をメンバー管理で登録する。権限は、分析・集計管理を操作できる「システム管理者」、所属店舗は本店
 *   （正本の所属店舗「TC東京」には所属させない。ケースは所属店舗を確かめない）。
 * - S-M12-01-STORES: 店舗5つ（大阪店・TC東京・休業店・非集計店・非公開店）は、店舗を作らず（依頼者 2026-11-15）、E2E の店舗を店舗IDで選ぶ
 *   （大阪店=221・TC東京=5006・休業店=5007・非集計店=4973・非公開店=4974）。性質が正本と違うものだけ、ケースの間だけ店舗登録画面で変え
 *   （TC東京=売上集計の検索項目を表示する、休業店=閉店・表示する、非公開店=開店・表示する。非公開のまま）、ケースの終わりに必ず元へ戻して照合する。
 * - 集計データ（日次・月次）: 画面に入れる操作が無く更新コマンド（アプリサーバでの実行）でしか作れず、集計行は消せない。E2E の店舗の行だけ DB で足す（db/m12_01.ts）。
 *   流すたびに行が重ならないよう、正本の日付の年（2026・2025）は、E2E の店舗の集計行がほかに無い遠い将来の年（2102〜2499）に読み替える。集計データIDの固定値は自動採番。
 */
import { defineSeed } from "./current_seed";
import { reportSeedIssue } from "../lib/seeds";
import { Account } from "../lib/session";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { 店舗を整える, 店舗の定め一覧 } from "../pages/admin/m12_01_stores";
import { ゼロ, 月次を足す, 日次を足す, 店舗を控える, 年を控える, 年を読む, 空いている集計の年, 読み替える } from "../db/m12_01";
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
    const 店 = await 店舗を整える(page, 店舗の定め一覧.map((d) => d.名前), issue);
    for (const [i, d] of 店舗の定め一覧.entries()) {
      const s = 店.get(d.名前)!;
      店舗を控える(d.名前, { id: s.id, 店名: s.店名 });
      notes.set(`〔店舗ID-M1201-共有${"ABCDE"[i]}〕`, s.id);
    }
  });
});

const 値 = (総売上: number, 原価: number, 粗利益高: number, 販売点数: number, 取引数: number, 取引単価: number, 買取件数: number, 買取金額: number, 廃棄: number, 欠品: number) =>
  ({ 総売上, 原価, 粗利益高, 販売点数, 取引数, 取引単価, 買取件数, 買取金額, 廃棄, 欠品 });
const 同期間 = (y: number) => `読み替え: 正本の日付の年（2026。045は2025）は、E2E の店舗の集計行がほかに無い年（今回は ${y} 年。045は ${y - 1} 年）に読み替えた（集計行は消せず、流すたびに重ならないため）。`
  + "集計データ・店舗IDの固定値は自動採番、店舗は E2E の店舗（店舗を作らない。依頼者 2026-11-15）。画面に集計行を入れる操作が無いので、E2E の店舗の集計行をDBで足した";

/** 集計行は消せないので、同じ作り手（同じ処理の中）で同じ年に二度足さない（やり直しで重ねない） */
const 足した = new Set<string>();
function 年を決める(キー: string, 前の年も = false): { y: number; 済: boolean } {
  if (足した.has(キー)) return { y: 年を読む(キー), 済: true };
  const y = 空いている集計の年(`M1201-${キー}`, 前の年も);
  年を控える(キー, y); 足した.add(キー);
  return { y, 済: false };
}

defineSeed("S-M12-01-DAILY-RESULT", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  const { y, 済 } = 年を決める("DAILY-RESULT");
  if (!済) 日次を足す([{ 店: "TC東京", 日または月: 読み替える(y, "2026-04-15"), 値: 値(1200, 400, 800, 3, 2, 600, 1, 250, 5, 6), 更新日時: 読み替える(y, "2026-04-15") + " 23:50:00" }]);
  reportSeedIssue(seed.シードID, 同期間(y));
});
defineSeed("S-M12-01-MONTHLY-RESULT", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  const { y, 済 } = 年を決める("MONTHLY-RESULT");
  if (!済) 月次を足す([{ 店: "大阪店", 日または月: 読み替える(y, "2026-04"), 値: 値(3000, 1000, 2000, 10, 4, 750, 2, 500, 7, 8), 更新日時: 読み替える(y, "2026-05-01") + " 01:00:00" }]);
  reportSeedIssue(seed.シードID, 同期間(y));
});
defineSeed("S-M12-01-SORT-015", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  const { y, 済 } = 年を決める("SORT-015");
  if (!済) 日次を足す([["2026-04-20", "TC東京"], ["2026-04-18", "TC東京"], ["2026-04-20", "大阪店"], ["2026-04-18", "大阪店"]].map(([d, 店]) => ({ 店, 日または月: 読み替える(y, d), 値: ゼロ })));
  reportSeedIssue(seed.シードID, 同期間(y));
});
defineSeed("S-M12-01-SORT-016", { needs: ["S-M12-01-STORES", "S-M12-01-MONTHLY-RESULT"] }, async ({ seed }) => {
  // 正本は、MONTHLY-RESULT の 2026-04・大阪店の行と合わせた6行にする。MONTHLY-RESULT と同じ年に足す
  const y = 年を読む("MONTHLY-RESULT");
  if (!足した.has("SORT-016")) {
    足した.add("SORT-016");
    月次を足す([["2026-06", "TC東京"], ["2026-05", "TC東京"], ["2026-04", "TC東京"], ["2026-06", "大阪店"], ["2026-05", "大阪店"]].map(([d, 店]) => ({ 店, 日または月: 読み替える(y, d), 値: ゼロ })));
  }
  reportSeedIssue(seed.シードID, 同期間(y));
});
defineSeed("S-M12-01-TOTAL-017", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  const { y, 済 } = 年を決める("TOTAL-017");
  if (!済) 日次を足す([
    { 店: "TC東京", 日または月: 読み替える(y, "2026-04-21"), 値: 値(100, 20, 80, 2, 1, 100, 1, 30, 4, 5) },
    { 店: "大阪店", 日または月: 読み替える(y, "2026-04-21"), 値: 値(200, 50, 150, 3, 2, 100, 2, 40, 6, 7) },
  ]);
  reportSeedIssue(seed.シードID, 同期間(y));
});
defineSeed("S-M12-01-TOTALM-045", { needs: ["S-M12-01-STORES"] }, async ({ seed }) => {
  const { y, 済 } = 年を決める("TOTALM-045", true);
  if (!済) 月次を足す([
    { 店: "TC東京", 日または月: 読み替える(y, "2025-11"), 値: 値(150, 30, 120, 4, 2, 75, 1, 25, 3, 2) },
    { 店: "大阪店", 日または月: 読み替える(y, "2025-11"), 値: 値(255, 75, 180, 6, 3, 85, 2, 35, 5, 4) },
  ]);
  reportSeedIssue(seed.シードID, 同期間(y));
});
defineSeed("S-M12-01-DOWNLOAD-021", async () => { /* ダウンロードは Playwright が受け取る1ファイルを使う（保存先の設定は要らない） */ });
