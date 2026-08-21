# m10-16_admin_base_setting_setting_shop_additional_system — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 用語

| 用語 | 説明 |
|------|------|
| 追加システム設定 | 画面タイトルおよびサイドメニュー表示名。HareruyaEc の設定フォーム集約画面を指す。 |
| `mtb_option` | HareruyaEc のオプション行を格納するテーブル。1行が1キー。値は `option_value` に文字列として保持する。 |
| 論理キー | プラグイン側のオプション論理キー定数が示す `option_key` 列の値（例: `arrival_alert_max`）。フォームフィールド名と一致させている。 |
| 利用者 | 本機能では管理者アカウント（`dtb_member` 由来のログイン主体）を指す。 |

---

## 参考（値の利用先の読み取りガイド）

本節はリバース設計の読み手が追跡しやすいよう、コードベース上で当オプションが参照される代表例を示す。分岐の正典は各サービス・イベント実装とする。

| 論理キー（例） | 効きやすい領域の例 |
|----------------|-------------------|
| `purchase_mail_address` | 買取関連メールの宛先組み立て。 |
| `send_notification_arrival_mail` | 入荷通知メール送信の可否。 |
| `order_timing_border` | 配送日指定・購入タイミング境界。 |
| `smaregi_*` | スマレジ HTTP 連携の接続パラメータ。 |
| `order_list_threshold_price_*` | 管理画面の注文詳細・一覧まわりの表示分割しきい値。 |
| `stack_paper_*` | ピッキング／印刷まわりの高額判定。 |
| `small_packet_max_price` | 配送方法選択しきい値。 |
| `slider_en_only_tag_id` | フロントブロックのタグ参照。 |
| `covert_title_product_ids` | 商品タイトル表示変換の対象 ID 集合。 |

---

## 副作用（設計書からは削除・2026-08-19）

