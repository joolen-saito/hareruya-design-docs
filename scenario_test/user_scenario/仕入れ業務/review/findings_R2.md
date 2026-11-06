主張: `matrix_USH-03/prohibitions.tsv:2-4` のX1〜X3はサプライ品と全価格帯を禁則にし、`matrix.md:13-23` の11行にはサプライ品がない。
実際: `excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:8439` はピッキング区分に「サプライ」を含める。`ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:105-107` もサプライ品を「サプライ」として出力する。
判定: 事実の欠落
修正案: 価格帯に「サプライ品では適用外」の水準を設け、サプライ品を含む正常行を生成する。

主張: `matrix_USH-03/prohibitions.tsv:5-6` のX4・X5は本店バックヤードのD2・D3だけを禁じ、`matrix.md:15,18,21` には閾値未設定の同店舗を「閾値1未満」D1として残す。
実際: `ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:114-118` は閾値が空なら価格区分を空で返す。閾値1がない店舗では「閾値1未満」も成立しない。
判定: 禁則の誤り
修正案: 閾値未設定を独立した水準にし、本店バックヤードをD1として扱う行をなくす。

主張: `scenario_list.md:18` のUSH-03は、入庫先店舗を限定せず「区分の中は棚番号の順に並び」とする。
実際: `excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:8472` は「支店の場合は棚番のソートは行わない」とする。`ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:242-243,283-287` も本店だけ棚番順にする。
判定: 事実の誤り
修正案: 棚番号順に並ぶのは本店の場合だけと明記する。

主張: `scenario_list.md:18,28` はUSH-03を業務フロー12の「2-17〜2-18」に対応させる。
実際: `scenario_test/markdown/12_在庫管理.md:159-165` の2-17は「振替」と「フロア間移動」で、2-18が「統合仕入れ」での棚戻しである。USH-03には2-17の操作がない。
判定: 事実の誤り
修正案: USH-03の対応範囲を12の2-18に直す。
