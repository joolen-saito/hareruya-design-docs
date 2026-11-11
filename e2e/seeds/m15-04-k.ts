// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M15-04 一括編集（デッキ・管理画面）のシードの作り方（画面操作）。正本: cases/M15-04_seed_data.tsv
 *
 * シード表と違えたところ（解釈）:
 * - 試験管理者（m1504qm-adm・m1504rj-adm）: メンバー管理で登録する。権限は「システム管理者」（デッキ・アーキタイプ・フォーマット・カードを
 *   操作できる。M15-05・M15-09 と同じ部品）。
 * - 決め打ちの識別の値（フォーマット名・アーキタイプ名・プレイヤー名・イベント名・成績・デッキ名・カード名）は、実行の印を付けて作る
 *   （「QM1504-002-選手」→「QM1504-002-印-選手」、「RJ1504-001-型甲」→「RJ1504-001-印-型甲」、「M1504-CB007-OldCard」→「M1504-CB007-印-OldCard」）。
 *   どのケースも値そのものの書式・文字数を確かめない。検索の語（「RJ1504-001-型」など）も同じ印を付けて読む。
 * - 「前回の残りを消す」（デッキ・アーキタイプ・フォーマット・カードの削除）は、名前に実行の印を付けて前回の残りに当たらないので行わない
 *   （ほかのデータを消さない。M15-09 と同じ扱い）。
 * - カードの画像URLはシード表の値（img/m1504/…）のまま入れる。カードセットはシード表に無いので入れない（必須の列でない）。
 * - S-M15-04-RJ-DECK-006 の並び順・メタゲーム分析日数・ランキング表示は、シード表の投入方法の値（9741・14・ON）。
 *
 * 作らないシード（ケースを実装しない）: S-M15-04-QM-META-004（ケース 004 が3601秒以上の待ちを含み、1件の実行の制限時間を超える）。
 */
import { Browser, Page } from "@playwright/test";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { フォーマットを用意する } from "../pages/admin/m15_05_deck_edit";
import { アーキタイプを登録する, 代表カードを全ページ読む } from "../pages/admin/m15_09_archetype_edit";
import { カードを取り込む, デッキを登録する } from "../pages/admin/m15_04_bulk_edit";

export const M1504_QM: Account = { loginId: "m1504qm-adm", password: "Passw0rd-M1504QM" };
export const M1504_RJ: Account = { loginId: "m1504rj-adm", password: "Passw0rd-M1504RJ" };

/** 連携試験（QM）の名前: 「QM1504-002-選手」→「QM1504-002-印-選手」 */
export const QM名 = (n: "002" | "003" | "005", 後: string) => `${rc(`QM1504-${n}`)}-${後}`;
/** 連鎖試験（RJ）の名前: 「RJ1504-001-型甲」→「RJ1504-001-印-型甲」 */
export const RJ名 = (後: string) => `${rc("RJ1504-001")}-${後}`;
/** 代表カードの試験（CB）の名前: 「M1504-CB007-型甲」→「M1504-CB007-印-型甲」 */
export type CB番号 = "007" | "008" | "009" | "010";
export const CB名 = (n: CB番号, 後: string) => `${rc(`M1504-CB${n}`)}-${後}`;

const 管理画面 = <T>(browser: Browser, 管理者: Account, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

const 残りの注記 = "「前回の残りを消す」は、名前に実行の印を付けて前回の残りに当たらないため行わなかった（ほかのデータを消さない）";

// ---- 管理者 ----
defineSeed("S-M15-04-QM-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-04連携試験の管理者", account: M1504_QM, メール: "m1504qm-adm@example.test" });
});

// ---- 連携試験（002・003・005） ----

