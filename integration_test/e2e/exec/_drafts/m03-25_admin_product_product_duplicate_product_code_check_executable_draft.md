# 候補: m03-25 重複商品コード確認 — 実行可能グレード候補（母集合61全量踏破・参照専用/照合系）

> 2026-07-29 ／ **候補グレード（candidate・D6前）・excel-primary（区分=現行踏襲）** ／
> Gate自己監査体制（`integration_test/CONCRETIZATION_GATES.md`）に基づく初版＋codex Gate C R1是正（Major5件）＋R2是正（残Major1件）。
>
> **改訂2（codex Gate C R2・残Major1件是正）**: **L1-006 の Excel claim 純度違反を是正**。L1-006（source_class=excel）が
> Excel逐語に無い `M03-25-MSG-001`・翻訳鍵 `admin.product.no_doubling_code` を混在させていた。**L1-006 を Excel逐語の範囲のみ
> （「重複している商品コードはありません。」を表示する）に純化**し、メッセージ鍵/MSG-ID は**pf-fallback claim L1-011**（pf md の
> 表示メッセージ M03-25-MSG-001・ee 翻訳鍵 admin.product.no_doubling_code）へ分離＝1claim1source。en 再grep 済み＝
> `admin.product.no_doubling_code` は ee messages.en.yaml に**未定義＝英訳なし**。会計不変（bound33/TBD0/excluded28）・L1数 10→11。
>
> **機能同定**: 管理画面「商品管理」配下の**重複商品コード確認**（参照専用の照合/確認系・CSV取込でない）。
> ナビ「重複コード確認」（`admin.product.duplicate_code`）→前ページ `pre_doubling_check`（単一プライマリボタン「重複確認する」）
> →結果ページ `doubling_check`。結果ページは `dtb_product_class.product_code` が同一で 2 件以上ある規格を 1 列の一覧に
> コードのリンクで表示し、各セルは規格編集画面を**別タブ**で開く。重複が 1 件も無ければ一覧を出さず
> 「重複している商品コードはありません。」（M03-25-MSG-001）のみ表示。**ee（SUT）実装あり**
> （`ProductController::preDoublingCheck`:1288/`doublingCheck`:1303・`ProductClassRepository::getDoublingCode`:2921・両twig）
> ＝M03-34/36 のような未実装判定は不要。入力フォーム・バリデーション・DB更新・セッション読書き・フラッシュは無い。
>
> **改訂1（codex Gate C R1・Major5件是正。会計 bound9/excluded52 → bound33/TBD0/excluded28＝61不変）**:
> - **(Major1) 重複閾値のオラクル誤り是正**: ee=SUT は `HAVING count(*) > 1`（ProductClassRepository.php:2929）、pf実装も
>   `having('cnt > 1')`（ProductClassRepository.php:311）＝**2 件以上で重複**。旧稿の「件数が 2 超」（>2）は pf md 文言の陳腐化。
>   L1-005 を **count>1（2件以上）** へ是正し、**ちょうど2件の境界SEED（SEED-M0325-DUP2/-MIXED）を固定**して `>2` 退行を一意検出。
> - **(Major2) NULL/空文字除外の出典不一致を是正**: 除外条件 `product_code IS NOT NULL AND product_code != ''` は **ee固有**
>   （ee:2927）で **pf実装（pf:301）に当該WHEREが無い**＝pf/ee食い違い・Excel沈黙。pf-fallbackでboundした根拠が不成立のため
>   **L1-005 から NULL/空文字除外を除去し §10 へ隔離**（母集合に当該を一意に問う試験行が無いため bind もTBDもしない）。
>   C-004 の陰性判定は**両実装が一致する「1件のみの一意コードは非掲載（count>1 の陰性）」**で一意判定する。
> - **(Major3) Excel claim 純度違反を是正（1claim1source）**: L1-002 の「結果ページへ進む」・L1-006 の「テーブル非表示/カード内のみ/
>   当画面に留まる」・L1-007 のルート名/パラメータ名は Excel逐語に無い。**Excel claim を Excel逐語の範囲に厳密限定**し、
>   ページ構造・遷移・ルート名は pf-fallback（L1-001,003,009）へ分離。ルート名/param の pf/ee差は §10 隔離。
> - **(Major4) B6/B10/B11/B13 是正**: 期待（画面）から内部表現（`@admin/default_frame.twig`・`table table-striped`・`{admin_route}` パス・
>   HTTPステータス・「Twig継承」「固有スクリプト/Ajax/モーダルが無い」の非観測命題）を除去し、**画面で目視できる帰結のみ**に限定。
>   正確なURL/経路は `／ 自動検証(内部)` へ分離、操作手順は純UI操作（属性検査を混入しない）。C-002/C-004 のトートロジー内部列
>   （画面掲載結果の再述）を除去。
> - **(Major5) B8/B12 会計・観点補正を是正**: 003→画面遷移・005→画面表示・053→実行結果 等に観点補正。**017/020-035/049-052/055/060/061 等の
>   「既存候補と同一実行へマップできる実在挙動」を excluded から bound へ戻し**、B12（同一C-refはboundのまま会計・emitterが代表1件出力）で
>   再計算。会計 **bound33（tsv出力6）/TBD0/excluded28**。
>
> **Gate B自己監査済み（B1-B15）— 実施要旨（改訂1反映）**:
> - **B1（bound充足検証）**: 母集合61行の期待テキストを全数走査。「〜になり得る／可能性／場合がある」は0件。bound はいずれも
>   SEED（境界2件/重複なし/混在）で1回の実行でpass/fail一意判定可能。
> - **B7（参照系の更新観点は全excluded）**: 更新内容(036-046)・副作用/非更新(010,048)・DBアクセス失敗の共通委譲(047,059)は
>   参照専用機能に該当挙動なし＝excluded。必須/相関/DB相関バリデーション(008-016)は本機能に**利用者入力フォームが無い**（pf-md:161,191）。
> - **B8/B12（会計・観点補正）**: 観点ラベルが期待実テキストと不一致の出力行は `## 観点補正` 表で是正。同一候補実行へマップする
>   複数母集合行は**boundのまま**会計し emitter が代表(最小NNN)1件のみ出力（excludedへ落とさない）。
> - **B14（未認証は共通認証へ委譲）**: 054「管理画面共通のエラー扱い（認証失敗時のログイン誘導など）」は当ルートに個別ロール
>   アノテーション無し（pf-md:174）＝共通認証。m03-25 は M03 最小機能IDでないため**未認証は委譲(DELEG)excluded**。
> - **B4/en-grep（必須）**: `messages.en.yaml` を grep 済み。`doubling_check`／`doubling_code`／`doubling_check_execute`／
>   `no_doubling_code`／`duplicate_code` は **en 未定義＝（英訳なし）**（M03-25-MSG-001含む）。`admin.product.product_management` のみ
>   **en「Products」実在**（messages.en.yaml:1930）＝L1-010がLS≠0。翻訳キー描画を日本語固定と誤認しない。
> - **B9（DB二重検証回避）**: 掲載/非掲載・メッセージ・リンク先は**画面（DOM）で観測可能**＝画面検証を主。DB直参照は付さない
>   （壊れたとき画面だけで検知可能・トートロジー禁止）。SEED投入のDB操作は検証と別。
> - **B15（honest分類）**: 具体判定基準が無い内容空虚な定型文（056,058「エラー表示されず継続」）のみ excluded。実在挙動を
>   現行オラクルで固定不能な行は無い（TBD 0）。
>
> **実装/実走なし。承認・O5合格・具体化完了（正式）はいずれも主張しない**。fixture_version は全て `@TBD-D5`。
> **著者はレビューしない**（codexが別途レビュー）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m03-25_admin_product_product_duplicate_product_code_check_oracle_draft.json`。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**:
  `excel_to_html/output/0204_基本設計仕様書(商品管理).html` sheet=重複商品コード確認（機能No M03-25・機能名「重複商品コード確認」・
  概要「登録されている商品コードに重複が無いか確認」0204:重複商品コード確認!AG4・作成者「大澤」作成日2025-08-04）。
  機能仕様処理概要（0204:重複商品コード確認!D41）＋画面項目 識別ID 1〜3（0204:重複商品コード確認!E48-AG50）。以下「0204:ref」。
- **pf現行（回帰先・source_class=pf-fallback）**: pf現行md `functions/pf-eccube3/m03-25_admin_product_product_duplicate_product_code_check.md`
  （以下「pf-md:行」）＋**pf実装**（閾値等の実挙動は実装を正）: `pf-eccube3/app/Plugin/HareruyaEc/Repository/ProductClassRepository.php`
  （getDoublingCode:296-320・`having('cnt > 1')`:311）・`ServiceProvider/Admin/ProductServiceProvider.php:346-349`・
  `Resource/template/admin/Product/{pre_doubling_check,doubling_check}.twig`。区分=現行踏襲、DB関連は ec-cube-enterprise を正（pf-md:7）。
- **ee実装（SUT・クロス検証／en逐語源）**: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/`
  `Controller/Admin/Product/ProductController.php:1288-1338`・`Repository/ProductClassRepository.php:2921-2939`
  （`HAVING count(*) > 1`:2929・`WHERE product_code IS NOT NULL AND product_code != ''`:2927）・両twig・
  `app/config/eccube/packages/eccube_nav.yaml:34-36`・`Resource/locale/messages.{ja,en}.yaml`。UI挙動はee（SUT）を正・en逐語はee。
