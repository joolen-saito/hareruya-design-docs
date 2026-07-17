export const meta = {
  name: 'llm-crosscheck',
  description: '機能ごとに付帯表4バグ候補と既知確定課題をLLMが突合し重複を判定',
  phases: [{ title: 'Crosscheck' }],
}
let _a = args
if (typeof _a === 'string') { try { _a = JSON.parse(_a) } catch (e) { _a = [] } }
const ITEMS = Array.isArray(_a) ? _a : []
if (!ITEMS.length) { log('対象なし'); return { error: 'no items' } }
log(`llm-crosscheck: ${ITEMS.length}機能`)

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['fid', 'results'],
  properties: {
    fid: { type: 'string' },
    results: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['cand_idx', 'verdict'],
        properties: {
          cand_idx: { type: 'integer', description: '候補の0始まり番号' },
          verdict: { type: 'string', enum: ['重複', '関連', '新規'], description: '重複=既知と同一欠陥／関連=同一箇所だが論点が別（新規論点として残す）／新規=既知に無い' },
          known_idx: { type: 'integer', description: '重複/関連のとき対応する既知課題の0始まり番号。新規なら-1' },
          reason: { type: 'string', description: '判定理由(60字以内)' },
        },
      },
    },
  },
}
function prompt(it) {
  const cands = it.cands.map((c, i) => `[${i}] 分類=${c.cat} / 設計(あるべき)=${(c.sekkei||'').slice(0,220)} / 判定(実装との差)=${(c.hantei||'').slice(0,220)} / 実装箇所=${(c.fl||[]).map(x=>x[0]+':'+x[1]).slice(0,3).join(', ')}`).join('\n')
  const knowns = it.known.map((k, i) => `[${i}] ${k.title}\n     課題: ${(k.kadai||'').slice(0,200)}`).join('\n')
  return `あなたはQAの重複判定者です。機能 ${it.fid} について、**私のバグ候補**と**既知の確定課題**を突合し、各候補が既知と同一の欠陥かを判定してください。

## 判定基準（厳密に）
- **重複**: 既知課題と**同じ欠陥**を指している（表現が違っても、直す対象が同じ1件）。
- **関連**: 同じ画面/ファイル/近傍だが**論点が別**（例: 既知=「文言が違う」/ 候補=「遷移先URLが未設定」）。→**新規論点として残す**ので重複ではない。
- **新規**: 既知のどれとも異なる。

重要: 同一機能・同一ファイル・近い行番号というだけでは**重複ではありません**。**直すべき欠陥が同一か**で判断してください。私の候補は「設計オラクル起点」で表現が定型的（例「乖離（文言不一致）／要実機確認」）なため、**設計(あるべき)の内容**と既知の症状記述を突き合わせて実質で判断すること。

## 私のバグ候補（${it.cands.length}件）
${cands}

## 既知の確定課題（${it.known.length}件）
${knowns}

全 ${it.cands.length} 件の候補それぞれに verdict を返してください（cand_idx は 0〜${it.cands.length - 1}）。重複/関連なら known_idx に対応する既知の番号を、新規なら -1 を。`
}
const results = await pipeline(ITEMS, (it) =>
  agent(prompt(it), { label: `xc:${it.fid}`, phase: 'Crosscheck', schema: SCHEMA, agentType: 'general-purpose' })
)
const done = results.filter(Boolean)
let dup = 0, rel = 0, nw = 0
for (const r of done) for (const x of (r.results || [])) {
  if (x.verdict === '重複') dup++; else if (x.verdict === '関連') rel++; else nw++
}
log(`判定完了 ${done.length}/${ITEMS.length}機能: 重複${dup} 関連${rel} 新規${nw}`)
return { functions: done.length, dup, rel, new: nw, results: done }
