import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 正本で符号化・列値・行数が確定する入力だけを生成・照合する。
// 改行指定はないので LF・末尾改行1個を採用。--write は既存ファイルを上書きしない。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const seedDir = path.join(root, 'integration_test/casegen/cases');

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

function rows(module) {
  const sourcePath = path.join(seedDir, `${module}_seed_data.tsv`);
  const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/).filter(Boolean);
  const header = parseTsvLine(lines.shift());
  const seedColumn = header.indexOf('シードID');
  const attributeColumn = header.indexOf('状態・属性');
  const methodColumn = header.indexOf('投入方法');
  if ([seedColumn, attributeColumn, methodColumn].includes(-1)) throw new Error(`${sourcePath}: 必須列がない`);
  return new Map(lines.map((line, index) => {
    const fields = parseTsvLine(line);
    if (fields.length !== header.length) throw new Error(`${sourcePath}:${index + 2}: 列数不一致`);
    return [fields[seedColumn], { attribute: fields[attributeColumn], method: fields[methodColumn] }];
  }));
}
const m0423 = rows('M04-23');
const m0431 = rows('M04-31');
const fixtures = [];
const add = (module, seed, file, header, data, evidence) => {
  if (!/^[\w-]+\.csv$/.test(file)) throw new Error(`想定外のファイル名: ${file}`);
  if (header.split(',').length < 1 || !data.every((row) => row.split(',').length >= 1)) {
    throw new Error(`${seed}: CSVの列が不正`);
  }
  fixtures.push({ module, seed, file, content: `${header}\n${data.length ? `${data.join('\n')}\n` : ''}`, evidence });
};

// M04-23: 正本の「UTF-8」「見出し」「上のデータ行」を同一シード内で照合する。
const regularNumbers = [
  ...Array.from({ length: 11 }, (_, i) => i + 9),
  ...Array.from({ length: 9 }, (_, i) => i + 25),
  ...Array.from({ length: 5 }, (_, i) => i + 36),
  ...Array.from({ length: 12 }, (_, i) => i + 45),
  60, 61,
];
for (const number of regularNumbers) {
  const seed = `S-M04-23-CASE-${String(number).padStart(3, '0')}`;
  const source = m0423.get(seed);
  if (!source) throw new Error(`${seed}: 正本にない`);
  const match = source.method.match(/UTF-8の次のファイルを作って保存する: (.+?)（どのファイルも1行目は項目名「([^」]+)」の行とし、2行目以降に上のデータ行を書く。「空」と書いた欄は何も入れない）/);
  if (!match) throw new Error(`${seed}: 文字コード・見出し・明細の指定が変わった`);
  const [, description, header] = match;
  for (const item of description.split('／')) {
    if (!source.attribute.includes(item)) throw new Error(`${seed}: 属性と投入方法の記述が不一致`);
    const parsed = item.match(/^([\w-]+\.csv)(=|は)(.+)$/);
    if (!parsed) throw new Error(`${seed}: CSV内容を抽出できない: ${item}`);
    const [, file, separator, raw] = parsed;
    const data = (separator === 'は' ? raw.split('と') : [raw])
      .map((row) => row.split(',').map((cell) => cell === '空' ? '' : cell).join(','));
    if (data.some((row) => row.split(',').length !== header.split(',').length)) {
      throw new Error(`${seed}: 明細の列数が見出しと違う`);
    }
    add('m04-23', seed, file, header, data, item);
  }
}

for (const [number, kind, destinationDigit, sourceDigit, count] of [
  [41, 'split', '1', '2', 249], [42, 'split', '1', '2', 250],
  [43, 'join', '2', '4', 249], [44, 'join', '2', '4', 250],
]) {
  const seed = `S-M04-23-CASE-${String(number).padStart(3, '0')}`;
  const source = m0423.get(seed);
  if (!source) throw new Error(`${seed}: 正本にない`);
  const prefix = `4230${number}`;
  const firstName = kind === 'split' ? '分割元商品コード' : '結合先商品コード';
  const secondName = kind === 'split' ? '分割先商品コード' : '結合元商品コード';
  const width = count + 6;
  for (const [name, digit] of [[firstName, destinationDigit], [secondName, sourceDigit]]) {
    const fragment = `${name}=先頭6桁${prefix}の後に数字${digit}を${count}文字連結した${width}文字`;
    if (!source.attribute.includes(fragment)) throw new Error(`${seed}: 商品コード生成規則が変わった: ${fragment}`);
  }
  const file = `${kind}_code_${width}-${String(number).padStart(3, '0')}.csv`;
  const detail = kind === 'split' ? '分割数1・分割先在庫数1' : '結合数1・結合元在庫区分2・結合元在庫数1';
  const header = kind === 'split'
    ? '分割元商品コード,分割数,分割先商品コード,分割先在庫数'
    : '結合先商品コード,結合数,結合元商品コード,結合元在庫区分,結合元在庫数';
  const evidence = `UTF-8の次のファイルを作って保存する: ${file}は${detail}（どのファイルも1行目は項目名「${header}」`;
  if (!source.method.includes(evidence) || !source.attribute.includes(`${file}は${detail}`)) {
    throw new Error(`${seed}: ファイル・UTF-8・見出し・明細の指定が変わった`);
  }
  const first = `${prefix}${destinationDigit.repeat(count)}`;
  const second = `${prefix}${sourceDigit.repeat(count)}`;
  const data = kind === 'split' ? `${first},1,${second},1` : `${first},1,${second},2,1`;
  add('m04-23', seed, file, header, [data], evidence);
}

