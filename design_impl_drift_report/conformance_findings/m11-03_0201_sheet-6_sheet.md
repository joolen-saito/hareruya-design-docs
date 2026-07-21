■管理-M11-03 権限制御
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）2-1."在庫管理"・"受注管理"・"店頭買取管理"・"イベント管理"のメニューに付随する機能のデータはメンバーに紐づいている編集可能店舗の店舗データのみ編集可能とする。2-4.集権権限を保持していない店舗の情報を参照した場合、画面表示するが更新処理時に権限エラーとし更新できないようにする。
　Member::isEditableShop による編集可能店舗判定は存在し、在庫・店頭買取・イベント系では使用されているが、受注管理の更新処理では TargetOrder の店舗に対する編集可能店舗チェックが見つからない。Order/EditController はフォーム妥当時に TargetOrder を persist する。確認お願いします。（設計根拠: excel_to_html/output/0201_基本設計仕様書(システム設定).html#sheet-6:1970,1973 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Order, src/Eccube/Form/Type/Admin/SearchOrderType.php, src/Eccube/Form/Type/Admin/OrderType.php, src/Eccube/Service/Admin/Order。反証語: isEditableShop, MemberBaseInfo, editableBaseInfos, AccessDeniedHttpException, approval_no_authority, 権限エラー）。参考: src/Eccube/Controller/Admin/Order/EditController.php:565,656）

■管理-M11-03 権限制御
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）権限管理画面は「権限」と「拒否URL」を行単位で入力し、「行追加」「削除」「登録」で一括保存する。権限は mtb_authority のセレクト、拒否URLは一行テキストとし、片方だけ入力された場合はフィールドエラーを表示する。
　現行画面は AuthorityMatrixType と PermissionAccessUrl を使った機能×権限のチェックボックス行列で、POST は authority[権限ID][権限URLID] と new_authority_name を受ける。権限セレクト＋拒否URLテキストの行フォーム、data-prototype による行追加、現在画面での片入力検証は使われていない。確認お願いします。（設計根拠: excel_to_html/output/0201_基本設計仕様書(システム設定).html#sheet-6:1985,2006,2009,2029,2031 ／ 実装: src/Eccube/Controller/Admin/Setting/System/AuthorityController.php:66, src/Eccube/Form/Type/Admin/AuthorityMatrixType.php:30, src/Eccube/Resource/template/admin/Setting/System/authority.twig:281,315,329,351。未使用の残存実装: src/Eccube/Form/Type/Admin/AuthorityRoleType.php:29, src/Eccube/Resource/template/admin/Setting/System/authority_prototype.twig:11）

■管理-M11-03 権限制御
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）保存処理では、画面表示時点で取得済みの既存権限ロール行をすべて EntityManager から削除し、送信中の権限＋拒否URLがともに非空の行だけを persist して flush する。登録済み行をすべて削除して送信した場合は権限ロール0件になる。
　AuthorityIndexAction は checkbox で送られた許可済み PermissionAccessUrl から desiredDeniedUrls を計算し、既存 deny_url のうち不要になったものだけ delete、足りない deny_url だけ save する。変更のない AuthorityRole は削除・再登録されず残る。確認お願いします。（設計根拠: excel_to_html/output/0201_基本設計仕様書(システム設定).html#sheet-6:2015,2033,2042 ／ 実装: src/Eccube/Service/Admin/Setting/System/AuthorityIndexAction.php:106,114,124,131,139; src/Eccube/Service/EntityManager/AuthorityRoleEntityManager.php:35,50）

■管理-M11-03 権限制御
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）表示初期化時に admin.setting.system.authority.index.initialize、保存完了時に admin.setting.system.authority.index.complete を発火し、プラグイン等がビルダや一覧を変更できる拡張点を提供する。
　EccubeEvents に ADMIN_SETTING_SYSTEM_AUTHORITY_INDEX_INITIALIZE / COMPLETE の定数はあるが、AuthorityController と AuthorityIndexAction から eventDispatcher->dispatch されていない。確認お願いします。（設計根拠: excel_to_html/output/0201_基本設計仕様書(システム設定).html#sheet-6:1993,2013,2015,2042 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Setting/System/AuthorityController.php, src/Eccube/Service/Admin/Setting/System/AuthorityIndexAction.php, src/Eccube/Event/EccubeEvents.php。反証語: ADMIN_SETTING_SYSTEM_AUTHORITY_INDEX, admin.setting.system.authority.index, eventDispatcher->dispatch）。定数のみ: src/Eccube/Event/EccubeEvents.php:367）

■管理-M11-03 権限制御
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）管理者向け成功メッセージ「権限設定を保存しました。」を積み、POST成功後は同一編集画面へリダイレクトして成功メッセージを表示する。
　保存成功時は addSuccess('admin.common.save_complete', 'admin') を積み、翻訳は「保存しました」。その後 admin_setting_system_authority へリダイレクトする。確認お願いします。（設計根拠: excel_to_html/output/0201_基本設計仕様書(システム設定).html#sheet-6:2015,2045 ／ 実装: src/Eccube/Controller/Admin/Setting/System/AuthorityController.php:85,91; src/Eccube/Resource/locale/messages.ja.yaml:1559）

■管理-M11-03 権限制御
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）管理画面の最初の controller 処理で、ログイン済み Member の権限ロールから拒否URLのフルパス配列を Twig グローバル AuthorityRoles として渡し、admin/nav.twig はその配列を使って第1階・第2階・第3階のナビ項目を非表示にする。
　TwigInitializeListener#setAdminGlobals は AuthorityRole を取得して getDisplayEccubeNav で eccubeNav 配列自体を事前フィルタし、Twig には eccubeNav を addGlobal する。AuthorityRoles グローバルは追加されず、admin/nav.twig はフィルタ済み eccubeNav を単純に描画する。確認お願いします。（設計根拠: excel_to_html/output/0201_基本設計仕様書(システム設定).html#sheet-6:1993,2021,2036,2042 ／ 実装: src/Eccube/EventListener/TwigInitializeListener.php:176,187,189,191,204,238; src/Eccube/Resource/template/admin/nav.twig:20）
