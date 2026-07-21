# b02-01_0404_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-01_0404_sheet-3_sheet.json#b02-01_0404_sheet-3_sheet-conformance-daa1bb0772cd`
- 機能: B02-01 B02-01 期間別販売数集計
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は開始・完了のコンソール出力を日時付きで行う要求だが、実装は完了時に日時なしの成功メッセージを出力するのみで、開始出力が存在しない。

## 判定理由
設計のログ・監査表(line 955)は開始・完了のコンソール出力(日時付き)を要求。実装 AggregateSalesCommand::execute() は成功時に `$io->success('期間別販売数集計が完了しました。')` を出すのみ(AggregateSalesCommand.php:56)で、日時は含まれず、開始出力も無い。呼び出し先 handle()(BatchAggregateSalesAction) にも echo/date による開始・完了ログは無い。この集計経路には date( や『実行開始/実行終了』相当の出力が存在しないことを確認。よって日時付き開始・完了出力が欠落した実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:955-955` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>開始・完了</td><td>開始・完了のコンソール出力（日時付き）。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
success メッセージのみ
`ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:56-56` — 完了出力(日時なし・開始なし)

```php
        $io->success('期間別販売数集計が完了しました。');
```

## 不在確認コマンド

- `rg -n 'date\(|実行開始|実行終了|開始|完了' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。設計 line955 ログ・監査『開始・完了→開始・完了のコンソール出力（日時付き）』を実在確認。実装 AggregateSalesCommand::execute() は成功時 $io->success('期間別販売数集計が完了しました。')(:56) と例外時 $io->error(...) のみで、開始出力も日時も無い。呼び先 handle()/getSalesForAggregate に echo/date/writeln 無し。全コマンド共通の開始・完了ログlistenerを疑い LogListener を確認したが getSubscribedEvents は KernelEvents(REQUEST/RESPONSE/CONTROLLER/TERMINATE/EXCEPTION)のみで ConsoleEvents 非対応、コンソールコマンドの開始・完了は記録しない。日時付き開始・完了出力が欠落。指摘は維持。
