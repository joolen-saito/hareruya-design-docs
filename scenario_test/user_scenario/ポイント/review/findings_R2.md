主張: `ポイント/matrix_UPT-03/prohibitions.tsv:7,10` の X6・X9 は、ポイント専用取引（区分6・7）と「付与も使用も0」の組を禁じている。
実際: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:130-139` は、増減量が0の取引を受け取り、「no point change in transaction」として何もせず終了する。
判定: 禁則の誤り
修正案: X6・X9を外し、増減量0のポイント専用取引では残高と履歴が変わらない行を残す。

主張: `ポイント/matrix_UPT-03/matrix.tsv:7` の T06 と `README.md:20` は、区分7の減算を「使用ポイント」を減らす取引としている。
実際: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:209-222` は「加算（区分6）／減算（区分7）のいずれも newPoint に符号付きの増減が入り（減算は負値）、spendPoint は0」とし、両値の差で増減量を決める。
判定: 事実の誤り
修正案: 区分7の入力と期待値を、負の増減量で減算される形に直す。

主張: `ポイント/scenario_list.md:73` の UPT-03 は、ポイント専用取引も含めて「マイページの履歴には注文番号の代わりにレシート番号が出る」としている。
実際: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:175-187` はポイント専用取引の履歴を受注に紐づけず保存する。`ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:99-109` は受注がある履歴にだけ番号を表示する。
判定: 事実の誤り
修正案: レシート番号の期待値を受注のある通常取引に限定し、ポイント専用取引では番号欄が空になることを記す。

主張: `ポイント/matrix_UPT-08/exceptions.tsv:3-5` の E2・E2b・E3 は、差し込み条件を A2「期限切れの付与がある」だけとしている。
実際: `ポイント/matrix_UPT-08/matrix.tsv:5` の T04 も A2 だが、同マトリクスの `README.md` の例5では失効額が0である。`ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:385-400` は、残高が期限内付与の累計を上回る会員だけを失効対象にする。
判定: 事実の誤り
修正案: E2・E2b・E3の差し込み先を、失効額が正になる行に絞る。

主張: `ポイント/matrix_UPT-08/exceptions.tsv:3` の E2 は、失効の保存に失敗しても「次の会員へ進む」としている。
実際: `ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:94-116` は、失敗で EntityManager が閉じた場合、「ポイント失効バッチを中断します」と記録してループを抜ける。
判定: 事実の誤り
修正案: 保存失敗後の期待値を、処理を続けられる場合とバッチを中断する場合に分ける。

主張: `ポイント/matrix_UPT-05/fl_table.tsv:11` の C4 は郵便振替と銀行振込を一水準にまとめ、`README.md:34` はポイント使用時の流れ・表示が同じとしている。
実際: `ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderUpdateProcessor.php:45-51` は銀行振込だけ購入直後を入金待ち、それ以外を注文受領にする。`ポイント/scenario_list.md:75` も両者の通る状態を分けている。`user_scenario/AUTHORING.md:121` は期待値が変わる種類を別水準にする決まりである。
判定: 事実の誤り
修正案: C4を郵便振替と銀行振込に分け、購入直後の受注状態を各行で確かめる。

主張: `ポイント/scenario_list.md:80` の UPT-10 は、区分6・7の取消・打消しも含め、通る状態を「受注：出荷完了→キャンセル」としている。
実際: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:25-34` は、ポイント専用取引の履歴は受注に紐付かないと明記する。`ポイント/matrix_UPT-10/fl_table.tsv:10-11` も、その入口を「受注を作らない」としている。
判定: 事実の誤り
修正案: 受注の状態遷移を通常取引に限定し、ポイント専用取引には受注の遷移がないと記す。

主張: `ポイント/scenario_list.md:31` の経路表は、ポイントグランターをイベント参加による「貯める」経路だけとしている。
実際: `user_scenario/スマレジ連携/scenario_list.md:136` の USM-23 は「付与ポイントが負（減算）」をバリエーションに持ち、会員残高が減少するとしている。`ec-cube-enterprise/src/Eccube/Service/App/PointGranter/LegacyRequestParser.php:82-86` も符号付きの増減を受け付ける。
判定: 事実の欠落
修正案: 経路表にポイントグランターからの減算を別行で加え、USM-23を参照する。
