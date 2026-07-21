/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：新規会員登録
課題カテゴリ：実装漏れ
課題：デッキ登録用ユーザーIDの一意性がDB制約で担保されていない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. http://localhost:8080/ja/entry から新規会員登録を仮会員設定有効の状態で完了する
2. 登録された選手情報 `dtb_player.deck_user_id` を確認する
3. `dtb_player.deck_user_id` のカラム定義とマイグレーションにユニーク制約またはユニークインデックスがあるか確認する

# 期待される挙動【必須】
- 仮会員登録完了時にデッキ登録用ユーザーIDを登録する
- デッキ登録用ユーザーIDは英数字8文字のランダム文字列である
- デッキ登録用ユーザーIDは一意であり、並行登録時も重複しないようDB制約等で担保される

# 現在の挙動【必須】
- ec-cube-enterprise は `CustomerRepository::newCustomer()` で `PlayerService::setNewDeckUserId()` を呼び、8桁のランダム値を既存検索で重複チェックしてから `deckUserId` にセットしている。ただし `PlayerService` 自身が `deck_user_id` カラムにユニーク制約がなく、insert が後続 Controller の flush で行われるため厳密には重複可能性があるとコメントしている。

ec-cube-enterprise 新規会員作成時の deck_user_id 採番呼び出し: `ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:80-92`
```php

        $Player = new DtbPlayer();
        $Player
            ->setMailMagazineFlg(DtbPlayer::MAIL_MAGAZINE_DISALLOW)
            ->setIdentityConfirmStatus($IdentityConfirmStatus)
            ->setCustomerGroup($CustomerGroup)
        ;

        $Player = $this->playerService->setNewDeckUserId($Player, $this->eccubeConfig['eccube_deck_user_id_len']);

        $CustomerStatus = $this->getEntityManager()
            ->find(CustomerStatus::class, CustomerStatus::PROVISIONAL);
```

ec-cube-enterprise deck_user_id 生成処理: `ec-cube-enterprise/src/Eccube/Service/PlayerService.php:28-49`
```php
    // TODO: DeckUserIdについての懸念点あり
    // ・カラム自体にユニーク制約はついていない
    // ・カラムの文字数は8桁
    // ・サービスクラスの中でユニークチェックを行っているが、実際にinsertが実行されるのは少し後のController内で行われるため、厳密には重複が発生する可能性がゼロではない
    /**
     * ランダムな DeckUserId を生成し、一意であることを確認してエンティティにセットする
     */
    public function setNewDeckUserId(DtbPlayer $Player, int $deckUserIdLength): DtbPlayer
    {
        // IDの生成ロジック
        do {
            $deckUserId = StringUtil::random($deckUserIdLength);

            // DBに存在しないことを確認
            $existingPlayer = $this->playerRepository->findOneBy(['deckUserId' => $deckUserId]);
        } while ($existingPlayer);

        // エンティティにIDをセット（エンティティ内のセッターメソッドを利用）
        $Player->setDeckUserId($deckUserId);

        return $Player;
    }
```

ec-cube-enterprise deck_user_id カラム定義: `ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:111-117`
```php
    #[ORM\Column(name: 'nickname', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'ニックネーム'])]
    private ?string $nickname = null;

    #[ORM\Column(name: 'deck_user_id', type: Types::STRING, length: 8, nullable: true, options: ['comment' => 'デッキユーザーID'])]
    private ?string $deckUserId = null;

    #[ORM\Column(name: 'profile', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'プロフィール'])]
```

ec-cube-enterprise 仮登録時の persist/flush: `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:150-155`
```php
                    $Player->setEmail($Customer->getEmail());

                    $this->entityManager->persist($Player);

                    $this->entityManager->persist($Customer);
                    $this->entityManager->flush();
```
- ベース実装 pf-eccube3 も、会員登録時に `DtbPlayer::setNewDeckUserId()` を呼び、設定値 `deck_user_id.length: 8` を使って英数字ランダム文字列を生成し、既存検索で重複チェックしている。一方、Doctrine マッピングと `deck_user_id` 追加マイグレーションにはユニーク制約がなく、ベース実装もDB制約ではなくアプリ側チェックに留まっている。

