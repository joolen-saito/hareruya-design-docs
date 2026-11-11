/**
 * M04-22 在庫移動・振替CSV登録。正本: cases/M04-22_test_cases.tsv
 *
 * 画面だけで準備できるケース 001・002（在庫移動・振替検索一覧のボタンでモーダルが開く）。記録 review/M04-22_progress_2026-10-21.md。
 * - 仕分け直しで流せる見込みになったケース（003〜054 のうち29件）は spec/m04/m04-22-x.spec.ts。
 *   実装しないもの（024・026・027・047・048・043 など）の理由は記録 review/M04-22_progress_2026-11-11_dev.md。
 * - 試験用の権限は、開発環境の既存の権限「店舗オペレーター」（承認権限だけが外れている）で読み替えている（seeds/m04-22.ts）。
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
