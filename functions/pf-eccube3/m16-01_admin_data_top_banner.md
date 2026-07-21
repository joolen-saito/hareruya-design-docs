# データ管理 — トップバナー管理（バナー設定）

## 概要

HareruyaEc プラグインが管理画面「データ管理」配下に提供する、フロントのスライドバナー（トップ回転バナー）用マスタ `mtb_top_banner` の編集と、バナー画像ファイルのオブジェクトストレージ（実装では `banner/` プレフィックス配下）への格納・一覧・削除を一体の画面で扱う機能である。イベントバナー管理と同一テンプレートを共用し、トップバナー時は「表示店舗」列を出さないなど表示が切り替わる。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。カスタマイズ区分は「現行踏襲」。画面・挙動は pf-eccube3 上の HareruyaEc プラグインのソースを確認値とし、DB関連（テーブル・列・型・制約・関連）は ec-cube-enterprise の実装を正とする。EC-CUBE 3 コア単体では当ルートは存在しないが、移行先 ec-cube-enterprise にはコアの同等機能（管理画面「データ」配下のトップバナー管理）が存在する。

対象はブラウザ経由の管理画面に限定する。本文ではルート名とテーブル・列・設定キーなど実装照合に必要な識別子をそのまま書く。コントローラの手続き名の列挙は主題としない。

---

## リニューアル移行時の扱い

- DB関連は移行先 ec-cube-enterprise を正とする。`mtb_top_banner` は両リポに存在するが、列に差がある。移行先の `mtb_top_banner` 列は `id` / `image_url` / `link` / `disp_type` / `image_alt` / `sort_no`。現行 pf-eccube3 の同テーブルには `sort_no` 列が無く、並び順は別の手段で扱う。並び順を扱う場合の列は移行先の `sort_no` を正とする。
- 言語の対応は両リポとも多対多の結合表 `dtb_top_banner_language`（`top_banner_id` / `language_id`）で表す。
- 店舗絞り込みのモデルが異なる。現行はプラグインの店舗マスタ `mtb_shop` と `html_class` で絞り込むが、移行先は店舗（拠点）情報 `dtb_base_info` と `shop_digit` で絞り込む。移行時はこのマスタ・キー対応を移行設計で吸収する。
- 画像ファイルはオブジェクトストレージ（`banner/` プレフィックス）に格納し、DB管理しない点は両リポで同等。
- 画面・挙動は現行（pf-eccube3）の確認値。現行はプラグイン提供、移行先はコア提供である。

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| ナビからトップバナー管理を開く | `GET /{admin_route}/banner/top` | 全バナー枠のフォームと、`banner/` の画像一覧（更新日降順・最大2000件）が表示される。 |
| 店舗ドロップダウンで店舗を選ぶ | `GET /{admin_route}/banner/top/{html_class}#upload_wrap` | 画像一覧が `banner/{html_class}/` に限定され、「全て」へ戻るリンクが出る。 |
| 各枠の「バナー設定」ボタン | `POST /{admin_route}/banner/top` または `POST /{admin_route}/banner/top/{html_class}` | 送信前にクライアントで並び順の空欄・重複を検査する。成功時は `mtb_top_banner` が更新され、同一一覧 URL へリダイレクトする。 |
| 「▼画像設定」またはページ内アンカー | 同一 GET の `#upload_wrap` | アップロード・一覧エリアへスクロールする。 |
| 画像を選び「アップロード」 | 上記 POST（`multipart/form-data`、ファイル欄あり） | 検証に通ればオブジェクトストレージへ保存され、`#upload_wrap` 付きでリダイレクトする。 |
| 一覧の「削除」リンク | `DELETE /{admin_route}/banner/top/delete?select_file=…` または narrow 側の同等 | 確認メッセージ後、指定キーのファイルが存在すれば削除し、`#upload_wrap` 付きでリダイレクトする。 |
| 店舗絞り込み時の削除。`select_file` に加えパスに `{html_class}` が含まれる。 | `DELETE /{admin_route}/banner/top/delete/{html_class}` | 店舗絞り込み時の削除。`select_file` に加えパスに `{html_class}` が含まれる。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | ブロックタイトルは「データ管理」。サブタイトルは「トップバナー管理」。上部に案内文「画像とリンク先を入力・変更してください」「空欄にすると表示から削除されます」と「バナー設定」ボタン（上下2箇所）。各 `mtb_top_banner.id` ごとに表を分割し、プレビュー画像、画像URL、リンク先URL、言語（チェック）、表示タイプ、画像alt属性、並び順を載せる。下部は店舗ドロップダウン（一覧の絞り込み）、画像ファイル入力と「アップロード」、表形式のサムネ・更新日・画像URLコピー・削除。 |
| JS 挙動 | `eccube.setModeAndSubmitBanner` が `hareruyaec_banner` を送信する前に、`hareruyaec_banner_sort_no_*` の空欄と数値の重複を `alert` で拒否する。`copy.js` の `copyString` で画像 URL をクリップボードへコピーする操作がある。 |
| CSS・レイアウト | `.bannerInput input { width: 95%; }` のみ追加。Bootstrap 横型レイアウトはバナー設定フォームに適用。 |
| モーダル・ポップアップ | 専用モーダルはない。並び順エラーと削除確認は `alert` および `data-message` による確認に依存する。 |

