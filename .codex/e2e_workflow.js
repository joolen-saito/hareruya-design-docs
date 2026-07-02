export const meta = {
  name: 'e2e-generate',
  description: '機能(画面 m / API a / バッチ b)のE2Eケース表＋Playwright雛形を生成し、機能ごとにcodexレビュー＆是正する。a*/b*は両レイヤ(API/統合＋UI)網羅',
  phases: [
    { title: 'Generate', detail: '設計HTML＋観点表＋IT cases からE2Eケース表とPage Object/specを生成（a*/b*は両レイヤ）' },
    { title: 'CodexReviewFix', detail: '機能ごとに codex 読み取り専用レビューし高/中指摘を是正' },
  ],
}

const REPO = '/home/y-saito/Developments/hareruya-design-docs'
const EE = '/home/y-saito/Developments/ec-cube-enterprise'

const GEN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'screenExists', 'casesPath', 'pagePath', 'specPath', 'automated', 'manual', 'outOfScope', 'notes'],
  properties: {
    id: { type: 'string' },
    screenExists: { type: 'boolean', description: '刷新先ec-cube-enterpriseに該当画面が存在しセレクタ導出できたか' },
    casesPath: { type: 'string' },
    pagePath: { type: 'string' },
    specPath: { type: 'string' },
    automated: { type: 'integer', description: 'E2E自動化に分類したIT観点行数' },
    manual: { type: 'integer' },
    outOfScope: { type: 'integer' },
    notes: { type: 'string', description: '要確認・刷新先未存在・特記事項' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'high', 'medium', 'low', 'fixesApplied', 'remaining', 'compileOk', 'summary'],
  properties: {
    id: { type: 'string' },
    high: { type: 'integer' },
    medium: { type: 'integer' },
    low: { type: 'integer' },
    fixesApplied: { type: 'integer' },
    remaining: { type: 'string', description: '未是正の残課題（要確認含む）' },
    compileOk: { type: 'boolean', description: 'npx playwright test --list が当該specを含めて通るか' },
    summary: { type: 'string' },
  },
}

