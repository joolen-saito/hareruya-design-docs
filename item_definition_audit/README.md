# item_definition_audit — 成果物の読み方

## ファイル

| ファイル | 行数 | 内容 |
|---|---|---|
| `REPORT.md` | — | **調査報告書**（結論・限界・自分のバグ記録）。まずこれ |
| `FINDINGS_DETAIL.md` | — | **全所見の明細**（1件ずつの表・file:line付き）。**中身を追うならこれ** |
| `item_definition_audit_scoped.tsv` | **682** | **監査対象のみ**（設計書に必須◯/△ or 最大文字数が書かれた行）。**通常はこちらを見る** |
| `item_definition_audit.tsv` | 4,655 | 全件台帳（対象外3,973件を含む）。`監査対象` 列で Y/N を判別 |
| `impl_app_db_conflicts.tsv` | 29 | アプリ⇔DB不整合（F1長さ超過**4件** ＋ F3長さ検証欠落**25件**）。**項目単位でないので別ファイル** |
| `impl_migration_risk.tsv` | 60 | MySQL→PostgreSQL 列縮小の全リスト（**真のリスク9件**の絞り込みは REPORT.md 3-7） |
| `*.py` | — | 再現用スクリプト（下記「再実行」参照） |

## `item_definition_audit.tsv` の列（30列）

### 監査対象フラグ
`監査対象` = `Y`(682件) / `N`(3,973件)
`Y` は設計書に **必須◯/△ または 最大文字数・最大値が書かれている行**。
`N` はボタン/リンク/ラベル等で仕様の指定が無く、照合すべき値が存在しない行（判定は `Z_対象外`）。
**選択系（セレクト/チェック/ラジオ）は601件中115件が `Y`**（うち必須◯が110件）— その必須は `NotBlank` で検証できるため。
リンク474件は必須0・最大値0で全件 `N`。

### HTML設計書の生データ
`書番` `シートID` `シート名` `識別ID` `ラベル` `書式・制限` `必須` `最大文字数または最大値` `初期値` `画面部品の説明`

**値はTSVとして安全にするため無害化してある**（原文そのままではない）:
改行 → ` / ` / タブ → 空白 / `"` → `”`。原文は `excel_to_html/output/*.html` を参照。
### 判定（全4,655行に必ず入る。3トラック＋1）
| 列 | 値 |
|---|---|
| `判定_最大文字数` | `A_一致` / `A2_HTML=ee` / `B_リニューアル変更` / `C_HTML=pf≠ee` / `C2` / `D_HTML孤立` / `D2_HTML≠ee` / `X_確定不能` / `S0_数値制約なし` / `S1_数値型(別トラック)` |
| `判定_必須` | `RA_一致` / `RD_不一致` / `R_条件付き(△)` / `RX_確定不能` |
| `判定_数値` | `NA_一致` / `ND1_設計値が入力不能` / `ND2_実装が緩い` / `NX_確定不能`（S1行のみ） |
| `判定_文言存在` | `E1_両系で確認` / `E2_eeのみ` / `E3_pfのみ` / `E4_未確認` |

### 実装側の値
| 列 | 意味 |
|---|---|
| `pf_Form上限` `ee_Form上限` | **入力できる上限**（`Assert\Length` の max）。**判定はこれで行う** |
| `pf_Form出典` `ee_Form出典` | `file:line`。実ファイルに逐語引用が存在することを機械検証済み |
| `pf_必須(NotBlank)` `ee_必須(NotBlank)` | `True`/`False` |
| `pf_DB列長` `ee_DB列長` | **保存先の容量**。入力上限**ではない**（`password`列はハッシュ保存領域） |
| `ee_数値実効上限` `ee_数値根拠` | 数値トラックの実効上限と定数名 |

### 未確定の説明
`未確定の理由_pf` `未確定の理由_ee` `備考` — なぜ確定できなかったかが全行に入る
（`found:false` の理由 / `attr_only(表示属性のみ)` / `GATE棄却` / `persists:false` 等）

