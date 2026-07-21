# 全所見 明細

台帳 `ledger.json` から自動生成（手打ちしていないので REPORT.md との数値ズレは起きない）。
出典 `file:line` はすべて実ファイルに逐語引用が存在することを機械検証済み。

**判定の原則**: 「最大文字数」＝その画面で入力できる最大長＝FormType の `Assert\Length`。
DB列長は値の出所の説明にはなるが画面仕様の正しさは保証しない。

| 記号 | 意味 |
|---|---|
| pf | 現行システム pf-eccube3 (MySQL) |
| ee | リニューアル後 ec-cube-enterprise (PostgreSQL) |
| 設計 | HTML設計書の画面項目定義の値 |

---

# 1. 乖離候補（要対応）

## 1-1. D_HTML孤立 — 設計値が pf/ee どちらとも違う（22件）

**最も疑わしい。** ただし fable5 の反証により、約8件は「設計書の誤り」ではなく
**ee内部の不整合**（同じ項目がフロントと管理画面で別の上限）と判明している。
例: 会社名は ee フロント `EntryType.php:86` が `eccube_company_len_max: 100`、admin `CustomerType` が 255。

| 書番 | シート | 識別ID | ラベル | 設計 | pf | ee | ee出典 |
|---|---|---|---|---|---|---|---|
| 0201 | メンバー管理 | 1-4 | ログインID | 255文字 | 50 | 50 | `Admin/MemberType.php:199` |　Excel設計書を修正済
| 0201 | メンバー管理 | 1-6 | パスワード | 255文字 | 50 | 50 | `Admin/MemberType.php:86` |　Excel設計書を修正済
| 0201 | メンバー管理 | 1-7 | パスワード(確認) | 255文字 | 50 | 50 | `Admin/MemberType.php:86` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 10-12 | 住所1 | 90文字 | 200 | 200 | `Admin/OrderType.php:107` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 10-13 | 住所2 | 90文字 | 200 | 200 | `Admin/OrderType.php:115` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 10-2 | お名前（姓） | 50文字 | 16 | 16 | `NameType.php:105` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 10-23 | 問い合わせ | 99999文字 | 3000 | 3000 | `Admin/OrderType.php:206` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 10-3 | お名前（名） | 50文字 | 16 | 16 | `NameType.php:119` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 10-4 | お名前ふりがな（姓） | 50文字 | 25 | 25 | `KanaType.php:62` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 10-5 | お名前ふりがな（名） | 50文字 | 25 | 25 | `KanaType.php:76` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 12-1 | お名前（姓） | 50文字 | 16 | 16 | `NameType.php:105` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 12-10 | 住所1 | 90文字 | 200 | 200 | `Admin/ShippingType.php:107` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 12-11 | 住所2 | 90文字 | 200 | 200 | `Admin/ShippingType.php:118` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 12-2 | お名前（名） | 50文字 | 16 | 16 | `NameType.php:119` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 12-3 | お名前ふりがな（姓） | 50文字 | 25 | 25 | `KanaType.php:62` |　Excel設計書を修正済
| 0203 | 受注情報編集 | 12-4 | お名前ふりがな（名） | 50文字 | 25 | 25 | `KanaType.php:76` |　Excel設計書を修正済
| 0207 | 会員検索一覧(検索入力) | 1 | 会員ID・メールアドレス・お名前 | 100 | 50 | 255 | `Admin/SearchCustomerType.php:64` |
| 0207 | 会員登録編集 | 6 | 会社名 | 100 | 50 | 255 | `Admin/CustomerType.php:75` |
| 0209 | 店舗登録 | 1-28 | 取り扱い商品説明文 | 4000文字 | 99999 | 3000 | `Admin/Enterprise/MallTenantShopType.php:283` |
| 0209 | 店舗登録 | 1-29 | 店舗からのメッセージ | 4000文字 | 99999 | 3000 | `Admin/Enterprise/MallTenantShopType.php:291` |
| 0209 | 店舗登録 | 1-5 | 店名(英語表記) | 255文字 | 200 | 200 | `Admin/Enterprise/MallTenantShopType.php:81` |
| 0212 | デッキ一覧(検索入力) | 27 | カード名 | 100文字 | 200 | 200 | `Admin/SearchDeckType.php:168` |

## 1-2. D2_HTML≠ee — pf側は未解決だが ee と食い違う（16件）

正典は ee なので pf 未解決でも判定できる。
**注目**: 0209 店舗登録の 支店URL(設計255→ee32) と 住所(設計32→ee90) は
**同一シートで値が入れ替わった疑い**。メールアドレス 254/255 問題が5件。

