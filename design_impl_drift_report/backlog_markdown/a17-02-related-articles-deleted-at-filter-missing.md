/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：APIその他
機能：記事IDに関連する記事情報を取得
課題カテゴリ：実装違い
課題：関連記事取得で論理削除済みの記事が除外されない
設計書：0517_基本設計仕様書(API_その他).xlsx

# 再現手順【必須】
1. dtb_article に、同じ wp_type_id と関連中間テーブルを共有する記事を用意し、基準記事または関連記事側の deleted_at に日時を設定する
2. GET http://localhost:8080/article/related/{wpPostId} を実行する
3. deleted_at が設定された基準記事または関連記事が、関連記事検索の基準・レスポンス対象になるかを確認する

# 期待される挙動【必須】
- dtb_article.deleted_at が設定された記事は論理削除済みとして、基準記事にも関連記事レスポンスにも使用しない
- 基準記事は dtb_article.wp_post_id で特定し、deleted_at が NULL の記事だけを対象にする
- 関連記事側も deleted_at が NULL の記事だけを返す

# 現在の挙動【必須】
- ec-cube-enterprise では、`ArticleController::getRelatedArticlesAction` が `DtbArticleRepository::getRelatedArticles()` を呼び、同Repositoryは DBAL connection の raw SQL で `dtb_article a1` と `dtb_article a2` を直接参照している。SQLの WHERE は `a1.wp_post_id = :wpPostId`、`a2.wp_post_id <> a1.wp_post_id`、`a2.wp_post_id <> 0` と共有中間テーブルの EXISTS 条件で、`a1.deleted_at IS NULL` も `a2.deleted_at IS NULL` もない。raw SQL なので Doctrine SoftDeleteable filter による暗黙除外も効かず、論理削除済み記事が基準または関連記事に含まれ得る。

ec-cube-enterprise Controller は関連記事取得を DtbArticleRepository::getRelatedArticles に委譲する: `ec-cube-enterprise/src/Eccube/Controller/App/ArticleController.php:81-104`
```php
    #[Route('/article/related/{id}', name: 'article_related', methods: ['GET'])]
    public function getRelatedArticlesAction(string $id, Request $request): JsonResponse
    {
        try {
            if (!preg_match('/^\d+$/', $id) || (int) $id < 1) {
                throw new InvalidParameterException('idは正の整数である必要があります');
            }

            $limitParam = $request->query->get('limit', '');
            $limit = $this->eccubeConfig->get('eccube_article_related_api_default_limit');
            if ($limitParam !== '') {
                if (!is_numeric($limitParam) || (int) $limitParam != $limitParam || (int) $limitParam < 1) {
                    throw new InvalidParameterException('limitは正の整数である必要があります');
                }
                $limit = (int) $limitParam;
            }

            $relatedArticles = $this->dtbArticleRepository->getRelatedArticles((int) $id, $limit);

            if (empty($relatedArticles)) {
                throw new NotFoundException('関連記事が見つかりません');
            }

            return new JsonResponse($relatedArticles, 200);
```

ec-cube-enterprise Repository は raw SQL で dtb_article a1/a2 を参照するが deleted_at 条件がない: `ec-cube-enterprise/src/Eccube/Repository/DtbArticleRepository.php:40-80`
```php
    public function getRelatedArticles(int $wpPostId, int $limit): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = '
            SELECT
                a2.wp_post_id AS wp_post_id,
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM dtb_article_deck ad1
                    INNER JOIN dtb_article_deck ad2 ON ad1.deck_id = ad2.deck_id
                    WHERE ad1.article_id = a1.id
                      AND ad2.article_id = a2.id
                ) THEN 1 ELSE 0 END AS has_same_deck,
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM dtb_article_archetype aa1
                    INNER JOIN dtb_article_archetype aa2 ON aa1.archetype_id = aa2.archetype_id
                    WHERE aa1.article_id = a1.id
                      AND aa2.article_id = a2.id
                ) THEN 1 ELSE 0 END AS has_same_archetype,
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM dtb_article_card ac1
                    INNER JOIN dtb_article_card ac2 ON ac1.card_id = ac2.card_id
                    WHERE ac1.article_id = a1.id
                      AND ac2.article_id = a2.id
                ) THEN 1 ELSE 0 END AS has_same_card,
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM dtb_article_event_detail aed1
                    INNER JOIN dtb_article_event_detail aed2 ON aed1.event_detail_id = aed2.event_detail_id
                    WHERE aed1.article_id = a1.id
                      AND aed2.article_id = a2.id
                ) THEN 1 ELSE 0 END AS has_same_event_detail
            FROM dtb_article a1
            INNER JOIN dtb_article a2 ON a1.wp_type_id = a2.wp_type_id
            WHERE a1.wp_post_id = :wpPostId
              AND a2.wp_post_id <> a1.wp_post_id
              AND a2.wp_post_id <> 0
              AND (
```