for (const [seed, expectedFile] of [
  ['S-M04-23-L-CASE-063', 'split-ok-L001.csv'],
  ['S-M04-23-L-CASE-064', 'join-ok-L002.csv'],
]) {
  const source = m0423.get(seed);
  const match = source?.method.match(/UTF-8のファイル「([^」]+)」を作って保存する: 1行目に項目名「([^」]+)」、2行目に「([^」]+)」/);
  if (!match || match[1] !== expectedFile || !source.attribute.includes(expectedFile)) {
    throw new Error(`${seed}: CSVの指定が変わった`);
  }
  add('m04-23', seed, match[1], match[2], [match[3]], match[0]);
}

for (const number of [66, 68, 69, 70, 71, 72, 73]) {
  const seed = `S-M04-23-GF-${String(number).padStart(3, '0')}`;
  const source = m0423.get(seed);
  const match = source?.attribute.match(/(M0423-[\w-]+\.csv)=(\d+)列のUTF-8 CSV（1行目に項目名 ([^、]+)、2行目に([^）]+)）/);
  if (!match || !source.method.includes(match[0])) throw new Error(`${seed}: CSVの指定が変わった`);
  const [, file, columnCount, headerDescription, data] = match;
  const header = headerDescription.replaceAll('・', ',');
  if (header.split(',').length !== Number(columnCount) || data.split(',').length !== Number(columnCount)) {
    throw new Error(`${seed}: 列数の指定が不一致`);
  }
  add('m04-23', seed, file, header, [data], match[0]);
}

// M04-31: 行の意味（空文字の引用符、全角、11列、連番）も正本の記述と照合する。
const hCode = '商品コード';
const hQty = '商品コード,棚卸数量';
const sequence = (prefix, count, quantity = '') => Array.from({ length: count }, (_, i) =>
  `${prefix}${String(i + 1).padStart(5, '0')}${quantity}`);
