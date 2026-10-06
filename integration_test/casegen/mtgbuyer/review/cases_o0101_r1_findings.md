### 指摘1（O01-01 全般）
- 主張: 各ケースの受注シードだけで、お客様選択画面の対象受注を取得できる。
- 実際: A06-02は職業または国が紐づかない受注を一覧から除外するが、各 `S-O01-01-ORD-*` はお客様名等だけで職業・国を値付きで指定していない。前提条件P5も必要な状態の値付き記載を要求している（`functions/pf-api/a06-02_other_mtg_buyer_otc_buy_order_list.md:7`、`integration_test/casegen/mtgbuyer/cases/O01-01_mb_seed_data.tsv:7`、`integration_test/casegen/precond/README.md:27`）。
- 判定: 成立しない前提・手順
- 修正案: 一覧に表示させる全受注シードへ、存在する職業と国との紐付けを具体値で追加する。このままでは大半のケースで対象行が表示される保証がない。

### 指摘2（O01-01 本人確認）
- 主張: 「本人確認の種別未登録の場合は先頭の種別」が選択される。
- 実際: A06-02は未登録を `identificationId=0` で返すが、アプリはnullかどうかだけを判定し、0なら `SelectedIndex=-1` にする。そのまま「査定開始」を押すと `SelectedIndex + 1`、すなわち0を送るため、設計書記載の先頭ID 1にはならない（`functions/pf-api/a06-02_other_mtg_buyer_otc_buy_order_list.md:33`、`front-application/MTGBuyer/Screen/IDScan/IdentificationScan.xaml.cs:48`、同`:127`、`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:62`）。
- 判定: 設計書の誤り
- 修正案: 現行ソースの実態を「0では未選択かつ0を送る」と記載するか、アプリ側を0の場合も先頭選択に修正する。後者を仕様とするなら、現時点ではアプリ不具合として扱うべきである。

### 指摘3（IT-O01-01-018、016・023〜077・079〜086）
- 主張: 未登録のまま「査定開始」を実行すると、ケース018では `identification=1` が送られ、後続ケースでは査定画面へ進める。
- 実際: 前記のとおり現行アプリは0を送る。A06-13は本人確認ID未指定をHTTP 400として更新しないため、ケース018の期待値は誤りで、種別を明示選択しない成功経路のケース016・023〜077・079〜086も査定画面へ到達できない（`front-application/MTGBuyer/Screen/IDScan/IdentificationScan.xaml.cs:48`、同`:127`、`functions/pf-api/a06-13_other_mtg_buyer_otc_identification_update.md:52`）。
- 判定: 期待結果の誤り
- 修正案: 現行アプリを対象にするなら、各ケースで身分証明書種別を明示的に選択する。未登録時にID 1を送る仕様を検証するなら、アプリ修正後までケースを実行可能扱いにしない。

### 指摘4（O01-01 `qualified_invoice_issuer_confirmation_flg`）
- 主張: 登録番号確認欄を「一度も操作していない場合」は項目を送らない。
- 実際: アプリは操作済みフラグを保持しておらず、受注から復元したnullable値をクリック時に上書きし、その値がnullでない限りJSONへ出力する。したがって以前の確認値がfalseまたはtrueなら、今回画面で未操作でも送る（`front-application/MTGBuyer/Entity/OtcBuyOrder.cs:28`、`front-application/MTGBuyer/Screen/Document/DocumentConfirmation.xaml.cs:372`、`front-application/MTGBuyer/Util/HttpContentUtil.cs:126`、同`:130`、`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:143`）。
- 判定: 設計書の誤り
- 修正案: 設計書を「受注から取得した値がnullの場合に省略」に直すか、アプリに当該画面での操作有無を別途保持させる。

### 指摘5（IT-O01-01-051）
- 主張: 「適格請求書発行事業者でない」という前提から、`qualified_invoice_issuer_confirmation_flg` が省略される。
- 実際: シードは発行事業者フラグしか指定せず、確認フラグがnullかfalseかを定めていない。アプリは確認フラグがfalseなら項目をfalseで送り、nullの場合だけ省略するため、期待値が一意に決まらない（`integration_test/casegen/mtgbuyer/cases/O01-01_mb_seed_data.tsv:94`、`front-application/MTGBuyer/Util/HttpContentUtil.cs:126`、同`:130`）。
- 判定: 成立しない前提・手順
- 修正案: シードで登録番号確認フラグを明示的にnullとする。falseを用意するなら、期待結果も「falseを送る」に変える必要がある。

