■管理-M06-01 買取一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSVダウンロードをダウンロードという名称に変更し、以下の内容をダウンロード可能とする。識別ID:3 のラベルは「ダウンロード」。
　一覧上部のドロップダウン表示名が「CSVダウンロード」のまま実装されている。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-4:1224 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:182）

■管理-M06-01 買取一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索後のみ結果ボックスが描画され、件数見出し・表示件数ドロップダウン・CSVダウンロードドロップダウン・チェック付きテーブル・ページャを表示する。テーブル見出しは査定ID、申込者、買取金額、買取店舗、査定担当者、最終更新者、ステータス。
　結果テーブル全体を `{% for OtcBuyOrder in pagination %}` で囲み、さらに tbody 内でも同じ pagination をループしているため、検索結果がN件あると同一のチェック付きテーブルがN回描画される。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-4:1302 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:193）
