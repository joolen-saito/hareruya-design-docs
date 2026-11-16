/**
 * M13-02 のシード表にある、QK連携の店舗・選択肢と管理者（S-M13-02-QK-MASTERS・S-M13-02-QK-ADM）。正本: cases/M13-02_seed_data.tsv
 * M13 の各機能（M13-13 の039 など）のQK連携のケースが共有する。共有可なので「あれば使い、無ければ作る」。
 * - 店舗: 依頼者決定 2026-11-15「店舗は作るのもう禁止」により、「QK連携店舗」は作らず、元からある店舗 店舗ID 4（札幌店）に読み替えて店舗IDを控える（〔店舗ID-M1302-QK共有〕）。
 *   M13-12・M13-13 の連携の店舗（RI。店舗ID 6）とは別の店舗にする。店舗の設定は書き換えない。
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
import { ensureMemberFixed as ensureMember } from "../pages/admin/member";
import { 店舗IDで選ぶ, 表の店舗 } from "../pages/admin/store_pick";

export const QK1302_ADMIN: Account = { loginId: "qk1302admin", password: "Passw0rd-QK-M1302" };
export const QK連携店舗 = 表の店舗("4").店名; // 正本の「QK連携店舗」は店舗ID 4（店舗は作らない）

defineSeed("S-M13-02-QK-MASTERS", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    notes.set("〔店舗ID-M1302-QK共有〕", (await 店舗IDで選ぶ(page, "4", "QK連携店舗", issue)).id);
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
