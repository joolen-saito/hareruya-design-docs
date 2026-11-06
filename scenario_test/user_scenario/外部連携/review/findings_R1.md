主張: `外部連携/scenario_list.md:110` の UEX-13 は、ポイントグランターが同じ内容を再送しても会員のポイントが「1回分だけ残る」とする。
実際: `ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterRelayService.php:75,95-111,117-120` は、スマレジへの加算後に取引IDを取得する。コメントも「point/add は非冪等」で、結果不明時の再送は「二重付与になる」と明記する。
判定: 事実の誤り
修正案: 再送で常に1回分になるという期待値を外し、二重付与の可能性がある結果不明時と、ECへの同一取引通知の二重反映防止を分けて記載する。

主張: `matrix_UEX-07/prohibitions.tsv:7-8` の禁則 X6・X7 は、下書きが残るデッキと公開検索・自分のデッキ検索の組を禁じる。
実際: `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:224,293-301,318-324` では、1件参照は下書きを先に読む一方、検索は保存済みデッキを検索する。下書きが残った状態でも検索は実行できる。
判定: 禁則の誤り
修正案: X6・X7を削除し、検索結果には保存済みの内容が出る組をマトリクスに含める。

主張: `matrix_UEX-07/prohibitions.tsv:6` の禁則 X5 は、「所有者でない人」B2 と「自分のデッキ検索」C3 を禁じる。
実際: `excel_to_html/output/0515_基本設計仕様書(API_デッキビルダー).html:654` は、自分のデッキ検索の対象を「認証したプレイヤーが所有するデッキだけ」とする。B2 に含めた「他の会員」が認証して自分の一覧を開く組は成立し、対象デッキが一覧に出ない。
判定: 禁則の誤り
修正案: B2を未ログインと認証済みの他会員に分け、後者とC3の組を残す。

主張: `matrix_UEX-07/exceptions.tsv:4` の EX3 は差し込み条件を A3（限定公開）だけとし、`matrix.md:31` で所有者本人の T07 に差し込んで、違う閲覧用トークンなら404とする。
実際: `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:781-788` は、限定公開の参照を「閲覧用トークンが一致」**または所有者本人**なら許す。T07の所有者本人は、違うトークンでも参照できる。
判定: 事実の誤り
修正案: EX3の差し込み条件に「所有者でない人」を加え、その条件を満たす行に差し込む。

主張: `外部連携/scenario_list.md:29,135` は、記事保存時にWordPressがECへ送る通知を、設計書に無いことを理由に対象外とする。
実際: `ec-cube-enterprise/src/Eccube/Controller/App/ArticleController.php:38-49` は「記事サイトは記事保存のたびにこのAPIを呼び、応答が整数でないと記事の保存を中断する」と記し、ECが整数 `1` を返す。記事保存の成否に関わる連携である。
判定: 事実の欠落
修正案: 記事保存時の通知と応答を連携の検証対象に入れ、設計書に記載が無い点は食い違いとして残す。

主張: `外部連携/scenario_list.md:98,205` は UEX-01 の「もとのシナリオ」を「—」とし、この4系統だけを扱う `SCN-*` は無いとする。
実際: `scenario_test/scenario/SCN-EXTERNAL-WordPress最新記事-001_WordPressの公開投稿を取得しECトップの最新記事へ反映する.md:2-5` に「WordPressの公開投稿を取得しECトップの最新記事へ反映する」既存シナリオがある。
判定: 事実の誤り
修正案: UEX-01の「もとのシナリオ」に当該IDを記し、「既存のものは無い」という説明を訂正する。
