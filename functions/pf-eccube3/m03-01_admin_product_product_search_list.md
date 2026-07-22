# m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）

## 概要

管理画面の「商品管理」において、検索フォームで条件を組み立てて商品と規格を一覧し、ページ送り・ソート・表示件数・一覧表示モードを切り替えられる機能である。検索条件とページ番号の一部はセッションに保持し、ページ遷移後に同一条件で再検索する。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。ec-cube-enterprise のコア実装を確認値とする。プラグインによる Doctrine のクエリカスタマイザ登録、`ADMIN_PRODUCT_INDEX_*` イベントでのフォーム・クエリ改変がある環境では、その実装を正とする。

本機能のカスタマイズ区分は「カスタマイズ」であり、検索・ソート・ページングなどの挙動の参照は現行リポ（pf-eccube3）、DB関連（テーブル名・列名・保存先・扱い）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

本書の本文ではコントローラのメソッド名は主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

現行（pf-eccube3）と移行先（ec-cube-enterprise）で、検索が参照する永続化スキーマに次の差がある。挙動は現行を正とし、DB列名は移行先を正とする。

| 対象 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|----------------------|--------------------------------|
| 商品付加情報 | 付加情報を別テーブル `dtb_product_sub`（英語名・カード詳細参照・サイズ・重量など）に分離 | `dtb_product` 本体へ統合。`name_en`・`card_detail_id`・`cardset_id` などを商品本体が直接保持し、`dtb_product_sub` は存在しない |
| カード属性（カードセット・レアリティ・Foil・フレーム・プロモ） | カード詳細テーブル `dtb_card_detail` を参照 | カード詳細マスタ `mtb_card_detail` を参照（`cardset_id`・`rarity_id`・`foil_flg`・`promotion_flg`・`frame_flg`）。`dtb_product.card_detail_id` から参照 |
| 規格の言語・状態・部門・棚番号 | 規格テーブルの各参照 | `dtb_product_class` の `language_id`・`card_condition_id`・`section_id`・`shelf_number_id`・`delivery_duration_id` |
| 画像の並び順キー | `dtb_product_image.rank` | `dtb_product_image.sort_no` |

並び順キー（現行 `rank`／移行先 `sort_no`）の取り違えに注意する。上表に挙げない検索条件列（`price02`・`high_price_code`・`order_quantity_*`・`stock` など）は現行と移行先で同一スキーマである。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| ナビから商品一覧を開く | `GET /{admin_route}/product` | フォーム既定値で検索ビューデータをセッションへ書き込み、ページ 1 を表示する。 |
| 「検索する」で送信 | `POST /{admin_route}/product` | 検証に成功すれば条件をセッションへ保存しページ番号を 1 にし、同一条件で一覧を組み立てる。失敗すればエラー用メッセージとともに詳細検索枠を開いた状態で返す。 |
| ページネーションで N ページへ | `GET /{admin_route}/product/page/N` | セッションの検索条件とページ番号を更新し、N ページ目を表示する。 |
| ソートアイコン押下 | `POST /{admin_route}/product`（フォームはそのまま） | 隠しフィールド `sortkey`・`sorttype` を更新して送信し、ページ番号は 1 にリセットされる POST 分岐に入る。 |
| 表示件数プルダウン変更 | `GET /{admin_route}/product/page/1?page_count=…` | `mtb_page_max` に存在する件数ならセッションへ保存し、その件数で分割する。 |
| 一覧表示データプルダウン変更 | `GET /{admin_route}/product/page/{page_no}?mode=…` | セッションの表示モードを更新し、同一ページ番号で再描画する。 |
| 商品名リンク | `GET /{admin_route}/product/product/{id}/edit` | 商品編集画面へ遷移する。 |
| 他画面から一覧へ戻る | `GET /{admin_route}/product?resume=1` | セッションに保存されたページ番号を復元し、検索条件もセッションから復元する。 |
| ホームの在庫切れ件数から遷移 | `GET /{admin_route}/search_nonstock` → リダイレクトで `GET /{admin_route}/product/page/1` | 別節およびエッジケース参照。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | 見出しは商品一覧。上部は `search-box-inner` 内の検索フォーム。商品名（日／英）入力と詳細検索アコーディオン（Bootstrap の collapse、初期は開）。詳細内はカード名、ID、コード、カテゴリ、公開状態、エキスパンション、レアリティ、言語、状態、Foil、フレーム、プロモ、タグ、略称タグ、販売価格帯、在庫帯、期間別販売数の期間・数量帯、規格更新日帯、売上分析タグ、高額商品、部門、棚番号、エンティティ拡張の自動描画項目。隠し項目に一括キーワード（一覧では非表示）とソート用 2 項目。送信ボタンの下に件数見出し、`search_items.twig` による条件サマリ、結果テーブル（チェック、ID、名前、規格ごとのコード・言語・状態・価格など）、ページネーション。 |
| JS 挙動 | 複数選択フィールドに select2（カテゴリ、エキスパンション、タグ、略称タグ、売上分析タグ、部門、棚番号）。`function.js` の `.search-clear` で `#search_form` 内の入力・選択をクリア（CSRF 用 hidden は残す）。ソートは `.js-listSort` クリックで隠し `sortkey`・`sorttype` を更新してフォーム送信。件数・CSV・表示モードの select は変更時に URL へ遷移。一括削除は Ajax で各行の削除 URL を順に呼びモーダルで進捗表示（完了後リロード）。規格確認ボタンは Ajax でモーダル本文を差し替え。詳細検索の collapse 表示時はボタンのアイコンと `aria-expanded` を更新。 |
| CSS・レイアウト | `product.css` と select2 のスタイル。詳細検索の最低高さ調整用インラインスタイル。 |
| モーダル・ポップアップ | 規格一覧確認モーダル、一括完全削除モーダル。単体削除確認は本テンプレート範囲外の別導線に依存する場合がある。 |

