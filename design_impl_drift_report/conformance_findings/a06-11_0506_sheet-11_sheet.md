■API-A06-11 部門一覧を取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）成功レスポンスは code=200、message="get sections success"、sections 配列を持つJSONオブジェクトとして返す。sections の各要素は section_id・name・code を持つ。
　実装は visible=true の部門を code ASC で取得し、各要素に section_id・name・code を詰めた配列を JsonResponse($payload) でそのまま返す。トップレベルの code、message、sections ラッパーは返していない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-11:3044 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/SectionController.php:40）
