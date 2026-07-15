export const meta = {
  name: 'overnight-regen',
  description: 'リスク順バッチの結合テストをオラクル独立で再生成し敵対検証で承認まで回す',
  phases: [
    { title: 'Generate' },
    { title: 'Verify' },
    { title: 'Fix' },
  ],
}

// args = バッチ配列 [{fid, detail, it, kubun, oracle, excel_doc, excel_key, excel_ok, title, cat}]
const BATCH = Array.isArray(args) ? args : []
if (!BATCH.length) { log('args にバッチが無い'); return { error: 'no batch' } }
log(`overnight-regen 開始: ${BATCH.length}機能（リスク順）`)

const POLICY = 'integration_test/test-scope-reduction-policy.md'

const GEN_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['fid', 'path', 'gate_pass', 'ncases', 'bugs', 'summary'],
  properties: {
    fid: { type: 'string' },
    path: { type: 'string', description: '書き出したケースmdの相対パス' },
    gate_pass: { type: 'boolean', description: 'gate_checkハード違反なしならtrue' },
    gate_violations: { type: 'string', description: '違反があればその内容、無ければ空' },
    ncases: { type: 'integer', description: '実施ケース数' },
    bugs: { type: 'integer', description: '付帯表4に挙げた仕様乖離(バグ候補)件数' },
    summary: { type: 'string' },
  },
}
const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['approved', 'issues'],
  properties: {
    approved: { type: 'boolean', description: '捏造/オラクル逸脱/過剰主張が無く承認可ならtrue' },
    issues: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['severity', 'desc', 'fix'],
        properties: {
          severity: { type: 'string', enum: ['P1', 'P2', 'P3'] },
          desc: { type: 'string', description: '問題(捏造/オラクル逸脱/限定脱落/網羅漏れ 等)と該当テストID' },
          fix: { type: 'string', description: 'オラクル範囲への具体的な是正案' },
        },
      },
    },
  },
}
const FIX_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['fid', 'path', 'gate_pass', 'approved_now', 'residual', 'summary'],
  properties: {
    fid: { type: 'string' },
    path: { type: 'string' },
    gate_pass: { type: 'boolean' },
    approved_now: { type: 'boolean', description: '全P1/P2を是正し承認水準に達したか' },
    residual: { type: 'string', description: '残る要人手事項（あれば）' },
    summary: { type: 'string' },
  },
}

function genPrompt(f) {
  const excelClause = f.excel_ok
    ? `Excelオラクル: \`excel_to_html/output/${f.excel_doc}\`（機能ID ${f.excel_key}）。抽出: \`python3 integration_test/tools/excel_spec_parser.py ${f.excel_key}\`。gateは --excel でこの文書を渡す。`
    : `Excel索引に該当なし＝詳細設計HTMLを一次オラクルにする。`
  return `あなたは結合テスト再生成のエンジニアです。機能 ${f.fid}（${f.title}／機能区分=${f.kubun}／オラクル=${f.oracle}）の結合テストケースを、**オラクル独立・捏造ゼロ**で再生成し、gateを通すところまでやり切ってください。

## 手順（Bashで実行してよい）
1. 土台生成: \`python3 integration_test/tools/generate_cases.py --html "${f.detail}" --it "${f.it}" --out integration_test/_gen2_${f.fid}.md\`
2. 方針を読む: \`${POLICY}\`（§2判定コード体系・§7-A捏造ゼロ・ゲート）。土台 \`_gen2_${f.fid}.md\` と、オラクル源を読む。
   - ${excelClause}
   - 機能区分=カスタマイズ/現行踏襲なら Excel優先＋詳細設計HTML(\`${f.detail}\`)で補完（同一/類似仕様はExcelが正）。
   - 実ソース(../ec-cube-enterprise 等)は**オラクルにしない**。Excel設計 vs 実装の乖離＝バグ候補を**付帯表4**に file:line で列挙（期待に実装を使わない＝オラクル独立性）。詳細設計のハルシネーションも実ソースで裏取りして是正。
3. ケースmdを \`integration_test/_poc2_${f.fid}.md\` に書く。既存の承認済みPoC（例 \`integration_test/_poc_m05_01_regenerated_cases.md\`）と同じ構成:
   - ヘッダ（機能区分・オラクル源・競合ルール・gate照合コマンド）
   - §0 対象外（Phase2/廃止＝正本明示のみ）§1 共通前提 §2 SEED固定値（合成既知値・fixtureでありオラクルでない）
   - §3 DDT（実在する検証のみ・固定オラクル・行独立）§4 実施ケースTSV（**期待は全てオラクル由来**・各セルに \`${f.excel_ok ? f.excel_doc.slice(0,4) + ':Lxxx' : 'Lxxx'}\` の追跡を明記・根拠列=詳細設計file:line）
   - §5 台帳（OUT/要判定/NO_IF/MERGE・根拠付き）§6 サマリ
   - **付帯表4（仕様乖離＝バグ候補）**: Excel/詳細設計 vs 実ソースの差を file:line で（実バグ検出が目的）
4. gate: \`python3 integration_test/tools/gate_check.py integration_test/_poc2_${f.fid}.md --html "${f.detail}"${f.excel_ok ? ` --excel "excel_to_html/output/${f.excel_doc}"` : ''}\` がハード違反0になるまで直す。

## 厳守（捏造ゼロ）
- 期待結果は**オラクル（Excel優先・沈黙部は詳細設計）由来**で実装から独立。実装値をオラクル化しない。
- オラクルに書かれていない挙動を断定しない（「要実機確認」にする）。限定（「〜の場合のみ」）を落とさない。
- SEEDの合成固定値は捏造でない。行はオラクルに追跡可能であること。
- バッチ/API機能はUI観点でなく、入力=パラメータ/前提データ、期待=処理結果/副作用/レスポンスで書く。

返り値はスキーマ通り（path=書いたmd、gate_pass=最終gate結果、ncases/bugs、summary）。`
}

