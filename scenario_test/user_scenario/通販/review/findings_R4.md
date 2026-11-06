主張: `通販/scenario_list.md:31-32` のUTS-16・17は、注文確定を起点に、後日の入金確認・通知を経て出荷までを1本にしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:13` は「入金待ち」を含め、日をまたいでシステムの状態が待つものを別の1本にすると定める。購入完了までの区間は同一覧のUTS-01・04にもある。
判定: 切り方の誤り
修正案: UTS-16・17は入金確認・入金通知を起点とし、注文確定までをUTS-01・04に置く。

主張: `通販/scenario_list.md:33` のUTS-18は、注文5日後の準キャンセル案内から1週間後のキャンセルまでを1本にしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:129-130` は「準キャンセルは受注の5日後」「キャンセルは受注1週間後」と別の日の処理を定め、`AUTHORING.md:13` は期限切れ・後日の処理を別シナリオにすると定める。
判定: 切り方の誤り
修正案: 5日後の案内と、入金がないまま迎える7日後の取消しを別のL2にする。

主張: `通販/matrix/prohibitions.tsv:39-42` のX43〜X46は、商品金額が一定額以上なら代金引換・コンビニ決済を選べないと禁じている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304*.html:1757` は「お支払い方法の選択肢は、使用ポイントを差し引いた注文金額合計によって変わる」とする。新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:495-513` も支払額に各方法の手数料を加えて上限判定する。開発環境の支払方法設定では、代金引換は手数料330円・上限29,999円、コンビニ決済は手数料0円・上限299,999円。商品金額がK2〜K4でも、一部ポイント利用後の支払額なら選べる組がある。
判定: 禁則の誤り
修正案: X43〜X46を商品金額だけの禁則から外し、ポイント・送料・手数料を反映した支払額で可否を表す。

主張: `通販/matrix/fl_table.tsv:40` のK1「送料無料金額より少ない」は、代金引換が選べる金額と選べない金額を同じ水準にまとめ、`matrix.md:20` などのS7行に使っている。
実際: 新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:495-513` は「支払額＋手数料」で上限を判定する。開発環境の支払方法設定で代金引換の手数料は330円、上限は29,999円なので、商品金額が30,000円未満というだけでは選択可否が決まらない。
判定: 事実の欠落
修正案: 代金引換の上限をまたぐ支払額を別水準または境界テストにし、選択可否の両側を確かめる。

主張: `通販/scenario_list.md:34` のUTS-19と `通販/matrix_UTS-19/fl_table.tsv:8` のB1は、受け取り後に返品を申し出ればキャンセル・返金へ進む形で、受付可否の分岐がない。
実際: 新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1441-1454` は「お客様のご都合…による返品・交換は一切お受けできません」、契約不適合等は「商品到着後8日以内」と案内し、9日以上経過した場合も対象外とする。`通販/matrix_UTS-19/README.md:22` もこの案内を確認しながら「受け付けるかの判断は書かない」としている。
判定: 事実の欠落
修正案: 返品を受け付ける条件をB1に明記し、受け付けない申し出をL3の分岐に入れる。

主張: `通販/matrix_UTS-19/matrix.md:23-25` の代金引換は、一部返品T11と受け取り拒否T12・13だけで、代金を受け取った後の全部返品がない。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:159-163` のクレジットカード以外の返金対応は、お客様に振込かポイント付与かを確認する。`通販/matrix_UTS-19/README.md:9` 自身も代金引換の行で両方を確かめるとするが、T12・13は代金未受領のため返金が発生しない。
判定: 事実の欠落
修正案: 代金引換で受け取り・支払い済みの注文を全部返品し、返金する行を追加する。

主張: `通販/scenario_list.md:143` と `通販/matrix_UTS-19/README.md:8` は、通販の返品をキャンセルで処理する根拠として設計書0203を挙げている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203*.html:2866` の記述は「スマレジで購入した商品を返品する場合はキャンセルで対応する」であり、通販で購入した商品の返品を定めていない。
判定: 事実の誤り
修正案: 0203を通販返品の根拠から外し、通販の返品手順は設計書に無いものとして記録する。

主張: `通販/matrix_UTS-02/exceptions.tsv:2` と `通販/matrix_UTS-19/exceptions.tsv:2` のE1は、差し込む元の条件がA1（カード決済）だけになっている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:150` は「決済の減額か請求のキャンセル」を分ける。`通販/matrix_UTS-02/README.md:16` も全部取消しは請求キャンセル、一部取消しは減額とするため、「減額ができない」例外はA1×C2で成立し、A1×C1では成立しない。
判定: 事実の誤り
修正案: 両E1の差し込み条件をA1×C2に限定する。
