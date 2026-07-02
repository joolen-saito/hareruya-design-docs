---
name: basic-design-doc
description: 要件定義から日本語の基本設計成果物マップを作成し、必要な基本設計ドキュメントの作成・更新を個別スキルへ振り分ける。画面、機能、API、DB、帳票、ログ、外部IF、機能間依存、正本/HTML整合性の影響範囲を棚卸しするときに使用する。
---

# 基本設計ドキュメント親スキル

## 役割

このスキルは基本設計全体の入口として使う。個別仕様書の詳細な記載ルールはこのスキルに持たせず、対象成果物に応じて個別スキルを使う。

- 要件から基本設計成果物マップを作成する。
- 作成・更新・参照・未作成・要確認の成果物を整理する。
- 画面、機能、API、DB、帳票、ログ、外部IF、機能間依存の影響範囲を棚卸しする。
- 個別仕様書の作成・更新は該当スキルへ委ねる。
- 成果物の分割単位、正本、設計書間の関連方針は `.cursor/design/基本設計方針.md` に従う。

## 使用する個別スキル

必要な成果物に応じて、次のスキルを併用する。

| 成果物 | 使用スキル | 主な責務 |
|---|---|---|
| アプリケーション基本設計書 | `application-basic-design-doc` | 全体構成、責務分担、横断方針、主要設計書への接続 |
| 機能仕様書 | `function-spec-doc` | 機能単位の判定条件、業務ロジック、状態・データ更新、例外処理 |
| 画面項目定義書、画面イメージ、画面一覧 | `screen-item-doc` | 画面単位の項目、バリデーション、アクション、番号ピン、画面一覧 |
| API設計 | `api-design-doc` | OpenAPI正本、エンドポイント、スキーマ、認可、エラー |
| DB設計 | `db-design-doc` | ER、スキーマ、テーブル定義、制約、ライフサイクル |
| 帳票設計 | `report-design-doc` | 帳票一覧、帳票別設計、項目、レイアウト、出力条件 |
| ログ設計 | `logging-design-doc` | 監査ログ、操作ログ、連携ログ、保存・閲覧・マスキング |
| 機能間依存 | `dependency-design-doc` | 依存元/依存先、呼出方式、影響範囲、リスク、検証方法 |
| 外部IF仕様 | `external-if-design-doc` | 外部システム連携、責任分界点、リトライ、障害時運用 |
| HTML閲覧版生成 | `doc-html-render` | Markdown/YAML/CSV正本から、内容を要約・再構成せず閲覧性の高いHTMLを作成 |
| 正本/HTML整合性 | `doc-parity-check` | Markdown/YAML/CSV正本とHTML閲覧版の欠落・混入チェック |

## 作業手順

1. 対象領域の最寄りの `AGENTS.md` と `README.md` を確認する。
2. `.cursor/design/README.md` と `.cursor/design/基本設計方針.md` を確認する。
3. `.cursor/docs/用語集.md` で画面名、項目名、状態名、メッセージを確認する。
4. 要件定義から作成する場合は、要件見出しを抽出する。
5. 要件見出しを、機能、画面、主要データ、API、帳票、ログ、外部IF、機能間依存へ割り当てる。
6. 設計成果物マップを作成し、作成・更新・参照・未作成・要確認を明示する。
7. ファイル作成前に、設計成果物マップと作成前確認表を提示し、利用者の確認を取る。
8. 確認後、対象成果物の個別スキルを使って作成・更新する。
9. Markdown正本とHTML閲覧版を両方扱う場合は、HTML作成・更新に `doc-html-render` を使い、最後に `doc-parity-check` の観点で欠落・混入を確認する。
10. ドキュメントを追加、移動、削除した場合は、関連READMEの更新要否を確認する。

## 設計成果物マップの形式

要件定義から基本設計を開始する場合は、先に次の形式で整理する。