---

## 処理フロー

### 画面を表示する（GET `m16-01_admin_data_top_banner` または `m16-01_admin_data_top_banner_narrow`）

1. 管理画面の認証・共通制約を通過する。
2. `mtb_top_banner` を `id` 昇順で全件取得する。
3. バナー設定用フォーム `hareruyaec_banner` を、上記リストをデータとして生成する。
4. 画像用フォーム（名前 `form`）にファイル入力・店舗エンティティ選択を載せる。パスに `{html_class}` がある場合は該当店舗を既定選択とし、店舗選択は必須フラグが立つ。
5. オブジェクトストレージから、`html_class` 無しなら `banner/`、有りなら `banner/{html_class}/` 配下のオブジェクト一覧を取得し、更新日時の降順で並べ、先頭2000件に切り詰める。
6. テンプレートを描画する。

### バナー設定を保存する（POST、`request->files` に `form` が無い場合）

1. CSRF をバナー設定フォーム名で検証する。 `hareruyaec_banner` の取り込みと検証を行う。
2. 検証失敗時、`banner/` 直下の一覧だけを再取得した状態で（narrow 時も直下のみの実装）、同一テンプレートをエラー表示付きで返す。メッセージは `admin.error.text_over` に、設定 `HareruyaEc.const.banner.length`（255）を埋め込んで表示する。
3. 検証成功時、各枠の `sort_no_{id}` の値を昇順に並べ、その順でフォームのフィールド束を `1..N` の連番キーに割り当てる。
4. 各 `mtb_top_banner` 行について、連番キーが行の `id` と一致する束から画像URL・リンク・表示タイプ・言語ID群・画像altを読み取り、エンティティへセットする。言語は `hareruya_ec.repository.language` の `findById` 結果でアソシエーションを置き換える。リンクはフォームが null のとき空文字にする。
5. 全行を永続化し、フラッシュを使わずリダイレクトする（narrow 時は `{html_class}` 付き URL）。

### 画像をアップロードする（POST、`request->files` に `form` がある場合）

1. 画像フォームの CSRF・検証を行う。
2. ファイル未選択ならエラーメッセージ `admin.error.select_no_file` を表示するための状態で画面を返す。
3. ファイルサイズが 520000 バイト超なら `admin.error.size_over`（メッセージに数値を埋め込む）。
4. `exif_imagetype` が 1〜3（実装上 GIF／JPEG／PNG に相当）以外なら `admin.error.not_image`。
5. 成功時、店舗が選ばれていなければキー接頭辞 `banner/`、選ばれていれば `banner/{店舗の html_class}/` に拡張子付きで格納する。リダイレクトは `#upload_wrap` 付き。アップロード成功時も `mtb_top_banner` は更新しない。

