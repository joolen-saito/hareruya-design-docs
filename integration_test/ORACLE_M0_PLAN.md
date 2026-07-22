# M0設計スパイク→L1/L2パイプライン 実行計画

> 2026-07-22 ／ 立案: fable5 ／ 次: codex 敵対レビュー → M0着手（実装可否はM0完了後に再codex）
> 前提: `ORACLE_STRATEGY.md`（ハイブリッド源・台帳凍結・L3機械レンダリングのみ・codex単独レビュー）

## 0. 実地確認（既存資産の実態）
- 凍結台帳3本（`all_it_cases.tsv` 25,561・`case_viewpoint_trace.tsv`・`execution_assignment.tsv`）。L2分母は `cut -f2 all_it_cases.tsv`。
- `integration_test/tools/oracle_router.py` が `KUBUN_RE` で機能区分を機械抽出・`route()` で源選択実装済み → source_class判定は**新規開発でなく永続化**で足りる。
- `excel_spec_parser.py`：**実バグ2件**—毎回全HTML走査（0306=67MB）／`extract()`が`idx[fid][0]`の**先頭出現しか返さない**（複数シート取りこぼし）。M0で修正。
- `functions/pf-eccube3`(268)+`pf-api`(115)+`ec-cube-enterprise`(73)。pf系=pf現行挙動＝`pf現行回帰`源。**ee-enterprise md は標準28機能以外L1値根拠に使用禁止**（ee実装のリバース＝implementation相当）。
- 機能→Excelシート対応表 `functions/function-doc-excel-integration-report.md`（例 F06-03→0306 sheet-5）。
- `e2e/seed/manifest.json` 帯900000000〜999。**a02手本の900001等は帯外・未登録**→M0で契約化。
- `gate_check.py` G1-G7（file:line実在・見出し検出・否定文照合・Excel行照合）＝`oracle_gate.py`へ移植元。

## 1. L1 原子的主張台帳（`integration_test/oracle/l1/<fid>_oracle.tsv`・17列）
oracle_id / claim_type(message|validation_rule|db_effect|status_transition|http_status|display_field|calculation|auth_rule|external_contract|seed_equivalence) / subject(正規化キー・同一subjectのactiveは1件) / expected_kind(exact|constant_ref|formula|delegated|tbd) / expected_value / unit(桁数系は必須:文字/バイト) / source_class / source_file / source_lines(L256-L262) / quote(逐語・sha1で改訂検知) / quote_sha1 / passthrough_basis(seed_equivalenceは「そのまま保存/表示」明記claimのID参照必須＝循環論法遮断) / applicability / extractor / approver / status(active|superseded_by|conflict) / notes

**source_class語彙（ディレクトリallowlist×kubunで機械強制）**:
| source_class | 許可file | 許可kubun |
|---|---|---|
| Excel | `excel_to_html/output/` | 全 |
| pf現行回帰 | `functions/pf-eccube3/`・`pf-api/` | **現行踏襲・カスタマイズのみ** |
| standard-src | `functions/ec-cube-enterprise/`・実ソース | **標準のみ** |
| 外部契約 | allowlist登録fileのみ(SPLINKS等) | 全 |
| SEED | manifest.json | 全 |
| implementation | 予約 | **O5で無条件拒否** |

Excel(巨大HTML)は機能ブロックを `oracle/excel_blocks/<FID>.txt`(行番号保持・数十KB)へ固化し**LLMには固化ブロックのみ**渡す。md(構造化表)はPhase A決定的パーサで表→行→セルをclaim分解。

## 2. L2 多対多binding（`oracle/oracle_binding.tsv`・9列）
主キー(test_id, assertion_ordinal)。oracle_id / binding_type(direct|parameterized|seed_ref) / fixture_version(`SEEDセットID@manifest_sha1`) / seed_set_id / binder / status(bound|unbound_no_oracle=G8|unbound_ambiguous|excluded:理由※手動301はexcludedにしない) / notes。
**O6双方向完全性**: 全25,561 test_id⊆binding(欠落0=exit1)／各IDにexecutable claim(exact/constant_ref/formula/delegated解決済)1件以上／orphan L1警告／キー一意／fixture sha1整合。

