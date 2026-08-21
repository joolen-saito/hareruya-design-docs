---
name: output-exclusion-policy
description: HTML設計書の出力除外規約の正本。取り消し線・図形テキスト全件表・実装差分追補・機能設計書の5分類（処理フロー/入出力/業務ロジック/表示メッセージ/エラー処理）と除外列について、何をHTMLへ出力しないか、どこに実装があるか、どう検証するかを一箇所に集約する。除外ルールを追加・変更・確認するとき、および除外が正しく効いているか検証するときに使用する。
---

# HTML設計書 出力除外規約（正本）

2026-08-12 ユーザー決定。HTML設計書へ出力しないものをここに集約する。**この文書が唯一の記述正本**であり、
[[excel-to-html]] / [[function-spec-html-render]] / [[endpoint-supplement]] / [[doc-parity-check]] は本文を複製せず
ここを参照する。ルールを増減するときも、まずここと実装（下記の定義箇所）だけを直す。

共通の前提:

- 適用先は**HTML設計書と、中間成果物である機能設計書Markdown（`functions/<区分>/*.md`）の両方**（2026-08-12 ユーザー決定）。
  Markdown側の節統合・検査は `sync_markdown_exclusions.py`（`map` / `check` / `apply`）が、HTMLと同じ定義を import して行う。
  リバース設計の章立て（各 `TEMPLATE.md`）からも対象節を外してあるので、新規に書き起こす文書には最初から入らない。
- Excel正本（`.xlsx`）と route突合データ（`endpoint_reports/`）は変更しない。取り消し線の原文などが必要なときはそちらを読む。
- 機械可読な唯一の正本は実装側の定義（`ALLOWED_SECTION_TITLES` / `SECTION_ALIASES` などの定数とフラグ）。文書はここ1箇所だけが説明を持つ。
- 検証は `excel_to_html/verify.py` が実装側の定義を import して行う（二重定義しない）。

## 1. Excel由来: 取り消し線

- 正本Excelで取り消し線が引かれた文章はHTMLへ出力しない。装飾（`cell-strike`）付きで残すのではなく、文字列そのものを出さない。
  - 対象は「セル」と「DrawingMLの図形・テキストボックス内テキスト」の両方。セルは run 単位・セル継承で、図形は `a:rPr@strike`（`sngStrike`/`dblStrike`）で判定する。
  - 部分的な取り消し線は取り消し線部分だけを落とし、残りはそのまま出力する。除去の結果テキストが空になったセル・図形は出力対象から外れる（＝行・ピン・図のラベルとして出ない）。取り消し線で消えた図のノードは、テキストのない背面図形として座標だけ保持する。
  - 実装は `convert.py` の `RENDER_STRUCK_TEXT=False` と `apply_strike_exclusion()`（セル）／`_shape_text()`（図形）。`True` へ戻すと従来どおり `cell-strike` 付きで表示する。
- 取り消し線の**検出**は従来どおり堅牢に行う（除外の前提になるため精度を落とさない）。特定ブック・シート・文言に依存するハードコード補正で代替しない。`styles.xml` / `sharedStrings.xml` / `inlineStr` の `rPr` を直接読み、`<strike val="0">` は偽として、run 単位・セル継承で全機能を判定する。取り消し線付きの文言が必要な場合は正本Excel、または [[t2-excel-preprocess-tool]] 相当のExcel直読み抽出（`cell-strike` を run 位置付きで保持）を参照する。HTMLは参照先にしない。

## 2. セクション単位の除外