### 指摘6（IT-O01-01-062、063）
- 主張: ステータスを指定せず査定IDだけで管理画面検索し、「買取キャンセル」を確認できる。
- 実際: M06-01の既存ケースでは、ステータス未選択の検索結果から買取キャンセルが除外され、表示するには「買取キャンセル」を明示選択する必要がある（`integration_test/casegen/cases/M06-01_test_cases.tsv:17`、同`:18`）。
- 判定: 確認方法の誤り
- 修正案: 管理画面の検索条件でステータス「買取キャンセル」を選択してから、対象査定IDを検索する。

### 指摘7（IT-O01-01-003）
- 主張: 申込日時が厳密に `2026-10-01 10:00:00` と表示される。
- 実際: 設計書が定めるのは申込日時の表示だけで、書式は規定していない。実装も `DateTime` を `StringFormat` なしでバインドしており、表示は実行環境のカルチャに依存する（`front-application/MTGBuyer/Entity/BuyOrder.cs:25`、同`:35`、`front-application/MTGBuyer/Screen/CustomerList/CustomerList.xaml:168`、`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:41`）。
- 判定: 設計書に無い期待
- 修正案: 日時値が同じであることを環境の表示形式に合わせて確認する。ハイフン形式を必須にするなら、先に設計書とXAMLへ書式を追加する。

### 指摘8（O01-01 R014）
- 主張: report.mdは「数字しか入力できず、整数でない値を作れない」ため、端末取引IDの非整数ケースを書けないとしている。
- 実際: 入力制限は `PreviewTextInput` だけであり、貼り付けを処理するハンドラはない。また確定処理には `int.TryParse` 失敗時の独立したメッセージ分岐が実装されている（`integration_test/casegen/mtgbuyer/gen_O01-01/report.md:43`、`front-application/MTGBuyer/Screen/Document/DocumentConfirmation.xaml:114`、`front-application/MTGBuyer/Util/ValidateUtil.cs:9`、`front-application/MTGBuyer/Screen/Document/DocumentConfirmation.xaml.cs:221`）。
- 判定: 取りこぼし
- 修正案: クリップボード貼り付け等で非整数値を設定し、エラーメッセージ、確定確認が出ないこと、更新APIが送られないことを検証する。

### 指摘9（O01-01 明細集約）
- 主張: report.mdは、集約対象行で基準価格・部門が異なる状態を作る操作がないため、先行行採用のケースを書けないとしている。
- 実際: 個別入力は基準価格と部門を行ごとに受け取り、追加のたびに新しい査定行を作る。最終JSONでは商品規格ID・商品名・買取価格だけで同一行を探し、先に作った行の基準価格・部門を保持する（`integration_test/casegen/mtgbuyer/gen_O01-01/report.md:51`、`front-application/MTGBuyer/Modal/ManualInputModal.xaml.cs:217`、同`:221`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:1173`、同`:1251`、`front-application/MTGBuyer/Util/HttpContentUtil.cs:80`、同`:93`）。
- 判定: 取りこぼし
- 修正案: 同じ商品名・買取価格の個別入力行を、異なる基準価格または部門で2行追加し、枚数合計と先行行の値が送られるケースを追加する。

### 指摘10（O01-01 `sell_price`）
- 主張: `sell_price` がない行では項目ごと送らないという分岐にケースがない。
- 実際: 設計書はこの省略条件を独立して規定している。現行ソースも査定途中CSVの基準価格が空ならnullのまま復元し、null値をJSONから省略する（`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:154`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:823`、`front-application/MTGBuyer/Util/HttpContentUtil.cs:115`、同`:130`）。
- 判定: 取りこぼし
- 修正案: 基準価格が空の査定途中データを復元して確定し、当該明細に `sell_price` が存在しないことを中継で確認する。

