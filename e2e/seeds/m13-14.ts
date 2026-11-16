/**
 * M13-14 バナー設定のシード（画面操作）。正本: cases/M13-14_seed_data.tsv
 *
 * - S-M13-14-SHOPS: シード表の「晴れる屋東京店」「晴れる屋大阪店」は、M13 のイベント系と同じ実行の印つきの店舗A・B（pages/admin/m13_marked_shop.ts）に読み替える。
 *   店舗を足すだけで、既存の店舗は変えない。ケースは店名を使わない。
 * - S-M13-14-LANGUAGES: 言語はマスタ（日本語・英語）で、画面から作れない。登録しない。
 * - S-M13-14-BANNERS（共有のものを書き換える。008・009・010・012・014 が使う）:
 *   共有のバナー設定の全15枠の入力値を、画面から全部控え（lib/shared_restore.ts の registerRestore）、
 *   シード表の値（画像URL before-01〜…・表示店舗は店舗A・言語は日本語・表示タイプはスライド+特設）で保存する。
 *   ケースの終わりに、基盤が画面で控えた値を全枠保存し直して戻し、全枠を読んで元と同じことを確かめる（戻せなければ以降の共有の書き換えを止める）。
 *   枠が15件でない・元の値が入力規則に合わないときは、書き換えずに止まる。
 *   「保存前の内容から更新されない」は、書き換えた直後の値と操作後の値が同じことで確かめる（spec）。
 * - S-M13-14-CASE-0NN（実装した各ケースの番号）: メンバー登録画面で管理者（ログインID m1314_admin-0NN）を登録する。
 *   権限は「モールオペレーター」で代える（「店舗オーナー」は所属店舗の店舗しか見えない）。編集可能店舗は店舗A・B。
 */
import { test } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { BannerSettingPage, 枠の値 } from "../pages/admin/m13_14_banner_setting";
import { registerRestore } from "../lib/shared_restore";
import { rcFixed } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMarkedTenant, 印店名 } from "../pages/admin/m13_marked_shop";
import { ensureMemberFixed as ensureMember } from "../pages/admin/member";

// 店舗を決まった名前（店舗A-E2E など）にしたので、管理者も決まった印の名前・ログインIDで1度だけ作って使い回す（前の実行の印つきの店舗に所属した管理者とぶつけない）
export const M1314_ADMIN = (n: string): Account => ({ loginId: rcFixed(`m1314_admin-${n}`).toLowerCase(), password: `M1314Pass${n}X` });

defineSeed("S-M13-14-SHOPS", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    notes.set("〔店舗ID-M1314-共有A〕", await ensureMarkedTenant(page, "A", issue));
    notes.set("〔店舗ID-M1314-共有B〕", await ensureMarkedTenant(page, "B", issue));
  });
  reportSeedIssue(seed.シードID, "シード表の「晴れる屋東京店」「晴れる屋大阪店」は、実行の印つきの店舗A・Bに読み替えた（ケースは店名を使わない）");
});

defineSeed("S-M13-14-LANGUAGES", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "言語（日本語・英語）はマスタで、画面から作れない。登録しない（ケースは言語の選択肢を使わない）");
});

defineSeed("S-M13-14-BANNERS", { needs: ["S-M13-14-SHOPS"] }, async ({ browser, notes, seed }) => {
  // 002 は画像設定欄へのリンクを押すだけで、枠の値を使わない。共有のバナー設定を書き換えない（並行して流しても影響しないように）
  if (test.info().title.startsWith("IT-M13-14-002 ")) {
    reportSeedIssue(seed.シードID, "このケースは枠の値を使わない（リンクを押すだけ）ため、共有のバナー設定は書き換えなかった");
    return;
  }
  const 表示店舗A = notes.get("〔店舗ID-M1314-共有A〕");
  const 読む = (): Promise<枠の値[]> => withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const p = new BannerSettingPage(page);
    await p.開く();
    return await p.全枠の値を読む();
  });
  const 前 = await 読む();
  if (前.length !== 15) throw new Error(`バナー設定の枠が15件ではない（${前.length}件）。シード表は15件を前提にしている`);
  // 元の値を画面から保存し直せるか（入力規則に合うか）を、書き換える前に確かめる
  const 規則 = /^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/;
  for (const x of 前) {
    const 合う = x.画像URL.length <= 255 && x.リンク先URL.length <= 255 && !/admin\.hareruyamtg\.com/.test(x.画像URL) && 規則.test(x.画像URL) && 規則.test(x.リンク先URL);
    if (!合う) throw new Error(`識別番号${x.識別番号}の元の値が入力規則に合わず、画面から保存し直せない。書き換えない`);
  }
  // 画像URLが空の枠は、保存すると表示タイプが「非表示」にそろう（アプリの定め）。今の値がそうなっていない枠があれば、
  // 画面で元どおりに戻せない（依頼者 2026-11-11「ちゃんと元に戻して」）ので書き換えない
  const 戻せない = 前.filter((x) => x.画像URL.trim() === "" && x.表示タイプ !== "0");
  if (戻せない.length) throw new Error(`識別番号${戻せない.map((x) => x.識別番号).join("・")}は画像URLが空で表示タイプが非表示でない。保存し直すと表示タイプが変わり元に戻せないので、共有のバナー設定を書き換えない`);
  const 保存後の形 = (a: 枠の値[]): 枠の値[] => a;
  const 保存する = (入れる: 枠の値[]): Promise<void> => withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const p = new BannerSettingPage(page);
    await p.開く();
    await p.全枠の値を入れる(入れる);
    await p.保存する();
  });
  registerRestore(
    "イベント管理のバナー設定（全15枠）",
    前,
    async () => { await 保存する(前); },
    async () => JSON.stringify(await 読む()) === JSON.stringify(保存後の形(前)),
  );
  const 後: 枠の値[] = 前.map((x) => {
    const nn = String(x.識別番号).padStart(2, "0");
    return {
      識別番号: x.識別番号, 画像URL: `https://replace-dev.hareruyamtg.com:8443/before-${nn}.png`, リンク先URL: `https://replace-dev.hareruyamtg.com:8443/before-${nn}`,
      表示店舗: [表示店舗A], 言語: ["1"], 表示タイプ: "1", 画像alt属性: `変更前${nn}`, 並び順: String(x.識別番号),
    };
  });
  await 保存する(後);
  if (JSON.stringify(await 読む()) !== JSON.stringify(後)) throw new Error("バナー設定を書き換えたが、画面の値がシード表の値と一致しない（表示タイプ「スライド+特設」の値は1と仮定）");
  reportSeedIssue(seed.シードID, "共有のバナー設定（識別番号1〜15）を、画面で元の値を控えてからシード表の値に書き換え、ケースの終わりに画面で元の値に戻して確かめる。枠が15件であることは画面で確かめた");
});

function defineCaseAdminSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: ["S-M13-14-SHOPS"] }, async ({ browser, notes }) => {
    const a = M1314_ADMIN(n);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      notes.set(`〔管理者ID-M1314-${n}〕`, await ensureMember(page, {
        名前: a.loginId, 所属店舗: 印店名.A, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
        権限: "モールオペレーター", デフォルト検索表示店舗: 印店名.A, 編集可能店舗: [印店名.A, 印店名.B],
      }));
    });
  });
}

for (const n of ["002", "008", "009", "010", "012", "014"]) defineCaseAdminSeed(`S-M13-14-CASE-${n}`, n);