- 次のセクションはHTML設計書へ出力しない。抽出・解析そのものは従来どおり行い、他用途（番号ピン復元・画面遷移図・台帳）では引き続き使う。
  - 後段注入由来: 「実装差分追補」節（`endpoint-supplement:start/end`）と装飾CSS。実装は [[endpoint-supplement]] の `RENDER_ENDPOINT_SUPPLEMENT=False` で、`build` が既存HTMLから節を除去し、`verify` は不在を検査する。route突合の正本（`endpoint_reports/`）は保持する。
  - Excel由来: 「図形・テキストボックス内テキスト」全件表（`shape-block`）とシート内ジャンプの同リンク。`convert.py` の `RENDER_SHAPE_TEXT_SECTION=False` が実装で、`True` へ戻せば従来の全件表出力へ復帰する。
  - Excel由来: 「コネクタ解決台帳」（`<details class="connector-ledger">`）。`convert.py` の `RENDER_CONNECTOR_LEDGER_SECTION=False` が実装（2026-08-20 ユーザー決定）。連結不能コネクタの抽出と hard/soft 判定は従来どおり行い、全件を `output/connector_ledger_sheets.csv` へ記録する。握り潰し検知（未解決 hard 数の突合）の参照先もHTMLからこのCSVへ移した。
  - Excel由来: 「番号pin対応台帳」（`<details class="pin-ledger">`）。`convert.py` の `RENDER_PIN_LEDGER_SECTION=False` が実装で、`True` へ戻せば従来どおり各シート末尾へ台帳テーブルを出力する（2026-08-19 ユーザー決定）。番号pinの抽出・画像への復元・項目定義No.との相互リンクは従来どおり行う。
  - 割当由来: **同じMarkdownが同一書番の複数シートへ割り当たる場合は、Excel上のシート順で最初の1枚にだけ出す**（2026-08-19 ユーザー決定）。重複の実体はMarkdownではなくシート割当なので、正本からは削除しない（削除すると残す側からも消える）。判定は `integrate_function_docs_into_excel_html.py` の `_sheet_order()` による機械規則だけで行い、**例外指定の台帳は作らない**（同 決定）。実例: 権限管理／権限制御、検索入力／検索結果、CSV登録／CSVフォーマット、メール一括送信／確認／完了。
  - Markdown由来: **「副作用」の節・表行は正本Markdownから削除する**（2026-08-19 ユーザー決定。入出力の内容と重複するため設計書に書かない）。描画時の除外ではなく正本を直す方式で、`sync_markdown_exclusions.py drop` が対象節（副作用／エッジケース／データ整合性／バリデーション補足／明細の並び／出力: 画面の項目／出力: 一覧の列／入力項目）。加えて、更新する対象の表を持たず「更新しない」だけの `入出力: 永続化` 節も落とす（`drop_empty_persistence()`）。永続化節は更新するものがある機能にだけ置くと `| 副作用 | … |` の表行を落とし、落とした行を `functions/_archive/` へ退避する。
  - Markdown由来: **物理テーブル・列を列挙する「DB関連」の記述**は設計書に書かない（2026-08-19 ユーザー決定。すべてのHTML設計書で不要）。見出しを持たない本文中の表として書かれることがあり見出し名では捕まえられないため、**Markdown正本側から外して `functions/_archive/` へ退避する**のが正しい直し方で、`verify.py` の `_db_tables_matching()` が表ヘッダ（テーブル/列・テーブル/項目・対象テーブル/Entity・テーブル名/カラム）で再混入を検出する。永続化は論理名で書く節（0203「入出力: 永続化」）なので対象外。
  - Markdown由来（機能設計書の埋め込み・単体プレビュー共通）: **定型小見出し**（`BOILERPLATE_SUBSECTION_TITLES`＝ログ・監査 / ログに出してはいけないもの / 権限・認可 / セッション / 本機能におけるセッション / セッションへ保存しない情報 / Cookie / 排他制御・トランザクション / 試行制限）を**見出しレベルを問わず**本文ごと落とす（2026-08-19 ユーザー決定。0203 の記述方法を正とする）。5分類の判定はH2限定なので、旧世代Markdownがこれらを `###` `####` で持つとすり抜けていた。内容は [[common-spec]] 側にあり、ログ出力・セッション/Cookie は `reverse-design/GRANULARITY.md` 3.7 / 3.7b で「設計書に書かない」と決まっている。
  - Markdown由来（機能設計書の埋め込み・単体プレビュー共通）: 5分類の外にある節（下記 2.5）。Excel由来の本文には掛からない（Excel設計書自身の「概要」見出し等はそのまま出力する）。管理画面では表の列「画面上の文言(英語)」も列ごと落とす。
