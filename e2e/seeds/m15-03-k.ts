// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M15-03 一括削除（デッキ・管理画面）のシードの作り方（画面操作）。正本: cases/M15-03_seed_data.tsv
 *
 * シード表と違えたところ（解釈）:
 * - 試験管理者（m1503qm-adm）: メンバー管理で登録する。権限は「システム管理者」（M15-04・M15-05 と同じ部品）。
 * - 決め打ちの識別の値（フォーマット名・アーキタイプ名・プレイヤー名・イベント名・成績）は、実行の印を付けて作る
 *   （「QM1503-001-選手甲」→「QM1503-001-印-選手甲」、「M1503-CB004-選手01」→「M1503-CB004-印-選手01」）。
 *   どのケースも値そのものの書式・文字数を確かめない。検索の語（「QM1503-001-選手」など）も同じ印を付けて読む。
 * - 「前回の残りを消す」（デッキ・アーキタイプ・フォーマットの削除）は、名前に実行の印を付けて前回の残りに当たらないので行わない
 *   （ほかの人のデッキ・マスタを消さない。M15-04・M15-09 と同じ扱い）。一括削除で消すのは、この実行で作った印つきのデッキだけ。
 * - S-M15-03-QM-DECK-001 の2件目（選手乙）の順位は、投入方法の値（2）。状態・属性の「順位=1」とは食い違うが、ケースは順位を確かめない。
 *
 * 作らないシード（ケースを実装しない）:
 * - S-M15-03-QM-META-002（ケース 002 が3601秒以上の待ちを含み、1件の実行の制限時間を超える）
 * - S-M15-03-CBPAGEHEAD-006・S-M15-03-CBPAGEMID-008（デッキと試験記事の関連付けを DB へ直接設定する。依頼者の指示待ち）
 */
import { Browser, Page } from "@playwright/test";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { フォーマットを用意する } from "../pages/admin/m15_05_deck_edit";
import { アーキタイプを登録する } from "../pages/admin/m15_09_archetype_edit";
import { デッキを登録する } from "../pages/admin/m15_04_bulk_edit";

export const M1503_QM: Account = { loginId: "m1503qm-adm", password: "Passw0rd-M1503QM" };

/** 「QM1503-001-選手甲」→「QM1503-001-印-選手甲」 */
export const QM名 = (n: "001" | "003", 後: string) => `${rc(`QM1503-${n}`)}-${後}`;
/** 「M1503-CB004-選手01」→「M1503-CB004-印-選手01」 */
export const CB名 = (n: "004", 後: string) => `${rc(`M1503-CB${n}`)}-${後}`;

const 管理画面 = <T>(browser: Browser, 管理者: Account, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

const 残りの注記 = "「前回の残りを消す」は、名前に実行の印を付けて前回の残りに当たらないため行わなかった（ほかのデータを消さない）";

type Issue = (m: string) => void;

/** フォーマット1つ・アーキタイプ1つ（公開・代表カードなし）を登録する */
async function フォーマットと型(page: Page, N: (後: string) => string, 並び順: string, issue: Issue): Promise<void> {
  await フォーマットを用意する(page, { 名: N("フォーマット"), 名英: N("Format"), 並び順, メタ日数: "14", ランキング表示: true, メタ分布簡易化: false, 統率を使う: false, ハイランダー: false }, issue);
  await アーキタイプを登録する(page, { 名日: N("型"), 名英: N("Type"), 公開状態: "公開", フォーマット: N("フォーマット") }, issue);
}

/** 大会デッキ（公開・デッキリスト公開・記事に紐づけない）を1件登録し、デッキIDを返す */
function 大会デッキ(page: Page, N: (後: string) => string, v: { 選手: string; 順位: string; 成績: string }, issue: Issue): Promise<string> {
  return デッキを登録する(page, {
    デッキ種別: "event", フォーマット: N("フォーマット"), アーキタイプ: N("型"), 公開状態: "公開", デッキリスト非公開: false,
    プレイヤー名: N(v.選手), イベント名日: N("大会"), イベント名英: N("Event"), 開催日: "2025/03/10 10:00", 順位: v.順位, 成績: N(v.成績), 参加人数: "18",
  }, null, issue);
}

// ---- 001: 一括削除するデッキ2件 ----
defineSeed("S-M15-03-QM-DECK-001", { needs: ["S-M15-03-QM-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M15-03-QM-DECK-001";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const N = (後: string) => QM名("001", 後);
  await 管理画面(browser, M1503_QM, async (page) => {
    await フォーマットと型(page, N, "9301", issue);
    notes.set("〔デッキID-M1503-001A〕", await 大会デッキ(page, N, { 選手: "選手甲", 順位: "1", 成績: "成績甲" }, issue));
    notes.set("〔デッキID-M1503-001B〕", await 大会デッキ(page, N, { 選手: "選手乙", 順位: "2", 成績: "成績乙" }, issue));
  });
  issue(残りの注記);
  issue("2件目（選手乙）の順位は投入方法の値 2 で登録した（状態・属性は順位=1。ケースは順位を確かめない）");
});

// ---- 003: 一括削除するデッキ1件 ----
defineSeed("S-M15-03-QM-DECK-003", { needs: ["S-M15-03-QM-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M15-03-QM-DECK-003";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const N = (後: string) => QM名("003", 後);
  await 管理画面(browser, M1503_QM, async (page) => {
    await フォーマットと型(page, N, "9303", issue);
    notes.set("〔デッキID-M1503-003〕", await 大会デッキ(page, N, { 選手: "選手甲", 順位: "1", 成績: "成績甲" }, issue));
  });
  issue(残りの注記);
});
