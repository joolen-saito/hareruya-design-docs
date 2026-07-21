export const meta = {
  name: 'message-inventory-js-assign',
  description:
    'JS由来メッセージ(EE-JS-*)をテンプレ単位で codex(読取専用)が実ソースから機能へ確定割当し、fable5 が独立に誤割当・捏造を批判レビューする。',
  phases: [
    { title: 'CodexAssign', detail: 'テンプレ→ルート→設計書を辿り、行ごとの帰属機能を実ソース根拠付きで確定' },
    { title: 'Fable5Verify', detail: 'fable5 が割当と文言を独立再照合し、誤割当/過剰確定/捏造を差し戻す', model: 'fable' },
  ],
}

const REPO = '/home/y-saito/Developments/hareruya-design-docs'
const EE = '/home/y-saito/Developments/ec-cube-enterprise'
const S = `${REPO}/.codex/skills/hareruya-message-inventory/scripts`

const ASSIGN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tpl', 'rows', 'assigned', 'unassigned', 'routes', 'contentFixed', 'validateOk', 'summary'],
  properties: {
    tpl: { type: 'string' },
    rows: { type: 'integer', description: '当該テンプレのEE-JS行数' },
    assigned: { type: 'integer', description: '機能IDを実ソース根拠付きで確定できた行数' },
    unassigned: { type: 'integer', description: '根拠不足で未割当のまま残した行数' },
    routes: { type: 'string', description: '特定したルート名（カンマ区切り）' },
    contentFixed: { type: 'integer', description: 'メッセージ内容の是正行数（逐語化/要ソース確認へ差し戻し）' },
    validateOk: { type: 'boolean' },
    summary: { type: 'string' },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tpl', 'misassigned', 'hallucinations', 'overclaims', 'revertedToTBD', 'validateOk', 'summary'],
  properties: {
    tpl: { type: 'string' },
    misassigned: { type: 'integer', description: '誤った機能割当の指摘数' },
    hallucinations: { type: 'integer', description: '実ソース非在の文言混入数' },
    overclaims: { type: 'integer', description: '根拠が弱いのに断定していた数' },
    revertedToTBD: { type: 'integer', description: '未割当/要ソース確認へ差し戻した数' },
    validateOk: { type: 'boolean' },
    summary: { type: 'string' },
  },
}

function assignPrompt(g) {
  return `あなたはJS由来メッセージの機能割当エンジニアです。テンプレ **${g.tpl}** に属する ${g.n} 件の EE-JS メッセージを、**codex(読み取り専用)** で実ソースから帰属機能へ確定割当します。

作業ファイル(**ここだけを編集する**): ${REPO}/message_inventory/slices/js/${g.slug}.tsv
（列は TEMPLATE.md。\`機能候補(要検証)\` は決定的マッパの候補＝**正ではない。必ず検証する**。マスタ message_inventory.tsv は編集しない＝並行実行の競合回避）
正本ソース: ${EE}（読み取り専用）。設計書: ${REPO}/functions/**/*.md

## 絶対ルール（捏造ゼロ）
- \`メッセージ内容\` は「実ソースに逐語存在する固定リテラル」か「要ソース確認」の二択のみ。
  散文説明・要約・敬体化・実行時値の差し替え（%maxRecord%→5010 等）は違反。散文は \`解決状態\` 列へ。
- 機能割当は**実ソースの参照で裏取りできた場合のみ**。推測で機能を割り当てない。
  裏取り不能なら未割当のまま残す（\`機能候補(要検証)\` に理由を書く）。

## 手順
1. codex で帰属機能を確定（長めタイムアウト）:
\`\`\`bash
cd ${REPO} && timeout 560 codex exec --sandbox read-only - <<'PROMPT'
読み取り専用で調査してください。創作・推測禁止。
テンプレ ${g.tpl} を描画するコントローラ動作を特定し（#[Template]/render()/親テンプレのinclude・embed・extends を辿る）、その #[Route(name:)] を列挙してください。
次に ${REPO}/functions 配下の設計書から、そのルート/画面に対応する機能ID（例 m03-21）を特定してください。設計書のルート記載・画面名・URL を根拠にすること。
さらに ${REPO}/message_inventory/slices/js/${g.slug}.tsv の全EE-JS行について、各行の 根拠(file:line) の実コードを読み、その行が「どの機能の操作で表示されるか」を判定してください（対象IDは同ファイルの1列目から読むこと）
同一テンプレでも行ごとに帰属機能が異なりうる（一覧画面と編集モーダルなど）ので行単位で判定すること。
出力JSONL: {"id":"EE-JS-MSG-xxx","fid":"m03-21 or null","route":"ルート名","evidence":"file:line（テンプレ→controller→route→設計書の根拠）","content_verbatim_ok":true/false,"content_fixed":"逐語文言 or null","element":"操作要素","trigger":"表示条件","followup":"後続処理","note":"根拠 or 判定不能の理由"}
fid は設計書に実在する機能IDのみ。裏取りできなければ null。
PROMPT
\`\`\`
2. codex出力を ${REPO}/message_inventory/slices/js/${g.slug}.resolved.tsv として書き出す（入力スライスの全行を12列で保持し、確定値を反映）:
   - fid が確定した行: \`機能候補(要検証)\` を確定fidに更新し、\`画面\` 列を「<fid> <設計書タイトル>」へ。\`根拠\` に evidence を追記。
   - \`メッセージ内容\` が逐語非在なら content_fixed（逐語）へ是正、取れなければ「要ソース確認」。
   - \`要素\`/\`トリガー（条件）\`/\`後続処理\` を根拠が取れた範囲で埋める（根拠なきものは「要ソース確認」のまま）。
   - fid が null の行は未割当のまま残し、理由を \`機能候補(要検証)\` に短く書く。
3. 検証:
\`\`\`bash
cd ${REPO} && python3 ${S}/validate_messages.py
\`\`\`
   自分でも grep で当該行の文言が実ソースに逐語存在することを確認する。非在0でなければ是正。

**設計書へのID埋め込みはこの段階では行わない**（IDが <FID>-MSG-### へ再採番されるため、割当確定後に一括実施する）。
返り値は ASSIGN_SCHEMA。`
}