## よく使う絞り込み

```bash
cd item_definition_audit

# 真の乖離候補だけ見る（D=22, D2=16）
awk -F'\t' 'NR==1 || $12 ~ /^D/' item_definition_audit_scoped.tsv | column -t -s$'\t' | less -S

# 設計値が入力できない項目（数値。ND1=9）
awk -F'\t' 'NR==1 || $14 ~ /^ND1/' item_definition_audit_scoped.tsv

# 方向の判断が要る項目（C=23, C2=1）
awk -F'\t' 'NR==1 || $12 ~ /^C/' item_definition_audit_scoped.tsv

# 必須の不一致（RD=88）
awk -F'\t' 'NR==1 || $13 ~ /^RD/' item_definition_audit_scoped.tsv

# 書番0209だけ
awk -F'\t' 'NR==1 || $2=="0209"' item_definition_audit_scoped.tsv

# 判定の集計（監査対象のみ）
cut -f12 item_definition_audit_scoped.tsv | tail -n +2 | sort | uniq -c | sort -rn

# 必須トラックの集計
cut -f13 item_definition_audit_scoped.tsv | tail -n +2 | sort | uniq -c | sort -rn
```

## この台帳で**わからない**こと（限界）

- **`X_確定不能` 50件 / `NX` 82件**は「乖離が無い」ではなく「**判定できなかった**」。
  静的解析では 親型・別名型・Form extension・`PRE_SET_DATA`/`POST_SUBMIT`・Controllerのイベントdispatch を追えない。
- **対象外3,973行**（`監査対象=N`）は設計書に必須・最大文字数の指定が無い行。照合すべき値が存在しない。
  `判定_文言存在` で文言の存在確認のみ行ったが、**「一致」は主張していない**
  （ヒットしない＝誤りではない。実装が翻訳キー/別表記の場合がある。
  実例: 「2段階認証」は ee に literal に無いが `TwoFactorAuthType` として実在する）。
- アプリ⇔DB整合を判定できたのは **443/3,135 form事実（14%）**。`data_class` でEntityを一意確定できた分のみ。
  → `impl_app_db_conflicts.tsv` の件数を「これで全部」と読んではいけない。

## ⚠ 既知の欠陥（未反映）

`extract.py` は `tds[:7]` の位置固定で列を読むが、実データは3〜11列が混在する。
26行が列ズレ・100行が無言ドロップしている（詳細は REPORT.md 冒頭の⚠）。
**修正版 `extract2.py`（ヘッダ駆動）と `classify_tables.py`（表種別分類）は作成済みだが、
本TSVには未反映。** 全パイプラインの再走が必要。

## 再実行

依存: `pf-eccube3` と `ec-cube-enterprise` が `../` に必要。

```bash
python3 extract.py       # 【旧】位置固定。バグあり
python3 extract2.py      # 【新】ヘッダ駆動。こちらを使うこと
python3 classify_tables.py  # 表の種類を分類（ITEM/ITEM_CHK/CSV/OTHER）
python3 factbase.py      # FormType事実（Assert\Length/NotBlank/config解決）
python3 dbfacts.py       # DB定義事実（pf dcm.yml / ee ORM\Column）
python3 gate.py          # 引用検証ゲートの自己テスト（真3件通過・捏造3件棄却）
python3 aggregate.py     # 三値分類（判定漏れ0を assert で機械保証）
python3 merge_db.py      # DB層の統合（値はパーサから引き直す）
python3 refine.py        # 数値トラック再判定・確定不能の削減
python3 appdb_strict.py  # アプリ⇔DB整合（F1/F3）
python3 migration_risk.py
python3 existence.py     # 文言存在スキャン
python3 export_tsv.py    # → item_definition_audit.tsv
```

`gate.py` を単体実行すると、捏造（存在しない値・存在しないファイル・行番号違い）を
全て棄却することを確認できる。
