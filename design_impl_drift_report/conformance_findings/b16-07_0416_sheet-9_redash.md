■バッチ-B16-07 Redash用データベース作成
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）バッチ処理用EC2インスタンスで、稼働データベースとは別の分析用Redash用データベースを用意し、本番データベースをスナップショットしてRedash用データベースを作成する。入力データ元はDB、出力先もDB。
　Redash用DB作成、RDS/DBスナップショット取得、稼働DBとは別DBの作成を行う Command/Service/Repository/設定/SQL は確認できない。src/Eccube/Command 配下の AsCommand 一覧にも Redash 用コマンドは存在しない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-9:1163,1165,1168,1174 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: Redash/redash, snapshot/スナップショット, RDS/rds, create database/CREATE DATABASE, db cluster, Step Functions, 分析用, Redash用））

■バッチ-B16-07 Redash用データベース作成
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）Redash用データベースから、スマレジ用接続IDとスマレジ用アクセストークンを削除する。
　スマレジAPI接続情報の利用処理は存在するが、Redash用DB上で接続ID/アクセストークンを削除またはマスクする処理は確認できない。例: SmaregiOtcDeleteMessageHandler は smaregiApiContractId と accessToken を使ってスマレジ商品削除APIを呼ぶ処理であり、Redash用DBの秘匿情報削除ではない（/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:85）。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-9:1169-1171 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: smaregi_contract_id, smaregi_access_token, スマレジ用接続ID, スマレジ用アクセストークン, access_token, contract_id, Redash/redash））

■バッチ-B16-07 Redash用データベース作成
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）Redash用データベースで、注文ステータスが「注文取消し」「発送済み」のスマレジ削除フラグをONに変更する。
　類似する店頭受取注文スマレジ商品削除バッチは存在し、CANCEL/DELIVERED/PASSED かつ smaregi_del_flg=false の本番受注を抽出し、スマレジ商品削除API成功後に Order.smaregi_del_flg をONにする。しかし、Redash用DBを対象に注文取消し/発送済みのみを一括更新する処理ではない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-9:1169,1172 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html。類似実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:32, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:862, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:863, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:135））

■バッチ-B16-07 Redash用データベース作成
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）Redash用データベース作成は、スケジュール起動（Step Functions）で毎日午前4時に実行する。
　Step Functions/毎日4時のコメントは SmaregiOtcDeleteCommand に存在するが、当該コマンド名は eccube:smaregi:otc:delete で、店頭受取注文スマレジ商品削除バッチである。Redash用データベース作成を毎日4時に起動するコマンド/設定は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-9:1173 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html。類似実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:37））
