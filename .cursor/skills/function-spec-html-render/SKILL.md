---
name: function-spec-html-render
description: 機能仕様書Markdownを、内容を変更せずHTML閲覧版へ変換する。functions/todo-list.mdの機能No・区分・分類に基づくファイル名を正とし、単体プレビュー生成やExcel由来HTMLの該当シート末尾への追記統合を行うときに使用する。
---

# 機能仕様書HTML変換スキル

## 目的

`functions/**/*.md` の機能仕様書を、人がブラウザで読みやすいHTML閲覧版へ変換する。HTMLは派生成果物であり、仕様の正本はMarkdownとする。単体プレビューを生成する場合と、Excel由来HTMLの該当画面シート末尾へMarkdown本文を追記統合する場合の両方で使用する。

## 原則

- Markdown正本の文言、順序、見出し、表、箇条書き、コード、注記を変更しない。
- Markdown正本の内容は、`functions/todo-list.md` のカスタマイズ区分（標準／現行踏襲／カスタマイズ／新規実装）に応じた参照リポに基づく（標準＝ec-cube-enterprise、現行踏襲・カスタマイズ＝現行リポ pf-eccube3／pf-api／ec-cube ＋ ec-cube-enterprise で移行後の扱いを確認 ＋ 該当基本設計仕様書、新規実装＝基本設計仕様書を正）。詳細は `reverse-design` スキルの手順 1a を正とする。本スキルはこの前提で作られたMarkdownをHTML化する派生工程であり、HTML側で正典を変えない。
- Markdown正本とExcel基本設計仕様書に同一機能・同一仕様の内容が重複して書かれている場合、Excel基本設計仕様書を正とする。統合HTML上のMarkdown由来ブロックはExcel由来本文を上書きしない。食い違いを見つけた場合はHTMLだけで調整せず、Markdown正本をExcelに合わせて更新するか、差分を移行後の扱い・実装確認値として分離してから再変換する。
- HTML側だけに要約、補足、推測、仕様説明を追加しない。
- 機能仕様書内に混在する画面項目定義TSVは、同じ位置にHTML表として表示する。
- 外部の画面項目定義Markdownが存在する場合は、`--screen-source` で指定し、機能仕様書HTMLの末尾に同一ファイル内セクションとして統合する。
- 画面項目定義が存在しない場合は、`--screen-source` を付けずに機能仕様書単独HTMLを生成する。
- 既存HTMLを上書きする前に、原則としてプレビューHTMLを生成して品質確認する。
- Markdown正本は変更しない。既存Excel HTMLへ関連Markdownを追記する必要がある場合だけ、HTML派生成果物への後段処理として対象画面シートの末尾へ追記する。
- 統合先は `functions/todo-list.md` の機能No、区分、分類、機能名、Markdownリンクを基準に特定し、別タブや統合一覧ページは追加しない。
- Markdownファイル名は `todo-list.md` の機能No・区分・分類・機能名に対応する命名を正とする。例: `F06-03 / フロント / 会員 / ログイン` は `f06-03_front_member_customer_login.md` のように機能No接頭辞を含める。
- 複数機能で同一Markdownを共有する場合は、無理に分割せず、統合時のマーカーキーに機能Noを含めてシートごとに衝突を避ける。

## 実行

同梱スクリプトを使う。

```bash
python3 .cursor/skills/function-spec-html-render/scripts/convert_function_spec_html.py \
  --source functions/ec-cube-enterprise/m01-01_admin_login_login.md \
  --output function_spec_html_preview/ec-cube-enterprise/m01-01_admin_login_login.html
```

外部の画面項目定義Markdownを同一HTMLに統合する場合:

```bash
python3 .cursor/skills/function-spec-html-render/scripts/convert_function_spec_html.py \
  --source functions/<区分>/<機能仕様書>.md \
  --screen-source functions/<区分>/<画面項目定義>.md \
  --output function_spec_html_preview/<区分>/<機能仕様書>.html
```

複数ファイルを変換する場合も、まず1ファイルで出力品質を確認してから対象を広げる。

### 既存Excel HTMLへの追記統合

Excel変換HTMLへ機能仕様書Markdownを追記する場合は、`functions/todo-list.md` のMarkdownリンクを入力として汎用統合スクリプトを実行する。追記先は該当する基本設計仕様書HTMLの対象シート末尾とし、Excel HTMLの別タブ化や `index.html` への統合一覧追加は行わない。Excel由来本文とMarkdown由来ブロックに同一仕様の重複がある場合、読解上の正はExcel由来本文であり、Markdown由来ブロックは補助情報として扱う。

```bash
python3 .cursor/skills/function-spec-html-render/scripts/integrate_function_docs_into_excel_html.py
```

このスクリプトは次を行う。

- `functions/todo-list.md` の `[md](...)` リンクを読む。
- 各Markdownの単体プレビューHTMLを `function_spec_html_preview/<区分>/<ファイル名>.html` に生成する。
- `excel_to_html/output/*.html` から機能No、機能名、シート見出しを読み、該当シート末尾へMarkdown本文を挿入する。
- 挿入範囲を `<!-- function-design-embed:start ... -->` / `<!-- function-design-embed:end ... -->` で囲み、再実行時は差し替えて重複させない。
- 見出しIDとブロックIDには `function-design-<機能No>-<Markdownファイル名>` 系の接頭辞を付けて衝突を避ける。
- 統合結果と未統合一覧を `functions/function-doc-excel-integration-report.md` に出力する。

追記後は次を確認する。

```bash
python3 .cursor/skills/function-spec-html-render/scripts/integrate_function_docs_into_excel_html.py
rg -c "<!-- function-design-embed:start" excel_to_html/output/*.html
cd excel_to_html && uv run python verify.py
```

未統合が残る場合は、Excel出力側に対応シートがない、または機能No・機能名だけでは安全に一意判定できないものとしてレポートに残す。無理に近いシートへ入れず、`todo-list.md`、Markdownファイル名、Excel側の機能No/機能名のどれを直すべきか確認してから再実行する。

## 画面項目定義TSVの扱い

- `識別ID`、`ラベル`、`書式・制限`、`必須`、`初期値`、`画面部品の説明` を含むタブ区切りヘッダを表開始として扱う。
- 外部画面項目定義Markdown内の ```csv fenced block は表として表示する。
- ヘッダ行やセル内に引用符付き改行がある場合は、CSV/TSVとして解釈してセル内改行を保持する。
- `ページ設定`、`レイアウト設定` など1セル相当の区分行は、表内の全列結合行として表示する。
- セル内の本文は文言を変えず、HTMLエスケープして改行を `<br>` として表示する。
- 表として検出できないタブ混じり本文は、本文としてそのまま表示する。

## 確認

- 変換前後でMarkdown正本に差分がないこと。
- HTMLに主要見出し、通常Markdown表、TSV画面項目表、コードブロックが反映されていること。
- TSV画面項目表が段落に潰れていないこと。
- 目次リンクが対象見出しへ遷移すること。
- 長い表が横スクロールできること。
