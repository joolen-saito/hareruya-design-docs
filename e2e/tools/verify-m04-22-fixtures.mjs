import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M04-22: UTF-8、見出し、全明細がシードの投入方法に揃う 25 CSV と 1 TXT。
// CSV の改行種別は未指定のため LF・末尾改行 1 個を採用する。
// TXT の「ファイル内容=x」は正本の文字そのまま（改行なし）。--write は不足分のみ作成。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'integration_test/casegen/cases/M04-22_seed_data.tsv');
const targetDir = path.join(root, 'e2e/fixtures/m04-22');
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
  const method = row['投入方法'];
  const match = method.match(/UTF-8のCSVファイル「([A-Za-z0-9._-]+\.csv)」（ヘッダー「([^」]+)」、([^）]+)）/);
  const headerOnly = method.match(/UTF-8のCSVファイル「([A-Za-z0-9._-]+\.csv)」（ヘッダー「([^」]+)」のみ、データ行なし）/);
  if (!match && !headerOnly && method.includes('UTF-8のCSVファイル')) throw new Error(`${source}:${index + 2}: CSV の指定を復元できない`);
  if (!match && !headerOnly) continue;
  const [, name, heading, description] = match ?? [headerOnly[0], headerOnly[1], headerOnly[2], 'のみ、データ行なし'];
  if (!row['状態・属性'].includes(name)) throw new Error(`${source}:${index + 2}: 属性に ${name} が無い`);
  let data = [];
  const single = description.match(/^データ行「([^」]+)」$/);
  const double = description.match(/^データ行「([^」]+)」と「([^」]+)」$/);
  if (single) data = [single[1]];
  else if (double) data = [double[1], double[2]];
  else if (description === 'のみ、データ行なし') data = [];
  else if (description === 'データ行は商品コードが空で移動点数1の行と、商品コードMOVE-001-012で移動点数が空の行の2行' && name === 'move-required-missing-012.csv') {
    data = [',1', 'MOVE-001-012,'];
  } else throw new Error(`${source}:${index + 2}: 明細を復元できない: ${name}`);

  if (name === 'move-code255-013.csv' && data[0] === '同じ255文字の商品コード,1' &&
      row['状態・属性'].includes('商品コード=文字Aを255文字連結した値')) data[0] = `${'A'.repeat(255)},1`;
  if (name === 'move-code256-014.csv' && data[0] === '文字Bを256文字連結した商品コード,1' &&
      row['状態・属性'].includes('CSV内容=文字Bを256文字連結した商品コード・移動点数1')) data[0] = `${'B'.repeat(256)},1`;
  if (data.some((value) => /同じ255文字|文字Bを256文字/.test(value))) throw new Error(`${source}:${index + 2}: 連結指定を復元できない`);
  const columns = heading.split(',').length;
  if (data.some((value) => value.split(',').length !== columns)) throw new Error(`${source}:${index + 2}: ${name} の列数不一致`);
  const bytes = Buffer.from(`${[heading, ...data].join('\n')}\n`, 'utf8');
  const previous = fixtures.get(name);
  if (previous && !previous.equals(bytes)) throw new Error(`${source}:${index + 2}: 同名ファイルの内容差`);
  fixtures.set(name, bytes);
}

const textLine = lines.find((line) => line.startsWith('S-M04-22-TRANSFER-ERROR-029\t'));
if (!textLine) throw new Error('S-M04-22-TRANSFER-ERROR-029 が無い');
const textFields = parseTsvLine(textLine);
const textRow = Object.fromEntries(header.map((name, column) => [name, textFields[column]]));
if (!textRow['状態・属性'].includes('ファイル名=transfer.txt／ファイル内容=x') ||
    !textRow['投入方法'].includes('指定内容のUTF-8テキストファイルを作成する')) {
  throw new Error('transfer.txt の値と UTF-8 指定を復元できない');
}
fixtures.set('transfer.txt', Buffer.from('x', 'utf8'));

if (fixtures.size !== 26) throw new Error(`対象 ${fixtures.size} 件で、期待 26 件と異なる`);
if (write) fs.mkdirSync(targetDir, { recursive: true });
for (const [name, bytes] of fixtures) {
  const target = path.join(targetDir, name);
  if (write && !fs.existsSync(target)) fs.writeFileSync(target, bytes);
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) throw new Error(`${target} が正本と LF 規約に一致しない`);
}
console.log(`M04-22: CSV 25 件と TXT 1 件を正本の値・UTF-8・CSV の LF 規約で照合${write ? '・不足分を作成' : ''}`);
