/**
 * M04-30 のシード（seeds/m04-30-c.ts）が使う、E2E が作った商品規格への書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * 書くのは、実行の印つきの商品コードの商品規格だけ（lib/db_write.ts の窓口を通す）。
 */
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 自分の商品規格 = { sql: `select pc.id from dtb_product_class pc where pc.product_code like '%-' || $1`, params: [RUN_MARK] };

/** 商品規格の言語を未設定にする（シード表「言語は画面で空にできないためDBへ直接設定する」） */
export function 言語を未設定にする(what: string, 規格ID: string): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID], set: { language_id: null }, owner: 自分の商品規格 });
}

/** 商品規格の状態を未設定にする（シード表「状態は画面で空にできないためDBへ直接設定する」） */
export function 状態を未設定にする(what: string, 規格ID: string): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID], set: { card_condition_id: null }, owner: 自分の商品規格 });
}
