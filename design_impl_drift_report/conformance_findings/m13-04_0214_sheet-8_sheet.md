■管理-M13-04 繰返日程追加
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口は、GET /{admin_route}/event/repeatschedule/{eventId}/new で入力フォームを表示し、POST /{admin_route}/event/repeatschedule/{eventId}/create で登録する。画面遷移先は admin_repeat_schedule_new とする。
　実装は name=admin_repeat_schedule_create の単一路由で、GET/POST とも /{admin_route}/event/{eventId}/repeatSchedule/create に割り当てている。admin_repeat_schedule_new および /event/repeatschedule/{eventId}/new は存在しない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-8:2421 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/RepeatScheduleController.php:39）

■管理-M13-04 繰返日程追加
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）申込受付を有効にする指定で、当該イベントに支払い方法が設定されていない場合は、申込受付不可のエラーメッセージを表示して入力画面を再表示する。
　RepeatScheduleController はフォーム妥当時に RepeatScheduleStoreAction を呼ぶだけで、支払い方法未設定の前提確認を行わない。RepeatScheduleType にも Event->getPayments()->isEmpty() の検証がない。単一日程用 ScheduleType には類似チェックがあるが、繰返日程フォームには適用されていない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-8:2430 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/RepeatScheduleController.php, src/Eccube/Form/Type/Admin/RepeatScheduleType.php, src/Eccube/Service/Admin/Event/RepeatScheduleStoreAction.php, src/Eccube/Resource/locale/*.yaml。反証として ScheduleType.php の支払方法チェックも確認））

■管理-M13-04 繰返日程追加
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示メッセージは、検証失敗時または申込受付有効で支払い方法未設定のときに保存失敗メッセージ（ロケールキー admin.schedule.save.failed）を表示し、支払い方法未設定時は admin.schedule.error.payment.not.exists を表示する。
　例外時のみ admin.common.save_error を addError する。フォーム検証失敗時は同メッセージを addError しない。admin.schedule.save.failed と admin.schedule.error.payment.not.exists は locale と実装参照に存在しない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-8:2432 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/RepeatScheduleController.php:68）

■管理-M13-04 繰返日程追加
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）受付開始時間・受付終了時間は受付ありの場合必須、デッキ登録締切の開始日前日数・時刻はデッキ登録ありの場合必須、オンライン受付開始/終了の日前日数・時刻はオンライン受付ありの場合必須とする。
　RepeatScheduleType では entryStartTime、entryEndTime、deckRegistDeadlineDays、deckRegistDeadlineTime、onlineEntryStartDays、onlineEntryStartTime、onlineEntryEndDateDays、onlineEntryEndTime が required=false で、条件付き NotBlank/FormError がない。Twig は一部項目に disabled/required を付け替えるが、deckRegist 項目は required を付与せず、サーバ側検証もない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-8:2338 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/RepeatScheduleType.php:131）

■管理-M13-04 繰返日程追加
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）受付開始時間・受付終了時間の初期値は 00:00、デッキ登録締切開始日前日数は 0、デッキ登録締切時刻は 23:59、オンライン受付開始/終了の日前日数は 0、オンライン受付開始/終了時刻は 00:00 とする。
　deckRegistDeadlineTime だけ Carbon::now()->setTime(23, 59, 59) を data に設定している。受付開始/終了、デッキ登録締切日前日数、オンライン受付開始/終了の日前日数・時刻には data 初期値がない。StoreAction には null 合体で 0 を使う箇所があるが、フォーム初期表示値ではない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-8:2338 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/RepeatScheduleType.php:131）

■管理-M13-04 繰返日程追加
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フロントの当該イベントページへのリンクとしてイベントページURLを表示する。
　イベントページURL欄は form.eventDetailId.vars.value がある場合だけ event_detail へのリンクを表示する。繰返日程新規登録フォームでは RepeatScheduleType が is_new=true のため eventDetailId は null になり、URL欄は空表示になる。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-8:2332 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/RepeatSchedule/create.twig:88）
