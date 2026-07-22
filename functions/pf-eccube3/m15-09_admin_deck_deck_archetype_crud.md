# デッキ管理 — アーキタイプ登録・編集・削除

## 概要

HareruyaEc プラグインが管理画面の「デッキ管理」配下で提供する、アーキタイプ（デッキ分類のマスタ）の新規登録、既存行の編集、削除を行う機能である。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。本機能のカスタマイズ区分はカスタマイズであり、挙動は現行リポ pf-eccube3 に配置された HareruyaEc プラグイン実装を確認値とし、DB関連は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| サイドメニュー「アーキタイプ管理」から一覧へ入り、「新規登録」相当で新規画面へ進む | `GET /{admin_route}/archetype/new` | 空のフォームが表示される。 |
| 新規画面で「登録」を押す | `POST /{admin_route}/archetype` | 検証成功時は登録後、当該 ID の編集 URL へリダイレクトする。 |
| 一覧の名称リンクから編集へ | `GET /{admin_route}/archetype/{id}` | 既存値が載ったフォームが表示される。ID 不存在時は 404。 |
| 編集画面で「更新」を押す | `POST /{admin_route}/archetype/{id}` | 検証成功時は同じ編集 URL へリダイレクトする。 |
| 編集画面または一覧のドロップダウンから「削除」を選び、確認後に実行 | `DELETE /{admin_route}/archetype/{id}` | 関連デッキが無ければ論理削除のうえ一覧または検索へ戻る。関連があればエラー表示のうえ検索 1 ページ目へ戻る。 |
| 編集画面で「代表カード選択」→ 検索 → 一覧から 1 件確定 | `POST`／`GET` の代表カード検索 API、`POST` の ID 解決 API | モーダル内の一覧更新と、フォーム hidden・プレビュー画像・カード名の更新。 |
| 編集画面の「代表カード」モーダル用。カード画像の検索結果 HTML 片を返す（XHR）。 | `POST /{admin_route}/archetype/search/main_card/html` | 編集画面の「代表カード」モーダル用。カード画像の検索結果 HTML 片を返す（XHR）。 |
| 同上のページング（XHR）。 | `GET /{admin_route}/archetype/search/main_card/html/{page_no}` | 同上のページング（XHR）。 |
| 代表カード確定時にカード画像 ID から名称・URL を JSON で返す（XHR）。 | `POST /{admin_route}/archetype/search/main_card/id` | 代表カード確定時にカード画像 ID から名称・URL を JSON で返す（XHR）。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | 新規は見出しに「新規」、編集は「編集」。サイドに「登録」または「更新」「削除」「戻る」。フォームは横並びレイアウト用テーマを適用。代表カードは hidden、プレビュー画像、カード名、`代表カード選択` ボタン。 |
| JS 挙動 | `deckTags` に select2 を適用。代表カードは共通の `card-image.js` により、モーダル検索・ページング AJAX・選択時の `search_main_card/id` 呼び出しで hidden と画像・名称を更新。検索ボタン初回クリック後、`searchMainCardModalButton` の click ハンドラを一度解除する実装がある。 |
| CSS・レイアウト | `entry.css`、select2 の CDN、管理者共通アセットを読み込む。 |
| モーダル・ポップアップ | 「代表カード検索」モーダル。閉じた後もフォームに選択結果が残る。削除はアンカーに `data-message` で確認ダイアログ文言を渡す（一覧と詳細でキーが異なる実装）。 |

---

## 処理フロー

### 新規登録画面を表示する（`GET admin_archetype_new`）

1. 管理画面の認証・共通制約を通過する。
2. 空のエンティティ向けにアーキタイプ用フォームと、カード検索用モーダル用フォームを生成する。
3. `archetype_detail.twig` を描画する。代表カード画像・名称は空。

### 新規登録を送信する（`POST admin_archetype_create`）

1. 新規エンティティを生成し、フォームにバインドする。
2. CSRF をフォーム名 `admin_archetype` のトークンで検証し、問題なければトークンを更新する。
3. 入力検証に失敗した場合、詳細テンプレートを再表示する（エラー表示）。代表カードの画像は、送信値の `card_image_id` が解決できれば表示用エンティティを表示する。
4. 検証成功時、代表カード画像エンティティを紐付け、`persist` と `flush` で保存する。
5. 成功フラッシュに登録完了メッセージ（キー `admin.register.complete`）を積み、`admin_archetype_edit` に新規 ID を付与してリダイレクトする。

