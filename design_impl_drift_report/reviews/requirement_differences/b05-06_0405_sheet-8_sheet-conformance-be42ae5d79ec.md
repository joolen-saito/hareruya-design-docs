# b05-06_0405_sheet-8_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-06_0405_sheet-8_sheet.json#b05-06_0405_sheet-8_sheet-conformance-be42ae5d79ec`
- 機能: B05-06 B05-06 ポイント二重登録チェック
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は開始・完了のコンソール出力を日時付きで求めるが、実装の開始/完了メッセージには日時の生成・付与処理がない。

## 判定理由
設計はログ・監査の開始・完了について『開始・完了のコンソール出力（日時付き）』を要求する（1745 行）。実装では開始時に $io->text('ポイント二重登録チェックバッチ開始')（src/Eccube/Command/CheckDuplicatePointCommand.php:46）、完了時に $io->success('ポイント二重登録は検出されませんでした。') もしくは sprintf('ポイント二重登録が検出されました。（%d件）', $count)（同ファイル 60,62 行）を出力するが、いずれも日時の生成・付与処理がなく日時が付いていない。コマンド内に date/DateTime/format 等の日時生成呼び出しは無い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1745-1745` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>開始・完了</td><td>開始・完了のコンソール出力（日時付き）。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
開始メッセージに日時なし
`ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:46-46` — 実装(開始出力)

```php
        $io->text('ポイント二重登録チェックバッチ開始');
```

完了メッセージに日時なし
`ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:60-62` — 実装(完了出力)

```php
            $io->success('ポイント二重登録は検出されませんでした。');
        } else {
            $io->success(sprintf('ポイント二重登録が検出されました。（%d件）', $count));
```

## 不在確認コマンド

- `rg -n 'date|DateTime|format\(|Y-m-d|H:i' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証は失敗し指摘は維持。実装の開始 $io->text('ポイント二重登録チェックバッチ開始')（CheckDuplicatePointCommand.php:46）と完了 $io->success(...)（同60,62行）に日時が無く、Command・Action ともに date/DateTime/format/Y-m-d/H:i の呼び出しが皆無であることを rg で確認、コンソール出力にタイムスタンプを付与する ConsoleEvent 系サブスクライバも存在しない。設計が正とする pf-eccube3 の OrderBatch::execute() は成功時にコンソール開始/完了出力を持たない一方、コマンド不一致時のコンソール文言に `date('Y/m/d H:i')` を前置しており（OrderBatch.php:42,45）、現行のバッチコンソール出力規約は日時前置を含む。設計 1745行『開始・完了のコンソール出力（日時付き）』の開始/完了コンソール出力は enterprise 実装の $io->text/$io->success に対応し、追加要求の日時のみが未実装。別実装で日時を補う箇所も無いため、日時付き要求は満たされていない。
