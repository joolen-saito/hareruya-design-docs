export const meta = {
  name: 'm-series-e2e-review',
  description: '既存E2E成果物に対し機能ごとに codex 読み取り専用レビューを実施し高/中指摘を是正（欠落ファイルは補完）',
  phases: [{ title: 'CodexReviewFix', detail: '機能ごとに codex レビューし是正。spec/page欠落時は先に補完生成' }],
}

const REPO = '/home/y-saito/Developments/hareruya-design-docs'
const EE = '/home/y-saito/Developments/ec-cube-enterprise'

const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['id', 'generatedMissing', 'high', 'medium', 'low', 'fixesApplied', 'remaining', 'compileOk', 'summary'],
  properties: {
    id: { type: 'string' },
    generatedMissing: { type: 'string', description: '補完生成したファイル（無ければ none）' },
    high: { type: 'integer' }, medium: { type: 'integer' }, low: { type: 'integer' },
    fixesApplied: { type: 'integer' },
    remaining: { type: 'string' }, compileOk: { type: 'boolean' }, summary: { type: 'string' },
  },
}

function prompt(d) {
  const module = (d.id.match(/^([a-z]\d+)_/) || [])[1] || 'misc'
  const kind = d.type === 'api' ? 'api' : d.type === 'batch' ? 'batch' : 'screen'
  const twoLayer = kind !== 'screen'
  const cases = `integration_test/e2e/${d.id}_e2e_cases.md`
  const page = `e2e/pages/admin/${module}/${d.id}.page.ts`
  const spec = `e2e/spec/admin/${module}/${d.id}.spec.ts`
  const apiSpec = `e2e/spec/${kind}/${module}/${d.id}.${kind}.spec.ts`
  const apiHelper = `e2e/pages/${kind}/${module}/${d.id}.${kind}.ts`
  const layerList = twoLayer ? ` / ${apiSpec} / ${apiHelper}` : ''
  const layerPoint = twoLayer
    ? ' (9)両レイヤ網羅: 各観点が E2E自動化(UI)/(API/統合)/手動/対象外 に分類され、APIレスポンス・終了ステータス・出力で観測可能なものを画面非表示だけで対象外にしていないか。API/統合のエンドポイント/コマンドが file:line 根拠の実在で創作が無いか。Webhook/バッチの正常×異常の対が揃い、期待値がレスポンス形・スマレジ実装挙動由来になっていないか。'
    : ''
  return `あなたはレビュー反映エンジニアです。機能 **${d.id}**（種別: ${kind}）の既存E2E成果物を **codex(読み取り専用)** にレビューさせ、高/中指摘を是正します。本リポジトリでPlaywrightは実行しません（雛形）。

## 成果物（既存。再生成しない）
- ${REPO}/${cases}
- ${REPO}/${page}
- ${REPO}/${spec}${twoLayer ? `
- ${REPO}/${apiSpec}（API/統合レイヤ）
- ${REPO}/${apiHelper}（ペイロード/ヘルパ）` : ''}

## 事前チェック（欠落補完）
1. 上記3ファイルの存在を確認。**${spec} または ${page} が欠落している場合のみ**、先に補完生成する:
   - スキル ${REPO}/.cursor/skills/e2e-test-cases/SKILL.md・TEMPLATE.md と参照 ${REPO}/e2e/spec/admin/two_factor_auth.spec.ts / ${REPO}/e2e/pages/admin/two_factor_auth.page.ts に従う。
   - 既存の ${cases}（ケース表）を正として、その E2E自動化ケースを実装する spec / Page Object を作る。
   - import: spec/page から e2e ルートは \`../../../\`。spec は \`import {test,expect,Page} from "@playwright/test"\` ＋ \`import {AdminLoginPage} from "../../../pages/admin/login.page"\` ＋ 生成Page。env-gated test.skip(!HAS_CREDS: ECCUBE_ADMIN_USER/PASS)。手動/対象外はspecに残さず、自動化予定/要実機のみ test.fixme。
   - セレクタは ${EE}/src/Eccube の Twig/Form 由来 file:line 根拠のみ（創作禁止、無ければ要実機確認）。期待結果は ${cases}（設計書/観点表由来）に一致させオラクル独立性を保つ。
   - cases.md は既に存在するため**書き換えない**（codexで高/中指摘があれば後段で是正）。

## codexレビュー
2. 次を実行（読み取り専用・タイムアウト長め）:
\`\`\`bash
cd ${REPO} && timeout 560 codex exec --sandbox read-only - <<'PROMPT'
あなたはE2Eテスト設計のレビュアです。読み取り専用で機能 ${d.id}（種別 ${kind}）の成果物をレビューし、深刻度(高/中/低)付きの指摘を簡潔に列挙してください。
対象: ${cases} / ${page} / ${spec}${layerList}
正典: 設計書 ${d.designHtml}（正本 ${d.designMd}）/ 観点表 integration_test/integration-test-viewpoints.md / 既存IT ${d.itCases} / 実装 ${EE}/src/Eccube。
重点: (1)設計書の各節(入口/処理フロー/判定順序/表示メッセージ/画面遷移/権限/バリデーション/DB操作/Cookie等)が抜け漏れなくE2E(自動化(UI)/自動化(API/統合)/手動/対象外+理由)へ写像され網羅マトリクス未カバー0が妥当か。(2)観点表母集合の全行が分類され未分類0で監査可能か。(3)オラクル独立性(期待結果が設計書/観点表由来か・Form制約やCookie名・レスポンス形等の実装由来オラクル混入が無いか)。(4)セレクタ/APIパス/コマンド根拠(file:line)が正しく創作が無いか。(5)正常系と異常系の対が揃うか。(6)Playwright実装の正しさ(import相対パス・skip/fixme方針・URLアサーション・request使用)。(7)不具合候補表の妥当性・テストを実装に寄せていないか。(8)ケース表TSVが14列固定で、末尾4列が実施者・実施日・結果・失敗理由かつ空欄か。${layerPoint}
抜け漏れ・誤認識・オラクル混入・セレクタ/パス創作を具体的に指摘してください。
PROMPT
\`\`\`
3. codex出力の**高・中指摘を成果物へ反映**（テストは仕様どおりのまま＝実装へ寄せない。Cookie名/Form制約/レスポンス形の期待値固定はオラクル混入として除去）。残課題は\`要確認\`で明記。
4. \`cd ${REPO}/e2e && npx playwright test --list\` で対象spec（${twoLayer ? '両レイヤ' : 'admin'}）のコンパイル確認。

返り値はStructuredOutputで {id, generatedMissing, high, medium, low, fixesApplied, remaining, compileOk, summary}。`
}

