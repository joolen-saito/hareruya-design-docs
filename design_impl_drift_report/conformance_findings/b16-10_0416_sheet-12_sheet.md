■バッチ-B16-10 ステージングデータベース保守バッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）B16-10 ステージングデータベース保守バッチは、定期的にステージング環境を最新の本番環境に近い状態に保つため、本番DBスナップショット取得、テンポラリDB作成・加工、ステージングDB再作成、S3同期、個人情報マスクを行う。
　B16-10相当のステージングデータベース保守バッチ入口が存在しない。Command一覧にはステージングDB保守用の AsCommand がなく、近傍候補はスマレジ在庫再連携、店頭受取スマレジ商品削除、S3デモアップロード、インストーラDB作成など別用途だった。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-12:1373 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource, /home/y-saito/Developments/ec-cube-enterprise/html））
