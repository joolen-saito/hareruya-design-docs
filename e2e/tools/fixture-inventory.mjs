import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 正本の参照箇所を残すための棚卸し。実行対象の判定や中身の補完はしない。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDir = path.join(root, 'integration_test/casegen/cases');
const fixtureDir = path.join(root, 'e2e/fixtures');
// 正本には not-csv.txt-010 のように拡張子の後ろに識別番号を付けた名前もある。
const filenamePattern = /(?<![A-Za-z0-9._-])([A-Za-z0-9_+.-]+\.(?:csv|tsv|xlsx?|pdf|jpe?g|png|gif|webp|zip|xml|json|bmp|svg|txt|dat|twig)(?:-\d+)?)(?![A-Za-z0-9._-])/gi;
const fileWordPattern = /CSV|TSV|Excel|画像|ファイル|添付|PDF|JPEG|JPG|PNG|GIF|ZIP|DAT|Twig/i;
const actionPattern = /選択|指定|アップロード|読み込|取り込|取込|インポート|登録|作成|作り|用意|保存|置く|送信/;

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

function readRows(filename) {
  const lines = fs.readFileSync(path.join(sourceDir, filename), 'utf8').split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines.shift().split('\t');
  return lines.map((line, index) => {
    const fields = parseTsvLine(line);
    if (fields.length !== header.length) {
      throw new Error(`${filename}:${index + 2}: ${fields.length} 列、見出しは ${header.length} 列`);
    }
    return { id: fields[0], line: index + 2, cells: Object.fromEntries(header.map((key, i) => [key, fields[i]])) };
  });
}

function classification(kind, column, value, filename) {
  const segment = value.split(/[／。]/).find((part) => part.includes(filename)) ?? '';
  const isInput = /選択|指定|アップロード|読み込|取り込|取込|インポート|作成|作り|用意|保存|置く/.test(segment);
  const isOutput = /ダウンロード|出力|履歴/.test(segment);
  if (kind === 'case' && column === '手順' && isInput) return '入力候補';
  if (kind === 'case' && column === '事前準備' && /用意|準備|配置/.test(segment)) return '入力候補';
  if (kind === 'seed' && column === '投入方法' && isInput) return '入力候補';
  if (isOutput) return '出力・履歴候補';
  return '参照';
}

