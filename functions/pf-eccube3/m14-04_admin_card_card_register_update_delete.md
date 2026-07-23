# カード管理 — 新規登録・編集・削除（詳細フォーム）

## 概要

HareruyaEc プラグインが管理画面の「カード管理」に提供する、カードマスタ（および紐づくリーガリティ行・カード詳細・画像）の新規作成・更新・単体削除を行う機能である。一覧の検索・ページング・CSV とは別画面で、同一 Twig テンプレート上のフォーム送信・詳細画面サイドバーの DELETE リンクで完結する部分を扱う。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。pf-eccube3 に配置された HareruyaEc プラグインのソースとプラグイン付属の `config.yml`（定数ブロック）を確認値とする。

本機能のカスタマイズ区分はカスタマイズである。現行挙動は pf-eccube3 の HareruyaEc プラグインを参照し、永続化に関わるテーブル名・列名などのDB関連は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。コントローラのメソッド名は本文の主説明としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

DB関連の記述は ec-cube-enterprise の実装を正とする。カードマスタ・リーガリティ・カード詳細・画像のテーブル名・列名は現行（pf-eccube3）と移行先（ec-cube-enterprise）で同一スキーマだが、削除時に切り離す商品との紐付け列と商品の削除方式が異なる。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|---------------------|-------------------------------|
| カード基本情報 | `mtb_card`（`name_jp`/`name_en`/`cmc`/`color_sequence_id` 等） | 同一スキーマ（`mtb_card`）。 |
| リーガリティ行 | `dtb_card_format`（`card_id`/`format_id`/`restriction_id`） | 同一スキーマ（`dtb_card_format`）。 |
| カード詳細 | `mtb_card_detail` | 同一スキーマ（`mtb_card_detail`）。 |
| 画像 | `mtb_card_image`（`url` は 128 文字、`language_id`、`back_flg`） | 同一スキーマ（`mtb_card_image`、`url` 128 文字）。 |
| カード詳細と商品の紐付け列 | `dtb_product_sub.card_detail_id`（補助表経由） | `dtb_product.card_detail_id`（商品本体の列。補助表 `dtb_product_sub` は移行先に存在しない）。削除前の `NULL` 切り離しは移行先では `dtb_product.card_detail_id` を対象とする。 |
| 削除可否の商品判定 | 論理未削除（`dtb_product.del_flg = 0`） | 移行先は `del_flg` を持たず物理削除のため、紐付く商品行の有無で判定する。 |

