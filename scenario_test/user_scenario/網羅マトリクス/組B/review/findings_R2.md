主張: 在庫管理/steps.tsv は12のR197とR208の間などからR202・R231・R736を、13のR222とR232の間からR228を落としている。
実際: hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:115「2-2 リコメンドファイル作成」、同:132「2-7 発送ラベル発行」、同:367「17-1」、hareruya-design-docs/scenario_test/markdown/13_在庫管理_tobe.md:119「5-2 依頼確認」はいずれも＃付きの工程である。
判定: 事実の欠落
修正案: 工程抽出を直して4行をsteps.tsvに載せ、それぞれの扱いを判定する。

主張: 在庫管理/step_map.tsv:3 は12のR49「商品登録」にUZK-01を対応させ、入荷を起点とする文を引用している。
実際: hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:52「新弾の場合は商品登録・編集業務フローの#1～3を実施」だが、hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:16 はUZK-01について「登録済みの新商品（商品の登録は商品登録・編集で行う）が入荷する」とする。
判定: 偽の○
修正案: R49からUZK-01の対応を外す。

主張: 在庫管理/step_map.tsv:59-60・143-144 は12のR349と13のR182「商品の間引き」にUZK-06を対応させている。
実際: hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:180-184 と同/13_在庫管理_tobe.md:102-106 は「バックヤードからカードを間引く」「バックヤード管理表の更新」「Excelでリスト化」とする一方、hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:21 のUZK-06は間引きを在庫移動の起点に挙げるだけである。
判定: 偽の○
修正案: 両工程のUZK-06対応を外し、間引き作業自体の扱いを見直す。

主張: 在庫管理/step_map.tsv:63-64・146 は12のR374と13のR222「在庫移動依頼」にUZK-06を対応させている。
実際: hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:191-192 は依頼を「backlogに登録する」とし、hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:52 も「5-1のBacklogへの依頼・5-2の依頼確認はシステムの外」とする。
判定: 偽の○
修正案: 両工程のUZK-06対応を外し、Backlogへの依頼として「システムの外」にする。

主張: 在庫管理/step_map.tsv:56 は12のR334「カード到着対応」にUZK-07の「荷物が届き、解体・検品する」を対応させている。
実際: hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:173-174 のR334は、到着後「インポート依頼を行うために」「backlogにチケット起票する」工程である。hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:96 はBacklogのチケット起票を「システムの外」とする。
判定: 偽の○
修正案: R334のUZK-07対応を外し、工程を「システムの外」として扱う。

主張: 在庫管理/step_map.tsv:100 は12のR621「実施日に該当するファイルをダウンロード」にUZK-09の日曜の棚卸範囲決定を対応させている。
実際: hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:306-307 は当日のファイルのダウンロードと、前の日曜の範囲決定を別の作業として書く。hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:24 の引用は後者の起点だけである。
判定: 偽の○
修正案: R621のUZK-09対応を外し、ファイルのダウンロードを通す根拠がある場合だけ対応させる。

主張: 在庫管理/factors.tsv:97-98 のD7-2・D7-3は「差し戻しを登録し、出庫元が承認」するとし、cond_map.tsv:99-100 はUZK-07の不足・過剰の行で通るとしている。
実際: hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:123 は現行手順を「入庫確認で差分を仮登録→承認申請（入庫承認待ち）→入庫承認（入庫完了）」とし、同:144 は「差し戻し登録について」を「入庫承認待ち・入庫再確認に置き換わる前の記述」とする。
判定: 偽の○
修正案: 旧「差し戻し・出庫元承認」の値と対応を取り消し、現行の差分登録・入庫承認として値を記述し直す。

主張: 在庫管理/cond_map.tsv:114-115 はD13-1「API個別」とD13-2「Patch一括」の双方に、USM-03の「どれかで変える」という起点を対応させている。
実際: hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/scenario_list.md:117 は操作と反映方式をL3に列挙する一方、「マトリクスは作らない」とし、引用文はAPI個別・Patch一括のどちらを設定して結果を確かめるか示さない。
判定: 偽の○
修正案: D13-1・D13-2の対応を外し、方式ごとの操作と判定が特定できるまで抜けとして示す。

主張: 在庫管理/cond_map.tsv:116-117 はD14-1「入庫済み時」とD14-2「出庫承認済み時」のスマレジ反映をUZK-07・UZK-06で通るとしている。
実際: hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:21 はUZK-06について「このシナリオは登録から移動中までで、スマレジ側の在庫数は確かめない」と明記し、同:22 はUZK-07でのスマレジへの反映確認をUSM-03に委ねる。
判定: 偽の○
修正案: D14-1・D14-2のUZK対応を外し、反映時点を実際に確認する行だけに対応させる。

主張: 在庫管理/cond_map.tsv:136-137 はD24-1「100件未満」とD24-2「100件以上」をUZK-01で通るとしている。
実際: hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:16 は「100件以上のCSVでアラート」をL3に列挙するだけで、100件未満・以上のCSV件数を設定した行やL4を持たない。D24-1に引用した「承認済み」の結果にも件数は無い。
判定: 偽の○
修正案: 件数を設定して判定する行ができるまで、D24-1・D24-2の対応を外す。

主張: 価格管理/cond_map.tsv:20・22-23 はB6-2「支店・バックヤード在庫」、B7-2「ほかに必要なデータ」、B8-1「別途のバックヤード残数」をUPC-03・UPC-06で通るとしている。
実際: hareruya-design-docs/scenario_test/user_scenario/価格管理/scenario_list.md:18・21 はこれらをL3の選択肢として並べるだけである。hareruya-design-docs/scenario_test/coverage/scenario_pattern_matrix/価格管理/factors.tsv:18 は003のデータが「在庫区分=通販だけ」、同:21 は006の該当工程が「実施保留」と記し、同/matrix.tsv:18・20-21 では3値とも「抜け」である。
判定: 偽の○
修正案: データを用意して参照する根拠のない3対応を外し、抜けとして示す。

主張: 価格管理/cond_map.tsv:42 はB10-1「週刊販売数が2桁未満の商品を候補にする」をUPC-01で通るとしている。
実際: hareruya-design-docs/scenario_test/user_scenario/価格管理/scenario_list.md:16 は「セール品候補：週刊販売数が2桁に満たないものなど」とL3で説明するだけである。hareruya-design-docs/scenario_test/coverage/scenario_pattern_matrix/価格管理/matrix.tsv:24 も、この値を「抜け」としている。
判定: 偽の○
修正案: 週刊販売数が2桁未満の商品を実際に選ぶ行が無ければ、B10-1の対応を外す。

主張: 商品登録・編集/cond_map.tsv:80-81 はN2-1「カテゴリ登録の画面」とN2-2「カテゴリCSV登録」の双方をUPR-01で通るとしている。
実際: hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/scenario_list.md:18 は「画面で登録するか、カテゴリCSV登録で登録するかを水準にする」と将来の選択を記しつつ、「マトリクスは作らない」「カテゴリの登録の仕方は設計書が決めない」と明記している。どちらを選んだ行も無い。
判定: 偽の○
修正案: N2-1・N2-2の対応を外し、登録手段を指定した手順または行ができるまで抜けとして示す。
