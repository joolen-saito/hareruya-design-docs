# W2候補: m03-01 商品検索/一覧 — 実行可能グレード候補（母集合69全量踏破・excel-primary係数実測）

> 2026-07-27 ／ **候補グレード（candidate・D6前）・excel-primary（区分=カスタマイズ）**／
> **改訂1: codexレビューR1是正（Blocker1＋Major5）**＝
> (1) **L1-M0301-044を分割**: 販売価格(開始/終了)はExcelが明示値「0 -999999999」を持つため
> （沈黙ではない＝Interpretation A対象外）、Excel優先で新設L1-074（source_class=excel・max=999999999）へ
> 切り出し。L1-044は基準価格/買取価格（Excel未掲載＝真の沈黙）のみに限定しpf-fallback維持。
> pf側price_len=8（max 99999999）はExcelと数値が異なるため§10齟齬記録・期待値根拠には不採用。
> (2) **C-017の過剰主張是正**: 「実行時エラーになる／正常応答にならない」という必発断定を撤回し、
> 一次資料の逐語どおり「〜になり得る」（可能性）へ弱めた。
> (3) **L1-M0301-069の無根拠対応付けを削除**: Excel逐語は識別ID41-44だが、item-table実体は31-34
> （ラベル同名）であり、この41-44↔31-34の対応はExcel原本に明記が無い自己推論だった。
> claimを逐語どおり識別ID41-44の記述に限定し、item-table実体との対応は**要ソース確認(TBD)**へ後退。
> (4) **L1-026(MSG-001)のスコープ外を明確化**: 表示条件「パスワード変更を保存したとき」(md:107)は
> 別画面（パスワード変更画面）の導線であり本機能（検索・一覧）のスコープ外。母集合-053を
> bound→**excluded**へ再分類（C-053を候補行から削除）。
> (5) **L1-028〜034(MSG-003〜009)のスコープ外を明確化**: 一括削除・単体削除・状態変更は本書§3が
> 自ら明記する別導線（md:233,267）であり、これらをbound test caseの根拠に使うことは§3の記述と
> 矛盾していた（自己整合性エラー）。母集合-055,-056,-057,-059,-061を bound→**excluded(DELEG)**へ
> 再分類（C-055/056/057/059/061を候補行から削除。C-054=MSG-002は規格確認モーダルが本機能自身のJS挙動
> ＝md:53,55のためbound維持）。
> (6) **母集合会計を再計算**: bound 66→**60**／TBD 2（不変）／excluded 1→**7**（-009＋新規6件）。
> bound+TBD+excluded=69は不変。
> 詳細はcodex R1レビュー（`REVIEW_LEDGER.md`）および本書§10参照。
>
> **改訂2: codexレビューR2是正（Major2）**＝改訂1の振れすぎ／未完だった2点を精密化。
> (1) **C-017の未完是正**: 改訂1は必発断定を「なり得る」へ弱めたはずが、末尾に「正常な200一覧応答には
> ならないことの確認に限定する」という**新たな必発の非200断定**を書き足していた。pf md:70,184は
> 可能性のみを述べ200の余地を否定しない。→ 非200の必発断定を完全に削除し「なり得る（200が返る可能性も
> 一次資料は否定しない＝非200は必発でない）」に統一。
> (2) **C-055〜061の一律excludedは偽陰性（過剰除外）**: 改訂1は「削除・状態変更のPOST処理/DB効果は
> 別導線」という正しい観察から、「この画面自身が担うモーダル/メッセージ表示/遷移先」という別成分まで
> 一緒に除外してしまっていた。pf md:53（本機能自身のJS挙動＝一括削除Ajax・モーダル進捗表示・完了後
> リロード）とmd:109-115（本機能自身の表示メッセージ表＝MSG-003〜009のja/en文言・表示位置・遷移先）は
> **この画面自身の責務**として明記されており検証可能。→ 母集合-055,-056,-057,-059,-061を**bound復帰**
> （C-055/056/057/059/061を表示・モーダル・遷移の観測に限定して再掲載）。**削除/状態変更のDB効果の
> 正しさのみ**DELEG（検証対象外）として明確に分離。C-053（MSG-001・パスワード変更＝別画面）は
> 除外継続（着地先自体が別画面のため画面の責務にすら該当しない・性質が異なる）。
> (3) **会計再々計算**: bound 60→**65**／TBD 2（不変）／excluded 7→**2**（-009,-053のみ）。
> bound+TBD+excluded=69は不変。詳細は本書§8・§10「改訂2」参照。
>
> **改訂3: codexレビューR3是正（Major1・振り子の収束点）**＝
> C-017は改訂2で「発生し得る事象の記録」に限定し、エラー非発生・HTTP200も許容する観測へ弱めた。
> その結果、**母集合-017「DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと」・
> -067「…実行時エラーになり得ること」が要求する必須期待（エラー表示かつ対象処理未完了）を、
> このC-017は実際には検証できない**（200が返っても合格になってしまう緩さ）。にもかかわらずbound
> 計上していたのは過剰bound。→ **母集合-017,-067をbound→TBD(要ソース確認)へ移動**。
> 理由: 母集合は必発エラーを期待するが、一次資料(pf md:70,184)は「実行時エラーになり得る」と
> 可能性のみを述べ必発を断定しない＝現状の一次資料では母集合の期待値をboundできない。
> C-017の候補行は§4.1から削除（bound根拠として不成立のため）。L1-M0301-051のclaim自体は逐語のまま
> 保持するが、母集合-017/-067とのbindはTBDである旨を明記した。
> 会計再計算: bound 65→**63**（-2）／TBD 2→**4**（+2）／excluded 2（不変）。
> bound+TBD+excluded=69は不変。詳細は本書§8・§9・§10「改訂3」参照。
>
> **改訂4: codexレビューR4是正＋bound網羅スイープ（Major1）**＝
> R3と同じクラス（「boundにしているが、一次資料では母集合test_idの必須期待を充足検証できない行」）が
> 他にも無いか、**現行bound63件すべて**を対象に網羅スイープを実施。
> (1) **個別是正[-036]**: 一次資料md:133「カスタマイザが登録された場合に追加結合・条件が入る」は
> **条件付き正例**（カスタマイザ登録済み環境でのみ成立）。改訂2までのC-036はカスタマイザ**非搭載**
> 環境で「追加条件が発生しない」ことのみを確認しており、母集合-036が要求する「登録済み環境で正しく
> 反映され取得結果に含まれる」という正例側は未検証・実行保留のままだった＝現状の候補環境では
> 母集合の期待を充足検証できない。→ **母集合-036をbound→TBD(要ソース確認)へ移動**。C-036候補行は
> §4.1・§7・§9.2から削除。L1-M0301-042のclaim自体は保持、bindのみTBD。
> (2) **網羅スイープ**: 残る62件のbound候補すべてについて、母集合期待テキスト＋一次資料逐語を
> (a)必発断定の有無の食い違い (b)環境/前提条件の未充足 (c)cross-feature/別画面/要実機による観測不能、
> の3観点で再監査。**該当行は-036以外に無し**と判定（判定根拠の代表例は§9.4）。ただしC-068・C-069は
> 一次資料の「確認値（定言的事実）」部分と「〜になり得る（可能性）」部分が同一文に混在していたため、
> **bound判定根拠を確認値部分へ明確化**する表現の精密化を行った（会計上の異動なし）。
> (3) **会計再々々計算**: bound 63→**62**（-1）／TBD 4→**5**（+1）／excluded 2（不変）。
> bound+TBD+excluded=69は不変。詳細は本書§8・§9・§10「改訂4」参照。
>
> **改訂5: codexレビューR5是正（Major3）・bound_overreachクラスの決定的収束・source_class来歴同期**＝
> **以後、boundを維持するための言い換え・refinementは禁止し、以下のルールを機械的・一律に適用する**:
> 母集合test_idの期待が「〜になり得る/可能性」または「条件成立時のみの正例」であり、**1回の実行で
> pass/failを一意に判定できない**ものは、いかなる言い換えでもboundにできない＝TBD(要ソース確認)。
> 定言的な別副次事実にpass/fail判定を差し替えることは母集合期待の充足検証にはならない。
> (1) **[bound_overreach是正] -068**: 母集合期待「フォームに無いキーだけが残るとSymfonyフォームが
> エラーに**なり得る**」＝可能性。改訂4は「stock配列によるDB側絞込みが行われないこと」という**別の
> 定言的事実**をpass/fail判定の根拠に差し替えていたが、これは母集合-068が要求する事象
> （フォームエラーの発生）そのものの充足検証にはならない＝ルール違反。**改訂4のrefinementを撤回し、
> -068をbound→TBDへ移動**。
> (2) **[bound_overreach是正] -069**: 母集合期待「固定文字列プレースホルダのまま残り検索結果と
> 一致しない表示に**なり得る**」＝可能性。改訂4は「固定文字列プレースホルダの存在」という別の定言的
> 事実へ判定根拠を差し替えていたが、母集合が要求する事象（表示の不一致）そのものは可能性表現のまま
> であり充足検証にならない＝ルール違反。**-069をbound→TBDへ移動**。
> （-068/-069はR3の-017/-067・R4の-036と完全同型のbound_overreachであり、本改訂で同一ルールにより
> 機械的に処理した。）
> (3) **[source_class来歴同期]** L1-M0301-026・L1-M0301-028〜034は本書§1で
> source_class=「pf-fallback＋共有インフラ逐語」だが、oracle_draft.jsonは全件`source_class:"pf-fallback"`
> のみで共有インフラ(messages.ja/en.yaml)の来歴表記が§1と不一致だった。→ 該当8claimのoracle JSONの
> `source_class`を`"pf-fallback＋共有インフラ逐語"`へ修正しmd§1と完全一致させた（yaml file:line自体は
> 既に各claimの`source`フィールドに保持済み）。**全74claimについてmd↔oracleのsource_class一致を再点検**し、
> 他の不一致（L1-005・L1-074の注記的な補足はsource/noteに既存citation済みで実質整合・変更不要）が
> ないことを確認した。
> (4) **[bound_overreach完全払拭のための最終自己監査]** -068/-069を含め、現行bound全行を「可能性/
> 条件付き正例をboundにしていないか」で再点検した。該当は-068/-069の2件のみで、他に該当なし
> （§9.4更新参照）。
> **会計再々々々々計算**: bound 62→**60**（-2）／TBD 5→**7**（+2）／excluded 2（不変）。
> bound+TBD+excluded=69は不変。詳細は本書§8・§9・§10「改訂5」参照。
>
> **実装/実走なし。O5未確定。O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過を
> いずれも主張しない**。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 正典（型）: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`。
> DoD雛形（同一区分の完成例・§0〜§10の構造を踏襲）:
> `integration_test/e2e/exec/_drafts/m03-11_admin_product_product_category_register_edit_executable_draft.md`。
> **著者はレビューしない**（codexが別途レビュー）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝
> `e2e/fixtures/oracle/_drafts/m03-01_admin_product_product_search_list_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下には書かない**。
> **母集合69全数会計（改訂5）＝bound 60／TBD 7／excluded 2（§8）**。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**:
  `excel_to_html/output/0204_基本設計仕様書(商品管理).html`（最終コミット
  **0e65e6a60e13ff4f5175af1a450c1b61a0b5b14b**）。M03-01は**2シート**にまたがる:
  - sheet-3「商品マスター(検索入力)」＝行1075〜1376（機能No=M03-01・行1088／機能名「商品マスター(検索入力)」・
    行1089／作成2025-05-27・更新2025-08-02・行1085,1087）。
  - sheet-4「商品マスター(検索結果)」＝行1377〜1692（機能No=M03-01・行1390／機能名「商品マスター(検索結果)」・
    行1391／作成2025-06-11・更新2025-09-16・行1387,1389）。
  両シートとも後半（sheet-3:行1263-、sheet-4:行1579-）は pf現行mdの埋込複製
  （`Source: functions/pf-eccube3/m03-01_admin_product_product_search_list.md` と自己申告=
  sheet-3行1266・sheet-4行1582）のため、**当該範囲は引用元をpf mdの行で表記**し二重ソース化しない。
  以下「0204 sheet-3:行」「0204 sheet-4:行」。
- **pf現行md（回帰先・source_class=pf-fallback）**:
  `functions/pf-eccube3/m03-01_admin_product_product_search_list.md`
  （最終コミット **3875ca55ecc32f97294f2ba42f5cdffb9a40ae2c**／
  repo HEAD観測値 **fadbfc6ebf5373ee62d0d47cddd6809369dd8e35**・branch feat/front-e2e-coverage・
  2026-07-27観測。以下「md:行」）。区分宣言「本機能のカスタマイズ区分は『カスタマイズ』であり、
  検索・ソート・ページングなどの挙動の参照は現行リポ（pf-eccube3）、DB関連（テーブル名・列名・保存先・扱い）は
  ec-cube-enterprise を正とする。」（md:9）。
- fid_kubun.tsv（D1・SHA先頭 **44fbf02f1e4c**）行169:
  `M03-01｜m03-01_admin_product_product_search_list｜商品検索/一覧｜対象｜カスタマイズ｜
  pf-eccube3/m03-01_admin_product_product_search_list.md｜excel-primary+pf-fallback｜区分不明=0`
  → **excel優先・不足subjectのみpf回帰。standard-src禁止**（暫定付与・確定はD6）。
- 共有インフラ（メッセージ実文言の逐語引用のみ許可）: ee
  `/home/y-saito/Developments/ec-cube-enterprise` コミット
  `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51` の
  `src/Eccube/Resource/locale/messages.{ja,en}.yaml`。
  **キー同定はpf md記載のメッセージ表のja文言との完全一致検索のみで行い、ee実装コード
  （Controller/Form/twig）を鍵特定にも期待値にも使っていない**（ee実ソースはL1のsource/quoteに一切使用しない。
  照合補助のみ）。
- **方針適用（Interpretation A・規約リテラル）**: カスタマイズ機能でExcelが制約値を空欄「-」または
  空セルにしている項目（必須・最大値・初期値等）は、**pf現行回帰＝pf md
  （`functions/pf-eccube3/`）の値を踏襲値としてboundしてよい**（TBDにしない）。
  値 `eccube_price_len` 確認値8／`eccube_int_len` 確認値9等はpf md確認値を採用。
- 母集合: baseline `integration_test/all_it_cases.tsv`（SHA先頭 **7911f190d273**）M03-01全**69行**
  （IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-001〜069。以下「-nnn」）。
  実行方法内訳: Playwright 55／非UI 14（母集合の「実行方法」列・観測値。§7参照）。
- **判定原則（W0教訓1）**: 観点ラベルはノイズ。bindは各行の**「期待結果」実テキスト**で判定
  （§8に全69行の期待要旨を併記）。本機能は前提条件列に「M03-01-MSG-001を試験できる状態」等の
  ラベルが転写されているが、bindは期待列のみで実施。
- **m03-11との違い（重要・誤読防止）**: m03-11（カテゴリ登録編集）は「検索機能が存在しない」ため
  検索条件系の母集合行（EX-A相当）を全数excludedとしたが、**M03-01は検索・一覧機能そのもの**であり、
  検索条件系の母集合行（-019〜-032）はpf md業務ルール・計算節（md:119-133）に7種の具体的フィルタ規則が
  明記されているため**大半がboundする**（§8参照）。機能ごとに独立判定する（m03-11の判定をそのまま
  転用しない）。

## §1 L1原子オラクル表

