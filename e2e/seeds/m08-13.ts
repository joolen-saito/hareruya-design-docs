/**
 * M08-13 ブラックリスト登録/編集/削除の画面シード。正本: cases/M08-13_seed_data.tsv
 *
 * - 管理者（ADM）: メンバー管理で登録する。開発環境には手動テスト用に同じログインIDのメンバーがいることがあるので、ログインIDと名前に実行の印を付ける。
 * - ブラックリスト項目（TAGS）: アプリの初期データ（1=氏名・2=電話番号・3=住所）が開発環境に入っている。書き換えず、画面の新規登録行の選択肢で確かめるだけにする。
 * - ブラックリスト（CASE・GF・DP）: ブラックリスト登録/編集/削除画面の新規登録行で1件ずつ登録し、一覧の行の削除ボタンが指す削除用フォームの識別子の末尾の数字をブラックリストIDとして控える。
 *   キーワードには実行の印を付ける（前の実行の残り・ほかの方の行と取り違えない。同じ値を複数のケースが使うものは、ケースの番号も付ける）。
 *   正本の「既存の行をすべて削除する」「一覧が記載したN件だけであることを確かめる」は行わない。開発環境のブラックリストには、ほかの方の行があり、消せないため
 *   （正本の外の補い。ケースは、控えたブラックリストIDと印を付けたキーワードの行だけを見る）。
 *   「…を0件にする」は、印を付けた値が一覧に無いことを確かめる（あれば消さずに止める）。
 *
 * - 052 の空白入りの氏名は、正本の手順どおり、画面で作った行のキーワードをDBで書き換える（E2E が作った行だけ。lib/db_write.ts）。
 *
 * 作らないシード（記録 review/M08-13_progress_2026-11-11_dev.md）: 電話番号・実在の形の氏名・住所を登録するもの（判断待ち。
 * 開発環境の全員の会員登録・会員情報変更に効く）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { M0813BlacklistPage } from "../pages/admin/m08_13_blacklist";
import { 自分の行のキーワードを書き換える } from "../db/m08_13";

export const M0813_ADMIN: Account = { loginId: rc("m0813_admin").toLowerCase(), password: "Passw0rd!M0813" };
defineSeed("S-M08-13-ADM", async ({ browser }) => { await ensureM08Admin(browser, rc("M08-13試験管理者"), M0813_ADMIN); });

/** ブラックリスト項目（正本: 1=氏名・2=電話番号・3=住所）。開発環境の初期データを確かめるだけ */
export const ブラックリスト項目 = [{ 値: "1", 表示: "氏名" }, { 値: "2", 表示: "電話番号" }, { 値: "3", 表示: "住所" }];
defineSeed("S-M08-13-TAGS", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const bl = new M0813BlacklistPage(page);
    await bl.開く();
    const have = await bl.新規登録行の項目の選択肢();
    for (const t of ブラックリスト項目) {
      if (!have.some((o) => o.値 === t.値 && o.表示 === t.表示)) {
        throw new Error(`ブラックリスト項目 ID ${t.値}=${t.表示} が選べない（ある選択肢: ${have.map((o) => `${o.値}=${o.表示}`).join("、")}）。項目のマスタは全員が使うので書き換えない`);
      }
    }
  });
});

/** ケースのキーワード（正本の値に実行の印を付ける） */
export const 印 = (正本の値: string): string => rc(正本の値);
/** 複数のケースが同じ正本の値を使うもの（重複氏名・一括更新予定）は、ケースの番号も付ける */
export const ケースの印 = (正本の値: string, 番号: string): string => rc(`${正本の値}-${番号}`);
/** 正本の値に付ける印の部分（値の途中に空白などを入れるケースが、印を末尾に保つために使う） */
export const 印の部分 = (正本の値: string): string => 印(正本の値).slice(正本の値.length);
/** 実行の印として値の末尾に付く文字（この実行の行だけを数えるのに使う） */
export const 実行の印の文字 = `-${RUN_MARK}`;

type 登録する行 = { 項目: string; キーワード: string; 呼び名: string };
type 無いこと = { 項目?: string; キーワード: string };

/**
 * ブラックリスト登録/編集/削除画面で、行を1件ずつ登録してブラックリストIDを控える。
 * 登録の前に、登録する行と「無いこと」の値が一覧に無いことを確かめる（あれば消さずに止める）。
 */
