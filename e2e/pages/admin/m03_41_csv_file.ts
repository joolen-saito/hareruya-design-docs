/**
 * M03-41 カテゴリCSV登録のケースがアップロードするCSVファイルの組み立て。
 * 見出しの列（並び順）・見出し行の有無・文字コード（UTF-8 かシフトJIS）・改行（LF か CRLF）を指定して作る。
 * 値の区切りはカンマ、囲みは二重引用符（カンマ・二重引用符・改行を含む値だけを囲む。lib/csv.ts の csvLine）。
 */
import { csvLine } from "../../lib/csv";

export type CaseCsvFile = {
  /** ファイル名（正本の呼び名） */
  name: string;
  bytes: Buffer;
  /** 報告に載せる内容（文字コードを変える前の文字列） */
  内容: string;
  文字コード: "UTF-8" | "シフトJIS";
  改行: "LF" | "CRLF";
};

export type CaseCsvSpec = {
  name: string;
  /** 見出しの列（並び順）。見出し行を書かないときも、データ行の値の並びに使う */
  columns: string[];
  /** 見出し行を書くか（既定は書く） */
  header?: boolean;
  /** データ行。列名→値。書かない列は空 */
  rows: Record<string, string>[];
  文字コード?: "UTF-8" | "シフトJIS";
  改行?: "LF" | "CRLF";
};

export function buildCaseCsv(spec: CaseCsvSpec): CaseCsvFile {
  const known = new Set(spec.columns);
  for (const r of spec.rows) {
    for (const k of Object.keys(r)) if (!known.has(k)) throw new Error(`${spec.name}: 列「${k}」が見出しの列に無い（${spec.columns.join(",")}）`);
  }
  const eol = spec.改行 === "CRLF" ? "\r\n" : "\n";
  const lines = [
    ...(spec.header === false ? [] : [csvLine(spec.columns)]),
    ...spec.rows.map((r) => csvLine(spec.columns.map((c) => r[c] ?? ""))),
  ];
  const text = lines.map((l) => l + eol).join("");
  const 文字コード = spec.文字コード ?? "UTF-8";
  return {
    name: spec.name,
    bytes: 文字コード === "シフトJIS" ? encodeShiftJis(text) : Buffer.from(text, "utf8"),
    内容: text,
    文字コード,
    改行: spec.改行 ?? "LF",
  };
}

/**
 * 文字列をシフトJIS（Windows の拡張を含む）のバイト列にする。
 * 変換表は、実行環境の TextDecoder（shift_jis）で2バイトの組をすべて読んで逆引きを作る（同じ文字が2か所にあれば先の方を使う）。
 * 表に無い文字があれば誤りとして止める（落とさない・置き換えない）。
 */
export function encodeShiftJis(text: string): Buffer {
  const table = shiftJisTable();
  const out: number[] = [];
  for (const ch of text) {
    const b = table.get(ch);
    if (!b) throw new Error(`シフトJISに無い文字: ${JSON.stringify(ch)}`);
    out.push(...b);
  }
  return Buffer.from(out);
}

let sjis: Map<string, number[]> | null = null;
function shiftJisTable(): Map<string, number[]> {
  if (sjis) return sjis;
  const table = new Map<string, number[]>();
  const decoder = new TextDecoder("shift_jis", { fatal: true });
  const put = (bytes: number[]) => {
    let ch: string;
    try { ch = decoder.decode(Uint8Array.from(bytes)); } catch { return; }
    if ([...ch].length === 1 && ch !== "�" && !table.has(ch)) table.set(ch, bytes);
  };
  for (let b = 0x00; b <= 0x7f; b++) put([b]);
  for (let b = 0xa1; b <= 0xdf; b++) put([b]);
  for (let lead = 0x81; lead <= 0xfc; lead++) {
    if (lead >= 0xa0 && lead <= 0xdf) continue;
    for (let trail = 0x40; trail <= 0xfc; trail++) if (trail !== 0x7f) put([lead, trail]);
  }
  sjis = table;
  return table;
}