function genPrompt(d) {
  const module = (d.id.match(/^([a-z]\d+)_/) || [])[1] || 'misc'
  const seq = (d.id.match(/^[a-z]\d+_(\d+)_/) || [])[1] || '00'
  const kind = d.type === 'api' ? 'api' : d.type === 'batch' ? 'batch' : 'screen'
  const twoLayer = kind !== 'screen'
  const layerBlock = twoLayer
    ? `## 両レイヤ網羅（本機能は ${kind}＝画面を伴わない機能仕様。SKILL.md「機能仕様書（画面を伴わない）の扱い」必読）
- 各観点を \`E2E自動化(UI)\` / \`E2E自動化(API/統合)\` / \`手動\` / \`対象外\` に分類（画面に出ないだけで対象外にしない＝APIレスポンス/HTTPステータス/終了ステータス/出力で観測可能なら API/統合）。
- **API/統合レイヤ**: ${EE}/src/Eccube の Controller(ルート=HTTPメソッド+パス・認証方式)／Command(\`AsCommand\`名)を file:line 根拠で特定（${kind === 'api' ? '例: POST /smaregi/stocks 等のWebhook/再連携API' : '例: bin/console のバッチコマンド'}）。創作禁止・無ければ要実機確認。期待値は設計書/観点表由来（レスポンス形・スマレジ実装挙動を流用しない）。
- **UIレイヤ**: 本機能の結果が管理画面に現れる範囲（在庫数反映・在庫変動履歴一覧・在庫切れ/警告一覧・入荷通知）を観測可能ならUIケース化。
- 正常×異常の対（受信: 売上02/返品12 × 形式不正・重複・順序・部分失敗・スロットリング時ロールバック ／ バッチ: 対象あり・対象0件・異常終了）。
- スマレジ実環境連携・実メール・時刻依存は手動/対象外（理由付き）。起動口が実機依存のバッチ/Webhookは spec で test.fixme(理由付き)。
`
    : ''
  return `あなたはE2Eテスト設計エンジニアです。ハーネス \`e2e-test-cases\` スキルに厳密に従い、機能 **${d.id}**（種別: ${kind}）のE2Eテストケース表とPlaywright雛形を生成します。本リポジトリでPlaywrightは実行しません（雛形）。

${layerBlock}

## 必読（先に読む）
- スキル: ${REPO}/.cursor/skills/e2e-test-cases/SKILL.md / CHECKLIST.md / TEMPLATE.md
- 完成参照(この体裁・粒度に揃える): ${REPO}/integration_test/e2e/m01_02_admin_login_two_factor_auth_e2e_cases.md と ${REPO}/e2e/spec/admin/two_factor_auth.spec.ts と ${REPO}/e2e/pages/admin/two_factor_auth.page.ts

## 入力（オラクル）
- HTML設計書(一次オラクル): ${REPO}/${d.designHtml} （正本md: ${REPO}/${d.designMd}）。**期待結果は必ず設計書/観点表由来**。
- テスト観点表: ${REPO}/integration_test/integration-test-viewpoints.md （IT-IDと観点名の正）
- 既存IT cases(観点母集合・機能固有で内容が濃い): ${REPO}/${d.itCases} 。全行を分類対象にする。
- セレクタ源(位置情報のみ・UIレイヤ): ${EE}/src/Eccube （Resource/template/admin/**, Form/Type/**, Controller/Admin/**, Resource/locale/messages.ja.yaml,validators.ja.yaml）
- エンドポイント/コマンド源(位置情報のみ・API/統合レイヤ): ${EE}/src/Eccube （Controller/**=ルート(メソッド+パス)・認証, Command/**=AsCommand名, ルーティング定義）。Webhookパス・コマンド名は file:line 根拠で導出（創作禁止）。
- 設計源リポ: ${d.repo}（pf-eccube3の場合は旧システムのリバース＝**基本設計・観点表を上位オラクル**とし、刷新先ec-cube-enterpriseとの乖離は不具合候補に出す）

## オラクル独立性（最重要）
- 期待結果(合否)は設計書/観点表/基本設計から導く。実装の現挙動・POM見出し・Form制約(min/max/NotBlank)・Cookie名を期待値に流用しない。
- 実装から取るのはセレクタ(file:line根拠)のみ。仕様と実装の食い違いは「不具合候補」表に出し、テストは仕様どおりに書く。創作セレクタ禁止＝根拠が無ければ\`要実機確認\`。

## 手順
1. 設計HTML(またはmd)とIT casesと観点表を読み、画面・操作・分岐・表示メッセージ・状態遷移・バリデーション・権限・DB副作用を棚卸し。
2. ec-cube-enterprise から該当画面のController/Twig/FormTypeを特定（設計書の「利用者視点の入口」のURL/route、機能キーワードでgrep）。Symfony FormのgetBlockPrefixからDOM idを導出。**刷新先に画面が存在しない場合は screenExists=false とし、E2Eは\`対象外/要確認\`で理由明記（創作しない）**。
3. 画面タイプ \`${d.type}\` の方針で観測可能な範囲を決める:
   - search_list/list: 検索フォーム・ボタン・一覧表示・ページング・並び順（件数厳密一致は間接）
   - edit/register_edit/crud: 入力欄・必須/形式バリデーション・保存成功メッセージ・遷移・(間接)永続化
   - csv_export/pdf_export/print: ダウンロード発火・HTTP応答・ファイル名（**内容は手動**）
   - csv_import: アップロード・取込結果メッセージ・バリデーションエラー（取込後DB値は間接/手動）
   - bulk: チェック選択・一括処理・確認・結果メッセージ
   - mail: 送信操作・成功メッセージ（**実受信/本文は手動**）
   - summary/analysis/status: ウィジェット/チャート表示・データロード・ステータス遷移（集計数値は手動/DB依存）
   - api: Webhook受信/API呼び出し→HTTPステータス・レスポンス・受信検証・冪等性(重複/順序/部分失敗)・在庫更新(UI観測)。外部障害(スロットリング/不通)は手動 or 要実機確認(fixme)
   - batch: 起動→終了ステータス・出力・対象抽出条件・対象0件no-op・異常終了。起動口が実機依存なら test.fixme、結果はUI(在庫切れ/警告一覧・通知)で補完
   正常系(最低1本)＋設計書の判定順序/エラー/バリデーション各分岐の異常系を必ず対にする。
4. **出力ファイル3点を書く**（既存があれば上書き再生成）:
   - ケース表: ${REPO}/${d.casesPath}
     - 冒頭: タイトル \`# <hy>（表示名） E2Eテストケース\`、元設計HTML/観点表/既存ITへのリンク、オラクル独立性の注記。
     - **10列固定TSV**（機能名 / テストID=\`E2E-${module.toUpperCase()}-${seq}-NNN\` / I/FID / テスト観点 / 優先度(P1-3) / テスト項目名 / 前提条件 / 入力データ / 操作手順 / 期待結果）。1行1判定。改行や"を含むセルは"で囲む。機能名は全行同一。
     - 付帯表をm01_02と同一構成: 付帯表1(自動化区分・対象セレクタfile:line・仕様根拠・元IT) / 付帯表2(分類サマリ IT-ID別 自動化/手動/対象外・未分類0) / **付帯表2b(既存IT cases 全行の行単位分類・対応E2EまたはJ理由・集計が付帯表2と一致)** / 付帯表3(シードデータ要件) / 付帯表4(不具合候補・要確認) / 付帯表5(設計書網羅マトリクス 節→テストID・未カバーは理由付き)。
   - Page Object: ${REPO}/${d.pagePath} （独立クラス形。\`import {Locator,Page,expect} from "@playwright/test"\`、\`import {ECCUBE_ADMIN_ROUTE} from "../../../config/default.config"\`。Locatorはコンストラクタ定義＋由来Twig file:lineコメント。expectを使うならimport必須。class名は ${d.id} のadmin以降をPascalCase ＋ Page）。
   - spec: ${REPO}/${d.specPath} （\`import {test,expect,Page} from "@playwright/test"\`、\`import {AdminLoginPage} from "../../../pages/admin/login.page"\`、生成Page Objectをimport。\`import {ECCUBE_ADMIN_ROUTE} from "../../../config/default.config"\`。env-gated test.skip(!HAS_CREDS)（ECCUBE_ADMIN_USER/PASS）。冒頭コメントに「未実行雛形・ケース表に対応・期待結果は仕様由来」。**spec に残すのは E2E自動化(実装済み)と自動化予定だが未実装/要実機の test.fixme(理由付き)のみ。手動/対象外はケース表で全量管理しspecに大量fixmeを残さない**。describe名は和名、tagは ["@admin"] 等）。${twoLayer ? `
   - **【両レイヤ】API/統合 spec: ${REPO}/e2e/spec/${kind}/${module}/${d.id}.${kind}.spec.ts**（TEMPLATE.md §4 準拠。\`import {expect,test,request} from "@playwright/test"\`＋\`import {E2E_BASE_URL} from "../../../config/default.config"\`。${kind === 'api' ? 'request.newContext で Webhook/再連携APIへ送信しステータス/レスポンス/冪等性を検証' : '起動口が実機依存なら test.fixme で終了ステータス/出力を設計'}。env/SEEDガード test.skip。期待値は設計書/観点表由来）。
   - **【両レイヤ】ペイロード/ヘルパ: ${REPO}/e2e/pages/${kind}/${module}/${d.id}.${kind}.ts**（Webhookペイロード等は設計書のリクエスト仕様由来の最小構成。エンドポイントパス/コマンド名を file:line コメントで根拠付け）。
   - **【両レイヤ】UIレイヤ**: 結果が管理画面に現れる分は ${REPO}/${d.pagePath}・${REPO}/${d.specPath}（admin spec）でUIケースとして実装。` : ''}
   - 相対import: spec/<area>/${module}/ から3階層上が e2e ルート＝ \`../../../\`。
5. CHECKLIST.md を自己照合（オラクル独立性 / 設計書網羅マトリクス未カバー0 / 観点全量分類 未分類0 / セレクタ根拠 / 正常×異常の対 / TSV10列厳守 / 相対パス）。
6. \`cd ${REPO}/e2e && npx playwright test --list\`（${twoLayer ? `spec/${kind}/${module}/${d.id}.${kind}.spec.ts と spec/admin 側UI spec の両方` : `spec/admin/${module}/${d.id}.spec.ts`}）でコンパイル確認（壊れていたら直す）。

返り値はStructuredOutputで {id, screenExists, casesPath, pagePath, specPath, automated(自動化行数=UI+API/統合), manual, outOfScope, notes}。${twoLayer ? 'notesに両レイヤの内訳(UI/API・統合の自動化数)と生成した両レイヤspecパスを記す。' : ''}`
}

