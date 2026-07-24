# デッキ管理 — 直近の大会管理（編集）

## 概要

HareruyaEc プラグインが管理画面の「デッキ管理」配下に提供する、`mtb_latest_event_deck` に保持する「直近の大会」スロット（複数行）のイベント開催日時・フォーマット・イベント名・参加人数を、一覧形式で編集し一括保存する機能である。初期データのマイグレーションでは固定件数の空行が投入される。画面から行の追加・削除は行わない。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。カスタマイズ区分は「現行踏襲」。画面・挙動は pf-eccube3 配下 HareruyaEc のソース、プラグイン `config.yml` の `HareruyaEc.const.deck` および `HareruyaEc.const.format`、マイグレーション `Version20180709123206` を確認値とし、DB関連（テーブル・列・型・制約・関連）は ec-cube-enterprise の実装を正とする。

対象はブラウザ経由の管理画面に限定する。コントローラの処理名単位の解剖は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

- DB関連は移行先 ec-cube-enterprise を正とする。直近の大会スロット `mtb_latest_event_deck` は現行 pf-eccube3 と移行先 ec-cube-enterprise で同一スキーマである。主キー `id`、`event_date`（NULL 可日時）、`format_id`（フォーマットマスタ `mtb_format` 参照、NULL 可）、`event_name_jp`／`event_name_en`（varchar 255、NULL 可）、`participants`（integer、NULL 可）のテーブル名・列名・型が一致する。
- 既定値に差がある。現行 pf-eccube3 はスキーマ上 `event_date` にゼロ日付、`participants` に 0 のカラム既定を持つが、移行先 ec-cube-enterprise は両列とも NULL 可で当該既定を持たない。運用値はいずれもアプリが設定する。
- 画面・挙動は現行（pf-eccube3）の確認値。移行先 ec-cube-enterprise では直近の大会管理がコア（管理画面「デッキ管理」配下）に存在する。現行はプラグイン提供、移行先はコア提供である。
- 現行と移行先で上記既定値以外のスキーマ差は確認されていない。差が生じた場合のみ本節に追記する。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| デッキ管理メニューから「直近の大会管理」を開く | `GET /{admin_route}/latest_event_deck` | 登録済みスロットごとに入力表が縦に並び、既存値がフォームに載る。 |
| 「直近の大会設定」ボタンで送信 | `POST /{admin_route}/latest_event_deck/update` | 検証が通れば全スロットが更新され、成功メッセージ表示のうえ同一画面の GET に戻る。 |
| 各表の「消去」ボタン | （クライアントのみ。該当する表内の入力値を空にする。サーバ送信しない） | 同一表内の入力欄をクリアする。送信前に他欄へ入力があれば HTML5 必須が付くため、空のまま送信するとブラウザの検証で止まる場合がある。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | ページタイトルは「直近の大会管理」。ブロックタイトル・サブタイトルは未設定（空）。フォーム名は `search_form`。CSRF は `form._token` のみ明示。各スロットは 5 行の表（見出しセルにラベル、データセルにウィジェット）。表右列に「消去」ボタン。ページ上下に同一文言の送信ボタン「直近の大会設定」。 |
| JS 挙動 | `latest-event-deck.js`: ID が `latest_event_deck_` で始まる入力に対し、いずれかに文字があれば同一表内の該当入力に `required` を付け、すべて空なら `required` を外す（keydown 等および日時ピッカーの `dp.change` のたびに再計算）。「消去」は同一表内の上記 ID 付き要素の値を空文字にする。日時欄（`latest_event_deck_eventDate_*`）に moment（`ja` ロケール、`dow: 1`）連携の `bootstrap-datetimepicker` を付与。形式は `YYYY-MM-DD HH:mm`、今日ボタンあり、`useCurrent: false`。`required.js` は `required` 属性付き要素のラベルへ赤色の「※必須」装飾を付ける。 |
| CSS・レイアウト | 管理共通に加え `bootstrap-datetimepicker.min.css`。表クラス `table with-border marT20`、ボタンエリアは `btn_area` と Bootstrap グリッド。 |
| モーダル・ポップアップ | 本機能専用のモーダルはない。 |

---

## 処理フロー

### 編集画面を表示する（GET `admin_latest_event_deck_list`）

1. 管理画面の共通制約を通過する。
2. フォーム型名 `latest_event_deck` でフォームビルダを生成する。ビルド時にリポジトリから全件を読み、行 ID ごとにフィールド名 `eventDate_{id}`・`format_{id}`・`eventNameJp_{id}`・`eventNameEn_{id}`・`participants_{id}` を追加する。ソース上の読み出しは `findAll([], ['id' => 'ASC'])` と記述されているが、`mtb_latest_event_deck` 用リポジトリはこのメソッドを上書きしておらず、Doctrine 標準の親実装との関係は実行環境のクラス解決に依存する。意図は主キー昇順の全行取得である。
3. 同じリポジトリ経路で取得したコレクションを Twig に `eventList` として渡し、テンプレートで各行を表として描画する。

