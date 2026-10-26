/**
 * M04-23 在庫分割結合CSV登録。正本: cases/M04-23_test_cases.tsv
 *
 * 画面だけで準備できるケース 001・002（在庫分割結合検索/一覧のボタンでモーダルが開く）を実装した（記録 review/M04-23_progress_2026-10-21.md）。
 * - 003〜006・009〜019・025〜030・033・036〜038・041・043・045・046・050・051・060・061・069・075〜082・085・086 は、
 *   使用シード S-M04-23-MASTER（所属の店舗・並び順を「DBへ直接設定する」）を使うので実装しない。
 *   063・064 は S-M04-23-L-MASTER（DB投入）、083・084 は S-M04-23-RD-STORES（所属の店舗をDBで直接設定）を使うので実装しない。
 * - 074 は、公開側のブラウザ環境 S-M04-23-QE-ENV（ユニサーチ試験環境へ接続できること）が要るので実装しない。
 */
import { expect } from "@playwright/test";
import { CaseBody, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { openSplitJoinList, pressSplitJoinCsvButton, SplitJoinCsvKind, splitJoinCsvModal } from "../../pages/admin/m04_23_split_join_csv";
import { m0423Admin } from "../../seeds/m04-23";

/** 事前準備①のログインのあと、一覧を開いてボタンを押し、押したボタンのモーダルが表示されることを確かめる */
function opensModal(kind: SplitJoinCsvKind): CaseBody {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, m0423Admin());
    await step(1, () => openSplitJoinList(page));
    const { modal, title } = splitJoinCsvModal(page, kind);
    await step(2, async () => {
      await expect(modal, "ボタンを押す前はモーダルが表示されていない").toBeHidden();
      await pressSplitJoinCsvButton(page, kind);
    });
    await expected(async () => {
      await expect(modal, `${kind}モーダルが表示される`).toBeVisible();
      await expect(title, `モーダルの見出しが「${kind}」`).toHaveText(kind);
    });
  };
}

caseTest("IT-M04-23-001", opensModal("在庫分割CSV登録"));
caseTest("IT-M04-23-002", opensModal("在庫結合CSV登録"));
