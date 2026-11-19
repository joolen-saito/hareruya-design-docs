あなたは独立したレビュアーです。著者は別人です。ファイルは書き換えず、読んで指摘だけを返してください。日本語で答えてください。

# 対象
晴れる屋の新ECシステムのユーザー目線シナリオテスト（/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario）。シナリオテストは業務が回るかを確かめるもので、条件は業務の分かれ目だけにする。依頼者の決定（2026-11-10）：
1. 重なりはまとめる：業務フローの分かれ道の列が、設計書の条件の列の値でそのまま決まり二重に数えているものは、分かれ道の列を外して条件の列にまとめる。決まらないものは残す。
2. 出し分けは外す：業務フローは分かれず、画面の選択肢や表示の出し分けだけが変わる条件（公開状態で一覧に出る・出ない、ボタン・バナーの表示、支払方法・配送方法の選択肢の出し分け）は外す。ただし、お客様や担当者が買えない・申し込めない・進めないになるもの（業務が止まる）は例外として残す。
これまでの決定（言語・入口・法令の表示・入力の保存だけの違いは外す、区分の名前の違いと数量は残す）は /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/README.md の末尾の節。

- 4つの組の記録（候補ごとの判定・理由・根拠）：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/画面操作の仕分け/重なりと出し分け_X1.md〜X4.md
- 〇表の列：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/<業務>/factors.tsv（扱い「適用外」＋備考に理由。2026-11-10 の備考が今回）。組み合わせ表：各フォルダの matrix_*/fl_table.tsv・README.md の「外した因子・水準」節。
- 〇表の道具：`cd /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario && python3 tools/build_test_pattern_matrix.py tests <シナリオID>`（テストと水準）

# 正本
業務フロー /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/*.md、Excel設計書 /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html の Excel 由来の部分、新実装 /home/y-saito/Developments/ec-cube-enterprise。

# 見てほしいこと（重い順）
1. まとめ違い：まとめた（外した）分かれ道が、まとめ先の条件の値で本当に一意に決まるか。決まらない（まとめ先に無い要素で分かれる、多対多）のにまとめたものは無いか。
2. 外し過ぎ：出し分けとして外したのに、実は業務が止まる（買えない・申し込めない・進めない）、または在庫・お金・状態・帳票の中身・連携・通知が変わるもの。
3. 扱いのばらつき：同じ種類の条件を、組・業務によって違う扱いにしているもの（例：公開状態をイベント・デッキでは外し、商品では残している。デッキビルダーの公開範囲 UEX-07 を残し、デッキの公開状態を外している。ユニサーチの反映 N1 を残し、検索の並び N8 を外している）。どちらに揃えるべきかを正本の根拠で示す。
4. 外し漏れ：上の決定で外すべきなのに残っているもの。

# 指摘しないこと
- 決定1・2そのものの是非。
- 本文・README に、外す前の記述が経緯として残っていること。
- 文の書き方・行数・3因子間の網羅率。

# 出力形式
指摘が無ければ `NONE` の1語だけ。
指摘ごとに次の5行（区切りに空行）：
対象: <業務またはフォルダ> <条件ID・因子>
主張: <いまの扱い>
実際: <正本で確かめた事実（file:line）>
判定: <まとめ違い／外し過ぎ／扱いのばらつき／外し漏れ>
修正案: <1つ>
