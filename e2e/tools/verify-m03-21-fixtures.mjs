import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M03-21 のシード表で全バイトを確定できる CSV だけを検証する。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'integration_test/casegen/cases/M03-21_seed_data.tsv');
const fixtureDir = path.join(root, 'e2e/fixtures/m03-21');
const lines = fs.readFileSync(source, 'utf8').trimEnd().split('\n');
let verified = 0;
const deferred = [];

for (let i = 1; i < lines.length; i++) {
  const cells = lines[i].split('\t');
  const [id, , , attributes, , method] = cells;
  if (!id.includes('-CSV-')) continue;
  const filename = attributes.match(/m03-21-[A-Za-z0-9-]+\.csv/)?.[0];
  if (!filename) throw new Error(`${source}:${i + 1}: ファイル名がない`);

  const content = attributes.match(/(?:2行目|明細)=([^／]+)/)?.[1] ?? '';
  if (content.includes('〔')) {
    deferred.push(`${id}: 登録時に控える番号が必要`);
    continue;
  }

  const header = attributes.match(/1行目=([^／]+)/)?.[1]
    ?? method.match(/見出し「([^」]+)」/)?.[1];
  if (!header) throw new Error(`${source}:${i + 1}: 見出しがない`);
  const rows = content ? content.split('および') : [];
  const expected = [header, ...rows].join('\n') + '\n';
  const target = path.join(fixtureDir, filename);
  const actual = fs.readFileSync(target, 'utf8');
  if (actual !== expected) throw new Error(`${target}: ${source}:${i + 1} の内容と一致しない`);
  verified++;
}

console.log(`M03-21: 静的 CSV ${verified} 件が正本と一致、実行時生成 ${deferred.length} 件`);
for (const item of deferred) console.log(item);