- **方針適用**: Excel が画面項目（ボタン文言・重複結果リスト・重複なしメッセージ・処理概要）を規定する claim は excel を正、
  1 claim 1 source を厳守（Excel逐語に無いページ構造・遷移・ルート名・閾値・出力はpf-fallbackへ分離）。pf/ee食い違い（NULL空文字除外・
  DtbProductSub結合・規格編集ルート名/param）は隠さず §10 隔離。standard-src は付与しない。
- 母集合: `integration_test/all_it_cases.tsv` の M03-25 全**61行**
  （IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-001〜061。欠番0）。
- **判定原則**: bind は各行の**「期待結果」実テキスト**で判定する（観点ラベル・前提条件ラベルは機械巡回生成のノイズ）。

## §1 L1原子オラクル表

全11claim。**source_class列は excel（4件: 002,004,006,007）／pf-fallback（7件: 001,003,005,008,009,010,011）のみ**。
Excel claim は Excel逐語の範囲に厳密限定（1claim1source）。メッセージ鍵・MSG-ID等の実装メタは pf-fallback claim（L1-011）へ分離。en は ee en yaml 逐語（存在するもののみ・無いものは英訳なし）。

| oracle_id | claim_type | claim | 逐語quote | 根拠(file:line) | source_class | LS |
|-----------|-----------|-------|-----------|-----------------|--------------|----|
| L1-M0325-001 | screen_display | 前ページはカード内に単一のプライマリボタン「重複確認する」のみを表示し、サブタイトルは「重複商品コード確認」。ナビラベルは翻訳鍵 admin.product.duplicate_code の確認値「重複コード確認」 | 前ページはサブタイトルが「重複商品コード確認」、本文はカード内に単一のプライマリボタン「重複確認する」。／ サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存） | pf-md:44,34 | pf-fallback | ja |
| L1-M0325-002 | action | 前ページの「重複確認する」ボタンは押下で商品コードに重複がないかを確認する | 重複確認する ／ 押下で商品コードに重複がないか確認する。 | 0204:重複商品コード確認!E48,AG48 | excel | ja |
| L1-M0325-003 | screen_display | 結果ページのサブタイトルは「重複商品コード」。重複があるとき 1 列の一覧を表示し各セルはコード文字列のリンクのみ、重複が無いときはカード内に文言のみを表示する | 結果ページはサブタイトルが「重複商品コード」。重複があるときは 1 列テーブルで、セルはコード文字列のリンクのみ。重複が無いときはカード内に「重複している商品コードはありません。」の文言のみ。 | pf-md:44 | pf-fallback | ja |
| L1-M0325-004 | detection | 同一商品コードの件数をカウントし複数件（2件以上）存在するコードを重複とみなし、重複している場合は商品コードと編集画面のリンクを結果として表示する | 同一商品コードの件数をカウントし複数件存在しないかチェックし、重複している場合は商品コードと編集画面のリンクを結果として表示する | 0204:重複商品コード確認!D41 | excel | ja |
| L1-M0325-005 | detection | 重複判定は product_code でグループ化し件数が 1 超（count > 1・すなわち 2 件以上）のコードだけを結果に載せる。ちょうど 2 件でも重複として該当する全規格行が載り、1 件のみの一意コードは載らない | ->having('cnt > 1')（count(p.id) を HIDDEN cnt とし cnt > 1 の商品コードのみ残す） | pf-eccube3/app/Plugin/HareruyaEc/Repository/ProductClassRepository.php:311 | pf-fallback | ja |
| L1-M0325-006 | message | 重複が 1 件も無いとき結果ページに「重複している商品コードはありません。」を表示する | 「重複している商品コードはありません。」を表示する。 | 0204:重複商品コード確認!AG50 | excel | ja |
| L1-M0325-007 | transition | 結果ページの各セルのリンクは押下で商品規格編集画面を新規タブ（別タブ）で開く | リンク押下で商品規格編集画面を新規タブで開く | 0204:重複商品コード確認!AG49 | excel | ja |
| L1-M0325-008 | output | 成功時出力は HTTP 200 と HTML（重複の有無に応じて一覧またはメッセージ） | 成功時出力｜HTTP 200 と HTML。重複の有無に応じてテーブルまたはメッセージ。 | pf-md:134 | pf-fallback | ja |
| L1-M0325-009 | route | 入口は2つの GET ルート admin_product_pre_doubling_check（前ページ）と admin_product_doubling_check（結果ページ）で、前ページのボタンからクエリ無しの GET で結果ページへ遷移する | admin_product_pre_doubling_check … GET … /product/pre_doubling_check ／ admin_product_doubling_check … GET … /product/doubling_check ／ 前ページの「重複確認する」ボタン … 結果ページへ GET で遷移 | pf-md:253,254,35 | pf-fallback | ja |
| L1-M0325-010 | screen_display | 前ページ・結果ページは管理画面共通フレームを継承し、ウィンドウタイトルブロックは翻訳鍵 admin.product.product_management の確認値「商品管理」（en「Products」） | 共通フレーム @admin/default_frame.twig を継承。ウィンドウタイトルブロックは「商品管理」のロケール。／ [en] admin.product.product_management: Products | pf-md:44 ／ ee messages.en.yaml:1930 | pf-fallback | ja / en=Products |
| L1-M0325-011 | message | 重複なしメッセージは pf 表示メッセージ M03-25-MSG-001（画面上部・英訳なし・実行後に画面へ留まる）に対応し、ee 実装では翻訳鍵 admin.product.no_doubling_code（ja「重複している商品コードはありません。」）で描画される | M03-25-MSG-001 ｜ 画面上部 ｜ 重複している商品コードはありません。 ｜ （英訳なし） ｜ 重複商品コード確認画面に留まる。 | pf-md:92 ／ ee messages.ja.yaml:1958 | pf-fallback | ja（en=英訳なし・ee en未定義） |

