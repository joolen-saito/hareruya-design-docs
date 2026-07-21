/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：配送先新規登録・変更
課題カテゴリ：実装漏れ
課題：配送先登録確定時にブラックリストを照合せず会員情報登録エラー画面へ遷移しない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. ブラックリスト管理に、配送先氏名・住所・電話番号のいずれかに一致するキーワードを登録する
2. ログイン済み会員で `http://localhost:8080/ja/mypage/delivery/new` を表示し、ブラックリストに一致する配送先情報を入力して確認画面へ進む
3. 確認画面で「登録する」を押下し、登録されず会員情報登録エラー画面へ遷移するか確認する

# 期待される挙動【必須】
- 確認画面の「登録する」押下時、配送先氏名・住所・電話番号のいずれかがブラックリストに一致する場合は配送先を登録しない
- ブラックリスト該当時は会員情報登録エラー画面へ遷移する

# 現在の挙動【必須】
- ec-cube-enterprise の `DeliveryController::complete()` は、フォーム検証が通ると `persist()` / `flush()` で配送先を保存し、そのまま `mypage_delivery` へリダイレクトする。`DtbBlacklistRepository::FindBlacklistByCustomer()` の呼び出し、配送先氏名・住所・電話番号を使った照合、`entry_regist_error` への遷移分岐はいずれもない。

ec-cube-enterprise 配送先確定処理は検証通過後に即保存して一覧へ戻る: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:197-210`
```php
        $form = $this->formFactory->create(CustomerAddressType::class, $CustomerAddress);
        $form->handleRequest($request);

        if ($form->isValid()) {
            log_info('お届け先登録開始', [$id]);
            $this->entityManager->persist($CustomerAddress);
            $this->entityManager->flush();

            log_info('お届け先登録完了', [$id]);

            return $this->redirectToRoute('mypage_delivery');
        }

        return $this->redirectToRoute($id ? 'mypage_delivery_edit' : 'mypage_delivery_new', ['id' => $id]);
```

ec-cube-enterprise ブラックリスト照合メソッドはCustomer専用: `ec-cube-enterprise/src/Eccube/Repository/DtbBlacklistRepository.php:34-69`
```php
    /**
     * 会員情報の氏名・電話番号・住所からブラックリストを検索
     */
    public function FindBlacklistByCustomer(Customer $Customer): mixed
    {
        $name = StringUtil::removeSpace($Customer->getName01().$Customer->getName02());
        $tel = StringUtil::removeSpace($Customer->getTel01().$Customer->getTel02().$Customer->getTel03());
        $address = StringUtil::removeSpace($Customer->getPref().$Customer->getAddr01().$Customer->getAddr02().$Customer->getAddr03());

        $qb = $this->createQueryBuilder('bl');
        $qb->andWhere(
            $qb->expr()->orX(
                $qb->expr()->andX(
                    $qb->expr()->eq('bl.BlacklistTag', ':name_id'),
                    $qb->expr()->eq('bl.keyword', ':name')
                ),
                $qb->expr()->andX(
                    $qb->expr()->eq('bl.BlacklistTag', ':tel_id'),
                    $qb->expr()->eq('bl.keyword', ':tel')
                ),
                $qb->expr()->andX(
                    $qb->expr()->eq('bl.BlacklistTag', ':address_id'),
                    $qb->expr()->eq('bl.keyword', ':address')
                )
            )
        );

        $qb->setParameter('name_id', MtbBlacklistTag::NAME_ID)
            ->setParameter('name', $name)
            ->setParameter('tel_id', MtbBlacklistTag::TEL_ID)
            ->setParameter('tel', $tel)
            ->setParameter('address_id', MtbBlacklistTag::ADDRESS_ID)
            ->setParameter('address', $address);

        return $qb->getQuery()->getResult();
    }
```

ec-cube-enterprise 会員登録にはブラックリスト時のentry_regist_error遷移がある: `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:128-142`
```php
                case 'complete':
                    $Blacklists = $this->blacklistRepository->FindBlacklistByCustomer($Customer);
                    if (count($Blacklists) > 0) {
                        /** @var DtbBlacklist $Blacklist */
                        foreach ($Blacklists as $Blacklist) {
                            $message = trans('front.entry.blacklisted', [
                                '%name%' => $Blacklist->getBlacklistTag()->getName(),
                                '%keyword%' => $Blacklist->getKeyword(),
                            ]);
                            log_info($message);
                        }
                        log_info(trans('front.entry.blacklist_not_registered'));

                        return $this->redirectToRoute('entry_regist_error');
                    }
