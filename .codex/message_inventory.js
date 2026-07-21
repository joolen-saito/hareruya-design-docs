export const meta = {
  name: 'message-inventory-resolve-review',
  description:
    'メッセージ一覧(フラッシュ/Form/JS)を機能ごとに codex(読取専用)で実ソース確定し、fable5 と codex が独立にハルシネーション批判レビュー。確定後にメッセージIDを設計書『表示メッセージ』表へ埋め込む。',
  phases: [
    { title: 'CodexResolve', detail: '機能ごとに codex で変数/連結の未解決文言を実ソース確定し、要素/トリガー/後続処理を埋め、IDを設計書へ埋め込む' },
    { title: 'Fable5Review', detail: 'fable5 が確定結果を実ソースと独立照合し、捏造/過剰確定/抜け漏れを指摘・差し戻す', model: 'fable' },
    { title: 'CodexReview', detail: 'codex(読取専用)が独立に再照合し、逐語非在/値差し替え/言い換え/過剰確定を摘発して差し戻す' },
  ],
}

const REPO = '/home/y-saito/Developments/hareruya-design-docs'
const EE = '/home/y-saito/Developments/ec-cube-enterprise'
const S = `${REPO}/.codex/skills/hareruya-message-inventory/scripts`

const RESOLVE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['fid', 'rows', 'resolvedVariables', 'filledColumns', 'embedded', 'validateOk', 'remaining', 'summary'],
  properties: {
    fid: { type: 'string' },
    rows: { type: 'integer', description: '当該機能のメッセージ行数' },
    resolvedVariables: { type: 'integer', description: '変数/連結(other)から実ソースで確定できた文言数' },
    filledColumns: { type: 'integer', description: '要素/トリガー/後続処理を確定した行数' },
    embedded: { type: 'integer', description: '設計書表へ埋め込んだID数' },
    validateOk: { type: 'boolean', description: 'validate_messages.py が捏造ゼロで通ったか' },
    remaining: { type: 'string', description: '根拠不足で 要確認 のまま残した項目' },
    summary: { type: 'string' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['fid', 'hallucinations', 'omissions', 'overclaims', 'revertedToTBD', 'high', 'medium', 'summary'],
  properties: {
    fid: { type: 'string' },
    hallucinations: { type: 'integer', description: '実ソースに存在しない文言の混入指摘数' },
    omissions: { type: 'integer', description: '拾えていない実装メッセージの数' },
    overclaims: { type: 'integer', description: '根拠が弱いのに断定していた列の数' },
    revertedToTBD: { type: 'integer', description: '根拠不足で 要ソース確認 へ差し戻した数' },
    high: { type: 'integer' },
    medium: { type: 'integer' },
    summary: { type: 'string' },
  },
}

const CODEX_REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['fid', 'nonVerbatim', 'valueSubstitutions', 'paraphrases', 'overclaims', 'revertedToTBD', 'validateOk', 'summary'],
  properties: {
    fid: { type: 'string' },
    nonVerbatim: { type: 'integer', description: 'メッセージ内容が実ソースに逐語非在だった行数（散文注記/要約含む）' },
    valueSubstitutions: { type: 'integer', description: '%maxRecord%→5010 等、変数へ実行時値を差し替えて断定していた行数' },
    paraphrases: { type: 'integer', description: '敬体化/言い換え/要約で原文と異なっていた行数' },
    overclaims: { type: 'integer', description: '要素/トリガー/後続処理/種別を根拠なく断定していた列数' },
    revertedToTBD: { type: 'integer', description: '逐語literalを抽出できず 要ソース確認 へ差し戻した行数' },
    validateOk: { type: 'boolean', description: 'validate_messages.py が捏造ゼロで通ったか' },
    summary: { type: 'string' },
  },
}