ベース実装 pf-eccube3 会員登録時の deck_user_id 採番呼び出し: `pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php:132-141`
```php
                    $dtbPlayer
                        ->setEmail($form['email']->getData())
                        ->setFirstNameJp($form['name']['name02']->getData())
                        ->setFirstNameEn($form['first_name_en']->getData())
                        ->setLastNameJp($form['name']['name01']->getData())
                        ->setLastNameEn($form['last_name_en']->getData())
                        ->setNewDeckUserId()
                        ->setUpdateDate(date('Y/m/d H:i:s'))
                        ->setCreateDate(date('Y/m/d H:i:s'))
                        ->setCustomer($Customer);
```

ベース実装 pf-eccube3 deck_user_id 生成処理: `pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbPlayer.php:948-962`
```php
     * 新規デッキユーザーIDを作成してセットする
     *
     * @return DtbPlayer
     */
    public function setNewDeckUserId()
    {
        $app = \Eccube\Application::getInstance();
        $length = intval($app['config']['HareruyaEc']['const']['deck_user_id']['length']);
        do {
            $deckUserId = StringUtil::alphanumericRandomString($length);
            $player = $app['hareruya_ec.repository.player']->findOneByDeckUserId($deckUserId);
        } while ($player);

        return $this->setDeckUserId($deckUserId);
    }
```

ベース実装 pf-eccube3 deck_user_id 長設定: `pf-eccube3/app/Plugin/HareruyaEc/config.yml:344-345`
```yaml
    deck_user_id:
        length: 8
```

ベース実装 pf-eccube3 deck_user_id マッピング: `pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.DtbPlayer.dcm.yml:199-206`
```yaml
        deckUserId:
            type: string
            nullable: true
            length: 8
            options:
                fixed: true
                comment: デッキユーザーID
            column: deck_user_id
```

ベース実装 pf-eccube3 deck_user_id 追加マイグレーション: `pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20220124175000.php:17-25`
```php
        $playerTable = $schema->getTable('dtb_player');
        if (!$playerTable->hasColumn('deck_user_id')) {
            $playerTable->addColumn('deck_user_id', 'string', [
                'NotNull' => false,
                'length' => 8,
                'fixed' => true,
                'comment' => 'デッキユーザーID',
                'default' => null
            ]);
```

# 根拠
- 設計：
  - デッキ登録用ユーザーIDは英数字8文字ランダムで一意: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1215-1222`
- ec-cube-enterprise：
  - 実装コメントでユニーク制約なし・厳密には重複可能と明記: `ec-cube-enterprise/src/Eccube/Service/PlayerService.php:28-43`
  - カラム定義は length=8/nullable で unique=true がない: `ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:111-117`
- ベース実装：
  - pf-eccube3は8文字英数字ランダムを既存検索で重複回避していた: `pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbPlayer.php:952-961`
  - pf-eccube3のマッピングもユニーク制約は持たない: `pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.DtbPlayer.dcm.yml:199-206`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-01_0306_sheet-3_sheet.json#f06-01_0306_sheet-3_sheet-conformance-7b0d713f7402'`
- 確認コマンド: `rg -n "デッキ登録用ユーザーID|deck_user_id|deckUserId|DeckUserId|一意|英数字|仮会員" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube pf-eccube3/app/Plugin/HareruyaEc ec-cube/app`
- 確認コマンド: `rg -n "deck_user_id|DeckUserId|deckUserId|UNIQUE|unique|dtb_player" ec-cube-enterprise/app/DoctrineMigrations ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php ec-cube-enterprise/src/Eccube/Service/PlayerService.php`
- 確認コマンド: `rg -n "setNewDeckUserId|deck_user_id|deckUserId|UNIQUE|unique|dtb_player" pf-eccube3/app/Plugin/HareruyaEc pf-eccube3/src`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '1215,1222p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php | sed -n '80,92p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/PlayerService.php | sed -n '24,50p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php | sed -n '90,125p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php | sed -n '150,155p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php | sed -n '132,142p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbPlayer.php | sed -n '948,963p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.DtbPlayer.dcm.yml | sed -n '190,210p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20220124175000.php | sed -n '13,26p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/config.yml | sed -n '340,348p'`
