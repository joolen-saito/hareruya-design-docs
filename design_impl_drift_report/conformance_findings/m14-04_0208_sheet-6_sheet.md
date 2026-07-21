■管理-M14-04 カード詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）カード詳細の外部ルートは GET /{admin_route}/card/new、POST /{admin_route}/card、GET/POST /{admin_route}/card/{id}、DELETE /{admin_route}/card/{id} として提供する。
　実装は admin_card_new が GET/POST /card/new、admin_card_edit が GET/POST /card/{id}/edit、admin_card_delete が DELETE /card/{id}/delete。admin_card_create / admin_card_update および設計通りの POST /card、GET/POST /card/{id}、DELETE /card/{id} は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-6:2105 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:192）

■管理-M14-04 カード詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画面タイトルは「カード管理」、サブタイトルは「カード詳細」と表示する。
　edit.twig は title に admin.product.card_detail、sub_title に admin.product.card_management を設定し、default_frame.twig は title をページ見出し、sub_title を副題として描画する。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-6:2023 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/edit.twig:5）

■管理-M14-04 カード詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）詳細情報が商品と紐づく場合、「詳細情報を追加」ボタンを非表示にする。
　既存詳細行の削除可否は noDeletableCardDetailIds により制御されるが、「詳細情報を追加」ボタンは条件分岐なしで常に描画される。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-6:1842 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/edit.twig:199）

■管理-M14-04 カード詳細(登録・編集・削除)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）レギュレーション追加時、同じフォーマットを選択した場合はアラートを表示し、選択状態を解除する。
　edit.twig のJSは行追加、削除、select2 初期化のみで、フォーマット重複検知・アラート・選択解除処理が存在しない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-6:2023 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/edit.twig:38-102, /home/y-saito/Developments/ec-cube-enterprise/html, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin; 検索語: card-detail.js, alert, 重複, duplicate, add-format, format））

■管理-M14-04 カード詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）カード削除時は確認ポップアップに「このカードを削除してもよろしいですか？」を表示し、「実行」で削除する。
　削除リンクは admin.common.delete_modal__message を使い、文言は「この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？」。実行ボタンのラベルは admin.common.delete（削除）。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-6:1921 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/edit.twig:219; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/delete_modal.twig:21; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1754）

■管理-M14-04 カード詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）カード削除後、カード一覧へ遷移し「削除が完了しました。」を表示する。
　削除成功時は admin.common.delete_complete を addSuccess し、翻訳値は「削除しました」。一覧へのリダイレクト自体は実装済み。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-6:1900 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:300; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1561）

■管理-M14-04 カード詳細(登録・編集・削除)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）カード登録・更新・削除後、対象カードIDを支店システムへHTTP通知し、通知失敗時はエラーログへ保存する。
　CardController の保存処理は persist/flush/commit/addSuccess/redirect、削除処理は remove/flush/addSuccess/redirect のみで、支店通知サービスの注入・呼び出し・失敗時ログ保存がない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-6:2031 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventSubscriber, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler; 検索語: 支店, branch, Smaregi, notify, cardIds, MtbCard））