function resolvePrompt(fid) {
  return `あなたはメッセージ一覧の確定エンジニアです。機能 **${fid}** のメッセージを **codex(読み取り専用)** に実ソースで確定させ、結果を反映します。

スキル: ${REPO}/.codex/skills/hareruya-message-inventory/SKILL.md と references/*（TEMPLATE/TERMINOLOGY/CHECKLIST）に従う。
正本ソース: ${EE}（読み取り専用）。捏造ゼロ厳守。

## 重要な原則（メッセージ内容列の書き方）
- \`メッセージ内容\` 列には **実ソースに逐語で存在する固定リテラル** か、確定不能なら **マーカー「要ソース確認」** のどちらかだけを書く。
- 「例外由来の可変文言」「フォーム検証由来の可変文言」等の**散文説明を メッセージ内容 に書かない**。散文の根拠・候補は \`解決状態\` か \`根拠\` 側へ書く。
- 変数(%maxRecord% 等)へ**実行時の値(5010 等)を差し替えて断定しない**。原文の %maxRecord% を保つ。

## 手順
1. 入力スライスを作る:
\`\`\`bash
cd ${REPO} && python3 ${S}/make_slice.py --fid ${fid}
\`\`\`
   → ${REPO}/message_inventory/slices/<FID>.tsv （当該機能の全メッセージ行）。
2. codex で実ソース確定（長めタイムアウト）:
\`\`\`bash
cd ${REPO} && timeout 560 codex exec --sandbox read-only - <<'PROMPT'
あなたはメッセージ一覧の確定レビュアです。読み取り専用で機能 ${fid} のメッセージ行を ${EE} 実ソースに照合し、行ごとに以下をJSON行(JSONL)で返してください。創作禁止・推測禁止。
入力: ${REPO}/message_inventory/slices/${fid.toUpperCase().replace(/_/g, '-')}.tsv（列は TEMPLATE.md）
各行について: (a)メッセージ内容が根拠(file:line)に逐語で実在するか(実在しなければ捏造として指摘)。逐語literalを取れないもの(変数/例外/連結)は content_fixed=null とし「要ソース確認」に差し戻す。散文説明や実行時値の差し替えは禁止。(b)解決状態 variable/other の行は代入元を追い、逐語literalが取れる場合のみ確定文言を返す。(c)要素(操作トリガー)/トリガー(条件)/後続処理(return先 redirect/render) を controller/テンプレから確定。(d)EE-JS-* はテンプレ→ルート→機能で ${fid} 由来か判定。
出力JSONL: {"id":"...","content_verified":true/false,"content_fixed":"逐語確定文言 or null","element":"操作要素","trigger":"条件","followup":"後続処理","note":"根拠file:line or 要ソース確認理由"}
PROMPT
\`\`\`
3. codex出力(JSONL)を ${REPO}/message_inventory/slices/${fid.toUpperCase().replace(/_/g, '-')}.resolved.tsv として、入力スライスの各行に codex確定値を反映して書き出す（列はTEMPLATE.mdの12列。content_fixed=null は メッセージ内容 を「要ソース確認」にし、散文の候補・理由は 解決状態 列へ。要素/トリガー/後続処理を埋める。根拠列は codex の note で更新可）。
4. 設計書へIDを埋め込む:
\`\`\`bash
cd ${REPO} && python3 ${S}/embed_message_ids.py --fid ${fid}
\`\`\`
   さらに、一覧にあって表に無いメッセージは、当該機能docの \`## 表示メッセージ\` 表へ TEMPLATE.md の形式で新規行として追記する（メッセージID列付き。文言はソース由来のみ。逐語literalが無ければ「要ソース確認」）。
5. 検証（**マスタTSVへの merge はしない**＝並行実行の競合回避。masterへの反映は全機能完了後に一括で行う）:
\`\`\`bash
cd ${REPO} && python3 ${S}/validate_messages.py
\`\`\`
   自機能の resolved.tsv と埋め込んだ doc について、捏造ゼロ（文言が実ソースに逐語存在 or 要ソース確認）を自分でも grep 確認する。NG があれば是正。

返り値は RESOLVE_SCHEMA（embedded=doc へ埋めたID数、validateOk=捏造ゼロ確認結果）。`
}

