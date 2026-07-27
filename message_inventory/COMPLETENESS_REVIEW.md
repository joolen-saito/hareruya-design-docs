# メッセージ棚卸し 網羅性レビュー（codex, 2026-07-26）

## 結論
現行パイプラインは4クラス（flash/フォーム制約/JS(alert・confirm・data-*)/twig `|trans`直描画）を網羅的に収録。**twig `|trans` はフロント・管理画面とも是正済み**（残1: `front.product.out_of_stock`）。
ただし codex が**上記4クラスで捕捉できないメッセージ源**を複数検出。網羅=未達。

## codex 検出の未収録クラス（実在確認済み）

### [high] PHP_JSON_response_literal
- 例: `src/Eccube/Controller/Admin/Stock/StockSplitController.php:604 "CSRFトークンが無効です。"`
- flash/constraint/JS/twig-trans のいずれにも該当しないAjax JSONエラー。TSVにも当該文言なし。604,609,613行に別文言もある。

### [high] exception_message_exposed_to_UI
- 例: `src/Eccube/EventListener/RestrictFileUploadListener.php:41 exception.error_message_restrict_url（「この機能は管理者によって制限されています。」）`
- AccessDeniedHttpExceptionのmessageをExceptionListener.php:159-160がそのままerror.twigへ渡す。例外発生源を棚卸し対象にしない限り漏れる。

### [high] exception_message_exposed_to_JSON
- 例: `src/Eccube/Service/Admin/Entry/EntryStatusBulkUpdateAction.php:40 admin.event.entry.bulk_update.invalid_selection`
- throwした翻訳済みInvalidArgumentExceptionをEntryController.php:340-341がgetMessage()のままJSON返却する。JSON消費UIに表示される経路で、(a)-(d)だけでは捕捉不能。

### [high] twig_hardcoded_visible_text
- 例: `src/Eccube/Resource/template/admin/Analysis/product_request.twig:130 "商品ID"`
- |transなしの管理画面表ヘッダ。130-134および154「検索条件に該当するデータがありませんでした。」も同種で、TSVに該当文言なし。

### [high] twig_hardcoded_visible_text
- 例: `src/Eccube/Resource/template/admin/Analysis/format_sales.twig:150 "合計"`
- |transなし。167,173,175,188,194,196の「合計」「平均」「今月合計」も表示される。Chart.jsの軸title「日」も72行で直接指定。

### [med] form_configuration_literal_label
- 例: `src/Eccube/Form/Type/Front/IdentificationImageType.php:54 "本人写真と身分証の画像が、撮影された最新の画像であることに同意します。"`
- form_label/form_widget経由で表示されるが、制約メッセージでもtwigの|trans直接描画でもない。フォームlabel/placeholder/help/choiceを独立走査する必要がある。

### [high] app_user_data_hardcoded_visible_text
- 例: `app/template/user_data/hareruya_faq.twig:1304 "FAQを確認しても解決しなかった場合は、こちらからお問い合わせください。"`
- app/配下0件判断は、未収録「キー」だけを見た結論なら不十分。title属性を含む大量の直接表示文言があり、同ファイル:1172等にもユーザー可読title/textがある。


---

## エラー系クラスの追加収録（2026-07-26 完了）
codex検出のうち「エラー系」を追加収録（ユーザー承認範囲）。純ラベル/見出し/app FAQ本文は除外。

