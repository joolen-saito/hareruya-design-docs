/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ会員
機能：ポイント失効
課題カテゴリ：実装漏れ
課題：ポイント失効バッチの開始・完了コンソール出力に日時が付いていない
設計書：0408_基本設計仕様書(バッチ_会員).xlsx

# 再現手順【必須】
1. 設計書 B08-02 のログ・監査で、開始・完了のコンソール出力は日時付きとされていることを確認する
2. ベース実装 pf-eccube3 の `CustomerBatch::execute()` が `Command start:<日時>` と `Command complete:<日時>` を出力していることを確認する
3. ec-cube-enterprise の `LostPointsCommand::execute()` を確認し、開始・完了メッセージに日時が含まれていないことを確認する
4. `LostPointsCommand.php` 内に `DateTime`、`date()`、`format()` など日時を付与する処理がないことを確認する

# 期待される挙動【必須】
- ポイント失効バッチ開始時に、日時付きの開始メッセージをコンソールへ出力する
- ポイント失効バッチ完了時に、日時付きの完了メッセージをコンソールへ出力する

# 現在の挙動【必須】
- ec-cube-enterprise の `LostPointsCommand` は開始時に `ポイント失効バッチ開始`、完了時に `ポイント失効処理が完了しました。` を出力するが、どちらも日時を付与していない。同ファイル内に `DateTime`、`date()`、`format()` など日時出力の処理も確認できない。

ec-cube-enterprise の LostPointsCommand は日時なしで開始・完了を出力する: `ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:35-53`
```php
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->text('ポイント失効バッチ開始');

        try {
            $this->lostPointsAction->handle();
        } catch (\Throwable $e) {
            $io->error([
                'ポイント失効処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $io->success('ポイント失効処理が完了しました。');

        return Command::SUCCESS;
```
- ベース実装(pf-eccube3)では共通の `CustomerBatch::execute()` が対象バッチ実行前後に `date('Y/m/d H:i:s')` を使い、開始・完了を日時付きで出力している。

ベース実装 pf-eccube3 の CustomerBatch は日時付きで開始・完了を出力する: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:35-54`
```php
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $app = $this->getSilexApplication();

        $name = $input->getArgument('batch_name');
        $batchNames = self::BATCH_NAMES;
        $resultMessage = '[' . date('Y/m/d H:i') . '] ';

        if (!isset($batchNames[$name])) {
            echo $resultMessage . " Nothing args or command.\n";

            return 1;
        }

        $accountList = new $batchNames[$name]($app, $this->createOptions($input));
        echo sprintf("Command start:%s \n", date('Y/m/d H:i:s'));
        $accountList->execute();
        echo sprintf("Command complete:%s \n", date('Y/m/d H:i:s'));

        return 0;
```

# 根拠
- 設計：
  - B08-02 のログ・監査は開始・完了の日時付きコンソール出力を要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1210`
- ec-cube-enterprise：
  - enterprise の開始・完了出力は固定文言で日時を付けていない: `ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:35-53`
- ベース実装：
  - pf-eccube3 は開始・完了を日時付きで出力する: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:35-54`

# 確認メモ
- 確認コマンド: `rg -n "DateTime|date\(|format\(|ポイント失効バッチ開始|ポイント失効処理が完了|Command start|Command complete|日時付き|開始・完了" ../ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php ../pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html`
- 確認コマンド: `rg -n "B08-02|開始・完了のコンソール出力|日時付き" design_impl_drift_report/findings/b08-02_0408_sheet-4_sheet.json excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html`
