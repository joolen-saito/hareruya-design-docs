# FP規模とIPA基準による結合テスト規模の算定

ee リポジトリ（`/home/y-saito/Developments/ec-cube-enterprise`）の規模をファンクションポイントで測り、
IPA『ソフトウェア開発分析データ集2022』の基準値から結合テストの規模（テストケース数・検出バグ数）を導く。

全量結果は `FP_AND_TEST_SCALE.md`、パッケージ標準からの差分と採用テスト規模は
`PACKAGE_STANDARD_DELTA.md` を参照。本ファイルは方法と再現手順のみを書く。

## 前提（依頼者確定）

| 項目 | 確定内容 |
| --- | --- |
| FP算定のスコープ | ee 全体（EC-CUBE本体＋ハレルヤ独自）。結合テスト対象377機能に対応する全機能を含む |
| FP算定手法 | 概算FP法（IFPUG未調整FP・全項目を平均複雑度）＋ バックファイア法による検算 |
| 実績値との突合 | 行わない。基準値からの見積のみを出す |

## 手順

### 1. ルート実体の採取（ee リポジトリ側）

FPのトランザクション型ファンクションは、静的なソース検索ではなく Symfony ルータの実出力から数える。
プラグインの有効/無効やルーティング設定を反映した実体が必要なため。

```
cd /home/y-saito/Developments/ec-cube-enterprise
# .env に無い環境変数はダミー値で足りる（ルータのダンプに実接続は不要）
AWS_REGION=ap-northeast-1 AWS_DEFAULT_REGION=ap-northeast-1 \
  php bin/console debug:router --format=json > <本ディレクトリ>/data/routes.json
```

`Environment variable not found: "X"` で落ちる場合は `X=dummy` を足して再実行する。
採取時の ee リビジョンを `FP_AND_TEST_SCALE.md` に記録すること。

### 2. 算定の実行

```
python3 fp_scale/build_fp.py     # EE_ROOT 環境変数で ee のパスを上書きできる
```

## 数え方の定義

### トランザクション型ファンクション（EI / EO / EQ）

**1コントローラアクション（`クラス::メソッド`）= 1基本機能プロセス** として数える。
同一アクションに張られた複数ルート（ページング等）は同じ基本機能プロセスとみなす。

分類は下記のルールを上から評価し、最初に当たったもので確定する。判定根拠は
`out/fp_transactions.tsv` に1件ずつ残るので、機械判定の妥当性は行単位で検証できる。

| 順 | 条件 | 判定 | 理由 |
| --- | --- | --- | --- |
| 1 | ルート名・パスに `import` `upload` | EI | ee のCSV取込ルートは名称に `csv` を含むため、出力語より先に見ないと取込がEOへ誤分類される |
| 2 | `export` `download` `csv` `pdf` `print` `output` `invoice` `receipt` | EO | 加工・出力 |
| 3 | `new` `edit` `delete` `update` … の更新語 | EI | 内部論理ファイルの更新 |
| 4 | HTTPメソッドに POST/PUT/PATCH/DELETE | EI | 同上 |
| 5 | 上記以外 | EQ | 参照のみ |

除外するルート（`out/fp_excluded_routes.tsv`）は、`_` で始まるフレームワーク内部ルート、
WebProfiler、エラーコントローラ、リダイレクト/テンプレート専用コントローラ。

### データ型ファンクション（ILF / EIF）

- **ILF** = Doctrine Entity の `#[ORM\Table(name: ...)]` から採ったテーブル。
  `src/Eccube/Entity` / `app/Plugin` / `plugin_repos/SlnPayment42` を対象とし、
  `MappedSuperclass` を含むファイルは除く。**1テーブル = 1ILF** として数える。
- **EIF** = `data/eif_external_systems.tsv`。出典（設計書・シナリオレジスタのファイルパス）付きで列挙する。

### 重み

IFPUG の未調整ファンクションポイント。概算FP法のため全項目を「平均」複雑度で数え、
感度分析として全単純／全複雑も併記する。

