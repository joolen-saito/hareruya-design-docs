---
name: hareruya-scenario-test-cases
description: Generate or regenerate Hareruya business scenario test Markdown from scenario_test/markdown business-flow documents plus HTML/function design documents, including scenario lists and traceability.
---

# Hareruya Scenario Test Cases

Use this skill when creating or regenerating scenario test Markdown under `scenario_test/scenario` from:

- Business-flow Markdown: `scenario_test/markdown/*.md`
- Basic-design HTML: `excel_to_html/output/*.html`
- Function design docs: `functions/**/*.md`
- Optional function HTML previews: `function_spec_html_preview/**/*.html`

## Workflow

1. Review the template and checklist:

```bash
sed -n '1,220p' .codex/skills/hareruya-scenario-test-cases/references/TEMPLATE.md
sed -n '1,220p' .codex/skills/hareruya-scenario-test-cases/references/CHECKLIST.md
```

2. Dry-run generation and inspect planned files:

```bash
python3 .codex/skills/hareruya-scenario-test-cases/scripts/generate_scenarios.py --repo . --dry-run
```

3. Generate scenario files:

```bash
python3 .codex/skills/hareruya-scenario-test-cases/scripts/generate_scenarios.py --repo . --overwrite --prune-obsolete --archive-legacy-manual
```

4. Validate generated files:

```bash
python3 .codex/skills/hareruya-scenario-test-cases/scripts/validate_scenarios.py --repo . --generated-only
```

## Target Output

The generator writes:

- `scenario_test/scenario/SCN-*.md`
- `scenario_test/scenario/01_シナリオ一覧.md`
- `scenario_test/scenario/02_トレーサビリティ.md`
- `scenario_test/scenario/03_カバレッジ表.md`（`非EC-CUBE作業` / `番号重複警告` 列を含む）
- `scenario_test/scenario/05_設計書カバレッジ.md`（全機能Noのトレース状態を分類する誠実な台帳）
- `scenario_test/scenario/all_scenarios.tsv`
- `scenario_test/scenario/00_アクター一覧.md` when missing
- `scenario_test/scenario/README.md` when missing

## Generation Rules

