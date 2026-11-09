/** F06-14 マイイベント・デッキ登録 のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 申込状態の名称（無ければ null） */
export function 申込状態の名称(id: number): string | null {
  return query(`select name from mtb_entry_status where id = $1::int`, [id])[0]?.name ?? null;
}

/** フォーマットの名称（日本語名）と略称コード（無ければ null） */
export function フォーマットの名称と略称(id: number): { 名称: string; 略称: string } | null {
  const r = query(`select name_jp, code from mtb_format where id = $1::int and deleted_at is null`, [id])[0];
  return r ? { 名称: r.name_jp ?? "", 略称: r.code ?? "" } : null;
}

/** 一覧の表示件数の選択肢に、その件数があるか */
export function 表示件数がある(件数: number): boolean {
  return Number(query(`select count(*) as n from mtb_page_max where id = $1::int`, [件数])[0].n) > 0;
}
