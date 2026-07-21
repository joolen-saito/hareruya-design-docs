export const meta = {
  name: 'message-inventory-ee-assign',
  description:
    '未割当のフラッシュ/フォーム由来メッセージ(EE-*)を、codex(読取専用)が実ソースから機能へ確定割当し、fable5 が独立に誤割当・捏造を批判レビューする。',
  phases: [
    { title: 'CodexAssign', detail: 'Controller/Form→ルート→設計書を辿り、行ごとの帰属機能を実ソース根拠付きで確定' },
    { title: 'Fable5Verify', detail: 'fable5 が割当と文言を独立再照合し、誤割当/過剰確定/捏造を差し戻す', model: 'fable' },
  ],
}

const REPO = '/home/y-saito/Developments/hareruya-design-docs'
const EE = '/home/y-saito/Developments/ec-cube-enterprise'
const S = `${REPO}/.codex/skills/hareruya-message-inventory/scripts`

const ASSIGN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'rows', 'assigned', 'unassigned', 'contentFixed', 'validateOk', 'summary'],
  properties: {
    slug: { type: 'string' },
    rows: { type: 'integer' },
    assigned: { type: 'integer', description: '機能IDを実ソース根拠付きで確定できた行数' },
    unassigned: { type: 'integer', description: '根拠不足で未割当のまま残した行数' },
    contentFixed: { type: 'integer', description: 'メッセージ内容の是正行数' },
    validateOk: { type: 'boolean' },
    summary: { type: 'string' },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'misassigned', 'hallucinations', 'overclaims', 'revertedToTBD', 'validateOk', 'summary'],
  properties: {
    slug: { type: 'string' },
    misassigned: { type: 'integer' },
    hallucinations: { type: 'integer' },
    overclaims: { type: 'integer' },
    revertedToTBD: { type: 'integer' },
    validateOk: { type: 'boolean' },
    summary: { type: 'string' },
  },
}

function assignPrompt(g) {
  return `あなたはメッセージ一覧の機能割当エンジニアです。**${g.dir}** 配下の ${g.n} 件の未割当メッセージ(EE-*)を、**codex(読み取り専用)** で実ソースから帰属機能へ確定割当します。

対象ソース: ${g.files.join(', ')}
作業ファイル(**ここだけを編集する**): ${REPO}/message_inventory/slices/ee/${g.slug}.tsv
正本ソース: ${EE}（読み取り専用）。設計書: ${REPO}/functions/**/*.md

## 並行実行の作法（厳守）
- 他エージェントが同時に走る。中間ファイルは自分専用パス \`/tmp/msginv_ee/${g.slug}/\` を mkdir -p して使う。
- **\`pkill\` 等の他プロセス停止コマンドは絶対に実行しない**。失敗時は出力先を変えて再実行する。
- 編集してよいのは自分のスライスだけ。マスタ・他スライス・設計書には触れない。

## 絶対ルール（捏造ゼロ）
- \`メッセージ内容\` は「実ソースに逐語存在する固定リテラル」か「要ソース確認」の二択のみ。
  散文説明・要約・敬体化・実行時値の差し替え（%maxRecord%→5010 等）は違反。散文は \`解決状態\` 列へ。
- 機能割当は**実ソースの参照で裏取りできた場合のみ**。推測で割り当てない。裏取り不能なら未割当のまま残し、
  \`機能候補(要検証)\` に理由を書く。
- \`機能候補(要検証)\` の既存値は決定的マッパの**候補**であり正ではない。特に
  「弱い候補:参照元controller由来」と付いたものは参照元controllerの全ルートの和に過ぎない。必ず検証する。

## 手順
1. codex で帰属機能を確定（長めタイムアウト）:
\`\`\`bash
mkdir -p /tmp/msginv_ee/${g.slug} && cd ${REPO} && timeout 560 codex exec --sandbox read-only - > /tmp/msginv_ee/${g.slug}/codex.out <<'PROMPT'
読み取り専用で調査してください。創作・推測禁止。
対象: ${REPO}/message_inventory/slices/ee/${g.slug}.tsv の全行（IDは1列目、根拠は 根拠(file:line) 列）。
各行について:
(a) 根拠の実コードを読み、そのメッセージを出すメソッドを特定し、直上の #[Route(name:, path:)] を取る。
    FormType の制約なら、そのFormTypeを使う Controller とルートまで辿る。
(b) そのルート/URLパス/画面に対応する機能ID（例 m09-03）を ${REPO}/functions 配下の設計書から特定する。
    設計書のURL・ルート名・画面名・処理内容を根拠にすること。複数機能が同一controllerを共有する場合は
    行ごとにどの操作(メソッド)由来かで切り分ける。
(c) メッセージ内容が根拠に逐語存在するか確認。変数/例外由来で単一literalに確定できないものは null。
出力JSONL: {"id":"EE-...","fid":"m09-03 or null","route":"ルート名","evidence":"file:line の鎖","content_verbatim_ok":true/false,"content_fixed":"逐語文言 or null","element":"操作要素","trigger":"表示条件","followup":"後続処理","note":"根拠 or 判定不能の理由"}
fid は設計書に実在する機能IDのみ。裏取りできなければ null。
PROMPT
\`\`\`
2. codex出力を ${REPO}/message_inventory/slices/ee/${g.slug}.resolved.tsv として書き出す（入力スライスの全行を12列で保持）:
   - fid 確定行: \`機能候補(要検証)\` を確定fidのみに更新（弱い候補の注記は消す）、\`画面\` を「<fid> <設計書タイトル>」へ、\`根拠\` に evidence を追記。
   - \`メッセージ内容\` は逐語literal か「要ソース確認」。
   - \`要素\`/\`トリガー（条件）\`/\`後続処理\` を根拠が取れた範囲で埋める（根拠なきものは「要ソース確認」）。
   - fid が null の行は未割当のまま残し、理由を \`機能候補(要検証)\` に短く書く。
3. 検証: \`cd ${REPO} && python3 ${S}/validate_messages.py\`。自分でも grep で逐語存在を確認する。

**設計書への埋め込みはこの段階では行わない**（割当確定後に一括で再採番・埋込する）。
返り値は ASSIGN_SCHEMA。`
}