全74claim（改訂1でL1-074新設＋L1-044/069是正）。**source_class列は excel／pf-fallback のみ
（standard-src該当なし・design該当なし）**。L1-026,028〜034には改訂1でスコープ外注記を付与
（bound根拠には使わない。§8/§9参照）。
en文言はen一次資料（messages.en.yaml）逐語のみ。ja翻訳による生成ゼロ。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0301-001 | nav | ナビから商品一覧を開く `GET /{admin_route}/product` はフォーム既定値で検索ビューデータをセッションへ書き込みページ1を表示する | 「ナビから商品一覧を開く \| `GET /{admin_route}/product` \| フォーム既定値で検索ビューデータをセッションへ書き込み、ページ 1 を表示する。」 | md:36 | pf-fallback | 0 |
| L1-M0301-002 | nav | 「検索する」で送信 `POST /{admin_route}/product` は検証成功で条件をセッション保存しページ番号を1にし一覧を組み立てる。失敗時はエラーメッセージ＋詳細検索枠を開いた状態で返す | 「「検索する」で送信 \| `POST /{admin_route}/product` \| 検証に成功すれば条件をセッションへ保存しページ番号を 1 にし、同一条件で一覧を組み立てる。失敗すればエラー用メッセージとともに詳細検索枠を開いた状態で返す。」 | md:37 | pf-fallback | 0 |
| L1-M0301-003 | nav | ページネーションで N ページへ `GET /{admin_route}/product/page/N` はセッションの検索条件とページ番号を更新しNページ目を表示する | 「ページネーションで N ページへ \| `GET /{admin_route}/product/page/N` \| セッションの検索条件とページ番号を更新し、N ページ目を表示する。」 | md:38 | pf-fallback | 0 |
| L1-M0301-004 | nav | ソートアイコン押下 `POST /{admin_route}/product`（フォームそのまま）は隠しフィールド sortkey・sorttype を更新して送信、ページ番号は1にリセットされるPOST分岐に入る | 「ソートアイコン押下 \| `POST /{admin_route}/product`（フォームはそのまま） \| 隠しフィールド `sortkey`・`sorttype` を更新して送信し、ページ番号は 1 にリセットされる POST 分岐に入る。」 | md:39 | pf-fallback | 0 |
| L1-M0301-005 | nav | 表示件数プルダウン変更 `GET .../page/1?page_count=…` は mtb_page_max に存在する件数ならセッション保存しその件数で分割する（存在候補値は0204 sheet-4識別ID:10の件数プルダウン選択肢） | 「表示件数プルダウン変更 \| `GET /{admin_route}/product/page/1?page_count=…` \| `mtb_page_max` に存在する件数ならセッションへ保存し、その件数で分割する。」／「件数 \| 単一選択 \| … \| 選択肢: 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件」 | md:40 | pf-fallback（選択肢候補値のみexcel＝0204 sheet-4:1500） | 0 |
| L1-M0301-006 | nav | 一覧表示データプルダウン変更 `GET .../page/{page_no}?mode=…` はセッションの表示モードを更新し同一ページ番号で再描画する | 「一覧表示データプルダウン変更 \| `GET /{admin_route}/product/page/{page_no}?mode=…` \| セッションの表示モードを更新し、同一ページ番号で再描画する。」 | md:41 | pf-fallback | 0 |
| L1-M0301-007 | nav | 商品名リンク `GET /{admin_route}/product/product/{id}/edit` は商品編集画面へ遷移する | 「商品名リンク \| `GET /{admin_route}/product/product/{id}/edit` \| 商品編集画面へ遷移する。」 | md:42 | pf-fallback | 0 |
| L1-M0301-008 | nav | 他画面から一覧へ戻る `GET /{admin_route}/product?resume=1` はセッションに保存されたページ番号を復元し検索条件もセッションから復元する | 「他画面から一覧へ戻る \| `GET /{admin_route}/product?resume=1` \| セッションに保存されたページ番号を復元し、検索条件もセッションから復元する。」 | md:43 | pf-fallback | 0 |
| L1-M0301-009 | nav | ホームの在庫切れ件数から遷移 `GET /{admin_route}/search_nonstock` → リダイレクトで `GET /{admin_route}/product/page/1`（詳細は別節・エッジケース参照） | 「ホームの在庫切れ件数から遷移 \| `GET /{admin_route}/search_nonstock` → リダイレクトで `GET /{admin_route}/product/page/1` \| 別節およびエッジケース参照。」 | md:44 | pf-fallback | 0 |
| L1-M0301-010 | display_field | 表示要素: 見出しは商品一覧。上部は search-box-inner 内の検索フォーム。商品名(日/英)入力と詳細検索アコーディオン(Bootstrap collapse・初期は開)。詳細内はカード名/ID/コード/カテゴリ/公開状態/エキスパンション/レアリティ/言語/状態/Foil/フレーム/プロモ/タグ/略称タグ/販売価格帯/在庫帯/期間別販売数/規格更新日帯/売上分析タグ/高額商品/部門/棚番号。隠し項目に一括キーワードとソート用2項目。送信ボタン下に件数見出し・search_items.twig条件サマリ・結果テーブル・ページネーション | 「見出しは商品一覧。上部は `search-box-inner` 内の検索フォーム。商品名（日／英）入力と詳細検索アコーディオン（Bootstrap の collapse、初期は開）。詳細内はカード名、ID、コード、カテゴリ、公開状態、エキスパンション、レアリティ、言語、状態、Foil、フレーム、プロモ、タグ、略称タグ、販売価格帯、在庫帯、期間別販売数の期間・数量帯、規格更新日帯、売上分析タグ、高額商品、部門、棚番号、エンティティ拡張の自動描画項目。隠し項目に一括キーワード（一覧では非表示）とソート用 2 項目。送信ボタンの下に件数見出し、`search_items.twig` による条件サマリ、結果テーブル（チェック、ID、名前、規格ごとのコード・言語・状態・価格など）、ページネーション。」 | md:52 | pf-fallback | 0 |
| L1-M0301-011 | behavior | JS挙動: 複数選択フィールドに select2（カテゴリ・エキスパンション・タグ・略称タグ・売上分析タグ・部門・棚番号）。function.js の .search-clear で #search_form 内をクリア(CSRF hiddenは残す)。.js-listSort クリックで隠しsortkey/sorttype更新しフォーム送信。件数/CSV/表示モードselectは変更時URL遷移。一括削除はAjaxで各行削除URLを順次呼びモーダル進捗表示(完了後リロード)。規格確認ボタンはAjaxでモーダル本文差し替え。詳細検索collapse表示時はボタンアイコンとaria-expandedを更新 | 「複数選択フィールドに select2（カテゴリ、エキスパンション、タグ、略称タグ、売上分析タグ、部門、棚番号）。`function.js` の `.search-clear` で `#search_form` 内の入力・選択をクリア（CSRF 用 hidden は残す）。ソートは `.js-listSort` クリックで隠し `sortkey`・`sorttype` を更新してフォーム送信。件数・CSV・表示モードの select は変更時に URL へ遷移。一括削除は Ajax で各行の削除 URL を順に呼びモーダルで進捗表示（完了後リロード）。規格確認ボタンは Ajax でモーダル本文を差し替え。詳細検索の collapse 表示時はボタンのアイコンと `aria-expanded` を更新。」 | md:53 | pf-fallback | 0 |
| L1-M0301-012 | display_field | モーダル・ポップアップ: 規格一覧確認モーダル、一括完全削除モーダル。単体削除確認は本テンプレート範囲外の別導線に依存する場合がある | 「規格一覧確認モーダル、一括完全削除モーダル。単体削除確認は本テンプレート範囲外の別導線に依存する場合がある。」 | md:55 | pf-fallback | 0 |
| L1-M0301-013 | behavior | 処理フロー1-2: 管理画面の認証・共通制約を通過。SearchProductType でフォームビルダー生成、ADMIN_PRODUCT_INDEX_INITIALIZE をディスパッチ | 「1. 管理画面の認証・共通制約を通過する。」「2. `SearchProductType` でフォームビルダーを生成し、`ADMIN_PRODUCT_INDEX_INITIALIZE` をディスパッチする。」 | md:63-64 | pf-fallback | 0 |
| L1-M0301-014 | behavior | 処理フロー3: page_count が mtb_page_max.name のいずれかと一致すればセッション eccube.admin.product.search.page_count に保存。不一致ならセッション値、無ければ eccube_default_page_count（確認値10）を使う | 「表示件数はリクエストの `page_count` が `mtb_page_max.name` のいずれかと一致すればその値をセッション `eccube.admin.product.search.page_count` に保存する。一致しない場合はセッション値があればそれを使い、なければ設定 `eccube_default_page_count`（確認値として app のパラメータで 10）を使う。」「表示件数 \| キー `eccube.admin.product.search.page_count`。」 | md:65,317 | pf-fallback | 0 |
| L1-M0301-015 | behavior | 処理フロー4: mode が正の整数ならセッション eccube.admin.product.search.display_mode に保存。無ければセッション値を使う | 「一覧表示データモードはリクエストの `mode` が正の整数ならセッション `eccube.admin.product.search.display_mode` に保存する。無ければセッション値を使う。」「一覧表示データモード \| キー `eccube.admin.product.search.display_mode`。」 | md:66,318 | pf-fallback | 0 |
| L1-M0301-016 | behavior | 処理フロー5: POSTでフォーム送信時handleRequest。妥当ならページ番号を1にしFormUtil::getViewDataの検索ビューデータをセッションeccube.admin.product.searchへ保存、eccube.admin.product.search.page_noに1を保存 | 「POST でフォームが送られた場合は `handleRequest` する。妥当ならページ番号を 1 にし、`FormUtil::getViewData` で得た検索ビューデータをセッション `eccube.admin.product.search` に保存し、`eccube.admin.product.search.page_no` に 1 を保存する。」「検索ビューデータ \| キー `eccube.admin.product.search`。POST 成功時と初期 GET で更新。ページ GET と resume で読む。」「ページ番号 \| キー `eccube.admin.product.search.page_no`。」 | md:67,315-316 | pf-fallback | 0 |
| L1-M0301-017 | behavior | 処理フロー5後段: 不妥当ならエラーフラグ付きでTwigを返し、一覧は空相当の扱いになる | 「不妥当ならエラーフラグ付きで Twig を返し、一覧は空相当の扱いになる。」 | md:67 | pf-fallback | 0 |
| L1-M0301-018 | behavior | 処理フロー6+遷移状態引継ぎ: GETでpage_noありかresumeクエリありはセッションからページ番号と検索ビューデータを読みFormUtil::submitAndGetDataで正規化。それ以外のGETはページ1とし既定の検索ビューデータをセッションへ書き直す（初期表示は公開状態=公開のみ既定チェック）。resume=1は一覧側が上書きしない限りセッション保持 | 「GET の場合、パスに `page_no` があるか `resume` クエリがあるときはセッションからページ番号と検索ビューデータを読み、`FormUtil::submitAndGetData` で正規化した配列を検索データとする。それ以外の GET はページ 1 とし、空ではない既定の検索ビューデータをフォームから取り出してセッションへ書き直す（初期表示では「公開状態」は公開のみが既定チェックされる）。」「編集などから `resume=1` で戻る \| セッションの検索ビューデータとページ番号は一覧側が上書きしない限り保持 \| 保存されていたページ番号と条件で一覧を組み立てる」「初回 `GET /product`（`resume` も `page_no` も無い） \| フォーム既定の検索ビューデータでセッションを上書き \| 公開のみ等の既定チェックが載った状態になる」 | md:68,274-275 | pf-fallback | 0 |
| L1-M0301-019 | behavior | 処理フロー7: ProductRepository::getQueryBuilderBySearchDataForAdmin に検索データを渡し、ADMIN_PRODUCT_INDEX_SEARCH でクエリビルダを公開する | 「`ProductRepository::getQueryBuilderBySearchDataForAdmin` に検索データを渡し、`ADMIN_PRODUCT_INDEX_SEARCH` でクエリビルダを公開する。」 | md:69 | pf-fallback | 0 |
| L1-M0301-020 | behavior | 処理フロー8: sortkeyが列マップに無い・値がstatus・値が文字列codeのいずれかなら通常モード、それ以外はwrap-queries付与。列マップに無い値がリポジトリまで渡るとorderByで未定義添字参照となり先に失敗する | 「ページネーションはコントローラ側で、`sortkey` が列マップに無い・または値が `status`・または値が文字列 `code` のいずれかなら通常モード、それ以外なら `wrap-queries` を付ける。列マップに無い値がリポジトリまで渡った場合は `orderBy` で未定義添字参照となり先に失敗する。」 | md:70 | pf-fallback | 0 |
| L1-M0301-021 | behavior | 処理フロー9: Twigにフォーム・ページネーション・件数・表示モード・拡張CSVの一覧を渡して描画する | 「Twig にフォーム、ページネーション、件数、表示モード、拡張 CSV の一覧を渡して描画する。」 | md:71 | pf-fallback | 0 |
| L1-M0301-022 | behavior | ホームからの在庫切れリンク: セッションeccube.admin.product.searchにstockキーへ在庫なし定数配列のみの連想配列を保存し、admin_product_pageでpage_noが1となるようリダイレクト | 「セッション `eccube.admin.product.search` に、`stock` キーへ在庫なしを表す定数の配列を載せた連想配列だけを保存する。」「`admin_product_page` で `page_no` が 1 となるようリダイレクトする。」 | md:75-76 | pf-fallback | 0 |
| L1-M0301-023 | db_effect | 一覧総件数: Knpページネータがクエリに対して件数を数える。一覧本体と同じクエリビルダを渡す | 「Knp ページネータがクエリに対して件数を数える。一覧本体と同じクエリビルダを渡す。」 | md:84 | pf-fallback | 0 |
| L1-M0301-024 | display_field | 画面に出す規格行: 商品ごとにLanguageとCardConditionが両方存在する規格だけを抽出して行を並べる。該当が無い商品は空セルをcolspanで埋める | 「商品ごとに、`Language` と `CardCondition` が両方存在する規格だけを抽出して行を並べる。該当が無い商品は空セルを colspan で埋める。」 | md:85 | pf-fallback | 0 |
| L1-M0301-025 | behavior | ソート判定順序: sortkey空/未定義→update_date降順+id降順のみ／sortkey該当+sorttype=a→指定列昇順+update_date降順+id降順／sortkey該当+sorttype≠a→指定列降順+update_date降順+id降順。列マップは商品ID・商品名・規格コード・規格在庫数量相当・公開状態・登録日・更新日に対応。クライアント側は同一sortkey連続クリックで昇順降順トグル | 「1 \| `sortkey` が空または未定義 \| `p.update_date` 降順、その後 `p.id` 降順のみ。」「2 \| `sortkey` が列マップに存在し、`sorttype` が文字 `a` \| 指定列昇順、その後 `p.update_date` 降順、`p.id` 降順。」「3 \| `sortkey` が列マップに存在し、`sorttype` が `a` 以外 \| 指定列降順、その後 `p.update_date` 降順、`p.id` 降順。」「列マップは実装上、商品 ID、商品名、規格コード、規格の在庫数量相当、公開状態、商品登録日、商品更新日に対応するクエリ式となる。」「クライアント側では、同一 `sortkey` を連続クリックすると昇順・降順がトグルする。」 | md:93-97,99 | pf-fallback | 0 |
| L1-M0301-026 | message | 【改訂1・スコープ外注記】M03-01-MSG-001 パスワード変更保存成功: ja「パスワードを更新しました」／en "Your password has been changed"。表示位置=管理画面上部。パスワード変更画面に遷移する。**表示条件がパスワード変更画面（別導線）のため本機能（検索・一覧）のbound test caseの根拠には使わない**（情報保持のみ・母集合-053はexcludedへ再分類・§8/§9） | 「M03-01-MSG-001 \| 管理画面上部 \| パスワードを更新しました \| Your password has been changed \| パスワード変更を保存したとき \| パスワード変更画面に遷移する」／`admin.change_password.password_changed: パスワードを更新しました`／`admin.change_password.password_changed: Your password has been changed` | md:107 / messages.ja.yaml:1908 / messages.en.yaml:1886 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0301-027 | message | M03-01-MSG-002 規格情報取得失敗: ja「Failed」／en "Failed"。表示位置=画面中央(ダイアログ)。エラーを表示し商品検索・一覧画面に留まる（共有インフラ検索でキー未特定=grep実測0件・ja/enとも同一literal "Failed" としてpf md表を直接根拠とする） | 「M03-01-MSG-002 \| 画面中央(ダイアログ) \| Failed \| Failed \| 商品の規格情報の取得に失敗したとき \| エラーを表示し、商品検索・一覧画面に留まる」 | md:108 | pf-fallback | 1 |
| L1-M0301-028 | message | 【改訂2再是正】M03-01-MSG-003 一括削除開始: ja「削除中...」／en "Deleting..."。表示位置=画面中央(モーダル)。モーダルは開いたまま。**表示・モーダルJS挙動は本機能自身のフロント挙動（md:53「一括削除はAjaxで各行の削除URLを順に呼びモーダルで進捗表示（完了後リロード）」）に明記された一覧画面自身の振る舞い＝bound**（母集合-055はbound維持）。**ただし実際の削除POST処理・DB副作用の正しさは別導線（DELEG）であり本claimの検証対象に含まない** | 「M03-01-MSG-003 \| 画面中央(モーダル) \| 削除中... \| Deleting... \| 選択した商品の一括削除を開始したとき \| モーダルは開いたまま」／`admin.product.permanently_delete__in_progress: 削除中...`／`admin.product.permanently_delete__in_progress: Deleting...` | md:109 / messages.ja.yaml:2050 / messages.en.yaml:1929 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0301-029 | message | 【改訂2再是正】M03-01-MSG-004 一括削除完了: ja「商品の削除処理が完了しました」／en "Product has been deleted successfully."。表示位置=画面中央(モーダル)。モーダルを閉じて商品検索・一覧画面を再読み込みする。**完了時のモーダル閉鎖＋リロードは本機能自身のJS挙動（md:53「完了後リロード」）＝bound**（母集合-056はbound維持）。**実際の削除POST処理・DB副作用の正しさは別導線（DELEG）** | 「M03-01-MSG-004 \| 画面中央(モーダル) \| 商品の削除処理が完了しました \| Product has been deleted successfully. \| 選択した商品の一括削除処理が完了したとき \| モーダルを閉じて商品検索・一覧画面を再読み込みする」／`admin.product.permanently_delete__complete_message: 商品の削除処理が完了しました`／`admin.product.permanently_delete__complete_message: Product has been deleted successfully.` | md:110 / messages.ja.yaml:2051 / messages.en.yaml:1930 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0301-030 | message | 【改訂2再是正】M03-01-MSG-005 商品削除完了: ja「削除しました」／en "Deleted"。表示位置=管理画面上部。商品検索・一覧画面に遷移する。**この画面へのフラッシュ表示・着地（遷移先）はM03-01自身の表示メッセージ表（md:111）に明記された挙動＝bound**（母集合-057はbound維持）。**削除操作そのもののPOST処理・DB副作用の正しさは別導線（DELEG）であり本claimはフラッシュ文言＋遷移先の観測に限定する** | 「M03-01-MSG-005 \| 管理画面上部 \| 削除しました \| Deleted \| 商品を削除したとき \| 商品検索・一覧画面に遷移する」／`admin.common.delete_complete: 削除しました`／`admin.common.delete_complete: Deleted` | md:111 / messages.ja.yaml:1593 / messages.en.yaml:1638 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0301-031 | message | 【改訂2再是正】M03-01-MSG-006 完全削除失敗: ja「関連するデータがあるため『%name%』を削除できませんでした／削除に失敗しました」／en "Sorry, we are unable to delete %name%, because it has related data. ／ Failed to delete"。エラーを削除確認モーダル内に表示し完了操作後に商品一覧画面へ遷移。**モーダル内エラー表示・完了後遷移は本機能自身のモーダルUI挙動＝bound（母集合対応行は無いため情報保持だが、bound根拠不使用の記載は撤回）**。**削除失敗の判定ロジック（FK制約等）そのものは別導線（DELEG）** | 「M03-01-MSG-006 \| 管理画面上部 \| 関連するデータがあるため「%name%」を削除できませんでした ／ 削除に失敗しました \| Sorry, we are unable to delete %name%, because it has related data. ／ Failed to delete \| … \| エラーを削除確認モーダル内に表示し、完了操作後に商品一覧画面へ遷移する」／`admin.common.delete_error_foreign_key: "関連するデータがあるため「%name%」を削除できませんでした"`／`admin.common.delete_error: 削除に失敗しました`／`admin.common.delete_error_foreign_key: "Sorry, we are unable to delete %name%, because it has related data."`／`admin.common.delete_error: Failed to delete` | md:112 / messages.ja.yaml:1595,1594 / messages.en.yaml:1642,1639 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0301-032 | message | 【改訂2再是正】M03-01-MSG-007 状態変更適用: ja「%status%: %count%件が正常に適用されました」／en "%status%: %count% item(s) is/are successfully applied."。商品検索・一覧画面に遷移する。**この画面へのフラッシュ表示・着地はM03-01自身の表示メッセージ表（md:113）に明記された挙動＝bound**（母集合-059はbound維持）。**状態変更処理そのもののPOST処理・DB副作用の正しさは別導線（DELEG）であり本claimはフラッシュ文言＋遷移先の観測に限定する** | 「M03-01-MSG-007 \| 管理画面上部 \| %status%: %count%件が正常に適用されました \| %status%: %count% item(s) is/are successfully applied. \| 選択した商品の状態変更が1件以上完了したとき \| 商品検索・一覧画面に遷移する」／`admin.product.bulk_change_status_complete: "%status%: %count%件が正常に適用されました"`／`admin.product.bulk_change_status_complete: "%status%: %count% item(s) is/are successfully applied."` | md:113 / messages.ja.yaml:1957 / messages.en.yaml:1910 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0301-033 | message | 【改訂2再是正】M03-01-MSG-008 既削除: ja「既に削除されています」／en "No data to delete"。商品検索・一覧画面に遷移する。**この画面へのフラッシュ表示・着地はM03-01自身の表示メッセージ表（md:114）に明記された挙動＝bound**（母集合-061はbound維持）。**削除試行の判定ロジックそのものは別導線（DELEG）であり本claimはフラッシュ文言＋遷移先の観測に限定する** | 「M03-01-MSG-008 \| 管理画面上部 \| 既に削除されています \| No data to delete \| 削除しようとした商品がすでに削除されていたとき \| 商品検索・一覧画面に遷移する」／`admin.common.delete_error_already_deleted: 既に削除されています`／`admin.common.delete_error_already_deleted: No data to delete` | md:114 / messages.ja.yaml:1596 / messages.en.yaml:1643 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0301-034 | message | 【改訂2再是正】M03-01-MSG-009 削除確認: ja「商品を削除してよろしいですか？」／en "Are you sure to delete this product?"。モーダル内「完全に削除」で選択済み商品の完全削除処理を開始。キャンセル時は処理しない。**確認ダイアログ自体はサーバ通信前のクライアント側モーダルUI＝本機能自身の挙動としてbound（母集合対応行は無いため情報保持だが、bound根拠不使用の記載は撤回）**。**「完全に削除」選択後の実処理は別導線（DELEG）** | 「M03-01-MSG-009 \| 画面中央(モーダル) \| 商品を削除してよろしいですか？ \| Are you sure to delete this product? \| … \| モーダル内の「完全に削除」で、選択済み商品の完全削除処理を開始する。キャンセル時は処理しない」／`admin.product.permanently_delete__confirm_message: 商品を削除してよろしいですか？`／`admin.product.permanently_delete__confirm_message: Are you sure to delete this product?` | md:115 / messages.ja.yaml:2049 / messages.en.yaml:1928 | pf-fallback＋共有インフラ逐語 | 1 |
| L1-M0301-035 | validation | 業務ルール: 一覧の抽出は設定済みの条件だけをANDで付与。文字列の部分一致では%と_をエスケープする | 「一覧の抽出はリポジトリへ渡した検索データに対し、設定済みの条件だけを AND で付与する。文字列の部分一致では `%` と `_` をエスケープする。」 | md:119 | pf-fallback | 0 |
| L1-M0301-036 | validation | 業務ルール: カテゴリは選択ノードとその子孫をまとめ、商品カテゴリがそのいずれかに該当する商品だけを残す | 「カテゴリは選択ノードとその子孫をまとめ、商品カテゴリがそのいずれかに該当する商品だけを残す。」 | md:121 | pf-fallback | 0 |
| L1-M0301-037 | validation | 業務ルール: 言語は3種すべて選択ならフィルタなし。それ以外は日本語ID・英語ID・その他言語IDの組合せでpc.LanguageへのIN/NOT INをORで繋ぐ場合がある | 「言語はチェックが 3 種すべて選択されている場合はフィルタを付けない。それ以外では日本語 ID・英語 ID・その他言語 ID の組み合わせにより、`pc.Language` に対する IN／NOT IN を OR で繋ぐ場合がある。」 | md:123 | pf-fallback | 0 |
| L1-M0301-038 | validation | 業務ルール: プロモはチェックが1種類だけのときだけcd.promotion_flgで絞る。2種類同時は絞らない | 「プロモはチェックが 1 種類だけのときだけ `cd.promotion_flg` で絞る。2 種類同時は絞らない。」 | md:125 | pf-fallback | 0 |
| L1-M0301-039 | validation | 業務ルール: 高額商品もチェックが1種類だけのときだけpc.high_price_codeがNULLか否かで絞る。既定フォームデータでは通常価格のみ選択されている | 「高額商品もチェックが 1 種類だけのときだけ、`pc.high_price_code` が NULL か否かで絞る。既定フォームデータでは通常価格のみが選択されている。」 | md:127 | pf-fallback | 0 |
| L1-M0301-040 | validation | 業務ルール: 期間別販売数はorder_dateが許容リストに含まれる値のときだけpc.order_quantity_{列番号}に下限上限を付けられる。列番号は昨日〜365日前まで（当日列は無い） | 「期間別販売数は、`order_date` が許容リストに含まれる値のときだけ、`pc.order_quantity_{列番号}` に下限・上限を付けられる。フォームが用意する列番号は昨日から 365 日前まで（当日列はリストに無い）。」 | md:129 | pf-fallback | 0 |
| L1-M0301-041 | validation | 業務ルール: 規格更新日「終了」はその日の終わりを含めるため翌日0時未満として解釈する。終了が開始より前ならフォームエラー（共通文言）。各日付は1900-01-01以降のレンジ | 「規格更新日「終了」は、その日の終わりを含めるため翌日 0 時未満として解釈する。」「規格更新日（終了） \| … \| 終日 inclusive。終了が開始より前ならフォームエラー。」「規格更新日 \| 終了が開始より前ならエラー（共通文言）。各日付は 1900-01-01 以降のレンジ。」 | md:131,168,247 | pf-fallback | 0 |
| L1-M0301-042 | validation | 業務ルール: クエリの末尾でQueryKey::PRODUCT_SEARCH_ADMINに登録されたカスタマイザがあれば追加の結合・条件が入る（プラグイン依存＝環境非搭載時は無効果。cross-feature）。【改訂4】この条件付き正例（カスタマイザ登録済み環境での追加条件反映）は本候補（プラグイン非搭載の標準環境）では前提を満たせず正検証できないため、母集合-036とのbindはTBDとした（claim自体は保持） | 「クエリの末尾で `QueryKey::PRODUCT_SEARCH_ADMIN` に登録されたカスタマイザがあれば、追加の結合・条件が入る。」「クエリカスタマイザ \| 登録がある環境では一覧 SQL が本体説明と異なる場合がある。」 | md:133,196 | pf-fallback | 0 |
| L1-M0301-043 | validation | 入力項目表: 全30項目が「任意」（必須=NotBlank相当の項目は存在しない）。ヘッダ列は「必須／任意」だが値列に「必須」を持つ行が1件も無い | 「項目名 \| 必須／任意 \| 最大長 \| 初期値 \| 保存先・扱い」（ヘッダ）／以下md:141-175の全30データ行がいずれも列2値「任意」（代表: 「商品名（日／英） \| 任意 \| …」md:141、「一覧ソート向き \| 任意 \| … \| 隠し入力 `sorttype`。値 `a` 以外は降順扱い。」md:175） | md:139-175 | pf-fallback | 0 |
| L1-M0301-044 | validation | 【改訂1・限定】基準価格/買取価格(開始/終了)の**4項目のみ**（販売価格は対象外＝L1-074参照）は桁が設定eccube_price_len（確認値8）に合わせたSymfony Length。フォーム/セッションには載るがgetQueryBuilderBySearchDataForAdmin本体では参照しない（確認値）。Excel検索入力item-tableに基準価格・買取価格の識別ID自体が存在しない＝真の沈黙のためInterpretation A(pf回帰)を適用 | 「基準価格（開始） \| 任意 \| 同上 \| 空 \| フォームおよびセッションには載るが、`getQueryBuilderBySearchDataForAdmin` 本体では参照しない（確認値）。キー `standard_price_from`。」（終了・買取価格2項目も同上=md:159-161。「同上」は販売価格(開始)の最大長セル「桁は設定 `eccube_price_len`（確認値 8）に合わせた Symfony Length」を指す=md:156） | md:156,158-161,245 | pf-fallback | 0 |
| L1-M0301-045 | validation | 在庫(開始/終了)・期間別販売数販売数(開始/終了)はHTMLのmaxlengthがeccube_int_len（確認値9）。在庫は最小0 | 「在庫（開始） \| 任意 \| HTML の `maxlength` は `eccube_int_len`（確認値 9）、最小 0 \| 空 \| `dtb_product_stock.stock` の下限。`stock_from`。」（在庫終了・期間別販売数は同上=md:163,165-166）／「整数系（在庫・販売数） \| 整数型フィールド。HTML で最小 0 と maxlength。」 | md:162-166,246 | pf-fallback | 0 |
| L1-M0301-046 | validation | 規格更新日(開始)はpc.update_dateの下限・Symfony下限レンジ1900-01-01。(終了)は終日inclusive・終了が開始より前ならフォームエラー（共通文言） | 「規格更新日（開始） \| 任意 \| `yyyy-MM-dd` の単一行日付 \| 空 \| `pc.update_date` の下限。Symfony の下限レンジ `1900-01-01`。`update_date_from`。」「規格更新日（終了） \| 任意 \| 同上 \| 空 \| 終日 inclusive。終了が開始より前ならフォームエラー。`update_date_to`。」「規格更新日 \| 終了が開始より前ならエラー（共通文言）。各日付は 1900-01-01 以降のレンジ。」 | md:167-168,247 | pf-fallback | 0 |
| L1-M0301-047 | validation | その他テキスト項目には追加のSymfony Lengthは無い（確認値） | 「その他テキスト \| 追加の Symfony Length は無い（確認値）。」 | md:248 | pf-fallback | 0 |
| L1-M0301-048 | validation | 在庫(開始)はdtb_product_stock.stockの下限・キーstock_from。在庫(終了)は同上の上限・キーstock_to | 「在庫（開始） \| 任意 \| HTML の `maxlength` は `eccube_int_len`（確認値 9）、最小 0 \| 空 \| `dtb_product_stock.stock` の下限。`stock_from`。」「在庫（終了） \| 任意 \| 同上 \| 空 \| 同上の上限。`stock_to`。」 | md:162-163 | pf-fallback | 0 |
| L1-M0301-049 | behavior | エッジケース: POST検証エラーはhas_errorsが真となり「検索条件に誤りがあります」系のメッセージブロックを表示。一覧テーブルは出さない | 「POST 検証エラー \| `has_errors` が真となり、「検索条件に誤りがあります」系のメッセージブロックを表示。一覧テーブルは出さない。」 | md:181 | pf-fallback | 0 |
| L1-M0301-050 | display_field | エッジケース: 検索結果0件は「検索結果がありません」メッセージを表示 | 「検索結果 0 件 \| 「検索結果がありません」メッセージを表示。」 | md:182 | pf-fallback | 0 |
| L1-M0301-051 | behavior | エッジケース: sortkeyが列マップ外だとリポジトリがorderByする時点で未定義添字参照となり実行時エラーになり得る（不正な隠しフィールド送付）。【改訂2注記】「なり得る」は可能性の表現であり、200等の正常応答が絶対に返らないという必発の否定形は一次資料に無い＝非200を断定しない | 「`sortkey` が列マップ外 \| リポジトリが `orderBy` する時点で未定義添字参照となり、実行時エラーになり得る（不正な隠しフィールド送付）。」（同旨=md:70） | md:70,184 | pf-fallback | 0 |
| L1-M0301-052 | behavior | エッジケース: ホームのsearch_nonstockのみをセッションに載せて一覧へ入ると、CSV用マージ処理を経由せずsubmitAndGetDataするためフォームに無いキーだけが残るとSymfonyフォームがエラーになり得る。またリポジトリ本体にはstock配列による絞り込みが無く実装ギャップとして記録されている（確認値）。【改訂5】「エラーになり得る」は可能性表現であり母集合-068の期待（フォームエラー発生）を1回の実行でpass/fail判定できない。改訂4で試みた「stock絞込み無し」への判定根拠差替えは母集合期待の充足検証にならないため撤回し、母集合-068とのbindはTBDとした（claim自体は保持） | 「ホームの `search_nonstock` のみをセッションに載せて一覧へ入る \| コントローラは CSV 用に用意しているマージ処理を経由せず `submitAndGetData` するため、フォームに無いキーだけが残ると Symfony のフォームがエラーになり得る。またリポジトリ本体には `stock` 配列による絞り込みが無く、テストクラスと実装が乖離している（確認値としてギャップを記録）。」 | md:185 | pf-fallback | 0 |
| L1-M0301-053 | display_field | エッジケース: 一覧テンプレートの在庫・期間別数量セルは一部が固定文字列のプレースホルダのまま残っており検索結果データと一致しない表示になり得る（実装ギャップ記録）。【改訂5】「表示になり得る」は可能性表現であり母集合-069の期待（表示不一致の発生）を1回の実行でpass/fail判定できない。改訂4で試みた「固定文字列の存在」への判定根拠差替えは母集合期待の充足検証にならないため撤回し、母集合-069とのbindはTBDとした（claim自体は保持） | 「一覧テンプレートの在庫・期間別数量セル \| 一部が固定文字列のプレースホルダのまま残っており、検索結果データと一致しない表示になり得る。」 | md:186 | pf-fallback | 0 |
| L1-M0301-054 | auth_rule | 権限・認可: ログイン済みルート到達可能な運用者は利用できる（細かいロールはセキュリティ設定・権限マスタが正）。未ログインまたは拒否された主体は管理画面共通の挙動により利用できない | 「管理画面にログインしルートへ到達できる運用者 \| 利用できる。細かいロール単位の可否はセキュリティ設定と権限マスタの実装を正とする。」「未ログインまたは拒否された主体 \| 管理画面共通の挙動により利用できない。」 | md:256-257 | pf-fallback | 0 |
| L1-M0301-055 | side_effect | 副作用: セッションキーeccube.admin.product.search／…page_no／…page_count／…display_modeの更新。一覧検索前後イベントのディスパッチ | 「セッションキー `eccube.admin.product.search`、`eccube.admin.product.search.page_no`、`eccube.admin.product.search.page_count`、`eccube.admin.product.search.display_mode` の更新。一覧検索前後イベントのディスパッチ。」 | md:213 | pf-fallback | 0 |
| L1-M0301-056 | db_effect | 本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない | 「本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。」 | md:233 | pf-fallback | 0 |
| L1-M0301-057 | excel_delta | 【Excel検索入力・識別ID:7】公開状態のチェック項目「限定公開」はカスタマイズで除去（原本で取り消し線＝HTML上も`cell-strike`として残存確認） | 「チェック項目: 公開、非公開、<span class="cell-strike">限定公開</span><br>※カスタマイズ対応、選択肢「限定公開」を除去する」 | 0204 sheet-3:1188 | excel | 0 |
| L1-M0301-058 | excel_delta | 【Excel検索入力・識別ID:11】状態にカスタマイズで「その他」を追加。NMを初期チェック状態にする | 「チェック項目: NM、SP、MP、HP、その他<br>※カスタマイズ対応、項目「その他」を追加、NMに初期チェックを入れる」／「★ \| 検索項目の追加」「・ \| 識別ID:11「状態」の項目「その他」を追加」／「★ \| 初期選択状態の設定」「・ \| 識別ID:11「状態」の項目「NM」を初期チェック状態にする」 | 0204 sheet-3:1192,1169,1173 | excel | 0 |
| L1-M0301-059 | excel_delta | 【Excel検索入力・識別ID:12】Foil検索項目をカスタマイズで新規追加（Foil／ノーマル／特殊のチェック） | 「※カスタマイズ対応、選択肢追加<br>チェック項目: Foil、ノーマル、特殊」／「・ \| 識別ID:12「Foil」を追加」 | 0204 sheet-3:1193,1170 | excel | 0 |
| L1-M0301-060 | excel_delta | 【Excel検索入力・識別ID:13】フレーム検索項目をカスタマイズで新規追加（通常／特殊のチェック） | 「※カスタマイズ対応、検索項目追加<br>チェック項目: 通常、特殊」／「・ \| 識別ID:13「フレーム」の項目「特殊」を追加」 | 0204 sheet-3:1194,1171 | excel | 0 |
| L1-M0301-061 | excel_delta | 【Excel検索入力・削除機能】在庫関連機能は在庫管理に移動するため在庫変更CSV出力ボタン・在庫一括編集ボタンは削除する（Ph2以降検討: 一覧での週間在庫回転数表示） | 「在庫関連機能は在庫管理に移動するため、在庫変更CSV出力ボタン、在庫一括編集ボタンは削除する」「以下の機能はPh2以降に検討とする」「一覧にて、週間の在庫回転数を表示する」 | 0204 sheet-3:1163,1166 | excel | 0 |
| L1-M0301-062 | excel_delta | 【Excel検索入力・処理概要】検索ボタン押下時、フォーム内容の入力チェックをサーバ側で行う | 「・ \| 検索ボタン押下時、フォーム内容の入力チェックをサーバ側で行う」 | 0204 sheet-3:1174 | excel | 0 |
| L1-M0301-063 | excel_delta | 【Excel検索結果・識別ID:5〜8】在庫変更CSV出力・在庫一括編集・価格一括編集・買取価格一括編集の4ボタンはカスタマイズで除去する | 「在庫変更CSV出力 \| ボタン \| … \| ※カスタマイズ対応、ボタンを除去する」「在庫一括編集 \| ボタン \| … \| ※カスタマイズ対応、ボタンを除去する」「価格一括編集 \| ボタン \| … \| ※カスタマイズ対応、ボタンを除去する」「買取価格一括編集 \| ボタン \| … \| ※カスタマイズ対応、ボタンを除去する」 | 0204 sheet-4:1495-1498 | excel | 0 |
| L1-M0301-064 | excel_delta | 【Excel検索結果・識別ID:9】買取・基準価格一括編集ボタンをカスタマイズで新規設置し、買取・基準価格一括編集画面（sheet-23）へ遷移する | 「買取・基準価格一括編集 \| ボタン \| … \| ※カスタマイズ対応、ボタンを新規設置、買取・基準価格一括編集に遷移する」 | 0204 sheet-4:1499 | excel | 0 |
| L1-M0301-065 | excel_delta | 【Excel検索結果・識別ID:10】件数プルダウンの選択肢は10件/50件/100件/300件/500件/1000件/2000件/10000件/12000件の9段階 | 「件数 \| 単一選択 \| … \| 選択肢: 10件 50件 100件 300件 500件 1000件 2000件 10000件 12000件」 | 0204 sheet-4:1500 | excel | 0 |
| L1-M0301-066 | excel_delta | 【Excel検索結果・識別ID:12】表示データ切替えセレクトボックスで「販売数（通販＋TC東京）」「販売数（支店）」「入庫数」の3種を切替。対象は識別ID:24〜29 | 「検索結果の表示統計データの種別を切り替える。<br>選択項目は、「販売数（通販＋TC東京）」、「販売数（支店）」、「入庫数」<br>表示切替え対象はID:24 〜 ID:29」 | 0204 sheet-4:1502 | excel | 0 |
| L1-M0301-067 | excel_delta | 【Excel検索結果・識別ID:20〜23】販売価格・買取価格・在庫数(通販+TC東京)・在庫数(支店)はカスタマイズ対応列（在庫数2種はそれぞれ通販+TC東京／支店の在庫数を出力） | 「販売価格 \| - \| … \| ※カスタマイズ対応」「買取価格 \| - \| … \| ※カスタマイズ対応」「在庫数(通販+TC東京) \| - \| … \| ※カスタマイズ対応、通販+TC東京の在庫数を出力」「在庫数(支店) \| - \| … \| ※カスタマイズ対応、支店の在庫数を出力」 | 0204 sheet-4:1510-1513 | excel | 0 |
| L1-M0301-068 | excel_delta | 【Excel検索結果・識別ID:24〜29】当日/前日/3日間/1週間/1ヶ月/90日間の各列はカスタマイズ対応で、識別ID:12の表示データ切替えで選択されたデータ種別のその期間データを表示する | 「当日 \| - \| … \| ※カスタマイズ対応<br>表示データ切替え(ID:12)で選択されたデータ種別の当日データを表示する」（前日〜90日間も同型=md1515-1519） | 0204 sheet-4:1514-1519 | excel | 0 |
| L1-M0301-069 | excel_delta | 【改訂1・Major是正】【Excel検索結果・識別ID:30】「…」（三点リーダー）クリックで、**Excel原本の逐語どおり**識別ID:41「変動履歴」・42「NM変動履歴」・43「価格履歴」・44「NM価格履歴」のツールチップを表示/非表示するとされている。**識別ID41-44はitem-table（No.1-35）には存在しない番号**であり、ラベルが同名のNo.31変動履歴/No.32NM変動履歴/No.33価格履歴/No.34NM価格履歴との対応関係はExcel原本自体に記載が無い（初版はラベル一致から41-44↔31-34と自己推論したが根拠なし＝撤回）。番号の不一致がExcel原本内の記述揺れか誤記かは不明。**表示/非表示対象の実体特定はTBD（要ソース確認・§9）**とし、無根拠の対応付けはしない | 「クリックすると、識別ID:41「変動履歴」、識別ID:42「NM変動履歴」、識別ID:43「価格履歴」、識別ID:44「NM価格履歴」のツールチップを表示/非表示する」 | 0204 sheet-4:1520 | excel | 0 |
| L1-M0301-070 | excel_delta | 【Excel検索結果・処理概要★】一覧表示について: NM/SP/MP/HPの在庫数・販売数・入庫数を合算して出力する（★）。言語は分けて表示（現行踏襲）。表示順は棚番号昇順とする（★） | 「★ \| NM、SP、MP、HPの在庫数、販売数、入庫数を合算して出力する」「・ \| 言語は分けて表示(現行踏襲)」「★ \| 表示順は、棚番号昇順とする」 | 0204 sheet-4:1475-1477 | excel | 0 |
| L1-M0301-071 | excel_delta | 【Excel検索結果・処理概要★】販売数の表示について: 表示データ切替え(ID:12)で切り替えることで販売数(通販＋TC東京)/販売数(支店)/入庫数の出す項目を選択する（★）。販売数の期間を「90日間」まで出力に変更（★） | 「★ \| 表示データ切替え(ID:12)で切り替えることで、販売数（通販＋TC東京）、販売数（支店）、入庫数は出す項目を選択する」「★ \| 販売数の期間を「90日間」まで出力に変更」 | 0204 sheet-4:1479-1480 | excel | 0 |
| L1-M0301-072 | excel_delta | 【Excel検索結果・処理概要★】買取数または入庫数の表示について: 販売数と同じ表組みに「入庫数」の行を出力し、販売数と同様に「90日間」までの入庫数を出力する（★）。現状踏襲として処理によって予め保存されている買取数・販売数のデータを表示する | 「★ \| 販売数と同じ表組みに「入庫数」の行を出力、販売数と同様に「90日間」までの入庫数を出力する」「・ \| 現状踏襲とし、処理によって予め保存されている買取数、販売数のデータを表示する」 | 0204 sheet-4:1482-1483 | excel | 0 |
| L1-M0301-073 | excel_meta | Excel画面項目一覧（検索入力32項目・検索結果35項目）は必須・最大値(最大文字数)・初期値の大半が「-」または空欄＝Excelは制約値に沈黙する項目が多く→制約値はpf現行md回帰で確定する（本候補のpf-fallback許可根拠。価格/在庫のmaxlength等は例外的に「0 -999999999」等の数値レンジがExcel側にも明記＝§3参照） | 「識別ID \| ラベル \| 書式・制限 \| 必須 \| 最大文字数または最大値 \| 初期値 \| 画面部品の説明」（検索入力ヘッダ）でNo.1-32の必須列がほぼ全行「-」（例: No.1商品名 md1182「-｜-｜-」、No.32検索する md1213「-｜(空)｜-」）／検索結果側も同様（例: No.1該当件数 md1491「-｜-｜-」） | 0204 sheet-3:1178-1213,sheet-4:1488-1525 | excel | 0 |
| L1-M0301-074 | validation | 【改訂1・新設・Blocker1是正】販売価格(開始/終了)（識別ID17/18）はExcelが最大値「0 -999999999」を明示（沈黙ではない）＝**Excel優先でmax=999999999**を確定。pf md記載のeccube_price_len確認値8（max 99999999相当）はこの2項目については数値が食い違うためExcel優先で不採用（§10齟齬記録・superseded） | 「17 \| 販売価格(From) \| 数値 \| - \| 0 -999999999 \| - \| 」「18 \| 販売価格(To) \| 数値 \| - \| 0 -999999999 \| - \| 」 | 0204 sheet-3:1198-1199 | excel（pf md価格桁数(md:156-157)はsuperseded・期待値根拠に使用しない） | 0 |

