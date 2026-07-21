■バッチ-B08-06 スマレジ使用ポイント連携
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）スマレジ使用ポイント連携を実行する（ smaregi:batch updatePoint <受注ID> ）
　実装コマンド名は `eccube:smaregi:update-point`。購入完了処理からの別プロセス呼び出しも `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:605` で `eccube:smaregi:update-point` を実行している。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-8:1706,1710 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:26）

■バッチ-B08-06 スマレジ使用ポイント連携
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）スマレジ連携ポイント増減APIに「使用ポイント」を送信し、ポイント減算処理を行う。
　`SmaregiUpdatePointAction` は `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:54` で `postSmaregiPoint($player->getSmaregiId(), -$suspendPoint, false)` を呼ぶが、呼び先は TODO コメント付きの固定成功レスポンスを返すだけで、スマレジAPIへ通信していない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-8:1646-1647,1711,1717 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:31）

■バッチ-B08-06 スマレジ使用ポイント連携
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力はコマンド名と受注ID。受注IDが不正なら何もせず終了する。
　受注ID未入力時は成功終了するが、数値でない場合は `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:53-56` でエラーを出力し `Command::FAILURE` を返す。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-8:1711,1717,1733 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:47）

■バッチ-B08-06 スマレジ使用ポイント連携
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）購入完了処理や購入完了再処理から別プロセスとして呼び出される。
　通常の購入完了処理では `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:602-606` に別プロセス起動がある。一方、購入完了再処理に相当する管理受注更新系では `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:627-630` と `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:798-801` に発生ポイント連携はあるが、使用ポイント連携バッチの別プロセス起動はない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-8:1685 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: SmaregiUpdatePoint, update-point, updatePoint, smaregi:batch, eccube:smaregi:update-point, Process::fromShellCommandline, 再処理, reprocess））

■バッチ-B08-06 スマレジ使用ポイント連携
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）失敗時はエラー状態を残し、スマレジEC受注連携エラー再連携バッチで再試行できる。
　失敗時のエラー保存は `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:57-60` と `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:75-78` にある。`smaregi_error_flg = 1` の受注取得メソッドは `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:877-885` にあるが、このメソッドを呼び出すコマンド/サービスは見つからない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-8:1714,1730 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: getSmaregiErrorOrder, point_error_message, smaregi_error_flg, エラー再連携, 再試行, retry, SmaregiUpdatePointAction））
