# 候補: m03-44 低価格帯カード価格変更CSV登録（取込/インポート） — 実行可能グレード候補（母集合86全量会計・機能まるごとPhase2）

> 著者=sonnet（著者≠レビュアー。codexが別途レビュー）。状態=草案（未実装・未実走）。**2026-07-29・Excel/canonical/ee/pf実ソース照合版**。
> 本書は `integration_test/CONCRETIZATION_GATES.md`（2026-07-27ユーザー承認）Gate A/B前提の候補md。CSV取込テンプレ（m03-26/m03-27）の§構成に倣う。
> **重大判定（一次資料が一致して機能全体をPhase2へ送出）**: 本機能（低価格帯カード価格変更CSV：出力・登録）は **Excel基本設計 0204 が「Ph2で対応」と明示** し、
> 正本一覧 `it-target-functions.tsv` が `Ph2=yes・superseded=yes` を付与し、実装（Controller/Route/取込種別ID/ロケール）が pf-eccube3・ec-cube-enterprise の**双方に存在しない**。
> したがって **Phase1で bound できる固有挙動は 0 件**。母集合86行は全て excluded（機能まるごとPhase2＝Phase1試験対象外）。
> **これはスコープ縮小ではなく、オラクル（Excel「Ph2で対応」）と正本一覧が機能全体をPhase2へ送っている事実の反映**（捏造ゼロ＝実装の無い機能に取込CSV期待値を捏造しない）。
> **方針（正直分類・B15）**: 一次資料が明示的に対象外/否定した機能は excluded。実在するが観測/固定不能なら TBD、固有挙動が file:line で実在し1回で一意判定できる場合のみ bound。本機能はいずれの bound 条件も満たさない（実装不在＝観測対象なし）。
> B1-B15 自己監査済み（正直分類・2026-07-29）。**Gate B自己監査済み**を明記のうえGate Aを回す。

## §0 版固定