---

## 処理フロー

### 一覧を開くか再計算する（`admin_product` / `admin_product_page` の共通）

1. 管理画面の認証・共通制約を通過する。
2. `SearchProductType` でフォームビルダーを生成し、`ADMIN_PRODUCT_INDEX_INITIALIZE` をディスパッチする。
3. 表示件数はリクエストの `page_count` が `mtb_page_max.name` のいずれかと一致すればその値をセッション `eccube.admin.product.search.page_count` に保存する。一致しない場合はセッション値があればそれを使い、なければ設定 `eccube_default_page_count`（確認値として app のパラメータで 10）を使う。
4. 一覧表示データモードはリクエストの `mode` が正の整数ならセッション `eccube.admin.product.search.display_mode` に保存する。無ければセッション値を使う。
5. POST でフォームが送られた場合は `handleRequest` する。妥当ならページ番号を 1 にし、`FormUtil::getViewData` で得た検索ビューデータをセッション `eccube.admin.product.search` に保存し、`eccube.admin.product.search.page_no` に 1 を保存する。不妥当ならエラーフラグ付きで Twig を返し、一覧は空相当の扱いになる。
6. GET の場合、パスに `page_no` があるか `resume` クエリがあるときはセッションからページ番号と検索ビューデータを読み、`FormUtil::submitAndGetData` で正規化した配列を検索データとする。それ以外の GET はページ 1 とし、空ではない既定の検索ビューデータをフォームから取り出してセッションへ書き直す（初期表示では「公開状態」は公開のみが既定チェックされる）。
7. `ProductRepository::getQueryBuilderBySearchDataForAdmin` に検索データを渡し、`ADMIN_PRODUCT_INDEX_SEARCH` でクエリビルダを公開する。
8. ページネーションはコントローラ側で、`sortkey` が列マップに無い・または値が `status`・または値が文字列 `code` のいずれかなら通常モード、それ以外なら `wrap-queries` を付ける。列マップに無い値がリポジトリまで渡った場合は `orderBy` で未定義添字参照となり先に失敗する。
9. Twig にフォーム、ページネーション、件数、表示モード、拡張 CSV の一覧を渡して描画する。

### ホームからの在庫切れリンク（`admin_homepage_nonstock`）