## §2 SEED三段参照設計（全て `@TBD-D5`）

期待値の正は**L1オラクルID**（SEED値を期待値の正にしない三段参照: 期待=L1→前提状態=SEED→実測=観測値）。
本機能は参照系（検索）のためSEEDは主に**検索対象商品カタログの帯データ**である。id帯は**990001〜**。

| SEED | 内容 | 用途 |
|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン（パイロット共通） | 全ケースの認証 |
| SEED-M0301-CAT | カテゴリ帯: 親990291／子990292（990291の子孫）／無関係990293。**カテゴリ自体のCRUDはM03-11管轄**であり本SEEDは検索前提データとしてのみ使用 | カテゴリ絞り込み検証（C-019/C-020）の前提 |
| SEED-M0301-PROD | 商品+規格帯（各id=1商品+1規格+1 mtb_card_detail、id=990301〜990312） | 検索フィルタ観点別: 990301(category=990292,language=日本語,card_condition=NM,foil=0,frame=通常,promotion=0,high_price_code=NULL,price02=1000,stock=50)／990302(category=990293,他同990301＝カテゴリ除外用)／990303(language=英語,他同990301＝言語一部選択用)／990304(promotion=1,他同990301＝プロモ単独選択一致用)／990305(high_price_code非NULL,price02=99999999,他同990301＝高額単独選択一致用)／990306(order_quantity_*の許容列に基準日近傍の値,他同990301＝期間別販売数範囲内用)／990307(同列の値が下限未満,他同990301＝期間別販売数範囲外用)／990308(name=`E2E100%特殊_商品`,他同990301＝部分一致エスケープ対象)／990309(name=`E2E100X特殊X商品`,他同990301＝エスケープ無しなら誤爆する対照)／990310(stock=5,他同990301＝在庫範囲内用)／990311(stock=0,他同990301＝在庫範囲外用)／990312(price02=999,update_date=T0-1日,code=`E2E-SORT-001`＝ソート順検証用) |検索業務ルール検証(L1-035〜041,048)・C-019〜C-032 |
| SEED-M0301-PAGE | 商品15件id=990401〜990415、全てcategory_id=990292、name=`E2Eページング{n}`、price02=1000+n（共通条件で15件ヒットしeccube_default_page_count確認値10を超える） | ページネーション・page_count境界（C-003,C-005,C-005B,C-033） |
| SEED-M0301-DELETED | 論理削除済み商品1件id=990501（既に削除された状態） | MSG-008「既に削除されています」検証（C-061。**改訂1で一時excluded、改訂2でbound復帰＝メッセージ表示・遷移先の観測に使用**。削除試行自体の判定ロジックはDELEG） |