const specs31 = [
  ['IMPDUPFILE-059', 'm0431-059-dup.csv', hCode, 'M0431059P1・M0431059P2・M0431059P1の3行', ['M0431059P1', 'M0431059P2', 'M0431059P1']],
  ['IMPDUPEXIST-060', 'm0431-060-dup.csv', hCode, 'M0431060P2・M0431060P1の2行', ['M0431060P2', 'M0431060P1']],
  ['IMPNOSTOCK-061', 'm0431-061-add.csv', hCode, 'M0431061P1の1行', ['M0431061P1']],
  ['IMPMULTI-062', 'm0431-062-add.csv', hCode, 'M0431062P1の1行', ['M0431062P1']],
  ['IMPBLANK-063', 'm0431-063-blank.csv', hCode, 'M0431063P1・商品コード列が空文字の行（二重引用符を2つ並べただけの行）の2行', ['M0431063P1', '""']],
  ['IMPFULL-064', 'm0431-064-full.csv', hCode, '全角英数の「Ｍ０４３１０６４Ｐ１」（商品コードM0431064P1を全角にしたもの）の1行', ['Ｍ０４３１０６４Ｐ１']],
  ['IMPFORMAT-066', 'm0431-066-format.csv', '商品名', '商品M0431066P1の1行', ['商品M0431066P1']],
  ['IMPROWFMT-067', 'm0431-067-cols.csv', hCode, 'M0431067P1に続けて2〜11列目に「X」を入れた11列の1行', [['M0431067P1', ...Array(10).fill('X')].join(',')]],
  ['IMPEMPTY-068', 'm0431-068-empty.csv', hCode, 'だけ（データ行は0行）', []],
  ['IMPREFL-069', 'm0431-069-add.csv', hCode, 'M0431069P2の1行', ['M0431069P2']],
  ['IMPNOEDIT-070', 'm0431-070-add.csv', hCode, 'M0431070P1の1行', ['M0431070P1']],
  ['IMP20001-071', 'm0431-071-over.csv', hCode, 'M0431071N00001〜M0431071N20001を1行ずつ並べた20001行', sequence('M0431071N', 20001)],
  ['QTYDUP-072', 'm0431-072-dup.csv', hQty, 'M0431072P1,5・M0431072P2,6・M0431072P1,7の3行', ['M0431072P1,5', 'M0431072P2,6', 'M0431072P1,7']],
  ['QTYNOTPLAN-073', 'm0431-073-qty.csv', hQty, 'M0431073P1,5・M0431073P9,3の2行', ['M0431073P1,5', 'M0431073P9,3']],
  ['QTYBLANK-074', 'm0431-074-blank.csv', hQty, 'M0431074P1と棚卸数量が空文字（二重引用符を2つ並べただけ）の1行', ['M0431074P1,""']],
  ['QTYBLANKCODE-075', 'm0431-075-blank.csv', hQty, '商品コードが空文字（二重引用符を2つ並べただけ）で棚卸数量が5の1行', ['"",5']],
  ['QTYNEG-076', 'm0431-076-neg.csv', hQty, 'M0431076P1,-1の1行', ['M0431076P1,-1']],
  ['QTYDEC-077', 'm0431-077-dec.csv', hQty, 'M0431077P1,2.5の1行', ['M0431077P1,2.5']],
  ['QTYFORMAT-078', 'm0431-078-format.csv', hCode, 'M0431078P1の1行', ['M0431078P1']],
  ['QTYEMPTY-079', 'm0431-079-empty.csv', hQty, 'だけ（データ行は0行）', []],
  ['QTYREFL-080', 'm0431-080-qty.csv', hQty, 'M0431080P1,5の1行', ['M0431080P1,5']],
  ['QTYNOEDIT-081', 'm0431-081-qty.csv', hQty, 'M0431081P1,5の1行', ['M0431081P1,5']],
  ['QTY20001-082', 'm0431-082-over.csv', hQty, 'M0431082N00001〜M0431082N20001を棚卸数量1で1行ずつ並べた20001行', sequence('M0431082N', 20001, ',1')],
  ['RFMISMATCH-128', 'm0431-128-add.csv', hCode, 'M0431128P3の1行', ['M0431128P3']],
  ['QTYCOLS-138', 'm0431-138-cols.csv', hQty, 'M0431138P1に続けて2〜11列目に「X」を入れた11列の1行', [['M0431138P1', ...Array(10).fill('X')].join(',')]],
  ['IMPOKMSG-142', 'm0431-142-ok.csv', hCode, 'M0431142P1・M0431142P2の2行', ['M0431142P1', 'M0431142P2']],
  ['IMPOKROWS-143', 'm0431-143-ok.csv', hCode, 'M0431143P1・M0431143P2の2行', ['M0431143P1', 'M0431143P2']],
  ['QTYOKMSG-144', 'm0431-144-ok.csv', hQty, 'M0431144P1,8・M0431144P2,10の2行', ['M0431144P1,8', 'M0431144P2,10']],
  ['QTYOKROWS-145', 'm0431-145-ok.csv', hQty, 'M0431145P1,8・M0431145P2,10の2行', ['M0431145P1,8', 'M0431145P2,10']],
  ['IMP20000-146', 'm0431-146-max.csv', hCode, 'M0431146N00001〜M0431146N20000を1行ずつ並べた20000行', sequence('M0431146N', 20000)],
  ['QTY20000-147', 'm0431-147-max.csv', hQty, 'M0431147N00001〜M0431147N20000を棚卸数量1で1行ずつ並べた20000行', sequence('M0431147N', 20000, ',1')],
];
for (const [shortSeed, file, header, description, data] of specs31) {
  const seed = `S-M04-31-${shortSeed}`;
  const source = m0431.get(seed);
  const evidence = `CSVファイル「${file}」は見出し行「${header}」に続けて${description}`;
  if (!source?.attribute.includes(evidence) || !source.method.includes('UTF-8')) {
    throw new Error(`${seed}: UTF-8・見出し・明細の指定が変わった`);
  }
  add('m04-31', seed, file, header, data, evidence);
}

const seen = new Set();
for (const fixture of fixtures) {
  const target = path.join(root, 'e2e/fixtures', fixture.module, fixture.file);
  if (seen.has(target)) throw new Error(`重複する入力: ${target}`);
  seen.add(target);
  const expected = Buffer.from(fixture.content, 'utf8');
  if (!fs.existsSync(target)) {
    if (!process.argv.includes('--write')) throw new Error(`${target} がない。--write で不足分を作成する`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected, { flag: 'wx' });
  }
  if (!fs.readFileSync(target).equals(expected)) throw new Error(`${target}: 正本から確定したバイト列と異なる`);
}

console.log(`正本と照合: M04-23 ${fixtures.filter((x) => x.module === 'm04-23').length} 件、M04-31 ${specs31.length} 件。`);
