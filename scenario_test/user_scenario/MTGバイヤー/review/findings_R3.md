主張: matrix_UMG-04/exceptions.tsv:14 の E13 と scenario_list.md:166 は、申込カードの規格が一致せず商品名が空の行を送った場合、受け付けられるか「判断待ち」とする。
実際: /home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:118 は「商品名・商品コードなどは空のまま」とする。/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateBuyOrderDetailDto.php:30 は商品名に `NotBlank` を課し、同 BuyOrderController.php:171 は検証失敗を HTTP 400 とする。
判定: 事実の誤り
修正案: E13 の期待値を商品名未入力による入力不正（HTTP 400）に確定する。
主張: scenario_list.md:92 と matrix_UMG-04/README.md:14・19 は、サプライ品があれば査定金額の合計に入るとする。
実際: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書_API_ネット買取管理.html:1502 は、サプライ・パック相当の明細について「単価が未設定のものは加算しない」とする。
判定: 事実の誤り
修正案: サプライ品の単価が設定済みの場合だけ合計に加えると明記し、未設定の場合を D 因子の水準に加える。
主張: matrix_UMG-04/fl_table.tsv:6 の B2 と scenario_list.md:91 は、ネット買取で査定表に足したカードの買取カテゴリを「まとめて買取」だけで扱う。
実際: /home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:123 は「行ごとに『選んで買取』『まとめて買取』を設定できる」とする。/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書_API_ネット買取管理.html:1468 も両カテゴリを受け付ける。
判定: 事実の欠落
修正案: 追加後の行を「選んで買取」に変更して査定完了する分岐を L3 に加える。
主張: matrix_UMG-04/exceptions.tsv:8 の E7 は、査定完了の確認で「いいえ」を選ぶ例外の差し込み条件を A1 に限定する。
実際: /home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:143-147 は、査定完了の操作全体について「『いいえ』の場合は何もしない」と定め、申込どおりの状態で査定する A1 を条件にしていない。
判定: 事実の欠落
修正案: E7 の差し込み条件から A1 を外し、ほかの査定方法でも成立する例外として扱う。
