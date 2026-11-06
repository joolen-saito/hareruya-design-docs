主張: `matrix_UMG-03/prohibitions.tsv:8-9` のP7・P8は、個別入力・金額指定と「NM以外」の組を禁じている。
実際: `front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:99-123` は両方法で同じ登録処理を使い、`MainWindowViewModel.cs:1191-1192` は登録行の状態に画面で選んだ `_cardCondition` を設定する。NM以外の行も作れる。
判定: 禁則の誤り
修正案: P7・P8を外し、個別入力・金額指定でNM以外を選ぶ組をマトリクスに含める。

主張: `scenario_list.md:91` のUMG-03は、ネット買取で申込カードに含まれるカードの価格を「申込時買取価格」と断定し、`matrix_UMG-03/fl_table.tsv:7` のX2も価格の有無を分けていない。
実際: `hareruya-design-docs/functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:127` は「登録する状態の申込時買取価格があれば、その申込時買取価格。無ければ商品情報の買取価格」と定める。
判定: 事実の誤り
修正案: UMG-03の価格の記述を条件付きに直し、申込カードには含まれるが選んだ状態の申込時買取価格が無い場合をL3に加える。

主張: `matrix_UMG-04/README.md:14` は、商品・状態・言語・フォイルが同じ行なら枚数を合算するとしている。
実際: `hareruya-design-docs/functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:148-150` は、商品規格ID・商品名・言語・状態・フォイル区分に加え、**買取価格と買取カテゴリもすべて同じ**行だけをまとめる。
判定: 事実の誤り
修正案: 合算条件に買取価格と買取カテゴリを加え、どちらかが違う行は分けて送る期待値に直す。

主張: `matrix_UMG-04/fl_table.tsv:2-4` のA1〜A3と `exceptions.tsv:7` のE6には、申込カードの商品は取得できたが、言語・状態・フォイルが一致する規格が無い場合がない。
実際: `hareruya-design-docs/functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:114-119` は「行は作るが、商品名・商品コードなどは空のままにする。商品規格IDは0になる」と定める。`:157` はその0を査定明細として送る。
判定: 事実の欠落
修正案: この場合をUMG-04の例外に加え、空欄の行が査定完了時にどう登録されるか確認する。

主張: `scenario_list.md:62,64-66` の連携表は、商品情報・部門一覧・固定価格部門の取得をUMG-03だけに割り当て、入庫モードのUMG-09を挙げていない。
実際: `hareruya-design-docs/functions/pf-eccube3/o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md:23-26` は、入庫モードでもA06-06・A06-08・A06-11・A06-12を呼ぶと明記する。
判定: 事実の欠落
修正案: 該当する連携表の行にUMG-09を加え、入庫モードでの取得結果と失敗時の扱いを対応付ける。