function verifyPrompt(g) {
  return `あなたは独立レビュア(fable5)です。テンプレ **${g.tpl}** の EE-JS メッセージ ${g.n} 件について、codex が行った**機能割当**と**文言**を鵜呑みにせず ${EE} 実ソースで再照合し、誤割当・捏造・過剰確定を摘発します。

対象ファイル(**ここだけを編集する**): ${REPO}/message_inventory/slices/js/${g.slug}.resolved.tsv
基準: ${REPO}/.codex/skills/hareruya-message-inventory/references/CHECKLIST.md

## 手順
1. 各行の \`根拠(file:line)\` の実コードを自分で読み、\`メッセージ内容\` が実ソースに**逐語**存在するか grep で確認する。
   言い換え/敬体化/要約/散文説明/実行時値の差し替えは**捏造**として当該セルを「要ソース確認」へ差し戻す。
2. 割り当てられた機能IDを検証する。テンプレ→コントローラ→ルート→設計書の鎖を自分で辿り、
   一致しなければ**誤割当**として指摘し、正しい機能が特定できなければ未割当へ差し戻す。
   「同じ画面にあるから」という理由だけの割当は根拠不足＝過剰確定として差し戻す。
3. 要素/トリガー/後続処理で根拠が弱いのに断定している列を「要ソース確認」へ差し戻す。
4. 修正は上記 resolved.tsv のみ行う（マスタには触れない＝競合回避）。最後に
   \`cd ${REPO} && python3 ${S}/validate_messages.py\` で非在0を確認。

創作は絶対にしない。根拠が取れないものは確定しない。返り値は VERIFY_SCHEMA。`
}

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
const ARGS = parseArgs(args) || {}
const GROUPS = Array.isArray(ARGS.groups) ? ARGS.groups : []
if (!GROUPS.length) throw new Error('args.groups (=[{tpl,ids,n}]) を指定してください')

log(`JSメッセージ機能割当 ${GROUPS.length}テンプレ / 計${GROUPS.reduce((s, g) => s + g.n, 0)}件`)

const results = await pipeline(
  GROUPS,
  (g) => agent(assignPrompt(g), { label: `assign:${g.tpl.split('/').pop()}`, phase: 'CodexAssign', schema: ASSIGN_SCHEMA }),
  (asg, g) =>
    agent(verifyPrompt(g), { label: `verify:${g.tpl.split('/').pop()}`, phase: 'Fable5Verify', model: 'fable', schema: VERIFY_SCHEMA })
      .then((v) => ({ tpl: g.tpl, assign: asg, verify: v })),
)

return results.filter(Boolean)
