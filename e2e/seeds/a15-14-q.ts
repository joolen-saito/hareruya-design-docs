/**
 * A15-14 メタゲーム情報参照の「認証の有無で結果が変わらない」ケース（016）のシード。正本: cases/A15-14_seed_data.tsv
 *  - S-A15-14-DATA-016: フォーマット（メタ範囲7日）・アーキタイプ2件・実行日の大会デッキ（公開）をアーキタイプAへ3件・Bへ2件。作り方は seeds/a15-14.ts の集計データと同じ
 *    （管理画面でフォーマット・アーキタイプを登録し、デッキ一覧の新規登録を件数分行う）。新しいフォーマットなので集計の一時保存結果は無い。
 *  - S-A15-14-MEMBER-016: ログイン済み会員。DBシードで顧客・プレイヤーを記載値（顧客ID 71514016）に登録する代わりに、フロントの新規会員登録で作り（顧客IDは画面が振る番号）、
 *    有効な認証用トークンは、テスト用認証データ作成機構の代わりに、ログインのAPIで受け取る（値は記録しない）。
 *  - S-A15-14-CALLERS: 認証用トークンヘッダなしの要求の取り決め（データなし）。
 */
import { SETUP_ADMIN } from "../config/env";
import { フォーマットのデッキの件数 } from "../db/a15_14";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { アーキタイプを登録する, デッキを登録する, フォーマットを登録する } from "../pages/admin/a15_14_metagame";
import { A1501のメール, 会員を作る } from "./a15-01";
import { 開催日時 } from "./a15-14";

export const 会員016 = { メール: "a1514-016@example.test", パスワード: "ItA1514-Pass-016!" };
export const 会員016のメール = () => A1501のメール(会員016.メール);

defineSeed("S-A15-14-CALLERS", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "認証用トークンヘッダなしの要求の取り決めで、投入するデータは無い。要求はケースの中で送る");
});

defineSeed("S-A15-14-MEMBER-016", async (ctx) => {
  await 会員を作る(ctx, { メール: 会員016.メール, パスワード: 会員016.パスワード, 名: "メタ参照会員", 選手: true, 呼び名: "016", 機能: "A1514", 会員IDの名: "顧客ID", デッキユーザーIDを控える: false });
  reportSeedIssue(ctx.seed.シードID, "顧客ID 71514016・プレイヤーID 91514016・ニックネームは、DBシードの代わりにフロントの新規会員登録で作った会員の値（番号は画面が振る）で読み替えた。有効な認証用トークンは、ログインのAPIで受け取る（ケースの中。値は記録しない）。呼び出し元の指定は無い");
});

defineSeed("S-A15-14-DATA-016", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const fid = await フォーマットを登録する(page, { 名日: "結合試験A1514-016フォーマット", 名英: "Integration A1514-016 Format", 並び順: "9000", メタ日数: "7" }, issue);
    notes.set("〔フォーマット識別子-A1514-016〕", fid);
    const 番号: Record<string, string> = {};
    for (const k of ["A", "B"]) {
      番号[k] = await アーキタイプを登録する(page, { 名日: `結合試験A1514-016アーキタイプ${k}`, 名英: `Integration A1514-016 Archetype ${k}`, フォーマット番号: fid }, issue);
      notes.set(`〔アーキタイプ識別子-A1514-016${k}〕`, 番号[k]);
    }
    for (const [k, 件数] of [["A", 3], ["B", 2]] as const) {
      for (let i = 1; i <= 件数; i++) {
        await デッキを登録する(page, { 種類: "event", 公開: true, フォーマット番号: fid, アーキタイプ番号: 番号[k], 開催日時: 開催日時(0), プレイヤー名: undefined }, `${seed.シードID} のデッキ（アーキタイプ ${k}・${i}件目）`, issue);
      }
    }
    const have = フォーマットのデッキの件数(fid);
    if (have !== 5) throw new Error(`${seed.シードID}: フォーマット ${fid} のデッキが ${have} 件（5件のはず）`);
  });
  issue("デッキの「複製」で件数を増やす代わりに、デッキ一覧の新規登録を同じ値で件数分行った。フォーマットは新しく登録した番号なので、メタゲーム集計の一時保存結果は無い");
});