### ストレージ上の画像を削除する（DELETE）

1. リクエスト全体に対する CSRF 検証（フォーム名なしの共通トークン）を行う。
2. パラメータ `select_file` をサーバー側エンコーディングに合わせて変換したキーが、ストレージに存在すれば削除する。
3. `m16-01_admin_data_top_banner` または `m16-01_admin_data_top_banner_narrow` に `#upload_wrap` を付けてリダイレクトする。

---

## 集計条件

| 指標 | 集計の要点 |
|------|------------|
| 管理画面の画像一覧 | プレフィックス配下のオブジェクトを更新日降順で並べ、先頭2000件のみ表示する。 |
| スライド用バナー件数 | フロントでは最大10件。`image_url` が空文字でない行に限り、表示タイプが「表示」（整数値 1）、かつ現在ロケールに対応する言語マスタ ID（日本語 or 英語）が紐づく行を対象とする。 |

---

## 保存処理における並び順と ID の対応（実装確認値）

| 順序 | 処理 | 結果 |
|------|------|------|
| 1 | 送信された各 `sort_no_{id}` を数値キーとして昇順に並べ、対応するフォームフィールド名の束を取り出す。 | 並び順の若い束から順に、連番 `1..N` をキーとして配列化する。 |
| 2 | `mtb_top_banner` の各行を走査し、行の主キー `id` をキーとして、手順1の連番配列からフィールド束を参照する。 | キー `id` の行には、連番配列の第 `id` 要素のフォーム値が書き込まれる。 |

初期表示では Twig が `sort_no_{id}` の value に `list.id` を渡すため、`id` と並び順の順位が一致し、画面上の行と保存内容が対応する。利用者が並び順だけを入れ替え、各 `id` 行の入力欄は触らない場合でも、手順2のキー付けのため、別 `id` 行に用意した入力値が当該行に保存される動きになり得る。重複並び順はクライアントで遮断するが、サーバー側では重複を検出しない。

---

## 業務ルール・計算

本機能では金額計算や件数集計の業務ロジックは持たない。マスタ行の属性更新とファイル入出力が中心である。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 画像URL | 任意 | 255文字（Symfony `Length`）。さらに `admin.hareruyamtg.com` を含む文字列は禁止（`Regex`、`match=false`）。 | DB の `image_url` | `mtb_top_banner.image_url`。空文字も保存されうる。フロント抽出では空文字は除外。 |
| リンク先URL | 任意 | 255文字（`Length`）。文字種 `Regex` あり（パターンは実装参照。アンカーなしの部分一致マッチ）。 | DB の `link` | `mtb_top_banner.link`。フォームが null のとき保存時に空文字に正規化。 |
| 言語 | 任意 | — | 既存の `dtb_top_banner_language` に応じ日本語・英語のチェック | 多対多 `dtb_top_banner_language`。フォームは複数選択・展開チェック。選択 ID は言語マスタから再取得してセット。 |
| 表示タイプ | 任意（空選択なし） | — | 既存の `disp_type` | `mtb_top_banner.disp_type`。選択肢は「非表示」(0)、「表示」(1)。 |
| 画像alt属性 | 任意 | フォーム上は上限なし。DB は `text` | 既存の `image_alt` | `mtb_top_banner.image_alt`（NULL 可）。 |
| 並び順 | 実質必須（空・重複はクライアント拒否） | 整数入力 | Twig 既定で当該行の `id` | 保存時の束の並べ替えキーとしてのみ使い、`mtb_top_banner` 列としては永続化されない。 |

バナー枠は `mtb_top_banner` の行単位で表が繰り返す。上表の各項目はいずれも各枠に同一ラベルで出る。フォームキーは行の `id` を `_{id}` で接尾する。