- Treat business-flow Markdown as the trace origin. Do not invent workflows that are not present in `scenario_test/markdown`.
- Consolidate duplicate as-is / to-be patterns by business, pattern number, and normalized pattern name. Prefer `*_tobe.md` when duplicate patterns exist.
- Use HTML/function design docs only to identify screens, APIs, batches, endpoints, data behavior, and existing function-spec paths.
- Prefer the explicit expected-function dictionary in `scripts/generate_scenarios.py` over keyword ranking for traceability.
- Generate scenarios at the business-route grain. A parent business-flow pattern can produce multiple `SCN` files: one normal representative route, source-backed major alternative routes, and high-risk abnormal routes whose business decision, downstream work, or final state changes.
- Each generated scenario must include route metadata in `## 概要`: `経路ID`, `経路種別`, `親業務フローパターン`, `業務経路条件`, and `最終業務状態`. `業務フロー番号` must include both parent pattern and route, such as `デッキ登録 / パターン1 / 経路2`.
- Generate `all_scenarios.tsv` in the same order as the scenario-test-item aggregate: order businesses by the minimum first-touched feature No rank, keep each business contiguous, and sort scenarios inside each business by the SCN ordinal.
- Treat route metadata and `DP-*` rows as the downstream contract for `hareruya-scenario-test-items`: STI generation must be able to create a route-level test row, route-scoped normal rows, and route-specific branch/error rows without inferring parent-pattern behavior.
- Keep `DP-*` as data variations inside the route-level scenario. Do not use data patterns as a substitute for splitting distinct business routes.
- Scope expected function numbers, linked function numbers, and related HTML/function docs to the route rows and route-specific edge cases that the scenario actually exercises or observes. Do not assign the whole parent pattern's design surface to every child route.
- Write the main flow from a business perspective. The primary columns are `担当者`, `業務行動`, `利用画面・機能`, and `確認する業務結果`; function numbers are supporting context, not the main action.
- Write execution-ready scenarios with `## 実行用テストデータ`, `## 実行手順（正常系）`, and `## 実行手順（代替系・異常系）`. Use deterministic seed IDs such as `ST-ORDER-*`, `ST-STOCK-*`, `ST-CARD-*`, `ST-EVENT-*`, and `ST-DECK-*`.
- Write `## データパターン` for every scenario. Use stable `DP-*` IDs and cover route representative data, route boundary data, and route-specific alternative/error data such as authorization, duplicate execution, required/format errors, and business-specific boundary values.
- Promote alternative/error flows to separate route-level scenarios when the business-flow Markdown contains cancellation, refund, shortage, mismatch, rejection, timeout, failed integration, or other branch conditions that change business judgment or final state. Keep any remaining checks out of the normal route and write separate executable branch steps.
- Write expected results as observable business or screen outcomes.
- Generate business-focused edge cases from the common and business-specific dictionaries in `scripts/generate_scenarios.py`. Never pad the edge-case count: a case is adopted only when the business flow actually contains the condition, never to reach a target count.
- Do not use vague expected results such as `設計どおり` or `設計書に記載のとおり`.
- Preserve manually edited scenario files, but exclude them from generated `01_シナリオ一覧.md`, `02_トレーサビリティ.md`, and `03_カバレッジ表.md` unless they are regenerated by the harness.
- Use `--archive-legacy-manual` to move non-canonical manual `SCN-*.md` files to `scenario_test/scenario/_legacy_manual/` so the scenario root contains only the canonical generated set.
- Use `--prune-obsolete` to remove obsolete auto-generated scenario files that are no longer in the canonical generated set.
- Prefer function design Markdown paths in traceability; include HTML paths as design-source evidence.
- Do not leave unresolved placeholders in generated system-test scenarios. `> [要確認]`, `UNRESOLVED_FUNCTION_SPEC`, and `UNRESOLVED_HTML_DESIGN_DOC` must fail strict validation.
- Generated scenarios must include `確認対象` for every alternative/error branch, executable branch steps, expected/linked function numbers, and `## エッジケース要約`.

## 物理作業 / 外部システム / EC-CUBE の切り分け（機能No誤割当の禁止）

- 業務フローには **物理作業**（ピッキング、梱包、郵送、バーコード貼付、引渡しサイン）と **外部システム/ツール操作**（スマレジ、Backlog、スプレッドシート、メーラー）が混在する。これらに EC-CUBE の機能Noを割り当ててはならない。その画面では観測できない期待結果（「納品書にサインを頂くこと。」を A05-03 で確認する等）が生まれ、システムテストとして実行不能になる。
- 切り分けはノード表（`| # | フェーズ | 実行主体(レーン) | 種別 | テキスト |`）を根拠にする。`20_凡例.md` が図形種別 `手作業` を定義し、レーンに `EC-CUBE（本店）` / `スマレジ / システム` / `店舗 / チーム` 等が入る。`**[作業概要]**` をノードのテキストへ突き合わせて `parse_flow_nodes` / `classify_work` が判定する。索引行だけを読んでノード表を捨ててはならない。
- **`assign_step_docs` は類似度ゼロの行に設計書を割り当てない。** 「余っている設計書の先頭を埋める」フォールバックは、根拠のない機能No（貼替作業に「セール用価格変更CSV出力」等）を生むため禁止。未特定は `要確認（EC-CUBE工程だが機能Noを特定できない）` として可視化する。
- 判定できない工程（`手作業` ノードだが CSV/インポート等のシステム操作を含む等）は、**推測せず要確認として出す**。`要確認` は原則禁止語だが、判定不能を明示する所定のラベルのみ許可する（`ALLOWED_UNRESOLVED_LABELS`）。曖昧なまま EC-CUBE 画面に結び付けるより、判定不能と書くほうが正しい。
- 作業内容が複数行に分かれる場合、種別判定は**継続行の連結後**に行う。1行目だけでは「セール品リスト作成…この際にCSVを作成する」を物理作業と誤判定する。
- 物理作業・外部システム作業・要確認のステップに機能Noが付いていないことを `validate_scenarios.py` が検査する。