```markdown
| 設計観点 | 分割単位 | 状態 | 出力先/参照先 | 根拠要件 | 使用スキル | 備考 |
|---|---|---|---|---|---|---|
| アプリケーション基本設計 | 全体 | 更新候補 | .cursor/design/ | TODO | application-basic-design-doc | 横断方針や責務分担に影響する場合に更新する |
| 機能仕様 | 機能別 | 作成 | .cursor/design/functions/TODO.md | TODO | function-spec-doc | 判定条件、状態・データ更新を整理する |
| 画面項目定義 | 画面別 | 作成 | .cursor/design/html/functions/TODO/ | TODO | screen-item-doc | 画面ごとの項目、アクションを整理する |
| API設計 | 全体 | 更新候補 | .cursor/design/API/openapi.yaml | TODO | api-design-doc | API契約の正本。詳細はOpenAPIで管理する |
| DB設計 | 全体管理、テーブル定義はテーブル別 | 更新候補 | .cursor/db/ | TODO | db-design-doc | ER・スキーマ方針は全体、テーブル定義はテーブル別 |
| 帳票設計 | 帳票別 | 更新候補 | .cursor/design/帳票/ | TODO | report-design-doc | 帳票一覧と帳票別設計を分ける |
| ログ設計 | 全体 | 参照/更新候補 | .cursor/design/アーキテクチャ/ロギング/ | TODO | logging-design-doc | 監査ログ要件の接続点を整理する |
| 外部IF仕様 | 外部連携単位または全体 | 更新候補 | .cursor/design/API/外部インターフェース仕様書/ | TODO | external-if-design-doc | 外部連携の責任分界点と障害時運用を整理する |
| 機能間依存 | 全体 | 更新候補 | .cursor/design/機能間依存関係定義書.md | TODO | dependency-design-doc | 依存先機能と影響範囲を整理する |
| HTML閲覧版 | 正本ファイル別 | 作成/更新候補 | Markdown正本に対応するHTML | TODO | doc-html-render | 要約・再構成せず、目次やレイアウトで閲覧性を高める |
| 正本/HTML整合性 | ファイル組み合わせ別 | 確認 | Markdown正本とHTML閲覧版 | TODO | doc-parity-check | 欠落・混入・表不一致を確認する |
```

状態の使い分け:

- `作成`: この作業で新規作成する。
- `更新`: この作業で既存文書を更新する。
- `参照`: 既存文書を正本として参照する。
- `更新候補`: 影響はあるが、この作業で更新するか利用者確認が必要。
- `未作成`: 必要だが正本がまだ存在しない。
- `要確認`: 要件または設計方針が未確定で判断できない。
- `確認`: 作成・更新後に整合性チェックを行う。

## 作成前確認の形式

```markdown
以下の対応で設計書を作成・更新してよいですか？

| 作成/更新対象 | 種別 | 分割単位 | 対応する要件見出し | 出力先 | 使用スキル | 備考 |
|---|---|---|---|---|---|---|
| TODO画面 | 画面項目定義書 | 画面別 | TODO | .cursor/design/html/functions/TODO/TODO_画面項目定義.md | screen-item-doc | TODO |
| TODO機能群 | 機能仕様書 | 機能別 | TODO | .cursor/design/functions/TODO.md / .cursor/design/html/functions/TODO.html | function-spec-doc | TODO |
| TODO API | API設計 | 全体 | TODO | .cursor/design/API/openapi.yaml | api-design-doc | 更新候補 |
| TODOデータ | DB設計 | 全体管理、テーブル定義はテーブル別 | TODO | .cursor/db/ | db-design-doc | 更新候補 |
```

## 注意

- 個別仕様書の列定義、テンプレート、HTMLルールなどは個別スキルに置く。
- このスキル内で個別仕様書の詳細ルールを増やさない。
- 不明点は `TODO（未確定項目）` に集約し、業務ルール、権限、バリデーション、永続化仕様、API契約、DB物理定義を推測で確定しない。