### 編集画面を表示する（`GET admin_archetype_edit`）

1. ID でアーキタイプを取得できなければ 404。
2. フォームに既存エンティティを載せ、代表カードの画像 URL・名称をテンプレート用に渡す。

### 更新を送信する（`POST admin_archetype_update`）

1. ID でアーキタイプを取得できなければ 404。
2. 新規送信と同様に CSRF・検証・再表示の分岐・保存・フラッシュ・リダイレクト。リダイレクト先は保存した行の `admin_archetype_edit`（同一 ID）。

### 削除する（`DELETE admin_archetype_delete`）

1. CSRF をコアの既定トークン名で検証する（フォーム名ではない側のトークン。アンカー削除の共通実装に合わせる）。
2. ID 不正または行不存在なら 404。
3. 当該アーキタイプに紐づく `dtb_deck` の件数を数え、0 より大きければエラーフラッシュ（キー `admin.archetype.delete.failed`）を積み、`admin_archetype_search` のページ番号 1 へリダイレクトする。
4. 件数が 0 なら ORM の除去操作を行い `flush` する。エンティティにソフトデリータブル設定があるため、通常は `dtb_archetype` 行の `deleted_at` が立つ論理削除として扱われる（物理削除の SQL ではない）。
5. 成功フラッシュ（キー `admin.delete.complete`）を積む。
6. セッションキー `admin.archetype.search.page_no` があれば `admin_archetype_search` にそのページ番号で戻り、無ければ `admin_archetype_list` へ戻る。

### 代表カードモーダルで検索する（XHR）

1. XHR 以外の呼び出しでは pagination 等が空のまま、主要な描画差は限定的。
2. POST 時は検索語をセッションキー `admin.archetype.main_card.search` と `admin.archetype.main_card.search.page_no` に保存する。
3. GET ページング時はセッションに保存した検索語を読み、`page_no` をセッションに更新する。
4. カード画像のクエリをページネーション付きで実行し、HTML 断片テンプレートを返す。

### 代表カードを ID で確定する（XHR）

1. XHR かつ画像 ID が存在する場合、カード和英混合名・画像 URL 等を JSON で返す。不存在は 404 の空 JSON。

---

## 集計条件

本機能の画面では売上集計等は行わない。削除可否に使うデッキ件数は、次のクエリに相当する。`dtb_deck` 全体を対象とし、デッキ種別による絞り込みはしない。

一方、検索一覧に表示する「登録デッキ数」はイベント用デッキ種別に限定した件数であり、削除可否の件数と数値が一致するとは限らない。

本機能では業務計算（料金・率）を行わない。

---

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 削除可否 | `dtb_deck.archetype_id` が当該 ID の行が 1 件でもあれば削除しない。 |
| 一覧の登録デッキ数 | 検索一覧クエリではデッキ種別がイベントの行のみをカウントする。削除判定とは別ルール。 |

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| アーキタイプ名(日) | 必須 | 255 文字（フォームの `Length` 制約。上限値は `HareruyaEc.const.archetype.length.name`） | 新規は空、編集は `dtb_archetype.name_jp` | 空白不可。`name_jp`。Doctrine の列長は 64 文字定義であり、フォーム上限とスキーマ上限が一致しないため、環境や DB 制約により長文保存時に拒否され得る（実装の二重定義を確認値とする）。 |
| アーキタイプ名(英) | 必須 | 同上 | 同上 | `name_en`。列長の扱いは日本語名と同様。 |
| 解説(日) | 任意 | 1024 文字（同上 `length.text`） | 新規は空、編集は `comment_jp` | `comment_jp`。Doctrine 上は 2048 文字列カラム。 |
| 解説(英) | 任意 | 同上 | 同上 | `comment_en`。 |
| 代表カード | 任意 | number 型入力。フォームに桁の文字長制約は付けていない | hidden。新規は未設定、編集は `card_image_id` | `card_image_id`。モーダルで選択すると画像エンティティとの関連付けが更新される。未選択または無効 ID は画像を載せない表示になり得る（送信値は hidden）。 |
| 公開状態 | 必須 | マスタ選択肢の範囲内 | 編集は現行 `disp_id` | `disp_id`。コアの公開／非公開マスタ。プレースホルダ `form.disp.empty_value`。 |
| カラー | 任意 | 複数チェック。各 ID はマスタ依存 | 編集は現行の中間テーブル `dtb_archetype_color` に相当する選択状態 | 多対多。未選択は空集合の反映。 |
| フォーマット | 必須 | マスタ選択 | 編集は現行 `format_id` | `format_id`。`rank` 昇順のクエリで選択肢が並ぶ。 |
| タグ | 任意 | 複数 select(select2)。各 ID はマスタ依存 | 編集は `dtb_archetype_deck_tag` に相当する選択 | 多対多。 |
| 旧アーキタイプID | 任意 | 16 文字（`length.old_archetype_id`） | 新規は空、編集は `old_archetype_id` | 入力がある場合、正規表現 `^[\w\d]+$` に合致する必要がある。`old_archetype_id`。 |

