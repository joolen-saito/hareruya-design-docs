/**
 * M08-03 会員のCSV出力の画面シード。正本: cases/M08-03_seed_data.tsv
 * - 管理者（ADM）: メンバー管理で登録し、管理者IDをメンバー一覧から控える。
 * - CSV出力項目設定（CSVSET。共有の設定）: 全項目を項目の番号の昇順（識別ID順）に出力する設定にする。書き換える前の並びは控えのファイル（.runs/m0803_csv_original.json）に残し、
 *   spec の afterAll が控えへ戻してDBの参照で確かめる（ほかのケースが同じ設定を使うので、ケースごとには戻さず、実行（Playwright の起動）の終わりに戻す）。
 * - 会員: フロントの会員登録で作り、管理画面の会員編集で項目を足す。メールアドレスの前半と、検索に使うお名前(姓)には実行の印を付ける。
 * 作らないシード: 会員の値をDBで設定するもの（001・002 ほか）。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 全項目を識別ID順に出力する } from "../pages/admin/m08_03_csv";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { findMemberId } from "../pages/admin/member";
import { 会員を用意する, 会員を登録する, mailOf } from "./m08-common";

export const M0803_ADMIN: Account = { loginId: "m0803_admin", password: "Passw0rd!M0803" };
defineSeed("S-M08-03-ADM", async ({ browser, notes }) => {
  await ensureM08Admin(browser, "M08-03試験管理者", M0803_ADMIN);
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => findMemberId(page, "M08-03試験管理者"));
  if (!id) throw new Error("M08-03試験管理者の管理者IDをメンバー一覧から控えられない");
  notes.set("〔管理者ID-M0803-共有〕", id);
});

export let 出力した項目名: string[] = [];
defineSeed("S-M08-03-CSVSET", async ({ browser }) => {
  出力した項目名 = await withAdminSession(browser, SETUP_ADMIN, (page) => 全項目を識別ID順に出力する(page));
});
defineSeed("S-M08-03-MASTER2", async () => { /* 標準の初期マスタをそのまま使う（追加作業なし）。ケースの確かめで名称と番号を見る */ });

export const メール = (k: string): string => mailOf(`a0803-${k}-m0803`);
const 氏名 = { 姓: "試験", 名: "会員", セイ: "シケン", メイ: "カイイン" };

defineSeed("S-M08-03-MEMBER-003", async (ctx) => {
  await 会員を用意する(ctx, { メール: メール("003"), ...氏名, 文字: { "address][addr03": "M0803-003-ビル", close_reason: "M0803-003-退会理由" } });
});
defineSeed("S-M08-03-MEMBER-004", async (ctx) => {
  await 会員を用意する(ctx, {
    メール: メール("004"), ...氏名,
    文字: { company_name: "M0803-004-会社", "address][addr01": "M0803-004-港区", "address][addr02": "M0803-004-1-2-3", "address][addr03": "M0803-004-ビル",
      "tel][tel01": "03", "tel][tel02": "1234", "tel][tel03": "5678", "fax][fax01": "06", "fax][fax02": "9876", "fax][fax03": "5432", close_reason: "M0803-004-退会理由", note: "M0803-004-メモ" },
  });
});
defineSeed("S-M08-03-MEMBER-005", async (ctx) => {
  await 会員を用意する(ctx, { メール: メール("005"), ...氏名, 選択: { "address][pref": "大阪府", job: "弁護士" }, ラジオ: { sex: "男性" }, 会員ステータス: "仮会員" });
});

/** お名前(姓)に実行の印を付ける（検索に使う語。前の実行の残りと混ざらない） */
export const 姓 = (k: string): string => rc(`M0803-${k}-山田`);
function 山田(k: string, 件数: number) {
  defineSeed(`S-M08-03-MEMBER-${k}`, async ({ browser, notes }) => {
    for (let i = 0; i < 件数; i++) {
      await 会員を登録する(browser, notes, `a0803-${k}-${i}-m0803`, { 姓: 姓(k), 名: `会員${i + 1}`, セイ: "ヤマダ", メイ: "タロウ" }, 件数 === 1 ? `〔会員ID-M0803-${k}〕` : `〔会員ID-M0803-${k}${String.fromCharCode(65 + i)}〕`);
    }
  });
}
山田("007", 3);
山田("008", 3);
山田("010", 3);
山田("011", 11);
defineSeed("S-M08-03-MEMBER-009", async ({ browser, notes }) => {
  await 会員を登録する(browser, notes, "a0803-009-m0803", { 姓: "試験", 名: "会員", セイ: "シケン", メイ: "カイイン" }, "〔会員ID-M0803-009〕");
});
