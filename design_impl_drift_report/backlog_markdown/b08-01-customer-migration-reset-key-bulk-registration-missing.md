/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ会員
機能：リニューアル時パスワードリセットメール送信_事前準備
課題カテゴリ：実装漏れ
課題：会員インポート後にパスワード再設定キーコードを一括登録する処理がない
設計書：0408_基本設計仕様書(バッチ_会員).xlsx

# 再現手順【必須】
1. 設計書 B08-01 の事前準備で、現行ECサイトから会員情報インポート後に各会員へパスワード再設定キーコードを登録する要求を確認する
2. ベース実装 pf-eccube3 の会員CSV取込処理で、登録時に `setResetKey()` と `setResetExpire()` を実行していることを確認する
3. ec-cube-enterprise の会員Entity/Repository/通常パスワード再発行処理を確認し、reset_key カラムとユニークキー生成部品はあることを確認する
4. ec-cube-enterprise の会員CSV取込・Command・Service を検索し、インポート後の各会員へ reset_key/reset_expire を一括登録する処理がないことを確認する

# 期待される挙動【必須】
- 現行ECサイトから会員情報をインポートした後、各会員の `dtb_customer.reset_key` に重複しないパスワード再設定キーコードを登録する
- パスワード再設定キーコードの登録に伴い、会員データの最終更新日が更新される
- 移行通知メール送信バッチの抽出条件である `reset_key IS NOT NULL` を満たすよう、事前準備処理が実行できる

# 現在の挙動【必須】
- ec-cube-enterprise には `dtb_customer.reset_key` / `reset_expire` のEntity項目と `CustomerRepository::getUniqueResetKey()` は存在するが、これらは部品であり、会員インポート後の全対象会員へ reset_key を一括登録する処理ではない。

ec-cube-enterprise の Customer Entity には reset_key/reset_expire がある: `ec-cube-enterprise/src/Eccube/Entity/Customer.php:129-136`
```php
        #[ORM\Column(name: 'reset_key', type: Types::STRING, length: 255, nullable: true)]
        private ?string $reset_key = null;

        /**
         * @var \DateTime|null
         */
        #[ORM\Column(name: 'reset_expire', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
        private $reset_expire;
```

ec-cube-enterprise の Customer Entity setter: `ec-cube-enterprise/src/Eccube/Entity/Customer.php:610-632`
```php
         * Set resetKey.
         */
        public function setResetKey(?string $resetKey = null): Customer
        {
            $this->reset_key = $resetKey;

            return $this;
        }

        /**
         * Get resetKey.
         */
        public function getResetKey(): ?string
        {
            return $this->reset_key;
        }

        /**
         * Set resetExpire.
         */
        public function setResetExpire(?\DateTime $resetExpire = null): Customer
        {
            $this->reset_expire = $resetExpire;
```

ec-cube-enterprise のユニーク reset_key 生成部品: `ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:498-508`
```php
    /**
     * ユニークなパスワードリセットキーを返す
     */
    public function getUniqueResetKey(): string
    {
        do {
            $key = StringUtil::random(32);
            $Customer = $this->findOneBy(['reset_key' => $key]);
        } while ($Customer);

        return $key;
```

ec-cube-enterprise の通常パスワード再発行は利用者操作時に reset_key を登録する: `ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:73-83`
```php
            $resetKey = $this->registerCustomerViewRepository->getUniqueResetKey();

            if (!is_null($Customer)) {
                // リセットキーの発行・有効期限の設定
                // リセットキーを更新
                $this->entityManager->getConnection()->executeQuery(
                    'UPDATE registration_view SET reset_key = :reset_key, reset_expire = :reset_expire WHERE secret_key = :secret_key',
                    [
                        'reset_key' => $resetKey,
                        'reset_expire' => (new \DateTime('+'.$this->eccubeConfig['eccube_customer_reset_expire'].' min'))->format('Y-m-d H:i:s'),
                        'secret_key' => $Customer->getSecretKey(),
```
- ベース実装(pf-eccube3)では会員CSV取込時に会員へ secret_key と reset_key を生成し、移行用の有効期限 `customer_migration_reset_expire` を使って reset_expire も設定してから保存している。

