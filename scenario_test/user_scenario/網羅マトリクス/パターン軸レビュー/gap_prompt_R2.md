あなたは独立したレビュアーです。著者は別人です。ファイルは書き換えず、読んで指摘だけを返してください。日本語で答えてください。

# 対象
晴れる屋の新ECシステムのユーザー目線シナリオテスト。「業務パターン×シナリオの〇表」で、どのシナリオも通していなかった業務条件の値（抜け）16列を、依頼者の決定（2026-11-09「足す」）で各業務のシナリオに足した。15列はシナリオの L3 に手順と期待値を書き、1列（商品登録・編集 A3-3）は新実装で状態を作れないので適用外にした。今回の変更だけを見てほしい。

- 抜けの一覧：/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/42404d03-e73b-45f6-9418-50900cb43880/scratchpad/gap16.txt
- 各値の定義と根拠：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/<業務>/factors.tsv（値ID A*）
- 変更の差分（シナリオ本文）：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/<業務>/review/パターン抜け反映_2026-11-09.diff（業務＝通販・店頭受取受注管理・ネット買取・商品登録・編集・デッキ登録・在庫管理・仕入れ業務）
- 変更の記録（足した場所・期待値・根拠）：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/<業務>/review/パターン抜け反映_2026-11-09.md
- 〇の差分：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/パターン軸レビュー/抜け補完_網羅マトリクス.diff（pattern_map.tsv・factors.tsv）

# 正本（オラクル）
- Excel設計書の原本：/home/y-saito/Developments/hareruya-design-docs/excel_to_html/input/*.xlsx。HTML版：/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html。HTMLの「入出力」「業務ロジック」「表示メッセージ」「現行仕様」「実装差分追補」の節は Excel 由来ではない（現行ソース・新実装から起こしたもの）。
- 業務フロー：/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/*.md
- 新実装：/home/y-saito/Developments/ec-cube-enterprise。現行：/home/y-saito/Developments/ の兄弟ディレクトリ（pf-eccube3 など）。
- 期待値の決め方：Excel 由来の記述を正にする。Excel と新実装が食い違うときは Excel を期待値にして「新実装は不合格になり得る」と記録する。Excel に無いものは新実装→現行の順で根拠を取る。どこにも無い期待値は書かない。

# 見てほしいこと
1. 期待値の事実：足した手順・期待値（数値・状態・画面の文言・エラーの有無）が、書かれた根拠（Excel・新実装・業務フロー）と一致するか。数値の計算（総原価・在庫）、画面の文言の一字一句、境目の向き（以上・未満）を確かめる。
2. 根拠の出どころ：期待値の根拠が Excel 由来の部分か、それ以外なら新実装・現行で裏付けがあるか。根拠の無い期待値（捏造）が無いか。
3. 食い違いの扱い：Excel と新実装が食い違う箇所で、Excel を期待値にし、食い違いを記録しているか。
4. 〇：pattern_map.tsv に足した〇の引用が、そのシナリオ自身の本文にあり、その値の状態を作って確かめていると読めるか。
5. 適用外にした 商品登録・編集 A3-3 の理由（新実装はカード詳細IDだけで引くので2件以上見つかる状態を作れない）が新実装のソースと合うか。

# 1巡目の扱い（2巡目）
1巡目の指摘は2件（通販 A1-2 UTS-02・UTS-19：全キャンセル後の注文数0・総原価0について、新実装は明細を変えない食い違いの記録が無い）。新実装の注文状態の遷移で確かめ、期待値は Excel のまま、通販/scenario_list.md の「設計書との食い違い」に記録した（差分に含まれる）。直したところを確かめ、新しい事実の指摘だけを書く。

# 指摘しないこと
- 文の書き方・言い回し。
- 今回足していない他の値・他のシナリオのこと。
- 画面操作の細部（押す・選ぶ）の追加。

# 出力形式
指摘が無ければ `NONE` の1語だけ。
指摘ごとに次の5行（区切りに空行）：
対象: <業務> <値ID> <シナリオID>
主張: <シナリオに書かれていること>
実際: <確かめた事実（file:line、xlsx ならシート名とセル番地か文字列）>
判定: <事実の誤り／根拠なし／出どころ違い／食い違いの扱い誤り／〇の誤り>
修正案: <1つ>