function contentHints(kind, name, cells) {
  if (kind !== 'seed') return [];
  const attributes = cells['状態・属性'] ?? '';
  const method = cells['投入方法'] ?? '';
  const segment = attributes.split(/[／。]/).find((part) => part.includes(name)) ?? '';
  const hints = [];
  // 「filename=...」はファイル別の記述が存在するという意味だけで、完成可能とは判定しない。
  // 後続の値がサイズ・符号化・行の一部だけの場合がある。
  if (segment.includes(`${name}=`)) hints.push('ファイル別仕様記述');
  if (new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:=|は)0バイト`).test(segment)) hints.push('0バイト明記');
  if (/見出し/.test(segment) && /データ|明細|行目/.test(segment)) hints.push('見出し・明細記述');
  else if (/見出し/.test(segment)) hints.push('見出し記述');
  if (/\d+行目|\d+列|行数|行内容|空ID|空欄|セル|\d+件/.test(segment)) hints.push('行列条件記述');
  if (/〔[^〕]+〕|控えた(?:番号|ID)/.test(segment)) hints.push('採番値の参照');
  if (/雛形ファイルをダウンロード|雛形をダウンロード/.test(method)) hints.push('画面の雛形を使用（同シード）');
  if (/\.(?:jpe?g|png|gif|webp|bmp)$/i.test(name) && /バイト|KB|MB|画像形式|有効な(?:PNG|JPEG|GIF|BMP)/i.test(segment)) hints.push('画像形式・サイズ記述');
  if (/UTF[-－_]?8|Shift[_-]?JIS|SJIS|UTF[-－_]?16/i.test(`${segment} ${method}`)) hints.push('符号化形式記述');
  return hints;
}

function unnamedHints(kind, cells) {
  if (kind !== 'seed') return [];
  const method = cells['投入方法'] ?? '';
  const attributes = cells['状態・属性'] ?? '';
  const hints = [];
  if (/雛形ファイルをダウンロード|雛形をダウンロード/.test(method)) hints.push('画面の雛形を使用（同シード）');
  if (/〔[^〕]+〕|登録時に画面が振る|未使用の番号/.test(`${attributes} ${method}`)) hints.push('実行時値あり（同シード）');
  if (/見出し/.test(`${attributes} ${method}`) && /データ|明細|行目/.test(`${attributes} ${method}`)) hints.push('見出し・明細記述');
  return hints;
}

function fixtureNames(dir, prefix = '') {
  if (!fs.existsSync(dir)) return new Set();
  const names = new Set();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const name of fixtureNames(path.join(dir, entry.name), `${prefix}${entry.name}/`)) names.add(name);
    } else if (entry.isFile()) {
      names.add(`${prefix}${entry.name}`);
    }
  }
  return names;
}

function tsvCell(value) {
  return String(value).replaceAll('\t', ' ').replaceAll('\n', ' ');
}

function writeTsv(filename, header, rows) {
  fs.mkdirSync(fixtureDir, { recursive: true });
  const body = [header, ...rows].map((row) => row.map(tsvCell).join('\t')).join('\n') + '\n';
  fs.writeFileSync(path.join(fixtureDir, filename), body, 'utf8');
}

const references = new Map();
const unnamed = [];
const sourceFiles = fs.readdirSync(sourceDir).filter((name) => /_(?:test_cases|seed_data)\.tsv$/.test(name)).sort();
for (const sourceName of sourceFiles) {
  const kind = sourceName.endsWith('_test_cases.tsv') ? 'case' : 'seed';
  const functionId = sourceName.slice(0, 6);
  const sourcePath = `integration_test/casegen/cases/${sourceName}`;
  for (const row of readRows(sourceName)) {
    for (const [column, value] of Object.entries(row.cells)) {
      if (column === 'テストID' || column === 'シードID') continue;
      const names = [...new Set([...value.matchAll(filenamePattern)].map((match) => match[1]))];
      for (const name of names) {
        const key = `${functionId}/${name}`;
        if (!references.has(key)) references.set(key, []);
        references.get(key).push({ kind, id: row.id, sourcePath, line: row.line, column, usage: classification(kind, column, value, name), hints: contentHints(kind, name, row.cells) });
      }
      if (((kind === 'case' && column === '手順') || (kind === 'seed' && column === '投入方法')) &&
          names.length === 0 && fileWordPattern.test(value) && actionPattern.test(value)) {
        unnamed.push([row.id, `${sourcePath}:${row.line}`, column, unnamedHints(kind, row.cells).join('、') || '未判定']);
      }
    }
  }
}

const present = fixtureNames(fixtureDir);
const deferred = new Map([
  ['M03-21/m03-21-atomic-046.csv', ['実行時生成', 'シード投入時に画面で控える棚番号 ID が必要']],
  ['M03-21/m03-21-update-049.csv', ['実行時生成', 'シード投入時に画面で控える棚番号 ID が必要']],
  ['M03-30/empty.tsv', ['正本矛盾', '0 バイト指定と商品 ID をファイルへ書く指定が併存']],
  ['M03-16/l003-mix.csv', ['保留', '符号化形式の指定がない']],
  ['M03-18/M0318-053-big.csv', ['保留', '5 MB＋1 バイトに調整する末尾の充填文字が未指定']],
  ['M03-18/M0318-054-token.csv', ['保留', '見出し行の具体的な列名が未指定']],
  ['M03-18/M0318-055-extra.csv', ['保留', '見出し行の具体的な列名が未指定']],
  ['M04-02/m0402-050-main.png', ['保留', '画像内容が正本で未指定']],
  ['M04-02/m0402-050-sub.png', ['保留', '画像内容が正本で未指定']],
  ['M04-03/bulk-a.png', ['保留', '画像内容が正本で未指定']],
  ['M04-03/bulk-b.png', ['保留', '画像内容が正本で未指定']],
  ['M04-05/class-a-011.jpg', ['保留', '画像内容が正本で未指定']],
  ['M04-05/class-b-011.jpg', ['保留', '画像内容が正本で未指定']],
  ['M04-05/product-a-011.jpg', ['保留', '画像内容が正本で未指定']],
  ['M04-05/product-b-011.jpg', ['保留', '画像内容が正本で未指定']],
  ['M04-05/product_yyyyMMddHHmmss.csv', ['入力対象外', 'CSV ダウンロードの出力名']],
  ['M04-09/shortage-valid-032.csv', ['保留', '一部の列値が正本で未指定']],
  ['M04-09/difference-valid-049.csv', ['保留', '一部の列値が正本で未指定']],
  ['M04-09/shortage-ref-M0409-116.csv', ['保留', '符号化形式が正本で未指定']],
  ['M04-09/difference-ref-M0409-117.csv', ['保留', '符号化形式が正本で未指定']],
  ['M04-13/split_bad_header-022.csv', ['保留', 'データ行の有無と値が正本で未指定']],
  ['M04-13/split_invalid.txt-022', ['保留', 'CSV 以外という条件のみで内容が未指定']],
  ['M04-16/stock_recommend_YYYYMMDDhhmmss.csv', ['入力対象外', 'CSV ダウンロードの出力名']],
  ['M04-21/not-csv.txt-010', ['保留', 'CSV 以外のテキストという条件のみで内容が未指定']],
  ['M04-22/move.txt', ['保留', '商品コードと移動点数の文字列表現・区切り・見出しが未指定']],
  ['M04-23/split_not_csv.txt', ['保留', '日本語テキストの符号化形式が未指定']],
  ['M04-23/join_not_csv.txt', ['保留', '日本語テキストの符号化形式が未指定']],
  ['M04-23/split_bad_header-023.csv', ['保留', '第 1〜3 見出し値が未指定']],
  ['M04-23/join_bad_header-024.csv', ['保留', '誤列以外の見出し値が未指定']],
  ['M04-23/M0423-065-split.txt', ['保留', '見出しの具体的な値が未指定']],
  ['M04-23/M0423-067-join.txt', ['保留', '見出しの具体的な値が未指定']],
  ['M04-24/M04-24-notfound-032.csv', ['保留', 'このファイルの見出し行が未指定']],
  ['M04-24/M04-24-id-boundary-034.csv', ['保留', 'このファイルの見出し行が未指定']],
  ['M04-24/M04-24-id-invalid-035.csv', ['保留', 'このファイルの見出し行が未指定']],
  ['M04-24/M04-24-duplicate-033.csv', ['実行時生成', '画面が採番する移動指示 ID が必要']],
  ['M04-24/M04-24-length-max-036.csv', ['実行時生成', '画面が採番する移動指示 ID が必要']],
  ['M04-24/M04-24-length-over-037.csv', ['実行時生成', '画面が採番する移動指示 ID が必要']],
  ['M04-24/M04-24-atomic-041.csv', ['実行時生成', '画面が採番する移動指示 ID が必要']],
  ['M04-24/M04-24-errors-21-040.csv', ['保留', '各行の送り状 No. の値と見出し行が未指定']],
  ['M04-24/tracking.txt', ['保留', '任意の文字という条件のみで内容が未指定']],
  ['M04-31/m0431-150-img.png', ['保留', '画像のバイナリ内容が未指定']],
  ['M04-31/M0431-053-A.csv', ['入力対象外', 'CSV ダウンロードの出力名']],
]);
for (const key of deferred.keys()) {
  if (!references.has(key)) throw new Error(`判断の対象が正本に見つからない: ${key}`);
}
const namedRows = [...references].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([key, refs]) => {
  const [functionId, name] = key.split('/');
  const location = `${functionId.toLowerCase()}/${name}`;
  const cases = [...new Set(refs.filter((ref) => ref.kind === 'case').map((ref) => ref.id))].sort();
  const seeds = [...new Set(refs.filter((ref) => ref.kind === 'seed').map((ref) => ref.id))].sort();
  const usages = [...new Set(refs.map((ref) => ref.usage))].sort();
  // 範囲表記が個々の名前に展開された場合、表の簡易分類では中間名を参照と誤判定する。
  if (present.has(location) ||
      (functionId === 'M04-21' && /^required-screen-[1-6]-006\.csv$/.test(name)) ||
      (functionId === 'M04-13' && name === 'split_replace-024.csv')) {
    if (!usages.includes('入力候補')) usages.push('入力候補');
    usages.sort();
  }
  const hints = [...new Set(refs.flatMap((ref) => ref.hints))].sort();
  const places = [...new Set(refs.map((ref) => `${ref.sourcePath}:${ref.line}[${ref.column}]`))];
  const [decision, reason] = present.has(location) ? ['作成済', ''] :
    (deferred.get(key) ?? (functionId === 'M04-21' && name.endsWith('.csv')
      ? ['実行時生成', '正本が画面から取得した CSV 雛形への追記・保存を指定']
      : ['未判定', '']));
  const extension = name.match(/\.([^.\-]+)(?:-\d+)?$/)?.[1].toLowerCase() ?? '';
  return [functionId, name, extension, usages.join('、'), hints.join('、') || '未判定', decision, reason, present.has(location) ? location : '未配置', cases.join('、'), seeds.join('、'), places.join('、')];
});
writeTsv('named-file-references.tsv', ['機能ID', 'ファイル名', '拡張子', '記述上の用途候補', '内容根拠タグ', '作成判断', '保留理由', 'e2e/fixtures内の配置', '参照ケースID', '参照シードID', '正本出典'], namedRows);
writeTsv('unnamed-file-operations.tsv', ['ケース/シードID', '正本出典', '列', '内容根拠タグ'], unnamed);

// M03/M04 全機能を 0 件も含めて列挙する。入力候補/名前未指定はいずれも文言上の候補である。
function functionSummaryRows(prefix) {
  const ids = [...new Set(sourceFiles.filter((name) => new RegExp(`^${prefix}-\\d\\d_seed_data\\.tsv$`).test(name)).map((name) => name.slice(0, 6)))];
  return ids.map((functionId) => {
  const entries = namedRows.filter((row) => row[0] === functionId);
  const inputs = entries.filter((row) => row[3].includes('入力候補'));
  const unnamedCount = unnamed.filter((row) => row[0].includes(functionId)).length;
  return [functionId, inputs.length,
    inputs.filter((row) => row[5] === '作成済').length,
    inputs.filter((row) => row[5] === '未判定').length,
    inputs.filter((row) => row[5] === '実行時生成').length,
    inputs.filter((row) => row[5] === '保留' || row[5] === '正本矛盾').length,
    entries.length - inputs.length, unnamedCount];
  });
}
const summaryHeader = ['機能ID', '名前付き入力候補', '作成済', '未判定', '実行時生成', '保留・正本矛盾', 'その他名前付き参照', '名前未指定の操作候補'];
writeTsv('m03-function-summary.tsv', summaryHeader, functionSummaryRows('M03'));
writeTsv('m04-function-summary.tsv', summaryHeader, functionSummaryRows('M04'));

const inputCandidates = namedRows.filter((row) => row[3].includes('入力候補')).length;
console.log(`正本 ${sourceFiles.length} ファイル: 名前付き ${namedRows.length} 種類（入力候補 ${inputCandidates}）、名前未指定のファイル操作候補 ${unnamed.length} 行`);
