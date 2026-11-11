/**
 * F06-12 ネット買取の一括買取確認（マイページ）の画面シード。正本: cases/F06-12_seed_data.tsv
 * 会員（MEMBER-006・007）: フロントの会員情報登録で登録し本会員にする。管理画面の会員一覧で会員IDを控える。
 * 007 の「ネット買取依頼ID 999999は0件」は、シード表は管理画面で検索し行があれば削除すると定めるが、他の人のデータを消さないため、
 * DBの参照で0件であることを確かめるだけにする（残っていれば止める。正本の外の補い）。
 */
import { 買取依頼の件数 } from "../db/f06_12";
import { available } from "../lib/db";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);

for (const n of ["006", "007"]) {
  defineSeed(`S-F06-12-MEMBER-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0612-${n}〕`, await 本会員を作る(browser, { 姓: "F06試験", 名: "会員", セイ: "シケン", メイ: "カイイン", 前半: `f0612_member-${n}`, パスワード: `F0612Case${n}Pwd!` }));
    if (n === "007") {
      if (!available) throw new Error("この環境はDB確認ができないため、ネット買取依頼ID 999999 が0件であることを確かめられない");
      const c = 買取依頼の件数(999999);
      if (c !== 0) throw new Error(`ネット買取依頼ID 999999 が開始時に ${c} 件ある`);
    }
  });
}

// 009: ネット買取依頼（ID 61220009）は DB で投入する作り方で、まとめて買取の依頼は画面で作れない。依頼を作らず、同じ番号のアドレスを未ログインで開く
defineSeed("S-F06-12-BASE-009", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "ネット買取依頼 ID 61220009（まとめて買取の明細つき）は DB で投入する作り方で、画面で作れない（まとめて買取の依頼）。依頼を作らず、同じ番号のアドレスを未ログインで開く（会員ログインへの誘導は、依頼の有無より前の認証の動き）");
});