**パイプライン**: `extract_error_messages.py`(PHP例外/JsonResponse直書き/twigハードコード決定的抽出) →
`codex_error_msg_driver.py`(message/content/label/**not_shown**判定＋機能割当) → `merge_error_msgs.py`(クラス別に正確な根拠) →
`codex_twig_review_driver.py`(批判レビュー) → `embed_front_msgs_doc.py --area-re '[MFA]\d'`。

**実績**: 候補144 → codex判定(message55/not_shown47/content36/label4) → **55件収録**（機能割当48/EE-ERROR未確定7）。
- レビュー是正: wrong_fid 4（EE-ERROR→A06-03/A06-05/M12-05）・wrong_meta 4（M09-02インライン化・F04-04在庫無制限除外）。
- **レビュー基準の重大な学び**: 当初のレビュープロンプトは fabrication を「yaml非在」で判定していたため、
  **ハードコード直リテラル(ソースに逐語実在)を32件も誤って fabrication 判定**（偽陽性）。決定的再検証で
  **55件全てが根拠ソース(.php/.twig/.en.twig)またはyamlに逐語実在＝捏造ゼロ**を確認。en 5件(F08-03)は
  `.en.twig` 兄弟ファイルに逐語実在。→ `codex_twig_review_driver.py` の fabrication 基準を「yamlまたは根拠ソースに逐語」へ修正済み。

**設計書反映**: 22機能に52件埋込（API 11機能は表示メッセージ節新設）＋HTML22件再生成。doc↔正本 逐語照合 不一致0。
**最終**: 正本1516行 / MESSAGE_LIST 1245件・193機能 / validate 非在0 PASS。

---

# 追補: `要ソース確認` 全廃（2026-07-27）

## 背景
`要ソース確認` は「これから実ソースを調べる」未調査フラグだが、実際には
**調査済みで結論が出ている**項目や、**記述が古いだけ**の項目にも残っていた（正本319行・公開成果物にも漏出）。
フラグを消すのではなく **結論を書く** 方針で全廃した。

## 結果
| 対象 | Before | After |
|---|---|---|
| 正本 `message_inventory.tsv`（全13列） | 319行 | **0** |
| `functions/**/*.md`（正本設計書） | 31箇所 / 19ファイル | **0** |
| `function_spec_html_preview/` | 18箇所 | **0** |
| `MESSAGE_LIST.tsv` / `.md` | 28 / 20 | **0** / **0** |

捏造ゼロ検証: `rows=1516 非在=0 OK`（`validate_messages.py --check-embed`）。

## 確定させた結論の類型（すべて実ソース根拠つき）
1. **API応答（画面を持たない）** — A系19件。例外は全て `BaseApiException` 派生で
   `ExceptionListener.php:72-83,136-138` が `JsonResponse(code, errors)` を返す。
   → 表示位置=`API応答JSON（errors配列）` / 要素=`該当なし（画面要素を持たないAPI）`。
2. **到達不能（デッドコード）** — 実装はあるが利用者が到達できないことを確認した4件。
   - `M04-01-MSG-009` ルート `admin_stock_list_bulk_edit_dispatch` は twig/js 参照0件
   - `M03-01-MSG-002` `data-class-url` を持つ要素が src/app/html に非在
   - `M05-01-MSG-023` `#bulkDeleteModal` を開く操作が Order/index.twig に非在
   - `M03-09` 規格マトリクスは `createMatrixForm` 未呼出で画面自体が非在
3. **実行時可変につき一意特定不能** — 候補を「／」区切りで全列挙（既存規約）。
   `M04-13-MSG-035/054`, `M04-23-MSG-007/014`, `M05-18-MSG-003`, `M15-01-MSG-009`。
4. **ロケール未定義キー** — `M04-13-MSG-045`。キー定義0件のため Symfony がキー文字列をそのまま描画＝それが表示文言。
5. **vendor 標準訳が実効** — `M04-24-MSG-021`。src 側 `maxMessage` 未上書き＋ee側上書き非在。
6. **状態メッセージ（操作要素なし）** — 画面表示時に条件成立で描画されるもの。
7. **外部サイト起点** — `F07-04-MSG-001` は外部決済(SLNLink)からの復帰で描画。
8. **`EE-*` 未割当の理由確定** — 24件。デッキ機能の設計書不在／全画面共通フレーム／
   複数機能で共有されるフォーム制約・テンプレート／メールテンプレート編集の設計書不在
   （m10-09 本文:13 が対象外と明記）／プラグイン基盤（EC-CUBE本体）。

## 追加スクリプト（すべて冪等・`--dry-run` 必須）
`resolve_api_display_position.py` / `resolve_evidence_notes.py` / `resolve_residual_elements.py` /
`resolve_state_notes.py` / `resolve_ee_unassigned.py` / `merge_meta_results.py`（codex判定の統合）。

## ユーザー判断待ちの残件（フラグは外し、内容を明記して保留）
1. **`M09-08-MSG-002`** — `CacheController.php:45` の `addFlash(..., '')` は空文字リテラルで表示文言なし。
   エラー系収録時の `not_shown` 除外に相当。ID退役の要否。
2. **`M09-08-MSG-003`** — 根拠が `CacheController.php:48` で `M09-08-MSG-001` と同一（重複）。
3. **`F06-04-MSG-003`** — `/mypage/password_change` 由来だが f06-04 は `/forgot` 系。
   f06-04 md:31 が対象外と明記、f06-18 も `/mypage/change` のみ＝正本設計書が不在。
4. **`EE-ADMIN-MSG-003`** — `admin/Order/edit.twig:1604`。m05-11（受注編集）へ割当可能。
5. **`EE-ERROR-MSG-006`** — `UpdateStatusAction.php:92`。同メソッド:69 由来の `A06-05-MSG-002` と同一API。

## codex 批判レビュー結果（読み取り専用・2026-07-27）
上記1〜14の主張を codex に実ソースで再検証させ、**14件すべて CONFIRMED**（REFUTED/PARTIAL 0）。
代表的な裏取り:
- `ExceptionListener.php:72-83,136-140` が `isAppApi()` 時に例外の errors を `{code,errors}` で返すことを確認（主張1）
- `admin_stock_list_bulk_edit_dispatch` の参照はルート定義を除き src/app 内0件（主張3）
- `data-class-url` の一致は委譲セレクタ記述のみで、属性を持つ要素は非在（主張4）
- `metagame.twig` は66行しかなく旧根拠 `:142-161` は実在しない（主張12）
- `functions/` 配下に `/mypage/password_change` を扱う設計書は非在（主張14）

---

# 追補2: MSG-ID 連番監査と A02-05 誤割当の是正（2026-07-27）

## 連番監査（全FID・履歴31コミットを走査）
| エリア | 欠番 | 判定 |
|---|---|---|
| `M*` / `F*`（181 FID） | **0** | 完全連番（`renumber_msg_ids.py` TARGET_AREA=`^[MF]\d` の対象） |
| `A*`（11 FID） | **0**（是正後） | 是正前は A02-05 に1件。A系は連番化の対象外（ユーザー決定・2026-07-27） |
| `EE-*`（62バケット） | 176件 / 22バケット | 退避バケットのため連番性は要件外 |

`EE-*` 欠番176件の全数内訳:
- **24件** — ユーザー決定で一覧から除外し `unconfirmed_messages.tsv` へ退避
- **139件** — 機能割当が確定して `<FID>-MSG-###` へ再採番された跡（`EE-JS` 105件が最大）
- **14件** — 一度も採番されていない（`EE-FRONT` 11 / `EE-ERROR` 3）。採番後に候補が除外された跡

## A02-05 の欠番が暴いた誤割当（是正済み）
`A02-05-MSG-001` の欠番は**正常な再割当の跡**だった（カテゴリCSV取込由来 → m03-41 へ移動。
現在は `M03-41-MSG-006` / `M03-41-MSG-012` として実在）。

問題は残っていた2件で、**API設計書に管理画面のフラッシュメッセージが埋め込まれていた**:

| 旧ID | 実ソース | 実際の画面 |
|---|---|---|
| `A02-05-MSG-002` | `CsvImportController.php:899`（`csvClassName`／`admin_product_class_name_csv_import`） | 管理画面 規格CSV取込 |
| `A02-05-MSG-003` | `CsvImportController.php:1030`（`csvClassCategory`／`admin_product_class_category_csv_import`） | 管理画面 規格分類CSV取込 |

a02-05 は「更新商品規格取得（JSON API）」。A系26行を全数検査した結果、`Controller/Admin` 由来は
この2件のみで、他24行は `Controller/App` / `Service/App`（API）由来で正当だった。
規格CSV取込・規格分類CSV取込の正本設計書は `functions/` に**存在しない**（両ルートに言及するのは
誤って埋め込まれた a02-05 のみ）。

**是正（`retire_a02_05_misassigned.py`・ユーザー決定 = EE-* へ退避）**:
`EE-CLASSCSV-MSG-001` / `EE-CLASSCSV-MSG-002` へ退避。正本・`id_map.tsv`・a02-05設計書（表を撤去し
是正記録の注記へ置換）・結合テスト参照2ファイルを更新し、HTML再生成。
MESSAGE_LIST は 1,245件/193機能 → **1,243件/192機能**。`validate --check-embed` PASS。
A02-05 のメッセージは0件となり、欠番自体が消滅した。

> 注: 設計書のmdに**退役IDを文字列として書くと** `validate_messages.py --check-embed` が
> 「[D]md埋め込みIDが一覧に無い」で FAIL する（ID正規表現が本文全体を走査するため）。
> 是正記録の注記では退役IDを literal で書かないこと。

## 追加のフォローアップ
`integration_test/a02_05_..._it_cases.md` と `all_it_cases.tsv` の**4ケース**は、この誤割当を前提に
生成されている（更新商品規格取得APIのテストが管理画面CSV取込のメッセージを前提条件に置いている）。
参照整合性のためIDは付け替えたが、**ケース本文は誤りを引き継いだまま**。a02-05 の結合テスト再生成時に要修正。

---

# 追補3: codex 敵対的レビュー（捏造監査）2026-07-27

MESSAGE_LIST 全1,243件を codex に**敵対的**（正しさの確認ではなく捏造の摘発。迷ったら違反側）に
検証させた。42スライス×4並列、判定漏れ0。加えて事前スクリーニングで根拠不一致53件を優先バッチ化。

## 結果
| 判定 | 件数 | 確定 |
|---|---|---|
| ok | 1,009 | — |
| wrong_meta | 187 | 未検証（表示位置/表示条件/後続処理の齟齬） |
| wrong_en | 37 | **9件を是正**（残りは偽陽性と判定） |
| wrong_evidence | 27 | 決定的チェックでは51行（文言は正・根拠の指し先が不正確） |
| **fabrication** | **2** | **1件確定・是正済み / 1件は偽陽性** |
| runtime_value | 0 | — |

## 確定した捏造（1件）
**M13-10-MSG-002** — ja/en とも `admin.event.entry.paying_mem` で**28文字目で切り詰められていた**。
実キーは `admin.event.entry.paying_member_customer_not_registered`（`EntryUpdateAction.php:59`。
ja/en とも locale 未定義のためキー文字列がそのまま描画される）。根拠も生成元へ是正した。

## 偽陽性だった指摘（1件）
**M03-10-MSG-002** — codex は「整数で入力してください。」を捏造としたが、
`vendor/symfony/*/Resources/translations/validators.ja.xlf` の `<target>` に**完全一致で実在**し、
`BulkUpdateProductPriceDetailType` は `IntegerType` を使うため到達可能。vendor 同梱訳は正当なソース。

## 是正した英語列の取り違え（9件）
別キーの英語を流用していた。ja が複数キーに一致する場合に取り違えが起きる。
- `form_error.numeric_only`（正: `Entry must be numbers.`）に
  `admin.setting.shop.delivery.fee.invalid` の `Please enter with numbers.` を充てていた … 7件
- `admin.product.unselected_class`（正: `Not selected`）に
  `admin.stock.split_csv_modal.no_file_selected` の `No file selected` を充てていた … 2件

## 発見した検証ゲートの穴（2件・修正済み）
1. **部分文字列一致**: `validate_messages.py` の `grep -rqF` は部分一致のため、
   より長い正しい文言の**断片**が PASS する（実際に切り詰め破損がすり抜けていた）。
   → `check_literal_strict.py` を新設。**境界付き一致**（前後の文字が
   日本語/英数字/`_.-` でないこと）で「独立した一値として実在するか」を判定する。
   yaml値・クォート済みリテラル・twig本文テキストを一様に扱える。現在 **FRAGMENT=0**。
2. **CSV引用符の誤解釈**: 正本は `"\t".join(cells)` の**生タブ区切り**だが検証系が
   `csv.DictReader` で読んでいたため、`"` で始まる値（例 `"admin.hareruyamtg.com" is not allowed.`）
   の引用符が食われ、実データと違う文字列を検証していた（5セル）。
   → `lib_messages.read_master_rows()` を新設し `validate_messages.py` ほか全検証系を切替。

## 追加した検査（いずれも冪等・CIゲート化可能）
| スクリプト | 検査内容 | 現状 |
|---|---|---|
| `check_literal_strict.py` | 文言が断片でないか（境界付き一致） | FRAGMENT **0** |
| `check_en_pairing.py` | ja のキーに対し en が正しい対か（`--apply` で是正可） | EN_MISMATCH **0** |
| `check_evidence_anchor.py` | 根拠 file:line の周辺に文言/キーが実在するか | OK 1,130 / KEY_ONLY 335 / **MISS 51** |

## 残課題
- **wrong_evidence 51行** — 文言は正しいが根拠が別箇所を指す（例: controller の
  `$e->getMessage()` 行を指しており、実際の文言生成元は Action/Service/yaml 側）。
  捏造ではないが、テスト設計で根拠を辿れないため要是正。
- **wrong_meta 187件** — 表示位置/表示条件/後続処理と実装の齟齬。未検証。

---

# 追補4: wrong_meta 187件の二次検証と是正（2026-07-27）

## 方針: 逆バイアスの二次検証
1回目の敵対的レビューは「捏造を摘発せよ」というバイアスで走らせたため指摘が過剰に出る
（実績: fabrication 2件中1件、wrong_en 37件中28件が偽陽性）。無検証適用は正しい行を壊す。
そこで2回目は**逆バイアス**で回した（`codex_meta_verify_driver.py`）:
**既定は refuted。反証できなかった場合のみ confirmed** とし、そのときだけ列ごとの是正値を出させる。
文言(ja/en)は検証対象外＝変更提案を禁止。

結果: **confirmed 132 / refuted 55**（187件すべて判定）。

## 適用（174セル / 114行）
| 列 | 是正数 |
|---|---:|
| どこに（表示位置） | 46 |
| トリガー（条件） | 49 |
| 後続処理 | 30 |
| 種別 | 24 |
| 要素(表示) | 28 |

主な内容は**表示位置の実UI照合**だった。`完了画面本文` `画面上部` などの概括的な既定値が、
実際にはトースト・モーダル内・おすすめ枠内・商品一覧の結果領域などに描画されていた例が多い。
種別も、twig が `p-hareruya-message-box--error` で描画する成功文言や、
JS `alert` 経由（統制語彙上は「警告」）などを実装に合わせた。

## 却下ガード（confirmed でも適用しない）— 21件
codex は confirmed でも規約を壊す是正値を出す。`apply_meta_fixes.py` が自動却下する:
1. **内部用語の混入 13件** — 「セッションの有効期限が切れているとき」→「CSRFトークンが無効なとき」等。
   設計書は利用者視点で書く規約のため改悪。
   ただし**その語が当該行の文言に実際に出る**なら画面表示語なので許可する
   （例: 文言候補に「CSRFトークンが無効です、再送信してください。」を含む行）。
2. **多候補行の条件の狭め 2件** — 文言が「候補A ／ 候補B」形式の行は条件が全候補を覆う必要がある。
   列挙を含まない一般化（例「検証エラーが発生したとき」）は却下。
3. **明示除外 6件** — 現行が覆う条件を提案が落とすもの。
   `M04-13-MSG-054`（提案が「ログインしていない」を落とす）と CSV取込5行。

## CSV取込5行は条件を合成し直した（`fix_csv_import_conditions.py`）
`M03-30/32/33/38/44-MSG-001` は文言が3〜4候補の併記だが、
**元の値はファイルサイズ超過のみ・codex提案はCSRFと追加項目のみ**でどちらも不完全だった。
記録済みの逐語候補と1対1に対応する条件へ合成した（新しい事実は足していない）。

## 検証
`validate --check-embed` PASS / `check_literal_strict` FRAGMENT=0 / `check_en_pairing` MISMATCH=0。
設計書79件のHTMLを再生成。MESSAGE_LIST 1,243件/192機能で件数不変（メタ列のみの変更のため）。

## 残課題
- **却下21件** — 人手または別パスでの判断が必要。`meta_rejected.tsv` に現行値と提案値を併記。
- **refuted 55件** — 1回目の指摘は誤りと判定。再検証は不要。
- **wrong_evidence 51行**（`check_evidence_anchor.py` の MISS）は未着手。

---

# 追補5: 根拠(wrong_evidence)の是正とハーネス/スキル更新（2026-07-27）

## 根拠51行 → MISS 17行
`check_evidence_anchor.py` の MISS 51行（根拠の file:line 周辺に文言もキーも無い）を
`codex_evidence_fix_driver.py` で調査。**fixable 34 / keep 17**。

適用は `apply_evidence_fixes.py` で行うが、**提案をそのまま信じない**:
張り替え後の根拠で **アンカー判定が OK/KEY_ONLY になる場合だけ採用**する（機械的な再検証）。
34件すべて OK 判定で通過し、MISS は **51 → 17** になった。

典型的な是正は「controller の `$e->getMessage()` 行」→「文言生成元の Action/Service/Form Type
＋ locale 定義」への張り替え。表示経路の controller も捨てず後段に残している。

残 17行は codex が keep 判定したもので、**大半は検査側の限界**（根拠がベアファイル名で
パス解決できない／`addError('文言')` の直書きを正規化差で取りこぼす）。データ欠陥ではない。
この限界は `check_evidence_anchor.py` の docstring に明記した。

## ハーネス `.codex/message_inventory.js` の更新
- **fable5 段を撤去**（2026-07-21 ユーザー指示に未追随だった）。全段 codex 読取専用へ。
- 段構成を **CodexResolve → AdversarialAudit → VerifyFixes** に変更。
  監査は「摘発せよ」の敵対バイアス、二次検証は**既定 refuted の逆バイアス**。
  監査だけを適用すると偽陽性で正しい行を壊すため、**必ず対で回す**。
- 監査プロンプトへ検出クラスを追加: `fragment`（切り詰め破損）/ `wrong_evidence` / `wrong_en`。
- 監査プロンプトへ**偽陽性ガード**を明記（vendor xlf・未定義キー・プレースホルダ保持・候補併記・切詰め禁止）。
- 検証コマンドを **4ゲート**へ差し替え。
- `mode` を `full` / `review` / `auditonly` に整理（`codexonly` は廃止）。

## スキルの更新
- `SKILL.md`: 4ゲートの節を新設し「`validate_messages.py` だけでは不十分」を明記。
  敵対的監査→二次検証の手順と却下ガードを追加。
  **正本の読み方**（生タブ区切り／`read_master_rows()` 必須）を新節として追加。
  不変条件に「英語は同一キーの対」「多候補行の条件は全候補を覆う」「退役IDをmdに書かない」を追加。
- `references/CHECKLIST.md`: codex単独前提へ全面改訂。
  A に断片検査、B に twig|trans・エラー系、D に英語対・多候補条件、E に誤割当・退役ID、
  F に二次検証と却下ガード、G に偽陽性ガード、H に実行ゲートを追加。
