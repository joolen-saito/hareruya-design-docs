/**
 * F06-27 パスワード設定（ポリシー違反用）の画面シード。正本: cases/F06-27_seed_data.tsv
 * 会員（COMPLIANT-003・NOLOGIN-021）: フロントの会員情報登録で登録し本会員にする。管理画面の会員一覧で会員IDを控える。ログインを失敗させない。
 * 会員（POLICY-001〜019）: 同じく仮のパスワード（F0627-Tmp-NNN!ab）で登録して本会員にし、会員IDを控えたあと、
 *   保存パスワードを共通のポリシー違反パスワード「F0627-Old!9」（11文字。画面では指定できない）の保存値に DB で置き換える
 *   （E2E が作った実行の印つきの会員だけ。db/f06_27_write.ts）。置き換えたあとはログインを試みない。
 * 共通のポリシー違反パスワード（COMMON）: 値を定めるだけのシード（参照のみ）。
 */
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { ポリシー違反のパスワードを設定する } from "../db/f06_27_write";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);

/** 共通のポリシー違反パスワード（S-F06-27-COMMON。半角11文字） */
export const ポリシー違反のパスワード = "F0627-Old!9";

for (const [id, n] of [["S-F06-27-COMPLIANT-003", "003"], ["S-F06-27-NOLOGIN-021", "021"]] as const) {
  defineSeed(id, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0627-${n}〕`, await 本会員を作る(browser, { 姓: `F0627-${n}-会員`, 名: "試験", セイ: "テスト", メイ: "カイイン", 前半: `f0627-${n}`, パスワード: `F0627-Cmp-${n}!ab` }));
  });
}

defineSeed("S-F06-27-COMMON", async ({ seed }) => {
  reportSeedIssue(seed.シードID, `共通のポリシー違反パスワードは「${ポリシー違反のパスワード}」（半角11文字）。各ケースの会員のシードが、この値の保存値を DB で設定する`);
});

for (const n of ["001", "002", "005", "006", "007", "008", "009", "014", "015", "017", "019"]) {
  defineSeed(`S-F06-27-POLICY-${n}`, { needs: ["S-F06-27-COMMON"] }, async ({ browser, notes, seed }) => {
    const 前半 = `f0627-${n}`;
    const 会員ID = await 本会員を作る(browser, {
      姓: `F0627-${n}-会員`, 名: "試験", セイ: "テスト", メイ: "カイイン", 前半, パスワード: `F0627-Tmp-${n}!ab`, 電話番号: "0312345678",
    });
    notes.set(`〔会員ID-F0627-${n}〕`, 会員ID);
    ポリシー違反のパスワードを設定する(mailOf(前半), ポリシー違反のパスワード);
    reportSeedIssue(seed.シードID, `会員（会員ID ${会員ID}・${mailOf(前半)}）を仮のパスワード F0627-Tmp-${n}!ab で登録して本会員にし、` +
      `保存パスワードを「${ポリシー違反のパスワード}」の保存値（bcrypt。アプリの標準の照合で通る形）に DB で置き換えた（実行の印つきの会員だけ）。` +
      "生年月日・国・郵便番号・住所は登録の部品の値を使った（ケースは確かめない）");
  });
}
