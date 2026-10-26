/**
 * M04-22 在庫移動・振替CSV登録。正本: cases/M04-22_test_cases.tsv
 *
 * 画面だけで準備できるケース 001・002（在庫移動・振替検索一覧のボタンでモーダルが開く）を実装した（記録 review/M04-22_progress_2026-10-21.md）。
 * - 003〜010・013・015・016・020・022〜024・026〜030・037・040・041・044〜046・049〜054 は、使用シード
 *   S-M04-22-BASES（在庫区分・移動タイプ・初期ステータス・在庫変動区分を「DBへ直接設定する」）などを使うので実装しない。
 *   047・048 は S-M04-22-RD-STORES（所属の店舗を「DBで直接設定する」）を使うので実装しない。
 * - 043 は、公開側のブラウザ環境 S-M04-22-QE-ENV（ユニサーチ試験環境へ接続できること）と、ユニサーチへのフィード反映が要るので実装しない。
 */
import { expect, CaseBody, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CsvModalKind, csvModal, openMoveTransferList, pressCsvRegisterButton } from "../../pages/admin/m04_22_move_transfer_csv";
import { M0422_EDIT } from "../../seeds/m04-22";

/** 事前準備②のログインのあと、一覧を開いてボタンを押し、押したボタンのモーダルが表示されることを確かめる */
function opensModal(kind: CsvModalKind): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, M0422_EDIT);
    await step(1, () => openMoveTransferList(page));
    const { modal, title } = csvModal(page, kind);
    await step(2, async () => {
      await expect(modal, "ボタンを押す前はモーダルが表示されていない").toBeHidden();
      await pressCsvRegisterButton(page, kind);
    });
    await expected(async () => {
      await expect(modal, `${kind}モーダルが表示される`).toBeVisible();
      await expect(title, `モーダルの見出しが「${kind}」`).toHaveText(kind);
    });
  };
}

caseTest("IT-M04-22-001", opensModal("在庫移動CSV登録"));
caseTest("IT-M04-22-002", opensModal("在庫振替CSV登録"));
