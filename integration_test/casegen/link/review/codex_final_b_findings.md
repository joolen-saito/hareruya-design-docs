### 指摘1（重大度: Major）対象: IT-M10-13-L001・L002
主張: カスタムCSV出力フォーマット名のリンクを「選択肢」としてIT-0335・IT-0336で確認できる。
実際: 期待結果はリンクの表示／非表示である（`integration_test/casegen/link/cases/M10-13_link_test_cases.tsv:2-3`）。IT-0335・IT-0336の対象はセレクトボックス、チェックボックス、ラジオボタンの候補だけで、リンクや一覧表示は除外される（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:45,51`）。
判定: 型の欠陥
修正案: L001・L002を削除する。フォーマット名リンクの反映を扱うなら、一覧・導線用の別観点へ付け替える。

### 指摘2（重大度: Major）対象: IT-M10-06-L003・L004
主張: 別ウィンドウに開く納品書を下流の「画面」としてIT-0337を適用できる。
実際: 日本語納品書は「出力: 納品書」、英語納品書は「1つの印刷文書」と定義されている（`functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:51-55`、`functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md:38-42`）。下流は画面に限るという範囲規定（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:49`）に対し、帳票をブラウザウィンドウで開くことだけを理由に画面扱いしている。
判定: 型の欠陥
修正案: L003・L004を本成果物から削除し、帳票出力の連携観点へ移す。

### 指摘3（重大度: Major）対象: IT-M10-09-L001・L002
主張: メールテンプレートの件名はIT-0337の設定値であり、件名欄やメール配信履歴への反映を挙動切替として扱える。
実際: M10-09はテンプレートの件名・本文を保存する文面編集である（`functions/pf-eccube3/m10-09_admin_base_setting_setting_shop_mail.md:19-31,43-55`）。M05-15への件名反映自体は明記されている（`functions/ec-cube-enterprise/m05-15_admin_order_order_mail.md:15-23`）。L002の履歴表示も、テンプレートの現件名と送信時件名を別欄へ表示すると明記されている（`functions/pf-eccube3/m08-07_admin_customer_customer_mail_history.md:25-29`）。しかし前者は挙動の切替ではなく入力欄への文面反映、後者は明示的に除外された一覧表示である（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:46,51`）。同種のM10-08を0件とした判断が正しい（`integration_test/casegen/link/gen_M10-08/report.md:6,16,22`）。
判定: 型の欠陥
修正案: L001・L002を削除する。接続自体は設計根拠があるため、文面・履歴表示を扱う別観点へ移す。

### 指摘4（重大度: Major）対象: IT-M10-01-L001〜L003
主張: M10-01として送料無料条件から買い物かごへの3ケースが必要である。
実際: L001はIT-M10-05-L001、L002はIT-M10-05-L004、L003はIT-M10-05-L003と、いずれも同じ店舗基本設定画面で送料無料条件を変更し、同じ買い物かご画面で同じ表示を確認している（`integration_test/casegen/link/cases/M10-01_link_test_cases.tsv:2-4`、`integration_test/casegen/link/cases/M10-05_link_test_cases.tsv:2,4-5`）。
判定: 重複
修正案: 送料無料条件はM10-05側を正として、M10-01-L001〜L003を削除する。M10-01-L004・L005の自動ログインだけを残す。

### 指摘5（重大度: Major）対象: IT-M10-04-L002・L004
主張: 支払方法の追加、名称変更、並び替えをIT-0335で別ケースにする必要がある。
実際: L001は新規支払方法の選択肢反映と先頭への表示を既に確認している（`integration_test/casegen/link/cases/M10-04_link_test_cases.tsv:2`）。L002とL004も同じ支払方法マスタの更新後に、同じ購入グループ管理の選択肢を確認するケースである（同`:3,5`）。登録と更新は同一判定単位で、新規か更新かだけでは分けない規約である（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:64`）。
判定: 重複
修正案: IT-0335はL001に集約してL002・L004を削除する。削除反映のL003は別判定IT-0336として残す。

### 指摘6（重大度: Minor）対象: IT-M03-16-L001
主張: CSVによる新規追加だけをL001として独立させる必要がある。
実際: L002は1ファイル内で新規追加と既存名称変更の両方を実施し、商品編集の選択肢で新規名・変更後名・変更前名をまとめて確認している（`integration_test/casegen/link/cases/M03-16_link_test_cases.tsv:3`）。L001の新規追加確認（同`:2`）は完全に包含される。M03-14との間は上流操作が画面登録とCSV取込で異なるため横断重複ではないが、M03-16内では重複している。
判定: 重複
修正案: L001を削除し、L002をM03-16のIT-0335代表ケースにする。

