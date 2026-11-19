あなたは独立したレビュアーです。ファイルは書き換えず、読んで指摘だけを返してください。日本語で答えてください。

# 対象
晴れる屋の新ECシステムのシナリオテストで、「業務パターン×シナリオの〇表」の列（業務条件の値）を足した。依頼者の決定は「設計書・業務フローに根拠のある値だけを足し、〇が付かない列は抜けとして赤く出す」。足した行と、その値に付けた〇を確かめてほしい。

- 足した値（97行）：/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/42404d03-e73b-45f6-9418-50900cb43880/scratchpad/axis_review/added_axes.tsv
  - 実体は /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/<業務>/factors.tsv の、備考に「2026-11-09 パターン軸の追加」がある行。同じ factors.tsv の既存行（重なりの確認に使う）もそこにある。
  - 最後の列「引用の機械確認」は、引用の文字列が出典ファイルにあるかを機械で見た結果（全行「あり」。通販 A1 の2行は表のセルにまたがるので「見つからない」と出るが、表の中に内容はある）。
- 足した値に付けた〇（82行）：/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/42404d03-e73b-45f6-9418-50900cb43880/scratchpad/axis_review/added_marks.tsv
  - そのシナリオ自身の本文は `cd /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario && python3 tools/build_pattern_matrix.py dump <シナリオID>` で読める。

# 正本（オラクル）
- Excel設計書の原本：/home/y-saito/Developments/hareruya-design-docs/excel_to_html/input/*.xlsx（日本語の文脈検索は rg が失敗するので、unzip -p で xl/sharedStrings.xml などを取り出し python の re で探す）
- HTML設計書：/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html。このうち根拠にしてよいのは Excel 由来の部分だけ。見出しが「入出力」「業務ロジック」「表示メッセージ」の節、「現行仕様」の節、「実装差分追補」の節は、現行ソースや新実装から起こした機能設計書で、Excel 由来ではない。
- 業務フロー：/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/*.md
- 設計書内の優先順位：Excel由来＞表示メッセージ節＞現行仕様節、改訂後を優先。
- シナリオ自身の文書（scenario_test/user_scenario/ の下）は根拠にならない（自分を根拠に軸を作ると循環する）。新実装（/home/y-saito/Developments/ec-cube-enterprise）だけを根拠にした軸もだめ。

# 見てほしいこと
1. 根拠の出どころ：引用が Excel 由来の部分にあるか。機能設計書の節・現行仕様の節・シナリオ自身・新実装だけが根拠のものは指摘する。
2. 値が根拠から言えるか：引用から、その値の分け方（例：1点／複数点、境目の値、全部／一部）が素直に言えるか。根拠の文に無い分け方を作っていないか（たとえば「数量という項目がある」だけから「1点／複数点」を作るのは根拠として弱い。ただし範囲「1〜20」や「上限10000件」のように境目が文に書かれていれば言える）。
3. 重なり：同じ factors.tsv の既存の値で、すでに表せている軸を重ねていないか。
4. 扱い：対象・適用外・他業務・他層の付け方が、出典と備考の理由に合っているか。
5. 〇：added_marks.tsv の各〇について、引用がそのシナリオ自身の本文にあり、その値の状態を実際に作って（選んで）確かめていると読めるか。参照だけ・前提として触れるだけで〇にしていないか。

# 指摘しないこと
- 文の書き方・言い回し・列の並べ方。
- 〇が付かない（抜け）こと自体。抜けを見せるのが目的。
- 足すべきなのに足していない軸（今回は足した行の正しさだけを見る）。

# 出力形式
指摘が無ければ `NONE` の1語だけ。
指摘ごとに次の5行（区切りに空行）：
対象: <業務> <値ID>（〇なら <業務> <値ID> <シナリオID>）
主張: <ファイルに書かれていること>
実際: <確かめた事実（file:line、xlsx ならシート名とセル番地か文字列）>
判定: <出どころ違い／根拠から言えない／重なり／扱い誤り／〇の誤り>
修正案: <消す／扱いを○○へ／値を○○に／〇を外す など1つ>
