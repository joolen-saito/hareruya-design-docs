主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/factors.tsv:21` は P-20「在庫移動準備業務（本店）」を「他業務」とする。
実際: `hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:87` は「13 在庫移動準備業務（本店）（新規追加） | UZK-06」と明記する。同じ対応表の `step_map.tsv:146` も工程 R210 を UZK-06 に対応させている。
判定: 偽の対象外
修正案: P-20を対象に戻し、UZK-06との対応を示す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/価格管理/factors.tsv:32` は D2-3「セール中の買取価格を変更できるか」を「判断待ち」とする。
実際: `hareruya-design-docs/scenario_test/user_scenario/価格管理/scenario_list.md:75` は「基準価格・買取価格は更新し、販売価格は変えず、アラートを出す」と決めている。`matrix_UPC-05/fl_table.tsv:3` も買取価格を更新する側を「確定」とする。
判定: 偽の対象外
修正案: D2-3を「買取価格を更新する」対象値に直し、UPC-05の該当行との対応を判定する。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/価格管理/step_map.tsv:9` は R51「セールバナー差し替え」に UEX-04 の○を付ける。
実際: `hareruya-design-docs/scenario_test/user_scenario/価格管理/scenario_list.md:93` は「1-5がこの画面かどうかの対応づけは、判断待ち」とする。`外部連携/scenario_list.md:115` も UEX-04 がセールバナーの差し替えかは判断待ちと明記する。
判定: 偽の○
修正案: R51からUEX-04の対応を外す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/価格管理/cond_map.tsv:9-10` は B1-1「1〜2％程度」と B1-2「平均1割程度」の両方に UPC-01 の○を付ける。
実際: `hareruya-design-docs/scenario_test/user_scenario/価格管理/scenario_list.md:16` は二つの割引率を説明文で列挙するだけで、`matrix_UPC-01/fl_table.tsv:2-16` の水準に割引率はない。対応表自身も `factors.tsv:8` で既存シナリオの値引きは「20%で、どちらの率でもない」と記す。
判定: 偽の○
修正案: B1-1・B1-2のUPC-01対応を外し、両値を抜けとして示す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/step_map.tsv:78` は R466「数量修正」に UZK-07 の差分仮登録で○を付ける。
実際: `hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:230` の R466 は「差異がある場合は棄却を行い、再度現状に合わせた移動データの再登録を行う」。UZK-07 の引用は差分登録ボタンによる仮登録であり、棄却・再登録を通さない。
判定: 偽の○
修正案: R466のUZK-07対応を外し、棄却・再登録工程を抜けとして示す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/step_map.tsv:147` は tobe版 R217「成田倉庫着荷処理」に UZK-07 の差分仮登録で○を付ける。
実際: `hareruya-design-docs/scenario_test/markdown/13_在庫管理_tobe.md:117-118` は「差異がある場合は欠品登録を行い、処理を棄却する」「棄却後、欠品商品を除き在庫移動依頼を再作成する」とする。差分の仮登録はこの経路を通さない。
判定: 偽の○
修正案: R217のUZK-07対応を外し、欠品登録・棄却・再作成を抜けとして示す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/cond_map.tsv:104` は D9-1「在庫編集の親区分＝入庫」に UZK-01 の○を付ける。
実際: `hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:16` は UZK-01 を「在庫変更CSVで在庫を入れて承認する」シナリオとする。引用された承認結果は、在庫編集画面で親区分「入庫」を選ぶ操作を示さない。
判定: 偽の○
修正案: D9-1からUZK-01の対応を外す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/cond_map.tsv:123-124` は D18-2「在庫検索一覧からの在庫リコメンドCSV出力」に UCY-20・UZK-06 の○を付ける。
実際: `hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:133` は「在庫リコメンドCSV出力」を在庫検索一覧の出力ボタンとする。一方、`業務周期/scenario_list.md:296` の UCY-20 は週次のリコメンド出力、`在庫管理/scenario_list.md:21` の UZK-06 はリコメンドを在庫移動の起点として記すだけで、そのボタンの操作を示さない。
判定: 偽の○
修正案: D18-2の両対応を外し、在庫検索一覧からの出力を抜けとして示す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/cond_map.tsv:143-147` は廃棄区分 D26-1〜D26-5 の五値すべてに UZK-15 の○を付ける。
実際: `hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:30` は「廃棄(破損)・廃棄(他事業移動)・廃棄(イベント商品)・廃棄(その他)・廃棄(欠品)」をL3欄に列挙するだけで、各値を設定する行や結果の判定は示さない。`hareruya-design-docs/scenario_test/coverage/scenario_pattern_matrix/README.md:33` の対応基準は、その値を設定するか結果を判定するときだけ○を付けるとしている。
判定: 偽の○
修正案: D26-1〜D26-5のUZK-15対応を外し、通した値を確認できないものは抜けとして示す。
