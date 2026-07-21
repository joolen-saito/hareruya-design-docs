■管理-M04-35 棚卸在庫反映
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）棚卸在庫反映画面に、棚卸名、店舗（店舗名・在庫区分名）、商品数、計上済み商品数、差異あり商品数、備考、実行ボタン、詳細へ戻るボタンを表示する
　棚卸計画のEntity/Repositoryと翻訳見出しのみ存在する。棚卸在庫反映画面のController、Twig、Form、表示項目、実行/戻るボタンの実装は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-43:15620 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller, src/Eccube/Resource/template/admin, src/Eccube/Form, src/Eccube/Resource/locale/messages.ja.yaml, html。検索語: 棚卸在庫反映, 棚卸結果の在庫反映, admin_inventory_plan, InventoryPlan, DtbInventoryPlan, stockReflectioned, reflectingFlg））

■管理-M04-35 棚卸在庫反映
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）棚卸在庫反映の実行時に、指定店舗のみを処理対象にし、権限のない店舗では実行不可とし、在庫反映済み・商品数0・計上済み商品数0・商品数と計上済み商品数不一致・未確認の在庫差異ありをエラー条件にする
　DtbInventoryPlan::hasReflectedDetail() は存在するが、棚卸在庫反映の実行処理から呼び出すController/Serviceがない。店舗権限チェック、対象店舗制限、各エラー条件の判定実装は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-43:15589 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller, src/Eccube/Service, src/Eccube/Form, src/Eccube/Repository, src/Eccube/Resource/template/admin, html。検索語: 権限のない店舗, isEditableShop, stockDifferenceConfirmed, productRegisteredCount, productStockDiffCount, stockReflectionedDate, hasReflectedDetail, reflectingFlg, 棚卸計画））

■管理-M04-35 棚卸在庫反映
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）棚卸在庫反映の登録処理で、差異分をEC在庫へ反映し、在庫変動履歴に総原価・原価単価・在庫区分・在庫変動区分「棚卸結果の反映」・棚卸計画ID/名前の理由を登録し、プラス差異は仕入総価格0を設定し、在庫0から1以上になった商品は入荷通知し、完了後に棚卸計画編集画面へ遷移する
　StockHistoryEntityManager や入荷通知の共通部品は存在するが、棚卸計画から在庫差異を反映して履歴登録・計画更新・完了遷移まで行う棚卸在庫反映固有処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-43:15599 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller, src/Eccube/Service, src/Eccube/Service/EntityManager, src/Eccube/Repository, src/Eccube/Doctrine/EventSubscriber, src/Eccube/Resource/doctrine, html。検索語: 棚卸結果の反映, INVENTORY_PLAN, MtbStockHistorySourceType::INVENTORY_PLAN, StockHistoryEntityManager, RestockNotification, 入荷通知, setStockReflectionedDate, ProductStock::setStock））
