# ケース具体化 品質ゲート体制（取り決め・2026-07-27ユーザー承認）

M03-01が codex 8周を要した反省から、**codexレビューを最小回数に抑えるため品質ゲートを前段に決め打ち**する。
「codexがnoneを出すまで無限反復」は**廃止**。以下3層を順に通過したら**候補確定**とする。

## Gate A｜決定的機械ゲート（codex前に必ず実行・exit1で停止）
`.codex/skills/hareruya-message-inventory/scripts/gate_concretize_candidate.py --fid <fid>`
- G1 JSON妥当＋L1 claim数＝md§1表の行数一致
- G2 source_class純度（oracle値は excel/pf-fallback 始まりのみ・standard-src/design/impl禁止）
- G3 md↔oracle整合（L1 id集合一致・source_class文字列 全件一致）
- G4 `_drafts/`隔離（正式パス e2e/fixtures/oracle 直下・exec/tsv に当fid成果物なし）
- G5 母集合会計（宣言 bound+TBD+excluded＝母集合N ＝ all_it_cases の IT-<FID>- 件数、かつ -001..-N 全言及・欠番0）
- G6 stale-ref（TBD/excludedの番号が§7実行対象に残存しない／WARN・要目視）
- G7 逐語 file実在（best-effort／WARN）
**G1-G5がNGなら着手不可（codexに回さない）。** G6/G7はWARN=著者/codexで確認。

## Gate B｜著者自己監査（codex前・必須／著者プロンプトに前段組込）
著者(sonnet)は草案完成後、codexに出す前に**全bound行を以下で自己監査**し該当を一掃する:
- **B1 bound充足検証（最重要）**: 母集合test_idの期待が次のいずれかで**1回の実行でpass/fail一意判定できない**ものは、いかなる言い換え・別副次事実への差し替えでも**boundにできない＝無条件TBD**。
  - (a) 「〜になり得る/可能性/場合がある」（必発でない）＝M03-01型。
  - (b) 「条件成立時のみの正例」（環境/プラグイン/特定データ依存で当環境が前提を満たさない）＝M03-01型。
  - (c) **【M03-02追加】観測不能/計装未契約**: 期待の**必須成分**が外部通知・処理ログ・外部API送信等で観測手段が無い。「観測保留」と書きつつboundに残すのは不可＝**TBD**（観測可能な部分だけで母集合の必須期待を満たせる場合のみbound、要根拠）。
- **B2 スコープ境界（全サブ導線に一律適用）**: 一覧/編集画面から起動する**削除・複製・状態変更・一括操作すべて**を「当画面側のJS/モーダル/確認/メッセージ/遷移＝bound可／実際のPOST処理・DB副作用＝別導線DELEG(excluded)」に分離。**一部の導線だけ分離して他を残さない**（M03-02で複製のみ隔離し削除を残す漏れが発生）。着地先が別画面(パスワード変更等)は当機能excluded。**未検証の同定推論**（例「支店システム＝スマレジ」が一次資料に明示されない）を根拠にboundしない＝推論は§10隔離、当該母集合行はTBD。
- **B3 過剰主張なし**: 一次資料の「〜し得る」を必発に強化しない。識別ID等の対応付けは一次資料に対応行がある場合のみ（無ければTBD）。
- **B7【M03-01追加】機能種別に適用外の観点は読み替えず excluded**: 機能の性質（参照/読み取り専用の一覧・検索・分析・CSV出力等）に**該当しない操作観点**（更新内容・登録内容・削除条件・相関バリデーション等）を、bound維持のために別解釈（例: DBレコード更新→セッション状態更新）へ読み替えてはならない。母集合の観点テンプレ機械生成による**過剰生成**として excluded（理由に『当機能に該当機能なし・母集合観点テンプレ由来』を明記）。※read-onlyでのセッション/ページ挙動は『検索条件』等の該当観点で扱い、更新系観点で二重計上しない。
- **B6【M03-01追加】期待の観測可能性分離**: §4の期待は『画面で目視できる結果』を主に書き、目視できない内部状態(session/page_count/DB列/正確なリダイレクトURL/302/dtb_等)は同一セル末尾に『／ 自動検証(内部): <内部事実>』の形で付す（emitが2列＝期待結果(画面)｜自動検証(内部)へ分割）。純粋に画面観測のみなら内部マーカー不要。事実は不変(捏造ゼロ)。Playwrightは画面(DOM)＋内部(db.ts/session/URL)の両方を検証。
- **B4 en逐語**: en文言はen一次資料(yaml/xlf/.en.twig)の逐語のみ。無ければ（英訳なし）/TBD。
- **B5 会計整合**: bound+TBD+excluded=N、excluded/TBDは母集合test_id実引きで根拠（偽陰性禁止）。oracle同期。
（B1-B5を「自己監査済み」と草案§に明記してからGate Aを回す。）