### 指摘7（重大度: Major）対象: IT-M03-16-L003
主張: CSV取込が途中で中止された場合に選択肢へ残らないこともIT-0335である。
実際: このケースではマスタの登録・更新が成功しておらず、確認対象はCSV取込の全体ロールバックである（`integration_test/casegen/link/cases/M03-16_link_test_cases.tsv:4`）。同じ並び順の重複で両行とも追加されないことはIT-M03-16-022、後続エラー時に先行更新・追加も取り消されることはIT-M03-16-030で既に判定されている（`integration_test/casegen/all_test_cases.tsv:3481,3489`）。
判定: 型の欠陥
修正案: L003を削除する。ロールバック確認は既存ケースに任せる。

### 指摘8（重大度: Major）対象: IT-M14-09-L001
主張: フォーマットを削除すると商品詳細検索の選択肢から除外される。
実際: 上流には削除済みを「通常の参照から除外する」とある（`functions/pf-eccube3/m14-09_admin_card_format_list.md:17-19`）一方、下流F03-03にはフォーマットを表示順で提示することしかなく、削除済み除外の記述がない（`functions/pf-eccube3/f03-03_front_product_product_detail_search.md:9-13`）。著者自身も不足を認めている（`integration_test/casegen/link/gen_M14-09/report.md:42-44`）。同じ接続はM14-10レビューで不採用とされている（`integration_test/casegen/link/gen_M14-10/report.md:38-40`）。
判定: 推測による接続
修正案: L001を削除する。F03-03側に削除済み除外が明記された場合のみ再作成する。

### 指摘9（重大度: Major）対象: IT-M16-07-L001
主張: 買取価格対応表の編集値は、買取・基準価格一括編集が参照する「買取価格マスタ」と同じデータである。
実際: 上流は一貫して「買取価格対応表」と呼ぶ（`functions/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.md:7,17,33,40`）が、下流は「買取価格マスタ」と呼ぶ（`functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md:18,23-29`）。同一データと明記した文はなく、報告書も参照キーの一致から推測したと認めている（`integration_test/casegen/link/gen_M16-07/report.md:41-43`）。これは個別商品データではなく参照用対応表・マスタに近いが、その分類では同一性不足を補えない。
判定: 推測による接続
修正案: L001を削除する。設計書に両名称の対応または同一テーブル参照を明記してから再作成する。