入力フォーム・保存・削除の挙動と最大長（プラグイン `config.yml` の定数）は現行（pf-eccube3）を参照する。`dtb_product_sub` と `del_flg` は移行先で上表のとおり読み替える。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| 一覧ヘッダの「新規」等から新規画面へ | `GET /{admin_route}/card/new` | 空のフォームが出る。保存ボタン文言は共通メッセージの「登録」側。削除ボタンは無い。 |
| 一覧のカード名リンクから詳細へ | `GET /{admin_route}/card/{id}` | 既存データが埋まったフォームが出る。保存は「更新」。サイドバーに削除リンクがある。 |
| 新規で入力し保存 | `POST /{admin_route}/card` | 検証を通れば永続化し、登録完了フラッシュが付いたうえで `GET /{admin_route}/card/{新ID}` へリダイレクトする。 |
| 編集で入力し保存 | `POST /{admin_route}/card/{id}` | 検証を通れば更新し、同じく完了フラッシュのうえで同 URL（編集画面）へリダイレクトする。 |
| 詳細サイドバーで削除を確定（確認ダイアログ後） | `DELETE /{admin_route}/card/{id}` | 削除ブロックでなければ関連解除・子の再帰削除のうえ成功フラッシュ。ブロックならエラーフラッシュで参照元へ戻る。 |
| サイドバー「戻る」 | `GET /{admin_route}/card/search/{page_no}`（`page_no` はセッションの `admin.card.search.page_no`、無ければ 1） | 検索一覧へ戻る。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | タイトルは「カード管理」、サブタイトル「カード詳細」。第 1 ボックスは基本情報（日本語名・英語名・アリーナ名日英・ルールテキスト日英・マナコスト・点数で見たマナコスト・パワー・タフネス・忠誠度・カラー複数・固有色複数・カードタイプ複数 select2・サブタイプ複数 select2・特殊タイプ複数 select2・色順ドロップダウン（ラベルは Twig 上で「色順」）・ステッカーフラグチェック・リーガリティ行リスト・旧商品 ID 2 項目は `hidden` 行内）。第 2 ボックス群は「詳細情報」としてカード詳細ごとに、画像グリッド（プレビュー・言語ラジオ・表面／裏面ラジオ・ファイル入力・URL hidden）、コレクター No、裏面カード詳細 ID、テキスト／フレーバー日英、パワー・タフネス、セット・レアリティ・レイアウト・イラスト・Foil／プロモチェック・プロモ種別、および「この詳細情報を削除」ボタン（商品に紐づく詳細は文言のみでボタン非表示）。フッタに「詳細情報を追加」。サイドバーに登録／更新ボタン、編集時のみ削除リンク、戻るボタン。 |
| JS 挙動 | `required.js` が required 指定や `.required` ラベルへ「※必須」相当のスパンを追記する。`card-detail.js` がリーガリティ行のプロトタイプ追加・行削除、詳細ブロックの追加・削除、画像ブロックの追加・削除、フォーマット select の重複時に `alert` と選択クリア、カードタイプ等の select2、画像ファイル選択時のローカルプレビュー（画像 MIME のみ）を行う。 |
| CSS・レイアウト | select2 の CDN CSS、管理画面 Bootstrap 横並びテーマ。 |
| モーダル・ポップアップ | 削除リンクはアンカーに `data-method="delete"` と確認文言 `admin.confirm.card_delete` を付与し、ブラウザ確認はフロント共通の配送実装に従う（本書では EC-CUBE 管理画面の DELETE＋CSRF パターンに委ねる）。リーガリティのフォーマット重複時は `alert` のみ。 |

---

## 処理フロー

### 新規フォームを表示する（GET `admin_card_new`）

1. 管理画面の認証・共通制約を通過する。
2. フォーム名 `admin_card` のビルダをデータ無しで生成し、`card_detail.twig` を描画する。`id` は Twig に `null`、`noDeletableCardDetailIds` は空配列。

### 編集フォームを表示する（GET `admin_card_edit`）

1. 管理画面の認証・共通制約を通過する。
2. パス ID が空、または `mtb_card` が取得できない場合、HTTP 404 で応答する。
3. フォーム `admin_card` を既存カードで生成する。
4. 当該カードについて、`mtb_card_detail` と商品規格が結びついている詳細 ID の一覧を取得し、`noDeletableCardDetailIds` として Twig に渡す。
5. `card_detail.twig` を描画する。

### 新規登録または更新を送信する（POST `admin_card_create` または POST `admin_card_update`）

1. 管理画面の認証・共通制約を通過する。
2. フォーム `admin_card` を空データで生成しコピーを取ったうえで、最初のフォームにリクエストを取り込む。
3. パスに ID が無い場合は新規のカードエンティティを用意する。パスに ID がある場合は当該 ID のカードを取得し、無ければ HTTP 403 で応答する。
4. 既存の場合は手順 2 と同様に `noDeletableCardDetailIds` を求める（新規は空配列）。
5. CSRF 検証と Symfony のフォーム検証を行い、無効なら同テンプレートへエラー付きで再描画する。
6. リクエストボディの `admin_card` とアップロードファイルの `admin_card[cardDetails][*][cardImages][*][upload]` を走査する。ファイルがある各行は一時ディレクトリへ保存し、オブジェクトストレージへ配置、返却パスを同じキー構造の `admin_card` 配列の `url` に書き込む。ファイルが無く `url` も空の画像行は送信データから当該画像エントリを取り除く。画像コレクションが空になった詳細キーは `cardImages` キーごと削除する。
7. 修正後の `admin_card` をリクエストに戻し、コピーしたフォームにもう一度 `handleRequest` する。
8. 親カードに対し、フォームデータをエンティティへ反映する。双方向関連のうちフォームに無い `productSubClasses`、`buyMainCards`、`deck`、`deckCards`、`maybeCards`、`archetype`、`productSubs` はこのマッピング対象から除外する。
9. 親を `persist` し `flush` し、続けて `commit` を呼ぶ。
10. 管理画面成功メッセージキー `admin.register.complete` を積む。
11. 支店連携サービスで、当該カード ID の配列を渡して更新通知を送る（成否はログとエラー永続化に記録される実装とする）。
12. `GET /{admin_route}/card/{永続化後のID}` へリダイレクトする。

