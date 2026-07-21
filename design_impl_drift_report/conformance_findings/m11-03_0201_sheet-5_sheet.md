■管理-M11-03 権限管理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）権限管理画面は初期表示時に admin.setting.system.authority.index.initialize、保存完了時に admin.setting.system.authority.index.complete のイベントを発火する。
　EccubeEvents には対象イベント定数があるが、権限管理の Controller/Action では EventArgs/EventDispatcher/EccubeEvents の参照も dispatch 呼び出しもなく、保存時はサービス実行後に成功メッセージを追加してリダイレクトするだけである。確認お願いします。（設計根拠: excel_to_html/output/0201_基本設計仕様書(システム設定).html#sheet-5:1852,1854,1881 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/AuthorityController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/System/AuthorityIndexAction.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php, rg "ADMIN_SETTING_SYSTEM_AUTHORITY_INDEX|admin\.setting\.system\.authority\.index" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube））

■管理-M11-03 権限管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）管理画面の Twig グローバルとして AuthorityRoles を拒否URLのフルパス配列で登録し、同一リクエスト内の二重初期化を避ける。
　TwigInitializeListener はログインメンバーの AuthorityRoles を取得して eccubeNav をフィルタし、Twig global には eccubeNav を登録する。AuthorityRoles という Twig global の登録、およびその二重初期化回避フラグは確認できない。確認お願いします。（設計根拠: excel_to_html/output/0201_基本設計仕様書(システム設定).html#sheet-5:1859,1881 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php:185）

■管理-M11-03 権限管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）権限設定の保存成功後、画面に「権限設定を保存しました。」を表示する。
　保存成功時は addSuccess('admin.common.save_complete') を呼び出し、翻訳文言は「保存しました」である。確認お願いします。（設計根拠: excel_to_html/output/0201_基本設計仕様書(システム設定).html#sheet-5:1854,1884 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/AuthorityController.php:85; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1405）
