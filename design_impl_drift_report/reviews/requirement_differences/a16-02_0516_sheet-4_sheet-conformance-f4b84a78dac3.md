# a16-02_0516_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: medium）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a16-02_0516_sheet-4_sheet.json#a16-02_0516_sheet-4_sheet-conformance-f4b84a78dac3`
- 機能: A16-02 A16-02 言語コードに紐づいたトップバナーの情報一覧を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は設定状態(disp_type)・言語の2軸で絞り込む「設定済みトップバナー」取得を求めるが、実装は言語のみで絞り込み(getTopBanners)、disp_type=0の非表示バナーも返却し得る。

## 判定理由
設計はエンドポイントの取得対象を一貫して「設定済みトップバナー」と定義し(1023,1160,1169,1185,1188行)、移行元/移行先対照表(1177行)で mtb_top_banner を『設定状態・言語で絞り込む』と明記、業務ルール(1216行)でも『既存リポジトリの絞り込み順序を正とする』『非公開のデータは空結果…で返す』としている。実装(ContentController::getTopBannersByLanguageCode)は languageRepository->findOneBy でコード一致の言語を取得後、$Language->getTopBanners() の多対多Collectionをそのまま TopBannersResponseBuilder に渡すのみで(102,110行)、disp_type による絞り込みを一切行わない。disp_type 条件を持つのは MtbTopBannerRepository::findWhereUrlIsNotEmpty()(38,46行 tb.dispType in :dispTypes)だが、このAPI経路からは呼ばれていない。よって設計の『設定状態で絞り込む』要求に対し実装は言語軸のみで、絞り込み条件が設計と異なる実装違い。confidenceは、本設計が現行踏襲のリバース設計で『設定済み』の語がやや曖昧なため medium とした。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0516_基本設計仕様書(API_データ管理).html:1176-1188` — 設計要求

```html
          <p>本機能は現行踏襲であり、挙動の参照は現行のpf-api、DB関連の正はec-cube-enterpriseとする。テーブル名・列名は現行と移行先で一致する。移行先ではトップバナーマスタと言語マスタに表示用の追加列があるが、本APIの絞り込み条件・応答項目には影響しない。</p>
          <div class="table-wrap"><table><thead><tr><th>項目</th><th>現行（pf-api）</th><th>移行先（ec-cube-enterprise）</th><th>扱い</th></tr></thead><tbody><tr><td>トップバナーマスタ</td><td><code>mtb_top_banner</code>（id・image_url・link・disp_type）</td><td><code>mtb_top_banner</code>（id・image_url・link・disp_typeに加え、image_alt・sort_no）</td><td>同名テーブル。移行先は alt属性（<code>image_alt</code>）と表示順（<code>sort_no</code>）の列を持つ。設定状態・言語で絞り込む。</td></tr><tr><td>言語関連</td><td><code>dtb_top_banner_language</code>（top_banner_id・language_id）</td><td><code>dtb_top_banner_language</code>（top_banner_id・language_id）</td><td>同一スキーマ。トップバナーと言語の多対多関連。</td></tr><tr><td>言語マスタ</td><td><code>mtb_language</code>（id・name_jp・name_en・code）</td><td><code>mtb_language</code>（id・name_jp・name_en・code・sort_no）</td><td>同名テーブル。移行先は並び順（<code>sort_no</code>）の列を持つ。言語コードの存在確認に用いる。</td></tr></tbody></table></div>
          <hr>
          <h2 id="function-design-a16-02-a16-02_api_top_banner_list-利用者視点の入口">利用者視点の入口</h2>
          <div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>指定言語の設定済みトップバナー一覧取得</td><td><code>GET /topBanners/{languageCode}</code></td><td>指定言語の設定済みトップバナー一覧をJSONで返す。言語が存在しない場合は404を返す。</td></tr></tbody></table></div>
          <p>応答形式はJSON。</p>
          <hr>
          <h2 id="function-design-a16-02-a16-02_api_top_banner_list-処理フロー">処理フロー</h2>
          <h3 id="function-design-a16-02-a16-02_api_top_banner_list-トップバナー一覧を取得する-GET-topBanners-languageCode">トップバナー一覧を取得する（GET <code>/topBanners/{languageCode}</code>）</h3>
          <ol><li>パスの言語コードを受け取る。</li><li>指定言語の設定済みトップバナー一覧を取得する。</li><li>一覧が空、または当該言語コードが言語マスタに存在しない場合はコード404のJSONを返す。</li><li>取得できた場合はトップバナー一覧をJSONで返す。</li></ol>
          <hr>
          <h2 id="function-design-a16-02-a16-02_api_top_banner_list-集計条件">集計条件</h2>
          <div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>取得対象</td><td>指定言語の設定済みトップバナー。</td></tr><tr><td>言語確認</td><td>言語コードが言語マスタに存在することを確認する。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