```
- ベース実装 pf-eccube3 の配送先確定処理も、入力が妥当なら配送先サブ情報保存、`flush()`、選択中配送先のセッション・Cookie 記録を行って `mypage_delivery` へ戻る。pf-eccube3 のブラックリストリポジトリも会員本体専用の `findBlacklistByCustomer()` で、配送先用の照合は見当たらない。会員登録では `entry_regist_error` への近傍実装があるため、設計が求める遷移先自体は既存概念だが、配送先フローには組み込まれていない。

ベース実装 pf-eccube3 配送先確定処理はブラックリスト照合なしで保存して一覧へ戻る: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/DeliveryController.php:92-112`
```php
        if ($request->request->get('back', null) !== 'back' && $form->isSubmitted() && $this->isFormValid($app, $form)) {
            log_info('お届け先登録開始', [$id]);

            $app['hareruya_ec.service.delivery']->registerCustomerAddressSub($customerAddress, $form['addressName']->getData());

            $app['orm.em']->flush();

            $id = $customerAddress->getId();
            $app['session']->set('hareruya_ec.shopping.customer_address_id', $id);
            setcookie(ShoppingService::CUSTOMER_ADDRESS_ID_KEY, $id, time() + $app['config']['cookie_lifetime'], '/');

            log_info('お届け先登録完了', [$id]);

            $now = (new \DateTime())->format('Y/m/d H:i:s');
            file_put_contents(
                $app['config']['root_dir'].'/app/log/delivery_edit.log',
                "[{$now}][CustomerAddressId][{$id}]\n",
                FILE_APPEND
            );

            return $app->redirect($app->path('mypage_delivery'));
```

ベース実装 pf-eccube3 ブラックリスト照合メソッドは会員本体専用: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbBlacklistRepository.php:17-52`
```php
    /**
     * 会員情報の氏名・電話番号・住所からブラックリストを検索
     */
    public function findBlacklistByCustomer($customer)
    {
        $name = StringUtil::removeSpace($customer->getName01() . $customer->getName02());
        $tel = StringUtil::removeSpace($customer->getTel01() . $customer->getTel02() . $customer->getTel03());
        $address = StringUtil::removeSpace($customer->getPref() . $customer->getAddr01() . $customer->getAddr02());

        $qb = $this->createQueryBuilder('bl');
        $qb->where(Expr::andX(
                Expr::eq('bl.blacklistTagId', ':name_id'),
                Expr::eq('bl.keyword', ':name')
            ))
            ->orWhere(Expr::andX(
                Expr::eq('bl.blacklistTagId', ':tel_id'),
                Expr::eq('bl.keyword', ':tel')
            ))
            ->orWhere(Expr::andX(
                Expr::eq('bl.blacklistTagId', ':address_id'),
                Expr::eq('bl.keyword', ':address')
            ));
        
        $qb->setParameters([
            'name_id' => MtbBlacklistTag::NAME_ID,
            'name' => $name,
            'tel_id' => MtbBlacklistTag::TEL_ID,
            'tel' => $tel,
            'address_id' => MtbBlacklistTag::ADDRESS_ID,
            'address' => $address,
        ]);
        
        $result = $qb->getQuery()->getResult();
        
        return $result;
    }
```

ベース実装 pf-eccube3 会員登録にはブラックリスト時のentry_regist_error遷移がある: `pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php:103-112`
```php
                    // ブラックリストに登録されている場合はエラーページへ
                    $blacklists = $app['hareruya_ec.repository.blacklist']->findBlacklistByCustomer($Customer);
                    if (count($blacklists) > 0) {
                        foreach ($blacklists as $blacklist) {
                            $app['monolog.logger.hareruyaec']->info('ブラックリスト登録あり  ' . $blacklist->getBlacklistTag()->getName() . ' : ' . $blacklist->getKeyword());
                        }
                        $app['monolog.logger.hareruyaec']->info('ブラックリスト登録があるため会員登録不可');

                        return $app->redirect($app->path('entry_regist_error'));
                    }
```

# 根拠
- 設計：
  - 確認画面の登録ボタンで配送先氏名・住所・電話番号をブラックリスト照合し、該当時は会員情報登録エラー画面へ遷移: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5616-5621`
  - 画面部品表の(3-14)登録するにも同要求が明記されている: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5648`
- ec-cube-enterprise：
  - 配送先確定処理はブラックリスト照合なしで保存・一覧リダイレクト: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:197-210`
  - ブラックリスト照合は会員本体用メソッドのみ: `ec-cube-enterprise/src/Eccube/Repository/DtbBlacklistRepository.php:34-69`
- ベース実装：
  - pf-eccube3 配送先確定処理もブラックリスト照合なしで保存・一覧リダイレクト: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/DeliveryController.php:92-112`
  - pf-eccube3 会員登録にはブラックリスト時の会員情報登録エラー画面遷移がある: `pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php:103-112`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-20_0306_sheet-16_sheet.json#f06-20_0306_sheet-16_sheet-conformance-5241152c64af'`
- 確認コマンド: `rg -n "5241152c64af|ブラックリスト|配送先|会員情報登録エラー|登録する|CustomerAddress|DeliveryController|FindBlacklist|blacklist" design_impl_drift_report/findings/f06-20_0306_sheet-16_sheet.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "FindBlacklistByCustomer|entry_regist_error|blacklist|ブラックリスト|mypage_delivery|delivery_confirm" ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php ec-cube-enterprise/src/Eccube/Repository/DtbBlacklistRepository.php ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig`
- 確認コマンド: `rg -n "findBlacklistByCustomer|entry_regist_error|blacklist|ブラックリスト|mypage_delivery|delivery_confirm" pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/DeliveryController.php pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbBlacklistRepository.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/delivery_confirm.twig`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '5612,5650p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php | sed -n '160,212p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Repository/DtbBlacklistRepository.php | sed -n '1,82p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/DeliveryController.php | sed -n '77,122p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbBlacklistRepository.php | sed -n '1,62p'`