### 指摘11（O01-01 `section_id`）
- 主張: `section_id` がない行では項目ごと送らないという分岐にケースがない。
- 実際: 設計書はこの省略条件も独立して規定している。現行ソースは査定途中CSVの部門IDが空ならnullのまま復元し、null値をJSONから省略する（`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:155`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:823`、`front-application/MTGBuyer/Util/HttpContentUtil.cs:116`、同`:130`）。
- 判定: 取りこぼし
- 修正案: 部門IDが空の査定途中データを復元して確定し、当該明細に `section_id` が存在しないことを確認する。

### 指摘12（O01-01 登録番号確認=false）
- 主張: `qualified_invoice_issuer_confirmation_flg` はtrue送信と未送信だけを検証している。
- 実際: 設計書は「欄の状態」を送るとしており、アプリはチェックを外した操作でもnullable値をfalseへ更新してJSONへ出力する。買取キャンセルは登録番号確認条件を検査しないため、false送信経路を実行できる（`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:121`、同`:143`、`front-application/MTGBuyer/Screen/Document/DocumentConfirmation.xaml.cs:372`、`front-application/MTGBuyer/Util/HttpContentUtil.cs:126`）。
- 判定: 取りこぼし
- 修正案: 適格請求書発行事業者でチェックを一度オン、次にオフにして買取キャンセルし、項目がfalseで送られるケースを追加する。

### 指摘13（O01-01 確定後の一覧）
- 主張: report.mdは、買取成立後にアプリ一覧から受注が消えるかは「期待値が決まらない」としている。
- 実際: A06-03既存ケースにより買取成立は入庫待ち13、経理払い出し待ちは10、キャンセルは2になる。一方、A06-02の取得対象は5・6・8・9だけなので、いずれも確定後の再取得一覧には含まれない（`integration_test/casegen/mtgbuyer/gen_O01-01/report.md:51`、`integration_test/casegen/cases/A06-03_test_cases.tsv:4`、同`:6`、同`:8`、`integration_test/casegen/cases/A06-02_test_cases.tsv:7`）。
- 判定: 取りこぼし
- 修正案: 買取成立・経理払い出し待ち・買取キャンセルの成功後、遷移先のアプリ一覧から対象査定番号が消えることを確認する。

### 指摘14（IT-O01-01-066、069）
- 主張: 保管先ファイルが残るケース066と、API失敗時に端末ファイルが残るケース069へ、いずれも判定ID `IT-0074` を付けている。
- 実際: `IT-0074` の判定単位は「削除対象として指定したファイルが削除されること」であり、「消さない」「失敗時に残す」は反対の判定である（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:75`、`integration_test/casegen/mtgbuyer/cases/O01-01_mb_test_cases.tsv:67`、同`:70`）。
- 判定: 判定IDの誤り
- 修正案: ケース066は非対象ファイルを変えない判定、ケース069は障害時の縮退・保持に対応する判定IDへ変更する。`IT-0074` は成功後に端末ファイルを削除するケースだけに使う。

### 指摘15（IT-O01-01-005、027）
- 主張: アプリ画面で空一覧または「カードが見つからない」を確認するケースに `IT-0216` を付けている。
- 実際: `IT-0216` の判定単位は、0件時にHTTPステータスとレスポンス形式が正常系で返ることである。両ケースは中継の応答を確認せず、画面上の後続動作だけを確認している（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:217`、`integration_test/casegen/mtgbuyer/cases/O01-01_mb_test_cases.tsv:6`、同`:28`）。
- 判定: 判定IDの誤り
- 修正案: `IT-0216` を使うなら中継で正常HTTPステータスとレスポンス形式まで確認する。画面の0件処理だけなら、それに合う正常受信・後続処理の判定IDへ変更する。

### 指摘16（O01-01 認証ヘッダ）
- 主張: 「すべての呼び出しで `jwt-token` を付ける」という連携条件を満たすケース群になっている。
- 実際: ヘッダを明示確認するのは一覧取得、部門・固定価格、検索、買取価格、ダブルチェック、買取情報更新に限られ、状態更新・本人確認更新・フリーコメント更新では確認していない。設計書は一部ではなく「すべての呼び出し」としている（`functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:19`、`integration_test/casegen/mtgbuyer/cases/O01-01_mb_test_cases.tsv:2`、同`:19`、同`:32`）。
- 判定: 取りこぼし
- 修正案: 状態更新、本人確認更新、フリーコメント更新の各正常送信ケースでも、ログイン応答の認証トークンと同じ `jwt-token` が付くことを確認する。

### 指摘17（IT-O01-01-060〜063）
- 主張: 例えばケース060は、確認文言、成功文言、画面遷移、管理画面の状態、端末取引IDを一つの期待結果で判定している。
- 実際: 作成規約は「1ケース1期待結果」を明記している。ケース060〜063は相互に独立して失敗し得る画面応答、遷移、ECCUBE更新結果を一件へまとめており、どの判定が失敗したかを一意に切り分けられない（`integration_test/casegen/mtgbuyer/GEN_O0101_PROMPT.md:51`、`integration_test/casegen/mtgbuyer/cases/O01-01_mb_test_cases.tsv:61`、同`:64`）。
- 判定: 重複
- 修正案: アプリの成功応答・遷移、管理画面のステータス、端末取引IDを別ケースへ分割する。確認文言は対応する分岐判定の補助にだけ含める。