### 単体削除を実行する（DELETE `admin_card_delete`）

1. 管理画面の認証・共通制約を通過する。
2. フォーム名を伴わない CSRF 検証（コアのトークン名）を行う。無効ならアクセス拒否例外となる。
3. セッションから `admin.card.search.page_no` を読み、のちのリダイレクト先のページ番号候補とする。
4. パス ID を配列の唯一要素とする（一括削除経路は別設計）。
5. 各 ID が空、またはカードが無い場合は HTTP 404 で応答する。
6. 次のいずれかなら削除しない。管理画面エラーメッセージ `admin.card.delete.failed` をカードの混成表示名で整形して積み、以前まで正常削除した ID があれば支店通知にその一覧を渡し、HTTP リファラ URL へリダイレクトする。
   - カードに `dtb_deck_card` が 1 件以上ある
   - ネイティブ照会で、論理未削除商品（`dtb_product.del_flg = 0`）が当該カードのカード詳細経由で 1 件以上ある
7. ブロックを抜けた場合、`mtb_card_detail` と `dtb_product_sub` の組に対し、当該カード配下の詳細に紐づく規格行の `card_detail_id` を一括で `NULL` に更新する。
8. 親カードに対し子エンティティを再帰的に `remove` したうえで親も `remove` し、`commit` する。
9. すべての指定 ID で成功したら成功メッセージキー `admin.delete.complete` を積み、支店連携に今回の ID 一覧を渡す。
10. `admin.card.search.page_no` があれば `GET /{admin_route}/card/search/{page_no}`、なければ `GET /{admin_route}/card` へリダイレクトする。

---

## 集計条件

本機能では一覧の件数集計やダッシュボード指標は行わない。

---

