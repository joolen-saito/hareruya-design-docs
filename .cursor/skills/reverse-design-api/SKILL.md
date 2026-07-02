---
name: reverse-design-api
description: >-
  Generates or reviews behavior-first reverse-engineered detailed design documents (リバース詳細設計書) for JSON API endpoints. Use when the user asks to write, update, or review API design docs under functions/, or for A-prefixed API features in functions/todo-list.md, or mentions "API リバース設計書", "APIリバース詳細設計".
disable-model-invocation: true
---

# リバース詳細設計書（API・機能単位）

実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むための詳細設計を Markdown で作成・レビューする。Markdown を一次成果物とし、HTML閲覧版は `function_spec_html_preview/` または Excel 由来HTMLへの統合ブロックとして Markdown から生成する派生成果物とする。HTML を直接編集しない。

本スキルは画面（HTTP・Twig・フォーム）向けの [reverse-design](../reverse-design/SKILL.md) を JSON API 向けに特化したものである。リバース設計の参照リポ選択（手順 1a）、DB関連の正典（手順 1c）、思想・表現ルールは reverse-design と共通とし、対象を「ブラウザ画面を持たない JSON API エンドポイント」に置き換える。

機能の全体カタログは `functions/todo-list.md`（TODOリスト）を正典とする。設計書はこのリストの区分が API の機能（機能No が A で始まる行）に対応する。作成・更新したら同リストの該当行を更新する（手順12）。

## 正典

トーン・粒度・章立ては `functions/pf-api/a02-01_api_product_popup_product.md` を第一正典にする。一覧・件数・ページングを返す API では `functions/pf-api/a06-08_api_store_purchase_buying_products_search.md` も参照する。テンプレ本文は複製しない。

## 対象

- pf-api（記事・買取連携用 API）と deck-api（デッキビルダー用 API）。いずれも Symfony 4.4 + FOSRestBundle + firebase/php-jwt。
- 応答は JSON。ブラウザ向けの画面・Twig・フォーム送信を持たない。
- 呼び出し元は記事サイト、MTGバイヤーアプリ、デッキビルダーアプリ等のクライアント。

## 手順

