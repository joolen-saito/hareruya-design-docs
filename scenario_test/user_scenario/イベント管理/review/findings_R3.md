主張: `matrix_UEV-01/prohibitions.tsv:2` の禁則X1は「繰返日程追加 A2 × 後から日程だけ非公開 D2」を禁止している。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html:1882` は繰返登録時に親の公開状態を設定すると述べる一方、同ファイル`:1663` は「既存の日程の更新を行う」、`:1692` は公開状態を「単一選択」とする。繰返登録後の編集でこの組は成立する。
判定: 禁則の誤り
修正案: X1を外し、繰返登録後に日程を非公開へ編集する行を対象に含める。

主張: `matrix_UEV-01/fl_table.tsv:9-10` の因子Dは、親からの引継ぎと「親が公開・日程だけ非公開」しかなく、親が非公開で日程だけ公開の組を扱えない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html:1692` の「親イベントを引き継ぐ」は公開状態の初期値であり、項目は「単一選択」。新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ScheduleType.php:175` も日程の公開状態を選択項目としている。
判定: 事実の欠落
修正案: 親が非公開でも日程を公開に変更できる水準を加え、親と日程の表示条件を検証する。

主張: `matrix_UEV-01/README.md:13` は、バナーを設定した行でも、公開かつ開催日当日または開催前のイベントに限ってスライダーに出るとしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:1199` はバナー設定を「店舗と表示タイプが『スライド』で検索し表示する」とする。新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbBannerRepository.php:60` の検索条件にもイベントの公開状態・開催日の条件はない。バナー設定の画像は非公開イベントに関連づけた場合でも表示されうる。
判定: 事実の誤り
修正案: バナー設定の表示条件と、公開日程に連動するイベント編集のバナーURLの表示条件を分けて記す。

主張: `scenario_list.md:68` は、取引照会の「精査エラー（K02〜K99）」を一括して決済中の保留条件としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html:1051-1062` は保留するコードを「K02、K03、K04、K05、K06、K86、K88、K99」と列挙し、「上記以外のレスポンス」は申込を論理削除すると定める。
判定: 事実の誤り
修正案: 保留条件を列挙された8コードに限定して記す。

主張: `scenario_list.md:20` のUEV-05と `matrix_UEV-02/exceptions.tsv:3` のEX2は、決済画面を閉じた離脱だけを後続バッチにつなぐ。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html:1021-1022` は対象を「通信障害や決済画面からの離脱で申込完了画面へ遷移しなかった申込」とする。通信障害で戻れない経路が成果物にない。
判定: 事実の欠落
修正案: 通信障害で申込完了画面へ戻れなかった場合も、UEV-05につながる例外として追加する。
