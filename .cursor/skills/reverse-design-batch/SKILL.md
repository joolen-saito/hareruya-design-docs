---
name: reverse-design-batch
description: >-
  Generates or reviews behavior-first reverse-engineered detailed design documents (リバース詳細設計書) for batch / console / cron jobs. Use when the user asks to write, update, or review batch design docs under functions/, or for B-prefixed batch features (or インフラ batches) in functions/todo-list.md, or mentions "バッチ リバース設計書", "バッチリバース詳細設計".
disable-model-invocation: true
---

# リバース詳細設計書（バッチ・機能単位）

実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むための詳細設計を Markdown で作成・レビューする。Markdown を一次成果物とし、HTML閲覧版は `function_spec_html_preview/` または Excel 由来HTMLへの統合ブロックとして Markdown から生成する派生成果物とする。HTML を直接編集しない。

本スキルは画面（HTTP・Twig・フォーム）向けの [reverse-design](../reverse-design/SKILL.md) を、コンソール／cron で起動するバッチ向けに特化したものである。リバース設計の参照リポ選択（手順 1a）、DB関連の正典（手順 1c）、思想・表現ルールは reverse-design と共通とし、対象を「ブラウザ画面を持たないバッチ処理」に置き換える。

機能の全体カタログは `functions/todo-list.md`（TODOリスト）を正典とする。設計書はこのリストの区分がバッチの機能（機能No が B で始まる行、またはインフラのバッチ行）に対応する。作成・更新したら同リストの該当行を更新する（手順12）。

## 正典

トーン・粒度・章立ては `functions/pf-eccube3/b05-01_batch_order_order_copy_order_number.md` を第一正典にする。集計バッチでは `functions/pf-eccube3/b08-05_batch_customer_customer_adjust_point_variance.md`、メール通知を伴うバッチでは `functions/pf-eccube3/b05-06_batch_order_order_check_duplicate_point.md` も参照する。テンプレ本文は複製しない。

## 対象

- pf-eccube3（EC-CUBE3系）HareruyaEc プラグインのバッチ（`Command/*Batch.php` がジョブ名→サービスを対応づける）。
- EC-CUBE Enterprise コアのコンソールコマンド（Symfony の `#[AsCommand]`）。
- インフラの cron／シェル（`dockerbuild/eccube/crontab`・`dockerbuild/eccube/file_sync_command.sh` の S3 同期など）。
- いずれもブラウザ向けの画面・Twig・フォーム送信を持たない。

## 手順

1. スコープ — 冒頭で「本書で扱うこと / 扱わないこと」を分け、別バッチ・運用設定に委ねる範囲を明示する。起動スケジュール自体は原則「運用・ジョブ設定を正とする」とし、実装で確認できる cron 式・ロック・タイムアウトのみ確認値で書く。
1a. 参照リポの選択（カスタマイズ区分別） — `functions/todo-list.md` の当該バッチ行の「カスタマイズ区分」列で参照リポを決める。標準は ec-cube-enterprise を正とする。現行踏襲・カスタマイズは現行リポ（`pf-eccube3` / `pf-api` / `ec-cube`、または機能所在に応じた現行リポ）で現行挙動を確認し、ec-cube-enterprise で移行後の扱いを確認し、ソース外の業務条件・出力項目・運用条件は該当基本設計仕様書を正としてマージする。新規実装は基本設計仕様書を正とし、ec-cube-enterprise に実装がある場合だけ補助参照する。詳細は reverse-design 手順 1a を正とする。
1b. Excel基本設計とMarkdown正本の重複時優先 — `functions/**/*.md` と該当Excel基本設計仕様書に、同一バッチ・同一仕様（起動条件、対象データ、抽出条件、出力項目、ファイル形式、件数、業務条件、処理概要、エラー条件など）が重複して書かれている場合は、Excel基本設計仕様書を正とする。Markdown側の記述がExcelと食い違う場合は、HTML側でMarkdown記述を正として扱わず、Markdown正本をExcelに合わせて更新するか、差分を移行後の扱い・実装確認値として分離する。詳細は reverse-design 手順 1b-1 を正とする。
1c. DB関連の記述の正典 — 標準・現行踏襲・カスタマイズでは、永続化先のテーブル名・列名・型・制約・関連、DB更新、副作用、生成ファイル項目がDB列に言及する箇所は ec-cube-enterprise を正とする。新規実装で ec-cube-enterprise に実装が無い場合は基本設計仕様書を正とし、推測でスキーマ化しない。詳細は reverse-design 手順 1c を正とする。
2. 入口 — 「利用者視点の入口」を唯一の入口節として書く。表は常に 3 列（入口・実行方法・期待されるふるまい）。実行方法は実装確認値で書く。
   - HareruyaEc: `bin/console <category>:batch <jobName> [args]`（例 `order:batch copyOrderNumber`。ジョブ名は `Command/*Batch.php` の対応表で照合）。
   - コア: `bin/console eccube:<name>`（例 `eccube:aggregate-sales`）。
   - cron／シェル: cron 式と起動スクリプト（例 毎分起動の同期スクリプト）。
   本機能は HTTP で届く画面を持たない旨と、コマンド名が一致しないときの挙動（処理せず終了等）を明示する。
