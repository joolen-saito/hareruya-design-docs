# ネット買取管理 — 買取情報編集（買取詳細）

## 概要

管理画面「ネット買取管理」から到達する、1件のネット買取注文（`dtb_buy_order`）について、買取番号・買取状況・査定・明細（選んで買取／まとめて買取／個別入力）・実在庫・買取依頼者・口座・適格請求書まわりを閲覧・編集し、保存する機能である。画面メッセージでは「買取情報編集」とも呼ばれる。サブタイトルはTwig上「買取詳細」、`messages.ja.yaml`の確認値では「買取情報編集」がある。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値はリポジトリ内のネット買取管理コントローラ、買取詳細フォーム定義、買取詳細保存サービス、買取詳細Twigテンプレート、同画面のフロント脚本、設定 `eccube.yaml` を正とする。

本機能のカスタマイズ区分はカスタマイズである。現行挙動は現行リポ（pf-eccube3のHareruyaEcプラグイン）を出自とし、リニューアル後はec-cube-enterpriseのコア実装へ移載される。挙動の確認値はec-cube-enterpriseのコア実装とし、DB関連の記述（テーブル名・列名・保存先・整合・副作用のDB更新）はec-cube-enterpriseを正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド単位の解剖は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| ネット買取一覧の編集リンク・行リンク | `GET /{admin_route}/purchase/{id}/edit` | 買取詳細が表示される。基本情報・買取情報・実在庫・依頼者情報・変換エリアが描画される。 |
| 「保存」（フッタ） | `POST /{admin_route}/purchase/{id}/update` | 検証に成功すれば永続化され、成功フラッシュのあと同一URLへリダイレクトする。失敗すれば同一テンプレートを200で返しエラーを積む。 |
| 「査定編集」⇔「査定確定」 | （同一GETページ上の操作） | 商品系入力の編集可否が切り替わる。送信しない限りDBは変わらない。 |
| 「編集」⇔「確定」（買取依頼者情報） | （同一GETページ上の操作） | 会員系入力のreadonly／疑似readonlyが切り替わる。 |
| 「まとめて買取」アコーディオンを初めて開く | `GET /{admin_route}/purchase/{id}/bulkpurchaseload` | テーブル行がクライアント側で挿入される。 |
| 「商品追加」（選んで買取） | `POST /{admin_route}/purchase/searchproduct`（モーダル内） | サプライ対象商品を明細行としてDOM追加できる（送信は親フォームの保存時まで保留）。 |
| 「一括売却登録」 | `POST /{admin_route}/purchase/bulk/detail/{id}/sell` | 確認ダイアログ後、売却フラグ一括更新へ進む（メイン更新処理とは別ルート）。 |
| 「ネット買取一覧」戻り | `GET /{admin_route}/purchase/page/{page_no}` | セッションに保存されたページ番号で一覧へ戻る。 |
| 存在しない `id` | `GET` または `POST …/purchase/{id}/…` | 404。 |
| 実在庫の「商品追加／実在庫情報登録」モーダルから商品検索HTMLを返す。 | `POST /{admin_route}/search/product` | 実在庫の「商品追加／実在庫情報登録」モーダルから商品検索HTMLを返す。 |
| 詳細ヘッダのCSVボタンなどから送信（当画面では hidden で当該買取IDを渡す）。一覧側仕様と共用。 | `POST /{admin_route}/purchase/csv_export` | 詳細ヘッダのCSVボタンなどから送信（当画面では hidden で当該買取IDを渡す）。一覧側仕様と共用。 |
| 同上（クエリ `type=sale`）。 | `POST /{admin_route}/purchase/csv_export_product_list` | 同上（クエリ `type=sale`）。 |
| 個別入力商品の実在庫紐付け（別トークン `purchase_register_individual_sto… | `POST /{admin_route}/purchase/{buyOrderId}/register-individual-stock/{individualProductId}` | 個別入力商品の実在庫紐付け（別トークン `purchase_register_individual_stock`）。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | メニューは `purchase_menu` と `purchase_list`。ページブロックは「基本情報」（買取番号・本人確認表示・振込状況チェック・適格請求書表示・買取状況・各種日付・棚戻し済みラジオ）、「ステータス変更履歴」（折りたたみ表）、「買取情報」（査定金額・承諾金額・送料・箱数警告・管理者メモ・選んで買取表・まとめて買取・個別入力）、「実在庫情報」（閲覧表／編集表の切替）、「買取依頼者情報」（氏名〜身分証・口座・適格請求書編集）、フッタ（一覧戻り・手動メール・一括売却・保存）。 |
| JS挙動 | 初期は `.customer` と `.product` を事実上ロックし、ロード後に待機クラスを外す。査定編集・依頼者編集でreadonly／`pointer-events`を切替。まとめて買取は折りたたみ初回開いたときだけXHRで行生成。選んで買取・実在庫はそれぞれモーダルで検索し、行追加や個別POST用の動的フォームを組み立てる。査定価格・売却変更で行小計と総合計を再計算。実在庫「編集解除」は確認のうえ増減入力と追加行を捨てる。Enterによる誤送信抑止（`.allow_submit` 以外）。一括売却は確認後に `formaction` を差し替えて送信。 |
| CSS・レイアウト | readonly入力のグレー背景、ラジオ横並び、氏名・生年月日の横並び、CSVボタン幅などをインラインスタイルとクラスで調整。 |
| モーダル・ポップアップ | 選んで買取用「商品検索」、実在庫・個別入力用の共通「商品検索」モーダル。Bootstrap依存。 |

---

## 処理フロー

### 買取詳細を表示する（GET `admin_purchase_edit`）

1. 管理画面の認証（管理者ファイアウォール）を通過する。
2. `id` に対応する買取注文が無ければ404とする。
3. 選んで買取のコレクションをリポジトリから選取区分のみで再構築し、キャンセル行が先頭に来る並びで注文に載せる。
4. 個別入力商品はキャンセル優先の並びで載せ替える。
5. 実在庫はリポジトリの一覧用クエリ結果で並べ替えて載せる。
6. フォームは買取注文実体に対し買取詳細フォームを生成する（適格確認フラグのnull解釈・保存前ステータスID・実在庫子フォームをオプション渡し）。実在庫は関連商品規格一覧から編集用コレクションを組み立てる専用フォーム、口座は口座エンティティ用フォーム、適格請求書は登録番号アカウント用フォームとする。適格請求書フォームはGETでもリクエスト束ねが走る。
7. Twigへ買取注文・プレイヤー・まとめめ買取の合計価格・ステータス履歴・ステータス名マップ・各フォームビューを渡す。

### メインフォームを保存する（POST `admin_purchase_update`）

1. PHPの実行時間制限を解除する（実装コメントは移植元踏襲）。
2. 買取注文が無ければ404とする。
3. フォーム束ねの直前に、POST内の注文明細をリポジトリから選取／bulk区分に分けてコレクションへ載せ替える（画面並びと一致させる目的）。
4. 実在庫関連の商品規格一覧を改めて取得し、実在庫フォームを組み立てる。
5. 実在庫フォームを先に `handleRequest` し、続けてメインフォーム、口座フォーム、適格請求書フォームを取り込む。
6. いずれかが妥当でなければ、全フォームのビューを組み立て直し、メインフォーム配下のエラーを管理者向けエラーとして積み、200で詳細テンプレートを返す。
7. すべて妥当なら、適格請求書フォームの事業者フラグ・実在庫行コレクション・ログイン管理者を入力にして業務処理サービスを実行する。
8. 成功フラッシュ鍵は `admin.register.complete`（日本語環境の文言はコア一般的な「登録が完了しました。」系）。
9. `GET /{admin_route}/purchase/{id}/edit` へリダイレクトする。
10. 分岐上、送信状態と妥当性の組み合わせで再リダイレクトのみ行う経路もあるが、通常保存は上記7〜9を通る。

---

## 保存処理内部の判定順序と副作用（要点）

| 順序 | 判定・処理 | 結果 |
|------|------------|------|
| 1 | トランザクション開始 | 失敗時はロールバックし例外を再送出する。 |
| 2 | 保存後ステータスが入庫済みへ変わる場合 | 先にDB側で入庫待ち→入庫済みへの単発更新を試み、成功したら後続で入庫バッチ処理を行うフラグを立てる。 |
| 3 | 選んで買取・まとめめ買取・個別入力 | 選取は既存行をrefreshのうえ査定価格・売却のみ（新規行は区分を選取として紐付け）。まとめめ／個別入力はrefreshのうえ売却のみ。 |
| 4 | 適格請求書 | 注文の事業者フラグをフォーム値で更新し、非事業者なら登録番号を空文字にする。 |
| 5 | 買取状況変更 | リクエスト時点のステータスIDが変わっていればマスタを付け替え履歴を残す。 |
| 6 | 振込完了だった場合 | 個別入力の売却・数量・規格紐付けを見て次ステータスを「入庫待ち」または「未登録在庫あり」に自動遷移し履歴を残す。 |
| 7 | 初回の査定内容承諾だった場合 | 既存実在庫行をすべて削除し、選取＋まとめめ明細の売却状況から実在庫を作り直してflushする。 |
| 8 | 実在庫増減 | 増減が0でない規格のみ処理。数量が負になる組み合わせは例外。按分計算で小計を更新し、履歴行を追加する。 |
| 9 | 入庫フラグが立っている場合 | 手動ネット買取由来の入庫処理を実行する。 |
| 10 | 注文をpersistしてflushしコミット | — |
| 11 | 振込完了かつ初回の振込完了履歴だった場合 | コミット後にORMをclearし注文を読み直したうえで振込完了メールを送る（フォーム用コレクション分割による明細欠け回避）。 |

※ POST_SUBMITでは次も検証する。実在庫の増減が許されない買取状況で増減が0以外ならフォームエラー。振込依頼済みへ変更時は身分証必須・高額時は会員プレイヤーの本人確認状態をチェック。元々入庫済みなら他ステータスへの変更を拒否。

---

## 集計条件

本機能は一覧集計を主題としない。画面上の「査定承諾金額合計」や個別入力の合計はTwig／JSが明細を走査して表示更新する。サーバ側の保存処理では `StockCostCalculator` により実在庫行の小計按分を行う。

---

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 査定合計（表示） | 選んで買取・まとめめ・個別入力の売却フラグと金額・数量からクライアントが再計算（確認ロジックはフロント脚本）。 |
| 実在庫の編集可否 | 買取状況IDが `APPRAISAL_ACCEPTANCE`・`IDENTIFY_VERIFIED`・`TRANSFER_REQUESTED`・`TRANSFER_COMPLETE`・`TRANSFER_FAILED`・`UNREGISTERED_STOCK`・`WAITING_FOR_STOCK` のいずれかのときのみ増減を許す。それ以外は増減0以外でエラー（validators.ja.yamlの確認メッセージ）。 |
| 振込依頼済みへの遷移 | 身分証未選択は不可。査定合計が設定値 `eccube_purchase_identification_required_amount`（確認値10000）以上のとき、会員にプレイヤーが無い・本人確認未完了は不可。 |
| 入庫済みからのステータス変更 | 拒否（validators.ja.yamlの確認メッセージ）。 |
| まとめめ買取の査定価格・数量・状態 | 保存処理では売却以外はrefreshでDB値を優先し、フォームからは変更しない。 |

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 振込依頼可能 | 任意 | — | DB現行値 | `dtb_buy_order.can_transfer_request_flg`。チェックボックス。フォーム名空間 `admin_purchase_detail`。 |
| 振込失敗 | 任意 | — | DB現行値 | `dtb_buy_order.transfer_failed_flg`。 |
| 買取状況 | 必須 | — | DB現行値 | `dtb_buy_order.buy_order_status_id`（マスタ選択）。入庫済みからの変更や振込依頼時の追加検証あり。 |
| 管理者用メモ | 任意 | DBのTEXT上限に依存（Symfony Lengthなし） | DB現行値 | `dtb_buy_order.memo`。複数行テキスト。placeholderに記載例。クラス `allow_submit` によりEnterで送信可能。 |
| 査定金額合計 | 任意 | 数字のみかつ桁9（設定キー `eccube_product_class_buy_price_max_len` の確認値）、かつMoneyのRange | DB現行値 | `dtb_buy_order.total_price`。フォーム上readonlyだが送信される。 |
| 送料 | 任意 | 同上 | DB現行値（空は0扱いのempty_data） | `dtb_buy_order.delivery_fee`。査定編集モードで編集可（Twigで `product editform`）。 |
| 選んで買取 › 状態（各行） | 任意 | — | DB現行値 | `dtb_buy_main_card.card_condition_id`。画面では常に編集不可（`always-uneditable`／readonly）。 |
| 選んで買取 › 査定価格（各行） | 任意 | 桁9・数字のみ | DB現行値 | `dtb_buy_main_card.price`。サプライ品以外はreadonly固定。 |
| 選んで買取 › 数量（各行） | 必須 | 整数入力 | DB現行値 | `dtb_buy_main_card.count`。readonly。 |
| 選んで買取 › 売却（各行） | 任意 | — | DB現行値 | `dtb_buy_main_card.sale_flg`。選択肢ラベルは「未定」「しない」「する」。値は真偽（未定はplaceholder）。 |
| 選んで買取 › 商品・言語・Foil（各行） | — | — | DB現行値 | hiddenで送信。 |
| まとめて買取 › 売却（各行） | 任意 | — | DB現行値 | `dtb_buy_main_card.sale_flg`（bulk区分）。価格・数量・状態はdisabledにより送信されず保存時はrefreshで維持。 |
| 個別入力 › 売却（各行） | 任意 | — | DB現行値 | `dtb_buy_order_indivisual_input_product.sale_flg`。表は数量正の行のみ表示。 |
| 実在庫 › 増減数（各行） | 任意 | 整数（フォーム未設定の下限あり、負の結果はサーバで例外） | 0相当 | `dtb_buy_order_stock` の数量・小計を更新。hiddenで規格ID等を送信。 |
| 氏名（姓） | 必須 | フォームLengthなし（DB列255） | DB現行値 | `dtb_buy_order.last_name`。編集モードで変更可。 |
| 氏名（名） | 必須 | 同上 | DB現行値 | `dtb_buy_order.first_name`。 |
| 氏名カナ（姓） | 必須 | 同上 | DB現行値 | `dtb_buy_order.last_name_kana`。 |
| 氏名カナ（名） | 必須 | 同上 | DB現行値 | `dtb_buy_order.first_name_kana`。 |
| 郵便番号 | 必須 | フォームLengthなし（DB列255） | DB現行値 | `dtb_buy_order.zipcode`。 |
| 都道府県 | 任意 | — | DB現行値 | `dtb_buy_order.pref_id`。 |
| 住所1 | 必須 | 同上 | DB現行値 | `dtb_buy_order.addr01`。 |
| 住所2 | 必須 | 同上 | DB現行値 | `dtb_buy_order.addr02`。 |
| 住所3 | 任意 | 同上 | DB現行値 | `dtb_buy_order.addr03`。 |
| 電話番号 | 実質必須 | 同上 | DB現行値 | `dtb_buy_order.tel_no`。requiredはfalseだがNotBlank制約あり。 |
| E-mail | 必須 | RFCチェックは設定 `eccube_rfc_email_check`（確認値false）に依存 | DB現行値 | `dtb_buy_order.email`。メール形式検証あり。 |
| 職業 | 必須 | — | DB現行値 | `dtb_buy_order.job_id`。 |
| 生年月日 | 必須 | — | DB現行値 | `dtb_buy_order.birth`。今日以前の日付制約あり。 |
| 身分証明書 | 任意 | — | DB現行値 | `dtb_buy_order.identification_id`。 |
| 口座情報 › 銀行名コード | 必須 | — | DB現行値 | `dtb_bank_account` 側。readonly表示だが編集モードで変更可能。 |
| 口座情報 › 支店名コード | 必須 | — | DB現行値 | 同上。 |
| 口座情報 › 口座種別 | 必須 | — | DB現行値 | 普通・当座・貯蓄のいずれか。 |
| 口座情報 › 口座番号 | 必須 | 数値7桁以内（Range） | DB現行値 | 表示は7桁ゼロ埋め。 |
| 口座情報 › 口座名義 | 必須 | 128文字 | DB現行値 | Length制約あり。 |
| 適格請求書 › 事業者状況（依頼者情報ブロック） | 任意 | — | DBと同期したラジオ | フォーム `admin_purchase_qualified_invoice_issuer_account`。事業者選択時のみ登録番号入力が活性（JS）。 |
| 適格請求書 › 登録番号 | 条件付き必須 | 英数字・ちょうど14文字 | DB現行値 | 事業者のときNotBlank・長さ・正規表現。保存時に非事業者へ変えた本体フラグでは番号を空にする処理あり。 |
| 適格請求書発行事業者（基本情報のラジオ） | — | — | — | disabledのため送信されず、保存入力は依頼者ブロックのフォームを正とする。 |
| 適格請求書確認状況 | 任意 | — | DB現行値または未確認表示 | `dtb_buy_order.qualified_invoice_issuer_confirmation_flg`。未確認はnullまたは偽の組み合わせをモデル変換で吸収。 |
| 棚戻し済み | — | — | — | disabledのためPOSTでは変更不要（DB値維持）。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| 実在庫の増減で数量が負になる | `InvalidArgumentException` を送出しトランザクションはロールバック（利用者向けに整形されたエラー文言ではない経路あり）。 |
| まとめめ買取行が削除される | 選取と同様にrefresh時に `EntityNotFoundException` を捕まえコレクションから外す処理が選取側にある。まとめめはフォーム構造上ほぼ固定行。 |
| 個別入力の数量0 | 画面上は行を描画しないがコレクション送信の挙動はフルセットに依存するため、保存対象は実装どおりバインド結果を正とする。 |
| CSRF | メイン・実在庫・口座・適格請求書それぞれにトークンフィールドがあり、欠落や不一致は検証エラーになる。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧と詳細 | 一覧は検索時点のスナップショット。詳細は編集GET／保存後リダイレクトで再読込される。 |
| まとめめ買取 | 初期HTMLには行が無く、開閉後にクライアントが追加するため、保存時はPOSTにbulk明細が載る前提。XHRとPOSTのID整合は実装寄り。 |
| メール送信 | 振込完了メールはコミット後にクリアした読み直しグラフを使うため、同一リクエスト内の集合操作と本文の齟齬を避ける。 |

---

## API/バッチ結果

本機能ではバッチを起動しない。XHRはHTML断片またはJSONを返し、ブラウザがDOMへ取り込むのみとする。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | GETはパス `id`。POSTは複数フォームに分割されたフィールド群・CSRF・（CSV時）買取ID配列。 |
| 成功時出力 | 保存後は302で詳細へ。成功フラッシュ1件。 |
| 失敗時出力 | 200で詳細再描画＋エラー表示。 |
| 副作用 | DB更新（注文・明細・実在庫・履歴・メール）。 |

---

## DBカラム

機能に直接関係する列のみ示す。型の細部はDoctrineマッピングを参照する。

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_buy_order` | `memo`,`total_price`,`delivery_fee`,`buy_order_status_id`,`can_transfer_request_flg`,`transfer_failed_flg`,名称・住所・連絡先・生年月日・各種フラグ | 画面の主実体。 |
| `dtb_buy_main_card` | `price`,`sale_flg`,`purchase_category`,ほか | 選取／bulkの区分で保存経路が分岐。 |
| `dtb_buy_order_indivisual_input_product` | `sale_flg`,ほか | 売却のみ上書きの経路。 |
| `dtb_buy_order_stock` | `quantity`,`subtotal`,ほか | 増減処理・初回再生成。 |
| `dtb_bank_account` | 口座各列 | 口座フォーム。 |
| `dtb_qualified_invoice_issuer_account` | `qualified_invoice_issuer_code`,ほか | 適格請求書フォーム。 |