補足: フォームの文字上限はプラグイン設定 `HareruyaEc.const.archetype.length` に従う。環境で上書きされている場合は当該設定を正とする。

### エッジケース

| ケース | 扱い |
|--------|------|
| 編集・更新・削除の ID が存在しない | HTTP 404。 |
| 削除時に関連デッキが 1 件以上 | 削除せずエラーフラッシュし、`admin_archetype_search` の 1 ページ目へ。 |
| 更新系で CSRF が不正 | アクセス拒否（HTTP 403）として扱う例外に至る実装。 |
| 一覧からの削除確認文言と詳細からの削除確認文言 | 一覧は `admin.confirm.delete`（名称埋め込み）、詳細は `admin.confirm.archetype_delete` の翻訳を用いる。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧の登録デッキ数と削除可否 | 一覧の件数はイベント用デッキのみ。削除可否は全デッキ種別を数える。一覧上 0 件でも他種別のデッキがあれば削除できない場合がある。 |
| 更新直後の再表示 | 成功時はリダイレクトにより編集画面が再読込され、保存済み値が表示される。 |
| 同時更新 | 楽観ロックは用いない。後勝ちの上書きとなる。 |

---

## API/バッチ結果

本機能では業務 API 呼び出しやバッチ実行は行わない。代表カード検索は同一管理画面内の XHR 用エンドポイントのみである。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 管理者のブラウザからの GET／POST／DELETE と XHR。 |
| 成功時出力 | HTML 画面（GET）、302 リダイレクトとフラッシュ（登録・更新・削除）、XHR 時は HTML 断片または JSON。 |
| 失敗時出力 | 同一フォームへの再描画とエラー表示、または 403／404、失敗時フラッシュ付きリダイレクト（削除不可）。 |
| 副作用 | DB の INSERT／UPDATE、論理削除に相当する更新（`deleted_at`）、セッション（代表カード検索条件、削除後の戻り先ページ）、CSRF トークン更新。 |

---

