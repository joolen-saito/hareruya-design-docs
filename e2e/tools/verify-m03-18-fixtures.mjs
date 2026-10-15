import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M03-18 の大量行 CSV のうち、見出しと全行の値がシードにある 050〜052 を照合する。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'integration_test/casegen/cases/M03-18_seed_data.tsv');
const targetDir = path.join(root, 'e2e/fixtures/m03-18');
const write = process.argv.includes('--write');
const targetIds = new Set(['050', '051', '052']);

function parseTsvLine(line) {
  const cells = [];
  let value = '';
  let quoted = false;
  let closed = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { value += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else value += ch;
    } else if (ch === '\t') {
      cells.push(value);
      value = '';
      closed = false;
    } else if (ch === '"' && value === '' && !closed) {
      quoted = true;
    } else {
      if (closed) throw new Error('引用セルの閉じ引用符の後に文字がある');
      value += ch;
    }
  }
  if (quoted) throw new Error('引用セルが閉じられていない');
  cells.push(value);
  return cells;
}

const lines = fs.readFileSync(source, 'utf8').split(/\r?\n/).filter(Boolean);
const header = lines.shift().split('\t');
const expected = new Map();
for (const [index, line] of lines.entries()) {
  const fields = parseTsvLine(line);
  if (fields.length !== header.length) throw new Error(`${source}:${index + 2}: 列数不一致`);
  const row = Object.fromEntries(header.map((name, column) => [name, fields[column]]));
  const id = row['シードID'].match(/^S-M03-18-CSV-(05[012])$/)?.[1];
  if (!id) continue;
  const spec = row['状態・属性'];
  const match = spec.match(/^M0318-(\d{3})-rows\.csv=見出し行1行＋データ([\d,]+)行（全([\d,]+)行）。見出し行はID・部門名・部門コード・免税区分・MTGBuyer表示フラグ、ID列は空、部門名は「CSV行数部門M0318-(\d{3})-0001」から連番、部門コードはM0318-(\d{3})-0001からM0318-(\d{3})-(\d{4})まで連番、免税区分0、MTGBuyer表示フラグ1、UTF-8・カンマ区切り/);
  if (!match || [match[1], match[4], match[5], match[6]].some((value) => value !== id)) {
    throw new Error(`${source}:${index + 2}: ${id} の全列指定を復元できない`);
  }
  const count = Number(match[2].replaceAll(',', ''));
  const total = Number(match[3].replaceAll(',', ''));
  const last = Number(match[7]);
  if (count !== last || total !== count + 1 || count > 10000 || !row['投入方法'].includes(`M0318-${id}-rows.csv`)) {
    throw new Error(`${source}:${index + 2}: ${id} の行数・投入方法が一致しない`);
  }
  const rows = ['ID,部門名,部門コード,免税区分,MTGBuyer表示フラグ'];
  for (let number = 1; number <= count; number++) {
    const suffix = String(number).padStart(4, '0');
    rows.push(`,CSV行数部門M0318-${id}-${suffix},M0318-${id}-${suffix},0,1`);
  }
  expected.set(`M0318-${id}-rows.csv`, Buffer.from(`${rows.join('\n')}\n`, 'utf8'));
}

if (expected.size !== targetIds.size) throw new Error(`対象件数が ${expected.size} 件で、期待 3 件と異なる`);
if (write) fs.mkdirSync(targetDir, { recursive: true });
for (const [name, bytes] of expected) {
  const target = path.join(targetDir, name);
  if (write && !fs.existsSync(target)) fs.writeFileSync(target, bytes);
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) throw new Error(`${target} が正本と一致しない`);
}
console.log(`M03-18: 大量行 CSV ${expected.size} 件を正本と照合${write ? '・不足分を作成' : ''}`);
