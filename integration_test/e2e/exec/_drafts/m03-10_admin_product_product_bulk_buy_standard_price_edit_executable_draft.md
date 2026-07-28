# W候補: m03-10 買取・基準価格一括編集 — 実行可能グレード候補（母集合88全量踏破・excel-primary）

> 2026-07-29 ／ **候補グレード（candidate・D6前）・excel-primary（区分=カスタマイズ）**／
> **Gate自己監査体制（`integration_test/CONCRETIZATION_GATES.md`）に基づく初版**。
> 本機能は**更新系一括編集**。M03-02（商品編集）と異なり、**項目間相関バリデーション（買取価格(NM)＞基準価格(NM)）**と
> **DB相関バリデーション（規格ID実在＝to_show_complete／mtb_buy_price_list整合＝not_found_nm_price）**を実在で持つ点が最大の相違。
> これにより母集合の「相関バリデーション」4行（-012〜-015）・「DBとの相関バリデーション」2行（-016/-017）は
> **excludedにせずboundにできる**（m03-02では相関ルール不存在のためexcludedだった＝機能ごとに独立判定）。
>
> **Gate B自己監査済み（B1-B15）— 実施要旨**:
> - **B1（bound充足検証）**: 母集合88行の期待テキストに「〜になり得る/可能性/場合がある」を全数grep＝**0件**。pf md本文にも同語0件（定言的記述）。
>   観測不能・計装未契約の必須成分を含む行（外部通知等）は本機能には無い（本機能は外部API/バッチを扱わない＝md:159-161）。
> - **B7（機能種別非該当観点はexcluded）**: 本機能は**検索機能を持たない**（ids[]で選択商品を受けて編集表を開くのみ・画面項目一覧に検索入力欄皆無＝0204:6260-6275）。
>   よって「検索条件」14行（-019〜-032）はEX-A excluded。本機能は**レコード削除を行わない**（md:191「不要な削除は含まない」）。
>   よって「削除条件/削除状態になる」3行（-065,-066,-068）はEX-D excluded。
> - **B8（観点是正・被覆維持）**: 母集合の観点ラベルは巡回生成でノイズ（例-007観点「確認ダイアログ」・期待は「メニューはproductとproduct_edit」＝表示要素）。
>   判定は期待テキスト実内容のみ（§0）。ラベル誤りで被覆のある行はexcludedにせず観点是正（末尾`## 観点補正`表）。
> - **B9（画面優先・DB副次）**: 更新内容は編集表を再表示し保存値（買取価格(NM)・基準価格(NM)＝いずれもNM規格の値で決定的に再表示される）を目視が主。
>   価格履歴INSERT（dtb_price_history・画面非表示）・全通常規格へのWHERE波及・件数不変等の物理事実のみ自動検証(内部・DB)。
> - **B14（未認証は共通認証委譲）**: -002は観点「未認証」・md:207-210で認証は管理画面共通のみ（機能固有アノテーション無し）。モジュール代表M03-01でカバー＝excluded。
>   期待テキストが誤って「編集表が開く」を載せているが当挙動は-003/-040/-078/-079でbound済＝偽陰性なし。
> - **B15（TBD/excluded判定）**: TBDは実在挙動だが期待値を現行オラクルで固定不能な行に限定（本機能=5件・-011,-048,-064,-076,-085）。
>   汎用スタブでも当機能固有の具体referent（価格履歴追加・買取/基準価格(NM)再表示・編集表集約）があればboundし、referentが無い/非該当/矛盾/冗長のみexcluded。
> - **【改訂1: codex Gate C 5 Major是正】pf md陳腐化のee実確認（-011,-048,-085 → TBD）**: pf md:102-103,110-113（基準価格を「同一商品・同一言語・通常規格のすべての行に**同一値**で書き込む・状態別に分けない」／SP/MP/HP「POST値は読み取り専用・保存計算に使わない」）は**ee実装と食い違う**。
>   ee `updateBuyPriceForAllConditions`（`ProductClassRepository.php`）の`UPDATE`は`standard_price = CASE WHEN pc1.id=NM THEN :standardPriceNm WHEN SP THEN :standardPriceSp …`と**規格ごとに個別値**を書き込み（`standard_price_sp ?? standardPriceNm`＝`ProductBulkUpdateBuyPriceStoreAction.php:79`でSP/MP/HPを個別受信）、フォームでもSP/MP/HPは`readonly`だが**NM×割引率で算出された値を各条件へ保存**する（`BulkUpdateProductPriceDetailType.php:48-52`）。pf md陳腐化規約に従い-011（POST値読み取り専用＝保存に使わない）・-048/-085（対象規格すべて同一値）は**要実機TBD**（eeをオラクルにしない）。**基準価格(NM)自体の入力→保存→再表示反映はNM規格のstandard_price＝Excel識別ID10確定・画面決定的でbound継続**（-049等・C-020）。
> - **pf md陳腐化のee実確認（-064）**: pf md:199は「買取 vs 販売（NM）→`admin.product_class.buyprice_valid_bulk`」を記すが、ee `messages.{ja,en}.yaml`（9dbc4dd）に当キー**不在**（grep0件）・Excelエラー制御（0204:6251）も**買取vs販売未記載**＝**要実機TBD**（買取>基準＝MSG-002はee実在・-012/-015でbound）。
> - **-076（楽観ロック無し・後勝ち）→ TBD**: 物理事実（ロック不在の証明）は単純な順次2回保存では証明できず（楽観ロックがあっても通る）、更新前に2画面を開き古い状態で後送信する競合手順＝**要実機**。画面帰結（保存成功）はC-003等で被覆。
> - **-073（成功・エラー・警告メッセージ）→ excluded（EX-R 汎用スタブ）**: 副作用・ログ表の節見出し要約（md:260）で単一の具体挙動を持たない。成功フラッシュ=C-003・エラーフラッシュ=C-002/C-010で個別bound済み・警告メッセージは特定referent無し＝冗長スタブ（B12強制共有は異挙動のため不可）。
> - **【改訂1: seed一意成功性の是正（Major2/3）】**: `SEED-M0310-PRODUCTS`に`mtb_buy_price_list{nm_price=1000→price=1000}`を内包し買取減額率なし＋非Foil/非プロモとした（`StoreAction.php:97`の`買取1〜10000&減額率なし&mtb該当なし→例外`を回避し正常系を一意成功化・買取1000でbuy_price=1000が決定的）。`SEED-M0310-HIGHPRICE`は**高額品規格のみ（通常規格を持たない）商品**とし、選択しても編集表に行が出ないことでhigh_price_code IS NULLフィルタを一意判定可能にした（C-015）。
>
> **母集合88全数会計＝bound 60／TBD 5／excluded 23（=88・欠番0）**（改訂2でMajor是正）。
> 会計: bound 60／TBD 5／excluded 23（=88・欠番0）
>
> **実装/実走なし。O5未確定。O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_GATES.md`。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m03-10_admin_product_product_bulk_buy_standard_price_edit_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下には書かない**。**著者はレビューしない**（codexが別途レビュー）。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**:
  `excel_to_html/output/0204_基本設計仕様書(商品管理).html`（commit **0e65e6a60e13ff4f5175af1a450c1b61a0b5b14b**）。
  M03-10は**sheet-23「買取・基準価格一括編集」**（HTML行 **6162-6335** 付近）: 機能No=M03-10（0204:6173）・機能名「買取・基準価格一括編集」（0204:6174）・
  概要「商品検索一覧にて選択した商品の価格を一括で変更することが可能」（0204:6175）・作成者「城下」/更新者「堀部」（0204:6169,6171）。
  シート構成: カスタマイズ説明（0204:6212-6252・機能統合/表示/在庫集計/編集項目/エラー制御）／画面項目一覧 識別ID1〜16（0204:6260-6275）／
  図形テキスト17件（0204:座標参照のみ）。**後半（0204:6288以降）は pf現行mdの埋込複製**（`Source: functions/pf-eccube3/m03-10_...md`＝0204:6287）
  のため、当該範囲は引用元をpf mdの行で表記し二重ソース化しない。以下「0204:行」（HTML行番号）。
  買取・基準価格一括編集ボタンの新規設置は付帯シート「商品マスター(検索結果)」識別ID9（0204:1612）に記載。
- **pf現行md（回帰先・source_class=pf-fallback）**:
  `functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md`（repo HEAD観測・branch feat/front-e2e-coverage・2026-07-29観測。以下「md:行」）。
  区分宣言「本機能のカスタマイズ区分はカスタマイズである。画面・処理の挙動は現行リポ（pf-eccube3）の実装を参照し、DB関連…は ec-cube-enterprise を正とする。」（md:9）。
- 共有インフラ（メッセージ実文言の逐語引用のみ許可）: ee `/home/y-saito/Developments/ec-cube-enterprise` コミット
  `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51` の `src/Eccube/Resource/locale/messages.{ja,en}.yaml`。
  キー同定はpf md記載のメッセージ表のja文言との完全一致検索のみ（ee実装コードは鍵特定にも期待値にも不使用）。
- 母集合: `integration_test/all_it_cases.tsv` M03-10全**88行**（IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-001〜088。以下「-nnn」）。
  欠番0・重複0（`awk`で-001..-088全件一意存在を確認済み）。
- **判定原則（W0教訓・m03-01/02/11踏襲）**: 観点ラベル・前提条件ラベルはノイズ。bindは各行の**「期待結果」実テキスト**で判定する。
  本機能の母集合も「各節見出しラベル×固定の観点/期待テンプレート」の直積で自動生成されており（例-001の観点は「CSRF」だが期待は
  「dtb_product_class.buy_price に統合（実在確認済み）であること。」＝CSRFと無関係）、期待テキスト実内容のみを充足判定に用いる。
- **B1事前スイープ（TBDトリガー語0件）**: `grep -n "得る\|可能性\|なり得\|場合がある\|要ソース確認"` を母集合88行に実行。
  「得る/可能性/なり得/場合がある」該当0件。「要ソース確認」＝**2件（-070,-071）**だが、いずれも実挙動がpf mdに実在
  （-070初期行数＝集約1行が商品ID×言語グループ＝md:82／-071表示順＝商品ID降順・言語昇順＝md:89）ため
  **プレースホルダ期待の背後の実挙動をboundし観点是正**（TBDにしない・§10観点補正）。

## §1 L1原子オラクル表

全40claim。**source_class列は excel／pf-fallback のみ（standard-src該当なし・design該当なし）**。en文言はen一次資料（messages.en.yaml）逐語のみ。

| oracle_id | claim_type | claim | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0310-001 | excel_delta | 機能統合: 現行の「価格一括編集」「買取価格一括編集」の各機能を統合し、商品検索一覧で選択した商品の価格を一括変更可能にする。買取・基準価格一括編集ボタンを商品マスター(検索結果)に新規設置し当画面へ遷移する | 「商品検索一覧にて選択した商品の価格を一括で変更することが可能」「★現行の「価格一括編集」「買取価格一括編集」の各機能を統合する」／item「9 \| 買取・基準価格一括編集 \| ボタン \| … \| ※カスタマイズ対応、ボタンを新規設置、買取・基準価格一括編集に遷移する」 | 0204:6175,6229,6231／0204:1612 | excel | 0 |
| L1-M0310-002 | excel_delta | 表示: 商品規格登録編集で表示ステータスが「無効」と設定された規格の在庫数と基準価格を非表示にする。ただし商品規格(NM)が「無効」でもこの画面では非表示とせず入力欄を表示する（NMは入力欄必須・割引率の算定基準価格となるため） | 「★無効となっている規格は表示されない」「商品規格登録編集にて、表示ステータスが「無効」と設定された規格の在庫数と基準価格を非表示にする」「ただし、商品規格(NM)が「無効」と設定されていても、この画面では非表示とせず、入力欄を表示する。」「※NMは入力欄が必須となるため。割引率の算定基準価格となる。」 | 0204:6217-6220,6234-6236 | excel | 0 |
| L1-M0310-003 | excel_delta | 在庫表示: 各言語・各規格に対する在庫数をテキストで出力し編集不可。「無効」に設定された規格の在庫数は非表示 | 「★各言語、各規格に対する在庫数を表示。テキストで出力。編集不可。「無効」に設定された規格の在庫数は非表示。」 | 0204:6238 | excel | 0 |
| L1-M0310-004 | excel_delta | 価格比率: 識別ID13「価格比率(買取÷販売)」を設置。JavaScriptで「買取価格(NM)」÷「基準価格(NM)」を計算表示。小数第3位を四捨五入。同額は「1」。どちらか空欄なら価格比率も空欄。買取(NM)＞基準(NM)でもエラーにはせず登録時サーバー側でチェックしエラーを返す | 「★入力された「買取価格(NM)」と「基準価格(NM)」の比率を出力。→ 識別ID:13「価格比率(買取÷販売)」を設置」「小数第3位を四捨五入で出力。」「買取価格(NM) と 基準価格(NM) が同額の場合は「1」」「「買取価格(NM)」「基準価格(NM)」のどちらかが空欄の場合は、「価格比率」を空欄にする。」「買取価格(NM) ＞ 基準価格(NM) が設定されても、エラーにはしない。※登録時にサーバー側でチェックを実施、エラーを返す」 | 0204:6239-6244 | excel | 0 |
| L1-M0310-005 | excel_delta | 在庫集計区分: 店舗マスターに「TC東京(通販＋TC東京スマレジ)、支店、バックヤード」の3つを仕分ける区分を追加し、その区分によって在庫数を集計する。識別ID1「表示在庫切替え」で切り替える | 「★店舗マスターに「TC東京(通販＋TC東京スマレジ)、支店、バックヤード」の3つを仕分ける区分を追加し、その区分によって集計する」／item「1 \| 表示在庫切替え \| 単一選択 \| … \| 選択肢は、TC東京(通販＋TC東京スマレジ)、支店、バックヤード」 | 0204:6222,6260 | excel | 0 |
| L1-M0310-006 | excel_delta | 編集項目: 「買取価格(NM)」「基準価格(NM)」は編集可能・数値のみ入力可能とする。現行の「販売価格一括編集」「買取価格一括編集」の実装を移植する | 「★「買取価格(NM)」「基準価格(NM)」は編集可能、数値のみ入力可能とする。」「現行の「販売価格一括編集」「買取価格一括編集」の実装を移植する。」 | 0204:6248,6249 | excel | 0 |
| L1-M0310-007 | excel_delta | エラー制御: 登録ボタン押下のサーバー側処理で全商品に対し買取価格(NM)＞基準価格(NM)チェックを実施。1件でも該当する場合はすべての登録/更新処理を破棄して画面にエラーメッセージを出力する | 「★「登録ボタン」押下のサーバー側処理にて、全商品に対する 買取価格(NM) ＞ 基準価格(NM) チェックを実施」「1件でも該当する場合は、すべての登録/更新処理を破棄して、画面にエラーメッセージを出力する。」 | 0204:6251,6252 | excel | 0 |
| L1-M0310-008 | excel_meta | 画面項目一覧(識別ID1〜16): 必須列は識別ID5「買取価格(NM)」・識別ID10「基準価格(NM)」が「◯」（最大値9999999999・数値・10ずつ加減）、他項目は必須「-」。識別ID15「商品検索に戻る」（商品マスター検索結果へ遷移）・識別ID16「登録」ボタン（買取・基準価格の登録/更新を実行） | 「5 \| 買取価格(NM) \| 数値 \| ◯ \| 9999999999 \| - \| 数値のみ入力可能、上下の矢印押下で10ずつ加算、減算する」「10 \| 基準価格(NM) \| 数値 \| ◯ \| 9999999999 \| - \| …」「15 \| 商品検索に戻る \| テキストリンク \| … \| 商品マスター(検索結果)に遷移」「16 \| 登録 \| ボタン \| … \| 買取・基準価格の登録/更新を実行」 | 0204:6260-6275 | excel | 0 |
| L1-M0310-010 | nav | 入口: 編集画面表示 POST/GET `/{admin_route}/product/edit_bulk_update_buy_price`（ボディまたはクエリの `ids[]` で選択商品を指定）→ 選択商品について編集表が開く。複数IDは `ids[]` を繰り返す | 「商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押す \| `POST /{admin_route}/product/edit_bulk_update_buy_price`（ボディに `ids[]`）\| 選択商品について編集表が開く。」「編集画面をブックマーク相当で開く \| `GET …/edit_bulk_update_buy_price?ids[]=…` \| 同上。複数 ID は `ids[]` を繰り返す。」 | md:36-37 | pf-fallback | 0 |
| L1-M0310-011 | nav | 入口: `ids` を付けずに編集URLへ入ると、キー `eccube.admin.error` で `admin.product.not_select` をフラッシュし、セッション `eccube.admin.product.search.page_no`（無ければ1）を使って `GET /{admin_route}/product/page/{page_no}` へリダイレクトする | 「`ids` を付けずに編集 URL へ入る \| `GET …/edit_bulk_update_buy_price`（`ids` 空）\| エラーフラッシュのうえ、セッションの `eccube.admin.product.search.page_no` を使って `GET /{admin_route}/product/page/{page_no}` へリダイレクトする。」「空ならキー `eccube.admin.error` で `admin.product.not_select` をフラッシュし、`eccube.admin.product.search.page_no`（無ければ 1）へ `admin_product_page` へリダイレクトする。」 | md:38,62 | pf-fallback | 0 |
| L1-M0310-012 | nav | 入口: 確定 `POST /{admin_route}/product/bulk_update_buy_price`。検証成功時は更新後、セッションのページ番号と `resume=1` 付きで一覧へリダイレクトする。失敗時は同一編集テンプレートを返す（200） | 「「登録」で確定 \| `POST /{admin_route}/product/bulk_update_buy_price` \| 検証成功時は更新後、セッションのページ番号と `resume=1` 付きで一覧へリダイレクトする。失敗時は同一編集テンプレートを返す。」 | md:39,70 | pf-fallback | 0 |
| L1-M0310-013 | nav | 入口: 「商品一覧」リンク `GET /{admin_route}/product/page/{page_no}`。セッションの `eccube.admin.product.search.page_no`（無ければ1）へ遷移。保存はしない | 「「商品一覧」リンク \| `GET /{admin_route}/product/page/{page_no}` \| セッションの `eccube.admin.product.search.page_no`（無ければ 1）へ遷移。保存はしない。」 | md:40 | pf-fallback | 0 |
| L1-M0310-014 | display_field | 表示要素: メニューは `product` と `product_edit`。表は商品ID・商品名・言語・買取価格(NM)・在庫数(NM〜HP)・価格比率、2行構成で第2行は基準価格(NM〜HP)。公開ステータスが廃止(ID3)の列は在庫セルを描画しない。規格IDが0の状態列は在庫を0表記し基準価格は「-」 | 「メニューは `product` と `product_edit`。…表は商品 ID、商品名、言語、買取価格(NM)、在庫数（NM〜HP）、価格比率（買取-基準の注記付き）、2 行構成で第 2 行は基準価格 (NM〜HP)。公開ステータスが廃止（ID 3）の列は在庫セルを描画しない。規格 ID が 0 の状態列は在庫を 0 表記し、基準価格は `-`。」 | md:48 | pf-fallback | 0 |
| L1-M0310-015 | behavior | JS挙動: `.js-buy-price` と `.js-base-price`（NM基準価格）の入力で価格比率を再計算。初期表示時もNM買取各行に対して一度計算する | 「`.js-buy-price` と `.js-base-price`（NM 基準価格）の入力で価格比率を再計算。初期表示時も NM 買取各行に対して一度計算する。」 | md:49 | pf-fallback | 0 |
| L1-M0310-016 | display_field | CSS・レイアウト: 管理画面共通フレーム。表は縦スクロール上限約70vh・表頭はsticky。モーダル・ポップアップなし。カードヘッダ内の「表示切替」に見えるselectはnameを持たず送信もサーバー処理も伴わない | 「管理画面共通フレーム。表は縦スクロール上限約 70vh、表頭は sticky。」「モーダル・ポップアップ \| なし。」「カードヘッダ内の「表示切替」に見える select は `name` を持たず、送信もサーバー処理も伴わない。」 | md:50-53 | pf-fallback | 0 |
| L1-M0310-017 | behavior | 集約クエリ: 編集表1行は「商品ID×言語」のグループに対応。`dtb_product_class` を商品・言語で結合し `high_price_code` がNULLの通常規格に限定。条件ID1〜4を横持ちで条件付き集約。NM販売価格は条件1の `price02` を `sell_price_nm` として1つ取る（検証専用）。並びは商品ID降順・言語昇順 | 「編集表 1 行は「商品 ID × 言語」のグループに対応する。」「対象規格 \| `dtb_product_class` を商品・言語で結合し、`high_price_code` が NULL のものに限定する。」「NM の販売価格 \| 条件 1 の `price02` を `sell_price_nm` として 1 つ取る（検証専用）。」「並び \| 商品 ID 降順、言語昇順。」 | md:82-89 | pf-fallback | 0 |
| L1-M0310-018 | behavior | 確定処理: `product_class_id_nm` が空(0含む)の行はスキップ。当該NM規格IDの行がDBに無ければ例外 `admin.product.to_show_complete`。買取減額率が無く入力買取が0以外10000以下で `mtb_buy_price_list` に入力買取をnm_priceとする行が無ければ例外 `admin.product.not_found_nm_price`。価格履歴の一括INSERT後、通常規格すべてへ買取・基準価格を更新するネイティブUPDATEを実行し1商品行ごとにコミット。全行成功で成功フラッシュ `admin.register.complete` を積み `admin_product_page` へ `?resume=1` でリダイレクト | 「`product_class_id_nm` が空（0 含む）の行はスキップする。」「当該 NM 規格 ID の行が DB に無ければ例外メッセージ `admin.product.to_show_complete` を投げ…」「…`mtb_buy_price_list` に入力買取を `nm_price` とする行が無ければ例外 `admin.product.not_found_nm_price`。」「価格履歴の一括 INSERT（販売価格の新旧は NULL）の後、通常規格すべてへ買取・基準価格を更新するネイティブ UPDATE を実行する。1 商品行ごとにトランザクションをコミットする。」「全行で成功したら成功フラッシュ `admin.register.complete` を積み、`admin_product_page` へ `?resume=1` でリダイレクトする。」 | md:71-76 | pf-fallback | 0 |
| L1-M0310-019 | rule | 保存時の買取価格の決め方: nmPriceが0は高額用率計算側で状態別に0近傍へ丸め。1以上かつMAX_NM_PRICE(10000)以下で買取減額率が無い場合、`mtb_buy_price_list` をNM価格・状態・Foil/プロモ相当のspecial_flgで参照し見つかればそのprice、無ければnmPriceを各規格のbuy_priceにセット。それ以外(高額帯or減額率あり)は率配列で切り上げ演算し買取減額率マスタ優先で決める | 「入力された NM 買取（`nmPrice`）が 0 の場合、分岐上は「高額用の率計算」側に進み…」「`nmPrice` が 1 以上かつ `MtbBuyPriceList::MAX_NM_PRICE`（10000）以下で、商品に買取減額率が無い場合、UPDATE は `mtb_buy_price_list` を NM 価格・状態・Foil/プロモ相当の `special_flg` で参照し、見つかればその `price`、見つからなければ `nmPrice` を各規格の `buy_price` にセットする SQL パスを使う。」「それ以外（高額帯、または買取減額率あり）は…率配列で `nmPrice` から切り上げ演算し `buy_price` を決める。率は商品の買取減額率マスタが優先し、無ければ定数既定値を使う。」 | md:97-99 | pf-fallback | 0 |
| L1-M0310-020 | rule | 基準価格: 入力された `standard_price_nm` を、同一商品・同一言語・通常規格のすべての行の `standard_price` に同じ値で書き込む。状態別に基準価格を分けた更新にはならない（**ee陳腐化の照合結果と影響行は§9.1/§10.5へ隔離**） | 「入力された `standard_price_nm` を、同一商品・同一言語・通常規格のすべての行の `standard_price` に同じ値で書き込む。状態別に基準価格を分けた更新にはならない。」 | md:102-103 | pf-fallback | 0 |
| L1-M0310-021 | validation | 買取価格(NM): 必須(整数型)・ウィジェット属性step10・max9999999999・フォーム型Symfony IntegerType。保存時は業務ルールで全通常規格の `dtb_product_class.buy_price` を再計算・更新。キー `bulk_update_product_price[product_classes][n][buy_price_nm]` | 「買取価格(NM) \| 必須（整数型）\| …`step` 10、`max` 9999999999。フォーム型は Symfony `IntegerType`。 \| 集約クエリの NM 買取 \| 保存時は上記ルールで全通常規格の `dtb_product_class.buy_price` を再計算・更新。キーは `bulk_update_product_price[product_classes][n][buy_price_nm]`。」 | md:109 | pf-fallback | 0 |
| L1-M0310-022 | validation | 基準価格(NM): 任意(整数型)・min0・step10・上限9999999999。`dtb_product_class.standard_price` を対象規格すべて同一値で更新。キー `…[standard_price_nm]` | 「基準価格 (NM) \| 任意（整数型）\| `min` 0、`step` 10、上限 9999999999… \| 集約クエリの NM 基準価格 \| `dtb_product_class.standard_price` を対象規格すべて同一値で更新。キーは `…[standard_price_nm]`。」 | md:110 | pf-fallback | 0 |
| L1-M0310-023 | validation | 基準価格(SP/MP/HP): 任意だがreadonly。POST値は読み取り専用。保存処理は `standard_price_nm` のみ用い、SP/MP/HP列の入力値は更新計算に使わない（**ee陳腐化の照合結果と影響行は§9.1/§10.5へ隔離**） | 「基準価格 (SP) \| 任意だが readonly \| …（readonly）\| … \| POST 値は読み取り専用。保存処理は `standard_price_nm` のみ用い、SP 列の入力値は更新計算に使わない。」「基準価格 (MP)/(HP) \| 同上」 | md:111-113 | pf-fallback | 0 |
| L1-M0310-024 | display_field | 隠しフィールド: product_id(表示兼隠し・POST再構築用)・language(検証メッセージに含める)・product_class_id_nm(保存の基点ID・0の行は保存スキップ)・SP/MP/HP規格ID(テンプレートの有無判定に使う)・状態ステータス(廃止時の空白表示)・割引率(率計算は買取減額率優先)・sell_price_nm(更新せず検証コールバックで買取との大小比較)・productIds(実質必須・再検索用)・CSRFトークン・価格比率(表示のみ・サーバーへ送らない) | 「商品 ID（表示兼隠し）…`…[product_id]`。更新キーではなく表示と POST 再構築用。」「NM 規格 ID（隠し）…`…[product_class_id_nm]`。保存の基点 ID。0 の行は保存スキップ。」「SP / MP / HP 規格 ID（隠し）…テンプレートの有無判定に使う。」「販売価格（NM）（隠し）…更新しない。検証コールバックで買取との大小比較に使用。キー `…[sell_price_nm]`。」「対象商品 ID 列（隠し）…フィールド名 `productIds`。再検索に使う。」「価格比率 \| 表示のみ \| …サーバーへ送らない。」 | md:114-123 | pf-fallback | 0 |
| L1-M0310-025 | edge_case | エッジケース: 複数行送信の途中で例外→それ以前にコミットした商品グループは保存済みのまま以降は未処理。一覧と別タブで同一規格編集→楽観ロック無し後勝ち。NM規格が無い商品・言語→product_class_id_nmが0となり保存スキップ表では基準・在庫が「-」寄り。買取0→マスタ存在チェックをスキップし率SQL側の分岐へ進む | 「複数行送信の途中で例外 \| それ以前にコミットした商品グループは保存済みのまま。以降は未処理。」「一覧と別タブで同一規格を編集 \| 楽観ロックは無い。後勝ち。」「NM 規格が無い商品・言語 \| `product_class_id_nm` が 0 となり保存スキップ。表では基準・在庫が `-` 寄りに見える。」「買取 0 \| マスタ存在チェックをスキップし、率 SQL 側の分岐へ進む。」 | md:127-132 | pf-fallback | 0 |
| L1-M0310-026 | rule | フォーム送信時の判定順序1-6: 1.送信済みかつ妥当か（否ならエラーフラッシュし編集画面再表示）2.型レベル検証（コールバックで買取が販売(NM)または基準(NM)を超えないか）3.product_class_id_nmが空/0は当行スキップ 4.規格ID実在（無ければ例外フラッシュし再表示）5.マスタ整合（低額帯・減額率なし・mtb該当なしなら例外フラッシュ再表示）6.DB更新成功で当行コミット | 「1 \| POST のフォームが送信済みかつ妥当か \| 否ならエラーをフラッシュし編集画面を再表示。」「2 \| 各行の CSRF 等を含む型レベル検証 \| コールバックで買取が販売（NM）または基準（NM）を超えないか。」「3 \| `product_class_id_nm` が空／0 \| 当行は保存ループをスキップ。」「4 \| 規格 ID の実在 \| 無ければ例外メッセージをフラッシュし再表示。」「5 \| マスタ整合（低額帯・減額率なし）\| `mtb_buy_price_list` に該当なしなら例外メッセージをフラッシュし再表示。」「6 \| DB 更新 \| 成功時は当行コミット。」 | md:138-145 | pf-fallback | 0 |
| L1-M0310-027 | integration | データ整合性: 成功後は一覧へ戻り `resume` でセッション検索を再利用し通常は最新の検索結果に反映。`price02`(販売価格)は書き換えず検証は送信時点の値に依存。価格履歴は対象規格ごとにINSERTされ本経路では販売価格の新旧列はNULL | 「一覧との表示差 \| 成功後は一覧へ戻り `resume` でセッション検索を再利用するため、通常は最新の検索結果に反映される。」「販売価格 \| 当機能では `price02` を書き換えない。検証は送信時点の値に依存する。」「価格履歴 \| 対象規格ごとに INSERT される。本経路では販売価格の新旧列は NULL。」 | md:151-155 | pf-fallback | 0 |
| L1-M0310-028 | integration | API/バッチ結果: 本機能では外部APIやバッチを扱わない | 「本機能では外部 API やバッチを扱わない。」 | md:159-161 | pf-fallback | 0 |
| L1-M0310-029 | integration | 入出力: 入力=編集は `ids` 配列、確定は `productIds` と `bulk_update_product_price[...]` 一式。成功時出力=商品一覧ページへのHTTPリダイレクトと成功フラッシュ。失敗時出力=編集HTML200とエラーフラッシュ、または一覧へのリダイレクトとエラーフラッシュ(`ids` 空) | 「入力 \| 編集: `ids` 配列。確定: `productIds` と `bulk_update_product_price[...]` 一式。」「成功時出力 \| 商品一覧ページへの HTTP リダイレクトと成功フラッシュ。」「失敗時出力 \| 編集 HTML 200 とエラーフラッシュ、または一覧へのリダイレクトとエラーフラッシュ（`ids` 空）。」 | md:167-171 | pf-fallback | 0 |
| L1-M0310-030 | db_effect | DBカラム: `dtb_product_class.buy_price`(条件別に再計算され更新)・`dtb_product_class.standard_price`(入力standard_price_nmが全通常規格行に反映)・`dtb_price_history`(buy_price/old_buy_price/standard_price/old_standard_price等を一括INSERT・販売関連列はNULL)。永続化の正はec-cube-enterprise・persist/flushによる即時反映・不要な削除は含まない | 「`dtb_product_class` \| `buy_price` \| 条件別に再計算され更新。」「`dtb_product_class` \| `standard_price` \| 入力 `standard_price_nm` が全通常規格行に反映。」「`dtb_price_history` \| … \| 一括 INSERT。販売関連列は NULL。」「当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。」 | md:177-191 | pf-fallback | 0 |
| L1-M0310-031 | validation | バリデーション: 買取が販売を超えると `admin.product_class.buyprice_valid_bulk`(日本語確認値は販売価格との比較文)。買取が基準を超えると `admin.product.buy_price_exceeds_standard`。整数・上限はIntegerTypeとテンプレート属性の組み合わせ（**買取vs販売のee照合結果と要実機TBD判断は§9.1/§10.2へ隔離**） | 「買取 vs 販売（NM）\| 買取が販売を超えると `admin.product_class.buyprice_valid_bulk`（日本語確認値は販売価格との比較文）。」「買取 vs 基準（NM）\| 買取が基準を超えると `admin.product.buy_price_exceeds_standard`。」「整数・上限 \| `IntegerType` とテンプレート属性の組み合わせ。」 | md:199-201 | pf-fallback | 0 |
| L1-M0310-032 | auth_rule | 権限・認可: 管理画面にログインし当ルートへ到達できる運用者は当画面の操作が可能(ルート単体のロール制約はYAMLを網羅しない)。未到達の主体は管理画面共通の認証により拒否される | 「管理画面にログインし当ルートへ到達できる運用者 \| 当画面の操作が可能である（ルート単体のロール制約は本紙では YAML を網羅しない）。」「未到達の主体 \| 管理画面共通の認証により拒否される。」 | md:207-210 | pf-fallback | 0 |
| L1-M0310-033 | nav | 画面遷移: 一覧から一括編集へ=GET/POST edit_bulk_update_buy_price。確定成功=admin_product_pageにresumeクエリ。確定失敗・例外=同一編集テンプレート。ids空で編集URL=admin_product_page。成功時は成功フラッシュを積み一覧はセッションのページ番号とresumeで再検索表示 | 「一覧から一括編集へ \| GET/POST … 」「確定成功 \| `GET admin_product_page` に `resume` クエリ」「確定失敗・例外 \| 同一編集テンプレート」「`ids` 空で編集 URL \| `admin_product_page`」「確定成功 \| 成功フラッシュを積む \| 一覧はセッションのページ番号と `resume` で再検索表示。」 | md:216-228 | pf-fallback | 0 |
| L1-M0310-034 | error | エラー処理: フォーム検証失敗→編集画面再表示＋エラーメッセージ。規格ID不正・削除済み→編集画面再表示＋`admin.product.to_show_complete`。買取がマスタに無い(条件を満たす低額帯)→編集画面再表示＋`admin.product.not_found_nm_price`。ids未選択→一覧へ＋`admin.product.not_select` | 「フォーム検証失敗 \| 編集画面再表示＋エラーメッセージ」「規格 ID 不正・削除済み \| 編集画面再表示＋ `admin.product.to_show_complete`」「買取がマスタに無い（条件を満たす低額帯）\| 編集画面再表示＋ `admin.product.not_found_nm_price`」「`ids` 未選択 \| 一覧へ＋ `admin.product.not_select`」 | md:234-239 | pf-fallback | 0 |
| L1-M0310-035 | concurrency | 排他制御・トランザクション: 保存ループは商品行ごとに価格履歴INSERTと通常規格UPDATEを行い1商品行ごとにコミット・全行一括の原子性は持たない。行ロック・悲観ロック・楽観ロック・ロックファイルは使用しない・同じ規格を同時更新した場合は後から確定した値が残る。ある行で例外が起きてもそれ以前にコミット済みの商品行はロールバックされず例外行以降は未処理 | 「保存ループは商品行ごとに価格履歴INSERTと通常規格UPDATEを行い、1商品行ごとにコミットする。全行一括の原子性は持たない。」「対象規格への行ロック・悲観ロック・楽観ロック・ロックファイルは使用しない。同じ規格を同時に更新した場合は後から確定した値が残る。」「ある行で例外が起きても、それ以前にコミット済みの商品行はロールバックされない。例外行以降は未処理となる。」 | md:278-282 | pf-fallback | 0 |
| L1-M0310-036 | log | 副作用・ログ: DB=上記UPDATE・履歴INSERT・行単位コミット。フラッシュ=成功・エラー・警告メッセージ。監査ログ専用出力=本機能固有のファイルログは主題としない | 「DB \| 上記 UPDATE・履歴 INSERT。行単位コミット。」「フラッシュ \| 成功・エラー・警告メッセージ。」「監査ログ専用出力 \| 本機能固有のファイルログは主題としない。」 | md:257-261 | pf-fallback | 0 |
| L1-M0310-040 | message | M03-10-MSG-001: ja「1つ以上の商品を選択してください」(キー`admin.product.not_select`)・表示位置=管理画面上部・表示条件=商品を選択せずに一括編集画面を開いたとき・後続=商品一覧画面に遷移。en=（英訳なし・ee messages.en.yaml(9dbc4dd)に当キー不在） | 「M03-10-MSG-001 \| 管理画面上部 \| 1つ以上の商品を選択してください \| （英訳なし）\| 商品を選択せずに一括編集画面を開いたとき \| 商品一覧画面に遷移する」／`admin.product.not_select: 1つ以上の商品を選択してください` | md:247／messages.ja.yaml:1962 | pf-fallback＋共有インフラ逐語 | 0 |
| L1-M0310-041 | message | M03-10-MSG-003: ja「登録が完了しました。」(キー`admin.register.complete`)・管理画面上部・一括編集で価格を更新したとき・商品一覧画面に遷移。en "Registration completed."（ee messages.en.yaml実キー逐語。pf md表はen「（英訳なし）」と記すがee yamlに実在するため逐語採用＝§5に不一致記録） | 「M03-10-MSG-003 \| 管理画面上部 \| 登録が完了しました。 \|（英訳なし）\| 一括編集で価格を更新したとき \| 商品一覧画面に遷移する」／`admin.register.complete: 登録が完了しました。`／`admin.register.complete: Registration completed.` | md:248／messages.ja.yaml:1966／messages.en.yaml:1640 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0310-042 | message | M03-10-MSG-002: ja「ID:%productId%（%language%）の買取価格は基準価格「%standardPrice%」以下を指定してください。 ／ 整数で入力してください。」(キー`admin.product.buy_price_exceeds_standard`＋整数検証)・管理画面上部・買取価格(NM)に基準価格(NM)を上回る金額を入力して登録押下時・登録処理を行わず買取価格一括更新画面を再表示。en=（英訳なし） | 「M03-10-MSG-002 \| 管理画面上部 \| ID:%productId%（%language%）の買取価格は基準価格「%standardPrice%」以下を指定してください。 ／ 整数で入力してください。 \|（英訳なし）\| 買取価格(NM)に基準価格(NM)を上回る金額を入力して「登録」ボタンを押下したとき \| 登録処理を行わず、買取価格一括更新画面を再表示する」／`admin.product.buy_price_exceeds_standard: "ID:%productId%（%language%）の買取価格は基準価格「%standardPrice%」以下を指定してください。"` | md:249／messages.ja.yaml:1965 | pf-fallback＋共有インフラ逐語 | 0 |
| L1-M0310-043 | message | 例外メッセージ `admin.product.to_show_complete`: ja「%id%：対象の商品は既に削除されています。」・規格ID不在/削除済みのとき編集画面再表示に伴い表示。en=（英訳なし・当キーにenなし。別キー`admin.common.to_show_complete`とは異なる） | 「規格 ID 不正・削除済み \| 編集画面再表示＋ `admin.product.to_show_complete`」／`admin.product.to_show_complete: "%id%：対象の商品は既に削除されています。"` | md:73,237／messages.ja.yaml:1963 | pf-fallback＋共有インフラ逐語 | 0 |
| L1-M0310-044 | message | 例外メッセージ `admin.product.not_found_nm_price`: ja「%price%円の買取価格は設定できません。」・買取がマスタに無い(条件を満たす低額帯・減額率なし)のとき編集画面再表示に伴い表示。en=（英訳なし） | 「買取がマスタに無い（条件を満たす低額帯）\| 編集画面再表示＋ `admin.product.not_found_nm_price`」／`admin.product.not_found_nm_price: "%price%円の買取価格は設定できません。"` | md:74,238／messages.ja.yaml:1964 | pf-fallback＋共有インフラ逐語 | 0 |

## §2 SEED三段参照設計（全て `@TBD-D5`）

期待値の正は**L1オラクルID**（SEED値を期待値の正にしない三段参照: 期待=L1→前提状態=SEED→実測=観測値）。
`dtb_product.id`・`dtb_product_class.id` 等の帯は**990001〜**（自動採番衝突・シーケンス整合は`@TBD-D5`）。

| SEED | 内容 | 用途 |
|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン（パイロット共通） | 全ケースの認証 |
| SEED-M0310-PRODUCTS | 商品(id=990001,990002)・各商品に言語ja・通常規格(high_price_code NULL)としてNM/SP/MP/HP規格(状態ID1〜4)を1件ずつ・**買取減額率なし**・関連カード詳細は**非Foil/非プロモ**(special_flg=FALSE側)・更新前 buy_price は識別用 sentinel=999999・既知の standard_price/割引率・NMのprice02(sell_price_nm)を買取<販売となる十分大きい値に設定。**`mtb_buy_price_list` に nm_price=1000 の行を状態別に内包**(NM状態のcard_condition_id→price=1000／SP状態のcard_condition_id→price=800・いずれもspecial_flg=FALSE)、nm_price=777は**未登録**。→ 買取1000入力時は例外を回避しbuy_price(NM)=1000・buy_price(SP)=800が状態別に確定(一律1000書きの誤実装を検出可能)。買取777入力時はnot_found_nm_price例外を一意誘発 | 編集表表示(C-001,005,022)・更新成功系(C-003,008,011,012,017,020,023)・相関/DB相関(C-010〜013)・部分コミット(C-014)・not_found(C-090) |
| SEED-M0310-HIGHPRICE | 商品(id=990003)・言語ja・**`high_price_code`付き高額品規格のみを保持し通常規格(high_price_code NULL)を一切持たない** | 選択しても編集表に行が出ない＝集約のhigh_price_code IS NULLフィルタを一意判定(C-015) |
| SEED-M0310-NONM | 商品(id=990004)・言語ja・NM規格が無い(product_class_id_nm=0となる)状態＋SP規格のみ保持 | NM規格無しで保存スキップ・表は基準/在庫「-」(C-022,C-024) |
| SEED-M0310-INVALID | 商品(id=990005)・NM規格は有効＋SP規格の表示ステータスが「無効」 | 無効規格の在庫・基準価格非表示・NM入力欄は表示(C-092補完) |
| SEED-M0310-MULTILANG | 商品(id=990006,990007)・複数言語(ja/en)・各NM通常規格 | 編集表の初期行数(商品×言語グループ)・表示順(商品ID降順・言語昇順)(C-015,C-016) |

- **改訂1（Major2/3是正）**: 旧`SEED-M0310-PRODUCTS`は`SEED-M0310-PRODUCTS`へ統合（正常系が一意成功するよう全正常系がmtb内包seedを参照）。`SEED-M0310-HIGHPRICE`は高額品規格のみへ変更（通常規格併存では行数が変わらず判定不能というcodex指摘を是正）。
- 破壊的ケースは**帯（990001〜）配下のみ**へ書き込み、afterEachで帯サブツリー復元（永続列 `update_date` 等を直接SQLで復元）。既存基準行は書き換えない。
- フレッシュDB/serial前提（共有環境では実行しない・`e2e-standard-run-requirements`準拠）。
- **セレクタ具体値は全て要実機**（カスタマイズ画面のtwig/Form照合を規約で行わないため。§9.2）。

## §3 画面項目マトリクス

Excel識別ID（0204:6260-6275・16項目）×pf md入力項目表（md:107-123）の突合。**必須はExcel明記の識別ID5/10のみ「◯」**（他は「-」）。

| 識別ID | Excelラベル | pf md対応（フォームキー） | 必須 | 保存先/扱い | 根拠 |
|---|---|---|---|---|---|
| 1 | 表示在庫切替え | （select・name無し送信なし） | - | 表示のみ（在庫集計区分切替） | 0204:6260／md:53,L1-M0310-005,016 |
| 2 | ID | product_id（表示兼隠し） | - | POST再構築用・前画面商品ID表示 | 0204:6261／L1-M0310-024 |
| 3 | 商品名 | （前画面指定の商品名表示） | - | 表示のみ | 0204:6262／L1-M0310-014 |
| 4 | 言語 | language（隠し） | - | 検証メッセージに含める | 0204:6263／L1-M0310-024 |
| 5 | 買取価格(NM) | `…[buy_price_nm]` | ◯ | dtb_product_class.buy_price（全通常規格再計算） | 0204:6264／L1-M0310-021,008 |
| 6-9 | 在庫数(NM/SP/MP/HP) | （集約在庫・編集不可） | - | 表示のみ（無効規格は非表示） | 0204:6265-6268／L1-M0310-003,014 |
| 10 | 基準価格(NM) | `…[standard_price_nm]` | ◯ | dtb_product_class.standard_price（対象規格全同値） | 0204:6269／L1-M0310-022,008 |
| 11-13 | 基準価格(SP/MP/HP) | `…[standard_price_sp/mp/hp]`（readonly） | - | POST値読み取り専用・NMと割引率で計算表示 | 0204:6270-6272／L1-M0310-023 |
| 14 | 価格比率(買取÷販売) | （表示のみ・JS計算） | - | サーバーへ送らない | 0204:6273／L1-M0310-004,024 |
| 15 | 商品検索に戻る | （テキストリンク・商品一覧へ） | - | 商品マスター(検索結果)へ遷移 | 0204:6274／L1-M0310-013 |
| 16 | 登録 | （登録ボタン） | - | 買取・基準価格の登録/更新を実行 | 0204:6275／L1-M0310-012 |
| （隠し） | product_class_id_nm / SP/MP/HP規格ID / 状態ステータス / 割引率 / sell_price_nm / productIds / _token | 各隠しフィールド | - | 保存基点・テンプレ判定・検証・再検索・CSRF | md:114-123／L1-M0310-024 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全ケース行を実体掲載**）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値。
- request契約（§6.1）: 編集GET/POST `edit_bulk_update_buy_price`（ids[]）／確定POST `bulk_update_buy_price`（productIds+`bulk_update_product_price[product_classes][n][…]`）。DOM/CSRF実nameは要実機。

### §4.1 bound対応候補行（掲載23行。§8の88対応表が参照する全bound候補。**改訂1でC-009/C-019/C-025を削除**＝-011/-048/-076/-085をTBDへ移動）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-001	IT-15	編集表表示	P1	選択商品について一括編集表が開き、商品ID×言語ごとに買取価格(NM)・基準価格(NM)・在庫・価格比率が表示される	ログイン済(SEED-M01-ADMIN)／SEED-M0310-PRODUCTS	ids[]=990001,990002	1. GET /%eccube_admin_route%/product/edit_bulk_update_buy_price?ids[]=990001&ids[]=990002 を開く 2. 編集表に選択商品の行(商品ID・商品名・言語・買取価格(NM)入力欄・在庫・価格比率・第2行基準価格)が表示されることを確認	選択商品について編集表が開き、各行に商品ID・商品名・言語・買取価格(NM)・在庫数・価格比率・基準価格が表示される [L1:L1-M0310-010,L1-M0310-014; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-002	IT-15	ids空リダイレクト	P1	idsを付けずに編集URLへ入るとエラーフラッシュのうえ商品一覧へリダイレクトする	ログイン済／セッションにページ番号あり	ids 空	1. GET /%eccube_admin_route%/product/edit_bulk_update_buy_price（ids無し）を開く 2. フラッシュと遷移先を確認	「1つ以上の商品を選択してください」のエラーフラッシュが表示され、商品一覧画面(セッションのページ番号)へ遷移する ／ 自動検証(内部): セッション eccube.admin.product.search.page_no を使い GET /%eccube_admin_route%/product/page/{page_no} へリダイレクト [L1:L1-M0310-011,L1-M0310-040,L1-M0310-034; fixture:@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-003	IT-26	更新成功リダイレクト	P1	検証成功で登録すると価格を更新し成功フラッシュとともにresume=1付きで一覧へリダイレクトする	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)・基準価格(NM)を有効値(買取≦基準・買取≦販売)に設定して登録	1. 編集表を開く 2. 買取価格(NM)・基準価格(NM)を有効値に入力し登録ボタンを押下 3. フラッシュと遷移先を確認(afterEach: 帯再適用)	「登録が完了しました。」が表示され、商品一覧画面へ遷移する ／ 自動検証(内部): HTTP302で admin_product_page へ ?resume=1 付きリダイレクト(セッションのページ番号) [L1:L1-M0310-012,L1-M0310-018,L1-M0310-041; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-004	IT-03	商品一覧リンク	P2	「商品検索に戻る」リンクでセッションのページ番号の一覧へ遷移し保存はしない	ログイン済／SEED-M0310-PRODUCTS	—	1. 編集表を開く 2. 「商品検索に戻る」リンクの遷移先を確認	商品一覧画面(セッションのページ番号・無ければ1)へ遷移し、価格の保存は行われない ／ 自動検証(内部): 遷移先が /%eccube_admin_route%/product/page/{page_no} [L1:L1-M0310-013; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-005	IT-15	表示要素	P2	編集表の表示要素(メニュー・商品ID列・商品名・言語)が仕様どおり表示される	ログイン済／SEED-M0310-PRODUCTS	ids[]=990001	1. 編集表を開く 2. メニュー(product/product_edit)・表の商品ID・商品名・言語列の表示を確認	メニューはproduct/product_editで、表には前画面指定の商品ID・商品名・言語が表示される [L1:L1-M0310-014,L1-M0310-024; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-006	IT-25	JS価格比率再計算	P2	買取価格(NM)・基準価格(NM)の入力で価格比率(買取÷基準)がJSで再計算表示される	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)=1000・基準価格(NM)=2000	1. 編集表を開く 2. 買取価格(NM)/基準価格(NM)を入力し価格比率欄の値を確認(初期表示時もNM買取行に一度計算される)	.js-buy-price/.js-base-priceの入力で価格比率が再計算され表示される(小数第3位四捨五入・同額は1・どちらか空欄なら空欄) [L1:L1-M0310-015,L1-M0310-004; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-007	IT-22	買取価格(NM)必須エラー	P1	買取価格(NM)を空で登録すると必須エラーとなり処理が完了しない	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)=空	1. 編集表を開く 2. 買取価格(NM)を空にして登録ボタンを押下 3. エラー表示と処理未完了を確認	買取価格(NM)は必須のため検証エラーが表示され、登録/更新は行われず編集画面が再表示される [L1:L1-M0310-021,L1-M0310-008,L1-M0310-026; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-008	IT-22	必須入力で継続	P1	買取価格(NM)に有効な整数を入力すれば必須エラーは出ず処理を継続できる	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)=有効整数(買取≦基準・買取≦販売)	1. 編集表を開く 2. 買取価格(NM)に有効整数・基準価格(NM)に十分大きい値を入力し登録 3. エラーが出ず更新が成立することを確認(afterEach: 帯再適用)	必須バリデーションエラーは出ず、更新処理が継続・成立する [L1:L1-M0310-021,L1-M0310-018; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-010	IT-22	相関エラー(買取>基準)	P1	買取価格(NM)が基準価格(NM)を上回ると相関エラーとなり全登録/更新処理が破棄され編集画面が再表示される	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)=3000・基準価格(NM)=2000(買取>基準)	1. 編集表を開く 2. 買取価格(NM)>基準価格(NM)となる値を入力し登録ボタンを押下 3. エラーメッセージ・処理破棄・再表示を確認	「ID:xxx（言語）の買取価格は基準価格「2000」以下を指定してください。」等のエラーが表示され、登録処理は行われず編集画面(HTTP200)が再表示される ／ 自動検証(内部・DB): 全商品の dtb_product_class.buy_price/standard_price が更新前のまま(全登録/更新処理が破棄され1件も更新されない) [L1:L1-M0310-007,L1-M0310-042,L1-M0310-029; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-011	IT-22	相関OK(買取≦基準)で継続	P1	買取価格(NM)が基準価格(NM)以下なら相関エラーは出ず処理を継続できる	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)=1000(mtbにnm_price=1000実在)・基準価格(NM)=2000(買取≦基準・買取≦販売)	1. 編集表を開く 2. 買取価格(NM)≦基準価格(NM)かつ≦販売価格の値(買取1000)を入力し登録 3. エラーが出ず更新が成立することを確認(afterEach: 帯再適用)	相関バリデーションエラーは出ず、更新処理が継続・成立する [L1:L1-M0310-026,L1-M0310-018; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-012	IT-22	DB相関OK(規格実在)で継続	P1	選択商品の通常規格がDBに実在すれば規格ID実在チェックを通過し更新が継続する	ログイン済／SEED-M0310-PRODUCTS	有効な買取・基準価格	1. 実在するNM通常規格を持つ商品で編集表を開く 2. 有効値で登録 3. エラーが出ず更新成立を確認(afterEach: 帯再適用)	規格ID実在チェックを通過し、エラーなく更新処理が継続・成立する [L1:L1-M0310-018,L1-M0310-026; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-013	IT-22	DB相関NG(規格削除済)	P1	送信されたNM規格IDがDBに存在しない(削除済み)場合は例外メッセージが表示され処理が完了しない	ログイン済／SEED-M0310-PRODUCTS	product_class_id_nm=実在しない規格ID	1. 編集表を開く 2. 送信直前にNM規格IDをDBから削除(または存在しないIDで送信)し登録 3. エラー表示と処理未完了を確認	「%id%：対象の商品は既に削除されています。」(admin.product.to_show_complete)が表示され、編集画面が再表示され登録は完了しない ／ 自動検証(内部・DB): 当該行および以降の更新が反映されない [L1:L1-M0310-018,L1-M0310-043,L1-M0310-034; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-014	IT-26	部分コミット(行単位)	P2	複数行送信の途中で例外が起きても、それ以前にコミットした商品グループは保存済みのまま残り以降は未処理となる	ログイン済／SEED-M0310-PRODUCTS	商品990002(先処理・買取1000でmtb一致・正常)＋商品990001(買取777でmtb未登録→not_found_nm_price例外)。商品ID降順で990002が先に処理される	1. 990002(正常)と990001(例外誘発)を選択し編集表を開く 2. 990002は買取1000/基準有効、990001は買取777(mtb未登録・減額率なし)で登録 3. 990002がコミット済み・990001以降が未処理であることを確認(afterEach: 帯再適用)	途中で例外(not_found_nm_price)が発生しても、先にコミットされた990002の買取・基準価格は保存済みのまま残り、990001は未処理となる ／ 自動検証(内部・DB): 990002の dtb_product_class は更新済み・990001は更新前のまま(1商品行ごとにコミットしロールバックしない) [L1:L1-M0310-025,L1-M0310-035,L1-M0310-018; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-015	IT-15	編集表集約	P1	編集表は商品ID×言語グループごとに1行で、high_price_codeがNULLの通常規格のみを対象に選択商品が含まれる	ログイン済／SEED-M0310-PRODUCTS＋SEED-M0310-HIGHPRICE	ids[]=990001,990003	1. 通常規格を持つ商品(990001)と高額品規格のみで通常規格を持たない商品(990003)を選択し編集表を開く 2. 990001の(商品ID×言語)行が編集表に現れ、通常規格を持たない990003は編集表に1行も現れないことを確認	編集表には選択商品のうち通常規格(high_price_code NULL)を持つ990001の(商品ID×言語)行のみが現れ、高額品規格のみの990003は行が現れない(集約がhigh_price_code IS NULLに限定するため) ／ 自動検証(内部・DB): 編集表の行数が「通常規格を持つ選択商品×言語」のグループ数と一致(990003は0行) [L1:L1-M0310-017; fixture:SEED-M0310-HIGHPRICE@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-016	IT-15	表示順	P2	編集表の行は商品ID降順・言語昇順で並ぶ	ログイン済／SEED-M0310-MULTILANG	ids[]=990006,990007	1. 複数商品×複数言語を選択し編集表を開く 2. 行の並び順を確認	編集表の行は商品ID降順・言語昇順で並ぶ [L1:L1-M0310-017; fixture:SEED-M0310-MULTILANG@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-017	IT-26	価格履歴INSERT	P1	更新成功時に対象規格ごとに価格履歴(dtb_price_history)がINSERTされ、価格更新が直接保存される	ログイン済／SEED-M0310-PRODUCTS	買取1000(mtb一致)・基準有効値で登録	1. 編集表を開く 2. 有効値で登録し成功 3. 成功フラッシュを確認(afterEach: 帯再適用)	「登録が完了しました。」が表示され更新が確定する ／ 自動検証(内部・DB): 対象規格ごとに dtb_price_history 行が追加され(販売関連の新旧列はNULL)、dtb_product_class が直接更新される(不要な削除は含まない) [L1:L1-M0310-018,L1-M0310-030,L1-M0310-027; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-018	IT-26	検証失敗で履歴非追加	P1	検証失敗時は全登録/更新処理が破棄され価格履歴も追加されない	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)=基準価格(NM)超過(相関エラー)	1. 編集表を開く 2. 買取>基準の値で登録し検証失敗 3. 履歴が追加されないことを確認	検証失敗で編集画面が再表示され、価格履歴・価格更新のいずれも行われない ／ 自動検証(内部・DB): dtb_price_history に新規行が追加されず dtb_product_class も更新されない [L1:L1-M0310-007,L1-M0310-030; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-020	IT-26	価格更新の再表示反映	P1	更新した買取価格(NM)・基準価格(NM)は編集表の再表示に反映される	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)=1000(mtbにnm_price=1000実在)・基準価格(NM)=3210	1. 編集表を開く 2. 買取1000・基準3210で登録 3. 同じ商品で編集表を再表示し、買取価格(NM)=1000・基準価格(NM)=3210(いずれもNM規格の値)が表示されることを確認(afterEach: 帯再適用)	編集表を再表示すると買取価格(NM)欄=1000・基準価格(NM)欄=3210(NM規格のbuy_price/standard_price)が更新後の値で表示される [L1:L1-M0310-021,L1-M0310-008,L1-M0310-018; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-021	IT-26	検証失敗で価格不変	P1	検証失敗時は対象レコードの値が変更されず、再表示で元の値のまま表示される	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)=基準価格(NM)超過(相関エラー)	1. 編集表を開き現在の買取・基準価格を確認 2. 買取>基準で登録し検証失敗 3. 編集表を再表示し買取価格(NM)・基準価格(NM)が変更前のままであることを確認	検証失敗時は編集画面が再表示され、再度開くと買取価格(NM)・基準価格(NM)は変更前の値のまま表示される(保存されていない) ／ 自動検証(内部・DB): dtb_product_class の buy_price/standard_price が更新前と同値 [L1:L1-M0310-007,L1-M0310-030; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-022	IT-15	状態列テンプレ表示切替	P2	SP/MP/HP規格IDの有無でテンプレートの状態列表示が切り替わり、規格IDが0の状態列は在庫0・基準価格「-」で表示される	ログイン済／SEED-M0310-NONM	ids[]=990004	1. NM規格のみでSP規格を欠く等の商品で編集表を開く 2. 規格IDが0の状態列の在庫が0表記・基準価格が「-」で表示されることを確認	SP/MP/HP規格IDの有無に応じて状態列の表示が切り替わり、規格IDが0の状態列は在庫を0表記・基準価格を「-」で表示する [L1:L1-M0310-024,L1-M0310-014; fixture:SEED-M0310-NONM@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-023	IT-26	買取価格の再計算と保存	P1	買取価格(NM)が業務ルール(mtb_buy_price_list参照)で確定され dtb_product_class.buy_price に保存・再表示される	ログイン済／SEED-M0310-PRODUCTS(更新前 buy_price は sentinel=999999・mtb は nm_price=1000 に対しNM状態→price=1000/SP状態→price=800 を用意)	買取価格(NM)=1000(減額率なし・非Foil/非プロモ)	1. 編集表を開き更新前の買取価格(NM)=sentinel(999999)を確認 2. 買取価格(NM)=1000で登録(mtb一致パス) 3. 編集表を再表示し買取価格(NM)=1000で表示されることを確認(afterEach: 帯再適用)	編集表を再表示すると買取価格(NM)欄が更新前sentinel(999999)から保存値(1000)へ変わって表示される ／ 自動検証(内部・DB): 対象商品の全通常規格(high_price_code NULL)の buy_price が sentinel から更新され、かつ状態別にmtbの price が反映される(NM規格=1000・SP規格=800＝一律1000書きの誤実装では不一致となり検出)。買取価格の保存先は dtb_product_class.buy_price(mtb該当なし規格はnmPriceにフォールバック) [L1:L1-M0310-019,L1-M0310-021,L1-M0310-030; fixture:SEED-M0310-PRODUCTS@TBD-D5]				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-024	IT-25	NM規格無しで保存スキップ	P2	NM規格が無い商品・言語はproduct_class_id_nmが0となり保存スキップされ、表では基準・在庫が「-」寄りに表示される	ログイン済／SEED-M0310-NONM	ids[]=990004	1. NM規格が無い商品で編集表を開く 2. 当該行の基準・在庫が「-」寄りに表示されることを確認 3. 登録しても当該行は保存スキップされることを確認(afterEach: 帯再適用)	NM規格が無い行はproduct_class_id_nmが0となり保存ループでスキップされ、表では基準価格・在庫が「-」寄りに表示される ／ 自動検証(内部・DB): 当該商品の規格は更新されない [L1:L1-M0310-025,L1-M0310-024; fixture:SEED-M0310-NONM@TBD-D5]				
```