## To-Be の扱い（As-Is 混入の防止）

- **ファイル名（`_tobe` の有無）で As-Is / To-Be を判断してはならない。** 各業務フローの冒頭 `R3` に方針が明記されている（`06_店頭買取.md`「※tobeではなくこちらを新フローとして記載」、`12_在庫管理.md`「※新規に業務フローを起こしている」、`16_通販受注管理.md`「※すでにあるtobeで問題ないので変更なし」）。
- As-Is 由来が実害になるのは、To-Be で工程の**新規追加・置換・廃止**が明記されているのに、その対応が管理されていない場合。例: `10_商品登録・編集_tobe.md`「商品規格画面から在庫を操作できなくなり、在庫編集を使う」。
- **索引表に載っているのに本文の作業行が無いパターンは警告する**（`missing_index_patterns`）。To-Be の新規業務が索引だけに書かれている場合、パーサが認識できずシナリオが1件も生成されない（例: `17_通販受注管理_tobe.md` の「13 ｜【新規追加】在庫移動準備業務」）。黙って落とすと未テストのまま気付けない。

## 層の分離（結合テストとの重複禁止）

- **機構的異常系（権限 / 必須・形式不正 / 重複実行 / 検索0件）はシステムテスト層で重ねない**。これらは `integration-test-viewpoints.md` の IT-15 / IT-22 / IT-08 / IT-23・IT-14 が機能単位で網羅する観点であり、シナリオ側に置くと同じ確認を二重に持つだけで業務観点は増えない。シナリオ層が担うのは、業務判断・後続作業・最終業務状態が変わる分岐に限る。
- 委譲は `## 他層委譲（結合テスト）` に出す。**委譲先は観点ID（IT-15 等）ではなく `integration_test/*_it_cases.md` に実在するテストID**で示す。観点IDだけでは「どのケースで試験したか」を特定できず実行証跡にならない。委譲先が存在しない場合は `未整備` と表示し、穴を隠さない。
- `edge_case_matches` のキーワードに `対象` / `確認` / `登録` / `更新` / `変更` のような汎用語を入れてはならない。業務フロー本文にその語が1つあるだけで発火し、ほぼ全シナリオへ結合テスト相当のケースが混入する。
- **業務分岐が無い経路は「分岐0件」が正しい姿**。COMMON を件数合わせで埋め戻さない。0件の経路は `代替系` / `異常系` を `-` と表示し、`## 他層委譲（結合テスト）` で担保先を示す。カバレッジ表で `異常系=○` と偽ってはならない（`validate_scenarios.py` が検出する）。
- `03_カバレッジ表.md` は `実行エッジ数`（このシナリオで実際に実行する業務分岐の延べ件数）と `他層委譲` / `委譲未整備` を分離する。**延べ件数であってユニークな異常条件数ではない**ため、層の分離前後で網羅率として直接比較しない。

## Design-Doc Coverage Honesty (誠実な網羅可視化)