## §2 SEED（fixture）

全fixtureは `@TBD-D5`。SEEDコードは前提/入力から参照。**重複閾値 count>1 の境界を一意判定するため、ちょうど2件の重複コードを固定**する。

| SEED | 内容（既知値） | 用途(候補ケース) |
|------|------|------------------|
| SEED-M01-ADMIN | 管理画面の管理者ログインアカウント（共通認証・当ルート到達可） | 全bound（ログイン前提） |
| SEED-M0325-DUP2 | 同一 product_code をちょうど 2 件持つ商品規格（境界・count>1 で重複と判定される最小ケース）。各規格は dtb_product に紐づく | C-002,C-005（重複あり一覧・セルリンク） |
| SEED-M0325-NODUP | product_code がすべて一意で重複が 1 件も無い商品規格群 | C-003（重複なしメッセージ） |
| SEED-M0325-MIXED | 同一 product_code ちょうど 2 件の重複コード＋1 件のみの一意な product_code を混在させた商品規格群 | C-004（重複のみ掲載・一意コードは非掲載） |

## §4 実行可能グレード14列TSV（候補・bound 6候補・自己完結）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。
- テストIDは `E2E-M0325C-NNN`（末尾NNN＝候補ケース番号 C-NNN。§8対応表の C-ref と一致）。
- 期待は**画面で目視できる結果のみ**（B6/B11）。正確な経路・HTTP ステータス等の内部は `／ 自動検証(内部): …` へ分離。操作手順は純UI操作のみ（B10）。
- 参照専用のため DB書き込み・セッション更新は無い＝DB直参照は付さない（画面で観測可能・トートロジー回避 B9）。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-25_admin_product_product_duplicate_product_code_check	E2E-M0325C-001	IT-M0325	画面遷移	P1	前ページ表示と結果ページへの遷移	ログイン済(SEED-M01-ADMIN)	なし	1. サイドナビ「商品管理」配下の「重複コード確認」を開く 2. 前ページの表示を確認する 3.「重複確認する」ボタンを押下する	前ページにサブタイトル「重複商品コード確認」とカード内の単一のプライマリボタン「重複確認する」だけが表示され、ボタンを押下すると重複確認の結果ページへ遷移する ／ 自動検証(内部): 前ページ pre_doubling_check からクエリ無しの GET で結果ページ doubling_check へ遷移 [L1:L1-M0325-001,L1-M0325-002,L1-M0325-009; fixture:SEED-M01-ADMIN@TBD-D5]				
m03-25_admin_product_product_duplicate_product_code_check	E2E-M0325C-002	IT-M0325	画面表示	P1	重複ありのとき重複コードが一覧表示される（境界2件）	ログイン済(SEED-M01-ADMIN)／同一 product_code をちょうど 2 件持つ商品規格が存在(SEED-M0325-DUP2)	なし	1. 前ページで「重複確認する」を押下する 2. 結果ページのサブタイトルと一覧を確認する	結果ページのサブタイトルに「重複商品コード」が表示され、同一商品コードが 2 件以上ある重複コードが 1 列の一覧にコードのリンクとして規格の件数分だけ表示される（ちょうど 2 件の重複コードも該当行が表示される） ／ 自動検証(内部): 成功応答 HTTP 200・HTML [L1:L1-M0325-003,L1-M0325-004,L1-M0325-005,L1-M0325-008; fixture:SEED-M0325-DUP2@TBD-D5]				
m03-25_admin_product_product_duplicate_product_code_check	E2E-M0325C-003	IT-M0325	画面表示	P1	重複が1件も無いとき固定メッセージのみ表示される	ログイン済(SEED-M01-ADMIN)／重複が 1 件も無い(SEED-M0325-NODUP)	なし	1. 前ページで「重複確認する」を押下する 2. 一覧の有無とメッセージを確認する	結果ページに一覧は表示されず、「重複している商品コードはありません。」の文言のみが表示され、当画面に留まる [L1:L1-M0325-006,L1-M0325-011,L1-M0325-003; fixture:SEED-M0325-NODUP@TBD-D5]				
m03-25_admin_product_product_duplicate_product_code_check	E2E-M0325C-004	IT-M0325	検索条件	P2	重複コードのみ掲載され1件のみの一意コードは掲載されない	ログイン済(SEED-M01-ADMIN)／ちょうど 2 件の重複コードと 1 件のみの一意コードが混在(SEED-M0325-MIXED)	なし	1. 前ページで「重複確認する」を押下し結果ページを開く 2. 一覧に表示されるコードと表示されないコードを確認する	同一商品コードが 2 件以上ある重複コードは一覧に表示され、1 件しか存在しない一意の商品コードは一覧に表示されない [L1:L1-M0325-004,L1-M0325-005; fixture:SEED-M0325-MIXED@TBD-D5]				
m03-25_admin_product_product_duplicate_product_code_check	E2E-M0325C-005	IT-M0325	画面遷移	P1	結果ページのコードのリンクが規格編集画面を別タブで開く	ログイン済(SEED-M01-ADMIN)／重複コードが存在(SEED-M0325-DUP2)	なし	1. 結果ページを開く 2. 一覧のコードのリンクを押下する 3. 新しく開いたタブを確認する	一覧の各コードはリンクになっており、押下すると該当する商品規格の編集画面が新規タブ（別タブ）で開く ／ 自動検証(内部): リンク先は商品規格編集画面・別タブで開く [L1:L1-M0325-007; fixture:SEED-M0325-DUP2@TBD-D5]				
m03-25_admin_product_product_duplicate_product_code_check	E2E-M0325C-006	IT-M0325	画面表示	P2	共通フレームと画面タイトル（商品管理/Products）	ログイン済(SEED-M01-ADMIN)	なし	1. 前ページと結果ページを開く 2. 共通ヘッダ・サイドナビ・ウィンドウタイトルを確認する	前ページ・結果ページとも管理画面共通のヘッダとサイドナビが表示され、ウィンドウタイトルに「商品管理」（英語表示時は Products）が表示される [L1:L1-M0325-010; fixture:SEED-M01-ADMIN@TBD-D5]				
```

## §8 母集合61行 全数会計対応表

> 会計: bound 33／TBD 0／excluded 28（=61・欠番0）。bound はB12で同一C-refをboundのまま会計し、emitterが代表(最小NNN)1件のみ出力（tsv出力6行）。

| NNN | 区分 | マップ/理由 |
|-----|------|-------------|
| 001 | bound | C-001（期待「前ページが開き、大きなボタンから結果ページへ進める」＝前ページ表示＋遷移。観点ラベル未認証は誤・B8補正） |
| 002 | bound | C-002（期待「DB で重複を検索し、無ければメッセージ、あれば表で一覧する」＝重複あり一覧） |
| 003 | bound | C-005（期待「該当規格の編集画面を別タブで開く」＝セルリンク別タブ遷移。観点ラベル出力抑止は誤・B8補正） |
| 004 | bound | C-006（期待「共通フレームを継承」＝画面表示/レイアウト。観点ラベル識別子は誤・B8補正） |
| 005 | bound | C-003（期待「結果ページはテーブルを出さず、固定メッセージのみ表示する」＝重複なしメッセージ） |
| 006 | excluded | 「一覧はリクエスト処理中の読み取り時点のコミット済みデータを反映する」＝フレームワークの読取一貫性の一般性質・機能固有挙動でなく机上/自動で固定不能（framework） |
| 007 | excluded | 「別タブで開いたあとの同時更新との整合は保証しない」＝否定的非保証で判定基準なし（B8否定命題） |
| 008 | excluded | 必須バリデーション＝本機能に利用者入力フォーム無し（pf-md:161,191）・母集合テンプレ由来（B7） |
| 009 | excluded | 必須バリデーション＝同上（フォーム無し・B7） |
| 010 | excluded | 「DB の書き込み・セッションキー更新・フラッシュメッセージ追加は行わない」＝参照系の非更新安全確認（B7・全excluded） |
| 011 | excluded | 相関バリデーション＝本機能に入力フォーム・項目間相関なし（B7） |
| 012 | excluded | 相関バリデーション＝同上（B7） |
| 013 | excluded | 相関バリデーション＝同上（B7） |
| 014 | excluded | 相関バリデーション＝同上（B7） |
| 015 | excluded | DBとの相関バリデーション＝本機能に入力フォーム・DB相関検証なし（B7） |
| 016 | excluded | DBとの相関バリデーション＝同上（B7） |
| 017 | bound | C-001（期待「前ページが開き…結果ページへ進める」＝C-001と同一実行。B12でboundのまま代表共有） |
| 018 | bound | C-002（期待「該当レコードが取得結果に含まれる」＝重複検出陽性＝重複コード掲載。B8観点補正） |
| 019 | bound | C-004（期待「該当レコードが取得結果に含まれない」＝重複検出陰性＝1件のみの一意コード非掲載。B8観点補正） |
| 020 | bound | C-002（期待「含まれる」＝重複検出陽性・C-002と同一実行。B12代表共有） |
| 021 | bound | C-004（期待「含まれない」＝重複検出陰性・C-004と同一実行。B12代表共有） |
| 022 | bound | C-002（期待「含まれる」＝C-002同一実行。B12代表共有） |
| 023 | bound | C-004（期待「含まれない」＝C-004同一実行。B12代表共有） |
| 024 | bound | C-002（期待「含まれる」＝C-002同一実行。B12代表共有） |
| 025 | bound | C-004（期待「含まれない」＝C-004同一実行。B12代表共有） |
| 026 | bound | C-002（期待「含まれる」＝C-002同一実行。B12代表共有） |
| 027 | bound | C-004（期待「含まれない」＝C-004同一実行。B12代表共有） |
| 028 | bound | C-002（期待「含まれる」＝C-002同一実行。B12代表共有） |
| 029 | bound | C-004（期待「含まれない」＝C-004同一実行。B12代表共有） |
| 030 | bound | C-002（期待「含まれる」＝C-002同一実行。B12代表共有） |
| 031 | bound | C-004（期待「含まれない」＝C-004同一実行。B12代表共有） |
| 032 | bound | C-002（期待「実行結果の該当レコードが含まれる」＝重複検出陽性・C-002同一実行。B12代表共有） |
| 033 | bound | C-002（期待「含まれる」＝C-002同一実行。B12代表共有） |
| 034 | bound | C-002（期待「含まれる」＝C-002同一実行。B12代表共有） |
| 035 | bound | C-004（期待「含まれない」＝C-004同一実行。B12代表共有） |
| 036 | excluded | 更新内容「対象レコードの値が変更される」＝本機能は参照系でDB更新なし（B7） |
| 037 | excluded | 更新内容「対象レコードの値が変更されない」＝参照系の非更新安全確認（B7） |
| 038 | excluded | 更新内容「変更される」＝参照系でDB更新なし（B7） |
| 039 | excluded | 更新内容（リンク先は編集画面の初期表示…）＝更新観点・別導線の規格編集はDELEG（B7） |
| 040 | excluded | 更新内容「変更される」＝参照系でDB更新なし（B7） |
| 041 | excluded | 更新内容「変更される」＝参照系でDB更新なし（B7） |
| 042 | excluded | 更新内容「変更されない」＝参照系の非更新安全確認（B7） |
| 043 | excluded | 更新内容「変更される」＝参照系でDB更新なし（B7） |
| 044 | excluded | 更新内容「変更されない」＝参照系の非更新安全確認（B7） |
| 045 | excluded | 更新内容「変更される」＝参照系でDB更新なし（B7） |
| 046 | excluded | 実行結果「対象レコードの値が変更される」＝更新観点・参照系（B7） |
| 047 | excluded | 「DB アクセス失敗＝アプリケーション共通のエラーハンドリングに委ねる」＝機能固有の捕捉分岐なし・共通処理へ委譲（B15） |
| 048 | excluded | 「当機能の処理経路ではセッションへの読み書きを行わない（確認値）」＝内部の負の確認・画面観測不能・参照系（B7/B9） |
| 049 | bound | C-002（期待「DB で重複を検索し、無ければメッセージ、あれば表で一覧する」＝C-002と同一実行。B12代表共有） |
| 050 | bound | C-005（期待「該当規格の編集画面を別タブで開く」＝C-005と同一実行。B12代表共有） |
| 051 | bound | C-006（期待「共通フレームを継承」＝C-006と同一実行。B12代表共有） |
| 052 | bound | C-003（期待「テーブルを出さず、固定メッセージのみ表示する」＝C-003と同一実行。B12代表共有） |
| 053 | bound | C-002（期待「HTTP 200 と HTML」＝成功時出力＝C-002の成功応答。B8観点補正） |
| 054 | excluded | 「管理画面共通のエラー扱い（認証失敗時のログイン誘導など）」＝未認証は共通認証機能へ委譲・m03-25は最小機能IDでない（B14 DELEG） |
| 055 | bound | C-001（期待「画面を表示できる」＝認証済みで前ページ画面表示＝C-001と同一実行。B12代表共有） |
| 056 | excluded | 汎用スタブ「画面表示データでエラーが表示されず継続できる」＝内容空虚定型文・具体判定基準なし（B15②） |
| 057 | bound | C-001（期待「GET …/product/doubling_check」＝前ページボタン押下→結果ページ遷移＝C-001と同一実行。B8観点補正） |
| 058 | excluded | 汎用スタブ「画面表示データでエラーが表示されず継続できる」＝内容空虚定型文・具体判定基準なし（B15②） |
| 059 | excluded | 「DB アクセス失敗＝アプリケーション共通のエラーハンドリングに委ねる」＝共通処理へ委譲・機能固有分岐なし（B15） |
| 060 | bound | C-002（期待「DB で重複を検索し、無ければメッセージ、あれば表で一覧する」＝C-002と同一実行。B12代表共有） |
| 061 | bound | C-005（期待「該当規格の編集画面を別タブで開く」＝C-005と同一実行。B12代表共有） |

### §8.1 観点是正対象（emitが concretized.tsv の観点列を是正・母集合all_it_casesは不変）

対象NNN（下記 `## 観点補正` 表と一致・5件）: 001, 002, 003, 004, 005。
（019 は母集合観点「検索条件」＝正しい観点と一致のため補正不要。出力代表行は 001,002,003,004,005,019＝各C-refの最小NNN。）