1. セッション `eccube.admin.product.search` に、`stock` キーへ在庫なしを表す定数の配列を載せた連想配列だけを保存する。
2. `admin_product_page` で `page_no` が 1 となるようリダイレクトする。

---

## 集計条件

| 指標 | 集計の要点 |
|------|------------|
| 一覧総件数 | Knp ページネータがクエリに対して件数を数える。一覧本体と同じクエリビルダを渡す。 |
| 画面に出す規格行 | 商品ごとに、`Language` と `CardCondition` が両方存在する規格だけを抽出して行を並べる。該当が無い商品は空セルを colspan で埋める。 |

---

## ソート時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | `sortkey` が空または未定義 | `p.update_date` 降順、その後 `p.id` 降順のみ。 |
| 2 | `sortkey` が列マップに存在し、`sorttype` が文字 `a` | 指定列昇順、その後 `p.update_date` 降順、`p.id` 降順。 |
| 3 | `sortkey` が列マップに存在し、`sorttype` が `a` 以外 | 指定列降順、その後 `p.update_date` 降順、`p.id` 降順。 |

列マップは実装上、商品 ID、商品名、規格コード、規格の在庫数量相当、公開状態、商品登録日、商品更新日に対応するクエリ式となる。

クライアント側では、同一 `sortkey` を連続クリックすると昇順・降順がトグルする。

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 |
|--------------|----------|--------------|----------|
| M03-01-MSG-001 | 管理画面上部 | パスワードを更新しました | パスワード変更フォームが送信済みかつ有効なとき（$form->isSubmitted() && $form->isValid()） |
| M03-01-MSG-002 | 画面中央(ダイアログ) | Failed | 規格データ取得Ajax（GET btnClass.data('class-load')）が fail したとき |
| M03-01-MSG-003 | 画面中央(モーダル) | 削除中... | #bulkDelete 押下直後（チェック済み行への削除Ajax開始時にモーダル本文を差し替える） |
| M03-01-MSG-004 | 画面中央(モーダル) | 商品の削除処理が完了しました | 一括削除の全DELETE Ajaxが完了したとき（$.when(...).always、成功・失敗を問わない） |

## 業務ルール・計算

一覧の抽出はリポジトリへ渡した検索データに対し、設定済みの条件だけを AND で付与する。文字列の部分一致では `%` と `_` をエスケープする。

カテゴリは選択ノードとその子孫をまとめ、商品カテゴリがそのいずれかに該当する商品だけを残す。

言語はチェックが 3 種すべて選択されている場合はフィルタを付けない。それ以外では日本語 ID・英語 ID・その他言語 ID の組み合わせにより、`pc.Language` に対する IN／NOT IN を OR で繋ぐ場合がある。

プロモはチェックが 1 種類だけのときだけ `cd.promotion_flg` で絞る。2 種類同時は絞らない。

高額商品もチェックが 1 種類だけのときだけ、`pc.high_price_code` が NULL か否かで絞る。既定フォームデータでは通常価格のみが選択されている。

期間別販売数は、`order_date` が許容リストに含まれる値のときだけ、`pc.order_quantity_{列番号}` に下限・上限を付けられる。フォームが用意する列番号は昨日から 365 日前まで（当日列はリストに無い）。

規格更新日「終了」は、その日の終わりを含めるため翌日 0 時未満として解釈する。

クエリの末尾で `QueryKey::PRODUCT_SEARCH_ADMIN` に登録されたカスタマイザがあれば、追加の結合・条件が入る。

