主張: `matrix_UPM-01/prohibitions.tsv:4` の禁則 X3 は I6（代金引換）×K2（送料無料金額以上）を一律に除外する。`fl_table.tsv:32-33` では K2 と、ポイント一部使用で代金引換を選べる K3 の商品金額帯が重なる。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1757` は「お支払い方法の選択肢は、使用ポイントを差し引いた注文金額合計によって変わる」とする。K2 の金額帯でも、ポイント使用後に上限内なら代金引換を選べる。
判定: 禁則の誤り
修正案: K2 と K3 を重ならない条件に直し、ポイント一部使用で成立する代金引換の組を禁則 X3 から外す。

主張: `matrix_UPM-05/exceptions.tsv:3` の例外 Y02 は、英語サイトの T04（`matrix.md:16,29`）に差し込むのに、日本語の「お届け先登録数の上限を超えています。」を期待する。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1932` は英語ページの文言を「The maximum number of addresses registration is exceeded.」と定める。
判定: 事実の誤り
修正案: Y02 の T04 での期待文言を、設計書にある英語文言に直す。

主張: `scenario_list.md:31` の UPM-02 は、通常商品の基準価格変更とセール中商品の基準価格変更も L3 に含めながら、「通る状態」を一律に「セールフラグ：無効→有効」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:5723-5726` は基準価格変更CSVについて「セールフラグオフ時」は基準価格と販売価格を、「セールフラグオン時」は基準価格を変更すると書く。基準価格変更だけでは、無効→有効の遷移は起きない。
判定: 事実の誤り
修正案: 無効→有効をセール開始の L3 に限り、基準価格変更の L3 にはフラグが変わらないことを明記する。