function reviewPrompt(fid) {
  return `あなたは独立レビュア(fable5)です。機能 **${fid}** の確定済みメッセージ一覧を、鵜呑みにせず ${EE} 実ソースで再照合し、ハルシネーションと過剰確定を摘発します。

対象: ${REPO}/message_inventory/slices/${fid.toUpperCase().replace(/_/g, '-')}.resolved.tsv と、埋め込み済み設計書。
基準: ${REPO}/.codex/skills/hareruya-message-inventory/references/CHECKLIST.md の A/B/C/D/E/F。

## 手順
1. resolved.tsv を読み、無作為＋全「確定変数」行について、メッセージ内容が根拠(file:line)のソースに逐語で実在するか自分で grep 確認する。
2. 実在しない文言（言い換え/敬体化/要約/創作/散文説明/実行時値の差し替え）を **捏造** として列挙し、当該セルを「要ソース確認」へ差し戻す（ファイル編集）。
3. controller/テンプレを読み、拾えていない add*/Form制約/confirm・alert（抜け漏れ）を列挙。
4. 要素/トリガー/後続処理で根拠が弱いのに断定している列（過剰確定）を「要ソース確認」へ差し戻す。
5. 差し戻しは resolved.tsv と doc を直接編集する（**master への merge はしない**＝競合回避）。最後に \`cd ${REPO} && python3 ${S}/validate_messages.py\` で捏造ゼロを確認。

創作は絶対にしない。根拠が取れないものは確定せず「要ソース確認」。返り値は REVIEW_SCHEMA。`
}

function codexReviewPrompt(fid) {
  const slug = fid.toUpperCase().replace(/_/g, '-')
  return `あなたは第二の独立レビュア(codex統括)です。機能 **${fid}** の確定+fable5レビュー済みメッセージ一覧を、**codex(読み取り専用)** で実ソースに再照合し、逐語非在・値差し替え・言い換え・過剰確定を機械的に摘発して差し戻します。fable5 の判断も鵜呑みにしない。

対象: ${REPO}/message_inventory/slices/${slug}.resolved.tsv と、埋め込み済み設計書。
基準: 捏造ゼロ。\`メッセージ内容\` は「実ソースに逐語存在する固定リテラル」か「要ソース確認」の二択のみ。散文説明・要約・敬体化・変数への実行時値差し替えは全て違反。

## 手順
1. codex で独立照合（長めタイムアウト）:
\`\`\`bash
cd ${REPO} && timeout 560 codex exec --sandbox read-only - <<'PROMPT'
読み取り専用で ${REPO}/message_inventory/slices/${slug}.tsv と ${slug}.resolved.tsv を比較し、resolved.tsv の各行の「メッセージ内容」列を ${EE} 実ソース(messages.ja.yaml/validators.ja.yaml/生文字列/Twig/JS)へ照合してください。創作・推測禁止。
各行について判定JSONL: {"id":"...","verbatim_ok":true/false,"issue":"none|non_verbatim|value_substitution|paraphrase|prose_note|overclaim","should_be":"逐語literal or 要ソース確認","evidence":"file:line or 非在"}
- non_verbatim: 内容が実ソースに逐語で存在しない。
- value_substitution: %maxRecord% 等の変数へ実行時値(例 5010)を差し替えている。→ should_be は原文プレースホルダ入りリテラル or 要ソース確認。
- paraphrase: 敬体化/語尾変更/要約で原文と不一致。
- prose_note: 「例外由来の可変文言」等の散文説明が メッセージ内容 に入っている。→ should_be=要ソース確認。
- overclaim: 要素/トリガー/後続処理/種別を根拠なく断定。
問題なしは issue=none。
PROMPT
\`\`\`
2. codex出力に従い resolved.tsv を修正する:
   - verbatim_ok=false / issue≠none の行の \`メッセージ内容\` を should_be（逐語literal か「要ソース確認」）へ置換。散文の候補・理由は \`解決状態\` 列へ退避。
   - overclaim 指摘列（要素/トリガー/後続処理）は根拠が無ければ「要ソース確認」へ差し戻す。
3. 埋め込み済み設計書 doc の当該行も同じ内容へ揃える（doc とTSVの文言不一致を残さない）。逐語literalへ直せた行は doc も更新。
4. 検証（**master へ merge しない**＝競合回避）:
\`\`\`bash
cd ${REPO} && python3 ${S}/validate_messages.py
\`\`\`
   自機能 resolved.tsv と doc について、捏造ゼロ（逐語存在 or 要ソース確認）を grep で自分でも確認。NG は是正。

創作は絶対にしない。返り値は CODEX_REVIEW_SCHEMA。`
}