本機能では集計関数による売上計算などは行わない。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 商品名（日／英） | 任意 | フォーム上は桁制約なし（`messages` のプレースホルダのみ） | 空 | `dtb_product.name` に対する部分一致。セッションキー `product_name`。 |
| カード名（日／英） | 任意 | 同上 | 空 | 関連カードの日本語名に対する存在サブクエリでの部分一致。キー `card_name`。 |
| ID | 任意 | 実装上は 10 桁数字のみがフィルタ対象（それ以外の入力は無視） | 空 | 文字列として商品 ID の一部一致。キー `product_id`。 |
| コード | 任意 | フォーム上は桁制約なし | 空 | `dtb_product_class.code` の部分一致。キー `product_code`。 |
| カテゴリ | 任意 | — | プレースホルダ「すべての商品」相当（未選択） | 複数選択。選択済みエンティティと子孙カテゴリで IN。キー `category_id`。 |
| 公開状態 | 任意 | — | 公開のみ選択済み | 複数チェック。廃止ステータスはクエリから除外される選択肢。キー `status`。 |
| エキスパンション | 任意 | — | 無選択 | 複数 SELECT。発売日降順でマスタを読む。キー `cardset`。 |
| レアリティ | 任意 | — | 無選択 | 複数チェック。キー `rarity`。 |
| 言語 | 任意 | — | 無選択 | 日本語／英語／その他言語のチェック。キー `language`。 |
| 状態 | 任意 | — | NM のみ選択済み | NM／SP／MP／HP／その他。キー `card_condition`。 |
| Foil | 任意 | — | 無選択 | 非 Foil／ノーマル／特殊。キー `foil`。 |
| フレーム | 任意 | — | 無選択 | 通常／特殊。キー `frame`。 |
| プロモ | 任意 | — | 無選択 | プロモ／ノーマルの二択チェック（既定オプション）。キー `promotion`。 |
| タグ | 任意 | — | 無選択 | 複数 SELECT。タグごとの EXISTS。キー `tag_id`。 |
| 略称タグ | 任意 | — | 無選択 | 複数 SELECT。`dtb_product` の略称タグ ID。キー `storage_code_id`。 |
| 販売価格（開始） | 任意 | 桁は設定 `eccube_price_len`（確認値 8）に合わせた Symfony Length | 空 | `price02` の下限。フォームキー `sell_price_from`。 |
| 販売価格（終了） | 任意 | 同上 | 空 | `price02` の上限。`sell_price_to`。 |
| 基準価格（開始） | 任意 | 同上 | 空 | フォームおよびセッションには載るが、`getQueryBuilderBySearchDataForAdmin` 本体では参照しない（確認値）。キー `standard_price_from`。 |
| 基準価格（終了） | 任意 | 同上 | 空 | 同上。`standard_price_to`。 |
| 買取価格（開始） | 任意 | 同上 | 空 | 同上。`buy_price_from`。 |
| 買取価格（終了） | 任意 | 同上 | 空 | 同上。`buy_price_to`。 |
| 在庫（開始） | 任意 | HTML の `maxlength` は `eccube_int_len`（確認値 9）、最小 0 | 空 | `dtb_product_stock.stock` の下限。`stock_from`。 |
| 在庫（終了） | 任意 | 同上 | 空 | 同上の上限。`stock_to`。 |
| 期間別販売数 販売期間 | 任意 | — | 未指定プレースホルダ | ラジオ。昨日〜365 日前までの列番号。`order_date`。 |
| 期間別販売数 販売数（開始） | 任意 | `eccube_int_len` に合わせた maxlength | 空 | `order_quantity_*` 下限。`order_quantity_from`。 |
| 期間別販売数 販売数（終了） | 任意 | 同上 | 空 | 上限。`order_quantity_to`。 |
| 規格更新日（開始） | 任意 | `yyyy-MM-dd` の単一行日付 | 空 | `pc.update_date` の下限。Symfony の下限レンジ `1900-01-01`。`update_date_from`。 |
| 規格更新日（終了） | 任意 | 同上 | 空 | 終日 inclusive。終了が開始より前ならフォームエラー。`update_date_to`。 |
| 売上分析タグ | 任意 | — | 無選択 | 複数 SELECT。中間テーブル経由で IN。`tag_sales_analysis`。 |
| 高額商品 | 任意 | — | 「高額商品を除外する」のみ | いずれか一方だけチェックされたときだけ high_price_code で絞る。`expensive`。 |
| 部門 | 任意 | — | 無選択 | 複数 SELECT。`section`。 |
| 棚番号 | 任意 | — | 無選択 | 複数 SELECT。`shelf_number`。 |
| 商品名（日／英）・カード名（日／英）・商品 ID・商品コード | 任意 | フォーム上は桁制約なし | 空（一覧 Twig では非表示） | ID が数値のみのときは ID 完全一致、それ以外は商品名（日・英）、規格コード、カード名（日・英）への OR 部分一致。キー `id`。 |
| 一覧ソート列 | 任意 | — | 空 | 隠し入力 `sortkey`。 |
| 一覧ソート向き | 任意 | — | 空 | 隠し入力 `sorttype`。値 `a` 以外は降順扱い。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| POST 検証エラー | `has_errors` が真となり、「検索条件に誤りがあります」系のメッセージブロックを表示。一覧テーブルは出さない。 |
| 検索結果 0 件 | 「検索結果がありません」メッセージを表示。 |
| 言語・プロモ・高額を複数同時に選ぶ | 言語は 3 種すべてなら条件無し。プロモ・高額は 2 チェック同時なら条件無し。 |
| `sortkey` が列マップ外 | リポジトリが `orderBy` する時点で未定義添字参照となり、実行時エラーになり得る（不正な隠しフィールド送付）。 |
| ホームの `search_nonstock` のみをセッションに載せて一覧へ入る | コントローラは CSV 用に用意しているマージ処理を経由せず `submitAndGetData` するため、フォームに無いキーだけが残ると Symfony のフォームがエラーになり得る。またリポジトリ本体には `stock` 配列による絞り込みが無く、テストクラスと実装が乖離している（確認値としてギャップを記録）。 |
| 一覧テンプレートの在庫・期間別数量セル | 一部が固定文字列のプレースホルダのまま残っており、検索結果データと一致しない表示になり得る。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧と CSV | CSV 出力側はセッションと既定フォーム値をマージしてから `submitAndGetData` するため、一覧画面よりセッションの未知キーを引きずりやすい。 |
| 一覧と編集画面 | 一覧は読み取りクエリのみ。編集画面で値が変わっても一覧は再読込まで古い値を表示し得る。 |
| クエリカスタマイザ | 登録がある環境では一覧 SQL が本体説明と異なる場合がある。 |

