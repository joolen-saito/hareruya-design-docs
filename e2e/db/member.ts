/** メンバー（管理者）のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** ログインIDから管理者IDを引く。無ければ null */
export function 管理者ID(ログインID: string): string | null {
  return query(`select id from dtb_member where login_id = $1`, [ログインID])[0]?.id ?? null;
}

/** 名前が一致するメンバーの管理者ID（昇順）。メンバーの表には削除の印が無く、一覧に出るメンバーと同じ */
export function 名前のメンバーID(名前: string): string[] {
  return query(`select id::text as id from dtb_member where name = $1 order by id`, [名前]).map((r) => r.id ?? "");
}

/** 名前のメンバーの部署（所属）の名前。いなければ空（在庫編集の承認通知先の部署の選択肢は、部署の名前が値） */
export function メンバーの部署名(名前: string): string {
  return query(`select coalesce(d.name, '') as d from dtb_member m left join mtb_department d on d.id = m.department_id where m.name = $1 order by m.id limit 1`, [名前])[0]?.d ?? "";
}
