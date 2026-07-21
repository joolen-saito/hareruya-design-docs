# b02-06_0404_sheet-8_sheet 実装漏れ

- 判定: **CONFIRMED**（confidence: medium）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-06_0404_sheet-8_sheet.json#b02-06_0404_sheet-8_sheet-conformance-7b0a907d9225`
- 機能: B02-06 B02-06 在庫初期化
- 観点: ⑦要求網羅・未実装

## 要旨
設計の詳細設計書が定めるコンソールバッチ product:batch insertStockHistory <開始日> <終了日>（受注日範囲から在庫減算履歴を作成）が ec-cube-enterprise に存在しない。

## 判定理由
設計の詳細設計書(HTML 1522行, 処理フロー1526-1527行)は、コンソールバッチ product:batch insertStockHistory <開始日> <終了日> で受注日範囲の受注をたどり、受注日より前の最新在庫履歴を基準に受注分の在庫減算の在庫履歴(dtb_stock_history)を作成し、stock_change_reason 一致による重複判定と各種コンソール出力を行うと規定する。ec-cube-enterprise を確認すると insertStockHistory の名を持つ Command/Service は存在せず（rg で src/ html/ app/ 全て 0 件）、B02-06 として実装されている唯一のバッチは InitialStockRegistrationCommand（eccube:initial-stock-registration, 引数は target_base_info_id 1つ、InitialStockRegistrationCommand.php:35,46）で、これは基準店舗の dtb_product_stock を新店舗へ複製する別処理であり、受注日範囲から在庫履歴を作成するバッチ入口・処理フロー・重複判定・出力契約を一切満たさない。受注ベースの在庫履歴作成は ShoppingService の通常受注フローにのみ存在し、開始日・終了日を受ける再作成バッチではない。したがって設計要求のバッチは未実装。なお当シート冒頭のExcel機能仕様(1481-1482行)は別の『新店舗への在庫複製』機能を記しており実装済みだが、詳細設計書が明記する insertStockHistory バッチとは別物であるため、当要求の実装漏れは変わらない（シート内に設計記述の内部矛盾がある点は confidence を medium とする理由）。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1522-1527` — 設計要求(詳細設計書 利用者視点の入口/処理フロー)

```html
          <div class="table-wrap"><table><thead><tr><th>入口</th><th>実行方法</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>コンソールのバッチコマンド</td><td><code>product:batch insertStockHistory &lt;開始日&gt; &lt;終了日&gt;</code></td><td>指定した受注日範囲の受注をたどり、受注分の在庫減算の在庫履歴を作成する。</td></tr></tbody></table></div>
          <p>本機能はHTTPで届く画面を持たない。コマンド名が一致しない場合は処理を行わずに終了する。開始日・終了日の2引数が無い場合は、その旨を出力して処理を行わずに終了する。</p>
          <hr>
          <h2 id="function-design-b02-06-b02-06_batch_product_product_stock_initialize-処理フロー">処理フロー</h2>
          <h3 id="function-design-b02-06-b02-06_batch_product_product_stock_initialize-在庫初期化を実行する-product-batch-insertStockHistory-開始日-終了日">在庫初期化を実行する（<code>product:batch insertStockHistory &lt;開始日&gt; &lt;終了日&gt;</code>）</h3>
          <ol><li>引数が2つ未満の場合は、開始日と終了日の指定を促すメッセージを出力して終了する。</li><li>引数の開始日・終了日を日時として解釈し、その範囲の受注を受注日の昇順で取得する。</li><li>受注ごとに受注サブを取得し、受注詳細を順にたどる。</li><li>受注詳細の商品規格について、受注日より前の最新在庫履歴を取得する。</li><li>最新在庫履歴が無い商品規格は処理をスキップする。</li><li>注文番号と価格を含むメモを生成し、同じ商品規格・同じメモの在庫履歴がすでに登録済みなら、その旨を出力して次へ進む。</li><li>未登録の場合、最新在庫を基準に受注数量を減算した在庫履歴を作成し、登録結果を出力して反映する。</li></ol>
```

## ec-cube-enterprise 実装
eccube:initial-stock-registration は target_base_info_id 1引数で新店舗への在庫複製を行うのみ。insertStockHistory バッチではない。
`ec-cube-enterprise/src/Eccube/Command/InitialStockRegistrationCommand.php:35-46` — 実装漏れの最寄り実装(B02-06の唯一のバッチは別処理)

```php
#[AsCommand(name: 'eccube:initial-stock-registration', description: '在庫初期化バッチ')]
class InitialStockRegistrationCommand extends Command
{
    public function __construct(private readonly BatchInitialStockRegistrationAction $batchInitialStockRegistrationAction)
    {
        parent::__construct();
    }

    #[\Override]
    protected function configure(): void
    {
        $this->addArgument('target_base_info_id', InputArgument::REQUIRED, '新店舗の base_info_id');
```

## 不在確認コマンド

- `rg -rln 'insertStockHistory' /home/y-saito/Developments/ec-cube-enterprise/src /home/y-saito/Developments/ec-cube-enterprise/html`
- `rg -rn 'product:batch|受注日より前|開始日.*終了日' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証4観点を試みたが、いずれも指摘を崩せず、insertStockHistoryバッチの不在を自分で確認できた。(1)別実装の探索: ec-cube-enterprise の Command 全48ファイルの AsCommand 名を列挙(rg 'AsCommand(name:')し、insertStockHistory/insert-stock-history/stock-history-insert に相当する入口は皆無。rg -i 'insertStockHistory' はvendor/cache除外で0件。受注日範囲をたどり dtb_stock_history を作成する Service/Command も broad rg('受注をたど|受注日範囲|InsertStockHistory')で0件。設計のメモ文言『受注による減算 注文番号：… 受注時価格：… 円』はStockReduceProcessor/ShoppingServiceに存在するが、これは購入フローのリアルタイム処理であり、開始日・終了日を受けて過去受注から在庫履歴を再作成する『バッチ入口』ではない。実際 InventoryReflectionCommand.php:29-32 のコメントが『pf-eccube3のProductBatch(product:batch)に集約されていたバッチのうち inventoryReflection のみを独立コマンドに切り出した』と明記しており、同じProductBatchの別サブコマンドである insertStockHistory は移植対象外だったことを裏付ける。(2)引用の正しさ: designEvidence(HTML1522-1527)は実在し内容一致。裏取りとして原本 pf-eccube3 の InsertStockHistory.php(commandName='insertStockHistory', execute()で開始/終了日→getQueryBuilderByOrderDate→getLatestStockHistoryByCreateDate→isRegisteredStockHistoryでmemo重複判定→DtbStockHistory作成)を確認し、設計は現行実装の正確なリバースだと確定。implEvidence の InitialStockRegistrationCommand.php:35-46(eccube:initial-stock-registration, 引数target_base_info_id 1つ)も実在し、これは新店舗への product_stock 複製で別処理。(3)設計側除外: 当シートは機能『現行システムから変更なし(現行踏襲)』(HTML1479)と記し、Ph2/対象外/実装しない の注記は無い。むしろ現行踏襲=移植すべき要求。(4)要求読み違い: 要求はコンソールバッチで正しく読めている。(5)重複: 同チャンクの他2 finding(822931db/e23ef)は『新店舗への在庫複製バッチ』を対象としており、本 finding の insertStockHistory バッチとは別実装ブロック。以上より指摘は維持。
