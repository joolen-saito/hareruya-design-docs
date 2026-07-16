export const meta = {
  name: 'overnight-fix2',
  description: '新規実装のオラクル範囲逸脱(姉妹機能流用・薄Excel過剰主張)を是正',
  phases: [{ title: 'Audit-Fix' }, { title: 'Recheck' }],
}

let _a = args
if (typeof _a === 'string') { try { _a = JSON.parse(_a) } catch (e) { _a = [] } }
const T = Array.isArray(_a) ? _a : []
if (!T.length) { log('対象なし'); return { error: 'no targets' } }
log(`overnight-fix2: 新規実装${T.length}機能のオラクル範囲逸脱を是正`)

const FIX_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['fid', 'gate_pass', 'fixed_rows', 'summary'],
  properties: {
    fid: { type: 'string' }, gate_pass: { type: 'boolean' },
    fixed_rows: { type: 'integer' }, summary: { type: 'string' },
  },
}
const RC_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['clean', 'remaining'],
  properties: {
    clean: { type: 'boolean' },
    remaining: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['row', 'issue'], properties: { row: { type: 'string' }, issue: { type: 'string' } } } },
  },
}

function fixPrompt(t) {
  const gate = `python3 integration_test/tools/gate_check.py integration_test/_poc2_${t.fid}.md --html "${t.detail}" --excel "excel_to_html/output/${t.excel_doc}"`
  return `あなたは結合テストの修正エンジニアです。作業ディレクトリ /home/y-saito/Developments/hareruya-design-docs。機能 ${t.fid}（**機能区分=新規実装**）のケース \`integration_test/_poc2_${t.fid}.md\` には**オラクル範囲逸脱（P1）**があります。新規実装は **${t.excel_key} 自身のExcel(${t.excel_doc})だけがオラクル**で、詳細設計HTML・実ソース・**姉妹機能の仕様は使えません**。

## 是正すべき違反クラス（全実施ケースの期待欄・テスト項目名を点検）
1. **姉妹機能のオラクル流用**: ${t.excel_key} 以外の機能ID（例 A01-01 等）のExcel行や仕様を期待の根拠にしている → 削除し ${t.excel_key} 自身のExcel行に置換、無ければ「要実機確認」に縮退。
2. **薄いExcelからの過剰具体化**: ${t.excel_key} のExcelが抽象的にしか書いていない挙動を、実装や姉妹機能から具体化・断定している → ${t.excel_key} のExcelが明示する範囲まで抽象化し、超える部分は「要実機確認」。
3. **実装概念の混入**: 「enqueue」「Applier」「dtb_xxx を正典」等、${t.excel_key} のExcelに無い実装由来語 → 期待から除去し付帯表4（実ソース file:line）へ。
4. **未規定挙動の断定的ケース化**: テスト項目名で「〜する」と断定しつつ期待は要実機確認、のような不整合 → テスト項目名も要実機確認に合わせる。
${t.hint ? `\n## 外部レビュー(codex)の具体指摘\n${t.hint}\n` : ''}
## 完了条件
- 是正後 gate: \`${gate}\` がハード違反0。
- 期待は ${t.excel_key} のExcel(${t.excel_doc.slice(0, 4)}:Lxxx)に追跡できるもの／要実機確認／付帯表4ポインタのみ。姉妹機能ID・実装概念の断定を残さない。
返り値はスキーマ通り。`
}

function rcPrompt(t) {
  return `あなたは新規実装機能の厳格な敵対レビュアーです。機能 ${t.fid}（新規実装＝オラクルは ${t.excel_key} 自身のExcel ${t.excel_doc} のみ）のケース \`integration_test/_poc2_${t.fid}.md\` の全実施ケース（期待欄・テスト項目名）を精査し、次の逸脱が残っていないか判定:
(1) ${t.excel_key} 以外の機能IDのExcel/仕様を根拠にしている、(2) 薄いExcelを超えた過剰具体化・断定、(3) 実装由来概念(enqueue/Applier/DB正典 等)の期待混入、(4) 未規定挙動の断定ケース化。
各違反を {row, issue} で。1件も無く全期待が ${t.excel_key} のExcel追跡or要実機確認or付帯表4ポインタなら clean=true。`
}

const results = await pipeline(
  T,
  (t) => agent(fixPrompt(t), { label: `fix2:${t.fid}`, phase: 'Audit-Fix', schema: FIX_SCHEMA, agentType: 'general-purpose' }).then((fx) => ({ t, fx })),
  (prev, t) => {
    if (!prev || !prev.fx) return { fid: t.fid, status: '是正失敗' }
    return agent(rcPrompt(prev.t), { label: `rc2:${prev.t.fid}`, phase: 'Recheck', schema: RC_SCHEMA, agentType: 'general-purpose' })
      .then((rc) => ({ fid: t.fid, status: (rc.clean && prev.fx.gate_pass) ? '是正完了' : '要人手', gate_pass: prev.fx.gate_pass, clean: rc.clean, fixed_rows: prev.fx.fixed_rows, remaining: rc.remaining || [] }))
  },
)
const done = results.filter(Boolean)
log(`是正完了 ${done.filter((r) => r.status === '是正完了').length}/${done.length}`)
return { total: T.length, results: done.map((r) => ({ fid: r.fid, status: r.status, gate_pass: r.gate_pass, clean: r.clean, fixed_rows: r.fixed_rows, remaining: (r.remaining || []).length })) }
