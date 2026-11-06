主張: `scenario_list.md:5` は「07は刷新後の業務なので、食い違うときは07を優先」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/06_店頭買取.md:10` は「※tobeではなくこちらを新フローとして記載しています。」と明記する。
判定: 事実の誤り
修正案: 06を新フローとして扱い、07との差は設計書の優先順位も踏まえて判断し直す。

主張: `scenario_list.md:59` はUKA-01の中断・再開を「査定中断→査定再開→査定中」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html:1106` は、査定再開を「査定中断の受注を指定し、確認に『はい』と答えたとき」、査定中を「査定中断以外の受注を指定したとき」に送るとする。再開直後に査定中へ戻す処理は記載されていない。
判定: 事実の誤り
修正案: 再開後の自動的な「査定再開→査定中」を遷移表から削除する。

主張: `scenario_list.md:23` はUKA-06のL3に「買取価格が0円」を含め、買取履歴の確認から在庫移動までを同じ経路に置く。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/06_店頭買取.md:54-55` は「在庫移動用の買取商品情報をCSV出力する」「買取価格が0円商品の場合は、買取情報として残らない」とする。
判定: 事実の誤り
修正案: 0円商品を通常のCSV確認・在庫移動経路から外し、記録が残らない場合の扱いを別のバリエーションとして明示する。

主張: `matrix_UKA-01/exceptions.tsv:10` のE9と`scenario_list.md:91` は、別の査定者が査定中の受注を開く際の文言が設計書に無いとする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1572` は「この受注は『（査定担当者名）』が査定中です。」を、査定担当者本人以外が査定中・査定再開へ更新しようとした場合のAPI応答文言として載せている。
判定: 事実の誤り
修正案: E9の期待値に設計済みの文言を記し、「設計書に無い」という記述を削除する。

主張: `matrix_UKA-01/fl_table.tsv:16-17` の買取品の中身は「登録済みの商品だけ」と「個別入力商品を含む」の2水準で、金額指定による追加が現れない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html:1110,1127` は、カードの登録・個別入力とは別に「『1円』『2円』『5円』『10円』で追加したとき」を定め、「個別入力や金額指定で追加した行の場合は」商品規格IDを送らないとする。
判定: 事実の欠落
修正案: 金額指定で追加する経路をL3に加え、個別入力と同じ扱いにまとめるなら、その範囲と期待する状態遷移を明示する。

主張: `scenario_list.md:39` は業務フロー06のパターン3をUKA-09だけに割り当てるが、`scenario_list.md:26` のUKA-09は入庫待ちから始まる。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/06_店頭買取.md:75-76` はパターン3の「3-1 買取」で「店頭買取の1-1～1-9までの処理を行う」とする。UKA-09単独ではこの工程を通らない。
判定: 事実の欠落
修正案: パターン3の対応に前段を担うUKA-01・必要に応じてUKA-04を加え、UKA-09が受け持つ後段を明確にする。