---

## API/バッチ結果

本機能では外部 HTTP API の呼び出しやバッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | HTTP クエリ（`page_no`、`page_count`、`mode`、`resume`）、POST 検索フォーム、セッションに保持された検索状態。 |
| 成功時出力 | HTML 一覧。検索条件サマリのリスト。 |
| 失敗時出力 | フォームエラー時はエラーメッセージと入力値を保持したフォーム。 |
| 副作用 | セッションキー `eccube.admin.product.search`、`eccube.admin.product.search.page_no`、`eccube.admin.product.search.page_count`、`eccube.admin.product.search.display_mode` の更新。一覧検索前後イベントのディスパッチ。 |

---

## DBカラム

当機能のクエリが主に参照する論理列は次のとおり（物理列名はスキーマを参照）。

| テーブル | 列 | メモ |
|---------|-----|------|
| dtb_product | id, name, name_en, product_status_id, update_date, create_date, storage_code_id, card_detail_id, cardset_id | 名称・状態・略称タグ・カード詳細参照（移行先は商品本体へ統合） |
| dtb_product_class | code, price02, update_date, order_quantity_*, high_price_code, language_id, card_condition_id, section_id, shelf_number_id | 規格単位の条件・並び |
| dtb_product_stock | stock | 在庫帯 |
| mtb_card_detail（現行 dtb_card_detail） | cardset_id, rarity_id, foil_flg, frame_flg, promotion_flg | カード属性。移行先はカード詳細マスタ |
| dtb_product_category | category_id | カテゴリ |
| dtb_product_tag | tag_id（現行 tag） | タグ EXISTS |
| mtb_card（カードマスタ） | name_jp, name_en | カード名検索 |

### DB操作

本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | dtb_card_detail / dtb_product / dtb_product_category / dtb_product_class / dtb_product_stock / dtb_product_tag 等 | 検索条件に合致するレコードを抽出する。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| 金額系（販売・基準・買取の開始／終了） | Symfony の桁上限（設定 `eccube_price_len`）。 |
| 整数系（在庫・販売数） | 整数型フィールド。HTML で最小 0 と maxlength。 |
| 規格更新日 | 終了が開始より前ならエラー（共通文言）。各日付は 1900-01-01 以降のレンジ。 |
| その他テキスト | 追加の Symfony Length は無い（確認値）。 |

