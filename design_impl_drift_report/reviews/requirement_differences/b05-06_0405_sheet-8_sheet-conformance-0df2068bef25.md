# b05-06_0405_sheet-8_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-06_0405_sheet-8_sheet.json#b05-06_0405_sheet-8_sheet-conformance-0df2068bef25`
- 機能: B05-06 B05-06 ポイント二重登録チェック
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は送信時エラーをコンソール出力すると要求するが、メール送信例外は MailService 内で catch され log_critical のみで Command に伝播せずコンソール出力されない。

## 判定理由
設計は失敗時出力/エラー処理として『取得・送信時のエラー → エラーメッセージをコンソールに出力する』と要求する（1732 行および 1742 行）。実装では取得系エラーは CheckDuplicatePointAction::handle() から投げられ Command が \Throwable を catch して $io->error() でコンソール出力する（src/Eccube/Command/CheckDuplicatePointCommand.php:50-57）。しかしメール送信時の TransportExceptionInterface は MailService::sendOrderDuplicateNotificationMail() 内で catch され log_critical($e->getMessage()) のみ実行、再throwされず戻り値 void（src/Eccube/Service/MailService.php:2273-2275）。よって送信時エラーは Command に伝播せず $io->error() に到達しないため、設計が求めるコンソールへのエラーメッセージ出力にならない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1742-1742` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>コマンド名が未指定・不一致</td><td>処理を行わずに終了する。</td></tr><tr><td>該当なし</td><td>何もせず完了する。</td></tr><tr><td>取得・送信時のエラー</td><td>エラーメッセージをコンソールに出力する。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
TransportExceptionInterface を catch し log_critical のみ。再throwせず void
`ec-cube-enterprise/src/Eccube/Service/MailService.php:2273-2275` — 実装(送信エラーを握りつぶす)

```php
        } catch (TransportExceptionInterface $e) {
            log_critical($e->getMessage());
        }
```

handle() 由来の例外のみ $io->error() でコンソール出力。送信例外は届かない
`ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:50-57` — 実装(Command のエラー出力)

```php
        } catch (\Throwable $e) {
            $io->error([
                'ポイント二重登録チェック処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証は失敗し指摘は維持。実装は MailService::sendOrderDuplicateNotificationMail() 内で TransportExceptionInterface を catch し log_critical($e->getMessage()) のみ（void, 再throwなし; src/Eccube/Service/MailService.php:2270-2275）、CheckDuplicatePointAction::handle() 経由でも例外は Command に届かず $io->error()（CheckDuplicatePointCommand.php:50-57）に到達しない。log_critical はログファイル出力でコンソールではない。さらに設計が正とする現行 pf-eccube3 は逆にコンソール出力する: sendOrderDuplicateNotificationMail() は $this->app->mail() を try/catch 無しで呼び（MailService.php:1465）、OrderBatch::execute() も $batch->execute() を try/catch 無しで実行（OrderBatch.php:51）するため送信例外は Symfony コンソールへ未捕捉で伝播する。よって literal 設計要求（1732,1742行）と現行挙動の双方が送信エラーのコンソール出力を求めるのに対し、enterprise 実装だけが握りつぶしており実装違い。別出力経路も無し。
