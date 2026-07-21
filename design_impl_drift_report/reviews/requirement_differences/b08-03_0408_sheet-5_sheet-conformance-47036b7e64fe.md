# b08-03_0408_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b08-03_0408_sheet-5_sheet.json#b08-03_0408_sheet-5_sheet-conformance-47036b7e64fe`
- 機能: B08-03 B08-03 ポイント有効期限通知
- 観点: ⑦要求網羅・実装違い

## 要旨
開始・完了のコンソール出力は日時付きの設計だが、実装は固定文言のみで日時を含まない。

## 判定理由
設計(1375-1376行,ログ・監査表)は『開始・完了→開始・完了のコンソール出力（日時付き）。』を要求する。実装(PointExpireNotificationCommand.php 38行)の開始出力は $io->text('ポイント有効期限通知バッチ開始')、完了出力(51行)は $io->success('ポイント有効期限通知処理が完了しました。') で、いずれも固定文字列であり日時(DateTime/date())を連結していない。Command 内に date()/DateTime の使用は無く、Action(PointExpireNotificationAction) の完了ログも $this->logger->info('ポイント有効期限通知処理完了') と日時無しの固定文言。SymfonyStyle の text/success は日時を自動付与しないため、コンソール出力に日時は現れない実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1375-1376` — 設計要求(ログ・監査)

```html
          <h2 id="function-design-b08-03-b08-03_batch_customer_customer_point_expire_notification-ログ・監査">ログ・監査</h2>
          <div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>開始・完了</td><td>開始・完了のコンソール出力（日時付き）。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
固定文言のみ
`ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:38-38` — 開始のコンソール出力(日時無し)

```php
        $io->text('ポイント有効期限通知バッチ開始');
```

固定文言のみ
`ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:51-51` — 完了のコンソール出力(日時無し)

```php
        $io->success('ポイント有効期限通知処理が完了しました。');
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。PointExpireNotificationCommand.php:38 の開始出力 $io->text('ポイント有効期限通知バッチ開始') と :51 の完了出力 $io->success('ポイント有効期限通知処理が完了しました。') はいずれも固定文言で、Command 内に date()/DateTime の使用は無い(実装を全読して確認)。日時付きの変種は Action の $this->logger->info('ポイント有効期限通知処理完了')(INFO レベル)のみだが、ConsoleHandler は NORMAL verbosity で WARNING 以上しか出さないため INFO はコンソールに現れず、しかもバッチ開始側には対応するログ出力自体が存在しない。よって実際のコンソールの開始・完了出力に日時は付かず、要求『開始・完了のコンソール出力（日時付き）』は満たされない。反証(別実装・monolog console ブリッジ)を検討したが日時付きコンソール出力は確認できず、指摘は維持。
