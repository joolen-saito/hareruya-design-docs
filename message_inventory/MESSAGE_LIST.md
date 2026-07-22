# メッセージ一覧（設計書反映済み・機能別）

ec-cube-enterprise 実装のUIメッセージを機能へ割当て、設計書『表示メッセージ』表へ埋め込んだ確定メッセージの一覧。**捏造ゼロ**。

- 総確定メッセージ: **1139件** / 機能数: **149**
- codex + fable5 の二重批判レビュー済み。詳細は `CODEX_REVIEW_REPORT.md`
- 後続処理は「処理結果＋遷移先画面」の簡潔形。正本: `message_inventory/message_inventory.tsv`

---

## A02-05 API 商品管理 — 更新商品規格取得
`functions/pf-api/a02-05_api_product_updated_product_class.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| A02-05-MSG-002 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | CSV行のclass_name_del_flgが1で、規格削除時にForeignKeyConstraintViolationExceptionが発生したとき | 規格CSV登録画面に留まる |
| A02-05-MSG-003 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | CSV行のclass_category_del_flgが1で、規格分類削除時にForeignKeyConstraintViolationExceptionが発生したとき | 規格分類CSV登録画面に留まる |

## F04-02 F04-02（ご注文方法指定 — 注文情報の入力・確認・注文）
`functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F04-02-MSG-001 | エラー | 画面上部 | 要ソース確認 | POST /shopping/confirm でフォームが送信済みかつ有効であり、PaymentMethod::verify() の戻り値が存在し isSuccess() が false のとき | 要ソース確認 |
| F04-02-MSG-002 | エラー | 画面上部 | 要ソース確認 | POST /shopping/checkout（confirm.twig からの直接 POST）または POST /shopping/confirm（confirm() から checkout() を同一リクエスト実行する主経路）でフォームが送信済みかつ有効であり、try 節内で ShoppingException が送出されたとき | 要ソース確認 |
| F04-02-MSG-003 | エラー | 画面上部 | 購入処理で予期しないエラーが発生しました。恐れ入りますがお問い合わせページよりご連絡ください。 | POST /shopping/checkout（confirm.twig からの直接 POST）または POST /shopping/confirm（confirm() から checkout() を同一リクエスト実行する主経路）でフォームが送信済みかつ有効であり、ShoppingException 以外の Exception が送出されたとき | 購入エラー画面に遷移する |
| F04-02-MSG-004 | エラー | 画面上部 | 要ソース確認 | POST /shopping/checkout（confirm.twig からの直接 POST）または POST /shopping/confirm（confirm() から checkout() を同一リクエスト実行する主経路）でフォームが送信済みかつ有効であり、PaymentMethod::checkout() の PaymentResult が失敗（isSuccess() が false）のとき | 要ソース確認 |
| F04-02-MSG-005 | エラー | 画面上部 | 購入処理でエラーが発生しました。 | POST /shopping/customer のXHRで、プレオーダーIDに対応する購入処理中の受注を取得できない場合 | 購入エラー画面に遷移する |
| F04-02-MSG-006 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | ポイント機能が有効かつログイン中に、注文フォームをPOSTし、use_pointが正規表現 /^\d+$/u に一致しない場合 | ご注文方法指定画面に留まる |

## F05-06 F05-06（ネット買取買取手続き〜完了）
`functions/pf-eccube3/f05-06_front_online_purchase_buy_shopping_complete.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F05-06-MSG-001 | エラー(バリデーション) | 入力項目直下 | この項目は必ず入力してください。 | 買取依頼内容の確認・確定フォームをPOSTし、銀行名が空でNotBlank制約に違反したとき | 買取依頼内容の記入画面に留まる |

## F06-13 会員 — オンライン本人確認
`functions/pf-eccube3/f06-13_front_member_mypage_online_identification.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F06-13-MSG-001 | 警告 | 画面中央(ダイアログ) | 本人確認の申請に失敗しました。再度撮影して申請をお願いします。 | 申請送信後に身分証画像フォームの検証が失敗し、isError=1 付きで撮影画面（mypage_identification_photograph）が再表示されたとき（window.onload 時） | 撮影画面に留まる |

## F06-14 F06-14（予約済み大会一覧）
`functions/pf-eccube3/f06-14_front_member_mypage_event_reserved_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F06-14-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | フォーム送信済みかつ有効で、登録処理が InvalidArgumentException を送出したとき | 要ソース確認 |
| F06-14-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | フォーム送信済みかつ有効で、登録処理が InvalidArgumentException 以外の Exception を送出したとき | イベント申込新規画面に留まる |

## F06-15 F06-15（買取履歴詳細）
`functions/pf-eccube3/f06-15_front_member_mypage_buy_history_detail.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F06-15-MSG-001 | インフォ(成功) | 画面上部 | 査定内容を承諾しました。 | 買取注文が本人のもので処理状態が連絡済み、かつ承諾確定POSTの処理がBadRequestHttpExceptionを送出せず完了したとき | 買取履歴詳細画面に遷移する |

## F06-18 F06-18（会員情報変更）
`functions/pf-eccube3/f06-18_front_member_mypage_customer_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F06-18-MSG-001 | エラー | 画面上部 | ブラックリスト登録があるため会員情報を変更できません。 | POSTフォーム送信後、is_country_changeが偽、フォームが有効、かつFindBlacklistByCustomerの結果が1件以上のとき | 会員情報変更画面に留まる |

## F06-20 F06-20（会員の配送先登録・編集）
`functions/pf-eccube3/f06-20_front_member_mypage_delivery_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F06-20-MSG-001 | 確認 | 画面中央(ダイアログ/モーダル) | %name01%　%name02%様の情報をアドレス帳から削除しますか？ | 配送先一覧画面で「削除」リンクを押下したとき、クリックを抑止しdata-confirmの文言でブラウザ確認ダイアログを表示する | 配送先を削除して配送先一覧画面に遷移する。キャンセル時は配送先一覧画面に留まる |

## F06-21 会員 — 退会（退会手続き）
`functions/pf-eccube3/f06-21_front_member_mypage_withdraw.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F06-21-MSG-001 | エラー | 画面上部 | パスワードに誤りがあります。 | mode=completeで送信し、パスワードが空、または保存済みパスワードとの照合に失敗したとき | 退会確認画面に留まる |
| F06-21-MSG-002 | エラー | 画面上部 | 退会処理の途中でエラーが発生しました。 | mode=completeで送信し、パスワード照合後にsmaregiCustomerService::deleteCustomerがfalseを返したとき | 退会確認画面に留まる |

## F06-22 F06-22（お問い合わせ送信）
`functions/pf-eccube3/f06-22_front_member_mypage_contact.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F06-22-MSG-001 | 警告 | 画面中央(ダイアログ) | 必須項目が入力されていません。 | 件名が店舗・イベント関連(SHOP_OR_EVENT_ID)かつお問い合わせ詳細がイベントキャンセル(EVENT_CANCEL_ID)で、イベント名・実施店舗・開催日・開始時間・キャンセル理由・アンケートのいずれか、またはキャンセル理由が「その他」(OTHER_REASONS_ID)でその他理由が未入力のまま送信したとき | 送信せず現在の画面に留まる |

## F06-25 F06-25（店頭モニターに受注管理から登録した番号札を表示）
`functions/pf-eccube3/f06-25_front_member_store_order_call_number.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F06-25-MSG-001 | 警告 | 画面中央(ダイアログ) | waiting number get failed. | get_waiting_number（GET /waiting_api/get_waiting_number/{base_info_id}）へのAJAX取得がerrorになったとき（ただしalert行はコメントアウトのため実際には表示されない） | 店頭モニター画面に留まる |

## F08-02 F08-02（店頭買取査定申込情報入力）
`functions/pf-eccube3/f08-02_front_store_purchase_otc_buy_entry_input.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F08-02-MSG-001 | 警告 | 画面中央(ダイアログ) | 要ソース確認（key_unknown: front.otcbuy.error.assessment_only） | 同リンクのclick時に isEntry=false かつ #otc_buy_order_email_first / #otc_buy_order_email_second / #otc_buy_order_password_first / #otc_buy_order_password_second のいずれかに入力があるとき | 要ソース確認 |
| F08-02-MSG-002 | 警告 | 画面中央(ダイアログ) | 要ソース確認（key_unknown: front.otcbuy.error.membership_assessment） | 同ボタン押下で isEntry=true となった状態でフォーム送信され、#otc_buy_order_email_first / #otc_buy_order_email_second / #otc_buy_order_password_first / #otc_buy_order_password_second のいずれかが未入力のとき | 要ソース確認 |

## F08-03 F08-03（店頭買取査定申込登録確認〜完了）
`functions/pf-eccube3/f08-03_front_store_purchase_otc_buy_entry_complete.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| F08-03-MSG-001 | エラー(バリデーション) | 入力項目直下 | 要ソース確認（other: "front.error.{$name}.message"） | 各対象値が正規表現 /^[^\s ]+$/u に一致しないとき | 要ソース確認 |

## M01-02 m01-02_admin_login_two_factor_auth（管理画面_二段階認証）
`functions/ec-cube-enterprise/m01-02_admin_login_two_factor_auth.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M01-02-MSG-001 | エラー | 画面上部 | 要ソース確認（variable: $res['error']） | 本人の再設定画面のPOSTでcreateResponseがerrorを返すとき | 要ソース確認 |
| M01-02-MSG-002 | 警告 | 管理画面上部 | 既に2段階認証の設定が行われています。再設定すると登録済みのデバイスが使用出来なくなります。 | GETでログイン管理者のTwoFactorAuthKeyが既にあるとき | 本人の再設定画面に留まる |
| M01-02-MSG-003 | インフォ(成功) | 管理画面上部 | 2段階認証の設定が完了しました。 | 初回設定または本人の再設定のPOSTでフォームが妥当かつTOTP検証に成功したとき | ホーム画面に遷移する |

