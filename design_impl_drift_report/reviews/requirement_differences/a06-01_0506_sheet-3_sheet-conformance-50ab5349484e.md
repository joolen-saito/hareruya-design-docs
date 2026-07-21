# a06-01_0506_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-01_0506_sheet-3_sheet.json#a06-01_0506_sheet-3_sheet-conformance-50ab5349484e`
- 機能: A06-01 A06-01 買取アプリ用ログイン
- 観点: ⑦要求網羅・実装違い

## 要旨
会員に店舗が紐づかない場合に shopName/shopAddr を空文字で返す設計に対し、実装は非nullなBaseInfoを前提とし店舗未紐付けを扱えず例外化する。

## 判定理由
設計は店舗が紐づかない場合 shopName・shopAddr を空文字で返すと明記（HTML 1003行、1023行）。実装では LoginMemberView.base_info_id と getBaseInfoId() が nullable（?int, LoginMemberView.php:63-64,121）だが、LoginController.php:67 は entityManager->find(BaseInfo::class, getBaseInfoId()) の結果を Member::setBaseInfo(BaseInfo $baseInfo) に渡す。Member の baseInfo プロパティは 'public BaseInfo $baseInfo'（非null型）で getBaseInfo():BaseInfo・setBaseInfo(BaseInfo)（Member.php:188-205）。base_info_id が null または対応 BaseInfo が無い場合 find は null を返し、非nullable引数へ null 渡しで TypeError となる。続く LoginController.php:73-85 は $baseInfo->getAddr01()/getAddr02()/getShopName() を無条件に呼ぶだけで、店舗未紐付け時に空文字を返す分岐が存在しない。よって設計の空文字応答契約を満たさない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1003-1003` — 設計要求（成功レスポンス shopName/shopAddr）

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>memberName</code></td><td>string</td><td>認証した管理者会員の氏名。</td></tr><tr><td><code>memberId</code></td><td>integer</td><td>認証した管理者会員のID。発行するトークンの利用者IDにも対応する。</td></tr><tr><td><code>shopName</code></td><td>string</td><td>会員に紐づく店舗名。店舗が紐づかない場合は空文字。</td></tr><tr><td><code>shopAddr</code></td><td>string</td><td>会員に紐づく店舗住所。店舗が紐づかない場合は空文字。</td></tr><tr><td><code>jwtToken</code></td><td>string</td><td>発行したJWTトークン。以降のpf-api買取系APIの<code>jwt-token</code>ヘッダに用いる。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Entity/Views/LoginMemberView.php:63-64` — base_info_idはnullable

```php
    #[ORM\Column(name: 'base_info_id', type: Types::INTEGER, length: 255, nullable: true)]
    private ?int $base_info_id = null;
```

`ec-cube-enterprise/src/Eccube/Entity/Member.php:188-205` — Memberは非nullなBaseInfo前提

```php
        #[ORM\ManyToOne(targetEntity: BaseInfo::class, inversedBy: 'Members')]
        #[ORM\JoinColumn(name: 'base_info_id', referencedColumnName: 'id', nullable: false)]
        public BaseInfo $baseInfo;

        /**
         * テナント情報を取得する
         */
        public function getBaseInfo(): BaseInfo
        {
            return $this->baseInfo;
        }

        /**
         * テナント情報を設定する
         *
         * @return $this
         */
        public function setBaseInfo(BaseInfo $baseInfo): static
```

無条件にBaseInfoメソッドを呼ぶ
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:67-85` — 店舗未紐付け分岐なし

```php
        $member->setBaseInfo($this->entityManager->find(BaseInfo::class, $viewMember->getBaseInfoId()));

        if (!$this->passwordHasher->isPasswordValid($member, $password)) {
            throw new UnauthenticatedException('ログインIDまたはパスワードが正しくありません');
        }

        $baseInfo = $member->getBaseInfo();
        $shopAddr = implode('', array_filter([
            $baseInfo->getAddr01(),
            $baseInfo->getAddr02(),
        ]));

        $jwtToken = $this->jwtTokenService->createToken($member->getId());

        return new JsonResponse([
            'memberName' => $viewMember->getName() ?? '',
            'memberId' => $member->getId(),
            'shopName' => $baseInfo->getShopName() ?? '',
            'shopAddr' => $shopAddr,
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。引用を実確認。Member.php:188-190 は #[JoinColumn(nullable:false)] かつ 'public BaseInfo $baseInfo'（非null型）、setBaseInfo(BaseInfo $baseInfo):static（:205）で null 不可。LoginController.php:67 は setBaseInfo(entityManager->find(BaseInfo::class, $viewMember->getBaseInfoId())) を呼ぶが、LoginMemberView.php:63-64 の base_info_id は nullable:true・getBaseInfoId():?int（:121）。base_info_id が null の会員では find が null を返し、非nullable引数へ渡って TypeError（500）となる。続く:73-85 も $baseInfo->getAddr01()/getAddr02()/getShopName() を無条件に呼ぶだけで、店舗未紐付け時に空文字を返す分岐は存在しない（getShopName()??'' や array_filter は null列対策であって baseInfo自体のnull対策ではない）。設計1003・1023行の『店舗が紐づかない場合は空文字』を満たす別実装・別分岐は無い。むしろ Member 側 nullable:false が設計の未紐付けシナリオと構造的に矛盾。指摘は維持。
