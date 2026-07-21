import fs from 'node:fs'
import path from 'node:path'

export const meta = {
  name: 'design-impl-conformance-audit',
  description: 'HTML設計書の個別要求を実装(ec-cube-enterprise)と照合し、未実装/実装違いをcodex監査＋codex反証で確定して指摘票化する。抽出器の取りこぼしも独立再列挙で補う（漏れなし）。フロント一式(f01〜f08)を先行、argsで対象差し替え可',
  phases: [
    { title: 'Manifest', detail: 'findings/ から対象機能マニフェストを構築（既定=フロント）' },
    { title: 'Audit', detail: '機能ごとに設計HTML・ハーネス候補・実装ソースを直接読み、要求を独立再列挙して未実装/実装違い候補を抽出' },
    { title: 'Verify', detail: 'Codexが実コードで反証試行し未実装/実装違いを確定、指摘票Markdown＋差分デルタを出力' },
  ],
}

const REPO = '/home/y-saito/Developments/hareruya-design-docs'
const EE = '/home/y-saito/Developments/ec-cube-enterprise'
const DRIFT = `${REPO}/design_impl_drift_report`
const TICKET_DIR = `${DRIFT}/conformance_findings`
const DELTA_DIR = `${TICKET_DIR}/_deltas`

const MANIFEST_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['functions'],
  properties: {
    functions: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['functionId', 'featureNo', 'domain', 'title', 'designHtml', 'materialGapCount'],
        properties: {
          functionId: { type: 'string' },
          featureNo: { type: 'string' },
          domain: { type: 'string' },
          title: { type: 'string' },
          designHtml: { type: 'string' },
          materialGapCount: { type: 'integer' },
        },
      },
    },
  },
}

const AUDIT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['functionId', 'featureNo', 'requirementsChecked', 'extractorMissed', 'candidates', 'summary'],
  properties: {
    functionId: { type: 'string' },
    featureNo: { type: 'string' },
    requirementsChecked: { type: 'integer', description: 'codexが実装照合した material 要求数（ハーネス候補＋codex独立再列挙）' },
    extractorMissed: { type: 'integer', description: 'codexが設計書から見つけたがハーネス候補に無かった要求数' },
    candidates: {
      type: 'array',
      description: '未実装 または 実装違い と判断した要求のみ',
      items: {
        type: 'object', additionalProperties: false,
        required: ['category', 'designRequirement', 'designRef', 'implRef', 'implementationActual', 'mismatchReason'],
        properties: {
          category: { type: 'string', enum: ['未実装', '実装違い'] },
          designRequirement: { type: 'string', description: '設計書の要求文（仕様）そのまま' },
          designRef: { type: 'string', description: '設計HTMLの file#sheet:line 等の根拠' },
          implRef: { type: 'string', description: '実装の file:line（未実装なら「不在」＋探索範囲）' },
          implementationActual: { type: 'string', description: '実装で実際に起きていること（未実装なら該当処理が見当たらない旨）' },
          mismatchReason: { type: 'string', description: 'なぜ未実装/実装違いと判断したか（探索した Controller/Twig/Service/JS を明記）' },
        },
      },
    },
    summary: { type: 'string' },
  },
}

const VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['functionId', 'featureNo', 'notImplemented', 'implMismatch', 'refuted', 'ticketPath', 'deltaPath', 'summary'],
  properties: {
    functionId: { type: 'string' },
    featureNo: { type: 'string' },
    notImplemented: { type: 'integer', description: '反証を潜り抜けた 未実装 の確定件数' },
    implMismatch: { type: 'integer', description: '反証を潜り抜けた 実装違い の確定件数' },
    refuted: { type: 'integer', description: '実装が見つかり取り下げた（誤検知）件数' },
    ticketPath: { type: 'string' },
    deltaPath: { type: 'string' },
    summary: { type: 'string' },
  },
}

function outputStem(d) {
  return d.functionId || `${(d.featureNo || 'unknown').toLowerCase()}_unknown`
}

function ticketPathFor(d) {
  return `design_impl_drift_report/conformance_findings/${outputStem(d)}.md`
}

function deltaPathFor(d) {
  return `design_impl_drift_report/conformance_findings/_deltas/${outputStem(d)}.json`
}

function deltaExists(d) {
  return fs.existsSync(path.join(REPO, deltaPathFor(d)))
}