- `03_カバレッジ表.md` の `期待機能不足` は辞書との差分のみを示すため、辞書に載らない機能は不可視になる。網羅性を過大評価しないため、`05_設計書カバレッジ.md` で `functions/**/*.md` の**全機能No**を分類して出す。
- 分類は `covered`（シナリオがトレース）／`area-covered-feature-uncovered`（業務領域はカバー済み・個別機能は機能テスト層で担保）／`out-of-scope:*`（`OUT_OF_SCOPE_FEATURES` 辞書で管理・理由付き）／`excluded-ph2`（`EXCLUDED_FEATURE_IDS`）／`source-backed-uncovered`（要判定＝業務フロー接点があり得るのに未トレースの真の穴候補）。
- 業務フロー準拠を維持する。`source-backed-uncovered` を機械的にシナリオ化せず、要判定として人手レビューに回す。業務フローが実際に触れる機能が誤割当・欠落している場合のみ `EXPECTED_FUNCTIONS` を補正する。
- 要判定の disposition（解消）は次の2択のみ。台帳を埋めるためだけの機能No追加（ledger-gaming）は禁止。
  - **TRACE-IN**（`EXPECTED_FUNCTIONS` へ追補）: (1) 命名した業務フロー行が実在し、(2) 対象シナリオがその機能を**実際に行使/観測**する場合に限る。keyword は**必ず実在する作業概要（`**[＃]**` 行）またはパターン名に一致**させること。作業内容の継続行は `pattern.rows` に入らず keyword が発火しないため、継続行の語をkeywordにしてはならない。追補後は対象シナリオの `期待/紐づけ機能No` に実際に出ることを検証する。
  - **OUT-OF-SCOPE**（`OUT_OF_SCOPE_FEATURES` へ理由付きで追加）: 業務フローに人手工程が無い（フロント表示/連携API/定常バッチ/管理マスタ設定/Ph2）。prefixが1カテゴリなら prefix キー、分裂するなら完全IDキー＋prefix既定を併用（`classify_feature` は traced→exact→prefix の順で、trace-in と out-of-scope を同一prefix内で両立できる）。
- 正常系ステップへの機能No割当は位置ベースではなく `assign_step_docs` によるキーワード束ね（発火したキーワードを含む作業概要行へ機能Noを対応付け、残りは位置順で充当）。同一キーワードに複数機能がある場合は業務中核機能を優先する。
- 正常系ステップの先頭は実作業にする。パターン見出し行（＃番号がパターン番号と一致＝作業概要がパターン名の「…を行う」）は、下位ステップ（N-M）があれば `is_pattern_header_row` で除外する（下位が無いパターンは見出しが唯一のステップなので維持）。丸数字サブ番号（`10-①`）も番号として除去する。
- ステップの並びはサブ番号順にする。`assign_rows` は本文（図形再構成）の出現順で行を取り込むため、`sort_pattern_rows` で各パターン内を N-M のサブ番号（丸数字含む）順に安定ソートし、業務の実施順に揃える。
- 親番号の重複（例: 12_在庫管理 の #8 欠品対応/安価カード）に対応する。`assign_rows` は親見出しの出現位置でサブ行を振り分け（`by_number`＋現在パターン）、重複番号でも各業務へ正しく行を分離する。さらに `renumber_duplicate_patterns` で2件目以降の重複番号を未使用の整数へ振り直す（1件目は番号維持で asis/tobe 統合を壊さない）。
- 業務フロー Markdown で「作業内容」が複数行に分割されている場合、`assign_rows` は `**[＃]**` を持たない継続行を直前ステップに連結して取りこぼしを防ぐ（例: 「…商品CSV出力」＋「からcsvファイルをダウンロードする」）。ただし (1) R番号が `MERGE_GAP` 超で飛ぶ別作業の補足行は連結しない、(2) 連結部は `ROW_SEP` で区切り、`is_branch_row`/構造判定/キーワード照合は**主文（primary_text）のみ**で行う（表示＝業務行動は full_text で全文）。これにより継続行の補足語（不可/差異/エラー等）で正常系ステップが誤って分岐化しない。
- 非EC-CUBE作業（`EC-CUBEを使わない`／`メーラーでのみ`／`Thunderbirdでのみ`、またはパターン名に「メーラー」）は EC-CUBE 画面/機能Noを自動割当しない。観測点はメール/電話/外部アプリ側（EC-CUBE更新なし）とし、`03_カバレッジ表.md` の `非EC-CUBE作業` に印を付ける。弱い語（`手動で対応` 等）は EC-CUBE 中心フローの一工程なので非EC-CUBE判定に使わない。
- 同一業務フローファイル内でパターン番号が別名と重複する場合（在庫管理 #7/#8 等）は `番号重複警告` に印を付け、トレースは業務フローキー（出典＋番号＋作業概要）で識別する。
- 業務固有エッジケースは `PATTERN_EDGE_CASES`（パターン名部分一致）を最優先し、汎用ケース偏重を避ける（バーコード貼替＝旧バーコード混在、在庫0枚集計＝条件別集計、SPLINKS返金＝減額不可/二重返金/一部返金、予約＝発売日集荷/出荷インポート 等）。

