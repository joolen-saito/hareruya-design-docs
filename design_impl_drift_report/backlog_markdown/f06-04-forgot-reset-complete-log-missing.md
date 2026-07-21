/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：パスワード再発行
課題カテゴリ：実装漏れ
課題：パスワード更新完了時に会員ID・メールアドレス・接続元IPの完了ログが出力されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. `http://localhost:8080/ja/forgot` からパスワード再発行を行い、受信メールの再設定URLへアクセスする
2. 新しいパスワードを入力して変更を完了する
3. アプリケーションログに、パスワード更新完了時の会員ID・メールアドレス・接続元IPが記録されているか確認する

# 期待される挙動【必須】
- パスワード更新成功時、新パスワードを保存しリセットキーを消去した後、更新ログを残して更新完了画面を表示する
- パスワード更新完了ログには会員ID、メールアドレス、接続元IPを記録する

# 現在の挙動【必須】
- ec-cube-enterprise の `ForgotController::reset()` は、再設定フォームが妥当な場合にパスワードをハッシュ化し、`registration_view` の `password` と `reset_key = null` を更新する。その後 `FRONT_FORGOT_RESET_COMPLETE` イベントを dispatch して `forgot_resetcomplete` へリダイレクトするが、更新成功パスに `log_info()` 等の完了ログ出力はない。同じコントローラの再設定メール送信時には会員識別子・メール・接続元IPを `log_info('send reset password mail to:...')` で出力しているため、更新完了時のログだけが欠落している。

ec-cube-enterprise 再設定メール送信時はログ出力あり: `ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:96-103`
```php
                // 完了URLの生成
                $reset_url = $this->generateUrl('forgot_reset', ['reset_key' => $resetKey], UrlGeneratorInterface::ABSOLUTE_URL);

                // メール送信
                $this->mailService->sendPasswordResetNotificationMail($Customer, $reset_url);

                // ログ出力
                log_info('send reset password mail to:'."{$Customer->getSecretKey()} {$Customer->getEmail()} {$request->getClientIp()}");
```

ec-cube-enterprise パスワード更新成功パスにログ出力がない: `ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:204-229`
```php
        if ($form->isSubmitted() && $form->isValid()) {
            // リセットキー・入力メールアドレスで会員情報検索
            $Customer = $this->registerCustomerViewRepository
                ->getRegularCustomerByResetKey($reset_key, $form->get('login_email')->getData());
            if ($Customer) {
                // パスワードの発行・更新
                $password = $this->passwordHasher->hashPassword($Customer, $form->get('password')->getData());

                $this->entityManager->getConnection()->executeQuery(
                    'UPDATE registration_view SET password = :password, reset_key = :reset_key WHERE secret_key = :secret_key',
                    [
                        'password' => $password,
                        'secret_key' => $Customer->getSecretKey(),
                        'reset_key' => null,
                    ]
                );

                $event = new EventArgs(
                    [
                        'Customer' => $Customer,
                    ],
                    $request
                );
                $this->eventDispatcher->dispatch($event, EccubeEvents::FRONT_FORGOT_RESET_COMPLETE);

                return $this->redirectToRoute('forgot_resetcomplete');
```
- ベース実装 pf-eccube3 の `ForgotController::resetComplete()` は、フォーム検証後にパスワードを暗号化して `resetKey` を `null` にし、永続化した直後に `$app['monolog']->addInfo('reset password complete:' . "{$customer->getId()} {$customer->getEmail()} {$request->getClientIp()}")` を出力してから完了画面を表示する。

ベース実装 pf-eccube3 パスワード更新完了ログ: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ForgotController.php:138-157`
```php
        // パスワードの発行・更新
        $pass = $form['password']->getData();
        $customer->setPassword($pass);

        // 発行したパスワードの暗号化
        if (is_null($customer->getSalt())) {
            $customer->setSalt($app['eccube.repository.customer']->createSalt(self::SALT_BYTE));
        }
        $encPass = $app['eccube.repository.customer']->encryptPassword($app, $customer);
        $customer->setPassword($encPass);
        $customer->setResetKey(null);

        // パスワードを更新
        $app['orm.em']->persist($customer);
        $app['orm.em']->flush();

        // ログ出力
        $app['monolog']->addInfo('reset password complete:' . "{$customer->getId()} {$customer->getEmail()} {$request->getClientIp()}");

        return $app->render('Forgot/resetcomplete.twig');
```

ベース実装 pf-eccube3 再設定完了ルート: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:120-121`
```php
        $c->match('/forgot/resetcomplete/{resetKey}', '\Plugin\HareruyaEc\Controller\ForgotController::resetComplete')
            ->bind('forgot_resetcomplete');
```

# 根拠
- 設計：
  - パスワード更新成功時は更新ログを残して完了画面へ進む: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2473-2474`
  - ログ・監査で完了ログの記録内容を規定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2520-2521`
- ec-cube-enterprise：
  - 更新成功後はイベントdispatchと完了画面リダイレクトのみ: `ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:204-229`
  - 同コントローラにはメール送信時ログはあるが更新完了ログはない: `ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:96-103`
- ベース実装：
  - pf-eccube3は更新完了直後に会員ID・メール・接続元IPのログを出力する: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ForgotController.php:150-157`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-04_0306_sheet-6_sheet.json#f06-04_0306_sheet-6_sheet-conformance-117b757b478f'`
- 確認コマンド: `rg -n "完了ログ|更新完了|パスワード.*ログ|アクセス元|グローバルIP|password.*log|log_info|sendPasswordReset|resetcomplete|reset\(" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php ec-cube-enterprise/src/Eccube/Service ec-cube-enterprise/src/Eccube/Event pf-eccube3/app/Plugin/HareruyaEc/Controller/ForgotController.php pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "reset password complete|password reset complete|パスワード更新完了|forgot_resetcomplete|send reset password mail to|log_info\(|addInfo\(" ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php ec-cube-enterprise/src/Eccube/Service ec-cube-enterprise/src/Eccube/EventListener ec-cube-enterprise/src/Eccube/EventSubscriber`
- 確認コマンド: `rg -n "reset password complete|send reset password mail to|Un active customer try send reset password email|resetComplete|forgot_resetcomplete" pf-eccube3/app/Plugin/HareruyaEc/Controller/ForgotController.php pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '2471,2478p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '2487,2521p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php | sed -n '70,180p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php | sed -n '180,238p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/ForgotController.php | sed -n '1,220p'`