// 対象機能: args で指定（object {fids:[...], mode} / 配列 / JSON文字列いずれも許容）。
function parseFids(a) {
  if (!a) return []
  if (Array.isArray(a)) return a
  if (Array.isArray(a.fids)) return a.fids
  if (typeof a === 'string') {
    try {
      const p = JSON.parse(a)
      return Array.isArray(p) ? p : Array.isArray(p?.fids) ? p.fids : []
    } catch {
      return a.split(/[,\s]+/).filter(Boolean)
    }
  }
  return []
}
// mode: 'full'(既定=resolve+fable5+codexreview) / 'review'(既存resolved.tsvに対しfable5+codexreviewのみ) / 'codexonly'(codexreviewのみ)
const MODE = (args && typeof args === 'object' && !Array.isArray(args) && args.mode) || 'full'
const DEFAULT_PILOT = ['m04-31', 'm11-01', 'm08-04', 'm13-02', 'm09-10']
const requested = parseFids(args)
const FIDS = requested.length ? requested : DEFAULT_PILOT

log(`メッセージ一覧 mode=${MODE} ${FIDS.length}機能: ${FIDS.join(', ')}`)

let results
if (MODE === 'codexonly') {
  results = await parallel(
    FIDS.map((fid) => () =>
      agent(codexReviewPrompt(fid), { label: `codexrev:${fid}`, phase: 'CodexReview', schema: CODEX_REVIEW_SCHEMA })
        .then((cr) => ({ fid, codexReview: cr })),
    ),
  )
} else if (MODE === 'review') {
  results = await pipeline(
    FIDS,
    (fid) => agent(reviewPrompt(fid), { label: `fable5:${fid}`, phase: 'Fable5Review', model: 'fable', schema: REVIEW_SCHEMA }),
    (rev, fid) =>
      agent(codexReviewPrompt(fid), { label: `codexrev:${fid}`, phase: 'CodexReview', schema: CODEX_REVIEW_SCHEMA })
        .then((cr) => ({ fid, review: rev, codexReview: cr })),
  )
} else {
  results = await pipeline(
    FIDS,
    (fid) => agent(resolvePrompt(fid), { label: `resolve:${fid}`, phase: 'CodexResolve', schema: RESOLVE_SCHEMA }),
    (resolved, fid) =>
      agent(reviewPrompt(fid), { label: `fable5:${fid}`, phase: 'Fable5Review', model: 'fable', schema: REVIEW_SCHEMA })
        .then((rev) => ({ resolve: resolved, review: rev, fid })),
    (prev, fid) =>
      agent(codexReviewPrompt(fid), { label: `codexrev:${fid}`, phase: 'CodexReview', schema: CODEX_REVIEW_SCHEMA })
        .then((cr) => ({ ...prev, codexReview: cr })),
  )
}

return results.filter(Boolean)