### 指摘10（重大度: Major）対象: IT-M16-01-L001・L002
主張: トップバナーの表示タイプ・言語はIT-0337の設定値である。
実際: M16-01は画像URL、リンク、表示タイプ、言語、代替テキストをバナー行へ保存し、公開トップのスライドへ反映する機能である（`functions/pf-eccube3/m16-01_admin_data_top_banner.md:11-15,32-34`）。これは公開コンテンツの反映を担うIT-0150の定義そのものである（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:151`）。IT-M16-01-018・022・023は別項目なので厳密な重複ではなく、IT-M16-01-019・020もシード直置きのため重複規約上は重複しない（`integration_test/casegen/all_test_cases.tsv:8174-8176,8178-8179`）。問題は判定IDの付与である。
判定: 型の欠陥
修正案: L001・L002をIT-0337から外し、必要ならIT-0150配下の上流操作付きケースとして扱う。

### 指摘11（重大度: Major）対象: IT-M10-16-L001
主張: 自動遷移秒数を20へ変更すると、完了画面の案内と遷移時間が20秒になる。
実際: 下流の刷新仕様は「画面表示後、15秒経過したら遷移する」と固定している（`integration_test/casegen/materials/F08-03_requirements.tsv:6`、`excel_to_html/output/0308_基本設計仕様書(フロント_店頭買取).html:1342`）。別箇所には「設定秒数」とあるが（`integration_test/casegen/materials/F08-03_requirements.tsv:54,67-68`）、設定元をM10-16と名指ししていない。報告書は上流初期値15と下流固定値15の一致から同じ設定と推測している（`integration_test/casegen/link/gen_M10-16/report.md:17,55-56`）。刷新の固定15秒に対して20秒を期待する根拠はない。
判定: 推測による接続
修正案: L001を削除する。下流にM10-16の設定値を参照する旨が明記され、固定15秒との矛盾が解消された場合のみ復活させる。

### 指摘12（重大度: Major）対象: IT-M10-05-L005
主張: 送料無料金額・数量の両方に未到達なら、金額不足と数量未到達の案内が併記される。
実際: 下流設計が定義する未到達時の案内は「送料無料金額と合計の差額」だけである（`functions/pf-eccube3/f04-01_front_cart_cart_index.md:18-20,85`）。数量の未到達案内は定義されていない。一方、ケースは「数量の未到達の案内も金額と併記」と要求している（`integration_test/casegen/link/cases/M10-05_link_test_cases.tsv:6`）。
判定: 期待結果の捏造
修正案: 期待結果を「差額6,000円の不足額が表示され、『現在送料無料です。』が表示されないこと」までに縮める。

### 指摘13（重大度: Minor）対象: IT-M14-08-L001〜L004
主張: 日本語画面のカードセット選択肢にはカードセット名日本語が表示される。
実際: 下流は登録されたカードセットを選択肢にすることだけを定める（`excel_to_html/output/0302_基本設計仕様書(フロント_ナビゲーション).html:1194`、`excel_to_html/output/0204_基本設計仕様書(商品管理).html:1548,1584`）。日本語名・英語名のどちらをラベルに使うかは規定されず、報告書も認めている（`integration_test/casegen/link/gen_M14-08/report.md:45-47`）。
判定: 期待結果の捏造
修正案: 日英名を同じ固有トークンにして、そのトークンの候補追加・除外だけを確認する。日英を分けるなら先に表示ラベル仕様を追記する。

### 指摘14（重大度: Minor）対象: IT-M15-10-L001
主張: 日本語アーキタイプ名に英語フォーマット名を添えた候補が表示される。
実際: 下流は「アーキタイプ名にそのフォーマット名を添えて示す」としか規定しておらず、日英の選択と添える書式は未定義である（`functions/pf-eccube3/m15-01_admin_deck_deck_search.md:25-27`）。報告書も未定義と認める（`integration_test/casegen/link/gen_M15-10/report.md:43-44`）が、ケースは日本語名「取込連携001」と英語フォーマット名「FmtM1510L001」を固定している（`integration_test/casegen/link/cases/M15-10_link_test_cases.tsv:2`）。
判定: 期待結果の捏造
修正案: アーキタイプとフォーマットの日英名をそれぞれ同じ固有トークンにし、両トークンが候補に含まれることだけを確認する。

### 指摘15（重大度: Major）対象: IT-M03-20-L001
主張: CSV取込した部門は、買取集計画面の選択肢に部門名で表示される。
実際: 下流設計は部門マスタから全部門を取得することまでは示すが、選択肢ラベルが部門名・部門コード・IDのどれかを規定していない。報告書もこの不足を認めている（`integration_test/casegen/link/gen_M03-20/report.md:43-45`）。それにもかかわらず、ケースは新旧の部門名の表示・非表示を期待している（`integration_test/casegen/link/cases/M03-20_link_test_cases.tsv:2`）。
判定: 期待結果の捏造
修正案: 下流の選択肢ラベル仕様を設計書へ追加してからケース化する。現状ではL001を保留ではなく削除する。

### 指摘16（重大度: Major）対象: M16-03
主張: 祝日はマスタであって設定値ではなく、IT-0337に該当しないため0件である。
実際: 祝日追加・削除は同日開始イベントの祝日フラグを直接オン／オフする（`functions/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.md:18-20,34-42,60-66`）。さらにイベント大会TOPは、日曜・祝日を赤色にし、祝日管理の登録日を参照すると明記する（`excel_to_html/output/0307_基本設計仕様書(フロント_イベント大会).html:1134-1135`）。機能設計書MDにないことを理由にHTML設計を無視した0件判断（`integration_test/casegen/link/gen_M16-03/report.md:10-12,18-23`）は誤りである。
判定: 0件の誤り
修正案: 非日曜でイベントが表示される日を用意し、M16-03で同日を祝日に追加後、F07-01の日付表示が赤へ切り替わることを確認するIT-0337ケースを追加する。

### 指摘17（重大度: Major）対象: M10-11
主張: 更新のみで登録・削除がないためIT-0335は適用できず、0件である。
実際: IT-0335はマスタの登録だけでなく更新も対象である（`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:45,64`）。M10-11は受注対応状況そのものの「名称（受注管理）」を更新する（`functions/ec-cube-enterprise/m10-11_admin_base_setting_setting_shop_order_status.md:7-17`）。M05-14は同じ受注ステータスの遷移先をプルダウン候補とし、対応状況の表示名を使う（`functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md:3,7-13`）。
判定: 0件の誤り
修正案: 到達可能な遷移先ステータスの名称（受注管理）を固有名へ変更し、該当状態の受注詳細で対応状況プルダウンに変更後名称が出るIT-0335ケースを追加する。

### 指摘18（重大度: Major）対象: 依頼文・上流台帳（M03-13）
主張: マスタ・設定→利用側の上流候補は台帳で概ね網羅されている。
実際: M03-13はタグを新規登録・更新するマスタ管理機能である（`functions/pf-eccube3/m03-13_admin_product_product_tag.md:5-25,29`）。商品編集は「タグを選択」を押すと登録済みタグを一覧表示すると明記する（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:1601`）。既存M03-13ケースは単機能確認で、登録後に商品編集の候補を確認するケースはない（`integration_test/casegen/all_test_cases.tsv:3379-3417`）。
判定: 取りこぼし
修正案: M03-13で日英名を同じ固有トークンにしたタグを登録し、M03-02の商品編集でそのタグが候補に追加されることを確認するIT-0335ケースを追加する。

