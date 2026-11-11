/**
 * M13-02 のシード表にある、QK連携の店舗・選択肢と管理者（S-M13-02-QK-MASTERS・S-M13-02-QK-ADM）。正本: cases/M13-02_seed_data.tsv
 * M13 の各機能（M13-13 の039 など）のQK連携のケースが共有する。共有可なので「あれば使い、無ければ作る」。
 * - 店舗: 店舗登録画面で「QK連携店舗」を登録し、店舗一覧の ID を控える（〔店舗ID-M1302-QK共有〕）。
 *   残りの必須項目（店名カナ・店名英語・支店URL など）はシード表が「登録できる値」とするだけなので、他の店舗と重ならない値にした。
 * - 選択肢: フォーマット・ルール適用度・公開状態は初期データとして登録済みなので新しく登録せず、イベント登録画面の選択肢に出ることを確かめる。
 * - 管理者: 権限は「店舗オーナー」で代える（所属店舗＝QK連携店舗）。この権限で見えるのは所属店舗の店舗だけで、
 *   このシードの管理者が扱うのはQK連携店舗だけなので足りる（M13-11 の記録 2026-11-09 の「E2E 側で直したこと」）。
 * - 管理者のパスワード: シード表の「Passw0rd-QK」（11文字）は管理画面が拒む（12文字以上でなければならない）ので
 *   「Passw0rd-QK-M1302」に代えた（F07-04 の前例。e2e/review/F07-04_progress_2026-11-03.md）。
 *   このシードを使うケース（M13-12・M13-13・M13-15）はログインするだけで、パスワードの値そのものは確かめない。
 */
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { openEventCreate } from "../pages/admin/event";
import { ensureMember } from "../pages/admin/member";
import { ensureTenant } from "../pages/admin/tenant";

export const QK1302_ADMIN: Account = { loginId: "qk1302admin", password: "Passw0rd-QK-M1302" };
export const QK連携店舗 = "QK連携店舗";

defineSeed("S-M13-02-QK-MASTERS", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    notes.set("〔店舗ID-M1302-QK共有〕", await ensureTenant(page, {
      店名: QK連携店舗, 店名カナ: "キューケーレンケイテンポ", 店名英語: "QK Link Shop", 支店URL: "qk1302", 店名略称3文字: "QK2", ショップ名略称: QK連携店舗,
    }, issue));
    // 選択肢は登録しない。イベント登録画面の各選択欄に出ることだけを確かめる（無ければ止める）
    const form = await openEventCreate(page);
    const want: [string, import("@playwright/test").Locator, string[]][] = [
      ["フォーマット", form.フォーマット, ["スタンダード", "モダン"]],
      ["ルール適用度", form.ルール適用度, ["初心者歓迎", "カジュアル対戦"]],
      ["公開状態", form.公開状態, ["公開", "非公開"]],
    ];
    const missing: string[] = [];
    for (const [名, sel, names] of want) {
      const have = await form.options(sel);
      for (const n of names) if (!have.includes(n)) missing.push(`${名}「${n}」（ある選択肢: ${have.join("、")}）`);
    }
    if (missing.length) throw new Error(`${seed.シードID}: イベント登録画面の選択肢に無い: ${missing.join(" / ")}`);
  });
});

defineSeed("S-M13-02-QK-ADM", { needs: ["S-M13-02-QK-MASTERS"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMember(page, {
      名前: "QK連携試験管理者", 所属店舗: QK連携店舗, ログインID: QK1302_ADMIN.loginId, メールアドレス: "qk1302admin@example.test",
      パスワード: QK1302_ADMIN.password, 権限: "店舗オーナー", デフォルト検索表示店舗: QK連携店舗, 編集可能店舗: [QK連携店舗],
    });
  });
  // ログインでき（稼働中）、イベント管理の画面を開けることを、別のセッションで確かめる
  await withAdminSession(browser, QK1302_ADMIN, async (page) => {
    await openEventCreate(page);
  });
});