### DB操作

永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_bank_account / dtb_buy_main_card / dtb_buy_order / dtb_buy_order_indivisual_input_product / dtb_buy_order_stock / dtb_qualified_invoice_issuer_account | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

入力項目表および POST_SUBMITリスナに委ねる。口座・登録番号はSymfony標準制約、査定価格は桁・数字のみ、電話はNotBlank、メールはカスタムRFCオプション付きEmail制約。

---

## 権限・認可

| 利用者状態 | 画面・更新 |
|------------|------------|
| 未ログイン（管理者） | 管理者ログインへ誘導される（ファイアウォール）。 |
| ログイン済み管理者 | 当パスへ到達でき、表示・POSTが可能（ルート単位の細かなRBACは別設定が無ければ管理者共通）。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 詳細で保存成功 | 同一買取詳細へリダイレクト。 |
| 一覧へ戻るリンク | `GET /{admin_route}/purchase/page/{page_no}`（セッション既定1）。 |
| 会員詳細／手動メール | それぞれ別ルートへ。 |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 一覧→詳細 | 一覧側がセッションにページ番号を保持していればそれを利用 | 詳細は当該IDの最新DB状態で組み立て |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 主キー不存在 | 404。 |
| フォーム検証エラー | 詳細を再表示しエラーを積む。 |
| 実在庫編集不可ステータスで増減あり | validatorsメッセージを買取状況に表示。 |
| 振込依頼時の身分証・本人確認不足 | 同上。 |
| 入庫済みからのステータス変更 | 同上。 |
| 実在庫数量矛盾 | 例外によりロールバック（エラーUIは環境依存）。 |

