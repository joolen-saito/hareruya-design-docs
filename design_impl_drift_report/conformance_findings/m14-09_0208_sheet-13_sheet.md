■管理-M14-09 フォーマット一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォーマットマスタ（mtb_format）の一覧は、表示順を rank 昇順、同一 rank 内は id 昇順とする。
　一覧取得は $this->formatRepository->findBy([], ['rank' => 'ASC']) のみで、id 昇順の第二ソートキーが指定されていない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-13:3510 ／ 実装: src/Eccube/Controller/Admin/Card/FormatController.php:45）

■管理-M14-09 フォーマット一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォーマット名セルは「和名 / 英名」のテキストを編集 URL へのリンクとする。
　フォーマット名セルは {{ Format.nameJp }} / {{ Format.nameEn }} のプレーンテキストで、編集 URL への a 要素ではない。編集遷移は別の鉛筆アイコン app/template/admin/Format/format_list.twig:57-58 にのみ存在する。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-13:3518 ／ 実装: app/template/admin/Format/format_list.twig:49）

■管理-M14-09 フォーマット一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ページタイトルは「フォーマット管理」。サブタイトルは「フォーマット一覧」。
　title は admin.product.format_list（フォーマット一覧）、sub_title は admin.product.format_management（フォーマット管理）。翻訳値は src/Eccube/Resource/locale/messages.ja.yaml:3959-3960。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-13:3518 ／ 実装: app/template/admin/Format/format_list.twig:5）

■管理-M14-09 フォーマット一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除ルートは DELETE /{admin_route}/format/{formatId}/delete とする。
　admin_format_delete は #[Route('/%eccube_admin_route%/product/format/{id}/delete', ... methods: ['DELETE'])] で、/product/format/{id}/delete に実装されている。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-13:3610 ／ 実装: src/Eccube/Controller/Admin/Card/FormatController.php:130）

■管理-M14-09 フォーマット一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除が関連データにより拒否された場合、メッセージ admin.format.error.delete.event をフラッシュし、Referer へリダイレクトする。
　イベント・デッキ・アーキタイプごとに admin.product.format.error.delete.registered_event/deck/archetype を出し、いずれも redirectToRoute('admin_format_list') で一覧へ戻す。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-13:3530 ／ 実装: src/Eccube/Controller/Admin/Card/FormatController.php:142）

■管理-M14-09 フォーマット一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除成功時は当該フォーマットに紐づくカード別制限行（dtb_card_format）をすべて削除し、その後フォーマット行を削除する。
　delete() は $this->entityManager->remove($Format); $this->entityManager->flush(); のみを実行する。MtbFormat の CardFormats 関連は OneToMany mappedBy のみで cascade remove は付いていない（src/Eccube/Entity/Master/MtbFormat.php:405）。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-13:3530 ／ 実装: src/Eccube/Controller/Admin/Card/FormatController.php:158）

■管理-M14-09 フォーマット一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧テンプレートには javascript ブロックがなく、一覧表示専用のスクリプトは読み込まない。本一覧テンプレート単体ではモーダルを定義しない。
　format_list.twig は javascript ブロックを持ち、DeleteModal 表示時に href/message を差し替える専用スクリプトを定義している。また @admin/Format/delete_modal.twig を include している（app/template/admin/Format/format_list.twig:24）。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-13:3518 ／ 実装: app/template/admin/Format/format_list.twig:7）

■管理-M14-09 フォーマット一覧
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）admin/assets/css/format.css を読み込み、「新規登録」ボタンのパディングと、表セルの縦位置（middle）を揃える。
　format_list.twig に stylesheet/css ブロックや format.css の読み込みはない。該当 CSS ファイルも探索範囲内で確認できない。確認お願いします。（設計根拠: excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-13:3518 ／ 実装: 不在（探索範囲: app/template/admin/Format, src/Eccube/Resource/template/admin, html; 検索語: format.css, admin/assets/css/format.css, stylesheet））
