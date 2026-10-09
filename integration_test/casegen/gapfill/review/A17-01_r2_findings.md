### 指摘（A17-01 / IT-A17-01-012）
- 主張: `card_details`について「rarity・cardset・illustrator・promotion・card_imagesを持つ」、`card_images`ではURLだけを確認してG2319を埋めている。
- 実際: `0517_sheet-3` L0098-L0175は、`card_details`直下の識別子・各参照ID・テキスト・カード番号・フラグ・日時・`card_layout`に加え、`rarity`・`cardset`・`illustrator`・`promotion`・`card_images[].language`の各項目構成まで示している。
- 判定: 抜けを確かめていない
- 修正案: G2319をケース化するなら、現在は存在確認だけの入れ子についても、設計書に示された要素構造を期待結果へ追加する。

### 指摘（A17-01 / IT-A17-01-013）
- 主張: アーキタイプの`format`は、名称・コードとメイン／サイド枚数の8項目を持つことだけを確認している。
- 実際: `0517_sheet-3` L0205-L0226の`format`には、それらに加えて`certification_id`、`rule_jp`、`rule_en`、各種フラグ、`meta_range`、`rank`が示されている。
- 判定: 抜けを確かめていない
- 修正案: G2320の「入れ子のformatの項目構成」を確かめるため、未確認の項目も期待結果へ追加する。

### 指摘（A17-01 / IT-A17-01-014）
- 主張: 入れ子の`archetype`は`name_jp`、`deck_cards[].card`は`name_en`だけを照合してG2321を埋めている。
- 実際: `0517_sheet-3` L0277-L0312は`archetype`の識別子・名称・コメント・日時・旧ID・入れ子の`format`を、L0313-L0445は`deck_cards[].card`の名称・テキスト・カード詳細・フォーマット・色順等の構造を示している。
- 判定: 抜けを確かめていない
- 修正案: `archetype`と`deck_cards[].card`について、設計書に示された入れ子構造を期待結果へ追加する。

### 指摘（A17-01 / IT-A17-01-015）
- 主張: `event`は一部の直下項目と`formats`・`venue`・`rel`を持つこと、`venue`・`rel`の日本語名だけを確認している。
- 実際: `0517_sheet-3` L0475-L0531は、`event`の短縮名・バナーURL・更新／作成日時、`formats`要素の各項目、`venue`の英語名・都道府県・定員・住所、`rel.name_en`まで示している。
- 判定: 抜けを確かめていない
- 修正案: G2322の入れ子構造を確認できるよう、現在未確認の`event`・`formats`・`venue`・`rel`の項目を期待結果へ追加する。
