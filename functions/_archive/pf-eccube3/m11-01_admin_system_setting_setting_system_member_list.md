# m11-01_admin_system_setting_setting_system_member_list — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 用語

| 用語 | 説明 |
|------|------|
| メンバー | 管理画面へログインするアカウント。`dtb_member` に保存される。フロントの会員（顧客）とは別物である。 |
| 表示順 | `dtb_member.sort_no` によるメンバー一覧の表示順。一覧は `sort_no` の降順で並べ、値が大きい行が先頭に来る（DB列は ec-cube-enterprise を正とする。現行 pf-eccube3 は `rank`）。 |
| 稼働 | `mtb_work` のマスタ項目。ログイン可否の判定に利用される値がコアに定義されている。一覧ではマスタ名称を「稼働」列に表示する。 |
| 権限 | `mtb_authority` のマスタ項目。パス単位の拒否リストと組み合わせて管理画面のアクセスを制御する（詳細は権限管理機能を正とする）。一覧ではマスタ名称を「権限」列に表示する。 |
| 所属 | メンバーの所属。移行先では `dtb_member.department_id`（`mtb_department` 参照）のマスタ名称を「所属」列に表示する（現行 pf-eccube3 は `department` のテキスト値）。 |
| 削除 | `dtb_member` の対象行を物理削除し、削除対象より大きい `sort_no` の行を繰り下げる扱い。移行先は `del_flg` 列を持たない（現行 pf-eccube3 は `del_flg` を立てる論理削除。差は移行時の扱いを参照）。 |

---

## 参考

対象コードベース: pf-eccube3（パッケージ内 Constant に EC-CUBE 3.0.16 の記載）。一覧・削除・上へ・下へはコアの管理画面メンバーコントローラの実装を正とする。イベント定数名は `src/Eccube/Event/EccubeEvents.php` の `ADMIN_SETTING_SYSTEM_MEMBER_INDEX_INITIALIZE`、`ADMIN_SETTING_SYSTEM_MEMBER_DELETE_INITIALIZE`、`ADMIN_SETTING_SYSTEM_MEMBER_DELETE_COMPLETE` を参照する。登録・編集（新規・編集フォーム）の詳細は「メンバー管理」（M11-02）を正とする。

---

## DB関連（設計書からは非出力・2026-08-19）

<!-- 物理テーブル・列を列挙するDB関連の記述は、HTML設計書へ出力しない決定により
     本体Markdownから移した（ユーザー決定 2026-08-19）。内容はここに保持する。 -->

DB関連は ec-cube-enterprise の実装を正とする（SKILL 手順 1c）。下表は一覧・削除・順序変更に直接関係する列のみを記載する。

| テーブル | 列 | メモ |
|---------|-----|------|
| dtb_member | id | 主キー。自動採番。一覧の各行・操作リンクのID指定に用いる（移行先のPK列名は `id`。現行 pf-eccube3 は `member_id`）。 |
| dtb_member | name | 名前。「名前」列に表示する。 |
| dtb_member | department_id | 所属。`mtb_department` 外部キー。「所属」列にマスタ名称を表示する（現行 pf-eccube3 は `department` テキスト列）。 |
| dtb_member | authority_id | `mtb_authority` 外部キー。「権限」列にマスタ名称を表示する。 |
| dtb_member | work_id | `mtb_work` 外部キー。「稼働」列にマスタ名称を表示する。 |
| dtb_member | sort_no | 表示順。一覧は降順。削除時は削除対象より大きい表示順の行を繰り下げる。上へ・下へで隣接行と交換する（現行 pf-eccube3 は `rank`）。 |
| dtb_member | update_date | 更新日時。順序変更時に更新され得る確認値。 |
| mtb_department | id / name | 所属マスタ。一覧の「所属」列の表示名称を提供する。 |
| mtb_authority | id / name | 権限マスタ。一覧の「権限」列の表示名称を提供する。 |
| mtb_work | id / name | 稼働マスタ。一覧の「稼働」列の表示名称を提供する。 |

移行先の `dtb_member` には `del_flg` 列が無く、削除は物理削除である（現行 pf-eccube3 の `del_flg` 論理削除との差は「リニューアル移行時の扱い」を参照）。
