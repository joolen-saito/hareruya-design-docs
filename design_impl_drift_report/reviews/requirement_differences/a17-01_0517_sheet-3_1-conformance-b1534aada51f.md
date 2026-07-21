# a17-01_0517_sheet-3_1 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a17-01_0517_sheet-3_1.json#a17-01_0517_sheet-3_1-conformance-b1534aada51f`
- 機能: A17-01 A17-01 検索クエリに一致する記事情報1件を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は公開プロパティをcamelCaseと明記するが、ArticleResponseBuilder はトップレベル・ネストとも snake_case キーで応答を生成している。

## 判定理由
設計は成功応答フィールドを articleId/wpPostId/wpTypeId/updateDate/createDate/cards/archetypes/decks/eventDetails の camelCase(HTML 1445-1446)、サンプル応答も camelCase(1452-1463)、副作用節で『プロパティはcamelCase、日時はISO8601とする』(1466)と明記。実装 ArticleResponseBuilder::build は 'article_id'/'wp_post_id'/'wp_type_id'/'update_date'/'create_date'/'event_details' と snake_case で配列を生成(37-46行)、ネストの buildCard 等も name_jp/card_details など snake_case。日時は formatDateTime('Y-m-d\TH:i:sP') で ISO8601 相当だが、プロパティ名の外部契約が設計の camelCase と一致しない。articleId/wpPostId/eventDetails での再検索でも単記事応答生成に該当は無く snake_case のみ確認。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:1466-1466` — 設計要求

```html
          <p>応答はJSON応答整形を経て返す。プロパティはcamelCase、日時はISO8601とする。</p>
```

## ec-cube-enterprise 実装
トップレベル応答が snake_case キー
`ec-cube-enterprise/src/Eccube/Service/App/Article/ArticleResponseBuilder.php:34-46` — 実装

```php
    public function build(DtbArticle $Article): array
    {
        return [
            'article_id' => $Article->getId(),
            'wp_post_id' => $Article->getWpPostId(),
            'wp_type_id' => $Article->getWpTypeId(),
            'url' => $Article->getUrl(),
            'update_date' => $this->formatDateTime($Article->getUpdateDate()),
            'create_date' => $this->formatDateTime($Article->getCreateDate()),
            'cards' => $this->buildCards($Article->getCards()),
            'archetypes' => $this->buildArchetypes($Article->getArchetypes()),
            'decks' => $this->buildDecks($Article->getDecks()),
            'event_details' => $this->buildEventDetails($Article->getEventDetails()),
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。設計は成功応答フィールドを camelCase(articleId/wpPostId/wpTypeId/updateDate/createDate/cards/archetypes/decks/eventDetails, HTML 1446表)、サンプル応答も camelCase(1452-1463)、副作用節で『プロパティはcamelCase』(1466)と明記。実装 ArticleResponseBuilder::build:36-46 は 'article_id'/'wp_post_id'/'wp_type_id'/'update_date'/'create_date'/'event_details' と snake_case 配列を返し、ネスト(name_jp/card_details/event_detail_id 等)も全て snake_case。(1)変換層の有無: Controller は $this->json($builder->build($Article)) と plain array を渡すのみ。CamelCaseToSnakeCase 等の name_converter 設定は config/src に存在せず(rg 該当なし)、Symfony の name converter はオブジェクト正規化にのみ作用し配列キーは無変換で透過するため JSON も snake_case のまま。(2)別実装: camelCase で articleId を返す別レスポンスビルダーは存在しない(rg 該当ゼロ)。設計要求の camelCase 外部契約と実装の snake_case が不一致。指摘は維持。
