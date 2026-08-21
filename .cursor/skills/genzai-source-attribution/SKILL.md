---
name: genzai-source-attribution
description: 現行踏襲・カスタマイズ機能の仕様を具体化する際に「どの現行ソースリポジトリを読むか」を決める帰属台帳を作る。参照元の割り当て、要判定・TBD機能の確認、新実装(ec-cube-enterprise)由来の記述の検出に使用する。仕様具体化(Stage 1)に着手する前段(Stage 0)。
---

# 現行ソース帰属スキル（Stage 0）

## 目的

現行踏襲(160)・カスタマイズ(157)＝**317機能**の設計書は、業務ルール（判定・計算式・丸め・ステータス・分岐）／
外部インターフェース／検索条件・既定値・ソート順・ページング単位／I/Oの確からしさが具体値まで書かれていない。
これを埋めるには現行ソースを読む必要があるが、**どのリポジトリを読むかが機能ごとに違う**。
その割り当てを推測ではなく実在の一致で決め、判定できないものを明示するのがこのスキル。

## 参照元（絶対規則）

| 機能 | 参照元 | 実体 |
|---|---|---|
| 本店 | `pf-eccube3` | EC-CUBE 3.0.16 ＋ `app/Plugin/HareruyaEc/` |
| 支店 | `ec-cube` | EC-CUBE 4.2.3 ＋ `app/Customize/`・`app/config/eccube/packages/branch_config.yaml` |
| API | `pf-api` / `pf-article` | Symfony / WordPress |
| デッキビルダー | `deck-api` / `deck-builder` | Symfony / Next.js |

いずれも `/home/y-saito/Developments/` 直下。

**`ec-cube-enterprise` を参照元にしてはいけない。** 構築中の新実装なので、そこから引くと
「現行踏襲」の根拠が新実装の逆生成になり循環する。走査対象には含めるが、それは
「既存の設計書が新実装を見て書かれていないか」を検出するためだけで、帰属先には決して選ばない
（`verify` が参照元列に `ec-cube-enterprise` が入っていないことを検査する）。

## 判定のしかた

各設計書から機械抽出したアンカーを、各リポジトリで literal 検索して重み付けする。

| 種別 | 重み | 例 |
|---|---|---|
| `key` 翻訳キー | 3 | `admin.product_class.stock_minus` |
| `sym` クラス名 | 3 | `ProductStockRepository` |
| `path` URLパス | 3 | `/mypage/favorite/list` |
| `twig` テンプレート | 2 | `Product/detail.twig` |
| `msg` 画面文言 | 2 | `記事に紐付いているデッキがあるため削除できません。` |
| `snake` 識別子 | 1 | `order_number` |

- **識別力の割引**: n 本のリポジトリに共通で在る語は 1/n しか効かせない。4本以上に在る語は捨てる。
  `product_id` のような EC-CUBE 共通語彙で本店/支店を決めてはいけないため。
- **カスタマイズ領域ボーナス**: 晴れる屋独自コードの領域（`app/Plugin/HareruyaEc`・`app/Customize` 等）に
  当たった場合は2倍。本店(EC-CUBE 3系)と支店(EC-CUBE 4系)はコア語彙を共有するので、
  ここに当たったときだけが本当の決め手になる。全リポジトリに定義する（EC-CUBE系にだけ加点すると
  API/デッキ側が構造的に不利になる）。
- **判定**: 首位が次点の2倍以上かつ命名規則からの事前候補と一致し、得点が3以上 → `確定`。
  証拠が割れる／事前候補と食い違う → `要判定`。識別力のあるアンカーが1本も当たらない → `根拠なし(TBD)`。
- 判定できないものは **TBD に倒す**。誤った帰属で調査が空振りする方が高くつく。

## ハーネス（実行）

```bash
S=.cursor/skills/genzai-source-attribution/scripts/build_source_attribution.py

python3 "$S" build    # 台帳を生成（約1秒）
python3 "$S" verify   # 再計算して現物と一致するか・参照元に新実装が混じっていないかを検査
```

生成物は `genzai_source_attribution/` 配下。

| ファイル | 中身 |
|---|---|
| `attribution.tsv` | 機能No単位の判定台帳。判定・参照元・リポジトリ別スコア・ee固有スコア・根拠 |
| `anchors.tsv` | 判定の証跡。アンカー1本ごとに種別・重み・識別力・一致したリポジトリ |
| `ATTRIBUTION_SUMMARY.md` | 内訳と、要判定/TBD の全件リスト |

**rg は逐次実行する。** 並列に走らせると取りこぼしが起きて台帳が再現しない
（実測: 同一入力で ec-cube のカスタマイズ領域一致が 392 → 355 に揺れた）。
rg がファイル単位の警告を stderr に出した場合も、黙って取りこぼさないよう失敗させている。

## 完了条件

- `verify` が OK（台帳が再現し、参照元に `ec-cube-enterprise` を含まない）。
- `要判定`・`根拠なし(TBD)` が理由付きで全件一覧できる。これらを人手で確定させるまで Stage 1（仕様具体化）に進まない。

関連: [[reverse-design]]（章立て）／[[output-exclusion-policy]]（出力除外規約）。
