export const meta = {
  name: 'message-inventory-resolve-review',
  description:
    'メッセージ一覧(フラッシュ/Form/JS/twig|trans/エラー系)を機能ごとに codex(読取専用)で実ソース確定し、敵対的監査→逆バイアス二次検証の二段で摘発・是正する。確定後にメッセージIDを設計書『表示メッセージ』表へ埋め込む。',
  phases: [
    { title: 'CodexResolve', detail: '機能ごとに codex で変数/連結の未解決文言を実ソース確定し、要素/トリガー/後続処理を埋め、IDを設計書へ埋め込む' },
    { title: 'AdversarialAudit', detail: 'codex(読取専用)が「捏造を摘発せよ」の敵対バイアスで再照合し、逐語非在/値差し替え/言い換え/根拠不一致/英語取り違え/メタ齟齬を列挙する' },
    { title: 'VerifyFixes', detail: 'codex(読取専用)が逆バイアス(既定=refuted)で監査結果を独立検証し、反証できなかった指摘だけを是正値つきで確定する' },
  ],
}
// 2026-07-21 ユーザー指示によりレビューは codex のみ（fable5 は使わない）。
// 敵対バイアス1回だけでは偽陽性が大量に出る（実績: fabrication 2件中1件、wrong_en 37件中28件、
// wrong_meta 187件中55件が偽陽性）。**必ず逆バイアスの二次検証を挟んでから適用する。**

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

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['fid', 'claims', 'confirmed', 'refuted', 'applied', 'rejectedByGuard', 'gatesOk', 'summary'],
  properties: {
    fid: { type: 'string' },
    claims: { type: 'integer', description: '監査段が挙げた指摘数' },
    confirmed: { type: 'integer', description: '逆バイアス検証でも反証できず確定した指摘数' },
    refuted: { type: 'integer', description: '反証できた＝偽陽性だった指摘数' },
    applied: { type: 'integer', description: '実際に正本へ適用したセル数' },
    rejectedByGuard: { type: 'integer', description: '却下ガード(内部用語/多候補の狭め)で適用しなかった数' },
    gatesOk: { type: 'boolean', description: '4ゲート(validate/literal_strict/en_pairing/evidence_anchor)が通ったか' },
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

function verifyPrompt(fid) {
  const slug = fid.toUpperCase().replace(/_/g, '-')
  return `あなたは**二次検証**の担当です。機能 **${fid}** について、直前の敵対的監査が挙げた指摘を
**反証する側**として ${EE} 実ソースで検証し、反証できなかったものだけを是正します。

## なぜ二次検証が要るか
監査段は「捏造を摘発せよ」という強いバイアスで走らせるため**指摘が過剰に出る**。
実績: fabrication 2件中1件、wrong_en 37件中28件、wrong_meta 187件中55件が偽陽性だった。
無検証で適用すると**正しい行を壊す**。

## 立場
**既定は refuted（指摘は誤り）。** 実ソースを読んで指摘が動かしがたく正しいと確認できた場合に限り
confirmed とし、そのときだけ列ごとの是正値を出す。**判断がつかない場合も refuted。**

## 手順
1. 監査結果に対し、機能 ${fid} の分を codex(読み取り専用)で反証検証する:
\`\`\`bash
cd ${REPO} && timeout 560 codex exec --sandbox read-only - <<'PROMPT'
（監査が挙げた各指摘について、既定 refuted で反証検証せよ。confirmed のときだけ
 {"id":..,"verdict":"confirmed|refuted","fix":{"kind":..,"where":..,"disp":..,"cond":..,"next":..},"detail":".."} を返す）
PROMPT
\`\`\`
2. **却下ガードを必ず適用**してから反映する（confirmed でも適用しない）:
   - **内部用語の混入** — 「セッションの有効期限が切れているとき」→「CSRFトークンが無効なとき」等。
     設計書は利用者視点で書く規約なので改悪。ただし**その語が当該行の文言に実際に出る**なら許可。
   - **多候補行の条件の狭め** — 文言が「候補A ／ 候補B」形式の行は条件が全候補を覆う必要がある。
     列挙を含まない一般化への置換は却下。
   - **文言(ja/en)の変更提案は常に却下**（監査対象外の列）。
3. 反映は resolved.tsv と doc を直接編集する（**master への merge はしない**＝競合回避）。
4. 4ゲートを通す:
\`\`\`bash
cd ${REPO} && python3 ${S}/validate_messages.py --check-embed \\
  && python3 ${S}/check_literal_strict.py \\
  && python3 ${S}/check_en_pairing.py \\
  && python3 ${S}/check_evidence_anchor.py
\`\`\`

対象: ${REPO}/message_inventory/slices/${slug}.resolved.tsv と埋め込み済み設計書。
創作は絶対にしない。返り値は VERIFY_SCHEMA。`
}

function codexReviewPrompt(fid) {
  const slug = fid.toUpperCase().replace(/_/g, '-')
  return `あなたは**敵対的監査**の担当(codex)です。機能 **${fid}** の確定済みメッセージ一覧を
**codex(読み取り専用)** で実ソースに再照合し、**捏造を摘発する立場**で問題を列挙します。
目的は正しさの確認ではなく摘発。迷ったら違反側に倒す（過剰検出は次段の二次検証で落とす）。

対象: ${REPO}/message_inventory/slices/${slug}.resolved.tsv と、埋め込み済み設計書。
基準: 捏造ゼロ。\`メッセージ内容\` は「実ソースに逐語存在する固定リテラル」か「要ソース確認」の二択のみ。散文説明・要約・敬体化・変数への実行時値差し替えは全て違反。

## 手順
1. codex で独立照合（長めタイムアウト）:
\`\`\`bash
cd ${REPO} && timeout 560 codex exec --sandbox read-only - <<'PROMPT'
読み取り専用で ${REPO}/message_inventory/slices/${slug}.tsv と ${slug}.resolved.tsv を比較し、resolved.tsv の各行の「メッセージ内容」列を ${EE} 実ソース(messages.ja.yaml/validators.ja.yaml/生文字列/Twig/JS)へ照合してください。創作・推測禁止。
各行について判定JSONL: {"id":"...","verbatim_ok":true/false,"issue":"none|non_verbatim|value_substitution|paraphrase|prose_note|overclaim","should_be":"逐語literal or 要ソース確認","evidence":"file:line or 非在"}
- non_verbatim: 内容が実ソースに逐語で存在しない。
- fragment: **より長い正しい文言の断片**になっている（切り詰め破損）。grep は部分一致で通るため見逃しやすい。
  実例: `admin.event.entry.paying_mem`（実キーは `...paying_member_customer_not_registered`）。
- value_substitution: %maxRecord% 等の変数へ実行時値(例 5010)を差し替えている。→ should_be は原文プレースホルダ入りリテラル or 要ソース確認。
- paraphrase: 敬体化/語尾変更/要約で原文と不一致。
- prose_note: 「例外由来の可変文言」等の散文説明が メッセージ内容 に入っている。→ should_be=要ソース確認。
- wrong_evidence: 文言は実在するが、根拠 file:line が指す箇所には無い（別箇所からの流用/生成元でない）。
- wrong_en: 英語列が当該日本語の対訳でない（**別キーの英語の流用**）。ja が複数キーに一致する行で起きやすい。
- overclaim: 要素/トリガー/後続処理/種別を根拠なく断定。
問題なしは issue=none。

## 偽陽性ガード（これらを違反にしたら誤り）
- yaml 未定義でも、根拠ソース(.php/.twig/.js/.en.twig)に逐語あれば捏造ではない。
- 文言がロケールキー文字列そのものの行は、そのキーが locale **未定義**なら正しい（Symfony はキーをそのまま描画）。
- vendor/symfony の同梱翻訳(xlf の source/target)も実表示される正当なソース。
- `%name%` `{{ limit }}` `%s` の**保持は正**。置換していたら value_substitution。
- 「候補A ／ 候補B」の併記は実行時可変行の規約。各候補が逐語実在すれば正。
- ja/en を切り詰めて判定するな（「途切れ＝捏造」の誤判定になる）。
PROMPT
\`\`\`
2. codex出力に従い resolved.tsv を修正する:
   - verbatim_ok=false / issue≠none の行の \`メッセージ内容\` を should_be（逐語literal か「要ソース確認」）へ置換。散文の候補・理由は \`解決状態\` 列へ退避。
   - overclaim 指摘列（要素/トリガー/後続処理）は根拠が無ければ「要ソース確認」へ差し戻す。
3. 埋め込み済み設計書 doc の当該行も同じ内容へ揃える（doc とTSVの文言不一致を残さない）。逐語literalへ直せた行は doc も更新。
4. 検証（**master へ merge しない**＝競合回避）:
\`\`\`bash
cd ${REPO} && python3 ${S}/validate_messages.py --check-embed \\
  && python3 ${S}/check_literal_strict.py \\
  && python3 ${S}/check_en_pairing.py \\
  && python3 ${S}/check_evidence_anchor.py
\`\`\`
   `validate_messages.py` の捏造検証は **grep の部分一致**なので断片を通す。
   `check_literal_strict.py`（境界付き一致）まで通して初めて捏造ゼロと言える。

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
// args は object でも JSON文字列でも渡りうる（Workflowがシリアライズする経路がある）ので正規化する。
function parseArgs(a) {
  if (typeof a === 'string') {
    try {
      return JSON.parse(a)
    } catch {
      return a
    }
  }
  return a
}
const ARGS = parseArgs(args)
// mode: 'full'(既定=resolve+audit+verify) / 'review'(既存resolved.tsvに対し audit+verify) / 'auditonly'(監査のみ・是正しない)
const MODE = (ARGS && typeof ARGS === 'object' && !Array.isArray(ARGS) && ARGS.mode) || 'full'
const DEFAULT_PILOT = ['m04-31', 'm11-01', 'm08-04', 'm13-02', 'm09-10']
const requested = parseFids(ARGS)
const FIDS = requested.length ? requested : DEFAULT_PILOT

log(`メッセージ一覧 mode=${MODE} ${FIDS.length}機能: ${FIDS.join(', ')}`)

// 監査(敵対バイアス)→二次検証(逆バイアス)は必ずこの順で対にする。
// 監査だけを適用すると偽陽性で正しい行を壊す（meta.js 冒頭のコメント参照）。
let results
if (MODE === 'auditonly') {
  // 摘発のみ。是正はしない（人手で二次検証したいとき用）。
  results = await parallel(
    FIDS.map((fid) => () =>
      agent(codexReviewPrompt(fid), { label: `audit:${fid}`, phase: 'AdversarialAudit', schema: CODEX_REVIEW_SCHEMA })
        .then((cr) => ({ fid, audit: cr })),
    ),
  )
} else if (MODE === 'review') {
  results = await pipeline(
    FIDS,
    (fid) => agent(codexReviewPrompt(fid), { label: `audit:${fid}`, phase: 'AdversarialAudit', schema: CODEX_REVIEW_SCHEMA }),
    (audit, fid) =>
      agent(verifyPrompt(fid), { label: `verify:${fid}`, phase: 'VerifyFixes', schema: VERIFY_SCHEMA })
        .then((v) => ({ fid, audit, verify: v })),
  )
} else {
  results = await pipeline(
    FIDS,
    (fid) => agent(resolvePrompt(fid), { label: `resolve:${fid}`, phase: 'CodexResolve', schema: RESOLVE_SCHEMA }),
    (resolved, fid) =>
      agent(codexReviewPrompt(fid), { label: `audit:${fid}`, phase: 'AdversarialAudit', schema: CODEX_REVIEW_SCHEMA })
        .then((audit) => ({ resolve: resolved, audit, fid })),
    (prev, fid) =>
      agent(verifyPrompt(fid), { label: `verify:${fid}`, phase: 'VerifyFixes', schema: VERIFY_SCHEMA })
        .then((v) => ({ ...prev, verify: v })),
  )
}

return results.filter(Boolean)
