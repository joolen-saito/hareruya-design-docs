/**
 * M14-09 フォーマット一覧 のシードの作り方（画面操作）その2。正本: cases/M14-09_seed_data.tsv
 * - デッキ使用中フォーマット(013・014)、新規登録前状態(024)、編集保存確認データ(025)
 * - 名称には実行の印を付ける（手元の開発用のフォーマットや前の実行の残りと重ならないようにする）
 * - デッキ登録に必須のアーキタイプは、補助のフォーマットに属する補助アーキタイプを使う（シード表のとおり）。
 *   アーキタイプの公開状態は部品の既定（公開）で登録した（シード表は「非公開」。デッキとの紐付けや削除の可否に影響しない）
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { フォーマットを登録する } from "../pages/admin/m14_10_format";
import { アーキタイプを登録する } from "../pages/admin/m12_deck_seed";
import { デッキを登録する } from "../pages/admin/m15_deck";

for (const n of ["013", "014"]) {
  defineSeed(`S-M14-09-DECK-${n}`, { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const 使用中 = rc(`デッキ使用中フォーマット-${n}`), 補助 = rc(`デッキ用補助フォーマット-${n}`);
      notes.set(`〔フォーマットID-M1409-${n}〕`, await フォーマットを登録する(page, { 名日: 使用中, 名英: rc(`Deck Format ${n}`), 並び順: "900" }, seed.シードID));
      await フォーマットを登録する(page, { 名日: 補助, 名英: rc(`Deck Helper Format ${n}`), 並び順: "900" }, seed.シードID);
      const 補助アーキタイプ = await アーキタイプを登録する(page, { 名日: `デッキ用補助アーキタイプ-${n}`, 名英: `DeckHelperArchetype${n}`, フォーマット: 補助 }, (m) => reportSeedIssue(seed.シードID, m));
      await デッキを登録する(page, { デッキ名: rc(`DECK-M1409-01-${n}`), デッキタイプ: "user", フォーマット: 使用中, アーキタイプ: 補助アーキタイプ, アーキタイプのフォーマット: 補助, 公開状態: "非公開" }, (m) => reportSeedIssue(seed.シードID, m));
    });
  });
}

/** 新規登録前状態: 登録対象の名称は実行の印つきなので、一覧に無い状態から始まる（作る操作は無い） */
defineSeed("S-M14-09-REGISTER-024", { needs: ["S-M14-09-ADM"] }, async () => undefined);

defineSeed("S-M14-09-EDIT-025", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔フォーマットID-M1409-025〕", await フォーマットを登録する(page, { 名日: rc("編集前フォーマット"), 名英: rc("Before Format"), 並び順: "30", メタ日数: "30" }, seed.シードID));
  });
});
