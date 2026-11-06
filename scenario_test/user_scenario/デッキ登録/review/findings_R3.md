主張: `scenario_list.md:80` は、0306 の設計書が会員の新規提出時のデッキ公開状態を書いていないとしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3190-3191` の「大会デッキ登録編集」には「公開設定(非公開)、デッキタイプ(イベント)を設定して保存する」と明記されている。
判定: 事実の誤り
修正案: 「公開状態が設計書から分からない」という食い違いを削除し、新規提出時の非公開設定の根拠をこのシートに直す。

主張: `matrix_UDK-02/exceptions.tsv:6` の EX5 は、登録画面を開けない条件に締切超過・登録終了・デッキ登録なしを挙げるが、イベント終了を扱っていない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3007-3011` は「以下のいずれかに該当する場合は表示しない」とし、その一つに「ステータスが『イベント終了』」を挙げている。
判定: 事実の欠落
修正案: EX5 にイベント終了によって登録画面へ進めない場合を加える。

主張: `scenario_list.md:74` と `matrix_UDK-01/exceptions.tsv:12` の EX11 は、CSV の枚数違反による登録中止を「表示かつデッキリスト公開」の行に限っている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1761,1767` は「エラーがあれば登録を中止」「カード枚数が…最大数を超えるか最小数に満たない場合はエラー」とし、公開状態による限定を書いていない。一方、新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:289-315` は表示かつデッキリスト公開のときだけ枚数を検証する。
判定: 事実の欠落
修正案: 非公開の CSV 行でも枚数違反を確認対象に加え、設計書と新実装の検証条件の差を食い違いとして記録する。