## Gate C｜codex敵対レビュー（**上限2パス**）
Gate A(G1-G5 PASS)＋Gate B自己監査済みを前提に:
1. **codex 1パス**（`codex exec --sandbox read-only "<prompt>" </dev/null`＝stdin遮断でハング回避・`timeout 900`＋bg）。
2. Blocker/Majorのみ是正対象。**是正後の残りが機械的**（source_class文字列・stale-ref・§7残存等）なら**Gate A再実行で確定**（codex再パス不要）。
3. **実質的Blocker/Majorが再発したときのみ、もう1パス**（＝**codex上限2パス**）。それでも実質Blocker/Majorが残る場合はユーザーへエスカレーション（機能固有の難所）。
- Minorは記録のみ（確定を止めない）。

## Gate D｜concretized.tsv 出力（候補確定後・母集合テンプレートの派生ビュー）
候補確定（Gate C通過）後、**母集合 `all_it_cases.tsv` と同一11列テンプレート**の具体化TSVを出力する:
`python3 .codex/skills/hareruya-message-inventory/scripts/emit_concretized_tsv.py --fid <fid>`
→ `integration_test/e2e/exec/tsv/<fid>_<slug>_concretized.tsv`（LF・タブ・列＝機能名/テストID/I/FID/観点/優先度/項目名/前提条件/入力/操作手順/期待結果／レスポンス/実行方法）。
- **人間可読化**: concretized.tsv の前提/入力/操作手順/期待結果は**人が読める自然文**にする。emit時に機械タグ([L1:..]/fixture/@TBD-D5)除去・SEEDコード→前提の自然文・URL可読化。TBD行は前提/入力=「—」・操作手順=「自動判定不可、人が仕様/実機確認で確定」・期待=「【要確認】期待挙動＋人の対応」。excluded行は「【対象外】理由（母集合の観点テンプレ機械生成で当機能に該当なし 等）」。著者は§4も内部コードを避け自然文で書く。
**出力は bound(実行可能)行のみ**（実行方法=Playwright/Playwright+DB確認）。**TBD(保留)・excluded(対象外)行はtsvに出さず**、candidate md §8(会計)/§9(TBD理由)で管理する（ユーザー方針）。
**会計完全性をハードゲート化**: 母集合の全行が bound/TBD/excluded のいずれかに分類され取りこぼし0（bound+TBD+excluded=母集合N・未分類0）を機械検証し、崩れたら生成失敗(exit1)。tsv出力=bound全件と一致。＝母集合の行を黙って失わない。
- 各母集合行（テストID=`IT-<FID>-…-NNN` を保持）に、§8会計で bound の行は§4具体ケースの前提/入力/手順/期待＋`[L1:..]`を差し込み、実行方法を精緻化（db.ts照会→`Playwright+DB確認`）。**TBD行**は期待に`【TBD】理由`・実行方法`保留(TBD)`、**excluded/DELEG行**は`【対象外(...)】理由`・実行方法`対象外(...)`。
- これは**人が母集合と直接diff/比較できる読取ビュー**（`_drafts/`の候補md/oracleが正・concretized.tsvは派生。手編集しない＝mdを直して再生成）。
- Gate A の `_drafts隔離(G4)` は fixtures/oracle 直下のみ検査し、この `exec/tsv/*_concretized.tsv` は対象外（意図的出力）。

## 役割・独立性（不変）
著者＝sonnet subagent／レビュー＝codex／戦略・オーケストレーション＝main。**著者≠レビュアー**を維持。
fable5は上限のため不使用（[[role-assignment-after-fable5-limit]]）。

## 期待効果
M03-01の bound_overreach(#B1)・スコープ(#B2)・source_class(G3)・stale-ref(G6)・会計(G5)は**全てGate A/Bで事前に消える**。
→ 8周は **codex 1〜2パス**へ圧縮見込み。M03-02で実測し、必要ならゲートを追補する。
