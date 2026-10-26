/**
 * M04-12 在庫分割結合検索/一覧（メニュー「在庫管理」→「在庫分割結合一覧」）の、CSV登録のボタンとモーダル。
 * 検索欄の操作は M04-13 の部品（pages/admin/m04_13_split_join.ts の SplitJoinListPage）をそのまま使う。
 * 画面の作り（アプリのテンプレート stock_split_join_index.twig で確かめたこと）:
 * - 画面上部の「在庫分割結合一覧」の枠に「在庫分割CSV登録」「在庫結合CSV登録」のボタンがあり、押すとそれぞれのモーダルを開く。
 * - モーダルの中身は、在庫分割結合CSV登録（M04-23）の在庫分割・在庫結合のCSVの登録欄（同じ部品を読み込んでいる）。
 * 画面のスクリプトが読み込まれる前に押すとモーダルが開かないので、読み込みを待ってから押す。
 */
import { expect, Locator, Page } from "@playwright/test";

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

export type CsvKind = "在庫分割CSV登録" | "在庫結合CSV登録";

export class SplitJoinCsvButtons {
  constructor(readonly page: Page) {}

  button(kind: CsvKind): Locator {
    return this.page.locator("button.btn-ec-conversion", { hasText: exact(kind) });
  }

  modal(kind: CsvKind): Locator {
    return this.page.locator(kind === "在庫分割CSV登録" ? "#modalSplitCsv" : "#modalJoinCsv");
  }

  modalTitle(kind: CsvKind): Locator {
    return this.modal(kind).locator(".modal-title");
  }

  /** モーダルの中の、CSVの登録欄（M04-23 の在庫分割・在庫結合のCSV登録の部品） */
  modalUploadForm(kind: CsvKind): Locator {
    return this.modal(kind).locator(kind === "在庫分割CSV登録" ? "form#form-stock-split-csv-upload" : "form#form-stock-join-csv-upload");
  }

  /** ボタンを押す（モーダルが開くのを確かめるのは呼ぶ側） */
  async press(kind: CsvKind): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.button(kind), `「${kind}」ボタン`).toHaveCount(1);
    await this.button(kind).click();
  }
}