3. 処理フロー — 実行起点ごとに番号付きで書き、対象抽出→判定→更新・生成・連携→終了までを追える形にする。対象が無い場合の早期終了も書く。
4. 業務ルール・計算 — 対象データ、抽出条件（未反映・期限超過など）、除外条件、集計単位、丸め、判定順序、画面・他処理との対応を実装から抽出する。
5. 集計条件 — 件数・合計・期間集計を行うバッチでは、対象データ、結合、除外条件、一意化、ステータス条件、集計期間（例 前日〜365日）を表で示す。該当しない場合は節を削除する。
6. データ整合性 — 多重実行・途中失敗・再実行・同時更新で値が一致する範囲と保証しない範囲を分けて書く。
7. API・バッチ結果 — 入力（引数・設定）、実行条件、成功結果、失敗結果、再実行時の扱いを記載する。外部連携（スマレジ等）を呼ぶ場合は連携の成功・失敗の扱いを書く。
8. 副作用 — DB 更新、ファイル生成（パス・形式）、外部連携、キャッシュ、通知メール、ログをコードから追う。冪等性（多重実行時の重複防止）と排他制御（ロックファイル等）を明示する。
9. 下書き — [TEMPLATE.md](TEMPLATE.md) に沿う。「利用者視点の入口」で入口と実装（コマンド・cron）が対応するように書く。無い章は削るか「本機能では扱わない」と一行。
10. セルフレビュー — [CHECKLIST.md](CHECKLIST.md) をすべて確認。
11. 保存 — 既定は `functions/<参照リポ>/<機能No小文字>_<機能識別子>.md`。`<参照リポ>` は 1a のカスタマイズ区分別ルールに従い、標準・新規実装は原則 `ec-cube-enterprise`、現行踏襲・カスタマイズは現行リポ（`pf-eccube3` / `pf-api` / `ec-cube` 等）とする。ファイル名は `functions/todo-list.md` の機能Noを小文字化した接頭辞（例: `B05-01` → `b05-01_`）で始める。ユーザー指定パスがあっても、機能No接頭辞が無い場合は原則として接頭辞付き basename に揃える。
12. TODOリスト連携 — `functions/todo-list.md` で対象機能の行を機能名・機能内容で特定する。TODOリストは全機能の正典のため、該当行が無い、または複数候補があるときはユーザーに確認し、原則リスト外の設計書は作らない。特定した行で次の2点を更新する。TODO列のチェックボックスを `- [ ]` から `- [x]` にする。8列目「詳細設計書」に Markdown と HTML 両方への相対リンクを記入する。書式は `[md](<参照リポ>/<機能No小文字>_<機能識別子>.md) / [html](../function_spec_html_preview/<参照リポ>/<機能No小文字>_<機能識別子>.html)` とする（パスは `functions/todo-list.md` からの相対）。MarkdownとHTMLの basename は一致させる。
13. HTML生成 — `python3 .cursor/skills/function-spec-html-render/scripts/convert_function_spec_html.py --source functions/<参照リポ>/<機能No小文字>_<機能識別子>.md --output function_spec_html_preview/<参照リポ>/<機能No小文字>_<機能識別子>.html` を実行する。Excel 由来HTMLへ統合する場合は `python3 .cursor/skills/function-spec-html-render/scripts/integrate_function_docs_into_excel_html.py` を実行する。生成物は編集せず、変更は元の Markdown と todo-list.md 側に行い、必ずスクリプトで再生成する。

## リポジトリ外インフラの扱い

WordPress ファイルの S3 への転送など、起動定義や処理がインフラ構成（デプロイ・CDK 等）にあり本リポジトリ群で確認できないバッチは、推測で書かない。確認できる成果物（crontab・シェルスクリプト等）があればそれを確認値とし、無い範囲は「本書では仕様確定しない（インフラ構成を正とする）」と明示する。該当行が実装不在のときはユーザーに確認する。

## 本スキルで扱わない章

画面向け reverse-design にある次の章はバッチでは持たない。テンプレから除外する。

- フロント挙動（JS・Twig・モーダル・表示切替）
- 表示メッセージ（画面文言）
- 入力項目（5列フォーム表）
- 画面遷移
- Cookie・セッション

## 表現ルール

reverse-design の表現ルールを継承する。要点は次のとおり。

- `〇〇され得る` のようなあいまい表現を避け、実装から確認できたふるまいは「する」「生成する」「保存する」「送信する」と断定する。条件付きは「A の場合は B する」と書く。
- 実装から確定できない内容は、推測でぼかさず「本書では仕様確定しない」「運用・ジョブ設定を正とする」「実装を確認値とする」に分ける。
- 本文・表（セル含む）・箇条書きで Markdown の太字（`**` や `__`）や HTML の strong を使わない。強調は見出し・表・箇条書きの構造で示す。
- 和文では語と語のあいだに読みやすさ目的の半角空白を入れない。インラインコード・英字・数字・記号トークンの直後に続く助詞・助動詞の直前にも入れない（例:「CSVを」「cron式で」「`order:batch`を実行する」）。コードフェンス内・URL・パス・カンマ区切りなど ASCII 構文に必要な空白はそのままとする。
- PHP のクラス名・例外クラス名・Doctrine エンティティ短名・サービス短名は本文・表では使わず、業務上の論理名で書く（例: 受注バッチ、スマレジ連携処理、注文番号テーブル）。コマンド名・ジョブ名・テーブル・列・設定キー・cron 式・生成ファイルパスは実装照合のためそのままよい。grep 専用は「調査補助」節に隔離する。
- パスワード・トークン原値・接続秘密値・Cookie 値を本文・表・ログ例に書かない。

## 詳細ルール

コマンド起動パターン・cron／シェル・冪等性・排他・通知・章ごとの書き方は必要なときだけ [REFERENCE.md](REFERENCE.md) を開く。

## レビュー

既存の `functions/pf-eccube3/b*.md` と `functions/ec-cube-enterprise/b*.md` は [CHECKLIST.md](CHECKLIST.md) に照らし、rewrite 時は [TEMPLATE.md](TEMPLATE.md) に沿って提案する。「利用者視点の入口」が欠ける・実行方法（コマンド名・cron）が実装とずれる場合は実装から補う。冪等性・再実行・排他・通知が抜けている場合は実装から補う。
