主張: `matrix_UTH-01/prohibitions.tsv:46` の禁則X45は、グッズA2とスタン落ちT2を禁じ、`scenario_list.md:72` はパターン9をT2の行に割り当てている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/10_商品登録・編集_tobe.md:139,149-150` は、対象を「(カードorグッズ)商品CSV出力」とし、変更後は「グッズの場合は、『グッズ商品CSV登録』」にアップロードすると書く。グッズのカテゴリ変更もパターン9の工程に含まれる。
判定: 禁則の誤り
修正案: X45を外し、グッズのスタン落ち行ではカテゴリ変更を通し、カード固有のリーガリティ変更だけを適用しない。

主張: `UTH-01_商品を登録しユニサーチ経由で会員が探して買いサンクスメールが届く.md:129` のT2手順は、商品CSVを直して取り込む操作だけでスタン落ちのカテゴリ変更を終えている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/10_商品登録・編集_tobe.md:143-150` は、先に「親カテゴリーを変更したカテゴリーCSVをアップロードし、商品カテゴリーの紐づけを修正する」、その後に商品CSVのカテゴリーを変更して取り込む工程を定めている。
判定: 事実の欠落
修正案: T2の変化手順に、カテゴリーCSVの更新と紐づけ修正を商品CSV取込より前に加える。

主張: `matrix_UTH-01/exceptions.tsv:19` のZ18は、D1×I3の行へ在庫承認前の「在庫あり」検索を差し込むとしている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:438-442` は在庫ありのフィード値を「stock >= 1」の店舗に限る。一方、当該L4の`:30-36` では手順4で在庫を承認し、手順7で初めてフィードを送る。指定の差し込み位置（`:168`、手順6〜11）には、在庫0のフィードが検索可能な時点がない。
判定: 事実の誤り
修正案: Z18は承認前に在庫0のフィードを送って反映を待ち、その時点で検索してから承認する手順に差し替える。

主張: `scenario_list.md:165` は、送信先の古いフィードが消えるか「コードを読んだ限りでは確かめられない」としている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:94-95,118-125` は `feed_hareruyamtgecc_`／`done_hareruyamtgecc_` を作り、削除には `feed_hareruyamtg_`／`done_hareruyamtg_` を渡す。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchSftpService.php:94-100` は `str_starts_with` で削除対象を判定するため、この実装が送った旧ファイル名は削除条件に一致しない。
判定: 事実の誤り
修正案: この実装が送った旧ファイルは当該削除処理では消えないと記録し、送信先に残るファイルの確認を期待値に加える。
