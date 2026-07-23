/**
 * PostgreSQL 照会ヘルパ（M0 D8 相当・pilot 実装）。
 *
 * 稼働環境の PostgreSQL primary へ `docker exec ... psql` 経由で問い合わせる。
 * 新規依存（pg ドライバ）は入れず docker exec 方式（PILOT見本 §成果物1 の指定）。
 *
 * 接続情報は環境変数で上書き可能（既定は稼働環境の実測値）:
 *  - E2E_DB_CONTAINER  (既定 ec-cube-enterprise-postgres_primary-1)
 *  - E2E_DB_USER       (既定 dbuser)
 *  - E2E_DB_NAME       (既定 eccubedb)
 *  - E2E_DB_PASSWORD   (既定 secret)
 *
 * 用途は「保存後の実DB値の検証」と「作成行の後始末(cleanup)」。
 * 期待値の正は L1 オラクル（fixtures/oracle）であり、DB照会結果は SUT の実挙動側（観測値）。
 */
import { execFileSync } from "node:child_process";

const CONTAINER = process.env.E2E_DB_CONTAINER || "ec-cube-enterprise-postgres_primary-1";
const DB_USER = process.env.E2E_DB_USER || "dbuser";
const DB_NAME = process.env.E2E_DB_NAME || "eccubedb";
const DB_PASSWORD = process.env.E2E_DB_PASSWORD || "secret";

/** psql を -tAc（tuples only / unaligned / 単一コマンド）で実行し生の stdout を返す。 */
function runPsql(sql: string): string {
  const out = execFileSync(
    "docker",
    [
      "exec",
      "-e",
      `PGPASSWORD=${DB_PASSWORD}`,
      CONTAINER,
      "psql",
      "-U",
      DB_USER,
      "-d",
      DB_NAME,
      "-tAc",
      sql,
    ],
    { encoding: "utf8" }
  );
  return out;
}

/**
 * 単一スカラを取得する。行が無ければ null。
 * 複数行/複数列が返る SQL には使わない（最初のトークンのみを返す）。
 */
export function queryScalar(sql: string): string | null {
  const raw = runPsql(sql).replace(/\r/g, "");
  const lines = raw.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  return lines[0];
}

/** 数値スカラ（COUNT・char_length 等）を number で取得する。行が無ければ null。 */
export function queryNumber(sql: string): number | null {
  const v = queryScalar(sql);
  if (v === null || v === "") return null;
  return Number(v);
}

/**
 * 複数行を取得する（列は "|" 区切り＝psql -A 既定の field separator）。
 * 各行は string[]（列値の配列）。空結果は []。
 */
export function queryRows(sql: string): string[][] {
  const raw = runPsql(sql).replace(/\r/g, "");
  return raw
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => l.split("|"));
}

/** SQL 文字列リテラル用に単一引用符をエスケープする（PostgreSQL 標準）。 */
export function sqlLiteral(s: string): string {
  return "'" + s.replace(/'/g, "''") + "'";
}

// ---- dtb_news 専用の便宜関数（pilot が使う照会だけを提供） ----

/** 指定 id の title の文字長（char_length）。行が無ければ null。 */
export function newsTitleCharLength(id: number): number | null {
  return queryNumber(`SELECT char_length(title) FROM dtb_news WHERE id = ${id}`);
}

/** 指定 id の description の文字長（char_length）。行が無ければ null。 */
export function newsDescriptionCharLength(id: number): number | null {
  return queryNumber(`SELECT char_length(description) FROM dtb_news WHERE id = ${id}`);
}

/** 指定 id の link_method（boolean）。行が無ければ null。 */
export function newsLinkMethod(id: number): boolean | null {
  const v = queryScalar(`SELECT link_method FROM dtb_news WHERE id = ${id}`);
  if (v === null) return null;
  return v === "t";
}

/** 指定 id の行が存在するか。 */
export function newsExists(id: number): boolean {
  return (queryNumber(`SELECT count(*) FROM dtb_news WHERE id = ${id}`) ?? 0) > 0;
}

/** title 前方一致（prefix）の行数（run-id prefix でのDB未到達確認・残骸検出）。 */
export function newsCountByTitlePrefix(prefix: string): number {
  return (
    queryNumber(`SELECT count(*) FROM dtb_news WHERE title LIKE ${sqlLiteral(prefix + "%")}`) ?? 0
  );
}

/** title 前方一致（prefix）の行の id 一覧。 */
export function newsIdsByTitlePrefix(prefix: string): number[] {
  return queryRows(`SELECT id FROM dtb_news WHERE title LIKE ${sqlLiteral(prefix + "%")}`).map((r) =>
    Number(r[0])
  );
}

/** 指定 id の行を削除する（cleanup 用・単一 id）。 */
export function deleteNewsById(id: number): void {
  runPsql(`DELETE FROM dtb_news WHERE id = ${id}`);
}

/** title 前方一致（prefix）の行を削除する（cleanup 安全網）。削除件数を返す。 */
export function deleteNewsByTitlePrefix(prefix: string): number {
  const before = newsCountByTitlePrefix(prefix);
  if (before > 0) {
    runPsql(`DELETE FROM dtb_news WHERE title LIKE ${sqlLiteral(prefix + "%")}`);
  }
  return before;
}

/** DBサーバ時計の現在時刻（ブラケット判定用）。ISO 風文字列。 */
export function dbNow(): string | null {
  return queryScalar("SELECT now()");
}
