主張: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務周期/scenario_list.md:290` の UCY-21 は、毎分の再処理について「5分前・1分前ちょうど」を対象に含める。
実際: 設計書 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1232` は「5分前から1分前まで」。一方、新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2290-2300` は終了を起動の60秒前、開始をさらに5分前に置き、両端を `>`・`<` で除外する。実際の対象は起動の6分前より後、1分前より前である。
判定: 事実の誤り
修正案: UCY-21の1分前ちょうどの期待値と対象窓を新実装に合わせ、設計書とのずれを記録する。

主張: 同ファイル:290 の UCY-21 は、5時間の窓より前を拾う手段について「取引は手動の期間指定がある。ほかは各一覧に手動の指定の記述が無い」とする。
実際: 新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiStockBackfillCommand.php:48-50` も、在庫変動の再連携に開始・終了日時を指定できる。設計書 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html:1133` も「取得する期間は可変で実装」とする。
判定: 事実の欠落
修正案: USM-04の在庫変動も期間指定で拾える経路をUCY-21に加える。

主張: 同ファイル:236・290 は USM-04 を毎時16分の再連携として扱い、閉店後も同じ周期で繰り返す前提になっている。
実際: 同じ設計書 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html:1132-1136` は「実行タイミング　毎時16分」とする一方、「バッチの実行時間を閉店時間などを見て可変的に実行」「全店舗閉店後は…閉店後1回のみ」とも定める。
判定: 事実の欠落
修正案: 毎時16分と閉店後1回の食い違いを記録し、UCY-21の閉店後の実行回数を確定済みの期待値にしない。

主張: 同ファイル:218 の UPM-02 は周期を「週次」だけとする。
実際: 参照先 `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/商品管理から注文確認メールまで/scenario_list.md:31` の UPM-02 は、セール更新に加えて「通常商品の価格変更」「セール中の商品に基準価格変更」「高額商品の価格変更CSV」をL3に含む。業務フロー `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/11_価格管理.md:78-82` の価格変更業務には曜日の定めが無い。
判定: 事実の欠落
修正案: UPM-02を「随時・週次」とし、週次はセール更新、随時は価格変更のL3に対応させる。

主張: 同ファイル:185・293 の UMB-06／UCY-24 は、期限切れ側を「24時間後（以降）」「24時間以上」とし、24時間ちょうどを含める。
実際: 新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/RegisterCustomerViewRepository.php:143-149` は `reset_expire >= :reset_expire` で判定するため、有効期限と同時刻は有効である。同ファイル:293 のUCY-24の終点も「24時間を超えると」無効とする。
判定: 事実の誤り
修正案: 期限切れ側の起点とL3を「24時間を超えたとき」に統一する。

主張: 同ファイル:293 の UCY-24 は、再設定画面を開いたまま期限を過ぎて送信すると「404 Page Not Found」になるとする。
実際: 新実装 `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:190-195` は送信時にも有効なキーを検索し、見つからなければ `Forgot/reset_error.twig` を表示する。設計書 `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1890-1896` も期限切れには「E-2.ユーザー存在チェックエラー画面」を指定する。
判定: 事実の誤り
修正案: 期限後の送信結果を期限切れのエラー画面に直す。