## 代替/異常分岐の実施画面（位置ベース割当の禁止）

- **`render_alternative_execution_steps` で設計書を位置ベース（`docs[idx-1]`）に割り当ててはならない。** 条件と無関係な画面が実施画面になり、その画面では観測できない期待結果を生む。本流の `assign_step_docs` が禁じている「余っている設計書を埋める」挙動と同じ誤りである。
- 実例（修正済み）: 別部署からの発注依頼（原典はGoogleフォーム/ラベル印字/台帳/メール起点）の「在庫不足」分岐に `F04-01（買い物かご）` が割り当たっていた。同様の誤マップがフロント画面で14件あった。
- `edge_case_screen` は、分岐条件・期待・観測点と設計書名が **`BUSINESS_VOCAB` の業務語を実際に共有する場合だけ** 画面を決める。一致が無ければ画面を書かず `（実施画面は要確認。機能Noを特定できていない）` を出す。
- **操作方向の矛盾を除外する。** 入力系（形式不正/必須/取込/インポート/登録）の分岐に出力系（出力/エクスポート/ダウンロード）の設計書を割り当てない。逆も同様（「価格CSVの形式不正」を「価格変更CSV出力」に付ける類の逆方向割当を防ぐ）。
- **首位同点は特定不能として要確認にする。** 業務語一致の最高スコアが複数の設計書で並ぶ場合（例: デッキ系画面が複数一致）、どれか特定できないので画面を書かない。粗い語彙一致で無関係画面を付けるより誠実。
- **担当者が顧客でない分岐に、顧客向けフロント画面(F**)を割り当てない。** 社内チームの例外処理（本人確認不備・キャンセル・返金・在庫不足対応）はフロント画面では実施できない。社内画面が候補に無い場合もフロントへフォールバックせず、要確認とする。
- `infer_actor` は「お客様対応」「顧客対応」で主アクターをお客様に倒さない。これは社内チームが顧客対応する業務であり、実行主体は社内である。

## 工程の具体化と「要確認」全廃（08トリアージレジスタ接続）

- **テストケースに「要確認」表現を残さない（依頼者確定）。** 全工程を種別ごとに人間が検証できる具体手順へ落とす。`ALLOWED_UNRESOLVED_LABELS` は両生成器・両バリデータで**空**にし、出力に `要確認` が1つでもあれば検証エラー＝要確認ゼロを機械保証する。
- **`08_要確認トリアージ.tsv`（人手判定・機能No実在検証済み）を生成器が接続する**（`load_triage_register`/`resolve_step_via_triage`、キー=(業務, R番号)）。要確認だった工程を判定別に具体化する:
  - **TRACE-IN/AUTO** → 機能No（カンマ区切り複数可）の画面。主画面は `pick_primary_feature` が操作動詞（CSV/出力→出力系、取込→取込系、承認→承認系）で選ぶ（先頭固定は CSV出力工程に一覧画面を割当てる誤りを生む）。
  - **EXTERNAL** → 外部システム/ツール作業（EC-CUBE操作なし・業務結果で観測）。
  - **PHYSICAL/CUSTOMER** → 現場作業（現物・帳票・数量・サインで観測。EC-CUBE反映確認は業務結果の観測のみ＝依頼者確定）。
  - **DECISION** → 業務判断（分岐条件を評価。各分岐は代替/異常経路のシナリオで確認）。
  - **UNKNOWN/未収載** → 業務フロー記載の操作として実施し業務結果で観測（画面は創作しない）。