// 対象（args非対応のため埋め込み。群ごとに差し替え）。
// パイロット: 在庫管理＋スマレジ（両レイヤ）。
const ITEMS = [
  { id: 'a01_01_api_stock_smaregi_stock_sync', designMd: 'functions/ec-cube-enterprise/a01-01_api_stock_smaregi_stock_sync.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/a01-01_api_stock_smaregi_stock_sync.html', itCases: 'integration_test/a01_01_api_stock_smaregi_stock_sync_it_cases.md', repo: 'ec-cube-enterprise', module: 'a01', type: 'api' },
  { id: 'a01_02_api_stock_smaregi_webhook_error_retry', designMd: 'functions/ec-cube-enterprise/a01-02_api_stock_smaregi_webhook_error_retry.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/a01-02_api_stock_smaregi_webhook_error_retry.html', itCases: 'integration_test/a01_02_api_stock_smaregi_webhook_error_retry_it_cases.md', repo: 'ec-cube-enterprise', module: 'a01', type: 'api' },
  { id: 'b01_02_batch_data_stock_shortage', designMd: 'functions/ec-cube-enterprise/b01-02_batch_data_stock_shortage.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/b01-02_batch_data_stock_shortage.html', itCases: 'integration_test/b01_02_batch_data_stock_shortage_it_cases.md', repo: 'ec-cube-enterprise', module: 'b01', type: 'batch' },
  { id: 'b01_03_batch_data_stock_warning', designMd: 'functions/ec-cube-enterprise/b01-03_batch_data_stock_warning.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/b01-03_batch_data_stock_warning.html', itCases: 'integration_test/b01_03_batch_data_stock_warning_it_cases.md', repo: 'ec-cube-enterprise', module: 'b01', type: 'batch' },
]

// Ph2（フェーズ2以降で対応）機能はE2E対象外（Excel設計書の図形注記が根拠）。
const EXCLUDED_STEMS = new Set([
  'm03_43_admin_product_product_simple_low_price_csv_export',
  'm04_06_admin_stock_stock_shortage_csv_export',
  'm04_07_admin_stock_stock_warning_csv_export',
  'm06_13_admin_store_purchase_purchase_store_product_cancel_csv_export',
  'm08_11_admin_customer_customer_analysis_tag_master',
  'm08_15_admin_customer_customer_analysis_tag_csv_export',
  'm08_16_admin_customer_customer_analysis_tag_csv_import',
  'a06_14_api_store_purchase_otc_buy_order_partial_cancel_sync',
  'b01_02_batch_data_stock_shortage',
  'b01_03_batch_data_stock_warning',
  'f02_05_front_global_nav_global_nav_notification',
])
const RUN_ITEMS = ITEMS.filter((i) => !EXCLUDED_STEMS.has(i && i.id))

phase('CodexReviewFix')
log(`codexレビュー ${RUN_ITEMS.length}機能: ` + RUN_ITEMS.map((i) => i.id).join(', '))
const out = await pipeline(
  RUN_ITEMS,
  (d) => agent(prompt(d), { label: `review:${d.id}`, phase: 'CodexReviewFix', schema: REVIEW_SCHEMA }),
)
return out.filter(Boolean)
