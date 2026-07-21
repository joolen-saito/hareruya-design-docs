# b02-05_0404_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-05_0404_sheet-7_sheet.json#b02-05_0404_sheet-7_sheet-conformance-d1d5ddadf70c`
- 機能: B02-05 B02-05 お気に入り商品セール通知
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は日時付きの開始・完了コンソール出力を求めるが、実装は完了相当の success のみで開始出力がなく日時も付与しない。

## 判定理由
設計ログ・監査表(1444行)は「開始・完了→開始・完了のコンソール出力（日時付き）」、入出力表(1431行)も成功時出力に開始・完了のコンソール出力を含める。実装 FavoriteSaleNotificationCommand::execute は handle() 実行後に $io->success(成功メッセージ)を出すのみで、開始メッセージが存在せず日時(DateTime/date/format)も付与しない。同ファイルを開始/DateTime/date/format で検索してもライセンスヘッダ以外にヒットせず、日時付き開始・完了出力は実装されていない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1444-1444` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>開始・完了</td><td>開始・完了のコンソール出力（日時付き）。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
success のみで start 出力も日時もない
`ec-cube-enterprise/src/Eccube/Command/FavoriteSaleNotificationCommand.php:44-62` — 完了のみ・開始/日時なし

```php
    {
        $io = new SymfonyStyle($input, $output);

        try {
            $count = $this->batchFavoriteSaleNotificationAction->handle();
        } catch (\Exception $e) {
            $io->error('お気に入り商品セール通知でエラーが発生しました: '.$e->getMessage());

            return Command::FAILURE;
        }

        if ($count === 0) {
            $io->success('セール中のお気に入り商品はありませんでした。');
        } else {
            $io->success(sprintf('お気に入り商品セール通知を%d名に送信しました。', $count));
        }

        return Command::SUCCESS;
    }
```

## 不在確認コマンド

- `rg -n 'writeln|開始|DateTime|date\(|format' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/FavoriteSaleNotificationCommand.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。FavoriteSaleNotificationCommand::execute(42-62行)は $io = new SymfonyStyle 後に try{handle()} し、末尾で $io->success(...)のみ。開始メッセージ・日時(DateTime/date/format)は皆無。呼ばれる handle() は $io を受け取らずコンソール出力を一切持たない。基底は Symfony の Command 直継承(35行)で、開始/完了に日時を付す共通ラッパやイベントリスナも無い(ConsoleEvents/console.command リスナ grep でヒットなし)。したがって設計(ログ・監査表 1444行『開始・完了のコンソール出力(日時付き)』、入出力 1431行の成功時出力)の日時付き開始・完了出力は実装されていない。別実装なし、指摘維持。