- **`[要判断]` 行の機能Noは割り当てない（捏造防止・codec指摘）。** 判定理由が `[要判断]`（GAP=承認/入庫確定の専用設計書なし・DOC=重複ドキュメント疑い・DECIDE=EC部分の要否未確定）の TRACE-IN 行は、割当機能doc自身がその作業を対象外と明記しているため、機能割当せず FLOW_ONLY（業務フロー記載の操作＋業務結果観測）に落とす。近接機能で観測させない。
- **データ連鎖の未定義は事実宣言＋観測手順にする**（「要確認」を使わない）: 自由端の消費先→`終端（消費先の記載なし・完了条件で観測）`、産出元なし→`起点（消費工程で観測）`、遷移線なし→`完了条件の最終業務状態で観測`。照合キー未定義→`シードID単一データ環境で同一性を担保`。

## 代替/異常分岐は業務フロー原典の分岐だけから作る（固定辞書は使わない）

- **エッジケース（代替/異常分岐・データパターン・独立ルート）は `edge_cases_from_branch_rows`＝業務フロー原典の分岐行のみから生成する。** 固定辞書（`BUSINESS_EDGE_CASES`/`PATTERN_EDGE_CASES`/`COMMON_EDGE_CASES`）は業務フローに無い条件を注入し、原典に無い異常シナリオを捏造する（codecレビュー指摘: 既存商品編集「組み合わせ不整合で保留」等、商品18/デッキ6/イベント2件ほか）。これらの辞書は edge_cases_for で**使わない**。
- **緩いトピック語ゲート（`edge_case_matches`）で辞書ケースを通さない。** 「組み合わせ不整合」が `公開` 一致で通過する類の誤りを防ぐ。分岐の実在判定は業務フロー本文の分岐行（`BRANCH_KEYWORDS`＝不備/失敗/差異/不一致/不足/欠品/却下/返金/キャンセル等を主文に含む行）で行う。
- **独立した異常/代替ルート（丸ごとのシナリオ）は `source_row` を持つ（＝業務フロー由来の）ケースだけから作る**（`is_route_level_edge_case`）。辞書由来（source_row無し）はルート化しない。
- **分岐が無いパターンは正常系1本が正しい。** ルート数の下限（旧: デッキ登録>=5 等）を課さない。件数を埋めるための水増しはしない。機構的異常系（権限/必須/重複/0件）は `## 他層委譲（結合テスト）` で結合テスト層へ委譲する。
- 結果として、代替/異常シナリオは業務フロー図に実在する分岐（例: ネット買取「身分証に問題がある→本人確認失敗メール送付」）だけになり、原典の文言でタイトル化される（辞書の一般化文言ではない）。

## データ連鎖（この層の主オラクル）

