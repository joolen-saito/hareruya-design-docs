/**
 * F01-02 支店ECTOP のシード（支店だけを作るもの）。正本: cases/F01-02_seed_data.tsv
 * 管理画面の店舗登録で支店を作り、店舗一覧のIDを控える。支店URLは正本の例の値に実行ごとの印（小文字）を足した半角英数字。
 * 店舗登録は保存されたうえでシステムエラーの画面になることがある（店舗一覧に出ていれば先へ進み、報告する）。
 */
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { ensureTenant } from "../pages/admin/tenant";

export const 支店URL = (n: string): string => `f0102c${n}${RUN_MARK.toLowerCase()}`;
const 略称 = (s: string): string => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; const L = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return [h % 24, (h >>> 5) % 24, (h >>> 10) % 24].map((i) => L[i]).join(""); };
export const 支店名 = (n: string): string => rc(`F0102-${n}支店`);

defineSeed("S-F01-02-BROWSER", async () => { /* ブラウザの言語・ログイン状態は各ケースが開始時に設定する（フロントは日本語表示のURL /ja/ を開く） */ });

for (const n of ["009", "021", "057"]) {
  defineSeed(`S-F01-02-CASE-${n}`, async ({ browser, notes, seed }) => {
    const url = 支店URL(n);
    const id = await withAdminSession(browser, SETUP_ADMIN, (page) => ensureTenant(page, {
      店名: 支店名(n), 店名カナ: "シケンシテン", 店名英語: "Branch Shop", 支店URL: url, 店名略称3文字: 略称(url), ショップ名略称: 支店名(n),
    }, (m) => reportSeedIssue(seed.シードID, m)));
    notes.set(`〔支店ID-F0102-${n}〕`, id);
  });
}
