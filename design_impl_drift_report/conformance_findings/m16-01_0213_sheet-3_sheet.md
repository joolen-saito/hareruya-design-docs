■管理-M16-01 バナー設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）トップバナー管理の入口・保存・削除エンドポイントは /{admin_route}/banner/top、/{admin_route}/banner/top/{html_class}、/{admin_route}/banner/top/delete、/{admin_route}/banner/top/delete/{html_class} とする。
　実装ルートは /%eccube_admin_route%/data/top_banner、/%eccube_admin_route%/data/top_banner/{base_info_digit}、/%eccube_admin_route%/data/top_banner/delete、/%eccube_admin_route%/data/top_banner/{base_info_digit}/delete。設計の /banner/top 系とはパスが異なる。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-3:950,1031 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/TopBannerController.php:52）

■管理-M16-01 バナー設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画像一覧・アップロード・削除対象のストレージプレフィックスは、全体では banner/、店舗絞り込みでは banner/{html_class}/ とする。
　一覧は banner/top/ または banner/top/{shopDigit}/、アップロードは banner/top または banner/top/{shopDigit}、削除許可プレフィックスは banner/top/。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-3:948,957,961 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Data/TopBannerFileListAction.php:24）

■管理-M16-01 バナー設定
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）バナー設定送信前に eccube.setModeAndSubmitBanner が hareruyaec_banner_sort_no_* を走査し、空欄と数値重複を alert で拒否してから hareruyaec_banner を submit する。
　トップバナー画面にはアップロード未選択のクライアント検査と URL コピー処理のみがあり、並び順の alert 検査はない。並び順の空欄・重複は TopBannerType の POST_SUBMIT でフォームエラーとして検査される。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-3:953 ／ 実装: 不在（探索範囲: src/Eccube/Resource/template/admin/Data/top_banner.twig, src/Eccube/Resource/template/admin/Event/banner.twig, src/Eccube/Resource/locale/messages.ja.yaml, html/template/default/assets/hareruya/js; 検索語: setModeAndSubmitBanner, hareruyaec_banner, alert_sort_no, sort_no_duplicate, sort_no_required））

■管理-M16-01 バナー設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）遷移時にフラッシュメッセージや検索条件セッションは用いず、リダイレクト先は URL とハッシュのみで決まる。
　アップロード成功で addSuccess('admin.common.upload_complete')、バナー保存成功で addSuccess('admin.common.save_complete')、削除成功で addSuccess('admin.common.delete_complete')、削除失敗で addError を呼ぶ。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-3:1004 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/TopBannerController.php:119）

■管理-M16-01 バナー設定
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）リンク先URLは最大255文字に加えて、実装の Regex 制約に従う文字種検証を行う。
　link_{id} フィールドは required=false、Length(max=eccube_stext_len) のみで、Regex 制約は付与されていない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-3:975,996 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TopBannerType.php:92）

■管理-M16-01 バナー設定
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）CSS・レイアウトとして .bannerInput input { width: 95%; } を追加し、Bootstrap 横型レイアウトをバナー設定フォームに適用する。
　Bootstrap 横型フォームテーマは適用されているが、.bannerInput input { width: 95%; } は存在せず、独自CSSは .top-banner-table / .top-banner-upload-table / .top-banner-filter 系のみ。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-3:953 ／ 実装: 不在（探索範囲: src/Eccube/Resource/template/admin/Data/top_banner.twig, src/Eccube/Resource/template/admin/**/*.twig, src/Eccube/Resource/template/admin/**/*.css, html/template/default/assets; 検索語: bannerInput, width: 95%, top-banner-table））
