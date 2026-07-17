export const meta = {
  name: 'overnight-gen',
  description: '生成のみ(prose整形+gate)。verify/fixは省き機械検証は呼び出し側で行う',
  phases: [{ title: 'Generate' }],
}
let _a = args
if (typeof _a === 'string') { try { _a = JSON.parse(_a) } catch (e) { _a = [] } }
const BATCH = Array.isArray(_a) ? _a : []
if (!BATCH.length) { log('args にバッチが無い'); return { error: 'no batch' } }
log(`overnight-gen: ${BATCH.length}機能を生成のみ`)
const POLICY = 'integration_test/test-scope-reduction-policy.md'
const GEN_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['fid', 'path', 'gate_pass', 'ncases', 'bugs', 'summary'],
  properties: {
    fid: { type: 'string' }, path: { type: 'string' }, gate_pass: { type: 'boolean' },
    gate_violations: { type: 'string' }, ncases: { type: 'integer' }, bugs: { type: 'integer' }, summary: { type: 'string' },
  },
}
function genPrompt(f) {
  const excelClause = f.excel_ok
    ? `Excelオラクル: \`excel_to_html/output/${f.excel_doc}\`（機能ID ${f.excel_key}）。gateは --excel でこの文書を渡す。`
    : `Excel索引に該当なし＝詳細設計HTMLを一次オラクルにする。`
  const nimClause = f.kubun === '新規実装' ? `\n## ⚠新規実装(オラクルは ${f.excel_key} 自身のExcelのみ)\n- 薄いExcelを超える断定をしない。HTTPステータス/DBテーブル・カラム名/応答クラス名/ログ/CSV列順/From-Toレンジ方向/TX原子性/route実装param/空結果挙動はExcel非明示なら「要実機確認」。姉妹機能や実ソースをオラクル化しない。\n` : ''
  return `あなたは結合テスト再生成のエンジニアです。機能 ${f.fid}（${f.title}／機能区分=${f.kubun}／オラクル=${f.oracle}）の結合テストを**オラクル独立・捏造ゼロ**で再生成し gate を通してください。作業dir /home/y-saito/Developments/hareruya-design-docs。
## 手順(Bash可)
1. 土台: \`python3 integration_test/tools/generate_cases.py --html "${f.detail}" --it "${f.it}" --out integration_test/_gen2_${f.fid}.md\`
2. 方針 \`${POLICY}\` と土台・オラクル源を読む。${excelClause} ${f.kubun === '標準' ? '標準＝実ソースがオラクル。' : 'カスタマイズ/現行踏襲はExcel優先＋詳細設計補完(同一/類似仕様はExcel正)。'}実ソースはオラクルにせずExcel設計vs実装の乖離を**付帯表4**に file:line で列挙(期待に実装を使わない)。
3. ケースmdを \`integration_test/_poc2_${f.fid}.md\` に書く。承認済みPoC \`integration_test/_poc2_m05-19.md\` 相当の構成(ヘッダ/§0対象外/§1共通前提/§2 SEED固定値/§3 DDT/§4実施ケースTSV=期待は全てオラクル由来・各セルに${f.excel_ok ? f.excel_doc.slice(0,4)+':Lxxx' : 'Lxxx'}追跡/§5台帳/§6サマリ/付帯表4)。バッチ/APIはUI観点でなく入力=パラメータ/前提、期待=処理結果/副作用/レスポンス。
4. gate: \`python3 integration_test/tools/gate_check.py integration_test/_poc2_${f.fid}.md --html "${f.detail}"${f.excel_ok ? ` --excel "excel_to_html/output/${f.excel_doc}"` : ''}\` がハード違反0まで直す。
## 厳守(捏造ゼロ)
- 期待はオラクル(Excel優先・沈黙部は詳細設計)由来で実装独立。実装値をオラクル化しない(「実装は」「enterpriseは」「を正典」等の実ソース断定は不可)。オラクルに無い挙動は断定せず「要実機確認」。限定を落とさない。SEED合成固定値は捏造でない。${nimClause}
返り値はスキーマ通り(path/gate_pass/ncases/bugs/summary)。`
}
const results = await pipeline(
  BATCH,
  (f) => agent(genPrompt(f), { label: `gen:${f.fid}`, phase: 'Generate', schema: GEN_SCHEMA, agentType: 'general-purpose' })
)
const done = results.filter(Boolean)
log(`生成完了 ${done.length}/${BATCH.length}`)
return { total: BATCH.length, generated: done.length, results: done.map(r => ({ fid: r.fid, gate_pass: r.gate_pass, ncases: r.ncases, bugs: r.bugs })) }
