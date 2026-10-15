import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 商品タグ・売上分析タグのうち、正本で静的な値と見出しを追える CSV のみ照合する。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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

function readSeed(functionId) {
  const filename = path.join(root, `integration_test/casegen/cases/${functionId}_seed_data.tsv`);
  const lines = fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split('\t');
  const rows = new Map();
  for (const [index, line] of lines.entries()) {
    const cells = parseTsvLine(line);
    if (cells.length !== header.length) throw new Error(`${filename}:${index + 2}: 列数不一致`);
    const row = Object.fromEntries(header.map((name, column) => [name, cells[column]]));
    rows.set(row['シードID'], { ...row, line: index + 2 });
  }
  return rows;
}

const m28 = readSeed('M03-28');
const m29 = readSeed('M03-29');
if (!m28.get('S-M03-28-CASE-008')['状態・属性'].includes('見出し「商品ID」「商品タグ(ID)」')) {
  throw new Error('M03-28 の正規見出しを復元できない');
}
if (!m29.get('S-M03-29-HDRONLY-043')['状態・属性'].includes('正規見出し（商品ID・売上分析タグ(ID)）')) {
  throw new Error('M03-29 の正規見出しを復元できない');
}

const fixtures = [];
for (const number of ['027', '028']) {
  const row = m28.get(`S-M03-28-CASE-${number}`);
  const name = `wrong-columns-${number}.csv`;
  const match = row['状態・属性'].match(new RegExp(`^CSV内商品ID=(\\d+)／${name.replaceAll('.', '\\.')}は2列の正規見出しに対してデータ「(\\d+)」「282」「1」の3列`));
  if (!match || match[1] !== match[2] || !row['投入方法'].includes('UTF-8のCSVファイル')) throw new Error(`M03-28:${row.line}: ${name} の根拠が揃わない`);
  fixtures.push(['m03-28', name, `商品ID,商品タグ(ID)\n${match[1]},282,1\n`]);
}

const staticSpecs = [
  ['S-M03-29-CASE-034', 'product-id-text-M0329-034.csv', '正規見出しと商品ID ABC・タグID 21を持つ', '商品ID,売上分析タグ(ID)\nABC,21\n'],
  ['S-M03-29-CASE-035', 'bad-header-M0329-035.csv', '見出し「商品番号」「売上分析タグ(ID)」と商品ID 329035・タグID 21を持つ', '商品番号,売上分析タグ(ID)\n329035,21\n'],
  ['S-M03-29-HDRONLY-043', 'header-only-M0329-043.csv', '正規見出し（商品ID・売上分析タグ(ID)）の1行だけを持ち、データ行は0行', '商品ID,売上分析タグ(ID)\n'],
  ['S-M03-29-NOPROD-044', 'no-product-M0329-044.csv', '正規見出しと商品ID 939044・タグID 21のデータ行1行を持つ', '商品ID,売上分析タグ(ID)\n939044,21\n'],
];
for (const [seedId, name, phrase, body] of staticSpecs) {
  const row = m29.get(seedId);
  if (!row || !row['状態・属性'].includes(`${name}は${phrase}`) || !row['投入方法'].includes('UTF-8')) {
    throw new Error(`M03-29:${row?.line ?? '?'}: ${name} の根拠が揃わない`);
  }
  fixtures.push(['m03-29', name, body]);
}

for (const [directory, name, body] of fixtures) {
  const target = path.join(root, 'e2e/fixtures', directory, name);
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(Buffer.from(body, 'utf8'))) {
    throw new Error(`${target} が正本と一致しない`);
  }
}
console.log(`M03-28/29: 静的 CSV ${fixtures.length} 件を正本と照合`);
