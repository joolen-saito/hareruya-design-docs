主張: `matrix_UTH-02/prohibitions.tsv:2-3` の X1・X2 は、オンライン本人確認を今回申請しない C4 と、オンライン本人確認済みの D1・D2 を禁じている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/14_ネット買取.md:89-90` は「本人確認が確認済みまたは買取価格1万円未満であれば」「簡易書留による本人確認を行わない」とする。既に確認済みの会員が今回申請しない経路も成り立つ。
判定: 禁則の誤り
修正案: X1・X2を外し、確認済みの会員が今回申請しない行を加える。

主張: `matrix_UTH-02/prohibitions.tsv:15` の X14 は、全部売却しない F3 と、未確認・1万円以上の D4 を禁じている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/14_ネット買取.md:87-93` の簡易書留判定は「買取価格が１万以上でかつ本人確認未確認か」であり、売却する明細があることを条件にしていない。成果物も `scenario_list.md:122` で扱いを「判断待ち」としている。
判定: 禁則の誤り
修正案: 判断が決まるまで X14 を確定した禁則として網羅率の分母から除かず、この組の扱いを判断待ちとして残す。

主張: `matrix_UTH-02/matrix.md:18,22` の T05・T09 は全部売却しない F3 と H2 を組み合わせ、H2 の説明で「振込完了で未登録在庫ありになり、実在庫を登録して入庫待ちにする」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/14_ネット買取.md:75-76` は売却しない場合を返送へ分岐させる。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/RegisterIndividualStockAction.php:48-50` も「売却しない個別入力商品は実在庫登録できません。」とする。
判定: 事実の誤り
修正案: F3 の行では個別入力商品の有無と振込後の在庫遷移を分けて表し、到達しない「未登録在庫あり→入庫待ち」を期待値から外す。

主張: `matrix_UTH-02/exceptions.tsv:11-14` の E10〜E13 は、振込依頼時の例外を F1 に限定している。E11 はさらに D3 に限定している。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html:1797-1798` は「振込依頼済みステータスに変更時」に身分証明書の登録を要求し、必要金額以上で本人確認が未確認・確認中なら更新不可とする。売却する明細が残る F2 にも同じ条件がかかる。
判定: 事実の欠落
修正案: E10〜E13の差し込み条件を振込依頼へ進む F1・F2 の該当行に広げ、E11は金額・本人確認状態で限定しない。

主張: `UTH-02_ネット買取の申込から入庫まで通す.md:93-94` は、E2 自動承諾では手順14・15を管理画面の状態変更に置き換える一方、F2 一部返送では手順15でお客様が明細を「売却しない」にするとしている。T01・T04・T07・T10・T15・T17・T20 の E2×F2 に実行手順がない。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:91-106` は管理画面の保存で明細の売却状態を反映し、初回の査定内容承諾時にその状態どおり実在庫を作る。`同:184-198` は売却状態を管理画面のフォーム値から保存する。
判定: 事実の欠落
修正案: E2×F2 の行には、店舗チームが管理画面で返送する明細を「売却しない」に設定してから査定内容承諾へ変更する手順を加える。