- 破壊的操作は本機能に存在しない（L1-056: 参照系のみ）。SEED投入は**読み取り専用の前提データ**であり、
  afterEachでの帯DELETE→再INSERTのみ（一括削除UI操作を実行するケースがある場合のみ帯商品の論理/物理削除が
  発生し得るため、その回のみ帯再投入する。§7参照）。
- 期間別販売数の許容列（order_date=昨日〜365日前）とT0（実行時刻近傍）の具体的な日付オフセット対応は
  pf md自身が「フォームが用意する列番号は昨日から 365 日前まで（当日列はリストに無い）」（md:129）と
  述べるのみで列番号↔日付の実装対応表は本書の一次資料に無いため、**具体的な列選択と期待値の対応は `@TBD-D5`**
  （要実機／要ソース確認。§9）。

## §3 画面項目マトリクス

Excel識別ID（sheet-3検索入力No.1-32・sheet-4検索結果No.1-35）×pf md入力項目表（md:141-175）の突合。
**制約値の大半はpf回帰**（Excelは必須/最大値/初期値の大半が「-」＝L1-073。価格・在庫系のみExcel側にも
数値レンジ表記あり）。

### 検索入力（sheet-3、識別ID1〜32）主要項目

| 項目（Formキー） | Excel識別ID | 必須 | 最大長/レンジ | 初期値 | 保存先/扱い | 根拠 |
|---|---|---|---|---|---|---|
| 商品名(日/英) `product_name` | 1 | 任意 | 桁制約なし | 空 | dtb_product.name 部分一致 | L1-043／md:141／0204 sheet-3:1182 |
| カード名(日/英) `card_name` | 3 | 任意 | 桁制約なし | 空 | 関連カード日本語名の存在サブクエリ部分一致 | md:142／0204 sheet-3:1184 |
| ID `product_id` | 4 | 任意 | 10桁数字のみ対象(他は無視) | 空 | 商品ID部分一致(文字列) | md:143／0204 sheet-3:1185 |
| コード `product_code` | 5 | 任意 | 桁制約なし | 空 | dtb_product_class.code 部分一致 | md:144／0204 sheet-3:1186 |
| カテゴリ `category_id` | 6 | 任意 | — | 未選択(すべての商品) | 選択+子孫でIN | L1-036／md:145／0204 sheet-3:1187 |
| 公開状態 `status` | 7 | 任意 | — | 公開のみ | 複数チェック。**限定公開は除去済(L1-057)** | md:146／0204 sheet-3:1188 |
| エキスパンション `cardset` | 8 | 任意 | — | 無選択 | 複数SELECT | md:147／0204 sheet-3:1189 |
| レアリティ `rarity` | 9 | 任意 | — | 無選択 | 複数チェック | md:148／0204 sheet-3:1190 |
| 言語 `language` | 10 | 任意 | — | 無選択 | 日本語/英語/その他チェック | L1-037／md:149／0204 sheet-3:1191 |
| 状態 `card_condition` | 11 | 任意 | — | NMのみ | NM/SP/MP/HP/**その他(★追加)**。NM初期チェック(★) | L1-058／md:150／0204 sheet-3:1192 |
| Foil `foil` | 12（★追加） | 任意 | — | 無選択 | 非Foil/ノーマル/特殊 | L1-059／md:151／0204 sheet-3:1193 |
| フレーム `frame` | 13（★追加） | 任意 | — | 無選択 | 通常/特殊 | L1-060／md:152／0204 sheet-3:1194 |
| プロモ `promotion` | 14 | 任意 | — | 無選択 | プロモ/ノーマル二択 | L1-038／md:153／0204 sheet-3:1195 |
| タグ `tag_id` | 15 | 任意 | — | 無選択 | 複数SELECT(EXISTS) | md:154／0204 sheet-3:1196 |
| 略称タグ `storage_code_id` | 16 | 任意 | — | 無選択 | 複数SELECT | md:155／0204 sheet-3:1197 |
| 販売価格(開始/終了) `sell_price_from/to` | 17/18 | 任意 | **max=999999999（Excel明示値・改訂1）**。pf md記載のeccube_price_len確認値8はExcel明示値と数値相違のためsuperseded（§10） | 空 | price02の下限/上限 | L1-074／0204 sheet-3:1198-1199（pf md:156-157はsuperseded） |
| 基準価格/買取価格(開始/終了・4項目) `standard_price_from/to`,`buy_price_from/to` | Excel未掲載 | 任意 | eccube_price_len確認値8（Excel真の沈黙＝Interpretation A） | 空 | フォーム/セッションのみ保持・検索クエリでは未参照（確認値） | L1-044／md:156,158-161 |
| 在庫(開始/終了) `stock_from/to` | 19/20 | 任意 | eccube_int_len確認値9,最小0。0-999999999 | 空 | dtb_product_stock.stockの下限/上限 | L1-045,048／md:162-163／0204 sheet-3:1200-1201 |
| 期間別販売数 販売期間 `order_date` | 21 | 任意 | 昨日〜365日間の選択肢 | 未指定 | 許容リスト値のみ範囲適用 | L1-040／md:164／0204 sheet-3:1202 |
| 期間別販売数 販売数(開始/終了) `order_quantity_from/to` | 22/23 | 任意 | eccube_int_len。0-999999999 | 空 | order_quantity_*の下限/上限 | md:165-166／0204 sheet-3:1203-1204 |
| 規格更新日(開始/終了) `update_date_from/to` | 24/25 | 任意 | yyyy/mm/dd。1900-01-01以降 | 空 | pc.update_dateの下限/終日inclusive上限 | L1-046,048／md:167-168／0204 sheet-3:1205-1206 |
| 売上分析タグ `tag_sales_analysis` | 26 | 任意 | — | 無選択 | 複数SELECT IN | md:169／0204 sheet-3:1207 |
| 高額商品のみ表示/除外 `expensive` | 27/28 | 任意 | — | 「高額商品を除外する」のみ初期チェック | 1種のみでhigh_price_code絞り | L1-039／md:170／0204 sheet-3:1208-1209 |
| 部門 `section` | 29 | 任意 | — | 無選択 | 複数SELECT | md:171／0204 sheet-3:1210 |
| 棚番号 `shelf_number` | 30 | 任意 | — | 無選択 | 複数SELECT | md:172／0204 sheet-3:1211 |
| 検索条件をクリア | 31 | — | — | — | JS `.search-clear`(CSRF hiddenは残す) | L1-011／0204 sheet-3:1212 |
| 検索する `id`(隠しキー) | 32 | 任意 | 桁制約なし | 空(一覧非表示) | ID数値なら完全一致,他は商品名/コード/カード名へOR部分一致 | md:173／0204 sheet-3:1213 |
| （削除済）在庫変更CSV出力・在庫一括編集ボタン | — | — | — | — | —（画面に存在しないこと） | L1-061／0204 sheet-3:1163 |

### 検索結果（sheet-4、識別ID1〜35）主要項目

| 項目 | Excel識別ID | 備考 | 根拠 |
|---|---|---|---|
| 該当件数 | 1 | 一覧総件数(Knp) | L1-023／0204 sheet-4:1491 |
| （削除済）在庫変更CSV出力/在庫一括編集/価格一括編集/買取価格一括編集ボタン | 5/6/7/8 | ★カスタマイズで除去 | L1-063／0204 sheet-4:1495-1498 |
| （新設）買取・基準価格一括編集ボタン | 9 | ★カスタマイズで新規設置 | L1-064／0204 sheet-4:1499 |
| 件数プルダウン | 10 | 10/50/100/300/500/1000/2000/10000/12000件の9択 | L1-005,065／0204 sheet-4:1500 |
| 表示データ切替え | 12 | 販売数(通販+TC東京)/販売数(支店)/入庫数の3択。対象ID24-29 | L1-066／0204 sheet-4:1502 |
| CSV/一括編集対象チェック(一括/個別) | 13/14 | チェックボックス | 0204 sheet-4:1503-1504 |
| 商品名リンク | 16 | 商品詳細/編集画面へ遷移 | L1-007／0204 sheet-4:1506 |
| 販売価格・買取価格 | 20/21 | ★カスタマイズ対応 | L1-067／0204 sheet-4:1510-1511 |
| 在庫数(通販+TC東京)/在庫数(支店) | 22/23 | ★カスタマイズ対応(各在庫を出力) | L1-067／0204 sheet-4:1512-1513 |
| 当日/前日/3日間/1週間/1ヶ月/90日間 | 24-29 | ★カスタマイズ対応(表示データ切替え連動) | L1-068／0204 sheet-4:1514-1519 |
| …(三点リーダー) | 30 | 変動履歴/NM変動履歴/価格履歴/NM価格履歴ツールチップ切替 | L1-069／0204 sheet-4:1520 |
| ページング | 35 | 選択ページへ遷移 | L1-003／0204 sheet-4:1525 |

一覧/検索/削除の別: 本機能は**参照系（検索・一覧）**であり、DBへの登録・更新・削除は行わない
（md:233・L1-056）。一括削除・状態変更等のPOST先ルートは本書スコープ外の別導線（md:267）。

## §4 実行可能グレード14列TSV（候補・**自己完結＝全ケース行を実体掲載**）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値。
- request契約（§6.1）参照。セレクタ具体値は**全て要実機**（§9）。

### §4.1 bound対応候補行（掲載48行。§8の69対応表が参照する主要行。改訂1でC-053,055,056,057,059,061を
excluded(DELEG)へ移動し削除・C-017の期待結果文言を是正。**改訂2でC-055,056,057,059,061を
bound復帰**＝一覧画面自身のJS/モーダル/メッセージ/遷移の観測に限定して再掲載。C-053(MSG-001)のみ
別画面（パスワード変更）に留まり除外継続。**改訂3でC-017を候補行から削除**＝母集合-017,-067が
要求する必発エラー（エラー表示かつ処理未完了）を、200許容まで弱めたC-017では検証できないため
bound根拠として不成立と判断しTBDへ移動（§8/§9参照）。L1-M0301-020,051のclaim自体は保持。
**改訂4でC-036を候補行から削除**＝母集合-036が要求する「クエリカスタマイザ登録済み環境での
追加条件反映」という条件付き正例を、プラグイン非搭載の標準環境では前提を満たせず正検証できない
ためTBDへ移動（網羅スイープの結果・§8/§9参照）。L1-M0301-042のclaim自体は保持。
**改訂5でC-068,069を候補行から削除**＝改訂4で試みた「定言的な副次事実へのpass/fail判定根拠差替え」
は母集合-068,-069が要求する「〜になり得る」という可能性事象そのものの充足検証にならない
（bound_overreachの機械的ルール適用）ためTBDへ再移動。L1-M0301-052,053のclaim自体は保持）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-01_admin_product_product_search_list	E2E-M0301C-001	IT-15	画面表示	P1	ナビからGETで検索ビューデータ既定値がセッションへ書き込まれページ1が表示される	ログイン済(SEED-M01-ADMIN)	—	1. GET /%eccube_admin_route%/product を開く 2. 表示された検索フォームの既定チェック(公開状態=公開のみ)を確認 3. ページ1が表示されることを確認	検索フォームは公開状態のみ既定チェックされた状態で1ページ目が表示される ／ 自動検証(内部): 検索ビューデータがセッションへ書き込まれる [L1:L1-M0301-001,L1-M0301-018; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-002	IT-20	遷移	P1	「検索する」で送信すると検証成功時に条件がセッションへ保存されページ番号1で一覧が組み立てられる	ログイン済／SEED-M0301-PROD	name=`E2E商品カテゴリ一致`	1. GET /product で検索フォームを開く 2. name=左記を入力し「検索する」をPOST 3. 応答の一覧・ページ番号・セッション反映を確認	一覧の1ページ目に該当商品990301が表示される ／ 自動検証(内部): 条件がセッションへ保存されページ番号が1に設定される [L1:L1-M0301-002,L1-M0301-016; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-003	IT-20	ページング	P1	ページネーションでNページへ遷移するとセッションのページ番号が更新されNページ目が表示される	ログイン済／SEED-M0301-PAGE(15件)	page_no=2	1. GET /%eccube_admin_route%/product/page/2 を開く 2. 表示された行がページ2相当(11-15件目)であることを確認	Nページ目(2ページ目)の内容が表示される ／ 自動検証(内部): セッションのページ番号が2に更新される [L1:L1-M0301-003; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-004	IT-20	ソート	P1	ソートアイコン押下で隠しsortkey/sorttypeを更新してPOST送信されページ番号が1にリセットされる	ログイン済／SEED-M0301-PAGE	sortkey=`name`,sorttype=`a`	1. 一覧でソートアイコンをクリック(.js-listSort) 2. POST送信内容のsortkey/sorttypeとページ番号を確認	クリックしたソート順に並び替わった一覧の1ページ目が表示される ／ 自動検証(内部): 隠しフィールドsortkey/sorttypeが更新されPOST送信され、ページ番号が1にリセットされる [L1:L1-M0301-004,L1-M0301-011; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-005	IT-22	表示件数	P1	表示件数プルダウンでmtb_page_max記載の値(50件)を選ぶとセッションへ保存されその件数で分割される	ログイン済／SEED-M0301-PAGE(15件)	page_count=50	1. GET /%eccube_admin_route%/product/page/1?page_count=50 2. 表示件数・セッション保存値を確認	検索結果が1ページに表示される（この例では15件） ／ 自動検証(内部): page_countが50としてセッションへ保存される [L1:L1-M0301-005,L1-M0301-014; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-005B	IT-22	表示件数	P2	表示件数プルダウンにmtb_page_max非存在の値を渡すとセッション値または既定値(確認値10)にフォールバックする	ログイン済／SEED-M0301-PAGE(15件)	page_count=999(mtb_page_max非存在)	1. GET /%eccube_admin_route%/product/page/1?page_count=999 2. 実際に適用された件数(セッション値かeccube_default_page_count=10)を確認	無効な件数指定は無視され、セッション値または既定の件数で一覧が表示される ／ 自動検証(内部): page_count=999は無視されセッション値または確認値10にフォールバックする [L1:L1-M0301-014; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-006	IT-22	表示モード	P2	一覧表示データプルダウン変更でセッションの表示モードが更新され同一ページ番号で再描画される	ログイン済／SEED-M0301-PAGE	mode=2(正の整数)	1. GET /%eccube_admin_route%/product/page/1?mode=2 2. セッションのdisplay_modeと再描画されたページ番号を確認	同一ページ番号(1)のまま表示モードが切り替わった内容で再描画される ／ 自動検証(内部): セッションのdisplay_modeが2に更新される [L1:L1-M0301-006,L1-M0301-015; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-007	IT-20	遷移	P1	商品名リンク押下で商品編集画面へ遷移する	ログイン済／SEED-M0301-PROD	商品990301の商品名リンク	1. 一覧の商品990301の商品名リンクをクリック 2. 遷移先URLを確認	商品編集画面が表示される ／ 自動検証(内部): 遷移先URLが GET /%eccube_admin_route%/product/product/990301/edit であること [L1:L1-M0301-007; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-008	IT-20	復元	P1	resume=1で一覧へ戻るとセッションに保存されたページ番号と検索条件が復元される	ログイン済／SEED-M0301-PAGE。事前にpage_no=2,検索条件name=Xで一覧を開いた状態	—	1. GET /%eccube_admin_route%/product?resume=1 を開く 2. 表示されたページ番号(2)と検索フォームの復元値(name=X)を確認	ページ2の内容が再表示され、検索フォームにname=Xの入力値が復元表示される ／ 自動検証(内部): セッションに保存されたページ番号(2)と検索条件が復元される（一覧側が上書きしない限り保持） [L1:L1-M0301-008,L1-M0301-018; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-009	IT-15	遷移	P1	ホームの在庫切れ件数リンクから遷移するとセッションにstock専用条件が保存されpage_no=1へリダイレクトされる	ログイン済	ホーム画面の在庫切れ件数リンク	1. GET /%eccube_admin_route%/search_nonstock を開く 2. リダイレクト先URLとセッションのstockキー内容を確認	在庫切れ商品に絞り込まれた一覧の1ページ目が表示される ／ 自動検証(内部): セッションeccube.admin.product.searchにstockキーの在庫なし条件のみが保存され、GET /%eccube_admin_route%/product/page/1 へリダイレクトされる [L1:L1-M0301-009,L1-M0301-022; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-010	IT-22	任意項目	P1	全項目未入力でPOST送信しても必須エラーは発生せず処理が継続される（全30項目が任意）	ログイン済	検索フォーム全項目空	1. GET /product 2. 全項目未入力のまま「検索する」をPOST 3. エラー有無と一覧描画を確認	必須(NotBlank)エラーは表示されず一覧が描画される（30項目すべて任意のため） [L1:L1-M0301-043; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-011	IT-25	JS挙動	P2	複数選択7フィールド(カテゴリ/エキスパンション/タグ/略称タグ/売上分析タグ/部門/棚番号)にselect2が適用される	ログイン済	—	1. GET /product 検索フォームを開く 2. 7フィールドのDOM構成(select2ラッパー)を確認	7フィールドすべてにselect2が適用されている [L1:L1-M0301-011; fixture:SEED-M01-ADMIN@TBD-D5]（セレクタ具体は要実機・§9）				
m03-01_admin_product_product_search_list	E2E-M0301C-012	IT-22	相関バリデーション	P1	規格更新日「終了」が「開始」より前だとフォームエラーとなり処理が完了しない	ログイン済	update_date_from=`2026-06-01`,update_date_to=`2026-05-01`(終了<開始)	1. 左記日付でPOST検索 2. エラー表示と一覧非表示を確認	フォームエラー(共通文言)が表示され一覧テーブルは出ない ／ 自動検証(内部): has_errors=真 [L1:L1-M0301-041,L1-M0301-046,L1-M0301-049; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-013	IT-22	相関バリデーション	P1	規格更新日「終了」が「開始」以降ならエラーなく処理が継続される	ログイン済	update_date_from=`2026-05-01`,update_date_to=`2026-06-01`(終了≥開始)	1. 左記日付でPOST検索 2. エラー無し・一覧描画を確認	フォームエラーは発生せず一覧が描画される [L1:L1-M0301-041,L1-M0301-046; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-016	IT-22	DB相関	P1	sortkeyが列マップ内(または空)ならエラーなく一覧が継続表示される	ログイン済／SEED-M0301-PAGE	sortkey=``(空)	1. GET /product (sortkey未指定) 2. 一覧描画とHTTPステータスを確認	エラーにならず一覧が表示される（既定ソート順で表示） ／ 自動検証(内部): HTTPステータス=200・既定ソート実装=update_date降順+id降順 [L1:L1-M0301-020,L1-M0301-025; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-019	IT-24	検索条件	P1	カテゴリ検索: 選択カテゴリの子孫に該当する商品が取得結果に含まれる	ログイン済／SEED-M0301-CAT+SEED-M0301-PROD	category_id=990291(親)	1. category_id=990291でPOST検索 2. 990301(category=990292,990291の子孫)が結果に含まれることを確認	990301が取得結果に含まれる（選択ノード+子孫でIN） [L1:L1-M0301-036; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-020	IT-24	検索条件	P1	カテゴリ検索: 無関係カテゴリの商品は取得結果に含まれない	ログイン済／SEED-M0301-CAT+SEED-M0301-PROD	category_id=990291(親)	1. category_id=990291でPOST検索 2. 990302(category=990293,無関係)が結果に含まれないことを確認	990302は取得結果に含まれない [L1:L1-M0301-036; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-021	IT-24	検索条件	P2	言語検索: 日本語/英語/その他語の3種すべて選択時はフィルタが付かず全言語の商品が含まれる	ログイン済／SEED-M0301-PROD	language=[日本語,英語,その他]全選択	1. 3種全選択でPOST検索 2. 990301(日本語)と990303(英語)が両方含まれることを確認	フィルタなしで990301・990303とも取得結果に含まれる [L1:L1-M0301-037; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-022	IT-24	検索条件	P1	言語検索: 一部言語のみ選択時は非選択言語の商品がNOT INで除外される	ログイン済／SEED-M0301-PROD	language=[日本語]のみ選択	1. 日本語のみ選択でPOST検索 2. 990303(英語)が含まれないことを確認	990303(英語)は取得結果に含まれない [L1:L1-M0301-037; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-023	IT-24	検索条件	P1	プロモ検索: 1種類だけ選択時は一致する商品が取得結果に含まれる	ログイン済／SEED-M0301-PROD	promotion=[プロモ]のみ選択	1. プロモのみ選択でPOST検索 2. 990304(promotion_flg=1)が含まれることを確認	990304が取得結果に含まれる [L1:L1-M0301-038; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-024	IT-24	検索条件	P1	プロモ検索: 1種類だけ選択時は非一致の商品が取得結果から除外される	ログイン済／SEED-M0301-PROD	promotion=[プロモ]のみ選択	1. プロモのみ選択でPOST検索 2. 990301(promotion_flg=0)が含まれないことを確認	990301は取得結果に含まれない [L1:L1-M0301-038; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-025	IT-24	検索条件	P1	高額商品検索: 1種類だけ選択時は一致する商品が取得結果に含まれる	ログイン済／SEED-M0301-PROD	expensive=[高額商品のみ表示]選択	1. 高額商品のみ表示を選択しPOST検索 2. 990305(high_price_code非NULL)が含まれることを確認	990305が取得結果に含まれる [L1:L1-M0301-039; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-026	IT-24	検索条件	P1	高額商品検索: 1種類だけ選択時は非一致の通常価格商品が取得結果から除外される	ログイン済／SEED-M0301-PROD	expensive=[高額商品のみ表示]選択	1. 高額商品のみ表示を選択しPOST検索 2. 990301(通常価格)が含まれないことを確認	990301は取得結果に含まれない [L1:L1-M0301-039; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-027	IT-24	検索条件	P2	期間別販売数: order_dateが許容リスト内の値のとき下限上限内の商品が取得結果に含まれる	ログイン済／SEED-M0301-PROD	order_date=許容列(例:前日),order_quantity_from=1	1. 左記条件でPOST検索 2. 990306(許容列に基準日近傍値あり)が含まれることを確認	990306が取得結果に含まれる [L1:L1-M0301-040; fixture:SEED-M0301-PROD@TBD-D5]（列番号↔日付の具体対応は@TBD-D5・§9）				
m03-01_admin_product_product_search_list	E2E-M0301C-028	IT-24	検索条件	P2	期間別販売数: 下限を上回る指定では下限未満の商品が取得結果から除外される	ログイン済／SEED-M0301-PROD	order_date=同上,order_quantity_from=5	1. 左記条件でPOST検索 2. 990307(値が下限未満)が含まれないことを確認	990307は取得結果に含まれない [L1:L1-M0301-040; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-029	IT-24	検索条件	P2	部分一致エスケープ: %や_を含む商品名でもエスケープにより意図した商品のみが取得結果に含まれる	ログイン済／SEED-M0301-PROD	product_name=`100%特殊_商品`(部分一致)	1. 左記文字列でPOST検索 2. 990308(name=`E2E100%特殊_商品`)が含まれることを確認	990308が取得結果に含まれる（%と_はエスケープ後にリテラル一致で評価） [L1:L1-M0301-035; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-030	IT-24	検索条件	P2	部分一致エスケープ: エスケープにより%/_のワイルドカード解釈による誤爆が防止され無関係商品は含まれない	ログイン済／SEED-M0301-PROD	product_name=`100%特殊_商品`(部分一致)	1. 左記文字列でPOST検索 2. 990309(name=`E2E100X特殊X商品`、エスケープ無しなら%/_に一致し得る対照)が含まれないことを確認	990309は取得結果に含まれない（%と_のエスケープにより誤爆しない） [L1:L1-M0301-035; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-031	IT-24	検索条件	P2	在庫範囲: stock_from/toの範囲内の商品が取得結果に含まれる	ログイン済／SEED-M0301-PROD	stock_from=1,stock_to=10	1. 左記範囲でPOST検索 2. 990310(stock=5)が含まれることを確認	990310が取得結果に含まれる [L1:L1-M0301-048; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-032	IT-24	検索条件	P2	在庫範囲: 範囲外(下限未満)の商品は取得結果から除外される	ログイン済／SEED-M0301-PROD	stock_from=1,stock_to=10	1. 左記範囲でPOST検索 2. 990311(stock=0)が含まれないことを確認	990311は取得結果に含まれない [L1:L1-M0301-048; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-033	IT-25	実行結果	P1	一覧総件数はKnpページネータが一覧本体と同じクエリビルダで件数を数えた値と一致する	ログイン済／SEED-M0301-PAGE(15件,共通条件)	category_id=990292	1. 左記条件でPOST検索 2. 該当件数(識別ID:1)表示値=15であることを確認	該当件数表示が実際のヒット件数(15)と一致する [L1:L1-M0301-023; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-034	IT-25	実行結果	P2	画面に出す規格行はLanguageとCardConditionが両方存在する規格だけが抽出される	ログイン済／SEED-M0301-PROD	category_id=990292	1. 左記条件でPOST検索 2. 990301の規格行にLanguage/CardConditionが両方存在することを確認	Language・CardConditionが両方存在する規格のみ行として並ぶ（欠落商品は空セルcolspan） [L1:L1-M0301-024; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-035	IT-25	実行結果	P2	ソート実行結果: sortkey未指定はupdate_date降順+id降順、sortkey=price+sorttype=aは価格昇順+update_date降順+id降順	ログイン済／SEED-M0301-PROD(990301,990312で価格差あり)	sortkey=``(未指定)と sortkey=`price`,sorttype=`a`	1. sortkey未指定でPOST検索し順序を記録 2. sortkey=price,sorttype=aで再検索し順序を記録	sortkey未指定時は一覧が更新日時の新しい順で並ぶ。価格を昇順に指定すると価格の低い990312が一覧の先頭に表示される ／ 自動検証(内部): 既定ソート実装=update_date降順+id降順、price指定時=price02昇順+update_date降順+id降順（990312のprice02=999<990301の1000） [L1:L1-M0301-025; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-037	IT-26	セッション	P1	POST検索成功時にセッションeccube.admin.product.searchへ検索ビューデータが保存されページ番号が1になる	ログイン済／SEED-M0301-PAGE	name=`E2Eページング`,page_no事前=2	1. page_no=2の状態からname=左記でPOST検索 2. セッションのeccube.admin.product.search内容とpage_noを確認	新しい検索条件で一覧の1ページ目が表示される ／ 自動検証(内部): セッションの検索ビューデータが新条件へ更新されpage_noが1になる [L1:L1-M0301-016; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-040	IT-15	認証	P1	未ログインで本画面URLへ直接アクセスすると管理画面共通のログイン誘導に従い利用できない	未ログイン	—	1. GET /%eccube_admin_route%/product へ未ログインでアクセス 2. 遷移先を確認	管理画面共通のログイン誘導に従い本画面は表示されない [L1:L1-M0301-054; fixture:(なし)]				
m03-01_admin_product_product_search_list	E2E-M0301C-047	IT-26	副作用	P2	POST検索成功の副作用として4セッションキーが更新されイベントがディスパッチされる（イベント検出は観測手段未契約=実行保留）	ログイン済／SEED-M0301-PAGE	name=`E2E副作用確認`	1. POST検索実行 2. 4セッションキー(検索ビューデータ/page_no/page_count/display_mode)の更新を確認 3. イベントディスパッチは観測対象外と記録	検索が実行され一覧が表示される ／ 自動検証(内部): 4セッションキー(検索ビューデータ/page_no/page_count/display_mode)の更新を観測（イベントディスパッチは観測手段未契約のため確認保留） [L1:L1-M0301-055; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-038	IT-26	DB非更新	P1	検索操作(POST/GET)を何度実行してもdtb_product等の対象テーブルへの登録・更新・削除は発生しない	ログイン済／SEED-M0301-PROD	任意の検索条件を複数回実行	1. db.tsでdtb_product/dtb_product_class/dtb_product_stockの対象行の現在値・行数を記録 2. 複数条件で検索を繰り返し実行 3. db.tsで再照会し不変を確認	いずれのテーブルも行数・値が不変（参照系のみ・登録更新削除なし） [L1:L1-M0301-056; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-050	IT-25	画面表示	P2	見出しは「商品一覧」であることを確認する	ログイン済	—	1. GET /product を開く 2. 見出しテキストを確認	見出しに「商品一覧」が表示される [L1:L1-M0301-010; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-052	IT-25	モーダル	P2	規格一覧確認モーダル・一括完全削除モーダルの存在を確認する（単体削除確認は本テンプレート範囲外の可能性あり）	ログイン済／SEED-M0301-PROD	—	1. 規格確認ボタン押下でモーダル表示を確認 2. 一括完全削除操作でモーダル表示を確認	規格一覧確認モーダル・一括完全削除モーダルがそれぞれ表示される [L1:L1-M0301-012; fixture:SEED-M0301-PROD@TBD-D5]（セレクタ具体は要実機）				
m03-01_admin_product_product_search_list	E2E-M0301C-054	IT-26	メッセージ	P3	商品の規格情報取得に失敗した場合ダイアログ中央に「Failed」が表示され商品検索・一覧画面に留まる	ログイン済／規格情報取得失敗を再現できる状態(要実機)	—	1. 規格情報取得が失敗する状態を再現(手段は要実機) 2. ダイアログ文言と画面遷移有無を確認	画面中央ダイアログに「Failed」が表示され商品検索・一覧画面に留まる [L1:L1-M0301-027; fixture:(なし)]（失敗再現手段は要実機・§9）				
m03-01_admin_product_product_search_list	E2E-M0301C-055	IT-26	メッセージ	P2	【改訂2再是正・bound復帰】選択商品の一括削除開始で画面中央モーダルに「削除中...」が表示されモーダルは開いたまま（一覧画面自身のAjax/モーダルJS挙動を検証。削除POST処理・DB副作用の正しさは別導線=DELEGのため対象外）	ログイン済／SEED-M0301-PROD	990301等を選択し一括完全削除を実行	1. 商品を選択し一括削除を実行 2. モーダル文言「削除中...」と開閉状態（Ajax呼出中は閉じない）を確認	モーダルに「削除中...」(ja)/"Deleting..."(en)が表示されモーダルは開いたまま（md:53のJS挙動＋MSG-003・L1-011,028で本機能自身のUI挙動として確定） [L1:L1-M0301-011,L1-M0301-028; fixture:SEED-M0301-PROD@TBD-D5]（削除の実処理・DB効果はDELEG＝別導線検証。afterEachで帯再投入）				
m03-01_admin_product_product_search_list	E2E-M0301C-056	IT-26	メッセージ	P2	【改訂2再是正・bound復帰】一括削除処理完了で「商品の削除処理が完了しました」表示後モーダルを閉じて一覧を再読み込みする（一覧画面自身の完了後リロードJS挙動を検証。DB上の削除結果自体の正しさはDELEG）	ログイン済／SEED-M0301-PROD	同上	1. 一括削除完了を待つ 2. 完了メッセージとモーダル閉鎖・再読込を確認	「商品の削除処理が完了しました」(ja)/"Product has been deleted successfully."(en)表示後モーダルが閉じ一覧が再読込される（md:53「完了後リロード」＋MSG-004・L1-011,029） [L1:L1-M0301-011,L1-M0301-029; fixture:SEED-M0301-PROD@TBD-D5]（削除結果のDB正しさの検証はDELEG。afterEachで帯再投入）				
m03-01_admin_product_product_search_list	E2E-M0301C-057	IT-26	メッセージ	P1	【改訂2再是正・bound復帰】商品削除完了で「削除しました」が管理画面上部に表示され商品検索・一覧画面に遷移する（本画面へのフラッシュ表示・着地=遷移先の確認に限定。削除実行そのもののPOST/DB効果はDELEG）	ログイン済／SEED-M0301-PROD	990301を削除	1. 990301を削除 2. フラッシュ文言と遷移先を確認（削除の実処理経路自体は要実機）	「削除しました」(ja)/"Deleted"(en)表示後商品検索・一覧画面に遷移する（MSG-005・L1-030がこの画面への着地を規定） [L1:L1-M0301-030; fixture:SEED-M0301-PROD@TBD-D5]（削除POST/DB効果の正しさはDELEG。トリガー手段の具体は要実機・§9）				
m03-01_admin_product_product_search_list	E2E-M0301C-059	IT-26	メッセージ	P2	【改訂2再是正・bound復帰】1件以上の状態変更適用完了で「%status%: %count%件が正常に適用されました」表示後一覧に遷移する（本画面へのフラッシュ表示・着地の確認に限定。状態変更処理そのもののPOST/DB効果はDELEG）	ログイン済／SEED-M0301-PROD	990301,990302を選択し状態変更	1. 状態変更を1件以上適用 2. フラッシュ文言(status/count埋込)と遷移先を確認	「%status%: %count%件が正常に適用されました」（実値埋込）表示後一覧に遷移する（MSG-007・L1-032） [L1:L1-M0301-032; fixture:SEED-M0301-PROD@TBD-D5]（状態変更POST/DB効果の正しさはDELEG。トリガー手段の具体は要実機・§9）				
m03-01_admin_product_product_search_list	E2E-M0301C-061	IT-26	メッセージ	P2	【改訂2再是正・bound復帰】既に削除済みの商品を削除しようとすると「既に削除されています」表示後一覧に遷移する（本画面へのフラッシュ表示・着地の確認に限定。削除試行の判定ロジックそのものはDELEG）	ログイン済／SEED-M0301-DELETED(990501は既に削除済)	990501を削除操作	1. 990501に対し削除を試みる 2. フラッシュ文言と遷移先を確認	「既に削除されています」(ja)/"No data to delete"(en)表示後商品検索・一覧画面に遷移する（MSG-008・L1-033） [L1:L1-M0301-033; fixture:SEED-M0301-DELETED@TBD-D5]（判定ロジックの正しさはDELEG。トリガー手段の具体は要実機・§9）				
m03-01_admin_product_product_search_list	E2E-M0301C-060	IT-26	画面表示データ	P2	GET表示(初期表示・resume双方)はエラーが表示されず処理を継続できる	ログイン済／SEED-M0301-PAGE	—	1. GET /product 2. GET /product?resume=1 3. いずれもエラー無し・一覧描画を確認	いずれもエラー表示なく一覧が表示され処理が継続される ／ 自動検証(内部): HTTPステータス=200 [L1:L1-M0301-018; fixture:SEED-M0301-PAGE@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-063	IT-26	フィールド定義	P2	規格更新日(開始)はpc.update_dateの下限、(終了)は終日inclusive(翌日0時未満)として扱われる	ログイン済／SEED-M0301-PROD	update_date_from=`2026-06-01`,update_date_to=`2026-06-01`	1. 開始=終了=同日でPOST検索 2. 当日分の規格更新行が含まれることを確認(終日inclusive) 3. pc.update_dateの下限判定を確認	同日の規格更新行が含まれる(終了は翌日0時未満として解釈=終日inclusive) [L1:L1-M0301-041,L1-M0301-046,L1-M0301-048; fixture:SEED-M0301-PROD@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-065	IT-22	バリデーション	P1	POST検証エラー時はhas_errorsが真となり「検索条件に誤りがあります」系メッセージブロックが表示され一覧テーブルは出ない	ログイン済	update_date_from=`2026-06-01`,update_date_to=`2026-05-01`(終了<開始)	1. 左記でPOST検索 2. メッセージブロックと一覧テーブル有無を確認	「検索条件に誤りがあります」系メッセージブロックが表示され一覧テーブルは表示されない [L1:L1-M0301-049; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-01_admin_product_product_search_list	E2E-M0301C-066	IT-24	検索条件	P2	該当0件の検索条件では「検索結果がありません」メッセージが表示される	ログイン済	product_name=`E2E該当なしXXXXXXXXX`	1. 該当しない条件でPOST検索 2. メッセージ表示を確認	「検索結果がありません」メッセージが表示される [L1:L1-M0301-050; fixture:SEED-M01-ADMIN@TBD-D5]				
```

### §4.2 補完行（14行。**親test_idなし・母集合会計に算入しない**。理由=Excel設計書に規定があるが
母集合69行の期待テキストに対応する親が存在しない＝excel_delta刷新点の存在確認）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-01_admin_product_product_search_list	E2E-M0301C-080	IT-25	Excel削除項目	P1	検索入力の公開状態チェックに「限定公開」の選択肢が存在しない	ログイン済	—	1. GET /product の公開状態チェック項目を確認	選択肢は「公開」「非公開」のみで「限定公開」は存在しない [L1:L1-M0301-057; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-081	IT-25	Excel追加項目	P1	検索入力の状態チェックに「その他」が存在しNMが初期チェックされている	ログイン済	—	1. GET /product の状態チェック項目とその初期チェック状態を確認	NM/SP/MP/HP/その他が存在しNMのみ初期チェックされている [L1:L1-M0301-058; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-082	IT-25	Excel追加項目	P1	検索入力にFoil検索項目(Foil/ノーマル/特殊)が存在する	ログイン済	—	1. GET /product のFoilチェック項目を確認	Foil/ノーマル/特殊のチェック項目が存在する [L1:L1-M0301-059; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-083	IT-25	Excel追加項目	P1	検索入力にフレーム検索項目(通常/特殊)が存在する	ログイン済	—	1. GET /product のフレームチェック項目を確認	通常/特殊のチェック項目が存在する [L1:L1-M0301-060; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-084	IT-25	Excel削除項目	P1	検索入力に在庫変更CSV出力ボタン・在庫一括編集ボタンが存在しない	ログイン済	—	1. GET /product のボタン群を確認	「在庫変更CSV出力」「在庫一括編集」ボタンは存在しない(在庫管理へ移動) [L1:L1-M0301-061; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-085	IT-25	Excel削除項目	P1	検索結果に在庫変更CSV出力・在庫一括編集・価格一括編集・買取価格一括編集の4ボタンが存在しない	ログイン済	—	1. GET /product 一覧上部のボタン群を確認	4ボタンとも存在しない [L1:L1-M0301-063; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-086	IT-25	Excel追加項目	P1	検索結果に買取・基準価格一括編集ボタンが存在し押下で買取・基準価格一括編集画面へ遷移する	ログイン済	買取・基準価格一括編集ボタン押下	1. ボタンの存在を確認 2. 押下して遷移先を確認	ボタンが存在し買取・基準価格一括編集画面へ遷移する [L1:L1-M0301-064; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・excel補完。遷移先URLの具体は要実機）				
m03-01_admin_product_product_search_list	E2E-M0301C-087	IT-25	Excel項目	P2	検索結果の件数プルダウンに10/50/100/300/500/1000/2000/10000/12000件の9選択肢が存在する	ログイン済	—	1. 件数プルダウンの選択肢一覧を確認	9選択肢すべてが存在する [L1:L1-M0301-065; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-088	IT-25	Excel追加項目	P2	検索結果の表示データ切替えセレクトで3種(通販+TC東京/支店/入庫数)を切替えると識別ID24-29列の表示内容が連動する	ログイン済／SEED-M0301-PROD	表示データ切替え=入庫数	1. 表示データ切替えで「入庫数」を選択 2. 当日〜90日間列の表示内容が入庫数へ切り替わることを確認	識別ID24-29列が入庫数の値へ切り替わる [L1:L1-M0301-066,L1-M0301-068; fixture:SEED-M0301-PROD@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-089	IT-25	Excel追加項目	P3	【改訂1是正】検索結果の「…」(三点リーダー)クリックでExcel記載の識別ID41-44に対応するツールチップ群が表示/非表示される（item-table実体31-34との対応はTBD＝要ソース確認のため対応関係を断定しない）	ログイン済／SEED-M0301-PROD	三点リーダークリック	1. 三点リーダーをクリック 2. 何らかのツールチップ群の表示切替が発生することを確認（対象がNo.31-34のいずれに対応するかは実機DOM調査で特定する＝要実機）	クリックでツールチップ表示/非表示が切り替わる（Excel逐語は識別ID41-44「変動履歴」「NM変動履歴」「価格履歴」「NM価格履歴」を指すが、item-table実体31-34との対応はExcel原本に明記が無くTBD） [L1:L1-M0301-069; fixture:SEED-M0301-PROD@TBD-D5]（補完行・excel補完。対応関係の特定は要実機・§9）				
m03-01_admin_product_product_search_list	E2E-M0301C-090	IT-25	Excel追加仕様	P2	検索結果一覧はNM/SP/MP/HPの在庫数・販売数・入庫数を合算して出力し表示順は棚番号昇順である	ログイン済／SEED-M0301-PROD	—	1. 複数規格(NM/SP等)を持つ商品の一覧行を確認 2. 合算値と行の並び順(棚番号昇順)を確認	NM/SP/MP/HPの値が合算表示され、表示順は棚番号昇順である [L1:L1-M0301-070; fixture:SEED-M0301-PROD@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-091	IT-25	Excel追加仕様	P2	販売数の表示期間は「90日間」まで出力される	ログイン済／SEED-M0301-PROD	表示データ切替え=販売数(通販+TC東京)	1. 表示データ切替えで販売数を選択 2. 90日間列までの表示があり91日以降の列が無いことを確認	90日間までの列が表示され、それを超える期間の列は出力されない [L1:L1-M0301-071; fixture:SEED-M0301-PROD@TBD-D5]（補完行・excel補完）				
m03-01_admin_product_product_search_list	E2E-M0301C-092	IT-25	Excel追加仕様	P2	買取数/入庫数の表示行に「入庫数」行が追加されており90日間までの入庫数が出力される	ログイン済／SEED-M0301-PROD	表示データ切替え=入庫数	1. 入庫数行の存在と90日間までの列出力を確認	「入庫数」行が存在し90日間までの入庫数が出力される（現状踏襲の保存済みデータを表示） [L1:L1-M0301-072; fixture:SEED-M0301-PROD@TBD-D5]（補完行・excel補完）				
```

## §5 locale対応表

- LS=1 claim（9件）: L1-026〜L1-034（M03-01-MSG-001〜009の9メッセージすべて）。
- **ja/en共に一次資料逐語で確定=8件**（messages.ja/en.yaml逐語一致確認済み）:
  - L1-026 MSG-001 ja「パスワードを更新しました」／en "Your password has been changed"
    （messages.ja.yaml:1908／messages.en.yaml:1886）
  - L1-028 MSG-003 ja「削除中...」／en "Deleting..."（messages.ja.yaml:2050／messages.en.yaml:1929）
  - L1-029 MSG-004 ja「商品の削除処理が完了しました」／en "Product has been deleted successfully."
    （messages.ja.yaml:2051／messages.en.yaml:1930）
  - L1-030 MSG-005 ja「削除しました」／en "Deleted"（messages.ja.yaml:1593／messages.en.yaml:1638）
  - L1-031 MSG-006 ja「関連するデータがあるため『%name%』を削除できませんでした／削除に失敗しました」／
    en "Sorry, we are unable to delete %name%, because it has related data. ／ Failed to delete"
    （messages.ja.yaml:1595,1594／messages.en.yaml:1642,1639）
  - L1-032 MSG-007 ja「%status%: %count%件が正常に適用されました」／
    en "%status%: %count% item(s) is/are successfully applied."
    （messages.ja.yaml:1957／messages.en.yaml:1910）
  - L1-033 MSG-008 ja「既に削除されています」／en "No data to delete"
    （messages.ja.yaml:1596／messages.en.yaml:1643）
  - L1-034 MSG-009 ja「商品を削除してよろしいですか？」／en "Are you sure to delete this product?"
    （messages.ja.yaml:2049／messages.en.yaml:1928）
- **共有インフラのキーが特定できないがpf md自体がja=enの同一literalを直接記載=1件（L1-027 MSG-002
  "Failed"/"Failed"）**: messages.ja.yaml内に完全一致する管理系キーがgrep実測で見つからず
  （JSのハードコードliteralである可能性が高い＝ee実装コードでの確認は規約により行わない）。
  ja/enとも同一の"Failed"であることはpf md表自体が直接記載しており翻訳生成ではないため、
  **pf-fallback（pf md直接引用）のみでja/enとも確定**とする（en一次資料キー不発見の事実は§9に記録）。
- pf mdのメッセージ表と共有インフラyamlの間に**齟齬は検出されなかった**（m03-11で見つかったような
  en列の不一致は本機能では確認されず。§10に記録）。
- 全9メッセージが一次資料の逐語で確定＝**en確定率9/9（100%）**（L1-027含め全件、ただしL1-027は
  共有インフラのキー同定はできず"pf mdへの直接依拠"という限定付き）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 request契約

- 一覧/検索: `GET /%eccube_admin_route%/product`・`POST /%eccube_admin_route%/product`・
  `GET /%eccube_admin_route%/product/page/{page_no}`（md:36-39,300以降相当は本機能pf mdに
  ルート名節が別途あるが本書は利用者視点入口=md:36-44を正とする）。
- ボディ: `SearchProductType` が生成するフォーム（フォーム名は本機能pf mdに未記載＝**要実機**）。
  キー: `product_name`・`card_name`・`product_id`・`product_code`・`category_id`・`status`・
  `cardset`・`rarity`・`language`・`card_condition`・`foil`・`frame`・`promotion`・`tag_id`・
  `storage_code_id`・`sell_price_from/to`・`standard_price_from/to`・`buy_price_from/to`・
  `stock_from/to`・`order_date`・`order_quantity_from/to`・`update_date_from/to`・
  `tag_sales_analysis`・`expensive`・`section`・`shelf_number`・隠し`id`・隠し`sortkey`・隠し`sorttype`
  （各キー名はmd:141-175の「キー」列逐語）。
- クエリ: `page_no`・`page_count`・`mode`・`resume`（md:210）。
- DB照会: `e2e/helpers/db.ts`（docker exec psql・読取専用。本機能はDB非更新のためcleanup不要=L1-056）。
  オラクル解決: `e2e/helpers/oracle.ts` の `o(id, "m03_01_oracle")` 方式（**正式fixtureは未作成**。
  候補段階では消費なし）。
- **CSRFトークンのフィールド実name・フォーム名(admin_XXX)・DOM idは一次資料に未記載=要実機**
  （ee twig/Form照合は規約で行わない）。

### §6.2 _drafts/隔離lint証跡（実測・本候補作成時に確認）

1. oracle草案は `e2e/fixtures/oracle/_drafts/m03-01_admin_product_product_search_list_oracle_draft.json`
   のみに生成。**正式パス `e2e/fixtures/oracle/` 直下への書込なし**（git statusで確認可能）。
2. 正式解決器 `e2e/helpers/oracle.ts:16-25` の隔離ガード（`_drafts`・パス区切り・`..` をthrow）により
   正式specから本草案は解決不能。
3. 本候補は spec/page 実装・実走なし。既存 `e2e/` 配下の spec・page への変更なし。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright(GUI): C-001/002/003/004/005/005B/006/007/008/009/010/011/012/013/016/019〜032/033/034/035/
  037/040/050/052/054/055/056/057/059/061/060/063/065/066・補完行080〜092。
  （※-036/-068/-069 は bound_overreach で TBD化のため実行対象から除外＝§8/§9。R7是正）
- Playwright+DB照会(db.ts): C-001(セッション反映),C-002,C-016,C-033,C-037,C-038,C-047。
- 非UI(request契約直POST): 該当なし（**改訂3でC-017を候補から削除**＝母集合-017,-067はTBDへ移動・§8/§9）。
- 母集合の実行方法（-004,-005,-009,-012〜032のうち一部,-037〜047等=非UI14行・他=Playwright55行）は
  系譜として§8で保持・本候補の区分はあくまで候補。
- **改訂1でC-053,055,056,057,059,061を候補から削除したが、改訂2でC-055,056,057,059,061は
  一覧画面自身のJS/モーダル/メッセージ/遷移の観測に限定してbound復帰**（C-053=MSG-001パスワード変更のみ
  別画面のため除外継続。§8参照）。SEED-M0301-DELETEDはC-061（MSG-008表示・遷移観測）で使用。
- 破壊的（UI操作の結果としてSEED帯商品が削除・状態変更され得る）: C-055/056/057/059/061（一括削除・
  単体削除・状態変更の**UI操作自体はSEED-M0301-PROD/DELETEDの帯商品に作用し得る**ため、afterEachで
  帯再投入する。ただし本書のclaimはDB効果の正しさを検証しない＝観測はメッセージ・モーダル・遷移先に
  限定し、削除/状態変更が実際に正しく行われたかのDB照会は行わない）。それ以外の検索・一覧操作は
  読み取り専用（L1-056）。
- **改訂4でC-036は候補から削除**（母集合-036はTBDへ移動。プラグイン搭載環境が無ければ条件付き正例を
  正検証できないため。§8/§9参照）。
- **改訂5でC-068,069は候補から削除**（母集合-068,-069はTBDへ移動。母集合の期待自体が「〜になり得る」
  という可能性事象であり、1回の実行でpass/fail判定できないため。改訂4で試みた確認値部分への判定根拠
  差替えはbound_overreachと判定し撤回。§8/§9参照）。
- 実行保留: C-054（規格情報取得失敗の再現手段が
  要実機）・C-057/059/061（削除・状態変更を実際に「トリガーする」手段の具体的なUI導線・formaction・
  ボタンセレクタは本機能pf mdに薄く要実機。ただし表示メッセージ自体はL1で確定済み）・
  C-027/028/063（期間別販売数・
  規格更新日の日付演算の具体的な相対日付対応が`@TBD-D5`）。
- 聖域判定・多軸属性の正式付与はD14後（本節は候補の参考情報であり正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル・前提条件ラベルは不使用＝ノイズ）。
1候補ケース行=1 assertion bundle・多対一は shared-observation。
**参照先の全候補行は§4に実体掲載済み＝69↔候補の期待テキスト突合が本文内で完結する**。

### 集計（69 test_id 全数会計・差分0・**改訂5で再計算**）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **60** | 下表（改訂1で6件をexcludedへ移動→改訂2でうち5件をbound復帰→改訂3で-017,-067をTBDへ移動→改訂4で-036をTBDへ移動→改訂5で-068,-069をTBDへ移動） |
| **TBD** | **7** | -018,-058（プレースホルダ）＋-017,-067（改訂3）＋-036（改訂4）＋**-068,-069（改訂5・bound_overreach是正）** |
| **excluded** | **2** | -009（必須バリデーション想定だが全30入力項目が「任意」）＋-053（パスワード変更＝別画面＝DELEG） |
| 合計 | **69** | 欠落0・理由なし重複0 |

- 候補ケース行総数**62**（§4.1 bound対応48＋§4.2 補完14。改訂1でC-053,055,056,057,059,061=6行削除→
  改訂2でC-055,056,057,059,061=5行をbound復帰・再掲載→改訂3でC-017=1行削除→改訂4でC-036=1行削除→
  **改訂5でC-068,069=2行削除**。C-053のみ削除のまま）。
- **【改訂5で追加・決定的ルール】TBD根拠（-068,-069・codex R5 Major3指摘）**: 母集合-068の期待
  「フォームに無いキーだけが残るとSymfonyフォームがエラーに**なり得る**こと」・母集合-069の期待
  「固定文字列プレースホルダのまま残り検索結果と一致しない表示に**なり得る**こと」は、いずれも
  一次資料（md:185,186）自身の可能性表現をそのまま引き継いだものであり、**1回の実行でpass/fail
  を一意に判定できない**。改訂4のC-068/C-069は「stock配列によるDB側絞込みが行われないこと」
  「固定文字列プレースホルダの存在」という**別の定言的事実**へpass/fail判定根拠を差し替えていたが、
  これは母集合-068,-069が実際に要求する事象（フォームエラーの発生／表示の不一致）そのものの
  充足検証にはならない＝**bound_overreach**（-017/-067・-036と完全同型）。
  **以後、同種の「言い換え・refinementによるbound維持」は機械的に禁止する**: 母集合の期待が
  「〜になり得る/可能性」または「条件成立時のみの正例」で1回の実行でpass/fail判定できないものは、
  いかなる定言的な副次事実を持ち出してもboundにできない＝TBD(要ソース確認)。
  是正: 母集合-068,-069をbound→TBDへ再移動。C-068,C-069の候補行を§4.1・§7・§9.2から削除。
  L1-M0301-052,053のclaim自体（pf md逐語）は引き続き保持するが、母集合-068,-069とのbindはTBDである
  旨を明記する（§9.1 TBD-6,7参照）。
- **【改訂5・最終自己監査】bound_overreachクラスの完全払拭**: -068,-069を含め、現行bound全行を
  改めて「可能性/条件付き正例をboundにしていないか」で再点検した。該当は-068,-069の2件のみ
  （いずれも-036と同時に改訂4で発見済みだったが、その際は誤ってrefinementでboundを維持していた）。
  他に該当なし（§9.4はbound維持根拠の代表例として更新済み）。本改訂でbound_overreachクラス
  （母集合が要求する可能性/条件付き事象そのものを検証できないままboundと主張する誤り）は
  現時点で確認できる範囲で完全に解消したと判断する。
- **【改訂4で追加】TBD根拠（-036・codex R4 Major1指摘＋網羅スイープ）**: 母集合-036の期待テキスト
  「実行結果の該当レコードが取得結果に含まれること（クエリカスタマイザ）」は、一次資料md:133
  「クエリの末尾でQueryKey::PRODUCT_SEARCH_ADMINに登録されたカスタマイザがあれば、追加の結合・条件が
  入る。」という**条件付き正例**（カスタマイザが実際に登録されている環境でのみ成立）に対応する。
  改訂2までのC-036は「プラグイン非搭載の標準環境では追加条件が発生しない」という**前提を満たさない側
  （否定的観測）のみ**を確認し、「登録済み環境で実際に追加結合・条件が正しく反映され取得結果に反映
  される」という**母集合が本来要求する正例側**は実行保留のままだった。母集合-036の期待（取得結果に
  含まれること＝正例の充足）を、この環境では検証しようがない＝**現状の候補環境では母集合の期待値を
  boundできない＝要ソース確認(TBD)**と判定した。C-036の候補行は§4.1・§7・§9.2から削除。
  L1-M0301-042のclaim自体（pf md逐語）は引き続き保持するが、母集合-036とのbindはTBDである旨を
  明記する（§9.1 TBD-5参照）。
- **【改訂4・網羅スイープ（当時の判定・改訂5で一部修正）】**: 上記-036以外の全bound候補（当時63件）に
  ついて、各母集合test_idの期待テキストと対応する一次資料逐語を再照合し、(a)一次資料が可能性表現の
  みで母集合が必発を要求していないか、(b)一次資料の要件が環境/前提依存で候補がその前提を満たさない
  ままになっていないか、(c)観測に必要な出口がcross-feature/別画面/要実機で候補では観測不能になって
  いないか、の3観点で監査した。**当時はC-068・C-069について「確認値部分への根拠差替えで足りる」と
  誤って判定していたが、改訂5でこれをbound_overreachと再認定しTBDへ修正した**（上記参照）。
- **【改訂3で追加】TBD根拠（-017,-067・codex R3 Major1指摘）**: 改訂2まででC-017は「実行時エラーに
  なり得る（200が返る可能性も含め必発断定はしない）」という**可能性のみの観測**へ弱められていた。
  しかし母集合-017の期待テキストは「DBとの相関バリデーションでエラーが表示され、対象処理が完了しない
  こと」＝**必発のエラー表示＋処理未完了**を要求しており、-067も「…実行時エラーになり得ること」の
  記述に対応する検証項目である。C-017のような「エラーが起きても起きなくても観測を記録するだけ」の
  試験では、母集合が要求する**必発**の成分を検証できない（200応答でも「合格」に見えてしまう）。
  一次資料（pf md:70,184）自体が「実行時エラーになり得る」と可能性のみを述べ必発を断定しないため、
  **現状の一次資料だけでは母集合-017,-067の期待値をboundできない＝要ソース確認(TBD)**と判定した
  （偽陽性的bound計上の是正）。C-017の候補行は§4.1から削除。L1-M0301-020,051のclaim自体（pf md逐語）は
  引き続き保持するが、これらのclaimと母集合-017/-067とのbindはTBDである旨を明記する（§9参照）。
- excluded根拠（**実test_idを引いて期待テキストで確認済み**）:
  - **-009（1件）**: 期待「必須バリデーションでエラーが表示され、対象処理が完了しないこと。」。
    入力項目表（md:139-175）は**全30行が「任意」**（代表: md:141「商品名（日／英） \| 任意 \| …」、
    md:175「一覧ソート向き \| 任意 \| …」）であり、`NotBlank` 相当の必須項目は本機能に1件も存在しない
    （検索フォームは性質上すべて絞り込み条件＝任意入力）。**この「必須エラーが表示されない」側の
    意味成分は-010がbound被覆＝偽陰性なし**（L1-043）。
  - **-053（1件・EX-SCOPE1・改訂1追加・改訂2でも維持）**: 期待「パスワード変更画面に遷移すること。」。
    根拠のM03-01-MSG-001の表示条件は「パスワード変更を保存したとき」（md:107）であり、
    パスワード変更は**別画面・別導線**（本機能の入口=md:36-44にパスワード変更フォームの送信経路は
    存在せず、着地先もこの画面ではない）。よってbound不可＝**excluded(DELEG)**。L1-026は情報保持のみ。
  - **【改訂2で是正】-055,-056,-057,-059,-061はbound復帰（codex R2 Major2指摘）**: 改訂1では
    「本機能はDBへの登録・更新・削除は行わない（md:233）」「一括削除・状態変更等のPOST先ルートは
    本書スコープ外（md:267）」を理由に一律excludedへ移動したが、これは**削除・状態変更のPOST処理/
    DB効果**と**この画面自身が担うJS・モーダル・メッセージ表示・遷移先**という異なる2つの成分を
    混同した過剰除外（偽陰性）だった。pf md:53は「一括削除はAjaxで各行の削除URLを順に呼びモーダルで
    進捗表示（完了後リロード）。規格確認ボタンはAjaxでモーダル本文を差し替え。」と**本機能自身の
    フロント挙動**として明記し、md:109-115（MSG-003〜MSG-009）も**本機能自身の表示メッセージ表**
    としてja/en文言・表示位置・後続処理（遷移先を含む）を定義している。よって「モーダル/メッセージの
    表示・遷移先」という成分は本機能でbound可能。**「削除/状態変更が実際にDBへ正しく反映されるか」
    という成分のみ**は本機能の処理フロー(md:63-76)に記載が無い別導線でありDELEG（本claimの検証対象に
    含めない）。母集合-055,-056,-057,-059,-061は「表示され/遷移する」という期待テキストの意味成分が
    表示・遷移の観測で充足されるためbound（L1-028,029,030,032,033）。

### 69対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | フォーム既定値で検索ビューデータをセッションへ書き込み、ページ1を表示すること | bound | C-001 |
| 002 | 検証に成功すれば条件をセッションへ保存しページ番号を1にし、同一条件で一覧を組み立てること | bound | C-002 |
| 003 | セッションの検索条件とページ番号を更新し、Nページ目を表示すること | bound | C-003 |
| 004 | 隠しフィールドsortkey・sorttypeを更新して送信し、ページ番号は1にリセットされるPOST分岐に入ること | bound | C-004 |
| 005 | mtb_page_maxに存在する件数ならセッションへ保存し、その件数で分割すること | bound | C-005,C-005B |
| 006 | セッションの表示モードを更新し、同一ページ番号で再描画すること | bound | C-006 |
| 007 | 商品編集画面へ遷移すること | bound | C-007 |
| 008 | セッションに保存されたページ番号を復元し、検索条件もセッションから復元すること | bound | C-008 |
| 009 | 必須バリデーションでエラーが表示され、対象処理が完了しないこと | **excluded** | — |
| 010 | 必須バリデーションでエラーが表示されず、対象処理を継続できること | bound | C-010 |
| 011 | 複数選択フィールドにselect2（カテゴリ、エキスパンション、タグ、略称タグ、売上分析タグ、部門、棚番号）であること | bound | C-011 |
| 012 | 相関バリデーションでエラーが表示され、対象処理が完了しないこと | bound | C-012 |
| 013 | 相関バリデーションでエラーが表示されず、対象処理を継続できること | bound | C-013 |
| 014 | 同上（されず） | bound | C-013 (shared) |
| 015 | 同上（され） | bound | C-012 (shared) |
| 016 | DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること | bound | C-016 |
| 017 | DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと | **TBD** | —（改訂3・§9 TBD-3。必発エラーを一次資料は断定しない） |
| 018 | **「要ソース確認であること。」**（期待自体がプレースホルダ） | **TBD** | —（§9 TBD-1） |
| 019 | 検索条件の該当レコードが取得結果に含まれること（カテゴリ） | bound | C-019 |
| 020 | 検索条件の該当レコードが取得結果に含まれないこと（カテゴリ） | bound | C-020 |
| 021 | 含まれること（言語3種全選択） | bound | C-021 |
| 022 | 含まれないこと（言語一部選択） | bound | C-022 |
| 023 | 含まれること（プロモ単独一致） | bound | C-023 |
| 024 | 含まれないこと（プロモ単独非一致） | bound | C-024 |
| 025 | 含まれること（高額商品単独一致） | bound | C-025 |
| 026 | 含まれないこと（高額商品単独非一致） | bound | C-026 |
| 027 | 含まれること（期間別販売数範囲内） | bound | C-027 |
| 028 | 含まれないこと（期間別販売数範囲外） | bound | C-028 |
| 029 | 含まれること（部分一致エスケープ） | bound | C-029 |
| 030 | 含まれないこと（エスケープによる誤爆防止） | bound | C-030 |
| 031 | 含まれること（在庫範囲内） | bound | C-031 |
| 032 | 含まれないこと（在庫範囲外） | bound | C-032 |
| 033 | 実行結果の該当レコードが取得結果に含まれること（一覧総件数） | bound | C-033 |
| 034 | 同上（画面に出す規格行） | bound | C-034 |
| 035 | 同上（ソート結果） | bound | C-035 |
| 036 | 同上（クエリカスタマイザ） | **TBD** | —（改訂4・§9 TBD-5。プラグイン非搭載環境では条件付き正例を検証不能） |
| 037 | 更新内容の対象レコードの値が変更されること（セッション:検索ビューデータ） | bound | C-037 |
| 038 | 更新内容の対象レコードの値が変更されないこと（DB非更新） | bound | C-038 |
| 039 | 変更されること（セッション:page_no=1） | bound | C-037 (shared) |
| 040 | 管理画面共通の挙動により利用できないこと（未ログイン） | bound | C-040 |
| 041 | 変更されること（セッション:page_count） | bound | C-005 (shared) |
| 042 | 変更されること（セッション:display_mode） | bound | C-006 (shared) |
| 043 | 変更されないこと（DB非更新） | bound | C-038 (shared) |
| 044 | 変更されること（セッション:page_no=N、ページ送り） | bound | C-003 (shared) |
| 045 | 変更されないこと（DB非更新） | bound | C-038 (shared) |
| 046 | 変更されること（セッション:search_nonstock上書き） | bound | C-009 (shared) |
| 047 | 実行結果の対象レコードの値が変更されること（副作用まとめ） | bound | C-047 |
| 048 | セッションに保存されたページ番号を復元し検索条件も復元すること | bound | C-008 (shared) |
| 049 | 別節およびエッジケース参照であること | bound | C-009 (shared) |
| 050 | 見出しは商品一覧であること | bound | C-050 |
| 051 | 複数選択フィールドにselect2であること | bound | C-011 (shared) |
| 052 | 規格一覧確認モーダル、一括完全削除モーダルであること | bound | C-052 |
| 053 | パスワード変更画面に遷移すること | **excluded(DELEG)** | —（改訂1・EX-SCOPE1） |
| 054 | エラーを表示し、商品検索・一覧画面に留まること | bound | C-054 |
| 055 | 削除処理中を表示し、商品検索・一覧画面に留まること | bound | C-055（改訂2でbound復帰。モーダルJS挙動の観測に限定） |
| 056 | 完了を表示し、商品検索・一覧画面を再読み込みすること | bound | C-056（改訂2でbound復帰。完了後リロードJS挙動の観測に限定） |
| 057 | 商品検索・一覧画面に遷移すること | bound | C-057（改訂2でbound復帰。フラッシュ・遷移先の観測に限定） |
| 058 | **「要ソース確認であること。」**（期待自体がプレースホルダ） | **TBD** | —（§9 TBD-2） |
| 059 | 商品検索・一覧画面に遷移すること | bound | C-059（改訂2でbound復帰。フラッシュ・遷移先の観測に限定） |
| 060 | 画面表示データでエラーが表示されず、対象処理を継続できること | bound | C-060 |
| 061 | 商品検索・一覧画面に遷移すること | bound | C-061（改訂2でbound復帰。フラッシュ・遷移先の観測に限定） |
| 062 | 画面表示データでエラーが表示されず、対象処理を継続できること | bound | C-060 (shared) |
| 063 | pc.update_dateの下限であること | bound | C-063 |
| 064 | 終日inclusiveであること | bound | C-063 (shared) |
| 065 | has_errorsが真となり、「検索条件に誤りがあります」系のメッセージブロックを表示であること | bound | C-065 |
| 066 | 「検索結果がありません」メッセージを表示であること | bound | C-066 |
| 067 | リポジトリがorderByする時点で未定義添字参照となり、実行時エラーになり得ること | **TBD** | —（改訂3・§9 TBD-4。同上） |
| 068 | コントローラはCSV用マージ処理を経由せずsubmitAndGetDataするため、フォームに無いキーだけが残るとSymfonyフォームがエラーになり得ること | **TBD** | —（改訂5・§9 TBD-6。可能性事象を1回の実行でpass/fail判定できない） |
| 069 | 一部が固定文字列のプレースホルダのまま残っており、検索結果データと一致しない表示になり得ること | **TBD** | —（改訂5・§9 TBD-7。同上） |

`func_scope_check` 判定: 親69/69会計済み・欠落0・理由なし重複0・補完14行は§4.2に実体掲載
（全て excel補完・母集合会計外）→**差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（母集合会計のTBD=7件＋claim側限定。改訂3で2件追加・改訂4で1件追加・改訂5で2件追加）

| 区分 | 件数 | 内容 |
|---|---:|---|
| TBD:要ソース確認（母集合プレースホルダ） | 母集合2件（-018,-058） | 期待テキスト自体が「要ソース確認であること。」というプレースホルダで、具体的な検証対象がpf md/Excelいずれにも特定できない（m03-11の-052と同種）。 |
| **TBD-3: 母集合-017（DBとの相関バリデーション・必発エラー）（改訂3追加）** | 母集合1件（-017） | 期待テキスト「DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと」は**必発**のエラー表示＋処理未完了を要求する。対応するL1-020（md:70「先に失敗する」）・L1-051（md:70,184「実行時エラーになり得る」）はsortkeyが列マップ外のときの挙動を述べるが、md:184は「なり得る」という**可能性の表現**であり必発を断定しない。母集合の必発要求と一次資料の可能性表現の間にギャップがあり、**現状の一次資料だけでは母集合の期待値を確定的にboundできない**＝要ソース確認(TBD)。実装ソース（コントローラ/リポジトリの例外処理・エラーハンドラ設定）を確認すれば必発性が確定し得るが、規約によりee実装コードの参照はできない。 |
| **TBD-4: 母集合-067（sortkey列マップ外の実行時エラー）（改訂3追加）** | 母集合1件（-067） | 期待テキスト自体は「…実行時エラーになり得ること」と一次資料と同じ可能性表現だが、これを検証するC-017（候補行）が「200が返っても合格になる」観測限定の試験に弱められていたため、TBD-3と同一の理由（必発性の実装未確定）でboundを見送りTBDとした。TBD-3と同一根拠のペア。 |
| **TBD-5: 母集合-036（クエリカスタマイザの条件付き正例）（改訂4追加）** | 母集合1件（-036） | 期待テキスト「実行結果の該当レコードが取得結果に含まれること（クエリカスタマイザ）」は、一次資料md:133「クエリの末尾でQueryKey::PRODUCT_SEARCH_ADMINに登録されたカスタマイザがあれば、追加の結合・条件が入る。」という**条件付き正例**（カスタマイザ登録済み環境でのみ成立）に対応する。改訂2までのC-036は「プラグイン非搭載の標準環境では追加条件が発生しない」という前提非充足側のみを確認しており、母集合が要求する「登録済み環境で正しく反映される」という正例側は未検証のまま実行保留にしていた。**本候補の環境（プラグイン非搭載）では母集合-036の期待をそもそも検証しようがない**＝要ソース確認(TBD)。カスタマイザを実際に登録したテスト環境が用意できれば正検証可能。 |
| **TBD-6: 母集合-068（search_nonstockのフォームエラー可能性）（改訂5追加・bound_overreach是正）** | 母集合1件（-068） | 期待テキスト「フォームに無いキーだけが残るとSymfonyフォームがエラーに**なり得る**こと」は一次資料md:185自身の可能性表現をそのまま引き継いでおり、1回の実行でpass/failを一意に判定できない。改訂4のC-068は「stock配列によるDB側絞込みが行われないこと」という**別の定言的事実**へpass/fail判定根拠を差し替えていたが、これは母集合が実際に要求する事象（フォームエラーの発生）そのものの充足検証にはならない＝bound_overreach。是正してTBDへ移動。実装（コントローラのエラーハンドリング）を確認すれば必発性が確定し得るが、規約によりee実装コードの参照はできない。 |
| **TBD-7: 母集合-069（一覧テンプレート表示不一致の可能性）（改訂5追加・bound_overreach是正）** | 母集合1件（-069） | 期待テキスト「固定文字列プレースホルダのまま残り検索結果と一致しない表示に**なり得る**こと」は一次資料md:186自身の可能性表現をそのまま引き継いでおり、1回の実行でpass/failを一意に判定できない。改訂4のC-069は「固定文字列プレースホルダの存在」という**別の定言的事実**へ判定根拠を差し替えていたが、これは母集合が実際に要求する事象（表示の不一致）そのものの充足検証にはならない＝bound_overreach。是正してTBDへ移動。TBD-6と同一根拠のペア（テンプレート実装の詳細確認が必要）。 |
| TBD:期間別販売数の列番号↔実日付対応 | claim側1件（L1-040関連・C-027/028） | pf mdは「フォームが用意する列番号は昨日から365日前まで（当日列はリストに無い）」（md:129）と述べるのみで、列番号と実際の日付オフセットの実装対応表は一次資料に無い＝具体的な入力値と期待範囲の対応は`@TBD-D5`（要実機）。 |
| TBD:MSG-002のen一次資料キー | claim側1件（L1-027） | 「Failed」/「Failed」はja=enの同一literalとしてpf md自体に直接記載されているが、messages.ja.yamlに対応する管理系キーが完全一致検索(grep実測)で見つからず、JSハードコードの可能性がある。ee実装コードでの確認は規約により行わない＝キー未特定のまま**pf md直接引用のみ**でja/en確定（§5）。 |
| TBD:三点リーダーのツールチップ対応関係（改訂1追加） | claim側1件（L1-069・C-089） | Excel逐語（0204 sheet-4:1520）は識別ID41-44を指すが、item-table（No.1-35）には41-44が存在しない。ラベル同名のNo.31-34（変動履歴/NM変動履歴/価格履歴/NM価格履歴）との対応はExcel原本に明記が無い自己推論であったため撤回し、対応関係の特定を**要ソース確認(TBD)**とした（§10）。 |

**改訂3注記**: L1-M0301-020・L1-M0301-051自体（pf md逐語）は§1に引き続き保持する。撤回したのは
これらのclaimと母集合-017/-067との**bind**（およびそれを試みたC-017候補行）のみであり、
claimそのものの逐語性・正確性には変更がない。

**改訂4注記**: L1-M0301-042自体（pf md逐語）も同様に§1に保持する。撤回したのは母集合-036との**bind**
（およびC-036候補行）のみである。

**改訂5注記**: L1-M0301-052・L1-M0301-053自体（pf md逐語）も同様に§1に保持する。撤回したのは
母集合-068/-069との**bind**（およびそれを試みたC-068/C-069候補行）のみである。改訂4で一度
「確認値部分への根拠差替えでboundを維持できる」と判定したこと自体を誤りと認め撤回した
（bound_overreachクラスの機械的ルール適用・§10「改訂5」参照）。

### 9.4 網羅スイープ: bound維持と判定した代表例（過剰TBD化を避けるための根拠。改訂5で更新）

以下はスイープで再監査し、-036/-068/-069とは異なり**一次資料が定言的（非条件付き・非可能性表現・
非cross-feature）であり候補環境で正検証可能**と判断してboundを維持した代表例
（全62件中、該当なしと判定したものの一部を例示）。

| 候補 | 監査観点 | 維持根拠 |
|---|---|---|
| C-012/013（規格更新日の相関） | 「終了が開始より前ならフォームエラー」は条件付きだが、プラグイン等の環境依存ではなく**入力値の組合せ**で完全に再現可能（md:131,168,247は「〜ならエラー」の確定的if-then） | bound維持 |
| C-021/022（言語フィルタ） | md:123の「OR で繋ぐ場合がある」は算出ロジックの分岐記述であり、可能性の否定ではない（3種全選択/一部選択のいずれでも結果は決定的） | bound維持 |
| C-027/028（期間別販売数） | md:129「order_dateが許容リストに含まれる値のときだけ…付けられる」は入力値で満たせる条件（環境依存ではない）。列番号↔日付の詳細対応のみ実行レベルの`@TBD-D5`（母集合accountingとは別レイヤ） | bound維持 |
| C-038/043/045（DB非更新） | md:233「本機能は参照系であり…行わない」は無条件の確定文。db.tsで直接反証可能 | bound維持 |
| C-047（副作用まとめ） | セッション4キー更新は確定的観測可能。イベントディスパッチのみ観測手段未契約で実行保留（**claimの正しさ自体は確定**しており「観測手段が無い」という実行レベルの制約であり、一次資料の可能性表現の問題ではない） | bound維持（イベント部分は実行保留のまま） |
| C-054（MSG-002 "Failed"） | 表示条件・文言は確定的。トリガー手段（規格情報取得失敗の再現）はPlaywrightのネットワークモック等で候補環境内で解決可能な実行詳細であり、cross-feature/環境依存ではない | bound維持（トリガー手段は要実機） |
| C-055〜061（一括削除等のUI/メッセージ） | md:53・md:109-115は本機能自身のJS/メッセージ表として確定的。「削除/状態変更が正しくDBへ反映されるか」のみDELEG、表示・遷移先はbound | bound維持（改訂2の切り分けを再確認） |

**【改訂5で撤回】C-068/069は改訂4で「bound維持（根拠を精密化）」と判定していたが、これはbound_overreach
（母集合の可能性表現をそのまま検証できない事象を、別の定言的事実で置き換えてpassさせる誤り）であり、
改訂5でTBDへ再分類した（§9.1 TBD-6,7参照）。表の維持一覧から削除する。

### 9.2 要実機（実行面の保留＝オラクル化不能ではない）

1. **セレクタ全数未確定**: カスタマイズ画面のtwig/Form照合を規約で行わないため、DOM id・CSRFフィールド
   実name・フォーム名（`SearchProductType`が生成するSymfonyフォームの実name）・select2/collapseの
   実セレクタは**全て要実機**（m03-11同様、excel-primary固有の制約）。
2. **（改訂4でC-036は候補から削除・TBDへ整理）** `QueryKey::PRODUCT_SEARCH_ADMIN` へのカスタマイザ登録は
   プラグイン環境依存（md:133,196）。母集合-036が要求する「登録済み環境での追加条件反映」を検証するには
   実際にカスタマイザを登録した環境が必要であり、標準環境しか持たない本候補では前提を満たせないため
   TBDとした（§9.1 TBD-5参照）。
3. **C-054（MSG-002 "Failed"）**: 「商品の規格情報の取得に失敗したとき」の再現手段（通信断・APIタイムアウト等）
   がpf mdに未規定＝要実機。
4. **（改訂5でC-068/069は候補から削除・TBDへ整理）** search_nonstockのフォーム未知キーエラー・
   一覧テンプレートのプレースホルダ残存はpf md自身が言及する既知の実装課題だが、母集合-068,-069が
   要求する事象（エラー発生／表示不一致）自体は一次資料が可能性表現でしか述べておらず、1回の実行で
   pass/fail判定できないためTBDとした（§9.1 TBD-6,7参照）。
5. **C-027/028/063（日付演算）**: 期間別販売数の列番号↔相対日付、規格更新日の終日inclusive境界の
   具体的な時刻演算はSEED投入時の実行時刻（T0）に依存し`@TBD-D5`。
6. **SEED帯のid/シーケンス契約**: PGシーケンス補正・カテゴリ帯(SEED-M0301-CAT)とM03-11管轄カテゴリ
   CRUDとの関係整理は`@TBD-D5`。
7. **一括削除・状態変更・削除の各POST先ルート名・formaction実体**（md:267「CSV・一括編集・一括ステータス
   などフォームformaction」）は本機能pf mdの調査補助節にも明記が薄い。**改訂1でこれらはexcluded(DELEG)
   へ再分類**したため本候補の要実機事項からは除外（対応する別機能側の草案作成時に持ち越す）。

### 9.3 excluded=2件（改訂1でEX-SCOPE1,2の6件を追加→改訂2でEX-SCOPE2の5件はbound復帰・偽陰性是正）

§8集計表・根拠のとおり（-009＋EX-SCOPE1(-053)）。実test_idを実際に引いて確認済み・偽陰性なし:
- -009: 「必須エラーが表示されない」側の意味成分は-010がbound被覆。
- -053: パスワード変更画面という別画面（本機能の入口=md:36-44に該当経路が無く、着地先もこの画面でない）
  へのbindは不可能＝正当な除外（DELEG）。
- **-055,-056,-057,-059,-061は改訂2でbound復帰（codex R2 Major2指摘・§8参照）**: 改訂1は
  「削除・状態変更のPOST処理/DB効果が別導線」という事実と「この画面自身が担うモーダル/メッセージ
  表示・遷移先」という事実を混同し一律除外していた＝偽陰性。pf md:53（本機能自身のJS挙動）・
  md:109-115（本機能自身の表示メッセージ表）が明記する成分（モーダル文言・開閉状態・完了後リロード・
  フラッシュ文言・遷移先）はbound可能であり、「削除/状態変更のDB効果の正しさ」の成分のみDELEG
  （検証対象外）とする二分割で是正した。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| エラー表示**され**/表示され**ず**（相関） | -012,-017（され）vs -013,-014,-016（されず） | -012→C-012（終了<開始・拒否側）／-013,014→C-013（終了≥開始・許可側）・-016→C-016（sortkey内・許可側）。**-017は改訂3でTBDへ移動**（必発エラーを一次資料が可能性表現でしか述べず、C-017候補行は200許容の観測限定のため母集合の必発期待をboundできない。§8/§9参照）。取り違えなし |