### 指摘19（重大度: Major）対象: 依頼文・上流台帳（M03-22）
主張: 購入グループ管理は下流候補としてのみ扱えばよい。
実際: M03-22自身が購入グループを追加・更新・論理削除する（`functions/pf-eccube3/m03-22_admin_product_product_sell_group.md:17-25,39-45`）。商品編集は「購入グループ一覧を選択肢にセットする」と明記する（`excel_to_html/output/0204_基本設計仕様書(商品管理).html:1588`）。既存IT-M03-02-011はシード直置きであり、重複ではない（`integration_test/casegen/all_test_cases.tsv:3130`、`integration_test/casegen/link/GEN_LINK_PROMPT_TEMPLATE.md:63`）。
判定: 取りこぼし
修正案: M03-22で固有名の購入グループを新規登録し、M03-02の商品編集の購入グループ選択肢に現れることを確認するIT-0335ケースを追加する。

### 指摘20（重大度: Major）対象: 依頼文・上流台帳（M11-05）
主張: 部署・所属などの汎用マスタを編集する上流機能は追加対象に含まれている。
実際: M11-05は選択したマスタへ行を追加・更新・削除する汎用マスタ管理機能である（`functions/ec-cube-enterprise/m11-05_admin_system_setting_setting_system_masterdata.md:5-23,46-52`）。新規会員登録の職業は「システム設定＞マスターデータ管理にて設定している値」を候補にすると明記する（`excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1232`）。M11-05は上流台帳にない。
判定: 取りこぼし
修正案: M11-05で職業マスタに固有値を追加し、新規会員登録の職業セレクトボックスに現れることを確認するIT-0335ケースを追加する。

### 指摘21（重大度: Major）対象: 依頼文・上流台帳（M16-04）
主張: M15-07をデッキタグの上流候補にすれば足り、M16-04は不要である。
実際: 刷新後のM15-07はMTGマスターデータ管理へのリンクにすぎない（`excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1827-1832`）。実際にデッキタグを含む24種のマスタを追加・更新・削除するのはM16-04である（`functions/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.md:5-7,38,40-50,69-75`）。M15-08にはデッキタグの複数選択部品がある（`excel_to_html/output/0212_基本設計仕様書(デッキ管理).html:1926`）。
判定: 取りこぼし
修正案: M16-04を上流台帳に加える。日英名を同じ固有トークンにしたデッキタグを追加し、M15-08のデッキタグ候補に現れることを確認するIT-0335ケースを追加する。

### 指摘22（重大度: Major）対象: gen_M03-17/report.md・gen_M03-20/report.md
主張: 報告書の採用ケース数と対応表が現在の成果物を表している。
実際: M03-17報告は6件（`integration_test/casegen/link/gen_M03-17/report.md:3,9-16`）、M03-20報告は3件（`integration_test/casegen/link/gen_M03-20/report.md:3,8-10`）を採用扱いしているが、現行ケースはそれぞれ2件と1件である（`integration_test/casegen/link/cases/M03-17_link_test_cases.tsv:2-3`、`integration_test/casegen/link/cases/M03-20_link_test_cases.tsv:2`）。裁定ではM03-17の4件、M03-20の2件を範囲外へ移したと明記されている（`integration_test/casegen/link/review/batch23_r1_dispositions.md:9-12`）。
判定: 型の欠陥
修正案: 両report.mdを現行ケースに合わせて書き直し、範囲外へ移したケースを採用表・対応表・件数から除く。