ec-cube-enterprise Repository は executeQuery で raw SQL を実行し、結果をそのままレスポンス配列へ詰める: `ec-cube-enterprise/src/Eccube/Repository/DtbArticleRepository.php:119-139`
```php
        $stmt = $conn->prepare($sql);
        $result = $stmt->executeQuery([
            'wpPostId' => $wpPostId,
            'limit' => $limit,
        ], [
            'wpPostId' => ParameterType::INTEGER,
            'limit' => ParameterType::INTEGER,
        ]);

        $rows = [];
        while ($row = $result->fetchAssociative()) {
            $rows[] = [
                'wpPostId' => (int) $row['wp_post_id'],
                'hasSameDeck' => (string) $row['has_same_deck'],
                'hasSameArchetype' => (string) $row['has_same_archetype'],
                'hasSameCard' => (string) $row['has_same_card'],
                'hasSameEventDetail' => (string) $row['has_same_event_detail'],
            ];
        }

        return $rows;
```

ec-cube-enterprise DtbArticle は deleted_at カラムを持つが SoftDeleteable 属性は付いていない: `ec-cube-enterprise/src/Eccube/Entity/DtbArticle.php:27-51`
```php
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
    private ?\DateTime $deletedAt = null;
```
- ベース実装(pf-api)では、`GET /article/related/{id}` が `ArticleController::getRelatedArticlesAction` から ORM QueryBuilder の `DtbArticleRepository::getRelatedArticles()` を呼ぶ。Repository本文に明示的な `deletedAt` 条件はないが、対象Entity `DtbArticle` には `@Gedmo\SoftDeleteable(fieldName="deletedAt")` が付与され、Doctrineの `softdeleteable` filter が有効化され、SoftDeleteableListener も登録されている。そのため、pf-apiではORM経由の関連記事取得で論理削除済み記事が暗黙に除外される。

ベース実装 pf-api は GET /article/related/{id} を getRelatedArticlesAction に割り当てる: `pf-api/config/routes.yaml:152-155`
```yaml
get_related_article:
    path: /article/related/{id}
    controller: App\Controller\ArticleController::getRelatedArticlesAction
    methods: GET
```

ベース実装 pf-api Controller は Repository の getRelatedArticles を呼び、空なら Not Found を返す: `pf-api/src/Controller/ArticleController.php:116-130`
```php
    public function getRelatedArticlesAction($id, Request $request)
    {
        $em = $this->getDoctrine()->getManager();
        $articles = $em->getRepository(DtbArticle::class)->getRelatedArticles($id, $request->get('limit'));

        if (empty($articles)) {
            $view = View::create([
                "code" => 404,
                "message" => 'Not Found'
            ], 404);

            return $this->get('fos_rest.view_handler')->handle($view);
        }

        return $articles;
```

ベース実装 pf-api Repository は ORM QueryBuilder で DtbArticle を取得する: `pf-api/src/Repository/DtbArticleRepository.php:37-68`
```php
    public function getRelatedArticles($wpPostId, $limit = 20)
    {
        $qb = $this->createQueryBuilder('article1')
            ->distinct(true)
            ->from('\App\Entity\DtbArticle', 'article2')
            ->leftJoin('article1.decks', 'deck1')
            ->leftJoin('article2.decks', 'deck2')
            ->leftJoin('article1.cards', 'card1')
            ->leftJoin('article2.cards', 'card2')
            ->leftJoin('article1.archetypes', 'archetype1')
            ->leftJoin('article2.archetypes', 'archetype2')
            ->leftJoin('article1.eventDetails', 'eventDetail1')
            ->leftJoin('article2.eventDetails', 'eventDetail2')
            ->select('article2.wpPostId')
            ->addSelect('max(CASE WHEN deck1.deckId = deck2.deckId THEN 1 ELSE 0 END) as hasSameDeck')
            ->addSelect('max(CASE WHEN archetype1.archetypeId = archetype2.archetypeId THEN 1 ELSE 0 END) as hasSameArchetype')
            ->addSelect('max(CASE WHEN card1.id = card2.id THEN 1 ELSE 0 END) as hasSameCard')
            ->addSelect('max(CASE WHEN eventDetail1.eventDetailId = eventDetail2.eventDetailId THEN 1 ELSE 0 END) as hasSameEventDetail')
            ->groupBy('article2.wpPostId')
            ->where('article1.wpPostId = :wpPostId')
            ->andWhere('article1.wpPostId <> article2.wpPostId')
            ->andWhere('article1.wpTypeId = article2.wpTypeId')
            ->andWhere('article2.wpPostId <> 0')
            ->andWhere('deck1.deckId = deck2.deckId OR card1.id = card2.id OR archetype1.archetypeId = archetype2.archetypeId OR eventDetail1.eventDetailId = eventDetail2.eventDetailId')
            ->orderBy('hasSameDeck', 'DESC')
            ->addOrderBy('hasSameArchetype', 'DESC')
            ->addOrderBy('hasSameCard', 'DESC')
            ->addOrderBy('hasSameEventDetail', 'DESC')
            ->setMaxResults($limit)
            ->setParameter('wpPostId', $wpPostId);

        return $qb->getQuery()->getResult();
```