async function ブラックリストを登録する(browser: Browser, notes: Notes, 行: 登録する行[], 無い: 無いこと[] = []): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const bl = new M0813BlacklistPage(page);
    await bl.開く();
    for (const n of [...行, ...無い]) {
      const found = (await bl.キーワードの行(n.キーワード)).filter((r) => !n.項目 || r.項目 === n.項目);
      if (found.length) throw new Error(`ブラックリストに${n.項目 ?? ""}「${n.キーワード}」が既にある（ブラックリストID ${found.map((r) => r.ブラックリストID).join("、")}）。ほかの方・前の実行の行かもしれないので消さずに止める`);
    }
    for (const r of 行) {
      await bl.新規登録行で項目を選ぶ(r.項目);
      await bl.新規登録行のキーワードを入れる(r.キーワード);
      const status = await bl.登録する();
      const msg = await bl.メッセージ();
      if (status >= 400 || !bl.一覧の画面か() || msg.エラー.length) {
        throw new Error(`ブラックリストに${r.項目}「${r.キーワード}」を登録できない（応答 ${status}・画面 ${bl.いまのパス}・エラー: ${msg.エラー.join(" / ") || "なし"}）`);
      }
      const got = await bl.一致する行(r.項目, r.キーワード);
      if (got.length !== 1) throw new Error(`登録した${r.項目}「${r.キーワード}」の行が一覧に ${got.length} 件ある（1件のはず）`);
      notes.set(r.呼び名, got[0].ブラックリストID);
    }
  });
}

const 呼び名 = (番号: string): string => `〔ブラックリストID-M0813-${番号}〕`;
/** 氏名1件のシード（キーワードは正本の値に印を付ける） */
function defineNameSeed(シード: string, 番号: string, キーワード: string, 無い: 無いこと[] = []): void {
  defineSeed(シード, async ({ browser, notes }) => {
    await ブラックリストを登録する(browser, notes, [{ 項目: "氏名", キーワード, 呼び名: 呼び名(番号) }], 無い);
  });
}

defineNameSeed("S-M08-13-CASE-002", "002", 印("編集前氏名-002"), [{ 項目: "住所", キーワード: 印("東京都千代田区新町1") }, { キーワード: 印("更新氏名Test") }]);
defineNameSeed("S-M08-13-CASE-003", "003", 印("基準氏名-003"), [{ 項目: "氏名", キーワード: 印("遷移確認氏名") }]);
defineNameSeed("S-M08-13-CASE-005", "005", 印("基準氏名-005"));
/** 009: 255文字の「あ」の値は、印を末尾に入れて255文字に保つ（正本の外の補い） */
export const 文字数の値 = (文字: string, 文字数: number): string => 文字.repeat(文字数 - 実行の印の文字.length) + 実行の印の文字;
defineNameSeed("S-M08-13-CASE-009", "009", 印("基準氏名-009"), [{ 項目: "氏名", キーワード: 文字数の値("あ", 255) }]);
defineNameSeed("S-M08-13-CASE-011", "011", 印("編集前氏名-011"), [{ キーワード: 文字数の値("い", 255) }]);
defineNameSeed("S-M08-13-CASE-017", "017", 印("編集前氏名-017"), [{ 項目: "住所", キーワード: 印("東京都港区2") }, { キーワード: 印("更新Space値") }]);
defineNameSeed("S-M08-13-CASE-018", "018", ケースの印("重複氏名", "018"));
defineSeed("S-M08-13-CASE-019", async ({ browser, notes }) => {
  await ブラックリストを登録する(browser, notes, [
    { 項目: "氏名", キーワード: 印("編集前氏名-019"), 呼び名: 呼び名("019A") },
    { 項目: "氏名", キーワード: ケースの印("重複氏名", "019"), 呼び名: 呼び名("019B") },
  ]);
});
defineNameSeed("S-M08-13-CASE-020", "020", 印("編集前氏名-020"), [{ 項目: "氏名", キーワード: 印("保存後重複") }]);
defineNameSeed("S-M08-13-CASE-021", "021", ケースの印("重複氏名", "021"));
/** 電話番号「090A」は数字だけでないので登録できない値。印を付けない（あれば消さずに止める） */
export const 数字でない電話番号 = "090A";
defineNameSeed("S-M08-13-CASE-023", "023", 印("編集前氏名-023"), [{ 項目: "電話番号", キーワード: 数字でない電話番号 }, { キーワード: ケースの印("一括更新予定", "023") }]);
defineNameSeed("S-M08-13-CASE-024", "024", 印("編集前氏名-024"), [{ 項目: "電話番号", キーワード: 数字でない電話番号 }, { キーワード: ケースの印("一括更新予定", "024") }]);
defineNameSeed("S-M08-13-CASE-026", "026", 印("編集前氏名-026"), [{ キーワード: 印("トークン欠落更新") }]);
defineNameSeed("S-M08-13-CASE-027", "027", 印("編集前氏名-027"), [{ キーワード: 印("トークン改ざん更新") }]);
defineNameSeed("S-M08-13-GF-040", "040", 印("初期値確認氏名M0813-040"));
defineNameSeed("S-M08-13-GF-041", "041", 印("M0813-041-変更対象"), [{ 項目: "住所", キーワード: 印("M0813-041-変更対象") }]);
defineSeed("S-M08-13-DP-044", async ({ browser, notes }) => {
  await ブラックリストを登録する(browser, notes, [
    { 項目: "氏名", キーワード: 印("残存氏名M0813-044-A"), 呼び名: 呼び名("044-A") },
    { 項目: "住所", キーワード: 印("残存住所M0813-044-B"), 呼び名: 呼び名("044-B") },
    { 項目: "氏名", キーワード: 印("削除対象氏名M0813-044-C"), 呼び名: 呼び名("044-C") },
  ]);
});
defineNameSeed("S-M08-13-DP-045", "045", 印("基準氏名M0813-045"), [{ 項目: "住所", キーワード: 印("東京都港区M0813-045-1-2-3") }]);
defineNameSeed("S-M08-13-DP-046", "046", 印("氏名ABC-M0813-046"));
defineNameSeed("S-M08-13-DP-047", "047", 印("編集前氏名M0813-047"), [{ 項目: "氏名", キーワード: 印("新規追加氏名M0813-047") }]);

