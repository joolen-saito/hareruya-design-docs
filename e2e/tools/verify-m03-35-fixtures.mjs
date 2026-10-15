import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M03-35 のうち、全列・全データ・UTF-8 相当の符号化が明示された 3 件だけを照合する。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'integration_test/casegen/cases/M03-35_seed_data.tsv');
const targetDir = path.join(root, 'e2e/fixtures/m03-35');

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
const fixtures = new Map();
for (const [index, line] of lines.entries()) {
  const fields = parseTsvLine(line);
  if (fields.length !== header.length) throw new Error(`${source}:${index + 2}: 列数不一致`);
  const row = Object.fromEntries(header.map((name, column) => [name, fields[column]]));
  if (row['シードID'] === 'S-M03-35-GF-CASE-048') {
    const match = row['状態・属性'].match(/m0335-048-a\.csvの中身はUnicodeの8ビット符号化形式のテキスト、見出し=([^、]+)、データ=([^／]+)/);
    if (!match || !row['投入方法'].includes('m0335-048-a.csv')) throw new Error(`${source}:${index + 2}: 048 の全列指定を復元できない`);
    const [, heading, data] = match;
    if (heading !== '商品コード,部門コード(ID)' || data !== 'M0335-048-A,32') throw new Error(`${source}:${index + 2}: 048 の値が異なる`);
    fixtures.set('m0335-048-a.csv', Buffer.from(`${heading}\n${data}\n`, 'utf8'));
    continue;
  }
  if (!/^S-M03-35-L-CSV-04[56]$/.test(row['シードID'])) continue;
  const match = row['状態・属性'].match(/^ファイル名=(m0335l_assign-00[12]\.csv)／見出し=([^／]+)／データ1行=([^／]+)／区切り=カンマ／UTF-8／/);
  if (!match || !row['投入方法'].includes(match[1])) throw new Error(`${source}:${index + 2}: 全列指定を復元できない`);
  const [, name, heading, data] = match;
  if (heading !== '商品コード,部門コード(ID)' || heading.split(',').length !== data.split(',').length) {
    throw new Error(`${source}:${index + 2}: 見出しまたは列数が不正`);
  }
  fixtures.set(name, Buffer.from(`${heading}\n${data}\n`, 'utf8'));
}
if (fixtures.size !== 3) throw new Error(`対象件数が ${fixtures.size} 件で、期待 3 件と異なる`);
for (const [name, bytes] of fixtures) {
  const target = path.join(targetDir, name);
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) throw new Error(`${target} が正本と一致しない`);
}
console.log(`M03-35: 全列・全行を正本から確定できる CSV ${fixtures.size} 件を照合`);