ベース実装 pf-api DtbArticle は Gedmo SoftDeleteable 対象である: `pf-api/src/Entity/DtbArticle.php:10-16`
```php
/**
 * DtbArticle
 * 
 * @JSON\ExclusionPolicy("all")
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
class DtbArticle
```

ベース実装 pf-api は Doctrine softdeleteable filter を有効化している: `pf-api/config/packages/doctrine.yaml:28-31`
```yaml
        filters:
          softdeleteable:
            class: Gedmo\SoftDeleteable\Filter\SoftDeleteableFilter
            enabled: true
```

ベース実装 pf-api は SoftDeleteableListener を Doctrine event subscriber として登録している: `pf-api/config/services.yaml:45-50`
```yaml
    gedmo.listener.softdeleteable:
        class: Gedmo\SoftDeleteable\SoftDeleteableListener
        calls:
            - [ setAnnotationReader, [ "@annotation_reader" ] ]
        tags:
            - { name: doctrine.event_subscriber, connection: default }
```

# 根拠
- 設計：
  - 詳細設計は pf-api の関連記事取得を確認値とし、dtb_article.deleted_at による論理削除済み記事を対象外とする: `hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:1592-1608`
  - DBカラム定義は ec-cube-enterprise を正とし、deleted_at を論理削除判定に用いるとする: `hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:1654-1656`
- ec-cube-enterprise：
  - enterprise は raw SQL の関連記事取得で a1/a2 の deleted_at 条件を指定していない: `ec-cube-enterprise/src/Eccube/Repository/DtbArticleRepository.php:75-80`
  - enterprise は DBAL connection の raw SQL を executeQuery している: `ec-cube-enterprise/src/Eccube/Repository/DtbArticleRepository.php:40-44`
  - enterprise の DtbArticle には deleted_at カラムがある: `ec-cube-enterprise/src/Eccube/Entity/DtbArticle.php:35-51`
- ベース実装：
  - pf-api は設計と同じ GET /article/related/{id} を定義している: `pf-api/config/routes.yaml:152-155`
  - pf-api の関連記事取得は ORM QueryBuilder 経由で DtbArticle を対象にする: `pf-api/src/Repository/DtbArticleRepository.php:37-68`
  - pf-api の DtbArticle は SoftDeleteable 対象で、Doctrine filter と listener が有効である: `pf-api/src/Entity/DtbArticle.php:10-16`
  - pf-api は softdeleteable filter を有効化している: `pf-api/config/packages/doctrine.yaml:28-31`

# 確認メモ
- 確認コマンド: `rg -n "A17-02|関連記事|関連する記事|deleted_at|論理削除|wp_post_id" excel_to_html/output/0517_基本設計仕様書\(API_その他\).html design_impl_drift_report/findings/a17-02_0517_sheet-4_id.json`
- 確認コマンド: `rg -n "get_related_article|article/related|getRelatedArticlesAction|getRelatedArticles|SoftDeleteable|softdeleteable|deletedAt" ../pf-api/config ../pf-api/src/Controller/ArticleController.php ../pf-api/src/Repository/DtbArticleRepository.php ../pf-api/src/Entity/DtbArticle.php`
- 確認コマンド: `rg -n "article/related|getRelatedArticles|dtb_article a1|dtb_article a2|deleted_at|executeQuery|SoftDeleteable" ../ec-cube-enterprise/src/Eccube/Controller/App/ArticleController.php ../ec-cube-enterprise/src/Eccube/Repository/DtbArticleRepository.php ../ec-cube-enterprise/src/Eccube/Entity/DtbArticle.php`
- 確認コマンド: `rg -n "a1\.deleted_at|a2\.deleted_at|deleted_at IS NULL|deletedAt IS NULL" ../ec-cube-enterprise/src/Eccube/Repository/DtbArticleRepository.php ../pf-api/src/Repository/DtbArticleRepository.php`
- pf-api の Repository 本文にも明示 `deletedAt` 条件はないが、ORM QueryBuilder + Gedmo SoftDeleteable filter により論理削除済み記事は暗黙除外される。
- ec-cube-enterprise は DBAL raw SQL のため Doctrine SoftDeleteable filter による暗黙除外を期待できず、SQL内に `a1.deleted_at IS NULL` / `a2.deleted_at IS NULL` が必要になる。
- gpt-5.5 high reviewer Carson verdict: VERIFIED. 設計要求だけではなく、pf-api の暗黙 SoftDeleteable 除外と ec-cube-enterprise の raw SQL 条件欠落という実装差分を根拠に起票可能。