### エッジケース

| ケース | 扱い |
|--------|------|
| 画像URLを空にする | 保存される。スライド抽出では `image_url <> ''` 条件により一覧に出ない。 |
| 管理画面の「削除」は DB 行ではなくストレージのオブジェクト | `mtb_top_banner.image_url` は自動では消えない。参照切れの URL が残り得る。 |
| バナー枠の行数 | マイグレーションで不足分を空行として増やす処理があるが、当画面から行を増減する操作はない。 |
| アップロードとマスタ更新 | アップロード成功だけでは URL が行に反映されない。利用者が画像 URL 欄へ手入力する。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 管理画面プレビュー | 表の `img src` は各行の入力値（旧 URL）を表示する。ストレージの最新状態と必ずしも一致しない。 |
| フロント再表示 | スライド取得は画面描画のたびに DB とロケールで再解決する。キャッシュは本書では扱わない。 |
| 並行編集 | 楽観ロックはない。後に `flush` した更新で上書きされる。 |
| narrow 時の設定保存エラー表示 | 再描画でファイル一覧を `banner/` 直下だけ読む分岐があり、絞り込み表示と一覧内容が一時的に食い違う場合がある。 |

---

## API/バッチ結果

本機能では API 呼び出し・バッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | GET: パス `{html_class}` の有無。POST: バナー設定フォームまたはマルチパートのファイル・店舗選択。DELETE: `select_file`。 |
| 成功時出力 | HTML 画面、または 302 リダイレクト（同一機能内の GET）。 |
| 失敗時出力 | 同一テンプレート再表示に `error` または `bannerError` を渡す。バリデーション失敗時はフォームにエラーが付く。 |
| 副作用 | `mtb_top_banner` と `dtb_top_banner_language` の更新。オブジェクトストレージへの PUT／DELETE。CSRF トークン更新。 |

---

## DBカラム

| テーブル | 列 | メモ |
|----------|-----|------|
| `mtb_top_banner` | `id` | 主キー。 |
| `mtb_top_banner` | `image_url` | 文字列255、非 NULL。 |
| `mtb_top_banner` | `link` | 文字列255、非 NULL。 |
| `mtb_top_banner` | `disp_type` | 整数、既定0。 |
| `mtb_top_banner` | `image_alt` | text、NULL 可。 |
| `dtb_top_banner_language` | `top_banner_id`, `language_id` | 多対多。 |

### DB操作

永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_top_banner_language / mtb_top_banner | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| 画像URL | 最大255。`admin.hareruyamtg.com` を含むと失敗（メッセージキー `admin.banner.regex_error`）。 |
| リンク先URL | 最大255。実装の `Regex` 制約に従う。 |
| 画像アップロード | 必須ファイル、520000 バイト以下、`exif_imagetype` が 1〜3。 |
| バナー設定全体 | 上記に加え、いずれかの項目が制約違反の場合、まとめて `admin.error.text_over` 相当の文面を `bannerError` で出す実装がある。 |

---

## 権限・認可

| 利用者状態 | トップバナー管理の各エンドポイント |
|------------|--------------------------------------|
| 管理画面にログインし当ルートへ到達できる者 | 画面表示・POST・DELETE を実行できる（管理画面ファイアウォールの設定を正とする）。 |
| 未到達の者 | 管理画面共通のルールにより拒否される。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| バナー設定保存成功 | `GET /{admin_route}/banner/top` または `GET /{admin_route}/banner/top/{html_class}` |
| アップロード成功 | 上記に `#upload_wrap` |
| ファイル削除成功 | 同上 |
| 店舗ドロップダウンで別店舗選択 | `GET /{admin_route}/banner/top/{html_class}#upload_wrap` |
| 「全て」選択（narrow 時） | `GET /{admin_route}/banner/top#upload_wrap` |

### 遷移時に引き継ぐ状態