### §4.2 補完行（4行。**親test_idなし・母集合会計に算入しない**。理由=Excel/pf mdに規定があるが母集合88行の期待テキストに対応する親が無い挙動の刷新delta/例外検証）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-090	IT-22	買取マスタ無しエラー	P2	買取が条件を満たす低額帯でマスタに無い場合は例外メッセージが表示され登録が完了しない	ログイン済／SEED-M0310-PRODUCTS	買取価格(NM)=777(mtb_buy_price_list未登録・減額率なし・0以外10000以下)	1. 編集表を開く 2. 買取777(mtb未登録)で登録 3. 例外メッセージと再表示を確認	「777円の買取価格は設定できません。」(admin.product.not_found_nm_price)が表示され、編集画面が再表示され登録は完了しない [L1:L1-M0310-018,L1-M0310-044,L1-M0310-034; fixture:SEED-M0310-PRODUCTS@TBD-D5]（補完行・母集合会計外）				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-091	IT-25	価格比率計算仕様	P3	価格比率(買取÷基準)は小数第3位四捨五入・同額は1・どちらか空欄なら空欄で表示される	ログイン済／SEED-M0310-PRODUCTS	買取/基準の複数組(例 買取2345/基準10000=0.23、買取2356/基準10000=0.24、同額、片方空欄)	1. 編集表で買取価格(NM)・基準価格(NM)に各組を入力 2. 価格比率欄の値を確認	価格比率は小数第3位四捨五入(0.2345→0.23,0.2356→0.24)、同額は「1」、どちらか空欄なら空欄で表示される [L1:L1-M0310-004; fixture:SEED-M0310-PRODUCTS@TBD-D5]（補完行・excel補完）				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-092	IT-25	無効規格非表示	P3	「無効」に設定された規格の在庫数・基準価格は非表示となるが、NM規格が無効でも入力欄は表示される	ログイン済／SEED-M0310-INVALID	ids[]=990005	1. NMは有効・SP規格が「無効」の商品で編集表を開く 2. 無効SP規格の在庫・基準価格が非表示、NM規格の入力欄は表示されることを確認	無効規格の在庫数・基準価格は非表示となり、NM規格が無効でもこの画面では入力欄が表示される(NMは必須・割引率の算定基準) [L1:L1-M0310-002,L1-M0310-003; fixture:SEED-M0310-INVALID@TBD-D5]（補完行・excel補完）				
m03-10_admin_product_product_bulk_buy_standard_price_edit	E2E-M0310C-093	IT-25	在庫区分表示切替	P3	表示在庫切替えでTC東京(通販＋TC東京スマレジ)/支店/バックヤードの区分別在庫数に切り替わる	ログイン済／SEED-M0310-PRODUCTS	表示在庫切替え=各区分	1. 編集表を開く 2. 表示在庫切替えで区分を切り替え在庫数の表示が区分別集計に変わることを確認(店舗マスタ区分の投入・集計は要実機/クロス機能)	表示在庫切替えの区分(TC東京/支店/バックヤード)に応じて在庫数が区分別集計で表示される [L1:L1-M0310-005; fixture:SEED-M0310-PRODUCTS@TBD-D5]（補完行・excel補完・店舗マスタ区分集計は要実機）				
```

## §5 ja/en locale対応表

- LS=1 claim（1件）: L1-M0310-041（登録完了フラッシュ・en実在）。他メッセージ(040/042/043/044)はenキー不在＝（英訳なし）でLS=0。
- メッセージ実文言をee `messages.{ja,en}.yaml`（9dbc4dd）から実キーでgrep確認（B4）:
  - `admin.product.not_select` ja:1962「1つ以上の商品を選択してください」／en=**キー不在（英訳なし）**。
  - `admin.register.complete` ja:1966「登録が完了しました。」／en:1640 "Registration completed."。
  - `admin.product.buy_price_exceeds_standard` ja:1965「ID:%productId%（%language%）の買取価格は基準価格「%standardPrice%」以下を指定してください。」／en=**キー不在（英訳なし）**。
  - `admin.product.to_show_complete` ja:1963「%id%：対象の商品は既に削除されています。」／en=**キー不在（英訳なし）**（別キー`admin.common.to_show_complete`とは文言・意味が異なる）。
  - `admin.product.not_found_nm_price` ja:1964「%price%円の買取価格は設定できません。」／en=**キー不在（英訳なし）**。
  - `admin.product_class.buyprice_valid_bulk` = **ja/en両方ともキー不在**（pf md:199が参照するが実在せず＝§9.1 -064 TBDの根拠）。
- **pf mdのen列とen yamlの不一致（正直記録）**: M03-10のpf md表示メッセージ表(md:245-251)はMSG-001/002/003いずれもen列を「（英訳なし）」と記す。しかし
  `admin.register.complete`(MSG-003)はee en yaml(1640)に "Registration completed." が実在する。**B4に従いen逐語が実在する場合はそれを採用**（L1-M0310-041のen）。
  他4キーはee enに実在しないためpf md記載どおり（英訳なし）で一致。ja翻訳による英文生成は行っていない（捏造ゼロ）。
- **en確定率**: メッセージ5件中 en実在1（admin.register.complete）／en不在4（ja逐語のみ確定・enは正当に（英訳なし））。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 request契約

- 編集表示: `POST`/`GET /{admin_route}/product/edit_bulk_update_buy_price`（`ids[]`・複数は繰り返し。md:36-37）。
- 確定: `POST /{admin_route}/product/bulk_update_buy_price`（`productIds`カンマ区切り＋`bulk_update_product_price[product_classes][n][buy_price_nm]`/`[standard_price_nm]`/`[product_class_id_nm]`/`[sell_price_nm]`等＋`_token`。md:39,109-123）。**DOM id接頭・CSRF実name・ネスト位置は要実機**（ee twig照合は規約で行わない）。
- 一覧遷移: `GET /{admin_route}/product/page/{page_no}`（md:40）。
- DB照会: `e2e/helpers/db.ts`（docker exec psql・読取と後始末のみ）。オラクル解決: `e2e/helpers/oracle.ts` の `o(id, "m03_10_oracle")` 方式（**正式fixtureは未作成**・候補段階では消費なし）。
- **自動検証(内部・DB)を付す判定（B9）**: 価格履歴INSERT(dtb_price_history・画面非表示＝監査系書込)・全通常規格へのbuy_price/standard_price波及(WHERE漏れ検出＝更新対象外レコード不変)・検証失敗時の非更新(何も書かれない＝異常系ロールバック相当)・部分コミットの物理事実は外部IFで検知不能のためDB照会を付す。買取価格(NM)/基準価格(NM)の保存値そのものは再表示で目視可能のためDB二重チェックしない。

### §6.2 _drafts/隔離lint証跡

1. oracle草案は `e2e/fixtures/oracle/_drafts/m03-10_..._oracle_draft.json` のみに生成。**正式パス `e2e/fixtures/oracle/` 直下への書込なし**。
2. 正式解決器 `e2e/helpers/oracle.ts` の隔離ガードにより本草案は正式specから解決不能。
3. 本候補は spec/page 実装・実走なし。既存 `e2e/` 配下への変更なし。

## §7 実行区分・多軸属性（暫定・正式会計に使わない）

- Playwright(GUI・画面目視主体): C-001,004,005,006,007,015,016,022,024（表示・遷移・JS・集約/表示順・状態列）。
- Playwright(GUI)＋DB照会(db.ts・構造/物理事実の副次): C-002,003,008,010,011,012,013,014,017,018,020,021,023（更新反映は再表示目視が主・履歴INSERT/全規格波及/非更新/部分コミットはDB副次）。
- 破壊的（帯990001〜のみ書込・afterEach帯再適用・フレッシュDB/serial前提）: C-003,008,011,012,014,017,018,020,021,023,024,090。
- 実行保留/要実機: C-093（店舗マスタ区分の在庫集計＝クロス機能・データ投入要実機）・全ケースのセレクタ具体値（§9.2）。
- TBD 5件(-011,-048,-064,-076,-085)は本節の実行対象に含めない（§9.1）。excluded 23件(EX-A/EX-D/B14/EX-S/EX-R)も対象外。
- 聖域判定・多軸属性の正式付与はD14後（本節は候補の参考情報）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル・前提条件ラベルは不使用＝ノイズ）。

### 集計（88 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **60** | 下表 |
| **TBD** | **5** | -064（買取vs販売バリデーション＝buyprice_valid_bulk：Excel未記載かつee messagesキー不在）／-011（SP/MP/HP「POST値保存に使わない」＝ee食い違い）／-048,-085（基準価格「全規格同一値/状態別に分けない」＝ee食い違い）／-076（楽観ロック無し・後勝ちの物理証明＝要実機競合手順）。§9.1 |
| **excluded** | **23** | EX-A 検索条件14（-019〜-032）／EX-D 削除条件3（-065,-066,-068）／B14 未認証1（-002）／EX-S スコープ外宣言1（-074）／EX-R 冗長スタブ4（-061,-073,-082,-083） |
| 合計 | **88** | 欠落0・理由なし重複0 |

- 候補ケース行総数**22**（§4.1 bound対応。§4.2補完4行は母集合会計外。改訂1でC-009/C-019/C-025、改訂2でC-026を削除）。
- **改訂1（codex Gate C 5 Major是正）**: pf md陳腐化のee実確認で-011/-048/-085をbound→TBD／-076をbound→TBD／-073をbound→excluded。seed一意成功性・high_price_code識別seedを是正（§2）。
- **改訂2（codex Gate C r2 4 Major是正）**: (1)source_class純度＝L1のexpectedからee型/SQL/キー不在を除去し照合結果を§9/§10へ隔離・C-020の参照をL1-022(陳腐化「全規格同一値」)からL1-021/008へ是正。(2)冗長スタブ-061(失敗分岐要約・C-010/C-002被覆済)・-082/-083(汎用「エラーなし継続」・C-003/C-020被覆済)を**EX-R excluded**（C-026削除）。(3)seed値域＝C-011買取1500→1000(mtb一致)・C-023に状態別mtb(NM1000/SP800)とsentinel(999999)を投入。(4)concretized.tsv会計＝-070/-071の§8/観点補正から「要ソース確認」を除去し-070=C-015共有非出力・-071=C-016 Playwright代表とした。**会計 bound60/TBD5/excluded23=88**。
- **excluded根拠（全カテゴリ実test_idを引いて期待テキストで確認済み・偽陰性なし）**:
  - **EX-A（-019〜-032・14件）**: 期待は全行「検索条件の該当レコードが取得結果に含まれる（含まれない）こと」。本機能は**検索機能を持たない**（ids[]で選択商品を受けて編集表を開くのみ・md:36-37。画面項目一覧識別ID1〜16=0204:6260-6275に検索入力欄皆無。商品検索はM03-01の責務）。集約クエリ(md:82-89)は選択商品の内部横持ちであり利用者の検索ではない。「取得結果に含まれる」の意味成分は編集表集約(C-015)がbound被覆＝偽陰性なし。
  - **EX-D（-065,-066,-068・3件）**: 期待「削除条件の対象レコードが削除状態にならない/になること」。本機能は**レコード削除を行わない**（md:191「不要な削除は含まない」・DB操作は登録/更新のみ）。論理削除フラグも状態遷移も持たない。当機能に「削除」の具体referentが存在しない＝EX-D excluded（母集合観点テンプレ由来の過剰生成・B7）。「変更されない」意味はC-021(検証失敗で価格不変)がbound被覆。
  - **B14（-002・1件）**: 観点「未認証」・md:207-210で認証は管理画面共通のみ（機能固有アノテーション無し）。モジュール代表M03-01(最小機能ID)でカバー＝excluded。期待テキストが誤って「編集表が開く」を載せるが当挙動は-003/-040/-078/-079でbound済＝偽陰性なし。
  - **EX-S（-074・1件）**: 期待「本機能固有のファイルログは主題としないこと」（md:261の副作用・ログ表のスコープ外宣言）。これは"当機能固有のファイルログは扱わない"という**非挙動の宣言**であり試験対象が存在しない＝excluded（B15①③）。
  - **EX-R（-061,-073,-082,-083・4件）**: いずれも単一の具体挙動を持たない汎用・冗長スタブで個別bound行に被覆済み（B15④）。-073「成功・エラー・警告メッセージ」（md:260節見出し要約・成功=C-003/エラー=C-002/C-010で個別bound済・警告は特定referent無し）。-061「編集HTML200エラーフラッシュ もしくは一覧リダイレクト(ids空)」（失敗**分岐の要約**で、検証失敗200再表示=C-010・ids空一覧=C-002という**異なる**個別ケースに被覆済み＝異挙動のためB12強制共有不可）。-082/-083「画面表示データでエラーが表示されず継続できる」（汎用「エラーなし継続」で正常更新はC-003/C-020が被覆・本機能固有の判定基準なし）。

### 88対応表（期待テキスト→会計→候補ケース）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | dtb_product_class.buy_priceに統合(実在確認済み) | bound | C-023 |
| 002 | 未認証（共通認証のみ・機能固有ルール無し・md:207-210）＝共通認証機能へ委譲・M03-01代表でカバー（B14）。編集表挙動は-003等で被覆 | excluded | — |
| 003 | 同上（＝選択商品について編集表が開く） | bound | C-001 |
| 004 | エラーフラッシュのうえセッションのpage_noでGET /product/page/{page_no}へリダイレクト | bound | C-002 |
| 005 | 検証成功時は更新後resume=1付きで一覧へリダイレクト | bound | C-003 |
| 006 | セッションのpage_no(無ければ1)へ遷移 | bound | C-004 |
| 007 | メニューはproductとproduct_edit | bound | C-005 |
| 008 | .js-buy-price/.js-base-priceの入力で価格比率を再計算 | bound | C-006 |
| 009 | 必須バリデーションでエラーが表示され対象処理が完了しない | bound | C-007 |
| 010 | 必須バリデーションでエラーが表示されず対象処理を継続できる | bound | C-008 |
| 011 | POST値は読み取り専用(SP/MP/HP保存に使わない・pf陳腐化) | **TBD**（§9.1） | — |
| 012 | 相関バリデーションでエラーが表示され対象処理が完了しない | bound | C-010 |
| 013 | 相関バリデーションでエラーが表示されず継続できる | bound | C-011 |
| 014 | 相関バリデーションでエラーが表示されず継続できる | bound | C-011 (shared) |
| 015 | 相関バリデーションでエラーが表示され完了しない | bound | C-010 (shared) |
| 016 | DBとの相関バリデーションでエラーが表示されず継続できる | bound | C-012 |
| 017 | DBとの相関バリデーションでエラーが表示され完了しない | bound | C-013 |
| 018 | それ以前にコミットした商品グループは保存済みのまま | bound | C-014 |
| 019〜032 | 検索条件の該当レコードが取得結果に含まれる(含まれない) | **excluded** EX-A | — |
| 033 | 実行結果の該当レコードが取得結果に含まれる | bound | C-015 |
| 034 | 同上 | bound | C-015 (shared) |
| 035 | 同上 | bound | C-015 (shared) |
| 036 | 同上 | bound | C-015 (shared) |
| 037 | 登録内容の対象レコードが追加される(＝価格履歴INSERT) | bound | C-017 |
| 038 | 登録内容の対象レコードが追加されない(検証失敗) | bound | C-018 |
| 039 | 追加される | bound | C-017 (shared) |
| 040 | 選択商品について編集表が開く | bound | C-001 (shared) |
| 041 | 追加される | bound | C-017 (shared) |
| 042 | 追加される | bound | C-017 (shared) |
| 043 | 追加されない | bound | C-018 (shared) |
| 044 | 追加される | bound | C-017 (shared) |
| 045 | 追加されない | bound | C-018 (shared) |
| 046 | 追加される | bound | C-017 (shared) |
| 047 | 実行結果の対象レコードが追加される | bound | C-017 (shared) |
| 048 | dtb_product_class.standard_priceを対象規格すべて同一値で更新(pf陳腐化・ee規格別保存) | **TBD**（§9.1） | — |
| 049 | 更新内容の対象レコードの値が変更される | bound | C-020 |
| 050 | 値が変更されない | bound | C-021 |
| 051 | 値が変更される | bound | C-020 (shared) |
| 052 | テンプレートの有無判定に使う(SP/MP/HP規格ID) | bound | C-022 |
| 053 | 値が変更される | bound | C-020 (shared) |
| 054 | 値が変更される | bound | C-020 (shared) |
| 055 | 値が変更されない | bound | C-021 (shared) |
| 056 | 値が変更される | bound | C-020 (shared) |
| 057 | 値が変更されない | bound | C-021 (shared) |
| 058 | 値が変更される | bound | C-020 (shared) |
| 059 | 実行結果の対象レコードの値が変更される | bound | C-020 (shared) |
| 060 | 商品一覧ページへのHTTPリダイレクトと成功フラッシュ | bound | C-003 (shared) |
| 061 | 編集HTML200とエラーフラッシュ、もしくは一覧へのリダイレクトとエラーフラッシュ(ids空)＝失敗分岐の要約(検証失敗200=C-010・ids空一覧=C-002で個別被覆済) | **excluded** EX-R | — |
| 062 | 条件別に再計算され更新(buy_price) | bound | C-023 (shared) |
| 063 | 登録・更新で対象テーブルを直接保存する(不要な削除は含まない) | bound | C-017 (shared) |
| 064 | 買取が販売を超えるとadmin.product_class.buyprice_valid_bulk | **TBD**（§9.1） | — |
| 065 | 削除条件の対象レコードが削除状態にならない | **excluded** EX-D | — |
| 066 | 実行結果の対象レコードが削除状態になる | **excluded** EX-D | — |
| 067 | 編集画面再表示＋admin.product.to_show_complete | bound | C-013 (shared) |
| 068 | 実行結果の対象レコードが削除状態になる | **excluded** EX-D | — |
| 069 | 商品一覧画面に遷移する | bound | C-002 (shared・MSG-001後続) |
| 070 | 編集表の初期行数=商品ID×言語グループ数(md:82) | bound | C-015 (shared) |
| 071 | 表示順=商品ID降順・言語昇順(md:89) | bound | C-016 |
| 072 | 商品一覧画面に遷移する | bound | C-003 (shared) |
| 073 | 成功・エラー・警告メッセージ(汎用スタブ・成功=C-003/エラー=C-002/C-010で個別bound済) | **excluded** EX-R | — |
| 074 | 本機能固有のファイルログは主題としない | **excluded** EX-S | — |
| 075 | 保存ループは商品行ごとに履歴INSERTと通常規格UPDATE・1商品行ごとにコミット | bound | C-014 (shared) |
| 076 | 行ロック・悲観・楽観ロック・ロックファイルは使用しない(後勝ちの物理証明=要実機) | **TBD**（§9.1） | — |
| 077 | dtb_product_class.buy_priceに統合(実在確認済み) | bound | C-023 (shared) |
| 078 | 選択商品について編集表が開く | bound | C-001 (shared) |
| 079 | 同上(＝編集表が開く) | bound | C-001 (shared) |
| 080 | エラーフラッシュのうえページ番号でリダイレクト(ids空) | bound | C-002 (shared) |
| 081 | 検証成功時はresume=1付きで一覧へリダイレクト | bound | C-003 (shared) |
| 082 | 画面表示データでエラーが表示されず継続できる(汎用「エラーなし継続」スタブ・正常更新はC-003/C-020で被覆) | **excluded** EX-R | — |
| 083 | 画面表示データでエラーが表示されず継続できる(同上・汎用スタブ) | **excluded** EX-R | — |
| 084 | 保存時は全通常規格のdtb_product_class.buy_priceを再計算・更新 | bound | C-023 (shared) |
| 085 | dtb_product_class.standard_priceを対象規格すべて同一値で更新(pf陳腐化・ee規格別保存) | **TBD**（§9.1） | — |
| 086 | …[product_id](表示兼隠し・前画面商品ID表示) | bound | C-005 (shared) |
| 087 | …[product_class_id_nm](保存基点・0行スキップ) | bound | C-024 |
| 088 | テンプレートの有無判定に使う(SP/MP/HP規格ID) | bound | C-022 (shared) |

`func_scope_check` 判定: 親88/88会計済み・欠落0・理由なし重複0・補完4行は§4.2に実体掲載（母集合会計外）→**差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD=5件・改訂1でMajor是正により+4）

| test_id | 期待テキスト要旨 | TBD理由 | 関連L1 |
|---|---|---|---|
| -011 | POST値は読み取り専用である（SP/MP/HP基準価格） | pf md:111-113は「SP/MP/HPのPOST値は読み取り専用・保存処理はstandard_price_nmのみ用い更新計算に使わない」と記すが、ee実装は`standard_price_sp ?? standardPriceNm`等でSP/MP/HPのPOST値を**個別に受信し規格ごとに保存**する（`ProductBulkUpdateBuyPriceStoreAction.php:79`／`ProductClassRepository`のUPDATE `standard_price = CASE WHEN pc1.id=SP THEN :standardPriceSp …`）。pf期待テキスト（保存に使わない）はeeと食い違い一意判定不能＝**要実機**。SP/MP/HP欄がUI上readonlyである事実自体はExcel識別ID11-13/ee(readonly=true)確定だが期待テキストの主張点（POST値を保存に使わない）は成立しない | L1-M0310-023 |
| -048 | dtb_product_class.standard_priceを対象規格すべて同一値で更新 | pf md:102-103/110は「同一商品・同一言語・通常規格のすべての行に**同一値**で書き込む・状態別に分けない」と記すが、ee UPDATEは`standard_price = CASE WHEN pc1.id=NM THEN :standardPriceNm WHEN SP THEN :standardPriceSp WHEN MP … WHEN HP …`と**規格ごとに個別値**（SP/MP/HPはNM×割引率で算出）を書き込む。「すべて同一値」はeeと食い違い一意判定不能＝**要実機**。基準価格(NM)自体のNM規格への保存・再表示反映はExcel識別ID10確定・画面決定的でbound(C-020) | L1-M0310-020,022 |
| -064 | 買取が販売を超えると admin.product_class.buyprice_valid_bulk | pf md:199は「買取 vs 販売（NM）」バリデーションとキー `admin.product_class.buyprice_valid_bulk` を記すが、(1)ee `messages.{ja,en}.yaml`(9dbc4dd)に当キー**不在**（grep0件）、(2)Excelエラー制御(0204:6251)は買取vs基準のみで**買取vs販売未記載**。発火可否・文言を現行オラクルで固定できず**要実機**。買取vs基準(MSG-002)はee実在・-012/-015でbound | L1-M0310-031,042 |
| -076 | 行ロック・悲観・楽観ロック・ロックファイルは使用しない | 「楽観ロック無し・後勝ち」の**物理事実**は単純な順次2回保存では証明できない（楽観ロックがあっても順次保存は通る）。証明には更新前に2つの編集画面を開き後方を古い状態のまま送信する競合手順が必要＝**要実機**（画面帰結の保存成功はC-003等で被覆） | L1-M0310-035,025 |
| -085 | dtb_product_class.standard_priceを対象規格すべて同一値で更新 | -048と同一内容の別記載。ee規格別保存でpf「同一値」陳腐化＝**要実機**（同上） | L1-M0310-020,022 |

### 9.2 要実機（実行面の保留＝オラクル化不能ではない）

1. **セレクタ全数未確定**: カスタマイズ画面のtwig/Form照合を規約で行わないため、DOM id・CSRFフィールド実name・`bulk_update_product_price[...]`ネスト位置は全て要実機。
2. **C-093（店舗マスタ区分の在庫集計）**: 「TC東京(通販＋TC東京スマレジ)/支店/バックヤード」の区分は店舗マスタへの区分追加が前提（Excel L1-M0310-005）で、区分別集計値の投入・観測はクロス機能・要実機（仕様自体は確定＝TBDではない）。
3. **C-013/C-014の例外誘発**: 規格IDのDB削除タイミング・mtb未登録による not_found_nm_price の誘発はSEEDで制御可能だが、送信直前のDB状態操作の実装は要実機で確定。
4. **買取価格の再計算パス**: C-023はmtb一致(nm_price=1000)で buy_price=1000 が確定する低額帯パスを用い観測を決定的にしたが、率計算パス(高額帯/減額率あり)の具体値検証は率配列の実データ確認が要実機。
5. **SEED帯のid/シーケンス契約**: PostgreSQLシーケンス補正は `@TBD-D5`。

### 9.3 excluded=23件

§8集計表・根拠のとおり（EX-A 14／EX-D 3／B14 1／EX-S 1／EX-R 4=-061,-073,-082,-083）。全行の期待テキストを実引きで確認済み・偽陰性なし（取得結果含む=C-015被覆・削除状態=当機能に削除なし・未認証=M03-01代表・ファイルログ非主題=非挙動宣言・EX-R冗長スタブ=成功/エラー/失敗分岐/エラーなし継続は個別bound済み）。

## §10 齟齬・特記事項（片側断定せず記録）

### 10.1 極性対応の目視確認

| 極性対 | 該当行 | 判定 |
|---|---|---|
| エラー表示**され**/表示され**ず**(相関) | -012,-015(され) vs -013,-014(されず) | され→C-010(買取>基準)／されず→C-011(買取≦基準)。整合 |
| エラー表示**され**/表示され**ず**(DB相関) | -017(され) vs -016(されず) | され→C-013(規格ID不在→to_show_complete)／されず→C-012(規格実在で継続)。整合 |
| 追加され**る**/され**ない** | -037,-039,-041,-042,-044,-046,-047(肯定) vs -038,-043,-045(否定) | 肯定→C-017(更新成功で価格履歴INSERT)／否定→C-018(検証失敗で履歴非追加)。整合 |
| 変更され**る**/され**ない** | -049,-051,-053,-054,-056,-058,-059(肯定) vs -050,-055,-057(否定) | 肯定→C-020(価格更新反映)／否定→C-021(検証失敗で価格不変)。整合 |
| 削除状態に**なる**/なら**ない** | -066,-068(なる) vs -065(ならない) | 両極性ともEX-D(当機能に削除なし)＝極性によらず除外。「変更されない」意味はC-021被覆 |
| 含まれる/含まれない(検索条件) | -019〜-032 | 両極性ともEX-A(検索機能不存在)＝極性によらず除外。「実行結果…含まれる」(-033〜036)は主語が検索条件でなく編集表集約のためbound(C-015) |

### 10.2 相関バリデーションの2系統とExcel/pf md/ee三値差（-012〜-017・-064）

本機能の相関検証はpf md:199-201が2系統を記す: (a)買取vs基準(NM)＝`admin.product.buy_price_exceeds_standard`、(b)買取vs販売(NM)＝`admin.product_class.buyprice_valid_bulk`。
三値比較の結果:
- (a)買取vs基準: Excelエラー制御(0204:6251「買取価格(NM)＞基準価格(NM)チェック」)・pf md:200・ee messages.ja.yaml:1965 の**三者一致**（MSG-002）。よって-012/-015をboundとした（confirmed）。
- (b)買取vs販売: pf md:199に記載があるがExcel未記載・ee messagesキー不在。**一次資料間で食い違う**ため、pf md陳腐化規約に従い-064をTBD（要実機）とした（eeをオラクルにしない・pf md単独で必発と断定しない）。
相関「エラー表示されず継続」(-013/-014)は買取≦基準の正常系(C-011)で被覆し、(b)の不確定に依存しない。

### 10.3 「削除条件」観点と本機能に削除が無いことの確認（-065,-066,-068）

pf mdのDB操作(md:191)は「不要な削除は含まない」と明記し、当機能のDB副作用は dtb_product_class のUPDATEと dtb_price_history のINSERTのみ（md:177-191）。論理削除フラグ・状態遷移も無い。よって「削除条件/削除状態」観点は当機能に具体referentが無くEX-D excluded。誤読防止のため記録する（削除に見える唯一の近接挙動＝product_class_id_nm=0の保存スキップ(C-024)は「行を処理対象から外す」であってレコード削除ではない）。

### 10.4 母集合生成テンプレートについて

本機能の母集合88行も、pf md各節見出しを巡回する前提条件ラベルと固定の観点/期待テンプレートの直積で自動生成されている（観点ラベルと期待テキストの対応が実内容と一致しない行が大半・m03-01/02/11と同一方式）。判定は一貫して期待テキスト実内容のみで行った（§0）。

### 10.5 基準価格の規格別保存＝pf md陳腐化（-011/-048/-085 TBDの根拠・改訂1）

codex Gate C（Major）指摘を受けee実装を確認した結果、pf md:102-103,110-113の記述（基準価格を全通常規格に「同一値」で書き込む／SP/MP/HPのPOST値は「読み取り専用・保存に使わない」）は**ee実装と食い違う**。ee `ProductClassRepository` のネイティブ`UPDATE`は`standard_price = CASE WHEN pc1.id=:productClassIdNm THEN :standardPriceNm WHEN …Sp THEN :standardPriceSp WHEN …Mp THEN :standardPriceMp WHEN …Hp THEN :standardPriceHp ELSE pc1.standard_price END`と**規格ごとに個別のstandard_price**を書き込み、`ProductBulkUpdateBuyPriceStoreAction.php:79`は`standard_price_sp ?? standardPriceNm`等でSP/MP/HPのPOST値を個別に受信する（`BulkUpdateProductPriceDetailType.php:48-52`はreadonly属性だが、twigがNM×割引率で算出した各値を送信）。すなわち「同一値」でも「保存に使わない」でもない。pf md陳腐化規約（eeをオラクルにしない・食い違いは要実機TBD）に従い-011/-048/-085をTBDとした。**買取価格(NM)・基準価格(NM)のNM規格への保存・再表示反映（画面決定的・Excel識別ID5/10確定）はbound継続（C-020/C-023）**。買取価格の保存先が`dtb_product_class.buy_price`（統合済み）である点は`buy_price = COALESCE((SELECT price FROM mtb_buy_price_list WHERE nm_price=:nmPrice AND card_condition_id=… AND special_flg=…), :nmPrice)`でee確認済み。

## 観点補正

母集合の観点ラベルが期待テキスト実内容と乖離する行を是正する（母集合all_it_casesは不変・行は1:1。emitがconcretized.tsvの観点列を是正）。母集合末尾NNN｜正しい観点｜根拠。§8.1のNNNと一致。

| 母集合末尾NNN | 正しい観点 | 根拠（file:line・バレNNN） |
|---|---|---|
| 001 | 買取価格保存先/更新 | 期待「buy_priceに統合」＝買取価格更新(C-023)。md:177／§8.1-001 |
| 003 | 編集表表示 | 期待「同上=編集表が開く」。md:36／§8.1-003 |
| 007 | 表示要素 | 期待「メニューはproduct/product_edit」。md:48／§8.1-007 |
| 008 | JS価格比率再計算 | 期待「.js-buy-price/.js-base-priceで再計算」。md:49／§8.1-008 |
| 011 | 読み取り専用(SP/MP/HP)【TBD】 | 期待「POST値は読み取り専用」。md:111／§8.1-011（ee陳腐化でTBD・§10.5） |
| 040 | 編集表表示 | 期待「選択商品について編集表が開く」。md:36／§8.1-040 |
| 048 | 基準価格更新【TBD】 | 期待「standard_priceを対象規格すべて同一値で更新」。md:102／§8.1-048（ee規格別保存で陳腐化・TBD・§10.5） |
| 052 | 状態列テンプレ判定 | 期待「テンプレートの有無判定に使う」。md:117／§8.1-052 |
| 060 | 成功時出力(リダイレクト) | 期待「一覧へのHTTPリダイレクトと成功フラッシュ」。md:169／§8.1-060 |
| 062 | 買取価格再計算 | 期待「条件別に再計算され更新」。md:181／§8.1-062 |
| 063 | DB直接保存 | 期待「対象テーブルを直接保存(不要な削除含まない)」。md:191／§8.1-063 |
| 067 | エラー(規格ID不正) | 期待「編集画面再表示＋to_show_complete」。md:237／§8.1-067 |
| 069 | 画面遷移(一覧) | 期待「商品一覧画面に遷移する」(MSG-001後続)。md:247／§8.1-069 |
| 070 | 編集表初期行数 | 母集合プレースホルダの実挙動＝集約1行が商品ID×言語グループ。md:82／§8.1-070 |
| 071 | 表示順 | 母集合プレースホルダの実挙動＝商品ID降順・言語昇順。md:89／§8.1-071 |
| 072 | 画面遷移(一覧) | 期待「商品一覧画面に遷移する」。md:76／§8.1-072 |
| 075 | トランザクション境界 | 期待「商品行ごと履歴INSERT+規格UPDATE・1商品行ごとコミット」。md:280／§8.1-075 |
| 076 | 排他制御(ロック不使用)【TBD】 | 期待「行/悲観/楽観ロック・ロックファイル使用しない」＝後勝ちの物理証明は要実機。md:281／§8.1-076 |
| 077 | 買取価格保存先/更新 | 期待「buy_priceに統合」。md:177／§8.1-077 |
| 078 | 編集表表示 | 期待「選択商品について編集表が開く」。md:36／§8.1-078 |
| 079 | 編集表表示 | 期待「同上=編集表が開く」。md:36／§8.1-079 |
| 080 | ids空リダイレクト | 期待「エラーフラッシュ＋page_noリダイレクト」。md:38／§8.1-080 |
| 081 | 成功リダイレクト | 期待「resume=1付きで一覧へリダイレクト」。md:39／§8.1-081 |
| 084 | 買取価格更新 | 期待「全通常規格のbuy_priceを再計算・更新」。md:109／§8.1-084 |
| 085 | 基準価格更新【TBD】 | 期待「standard_priceを対象規格すべて同一値で更新」＝ee規格別保存で陳腐化・TBD。md:110／§8.1-085 |
| 086 | 商品ID表示 | 期待「…[product_id]」(表示兼隠し)。md:114／§8.1-086 |
| 087 | NM規格無しスキップ | 期待「…[product_class_id_nm]」(0行スキップ)。md:116／§8.1-087 |
| 088 | 状態列テンプレ判定 | 期待「テンプレートの有無判定に使う」。md:117／§8.1-088 |
| 064 | バリデーション(買取vs販売) | 期待「買取が販売を超えるとbuyprice_valid_bulk」＝TBD対象。md:199／§8.1-064 |