## DBカラム

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_archetype` | `id`（現行 `archetype_id`） | 自動採番主キー。 |
| `dtb_archetype` | `name_jp`, `name_en` | 名称。 |
| `dtb_archetype` | `comment_jp`, `comment_en` | 解説。 |
| `dtb_archetype` | `card_image_id` | 代表カード画像への外部キー。NULL 可。 |
| `dtb_archetype` | `disp_id` | 公開状態。 |
| `dtb_archetype` | `format_id` | フォーマット。 |
| `dtb_archetype` | `old_archetype_id` | 旧サイト連携用。NULL 可。 |
| `dtb_archetype` | `create_date`, `update_date` | 作成・更新時刻。 |
| `dtb_archetype` | `deleted_at` | ソフトデリータブル用。削除時は通常この列が更新される。 |
| `dtb_archetype_color` | `archetype_id`, `color_id` | カラー複数選択。 |
| `dtb_archetype_deck_tag` | `archetype_id`, `deck_tag_id` | タグ複数選択。 |

### DB操作

永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_archetype / dtb_archetype_color / dtb_archetype_deck_tag | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| アーキタイプ名(日・英) | 必須（空白不可）、最大 255 文字（設定値）。 |
| 解説(日・英) | 任意、最大 1024 文字（設定値）。 |
| 公開状態・フォーマット | 必須（空白不可）。 |
| 旧アーキタイプID | 任意。入力時は最大 16 文字かつ `^[\w\d]+$`。 |
| 代表カード hidden | 数値ウィジェット。追加の文字長制約は付けていない。 |

---

## 権限・認可

| 利用者状態 | 本機能への到達 |
|------------|----------------|
| 未ログインの管理者画面利用者 | 管理画面の共通認証に従い、当ルートには到達しない想定。 |
| ログイン済みで管理チャネル権限を満たす利用者 | デッキ管理メニュー経由で新規・編集・削除の各操作に到達し得る。細目はファイアウォール設定を正とする。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 新規送信が成功 | `GET` の編集画面（付与された ID）。 |
| 更新送信が成功 | 同一 ID の `GET` 編集画面へリダイレクト。 |
| 新規・更新で検証失敗 | 同一 URL へ再表示（画面は詳細テンプレートのまま）。 |
| 削除成功 | セッションに検索ページ番号があれば `admin_archetype_search`（当該ページ）、無ければ `admin_archetype_list`。 |
| 削除失敗（関連デッキあり） | `admin_archetype_search` の 1 ページ目。 |
| 詳細・新規の「戻る」 | `admin_archetype_search`。ページ番号はセッション `admin.archetype.search.page_no` があればそれ、無ければ文字列 `'1'` を既定にトゥイグ側で渡す。 |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 削除成功（検索経由だった場合） | セッション `admin.archetype.search.page_no` を参照 | 当該ページの検索結果一覧 |
| 削除成功（ページ番号未保持） | 特になし | 一覧初期表示 `admin_archetype_list` |
| 代表カードモーダル内のページ移動 | 検索条件をセッション維持、`page_no` を更新 | 同モーダル内 HTML の差し替え |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| CSRF 不正（フォーム送信） | HTTP 403 に相当する例外。 |
| CSRF 不正（アンカー削除） | 同上トークン検証。 |
| 対象 ID 不存在（編集・更新・削除） | HTTP 404。 |
| 関連デッキありで削除 | エラーフラッシュ、検索 1 ページ目へ。 |
| 代表カード ID 解決失敗（XHR） | HTTP 404 と空 JSON。 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|
| M15-09-MSG-001 | 管理画面上部フラッシュ | セッションがタイムアウトしました。もう一度やり直してください。 | アーキタイプを削除するとき、操作の有効期限が切れていたとき | アーキタイプ一覧画面に遷移する |
| M15-09-MSG-002 | 管理画面上部フラッシュ | このアーキタイプに紐づくデッキが存在するため削除できません。 | アーキタイプを削除するとき、紐づくデッキがあるとき | アーキタイプ編集画面に遷移する |
| M15-09-MSG-003 | 管理画面上部フラッシュ | 削除に失敗しました | アーキタイプを削除するとき、エラーが起きたとき | アーキタイプ編集画面に遷移する |
| M15-09-MSG-004 | 管理画面上部フラッシュ | 削除しました | アーキタイプの削除が完了したとき | アーキタイプ一覧画面に遷移する |
| M15-09-MSG-005 | 管理画面上部フラッシュ | 保存しました | アーキタイプの登録・編集を保存したとき | アーキタイプ編集画面に遷移する |
| M15-09-MSG-006 | 管理画面上部フラッシュ | 指定された代表カード画像が見つかりません。 | アーキタイプの登録・編集で、代表カードとして指定した画像が登録されていないとき | アーキタイプ登録・編集画面に留まる |
| M15-09-MSG-007 | 管理画面上部フラッシュ | 保存に失敗しました | アーキタイプの登録・編集を保存するとき、エラーが起きたとき | アーキタイプ登録・編集画面に留まる |
| M15-09-MSG-008 | 画面中央（確認ダイアログ） | このアーキタイプを削除してもよろしいですか？ | アーキタイプを削除しようとしたとき（送信前確認） | OKで削除を実行し、キャンセルで現在の画面に留まる |

---

## 試行制限

本機能では試行回数制限や CAPTCHA は扱わない。

---

## ログ・監査

本機能専用の追加ログ出力は仕様化しない。削除・更新の監査が別途どこへ出るかは共通基盤の範囲とする。

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値

---

## セッション

### 本機能におけるセッション

| 観点 | 内容 |
|------|------|
| アーキタイプ検索のページ番号 | キー `admin.archetype.search.page_no`。一覧・検索フローで更新される。削除後の戻り先や「戻る」リンクに利用。 |
| 代表カードモーダル | `admin.archetype.main_card.search` と `admin.archetype.main_card.search.page_no`。モーダル内の検索・ページングで更新。 |

### セッションへ保存しない情報

パスワード類や決済情報は本フォームの対象外である。

---

## Cookie

セッション ID の Cookie は管理画面の共通挙動に従う。本機能固有の Cookie は定義しない。

---

## 排他制御・トランザクション

楽観ロックは持たない。`flush` の単位はコントローラ内の通常の永続化処理に委ねる。

---

## 調査補助（grep 向け）

実装の所在をコード検索で辿る際の手がかりとして、次を隔離する。

- `Plugin\HareruyaEc\Controller\Admin\ArchetypeController`
- `Plugin\HareruyaEc\Form\Type\Admin\Archetype\ArchetypeType`
- `Plugin\HareruyaEc\ServiceProvider\Admin\ArchetypeServiceProvider`
- テンプレート `Resource/template/admin/Archetype/archetype_detail.twig`
- メッセージ `Resource/locale/message.ja.yml` の `form.archetype` / `admin.archetype.delete.failed` 等

---


### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_archetype_new` … `GET` … `/{admin_route}/archetype/new`（新規登録フォームの表示。）
- `admin_archetype_create` … `POST` … `/{admin_route}/archetype`（新規登録の送信処理。）
- `admin_archetype_edit` … `GET` … `/{admin_route}/archetype/{id}`（編集フォームの表示。`{id}` は 1 以上の整数。）
- `admin_archetype_update` … `POST` … `/{admin_route}/archetype/{id}`（更新の送信処理。）
- `admin_archetype_delete` … `DELETE` … `/{admin_route}/archetype/{id}`（削除の実行（アンカーからメソッド偽装で到達）。）
- `admin_archetype_main_card_html` … `POST` … `/{admin_route}/archetype/search/main_card/html`（編集画面の「代表カード」モーダル用。カード画像の検索結果 HTML 片を返す（XHR）。）
- `admin_archetype_main_card_html_page` … `GET` … `/{admin_route}/archetype/search/main_card/html/{page_no}`（同上のページング（XHR）。）
- `admin_archetype_search_main_card_by_id` … `POST` … `/{admin_route}/archetype/search/main_card/id`（代表カード確定時にカード画像 ID から名称・URL を JSON で返す（XHR）。）

