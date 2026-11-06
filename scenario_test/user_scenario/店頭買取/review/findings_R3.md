主張: `matrix_UKA-01/exceptions.tsv:21` のE20は差し込み元の条件が空欄で、`matrix.md:49` は中断・再開を通らないT01に差し込む。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html:1131` は「査定中断の受注を一覧で指定したとき、保管したデータを端末へ取り寄せ、査定表へ復元する」とする。T01にはその前提がない。
判定: 事実の欠落
修正案: E20の差し込み条件に中断済みの受注を再開する前提を明記し、その条件を満たすテスト行に割り当てる。

主張: `matrix_UKA-01/exceptions.tsv:11` のE10は中断時の保管・状態更新が成功する場合だけを扱い、失敗時の分岐がない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html:1131` は「保管または状態の更新に失敗したとき」「『はい』の場合は移動する。『いいえ』の場合は元の画面にとどまる」と定める。
判定: 事実の欠落
修正案: 中断時の保管または状態更新が失敗した場合をL3例外に加え、確認への回答ごとの結果を記す。

主張: `scenario_list.md:23` のUKA-06は、買取価格0円の商品を「買取商品情報のCSVにも在庫移動にも載らない扱い」と断定する。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html:1252-1254` はCSV対象を「チェック済みの買取情報に紐づく商品」「キャンセル済みでないもの」とし、価格0円を除外しない。新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:503-508` のCSV抽出にも価格による除外条件はない。
判定: 事実の誤り
修正案: 「CSVに載らない扱い」という断定を削除し、0円商品のCSV出力と在庫移動を分けて記載する。