| 書番 | シート | 識別ID | ラベル | 設計 | pf | ee | ee出典 |
|---|---|---|---|---|---|---|---|
| 0201 | メンバー管理 | 1-5 | メールアドレス | 255文字 | - | 254 | `Admin/MemberType.php:140` |　リニューアル後DB定義が255文字のため、実装を設計に合わせる
| 0202 | 在庫履歴検索一覧(検索入力) | 2-37 | 在庫変動理由・欠品理由 | 65535byte | - | 16384 | `Admin/StockHistoryType.php:479` |
| 0202 | 在庫移動指示詳細 | 1-9 | 送状No. | 65535byte | - | 255 | `Admin/StockMoveInstructionDetailType.php:39` |
| 0202 | 在庫編集 | 3-2 | 在庫変動理由 | 65535byte | - | 16384 | `Admin/StockApprovalType.php:113` |
| 0203 | 受注情報編集 | 10-14 | 住所3 | 90文字 | - | 200 | `Admin/OrderType.php:122` |
| 0203 | 受注情報編集 | 12-12 | 住所3 | 90文字 | - | 200 | `Admin/ShippingType.php:128` |
| 0207 | 配送先編集 | 17 | 配送先会社名 | 100 | - | 255 | `Front/CustomerAddressType.php:99` |
| 0207 | 会員登録編集 | 16 | メールアドレス | 85 | - | 254 | `Admin/CustomerType.php:99` |
| 0209 | 店舗登録 | 1-10 | 住所 | 32文字 | - | 90 | `Admin/Enterprise/MallTenantShopType.php:138` |
| 0209 | 店舗登録 | 1-11 | 住所(英語表記) | 512文字 | - | 500 | `Admin/Enterprise/MallTenantShopType.php:151` |
| 0209 | 店舗登録 | 1-6 | 支店URL | 255文字 | - | 32 | `Admin/Enterprise/MallTenantShopType.php:94` |
| 0306 | 会員情報変更 | 1-10 | メールアドレス | 255 | - | 254 | `RepeatedEmailType.php:47` |
| 0306 | 会員情報変更 | 1-11 | メールアドレス(確認) | 255 | - | 254 | `RepeatedEmailType.php:47` |
| 0306 | 配送先新規登録・変更 | 2-15 | 会社名 | 100 | - | 255 | `Front/CustomerAddressType.php:98` |
| 0306 | 新規会員登録 | 1-10 | メールアドレス | 255 | - | 254 | `RepeatedEmailType.php:47` |
| 0306 | 新規会員登録 | 1-11 | メールアドレス(確認) | 255 | - | 254 | `RepeatedEmailType.php:47` |

## 1-3. C_HTML=pf≠ee — 設計書がpf値のまま未更新 or ee未実装（24件）

**方向は機械的に決められない。** 同じ `stext_len` 50→255 の変更を
B では「意図的リニューアル」と読み C では「実装漏れ」と読むのは非対称なので、断定しない。
人手で「設計書を直すのか実装を直すのか」を判断する必要がある。

