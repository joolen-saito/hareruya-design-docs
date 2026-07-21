■バッチ-B02-02 入荷通知キャンセル
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは `product:batch deleteProductRequest` で実行する。コマンド名が一致しない場合は処理を行わずに終了する。
　Symfony Console コマンドは `eccube:cancel-product-request` として登録されている。`product:batch deleteProductRequest` の登録は探索範囲内に見つからない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-4:1042 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:34）

■バッチ-B02-02 入荷通知キャンセル
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）入荷通知リクエストデータに「商品ID」を追加する。
　DtbProductRequest は `product_class_id`、`player_id`、`create_date`、`deleted_at` のみを持ち、`product_id` または Product への関連を持たない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-4:996 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbProductRequest.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html））

■バッチ-B02-02 入荷通知キャンセル
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）未削除の入荷通知リクエストのうち、対応する商品規格が削除済み、または商品が存在しない・削除済みのものを対象に、削除日時を一括設定する。移行先の商品規格の削除相当は `dtb_product_class.visible`、商品の削除相当は商品が存在しない、または `dtb_product.product_status_id` で公開対象外であることを条件とする。
　`cancelRequestByProductStatus()` は `dtb_product_request.deleted_at IS NULL` を対象に、`product_class_id IN (SELECT pc.id FROM dtb_product_class pc JOIN dtb_product p ... WHERE pc.product_status_id IN (:hide, :abolished) OR p.product_status_id IN (:hide, :abolished))` で更新する。`pc.visible = false` と商品不存在は条件に含まれない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-4:1036 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:473）

■バッチ-B02-02 入荷通知キャンセル
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ログ・監査として、開始・完了のコンソール出力（日時付き）を行う。
　実装は処理前の開始出力を持たず、成功時は `入荷通知キャンセルが完了しました。（%d件）` のみを出力する。日時も出力しない。例外時のエラー出力は存在する。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-4:1072 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:47）
