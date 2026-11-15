/**
 * M11-03 権限管理のDB確認と、E2E が作った権限への拒否URLの書き足し。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 権限管理の画面で作れる拒否の状態には制約がある（上位の項目にチェックを付けると下位の項目が必ず付く）ので、
 * 「記載の拒否URLだけを持つ」権限は、権限のマスターに画面で足した E2E の権限（名前に実行の印を含む）へ、拒否URLを書き足して作る
 * （シード表も「拒否設定を〜の1件だけにする設定は画面で指定できないためDBへ直接設定する」と定める）。
 * 既存の権限・拒否URLは消さず、書き換えない（依頼者決定 2026-11-14）。
 */
import { query } from "../lib/db";
import { insertOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** 権限の名前から権限のIDを引く。無ければ null */
export function 権限のID(権限名: string): string | null {
  return query(`select id::text as id from mtb_authority where name = $1`, [権限名])[0]?.id ?? null;
}

/** 権限の拒否URL（昇順） */
export function 権限の拒否URL(権限名: string): string[] {
  return query(
    `select r.deny_url from dtb_authority_role r join mtb_authority a on a.id = r.authority_id where a.name = $1 order by r.deny_url`,
    [権限名],
  ).map((r) => String(r.deny_url));
}

/**
 * E2E が作った権限（名前に実行の印を含む）に、拒否URLを足す。足した結果、拒否URLが指定のものだけになることを確かめる。
 * 権限が既に拒否URLを持つときは、指定と同じなら何もせず、違えば止める（書き換えない）。
 */
export function 権限に拒否URLを足す(権限名: string, 拒否URL: string[]): void {
  if (!権限名.includes(RUN_MARK)) throw new Error(`権限「${権限名}」の名前に実行の印 ${RUN_MARK} が無い（E2E が作った権限と分からないので、拒否URLは足さない）`);
  const id = 権限のID(権限名);
  if (!id) throw new Error(`権限「${権限名}」が権限のマスターに無い`);
  const now = 権限の拒否URL(権限名);
  const want = [...拒否URL].sort();
  if (now.length > 0) {
    if (JSON.stringify(now) !== JSON.stringify(want)) throw new Error(`権限「${権限名}」は、すでに別の拒否URLを持っている（${now.join("、")}）。書き換えない`);
    return;
  }
  const ts = new Date().toISOString();
  insertOwnRows(`権限「${権限名}」の拒否URL（${拒否URL.join("、")}）`, {
    table: "dtb_authority_role",
    parentColumn: "authority_id",
    rows: 拒否URL.map((u) => ({ authority_id: id, creator_id: null, deny_url: u, create_date: ts, update_date: ts, is_modifiable: true })),
    owner: { sql: `select id from mtb_authority where name = $1 and name like $2`, params: [権限名, `%${RUN_MARK}%`] },
  });
  const after = 権限の拒否URL(権限名);
  if (JSON.stringify(after) !== JSON.stringify(want)) throw new Error(`権限「${権限名}」の拒否URLを足したが、${after.join("、")} になっている`);
}