### 一括更新する（POST `admin_latest_event_deck_list_update`）

1. 管理画面の共通制約を通過する。
2. 同一フォーム型でリクエストをバインドする。
3. 共通トレイトの処理で CSRF を検証する。検証に失敗した場合はアクセス拒否（HTTP 403）となる。
4. フォーム全体が無効な場合、フラッシュに `admin.register.failed` を積み、`GET admin_latest_event_deck_list` へリダイレクトする（フィールドエラーを再表示する処理はない）。
5. フォームが有効な場合、リポジトリから再度全件を `id` 昇順で取得する。
6. 取得した各行について、同名サフィックスのフォーム項目から値を読み取り、行のセッターで上書きする。すべて `persist` のうえ `flush` する。
7. フラッシュに `admin.register.complete` を積み、`GET admin_latest_event_deck_list` へリダイレクトする。

---

## 集計条件

本機能では件数集計や画面用の合算を行わない。

---

## 業務ルール・計算

本機能では数値の合算や順位計算などの業務計算を行わない。入力の検証・保存のみである。

### 入力項目

各スロット（`mtb_latest_event_deck` の 1 行）について同じラベルの項目が繰り返される。以下は 1 スロット分の論理項目である。フォーム上の項目キーは `{論理名}_{行の id}`。

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| イベント開催日 | 任意（同一表内の他欄に入力があると JS により HTML5 必須になる） | 日時形式は `HareruyaEc.const.format.datetime`（既定 `yyyy-MM-dd HH:mm`）。Symfony `datetime` 型、ウィジェットは単一行テキスト | 当該行の `event_date` 列の現行値（無ければ未入力相当） | `mtb_latest_event_deck.event_date`。キー `eventDate_{id}`。未入力は Symfony 上も任意。 |
| フォーマット | 任意（同上） | 選択肢はフォーマットマスタ（`mtb_format` 相当）の一覧。プレースホルダは翻訳キー `form.deck.format.empty_value` | 当該行の `format_id` に紐づくマスタ（無ければ未選択） | `mtb_latest_event_deck.format_id`（関連エンティティ経由）。キー `format_{id}`。 |
| イベント名（日） | 任意（同上） | 255 文字。Symfony `Length` max および `maxlength` 属性は `HareruyaEc.const.deck.length.name`（既定 255） | 当該行の `event_name_jp` | `mtb_latest_event_deck.event_name_jp`。キー `eventNameJp_{id}`。 |
| イベント名（英） | 任意（同上） | 同上 | 当該行の `event_name_en` | `mtb_latest_event_deck.event_name_en`。キー `eventNameEn_{id}`。 |
| イベント参加人数 | 任意（同上） | 整数。0 以上 `HareruyaEc.const.deck.max.number`（既定 99999999）以下。HTML の `min`/`max` 属性も同じ | 当該行の `participants` | `mtb_latest_event_deck.participants`。キー `participants_{id}`。 |

---

### エッジケース

| ケース | 扱い |
|--------|------|
| データベース上にスロット行が 0 件 | フォームは CSRF トークンのみ相当になり、表ブロックは描画されない。送信しても更新対象のループが回らず、`flush` のみで実質変化はない想定である。 |
| 検証エラー（文字長超過・参加人数範囲外など） | `admin.register.failed` のみ表示し、入力値は再表示されない（同 GET では DB の旧値が再度載る）。 |
| 一部の表だけ入力した状態で送信 | 値の入った表では HTML5 `required` が付くため、ブラウザの制約で送信が止まる場合がある。サーバ側の Symfony は原則すべて任意のため、空欄と値ありが混在した送信が届いた場合は、空欄に対応する列は NULL に近い形で永続化される。 |
| 複数管理者が同時に保存 | 最後に成功した `flush` が全行を上書きする。楽観的排他はない。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 管理画面の再表示 | 保存後は常に `GET` で全件読み直すため、当画面で表示する値と DB の内容は一致する。 |
| 店舗側「直近の大会」表示 | リポジトリの表示用抽出は「イベント日時が非 NULL」「日本語イベント名が空文字でない」「英語イベント名が空文字でない」のすべてを満たす行のみである。管理画面では空のスロットも一覧に出るため、店舗側に出る行集合と一致しない。 |
| 行数 | マイグレーションでは 5 件の初期行を想定した投入がある。アプリ上は「全件」を編集対象とし、行数固定の検証はしない。 |

---

## API/バッチ結果

本機能では API 呼び出し・バッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | POST ボディのフォーム項目（行 ID ごとの5項目）と CSRF。 |
| 成功時出力 | HTTP 302 で `GET /{admin_route}/latest_event_deck` へ。フラッシュで登録完了メッセージ。 |
| 失敗時出力 | 検証失敗時も 302 で同 URL へ。フラッシュで登録失敗メッセージ。CSRF 失敗時は 403 応答。 |
| 副作用 | `mtb_latest_event_deck` の全行が、送信時点のフォーム内容で上書き保存される。 |