## 保存時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | CSRF（フォーム名 `admin_card` の入れ子トークン） | 無効ならアクセス拒否。 |
| 2 | Symfony フォーム検証（必須・長さ・正規表現・ファイル MIME／サイズ等） | 無効なら同一画面でエラー表示、保存しない。 |
| 3 | 画像各行のファイル有無と既存 URL | ファイル無しかつ URL 無しなら送信データから画像行を落とす。ファイルありならアップロード後に URL を埋める。 |
| 4 | コレクションに現れない子 ID | 永続化時に当該子孫を ORM から削除する経路に入る。 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M14-04-MSG-001 | 画面中央(モーダル) | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | You can not revert this action. Are you sure to delete %name%? | 登録済みカードの削除を選択したとき（削除前の確認） | 削除確認後に削除処理を実行する。キャンセル時はカード編集画面に留まる |
| M14-04-MSG-002 | 管理画面上部 | デッキまたは商品にカードが登録されているため、%card_name% カード情報を削除することができません。 | デッキまたは商品にカードが登録されているため、%card_name% カード情報を削除することができません。 | デッキまたは商品に登録されているカードを削除しようとしたとき | カード編集画面、またはカード検索・一覧画面に遷移する |
| M14-04-MSG-003 | 管理画面上部 | 削除に失敗しました | Failed to delete | カードを削除する際にエラーが起きたとき | カード編集画面、またはカード検索・一覧画面に遷移する |
| M14-04-MSG-004 | 管理画面上部 | 削除しました | Deleted | カードを削除したとき | カード検索・一覧画面に遷移する |
| M14-04-MSG-005 | 管理画面上部 | 削除に失敗しました | Failed to delete | カード情報の編集を保存する際、削除できないカード詳細を削除しようとしたとき | カード編集画面に留まる |
| M14-04-MSG-006 | 管理画面上部 | 保存しました | 保存しました | カード情報を保存したとき | カード編集画面に遷移する |
| M14-04-MSG-007 | 管理画面上部 | 保存に失敗しました | Failed to save | カード情報の保存中にエラーが起きたとき | カード編集画面に留まる |

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| カード ID | 新規は INSERT 時に採番。編集は hidden の ID で既存行を識別する。 |
| 点数で見たマナコスト | 半角数字と任意の小数点以下。正規表現で整数または小数形式にマッチさせ、必須。 |
| 忠誠度 | 任意。最大長に加え、パワー／タフネスに似た記号表現へマッチする正規表現制約がある。 |
| 旧商品 ID（日・英） | 任意。英数字・ハイフン・アンダースコアのみ許可。 |
| リーガリティ | 各ブロックでフォーマットと制限区分がともに必須（空プレースホルダ無しの制限側）。画面 JS で同一フォーマットの重複選択を拒む。 |
| 画像 | 言語・表面／裏面は必須。ファイルは最大 5MB、JPEG／GIF／PNG のみ（プラグイン `config.yml` の `HareruyaEc.const.cardImage.assert`）。 |
| 支店連携 | 保存成功時・削除成功時（および削除途中失敗時に既に消えた ID がある場合）は、対象カード ID の配列で通知処理を呼ぶ。失敗しても画面の成否フラッシュは保存／削除成功のままとなる実装である。 |

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| カード名(日) | 任意 | 255 文字（`HareruyaEc.const.card.length.name`） | 新規は空、編集は `mtb_card.name_jp` | `mtb_card.name_jp`。Symfony Length のみ。 |
| カード名(英) | 必須 | 同上 | 新規は空、編集は `mtb_card.name_en` | `mtb_card.name_en`。NotBlank＋Length。 |
| アリーナカード名(日) | 任意 | 同上 | DB 現行値または空 | `mtb_card.arena_format_name_jp`。 |
| アリーナカード名(英) | 任意 | 同上 | DB 現行値または空 | `mtb_card.arena_format_name_en`。 |
| ルールテキスト(日) | 任意 | 1024 文字（`HareruyaEc.const.card.length.text`） | DB 現行値または空 | `mtb_card.text_jp`。複数行 textarea。 |
| ルールテキスト(英) | 任意 | 同上 | DB 現行値または空 | `mtb_card.text_en`。 |
| マナ・コスト | 任意 | 64 文字（`HareruyaEc.const.card.length.manaCost`） | DB 現行値または空 | `mtb_card.mana_cost`。 |
| 点数で見たマナコスト | 必須 | テキスト入力だが桁は実データ依存（DB は float 系） | DB 現行値 | `mtb_card.cmc`。NotBlank＋数値形式の Regex。 |
| パワー（基本） | 任意 | 16 文字（`HareruyaEc.const.card.length.power`） | DB 現行値または空 | `mtb_card.power`。 |
| タフネス（基本） | 任意 | 16 文字（`HareruyaEc.const.card.length.toughness`） | DB 現行値または空 | `mtb_card.toughness`。 |
| 忠誠度 | 任意 | 16 文字（`HareruyaEc.const.card.length.loyalty`） | DB 現行値または空 | `mtb_card.loyalty`。Length＋記号形式 Regex。 |
| カラー | 任意 | — | チェック無し～複数 | `mtb_card` と色マスタの多対多。 |
| 固有色 | 任意 | — | 同上 | 同上。 |
| カードタイプ | 任意 | — | 同上 | `mtb_card` とカードタイプマスタの多対多。 |
| サブタイプ | 任意 | — | 同上 | サブタイプマスタ多対多。 |
| 特殊タイプ | 任意 | — | 同上 | 特殊タイプマスタ多対多。 |
| 色順 | 任意 | — | 未選択可 | `mtb_card.color_sequence_id`（色順マスタへの外部キー）。 |
| ステッカーフラグ | 任意 | — | オフ既定 | `mtb_card.is_sticker`。 |
| フォーマット（リーガリティ各行） | 必須（行を残す場合） | — | 編集は各行の現行値 | `dtb_card_format.format_id`。 |
| リーガリティ（制限区分、各行） | 必須（行を残す場合） | — | 編集は各行の現行値 | `dtb_card_format.restriction_id`。empty_value は無し。 |
| 現行の日本語商品ID／現行の英語商品ID | 任意 | 各 20 文字（`old_product_id`／`old_en_product_id`） | 非表示項目。DB 現行値 | `mtb_card` の該当列。英数字・`-`・`_` のみ Regex。 |
| コレクターNo | 任意 | 16 文字（`HareruyaEc.const.cardDetail.length.card_no`） | 詳細ごと | `mtb_card_detail` のカード番号列。 |
| 裏面カード詳細ID | 任意 | 最大 6 桁の数字のみ許容する Regex（空も可） | 詳細ごと | `mtb_card_detail` の裏面参照。integer ウィジェット。 |
| ルールテキスト(日)（詳細） | 任意 | 1024 文字（`cardDetail.length.text`） | 詳細ごと | `mtb_card_detail.text_jp`。 |
| ルールテキスト(英)（詳細） | 任意 | 同上 | 詳細ごと | `mtb_card_detail.text_en`。 |
| フレーバーテキスト(日) | 任意 | 1024 文字（`cardDetail.length.flavor`） | 詳細ごと | `mtb_card_detail.flavor_jp`。 |
| フレーバーテキスト(英) | 任意 | 同上 | 詳細ごと | `mtb_card_detail.flavor_en`。 |
| パワー（詳細） | 任意 | 16 文字 | 詳細ごと  | `mtb_card_detail.power`。 |
| タフネス（詳細） | 任意 | 16 文字 | 詳細ごと | `mtb_card_detail.toughness`。 |
| カードセット | 任意 | — | 詳細ごと | `mtb_card_detail.cardset_id`。 |
| レアリティ | 必須 | — | プレースホルダ「レアリティ選択」から選択 | `mtb_card_detail.rarity_id`。 |
| レイアウト | 必須 | — | プレースホルダ「レイアウト選択」 | `mtb_card_detail.card_layout_id`。 |
| イラストレーター | 任意 | — | プレースホルダ「イラストレーター選択」 | `mtb_card_detail.illustrator_id`。 |
| Foil | 任意 | — | チェック | `mtb_card_detail.foil_flg`。 |
| プロモ | 任意 | — | チェック | `mtb_card_detail.promotion_flg`。 |
| プロモ種別 | 必須 | — | プレースホルダ「プロモーション選択」 | `mtb_card_detail.promotion_id`。 |
| 言語（画像各行） | 必須 | — | 言語マスタのラジオ | `mtb_card_image.language_id`。 |
| 表面／裏面（画像各行） | 必須 | — | 定数 `HareruyaEc.const.cardImage.face` のラベル（表面／裏面） | `mtb_card_image.back_flg`（0＝表面、1＝裏面の論理値）。 |
| 画像ファイル（画像各行） | 任意 | 5MB、JPEG/GIF/PNG | 空 | アップロード時に一時保存後オブジェクトストレージへ送り、戻りパスを hidden の URL に格納。 |
| 画像 URL（hidden） | 条件付き | DB 定義上 128 文字（`mtb_card_image.url`） | 既存 URL またはアップロード後のパス | 新規画像でも少なくとも最終的に非空が必要なスキーマ。ファイルと既存 URL がともに無い行は送信直前にデータから除去される。 |

