import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 出典行の仕様が残っていることと、追加した静的入力のバイト列を照合する。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const specs = [
  {
    seed: 'S-M03-16-CASE-028',
    file: 'm03-16/header_only-028.csv',
    evidence: ['header_only-028.csv=UTF－8・LF・見出し「ID・名称・並び順」のみでデータ行なし'],
    content: 'ID,名称,並び順\n',
  },
  {
    seed: 'S-M03-16-CASE-029',
    file: 'm03-16/header_only-029.csv',
    evidence: ['header_only-029.csv=UTF－8・LF・見出し「ID・名称・並び順」のみでデータ行なし'],
    content: 'ID,名称,並び順\n',
  },
  {
    seed: 'S-M03-16-CASE-020',
    file: 'm03-16/order_empty-020.csv',
    evidence: ['order_empty-020.csv=UTF－8・LF・見出し「名称・並び順・ID」・名称「並び順空略称-020」・並び順空・ID 0'],
    content: '名称,並び順,ID\n並び順空略称-020,,0\n',
  },
  {
    seed: 'S-M03-20-CASE-005',
    file: 'm03-20/no_id_header.csv',
    evidence: [
      'no_id_header.csv=見出し「部門名・部門コード・免税区分・MTGBuyer表示フラグ」、データ「ID列なし部門」・NOID-005・0・0',
      'no_id_header.csv」（UTF-8・カンマ区切り・見出しにID列なし）',
    ],
    content: '部門名,部門コード,免税区分,MTGBuyer表示フラグ\nID列なし部門,NOID-005,0,0\n',
  },
  {
    seed: 'S-M03-40-DATA-033',
    file: 'm03-40/m0340-bad-header-033.csv',
    evidence: [
      'm0340-bad-header-033.csv=見出し「商品番号,棚番号名称」とデータ「34003301,S-002-033」',
      '指定内容のUTF-8 CSVを3ファイル生成する',
    ],
    content: '商品番号,棚番号名称\n34003301,S-002-033\n',
  },
];

for (const spec of specs) {
  const functionId = spec.seed.match(/^S-(M\d\d-\d\d)-/)[1];
  const sourceName = `${functionId}_seed_data.tsv`;
  const sourcePath = path.join(root, 'integration_test/casegen/cases', sourceName);
  const row = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/)
    .find((line) => line.startsWith(`${spec.seed}\t`));
  if (!row) throw new Error(`${sourceName}: ${spec.seed} がない`);
  for (const evidence of spec.evidence) {
    if (!row.includes(evidence)) throw new Error(`${sourceName}: ${spec.seed} の仕様が変わった: ${evidence}`);
  }

  const fixturePath = path.join(root, 'e2e/fixtures', spec.file);
  const actual = fs.readFileSync(fixturePath);
  const expected = Buffer.from(spec.content, 'utf8');
  if (!actual.equals(expected)) throw new Error(`${fixturePath}: バイト列が正本の指定と違う`);
}

console.log(`M03 静的入力の追加分 ${specs.length} 件を確認。`);
