/**
 * A15-13 デッキ情報検索（デッキビルダーの API）のシード（ケース 021 が使う分）。正本: cases/A15-13_seed_data.tsv
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-13_progress_2026-11-21_dev.md にも書く）:
 * - S-A15-13-MASTERS: シード表はフォーマット・アーキタイプ・タグ・カード・配置ボードを固定の番号（13101 など）で登録または戻し、
 *   フォーマットID 13999 は「あれば試験用データを削除して0件にする」。画面は番号を指定して登録できず、共有のマスタの既存の行は書き換えない決まりなので、
 *   ケース 021 の結果に効く「フォーマットID 13999 の登録が0件」だけを DB の参照で確かめる（0件でなければ、消さずに止める）。
 *   13101〜13103 などの登録は、021 の期待結果（未登録の番号を指定すると一覧が空）に関わらないので行わない。
 */
import { BASE_URL } from "../config/env";
import { 会員を読む } from "../db/a15_01";
import { ニックネームを設定する } from "../db/a15_12";
import { フォーマットの登録件数 } from "../db/a15_13";
import { hideDebugToolbar } from "../lib/session";
import { registerFrontMember } from "../pages/front/member_entry";
import { defineSeed, reportSeedIssue } from "../lib/seeds";

defineSeed("S-A15-13-MASTERS", async ({ seed }) => {
  const n = フォーマットの登録件数("13999");
  if (n !== 0) throw new Error(`${seed.シードID}: フォーマットID 13999 の登録が ${n} 件ある（0件のはず）。共有のマスタなので消さずに止める`);
  reportSeedIssue(seed.シードID, "フォーマットID 13999 の登録が0件であることを DB の参照で確かめた（消す操作はしていない）。13101〜13103・アーキタイプ・タグ・カード・配置ボードは、番号を指定して画面から登録できず、このケースの結果に効かないので登録していない");
});

// ---- 試験会員（S-A15-13-PLAYERS。ケース 005 が使う） ----
// シード表の PLAYERS は、会員6人を登録して番号を控え、デッキ利用者ID・ニックネームを DB に書き、プレイヤーA・Bの jwt-token を発行する。
// 解釈: メールアドレスは決まった名前（@ の前に「-E2E」）で1度だけ登録して使い回す。パスワードは登録の規則（12文字以上）に合わせた値。
// デッキ利用者ID は8文字までの列でシード表の値（deck-user-alpha など）が入らないので、画面の登録で振られた値を使う（ニックネームだけ書く）。
// jwt-token は、テスト用認証データ作成機構が無いので、ログインの API で受け取る（ケースの中で受け取る。値は記録しない）。
export const 試験会員: { 呼び名: string; 名: string; メール: string; パスワード: string; ニックネーム?: string }[] = [
  { 呼び名: "共有A", 名: "プレイヤA", メール: "a1513-player-a-E2E@example.test", パスワード: "PlayerA1513!E2E", ニックネーム: "プレイヤーA" },
  { 呼び名: "共有B", 名: "プレイヤB", メール: "a1513-player-b-E2E@example.test", パスワード: "PlayerB1513!E2E", ニックネーム: "プレイヤーB" },
  { 呼び名: "共有C", 名: "プレイヤC", メール: "a1513-player-c-E2E@example.test", パスワード: "PlayerC1513!E2E" },
  { 呼び名: "共有D", 名: "プレイヤD", メール: "a1513-player-d-E2E@example.test", パスワード: "PlayerD1513!E2E" },
  { 呼び名: "共有E", 名: "プレイヤE", メール: "a1513-player-e-E2E@example.test", パスワード: "PlayerE1513!E2E" },
  { 呼び名: "共有F", 名: "プレイヤF", メール: "a1513-player-f-E2E@example.test", パスワード: "PlayerF1513!E2E" },
];

defineSeed("S-A15-13-PLAYERS", async ({ browser, notes, seed }) => {
  for (const m of 試験会員) {
    let 会員 = 会員を読む(m.メール);
    if (!会員) {
      const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(context);
        const page = await context.newPage();
        page.setDefaultTimeout(60_000);
        await registerFrontMember(page, { 姓: "結合A1513", 名: m.名, セイ: "ケツゴウ", メイ: "エー", メール: m.メール, パスワード: m.パスワード, MTG姓: "Ketsugo", MTG名: `A1513${m.呼び名.slice(-1)}E2E` });
      } finally { await context.close(); }
      for (let i = 0; (!会員 || !会員.選手ID) && i < 8; i++) { await new Promise((r) => setTimeout(r, 5_000)); 会員 = 会員を読む(m.メール); }
    }
    if (!会員 || !会員.選手ID) throw new Error(`${seed.シードID}: 会員 ${m.メール} の選手が DB に無い`);
    if (m.ニックネーム) ニックネームを設定する(seed.シードID, 会員.選手ID, m.メール, m.ニックネーム);
    if (m.呼び名 === "共有A" || m.呼び名 === "共有B") notes.set(`〔顧客ID-A1513-${m.呼び名}〕`, 会員.会員ID);
    notes.set(`〔プレイヤーID-A1513-${m.呼び名}〕`, 会員.選手ID);
  }
  reportSeedIssue(seed.シードID, "会員6人は、決まった名前のメールアドレス（@ の前に「-E2E」）で1度だけ登録して使い回した。デッキ利用者ID は8文字までの列でシード表の値が入らないので、画面の登録で振られた値を使った。ニックネーム（プレイヤーA・B）は DB に書いた。jwt-token はケースの中でログインの API から受け取る");
});
