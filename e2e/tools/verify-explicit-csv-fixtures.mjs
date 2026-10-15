import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 見出し、全行、符号化と改行を正本で確定できる少数の CSV を照合する。
// evidence は対応するシード行に必ず含まれるべき記述。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const specs = [
  {
    seed: 'S-M03-16-CASE-001', file: 'm03-16/new_rows-001.csv',
    evidence: ['UTF－8・LF・カンマ区切り', '見出し「ID・名称・並び順」', 'CSV新規略称M0316-A-001', 'CSV新規略称M0316-B-001', '並び順30', '並び順31'],
    content: 'ID,名称,並び順\n,CSV新規略称M0316-A-001,30\n,CSV新規略称M0316-B-001,31\n',
  },
  {
    seed: 'S-M03-16-CASE-003', file: 'm03-16/no_id_header-003.csv',
    evidence: ['UTF－8・LF・カンマ区切り', '見出し「名称・並び順」', 'ID列なし略称-003', '並び順40'],
    content: '名称,並び順\nID列なし略称-003,40\n',
  },
  {
    seed: 'S-M03-16-CASE-005', file: 'm03-16/id_middle-005.csv',
    evidence: ['UTF－8・LF・カンマ区切り', '見出し「名称・ID・並び順」', 'ID中間略称-005', 'ID空', '並び順44'],
    content: '名称,ID,並び順\nID中間略称-005,,44\n',
  },
  {
    seed: 'S-M03-16-CASE-039', file: 'm03-16/m0316-039-quoted.csv',
    evidence: ['UTF－8・LF・カンマ区切り', '見出し「ID,名称,並び順」', '二重引用符で囲んだ「囲み区切り略称M0316-039-A,M0316-039-B」', '並び順90'],
    content: 'ID,名称,並び順\n,"囲み区切り略称M0316-039-A,M0316-039-B",90\n',
  },
  {
    seed: 'S-M03-16-CASE-040', file: 'm03-16/m0316-040-ok.csv',
    evidence: ['UTF－8・LF・カンマ区切り', '見出し「ID,名称,並び順」', 'CSV完了表示略称M0316-040-A', 'CSV完了表示略称M0316-040-B', '並び順95', '並び順96'],
    content: 'ID,名称,並び順\n,CSV完了表示略称M0316-040-A,95\n,CSV完了表示略称M0316-040-B,96\n',
  },
  {
    seed: 'S-M03-20-L-DEPT-051', file: 'm03-20/linkm0320-002.csv',
    evidence: ['見出し行ID,部門名,部門コード,免税区分,MTGBuyer表示フラグ', '1行目(ID空),リンク出力部門-002,9320022,2,0', 'UTF-8・カンマ区切り'],
    content: 'ID,部門名,部門コード,免税区分,MTGBuyer表示フラグ\n,リンク出力部門-002,9320022,2,0\n',
  },
];

for (const spec of specs) {
  const functionId = spec.seed.match(/^S-(M\d\d-\d\d)-/)[1];
  const sourceName = `${functionId}_seed_data.tsv`;
  const source = fs.readFileSync(path.join(root, 'integration_test/casegen/cases', sourceName), 'utf8');
  const row = source.split(/\r?\n/).find((line) => line.startsWith(`${spec.seed}\t`));
  if (!row) throw new Error(`${sourceName}: ${spec.seed} がない`);
  for (const fragment of spec.evidence) {
    if (!row.includes(fragment)) throw new Error(`${sourceName}: ${spec.seed} に「${fragment}」がない`);
  }
  const fixture = path.join(root, 'e2e/fixtures', spec.file);
  if (fs.readFileSync(fixture, 'utf8') !== spec.content) throw new Error(`${fixture}: 内容が指定と違う`);
}

console.log(`正本で全列・全行を確定できる CSV ${specs.length} 件を確認。`);