function verifyPrompt(f, lens) {
  return `あなたは結合テストの敵対レビュアー（観点=${lens}）です。機能 ${f.fid} の再生成ケース \`integration_test/_poc2_${f.fid}.md\` を、忖度なく検証してください。オラクル=${f.oracle}（Excel優先＋詳細設計補完、実ソースは乖離検出専用）。${f.excel_ok ? `Excel=excel_to_html/output/${f.excel_doc}（${f.excel_key}）。` : ''}

観点「${lens}」で特に見る:
- **捏造/オラクル逸脱**: 期待がオラクル(Excel/詳細設計)に追跡できない、実装値をオラクル化している、オラクルに無い挙動を断定している。引用行を実際に読んで内容が一致するか（行番号は在るが内容が言い換えで変質＝ゲート素通りに注意）。
- **限定脱落・モダリティ改変**: 「〜の場合のみ」「〜し得る」が「常に〜する」に変質。
- **網羅漏れ**: オラクルに書かれた検証すべき挙動でケース化されていないもの。
- **付帯表4の妥当性**: 乖離が実ソース file:line で裏取りされ、期待に実装を混入していないか。

該当テストID付きで issues を挙げ、各に具体的なオラクル範囲への fix を。捏造/P1が無ければ approved=true。`
}

function fixPrompt(f, issues) {
  return `あなたは結合テストの修正エンジニアです。機能 ${f.fid} のケース \`integration_test/_poc2_${f.fid}.md\` に対する敵対レビュー指摘を、**オラクル範囲への縮退**で是正してください（指摘対象箇所のみ編集し、過剰修正しない）。

指摘:
${issues.map((x, i) => `${i + 1}. [${x.severity}] ${x.desc}\n   → 是正案: ${x.fix}`).join('\n')}

厳守: 期待はオラクル(Excel優先・沈黙部は詳細設計)由来のみ。オラクルに無い挙動は「要実機確認」に縮退（削除でなく明示）。実装値をオラクル化しない。
是正後、gate再実行: \`python3 integration_test/tools/gate_check.py integration_test/_poc2_${f.fid}.md --html "${f.detail}"${f.excel_ok ? ` --excel "excel_to_html/output/${f.excel_doc}"` : ''}\` がハード違反0であること。
返り値はスキーマ通り（approved_now=全P1/P2を是正し承認水準か）。`
}

const results = await pipeline(
  BATCH,
  // Stage 1: 生成＋prose整形＋gate
  (f) => agent(genPrompt(f), {
    label: `gen:${f.fid}`, phase: 'Generate', schema: GEN_SCHEMA,
    agentType: 'general-purpose',
  }).then((g) => ({ f, gen: g })),

  // Stage 2: 敵対検証×2（correctness / coverage）
  (prev, f) => {
    if (!prev || !prev.gen) return { f, gen: null, verdicts: [] }
    return parallel(['correctness(捏造/オラクル逸脱)', 'coverage(限定脱落/網羅漏れ)'].map((lens) => () =>
      agent(verifyPrompt(prev.f, lens), {
        label: `verify:${prev.f.fid}:${lens.slice(0, 4)}`, phase: 'Verify', schema: VERDICT_SCHEMA,
        agentType: 'general-purpose',
      })
    )).then((vs) => ({ ...prev, verdicts: vs.filter(Boolean) }))
  },

  // Stage 3: 指摘があれば修正（無ければそのまま承認）
  (prev, f) => {
    if (!prev || !prev.gen) return { fid: f.fid, status: '生成失敗', gen: null }
    const issues = (prev.verdicts || []).flatMap((v) => v.issues || [])
      .filter((x) => x.severity === 'P1' || x.severity === 'P2')
    const allApproved = (prev.verdicts || []).length > 0 && prev.verdicts.every((v) => v.approved)
    if (allApproved && issues.length === 0) {
      return {
        fid: f.fid, status: '承認', path: prev.gen.path, gate_pass: prev.gen.gate_pass,
        ncases: prev.gen.ncases, bugs: prev.gen.bugs, residual: '', summary: prev.gen.summary,
      }
    }
    return agent(fixPrompt(prev.f, issues), {
      label: `fix:${f.fid}`, phase: 'Fix', schema: FIX_SCHEMA, agentType: 'general-purpose',
    }).then((fx) => ({
      fid: f.fid, status: fx.approved_now ? '承認' : '要人手',
      path: fx.path, gate_pass: fx.gate_pass, ncases: prev.gen.ncases, bugs: prev.gen.bugs,
      residual: fx.residual || '', summary: fx.summary,
    }))
  },
)

const done = results.filter(Boolean)
const ok = done.filter((r) => r.status === '承認')
const need = done.filter((r) => r.status !== '承認')
log(`完了: 承認 ${ok.length}/${done.length}・要人手/失敗 ${need.length}`)
return {
  total: BATCH.length, approved: ok.length, need_human: need.length,
  results: done.map((r) => ({
    fid: r.fid, status: r.status, gate_pass: r.gate_pass,
    ncases: r.ncases, bugs: r.bugs, path: r.path, residual: r.residual,
  })),
}