フラッシュメッセージや検索条件セッションは当機能では用いない。リダイレクト先は URL とハッシュのみで決まる。

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| CSRF 不正 | アクセス拒否（HTTP 403）を投げる実装である。 |
| バナー設定フォーム検証失敗 | 同一画面で `bannerError` または項目エラーを表示。 |
| 画像アップロードの各種不正 | 同一画面で `error.message` を表示。 |
| ストレージにファイルが無い削除 | 削除処理をスキップし、リダイレクトのみ。 |

---

## 表示メッセージ

（ec-cube-enterprise 実装基準。旧 PF 実装ではフラッシュを用いないが、EE 実装では以下のフラッシュ／フォームエラーが表示される）

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 |
|--------------|----------|--------------|----------|
| M16-01-MSG-001 | 管理画面上部フラッシュ | アップロードしました | アップロードフォームが送信・妥当で handleUpload が正常終了したとき（`#upload_wrap` 付きで303リダイレクト） |
| M16-01-MSG-002 | 店舗選択項目直下（フォームエラー） | 選択した店舗ではアップロードできません。 | アップロード時、編集権限のない店舗を選択し `admin.data.top_banner.upload_not_allowed` 例外となったとき（同一画面を再表示） |
| M16-01-MSG-003 | ファイル項目直下（フォームエラー） | アップロードに失敗しました | アップロードが `admin.` 以外の RuntimeException で失敗したとき（同一画面を再表示） |
| M16-01-MSG-004 | 管理画面上部フラッシュ | 保存しました | バナー設定フォームが送信・妥当で storeTopBanners が null を返したとき（303リダイレクト） |
| M16-01-MSG-005 | 管理画面上部フラッシュ | 削除しました | DELETE が CSRF 検証を通過し TopBannerDeleteAction が正常終了したとき（`#upload_wrap` 付きで303リダイレクト） |
| M16-01-MSG-006 | 管理画面上部フラッシュ | 要ソース確認 | 削除で `admin.` 始まりの RuntimeException を捕捉し `$e->getMessage()` をそのまま addError するため単一文言に確定不能（可変）。直接送出候補は `admin.common.error_invalid_request`＝「不正なリクエストです。」／`admin.common.delete_error`＝「削除に失敗しました」（リダイレクト） |
| M16-01-MSG-007 | 管理画面上部フラッシュ | 削除に失敗しました | 削除で捕捉した RuntimeException の message が `admin.` 始まりでないとき（リダイレクト） |
| M16-01-MSG-008 | 店舗選択項目直下（フォームエラー） | 要ソース確認 | base_info が空で送信されたとき（NotBlank 制約違反。通常UIでは発生しにくい）。キー `enterprise.form.type.member.tenant_not_selected` は validators.ja.yaml 未定義で messages.ja.yaml にのみ存在し、constraint 違反は validators ドメイン解決のため実表示文言は要実機確認 |
| M16-01-MSG-009 | ファイル項目直下（フォームエラー） | 画像ファイルを選択してください。 | file 未選択のまま送信されたとき（NotBlank 制約違反。JS事前チェックを通らない直接POST等・同一画面を再表示） |
| M16-01-MSG-010 | ファイル項目直下の `#top-banner-upload-error`（JS） | 画像ファイルを選択してください。 | file 入力が空のままアップロードフォームを submit したとき（クライアントJSが送信を中断） |
| M16-01-MSG-011 | ファイル項目直下（フォームエラー） | ファイルがGIF・JPG・PNGではありません。 | GIF/JPG/PNG 以外の MIME タイプのファイルを選択して送信したとき（File 制約違反・同一画面を再表示） |
| M16-01-MSG-012 | ファイル項目直下（フォームエラー） | ファイルサイズは{{ limit }}以下にしてください。 | ファイルサイズが 520000 バイト超で送信したとき（Callback 制約違反・`{{ limit }}`=520KB・同一画面を再表示） |
| M16-01-MSG-013 | 画像URL項目直下（フォームエラー） | 「admin.hareruyamtg.com」は指定できません。 | 画像URLに `admin.hareruyamtg.com` を含む値を入力して送信したとき（Regex 制約違反・同一画面を再表示） |
| M16-01-MSG-014 | 並び順項目直下（フォームエラー） | 並び順が空の項目があります。 | 並び順が空の項目があるまま送信したとき（POST_SUBMIT リスナーが FormError 追加・同一画面を再表示） |
| M16-01-MSG-015 | 並び順項目直下（フォームエラー） | 並び順が重複しています。 | 並び順の値が重複したまま送信したとき（POST_SUBMIT リスナーが重複全項目へ FormError 追加・同一画面を再表示） |
| M16-01-MSG-016 | 確認ダイアログ（window.confirm） | 一度削除したデータは元に戻せません。削除してもよろしいですか？ | 削除リンククリック時（`data-message`。OKで `_token`/`_method=delete` を持つ隠しフォームを生成し POST 送信、キャンセルで中断） |
| M16-01-MSG-017 | バナー設定フォーム上部（text-danger errormsg） | 要ソース確認 | 設定フォームが妥当だが storeTopBanners 内で RuntimeException が送出されたとき（`bannerError.message` を trans して同一画面に表示）。例外由来の可変文言で、TopBannerStoreAction/TopBannerEntityManager 経路に RuntimeException の送出箇所は未特定 |

