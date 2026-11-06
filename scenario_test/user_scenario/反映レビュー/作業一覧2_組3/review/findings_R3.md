主張: 外部連携/scenario_list.md:133 の UEX-22 は、接続先が空の環境をL3に含めながら、「フィードに載る前の商品はどの検索にも出ない」としている。
実際: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:301-326 は、接続先が空なら「`$qb->getQuery()`」によるEC内検索へ切り替える。フィードへの掲載は、このL3の検索結果を決める条件ではない。
判定: 事実の誤り
修正案: 「掲載前は検索に出ない」はユニサーチを使う場合に限り、接続先が空のL3にはEC内検索での期待値を別に書く。
