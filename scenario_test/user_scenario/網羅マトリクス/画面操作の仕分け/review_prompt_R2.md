あなたは独立したレビュアーです。著者は別人です。ファイルは書き換えず、読んで指摘だけを返してください。日本語で答えてください。

# 対象
晴れる屋の新ECシステムのユーザー目線シナリオテスト（/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario）。シナリオテストは「業務が回るか」を確かめるもの。依頼者の決定（2026-11-09）で、業務の流れが分かれない画面操作の違いを、〇表（網羅マトリクス/<業務>/factors.tsv の列）と組み合わせ表（matrix_*/fl_table.tsv の因子・水準）から外した。線引き：
1. 表示言語・帳票やメールの言語だけの違いは外す（言語以外の結果が変わる値は残す）
2. 画面かCSVかなどの入口の違いは、CSVにしか無い処理・結果も含めて全部外し、業務フローで主に使う方法（無ければ画面）を代表に1つ残す
3. 記録される区分の名前の違い（廃棄の区分、問屋仕入／他店仕入、身分証の種類、ブラックリストの項目、取消／打消し など）は全部残す
4. 最終確認画面の法令の表示項目は外す
5. それ以外は、保存される記録・状態・お金・在庫・帳票の中身・連携・通知の有無が変わるなら残す。数量（1点／2点以上など）は残す
外した因子・値は消さずに、README の「外した因子・水準」節と、factors.tsv の扱い「適用外」＋備考に理由を残した。

- 仕分けの一覧（判定と理由）：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/画面操作の仕分け/仕分け.tsv（と組ごとの ui_G1〜G6.tsv）
- シナリオ側の差分（変更前→後。matrix.md/tsv は除く）：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/画面操作の仕分け/除外_シナリオ.diff
- 〇の対応の差分（参考）：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/画面操作の仕分け/除外_網羅マトリクス.diff
- 各フォルダの記録：/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/<フォルダ>/review/画面操作の除外_2026-11-09.md、まとめ /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/パターン軸レビュー/画面操作の除外_まとめ_2026-11-09.md

# 正本
業務フロー /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/*.md、Excel設計書 /home/y-saito/Developments/hareruya-design-docs/excel_to_html/input/*.xlsx（HTML版 excel_to_html/output/*.html の Excel 由来の部分）、新実装 /home/y-saito/Developments/ec-cube-enterprise。

# 見てほしいこと（重い順）
1. 外し過ぎ：業務の分かれ目（後の作業・担当・手順、または記録・状態・お金・在庫・帳票の中身・連携・通知が変わる）なのに、画面の操作の違いとして外したもの。とくに、ほかに選択肢の無い1つの手順・出力を「入口の違い」として外したもの、言語以外の結果も変わる値を言語として外したもの、業務が止まる例外（エラー・上限・期限）を外したもの。
2. 外し漏れ：上の線引きで外すべきなのに残っているもの（言語だけ・入口だけの違いの因子・水準・〇表の列）。
3. 代表の選び方：入口を外したあとに残した代表が、業務フローで主に使う方法と食い違っていないか。
4. 付け替えた例外：差し込む元を付け替えた例外が、付け替え先の行で成り立つか。
5. 新しい期待値の混入：外すついでに、本文に無い期待値・手順を足していないか（今回足したのは、代表で行うことの一文と、画面での例外 UZK-06 E5 など。記録に書いてある）。

# 1巡目の扱い（2巡目）
1巡目の指摘8件と扱いは /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/画面操作の仕分け/dispositions_R1.md（8件とも直した）。直したところを確かめ、新しい事実の指摘だけを書く。

# 指摘しないこと
- README・本文に、外す前の記述が経緯として残っていること（「外した因子・水準」節で上書きしている）。
- 文の書き方・行数・3因子間の網羅率。
- 線引き1〜5そのものの是非（依頼者の決定）。

# 出力形式
指摘が無ければ `NONE` の1語だけ。
指摘ごとに次の5行（区切りに空行）：
対象: <フォルダ> <シナリオID か 業務の条件ID>（因子・水準・例外・〇表の列）
主張: <いまの扱い>
実際: <正本・本文で確かめた事実（file:line）>
判定: <外し過ぎ／外し漏れ／代表の誤り／例外の付け替えの誤り／新しい期待値の混入>
修正案: <1つ>
