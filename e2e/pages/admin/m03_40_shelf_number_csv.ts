/**
 * M03-40 棚番号更新CSV登録の画面操作。画面の作りは商品公開CSV登録と同じなので、M03-38 の部品（ProductCsvUploadScreen）を使い、
 * 画面と取込の要求のパスだけをここに書く。
 */
import { Page } from "@playwright/test";
import { CsvScreenDef, ProductCsvUploadScreen } from "./m03_38_product_status_csv";

export const 棚番号更新CSV登録: CsvScreenDef = {
  名前: "棚番号更新CSV登録画面",
  画面: "/product/product_shelf_number_csv_import",
  取込: "/product/product_shelf_number_csv_upload",
};

export class ShelfNumberCsvScreen extends ProductCsvUploadScreen {
  constructor(page: Page) {
    super(page, 棚番号更新CSV登録);
  }
}