## §9 分類根拠（会計整合）

### §9.1 bound（33行・6候補 C-001〜C-006・tsv出力=代表6行）
- C-001 前ページ表示＋結果遷移←001,017,055,057。C-002 重複あり一覧（境界2件・陽性）←002,018,020,022,024,026,028,030,032,033,034,049,053,060。
- C-003 重複なしメッセージ←005,052。C-004 重複のみ掲載/1件のみ一意コード非掲載（陰性）←019,021,023,025,027,029,031,035。
- C-005 セルリンク別タブ←003,050,061。C-006 共通フレーム/画面タイトル←004,051。
- B12: 同一候補実行へマップする複数母集合行は**boundのまま会計**し、emitterが代表(最小NNN)1件のみ出力（bound=33・tsv=6）。
- 全 bound は母集合の期待テキストが Excel（画面項目・処理概要）／pf md・pf実装（ページ構成・閾値・ルート・出力）の実文に対応する実在挙動。
  重複検出（陽性/陰性）は SEED（境界2件/重複なし/混在）で1回の実行で一意判定可能（count>1 の境界で `>2` 退行を検出）。

### §9.2 TBD（0行）
- なし。bound はいずれも SEED で机上/自動判定可能。NULL/空文字の ee固有除外は母集合に一意に問う試験行が無いため §10 隔離（bind もTBDもしない）。

