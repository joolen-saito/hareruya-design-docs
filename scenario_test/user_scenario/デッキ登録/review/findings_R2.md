主張: `scenario_list.md:73` は「書式の誤りだけが保存を止める」とし、`matrix_UDK-01/exceptions.tsv:5` の枚数超過・不足の例外も画面入力（C1）だけに置いている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1761,1767` は、CSV取り込みでは「カード枚数が…最大数を超えるか最小数に満たない場合はエラー」とし、エラー時は「登録を中止」とする。新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:289-314,568-599` も、表示かつデッキリスト公開のCSV行で枚数違反があれば処理を中止する。
判定: 事実の誤り
修正案: 警告付きで保存できるとの結論を画面入力に限定し、CSV取り込みで枚数違反により登録が中止される例外を加える。

主張: `scenario_list.md:56` の UDK-04 の遷移は「空→登録済み／登録済み→空」だけで、使用済みの行を別の大会で上書きする遷移が無い。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:2421-2423` は、直近の大会設定を「行ごとに対応する入力値で上書きして保存する」とする。成果物自身も `scenario_list.md:70` で、5行すべて使用済みなら既存の行を上書きすると認めている。
判定: 事実の欠落
修正案: UDK-04 の遷移に「登録済み→登録済み（別の大会で上書き）」を加える。

主張: `matrix_UDK-02/exceptions.tsv:6` の EX5 は、登録締切超過などで登録できない例外の差し込み条件を「D1（選べるフォーマットが1つ）」に限定している。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3007-3011` は、登録ボタンを隠す条件をイベント終了・登録締切超過・登録終了・登録対象外とし、フォーマット数を条件にしていない。同ファイル `:3170-3171` は、複数フォーマットの場合も選択エリアを表示するとする。
判定: 事実の欠落
修正案: EX5 の差し込み条件から D1 の限定を外し、複数フォーマットの大会でも成立する条件として記す。
