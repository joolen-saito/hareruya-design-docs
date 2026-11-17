/**
 * A15-02 ログアウト（デッキビルダーの API の POST /api/user/logout）のシード。正本: cases/A15-02_seed_data.tsv
 * 作り方は A15-01 と同じ（seeds/a15-01.ts の 会員を作る。フロントの新規会員登録・MTG Companion登録名を入れて選手を作る・メールの前半に実行の印）。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-02_progress_2026-11-14_dev.md にも書く）:
 * - S-A15-02-ENV（試験用署名鍵・セッション保存先）は、共有の開発環境では設定済みの値をそのまま使う（何もしない）。
 * - S-A15-02-BADSIGNOPLAYER-009 のアクセストークン「A15-02-TOKEN-009」は、署名鍵を使わずに作れる（署名の部分を
 *   「invalid-signature-a1502-009」にする）ので、ケースの中で、ヘッダ（HS256）・内容（利用者ID 1502000009）を base64url で並べて作る。
 *   利用者ID 1502000009 の選手が無いことは DB の参照で確かめる（ほかの方のデータは消さない）。
 */
import { 会員IDの選手の数 } from "../db/a15_01";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 会員を作る, 印の注記 } from "./a15-01";

defineSeed("S-A15-02-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有の開発環境では、API の認証の秘密値・署名方式・セッション保存先を書き換えず、設定済みの値をそのまま使った（シード表の ≪共有の設定≫ のとおり）");
});

for (const [id, n] of [["S-A15-02-SUCCESS-001", "001"], ["S-A15-02-BODY-002", "002"], ["S-A15-02-COOKIE-003", "003"], ["S-A15-02-NOTOKEN-004", "004"], ["S-A15-02-BADSIG-005", "005"]] as const) {
  defineSeed(id, async (ctx) => {
    await 会員を作る(ctx, { メール: `logout.a1502-${n}@example.test`, パスワード: `LogoutA1502-${n}!`, 名: `A1502${n}`, 選手: true, 呼び名: n, 機能: "A1502", デッキユーザーIDを控える: false });
    reportSeedIssue(ctx.seed.シードID, 印の注記);
  });
}

defineSeed("S-A15-02-BADSIGNOPLAYER-009", async ({ seed }) => {
  const n = 会員IDの選手の数("1502000009");
  if (n > 0) throw new Error(`${seed.シードID}: 利用者ID 1502000009 の選手が ${n} 件ある（シード表は未登録。ほかの方のデータなので消さずに止める）`);
  reportSeedIssue(seed.シードID, "利用者ID 1502000009 の選手が無いことを DB の参照で確かめた。アクセストークン「A15-02-TOKEN-009」は、ケースの中でヘッダ（HS256）・内容（利用者ID 1502000009）と、署名の部分「invalid-signature-a1502-009」を並べて作る（署名鍵は使わない）");
});
