export const meta = {
  name: 'm-series-e2e-coverage-audit',
  description: 'HTML設計書の各節・テスト観点表の全行が E2Eケース表に網羅されているかを機能ごとに codex 監査し、抜け漏れを追記・是正する',
  phases: [{ title: 'CoverageAudit', detail: 'codexで設計書節×観点表行の網羅を監査し、未反映の挙動/未分類の観点/正常×異常の欠落を追記・再分類' }],
}

const REPO = '/home/y-saito/Developments/hareruya-design-docs'
const EE = '/home/y-saito/Developments/ec-cube-enterprise'

const AUDIT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['id', 'designSectionsUncovered', 'viewpointRowsUnclassified', 'pairsMissing', 'casesAdded', 'reclassified', 'specUpdated', 'compileOk', 'remaining', 'summary'],
  properties: {
    id: { type: 'string' },
    designSectionsUncovered: { type: 'integer', description: 'codexが指摘した「設計書にあるがE2E未反映」の節/挙動数' },
    viewpointRowsUnclassified: { type: 'integer', description: '観点表/IT母集合で未分類・誤分類だった行数' },
    pairsMissing: { type: 'integer', description: '正常×異常の対の欠落数' },
    casesAdded: { type: 'integer', description: '本監査で追記したE2Eケース数' },
    reclassified: { type: 'integer', description: '区分を是正した観点行数' },
    specUpdated: { type: 'boolean' },
    compileOk: { type: 'boolean' },
    remaining: { type: 'string', description: '是正後も残る要確認' },
    summary: { type: 'string' },
  },
}

function prompt(d) {
  const module = (d.id.match(/^([a-z]\d+)_/) || [])[1] || 'misc'
  const kind = d.type === 'api' ? 'api' : d.type === 'batch' ? 'batch' : 'screen'
  const twoLayer = kind !== 'screen'
  const cases = `integration_test/e2e/${d.id}_e2e_cases.md`
  const page = `e2e/pages/admin/${module}/${d.id}.page.ts`
  const spec = `e2e/spec/admin/${module}/${d.id}.spec.ts`
  const layerAudit = twoLayer
    ? '\n(E) 両レイヤ網羅: 画面に出ないがAPIレスポンス/HTTPステータス/バッチ終了ステータス/出力で観測可能な挙動が、E2E自動化(API/統合)に写像されず誤って対象外にされていないもの。API/統合のエンドポイント・コマンドが file:line 根拠で実在し創作が無いか。Webhook受信(売上02/返品12)・再連携・バッチ実行の正常×異常(形式不正/重複/順序/部分失敗/スロットリング/対象0件/異常終了)の対の欠落。'
    : ''
  return `あなたは網羅監査エンジニアです。機能 **${d.id}** の既存E2Eケース表に「抜け漏れ」が無いかを、**HTML設計書を節単位・テスト観点表を行単位**で再点検し、不足を追記・是正します。本リポジトリでPlaywrightは実行しません（雛形）。生成済み成果物の体裁は維持し、**網羅性の穴のみを埋める**のが目的（無関係な書き換えはしない）。

## 既存成果物
- ケース表: ${REPO}/${cases}
- spec: ${REPO}/${spec} ／ Page Object: ${REPO}/${page}

## 正典（網羅の基準）
- HTML設計書(一次): ${REPO}/${d.designHtml}（正本md: ${REPO}/${d.designMd}）
- テスト観点表: ${REPO}/integration_test/integration-test-viewpoints.md
- 既存IT cases(観点母集合): ${REPO}/${d.itCases}
- 実装(セレクタ位置情報のみ): ${EE}/src/Eccube

## 手順
1. **codexで網羅監査**（読み取り専用・抜け漏れ特化）:
\`\`\`bash
cd ${REPO} && timeout 560 codex exec --sandbox read-only - <<'PROMPT'
あなたはE2E網羅性の監査官です。読み取り専用で、機能 ${d.id} のE2Eケース表が設計書・観点表を抜け漏れなく網羅しているかだけを厳密に点検してください。
対象ケース表: ${cases}
基準: HTML設計書 ${d.designHtml}（正本 ${d.designMd}）/ 観点表 integration_test/integration-test-viewpoints.md / 既存IT ${d.itCases} / 実装 ${EE}/src/Eccube
次を列挙してください（無ければ「なし」）:
(A) 設計書の各節（利用者視点の入口/フロント挙動/処理フロー/判定順序の各分岐/表示メッセージ(正常・エラー・フラッシュ)/画面遷移/権限・認可/バリデーション・入力項目(境界含む)/試行制限/Cookie・セッション/DB操作）のうち、**テスト可能な挙動なのにE2Eケース(自動化/手動/対象外いずれにも)写像されていない**もの。設計書にあって観点表に無い挙動も対象。
(B) 既存IT cases(観点母集合)の行で、**未分類または誤分類**のもの（付帯表2b/付帯表2の集計が母集合と一致せず未分類0が偽の場合を含む）。
(C) 各ユーザーフロー/画面で**正常系×異常系の対が欠けている**もの（判定順序の各失敗分岐・表示メッセージの各エラーに対応する異常系の欠落）。
(D) 設計書網羅マトリクス(付帯表5)が「カバー」と主張するが実体が無い/test.fixmeのみ等の**過大主張**。${layerAudit}
各指摘に設計書の節名や観点ID/IT行番号を添えて具体的に。網羅の穴のみに集中し、文体や軽微事項は対象外。
PROMPT
\`\`\`
2. codexの (A)〜(D) を精査し、**実在する抜け漏れを是正**:
   - (A)未反映の挙動 → ケース表TSVに新規E2Eケースを追記し、付帯表1(セレクタ/根拠)・付帯表5(網羅マトリクス)へ写像。観測可能なら E2E自動化（specにも実装。手動/対象外なら理由付きで分類のみ）。
   - (B)未分類/誤分類 → 付帯表2b の行単位分類と付帯表2集計を是正し**未分類0を真に成立**させる（母集合件数と一致）。
   - (C)対の欠落 → 対応する正常系/異常系ケースを追記。
   - (D)過大主張 → 付帯表5を「部分カバー/保留(要確認)」へ是正し、test.fixmeと実装済みを区別。
   - **オラクル独立性厳守**: 追記ケースの期待結果も設計書/観点表由来（実装文言・Form制約・Cookie名を期待値化しない）。セレクタはTwig由来file:line根拠のみ（無ければ要実機確認）。テストは仕様どおりに書き実装へ寄せない。
   - 新規の自動化ケースを spec に足す場合、import相対パスは spec/admin/${module}/ から \`../../../\`。手動/対象外はケース表のみ（specに大量fixmeを残さない）。
3. \`cd ${REPO}/e2e && npx playwright test --list spec/admin/${module}/${d.id}.spec.ts\` でコンパイル確認。ケース表に \`</content>\` 等のタグ混入が無いこと。

返り値はStructuredOutputで {id, designSectionsUncovered, viewpointRowsUnclassified, pairsMissing, casesAdded, reclassified, specUpdated, compileOk, remaining, summary}。抜け漏れが無ければ各数値0で「網羅確認済」と要約。`
}