| 副作用 | 変更が検出された `mtb_option` 行の `option_value` と `member_id` を更新し `flush` する。 |

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### エッジケース
| ケース | 扱い |
|--------|------|
| フォームに存在するキーが `findAll()` の結果に無い | 保存ループの対象外となり、INSERT は行わない。 |
| 送信値と現行値が文字列として同一 | `persist` しない（`member_id` も更新しない）。 |
| 複数管理者が短時間に順に保存 | 楽観ロックは無い。最後の保存が残る。 |
| `update_date` 列 | 当コントローラは `option_value` と `member_id` のみ更新対象として明示している。`update_date` を現在時刻へ進める処理は同一メソッド内に無い。 |
---
### データ整合性
| 観点 | 内容 |
|------|------|
| 一覧と当画面 | 当画面はキー行の集合全体を読み、編集後も同一機能で再読込する。別一覧画面との突合は本機能の範囲外。 |
| 参照側との一致 | メール送信や受注画面などは各リクエストで `mtb_option` を読み直す実装が多く、保存後の次リクエストでは更新値が見える。キャッシュ層を挟む読み込みが無い限り、同一リクエスト内の読み取りタイミングにより古い値が使われる余地は別機能の実装次第である。 |
| 文字列としての比較 | 整数フィールドでも保存判定は文字列キャスト後であるため、`0` と `00` のような差が入力経路で生じた場合のみ更新扱いになりうる。 |
---

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### 入力項目
| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 入荷通知最大数 | 必須 | —（integer） | DB現行値、無ければ定数既定 5 | `mtb_option.option_value`。論理キー `arrival_alert_max`。NotBlank、0以上の整数。 |
| ピッキングリスト分割しきい値価格 | 必須 | —（integer） | DB現行値、無ければ 980 | `mtb_option.option_value`。論理キー `picking_list_threshold_price`。NotBlank、0以上。 |
| 店頭用アカウントIPアドレス( , 区切り) | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `otc_account_ip`。空を許す。入力がある場合は数字・ドット・カンマのみ許す正規表現。 |
| 注文詳細商品一覧分割しきい値価格(1) | 必須 | —（integer） | DB現行値、無ければ 980 | `mtb_option.option_value`。論理キー `order_list_threshold_price_1`。NotBlank、0以上。 |
| 注文詳細商品一覧分割しきい値価格(2) | 必須 | —（integer） | DB現行値、無ければ 4800 | `mtb_option.option_value`。論理キー `order_list_threshold_price_2`。NotBlank、0以上。 |
| 買取専用メールアドレス | 必須 | —（text） | DB現行値、無ければ `testbuying@hareruyamtg.com` | `mtb_option.option_value`。論理キー `purchase_mail_address`。NotBlank、厳密メール。 |
| レコメンドの検索期間（日数） | 必須 | —（integer） | DB現行値、無ければ 7 | `mtb_option.option_value`。論理キー `recommend_search_days`。NotBlank、0以上。 |
| 買取査定申込み完了画面の自動遷移秒数 | 任意 | —（integer） | DB現行値、無ければ 15 | `mtb_option.option_value`。論理キー `otcbuy_order_return_seconds`。NotBlank 制約は付けない実装である。 |
| スマレジ契約ID | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `smaregi_contract_id`。印字可能 ASCII 範囲（`[!-~]`）のみ許す正規表現。 |
| スマレジアクセストークン | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `smaregi_access_token`。印字可能 ASCII 範囲（`[!-~]`）のみ許す正規表現（`smaregi_contract_id` と同型）。 |
| スマレジへの送信URL | 任意 | —（text） | DB現行値、無ければ `https://webapi.smaregi.jp/access/` | `mtb_option.option_value`。論理キー `smaregi_request_url`。http/https/ftp の URL 形式正規表現。 |
| スマレジ店舗ID | 必須 | —（integer） | DB現行値、無ければ 0 | `mtb_option.option_value`。論理キー `smaregi_store_id`。NotBlank、0以上。 |
| スマレジ部門ID | 必須 | —（integer） | DB現行値、無ければ 0 | `mtb_option.option_value`。論理キー `smaregi_category_id`。NotBlank、0以上。 |
| スマレジ通信エラー送信メールアドレス | 任意 | —（text） | DB現行値、無ければ `smaregierror@hareruyamtg.com` | `mtb_option.option_value`。論理キー `smaregi_error_mail_address`。入力があるときだけ厳密メール。 |
| レシートプリンタIPアドレス | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `receipt_printer_ip_address`。数字とドットのみ。 |
| スタック用紙高額商品判定価格 | 必須 | —（choice・展開セレクト） | DB現行値、無ければ 0（表示ラベルは「販売価格」） | `mtb_option.option_value`。論理キー `stack_paper_judgment_price`。NotBlank。選択肢は 0＝販売価格、1＝買取価格。 |
| スタック用紙高額商品しきい値価格 | 必須 | —（integer） | DB現行値、無ければ 5000 | `mtb_option.option_value`。論理キー `stack_paper_threshold_price`。NotBlank、0以上。 |
| 配送日指定が繰上る時刻(hh:mm) | 必須 | —（text） | DB現行値、無ければ `15:00` | `mtb_option.option_value`。論理キー `order_timing_border`。NotBlank、`00:00`〜`23:59` 形式の正規表現。 |
| タイトルを変更する商品ID( , 区切り) | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `covert_title_product_ids`。数字とカンマのみ許す正規表現（定数名は `CONVERT_TITLE_PRODUCT_IDS` だが論理キー文字列は `covert_title_product_ids`）。 |
| 入荷通知メールの許可 | 必須 | —（choice） | DB現行値、無ければ `1`（送信する） | `mtb_option.option_value`。論理キー `send_notification_arrival_mail`。NotBlank。`1`＝送信する、`0`＝送信しない。 |
| まとめて買取商品ID | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `bulk_purchase_id`。`GreaterThanOrEqual(0)` のみ（text型フィールドへの数値制約として実装されている）。 |
| 固定価格商品部門ID | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `fixed_price_section`。HTML 上は必須表示になり得る確認値。`GreaterThanOrEqual(1)` のみ。NotBlank は付けない実装である。 |
| 買取部門集計送信メールアドレス | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `otc_summary_mail_address`。カンマ区切り複数メールの正規表現（実装パターンを正とする）。 |
| 必須項目が空欄である会員送信メールアドレス | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `check_bric_mail_address`。複数メール正規表現（`otc_summary_mail_address` と同型の確認値）。 |
| ポイント利用が反映されない決済の送信先メールアドレス | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `check_nrpu_mail_address`。複数メール正規表現（上記と同型の確認値）。 |
| ポイント差分発生通知メール | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `adjust_point_variance_mail_addr`。複数メール正規表現（上記と同型の確認値）。 |
| 支店システム連携エラー通知先メールアドレス | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `branch_error_mail_address`。複数メール正規表現（上記と同型の確認値）。 |
| 購入処理エラー通知先メールアドレス | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `shopping_error_mail_address`。複数メール正規表現（上記と同型の確認値）。 |
| イベント決済確認エラー通知メールアドレス | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `check_payment_error_mail_address`。複数メール正規表現（上記と同型の確認値）。 |
| 身分証の有効期限切れ会員送信メールアドレス | 任意 | —（text） | DB現行値、無ければ空文字 | `mtb_option.option_value`。論理キー `check_id_expired_mail_address`。複数メール正規表現（上記と同型の確認値）。 |
| Small packetが選択可能な合計金額の閾値 | 必須 | —（integer） | DB現行値、無ければ 50000 | `mtb_option.option_value`。論理キー `small_packet_max_price`。NotBlank、0以上。 |
| 英語サイト専用タグID | 任意 | —（integer） | DB現行値、無ければ 0 | `mtb_option.option_value`。論理キー `slider_en_only_tag_id`。`GreaterThanOrEqual(0)` のみ。NotBlank は付けない実装である。 |
画面上のラベルはフォーム定義の `label` を正とする。`mtb_option.option_key` に対応する論理キーは「保存先・扱い」列に示す。初期値は GET 時に `settings` にキーが無い場合のフォールバックである。値は変更検知された場合に限り `mtb_option.option_value` へ書き込まれ、行は論理キーで識別する。ウィジェット種別や形式の要点は「最大長」列にまとめ、検証ルールは「保存先・扱い」に書く。

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### ログ・監査
当画面専用の業務監査ログ出力は実装されていない。データベースの `member_id` が最終更新者の手がかりとなる。
---
### 権限・認可
| 利用者状態 | 画面表示・保存 |
|------------|----------------|
| 管理画面未認証 | 管理画面の認証フローへ誘導される（詳細は管理画面ログインを正とする）。 |
| 管理画面に入れた管理者 | 当パスが権限拒否や IP 制限に該当しない限り、表示・保存が可能であることを前提とする（プラグイン側に個別 Voter は無く、管理画面配下の共通セキュリティに依拠する実装である）。 |
---
### セッション
本機能は検索条件など独自のセッションキーを読み書きしない。セッションは管理画面共通を正とする。
---
### 業務ルール・計算