| 前提 | EI | EO | EQ | ILF | EIF |
| --- | --- | --- | --- | --- | --- |
| 単純 | 3 | 4 | 3 | 7 | 5 |
| 平均（採用） | 4 | 5 | 4 | 10 | 7 |
| 複雑 | 6 | 7 | 6 | 15 | 10 |

調整係数（VAF）は掛けない。IPA基準値の層別定義が `5001_FP実績値(調整前)` であり、
調整前FPで揃える必要があるため。

### バックファイア法（検算）

QSM Function Point Languages Table 5.0 の SLOC/FP を使う。**同表に PHP と Twig の行は無い**ため、
QSM 自身の指針「表に無い言語は類似言語の gearing factor を代用してよい」に従い層ごとに代用する。

| 層 | 代用言語 | 理由 |
| --- | --- | --- |
| ロジック層(PHP) | J2EE / Java | サーバサイドのオブジェクト指向Webアプリ |
| 表現層(Twig) | HTML / ASP | テンプレート／マークアップ |
| クライアント層(JS) | JavaScript | 同一言語 |

SLOCは論理行の近似として NCLOC（空行とコメント行を除いた行数）で測る。
`vendor` `node_modules` `var` `tests` `e2e-tests` `codeception` `app/proxy`（生成物）は対象外。
`app/DoctrineMigrations` はマスタデータのINSERTが大半で機能量に対応しないため、参考値として別掲し主計測から外す。

## 既知の限界

すべて `FP_AND_TEST_SCALE.md` の「限界」節に明記する。要点のみ:

1. **EI と EQ の切り分けは信用できない。** ee の管理画面は検索フォームをPOSTで送るため、
   IFPUG上はEQに当たる一覧検索がEIへ寄る。ただし平均複雑度では EI も EQ も重み4のため、**FP合計には影響しない。**
2. **1テーブル=1ILF は過大側に振れる。** IFPUG のILFは利用者から見た論理グループであり、
   親子テーブルは1ILFに束ねるのが本来。実測の242テーブルをそのまま数えているため、ILF由来のFPは上限側。
3. **AJAX用のヘルパールートも1基本機能プロセスとして数えている。** 利用者が認識する
   単位より細かいものが混じる一方、1画面内の複数の基本機能プロセスは取りこぼす。両方向の誤差がある。

## 出力ファイル

| ファイル | 内容 |
| --- | --- |
| `out/fp_transactions.tsv` | 基本機能プロセス1件ごとのEI/EO/EQ判定と判定根拠 |
| `out/fp_excluded_routes.tsv` | 母数から外したルートと理由 |
| `out/fp_files.tsv` | ILF（テーブル）とEIF（外部システム）の一覧と根拠 |
| `out/fp_summary.tsv` | FP種別×複雑度前提の集計 |
| `out/fp_by_area.tsv` | 領域（管理画面/フロント/API/…）別のFP内訳 |
| `out/sloc.tsv` | 層別のNCLOC実測 |
| `out/backfire.tsv` | バックファイア法によるFP検算 |
| `out/test_scale.tsv` | IPA基準値を当てた結合テスト／総合テストの導出値 |
| `out/package_delta.tsv` | パッケージ標準・現行・純増のFP比較 |

## 出典

- IPA『ソフトウェア開発分析データ集2022』（2022年9月26日公開、5,546プロジェクト）
  表5-1-1（p.57）／表5-2-1（p.69）／表5-2-2（p.72）／表5-2-3（p.74）／表5-2-4（p.76）
  <https://www.ipa.go.jp/digital/software-survey/metrics/metrics2022.html>
  値は `data/ipa_2022_benchmark.tsv` に転記済み（PDF本文からの機械抽出）
- QSM Function Point Languages Table 5.0（2,192プロジェクト）
  <https://www.qsm.com/resources/function-point-languages-table>
  値は `data/qsm_gearing.tsv` に転記済み
