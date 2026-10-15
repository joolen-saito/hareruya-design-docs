import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M04-24: 見出しとデータ行なしが正本で明記された 043 のみを照合する。
// 改行種別は未指定なので、ファイル表現は LF・末尾改行 1 個を採用する。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'integration_test/casegen/cases/M04-24_seed_data.tsv');
const target = path.join(root, 'e2e/fixtures/m04-24/M04-24-bad-header-043.csv');
const line = fs.readFileSync(source, 'utf8').split(/\r?\n/).find((value) => value.startsWith('S-M04-24-FILE-043\t'));
if (!line) throw new Error('S-M04-24-FILE-043 が正本に無い');
const fields = line.split('\t');
if (fields.length !== 7) throw new Error('S-M04-24-FILE-043 の列数が変わった');
if (!fields[3].includes('M04-24-bad-header-043.csv／1行目=指示ID,伝票番号') ||
    !fields[5].includes('1行目を「指示ID,伝票番号」としたUTF-8のCSVファイル') ||
    !fields[5].includes('登録するデータは無い')) {
  throw new Error('M04-24-bad-header-043.csv の正本仕様が変わった');
}
const expected = Buffer.from('指示ID,伝票番号\n', 'utf8');
if (!fs.existsSync(target) || !fs.readFileSync(target).equals(expected)) {
  throw new Error('M04-24-bad-header-043.csv が正本の値・LF 規約と異なる');
}
console.log('M04-24: 見出しのみ CSV 1 件を正本の値・UTF-8・LF 規約で照合');