言語のみで絞り込み、disp_type条件なしでCollectionをそのまま返す
`ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:102-110` — 実装(絞り込み欠落)

```php
            $TopBanners = $Language->getTopBanners();
            if ($TopBanners->isEmpty()) {
                log_warning('指定した言語のトップバナーが見つかりません', [
                    'request_url' => $request->getUri(),
                ]);
                throw new NotFoundException('Not Found');
            }

            $response = $this->topBannersResponseBuilder->build($TopBanners);
```

dispType条件を持つが本API経路から呼ばれない
`ec-cube-enterprise/src/Eccube/Repository/Master/MtbTopBannerRepository.php:38-49` — 設計に合致するが未使用の絞り込み実装

```php
    public function findWhereUrlIsNotEmpty(string $locale, int $limit, array $dispTypes = []): mixed
    {
        // localeとlocaleIdの対応づけ処理
        $localeId = $locale === 'en' ? MtbLanguage::EN_ID : MtbLanguage::JP_ID;

        $qb = $this->createQueryBuilder('tb');
        $query = $qb->join('tb.Languages', 'l')
            ->where($qb->expr()->eq('l.id', ':localeId'))
            ->andWhere($qb->expr()->in('tb.dispType', ':dispTypes'))
            ->andWhere("tb.imageUrl <> ''")
            ->setParameter('localeId', $localeId)
            ->setParameter('dispTypes', $dispTypes)
```

## 不在確認コマンド

- `rg -n "dispType|disp_type" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが指摘は維持。(1)設計が正典と宣言するpf-api実機(設計1165行『確認値はpf-apiの…処理を正とする』)を照合。pf-api/src/Controller/BannerController.php:44 getTopBannersAction は findAllWhereUrlIsNotEmpty($languageCode) を呼び、その実装 pf-api/src/Repository/MtbTopBannerRepository.php:22 は andWhere("tb.dispType <> 0") で非表示(disp_type=0)を除外し、かつ imageUrl<>'' も条件とする。つまり設計の『設定状態・言語で絞り込む』(1177行)『設定済みトップバナー』(1188行)は実機の dispType<>0 絞り込みを正確に反映しており、要求の読み違いではない。(2)ec-cube-enterprise 側 ContentController::getTopBannersByLanguageCode(88-118行)は $Language->getTopBanners() の多対多Collectionをそのまま返し、Entity/Master/MtbLanguage.php:175 の ManyToMany 定義には disp_type の WHERE も Criteria も無く、無条件返却を確認。(3)別ルート無し=/topBanners/{languageCode} は本メソッドが唯一の経路。TopBanner版 findWhereUrlIsNotEmpty(dispType条件あり)は MvCarouselBlockPayloadBuilder と EventTopController からのみ呼ばれ本API経路からは未使用(rg で全呼び出し確認)。(4)設計1176行の除外は追加列 image_alt・sort_no のみ対象で、disp_type は現行・移行先双方に存在する既存列のため除外対象外。よって設計要求(dispType絞り込み)に対し実装が言語軸のみで絞り込む乖離は実在。