ベース実装 pf-eccube3 の会員CSV取込で reset_key/reset_expire を設定する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/CustomerCsv.php:120-155`
```php
            ->setName01($row['last_name'])
            ->setName02($row['first_name'])
            ->setKana01($row['last_name_kana'])
            ->setKana02($row['first_name_kana'])
            ->setEmail($row['email'])
            ->setStatus($app['eccube.repository.customer_status']->find($row['status']))
            ->setSex($app['eccube.repository.master.sex']->findOneByName($row['sex']))
            ->setJob($app['orm.em']->getRepository('Eccube\Entity\Master\Job')->findOneByName($row['job']))
            ->setCompanyName($row['company'])
            ->setBirth(new \DateTime($row['birth']))
            ->setCountry($app['orm.em']->getRepository('Eccube\Entity\Master\Country')->findOneByName($row['country']))
            ->setPref($app['eccube.repository.master.pref']->findOneByName($row['pref']))
            ->setAddr01($row['addr01'])
            ->setAddr02($row['addr02'])
            ->setZip01($row['zip01'])
            ->setZip02($row['zip02'])
            ->setZipcode($row['zipcode'])
            ->setTel01($row['tel01'])
            ->setTel02($row['tel02'])
            ->setTel03($row['tel03'])
            ->setFax01($row['fax01'])
            ->setFax02($row['fax02'])
            ->setFax03($row['fax03'])
            ->setFirstBuyDate($firstBuyDate)
            ->setLastBuyDate($lastBuyDate)
            ->setBuyTimes($row['buy_times'])
            ->setBuyTotal($row['buy_total'])
            ->setNote($row['note'])
            ->setSecretKey($app['eccube.repository.customer']->getUniqueSecretKey($app))
            ->setResetKey($app['eccube.repository.customer']->getUniqueResetKey($app))
            ->setResetExpire(new \Datetime('+' . $app['config']['HareruyaEc']['const']['customer_migration_reset_expire'] . 'year'))
            ->setCreateDate($createDate)
            ;

        $this->em->persist($customer);
        $this->em->flush();
```

ベース実装 pf-eccube3 の移行用 reset_expire 設定: `pf-eccube3/app/Plugin/HareruyaEc/config.yml:321`
```yaml
    customer_migration_reset_expire: 10
```

# 根拠
- 設計：
  - B08-01 の事前準備は会員インポート後に全会員へ重複しないパスワード再設定キーコードを登録することを要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:868-884`
- ec-cube-enterprise：
  - enterprise には reset_key のカラム・setter・ユニーク生成部品はあるが、一括登録処理は確認できない: `ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:498-508`
  - 通常のパスワード再発行では reset_key を登録するが、利用者操作単位であり移行用一括登録ではない: `ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:73-83`
- ベース実装：
  - pf-eccube3 は会員CSV取込時に reset_key と reset_expire を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/CustomerCsv.php:120-155`

# 確認メモ
- 確認コマンド: `rg -n "パスワード再設定キーコード|会員情報インポート|reset_key|事前準備" excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html design_impl_drift_report/findings/b08-01_0408_sheet-3_sheet.json`
- 確認コマンド: `rg -n "CustomerCsv|Customer.*Import|Csv.*Customer|setResetKey|reset_key|resetKey|getUniqueResetKey|setResetExpire|reset_expire" ../ec-cube-enterprise/src/Eccube/Controller/Admin/Customer ../ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop ../ec-cube-enterprise/src/Eccube/Service/Csv ../ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php ../ec-cube-enterprise/src/Eccube/Entity/Customer.php -g '*.php'`
- 確認コマンド: `rg -n "customer_migration_reset_expire|reset_expire|setResetExpire|setResetKey|getUniqueResetKey" ../pf-eccube3/app/Plugin/HareruyaEc/config.yml ../pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/CustomerCsv.php ../ec-cube-enterprise/app/config ../ec-cube-enterprise/src/Eccube -g '*.php' -g '*.yaml' -g '*.yml'`