### §9.3 excluded（28行）
- 参照系に非該当の更新系観点（B7）: 更新内容(036-046)・副作用/非更新(010,048)・必須/相関/DB相関バリデーション=入力フォーム無し(008-016)。
- 内容空虚な汎用スタブ（具体判定基準なし・B15②）: 画面表示データのエラーなし継続(056,058)。
- 共通処理へ委譲/否定的非保証/framework一般性質: DBアクセス失敗の共通委譲(047,059)・別タブ整合の非保証(007)・コミット済みデータ反映(006)。
- 未認証は共通認証機能へ委譲: 054（B14 DELEG・m03-25はM03最小機能IDでない）。
- excluded は tsv 非出力（会計は本§8/§9で管理）。

## §5 メッセージ（画面文言・逐語）

| 鍵/ID | ja（逐語） | en（ee en yaml逐語） | 出典 |
|-------|-----------|---------------------|------|
| admin.product.duplicate_code | 重複コード確認 | （英訳なし・ee en未定義） | ee messages.ja.yaml:4015 ／ eccube_nav.yaml:34-36 ／ pf-md:5 |
| admin.product.doubling_check | 重複商品コード確認 | （英訳なし・ee en未定義） | ee messages.ja.yaml:1955 ／ pre_doubling_check.twig:16 |
| admin.product.doubling_check_execute | 重複確認する | （英訳なし・ee en未定義） | ee messages.ja.yaml:1956 ／ pre_doubling_check.twig:25 ／ 0204:重複商品コード確認!E48 |
| admin.product.doubling_code | 重複商品コード | （英訳なし・ee en未定義） | ee messages.ja.yaml:1957 ／ doubling_check.twig:16 |
| admin.product.no_doubling_code / M03-25-MSG-001 | 重複している商品コードはありません。 | （英訳なし・ee en未定義） | ee messages.ja.yaml:1958 ／ doubling_check.twig:47 ／ 0204:重複商品コード確認!AG50 ／ pf-md:92 |
| admin.product.product_management | 商品管理 | Products | ee messages.ja.yaml:1920 ／ ee messages.en.yaml:1930 |

