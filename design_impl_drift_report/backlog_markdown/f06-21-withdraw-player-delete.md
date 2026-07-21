/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：退会
課題カテゴリ：実装漏れ
課題：退会成立時にdtb_playerの選手情報が削除されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 会員としてログインし、マイページの退会画面( http://localhost:8080/ja/mypage/withdraw )へ遷移する
2. 退会確認画面で現在のパスワードを入力し、「退会する」ボタンを押下する
3. 退会完了後、該当会員に紐づくdtb_player行が削除されているかDBで確認する

# 期待される挙動【必須】
- 退会成立時、会員のメールアドレスをダミー値へ置換し、削除フラグを有効にする
- 同じ退会処理内で、該当会員に紐づくdtb_playerの選手情報を削除する
- 会員の論理削除と選手情報削除を同一トランザクションで確定する

# 現在の挙動【必須】
- ec-cube-enterpriseの退会確定処理はCustomerのステータス変更とメールアドレスのダミー化を行ってflushするが、DtbPlayerを取得して削除する処理がない。

ec-cube-enterprise 退会確定処理: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/WithdrawController.php:122-129`
```php
                    $email = $Customer->getEmail();

                    // 退会ステータスに変更
                    $CustomerStatus = $this->customerStatusRepository->find(CustomerStatus::WITHDRAWING);
                    $Customer->setStatus($CustomerStatus);
                    $Customer->setEmail(StringUtil::random(60).'@dummy.dummy');

                    $this->entityManager->flush();
```

ec-cube-enterprise 退会完了イベント: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/WithdrawController.php:133-139`
```php
                    $event = new EventArgs(
                        [
                            'form' => $form,
                            'Customer' => $Customer,
                        ], $request
                    );
                    $this->eventDispatcher->dispatch($event, EccubeEvents::FRONT_MYPAGE_WITHDRAW_INDEX_COMPLETE);
```

ec-cube-enterprise CustomerとDtbPlayerの関連: `ec-cube-enterprise/src/Eccube/Entity/Customer.php:1014-1015`
```php
        #[ORM\OneToOne(targetEntity: DtbPlayer::class, mappedBy: 'Customer')]
        private ?DtbPlayer $Player = null;
```
- ベース実装(pf-eccube3)では、同じ退会確定処理でPlayer Repositoryから該当Customerのdtb_playerを取得し、EntityManagerでremoveしてからflush/commitしている。

ベース実装 pf-eccube3 退会時のdtb_player削除: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php:86-96`
```php
                    // 会員削除
                    $email = $Customer->getEmail();
                    //dtb_playerから該当データを削除
                    $dtbPlayer = $app['hareruya_ec.repository.player']->findOneByCustomer_id($Customer['id']);
                    $app['orm.em']->remove($dtbPlayer);

                    // メールアドレスにダミーをセット
                    $Customer->setEmail(Str::random(60) . '@dummy.dummy');
                    $Customer->setDelFlg(Constant::ENABLED);
                    $app['orm.em']->flush();
                    $app['orm.em']->commit();
```

# 根拠
- 設計：
  - 退会成立時の副作用: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6107-6109`
  - 会員と選手情報のデータ整合性: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6129-6130`
  - DBカラム上のdtb_player削除要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6139-6141`
- ec-cube-enterprise：
  - 退会確定処理: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/WithdrawController.php:122-129`
  - CustomerとDtbPlayerの関連: `ec-cube-enterprise/src/Eccube/Entity/Customer.php:1014-1015`
- ベース実装：
  - 退会時のdtb_player削除: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php:86-96`

# 確認メモ
- 確認コマンド: `rg -n "FRONT_MYPAGE_WITHDRAW_INDEX_COMPLETE|DtbPlayer|dtbPlayer|remove\\(" ec-cube-enterprise/src/Eccube/Controller/Front/Mypage ec-cube-enterprise/src/Eccube/EventSubscriber ec-cube-enterprise/app`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html | sed -n '6104,6144p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/WithdrawController.php | sed -n '116,145p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php | sed -n '82,100p'`
- ec-cube-enterprise側では退会完了イベントのdispatchは確認できるが、同一検索範囲内にDtbPlayer削除の購読処理は見当たらない。
- Customer::$PlayerはOneToOne mappedByのみで、退会時のcascade removeを示す指定は確認できない。