- **シナリオテストは機能テストではない。** 検証対象は画面仕様への適合ではなく、**データのつながりを通じて業務が完遂できること**である。画面項目・バリデーション・メッセージ・入力制約の適合は結合テスト層が機能単位で担保する。
- 業務フロー図には作業線（実線）とは別に **データ遷移線（点線）** があり、`### 遷移（コネクタ＝矢印）` に `- [データ遷移線(点線)] #23 出荷指示リスト作成 → #22 発送管理台帳` の形で実在する。**作業順（実線）だけを使うと、各工程の期待結果が自己完結し「同一データが次工程へ渡ったか」を検証できない。**
- `parse_flow_edges` / `FlowGraph.data_links` が点線を解析し、`## データ連鎖（業務フロー原典のデータ遷移線）` に「産出工程 → データ/帳票 → 消費工程」を出す。工程は**産出側にも参照側にも立つ**ため双方向に辿る。
- **消費/産出の相手は必ず『工程』ノードにする。** `#20 受注*2 → #21 受注*2` のようなデータ→データ（図形上の複製・転記）は工程ではないので、`_reach_work` が工程に当たるまで透過する。データ複製をそのまま「消費工程」として出さない。
- **同名図形の帰属はパターン範囲スコープで解決する。** 1つの業務フローファイルに同名図形（`受注マスター` は12回等）が多数あり、行→ノードを名前一致で引くと番号が一意に定まらない。全件辿ると別パターンの点線を当該シナリオへ混入させる。対策: シナリオ内で一意に定まる行（アンカー）のノード番号 `[min,max]` をスコープとし、同名の曖昧行はその範囲内に解決、範囲外の工程へは到達しない（`data_links(number, scope)`）。アンカーが無いシナリオでは曖昧行を採らない。
- **原典に無い結線は創作しない。** 接続先が `(自由端)` の場合は `要確認（消費先が原典未定義）`、産出元が無い場合は `要確認（産出元が原典未定義）` として穴を可視化する。
- **照合キーは原典のオブジェクト名から導出する（`chain_key`）。** 原典が `受注*2 → 受注マスター` と描く以上、両者を結ぶ識別子は受注番号であることは原典自身から自明で、シードに `受注番号=ST-ORDER-…` が既に存在する。これを使うのは創作ではなく「原典が名付けたデータオブジェクトの identity をシードIDで表す」だけ。`受注/注文/出荷→受注番号`、`ネット買取→ネット買取申込番号`、`在庫/棚卸→商品コード`、`デッキ→デッキID` 等。オブジェクト語が無い/対応シード項目が無い場合のみ `原典上の照合キー未定義（要業務確認）` のままにする。これにより「連鎖あり」は**実行可能なオラクル**（同一キーで産出→消費を追跡）になる。
- **業務フロー図のデータ線は大半が自由端で終わる**（例: 16_通販受注管理は81データ中、下流工程に繋がるのは1件）。したがって原典由来の「連鎖あり」は少なく、大半が `要確認（消費先が原典未定義）` になる。これは実装の不足ではなく**原典側のデータ結線の欠落**であり、業務側の補記対象として正直に出す。件数を水増ししない。
- **HTML基本設計書由来の補完は2種類に厳格に分ける（`HTML_CHAIN_RESOLUTIONS`, codecレビュー指摘）。** 直列遷移や下流バッチ消費を合成すると過剰主張＝捏造になるため、オラクル文はHTMLの literal 記述のみにし、自動因果・直列フローを主張しない。
  - **kind="consumer"**（HTMLが下流処理を明記）→ 自由端を解消し verdict `連鎖あり（HTML設計書由来）`。対象は**2種のみ**: 棚卸計画→`dtb_inventory_plan`確定・実数反映時に在庫更新(0202)、出金→店頭買取情報更新API(PUT /admin/otcBuyOrder/{id}/status.json)→EC-CUBE連携(0601)。※在庫移動指示・在庫変更CSVは当初consumerにしたが、HTMLが「在庫移動実績CSV取込では移動ステータスを更新しない」「承認後の在庫反映は実装依存」と留保するため、codecレビュー指摘でnoteへ格下げ（断定しない）。
  - **kind="note"**（保存先テーブル/ステータス値は記すが消費先は明記なし）→ 自由端は `要確認（消費先が原典未定義）` のまま、HTMLの事実だけを注記。対象: 受注(`dtb_order.order_status_id`,0203)、在庫(`dtb_stock_history`,0202)、在庫移動指示(`dtb_stock_move_transfer`,0202)、在庫変更CSV(`dtb_csv_import_history`,0202)、ネット買取(`dtb_buy_order`ステータス値,0206/0507)、査定内容メール(`dtb_mail_history`,0206)、店頭買取(`dtb_otc_buy_order`,0205)、支店インポート用(廃止→買取商品一覧CSVへ置換,0205)。
  - **迷ったらnote（過小評価）にする。** under-claim は捏造ではないが over-claim は捏造。HTMLが下流処理を「〜する」と断定している場合だけ consumer にする。
- **HTMLに記載の無いオブジェクトは登録しない。** 売上(イベント0214は参照系)/発送管理台帳/返金処理記録/各Excel作業ファイル(欠品対応表・在庫推移表・在庫集計用シート・補充用ファイル・低額棚卸作業ファイル・在庫変更依頼用)はHTMLに literal 記述が無く要確認のまま。ブロード語(在庫/受注/買取/出荷)が作業ファイル/別データ(用/表/シート/ファイル/依頼/計画書/データ/CSV)に誤マッチしないよう `WORKFILE_MARKERS` でガード（「在庫変更依頼用」「出荷データ*4」に在庫/受注オラクルを付けない）。
- 固定シードIDが存在することと、そのデータを**実際に産出・更新し後続工程が消費したこと**は別である。前者をもって連鎖を検証したと見なさない。