※ en は ee messages.en.yaml を grep 済み。doubling_check／doubling_code／doubling_check_execute／no_doubling_code／duplicate_code は
**en 未定義＝（英訳なし）**（キー確認済み・翻訳キー描画を日本語固定と誤認しない）。product_management のみ en「Products」実在＝L1-010がLS≠0。

## §6 要実機・注記（tsv出力から除去する内容）

- 重複検出の SEED（SEED-M0325-DUP2/NODUP/MIXED）は dtb_product_class.product_code の重複ちょうど2件/一意/重複なしを作り分ける使い捨てシード（要D5配線）。
  掲載/非掲載は結果一覧の DOM で観測（画面検証・B9）。DB直参照は付さない（壊れたとき画面だけで検知可能）。
- セルリンクの別タブ挙動・規格編集画面の具体セレクタは要実機。規格編集画面そのものの内容は別機能（m03-09）＝当機能は結果ページの
  リンク押下→別タブで規格編集画面が開くところまでを bound（DELEG先の画面内容は範囲外）。
- 並び順（product_code 昇順→product.id 昇順→規格ID 昇順・pf-md:74／ee:2935）は掲載可否に影響しないため掲載/非掲載の bound には含めない（順序固定は要実機・SQL ORDER BY で決定）。

## §7 実行対象（bound=Playwright／TBD=手動）

