■バッチ-B13-01 決済処理中チェックバッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）SP.LINKSに取引照会を行い、照会結果に応じた処理を行う。決済サービスへ取引を照会し、結果でステータスを判定する。
　getApiResponse() は SP.LINKS 取引照会APIを実行せず、常に LogicException を throw する。確認お願いします。（設計根拠: excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html#sheet-3:854,945 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:191）

■バッチ-B13-01 決済処理中チェックバッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）直前と同じ決済番号の申込みは、前回の照会結果に従って同様の処理を行う。同一決済番号は前回結果を流用する。
　DtbEventEntryRepository::getBeforeMinutesEntry() は paymentNo 順に並べるが、PaymentStatusCheckAction::handle() は各 EventEntry ごとに getApiResponse($paymentNo) を呼び、前回の paymentNo/result を保持・再利用する変数や分岐がない。確認お願いします。（設計根拠: excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html#sheet-3:936,939 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventEntryRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: 前回, 直前, 同一決済, 同じ決済, previous, prev, last, paymentNo, payment_no, ResponseCd））

■バッチ-B13-01 決済処理中チェックバッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）取引不在・未完了以外の想定外エラーは1つにまとめ、管理者へ通知メールを送信する。取引不在・未完了以外のエラーは重複を除いてまとめ、管理者へ通知する。
　各 EventEntry の catch 節で sendEventPaymentErrorAlertMail($EventEntry, $e->getMessage()) を即時送信し、cntError を加算する。エラー配列への蓄積、重複排除、ループ後の一括通知はない。確認お願いします。（設計根拠: excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html#sheet-3:936,942,962 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:164）

■バッチ-B13-01 決済処理中チェックバッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）取引不在・未完了等のメッセージ収集、想定外エラーの通知。取引不在・未完了は記録の除去等の所定処理を行い、メッセージを収集する。
　取引が存在しない・失敗している場合は deletedAt を設定して flush し、cntDeleted を加算するだけで、取引不在・未完了等のメッセージを収集しない。戻り値 detail も件数集計のみ。確認お願いします。（設計根拠: excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html#sheet-3:948,962 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:154）

■バッチ-B13-01 決済処理中チェックバッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）照会・更新を積み、最後に確定する。
　成功時は申込みごとに beginTransaction()、flush()、commit() を行い、取引不在・失敗時も申込みごとに flush() する。確認お願いします。（設計根拠: excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html#sheet-3:970 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:113）