- **Excel基本設計（最優先一次資料・source_class=excel）**: `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  sheet-46「低価格帯カード価格変更CSV出力」（section id=sheet-46・HTML行11478）／sheet-47「低価格帯カード価格変更CSVフォーマット」（section id=sheet-47・HTML行11794）。
  両シートに **「Ph2で対応」「フェーズ2」** 明記（HTML行11565・11579-11615）。目次 `0204:目次!C50,C51` に「M03-44 低価格帯カード価格変更CSV出力／…フォーマット」を掲載。
  git hash-object `06fc0cba464df7609d93ea0f9b1feb79092c5bfa`。根拠は `0204:低価格帯カード価格変更CSV出力!<セル>` 系の実Excel座標系で表記する（HTML行番号は実座標でない＝T2前処理の実座標方針。本書ではPh2判定の追跡にHTML行を併記）。
- **ee詳細設計md（挙動記述・source_classには不使用・裏取りのみ）**: `functions/ec-cube-enterprise/m03-44_admin_product_product_simple_low_price_csv_import.md`
  （git hash-object `4a7b35f0911c050b00cbdff336ad9efb207d6e4e`）。区分「新規実装」・「対応する現行実装が無い」（md:9,31）。フェーズ2記述（md:96-100）「機能まるごとフェーズ2対応・フェーズ1では実装・テストの対象外」。
  ※本mdの表示メッセージ表（M03-44-MSG-001〜006）は**未実装のPhase2機能の記述**であり、Phase1オラクルにしない（実装が存在しないメッセージ経路を候補化しない＝捏造ゼロ）。
- **正本一覧（canonical・会計整合）**: `integration_test/it-target-functions.tsv` の `M03-44｜低価格帯カード価格変更CSV登録｜対象｜yes｜yes｜Ph2=yes｜superseded=yes`。**Ph2=yes かつ superseded=yes** が付与済みでExcel「Ph2で対応」と一致（矛盾なし）。
- **Phase2根拠台帳**: `functions/phase2_candidates.tsv:9-10`（sheet-46 出力／sheet-47 フォーマット・ともに `ph2InDoc=yes・Ph2で対応`）。POC `integration_test/_poc2_m03-44.md`（Phase1実施ケース0の先行判定・gate_check済）。
- **実装不在の裏取り（ee実ソース・source_classには不使用）**: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/`（全14ファイル・`ProductSimpleLowPriceCsvController` **なし**）／`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28-45`（低価格帯用取込種別定数 **なし**。高額版 `SIMPLE_HIGH_PRICE_IMPORT_CSV_ID=7` は実在）／ee `Resource/locale/messages.en.yaml`・`messages.ja.yaml`（低価格帯CSV取込のメッセージキー **なし**）。
- **実装不在の裏取り（pf実ソース・source_classには不使用）**: `/home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/` に低価格帯価格変更CSV取込のController/Serviceは **なし**（`LowPrice` ヒットは DtbBuyOrder・MinPriceSubscriber 等の買取価格帯機能で本機能と無関係）。区分「新規実装」（pf現行に対応画面なし・md:91）と一致。
- 母集合: `integration_test/all_it_cases.tsv`（git hash-object `06536deb2a0c72f811c45f3c431f20ff0c78c141`）の `IT-M03-44-ADMIN-PRODUCT-PRODUCT-SIMPLE-LOW-PRICE-CSV-IMPORT-001..086`（86件・欠番0・重複0・確認済）。
- **source_class は excel／pf-fallback のみ**（standard-src/design/implementation は付与ゼロ＝Gate G2）。本機能はPhase2のためオラクル化できる固有挙動が無く、L1は「機能全体がPh2で対応」1件のみ（excel源）。
- **en**: 本機能固有の表示メッセージはPhase2（未実装）でありPhase1のen対訳対象なし。汎用CSV取込キー（`admin.common.csv_upload_complete`=CSV file uploaded 他）は ee `messages.en.yaml` に実在するが**低価格帯取込に固有のキーではない**（共有基盤・§5にgrep結果を記録）。唯一のL1（Ph2で対応）はExcel日本語設計マーカーで表示メッセージでない＝LS=0。
- **判定原則**: 母集合の観点/前提ラベルはノイズ（機械生成の定型90+観点スタブ）。本機能はExcel・正本一覧・phase2台帳・実装不在が一致してPhase2＝全行が試験対象外（excluded）。

---

## §1 L1原子オラクル表

全1claim。**source_class列は excel のみ**（Phase1でオラクル化できる固有挙動は「機能全体がPh2で対応」の1件のみ）。LS=0（Excel設計マーカーで表示メッセージでない＝enロケール変異なし）。
本機能はPhase2のため、取込フロー・CSV列・メッセージ（MSG-001〜006）・価格更新・スマレジ連携等の挙動claimはPhase1オラクルにしない（実装不在＝観測対象なし・§10）。

| oracle_id | claim_type | claim（検査可能な期待） | 逐語quote | 根拠(file:line) | source_class | LS |
|---|---|---|---|---|---|---|
| L1-M0344-001 | exclusion | 低価格帯カード価格変更CSV（出力・登録＝本機能全体）は Ph2で対応＝フェーズ1では実装・テストの対象外である。Phase1に到達するURL・画面・取込種別・登録処理は存在しない（実装不在）。したがって本機能の母集合86行は全てPhase1試験対象外である | 「Ph2で対応」 | 0204:低価格帯カード価格変更CSV出力!Ph2マーカー（excel_to_html/output/0204_基本設計仕様書(商品管理).html:11565・sheet-46/47） | excel | 0 |

---

## §2 SEEDセット設計（三段参照）