- 非出力にした図形テキストは `output/shape_textbox_sheets.csv` へ全件（`file_name`, `sheet_name`, `shape_index`, `cellref`, `text`, `reason=出力除外規約…`）記録し、黙って消えたのか除外したのかを機械で区別できる状態に保つ。
- 非出力にした番号pinの対応状況は `output/pin_ledger_sheets.csv` へ全件（`file_name`, `sheet_name`, `sheet_id`, `pin`, `pin_no`, `cellref`, `image_assignment`, `status`, `item_candidates`, `item_candidate_count`, `duplicates`, `reason`）記録する。`status` は `matched` / `ambiguous` / `missing_item` / `unassigned` の4値で、**台帳をHTMLから外した以上、pinの対応状況を追える記録はこのCSVだけ**になる。CSVを手で編集して合格扱いにしない。
- 「図形・テキストボックス内テキスト」全件表を出さないため、`pin-<sheet>-<no>` を持つのは画像上に復元された番号ピンだけになる。項目表No.から `#pin-…` への逆リンクは画像ピンがある番号に限って張り、存在しないピンへのデッドリンクを作らない（`item-<sheet>-<no>` 側のidは従来どおり全一致No.へ付与し、既存引用のアンカーを壊さない）。

## 2.5 詳細設計は3分類だけ（2026-08-19 ユーザー決定・0203 の出力を正とする）

機能設計書（`functions/<区分>/*.md`）の節でHTMLへ出すのは **入出力 / 業務ロジック / 表示メッセージ** の3つだけとする。旧5分類の **処理フロー・エラー処理は非出力**（`RETIRED_SECTION_TITLES`）。0203 の現行仕様が業務ロジックと入出力だけで構成されており、そこへ全設計書を揃える決定。`SECTION_ALIASES` が処理フロー・エラー処理へ寄せていた旧節（利用者視点の入口・フロント挙動・ページネーション・エッジケース・判定順序）も同じく非出力になる。Markdown正本は変更しない（HTML表示だけの措置）。

- 「リニューアル後の仕様」として出すのは **表示メッセージだけ**。新規実装（文書全体がリニューアル後の仕様）の機能でも、表示メッセージ以外は出さない。
- 出す本文が無くなった機能は、埋め込みブロックごと作らない（見出しだけの空ブロックにしない）。廃止・フェーズ2の明示が要る機能はブロックを残す。

以下は旧5分類の記述（履歴として残す）。

## 2.5-旧 詳細設計は5分類だけ（2026-08-13 ユーザー決定・許可リスト方式）

機能設計書（`functions/<区分>/*.md`）の節は **処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理** の5つだけとする。Excel基本設計仕様書に無い仕様（処理の順序・分岐、DB副作用、メッセージ文言、エラー時の挙動）は現行ソースからしか決まらないため、記述をこの5節に集中させる。

判定は**節レベル（`##`）の見出しだけ**に掛ける。配下の小見出し（`###` 以下）は親の節に従うので落ちない。定義と写像は `convert_function_spec_html.py` の `ALLOWED_SECTION_TITLES` / `SECTION_ALIASES` / `SECTION_ALIAS_PATTERNS` / `COMMON_SPEC_SECTION_TITLES` / `ARCHIVED_SECTION_TITLES` が唯一の正本で、`canonical_section_title()` が唯一の判定関数。

| 5分類 | 寄せる旧節 |
| --- | --- |
| 処理フロー | 利用者視点の入口（エンドポイント）、フロント挙動、ページネーション、「…時の判定順序」 |
| 入出力 | 副作用、出力列とデータの対応、API/バッチ結果、ログ・監査 |
| 業務ロジック | 業務ルール・計算、データ整合性、集計・判定・計算、認証・認可、共通仕様と一致しない機能固有の 権限・認可／セッション／Cookie／排他制御・トランザクション／試行制限 |
| 表示メッセージ | フラッシュメッセージ |
| エラー処理 | エッジケース |

- **共通仕様へ集約済みの節**（`COMMON_SPEC_SECTION_TITLES`）は、[[common-spec]] の台帳でその機能が共通内容と一致すると判定されている場合だけ本文から外す。機能固有の内容を持つ例外機能では「業務ロジック」へ寄せて残す（内容を捨てない）。
- **Excelが正の節と補助節**（`ARCHIVED_SECTION_TITLES`: 概要・リニューアル移行時の扱い・集計条件・DBカラム・バリデーション・調査補助・画面遷移・文書情報・改訂履歴・機能の目的と役割・本書で扱うこと／扱わないこと・用語・参考・TODO・実装要確認）は本文から外し、`functions/_archive/<区分>/<file>.md` へ**退避**する。削除ではないので内容は追える。
- 適用先は **Markdown正本とHTMLの両方**。Markdown側の節統合は `sync_markdown_exclusions.py map` が行い、**見出し以外の本文行が本体＋退避で過不足なく保たれること**をゲートで検査する（欠落ゼロゲート）。1節が別の節へ合流するときは、元の節名を `###` として残し、配下の見出しを1段下げる。
- 5分類の充足（＝現行ソースからの取得漏れ）は `.cursor/skills/reverse-design/scripts/audit_five_sections.py` で監査する。
- **5分類のうち「表示メッセージ」だけは現行仕様ではなくリニューアル後の仕様**（2026-08-19 ユーザー決定）。Markdown正本にはこの区別を書かず、HTML描画のときだけ本文の末尾へ回し、境目に「リニューアル後の仕様」の見出しを出す。定義は `RENEWAL_SECTION_TITLES` / `RENEWAL_SECTION_LABEL`、分割は `split_renewal_sections()` が正本で、単体プレビュー・埋め込み・orphanグループの全経路に効く。表示メッセージしか無い機能では埋め込みヘッダの「現行仕様」見出しを出さない（`has_current_spec_sections()`）。節の除外ではないので本文は落とさない。