## M03-01 m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）
`functions/pf-eccube3/m03-01_admin_product_product_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-01-MSG-001 | インフォ(成功) | 管理画面上部 | パスワードを更新しました | パスワード変更フォームが送信済みかつ有効なとき（$form->isSubmitted() && $form->isValid()） | パスワード変更画面に遷移する |
| M03-01-MSG-002 | 警告 | 画面中央(ダイアログ) | Failed | 規格データ取得Ajax（GET btnClass.data('class-load')）が fail したとき | エラーを表示し、商品検索・一覧画面に留まる |
| M03-01-MSG-003 | インフォ | 画面中央(モーダル) | 削除中... | #bulkDelete 押下直後（チェック済み行への削除Ajax開始時にモーダル本文を差し替える） | 削除処理中を表示し、商品検索・一覧画面に留まる |
| M03-01-MSG-004 | インフォ | 画面中央(モーダル) | 商品の削除処理が完了しました | 一括削除の全DELETE Ajaxが完了したとき（$.when(...).always、成功・失敗を問わない） | 完了を表示し、商品検索・一覧画面を再読み込みする |
| M03-01-MSG-005 | インフォ(成功) | 管理画面上部 | 削除しました | 非XHRのDELETEで商品削除が成功したとき | 商品検索・一覧画面に遷移する |
| M03-01-MSG-006 | エラー | 管理画面上部 | 要ソース確認 | 外部キー制約例外時（ForeignKeyConstraintViolationException）。id=null分岐はルート要件id=\d+のため通常到達不可 | 要ソース確認 |
| M03-01-MSG-007 | エラー | 管理画面上部 | 要ソース確認 | 個別商品の状態保存中に例外が発生したとき | 要ソース確認 |
| M03-01-MSG-008 | インフォ(成功) | 管理画面上部 | %status%: %count%件が正常に適用されました | 少なくとも1件の商品の状態保存に成功したとき | 商品検索・一覧画面に遷移する |
| M03-01-MSG-009 | エラー | 管理画面上部 | 要ソース確認 | 一括状態変更処理のtryブロックで例外が発生したとき | 要ソース確認 |
| M03-01-MSG-010 | 警告 | 管理画面上部 | 既に削除されています | 非XHRのDELETE要求でidに対応する商品が存在しない（削除済み）とき | 商品検索・一覧画面に遷移する |

## M03-02 M03-02（商品編集機能）
`functions/pf-eccube3/m03-02_admin_product_product_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-02-MSG-001 | インフォ | 画面中央(モーダル) | 削除中... | 既存商品（Product.idあり）の商品編集画面で完全削除確認モーダルを開き、削除ボタン(#delete)を押下したとき | 商品編集画面に留まる |
| M03-02-MSG-002 | インフォ | 画面中央(モーダル) | 商品の削除処理が完了しました | #delete 起点のDELETE Ajax群が完了したとき（$.when(...).always。成功・失敗を問わず実行） | 削除完了を表示し、削除成功時は商品一覧画面に遷移する |
| M03-02-MSG-003 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 画像のパスが不正です。 | POST_SUBMIT時、add_imagesの各ファイル名について、既存画像のファイルが存在しない、または一時商品画像パスにファイルが存在しない場合 | エラーを表示して商品編集画面に留まる |
| M03-02-MSG-004 | エラー | 管理画面上部 | 保存に失敗しました | POST時、対象ProductにIDがないとき | 商品新規登録画面に遷移する |
| M03-02-MSG-005 | インフォ(成功) | 管理画面上部 | 保存しました | POSTフォームが有効で、保存処理およびADMIN_PRODUCT_EDIT_COMPLETEイベント完了後 | 戻り先画面に遷移し、戻り先が無効または未指定の場合は商品編集画面に遷移する |
| M03-02-MSG-006 | インフォ(成功) | 管理画面上部 | 商品を複製しました | POST先idの商品が存在し、複製・flush・ADMIN_PRODUCT_COPY_COMPLETEイベントが完了したとき | 複製した商品の商品編集画面に遷移する |
| M03-02-MSG-007 | エラー | 管理画面上部 | 商品の複製に失敗しました | POST先idに対応する商品が存在しないとき | 商品一覧画面に遷移する |
| M03-02-MSG-008 | エラー | 管理画面上部 | 商品の複製に失敗しました | copyアクションのidがnullのとき（ルート要件id=\d+のため通常到達不可） | 商品一覧画面に遷移する |

## M03-03 m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）
`functions/pf-eccube3/m03-03_admin_product_product_card_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-03-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | POST admin_product_card_csv_export で、商品未取得時またはCSV行が空のとき | 要ソース確認 |
| M03-03-MSG-002 | エラー | 管理画面上部 | 1つ以上の商品を選択してください | POST admin_product_card_csv_export で ids が未送信・非配列、または正整数化後に空のとき | エラーを表示し、商品一覧画面に遷移する |

## M03-04 m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）
`functions/pf-eccube3/m03-04_admin_product_product_goods_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-04-MSG-001 | エラー | 要ソース確認 | 要ソース確認 | POST admin_product_goods_csv_export で、商品未取得時またはCSV行が空のとき | 要ソース確認 |
| M03-04-MSG-002 | エラー | 管理画面上部 | 1つ以上の商品を選択してください | POST admin_product_goods_csv_export で ids が未送信・非配列、または正整数化後に空のとき | エラーを表示し、管理画面_商品管理_商品一覧画面に遷移する |

## M03-05 m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力）
`functions/pf-eccube3/m03-05_admin_product_product_sale_price_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-05-MSG-003 | エラー | 管理画面上部 | 1つ以上の商品を選択してください | POST admin_product_price_csv_export で ids が未送信・非配列、または正整数化後に空のとき | エラーを表示し、商品一覧画面に遷移する |
| M03-05-MSG-004 | エラー | 要ソース確認 | 存在しないカードIDが含まれています。 | POST admin_product_price_csv_export で有効な商品ID送信後、該当商品を取得できないとき | エラーを表示し、直前の画面または商品一覧画面に遷移する |

## M03-08 m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）
`functions/pf-eccube3/m03-08_admin_product_product_product_class_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-08-MSG-001 | エラー | 管理画面上部 | 保存に失敗しました | POST後、フォームが未送信または不正のとき（!$form->isSubmitted() \|\| !$form->isValid()） | 保存せず商品規格登録/編集画面に留まる |
| M03-08-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | ProductClassStoreAction::handle() から送出された任意の \Exception を catch したとき | 商品規格登録/編集画面に留まる |
| M03-08-MSG-003 | インフォ(成功) | 管理画面上部 | 保存しました | ProductClassStoreAction::handle() が例外なく完了したとき | 管理画面_商品管理_商品規格一覧画面に遷移する |
| M03-08-MSG-004 | エラー | 管理画面上部 | 保存に失敗しました | POST後、フォームが未送信または不正のとき（!$form->isSubmitted() \|\| !$form->isValid()） | 保存せず商品規格登録/編集画面に留まる |
| M03-08-MSG-005 | エラー | 管理画面上部 | 要ソース確認 | ProductClassUpdateAction::handle() から送出された任意の \Exception を catch したとき | 商品規格登録/編集画面に留まる |
| M03-08-MSG-006 | インフォ(成功) | 管理画面上部 | 保存しました | ProductClassUpdateAction::handle() が例外なく完了したとき | 管理画面_商品管理_商品規格一覧画面に遷移する |
| M03-08-MSG-007 | インフォ(成功) | 管理画面上部 | 削除しました | DELETE後、ProductClassDeleteAction::handle() が例外なく完了したとき | 管理画面_商品管理_商品規格一覧画面に遷移する |
| M03-08-MSG-008 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | DELETE時に ForeignKeyConstraintViolationException を catch したとき | 管理画面_商品管理_商品規格一覧画面に遷移する |
| M03-08-MSG-009 | インフォ(成功) | 管理画面上部 | 商品規格を初期化しました | 商品規格が存在し、フォームが送信済みかつ有効で、初期化処理が ForeignKeyConstraintViolationException なく完了したとき | 管理画面_商品管理_商品規格一覧画面に遷移する |
| M03-08-MSG-010 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | 初期化処理中に ForeignKeyConstraintViolationException を catch したとき | 管理画面_商品管理_商品規格一覧画面に遷移する |
| M03-08-MSG-011 | インフォ(成功) | 管理画面上部 | 保存しました | 要ソース確認 | 要ソース確認 |
| M03-08-MSG-012 | インフォ(成功) | 管理画面上部 | 削除しました | 要ソース確認 | 要ソース確認 |
| M03-08-MSG-013 | エラー | 管理画面上部 | 要ソース確認（variable: $message） | 要ソース確認 | 要ソース確認 |
| M03-08-MSG-014 | インフォ(成功) | 管理画面上部 | 「%name%」を表示にしました。 | 要ソース確認 | 要ソース確認 |
| M03-08-MSG-015 | インフォ(成功) | 管理画面上部 | 「%name%」を非表示にしました。 | 要ソース確認 | 要ソース確認 |
| M03-08-MSG-016 | インフォ(成功) | 管理画面上部 | 保存しました | 要ソース確認 | 要ソース確認 |
| M03-08-MSG-017 | インフォ(成功) | 管理画面上部 | 保存しました | 要ソース確認 | 要ソース確認 |
| M03-08-MSG-018 | インフォ(成功) | 管理画面上部 | 削除しました | 要ソース確認 | 要ソース確認 |
| M03-08-MSG-019 | エラー | 管理画面上部 | 要ソース確認（variable: $message） | 要ソース確認 | 要ソース確認 |

## M03-09 M03-09（商品規格登録/編集）
`functions/pf-eccube3/m03-09_admin_product_product_class_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-09-MSG-001 | エラー(バリデーション) | 要ソース確認（fable5: 本フォームを描画するテンプレートが実在せず表示位置は根拠なし） | 数字で入力してください。 | POST_SUBMIT時にchecked=trueでsale_limitが/^\d+$/uに一致しない場合 | 要ソース確認 |
| M03-09-MSG-002 | エラー(バリデーション) | 要ソース確認（fable5: 本フォームを描画するテンプレートが実在せず表示位置は根拠なし） | 数字と小数点のみ入力できます。 | POST_SUBMIT時にchecked=trueでtax_rateが/^\d+(\.\d+)?$/に一致しない場合 | 要ソース確認 |
| M03-09-MSG-003 | エラー(バリデーション) | 要ソース確認（fable5: 本フォームを描画するテンプレートが実在せず表示位置は根拠なし） | 要ソース確認 | POST_SUBMIT時にchecked=trueで各フィールドの制約(NotBlank/Range/Length/GreaterThanOrEqual等)違反が発生した場合 | 要ソース確認 |
| M03-09-MSG-004 | エラー(バリデーション) | 入力項目直下 | 半角文字のみ使用可能です。 | 登録または更新送信時、codeが正規表現/^[\x01-\x7E]+$/に一致しない場合 | M03-09（商品規格登録/編集）画面に留まる |
| M03-09-MSG-005 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 登録または更新送信時、sale_limitが正規表現/^\d+$/uに一致しない場合 | M03-09（商品規格登録/編集）画面に留まる |
| M03-09-MSG-006 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 登録または更新送信時、price02が正規表現/^\d+$/uに一致しない場合 | M03-09（商品規格登録/編集）画面に留まる |
| M03-09-MSG-007 | エラー(バリデーション) | 入力項目直下 | 数字と小数点のみ入力できます。 | 登録または更新送信時、tax_rateが正規表現/^\d+(\.\d+)?$/に一致しない場合 | M03-09（商品規格登録/編集）画面に留まる |
| M03-09-MSG-008 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 登録または更新送信時、standard_priceが正規表現/^\d+$/uに一致しない場合 | M03-09（商品規格登録/編集）画面に留まる |
| M03-09-MSG-009 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 登録または更新送信時、buy_priceが正規表現/^\d+$/uに一致しない場合 | M03-09（商品規格登録/編集）画面に留まる |
| M03-09-MSG-010 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 登録または更新送信時、wholesale_priceが正規表現/^\d+$/uに一致しない場合 | M03-09（商品規格登録/編集）画面に留まる |

## M03-10 m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）
`functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-10-MSG-001 | エラー | 管理画面上部 | 1つ以上の商品を選択してください | 商品を選択せずに一括編集画面を開いたとき（ids が空 empty($productIds)） | 商品一覧画面に遷移する |
| M03-10-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | POST後 !$form->isSubmitted() \|\| !$form->isValid() のとき（各フォームエラーごとに列挙） | 要ソース確認 |
| M03-10-MSG-003 | エラー | 管理画面上部 | 要ソース確認 | 有効なPOST後、価格更新処理（StoreAction::handle）で Exception が送出されたとき | 要ソース確認 |
| M03-10-MSG-004 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | 有効なPOST後、価格更新処理が例外なく完了したとき | 商品一覧画面に遷移する |

## M03-11 m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）
`functions/pf-eccube3/m03-11_admin_product_product_category_register_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-11-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | POSTされたカテゴリフォームが送信済みかつ妥当で保存処理が正常完了したとき | 管理画面_商品管理_カテゴリ一覧画面に遷移する |
| M03-11-MSG-002 | インフォ(成功) | 管理画面上部 | 削除しました | 対象カテゴリが存在しdelete処理・完了イベントが例外なく正常終了したとき | 管理画面_商品管理_カテゴリ一覧画面に遷移する |
| M03-11-MSG-003 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | カテゴリ削除処理のtry節で例外(\Exception)を捕捉したとき | 管理画面_商品管理_カテゴリ一覧画面に遷移する |
| M03-11-MSG-004 | 警告 | 管理画面上部 | 既に削除されています | DELETE時に対象カテゴリがDB上に存在しないとき（categoryRepository->find($id) が空） | 管理画面_商品管理_カテゴリ一覧画面に遷移する |
| M03-11-MSG-007 | エラー(バリデーション) | 入力項目直下 | JPEG / PNG / GIF の画像ファイルのみアップロードできます。 | フォーム経由で送信されたファイルのMIMEがimage/jpeg・image/png・image/gif以外のとき（Assert\Image mimeTypes違反。通常操作はFilePondのAjax process経由のためフォーム経由での発火経路は要ソース確認） | 要ソース確認 |
| M03-11-MSG-008 | エラー(バリデーション) | 入力項目直下 | 画像ファイルのサイズが大きすぎます（最大 {{ limit }} {{ suffix }}）。 | フォーム経由で送信されたファイルが10Mを超えるとき（Assert\Image maxSize違反。通常操作はFilePondのAjax process経由のためフォーム経由での発火経路は要ソース確認） | 要ソース確認 |
| M03-11-MSG-009 | エラー(バリデーション) | 入力項目直下 | 画像として読み取れない、または破損したファイルです。 | フォーム経由で送信されたファイルが画像として読み取れない/破損しているとき（Assert\Image detectCorrupted違反。通常操作はFilePondのAjax process経由のためフォーム経由での発火経路は要ソース確認） | 要ソース確認 |
| M03-11-MSG-010 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | カテゴリ名未入力で送信したとき（NotBlank違反） | 管理画面_商品管理_カテゴリ登録・編集画面に留まる |
| M03-11-MSG-011 | エラー(バリデーション) | 入力項目直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | 最大長超過で送信したとき（name・category_name_en=eccube_stext_len、search_parameters=eccube_ltext_len のLength違反） | 管理画面_商品管理_カテゴリ登録・編集画面に留まる |

## M03-13 商品管理 — タグ登録/編集
`functions/pf-eccube3/m03-13_admin_product_product_tag.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-13-MSG-001 | エラー | 管理画面上部 | 登録できませんでした。 | フォームが未送信、またはバリデーション不正のとき | タグ登録/編集画面に留まる |
| M03-13-MSG-002 | エラー | 管理画面上部 | 要ソース確認（variable: $e->getMessage()） | TagStoreAction::handle()が例外を送出したとき | 要ソース確認 |
| M03-13-MSG-003 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | フォームが有効で、TagStoreAction::handle()が正常終了したとき | タグ登録/編集画面に遷移する |
| M03-13-MSG-004 | エラー | 管理画面上部 | 商品で使用されているため、「%name%」のタグは削除することができません。 | 対象タグのProductTag紐付け件数が1件以上のとき | タグ登録/編集画面に遷移する |
| M03-13-MSG-005 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | 紐付けなしの削除処理で例外が発生したとき | タグ登録/編集画面に遷移する |

## M03-14 m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）
`functions/pf-eccube3/m03-14_admin_product_product_abbreviation_tag_register_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-14-MSG-001 | エラー | 管理画面上部 | 登録できませんでした。 | POST後、フォームが未送信またはバリデーション不正のとき | 商品管理 — 略称タグ登録／編集画面に遷移する |
| M03-14-MSG-002 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | POST後、フォームが有効で、略称タグのpersist・flushが完了したとき | 商品管理 — 略称タグ登録／編集画面に遷移する |
| M03-14-MSG-003 | エラー | 管理画面上部 | 商品で使用されているため、「%name%」の略称タグは削除することができません。 | CSRF検証後、対象略称タグのgetProducts()件数が0より大きいとき | 商品管理 — 略称タグ登録／編集画面に遷移する |
| M03-14-MSG-004 | インフォ(成功) | 管理画面上部 | 削除しました | CSRF検証後、対象略称タグのgetProducts()件数が0で、remove・flushが完了したとき | 商品管理 — 略称タグ登録／編集画面に遷移する |
| M03-14-MSG-005 | エラー | 管理画面上部 | 要ソース確認 | POST後、CSVインポートフォームが未送信またはバリデーション不正でcheckFormValid()がfalseのとき（各フォームエラーごとに1件フラッシュ） | 要ソース確認 |
| M03-14-MSG-006 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | POST後、getFormFile()がnullのとき | 略称タグCSVアップロード画面に遷移する |
| M03-14-MSG-007 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | POST後、getImportData()がfalseのとき | 略称タグCSVアップロード画面に遷移する |
| M03-14-MSG-008 | エラー | 管理画面上部 | 要ソース確認 | CSVヘッダー・データ件数・登録処理中に例外（\Throwable）が発生したとき | 要ソース確認 |
| M03-14-MSG-009 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | POST後、CSV登録処理が例外なく完了したとき | 略称タグCSVアップロード画面に遷移する |
| M03-14-MSG-010 | 確認 | ブラウザ確認ダイアログ（window.confirm） | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除ボタンクリック時（data-confirm 未指定のため常に確認ダイアログ表示） | 送信せず現在の画面に留まる |
| M03-14-MSG-011 | エラー(バリデーション) | 要ソース確認 | 並び順は {{ min }} から {{ max }} の間で入力してください。 | 並び順が0〜32767の範囲外で送信されたとき（Range制約違反。サーバー側検証） | 要ソース確認 |
| M03-14-MSG-012 | 確認 | 画面中央(ダイアログ/モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 略称タグ一覧の行「削除」ボタンを押下したとき（data-confirm が false でないため共通JSが data-message を confirm に渡す。%name%=対象略称タグの name） | 送信せず現在の画面に留まる |

## M03-17 商品管理 — 売上分析タグ登録/編集
`functions/pf-eccube3/m03-17_admin_product_product_sales_analysis_management.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-17-MSG-001 | エラー | 管理画面上部 | 登録できませんでした。 | POSTフォームが未送信、またはバリデーション不正のとき | 商品管理 — 売上分析タグ登録/編集画面に留まる |
| M03-17-MSG-002 | エラー | 管理画面上部 | 値が重複しています。 | persist・flush中にUniqueConstraintViolationExceptionを捕捉したとき | 商品管理 — 売上分析タグ登録/編集画面に留まる |
| M03-17-MSG-003 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | フォームが有効で、persist・flushが例外なく完了したとき | 商品管理 — 売上分析タグ登録/編集画面に遷移する |
| M03-17-MSG-004 | エラー | 管理画面上部 | 商品で使用されているため、「%name%」のタグは削除することができません。 | CSRF検証後、対象タグのProductsコレクションが空でないとき | 商品管理 — 売上分析タグ登録/編集画面に遷移する |
| M03-17-MSG-005 | エラー | 管理画面上部 | 購入済の商品で使用されているため、「%name%」のタグは削除することができません。 | CSRF検証後、対象タグのOrderItemsコレクションが空でないとき | 商品管理 — 売上分析タグ登録/編集画面に遷移する |
| M03-17-MSG-006 | インフォ(成功) | 管理画面上部 | 削除しました | CSRF検証後、Products・OrderItemsがともに空で、remove・flushが完了したとき | 商品管理 — 売上分析タグ登録/編集画面に遷移する |
| M03-17-MSG-007 | 確認 | ブラウザ確認ダイアログ | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除リンククリック時（data-confirm未指定のため常に表示） | 確認後に削除を実行し、商品管理 — 売上分析タグ登録/編集画面に遷移する。キャンセル時は現在の画面に留まる |
| M03-17-MSG-008 | エラー | 名称フィールド直下 | 入力されていません。 | 名称が未入力でフォーム送信されたとき（NotBlank制約） | 商品管理 — 売上分析タグ登録/編集画面に留まる |
| M03-17-MSG-009 | エラー | 名称フィールド直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | 名称が64文字を超えてフォーム送信されたとき（Length max=64） | 商品管理 — 売上分析タグ登録/編集画面に留まる |
| M03-17-MSG-010 | エラー | 並び順フィールド直下 | 入力されていません。 | 並び順が未入力でフォーム送信されたとき（NotBlank制約） | 商品管理 — 売上分析タグ登録/編集画面に留まる |
| M03-17-MSG-011 | エラー | 並び順フィールド直下 | 並び順は {{ min }} から {{ max }} の間で入力してください。 | 並び順が1〜65535の範囲外でフォーム送信されたとき（Range min=1/max=65535） | 商品管理 — 売上分析タグ登録/編集画面に留まる |
| M03-17-MSG-012 | 確認 | 画面中央(ダイアログ/モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除リンクを押下したとき（data-confirm が未指定のため共通JS function.js が data-message の文言で window.confirm を表示する。%name% には当該行の tagSalesAnalysis.name が埋め込まれる） | 確認後に削除処理を行い、商品管理 — 売上分析タグ登録/編集画面に遷移する。キャンセル時は現在の画面に留まる |

## M03-18 商品管理 — 部門登録／編集
`functions/pf-eccube3/m03-18_admin_product_product_section.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-18-MSG-001 | エラー | 管理画面上部 | 登録できませんでした。 | POSTフォームが未送信または妥当性検証失敗 | 部門登録／編集画面に留まる |
| M03-18-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム妥当性検証後、部門保存・flush・スマレジupsert dispatchが完了 | 部門一覧画面に遷移する |
| M03-18-MSG-003 | エラー | 管理画面上部 | 削除に失敗しました | 削除対象の部門が取得できない | 部門一覧画面に遷移する |
| M03-18-MSG-004 | エラー | 管理画面上部 | 要ソース確認（variable: $message） | 対象部門に商品規格が存在する | 要ソース確認 |
| M03-18-MSG-005 | エラー | 管理画面上部 | 要ソース確認（variable: $message） | 対象部門に買取依頼明細が存在する | 要ソース確認 |
| M03-18-MSG-006 | エラー | 管理画面上部 | 要ソース確認（variable: $message） | 対象部門に買取依頼個別入力商品が存在する | 要ソース確認 |
| M03-18-MSG-007 | エラー | 管理画面上部 | 要ソース確認（variable: $message） | 対象部門に買取依頼サマリが存在する | 要ソース確認 |
| M03-18-MSG-008 | インフォ(成功) | 管理画面上部 | 削除しました | 部門削除、必要時のスマレジ削除メッセージdispatch、flushが成功 | 部門一覧画面に遷移する |
| M03-18-MSG-009 | エラー | 管理画面上部 | 要ソース確認（variable: $message） | 削除処理中に例外が発生 | 要ソース確認 |
| M03-18-MSG-010 | エラー | 管理画面上部 | 要ソース確認（variable: $error->getMessage()） | CsvImportTypeのimport_file制約を含むフォーム妥当性検証に失敗 | 要ソース確認 |
| M03-18-MSG-011 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | フォームのimport_file値がnull | 部門マスタCSVアップロード画面に遷移する |
| M03-18-MSG-012 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSV行数が5010以上 | 部門マスタCSVアップロード画面に遷移する |
| M03-18-MSG-013 | エラー | 管理画面上部 | 要ソース確認（variable: $error['message']） | SectionMasterImportHandlerを用いたCsvImporterの結果にエラーがある | 要ソース確認 |
| M03-18-MSG-014 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CsvImporterの結果にエラーがない | 部門マスタCSVアップロード画面に遷移する |

## M03-21 商品管理 — 棚番号登録/編集
`functions/pf-eccube3/m03-21_admin_product_product_shelf_number_register_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-21-MSG-001 | エラー | 管理画面上部 | 登録できませんでした。 | 棚番号登録フォームが未送信またはバリデーション不正 | 棚番号登録/編集画面に留まる |
| M03-21-MSG-002 | エラー | 管理画面上部 | 値が重複しています。 | 棚番号保存時にUniqueConstraintViolationExceptionが発生 | 棚番号登録/編集画面に遷移する |
| M03-21-MSG-003 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | 棚番号のpersist・flushが正常終了 | 棚番号登録/編集画面に遷移する |
| M03-21-MSG-004 | エラー | 管理画面上部 | 商品で使用されているため、「%name%」の棚番号は削除することができません。 | 対象棚番号のProductClassesが空でない（商品で使用中） | 棚番号登録/編集画面に遷移する |
| M03-21-MSG-005 | インフォ(成功) | 管理画面上部 | 削除しました | 紐付く商品がなくremove・flushが正常終了 | 棚番号登録/編集画面に遷移する |
| M03-21-MSG-006 | エラー | 管理画面上部 | 要ソース確認 | CSVアップロードフォームが不正（ファイル未選択・File制約違反・CSRFトークン不正のいずれか。getErrors(true)が子フォームとフォーム直下の全エラーを列挙） | 要ソース確認 |
| M03-21-MSG-007 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | 有効なCSVフォーム送信後にアップロードファイルがnull | 棚番号登録CSVアップロード画面に遷移する |
| M03-21-MSG-008 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSV行数がADMIN_CSV_IMPORT_MAX_ROWS以上 | 棚番号登録CSVアップロード画面に遷移する |
| M03-21-MSG-009 | エラー | 管理画面上部 | 要ソース確認 | CSV取込結果にエラーがある（ShelfNumberMasterImportHandler） | 要ソース確認 |
| M03-21-MSG-010 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CSV取込結果にエラーがない（ShelfNumberMasterImportHandler） | 棚番号登録CSVアップロード画面に遷移する |
| M03-21-MSG-011 | 確認 | 画面中央(ダイアログ) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除リンク押下時（a[token-for-anchor] にバインドされた共通ハンドラ。data-confirm 未指定のため data.confirm != false が真となり confirm を表示） | 確認後に削除処理を実行し、棚番号登録/編集画面に遷移する。キャンセル時は棚番号登録/編集画面に留まる |
| M03-21-MSG-012 | エラー | フォーム項目下 | ※名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能です。 | 名称が正規表現 ^[A-Z][-][0-9]{3}$ に不一致 | 棚番号登録/編集画面に留まる |
| M03-21-MSG-013 | エラー | フォーム項目下 | 入力されていません。 | 名称または並び順が未入力（NotBlank違反） | 棚番号登録/編集画面に留まる |
| M03-21-MSG-014 | エラー | フォーム項目下 | 整数で入力してください。 | 並び順に整数として解釈できない値を送信（IntegerTypeの変換エラー。invalid_message既定値「Please enter an integer.」の日本語訳） | 棚番号登録/編集画面に留まる |

## M03-22 商品管理 — 購入グループ管理
`functions/pf-eccube3/m03-22_admin_product_product_sell_group.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-22-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | create POSTでフォームが送信済みかつ有効なとき | 購入グループ管理画面に遷移する |
| M03-22-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | update POSTでフォームが送信済みかつ有効なとき | 購入グループ管理画面に遷移する |
| M03-22-MSG-003 | エラー | 管理画面上部 | 削除に失敗しました | DELETE時に対象購入グループのdeletedAtがnullではないとき | 購入グループ管理画面に遷移する |
| M03-22-MSG-004 | エラー | 管理画面上部 | この購入グループは商品に使用されているため、 %name% は削除することができません。 | DELETE時に対象購入グループへ商品が1件以上紐付くとき（getProducts()->isEmpty()がfalse） | 購入グループ管理画面に遷移する |
| M03-22-MSG-005 | インフォ(成功) | 管理画面上部 | 削除しました | DELETE時に対象購入グループが未削除かつ商品が紐付いていないとき | 購入グループ管理画面に遷移する |
| M03-22-MSG-006 | エラー | 管理画面上部 | 対象の購入グループが見つかりません。 | edit GETまたはupdate POSTで対象購入グループのdeletedAtがnullではないとき | 購入グループ管理画面に遷移する |
| M03-22-MSG-007 | 確認(モーダル) | 削除確認モーダル内 | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除ボタン押下で削除確認モーダルを表示するとき（data-messageをJSでモーダル本文p.modal-messageへ挿入 sell_group.twig:44-48,157） | 削除確認モーダルを表示する |
| M03-22-MSG-008 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | 未入力で送信したとき（NotBlank違反。create POSTまたはupdate POST） | 購入グループ管理画面に留まる |
| M03-22-MSG-009 | エラー(バリデーション) | 入力項目直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | 最大長超過で送信したとき（name・name_en=eccube_stext_len(255)、memo=eccube_sell_group_memo_len(4000) のLength違反。maxlength属性はあるがサーバ側検証は有効） | 購入グループ管理画面に留まる |

## M03-23 商品管理 — 買取/販売価格履歴（検索・一覧・CSV出力）
`functions/pf-eccube3/m03-23_admin_product_product_buy_sale_price_history.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-23-MSG-001 | エラー | 管理画面上部 | 検索条件を指定してからCSVをダウンロードしてください。 | リンク押下後、セッションの検索条件(eccube.admin.product.buy_sale_price_history.search)がnullのとき | 買取/販売価格履歴画面に遷移する |
| M03-23-MSG-002 | エラー(バリデーション) | 要ソース確認 | 終了日時は、開始日時より大きく設定してください | productサブフォームのupdate_date_fromとupdate_date_toがともに空でなく、開始日が終了日より後のとき | 買取/販売価格履歴画面に留まる |

## M03-26 m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）
`functions/pf-eccube3/m03-26_admin_product_product_card_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-26-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | POST先 admin_product_card_csv_upload で !$form->isValid() のとき（未選択/File制約違反等） | 要ソース確認 |
| M03-26-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | フォーム有効後、$form['import_file']->getData() が null のとき | 管理画面_商品管理_カード商品CSV登録画面に遷移する |
| M03-26-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | countCsvRows($formFile) >= ADMIN_CSV_IMPORT_MAX_ROWS のとき | 管理画面_商品管理_カード商品CSV登録画面に遷移する |
| M03-26-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | $result->hasError() が true のとき（ヘッダ不正/必須/形式/マスタ値等） | 要ソース確認 |
| M03-26-MSG-005 | インフォ(成功) | 管理画面上部 | CSVファイルをアップロードしました | $result->hasError() が false のとき | CSV取込履歴を登録し、管理画面_商品管理_カード商品CSV登録画面に遷移する |

## M03-27 m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録）
`functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-27-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | CSVアップロードのPOSTフォームが不正のとき（CsvImportTypeの検証エラー） | 要ソース確認 |
| M03-27-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | 有効なフォーム送信後、import_fileがnullのとき | 管理画面_商品管理_グッズ商品CSV登録画面に遷移する |
| M03-27-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSV行数が上限(ADMIN_CSV_IMPORT_MAX_ROWS)以上のとき | 管理画面_商品管理_グッズ商品CSV登録画面に遷移する |
| M03-27-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | CsvImporterの取込結果にエラーがあるとき | 要ソース確認 |
| M03-27-MSG-005 | インフォ(成功) | 管理画面上部 | CSVファイルをアップロードしました | CsvImporterの取込結果にエラーがないとき | 管理画面_商品管理_グッズ商品CSV登録画面に遷移する |

## M03-28 m03-28_admin_product_product_product_tag_csv_import（管理画面_商品管理_商品タグ更新CSV登録）
`functions/pf-eccube3/m03-28_admin_product_product_product_tag_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-28-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | POST後に $form->isValid() が false のとき | 要ソース確認 |
| M03-28-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | 有効なPOST後、$form['import_file']->getData() が null のとき | 商品タグ更新CSV登録画面に遷移する |
| M03-28-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | countCsvRows($formFile) >= ADMIN_CSV_IMPORT_MAX_ROWS のとき | 商品タグ更新CSV登録画面に遷移する |
| M03-28-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | CsvImporter の $result->hasError() が true のとき | 要ソース確認 |
| M03-28-MSG-005 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CsvImporter の $result->hasError() が false のとき | 商品タグ更新CSV登録画面に遷移する |

## M03-29 m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）
`functions/pf-eccube3/m03-29_admin_product_product_tag_sales_analysis_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-29-MSG-001 | エラー | 管理画面上部 | 要ソース確認（variable: $error->getMessage()） | POSTフォームが不正（CsvImportTypeのNotBlankまたはFile制約エラー） | 要ソース確認 |
| M03-29-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | 妥当なフォーム処理後にimport_fileがnull | エラーを表示し、管理画面_商品管理_売上分析タグ更新CSV登録画面に遷移する |
| M03-29-MSG-003 | エラー | 管理画面上部 | 要ソース確認（variable: $this->getCsvImportMaxRowsExceededMessage()） | CSV行数がADMIN_CSV_IMPORT_MAX_ROWS（5010）以上 | 要ソース確認 |
| M03-29-MSG-004 | エラー | 管理画面上部 | 要ソース確認（variable: $error['message']） | CsvImporterの取込結果に1件以上のエラーがある | 要ソース確認 |
| M03-29-MSG-005 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CsvImporterの取込結果にエラーがない | 完了メッセージを表示し、管理画面_商品管理_売上分析タグ更新CSV登録画面に遷移する |

## M03-30 m03-30_admin_product_product_product_price_csv_import（管理画面_商品管理_セール用価格変更CSV登録）
`functions/pf-eccube3/m03-30_admin_product_product_product_price_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-30-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | POST取込フォームが不正で、ルートフォーム直下のエラーを取得したとき | 要ソース確認 |
| M03-30-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | アップロードファイル取得結果が null のとき | セール用価格変更CSVアップロード画面に遷移する |
| M03-30-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | countCsvRows($formFile) が ADMIN_CSV_IMPORT_MAX_ROWS 以上のとき | セール用価格変更CSVアップロード画面に遷移する |
| M03-30-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | CsvImporter の取込結果が hasError() のとき | 要ソース確認 |
| M03-30-MSG-005 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CsvImporter の取込結果にエラーがないとき（登録正常終了） | セール用価格変更CSVアップロード画面に遷移する |

## M03-32 m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）
`functions/pf-eccube3/m03-32_admin_product_product_simple_high_price_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-32-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | アップロードフォーム（CsvImportType）がバリデーション不正のとき（FormError::getMessage()） | 要ソース確認 |
| M03-32-MSG-002 | エラー | 管理画面上部 | CSVデータが存在しません | アップロードファイル（import_file）がnullのとき | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSV行数（ダブルクォート内改行を除く改行数・ヘッダ行含む）が上限（ADMIN_CSV_IMPORT_MAX_ROWS=5010）以上のとき | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-004 | 警告 | 管理画面上部 | %d行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません） | CSV行の商品コードにセール中の商品規格が存在するとき | 警告を表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-005 | エラー | 管理画面上部 | 要ソース確認 | CSVインポート結果がエラーを含むとき | 要ソース確認 |
| M03-32-MSG-006 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CSVインポート結果にエラーがないとき | 成功メッセージを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-007 | エラー | 管理画面上部 | %d行目: 対象の商品規格がありません。（商品公開ステータスが0かつ高額商品コードが設定された規格のみ対象です） | CSV行の商品コードがセール中/セール外いずれの対象規格にも該当しないとき（存在・一意チェック通過後） | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-008 | エラー | 管理画面上部 | %d 行目の %s ではデータを取得できません。 | CSV行の商品コードに該当するProductClassが存在しないとき（breakAllで取込中断・ロールバック） | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-009 | エラー | 管理画面上部 | %d 行目の商品コードの値 %s は重複して登録されてるため更新できません。 | CSV行の商品コードに該当するProductClassが複数存在するとき（breakAllで取込中断・ロールバック） | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |

## M03-33 m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）
`functions/pf-eccube3/m03-33_admin_product_product_sale_high_price_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-33-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | POST後、CsvImportType の import_file に対する NotBlank または File(maxSize) 制約でフォームが無効になったとき（!$form->isValid()） | 要ソース確認 |
| M03-33-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | フォーム有効後、$form['import_file']->getData() が null のとき | 管理画面_商品管理_セール用高額商品価格変更CSV登録画面に遷移する |
| M03-33-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | countCsvRows($formFile) >= ADMIN_CSV_IMPORT_MAX_ROWS（%maxRecord%）のとき | 管理画面_商品管理_セール用高額商品価格変更CSV登録画面に遷移する |
| M03-33-MSG-004 | 警告 | 管理画面上部 | 要ソース確認 | CSV取込結果 $result->hasInfos() で行毎の情報メッセージがあるとき（発生元は SaleHighPriceImportHandler の2分岐: $currentSaleFlg && !$csvSaleFlg && $csvSellPrice のとき / いずれの条件にも該当しない else 分岐のとき） | 要ソース確認 |
| M03-33-MSG-005 | エラー | 管理画面上部 | 要ソース確認 | CSV取込結果 $result->hasError() が true のとき（静的追跡で到達を確認できた発生元: ヘッダ行なし／データ行なし／列数不正／列欠落／商品コード重複／商品コード不存在） | 要ソース確認 |
| M03-33-MSG-006 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CSV取込結果 $result->hasError() が false（正常終了）のとき | 管理画面_商品管理_セール用高額商品価格変更CSV登録画面に遷移する |

## M03-35 m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）
`functions/pf-eccube3/m03-35_admin_product_product_section_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-35-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | CsvImportType のフォーム検証が失敗した場合（$form->isValid() が false）。ルート直下のフォームエラーを1件ずつ表示 | 要ソース確認 |
| M03-35-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | フォームは有効だが import_file が null（ファイル未添付）の場合 | エラーを表示し、部門更新CSV登録画面に遷移する |
| M03-35-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | アップロードCSVの行数カウントが ADMIN_CSV_IMPORT_MAX_ROWS（5010）以上の場合 | エラーを表示し、部門更新CSV登録画面に遷移する |
| M03-35-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | CsvImporter の取込結果がエラーを1件以上持つ場合（ヘッダ不正・データ空・列数不一致・商品コード必須/不存在・部門コード不存在など）。エラー件数分だけ表示 | 要ソース確認 |
| M03-35-MSG-005 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CsvImporter の取込結果にエラーが1件も無い場合 | 登録完了を表示し、部門更新CSV登録画面に遷移する |

## M03-38 m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）
`functions/pf-eccube3/m03-38_admin_product_product_status_csv.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-38-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | POST後にフォームが無効で、親フォームのgetErrors()（deep=false）から取得できるエラー（CSRFトークン不正等の親直下エラー）があるとき | 要ソース確認 |
| M03-38-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | フォーム有効後、import_fileのデータがnullのとき | 商品公開CSV登録画面に遷移する |
| M03-38-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | countCsvRows(import_file)がADMIN_CSV_IMPORT_MAX_ROWS以上のとき | 商品公開CSV登録画面に遷移する |
| M03-38-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | CsvImporter::import()の結果でhasError()がtrueのとき | 要ソース確認 |
| M03-38-MSG-005 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CsvImporter::import()の結果でhasError()がfalseのとき | 商品公開CSV登録画面に遷移する |

## M03-40 m03-40_admin_product_product_shelf_number_csv_import（管理画面_商品管理_棚番号更新CSV登録）
`functions/pf-eccube3/m03-40_admin_product_product_shelf_number_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-40-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | CSV取込フォーム送信後、フォームが無効（!$form->isValid()）のとき、各フォームエラーごと | 要ソース確認 |
| M03-40-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | アップロードファイルが取得できない（$formFile === null）のとき | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する |
| M03-40-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSV行数が上限（ADMIN_CSV_IMPORT_MAX_ROWS）以上のとき | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する |
| M03-40-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | インポータがエラーを返したとき（$result->hasError()。取込前検証＝ヘッダ行不一致/データ行無し、または行別検証エラー）、エラーごと | 要ソース確認 |
| M03-40-MSG-005 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CSV取込が正常終了したとき（$result->hasError() が false） | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する |

## M03-41 m03-41_admin_product_product_category_csv_import（管理画面_商品管理_カテゴリCSV登録）
`functions/pf-eccube3/m03-41_admin_product_product_category_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-41-MSG-001 | エラー | 画面内（アップロードフォーム下のエラー一覧） | CSVのフォーマットが一致しません | CSVが解析不能（getImportData が false）、または必須ヘッダが不足しているとき | カテゴリCSV登録画面に留まる |
| M03-41-MSG-002 | エラー | 画面内（アップロードフォーム下のエラー一覧） | CSVデータが存在しません | データ行が1行未満のとき（size < 1） | カテゴリCSV登録画面に留まる |
| M03-41-MSG-003 | エラー | 画面内（アップロードフォーム下のエラー一覧） | 要ソース確認 | カテゴリID列が非空白かつ数字のみでないとき | 要ソース確認 |
| M03-41-MSG-004 | エラー | 画面内（アップロードフォーム下のエラー一覧） | 要ソース確認 | カテゴリIDが数字だが該当カテゴリが存在しないとき | 要ソース確認 |
| M03-41-MSG-005 | エラー | 画面内（アップロードフォーム下のエラー一覧） | 要ソース確認 | カテゴリIDと親カテゴリIDが == 比較で一致するとき（緩い比較のため数値同値の別表記文字列でも一致し得る: CsvImportController.php:729） | 要ソース確認 |
| M03-41-MSG-006 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | 削除フラグ行のカテゴリ削除時に外部キー参照が残っているとき（ForeignKeyConstraintViolationException） | エラーを表示し、カテゴリCSV登録画面に留まる |
| M03-41-MSG-007 | エラー | 画面内（アップロードフォーム下のエラー一覧） | 要ソース確認 | カテゴリ名列が未設定/空白のとき | 要ソース確認 |
| M03-41-MSG-008 | エラー | 画面内（アップロードフォーム下のエラー一覧） | 要ソース確認 | 親カテゴリIDが数字でない/該当親が存在しない/親なしなのに階層が1でないとき | 要ソース確認 |
| M03-41-MSG-009 | エラー | 画面内（アップロードフォーム下のエラー一覧） | 要ソース確認 | カテゴリ階層が eccube_category_nest_level（最大レベル）を超えたとき | 要ソース確認 |
| M03-41-MSG-010 | インフォ(成功) | 管理画面上部 | CSVファイルをアップロードしました | 全行の取込がエラーなく完了しコミットされたとき | カテゴリCSV登録画面に留まる |
| M03-41-MSG-011 | エラー(バリデーション) | 入力項目直下（form_errors） | 要ソース確認 | CsvImportType のフォーム検証に失敗したとき（NotBlank=未選択／File maxSize=サイズ上限超過。ファイル種別のサーバ側制約は存在しない: CsvImportType.php:52-57） | カテゴリCSV登録画面に留まる |
| M03-41-MSG-012 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | CSV行のcategory_del_flgが1で、カテゴリ削除時にForeignKeyConstraintViolationExceptionが発生したとき | エラーを表示し、カテゴリCSV登録画面に留まる |

## M03-44 M03-44（低価格帯カード価格変更CSV登録）
`functions/ec-cube-enterprise/m03-44_admin_product_product_simple_low_price_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-44-MSG-001 | エラー | 管理画面上部 | 要ソース確認（variable: $error->getMessage()） | POST後、CsvImportTypeのフォームが不正で、ルートフォーム直下のエラーを取得したとき | 要ソース確認 |
| M03-44-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | フォームのimport_file取得結果がnullのとき | エラーを表示し、M03-44（低価格帯カード価格変更CSV登録）画面に遷移する |
| M03-44-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSV行数がADMIN_CSV_IMPORT_MAX_ROWS以上のとき | エラーを表示し、M03-44（低価格帯カード価格変更CSV登録）画面に遷移する |
| M03-44-MSG-004 | エラー | 管理画面上部 | 要ソース確認（variable: $error['message']） | CsvImporterの取込結果がhasError()のとき | 要ソース確認 |
| M03-44-MSG-005 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CsvImporterの取込結果にエラーがないとき | 登録完了を表示し、M03-44（低価格帯カード価格変更CSV登録）画面に遷移する |
| M03-44-MSG-006 | 警告 | 管理画面上部 | %d行目: セール中商品のため、販売価格は変更されません。（基準価格・買取価格は更新しました） | 取込成功時、対象行にセール中の商品規格があり、ハンドラが情報メッセージを追加したとき | 情報を表示し、M03-44（低価格帯カード価格変更CSV登録）画面に遷移する |

## M03-45 m03-45_admin_product_product_category_list（管理画面_商品管理_カテゴリ一覧）
`functions/pf-eccube3/m03-45_admin_product_product_category_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M03-45-MSG-001 | 確認 | 画面中央(ダイアログ/モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 子カテゴリ・商品カテゴリ紐付けが無いカテゴリ行の削除アイコンを押下し、DeleteModal が表示されたとき（shown.bs.modal で当該行の data-message を本文へ差し込む） | カテゴリを削除し、管理画面_商品管理_カテゴリ一覧画面に遷移する。キャンセル時は同画面に留まる |
| M03-45-MSG-002 | 確認(モーダル) | 削除確認モーダル内 | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除ボタン押下で削除確認モーダルを表示するとき（data-messageをJSでモーダル本文へ挿入 category.twig:120-127） | カテゴリを削除し、管理画面_商品管理_カテゴリ一覧画面に遷移する。キャンセル時は同画面に留まる |
| M03-45-MSG-003 | 確認(confirm) | ブラウザ確認ダイアログ | 本当に並べ替えを実行してよろしいですか? | ドラッグで順序を変更した直後、または上下矢印クリック時のwindow.confirm | 並べ替えを実行し、管理画面_商品管理_カテゴリ一覧画面に留まる。キャンセル時は変更せず同画面に留まる |

## M04-01 M04-01（在庫検索/一覧）
`functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-01-MSG-003 | エラー | 管理画面上部 | 検索条件を指定してからCSV出力してください。 | セッション検索条件が空（$viewData === []） | 在庫検索/一覧画面に遷移する |
| M04-01-MSG-004 | エラー | 管理画面上部 | 検索条件を指定してからCSV出力してください。 | セッション検索条件のフォーム復元で例外を捕捉したとき | 在庫検索/一覧画面に遷移する |
| M04-01-MSG-007 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | 保存POSTの検索フォームが未送信または無効のとき（CSRF含む） | 在庫検索/一覧画面に遷移する |
| M04-01-MSG-008 | エラー | 管理画面上部 | 検索パターン名を入力して下さい。 | pattern_nameが空のとき | 在庫検索/一覧画面に遷移する |
| M04-01-MSG-009 | インフォ(成功) | 管理画面上部 | 検索パターン名を登録しました。 | 検索パターンをpersistしてflushした後 | 在庫検索/一覧画面に遷移する |
| M04-01-MSG-010 | エラー | 管理画面上部 | 検索パターン名を削除できませんでした。 | CSRFトークンが不正のとき | 在庫検索/一覧画面に遷移する |
| M04-01-MSG-011 | エラー | 管理画面上部 | 検索パターン名を削除できませんでした。 | patternIdに対応する検索パターンが存在しないとき | 在庫検索/一覧画面に遷移する |
| M04-01-MSG-012 | インフォ(成功) | 管理画面上部 | 検索パターン名を削除しました。 | 検索パターンをremoveしてflushした後 | 在庫検索/一覧画面に遷移する |
| M04-01-MSG-013 | エラー | 管理画面上部 | 指定された在庫が見つかりませんでした。 | POST値から抽出したproductStockIdsが空（$ids === []） | 在庫検索/一覧画面に遷移する |
| M04-01-MSG-014 | エラー | ブラウザダイアログ | 編集権限を持っていない店舗の在庫が選択されています。<br>編集権限のある店舗の在庫のみ選択してください。 | 選択在庫に編集権限のない店舗の在庫が含まれる | 在庫検索/一覧画面に留まる |
| M04-01-MSG-015 | エラー | ブラウザダイアログ | 複数の店舗の商品規格が選択されています。<br>同一の店舗の在庫のみ選択してください。 | 複数店舗の在庫が選択されている | 在庫検索/一覧画面に留まる |
| M04-01-MSG-016 | エラー | ブラウザダイアログ | 編集権限を持っていない店舗の在庫が選択されています。<br>編集権限のある店舗の在庫のみ選択してください。 | 選択在庫に編集権限のない店舗の在庫が含まれる | 在庫検索/一覧画面に留まる |
| M04-01-MSG-017 | エラー | ブラウザダイアログ | 複数の店舗の商品規格が選択されています。<br>同一の店舗の在庫のみ選択してください。 | 複数店舗の在庫が選択されている | 在庫検索/一覧画面に留まる |
| M04-01-MSG-018 | エラー | ブラウザダイアログ | 在庫数が0の在庫が選択されています。<br>在庫数が1以上の在庫のみ選択してください。 | 選択在庫に在庫数0以下の在庫が含まれる（data-stock<=0） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-019 | エラー | ブラウザダイアログ | 編集権限を持っていない店舗の在庫が選択されています。<br>編集権限のある店舗の在庫のみ選択してください。 | 選択在庫に編集権限のない店舗の在庫が含まれる | 在庫検索/一覧画面に留まる |
| M04-01-MSG-020 | エラー | ブラウザダイアログ | 複数の店舗の商品規格が選択されています。<br>在庫分割は同一の店舗の在庫のみ選択してください。 | 複数店舗の在庫が選択されている | 在庫検索/一覧画面に留まる |
| M04-01-MSG-021 | エラー | ブラウザダイアログ | 在庫数が0の在庫が選択されています。<br>在庫数が1以上の在庫のみ選択してください。 | 選択在庫に在庫数0以下の在庫が含まれる（data-stock<=0） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-022 | エラー | ブラウザダイアログ | 在庫分割は1件のみ選択してください。 | 2件以上選択されている | 在庫検索/一覧画面に留まる |
| M04-01-MSG-023 | エラー | ブラウザダイアログ | 編集権限を持っていない店舗の在庫が選択されています。<br>編集権限のある店舗の在庫のみ選択してください。 | 選択在庫に編集権限のない店舗の在庫が含まれる | 在庫検索/一覧画面に留まる |
| M04-01-MSG-024 | エラー | ブラウザダイアログ | 複数の店舗の商品規格が選択されています。<br>在庫結合は同一の店舗の在庫のみ選択してください。 | 複数店舗の在庫が選択されている | 在庫検索/一覧画面に留まる |
| M04-01-MSG-025 | エラー | ブラウザダイアログ | 在庫結合は1件のみ選択してください。 | 2件以上選択されている | 在庫検索/一覧画面に留まる |
| M04-01-MSG-026 | 警告 | 画面中央(ダイアログ) | 編集権限を持っていない店舗の在庫が選択されています。<br>編集権限のある店舗の在庫のみ選択してください。 | 在庫一括編集ボタン押下時、選択チェックボックス(.row-check:checked)に data-editable !== true の店舗在庫が含まれるとき（hasUnauthorizedShop()が真 / twig:768-772） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-027 | 警告 | 画面中央(ダイアログ) | 複数の店舗の商品規格が選択されています。<br>同一の店舗の在庫のみ選択してください。 | 在庫一括編集ボタン押下時、選択在庫の data-shop-id が2種類以上のとき（isSameShop()が偽 / twig:761-766） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-028 | 警告 | 画面中央(ダイアログ) | 編集権限を持っていない店舗の在庫が選択されています。<br>編集権限のある店舗の在庫のみ選択してください。 | 在庫移動登録／在庫振替登録ボタン押下時、選択在庫に data-editable !== true の店舗在庫が含まれるとき（hasUnauthorizedShop()が真） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-029 | 警告 | 画面中央(ダイアログ) | 複数の店舗の商品規格が選択されています。<br>同一の店舗の在庫のみ選択してください。 | 在庫移動登録／在庫振替登録ボタン押下時、選択在庫の data-shop-id が2種類以上のとき（isSameShop()が偽） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-030 | 警告 | 画面中央(ダイアログ) | 在庫数が0の在庫が選択されています。<br>在庫数が1以上の在庫のみ選択してください。 | 在庫移動登録／在庫振替登録ボタン押下時、選択在庫に data-stock <= 0 の在庫が含まれるとき（hasZeroStock()が真 / twig:774-778） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-031 | 警告 | 画面中央(ダイアログ) | 編集権限を持っていない店舗の在庫が選択されています。<br>編集権限のある店舗の在庫のみ選択してください。 | 在庫分割登録ボタン押下時、選択在庫に data-editable !== true の店舗在庫が含まれるとき（hasUnauthorizedShop()が真） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-032 | 警告 | 画面中央(ダイアログ) | 複数の店舗の商品規格が選択されています。<br>在庫分割は同一の店舗の在庫のみ選択してください。 | 在庫分割登録ボタン押下時、選択在庫の data-shop-id が2種類以上のとき（isSameShop()が偽） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-033 | 警告 | 画面中央(ダイアログ) | 在庫数が0の在庫が選択されています。<br>在庫数が1以上の在庫のみ選択してください。 | 在庫分割登録ボタン押下時、選択在庫に data-stock <= 0 の在庫が含まれるとき（hasZeroStock()が真） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-034 | 警告 | 画面中央(ダイアログ) | 在庫分割は1件のみ選択してください。 | 在庫分割登録ボタン押下時、選択件数が1件でないとき（ids.length !== 1、権限・同一店舗・在庫0の各判定を通過後） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-035 | 警告 | 画面中央(ダイアログ) | 編集権限を持っていない店舗の在庫が選択されています。<br>編集権限のある店舗の在庫のみ選択してください。 | 在庫結合登録ボタン押下時、選択在庫に data-editable !== true の店舗在庫が含まれるとき（hasUnauthorizedShop()が真） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-036 | 警告 | 画面中央(ダイアログ) | 複数の店舗の商品規格が選択されています。<br>在庫結合は同一の店舗の在庫のみ選択してください。 | 在庫結合登録ボタン押下時、選択在庫の data-shop-id が2種類以上のとき（isSameShop()が偽） | 在庫検索/一覧画面に留まる |
| M04-01-MSG-037 | 警告 | 画面中央(ダイアログ) | 在庫結合は1件のみ選択してください。 | 在庫結合登録ボタン押下時、選択件数が1件でないとき（ids.length !== 1、権限・同一店舗の各判定を通過後） | 在庫検索/一覧画面に留まる |

## M04-02 M04-02（在庫編集機能）
`functions/ec-cube-enterprise/m04-02_admin_stock_stock_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-02-MSG-001 | エラー | 管理画面上部 | 保存に失敗しました | POST後、フォームが未送信またはバリデーション不正のとき | 在庫承認（編集）画面に留まる |
| M04-02-MSG-002 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | POST後、ログインメンバーが対象店舗を編集する権限を持たないとき（!$Member->isEditableShop($BaseInfo)） | 在庫承認（編集）画面に留まる |
| M04-02-MSG-003 | エラー | 管理画面上部 | 要ソース確認 | 在庫承認保存処理、または通知先メンバー指定時の承認通知メール送信で例外が発生したとき | 要ソース確認 |
| M04-02-MSG-004 | インフォ(成功) | 管理画面上部 | 保存しました | 在庫承認保存処理、および通知先メンバー指定時の承認通知メール送信が例外なく完了したとき | 在庫承認（編集）画面に遷移する |
| M04-02-MSG-005 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 入庫の場合は仕入単価を入力してください | 入庫区分を選択し、仕入単価がnullでPOST送信したとき | 登録せず在庫承認（編集）画面に留まる |

## M04-03 M04-03（在庫一括編集）
`functions/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-03-MSG-001 | エラー | 管理画面上部 | 指定された在庫が見つかりませんでした。 | productStockIdsから取得したProductStocksが空 | 在庫一括編集画面に遷移する |
| M04-03-MSG-002 | エラー | 管理画面上部 | 選択した在庫は同一店舗のものである必要があります。 | isSameBaseInfo(ProductStocks)がfalse（取得した在庫が同一BaseInfoに属さない） | 在庫一覧画面に遷移する |
| M04-03-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | extractProductStockIds(request)が空配列 | 在庫一括編集画面に遷移する |
| M04-03-MSG-004 | エラー | 管理画面上部 | 保存に失敗しました | POSTのproductStockIdsに対応するProductStocksが空 | 在庫一括編集画面に遷移する |
| M04-03-MSG-005 | エラー | 管理画面上部 | 選択した在庫は同一店舗のものである必要があります。 | isSameBaseInfo(ProductStocks)がfalse（POSTで取得した在庫が同一BaseInfoに属さない） | 在庫一覧画面に遷移する |
| M04-03-MSG-006 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | Member::isEditableShop(BaseInfos[0])がfalse（ログインMemberが先頭在庫のBaseInfoを編集不可） | 在庫一覧画面に遷移する |
| M04-03-MSG-007 | エラー | 管理画面上部 | 保存に失敗しました | formが未送信、またはisValid()がfalse | 在庫一括編集画面に留まる |
| M04-03-MSG-008 | エラー | 管理画面上部 | 保存に失敗しました | stock_change_type_detailまたはapproval_notification_target_membersがnull | 在庫一括編集画面に留まる |
| M04-03-MSG-009 | エラー | 管理画面上部 | 要ソース確認 | StockBulkApprovalStoreActionの処理または承認通知メール送信中にThrowableを捕捉 | 要ソース確認 |
| M04-03-MSG-010 | インフォ(成功) | 管理画面上部 | 保存しました | StockBulkApprovalStoreActionの処理および承認通知メール送信が例外なく完了 | 在庫一括編集画面に遷移する |
| M04-03-MSG-011 | エラー(バリデーション) | 入力項目直下 | 入庫の場合は仕入単価を入力してください | stock_change_type_detailが入庫、かつpurchase_priceがnull | 在庫一括編集画面に留まる |
| M04-03-MSG-012 | エラー(バリデーション) | 入力項目直下 | 入庫の場合は1以上の数値を入力してください | stock_change_type_detailが入庫、かつstock_change_quantityが1未満 | 在庫一括編集画面に留まる |
| M04-03-MSG-013 | エラー(バリデーション) | 入力項目直下 | 廃棄の場合は-1以下の数値を入力してください | stock_change_type_detailが廃棄、かつstock_change_quantityが-1より大きい | 在庫一括編集画面に留まる |
| M04-03-MSG-014 | エラー(バリデーション) | 入力項目直下 | 在庫増減数と現在の在庫数の合算値が8桁を超えています | stock_change_type_detailが入庫、かつbccomp(stockAfterChange,maxStock,0)が0より大きい | 在庫一括編集画面に留まる |
| M04-03-MSG-015 | エラー(バリデーション) | 入力項目直下 | 在庫増減数と現在の在庫数の合算値が0を下回ります | stock_change_type_detailが廃棄、かつabs(stock_change_quantity)がcurrentStockを超過 | 在庫一括編集画面に留まる |
| M04-03-MSG-016 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | 登録送信時、在庫変動区分が未選択のとき（NotBlank違反） | 在庫一括編集画面に留まる |
| M04-03-MSG-017 | エラー(バリデーション) | 入力項目直下 | 要素は{{ limit }}個以上でなければなりません。 | 登録送信時、承認通知先メンバーが1件も選択されていないとき（Count(min:1)違反。empty_data=[]） | 在庫一括編集画面に留まる |
| M04-03-MSG-018 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | 登録送信時、在庫変動理由または在庫増減数が未入力のとき（NotBlank違反） | 在庫一括編集画面に留まる |
| M04-03-MSG-019 | エラー(バリデーション) | 入力項目直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | 登録送信時、在庫変動理由が16384文字を超えるとき（Length max違反。eccube_product_stock_change_reason_max_len） | 在庫一括編集画面に留まる |
| M04-03-MSG-020 | エラー(バリデーション) | 入力項目直下 | この値は{{ min }}以上{{ max }}以下でなければなりません。 | 登録送信時、在庫増減数が-99999999〜99999999、仕入単価が0〜999999999の範囲外のとき（Range違反） | 在庫一括編集画面に留まる |
| M04-03-MSG-021 | エラー(バリデーション) | 入力項目直下 | 数値で入力してください。 | 登録送信時、数値として解釈できない入力のとき（NumberType変換失敗。invalid_messageデフォルト） | 在庫一括編集画面に留まる |

## M04-04 M04-04（在庫情報CSV出力）
`functions/ec-cube-enterprise/m04-04_admin_stock_stock_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-04-MSG-001 | エラー | 管理画面上部 | 検索条件を指定してからCSV出力してください。 | セッション検索条件が空（$viewData === []） | エラーを表示して在庫一覧画面に遷移する |
| M04-04-MSG-002 | エラー | 管理画面上部 | 検索条件を指定してからCSV出力してください。 | セッション検索条件のフォーム復元で例外を捕捉したとき | エラーを表示して在庫一覧画面に遷移する |

## M04-08 M04-08（在庫移動・振替検索/一覧）
`functions/ec-cube-enterprise/m04-08_admin_stock_stock_move_transfer_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-08-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | フォーム未送信またはフォーム不正 | 要ソース確認 |
| M04-08-MSG-002 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | import_fileがnull | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-003 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSV行数がADMIN_CSV_IMPORT_MAX_ROWS以上 | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-004 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | 移動元拠点があり、ログインメンバーが編集不可 | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-005 | エラー | 管理画面上部 | 要ソース確認 | StockMoveCsvImporterの結果がhasError() | 要ソース確認 |
| M04-08-MSG-006 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CSV取込成功 | 在庫移動・振替検索/一覧画面または移動ピック・出庫承認申請画面に遷移する |
| M04-08-MSG-007 | エラー | 管理画面上部 | 要ソース確認 | フォーム未送信またはフォーム不正 | 要ソース確認 |
| M04-08-MSG-008 | エラー | 管理画面上部 | CSVのフォーマットが一致しません | import_fileがnull | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-009 | エラー | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSV行数がADMIN_CSV_IMPORT_MAX_ROWS以上 | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-010 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | 振替拠点があり、ログインメンバーが編集不可 | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-011 | エラー | 管理画面上部 | 要ソース確認 | StockTransferCsvImporterの結果がhasError() | 要ソース確認 |
| M04-08-MSG-012 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CSV取込成功 | 在庫移動・振替検索/一覧画面または在庫振替完了画面に遷移する |
| M04-08-MSG-013 | エラー | 管理画面上部 | 1つ以上の在庫移動情報を選択してください。 | idsを整数化・0除外後に空 | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-014 | エラー | 管理画面上部 | 要ソース確認 | validateReturnListExportIdsがエラー配列を返す | 要ソース確認 |
| M04-08-MSG-015 | エラー | 管理画面上部 | 1つ以上の在庫移動・振替を選択してください。 | idsを整数化・0除外後に空 | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-016 | エラー | 管理画面上部 | 要ソース確認 | validateBarcodeCsvExportIdsがエラー配列を返す | 要ソース確認 |
| M04-08-MSG-017 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークンが不正 | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-018 | エラー | 管理画面上部 | 1つ以上の移動を選択してください。 | idsのいずれかが文字列の正整数ではない | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-019 | エラー | 管理画面上部 | 1つ以上の移動を選択してください。 | idsを整数化・重複除外後に空 | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-020 | エラー | 管理画面上部 | 1つ以上の移動を選択してください。 | 取得した在庫移動・振替件数が選択ID件数と不一致 | 在庫移動・振替検索/一覧画面に遷移する |
| M04-08-MSG-021 | エラー | 管理画面上部 | 要ソース確認 | StockMoveInstructionCreateActionがStockMoveInstructionCreateExceptionを送出 | 要ソース確認 |
| M04-08-MSG-022 | インフォ(成功) | 管理画面上部 | 在庫移動指示を作成しました。 | 在庫移動指示の作成成功 | 在庫移動指示詳細画面に遷移する |
| M04-08-MSG-023 | 警告 | 画面中央(ダイアログ) | 1つ以上の移動を選択してください。 | 一覧の行チェックボックス(.js-move-transfer-row-check)が1件も選択されていない状態でボタンを押下したとき | 在庫移動・振替検索/一覧画面に留まる |
| M04-08-MSG-024 | 警告 | 画面中央(ダイアログ) | 1つ以上の在庫移動・振替を選択してください。 | 一覧の行チェックボックス(.js-move-transfer-row-check)が1件も選択されていない状態でボタンを押下したとき | 在庫移動・振替検索/一覧画面に留まる |
| M04-08-MSG-025 | 警告 | 画面中央(ダイアログ) | 1つ以上の在庫移動情報を選択してください。 | 一覧の行チェックボックス(.js-move-transfer-row-check)が1件も選択されていない状態でボタンを押下したとき | 在庫移動・振替検索/一覧画面に留まる |
| M04-08-MSG-026 | 警告 | 画面中央(ダイアログ) | 1つ以上の在庫移動情報を選択してください。 | 一覧の行チェックボックス(.js-move-transfer-row-check)が1件も選択されていない状態でボタンを押下したとき | 在庫移動・振替検索/一覧画面に留まる |
| M04-08-MSG-027 | 警告 | 画面中央(ダイアログ) | ポップアップがブロックされているため、戻しリストPDFを開けませんでした。ブラウザの設定を確認してください。 | 対象選択済みで押下し window.open による別ウィンドウ生成が失敗（ポップアップブロック）して popupWindow が偽値のとき | 在庫移動・振替検索/一覧画面に留まる |
| M04-08-MSG-028 | 警告 | 画面中央(ダイアログ) | 戻しリストPDF用データの取得に失敗しました。 | Ajax POST(admin_stock_move_transfer_return_list_pdf_export) が成功応答したが response.success が true でない、または html が無く、かつ response.redirectUrl も無いとき | 在庫移動・振替検索/一覧画面に留まる |
| M04-08-MSG-029 | 警告 | 画面中央(ダイアログ) | 戻しリストPDF用データの取得に失敗しました。 | Ajax POST(admin_stock_move_transfer_return_list_pdf_export) が通信エラー等で失敗し .fail コールバックに入ったとき | 在庫移動・振替検索/一覧画面に留まる |
| M04-08-MSG-030 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 終了日は、開始日より大きく設定してください | POST_SUBMIT時、登録日・出庫日・入庫日の各開始日が対応する終了日より後 | 在庫移動・振替検索/一覧画面に留まる |

## M04-09 M04-09（在庫移動・振替登録/編集）
`functions/ec-cube-enterprise/m04-09_admin_stock_stock_move_transfer_register_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-09-MSG-001 | エラー | 管理画面上部 | 保存に失敗しました | フォームが未送信または不正 | 移動初期登録画面に留まる |
| M04-09-MSG-002 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | 出庫元店舗が存在し、ログイン会員に編集権限がない | 在庫一覧画面に遷移する |
| M04-09-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | 在庫移動登録処理が例外を送出 | 移動初期登録画面に留まる |
| M04-09-MSG-004 | インフォ(成功) | 管理画面上部 | 保存しました | 在庫移動登録処理が正常終了 | 移動ピック・出庫承認申請画面に遷移する |
| M04-09-MSG-005 | エラー | 管理画面上部 | 保存に失敗しました | フォームが未送信または不正 | 移動ピック・出庫承認申請画面に留まる |
| M04-09-MSG-006 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | 出庫元店舗がnull、またはログイン会員に編集権限がない | 在庫一覧画面に遷移する |
| M04-09-MSG-007 | エラー | 管理画面上部 | 保存に失敗しました | 出庫承認申請更新処理が例外を送出 | 移動ピック・出庫承認申請画面に留まる |
| M04-09-MSG-008 | インフォ(成功) | 管理画面上部 | 保存しました | 出庫承認申請更新処理が正常終了 | 同一店舗は在庫移動完了画面、その他は移動出庫承認画面に遷移する |
| M04-09-MSG-009 | エラー | 管理画面上部 | ピック表を出力できるステータスではありません。 | 在庫移動ステータスがSTATUS_NEWでない | エラー情報をJSONで返す |
| M04-09-MSG-010 | エラー | 管理画面上部 | ピック表を出力する権限がありません。 | 出庫元店舗がnull | エラー情報をJSONで返す |
| M04-09-MSG-011 | エラー | 管理画面上部 | ピック表を出力する権限がありません。 | 出庫元店舗がログイン会員の編集可能店舗に含まれない | エラー情報をJSONで返す |
| M04-09-MSG-012 | エラー | 管理画面上部 | 出庫承認待ちの状態でないため、操作できません。 | 在庫移動が出庫承認待ち状態でない | 移動ピック・出庫承認申請画面に遷移する |
| M04-09-MSG-013 | エラー | 管理画面上部 | 保存に失敗しました | modeが許可された承認モードに含まれない | 移動出庫承認画面に遷移する |
| M04-09-MSG-014 | エラー | 管理画面上部 | 要ソース確認 | フォーム不正。却下時は最初のフォームエラー、その他は保存エラーキーを使用 | 移動出庫承認画面に遷移する |
| M04-09-MSG-015 | エラー | 管理画面上部 | 承認権限がありません。 | ログイン会員が承認権限を持たない | 移動出庫承認画面に遷移する |
| M04-09-MSG-016 | エラー | 管理画面上部 | 保存に失敗しました | 出庫承認却下処理が例外を送出 | 移動出庫承認画面に遷移する |
| M04-09-MSG-017 | インフォ(成功) | 管理画面上部 | 却下しました。 | 出庫承認却下処理が正常終了 | 移動入庫承認申請画面に遷移する |
| M04-09-MSG-018 | エラー | 管理画面上部 | 保存に失敗しました | 出庫承認処理が例外を送出 | 移動出庫承認画面に遷移する |
| M04-09-MSG-019 | インフォ(成功) | 管理画面上部 | 承認しました。 | 出庫承認処理が正常終了 | 移動入庫承認申請画面に遷移する |
| M04-09-MSG-020 | エラー | 管理画面上部 | 保存に失敗しました | 移動先店舗がnull | 移動ピック・出庫承認申請画面に遷移する |
| M04-09-MSG-021 | エラー | 管理画面上部 | 保存に失敗しました | CSRFトークンが不正 | 移動入庫承認申請画面に遷移する |
| M04-09-MSG-022 | エラー | 管理画面上部 | 要ソース確認 | 差分商品追加処理がInvalidArgumentExceptionを送出 | 移動入庫承認申請画面に遷移する |
| M04-09-MSG-023 | エラー | 管理画面上部 | 保存に失敗しました | 移動先店舗がnull | 移動ピック・出庫承認申請画面に遷移する |
| M04-09-MSG-024 | エラー | 管理画面上部 | 保存に失敗しました | フォームが未送信または不正 | 移動入庫承認申請画面に留まる |
| M04-09-MSG-025 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | ログイン会員に移動先店舗の編集権限がない | 在庫一覧画面に遷移する |
| M04-09-MSG-026 | エラー | 管理画面上部 | 保存に失敗しました | 入庫承認申請更新処理が例外を送出 | 移動入庫承認申請画面に留まる |
| M04-09-MSG-027 | インフォ(成功) | 管理画面上部 | 保存しました | 入庫承認申請更新処理が正常終了 | 移動入庫承認画面に遷移する |
| M04-09-MSG-028 | エラー | 管理画面上部 | 保存に失敗しました | modeが許可された入庫承認モードに含まれない | 移動入庫承認画面に遷移する |
| M04-09-MSG-029 | エラー | 管理画面上部 | 保存に失敗しました | フォームが不正 | 移動入庫承認画面に遷移する |
| M04-09-MSG-030 | エラー | 管理画面上部 | 承認権限がありません。 | ログイン会員が承認権限を持たない | 移動入庫承認画面に遷移する |
| M04-09-MSG-031 | エラー | 管理画面上部 | 保存に失敗しました | 入庫再確認処理が例外を送出 | 移動入庫承認画面に遷移する |
| M04-09-MSG-032 | エラー | 管理画面上部 | 保存に失敗しました | 入庫承認処理が例外を送出 | 移動入庫承認画面に遷移する |
| M04-09-MSG-033 | インフォ(成功) | 管理画面上部 | 承認しました。 | 入庫承認処理が正常終了 | 在庫移動完了画面に遷移する |
| M04-09-MSG-034 | エラー | 管理画面上部 | 戻しリストPDFを出力できるステータスではありません。 | isReturnListPdfExportAllowed()がfalse | エラー情報をJSONで返す |
| M04-09-MSG-035 | エラー | 管理画面上部 | 要ソース確認 | 戻しリスト出力ID検証サービスがエラー配列を返す | エラー情報をJSONで返す |
| M04-09-MSG-036 | エラー | 管理画面上部 | 保存に失敗しました | フォームが未送信または不正 | 在庫振替初期登録画面に留まる |
| M04-09-MSG-037 | エラー | 管理画面上部 | 承認待ちの在庫振替ではありません。または既に処理済みです。 | 在庫振替ステータスから対応画面ルートを取得できない | 在庫履歴一覧画面に遷移する |
| M04-09-MSG-038 | エラー | 管理画面上部 | 保存に失敗しました | 在庫振替登録処理が例外を送出 | 在庫振替初期登録画面に留まる |
| M04-09-MSG-039 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | ログイン会員に基準店舗の編集権限がない | 在庫一覧画面に遷移する |
| M04-09-MSG-040 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | 振替元在庫の店舗が存在し、ログイン会員に編集権限がない | 在庫一覧画面に遷移する |
| M04-09-MSG-041 | エラー | 管理画面上部 | 保存に失敗しました | 在庫振替登録処理が例外を送出 | 在庫振替初期登録画面に留まる |
| M04-09-MSG-042 | インフォ(成功) | 管理画面上部 | 保存しました | 在庫振替登録処理が正常終了 | 在庫振替承認画面に遷移する |
| M04-09-MSG-043 | エラー | 管理画面上部 | 保存に失敗しました | modeが許可された承認モードに含まれない | 在庫振替承認画面に遷移する |
| M04-09-MSG-044 | エラー | 管理画面上部 | 要ソース確認 | フォームが未送信または不正 | 在庫振替承認画面に留まる |
| M04-09-MSG-045 | エラー | 管理画面上部 | 承認権限がありません。 | ログイン会員が承認権限を持たない | 在庫振替承認画面に遷移する |
| M04-09-MSG-046 | エラー | 管理画面上部 | 保存に失敗しました | 在庫振替却下処理が例外を送出 | 在庫振替承認画面に遷移する |
| M04-09-MSG-047 | インフォ(成功) | 管理画面上部 | 却下しました。 | 在庫振替却下処理が正常終了 | 在庫振替完了画面に遷移する |
| M04-09-MSG-048 | エラー | 管理画面上部 | 保存に失敗しました | 在庫振替承認処理が例外を送出 | 在庫振替承認画面に遷移する |
| M04-09-MSG-049 | インフォ(成功) | 管理画面上部 | 承認しました。 | 在庫振替承認処理が正常終了 | 在庫振替完了画面に遷移する |
| M04-09-MSG-050 | 要ソース確認 | 欠品CSV取込モーダル内 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | 要ソース確認 |
| M04-09-MSG-051 | 要ソース確認 | 欠品CSV取込モーダル内 | CSVファイルを選択してください。 | CSVファイル未選択 | 要ソース確認 |
| M04-09-MSG-052 | 要ソース確認 | 欠品CSV取込モーダル内 | 欠品CSV登録可能なステータスではありません。 | 在庫移動ステータスがSTATUS_NEWでない | 要ソース確認 |
| M04-09-MSG-053 | 要ソース確認 | 欠品CSV取込モーダル内 | 保存に失敗しました | CSV取込処理がThrowableを送出 | 要ソース確認 |
| M04-09-MSG-054 | 要ソース確認 | 欠品CSV取込モーダル内 | 要ソース確認 | 取込結果にエラーが含まれる | 要ソース確認 |
| M04-09-MSG-055 | 要ソース確認 | 差分CSV取込モーダル内 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | 要ソース確認 |
| M04-09-MSG-056 | 要ソース確認 | 差分CSV取込モーダル内 | CSVファイルを選択してください。 | CSVファイル未選択 | 要ソース確認 |
| M04-09-MSG-057 | 要ソース確認 | 差分CSV取込モーダル内 | 差分CSV登録可能なステータスではありません。 | 在庫移動ステータスがSTATUS_MOVINGでない | 要ソース確認 |
| M04-09-MSG-058 | 要ソース確認 | 差分CSV取込モーダル内 | 保存に失敗しました | CSV取込処理がThrowableを送出 | 要ソース確認 |
| M04-09-MSG-059 | 要ソース確認 | 差分CSV取込モーダル内 | 要ソース確認 | 取込結果にエラーが含まれる | 要ソース確認 |
| M04-09-MSG-060 | 要ソース確認 | 画面上部フラッシュ | 保存に失敗しました | 対象データの移動振替区分が振替(MOVE_TRANSFER_TYPE_TRANSFER)でない | 要ソース確認 |
| M04-09-MSG-061 | 要ソース確認 | JSアラート | ポップアップがブロックされているため、ピック表を開けませんでした。ブラウザの設定を確認してください。 | ポップアップがブロックされ別ウィンドウを開けない | 要ソース確認 |
| M04-09-MSG-062 | 要ソース確認 | JSアラート | ピック表用データの取得に失敗しました。 | Ajaxがsuccess=false応答または通信失敗 | 要ソース確認 |
| M04-09-MSG-063 | 要ソース確認 | JSアラート | ポップアップがブロックされているため、戻しリストPDFを開けませんでした。ブラウザの設定を確認してください。 | ポップアップがブロックされ別ウィンドウを開けない | 要ソース確認 |
| M04-09-MSG-064 | 要ソース確認 | 別ウィンドウ | 読み込み中… | ポップアップ表示直後（データ取得完了まで） | 要ソース確認 |
| M04-09-MSG-065 | 要ソース確認 | JSアラート | 戻しリストPDF用データの取得に失敗しました。 | Ajaxがsuccess=false応答または通信失敗 | 要ソース確認 |
| M04-09-MSG-066 | 要ソース確認 | JSアラート | 商品の検索に失敗しました。 | 商品検索Ajaxが失敗 | 要ソース確認 |
| M04-09-MSG-067 | 要ソース確認 | JSアラート | 選択されていません | 規格ありの商品で規格未選択のまま追加 | 要ソース確認 |
| M04-09-MSG-068 | 要ソース確認 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を新規登録してよろしいですか？ | 登録フォームsubmit時にJSがインターセプト | 要ソース確認 |
| M04-09-MSG-069 | 要ソース確認 | 確認モーダル | ※新規登録時に、移動対象の商品の在庫が移動点数分減る処理が行われます。 | 登録フォームsubmit時にJSがインターセプト | 要ソース確認 |
| M04-09-MSG-070 | 要ソース確認 | 確認モーダル | この操作はあとから取り消すことができません。店舗内入庫を確定してよろしいですか？ | 同一店舗の場合のフォームsubmit時にJSがインターセプト | 要ソース確認 |
| M04-09-MSG-071 | 要ソース確認 | 確認モーダル | ※欠品点数の登録と入庫処理が完了します。 | 同一店舗の場合のフォームsubmit時にJSがインターセプト | 要ソース確認 |
| M04-09-MSG-072 | 要ソース確認 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を承認申請してよろしいですか？ | 他店舗の場合のフォームsubmit時にJSがインターセプト | 要ソース確認 |
| M04-09-MSG-073 | 要ソース確認 | 確認モーダル | ※欠品については、承認申請するボタンをクリックすると欠品登録されます。 | 他店舗の場合のフォームsubmit時にJSがインターセプト | 要ソース確認 |
| M04-09-MSG-074 | 要ソース確認 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を却下してよろしいですか？ | 却下ボタン押下 | 要ソース確認 |
| M04-09-MSG-075 | 要ソース確認 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を承認してよろしいですか？ | 承認ボタン押下 | 要ソース確認 |
| M04-09-MSG-076 | 要ソース確認 | 確認モーダル | この操作はあとから取り消すことができません。入庫処理について承認申請してよろしいですか？ | 承認申請フォームsubmit時にJSがインターセプト | 要ソース確認 |
| M04-09-MSG-077 | 要ソース確認 | 確認モーダル | ※差分があるものについて、この申請で差分に関わる処理は実行されません。 | 承認申請フォームsubmit時にJSがインターセプト | 要ソース確認 |
| M04-09-MSG-078 | 要ソース確認 | 確認モーダル | この操作を行うと再度入庫処理を行うことになりますが、よろしいですか？ | 入庫再確認ボタン押下 | 要ソース確認 |
| M04-09-MSG-079 | 要ソース確認 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を承認してよろしいですか？ | 承認ボタン押下 | 要ソース確認 |
| M04-09-MSG-080 | 要ソース確認 | 確認モーダル | ※差分があるものについては出庫元に通知が行きます | 承認ボタン押下 | 要ソース確認 |
| M04-09-MSG-081 | 要ソース確認 | 確認モーダル | この操作はあとから取り消すことができません。在庫振替を却下してよろしいですか？ | 却下ボタン押下 | 要ソース確認 |
| M04-09-MSG-082 | 要ソース確認 | 確認モーダル | この操作はあとから取り消すことができません。在庫振替を承認してよろしいですか？ | 承認ボタン押下 | 要ソース確認 |
| M04-09-MSG-083 | 要ソース確認 | 確認モーダル | 商品を削除（振替対象外）にします。よろしいですか。 | 明細行の削除ボタン押下 | 要ソース確認 |
| M04-09-MSG-084 | 要ソース確認 | 入力項目付近（インライン） | 振替先の商品コードを入力してください。 | 振替先商品コードが未入力(NotBlank違反) | 要ソース確認 |
| M04-09-MSG-085 | 要ソース確認 | 画面上部フラッシュ | 却下する場合は却下理由を入力してください。 | 却下時に却下理由が未入力(NotBlank違反、reject検証グループ) | 要ソース確認 |
| M04-09-MSG-086 | 警告 | 画面中央(ダイアログ) | 選択されていません | 商品規格 select[name="product_class"] が未選択（parseInt結果が0/NaN）のまま「決定」を押下したとき | 送信せず現在の画面に留まる |
| M04-09-MSG-087 | 警告 | 画面中央(ダイアログ) | ポップアップがブロックされているため、ピック表を開けませんでした。ブラウザの設定を確認してください。 | ピック表を出力ボタン押下時、window.open() が偽値を返し別ウィンドウを開けないとき | 現在の画面に留まる |
| M04-09-MSG-088 | 警告 | 画面中央(ダイアログ) | ピック表用データの取得に失敗しました。 | ピック表PDF出力Ajax(POST admin_stock_move_outbound_approval_request_pick_list_pdf_export)のdone時、response.success===true かつ response.html を満たさず、response.redirectUrl も無いとき | 元画面に留まる |
| M04-09-MSG-089 | 警告 | 画面中央(ダイアログ) | ピック表用データの取得に失敗しました。 | ピック表PDF出力Ajaxが通信失敗し fail コールバックへ進んだとき | 元画面に留まる |
| M04-09-MSG-090 | 警告 | 画面中央(ダイアログ) | ポップアップがブロックされているため、戻しリストPDFを開けませんでした。ブラウザの設定を確認してください。 | ボタン押下後、window.open() が null を返しポップアップを開けなかったとき | 現在の画面に留まる |
| M04-09-MSG-091 | 警告 | 画面中央(ダイアログ) | 戻しリストPDF用データの取得に失敗しました。 | Ajax done時に response.success===true かつ response.html の成功条件を満たさず、かつ response.redirectUrl も無いとき | 元画面に留まる |
| M04-09-MSG-092 | 警告 | 画面中央(ダイアログ) | 戻しリストPDF用データの取得に失敗しました。 | POST Ajax通信が fail コールバックへ到達したとき（通信エラー・HTTPエラー） | 元画面に留まる |
| M04-09-MSG-093 | インフォ | 画面中央(モーダル) | セッションがタイムアウトしました。もう一度やり直してください。 | 差分CSV取込のAjax POST（admin_stock_move_inbound_approval_request_differential_csv_import）が HTTP 403 で失敗したとき（CSRFトークン 'stock_move_differential_csv' 不正） | エラーを表示し、CSV取込モーダルに留まる |
| M04-09-MSG-094 | インフォ | 画面中央(モーダル) | 保存に失敗しました | 差分CSV取込のAjax POST（admin_stock_move_inbound_approval_request_differential_csv_import）が HTTP 403 以外の通信エラーで失敗したとき（fail ハンドラの else 分岐） | エラーを表示し、CSV取込モーダルに留まる |
| M04-09-MSG-095 | インフォ | 画面中央(モーダル) | セッションがタイムアウトしました。もう一度やり直してください。 | 欠品CSV取込Ajax(POST admin_stock_move_shortage_csv_import)が HTTP 403（CSRFトークン不正）で失敗したとき | エラーを表示し、CSV取込モーダルに留まる |
| M04-09-MSG-096 | インフォ | 画面中央(モーダル) | 保存に失敗しました | 欠品CSV取込Ajaxが403以外のHTTPエラーで fail コールバックへ進んだとき | エラーを表示し、CSV取込モーダルに留まる |

## M04-12 M04-12（在庫分割結合検索/一覧）
`functions/ec-cube-enterprise/m04-12_admin_stock_stock_split_join_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-12-MSG-062 | エラー | 管理画面上部 | 指定の在庫が見つかりません。 | productStockIdが1未満 | 在庫分割結合検索/一覧画面に遷移する |
| M04-12-MSG-063 | エラー | 管理画面上部 | 指定の在庫が見つかりません。 | productStockIdに対応する在庫なし | 在庫分割結合検索/一覧画面に遷移する |
| M04-12-MSG-064 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | POST_SUBMIT時、登録日開始日が登録日終了日より後 | 要ソース確認 |
| M04-12-MSG-065 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | POST_SUBMIT時、承認・却下日開始日が承認・却下日終了日より後 | 要ソース確認 |
| M04-12-MSG-066 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | POST_SUBMIT時、更新日開始日が更新日終了日より後 | 要ソース確認 |

## M04-13 M04-13（在庫分割結合登録/編集）
`functions/ec-cube-enterprise/m04-13_admin_stock_stock_split_join_register_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-13-MSG-001 | エラー | 管理画面上部 | 保存に失敗しました | CSRFトークンが不正 | 分割新規登録画面に遷移する |
| M04-13-MSG-002 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | ログインメンバーが対象店舗を編集できない | 分割新規登録画面に遷移する |
| M04-13-MSG-003 | エラー | 管理画面上部 | 分割数は1以上を入力してください。 | split_quantityが1未満 | 分割新規登録画面に遷移する |
| M04-13-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | StockSplitRegisterActionのLogicException | 要ソース確認 |
| M04-13-MSG-005 | エラー | 管理画面上部 | 要ソース確認 | StockSplitRegisterActionがerrorMessageを返す | 要ソース確認 |
| M04-13-MSG-006 | インフォ(成功) | 管理画面上部 | 在庫分割を登録しました。 | 在庫分割登録が成功 | 分割編集画面に遷移する |
| M04-13-MSG-007 | エラー | 管理画面上部 | 要ソース確認 | フォームが不正 | 要ソース確認 |
| M04-13-MSG-008 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信が有効、かつ承認待ちではない | 分割編集画面に遷移する |
| M04-13-MSG-009 | エラー | 管理画面上部 | 保存に失敗しました | CSRFトークンが不正 | 分割編集画面に遷移する |
| M04-13-MSG-010 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | ログインメンバーが対象店舗を編集できない | 分割編集画面に遷移する |
| M04-13-MSG-011 | エラー | 管理画面上部 | 承認通知先のメンバーを1人以上選択してください。 | approval_notification_target_membersが空 | 分割編集画面に遷移する |
| M04-13-MSG-012 | エラー | 管理画面上部 | 要ソース確認 | StockSplitApplyApprovalActionがerrorMessageを返す | 要ソース確認 |
| M04-13-MSG-013 | インフォ(成功) | 管理画面上部 | 承認申請しました。 | 承認申請が成功 | 分割承認画面に遷移する |
| M04-13-MSG-014 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークンが不正 | 分割承認画面に遷移する |
| M04-13-MSG-015 | エラー | 管理画面上部 | 承認権限がありません。 | canApprove判定がfalse | 分割承認画面に遷移する |
| M04-13-MSG-016 | エラー | 管理画面上部 | 保存に失敗しました | CSRFトークンが不正 | 分割編集画面または分割新規登録画面に遷移する |
| M04-13-MSG-017 | エラー | 管理画面上部 | 要ソース確認 | 対象分割データがない、または対象外ステータス | 要ソース確認 |
| M04-13-MSG-018 | エラー | 管理画面上部 | 要ソース確認 | destination_product_stock_idが0以下 | 要ソース確認 |
| M04-13-MSG-019 | エラー | 管理画面上部 | 要ソース確認 | 分割元と同じ在庫を分割先に指定 | 要ソース確認 |
| M04-13-MSG-020 | エラー | 管理画面上部 | 要ソース確認 | 同じ分割先在庫が既にSessionに存在 | 要ソース確認 |
| M04-13-MSG-021 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークンが不正 | 分割編集画面に遷移する |
| M04-13-MSG-022 | エラー | 管理画面上部 | 保存に失敗しました | 分割ステータスがNEW以外 | 分割編集画面に遷移する |
| M04-13-MSG-023 | インフォ(成功) | 管理画面上部 | 削除しました | CSRFトークンが有効かつ分割ステータスがNEW | 分割編集画面に遷移する |
| M04-13-MSG-024 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークンが不正 | 分割編集画面に遷移する |
| M04-13-MSG-025 | エラー | 管理画面上部 | 保存に失敗しました | StockSplitUpdateMemoActionがLogicExceptionを送出 | 分割編集画面に遷移する |
| M04-13-MSG-026 | インフォ(成功) | 管理画面上部 | 保存しました | 登録メモ保存が成功 | 分割承認画面または分割編集画面に遷移する |
| M04-13-MSG-027 | エラー | 管理画面上部 | 要ソース確認 | 承認処理結果にerrorMessageが存在 | 要ソース確認 |
| M04-13-MSG-028 | インフォ(成功) | 管理画面上部 | 要ソース確認 | 承認処理結果にsuccessMessageが存在 | 要ソース確認 |
| M04-13-MSG-029 | 警告 | 画面中央(ダイアログ) | 保存に失敗しました | 結合元の在庫区分をchangeした際のfetch（admin_stock_join_update_source_stock_location）がcatchに入ったとき（通信失敗、または応答JSONの解析失敗。HTTPエラーでもJSONが返る場合はthen側の alert(msg) 分岐=同twig:826-827 でありcatchに入らない） | エラーを表示して結合編集画面に留まる |
| M04-13-MSG-030 | 警告 | 画面中央(ダイアログ) | ポップアップがブロックされているため、ピック表を開けませんでした。ブラウザの設定を確認してください。 | 欠品入力画面でピック表出力ボタンを押下し、window.open がnullを返した（ポップアップがブロックされた）とき | ピック表を開かず、欠品入力画面に留まる |
| M04-13-MSG-031 | 警告 | 画面中央(ダイアログ) | ピック表用データの取得に失敗しました。 | ピック表PDF出力Ajax（admin_stock_join_pick_list_pdf_export）のdoneで success===true かつ html が得られず、かつ redirectUrl も返らなかったとき | エラーを表示して欠品入力画面に留まる |
| M04-13-MSG-032 | 警告 | 画面中央(ダイアログ) | ピック表用データの取得に失敗しました。 | ピック表PDF出力Ajax（admin_stock_join_pick_list_pdf_export）が fail コールバックに入ったとき（通信失敗のほか、CSRFトークン不正時のHTTP 403 JSON応答 StockJoinController.php:1206-1208 も含む） | エラーを表示して欠品入力画面に留まる |
| M04-13-MSG-033 | 警告 | 画面中央(ダイアログ) | 保存に失敗しました | 数量入力欄を変更（change）して data-update-url（admin_stock_split_update_destination_quantity）へ Ajax POST した際、fetch が通信例外で失敗（.catch）したとき | エラーを表示して分割編集画面に留まる |
| M04-13-MSG-034 | 警告 | 画面中央(ダイアログ) | 保存に失敗しました | 在庫区分セレクトを変更（change）して data-update-dest-location-url（admin_stock_split_update_destination_stock_location、stock_split_edit.twig:179）へ Ajax POST した際、fetch が通信例外で失敗（.catch）したとき | エラーを表示して分割編集画面に留まる |
| M04-13-MSG-035 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | 結合新規登録画面に遷移する |
| M04-13-MSG-036 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | 対象店舗を編集不可 | 結合新規登録画面に遷移する |
| M04-13-MSG-037 | エラー | 管理画面上部 | 要ソース確認 | StockJoinNewTypeのフォーム検証失敗 | 要ソース確認 |
| M04-13-MSG-038 | エラー | 管理画面上部 | 要ソース確認 | registerActionがLogicExceptionを送出 | 要ソース確認 |
| M04-13-MSG-039 | インフォ(成功) | 管理画面上部 | 在庫結合を開始しました。 | registerAction成功 | 結合編集画面に遷移する |
| M04-13-MSG-040 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | POSTのCSRFトークン不正 | 結合承認画面に遷移する |
| M04-13-MSG-041 | エラー | 管理画面上部 | 承認権限がありません。 | ログインメンバーなし、または承認権限なし | 結合承認画面に遷移する |
| M04-13-MSG-042 | エラー | 管理画面上部 | 要ソース確認 | StockSplitJoinTypeのフォーム検証失敗 | 要ソース確認 |
| M04-13-MSG-043 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信・保存成功 | 結合編集画面に遷移する |
| M04-13-MSG-044 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | 結合編集画面または結合新規登録画面に遷移する |
| M04-13-MSG-045 | エラー | 管理画面上部 | 保存に失敗しました | stock_split_join_idが0以下 | 結合編集画面または結合新規登録画面に遷移する |
| M04-13-MSG-046 | エラー | 管理画面上部 | 保存に失敗しました | 結合データなし、または対象在庫不一致 | 結合編集画面に遷移する |
| M04-13-MSG-047 | エラー | 管理画面上部 | 保存に失敗しました | 結合ステータスがNEW以外 | 結合編集画面に遷移する |
| M04-13-MSG-048 | エラー | 管理画面上部 | 指定の在庫が見つかりません。 | 結合元在庫IDが不正、または結合先と同一 | 結合編集画面に遷移する |
| M04-13-MSG-049 | エラー | 管理画面上部 | 要ソース確認 | 同じ結合元在庫が既にSessionに存在 | 要ソース確認 |
| M04-13-MSG-050 | インフォ(成功) | 管理画面上部 | 結合元を追加しました。 | 結合元をSessionへ追加成功 | 結合編集画面に遷移する |
| M04-13-MSG-051 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | 結合新規登録画面に遷移する |
| M04-13-MSG-052 | エラー | 管理画面上部 | 保存に失敗しました | stock_split_join_idが0以下 | 結合新規登録画面に遷移する |
| M04-13-MSG-053 | エラー | 管理画面上部 | 保存に失敗しました | 結合データなし、または対象在庫不一致 | 結合新規登録画面に遷移する |
| M04-13-MSG-054 | エラー | 管理画面上部 | 保存に失敗しました | 結合ステータスがNEW以外 | 結合編集画面に遷移する |
| M04-13-MSG-055 | インフォ(成功) | 管理画面上部 | 結合元を削除しました。 | 結合元をSessionから削除成功 | 結合編集画面に遷移する |
| M04-13-MSG-056 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | 結合新規登録画面に遷移する |
| M04-13-MSG-057 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | ログインメンバーなし、または対象店舗を編集不可 | 結合新規登録画面に遷移する |
| M04-13-MSG-058 | エラー | 管理画面上部 | 要ソース確認 | moveToShortageEntryActionがStockJoinMoveToShortageValidationExceptionを送出 | 要ソース確認 |
| M04-13-MSG-059 | インフォ(成功) | 管理画面上部 | 欠品入力画面に移動しました。 | 欠品入力遷移成功 | 欠品入力画面に遷移する |
| M04-13-MSG-060 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | 結合編集画面に遷移する |
| M04-13-MSG-061 | エラー | 管理画面上部 | 保存に失敗しました | stockJoinUpdateMemoActionがLogicExceptionを送出 | 結合編集画面に遷移する |
| M04-13-MSG-062 | インフォ(成功) | 管理画面上部 | 保存しました | メモ保存成功 | 結合承認画面または結合編集画面に遷移する |
| M04-13-MSG-063 | エラー | 管理画面上部 | 欠品入力可能なステータスではありません。 | 結合ステータスがJOIN_SOURCE_REGISTERED以外 | 結合編集画面に遷移する |
| M04-13-MSG-064 | エラー | 管理画面上部 | 要ソース確認 | StockSplitJoinTypeが送信済みかつ不正 | 要ソース確認 |
| M04-13-MSG-065 | インフォ(成功) | 管理画面上部 | 保存しました | 送信済みフォームをshortageEntryActionが保存 | 欠品入力画面に遷移する |
| M04-13-MSG-066 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | 欠品入力画面に遷移する |
| M04-13-MSG-067 | エラー | 管理画面上部 | 指定の在庫が見つかりません。 | 結合データなし・対象在庫不一致・結合種別でない | 在庫分割結合一覧画面に遷移する |
| M04-13-MSG-068 | エラー | 管理画面上部 | 承認通知先のメンバーを1人以上選択してください。 | 承認通知先メンバー未選択 | 欠品入力画面に遷移する |
| M04-13-MSG-069 | エラー | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | 対象店舗を編集不可 | 欠品入力画面に遷移する |
| M04-13-MSG-070 | エラー | 管理画面上部 | 保存に失敗しました | applyApprovalAction呼出し中のThrowable | 欠品入力画面に遷移する |
| M04-13-MSG-071 | エラー | 管理画面上部 | 要ソース確認 | applyApprovalActionがerrorMessageを返す | 要ソース確認 |
| M04-13-MSG-072 | インフォ(成功) | 管理画面上部 | 承認申請しました。 | applyApprovalAction成功 | 結合承認画面に遷移する |
| M04-13-MSG-073 | エラー | 管理画面上部 | 欠品入力可能なステータスではありません。 | 結合ステータスがJOIN_SOURCE_REGISTERED以外 | 結合編集画面に遷移する |
| M04-13-MSG-074 | エラー | 管理画面上部 | 要ソース確認 | approvalSubmitActionがerrorMessageを返す | 要ソース確認 |
| M04-13-MSG-075 | インフォ(成功) | 管理画面上部 | 要ソース確認 | approvalSubmitActionがsuccessMessageを返す | 要ソース確認 |
| M04-13-MSG-076 | エラー | 管理画面上部 | ピック表を出力できるステータスではありません。 | 結合ステータスがJOIN_SOURCE_REGISTERED以外 | 欠品入力画面に遷移する |
| M04-13-MSG-077 | エラー | 管理画面上部 | ピック表を出力する権限がありません。 | 対象店舗が編集可能店舗に含まれない | 欠品入力画面に遷移する |

## M04-16 在庫管理 — 在庫リコメンドCSV出力
`functions/pf-eccube3/m04-16_admin_stock_product_stock_recommend_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-16-MSG-001 | エラー(バリデーション) | 入力項目直下 | 上限金額は、下限金額より大きく設定してください | POST検索で基準価格の下限(base_price_from)と上限(base_price_to)がともにnullでなく、下限>上限のとき | 在庫一覧画面に留まる |
| M04-16-MSG-002 | エラー(バリデーション) | 入力項目直下 | 上限金額は、下限金額より大きく設定してください | POST検索で販売価格の下限(sell_price_from)と上限(sell_price_to)がともにnullでなく、下限>上限のとき | 在庫一覧画面に留まる |
| M04-16-MSG-003 | エラー(バリデーション) | 入力項目直下 | 上限金額は、下限金額より大きく設定してください | POST検索で在庫数の下限(stock_from)と上限(stock_to)がともにnullでなく、下限>上限のとき | 在庫一覧画面に留まる |
| M04-16-MSG-004 | エラー(バリデーション) | 要ソース確認 | 終了日時は、開始日時より大きく設定してください | POST検索で更新日時の開始(update_date_from)と終了(update_date_to)がともにnullでなく、開始>終了のとき | 在庫一覧画面に留まる |
| M04-16-MSG-005 | エラー | 管理画面上部 | 検索条件を指定してからCSV出力してください。 | リコメンドCSV出力(GET admin_stock_list_recommend_csv)時、セッションに検索条件が無い、またはセッションの検索条件が不正で復元できないとき | 在庫一覧画面に遷移する |
| M04-16-MSG-006 | エラー | 管理画面上部 | 検索条件を指定してからCSV出力してください。 | セッション検索条件が空（$viewData === []） | 在庫一覧画面に遷移する |
| M04-16-MSG-007 | エラー | 管理画面上部 | 検索条件を指定してからCSV出力してください。 | セッション検索条件のフォーム復元で例外を捕捉したとき | 在庫一覧画面に遷移する |

## M04-17 M04-17（在庫履歴検索/一覧）
`functions/pf-eccube3/m04-17_admin_stock_stock_history_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-17-MSG-001 | エラー | 一覧カード上部（#stockHistoryList .card-body 先頭に prepend） | 保存に失敗しました | 非同期更新 admin_stock_approval_history_reason_update が success=false 応答または通信エラーのとき | エラーを表示して在庫履歴検索/一覧画面に留まる |

## M04-18 M04-18（在庫履歴CSV出力）
`functions/pf-eccube3/m04-18_admin_stock_stock_history_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-18-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | StockHistoryCsv::exportCsv() が RuntimeException を送出したとき（対象ID未登録 or CSV行が空） | 要ソース確認 |

## M04-19 M04-19（欠品履歴検索/一覧）
`functions/pf-eccube3/m04-19_admin_stock_stock_shortage_history_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-19-MSG-001 | エラー | 管理画面上部 | 保存に失敗しました | POST admin_stock_history_update で updateDisposalReason が Exception を送出したとき | M04-19（欠品履歴検索/一覧）画面に遷移する |
| M04-19-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | 欠品理由を正常に更新したとき（admin_stock_history_update） | M04-19（欠品履歴検索/一覧）画面に遷移する |

## M04-20 M04-20（欠品履歴CSV出力）
`functions/ec-cube-enterprise/m04-20_admin_stock_stock_shortage_history_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-20-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | StockHistoryDisposalCsv::exportCsv() が RuntimeException を送出したとき（対象ID未登録 or CSV行が空） | 要ソース確認 |
| M04-20-MSG-005 | エラー | 要ソース確認 | eccube.admin.error | 送信 ids[] を intval・正数抽出した結果が空のとき（一覧フォームは検索結果全件分の hidden ids[] を自動送信するため、通常UI操作では到達しない。行のチェック選択UIは無い: history.twig:595-608） | 欠品履歴検索/一覧画面に遷移する |
| M04-20-MSG-007 | エラー | 当該入力欄直下 | 不正な日付です。 | POST admin_stock_history の検索で日付が 1900-01-01 より前のとき（Assert\Range minMessage=form_error.out_of_range） | 欠品履歴検索/一覧画面に留まる |

## M04-21 M04-21（在庫変更CSV登録）
`functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-21-MSG-001 | エラー | 管理画面上部 | 要ソース確認（variable: $error->getMessage()） | POST送信フォームが未送信またはバリデーション不正 | 要ソース確認 |

## M04-23 M04-23（在庫分割結合CSV登録）
`functions/ec-cube-enterprise/m04-23_admin_stock_stock_split_join_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-23-MSG-001 | エラー(バリデーション) | 入力項目直下 | 要ソース確認（key_unknown: admin.stock.split_csv_modal.inventory_category_required） | inventory_categoryが空のときのNotBlank制約 | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-002 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-003 | エラー | 管理画面上部 | CSVファイルのアップロードに失敗しました | アップロードファイルなし、または無効 | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-004 | エラー | 管理画面上部 | CSVファイルのアップロードに失敗しました | 選択店舗が存在しない | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-005 | エラー | 管理画面上部 | CSVファイルのアップロードに失敗しました | 在庫区分が許可値以外 | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-006 | エラー | 管理画面上部 | ログインしてください。 | ログインユーザーがMemberでない | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-007 | エラー | 管理画面上部 | 要ソース確認 | CSVインポート中にThrowable | 要ソース確認 |
| M04-23-MSG-008 | エラー | 管理画面上部 | 要ソース確認 | CsvImporterの行エラーあり | 要ソース確認 |
| M04-23-MSG-009 | エラー | 管理画面上部 | 要ソース確認 | StockSplitListCsvImportHandlerのflashErrorsあり | 要ソース確認 |
| M04-23-MSG-010 | インフォ(成功) | 管理画面上部 | %count% 件の分割を登録し、承認申請まで進めました。 | StockSplitListCsvImportHandlerのflashSuccessesあり | 成功メッセージを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-011 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン不正 | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-012 | エラー | 管理画面上部 | CSVファイルのアップロードに失敗しました | アップロードファイルなし、または無効 | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-013 | エラー | 管理画面上部 | CSVファイルのアップロードに失敗しました | 選択店舗が存在しない | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-014 | エラー | 管理画面上部 | CSVファイルのアップロードに失敗しました | 結合先在庫区分が未指定 | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-015 | エラー | 管理画面上部 | ログインしてください。 | ログインユーザーがMemberでない | エラーを表示して、在庫分割結合検索/一覧画面に遷移する |
| M04-23-MSG-016 | エラー | 管理画面上部 | 要ソース確認 | CSVインポート中にThrowable | 要ソース確認 |
| M04-23-MSG-017 | エラー | 管理画面上部 | 要ソース確認 | CsvImporterの行エラーあり | 要ソース確認 |
| M04-23-MSG-018 | エラー | 管理画面上部 | 要ソース確認 | StockJoinListCsvImportHandlerのflashErrorsあり | 要ソース確認 |
| M04-23-MSG-019 | インフォ(成功) | 管理画面上部 | %count% 件の結合を登録し、欠品入力まで進めました。 | StockJoinListCsvImportHandlerのflashSuccessesあり | 成功メッセージを表示して、在庫分割結合検索/一覧画面に遷移する |

## M04-24 M04-24（在庫移動指示リスト作成/検索）
`functions/ec-cube-enterprise/m04-24_admin_stock_stock_move_instruction_search_create.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-24-MSG-001 | エラー | 送り状No.入力欄直下（インラインエラー） | 送り状番号を空に戻して発送状況を未に戻すことはできません。 | フォーム送信が有効で、既存trackingNoが非空かつ入力後trackingNoが空 | 在庫移動指示詳細画面に留まる |
| M04-24-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信が有効で、空戻し条件に該当せずdetailUpdateAction完了 | 在庫移動指示詳細画面に遷移する |
| M04-24-MSG-003 | エラー | 管理画面上部 | 送り状番号を空に戻して発送状況を未に戻すことはできません。 | 既存trackingNoが非空かつPOSTのtracking_noが空 | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-004 | インフォ(成功) | 管理画面上部 | 送り状No.を登録しました。 | CSRF・対象取得後、空戻し条件に該当せずtrackingRegisterAction完了 | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-005 | エラー | 管理画面上部 | 送り状No.登録後は削除できません。 | deleteInstructionでtrackingNoが非空のためStockMoveInstructionDeleteException発生 | 在庫移動指示詳細画面に遷移する |
| M04-24-MSG-006 | インフォ(成功) | 管理画面上部 | 削除しました | deleteInstructionが例外なく完了 | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-007 | エラー | 管理画面上部 | ファイルが不正です。 | csv_fileがUploadedFileでない、またはisValid()がfalse | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-008 | エラー | 管理画面上部 | エラーは20件まで表示されます | CSV取込結果errorsが20件超 | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-009 | エラー | 管理画面上部 | 要ソース確認 | CSV取込結果getErrors()の各messageをaddErrorする場合 | 要ソース確認 |
| M04-24-MSG-010 | インフォ(成功) | 管理画面上部 | 送り状No.を一括登録しました。 | CSV取込後のsuccessCountが1以上 | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-011 | エラー | 管理画面上部 | 有効な行がありません。 | CSV取込後のsuccessCountが0かつerrorsが空 | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-012 | エラー | 管理画面上部 | CSVのヘッダーが不正です。 | RuntimeExceptionのmessageがadmin.stock.move_instruction.csv_tracking_header_invalid（当該messageをthrowする実装は現行ソースになく防御的分岐。実際のヘッダ不正はMSG-009経路で表示） | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-013 | エラー | 管理画面上部 | ファイルが不正です。 | RuntimeExceptionのmessageがadmin.stock.move_instruction.csv_tracking_file_invalid（当該messageをthrowする実装は現行ソースになく防御的分岐） | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-014 | エラー | 管理画面上部 | アップロードに失敗しました。一時ディレクトリの設定（eccube_csv_temp_realdir）を確認してください。 | RuntimeExceptionのmessageがadmin.stock.move_instruction.csv_tracking_temp_dir_invalid（当該messageをthrowする実装は現行ソースになく防御的分岐） | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-015 | エラー | 管理画面上部 | アップロードに失敗しました。詳細：%detail% | RuntimeExceptionで既知3種以外。例外message、または例外クラス名と「 (メッセージなし)」を%detail%へ代入 | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-016 | エラー | 管理画面上部 | アップロードに失敗しました。詳細：%detail% | RuntimeException以外のThrowable。例外message、または例外クラス名と「 (メッセージなし)」を%detail%へ代入 | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-017 | エラー | ブラウザ標準ダイアログ（JSアラート） | 送り状CSVを出力する在庫移動指示にチェックを入れてください。 | 行チェックボックスの選択が0件でクリック | 送信せず在庫移動指示リスト作成/検索画面に留まる |
| M04-24-MSG-018 | 確認 | 削除確認モーダル本文 | 在庫移動指示（ID：%id%）を削除してよろしいですか？ | 削除ボタンクリックで削除確認モーダルを表示 | 削除確認モーダルを表示し、キャンセル時は在庫移動指示詳細画面に留まる |
| M04-24-MSG-019 | エラー | 登録日/更新日の日付入力欄の下（form_errors出力位置・インラインエラー） | 不正な日付です。 | 登録日/更新日の開始・終了いずれかが1900-01-01より前（Assert\Range minMessage） | 在庫移動指示リスト作成/検索画面に留まる |
| M04-24-MSG-020 | エラー | 登録日/更新日の日付入力欄の下（form_errors出力位置・インラインエラー） | 要ソース確認 | 登録日/更新日で開始日が終了日より後（POST_SUBMITの相関チェック） | 要ソース確認 |
| M04-24-MSG-021 | エラー | 送り状No.入力欄直下（インラインエラー） | 要ソース確認 | 送り状No.が255文字超（Assert\Length max=255） | 要ソース確認 |
| M04-24-MSG-022 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | POST_SUBMIT時、登録日開始日が登録日終了日より後 | 要ソース確認 |
| M04-24-MSG-023 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | POST_SUBMIT時、更新日開始日が更新日終了日より後 | 要ソース確認 |

## M04-30 M04-30（バーコード貼替リストCSV出力）
`functions/ec-cube-enterprise/m04-30_admin_stock_stock_barcode_replacement_list_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-30-MSG-001 | エラー | 管理画面上部 | 入力されていません。 | 出力対象店舗・価格変更発生期間（開始日/終了日）が未入力など NotBlank 制約違反のとき（$form->getErrors(true) を addError で表示） | エラーを表示し、バーコード貼替リスト画面に遷移する |
| M04-30-MSG-002 | エラー | 管理画面上部 | 価格変更発生期間の終了日は開始日以降を指定してください。 | 価格変更発生期間の終了日が開始日より前のとき（POST_SUBMIT で price_change_period_to にエラー付与→addError で表示） | エラーを表示し、バーコード貼替リスト画面に遷移する |
| M04-30-MSG-003 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 価格変更発生期間の終了日は開始日以降を指定してください。 | CSV出力POSTで開始日が終了日より後 | エラーを表示し、バーコード貼替リスト画面に遷移する |

## M04-31 M04-31（棚卸計画）
`functions/pf-eccube3/m04-31_admin_stock_stock_inventory_plan.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-31-MSG-001 | エラー | 管理画面上部 | 在庫反映済みのため、更新できません。 | 既存計画かつ InventoryPlan.getStockReflectionedDate() !== null（新規登録はnew DtbInventoryPlanのため条件不成立） | 棚卸計画編集画面に遷移する |
| M04-31-MSG-002 | エラー | 管理画面上部 | この店舗の棚卸を編集する権限がありません。 | 既存計画かつ !InventoryPlan.isEditableBy(getMember()) | 棚卸計画編集画面に遷移する |
| M04-31-MSG-003 | エラー | 管理画面上部 | 棚卸計画を登録できませんでした。 | !form.isSubmitted() \|\| !form.isValid() | エラーを表示し、新規は棚卸計画新規登録画面に留まり、更新は棚卸計画編集画面に遷移する |
| M04-31-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | 更新フォームが不正で form.getErrors(true) が1件以上 | 要ソース確認 |
| M04-31-MSG-005 | インフォ(成功) | 管理画面上部 | 棚卸計画を登録しました。 | フォームが送信済み・有効で保存完了 | 棚卸計画編集画面に遷移する |
| M04-31-MSG-006 | エラー | 管理画面上部 | この店舗の棚卸を編集する権限がありません。 | !InventoryPlan.isEditableBy(getMember()) | 棚卸計画編集画面に遷移する |
| M04-31-MSG-007 | エラー | 管理画面上部 | 要ソース確認 | registerForPlanを含むCSV登録処理でLogicExceptionまたはRuntimeExceptionを捕捉 | 要ソース確認 |
| M04-31-MSG-008 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CSV商品登録処理が例外なく完了 | 棚卸計画編集画面に遷移する |
| M04-31-MSG-009 | エラー | 管理画面上部 | この店舗の棚卸を編集する権限がありません。 | !InventoryPlan.isEditableBy(getMember()) | 棚卸計画編集画面に遷移する |
| M04-31-MSG-010 | エラー | 管理画面上部 | 要ソース確認 | registerQuantityForPlanを含むCSV数量登録処理でLogicExceptionまたはRuntimeExceptionを捕捉 | 要ソース確認 |
| M04-31-MSG-011 | インフォ(成功) | 管理画面上部 | 棚卸数量を登録しました。 | CSV数量登録処理が例外なく完了 | 棚卸計画編集画面に遷移する |
| M04-31-MSG-012 | エラー | 管理画面上部 | 要ソース確認 | exportCsvByIdAndDiffFlagでExceptionを捕捉 | 要ソース確認 |
| M04-31-MSG-013 | エラー | 管理画面上部 | 在庫反映済みのため、更新できません。 | 棚卸詳細または親棚卸計画のstockReflectionedDateがnullでない | 棚卸在庫確認画面に遷移する |
| M04-31-MSG-014 | エラー | 管理画面上部 | この店舗の棚卸を編集する権限がありません。 | !InventoryPlanDetail.isEditableBy(getMember()) | 棚卸在庫確認画面に遷移する |
| M04-31-MSG-015 | エラー | 管理画面上部 | 棚卸計画詳細を登録できませんでした。 | !form.isSubmitted() \|\| !form.isValid() | エラーを表示して棚卸在庫確認画面に留まる |
| M04-31-MSG-016 | インフォ(成功) | 管理画面上部 | 棚卸計画詳細を登録しました。 | フォームが送信済み・有効で棚卸詳細と履歴の保存完了 | 次の対象がある場合は棚卸在庫確認画面に遷移し、それ以外は棚卸計画編集画面に遷移する |
| M04-31-MSG-017 | エラー | 管理画面上部 | 在庫反映済みのため、更新できません。 | 棚卸詳細または親棚卸計画のstockReflectionedDateがnullでない | 棚卸在庫確認画面に遷移する |
| M04-31-MSG-018 | エラー | 管理画面上部 | この店舗の棚卸を編集する権限がありません。 | !InventoryPlanDetail.isEditableBy(getMember()) | 棚卸在庫確認画面に遷移する |
| M04-31-MSG-019 | エラー | 管理画面上部 | 差異確認済みのため、在庫数量を同期できません。 | InventoryPlanDetail.isStockDifferenceConfirmed() | 棚卸在庫確認画面に遷移する |
| M04-31-MSG-020 | インフォ(成功) | 管理画面上部 | 最新の在庫数量を反映しました。 | 理論在庫数・履歴の保存完了 | 棚卸在庫確認画面に遷移する |
| M04-31-MSG-021 | エラー | 管理画面上部 | この店舗の棚卸を編集する権限がありません。 | !InventoryPlan.isEditableBy(getMember()) | 棚卸計画編集画面に遷移する |
| M04-31-MSG-022 | エラー | 管理画面上部 | 在庫反映済みのため、更新できません。 | InventoryPlan.getStockReflectionedDate() !== null | 棚卸計画編集画面に遷移する |
| M04-31-MSG-023 | エラー | 管理画面上部 | 差異未確認の商品があるため在庫反映できません。 | checkUnconfirmedStockDifferenceDetailExists(InventoryPlan.id)がtrue | 棚卸計画編集画面に遷移する |
| M04-31-MSG-024 | エラー | 管理画面上部 | この店舗の棚卸を編集する権限がありません。 | !InventoryPlan.isEditableBy(getMember()) | 棚卸計画編集画面に遷移する |
| M04-31-MSG-025 | エラー | 管理画面上部 | 在庫反映済みのため、更新できません。 | InventoryPlan.getStockReflectionedDate() !== null | 棚卸計画編集画面に遷移する |
| M04-31-MSG-026 | エラー | 管理画面上部 | 商品数と計上済み商品数が一致しません。 | !(InventoryPlan.productCount > 0 && InventoryPlan.productCount === InventoryPlan.productRegisteredCount) | 棚卸計画編集画面に遷移する |
| M04-31-MSG-027 | エラー | 管理画面上部 | 棚卸計画データのロックに失敗しました。 | inventoryPlanRepository.getLock('inventory_plan_'+id)がfalse | 棚卸計画編集画面に遷移する |
| M04-31-MSG-028 | エラー | 管理画面上部 | 要ソース確認 | 在庫反映処理でLogicExceptionまたはRuntimeExceptionを捕捉 | 要ソース確認 |
| M04-31-MSG-029 | インフォ(成功) | 管理画面上部 | 棚卸結果の在庫反映を完了しました。 | 在庫反映処理が例外なく完了 | 棚卸計画編集画面に遷移する |
| M04-31-MSG-030 | エラー | 管理画面上部 | 計画後に変動履歴の更新がありました。 | existsStockHistoryAfterDateByProductStockId(商品在庫ID, 棚卸計画作成日時)がtrue | 棚卸在庫確認画面に留まる |
| M04-31-MSG-031 | エラー(バリデーション) | 入力項目直下/フォーム上部 | ユーザーの編集可能店舗を選択してください。 | POST_SUBMIT時にBaseInfoが存在し、Member.isEditableShop(BaseInfo)がfalse | 棚卸計画新規登録画面に留まる |
| M04-31-MSG-032 | エラー | 管理画面上部 | 要ソース確認 | POST_SUBMIT時にInventoryPlan.isEditableBy(Member)がfalse | 要ソース確認 |
| M04-31-MSG-033 | エラー(バリデーション) | 入力項目直下 | 要ソース確認（key_unknown: form.type.numeric.invalid） | POST送信時、在庫数量または棚卸数量が数字のみの正規表現に一致しない場合 | 要ソース確認 |

## M04-32 M04-32（承認一覧）
`functions/ec-cube-enterprise/m04-32_admin_stock_stock_approval_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M04-32-MSG-001 | エラー | 管理画面上部 | 在庫編集の承認権限がありません。 | 選択IDから取得した承認一覧のいずれかで canApprove が false のとき | 承認一覧画面に遷移する |
| M04-32-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | 更新処理が errorMessage を返すとき（正規化後の承認一覧IDが空、または isGrantedForStockApprovalList が false） | 要ソース確認 |
| M04-32-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | StockApprovalListUpdateAction::handle が Exception を送出したとき | 承認一覧画面に遷移する |
| M04-32-MSG-004 | インフォ(成功) | 管理画面上部 | 保存しました | StockApprovalListUpdateAction::handle が errorMessage を返さず、例外なく完了したとき | 承認一覧画面に遷移する |
| M04-32-MSG-005 | エラー | 管理画面上部 | 明細を表示するための選択情報がありません。確認モーダルを開き直してからCSVダウンロードしてください。 | 明細CSV出力時、セッションの承認一覧IDを正規化した結果が空のとき | 承認一覧画面に遷移する |
| M04-32-MSG-006 | 警告 | 画面中央(ダイアログ) | 却下理由は入力必須です | 却下理由テキストエリア(#rejection_reason)が空のまま「却下する」を押下したとき | 現在の画面に留まる |
| M04-32-MSG-007 | エラー | 確認モーダル内(明細エリア) | 読み込みに失敗しました。しばらく経ってから再度お試しください。 | admin_stock_approval_list_line_items へのAjaxリクエストが失敗(fail)したとき | エラーを表示して明細表示モーダルに留まる |
| M04-32-MSG-008 | 警告 | 画面中央(ダイアログ) | 却下理由は入力必須です | 確認モーダルで却下理由(#rejection_reason)が空のまま「却下する」ボタンを押下したとき | 現在の画面に留まる |
| M04-32-MSG-009 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 終了日は、開始日より大きく設定してください | POST_SUBMIT時、登録日開始日が登録日終了日より後 | エラーを表示して承認一覧画面に留まる |
| M04-32-MSG-010 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 終了日は、開始日より大きく設定してください | POST_SUBMIT時、承認日開始日が承認日終了日より後 | エラーを表示して承認一覧画面に留まる |

## M05-01 m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）
`functions/pf-eccube3/m05-01_admin_order_order_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-01-MSG-001 | エラー | 管理画面上部 | 削除に失敗しました | 指定IDの受注が存在しない | 受注情報検索・一覧画面に遷移する |
| M05-01-MSG-002 | エラー | 管理画面上部 | 削除に失敗しました | 論理削除のflushでForeignKeyConstraintViolationExceptionが発生 | 受注情報検索・一覧画面に遷移する |
| M05-01-MSG-003 | インフォ(成功) | 管理画面上部 | 削除しました | 受注の論理削除完了後 | 受注情報検索・一覧画面に遷移する |
| M05-01-MSG-004 | インフォ(成功) | 管理画面上部 | 削除しました | POSTされたidsを処理しflushが完了 | 受注情報検索・一覧画面に遷移する |
| M05-01-MSG-013 | エラー | 管理画面上部 | 検索パターン名を入力して下さい | pattern_nameがnullまたは空文字 | 受注情報検索・一覧画面に遷移する |
| M05-01-MSG-014 | インフォ(成功) | 管理画面上部 | 検索条件を保存しました | 検索パターンの保存とflushが完了 | 受注情報検索・一覧画面に遷移する |
| M05-01-MSG-015 | エラー | 管理画面上部 | 検索条件を削除できませんでした | 指定pattern_idの検索パターンが存在しない | 受注情報検索・一覧画面に遷移する |
| M05-01-MSG-016 | インフォ(成功) | 管理画面上部 | 検索条件を削除しました | 指定検索パターンの削除とflushが完了 | 受注情報検索・一覧画面に遷移する |
| M05-01-MSG-017 | 警告 | 画面中央(ダイアログ) | チェックボックスが選択されていません | 受注一覧のチェックボックスが1件も選択されていない状態で一括操作ボタンを押下 | 送信せず受注情報検索・一覧画面に留まる |
| M05-01-MSG-018 | エラー | 画面中央(ダイアログ) | Update failed. | admin_shipping_update_tracking_numberのJSON応答のstatusがOK以外（done側） | エラーを表示し、受注情報検索・一覧画面に留まる |
| M05-01-MSG-023 | エラー(バリデーション) | 入力項目直下 | カタカナで入力してください。 | POST検索時、入力値が正規表現 /^[ァ-ヶｦ-ﾟー]+$/u に一致しない場合 | 受注情報検索・一覧画面に留まる |
| M05-01-MSG-024 | エラー(バリデーション) | 入力項目直下 | カタカナで入力してください。 | POST検索時、入力値が正規表現 /^[ァ-ヶｦ-ﾟー]+$/u に一致しない場合 | 受注情報検索・一覧画面に留まる |
| M05-01-MSG-025 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | 注文日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |
| M05-01-MSG-026 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | 入金日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |
| M05-01-MSG-027 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | 更新日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |
| M05-01-MSG-028 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | POSTデータ内のお届け日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |
| M05-01-MSG-029 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | ピック日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |
| M05-01-MSG-030 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | 出荷指示日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |
| M05-01-MSG-031 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | 出荷日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |
| M05-01-MSG-032 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | キャンセル日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |
| M05-01-MSG-033 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | 売上確定日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |
| M05-01-MSG-034 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | 店頭予約日時の開始・終了がともに空でなく、開始が終了より後の場合 | 要ソース確認 |

## M05-06 m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）
`functions/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-06-MSG-003 | インフォ(成功) | 管理画面上部 | メールを送信しました。 | POSTでmode=complete、フォームが送信済み・有効かつ$mailが存在するとき | メールを送信し、受注情報編集画面に遷移する |
| M05-06-MSG-004 | エラー | 管理画面上部 | 注文ID %s の注文情報を取得できませんでした。 | ids配列中にShippingRepositoryのfindBy結果に含まれない配送IDがあるとき | エラーを表示し、受注情報検索・一覧画面に遷移する |
| M05-06-MSG-005 | インフォ(成功) | 管理画面上部 | メールを送信しました。 | POSTでmode=complete、フォームが送信済み・有効かつ$mailが存在するとき | メールを送信し、受注情報検索・一覧画面に遷移する |
| M05-06-MSG-008 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | いずれか未入力でmode=confirm/completeを送信したとき（NotBlank違反でisValid()がfalse） | 送信せず手動メール通知画面に留まる |
| M05-06-MSG-009 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | 未入力でmode=confirm/completeを送信したとき（NotBlank違反でisValid()がfalse） | 送信せず一括手動メール通知画面に留まる |
| M05-06-MSG-010 | 確認 | 画面中央(ダイアログ) | お客様にメールを送信します。よろしいですか？ | #send_mail のクリック時、mode=complete のPOST送信前にブラウザ標準confirmを表示 | 送信せず確認画面に留まる |

## M05-08 m05-08_admin_order_order_stack_paper_print（受注管理 — スタック用紙印刷）
`functions/pf-eccube3/m05-08_admin_order_order_stack_paper_print.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-08-MSG-001 | エラー | 画面中央(ダイアログ、スタック印刷ウィンドウ) | 不正なリクエストです。 | admin_order_print_stackでCSRFトークンが無効 | エラーを表示後、スタック用紙印刷ウィンドウを閉じる |
| M05-08-MSG-002 | エラー | 画面中央(ダイアログ、スタック印刷ウィンドウ) | 要ソース確認 | UpdateStackListAction呼出しでInvalidArgumentExceptionを捕捉 | 要ソース確認 |
| M05-08-MSG-003 | エラー | 画面中央(ダイアログ、スタック印刷ウィンドウ) | 対象の注文が指定されていません。 | admin_order_print_stackでPOSTされたidsが空 | エラーを表示後、スタック用紙印刷ウィンドウを閉じる |
| M05-08-MSG-004 | エラー | 画面中央(ダイアログ、スタック印刷ウィンドウ) | 注文番号が未採番の注文があります。 | 印刷対象の受注に注文番号(order_number)が未採番のものが含まれる | エラーを表示後、スタック用紙印刷ウィンドウを閉じる |
| M05-08-MSG-005 | インフォ(成功) | 画面中央(ダイアログ、スタック印刷ウィンドウ) | 印刷予約を受け付けました。 | スタック用紙印刷の予約処理（UpdateStackListAction）が正常完了 | 完了メッセージを表示後、スタック用紙印刷ウィンドウを閉じる |
| M05-08-MSG-006 | エラー | 画面中央(ダイアログ、スタック印刷ウィンドウ) | システムエラーが発生いたしました。<br>サイト管理者へお問い合わせください。 | admin_order_print_stackへのajaxがfailし、responseJSONが取得できない（タイムアウト・ネットワークエラー等） | エラーを表示後、スタック用紙印刷ウィンドウを閉じる |

## M05-11 m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集）
`functions/pf-eccube3/m05-11_admin_order_order_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-11-MSG-001 | 警告 | 管理画面上部 | 要ソース確認（variable: $warning->getMessage()） | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-002 | エラー | 管理画面上部 | 要ソース確認（variable: $error->getMessage()） | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-003 | エラー | 管理画面上部 | 要ソース確認（variable: $e->getMessage()） | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-004 | エラー | 管理画面上部 | 要ソース確認（variable: $e->getMessage()） | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-005 | エラー | 管理画面上部 | %from% から %to% にはステータス変更できません | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-006 | インフォ(成功) | 管理画面上部 | 全キャンセルが完了しました。 | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-007 | インフォ(成功) | 管理画面上部 | 一部キャンセルが完了しました | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-008 | インフォ(成功) | 管理画面上部 | 保存しました | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-009 | インフォ(成功) | 管理画面上部 | 全キャンセルが完了しました。 | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-010 | インフォ(成功) | 管理画面上部 | 保存しました | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-011 | インフォ(成功) | 管理画面上部 | 保存しました | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-012 | 警告 | 管理画面上部 | 要ソース確認（variable: $warning->getMessage()） | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-013 | エラー | 管理画面上部 | 要ソース確認（variable: $error->getMessage()） | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-014 | インフォ | 管理画面上部 | 出荷に関わる情報が変更されました。送料の変更が必要な場合は、受注管理より手動で変更してください。 | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-015 | インフォ(成功) | 管理画面上部 | 保存しました | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-016 | エラー | 管理画面上部 | 要ソース確認（key_unknown: admin.flash.register_failed） | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-017 | エラー | 管理画面上部 | 保存に失敗しました | 要ソース確認 | 要ソース確認 |
| M05-11-MSG-018 | 警告 | 画面中央(ダイアログ) | search customer failed. | 検索ボタン押下後、admin_order_search_customer_html への POST Ajax が fail したとき | 受注情報編集画面に留まる |
| M05-11-MSG-019 | 警告 | 画面中央(ダイアログ) | search product failed. | 検索ボタン押下後、admin_search_product への POST Ajax が fail したとき | 受注情報編集画面に留まる |
| M05-11-MSG-020 | 警告 | 画面中央(ダイアログ) | search order item type failed. | その他明細モーダルの show.bs.modal 時、admin_order_search_order_item_type への POST Ajax が fail したとき | 受注情報編集画面に留まる |
| M05-11-MSG-021 | 警告 | 画面中央(ダイアログ) | search product failed. | 商品検索結果のページリンク押下後、リンク href への GET Ajax が fail したとき | 受注情報編集画面に留まる |
| M05-11-MSG-022 | 確認 | 画面中央(ダイアログ) | 一部キャンセル時、在庫数等は以下のように変動します。<br>キャンセルしてもよろしいですか？<br>在庫数：キャンセル分増加<br>使用ポイント：変動なし<br>付与予定ポイント：再計算<br>付与済みポイント：変動なし | 取消への／取消からの遷移に該当せず、フォーム上の数量入力欄数が編集前 arrQuantity の件数より少ない（明細削除）とき | キャンセル時は送信せず受注情報編集画面に留まる |
| M05-11-MSG-023 | 確認 | 画面中央(ダイアログ) | 一部キャンセル時、在庫数等は以下のように変動します。<br>キャンセルしてもよろしいですか？<br>在庫数：キャンセル分増加<br>使用ポイント：変動なし<br>付与予定ポイント：再計算<br>付与済みポイント：変動なし | 明細削除に該当せず、編集前数量（arrQuantity）より当該明細の数量が減少したとき | キャンセル時は送信せず受注情報編集画面に留まる |
| M05-11-MSG-024 | 警告 | 画面中央(ダイアログ) | 新規登録時に欠品数量は入力できません。 | isNewOrderRegistration が真（新規登録画面）で、いずれかの明細の欠品数量が 0 より大きいとき | 送信せず受注情報編集画面に留まる |
| M05-11-MSG-025 | 警告 | 画面中央(ダイアログ) | 全ての商品を削除または数量を0に変更する場合、キャンセルしてください。 | 送信前チェックで商品明細の数量合計 tQuantity が 0 になったとき | 送信せず受注情報編集画面に留まる |
| M05-11-MSG-026 | 警告 | 画面中央(ダイアログ) | search product failed. | 検索ボタン押下後、admin_search_product への POST Ajax が fail したとき | 受注情報編集画面に留まる |
| M05-11-MSG-027 | 警告 | 画面中央(ダイアログ) | search order item type failed. | その他明細モーダルの show.bs.modal 時、admin_order_search_order_item_type への POST Ajax が fail したとき | 受注情報編集画面に留まる |
| M05-11-MSG-028 | インフォ | 画面中央(モーダル) | 処理中... | 「出荷メール送信」または「出荷済にする」ボタンで開いた確認モーダルで実行ボタンを押下したとき | 処理完了まで受注情報編集画面に留まる |
| M05-11-MSG-029 | インフォ | 画面中央(モーダル) | システムエラーが発生しました | 確認モーダル実行後の対応状況更新/メール送信のPUT Ajaxがfailしたとき | エラーを表示し、受注情報編集画面に留まる |
| M05-11-MSG-030 | インフォ | 画面中央(モーダル) | 完了しました。 | 確認モーダル実行後の対応状況更新/メール送信のAjaxがalwaysに達したとき(成功・失敗を問わない) | 完了メッセージを表示し、受注情報編集画面に留まる |
| M05-11-MSG-031 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（other: new FormError(<br>                $error->getMessage(),<br>                $error->getMessageTemplate(),<br>                $erro） | 受注新規登録・編集POST時、明細種別ごとの金額・数量符号制約に違反したとき | 要ソース確認 |
| M05-11-MSG-032 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 入力されていません。 | 国が日本で、郵便番号前半postalCode01が空のフォーム送信時 | 受注情報編集画面に留まる |
| M05-11-MSG-033 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 入力されていません。 | 国が日本で、郵便番号後半postalCode02が空のフォーム送信時 | 受注情報編集画面に留まる |
| M05-11-MSG-034 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 郵便番号(海外)を入力してください。 | 国が日本以外で、abroad_postal_codeが空のフォーム送信時 | 受注情報編集画面に留まる |
| M05-11-MSG-035 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 商品が追加されていません | フォーム送信後、商品種別のOrderItemが1件もないとき | 受注情報編集画面に留まる |
| M05-11-MSG-036 | エラー | 管理画面上部 | 出荷IDが指定されていません | admin_order_export_pdfのidsが0件 | 受注情報検索一覧画面に遷移する |
| M05-11-MSG-037 | エラー | 管理画面上部 | 要ソース確認 | OrderPdfService::makePdfがfalse | 要ソース確認 |

## M05-14 m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）
`functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-14-MSG-001 | 確認 | 画面中央(ダイアログ) | 過去にキャンセルされているため、在庫数やポイントの変動はありません。<br>キャンセルしてもよろしいですか？ | 変更後ステータスが取消、変更前ステータスが取消以外、かつ Order.cancelDate が設定済みのとき | OKなら受注編集（詳細）画面に遷移し、キャンセルなら送信せず受注編集（詳細）画面に留まる |
| M05-14-MSG-002 | 確認 | 画面中央(ダイアログ) | 全キャンセル時、在庫数等は以下のように変動します。<br>キャンセルしてもよろしいですか？<br>在庫数：キャンセル分増加<br>使用ポイント：払い戻し<br>付与済みポイント：取り消し | 変更後ステータスが取消、変更前ステータスが取消以外、かつ Order.cancelDate が未設定のとき | OKなら受注編集（詳細）画面に遷移し、キャンセルなら送信せず受注編集（詳細）画面に留まる |
| M05-14-MSG-003 | 確認 | 画面中央(ダイアログ) | キャンセルからステータスを変更する場合は、在庫の変動はありません。<br>別途、在庫の減算操作を行ってください。 | 変更前ステータスが取消で、変更後ステータスが取消以外のとき | OKなら受注編集（詳細）画面に遷移し、キャンセルなら送信せず受注編集（詳細）画面に留まる |
| M05-14-MSG-004 | エラー(バリデーション) | 入力項目直下/フォーム上部 | %from% から %to% にはステータス変更できません | 既存受注で変更前後のステータスが異なり、OrderStateMachineで遷移不可のとき | 変更せず受注編集（詳細）画面に遷移する |

## M05-15 m05-15_admin_order_order_mail（管理画面_受注詳細メール通知）
`functions/ec-cube-enterprise/m05-15_admin_order_order_mail.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-15-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | 要ソース確認 | 要ソース確認 |
| M05-15-MSG-002 | インフォ(成功) | 管理画面上部 | 削除しました | 要ソース確認 | 要ソース確認 |
| M05-15-MSG-003 | インフォ(成功) | 管理画面上部 | メールを送信しました。 | POSTでmode=complete、フォームが送信済みかつ有効なとき | 管理画面_受注管理_受注情報編集画面に遷移する |
| M05-15-MSG-004 | エラー | 管理画面上部 | 選択されたテンプレートの本文が見つかりませんでした。同期が完了していない可能性があります。大変お手数ですが、1分ほど待ってから再度アクセスしてください。 | 選択変更でPOST mode=changeとなり、選択テンプレートのrenderViewでLoaderErrorが発生したとき | メール通知画面に留まる |
| M05-15-MSG-005 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | 件名未入力でmode=confirm/completeを送信したとき（NotBlank違反でisValid()がfalse） | 送信せずメール通知画面に留まる |
| M05-15-MSG-006 | エラー(バリデーション) | 入力項目直下 | Twigのフォーマットが正しくありません。{{ error }} | 本文のTwig構文が不正でtokenize/parse/compileがTwig\Errorを投げたとき（TwigLint制約違反） | 送信せずメール通知画面に留まる |

## M05-18 m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）
`functions/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-18-MSG-001 | エラー | 管理画面上部 | 保存に失敗しました | フォーム未送信またはフォーム検証失敗 | エラーを表示して、出荷指示リスト検索画面に遷移する |
| M05-18-MSG-002 | エラー | 管理画面上部 | 保存に失敗しました | 取得したOrderTypesが空 | エラーを表示して、出荷指示リスト検索画面に遷移する |
| M05-18-MSG-003 | エラー | 管理画面上部 | 要ソース確認 | GenerateShippingStandbyListActionがInvalidArgumentExceptionを送出 | 要ソース確認 |
| M05-18-MSG-004 | インフォ(成功) | 管理画面上部 | 保存しました | 出荷指示リスト生成処理が完了 | 保存完了を表示して、出荷指示リスト検索画面に遷移する |

## M05-20 m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）
`functions/pf-eccube3/m05-20_admin_order_order_shipping_standby_detail_edit_delete.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-20-MSG-001 | エラー | 管理画面上部 | 保存に失敗しました | フォームが未送信またはバリデーション不正のとき | 出荷指示リスト詳細画面に遷移する |
| M05-20-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | フォームが有効で、UpdateCommentAction実行中にInvalidArgumentExceptionが送出されたとき | 要ソース確認 |
| M05-20-MSG-003 | インフォ(成功) | 管理画面上部 | 保存しました | フォームが有効で、UpdateCommentActionが正常終了したとき | 出荷指示リスト詳細画面に遷移する |
| M05-20-MSG-004 | エラー | 管理画面上部 | 要ソース確認 | CSRF検証・対象取得後、DeleteListAction実行中にInvalidArgumentExceptionが送出されたとき | 要ソース確認 |
| M05-20-MSG-005 | インフォ(成功) | 管理画面上部 | 削除しました | CSRF検証・対象取得後、DeleteListActionが正常終了したとき | 出荷指示リスト検索画面に遷移する |
| M05-20-MSG-006 | 確認 | ブラウザ確認ダイアログ（window.confirm） | 削除してもよろしいですか? | リンククリック時（data-confirm/data-message未指定のため常にJS confirmのデフォルト文言が表示される） | 確認後に削除処理へ進み、キャンセル時は出荷指示リスト詳細画面に留まる |

## M05-24 m05-24_admin_order_order_shipping_export_for_import（管理画面_受注管理_出荷実績入力用CSV出力）
`functions/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-24-MSG-001 | エラー | 管理画面上部 | 選択してください | POSTされたorder_idsが配列でない、または空のとき | エラーを表示し、遷移元画面に遷移する（Refererがない場合は受注一覧画面） |
| M05-24-MSG-002 | エラー | 管理画面上部 | 存在しないカードIDが含まれています。 | 選択注文のgenerateResultCsvが空でexportCsvがRuntimeExceptionを送出したとき | エラーを表示し、遷移元画面に遷移する（Refererがない場合は受注一覧画面） |

## M05-26 m05-26_admin_order_order_shipping_result_csv_import（管理画面_受注管理_出荷実績インポート登録）
`functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-26-MSG-001 | インフォ | 管理画面上部 | CSVファイルをアップロードしました | POSTでフォームが有効かつCSV処理後にエラーがなく、flushとトランザクションcommitが完了したとき | 出荷実績インポート登録画面に留まる |
| M05-26-MSG-002 | エラー | 管理画面上部 | 既に %csvName% インポートが実行中です。 | orderRepository->isFree('registerShippingResult')がfalse(実行中)のとき | 出荷実績インポート登録画面に遷移する |
| M05-26-MSG-003 | エラー | 管理画面上部 | 要ソース確認 | 取込処理のtryブロックでThrowableを捕捉したとき | 要ソース確認 |
| M05-26-MSG-004 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | CSV取込・flush・commitが成功したとき | 出荷実績インポート登録画面に遷移する |

## M05-27 m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）
`functions/pf-eccube3/m05-27_admin_order_order_waiting_tag.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M05-27-MSG-001 | 確認 | 画面中央(ダイアログ/モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 自店（WaitingTag.BaseInfo.id == BaseInfo.id）の一覧行で「削除」を押し #DeleteModal が shown.bs.modal になったとき（data-message を p.modal-message へ挿入。%name% は対象行の WaitingTag.waiting_tag） | 削除後、店頭注文番号札管理画面に遷移する。キャンセル時は同画面に留まる |
| M05-27-MSG-002 | エラー | 管理画面上部 | 登録できませんでした。 | POST登録フォームが未送信またはバリデーション不正のとき | 店頭注文番号札管理画面に留まる |
| M05-27-MSG-003 | エラー | 管理画面上部 | 要ソース確認（variable: $e->getMessage()） | 登録処理中にWaitingTagStoreActionが例外を送出したとき | 要ソース確認 |
| M05-27-MSG-004 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | POST登録フォームが有効で、WaitingTagStoreActionが例外なく完了したとき | 店頭注文番号札管理画面に遷移する |
| M05-27-MSG-005 | エラー | 管理画面上部 | 削除に失敗しました | DELETE削除処理中にWaitingTagDeleteActionが例外を送出したとき | 店頭注文番号札管理画面に遷移する |
| M05-27-MSG-006 | エラー(バリデーション) | 入力項目直下 | 半角英字のみで入力してください | 登録POST時、waiting_tagが正規表現 /^[a-zA-Z]+$/ に一致しない | 登録せず店頭注文番号札管理画面に留まる |

## M06-01 m06-01_admin_store_purchase_purchase_store_search_list（管理画面_店頭買取管理_買取検索一覧）
`functions/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M06-01-MSG-001 | エラー | 管理画面上部 | 1つ以上の買取注文情報を選択してください。 | 買取注文を1件も選択せずCSV出力を送信したとき | 買取検索/一覧画面に遷移する |
| M06-01-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | 選択注文の戻しリスト出力バリデーションがエラーを返したとき | 要ソース確認 |
| M06-01-MSG-005 | エラー | 管理画面上部 | 要ソース確認 | ステータス変更でUpdateStatusActionがInvalidArgumentExceptionを送出したとき | 要ソース確認 |
| M06-01-MSG-011 | エラー | 管理画面上部 | 要ソース確認 | 経理払出し済のステータス更新処理が例外を送出したとき | 要ソース確認 |
| M06-01-MSG-014 | エラー | 管理画面上部 | 要ソース確認 | 入庫済みへのステータス更新処理が例外を送出したとき | 要ソース確認 |
| M06-01-MSG-016 | エラー | 管理画面上部 | 要ソース確認 | 有効な詳細フォーム送信後、実在庫更新処理が例外を送出したとき | 要ソース確認 |
| M06-01-MSG-020 | エラー | 管理画面上部 | 要ソース確認 | 個別入力商品の実在庫登録処理が例外を送出したとき | 要ソース確認 |
| M06-01-MSG-021 | エラー | 管理画面上部 | 1つ以上の買取注文情報を選択してください。 | 選択注文IDが空のPDF出力リクエストを受けたとき | 買取検索/一覧画面に遷移する |
| M06-01-MSG-022 | エラー | 管理画面上部 | 要ソース確認 | 選択注文の戻しリストPDF出力バリデーションがエラーを返したとき | 買取検索/一覧画面に遷移する |
| M06-01-MSG-023 | 要ソース確認 | 画面中央の警告ダイアログ | PDF出力する買取情報をひとつ以上選択してください。 | 買取情報を1件も選択せずに戻しリストPDFを押下したとき（otc-buy-order.js:25、サーバへ送信せず中断） | 要ソース確認 |
| M06-01-MSG-024 | 要ソース確認 | 画面中央の警告ダイアログ | ポップアップがブロックされているため、PDFを開けませんでした。ブラウザの設定を確認してください。 | PDF表示用ポップアップがブラウザにブロックされたとき（otc-buy-order.js:39、サーバへ送信せず中断） | 要ソース確認 |
| M06-01-MSG-025 | 要ソース確認 | 画面中央の警告ダイアログ | PDF用データの取得に失敗しました。 | PDF用データ取得のAjaxが失敗、またはok以外の応答にredirectUrlが無いとき（otc-buy-order.js:71,75、ポップアップを閉じて一覧に留まる） | 要ソース確認 |
| M06-01-MSG-029 | 要ソース確認 | 検索フォーム項目下インライン | 不正な日付です。 | 査定申込日時・買取日時の開始が0003-01-01より前のとき（OtcBuyOrderType.php:106,166 Assert\Range minMessage form_error.out_of_range=validators.ja.yaml:60。SearchControllerTraitはisValidを参照しないため検索処理自体は継続する） | 要ソース確認 |
| M06-01-MSG-030 | 要ソース確認 | 管理画面上部フラッシュ | admin.error.sort | orderパラメータがASC/DESC(大小無視)に合致しないとき（SearchControllerTrait.php:143。※admin.error.sort は messages.ja.yaml 未定義キーのため翻訳されずキー文字列がそのまま表示される＝実装バグ候補。画面上に並び順リンクは無くorderクエリ直接指定時のみ到達、初期表示処理を再実行） | 要ソース確認 |

## M06-03 店頭買取管理 — 買取詳細（買取情報の確認と保存）
`functions/pf-eccube3/m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M06-03-MSG-001 | エラー | 管理画面上部 | admin.common.csrf_token_error | CSRFトークン(account_team_paid)が不正なとき | 買取詳細画面に遷移する |
| M06-03-MSG-002 | エラー | 管理画面上部 | この機能は管理者によって制限されています。 | 経理払出し済更新(admin_otcbuyorder_update_status_account_team_paid)へのアクセス権がないとき | 買取詳細画面に遷移する |
| M06-03-MSG-003 | エラー | 管理画面上部 | 経理払出し待ちステータスの買取ではありません | 対象買取のステータスが経理払出し待ちではないとき | 買取詳細画面に遷移する |
| M06-03-MSG-004 | インフォ(成功) | 管理画面上部 | 保存しました | 経理払出し待ちから買取完了への更新が正常完了したとき | 買取詳細画面に遷移する |
| M06-03-MSG-005 | エラー | 管理画面上部 | admin.common.csrf_token_error | CSRFトークン(restocked)が不正なとき | 買取詳細画面に遷移する |
| M06-03-MSG-006 | インフォ(成功) | 管理画面上部 | 保存しました | 入庫済みへのステータス更新が正常完了したとき | 買取詳細画面に遷移する |
| M06-03-MSG-007 | インフォ(成功) | 管理画面上部 | 保存しました | 詳細フォームが有効で実在庫更新またはflushが正常完了したとき | 買取詳細画面に遷移する |
| M06-03-MSG-008 | エラー | 管理画面上部 | admin.common.csrf_token_error | CSRFトークン(register_individual_stock)が不正なとき | 買取詳細画面に遷移する |
| M06-03-MSG-009 | エラー | 管理画面上部 | 商品規格が見つかりません。 | POSTされたproduct_class_idのProductClassが存在しないとき | 買取詳細画面に遷移する |
| M06-03-MSG-010 | インフォ(成功) | 管理画面上部 | 実在庫登録が完了しました。 | 個別入力商品への実在庫登録が正常完了したとき | 買取詳細画面に遷移する |
| M06-03-MSG-011 | 要ソース確認 | 画面中央の警告ダイアログ | 商品の検索に失敗しました。 | 買取詳細の商品検索モーダルで検索・ページングのAjaxが失敗したとき（detail.twig:628,648） | 要ソース確認 |
| M06-03-MSG-012 | 要ソース確認 | 画面中央の確認ダイアログ | 経理払出し済みに変更します。よろしいですか？ | 経理払出し済フォーム送信時の送信前確認（detail.twig:653、キャンセルで送信中止） | 要ソース確認 |
| M06-03-MSG-013 | 要ソース確認 | 画面中央の確認ダイアログ | 編集した内容は元に戻ります。解除しますか？ | 実在庫編集モード中に編集ボタンで解除しようとしたとき（detail.twig:667、OKで編集内容破棄） | 要ソース確認 |

## M06-04 店頭買取管理 — 買取ステータス変更
`functions/pf-eccube3/m06-04_admin_store_purchase_purchase_store_status_change.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M06-04-MSG-001 | エラー | 管理画面上部 | この機能は管理者によって制限されています。 | ステータス変更画面(admin_otcbuyorder_status)へのアクセス権がないとき | 買取情報編集画面に遷移する |
| M06-04-MSG-002 | エラー | 管理画面上部 | この機能は管理者によって制限されています。 | ステータス更新(admin_otcbuyorder_status_update)へのアクセス権がないとき | 買取情報編集画面に遷移する |
| M06-04-MSG-003 | インフォ(成功) | 管理画面上部 | 保存しました | ステータス変更が正常完了したとき | 買取情報編集画面に遷移する |

## M06-05 店頭買取管理 — 買取商品履歴（検索／一覧）
`functions/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M06-05-MSG-001 | エラー | 管理画面上部 | 1つ以上の商品を選択してください | CSV出力で export_type=check_export を送信し、選択商品履歴（otcBuyOrderHistoryIds）が空のとき | エラーを表示し、買取商品履歴（検索／一覧）画面に遷移する |
| M06-05-MSG-002 | エラー | 管理画面上部 | 条件に一致する商品がありません | CSV出力で export_type=all_export を送信し、セッションの検索条件 eccube.admin.otcbuyorder_history.search が null のとき | エラーを表示し、買取商品履歴（検索／一覧）画面に遷移する |

## M06-08 店頭買取管理 — 買取集計データ（検索・一覧表示）
`functions/pf-eccube3/m06-08_admin_store_purchase_purchase_store_summary.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M06-08-MSG-001 | エラー | 管理画面上部 | 検索条件がありません。先に検索を実行してください。 | CSV出力(POST admin_otcbuyorder_summary_export)実行時、セッションの検索条件(eccube.admin.otcbuyorder_summary.search)が存在しないとき | 買取集計データ画面に遷移する |

## M06-13 M06-13（買取商品（キャンセル）CSV）
`functions/ec-cube-enterprise/m06-13_admin_store_purchase_purchase_store_product_cancel_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M06-13-MSG-011 | エラー | 管理画面上部 | 不正なCSV種別です | クエリtypeがsale/notSaleのいずれでもないとき | 買取検索/一覧画面に遷移する |
| M06-13-MSG-021 | 警告(JS) | ブラウザダイアログ | CSV出力する買取注文情報をひとつ以上選択してください。 | 検索結果のチェックボックス(.searched_buy_order_id)が未選択のままクリックしたとき | 送信せず現在の画面に留まる |

## M07-01 m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）
`functions/pf-eccube3/m07-01_admin_online_purchase_purchase_online_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M07-01-MSG-001 | インフォ(成功) | 管理画面上部 | 削除しました | 買取情報を削除し正常終了したとき | 削除し、買取検索一覧画面に遷移する |
| M07-01-MSG-002 | 確認 | 確認モーダル | 買取番号%id% を削除してもよろしいですか？ | 削除リンクをクリックしたとき | OKで削除し、買取検索一覧画面に遷移する／キャンセルで現在の画面に留まる |

## M07-02 m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）
`functions/pf-eccube3/m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M07-02-MSG-001 | エラー | 管理画面上部 | 1つ以上の買取注文情報を選択してください。 | buyOrderIdsが空のとき | 買取一覧画面に遷移する |
| M07-02-MSG-002 | エラー | 管理画面上部 | 存在しない買取注文情報IDが含まれています。 | 選択IDに対応する買取注文が存在せずRuntimeExceptionを送出したとき | 買取一覧画面に遷移する |

## M07-03 ネット買取管理 — 買取情報編集（買取詳細）
`functions/pf-eccube3/m07-03_admin_online_purchase_purchase_online_buy_order_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M07-03-MSG-001 | 警告 | 画面中央(ダイアログ) | search product failed. | 商品検索の POST Ajax（admin_purchase_search_product）が error コールバックに入ったとき | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-002 | 警告 | 画面中央(ダイアログ) | search product failed. | ページング読込の GET Ajax（admin_purchase_search_product_page）が error コールバックに入ったとき | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-003 | 確認 | 画面中央(ダイアログ) | 編集した内容は元に戻ります。解除しますか？ | 実在庫が編集表示（detail_stock_edit）の状態で切替ボタンを押したとき | キャンセル時は買取情報編集（買取詳細）画面に留まり、OK時は閲覧表示に切り替える |
| M07-03-MSG-004 | 警告 | 画面中央(ダイアログ) | 商品の検索に失敗しました。 | 商品検索の POST Ajax（admin_search_product）が error コールバックに入ったとき | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-005 | 警告 | 画面中央(ダイアログ) | 商品の検索に失敗しました。 | ページング読込の GET Ajax（admin_search_product_page）が error コールバックに入ったとき | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-006 | 警告 | 画面中央(ダイアログ) | CSRFトークンが取得できません。 | モードが register で、config.registerIndividualStockToken（detail.twig:98 の csrf_token('purchase_register_individual_stock')）が空のとき | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-007 | 確認 | 画面中央(ダイアログ) | すべての買取商品の売却ステータスを「売却する」に変更します。よろしいですか？ | 一括売却登録ボタン押下時（送信前確認） | キャンセル時は送信せず買取情報編集（買取詳細）画面に留まり、OK時は処理後に買取情報編集（買取詳細）画面に遷移する |
| M07-03-MSG-008 | インフォ | ボタン上(該当ボタン自身) | 査定編集 | ボタンが editable 状態（査定編集中）で押され、確定状態へ戻すとき | 買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-009 | インフォ | ボタン上(該当ボタン自身) | 査定確定 | ボタンが editable でない状態（確定状態）で押され、査定編集を開始するとき | 買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-010 | インフォ | ボタン上(該当ボタン自身) | 編集 | ボタンが editable 状態（編集中）で押され、確定状態へ戻すとき | 買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-011 | インフォ | ボタン上(該当ボタン自身) | 確定 | ボタンが editable でない状態（確定状態）で押され、依頼者情報の編集を開始するとき | 買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-012 | 確認 | 画面中央(ダイアログ/モーダル) | {{ buyMainCard.vars.value.product.name }} を削除してもよろしいですか？ | isSupplyProduct が真かつ hasPersistedId が真の行に描画される「削除」リンクを押下したとき（confirm ダイアログ） | キャンセル時は買取情報編集（買取詳細）画面に留まり、OK時は処理後に買取情報編集（買取詳細）画面に遷移する |
| M07-03-MSG-013 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 買取詳細の保存時、口座番号が数字のみの正規表現に一致しない場合 | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-014 | エラー(バリデーション) | 入力項目直下 | 登録番号を入力してください。 | POST保存時、適格請求書発行事業者フラグがtrueで、登録番号が空の場合 | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-015 | エラー | 管理画面上部 | 要ソース確認 | フォーム送信済みかつ各フォームのいずれかがバリデーション不正のとき | 要ソース確認 |
| M07-03-MSG-016 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | 全フォームが有効で更新処理が成功したとき | 買取情報編集（買取詳細）画面に遷移する |
| M07-03-MSG-017 | エラー | 管理画面上部 | サプライ品以外は削除できません | 対象BuyMainCardがサプライ品でないとき | エラーを表示して、買取情報編集（買取詳細）画面に遷移する |
| M07-03-MSG-018 | インフォ(成功) | 管理画面上部 | 削除しました | サプライ品明細の削除が成功したとき | 完了メッセージを表示して、買取情報編集（買取詳細）画面に遷移する |
| M07-03-MSG-019 | エラー | 管理画面上部 | admin.common.csrf_token_error | CSRFトークン(purchase_register_individual_stock)が不正のとき | エラーを表示して、買取情報編集（買取詳細）画面に遷移する |
| M07-03-MSG-020 | エラー | 管理画面上部 | 商品規格が見つかりません。 | POST product_class_idに対応するProductClassが存在しないとき | エラーを表示して、買取情報編集（買取詳細）画面に遷移する |
| M07-03-MSG-021 | インフォ(成功) | 管理画面上部 | 実在庫登録が完了しました。 | 実在庫登録アクションが成功したとき | 完了メッセージを表示して、買取情報編集（買取詳細）画面に遷移する |
| M07-03-MSG-022 | エラー | 管理画面上部 | 要ソース確認 | registerIndividualStockActionがExceptionを送出したとき | 要ソース確認 |
| M07-03-MSG-023 | 確認 | 確認モーダル | 要ソース確認 | 削除リンクをクリックしたとき | 要ソース確認 |
| M07-03-MSG-024 | 警告(JS) | ブラウザダイアログ | search product failed. | ajaxリクエストがエラーになったとき | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-025 | 確認 | ブラウザダイアログ | 編集した内容は元に戻ります。解除しますか？ | 編集中に編集解除をクリックしたとき | キャンセル時は買取情報編集（買取詳細）画面に留まり、OK時は編集内容を破棄して画面に留まる |
| M07-03-MSG-026 | 警告(JS) | ブラウザダイアログ | 商品の検索に失敗しました。 | ajaxリクエストがエラーになったとき | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-027 | 警告(JS) | ブラウザダイアログ | CSRFトークンが取得できません。 | CSRFトークン(purchase_register_individual_stock)がJS設定から取得できないとき | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-028 | 確認 | ブラウザダイアログ | すべての買取商品の売却ステータスを「売却する」に変更します。よろしいですか？ | ボタンをクリックしたとき | キャンセル時は送信せず買取情報編集（買取詳細）画面に留まり、OK時は処理後に買取情報編集（買取詳細）画面に遷移する |
| M07-03-MSG-029 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 査定価格に数字以外を入力して保存し正規表現 /^\d+$/u に不一致となる場合 | 要ソース確認 |
| M07-03-MSG-030 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 査定編集状態でサプライ品行の price に数字以外を入力して保存し正規表現 /^\d+$/u に不一致となる場合（サプライ品以外の行は査定編集中も readonly のため通常操作では入力不可） | エラーを表示して、買取情報編集（買取詳細）画面に留まる |
| M07-03-MSG-031 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 査定編集状態でサプライ品行の count に数字以外を入力して保存し正規表現 /^\d+$/u に不一致となる場合（サプライ品以外の行は査定編集中も readonly のため通常操作では入力不可） | エラーを表示して、買取情報編集（買取詳細）画面に留まる |

## M07-04 m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）
`functions/pf-eccube3/m07-04_admin_online_purchase_purchase_manual_mail.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M07-04-MSG-001 | インフォ(成功) | 管理画面上部 | メールを送信しました。 | POST mode=completeでフォームが送信済み・有効、かつtemplateがMailTemplateであるとき | 買取情報編集（買取詳細）画面に遷移する |

## M07-05 m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）
`functions/pf-eccube3/m07-05_admin_online_purchase_purchase_csv_export_deposit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M07-05-MSG-001 | エラー | 管理画面上部 | 1つ以上の買取注文情報を選択してください。 | buyOrderIdsが空のとき | 買取検索/一覧画面に遷移する |
| M07-05-MSG-002 | エラー | 管理画面上部 | 存在しない買取注文情報IDが含まれています。 | 選択IDに対応する買取注文が存在せずRuntimeExceptionを送出したとき | 買取検索/一覧画面に遷移する |

## M07-07 M07-07（買取商品（キャンセル）CSV）
`functions/ec-cube-enterprise/m07-07_admin_online_purchase_purchase_online_product_cancel_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M07-07-MSG-001 | エラー | 管理画面上部 | 1つ以上の買取注文情報を選択してください。 | buyOrderIdsが空のとき | エラーを表示し、買取一覧（検索結果）画面に遷移する |
| M07-07-MSG-002 | エラー | 管理画面上部 | 存在しない買取注文情報IDが含まれています。 | 選択IDに対応する買取注文が存在せずRuntimeExceptionを送出したとき | エラーを表示し、買取一覧（検索結果）画面に遷移する |

## M07-08 M07-08（戻しリストCSV）
`functions/ec-cube-enterprise/m07-08_admin_online_purchase_purchase_online_return_list_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M07-08-MSG-001 | エラー | 管理画面上部 | 1つ以上の買取注文情報を選択してください。 | buyOrderIdsが空のとき | 買取検索/一覧画面に遷移する |
| M07-08-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | 戻しリスト要求検証(validateRestockListRequest)がエラーを返したとき | 要ソース確認 |

## M07-09 M07-09（戻しリストPDF）
`functions/ec-cube-enterprise/m07-09_admin_online_purchase_purchase_online_return_list_pdf_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M07-09-MSG-001 | エラー | 管理画面上部 | 1つ以上の買取注文情報を選択してください。 | buyOrderIdsが空のとき | 買取一覧画面に遷移する |
| M07-09-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | 戻しリスト要求検証(validateRestockListRequest)がエラーを返したとき | 要ソース確認 |
| M07-09-MSG-003 | 警告(JS) | ブラウザダイアログ | PDF出力する買取注文情報をひとつ以上選択してください。 | 検索結果のチェックボックス(.searched_buy_order_id)が未選択のままクリックしたとき | 送信せず買取一覧画面に留まる |
| M07-09-MSG-004 | 警告(JS) | ブラウザダイアログ | ポップアップがブロックされているため、PDFを開けませんでした。ブラウザの設定を確認してください。 | window.openがポップアップブロック等でnullを返したとき | 買取一覧画面に留まる |
| M07-09-MSG-005 | 警告(JS) | ブラウザダイアログ | PDF用データの取得に失敗しました。 | ajax応答がok:true/html以外でredirectUrlも無いとき、またはajaxが失敗したとき | 買取一覧画面に留まる |

## M08-01 M08-01（会員検索/一覧）
`functions/pf-eccube3/m08-01_admin_customer_customer_search_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M08-01-MSG-001 | インフォ(成功) | 管理画面上部 | メールを送信しました | CSRF検証後、対象会員が存在し、確認メール送信処理が完了したとき | 会員一覧画面に遷移する |
| M08-01-MSG-002 | インフォ(成功) | 管理画面上部 | 削除しました | CSRF検証後、対象会員が存在し、論理削除（del_flg設定・flush）が成功したとき | 会員一覧画面に遷移する |
| M08-01-MSG-003 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | 対象会員の論理削除時に ForeignKeyConstraintViolationException が発生したとき（%name% は Customer.name01 + 半角空白 + Customer.name02） | 会員一覧画面に遷移する |
| M08-01-MSG-005 | インフォ(成功) | 管理画面上部 | 検索パターン名を登録しました。 | pattern_name が入力済みで、検索パターンの保存（persist・flush）が完了したとき | 会員一覧画面に留まる |
| M08-01-MSG-006 | エラー | 管理画面上部 | 検索パターン名を入力して下さい。 | pattern_name が null または空文字のとき | 会員一覧画面に留まる |
| M08-01-MSG-007 | インフォ(成功) | 管理画面上部 | 検索パターン名を削除しました。 | CSRFトークンが有効で、対象検索パターンが存在し、削除（remove・flush）が完了したとき | 会員一覧画面に遷移する |
| M08-01-MSG-008 | エラー | 管理画面上部 | 検索パターン名を削除できませんでした。 | CSRFトークンが無効なとき、または指定patternIdの検索パターンが存在しないとき | 会員一覧画面に留まる |
| M08-01-MSG-009 | 警告 | 管理画面上部 | 既に削除されています | CSRF検証後、対象会員が存在しない（既に削除済み）とき。既存フラッシュをクリアして警告を表示 | 会員一覧画面に遷移する |
| M08-01-MSG-010 | 確認(confirm) | ブラウザ確認ダイアログ | 削除してもよろしいですか? | クリック時、フォーム送信前のJS確認 | 確認後、検索パターンを削除する |
| M08-01-MSG-011 | エラー | 管理画面上部 | 要ソース確認 | 検索パターン保存（SearchControllerTrait::saveSearchPattern→search）または検索パターン削除（deleteSearchPattern→search）で、order（リクエストパラメータまたはセッション保持値）が ASC/DESC/asc/desc のいずれにも一致しないとき | 要ソース確認 |

## M08-02 会員管理 — メール一括送信
`functions/pf-eccube3/m08-02_admin_customer_customer_mail_all.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M08-02-MSG-001 | 警告 | 画面中央(ダイアログ) | チェックボックスが選択されていません | 当該リンクを押下した時点で input[id^=check-]:checked が0件（会員が1件も選択されていない）とき | 会員一覧画面に留まる |

## M08-04 M08-04（会員登録/編集）
`functions/pf-eccube3/m08-04_admin_customer_customer_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M08-04-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | フォームが送信済みかつ有効で、flush・完了イベントdispatch後に成功フラッシュを追加したとき | M08-04（会員登録/編集）画面に遷移する |
| M08-04-MSG-006 | エラー(バリデーション) | 入力項目直下 | 生年月日が不正な日付です。 | 会員登録・編集フォーム送信時、生年月日が当日以後でLessThanOrEqual制約に違反するとき | M08-04（会員登録/編集）画面に留まる |
| M08-04-MSG-007 | エラー(バリデーション) | 入力項目直下/フォーム上部 | パスワードはメールアドレスと同じ値を設定できません。 | 会員登録・編集フォーム送信時、plainPasswordが空でなくemailと等しいとき | M08-04（会員登録/編集）画面に留まる |
| M08-04-MSG-008 | エラー(バリデーション) | 入力項目直下/フォーム上部 | このメールアドレスは利用できません。 | 会員登録・編集フォーム送信時、emailが空でなくCustomerRepository::findOtherEmails(email,id)が結果を返すとき | M08-04（会員登録/編集）画面に留まる |
| M08-04-MSG-009 | エラー(バリデーション) | 入力項目直下/フォーム上部 | すべて入力してください | FAX番号3分割のうちfax01のみ未入力で、fax02またはfax03が入力されているフォーム送信時 | M08-04（会員登録/編集）画面に留まる |

## M08-05 会員管理 — ポイント付与・ポイント履歴
`functions/pf-eccube3/m08-05_admin_customer_point.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M08-05-MSG-001 | エラー | 管理画面上部 | システムエラーが発生しました | POST送信済みかつフォームが有効で、種別に対応するポイント種別（$PointType）が取得できないとき | エラーを表示し、ポイント履歴画面に遷移する |
| M08-05-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | POST送信済みかつフォームが有効で、ポイント履歴・会員ポイントを保存（flush）したとき | 保存し、ポイント履歴画面に遷移する |
| M08-05-MSG-003 | エラー(バリデーション) | 入力項目直下/フォーム上部 | この会員は該当のオーダーIDを持っていません。 | ポイント付与POST時、orderNumber欄が有効で値があり、対象会員がその注文番号を持たないとき | エラーを表示し、ポイント履歴画面に留まる |
| M08-05-MSG-004 | エラー(バリデーション) | 入力項目直下/フォーム上部 | ポイント残高を0未満にすることはできません。 | ポイント付与POST時、会員の現在ポイントとpointChangeの合計が0未満になるとき | エラーを表示し、ポイント履歴画面に留まる |

## M08-08 M08-08（手動メール通知）
`functions/pf-eccube3/m08-08_admin_customer_customer_manual_mail.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M08-08-MSG-001 | インフォ(成功) | 管理画面上部 | メール送信が完了しました。 | POSTされた手動メールフォームが有効で、mode=complete のとき | 会員登録/編集画面に遷移する |

## M08-09 会員管理 — 配送先一覧表示/編集
`functions/pf-eccube3/m08-09_admin_customer_customer_delivery.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M08-09-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | admin_customer_delivery_new または admin_customer_delivery_edit へのPOSTでフォームが送信済みかつ妥当な場合(persist/flush成功後) | 配送先編集画面に遷移する |
| M08-09-MSG-002 | インフォ(成功) | 管理画面上部 | 削除しました | DELETE admin_customer_delivery_delete で対象お届け先が存在し会員が一致し、削除が成功した場合 | 会員情報編集画面に遷移する |
| M08-09-MSG-003 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | DELETE admin_customer_delivery_delete の削除処理で ForeignKeyConstraintViolationException が発生した場合 | 会員情報編集画面に遷移する |

## M08-10 M08-10（オンライン本人確認）
`functions/pf-eccube3/m08-10_admin_customer_customer_online_identification.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M08-10-MSG-001 | エラー | 管理画面上部 | 身分証有効期限の値が不正です | POSTされた id_expiration_date が空でなく、new DateTime(...) が例外になったとき | 会員編集画面に遷移する |
| M08-10-MSG-002 | エラー | 管理画面上部 | システムエラーが発生しました | MtbIdentityConfirmStatus::STATUS_CONFIRMED の検索結果がnullのとき | 会員編集画面に遷移する |
| M08-10-MSG-003 | エラー | 管理画面上部 | システムエラーが発生しました | Customer.getPlayer() の結果がnullのとき | 会員編集画面に遷移する |
| M08-10-MSG-004 | インフォ(成功) | 管理画面上部 | 保存しました | playerEntityManager->save(...) および entityManager->flush() の後に成功フラッシュを追加したとき | 会員編集画面に遷移する |

## M08-12 会員管理 — 顧客グループ管理
`functions/pf-eccube3/m08-12_admin_customer_customer_group.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M08-12-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | index()でフォームが送信済みかつ検証成功し、顧客グループを保存・flushした直後 | 顧客グループ管理画面に遷移する |
| M08-12-MSG-002 | エラー | 管理画面上部 | この購入グループは商品で使用されているため、 %name% は削除することができません。 | delete()で対象顧客グループの getPlayers()->count() が0より大きい（会員が紐づく）場合 | エラーを表示し、顧客グループ管理画面に遷移する |
| M08-12-MSG-003 | インフォ(成功) | 管理画面上部 | 削除しました | delete()で getPlayers()->count() が0、かつリポジトリの削除が例外なく完了した場合 | 顧客グループ管理画面に遷移する |
| M08-12-MSG-004 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | delete()の削除処理で \Exception が送出された場合（関連データによる外部キー制約違反等） | エラーを表示し、顧客グループ管理画面に遷移する |

## M08-13 会員管理 — ブラックリスト登録/編集/削除
`functions/pf-eccube3/m08-13_admin_customer_customer_blacklist.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M08-13-MSG-001 | エラー | 管理画面上部 | 保存に失敗しました | POST admin_customer_blacklist_update でフォームが妥当でない($form->isValid()がfalse)場合 | ブラックリスト登録/編集/削除画面に留まる |
| M08-13-MSG-002 | エラー | 管理画面上部 | 保存に失敗しました | POST admin_customer_blacklist_update でブラックリスト更新処理(BlacklistUpdateAction::handle)が例外を送出した場合 | ブラックリスト登録/編集/削除画面に留まる |
| M08-13-MSG-003 | インフォ(成功) | 管理画面上部 | 保存しました | POST admin_customer_blacklist_update でフォームが妥当かつ更新処理が例外なく完了した場合 | ブラックリスト登録/編集/削除画面に遷移する |
| M08-13-MSG-004 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 入力が正しくありません | POST更新時、既存行のキーワードが空 | ブラックリスト登録/編集/削除画面に留まる |
| M08-13-MSG-005 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 入力が正しくありません | POST更新時、既存行の項目が電話番号かつキーワードが半角数字以外 | ブラックリスト登録/編集/削除画面に留まる |
| M08-13-MSG-006 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 既に登録されています | POST更新時、同一の項目IDとキーワードの組が送信内で重複 | ブラックリスト登録/編集/削除画面に留まる |
| M08-13-MSG-007 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 新規登録の項目が選択されていません | POST更新時、新規キーワードが入力済みかつ新規登録の項目が未選択 | ブラックリスト登録/編集/削除画面に留まる |
| M08-13-MSG-008 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 既に登録されています | POST更新時、新規登録の項目と新規キーワードの組が送信内の既存行と重複 | ブラックリスト登録/編集/削除画面に留まる |
| M08-13-MSG-009 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 入力が正しくありません | POST更新時、新規登録の項目が電話番号かつ新規キーワードが半角数字以外 | ブラックリスト登録/編集/削除画面に留まる |

## M09-03 m09-03_admin_content_content_layout（管理画面_レイアウト管理）
`functions/ec-cube-enterprise/m09-03_admin_content_content_layout.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M09-03-MSG-001 | 警告 | 画面中央(ダイアログ) | プレビューするページを選択してください | 既存レイアウトの編集画面（Layout.id あり、layout.twig:159）でプレビューボタンを押下し、プレビュー対象ページ選択（form.Page）が未選択（空値）のとき | 送信せず現在の画面に留まる |

## M09-04 M09-04（ページ管理）
`functions/pf-eccube3/m09-04_admin_content_content_page.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M09-04-MSG-001 | インフォ | 管理画面上部 | この機能の利用頻度が低い場合、使用しない間は無効化することでセキュリティを更に向上させることができます。環境変数 ECCUBE_RESTRICT_FILE_UPLOAD を 1 に設定することで機能を無効化することが可能です。 | editアクション(new/edit)実行時、eccube.admin.infoフラッシュ（restrict_file_upload_info）が未登録のとき | ページ登録・編集画面に留まる |
| M09-04-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済みかつ妥当で、ページ・テンプレート等の保存処理が完了したとき（addSuccess save_complete） | ページ編集画面に遷移する |
| M09-04-MSG-003 | インフォ(成功) | 管理画面上部 | 削除しました | DELETEで対象Pageが存在し、かつユーザー作成ページ（EDIT_TYPE_USER）を削除完了したとき（addSuccess delete_complete） | ページ一覧画面に遷移する |
| M09-04-MSG-004 | 警告 | 管理画面上部 | 既に削除されています | DELETEで対象Pageが存在しないとき（pageRepository->findOneBy(['id'=>$id]) が空 → deleteMessage()） | ページ一覧画面に遷移する |
| M09-04-MSG-005 | 確認(モーダル) | 削除確認モーダル内 | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除ボタン押下で削除確認モーダルを表示するとき（page.twig:95-113） | 削除を実行してページ一覧画面に遷移する、または削除せずページ一覧画面に留まる |
| M09-04-MSG-006 | エラー(バリデーション) | 入力項目直下（URL欄） | 既にURLが存在しています。 | POST_SUBMIT時、同一URLのPageが既に存在するとき（更新時は自身を、確認ページはmasterページを重複判定から除外） | エラーを表示してページ登録・編集画面に留まる |
| M09-04-MSG-007 | エラー(バリデーション) | 入力項目直下（ファイル名欄） | 同じファイル名のデータが存在しています。別のファイル名を入力してください。 | POST_SUBMIT時、同名file_nameのユーザー作成ページ（EDIT_TYPE_USER）が存在するとき、またはEDIT_TYPE_USERページの保存でEDIT_TYPE_DEFAULT以上のfile_nameと重複するとき（更新時は自身を除外） | エラーを表示してページ登録・編集画面に留まる |
| M09-04-MSG-008 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | name・url・file_name（url/file_nameはユーザー作成ページのみ必須）・tpl_data が未入力で送信したとき（NotBlank） | エラーを表示してページ登録・編集画面に留まる |
| M09-04-MSG-009 | エラー(バリデーション) | 入力項目直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | 各欄が Length 最大長（eccube_stext_len / eccube_ltext_len）を超過して送信したとき | エラーを表示してページ登録・編集画面に留まる |
| M09-04-MSG-010 | エラー(バリデーション) | 入力項目直下 | 有効な値ではありません。 | ユーザー作成ページで url が /^([0-9a-zA-Z_\-]+\/?)+(?<!\/)$/、file_name が /^([0-9a-zA-Z_\-]+\/?)+$/ に一致しないとき（Regex） | エラーを表示してページ登録・編集画面に留まる |
| M09-04-MSG-011 | エラー(バリデーション) | 入力項目直下（ページ内容欄） | Twigのフォーマットが正しくありません。{{ error }} | tpl_data がTwigとして構文エラーのとき（TwigLintバリデータがtokenize/parse/compileでTwig\Error\Errorを捕捉） | エラーを表示してページ登録・編集画面に留まる |
| M09-04-MSG-012 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 既にURLが存在しています。 | ページ登録・編集POST時、確認用ページの親ページを除く別Pageに同じURLが存在するとき | エラーを表示してページ登録・編集画面に留まる |
| M09-04-MSG-013 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 同じファイル名のデータが存在しています。別のファイル名を入力してください。 | ページ登録・編集POST時、別のユーザー編集ページ（EDIT_TYPE_USER）に同じファイル名が存在するとき | エラーを表示してページ登録・編集画面に留まる |
| M09-04-MSG-014 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 同じファイル名のデータが存在しています。別のファイル名を入力してください。 | ユーザー編集ページの登録・編集POST時、別の標準ページ（EDIT_TYPE_DEFAULT以上）に同じファイル名が存在するとき | エラーを表示してページ登録・編集画面に留まる |

## M09-05 m09-05_admin_content_content_css（管理画面_コンテンツ管理_CSS管理）
`functions/ec-cube-enterprise/m09-05_admin_content_content_css.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M09-05-MSG-001 | インフォ | 管理画面上部 | この機能の利用頻度が低い場合、使用しない間は無効化することでセキュリティを更に向上させることができます。環境変数 ECCUBE_RESTRICT_FILE_UPLOAD を 1 に設定することで機能を無効化することが可能です。 | CSS管理画面に到達したとき（同一セッションで未表示のときのみ1回） | CSS管理画面に留まる |
| M09-05-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | CSS管理のPOSTが送信済みかつ検証成立で、customize.css への全文上書き保存が成功したとき | CSS管理画面に遷移する |
| M09-05-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | CSS管理のPOSTが送信済みかつ検証成立で、customize.css の書き込み（dumpFile）またはストレージ処理で IOException が発生したとき | CSS管理画面に留まる |

## M09-06 m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）
`functions/ec-cube-enterprise/m09-06_admin_content_content_js.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M09-06-MSG-001 | インフォ | 管理画面上部 | この機能の利用頻度が低い場合、使用しない間は無効化することでセキュリティを更に向上させることができます。環境変数 ECCUBE_RESTRICT_FILE_UPLOAD を 1 に設定することで機能を無効化することが可能です。 | admin_content_js（GET/POST）の処理冒頭で addInfoOnce が呼ばれ、eccube.admin.info フラッシュバッグにメッセージが1件も未積載のとき（addFlashOnce の hasMessage 判定。フラッシュは描画時に消費されるため、この抑止はリクエスト内の重複積載防止であり、通常は画面表示のたびに表示される） | JavaScript管理画面に留まる |
| M09-06-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | POST /%eccube_admin_route%/content/js でフォームが送信済みかつ妥当（isSubmitted && isValid）であり、customize.js への dumpFile が成功したとき | JavaScript管理画面に遷移する |
| M09-06-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | POST /%eccube_admin_route%/content/js の保存処理（customize.js への dumpFile またはファイルアダプタ upload）で IOException が発生したとき | JavaScript管理画面に留まる |

## M09-07 M09-07（ブロック管理）
`functions/pf-eccube3/m09-07_admin_content_content_block.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M09-07-MSG-001 | インフォ | 管理画面上部 | この機能の利用頻度が低い場合、使用しない間は無効化することでセキュリティを更に向上させることができます。環境変数 ECCUBE_RESTRICT_FILE_UPLOAD を 1 に設定することで機能を無効化することが可能です。 | ブロック新規入力画面／編集画面に到達したとき（同一セッションで未表示のときのみ1回） | ブロック管理（登録・編集）画面に留まる |
| M09-07-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | 新規入力／編集のPOSTが送信済みかつ検証成立で、ブロック属性の保存とテンプレート本文のファイル書き出しが完了したとき | ブロック管理（登録・編集）画面に遷移する |
| M09-07-MSG-003 | インフォ(成功) | 管理画面上部 | 削除しました | DELETE送信かつCSRFトークン妥当で、対象ブロックが削除可能（deletable）のとき、ブロックファイルとレコードの削除が完了した後 | ブロック管理（一覧）画面に遷移する |
| M09-07-MSG-004 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 同じファイル名のデータが存在しています。別のファイル名を入力してください。 | 新規作成または編集POST時、同じ端末種別に同一ファイル名の別ブロックが存在 | ブロック管理（登録・編集）画面に留まる |

## M09-08 m09-08_admin_content_content_cache（管理画面_コンテンツ管理_キャッシュ管理）
`functions/ec-cube-enterprise/m09-08_admin_content_content_cache.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M09-08-MSG-003 | インフォ(成功) | 管理画面上部 | 削除しました | POSTフォームが送信・妥当で、cacheUtil->clearCache()実行後に成功通知として登録 | 管理画面_コンテンツ管理_キャッシュ管理画面に留まる |
| M09-08-MSG-004 | 要ソース確認 | （表示文言なし・内部フラグ） | 要ソース確認 | POSTフォームが送信・妥当で、eccube_allow_maintenance_modeがtrueのとき、cacheUtil->clearCache()呼び出し後に登録 | 要ソース確認 |
| M09-08-MSG-005 | インフォ | 画面に表示しない（JS起動用フラグ） | 要ソース確認 | キャッシュ管理のPOSTが送信済みかつ検証成立で、設定 eccube_allow_maintenance_mode が true のとき | 要ソース確認 |
| M09-08-MSG-006 | インフォ(成功) | 管理画面上部 | 削除しました | キャッシュ管理のPOSTが送信済みかつ検証成立で、キャッシュ削除処理を予約した後 | 管理画面_コンテンツ管理_キャッシュ管理画面に留まる |

## M09-09 m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）
`functions/ec-cube-enterprise/m09-09_admin_content_content_maintenance.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M09-09-MSG-001 | インフォ(成功) | 管理画面上部 | メンテナンスモードを有効にしました。 | POSTフォームが送信・妥当で、isMaintenanceがfalseかつmaintenance=onのとき | 管理画面_コンテンツ管理_メンテナンス管理画面に遷移する |
| M09-09-MSG-002 | インフォ(成功) | 管理画面上部 | メンテナンスモードを無効にしました。 | POSTフォームが送信・妥当で、isMaintenanceがtrueかつmaintenance=offのとき | 管理画面_コンテンツ管理_メンテナンス管理画面に遷移する |

## M09-10 M09-10（支店トップページ管理）
`functions/pf-eccube3/m09-10_admin_content_content_branch_top_page.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M09-10-MSG-001 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | common_setting_flgがtrueで、branch_toppage_managementのCSRFトークンが無効のとき | 支店トップページ管理画面に留まる |
| M09-10-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | common_setting_flgがtrueで、CSRFトークンが有効でBaseInfoの保存(persist/flush)が完了したとき | 支店トップページ管理画面に留まる |
| M09-10-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | common_setting_flgがfalseで、フォームが未送信またはバリデーション不正のとき | 支店トップページ管理画面に留まる |
| M09-10-MSG-004 | インフォ(成功) | 管理画面上部 | 保存しました | common_setting_flgがfalseで、フォーム有効かつvalidateTopPageManagementがtrueで保存(persist/flush)が完了したとき | 支店トップページ管理画面に留まる |
| M09-10-MSG-005 | エラー | 管理画面上部 | バナー画像の登録に失敗しました。 | バナー画像ファイルが指定され、storeBannerImageの戻り値がnullまたは空文字のとき | 支店トップページ管理画面に留まる |
| M09-10-MSG-006 | エラー | 管理画面上部 | バナー画像の登録に失敗しました。 | バナー画像ファイル未指定で、既存値と送信値が同一かつ既存バナー画像が空文字のとき | 支店トップページ管理画面に留まる |
| M09-10-MSG-007 | エラー | 管理画面上部 | バナー画像の登録に失敗しました。 | バナー画像ファイル未指定で、既存値と送信値が異なり、送信バナー画像が空文字のとき | 支店トップページ管理画面に留まる |
| M09-10-MSG-008 | エラー | 管理画面上部 | タイル位置に重複があります。すべてのタイルは異なる位置を選択してください。 | validateTilesで複数タイルのsection値が重複したとき | 支店トップページ管理画面に留まる |
| M09-10-MSG-009 | エラー | 管理画面上部 | タイルタグを設定してください。（※タイル属性がピックアップ商品の場合を除く） | validateTilesでタイル属性がピックアップ商品(MtbTileType::PICKUP_PRODUCT)以外、かつタイルタグがnullのとき | 支店トップページ管理画面に留まる |

## M10-01 店舗基本設定（SHOPマスター／旧ショップマスター）
`functions/pf-eccube3/m10-01_admin_shop_setting_setting_shop.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-01-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | POST /{admin_route}/setting/shop でフォームが送信済みかつ有効 | 店舗基本設定画面に遷移する |
| M10-01-MSG-002 | エラー(バリデーション) | 入力項目直下 | 半角英数字で入力してください。 | POST /{admin_route}/setting/shop で値が /^[[:graph:][:space:]]+$/i に一致しない | 店舗基本設定画面に留まる |
| M10-01-MSG-003 | エラー(バリデーション) | 入力項目直下 | 半角英数字で入力してください。 | POST /{admin_route}/setting/shop で値が /^[[:graph:][:space:]]+$/i に一致しない | 店舗基本設定画面に留まる |
| M10-01-MSG-004 | エラー(バリデーション) | 入力項目直下 | 半角英数字で入力してください。 | POST /{admin_route}/setting/shop で値が /^[A-Za-z0-9 ]*$/ に一致しない | 店舗基本設定画面に留まる |
| M10-01-MSG-005 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | POST /{admin_route}/setting/shop で値が /^\d+$/ に一致しない | 店舗基本設定画面に留まる |
| M10-01-MSG-006 | エラー(バリデーション) | 入力項目直下 | 半角英数字で入力してください。 | POST /{admin_route}/setting/shop で値が /^[[:alnum:]]+$/ に一致しない | 店舗基本設定画面に留まる |
| M10-01-MSG-007 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | POST /{admin_route}/setting/shop で値が /^\d+$/u に一致しない | 店舗基本設定画面に留まる |

## M10-04 店舗設定 — 支払方法管理（支払方法・手数料・利用条件）
`functions/pf-eccube3/m10-04_admin_base_setting_setting_shop_payment.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-04-MSG-007 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済みかつバリデーション成功 | 支払方法編集画面に遷移する |
| M10-04-MSG-008 | インフォ(成功) | 管理画面上部 | 削除しました | 支払方法の削除・flush成功 | 支払方法一覧画面に遷移する |
| M10-04-MSG-009 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | 支払方法削除時にForeignKeyConstraintViolationExceptionが発生 | 支払方法一覧画面に遷移する |
| M10-04-MSG-010 | インフォ(成功) | 管理画面上部 | 「%name%」を表示にしました。 | 切替後のPayment.visibleがtrue | 支払方法一覧画面に遷移する |
| M10-04-MSG-011 | インフォ(成功) | 管理画面上部 | 「%name%」を非表示にしました。 | 切替後のPayment.visibleがfalse | 支払方法一覧画面に遷移する |
| M10-04-MSG-012 | エラー(バリデーション) | 入力項目直下（利用条件下限欄） | 数字で入力してください。 | rule_minが正規表現 ^\d+$ に不一致（数字以外を入力して送信） | 支払方法編集画面に留まる |
| M10-04-MSG-013 | エラー(バリデーション) | 入力項目直下（利用条件下限欄） | 下限・上限の値を確認してください | POST_SUBMITリスナーでrule_min・rule_maxがともに空でなくrule_max < rule_min | 支払方法編集画面に留まる |
| M10-04-MSG-014 | 確認 | 削除確認モーダル本文 | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除ボタン押下で削除確認モーダルを表示（data-messageをJSで本文へ挿入） | 削除確認モーダルを表示し、削除時は支払方法一覧画面に遷移、キャンセル時は支払方法一覧画面に留まる |
| M10-04-MSG-015 | エラー | 画像入力項目直下(#payment_image_error) | アップロードに失敗しました | 画像アップロードでFilePondのerrorイベント発生かつerror.mainが未定義 | 支払方法編集画面に留まる |
| M10-04-MSG-016 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | 各項目のNotBlank制約違反（未入力で送信） | 支払方法編集画面に留まる |
| M10-04-MSG-017 | エラー(バリデーション) | 入力項目直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | Length最大長(eccube_stext_len)超過 | 支払方法編集画面に留まる |
| M10-04-MSG-018 | 確認 | 画面中央(ダイアログ/モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除アイコンを押下し DeleteModal が開いたとき（data-message に Payment.method を %name% として埋め込み、modal-message へ挿入） | 削除確認モーダルを表示し、削除時は支払方法一覧画面に遷移、キャンセル時は支払方法一覧画面に留まる |
| M10-04-MSG-019 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | rule_minが正規表現^\d+$に一致しないとき | 支払方法編集画面に留まる |
| M10-04-MSG-020 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 下限・上限の値を確認してください | rule_minとrule_maxがともに空でなく、rule_maxがrule_min未満のとき | 支払方法編集画面に留まる |

## M10-06 店舗基本設定 — 配送業者・配送料・お届け時間（配送方法管理）
`functions/pf-eccube3/m10-06_admin_base_setting_setting_shop_delivery.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-06-MSG-001 | 確認 | 画面中央(ダイアログ/モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 一覧の対象行の削除アイコンを押下し DeleteModal が表示されたとき（shown.bs.modal で data-message を p.modal-message へ設定。%name% は当該 Delivery.name） | 削除時は配送方法一覧画面に遷移し、キャンセル時は配送方法一覧画面に留まる |
| M10-06-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済みかつバリデーション成功 | 配送方法一覧画面に遷移する |
| M10-06-MSG-003 | 警告 | 管理画面上部 | 税込%min% ~ %max%の購入で選択できる支払い方法がありません。支払方法の利用条件をご確認ください。 | 保存後、支払方法が存在し統合後の利用条件範囲が2件以上（count($mergedRules) > 1） | 配送方法編集画面に遷移する |
| M10-06-MSG-004 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | 配送方法削除時にForeignKeyConstraintViolationExceptionが発生 | 配送方法一覧画面に遷移する |
| M10-06-MSG-005 | インフォ(成功) | 管理画面上部 | 削除しました | 配送方法の削除・flush成功 | 配送方法一覧画面に遷移する |
| M10-06-MSG-006 | インフォ(成功) | 管理画面上部 | 要ソース確認 | 対象配送方法の表示状態を反転 | 要ソース確認 |
| M10-06-MSG-007 | インフォ(成功) | 管理画面上部 | 地域別最短到着日設定を保存しました。 | POST(保存)リクエスト | 地域別最短到着日設定画面に遷移する |

## M10-07 店舗設定 — 税率設定（共通税率・商品別税率オプション）
`functions/pf-eccube3/m10-07_admin_base_setting_setting_shop_tax.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-07-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | modeがedit_inline以外で、新規税率フォームを送信し有効なとき | 税率設定画面に遷移する |
| M10-07-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | mode=edit_inline のPOSTで、tax_rule_idが当該税率行IDと一致し編集フォームが有効なとき | 税率設定画面に遷移する |
| M10-07-MSG-003 | インフォ(成功) | 管理画面上部 | 削除しました | DELETEでCSRFトークンが有効かつ対象税率がデフォルト税率ではないとき | 税率設定画面に遷移する |
| M10-07-MSG-004 | 確認 | 画面中央(ダイアログ) | 削除します | 非デフォルト税率行の削除アイコンを押下し削除確認モーダルを開いたとき | 削除確認モーダルを表示する |
| M10-07-MSG-005 | 確認 | 画面中央(ダイアログ) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 非デフォルト税率行の削除アイコンを押下し削除確認モーダルを開いたとき | 削除時は税率設定画面に遷移し、キャンセル時は税率設定画面に留まる |
| M10-07-MSG-006 | エラー(バリデーション) | 入力項目直下 | 数字と小数点のみ入力できます。 | 税率(tax_rate)が正規表現 /^\d+(\.\d+)?$/u に一致しないとき | 税率設定画面に留まる |
| M10-07-MSG-007 | エラー(バリデーション) | 入力項目直下 | 同時刻の適用日時を設定できません。 | 適用日時が既存の共通税率(ProductClassがNULL)と重複するとき（自身のIDは除外） | 税率設定画面に留まる |
| M10-07-MSG-008 | エラー(バリデーション) | 入力項目直下 | 数字と小数点のみ入力できます。 | POST送信時、tax_rateが正規表現 /^\d+(\.\d+)?$/u に一致しない | 税率設定画面に留まる |
| M10-07-MSG-009 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 同時刻の適用日時を設定できません。 | POST_SUBMIT時、ProductClassがNULLの既存税率と適用日時が重複し、編集時は自身のIDを除外した件数が1件以上 | 税率設定画面に留まる |

## M10-08 店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）
`functions/pf-eccube3/m10-08_admin_base_setting_setting_shop_auto_mail.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-08-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | POSTでMail IDが特定済み（Mail->getId()が非null）かつform->isSubmitted() && form->isValid()が真のとき | 店舗設定／自動送信メールテンプレート編集画面に遷移する |
| M10-08-MSG-002 | 要ソース確認 | 要ソース確認 | 要ソース確認 | 要ソース確認 | 要ソース確認 |
| M10-08-MSG-003 | エラー(JS) | ブラウザダイアログ | 新規作成は許可されていません。 | テンプレ未選択（Mail IDが空）のままフォーム送信したとき | 送信せず現在の画面に留まる |
| M10-08-MSG-004 | エラー | 400エラー応答 | 新規作成は許可されていません。 | POSTでMail->getId()がnullのとき（新規作成フローは未許可） | エラーを表示する |
| M10-08-MSG-005 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | 未入力で「登録」送信したとき（NotBlank違反） | 店舗設定／自動送信メールテンプレート編集画面に留まる |
| M10-08-MSG-006 | エラー(バリデーション) | 入力項目直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | 最大長超過で「登録」送信したとき（name・mail_subject=eccube_stext_len(255) のLength違反） | 店舗設定／自動送信メールテンプレート編集画面に留まる |
| M10-08-MSG-007 | インフォ(成功) | 管理画面上部 | 保存しました | POSTでフォームが送信済みかつ有効であり、対象メールテンプレートのIDが存在するとき | 店舗設定／自動送信メールテンプレート編集画面に遷移する |

## M10-10 CSV出力項目設定（店舗設定）
`functions/pf-eccube3/m10-10_admin_base_setting_setting_shop_csv.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-10-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | CSV出力項目（出力/非出力の並び・有効状態）の保存が成功したとき（POST送信・CSRFトークン有効） | CSV出力項目設定（店舗設定）画面に遷移する |

## M10-11 m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）
`functions/ec-cube-enterprise/m10-11_admin_base_setting_setting_shop_order_status.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-11-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済みかつバリデーション有効で受注対応状況を保存し正常終了したとき | 管理画面_店舗設定_受注対応状況設定画面に遷移する |
| M10-11-MSG-002 | エラー(バリデーション) | 入力項目直下 | 入力されていません。 | 各行の name / customer_order_status_name / color の NotBlank制約違反（未入力で送信） | 管理画面_店舗設定_受注対応状況設定画面に留まる |
| M10-11-MSG-003 | エラー(バリデーション) | 入力項目直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | Length最大長(eccube_stext_len=255)超過 | 管理画面_店舗設定_受注対応状況設定画面に留まる |

## M10-12 m10-12_admin_base_setting_setting_shop_calendar（管理画面_店舗設定_定休日カレンダー設定）
`functions/ec-cube-enterprise/m10-12_admin_base_setting_setting_shop_calendar.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-12-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | mode が edit_inline 以外で、新規登録フォームがPOST送信され isSubmitted() かつ isValid() のとき | 管理画面ホームに遷移する |
| M10-12-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | mode=edit_inline のPOSTで calendar_id が対象Calendar.idと一致し編集フォームが isValid() のとき | 管理画面ホームに遷移する |
| M10-12-MSG-003 | インフォ(成功) | 要ソース確認 | 削除しました | 削除リンクがCSRFトークン付きDELETEで送信され isTokenValid() を通過したとき | 要ソース確認 |
| M10-12-MSG-004 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 同日の定休日が既に存在しているため、設定できません。 | 新規登録またはインライン編集のPOST_SUBMIT時、同一holiday・同一BaseInfoの別Calendarが存在するとき | 定休日カレンダー設定画面に留まる |

## M10-13 カスタムCSV出力項目設定（店舗設定／システム設定）
`functions/pf-eccube3/m10-13_admin_base_setting_setting_shop_csv_custom.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-13-MSG-001 | インフォ(成功) | 管理画面上部 | CSV出力項目を保存しました。 | POST updateでCustomerCsvUpdateAction::handleが例外なく完了したとき | カスタムCSV出力項目設定画面に遷移する |
| M10-13-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | POST updateのtry節で捕捉されるExceptionが発生したとき | 要ソース確認 |
| M10-13-MSG-003 | インフォ(成功) | 管理画面上部 | 削除しました | DELETE deleteで関連付け削除・CSV拡張定義削除・flushが例外なく完了したとき | カスタムCSV出力項目設定画面に遷移する |
| M10-13-MSG-004 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | DELETE deleteでForeignKeyConstraintViolationExceptionを捕捉したとき（%name%へ$CsvExtension->getName()を代入） | エラーを表示してカスタムCSV出力項目設定画面に遷移する |
| M10-13-MSG-005 | 確認(モーダル) | 削除確認モーダル内 | このCSV出力設定を削除してもよろしいでしょうか？ | 削除ボタン押下で削除確認モーダル(#DeleteModal)を表示するとき | 削除確認モーダルを表示し、カスタムCSV出力項目設定画面に留まる |

## M10-14 m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）
`functions/ec-cube-enterprise/m10-14_admin_base_setting_setting_shop_mall_shop_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-14-MSG-001 | 警告 | 画面中央(ダイアログ) | please check | .action-submit 押下時に name が ids で始まるチェックボックスが1件も選択されていないとき | 送信せず店舗一覧画面に留まる |
| M10-14-MSG-002 | 警告 | 画面中央(ダイアログ) | Failed | 当該ボタン押下で data-class-load 宛の GET Ajax が失敗(fail)したとき | エラーを表示し、店舗一覧画面に留まる |
| M10-14-MSG-003 | インフォ | 画面中央(モーダル) | 削除中... | #bulkDelete 押下直後、選択行への論理削除Ajax送信を開始したとき | 削除処理を開始し、店舗一覧画面に留まる |
| M10-14-MSG-004 | インフォ | 画面中央(モーダル) | 完了 | 全削除Ajaxが完了したとき(成否を問わず always コールバック) | 削除処理完了後、店舗一覧画面を再読込する |
| M10-14-MSG-005 | エラー | 管理画面上部 | 保存に失敗しました | 要ソース確認 | 要ソース確認 |
| M10-14-MSG-006 | インフォ(成功) | 管理画面上部 | 保存しました | 要ソース確認 | 要ソース確認 |
| M10-14-MSG-007 | インフォ(成功) | 管理画面上部 | 削除しました | 要ソース確認 | 要ソース確認 |

## M10-16 追加システム設定（HareruyaEcプラグイン）
`functions/pf-eccube3/m10-16_admin_base_setting_setting_shop_additional_system.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M10-16-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | 追加システム設定フォームをPOST送信し、送信済みかつ検証成功でオプション値を保存・flushしたとき | 追加システム設定画面に遷移する |
| M10-16-MSG-002 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | POST /{admin_route}/setting/shop/additional_system/update で smaregi_category_id が正規表現 ^\d+$ に一致しない場合 | 保存せず追加システム設定画面に留まる |

## M11-01 メンバー管理一覧（システム情報設定／設定）
`functions/pf-eccube3/m11-01_admin_system_setting_setting_system_member_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M11-01-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | 新規登録POSTでフォームが送信・有効、かつ memberCreateAction->handle が例外なく完了したとき | メンバー管理画面に遷移する |
| M11-01-MSG-002 | エラー | 管理画面上部 | 保存に失敗しました | 新規登録POSTでフォームが送信・有効、かつ memberCreateAction->handle がExceptionを送出したとき | メンバー管理画面に遷移する |
| M11-01-MSG-003 | インフォ(成功) | 管理画面上部 | 保存しました | 編集POSTでフォームが送信・有効、かつ memberEditAction->handle が例外なく完了したとき | メンバー管理画面に遷移する |
| M11-01-MSG-004 | エラー | 管理画面上部 | 保存に失敗しました | 編集POSTでフォームが送信・有効、かつ memberEditAction->handle がExceptionを送出したとき | メンバー管理画面に遷移する |
| M11-01-MSG-005 | エラー | 管理画面上部 | 保存に失敗しました | 編集POSTでフォームが未送信又は無効のとき | メンバー管理画面に遷移する |
| M11-01-MSG-006 | インフォ(成功) | 管理画面上部 | 並び順を更新しました | PUT admin_setting_system_member_upでisTokenValid後、memberRepository->upが例外なく完了したとき | メンバー管理一覧画面に遷移する |
| M11-01-MSG-007 | エラー | 管理画面上部 | 並び順の更新に失敗しました | PUT admin_setting_system_member_upでisTokenValid後、memberRepository->upがExceptionを送出したとき | メンバー管理一覧画面に遷移する |
| M11-01-MSG-008 | インフォ(成功) | 管理画面上部 | 並び順を更新しました | PUT admin_setting_system_member_downでisTokenValid後、memberRepository->downが例外なく完了したとき | メンバー管理一覧画面に遷移する |
| M11-01-MSG-009 | エラー | 管理画面上部 | 並び順の更新に失敗しました | PUT admin_setting_system_member_downでisTokenValid後、memberRepository->downがExceptionを送出したとき | メンバー管理一覧画面に遷移する |
| M11-01-MSG-010 | インフォ(成功) | 管理画面上部 | 削除しました | DELETE admin_setting_system_member_deleteでisTokenValid後、memberRepository->deleteが例外なく完了したとき | メンバー管理一覧画面に遷移する |
| M11-01-MSG-011 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | DELETE時、memberRepository->deleteがForeignKeyConstraintViolationExceptionを送出したとき | メンバー管理一覧画面に遷移する |
| M11-01-MSG-012 | エラー | 管理画面上部 | 削除に失敗しました | DELETE時、memberRepository->deleteがForeignKeyConstraintViolationException以外のExceptionを送出したとき | メンバー管理一覧画面に遷移する |
| M11-01-MSG-013 | エラー(バリデーション) | 入力項目直下 | 英数字をそれぞれ1種類使用してください。 | plain_password.firstがeccube_password_patternに一致しないとき | 新規登録時はメンバー管理画面に留まり、編集時はメンバー管理画面に遷移する |
| M11-01-MSG-014 | エラー(バリデーション) | 入力項目直下 | 要ソース確認 | AuthorityがAuthority::GUEST_IDと等しいとき | 要ソース確認 |
| M11-01-MSG-015 | エラー(バリデーション) | 入力項目直下 | 要ソース確認 | AuthorityがAuthority::CUSTOMER_IDと等しいとき | 要ソース確認 |
| M11-01-MSG-016 | エラー(バリデーション) | 入力項目直下(店舗フィールド) | 店舗が選択されていません。 | AuthorityがTENANT_OPERATOR_ID又はTENANT_OWNER_IDで、baseInfoがnullのとき | 新規登録時はメンバー管理画面に留まり、編集時はメンバー管理画面に遷移する |
| M11-01-MSG-017 | エラー(バリデーション) | 入力項目直下 | 半角英数字で入力してください。 | login_idが正規表現/^[[:graph:][:space:]]+$/iに一致しないとき | 新規登録時はメンバー管理画面に留まり、編集時はメンバー管理画面に遷移する |
| M11-01-MSG-018 | エラー(バリデーション) | 要ソース確認（本エラーは編集時のみ発生し、update()は検証失敗時に必ず編集画面へリダイレクトするためフォームエラーは破棄され、インライン表示の実描画根拠なし。実際に表示されるのはMSG-005のフラッシュのみの可能性） | 非稼働に変更することはできません。 | 編集対象Memberが存在し、WorkがNON_ACTIVE、かつ自分以外の稼働中SYSTEM権限メンバー数が1未満のとき | メンバー管理画面に遷移する |
| M11-01-MSG-019 | エラー(バリデーション) | 入力項目直下(ログインIDフィールド) | このログインIDは利用できません。 | 新規登録時（Member idがnull）にmemberNameCheckViewRepository->isLoginIdExistsがtrueのとき | メンバー管理画面に留まる |

## M11-03 権限管理（システム設定／拒否URL）
`functions/pf-eccube3/m11-03_admin_system_setting_setting_system_authority.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M11-03-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | POST送信フォームが有効で、権限設定保存処理が例外なく完了したとき | 権限管理画面に遷移する |
| M11-03-MSG-002 | エラー | 管理画面上部 | 要ソース確認（variable: $e->getMessage()） | POST送信フォームが有効で、権限設定保存処理中に例外が発生したとき | 要ソース確認 |
| M11-03-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | POST送信フォームが有効で、権限設定保存処理中に例外が発生したとき | 権限管理画面に遷移する |
| M11-03-MSG-004 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.setting.system.authority.authority_not_selected） | POST送信時、権限が未選択かつ拒否URLが空でない | 権限管理画面に留まる |
| M11-03-MSG-005 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.setting.system.authority.deny_url_is_empty） | POST送信時、権限が選択済みかつ拒否URLが空 | 権限管理画面に留まる |

## M11-05 m11-05_admin_system_setting_setting_system_masterdata（管理画面_設定_システム設定_マスタデータ管理）
`functions/ec-cube-enterprise/m11-05_admin_system_setting_setting_system_masterdata.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M11-05-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | 編集フォームが有効で、マスタデータのflushと完了イベントdispatchが例外なく完了したとき | マスタデータ管理画面に遷移する |
| M11-05-MSG-002 | エラー | 管理画面上部 | 保存に失敗しました | 編集フォームが有効で、マスタデータ保存処理のtryブロックで例外が発生したとき | マスタデータ管理画面に遷移する |
| M11-05-MSG-003 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | 編集テーブルをPOSTし、IDが数字のみの正規表現に一致しないとき | マスタデータ管理画面に留まる |
| M11-05-MSG-004 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 入力されていません。 | 編集テーブルPOST時、IDが設定されている行で名称が空のとき | マスタデータ管理画面に留まる |
| M11-05-MSG-005 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 重複したIDを登録することはできません。 | 編集テーブルPOST後、入力済みIDが2行以上で重複するとき | マスタデータ管理画面に留まる |

## M12-02 M12-02（日別/月別集計 CSVダウンロード）
`functions/pf-eccube3/m12-02_admin_analytics_sales_daily_monthly_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M12-02-MSG-001 | エラー | 管理画面上部 | 検索条件がありません。先に検索を実行してください。 | GET /{admin_route}/analysis/summary/export 実行時、セッションの検索条件（VIEW_KEY）が配列でない（＝先に検索が実行されていない） | 日別/月別集計 集計一覧表示画面に遷移する |
| M12-02-MSG-002 | エラー | 管理画面上部 | 日付の形式が不正です。再度検索を実行してください。 | GET /{admin_route}/analysis/summary/export 実行時、セッションの summary_date_from または summary_date_to を 'Y-m-d' として解釈できない | 日別/月別集計 集計一覧表示画面に遷移する |

## M12-04 M12-04（受注/売上分析 CSVダウンロード）
`functions/pf-eccube3/m12-04_admin_analytics_sales_order_analysis_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M12-04-MSG-001 | エラー | 管理画面上部 | 検索条件がありません。先に検索を実行してください。 | GET /{admin_route}/analysis/sales/export 実行時、セッションの検索条件が null（＝先に検索が実行されていない） | エラーを表示し、受注/売上分析 集計一覧表示画面に遷移する |

## M12-06 M12-06（入荷通知依頼 CSVダウンロード）
`functions/pf-eccube3/m12-06_admin_analytics_sales_arrival_notification_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M12-06-MSG-001 | エラー | 管理画面上部 | 検索条件がありません。先に検索を実行してください。 | GET /{admin_route}/analysis/product-request/export 実行時、セッション eccube.admin.analysis.product_request.search の検索条件が null（＝先に検索が実行されていない） | エラーを表示し、入荷通知依頼 一覧表示画面に遷移する |

## M12-08 M12-08（フォーマット売上分析 CSVダウンロード）
`functions/pf-eccube3/m12-08_admin_analytics_sales_format_analysis_csv_export.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M12-08-MSG-001 | エラー | 管理画面上部 | 検索条件がありません。先に検索を実行してください。 | GET /{admin_route}/analysis/format-sales/export 実行時、セッション eccube.admin.analysis.format_sales.search の検索条件が配列でない（＝先に検索が実行されていない） | エラーを表示し、フォーマット売上分析 集計一覧表示画面に遷移する |

## M13-02 M13-02（イベント編集/削除）
`functions/pf-eccube3/m13-02_admin_event_event_edit_delete.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M13-02-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済みかつ妥当で、EventCreateAction::handle が正常終了したとき | イベント編集画面に遷移する |
| M13-02-MSG-002 | エラー | 管理画面上部 | 保存に失敗しました | フォーム送信済みかつ妥当で、EventCreateAction::handle が例外を送出したとき | イベント登録画面に留まる |
| M13-02-MSG-003 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済みかつ妥当で、EventEditAction::handle が正常終了したとき | イベント編集画面に留まる |
| M13-02-MSG-004 | エラー | 管理画面上部 | 保存に失敗しました | フォーム送信済みかつ妥当で、EventEditAction::handle が例外を送出したとき | イベント編集画面に留まる |
| M13-02-MSG-005 | エラー | 管理画面上部 | 不正なリクエストです。 | 削除要求時、ログイン者が当該イベントの店舗を編集不可（isEditableShop=false）のとき | イベント編集画面に遷移する |
| M13-02-MSG-006 | エラー | 管理画面上部 | 要ソース確認 | 削除要求時、イベントの日程件数（getDetails().count()）が1件以上のとき | 要ソース確認 |
| M13-02-MSG-007 | インフォ(成功) | 管理画面上部 | 削除しました | 削除要求時、編集可能かつイベントの日程件数が0件で、remove・flushが実行されたとき | イベント一覧検索画面に遷移する |
| M13-02-MSG-008 | エラー | 管理画面上部 | 不正なリクエストです。 | ログイン管理者が対象イベントの店舗を編集できないとき | イベント編集画面に遷移する |
| M13-02-MSG-009 | エラー | 管理画面上部 | 不正なリクエストです。 | URLのeventDetailIdが指す日程のevent_idと、URLのeventIdが一致しないとき | イベント編集画面に遷移する |
| M13-02-MSG-010 | エラー | 管理画面上部 | 要ソース確認（key_unknown: admin.event.delete.deckerror） | 対象日程にデッキ登録が1件以上あるとき | 要ソース確認 |
| M13-02-MSG-011 | エラー | 管理画面上部 | 要ソース確認（key_unknown: admin.event.delete.entryerror） | 対象日程に申込が1件以上あるとき | 要ソース確認 |
| M13-02-MSG-012 | インフォ(成功) | 管理画面上部 | 削除しました | 編集権限があり、日程が対象イベントに属し、デッキ登録・申込が共に0件のとき | イベント編集画面に遷移する |
| M13-02-MSG-013 | エラー | 管理画面上部 | 不正なリクエストです。 | ログイン管理者が対象イベントの店舗を編集できないとき | イベント編集画面に遷移する |
| M13-02-MSG-014 | エラー | 管理画面上部 | 削除する日程を選択してください | POSTされたevent_detail_idsが空配列のとき | イベント編集画面に遷移する |
| M13-02-MSG-015 | エラー | 管理画面上部 | デッキ登録または申込がある日程が含まれていたため、一括削除できませんでした。 | 選択日程のいずれかにデッキ登録または申込が1件以上あるとき | イベント編集画面に遷移する |
| M13-02-MSG-016 | インフォ(成功) | 管理画面上部 | %count%件の日程を削除しました | 1件以上の日程を削除対象としてremoveし、flushしたとき | イベント編集画面に遷移する |
| M13-02-MSG-017 | エラー(バリデーション) | 入力項目直下 | 要ソース確認（key_unknown: admin.banner.regex_error） | POST送信時、値が admin.hareruyamtg.com に一致する | 要ソース確認 |
| M13-02-MSG-018 | エラー(バリデーション) | 入力項目直下 | 要ソース確認（key_unknown: admin.banner.regex_error） | POST送信時、値が admin.hareruyamtg.com に一致する | 要ソース確認 |
| M13-02-MSG-019 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 参加費が有料かつオンライン受付ありの日程が存在するため、支払方法をオフにできません。 | 送信済みで支払方法が空、かつイベントに参加費>0・オンライン受付開始日時ありの日程が1件以上ある | イベント編集画面に留まる |
| M13-02-MSG-020 | エラー(バリデーション) | 入力項目直下/フォーム上部 | ユーザーの編集可能店舗を選択してください。 | baseInfoがnullでなく、ログイン管理者がその店舗を編集できない | イベント登録・編集画面に留まる |

## M13-03 イベント管理 — 日程追加
`functions/pf-eccube3/m13-03_admin_event_event_schedule_add.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M13-03-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済みかつ有効で、ScheduleStoreAction::handleが正常終了したとき | 日程編集画面に遷移する |
| M13-03-MSG-002 | エラー | 管理画面上部 | 保存に失敗しました | フォーム送信済みかつ有効で、ScheduleStoreAction::handleがExceptionを送出したとき | 日程入力画面に留まる |

## M13-04 イベント管理 — 繰り返し日程登録
`functions/pf-eccube3/m13-04_admin_event_event_repeat_schedule.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M13-04-MSG-001 | エラー | 管理画面上部 | 不正なリクエストです。 | 対象イベントの店舗情報（BaseInfo）がnull、またはログイン中の管理者がその店舗を編集できない（isEditableShop=false）とき。GET表示時・POST送信時のいずれでも判定する。 | 繰り返し日程登録画面に遷移する |
| M13-04-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | フォームが送信済みかつ検証成立で、RepeatScheduleStoreAction::handle による日程の一括作成が例外なく完了したとき | イベント編集画面に遷移する |
| M13-04-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | フォームが送信済みかつ検証成立だが、RepeatScheduleStoreAction::handle が \Exception を送出したとき | 繰り返し日程登録画面に留まる |
| M13-04-MSG-004 | エラー(バリデーション) | 入力項目直下/フォーム上部 | オンライン受付ありかつ参加費が有料の場合は、イベント編集画面で支払方法を設定してください。 | オンライン受付あり、親イベントの参加費が0より大きく、親イベントの支払方法が未設定 | エラーを表示して、繰り返し日程登録画面に留まる |

## M13-06 M13-06（イベント申込検索）
`functions/pf-eccube3/m13-06_admin_event_event_entry_management_search.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M13-06-MSG-001 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 終了日時は、開始日時より大きく設定してください | POST送信時に開催日時FromとToがともに空でなく、FromがToより後の場合 | エラーを表示してイベント申込検索画面に留まる |

## M13-10 M13-10（イベント申込詳細・編集）
`functions/pf-eccube3/m13-10_admin_event_event_entry_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M13-10-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | 既存イベント申込の編集フォーム(EventEntryDetailType)をPOST(admin_event_entry_edit)し、isSubmitted かつ isValid で EntryUpdateAction->handle() が例外なく完了したとき | イベント申込詳細・編集画面に遷移する |
| M13-10-MSG-002 | エラー | 管理画面上部 | 要ソース確認（variable: $e->getMessage()） | 既存イベント申込の編集フォームをPOST(admin_event_entry_edit)し、EntryUpdateAction->handle() が \InvalidArgumentException を送出したとき（例外メッセージをそのままフラッシュに積む） | 要ソース確認 |
| M13-10-MSG-003 | エラー | 管理画面上部 | 保存に失敗しました | 既存イベント申込の編集フォームをPOST(admin_event_entry_edit)し、EntryUpdateAction->handle() が \InvalidArgumentException 以外の \Exception を送出したとき | イベント申込詳細・編集画面に留まる |

## M13-12 M13-12（イベント新規申込登録）
`functions/pf-eccube3/m13-12_admin_event_event_entry_register.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M13-12-MSG-001 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 終了日時は、開始日時より大きく設定してください | 開始日時From・Toの両方が入力され、開始日時Fromが開始日時Toより後の状態で検索フォームを送信したとき | エラーを表示し、イベント新規申込登録画面に留まる |
| M13-12-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済みかつ有効で、イベント申込登録処理が正常終了したとき | イベント申込検索画面に遷移する |

## M13-13 M13-13（イベント申込一括CSV登録）
`functions/pf-eccube3/m13-13_admin_event_event_entry_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M13-13-MSG-001 | インフォ(成功) | 管理画面上部 | CSVファイルをアップロードしました | CSV取込フォーム(CsvImportType)をPOST(admin_event_entry_bulk_csv_import)し、行数上限・Member判定を通過して CsvImporter->import() を実行後、例外由来・取込結果由来の errors がいずれも空だったとき | CSV取込完了後、イベント申込一括CSV登録画面に遷移する |

## M13-14 イベント管理 — バナー設定
`functions/pf-eccube3/m13-14_admin_event_event_banner.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M13-14-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | イベントバナー設定フォーム(event_banner)をPOST(admin_event_banner_settings / admin_event_banner_settings_narrow)し、isSubmitted かつ isValid で EventBannerStoreAction->handle() が完了したとき | イベント管理 — バナー設定画面に遷移する |
| M13-14-MSG-002 | エラー(バリデーション) | 入力項目直下 | 「admin.hareruyamtg.com」は指定できません。 | POST送信時、画像URLが admin.hareruyamtg.com を含み Regex 制約に違反した場合 | 保存せずイベント管理 — バナー設定画面に留まる |

## M13-15 M13-15（画像設定）
`functions/pf-eccube3/m13-15_admin_event_event_image_setting.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M13-15-MSG-001 | 確認 | 画面中央(ダイアログ) | この画像を削除します。よろしいですか？ | 全店舗表示（htmlClass が null）で、画像キー3階層目の店舗HTMLクラスが空でなく bannerDeletableHtmlClasses（ログイン管理者が編集可能な店舗）に含まれる行の「削除」を押下したとき | 確認後に画像を削除し、イベントバナー管理（全店舗）画面に遷移する。キャンセル時は送信せず現在の画面に留まる |
| M13-15-MSG-002 | 確認 | 画面中央(ダイアログ) | この画像を削除します。よろしいですか？ | 店舗絞り込み表示（htmlClass 指定）で selectedBaseInfo が存在し、ログイン管理者がその店舗を編集可能（app.user.isEditableShop）なときに「削除」を押下したとき | 確認後に画像を削除し、イベントバナー管理（店舗絞り込み）画面に遷移する。キャンセル時は送信せず現在の画面に留まる |
| M13-15-MSG-003 | インフォ(成功) | 管理画面上部 | アップロードしました | 画像アップロードフォームをPOST(admin_event_banner_image_upload / admin_event_banner_image_upload_narrow)し、isSubmitted かつ isValid で EventBannerStorageService->processUpload() が null（エラーなし）を返したとき | 画像をアップロードし、イベントバナー管理画面（アップロード先の店舗で絞り込み）に遷移する |
| M13-15-MSG-004 | エラー | 管理画面上部 | 編集権限のない店舗の画像は削除できません。 | 店舗絞り込み(htmlClass指定)状態で画像削除をDELETE送信し、CSRF検証後に htmlClass から特定した BaseInfo に対しログイン中の Member が isEditableShop() を満たさないとき | 画像を削除せず、イベントバナー管理画面（当該店舗で絞り込み）に遷移する |
| M13-15-MSG-005 | エラー | 管理画面上部 | 編集権限のない店舗の画像は削除できません。 | 画像削除のDELETE送信で、削除対象オブジェクトキーの正規化・店舗配下チェックを通過した後、EventBannerStorageService->canMemberDeleteObject() が false（そのオブジェクトの属する店舗にログインMemberの編集権限が無い）を返したとき | 画像を削除せず、イベントバナー管理画面（現在の表示条件）に遷移する |
| M13-15-MSG-006 | インフォ(成功) | 管理画面上部 | 削除しました | 画像削除のDELETE送信で、CSRF検証・店舗編集権限・オブジェクトキー検証をすべて通過し EventBannerStorageService->deleteObjectIfExists() を実行したとき | 画像を削除し、イベントバナー管理画面（現在の表示条件）に遷移する |

## M14-01 カード管理 — カード検索（一覧・条件抽出）
`functions/pf-eccube3/m14-01_admin_card_card_search.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M14-01-MSG-011 | 警告 | 画面中央(ダイアログ) | 1つ以上のカードを選択してください。 | チェックボックス（cardIds）が1件も選択されていないとき | 送信せずカード検索（一覧・条件抽出）画面に留まる |
| M14-01-MSG-012 | 確認 | 画面中央(ダイアログ) | 選択されたカードを削除してもよろしいですか？ | カード選択済みで一括削除ボタンを押したとき（data-confirm がある場合のみ表示） | OKでカード検索（一覧・条件抽出）画面に遷移し、キャンセルで同画面に留まる |
| M14-01-MSG-013 | 確認 | 画面中央(ダイアログ) | カード名リスト作成バッチを実行しますか？ | ボタン押下時（disabled でない場合） | OK・キャンセルともにカード検索（一覧・条件抽出）画面に留まる |
| M14-01-MSG-014 | 警告 | 画面中央(ダイアログ) | エラーが発生しました | Ajax通信が失敗（.fail）したとき | カード検索（一覧・条件抽出）画面に留まる |
| M14-01-MSG-015 | 警告 | 画面中央(ダイアログ) | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークン（create_card_name_list）が不正のとき | カード検索（一覧・条件抽出）画面に留まる |
| M14-01-MSG-016 | 警告 | 画面中央(ダイアログ) | 保存しました | カード名リスト生成が正常終了（$result[0]===0）したとき | カード検索（一覧・条件抽出）画面に留まる |
| M14-01-MSG-017 | 警告 | 画面中央(ダイアログ) | 要ソース確認 | カード名リスト生成が異常終了（$result[0]!==0）したとき | 要ソース確認 |
| M14-01-MSG-018 | 警告 | 画面中央(ダイアログ) | 要ソース確認 | カード名リスト生成中にExceptionが発生したとき | 要ソース確認 |
| M14-01-MSG-019 | 確認 | 画面中央(モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除モーダルを開いたとき（data-message を modal-message へ挿入。%name%=対象カードの getNameJpWithEn()） | 削除でカード検索（一覧・条件抽出）画面に遷移し、キャンセルで同画面に留まる |
| M14-01-MSG-020 | エラー | 該当フォーム項目直下 | 数字で入力してください。 | 入力値が正規表現 /^\d+(\.\d+)?$/（正の整数・小数）に一致しないとき | カード検索（一覧・条件抽出）画面に留まる |
| M14-01-MSG-021 | 警告 | 画面中央(ダイアログ) | 1つ以上のカードを選択してください。 | チェックボックス（name^="cardIds"）が1件も選択されていない状態で一括操作ボタンを押したとき | 送信せずカード検索（一覧・条件抽出）画面に留まる |
| M14-01-MSG-022 | 確認 | 画面中央(ダイアログ) | カード名リスト作成バッチを実行しますか？ | ボタンが disabled でない状態で押下したとき | OK・キャンセルともにカード検索（一覧・条件抽出）画面に留まる |
| M14-01-MSG-023 | 警告 | 画面中央(ダイアログ) | エラーが発生しました | admin_card_generate_list への Ajax POST が失敗（.fail）したとき | カード検索（一覧・条件抽出）画面に留まる |
| M14-01-MSG-024 | 確認 | 画面中央(ダイアログ) | 選択されたカードを削除してもよろしいですか？ | カードを1件以上選択して「一括削除」を押したとき（data-confirm がある場合のみ表示） | OKでカード検索（一覧・条件抽出）画面に遷移し、キャンセルで同画面に留まる |
| M14-01-MSG-025 | 確認 | 画面中央(モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 対象行の削除アイコン押下で DeleteModal を開いたとき（data-message を p.modal-message へ挿入。%name%=対象カードの getNameJpWithEn()） | 削除でカード検索（一覧・条件抽出）画面に遷移し、キャンセルで同画面に留まる |
| M14-01-MSG-026 | エラー(バリデーション) | 入力項目直下 | 数字で入力してください。 | POST送信時にCMCが正規表現 /^\d+(\.\d+)?$/ に一致せずフォームが無効のとき | カード検索（一覧・条件抽出）画面に留まる |

## M14-03 カード管理 — 一括削除
`functions/pf-eccube3/m14-03_admin_card_card_bulk_delete.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M14-03-MSG-001 | エラー | 管理画面上部 | 削除に失敗しました | 送信された cardIds が空のとき | カード管理画面に遷移する |
| M14-03-MSG-002 | エラー | 管理画面上部 | 削除に失敗しました | 選択カードの削除処理でExceptionが発生したとき | カード管理画面に遷移する |
| M14-03-MSG-003 | インフォ(成功) | 管理画面上部 | 削除しました | 一括削除で1件以上の削除に成功し deleteCount>0 のとき | カード管理画面に遷移する |
| M14-03-MSG-004 | エラー | 管理画面上部 | デッキまたは商品にカードが登録されているため、%card_name% カード情報を削除することができません。 | 選択カードが isDeletable=false、または削除中に ForeignKeyConstraintViolationException が発生したとき（%card_name%=スキップしたカード名） | カード管理画面に遷移する |

## M14-04 カード管理 — 新規登録・編集・削除（詳細フォーム）
`functions/pf-eccube3/m14-04_admin_card_card_register_update_delete.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M14-04-MSG-001 | 確認 | 画面中央(モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 既存カードの編集画面（card.getId() が null でない）で「削除」リンクを押し #DeleteModal を開いたとき（data-message を p.modal-message へ挿入。%name%=対象カードの getNameJpWithEn()） | 削除確認後に削除処理を実行する。キャンセル時はカード編集画面に留まる |
| M14-04-MSG-002 | エラー | 管理画面上部 | デッキまたは商品にカードが登録されているため、%card_name% カード情報を削除することができません。 | 対象カードが isDeletable=false のとき（%card_name%=対象カードの getNameJpWithEn()） | カード編集画面、またはカード検索・一覧画面に遷移する |
| M14-04-MSG-003 | エラー | 管理画面上部 | 削除に失敗しました | 単体カード削除の remove/flush でExceptionが発生したとき | カード編集画面、またはカード検索・一覧画面に遷移する |
| M14-04-MSG-004 | インフォ(成功) | 管理画面上部 | 削除しました | 単体カードの remove/flush が成功したとき | カード検索・一覧画面に遷移する |
| M14-04-MSG-005 | エラー | 管理画面上部 | 削除に失敗しました | フォーム送信済み・有効で、削除不可のカード詳細IDが送信された詳細IDから欠落したとき | カード編集画面に留まる |
| M14-04-MSG-006 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済み・有効で、persist/flush/commitが成功したとき | カード編集画面に遷移する |
| M14-04-MSG-007 | エラー | 管理画面上部 | 保存に失敗しました | 保存トランザクション中にExceptionが発生したとき | カード編集画面に留まる |

## M14-05 カード管理 — カード CSV 登録（取込）
`functions/pf-eccube3/m14-05_admin_card_card_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M14-05-MSG-001 | エラー | 管理画面上部 | 要ソース確認（variable: $error->getMessage()） | CsvImportTypeフォームの送信が不正で、checkFormValid()がfalseとなったとき | 要ソース確認 |

## M14-06 カード管理 — カードセット一覧
`functions/pf-eccube3/m14-06_admin_card_cardset_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M14-06-MSG-008 | 確認 | ブラウザ標準ダイアログ(window.confirm) | プロモカード一覧をダウンロードしますか? | カードセットのチェックボックスを1件も選択せずに画像ダウンロードボタンを押したとき | OKでプロモカード一覧のZIPファイルをダウンロードし、キャンセルでカードセット一覧画面に留まる |

## M14-07 カードセット管理 — 収録カード画像 ZIP ダウンロード（セット別／言語別）
`functions/pf-eccube3/m14-07_admin_card_cardset_image_download.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M14-07-MSG-001 | エラー | 管理画面上部 | 要ソース確認 | POST先admin_cardset_downloadのZIP生成処理(download)で例外が発生したとき | 要ソース確認 |
| M14-07-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | POST先admin_cardset_download_each_langのZIP生成処理(downloadEachLang)で例外が発生したとき | 要ソース確認 |

## M14-08 カード管理 — カードセット新規登録・編集・削除
`functions/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M14-08-MSG-001 | エラー(バリデーション) | 入力項目直下 | 半角英数字・記号（ASCII文字）のみ入力できます。 | 新規登録または編集の送信時、略称がRegex /^[\x01-\x7E]+$/ に一致しないとき | カードセット新規登録・編集・削除画面に留まる |
| M14-08-MSG-002 | インフォ(成功) | 管理画面上部 | 削除しました | DELETE要求のCSRFトークンが有効でカードセット削除・flushが正常終了したとき | カードセット一覧画面に遷移する |
| M14-08-MSG-003 | エラー | 管理画面上部 | 既にカードセットにカードが登録されているため、%name% のカードセット情報は削除することができません。 | 削除時に外部キー制約違反(子カードが存在)が発生したとき | カードセット一覧画面に遷移する |
| M14-08-MSG-004 | エラー | 管理画面上部 | 削除に失敗しました | 削除時に外部キー制約違反以外の例外が発生したとき | カードセット一覧画面に遷移する |
| M14-08-MSG-005 | インフォ(成功) | 管理画面上部 | 保存しました | 新規登録フォームを送信しフォームが有効で保存処理が正常終了したとき | カードセット新規登録・編集・削除画面に遷移する |
| M14-08-MSG-006 | インフォ(成功) | 管理画面上部 | 保存しました | 編集フォームを送信しフォームが有効で保存処理が正常終了したとき | カードセット新規登録・編集・削除画面に遷移する |
| M14-08-MSG-007 | エラー | 該当フォーム項目直下 | 半角文字のみ入力できます。 | 「登録」押下時のフォームバリデーションで略称に半角(ASCII)以外の文字が含まれるとき | カードセット新規登録・編集・削除画面に留まる |

## M14-09 カード管理 — フォーマット一覧
`functions/pf-eccube3/m14-09_admin_card_format_list.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M14-09-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | 新規登録フォームが送信済みかつ有効なとき | フォーマット編集画面に遷移する |
| M14-09-MSG-002 | インフォ(成功) | 管理画面上部 | 保存しました | 編集フォームが送信済みかつ有効なとき | フォーマット編集画面に遷移する |
| M14-09-MSG-003 | エラー | 管理画面上部 | 既にイベントが登録されているので、削除出来ません。 | CSRFトークンが有効で、削除対象フォーマットのEventsが空でないとき | フォーマット一覧画面に遷移する |
| M14-09-MSG-004 | エラー | 管理画面上部 | 既にデッキが登録されているので、削除出来ません。 | CSRFトークンが有効で、削除対象フォーマットのDecksが空でないとき | フォーマット一覧画面に遷移する |
| M14-09-MSG-005 | エラー | 管理画面上部 | 既にアーキタイプが登録されているので、削除出来ません。 | CSRFトークンが有効で、削除対象フォーマットのArchetypesが空でないとき | フォーマット一覧画面に遷移する |
| M14-09-MSG-006 | インフォ(成功) | 管理画面上部 | 削除しました | CSRFトークンが有効で、関連Events・Decks・Archetypesがなく、remove/flushが例外なく完了したとき | フォーマット一覧画面に遷移する |
| M14-09-MSG-007 | エラー | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | CSRFトークンが有効で、削除処理のtryブロック内でExceptionが発生したとき | フォーマット一覧画面に遷移する |

## M14-10 カード管理 — フォーマット新規登録・編集・削除
`functions/pf-eccube3/m14-10_admin_card_card_format_register_edit_delete.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M14-10-MSG-001 | エラー(バリデーション) | 入力項目直下 | 半角英数字、アンダースコア、ハイフン、スペースのみ入力できます。 | POST送信時、nameEnが /^[a-zA-Z0-9_\- ]+$/ に一致しない | フォーマット新規登録・編集画面に留まる |
| M14-10-MSG-002 | エラー(バリデーション) | 入力項目直下 | 半角英数字、アンダースコア、ハイフン、スペースのみ入力できます。 | POST送信時、codeが /^[a-zA-Z0-9_\- ]+$/ に一致しない | フォーマット新規登録・編集画面に留まる |

## M15-01 デッキ管理 — デッキ検索・一覧
`functions/pf-eccube3/m15-01_admin_deck_deck_search.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M15-01-MSG-001 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークンが不正 | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-002 | エラー | 管理画面上部 | 記事に紐付いているデッキがあるため削除できません。 | 選択デッキに記事が紐付く | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-003 | エラー | 管理画面上部 | 削除に失敗しました | 一括削除処理でRuntimeException以外のException | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-004 | インフォ(成功) | 管理画面上部 | 削除しました | 一括削除成功 | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-005 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークンが不正 | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-006 | エラー | 管理画面上部 | 要ソース確認 | DeckBulkUpdateTypeフォームが不正 | 要ソース確認 |
| M15-01-MSG-007 | エラー | 管理画面上部 | 保存に失敗しました | 一括編集処理でException | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-008 | インフォ(成功) | 管理画面上部 | 保存しました | 一括編集成功 | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-009 | エラー | 管理画面上部 | %board% の %row% 行目に、異常な値が入力されています | メイン・サイド・統率のカードリストに不正行 | デッキ編集画面に留まる |
| M15-01-MSG-010 | 警告 | 管理画面上部 | 要ソース確認 | 保存後のデッキ検証で警告あり | 要ソース確認 |
| M15-01-MSG-011 | インフォ(成功) | 管理画面上部 | 保存しました | カードリストエラーなしで保存完了 | デッキ編集画面に遷移する |
| M15-01-MSG-012 | エラー | 管理画面上部 | 保存に失敗しました | 保存処理でException | デッキ編集画面に留まる |
| M15-01-MSG-021 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークンが不正 | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-022 | エラー | 管理画面上部 | CSV出力対象のデッキが選択されていません。 | deckIdが空、または0以下のみ | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-023 | エラー | 管理画面上部 | CSV出力対象のデッキが選択されていません。 | 選択deckIdに対応するデッキが0件 | デッキ検索・一覧画面に遷移する |
| M15-01-MSG-024 | 要ソース確認 | 画面中央（確認ダイアログ） | 選択されたデッキを削除しますか？ | 一覧の選択デッキ＋「一括削除」ボタン押下時（送信前のブラウザ `confirm`。OKで送信、キャンセルで中断） | 要ソース確認 |
| M15-01-MSG-025 | 要ソース確認 | 画面中央（確認ダイアログ） | このデッキを削除しますか？ | 一覧の個別デッキ行ドロップダウンの「削除」押下時（送信前のブラウザ `confirm`。OKで送信、キャンセルで中断） | 要ソース確認 |

## M15-05 デッキ管理 — 新規登録・編集・削除・複製
`functions/pf-eccube3/m15-05_admin_deck_deck_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M15-05-MSG-001 | 警告 | 画面中央(ダイアログ) | アーキタイプを選択してください。 | クリック時に#admin_deck_Archetypeが未選択（値が空）のとき | デッキ編集画面に留まる |
| M15-05-MSG-002 | 警告 | 画面中央(ダイアログ) | 選択されたアーキタイプにデッキタグが設定されていません。 | admin_deck_archetype_tags へのGET応答 data.length が 0 のとき | デッキ編集画面に留まる |
| M15-05-MSG-003 | 確認 | 画面中央(ダイアログ) | このデッキを削除しますか？ | クリック時（送信前のブラウザconfirm） | OKで削除処理を実行し、キャンセルでデッキ編集画面に留まる |
| M15-05-MSG-004 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークンが不正 | デッキ検索・一覧画面に遷移する |
| M15-05-MSG-005 | エラー | 管理画面上部 | 記事に紐付いているデッキがあるため削除できません。 | 対象デッキに記事が紐付く | デッキ編集画面に遷移する |
| M15-05-MSG-006 | エラー | 管理画面上部 | 削除に失敗しました | 削除処理でRuntimeException以外のException | デッキ編集画面に遷移する |
| M15-05-MSG-007 | インフォ(成功) | 管理画面上部 | 削除しました | 個別削除成功 | デッキ検索・一覧画面に遷移する |
| M15-05-MSG-008 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | CSRFトークンが不正 | デッキ編集画面に遷移する |
| M15-05-MSG-009 | エラー | 管理画面上部 | 保存に失敗しました | 複製フォーム未送信または不正 | デッキ編集画面に遷移する |
| M15-05-MSG-010 | エラー | 管理画面上部 | 保存に失敗しました | 複製処理でException | デッキ編集画面に遷移する |
| M15-05-MSG-011 | インフォ(成功) | 管理画面上部 | 保存しました | 複製保存成功 | デッキ編集画面に遷移する |

## M15-06 デッキ管理 — デッキ登録 CSV（取込）
`functions/pf-eccube3/m15-06_admin_deck_deck_csv_import.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M15-06-MSG-001 | インフォ(成功) | 管理画面上部 | CSVファイルをアップロードしました | デッキ登録CSV取込(POST admin_deck_csv_import)でCsvImporter->import()が完了し$result->hasError()が偽のとき | デッキ登録 CSV（取込）画面に遷移する |

## M15-09 デッキ管理 — アーキタイプ登録・編集・削除
`functions/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M15-09-MSG-001 | エラー | 管理画面上部 | セッションがタイムアウトしました。もう一度やり直してください。 | 削除POSTのCSRFトークンが不正なとき | アーキタイプ一覧画面に遷移する |
| M15-09-MSG-002 | エラー | 管理画面上部 | このアーキタイプに紐づくデッキが存在するため削除できません。 | 紐づくデッキが1件以上存在し削除処理がRuntimeExceptionとなるとき | アーキタイプ編集画面に遷移する |
| M15-09-MSG-003 | エラー | 管理画面上部 | 削除に失敗しました | 削除処理でRuntimeException以外のExceptionが発生したとき | アーキタイプ編集画面に遷移する |
| M15-09-MSG-004 | インフォ(成功) | 管理画面上部 | 削除しました | 削除処理が正常終了したとき | アーキタイプ一覧画面に遷移する |
| M15-09-MSG-005 | インフォ(成功) | 管理画面上部 | 保存しました | 送信済みかつフォームが有効で保存処理が正常終了したとき | アーキタイプ編集画面に遷移する |
| M15-09-MSG-006 | エラー | 管理画面上部 | 指定された代表カード画像が見つかりません。 | 送信済みかつフォームが有効で、指定された代表カード画像IDが存在しないとき | アーキタイプ登録・編集画面に留まる |
| M15-09-MSG-007 | エラー | 管理画面上部 | 保存に失敗しました | 送信済みかつフォームが有効で保存処理がRuntimeException以外のExceptionとなるとき | アーキタイプ登録・編集画面に留まる |
| M15-09-MSG-008 | 確認 | 画面中央(ダイアログ) | このアーキタイプを削除してもよろしいですか？ | ボタン押下時（送信前のブラウザconfirm） | OKで削除を実行し、キャンセルで現在の画面に留まる |

## M15-11 デッキ管理 — 直近の大会管理（編集）
`functions/pf-eccube3/m15-11_admin_deck_deck_latest_event.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M15-11-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | フォーム送信済みかつ有効で、更新処理が正常終了したとき | 直近の大会管理（編集）画面に遷移する |
| M15-11-MSG-002 | エラー | 管理画面上部 | 保存に失敗しました | フォーム送信済みかつ有効で、更新処理が例外を送出したとき（catch） | 直近の大会管理（編集）画面に留まる |

## M16-01 データ管理 — トップバナー管理（バナー設定）
`functions/pf-eccube3/m16-01_admin_data_top_banner.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M16-01-MSG-001 | インフォ(成功) | 管理画面上部 | アップロードしました | アップロードフォームが送信・妥当でhandleUploadが正常終了したとき | トップバナー管理画面に遷移する |
| M16-01-MSG-002 | エラー | 入力項目直下 | 選択した店舗ではアップロードできません。 | アップロードフォームが送信・妥当で、handleUpload内のTopBannerUploadActionがadmin.で始まる例外を送出したとき（編集権限のない店舗を選択時） | トップバナー管理画面に留まる |
| M16-01-MSG-003 | エラー | 入力項目直下 | アップロードに失敗しました | アップロードフォームが送信・妥当で、handleUploadがadmin.で始まらないRuntimeExceptionを送出したとき | トップバナー管理画面に留まる |
| M16-01-MSG-004 | インフォ(成功) | 管理画面上部 | 保存しました | 設定フォームが送信・妥当で、storeTopBannersの戻り値がnullのとき | トップバナー管理画面に遷移する |
| M16-01-MSG-005 | インフォ(成功) | 管理画面上部 | 削除しました | DELETE要求がCSRF検証を通過し、TopBannerDeleteAction::handleが正常終了したとき | トップバナー管理画面に遷移する |
| M16-01-MSG-006 | エラー | 管理画面上部 | 要ソース確認 | 削除リンクからDELETE要求が送信され、CSRF検証通過後にTopBannerDeleteActionがadmin.で始まるRuntimeExceptionを送出したとき | 要ソース確認 |
| M16-01-MSG-007 | エラー | 管理画面上部 | 削除に失敗しました | DELETE要求で捕捉したRuntimeExceptionのmessageがadmin.で始まらないとき | トップバナー管理画面に遷移する |
| M16-01-MSG-008 | エラー | 入力項目直下 | 要ソース確認 | base_infoが空で送信されたとき（NotBlank制約違反。EntityType required・placeholder無のため通常UIでは発生しにくい） | トップバナー管理画面に留まる |
| M16-01-MSG-009 | エラー | 入力項目直下 | 画像ファイルを選択してください。 | fileが未選択のまま送信されたとき（NotBlank制約違反。JS事前チェックを通らない直接POST等） | トップバナー管理画面に留まる |
| M16-01-MSG-010 | エラー | ファイル項目直下（#top-banner-upload-error） | 画像ファイルを選択してください。 | file入力が空のままアップロードフォームをsubmitしたとき（クライアントJSがsubmitを抑止） | 送信せずトップバナー管理画面に留まる |
| M16-01-MSG-011 | エラー | 入力項目直下 | ファイルがGIF・JPG・PNGではありません。 | GIF/JPG/PNG以外のMIMEタイプのファイルを選択して送信したとき（File制約違反） | トップバナー管理画面に留まる |
| M16-01-MSG-012 | エラー | 入力項目直下 | ファイルサイズは{{ limit }}以下にしてください。 | ファイルサイズが520000バイト超で送信したとき（Callback制約違反・{{ limit }}=520KB。messages.ja.yaml:6140は別文言だがconstraintはvalidatorsドメイン解決） | トップバナー管理画面に留まる |
| M16-01-MSG-013 | エラー | 入力項目直下 | 「admin.hareruyamtg.com」は指定できません。 | 画像URLに admin.hareruyamtg.com を含む値を入力して送信したとき（Regex match:false制約違反） | トップバナー管理画面に留まる |
| M16-01-MSG-014 | エラー | 入力項目直下 | 並び順が空の項目があります。 | 並び順が空の項目があるまま送信したとき（POST_SUBMITリスナーが該当sort_no項目へFormError追加→フォーム無効） | トップバナー管理画面に留まる |
| M16-01-MSG-015 | エラー | 入力項目直下 | 並び順が重複しています。 | 並び順の値が重複したまま送信したとき（POST_SUBMITリスナーが重複した全sort_no項目へFormError追加→フォーム無効） | トップバナー管理画面に留まる |
| M16-01-MSG-016 | 確認 | 確認ダイアログ | 一度削除したデータは元に戻せません。削除してもよろしいですか？ | 削除リンククリック時（data-confirm未指定のため常に確認ダイアログを表示） | 削除確認ダイアログを表示する |
| M16-01-MSG-017 | エラー | バナー設定フォーム上部 | 要ソース確認 | 設定フォームが送信・妥当だがstoreTopBanners内でRuntimeExceptionが送出されたとき（bannerError.messageを\|transして表示。TopBannerStoreAction/TopBannerEntityManager経路にRuntimeException送出箇所は未特定） | 要ソース確認 |
| M16-01-MSG-018 | 確認 | 確認ダイアログ | 一度削除したデータは元に戻せません。削除してもよろしいですか？ | 削除リンクをクリックしたとき（data-confirm 未指定のため共通JSが常に確認ダイアログを表示し、data-message の文言を用いる） | 削除確認ダイアログを表示する |
| M16-01-MSG-019 | エラー(バリデーション) | 入力項目直下 | 「admin.hareruyamtg.com」は指定できません。 | POST送信時、画像URLに admin.hareruyamtg.com を含む | トップバナー管理画面に留まる |
| M16-01-MSG-020 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 並び順が空の項目があります。 | POST_SUBMIT時、いずれかのsort_no_{id}がnullまたは空文字 | トップバナー管理画面に留まる |
| M16-01-MSG-021 | エラー(バリデーション) | 入力項目直下/フォーム上部 | 並び順が重複しています。 | POST_SUBMIT時、同一の整数化された並び順値を持つ項目が複数ある | トップバナー管理画面に留まる |
| M16-01-MSG-022 | エラー(バリデーション) | 入力項目直下 | 店舗が選択されていません。 | アップロードフォーム送信時、base_infoが空でNotBlank制約違反 | トップバナー管理画面に留まる |
| M16-01-MSG-023 | エラー(バリデーション) | 入力項目直下 | 画像ファイルを選択してください。 | ファイル未選択でアップロードフォームを送信した場合（直接POST等。通常画面ではJSも送信を中断する） | トップバナー管理画面に留まる |

## M16-03 データ管理 — 祝日の追加・削除
`functions/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M16-03-MSG-001 | 確認 | 画面中央(ダイアログ/モーダル) | この祝日を削除してもよろしいですか？ | 削除リンクを押下したとき（data-confirm が未指定のため共通JSが data-message の文言で確認ダイアログを表示する） | OK時はデータ管理 — 祝日の追加・削除画面に遷移し、キャンセル時はデータ管理 — 祝日の追加・削除画面に留まる |
| M16-03-MSG-002 | エラー | 管理画面上部 | 祝日の期間指定には、左側に開始日、右側に終了日を入力してください。 | 期間指定フォーム（HolidayLoadType）をPOST送信し、開始日>終了日で Callback 制約 admin.data.holiday.range_invalid の違反が発生したとき。 | データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-003 | エラー | 管理画面上部 | 登録できませんでした。 | 一括読込フォームが検証エラーとなり、かつ range_invalid 以外のエラーだったとき（開始日/終了日の未入力 admin.data.holiday.range_required など）。 | データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-004 | 警告 | 管理画面上部 | %date%は、既に祝日が登録されているのでスキップします。 | 一括読込の結果 result['skippedDates'] に既登録の日付が含まれるとき。該当日付1件につき1メッセージを積む。 | 警告を表示し、残りの祝日登録を続行した後、データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-005 | インフォ(成功) | 管理画面上部 | %count%件の祝日が登録されました。 | 一括読込の結果 result['addedCount'] が 0 より大きいとき（1件以上の祝日が新規登録された）。 | データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-006 | エラー | 管理画面上部 | 指定された期間に、登録可能な祝日がありませんでした。 | 一括読込は成功したが result['addedCount'] が 0 のとき（指定期間の祝日がすべて既登録またはそもそも該当なし）。 | データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-007 | エラー | 管理画面上部 | 入力した日付が、登録済みの祝日と重複しています。 | 新規追加フォーム（HolidayAddType）をPOST送信し、入力日付が MtbHolidayRepository::existsByDate で既登録と判定され Callback 制約 admin.data.holiday.overlap の違反が発生したとき。 | データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-008 | エラー | 管理画面上部 | 登録できませんでした。 | 新規追加フォームが検証エラーとなり、かつ overlap 以外のエラーだったとき（名称未入力 admin.data.holiday.name_required、64文字超 admin.data.holiday.name_max、日付未入力 admin.data.holiday.date_required など）。 | データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-009 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | 新規追加フォームの検証を通過し HolidayAddAction::handle で mtb_holiday への1件登録が完了したとき。 | データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-010 | インフォ(成功) | 管理画面上部 | 削除しました | 削除リンクの確認ダイアログを承認して DELETE /{admin_route}/data/holiday/{id}/delete を送信し、isTokenValid() を通過して HolidayDeleteAction::handle が例外なく完了したとき。 | データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-011 | エラー | 管理画面上部 | 削除に失敗しました | 削除送信後、HolidayDeleteAction::handle が \Exception を投げて catch されたとき。 | データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-012 | エラー(バリデーション) | 入力項目直下 | 期間を入力してください。 | POSTで一括読込フォームを送信し、開始日が未入力のとき | エラーを表示し、データ管理 — 祝日の追加・削除画面に遷移する |
| M16-03-MSG-013 | エラー(バリデーション) | 入力項目直下 | 期間を入力してください。 | POSTで一括読込フォームを送信し、終了日が未入力のとき | エラーを表示し、データ管理 — 祝日の追加・削除画面に遷移する |

## M16-04 データ管理 — MTGマスターデータ編集
`functions/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M16-04-MSG-001 | インフォ(成功) | 管理画面上部 | 保存しました | POSTでeditFormが送信済みかつ有効で、postedEntityKeyの設定が存在し storeAction->handle が正常終了したとき | 保存後、MTGマスターデータ編集画面に遷移する |
| M16-04-MSG-002 | エラー | 管理画面上部 | 要ソース確認 | POSTでeditFormが送信済みかつ有効で、storeAction->handle 中に \RuntimeException を捕捉したとき（catch節） | 要ソース確認 |

## M16-07 データ管理 — 買取価格対応表（編集）
`functions/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.md`

| メッセージID | 種別 | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|---|
| M16-07-MSG-001 | インフォ(成功) | 管理画面上部 | 登録が完了しました。 | POSTフォームが送信済みかつ有効で、買取価格更新処理の後に addSuccess を実行したとき | 買取価格対応表（一覧）画面に遷移する |

