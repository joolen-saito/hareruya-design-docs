/**
 * M16-04 MTGマスターデータ編集 のシード（画面操作）。正本: cases/M16-04_seed_data.tsv
 * 作るシード: S-M16-04-ADM（管理者）。権限は、データ管理・マスターデータ管理・カード一覧・カードセット管理・デッキ管理を操作できる「システム管理者」にした
 * （正本は「記載した画面の操作権限を付与する」。権限を絞った専用の権限は作らない）。
 *
 * シード作成時の読み替え（依頼者 2026-11-10「既存データ または 自分で画面から作ったデータ」）:
 * 下の読み替えるシードは、MTGマスターデータ（カードタイプ・カラー・レアリティなど）の中身を、シード表のとおりに作り替える定め
 * （既存の行を DB で削除して0件にし、試験用の行を足す）。マスタは共有で、ほかの機能・ほかの人が使うため、行の削除も試験の値の追加もしない。
 * ケースは、画面に既にある行（既存データ）を読んで確かめる形に読み替え、シード表の試験用の値・控える番号は作らない
 * （控える呼び名には、読み替えたことを示す文字を入れる）。ケースごとの読み替えは spec の「手順の注記」に残す。
 */
import { Account } from "../lib/session";
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M1604_ADMIN: Account = { loginId: "m1604_admin", password: "Passw0rd!M1604" };

defineSeed("S-M16-04-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M16-04試験管理者", account: M1604_ADMIN, メール: "m1604_admin@example.test" });
});

const 読み替え = "（共有のマスタなので試験の行を作らず、既存の行で確かめた）";
const 読み替えるシード: [string, string][] = [
  ["S-M16-04-CARDTYPE", "カードタイプを0件にして試験用の3件を登録する作り方"],
  ["S-M16-04-SORT", "21種別を0件にして「並びA」「並びB」を登録する作り方"],
  ["S-M16-04-LOCK-017", "12種別の境界IDの行を指定値に設定する作り方"],
  ["S-M16-04-LOCK-019", "12種別の境界直後IDの行を指定値に設定する作り方"],
  ["S-M16-04-NOLOCK", "9種別に「ロックなし確認」の行を登録する作り方"],
  ["S-M16-04-CRUD-033", "カラーを3件にする作り方"],
  ["S-M16-04-INQ-041", "お問い合わせ件名に試験の1件を登録する作り方"],
  ["S-M16-04-INQ-047", "お問い合わせ件名の ID 1 の行を書き換える作り方"],
  ["S-M16-04-BLOCK", "ブロックタグに試験の2件を登録する作り方"],
  ["S-M16-04-DECK", "デッキタグに試験の2件を登録する作り方"],
];
for (const [seedId, 作り方] of 読み替えるシード) {
  defineSeed(seedId, async ({ seed, notes }) => {
    for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法).filter((x) => !x.includes("…") && x.replace(/[〔〕\s]/g, "") !== "")) notes.set(l, 読み替え);
    reportSeedIssue(seedId, `シード作成時の問題: ${作り方}は、共有のマスタの行を削除・書き換え・追加するため行わなかった。画面に既にある行（既存データ）への読み替えで確かめる`);
  });
}