## 2.6 対応シートが無い機能はHTMLへ出さない（2026-08-14 ユーザー決定）

Excel基本設計仕様書に**専用の画面シートが無い機能は、リニューアルで廃止された機能**である。詳細設計書があってもHTML設計書へ出力しない。

- 旧実装は「同じ機能グループの親シート末尾へ追記」していたが（例: M05-12 対応状況一括変更 が「受注情報検索 一覧」シートに出る）、読み手がその画面の仕様と読み違えるため廃止した。実装は `integrate_function_docs_into_excel_html.py` の `EMBED_PARENT_SHEET_FALLBACK=False`。`True` へ戻すと従来の親シート追記に復帰する。
- 非出力にした機能は `functions/function-doc-excel-integration-report.md` の「非出力: Excel基本設計に対応シートが無い機能（リニューアルで廃止）」へ全件記録する（黙って消さない）。現状76件。
- 廃止の裁定そのものは [[superseded-spec]] の台帳（`functions/superseded_specs.json`）で確定させる。レポートの一覧は台帳へ登録するための入力であり、登録の代わりにはしない。

## 2.7 現行で機能していない仕様は出力しない（2026-08-17 ユーザー決定）

現行ソースに実装が残っていても、**その経路が成立せず利用者に効果が出ない仕様は詳細設計書へ書かない**。リバースで得た「コードにある」ことと、「現行仕様である」ことは別だからである。書くと、動かない仕様を現行仕様として引き継ぐ危険がある。

### 不機能仕様の類型

| 類型 | 見分け方 | 実例 |
| --- | --- | --- |
| 画面に入力欄が無い条件 | フォームに定義があるがテンプレートに描画が無い | 受注検索の購入グループ、EC-CUBE本体側の購入商品名 |
| フォーム項目が無い分岐 | 実装に条件分岐があるが、対応する入力項目がどのフォームにも無い | 受注検索の受注IDの範囲指定、対応状況の単一指定 |
| 呼び出し前に無効化される条件 | 値を退避・初期化してから呼ぶため分岐に入らない | 本体側のフリーワード条件。拡張が値を退避してから親を呼ぶ |
| 結果が同一になる分岐 | 条件の真偽で出力が変わらない | スタック用紙印刷の高額判定。しきい値以上でも未満でも同じ記号を返す |
| 受け取るが使わない値 | リクエストから取得した後、参照が無い | 受注検索の並び替え指定。検索処理もテンプレートも参照しない |

### 手順

1. **除外する前に台帳へ登録する。** 台帳は `functions/dead-spec-register.tsv`。列は 機能No / 対象 / 類型 / 到達できない理由 / 根拠(file:line) / 判定日。
2. 根拠は必ず `file:line` で書く。実装が変わって機能するようになったときに再判定できるようにするため。
3. 台帳に載せてから詳細設計書から落とす。**黙って消さない。**
4. 判断がつかないものは落とさない。書いたうえで設計側の裁定を仰ぐ。

### 機械検出

画面に入力欄が無い条件は機械で洗える。

```bash
python3 .cursor/skills/output-exclusion-policy/scripts/detect_unreachable_form_fields.py \
  --form <フォーム定義のPHP> [--form <拡張のPHP> ...] --template <テンプレートのtwig>
```

フォームに定義されているのにテンプレートが描画しない項目を出す。残りの類型は機械では洗えないため、実装を読むときに上表の見分け方で拾う。

### レビューとの関係

