主張: `scenario_list.md:37,124` は、C3（デッキセットの結合）の行も「在庫編集承認：未承認→承認済」としている。
実際: `hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:4000` の結合ステータスは「新規登録、結合元登録、結合承認待ち、却下、入庫完了」。`hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:20` も結合の承認後を「入庫完了」とする。
判定: 事実の誤り
修正案: C3は在庫編集承認の遷移から分け、結合の状態と結合元・結合先の在庫数を確かめる。

主張: `matrix_UTH-01/matrix.md:23,24,38` の予約BOXの行T10・T11・T25は、それぞれEMS・ゆうパケット・EMSで購入を完了する。
実際: 開発環境DBダンプの購入グループ表では「予約販売BOX（兄弟戦争）」があり、購入グループと配送方法の対応表では、このグループに結び付くのは「ゆうパック」「スムーズ店頭受取」だけ。`matrix_UTH-01/fl_table.tsv:6` が用意する前提として書くのは「予約商品フラグを1にした購入グループ」で、配送方法の追加は書かれていない。
判定: 禁則の誤り
修正案: 既存の予約BOXグループを使う行は選べる配送方法に直し、別の設定を使うなら必要な配送方法との結び付きを前提に明記する。

主張: `matrix_UTH-01/prohibitions.tsv:25-26` のX24・X25は、海外向けEMSと送料無料金額以上（Q2・Q3）の組を禁じている。
実際: `pf-eccube3/app/Plugin/HareruyaEc/Service/ShoppingService.php:774-776` は、商品合計が設定額以上でも海外なら送料無料にしないだけで、購入自体を禁じていない。`hareruya-design-docs/scenario_test/user_scenario/通販/matrix/matrix.md:43` にも、海外・EMS・送料無料金額以上の購入行がある。
判定: 禁則の誤り
修正案: X24・X25を外し、海外のQ2・Q3では金額が閾値以上でも送料が発生する期待値にする。

主張: `scenario_list.md:34-48` の区間表はUPR-10も参照すると書くが、スタン落ちの変更区間と、その結果を次のフィードへ引き継ぐ値が表にない。
実際: `hareruya-design-docs/scenario_test/markdown/10_商品登録・編集_tobe.md:143-153` は、カテゴリの親と商品への紐づけを直し、商品CSVを取り込み、カードはリーガリティも更新する工程を書く。`hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:142` は区間ごとに「つなぎ目で引き継ぐ値」を求める。
判定: 事実の欠落
修正案: 登録後の変更区間を表に足し、更新後のカテゴリとカードのリーガリティを次のフィード・検索へ引き継ぐ値として書く。

主張: `scenario_list.md:123` は、F2の全行で支店の商品公開ステータスが「非公開→公開」になるとしている。
実際: `hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/scenario_list.md:18` は支店の新規登録時の遷移を「（新規）→公開／非公開」とする。F2×D1のT02などは登録時から公開であり、非公開を通らない。
判定: 事実の誤り
修正案: 支店の遷移を、登録時から公開する行と非公開から切り替える行に分ける。

主張: `matrix_UTH-01/exceptions.tsv:5` のZ04は、販売価格0円の商品がフィードから除かれる例外の差し込み条件を「A2 G1」に限定する。
実際: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1500-1501` の取得条件は「販売価格が1円以上」で、グッズ・通常価格だけに限定していない。`hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:59` は例外の成立に要る水準を差し込み条件に書くよう定める。
判定: 事実の誤り
修正案: Z04の差し込み条件から不要なA2・G1を外し、価格0円を作る操作を例外手順に書く。

主張: `matrix_UTH-01/prohibitions.tsv:47-48` は異なる二つの禁則（T2×B2、C3×A1）に同じID「X47」を付けている。
実際: 同ファイルの47行は「X47 T2 B2」、48行は「X47 C3 A1」。`hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:57` は禁則IDを参照欄として定めており、このままではX47が一意に特定できない。
判定: 事実の誤り
修正案: 二つの禁則に別々のIDを付け、参照とマトリクスを更新する。

主張: `scenario_list.md:93,113` は例外を18件、L4の代表行をT07としている。
実際: `matrix_UTH-01/exceptions.tsv:2-20` はZ01〜Z19の19件で、`UTH-01_商品を登録しユニサーチ経由で会員が探して買いサンクスメールが届く.md:8` は代表行をT01とする。
判定: 事実の誤り
修正案: 例外数を19件、代表行をT01に訂正する。
