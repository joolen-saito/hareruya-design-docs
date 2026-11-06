主張: `scenario_list.md:104` は UZK-06 を「週次」の1行だけに置き、在庫リコメンドを根拠にしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:21` の UZK-06 の起点には「在庫リコメンド・成田への間引き・支店からの依頼・成田からの戻し・棚卸後の余剰・別部署の発送依頼」とある。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:197-199` も、売上に応じた成田からの戻しを記載している。
判定: 事実の欠落
修正案: UZK-06 の周期に、週次の在庫リコメンド以外の起点に対応する随時を加える。

主張: `scenario_list.md:151-152` の UCY-07・UCY-08 は、15時の後に入庫待ちになった買取が「翌日15:00まで入庫待ち」と断定している。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_*.html:1683` は店頭買取について「買取管理の権限があり、編集可能店舗であれば更新可能とする」とし、同 `0206_*.html:1761` はネット買取について「→手動入庫も可能」とする。15時後でも手動入庫すれば入庫済みになる。
判定: 事実の誤り
修正案: 「手動入庫しなければ翌日15時の自動入庫まで待つ」とし、15時後の手動入庫を分岐に含める。

主張: `scenario_list.md:153` の UCY-09 は、集荷のリミットを過ぎた受注が「出荷指示のまま」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:16` は購入直後を「入金済み／注文受領」とし、同 `:68` は「入金済み／注文受領→出荷指示」を別の遷移としている。リミット後に新たに入った注文が出荷指示まで進むとは限らない。
判定: 事実の誤り
修正案: リミット後の受注は当日中に出荷完了にならないと記し、通る状態は発送準備に進んだかどうかで分ける。