---

## 試行制限

本機能では試行制限を扱わない。

---

## ログ・監査

当専用コントローラ内では業務ログ出力を行わない実装である。インフラやフレームワーク既定のログは環境に依存する。

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値

---

## セッション

本機能では一覧状態やフォーム値をセッションに保持しない。

### セッションへ保存しない情報

バナー編集内容のドラフトやアップロード進捗はセッションに載せない。

---

## Cookie

本機能が独自に Cookie を設定・解釈することはない。セッション Cookie は管理画面共通の仕組みに従う。

---

## 排他制御・トランザクション

Doctrine の `flush` はバナー設定保存の末尾で一度呼ばれる。明示的な楽観・悲観ロックやアプリ側の長トランザクションは当機能にない。

---

## 調査補助（grep 向け）

実装の起点はプラグイン内 `BannerServiceProvider`（ルート定義）、管理画面用 `BannerController`、フォーム型 `hareruyaec_banner`、テンプレート `Resource/template/admin/Banner/banner.twig`、フロント取得 `SlideBannerController` および `MtbTopBannerRepository::findWhereUrlIsNotEmpty`。

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m16-01_admin_data_top_banner` … `GET` … `/{admin_route}/banner/top`（トップバナー設定画面の表示。全店舗向け画像一覧（`banner/` ルート）を既定とする。）
- `m16-01_admin_data_top_banner_narrow` … `GET` … `/{admin_route}/banner/top/{html_class}`（同一画面を、`{html_class}` に対応する店舗のサブフォルダ（`banner/{html_class}/`）に限定して一覧・操作する。）
- `m16-01_admin_data_top_banner_update` … `POST` … `/{admin_route}/banner/top`（バナー設定フォームの送信、または画像アップロードフォームの送信（リクエスト内容により分岐）。）
- `m16-01_admin_data_top_banner_update_narrow` … `POST` … `/{admin_route}/banner/top/{html_class}`（上記と同様。URL 側の `{html_class}` はリダイレクト先の維持に使われる。）
- `m16-01_admin_data_top_banner_delete` … `DELETE` … `/{admin_route}/banner/top/delete`（オブジェクトストレージ上のファイル削除。クエリに `select_file`（キー相当の文字列）が付く。）
- `m16-01_admin_data_top_banner_delete_narrow` … `DELETE` … `/{admin_route}/banner/top/delete/{html_class}`（店舗絞り込み時の削除。`select_file` に加えパスに `{html_class}` が含まれる。）
