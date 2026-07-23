/**
 * L1 オラクル簡易解決器（M0 D8 相当・pilot 実装）＋ 決定的境界値生成 runFill。
 *
 * 期待値の正は fixtures/oracle/*.json（＝L1原子オラクル表の転記）。
 * spec 本体に期待値リテラルを直書きしない。spec は o("L1-M0901-011") 経由で期待値を得る。
 *
 * PILOT_m09_01_news_executable_grade.md §6（page/spec骨子）・§2.1（作成行の隔離・生成式）に準拠。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

type OracleEntry = Record<string, unknown>;

const cache = new Map<string, Record<string, OracleEntry>>();

function loadFile(fileKey: string): Record<string, OracleEntry> {
  // 隔離ガード（CONCRETIZATION_FIRST_PLAN §_drafts隔離）: 正式解決器は草案(_drafts/)・
  // パス区切り・親参照を一切解決しない。候補オラクルを正式消費経路へ混入させないための機械強制。
  if (/(^|[\/\\])_drafts([\/\\]|$)|[\/\\]|\.\./.test(fileKey)) {
    throw new Error(`oracle: illegal fileKey "${fileKey}" (drafts/path traversal are not resolvable by the official resolver)`);
  }
  if (cache.has(fileKey)) return cache.get(fileKey)!;
  const path = join(__dirname, "..", "fixtures", "oracle", `${fileKey}.json`);
  const data = JSON.parse(readFileSync(path, "utf8")) as Record<string, OracleEntry>;
  cache.set(fileKey, data);
  return data;
}

/** {limit} などのプレースホルダを実値へ差し替える。 */
function fillTemplate(tpl: string, params: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_m, k) => {
    if (params[k] === undefined) throw new Error(`oracle template param missing: ${k}`);
    return String(params[k]);
  });
}

export interface ResolvedOracle {
  raw: OracleEntry;
  /** 数値/配列/真偽などの生フィールドを取得する。 */
  get<T = unknown>(field: string): T;
  /** ja 期待文字列（expected_ja または expected_ja_template をパラメータ解決）。 */
  ja(params?: Record<string, string | number>): string;
  /** en 期待文字列（expected_en または expected_en_template をパラメータ解決）。 */
  en(params?: Record<string, string | number>): string;
  /** ja 期待配列（見出し等）。 */
  jaList(): string[];
  /** en 期待配列（見出し等）。 */
  enList(): string[];
}

/**
 * オラクルIDを解決する。既定ファイルは m09_01_oracle。
 * 別ファイルは o(id, "ファイルキー")。
 */
export function o(id: string, fileKey = "m09_01_oracle"): ResolvedOracle {
  const data = loadFile(fileKey);
  const entry = data[id];
  if (!entry) throw new Error(`oracle id not found: ${id} in ${fileKey}`);
  return {
    raw: entry,
    get<T = unknown>(field: string): T {
      if (!(field in entry)) throw new Error(`oracle ${id} has no field: ${field}`);
      return entry[field] as T;
    },
    ja(params = {}) {
      if (typeof entry.expected_ja === "string") return entry.expected_ja;
      if (typeof entry.expected_ja_template === "string")
        return fillTemplate(entry.expected_ja_template, params);
      throw new Error(`oracle ${id} has no expected_ja(_template)`);
    },
    en(params = {}) {
      if (typeof entry.expected_en === "string") return entry.expected_en;
      if (typeof entry.expected_en_template === "string")
        return fillTemplate(entry.expected_en_template, params);
      throw new Error(`oracle ${id} has no expected_en(_template)`);
    },
    jaList() {
      if (Array.isArray(entry.expected_ja)) return entry.expected_ja as string[];
      throw new Error(`oracle ${id} expected_ja is not a list`);
    },
    enList() {
      if (Array.isArray(entry.expected_en)) return entry.expected_en as string[];
      throw new Error(`oracle ${id} expected_en is not a list`);
    },
  };
}

// ---- 決定的境界値生成（PILOT §2.1） ----

export type Repertoire = "ascii" | "mixed";

/** repertoire に従い k 文字ちょうどを生成する（NFC・純データ部）。 */
function charFill(k: number, repertoire: Repertoire): string {
  if (k <= 0) return "";
  if (repertoire === "ascii") {
    return "a".repeat(k);
  }
  // mixed: マルチバイト混在（「あ」= 3byte と ASCII "A" を交互）。
  // char_length は k のまま、UTF-8 byte 長は k を超える（文字長意味論の実証用）。
  let s = "";
  for (let i = 0; i < k; i++) s += i % 2 === 0 ? "あ" : "A";
  return s;
}

/**
 * runFill(n, repertoire, prefix) = prefix + charFill(n - len(prefix), repertoire)。
 * 合計ちょうど n 文字（コードポイント数）。境界の文字数を汚さず一意性を確保する。
 * n < prefix長 の場合はエラー（境界より短い prefix を渡すこと）。
 */
export function runFill(n: number, repertoire: Repertoire, prefix: string): string {
  const prefixLen = [...prefix].length;
  if (n < prefixLen) {
    throw new Error(`runFill: n(${n}) < prefix length(${prefixLen})`);
  }
  return prefix + charFill(n - prefixLen, repertoire);
}

/** 実行ごとの一意な run-id（冪等性の安全網 prefix に使う）。 */
export function makeRunId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${t}${r}`;
}