## 3. 抽出パイプライン
- 前段 `build_kubun_table.py`→`fid_kubun.tsv`(fid/kubun/根拠/Excel索引有無)。不明はHUMAN_DECISION既知(23+9=32)と完全一致を要求。以後全フェーズはこの表のみ参照。
  分岐: 新規実装→Excelのみ(索引欠落は全tbd+HUMAN_DECISION) / 標準→standard-src等 / 現行踏襲・カスタマイズ→Excel優先(同subjectにExcel立てばpf claimはsuperseded_by退避)・Excel不在subjectのみpf現行回帰active / 不明→保留。
- Phase A決定的(LLM不使用): md見出しディスパッチ(表示メッセージ→message/バリデーション→validation_rule/DBカラム+DB操作→db_effect/判定順序→status_transition/権限認可→auth_rule)。audit683・MESSAGE1,158は**発見リストのみ**・値と根拠は元mdに遡取。
- Phase B LLM(散文+Excelブロック): quote必須・O2で逐語存在照合・exact値はquote内出現必須。fable5並列可。**新規実装45はPhase B全件codex較正**。
- Phase C binding: rule pass(分類→claim_typeマップ+fid+subject部分一致)→曖昧はLLM**選択のみ**(生成不能=捏造構造的排除)→未結合は欠落レポート(G8)。

## 4. 機械ゲートO1-O6＋否定カナリア5種
O1根拠実在(allowlist+見出し行拒否) / O2逐語一致(+exact値のquote内出現) / O3三類型明示(推測語拒否・quote空欄拒否・delegated委譲先必須) / O4 SEED制約適合(帯内・passthrough_basis必須・桁型定義域突合) / O5 source_class(implementation拒否・kubun整合・同subject重複拒否) / O6被覆率双方向。
**カナリア**(`oracle/canary/C1-C5` 故意欠陥を静置しCIで宣言ゲートIDで落ちるか検証・落ちねば実装展開禁止): C1故意欠陥→O1 / C2実装値混ぜ引用(audit ee固有値=実在誤値)→O2 / C3表ヘッダだけ一致→O1 / C4条件反転→**O2v極性照合**(NEGATION_PATTERNS)・機械で取り切れぬ構文はcodex必須と規約化しDoDに正直記録 / C5設計沈黙補完→O2/O3。

## 5. M0成果物・DoD・M1撤退条件
**M0(約5日)で作る**: D1 SCHEMA.md+fid_kubun.tsv(380) / D2 excel_block_cache.py(索引永続化+複数出現・0306からF06-03ブロック切出しsha1固定を実測) / D3 oracle_gate.py v0(O1-O5)+カナリア5種(5/5検出まで強化) / D4 **a02-01 PoC**(手本を新パイプで機械再現しdiff) / D5 A02 SEED契約棚卸し(manifestに`legacyIds`新設案・codex承認)。
**M0で作らない**: 全機能展開/帯拡張実施/db.ts/L3汎用レンダラ/Phase C本実装/M2以降量産。
**M0 DoD(数値)**: カナリア5/5検出(C4不能なら規約化を明記) / a02再現でL1根拠率100%・意味差0 / fid_kubun不明=既知32と完全一致(新規0) / 0306ブロックsha1固定 / A02契約案のcodex承認 / 完了後に実装着手可否を再codex。
**M1(f06-19/m05-15/m04-02/a02-01/m11-02)撤退条件**: binding成立<70% or 実行可能被覆<90% / TBD>40% / O2偽陽性>10% / fixture再実行<100%(最低1機能フレッシュDB実走) / codexでゲートすり抜け捏造≥1 / 工数>3人日/機能 → M1停止・再設計。圧縮率はM1で実測して初めて確定。

## 6. 落とし穴
1. excel_spec_parser先頭出現盲点→索引TSV永続化(sha1失効)＋全出現ブロック化。
2. Excel×md食い違い→`oracle_conflicts.tsv`全件記録・pf claimはsuperseded_by保持・Excel陳腐化疑い(GMO前例)はallowlist+codex裁定。
3. 二重管理→「1 subject=1 active」をO5cで機械強制・Phase A後にsubject dedupe。
4. SEED登録順序→契約台帳化→manifest差分解消(legacyIds)→帯拡張(M1冒頭)→L2 fixture_version確定 の順厳守。