defineSeed("S-M08-13-DP-043", async ({ browser, notes }) => {
  await ブラックリストを登録する(browser, notes, [
    { 項目: "氏名", キーワード: 印("更新前氏名M0813-043-A"), 呼び名: 呼び名("043-A") },
    { 項目: "住所", キーワード: 印("更新前住所M0813-043-B"), 呼び名: 呼び名("043-B") },
  ], [{ 項目: "氏名", キーワード: 印("更新後氏名M0813-043-B") }, { 項目: "住所", キーワード: 印("更新後住所M0813-043-A") }]);
});
/** 048〜051: 氏名「基準氏名M0813CBnnn」・住所「基準住所M0813CBnnn」の2件 */
function defineBaseSeed(シード: string, 番号: string, 無い: 無いこと[] = []): void {
  defineSeed(シード, async ({ browser, notes }) => {
    await ブラックリストを登録する(browser, notes, [
      { 項目: "氏名", キーワード: 印(`基準氏名M0813CB${番号}`), 呼び名: 呼び名(`${番号}-A`) },
      { 項目: "住所", キーワード: 印(`基準住所M0813CB${番号}`), 呼び名: 呼び名(`${番号}-B`) },
    ], 無い);
  });
}
defineBaseSeed("S-M08-13-CBBASE-048", "048");
defineBaseSeed("S-M08-13-CBBASE-049", "049", [{ 項目: "住所", キーワード: 印("追加住所M0813CB049") }]);
defineBaseSeed("S-M08-13-CBBASE-050", "050", [{ 項目: "氏名", キーワード: 印("更新氏名M0813CB050") }]);
defineBaseSeed("S-M08-13-CBBASE-051", "051", [{ 項目: "住所", キーワード: 印("追加住所M0813CB051") }]);
/** 052 の空白入りの氏名（「基準」と「氏名」の間に半角スペース、「氏名」と「M0813CB052」の間に全角スペース。印は末尾） */
export const 空白入りの氏名052 = `基準 氏名　M0813CB052${印の部分("基準氏名M0813CB052")}`;
defineSeed("S-M08-13-CBSPACE-052", async ({ browser, notes }) => {
  const 氏名 = 印("基準氏名M0813CB052");
  await ブラックリストを登録する(browser, notes, [
    { 項目: "氏名", キーワード: 氏名, 呼び名: 呼び名("052-A") },
    { 項目: "住所", キーワード: 印("基準住所M0813CB052"), 呼び名: 呼び名("052-B") },
  ]);
  // 正本の手順: 画面では空白入りの行を作れないので、DBで氏名の行のキーワードを空白入りに書き換える（E2E が作ったこの行だけ）
  自分の行のキーワードを書き換える("S-M08-13-CBSPACE-052", notes.get(呼び名("052-A")), 氏名, 空白入りの氏名052);
});