function verifyPrompt(g) {
  return `あなたは独立レビュア(fable5)です。**${g.dir}** 配下 ${g.n} 件のメッセージについて、codex が行った**機能割当**と**文言**を鵜呑みにせず ${EE} 実ソースで再照合し、誤割当・捏造・過剰確定を摘発します。

対象ファイル(**ここだけを編集する**): ${REPO}/message_inventory/slices/ee/${g.slug}.resolved.tsv
基準: ${REPO}/.codex/skills/hareruya-message-inventory/references/CHECKLIST.md

## 手順
1. 各行の \`根拠(file:line)\` の実コードを自分で読み、\`メッセージ内容\` が実ソースに**逐語**存在するか grep で確認する。
   言い換え/敬体化/要約/散文説明/実行時値の差し替えは**捏造**として「要ソース確認」へ差し戻す。
2. 割り当てられた機能IDを検証する。Controller/FormType→ルート→設計書の鎖を自分で辿り、
   一致しなければ**誤割当**として指摘し、正しい機能を特定できなければ未割当へ差し戻す。
   「同じcontrollerだから」という理由だけの割当は根拠不足＝過剰確定として差し戻す。
   同一controllerに複数機能がぶら下がる場合、行ごとのメソッド単位で正しく切り分けられているか確認する。
3. 要素/トリガー/後続処理で根拠が弱いのに断定している列を「要ソース確認」へ差し戻す。
4. 修正は上記 resolved.tsv のみ（マスタ・設計書には触れない）。最後に
   \`cd ${REPO} && python3 ${S}/validate_messages.py\` で非在0を確認。
5. \`pkill\` 等の他プロセス停止コマンドは実行しない。

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
if (!GROUPS.length) throw new Error('args.groups (=[{slug,dir,files,n}]) を指定してください')

log(`EEメッセージ機能割当 ${GROUPS.length}群 / 計${GROUPS.reduce((s, g) => s + g.n, 0)}件`)

const results = await pipeline(
  GROUPS,
  (g) => agent(assignPrompt(g), { label: `assign:${g.slug}`, phase: 'CodexAssign', schema: ASSIGN_SCHEMA }),
  (asg, g) =>
    agent(verifyPrompt(g), { label: `verify:${g.slug}`, phase: 'Fable5Verify', model: 'fable', schema: VERIFY_SCHEMA })
      .then((v) => ({ slug: g.slug, assign: asg, verify: v })),
)

return results.filter(Boolean)
