主張: `業務横断/matrix_UXB-16/matrix.tsv:23` の T22 は、店頭PC・支店の注文を「同じ日」に完了前キャンセルする行だが、`業務横断/scenario_list.md:29,119` はこの出口を期限切れキャンセルの UXB-09→UOR-08 に割り当てている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/05_店頭受取受注管理.md:124-126` は「お取り置き期間は、注文日を含めて1日間」→「期限超過チェック」→「キャンセル」とする。UOR-08 も `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/scenario_list.md:23` で「取り置き期限…を過ぎた」ことを起点にしており、T22 の同日経路を通れない。
判定: 禁則の誤り
修正案: T22 を期限切れの F3 に直すか、同日キャンセルを扱う別の根拠と区間を示す。

主張: `業務横断/scenario_list.md:27,37,190-192` は、複数受注の統合を UXB-17 の「店頭受取＋店頭PC」で通すが、店頭PCの受注だけを複数まとめる通しの流れがない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1545-1550` の「複数受注購入パターン」は「店頭PC購入を複数回行い、レジに来る」と「店頭受取の会員が店頭PC購入でついで買いをする」を別々に例示する。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/scenario_list.md:22` の UOR-07 にも「店頭PCの受注を複数まとめて受け取る」がある。
判定: 事実の欠落
修正案: 店頭PC受注だけを複数統合し、新受注の取引数・販売数・集計まで確かめる区間を UXB-07 または UXB-17 に加える。

主張: `業務横断/scenario_list.md:37,191,251` は UXB-17 の新受注の注文日を、店頭受取と店頭PCを含む「元の注文日のうち最も古い日」とし、設計書との食い違いに記録していない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1555` は「注文日に**店頭受取注文の注文日**を設定する。複数の店頭受取受注データが存在する場合は一番若いもの」と対象を限定する。一方、新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:157-164,221-230` は、店頭PCを含む突合済み受注すべてから最古の日時を選ぶ。
判定: 事実の誤り
修正案: 設計書と新実装の注文日の選び方の違いを記録し、UXB-17 の期待値の根拠を明確にする。

主張: `業務横断/scenario_list.md:190-192,251` の UXB-17／J48 は、統合後の明細・受注時原価・取引数を引き継ぐ値に挙げるが、スマレジ取引から新受注、さらに集計へ渡る金額の照合が抜けている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1630-1635` は取引の「小計」と、値引き・送料・手数料等を反映する「合計」を定める。新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:361-363` はその取引額を新受注に設定し、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:95-101` は新受注の小計等から売上を集計する。
判定: 事実の欠落
修正案: J48 にスマレジ取引額と統合後の新受注の小計・合計を加え、UXB-17 の集計額まで照合する。