function auditPrompt(d) {
  const findingsPath = `design_impl_drift_report/findings/${d.functionId}.json`
  return `あなたは「設計書→実装」網羅監査官です。機能 **${d.featureNo}（${d.title}）** について、HTML設計書に書かれた**個別要求が実装(ec-cube-enterprise)に存在するか**を厳密に照合し、**未実装／実装違い**の候補を抽出します。設計書が正・実装が被監査対象です。

## 入力
- ハーネス判定（要確認/未実装候補の material 候補キュー）: ${REPO}/${findingsPath} の \`requirementConformanceAudit.materialGapRows\`（各行の \`designRequirement\`/\`designRef\`/\`elementLevel\`/\`candidateRefs\`）。
- 設計HTML（正）: ${REPO}/${d.designHtml}
- 実装（被監査）: ${EE}/src/Eccube （Controller/Form/Service/Repository/Entity/Command/Resource/template/Resource/locale, および ${EE}/html のJS/テンプレ）

## 手順
1. ${REPO}/${findingsPath} を読み、\`requirementConformanceAudit.materialGapRows\` を取り出す（これが一次候補キュー）。
2. 設計HTMLシート本文も自分で読み、**利用者が直接目にする要素・文言・画面遷移・バリデーション・ボタン/リンク**の material 要求を**独立に再列挙**する（ハーネス抽出の取りこぼしを埋める＝完全性クリティック）。ハーネス候補に無い要求を数え \`extractorMissed\` とする。
3. 候補＋自分の再列挙の各要求について、${EE}/src/Eccube と ${EE}/html の実装を直接 grep/read して file:line 根拠で照合する。外側の workflow agent 自身が読むこと。内側で別エージェントや別レビュー担当を起動してはいけない。
   - 実装済み: 実装 file:line を控え、candidates には入れない。
   - 未実装: 探索した Controller/Twig/Service/Repository/FormType/JS/ルート/翻訳キーを列挙し、不在の根拠を示す。
   - 実装違い: 設計値・実装値・差異内容・実装 file:line を示す。
   - 要実機確認: 根拠不足なら summary に残し、candidates には入れない。
   キーワードは設計の日本語→ルート名/翻訳キー/Twigパス/クラス名に翻案して探索する。
4. **未実装／実装違い**と判断できたものだけ candidates に入れる（実装済み・要実機確認は入れない）。オラクルは設計書。実装の現挙動を仕様と取り違えない。

返り値は StructuredOutput {functionId:'${d.functionId}', featureNo:'${d.featureNo}', requirementsChecked, extractorMissed, candidates[], summary}。未実装/実装違いが無ければ candidates=[] とし summary に「網羅照合の結果、未実装/実装違いなし」と記す。`
}

function verifyPrompt(d, audit) {
  const featureNo = d.featureNo
  const cand = JSON.stringify((audit && audit.candidates) || [], null, 2)
  const ticketPath = ticketPathFor(d)
  const deltaPath = deltaPathFor(d)
  const 区分 = { f: 'フロント', m: '管理', a: 'API', b: 'バッチ' }[(d.domain || '')[0]] || '機能'
  return `あなたはCodex批判的レビュア（反証担当）です。機能 **${featureNo}（${d.title}）** の「未実装／実装違い」候補を、**実コードで反証**して確定させ、指摘票を出力します。誤検知（実装は在るのに未実装と誤判定）を排除するのが役目です。外部サブエージェントや内側の別プロセスは使わず、この workflow agent 自身が設計HTML・前段候補・実装ソースを直接読んで判断してください。

## 監査候補（前段の抽出結果）
\`\`\`json
${cand}
\`\`\`

## 反証手順
1. 各候補について ${EE}/src/Eccube と ${EE}/html を自分で grep/read し、**実装が存在しないか**を確かめる。
   - 実装が見つかった → その候補は **取り下げ（refuted）**。file:line を控える。
   - 実装が見つからない → **未実装** として確定。探索した Controller/Twig/Service/JS/ルート・翻訳キーを列挙し「不在の根拠」を残す。
   - 実装は在るが設計と食い違う → **実装違い** として確定。設計値・実装値・file:line を記す。
2. 弱いキーワード一致だけで未実装と断定しない。設計の日本語要求は、ルート名・翻訳キー(messages.ja.yaml)・Twigブロック・FormType・JS へ翻案して探索する。判断できない場合は確定に入れず summary に「要実機確認」で残す（指摘には出さない）。

## 出力
1. 確定した 未実装／実装違い を **指摘票 Markdown** ${REPO}/${ticketPath} に、次の様式で1件ずつ追記（既存があれば作り直し）:
\`\`\`
■${区分}-${d.title}
【指摘カテゴリ】
　未実装            ← 実装違いなら「実装違い」
【指摘内容】
　（仕様）<designRequirement>
　<実装での欠落/差異の説明>。確認お願いします。（設計根拠: <designRef> ／ 実装: <implRef>）
\`\`\`
   確定が0件なら見出しの下に「本機能で確定した未実装/実装違いなし（網羅照合済）」と記す。
2. 反証を潜り抜けた確定所見を **差分デルタ JSON** ${REPO}/${deltaPath} に書く（後段のマージで findings.json へ upsert する）。形式:
\`\`\`json
{ "functionId": "${d.functionId}", "featureNo": "${featureNo}",
  "findings": [ { "category":"未実装|実装違い", "dimension":"⑦要求網羅・未実装" もしくは "⑦要求網羅・実装違い",
    "severity":"med", "designRef":"...", "designExpectation":"<仕様>", "implRef":"<file:line または 不在>",
    "implementationActual":"<実装の状態>", "mismatchReason":"<不在/差異の根拠>",
    "comparisonRows":[{"item":"<観点>","design":"<仕様値>","implementation":"<実装値>","mismatch":"<差異>"}] } ] }
\`\`\`
   確定0件でも findings:[] で JSON を必ず書く（監査済みの証跡）。
3. ディレクトリが無ければ作る（\`mkdir -p ${REPO}/design_impl_drift_report/conformance_findings/_deltas\`）。
4. 指摘票は functionId 単位の ${ticketPath} に書く。featureNo 単位のファイルには書かない（同一 featureNo 複数シートの並列実行で上書き競合するため）。

返り値は StructuredOutput {functionId:'${d.functionId}', featureNo:'${featureNo}', notImplemented, implMismatch, refuted, ticketPath:'${ticketPath}', deltaPath:'${deltaPath}', summary}。`
}

