あなたは敵対レビュアーです。日本語で答えてください。ファイルは読むだけで、書き換えないでください。

# レビューする成果物
晴れる屋のシナリオテストで「業務フローの Excel の要素が、1つ残らずシナリオか対象外の理由に結び付いている」ことを示す証明用の対応表（2026-11-24）。
- 表：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務フローとの照合/業務フローとシナリオの対応表.xlsx（シート「見方」「対応表」。1行が Excel の要素1つ）
- 表を作る道具：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/tools/build_flow_proof.py（止まる条件は冒頭の説明）
- 今回新しく人が書いた対応：同じフォルダの business_list_map.tsv（業務一覧の13業務→シナリオのフォルダ）、screen_rows.tsv（画面マトリクスの行→業務フローの流れ。「12:R48」は業務フロー12の R48 から始まる見出しの流れ）、screen_map.tsv（画面マトリクスの〇1つずつ→通すシナリオと引用、または対象外の区分・理由・決めた人）
- パターン・工程・分かれ道・条件の文の段は、11/20 に codex 3巡で閉じた照合（verify_flow_coverage.py の 02〜05_*.tsv）をそのまま載せ、対象外の区分と決めた人を足したもの。対象外の区分の付け方は build_flow_proof.py の cat_pattern・cat_step・cat_branch・cat_cond

# 正本（オラクル）
- 業務フローの Excel：/home/y-saito/Developments/hareruya-design-docs/scenario_test/在庫に関連する_業務一覧_業務フロー.xlsx（シート「業務フロー画面マトリクス」ほか）、/home/y-saito/Developments/hareruya-design-docs/scenario_test/02_業務一覧_業務フロー.xlsx（シート「業務一覧」ほか）。書き起こしは scenario_test/markdown/01_業務フロー画面マトリクス.md・02_業務一覧.md・05〜18_*.md
- シナリオ：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/<業務>/scenario_list.md と matrix_*/、通しシナリオ/
- 工程の対応表と業務条件の値：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/<業務>/step_map.tsv・factors.tsv ほか
- 依頼者の決定の記録：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務フローとの照合/照合結果.md の「通していないものと依頼者の決定（2026-11-24）」、各 scenario_list.md の「対象外」の節、factors.tsv の扱い「適用外」の備考

# 決まっていること（指摘しない）
- 対象外にしたものの扱いは依頼者が決めた（2026-11-24）：システムを触らないものは足さない／依頼者の決定で外した値・刷新後に使わない運用・フェーズ2見送りは外したまま。これらをシナリオに足せという指摘は要らない（区分の付け間違い・根拠の無い対象外は指摘する）
- 条件は業務の分かれ目だけ。画面の操作・入口・入力方法（画面か CSV か）の違いは外す（2026-11-09〜10 依頼者決定）。EC-CUBE→スマレジの在庫連携は行わない（2026-11-18）
- 業務フローの「GMO」は「SPLINKS」が正しい
- 11/20 に閉じた照合の判定（02〜05_*.tsv の通る・対象外）をやり直す指摘は、事実の誤りが新しく見つかったときだけ
- シナリオの期待値の正しさ、非機能・データ移行は範囲外。結合テストへの影響は指摘しない

# 重点観点（上から順に）
1. 画面マトリクス（screen_map.tsv）：「通る」のシナリオが、その業務の中でその画面を本当に使っているか（引用が別の業務・別の画面のことを言っていないか）。「対象外」の根拠が記録に実在し、その〇に当てはまるか（入力方法の違いで外したものは、同じ登録を別の入力方法で通しているシナリオが実在するか）。こじつけの対象外が無いか
2. screen_rows.tsv：画面マトリクスの行（業務フロー対応番号・業務内容）と、結び付けた業務フローの流れ（見出しの行）が合っているか。画面マトリクスの番号は古く、業務フロー12の図の番号とずれているところがある（例：画面マトリクスの「9 安価カード在庫補充作業」は図の「8 安価カード在庫補充作業」）
3. 取りこぼし：Excel の「業務フロー画面マトリクス」「業務一覧」の〇・行で、表に行が無いもの。表の行の数が Excel の要素の数と合うか
4. 対象外の区分と決めた人：区分（システムを触らない・刷新後に使わない運用・フェーズ2見送り・依頼者の決定で外した値・見出し・分かれ道でない）が理由の文と合っているか。決めた人の日付が記録と合っているか
5. business_list_map.tsv：業務一覧の各業務に結び付けたシナリオのフォルダが合っているか

# 出力形式
指摘が無ければ `NONE` の1語だけ。指摘があれば1件ずつ次の4行（最大15件、重いものから）：
主張: …
実際: …（ファイル:行 か Excel のシート・行）
判定: 事実の誤り／取りこぼし／根拠不足 のどれか
修正案: …
