# b05-07_0405_sheet-9_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-07_0405_sheet-9_sheet.json#b05-07_0405_sheet-9_sheet-conformance-5742cecbe8b3`
- 機能: B05-07 B05-07 ポイント利用未反映チェック
- 観点: ⑦要求網羅・実装違い

## 要旨
設計はバッチ開始・完了ログを日時付きでコンソール出力することを要求しているが、実装は開始・完了メッセージを日時なしで出力している。

## 判定理由
設計書 sheet-9 のログ・監査（line 1874）は「開始・完了のコンソール出力（日時付き）。」を要求。対象コマンド CheckNotReflectedPointUsageCommand::execute() では、開始時に line 52 で `$io->text('ポイント利用未反映チェックバッチ開始')`、完了時に line 66/68 で検出有無の success メッセージを出力するが、いずれも日時を含まない。同コマンドファイルに対し `rg -n 'date|DateTime|format\(|strftime|Y-m-d|H:i'` を実行したが一致なし（exit 1）で、日時付与の処理が存在しないことを確認した。出力自体はあるが日時が欠落しているため実装違い。disputedExclusion は false で Ph2 除外指定もない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1873-1874` — 設計要求

```html
          <h2 id="function-design-b05-07-b05-07_batch_order_order_check_not_reflected_point-ログ・監査">ログ・監査</h2>
          <div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>開始・完了</td><td>開始・完了のコンソール出力（日時付き）。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
開始時のコンソール出力に日時が付与されていない
`ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:52-52` — 実装（開始ログ・日時なし）

```php
        $io->text('ポイント利用未反映チェックバッチ開始');
```

完了時の success 出力にも日時が付与されていない
`ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:66-68` — 実装（完了ログ・日時なし）

```php
            $io->success('ポイント利用未反映は検出されませんでした。');
        } else {
            $io->success(sprintf('ポイント利用未反映が検出されました。（%d件）', $count));
```

## 不在確認コマンド

- `rg -n 'date|DateTime|format\(|strftime|Y-m-d|H:i' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を複数試みたが崩せず、指摘を維持する。(1) 引用の正しさ: CheckNotReflectedPointUsageCommand.php line52 は $io->text('ポイント利用未反映チェックバッチ開始')、line66/68 は $io->success の検出有無メッセージで、いずれも引用どおり存在し日時なし。設計 line1874 の表『開始・完了｜開始・完了のコンソール出力（日時付き）。』も実在を確認。(2) 別実装の存在: 同ファイルを rg 'date|DateTime|format\(|strftime|Y-m-d|H:i|now|Carbon|time\(' したが exit1（該当なし）。開始/完了の出力は $io->text/$io->success 直呼びで logger 経由でない。Action(CheckNotReflectedPointUsageAction) の logger は '対象なし' info を1件記録するのみで、コンソール出力でも開始ログでもなく日時付き要求を満たさない。src/Eccube/EventListener・Command に ConsoleEvents/ConsoleCommandEvent/addSubscriber の共通タイムスタンプ出力機構は無く、monolog 設定にも console_handler(ConsoleHandler) は存在しない。(3) 設計側の除外: 近傍 line1850-1883 を確認したが Ph2/対象外/現行踏襲の注記なし、disputedExclusion=false。むしろ兄弟コマンド OtcOrderSmaregiPostCommand 等は DateTime を用いており、コードベース全体が『日時を出さない慣習』でないことも確認でき、本コマンド固有の欠落と裏付けられる。(4) 要求の読み違い: 『開始・完了のコンソール出力（日時付き）』は開始・完了時のコンソール出力に日時を付す要求で、実装は出力自体はあるが日時が欠落。読み違いなし。実装違いとして成立。
