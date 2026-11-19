あなたは独立したレビュアーです。著者は別人です。ファイルは書き換えず、読んで指摘だけを返してください。日本語で答えてください。

# 対象
晴れる屋の新ECシステムのユーザー目線シナリオテスト（/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario）。依頼者の指摘（2026-11-09）「ひとつのシナリオで数量が1点、2点以上が混在するのはおかしい」を受け、IPA「高信頼化ソフトウェアのための開発手法ガイドブック」6.3.1（組み合わせ表の1行が1本のテスト、1行には条件ごとに値が1つ）・6.3.2（例外は1つずつ差し込んで別のテスト）に合わせて、1本のシナリオに同じ条件の値を並べていたものを、組み合わせ表（matrix_<ID>/ の fl_table.tsv・prohibitions.tsv・exceptions.tsv・README.md、matrix.md/tsv は道具が作る）で値ごとのテストに分けた。方針は「期待値は本文に書いてあるものを値ごとに分けるだけで、新しい期待値を作らない」。分ける前の文は各 README の「分ける前の記述」に残した。

- シナリオ側の差分（変更前→変更後。matrix.md/matrix.tsv は除く）：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/パターン軸レビュー/テスト単位_シナリオ.diff（5,381行）
- 各フォルダの記録：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/<フォルダ>/review/テスト単位_2026-11-09*.md（どの値がどのテストになったか、迷った点）
- 〇の対応の差分（参考。全部は見なくてよい）：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/パターン軸レビュー/テスト単位_網羅マトリクス.diff。値の意味は /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/<業務>/factors.tsv。各テストの水準は `cd /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario && python3 tools/build_test_pattern_matrix.py tests <シナリオID>`。

# 正本（オラクル）
- 分ける前の本文：差分の「-」側と、各 README の「分ける前の記述」。
- 期待値の根拠を確かめるとき：Excel設計書 /home/y-saito/Developments/hareruya-design-docs/excel_to_html/input/*.xlsx（HTML版 excel_to_html/output/*.html。その「入出力」「業務ロジック」「表示メッセージ」「現行仕様」「実装差分追補」の節は Excel 由来ではない）、業務フロー /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/*.md、新実装 /home/y-saito/Developments/ec-cube-enterprise。

# 見てほしいこと（重い順）
1. 新しい期待値の混入：分けたテスト（行・例外）の期待値・手順・前提に、分ける前の本文にも正本にも無い内容が入っていないか。著者が「推論」「裏として」「足した」と書いているものは特に確かめる（例：通しシナリオ UTH-04 の例外 EX28・EX29 の「申込済みにならないので以降の手順は通らない」、業務周期 UCY-15 の前側（締切の前・開催日の23:59:59・決済中29分）の期待値、UCY-06 の例外 E2、通販 UTS-01 の例外 E23〜E25、価格管理・商品登録で新しく作った表の水準）。
2. 分け方の誤り：1本のテストに同じ条件の値がまだ混ざっていないか、逆に1つの値を無理に分けて意味が変わっていないか。水準の文が分ける前の文と意味がずれていないか。
3. 禁則の根拠：新しく足した禁則（あり得ない組み合わせ）が本文か正本から言えるか。言えない禁則で組み合わせを削っていないか（例：UTH-01 の X52〜X61、UDK-01 の X1b・X1c、UKA-07 の「棚戻し済み×CSV」）。
4. 失われたもの：分ける前の本文にあった期待値・手順が、分けたあとのどのテストにも無くなっていないか。
5. 〇（参考）：業務フローパターン・法令の表示を全テストに付けた〇（通販 UTS-01・UTS-04 の LC、店頭受取 UOR-01・UOR-06 の LO など）が、そのテストで実際に通る流れか。

# 指摘しないこと
- 文の書き方・言い回し・表の列の並べ方。
- 組み合わせ表の行数や3因子間の網羅率。
- 今回分けていない他のシナリオのこと。

# 出力形式
指摘が無ければ `NONE` の1語だけ。
指摘ごとに次の5行（区切りに空行）：
対象: <フォルダ> <シナリオID>/<テストまたは例外ID>（または fl_table・prohibitions の行）
主張: <分けたあとに書かれていること>
実際: <分ける前の本文・正本で確かめた事実（file:line）>
判定: <新しい期待値の混入／分け方の誤り／禁則の根拠なし／失われた期待値／〇の誤り>
修正案: <1つ>
