/**
 * ケースの正本（integration_test/casegen/）を読む。
 * テストコードはケースの中身を写さず、テストIDで正本を引く。正本に無いIDのテストは作れない。
 */
import fs from "node:fs";
import path from "node:path";
import { CASEGEN_DIR } from "../config/env";

export type CaseRow = {
  テストID: string; 要求ID: string; 連鎖ID: string; 観点ID: string; 優先度: string; 実行区分: string;
  使用シード: string; 事前準備: string; 手順: string; 期待結果: string; 出典: string;
};
export type SeedRow = {
  シードID: string; 区分: string; 論理名: string; "状態・属性": string; 用途: string; 投入方法: string; 共有: string;
};

const CASE_HEAD = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"];
const SEED_HEAD = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"];

/** TSV の引用セルを復元する（セル内の二重引用符は "" として保存される）。 */
function parseTsvLine(line: string): string[] {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  let closed = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { value += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else value += ch;
    } else if (ch === "\t") {
      cells.push(value);
      value = "";
      closed = false;
    } else if (ch === '"' && value === "" && !closed) {
      quoted = true;
    } else if (closed) {
      throw new Error("引用セルの閉じ引用符の後に文字がある");
    } else {
      value += ch;
    }
  }
  if (quoted) throw new Error("引用セルが閉じられていない");
  cells.push(value);
  return cells;
}

/** 見出し・列数・IDの形と重複を確かめて読む。崩れた正本を黙って読み進めない */
function readTsv<T>(file: string, head: string[], idPattern: RegExp): Map<string, T> {
  const lines = fs.readFileSync(file, "utf-8").split(/\r?\n/).filter((l) => l.length > 0);
  const name = path.basename(file);
  if (lines[0] !== head.join("\t")) throw new Error(`${name}: 見出しが想定と違う（${lines[0]}）`);
  const out = new Map<string, T>();
  lines.slice(1).forEach((l, i) => {
    let cells: string[];
    try { cells = parseTsvLine(l); }
    catch (e) { throw new Error(`${name} ${i + 2}行目: ${(e as Error).message}`); }
    if (cells.length !== head.length) throw new Error(`${name} ${i + 2}行目: 列数が ${cells.length}（${head.length} のはず）`);
    if (!idPattern.test(cells[0])) throw new Error(`${name} ${i + 2}行目: IDの形が違う（${cells[0]}）`);
    if (out.has(cells[0])) throw new Error(`${name}: ${cells[0]} が重複している`);
    out.set(cells[0], Object.fromEntries(head.map((h, j) => [h, cells[j]])) as T);
  });
  return out;
}

export function functionIdOf(id: string): string {
  const m = /^(?:IT|S)-([A-Z]\d\d-\d\d)-/.exec(id);
  if (!m) throw new Error(`機能IDを読み取れない: ${id}`);
  return m[1];
}

const caseCache = new Map<string, Map<string, CaseRow>>();
const seedCache = new Map<string, Map<string, SeedRow>>();

export function casesOf(fid: string): Map<string, CaseRow> {
  if (!caseCache.has(fid)) {
    caseCache.set(fid, readTsv<CaseRow>(path.join(CASEGEN_DIR, "cases", `${fid}_test_cases.tsv`), CASE_HEAD, /^IT-[A-Z]\d\d-\d\d-\d{3,}$/));
  }
  return caseCache.get(fid)!;
}

export function seedsOf(fid: string): Map<string, SeedRow> {
  if (!seedCache.has(fid)) {
    seedCache.set(fid, readTsv<SeedRow>(path.join(CASEGEN_DIR, "cases", `${fid}_seed_data.tsv`), SEED_HEAD, /^S-[A-Z]\d\d-\d\d-\S+$/));
  }
  return seedCache.get(fid)!;
}

export function getCase(testId: string): CaseRow {
  const c = casesOf(functionIdOf(testId)).get(testId);
  if (!c) throw new Error(`${testId} はケースの正本（cases/）に無い。除外されたケースか、IDの誤り`);
  return c;
}

export function getSeed(seedId: string): SeedRow {
  const s = seedsOf(functionIdOf(seedId)).get(seedId);
  if (!s) throw new Error(`${seedId} はシード表に無い`);
  return s;
}

export function seedIdsOf(c: CaseRow): string[] {
  return c.使用シード.split(/[,、]/).map((s) => s.trim()).filter((s) => s && s !== "—");
}

/** 「1. …／2. …」の番号付き境界だけで分ける。画面名やURLに含まれる「／」は手順の一部。 */
export function stepsOf(c: CaseRow): string[] {
  return c.手順.split(/／(?=\d+\.\s)/).map((s) => s.trim()).filter(Boolean);
}
