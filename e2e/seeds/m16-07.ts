/**
 * M16-07 買取価格対応表（編集） のシード（画面操作）。正本: cases/M16-07_seed_data.tsv
 * 作るシード: S-M16-07-ADM（管理者。データ管理を操作できる「システム管理者」にした）。
 *
 * シード作成時の読み替え: 下の読み替えるシードは、買取価格対応表（共有のマスタ）と、カード状態（共有のマスタ）の行を
 * 指定の識別ID・値へ入れ替える／削除する定め。共有のマスタを書き換えない決まりと、画面から行を足せない（買取価格対応表に登録画面は無い）ため、
 * 作らない。ケースは、画面に既にある行（既存データ）を使い、値を書き換えない確かめ方に読み替える（ケースごとの読み替えは spec の「手順の注記」）。
 */
import { Account } from "../lib/session";
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M1607_ADMIN: Account = { loginId: "m1607_admin", password: "Passw0rd!M1607" };

defineSeed("S-M16-07-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M16-07試験管理者", account: M1607_ADMIN, メール: "m1607_admin@example.test" });
});

const 読み替え = "（共有のマスタなので試験の行を作らず、既存の行で確かめた）";
const 読み替えるシード: [string, string][] = [
  ["S-M16-07-CARD-CONDITIONS", "カード状態ID=1〜4のコードを設定する作り方"],
  ["S-M16-07-NOTFOUND-003", "未登録確認番号799999の行を削除する作り方"],
  ["S-M16-07-BASE-004", "識別ID=160700402の行を入れ替える作り方"],
  ["S-M16-07-BASE-007", "識別ID=160700702の行を入れ替える作り方"],
  ["S-M16-07-BASE-008", "識別ID=160700802の行を入れ替える作り方"],
  ["S-M16-07-BASE-010", "識別ID=160701002の行を入れ替える作り方"],
  ["S-M16-07-BASE-012", "識別ID=160701202の行を入れ替える作り方"],
  ["S-M16-07-BASE-013", "識別ID=160701302の行を入れ替え、799999の行を削除する作り方"],
  ["S-M16-07-BASE-014", "識別ID=160701402の行を入れ替える作り方"],
];
for (const [seedId, 作り方] of 読み替えるシード) {
  defineSeed(seedId, async ({ seed, notes }) => {
    for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法).filter((x) => !x.includes("…") && x.replace(/[〔〕\s]/g, "") !== "")) notes.set(l, 読み替え);
    reportSeedIssue(seedId, `シード作成時の問題: ${作り方}は、共有のマスタの行を書き換える・足すため行わなかった。画面に既にある行（既存データ）への読み替えで確かめる`);
  });
}
