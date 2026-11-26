/**
 * M04-32 在庫編集承認一覧: 承認状態「スマレジ連携失敗」の行が要るケース（121・128・145・146）の、組織・商品・在庫・申請の作り方。
 * 作り方の部品は seeds/m04-32.ts（組織・支店の読み替え・商品作成・在庫編集・承認・在庫変更CSV登録）をそのまま使う。
 * 承認状態を「スマレジ連携失敗」にする手順だけは、画面で作れない状態なので、各ケースの事前準備で E2E が作った承認の行にだけ DB で足す
 * （db/m04_32_d.ts。依頼者決定 2026-11-10）。ここでは「未承認の申請が1件ある」ところまでを画面で作る。
 */
import { rc as markCode } from "../lib/run_marker";
import { cbm, cbx, defineOrgSeed, defineStockSeed, Op } from "./m04-32";

const 入庫10 = (code: string): Op => ({ op: "在庫編集", code, 区分: "入庫/その他", 理由: "試験データ", 数: "10", 単価: "100" });
const 承認10 = (code: string): Op => ({ op: "承認", target: "在庫編集", 未承認: false, 確認: [{ code, 在庫: 10 }] });
const 入庫3 = (code: string, 理由: string): Op => ({ op: "在庫編集", code, 区分: "入庫/問屋仕入", 理由, 数: "3", 単価: "300" });

// 121（組織と在庫が別のシード）
export const CB121 = cbm("121", "C21");
defineOrgSeed("S-M04-32-CBORG-121", CB121.org, CB121.store);
defineStockSeed("S-M04-32-CBSTOCK-121", {
  needs: ["S-M04-32-CBORG-121"], org: CB121.org, store: CB121.store, withOrg: false,
  products: [{ 商品コード: CB121.code, 商品名: CB121.name }],
  ops: [入庫10(CB121.code), 承認10(CB121.code), 入庫3(CB121.code, "CBM0432-121-入庫")],
});

// 128（在庫編集と在庫変更CSV登録の2件の申請）
export const CB128 = cbm("128", "C28");
export const CODEA128 = markCode("CBM0432-128-CODEA");
export const CODEB128 = markCode("CBM0432-128-CODEB");
defineOrgSeed("S-M04-32-CBORG-128", CB128.org, CB128.store);
defineStockSeed("S-M04-32-CBSTOCK-128", {
  needs: ["S-M04-32-CBORG-128"], org: CB128.org, store: CB128.store, withOrg: false,
  products: [{ 商品コード: CODEA128, 商品名: "CBM0432-128-NAMEA" }, { 商品コード: CODEB128, 商品名: "CBM0432-128-NAMEB" }],
  ops: [
    入庫10(CODEA128), 承認10(CODEA128), 入庫3(CODEA128, "CBM0432-128-入庫"),
    { op: "在庫変更CSV", code: CODEB128, 区分: "入庫/問屋仕入", 理由: "CBM0432-128-入庫", 増減数: "2", 単価: "100", file: "cbm0432-128-stock.csv", 所属選択: false },
  ],
});

// 145（在庫変更CSV登録の入庫の申請）・146（在庫編集の入庫の申請）。組織と在庫が1つのシード
export const CBX145 = cbx("145");
export const CBX146 = cbx("146");
const UPLOADED = "商品登録CSVファイルをアップロードしました。";
defineStockSeed("S-M04-32-CBCSVINUNAPP-145", {
  org: CBX145.org, store: CBX145.store, withOrg: true, products: [{ 商品コード: CBX145.code, 商品名: CBX145.name }],
  ops: [
    入庫10(CBX145.code), 承認10(CBX145.code),
    { op: "在庫変更CSV", code: CBX145.code, 区分: "入庫/問屋仕入", 理由: "CB0432-145-入庫", 増減数: "3", 単価: "300", file: "cb0432-145.csv", 所属選択: true, 成功の文: UPLOADED },
  ],
});
defineStockSeed("S-M04-32-CBINUNAPP-146", {
  org: CBX146.org, store: CBX146.store, withOrg: true, products: [{ 商品コード: CBX146.code, 商品名: CBX146.name }],
  ops: [入庫10(CBX146.code), 承認10(CBX146.code), 入庫3(CBX146.code, "CB0432-146-入庫")],
});
