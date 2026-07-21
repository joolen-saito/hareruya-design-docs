# b08-05_0408_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b08-05_0408_sheet-7_sheet.json#b08-05_0408_sheet-7_sheet-conformance-9257c6aafd7a`
- 機能: B08-05 B08-05 ポイント差分発生通知
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は送信時エラーのコンソール出力を要求するが、メール送信例外は MailService 内で log_critical のみ行い再throwしないためコンソールに到達しない。

## 判定理由
設計書『エラー処理』は「取得・送信時のエラーはエラーメッセージをコンソールに出力する。」(1600行)を要求。取得側は AdjustPointVarianceAction::handle の getCustomersWithPointDifferential(35行)およびトランザクション catch(67-70行)で throw されるため Command の $io->error(43-46行)に到達する。しかし送信は commit 後 line73 の sendAdjustPointVarianceMail 経由で、MailService::sendAdjustPointVarianceMail の catch(TransportExceptionInterface $e)(1363行)が log_critical($e->getMessage())(1364行)を呼ぶだけで再throwしない。よって送信時エラーは握りつぶされ Command のコンソール出力に伝播しない。送信時エラーに限り設計要求を満たさず実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1599-1600` — 設計要求

```html
          <h2 id="function-design-b08-05-b08-05_batch_customer_customer_adjust_point_variance-エラー処理">エラー処理</h2>
          <div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>コマンド名が未指定・不一致</td><td>処理を行わずに終了する。</td></tr><tr><td>差分なし</td><td>補正・通知を行わず完了する。</td></tr><tr><td>取得・送信時のエラー</td><td>エラーメッセージをコンソールに出力する。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
TransportExceptionInterface を log_critical のみで処理し再throwしない
`ec-cube-enterprise/src/Eccube/Service/MailService.php:1360-1365` — 実装(送信例外の握りつぶし)

```php
        try {
            $this->mailer->send($message);
            log_info('ポイント差分発生通知メール送信完了');
        } catch (TransportExceptionInterface $e) {
            log_critical($e->getMessage());
        }
```

送信はトランザクション確定後に呼ばれ、例外は伝播しない
`ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:73-73` — 呼び出し元(commit後にメール送信)

```php
        $this->mailService->sendAdjustPointVarianceMail($pointVarianceList);
```

Throwable 伝播時のみ機能する
`ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:42-46` — Command側のエラー出力(送信例外には到達しない)

```php
        } catch (\Throwable $e) {
            $io->error([
                'ポイント差分発生通知処理でエラーが発生しました',
                $e->getMessage(),
            ]);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。MailService::sendAdjustPointVarianceMail は1318行定義、送信 catch は1363-1364行 catch(TransportExceptionInterface $e){ log_critical($e->getMessage()); } で再throwなし(他約30メソッドと同一の握りつぶしパターン)。log_critical は EC-CUBE のログ補助関数で例外を投げない。AdjustPointVarianceAction.php では sendAdjustPointVarianceMail 呼び出しが73行=トランザクション try/catch(45-71行)確定後にあり、送信例外は Command の try(41行) 内を通るものの MailService で吸収され handle() から伝播しない。よって Command の $io->error(42-46行) に送信時エラーは到達しない。別ルートの再throwや送信エラーのコンソール出力経路を探したが存在せず。設計1600行『送信時のエラーはコンソールに出力』を送信に限り満たさない。指摘は維持。