プラグイン `config.yml` の数値はデフォルトの確認値である。運用でプラグイン設定を上書きしている場合はその環境の値が正とする。

### エッジケース

| ケース | 扱い |
|--------|------|
| 編集 GET で ID が存在しない | HTTP 404。 |
| 更新 POST でパス ID のカードが無い | HTTP 403。 |
| 画像のみ追加しファイルを付けない | 送信データから当該画像エントリが落ち、検証・永続化対象外になり得る。 |
| DOM 上でリーガリティ行・詳細・画像ブロックを削除して送信 | そのブロックに対応するフィールドが POST に含まれないため、永続化時に既存子が削除扱いになり得る。 |
| カード詳細が商品規格に引用されている | Twig 上で「この詳細情報を削除」ボタンを出さず、説明文のみ表示。送信でコレクションから落ちた場合の扱いは ORM の削除経路に従う（利用者が開発者ツールで強制送信した場合の整合は運用外）。 |
| カード本体を削除しようとするがデッキ採用または未削除商品がある | 削除せずエラーメッセージし、リファラへ戻る。 |
| 支店通知が失敗 | 画面は登録／削除成功メッセージのまま。ログと支店更新エラー永続化に残す実装とする。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧と詳細 | 一覧は検索画面のクエリ時点、詳細は表示時点の DB 値。同時編集の排他は持たない。 |
| 削除直後の一覧 | リダイレクトで検索画面に戻るが、検索条件はセッションの前回状態に依存する（別設計）。 |
| 商品との外部キー | カード削除直前に、当該カードの全詳細にぶら下がる規格 `dtb_product_sub.card_detail_id` を `NULL` に更新する。これにより商品行は残り、カード詳細参照だけ外れる。 |

