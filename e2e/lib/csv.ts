/** 画面からダウンロードした CSV の読み取りと、アップロードする CSV の組み立て（RFC 4180 形式）。 */

/** バイト列を文字列にする。UTF-8 で読めなければ、管理画面の既定の Shift_JIS として読む。先頭の BOM は除く */
export function decodeCsvBytes(bytes: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("shift_jis").decode(bytes);
  }
}

/** 引用符・引用符の中の改行・"" のエスケープを扱って、行と列に分ける。末尾の空行は除く */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell); cell = "";
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else {
      cell += ch;
    }
  }
  if (quoted) throw new Error("CSV の引用符が閉じていない");
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** 見出し行を列名にして、各行を「列名→値」にする */
export function csvRecords(text: string): Record<string, string>[] {
  const [headers, ...body] = parseCsv(text);
  if (!headers) return [];
  return body.map((cells) => Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""])));
}

export function csvLine(values: string[]): string {
  return values.map((value) => /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value).join(",");
}
