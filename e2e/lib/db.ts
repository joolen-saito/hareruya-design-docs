/**
 * DB確認。実行区分が「ブラウザ+DB確認」のケースで、画面からは見えない保存結果を照会するためだけに使う。
 * 接続の仕方は環境で変わる（config/env.ts の DB_MODE。local は手元のコンテナ、ほかは E2E_DB_URL）。
 * 参照（SELECT）しか通さない。テストデータは画面から作る決まりなので、ここからデータを作らない・直さない。
 * 物理名（テーブル・カラム）は SQL の中にだけ書き、呼び出す側には業務の言葉の関数名で見せる。
 */
import { execFileSync } from "node:child_process";
import { DB_CONTAINER, DB_MODE, DB_URL, ENV_NAME } from "../config/env";

export type Row = Record<string, string | null>;

/** 値は $1, $2… で渡す（文字列の連結でSQLを組み立てない） */
export function query(sql: string, params: (string | number)[] = []): Row[] {
  const s = sql.trim().replace(/;\s*$/, "");
  if (!/^(select|with)\b/i.test(s) || /;/.test(s) || /\b(insert|update|delete|truncate|alter|drop|create|grant|copy)\b/i.test(s)) {
    throw new Error("DB確認は参照（SELECT）だけ。データの作成・変更はしない");
  }
  // psql の変数（:'p1'）は引用符つきで安全に展開される
  const bound = s.replace(/\$(\d+)/g, (_, n) => `:'p${n}'`);
  const vars = params.flatMap((p, i) => ["-v", `p${i + 1}=${String(p)}`]);
  if (DB_MODE === "none") throw new Error(`E2E_ENV=${ENV_NAME} はDB確認の接続先が無い（E2E_DB_URL を与える）`);
  const psqlArgs = ["-X", "-q", "-v", "ON_ERROR_STOP=1", ...vars, "-c", "\\pset format csv", "-f", "-"];
  // 文字列の検査は補助。書き込みを止める根拠は、読み取り専用のトランザクションで流すこと（値を変える関数の呼び出しもDBが拒む）
  const input = `begin transaction read only;\nselect row_to_json(t)::text from (${bound}) t;\nrollback;\n`;
  const opt = { input, encoding: "utf-8" as const, maxBuffer: 64 * 1024 * 1024 };
  const out = DB_MODE === "url"
    ? execFileSync("psql", [DB_URL, ...psqlArgs], opt)
    : execFileSync("docker", ["exec", "-i", DB_CONTAINER, "sh", "-c",
      'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -U "$POSTGRES_USER" -d "${POSTGRES_DB:-eccubedb}" "$@"', "psql", ...psqlArgs], opt);
  // csv 形式で1列（JSON文字列）。先頭は列名の行
  const lines = out.split("\n").filter((l) => l.length > 0);
  const body = lines.slice(lines.findIndex((l) => l === "row_to_json") + 1);
  return body.map((l) => {
    const json = l.startsWith('"') ? l.slice(1, -1).replace(/""/g, '"') : l;
    const obj = JSON.parse(json) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === null ? null : String(v)]));
  });
}

export function count(sql: string, params: (string | number)[] = []): number {
  return Number(query(`select count(*) as n from (${sql.trim().replace(/;\s*$/, "")}) c`, params)[0].n);
}

/** この環境でDB確認ができるか。できない環境では「ブラウザ+DB確認」のケースを飛ばす（落とさない） */
export const available = DB_MODE !== "none";
