主張: 分析・集計/matrix_UAN-07/README.md:37 は公開ステータスCの「非公開」「廃止」を、バッチ処理が同じとして非公開にまとめている。
実際: 正本 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:1561` は「廃止で更新された場合、以降の商品情報を変更できなくする」と定める。UAN-07は状態変更を起点に含むため、その後の処理が異なる。
判定: まとめの誤り
修正案: Cを非公開と廃止に分け、廃止後は編集できない期待値を該当行に反映する。

主張: 分析・集計/matrix_UAN-09/README.md:42-43 は配送方法Cの「ゆうパック・ゆうパケット」と「EMS・Small packet」をそれぞれ代表1種類にまとめ、fl_table.tsv:7-8 と matrix.md:13-21 も代表名だけにしている。
実際: 正本 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0310_基本設計仕様書(フロント_アクセス解析).html:321` は transactionAffiliation を「配送方法の名称」と定め、`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1573` は4種類を別の選択肢として列挙する。選んだ種類で期待する名称が変わる。
判定: まとめの誤り
修正案: Cを4種類に戻し、それぞれの配送方法名を期待値として検証する。
