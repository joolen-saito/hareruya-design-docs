# R2 の指摘の扱い（codex・法令の確認項目の追加）

指摘2件（事実の誤り1・事実の欠落1）。正本を自分で開いて確かめた。

| # | 指摘 | 確認 | 扱い | 直したところ |
|---|---|---|---|---|
| 1 | 英語表示の取り置き案内は日付が未置換のまま出る（LO-05 の記述が日本語の「7日間」だけ） | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml` 1247行「The item hold period is until %date%. Orders will be automatically cancelled after this date.」。`Shopping/index.en.twig` 415行 `{{ 'front.shopping.otc_notice.li2'|trans }}` は日付を渡さない（指摘の `index.twig` 412行は日本語版で、英語版は index.en.twig 415行）。日本語は ja.yaml 1411行「注文日を含め7日間」で日付を持たない | 採用 | `店頭受取受注管理/legal_check.md` LO-11 に、英語表示で日付が置き換わらないかの確認を追加。`scenario_list.md` の食い違いに7として追記（新実装の食い違い。設計書に取り置き案内の文言が無いので期待値は作らない） |
| 2 | LO-11 が取り置き案内の照合に限られ、案内が出ない UOR-06 から外れている。支払い時期の案内と実際の決済時点の照合が欠けている | `Shopping/index.twig` 458行（お支払いについてのモーダルのボタン）・469〜470行（支払い時期の本文）に店頭受取系の条件が無い。ja.yaml 1364行「ご注文いただいた日から起算して7日後の15時まで」。`scenario_test/markdown/05_店頭受取受注管理.md` 135行 4-12「商品引き渡し時 スマレジにて決済を実施」 | 採用 | LO-11 に支払い時期の案内と実際の決済時点（店頭受取は受け取りのとき、スムーズ店頭受取は注文のとき、店頭PCは受け取りのとき）の照合を追加し、対象を UOR-01・06 に変更。UOR-06 の確認項目を12件から13件にし、`legal_check.md` の件数の記述と `scenario_list.md` の L3・表の扱い欄を直した。食い違いに8として追記 |

## 結果

採用2・一部採用0・却下0。確認項目の数：通販は UTS-01 が13件・UTS-04 が14件（変わらず）、店頭受取は UOR-01 が13件・UOR-06 が13件（12件から1件増）。
