# b08-05_0408_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b08-05_0408_sheet-7_sheet.json#b08-05_0408_sheet-7_sheet-conformance-fc0bb67a8212`
- 機能: B08-05 B08-05 ポイント差分発生通知
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は開始・完了のコンソール出力に日時付与を要求するが、実装は固定文言のみで日時を付与しない。

## 判定理由
設計書『ログ・監査』の記録内容は「開始・完了のコンソール出力（日時付き）。」(1603行)。実装 AdjustPointVarianceCommand.php では開始時に $io->text('ポイント差分発生通知バッチ開始')(38行)、完了時に $io->success('ポイント差分発生通知処理が完了しました。')(51行) を出力するのみで、date()/format等による現在日時の付与処理は同コマンド内に存在しない。処理本体の AdjustPointVarianceAction.php も logger->info のみで開始・完了のコンソール日時出力はない。日時が欠落しており実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1602-1603` — 設計要求

```html
          <h2 id="function-design-b08-05-b08-05_batch_customer_customer_adjust_point_variance-ログ・監査">ログ・監査</h2>
          <div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>開始・完了</td><td>開始・完了のコンソール出力（日時付き）。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
固定文言のみで日時なし
`ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:38-51` — 実装(開始・完了出力)

```php
        $io->text('ポイント差分発生通知バッチ開始');

        try {
            $this->adjustPointVarianceAction->handle();
        } catch (\Throwable $e) {
            $io->error([
                'ポイント差分発生通知処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $io->success('ポイント差分発生通知処理が完了しました。');
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。Command と Action を rg 'date\(|DateTime|format\(|Carbon' で走査し日時付与処理ゼロを確認。開始出力 $io->text('ポイント差分発生通知バッチ開始')(38行)・完了 $io->success('ポイント差分発生通知処理が完了しました。')(51行) は固定文言のみで、SymfonyStyle は自動でタイムスタンプを前置しない。Action の logger も対象なし時の info のみで開始・完了の日時ログを持たない。設計1603行『開始・完了のコンソール出力（日時付き）』を満たさない。日時をインフラ/cron 層が付与するという反証余地はあるが、設計は『コンソール出力（日時付き）』と明示しており命令自身が日時を出していない事実は確認済み。指摘は維持（ただし severity は軽微）。