- **Playwright(GUI)主体（6候補・代表6行）**: 候補ケース C-001〜C-006（前ページ/結果ページの表示・重複あり一覧（境界2件）・重複なしメッセージ・
  重複のみ掲載/一意コード非掲載・セルリンク別タブ・共通フレームを画面で目視、正確な経路・HTTP応答は自動検証(内部)で副次確認）。
- **手動(TBD)**: なし（TBD 0）。
- **対象外(excluded)**: 更新系観点／入力フォーム無しのバリデーション／内容空虚スタブ(056,058)／DBアクセス失敗の共通委譲／未認証委譲(054)。tsv非出力。

## §10 隔離メモ（bind根拠に不使用 or クロス検証のみ・pf/ee食い違いの明示）

- **NULL/空文字の集計除外（pf/ee食い違い・隔離）**: `product_code IS NOT NULL AND product_code != ''` は **ee=SUT 固有**
  （ec-cube-enterprise ProductClassRepository.php:2927）。**pf実装（pf-eccube3 ProductClassRepository.php:296-320）には当該WHEREが無い**
  ＝pf/ee食い違い・Excel沈黙。母集合に NULL/空文字コードの扱いを一意に問う試験行が無いため **bind もTBDもせず隔離**。
  C-004 の陰性判定は**両実装が一致する「1件のみの一意コードは非掲載（count>1 の陰性）」**で一意判定する（NULL/空文字には依存させない）。