1. スコープ — 冒頭で「本書で扱うこと / 扱わないこと」を分け、別 API・別機能に委ねる範囲を明示する。同種・旧版エンドポイント（例: `_old`）は別 API として切り離す。
1a. 参照リポの選択（カスタマイズ区分別） — `functions/todo-list.md` の当該 API 行の「カスタマイズ区分」列で参照リポを決める。標準は ec-cube-enterprise を正とする。現行踏襲・カスタマイズは現行 API リポ（`pf-api` / `deck-api`、または機能所在に応じた現行リポ）で現行挙動を確認し、ec-cube-enterprise で移行後の扱いを確認し、ソース外の画面・項目・業務条件は該当基本設計仕様書を正としてマージする。新規実装は基本設計仕様書を正とし、ec-cube-enterprise に実装がある場合だけ補助参照する。詳細は reverse-design 手順 1a を正とする。
1b. Excel基本設計とMarkdown正本の重複時優先 — `functions/**/*.md` と該当Excel基本設計仕様書に、同一API・同一仕様（リクエスト/レスポンス項目、型、必須、選択肢、件数、表示/業務条件、処理概要、エラー条件など）が重複して書かれている場合は、Excel基本設計仕様書を正とする。Markdown側の記述がExcelと食い違う場合は、HTML側でMarkdown記述を正として扱わず、Markdown正本をExcelに合わせて更新するか、差分を移行後の扱い・実装確認値として分離する。詳細は reverse-design 手順 1b-1 を正とする。
1c. DB関連の記述の正典 — 標準・現行踏襲・カスタマイズでは、永続化先のテーブル名・列名・型・制約・関連、DB更新、副作用、レスポンス項目がDB列に言及する箇所は ec-cube-enterprise を正とする。新規実装で ec-cube-enterprise に実装が無い場合は基本設計仕様書を正とし、推測でスキーマ化しない。詳細は reverse-design 手順 1c を正とする。
2. 入口 — 「利用者視点の入口」を唯一の入口節として書く。表は常に 3 列（入口・URLエンドポイント・期待されるふるまい）。各 URLエンドポイントに HTTP メソッドとサイトルートからのパスパターン（実装確認値）を載せる。ルート定義は `config/routes.yaml`（pf-api は `/admin/` プレフィックスや `.json` 別名がある。deck-api はサフィックスなし）を確認する。呼び出し元クライアントを各行または節末で一文で示す。Symfony のルート name・コントローラ型名の網羅は本文に置かず、grep 用なら「調査補助」へ隔離する。
3. 認証・認可 — API では「認証・認可」を必須節とする。実装の認証方式を確認値で書く。JWT 方式はカスタムヘッダ `jwt-token`・署名 HS256・ペイロード `aud`（利用者ID）で照合する（pf-api 管理系は管理者アカウント、deck-api は会員・プレイヤーを引く）。pf-api の管理ログインは EC-CUBE 管理画面のログイン確認へプロキシし、成功時にトークンを返す特殊形である。トークン原値・署名シークレット・パスワードは本文・例に書かない。認証しないと判定する条件と返す HTTP ステータス（多くは 401）を明示する。
4. 処理フロー — 取得・登録・更新・削除など入口ごとに番号付きで書き、入力受領→判定→データ取得・更新→応答までを利用者が追える形にする。
5. 集計・判定・計算 — 一覧・検索・件数を返す API では、対象データ、除外条件、結合、一意化、並び順、ページング（`per_page`・`total_count` 等）を実装から抽出する。該当しない参照系は「集計を行わない」と明示する。
6. データ整合性 — 応答が参照時点のデータであること、更新の有無、同時更新時の扱い、一覧と詳細の一致範囲を分けて書く。
7. 入出力（リクエスト・レスポンス）— 入出力は次のスキーマ情報とサンプルを必ず定義する。
   - リクエストスキーマ — 表でパラメータごとに、位置（パス／クエリ／ボディ）・型（string・integer・array 等）・必須／任意・説明（制約）を実装確認値で書く。入力が無い場合は「リクエストパラメータを持たない」と明示する。
   - レスポンススキーマ（成功）— 成功時の HTTP ステータス（多くは 200）と、応答フィールドごとに型・説明を表で書く。配列・ネストは要素・子フィールドの型まで示す。
   - レスポンス（失敗）— 400（入力不正・検証）・401（認証）・404（該当なし）・500（処理失敗）のうち該当を、条件と本文の形（例: `{code, message}` または `{code, errors: [...]}`）で対応づける。
   - サンプルレスポンス — 成功時の応答例を JSON コードフェンスで1つ示す。実値ではなく実装確認値に基づく代表値とし、トークン原値・パスワード等の秘匿値はプレースホルダ（例: `"<jwtToken>"`）にする。
   - 副作用とシリアライズ — DB 更新・キャッシュ・履歴・外部連携・通知の副作用を書く（参照のみは「なし」）。シリアライズ規約（FOSRest のビューハンドラ経由、`serialize_null` 有効、プロパティは概ね camelCase、日時は ISO8601）を一文で添える。
