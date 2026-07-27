#!/usr/bin/env python3
"""MESSAGE_LIST から**確定行だけ**を切り出した TSV を生成する（冪等・再現可能）。

## 「確定」の定義
`MESSAGE_LIST.tsv`（正本∖`EE-*`）から、次の**未確定行を除外**したもの。
除外理由は `MESSAGE_LIST_PENDING.tsv` に区分つきで出力する。

### 除外1: 判断待ち（ユーザー決裁が要る）
| ID | 内容 |
|---|---|
| `M09-08-MSG-002` | `CacheController.php:45` の `addFlash(..., '')` は空文字リテラルで表示文言なし。`not_shown` 除外に相当し、ID退役の要否が未決 |
| `M09-08-MSG-003` | 根拠が `CacheController.php:48` で `M09-08-MSG-001` と同一（重複）。ID退役の要否が未決 |
| `F06-04-MSG-003` | 出所は `/mypage/password_change` だが f06-04 は `/forgot` 系。f06-04 も f06-18 も当該パスを対象外と明記＝正本設計書が不在 |

### 除外2: 表示条件が文言候補を覆えていない
| ID | 内容 |
|---|---|
| `M04-23-MSG-007` | 文言は6候補併記だが、条件は1候補分しか書けていない。二次検証の提案（一般化）も個々の条件を失うため不採用 |
| `M04-23-MSG-014` | 同上（7候補） |

### 除外しないもの（＝確定に含める）
- **メタ是正提案を却下した行**のうち、却下後も**現行値が正しい**もの
  （`M04-13` のCSRF系13行＝現行「セッションの有効期限が切れているとき」が利用者視点で妥当、
   `M04-13-MSG-054`＝提案が条件を落とすため現行が正、
   CSV取込5行＝`fix_csv_import_conditions.py` で候補リストと1対1に合成済み）。
- **`check_evidence_anchor.py` の MISS 17行** — codex が keep 判定済みで現行根拠は妥当。
  MISS は検査側の限界（ベアファイル名の解決失敗・直書き文言の正規化差）によるもの。

出力:
  message_inventory/MESSAGE_LIST_CONFIRMED.tsv … 確定行のみ（列は MESSAGE_LIST と同一）
  message_inventory/MESSAGE_LIST_PENDING.tsv   … 除外行＋区分＋理由

使い方: python3 generate_confirmed_list.py
"""
from __future__ import annotations

import csv

import lib_messages as L

ROOT = L.DOC_ROOT / "message_inventory"
SRC = ROOT / "MESSAGE_LIST.tsv"
OUT_OK = ROOT / "MESSAGE_LIST_CONFIRMED.tsv"
OUT_NG = ROOT / "MESSAGE_LIST_PENDING.tsv"

PENDING: dict[str, tuple[str, str]] = {
    "M09-08-MSG-002": ("判断待ち",
                       "addFlash(..., '') は空文字リテラルで表示文言なし。not_shown 除外に相当し ID退役の要否が未決"),
    "M09-08-MSG-003": ("判断待ち",
                       "根拠が CacheController.php:48 で M09-08-MSG-001 と同一（重複）。ID退役の要否が未決"),
    "F06-04-MSG-003": ("判断待ち",
                       "出所は /mypage/password_change だが f06-04 は /forgot 系。f06-04・f06-18 とも対象外と明記＝正本設計書が不在"),
    "M04-23-MSG-007": ("未確定(表示条件)",
                       "文言は6候補併記だが条件は1候補分のみ。二次検証の提案も個々の条件を失うため不採用"),
    "M04-23-MSG-014": ("未確定(表示条件)",
                       "文言は7候補併記だが条件は1候補分のみ。二次検証の提案も個々の条件を失うため不採用"),
}


def main() -> None:
    with open(SRC, encoding="utf-8", newline="") as fh:
        rows = list(csv.reader(fh, delimiter="\t"))
    header, body = rows[0], rows[1:]

    ok = [r for r in body if r[0] not in PENDING]
    ng = [r for r in body if r[0] in PENDING]

    with open(OUT_OK, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, delimiter="\t", quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n")
        w.writerow(header)
        w.writerows(ok)

    with open(OUT_NG, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, delimiter="\t", quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n")
        w.writerow(["区分", "除外理由", *header])
        for r in ng:
            kind, why = PENDING[r[0]]
            w.writerow([kind, why, *r])

    fids = len({r[1] for r in ok})
    print(f"確定 {len(ok)}件 / {fids}機能 → {OUT_OK.name}")
    print(f"除外 {len(ng)}件 → {OUT_NG.name}")
    for r in ng:
        print(f"  [{PENDING[r[0]][0]}] {r[0]}  {r[5][:40]}")


if __name__ == "__main__":
    main()
