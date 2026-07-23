# 店舗設定 — 追加システム設定（HareruyaEcプラグイン）

## 概要

HareruyaEcプラグインが管理画面に追加する「追加システム設定」画面から、`mtb_option` に保持されるキー値ペアを一覧・編集し、送信時に変更のあった行だけを更新する機能である。コアの「店舗設定／基本情報設定（SHOPマスター）」とは別画面・別フォームであり、`dtb_base_info` は本機能では書き換えない。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。対象はブラウザ経由の管理画面に限定する。

サイドメニュー上の親グループは HareruyaEc のサイドバー登録処理により「データ管理」配下に「追加システム設定」として登録される実装が確認値である。ナビ階層を「店舗設定（基本設定）」と同一グループとみなす運用があっても、ソース上のメニュー構造はデータ管理配下である。

本書では Symfony のルート名、URL パス、コントローラクラス名は扱わない。

カスタマイズ区分はカスタマイズであり、挙動・画面・処理フローの参照は現行リポ pf-eccube3（HareruyaEcプラグイン）を正とし、DB関連（テーブル名・列名・型・制約・関連、DBカラム節、入力項目の保存先、データ整合性のDB部分、副作用のDB更新）はリニューアル後システムである ec-cube-enterprise を正とする。

---

## 本書で扱うこと

- 当画面の表示ブロック（単一フォーム、右カラムの「設定」ボタン）とテーマ適用（Bootstrap横並び）
- 入力項目ごとの種別・検証・初期値の読み（フォーム型定義）
- 保存処理が「既存の `mtb_option` 行のうちフォームキーが一致し、かつ文字列として値が変わったもののみ」を更新する条件
- 成功時のフラッシュメッセージ種別と同一機能へのリダイレクト
- CSRF 検証が共通トレイトによりフォーム名単位で行われること
- 永続化先 `mtb_option` の列と、各フォーム項目が保存するときの論理キー（`option_key` の実値）

---

## 本書で扱わないこと

以下は本書では仕様確定せず、実装または別機能の設計を正とする。

- 管理画面ログイン、権限マスタ、管理画面 IP 制限の共通ポリシーの細部（当パスが拒否リストに載るかは環境設定と権限データを正とする）
- 各オプション値を参照する注文・メール・スマレジ連携・レコメンド等の業務ロジック全文
- `mtb_option` に当該キー行が存在しない場合のマイグレーション初回投入や欠損時の挙動の網羅（リポジトリの `findAll` 結果と保存ループの実装を正とする）
- プラグイン無効時やルート未登録時の到達可否

---

## リニューアル移行時の扱い

- 挙動・画面・処理フローは現行（pf-eccube3 の HareruyaEcプラグイン）の確認値、DBスキーマは移行先（ec-cube-enterprise）を正とする。
- 永続化先テーブル `mtb_option` は現行・移行先ともに存在し、列構成（`id`、`option_key`、`option_value`、`member_id`、`update_date`）も概ね同一スキーマである。本書のDB記述は移行先（ec-cube-enterprise）を正とする。
- 主な差は次のとおり。`option_key` の桁が現行 32 → 移行先 255 である。`option_value` は現行・移行先とも文字列（移行先は TEXT 型）。`member_id` は移行先で `dtb_member.id` を参照する外部キーである。
- 移行時は、論理キー（`option_key`）ごとの行が現行から移行先へ引き継がれることを前提に、キー桁拡張と各論理キーの値の妥当性を移行設計で確認する。

---

## 用語

