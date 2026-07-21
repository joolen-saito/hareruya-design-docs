# b05-03_0405_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-03_0405_sheet-5_sheet.json#b05-03_0405_sheet-5_sheet-conformance-3ba53b7c8364`
- 機能: B05-03 B05-03 店頭注文番号初期化
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は起動ログに日時を含め完了ログを出さないとするが、実装は起動ログに日時を含めず、かつ成功時の完了ログを出力する。

## 判定理由
設計書は line 1363（ログ・監査）で『バッチコマンドの起動時に日時付きのコンソール出力を行う』、line 1364 で『本バッチ独自の件数ログ・完了ログは出力しない』とする。一方 TruncateWaitingNumberCommand::execute() は line 38 で $io->text('店舗注文番号初期化バッチ開始') と固定文言のみを出力し日時を含まず、line 51 で $io->success('店舗注文番号初期化処理が完了しました。') と設計が禁じる完了ログを出力している。同ファイルに date(/DateTime/format( 等の日時付与処理はなく、起動ログの日時欠落と完了ログ出力の双方が設計と異なる実装違いが事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1363-1364` — 設計要求（ログ・監査）

```html
          <div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>起動</td><td>バッチコマンドの起動時に日時付きのコンソール出力を行う。</td></tr></tbody></table></div>
          <p>本バッチ独自の件数ログ・完了ログは出力しない。</p>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:38-51` — 実装（起動ログに日時なし・完了ログ出力）

```php
        $io->text('店舗注文番号初期化バッチ開始');

        try {
            $this->truncateWaitingNumberAction->handle();
        } catch (\Throwable $e) {
            $io->error([
                '店舗注文番号初期化処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $io->success('店舗注文番号初期化処理が完了しました。');
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず指摘は維持。起動ログは line 38 `$io->text('店舗注文番号初期化バッチ開始')` の固定文言のみで日時を含まず、同ファイルおよび EventListener/EventSubscriber・monolog に日時を付与する ConsoleFormatter/console 購読者は存在しない(rg 該当なし)。さらに line 51 `$io->success('店舗注文番号初期化処理が完了しました。')` で設計 line 1364『本バッチ独自の件数ログ・完了ログは出力しない』が禁じる完了ログを出力。設計 line 1363『起動時に日時付きのコンソール出力』も未充足。完了ログ出力の一点だけでも設計違反が確定し、二重に成立。designQuote は該当行に実在。実装違いは事実。