| 含まれる/含まれない（検索条件） | -019,021,023,025,027,029,031（含まれる）vs -020,022,024,026,028,030,032（含まれない） | 各ペアは同一業務ルール（カテゴリ/言語/プロモ/高額/期間別販売数/部分一致/在庫）の正例・反例に対応（L1-036〜040,035,048）。m03-11のEX-Aとは異なり**本機能は検索機能そのものが存在する**ため全14行がbound（§0の相違点参照） |
| 変更され**る**/され**ない**（更新内容） | -037,039,041,042,044,046,047（される）vs -038,043,045（されない） | される側→セッションキー4種の更新（L1-014,015,016,022,055）／されない側→DB非更新（L1-056、参照系のみ）。「更新」の対象がDB行ではなくセッション値である点を明記した上でbind（正直な限定・m03-11とは異なる解釈だが本機能がDB非更新のため必然） |
| 出る/出ない（登録フォームカード相当） | 該当なし | 本機能に該当する母集合行なし（m03-11固有のパターンであり本機能は非該当） |
| 完了する/しない（遷移） | -002,005,006,007,008,009,048,055〜057,059,061（完了・遷移）vs -065（200滞留） | 完了系→各NAV/MSGクレーム（-055〜057,059,061は改訂2でbound復帰＝モーダル/フラッシュ表示・遷移先の観測に限定）／失敗系→C-065（has_errors・一覧非表示）。302/200相当の取り違えなし。**-053（パスワード変更＝別画面）のみ本極性対からも除外継続** |
| 利用できる/できない（認可） | -040（できない） | 未ログインのみ母集合に存在（正側「利用できる」は母集合に直接対応行なし・L1-054に情報として保持） |
| **excel-primary固有のC4項目**: 公開状態「限定公開」除去 | L1-057 | 取り消し線 `cell-strike` の残存確認（0204 sheet-3:1188）により除去対象が原資料内で一意に確定（m03-11 L1-042と同様の書式クラス確認手順を適用） |
- pf mdの表示メッセージ表（md:107-115）と共有インフラyamlの間に**齟齬は検出されなかった**（9メッセージ
  すべてja/enともyaml逐語と一致。m03-11のMSG-001/010齟齬のような事象は本機能では未検出）。
