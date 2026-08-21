# m07-03_admin_online_purchase_purchase_online_buy_order_edit — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

---

## 副作用（設計書からは削除・2026-08-19）

| 副作用 | DB更新（注文・明細・実在庫・履歴・メール）。 |

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### エッジケース
| ケース | 扱い |
|--------|------|
| 実在庫の増減で数量が負になる | `InvalidArgumentException` を送出しトランザクションはロールバック（利用者向けに整形されたエラー文言ではない経路あり）。 |
| まとめめ買取行が削除される | 選取と同様にrefresh時に `EntityNotFoundException` を捕まえコレクションから外す処理が選取側にある。まとめめはフォーム構造上ほぼ固定行。 |
| 個別入力の数量0 | 画面上は行を描画しないがコレクション送信の挙動はフルセットに依存するため、保存対象は実装どおりバインド結果を正とする。 |
| CSRF | メイン・実在庫・口座・適格請求書それぞれにトークンフィールドがあり、欠落や不一致は検証エラーになる。 |
---
### データ整合性
| 観点 | 内容 |
|------|------|
| 一覧と詳細 | 一覧は検索時点のスナップショット。詳細は編集GET／保存後リダイレクトで再読込される。 |
| まとめめ買取 | 初期HTMLには行が無く、開閉後にクライアントが追加するため、保存時はPOSTにbulk明細が載る前提。XHRとPOSTのID整合は実装寄り。 |
| メール送信 | 振込完了メールはコミット後にクリアした読み直しグラフを使うため、同一リクエスト内の集合操作と本文の齟齬を避ける。 |
---

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### 入力項目
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

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### ログ・監査
アプリ固有の監査ログ節はコード上は標準のフラッシュとDoctrine更新に依存する。購入ステータス・実在庫には履歴エンティティが別途付く。
#### ログに出してはいけないもの
- パスワード
- なりすまし対策トークン
- Cookie値
- セッションIDの完全値
- RememberMeトークンの原値
---
### 権限・認可
| 利用者状態 | 画面・更新 |
|------------|------------|
| 未ログイン（管理者） | 管理者ログインへ誘導される（ファイアウォール）。 |
| ログイン済み管理者 | 当パスへ到達でき、表示・POSTが可能（ルート単位の細かなRBACは別設定が無ければ管理者共通）。 |
---
### セッション
検索一覧のページ番号キー `eccube.admin.purchase.search.page_no` が戻りリンクに使われる。商品検索モーダルは `eccube.admin.purchase.product.search` 系キーを更新する。
---
### 排他制御・トランザクション
保存処理はトランザクション境界を張り、楽観ロックは買取注文ヘッダには載せない。同時編集は後勝ちに近い通常ORM更新となる。
---
### 業務ルール・計算
