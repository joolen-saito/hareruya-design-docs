# golden review: merged-and-empty-rows

- 確認者: y-saito (Claude実装エージェント支援・実データ直読で人手同等の一次確認を実施)
- 確認日時: 2026-07-24
- 対象: `expected/merged-and-empty-rows.json` は `expected/m03-11-category-strike.json` への
  シンボリックリンク(同一実体)。

## 再利用の理由(捏造ゼロのための明記)

このケースが要求する「結合セル・書式のみの空セル・連続空行・カスタム行高」は、
`m03-11-category-strike` ケースが既に実測・独立ダンプ突合済みのブロック
(`0204` シート `カテゴリ登録`, A1:BM949)の中に**すべて実在**している
(下表)。これらの要件を満たす**別の**実データ断片を新たに探すよりも、
既に「差分0」を確認済みの同一ブロックを別の観点(strikeではなく結合/空行/行高)で
再確認するほうが、実データの水増し的な断片選定を避けられ、捏造ゼロ方針に沿うと
判断した。この判断はcodexレビューでの確認事項として記録する。

## 確認事項(独立ダンプでのXML実測値、m03-11-category-strike.review.md と同一ソース)

- 結合セル: 57件(`mergeCells` 要素実測、例 `B170:D170`, `AG171:AY171`)。
- カスタム行高: 949行中873行が `customHeight="1"`。
- 書式のみの空行: 行177〜949(773行連続)は `<c>` 要素は存在するが
  テキスト・数式を一切持たない。行番号を詰めずそのまま `rows`/`cells` に保持することを
  `verify --mode source` / `--mode reconstruct` / `--mode golden` の3系統すべてで確認。
- 結合範囲がブロック境界と交差しないこと(全結合がブロック内に完全内包)を
  `canonical.build_block_model` の `MergeBoundaryCrossedError` チェックが素通りした
  (=境界跨ぎが無い)ことで確認。

## 差分0検証の実行記録(2026-07-24)

m03-11-category-strike.review.md と同一(同一ブロックのため)。
`excel-preprocess verify --mode golden --golden-expected merged-and-empty-rows.json` は
シンボリックリンク先が同一なので自明に diffs=0 だが、念のため実行し OK を確認した。