---

## API/バッチ結果

| 種類 | 内容 |
|------|------|
| API | 支店システム向け HTTP 通知が保存・削除のたびに走る。本文の主題は管理画面のため、API の契約詳細は別確認とする。 |
| バッチ | 本機能ではバッチを起動しない。 |

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | `multipart/form-data` のフォーム `admin_card`、および DELETE 時の CSRF トークン（コア規約）。 |
| 成功時出力 | 302 で編集 URL または一覧／検索 URL。フラッシュ成功メッセージ。 |
| 失敗時出力 | フォーム再表示（検証エラー）、HTTP 403／404、または削除ブロック時のエラーフラッシュ＋リファラ戻り。 |
| 副作用 | DB の INSERT／UPDATE／DELETE、オブジェクトストレージへのファイル PUT、支店通知、ログ出力。 |

---

## DBカラム

機能に直接関係する主な列のみ示す。型・索引の細部はDoctrineマッピングを参照する。

| テーブル | 列 | メモ |
|---------|-----|------|
| `mtb_card` | `id`, `name_jp`, `name_en`, `arena_format_name_jp`, `arena_format_name_en`, `text_jp`, `text_en`, `mana_cost`, `cmc`, `power`, `toughness`, `loyalty`, `old_product_id`, `old_en_product_id`, `is_sticker`, `color_sequence_id`, 他マスタ FK | カラー等は中間テーブル経由。 |
| `dtb_card_format` | `id`, `card_id`, `format_id`, `restriction_id` | リーガリティ行。 |
| `mtb_card_detail` | `id`, `card_id`, `card_no`, `text_jp`, `text_en`, `flavor_jp`, `flavor_en`, `power`, `toughness`, `cardset_id`, `rarity_id`, `card_layout_id`, `illustrator_id`, `promotion_id`, `foil_flg`, `promotion_flg`, 裏面参照列 等 | 画面は複数ブロック。 |
| `mtb_card_image` | `id`, `card_detail_id`, `language_id`, `back_flg`, `url` 等 | `url` は 128 文字定義。 |
| `dtb_product.card_detail_id`（現行は `dtb_product_sub.card_detail_id`） | `card_detail_id` | カード削除前に対象詳細向けに `NULL` 更新。移行先 ec-cube-enterprise では商品本体 `dtb_product` の列で、補助表 `dtb_product_sub` は存在しない。 |

### DB操作

永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_card_format / dtb_product / dtb_product_sub / mtb_card / mtb_card_detail / mtb_card_image | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