// 対象（args非対応のため埋め込み。群ごとに差し替え）。
// パイロット: 在庫管理＋スマレジ（両レイヤ）。
const ITEMS = [
  { id: 'a01_01_api_stock_smaregi_stock_sync', designMd: 'functions/ec-cube-enterprise/a01-01_api_stock_smaregi_stock_sync.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/a01-01_api_stock_smaregi_stock_sync.html', itCases: 'integration_test/a01_01_api_stock_smaregi_stock_sync_it_cases.md', repo: 'ec-cube-enterprise', module: 'a01', type: 'api' },
  { id: 'a01_02_api_stock_smaregi_webhook_error_retry', designMd: 'functions/ec-cube-enterprise/a01-02_api_stock_smaregi_webhook_error_retry.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/a01-02_api_stock_smaregi_webhook_error_retry.html', itCases: 'integration_test/a01_02_api_stock_smaregi_webhook_error_retry_it_cases.md', repo: 'ec-cube-enterprise', module: 'a01', type: 'api' },
  { id: 'b01_02_batch_data_stock_shortage', designMd: 'functions/ec-cube-enterprise/b01-02_batch_data_stock_shortage.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/b01-02_batch_data_stock_shortage.html', itCases: 'integration_test/b01_02_batch_data_stock_shortage_it_cases.md', repo: 'ec-cube-enterprise', module: 'b01', type: 'batch' },
  { id: 'b01_03_batch_data_stock_warning', designMd: 'functions/ec-cube-enterprise/b01-03_batch_data_stock_warning.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/b01-03_batch_data_stock_warning.html', itCases: 'integration_test/b01_03_batch_data_stock_warning_it_cases.md', repo: 'ec-cube-enterprise', module: 'b01', type: 'batch' },
]

phase('CoverageAudit')
log(`網羅監査 ${ITEMS.length}機能: ` + ITEMS.map((i) => i.id).join(', '))
const out = await pipeline(
  ITEMS,
  (d) => agent(prompt(d), { label: `audit:${d.id}`, phase: 'CoverageAudit', schema: AUDIT_SCHEMA }),
)
return out.filter(Boolean)
