# m05-02_admin_order_order_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 文字コード・区切り文字（設定）

`eccube.yaml` の確認値は次のとおり。環境で上書きされている場合は実環境の設定を正とする。

| キー | 確認値の例 | CSVへの影響 |
|------|-----------|-------------|
| `eccube_csv_export_separator` | `,` | 区切り文字 |
| `eccube_csv_export_encoding` | `UTF-8` | `fputcsv` 前の `mb_convert_encoding` の宛先。UTF-8のとき先頭にBOMを書く。 |
| `eccube_csv_export_date_format` | `Y-m-d H:i:s` | 日時列の文字列化 |
| `eccube_csv_export_multidata_separator` | `,` | 1セル内の複数値連結 |

---

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### 入出力: 永続化
更新しない。