- -018,-058（TBDプレースホルダ）は無理な救済bindをしていない。
- 母集合の観点ラベル（「文字列長バリデーション」「必須バリデーション」等）と実際の期待テキストが
  一致しない行が複数確認された（例: -011のラベルは「文字列長バリデーション」だが期待テキストは
  select2に関するもの）。**これはW0教訓1（観点ラベルはノイズ）の裏付けであり、本書はラベルを
  一切bind根拠に用いていない**（§8はすべて期待テキストで判定）。

### 改訂1: codexレビューR1是正記録（2026-07-27・Blocker1＋Major5）

codex R1敵対レビューで検出された6件を是正した。すべて捏造ゼロ規律に基づく訂正であり、
無根拠だった記述を撤回・逐語へ回帰させたもの。

1. **[Blocker/source_routing] L1-M0301-044の誤ったInterpretation A適用**: 販売価格(開始/終了)
   （識別ID17/18）はExcelが最大値「0 -999999999」を**明示**しており沈黙していない。にもかかわらず
   初版はInterpretation A（Excel沈黙時のpf回帰許可）を誤って適用しpf md価格桁数(確認値8・max約
   99999999)をbound根拠にしていた＝**Excelの明示値と数値が食い違う状態でpfを採用した誤り**。
   是正: 販売価格2項目をL1-074（source_class=excel・max=999999999）へ切り出し、pf側はsuperseded
   （期待値根拠に不使用）。L1-044は基準価格/買取価格4項目（Excel未掲載＝真の沈黙）のみに限定し
   Interpretation Aの適用対象を正しく絞った。§3矩阵・oracle_draft.jsonに反映。