---

## DBカラム

| テーブル | 列 | メモ |
|---------|-----|------|
| `mtb_latest_event_deck` | `id` | 主キー。フォーム項目名のサフィックスに使う。 |
| `mtb_latest_event_deck` | `event_date` | nullable datetime。スキーマ上の既定はゼロ日付相当の記述があるが、運用値はアプリが設定する。 |
| `mtb_latest_event_deck` | `format_id` | 外部キー。フォーマットマスタ。nullable。 |
| `mtb_latest_event_deck` | `event_name_jp` | varchar 255。nullable。 |
| `mtb_latest_event_deck` | `event_name_en` | varchar 255。nullable。 |
| `mtb_latest_event_deck` | `participants` | integer。nullable。スキーマコメント上の既定 0。 |

### DB操作

永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | mtb_latest_event_deck | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| イベント名（日・英） | Symfony `Length` で最大 255。設定 `deck.length.name` に追従。 |
| イベント参加人数 | `Range` で 0 以上 `deck.max.number` 以下。 |
| CSRF | フォーム名 `latest_event_deck` のトークン。検証後にトークンを更新する実装である。 |
| イベント開催日・フォーマット | Symfony 上は必須指定なし。 |

---

## 権限・認可

| 利用者状態 | 直近の大会管理画面の表示・更新 |
|------------|----------------------------------|
| 管理画面の認証を通過した運用者（当プラグインの管理ルートへ到達できる者） | 本機能の GET・POST を利用できる。本ルート専用の追加ロール制約はサービスプロバイダにない。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| メニューから開く | `GET /{admin_route}/latest_event_deck` で同一画面。 |
| 送信成功 | `POST` 処理後、`GET /{admin_route}/latest_event_deck` へリダイレクト。 |
| 送信失敗（フォーム無効） | 同上。 |
| CSRF 不正 | HTTP 403（共通の例外処理）。 |

### 遷移時に引き継ぐ状態

検索条件やセッションに一覧状態を保存する処理はない。フラッシュメッセージのみ次の GET で表示される。

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| CSRF トークン不正 | 要ソース確認（`LatestEventDeckController` に 403 を返す処理はなく、CSRF トークンは `form_widget(form._token)` としてフォームに含まれる。実際の挙動は実機/ソースで再確認が必要）。 |
| フォーム検証エラー | フラッシュメッセージは出さず、同一テンプレート `@admin/Deck/latest_event_deck.twig` を再描画する。項目別メッセージは `form_errors` で各項目直下に表示する（`LatestEventDeckController.php:58-61`、`latest_event_deck.twig:81,91,98,105,112`）。 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M15-11-MSG-001 | 管理画面上部 | 保存しました | Saved | 直近の大会設定を保存したとき | 直近の大会管理（編集）画面に遷移する |
| M15-11-MSG-002 | 管理画面上部 | 保存に失敗しました | Failed to save | 直近の大会設定の保存中にエラーが起きたとき | 直近の大会管理（編集）画面に留まる |

---

## 試行制限

本機能では試行制限を扱わない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 本画面のコントローラ単体 | 専用の業務ログ出力は実装されていない。 |

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値

---

## セッション

本機能の GET・POST では検索条件やフォーム内容をセッションに保存しない。管理画面のセッション維持そのものはコアの仕組みに依存する。

---

## Cookie

本機能特有の Cookie 操作はない。セッション Cookie は管理画面の共通動作に従う。

---

## 排他制御・トランザクション

データベースの楽観ロック・悲観ロックは用いない。更新処理は単一リクエスト内で `flush` により一括コミットされる。同時更新は最後勝ちである。

---

## 調査補助（実装パスのみ）

grep やコード検索のためのファイルパスを示す。ふるまいの定義は本文を正とする。

- ルート: `app/Plugin/HareruyaEc/ServiceProvider/Admin/LatestEventDeckServiceProvider.php`
- コントローラ: `app/Plugin/HareruyaEc/Controller/Admin/LatestEventDeckController.php`
- フォーム型: `app/Plugin/HareruyaEc/Form/Type/Admin/Deck/LatestEventDeckType.php`
- Twig: `app/Plugin/HareruyaEc/Resource/template/admin/Deck/latest_event_deck.twig`
- クライアント JS: `app/Plugin/HareruyaEc/Resource/template/admin/assets/js/latest-event-deck.js`
- エンティティマッピング: `app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.MtbLatestEventDeck.dcm.yml`
- リポジトリ（店舗側抽出）: `app/Plugin/HareruyaEc/Repository/MtbLatestEventDeckRepository.php`

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_latest_event_deck_list` … `GET` … `/{admin_route}/latest_event_deck`（全スロット分の編集フォームを表示する。）
- `admin_latest_event_deck_list_update` … `POST` … `/{admin_route}/latest_event_deck/update`（送信内容で全スロット行を上書き更新し、フラッシュメッセージのうえ一覧 URL へリダイレクトする。）