function reviewPrompt(d) {
  const module = (d.id.match(/^([a-z]\d+)_/) || [])[1] || 'misc'
  const kind = d.type === 'api' ? 'api' : d.type === 'batch' ? 'batch' : 'screen'
  const twoLayer = kind !== 'screen'
  const layerTargets = twoLayer
    ? ` / e2e/spec/${kind}/${module}/${d.id}.${kind}.spec.ts / e2e/pages/${kind}/${module}/${d.id}.${kind}.ts`
    : ''
  const layerPoint = twoLayer
    ? ' (8)両レイヤ網羅: 各観点が E2E自動化(UI)/(API/統合)/手動/対象外 に分類され、APIレスポンス・終了ステータス・出力で観測可能なものを画面非表示だけを理由に対象外にしていないか。API/統合のエンドポイント/コマンドが file:line 根拠の実在で創作が無いか。Webhook/バッチの正常×異常の対が揃うか。期待値がレスポンス形・スマレジ実装挙動由来になっていないか。'
    : ''
  return `あなたはレビュー反映エンジニアです。機能 **${d.id}**（種別: ${kind}）のE2E成果物を **codex(読み取り専用)** にレビューさせ、高/中指摘を是正します。

## 対象成果物
- ${REPO}/${d.casesPath}
- ${REPO}/${d.pagePath}
- ${REPO}/${d.specPath}${twoLayer ? `
- ${REPO}/e2e/spec/${kind}/${module}/${d.id}.${kind}.spec.ts（API/統合レイヤ）
- ${REPO}/e2e/pages/${kind}/${module}/${d.id}.${kind}.ts（ペイロード/ヘルパ）` : ''}

## 手順
1. 次のコマンドで codex レビューを実行（読み取り専用・タイムアウト長め）:
\`\`\`bash
cd ${REPO} && timeout 560 codex exec --sandbox read-only - <<'PROMPT'
あなたはE2Eテスト設計のレビュアです。読み取り専用で機能 ${d.id}（種別 ${kind}）の成果物をレビューし、深刻度(高/中/低)付きの指摘を簡潔に列挙してください。
対象: integration_test/e2e/${d.id}_e2e_cases.md / e2e/pages/admin/${module}/${d.id}.page.ts / e2e/spec/admin/${module}/${d.id}.spec.ts${layerTargets}
正典: 設計書 ${d.designHtml}（正本 ${d.designMd}）/ 観点表 integration_test/integration-test-viewpoints.md / 既存IT ${d.itCases} / 実装 ${EE}/src/Eccube。
重点: (1)設計書の各節(入口/処理フロー/判定順序/表示メッセージ/画面遷移/権限/バリデーション/DB操作/Cookie等)が抜け漏れなくE2E(自動化(UI)/自動化(API/統合)/手動/対象外+理由)へ写像されているか・網羅マトリクス未カバー0は妥当か。(2)観点表母集合の全行が分類され未分類0で監査可能か。(3)オラクル独立性(期待結果が設計書/観点表由来か・Form制約やCookie名・レスポンス形等の実装由来オラクル混入が無いか)。(4)セレクタ/APIパス/コマンド根拠(file:line)が正しく創作が無いか。(5)正常系と異常系の対が揃うか。(6)Playwright実装の正しさ(import相対パス・skip/fixme方針・URLアサーション・request使用)。(7)不具合候補表の妥当性・テストを実装に寄せていないか。${layerPoint}
抜け漏れ・誤認識・オラクル混入・セレクタ/パス創作を具体的に指摘してください。
PROMPT
\`\`\`
2. codex出力を読み、**高・中の指摘を成果物へ反映**（テストは仕様どおりのまま＝実装へ寄せない。Cookie名/Form制約/レスポンス形の期待値固定はオラクル混入として除去）。低や好みは任意。残課題は\`要確認\`で明記。
3. \`cd ${REPO}/e2e && npx playwright test --list\` で対象spec（${twoLayer ? '両レイヤ' : 'admin'}）のコンパイル確認。
返り値はStructuredOutputで {id, high, medium, low, fixesApplied, remaining, compileOk, summary}。`
}

