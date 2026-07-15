export const meta = {
  name: 'overnight-fix',
  description: '期待欄の実装値混入(オラクル独立性違反)を是正し厳格再検証',
  phases: [{ title: 'Fix' }, { title: 'Recheck' }],
}

let _a = args
if (typeof _a === 'string') { try { _a = JSON.parse(_a) } catch (e) { _a = [] } }
const TARGETS = Array.isArray(_a) ? _a : []
if (!TARGETS.length) { log('是正対象なし'); return { error: 'no targets' } }
log(`overnight-fix: ${TARGETS.length}機能のオラクル独立性違反を是正`)

const FIX_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['fid', 'path', 'gate_pass', 'fixed_rows', 'summary'],
  properties: {
    fid: { type: 'string' }, path: { type: 'string' },
    gate_pass: { type: 'boolean' },
    fixed_rows: { type: 'integer', description: '是正した行数' },
    summary: { type: 'string' },
  },
}
const RECHECK_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['clean', 'remaining'],
  properties: {
    clean: { type: 'boolean', description: '期待欄に実装値混入が残らずオラクル独立ならtrue' },
    remaining: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['row', 'issue'],
        properties: { row: { type: 'string' }, issue: { type: 'string' } },
      },
    },
  },
}

function fixPrompt(t) {
  const gate = `python3 integration_test/tools/gate_check.py integration_test/_poc2_${t.fid}.md --html "${t.detail}"${t.excel_ok ? ` --excel "excel_to_html/output/${t.excel_doc}"` : ''}`
  return `あなたは結合テストの修正エンジニアです。作業ディレクトリ /home/y-saito/Developments/hareruya-design-docs。機能 ${t.fid} のケース \`integration_test/_poc2_${t.fid}.md\` は、**期待欄に実装実態を混入**しており**オラクル独立性違反（捏造）**です。外部レビューで検出された失敗モードです。

## 是正対象行（期待欄に実装値混入の疑い）
${t.leak_rows.join(', ')}
※これ以外の行も、期待欄に「実装は〜」「enterpriseは〜」「pf-eccube3現行は〜」「実装済み/未実装」等の**実装実態の断定**があれば同様に是正する。

## 是正ルール（厳守）
1. **期待欄＝オラクル(Excel優先・沈黙部は詳細設計HTML)由来の「あるべき仕様」のみ**。実装がどうなっているかは期待に書かない。
2. 実装との差（バグ候補）は**付帯表4へ file:line で移動**（例「dtb_player.point に加算＝enterprise:LostPoints.php:49」）。期待欄からは実装比較を削除。
3. オラクルが沈黙/競合していて仕様が確定できない挙動は、期待を**「要実機確認」に縮退**（削除でなく明示）。付帯表4への**ポインタ**（「実装差は付帯表4#N」）は残してよい（断定でないため）。
4. 各期待セルには \`${t.excel_ok ? t.excel_doc.slice(0, 4) + ':Lxxx' : 'Lxxx'}\` のオラクル追跡を保つ。オラクルに追跡できない期待は書かない。
5. 指摘行の是正に集中し、過剰修正しない。

## 完了条件
- 是正後、gate再実行して**ハード違反0**: \`${gate}\`
- 期待欄に実装実態の断定が残っていないこと（付帯表4ポインタは可）。

返り値はスキーマ通り（fixed_rows=是正した行数、gate_pass=最終gate結果）。`
}

function recheckPrompt(t) {
  return `あなたは厳格な敵対レビュアーです。機能 ${t.fid} のケース \`integration_test/_poc2_${t.fid}.md\` の**全実施ケースTSVの期待欄**を精査し、**実装実態の断定（オラクル独立性違反）が残っていないか**だけを判定してください。オラクル=Excel優先＋詳細設計補完、実ソースはオラクルにしない。

違反の例: 期待欄に「実装は〜」「enterpriseは〜」「pf-eccube3現行は〜」「実装済み/未実装」「コード上は〜」等の実装実態を断定。ただし付帯表4への**ポインタ**（「実装差は付帯表4#N」「要実機確認」）は違反でない。

各違反を {row, issue} で挙げ、1件も無ければ clean=true。期待がオラクル(${t.excel_ok ? t.excel_doc.slice(0, 4) : '詳細設計'}:Lxxx)に追跡できているかも併せて確認。`
}

const results = await pipeline(
  TARGETS,
  (t) => agent(fixPrompt(t), {
    label: `fix:${t.fid}`, phase: 'Fix', schema: FIX_SCHEMA, agentType: 'general-purpose',
  }).then((fx) => ({ t, fix: fx })),
  (prev, t) => {
    if (!prev || !prev.fix) return { fid: t.fid, status: '是正失敗', clean: false }
    return agent(recheckPrompt(prev.t), {
      label: `recheck:${prev.t.fid}`, phase: 'Recheck', schema: RECHECK_SCHEMA, agentType: 'general-purpose',
    }).then((rc) => ({
      fid: t.fid,
      status: (rc.clean && prev.fix.gate_pass) ? '是正完了' : '要人手',
      gate_pass: prev.fix.gate_pass, clean: rc.clean,
      fixed_rows: prev.fix.fixed_rows, remaining: rc.remaining || [],
      summary: prev.fix.summary,
    }))
  },
)

const done = results.filter(Boolean)
const ok = done.filter((r) => r.status === '是正完了')
log(`是正完了 ${ok.length}/${done.length}`)
return {
  total: TARGETS.length, fixed_clean: ok.length,
  results: done.map((r) => ({
    fid: r.fid, status: r.status, gate_pass: r.gate_pass, clean: r.clean,
    fixed_rows: r.fixed_rows, remaining: (r.remaining || []).length,
  })),
}