---

## 試行制限

本機能では試行制限を扱わない。

---

## ログ・監査

アプリ固有の監査ログ節はコード上は標準のフラッシュとDoctrine更新に依存する。購入ステータス・実在庫には履歴エンティティが別途付く。

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie値
- セッションIDの完全値
- RememberMeトークンの原値

---

## セッション

検索一覧のページ番号キー `eccube.admin.purchase.search.page_no` が戻りリンクに使われる。商品検索モーダルは `eccube.admin.purchase.product.search` 系キーを更新する。

---

## Cookie

本機能単体では新しいCookieを設定しない。セッションCookieは管理画面ファイアウォールの既定に従う。

---

## リニューアル移行時の扱い

現行はpf-eccube3のHareruyaEcプラグインが買取詳細編集のロジックと買取関連テーブルを保持し、リニューアル後はec-cube-enterpriseのコアへ移載される。DB関連の記述はec-cube-enterpriseを正とする。

- 編集・保存が触れる主テーブルは、買取注文`dtb_buy_order`、明細`dtb_buy_main_card`、個別入力（単数形）`dtb_buy_order_indivisual_input_product`、実在庫`dtb_buy_order_stock`、口座`dtb_bank_account`、適格請求書発行事業者`dtb_qualified_invoice_issuer_account`である。いずれもec-cube-enterprise実装に存在する名称で記す。
- 買取状況の並び順キーは、移行先ec-cube-enterpriseの買取状況マスタ`mtb_buy_order_status`では`rank`列を用いる（汎用マスタの`sort_no`ではない）。
- 買取注文ステータス履歴テーブルはec-cube-enterprise実装では`dtb_buy_order_status_histry`（綴りは実装どおり）である。
- 上記以外の列・関連について、現行プラグインと移行先コアの個別の差異は本書では網羅照合していない。差異が疑われる箇所はec-cube-enterprise実装を確認値とする。

