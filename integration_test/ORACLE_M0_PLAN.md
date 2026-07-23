# M0設計スパイク→L1/L2パイプライン 実行計画

> 2026-07-22 ／ 立案: fable5 ／ codex敵対レビュー反映（要修正7点）／ M0着手可（実装可否はM0完了後に再codex）
> 前提: `ORACLE_STRATEGY.md`（ハイブリッド源・台帳凍結・L3機械レンダリングのみ・codex単独レビュー）
> **改訂 2026-07-23**: `E2E_ENABLEMENT_STRATEGY.md` のcodex R2レビュー（M0着手不可判定）を受け、
> (1) 実行可能化戦略が委譲した14件をM0成果物 **D6〜D19** としてDoDへ実統合（§5b）、
> (2) 母数を確定baseline（**25,549データ行**・3台帳SHA固定＝§0b。旧25,561等は版差として§0bに保存）へ統一、
> (3) C2/C4カナリア記述を★1の較正どおり本文も一本化（C2→O5・C4→`C4-manual`・「5/5機械検出」撤回）、
> (4) a02-01 PoC（D4）を「三段参照形式への移行版を生成し、それを唯一の手本とする」に是正。
> 期間は当初「約5日」から**約2週へ再見積り**（D6〜D19追加のため。5日主張は撤回）。
> **現在の状態: codex敵対レビュー R1→R4 を実施済み。R4（2026-07-23）で R3残Blocker
> （D14受入・v2限定join・D5→D4/C6/C7順序・系譜行キーassertion粒度・D8迂回封鎖C7・
> C6/C7ゲート統一・D6版固定・allowlist）の実質契約は全て閉包＝「M0着手可」**
> （着手順: **M0実施（D1〜D19の実データ生成・実機PoC）→ M0成果物のcodexレビュー → 実装着手判定**）。
> 冒頭行の「M0着手可」はR4閉包により有効。実装着手可否はM0完了後の再codexで判定する。

## ★codex M0レビュー反映（絶対遵守・以下が本文に優先）
1. **カナリアのゲート対応を正す**: C2(実装値混入・引用は実在)は**O5**が落とす(O2でない)。C4(極性反転)は
   正規表現極性照合で一般には**機械検出不能**→`C4-manual`とし対象構文・レビュー記録・未検出を DoD に明記。
   **CI成功を機械検出成功と偽装しない**。カナリアは「期待ゲート or 手動レビュー」を固定。「5/5機械検出」は撤回。
2. **allowlistはパス分類にすぎない→強化**: realpath/symlink解決後の完全一致・許可リポ/コミットSHA・許可ファイルSHA、
   `standard-src`はupstream固定・`外部契約`は版/hash/承認ID固定。**`ec-cube-enterprise/・実ソース`の広域指定は不可**。
   **`SEED`は入力値の出所であって、仕様値・DB列・変換規則の根拠に使えない**(型ごとに禁止=ロンダリング遮断)。
3. **seed_equivalenceの循環遮断を強化**: `passthrough_basis`を有向グラフ検証(自己/相互/別subject/「保存」→「表示」流用を禁止)。
   basisは非SEEDかつ許可source_class。入力field・観測field・操作・条件域・**恒等写像**を明示一致。変換/導出/状態値/DB列名が沈黙なら必ずTBD。
4. **O6を2指標に分離**: 「全ID会計(bound / approved-TBD / excluded)」と「実行可能assertion被覆」は別。
   TBDのみのIDは被覆の**分子に入れない**。検査は test_id でなく **assertion_ordinal ごと**に観点・前提・操作・観測対象の適合を見る
   (同じ無関係1claimを全IDに結んでO6を偽装できないように)。
5. **A02 PoCはSEED契約成立後のみ**: manifestにA02-01も900001も無い(帯900000000..999)。`legacyIds`追加だけ不十分。
   各値に fixtureファイル/apply-reapply/teardown/テーブル依存/衝突検査/前後スナップショット/manifest hash を契約化して
   初めてPoC比較対象。**契約成立前の「意味差0」はDoDに使えない**。
6. **区分数値を実router値に訂正**: 新規実装=**35**(45は誤り)/`kubun_unknown`=**23**/`new_without_excel`=**9**。
   32を単一集合にしない→3列・別DoD・別エスカレーションに分離。(前版「新規実装45」「不明32」は撤回)