// このグループの対象機能（args がバインドしないため埋め込み。群ごとにこの配列を差し替えて再実行する）。
// パイロット: 在庫管理＋スマレジ（機能仕様書＝画面を伴わない仕様。両レイヤ網羅）。
const ITEMS = [
  { id: 'a01_01_api_stock_smaregi_stock_sync', designMd: 'functions/ec-cube-enterprise/a01-01_api_stock_smaregi_stock_sync.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/a01-01_api_stock_smaregi_stock_sync.html', itCases: 'integration_test/a01_01_api_stock_smaregi_stock_sync_it_cases.md', casesPath: 'integration_test/e2e/a01_01_api_stock_smaregi_stock_sync_e2e_cases.md', pagePath: 'e2e/pages/admin/a01/a01_01_api_stock_smaregi_stock_sync.page.ts', specPath: 'e2e/spec/admin/a01/a01_01_api_stock_smaregi_stock_sync.spec.ts', repo: 'ec-cube-enterprise', module: 'a01', type: 'api' },
  { id: 'a01_02_api_stock_smaregi_webhook_error_retry', designMd: 'functions/ec-cube-enterprise/a01-02_api_stock_smaregi_webhook_error_retry.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/a01-02_api_stock_smaregi_webhook_error_retry.html', itCases: 'integration_test/a01_02_api_stock_smaregi_webhook_error_retry_it_cases.md', casesPath: 'integration_test/e2e/a01_02_api_stock_smaregi_webhook_error_retry_e2e_cases.md', pagePath: 'e2e/pages/admin/a01/a01_02_api_stock_smaregi_webhook_error_retry.page.ts', specPath: 'e2e/spec/admin/a01/a01_02_api_stock_smaregi_webhook_error_retry.spec.ts', repo: 'ec-cube-enterprise', module: 'a01', type: 'api' },
  { id: 'b01_02_batch_data_stock_shortage', designMd: 'functions/ec-cube-enterprise/b01-02_batch_data_stock_shortage.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/b01-02_batch_data_stock_shortage.html', itCases: 'integration_test/b01_02_batch_data_stock_shortage_it_cases.md', casesPath: 'integration_test/e2e/b01_02_batch_data_stock_shortage_e2e_cases.md', pagePath: 'e2e/pages/admin/b01/b01_02_batch_data_stock_shortage.page.ts', specPath: 'e2e/spec/admin/b01/b01_02_batch_data_stock_shortage.spec.ts', repo: 'ec-cube-enterprise', module: 'b01', type: 'batch' },
  { id: 'b01_03_batch_data_stock_warning', designMd: 'functions/ec-cube-enterprise/b01-03_batch_data_stock_warning.md', designHtml: 'function_spec_html_preview/ec-cube-enterprise/b01-03_batch_data_stock_warning.html', itCases: 'integration_test/b01_03_batch_data_stock_warning_it_cases.md', casesPath: 'integration_test/e2e/b01_03_batch_data_stock_warning_e2e_cases.md', pagePath: 'e2e/pages/admin/b01/b01_03_batch_data_stock_warning.page.ts', specPath: 'e2e/spec/admin/b01/b01_03_batch_data_stock_warning.spec.ts', repo: 'ec-cube-enterprise', module: 'b01', type: 'batch' },
]

phase('Generate')
let items = args
if (typeof items === 'string') { try { items = JSON.parse(items) } catch (e) { items = null } }
if (!Array.isArray(items) || items.length === 0) items = ITEMS
log(`m-series E2E生成 ${items.length}機能: ` + items.map((i) => i.id).join(', '))

const results = await pipeline(
  items,
  (d) => agent(genPrompt(d), { label: `gen:${d.id}`, phase: 'Generate', schema: GEN_SCHEMA }),
  (gen, d) => {
    if (!gen) return { id: d.id, skipped: 'generate-failed' }
    return agent(reviewPrompt(d), { label: `codex:${d.id}`, phase: 'CodexReviewFix', schema: REVIEW_SCHEMA })
      .then((rev) => ({ gen, rev }))
  }
)

const out = results.filter(Boolean)
log(`完了 ${out.length}/${items.length}`)
return out