| 書番 | シート | 識別ID | ラベル | 設計 | pf | ee | ee出典 |
|---|---|---|---|---|---|---|---|
| 0202 | 在庫一括編集 | 2-11 | 在庫変動理由 | 65535byte | 65535 | 16384 | `Admin/StockBulkApprovalItemType.php:57` |
| 0203 | 受注情報編集 | 10-22 | 会社名 | 50文字 | 50 | 255 | `Admin/OrderType.php:88` |
| 0203 | 受注情報編集 | 10-8 | 海外用郵便番号 | 50文字 | 50 | 10 | `Admin/OrderType.php:277` |
| 0203 | 受注情報編集 | 12-7 | 海外用郵便番号 | 50文字 | 50 | 10 | `Admin/ShippingType.php:240` |
| 0204 | 購入グループ管理 | 4 | メモ | 1024文字 | 1024 | 4000 | `Admin/ProductSellGroupType.php:75` |
| 0206 | 買取一覧(検索入力) | 2 | 買取番号 | 50 | 50 | 255 | `Admin/Purchase/PurchaseListType.php:126` |
| 0207 | 会員検索一覧(検索入力) | 18 | 購入商品名・コード | 50 | 50 | 255 | `Admin/SearchCustomerType.php:138` |
| 0207 | 会員登録編集 | 23 | パスワード | 32 | 32 | 50 | `RepeatedPasswordType.php:51` |
| 0207 | 会員登録編集 | 24 | パスワード（確認） | 32 | 32 | 50 | `RepeatedPasswordType.php:51` |
| 0208 | カード詳細(登録・編集・削除 | 2-2 | 裏面カード詳細ID | 6 | - | 999999 | `Admin/CardDetailType.php:110` |
| 0212 | デッキ一覧(検索入力) | 12 | イベント名 | 50文字 | 50 | 255 | `Admin/SearchDeckType.php:129` |
| 0212 | デッキ一覧(検索入力) | 16 | 成績 | 50文字 | 50 | 255 | `Admin/SearchDeckType.php:146` |
| 0212 | デッキ一覧(検索入力) | 23 | デッキ名 | 50文字 | 50 | 255 | `Admin/SearchDeckType.php:59` |
| 0212 | デッキ一覧(検索入力) | 25 | プレイヤー名 | 50文字 | 50 | 255 | `Admin/SearchDeckType.php:153` |
| 0212 | デッキ一覧(検索入力) | 28 | イベントID
→ イベント詳細ID | 50文字 | 50 | 255 | `Admin/SearchDeckType.php:175` |
| 0212 | デッキ一覧(検索入力) | 3 | デッキID | 50文字 | 50 | 255 | `Admin/SearchDeckType.php:51` |
| 0214 | 日程登録 | 15 | 定員 | 50文字 | 50 | 9 | `Admin/ScheduleType.php:140` |
| 0214 | 日程登録 | 16 | 参加費 | 50文字 | 50 | 8 | `Admin/ScheduleType.php:145` |
| 0306 | 会員情報変更 | 1-12 | パスワード | 32 | 32 | 50 | `RepeatedPasswordType.php:49` |
| 0306 | 会員情報変更 | 1-13 | パスワード(確認) | 32 | 32 | 50 | `RepeatedPasswordType.php:49` |
| 0306 | 新規会員登録 | 1-12 | パスワード | 32 | 32 | 50 | `RepeatedPasswordType.php:49` |
| 0306 | 新規会員登録 | 1-13 | パスワード(確認) | 32 | 32 | 50 | `RepeatedPasswordType.php:49` |
| 0306 | パスワード再発行 | 3-3 | 新しいパスワード | 32 | 32 | 50 | `RepeatedPasswordType.php:49` |
| 0306 | パスワード再発行 | 3-4 | 新しいパスワード(確認) | 32 | 32 | 50 | `RepeatedPasswordType.php:49` |

# 2. 数値トラック

## 2-1. ND1_設計上限 > 実装上限 ＝ 設計値が入力できない（9件）

**設計に書かれた上限を実際には入力できない。** 価格系は設計9桁 vs 実装8桁で系統的に1桁ずれ。
なお ee 定数には `eccube_int_len: 9 # 最大値で制御したい` `eccube_price_len: 8 # 最大値で制御したい` と
**開発者自身が「値で制御したいが桁数制御になっている」と認めるコメント**がある。

| 書番 | シート | 識別ID | ラベル | 設計 | ee実効上限 | 根拠定数 |
|---|---|---|---|---|---|---|
| 0202 | 在庫履歴検索一覧(検索入力) | 2-17 | 変更時販売価格(from) | 0~999999999 | **99999999** | `eccube_price_len` |
| 0202 | 在庫履歴検索一覧(検索入力) | 2-18 | 変更時販売価格(to) | 0~999999999 | **99999999** | `eccube_price_len` |
| 0202 | 在庫履歴検索一覧(検索入力) | 2-19 | 仕入単価(from) | 0~999999999 | **99999999** | `eccube_price_len` |
| 0202 | 在庫履歴検索一覧(検索入力) | 2-20 | 仕入単価(to) | 0~999999999 | **99999999** | `eccube_price_len` |
| 0202 | 在庫履歴検索一覧(検索入力) | 2-21 | 変更後原価単価(from) | 0~999999999 | **99999999** | `eccube_price_len` |
| 0202 | 在庫履歴検索一覧(検索入力) | 2-22 | 変更後原価単価(to) | 0~999999999 | **99999999** | `eccube_price_len` |
| 0202 | 在庫検索一覧(検索入力) | 2-10 | 基準価格 | 0-999999999 | **99999999** | `eccube_price_len` |
| 0202 | 在庫検索一覧(検索入力) | 2-20 | 販売価格 | 0-999999999 | **99999999** | `eccube_price_len` |
| 0208 | フォーマット詳細(登録・編集 | 4 | 並び順 | 1~10000 | **4096** | `eccube_construct_format_board_max_card_count` |

## 2-2. ND2_設計上限 < 実装上限 ＝ 実装が設計より緩い（11件）

入力を拒否すべき値を実装が受け付ける。設計が正なら実装側の制約不足。

| 書番 | シート | 識別ID | ラベル | 設計 | ee実効上限 | 根拠定数 |
|---|---|---|---|---|---|---|
| 0204 | 商品マスター(検索入力) | 17 | 販売価格(From) | 0 -999999999 | **99999999** | `eccube_price_len` |
| 0204 | 商品マスター(検索入力) | 18 | 販売価格(To) | 0 -999999999 | **99999999** | `eccube_price_len` |
| 0204 | 買取・販売価格履歴検索 | 1-13 | 基準価格(From) | 0 -999999999 | **99999999** | `eccube_price_len` |
| 0204 | 買取・販売価格履歴検索 | 1-14 | 基準価格(To) | 0 -999999999 | **99999999** | `eccube_price_len` |
| 0204 | 買取・販売価格履歴検索 | 1-15 | 販売価格(From) | 0 -999999999 | **99999999** | `eccube_price_len` |
| 0204 | 買取・販売価格履歴検索 | 1-16 | 販売価格(To) | 0 -999999999 | **99999999** | `eccube_price_len` |
| 0204 | 買取・販売価格履歴検索 | 1-17 | 買取価格(From) | 0 -999999999 | **99999999** | `eccube_price_len` |
| 0204 | 買取・販売価格履歴検索 | 1-18 | 買取価格(To) | 0 -999999999 | **99999999** | `eccube_price_len` |
| 0214 | イベント編集 | 1-11 | 定員 | 8字 | **9** | `eccube_int_len` |
| 0214 | 複製新規 | 1-11 | 定員 | 8字 | **9** | `eccube_int_len` |
| 0304 | ご注文方法指定 | 6-5 | ポイント使用 | 9桁 | **11** | `literal` |

# 3. 必須トラック

## 3-1. 設計は必須◯だが pf/ee 両方とも NotBlank が無い（74件）

**設計が必須と言っているのに実装が空入力を通す。** ただし委譲型（`RepeatedType` 等）の
内部制約を静的解析で追えないため、**偽陽性が混じりうる**（7章の限界参照）。

| 書番 | シート | 識別ID | ラベル | 設計必須 | pf_NotBlank | ee_NotBlank | ee出典 |
|---|---|---|---|---|---|---|---|
| 0201 | メンバー管理 | 1-2 | 所属店舗 | ○ | False | False | `Admin/MemberType.php:121` |
| 0202 | 棚卸計画新規作成 | 1 | 棚卸名 | ◯ | False | False | `Admin/Stock/InventoryPlanType.php:63` |
| 0202 | 棚卸計画編集 | 1 | 棚卸名 | ◯ | False | False | `Admin/Stock/InventoryPlanType.php:63` |
| 0202 | 棚卸在庫確認 | 10 | 棚卸数量 | 〇 | False | False | `Admin/Stock/InventoryPlanDetailType.php:72` |
| 0202 | 棚卸在庫確認 | 9 | 在庫数量 | 〇 | False | False | `Admin/Stock/InventoryPlanDetailType.php:67` |
| 0203 | 受注情報編集 | 6-4 | 欠品数量 | 〇 | False | False | `Admin/OrderItemType.php:128` |
| 0205 | 買取集計データ(検索入力) | 1 | 集計日(From) | 〇 | False | False | `Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:58` |
| 0205 | 買取集計データ(検索入力) | 2 | 集計日(To) | 〇 | False | False | `Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:63` |
| 0207 | 配送先編集 | 1 | 国 | ○ | False | False | `Front/CustomerAddressType.php:103` |
| 0207 | 配送先編集 | 13 | 配送先都道府県 | ○ | False | False | `AddressType.php:52` |
| 0207 | ブラックリスト管理 | 1 | 項目(新規登録用) | ○ | False | False | `Admin/BlacklistUpdateType.php:34` |
| 0207 | ブラックリスト管理 | 3 | 項目(更新用) | ○ | False | False | `Admin/BlacklistType.php:32` |
| 0207 | ブラックリスト管理 | 4 | キーワード(更新用) | ○ | False | False | `Admin/BlacklistType.php:37` |
| 0207 | 会員検索一覧(検索入力) | 3 | 検索パターン名 | ◯ | False | False | `Admin/SearchCustomerType.php:480` |
| 0209 | 店舗登録 | 1-4 | 店名(カナ) | ○ | False | False | `Admin/Enterprise/MallTenantShopType.php:393` |
| 0211 | 特集タグ編集CSVダウンロー | 3 | フォーマット | 〇 | False | False | `Admin/Analysis/SearchUsedCardType.php:55` |
| 0211 | 日別・月別集計 集計一覧(検 | 1 | 集計タイプ | 〇 | False | False | `Admin/Analysis/SummaryType.php:62` |
| 0211 | 日別・月別集計 集計一覧(検 | 2 | 集計日(From) | 〇 | False | False | `Admin/Analysis/SummaryType.php:71` |
| 0211 | 日別・月別集計 集計一覧(検 | 3 | 集計日(To) | 〇 | False | False | `Admin/Analysis/SummaryType.php:72` |
| 0211 | 日別・月別集計 集計一覧(検 | 1 | 集計タイプ | 〇 | False | False | `Admin/Analysis/SummaryType.php:62` |
| 0211 | 日別・月別集計 集計一覧(検 | 2 | 集計月(From) | 〇 | False | False | `Admin/Analysis/SummaryType.php:71` |
| 0211 | 日別・月別集計 集計一覧(検 | 3 | 集計月(To) | 〇 | False | False | `Admin/Analysis/SummaryType.php:72` |
| 0213 | 買取価格対応表(編集) | 4 | 買取価格(円)※ | 〇 | False | False | `Admin/BuyPriceListEditType.php:33` |
| 0214 | バナー設定 | 10 | 並び順 | 〇 | False | False | `Admin/Event/EventBannerSettingType.php:151` |
| 0214 | 画像設定 | 2 | ファイルを選択 | 〇 | False | False | `Admin/Event/EventBannerUploadType.php:38` |
| 0214 | イベント編集 | 1-11 | 定員 | 〇 | False | False | `Admin/EventType.php:152` |
| 0214 | イベント編集 | 1-14 | 参加費 | 〇 | False | False | `Admin/EventType.php:172` |
| 0214 | イベント編集 | 1-3 | 店舗 | 〇 | False | False | `Admin/EventType.php:88` |
| 0214 | イベント編集 | 1-5 | フォーマット | 〇 | False | False | `Admin/EventType.php:93` |
| 0214 | 日程登録 | 15 | 定員 | 〇 | False | False | `Admin/ScheduleType.php:140` |
| 0214 | 日程登録 | 16 | 参加費 | 〇 | False | False | `Admin/ScheduleType.php:145` |
| 0214 | 複製新規 | 1-11 | 定員 | 〇 | False | False | `Admin/EventType.php:152` |
| 0214 | 複製新規 | 1-14 | 参加費 | 〇 | False | False | `Admin/EventType.php:172` |
| 0214 | 複製新規 | 1-3 | 店舗 | 〇 | False | False | `Admin/EventType.php:88` |
| 0214 | 複製新規 | 1-5 | フォーマット | 〇 | False | False | `Admin/EventType.php:93` |
| 0304 | 買い物かご | 7 | 数量 | ◯ | False | False | `src/Eccube/Resource/template/default/Cart/index.twig:265` |
| 0304 | ご注文方法指定 | 3-1 | お届け先選択 | ◯ | False | False | `src/Eccube/Resource/template/default/Shopping/index.twig:230` |
| 0304 | 配送先の新規登録_変更 | 13 | 都道府県 | ◯ | False | False | `AddressType.php:72` |
| 0304 | 配送先の新規登録_変更 | 9 | 国 | ◯ | False | False | `Front/CustomerAddressType.php:103` |
| 0305 | ネット買取買取手続き～完了 | 20 | 適格請求発行事業者の確認 | ◯ | False | False | `src/Eccube/Resource/template/default/Purchase/fill.twig:299` |
| 0305 | ネット買取買取手続き～完了 | 24 | ネット買取規約同意 | ◯ | False | False | `src/Eccube/Resource/template/default/Purchase/fill.twig:320` |
| 0306 | オンライン本人確認 | 2-3 | 撮影する身分証明書の種類 | 〇 | False | False | `Front/IdentificationSelectType.php:44` |
| 0306 | オンライン本人確認 | 3-3 | 現在の顔写真 | 〇 | False | False | `Front/IdentificationImageType.php:44` |
| 0306 | オンライン本人確認 | 3-4 | 顔写真付きの身分証
(オモテ面) | 〇 | False | False | `Front/IdentificationImageType.php:47` |
| 0306 | オンライン本人確認 | 3-5 | 顔写真付きの身分証
(ウラ面・別ペー | 〇 | False | False | `Front/IdentificationImageType.php:63` |
| 0306 | オンライン本人確認 | 3-6 | 顔写真付きの身分証
(斜め) | 〇 | False | False | `Front/IdentificationImageType.php:50` |
| 0306 | 会員情報変更 | 1-16 | 住所(都道府県) | ◯ | False | False | `AddressType.php:107` |
| 0306 | 配送先新規登録・変更 | 2-10 | 住所(都道府県) | ◯ | False | False | `AddressType.php:107` |
| 0306 | 配送先新規登録・変更 | 2-8 | 国 | ◯ | False | False | `Front/CustomerAddressType.php:103` |
| 0306 | 配送先新規登録・変更 | 3-6 | 国 | ◯ | False | False | `Front/CustomerAddressType.php:103` |
| 0306 | 配送先新規登録・変更 | 3-8 | 住所(都道府県) | ◯ | False | False | `AddressType.php:107` |
| 0306 | 退会 | 2-3 | パスワード | ◯ | False | False | `Front/WithdrawType.php:37` |
| 0306 | お問い合わせ | 1-3 | 件名（タイトル） | ◯ | False | False | `Front/ContactType.php:88` |
| 0306 | お問い合わせ | 4-1 | お問い合わせ詳細 | ◯ | False | False | `Front/ContactType.php:103` |
| 0306 | お問い合わせ | 4-10 | アンケート | ◯ | False | False | `Front/ContactType.php:179` |
| 0306 | お問い合わせ | 4-4 | イベント名 | ◯ | False | False | `Front/ContactType.php:138` |
| 0306 | お問い合わせ | 4-5 | イベント実施店舗 | ◯ | False | False | `Front/ContactType.php:141` |
| 0306 | お問い合わせ | 4-6 | イベント開催日 | ◯ | False | False | `Front/ContactType.php:155` |
| 0306 | お問い合わせ | 4-7 | イベント開始時間 | ◯ | False | False | `Front/ContactType.php:161` |
| 0306 | お問い合わせ | 4-8 | キャンセル理由 | ◯ | False | False | `Front/ContactType.php:166` |
| 0306 | お問い合わせ | 4-9 | その他キャンセル理由 | ◯ | False | False | `Front/ContactType.php:176` |
| 0306 | 新規会員登録 | 1-16 | 住所(都道府県) | ◯ | False | False | `AddressType.php:107` |
| 0306 | 新規会員登録 | 2-10 | 住所(都道府県) | ◯ | False | False | `AddressType.php:107` |
| 0308 | 店頭買取査定申込情報入力 | 11 | 都道府県 | ◯ | False | False | `Front/OtcBuy/OtcBuyOrderType.php:118` |
| 0308 | 店頭買取査定申込情報入力 | 24 | 電話連絡 | ◯ | False | False | `Front/OtcBuy/OtcBuyOrderType.php:212` |
| 0308 | 店頭買取査定申込情報入力 | 25 | 大会参加中または参加予定 | ◯ | False | False | `Front/OtcBuy/OtcBuyOrderType.php:221` |
| 0308 | 店頭買取査定申込情報入力 | 31 | 利用規約同意する | ◯ | False | False | `Front/OtcBuy/OtcBuyOrderType.php:239` |
| 0308 | 店頭買取査定申込情報入力 | 8 | 郵便番号1 | ◯ | False | False | `Front/OtcBuy/OtcBuyOrderType.php:105` |
| 0308 | 店頭買取査定申込情報入力 | 9 | 郵便番号2 | ◯ | False | False | `Front/OtcBuy/OtcBuyOrderType.php:113` |
| 0308 | 会員登録フォーム | 2 | メールアドレス | ◯ | False | False | `Front/OtcBuy/OtcBuyRepeatedEmailType.php:51` |
| 0308 | 会員登録フォーム | 3 | メールアドレス(確認用) | ◯ | False | False | `Front/OtcBuy/OtcBuyRepeatedEmailType.php:51` |
| 0308 | 会員登録フォーム | 4 | パスワード | ◯ | False | False | `Front/OtcBuy/OtcBuyRepeatedPasswordType.php:48` |
| 0308 | 会員登録フォーム | 5 | パスワード(確認用) | ◯ | False | False | `Front/OtcBuy/OtcBuyRepeatedPasswordType.php:48` |
| 0308 | 会員登録フォーム | 8 | 利用規約同意する | ◯ | False | False | `Front/OtcBuy/OtcBuyOrderType.php:239` |

## 3-2. 設計は任意(-)だが実装は NotBlank を持つ（14件）

**実装のほうが厳しい。** 設計書の記載漏れか、実装の過剰制約か要判断。

| 書番 | シート | 識別ID | ラベル | 設計必須 | pf_NotBlank | ee_NotBlank | ee出典 |
|---|---|---|---|---|---|---|---|
| 0202 | 在庫移動・振替登録 編集 ( | 5-2 | 却下理由 | - | - | True | `Admin/StockMoveOutboundApprovalType.php:38` |
| 0203 | 受注情報編集 | 10-4 | お名前ふりがな（姓） | - | False | True | `KanaType.php:62` |
| 0203 | 受注情報編集 | 10-5 | お名前ふりがな（名） | - | False | True | `KanaType.php:76` |
| 0203 | 受注情報編集 | 12-13 | 電話番号1 | - | False | True | `Admin/ShippingType.php:143` |
| 0203 | 受注情報編集 | 12-14 | 電話番号2 | - | False | True | `Admin/ShippingType.php:154` |
| 0203 | 受注情報編集 | 12-15 | 電話番号3 | - | False | True | `Admin/ShippingType.php:165` |
| 0207 | 会員登録編集 | 3 | お名前名 | - | True | True | `NameType.php:119` |
| 0209 | メール設定 | 1-2 | 件名 | - | True | True | `Admin/MailType.php:64` |
| 0209 | 店舗登録 | 1-25 | スマレジ店舗ID | - | True | False | `Admin/Enterprise/MallTenantShopType.php:218` |
| 0209 | 店舗登録 | 1-36 | ピッキングリスト分割しきい値価格 | - | True | False | `Admin/Enterprise/MallTenantShopType.php:347` |
| 0209 | 店舗登録 | 1-37 | スタック用紙高額商品しきい値価格 | - | True | False | `Admin/Enterprise/MallTenantShopType.php:350` |
| 0209 | 自動送信メール | 1-4 | テンプレ名称 | - | False | True | `Admin/AutoMailType.php:56` |
| 0209 | 自動送信メール | 1-5 | 件名 | - | True | True | `Admin/AutoMailType.php:62` |
| 0305 | ネット買取買取手続き～完了 | 21 | 登録番号 | - | True | True | `Front/OtcBuy/QualifiedInvoiceIssuerAccountType.php:47` |

# 4. 実装内部の欠陥（設計書と無関係）

## 4-1. F1_Form が DB列長より長い入力を通す ＝ 登録・更新が失敗（4件）

**PostgreSQLは超過を切り捨てず ERROR にする。フォーム検証を通過した入力が永続化時に落ちる。**

| Entity.列 | Form上限 | DB列長 | Form出典 | DB出典 |
|---|---|---|---|---|
| **DtbArchetype.name_jp** | 255 (literal) | **64** | `Admin/ArchetypeType.php:38` | `DtbArchetype.php:39` |
| **DtbArchetype.name_en** | 255 (literal) | **64** | `Admin/ArchetypeType.php:47` | `DtbArchetype.php:42` |
| **DtbEvent.name_jp** | 255 (eccube_stext_len) | **155** | `Admin/EventType.php:76` | `DtbEvent.php:46` |
| **DtbEvent.name_en** | 255 (eccube_stext_len) | **155** | `Admin/EventType.php:82` | `DtbEvent.php:49` |

→ **アーキタイプ名は65文字以上、イベント名は156文字以上で登録・更新が失敗する。**

## 4-2. F3_Form に Assert\Length が無く DB varchar(255) に依存（25件）

256文字目で登録が失敗する。ee は定数 `eccube_email_len: 254` を持ち
`MemberType.php:144` / `RepeatedEmailType.php:48` / `CustomerType.php:99` では適用済みなので、**付け忘れ**。
（`Email` 制約は書式のみ検証し長さを見ない。`eccube_rfc_email_check: false` なので strict 化の抜け道も無い）

| Entity.列 | DB列長 | Form出典 | 到達可能性 |
|---|---|---|---|
| BaseInfo.email01 | 255 | `Admin/ShopMasterType.php:129` | 通常UIから到達可能 |
| BaseInfo.email02 | 255 | `Admin/ShopMasterType.php:136` | 通常UIから到達可能 |
| BaseInfo.email03 | 255 | `Admin/ShopMasterType.php:143` | 通常UIから到達可能 |
| BaseInfo.email04 | 255 | `Admin/ShopMasterType.php:150` | 通常UIから到達可能 |
| BaseInfo.email01 | 255 | `Admin/Enterprise/MallTenantShopType.php:190` | 通常UIから到達可能 |
| BaseInfo.email02 | 255 | `Admin/Enterprise/MallTenantShopType.php:197` | 通常UIから到達可能 |
| BaseInfo.email03 | 255 | `Admin/Enterprise/MallTenantShopType.php:204` | 通常UIから到達可能 |
| BaseInfo.email04 | 255 | `Admin/Enterprise/MallTenantShopType.php:211` | 通常UIから到達可能 |
| DeliveryTime.delivery_time | 255 | `Admin/DeliveryTimeType.php:39` | 通常UIから到達可能 |
| DtbBankAccount.account_type | 8 | `Front/Purchase/ConfirmType.php:70` | 通常UIから到達可能 |
| DtbBuyOrder.last_name | 255 | `Admin/Purchase/PurchaseDetailType.php:67` | **readonly（通常UI不可・改変POST/APIのみ）** |
| DtbBuyOrder.first_name | 255 | `Admin/Purchase/PurchaseDetailType.php:75` | **readonly（通常UI不可・改変POST/APIのみ）** |
| DtbBuyOrder.last_name_kana | 255 | `Admin/Purchase/PurchaseDetailType.php:84` | **readonly（通常UI不可・改変POST/APIのみ）** |
| DtbBuyOrder.first_name_kana | 255 | `Admin/Purchase/PurchaseDetailType.php:92` | **readonly（通常UI不可・改変POST/APIのみ）** |
| DtbBuyOrder.tel_no | 255 | `Admin/Purchase/PurchaseDetailType.php:139` | **readonly（通常UI不可・改変POST/APIのみ）** |
| DtbBuyOrder.zipcode | 255 | `Admin/Purchase/PurchaseDetailType.php:148` | **readonly（通常UI不可・改変POST/APIのみ）** |
| DtbBuyOrder.addr01 | 255 | `Admin/Purchase/PurchaseDetailType.php:162` | **readonly（通常UI不可・改変POST/APIのみ）** |
| DtbBuyOrder.addr02 | 255 | `Admin/Purchase/PurchaseDetailType.php:171` | **readonly（通常UI不可・改変POST/APIのみ）** |
| DtbBuyOrder.email | 255 | `Admin/Purchase/PurchaseDetailType.php:186` | **readonly（通常UI不可・改変POST/APIのみ）** |
| DtbShelfNumber.name | 255 | `Admin/ShelfNumberType.php:35` | 通常UIから到達可能 |
| DtbWaitingTag.waiting_tag | 10 | `Admin/WaitingTagType.php:72` | 通常UIから到達可能 |
| Layout.layout_name | 255 | `Admin/LayoutType.php:43` | 通常UIから到達可能 |
| MailTemplate.mail_key | 255 | `Admin/MailType.php:87` | 通常UIから到達可能 |
| MtbStorageCode.name | 255 | `Admin/StorageCodeType.php:36` | 通常UIから到達可能 |
| Order.email | 255 | `Admin/OrderType.php:130` | 通常UIから到達可能 |

※ `DtbBuyOrder` 9件は `attr => [readonly => readonly]` 付きで通常UIからは編集不可（codex反証）。
  ただし Symfony の `readonly` は**HTML属性にすぎず送信値は束縛される**（束縛を止めるのは `disabled`）ため、
  改変POST・API経路では Length 欠落がそのまま効く。

## 4-3. MySQL→PostgreSQL 移行で INSERT が失敗しうる列（9件）

pf(MySQL `text`=65,535バイト) → ee(PostgreSQL `varchar(N)`) に縮小、かつ**pf側Formが N より長い入力を許していた**列。
**実データ未確認のため「リスク」であり「確定障害」ではない。移行前に実データの最大長計測が必要。**

| Entity.列 | pf Form上限 | ee DB |
|---|---|---|
| **Customer.email** | **制約なし**（pf `RepeatedEmailType.php:38` は NotBlank/Email/Regex のみ。pfに `email_len` 定数が無い） | varchar(255) |
| BaseInfo.email01〜04 | 制約なし | varchar(255) |
| BaseInfo.good_traded / message | 99999 (`lltext_len`) | varchar(4000) |
| AuthorityRole.deny_url | 制約なし | varchar(4000) |
| DeliveryTime.delivery_time | 制約なし | varchar(255) |

※ 60列の縮小を検出後、pf Form が既に ee 列長以下に制限していた9列（例 `BaseInfo.shop_name` pf=50 ≤ 255）は
  安全として除外、41列は pf Form を Entity 経由で引けず判定不能とした。

# 5. 設計書内部の欠陥（オラクル不要・実装を見ずに確定）

## 5-1. 同一ラベルで最大文字数が矛盾（14ラベル）

| ラベル | 書番をまたいだ値 |
|---|---|
| パスワード | 32 / 50 / 255 / 320 |
| メールアドレス | 85 / 255 / 320 |
| パスワード(確認) | 32 / 50 / 255 |
| 会社名 | 50 / 100 / 255 |
| プレイヤー名 | 50 / 64 / 255 |
| カード名 | 100 / 255 |
| 検索パターン名 | 255 / 30865 |
| お名前（姓） | 50 / 128 |
| お名前（名） | 50 / 128 |
| 住所1 | 90 / 128 |
| 住所2 | 90 / 128 |
| 住所3 | 90 / 128 |
| 成績 | 32 / 50 |
| デッキ名 | 50 / 255 |

## 5-2. その他

| 種別 | 内容 |
|---|---|
| データ異常 | 0207 sheet-3「検索パターン名」`maxlen=30865`（他書番では255文字） |
| 文言の誤り | HTML「MTG **Campaign** 登録名」vs 実装「MTG **Companion**登録名」(`EntryTypeExtension.php:60`) |
| 異体字混在 | 必須列に ◯(U+25EF)180 / ○(U+25CB)116 / 〇(U+3007)112 の3種＋△31 |
| 表記揺れ | 「数値(整数)」50件 と 「数値（整数）」81件 |
| 書式列の誤記 | 0308 sheet-6 のメール確認用/パスワードは書式が「ボタン」だが実体は入力欄（codex検出） |

# 6. 確定不能（判定できなかった行）

**「乖離が無い」ではなく「判定できなかった」。** 静的解析では 親型・別名型・Form extension・
`PRE_SET_DATA`/`POST_SUBMIT`・Controllerのイベントdispatch を追えない。

| トラック | 確定不能 | 母数 |
|---|---|---|
| 最大文字数 | 50 | 293 |
| 数値 | 82 | 118 |
| 必須 | 133 | 682 |

各行の理由は `item_definition_audit_scoped.tsv` の `未確定の理由_pf` / `未確定の理由_ee` 列に入っている。
