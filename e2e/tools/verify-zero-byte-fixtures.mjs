import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDir = path.join(root, 'integration_test/casegen/cases');
const fixtureDir = path.join(root, 'e2e/fixtures');
const conflict = 'm03-30/empty.tsv';
const verified = new Set();
const sourceFiles = fs.readdirSync(sourceDir).filter((name) => name.endsWith('_seed_data.tsv'));

for (const sourceName of sourceFiles) {
  const functionId = sourceName.slice(0, 6).toLowerCase();
  const lines = fs.readFileSync(path.join(sourceDir, sourceName), 'utf8').split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    // 0 バイト指定は状態・属性欄にある。行全体から名前を探しても判定は同じで、
    // 引用セル内のタブを独自解釈しない。
    for (const match of lines[i].matchAll(/(?<![A-Za-z0-9._-])([A-Za-z0-9._-]+\.(?:csv|tsv))(?:=|は)0バイト/g)) {
      const filename = match[1];
      const relative = `${functionId}/${filename}`;
      if (relative === conflict) continue;
      const target = path.join(fixtureDir, relative);
      if (fs.statSync(target).size !== 0) {
        throw new Error(`${target}: ${sourceName}:${i + 1} は 0 バイトを指定`);
      }
      verified.add(relative);
    }
  }
}

console.log(`正本が明示する 0 バイトの入力ファイル ${verified.size} 件を確認。${conflict} は正本内の矛盾で保留。`);