7. **Excel全出現を個別永続化**: 単一`<FID>.txt`混在は同名FIDの誤結合を生む。`document_sha1 + start/end + occurrence_id`で
   別々に保存しL1が採用occurrenceを持つ。複数出現FIDの回帰テスト+索引キャッシュ失効テストをDoDに追加。
- **O2偽陽性率10%**は母集団・正解ラベル・層化・盲検サンプル・分母・信頼区間を定義して初めて測定可(未定義なら指標から外す)。
- **`gate_check.py`(G1-G7)はO1-O5の実証済み基盤と見なさない**(行実在・否定文の限定検査のみ)。移植は参考実装に留める。

## 0b. 確定baseline（2026-07-23実測・本計画の全数値の正）

本計画・戦略書・全ゲートの母数は以下の**凍結baseline**に統一する（D6でJSON化）:

| ファイル | SHA-256 | データ行 | 記録コミット |
|---|---|---:|---|
| `all_it_cases.tsv` | `7911f190d273d4cfc351deed25d28b289df981d23a5152f06df42cbb5ccf57b9` | **25,549** | 754a591 |
| `case_viewpoint_trace.tsv` | `bfc4531a3596964ba0b70481f511f672754a882418bcb2d822ae5ad3bbaa782b` | 25,549 | 754a591 |
| `execution_assignment.tsv` | `2f2532144253736f04923504001607519e39f85958fc37426e56d036dba4fe09` | 25,549 | 754a591 |

実測内訳: Playwright 12,762／Playwright+手動確認 **7,114**／非UI 5,372／手動 301。聖域 **2,014**。
**版差の記録（消さずに保存）**: 本書および上流文書の旧数値 25,561（旧台帳版）・26,188（混層除去後の
中間版）・聖域2,015・Playwright+手動確認7,126 は**旧版の値**であり、現行baselineとのID差分・聖域差分・
区分差分の差分表を **D6の成果物**として添付する（旧記述自体は履歴として残す。以降の本文の母数記載は
baseline値へ読み替え、L2分母・O6分母は baseline版 `cut -f2 all_it_cases.tsv` とする）。

## 0. 実地確認（既存資産の実態）
- 凍結台帳3本（`all_it_cases.tsv` **25,549データ行（§0b baseline）**・`case_viewpoint_trace.tsv`・`execution_assignment.tsv`）。L2分母は baseline版 `cut -f2 all_it_cases.tsv`。
- **`execution_assignment.tsv` は現物10列**（テストID/機能名/チャネル/観点No/UI実行/必須観測層/実環境依存/VRT初回/障害注入/聖域）で、`execution-schema.md` が要求する **人手承認・並行実行・未解決 列が未付与**（「多軸化はP2で全件適用」は未適用が実態）。多軸joinの入力契約はD14で確立する。
- `integration_test/tools/oracle_router.py` が `KUBUN_RE` で機能区分を機械抽出・`route()` で源選択実装済み → source_class判定は**新規開発でなく永続化**で足りる。
- `excel_spec_parser.py`：**実バグ2件**—毎回全HTML走査（0306=67MB）／`extract()`が`idx[fid][0]`の**先頭出現しか返さない**（複数シート取りこぼし）。M0で修正。
- `functions/pf-eccube3`(268)+`pf-api`(115)+`ec-cube-enterprise`(73)。pf系=pf現行挙動＝`pf現行回帰`源。**ee-enterprise md は標準28機能以外L1値根拠に使用禁止**（ee実装のリバース＝implementation相当）。
- 機能→Excelシート対応表 `functions/function-doc-excel-integration-report.md`（例 F06-03→0306 sheet-5）。
- `e2e/seed/manifest.json` 帯900000000〜999。**a02手本の900001等は帯外・未登録**→M0で契約化。
- `gate_check.py` G1-G7（file:line実在・見出し検出・否定文照合・Excel行照合）＝`oracle_gate.py`へ移植元。

## 1. L1 原子的主張台帳（`integration_test/oracle/l1/<fid>_oracle.tsv`・17列）
oracle_id / claim_type(message|validation_rule|db_effect|status_transition|http_status|display_field|calculation|auth_rule|external_contract|seed_equivalence) / subject(正規化キー・同一subjectのactiveは1件) / expected_kind(exact|constant_ref|formula|delegated|tbd) / expected_value / unit(桁数系は必須:文字/バイト) / source_class / source_file / source_lines(L256-L262) / quote(逐語・sha1で改訂検知) / quote_sha1 / passthrough_basis(seed_equivalenceは「そのまま保存/表示」明記claimのID参照必須＝循環論法遮断) / applicability / extractor / approver / status(active|superseded_by|conflict) / notes

