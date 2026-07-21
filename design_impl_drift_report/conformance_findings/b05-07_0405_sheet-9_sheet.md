■バッチ-B05-07 ポイント利用未反映チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは `order:batch checkNotReflectedPointUsage` でポイント利用未反映チェックを実行する。
　Symfony Console の登録名は `eccube:check-not-reflected-point-usage`。設計上の `order:batch checkNotReflectedPointUsage` または同名 alias は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-9:1842,1846 ／ 実装: src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:35（不在探索: src/Eccube, html; 検索語: order:batch / checkNotReflectedPointUsage / check-not-reflected-point-usage））

■バッチ-B05-07 ポイント利用未反映チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）開始・完了のコンソール出力（日時付き）。
　開始時は `ポイント利用未反映チェックバッチ開始`、完了時は検出有無の success メッセージを出力するが、日時は付与していない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-9:1873-1874 ／ 実装: src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:52,65-68）
