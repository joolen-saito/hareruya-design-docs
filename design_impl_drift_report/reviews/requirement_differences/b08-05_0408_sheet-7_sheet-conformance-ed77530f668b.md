# b08-05_0408_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b08-05_0408_sheet-7_sheet.json#b08-05_0408_sheet-7_sheet-conformance-ed77530f668b`
- 機能: B08-05 B08-05 ポイント差分発生通知
- 観点: ⑦要求網羅・実装違い

## 要旨
設計が外部契約とするバッチ実行コマンド名 customer:batch adjustPointVariance が、実装では eccube:customer:adjust-point-variance として登録されており一致しない。

## 判定理由
設計書『利用者視点の入口』の実行方法として command 名 customer:batch adjustPointVariance が明記されている(1570行)。ec-cube-enterprise の AdjustPointVarianceCommand.php:25 の #[AsCommand(name: ...)] は eccube:customer:adjust-point-variance で登録されている。adjust-point-variance / adjustPointVariance / customer:batch 等で AdjustPointVarianceCommand を確認したが、設計名の登録は存在しない。設計名と実装名が異なるため実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1570-1574` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>入口</th><th>実行方法</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>コンソールのバッチコマンド</td><td><code>customer:batch adjustPointVariance</code></td><td>保有ポイントと履歴合計に差分のある会員を検出し、保有ポイントを履歴合計へ補正して差分一覧を管理者へ通知する。</td></tr></tbody></table></div>
          <p>本機能はHTTPで届く画面を持たない。コマンド名が一致しない場合は処理を行わずに終了する。</p>
          <hr>
          <h2 id="function-design-b08-05-b08-05_batch_customer_customer_adjust_point_variance-処理フロー">処理フロー</h2>
          <h3 id="function-design-b08-05-b08-05_batch_customer_customer_adjust_point_variance-ポイント差分発生通知を実行する-customer-batch-adjustPointVariance">ポイント差分発生通知を実行する（<code>customer:batch adjustPointVariance</code>）</h3>
```

## ec-cube-enterprise 実装
AsCommand 属性で登録される実際のコマンド名
`ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:25-26` — 実装(登録コマンド名)

```php
#[AsCommand(name: 'eccube:customer:adjust-point-variance', description: 'ポイント差分発生通知バッチ')]
class AdjustPointVarianceCommand extends Command
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。AdjustPointVarianceCommand.php:25 の #[AsCommand(name: 'eccube:customer:adjust-point-variance')] を直接確認。設計1570行の入口表『実行方法』は customer:batch adjustPointVariance。rg で src/ 全 AsCommand を横断したが登録済みバッチ30件超は全て eccube: プレフィックス命名で、customer:batch 系コマンドや adjustPointVariance/adjust-point-variance の別名(aliases)登録は皆無。設計名のコマンドは実在しない。設計『リニューアル移行時の扱い』の『挙動参照=現行pf-eccube3』を根拠に customer:batch を legacy 記法と解する反証も検討したが、設計は当該名を ec-cube-enterprise 向け入口表の実行方法欄に明記しており、その名では起動不可という事実は動かない。指摘は維持。