## リニューアル移行時の扱い

アーキタイプの各テーブルは移行先（ec-cube-enterprise）でもコア標準のエンティティとして取り込まれている。DB関連の記述は移行先を正とする。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|---------------------|-------------------------------|
| アーキタイプ本体 | `dtb_archetype`。主キー列は `archetype_id` | `dtb_archetype`。主キー列は `id` |
| 名称列 | `name_jp`・`name_en`（Doctrine 列長 64 文字） | 同名・同桁。`name_jp`・`name_en`（各 64 文字） |
| 解説列 | `comment_jp`・`comment_en`（Doctrine 列長 2048 文字） | 同名・同桁。`comment_jp`・`comment_en`（各 2048 文字） |
| 公開状態・フォーマット・代表画像・旧 ID・論理削除 | `disp_id`・`format_id`・`card_image_id`・`old_archetype_id`（16 文字）・`deleted_at` | 同名・同構成。論理削除は `deleted_at` 更新 |
| 色・タグ中間表 | `dtb_archetype_color`・`dtb_archetype_deck_tag` | 同名・同構成。`dtb_archetype_color`（`archetype_id`・`color_id`）、`dtb_archetype_deck_tag`（`archetype_id`・`deck_tag_id`） |
| 削除可否判定の参照 | `dtb_deck.archetype_id` の件数 | 同名 `dtb_deck.archetype_id`。デッキ本体の主キー列は移行先では `id` |

新規登録・編集・削除・代表カードモーダルなどの挙動面とセッションキー名は現行 pf-eccube3 実装を正とする。セッションキー名の移行後互換の要否は本書では切り分けず、管理画面ログインやセッション基盤の移行方針は別設計を正とする。フォーム上限（名称 255 文字・解説 1024 文字）とスキーマ列長（名称 64・解説 2048）が一致しない二重定義は現行・移行先とも同様であり、移行先での実害有無は ec-cube-enterprise 実装で要確認とする。