- **Phase1では該当なし**。本機能はPhase2（機能全体が対象外）のため、Phase1で投入すべき固定SEED・実行対象が存在しない（§0・§1）。
- Phase2実装時に必要となる合成データ（参考・オラクルではない）: 低価格帯（`0204` sheet-46 帯計算式・ランク表はPh2仕様）・現行基準価格/買取価格・原価単価・週間販売数・全店在庫数。**これらはPhase2ケース設計時に具体化する（本書では生成しない＝捏造回避）**。
- 登録の共通挙動（基準価格＝`dtb_product_class.standard_price`／販売価格＝`price02`／取込履歴＝`dtb_csv_import_history`）はPhase2実装時に **M03-30（価格変更CSV登録）** 基底で具体化する（ee詳細設計md:31,92-93。本件はPhase1で検証しない）。

---

## §3 取込CSV列マトリクス（参照情報・Phase2仕様）

取込CSV列（識別ID1商品ID・2言語ID・3基準価格〔旧「販売価格」をカスタマイズで改称〕・4買取価格・5原価単価〔新規追加〕）は Excel sheet-47「低価格帯カード価格変更CSVフォーマット」＝**Ph2で対応**（`phase2_candidates.tsv:10`）。個々の列値マッピング・帯計算・原価単価保存先はPhase2仕様のため、Phase1のオラクル表・DDTは置かない（捏造回避）。

---

## §4 実行可能グレード14列TSV（候補・bound 0）