defineSeed("S-M15-04-QM-DECK-002", { needs: ["S-M15-04-QM-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M15-04-QM-DECK-002";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const N = (後: string) => QM名("002", 後);
  await 管理画面(browser, M1504_QM, async (page) => {
    await フォーマットを用意する(page, { 名: N("フォーマット"), 名英: N("Format"), 並び順: "9402", メタ日数: "14", ランキング表示: true, メタ分布簡易化: false, 統率を使う: false, ハイランダー: false }, issue);
    await アーキタイプを登録する(page, { 名日: N("型"), 名英: N("Type"), 公開状態: "公開", フォーマット: N("フォーマット") }, issue);
    notes.set("〔デッキID-M1504-002〕", await デッキを登録する(page, {
      デッキ種別: "event", フォーマット: N("フォーマット"), アーキタイプ: N("型"), 公開状態: "公開", デッキリスト非公開: false,
      プレイヤー名: N("選手"), イベント名日: N("大会"), イベント名英: N("Event"), 開催日: "2025/03/10 10:00", 順位: "1", 成績: N("成績"), 参加人数: "18",
    }, null, issue));
  });
  issue(残りの注記);
});

/** 003・005: フォーマット1つ・アーキタイプ2つ（型甲・型乙）・型甲のデッキ1件 */
function defineQmTwoTypeSeed(seedId: string, n: "003" | "005", 並び順: string, 控え: string): void {
  defineSeed(seedId, { needs: ["S-M15-04-QM-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const N = (後: string) => QM名(n, 後);
    await 管理画面(browser, M1504_QM, async (page) => {
      await フォーマットを用意する(page, { 名: N("フォーマット"), 名英: N("Format"), 並び順, メタ日数: "14", ランキング表示: true, メタ分布簡易化: false, 統率を使う: false, ハイランダー: false }, issue);
      await アーキタイプを登録する(page, { 名日: N("型甲"), 名英: N("TypeA"), 公開状態: "公開", フォーマット: N("フォーマット") }, issue);
      await アーキタイプを登録する(page, { 名日: N("型乙"), 名英: N("TypeB"), 公開状態: "公開", フォーマット: N("フォーマット") }, issue);
      notes.set(控え, await デッキを登録する(page, {
        デッキ種別: "event", フォーマット: N("フォーマット"), アーキタイプ: N("型甲"), 公開状態: "公開", デッキリスト非公開: false,
        プレイヤー名: N("選手"), イベント名日: N("大会旧"), イベント名英: N("EventOld"), 開催日: "2025/03/10 10:00", 順位: "1", 成績: N("成績"), 参加人数: "18",
      }, null, issue));
    });
    issue(残りの注記);
  });
}
defineQmTwoTypeSeed("S-M15-04-QM-DECK-003", "003", "9403", "〔デッキID-M1504-003〕");
defineQmTwoTypeSeed("S-M15-04-QM-DECK-005", "005", "9405", "〔デッキID-M1504-005〕");

// ---- 代表カードの試験（007〜010） ----

/**
 * フォーマット1つ・カード（OldCard と、変更先の型乙に代表カードがあるときは NewCard）・アーキタイプ2つ（型甲は代表カードなし、
 * 型乙は NewCard の画像か、代表カードなし）・型甲で代表カードが OldCard の画像のデッキ1件
 */
function defineCbSeed(seedId: string, n: CB番号, 並び順: string, 型乙に画像: boolean): void {
  defineSeed(seedId, { needs: ["S-M15-04-QM-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const N = (後: string) => CB名(n, 後);
    const 旧札 = { 名日: N("旧札"), 名英: N("OldCard"), 画像URL: `img/m1504/cb${n}-old.jpg` };
    const 新札 = { 名日: N("新札"), 名英: N("NewCard"), 画像URL: `img/m1504/cb${n}-new.jpg` };
    await 管理画面(browser, M1504_QM, async (page) => {
      await カードを取り込む(page, [旧札], `M15-04 CB${n} OldCard`, issue);
      if (型乙に画像) await カードを取り込む(page, [新札], `M15-04 CB${n} NewCard`, issue);
      const fmt = N("フォーマット");
      await フォーマットを用意する(page, { 名: fmt, 名英: N("Format"), 並び順, メタ日数: "14", ランキング表示: true, メタ分布簡易化: false, 統率を使う: false, ハイランダー: false }, issue);
      await アーキタイプを登録する(page, { 名日: N("型甲"), 名英: N("TypeA"), 公開状態: "公開", フォーマット: fmt }, issue);
      let 代表カード: { 語: string; 画像ID: string } | undefined;
      if (型乙に画像) {
        const rows = (await 代表カードを全ページ読む(page, 新札.名英, { 完全一致: true })).filter((r) => r.名前 === `${新札.名日} / ${新札.名英}`);
        if (rows.length !== 1) throw new Error(`${seedId}: 代表カード検索で「${新札.名英}」の完全一致が1件に決まらない（${rows.length}件）`);
        代表カード = { 語: 新札.名英, 画像ID: rows[0].ID };
      }
      await アーキタイプを登録する(page, { 名日: N("型乙"), 名英: N("TypeB"), 公開状態: "公開", フォーマット: fmt, 代表カード }, issue);
      notes.set(`〔デッキID-M1504-${n}〕`, await デッキを登録する(page, {
        デッキ種別: "event", フォーマット: fmt, アーキタイプ: N("型甲"), 公開状態: "公開", デッキリスト非公開: false,
        プレイヤー名: N("選手"), イベント名日: N("大会"), イベント名英: N("Event"), 開催日: "2025/03/10 10:00", 順位: "1", 成績: N("成績"), 参加人数: "18",
      }, { 名英: 旧札.名英, 名日: 旧札.名日 }, issue));
    });
    issue(残りの注記);
  });
}
defineCbSeed("S-M15-04-CBONIMG-007", "007", "9507", true);
defineCbSeed("S-M15-04-CBONNOIMG-008", "008", "9508", false);
defineCbSeed("S-M15-04-CBOFFIMG-009", "009", "9509", true);
defineCbSeed("S-M15-04-CBOFFNOIMG-010", "010", "9510", false);