台帳に登録済みの不機能仕様は、敵対レビューの「事実の欠落」の指摘対象から外す。レビュー観点ファイルに台帳のパスを書き、登録済みのものは指摘しないよう明記する（[[adversarial-review]]）。

## 3. Markdown由来（機能設計書）の節・列

- 節の取捨は **2.5 の5分類（許可リスト方式）** が唯一の規則。旧「除外リスト方式」（`EXCLUDED_SECTION_TITLES` / `SCREEN_ONLY_EXCLUDED_SECTION_TITLES` / `NON_FRONT_EXCLUDED_SECTION_TITLES` / `CUSTOMIZATION_SCOPED_SECTIONS`）は 2026-08-13 に廃止した。「API/バッチ結果」「フロント挙動」「ログ・監査」は区分やカスタマイズ区分で出し分けず、5分類（入出力／処理フロー）へ寄せる。
- 節の範囲は見出しから次の同レベル以上の見出しの手前まで。判定は節レベル（`##`）だけに掛け、配下の小見出しは親の節に従う。見出しの番号付け・副題の括弧・表記ゆれは `normalize_heading_title()` が吸収する。コードフェンス内の `#` 行は見出しと誤認しない。
- 管理画面のみ・**表の列**単位: 「表示メッセージ」節のメッセージ一覧などに現れる列「画面上の文言(英語)」を、列見出しと各行の同位置セルごと落とす。フロント・APIの設計書では残す。定義は `ADMIN_ONLY_EXCLUDED_TABLE_COLUMNS` / `drop_excluded_columns()`。列名の一致は `normalize_column_title()`（全角括弧を半角に寄せるだけで副題は落とさない＝「画面上の文言」と別物として扱う）。行のセル数が列見出し数と食い違う表は列位置を信用できないため**何も落とさない**（安全側。正本Markdownの `|` 崩れを直せば次回から落ちる）。
- 区分は `function_kind()` が `admin` / `front` / `api` / `batch` / `other` / `None`（不明）で返す。優先順は `functions/todo-list.md` の**区分** → ファイル名の種別トークン → 機能Noの接頭辞。5分類化で節の出し分けには使わなくなったが、列の除外とレポートで引き続き使う。
- 実装は `convert_function_spec_html.py` の `canonical_section_title()` / `strip_excluded_sections()` で、`markdown_to_html()` の入口＝全経路の単一関門で落とす。目次（TOC）からも消える。`excel_to_html/verify.py` はこの定義を import して残存見出しを検査する（二重定義しない）。検査は節レベルの見出しだけを対象とし、埋め込みブロック単位で `data-source` から区分を判定する。

### カスタマイズ区分による出力可否（2026-08-13 廃止）

- 旧規約では「ログ・監査」をカスタマイズ区分（現行踏襲／カスタマイズ）でのみ出力していたが、
  5分類化により「ログ・監査」は**入出力**へ寄せるため、区分による出し分けは行わない。
  `customization_kind()` はレポート用途で残す。

### 共通仕様へ集約した節

- 試行制限 / Cookie / 排他制御・トランザクション / セッション / 権限・認可（管理画面のみ）/
  ログに出してはいけないもの は [[common-spec]] が1本の共通仕様へ集約する。各機能HTMLから落とすのは
  **共通内容と一致すると判定された機能だけ**で、機能固有の内容を持つ機能では「業務ロジック」へ寄せて残す。判定台帳は
  `common_spec/common_spec_data.json`、除外の実装は `common_spec_titles()`。台帳が無ければ何も落とさない。

## 4. 検証（`excel_to_html/verify.py`）

- 取り消し線: `cell-strike` が0件で、取り消し線側にしか無い文字列が本文に出現しない。セル値カバレッジの期待値からも同じ規則で除外する（除外と欠落を混同しない）。
- **独立検証（2026-08-19 追加・codexの「検証の不備」指摘への対応）**: セル値カバレッジは期待値を `convert.py` の取り消し線モデルから作るため、**変換器が誤判定すると検証器も同じ誤りをして検出できない**（共倒れ）。さらに `in body_text` 判定は座標も出現回数も見ないので、別セルの同一文言で成立してしまう。これを塞ぐため `excel_to_html/independent_cells.py` が OOXML を独自に読み（convert.py の関数を一切呼ばない）、`verify.py` が次を検査する。
  - 取り消し線モデルの突合: 全文／部分の取り消し線セル集合が変換器側と一致すること。食い違えば不合格（どちらが誤りかは人が判定する）。
  - 座標単位のカバレッジ: 文字列セルの期待文言が、**そのセル自身の `data-excel-ref` を持つ span** に出ていること。
  - 全文取り消し線のセルは、その座標の span がHTMLに存在しないこと。
  - 部分取り消し線のセルは、取り消された文字列がそのセルの描画文言に残っていないこと。
  - 数値・日付・数式セルは表示文字列が書式依存なので文言は比べず、**座標の存在**だけを見る。
