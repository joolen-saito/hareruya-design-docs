# m05-08_admin_order_order_stack_paper_print — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## スタック用紙印字データ組み立て時の判定

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | `stack_paper_judgment_price` の文字列が `"0"` か | `"0"` なら明細価格の最大を使うサブクエリを採用。それ以外なら商品規格の買取価格の最大を使うサブクエリを採用 |
| 2 | 閾値 `(int) stack_paper_threshold_price` と `op.price` を比較する | 現行の `CASE` 式では閾値以上・未満にかかわらず印字列 `expensive` は同じ空欄装飾文字（実装では「□」）になる |

---
