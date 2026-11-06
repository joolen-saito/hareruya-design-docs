主張: 店頭買取/scenario_list.md:24・109（UKA-07）は、戻しリストCSV出力後に同じ買取のPDFを出せるかを「判断待ち」とする。
実際: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_店頭買取管理機能.html:1263 は「戻しリストCSVまたはPDF出力を行った買取情報は、フラグを『棚戻し済み』とする」。新実装の /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php:93-138 はPDFにも使う検証で、状態・店舗権限・複数店舗だけを確認し、棚戻し済みフラグを拒否条件にしていない。
判定: 事実の誤り
修正案: CSV出力後も同じ買取のPDFを出せることを期待値にし、この判断待ちを外す。

主張: MTGバイヤー/scenario_list.md:92（UMG-04）は、1万円判定に使う査定金額合計は「お客様の承諾で売却しない明細が出ても更新されない」と無条件に書く。
実際: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:561-567 は、サプライ品削除時に合計を `getAcceptanceTotalPrice()` で上書きする。/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:729-745 は、その金額を「売却する」明細だけから算出する。
判定: 事実の誤り
修正案: 承諾後にサプライ品を削除すると判定用の合計も承諾金額で再計算される場合がある、と条件を明記する。

主張: 店頭買取/scenario_list.md:23（UKA-06）とスマレジ連携/scenario_list.md:117（USM-03）は、バーコード作成マクロ実行後のスマレジ在庫数が在庫移動で移した数と食い違わないことを期待値にする。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/07_店頭買取_tobe.md:46-47 は「Excelマクロ実行によって、スマレジにも在庫情報などが更新される」とだけ記し、更新する数量や在庫移動数との関係を定めていない。
判定: 根拠の捏造
修正案: マクロ実行後はスマレジの更新内容と前後の在庫数を記録し、移動数との一致を合格条件から外す。
