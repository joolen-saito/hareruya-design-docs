■管理-M14-06 カードセット管理(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）admin_cardset は GET/POST /{admin_route}/cardset、admin_cardset_page は GET/POST /{admin_route}/cardset/{page_no} とし、ページ送りや表示件数・並び順変更時の URL として使う。画像ダウンロード(言語別)は POST /{admin_route}/cardset/download_lang。
　一覧は route 名 admin_cardset_list / admin_cardset_list_paged、ページ付き URL は /cardset/page/{page_no}。言語別ダウンロードは admin_cardset_download_each_lang /cardset/download_each_lang。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-9:2641 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:49）

■管理-M14-06 カードセット管理(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示件数は pageCount、並び順は sortSelect クエリで受け取り、pageCount は mtb_page_max.name と一致する場合のみ、sortSelect は定義済み4文言と完全一致する場合のみセッションと一覧順へ反映する。
　実装は sort_key/sort_order と page_count を使用する。sort_key は未定義ならリポジトリ側で既定キーへフォールバックするが、sort_order は固定4文言の sortSelect として検証せずセッションへ保存し、QueryBuilder の addOrderBy に渡す。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-9:2586 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:55）

■管理-M14-06 カードセット管理(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）GET /cardset で page_no が URL に含まれず、resume が 1 でない場合、eccube.admin.cardset.page_no、eccube.admin.cardset.pageCount、eccube.admin.cardset.sortSelect を削除してから初期化する。保持時は一覧処理末尾で同3キーを保存する。
　index() は resume を参照せず、セッション削除処理もない。保存キーは eccube.admin.cardset.page_no、eccube.admin.cardset.search.page_count、eccube.admin.cardset.sort、eccube.admin.cardset.order。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-9:2585 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:52）

■管理-M14-06 カードセット管理(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除ボタン押下時は、動的に「このカードセットを削除してもよろしいですか？」のポップアップを表示し、その後「実行」を選択すると削除を実行する。
　実装は共通削除モーダルに data-message として admin.common.delete_modal__message を渡し、文言は「この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？」。実行ボタン文言は admin.common.delete（削除）。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-9:2509 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/app/template/admin/Cardset/index.twig:174）

■管理-M14-06 カードセット管理(一覧)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除時に子カード詳細が存在する場合、エラーメッセージを積み、Referer へリダイレクトする。
　ForeignKeyConstraintViolationException 時にエラーメッセージは積むが、catch 後は常に redirectToRoute('admin_cardset_list') を返す。Referer 参照はない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-9:2621 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:214）