**source_class語彙（★2準拠: **D6 baseline-manifestのファイル単位allowlist**（realpath＋SHA固定）×kubunで
機械強制。ディレクトリ単位の許可は廃止＝★2「広域指定は不可」との自己矛盾を解消。下表の「由来」列は
allowlistへ登録できるファイルの出所分類であり、パス前方一致で許可する意味ではない）**:
| source_class | 許可file | 由来（allowlist登録元の分類） | 許可kubun |
|---|---|---|---|
| Excel | D6 allowlist登録ファイルのみ | `excel_to_html/output/` 配下の固化ブロック | 全 |
| pf現行回帰 | D6 allowlist登録ファイルのみ | `functions/pf-eccube3/`・`pf-api/` 配下の正本md | **現行踏襲・カスタマイズのみ** |
| standard-src | D6 allowlist登録ファイルのみ | ee正本md・実ソース（upstream固定・ファイル単位SHA） | **標準のみ** |
| 外部契約 | D6 allowlist登録ファイルのみ | SPLINKS等の承認済み契約（版/hash/承認ID固定） | 全 |
| SEED | manifest.json（入力値の出所のみ。期待値根拠不可＝★2） | e2e/seed/manifest.json | 全 |
| implementation | 予約 | — | **O5で無条件拒否** |

Excel(巨大HTML)は機能ブロックを `oracle/excel_blocks/<FID>.txt`(行番号保持・数十KB)へ固化し**LLMには固化ブロックのみ**渡す。md(構造化表)はPhase A決定的パーサで表→行→セルをclaim分解。

## 2. L2 多対多binding（`oracle/oracle_binding.tsv`・9列）
主キー(test_id, assertion_ordinal)。oracle_id / binding_type(direct|parameterized|seed_ref) / fixture_version(`SEEDセットID@manifest_sha1`) / seed_set_id / binder / status(bound|unbound_no_oracle=G8|unbound_ambiguous|excluded:理由※手動301はexcludedにしない) / notes。
**O6双方向完全性**: baseline全25,549 test_id（§0b）⊆binding(欠落0=exit1)／各IDにexecutable claim(exact/constant_ref/formula/delegated解決済)1件以上／orphan L1警告／キー一意／fixture sha1整合。

## 3. 抽出パイプライン
- 前段 `build_kubun_table.py`→`fid_kubun.tsv`(fid/kubun/根拠/Excel索引有無)。不明はHUMAN_DECISION既知(23+9=32)と完全一致を要求。以後全フェーズはこの表のみ参照。
  分岐: 新規実装→Excelのみ(索引欠落は全tbd+HUMAN_DECISION) / 標準→standard-src等 / 現行踏襲・カスタマイズ→Excel優先(同subjectにExcel立てばpf claimはsuperseded_by退避)・Excel不在subjectのみpf現行回帰active / 不明→保留。
- Phase A決定的(LLM不使用): md見出しディスパッチ(表示メッセージ→message/バリデーション→validation_rule/DBカラム+DB操作→db_effect/判定順序→status_transition/権限認可→auth_rule)。audit682（D10の再生成固定版を使用。旧683表記は誤り）・MESSAGE1,158は**発見リストのみ**・値と根拠は元mdに遡取。
- Phase B LLM(散文+Excelブロック): quote必須・O2で逐語存在照合・exact値はquote内出現必須。fable5並列可。**新規実装35（★6の較正値。45は誤記）はPhase B全件codex較正**。
- Phase C binding: rule pass(分類→claim_typeマップ+fid+subject部分一致)→曖昧はLLM**選択のみ**(生成不能=捏造構造的排除)→未結合は欠落レポート(G8)。

