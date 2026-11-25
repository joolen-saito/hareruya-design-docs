/** M08-10 身分証画像（本人の顔写真・身分証明書の表裏斜め）の記録の読み書き。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

/** 会員（実行の印つき）に紐付く選手情報へ、画像種別（2=表・3=裏・4=斜め）の身分証画像の記録を足す。保管先の鍵は鍵の前半＋種別名＋「.png」 */
export function 身分証画像の記録を足す(会員ID: string, 鍵の前半: string, 種別: { 種別ID: number; 名: string }[]): void {
  for (const k of 種別) {
    writeTestData({
      理由: `M08-10: 会員ID ${会員ID} の選手情報に身分証画像の記録（種別${k.種別ID}）を足す（画面で作れない。E2E が作った会員の選手情報だけ）`,
      sql: `insert into dtb_identification_image (identification_image_type_id, player_id, identification_id, url, create_date)
            select $2::int, p.id, (select min(i.id) from mtb_identification i where i.visible), $3, now() from dtb_player p where p.customer_id = $1::int`,
      params: [会員ID, k.種別ID, `${鍵の前半}-${k.名}.png`],
      対象の確かめ: `select p.id, c.email as メール from dtb_player p join dtb_customer c on c.id = p.customer_id where c.id = $1::int`,
      確かめのparams: [会員ID], 印: RUN_MARK, 最大行数: 1,
    });
  }
}

/** 会員に紐付く身分証画像の記録（画像種別の番号の順）。種別の番号・保管先の鍵 */
export function 身分証画像の種別と鍵(会員ID: string): { 種別ID: string; 鍵: string }[] {
  return query(
    `select g.identification_image_type_id::text as t, g.url from dtb_identification_image g join dtb_player p on p.id = g.player_id where p.customer_id = $1::int order by g.identification_image_type_id, g.id`,
    [会員ID],
  ).map((r) => ({ 種別ID: String(r.t), 鍵: String(r.url) }));
}
