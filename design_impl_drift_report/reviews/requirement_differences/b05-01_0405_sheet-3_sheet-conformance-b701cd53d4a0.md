# b05-01_0405_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: medium）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-01_0405_sheet-3_sheet.json#b05-01_0405_sheet-3_sheet-conformance-b701cd53d4a0`
- 機能: B05-01 B05-01 注文番号登録
- 観点: ⑦要求網羅・実装違い

## 要旨
バッチ開始・完了のコンソール出力を設計は日時付きで要求するが、実装の出力文字列に日時が含まれない。

## 判定理由
設計（詳細設計 ログ・監査）は開始・完了について『開始・完了のコンソール出力（日時付き）』を要求している（design line 1095-1096）。実装 OtcOrderSmaregiPostCommand は開始時に $io->text('店頭受取注文スマレジ連携バッチ開始')（line 44）、完了時に $io->success('店頭受取注文スマレジ連携処理が完了しました。')（line 61）を出力するのみで、SymfonyStyle の text/success は日時を付与せず、出力文字列にも日時が含まれない。開始・完了出力は存在するが日時付与という要求を満たしていないため実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1095-1096` — 設計要求

```html
          <h2 id="function-design-b05-01-b05-01_batch_order_order_copy_order_number-ログ・監査">ログ・監査</h2>
          <div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>開始・完了</td><td>開始・完了のコンソール出力（日時付き）。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
text/successに日時付与なし
`ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:44-61` — 実装(開始・完了出力に日時なし)

```php
        $io->text('店頭受取注文スマレジ連携バッチ開始');

        try {
            // 現在時刻から30分前の時刻を取得
            $now = new \DateTime();
            $thirtyMinutesAgo = $now->modify('-30 minutes');

            $this->smaregiOtcOrderPostAction->handle($thirtyMinutesAgo);
        } catch (\Throwable $e) {
            $io->error([
                '店頭受取注文スマレジ連携処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $io->success('店頭受取注文スマレジ連携処理が完了しました。');
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗、指摘維持。OtcOrderSmaregiPostCommand.php の開始出力は $io->text('店頭受取注文スマレジ連携バッチ開始')(:44)、完了出力は $io->success('店頭受取注文スマレジ連携処理が完了しました。')(:61)で、いずれの文字列にも日時が含まれない。rg で当コマンド内の date(/DateTime/format(/->text(/->success( を確認したが、:48 の new \DateTime() は抽出条件用(now-30分)であって出力には使われず、開始・完了出力に日時を付与するコードは存在しない。SymfonyStyle の text/success は既定でタイムスタンプを付けない。設計(詳細設計 ログ・監査 line 1095-1096)は『開始・完了のコンソール出力（日時付き）』を要求しており、開始・完了出力自体は存在するが『日時付き』要件を満たしていない。確信度mediumだが実装に日時が無い事実は確認済みのため維持。