| 用語 | 説明 |
|------|------|
| 追加システム設定 | 画面タイトルおよびサイドメニュー表示名。HareruyaEc の設定フォーム集約画面を指す。 |
| `mtb_option` | HareruyaEc のオプション行を格納するテーブル。1行が1キー。値は `option_value` に文字列として保持する。 |
| 論理キー | プラグイン側のオプション論理キー定数が示す `option_key` 列の値（例: `arrival_alert_max`）。フォームフィールド名と一致させている。 |
| 利用者 | 本機能では管理者アカウント（`dtb_member` 由来のログイン主体）を指す。 |

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| 管理画面ナビから当機能を開く | `GET /{admin_route}/setting/shop/additional_system` | `mtb_option` を全件読み込み、論理キーから連想配列を組み立てたうえでフォームに現在値が表示される。CSRF トークン付きの単一フォームと「設定」ボタンが表示される。 |
| 値を入力して「設定」を押す（検証成功） | `POST /{admin_route}/setting/shop/additional_system/update` | 変更のあったキーについて `option_value` と最終更新者相当の `member_id` が更新され、成功メッセージの後に同一画面を GET で開き直す遷移となる。 |
| 値を入力して「設定」を押す（検証失敗） | `POST /{admin_route}/setting/shop/additional_system/update` | 保存は行わず、同一テンプレートを再描画してフィールドエラーを表示する。 |
| CSRF 検証に失敗する | `POST /{admin_route}/setting/shop/additional_system/update` | Symfony のアクセス拒否（HTTP 403）が投げられる実装である（表示文言やHTTPコードはフレームワークとエラーハンドラを正とする）。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | `{% block title %}` は「追加システム設定」。メニュー選択状態は `menus = ['data_menu', 'config_list']`。メインは左9カラム・右3カラムの2カラム。左に単一ボックス内へフォーム行を縦に並べる。右カラム共通ボックスに「設定」ボタン（`btn-primary`、ブロック幅）。 |
| 入力項目 | Symfonyフォームが生成する全ウィジェットを `form_row` で順に描画する。項目ラベル・種別・検証は「業務ルール・計算」の表を正とする。 |
| JS 挙動 | 当テンプレート専用スクリプトは無い。 |
| CSS・レイアウト | `Form/config_layout.html.twig` が `bootstrap_3_horizontal_layout` を継承する。ラベル列幅 `col-sm-4`。ウィジェット列は整数で `col-sm-2`、choice で `col-sm-4`、text で `col-sm-8`（その他既定 `col-sm-8`）。エラー時は `has-error`。 |
| モーダル・ポップアップ | 本機能ではモーダルや確認ダイアログは用いない。 |
| 送信 | `method="post"`、アクションは GET で画面を開くのと同じパスを指す生成URL（メソッドのみ POST で別ハンドラにつながる構成）。 |

---

## 処理フロー

### 画面を開く（GET）

1. 管理画面の認証・権限・IP 制限を通過する（共通仕様を正とする）。
2. `mtb_option` をリポジトリで全件取得する。
3. 各行の `option_key` をキー、`option_value` を値とする連想配列を組み立てる。
4. フォームビルダにオプション `settings` へその連想配列を渡してフォームを生成する。
5. Twig でフォームビューを描画する。

### 「設定」押下（POST、検証成功）

1. 再度 `mtb_option` を全件取得する。
2. フォームをリクエストでバインドする。
3. CSRF をフォーム名に紐づくトークンで検証する。成功時はトークンを更新する。
4. Symfony の検証が成功した場合、取得済みの各行エンティティについて、フォームデータに同名キーが存在し、かつ `(string)` キャスト後の送信値が `(string)` キャスト後の現行 `option_value` と異なるときだけ、`option_value` を上書きし、ログイン中ユーザーの識別子を `member_id` に格納して永続化キューに載せる。
5. ユニットオブワークをフラッシュする。
6. 管理画面向け成功フラッシュ键 `admin.register.complete` を積む。
7. 当機能の GET 相当へリダイレクトする。

### 「設定」押下（POST、検証失敗）

1. 上記のとおりフォームをバインドするまで同じ。
2. 検証が失敗した場合、テンプレートを再描画しエラーを表示する。データベースへの書き込みは行わない。

---

## 集計条件

本機能では一覧件数・合計などの集計表示を行わない。

---

## 業務ルール・計算

本機能では商品点数や金額の業務計算を行わない。入力値は検証後に文字列として `option_value` に格納される（整数・選択肢も保存時は文字列比較の対象となる）。

### 入力項目

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

### エッジケース