## 4. 機械ゲートO1-O6＋否定カナリア（機械検出6種 C1/C2/C3/C5/C6/C7＋C4-manual）
O1根拠実在(allowlist+見出し行拒否) / O2逐語一致(+exact値のquote内出現) / O3三類型明示(推測語拒否・quote空欄拒否・delegated委譲先必須) / O4 SEED制約適合(帯内・passthrough_basis必須・桁型定義域突合) / O5 source_class(implementation拒否・kubun整合・同subject重複拒否) / O6被覆率双方向。
**カナリア**(`oracle/canary/C1-C7` 故意欠陥を静置しCIで宣言ゲートIDで落ちるか検証・落ちねば実装展開禁止): C1故意欠陥→O1 / C2実装値混ぜ引用(audit ee固有値=実在誤値)→**O5**（引用は実在するためO2は落とせない=★1） / C3表ヘッダだけ一致→O1 / C4条件反転→**`C4-manual`**（★1: 極性照合の正規表現では一般に機械検出不能。CIゲートに数えず、対象構文・codexレビュー証跡・未検出可能性をDoDに記録。O2v極性照合は補助に留める） / C5設計沈黙補完→O2/O3 / **C6 manifest単独参照期待値**（L1 claimを経由せずmanifest/env値を期待値に直接使うアサート/claimを混入）→三段参照ゲート(D9)が拒否 / **C7 fixture直参照期待値**（manifestすら経由せずfixtureファイル値を期待側で直接読む迂回を混入）→外部化lint(D8)が拒否。C6/C7の実行前提はD5 exit0。機械検出を主張できるのは C1/C2/C3/C5/C6/C7 のみ（「5/5機械検出」は撤回済み）。

## 5. M0成果物・DoD・M1撤退条件
**M0(約2週・再見積り)で作る**: D1 SCHEMA.md+fid_kubun.tsv(380) / D2 excel_block_cache.py(索引永続化+複数出現・0306からF06-03ブロック切出しsha1固定を実測) / D3 oracle_gate.py v0(O1-O5)+カナリア（C1/C2/C3/C5/C6/C7=機械検出・C4=`C4-manual`。C6/C7はD5 exit0後） / D4 **a02-01 三段参照移行PoC**（**前提: D5 exit0**。旧形式mdをL1恒等写像claim→fixture_version@manifest_sha1→実値の三段参照形式へ移行した**移行版を生成し、以後これを唯一の手本とする**。移行前a02-01は「旧形式」であり規範と呼ばない。旧形式との意味差diffを添付） / D5 **A02 SEED契約の成立**（`legacyIds`案止まりにしない。契約全項目を台帳化し機械検査 `seed_contract_check` でexit0: 必要fixture（値・型・帯）／apply→reapply収束（件数・内容不変）／teardown完全性（帯内差分0）／依存テーブル列挙／帯衝突検査／前後snapshot／manifest hash固定。＋codex承認） / **D6〜D19（§5b: 実行可能化戦略からの統合14件）**。
**実行順序の機械固定（R3是正）**: `D5 exit0` を **D4（三段参照移行PoC）およびカナリアC6/C7の実行前提**とする（D4/C6/C7の検査スクリプトは冒頭で `seed_contract_check` の合格証跡を検証し、無ければ実行拒否＝契約成立前のPoC比較・カナリア判定を構造的に不可能にする。★5「契約成立前の意味差0はDoDに使えない」と整合）。
**M0で作らない**: 全機能展開/帯拡張実施/db.ts/L3汎用レンダラ/Phase C本実装/M2以降量産。
**M0 DoD(数値)**: 機械検出カナリアC1/C2/C3/C5/C6/C7=6/6検出（C6/C7はD5 exit0後に実施）＋C4-manualのレビュー証跡が存在 / a02三段参照移行版でL1根拠率100%・全期待値がL1 oracle ID参照（fixture直参照0）・旧形式との意味差が全件説明済み / fid_kubun不明=既知32と完全一致(新規0) / 0306ブロックsha1固定 / A02契約案のcodex承認 / **D6〜D19の各受入条件（§5b表）全通過** / 完了後に実装着手可否を再codex（codex承認は§5bの機械検査に追加される条件であり、機械検査の代替ではない）。
**M1(f06-19/m05-15/m04-02/a02-01/m11-02)撤退条件**: binding成立<70% or 実行可能被覆<90% / TBD>40% / O2偽陽性>10% / fixture再実行<100%(最低1機能フレッシュDB実走) / codexでゲートすり抜け捏造≥1 / 工数>3人日/機能 → M1停止・再設計。圧縮率はM1で実測して初めて確定。

## 5b. 実行可能化戦略からの統合成果物 D6〜D19（各件: 成果物／検査／exit条件／承認者）