- **本機能は機能まるごとPhase2（§0・§8）。Phase1の実施ケースは 0 件**。オラクル（Excel `0204` sheet-46/47「Ph2で対応」）と正本一覧（`Ph2=yes・superseded=yes`）がフェーズ1実装・テストを対象外としており、期待結果を持つ実行ケースは存在しない。実装（Controller/Route/取込種別）が pf・ee 双方に不在で観測対象が無い。
- 将来Phase2で実装される際は本TSVを **M03-30基底＋`0204` 低価格帯出力・帯計算・原価単価・CSV登録** の観点で具体化する。ヘッダのみ保持しゲート整合（会計完全性）を担保する。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
```

---

## §5 ja/en locale対応表（Phase2＝Phase1対訳対象なし・en-grep結果を記録）

本機能固有の表示メッセージ（ee詳細設計md記載の M03-44-MSG-001〜006）は**Phase2（未実装）**でありPhase1のen対訳対象がない。唯一のL1（Ph2で対応）はExcel日本語設計マーカーで表示メッセージでない＝enロケールキーなし（LS=0）。

**en-grep結果（捏造ゼロの根拠・「英訳なし」断定前の確認）**:
- 低価格帯取込に固有のメッセージキーは ee ロケールに**不在**: `grep -rniE "low_price|simple_low|低価格" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/*.yaml` → ヒットは `front.mypage.purchase_history.detail.bulk.low_price_notice` 等の買取価格帯機能のみ（本機能と無関係）。
- 汎用CSV取込キーは ee `messages.en.yaml` に実在（共有基盤・低価格帯固有ではない・参考）: `admin.common.csv_upload_complete`=「CSV file uploaded」(en:1684)／`admin.common.csv_invalid_format`=「Unmatched CSV format」(en:1810)／`admin.common.csv_format`=「CSV file format」(en:1806)／`admin.common.csv_skeleton_download`=「Download a template」(en:1805)。これらはPhase2で低価格帯取込が実装された際に流用され得るが、Phase1で本機能のオラクルにする固有経路が存在しない。

LS≠0 claim: **0件**（唯一のL1はExcel設計マーカーでLS=0）。

---

## §6 判定手段骨子（Phase1では該当なし）＋ _drafts隔離

- **Phase1に page・route が存在しない**（`ProductSimpleLowPriceCsvController` 不在・取込種別ID不在）。判定手段（アップロード画面セレクタ・フラッシュDOM・取込履歴テーブル・db.ts自動検証）はPhase2実装後に定義する。
- L1解決器・取込CSV fixture・SEED manifest契約は本機能ではPhase1に必要ない（実行ケース0）。
- 本草案は _drafts/ 隔離（正式解決器はこの _drafts/ を読まない）。Phase2実装時にM03-30基底で§4を具体化してから正式パスへ移す。

---

## §7 実行区分・多軸属性（Phase1実行対象=0）

Phase1の実行対象（Playwright／Playwright+DB確認／非UI）は **0件**。全母集合行が excluded（機能まるごとPhase2）でありTSVへ出力される bound/TBD 行が無い。よって本節に実行対象の列挙は無い（Gate G6: §7実行対象にTBD/excl番号が残存しない＝自明に充足）。

---

## §8 func_scope_check 完了表（機能スコープ自己検査・正式O6ではない）

判定はすべて一次資料の明示（Excel「Ph2で対応」・正本一覧 Ph2=yes/superseded=yes・実装不在）による。母集合86行はすべて機能まるごとPhase2に帰着し excluded（Gate B15）。

### 集計（86 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **0** | Phase1で bound できる固有挙動なし（実装不在＝観測対象なし） |
| **TBD** | **0** | 実在するが観測/固定不能な挙動なし（機能全体が未実装＝「実在するが」の前提を満たさない） |
| **excluded** | **86** | 機能まるごとPhase2（Excel `0204` sheet-46/47「Ph2で対応」／正本一覧 Ph2=yes・superseded=yes／pf・ee双方に実装なし）。下表86行 |
| 合計 | **86** | 欠番0・理由なし重複0 |

> 会計: bound 0／TBD 0／excluded 86（=86・欠番0）

- **Phase2をTBDでなくexcludedにする理由**: TBDは「実在するが観測/固定不能」（例: ログ観測未整備）を指す。本機能はExcelオラクル自身が機能全体を「Ph2で対応」と明示し、実装がpf・ee双方に無い＝Phase1に該当機能が存在しない。これは一次資料が明示的に対象外とした行＝excluded（B15の分類順(1)-(3)に相当）が正しい。POC `_poc2_m03-44.md` も全観点を `OUT`(Phase2) と判定済み（本書のexcludedと一致）。
- **B7非該当観点**: 削除/移動・リネーム/コピー/JSON/ファイル出力/検索など多数の観点スタブは取込機能に非該当だが、本機能ではそれ以前に機能全体がPhase2のため、非該当・汎用スタブ・Phase2をまとめて excluded とする（根拠の第一はPhase2）。
- **B14未認証**: 母集合-003（未認証）もPhase1に画面・ファイアウォール適用対象が無いため excluded。
- **B8観点補正**: bound行が0のため観点補正は無し（派生ビュー is 母集合ラベルのまま・emit は観点補正表を持たない本書で母集合ラベルを保持）。

### 86行 会計表（母集合1:1・全て excluded＝機能まるごとPhase2）

| No | 要旨（母集合項目名・観点／excluded理由） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出力失敗の結合確認（観点:出力失敗）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 002 | CSRFの結合確認（観点:CSRF）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 003 | 未認証の結合確認（観点:未認証）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 004 | 対象データの結合確認（観点:対象データ）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 005 | 出力抑止の結合確認（観点:出力抑止）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 006 | 識別子の結合確認（観点:識別子）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 007 | 状態変化の結合確認（観点:状態変化）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 008 | 確認ダイアログの操作結果確認（観点:確認ダイアログ）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 009 | HTTPステータスの操作結果確認（観点:HTTPステータス）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 010 | 必須バリデーションの入力検証（観点:必須バリデーション）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 011 | 必須バリデーションの入力検証（観点:必須バリデーション）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 012 | 文字列長バリデーションの入力検証（観点:文字列長バリデーション）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 013 | 相関バリデーションの入力検証（観点:相関バリデーション）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 014 | 相関バリデーションの入力検証（観点:相関バリデーション）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 015 | 相関バリデーションの入力検証（観点:相関バリデーション）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 016 | 相関バリデーションの入力検証（観点:相関バリデーション）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 017 | DBとの相関バリデーションの入力検証（観点:DBとの相関バリデーション）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 018 | DBとの相関バリデーションの入力検証（観点:DBとの相関バリデーション）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 019 | 部分入力の入力検証（観点:部分入力）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 020 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 021 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 022 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 023 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 024 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 025 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 026 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 027 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 028 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 029 | 登録時の登録内容確認（観点:登録内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 030 | 登録時の実行結果確認（観点:実行結果）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 031 | 登録時の実行結果確認（観点:実行結果）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 032 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 033 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 034 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 035 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 036 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 037 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 038 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 039 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 040 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 041 | 更新時の更新内容確認（観点:更新内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 042 | 更新時の実行結果確認（観点:実行結果）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 043 | 更新時の実行結果確認（観点:実行結果）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 044 | 実行結果の結合確認（観点:実行結果）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 045 | フォーマット定義の入力検証（観点:フォーマット定義）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 046 | フォーマット定義の入力検証（観点:フォーマット定義）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 047 | 実行結果の結合確認（観点:実行結果）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 048 | 実行結果の結合確認（観点:実行結果）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 049 | 出力内容の結合確認（観点:出力内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 050 | 出力内容の結合確認（観点:出力内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 051 | 出力内容の結合確認（観点:出力内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 052 | 出力内容の結合確認（観点:出力内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 053 | 出力内容の結合確認（観点:出力内容）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 054 | 削除の結合確認（観点:削除）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 055 | 移動・リネームの結合確認（観点:移動・リネーム）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 056 | コピーの結合確認（観点:コピー）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 057 | ファイル登録の結合確認（観点:ファイル登録）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 058 | ファイル出力の結合確認（観点:ファイル出力）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 059 | JSONの結合確認（観点:JSON）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 060 | 同名ファイルの結合確認（観点:同名ファイル）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 061 | 入力JSONの結合確認（観点:入力JSON）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 062 | 配置先の結合確認（観点:配置先）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 063 | スキーマの結合確認（観点:スキーマ）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 064 | 初期行数の結合確認（観点:初期行数）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 065 | 表示順の結合確認（観点:表示順）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 066 | 更新抑止の結合確認（観点:更新抑止）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 067 | 内部情報の結合確認（観点:内部情報）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 068 | 画面レイアウトの結合確認（観点:画面レイアウト）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 069 | 画面レイアウトの結合確認（観点:画面レイアウト）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 070 | 画面レイアウトの結合確認（観点:画面レイアウト）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 071 | 画面レイアウトの結合確認（観点:画面レイアウト）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 072 | 画面レイアウトの入力検証（観点:画面レイアウト）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 073 | 画面レイアウトの入力検証（観点:画面レイアウト）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 074 | 画面レイアウトの入力検証（観点:画面レイアウト）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 075 | 一覧の結合確認（観点:一覧）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 076 | 画面表示データの結合確認（観点:画面表示データ）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 077 | 画面表示データの結合確認（観点:画面表示データ）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 078 | 画面表示データの結合確認（観点:画面表示データ）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 079 | 画面表示データの結合確認（観点:画面表示データ）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 080 | フォーム送信の結合確認（観点:フォーム送信）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 081 | ファイル選択の結合確認（観点:ファイル選択）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 082 | 非同期更新の結合確認（観点:非同期更新）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 083 | エラー継続の結合確認（観点:エラー継続）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 084 | 公開コンテンツの結合確認（観点:公開コンテンツ）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 085 | カート整合の結合確認（観点:カート整合）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |
| 086 | データ正当性の結合確認（観点:データ正当性）＝機能まるごとPhase2(Excel 0204 sheet-46/47「Ph2で対応」)・Phase1実装/ルート/取込種別なし | excluded | — |

`func_scope_check` 判定: 親86/86会計済み・欠落0・理由なし重複0。O6は主張しない。

---

## §9 TBD・要実機・excluded（正直な分離）

### 9.1 TBD（0件）

本機能はPhase1に実装が存在せず、「実在するが観測/固定不能」なclaimが無いためTBDは0件。Phase2実装後に帯計算・価格更新・スマレジ連携等が観測/固定不能な部分を持てば、その時点でTBD判定を行う。

### 9.2 要実機／Phase2具体化（実行面の保留）

| 事項 | 状態 |
|---|---|
| 本機能全体（低価格帯カード価格変更CSV 出力・登録） | **Phase2**（Excel `0204` sheet-46/47「Ph2で対応」・正本一覧 Ph2=yes/superseded=yes）。Phase1では実装・テスト対象外 |
| Phase2実装時の基底 | M03-30（価格変更CSV登録）を基底に、低価格帯出力（帯計算式・ランク表 `0204` sheet-46）・原価単価新規追加（sheet-47 識別ID5）・スマレジ連携を上乗せ。保存先は基準価格=`dtb_product_class.standard_price`／販売価格=`price02`／履歴=`dtb_csv_import_history`（ee詳細設計md:75,92-93。取込種別ID・原価単価カラムはPhase2で確定＝付帯表参照） |
| 取込種別ID・専用Controller | ee `MtbCsvImportType` に低価格帯用定数なし・`ProductSimpleLowPriceCsvController` 不在（実ソース確認済）。Phase2で新規に定義・確定する |

### 9.3 excluded＝86件（すべてtsv非出力・§8の86行会計表）

全86行が **機能まるごとPhase2** を第一根拠に excluded（Excel `0204` sheet-46/47「Ph2で対応」・正本一覧 Ph2=yes/superseded=yes・pf/ee双方に実装なし）。母集合の観点スタブ（削除/コピー/JSON/検索/ファイル出力等の非該当・汎用「含まれる/一致」スタブ・未認証/CSRF等の共通機構）も、本機能ではPhase1に実行対象が無いため個別のB7/B14/B15判定に先立ちPhase2で一括excludedとする。

---

## §10 特記事項（片側断定せず記録）

1. **一次資料の一致（Phase2判定の強度）**: Excel基本設計（`0204` sheet-46/47「Ph2で対応」）・正本一覧（`it-target-functions.tsv` M03-44 Ph2=yes・superseded=yes）・Phase2台帳（`phase2_candidates.tsv:9-10`）・実装不在（pf/ee双方に低価格帯Controller/取込種別/ロケールキーなし）・POC（`_poc2_m03-44.md` 全観点OUT(Phase2)）の**5系統が一致**して機能全体をPhase2に置く。捏造ゼロの観点で、実装の無い機能にSEED/取込CSV/期待フラッシュを著作しない。
2. **対称機能の裏付け**: 高額版 M03-32/M03-43（`ProductSimpleHighPriceCsvController`・`SIMPLE_HIGH_PRICE_IMPORT_CSV_ID=7`）は ee に完全実装される一方、低価格版 M03-44 は未実装＝Phase2判定を実装面から裏付ける（ee詳細設計md 付帯表・POC 付帯表4 B2）。Phase2実装時のテンプレートは高額版が有力。
3. **ee詳細設計mdのメッセージ表はPhase1オラクルにしない**: ee md の M03-44-MSG-001〜006（CSRF無効・行数上限・商品規格なし・登録完了・セール中販売価格据置・CSRF/サイズ超過）は未実装Phase2機能の記述であり、実装（Controller/ロケールキー）が存在しないためPhase1で候補化・オラクル化しない（実在しないメッセージ経路の捏造回避）。Phase2実装時にee実ソースで確定する。
4. **将来Phase2での再具体化**: Phase2で低価格帯取込が実装された際は、本§4を M03-30基底＋`0204` sheet-46/47（帯計算・原価単価）で具体化し、CSV取込Major教訓（更新系bound・B12別判定・breakAll/skipRow一意化・確認モーダル極性・source_class帰属・en全キーgrep・B9スナップショット・B6画面/内部分離・1候補1検証事実の原子化）を適用する。本書はその時点までヘッダのみ保持しゲート整合（会計完全性）を担保する。
