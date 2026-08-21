# m05-05_admin_order_order_shipping_custom_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 文字コード・区切り・ファイル名（確認値）

アプリケーション設定 `eccube.yaml` 展開に、次の既定がある（環境で上書きされうる）。

| 設定キー | 既定の確認例 |
|----------|----------------|
| `eccube_csv_export_separator` | カンマ |
| `eccube_csv_export_encoding` | UTF-8 |
| `eccube_csv_export_date_format` | `Y-m-d H:i:s` |
| `eccube_csv_export_multidata_separator` | カンマ |

エンコーディングが UTF-8 のとき、先頭にBOMを付与する。ファイル名は `shipping_` + `YmdHis` + `.csv` である。

---

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### 入出力: 永続化
更新しない。