`E2E_ENABLEMENT_STRATEGY.md` §8.1の委譲14件を本計画のDoDへ実統合する。**受入は「機械検査の通過」が主で、
codexレビュー通過は追加条件**（codex承認だけを受入条件にしない）。承認者の凡例:
機械=検査スクリプトexit0／codex=敵対レビュー通過／発注者=ユーザーの明示決裁。

| # | 成果物（ファイル） | 検査（何をどう機械検査するか） | exit条件（失敗=exit1） | 承認者 |
|---|---|---|---|---|
| D6 | `integration_test/baseline-manifest.json`（§0bの3台帳＋locale yaml 4ファイルのrealpath/commit/SHA-256＋ヘッダ文字列＋旧版差分表`baseline-diff.md`＋D14合格版v2のSHA＋**ファイル単位source_class allowlist**） | `baseline_check.py`: ①manifest記載SHAと現物ファイルの再計算SHA突合 ②対象パスのrealpath解決後の完全一致（symlink差し替え検出） ③各repoの`git rev-parse HEAD`がmanifest宣言コミットと一致 ④対象ファイル（3台帳＋yaml4＋v2）の`git status` clean ⑤許可repo remote URL・許可コミットの検証。全ゲートの起動時に呼ぶ | SHA不一致・realpath不一致・HEAD不一致・not clean・remote/commit不許可・manifest欠落・差分表欠落が1件でも1 | 機械＋codex |
| D7 | `lineage_gate.py` 仕様＋v0（`E2E戦略§3.5.3`のassertion単位仕様）＋既存384md実測レポート | L2 bound assertion（`test_id×assertion_ordinal`）と具体行mappingの**双方向差分**・重複多重度・正規化・補完隔離・逆検証（統合TSV→md行集合） | bound assertionの宙吊り／逆差分／理由コード無し重複／正規化不能が1件でも1 | 機械＋codex |
| D8 | 外部化lint仕様＋v0（AST・data-flow範囲・許可リスト・例外手続き・偽陽性/偽陰性カナリア＋**C7**） | expect期待側引数から到達可能な値生成源をdata-flowで辿る。**期待側の許可源は「L1 ID解決器のみ」**（fixture/env/configは入力側専用。fixture値が期待側へ到達できるのはL1解決器内部で`fixture_version`照合を通る経路のみ＝D9迂回の遮断）。helper内リテラルも対象。**カナリアC7（fixture直参照期待値）**を静置し拒否を検証（**前提: D5 exit0**） | 偽陰性カナリア見逃し=1・偽陽性カナリア誤検出=1・**C7通過（=拒否失敗）で1** | 機械＋codex |
| D9 | 三段参照ゲート仕様＋v0（L1恒等写像claim→fixture_version@manifest_sha1→実値。manifest単独参照の拒否） | カナリアC6（manifest単独参照期待値）を静置し拒否されるか検証（**前提: D5 exit0**）。seed_equivalenceのpassthrough_basis有向グラフ検証を含む | C6通過（=拒否失敗）で1 | 機械＋codex |
| D10 | `item_definition_audit` 再生成固定版（extract2.py以降を再実行。sha256・件数・除外理由リスト） | 再生成受入値: 旧682件との対象集合差分を全件理由付き記録／除外理由は閉じた語彙／列ずれ0・無言ドロップ0を件数照合で検証 | パース不能・理由なき件数差・列数不正で1（再生成失敗時はM0停止＝続行しない） | 機械＋codex |
| D11 | 文字数境界値生成規約ファイル（`charFill`/`byteFill`・repertoire・NFC・観測層契約） | 生成関数の決定性テスト（同一入力→同一出力・UTF-8バイト数検証）。**観測層（Form validator/HTML5/DB制約）が未指定の文字数系L1 claimをゲート拒否**（「max+1=Form層」を既定にしない。観測層は一次資料由来で claim ごとに指定） | 観測層未指定claim≥1・生成非決定で1 | 機械＋codex |
| D12 | 隔離・復元契約テンプレート＋パイロット機能分の実インスタンス | テンプレ必須フィールド（5系統ごとの初期化コマンド・対象テーブル/保存先・スナップショット範囲・namespace/serial割当規則）の充足検査。検証対象の定義: **teardown後の帯内データ差分0**（seed適用分が撤去済み）＋**apply→再apply収束**（件数不変） | 必須フィールド欠落・teardown後帯内残存・再apply非収束で1 | 機械＋codex |
| D13 | 変更管理台帳様式＋運用開始（L1/binding/manifest/fixture/生成器） | 台帳はappend-only（各エントリに前エントリhash＝改竄検知）。必須項目: 種別コード・理由・根拠差分・承認・影響test_id・再実行記録。**baseline更新は「更新→全ゲート再実行→無効化された過去結果のrange明示」の順を強制** | 未承認変更の検出・hashチェーン断絶で1 | 機械＋codex（承認主体: L1是正=codex／要件変更=発注者） |
| D14 | **多軸属性の再付与固定台帳** `execution_assignment_v2.tsv`（execution-schema.md準拠の全属性: 現10列＋人手承認・並行実行・未解決） | 目標スキーマ（属性の値域・**未付与を表す値の定義**・trace唯一入力からの付与規則・再計算hash）を先に確定し、**全25,549行へ再付与**。**v2ファイル自体の受入検査**: (a)全必須属性が非空・非`未付与` (b)traceの全キーと一対一（欠落/余剰=0） (c)キー重複0 (d)値域外0、＋付与規則の決定性（再実行同一hash）。**合格v2のSHAをD6 baseline-manifestへ固定**（以降のjoinはこのSHAのみ許可） | **(a)〜(d)のいずれか1件でも即exit1**（R3是正: 「聖域/完了判定時のみ失敗」は撤回。v2が受入不合格の間は聖域/完了判定そのものを実行不可） | 機械＋codex |
| D15 | locale軸仕様（locale_sensitive決定表＝E2E戦略§2.7.2）＋**en UI切替の実機PoC（管理画面含む）** | 決定表の全claim_type網羅検査・`locale_sensitive=0`の理由コード必須検査。実機PoC: 管理画面を含む対象UIで**en到達・画面取得に成功**した証跡（capture manifest） | 決定表未網羅・理由コード欠落で1。**en切替不能の場合はM0 No-Go＝「対象外」処理は不可**（要件変更の発注者決裁 or 実現手段確立まで実装停止） | 機械＋codex＋発注者（不能時の要件変更決裁のみ） |
| D16 | トリアージ証跡テンプレート＋滞留規則（E2E戦略§2.6.2） | テンプレ必須フィールド（再現手順・ログ/trace/SUT応答・fixture hash・独立観測の種別と結果）。**独立観測の選択条件**（UI観測→API/DB直接参照、API観測→DB/手動再現、バッチ→DB/ログ、の対応表）。**判定不能の滞留期限: 起票から5営業日またはフェーズ末の早い方**（超過は棚卸し会議で裁定・自動×/〇化は禁止） | テンプレ欠落項目のある×確定・期限超過の未裁定滞留で1 | 機械＋codex |
| D17 | Chrome in Claude Go/No-Go実証レポート（8項目・en含む） | E2E戦略§2.2の8項目を1機能試走で全実測（証跡=capture manifest）。**⑦en表示は D15のPoCと同一証跡**（不能なら手動移管でなくD15の停止/決裁ルールに従う） | ⑦以外の項目不能→依存判定点の移管ルール発動（発注者承認記録必須）。承認記録なき除外で1 | 機械＋発注者 |
| D18 | 標準28機能の進捗再集計（実装済みspec数/実行済み親ID数/未実施理由別/仕様乖離/環境待ち） | 全28機能×全ケースが5集計（E2E戦略§7）のいずれかに分類され、合計=ケース数と照合。`coverage complete:28` を進捗指標に使わない旨を再集計ヘッダに明記 | 分類漏れ・合計不一致で1 | 機械 |
| D19 | capture manifest様式（sha256・viewport/DPR・ブラウザ版・locale・seed hash・操作ログ・判定者/判定時刻） | 様式スキーマ検査＋D15/D17の実証キャプチャが様式準拠か検証 | 必須フィールド欠落キャプチャの証拠採用で1 | 機械＋codex |

## 6. 落とし穴
1. excel_spec_parser先頭出現盲点→索引TSV永続化(sha1失効)＋全出現ブロック化。
2. Excel×md食い違い→`oracle_conflicts.tsv`全件記録・pf claimはsuperseded_by保持・Excel陳腐化疑い(GMO前例)はallowlist+codex裁定。
3. 二重管理→「1 subject=1 active」をO5cで機械強制・Phase A後にsubject dedupe。
4. SEED登録順序→契約台帳化→manifest差分解消(legacyIds)→帯拡張(M1冒頭)→L2 fixture_version確定 の順厳守。
