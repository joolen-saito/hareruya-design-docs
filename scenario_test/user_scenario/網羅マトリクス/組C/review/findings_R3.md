主張: 店頭買取/cond_map.tsv:17 は、値ID B7-1「買取価格0円」を UKA-06 が通るとしている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭買取/scenario_list.md:23 は「買取価格が0円の商品は別の経路」とし、CSVに載るか、在庫移動の対象になるかを判断待ちとしている。引用された文は0円の商品を設定して通す手順ではない。
判定: 偽の○
修正案: B7-1 の UKA-06 対応を外し、判断待ちの扱いと整合させる。

主張: 店頭買取/factors.tsv:19-20 は B7-2 を「1円～250円未満」、B7-3 を「250円より高い」とし、250円ちょうどの値を載せていない。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/06_店頭買取.md:56-57 は「1円～250円以下」と「250円以上」と書き、250円が重複する。同 user_scenario/店頭買取/scenario_list.md:31 も「250円ちょうどが両方に入る」として判断待ちにしている。
判定: 事実の欠落
修正案: 250円ちょうどを判断待ちの値として明示し、現行の二値だけで価格帯が尽くされる表示を改める。

主張: イベント管理/cond_map.tsv:35 は、値ID D4-3「デッキ登録を終了する」がオンを UEV-02 の通過済みとしている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/イベント管理/matrix_UEV-02/exceptions.tsv:10 の EX8 は「デッキ登録の締切日時を過ぎてから申し込む」を条件とし、終了フラグは「または…チェックが入っている」という括弧書きにとどまる。終了フラグをオンに設定した個別の行はない。
判定: 偽の○
修正案: D4-3 の UEV-02 対応を外し、個別に通過が確認できない値として示す。

主張: デッキ登録/cond_map.tsv:21-24 は、値ID D3-2～D3-5 の四条件をすべて UDK-02 の通過済みとしている。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/デッキ登録/matrix_UDK-02/matrix.md:28 の EX5 は T04 の一行で「イベント終了」「締切超過」と、括弧書きの「デッキ登録を終了する」「デッキ登録あり」でない場合を列挙している。各条件を個別に設定・実行する行ではない。
判定: 偽の○
修正案: D3-2～D3-5 の○を外し、個別に通過した根拠がある値だけを対応付ける。
