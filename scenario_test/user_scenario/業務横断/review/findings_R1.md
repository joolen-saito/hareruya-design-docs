主張: `業務横断/scenario_list.md:6` は、入庫待ち・移動中・集計バッチ待ちを「通しの1本の中」に置くとしている。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:13` は「日をまたぎ、システムの状態が何かを待つもの…は別の1本にする」と定める。  
判定: 切り方の誤り  
修正案: 状態を待つ前後でL2を分け、区間間の引き継ぎをつなぎ目として記録する。

主張: `業務横断/scenario_list.md:17-43` はシナリオ一覧から区間表へ進み、業務フローパターンまたは設計書の網羅を示す対応表が無い。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:42` はパターンごとの対応表を、同:109 は「業務フローが無いものは、設計書のシート（機能No）ごとに対応表を作る」と定める。  
判定: 事実の欠落  
修正案: 業務横断の対象区間について、正本のパターンまたは設計書のシート・機能NoとUXBの対応表を追加する。

主張: `業務横断/scenario_list.md:27` のUXB-07と `matrix_UXB-16/fl_table.tsv:6` のA5は、店頭PCを本店に限定している。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:107` は店内PCについて「支店の場合はシステムが『EC-CUBE（支店）』となる」とし、同:121-123 は支店で店頭注文番号を手動登録すると記す。  
判定: 事実の欠落  
修正案: 支店の店頭PC注文から番号登録・引き渡し・分析までをUXB-07とマトリクスに含める。

主張: `matrix_UXB-16/prohibitions.tsv:11-14` のX10〜X13は、店頭受取系と一部欠品の組を禁則にしている。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:10` は「ピック時の欠品は通常の通販業務と変わらない」と記す。スマレジ側の金額更新が未確定でも、欠品の発生自体は禁じられていない。  
判定: 禁則の誤り  
修正案: X10〜X13を禁則から外し、スマレジへの反映結果だけを判断待ちとして残す。

主張: `matrix_UXB-16/prohibitions.tsv:15` のX14は、店頭PCと翌日以降の最後の操作F2を一律に禁じている。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:124-133` は取り置き期間を「注文日を含めて1日間」とし、期限超過後のキャンセルと商品戻しを記す。翌日以降の期限切れキャンセルは起こりうる。  
判定: 禁則の誤り  
修正案: X14を引き渡し・返品の未確定経路に限定し、店頭PCの期限切れキャンセルとF2を許す。

主張: `業務横断/scenario_list.md:30,126-128` のUXB-10は、UKA-09で手動入庫した後もUKA-07で棚戻しするとしている。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭買取/scenario_list.md:26` のUKA-09は「戻しリストを出した買取は棚戻し済みになる」までを終点とし、同:24 のUKA-07は「棚戻し済みでない買取」を起点とする。  
判定: 事実の誤り  
修正案: UKA-09を通る場合はUKA-07を重ねず、自動入庫経路だけでUKA-07につなぐ。

主張: `業務横断/scenario_list.md:158-159` のUXB-13は、③価格変更の後に④「価格を変える前の受注と変えた後の受注を作る」としている。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/11_価格管理.md:82` は価格変更CSVのインポートを価格反映作業とする。提示された順序では旧価格の購入を作れない。  
判定: 事実の誤り  
修正案: 旧価格での購入を価格変更の前に置き、変更後に新価格で購入する順序に直す。

主張: `業務横断/scenario_list.md:169,234` のUXB-14・J42は、差分があれば一律に不足時の比例式で入庫先・出庫元の総原価を計算するとしている。  
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:3249-3270` は不足時の式とは別に、過剰時は出庫元在庫から差し引ける場合の式を定め、同:3275-3280 は差し引けない場合「計画時の総原価のまま」「引き当てできないので何もしない」とする。  
判定: 事実の誤り  
修正案: J42の期待値を差分なし・不足・過剰で差し引ける場合・差し引けない場合に分ける。

主張: `業務横断/scenario_list.md:35,180` のUXB-15は、通常の出荷後の残高確認にUTS-14をつないでいる。  
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:29` のUTS-14は「出荷実績の取り込みでスマレジ連携エラーが出る」ことを起点とする再連携シナリオである。  
判定: 事実の誤り  
修正案: 通常の残高確認は出荷区間の確認として扱い、UTS-14は連携エラーが起きた例外経路だけに参照する。
