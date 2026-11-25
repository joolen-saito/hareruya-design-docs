あなたは敵対レビュアーです。日本語で答えてください。ファイルは読むだけで、書き換えないでください。

# レビューする成果物
晴れる屋のシナリオテストで「業務フローの全パターン（パターン一覧・工程・判断の分かれ道・条件の文）がシナリオで通っているか」を照合した結果。
- 結果のまとめ：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務フローとの照合/照合結果.md
- 機械の出力：同じフォルダの 01_書き起こしの照合.tsv・02_パターン.tsv・03_工程.tsv・04_分かれ道.tsv・05_条件の文.tsv
- 人の判定：同じフォルダの branch_map.tsv（分かれ道→業務条件の値・対象外の理由）、judgements.tsv（工程・パターン・条件の文の判定）
- 道具：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/tools/flow_from_xlsx.py（Excel を直接読む）、tools/verify_flow_coverage.py（照合）

# 正本（オラクル）
- 業務フローの Excel：/home/y-saito/Developments/hareruya-design-docs/scenario_test/在庫に関連する_業務一覧_業務フロー.xlsx、/home/y-saito/Developments/hareruya-design-docs/scenario_test/02_業務一覧_業務フロー.xlsx（シートと md の対応は scenario_test/markdown/index.md）
- 書き起こし：/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05〜18_*.md（`- **R123**:` が Excel の行。「## 業務フロー（図形再構成）」に図形と矢印）
- シナリオ：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/<業務>/scenario_list.md と matrix_*/（組み合わせ表）、通しシナリオ/
- 業務条件の値と対応表：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/<業務>/factors.tsv・cond_map.tsv・step_map.tsv・step_scope.tsv・level_map.tsv・exc_map.tsv・test_map.tsv

# 決まっていること（指摘しない）
- 業務フローの「GMO」は「SPLINKS」が正しい（依頼者確認 2026-11-20）
- 条件は業務の分かれ目だけ。言語・入口・画面かCSVか・端末・出力形式・表示の出し分け・お客様の入力が保存されるだけの違いは外す（2026-11-09〜10 依頼者決定。factors.tsv の扱い「適用外」と備考）
- 店頭買取の一部キャンセルはフェーズ2見送り。EC-CUBE→スマレジの在庫連携は行わない。複数配送は使わない。通販（配送）は本店のECだけ
- 非機能・データ移行・現新比較はシナリオに入れない
- 結合テストとは別物。結合テストへの影響は指摘しない
- シナリオを足す・直す提案は要らない。照合の判定が正しいかだけを見る

# 重点観点（上から順に）
1. 取りこぼし：Excel の図・セルにあるのに道具が拾っていない判断・分かれ道・パターン・工程（図形の種類、グループの中、矢印の始点・終点、見出しの判定、帯の切り方）
2. branch_map.tsv と judgements.tsv の判定の誤り：値IDがその文・枝を表していない、対象外の理由が Excel・md の文と合わない、「通る」とした根拠のシナリオがその枝を実際には通っていない（シナリオ本文・組み合わせ表の行で確かめる）
3. 道具の判定の甘さ：「流れの中で値を通るシナリオ」を図の流れ（見出しから次の見出しの手前まで）単位で見ているため、別の枝を通るシナリオで「通る」になっている例
4. 対象外にした工程（03_工程.tsv の扱いが 見出し・システムの外・範囲外）のうち、Excel の文や図で、システムの画面・データを使う作業なのに対象外にしているもの（抜き取りでよい）

# 出力形式
指摘が無ければ `NONE` の1語だけ。指摘があれば1件ずつ次の4行（最大15件、重いものから）：
主張: …
実際: …（ファイル:行 か Excel のシート・行）
判定: 事実の誤り／取りこぼし／根拠不足 のどれか
修正案: …

# 2巡目の補足
1巡目（R1）の指摘6件と扱いは /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務フローとの照合/review/dispositions_R1.md。直した結果が正しいかも見る。同じ指摘の再提示は要らない。新しい事実の指摘だけを出す。2巡目（R2）の指摘5件と扱いは同じフォルダの dispositions_R2.md。これが最後の巡なので、事実の誤りと取りこぼしだけを出す。
