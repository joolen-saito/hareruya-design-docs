# b02-05_0404_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: medium）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-05_0404_sheet-7_sheet.json#b02-05_0404_sheet-7_sheet-conformance-3caf4c948a18`
- 機能: B02-05 B02-05 お気に入り商品セール通知
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は抽出・送信時のエラーをコンソールに出力するとするが、送信時例外は log_error で握りつぶされ処理継続しコンソールに出ない。

## 判定理由
設計エラー処理表(1441行)は「抽出・送信時のエラー→エラーメッセージをコンソールに出力する」とする。実装では抽出例外は Command 側 try/catch で $io->error に到達しコンソール出力されるが、会員ごとの送信例外は BatchFavoriteSaleNotificationAction の内側 try/catch(56-58行)で catch (\Throwable $e) → log_error に customer_id と message を残して continue し、再throwしない。よって送信時エラーはログファイル止まりでコンソールに出力されず、コマンドは成功扱いで完了し得る。設計の失敗時出力(コンソール)を送信エラーについて満たさない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1441-1441` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>コマンド名が未指定・不一致</td><td>処理を行わずに終了する（コンソールに不正コマンドの旨を出力）。</td></tr><tr><td>抽出・送信時のエラー</td><td>エラーメッセージをコンソールに出力する。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
log_error で記録し continue、再throwなし
`ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:53-59` — 送信例外の握りつぶし

```php
            try {
                $this->mailService->sendFavoriteSaleNotificationMail($Customer, $customerData);
                $sentCount++;
            } catch (\Throwable $e) {
                log_error('お気に入りセール通知メール送信失敗', ['customer_id' => $customerId, 'message' => $e->getMessage()]);
            }
        }
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。BatchFavoriteSaleNotificationAction.php:53-58 で会員ごとの送信例外は catch(\Throwable $e)→log_error('お気に入りセール通知メール送信失敗',[...])→continue し、再throwしない。Command 側 FavoriteSaleNotificationCommand::execute の try/catch(47-53行)は handle() 全体の \Exception のみ捕捉し $io->error に到達するが、ループ内送信例外はそこへ伝播しない。log_error は EC-CUBE のロガー(var/log)向けでありコンソール(SymfonyStyle)出力ではない。コンソール事件を橋渡しする console.command 系イベントリスナも存在しない(grep で ConsoleEvents/console.terminate ヒットなし)。よって送信時エラーはコンソール未出力でコマンドは success 扱いになり得、設計(エラー処理表: 抽出・送信時のエラー→コンソール出力)を送信エラーについて満たさない。別経路なし。