| ケース | 扱い |
|--------|------|
| フォームに存在するキーが `findAll()` の結果に無い | 保存ループの対象外となり、INSERT は行わない。 |
| 送信値と現行値が文字列として同一 | `persist` しない（`member_id` も更新しない）。 |
| 複数管理者が短時間に順に保存 | 楽観ロックは無い。最後の保存が残る。 |
| `update_date` 列 | 当コントローラは `option_value` と `member_id` のみ更新対象として明示している。`update_date` を現在時刻へ進める処理は同一メソッド内に無い。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧と当画面 | 当画面はキー行の集合全体を読み、編集後も同一機能で再読込する。別一覧画面との突合は本機能の範囲外。 |
| 参照側との一致 | メール送信や受注画面などは各リクエストで `mtb_option` を読み直す実装が多く、保存後の次リクエストでは更新値が見える。キャッシュ層を挟む読み込みが無い限り、同一リクエスト内の読み取りタイミングにより古い値が使われる余地は別機能の実装次第である。 |
| 文字列としての比較 | 整数フィールドでも保存判定は文字列キャスト後であるため、`0` と `00` のような差が入力経路で生じた場合のみ更新扱いになりうる。 |

---

## API/バッチ結果

本機能では外部HTTP APIの呼び出しやバッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | フォームに付随する CSRF、および「業務ルール・計算」の全項目。 |
| 成功時出力 | フラッシュ成功メッセージ（翻訳キー `admin.register.complete`）。リダイレクト後の GET で画面全体が再描画される。 |
| 失敗時出力 | 同一レスポンスでフィールドエラー表示。 |
| 副作用 | 変更が検出された `mtb_option` 行の `option_value` と `member_id` を更新し `flush` する。 |

---

## DBカラム

永続化先テーブルは `mtb_option` のみである。DB関連は ec-cube-enterprise の実装を正とする（SKILL 手順 1c）。現行 pf-eccube3 と差がある箇所は移行先を主とし現行を括弧で添える。

| テーブル | 列 | メモ |
|---------|-----|------|
| mtb_option | id | 主キー。自動採番。 |
| mtb_option | option_key | 論理キー。長さ255（現行 pf-eccube3 は 32）。 |
| mtb_option | option_value | 設定値。TEXT。空許容。 |
| mtb_option | member_id | 最終更新した管理者の識別子（`dtb_member.id` 参照）。NULL可。保存時に送信者へ更新される場合がある。 |
| mtb_option | update_date | 日時。非NULL。当画面の保存処理ではセットしない実装である。 |

### DB操作

永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_member / mtb_option | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | ルール・扱い |
|------|----------------|
| CSRF | フォーム名をトークン ID に用い、POST パラメータからネストされたトークンを検証する。不正時は例外。検証後にトークン更新する。 |
| 入荷通知最大数〜英語サイト専用タグIDまで | 前章「業務ルール・計算」の各行に記載の制約に従う。 |

---

## 権限・認可

| 利用者状態 | 画面表示・保存 |
|------------|----------------|
| 管理画面未認証 | 管理画面の認証フローへ誘導される（詳細は管理画面ログインを正とする）。 |
| 管理画面に入れた管理者 | 当パスが権限拒否や IP 制限に該当しない限り、表示・保存が可能であることを前提とする（プラグイン側に個別 Voter は無く、管理画面配下の共通セキュリティに依拠する実装である）。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 保存成功 | 同一機能の初期表示（GET）へ HTTP リダイレクトする。 |
| 保存失敗 | 同一テンプレートをその場で再描画する。 |
| CSRF 不正 | アクセス拒否系の例外処理へ委ねる。 |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 保存成功→リダイレクト | 成功フラッシュを積む | 再描画直後に成功メッセージが表示される。フォームは DB の最新値から組み立て直される。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 入力検証エラー | フィールド近傍にエラー表示。保存ループに入らない。 |
| CSRF 不正 | アクセス拒否（HTTP 403）。 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M10-16-MSG-001 | 管理画面上部 | 保存しました | 保存しました | 追加システム設定を保存したとき | 追加システム設定画面に遷移する |
| M10-16-MSG-002 | 入力項目直下 | 数字で入力してください。 | 数字で入力してください。 | カテゴリーIDに数字以外を入力して保存したとき | 保存せず追加システム設定画面に留まる |

---

## 試行制限

本機能ではログイン試行回数などの試行制限を扱わない。

---

## ログ・監査

当画面専用の業務監査ログ出力は実装されていない。データベースの `member_id` が最終更新者の手がかりとなる。

---

## セッション

本機能は検索条件など独自のセッションキーを読み書きしない。セッションは管理画面共通を正とする。

---

## Cookie

本機能は独自の業務用 Cookie を設定しない。

---

## 排他制御・トランザクション

楽観ロック列は持たない。明示的なトランザクション境界は張らず、単回 `flush` に依存する。

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
