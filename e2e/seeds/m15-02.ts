/**
 * M15-02 デッキCSV出力 のシードの作り方（画面操作）。正本: cases/M15-02_seed_data.tsv
 *
 * - 試験管理者: メンバー管理で登録する（権限は、デッキ管理を操作できる「システム管理者」。ほかの機能と同じ）。
 * - デッキ: デッキ編集画面（新規登録）で1件ずつ登録する。「任意の値」のフォーマット・アーキタイプは、アーキタイプのあるフォーマットの先頭。
 *   公開のデッキに要るイベント名(日)(英)・開催日は、正本の値（「M15-02イベント」「M15-02 Event」「2026/09/01 10:00」）で入れる。
 * - デッキ名は、検索語に使える前半に実行の印を付けて作る。
 * - ダウンロード先の専用ディレクトリ（S-M15-02-DLDIR）: 試験の基盤が、ダウンロードを1件ずつ専用の場所に保存する（ケースごとに空）。
 * - DB での準備が要るシード（フォーマットとアーキタイプの共有マスタ REF・CONFIG・RICH 以降）を使うケースは実装しない。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { デッキを登録する } from "../pages/admin/m15_deck";

export const M1502_ADMIN: Account = { loginId: "m1502_admin", password: "Passw0rd!M1502" };

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** 検索語に使える前半に実行の印を付けたデッキ名 */
export const 名前 = (stem: string) => rc(stem);

defineSeed("S-M15-02-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-02試験管理者", account: M1502_ADMIN, メール: "m1502_admin@example.test" });
});
defineSeed("S-M15-02-DLDIR", async () => { /* ダウンロードは基盤が専用の場所へ保存する */ });

type 公開 = "公開" | "非公開" | "限定公開";
function デッキ(seedId: string, defs: { key: string; 名: string; 公開: 公開 }[]): void {
  defineSeed(seedId, { needs: ["S-M15-02-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (p) => {
      for (const d of defs) {
        notes.set(`〔デッキID-M1502-${d.key}〕`, await デッキを登録する(p, {
          デッキ名: d.名, 公開状態: d.公開,
          ...(d.公開 === "公開" ? { イベント名日: "M15-02イベント", イベント名英: "M15-02 Event", 開催日: "2026-09-01T10:00" } : {}),
        }, issue));
      }
    });
  });
}
デッキ("S-M15-02-DATA-001", [{ key: "001", 名: 名前("M15-02デッキ-001"), 公開: "公開" }]);
デッキ("S-M15-02-SELECTION-002", [
  { key: "002A", 名: 名前("M15-02選択対象甲002"), 公開: "公開" },
  { key: "002B", 名: 名前("M15-02選択対象乙002"), 公開: "非公開" },
  { key: "002C", 名: 名前("M15-02非選択対象-002"), 公開: "公開" },
]);
for (const n of ["004", "005", "006", "017", "018"]) {
  デッキ(`S-M15-02-${n === "004" || n === "005" || n === "006" ? "NOSELECT" : n === "017" ? "TOKEN" : "MESSAGE"}-${n}`, [{ key: n, 名: 名前(`M15-02デッキ-${n}`), 公開: "公開" }]);
}
デッキ("S-M15-02-RECORDS-012", [
  { key: "012A", 名: 名前("M15-02レコード甲012"), 公開: "公開" },
  { key: "012B", 名: 名前("M15-02レコード乙012"), 公開: "非公開" },
  { key: "012C", 名: 名前("M15-02レコード丙012"), 公開: "限定公開" },
]);
デッキ("S-M15-02-FILENAME-013", [{ key: "013", 名: 名前("M15-02ファイル名確認-013"), 公開: "公開" }]);
