主張: `店頭受取受注管理/scenario_list.md:78` は、通常会員の取り置き案内が「注文日を含め7日間」と表示されるとする（LO-05）。
実際: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1247` の英語文言は「The item hold period is until %date%.」。`Shopping/index.twig:412` は日付を渡さず翻訳しているため、英語表示では期限が未置換のまま残る。
判定: 事実の誤り
修正案: 英語表示では期限が未置換になると記録し、LO-05 の確認対象に明示する。

主張: `店頭受取受注管理/legal_check.md:41,45` は LO-11 を取り置き案内の照合に限り、案内が出ない UOR-06 から除外する。
実際: `Shopping/index.twig:458,469-470` は店頭PCでも支払い案内を表示し、`messages.ja.yaml:1364` は期限を「7日後の15時まで」とする。一方、業務フロー `scenario_test/markdown/05_店頭受取受注管理.md:135` は商品引き渡し時に「スマレジにて決済を実施」と定める。
判定: 事実の欠落
修正案: LO-11 に支払い時期の案内と実際の決済時点の照合を加え、UOR-01・UOR-06 の両方で確かめる。
