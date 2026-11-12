/**
 * 商品を消す前の持ち主の確かめ（共有の開発環境だけ）。
 *
 * 開発環境には、手動テストの準備として、シード表と同じ商品コード・商品名の商品を人が登録していることがある
 * （2026-11-12 に REC-M04-16-* の9商品がほかの方のアカウントで登録されていた）。E2E が前の実行の残りを
 * 決め打ちの商品コード・商品名で探して消すと、人の商品まで消してしまう。そこで、消す前に作った管理者を DB で読み、
 * E2E の管理者（E2E が作ったメンバー＝メールアドレスが @example.test、または E2E の準備用の管理者）が作った商品だけを消してよいとする。
 * 当たらない商品が1つでもあれば、何も消さずに止める（そのケースは判断待ち）。
 */
import { available, query } from "../lib/db";
import { SETUP_ADMIN, SHARED_ENV } from "../config/env";

export function E2Eが作った商品か確かめる(商品ID: string[], what: string): void {
  if (!SHARED_ENV || 商品ID.length === 0) return;
  if (!available) throw new Error(`${what}: 共有の環境で商品を消す前に、作った人を DB で確かめられない（DB の接続が無い）。消さずに止める`);
  const rows = query(
    `select p.id::text as pid, coalesce(m.login_id, '') as login, coalesce(m.email, '') as email
       from dtb_product p left join dtb_member m on m.id = p.creator_id
      where p.id = any(string_to_array($1, ',')::int[])`,
    [商品ID.join(",")],
  );
  const 人の商品 = rows.filter((r) => !(String(r.email).endsWith("@example.test") || r.login === SETUP_ADMIN.loginId));
  if (人の商品.length > 0) {
    throw new Error(`${what}: E2E の管理者が作っていない商品があるので消さない（商品ID ${人の商品.map((r) => r.pid).join("・")}。ほかの方が手動テストなどで登録した見込み）。決め打ちの値に実行の印を付けるか、判断待ちにする`);
  }
}
