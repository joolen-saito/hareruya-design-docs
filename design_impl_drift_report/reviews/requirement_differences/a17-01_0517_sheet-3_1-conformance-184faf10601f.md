# a17-01_0517_sheet-3_1 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a17-01_0517_sheet-3_1.json#a17-01_0517_sheet-3_1-conformance-184faf10601f`
- 機能: A17-01 A17-01 検索クエリに一致する記事情報1件を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
単記事取得が wpPostId のみで findOneBy しており、論理削除(deleted_at)済み記事を応答対象外にする条件が無い。

## 判定理由
設計はdtb_article.deleted_atによる論理削除で削除済みは応答対象外・wp_post_idを検索条件に用いる(HTML 1426/1475)と明記。実装はArticleController::getSingleArticleByParamsActionが $this->dtbArticleRepository->findOneBy(['wpPostId' => (int) $wpPostIdParam]) のみで取得し(58行)、deletedAt IS NULL 条件が無い。Gedmo SoftDeleteableFilter は doctrine.yaml で enabled: true だが、この filter は #[Gedmo\...SoftDeleteable] 注釈を持つエンティティ(Order/Shipping/MtbFormat 等)にのみ適用される。DtbArticle.php には Gedmo 注釈が無く(rg で該当ゼロ)、deleted_at は素の ORM\Column(50行)のため filter 対象外。DtbArticleRepository にも単記事取得メソッドや deletedAt 絞り込みは無い。ArticleResponseBuilder は取得済み Article をそのまま応答化するため、論理削除済み記事が返却され得る。設計要求の削除済み除外が実装されていない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:1475-1475` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td>記事（<code>dtb_article</code>）</td><td><code>id</code>・<code>wp_post_id</code>・<code>wp_type_id</code>・<code>url</code>・<code>update_date</code>・<code>create_date</code>・<code>deleted_at</code></td><td>取得条件・応答内容に使用する。<code>wp_post_id</code> を検索条件に用いる。<code>deleted_at</code> は論理削除で、応答対象外。</td></tr><tr><td>記事関連（<code>dtb_article_card</code>・<code>dtb_article_archetype</code>・<code>dtb_article_deck</code>・<code>dtb_article_event_detail</code>）</td><td>記事ID・関連先ID</td><td>応答の関連カード・アーキタイプ・デッキ・イベント詳細に用いる中間テーブル。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
削除済み除外条件のない単記事取得
`ec-cube-enterprise/src/Eccube/Controller/App/ArticleController.php:58-60` — 実装

```php
            $Article = $this->dtbArticleRepository->findOneBy(['wpPostId' => (int) $wpPostIdParam]);
            if ($Article === null) {
                throw new NotFoundException('記事が見つかりません');
```

DtbArticle は Gedmo SoftDeleteable 注釈を持たず SoftDeleteableFilter の対象外
`ec-cube-enterprise/src/Eccube/Entity/DtbArticle.php:25-50` — 実装(エンティティ)

```php
#[ORM\Table(name: 'dtb_article')]
#[ORM\HasLifecycleCallbacks]
#[ORM\Entity(repositoryClass: DtbArticleRepository::class)]
class DtbArticle extends AbstractEntity
{
    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '記事ID'])]
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    private int $id;

    #[ORM\Column(name: 'wp_post_id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => 'WPの投稿ID'])]
    private int $wpPostId;

    #[ORM\Column(name: 'wp_type_id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => 'WP種別ID'])]
    private int $wpTypeId;

    #[ORM\Column(name: 'url', type: Types::STRING, length: 64, nullable: true, options: ['comment' => 'URL'])]
    private ?string $url = null;

    #[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE)]
    private \DateTime $updateDate;

    #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE)]
    private \DateTime $createDate;

    #[ORM\Column(name: 'deleted_at', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
```

## 不在確認コマンド

- `rg -n 'Gedmo|SoftDelete' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbArticle.php`
- `rg -n 'deletedAt|deleted_at' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ArticleController.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbArticleRepository.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Article/ArticleResponseBuilder.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。設計(HTML 1426/1475)は dtb_article.deleted_at による論理削除で削除済みは応答対象外・wp_post_id を検索条件に用いると明記。実装 ArticleController::getSingleArticleByParamsAction:58 は findOneBy(['wpPostId' => (int)$wpPostIdParam]) のみで deletedAt IS NULL 条件なし。(1)別実装検索: article.json の単記事取得ルートは ArticleController の1本のみで別Controllerなし。DtbArticleRepository には単記事取得メソッドも deletedAt 絞り込みも存在しない(getRelatedArticles のみ)。(2)Gedmoフィルタ検証: doctrine.yaml で soft_deleteable(Gedmo\SoftDeleteableFilter)は enabled:true だが、このフィルタは #[Gedmo\SoftDeleteable] 注釈を持つエンティティにのみ適用。注釈済みは DtbProductRequest/Shipping/Order/DtbFormatBoard/MtbFormat のみで、DtbArticle.php は deleted_at が素の ORM\Column(50行)で Gedmo 注釈ゼロ(rg 確認)ため対象外。(3)手動絞り込みの慣行: 非Gedmoエンティティは DtbEventDetailRepository:425 等で明示的に ->andWhere('deletedAt IS NULL') を付与するのが本コードの慣行だが、DtbArticle 取得経路には一切なし。よって wp_post_id 一致の論理削除済み記事が返却され得る。指摘は維持。
