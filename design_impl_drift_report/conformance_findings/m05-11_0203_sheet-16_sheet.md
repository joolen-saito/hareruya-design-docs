■管理-M05-11 【新規】受注情報履歴
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）【新規】受注情報履歴として、受注情報の履歴を確認でき、受注データ更新履歴の履歴データを表示し、対象会員の購入履歴を取得する。
　Admin/Order には履歴専用 Controller/Twig/route/翻訳キーがなく、近接実装は src/Eccube/Controller/Admin/Order/EditController.php:146-148 の /order/{id}/edit のみ。OrderRepository の購入履歴取得 QueryBuilder も Admin/Order からは呼び出されていない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-16:5480,5493,5555-5556,5654 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Order/*.php, src/Eccube/Resource/template/admin/Order/*.twig, src/Eccube/Form/Type/Admin/*Order*Type.php, src/Eccube/Resource/locale/messages*.yaml, app/config/eccube/packages/eccube_nav.yaml））

■管理-M05-11 【新規】受注情報履歴
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）履歴データ表示ではデータは編集不可、ボタンは非活性、リンクは非活性とする。明細部では欠品登録以外のボタンは非活性とする。
　edit.twig は POST 可能フォームで、OrderStatus、日付クリア、スマレジメモ、ショップメモ、商品リンク、削除、登録、戻る、メール作成などが有効。EditController は POST で persist/flush し保存完了フラッシュを積む。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-16:5558-5561,5574,5578-5597,5602-5605,5655-5658,5680,5682-5683 ／ 実装: src/Eccube/Resource/template/admin/Order/edit.twig:789,840,863,977,1102,1133,1788,1874; src/Eccube/Controller/Admin/Order/EditController.php:620）

■管理-M05-11 【新規】受注情報履歴
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）注文番号は、スマレジ受注の場合は（）内に EC 受注時の注文番号を表示し、店頭受取時の注文番号が複数存在する場合はカンマ区切りにしてリンクとし、リンク選択で受注詳細へ遷移する。店頭販売用整理番号は存在する場合のみリンク表示する。
　admin edit は Order.order_number と waitingNumber を括弧表示するだけ。waitingNumber は DtbWaitingNumberRepository から取得され、複数注文番号リスト、EC 受注時注文番号、受注詳細への href は描画されていない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-16:5569-5570 ／ 実装: src/Eccube/Resource/template/admin/Order/edit.twig:817; src/Eccube/Controller/Admin/Order/EditController.php:1037）

■管理-M05-11 【新規】受注情報履歴
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）受注商品情報のフレームは、特殊フレームの場合のみ表示する。
　受注商品サブ情報は言語、状態、Foil のみ表示される。frame_flg は商品側 Repository/Entity に存在するが、Admin/Order 編集・履歴表示では描画されない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-16:5674 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Order/EditController.php, src/Eccube/Resource/template/admin/Order/edit.twig; 関連表示は src/Eccube/Resource/template/admin/Order/edit.twig:1088））
