■管理-M14-10 フォーマット詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除入口は DELETE /{admin_route}/format/{formatId}/delete で、formatId は 1 以上の整数（^[1-9][0-9]*$）とする。
　admin_format_delete は DELETE /%eccube_admin_route%/product/format/{id}/delete、requirements は id=\d+。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-14:3868,3952 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:130）

■管理-M14-10 フォーマット詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォーマット一覧は並び順昇順、次にID昇順で全件取得して表示する。
　一覧取得は findBy([], ['rank' => 'ASC']) のみ。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-14:3875 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:45）

■管理-M14-10 フォーマット詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）登録・更新成功時は admin.register.complete、削除成功時は admin.delete.complete、バリデーション失敗時は admin.register.failed を表示する。
　登録・更新成功時は admin.common.save_complete、削除成功時は admin.common.delete_complete。フォーム不正時は addError せず同テンプレートを返す。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-14:3881,3884,3906,3927 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:63）

■管理-M14-10 フォーマット詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）大会・デッキ・アーキタイプのいずれかが紐付く状態で削除した場合、削除せず admin.format.error.delete.event を表示し Referer へリダイレクトする。
　関連データ種別ごとに admin.product.format.error.delete.registered_event/deck/archetype を表示し、admin_format_list へリダイレクトする。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-14:3886,3897,3906,3922,3927 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:140）

■管理-M14-10 フォーマット詳細(登録・編集・削除)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）フォーマット削除時、当該フォーマットの dtb_card_format を事前にすべて削除してからフォーマット本体を削除する。
　削除処理は MtbFormat の remove/flush のみ。MtbFormat->CardFormats は cascade remove なし、DtbCardFormat->Format の JoinColumn も onDelete なし。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-14:3886,3900,3910 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Format, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbFormat.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCardFormat.php, /home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations; キーワード: DtbCardFormat, CardFormats, dtb_card_format, restriction_id, remove($CardFormat), onDelete））

■管理-M14-10 フォーマット詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォーマット名(日/英)は1〜64文字、コードは1〜10文字、並び順は1〜10000、ルール説明(日/英)は65535文字までをSymfony制約で検証する。
　nameJp は NotBlank のみ、nameEn は NotBlank+Regex のみ、code は Regex のみ、rank は NotBlank+Type のみ、RuleJp/RuleEn は required=false のみ。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-14:3762,3763,3764,3765,3781,3782,3894,3916 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:56）

■管理-M14-10 フォーマット詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除押下時は「{フォーマット名(日)}を削除してもよろしいですか？」、詳細設計では admin.confirm.delete にフォーマット表示名を渡した確認を表示する。
　削除モーダルの data-message は admin.common.delete_modal__message。翻訳文は「この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？」。edit.twig:287 も同じ共通メッセージを使用する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-14:3791,3871 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/app/template/admin/Format/format_list.twig:63）

■管理-M14-10 フォーマット詳細(登録・編集・削除)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「イベントに表示」を選択して登録すると、フロントのイベント一覧で選択したフォーマットのイベントのみ表示し、選択したフォーマットのみ検索可能にする。
　is_shown_in_event 列・管理フォーム項目は存在するが、イベント用フォーマット取得はイベント紐付きのみで判定し is_shown_in_event を条件にしていない。イベントトップの簡易フィルタも固定文言/固定値で、検索処理は渡された format id で絞るだけ。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0208_基本設計仕様書(カード管理).html#sheet-14:3689,3726,3727,3728,3729,3779 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbFormatRepository.php:122）
