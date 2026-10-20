/** 部門のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。部門1件・名称・コードでの照会は M03-18 のものを使う */
import { count } from "../lib/db";

export type { 保存された部門 } from "./m03_18_department";
export { 部門, 部門コードの部門, 部門名の部門 } from "./m03_18_department";

/** 部門の総件数 */
export function 部門の総件数(): number {
  return count("select id from mtb_section");
}
