import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M03-32 のうち、正本に見出し・明細と符号化・区切りが揃う CSV/TSV だけを扱う。
// --write は不足ファイルの機械的な作成用。既存ファイルは上書きしない。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'integration_test/casegen/cases/M03-32_seed_data.tsv');
const targetDir = path.join(root, 'e2e/fixtures/m03-32');
const write = process.argv.includes('--write');

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
    } else if (closed) {
      throw new Error('引用セルの閉じ引用符の後に文字がある');
    } else {
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
  const method = row['投入方法'];
  if (!method.includes('文字コード・区切りの指定が無いものはUTF-8・カンマ区切り')) continue;
  for (const match of row['状態・属性'].matchAll(/(?:^|／)([A-Za-z0-9._-]+\.csv)=見出し「([^」]+)」・データ「([^」]+)」/g)) {
    const [description, name, heading, data] = match;
    const sourceLocation = `M03-32_seed_data.tsv:${index + 2} (${row['シードID']})`;
    if (!method.includes(description.slice(description.startsWith('／') ? 1 : 0))) {
      throw new Error(`${sourceLocation}: 投入方法との記述不一致: ${name}`);
    }
    if (/[〔〕\r\n]/.test(`${heading}${data}`)) throw new Error(`${sourceLocation}: 実行時値か改行を含む: ${name}`);
    if (heading.split(',').length !== data.split(',').length) throw new Error(`${sourceLocation}: 列数不一致: ${name}`);
    const bytes = Buffer.from(`${heading}\n${data}\n`, 'utf8');
    const previous = fixtures.get(name);
    if (previous && !previous.bytes.equals(bytes)) throw new Error(`${sourceLocation}: 同名ファイルの内容が異なる: ${name}`);
    fixtures.set(name, { bytes, sourceLocation });
  }
  for (const match of row['状態・属性'].matchAll(/(?:^|／)([A-Za-z0-9._-]+\.tsv)=タブ区切りで見出し「([^」]+)」、データ「([^」]+)」/g)) {
    const [description, name, heading, data] = match;
    const sourceLocation = `M03-32_seed_data.tsv:${index + 2} (${row['シードID']})`;
    if (!method.includes(description.slice(description.startsWith('／') ? 1 : 0))) {
      throw new Error(`${sourceLocation}: 投入方法との記述不一致: ${name}`);
    }
    if (/[〔〕\r\n]/.test(`${heading}${data}`) || heading.split('・').length !== 2 || data.split('・').length !== 2) {
      throw new Error(`${sourceLocation}: タブ列の内容が未確定: ${name}`);
    }
    const bytes = Buffer.from(`${heading.replace('・', '\t')}\n${data.replace('・', '\t')}\n`, 'utf8');
    const previous = fixtures.get(name);
    if (previous && !previous.bytes.equals(bytes)) throw new Error(`${sourceLocation}: 同名ファイルの内容が異なる: ${name}`);
    fixtures.set(name, { bytes, sourceLocation });
  }
}

if (fixtures.size === 0) throw new Error('対象 CSV が見つからない');
if (write) fs.mkdirSync(targetDir, { recursive: true });
for (const [name, { bytes, sourceLocation }] of fixtures) {
  const target = path.join(targetDir, name);
  if (write && !fs.existsSync(target)) fs.writeFileSync(target, bytes);
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) {
    throw new Error(`${sourceLocation}: ${target} が正本記述と一致しない`);
  }
}
console.log(`M03-32: 正本に内容と符号化・区切りが揃う CSV/TSV ${fixtures.size} 件を照合${write ? '・不足分を作成' : ''}`);