// ------- 実行 -------
phase('Manifest')
let manifest = args
if (typeof manifest === 'string') { try { manifest = JSON.parse(manifest) } catch (e) { manifest = manifest === 'rest' || manifest === 'all' ? { scope: manifest } : null } }
let functions = manifest && Array.isArray(manifest.functions) ? manifest.functions
  : Array.isArray(manifest) ? manifest : null
// scope: 'front'(既定) / 'rest'(非フロント・Ph2除外・未監査) / 'all'(全407・Ph2除外)
const scope = (manifest && manifest.scope) || 'front'

if (!functions && scope === 'rest') {
  const manifestPath = `${DRIFT}/conformance_findings/_manifest_rest.json`
  const restManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  functions = Array.isArray(restManifest.functions) ? restManifest.functions : []
  log(`restマニフェスト読込: ${manifestPath} functions=${functions.length}`)
}

if (!functions) {
  let scoutTask
  const cond = {
    front: 'kind=="front" の機能のみ',
    all: 'phase2Verdict!="NOT_IMPLEMENTED_CONFIRMED" の全機能',
  }[scope] || 'kind=="front" の機能のみ'
  scoutTask = `${DRIFT}/findings/ 配下の各機能JSONから、対象=${cond} のマニフェストを作る。各JSONの functionId/featureNo/domain/title/designHtml と requirementConformanceAudit.materialGapCount を集め、designHtml が空の機能は除外、materialGapCount 降順で返す。Python でまとめて列挙すると速い。`
  const scout = await agent(
    `${scoutTask}\n返り値は StructuredOutput {functions:[{functionId,featureNo,domain,title,designHtml,materialGapCount}]}。`,
    { label: `manifest:${scope}`, phase: 'Manifest', schema: MANIFEST_SCHEMA }
  )
  functions = (scout && scout.functions) || []
}
// materialGapが多い順に前へ（指摘が出やすい機能を先に回す）。
functions = functions.filter(Boolean).sort((a, b) => (b.materialGapCount || 0) - (a.materialGapCount || 0))
const beforeSkip = functions.length
const alreadyDone = functions.filter(deltaExists)
functions = functions.filter((d) => !deltaExists(d))
log(`マニフェスト ${beforeSkip}機能 ｜ 既存デルタでスキップ ${alreadyDone.length}機能 ｜ 実行対象 ${functions.length}機能`)
log(`網羅監査 ${functions.length}機能（scope=${scope}）: ` + functions.slice(0, 12).map((f) => `${f.featureNo}/${f.functionId}`).join(', ') + (functions.length > 12 ? ' …' : ''))

const results = await pipeline(
  functions,
  (d) => agent(auditPrompt(d), { label: `audit:${d.featureNo}`, phase: 'Audit', schema: AUDIT_SCHEMA }),
  (audit, d) => {
    if (!audit) return { functionId: d.functionId, featureNo: d.featureNo, skipped: 'audit-failed' }
    return agent(verifyPrompt(d, audit), { label: `verify:${d.featureNo}`, phase: 'Verify', schema: VERIFY_SCHEMA })
      .then((verify) => ({ audit, verify }))
  }
)

const out = results.filter(Boolean)
const confirmedNI = out.reduce((n, r) => n + ((r.verify && r.verify.notImplemented) || 0), 0)
const confirmedMM = out.reduce((n, r) => n + ((r.verify && r.verify.implMismatch) || 0), 0)
const missed = out.reduce((n, r) => n + ((r.audit && r.audit.extractorMissed) || 0), 0)
log(`完了 ${out.length}/${functions.length} ｜ 確定 未実装=${confirmedNI} 実装違い=${confirmedMM} ｜ 抽出器取りこぼし補完=${missed}`)
log(`既存デルタスキップ: ${alreadyDone.length}`)
log(`指摘票: ${TICKET_DIR}/<functionId>.md ／ デルタ: conformance_findings/_deltas/<functionId>.json`)
log(`次: python3 ${DRIFT}/apply_conformance_findings.py --reaudit && python3 ${DRIFT}/build_report.py で findings.json / index.html へ反映`)
return { skipped: alreadyDone.map((d) => ({ functionId: d.functionId, featureNo: d.featureNo, deltaPath: deltaPathFor(d) })), results: out }