---

## 排他制御・トランザクション

保存処理はトランザクション境界を張り、楽観ロックは買取注文ヘッダには載せない。同時編集は後勝ちに近い通常ORM更新となる。

---

## 調査補助（grep用）

- `PurchaseController::edit` / `update`
- `PurchaseDetailType`
- `PurchaseDetailUpdateAction`
- `detail.twig`
- `html/template/admin/assets/js/Purchase/purchasedetail.js`

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_purchase_edit` … `GET` … `/{admin_route}/purchase/{id}/edit`（買取詳細（買取情報編集）画面を表示する。`id` は買取注文の整数ID。）
- `admin_purchase_update` … `POST` … `/{admin_route}/purchase/{id}/update`（同一画面のメインフォームを送信し、検証成功時に永続化処理を実行してから同一詳細へリダイレクトする。）
- `admin_purchase_bulk_purchase_load` … `GET` … `/{admin_route}/purchase/{id}/bulkpurchaseload`（「まとめて買取」アコーディオン初回展開時に、まとめめ買取明細をJSONで返す（XHR）。）
- `admin_purchase_search_product` … `POST` … `/{admin_route}/purchase/searchproduct`（選んで買取の「商品追加」モーダルから商品一覧HTMLを返す（`X-Requested-With: XMLHttpRequest` 前提）。）
- `admin_search_product` … `POST` … `/{admin_route}/search/product`（実在庫の「商品追加／実在庫情報登録」モーダルから商品検索HTMLを返す。）
- `admin_purchase_bulk_detail_sell` … `POST` … `/{admin_route}/purchase/bulk/detail/{id}/sell`（同一画面フッタの「一括売却登録」から送信し、まとめめ買取含む売却フラグを一括更新して詳細へ戻す。）
- `admin_purchase_csv_export` … `POST` … `/{admin_route}/purchase/csv_export`（詳細ヘッダのCSVボタンなどから送信（当画面では hidden で当該買取IDを渡す）。一覧側仕様と共用。）
- `admin_purchase_csv_export_product_list` … `POST` … `/{admin_route}/purchase/csv_export_product_list`（同上（クエリ `type=sale`）。）
- `admin_purchase_register_individual_stock` … `POST` … `/{admin_route}/purchase/{buyOrderId}/register-individual-stock/{individualProductId}`（個別入力商品の実在庫紐付け（別トークン `purchase_register_individual_stock`）。）
