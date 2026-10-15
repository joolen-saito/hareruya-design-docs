import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M04-13 の2列CSV。--write は不足ファイルだけを作り、既存を上書きしない。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(root, 'integration_test/casegen/cases/M04-13_seed_data.tsv');
const source = fs.readFileSync(sourcePath, 'utf8');
const header = '商品コード,分割先分割在庫数\n';
const sequence = (prefix, count, width, quantity) =>
  Array.from({ length: count }, (_, i) => `${prefix}${String(i + 1).padStart(width, '0')},${quantity}\n`).join('');

const specs = [
  {
    seed: 'S-M04-13-CASE-019', file: 'split_valid-019.csv',
    evidence: [
      'split_valid-019.csvは両商品を数量2で記載',
      'ヘッダを「商品コード」「分割先分割在庫数」とし、M0413-DST-A-019とM0413-DST-B-019を各数量2で書いたUTF-8のCSV',
    ],
    content: header + 'M0413-DST-A-019,2\nM0413-DST-B-019,2\n',
  },
  {
    seed: 'S-M04-13-CASE-020', file: 'split_2000-020.csv',
    evidence: [
      'split_2000-020.csvは商品コードM0413-DST-020-0001〜M0413-DST-020-2000を各数量1で記載',
      'ヘッダを「商品コード」「分割先分割在庫数」とし、M0413-DST-020-0001〜M0413-DST-020-2000を各数量1で書いたUTF-8のCSV',
    ],
    content: header + sequence('M0413-DST-020-', 2000, 4, 1),
  },
  {
    seed: 'S-M04-13-CASE-021', file: 'split_2001-021.csv',
    evidence: [
      'split_2001-021.csvは商品コードM0413-DST-021-0001〜M0413-DST-021-2001を各数量1で記載',
      'ヘッダを「商品コード」「分割先分割在庫数」とし、M0413-DST-021-0001〜M0413-DST-021-2001を各数量1で書いたUTF-8のCSV',
    ],
    content: header + sequence('M0413-DST-021-', 2001, 4, 1),
  },
  {
    seed: 'S-M04-13-CASE-023', file: 'split_21_errors-023.csv',
    evidence: [
      'split_21_errors-023.csvは未登録商品コードM0413-UNKNOWN-023-01〜M0413-UNKNOWN-023-21を各数量1で記載',
      'ヘッダを「商品コード」「分割先分割在庫数」とし、M0413-UNKNOWN-023-01〜M0413-UNKNOWN-023-21の21行を各数量1で書いたUTF-8のCSV',
    ],
    content: header + sequence('M0413-UNKNOWN-023-', 21, 2, 1),
  },
  {
    seed: 'S-M04-13-CASE-024', file: 'split_replace-024.csv',
    evidence: [
      'split_replace-024.csvはM0413-DST-C-024を数量1で記載',
      'ヘッダを「商品コード」「分割先分割在庫数」とし、M0413-DST-C-024だけを数量1で書いたUTF-8のCSV',
    ],
    content: header + 'M0413-DST-C-024,1\n',
  },
  {
    seed: 'S-M04-13-ERRNAME-084', file: 'split_noqty-084.csv',
    evidence: [
      'split_noqty-084.csvはM0413-DST-A-084の行1件で分割先分割在庫数が空',
      'ヘッダを「商品コード」「分割先分割在庫数」とし、M0413-DST-A-084の1行だけを分割先分割在庫数を空にして書いたUTF-8のCSV',
    ],
    content: header + 'M0413-DST-A-084,\n',
  },
];

for (const spec of specs) {
  const row = source.split(/\r?\n/).find((line) => line.startsWith(`${spec.seed}\t`));
  if (!row) throw new Error(`${spec.seed} が正本にない`);
  for (const fragment of spec.evidence) {
    if (!row.includes(fragment)) throw new Error(`${spec.seed} の仕様が変わった: ${fragment}`);
  }

  const destination = path.join(root, 'e2e/fixtures/m04-13', spec.file);
  const expected = Buffer.from(spec.content, 'utf8');
  if (!fs.existsSync(destination)) {
    if (!process.argv.includes('--write')) throw new Error(`${destination} がない。--write で生成する`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, expected, { flag: 'wx' });
  }
  if (!fs.readFileSync(destination).equals(expected)) throw new Error(`${destination}: バイト列が正本と違う`);
}

console.log(`M04-13 の入力 CSV ${specs.length} 件を正本と照合した。`);
