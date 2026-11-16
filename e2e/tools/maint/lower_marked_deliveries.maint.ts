/**
 * 保守用（ケースではない）。2026-11-16 依頼者指示「並び順を下げて」。
 *
 * 開発環境に、F10-02・M10-06 の E2E が作った実行の印つきの配送方法（名前の末尾が「-MW」＋6文字）が59件あり、並び順（sort_no）が
 * もとからある配送方法（18件・1〜18）より上（19〜77）に来ていた。フロントの注文手続きは、並び順の上の配送方法を最初に選ぶので、
 * 人が注文手続きを開くと試験用の配送方法（支払方法は銀行振込だけ）が選ばれていた。
 *
 * 印つきの配送方法だけ、並び順を「いまの値 − 100」にして、もとからある配送方法より下に移す（印つきどうしの上下は変えない。
 * M10-06 の並べ替えのケースは、同じ回に作った2行の上下だけを見るので変わらない）。もとからある配送方法の行には触らない。
 * 書き込みは lib/db_write.ts の updateOwnRows（持ち主の確かめ: 名前が印つき かつ 作った管理者が E2E の準備用の管理者か E2E のメンバー）。
 *
 * 流し方: E2E_MAINT_APPLY=1 で書く（無ければ、書く予定だけを表示する）。
 */
import { test } from "@playwright/test";
import { query } from "../../lib/db";
import { updateOwnRows } from "../../lib/db_write";
import { SETUP_ADMIN } from "../../config/env";

const MARK = "-MW[A-Z0-9]{6}$";
const owner = {
  sql: `select d.id from dtb_delivery d join dtb_member m on m.id = d.creator_id
         where d.name ~ $1 and (m.login_id = $2 or m.email like '%@example.test')`,
  params: [MARK, SETUP_ADMIN.loginId],
};

test("実行の印つきの配送方法の並び順を、もとからある配送方法より下に移す", async () => {
  const rows = query(
    `select d.id::text as id, d.name, d.sort_no::text as sort_no from dtb_delivery d join dtb_member m on m.id = d.creator_id
      where d.name ~ $1 and (m.login_id = $2 or m.email like '%@example.test') and d.sort_no > 0 order by d.sort_no`,
    [MARK, SETUP_ADMIN.loginId],
  );
  const 元の最大 = Number(query(`select coalesce(max(sort_no), 0)::text as m from dtb_delivery where name !~ $1`, [MARK])[0].m);
  console.log(`印つきの配送方法 ${rows.length} 件（並び順 ${rows[0]?.sort_no ?? "-"}〜${rows[rows.length - 1]?.sort_no ?? "-"}）。もとからある配送方法の並び順の最大 ${元の最大}`);
  if (process.env.E2E_MAINT_APPLY !== "1") {
    for (const r of rows) console.log(`予定: ${r.id} ${r.name} ${r.sort_no} → ${Number(r.sort_no) - 100}`);
    return;
  }
  for (const r of rows) {
    updateOwnRows(`保守: 印つきの配送方法 ${r.name} の並び順を下げる（2026-11-16 依頼者指示）`, {
      table: "dtb_delivery", key: "id", ids: [r.id], set: { sort_no: Number(r.sort_no) - 100 }, owner,
    });
  }
  const 上 = query(`select name, sort_no::text as s from dtb_delivery where visible and sale_type_id = 1 order by sort_no desc limit 3`);
  console.log(`書いたあとの並び順の上3件: ${上.map((x) => `${x.name}(${x.s})`).join(" / ")}`);
});