2. **[Major/fabrication] L1-M0301-051／C-017の必発断定**: pf md:70,184の逐語は「実行時エラーに
   **なり得る**」（可能性の表現）だが、候補TSVのC-017は「エラー**になる**／正常応答**にならない**」
   と必発へ強化していた＝過剰主張。是正: C-017の期待結果・テスト項目名を逐語どおり「なり得る」へ
   弱め、「必発は主張しない」旨を明記。具体的なHTTP応答形態も断定しないことを追記。
3. **[Major/fabrication] L1-M0301-069の無根拠な識別ID対応付け**: 0204 sheet-4:1520の逐語は識別ID
   **41/42/43/44**を指すが、item-table実体（No.1-35）にこの番号は存在しない。初版はラベル名の一致
   （変動履歴等）だけを根拠に41-44↔31-34と**自己推論**で対応付けていたが、この対応付け自体はExcel
   原本のどこにも明記が無い＝無根拠。是正: claimを逐語（識別ID41-44）に限定し、item-table実体との
   対応関係は**要ソース確認(TBD)**へ後退。§4.2 C-089も対応関係を断定しない書き方へ修正。
4. **[Major/scope] L1-M0301-026／C-053のスコープ逸脱**: M03-01-MSG-001（パスワードを更新しました）の
   表示条件は「パスワード変更を保存したとき」(md:107)であり、パスワード変更画面という**別導線**の
   イベントである。本機能（検索・一覧）の入口・処理フロー(md:36-76)にパスワード変更フォームの送信
   経路は存在しないため、C-053（bound）はこの機能のUIで検証不可能なテストケースだった。是正: 母集合
   -053をexcluded(DELEG)へ再分類しC-053を候補から削除。L1-026は事実記録として保持するが
   bound根拠には使わない旨を注記。
