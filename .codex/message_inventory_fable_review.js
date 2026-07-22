export const meta = {
  name: 'message-inventory-fable-review',
  description:
    '確定済みメッセージ割当(1,139件)を fable5 が実ソースで独立に批判レビューし、捏造(逐語非在)・誤割当を摘発する。codexの結論は渡さず独立判定させる。',
  phases: [{ title: 'Fable5Review', detail: '機能バッチごとに実ソース照合し捏造/誤割当を摘発', model: 'fable' }],
}

const REPO = '/home/y-saito/Developments/hareruya-design-docs'
const EE = '/home/y-saito/Developments/ec-cube-enterprise'
const TSV = `${REPO}/message_inventory/message_inventory.tsv`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['batch', 'checked', 'fabrications', 'misassignments', 'triggerErrors', 'findings', 'summary'],
  properties: {
    batch: { type: 'integer' },
    checked: { type: 'integer', description: '照合したメッセージ数' },
    fabrications: { type: 'integer', description: '実ソースに逐語非在だった件数(真の捏造)' },
    misassignments: { type: 'integer', description: '帰属機能が実装と矛盾する件数' },
    triggerErrors: { type: 'integer', description: '表示条件が実装と明確に矛盾する件数' },
    findings: {
      type: 'array',
      description: '問題のあった行の詳細(問題なしは含めない)',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'type', 'detail'],
        properties: {
          id: { type: 'string' },
          type: { type: 'string', description: 'fabrication|misassignment|trigger_error' },
          detail: { type: 'string', description: '根拠 file:line と理由。誤割当なら正しい機能ID' },
        },
      },
    },
    summary: { type: 'string' },
  },
}

function prompt(b) {
  return `あなたは独立レビュア(fable5)です。設計書へ埋め込まれた確定メッセージを、鵜呑みにせず ${EE} 実ソースで再照合し、**捏造と誤割当を批判的に摘発**します。他者のレビュー結論は与えません。自分で実ソースを読んで判定してください。

## 対象
一覧: ${TSV}（TSV。列: メッセージID / 画面 / 要素 / トリガー（条件） / 種別 / どこに / 要素(表示) / メッセージ内容 / 後続処理 / 根拠(file:line) / 解決状態 / 機能候補(要検証)）
バッチ${b.idx} の対象機能ID(接頭辞): ${b.fids.join(', ')}
→ これらの機能に属する行（メッセージIDが例 M09-03-MSG-### のように 対象機能ID大文字-MSG- で始まる行）だけを対象にする。

## 判定（各行）
1. **捏造(fabrication)**: 「メッセージ内容」が根拠(file:line)から解決される実文言として ${EE} に**逐語存在**するか。
   - 重要: 根拠が \`Controller.php:NN\` で addError('admin.xxx.key') のように**翻訳キー**を渡す実装では、
     実文言は \`src/Eccube/Resource/locale/messages.ja.yaml\`(や validators.ja.yaml, vendor/symfony/*/translations)
     に存在する。controller行だけ見てキーしか無い＝捏造、と早合点しないこと。**キーを yaml で解決して逐語一致を確認**する。
   - 「メッセージ内容」が「要ソース確認」の行は判定対象外(ok)。%name% 等プレースホルダは原文どおりなら ok。
   - 言い換え/敬体化/要約/実行時値の差し替え(%maxRecord%→5010等)のみ捏造とする。
2. **誤割当(misassignment)**: その行が割り当てられた機能に帰属するのが実装(Route/画面/処理)と整合するか。
   根拠のメソッドの #[Route] と設計書のURL/画面を照合。別機能のメッセージが紛れていれば指摘し正しい機能IDを示す。
   ただし同一controllerを複数機能が共有する場合、表示画面がどの機能かで判断（保存/削除の完了メッセージは編集/登録機能、検索一覧機能ではない、等）。
3. **条件誤り(trigger_error)**: 「トリガー（条件）」が実装と**明確に矛盾**する場合のみ（軽微な表現差は不問）。

## 手順
- grep/読み取りで実ソースを確認する。yaml のキー解決を必ず行う。
- 問題のあった行だけ findings に入れる（問題なしは入れない）。件数も返す。
- **ファイルは編集しない**（レポートのみ）。創作・推測で埋めない。

返り値は SCHEMA。batch=${b.idx}。`
}

function parseArgs(a) {
  if (typeof a === 'string') { try { return JSON.parse(a) } catch { return a } }
  return a
}
const ARGS = parseArgs(args) || {}
const BATCHES = Array.isArray(ARGS.batches) ? ARGS.batches : []
if (!BATCHES.length) throw new Error('args.batches (=[{idx,fids}]) を指定')

log(`fable5 批判レビュー ${BATCHES.length}バッチ`)

const results = await parallel(
  BATCHES.map((b) => () =>
    agent(prompt(b), { label: `fable5:batch${b.idx}`, phase: 'Fable5Review', model: 'fable', schema: SCHEMA })
      .then((r) => r).catch(() => null),
  ),
)

return results.filter(Boolean)