8. 副作用 — DB 更新、キャッシュ（Redis 等）、履歴・監査、外部連携の副作用をコードから追う。参照のみの API は「副作用なし」と明示する。
9. 下書き — [TEMPLATE.md](TEMPLATE.md) に沿う。「利用者視点の入口」で入口と実装パスが対応するように書く。無い章は削るか「本機能では扱わない」と一行。
10. セルフレビュー — [CHECKLIST.md](CHECKLIST.md) をすべて確認。
11. 保存 — 既定は `functions/<参照リポ>/<機能No小文字>_<機能識別子>.md`。`<参照リポ>` は 1a のカスタマイズ区分別ルールに従い、標準・新規実装は原則 `ec-cube-enterprise`、現行踏襲・カスタマイズは現行 API リポ（`pf-api` / `deck-api` 等）とする。ファイル名は `functions/todo-list.md` の機能Noを小文字化した接頭辞（例: `A15-01` → `a15-01_`）で始める。ユーザー指定パスがあっても、機能No接頭辞が無い場合は原則として接頭辞付き basename に揃える。
12. TODOリスト連携 — `functions/todo-list.md` で対象機能の行を機能名・機能内容で特定する。TODOリストは全機能の正典のため、該当行が無い、または複数候補があるときはユーザーに確認し、原則リスト外の設計書は作らない。特定した行で次の2点を更新する。TODO列のチェックボックスを `- [ ]` から `- [x]` にする。8列目「詳細設計書」に Markdown と HTML 両方への相対リンクを記入する。書式は `[md](<参照リポ>/<機能No小文字>_<機能識別子>.md) / [html](../function_spec_html_preview/<参照リポ>/<機能No小文字>_<機能識別子>.html)` とする（パスは `functions/todo-list.md` からの相対）。MarkdownとHTMLの basename は一致させる。
13. HTML生成 — `python3 .cursor/skills/function-spec-html-render/scripts/convert_function_spec_html.py --source functions/<参照リポ>/<機能No小文字>_<機能識別子>.md --output function_spec_html_preview/<参照リポ>/<機能No小文字>_<機能識別子>.html` を実行する。Excel 由来HTMLへ統合する場合は `python3 .cursor/skills/function-spec-html-render/scripts/integrate_function_docs_into_excel_html.py` を実行する。生成物は編集せず、変更は元の Markdown と todo-list.md 側に行い、必ずスクリプトで再生成する。

## 本スキルで扱わない章

画面向け reverse-design にある次の章は API では持たない。テンプレから除外する。

- フロント挙動（JS・Twig・モーダル・表示切替）
- 表示メッセージ（画面文言）
- 入力項目（5列フォーム表）
- 画面遷移
- Cookie・セッション（認証で必要な範囲は「認証・認可」に集約する）

## 表現ルール

reverse-design の表現ルールを継承する。要点は次のとおり。

- `〇〇され得る` のようなあいまい表現を避け、実装から確認できたふるまいは「する」「返す」「保存する」と断定する。条件付きは「A の場合は B する」と書く。
- 実装から確定できない内容は、推測でぼかさず「本書では仕様確定しない」「別 API の設計を正とする」「実装を確認値とする」に分ける。
- 本文・表（セル含む）・箇条書きで Markdown の太字（`**` や `__`）や HTML の strong を使わない。強調は見出し・表・箇条書きの構造で示す。
- 和文では語と語のあいだに読みやすさ目的の半角空白を入れない。インラインコード・英字・数字・記号トークンの直後に続く助詞・助動詞の直前にも入れない（例:「JSONを」「HTTPステータス」「`jwt-token`ヘッダで」）。コードフェンス内・URL・パス・カンマ区切りなど ASCII 構文に必要な空白はそのままとする。
- PHP のクラス名・例外クラス名・Doctrine エンティティ短名は本文・表では使わず、業務上の論理名で書く（例: アクセス拒否（HTTP 401）、会員、買取受注）。FOSRest のビューハンドラなどフレームワーク部品は「JSON応答整形」などと述べる。テーブル・列・設定キー・ルート name・JWT クレーム名（`aud` 等）は実装照合のためそのままよい。grep 専用は「調査補助」節に隔離する。
- トークン原値・署名シークレット（`auth_magic` 等）・パスワード・Cookie 値・セッションID完全値を本文・表・ログ例に書かない。

## 詳細ルール

ルーティング規約・認証パターン・レスポンス整形・バリデーション・章ごとの書き方は必要なときだけ [REFERENCE.md](REFERENCE.md) を開く。

## レビュー

既存の `functions/pf-api/*.md` と `functions/ec-cube-enterprise/a*.md` は [CHECKLIST.md](CHECKLIST.md) に照らし、rewrite 時は [TEMPLATE.md](TEMPLATE.md) に沿って提案する。「利用者視点の入口」が欠ける・パスが実装とずれる場合は実装から補う。認証・認可節が無い、または HTTP ステータスとエラー本文の対応が無い場合は実装から補う。