- 図形テキスト: HTMLに `shape-block`／「図形・テキストボックス内テキスト」が無く、除外分が `shape_textbox_sheets.csv` にシート単位で抽出件数・連番・セル位置・本文一致で全件記録されている。
- 番号pin対応台帳: HTMLに `<details class="pin-ledger">`／「番号pin対応台帳」が無く、除外分が `pin_ledger_sheets.csv` にシート単位で件数・pin本文一致で全件記録されている。期待値は convert と同じ絞り込み（`is_number_pin_id(normalize_pin_id(text))`）で作る。`RENDER_PIN_LEDGER_SECTION=True` へ戻した場合は逆に、pinを持つブックのHTMLに台帳が在ることを検査する。
- 実装差分追補: HTMLに `endpoint-supplement:start` / `endpoint-supplement-user-entry` が無い。
- Markdown由来: `function-design-embed:start/end` マーカーで囲まれたブロック**内に限定**して、5分類の外にある節レベル見出し（`<h2>`）と管理画面の除外列（`<th>`）が残っていないことを見る。Excel由来本文には規約が掛からないので検査対象外（Excel設計書自身の「概要」見出し等を違反にしない）。
- 不合格時はシート名・セル位置・該当テキスト・残存見出しを出し、人間が修正対象を特定できるようにする。

## 5. 実装（定義箇所の一覧）

| 対象 | 定義 | ファイル |
|---|---|---|
| 取り消し線 | `RENDER_STRUCK_TEXT` / `apply_strike_exclusion()` / `_shape_text()` | `excel_to_html/convert.py` |
| 図形テキスト全件表 | `RENDER_SHAPE_TEXT_SECTION` | `excel_to_html/convert.py` |
| 番号pin対応台帳 | `RENDER_PIN_LEDGER_SECTION` / `pin_ledger_entries()` / `write_pin_ledger_rows()` | `excel_to_html/convert.py` |
| 実装差分追補 | `RENDER_ENDPOINT_SUPPLEMENT` | `.cursor/skills/endpoint-supplement/scripts/build_endpoint_supplement.py` |
| Markdown由来の定型小見出し | `BOILERPLATE_SUBSECTION_TITLES` / `is_boilerplate_subsection()` | `.cursor/skills/function-spec-html-render/scripts/convert_function_spec_html.py` |
| Markdown由来の節（5分類） | `ALLOWED_SECTION_TITLES` / `SECTION_ALIASES` / `SECTION_ALIAS_PATTERNS` / `COMMON_SPEC_SECTION_TITLES` / `ARCHIVED_SECTION_TITLES` / `canonical_section_title()` | `.cursor/skills/function-spec-html-render/scripts/convert_function_spec_html.py` |
| Markdown正本の節統合・退避 | `map_to_five_sections()` / `map_gate()` / `functions/_archive/` | `.cursor/skills/function-spec-html-render/scripts/sync_markdown_exclusions.py` |
| 5分類の充足監査 | `audit_five_sections.py` | `.cursor/skills/reverse-design/scripts/audit_five_sections.py` |
| Markdown由来の列 | `ADMIN_ONLY_EXCLUDED_TABLE_COLUMNS` / `excluded_table_columns()` / `drop_excluded_columns()` | 同上 |
| 区分判定 | `function_kind()` | 同上 |
| カスタマイズ区分（レポート用途） | `customization_kind()` | 同上 |
| 共通仕様への集約 | `common_spec_titles()` ＋ `common_spec/common_spec_data.json` | 同上／[[common-spec]] |
| 検証 | `_excluded_section_headings()` / `_verify_pin_ledger_policy()` / `_verify_cells_independently()` ほか | `excel_to_html/verify.py` |
| 独立読み取り（検証専用） | `read_cell_facts()` / `CellFacts` | `excel_to_html/independent_cells.py` |

各フラグを `True` に戻せば、それぞれ従来どおりの出力に復帰する（復帰時の不変条件は各スキルに残してある）。
