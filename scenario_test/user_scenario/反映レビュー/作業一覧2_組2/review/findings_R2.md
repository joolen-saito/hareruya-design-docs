主張: `hareruya-design-docs/scenario_test/user_scenario/店頭買取/scenario_list.md:26`（UKA-09）は、在庫変更CSVで入庫した後、15時のバッチで在庫が二重に増えるかを判断待ちとしている。
実際: `ec-cube-enterprise/src/Eccube/Service/Admin/Stock/Util/StockEditApprovalLineItemApprover.php:115-116` は承認時に「登録時点の在庫 + 在庫増減数」を反映する。`ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAutoStockAction.php:45-64` は入庫待ちを対象に入庫処理を実行し、`ec-cube-enterprise/src/Eccube/Entity/ProductStock.php:325-332` は「変更前在庫数 + 在庫増減数」で加算する。同じ商品の買取数量をCSVで加算した場合、バッチでも加算される。
判定: 事実の誤り
修正案: 二重加算が起きる条件を明記し、その動作を意図した仕様として認めるかだけを判断待ちにする。

主張: `hareruya-design-docs/scenario_test/user_scenario/MTGバイヤー/scenario_list.md:179`（UMG-02）は、査定再開の受注を一覧から再選択したとき査定中に戻るかを判断待ちとしている。
実際: `hareruya-design-docs/excel_to_html/output/*0601*.html:1106` は「査定中断以外の受注を指定したとき」に査定中を送ると定める。`ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:52-55,95-102` は査定再開から査定中への更新を許し、別の査定者による更新を拒否する。
判定: 事実の誤り
修正案: 再選択時は同じ査定者なら査定中に戻り、別の査定者ならエラーになると記す。
