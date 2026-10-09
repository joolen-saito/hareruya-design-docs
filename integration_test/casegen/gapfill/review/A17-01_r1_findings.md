### 指摘（A17-01 / IT-A17-01-012）
- 主張: `cardtypes`・`subtypes`・`colors`・`card_formats`・`color_sequence`について、カード直下に項目が存在することだけを期待している。
- 実際: `0517_sheet-3` L0069-L0097 は各配列要素の `id`・`name_jp`・`name_en` 等を、L0178-L0189 は `card_formats` の `id`・`format_id`・`restriction_id` と `color_sequence` の `id`・`name`・`rank` を具体的に示している。
- 判定: 抜けを確かめていない
- 修正案: 各入れ子要素の項目構成とシード値を期待結果に追加する。直下の項目存在だけでは、空配列や要素構造の欠落を検出できない。

### 指摘（A17-01 / IT-A17-01-014）
- 主張: デッキ内の `format` について「formatのnameが『A1701-014-フォーマット』」と期待している。
- 実際: `0517_sheet-3` L0253-L0257 の `format` は `id`・`name_jp`・`name_en`・`code` を持ち、`name` という項目は定められていない。
- 判定: 期待結果の誤り
- 修正案: `name` を `name_jp` と `name_en` に直し、それぞれ事前準備の日本語名・英語名と照合する。