---

## 権限・認可

| 利用者状態 | 商品一覧・検索 POST・ページ GET |
|------------|----------------------------------|
| 管理画面にログインしルートへ到達できる運用者 | 利用できる。細かいロール単位の可否はセキュリティ設定と権限マスタの実装を正とする。 |
| 未ログインまたは拒否された主体 | 管理画面共通の挙動により利用できない。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 商品名リンク | 商品編集 |
| プレビューアイコン（実装によりフロント詳細） | 別タブでフロント商品詳細 |
| CSV・一括編集・一括ステータスなどフォーム `formaction` | 各 POST 先ルート |
| ページネーション | 同一一覧の別ページ |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 編集などから `resume=1` で戻る | セッションの検索ビューデータとページ番号は一覧側が上書きしない限り保持 | 保存されていたページ番号と条件で一覧を組み立てる |
| 初回 `GET /product`（`resume` も `page_no` も無い） | フォーム既定の検索ビューデータでセッションを上書き | 公開のみ等の既定チェックが載った状態になる |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| POST 検証失敗 | 同一画面でエラーメッセージを表示し、一覧は出さない。 |
| ソート用隠し項目の改ざん | 列マップ外キーは実行時例外になり得る。 |
| 一括削除の一部失敗 | モーダル内にエラー行を列挙し、完了後に手動リロード。 |

---

## 試行制限

本機能では試行制限を扱わない。

---

## ログ・監査

一覧表示だけでは専用の監査ログ出力は行わない。デバッグ用途のログは別機能・設定に依存する。

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
| 検索ビューデータ | キー `eccube.admin.product.search`。POST 成功時と初期 GET で更新。ページ GET と resume で読む。 |
| ページ番号 | キー `eccube.admin.product.search.page_no`。 |
| 表示件数 | キー `eccube.admin.product.search.page_count`。 |
| 一覧表示データモード | キー `eccube.admin.product.search.display_mode`。 |

### セッションへ保存しない情報

パスワードやクレジットカード番号など、検索フォームが本来保持しない値は保存しない。

---

## Cookie

本機能はセッション Cookie 以外の独自 Cookie を設けない（セッションの詳細は管理画面ログインの設計を正とする）。

---

## 排他制御・トランザクション

一覧表示は読み取り主体であり、本機能単体では楽観ロックや明示トランザクション境界を持たない。

---

## 調査補助（ソース位置の索引）

grep や IDE 検索のためのパスのみを示す。ふるまいの正は実装本文とする。

- `src/Eccube/Controller/Admin/Product/ProductController.php`（ルート `admin_product` / `admin_product_page`）
- `src/Eccube/Form/Type/Admin/SearchProductType.php`
- `src/Eccube/Repository/ProductRepository.php` の `getQueryBuilderBySearchDataForAdmin`
- `src/Eccube/Resource/template/admin/Product/index.twig`
- `html/template/admin/assets/js/function.js`（`.search-clear`、`.js-listSort`）
- `src/Eccube/Controller/Admin/AdminController.php` の `search_nonstock` 相当アクション

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_product` … `GET, POST` … `/{admin_route}/product`（一覧の初期表示、検索フォーム送信後の 1 ページ目相当の処理、一覧ヘッダからソートするときの POST 送信先、他画面から `resume` 付きで戻るときの起点。）
- `admin_product_page` … `GET, POST` … `/{admin_route}/product/page/{page_no}`（ページ送り、表示件数変更、一覧表示データモード変更など GET で状態を変えたあとの再表示。）
- `admin_homepage_nonstock` … `GET` … `/{admin_route}/search_nonstock`（ダッシュボード等からの導線として、商品一覧向けセッションへ事前条件を書き込んだうえで `admin_product_page` の 1 ページ目へリダイレクトする（詳細は処理フローとエッジケース参照）。）