- **pf の DtbProductSub 結合（pf固有・隔離）**: pf実装は `->join('Plugin\HareruyaEc\Entity\DtbProductSub', 'ps', 'with', 'ps.product = p')`
  （pf:309）で DtbProductSub 行を持つ商品規格のみ対象とする。ee にはこの結合が無い＝pf/ee食い違い。SUT=ee を正とし、SEED は両実装で
  同結果になるデータ（必要な関連行を備えた商品規格）で構成（オラクル値に不使用）。
- **規格編集ルート名/パラメータの差（pf/ee食い違い・隔離）**: pf=`admin_product_product_class_detail_edit`（param `classId`）／
  ee=`admin_product_product_class_edit`（param `productClassId`）。**オラクル値に不使用**（画面観測可能な「別タブで規格編集画面を開く」までを bound）。
- 買取依頼・スマレジ等の外部連携は本機能に無い（参照専用・GETのみ・副作用なし）。母集合に対応行が無く候補化しない。

## 観点補正

| 母集合末尾NNN | 正しい観点 | 根拠・バレNNN |
|---------------|-----------|----------------|
| 001 | 画面遷移 | 期待「前ページが開き、大きなボタンから結果ページへ進める」＝前ページ表示＋遷移・未認証は誤・001 |
| 002 | 画面表示 | 期待「DB で重複を検索し、無ければメッセージ、あれば表で一覧する」＝重複あり一覧表示・対象データは誤・002 |
| 003 | 画面遷移 | 期待「該当規格の編集画面を別タブで開く」＝セルリンクの別タブ遷移・出力抑止/内部情報は誤・003 |
| 004 | 画面表示 | 期待「共通フレームを継承」＝画面表示/レイアウト・識別子は誤・004 |
| 005 | 画面表示 | 期待「テーブルを出さず、固定メッセージのみ表示する」＝重複なしメッセージ表示・状態変化は誤・005 |
