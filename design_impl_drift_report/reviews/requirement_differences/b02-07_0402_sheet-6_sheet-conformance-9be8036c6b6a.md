# b02-07_0402_sheet-6_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-07_0402_sheet-6_sheet.json#b02-07_0402_sheet-6_sheet-conformance-9be8036c6b6a`
- 機能: B02-07 B02-07 週間在庫履歴更新バッチ
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は開始・完了を日時付きでコンソール出力する要求だが、実装は完了時の success 出力のみで開始出力も日時付与も無い。

## 判定理由
設計(ログ・監査)は『開始・完了』のタイミングで『開始・完了のコンソール出力（日時付き）』を要求。実装 UpdateWeeklyStockHistoryCommand::execute は handle() を try で実行し、例外時に $io->error、正常終了時に $io->success('週間在庫履歴の更新が完了しました。') を出すのみ。開始時のコンソール出力は無く、完了出力にも日時が含まれない。反証検索 rg で command/action 内の開始・writeln・note・info・date出力を確認したが、BatchUpdateWeeklyStockHistoryAction 内の \DateTime はクエリ用 dateStr の生成に使われるだけで、開始/完了ログの日時出力には使われていない。設計要求と実装の出力が食い違う実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html:1374-1374` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>開始・完了</td><td>開始・完了のコンソール出力（日時付き）。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
完了の success 出力のみ。開始出力・日時無し
`ec-cube-enterprise/src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:47-58` — 実装(コマンド)

```php

        try {
            $this->batchUpdateWeeklyStockHistoryAction->handle();
        } catch (\Throwable $e) {
            $io->error('週間在庫履歴の更新でエラーが発生しました: '.$e->getMessage());

            return Command::FAILURE;
        }

        $io->success('週間在庫履歴の更新が完了しました。');

        return Command::SUCCESS;
```

## 不在確認コマンド

- `rg -n '開始|start|DateTime|date\(|writeln|->text\(|->note\(|->info\(' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。実装確認済み。UpdateWeeklyStockHistoryCommand::execute(44-59行)は handle() を try 実行し、例外時 $io->error、正常時 $io->success('週間在庫履歴の更新が完了しました。')(56行)を出すのみ。引用は正確。開始時のコンソール出力は皆無、完了出力にも日時は含まれない。本コマンドは Symfony\Console\Command を直接 extend し、開始/完了ログを持つ独自基底クラスや trait は無い。rg 'ConsoleEvents|onConsoleCommand|onConsoleTerminate' を src/Eccube 全体で走らせたが該当 Subscriber は 0 件で、コマンド外からの日時付き開始/完了ログ注入も存在しない。BatchUpdateWeeklyStockHistoryAction 内の \DateTime(57行)はクエリ用 dateStr('Y-m-d 00:00:00')生成専用で、開始/完了ログ出力には使われない(rg 'writeln|->text|->note|->info|DateTime|date(' で確認)。設計 1373-1374 ログ・監査は『開始・完了のコンソール出力（日時付き）』を要求。指摘は維持。
