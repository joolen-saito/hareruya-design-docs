あなたは独立したレビュアーです。著者は別人です。ファイルは書き換えず、読んで指摘だけを返してください。日本語で答えてください。

# 対象
晴れる屋の新ECシステムのユーザー目線シナリオテスト（/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario）。依頼者：「通しシナリオは業務フロー上の条件分岐を網羅できているか。そこが重要」。洗い出し（/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/画面操作の仕分け/通しシナリオの分岐の網羅_2026-11-12.md）で、通しシナリオの範囲の中にあるのに組み合わせ表に無い分岐が見つかり、依頼者の決定で、業務フローと設計書に根拠のあるものを通しシナリオ（UTH-01・UTH-03・UTH-05）に例外14件として足した。期待値は各業務のシナリオの既存の文から取った。足したものは実施するテスト（各 matrix_UTH-0x/selected.tsv）にも入れた。記録はその md の末尾「反映（2026-11-12）」。

- 変更の差分（通しシナリオ。matrix.tsv は除く）：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/画面操作の仕分け/分岐追加_通しシナリオ.diff
- 〇表の差分：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/画面操作の仕分け/分岐追加_網羅マトリクス.diff
- 各テストの水準：`cd /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario && python3 tools/build_test_pattern_matrix.py tests UTH-05`

# 正本
業務フロー /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/*.md、Excel設計書 /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html の Excel 由来の部分、新実装 /home/y-saito/Developments/ec-cube-enterprise、各業務のシナリオ（/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/<業務>/scenario_list.md・L4・matrix_*/）。

# 見てほしいこと（重い順）
1. 期待値の事実：足した例外の期待値が、書かれた根拠（各業務のシナリオの文・業務フロー・設計書）と合っているか。根拠の無い期待値（捏造）が無いか。
2. 差し込み先：例外の差し込む元の条件（どの行に差し込むか）が、その例外の流れと矛盾しないか（例：本店の行に支店の例外、クレジットカードでない行にカードの減額）。
3. 分岐の取りこぼし：洗い出しで「足す」とした分岐のうち、足したことになっているのに実際は通らないもの。
4. 〇：足した例外に付けた〇（exc_map・level_map・test_map）が、例外の中身と合っているか。

# これまでの扱い（3巡目・最終）
1巡目の指摘2件（UTH-01 Z23 の差し込み先、UTH-03 EX31 の手順の順序）は直した（記録の末尾「codex R1 の扱い」）。2巡目の指摘3件（UTH-05 EX26・EX27・EX28 の本文の差し込み位置、EX30 の手順）も直した（記録の末尾「codex R2 の扱い」）。直したところを確かめ、新しい事実の指摘だけを書く。今回が最後の巡。

# 指摘しないこと
- 文の書き方・行数・網羅率。足さないと決めた分岐。各業務のシナリオそのものの是非。

# 出力形式
指摘が無ければ `NONE` の1語だけ。
指摘ごとに次の5行（区切りに空行）：
対象: <UTH> <例外ID>
主張: <書かれていること>
実際: <確かめた事実（file:line）>
判定: <事実の誤り／根拠なし／差し込み先の誤り／取りこぼし／〇の誤り>
修正案: <1つ>