5. **[Major/scope] L1-M0301-028〜034／C-055〜061の自己整合性エラー**: 本書§3は当初から
   「一括削除・状態変更等のPOST先ルートは本書スコープ外の別導線（md:267）」「本機能は参照系で
   DBへの登録・更新・削除は行わない（md:233・L1-056）」と明記していたにもかかわらず、§4.1では
   一括削除(MSG-003/004)・商品削除(MSG-005)・状態変更(MSG-007)・既削除(MSG-008)をboundしていた＝
   **自著の記述と矛盾する自己整合性エラー**。是正: 母集合-055,-056,-057,-059,-061をexcluded(DELEG)へ
   再分類しC-055/056/057/059/061を候補から削除。MSG-002（規格情報取得失敗）のみ、規格確認モーダルが
   md:53,55に明記された**本機能自身のJS挙動**であるためbound維持（C-054は変更なし）。
6. **[会計再計算]** 上記4,5によりbound66→**60**（-6）・excluded1→**7**（+6・EX-SCOPE1×1+EX-SCOPE2×5）。
   TBDは2のまま不変。bound+TBD+excluded=60+2+7=**69**（差分0を維持）。
   oracle_draft.jsonはL1-074新設・L1-044内容変更・L1-026,028-034への注記追加を反映して同期済み。

### 改訂2: codexレビューR2是正記録（2026-07-27・Major2）

改訂1の是正が**振れすぎ／未完**だった2箇所をさらに精密化した。いずれも捏造ゼロ規律に基づく訂正。

1. **[Major/fabrication] C-017（改訂1是正が未完）**: 改訂1は「実行時エラーになる／正常応答にならない」
   という必発断定を「〜になり得る」へ弱めたはずが、期待結果の末尾に**新たな必発断定**
   「『正常な200一覧応答にはならない』ことの確認に限定する」を書き足してしまい、結局「非200は必ず
   起きる」という言い換えの必発主張が残っていた。pf md:70,184の逐語は可能性（「なり得る」）のみを
   述べ、200が返る余地を否定していない。是正: C-017の期待結果・テスト項目名から「200にはならない／
   正常応答にならない」という必発の非200断定を完全に削除し、「実行時エラーになり得る（200が返る
   可能性も一次資料は否定しないため、非200を必発と主張しない。観測は事象の記録に限定する）」へ統一。
   L1-M0301-051にも同旨の注記を追加した。
2. **[Major/excluded_overreach] C-055〜061（改訂1の一律excludedが偽陰性）**: 改訂1は「削除・状態変更の
   POST処理/DB効果は別導線」という正しい観察から、「モーダル/メッセージ表示/遷移先」という**別成分**
   まで一緒くたにexcludedへ落としてしまった。しかしpf md:53は「一括削除はAjaxで各行の削除URLを順に
   呼びモーダルで進捗表示（完了後リロード）。規格確認ボタンはAjaxでモーダル本文を差し替え。」と
   **本機能自身のフロント挙動**として明記し、md:109-115（MSG-003〜MSG-009）も**本機能自身の表示
   メッセージ表**としてja/en文言・表示位置・後続処理（遷移先含む）を定義している。これらの成分は
   実装がDB上の削除/状態変更をどう処理するかに関わらず、「この画面が何を表示し、どこへ遷移するか」
   という**この画面自身の責務**であり検証可能。是正: 母集合-055,-056,-057,-059,-061をboundへ復帰し
   C-055/056/057/059/061を§4.1へ再掲載。ただし**削除/状態変更が実際にDBへ正しく反映されるか**という
   成分（DB効果の正しさ）はいずれの候補行からも明示的に除外し、DELEG（別機能のcandidateが担当）と
   注記した。L1-028,029,030,031,032,033,034は「表示・モーダル・遷移=bound」「処理・DB効果=DELEG」の
   二分割注記へ全面改訂。C-053（MSG-001・パスワード変更画面）のみ、着地先自体が別画面であり
   この画面の責務にすら該当しないため除外継続（区別: 削除/状態変更は「この画面から発生しこの画面へ
   戻る」がパスワード変更は「別画面で発生し別画面へ戻る」＝除外根拠の性質が異なる）。
3. **[会計再々計算]** bound60→**65**（+5・-055,056,057,059,061のbound復帰）・excluded7→**2**（-5・
   EX-SCOPE2の5件を除去し-009,-053のみ残存）。TBDは2のまま不変。
   bound+TBD+excluded=65+2+2=**69**（差分0を維持）。oracle_draft.jsonはL1-028,029,030,031,032,033,034
   の注記を「bound(表示)/DELEG(処理)」の二分割へ更新し同期済み。

### 改訂3: codexレビューR3是正記録（2026-07-27・Major1・振り子の収束点）

改訂2はC-055〜061の過剰除外を是正した一方、C-017については改訂1・改訂2の2回にわたり文言を
弱め続けた結果、**今度は逆方向に振れすぎ**、母集合が要求する必発性を検証できない緩い試験のまま
boundに計上し続けていた。R3はこの振り子を収束させる是正である。

1. **[Major/bound_overreach] C-017・C-017が支える母集合-017,-067**: 改訂2でC-017の期待結果は
   「実行時エラーになり得る（200が返る可能性も含め必発断定はしない）」という**可能性の観測のみ**に
   限定された。これは捏造ゼロの観点では正しい是正だったが、副作用として**この試験はもはや何も
   確定的に検証していない**（エラーが起きてもHTTP200が返っても「想定内」として通ってしまう）。
   一方、母集合-017の期待テキストは「DBとの相関バリデーションでエラーが表示され、対象処理が
   完了しないこと」という**必発**の主張であり、-067も同じ検証項目に対応する。**必発を要求する
   母集合の期待値を、可能性のみの試験でboundしたと主張するのは過剰bound（偽陽性気味のbound計上）**
   である。
   是正: 母集合-017,-067を**bound→TBD(要ソース確認)**へ移動。理由は「一次資料(pf md:70,184)が
   『実行時エラーになり得る』と可能性のみを述べ必発を断定しないため、現状の一次資料だけでは
   母集合の期待値（必発エラー＋処理未完了）をboundできない」ことを明記した。C-017の候補行は
   §4.1・§7（非UI区分）から削除。L1-M0301-020・L1-M0301-051のclaim自体（pf md逐語）はそのまま
   §1に保持し、これらのclaimと母集合-017/-067との**bind**のみがTBDである旨を§9.1に明記した。
2. **[会計再々々計算]** bound65→**63**（-2・-017,-067がTBDへ移動）・TBD2→**4**（+2）。
   excludedは2のまま不変（-009,-053）。bound+TBD+excluded=63+4+2=**69**（差分0を維持）。
   oracle_draft.jsonはL1-M0301-051へ「-017/-067とのbindはTBD」の注記を追加し同期済み。
   （振り子の経緯: 初版=必発断定〔過剰bound〕→改訂1=一部是正も末尾に必発の非200断定が残存
   〔なお過剰bound〕→改訂2=可能性のみの観測へ弱める〔今度は空虚な試験のままboundと主張=過剰bound〕
   →改訂3=検証不能な成分をTBDへ切り出し、bound計上をやめる〔収束〕。）

### 改訂4: codexレビューR4是正記録（2026-07-27・Major1＋bound網羅スイープ）

R3は-017/-067という個別事象を収束させたが、同じ問題クラス（「boundにしているが一次資料では母集合の
必須期待を充足検証できない」）が他の候補行にも潜んでいないか、1件ずつの対症療法では収束しないため、
本改訂では**現行bound63件全数の網羅スイープ**を実施した。

1. **[Major/bound_overreach] -036（クエリカスタマイザ）**: 一次資料md:133「クエリの末尾で
   `QueryKey::PRODUCT_SEARCH_ADMIN` に登録されたカスタマイザがあれば、追加の結合・条件が入る。」は
   **条件付き正例**（カスタマイザが実際に登録されている環境でのみ成立する規則）である。改訂2までの
   C-036は「プラグイン非搭載の標準環境では追加条件が発生しない」という**前提を満たさない側の観測**
   のみを行い、「登録済み環境で実際に追加結合・条件が正しく反映され取得結果に含まれる」という
   **母集合-036が本来要求する正例側**は一貫して実行保留のままだった。母集合の期待（取得結果への
   反映＝正例の充足）を現行の候補環境で確認する手段が無いにもかかわらずboundに計上していたのは、
   -017/-067と同型の過剰bound（環境/前提条件の未充足パターン）である。
   是正: 母集合-036を**bound→TBD(要ソース確認)**へ移動。C-036候補行を§4.1・§7（実行区分）・§9.2
   （要実機）から削除。L1-M0301-042のclaim自体（pf md逐語）は保持し、母集合-036との**bind**のみが
   TBDである旨を§9.1（TBD-5）に明記した。
2. **[網羅スイープ] 残る62件の自己監査**: 改訂3で確立した3観点
   （(a)一次資料が可能性表現のみで母集合が必発を要求／(b)一次資料の要件が環境・前提依存で候補が
   その前提を満たさない／(c)観測の出口がcross-feature・別画面・要実機で候補では観測不能）で、
   -036以外の全boundを再監査した。結果、C-001〜C-069（および補完行）のいずれも、
   -017/-067/-036と同型の「充足検証不能」には該当しないと判定した（該当なしの根拠は§9.4に代表例を
   記載。例: 日付相関・言語フィルタ・在庫範囲・DB非更新はいずれも入力値の組合せで完全に確定的に
   再現可能であり、環境/プラグイン依存ではない。イベントディスパッチやトリガー手段の一部が
   「要実機」なのは実行レベルの技術的制約であり、一次資料自体が可能性表現しかしていない
   -017/-067/-036とは性質が異なる）。
   ただし監査の過程で、**C-068・C-069は一次資料の1文中に「確認値（定言的事実）」と「〜になり得る
   （可能性）」が混在**しており、bound判定の根拠が曖昧だったことが判明した。これは会計を動かす
   誤りではないが、根拠の精密化として、両ケースの期待結果を「pass/fail判定に使う確認値」と
   「参考観測（判定に不使用）」へ明示的に分離する表現へ改訂した（§4.1）。
3. **[会計再々々々計算]** bound63→**62**（-1・-036がTBDへ移動）・TBD4→**5**（+1）。excludedは2の
   まま不変（-009,-053）。bound+TBD+excluded=62+5+2=**69**（差分0を維持）。
   oracle_draft.jsonはL1-M0301-042へ「-036とのbindはTBD」の注記を追加し同期済み。
   （振り子の最終確認: 改訂3で個別事象〔-017/-067〕を収束させた後、改訂4で母集団全体を再監査し
   同型の-036を発見・是正。これにより「一次資料が可能性/条件付きでしか述べない事項をboundと
   主張する」という誤りのクラスは、現時点で確認できる範囲では解消済みと判断する。）

### 改訂5: codexレビューR5是正記録（2026-07-27・Major3・bound_overreachクラスの決定的収束）

改訂4は網羅スイープを実施したが、その過程でC-068・C-069について「一次資料の可能性表現と定言的事実が
同一文に混在する場合、定言的事実の方をpass/fail根拠に差し替えればboundを維持できる」という誤った
救済策を適用してしまっていた。R5はこれを-017/-067・-036と完全に同型のbound_overreachと認定し、
「言い換え・refinementによるbound維持」を今後一切禁止する機械的ルールを導入して収束させた。

1. **[bound_overreach/-068]**: 母集合-068の期待「フォームに無いキーだけが残るとSymfonyフォームが
   エラーに**なり得る**こと」は一次資料md:185自身の可能性表現である。改訂4は同じmd:185内の
   「リポジトリ本体にはstock配列による絞り込みが無く…確認値としてギャップを記録」という**別の
   定言的事実**をpass/fail判定根拠に差し替えることでC-068のboundを維持しようとしたが、これは
   母集合が実際に要求している事象（フォームエラーの発生）を検証したことには全くならない。
   一次資料が可能性としてしか述べない事象を、無関係の確定事実で代替してpassさせるのは
   捏造ゼロの精神に反する過剰bound（bound_overreach）である。
   是正: 母集合-068を**bound→TBD(要ソース確認)**へ再移動（TBD-6）。C-068候補行を§4.1・§7・§9.2から
   削除。L1-M0301-052のclaim自体（pf md逐語）は§1に保持し、母集合-068との**bind**のみTBDと明記した。
2. **[bound_overreach/-069]**: 母集合-069の期待「固定文字列プレースホルダのまま残り検索結果と
   一致しない表示に**なり得る**こと」も同様にmd:186の可能性表現である。改訂4は「一部が固定文字列の
   プレースホルダのまま残っており」という定言的事実へ判定根拠を差し替えていたが、これも母集合が
   要求する事象（表示の不一致）そのものの充足検証にはならない。
   是正: 母集合-069を**bound→TBD(要ソース確認)**へ再移動（TBD-7）。C-069候補行を§4.1・§7・§9.2から
   削除。L1-M0301-053のclaim自体は§1に保持し、母集合-069との**bind**のみTBDと明記した。
3. **[ルール化]**: 以後、「母集合test_idの期待が『〜になり得る/可能性』または『条件成立時のみの
   正例』であり、1回の実行でpass/failを一意に判定できないものは、いかなる言い換え・定言的な
   別副次事実への差し替えによってもboundにできない＝TBD」を機械的・一律に適用するルールとして
   本書に明記した（§0冒頭・本節参照）。-017/-067（改訂3）・-036（改訂4）・-068/-069（改訂5）は
   すべてこの単一ルールの適用例であり、今後の同型事案にも同じルールを適用する。
4. **[source_class来歴同期]**: md§1でL1-M0301-026・L1-M0301-028〜034（MSG-001,003〜009関連の
   8claim）はsource_class=「pf-fallback＋共有インフラ逐語」と明記しているが、oracle_draft.jsonは
   全件`source_class:"pf-fallback"`のみで共有インフラ(messages.ja/en.yaml)由来である旨がsource_class
   欄から欠落していた（yaml file:line自体は各claimの`source`フィールドには既に保持されていたため
   実害はJSON単体を見た際の分類ラベルの不一致に限られるが、md↔oracle間の完全一致という規約上は
   是正が必要）。該当8claimのoracle JSON `source_class`を`"pf-fallback＋共有インフラ逐語"`へ修正し
   md§1と一致させた。**全74claimについてmd↔oracleのsource_class一致を機械的に再点検**し、他に
   実質的な不一致は無いことを確認した（L1-M0301-005・L1-M0301-074のmd側source_class欄にある
   補足的な括弧書きは、oracle側では簡潔な主分類＋source/noteフィールドでの詳細citationという形で
   既に等価な情報を保持しており、m03-11のoracle_draft.jsonの表現方針と同じであるため変更不要と
   判断した）。
5. **[会計再々々々々計算]** bound62→**60**（-2・-068,-069がTBDへ移動）・TBD5→**7**（+2）。
   excludedは2のまま不変（-009,-053）。bound+TBD+excluded=60+7+2=**69**（差分0を維持）。
   oracle_draft.jsonはL1-M0301-052,053へ「-068/-069とのbindはTBD」の注記を追加し、
   L1-M0301-026,028,029,030,031,032,033,034のsource_classを修正して同期済み。
   （振り子の最終確定: 改訂1〜5を通じて発見された全bound_overreach事例〔-017,-067,-036,-068,-069の
   計5件〕をTBDへ収束させ、以後は本節のルールを機械的に適用することで同型の再発を防止する。）