## 外部システム名の鮮度（GMO → SPLINKS）

- **決済は GMO ではなく SPLINKS に置き換わっている。** 業務フロー原典に `GMO` は literal に存在せず（grep 0件）、`SPLINKS` がスイムレーン・返金処理として実在する（`16_通販受注管理.md`）。
- 過去、生成器の `BUSINESS_CODES` / `PATTERN_EDGE_CASES` / 判定キーワードに `GMO` がハードコードされ、**88シナリオへ出典のない外部システム名が混入**していた。現在は SPLINKS へ是正済み。
- **HTML基本設計書には旧 `GMO` 記述が残る（25ファイル）一方 `SPLINKS` は3ファイル**で、新旧が混在する。設計書の内容を無選別にシナリオへ取り込むと**陳腐化情報を伝播させる**。設計書は「業務フローが触れる画面・外部I/Fの局所的な契約」を確認する補助根拠に留め、出典別の鮮度判定を通すこと。

## 期待結果・呼称・入力データ（業務フロー由来）

- **期待結果は業務フローの作業内容にリンクさせ、「〜こと。」で終える**。汎用テンプレを使わず、`expected_assertion` が当該行の作業内容（`clean_detail`＝最初の動詞節）を `koto_form` で「〜こと。」形にする。**観測点（確認対象）は `expected_observation` で別列**に出し、期待結果に混ぜない（`実行手順` テーブルは `期待結果` と `確認対象` の2列）。作業内容の曖昧語（何らか/適宜/必要に応じ）は `sanitize_vague` で具体化する。
- **操作手順・画面名は設計書/業務フローの語を使い、単語を創作しない**。画面・機能名は設計書のH1表示名（`slug（日本語名）`形式は日本語名を採用）。設計書が紐づかない場合は業務フローの作業概要（`screen_from_flow`）を使い、「対象画面」等のプレースホルダや「検索または指定する」等の創作手順を出さない。操作文は `{画面}で「{業務行動}」を行う` 形式。
- **物理名を書かない（[[logical-naming]]）**。翻訳キー・セッションキー・ルート名・DB物理名（`dtb_`/`mtb_`/`plg_`）は期待結果・確認対象・入力データ・操作手順のどこにも書かず、論理名（メッセージID＋画面上の文言、業務名）で表現する。根拠としての併記も不可。対応は `e2e/config/logical-names.tsv` から引き、無ければ出典付きで追加する。セレクタ・`file:line`・HTTPパス・コマンド名・実行SQL/シードは対象外（物理のまま）。監査は `python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --repo .`。
- **入力データは単一シードの使い回しにしない**。正常系は `step_target` でステップ内容に合うシード項目を選ぶ（受注→受注番号、商品→商品コード、在庫→商品コード等）。代替/異常系は `edge_input_data` で条件別のデータ（在庫0/権限なし/金額不一致/0件/重複/必須不正/期限超過等）を入力にし、網羅性を担保する。

## Useful Script Options

```bash
python3 .codex/skills/hareruya-scenario-test-cases/scripts/generate_scenarios.py --repo . --only 通販 --overwrite
python3 .codex/skills/hareruya-scenario-test-cases/scripts/generate_scenarios.py --repo . --only 在庫 --max-related-docs 8 --dry-run
python3 .codex/skills/hareruya-scenario-test-cases/scripts/generate_scenario_tsv.py --repo .
python3 .codex/skills/hareruya-scenario-test-cases/scripts/validate_scenarios.py --repo . --generated-only --strict
```

## When To Manually Review

Manual review is required when:

- The source flow contains notes such as `わからない`, `検討中`, `変更なし`, or `後回し`.
- The generator cannot find any related design docs.
- A scenario crosses external systems such as GMO, MTGバイヤー, スマレジ, Wordpress, or ポイントグランター.
- A generated scenario has more than one high-risk business outcome, such as payment plus inventory plus shipment.