入力項目表および「保存時の判定順序」を正とする。ファイル制約は Symfony の File アサーションとプラグイン定数で宣言される。

---

## 権限・認可

| 利用者状態 | 詳細フォーム表示・POST・DELETE |
|------------|----------------------------------|
| 管理画面にログインし当ルートへ到達できる主体 | 画面を表示し送信・単体削除のリンクを実行できる（細かいロールはコアの管理画面認可に従う）。 |
| 未ログインまたは管理画面外の主体 | 管理画面共通の認証により当ルートへ到達しない。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 新規保存成功 | `GET /{admin_route}/card/{id}`（新採番 ID）。 |
| 更新成功 | 同じ `GET /{admin_route}/card/{id}`。 |
| 検証エラー | 同一 POST 経路の再描画（テンプレートは共通）。 |
| 戻るボタン | `GET /{admin_route}/card/search/{page_no}`（セッション既定 1）。 |
| 単体削除成功 | `GET /{admin_route}/card/search/{page_no}` または `GET /{admin_route}/card`（ページ番号セッションの有無）。 |
| GET 編集で ID 欠損 | HTTP 404。 |
| POST 更新で ID 不一致データ欠損 | HTTP 403。 |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|-------------------|
| 保存成功 | フラッシュに登録完了を積む | 編集画面で同カードの最新内容。新規の場合は ID が確定する。 |
| 単体削除成功 | フラッシュに削除完了を積む | 検索一覧または一覧初期。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| CSRF 不正 | アクセス拒否（HTTP）。 |
| フォーム検証エラー | 同一画面にフィールドエラーを表示。 |
| 更新対象カードが存在しない（POST） | HTTP 403。 |
| 編集表示対象が存在しない（GET） | HTTP 404。 |
| 削除対象が存在しない | HTTP 404。 |
| 削除ブロック | `admin.card.delete.failed` を混成名で整形してエラーフラッシュ、リファラへ。 |

---

## 試行制限

本機能では試行制限を扱わない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 支店連携成功／失敗 | アプリケーションログにカード ID 列と成否・失敗時 JSON メッセージを出力する実装とする。 |

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
| 戻るボタン | 参照のみ。`admin.card.search.page_no` を読み検索 URL を組み立てる。 |
| 単体削除後のリダイレクト | 同上キーがあればそのページ番号の検索へ、無ければ一覧初期ルートへ。 |

### セッションへ保存しない情報

フォーム本体の入力値をセッションに退避する処理は持たない（送信失敗時は同一レスポンスで再表示）。

---

## Cookie

本機能が独自に Cookie を読み書きしない。セッション Cookie は管理画面共通の仕組みに従う。

---

## 排他制御・トランザクション

本機能は編集画面単位の楽観ロックを持たない。送信処理の途中で `flush` および `commit` が呼ばれるが、アプリが明示トランザクション境界を管理している前提は別コード参照とする。

---

## 調査補助（grep 向け）

実装の所在をコード検索で辿るときの手がかりとして、次のパスを示す。本文の主説明は論理名とルート名を正とする。

- `app/Plugin/HareruyaEc/Controller/Admin/CardController.php`
- `app/Plugin/HareruyaEc/ServiceProvider/Admin/CardServiceProvider.php`
- `app/Plugin/HareruyaEc/Form/Type/Admin/Card/`
- `app/Plugin/HareruyaEc/Resource/template/admin/Card/card_detail.twig`
- `app/Plugin/HareruyaEc/Resource/template/admin/assets/js/card-detail.js`

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_card_new` … `GET` … `/{admin_route}/card/new`（新規用の空フォーム表示。）
- `admin_card_create` … `POST` … `/{admin_route}/card`（新規登録の送信処理。）
- `admin_card_edit` … `GET` … `/{admin_route}/card/{id}`（既存カードの編集フォーム表示。）
- `admin_card_update` … `POST` … `/{admin_route}/card/{id}`（既存カードの更新送信処理。）
- `admin_card_delete` … `DELETE` … `/{admin_route}/card/{id}`（単一カードの削除。）
