OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26a8-8df8-7181-ab7f-c0486341446b
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: admin_product_simple_low_price_csv_export
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/admin_product_simple_low_price_csv_export.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html
- 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube （必要に応じ /home/y-saito/Developments/ec-cube-enterprise 全体）

## 手順
1. 差分候補JSONの各findingについて、designRef(設計書 file:line)とimplRef(実装 file:line)を**実際に開いて**突き合わせる。
2. 次の観点で批判的に指摘（各指摘に file:line 根拠を付ける）:
   - 誤検知(FALSE_POSITIVE): 実装は別ファイル/別ルート/別名で設計どおり実現、または引用/行番号が誤り。
   - 見落とし(MISSED): 設計書の重要節（処理フロー/判定順序/バリデーション/DB操作/権限/エラー処理/セッション等）で実装と異なるのにfindingsに無い差分。
   - 根拠不備(WEAK_EVIDENCE): designRef/implRefが存在しない・的外れ・引用が創作。
   - 重要度誤り(SEVERITY): high/med/lowが業務影響と不整合。
3. 各指摘を「種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応」で簡潔に列挙。
4. 最後に必ず1行: VERDICT: false_positive=<n>, missed=<n>, weak_evidence=<n>, 総合=<信頼できる|要修正|大幅要修正>

warning: Codex could not find bubblewrap on PATH. Install bubblewrap with your OS package manager. See the sandbox prerequisites: https://developers.openai.com/codex/concepts/sandboxing#prerequisites. Codex will use the bundled bubblewrap in the meantime.
codex
差分候補と設計書、実装参照を実ファイルで確認します。読み取り専用なので、まずJSONのfinding構造と参照先の周辺行を洗います。
exec
/bin/bash -lc 'rg -n "admin_product_simple_low_price_csv_export|低価格|CSV|csv|simple_low|low_price|価格" function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
6:  <title>M03-43（低価格帯カード価格変更CSV出力） - 機能仕様書</title>
173:<a class="lv2" href="#1-低価格帯カード価格変更CSV出力">1. 低価格帯カード価格変更CSV出力</a>
187:        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/admin_product_simple_low_price_csv_export.md</p>
188:        <h1>M03-43（低価格帯カード価格変更CSV出力）</h1>
191:<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>機能名</td><td>低価格帯カード価格変更CSV出力</td></tr><tr><td>機能分類</td><td>管理画面 / 商品管理</td></tr><tr><td>カスタマイズ区分</td><td>新規実装</td></tr><tr><td>作成日</td><td>2026-06-11</td></tr><tr><td>参照元</td><td>excel_to_html/output/0204_基本設計仕様書(商品管理).html</td></tr><tr><td>実装確認</td><td>../ec-cube-enterprise</td></tr></tbody></table></div>
195:<ul><li>URLエンドポイントとDBカラムは <code>../ec-cube-enterprise</code> の実装確認値を優先する。本文で実装未確認とした項目は、対象 Controller / Route / Entity / Migration の追加確認後に確定する。</li><li>Excel設計書に画面項目、CSV列、帳票レイアウトの詳細がある場合、詳細項目は各画面・CSV・帳票設計側を正とする。</li></ul>
196:<h2 id="1-低価格帯カード価格変更CSV出力">1. 低価格帯カード価格変更CSV出力</h2>
198:<p>商品コードと価格変更用のCSVを出力し、低価格帯カードの基準価格変更作業を支援する。</p>
200:<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>管理画面の検索条件、フォーム入力、CSVアップロード、または画面操作。</td></tr><tr><td>出力</td><td>画面表示、CSV/PDFダウンロード、登録完了/エラー表示。</td></tr><tr><td>副作用</td><td>対象データの登録・更新、CSV取込履歴、在庫履歴、ステータス履歴の記録。</td></tr></tbody></table></div>
204:<ul><li>Excel設計書に記載された対象条件、検索条件、CSV出力条件、登録条件を正とする。</li><li>Excel設計書に未記載のURLエンドポイント、DBカラム、実処理順序は <code>../ec-cube-enterprise</code> の実装を正とする。</li><li>権限、ログイン状態、管理画面プレフィックスなどの共通判定は共通設計および実装側のセキュリティ設定に従う。</li></ul>
206:<ol><li>利用者または外部システムが対象機能を開始する。</li><li>入力値、検索条件、アップロードファイル、またはリクエスト本文を受け付ける。</li><li>Excel設計書に定義された対象データを取得し、実装側の検証・権限・状態条件を適用する。</li><li>登録・更新・出力・連携のいずれかの主処理を実行する。</li><li>成功時は結果画面、CSV/PDF/APIレスポンス、またはバッチ結果を返す。失敗時はエラー内容を返し、更新が必要な処理では不整合が残らないように扱う。</li></ol>
208:<ul><li>**Excel設計優先**: 仕様の目的、対象データ、出力項目、表示項目、業務上の条件は <code>excel_to_html/output</code> の設計書を正とする。</li><li>**実装補完**: Excel設計に書かれていないURLエンドポイント、DBカラム、トランザクション、サービス分割、非同期処理は <code>../ec-cube-enterprise</code> の実装を正とする。</li><li>**対象機能の要点**: 低価格帯カード価格変更を行うためのCSV出力を行えます。</li><li>**実装確認値**: 管理画面のCSV出力機能。実装で確認できるURLは未特定のため断定しない。</li></ul>
210:<div class="table-wrap"><table><thead><tr><th>対象</th><th>内容</th></tr></thead><tbody><tr><td>主データ</td><td>管理画面の対象業務データを参照し、登録系では対象データと履歴を更新する。</td></tr><tr><td>履歴・ログ</td><td>必要に応じてCSV取込履歴、在庫履歴、ステータス履歴、API受信履歴、アプリケーションログを作成・更新する。</td></tr><tr><td>DB関連実装確認値</td><td>dtb_product_class.standard_price, dtb_product_class.price02, dtb_product_class.update_date</td></tr></tbody></table></div>
212:<ul><li>**入力不備**: 必須項目、CSVヘッダ、CSV行、APIリクエスト本文、検索条件が不正な場合はエラーとして処理し、登録・更新対象を確定しない。</li><li>**対象なし**: 検索条件や対象IDに該当するデータがない場合は、空の一覧、空CSV、またはエラーレスポンスとして扱う。扱いの細部は対象画面/API/バッチの実装に従う。</li><li>**状態不整合**: 既に処理済み、キャンセル済み、承認不可、在庫不足など状態条件に合わない場合は処理対象外またはエラーとする。</li><li>**外部連携失敗**: スマレジ等の外部連携で失敗した場合は、実装側の再連携・エラーログ・エラーメール・ステータス更新仕様を正とする。</li></ul>
214:<ul><li>画面項目、CSV列、PDFレイアウト、APIリクエスト/レスポンスの詳細は、参照元Excel設計書の該当シートを正とする。</li><li>URLエンドポイントとDBカラムは <code>../ec-cube-enterprise</code> の Controller Route、Entity、Repository、Migration、Service 実装を正とする。</li></ul>
216:<pre><code class="language-text">低価格帯カード価格変更CSV出力
234:低価格帯カード価格変更CSV出力
240:M03-44 低価格帯カード価格変更CSV出力
246:5新基準価格(変更予定価格)計算式に則って変更する予定の基準価格
247:6新買取価格(変更予定価格)計算式に則って変更する予定の買取価格
248:7現行基準価格比較参考のための項目のため、アップロード時にはこの項目は削除してアップロードする
249:8現行買取価格比較参考のための項目のため、アップロード時にはこの項目は削除してアップロードする
253:低価格帯カード価格変更を行うためのCSV出力をすることが可能
255:基準価格変更CSV登録をベースに下記のカスタマイズを行い、新規機能として実装する
257:低価格帯カード価格変更支援機能
258:低価格帯カードに限り下記の制御が加わる
259:・低価格帯カードは20円～300円以下とする
260:・晴れる屋さんが業務で使用している計算式(※1 参照)に基づき、新価格を価格欄に表示する
261:・現前設定されている価格は別の列で参考情報として表示する
263:以下の条件に適合したら価格を変動させる
277:低価格帯カード価格変更支援機能
278:新基準価格(変更予定価格)(5)と新買取価格(変更予定価格)(6)は、計算式※1に基づいて出力する
279:基準価格や買取価格を現行の価格と比較できるように現行基準価格(7)と現行買取価格(8)を出力する
280:※ 登録する際には、CSVから現行基準価格(7)と現行買取価格(8)は削除した上で基準価格変更CSVアップロードを利用し、登録を行う
287:低価格帯カード価格変更CSVフォーマット
305:低価格帯カード価格変更CSVフォーマット
311:M03-44 低価格帯カード価格変更CSVフォーマット
318:5新基準価格(変更予定価格)数値(整数)◯300200計算式に則って変更する予定の基準価格
319:6新買取価格(変更予定価格)数値(整数)◯300150計算式に則って変更する予定の買取価格
320:7現行基準価格数値(整数)300250比較参考のための項目のため、アップロード時にはこの項目は削除してアップロードする
321:8現行買取価格数値(整数)300100比較参考のための項目のため、アップロード時にはこの項目は削除してアップロードする
325:低価格帯カード価格変更を行うためのCSV出力をすることが可能
327:基準価格変更CSV登録をベースに下記のカスタマイズを行い、新規機能として実装する
329:低価格帯カード価格変更支援機能
330:低価格帯カードに限り下記の制御が加わる
331:・低価格帯カードは20円～300円以下とする
332:・晴れる屋さんが業務で使用している計算式(※1 参照)に基づき、新価格を価格欄に表示する
333:・現前設定されている価格は別の列で参考情報として表示する
335:以下の条件に適合したら価格を変動させる
349:低価格帯カード価格変更支援機能
350:新基準価格(変更予定価格)(5)と新買取価格(変更予定価格)(6)は、計算式※1に基づいて出力する
351:基準価格や買取価格を現行の価格と比較できるように現行基準価格(7)と現行買取価格(8)を出力する
352:※ 登録する際には、CSVから現行基準価格(7)と現行買取価格(8)は削除した上で基準価格変更CSVアップロードを利用し、登録を行う

exec
/bin/bash -lc "jq '.' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/admin_product_simple_low_price_csv_export.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "admin_product_simple_low_price_csv_export",
  "title": "M03-43（低価格帯カード価格変更CSV出力）",
  "domain": "admin_product",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html",
  "findings": [
    {
      "dimension": "①ルート/HTTPメソッド",
      "severity": "high",
      "designRef": "function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:198",
      "designQuote": "商品コードと価格変更用のCSVを出力し、低価格帯カードの基準価格変更作業を支援する。",
      "implRef": "不在",
      "difference": "設計が定義する『低価格帯カード価格変更CSV出力』機能（route想定 admin_product_simple_low_price_csv_export）が enterprise 実装に存在しない。src/Eccube/Controller/Admin/Product/Csv/ 配下には ProductSimpleHighPrice/ProductStandardPrice/ProductSaleHighPrice/ProductPrice 等のCSVコントローラはあるが、SimpleLow（低価格帯）相当のコントローラ・ルート・テンプレート・MtbCsvImportType定数はリポジトリ全体で一切検出されない。Excel抽出内の注記『B6 Ph2で対応』(:286,:358)とも整合し、Phase2未実装＝機能まるごと不在。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "src/Eccube/Controller/Admin/Product/Csv/ のディレクトリ一覧に SimpleLow/simple_low 系ファイルは存在せず（CardCsv/Category/ProductCsv/ProductPriceCsv/ProductSaleHighPriceCsv/ProductStandardPriceCsv/ProductSimpleHighPriceCsv 等のみ）。`grep -rni 'SimpleLowPrice|simple_low_price' /home/y-saito/Developments/ec-cube-enterprise`（vendor除く）は0件。`find -iname '*simple_low*'` も0件。設計HTML:198 に機能目的、:286/:358 に『Ph2で対応』注記を確認。"
    },
    {
      "dimension": "②業務ルール・計算",
      "severity": "high",
      "designRef": "function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:263",
      "designQuote": "以下の条件に適合したら価格を変動させる ・週間販売が10枚未満ならワンランク下げ ・週間販売が10枚以上ならワンランク上げ ・全店在庫が10枚未満になったらワンランク上げ ランクは以下の通り 300 250 200 150 100 80 50 30",
      "implRef": "不在",
      "difference": "設計の中核カスタムロジック（ランク階段300/250/200/150/100/80/50/30、週間販売枚数と全店在庫による±1ランク変動、対象は20円〜300円以下(:259,:331)の低価格帯カード）に基づく新基準価格・新買取価格の算出処理が実装に一切存在しない。週間販売数(order_quantity_04 / sales_quantity_04)や在庫データは既存エンティティ・集計に存在するが、それをランク階段に写像し価格を±1ランク変動させる算出ロジックはどのServiceにも無い。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "設計HTML:263-275 に計算式（週間販売10枚基準の±1ランク・全店在庫10枚未満で+1ランク・ランク階段300/250/200/150/100/80/50/30）、:259/:331 に対象20〜300円を確認。実装側は週間販売数フィールドこそ存在（src/Eccube/Entity/ProductClass.php:334 order_quantity_04 '1週間販売数'、src/Eccube/Entity/DtbSalesQuantity.php:113 sales_quantity_04）するが、`grep -rni '週間販売|新基準価格|新買取価格|ランク...'` でランク階段による価格変動算出処理は検出されず。低価格帯向けのStandardPrice/HighPrice系Calculator/Handlerにも該当ロジックは無い。"
    },
    {
      "dimension": "⑧バッチ/API入出力・再実行性",
      "severity": "med",
      "designRef": "function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:314",
      "designQuote": "1商品ID◯数値(整数)… 5新基準価格(変更予定価格) 6新買取価格(変更予定価格) 7現行基準価格 8現行買取価格 9原価単価",
      "implRef": "src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:184",
      "difference": "設計が定めるCSV出力9列（商品ID/言語ID/商品名/言語/新基準価格/新買取価格/現行基準価格/現行買取価格/原価単価。うち原価単価は新規追加項目:281-282,354）のフォーマットを持つエクスポータが実装に無い。最も近い ProductSimpleHighPriceCsvController の getCsvHeader() は『商品コード/基準価格』の2列のみ（:186-189）で、低価格帯用9列の列定義・現行/新価格の並列出力・CsvExportService経由stream出力は未実装。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "設計HTML:314-322 に9列フォーマット（1商品ID〜9原価単価）、:281-282/:354 に原価単価新規追加を確認。src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:184-190 getCsvHeader() は ['商品コード'=>'', '基準価格'=>''] の2列のみ。低価格帯9列を出力するController/Exporter/Service はリポジトリに存在しない（find/grep 0件）。原価単価列の実装は CardCsv/GoodsCsv/ProductCsv 等の別CSVには存在するが低価格帯用出力は無い。"
    }
  ]
}

exec
/bin/bash -lc "rg -n \"simple_low|low_price|LowPrice|低価格|admin_product_simple_low_price|lowest|csv\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app /home/y-saito/Developments/ec-cube-enterprise/src -g '"'!var'"'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 116ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockEditCsv.php:22:#[ORM\Table(name: 'dtb_stock_edit_csv')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:102:                        <button type="button" class="btn btn-ec-conversion me-2" data-bs-toggle="modal" data-bs-target="#modalSplitCsv">{{ 'admin.stock.split_join.split_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:103:                        <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#modalJoinCsv">{{ 'admin.stock.split_join.join_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:292:                                    <a href="{{ url('admin_stock_split_join_csv_export') }}" class="btn btn-ec-conversion">{{ 'admin.stock.split_join.csv_export'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:424:                    <h5 class="modal-title fw-bold" id="modalSplitCsvLabel">{{ 'admin.stock.split_join.split_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:429:                    {% include '@admin/Stock/stock_split_csv_modal_body.twig' with splitCsvModal|merge({ split_csv_list_import_url: url('admin_stock_split_join_list_split_csv_import') }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:444:                    <h5 class="modal-title fw-bold" id="modalJoinCsvLabel">{{ 'admin.stock.split_join.join_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:449:                    {% include '@admin/Stock/stock_join_csv_modal_body.twig' with joinCsvModal|merge({ join_csv_list_import_url: url('admin_stock_split_join_list_join_csv_import') }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:474:                        const nativeSelect = document.getElementById('admin_stock_split_csv_upload_approval_notification_target_members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:502:                    let form = document.getElementById('form-stock-split-csv-upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:513:                const storeSelect = document.getElementById('admin_stock_split_csv_upload_store');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:526:                    let span = modalSplitCsv.querySelector('.js-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:527:                    if (span) span.textContent = e.target.files && e.target.files.length ? e.target.files[0].name : '{{ 'admin.stock.split_csv_modal.no_file_selected'|trans }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:530:                    let spanJ = modalJoinCsv.querySelector('.js-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:531:                    if (spanJ) spanJ.textContent = e.target.files && e.target.files.length ? e.target.files[0].name : '{{ 'admin.stock.split_csv_modal.no_file_selected'|trans }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:27:    #[ORM\Table(name: 'dtb_csv')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:73:        #[ORM\JoinColumn(name: 'csv_type_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:235:         * Set csvType.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:237:        public function setCsvType(?CsvType $csvType = null): Csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:239:            $this->CsvType = $csvType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:245:         * Get csvType.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:291:        public function addCsvCsvExtension(DtbCsvCsvExtension $csvCsvExtension): Csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:293:            $this->CsvCsvExtensions[] = $csvCsvExtension;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:298:        public function removeCsvCsvExtension(DtbCsvCsvExtension $csvCsvExtension): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:300:            return $this->CsvCsvExtensions->removeElement($csvCsvExtension);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:304:         * @param Collection<int, DtbCsvCsvExtension> $csvCsvExtensions
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:306:        public function setCsvCsvExtensions(Collection $csvCsvExtensions): Csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:308:            $this->CsvCsvExtensions = $csvCsvExtensions;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_new_destination_csv_modal.twig:1:{% include '@admin/Stock/stock_split_destination_csv_modal.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:227:                    'admin.csv.error.product.product_class_count_invalid_for_update',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:10:    <form id="form-stock-split-csv-upload" method="post" action="{{ split_csv_list_import_url|default(url('admin_stock_split_join_list_split_csv_import')) }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:15:                <label class="form-label fw">{{ 'admin.stock.split_csv_modal.store'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:16:                {{ form_widget(form.store, {'attr': {'class': 'form-select', 'placeholder': 'admin.stock.split_csv_modal.store_placeholder'|trans}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:20:                <span class="form-label fw d-block">{{ 'admin.stock.split_csv_modal.inventory_category'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:33:                        {{ form_widget(form.approval_department, { attr: { class: 'form-select js-split-csv-approval-dept' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:39:                        {{ form_widget(form.approval_notification_target_members, { attr: { class: 'form-select js-split-csv-approval-members' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:47:                <label class="form-label fw">{{ 'admin.stock.split_csv_modal.csv_file'|trans }}（{{ 'admin.stock.split_csv_modal.csv_file_limit'|trans }}）</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:49:                    <span class="btn btn-ec-regular js-split-csv-file-btn">{{ 'admin.common.file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:50:                    <span class="js-csv-file-name text-muted small">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:51:                    {{ form_widget(form.import_file, {'attr': {'class': 'd-none', 'accept': 'text/csv'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:57:                {% if split_csv_list_import_url is defined and split_csv_list_import_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:58:                    <button type="submit" class="btn btn-ec-conversion" id="btn-split-csv-import">{{ 'admin.stock.split_join.list_csv_import_submit'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:60:                    <button type="submit" class="btn btn-ec-conversion" id="btn-split-csv-register">{{ 'admin.stock.split_csv_modal.register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:67:        <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:68:        <a href="{{ url('admin_stock_split_csv_template') }}" class="btn btn-ec-regular">{{ 'admin.stock.split_csv_modal.template_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:75:                <td class="table-light w-25">{{ 'admin.stock.split_csv_modal.format_source_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:76:                <td class="text-muted small">{{ 'admin.stock.split_csv_modal.format_source_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:79:                <td class="table-light">{{ 'admin.stock.split_csv_modal.format_split_quantity'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:80:                <td class="text-muted small">{{ 'admin.stock.split_csv_modal.format_split_quantity_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:83:                <td class="table-light">{{ 'admin.stock.split_csv_modal.format_target_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:84:                <td class="text-muted small">{{ 'admin.stock.split_csv_modal.format_target_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:87:                <td class="table-light">{{ 'admin.stock.split_csv_modal.format_target_stock'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:88:                <td class="text-muted small">{{ 'admin.stock.split_csv_modal.format_target_stock_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:96:    $('.js-split-csv-file-btn').on('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:101:        $(this).siblings('.js-csv-file-name').text(name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:104:    var $membersSelect = $('.js-split-csv-approval-members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:111:    $('.js-split-csv-approval-dept').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_include_delivery_fee.twig:41:{% if BuyOrder.getBuyMainCardCountLessThanBulkMinPrice() > 0 and BuyOrder.getSaleLowPriceProductFlg() == constant('Eccube\\Entity\\DtbBuyMainCard::SALE') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_include_delivery_fee.twig:43:{% for buyPrice, quantity in BuyOrder.getLowPriceProductCountList() %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_include_delivery_fee.twig:48:{% set lessThanMinPriceTotal = BuyOrder.getTotalPriceLessThanMinLowPrice() %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:184:            $this->eccubeConfig['eccube_csv_import_delimiter'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:185:            $this->eccubeConfig['eccube_csv_import_enclosure']
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:259:                array_unshift($errors, trans('admin.stock.csv.error_limit_notice'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:11:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:13:{% set menus = ['product', 'product_csv_management', 'product_card_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:15:{% block title %}{{ 'admin.product.product_card_csv_upload_title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:260:                $this->flashSuccesses[] = trans('admin.stock.split_join.list_csv_join_import_done', ['%count%' => (string) $successCount]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:49:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:85:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:86:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:93:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:96:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:99:        $filename = 'buy_order_history_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:3:{% set menus = ['product', 'product_csv_management', 'admin_product_status_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:5:{% block sub_title %}{{ 'admin.product.product_status_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvImportHistory.php:23:#[ORM\Table(name: 'dtb_csv_import_history')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvImportHistory.php:38:    #[ORM\JoinColumn(name: 'csv_import_type_id', nullable: false, referencedColumnName: 'id', options: ['comment' => '　'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:43:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:63:            throw new \RuntimeException('admin.purchase.online.csv_export.not_registered_buy_order_id');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:77:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:78:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:85:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:88:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:93:        $filename = $prefix.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list_line_items.twig:2:    <p class="text-danger mb-2">{{ 'admin.stock.approval_list.line_items.over_display_limit_csv_hint'|trans({'%max%': modalLineItemsDisplayMax}) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:36:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:48:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:49:            $this->csvExportService->fputcsv([self::HEADER_PRODUCT_CODE, self::HEADER_SHORTAGE_QTY]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:52:                $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:55:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:58:        $filename = 'shortage_join_'.(string) $join->getId().'_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/barcode_replacement_list.twig:11:    <form name="barcode_replacement_list_form" id="barcode_replacement_list_form" method="post" action="{{ url('admin_stock_barcode_replacement_list_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/barcode_replacement_list.twig:39:                                        {{ 'admin.stock.barcode_replacement_list.csv_export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:40:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:55:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:58:                $this->csvExportService->fputcsv(self::CSV_HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:61:                    $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:64:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:69:            'stock_move_outbound_approval_request_%d_%s.csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:202:            $this->eccubeConfig['eccube_csv_import_delimiter'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:203:            $this->eccubeConfig['eccube_csv_import_enclosure']
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number.twig:5:{% block sub_title %}{{ 'admin.product.product_shelf_number_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:28:#[ORM\Table(name: 'dtb_csv_extension')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:102:    #[ORM\JoinColumn(name: 'csv_type_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:111:    public function setCsvType(?CsvType $csvType): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:113:        $this->CsvType = $csvType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:140:    public function addCsvCsvExtension(DtbCsvCsvExtension $csvCsvExtension): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:142:        $this->CsvCsvExtensions[] = $csvCsvExtension;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:147:    public function removeCsvCsvExtension(DtbCsvCsvExtension $csvCsvExtension): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:149:        return $this->CsvCsvExtensions->removeElement($csvCsvExtension);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:163:    private array $csvs = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:166:     * Add csvs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:168:     * @param Csv $csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:172:    public function addCsv(Csv $csv): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:174:        $this->csvs[] = $csv;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:180:     * Get csvs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:186:        return $this->csvs;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:190:     * @param Csv[]|array<int, Csv> $csvs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:194:    public function setCsvs(mixed $csvs): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:196:        $this->csvs = $csvs;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:202:     * @param Collection<int, DtbCsvCsvExtension> $csvCsvExtensions
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:206:    public function setCsvCsvExtensions(Collection $csvCsvExtensions): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:208:        $this->CsvCsvExtensions = $csvCsvExtensions;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1562:admin.common.csv_upload_complete: CSV file uploaded
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1563:admin.common.csv_upload_error: Failed to upload CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1681:admin.common.csv_download: Download CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1682:admin.common.csv_upload: Upload a CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1683:admin.common.csv_skeleton_download: Download a template
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1684:admin.common.csv_format: CSV file format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1685:admin.common.csv_select: Select a CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1688:admin.common.csv_invalid_format: Unmatched CSV format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1689:admin.common.csv_invalid_no_data: No CSV data found
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1690:admin.common.csv_invalid_required: "%name% is empty in the %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1691:admin.common.csv_invalid_greater_than_zero: "%name% should be more than 0 in the line %line%."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1692:admin.common.csv_invalid_format_line_name: "Unmatched format in %name% in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1693:admin.common.csv_invalid_format_line: "Unmatched CSV format in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1694:admin.common.csv_invalid_date_format: "Unmatched date format in %name% in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1695:admin.common.csv_invalid_not_found: "%name% is empty in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1696:admin.common.csv_invalid_not_found_target: '"%target_name%" is empty in %name% in the line %line%'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1697:admin.common.csv_invalid_not_same: "You are not allowed to enter the same value in %name1% and %name2% in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1698:admin.common.csv_invalid_can_not: "%name% is invalid in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1699:admin.common.csv_invalid_image: 'Your are not allowed to use "/" or "../" as suffix in %name% in the %line%'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1700:admin.common.csv_invalid_foreign_key: "You are unable to delete %name% in the line %line% because it has related data"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1701:admin.common.csv_invalid_description_detail_upper_limit: "%name% should be less than %max% characters in the line %line%."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1702:admin.common.csv_upload_in_progress: "Uploading CSV file ..."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1703:admin.common.csv_upload_line_success: "The %from% to %to% lines have been registered."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1704:admin.common.csv_upload_line_error: "An error has occurred. The registration process after the %from% line has been cancelled."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1816:admin.product.product_csv_management: Product CSV Management
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1817:admin.product.product_csv_upload: Product CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1818:admin.product.product_goods_csv_upload: Goods Product CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1819:admin.product.class_name_csv_upload: Class Name CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1820:admin.product.class_category_csv_upload: Class Category CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1821:admin.product.category_csv_upload: Category CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1930:admin.product.product_csv.product_id_col: Product ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1931:admin.product.product_csv.product_id_description: For new product registration, please leave it empty. To update the registered product information, please specify the product ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1932:admin.product.product_csv.display_status_col: Display Status (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1933:admin.product.product_csv.display_status_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1934:admin.product.product_csv.product_name_col: Product Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1935:admin.product.product_csv.product_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1936:admin.product.product_csv.shop_memo_col: Store Notes
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1937:admin.product.product_csv.shop_memo_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1938:admin.product.product_csv.description_list_col: Product Descriptions (All)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1939:admin.product.product_csv.description_list_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1940:admin.product.product_csv.description_detail_col: Product Descriptions (Details)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1941:admin.product.product_csv.description_detail_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1942:admin.product.product_csv.keyword_col: Search Keywords
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1943:admin.product.product_csv.keyword_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1944:admin.product.product_csv.free_area_col: Miscellaneous
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1945:admin.product.product_csv.free_area_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1946:admin.product.product_csv.delete_flag_col: Product Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1947:admin.product.product_csv.delete_flag_description: "Specify 0: Register 1: Delete. If unspecified, it will be set to 0."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1948:admin.product.product_csv.product_image_col: Product Images
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1949:admin.product.product_csv.product_image_description: Specify the name of the image file. For multiple images, please double-quote each file name.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1950:admin.product.product_csv.category_col: Product Category (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1951:admin.product.product_csv.category_description: Specify the category ID. For multiple categories, please double-quote each category ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1952:admin.product.product_csv.tag_col: Tag (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1953:admin.product.product_csv.tag_description: Specify the tag ID. For multiple tags, please double-quote each tag ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1954:admin.product.product_csv.sale_type_col: Sales Type (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1955:admin.product.product_csv.sale_type_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1956:admin.product.product_csv.class_category1_col: Option Group 1(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1957:admin.product.product_csv.class_category1_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1958:admin.product.product_csv.class_category2_col: Option Group 2(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1959:admin.product.product_csv.class_category2_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1960:admin.product.product_csv.delivery_duration_col: Estimated Shipping Date (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1961:admin.product.product_csv.delivery_duration_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1962:admin.product.product_csv.product_code_col: SKU
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1963:admin.product.product_csv.product_code_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1964:admin.product.product_csv.stock_col: Stock Qty
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1965:admin.product.product_csv.stock_description: If the unlimited stock flag is set to 0, please set the value more than 0.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1966:admin.product.product_csv.stock_unlimited_col: Unlimited Stock Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1967:admin.product.product_csv.stock_unlimited_description: "Specify 0: Limited or 1: Unlimited"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1968:admin.product.product_csv.sale_limit_col: Max Sales Qty
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1969:admin.product.product_csv.sale_limit_description: Set the value more than 1
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1970:admin.product.product_csv.normal_price_col: Regular Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1971:admin.product.product_csv.normal_price_description: Set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1972:admin.product.product_csv.sale_price_col: Selling Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1973:admin.product.product_csv.sale_price_description: Set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1974:admin.product.product_csv.delivery_fee_col: Shipping Charge
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1975:admin.product.product_csv.delivery_fee_description: If the shipping charge is set per product, set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1976:admin.product.product_csv.tax_rate_col: Tax Rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1977:admin.product.product_csv.tax_rate_description: If the Tax Rate is set per product, set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1978:admin.product.product_csv.product_class_visible_flag_col: Product options visible flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1979:admin.product.product_csv.product_class_visible_flag_description: 0:Invisible 1:Visible. If unspecified, it will not be updated.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1982:admin.product.category_csv.category_id_col: Category ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1983:admin.product.category_csv.category_id_description: For a new category registration, please leave it empty. To update the registered category, please specify the category ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1984:admin.product.category_csv.category_name_col: Category Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1985:admin.product.category_csv.category_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1986:admin.product.category_csv.parent_category_id_col: Parent Category ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1987:admin.product.category_csv.parent_category_id_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1988:admin.product.category_csv.delete_flag_col: Category Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1989:admin.product.category_csv.delete_flag_description: "Specify 0: Upload or 1: Delete. If unspecified, it is set to 0."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1992:admin.product.class_name_csv.class_name_id_col: Class Name ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1993:admin.product.class_name_csv.class_name_id_description: For a new class name registration, please leave it empty. To update the registered class name, please specify the class name ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1994:admin.product.class_name_csv.class_name_col: Class Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1995:admin.product.class_name_csv.class_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1996:admin.product.class_name_csv.class_backend_name_col: Backend Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1997:admin.product.class_name_csv.class_backend_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1998:admin.product.class_name_csv.delete_flag_col: Class Name Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1999:admin.product.class_name_csv.delete_flag_description: 'Specify 0: Upload or 1: Delete. If unspecified, it is set to 0.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2002:admin.product.class_category_csv.class_name_id_col: Class Name ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2003:admin.product.class_category_csv.class_name_id_description: Specify an existing Class Name ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2004:admin.product.class_category_csv.class_category_id_col: Class Category ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2005:admin.product.class_category_csv.class_category_id_description: For a new class category registration, please leave it empty. To update the registered class category, please specify the class category ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2006:admin.product.class_category_csv.class_category_name_col: Class Category Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2007:admin.product.class_category_csv.class_category_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2008:admin.product.class_category_csv.class_category_backend_name_col: Class Category Backend Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2009:admin.product.class_category_csv.class_category_backend_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2010:admin.product.class_category_csv.delete_flag_col: Class Category Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2011:admin.product.class_category_csv.delete_flag_description: 'Specify 0: Upload or 1: Delete. If unspecified, it is set to 0.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2014:admin.product.product_csv_upload__title: "Upload product CSV"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2015:admin.product.product_csv_upload__message: "Upload the product CSV file. Is it OK?"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2055:admin.stock.list.recommend_csv: Recommend CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2056:admin.stock.list.stock_info_csv: Stock Info CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2057:admin.stock.list.custom_csv: Custom CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2058:admin.stock.list.custom_csv_no_formats: No formats registered
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2059:admin.stock.list.custom_csv_settings: Output Settings
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2128:admin.stock.move.shortage_csv_invalid_status: The current status does not allow shortage CSV import.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2129:admin.stock.move.shortage_csv_modal.note: Register shortage quantities via CSV. Only rows with a shortage quantity are updated; blank rows and rows omitted from the CSV are left unchanged. Entering 0 clears the shortage quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2130:admin.stock.move.shortage_csv_modal.csv_file: CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2131:admin.stock.move.shortage_csv_modal.csv_file_limit: Size limit applies
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2132:admin.stock.move.shortage_csv_modal.csv_file_required: Please select a CSV file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2133:admin.stock.move.shortage_csv_import.file_not_found: 'The file could not be read.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2134:admin.stock.move.shortage_csv_import.shortage_qty_invalid: 'Line %line%: Shortage quantity must be an integer of 0 or greater.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2135:admin.stock.move.shortage_csv_import.product_code_duplicated: 'Line %line%: Product code "%code%" is duplicated in the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2136:admin.stock.move.shortage_csv_import.product_code_not_found: 'Line %line%: Product code "%code%" was not found in this stock move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2137:admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move: 'Line %line%: Shortage quantity (%shortage%) exceeds move quantity (%max%).'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2138:admin.stock.move.shortage_csv_modal.format_product_code: Product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2139:admin.stock.move.shortage_csv_modal.format_product_code_desc: Product code with a shortage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2140:admin.stock.move.shortage_csv_modal.format_product_name: Product name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2141:admin.stock.move.shortage_csv_modal.format_product_name_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2142:admin.stock.move.shortage_csv_modal.format_move_qty: Move quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2143:admin.stock.move.shortage_csv_modal.format_move_qty_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2144:admin.stock.move.shortage_csv_modal.format_shortage_qty: Shortage quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2145:admin.stock.move.shortage_csv_modal.format_shortage_qty_desc: Shortage quantity (integer 0 or greater; blank is not updated)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2146:admin.stock.move.differential_csv_invalid_status: The current status does not allow differential CSV import.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2147:admin.stock.move.differential_csv_modal.note: Register difference quantities via CSV. Only rows with a difference quantity are updated; blank rows and rows omitted from the CSV are left unchanged. Entering 0 clears the difference quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2148:admin.stock.move.differential_csv_modal.csv_file: CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2149:admin.stock.move.differential_csv_modal.csv_file_limit: Size limit applies
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2150:admin.stock.move.differential_csv_modal.csv_file_required: Please select a CSV file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2151:admin.stock.move.differential_csv_import.difference_qty_invalid: 'Line %line%: Difference quantity must be an integer.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2152:admin.stock.move.differential_csv_import.product_code_duplicated: 'Line %line%: Product code "%code%" is duplicated in the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2153:admin.stock.move.differential_csv_import.product_code_not_found: 'Line %line%: Product code "%code%" was not found in this stock move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2154:admin.stock.move.differential_csv_import.difference_qty_exceeds_actual_move: 'Line %line%: Difference quantity (%difference%) exceeds actual move quantity (%max%).'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2155:admin.stock.move.differential_csv_import.difference_qty_out_of_range: 'Line %line%: Difference quantity must be between %min% and %max%.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2156:admin.stock.move.differential_csv_modal.format_product_code: Product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2157:admin.stock.move.differential_csv_modal.format_product_code_desc: Product code with a difference
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2158:admin.stock.move.differential_csv_modal.format_product_name: Product name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2159:admin.stock.move.differential_csv_modal.format_product_name_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2160:admin.stock.move.differential_csv_modal.format_actual_move_qty: Actual move quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2161:admin.stock.move.differential_csv_modal.format_actual_move_qty_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2162:admin.stock.move.differential_csv_modal.format_difference_qty: Difference quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2163:admin.stock.move.differential_csv_modal.format_difference_qty_desc: Difference quantity (integer; positive for shortage, negative for surplus; blank is not updated)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2184:admin.stock.move_transfer.csv_file_registration: CSV file registration
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2185:admin.stock.move_transfer.csv_register_move: Register stock move CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2186:admin.stock.move_transfer.csv_register_transfer: Register stock transfer CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2187:admin.stock.move_transfer.csv_move_modal.file_row_limit_hint: (Up to 10,000 rows per file.)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2188:admin.stock.move_transfer.csv_move_modal.move_from_stock_location: Source stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2189:admin.stock.move_transfer.csv_move_modal.move_to_stock_location: Destination stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2190:admin.stock.move_transfer.csv_move_modal.col_product_code_hint: Enter the product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2191:admin.stock.move_transfer.csv_move_modal.col_move_quantity_hint: Enter the movement quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2192:admin.stock.move_transfer.csv_transfer_modal.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2193:admin.stock.move_transfer.csv_transfer_modal.transfer_from_stock_location: Transfer source stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2194:admin.stock.move_transfer.csv_transfer_modal.member: Member
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2195:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code: Transfer source product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2196:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code: Transfer destination product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2197:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity: Transfer quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2198:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint: Enter the transfer source product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2199:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint: Enter the transfer destination product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2200:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity_hint: Enter the transfer quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2201:admin.stock.move_transfer.barcode_csv_export.no_selection: Please select one or more stock move/transfer records.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2202:admin.stock.move_transfer.barcode_csv_export.not_found: No matching data found.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2203:admin.stock.move_transfer.barcode_csv_export.not_move_type: 'ID: %moveTransferId% cannot be exported because it is not a move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2204:admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination: 'ID: %moveTransferId% cannot be exported because the destination is not Smaregi stock.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2205:admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set: 'ID: %moveTransferId% has no destination store configured.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2206:admin.stock.move_transfer.barcode_csv_export.shop_not_permitted: 'ID: %moveTransferId% belongs to a store you are not authorized to access.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2207:admin.stock.move_transfer.barcode_csv_export.id_not_found: 'ID: %moveTransferId% does not exist.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2208:admin.stock.move_transfer.barcode_csv_export.multiple_shops: Stock move/transfer records from multiple stores cannot be processed at the same time.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2219:admin.order.shipping_csv_upload: Upload Shipping CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2324:admin.order.csv_shipping_date_description: Set Shipping Date in YYYY-MM-DD format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2325:admin.order.order_csv: Order CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2326:admin.order.shipping_csv: Shipping CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2367:admin.order.shipping_csv.shipping_id_col: Shipping ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2368:admin.order.shipping_csv.shipping_id_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2369:admin.order.shipping_csv.tracking_number_col: Tracking No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2370:admin.order.shipping_csv.tracking_number_description: Enter alphanumeric characters or hyphens
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2371:admin.order.shipping_csv.shipping_date_col: Shipping Date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2372:admin.order.shipping_csv.shipping_date_description: Enter the shipping date in the format of MM/DD/YYYY
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2585:admin.setting.shop.csv_setting: CSV Outputs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2706:admin.setting.shop.csv.csv_columns: CSV Output Items
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2707:admin.setting.shop.csv.csv_type: CSV Type
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2708:admin.setting.shop.csv.non_output_colmuns: NOT to Output
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2709:admin.setting.shop.csv.output_colmuns: To Output
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2710:admin.setting.shop.csv.operation: Output Menus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2711:admin.setting.shop.csv.operation__output: Add
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2712:admin.setting.shop.csv.operation__release: Delete
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2713:admin.setting.shop.csv.operation__all_output: Add All
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2714:admin.setting.shop.csv.operation__all_release: Delete All
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2715:admin.setting.shop.csv.order: Item Orders
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2716:admin.setting.shop.csv.order__up: Move Up
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2717:admin.setting.shop.csv.order__down: Move Down
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2718:admin.setting.shop.csv.order__top: Move to Top
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2719:admin.setting.shop.csv.order__bottom: Move to Bottom
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2720:admin.setting.shop.csv.how_to_use: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3132:tooltip.product.csv_upload: Bulk product registration is available with a CSV template.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3133:tooltip.product.csv_format: You can create a CSV data easily with templates available for downloads.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3134:tooltip.category.csv_upload: Bulk category registration is available with a CSV template.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3135:tooltip.category.csv_format: You can create a CSV data easily with templates available for downloads.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3153:tooltip.shipping.csv_upload: You can bulk-register shipping information with a CSV template.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3154:tooltip.shipping.csv_format: You can easily create CSV data in specified format with downloadable templates.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3201:tooltip.setting.shop.csv.csv_columns: You can output various data in CSV format. You can specify the items for CSV output.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3202:tooltip.setting.shop.csv.csv_type: Specify the CSV file type.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3228:tooltip.class_name.csv_upload: Standards can be registered in a batch using the specified type of CSV data.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3229:tooltip.class_name.csv_format: You can easily create CSV data of the specified type by downloading and editing the template file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3398:admin.stock.split_join.csv_preview_error: The preview could not be loaded. Please confirm you are still logged in and try again.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3402:admin.stock.split_join.split_csv_register: Register Stock Split CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3403:admin.stock.split_join.join_csv_register: Register Stock Join CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3404:admin.stock.split_join.list_csv_import_submit: Import from CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3405:admin.stock.split_join.list_csv_join_import_done: 'Registered %count% join(s) and advanced to shortage entry.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3406:admin.stock.split_join.list_csv_split_import_done: 'Registered %count% split(s) and submitted for approval.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3459:admin.stock.split_join.csv_file_not_found: 'CSV file not found.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3460:admin.stock.split_join.csv_header_invalid: 'Invalid CSV header format.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3461:admin.stock.split_join.csv_parse_failed: 'Failed to parse the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3462:admin.stock.split_join.csv_product_not_found: 'Row %line%: Product code "%code%" not found in the same store and stock location.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3463:admin.stock.split_csv_modal.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3464:admin.stock.split_csv_modal.store_placeholder: Please select a store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3465:admin.stock.split_csv_modal.inventory_category: Inventory Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3466:admin.stock.split_csv_modal.csv_file: CSV File
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3467:admin.stock.split_csv_modal.csv_file_limit: limit applies
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3468:admin.stock.split_csv_modal.no_file_selected: No file selected
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3469:admin.stock.split_csv_modal.register: Register
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3470:admin.stock.split_csv_modal.template_download: Download Template
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3471:admin.stock.split_csv_modal.approval_notification_label: Approval Notification Recipients
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3472:admin.stock.split_csv_modal.format_source_code: Source Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3473:admin.stock.split_csv_modal.format_source_code_desc: Enter the product code of the split source.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3474:admin.stock.split_csv_modal.format_split_quantity: Split Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3475:admin.stock.split_csv_modal.format_split_quantity_desc: Enter the split quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3476:admin.stock.split_csv_modal.format_target_code: Destination Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3477:admin.stock.split_csv_modal.format_target_code_desc: Enter the product code of the split destination.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3478:admin.stock.split_csv_modal.format_target_stock: Destination Stock
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3479:admin.stock.split_csv_modal.format_target_stock_desc: Enter the destination stock quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3480:admin.stock.join_csv_modal.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3481:admin.stock.join_csv_modal.inventory_category: Inventory Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3482:admin.stock.join_csv_modal.csv_file: CSV File
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3483:admin.stock.join_csv_modal.format_destination_code: Destination Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3484:admin.stock.join_csv_modal.format_destination_code_desc: Enter the product code of the join destination.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3485:admin.stock.join_csv_modal.format_join_quantity: Source Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3486:admin.stock.join_csv_modal.format_join_quantity_desc: Enter the join quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3487:admin.stock.join_csv_modal.format_source_code: Source Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3488:admin.stock.join_csv_modal.format_source_code_desc: Enter the product code of the join source.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3489:admin.stock.join_csv_modal.format_source_stock_category: Source Stock Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3490:admin.stock.join_csv_modal.format_source_stock_category_desc: Enter the stock category of the join source.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3491:admin.stock.join_csv_modal.format_source_stock_quantity: Source Stock Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3492:admin.stock.join_csv_modal.format_source_stock_quantity_desc: Enter the source stock quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3493:admin.stock.join_csv_modal.reflect_only_note: "※ This operation only reflects the CSV contents on screen. Please register separately."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3494:admin.stock.join_csv_modal.reflect_only_note_list: "※ The CSV contents will be imported and saved as awaiting approval."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3495:admin.stock.join_csv_modal.template_download: Download Template
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3500:admin.stock.split.csv_column_invalid: 'Invalid CSV columns. Row 1 must contain "Product Code" and "Destination Stock".'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3501:admin.stock.split.csv_same_as_source: 'Row %line%: The source product code cannot be used as a split destination.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3504:admin.stock.split.new_destination_csv_modal.title: Register Destination CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3505:admin.stock.split.new_destination_csv_modal.note: Upload a CSV file to register split destination products in bulk. The existing destination list will be replaced.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3506:admin.stock.split.new_destination_csv_modal.product_register: Register Destination Products
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3507:admin.stock.split.new_destination_csv_modal.format_product_code: Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3508:admin.stock.split.new_destination_csv_modal.format_product_code_desc: Enter the product code of the split destination.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3509:admin.stock.split.new_destination_csv_modal.format_destination_qty: Destination Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3510:admin.stock.split.new_destination_csv_modal.format_destination_qty_desc: Enter the destination quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3548:admin.stock.join.csv_column_invalid: 'Invalid CSV columns. Row 1 must contain "Product Code" and "Source Stock".'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3549:admin.stock.join.csv_same_as_destination: 'Row %line%: The same stock as the destination cannot be specified as a source.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3555:admin.stock.join.shortage_csv_modal.csv_file_required: Please select a CSV file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3605:admin.deck.csv_import: CSV Import
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3606:admin.deck.csv_export: CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3607:admin.deck.csv_export_no_selection: No deck selected for CSV export.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3670:admin.deck.csv_upload_title: Deck Registration CSV Upload
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3671:admin.deck.csv_upload_header: Deck Registration CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3672:admin.deck.csv_format_title: Deck Registration CSV File Format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3673:admin.deck.csv.commander: Commander
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3674:admin.deck.csv.error.format_invalid: "The format of %s is invalid. Please check the data on row %d."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3675:admin.deck.csv.error.deck_not_found: "Deck ID %s does not exist. Please check the data on row %d."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3676:admin.deck.csv.error.deck_type_invalid: "Deck ID %s is not an event type deck. Please check the data on row %d."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3699:admin.archetype.csv_import: CSV Import
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3700:admin.archetype.csv_upload_title: Archetype CSV Upload
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3701:admin.archetype.csv_upload_header: Archetype CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3702:admin.archetype.csv_format_title: Archetype CSV File Format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:3:{% set menus = ['product', 'product_csv_management', 'shelf_number_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:5:{% block sub_title %}{{ 'admin.product.product_shelf_number_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:243:            $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.team_battle_invalid', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:259:            $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.shop_not_editable', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:267:            $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.format_not_found', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:311:            $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.schedule_without_start', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:331:                    $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.reception_time_required', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:351:                    $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.reception_time_order', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:357:                    $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.reception_end_after_event_start', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:369:                    $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.online_reception_time_required', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:389:                    $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.online_reception_time_order', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/EventBulkCsvImportHandler.php:395:                    $ms->addRawMessage($this->transError('admin.event.entry.bulk_csv.error.online_reception_end_not_before_event_start', $rn));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:95:            const $differentialCsvForm = $('#form-move-differential-csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:96:            const $differentialCsvErr = $('#move-differential-csv-error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:174:            $('#btn-move-differential-csv-submit').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:436:                                    <a href="{{ url('admin_stock_move_inbound_approval_request_csv_export', { id: StockMoveTransfer.id }) }}" class="btn btn-ec-conversion me-2">{{ 'admin.stock.move.csv_output'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:437:                                    <button type="button" class="btn btn-ec-conversion me-2" data-bs-toggle="modal" data-bs-target="#moveDifferentialCsvModal">{{ 'admin.stock.move.differential_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:629:                                <h5 class="modal-title fw-bold" id="moveDifferentialCsvModalLabel">{{ 'admin.stock.move.differential_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:633:                                <form id="form-move-differential-csv"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:635:                                      action="{{ url('admin_stock_move_inbound_approval_request_differential_csv_import', { id: StockMoveTransfer.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:637:                                    <input type="hidden" name="_token" value="{{ csrf_token('stock_move_differential_csv') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:638:                                    <p class="text-muted small mb-3">{{ 'admin.stock.move.differential_csv_modal.note'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:640:                                        <label class="form-label fw">{{ 'admin.stock.move.differential_csv_modal.csv_file'|trans }} ({{ 'admin.stock.move.differential_csv_modal.csv_file_limit'|trans }})<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:642:                                            <input type="file" name="import_file" id="move-differential-csv-file" class="form-control form-control-sm" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:646:                                        <button type="button" class="btn btn-ec-conversion" id="btn-move-differential-csv-submit">{{ 'admin.stock.move.differential_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:651:                                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:656:                                            <td class="table-light w-25">{{ 'admin.stock.move.differential_csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:657:                                            <td class="text-muted small">{{ 'admin.stock.move.differential_csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:660:                                            <td class="table-light">{{ 'admin.stock.move.differential_csv_modal.format_product_name'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:661:                                            <td class="text-muted small">{{ 'admin.stock.move.differential_csv_modal.format_product_name_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:664:                                            <td class="table-light">{{ 'admin.stock.move.differential_csv_modal.format_actual_move_qty'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:665:                                            <td class="text-muted small">{{ 'admin.stock.move.differential_csv_modal.format_actual_move_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:668:                                            <td class="table-light">{{ 'admin.stock.move.differential_csv_modal.format_difference_qty'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:669:                                            <td class="text-muted small">{{ 'admin.stock.move.differential_csv_modal.format_difference_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:673:                                <p class="text-danger small mt-2 mb-0" id="move-differential-csv-error" style="display:none;"></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Form/stock_approval_notification_members_row.html.twig:5:{% block _admin_stock_split_csv_upload_approval_notification_target_members_row %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:249:                                <a href="{{ path('admin_product_buy_sale_price_history_export') }}" class="btn btn-ec-conversion">{{ 'admin.common.csv_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveDifferentialImportHandler.php:96:            foreach ($this->differenceByProductCode as $productCode => $csvRow) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveDifferentialImportHandler.php:98:                $differences[(string) $moveDetail->getId()] = $csvRow['differenceQuantity'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveDifferentialImportHandler.php:188:                'admin.stock.move.differential_csv_import.difference_qty_invalid',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveDifferentialImportHandler.php:205:                'admin.stock.move.differential_csv_import.product_code_duplicated',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveDifferentialImportHandler.php:224:                'admin.stock.move.differential_csv_import.product_code_not_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveDifferentialImportHandler.php:243:                'admin.stock.move.differential_csv_import.difference_qty_out_of_range',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveDifferentialImportHandler.php:267:                'admin.stock.move.differential_csv_import.difference_qty_exceeds_actual_move',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:3:  オプション: csv_format_type = 'product' | 'quantity'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:5:{% set ip_csv_format_type = csv_format_type|default('product') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:15:                <p class="text-muted small mb-3">{{ 'admin.product.inventory_plan.csv_import_limit'|trans({'%max%': csvImportMaxRecords|number_format}) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:19:                        <label class="form-label fw">{{ 'admin.product.inventory_plan.csv_modal.csv_file'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:21:                            <span class="btn btn-ec-regular js-ip-csv-file-btn">{{ 'admin.common.file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:22:                            <span class="js-ip-csv-file-name text-muted small">{{ 'admin.product.inventory_plan.csv_modal.no_file_selected'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:23:                            <input type="file" name="{{ form_name }}[import_file]" id="{{ file_input_id }}" class="d-none" accept=".csv,text/csv,.tsv,text/tsv">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:32:                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:37:                            <td class="table-light w-25">{{ 'admin.product.inventory_plan.csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:38:                            <td class="text-muted small">{{ 'admin.product.inventory_plan.csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:40:                        {% if ip_csv_format_type == 'quantity' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:42:                                <td class="table-light">{{ 'admin.product.inventory_plan.csv_modal.format_actual_stock'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:43:                                <td class="text-muted small">{{ 'admin.product.inventory_plan.csv_modal.format_actual_stock_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:61:    const btn = modal.querySelector('.js-ip-csv-file-btn');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:63:    const nameEl = modal.querySelector('.js-ip-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:64:    const emptyLabel = {{ 'admin.product.inventory_plan.csv_modal.no_file_selected'|trans|json_encode|raw }};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:86:                'admin.product.simple_high_price_csv.sell_price_not_updated',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:100:            'admin.product.simple_high_price_csv.no_matching_product_class',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:26:                        <a href="{{ url('admin_stock_split_join_csv_register', { type: 'split' }) }}" class="btn btn-ec-conversion me-2">{{ 'admin.stock.split_join.split_csv_register'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:27:                        <a href="{{ url('admin_stock_split_join_csv_register', { type: 'join' }) }}" class="btn btn-ec-conversion">{{ 'admin.stock.split_join.join_csv_register'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:40:                        <form name="{{ searchForm.vars.name }}" method="post" action="{{ url('admin_stock_split_join_csv_register') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:145:                                                <a href="{{ url('admin_stock_split_join_csv_register') }}" class="btn btn-ec-regular">{{ 'admin.stock.split_join.clear_search'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:33:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:47:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:48:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:55:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:58:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:62:        $filename = 'request_report_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:178:                                    {{ 'admin.product.inventory_plan.csv_import_submit'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:184:                                    {{ 'admin.product.inventory_plan.quantity_csv_import_submit'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:190:                                    {{ 'admin.product.csv.export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:267:    {% include '@admin/Stock/inventory_plan_csv_modal.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:270:            modal_title: 'admin.product.inventory_plan.csv_import_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:271:            form_id: 'form-inventory-plan-product-csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:273:            file_input_id: 'inventory-plan-product-csv-file',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:275:            submit_label: 'admin.product.inventory_plan.csv_import_submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:276:            csv_format_type: 'product',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:277:            csvImportMaxRecords: csvImportMaxRecords,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:279:        {% include '@admin/Stock/inventory_plan_csv_modal.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:282:            modal_title: 'admin.product.inventory_plan.quantity_csv_import_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:283:            form_id: 'form-inventory-plan-quantity-csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:285:            file_input_id: 'inventory-plan-quantity-csv-file',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:287:            submit_label: 'admin.product.inventory_plan.quantity_csv_import_submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:288:            csv_format_type: 'quantity',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:289:            csvImportMaxRecords: csvImportMaxRecords,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:598:                                            <button class="btn btn-ec-regular" type="submit" formaction="{{ url('admin_stock_history_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:600:                                            <button class="btn btn-ec-regular" type="submit" formaction="{{ url('admin_stock_history_disposal_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:602:                                                <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:13:{% set menus = ['setting', 'basic_info', 'shop_csv'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:15:{% block title %}{{ 'admin.setting.shop.csv_setting'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:25:                var tmp_select =  $('#csv-type[name="form[csv_type]"] option[selected]').val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:26:                $('#csv-type[name="form[csv_type]"]').val(tmp_select);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:42:            $('#add').on('click', {from: 'csv-not-output', to: 'csv-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:43:            $('#add-all').on('click', {from: 'csv-not-output', to: 'csv-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:44:            $('#remove').on('click', {from: 'csv-output', to: 'csv-not-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:45:            $('#remove-all').on('click', {from: 'csv-output', to: 'csv-not-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:48:                var $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:56:                var $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:59:                    val == 'top' ? $op.prependTo('#csv-output') : $op.appendTo('#csv-output');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:63:            $('#csv-type').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:65:                var href = '{{ url('admin_setting_shop_csv') }}' + '/' + id;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:70:            $('#csv-form').submit(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:71:                $('#csv-not-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:72:                $('#csv-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:79:    <form id="csv-form" method="post" action="{{ url('admin_setting_shop_csv', {'id': id}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:86:                            <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.csv.csv_columns'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:87:                                <span>{{ 'admin.setting.shop.csv.csv_columns'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:93:                                    <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.csv.csv_type'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:94:                                        <span>{{ 'admin.setting.shop.csv.csv_type'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:99:                                    {{ form_widget(form.csv_type, {'id': 'csv-type'}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:106:                                        <label for="FormControlSelect1">{{ 'admin.setting.shop.csv.non_output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:107:                                        {{ form_widget(form.csv_not_output, {'id': 'csv-not-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:112:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.operation'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:117:                                                                                                  aria-hidden="true"></i><span>&nbsp;{{ 'admin.setting.shop.csv.operation__output'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:124:                                                                                                     aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:131:                                                        class="fa fa-arrow-circle-right" aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_output'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:138:                                                                                                         aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:145:                                        <label for="FormControlSelect2">{{ 'admin.setting.shop.csv.output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:146:                                        {{ form_widget(form.csv_output, {'id': 'csv-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:151:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.order'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:156:                                                                                                              aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__up'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:163:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__down'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:170:                                                                                                                    aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__top'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:177:                                                                                                                       aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__bottom'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:184:                            {{ 'admin.setting.shop.csv.how_to_use'|trans|nl2br }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:66:        CsvExportService $csvService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:81:            $resolveCellValue = function (Csv $csv) use ($csvService, $entry, $entryPlayer, $deck, $eventDetail, $event): ?string {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:83:                    $value = $csvService->getData($csv, $candidateEntity);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:89:                $csvEntityClass = str_replace('\\\\', '\\', (string) $csv->getEntityName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:90:                $fieldName = (string) $csv->getFieldName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:91:                $entity = match ($csvEntityClass) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:118:                if ($csvEntityClass !== $actualEntityClass) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:121:                $csvForExport = clone $csv;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:122:                $csvForExport->setEntityName($actualEntityClass);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:124:                return $csvService->getData($csvForExport, $entity);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:128:            foreach ($csvService->getCsvs() as $csv) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:129:                $exportCsvRow->setData($resolveCellValue($csv));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:132:            $csvService->fputcsv($exportCsvRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:118:            return ['ok' => false, 'errors' => [trans('admin.stock.split_join.csv_file_not_found')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:124:            $this->eccubeConfig['eccube_csv_import_delimiter'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:125:            $this->eccubeConfig['eccube_csv_import_enclosure']
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:129:            return ['ok' => false, 'errors' => [trans('admin.stock.split_join.csv_header_invalid')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:134:            return ['ok' => false, 'errors' => [trans('admin.csv.error.data.empty')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:145:                return ['ok' => false, 'errors' => [trans('admin.stock.split.csv_column_invalid')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:151:                return ['ok' => false, 'errors' => [trans('admin.common.csv_invalid_required', ['%line%' => $lineNum, '%name%' => '商品コード'])]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:156:                return ['ok' => false, 'errors' => [trans('admin.common.csv_invalid_format_line_name', ['%line%' => $lineNum, '%name%' => '分割先在庫数'])]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:167:                return ['ok' => false, 'errors' => [trans('admin.stock.split_join.csv_product_not_found', ['%line%' => $lineNum, '%code%' => $code])]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:172:                return ['ok' => false, 'errors' => [trans('admin.stock.split.csv_same_as_source', ['%line%' => $lineNum])]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:3:{% set menus = ['setting', 'basic_info', 'custom_csv'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:5:{% block title %}{{ 'admin.setting.shop.custom_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:27:            $('#add').on('click', {from: 'csv-not-output', to: 'csv-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:28:            $('#add-all').on('click', {from: 'csv-not-output', to: 'csv-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:29:            $('#remove').on('click', {from: 'csv-output', to: 'csv-not-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:30:            $('#remove-all').on('click', {from: 'csv-output', to: 'csv-not-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:33:                const $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:41:                const $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:44:                    val == 'top' ? $op.prependTo('#csv-output') : $op.appendTo('#csv-output');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:48:            $('#csv-type').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:50:                const href = '{{ url('admin_setting_shop_csv_custom') }}' + '/' + id;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:54:            $('#admin_custom_csv_csv_extensions').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:55:                const csvTypeId = $('#csv-type').val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:56:                let href = '{{ url('admin_setting_shop_csv_custom') }}' + '/' + csvTypeId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:62:            $('#csv-form').submit(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:63:                $('#csv-not-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:64:                $('#csv-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:79:    <form id="csv-form" method="post" action="{{ path('admin_setting_shop_csv_custom_update', {'csvTypeId': csvTypeId, 'csvExtensionId': csvExtensionId}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:86:                            <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.csv.csv_columns'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:87:                                <span>{{ 'admin.setting.shop.csv.csv_columns'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:93:                                    <span>{{ 'admin.setting.shop.csv.csv_type'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:97:                                    {{ form_widget(form.csv_type, {'id': 'csv-type'}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:103:                                    <span>{{ 'admin.setting.shop.custom_csv'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:106:                                    {{ form_widget(form.csv_extensions) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:112:                                    <span>{{ 'admin.setting.shop.csv.output_name'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:126:                                        <label for="FormControlSelect1">{{ 'admin.setting.shop.csv.non_output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:127:                                        {{ form_widget(form.csv_not_output, {'id': 'csv-not-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:132:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.operation'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:137:                                                                                                  aria-hidden="true"></i><span>&nbsp;{{ 'admin.setting.shop.csv.operation__output'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:144:                                                                                                     aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:151:                                                        class="fa fa-arrow-circle-right" aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_output'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:158:                                                                                                         aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:165:                                        <label for="FormControlSelect2">{{ 'admin.setting.shop.csv.output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:166:                                        {{ form_widget(form.csv_output, {'id': 'csv-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:171:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.order'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:176:                                                                                                              aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__up'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:183:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__down'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:190:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__top'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:197:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__bottom'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:213:                            {% if csvExtensionId %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:217:                                   data-url="{{ path('admin_setting_shop_csv_custom_delete', {csvExtensionId: csvExtensionId}) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:248:                    <p class="text-start modal-message">{{ 'admin.setting.shop.csv.delete_modal__message'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:44:    /** @param CsvExportService $csvExportService @param DtbDeckRepository $deckRepository */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:46:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:53:     * ファイル名は `used_card_product_YmdHis.csv` 形式。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:62:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:63:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:70:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:73:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:77:        $filename = 'used_card_product_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockApprovalList.php:42:        MtbStockHistorySourceType::STOCK_CHANGE_CSV_IMPORT => 'admin.stock.approval_list.approval_target_csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:876:front.mypage.purchase_history.detail.bulk.low_price_notice: "※ まとめて買取では、%min%円未満のカードの個別のキャンセルは承っておりません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:877:front.mypage.purchase_history.detail.bulk.agree_low_price_all: "%min%円未満のカードをすべて売却する"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1556:admin.common.csv_upload_complete: CSVファイルをアップロードしました
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1557:admin.common.csv_upload_error: CSVファイルのアップロードに失敗しました
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1573:# csvバリデーションエラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1574:admin.csv.error.upload.require: ファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1575:admin.csv.error.upload.maxsize: "CSVファイルは %maxSize% MB以下でアップロードしてください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1576:admin.csv.error.upload.maxrecord: "%maxRecord% 行を超えるCSVファイルは登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1577:admin.csv.error.data.already_executing: "既に %csvName% インポートが実行中です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1578:admin.csv.error.data.lock_failed: "DBのロックに失敗しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1693:admin.common.csv_download: CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1694:admin.common.csv_upload: CSVファイルをアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1695:admin.common.csv_skeleton_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1696:admin.common.csv_format: CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1697:admin.common.csv_item_name: 項目名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1698:admin.common.csv_description: 説明
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1699:admin.common.csv_select: CSVファイルを選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1706:admin.common.csv_checkbox_force_missing_file_pass_to_db: "ファイルの有無に関わらず、ファイルパスをデータベースに追加する。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1708:admin.common.csv_invalid_format: CSVのフォーマットが一致しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1709:admin.common.csv_invalid_no_data: CSVデータが存在しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1710:admin.common.csv_invalid_required: "%line%行目の%name%が設定されていません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1711:admin.common.csv_invalid_greater_than_zero: "%line%行目の%name%は0以上の数値を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1712:admin.common.csv_invalid_format_line: "%line%行目のCSVフォーマットが一致しません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1713:admin.common.csv_invalid_format_line_name: "%line%行目の%name%のフォーマットが異なります"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1714:admin.common.csv_invalid_date_format: "%line%行目の%name%の日付フォーマットが異なります"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1715:admin.common.csv_invalid_not_found: "%line%行目の%name%が存在しません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1716:admin.common.csv_invalid_not_found_target: "%line%行目の%name%「%target_name%」が存在しません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1717:admin.common.csv_invalid_not_same: "%line%行目の%name1%と%name2%には同じ値を使用できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1718:admin.common.csv_invalid_can_not: "%line%行目の%name%は設定できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1719:admin.common.csv_invalid_image: '%line%行目の%name%には末尾に"/"や"../"を使用できません'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1720:admin.common.csv_invalid_foreign_key: "%line%行目の%name%は関連するデータがあるため削除できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1721:admin.common.csv_invalid_description_detail_upper_limit: "%line%行目の%name%は%max%文字以下の文字列を指定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1722:admin.common.csv_invalid_image_file: "%line%行目の%name%は画像ファイルが見つかりませんでした。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1723:admin.common.csv_invalid_image_file_size: "%line%行目の%name%は画像ファイルサイズが大きすぎます。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1724:admin.common.csv_invalid_image_file_not_image: "%line%行目の%name%は画像ファイルではありません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1725:admin.common.csv_disallow_url_paths: "%line%行目の%name%には見つからないURLパスを設定できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1726:admin.common.csv_cannot_allow_disabled_url: "%line%行目の%name%には見つからないURLパスを設定できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1727:admin.common.csv_cannot_find_file_but_forcefully_saved_pass: "%line%行目の%name%が見つかりませんでしたが、強制的にファイルパスをデータベースに追加しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1728:admin.common.csv_upload_in_progress: "CSVファイルのアップロード中..."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1729:admin.common.csv_upload_line_success: "%from%行目〜%to%行目を登録しました"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1730:admin.common.csv_upload_line_error: "エラーが発生しました。%from%行目以降の登録処理はキャンセルされました"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1731:admin.common.csv_back_to_list: 一覧に戻る
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1732:admin.common.csv_import_error: CSVインポートエラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1733:admin.common.csv_file_select: CSVファイル選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1734:admin.common.csv_import: CSV取り込み
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1735:admin.common.csv_id_optional: (新規登録時は入力不要)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1736:admin.common.csv_export_guide: '<a href="%url%" class="text-muted text-decoration-underline">登録済みのデータをCSV出力</a>して、フォーマットを確認・編集してからアップロードすることをお勧めします。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1881:admin.product.product_csv_management: 商品CSV管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1882:admin.product.product_csv_upload: 商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1883:admin.product.product_card_csv_upload: カード商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1884:admin.product.product_card_csv_upload_title: カード商品登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1885:admin.product.product_card_csv_format_title: カード商品登録CSVフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1886:admin.product.product_goods_csv_upload: グッズ商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1887:admin.product.class_name_csv_upload: 規格CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1888:admin.product.class_category_csv_upload: 規格分類CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1889:admin.product.category_csv_upload: カテゴリCSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1890:admin.product.category_bulk_csv: カテゴリ登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1891:admin.product.category_bulk_csv_upload_title: カテゴリ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1892:admin.product.category_bulk_csv_format_title: カテゴリ登録CSVフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1927:admin.storagecode.duplicate_csv_rank_error: "CSV内で並び順が重複しています。 %row% 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1933:admin.product.storage_code_csv_upload_title: 略称タグ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1934:admin.product.storage_code_csv_format_title: 略称タグ登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1935:admin.product.csv_import_history_title: CSVインポート履歴
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1936:admin.product.csv_import_history_filename: ファイル名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1937:admin.product.csv_import_history_upload_date: アップロード日時
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1938:admin.product.csv_import_history_operator: 作業者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1941:admin.product.product_tag_csv: 商品タグ更新CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1942:admin.product.product_tag_csv_upload_title: 商品タグ更新CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1943:admin.product.product_tag_csv_format_title: 商品タグ更新CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1946:admin.product.product_price_csv: セール用価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1947:admin.product.product_price_csv_upload_title: セール用価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1948:admin.product.product_price_csv_format_title: セール用価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1951:admin.product.simple_high_price_csv: 高額商品価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1952:admin.product.simple_high_price_csv_upload_title: 高額商品価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1953:admin.product.simple_high_price_csv_format_title: 高額商品価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1954:admin.product.simple_high_price_csv.sale_alert: セール中商品の販売価格は変更できません。基準価格のみ更新されます。セール外の商品は基準価格・販売価格の両方を更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1955:admin.product.simple_high_price_csv.sell_price_not_updated: "%d行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1956:admin.product.simple_high_price_csv.no_matching_product_class: "%d行目: 対象の商品規格がありません。（商品公開ステータスが0かつ高額商品コードが設定された規格のみ対象です）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1959:admin.product.sale_high_price_csv: セール用高額商品価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1960:admin.product.sale_high_price_csv_upload_title: セール用高額商品価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1961:admin.product.sale_high_price_csv_format_title: セール用高額商品価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1962:admin.product.sale_high_price_csv.alert_off_sale_buy_only: "%d行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1963:admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard: "%d行目: 通常商品のため、買取価格はCSVの値で更新しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1966:admin.product.product_section_csv: 部門登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1967:admin.product.product_section_csv_upload_title: 部門登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1968:admin.product.product_section_csv_format_title: 部門登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1969:admin.product.product_status_csv: 商品公開CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1970:admin.product.product_status_csv_upload_title: 商品公開CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1971:admin.product.product_status_csv_format_title: 商品公開CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1974:admin.product.product_standard_price_csv: 基準価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1975:admin.product.product_standard_price_csv_upload_title: 基準価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1976:admin.product.product_standard_price_csv_format_title: 基準価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1977:admin.product.standard_price_csv.product_class_not_found: "%d行目: 商品ID %s・言語ID %s に該当する商品規格がありません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1978:admin.product.standard_price_csv.sale_product_sell_price_unchanged: "%d行目: セール中商品のため、販売価格は変更されません。（基準価格・買取価格は更新しました）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1981:admin.product.product_shelf_number_csv: 棚番号登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1982:admin.product.product_shelf_number_csv_upload_title: 棚番号登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1983:admin.product.product_shelf_number_csv_format_title: 棚番号登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1986:admin.product.tag_sales_analysis_csv: 売上分析タグ更新CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1987:admin.product.tag_sales_analysis_csv_upload_title: 売上分析タグ更新CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1988:admin.product.tag_sales_analysis_csv_format_title: 売上分析タグ更新CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2076:admin.product.price_csv.sell_price_not_reflected: "%d行目: セールフラグを無効にしたため、CSVに設定された販売価格は反映されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2077:admin.product.price_csv.normal_product_sell_price_unchanged: "%d行目: 通常商品のため、販売価格は変更されませんでした。買取価格のみ更新しています。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2192:admin.product.card_csv_export: カード商品CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2193:admin.product.goods_csv_export: グッズ商品CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2194:admin.product.sale_price_csv_export: セール用価格変更CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2196:admin.product.custom_csv_export: カスタムデータCSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2245:admin.product.product_csv.product_id_col: 商品ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2246:admin.product.product_csv.product_id_description: 新規登録の場合は空にしてください。既存の商品を更新する場合は、商品IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2247:admin.product.product_csv.display_status_col: 公開ステータス(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2248:admin.product.product_csv.display_status_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2249:admin.product.product_csv.product_name_col: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2250:admin.product.product_csv.product_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2251:admin.product.product_csv.shop_memo_col: ショップ用メモ欄
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2252:admin.product.product_csv.shop_memo_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2253:admin.product.product_csv.description_list_col: 商品説明(一覧)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2254:admin.product.product_csv.description_list_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2255:admin.product.product_csv.description_detail_col: 商品説明(詳細)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2256:admin.product.product_csv.description_detail_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2257:admin.product.product_csv.keyword_col: 検索ワード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2258:admin.product.product_csv.keyword_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2259:admin.product.product_csv.free_area_col: フリーエリア
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2260:admin.product.product_csv.free_area_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2261:admin.product.product_csv.delete_flag_col: 商品削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2262:admin.product.product_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2263:admin.product.product_csv.product_image_col: 商品画像
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2264:admin.product.product_csv.product_image_description: '画像のファイル名を指定します。複数画像の場合、画像ファイル名をカンマ区切りで「"」で囲んでください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2265:admin.product.product_csv.category_col: 商品カテゴリ(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2266:admin.product.product_csv.category_description: 'カテゴリIDを指定します。複数カテゴリの場合、商品カテゴリIDをカンマ区切りで「"」で囲んでください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2267:admin.product.product_csv.tag_col: タグ(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2268:admin.product.product_csv.tag_description: 'タグIDを指定します。複数タグの場合、タグIDをカンマ区切りで「"」で囲んでください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2269:admin.product.product_csv.sale_type_col: 販売種別(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2270:admin.product.product_csv.sale_type_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2271:admin.product.product_csv.class_category1_col: 規格分類1(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2272:admin.product.product_csv.class_category1_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2273:admin.product.product_csv.class_category2_col: 規格分類2(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2274:admin.product.product_csv.class_category2_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2275:admin.product.product_csv.delivery_duration_col: 発送日目安(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2276:admin.product.product_csv.delivery_duration_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2277:admin.product.product_csv.product_code_col: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2278:admin.product.product_csv.product_code_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2279:admin.product.product_csv.stock_col: 在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2280:admin.product.product_csv.stock_description: 在庫数無制限フラグが0の場合、0以上の数値を設定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2281:admin.product.product_csv.stock_unlimited_col: 在庫数無制限フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2282:admin.product.product_csv.stock_unlimited_description: "0:制限 1: 無制限を指定します。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2283:admin.product.product_csv.sale_limit_col: 販売制限数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2284:admin.product.product_csv.sale_limit_description: 1以上の数値を設定します。未指定の場合、販売制限数なしとして扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2285:admin.product.product_csv.normal_price_col: 通常価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2286:admin.product.product_csv.normal_price_description: 0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2287:admin.product.product_csv.sale_price_col: 販売価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2288:admin.product.product_csv.sale_price_description: 0以上の数値を設定します。未指定の場合、非表示として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2289:admin.product.product_csv.delivery_fee_col: 送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2290:admin.product.product_csv.delivery_fee_description: 商品ごとの送料設定が有効の場合、0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2291:admin.product.product_csv.tax_rate_col: 税率
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2292:admin.product.product_csv.tax_rate_description: 商品別税率機能設定が有効の場合、0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2293:admin.product.product_csv.product_class_visible_flag_col: 商品規格表示フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2294:admin.product.product_csv.product_class_visible_flag_description: 0:非表示 1:表示を指定します。未指定の場合は更新しません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2295:admin.product.csv.import: CSV入力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2296:admin.product.csv.export: CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2299:admin.product.category_csv.category_id_col: カテゴリID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2300:admin.product.category_csv.category_id_description: 新規登録の場合は空にしてください。既存のカテゴリを更新する場合は、カテゴリIDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2301:admin.product.category_csv.category_name_col: カテゴリ名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2302:admin.product.category_csv.category_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2303:admin.product.category_csv.parent_category_id_col: 親カテゴリID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2304:admin.product.category_csv.parent_category_id_description: 登録済みのカテゴリIDを数字で指定してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2305:admin.product.category_csv.delete_flag_col: カテゴリ削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2306:admin.product.category_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2309:admin.product.class_name_csv.class_name_id_col: 規格ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2310:admin.product.class_name_csv.class_name_id_description: 新規登録の場合は空にしてください。既存の規格を更新する場合は、規格IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2311:admin.product.class_name_csv.class_name_col: 規格名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2312:admin.product.class_name_csv.class_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2313:admin.product.class_name_csv.class_backend_name_col: 管理名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2314:admin.product.class_name_csv.class_backend_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2315:admin.product.class_name_csv.delete_flag_col: 規格削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2316:admin.product.class_name_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2319:admin.product.class_category_csv.class_name_id_col: 規格ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2320:admin.product.class_category_csv.class_name_id_description: 既存の規格IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2321:admin.product.class_category_csv.class_category_id_col: 規格分類ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2322:admin.product.class_category_csv.class_category_id_description: 新規登録の場合は空にしてください。既存の規格分類を更新する場合は、規格分類IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2323:admin.product.class_category_csv.class_category_name_col: 規格分類名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2324:admin.product.class_category_csv.class_category_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2325:admin.product.class_category_csv.class_category_backend_name_col: 規格分類管理名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2326:admin.product.class_category_csv.class_category_backend_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2327:admin.product.class_category_csv.delete_flag_col: 規格分類削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2328:admin.product.class_category_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2331:admin.product.product_csv_upload__title: "商品CSVをアップロードします"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2332:admin.product.product_csv_upload__message: "商品CSVファイルをアップロードします。よろしいですか？"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2335:admin.product.stock_change_csv.stock_product_code_col: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2336:admin.product.stock_change_csv.stock_product_code_description: 在庫変更対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2337:admin.product.stock_change_csv.stock_change_quantity_col: 在庫増減数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2338:admin.product.stock_change_csv.stock_change_quantity_description: 在庫変更対象の商品の在庫増減数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2339:admin.product.stock_change_csv.stock_purchase_price_col: 仕入単価
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2340:admin.product.stock_change_csv.stock_purchase_price_description: 在庫変動区分の親区分が入庫の場合必須入力 在庫変更対象の商品の仕入単価を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2343:admin.product.department_csv.type_name: 部門CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2344:admin.product.department_csv.section_id_col: 部門ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2345:admin.product.department_csv.section_id_description: 新規登録の場合は空にしてください。既存の部門を更新する場合は、部門IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2346:admin.product.department_csv.section_name_col: 部門名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2347:admin.product.department_csv.section_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2348:admin.product.department_csv.section_code_col: 部門コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2349:admin.product.department_csv.section_code_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2350:admin.product.department_csv.section_tax_free_division_col: 免税区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2351:admin.product.department_csv.section_tax_free_division_description: 0:対象外 1:一般品 2:消耗品のいずれかを指定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2352:admin.product.department_csv.section_visible_col: MTGBuyer表示フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2353:admin.product.department_csv.section_visible_description: 0:非表示 1:表示を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2356:admin.csv.error.format.header: "CSVのフォーマットが一致しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2357:admin.csv.error.format.body: "CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2358:admin.csv.error.data.empty: "CSVデータが存在しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2359:admin.stock.csv.error_limit_notice: "エラーを最大20件まで表示しています。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2360:admin.csv.error.data.require: "%s は必須項目です。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2361:admin.csv.error.data.not_registered: "%s : %s がマスターから取得できません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2362:admin.csv.error.data.out_of_stock: "%d 行目の%s : %s の在庫個数が足りません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2363:admin.csv.error.data.string_max_length: "%d 行目の %s は %d 文字以内で入力してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2364:admin.csv.error.product.invalid: "%d 行目の %s の値が異常です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2365:admin.csv.error.product.not_exists: "%d 行目の %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2366:admin.csv.error.product.required: "%d 行目の %s が設定されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2367:admin.csv.error.product.over_zero: "%d 行目の %s は0以上の数値を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2368:admin.csv.error.product.max_length: "%d 行目の %s は %d桁以内の数値 を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2369:admin.csv.error.product.filename: '%d 行目の %s には末尾に "/" や "../" を使用できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2370:admin.csv.error.product.price_valid: "%d 行目の販売価格は買取価格より大きい価格を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2371:admin.csv.error.product.new_product_cannot_be_deleted: "%d 行目の新規登録商品には 商品削除フラグ 「削除する」を指定できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2372:admin.csv.error.product.product_code_duplicated: "%d 行目の商品コードの値 %s は重複して登録されてるため更新できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2373:admin.csv.error.product.non_unique_card_detail_found: "%d 行目で該当するカード情報が複数見つかったため更新できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2374:admin.csv.error.product.product_with_card_detail_exists: "%d 行目のカード %s は商品マスターに登録済みです。登録をスキップします。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2375:admin.csv.error.product.product_update_lock_timeout: "%d 行目の商品が他の処理により更新中です。少し時間を空けてから再度更新してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2376:admin.csv.error.product.new_product_be_duplicate: "%d 行目の新規登録商品の商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2377:admin.csv.error.product.new_product_smaregi_product_code_duplicate: "%d 行目の新規登録商品のスマレジ商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2378:admin.csv.error.product.abolished_status_with_stock: "%d 行目の %s を「廃止」に変更する場合、在庫が0である必要があります。EC-CUBE内在庫またはスマレジ内在庫に在庫が存在するため、変更できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2379:admin.csv.error.product.smaregi_alignment_flg_off_with_stock: "%d 行目の %s を「無効」に変更する場合、スマレジ内在庫が0である必要があります。スマレジ内在庫に在庫が存在するため、変更できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2380:admin.csv.error.product.product_class_count_invalid_for_update: "%d 行目の %s=%d に該当する商品規格が %d 件です。更新時は 1 件である必要があります。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2381:admin.csv.error.storage_code.not_exists: "%d 行目の %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2382:admin.csv.error.inventory_plan_detail.product_code_not_exists: "%d 行目の商品コード %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2383:admin.csv.error.inventory_plan_detail.product_stock_not_found: "%d 行目の商品コード %s は、棚卸計画で指定された店舗・在庫区分の在庫が存在しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2384:admin.csv.error.inventory_plan_detail.plan_base_info_or_stock_location_required: 棚卸計画に店舗または在庫区分が設定されていないため、CSV登録できません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2385:admin.csv.error.inventory_plan_detail.product_code_duplicated: "%d 行目の商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2386:admin.csv.error.inventory_plan_detail.product_code_non_unique: "%d 行目の商品コード %s が複数の商品規格に設定されているため特定できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2387:admin.csv.error.inventory_plan_detail.product_code_not_registered: "%d 行目の商品コード %s は棚卸計画に登録されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2388:admin.csv.error.inventory_plan_detail.actual_stock_invalid: "%d 行目: 棚卸数量は0以上の整数で入力してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2389:admin.csv.error.shelf_number.name_duplicate: "名称がすでに登録されています。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2391:admin.csv.error.category.update_requires_sort: "%d 行目: カテゴリIDが指定されている更新行では、表示ランクを入力してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2392:admin.csv.error.category.not_found: "%d 行目: 指定したカテゴリIDのカテゴリが見つかりません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2393:admin.csv.error.category.new_must_not_have_sort: "%d 行目: 新規登録の行では表示ランクを入力しないでください（取込時に自動設定されます）。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2394:admin.csv.error.category.id_equals_parent: "%d 行目: カテゴリIDと親カテゴリIDに同じ値を指定することはできません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2395:admin.csv.error.category.parent_is_descendant: "%d 行目: 親カテゴリに、指定カテゴリの子孫を指定することはできません（循環参照になります）。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2396:admin.csv.error.category.parent_not_found: "%d 行目: 指定した親カテゴリIDのカテゴリが見つかりません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2397:admin.csv.error.category.nest_level_exceeded: "%d 行目: 親を指定した場合の階層が上限（%d 階層まで）を超えます。親カテゴリを見直してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2398:admin.csv.error.export.not_registered: 存在しないカードIDが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2399:admin.csv.error.export.no_card_selected: 1つ以上のカードを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2400:admin.csv.error.export.no_card_data: カードデータが存在しないためエクスポートできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2401:admin.csv.error.customer.not_member: "%row% 行目の会員は非会員状態の可能性があります。データ確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2402:admin.csv.error.exception.datetime: "%row% 行目の %column% で日時の形式が不正です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2412:admin.order.shipping_csv_upload: 出荷CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2527:admin.order.csv_shipping_date_description: 出荷日を「YYYY-MM-DD」の形式で設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2528:admin.order.order_csv: 受注CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2529:admin.order.shipping_csv: 出荷CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2576:admin.order.shipping_csv.shipping_id_col: 出荷ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2577:admin.order.shipping_csv.shipping_id_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2578:admin.order.shipping_csv.tracking_number_col: お問い合わせ番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2579:admin.order.shipping_csv.tracking_number_description: 半角英数字かハイフンのみで設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2580:admin.order.shipping_csv.shipping_date_col: 出荷日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2581:admin.order.shipping_csv.shipping_date_description: "出荷日を「YYYY-MM-DD」の形式で設定"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2736:admin.customer.csv: CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2938:admin.setting.shop.csv_setting: CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3110:admin.setting.shop.csv.csv_columns: CSV出力項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3111:admin.setting.shop.csv.csv_type: CSV種別
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3112:admin.setting.shop.csv.non_output_colmuns: 出力しない項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3113:admin.setting.shop.csv.output_colmuns: 出力する項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3114:admin.setting.shop.csv.operation: 操作項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3115:admin.setting.shop.csv.operation__output: 出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3116:admin.setting.shop.csv.operation__release: 解除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3117:admin.setting.shop.csv.operation__all_output: すべて出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3118:admin.setting.shop.csv.operation__all_release: すべて解除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3119:admin.setting.shop.csv.order: 項目順序
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3120:admin.setting.shop.csv.order__up: ひとつ上へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3121:admin.setting.shop.csv.order__down: ひとつ下へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3122:admin.setting.shop.csv.order__top: 一番上へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3123:admin.setting.shop.csv.order__bottom: 一番下へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3124:admin.setting.shop.csv.how_to_use: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3558:tooltip.product.csv_upload: 所定の型のCSVデータを用いて商品を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3559:tooltip.product.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3560:tooltip.category.csv_upload: 所定の型のCSVデータを用いてカテゴリを一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3561:tooltip.category.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3579:tooltip.shipping.csv_upload: 所定の型のCSVデータを用いて出荷情報を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3580:tooltip.shipping.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3629:tooltip.setting.shop.csv.csv_columns: 各種のデータをCSVで出力できます。出力したい項目をこちらで設定することが可能です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3630:tooltip.setting.shop.csv.csv_type: 設定したいCSVの種類を指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3657:tooltip.class_name.csv_upload: 所定の型のCSVデータを用いて規格を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3658:tooltip.class_name.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3882:admin.product.department_csv_upload: 部門CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3974:admin.product.inventory_plan.csv_import_title: 棚卸商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3975:admin.product.inventory_plan.csv_import_limit: '1ファイルの登録上限は %max% 件です'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3976:admin.product.inventory_plan.csv_import_submit: 商品登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3977:admin.product.inventory_plan.csv_modal.csv_file: CSVファイル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3978:admin.product.inventory_plan.csv_modal.no_file_selected: ファイルが選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3979:admin.product.inventory_plan.csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3980:admin.product.inventory_plan.csv_modal.format_product_code_desc: 棚卸計画に登録する商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3981:admin.product.inventory_plan.csv_modal.format_actual_stock: 棚卸数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3982:admin.product.inventory_plan.csv_modal.format_actual_stock_desc: 棚卸数量を整数で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3983:admin.product.inventory_plan.quantity_csv_import_title: 棚卸商品数量CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3984:admin.product.inventory_plan.quantity_csv_import_submit: 数量登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3985:admin.product.inventory_plan.quantity_csv_import.complete: 棚卸数量を登録しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4085:admin.customer.delivery_csv: 配送先情報CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4086:admin.customer.delivery_csv.csv_invalid_zipcode: "%d行目の郵便番号の入力に誤りがあります（郵便番号1・2が両方未入力の場合は海外郵便番号が必須です）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4087:admin.customer.delivery_csv.csv_invalid_zipcode_partial: "%d行目の郵便番号の入力に誤りがあります（郵便番号1と2はどちらか一方のみの入力はできません）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4088:admin.customer.delivery_csv.csv_invalid_pref: "%d行目の都道府県の入力に誤りがあります（日本の場合は必須、海外の場合は入力不可）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4141:admin.setting.shop.custom_csv: カスタムCSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4142:admin.setting.shop.custom_csv_menu: カスタムCSV出力設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4143:admin.setting.shop.custom_csv_setting: カスタムCSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4144:admin.setting.shop.csv.save.complete: CSV出力項目を保存しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4145:admin.setting.shop.csv.output_name: 出力名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4146:admin.setting.shop.csv.delete_modal__message: このCSV出力設定を削除してもよろしいでしょうか？
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4320:admin.deck.csv_import: CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4321:admin.deck.csv_export: CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4322:admin.deck.csv_export_no_selection: CSV出力対象のデッキが選択されていません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4385:admin.deck.csv_upload_title: デッキ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4386:admin.deck.csv_upload_header: デッキ登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4387:admin.deck.csv_format_title: デッキ登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4388:admin.deck.csv.commander: 統率者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4389:admin.deck.csv.error.format_invalid: "%s のフォーマットが一致しません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4390:admin.deck.csv.error.deck_not_found: "指定されたデッキID %s が存在しません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4391:admin.deck.csv.error.deck_type_invalid: "指定されたデッキID %s は event タイプではありません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4414:admin.archetype.csv_import: CSV取り込み
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4415:admin.archetype.csv_upload_title: アーキタイプ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4416:admin.archetype.csv_upload_header: アーキタイプ登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4417:admin.archetype.csv_format_title: アーキタイプ登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4456:admin.card.card_csv: カードCSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4457:admin.card.card_csv_upload_title: カードCSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4458:admin.card.card_csv_format_title: カードCSVフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4459:admin.card.csv_tsv_not_allowed: TSVファイルはアップロードできません。CSVファイルをアップロードしてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4549:admin.stock.move.shortage_csv_register: 欠品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4550:admin.stock.move.shortage_csv_invalid_status: 欠品CSV登録可能なステータスではありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4551:admin.stock.move.shortage_csv_modal.note: 欠品点数をCSVで一括登録します。欠品点数を入力した行のみ更新され、空欄の行およびCSVに含まれない明細は変更されません。0を入力した場合は欠品点数を0に更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4552:admin.stock.move.shortage_csv_modal.csv_file: CSVファイル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4553:admin.stock.move.shortage_csv_modal.csv_file_limit: 上限あり
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4554:admin.stock.move.shortage_csv_modal.csv_file_required: CSVファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4555:admin.stock.move.shortage_csv_import.file_not_found: 'ファイルが読み込めません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4556:admin.stock.move.shortage_csv_import.shortage_qty_invalid: '%line%行目: 欠品点数は0以上の整数で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4557:admin.stock.move.shortage_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4558:admin.stock.move.shortage_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4559:admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move: '%line%行目: 欠品点数（%shortage%）が移動点数（%max%）を超えています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4560:admin.stock.move.shortage_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4561:admin.stock.move.shortage_csv_modal.format_product_code_desc: 欠品対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4562:admin.stock.move.shortage_csv_modal.format_product_name: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4563:admin.stock.move.shortage_csv_modal.format_product_name_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4564:admin.stock.move.shortage_csv_modal.format_move_qty: 移動点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4565:admin.stock.move.shortage_csv_modal.format_move_qty_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4566:admin.stock.move.shortage_csv_modal.format_shortage_qty: 欠品点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4567:admin.stock.move.shortage_csv_modal.format_shortage_qty_desc: 欠品点数を記入（0以上の整数。空欄は更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4590:admin.stock.move.csv_output: CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4591:admin.stock.move.differential_csv_register: 差分CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4592:admin.stock.move.differential_csv_invalid_status: 差分CSV登録可能なステータスではありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4593:admin.stock.move.differential_csv_modal.note: 差分点数をCSVで一括登録します。差分点数を入力した行のみ更新され、空欄の行およびCSVに含まれない明細は変更されません。0を入力した場合は差分点数を0に更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4594:admin.stock.move.differential_csv_modal.csv_file: CSVファイル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4595:admin.stock.move.differential_csv_modal.csv_file_limit: 上限あり
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4596:admin.stock.move.differential_csv_modal.csv_file_required: CSVファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4597:admin.stock.move.differential_csv_import.difference_qty_invalid: '%line%行目: 差分点数は整数で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4598:admin.stock.move.differential_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4599:admin.stock.move.differential_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4600:admin.stock.move.differential_csv_import.difference_qty_exceeds_actual_move: '%line%行目: 差分点数（%difference%）が実移動点数（%max%）を超えています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4601:admin.stock.move.differential_csv_import.difference_qty_out_of_range: '%line%行目: 差分点数は%min%～%max%の範囲で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4602:admin.stock.move.differential_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4603:admin.stock.move.differential_csv_modal.format_product_code_desc: 差分対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4604:admin.stock.move.differential_csv_modal.format_product_name: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4605:admin.stock.move.differential_csv_modal.format_product_name_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4606:admin.stock.move.differential_csv_modal.format_actual_move_qty: 実移動点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4607:admin.stock.move.differential_csv_modal.format_actual_move_qty_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4608:admin.stock.move.differential_csv_modal.format_difference_qty: 差分点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4609:admin.stock.move.differential_csv_modal.format_difference_qty_desc: 差分点数を記入（整数。不足は正の数、追加は負の数。空欄は更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4664:admin.stock.list.search_required_for_csv: 検索条件を指定してからCSV出力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4697:admin.stock.list.recommend_csv: 在庫リコメンドCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4698:admin.stock.list.stock_info_csv: 在庫情報CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4699:admin.stock.list.custom_csv: 在庫情報カスタムCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4700:admin.stock.list.custom_csv_no_formats: フォーマットが登録されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4701:admin.stock.list.custom_csv_settings: 出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4793:admin.stock.barcode_replacement_list.csv_export: バーコード貼替リストCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4822:admin.stock.split_join.csv_preview_error: プレビューを表示できませんでした。ログイン状態を確認するか、しばらく経ってから再度お試しください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4826:admin.stock.split_join.split_csv_register: 在庫分割CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4827:admin.stock.split_join.join_csv_register: 在庫結合CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4828:admin.stock.split_join.list_csv_import_submit: CSVから登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4830:admin.stock.split_join.list_csv_join_import_done: '%count% 件の結合を登録し、欠品入力まで進めました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4831:admin.stock.split_join.list_csv_split_import_done: '%count% 件の分割を登録し、承認申請まで進めました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4898:admin.stock.split_join.csv_file_not_found: 'CSVファイルが見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4899:admin.stock.split_join.csv_header_invalid: 'CSVのヘッダー形式が不正です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4900:admin.stock.split_join.csv_parse_failed: 'CSVの解析に失敗しました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4901:admin.stock.split_join.csv_product_not_found: '%line%行目: 商品コード「%code%」が同一店舗・在庫区分で見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4902:admin.stock.split_join.csv_export: 在庫分割結合CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4903:admin.stock.split_csv_modal.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4904:admin.stock.split_csv_modal.store_placeholder: 選択してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4905:admin.stock.split_csv_modal.inventory_category: 在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4906:admin.stock.split_csv_modal.csv_file: CSVファイル選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4907:admin.stock.split_csv_modal.csv_file_limit: 1ファイルの登録上限は 2,000 件です
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4909:admin.stock.split_csv_modal.register: 登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4910:admin.stock.split_csv_modal.approval_notification_label: 承認通知先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4911:admin.stock.split_csv_modal.format_source_code: 分割元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4912:admin.stock.split_csv_modal.format_source_code_desc: 分割元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4913:admin.stock.split_csv_modal.format_split_quantity: 分割数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4914:admin.stock.split_csv_modal.format_split_quantity_desc: 分割数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4915:admin.stock.split_csv_modal.format_target_code: 分割先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4916:admin.stock.split_csv_modal.format_target_code_desc: 分割先商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4917:admin.stock.split_csv_modal.format_target_stock: 分割先在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4918:admin.stock.split_csv_modal.format_target_stock_desc: 分割先在庫数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4919:admin.stock.split_csv_modal.no_file_selected: 選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4920:admin.stock.split_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4921:admin.stock.join_csv_modal.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4922:admin.stock.join_csv_modal.store_placeholder: 選択してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4923:admin.stock.join_csv_modal.inventory_category: 在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4924:admin.stock.join_csv_modal.csv_file: CSVファイル選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4925:admin.stock.join_csv_modal.csv_file_limit: 1ファイルの登録上限は 2,000 件です
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4926:admin.stock.join_csv_modal.format_destination_code: 結合先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4927:admin.stock.join_csv_modal.format_destination_code_desc: 結合先となる商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4928:admin.stock.join_csv_modal.format_join_quantity: 結合元在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4929:admin.stock.join_csv_modal.format_join_quantity_desc: 結合する数量を整数で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4930:admin.stock.join_csv_modal.format_source_code: 結合元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4931:admin.stock.join_csv_modal.format_source_code_desc: 結合元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4932:admin.stock.join_csv_modal.format_source_stock_category: 結合元在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4933:admin.stock.join_csv_modal.format_source_stock_category_desc: "結合元の在庫区分を記入（1: EC-CUBE, 2: スマレジ）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4934:admin.stock.join_csv_modal.format_source_stock_quantity: 結合元在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4935:admin.stock.join_csv_modal.format_source_stock_quantity_desc: 結合元在庫数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4936:admin.stock.join_csv_modal.register: 登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4937:admin.stock.join_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4954:admin.stock.split.csv_register: 分割先商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4977:admin.stock.split.csv_column_invalid: 'CSVの列名が不正です。1行目に「商品コード」「分割先在庫数」が必要です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4978:admin.stock.split.csv_same_as_source: '%line%行目: 分割元と同じ商品コードは分割先に指定できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4984:admin.stock.split.new_destination_csv_modal.title: 分割先CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4985:admin.stock.split.new_destination_csv_modal.note: CSVファイルをアップロードして分割先商品を一括登録します。登録済みの分割先リストは上書きされます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4986:admin.stock.split.new_destination_csv_modal.product_register: 分割先商品を登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4987:admin.stock.split.new_destination_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4988:admin.stock.split.new_destination_csv_modal.format_product_code_desc: 分割先となる商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4989:admin.stock.split.new_destination_csv_modal.format_destination_qty: 分割先数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4990:admin.stock.split.new_destination_csv_modal.format_destination_qty_desc: 分割先の分割数量を整数で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4991:admin.stock.split.new_destination_csv_modal.csv_file: CSVファイル (上限あり)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4992:admin.stock.split.new_destination_csv_modal.no_file_selected: ファイルが選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4993:admin.stock.split.new_destination_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5025:admin.stock.join.new_source_csv_modal.title: 結合元商品CSV登録（既に登録済みの商品は削除して登録します。）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5026:admin.stock.join.new_source_csv_modal.note: 既に画面に登録済みの結合元はすべて削除し、CSVの内容で置き換えます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5027:admin.stock.join.new_source_csv_modal.product_register: 商品登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5028:admin.stock.join.new_source_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5029:admin.stock.join.new_source_csv_modal.format_product_code_desc: 結合元商品の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5030:admin.stock.join.new_source_csv_modal.format_join_qty: 結合元在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5031:admin.stock.join.new_source_csv_modal.format_join_qty_desc: 結合元在庫数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5032:admin.stock.join.new_source_csv_modal.csv_file: CSVファイル選択（1ファイルの登録上限は 10,000 件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5033:admin.stock.join.new_source_csv_modal.no_file_selected: 選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5034:admin.stock.join.new_source_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5052:admin.stock.join.shortage_csv_modal.title: 検品CSV登録（既に仮登録済みの欠品点数は削除して仮登録します。）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5053:admin.stock.join.shortage_csv_modal.button_label: 欠品仮登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5054:admin.stock.join.shortage_csv_modal.open_button: 検品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5055:admin.stock.join.shortage_csv_modal.csv_file: CSVファイル選択（1ファイルの登録上限は 10,000 件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5056:admin.stock.join.shortage_csv_modal.note: 欠品点数をCSVで一括登録します。登録済みの欠品点数は上書きされます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5057:admin.stock.join.shortage_csv_modal.format_product_code_desc: 商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5058:admin.stock.join.shortage_csv_modal.format_shortage_qty: 欠品点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5059:admin.stock.join.shortage_csv_modal.format_shortage_qty_desc: 欠品点数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5060:admin.stock.join.shortage_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5061:admin.stock.join.shortage_csv_modal.csv_file_required: CSVファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5067:admin.stock.join.csv_register: 結合元商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5120:admin.stock.join.csv_column_invalid: 'CSVの列名が不正です。1行目に「商品コード」「結合元在庫数」が必要です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5121:admin.stock.join.csv_same_as_destination: '%line%行目: 結合先と同一の在庫は結合元に指定できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5176:admin.csv.error.export.not_registered_stock_history_id: 存在しない在庫履歴IDが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5177:admin.csv.error.export.no_stock_history_data: 在庫履歴データが存在しないためエクスポートできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5180:admin.stock.change_csv.title: 在庫変更CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5181:admin.stock.change_csv.subtitle: 在庫管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5182:admin.stock.change_csv.list: 在庫変更CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5183:admin.stock.change_csv.file_upload_title: CSVファイルをアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5184:admin.stock.change_csv.base_info_name: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5185:admin.stock.change_csv.stock_location: 在庫場所
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5186:admin.stock.change_csv.change_type_detail: 在庫変動区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5187:admin.stock.change_csv.hange_type_detail_empty: 在庫変動区分を選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5188:admin.stock.change_csv.stock_change_reason: 在庫変動理由
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5189:admin.stock.change_csv.approval_department: 承認通知先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5190:admin.stock.change_csv.approval_department_empty: 所属を選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5191:admin.stock.change_csv.approval_members_empty: 選択してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5192:admin.stock.change_csv.file_format_title: CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5193:admin.stock.change_csv.history_title: 在庫変更CSV登録履歴（承認テーブルの情報を参照）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5194:admin.stock.change_csv.history_approval_status: 承認状態
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5195:admin.stock.change_csv.history_filename: ファイル名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5196:admin.stock.change_csv.history_store: 店舗/在庫場所
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5197:admin.stock.change_csv.history_class_count: 対象商品規格数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5198:admin.stock.change_csv.history_total_change_quantity: 合計在庫増減数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5199:admin.stock.change_csv.history_total_cost_change: 合計総原価増減数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5200:admin.stock.change_csv.history_type_detail: 在庫変動区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5201:admin.stock.change_csv.history_type_detail_stock: 入庫
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5202:admin.stock.change_csv.history_type_detail_disposal: 廃棄
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5203:admin.stock.change_csv.history_registration_date: 登録日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5204:admin.stock.change_csv.history_registration_member: 登録者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5205:admin.stock.change_csv.history_approval_date: 承認日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5206:admin.stock.change_csv.history_approval_member: 承認者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5207:admin.stock.change_csv.history_approval_upapproved: 未承認
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5208:admin.stock.change_csv.history_approval_approved: 承認済
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5209:admin.stock.change_csv.history_approval_waiting: 承認待ち
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5210:admin.stock.change_csv.shop_not_permitted: 編集権限のない店舗が選択されています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5235:admin.stock.move_instruction.csv_download_record: 在庫移動実績入力用CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5236:admin.stock.move_instruction.csv_download_invoice: 送り状CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5237:admin.stock.move_instruction.csv_invoice_select_rows: 送り状CSVを出力する在庫移動指示にチェックを入れてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5240:admin.stock.move_instruction.csv_registration: CSVファイル登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5241:admin.stock.move_instruction.csv_registration_button: 在庫移動実績CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5242:admin.stock.move_instruction.csv_registration_modal_lead: CSVファイルを選択し、登録ボタンをクリックしてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5243:admin.stock.move_instruction.csv_registration_modal_overwrite_note: （既に在庫移動実績を登録している場合、上書きされます）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5244:admin.stock.move_instruction.csv_registration_file_limit: （1ファイルの登録上限は10,000件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5245:admin.stock.move_instruction.csv_format_title: CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5246:admin.stock.move_instruction.csv_format_instruction_id: 移動指示ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5247:admin.stock.move_instruction.csv_format_instruction_id_desc: 移動指示リストのIDを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5248:admin.stock.move_instruction.csv_format_move_from_shop: 出庫元店舗(名称)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5249:admin.stock.move_instruction.csv_format_move_from_shop_desc: 出庫元店舗の名称を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5250:admin.stock.move_instruction.csv_format_move_to_shop: 入庫先店舗(名称)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5251:admin.stock.move_instruction.csv_format_move_to_shop_desc: 入庫先店舗の名称を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5252:admin.stock.move_instruction.csv_format_tracking_no: 送り状No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5253:admin.stock.move_instruction.csv_format_tracking_no_desc: 送り状No.を入力、複数ある場合はカンマ(,)で区切る(スペースなどは不要)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5271:admin.stock.move_instruction.csv_tracking_file_invalid: ファイルが不正です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5272:admin.stock.move_instruction.csv_tracking_header_invalid: CSVのヘッダーが不正です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5273:admin.stock.move_instruction.csv_tracking_no_valid_rows: 有効な行がありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5274:admin.stock.move_instruction.csv_tracking_success: 送り状No.を一括登録しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5275:admin.stock.move_instruction.csv_tracking_upload_error_detail: アップロードに失敗しました。詳細：%detail%
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5276:admin.stock.move_instruction.csv_tracking_error_instruction_not_found: 移動指示が見つかりません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5277:admin.stock.move_instruction.csv_tracking_error_shop_mismatch_from: 出庫元店舗が一致しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5278:admin.stock.move_instruction.csv_tracking_error_shop_mismatch_to: 入庫先店舗が一致しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5279:admin.stock.move_instruction.csv_tracking_error_tracking_no_empty: 送り状Noが空欄です
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5280:admin.stock.move_instruction.csv_tracking_error_register_failed: 登録処理中にエラーが発生しました（%detail%）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5281:admin.stock.move_instruction.csv_tracking_errors_capped: エラーは20件まで表示されます
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5319:admin.stock.approval_list.csv_download: CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5338:admin.stock.approval_list.approval_target_csv: 在庫変更CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5345:admin.stock.approval_list.confirm_modal_message_csv: 在庫変更CSV登録にて登録した在庫情報はCSVダウンロードして確認してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5353:admin.stock.approval_list.csv_export_no_session: 明細を表示するための選択情報がありません。確認モーダルを開き直してからCSVダウンロードしてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5369:admin.stock.approval_list.line_items.over_display_limit_csv_hint: 参照している在庫情報が表示上限（%max%件）を超えているため、全件を確認する場合はCSVダウンロードして確認してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5400:admin.stock.move_transfer.action_barcode_csv_export: バーコード印刷用CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5401:admin.stock.move_transfer.action_move_transfer_csv_export: 在庫移動振替CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5402:admin.stock.move_transfer.action_return_list_csv_export: 戻しリストCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5407:admin.stock.move_transfer.return_list_csv_export.no_selection: 1つ以上の在庫移動情報を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5408:admin.stock.move_transfer.barcode_csv_export.no_selection: 1つ以上の在庫移動・振替を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5409:admin.stock.move_transfer.barcode_csv_export.not_found: 対象のデータが見つかりません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5410:admin.stock.move_transfer.barcode_csv_export.not_move_type: 'ID: %moveTransferId% は移動ではないため出力できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5411:admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination: 'ID: %moveTransferId% は入庫先がスマレジ在庫ではないため出力できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5412:admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set: 'ID: %moveTransferId% は入庫先店舗が設定されていません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5413:admin.stock.move_transfer.barcode_csv_export.shop_not_permitted: 'ID: %moveTransferId% は権限のない店舗のデータです。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5414:admin.stock.move_transfer.barcode_csv_export.id_not_found: 'ID: %moveTransferId% は存在しません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5415:admin.stock.move_transfer.barcode_csv_export.multiple_shops: 複数店舗の在庫移動・振替情報を同時に処理することはできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5418:admin.stock.move_transfer.csv_file_registration: CSVファイル登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5419:admin.stock.move_transfer.csv_register_move: 在庫移動CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5420:admin.stock.move_transfer.csv_register_transfer: 在庫振替CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5421:admin.stock.move_transfer.csv_move_modal.file_row_limit_hint: （1ファイルの登録上限は 10,000 件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5422:admin.stock.move_transfer.csv_move_modal.move_from_stock_location: 出庫元在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5423:admin.stock.move_transfer.csv_move_modal.move_to_stock_location: 入庫先在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5424:admin.stock.move_transfer.csv_move_modal.col_product_code_hint: 商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5425:admin.stock.move_transfer.csv_move_modal.col_move_quantity_hint: 移動点数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5426:admin.stock.move_transfer.csv_transfer_modal.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5427:admin.stock.move_transfer.csv_transfer_modal.transfer_from_stock_location: 振替元在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5428:admin.stock.move_transfer.csv_transfer_modal.member: メンバー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5429:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code: 振替元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5430:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code: 振替先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5431:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity: 振替点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5432:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint: 振替元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5433:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint: 振替先商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5434:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity_hint: 振替点数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5524:admin.purchase.online.csv_export.no_selection: 1つ以上の買取注文情報を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5525:admin.purchase.online.csv_export.not_registered_buy_order_id: 存在しない買取注文情報IDが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5526:admin.purchase.online.csv_export.bad_csv_type: 不正なCSV種別です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5527:admin.purchase.online.btn.csvexport: 古物台帳入力用CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5528:admin.purchase.online.btn.csvexport_deposit: 入金CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5529:admin.purchase.online.btn.csvexport_product_list: 買取商品一覧CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5530:admin.purchase.online.detail.btn.csvexport: 古物台帳入力用CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5531:admin.purchase.online.detail.btn.csvexport_product_list: 買取商品一覧CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5535:admin.purchase.online.btn.csv_export_product_cancel: 買取商品（キャンセル）CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5536:admin.purchase.online.btn.csv_export_return_list: 戻しリストCSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5807:admin.order.order_csv.download: 受注CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5808:admin.order.shipping_csv.download: 出荷CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5809:admin.order.order_csv.setting: 受注CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5810:admin.order.shipping_csv.setting: 出荷CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5811:admin.order.custom_order_csv.download: カスタム受注CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5812:admin.order.custom_shipping_csv.download: カスタム配送CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5814:admin.order.order.custom_csv.setting: 出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5854:admin.event.entry.bulk_csv_upload_title: イベント一括登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5855:admin.event.entry.bulk_csv_header: イベント一括登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5856:admin.event.entry.bulk_csv_format_title: イベント一括登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5857:tooltip.event.entry.bulk_csv_upload: 所定の型のCSVファイルを選択し、一括登録を実行するとイベントを登録できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5858:tooltip.event.entry.bulk_csv_format: 雛形ファイルをダウンロードして編集すれば、所定の型のイベント一括登録用CSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5859:admin.event.entry.bulk_csv.error.shop_not_editable: '行%line%: 指定した店舗は登録できません（権限がありません）。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5860:admin.event.entry.bulk_csv.error.format_not_found: '行%line%: フォーマット名が正しくないか、マスタに存在しません（複数指定はカンマ区切り）。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5861:admin.event.entry.bulk_csv.error.schedule_without_start: '行%line%: 開始時間が空欄のとき、日程列のみ入力することはできません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5862:admin.event.entry.bulk_csv.error.reception_time_required: '行%line%: 受付が「あり」のときは受付時間From・Toを入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5863:admin.event.entry.bulk_csv.error.reception_time_order: '行%line%: 受付時間のFromはToより前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5864:admin.event.entry.bulk_csv.error.reception_end_after_event_start: '行%line%: 受付時間Toはイベント開始時間以前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5865:admin.event.entry.bulk_csv.error.online_reception_time_required: '行%line%: オンライン受付が「あり」のときはオンライン受付時間From・Toを入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5866:admin.event.entry.bulk_csv.error.online_reception_time_order: '行%line%: オンライン受付時間のFromはToより前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5867:admin.event.entry.bulk_csv.error.online_reception_end_not_before_event_start: '行%line%: オンライン受付終了はイベント開始時間より前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5868:admin.event.entry.bulk_csv.error.team_battle_invalid: '行%line%: チーム戦は0または1で指定してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6055:admin.event.entry.csv_download: CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6056:admin.event.entry.csv_column_settings: 出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6195:admin.analysis.used_card.csv_download: 特集タグ編集CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:46:    // まとめて買取で個別表示しない低価格帯のリスト
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:743:     * まとめて買取で低価格帯の商品数合計を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:749:            static fn (DtbBuyMainCard $v): bool => $v->isLowPriceBulkAgreementLine(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:753:            static fn (DtbBuyOrderIndivisualInputProduct $v): bool => $v->isLowPriceBulkAgreementLine(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:762:    public function getSaleLowPriceProductFlg(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:766:            if ($BuyMainCard->isLowPriceBulkAgreementLine()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:771:            if ($BuyOrderIndivisualInputProduct->isLowPriceBulkAgreementLine()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:780:     * まとめて買取で低価格帯の商品数を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:784:    public function getLowPriceProductCountList(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:810:    public function getTotalPriceLessThanMinLowPrice(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:836:    public function getTotalQuantityLessThanMinLowPrice(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:22:#[ORM\Table(name: 'dtb_csv_csv_extension')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:41:    #[ORM\JoinColumn(name: 'csv_extension_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:51:    public function setCsvExtension(DtbCsvExtension $csvExtension): DtbCsvCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:53:        $this->CsvExtension = $csvExtension;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:58:    #[ORM\JoinColumn(name: 'csv_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:68:    public function setCsv(Csv $csv): DtbCsvCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:70:        $this->Csv = $csv;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/format_sales.twig:138:                            {{ 'admin.common.csv_download'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:26:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:42:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:43:            $this->csvExportService->fputcsv($header);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:52:                $this->csvExportService->fputcsv($line);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:55:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:58:        $filename = 'sales_report_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:3:{% set menus = ['product', 'product_csv_management', 'product_tag_sales_analysis_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:5:{% block sub_title %}{{ 'admin.product.tag_sales_analysis_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:96:        $csvSellPrice = (int) bcfloor((string) $this->sellPriceColumn->getValue($row));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:98:        $csvSaleFlg = (bool) (int) $this->saleFlgColumn->getValue($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:101:        $csvBeltUrl = $this->beltUrlColumn->getValue($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:102:        $beltUrl = StringUtil::isNotBlank($csvBeltUrl) ? (string) $csvBeltUrl : null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:122:        if (!$currentSaleFlg && $csvSaleFlg) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:123:            $newSellPrice = $csvSellPrice;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:125:        } elseif ($currentSaleFlg && $csvSaleFlg) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:126:            $newSellPrice = $csvSellPrice;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:128:        } elseif ($currentSaleFlg && !$csvSaleFlg) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:131:            if ($csvSellPrice) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:132:                $messageStore->addInfo('admin.product.sale_high_price_csv.alert_off_sale_buy_only', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:137:            $messageStore->addInfo('admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:147:        // 今回のcsv登録では買取価格・基準価格の更新はないので一緒の値を入れる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyMainCard.php:171:    public function isLowPriceBulkAgreementLine(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:122:        $this->addMessage('admin.csv.error.format.header');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:136:        $this->addMessage('admin.csv.error.format.body', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:148:        $this->addMessage('admin.csv.error.data.empty');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:163:        $this->addMessage('admin.csv.error.product.not_exists', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:178:        $this->addMessage('admin.csv.error.data.require', $columnName, $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:193:        $this->addMessage('admin.csv.error.product.invalid', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:223:        $this->addMessage('admin.csv.error.product.max_length', $rowNumber, $columnName, $maxLength);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:239:        $this->addMessage('admin.csv.error.data.string_max_length', $rowNumber, $columnName, $maxLength);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:254:        $this->addMessage('admin.csv.error.product.over_zero', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:270:        $this->addMessage('admin.csv.error.data.not_registered', $columnName, $value, $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:285:        $this->addMessage('admin.csv.error.product.not_exists', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:300:        $this->addMessage('admin.csv.error.product.product_code_duplicated', $rowNumber, $value);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:315:        $this->addMessage('admin.csv.error.product.filename', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:330:            'admin.csv.error.product.new_product_cannot_be_deleted',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:347:            'admin.csv.error.product.non_unique_card_detail_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:365:            'admin.csv.error.product.product_with_card_detail_exists',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:383:            'admin.csv.error.product.product_update_lock_timeout',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:401:            'admin.csv.error.product.new_product_be_duplicate',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:420:            'admin.csv.error.product.new_product_smaregi_product_code_duplicate',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:439:        $this->addMessage('admin.csv.error.data.out_of_stock', $rowNumber, $columnName, $value);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:454:        $this->addMessage('admin.csv.error.product.invalid', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:469:        $this->addMessage('admin.csv.error.storage_code.not_exists', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:484:        $this->addMessage('admin.csv.error.product.abolished_status_with_stock', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:499:        $this->addMessage('admin.csv.error.product.smaregi_alignment_flg_off_with_stock', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:513:        $this->addMessage('admin.csv.error.shelf_number.name_duplicate', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:94:            foreach ($this->shortageByProductCode as $productCode => $csvRow) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:96:                $shortages[(string) $moveDetail->getId()] = $csvRow['shortageQuantity'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:188:                'admin.stock.move.shortage_csv_import.shortage_qty_invalid',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:208:                'admin.stock.move.shortage_csv_import.product_code_duplicated',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:230:                'admin.stock.move.shortage_csv_import.product_code_not_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:253:                'admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:26:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:90:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:92:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:100:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:103:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:107:        $filename = 'otc_buy_order_summary_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:221:            $this->eccubeConfig['eccube_csv_import_delimiter'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:222:            $this->eccubeConfig['eccube_csv_import_enclosure']
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:39:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:54:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:57:                $this->csvExportService->fputcsv(self::CSV_HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:60:                    $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:63:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:68:            'stock_move_inbound_approval_request_%d_%s.csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:56:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:82:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:83:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:90:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:93:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:96:        $filename = 'stock_list_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:318:        $csvSellPriceSet = StringUtil::isNotBlank($this->sellPriceColumn->getValue($row));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:326:            $csvSaleFlg = $saleFlg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:328:            $newSaleFlg = $csvSaleFlg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:329:            if ($currentSaleFlg && !$csvSaleFlg) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:333:                if ($csvSellPriceSet && !$alertSellPriceNotReflected) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:334:                    $messageStore->addMessage('admin.product.price_csv.sell_price_not_reflected', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:337:            } elseif (!$currentSaleFlg && !$csvSaleFlg) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:341:                    $messageStore->addMessage('admin.product.price_csv.normal_product_sell_price_unchanged', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderIndivisualInputProduct.php:118:    public function isLowPriceBulkAgreementLine(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:54:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:74:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:77:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:101:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:105:        $filename = 'stock_move_transfer_list_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:136:            $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:25:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:83:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:85:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:93:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:96:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:100:        $filename = 'otc_buy_order_history_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:120:                $this->translator->trans('admin.csv.error.data.not_registered'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:135:                $this->translator->trans('admin.csv.error.data.not_registered'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:148:                $this->translator->trans('admin.csv.error.data.not_registered'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:161:                $this->translator->trans('admin.deck.csv.error.format_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:173:                $this->translator->trans('admin.deck.csv.error.format_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:184:                $this->translator->trans('admin.deck.csv.error.format_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:197:                    $this->translator->trans('admin.csv.error.data.require'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:198:                    $this->translator->trans('admin.deck.csv.commander'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:207:                    $this->translator->trans('admin.csv.error.data.not_registered'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:208:                    $this->translator->trans('admin.deck.csv.commander'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:223:                    $this->translator->trans('admin.deck.csv.error.deck_not_found'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:233:                    $this->translator->trans('admin.deck.csv.error.deck_type_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:480:                    $this->translator->trans('admin.deck.csv.error.format_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:24: * ネット買取 棚戻しリストCSV（店頭の otc_buy_order_restock_list_csv と同一列構成）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:29:     * 店頭買取 OtcBuyOrderCsvExportService::CSV_TYPES['otc_buy_order_restock_list_csv'] と揃える
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:45:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:62:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:63:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:74:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:77:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:82:        $filename = $prefix.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductTag.php:34:         * use csv export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig:260:                                <a class="btn btn-ec-regular" href="{{ path('admin_analysis_sales_export') }}">{{ 'admin.common.csv_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:64:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:82:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:88:            $this->csvExportService->fputcsv($headerRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:98:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:101:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:104:        $filename = 'stock_approval_line_items_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:251:                $this->flashSuccesses[] = trans('admin.stock.split_join.list_csv_split_import_done', ['%count%' => (string) $successCount]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:51:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:67:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:70:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:88:                    $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:91:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:96:        $filename = $prefix.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:36:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:42:    public function export(DtbCsvExtension $csvExtension, StockListSearchInput $input): StreamedResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:46:        $csvExtension->setCsvs($this->dtbCsvCsvExtensionRepository->findCsvOrderbyRank((int) $csvExtension->getId()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:50:        $response->setCallback(function () use ($csvExtension, $qb): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:51:            $this->csvExportService->setCsvsAndCsvType($csvExtension);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:52:            $this->csvExportService->exportHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:53:            $this->csvExportService->setExportQueryBuilder($qb);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:54:            $this->csvExportService->exportData(function ($entity, CsvExportService $csvService): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:55:                $this->exportRow($entity, $csvService);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:59:        $filename = 'stock_custom_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:68:    private function exportRow(ProductStock $productStock, CsvExportService $csvExportService): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:76:        foreach ($csvExportService->getCsvs() as $csv) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:77:            $entityName = str_replace('\\\\', '\\', $csv->getEntityName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:80:                    $exportRow->setData($csvExportService->getData($csv, $productStock));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:83:                    $exportRow->setData($csvExportService->getData($csv, $pc));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:86:                    $exportRow->setData($csvExportService->getData($csv, $product));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:89:                    $exportRow->setData($cardDetail !== null ? $csvExportService->getData($csv, $cardDetail) : null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:92:                    $exportRow->setData($card !== null ? $csvExportService->getData($csv, $card) : null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:103:                    $field = $csv->getFieldName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:109:                    $exportRow->setData($stockUpQuantity !== null ? $csvExportService->getData($csv, $stockUpQuantity) : null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:117:        $csvExportService->fputcsv($exportRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:53:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:77:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:78:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:85:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:88:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:91:        $filename = 'stock_approval_list_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/product_request.twig:121:                                <a href="{{ path('admin_analysis_product_request_export') }}" class="btn btn-primary">{{ 'admin.common.csv_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:25:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:117:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:120:            $this->csvExportService->fputcsv($header);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:127:                $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:130:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:133:        $filename = $exportType.'_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:29:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:46:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:49:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:60:                    $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:63:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:68:        $filename = $prefix.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:96:                $this->translator->trans('admin.stock.move_transfer.barcode_csv_export.not_found', [], 'messages'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:117:                    'admin.stock.move_transfer.barcode_csv_export.not_move_type',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:125:                    'admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:133:                    'admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:139:                    'admin.stock.move_transfer.barcode_csv_export.shop_not_permitted',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:153:                    'admin.stock.move_transfer.barcode_csv_export.id_not_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:162:                'admin.stock.move_transfer.barcode_csv_export.multiple_shops',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:23:#[ORM\Table(name: 'mtb_csv_import_type')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:59:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:71:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:74:                $this->csvExportService->fputcsv(self::HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:79:                    $this->csvExportService->fputcsv($this->buildRow($Instruction));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:82:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:87:        $filename = 'stock_move_instruction_labels_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:34:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:42:        $filename = 'event_entry_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:49:                $this->csvExportService->initCsvType(CsvType::CSV_TYPE_EVENT_APPLICATION);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:50:                $this->csvExportService->setExportQueryBuilder($qb);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:55:                    $this->csvExportService->exportHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:57:                    $this->csvExportService->exportData(function ($entity, $csvService): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:62:                            foreach ($csvService->getCsvs() as $Csv) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:65:                            $csvService->fputcsv($headerRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:71:                            $csvService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:59:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:69:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:70:            $this->csvExportService->fputcsv(self::CSV_HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:73:                $this->csvExportService->fputcsv([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:91:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:94:        $filename = 'stock_recommend_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/csv_card.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/csv_card.twig:5:{% block import_file_accept %}.csv, text/csv{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/csv_card.twig:7:{% block title %}{{ 'admin.card.card_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:38:"41","1",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:39:"42","2",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:40:"43","3",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:41:"44","1",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:42:"45","2",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:43:"46","3",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:44:"47","1",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:45:"48","2",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:46:"49","3",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:47:"50","1",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:48:"51","2",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:49:"52","3",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:167:            <a class="btn  btn-ec-conversion" href="{{ url('admin_card_csv_upload') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:168:                {{ 'admin.common.csv_import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:349:                                            data-action="{{ url('admin_card_export_csv') }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:78:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:107:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:108:            $this->csvExportService->fputcsv($exportHeader);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:110:                $this->csvExportService->fputcsv([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:125:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:128:        $filename = sprintf('summary_%s_%s.csv', $summaryType, (new \DateTime())->format('YmdHis'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:227:                    'admin.csv.error.product.product_class_count_invalid_for_update',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:43:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:59:        $filename = 'barcode_replacement_list_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:70:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:73:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:86:                    $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:91:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:26:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:63:        'otc_buy_order_restock_list_csv' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:97:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:100:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:111:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:114:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:118:            if ($exportType === 'otc_buy_order_restock_list_csv') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:123:        $filename = $exportType.'_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:151:            'otc_buy_order_restock_list_csv' => $this->restockListCsvRowFormatter->iterateFormattedRows(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:23:    #[ORM\Table(name: 'mtb_csv_type')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/summary.twig:200:                        <a href="{{ path('admin_summary_export') }}" id="result_list_main__csv_menu" class="btn btn-ec-conversion">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:1:"id","csv_type_id","creator_id","entity_name","field_name","reference_field_name","disp_name","sort_no","enabled","create_date","update_date"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:3:{% set menus = ['product', 'section_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:5:{% block title %}{{ 'admin.product.department_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:43:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:44:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:47:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:60:                        <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.section.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:62:                    <div id="ex-csv_category-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:64:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:66:                                <form id="upload-form" method="post" action="{{ url('admin_product_department_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:70:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:71:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:88:                                <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.section.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:91:                                <a href="{{ url('admin_product_csv_template', {'type': 'department'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:95:                    <div id="ex-csv_section-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/used_card.twig:63:            <button class="btn btn-ec-conversion px-5" type="submit">{{ 'admin.analysis.used_card.csv_download'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:24:        .btn-csv {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:57:                                <a href="{{ path('admin_product_storage_code') }}" class="btn btn-primary btn-csv ml-2">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:61:                            <a href="{{ path('admin_product_storage_code_export') }}" class="btn btn-primary btn-csv mr-1">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:62:                                {{ 'admin.product.csv.export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:64:                            <a href="{{ path('admin_product_storage_code_csv') }}" class="btn btn-primary btn-csv">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:65:                                {{ 'admin.product.csv.import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:111:    public const ADMIN_CUSTOMER_CSV_EXPORT = 'admin.customer.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:172:    public const ADMIN_ORDER_CSV_EXPORT_ORDER = 'admin.order.csv.export.order';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:175:    public const ADMIN_ORDER_CSV_EXPORT_SHIPPING = 'admin.order.csv.export.shipping';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:195:    public const ADMIN_PRODUCT_CATEGORY_CSV_EXPORT = 'admin.product.category.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:218:    public const ADMIN_PRODUCT_CLASS_CATEGORY_CSV_EXPORT = 'admin.product.class.category.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:231:    public const ADMIN_PRODUCT_CLASS_NAME_CSV_EXPORT = 'admin.product.class.name.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:236:    // csvProduct
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:238:    // csvCategory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:240:    // csvTemplate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:280:    public const ADMIN_PRODUCT_CSV_EXPORT = 'admin.product.csv.export';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:296:    public const ADMIN_STOCK_SPLIT_JOIN_LIST_SPLIT_CSV_IMPORT_COMPLETE = 'admin.stock.split_join.list.split.csv.import.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:297:    public const ADMIN_STOCK_SPLIT_JOIN_LIST_JOIN_CSV_IMPORT_COMPLETE = 'admin.stock.split_join.list.join.csv.import.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:303:    public const ADMIN_SETTING_SHOP_CSV_INDEX_INITIALIZE = 'admin.setting.shop.csv.index.initialize';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:304:    public const ADMIN_SETTING_SHOP_CSV_INDEX_COMPLETE = 'admin.setting.shop.csv.index.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:13:{% set menus = ['product', 'product_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:15:{% block title %}{{ 'admin.product.product_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:27:                    $('.modal-body p', modal).text("{{ 'admin.common.csv_upload_in_progress'|trans }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:57:                            url: '{{ url('admin_product_csv_split') }}',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:85:                            url: '{{ url('admin_product_csv_split_import') }}',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:88:                                file_name: file_name + current + '.csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:90:                                force_file_to_db: $('#admin_csv_import_force_file_to_db').prop('checked')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:127:                                    files.push(file_name + i + '.csv')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:130:                                    $.post('{{ url('admin_product_csv_split_cleanup') }}', { files: files })
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:149:                        $('.modal-body p', modal).text("{{ 'admin.common.csv_upload_error'|trans }}")
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:164:                        $('.modal-body p', modal).text("{{ 'admin.common.csv_upload_complete'|trans }}")
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:198:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:199:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:202:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:217:                        <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.product.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:219:                    <div id="ex-csv_product-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:221:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:223:                                <form id="upload-form" method="post" action="{{ url('admin_product_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:227:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:228:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:252:                                <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.product.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:255:                                <a href="{{ url('admin_product_csv_template', {'type': 'product'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:259:                    <div id="ex-csv_product-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:287:                    <h5 class="modal-title fw-bold">{{ 'admin.product.product_csv_upload__title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:292:                    <p class="text-start">{{ 'admin.product.product_csv_upload__message'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:13:{% set menus = ['product', 'class_category_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:15:{% block title %}{{ 'admin.product.class_category_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:53:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:54:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:57:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:70:                        <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.class_category.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:72:                    <div id="ex-csv_category-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:74:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:76:                                <form id="upload-form" method="post" action="{{ url('admin_product_class_category_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:80:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:81:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:98:                                <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.class_category.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:101:                                <a href="{{ url('admin_product_csv_template', {'type': 'class_category'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:105:                    <div id="ex-csv_class_name-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1136:                                            <button type="button" class="btn btn-ec-regular dropdown-menu-toggle" id="csvDownloadDropDown">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1138:                                                <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1142:                                                    {{ 'admin.order.order_csv.download'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1145:                                                    {{ 'admin.order.shipping_csv.download'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1147:                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_ORDER') }) }}" id="orderCsvSetting">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1148:                                                    {{ 'admin.order.order_csv.setting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1150:                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_SHIPPING') }) }}" id="shippingCsvSetting">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1151:                                                    {{ 'admin.order.shipping_csv.setting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1159:                                                <span>{{ 'admin.order.custom_order_csv.download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1163:                                                    <a class="dropdown-item" href="{{ url('admin_custom_export', {'csvExtensionId': CsvEx.id}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1167:                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv_custom', {'csvTypeId': constant('Eccube\\Entity\\Master\\CsvType::CSV_TYPE_ORDER') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1168:                                                    {{ 'admin.order.order.custom_csv.setting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1176:                                                <span>{{ 'admin.order.custom_shipping_csv.download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1180:                                                    <a class="dropdown-item" href="{{ url('admin_custom_export', {'csvExtensionId': CsvEx.id}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1184:                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv_custom', {'csvTypeId': constant('Eccube\\Entity\\Master\\CsvType::CSV_TYPE_SHIPPING') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1185:                                                    {{ 'admin.order.order.custom_csv.setting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:15:#result_list__custom_csv_menu .dropdown-menu.show,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:162:                        <form name="bulk_csv_export" id="bulk_csv_export" method="post">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:166:                                    <div id="result_list__custom_csv_menu" class="d-inline-block dropdown">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:171:                                            <li><button type="submit" id="csvexport" class="dropdown-item" formaction="{{ url('admin_purchase_csv_export') }}">{{ 'admin.purchase.online.btn.csvexport'|trans }}</button></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:172:                                            <li><button type="submit" id="csvexport_deposit" class="dropdown-item" formaction="{{ url('admin_purchase_csv_export_deposit') }}">{{ 'admin.purchase.online.btn.csvexport_deposit'|trans }}</button></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:173:                                            <li><button type="submit" id="csvexport_product_list" class="dropdown-item text-left" formaction="{{ path('admin_purchase_csv_export_product_list', { type: 'sale' }) }}">{{ 'admin.purchase.online.btn.csvexport_product_list'|trans }}</button></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:174:                                            <li><button type="submit" id="csv_export_product_cancel" class="dropdown-item text-left" formaction="{{ path('admin_purchase_csv_export_product_list', { type: 'notSale' }) }}">{{ 'admin.purchase.online.btn.csv_export_product_cancel'|trans }}</button></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:175:                                            <li><button type="submit" id="csv_export_return_list" class="dropdown-item text-left" formaction="{{ path('admin_purchase_csv_export_return_list') }}">{{ 'admin.purchase.online.btn.csv_export_return_list'|trans }}</button></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:1:- mtb_authority.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:2:- mtb_country.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:3:- mtb_csv_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:4:- mtb_customer_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:5:- mtb_customer_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:6:- mtb_device_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:7:- mtb_product_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:8:- mtb_job.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:9:- mtb_login_history_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:10:- mtb_order_item_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:11:- mtb_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:12:- mtb_order_status_color.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:13:- mtb_page_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:14:- mtb_pref.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:15:- mtb_product_list_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:16:- mtb_product_list_order_by.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:17:- mtb_sale_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:18:- mtb_sex.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:19:- mtb_shipping_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:20:- mtb_tax_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:21:- mtb_tax_display_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:22:- mtb_work.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:23:- dtb_tenant.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:24:- dtb_member.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:25:- dtb_tax_rule.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:26:- dtb_block.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:27:- dtb_page.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:28:- dtb_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:29:- dtb_page_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:30:- dtb_block_position.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:31:- dtb_authority_role.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:32:- dtb_base_info.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:33:- dtb_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:34:- dtb_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:35:- dtb_class_name.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:36:- dtb_class_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:37:- dtb_csv.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:38:- dtb_customer.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:39:- dtb_customer_address.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:40:- dtb_customer_favorite_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:41:- dtb_delivery.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:42:- dtb_delivery_duration.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:43:- dtb_delivery_fee.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:44:- dtb_delivery_time.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:45:- dtb_mail_history.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:46:- dtb_mail_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:47:- dtb_news.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:48:- dtb_order.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:49:- dtb_payment.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:50:- dtb_payment_option.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:51:- dtb_plugin.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:52:- dtb_plugin_event_handler.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:53:- dtb_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:54:- dtb_product_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:55:- dtb_product_class.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:56:- dtb_product_image.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:57:- dtb_product_stock.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:58:- dtb_product_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:59:- dtb_order_item.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:60:- dtb_shipping.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:61:- dtb_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:62:- dtb_tradelaw.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_goods.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_goods.twig:3:{% set menus = ['product', 'product_csv_management', 'product_goods_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_goods.twig:5:{% block sub_title %}{{ 'admin.product.product_goods_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:15:#result_list__custom_csv_menu .dropdown-menu.show {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:208:                                    <div id="result_list__custom_csv_menu" class="d-inline-block dropdown">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:24:        .btn-csv {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:40:                                <a href="{{ path('admin_product_section') }}" class="btn btn-primary btn-csv ml-2">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:44:                            <a href="{{ path('admin_product_section_export') }}" class="btn btn-primary btn-csv mr-1">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:45:                                {{ 'admin.product.csv.export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:47:                            <a href="{{ path('admin_product_section_master_csv_upload') }}" class="btn btn-primary btn-csv">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:48:                                {{ 'admin.product.csv.import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1562:admin.common.csv_upload_complete: CSV file uploaded
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1563:admin.common.csv_upload_error: Failed to upload CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1681:admin.common.csv_download: Download CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1682:admin.common.csv_upload: Upload a CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1683:admin.common.csv_skeleton_download: Download a template
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1684:admin.common.csv_format: CSV file format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1685:admin.common.csv_select: Select a CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1688:admin.common.csv_invalid_format: Unmatched CSV format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1689:admin.common.csv_invalid_no_data: No CSV data found
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1690:admin.common.csv_invalid_required: "%name% is empty in the %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1691:admin.common.csv_invalid_greater_than_zero: "%name% should be more than 0 in the line %line%."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1692:admin.common.csv_invalid_format_line_name: "Unmatched format in %name% in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1693:admin.common.csv_invalid_format_line: "Unmatched CSV format in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1694:admin.common.csv_invalid_date_format: "Unmatched date format in %name% in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1695:admin.common.csv_invalid_not_found: "%name% is empty in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1696:admin.common.csv_invalid_not_found_target: '"%target_name%" is empty in %name% in the line %line%'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1697:admin.common.csv_invalid_not_same: "You are not allowed to enter the same value in %name1% and %name2% in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1698:admin.common.csv_invalid_can_not: "%name% is invalid in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1699:admin.common.csv_invalid_image: 'Your are not allowed to use "/" or "../" as suffix in %name% in the %line%'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1700:admin.common.csv_invalid_foreign_key: "You are unable to delete %name% in the line %line% because it has related data"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1701:admin.common.csv_invalid_description_detail_upper_limit: "%name% should be less than %max% characters in the line %line%."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1702:admin.common.csv_upload_in_progress: "Uploading CSV file ..."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1703:admin.common.csv_upload_line_success: "The %from% to %to% lines have been registered."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1704:admin.common.csv_upload_line_error: "An error has occurred. The registration process after the %from% line has been cancelled."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1816:admin.product.product_csv_management: Product CSV Management
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1817:admin.product.product_csv_upload: Product CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1818:admin.product.product_goods_csv_upload: Goods Product CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1819:admin.product.class_name_csv_upload: Class Name CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1820:admin.product.class_category_csv_upload: Class Category CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1821:admin.product.category_csv_upload: Category CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1930:admin.product.product_csv.product_id_col: Product ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1931:admin.product.product_csv.product_id_description: For new product registration, please leave it empty. To update the registered product information, please specify the product ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1932:admin.product.product_csv.display_status_col: Display Status (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1933:admin.product.product_csv.display_status_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1934:admin.product.product_csv.product_name_col: Product Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1935:admin.product.product_csv.product_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1936:admin.product.product_csv.shop_memo_col: Store Notes
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1937:admin.product.product_csv.shop_memo_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1938:admin.product.product_csv.description_list_col: Product Descriptions (All)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1939:admin.product.product_csv.description_list_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1940:admin.product.product_csv.description_detail_col: Product Descriptions (Details)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1941:admin.product.product_csv.description_detail_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1942:admin.product.product_csv.keyword_col: Search Keywords
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1943:admin.product.product_csv.keyword_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1944:admin.product.product_csv.free_area_col: Miscellaneous
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1945:admin.product.product_csv.free_area_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1946:admin.product.product_csv.delete_flag_col: Product Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1947:admin.product.product_csv.delete_flag_description: "Specify 0: Register 1: Delete. If unspecified, it will be set to 0."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1948:admin.product.product_csv.product_image_col: Product Images
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1949:admin.product.product_csv.product_image_description: Specify the name of the image file. For multiple images, please double-quote each file name.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1950:admin.product.product_csv.category_col: Product Category (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1951:admin.product.product_csv.category_description: Specify the category ID. For multiple categories, please double-quote each category ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1952:admin.product.product_csv.tag_col: Tag (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1953:admin.product.product_csv.tag_description: Specify the tag ID. For multiple tags, please double-quote each tag ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1954:admin.product.product_csv.sale_type_col: Sales Type (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1955:admin.product.product_csv.sale_type_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1956:admin.product.product_csv.class_category1_col: Option Group 1(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1957:admin.product.product_csv.class_category1_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1958:admin.product.product_csv.class_category2_col: Option Group 2(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1959:admin.product.product_csv.class_category2_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1960:admin.product.product_csv.delivery_duration_col: Estimated Shipping Date (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1961:admin.product.product_csv.delivery_duration_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1962:admin.product.product_csv.product_code_col: SKU
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1963:admin.product.product_csv.product_code_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1964:admin.product.product_csv.stock_col: Stock Qty
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1965:admin.product.product_csv.stock_description: If the unlimited stock flag is set to 0, please set the value more than 0.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1966:admin.product.product_csv.stock_unlimited_col: Unlimited Stock Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1967:admin.product.product_csv.stock_unlimited_description: "Specify 0: Limited or 1: Unlimited"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1968:admin.product.product_csv.sale_limit_col: Max Sales Qty
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1969:admin.product.product_csv.sale_limit_description: Set the value more than 1
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1970:admin.product.product_csv.normal_price_col: Regular Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1971:admin.product.product_csv.normal_price_description: Set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1972:admin.product.product_csv.sale_price_col: Selling Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1973:admin.product.product_csv.sale_price_description: Set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1974:admin.product.product_csv.delivery_fee_col: Shipping Charge
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1975:admin.product.product_csv.delivery_fee_description: If the shipping charge is set per product, set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1976:admin.product.product_csv.tax_rate_col: Tax Rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1977:admin.product.product_csv.tax_rate_description: If the Tax Rate is set per product, set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1978:admin.product.product_csv.product_class_visible_flag_col: Product options visible flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1979:admin.product.product_csv.product_class_visible_flag_description: 0:Invisible 1:Visible. If unspecified, it will not be updated.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1982:admin.product.category_csv.category_id_col: Category ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1983:admin.product.category_csv.category_id_description: For a new category registration, please leave it empty. To update the registered category, please specify the category ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1984:admin.product.category_csv.category_name_col: Category Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1985:admin.product.category_csv.category_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1986:admin.product.category_csv.parent_category_id_col: Parent Category ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1987:admin.product.category_csv.parent_category_id_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1988:admin.product.category_csv.delete_flag_col: Category Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1989:admin.product.category_csv.delete_flag_description: "Specify 0: Upload or 1: Delete. If unspecified, it is set to 0."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1992:admin.product.class_name_csv.class_name_id_col: Class Name ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1993:admin.product.class_name_csv.class_name_id_description: For a new class name registration, please leave it empty. To update the registered class name, please specify the class name ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1994:admin.product.class_name_csv.class_name_col: Class Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1995:admin.product.class_name_csv.class_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1996:admin.product.class_name_csv.class_backend_name_col: Backend Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1997:admin.product.class_name_csv.class_backend_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1998:admin.product.class_name_csv.delete_flag_col: Class Name Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1999:admin.product.class_name_csv.delete_flag_description: 'Specify 0: Upload or 1: Delete. If unspecified, it is set to 0.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2002:admin.product.class_category_csv.class_name_id_col: Class Name ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2003:admin.product.class_category_csv.class_name_id_description: Specify an existing Class Name ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2004:admin.product.class_category_csv.class_category_id_col: Class Category ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2005:admin.product.class_category_csv.class_category_id_description: For a new class category registration, please leave it empty. To update the registered class category, please specify the class category ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2006:admin.product.class_category_csv.class_category_name_col: Class Category Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2007:admin.product.class_category_csv.class_category_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2008:admin.product.class_category_csv.class_category_backend_name_col: Class Category Backend Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2009:admin.product.class_category_csv.class_category_backend_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2010:admin.product.class_category_csv.delete_flag_col: Class Category Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2011:admin.product.class_category_csv.delete_flag_description: 'Specify 0: Upload or 1: Delete. If unspecified, it is set to 0.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2014:admin.product.product_csv_upload__title: "Upload product CSV"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2015:admin.product.product_csv_upload__message: "Upload the product CSV file. Is it OK?"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2055:admin.stock.list.recommend_csv: Recommend CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2056:admin.stock.list.stock_info_csv: Stock Info CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2057:admin.stock.list.custom_csv: Custom CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2058:admin.stock.list.custom_csv_no_formats: No formats registered
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2059:admin.stock.list.custom_csv_settings: Output Settings
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2128:admin.stock.move.shortage_csv_invalid_status: The current status does not allow shortage CSV import.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2129:admin.stock.move.shortage_csv_modal.note: Register shortage quantities via CSV. Only rows with a shortage quantity are updated; blank rows and rows omitted from the CSV are left unchanged. Entering 0 clears the shortage quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2130:admin.stock.move.shortage_csv_modal.csv_file: CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2131:admin.stock.move.shortage_csv_modal.csv_file_limit: Size limit applies
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2132:admin.stock.move.shortage_csv_modal.csv_file_required: Please select a CSV file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2133:admin.stock.move.shortage_csv_import.file_not_found: 'The file could not be read.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2134:admin.stock.move.shortage_csv_import.shortage_qty_invalid: 'Line %line%: Shortage quantity must be an integer of 0 or greater.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2135:admin.stock.move.shortage_csv_import.product_code_duplicated: 'Line %line%: Product code "%code%" is duplicated in the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2136:admin.stock.move.shortage_csv_import.product_code_not_found: 'Line %line%: Product code "%code%" was not found in this stock move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2137:admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move: 'Line %line%: Shortage quantity (%shortage%) exceeds move quantity (%max%).'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2138:admin.stock.move.shortage_csv_modal.format_product_code: Product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2139:admin.stock.move.shortage_csv_modal.format_product_code_desc: Product code with a shortage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2140:admin.stock.move.shortage_csv_modal.format_product_name: Product name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2141:admin.stock.move.shortage_csv_modal.format_product_name_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2142:admin.stock.move.shortage_csv_modal.format_move_qty: Move quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2143:admin.stock.move.shortage_csv_modal.format_move_qty_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2144:admin.stock.move.shortage_csv_modal.format_shortage_qty: Shortage quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2145:admin.stock.move.shortage_csv_modal.format_shortage_qty_desc: Shortage quantity (integer 0 or greater; blank is not updated)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2146:admin.stock.move.differential_csv_invalid_status: The current status does not allow differential CSV import.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2147:admin.stock.move.differential_csv_modal.note: Register difference quantities via CSV. Only rows with a difference quantity are updated; blank rows and rows omitted from the CSV are left unchanged. Entering 0 clears the difference quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2148:admin.stock.move.differential_csv_modal.csv_file: CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2149:admin.stock.move.differential_csv_modal.csv_file_limit: Size limit applies
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2150:admin.stock.move.differential_csv_modal.csv_file_required: Please select a CSV file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2151:admin.stock.move.differential_csv_import.difference_qty_invalid: 'Line %line%: Difference quantity must be an integer.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2152:admin.stock.move.differential_csv_import.product_code_duplicated: 'Line %line%: Product code "%code%" is duplicated in the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2153:admin.stock.move.differential_csv_import.product_code_not_found: 'Line %line%: Product code "%code%" was not found in this stock move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2154:admin.stock.move.differential_csv_import.difference_qty_exceeds_actual_move: 'Line %line%: Difference quantity (%difference%) exceeds actual move quantity (%max%).'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2155:admin.stock.move.differential_csv_import.difference_qty_out_of_range: 'Line %line%: Difference quantity must be between %min% and %max%.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2156:admin.stock.move.differential_csv_modal.format_product_code: Product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2157:admin.stock.move.differential_csv_modal.format_product_code_desc: Product code with a difference
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2158:admin.stock.move.differential_csv_modal.format_product_name: Product name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2159:admin.stock.move.differential_csv_modal.format_product_name_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2160:admin.stock.move.differential_csv_modal.format_actual_move_qty: Actual move quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2161:admin.stock.move.differential_csv_modal.format_actual_move_qty_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2162:admin.stock.move.differential_csv_modal.format_difference_qty: Difference quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2163:admin.stock.move.differential_csv_modal.format_difference_qty_desc: Difference quantity (integer; positive for shortage, negative for surplus; blank is not updated)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2184:admin.stock.move_transfer.csv_file_registration: CSV file registration
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2185:admin.stock.move_transfer.csv_register_move: Register stock move CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2186:admin.stock.move_transfer.csv_register_transfer: Register stock transfer CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2187:admin.stock.move_transfer.csv_move_modal.file_row_limit_hint: (Up to 10,000 rows per file.)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2188:admin.stock.move_transfer.csv_move_modal.move_from_stock_location: Source stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2189:admin.stock.move_transfer.csv_move_modal.move_to_stock_location: Destination stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2190:admin.stock.move_transfer.csv_move_modal.col_product_code_hint: Enter the product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2191:admin.stock.move_transfer.csv_move_modal.col_move_quantity_hint: Enter the movement quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2192:admin.stock.move_transfer.csv_transfer_modal.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2193:admin.stock.move_transfer.csv_transfer_modal.transfer_from_stock_location: Transfer source stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2194:admin.stock.move_transfer.csv_transfer_modal.member: Member
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2195:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code: Transfer source product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2196:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code: Transfer destination product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2197:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity: Transfer quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2198:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint: Enter the transfer source product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2199:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint: Enter the transfer destination product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2200:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity_hint: Enter the transfer quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2201:admin.stock.move_transfer.barcode_csv_export.no_selection: Please select one or more stock move/transfer records.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2202:admin.stock.move_transfer.barcode_csv_export.not_found: No matching data found.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2203:admin.stock.move_transfer.barcode_csv_export.not_move_type: 'ID: %moveTransferId% cannot be exported because it is not a move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2204:admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination: 'ID: %moveTransferId% cannot be exported because the destination is not Smaregi stock.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2205:admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set: 'ID: %moveTransferId% has no destination store configured.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2206:admin.stock.move_transfer.barcode_csv_export.shop_not_permitted: 'ID: %moveTransferId% belongs to a store you are not authorized to access.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2207:admin.stock.move_transfer.barcode_csv_export.id_not_found: 'ID: %moveTransferId% does not exist.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2208:admin.stock.move_transfer.barcode_csv_export.multiple_shops: Stock move/transfer records from multiple stores cannot be processed at the same time.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2219:admin.order.shipping_csv_upload: Upload Shipping CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2324:admin.order.csv_shipping_date_description: Set Shipping Date in YYYY-MM-DD format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2325:admin.order.order_csv: Order CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2326:admin.order.shipping_csv: Shipping CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2367:admin.order.shipping_csv.shipping_id_col: Shipping ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2368:admin.order.shipping_csv.shipping_id_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2369:admin.order.shipping_csv.tracking_number_col: Tracking No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2370:admin.order.shipping_csv.tracking_number_description: Enter alphanumeric characters or hyphens
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2371:admin.order.shipping_csv.shipping_date_col: Shipping Date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2372:admin.order.shipping_csv.shipping_date_description: Enter the shipping date in the format of MM/DD/YYYY
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2585:admin.setting.shop.csv_setting: CSV Outputs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2706:admin.setting.shop.csv.csv_columns: CSV Output Items
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2707:admin.setting.shop.csv.csv_type: CSV Type
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2708:admin.setting.shop.csv.non_output_colmuns: NOT to Output
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2709:admin.setting.shop.csv.output_colmuns: To Output
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2710:admin.setting.shop.csv.operation: Output Menus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2711:admin.setting.shop.csv.operation__output: Add
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2712:admin.setting.shop.csv.operation__release: Delete
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2713:admin.setting.shop.csv.operation__all_output: Add All
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2714:admin.setting.shop.csv.operation__all_release: Delete All
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2715:admin.setting.shop.csv.order: Item Orders
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2716:admin.setting.shop.csv.order__up: Move Up
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2717:admin.setting.shop.csv.order__down: Move Down
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2718:admin.setting.shop.csv.order__top: Move to Top
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2719:admin.setting.shop.csv.order__bottom: Move to Bottom
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2720:admin.setting.shop.csv.how_to_use: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3132:tooltip.product.csv_upload: Bulk product registration is available with a CSV template.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3133:tooltip.product.csv_format: You can create a CSV data easily with templates available for downloads.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3134:tooltip.category.csv_upload: Bulk category registration is available with a CSV template.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3135:tooltip.category.csv_format: You can create a CSV data easily with templates available for downloads.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3153:tooltip.shipping.csv_upload: You can bulk-register shipping information with a CSV template.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3154:tooltip.shipping.csv_format: You can easily create CSV data in specified format with downloadable templates.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3201:tooltip.setting.shop.csv.csv_columns: You can output various data in CSV format. You can specify the items for CSV output.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3202:tooltip.setting.shop.csv.csv_type: Specify the CSV file type.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3228:tooltip.class_name.csv_upload: Standards can be registered in a batch using the specified type of CSV data.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3229:tooltip.class_name.csv_format: You can easily create CSV data of the specified type by downloading and editing the template file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3398:admin.stock.split_join.csv_preview_error: The preview could not be loaded. Please confirm you are still logged in and try again.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3402:admin.stock.split_join.split_csv_register: Register Stock Split CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3403:admin.stock.split_join.join_csv_register: Register Stock Join CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3404:admin.stock.split_join.list_csv_import_submit: Import from CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3405:admin.stock.split_join.list_csv_join_import_done: 'Registered %count% join(s) and advanced to shortage entry.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3406:admin.stock.split_join.list_csv_split_import_done: 'Registered %count% split(s) and submitted for approval.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3459:admin.stock.split_join.csv_file_not_found: 'CSV file not found.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3460:admin.stock.split_join.csv_header_invalid: 'Invalid CSV header format.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3461:admin.stock.split_join.csv_parse_failed: 'Failed to parse the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3462:admin.stock.split_join.csv_product_not_found: 'Row %line%: Product code "%code%" not found in the same store and stock location.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3463:admin.stock.split_csv_modal.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3464:admin.stock.split_csv_modal.store_placeholder: Please select a store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3465:admin.stock.split_csv_modal.inventory_category: Inventory Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3466:admin.stock.split_csv_modal.csv_file: CSV File
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3467:admin.stock.split_csv_modal.csv_file_limit: limit applies
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3468:admin.stock.split_csv_modal.no_file_selected: No file selected
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3469:admin.stock.split_csv_modal.register: Register
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3470:admin.stock.split_csv_modal.template_download: Download Template
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3471:admin.stock.split_csv_modal.approval_notification_label: Approval Notification Recipients
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3472:admin.stock.split_csv_modal.format_source_code: Source Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3473:admin.stock.split_csv_modal.format_source_code_desc: Enter the product code of the split source.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3474:admin.stock.split_csv_modal.format_split_quantity: Split Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3475:admin.stock.split_csv_modal.format_split_quantity_desc: Enter the split quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3476:admin.stock.split_csv_modal.format_target_code: Destination Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3477:admin.stock.split_csv_modal.format_target_code_desc: Enter the product code of the split destination.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3478:admin.stock.split_csv_modal.format_target_stock: Destination Stock
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3479:admin.stock.split_csv_modal.format_target_stock_desc: Enter the destination stock quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3480:admin.stock.join_csv_modal.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3481:admin.stock.join_csv_modal.inventory_category: Inventory Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3482:admin.stock.join_csv_modal.csv_file: CSV File
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3483:admin.stock.join_csv_modal.format_destination_code: Destination Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3484:admin.stock.join_csv_modal.format_destination_code_desc: Enter the product code of the join destination.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3485:admin.stock.join_csv_modal.format_join_quantity: Source Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3486:admin.stock.join_csv_modal.format_join_quantity_desc: Enter the join quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3487:admin.stock.join_csv_modal.format_source_code: Source Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3488:admin.stock.join_csv_modal.format_source_code_desc: Enter the product code of the join source.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3489:admin.stock.join_csv_modal.format_source_stock_category: Source Stock Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3490:admin.stock.join_csv_modal.format_source_stock_category_desc: Enter the stock category of the join source.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3491:admin.stock.join_csv_modal.format_source_stock_quantity: Source Stock Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3492:admin.stock.join_csv_modal.format_source_stock_quantity_desc: Enter the source stock quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3493:admin.stock.join_csv_modal.reflect_only_note: "※ This operation only reflects the CSV contents on screen. Please register separately."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3494:admin.stock.join_csv_modal.reflect_only_note_list: "※ The CSV contents will be imported and saved as awaiting approval."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3495:admin.stock.join_csv_modal.template_download: Download Template
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3500:admin.stock.split.csv_column_invalid: 'Invalid CSV columns. Row 1 must contain "Product Code" and "Destination Stock".'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3501:admin.stock.split.csv_same_as_source: 'Row %line%: The source product code cannot be used as a split destination.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3504:admin.stock.split.new_destination_csv_modal.title: Register Destination CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3505:admin.stock.split.new_destination_csv_modal.note: Upload a CSV file to register split destination products in bulk. The existing destination list will be replaced.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3506:admin.stock.split.new_destination_csv_modal.product_register: Register Destination Products
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3507:admin.stock.split.new_destination_csv_modal.format_product_code: Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3508:admin.stock.split.new_destination_csv_modal.format_product_code_desc: Enter the product code of the split destination.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3509:admin.stock.split.new_destination_csv_modal.format_destination_qty: Destination Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3510:admin.stock.split.new_destination_csv_modal.format_destination_qty_desc: Enter the destination quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3548:admin.stock.join.csv_column_invalid: 'Invalid CSV columns. Row 1 must contain "Product Code" and "Source Stock".'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3549:admin.stock.join.csv_same_as_destination: 'Row %line%: The same stock as the destination cannot be specified as a source.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3555:admin.stock.join.shortage_csv_modal.csv_file_required: Please select a CSV file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3605:admin.deck.csv_import: CSV Import
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3606:admin.deck.csv_export: CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3607:admin.deck.csv_export_no_selection: No deck selected for CSV export.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3670:admin.deck.csv_upload_title: Deck Registration CSV Upload
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3671:admin.deck.csv_upload_header: Deck Registration CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3672:admin.deck.csv_format_title: Deck Registration CSV File Format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3673:admin.deck.csv.commander: Commander
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3674:admin.deck.csv.error.format_invalid: "The format of %s is invalid. Please check the data on row %d."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3675:admin.deck.csv.error.deck_not_found: "Deck ID %s does not exist. Please check the data on row %d."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3676:admin.deck.csv.error.deck_type_invalid: "Deck ID %s is not an event type deck. Please check the data on row %d."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3699:admin.archetype.csv_import: CSV Import
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3700:admin.archetype.csv_upload_title: Archetype CSV Upload
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3701:admin.archetype.csv_upload_header: Archetype CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3702:admin.archetype.csv_format_title: Archetype CSV File Format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/tag_sales_analysis.twig:24:        .btn-csv {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:49:                $errors->addMessage('admin.csv.error.category.update_requires_sort', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:55:                $errors->addMessage('admin.csv.error.category.not_found', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:60:            $errors->addMessage('admin.csv.error.category.new_must_not_have_sort', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:66:            $errors->addMessage('admin.csv.error.category.id_equals_parent', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:75:                $errors->addMessage('admin.csv.error.category.parent_not_found', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:83:                        $errors->addMessage('admin.csv.error.category.parent_is_descendant', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:94:            $errors->addMessage('admin.csv.error.category.nest_level_exceeded', $row->getRowNumber(), $maxLevel);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:58:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:77:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:78:            $this->csvExportService->fputcsv($header);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:80:                $this->csvExportService->fputcsv($this->buildCsvRow($Deck));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:82:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:85:        $filename = $exportType.'_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:11:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:13:{% set menus = ['product', 'product_csv_management', 'product_card_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:15:{% block title %}{{ 'admin.product.product_card_csv_upload_title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:81:    #edit_purchase_info_box__header_buttons .purchase-csv-btn {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:313:                                <button type="submit" id="export_csv" class="btn btn-ec-conversion" formaction="{{ path('admin_purchase_csv_export') }}">{{ 'admin.purchase.online.detail.btn.csvexport'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:314:                                <button type="submit" id="csvexport_product_list" class="btn btn-ec-conversion" formaction="{{ path('admin_purchase_csv_export_product_list', { type: 'sale' }) }}">{{ 'admin.purchase.online.detail.btn.csvexport_product_list'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:55:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:73:            throw new \RuntimeException('admin.purchase.online.csv_export.not_registered_buy_order_id');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:87:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:88:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:95:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:98:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:102:        $filename = $prefix.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:118:            $('#page_count_pulldown, #display_pulldown, #csv_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:468:                                <button class="btn btn-ec-conversion px-5" type="submit" formaction="{{ url('admin_product_card_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:469:                                    <span>{{ 'admin.product.card_csv_export'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:471:                                <button class="btn btn-ec-conversion px-5" type="submit" formaction="{{ url('admin_product_goods_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:472:                                    <span>{{ 'admin.product.goods_csv_export'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:474:                                <button class="btn btn-ec-conversion px-5" type="submit" formaction="{{ url('admin_product_price_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:475:                                    <span>{{ 'admin.product.sale_price_csv_export'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:512:                                        <select id="csv_pulldown" class="form-select" >
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:513:                                            <option value="">{{ 'admin.product.custom_csv_export'|trans }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:515:                                                <option value="{{ url('admin_product_all_csv_custom_export', { csvExtensionId: CsvEx.id }) }}">{{ CsvEx.name }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:517:                                            <option value="{{ url('admin_setting_shop_csv_custom', { csvTypeId: constant('Eccube\\Entity\\Master\\CsvType::CSV_TYPE_PRODUCT') }) }}">{{ 'admin.setting.shop.custom_csv_setting'|trans }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig:3:{% set menus = ['product', 'product_csv_management', 'sale_high_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig:5:{% block sub_title %}{{ 'admin.product.sale_high_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:184:            $this->eccubeConfig['eccube_csv_import_delimiter'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:185:            $this->eccubeConfig['eccube_csv_import_enclosure']
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:259:                array_unshift($errors, trans('admin.stock.csv.error_limit_notice'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:45:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:70:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:71:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:78:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:81:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:84:        $filename = 'stock_split_join_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:13:{% set menus = ['order', 'shipping_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:15:{% block title %}{{ 'admin.order.shipping_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:51:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:52:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:55:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:70:                        <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.shipping.csv_upload'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:71:                            <span>{{'admin.common.csv_upload'|trans}}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:78:                                <span>{{ 'admin.common.csv_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:82:                                <form id="upload-form" method="post" action="{{ url('admin_shipping_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:86:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:87:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:105:                                <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.shipping.csv_format'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:106:                                    <span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:112:                                <a id="download-button" class="btn btn-ec-regular" href="{{ url('admin_shipping_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:876:front.mypage.purchase_history.detail.bulk.low_price_notice: "※ まとめて買取では、%min%円未満のカードの個別のキャンセルは承っておりません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:877:front.mypage.purchase_history.detail.bulk.agree_low_price_all: "%min%円未満のカードをすべて売却する"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1556:admin.common.csv_upload_complete: CSVファイルをアップロードしました
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1557:admin.common.csv_upload_error: CSVファイルのアップロードに失敗しました
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1573:# csvバリデーションエラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1574:admin.csv.error.upload.require: ファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1575:admin.csv.error.upload.maxsize: "CSVファイルは %maxSize% MB以下でアップロードしてください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1576:admin.csv.error.upload.maxrecord: "%maxRecord% 行を超えるCSVファイルは登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1577:admin.csv.error.data.already_executing: "既に %csvName% インポートが実行中です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1578:admin.csv.error.data.lock_failed: "DBのロックに失敗しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1693:admin.common.csv_download: CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1694:admin.common.csv_upload: CSVファイルをアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1695:admin.common.csv_skeleton_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1696:admin.common.csv_format: CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1697:admin.common.csv_item_name: 項目名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1698:admin.common.csv_description: 説明
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1699:admin.common.csv_select: CSVファイルを選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1706:admin.common.csv_checkbox_force_missing_file_pass_to_db: "ファイルの有無に関わらず、ファイルパスをデータベースに追加する。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1708:admin.common.csv_invalid_format: CSVのフォーマットが一致しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1709:admin.common.csv_invalid_no_data: CSVデータが存在しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1710:admin.common.csv_invalid_required: "%line%行目の%name%が設定されていません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1711:admin.common.csv_invalid_greater_than_zero: "%line%行目の%name%は0以上の数値を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1712:admin.common.csv_invalid_format_line: "%line%行目のCSVフォーマットが一致しません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1713:admin.common.csv_invalid_format_line_name: "%line%行目の%name%のフォーマットが異なります"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1714:admin.common.csv_invalid_date_format: "%line%行目の%name%の日付フォーマットが異なります"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1715:admin.common.csv_invalid_not_found: "%line%行目の%name%が存在しません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1716:admin.common.csv_invalid_not_found_target: "%line%行目の%name%「%target_name%」が存在しません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1717:admin.common.csv_invalid_not_same: "%line%行目の%name1%と%name2%には同じ値を使用できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1718:admin.common.csv_invalid_can_not: "%line%行目の%name%は設定できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1719:admin.common.csv_invalid_image: '%line%行目の%name%には末尾に"/"や"../"を使用できません'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1720:admin.common.csv_invalid_foreign_key: "%line%行目の%name%は関連するデータがあるため削除できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1721:admin.common.csv_invalid_description_detail_upper_limit: "%line%行目の%name%は%max%文字以下の文字列を指定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1722:admin.common.csv_invalid_image_file: "%line%行目の%name%は画像ファイルが見つかりませんでした。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1723:admin.common.csv_invalid_image_file_size: "%line%行目の%name%は画像ファイルサイズが大きすぎます。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1724:admin.common.csv_invalid_image_file_not_image: "%line%行目の%name%は画像ファイルではありません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1725:admin.common.csv_disallow_url_paths: "%line%行目の%name%には見つからないURLパスを設定できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1726:admin.common.csv_cannot_allow_disabled_url: "%line%行目の%name%には見つからないURLパスを設定できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1727:admin.common.csv_cannot_find_file_but_forcefully_saved_pass: "%line%行目の%name%が見つかりませんでしたが、強制的にファイルパスをデータベースに追加しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1728:admin.common.csv_upload_in_progress: "CSVファイルのアップロード中..."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1729:admin.common.csv_upload_line_success: "%from%行目〜%to%行目を登録しました"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1730:admin.common.csv_upload_line_error: "エラーが発生しました。%from%行目以降の登録処理はキャンセルされました"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1731:admin.common.csv_back_to_list: 一覧に戻る
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1732:admin.common.csv_import_error: CSVインポートエラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1733:admin.common.csv_file_select: CSVファイル選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1734:admin.common.csv_import: CSV取り込み
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1735:admin.common.csv_id_optional: (新規登録時は入力不要)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1736:admin.common.csv_export_guide: '<a href="%url%" class="text-muted text-decoration-underline">登録済みのデータをCSV出力</a>して、フォーマットを確認・編集してからアップロードすることをお勧めします。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1881:admin.product.product_csv_management: 商品CSV管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1882:admin.product.product_csv_upload: 商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1883:admin.product.product_card_csv_upload: カード商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1884:admin.product.product_card_csv_upload_title: カード商品登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1885:admin.product.product_card_csv_format_title: カード商品登録CSVフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1886:admin.product.product_goods_csv_upload: グッズ商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1887:admin.product.class_name_csv_upload: 規格CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1888:admin.product.class_category_csv_upload: 規格分類CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1889:admin.product.category_csv_upload: カテゴリCSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1890:admin.product.category_bulk_csv: カテゴリ登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1891:admin.product.category_bulk_csv_upload_title: カテゴリ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1892:admin.product.category_bulk_csv_format_title: カテゴリ登録CSVフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1927:admin.storagecode.duplicate_csv_rank_error: "CSV内で並び順が重複しています。 %row% 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1933:admin.product.storage_code_csv_upload_title: 略称タグ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1934:admin.product.storage_code_csv_format_title: 略称タグ登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1935:admin.product.csv_import_history_title: CSVインポート履歴
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1936:admin.product.csv_import_history_filename: ファイル名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1937:admin.product.csv_import_history_upload_date: アップロード日時
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1938:admin.product.csv_import_history_operator: 作業者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1941:admin.product.product_tag_csv: 商品タグ更新CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1942:admin.product.product_tag_csv_upload_title: 商品タグ更新CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1943:admin.product.product_tag_csv_format_title: 商品タグ更新CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1946:admin.product.product_price_csv: セール用価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1947:admin.product.product_price_csv_upload_title: セール用価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1948:admin.product.product_price_csv_format_title: セール用価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1951:admin.product.simple_high_price_csv: 高額商品価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1952:admin.product.simple_high_price_csv_upload_title: 高額商品価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1953:admin.product.simple_high_price_csv_format_title: 高額商品価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1954:admin.product.simple_high_price_csv.sale_alert: セール中商品の販売価格は変更できません。基準価格のみ更新されます。セール外の商品は基準価格・販売価格の両方を更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1955:admin.product.simple_high_price_csv.sell_price_not_updated: "%d行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1956:admin.product.simple_high_price_csv.no_matching_product_class: "%d行目: 対象の商品規格がありません。（商品公開ステータスが0かつ高額商品コードが設定された規格のみ対象です）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1959:admin.product.sale_high_price_csv: セール用高額商品価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1960:admin.product.sale_high_price_csv_upload_title: セール用高額商品価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1961:admin.product.sale_high_price_csv_format_title: セール用高額商品価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1962:admin.product.sale_high_price_csv.alert_off_sale_buy_only: "%d行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1963:admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard: "%d行目: 通常商品のため、買取価格はCSVの値で更新しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1966:admin.product.product_section_csv: 部門登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1967:admin.product.product_section_csv_upload_title: 部門登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1968:admin.product.product_section_csv_format_title: 部門登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1969:admin.product.product_status_csv: 商品公開CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1970:admin.product.product_status_csv_upload_title: 商品公開CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1971:admin.product.product_status_csv_format_title: 商品公開CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1974:admin.product.product_standard_price_csv: 基準価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1975:admin.product.product_standard_price_csv_upload_title: 基準価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1976:admin.product.product_standard_price_csv_format_title: 基準価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1977:admin.product.standard_price_csv.product_class_not_found: "%d行目: 商品ID %s・言語ID %s に該当する商品規格がありません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1978:admin.product.standard_price_csv.sale_product_sell_price_unchanged: "%d行目: セール中商品のため、販売価格は変更されません。（基準価格・買取価格は更新しました）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1981:admin.product.product_shelf_number_csv: 棚番号登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1982:admin.product.product_shelf_number_csv_upload_title: 棚番号登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1983:admin.product.product_shelf_number_csv_format_title: 棚番号登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1986:admin.product.tag_sales_analysis_csv: 売上分析タグ更新CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1987:admin.product.tag_sales_analysis_csv_upload_title: 売上分析タグ更新CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1988:admin.product.tag_sales_analysis_csv_format_title: 売上分析タグ更新CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2076:admin.product.price_csv.sell_price_not_reflected: "%d行目: セールフラグを無効にしたため、CSVに設定された販売価格は反映されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2077:admin.product.price_csv.normal_product_sell_price_unchanged: "%d行目: 通常商品のため、販売価格は変更されませんでした。買取価格のみ更新しています。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2192:admin.product.card_csv_export: カード商品CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2193:admin.product.goods_csv_export: グッズ商品CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2194:admin.product.sale_price_csv_export: セール用価格変更CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2196:admin.product.custom_csv_export: カスタムデータCSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2245:admin.product.product_csv.product_id_col: 商品ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2246:admin.product.product_csv.product_id_description: 新規登録の場合は空にしてください。既存の商品を更新する場合は、商品IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2247:admin.product.product_csv.display_status_col: 公開ステータス(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2248:admin.product.product_csv.display_status_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2249:admin.product.product_csv.product_name_col: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2250:admin.product.product_csv.product_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2251:admin.product.product_csv.shop_memo_col: ショップ用メモ欄
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2252:admin.product.product_csv.shop_memo_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2253:admin.product.product_csv.description_list_col: 商品説明(一覧)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2254:admin.product.product_csv.description_list_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2255:admin.product.product_csv.description_detail_col: 商品説明(詳細)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2256:admin.product.product_csv.description_detail_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2257:admin.product.product_csv.keyword_col: 検索ワード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2258:admin.product.product_csv.keyword_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2259:admin.product.product_csv.free_area_col: フリーエリア
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2260:admin.product.product_csv.free_area_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2261:admin.product.product_csv.delete_flag_col: 商品削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2262:admin.product.product_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2263:admin.product.product_csv.product_image_col: 商品画像
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2264:admin.product.product_csv.product_image_description: '画像のファイル名を指定します。複数画像の場合、画像ファイル名をカンマ区切りで「"」で囲んでください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2265:admin.product.product_csv.category_col: 商品カテゴリ(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2266:admin.product.product_csv.category_description: 'カテゴリIDを指定します。複数カテゴリの場合、商品カテゴリIDをカンマ区切りで「"」で囲んでください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2267:admin.product.product_csv.tag_col: タグ(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2268:admin.product.product_csv.tag_description: 'タグIDを指定します。複数タグの場合、タグIDをカンマ区切りで「"」で囲んでください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2269:admin.product.product_csv.sale_type_col: 販売種別(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2270:admin.product.product_csv.sale_type_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2271:admin.product.product_csv.class_category1_col: 規格分類1(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2272:admin.product.product_csv.class_category1_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2273:admin.product.product_csv.class_category2_col: 規格分類2(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2274:admin.product.product_csv.class_category2_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2275:admin.product.product_csv.delivery_duration_col: 発送日目安(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2276:admin.product.product_csv.delivery_duration_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2277:admin.product.product_csv.product_code_col: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2278:admin.product.product_csv.product_code_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2279:admin.product.product_csv.stock_col: 在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2280:admin.product.product_csv.stock_description: 在庫数無制限フラグが0の場合、0以上の数値を設定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2281:admin.product.product_csv.stock_unlimited_col: 在庫数無制限フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2282:admin.product.product_csv.stock_unlimited_description: "0:制限 1: 無制限を指定します。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2283:admin.product.product_csv.sale_limit_col: 販売制限数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2284:admin.product.product_csv.sale_limit_description: 1以上の数値を設定します。未指定の場合、販売制限数なしとして扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2285:admin.product.product_csv.normal_price_col: 通常価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2286:admin.product.product_csv.normal_price_description: 0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2287:admin.product.product_csv.sale_price_col: 販売価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2288:admin.product.product_csv.sale_price_description: 0以上の数値を設定します。未指定の場合、非表示として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2289:admin.product.product_csv.delivery_fee_col: 送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2290:admin.product.product_csv.delivery_fee_description: 商品ごとの送料設定が有効の場合、0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2291:admin.product.product_csv.tax_rate_col: 税率
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2292:admin.product.product_csv.tax_rate_description: 商品別税率機能設定が有効の場合、0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2293:admin.product.product_csv.product_class_visible_flag_col: 商品規格表示フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2294:admin.product.product_csv.product_class_visible_flag_description: 0:非表示 1:表示を指定します。未指定の場合は更新しません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2295:admin.product.csv.import: CSV入力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2296:admin.product.csv.export: CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2299:admin.product.category_csv.category_id_col: カテゴリID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2300:admin.product.category_csv.category_id_description: 新規登録の場合は空にしてください。既存のカテゴリを更新する場合は、カテゴリIDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2301:admin.product.category_csv.category_name_col: カテゴリ名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2302:admin.product.category_csv.category_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2303:admin.product.category_csv.parent_category_id_col: 親カテゴリID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2304:admin.product.category_csv.parent_category_id_description: 登録済みのカテゴリIDを数字で指定してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2305:admin.product.category_csv.delete_flag_col: カテゴリ削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2306:admin.product.category_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2309:admin.product.class_name_csv.class_name_id_col: 規格ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2310:admin.product.class_name_csv.class_name_id_description: 新規登録の場合は空にしてください。既存の規格を更新する場合は、規格IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2311:admin.product.class_name_csv.class_name_col: 規格名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2312:admin.product.class_name_csv.class_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2313:admin.product.class_name_csv.class_backend_name_col: 管理名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2314:admin.product.class_name_csv.class_backend_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2315:admin.product.class_name_csv.delete_flag_col: 規格削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2316:admin.product.class_name_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2319:admin.product.class_category_csv.class_name_id_col: 規格ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2320:admin.product.class_category_csv.class_name_id_description: 既存の規格IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2321:admin.product.class_category_csv.class_category_id_col: 規格分類ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2322:admin.product.class_category_csv.class_category_id_description: 新規登録の場合は空にしてください。既存の規格分類を更新する場合は、規格分類IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2323:admin.product.class_category_csv.class_category_name_col: 規格分類名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2324:admin.product.class_category_csv.class_category_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2325:admin.product.class_category_csv.class_category_backend_name_col: 規格分類管理名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2326:admin.product.class_category_csv.class_category_backend_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2327:admin.product.class_category_csv.delete_flag_col: 規格分類削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2328:admin.product.class_category_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2331:admin.product.product_csv_upload__title: "商品CSVをアップロードします"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2332:admin.product.product_csv_upload__message: "商品CSVファイルをアップロードします。よろしいですか？"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2335:admin.product.stock_change_csv.stock_product_code_col: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2336:admin.product.stock_change_csv.stock_product_code_description: 在庫変更対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2337:admin.product.stock_change_csv.stock_change_quantity_col: 在庫増減数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2338:admin.product.stock_change_csv.stock_change_quantity_description: 在庫変更対象の商品の在庫増減数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2339:admin.product.stock_change_csv.stock_purchase_price_col: 仕入単価
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2340:admin.product.stock_change_csv.stock_purchase_price_description: 在庫変動区分の親区分が入庫の場合必須入力 在庫変更対象の商品の仕入単価を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2343:admin.product.department_csv.type_name: 部門CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2344:admin.product.department_csv.section_id_col: 部門ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2345:admin.product.department_csv.section_id_description: 新規登録の場合は空にしてください。既存の部門を更新する場合は、部門IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2346:admin.product.department_csv.section_name_col: 部門名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2347:admin.product.department_csv.section_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2348:admin.product.department_csv.section_code_col: 部門コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2349:admin.product.department_csv.section_code_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2350:admin.product.department_csv.section_tax_free_division_col: 免税区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2351:admin.product.department_csv.section_tax_free_division_description: 0:対象外 1:一般品 2:消耗品のいずれかを指定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2352:admin.product.department_csv.section_visible_col: MTGBuyer表示フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2353:admin.product.department_csv.section_visible_description: 0:非表示 1:表示を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2356:admin.csv.error.format.header: "CSVのフォーマットが一致しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2357:admin.csv.error.format.body: "CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2358:admin.csv.error.data.empty: "CSVデータが存在しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2359:admin.stock.csv.error_limit_notice: "エラーを最大20件まで表示しています。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2360:admin.csv.error.data.require: "%s は必須項目です。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2361:admin.csv.error.data.not_registered: "%s : %s がマスターから取得できません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2362:admin.csv.error.data.out_of_stock: "%d 行目の%s : %s の在庫個数が足りません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2363:admin.csv.error.data.string_max_length: "%d 行目の %s は %d 文字以内で入力してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2364:admin.csv.error.product.invalid: "%d 行目の %s の値が異常です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2365:admin.csv.error.product.not_exists: "%d 行目の %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2366:admin.csv.error.product.required: "%d 行目の %s が設定されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2367:admin.csv.error.product.over_zero: "%d 行目の %s は0以上の数値を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2368:admin.csv.error.product.max_length: "%d 行目の %s は %d桁以内の数値 を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2369:admin.csv.error.product.filename: '%d 行目の %s には末尾に "/" や "../" を使用できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2370:admin.csv.error.product.price_valid: "%d 行目の販売価格は買取価格より大きい価格を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2371:admin.csv.error.product.new_product_cannot_be_deleted: "%d 行目の新規登録商品には 商品削除フラグ 「削除する」を指定できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2372:admin.csv.error.product.product_code_duplicated: "%d 行目の商品コードの値 %s は重複して登録されてるため更新できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2373:admin.csv.error.product.non_unique_card_detail_found: "%d 行目で該当するカード情報が複数見つかったため更新できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2374:admin.csv.error.product.product_with_card_detail_exists: "%d 行目のカード %s は商品マスターに登録済みです。登録をスキップします。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2375:admin.csv.error.product.product_update_lock_timeout: "%d 行目の商品が他の処理により更新中です。少し時間を空けてから再度更新してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2376:admin.csv.error.product.new_product_be_duplicate: "%d 行目の新規登録商品の商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2377:admin.csv.error.product.new_product_smaregi_product_code_duplicate: "%d 行目の新規登録商品のスマレジ商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2378:admin.csv.error.product.abolished_status_with_stock: "%d 行目の %s を「廃止」に変更する場合、在庫が0である必要があります。EC-CUBE内在庫またはスマレジ内在庫に在庫が存在するため、変更できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2379:admin.csv.error.product.smaregi_alignment_flg_off_with_stock: "%d 行目の %s を「無効」に変更する場合、スマレジ内在庫が0である必要があります。スマレジ内在庫に在庫が存在するため、変更できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2380:admin.csv.error.product.product_class_count_invalid_for_update: "%d 行目の %s=%d に該当する商品規格が %d 件です。更新時は 1 件である必要があります。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2381:admin.csv.error.storage_code.not_exists: "%d 行目の %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2382:admin.csv.error.inventory_plan_detail.product_code_not_exists: "%d 行目の商品コード %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2383:admin.csv.error.inventory_plan_detail.product_stock_not_found: "%d 行目の商品コード %s は、棚卸計画で指定された店舗・在庫区分の在庫が存在しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2384:admin.csv.error.inventory_plan_detail.plan_base_info_or_stock_location_required: 棚卸計画に店舗または在庫区分が設定されていないため、CSV登録できません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2385:admin.csv.error.inventory_plan_detail.product_code_duplicated: "%d 行目の商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2386:admin.csv.error.inventory_plan_detail.product_code_non_unique: "%d 行目の商品コード %s が複数の商品規格に設定されているため特定できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2387:admin.csv.error.inventory_plan_detail.product_code_not_registered: "%d 行目の商品コード %s は棚卸計画に登録されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2388:admin.csv.error.inventory_plan_detail.actual_stock_invalid: "%d 行目: 棚卸数量は0以上の整数で入力してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2389:admin.csv.error.shelf_number.name_duplicate: "名称がすでに登録されています。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2391:admin.csv.error.category.update_requires_sort: "%d 行目: カテゴリIDが指定されている更新行では、表示ランクを入力してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2392:admin.csv.error.category.not_found: "%d 行目: 指定したカテゴリIDのカテゴリが見つかりません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2393:admin.csv.error.category.new_must_not_have_sort: "%d 行目: 新規登録の行では表示ランクを入力しないでください（取込時に自動設定されます）。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2394:admin.csv.error.category.id_equals_parent: "%d 行目: カテゴリIDと親カテゴリIDに同じ値を指定することはできません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2395:admin.csv.error.category.parent_is_descendant: "%d 行目: 親カテゴリに、指定カテゴリの子孫を指定することはできません（循環参照になります）。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2396:admin.csv.error.category.parent_not_found: "%d 行目: 指定した親カテゴリIDのカテゴリが見つかりません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2397:admin.csv.error.category.nest_level_exceeded: "%d 行目: 親を指定した場合の階層が上限（%d 階層まで）を超えます。親カテゴリを見直してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2398:admin.csv.error.export.not_registered: 存在しないカードIDが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2399:admin.csv.error.export.no_card_selected: 1つ以上のカードを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2400:admin.csv.error.export.no_card_data: カードデータが存在しないためエクスポートできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2401:admin.csv.error.customer.not_member: "%row% 行目の会員は非会員状態の可能性があります。データ確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2402:admin.csv.error.exception.datetime: "%row% 行目の %column% で日時の形式が不正です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2412:admin.order.shipping_csv_upload: 出荷CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2527:admin.order.csv_shipping_date_description: 出荷日を「YYYY-MM-DD」の形式で設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2528:admin.order.order_csv: 受注CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2529:admin.order.shipping_csv: 出荷CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2576:admin.order.shipping_csv.shipping_id_col: 出荷ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2577:admin.order.shipping_csv.shipping_id_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2578:admin.order.shipping_csv.tracking_number_col: お問い合わせ番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2579:admin.order.shipping_csv.tracking_number_description: 半角英数字かハイフンのみで設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2580:admin.order.shipping_csv.shipping_date_col: 出荷日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2581:admin.order.shipping_csv.shipping_date_description: "出荷日を「YYYY-MM-DD」の形式で設定"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2736:admin.customer.csv: CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2938:admin.setting.shop.csv_setting: CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3110:admin.setting.shop.csv.csv_columns: CSV出力項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3111:admin.setting.shop.csv.csv_type: CSV種別
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3112:admin.setting.shop.csv.non_output_colmuns: 出力しない項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3113:admin.setting.shop.csv.output_colmuns: 出力する項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3114:admin.setting.shop.csv.operation: 操作項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3115:admin.setting.shop.csv.operation__output: 出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3116:admin.setting.shop.csv.operation__release: 解除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3117:admin.setting.shop.csv.operation__all_output: すべて出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3118:admin.setting.shop.csv.operation__all_release: すべて解除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3119:admin.setting.shop.csv.order: 項目順序
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3120:admin.setting.shop.csv.order__up: ひとつ上へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3121:admin.setting.shop.csv.order__down: ひとつ下へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3122:admin.setting.shop.csv.order__top: 一番上へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3123:admin.setting.shop.csv.order__bottom: 一番下へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3124:admin.setting.shop.csv.how_to_use: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3558:tooltip.product.csv_upload: 所定の型のCSVデータを用いて商品を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3559:tooltip.product.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3560:tooltip.category.csv_upload: 所定の型のCSVデータを用いてカテゴリを一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3561:tooltip.category.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3579:tooltip.shipping.csv_upload: 所定の型のCSVデータを用いて出荷情報を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3580:tooltip.shipping.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3629:tooltip.setting.shop.csv.csv_columns: 各種のデータをCSVで出力できます。出力したい項目をこちらで設定することが可能です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3630:tooltip.setting.shop.csv.csv_type: 設定したいCSVの種類を指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3657:tooltip.class_name.csv_upload: 所定の型のCSVデータを用いて規格を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3658:tooltip.class_name.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3882:admin.product.department_csv_upload: 部門CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3974:admin.product.inventory_plan.csv_import_title: 棚卸商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3975:admin.product.inventory_plan.csv_import_limit: '1ファイルの登録上限は %max% 件です'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3976:admin.product.inventory_plan.csv_import_submit: 商品登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3977:admin.product.inventory_plan.csv_modal.csv_file: CSVファイル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3978:admin.product.inventory_plan.csv_modal.no_file_selected: ファイルが選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3979:admin.product.inventory_plan.csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3980:admin.product.inventory_plan.csv_modal.format_product_code_desc: 棚卸計画に登録する商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3981:admin.product.inventory_plan.csv_modal.format_actual_stock: 棚卸数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3982:admin.product.inventory_plan.csv_modal.format_actual_stock_desc: 棚卸数量を整数で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3983:admin.product.inventory_plan.quantity_csv_import_title: 棚卸商品数量CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3984:admin.product.inventory_plan.quantity_csv_import_submit: 数量登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3985:admin.product.inventory_plan.quantity_csv_import.complete: 棚卸数量を登録しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4085:admin.customer.delivery_csv: 配送先情報CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4086:admin.customer.delivery_csv.csv_invalid_zipcode: "%d行目の郵便番号の入力に誤りがあります（郵便番号1・2が両方未入力の場合は海外郵便番号が必須です）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4087:admin.customer.delivery_csv.csv_invalid_zipcode_partial: "%d行目の郵便番号の入力に誤りがあります（郵便番号1と2はどちらか一方のみの入力はできません）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4088:admin.customer.delivery_csv.csv_invalid_pref: "%d行目の都道府県の入力に誤りがあります（日本の場合は必須、海外の場合は入力不可）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4141:admin.setting.shop.custom_csv: カスタムCSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4142:admin.setting.shop.custom_csv_menu: カスタムCSV出力設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4143:admin.setting.shop.custom_csv_setting: カスタムCSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4144:admin.setting.shop.csv.save.complete: CSV出力項目を保存しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4145:admin.setting.shop.csv.output_name: 出力名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4146:admin.setting.shop.csv.delete_modal__message: このCSV出力設定を削除してもよろしいでしょうか？
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4320:admin.deck.csv_import: CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4321:admin.deck.csv_export: CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4322:admin.deck.csv_export_no_selection: CSV出力対象のデッキが選択されていません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4385:admin.deck.csv_upload_title: デッキ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4386:admin.deck.csv_upload_header: デッキ登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4387:admin.deck.csv_format_title: デッキ登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4388:admin.deck.csv.commander: 統率者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4389:admin.deck.csv.error.format_invalid: "%s のフォーマットが一致しません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4390:admin.deck.csv.error.deck_not_found: "指定されたデッキID %s が存在しません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4391:admin.deck.csv.error.deck_type_invalid: "指定されたデッキID %s は event タイプではありません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4414:admin.archetype.csv_import: CSV取り込み
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4415:admin.archetype.csv_upload_title: アーキタイプ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4416:admin.archetype.csv_upload_header: アーキタイプ登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4417:admin.archetype.csv_format_title: アーキタイプ登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4456:admin.card.card_csv: カードCSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4457:admin.card.card_csv_upload_title: カードCSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4458:admin.card.card_csv_format_title: カードCSVフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4459:admin.card.csv_tsv_not_allowed: TSVファイルはアップロードできません。CSVファイルをアップロードしてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4549:admin.stock.move.shortage_csv_register: 欠品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4550:admin.stock.move.shortage_csv_invalid_status: 欠品CSV登録可能なステータスではありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4551:admin.stock.move.shortage_csv_modal.note: 欠品点数をCSVで一括登録します。欠品点数を入力した行のみ更新され、空欄の行およびCSVに含まれない明細は変更されません。0を入力した場合は欠品点数を0に更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4552:admin.stock.move.shortage_csv_modal.csv_file: CSVファイル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4553:admin.stock.move.shortage_csv_modal.csv_file_limit: 上限あり
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4554:admin.stock.move.shortage_csv_modal.csv_file_required: CSVファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4555:admin.stock.move.shortage_csv_import.file_not_found: 'ファイルが読み込めません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4556:admin.stock.move.shortage_csv_import.shortage_qty_invalid: '%line%行目: 欠品点数は0以上の整数で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4557:admin.stock.move.shortage_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4558:admin.stock.move.shortage_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4559:admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move: '%line%行目: 欠品点数（%shortage%）が移動点数（%max%）を超えています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4560:admin.stock.move.shortage_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4561:admin.stock.move.shortage_csv_modal.format_product_code_desc: 欠品対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4562:admin.stock.move.shortage_csv_modal.format_product_name: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4563:admin.stock.move.shortage_csv_modal.format_product_name_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4564:admin.stock.move.shortage_csv_modal.format_move_qty: 移動点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4565:admin.stock.move.shortage_csv_modal.format_move_qty_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4566:admin.stock.move.shortage_csv_modal.format_shortage_qty: 欠品点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4567:admin.stock.move.shortage_csv_modal.format_shortage_qty_desc: 欠品点数を記入（0以上の整数。空欄は更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4590:admin.stock.move.csv_output: CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4591:admin.stock.move.differential_csv_register: 差分CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4592:admin.stock.move.differential_csv_invalid_status: 差分CSV登録可能なステータスではありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4593:admin.stock.move.differential_csv_modal.note: 差分点数をCSVで一括登録します。差分点数を入力した行のみ更新され、空欄の行およびCSVに含まれない明細は変更されません。0を入力した場合は差分点数を0に更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4594:admin.stock.move.differential_csv_modal.csv_file: CSVファイル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4595:admin.stock.move.differential_csv_modal.csv_file_limit: 上限あり
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4596:admin.stock.move.differential_csv_modal.csv_file_required: CSVファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4597:admin.stock.move.differential_csv_import.difference_qty_invalid: '%line%行目: 差分点数は整数で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4598:admin.stock.move.differential_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4599:admin.stock.move.differential_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4600:admin.stock.move.differential_csv_import.difference_qty_exceeds_actual_move: '%line%行目: 差分点数（%difference%）が実移動点数（%max%）を超えています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4601:admin.stock.move.differential_csv_import.difference_qty_out_of_range: '%line%行目: 差分点数は%min%～%max%の範囲で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4602:admin.stock.move.differential_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4603:admin.stock.move.differential_csv_modal.format_product_code_desc: 差分対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4604:admin.stock.move.differential_csv_modal.format_product_name: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4605:admin.stock.move.differential_csv_modal.format_product_name_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4606:admin.stock.move.differential_csv_modal.format_actual_move_qty: 実移動点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4607:admin.stock.move.differential_csv_modal.format_actual_move_qty_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4608:admin.stock.move.differential_csv_modal.format_difference_qty: 差分点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4609:admin.stock.move.differential_csv_modal.format_difference_qty_desc: 差分点数を記入（整数。不足は正の数、追加は負の数。空欄は更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4664:admin.stock.list.search_required_for_csv: 検索条件を指定してからCSV出力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4697:admin.stock.list.recommend_csv: 在庫リコメンドCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4698:admin.stock.list.stock_info_csv: 在庫情報CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4699:admin.stock.list.custom_csv: 在庫情報カスタムCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4700:admin.stock.list.custom_csv_no_formats: フォーマットが登録されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4701:admin.stock.list.custom_csv_settings: 出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4793:admin.stock.barcode_replacement_list.csv_export: バーコード貼替リストCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4822:admin.stock.split_join.csv_preview_error: プレビューを表示できませんでした。ログイン状態を確認するか、しばらく経ってから再度お試しください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4826:admin.stock.split_join.split_csv_register: 在庫分割CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4827:admin.stock.split_join.join_csv_register: 在庫結合CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4828:admin.stock.split_join.list_csv_import_submit: CSVから登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4830:admin.stock.split_join.list_csv_join_import_done: '%count% 件の結合を登録し、欠品入力まで進めました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4831:admin.stock.split_join.list_csv_split_import_done: '%count% 件の分割を登録し、承認申請まで進めました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4898:admin.stock.split_join.csv_file_not_found: 'CSVファイルが見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4899:admin.stock.split_join.csv_header_invalid: 'CSVのヘッダー形式が不正です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4900:admin.stock.split_join.csv_parse_failed: 'CSVの解析に失敗しました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4901:admin.stock.split_join.csv_product_not_found: '%line%行目: 商品コード「%code%」が同一店舗・在庫区分で見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4902:admin.stock.split_join.csv_export: 在庫分割結合CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4903:admin.stock.split_csv_modal.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4904:admin.stock.split_csv_modal.store_placeholder: 選択してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4905:admin.stock.split_csv_modal.inventory_category: 在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4906:admin.stock.split_csv_modal.csv_file: CSVファイル選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4907:admin.stock.split_csv_modal.csv_file_limit: 1ファイルの登録上限は 2,000 件です
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4909:admin.stock.split_csv_modal.register: 登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4910:admin.stock.split_csv_modal.approval_notification_label: 承認通知先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4911:admin.stock.split_csv_modal.format_source_code: 分割元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4912:admin.stock.split_csv_modal.format_source_code_desc: 分割元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4913:admin.stock.split_csv_modal.format_split_quantity: 分割数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4914:admin.stock.split_csv_modal.format_split_quantity_desc: 分割数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4915:admin.stock.split_csv_modal.format_target_code: 分割先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4916:admin.stock.split_csv_modal.format_target_code_desc: 分割先商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4917:admin.stock.split_csv_modal.format_target_stock: 分割先在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4918:admin.stock.split_csv_modal.format_target_stock_desc: 分割先在庫数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4919:admin.stock.split_csv_modal.no_file_selected: 選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4920:admin.stock.split_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4921:admin.stock.join_csv_modal.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4922:admin.stock.join_csv_modal.store_placeholder: 選択してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4923:admin.stock.join_csv_modal.inventory_category: 在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4924:admin.stock.join_csv_modal.csv_file: CSVファイル選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4925:admin.stock.join_csv_modal.csv_file_limit: 1ファイルの登録上限は 2,000 件です
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4926:admin.stock.join_csv_modal.format_destination_code: 結合先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4927:admin.stock.join_csv_modal.format_destination_code_desc: 結合先となる商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4928:admin.stock.join_csv_modal.format_join_quantity: 結合元在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4929:admin.stock.join_csv_modal.format_join_quantity_desc: 結合する数量を整数で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4930:admin.stock.join_csv_modal.format_source_code: 結合元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4931:admin.stock.join_csv_modal.format_source_code_desc: 結合元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4932:admin.stock.join_csv_modal.format_source_stock_category: 結合元在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4933:admin.stock.join_csv_modal.format_source_stock_category_desc: "結合元の在庫区分を記入（1: EC-CUBE, 2: スマレジ）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4934:admin.stock.join_csv_modal.format_source_stock_quantity: 結合元在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4935:admin.stock.join_csv_modal.format_source_stock_quantity_desc: 結合元在庫数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4936:admin.stock.join_csv_modal.register: 登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4937:admin.stock.join_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4954:admin.stock.split.csv_register: 分割先商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4977:admin.stock.split.csv_column_invalid: 'CSVの列名が不正です。1行目に「商品コード」「分割先在庫数」が必要です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4978:admin.stock.split.csv_same_as_source: '%line%行目: 分割元と同じ商品コードは分割先に指定できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4984:admin.stock.split.new_destination_csv_modal.title: 分割先CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4985:admin.stock.split.new_destination_csv_modal.note: CSVファイルをアップロードして分割先商品を一括登録します。登録済みの分割先リストは上書きされます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4986:admin.stock.split.new_destination_csv_modal.product_register: 分割先商品を登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4987:admin.stock.split.new_destination_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4988:admin.stock.split.new_destination_csv_modal.format_product_code_desc: 分割先となる商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4989:admin.stock.split.new_destination_csv_modal.format_destination_qty: 分割先数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4990:admin.stock.split.new_destination_csv_modal.format_destination_qty_desc: 分割先の分割数量を整数で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4991:admin.stock.split.new_destination_csv_modal.csv_file: CSVファイル (上限あり)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4992:admin.stock.split.new_destination_csv_modal.no_file_selected: ファイルが選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4993:admin.stock.split.new_destination_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5025:admin.stock.join.new_source_csv_modal.title: 結合元商品CSV登録（既に登録済みの商品は削除して登録します。）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5026:admin.stock.join.new_source_csv_modal.note: 既に画面に登録済みの結合元はすべて削除し、CSVの内容で置き換えます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5027:admin.stock.join.new_source_csv_modal.product_register: 商品登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5028:admin.stock.join.new_source_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5029:admin.stock.join.new_source_csv_modal.format_product_code_desc: 結合元商品の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5030:admin.stock.join.new_source_csv_modal.format_join_qty: 結合元在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5031:admin.stock.join.new_source_csv_modal.format_join_qty_desc: 結合元在庫数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5032:admin.stock.join.new_source_csv_modal.csv_file: CSVファイル選択（1ファイルの登録上限は 10,000 件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5033:admin.stock.join.new_source_csv_modal.no_file_selected: 選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5034:admin.stock.join.new_source_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5052:admin.stock.join.shortage_csv_modal.title: 検品CSV登録（既に仮登録済みの欠品点数は削除して仮登録します。）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5053:admin.stock.join.shortage_csv_modal.button_label: 欠品仮登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5054:admin.stock.join.shortage_csv_modal.open_button: 検品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5055:admin.stock.join.shortage_csv_modal.csv_file: CSVファイル選択（1ファイルの登録上限は 10,000 件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5056:admin.stock.join.shortage_csv_modal.note: 欠品点数をCSVで一括登録します。登録済みの欠品点数は上書きされます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5057:admin.stock.join.shortage_csv_modal.format_product_code_desc: 商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5058:admin.stock.join.shortage_csv_modal.format_shortage_qty: 欠品点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5059:admin.stock.join.shortage_csv_modal.format_shortage_qty_desc: 欠品点数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5060:admin.stock.join.shortage_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5061:admin.stock.join.shortage_csv_modal.csv_file_required: CSVファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5067:admin.stock.join.csv_register: 結合元商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5120:admin.stock.join.csv_column_invalid: 'CSVの列名が不正です。1行目に「商品コード」「結合元在庫数」が必要です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5121:admin.stock.join.csv_same_as_destination: '%line%行目: 結合先と同一の在庫は結合元に指定できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5176:admin.csv.error.export.not_registered_stock_history_id: 存在しない在庫履歴IDが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5177:admin.csv.error.export.no_stock_history_data: 在庫履歴データが存在しないためエクスポートできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5180:admin.stock.change_csv.title: 在庫変更CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5181:admin.stock.change_csv.subtitle: 在庫管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5182:admin.stock.change_csv.list: 在庫変更CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5183:admin.stock.change_csv.file_upload_title: CSVファイルをアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5184:admin.stock.change_csv.base_info_name: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5185:admin.stock.change_csv.stock_location: 在庫場所
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5186:admin.stock.change_csv.change_type_detail: 在庫変動区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5187:admin.stock.change_csv.hange_type_detail_empty: 在庫変動区分を選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5188:admin.stock.change_csv.stock_change_reason: 在庫変動理由
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5189:admin.stock.change_csv.approval_department: 承認通知先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5190:admin.stock.change_csv.approval_department_empty: 所属を選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5191:admin.stock.change_csv.approval_members_empty: 選択してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5192:admin.stock.change_csv.file_format_title: CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5193:admin.stock.change_csv.history_title: 在庫変更CSV登録履歴（承認テーブルの情報を参照）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5194:admin.stock.change_csv.history_approval_status: 承認状態
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5195:admin.stock.change_csv.history_filename: ファイル名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5196:admin.stock.change_csv.history_store: 店舗/在庫場所
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5197:admin.stock.change_csv.history_class_count: 対象商品規格数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5198:admin.stock.change_csv.history_total_change_quantity: 合計在庫増減数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5199:admin.stock.change_csv.history_total_cost_change: 合計総原価増減数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5200:admin.stock.change_csv.history_type_detail: 在庫変動区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5201:admin.stock.change_csv.history_type_detail_stock: 入庫
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5202:admin.stock.change_csv.history_type_detail_disposal: 廃棄
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5203:admin.stock.change_csv.history_registration_date: 登録日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5204:admin.stock.change_csv.history_registration_member: 登録者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5205:admin.stock.change_csv.history_approval_date: 承認日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5206:admin.stock.change_csv.history_approval_member: 承認者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5207:admin.stock.change_csv.history_approval_upapproved: 未承認
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5208:admin.stock.change_csv.history_approval_approved: 承認済
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5209:admin.stock.change_csv.history_approval_waiting: 承認待ち
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5210:admin.stock.change_csv.shop_not_permitted: 編集権限のない店舗が選択されています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5235:admin.stock.move_instruction.csv_download_record: 在庫移動実績入力用CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5236:admin.stock.move_instruction.csv_download_invoice: 送り状CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5237:admin.stock.move_instruction.csv_invoice_select_rows: 送り状CSVを出力する在庫移動指示にチェックを入れてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5240:admin.stock.move_instruction.csv_registration: CSVファイル登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5241:admin.stock.move_instruction.csv_registration_button: 在庫移動実績CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5242:admin.stock.move_instruction.csv_registration_modal_lead: CSVファイルを選択し、登録ボタンをクリックしてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5243:admin.stock.move_instruction.csv_registration_modal_overwrite_note: （既に在庫移動実績を登録している場合、上書きされます）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5244:admin.stock.move_instruction.csv_registration_file_limit: （1ファイルの登録上限は10,000件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5245:admin.stock.move_instruction.csv_format_title: CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5246:admin.stock.move_instruction.csv_format_instruction_id: 移動指示ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5247:admin.stock.move_instruction.csv_format_instruction_id_desc: 移動指示リストのIDを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5248:admin.stock.move_instruction.csv_format_move_from_shop: 出庫元店舗(名称)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5249:admin.stock.move_instruction.csv_format_move_from_shop_desc: 出庫元店舗の名称を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5250:admin.stock.move_instruction.csv_format_move_to_shop: 入庫先店舗(名称)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5251:admin.stock.move_instruction.csv_format_move_to_shop_desc: 入庫先店舗の名称を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5252:admin.stock.move_instruction.csv_format_tracking_no: 送り状No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5253:admin.stock.move_instruction.csv_format_tracking_no_desc: 送り状No.を入力、複数ある場合はカンマ(,)で区切る(スペースなどは不要)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5271:admin.stock.move_instruction.csv_tracking_file_invalid: ファイルが不正です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5272:admin.stock.move_instruction.csv_tracking_header_invalid: CSVのヘッダーが不正です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5273:admin.stock.move_instruction.csv_tracking_no_valid_rows: 有効な行がありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5274:admin.stock.move_instruction.csv_tracking_success: 送り状No.を一括登録しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5275:admin.stock.move_instruction.csv_tracking_upload_error_detail: アップロードに失敗しました。詳細：%detail%
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5276:admin.stock.move_instruction.csv_tracking_error_instruction_not_found: 移動指示が見つかりません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5277:admin.stock.move_instruction.csv_tracking_error_shop_mismatch_from: 出庫元店舗が一致しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5278:admin.stock.move_instruction.csv_tracking_error_shop_mismatch_to: 入庫先店舗が一致しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5279:admin.stock.move_instruction.csv_tracking_error_tracking_no_empty: 送り状Noが空欄です
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5280:admin.stock.move_instruction.csv_tracking_error_register_failed: 登録処理中にエラーが発生しました（%detail%）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5281:admin.stock.move_instruction.csv_tracking_errors_capped: エラーは20件まで表示されます
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5319:admin.stock.approval_list.csv_download: CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5338:admin.stock.approval_list.approval_target_csv: 在庫変更CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5345:admin.stock.approval_list.confirm_modal_message_csv: 在庫変更CSV登録にて登録した在庫情報はCSVダウンロードして確認してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5353:admin.stock.approval_list.csv_export_no_session: 明細を表示するための選択情報がありません。確認モーダルを開き直してからCSVダウンロードしてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5369:admin.stock.approval_list.line_items.over_display_limit_csv_hint: 参照している在庫情報が表示上限（%max%件）を超えているため、全件を確認する場合はCSVダウンロードして確認してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5400:admin.stock.move_transfer.action_barcode_csv_export: バーコード印刷用CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5401:admin.stock.move_transfer.action_move_transfer_csv_export: 在庫移動振替CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5402:admin.stock.move_transfer.action_return_list_csv_export: 戻しリストCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5407:admin.stock.move_transfer.return_list_csv_export.no_selection: 1つ以上の在庫移動情報を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5408:admin.stock.move_transfer.barcode_csv_export.no_selection: 1つ以上の在庫移動・振替を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5409:admin.stock.move_transfer.barcode_csv_export.not_found: 対象のデータが見つかりません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5410:admin.stock.move_transfer.barcode_csv_export.not_move_type: 'ID: %moveTransferId% は移動ではないため出力できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5411:admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination: 'ID: %moveTransferId% は入庫先がスマレジ在庫ではないため出力できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5412:admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set: 'ID: %moveTransferId% は入庫先店舗が設定されていません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5413:admin.stock.move_transfer.barcode_csv_export.shop_not_permitted: 'ID: %moveTransferId% は権限のない店舗のデータです。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5414:admin.stock.move_transfer.barcode_csv_export.id_not_found: 'ID: %moveTransferId% は存在しません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5415:admin.stock.move_transfer.barcode_csv_export.multiple_shops: 複数店舗の在庫移動・振替情報を同時に処理することはできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5418:admin.stock.move_transfer.csv_file_registration: CSVファイル登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5419:admin.stock.move_transfer.csv_register_move: 在庫移動CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5420:admin.stock.move_transfer.csv_register_transfer: 在庫振替CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5421:admin.stock.move_transfer.csv_move_modal.file_row_limit_hint: （1ファイルの登録上限は 10,000 件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5422:admin.stock.move_transfer.csv_move_modal.move_from_stock_location: 出庫元在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5423:admin.stock.move_transfer.csv_move_modal.move_to_stock_location: 入庫先在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5424:admin.stock.move_transfer.csv_move_modal.col_product_code_hint: 商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5425:admin.stock.move_transfer.csv_move_modal.col_move_quantity_hint: 移動点数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5426:admin.stock.move_transfer.csv_transfer_modal.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5427:admin.stock.move_transfer.csv_transfer_modal.transfer_from_stock_location: 振替元在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5428:admin.stock.move_transfer.csv_transfer_modal.member: メンバー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5429:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code: 振替元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5430:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code: 振替先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5431:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity: 振替点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5432:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint: 振替元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5433:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint: 振替先商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5434:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity_hint: 振替点数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5524:admin.purchase.online.csv_export.no_selection: 1つ以上の買取注文情報を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5525:admin.purchase.online.csv_export.not_registered_buy_order_id: 存在しない買取注文情報IDが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5526:admin.purchase.online.csv_export.bad_csv_type: 不正なCSV種別です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5527:admin.purchase.online.btn.csvexport: 古物台帳入力用CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5528:admin.purchase.online.btn.csvexport_deposit: 入金CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5529:admin.purchase.online.btn.csvexport_product_list: 買取商品一覧CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5530:admin.purchase.online.detail.btn.csvexport: 古物台帳入力用CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5531:admin.purchase.online.detail.btn.csvexport_product_list: 買取商品一覧CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5535:admin.purchase.online.btn.csv_export_product_cancel: 買取商品（キャンセル）CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5536:admin.purchase.online.btn.csv_export_return_list: 戻しリストCSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5807:admin.order.order_csv.download: 受注CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5808:admin.order.shipping_csv.download: 出荷CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5809:admin.order.order_csv.setting: 受注CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5810:admin.order.shipping_csv.setting: 出荷CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5811:admin.order.custom_order_csv.download: カスタム受注CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5812:admin.order.custom_shipping_csv.download: カスタム配送CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5814:admin.order.order.custom_csv.setting: 出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5854:admin.event.entry.bulk_csv_upload_title: イベント一括登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5855:admin.event.entry.bulk_csv_header: イベント一括登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5856:admin.event.entry.bulk_csv_format_title: イベント一括登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5857:tooltip.event.entry.bulk_csv_upload: 所定の型のCSVファイルを選択し、一括登録を実行するとイベントを登録できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5858:tooltip.event.entry.bulk_csv_format: 雛形ファイルをダウンロードして編集すれば、所定の型のイベント一括登録用CSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5859:admin.event.entry.bulk_csv.error.shop_not_editable: '行%line%: 指定した店舗は登録できません（権限がありません）。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5860:admin.event.entry.bulk_csv.error.format_not_found: '行%line%: フォーマット名が正しくないか、マスタに存在しません（複数指定はカンマ区切り）。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5861:admin.event.entry.bulk_csv.error.schedule_without_start: '行%line%: 開始時間が空欄のとき、日程列のみ入力することはできません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5862:admin.event.entry.bulk_csv.error.reception_time_required: '行%line%: 受付が「あり」のときは受付時間From・Toを入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5863:admin.event.entry.bulk_csv.error.reception_time_order: '行%line%: 受付時間のFromはToより前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5864:admin.event.entry.bulk_csv.error.reception_end_after_event_start: '行%line%: 受付時間Toはイベント開始時間以前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5865:admin.event.entry.bulk_csv.error.online_reception_time_required: '行%line%: オンライン受付が「あり」のときはオンライン受付時間From・Toを入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5866:admin.event.entry.bulk_csv.error.online_reception_time_order: '行%line%: オンライン受付時間のFromはToより前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5867:admin.event.entry.bulk_csv.error.online_reception_end_not_before_event_start: '行%line%: オンライン受付終了はイベント開始時間より前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5868:admin.event.entry.bulk_csv.error.team_battle_invalid: '行%line%: チーム戦は0または1で指定してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6055:admin.event.entry.csv_download: CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6056:admin.event.entry.csv_column_settings: 出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6195:admin.analysis.used_card.csv_download: 特集タグ編集CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:38:"41","1",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:39:"42","2",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:40:"43","3",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:41:"44","1",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:42:"45","2",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:43:"46","3",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:44:"47","1",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:45:"48","2",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:46:"49","3",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:47:"50","1",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:48:"51","2",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:49:"52","3",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:3:{% set menus = ['product', 'product_csv_management', 'admin_product_status_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:5:{% block sub_title %}{{ 'admin.product.product_status_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:260:                $this->flashSuccesses[] = trans('admin.stock.split_join.list_csv_join_import_done', ['%count%' => (string) $successCount]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number.twig:5:{% block sub_title %}{{ 'admin.product.product_shelf_number_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_category.twig:152:                                        <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_category.twig:154:                                    <a class="btn btn-ec-regular" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_CLASS_CATEGORY') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_category.twig:156:                                        <span>{{ 'admin.setting.shop.csv_setting'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category_bulk.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category_bulk.twig:3:{% set menus = ['product', 'product_csv_management', 'category_bulk_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category_bulk.twig:5:{% block sub_title %}{{ 'admin.product.category_bulk_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:3:{% set menus = ['product', 'product_csv_management', 'shelf_number_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:5:{% block sub_title %}{{ 'admin.product.product_shelf_number_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:1:"id","csv_type_id","creator_id","entity_name","field_name","reference_field_name","disp_name","sort_no","enabled","create_date","update_date"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:94:            foreach ($this->shortageByProductCode as $productCode => $csvRow) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:96:                $shortages[(string) $moveDetail->getId()] = $csvRow['shortageQuantity'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:188:                'admin.stock.move.shortage_csv_import.shortage_qty_invalid',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:208:                'admin.stock.move.shortage_csv_import.product_code_duplicated',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:230:                'admin.stock.move.shortage_csv_import.product_code_not_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:253:                'admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:221:            $this->eccubeConfig['eccube_csv_import_delimiter'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:222:            $this->eccubeConfig['eccube_csv_import_enclosure']
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:94:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_zipcode_partial', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:100:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_zipcode', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:106:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_pref', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:119:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_zipcode', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:125:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_pref', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/ja/definition.yml:1:- mtb_tenant_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/ja/definition.yml:2:- mtb_rounding_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:38:"41","1",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:39:"42","2",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:40:"43","3",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:41:"44","1",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:42:"45","2",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:43:"46","3",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:44:"47","1",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:45:"48","2",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:46:"49","3",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:47:"50","1",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:48:"51","2",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:49:"52","3",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/PriceConsistencyRowValidator.php:58:            $errors->addMessage('admin.csv.error.product.price_valid', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:44:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:62:            throw new \RuntimeException('admin.purchase.online.csv_export.not_registered_buy_order_id');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:74:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:75:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:82:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:85:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:89:        $filename = $prefix.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/en/definition.yml:1:- mtb_tenant_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/en/definition.yml:2:- mtb_rounding_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:20:{% block import_file_accept %}.csv, text/csv, .tsv, text/tsv{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:43:                            <i class="fa fa-exclamation-triangle mr-2"></i>{{ 'admin.common.csv_import_error'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:58:                            <h4 class="card-title mb-0">{{ csv_box_title|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:74:                                {{ 'admin.common.csv_upload'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:82:                        <h4 class="card-title mb-0">{{ csv_format_title|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:83:                        <a href="{{ url(template_download_route, template_download_route_params|default({})) }}" class="btn btn-secondary" id="download-template-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:90:                                        <th class="w-50">{{ 'admin.common.csv_item_name'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:91:                                        <th>{{ 'admin.common.csv_description'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:99:                                                {% if csv_required_header_keys is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:100:                                                    {% if key in csv_required_header_keys %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:113:                {% include '@admin/Product/csv_import_history.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:1:id,csv_type_id,creator_id,entity_name,field_name,reference_field_name,disp_name,sort_no,enabled,create_date,update_date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:1:- mtb_authority.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:2:- mtb_country.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:3:- mtb_csv_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:4:- mtb_customer_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:5:- mtb_customer_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:6:- mtb_device_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:7:- mtb_product_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:8:- mtb_job.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:9:- mtb_login_history_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:10:- mtb_order_item_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:11:- mtb_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:12:- mtb_order_status_color.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:13:- mtb_page_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:14:- mtb_pref.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:15:- mtb_product_list_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:16:- mtb_product_list_order_by.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:17:- mtb_sale_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:18:- mtb_sex.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:19:- mtb_shipping_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:20:- mtb_tax_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:21:- mtb_tax_display_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:22:- mtb_work.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:23:- dtb_tenant.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:24:- dtb_member.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:25:- dtb_tax_rule.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:26:- dtb_block.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:27:- dtb_page.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:28:- dtb_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:29:- dtb_page_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:30:- dtb_block_position.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:31:- dtb_authority_role.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:32:- dtb_base_info.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:33:- dtb_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:34:- dtb_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:35:- dtb_class_name.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:36:- dtb_class_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:37:- dtb_csv.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:38:- dtb_customer.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:39:- dtb_customer_address.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:40:- dtb_customer_favorite_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:41:- dtb_delivery.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:42:- dtb_delivery_duration.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:43:- dtb_delivery_fee.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:44:- dtb_delivery_time.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:45:- dtb_mail_history.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:46:- dtb_mail_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:47:- dtb_news.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:48:- dtb_order.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:49:- dtb_payment.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:50:- dtb_payment_option.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:51:- dtb_plugin.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:52:- dtb_plugin_event_handler.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:53:- dtb_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:54:- dtb_product_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:55:- dtb_product_class.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:56:- dtb_product_image.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:57:- dtb_product_stock.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:58:- dtb_product_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:59:- dtb_order_item.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:60:- dtb_shipping.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:61:- dtb_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:62:- dtb_tradelaw.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:6:                <h4 class="card-title mb-0">{{ 'admin.product.csv_import_history_title'|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:24:                        <th class="text-nowrap">{{ 'admin.product.csv_import_history_filename'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:25:                        <th class="text-nowrap">{{ 'admin.product.csv_import_history_upload_date'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:26:                        <th class="text-nowrap">{{ 'admin.product.csv_import_history_operator'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:36:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:48:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:49:            $this->csvExportService->fputcsv([self::HEADER_PRODUCT_CODE, self::HEADER_SHORTAGE_QTY]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:52:                $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:55:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:58:        $filename = 'shortage_join_'.(string) $join->getId().'_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_price.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_price.twig:3:{% set menus = ['product', 'product_csv_management', 'product_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_price.twig:5:{% block sub_title %}{{ 'admin.product.product_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_simple_high_price.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_simple_high_price.twig:3:{% set menus = ['product', 'product_csv_management', 'simple_high_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_simple_high_price.twig:5:{% block sub_title %}{{ 'admin.product.simple_high_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:40:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:55:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:58:                $this->csvExportService->fputcsv(self::CSV_HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:61:                    $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:64:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:69:            'stock_move_outbound_approval_request_%d_%s.csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:42:                    <h3 class="c-primaryCol__title">{{ 'admin.product.storage_code_csv_upload_title'|trans }}</h3>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:44:                        {{ 'admin.common.csv_back_to_list'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:51:                            <i class="fa fa-exclamation-triangle mr-2"></i>{{ 'admin.common.csv_import_error'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:67:                            <h4 class="card-title mb-0">{{ 'admin.common.csv_file_select'|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:74:                                            {{ form_widget(form.import_file, {'attr': {'class': 'custom-file-input', 'accept': '.csv, text/csv, .tsv, text/tsv'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:83:                                {{ 'admin.common.csv_upload'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:91:                        <h4 class="card-title mb-0">{{ 'admin.product.storage_code_csv_format_title'|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:92:                        <a href="{{ url('admin_product_storage_code_csv_template') }}" class="btn btn-ec-conversion" id="download-template-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:110:                                                <br><small class="text-muted">{{ 'admin.common.csv_id_optional'|trans }}</small>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:122:                            {{ 'admin.common.csv_export_guide'|trans({'%url%': path('admin_product_storage_code_export')})|raw }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:66:        CsvExportService $csvService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:81:            $resolveCellValue = function (Csv $csv) use ($csvService, $entry, $entryPlayer, $deck, $eventDetail, $event): ?string {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:83:                    $value = $csvService->getData($csv, $candidateEntity);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:89:                $csvEntityClass = str_replace('\\\\', '\\', (string) $csv->getEntityName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:90:                $fieldName = (string) $csv->getFieldName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:91:                $entity = match ($csvEntityClass) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:118:                if ($csvEntityClass !== $actualEntityClass) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:121:                $csvForExport = clone $csv;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:122:                $csvForExport->setEntityName($actualEntityClass);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:124:                return $csvService->getData($csvForExport, $entity);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:128:            foreach ($csvService->getCsvs() as $csv) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:129:                $exportCsvRow->setData($resolveCellValue($csv));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExporterService.php:132:            $csvService->fputcsv($exportCsvRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:249:                                <a href="{{ path('admin_product_buy_sale_price_history_export') }}" class="btn btn-ec-conversion">{{ 'admin.common.csv_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/summary.twig:122:                                        <button type="submit" id="result_list_main__csv_menu" class="btn btn-primary btn-sm">CSVダウンロード</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:26:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:42:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:43:            $this->csvExportService->fputcsv($header);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:52:                $this->csvExportService->fputcsv($line);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:55:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:58:        $filename = 'sales_report_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_standard_price.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_standard_price.twig:3:{% set menus = ['product', 'product_csv_management', 'product_standard_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_standard_price.twig:5:{% block sub_title %}{{ 'admin.product.product_standard_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:171:                            <button type="button" class="btn btn-ec-regular" data-bs-toggle="modal" data-bs-target="#splitEditDestinationCsvModal">{{ 'admin.stock.split.csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:438:    {% include '@admin/Stock/stock_split_destination_csv_modal.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:439:        split_destination_csv_modal_id: 'splitEditDestinationCsvModal',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:440:        split_destination_csv_modal_label_id: 'splitEditDestinationCsvModalLabel',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:441:        split_destination_csv_form_id: 'form-split-edit-destination-csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:442:        split_destination_csv_file_id: 'split-edit-destination-csv-file',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:443:        split_destination_csv_submit_id: 'btn-split-edit-destination-csv-submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:444:        split_destination_csv_error_id: 'split-edit-destination-csv-error',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:445:        split_destination_csv_upload_url: url('admin_stock_split_edit_destination_csv_upload', { id: StockSplitJoin.id }),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:446:        split_destination_csv_template_url: url('admin_stock_split_new_destination_csv_template'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:447:        split_destination_csv_csrf: csrf_token('stock_split_edit_destination_csv'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:448:        split_destination_csv_reload: true,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:595:            const splitDestCsvForm = document.getElementById('form-split-edit-destination-csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:596:            const splitDestCsvFile = document.getElementById('split-edit-destination-csv-file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:597:            const splitDestCsvErr = document.getElementById('split-edit-destination-csv-error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:606:                    const span = splitDestCsvModal.querySelector('.js-split-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:608:                        span.textContent = (this.files && this.files.length) ? this.files[0].name : '{{ 'admin.stock.split_csv_modal.no_file_selected'|trans }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:627:                            if (splitDestCsvForm.getAttribute('data-split-csv-reload') === '1') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:632:                            const span = splitDestCsvModal.querySelector('.js-split-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:633:                            if (span) { span.textContent = '{{ 'admin.stock.split_csv_modal.no_file_selected'|trans }}'; }
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:39:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:54:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:57:                $this->csvExportService->fputcsv(self::CSV_HEADER);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:60:                    $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:63:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:68:            'stock_move_inbound_approval_request_%d_%s.csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:16:#result_list__custom_csv_menu .dropdown-menu.show {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:181:                                <li id="result_list__custom_csv_menu" class="dropdown">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:186:                                        <li><a href="#" class="dropdown-item export-link" data-type="otc_buy_order_restock_list_csv">戻しリストCSV</a></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:1:- mtb_authority.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:2:- mtb_country.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:3:- mtb_csv_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:4:- mtb_customer_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:5:- mtb_customer_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:6:- mtb_device_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:7:- mtb_product_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:8:- mtb_job.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:9:- mtb_login_history_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:10:- mtb_order_item_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:11:- mtb_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:12:- mtb_order_status_color.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:13:- mtb_page_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:14:- mtb_pref.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:15:- mtb_product_list_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:16:- mtb_product_list_order_by.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:17:- mtb_sale_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:18:- mtb_sex.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:19:- mtb_shipping_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:20:- mtb_tax_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:21:- mtb_tax_display_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:22:- mtb_work.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:23:- dtb_member.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:24:- dtb_tax_rule.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:25:- dtb_block.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:26:- dtb_page.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:27:- dtb_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:28:- dtb_page_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:29:- dtb_block_position.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:30:- dtb_authority_role.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:31:- dtb_base_info.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:32:- dtb_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:33:- dtb_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:34:- dtb_class_name.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:35:- dtb_class_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:36:- dtb_csv.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:37:- dtb_customer.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:38:- dtb_customer_address.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:39:- dtb_customer_favorite_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:40:- dtb_delivery.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:41:- dtb_delivery_duration.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:42:- dtb_delivery_fee.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:43:- dtb_delivery_time.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:44:- dtb_mail_history.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:45:- dtb_mail_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:46:- dtb_news.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:47:- dtb_order.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:48:- dtb_payment.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:49:- dtb_payment_option.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:50:- dtb_plugin.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:51:- dtb_plugin_event_handler.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:52:- dtb_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:53:- dtb_product_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:54:- dtb_product_class.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:55:- dtb_product_image.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:56:- dtb_product_stock.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:57:- dtb_product_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:58:- dtb_order_item.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:59:- dtb_shipping.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:60:- dtb_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:61:- dtb_tradelaw.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:3:{% set menus = ['product', 'product_csv_management', 'product_tag_sales_analysis_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:5:{% block sub_title %}{{ 'admin.product.tag_sales_analysis_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:16:#result_list__custom_csv_menu .dropdown-menu.show {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:186:                                <li id="result_list__custom_csv_menu" class="dropdown">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:13:{% set menus = ['order', 'admin_shipping_result_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:24:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:25:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:28:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:45:                <form id="upload-form" method="post" action="{{ url('admin_shipping_result_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:46:                    <div id="ex-csv_product_card-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:48:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:53:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:54:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:196:                const $csvLink = $modal.find('.js-approval-line-items-csv-link');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:197:                if (!$csvLink.length) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:200:                $csvLink.attr('aria-disabled', enabled ? 'false' : 'true');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:201:                $csvLink.toggleClass('disabled', !enabled);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:202:                $csvLink.toggleClass('pe-none', !enabled);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:248:            $confirmModal.on('click', '.js-approval-line-items-csv-link', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:464:                                    <a href="{{ path('admin_stock_approval_list_csv') }}" class="btn btn-ec-conversion" title="{{ 'admin.stock.approval_list.csv_download'|trans }}"><i class="fa fa-cloud-download me-1" aria-hidden="true"></i>{{ 'admin.stock.approval_list.csv_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:550:                                            <span>{{ 'admin.stock.approval_list.confirm_modal_message_csv'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:553:                                            <span><a href="{{ path('admin_stock_approval_list_line_items_csv') }}" class="btn btn-ec-conversion js-approval-line-items-csv-link disabled pe-none" aria-disabled="true" title="{{ 'admin.stock.approval_list.csv_download'|trans }}"><i class="fa fa-cloud-download me-1" aria-hidden="true"></i>{{ 'admin.stock.approval_list.csv_download'|trans }}</a></span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:38:"41","1",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:39:"42","2",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:40:"43","3",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:41:"44","1",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:42:"45","2",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:43:"46","3",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:44:"47","1",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:45:"48","2",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:46:"49","3",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:47:"50","1",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:48:"51","2",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:49:"52","3",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:24:        .btn-csv {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:57:                                <a href="{{ path('admin_product_shelf_number') }}" class="btn btn-primary btn-csv ml-2">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:61:                            <a href="{{ path('admin_product_shelf_number_export') }}" class="btn btn-primary btn-csv mr-1">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:62:                                {{ 'admin.product.csv.export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:64:                            <a href="{{ path('admin_product_shelf_number_master_csv_upload') }}" class="btn btn-primary btn-csv">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:65:                                {{ 'admin.product.csv.import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_tag.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_tag.twig:3:{% set menus = ['product', 'product_csv_management', 'product_tag_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_tag.twig:5:{% block sub_title %}{{ 'admin.product.product_tag_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/ja/definition.yml:1:- mtb_tenant_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/ja/definition.yml:2:- mtb_rounding_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/en/definition.yml:1:- mtb_tenant_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/en/definition.yml:2:- mtb_rounding_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_name.twig:155:                            <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_name.twig:157:                        {% if is_accessable_route('admin_setting_shop_csv') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_name.twig:158:                        <a class="btn btn-ec-regular" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_CLASS_NAME') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_name.twig:160:                            <span>{{ 'admin.setting.shop.csv_setting'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_section.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_section.twig:3:{% set menus = ['product', 'product_csv_management', 'admin_product_section_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_section.twig:5:{% block sub_title %}{{ 'admin.product.product_section_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:1:id,csv_type_id,creator_id,entity_name,field_name,reference_field_name,disp_name,sort_no,enabled,create_date,update_date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:13:{% set menus = ['product', 'class_name_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:15:{% block title %}{{ 'admin.product.class_name_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:53:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:54:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:57:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:70:                        <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.class_name.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:72:                    <div id="ex-csv_category-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:74:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:76:                                <form id="upload-form" method="post" action="{{ url('admin_product_class_name_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:80:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:81:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:98:                                <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.class_name.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:101:                                <a href="{{ url('admin_product_csv_template', {'type': 'class_name'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:105:                    <div id="ex-csv_class_name-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:318:        $csvSellPriceSet = StringUtil::isNotBlank($this->sellPriceColumn->getValue($row));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:326:            $csvSaleFlg = $saleFlg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:328:            $newSaleFlg = $csvSaleFlg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:329:            if ($currentSaleFlg && !$csvSaleFlg) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:333:                if ($csvSellPriceSet && !$alertSellPriceNotReflected) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:334:                    $messageStore->addMessage('admin.product.price_csv.sell_price_not_reflected', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:337:            } elseif (!$currentSaleFlg && !$csvSaleFlg) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:341:                    $messageStore->addMessage('admin.product.price_csv.normal_product_sell_price_unchanged', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:102:                        <button type="button" class="btn btn-ec-conversion me-2" data-bs-toggle="modal" data-bs-target="#modalSplitCsv">{{ 'admin.stock.split_join.split_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:103:                        <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#modalJoinCsv">{{ 'admin.stock.split_join.join_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:292:                                    <a href="{{ url('admin_stock_split_join_csv_export') }}" class="btn btn-ec-conversion">{{ 'admin.stock.split_join.csv_export'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:424:                    <h5 class="modal-title fw-bold" id="modalSplitCsvLabel">{{ 'admin.stock.split_join.split_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:429:                    {% include '@admin/Stock/stock_split_csv_modal_body.twig' with splitCsvModal|merge({ split_csv_list_import_url: url('admin_stock_split_join_list_split_csv_import') }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:444:                    <h5 class="modal-title fw-bold" id="modalJoinCsvLabel">{{ 'admin.stock.split_join.join_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:449:                    {% include '@admin/Stock/stock_join_csv_modal_body.twig' with joinCsvModal|merge({ join_csv_list_import_url: url('admin_stock_split_join_list_join_csv_import') }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:474:                        const nativeSelect = document.getElementById('admin_stock_split_csv_upload_approval_notification_target_members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:502:                    let form = document.getElementById('form-stock-split-csv-upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:513:                const storeSelect = document.getElementById('admin_stock_split_csv_upload_store');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:526:                    let span = modalSplitCsv.querySelector('.js-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:527:                    if (span) span.textContent = e.target.files && e.target.files.length ? e.target.files[0].name : '{{ 'admin.stock.split_csv_modal.no_file_selected'|trans }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:530:                    let spanJ = modalJoinCsv.querySelector('.js-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:531:                    if (spanJ) spanJ.textContent = e.target.files && e.target.files.length ? e.target.files[0].name : '{{ 'admin.stock.split_csv_modal.no_file_selected'|trans }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:130:                                                        {{ 'admin.stock.move_instruction.csv_download_invoice'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:13:{% set menus = ['product', 'category_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:15:{% block title %}{{ 'admin.product.category_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:52:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:53:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:56:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:69:                        <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.category.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:71:                    <div id="ex-csv_category-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:73:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:75:                                <form id="upload-form" method="post" action="{{ url('admin_product_category_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:79:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:80:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:97:                                <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.category.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:100:                                <a href="{{ url('admin_product_csv_template', {'type': 'category'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:104:                    <div id="ex-csv_category-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_new_destination_csv_modal.twig:1:{% include '@admin/Stock/stock_split_destination_csv_modal.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list_line_items.twig:2:    <p class="text-danger mb-2">{{ 'admin.stock.approval_list.line_items.over_display_limit_csv_hint'|trans({'%max%': modalLineItemsDisplayMax}) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:5:{% block title %}{{ 'admin.deck.csv_upload_title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:12:        .csv-format-card > .card-header {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:15:        .csv-format-table th:first-child,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:16:        .csv-format-table td:first-child {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:19:        .csv-format-table th:last-child,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:20:        .csv-format-table td:last-child {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:23:        .csv-format-table thead th {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:29:        .csv-format-scroll {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:33:        .csv-format-table {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:36:        .csv-format-table > tbody > tr > td {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:49:            var $fileInput = $('#admin_csv_import_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:58:                    $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:83:                        <span>{{ 'admin.deck.csv_upload_header'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:87:                            <div class="col-2"><span>{{ 'admin.common.csv_file_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:89:                                <form id="upload-form" method="post" action="{{ url('admin_deck_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:93:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:94:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,.csv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:97:                                    <button class="btn btn-ec-conversion" id="upload-button" type="submit" disabled>{{ 'admin.common.csv_upload'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:103:                <div class="card rounded border-0 mb-4 csv-format-card">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:105:                        <span>{{ 'admin.deck.csv_format_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:108:                        <div class="csv-format-scroll">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:109:                            <table class="table table-bordered csv-format-table mb-0">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:1:- mtb_authority.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:2:- mtb_country.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:3:- mtb_csv_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:4:- mtb_customer_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:5:- mtb_customer_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:6:- mtb_device_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:7:- mtb_product_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:8:- mtb_job.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:9:- mtb_login_history_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:10:- mtb_order_item_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:11:- mtb_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:12:- mtb_order_status_color.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:13:- mtb_page_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:14:- mtb_pref.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:15:- mtb_product_list_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:16:- mtb_product_list_order_by.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:17:- mtb_sale_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:18:- mtb_sex.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:19:- mtb_shipping_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:20:- mtb_tax_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:21:- mtb_tax_display_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:22:- mtb_work.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:23:- dtb_member.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:24:- dtb_tax_rule.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:25:- dtb_block.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:26:- dtb_page.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:27:- dtb_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:28:- dtb_page_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:29:- dtb_block_position.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:30:- dtb_authority_role.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:31:- dtb_base_info.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:32:- dtb_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:33:- dtb_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:34:- dtb_class_name.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:35:- dtb_class_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:36:- dtb_csv.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:37:- dtb_customer.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:38:- dtb_customer_address.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:39:- dtb_customer_favorite_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:40:- dtb_delivery.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:41:- dtb_delivery_duration.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:42:- dtb_delivery_fee.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:43:- dtb_delivery_time.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:44:- dtb_mail_history.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:45:- dtb_mail_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:46:- dtb_news.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:47:- dtb_order.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:48:- dtb_payment.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:49:- dtb_payment_option.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:50:- dtb_plugin.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:51:- dtb_plugin_event_handler.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:52:- dtb_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:53:- dtb_product_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:54:- dtb_product_class.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:55:- dtb_product_image.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:56:- dtb_product_stock.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:57:- dtb_product_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:58:- dtb_order_item.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:59:- dtb_shipping.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:60:- dtb_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:61:- dtb_tradelaw.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:598:                                            <button class="btn btn-ec-regular" type="submit" formaction="{{ url('admin_stock_history_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:600:                                            <button class="btn btn-ec-regular" type="submit" formaction="{{ url('admin_stock_history_disposal_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:602:                                                <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:178:                                    {{ 'admin.product.inventory_plan.csv_import_submit'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:184:                                    {{ 'admin.product.inventory_plan.quantity_csv_import_submit'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:190:                                    {{ 'admin.product.csv.export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:267:    {% include '@admin/Stock/inventory_plan_csv_modal.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:270:            modal_title: 'admin.product.inventory_plan.csv_import_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:271:            form_id: 'form-inventory-plan-product-csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:273:            file_input_id: 'inventory-plan-product-csv-file',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:275:            submit_label: 'admin.product.inventory_plan.csv_import_submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:276:            csv_format_type: 'product',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:277:            csvImportMaxRecords: csvImportMaxRecords,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:279:        {% include '@admin/Stock/inventory_plan_csv_modal.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:282:            modal_title: 'admin.product.inventory_plan.quantity_csv_import_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:283:            form_id: 'form-inventory-plan-quantity-csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:285:            file_input_id: 'inventory-plan-quantity-csv-file',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:287:            submit_label: 'admin.product.inventory_plan.quantity_csv_import_submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:288:            csv_format_type: 'quantity',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:289:            csvImportMaxRecords: csvImportMaxRecords,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:208:                if (action.indexOf('csv_export') !== -1) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:209:                    $('#bulk_form_token').val($('#csv_export_token_value').val());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:226:            <a href="{{ url('admin_deck_csv_import') }}" class="btn btn-ec-conversion">{{ 'admin.deck.csv_import'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:401:        <input type="hidden" id="csv_export_token_value" value="{{ csrf_token('admin_deck_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:404:                <button type="submit" id="csv_export" class="btn btn-ec-conversion" formaction="{{ url('admin_deck_csv_export') }}">{{ 'admin.deck.csv_export'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:245:                            <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:248:                           href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_CATEGORY') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:250:                            <span>{{ 'admin.setting.shop.csv_setting'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:3:{% set menus = ['product_stock', 'stock_change_csv_list'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:5:{% block title %}{{ 'admin.stock.change_csv.title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:6:{% block sub_title %}{{ 'admin.stock.change_csv.subtitle'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:13:                $('#admin_stock_change_csv_list_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:14:                $('#admin_stock_change_csv_list_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:17:                        $('#admin_stock_change_csv_list_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:29:            const $membersSelect = $('#admin_stock_change_csv_list_approval_notification_target_members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:30:            const membersApiUrl = '{{ url('admin_stock_change_csv_members') }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:57:            const $baseInfoSelect = $('#admin_stock_change_csv_list_change_base_info');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:69:        const PRE_VALIDATE_URL = '{{ url('admin_stock_change_csv_pre_validate') }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:77:            const container = document.getElementById('csv-validate-errors');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:78:            const list = document.getElementById('csv-validate-error-list');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:90:            document.getElementById('csv-validate-errors').classList.add('d-none');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:132:            const fileInput = document.getElementById('admin_stock_change_csv_list_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:228:                const baseInfoEl = document.getElementById('admin_stock_change_csv_list_change_base_info');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:230:                const stockLocationEl = document.querySelector('input[name="admin_stock_change_csv_list[change_stock_location_id]"]:checked');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:313:                <div id="csv-validate-errors" class="alert alert-danger d-none mb-3">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:315:                    <ul id="csv-validate-error-list" class="mb-0 ps-3"></ul>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:320:                        <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'admin.stock.change_csv.file_upload_title'|trans }}"><span>{{ 'admin.stock.change_csv.file_upload_title'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:323:                        <form id="upload-form" method="post" action="{{ url('admin_stock_change_csv_upload') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:330:                                            <label class="fw">{{ 'admin.stock.change_csv.base_info_name'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:344:                                            <label class="fw">{{ 'admin.stock.change_csv.stock_location'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:360:                                            <label class="fw">{{ 'admin.stock.change_csv.change_type_detail'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:374:                                            <label class="fw">{{ 'admin.stock.change_csv.stock_change_reason'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:401:                                <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:405:                                        <span id="admin_stock_change_csv_list_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:406:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:420:                                <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'admin.stock.change_csv.file_format_title'|trans }}"><span>{{ 'admin.stock.change_csv.file_format_title'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:423:                                <a href="{{ url('admin_stock_change_csv_template') }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:427:                    <div id="ex-stock_change_csv-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:455:                                        <option {% if pageMax.name == page_count %}selected=""{% endif %} value="{{ path('admin_stock_change_csv_page_count', {'page_no': 1, 'page_count': pageMax.name}) }}">{{ 'admin.common.count'|trans({ '%count%': pageMax.name }) }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:466:                                <span class="card-title align-middle fw-bold">{{ 'admin.stock.change_csv.history_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:475:                                        <th class="pt-2 pb-2 ps-3">{{ 'admin.stock.change_csv.history_approval_status'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:476:                                        <th class="pt-2 pb-2">{{ 'admin.stock.change_csv.history_filename'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:477:                                        <th class="pt-2 pb-2">{{ 'admin.stock.change_csv.history_store'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:478:                                        <th class="pt-2 pb-2">{{ 'admin.stock.change_csv.history_class_count'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:479:                                        <th class="pt-2 pb-2">{{ 'admin.stock.change_csv.history_total_change_quantity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:480:                                        <th class="pt-2 pb-2">{{ 'admin.stock.change_csv.history_total_cost_change'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:481:                                        <th class="pt-2 pb-2">{{ 'admin.stock.change_csv.history_type_detail'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:482:                                        <th class="pt-2 pb-2">{{ 'admin.stock.change_csv.history_registration_date'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:483:                                        <th class="pt-2 pb-2">{{ 'admin.stock.change_csv.history_registration_member'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:484:                                        <th class="pt-2 pb-2">{{ 'admin.stock.change_csv.history_approval_date'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:485:                                        <th class="pt-2 pb-2 pe-3">{{ 'admin.stock.change_csv.history_approval_member'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:493:                                                {{ 'admin.stock.change_csv.history_approval_approved'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:495:                                                {{ 'admin.stock.change_csv.history_approval_upapproved'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:517:                                                {{ 'admin.stock.change_csv.history_approval_waiting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:527:                                    {% include "@admin/pager.twig" with { 'pages' : pagination.paginationData, 'routes' : 'admin_stock_change_csv_page' } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:4:{% if join_source_csv_modal_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:5:    {% set jm_id = join_source_csv_modal_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:9:{% if join_source_csv_modal_label_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:10:    {% set jm_label_id = join_source_csv_modal_label_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:14:{% if join_source_csv_form_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:15:    {% set jm_form_id = join_source_csv_form_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:17:    {% set jm_form_id = 'form-join-new-source-csv' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:19:{% if join_source_csv_file_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:20:    {% set jm_file_id = join_source_csv_file_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:22:    {% set jm_file_id = 'join-new-source-csv-file' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:24:{% if join_source_csv_submit_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:25:    {% set jm_submit_id = join_source_csv_submit_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:27:    {% set jm_submit_id = 'btn-join-new-source-csv-submit' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:29:{% if join_source_csv_error_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:30:    {% set jm_err_id = join_source_csv_error_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:32:    {% set jm_err_id = 'join-new-source-csv-error' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:34:{% if join_source_csv_upload_url is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:35:    {% set jm_upload = join_source_csv_upload_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:37:    {% set jm_upload = url('admin_stock_join_new_source_csv_upload', { productStockId: ProductStock.id }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:39:{% if join_source_csv_template_url is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:40:    {% set jm_template = join_source_csv_template_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:42:    {% set jm_template = url('admin_stock_join_new_source_csv_template') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:44:{% if join_source_csv_csrf is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:45:    {% set jm_csrf = join_source_csv_csrf %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:47:    {% set jm_csrf = csrf_token('stock_join_new_source_csv') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:49:{% set jm_reload = join_source_csv_reload|default(false) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:55:                <h5 class="modal-title fw-bold" id="{{ jm_label_id }}">{{ 'admin.stock.join.new_source_csv_modal.title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:59:                <p class="text-muted small mb-3">{{ 'admin.stock.join.new_source_csv_modal.note'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:60:                <form id="{{ jm_form_id }}" method="post" action="{{ jm_upload }}" enctype="multipart/form-data" data-join-csv-reload="{{ jm_reload ? '1' : '0' }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:63:                        <label class="form-label fw">{{ 'admin.stock.join.new_source_csv_modal.csv_file'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:66:                            <span class="js-join-csv-file-name text-muted small">{{ 'admin.stock.join.new_source_csv_modal.no_file_selected'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:67:                            <input type="file" name="import_file" id="{{ jm_file_id }}" class="d-none" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:71:                        <button type="submit" class="btn btn-ec-conversion" id="{{ jm_submit_id }}">{{ 'admin.stock.join.new_source_csv_modal.product_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:76:                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:77:                    <a href="{{ jm_template }}" class="btn btn-ec-regular">{{ 'admin.stock.join.new_source_csv_modal.template_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:82:                            <td class="table-light w-25">{{ 'admin.stock.join.new_source_csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:83:                            <td class="text-muted small">{{ 'admin.stock.join.new_source_csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:86:                            <td class="table-light">{{ 'admin.stock.join.new_source_csv_modal.format_join_qty'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:87:                            <td class="text-muted small">{{ 'admin.stock.join.new_source_csv_modal.format_join_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:98:                    const nameEl = document.querySelector('#{{ jm_id }} .js-join-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:10:    <form id="form-stock-split-csv-upload" method="post" action="{{ split_csv_list_import_url|default(url('admin_stock_split_join_list_split_csv_import')) }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:15:                <label class="form-label fw">{{ 'admin.stock.split_csv_modal.store'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:16:                {{ form_widget(form.store, {'attr': {'class': 'form-select', 'placeholder': 'admin.stock.split_csv_modal.store_placeholder'|trans}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:20:                <span class="form-label fw d-block">{{ 'admin.stock.split_csv_modal.inventory_category'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:33:                        {{ form_widget(form.approval_department, { attr: { class: 'form-select js-split-csv-approval-dept' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:39:                        {{ form_widget(form.approval_notification_target_members, { attr: { class: 'form-select js-split-csv-approval-members' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:47:                <label class="form-label fw">{{ 'admin.stock.split_csv_modal.csv_file'|trans }}（{{ 'admin.stock.split_csv_modal.csv_file_limit'|trans }}）</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:49:                    <span class="btn btn-ec-regular js-split-csv-file-btn">{{ 'admin.common.file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:50:                    <span class="js-csv-file-name text-muted small">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:51:                    {{ form_widget(form.import_file, {'attr': {'class': 'd-none', 'accept': 'text/csv'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:57:                {% if split_csv_list_import_url is defined and split_csv_list_import_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:58:                    <button type="submit" class="btn btn-ec-conversion" id="btn-split-csv-import">{{ 'admin.stock.split_join.list_csv_import_submit'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:60:                    <button type="submit" class="btn btn-ec-conversion" id="btn-split-csv-register">{{ 'admin.stock.split_csv_modal.register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:67:        <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:68:        <a href="{{ url('admin_stock_split_csv_template') }}" class="btn btn-ec-regular">{{ 'admin.stock.split_csv_modal.template_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:75:                <td class="table-light w-25">{{ 'admin.stock.split_csv_modal.format_source_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:76:                <td class="text-muted small">{{ 'admin.stock.split_csv_modal.format_source_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:79:                <td class="table-light">{{ 'admin.stock.split_csv_modal.format_split_quantity'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:80:                <td class="text-muted small">{{ 'admin.stock.split_csv_modal.format_split_quantity_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:83:                <td class="table-light">{{ 'admin.stock.split_csv_modal.format_target_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:84:                <td class="text-muted small">{{ 'admin.stock.split_csv_modal.format_target_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:87:                <td class="table-light">{{ 'admin.stock.split_csv_modal.format_target_stock'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:88:                <td class="text-muted small">{{ 'admin.stock.split_csv_modal.format_target_stock_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:96:    $('.js-split-csv-file-btn').on('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:101:        $(this).siblings('.js-csv-file-name').text(name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:104:    var $membersSelect = $('.js-split-csv-approval-members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:111:    $('.js-split-csv-approval-dept').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:3:  オプション: split_destination_csv_modal_id, split_destination_csv_upload_url, split_destination_csv_template_url,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:4:  split_destination_csv_csrf, split_destination_csv_reload（編集時 true でアップロード成功後にリロード）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:6:{% if split_destination_csv_modal_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:7:    {% set sdp_modal_id = split_destination_csv_modal_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:11:{% if split_destination_csv_modal_label_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:12:    {% set sdp_label_id = split_destination_csv_modal_label_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:16:{% if split_destination_csv_form_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:17:    {% set sdp_form_id = split_destination_csv_form_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:19:    {% set sdp_form_id = 'form-split-new-destination-csv' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:21:{% if split_destination_csv_file_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:22:    {% set sdp_file_id = split_destination_csv_file_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:24:    {% set sdp_file_id = 'split-new-destination-csv-file' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:26:{% if split_destination_csv_submit_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:27:    {% set sdp_submit_id = split_destination_csv_submit_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:29:    {% set sdp_submit_id = 'btn-split-new-destination-csv-submit' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:31:{% if split_destination_csv_error_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:32:    {% set sdp_err_id = split_destination_csv_error_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:34:    {% set sdp_err_id = 'split-new-destination-csv-error' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:36:{% if split_destination_csv_upload_url is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:37:    {% set sdp_upload = split_destination_csv_upload_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:39:    {% set sdp_upload = url('admin_stock_split_new_destination_csv_upload', { productStockId: ProductStock.id }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:41:{% if split_destination_csv_template_url is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:42:    {% set sdp_template = split_destination_csv_template_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:44:    {% set sdp_template = url('admin_stock_split_new_destination_csv_template') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:46:{% if split_destination_csv_csrf is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:47:    {% set sdp_csrf = split_destination_csv_csrf %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:49:    {% set sdp_csrf = csrf_token('stock_split_new_destination_csv') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:51:{% set sdp_reload = split_destination_csv_reload|default(false) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:57:                <h5 class="modal-title fw-bold" id="{{ sdp_label_id }}">{{ 'admin.stock.split.new_destination_csv_modal.title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:61:                <p class="text-muted small mb-3">{{ 'admin.stock.split.new_destination_csv_modal.note'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:62:                <form id="{{ sdp_form_id }}" method="post" action="{{ sdp_upload }}" enctype="multipart/form-data" data-split-csv-reload="{{ sdp_reload ? '1' : '0' }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:65:                        <label class="form-label fw">{{ 'admin.stock.split.new_destination_csv_modal.csv_file'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:68:                            <span class="js-split-csv-file-name text-muted small">{{ 'admin.stock.split.new_destination_csv_modal.no_file_selected'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:69:                            <input type="file" name="import_file" id="{{ sdp_file_id }}" class="d-none" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:73:                        <button type="submit" class="btn btn-ec-conversion" id="{{ sdp_submit_id }}">{{ 'admin.stock.split.new_destination_csv_modal.product_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:78:                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:79:                    <a href="{{ sdp_template }}" class="btn btn-ec-regular">{{ 'admin.stock.split.new_destination_csv_modal.template_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:84:                            <td class="table-light w-25">{{ 'admin.stock.split.new_destination_csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:85:                            <td class="text-muted small">{{ 'admin.stock.split.new_destination_csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:88:                            <td class="table-light">{{ 'admin.stock.split.new_destination_csv_modal.format_destination_qty'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:89:                            <td class="text-muted small">{{ 'admin.stock.split.new_destination_csv_modal.format_destination_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:100:                    const nameEl = document.querySelector('#{{ sdp_modal_id }} .js-split-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:95:            const $differentialCsvForm = $('#form-move-differential-csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:96:            const $differentialCsvErr = $('#move-differential-csv-error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:174:            $('#btn-move-differential-csv-submit').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:436:                                    <a href="{{ url('admin_stock_move_inbound_approval_request_csv_export', { id: StockMoveTransfer.id }) }}" class="btn btn-ec-conversion me-2">{{ 'admin.stock.move.csv_output'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:437:                                    <button type="button" class="btn btn-ec-conversion me-2" data-bs-toggle="modal" data-bs-target="#moveDifferentialCsvModal">{{ 'admin.stock.move.differential_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:629:                                <h5 class="modal-title fw-bold" id="moveDifferentialCsvModalLabel">{{ 'admin.stock.move.differential_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:633:                                <form id="form-move-differential-csv"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:635:                                      action="{{ url('admin_stock_move_inbound_approval_request_differential_csv_import', { id: StockMoveTransfer.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:637:                                    <input type="hidden" name="_token" value="{{ csrf_token('stock_move_differential_csv') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:638:                                    <p class="text-muted small mb-3">{{ 'admin.stock.move.differential_csv_modal.note'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:640:                                        <label class="form-label fw">{{ 'admin.stock.move.differential_csv_modal.csv_file'|trans }} ({{ 'admin.stock.move.differential_csv_modal.csv_file_limit'|trans }})<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:642:                                            <input type="file" name="import_file" id="move-differential-csv-file" class="form-control form-control-sm" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:646:                                        <button type="button" class="btn btn-ec-conversion" id="btn-move-differential-csv-submit">{{ 'admin.stock.move.differential_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:651:                                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:656:                                            <td class="table-light w-25">{{ 'admin.stock.move.differential_csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:657:                                            <td class="text-muted small">{{ 'admin.stock.move.differential_csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:660:                                            <td class="table-light">{{ 'admin.stock.move.differential_csv_modal.format_product_name'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:661:                                            <td class="text-muted small">{{ 'admin.stock.move.differential_csv_modal.format_product_name_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:664:                                            <td class="table-light">{{ 'admin.stock.move.differential_csv_modal.format_actual_move_qty'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:665:                                            <td class="text-muted small">{{ 'admin.stock.move.differential_csv_modal.format_actual_move_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:668:                                            <td class="table-light">{{ 'admin.stock.move.differential_csv_modal.format_difference_qty'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:669:                                            <td class="text-muted small">{{ 'admin.stock.move.differential_csv_modal.format_difference_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:673:                                <p class="text-danger small mt-2 mb-0" id="move-differential-csv-error" style="display:none;"></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:113:            const $shortageCsvForm = $('#form-move-shortage-csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:114:            const $shortageCsvErr = $('#move-shortage-csv-error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:371:                                    <a href="{{ url('admin_stock_move_outbound_approval_request_csv_export', { id: StockMoveTransfer.id }) }}" class="btn btn-ec-conversion me-2">{{ 'admin.stock.move.csv_output'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:372:                                    <button type="button" class="btn btn-ec-conversion me-2" data-bs-toggle="modal" data-bs-target="#moveShortageCsvModal">{{ 'admin.stock.move.shortage_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:564:                                <h5 class="modal-title fw-bold" id="moveShortageCsvModalLabel">{{ 'admin.stock.move.shortage_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:568:                                <form id="form-move-shortage-csv"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:570:                                      action="{{ url('admin_stock_move_shortage_csv_import', { id: StockMoveTransfer.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:572:                                    <input type="hidden" name="_token" value="{{ csrf_token('stock_move_shortage_csv') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:573:                                    <p class="text-muted small mb-3">{{ 'admin.stock.move.shortage_csv_modal.note'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:575:                                        <label class="form-label fw">{{ 'admin.stock.move.shortage_csv_modal.csv_file'|trans }} ({{ 'admin.stock.move.shortage_csv_modal.csv_file_limit'|trans }})<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:577:                                            <input type="file" name="import_file" id="move-shortage-csv-file" class="form-control form-control-sm" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:581:                                        <button type="submit" class="btn btn-ec-conversion" id="btn-move-shortage-csv-submit">{{ 'admin.stock.move.shortage_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:586:                                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:591:                                            <td class="table-light w-25">{{ 'admin.stock.move.shortage_csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:592:                                            <td class="text-muted small">{{ 'admin.stock.move.shortage_csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:595:                                            <td class="table-light">{{ 'admin.stock.move.shortage_csv_modal.format_product_name'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:596:                                            <td class="text-muted small">{{ 'admin.stock.move.shortage_csv_modal.format_product_name_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:599:                                            <td class="table-light">{{ 'admin.stock.move.shortage_csv_modal.format_move_qty'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:600:                                            <td class="text-muted small">{{ 'admin.stock.move.shortage_csv_modal.format_move_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:603:                                            <td class="table-light">{{ 'admin.stock.move.shortage_csv_modal.format_shortage_qty'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:604:                                            <td class="text-muted small">{{ 'admin.stock.move.shortage_csv_modal.format_shortage_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:608:                                <p class="text-danger small mt-2 mb-0" id="move-shortage-csv-error" style="display:none;"></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:56:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:82:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:83:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:90:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:93:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:96:        $filename = 'stock_list_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:120:                $this->translator->trans('admin.csv.error.data.not_registered'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:135:                $this->translator->trans('admin.csv.error.data.not_registered'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:148:                $this->translator->trans('admin.csv.error.data.not_registered'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:161:                $this->translator->trans('admin.deck.csv.error.format_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:173:                $this->translator->trans('admin.deck.csv.error.format_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:184:                $this->translator->trans('admin.deck.csv.error.format_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:197:                    $this->translator->trans('admin.csv.error.data.require'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:198:                    $this->translator->trans('admin.deck.csv.commander'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:207:                    $this->translator->trans('admin.csv.error.data.not_registered'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:208:                    $this->translator->trans('admin.deck.csv.commander'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:223:                    $this->translator->trans('admin.deck.csv.error.deck_not_found'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:233:                    $this->translator->trans('admin.deck.csv.error.deck_type_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:480:                    $this->translator->trans('admin.deck.csv.error.format_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:9:    <form id="form-stock-join-csv-upload" method="post" action="{{ join_csv_list_import_url|default(url('admin_stock_split_join_list_join_csv_import')) }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:13:                <label class="form-label fw">{{ 'admin.stock.join_csv_modal.store'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:14:                {{ form_widget(form.store, {'attr': {'class': 'form-select', 'placeholder': 'admin.stock.join_csv_modal.store_placeholder'|trans}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:18:                <span class="form-label fw d-block">{{ 'admin.stock.join_csv_modal.inventory_category'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:23:                <label class="form-label fw">{{ 'admin.stock.join_csv_modal.csv_file'|trans }}（{{ 'admin.stock.join_csv_modal.csv_file_limit'|trans }}）<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:25:                    <span class="btn btn-ec-regular js-join-csv-file-btn">{{ 'admin.common.file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:26:                    <span class="js-csv-file-name text-muted small">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:27:                    {{ form_widget(form.import_file, {'attr': {'class': 'd-none', 'accept': 'text/csv'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:32:                {% if join_csv_list_import_url is defined and join_csv_list_import_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:33:                    <button type="submit" class="btn btn-ec-conversion" id="btn-join-csv-import">{{ 'admin.stock.split_join.list_csv_import_submit'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:35:                    <button type="submit" class="btn btn-ec-conversion" id="btn-join-csv-register">{{ 'admin.stock.join_csv_modal.register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:41:        <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:42:        <a href="{{ url('admin_stock_join_csv_template') }}" class="btn btn-ec-regular">{{ 'admin.stock.join_csv_modal.template_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:48:                <td class="table-light w-25">{{ 'admin.stock.join_csv_modal.format_destination_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:49:                <td class="text-muted small">{{ 'admin.stock.join_csv_modal.format_destination_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:52:                <td class="table-light">{{ 'admin.stock.join_csv_modal.format_join_quantity'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:53:                <td class="text-muted small">{{ 'admin.stock.join_csv_modal.format_join_quantity_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:56:                <td class="table-light">{{ 'admin.stock.join_csv_modal.format_source_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:57:                <td class="text-muted small">{{ 'admin.stock.join_csv_modal.format_source_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:60:                <td class="table-light">{{ 'admin.stock.join_csv_modal.format_source_stock_category'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:61:                <td class="text-muted small">{{ 'admin.stock.join_csv_modal.format_source_stock_category_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:64:                <td class="table-light">{{ 'admin.stock.join_csv_modal.format_source_stock_quantity'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:65:                <td class="text-muted small">{{ 'admin.stock.join_csv_modal.format_source_stock_quantity_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:72:    $('.js-join-csv-file-btn').on('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:75:    $(document).on('change', '#form-stock-join-csv-upload input[type="file"]', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:77:        $(this).siblings('.js-csv-file-name').text(name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:65:                        <span class="fw-bold">{{ 'admin.stock.move_instruction.csv_registration'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:68:                        <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#csvRecordRegistrationModal">{{ 'admin.stock.move_instruction.csv_registration_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:160:                                    <a href="{{ url('admin_stock_move_instruction_csv_download_record') }}" class="btn btn-ec-conversion">{{ 'admin.stock.move_instruction.csv_download_record'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:161:                                    <button type="button" id="stockMoveInstructionLabelsExport" class="btn btn-ec-conversion">{{ 'admin.stock.move_instruction.csv_download_invoice'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:276:                <div class="modal fade" id="csvRecordRegistrationModal" tabindex="-1" role="dialog" aria-labelledby="csvRecordRegistrationModalLabel" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:280:                                <h5 class="modal-title fw-bold" id="csvRecordRegistrationModalLabel">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:281:                                    {{ 'admin.stock.move_instruction.csv_registration_button'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:282:                                    <span class="fw-normal fs-6 text-muted">{{ 'admin.stock.move_instruction.csv_registration_modal_overwrite_note'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:287:                            <form method="post" action="{{ url('admin_stock_move_instruction_csv_tracking') }}" enctype="multipart/form-data" id="csvRecordRegistrationForm">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:290:                                    <p class="text-muted small mb-3">{{ 'admin.stock.move_instruction.csv_registration_modal_lead'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:292:                                        <label class="col-form-label col-2">{{ 'admin.common.csv_select'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:294:                                            <p class="text-muted small mb-2">{{ 'admin.stock.move_instruction.csv_registration_file_limit'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:296:                                                <span id="csvRecordFileSelect" class="btn btn-ec-regular me-2">{{ 'admin.common.file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:297:                                                <span id="csvRecordFileName">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:299:                                            <input type="file" name="csv_file" id="csvRecordImportFile" accept="text/csv,text/tsv,.csv,.tsv" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:303:                                        <h6 class="fw-bold mb-2">{{ 'admin.stock.move_instruction.csv_format_title'|trans }}</h6>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:314:                                                        <td class="table-light fw-bold"><span class="badge bg-primary me-1">{{ 'admin.common.required'|trans }}</span>{{ 'admin.stock.move_instruction.csv_format_instruction_id'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:315:                                                        <td>{{ 'admin.stock.move_instruction.csv_format_instruction_id_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:318:                                                        <td class="table-light fw-bold">{{ 'admin.stock.move_instruction.csv_format_move_from_shop'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:319:                                                        <td>{{ 'admin.stock.move_instruction.csv_format_move_from_shop_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:322:                                                        <td class="table-light fw-bold">{{ 'admin.stock.move_instruction.csv_format_move_to_shop'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:323:                                                        <td>{{ 'admin.stock.move_instruction.csv_format_move_to_shop_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:326:                                                        <td class="table-light fw-bold"><span class="badge bg-primary me-1">{{ 'admin.common.required'|trans }}</span>{{ 'admin.stock.move_instruction.csv_format_tracking_no'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:327:                                                        <td>{{ 'admin.stock.move_instruction.csv_format_tracking_no_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:336:                                    <button type="submit" class="btn btn-ec-conversion" id="csvRecordUploadButton" disabled>{{ 'admin.stock.move_instruction.tracking_register_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:343:                <form id="form_stock_move_instruction_label_csv" method="post" action="{{ url('admin_stock_move_instruction_labels_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:375:            $('#csvRecordFileSelect').on('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:376:                $('#csvRecordImportFile').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:378:            $('#csvRecordImportFile').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:381:                    $('#csvRecordFileName').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:382:                    $('#csvRecordUploadButton').prop('disabled', false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:384:                    $('#csvRecordFileName').text("{{ 'admin.common.file_select_empty'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:385:                    $('#csvRecordUploadButton').prop('disabled', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:388:            $('#csvRecordRegistrationModal').on('hidden.bs.modal', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:389:                $('#csvRecordImportFile').val('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:390:                $('#csvRecordFileName').text("{{ 'admin.common.file_select_empty'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:391:                $('#csvRecordUploadButton').prop('disabled', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:411:                    alert("{{ 'admin.stock.move_instruction.csv_invoice_select_rows'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:416:                const $form = $('#form_stock_move_instruction_label_csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:25:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:83:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:85:            $this->csvExportService->fputcsv(array_values(self::CSV_HEADER));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:93:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:96:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:100:        $filename = 'otc_buy_order_history_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:3:  オプション: csv_format_type = 'product' | 'quantity'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:5:{% set ip_csv_format_type = csv_format_type|default('product') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:15:                <p class="text-muted small mb-3">{{ 'admin.product.inventory_plan.csv_import_limit'|trans({'%max%': csvImportMaxRecords|number_format}) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:19:                        <label class="form-label fw">{{ 'admin.product.inventory_plan.csv_modal.csv_file'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:21:                            <span class="btn btn-ec-regular js-ip-csv-file-btn">{{ 'admin.common.file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:22:                            <span class="js-ip-csv-file-name text-muted small">{{ 'admin.product.inventory_plan.csv_modal.no_file_selected'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:23:                            <input type="file" name="{{ form_name }}[import_file]" id="{{ file_input_id }}" class="d-none" accept=".csv,text/csv,.tsv,text/tsv">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:32:                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:37:                            <td class="table-light w-25">{{ 'admin.product.inventory_plan.csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:38:                            <td class="text-muted small">{{ 'admin.product.inventory_plan.csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:40:                        {% if ip_csv_format_type == 'quantity' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:42:                                <td class="table-light">{{ 'admin.product.inventory_plan.csv_modal.format_actual_stock'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:43:                                <td class="text-muted small">{{ 'admin.product.inventory_plan.csv_modal.format_actual_stock_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:61:    const btn = modal.querySelector('.js-ip-csv-file-btn');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:63:    const nameEl = modal.querySelector('.js-ip-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:64:    const emptyLabel = {{ 'admin.product.inventory_plan.csv_modal.no_file_selected'|trans|json_encode|raw }};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:251:                $this->flashSuccesses[] = trans('admin.stock.split_join.list_csv_split_import_done', ['%count%' => (string) $successCount]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:24: * ネット買取 棚戻しリストCSV（店頭の otc_buy_order_restock_list_csv と同一列構成）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:29:     * 店頭買取 OtcBuyOrderCsvExportService::CSV_TYPES['otc_buy_order_restock_list_csv'] と揃える
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:45:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:62:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:63:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:74:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:77:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:82:        $filename = $prefix.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:5:<form id="form-join-shortage-csv"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:7:      action="{{ url('admin_stock_join_shortage_csv_import', { id: StockSplitJoin.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:9:    <input type="hidden" name="_token" value="{{ csrf_token('stock_join_shortage_csv') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:11:        <label class="form-label fw">{{ 'admin.stock.join.shortage_csv_modal.csv_file'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:13:            <span class="btn btn-ec-regular js-shortage-csv-file-btn">{{ 'admin.common.file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:14:            <span class="js-shortage-csv-file-name text-muted small">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:15:            <input type="file" name="import_file" id="join-shortage-csv-file" class="d-none" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:19:        <button type="submit" class="btn btn-ec-conversion" id="btn-join-shortage-csv-submit">{{ 'admin.stock.join.shortage_csv_modal.button_label'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:24:    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:25:    <a href="{{ url('admin_stock_join_shortage_csv_export', { id: StockSplitJoin.id }) }}" class="btn btn-ec-regular">{{ 'admin.stock.join.shortage_csv_modal.template_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:30:            <td class="table-light w-25">{{ 'admin.stock.join.new_source_csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:31:            <td class="text-muted small">{{ 'admin.stock.join.shortage_csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:34:            <td class="table-light">{{ 'admin.stock.join.shortage_csv_modal.format_shortage_qty'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:35:            <td class="text-muted small">{{ 'admin.stock.join.shortage_csv_modal.format_shortage_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:39:<p class="text-danger small mt-2 mb-0" id="join-shortage-csv-error" style="display:none;"></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:42:    const btn = document.querySelector('#joinShortageCsvModal .js-shortage-csv-file-btn');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:43:    const input = document.getElementById('join-shortage-csv-file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:44:    const nameEl = document.querySelector('#joinShortageCsvModal .js-shortage-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:16:    #result_list_main__csv_menu .dropdown-menu.show,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:352:                            <div id="result_list_main__csv_menu" class="dropdown d-inline-block">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:354:                                    {{ 'admin.event.entry.csv_download'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:358:                                        <a class="dropdown-item" href="{{ path('admin_event_entry_csv_export') }}">{{ 'admin.event.entry.csv_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:361:                                        <a class="dropdown-item" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_EVENT_APPLICATION') }) }}">{{ 'admin.event.entry.csv_column_settings'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:193:                            <button type="button" class="btn btn-ec-regular" data-bs-toggle="modal" data-bs-target="#joinEditSourceCsvModal">{{ 'admin.stock.join.csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:204:                                <a href="{{ url('admin_stock_join_shortage_csv_export', { id: StockSplitJoin.id }) }}" class="btn btn-ec-conversion">{{ 'admin.stock.move.csv_output'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:205:                                <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#joinShortageCsvModal">{{ 'admin.stock.join.shortage_csv_modal.open_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:513:    {% include '@admin/Stock/stock_join_source_csv_modal.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:514:        join_source_csv_modal_id: 'joinEditSourceCsvModal',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:515:        join_source_csv_modal_label_id: 'joinEditSourceCsvModalLabel',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:516:        join_source_csv_form_id: 'form-join-edit-source-csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:517:        join_source_csv_file_id: 'join-edit-source-csv-file',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:518:        join_source_csv_submit_id: 'btn-join-edit-source-csv-submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:519:        join_source_csv_error_id: 'join-edit-source-csv-error',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:520:        join_source_csv_upload_url: url('admin_stock_join_edit_source_csv_upload', { id: StockSplitJoin.id }),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:521:        join_source_csv_template_url: url('admin_stock_join_new_source_csv_template'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:522:        join_source_csv_csrf: csrf_token('stock_join_edit_source_csv'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:523:        join_source_csv_reload: true,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:538:                    <h5 class="modal-title fw-bold" id="joinShortageCsvModalLabel">{{ 'admin.stock.join.shortage_csv_modal.title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:543:                    {% include '@admin/Stock/stock_join_shortage_csv_modal.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1126:            let joinSrcCsvForm = document.getElementById('form-join-edit-source-csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1127:            let joinSrcCsvFile = document.getElementById('join-edit-source-csv-file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1128:            let joinSrcCsvErr = document.getElementById('join-edit-source-csv-error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1136:                let span = joinSrcCsvModal.querySelector('.js-join-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1138:                    span.textContent = (this.files && this.files.length) ? this.files[0].name : "{{ 'admin.stock.split_csv_modal.no_file_selected'|trans|e('js') }}";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1156:                        if (joinSrcCsvForm.getAttribute('data-join-csv-reload') === '1') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1161:                        let span = joinSrcCsvModal.querySelector('.js-join-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1163:                            span.textContent = "{{ 'admin.stock.split_csv_modal.no_file_selected'|trans|e('js') }}";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1191:            const shortageCsvForm = document.getElementById('form-join-shortage-csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1192:            const shortageCsvFile = document.getElementById('join-shortage-csv-file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1193:            const shortageCsvErr = document.getElementById('join-shortage-csv-error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1199:                const span = shortageCsvModal.querySelector('.js-shortage-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:29:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:46:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:49:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:60:                    $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:63:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:68:        $filename = $prefix.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:96:                $this->translator->trans('admin.stock.move_transfer.barcode_csv_export.not_found', [], 'messages'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:117:                    'admin.stock.move_transfer.barcode_csv_export.not_move_type',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:125:                    'admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:133:                    'admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:139:                    'admin.stock.move_transfer.barcode_csv_export.shop_not_permitted',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:153:                    'admin.stock.move_transfer.barcode_csv_export.id_not_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:162:                'admin.stock.move_transfer.barcode_csv_export.multiple_shops',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:441:                                <a href="{{ path('admin_stock_list_recommend_csv') }}" class="btn btn-ec-conversion btn-sm">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:442:                                    {{ 'admin.stock.list.recommend_csv'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:445:                                <a href="{{ url('admin_stock_list_csv') }}" class="btn btn-ec-conversion btn-sm">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:446:                                    {{ 'admin.stock.list.stock_info_csv'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:450:                                    <select id="stock_csv_pulldown" class="form-select form-select-sm">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:451:                                        <option value="">{{ 'admin.stock.list.custom_csv'|trans }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:453:                                            <option value="{{ url('admin_stock_list_custom_csv', { csvExtensionId: CsvEx.id }) }}">{{ CsvEx.name }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:455:                                        <option value="{{ url('admin_setting_shop_csv_custom', { csvTypeId: constant('Eccube\\Entity\\Master\\CsvType::CSV_TYPE_STOCK') }) }}">{{ 'admin.stock.list.custom_csv_settings'|trans }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:787:        $('#page_count_pulldown, #stock_csv_pulldown').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:173:                    alert("{{ 'admin.stock.move_transfer.barcode_csv_export.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:178:                const $form = $('#form_stock_move_transfer_barcode_csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:199:                    alert("{{ 'admin.stock.move_transfer.return_list_csv_export.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:204:                const $form = $('#form_stock_move_transfer_return_list_csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:225:                    alert("{{ 'admin.stock.move_transfer.return_list_csv_export.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:325:            const $approvalDepartmentSelect = $('#stock_transfer_csv_import_approval_department');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:326:            const $approvalNotificationTargetMembersSelect = $('#stock_transfer_csv_import_approval_notification_target_members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:327:            const $stockTransferTargetBaseSelect = $('#stock_transfer_csv_import_transfer_base_info');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:485:                        <span class="card-title">{{ 'admin.stock.move_transfer.csv_file_registration'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:489:                            <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#stockMoveCsvRegisterModal">{{ 'admin.stock.move_transfer.csv_register_move'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:490:                            <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#stockTransferCsvRegisterModal">{{ 'admin.stock.move_transfer.csv_register_transfer'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:652:                            <button type="button" class="btn btn-ec-conversion" id="stockMoveTransferBarcodeCsvExport">{{ 'admin.stock.move_transfer.action_barcode_csv_export'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:653:                            <a href="{{ path('admin_stock_move_transfer_csv_export') }}" class="btn btn-ec-conversion">{{ 'admin.stock.move_transfer.action_move_transfer_csv_export'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:654:                            <button type="button" class="btn btn-ec-conversion" id="stockMoveTransferReturnListCsvExport">{{ 'admin.stock.move_transfer.action_return_list_csv_export'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:800:    <div class="modal fade stock-move-csv-modal" id="stockMoveCsvRegisterModal" tabindex="-1" aria-labelledby="stockMoveCsvRegisterModalLabel" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:804:                    <h5 class="modal-title fw-bold" id="stockMoveCsvRegisterModalLabel">{{ 'admin.stock.move_transfer.csv_register_move'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:809:                        action: path('admin_stock_move_transfer_move_csv_import'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:831:                                    {{ 'admin.stock.move_transfer.csv_move_modal.move_from_stock_location'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:838:                                    {{ 'admin.stock.move_transfer.csv_move_modal.move_to_stock_location'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:846:                                {{ 'admin.common.csv_select'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:847:                                <span class="text-muted small ms-1">{{ 'admin.stock.move_transfer.csv_move_modal.file_row_limit_hint'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:852:                                {{ form_widget(stockMoveCsvImportForm.import_file, { attr: { class: 'd-none', accept: 'text/csv,.csv,text/plain' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:864:                        <span class="fw-bold">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:865:                        <a class="btn btn-ec-regular" href="{{ path('admin_stock_move_transfer_move_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:873:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_move_modal.col_product_code_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:879:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_move_modal.col_move_quantity_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:892:    <div class="modal fade stock-transfer-csv-modal" id="stockTransferCsvRegisterModal" tabindex="-1" aria-labelledby="stockTransferCsvRegisterModalLabel" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:896:                    <h5 class="modal-title fw-bold" id="stockTransferCsvRegisterModalLabel">{{ 'admin.stock.move_transfer.csv_register_transfer'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:901:                        action: path('admin_stock_move_transfer_transfer_csv_import'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:907:                                    {{ 'admin.stock.move_transfer.csv_transfer_modal.store'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:917:                                    {{ 'admin.stock.move_transfer.csv_transfer_modal.transfer_from_stock_location'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:937:                                    <label class="form-label" for="{{ stockTransferCsvImportForm.approval_notification_target_members.vars.id }}">{{ 'admin.stock.move_transfer.csv_transfer_modal.member'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:944:                                {{ 'admin.common.csv_select'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:945:                                <span class="text-muted small ms-1">{{ 'admin.stock.move_transfer.csv_move_modal.file_row_limit_hint'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:950:                                {{ form_widget(stockTransferCsvImportForm.import_file, { attr: { class: 'd-none', accept: 'text/csv,.csv,text/plain' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:961:                        <span class="fw-bold">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:962:                        <a class="btn btn-ec-regular" href="{{ path('admin_stock_move_transfer_transfer_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:968:                                {{ 'admin.stock.move_transfer.csv_transfer_modal.col_src_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:970:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:974:                                {{ 'admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:976:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:980:                                {{ 'admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:982:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:997:    <form id="form_stock_move_transfer_barcode_csv" method="post" action="{{ url('admin_stock_move_transfer_barcode_csv_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:1000:    <form id="form_stock_move_transfer_return_list_csv" method="post" action="{{ url('admin_stock_move_transfer_return_list_csv_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Form/stock_approval_notification_members_row.html.twig:5:{% block _admin_stock_split_csv_upload_approval_notification_target_members_row %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:35:        private CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:37:        array $csvHeader = [],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:40:        parent::__construct($entityManager, $translator, $eccubeConfig, $csvHeader, $requiredCsvHeader);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:49:            throw new \RuntimeException($this->translator->trans('admin.csv.error.export.not_registered'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:51:        $csvRows = $this->convertExportCsvRows($Products, $this->baseInfoRepository->getMallBaseInfo());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:55:        $response->setCallback(function () use ($csvRows): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:56:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:58:            $this->csvExportService->fputcsv(array_keys($this->csvHeader));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:60:            foreach ($csvRows as $csvRow) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:61:                $this->csvExportService->fputcsv($csvRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:63:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:85:        $csvRows = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:100:                $csvRows[] = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:114:        return $csvRows;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:26:                        <a href="{{ url('admin_stock_split_join_csv_register', { type: 'split' }) }}" class="btn btn-ec-conversion me-2">{{ 'admin.stock.split_join.split_csv_register'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:27:                        <a href="{{ url('admin_stock_split_join_csv_register', { type: 'join' }) }}" class="btn btn-ec-conversion">{{ 'admin.stock.split_join.join_csv_register'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:40:                        <form name="{{ searchForm.vars.name }}" method="post" action="{{ url('admin_stock_split_join_csv_register') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:145:                                                <a href="{{ url('admin_stock_split_join_csv_register') }}" class="btn btn-ec-regular">{{ 'admin.stock.split_join.clear_search'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:5:{% block title %}{{ 'admin.event.entry.bulk_csv_upload_title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:18:            const $fileInput = $('#admin_csv_import_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:27:                    $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:53:                        <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.event.entry.bulk_csv_upload'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:54:                            <span>{{ 'admin.common.csv_upload'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:61:                                <span>{{ 'admin.common.csv_file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:64:                                <form id="upload-form" method="post" action="{{ url('admin_event_entry_bulk_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:68:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:69:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,.csv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:83:                                <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.event.entry.bulk_csv_format'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:84:                                    <span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:89:                                <a id="download-button" class="btn btn-ec-regular" href="{{ url('admin_event_entry_bulk_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:94:                        <p class="text-muted small mb-3">{{ 'admin.event.entry.bulk_csv_format_title'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyMainCard.php:171:    public function isLowPriceBulkAgreementLine(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:45:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:70:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:71:            $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:78:                $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:81:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:84:        $filename = 'stock_split_join_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:22:#[ORM\Table(name: 'dtb_csv_csv_extension')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:41:    #[ORM\JoinColumn(name: 'csv_extension_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:51:    public function setCsvExtension(DtbCsvExtension $csvExtension): DtbCsvCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:53:        $this->CsvExtension = $csvExtension;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:58:    #[ORM\JoinColumn(name: 'csv_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:68:    public function setCsv(Csv $csv): DtbCsvCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvCsvExtension.php:70:        $this->Csv = $csv;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/barcode_replacement_list.twig:11:    <form name="barcode_replacement_list_form" id="barcode_replacement_list_form" method="post" action="{{ url('admin_stock_barcode_replacement_list_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/barcode_replacement_list.twig:39:                                        {{ 'admin.stock.barcode_replacement_list.csv_export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:51:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:67:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:70:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:88:                    $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:91:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:96:        $filename = $prefix.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:54:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:74:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:77:                $this->csvExportService->fputcsv(array_values($header));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:101:                $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:105:        $filename = 'stock_move_transfer_list_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:136:            $this->csvExportService->fputcsv($orderedRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductTag.php:34:         * use csv export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:118:            return ['ok' => false, 'errors' => [trans('admin.stock.split_join.csv_file_not_found')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:124:            $this->eccubeConfig['eccube_csv_import_delimiter'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:125:            $this->eccubeConfig['eccube_csv_import_enclosure']
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:129:            return ['ok' => false, 'errors' => [trans('admin.stock.split_join.csv_header_invalid')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:134:            return ['ok' => false, 'errors' => [trans('admin.csv.error.data.empty')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:145:                return ['ok' => false, 'errors' => [trans('admin.stock.split.csv_column_invalid')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:151:                return ['ok' => false, 'errors' => [trans('admin.common.csv_invalid_required', ['%line%' => $lineNum, '%name%' => '商品コード'])]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:156:                return ['ok' => false, 'errors' => [trans('admin.common.csv_invalid_format_line_name', ['%line%' => $lineNum, '%name%' => '分割先在庫数'])]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:167:                return ['ok' => false, 'errors' => [trans('admin.stock.split_join.csv_product_not_found', ['%line%' => $lineNum, '%code%' => $code])]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:172:                return ['ok' => false, 'errors' => [trans('admin.stock.split.csv_same_as_source', ['%line%' => $lineNum])]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockEditCsv.php:22:#[ORM\Table(name: 'dtb_stock_edit_csv')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:122:        $this->addMessage('admin.csv.error.format.header');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:136:        $this->addMessage('admin.csv.error.format.body', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:148:        $this->addMessage('admin.csv.error.data.empty');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:163:        $this->addMessage('admin.csv.error.product.not_exists', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:178:        $this->addMessage('admin.csv.error.data.require', $columnName, $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:193:        $this->addMessage('admin.csv.error.product.invalid', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:223:        $this->addMessage('admin.csv.error.product.max_length', $rowNumber, $columnName, $maxLength);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:239:        $this->addMessage('admin.csv.error.data.string_max_length', $rowNumber, $columnName, $maxLength);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:254:        $this->addMessage('admin.csv.error.product.over_zero', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:270:        $this->addMessage('admin.csv.error.data.not_registered', $columnName, $value, $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:285:        $this->addMessage('admin.csv.error.product.not_exists', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:300:        $this->addMessage('admin.csv.error.product.product_code_duplicated', $rowNumber, $value);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:315:        $this->addMessage('admin.csv.error.product.filename', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:330:            'admin.csv.error.product.new_product_cannot_be_deleted',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:347:            'admin.csv.error.product.non_unique_card_detail_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:365:            'admin.csv.error.product.product_with_card_detail_exists',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:383:            'admin.csv.error.product.product_update_lock_timeout',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:401:            'admin.csv.error.product.new_product_be_duplicate',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:420:            'admin.csv.error.product.new_product_smaregi_product_code_duplicate',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:439:        $this->addMessage('admin.csv.error.data.out_of_stock', $rowNumber, $columnName, $value);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:454:        $this->addMessage('admin.csv.error.product.invalid', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:469:        $this->addMessage('admin.csv.error.storage_code.not_exists', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:484:        $this->addMessage('admin.csv.error.product.abolished_status_with_stock', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:499:        $this->addMessage('admin.csv.error.product.smaregi_alignment_flg_off_with_stock', $rowNumber, $columnName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:513:        $this->addMessage('admin.csv.error.shelf_number.name_duplicate', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:27:    #[ORM\Table(name: 'dtb_csv')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:73:        #[ORM\JoinColumn(name: 'csv_type_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:235:         * Set csvType.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:237:        public function setCsvType(?CsvType $csvType = null): Csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:239:            $this->CsvType = $csvType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:245:         * Get csvType.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:291:        public function addCsvCsvExtension(DtbCsvCsvExtension $csvCsvExtension): Csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:293:            $this->CsvCsvExtensions[] = $csvCsvExtension;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:298:        public function removeCsvCsvExtension(DtbCsvCsvExtension $csvCsvExtension): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:300:            return $this->CsvCsvExtensions->removeElement($csvCsvExtension);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:304:         * @param Collection<int, DtbCsvCsvExtension> $csvCsvExtensions
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:306:        public function setCsvCsvExtensions(Collection $csvCsvExtensions): Csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Csv.php:308:            $this->CsvCsvExtensions = $csvCsvExtensions;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvImportHistory.php:23:#[ORM\Table(name: 'dtb_csv_import_history')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvImportHistory.php:38:    #[ORM\JoinColumn(name: 'csv_import_type_id', nullable: false, referencedColumnName: 'id', options: ['comment' => '　'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:124:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_instruction_not_found', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:133:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_instruction_not_found', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:146:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_shop_mismatch_from', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:153:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_shop_mismatch_to', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:163:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_tracking_no_empty', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:36:        private readonly CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:42:    public function export(DtbCsvExtension $csvExtension, StockListSearchInput $input): StreamedResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:46:        $csvExtension->setCsvs($this->dtbCsvCsvExtensionRepository->findCsvOrderbyRank((int) $csvExtension->getId()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:50:        $response->setCallback(function () use ($csvExtension, $qb): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:51:            $this->csvExportService->setCsvsAndCsvType($csvExtension);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:52:            $this->csvExportService->exportHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:53:            $this->csvExportService->setExportQueryBuilder($qb);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:54:            $this->csvExportService->exportData(function ($entity, CsvExportService $csvService): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:55:                $this->exportRow($entity, $csvService);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:59:        $filename = 'stock_custom_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:68:    private function exportRow(ProductStock $productStock, CsvExportService $csvExportService): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:76:        foreach ($csvExportService->getCsvs() as $csv) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:77:            $entityName = str_replace('\\\\', '\\', $csv->getEntityName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:80:                    $exportRow->setData($csvExportService->getData($csv, $productStock));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:83:                    $exportRow->setData($csvExportService->getData($csv, $pc));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:86:                    $exportRow->setData($csvExportService->getData($csv, $product));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:89:                    $exportRow->setData($cardDetail !== null ? $csvExportService->getData($csv, $cardDetail) : null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:92:                    $exportRow->setData($card !== null ? $csvExportService->getData($csv, $card) : null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:103:                    $field = $csv->getFieldName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:109:                    $exportRow->setData($stockUpQuantity !== null ? $csvExportService->getData($csv, $stockUpQuantity) : null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:117:        $csvExportService->fputcsv($exportRow->getRow());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:115:            return ['ok' => false, 'errors' => [trans('admin.stock.split_join.csv_file_not_found')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:121:            $this->eccubeConfig['eccube_csv_import_delimiter'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:122:            $this->eccubeConfig['eccube_csv_import_enclosure']
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:126:            return ['ok' => false, 'errors' => [trans('admin.stock.split_join.csv_header_invalid')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:131:            return ['ok' => false, 'errors' => [trans('admin.csv.error.data.empty')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:143:                return ['ok' => false, 'errors' => [trans('admin.stock.join.csv_column_invalid')]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:149:                $errors[] = trans('admin.common.csv_invalid_required', ['%line%' => $lineNum, '%name%' => '商品コード']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:158:                $errors[] = trans('admin.common.csv_invalid_format_line_name', ['%line%' => $lineNum, '%name%' => '結合元在庫数']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:173:                $errors[] = trans('admin.stock.split_join.csv_product_not_found', ['%line%' => $lineNum, '%code%' => $code]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:182:                $errors[] = trans('admin.stock.join.csv_same_as_destination', ['%line%' => $lineNum]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:199:                array_unshift($errors, trans('admin.stock.csv.error_limit_notice'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:86:                'admin.product.simple_high_price_csv.sell_price_not_updated',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:100:            'admin.product.simple_high_price_csv.no_matching_product_class',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:25:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:117:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:120:            $this->csvExportService->fputcsv($header);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:127:                $this->csvExportService->fputcsv($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:130:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:133:        $filename = $exportType.'_'.$now->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:28:#[ORM\Table(name: 'dtb_csv_extension')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:102:    #[ORM\JoinColumn(name: 'csv_type_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:111:    public function setCsvType(?CsvType $csvType): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:113:        $this->CsvType = $csvType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:140:    public function addCsvCsvExtension(DtbCsvCsvExtension $csvCsvExtension): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:142:        $this->CsvCsvExtensions[] = $csvCsvExtension;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:147:    public function removeCsvCsvExtension(DtbCsvCsvExtension $csvCsvExtension): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:149:        return $this->CsvCsvExtensions->removeElement($csvCsvExtension);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:163:    private array $csvs = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:166:     * Add csvs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:168:     * @param Csv $csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:172:    public function addCsv(Csv $csv): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:174:        $this->csvs[] = $csv;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:180:     * Get csvs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:186:        return $this->csvs;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:190:     * @param Csv[]|array<int, Csv> $csvs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:194:    public function setCsvs(mixed $csvs): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:196:        $this->csvs = $csvs;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:202:     * @param Collection<int, DtbCsvCsvExtension> $csvCsvExtensions
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:206:    public function setCsvCsvExtensions(Collection $csvCsvExtensions): DtbCsvExtension
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCsvExtension.php:208:        $this->CsvCsvExtensions = $csvCsvExtensions;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:34:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:42:        $filename = 'event_entry_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:49:                $this->csvExportService->initCsvType(CsvType::CSV_TYPE_EVENT_APPLICATION);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:50:                $this->csvExportService->setExportQueryBuilder($qb);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:55:                    $this->csvExportService->exportHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:57:                    $this->csvExportService->exportData(function ($entity, $csvService): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:62:                            foreach ($csvService->getCsvs() as $Csv) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:65:                            $csvService->fputcsv($headerRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:71:                            $csvService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:98:        $csvStandardPrice = (int) bcfloor((string) $this->standardPriceColumn->getValue($row));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:99:        $csvBuyPrice = (int) bcfloor((string) $this->buyPriceColumn->getValue($row));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:111:                    'admin.product.standard_price_csv.sale_product_sell_price_unchanged',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:122:                $csvStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:129:                $csvBuyPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:252:                'admin.product.standard_price_csv.product_class_not_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockApprovalList.php:42:        MtbStockHistorySourceType::STOCK_CHANGE_CSV_IMPORT => 'admin.stock.approval_list.approval_target_csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:38:        protected CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:59:        if (!$csvRows = $this->orderRepository->generateResultCsv($orderIdList)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:60:            throw new \RuntimeException($this->translator->trans('admin.csv.error.export.not_registered'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:65:        // $response->setCallback(function () use ($app, $csvRows) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:66:        $response->setCallback(function () use ($csvRows): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:67:            // $csvService = $app['eccube.service.csv.export'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:68:            $csvService = $this->csvExportService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:69:            $csvService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:72:            $csvService->fputcsv(array_keys($this->csvHeader));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:75:            foreach ($csvRows as $csvRow) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:76:                $csvService->fputcsv($csvRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:79:            $csvService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:115:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered'), '注文番号', $row['注文番号'], $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:122:                throw new \RuntimeException($this->translator->trans('admin.csv.error.customer.not_member', ['%row%' => $rowIndex]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:127:                $message = $this->translator->trans('admin.csv.error.exception.datetime', ['%row%' => $rowIndex, '%column%' => '出荷日']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/PriceConsistencyRowValidator.php:58:            $errors->addMessage('admin.csv.error.product.price_valid', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:38:        private CsvExportService $csvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:40:        array $csvHeader = [],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:43:        parent::__construct($entityManager, $translator, $eccubeConfig, $csvHeader, $requiredCsvHeader);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:56:            throw new \RuntimeException($this->translator->trans('admin.csv.error.export.not_registered'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:58:        $csvRows = $this->convertExportCsvRows($Products, $this->baseInfoRepository->getMallBaseInfo());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:59:        if ($csvRows === []) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:60:            throw new \RuntimeException($this->translator->trans('admin.csv.error.export.no_card_data'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:64:        $headerKeys = array_keys($this->csvHeader);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:65:        $response->setCallback(function () use ($csvRows, $headerKeys): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:66:            $this->csvExportService->fopen();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:67:            $this->csvExportService->fputcsv($headerKeys);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:68:            foreach ($csvRows as $row) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:69:                $this->csvExportService->fputcsv(array_map(fn (string $key) => $row[$key] ?? '', $headerKeys));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:71:            $this->csvExportService->fclose();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:95:        $csvRows = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:170:                $csvRows[] = $row;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:174:        return $csvRows;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:94:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_zipcode_partial', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:100:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_zipcode', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:106:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_pref', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:119:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_zipcode', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:125:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_pref', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:46:    // まとめて買取で個別表示しない低価格帯のリスト
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:743:     * まとめて買取で低価格帯の商品数合計を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:749:            static fn (DtbBuyMainCard $v): bool => $v->isLowPriceBulkAgreementLine(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:753:            static fn (DtbBuyOrderIndivisualInputProduct $v): bool => $v->isLowPriceBulkAgreementLine(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:762:    public function getSaleLowPriceProductFlg(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:766:            if ($BuyMainCard->isLowPriceBulkAgreementLine()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:771:            if ($BuyOrderIndivisualInputProduct->isLowPriceBulkAgreementLine()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:780:     * まとめて買取で低価格帯の商品数を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:784:    public function getLowPriceProductCountList(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:810:    public function getTotalPriceLessThanMinLowPrice(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:836:    public function getTotalQuantityLessThanMinLowPrice(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:5:{% block title %}{{ 'admin.archetype.csv_upload_title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:12:        .csv-format-card > .card-header {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:15:        .csv-format-table th:first-child,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:16:        .csv-format-table td:first-child {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:19:        .csv-format-table th:last-child,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:20:        .csv-format-table td:last-child {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:23:        .csv-format-table thead th {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:26:        .csv-format-table > tbody > tr > td {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:39:            var $fileInput = $('#admin_csv_import_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:48:                    $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:73:                        <span>{{ 'admin.archetype.csv_upload_header'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:77:                            <div class="col-2"><span>{{ 'admin.common.csv_file_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:79:                                <form id="upload-form" method="post" action="{{ url('admin_archetype_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:83:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:84:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,.csv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:87:                                    <button class="btn btn-ec-conversion" id="upload-button" type="submit" disabled>{{ 'admin.common.csv_upload'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:93:                <div class="card rounded border-0 mb-4 csv-format-card">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:95:                        <span>{{ 'admin.archetype.csv_format_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:98:                        <table class="table table-bordered csv-format-table mb-0">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/index.twig:13:            $('#page_count_pulldown, #csv_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/index.twig:411:                                            {{ 'admin.common.csv_download'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/index.twig:415:                                            <li><a class="dropdown-item" href="{{ url('admin_customer_export') }}">{{ 'admin.common.csv_download'|trans }}</a></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/index.twig:416:                                            <li><a class="dropdown-item" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_CUSTOMER') }) }}">{{ 'admin.setting.shop.csv_setting'|trans }}</a></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:23:    #[ORM\Table(name: 'mtb_csv_type')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:49:                $errors->addMessage('admin.csv.error.category.update_requires_sort', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:55:                $errors->addMessage('admin.csv.error.category.not_found', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:60:            $errors->addMessage('admin.csv.error.category.new_must_not_have_sort', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:66:            $errors->addMessage('admin.csv.error.category.id_equals_parent', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:75:                $errors->addMessage('admin.csv.error.category.parent_not_found', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:83:                        $errors->addMessage('admin.csv.error.category.parent_is_descendant', $row->getRowNumber());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:94:            $errors->addMessage('admin.csv.error.category.nest_level_exceeded', $row->getRowNumber(), $maxLevel);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderIndivisualInputProduct.php:118:    public function isLowPriceBulkAgreementLine(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:13:{% set menus = ['setting', 'basic_info', 'shop_csv'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:15:{% block title %}{{ 'admin.setting.shop.csv_setting'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:25:                var tmp_select =  $('#csv-type[name="form[csv_type]"] option[selected]').val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:26:                $('#csv-type[name="form[csv_type]"]').val(tmp_select);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:42:            $('#add').on('click', {from: 'csv-not-output', to: 'csv-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:43:            $('#add-all').on('click', {from: 'csv-not-output', to: 'csv-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:44:            $('#remove').on('click', {from: 'csv-output', to: 'csv-not-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:45:            $('#remove-all').on('click', {from: 'csv-output', to: 'csv-not-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:48:                var $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:56:                var $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:59:                    val == 'top' ? $op.prependTo('#csv-output') : $op.appendTo('#csv-output');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:63:            $('#csv-type').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:65:                var href = '{{ url('admin_setting_shop_csv') }}' + '/' + id;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:70:            $('#csv-form').submit(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:71:                $('#csv-not-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:72:                $('#csv-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:79:    <form id="csv-form" method="post" action="{{ url('admin_setting_shop_csv', {'id': id}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:86:                            <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.csv.csv_columns'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:87:                                <span>{{ 'admin.setting.shop.csv.csv_columns'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:93:                                    <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.csv.csv_type'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:94:                                        <span>{{ 'admin.setting.shop.csv.csv_type'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:99:                                    {{ form_widget(form.csv_type, {'id': 'csv-type'}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:106:                                        <label for="FormControlSelect1">{{ 'admin.setting.shop.csv.non_output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:107:                                        {{ form_widget(form.csv_not_output, {'id': 'csv-not-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:112:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.operation'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:117:                                                                                                  aria-hidden="true"></i><span>&nbsp;{{ 'admin.setting.shop.csv.operation__output'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:124:                                                                                                     aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:131:                                                        class="fa fa-arrow-circle-right" aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_output'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:138:                                                                                                         aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:145:                                        <label for="FormControlSelect2">{{ 'admin.setting.shop.csv.output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:146:                                        {{ form_widget(form.csv_output, {'id': 'csv-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:151:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.order'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:156:                                                                                                              aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__up'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:163:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__down'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:170:                                                                                                                    aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__top'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:177:                                                                                                                       aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__bottom'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:184:                            {{ 'admin.setting.shop.csv.how_to_use'|trans|nl2br }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:23:#[ORM\Table(name: 'mtb_csv_import_type')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:3:{% set menus = ['setting', 'basic_info', 'custom_csv'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:5:{% block title %}{{ 'admin.setting.shop.custom_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:27:            $('#add').on('click', {from: 'csv-not-output', to: 'csv-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:28:            $('#add-all').on('click', {from: 'csv-not-output', to: 'csv-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:29:            $('#remove').on('click', {from: 'csv-output', to: 'csv-not-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:30:            $('#remove-all').on('click', {from: 'csv-output', to: 'csv-not-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:33:                const $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:41:                const $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:44:                    val == 'top' ? $op.prependTo('#csv-output') : $op.appendTo('#csv-output');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:48:            $('#csv-type').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:50:                const href = '{{ url('admin_setting_shop_csv_custom') }}' + '/' + id;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:54:            $('#admin_custom_csv_csv_extensions').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:55:                const csvTypeId = $('#csv-type').val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:56:                let href = '{{ url('admin_setting_shop_csv_custom') }}' + '/' + csvTypeId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:62:            $('#csv-form').submit(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:63:                $('#csv-not-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:64:                $('#csv-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:79:    <form id="csv-form" method="post" action="{{ path('admin_setting_shop_csv_custom_update', {'csvTypeId': csvTypeId, 'csvExtensionId': csvExtensionId}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:86:                            <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.csv.csv_columns'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:87:                                <span>{{ 'admin.setting.shop.csv.csv_columns'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:93:                                    <span>{{ 'admin.setting.shop.csv.csv_type'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:97:                                    {{ form_widget(form.csv_type, {'id': 'csv-type'}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:103:                                    <span>{{ 'admin.setting.shop.custom_csv'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:106:                                    {{ form_widget(form.csv_extensions) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:112:                                    <span>{{ 'admin.setting.shop.csv.output_name'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:126:                                        <label for="FormControlSelect1">{{ 'admin.setting.shop.csv.non_output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:127:                                        {{ form_widget(form.csv_not_output, {'id': 'csv-not-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:132:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.operation'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:137:                                                                                                  aria-hidden="true"></i><span>&nbsp;{{ 'admin.setting.shop.csv.operation__output'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:144:                                                                                                     aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:151:                                                        class="fa fa-arrow-circle-right" aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_output'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:158:                                                                                                         aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:165:                                        <label for="FormControlSelect2">{{ 'admin.setting.shop.csv.output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:166:                                        {{ form_widget(form.csv_output, {'id': 'csv-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:171:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.order'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:176:                                                                                                              aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__up'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:183:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__down'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:190:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__top'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:197:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__bottom'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:213:                            {% if csvExtensionId %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:217:                                   data-url="{{ path('admin_setting_shop_csv_custom_delete', {csvExtensionId: csvExtensionId}) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:248:                    <p class="text-start modal-message">{{ 'admin.setting.shop.csv.delete_modal__message'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:68:            <a href="{{ url('admin_archetype_csv_import') }}" class="btn btn-ec-conversion">{{ 'admin.archetype.csv_import'|trans }}</a>

codex
広い検索はCSV一般に引っかかりすぎたので、候補が主張している「近い実装」と定数・ルート名・テンプレート名に絞って確認します。あわせて設計書の該当範囲を行番号付きで読みます。
exec
/bin/bash -lc "nl -ba function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html | sed -n '190,365p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "find /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv -maxdepth 1 -type f -printf '%f\\n' | sort" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php | sed -n '1,240p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 125ms:
   190	      <h2 id="文書情報">文書情報</h2>
   191	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>機能名</td><td>低価格帯カード価格変更CSV出力</td></tr><tr><td>機能分類</td><td>管理画面 / 商品管理</td></tr><tr><td>カスタマイズ区分</td><td>新規実装</td></tr><tr><td>作成日</td><td>2026-06-11</td></tr><tr><td>参照元</td><td>excel_to_html/output/0204_基本設計仕様書(商品管理).html</td></tr><tr><td>実装確認</td><td>../ec-cube-enterprise</td></tr></tbody></table></div>
   192	<h2 id="改訂履歴">改訂履歴</h2>
   193	<div class="table-wrap"><table><thead><tr><th>日付</th><th>内容</th></tr></thead><tbody><tr><td>2026-06-11</td><td>新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。</td></tr></tbody></table></div>
   194	<h2 id="TODO-未確定項目">TODO（未確定項目）</h2>
   195	<ul><li>URLエンドポイントとDBカラムは <code>../ec-cube-enterprise</code> の実装確認値を優先する。本文で実装未確認とした項目は、対象 Controller / Route / Entity / Migration の追加確認後に確定する。</li><li>Excel設計書に画面項目、CSV列、帳票レイアウトの詳細がある場合、詳細項目は各画面・CSV・帳票設計側を正とする。</li></ul>
   196	<h2 id="1-低価格帯カード価格変更CSV出力">1. 低価格帯カード価格変更CSV出力</h2>
   197	<h3 id="機能の目的と役割">機能の目的と役割</h3>
   198	<p>商品コードと価格変更用のCSVを出力し、低価格帯カードの基準価格変更作業を支援する。</p>
   199	<h3 id="入出力仕様">入出力仕様</h3>
   200	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>管理画面の検索条件、フォーム入力、CSVアップロード、または画面操作。</td></tr><tr><td>出力</td><td>画面表示、CSV/PDFダウンロード、登録完了/エラー表示。</td></tr><tr><td>副作用</td><td>対象データの登録・更新、CSV取込履歴、在庫履歴、ステータス履歴の記録。</td></tr></tbody></table></div>
   201	<h3 id="開始条件-終了条件">開始条件、終了条件</h3>
   202	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>開始条件</td><td>管理画面にログイン済みの利用者が対象メニューまたは操作を実行する。</td></tr><tr><td>終了条件</td><td>画面表示、ファイル出力、登録完了、またはエラー表示が完了する。</td></tr></tbody></table></div>
   203	<h3 id="判定条件">判定条件</h3>
   204	<ul><li>Excel設計書に記載された対象条件、検索条件、CSV出力条件、登録条件を正とする。</li><li>Excel設計書に未記載のURLエンドポイント、DBカラム、実処理順序は <code>../ec-cube-enterprise</code> の実装を正とする。</li><li>権限、ログイン状態、管理画面プレフィックスなどの共通判定は共通設計および実装側のセキュリティ設定に従う。</li></ul>
   205	<h3 id="プロセスフロー">プロセスフロー</h3>
   206	<ol><li>利用者または外部システムが対象機能を開始する。</li><li>入力値、検索条件、アップロードファイル、またはリクエスト本文を受け付ける。</li><li>Excel設計書に定義された対象データを取得し、実装側の検証・権限・状態条件を適用する。</li><li>登録・更新・出力・連携のいずれかの主処理を実行する。</li><li>成功時は結果画面、CSV/PDF/APIレスポンス、またはバッチ結果を返す。失敗時はエラー内容を返し、更新が必要な処理では不整合が残らないように扱う。</li></ol>
   207	<h3 id="ビジネスロジック">ビジネスロジック</h3>
   208	<ul><li>**Excel設計優先**: 仕様の目的、対象データ、出力項目、表示項目、業務上の条件は <code>excel_to_html/output</code> の設計書を正とする。</li><li>**実装補完**: Excel設計に書かれていないURLエンドポイント、DBカラム、トランザクション、サービス分割、非同期処理は <code>../ec-cube-enterprise</code> の実装を正とする。</li><li>**対象機能の要点**: 低価格帯カード価格変更を行うためのCSV出力を行えます。</li><li>**実装確認値**: 管理画面のCSV出力機能。実装で確認できるURLは未特定のため断定しない。</li></ul>
   209	<h3 id="状態・データ更新">状態・データ更新</h3>
   210	<div class="table-wrap"><table><thead><tr><th>対象</th><th>内容</th></tr></thead><tbody><tr><td>主データ</td><td>管理画面の対象業務データを参照し、登録系では対象データと履歴を更新する。</td></tr><tr><td>履歴・ログ</td><td>必要に応じてCSV取込履歴、在庫履歴、ステータス履歴、API受信履歴、アプリケーションログを作成・更新する。</td></tr><tr><td>DB関連実装確認値</td><td>dtb_product_class.standard_price, dtb_product_class.price02, dtb_product_class.update_date</td></tr></tbody></table></div>
   211	<h3 id="例外処理">例外処理</h3>
   212	<ul><li>**入力不備**: 必須項目、CSVヘッダ、CSV行、APIリクエスト本文、検索条件が不正な場合はエラーとして処理し、登録・更新対象を確定しない。</li><li>**対象なし**: 検索条件や対象IDに該当するデータがない場合は、空の一覧、空CSV、またはエラーレスポンスとして扱う。扱いの細部は対象画面/API/バッチの実装に従う。</li><li>**状態不整合**: 既に処理済み、キャンセル済み、承認不可、在庫不足など状態条件に合わない場合は処理対象外またはエラーとする。</li><li>**外部連携失敗**: スマレジ等の外部連携で失敗した場合は、実装側の再連携・エラーログ・エラーメール・ステータス更新仕様を正とする。</li></ul>
   213	<h3 id="関連設計への接続点">関連設計への接続点</h3>
   214	<ul><li>画面項目、CSV列、PDFレイアウト、APIリクエスト/レスポンスの詳細は、参照元Excel設計書の該当シートを正とする。</li><li>URLエンドポイントとDBカラムは <code>../ec-cube-enterprise</code> の Controller Route、Entity、Repository、Migration、Service 実装を正とする。</li></ul>
   215	<h2 id="Excel設計書からの抽出">Excel設計書からの抽出</h2>
   216	<pre><code class="language-text">低価格帯カード価格変更CSV出力
   217	ドキュメント名
   218	商品管理機能
   219	セクション
   220	—
   221	プロジェクト名
   222	サイトリニューアル
   223	作成者
   224	堀部
   225	作成日
   226	2025-08-15
   227	更新者
   228	堀部
   229	更新日
   230	2025-09-12
   231	機能No
   232	M03-44
   233	機能名
   234	低価格帯カード価格変更CSV出力
   235	概要
   236	—
   237	機能について
   238	処理概要（★はカスタマイズ項目）
   239	図形・テキストボックス内テキスト（1件）
   240	M03-44 低価格帯カード価格変更CSV出力
   241	識別ID項目名備考
   242	1商品ID
   243	2言語(ID)
   244	3商品名
   245	4言語
   246	5新基準価格(変更予定価格)計算式に則って変更する予定の基準価格
   247	6新買取価格(変更予定価格)計算式に則って変更する予定の買取価格
   248	7現行基準価格比較参考のための項目のため、アップロード時にはこの項目は削除してアップロードする
   249	8現行買取価格比較参考のための項目のため、アップロード時にはこの項目は削除してアップロードする
   250	9原価単価
   251	カスタマイズ説明
   252	概要
   253	低価格帯カード価格変更を行うためのCSV出力をすることが可能
   254	機能仕様機能について
   255	基準価格変更CSV登録をベースに下記のカスタマイズを行い、新規機能として実装する
   256	原価単価を新規追加
   257	低価格帯カード価格変更支援機能
   258	低価格帯カードに限り下記の制御が加わる
   259	・低価格帯カードは20円～300円以下とする
   260	・晴れる屋さんが業務で使用している計算式(※1 参照)に基づき、新価格を価格欄に表示する
   261	・現前設定されている価格は別の列で参考情報として表示する
   262	※1 業務で使用している計算式
   263	以下の条件に適合したら価格を変動させる
   264	・週間販売が10枚未満ならワンランク下げ
   265	・週間販売が10枚以上ならワンランク上げ
   266	・全店在庫が10枚未満になったらワンランク上げ
   267	ランクは以下の通り
   268	300
   269	250
   270	200
   271	150
   272	100
   273	80
   274	50
   275	30
   276	機能仕様処理概要（★はカスタマイズ項目）
   277	低価格帯カード価格変更支援機能
   278	新基準価格(変更予定価格)(5)と新買取価格(変更予定価格)(6)は、計算式※1に基づいて出力する
   279	基準価格や買取価格を現行の価格と比較できるように現行基準価格(7)と現行買取価格(8)を出力する
   280	※ 登録する際には、CSVから現行基準価格(7)と現行買取価格(8)は削除した上で基準価格変更CSVアップロードを利用し、登録を行う
   281	原価単価を新規追加
   282	識別ID:9 原価単価を追加
   283	図形・テキストボックス内テキスト（1件）
   284	画面遷移図・フロー図・画面イメージ上の注釈など、図形内の文字を読み順（位置）で抽出したものです。
   285	位置テキスト
   286	B6Ph2で対応
   287	低価格帯カード価格変更CSVフォーマット
   288	ドキュメント名
   289	商品管理機能
   290	セクション
   291	—
   292	プロジェクト名
   293	サイトリニューアル
   294	作成者
   295	城下
   296	作成日
   297	2025-06-12
   298	更新者
   299	堀部
   300	更新日
   301	2025-09-12
   302	機能No
   303	M03-44
   304	機能名
   305	低価格帯カード価格変更CSVフォーマット
   306	概要
   307	—
   308	機能について
   309	処理概要（★はカスタマイズ項目）
   310	図形・テキストボックス内テキスト（1件）
   311	M03-44 低価格帯カード価格変更CSVフォーマット
   312	識別ID項目名主キー書式・制限必須最大文字数
   313	または最大値入力例備考
   314	1商品ID◯数値(整数)◯整数型の最大値1234567
   315	2言語(ID)数値(整数)◯整数型の最大値1
   316	3商品名文字型◯256(140)《審判の日/Day of Judgment》[FDN] 白R
   317	4言語文字型◯256日本語
   318	5新基準価格(変更予定価格)数値(整数)◯300200計算式に則って変更する予定の基準価格
   319	6新買取価格(変更予定価格)数値(整数)◯300150計算式に則って変更する予定の買取価格
   320	7現行基準価格数値(整数)300250比較参考のための項目のため、アップロード時にはこの項目は削除してアップロードする
   321	8現行買取価格数値(整数)300100比較参考のための項目のため、アップロード時にはこの項目は削除してアップロードする
   322	9原価単価数値(整数)300100
   323	カスタマイズ説明
   324	概要
   325	低価格帯カード価格変更を行うためのCSV出力をすることが可能
   326	機能仕様機能について
   327	基準価格変更CSV登録をベースに下記のカスタマイズを行い、新規機能として実装する
   328	原価単価を新規追加
   329	低価格帯カード価格変更支援機能
   330	低価格帯カードに限り下記の制御が加わる
   331	・低価格帯カードは20円～300円以下とする
   332	・晴れる屋さんが業務で使用している計算式(※1 参照)に基づき、新価格を価格欄に表示する
   333	・現前設定されている価格は別の列で参考情報として表示する
   334	※1 業務で使用している計算式
   335	以下の条件に適合したら価格を変動させる
   336	・週間販売が10枚未満ならワンランク下げ
   337	・週間販売が10枚以上ならワンランク上げ
   338	・全店在庫が10枚未満になったらワンランク上げ
   339	ランクは以下の通り
   340	300
   341	250
   342	200
   343	150
   344	100
   345	80
   346	50
   347	30
   348	機能仕様処理概要（★はカスタマイズ項目）
   349	低価格帯カード価格変更支援機能
   350	新基準価格(変更予定価格)(5)と新買取価格(変更予定価格)(6)は、計算式※1に基づいて出力する
   351	基準価格や買取価格を現行の価格と比較できるように現行基準価格(7)と現行買取価格(8)を出力する
   352	※ 登録する際には、CSVから現行基準価格(7)と現行買取価格(8)は削除した上で基準価格変更CSVアップロードを利用し、登録を行う
   353	原価単価を新規追加
   354	識別ID:9 原価単価を追加
   355	図形・テキストボックス内テキスト（1件）
   356	画面遷移図・フロー図・画面イメージ上の注釈など、図形内の文字を読み順（位置）で抽出したものです。
   357	位置テキスト
   358	B6Ph2で対応</code></pre>
   359	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   360	    </main>
   361	  </div>
   362	</body>
   363	</html>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php | sed -n '1,140p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Entity\Master;
    17	
    18	use Doctrine\DBAL\Types\Types;
    19	use Doctrine\ORM\Mapping as ORM;
    20	use Eccube\Entity\AbstractEntity;
    21	use Eccube\Repository\Master\MtbCsvImportTypeRepository;
    22	
    23	#[ORM\Table(name: 'mtb_csv_import_type')]
    24	#[ORM\HasLifecycleCallbacks]
    25	#[ORM\Entity(repositoryClass: MtbCsvImportTypeRepository::class)]
    26	class MtbCsvImportType extends AbstractEntity
    27	{
    28	    public const PRODUCT_CARD_IMPORT_CSV_ID = 1;
    29	    public const PRODUCT_GOODS_IMPORT_CSV_ID = 2;
    30	    public const PRODUCT_TAG_IMPORT_CSV_ID = 3;
    31	    public const PRODUCT_TAG_SALES_ANALYSIS_IMPORT_CSV_ID = 4;
    32	    public const PRODUCT_STANDARD_PRICE_IMPORT_CSV_ID = 5;
    33	    public const PRODUCT_PRICE_IMPORT_CSV_ID = 6;
    34	    public const SIMPLE_HIGH_PRICE_IMPORT_CSV_ID = 7;
    35	    public const HIGH_PRICE_IMPORT_CSV_ID = 8;
    36	    public const PRODUCT_STOCK_IMPORT_CSV_ID = 9;
    37	    public const PRODUCT_DISCOUNT_IMPORT_CSV_ID = 10;
    38	    public const PRODUCT_SECTION_IMPORT_CSV_ID = 11;
    39	    public const PRODUCT_STORAGE_CODE_CSV_ID = 12;
    40	    public const PRODUCT_BUY_DISCOUNT_IMPORT_CSV_ID = 13;
    41	    public const PRODUCT_STATUS_IMPORT_CSV_ID = 14;
    42	    public const PRODUCT_SHELF_NUMBER_IMPORT_CSV_ID = 15;
    43	    public const CATEGORY_BULK_IMPORT_CSV_ID = 16;
    44	    public const STOCK_MOVE_IMPORT_CSV_ID = 17;
    45	    public const STOCK_TRANSFER_IMPORT_CSV_ID = 18;
    46	
    47	    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => 'CSVインポートタイプID'])]
    48	    #[ORM\Id]
    49	    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    50	    private int $id;
    51	
    52	    #[ORM\Column(name: 'name', type: Types::STRING, length: 32, options: ['comment' => 'CSVインポートタイプ'])]
    53	    private string $name;
    54	
    55	    public function getId(): int
    56	    {
    57	        return $this->id;
    58	    }
    59	
    60	    public function setName(string $name): MtbCsvImportType
    61	    {
    62	        $this->name = $name;
    63	
    64	        return $this;
    65	    }
    66	
    67	    public function getName(): string
    68	    {
    69	        return $this->name;
    70	    }
    71	}

 succeeded in 131ms:
CardCsvController.php
CategoryCsvController.php
CsvImportController.php
GoodsCsvController.php
ProductCsvController.php
ProductPriceCsvController.php
ProductSaleHighPriceCsvController.php
ProductSectionCsvController.php
ProductShelfNumberCsvController.php
ProductSimpleHighPriceCsvController.php
ProductStandardPriceCsvController.php
ProductStatusCsvController.php
ProductTagCsvController.php
TagSalesAnalysisCsvController.php

 succeeded in 129ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Controller\Admin\Product\Csv;
    17	
    18	use Eccube\Controller\AbstractController;
    19	use Eccube\Entity\Master\MtbCsvImportType;
    20	use Eccube\Entity\Member;
    21	use Eccube\Form\Type\Admin\CsvImportType;
    22	use Eccube\Repository\DtbCsvImportHistoryRepository;
    23	use Eccube\Repository\ProductClassRepository;
    24	use Eccube\Service\Csv\Importer\CsvImporter;
    25	use Eccube\Service\Csv\Importer\Event\SimpleHighPriceImportHandler;
    26	use Eccube\Service\CsvExportService;
    27	use Knp\Component\Pager\PaginatorInterface;
    28	use Symfony\Component\HttpFoundation\File\UploadedFile;
    29	use Symfony\Component\HttpFoundation\RedirectResponse;
    30	use Symfony\Component\HttpFoundation\Request;
    31	use Symfony\Component\HttpFoundation\Response;
    32	use Symfony\Component\HttpFoundation\StreamedResponse;
    33	use Symfony\Component\Routing\Attribute\Route;
    34	
    35	class ProductSimpleHighPriceCsvController extends AbstractController
    36	{
    37	    public function __construct(
    38	        private readonly ProductClassRepository $productClassRepository,
    39	        private readonly CsvExportService $csvExportService,
    40	        private readonly PaginatorInterface $paginator,
    41	        private readonly DtbCsvImportHistoryRepository $csvImportHistoryRepository,
    42	    ) {
    43	    }
    44	
    45	    /**
    46	     * 高額商品価格変更CSV雛形ファイルダウンロード
    47	     *
    48	     * @return StreamedResponse
    49	     */
    50	    #[Route(path: '/%eccube_admin_route%/product/simple_high_price/csv_template', name: 'admin_product_simple_high_price_csv_template', methods: ['GET'])]
    51	    public function csvTemplate(): StreamedResponse
    52	    {
    53	        return $this->csvTemplateStreamedResponse(
    54	            $this->csvExportService,
    55	            $this->getCsvHeader(),
    56	            'simple_high_price_template.csv'
    57	        );
    58	    }
    59	
    60	    /**
    61	     * 高額商品価格変更CSVアップロード画面
    62	     *
    63	     * @param Request $request
    64	     *
    65	     * @return Response
    66	     */
    67	    #[Route(path: '/%eccube_admin_route%/product/simple_high_price/csv_upload', name: 'admin_product_simple_high_price_csv_upload', methods: ['GET'])]
    68	    public function csv(Request $request): Response
    69	    {
    70	        $form = $this->createForm(CsvImportType::class);
    71	        $form->handleRequest($request);
    72	
    73	        $pagination = $this->getCsvImportHistoryPaginationParams(
    74	            $request,
    75	            'admin.product.simple_high_price_csv.page_count',
    76	            'admin.product.simple_high_price_csv.page_no',
    77	            50,
    78	        );
    79	        $pageCount = $pagination['pageCount'];
    80	        $pageNo = $pagination['pageNo'];
    81	        $pageCountOptions = $pagination['pageCountOptions'];
    82	
    83	        $qb = $this->csvImportHistoryRepository->getQueryBuilderByCsvImportType(MtbCsvImportType::SIMPLE_HIGH_PRICE_IMPORT_CSV_ID);
    84	        $importHistoriesPagination = $this->paginator->paginate($qb, $pageNo, $pageCount);
    85	
    86	        $headers = $this->getCsvHeader();
    87	
    88	        return $this->render('@admin/Product/csv_product_simple_high_price.twig', [
    89	            'form' => $form->createView(),
    90	            'headers' => $headers,
    91	            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
    92	            'csv_box_title' => 'admin.product.simple_high_price_csv_upload_title',
    93	            'csv_format_title' => 'admin.product.simple_high_price_csv_format_title',
    94	            'form_action_route' => 'admin_product_simple_high_price_import',
    95	            'template_download_route' => 'admin_product_simple_high_price_csv_template',
    96	            'import_histories_pagination' => $importHistoriesPagination,
    97	            'history_page_route' => 'admin_product_simple_high_price_csv_upload',
    98	            'page_no' => $pageNo,
    99	            'page_count' => $pageCount,
   100	            'pageMax' => $pageCountOptions,
   101	            'show_sale_alert' => true,
   102	        ]);
   103	    }
   104	
   105	    /**
   106	     * 高額商品価格変更CSV取込
   107	     *
   108	     * @param Request $request
   109	     *
   110	     * @return RedirectResponse
   111	     */
   112	    #[Route(path: '/%eccube_admin_route%/product/simple_high_price/import', name: 'admin_product_simple_high_price_import', methods: ['POST'])]
   113	    public function import(Request $request): RedirectResponse
   114	    {
   115	        /** @var Member $Member */
   116	        $Member = $this->getUser();
   117	
   118	        $form = $this->formFactory->createBuilder(CsvImportType::class)->getForm();
   119	        $form->handleRequest($request);
   120	
   121	        if (!$form->isValid()) {
   122	            foreach ($form->getErrors() as $error) {
   123	                $this->addError($error->getMessage(), 'admin');
   124	            }
   125	
   126	            return $this->redirectToRoute('admin_product_simple_high_price_csv_upload');
   127	        }
   128	        /** @var UploadedFile|null $formFile */
   129	        $formFile = $form['import_file']->getData();
   130	
   131	        if ($formFile === null) {
   132	            $this->addError('admin.common.csv_invalid_no_data', 'admin');
   133	
   134	            return $this->redirectToRoute('admin_product_simple_high_price_csv_upload');
   135	        }
   136	
   137	        if ($this->countCsvRows($formFile) >= static::ADMIN_CSV_IMPORT_MAX_ROWS) {
   138	            $this->addError($this->getCsvImportMaxRowsExceededMessage(), 'admin');
   139	
   140	            return $this->redirectToRoute('admin_product_simple_high_price_csv_upload');
   141	        }
   142	
   143	        log_info('高額商品価格変更CSV登録開始');
   144	
   145	        $handler = new SimpleHighPriceImportHandler($this->productClassRepository);
   146	        $importer = new CsvImporter(
   147	            $this->entityManager,
   148	            $this->translator,
   149	            $this->eccubeConfig,
   150	            $handler,
   151	            $Member
   152	        );
   153	        $result = $importer->import($formFile);
   154	
   155	        if ($result->hasInfos()) {
   156	            foreach ($result->getInfos() as $info) {
   157	                $this->addWarning($info['message'], 'admin');
   158	            }
   159	        }
   160	
   161	        if ($result->hasError()) {
   162	            log_info('高額商品価格変更CSV登録 異常終了');
   163	            foreach ($result->getErrors() as $error) {
   164	                $this->addError($error['message'], 'admin');
   165	            }
   166	        } else {
   167	            $this->addSuccess('admin.register.complete', 'admin');
   168	            log_info('高額商品価格変更CSV登録完了', ['count' => $result->getCount()]);
   169	            $this->csvImportHistoryRepository->insertCsvImportHistory(
   170	                MtbCsvImportType::SIMPLE_HIGH_PRICE_IMPORT_CSV_ID,
   171	                $formFile->getClientOriginalName(),
   172	                $Member->getId()
   173	            );
   174	        }
   175	
   176	        return $this->redirectToRoute('admin_product_simple_high_price_csv_upload');
   177	    }
   178	
   179	    /**
   180	     * 高額商品価格変更CSVヘッダー定義
   181	     *
   182	     * @return array<string, string>
   183	     */
   184	    private function getCsvHeader(): array
   185	    {
   186	        return [
   187	            '商品コード' => '',
   188	            '基準価格' => '',
   189	        ];
   190	    }
   191	
   192	    /**
   193	     * 高額商品価格変更CSV必須ヘッダー定義
   194	     *
   195	     * @return array<string, string>
   196	     */
   197	    private function getRequiredCsvHeader(): array
   198	    {
   199	        return [
   200	            '商品コード' => '商品コード',
   201	            '基準価格' => '基準価格',
   202	        ];
   203	    }
   204	}

codex
現時点では「機能不在」という大筋は設計と実装検索に照らして妥当そうです。一方で、findingのdimensionや参照の置き方には弱い箇所があるため、そこを重点的に切り分けています。
exec
/bin/bash -lc "rg -n \"simple_low_price|SimpleLowPrice|simple_low|SimpleLow|low_price|低価格帯カード価格変更|低価格帯カード|新基準価格|新買取価格|現行基準価格|現行買取価格\" /home/y-saito/Developments/ec-cube-enterprise --glob '"'!vendor/**'"' --glob '"'!var/**'"' --glob '"'!node_modules/**'"'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "rg -n \"admin_product_simple_high_price|simple_high_price|ProductSimpleHighPrice|基準価格|商品コード\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app/template/admin --glob '"'!var/**'"'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "find /home/y-saito/Developments/ec-cube-enterprise -path '*/vendor' -prune -o -path '*/var' -prune -o -iname '*simple*low*' -print | nl -ba" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "find /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv -maxdepth 1 -type f -printf '%f\\n' | sort | nl -ba" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 149ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:205:        // 在庫移動・振替IDごとの移動点数・基準価格合計を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:687:            '商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:711:            '振替元商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:712:            '振替先商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:645:        $headers = ['商品コード', '分割先在庫数'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:59:        '商品コード' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:64:        '商品コード' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:73:        '商品コード' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:86:        '商品コード' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:92:        '商品コード' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:834:        $headers = ['商品コード', '結合元在庫数'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php:383:            '商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php:421:            '商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php:441:            '商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:175:        $headers = ['結合先商品コード', '結合数', '結合元商品コード', '結合元在庫区分', '結合元在庫数'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:183:        $headers = ['分割元商品コード', '分割数', '分割先商品コード', '分割先在庫数'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:360:                $errors[] = ['row' => $rowNum, 'message' => sprintf('商品コード「%s」が見つかりません', $productCode)];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1055:        // product_code 商品コード（項目別・規格コード部分一致。外側の pc を絞り一覧の規格行と一致させる）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1855:     * 商品名で検索し、商品IDと言語コード、高額商品コードを取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:85:                $this->completeJobSkipped($Job, 'スマレジ商品コードが未設定のため処理しません。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:348:            throw new \RuntimeException(sprintf('スマレジ商品コード %s に対して productId が複数件存在するため、一意に更新先を決定できません。', $productCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:173:        // 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:228:        // 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:1249:     * 重複商品コード確認画面の前ページ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:1261:     * 重複商品コード確認画面
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:241:        // 基準価格フィルター
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:458:     * 商品コード・店舗・在庫区分で ProductStock を1件取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbInventoryPlanDetailRepository.php:36:     * 指定した棚卸計画IDに紐づく商品コードの配列を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbInventoryPlanDetailRepository.php:53:     * 指定した棚卸計画IDに紐づく商品コード => 棚卸詳細ID のマップを取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:46:        '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:50:        '変更前基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:51:        '変更後基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:132:     * 他画面からの遷移用: クエリの multi（商品名） / code（商品コード） / card_condition をセッションの検索ビュー用データに取り込む。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:149:        // 初期化: 商品コードまたはカード状態が指定された場合は、カード状態をクリアする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:156:        // 商品コード検索
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:59:            // スマレジ用商品コード(バーコード)登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:418:     * 1. 通常買取商品 -> 通常買取商品(商品コード未設定) -> 個別入力商品 (indivisual_input_product_sort ASC)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:157:        // 商品コード(完全一致)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:183:        // 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferDetailRepository.php:32:     * 在庫移動振替IDごとの移動点数・基準価格合計.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcProductCodeGenerator.php:19: * 店頭受取注文用スマレジ商品コード採番。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcProductCodeGenerator.php:38:     * 店舗 ID と注文番号から 13 桁の商品コードを生成する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:64:        // 商品コード → スマレジ商品 ID を解決
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiProductClassCsvImportUpsertCoordinator.php:45:     * 行処理時に呼ぶ。連携ONかつスマレジ商品コードが空でない場合のみバッファする。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:587:     * 出力順: 色の並び順昇順 → カードタイプの並び順昇順 → マナコスト(CMC)昇順 → 基準価格降順。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockSplitJoinRepository.php:233:     * 商品名・商品コード検索。フォームの「検索対象」に合わせる。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockHistoryRepository.php:95:        // id 商品名(日/英)・カード名(日/英)・商品ID・商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:158:     * 指示に紐づく在庫移動振替IDごとの集計（移動点数・基準価格合計・移動原価合計・高額商品合計・通常商品合計）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:100:                    'placeholder' => '商品コード(product_code)を改行区切りで入力',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:30:    // 商品検索では【商品ID】【言語】【高額商品コード】でグループ化して商品を表示する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:34:    // 1. 【商品ID】【言語】【高額商品コード】のみを検索する（→ createQueryBuilderForId）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:695:    //      * 商品コード商品企画サブ情報を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:782:    //      * 商品id,言語id,高額商品コードから商品規格サブ情報を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1143:    //      * 商品コードから、商品id・言語を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1411:     * 商品コードの配列とタグから規格サブを取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1485:    //      * 商品コードの配列とカテゴリーから規格サブを取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2029:     * @param int $nmPrice 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2119:     * 商品コードに該当する商品規格が存在するかどうかを返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2121:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2137:     * 商品コードに該当する商品規格の件数を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2139:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2155:     * 商品コードに該当する dtb_product_class の section_id を更新する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2157:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2172:     * 商品コードで絞り込み、2件以上ある場合は false を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2174:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2191:     * 商品コードに該当し、sale_flg が指定値かつ  high_price_code が非空（NULL・空文字は除外）の行が存在するか。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2193:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2220:     * 商品コードに一致し、高額商品コードが非空で設定された商品規格を1件取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2243:     * 基準価格のみ更新（sale_flg が true の行）。販売価格 price02 は変更しない。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2245:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2246:     * @param int $standardPrice 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2275:     * 基準価格と販売価格を更新（sale_flg が false または NULL の行）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2277:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2278:     * @param int $standardPrice 基準価格（price02 にも同じ値を設定）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2309:     * 商品コードに紐づく商品規格の棚番号を更新する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2311:     * @param string $productCode 商品コード（dtb_product_class.product_code）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2360:    //      * 部門設定のない商品の商品名と商品コードを取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2558:     * 商品コードが存在する場合 true を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2560:     * @param string $code 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2562:     * @return bool 商品コードが存在する場合 true
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2690:     * 基準価格変更CSV用。取得済みの商品規格行ごとに価格・原価単価を更新する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2696:     * @param int                              $standardPrice  CSV基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2701:     * 基準価格変更CSVの1規格分の更新を行う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2703:     * 基準価格は商品規格（カードコンディション）ごとに異なるため、規格単位で更新する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2706:     * @param int $standardPrice 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2876:     * スマレジ商品コードの最大値を数値として取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2896:     * 商品コードが重複している商品規格を取得する（フラットな行の配列）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2967:     * 基準価格変更CSV用。商品ID・言語IDに該当する高額商品コードなしの商品規格を取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:21:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:28:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:81:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/otc_buy_order_no_section_alert.twig:1:商品名, 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:64: * 基本検索条件 (1-1〜1-6) と、商品一覧（SearchProductType）に準拠した詳細検索＋在庫一覧用の基準価格を保持する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:117:            // 1-4: コード（商品コード、部分一致）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:145:            // ── 詳細検索条件（商品一覧 SearchProductType と同一の項目順・定義に準拠）+ 在庫一覧用の基準価格 ──
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:45:                                商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:49:                                商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:108:                                    商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:207:        // EC 標準注文番号 (order_no)。スマレジ商品コードの採番には使わない。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:209:        // スマレジ商品コード採番の基となる注文番号 (order_number)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:240:            // 購入商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BulkUpdateProductPriceType.php:57:     * 買取価格(NM)が基準価格(NM)を上回る場合にエラーを追加する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:21:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:28:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:81:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:45:                                商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:112:     *   buyPriceFrom='1' / cardCondition=1 (NM) / highPriceCode='-*' (高額商品コードなし) / reservationFlg='0' (予約商品でない)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:188:        // 高額商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:49:                                商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:108:                                    商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:21:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderPdfService.php:103:        $this->labelCell[] = '商品名 / 商品コード';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:28:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:81:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:45:                                商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:49:                                商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:108:                                    商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:228:                                                    <th>商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:230:                                                    <th>基準価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:35:class ProductSimpleHighPriceCsvController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:50:    #[Route(path: '/%eccube_admin_route%/product/simple_high_price/csv_template', name: 'admin_product_simple_high_price_csv_template', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:56:            'simple_high_price_template.csv'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:67:    #[Route(path: '/%eccube_admin_route%/product/simple_high_price/csv_upload', name: 'admin_product_simple_high_price_csv_upload', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:75:            'admin.product.simple_high_price_csv.page_count',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:76:            'admin.product.simple_high_price_csv.page_no',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:88:        return $this->render('@admin/Product/csv_product_simple_high_price.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:92:            'csv_box_title' => 'admin.product.simple_high_price_csv_upload_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:93:            'csv_format_title' => 'admin.product.simple_high_price_csv_format_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:94:            'form_action_route' => 'admin_product_simple_high_price_import',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:95:            'template_download_route' => 'admin_product_simple_high_price_csv_template',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:97:            'history_page_route' => 'admin_product_simple_high_price_csv_upload',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:112:    #[Route(path: '/%eccube_admin_route%/product/simple_high_price/import', name: 'admin_product_simple_high_price_import', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:126:            return $this->redirectToRoute('admin_product_simple_high_price_csv_upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:134:            return $this->redirectToRoute('admin_product_simple_high_price_csv_upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:140:            return $this->redirectToRoute('admin_product_simple_high_price_csv_upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:176:        return $this->redirectToRoute('admin_product_simple_high_price_csv_upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:187:            '商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:188:            '基準価格' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:200:            '商品コード' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:201:            '基準価格' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:360:                                            <th id="purchase_list_main__product_code">商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:476:                                                    <th id="bulk_purchase_list_main__product_code">商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:630:                                                <th id="detail__header_product_code">商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:633:                                                <th id="detail__header_standard_price">基準価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:675:                                                <th id="detail__header_product_code">商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:678:                                                <th id="detail__header_standard_price">基準価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:321:            '基準価格' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:363:            '商品コード' => "商品コード\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:385:            '基準価格' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:391:            'スマレジ商品コード' => 'スマレジ商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:405:            '商品コード' => "商品コード\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:428:            '基準価格' => "基準価格\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:186:            '商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:199:            '商品コード' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:56:     * 基準価格変更CSV雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:71:     * 基準価格変更CSVアップロード画面
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:114:     * 基準価格変更CSV取込
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:151:        log_info('基準価格変更CSV登録開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:157:            $this->smaregiProductClassCsvImportUpsertCoordinatorFactory->create('基準価格変更CSVインポート後'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:171:            log_info('基準価格変更CSV登録 異常終了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:177:            log_info('基準価格変更CSV登録完了', ['count' => $result->getCount()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:192:     * 基準価格変更CSVヘッダー定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:201:            '基準価格' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:207:     * 基準価格変更CSV必須ヘッダー定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:216:            '基準価格' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:230:            '商品コード' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:340:            '基準価格' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:370:            'スマレジ商品コード' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:184:            '商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:197:            '商品コード' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php:26: * 既存 EC-CUBE 受注との突合は `Order.smaregi_code` (= スマレジ商品コード) で行う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:21:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:28:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:81:商品コード：{{ OrderItem.product_code }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:181:            '商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:195:            '商品コード' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:45:                                商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:28: * 既存 OTC 受注の特定は `Order.smaregi_code` (= スマレジ商品コード) と取引明細の `productCode`
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:43: *  - 既存受注の特定は `Order.smaregi_code` (= スマレジ商品コード) と
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:333:            '基準価格' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:49:                                商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:108:                                    商品コード：{{ OrderItem.product_code }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:252:                                {# (2-10)(2-20) 基準価格 | 販売価格 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:540:                                        {# (5-9)(5-10) 基準価格／販売価格 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:177:                        errors.push({ row: rowNum, message: '商品コードは必須です' });
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:207:                                    <th id="result_list_main__header_product_code">商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:209:                                    <th id="result_list_main__header_standard_price">基準価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:38:            // 振替先「検索」ボタン押下時：対象行の振替先商品コード入力欄を記憶し、商品検索モーダルを表示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:347:                                                {# 振替先：商品名/商品コード #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:166:                                        <th>商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:203:                                        <th>商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:205:                                        <th>基準価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:218:                                        {# 実在庫登録された商品のみ、商品コードを持つ #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:274:                                        <th>商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:277:                                        <th>基準価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:312:                                            <th>商品コード</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:315:                                            <th>基準価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:5:    商品名・商品コード検索対象、詳細検索、検索条件をクリア
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:31:                {# (2) 商品名・商品コード検索対象 〜 ステータス #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_csv_register.twig:57:                                {# (2-2)(2-3)(2-4) 商品名・商品コード・店舗 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:287:            'label' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:357:            'label' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:71:        // 基準価格(NM) 変更時に SP/MP/HP を NM × 割引率 で再計算（10円単位四捨五入）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:287:                                                    {# 基準価格 (NM) #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:299:                                                    {# 基準価格 (SP) #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:314:                                                    {# 基準価格 (MP) #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:328:                                                    {# 基準価格 (HP) #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:20:"19","1",,"Eccube\\Entity\\ProductClass","code",,"商品コード","19","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:95:"94","3",,"Eccube\\Entity\\OrderItem","product_code",,"商品コード","38","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:165:"165","4",,"Eccube\\Entity\\OrderItem","product_code",,"商品コード","38","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_simple_high_price.twig:3:{% set menus = ['product', 'product_csv_management', 'simple_high_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_simple_high_price.twig:5:{% block sub_title %}{{ 'admin.product.simple_high_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:158:        // セールフラグのチェックをオフにした場合、販売価格を基準価格で上書き
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:4:    (2) 商品名・商品コード検索対象 〜 ステータス
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:107:                {# (2) 仕様書レイアウト：商品名・商品コード検索対象 〜 ステータス（2列固定・チェックボックスは右端に出さない） #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:115:                            {# (2-1) 1行目：商品名・商品コード検索対象（チェックボックス） #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:128:                            {# (2-2)(2-3) 2行目：商品名 | 商品コード #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:344:                                        {# 基準価格合計 = 各Detail の規格 standard_price × 点数（destinationStock）の合計 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:37:        .table-stock-move-instruction td:nth-child(7) { min-width: 6rem; }  /* 基準価格合計 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:124:                '商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:146:                '基準価格' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:152:                'スマレジ商品コード' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:159:                $row['商品コード'] = $ProductClass->getCode();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:163:                $row['基準価格'] = $ProductClass->getStandardPrice();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:168:                $row['スマレジ商品コード'] = $ProductClass->getSmaregiProductCode() ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:100:                '商品コード' => $ProductClass->getCode(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:36:        'productCode' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:38:        'standardPrice' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:31:        'product_code' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:34:        'standard_price' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:26:        'product_code' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvRowFormatter.php:119:     * スマレジバーコードは「22」+ 商品コード（6桁）+ 販売価格（7桁）の形式で返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:31: * 在庫一覧の検索条件（セッション）に基づき、店舗×商品コードごとに1行のCSVを生成する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:42:        '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:38:        'smaregiProductCode' => 'スマレジ商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:52:                'productCode' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:55:                'standardPrice' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:72:                'standardPrice' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:30:    /** 棚戻しリスト SQL の pickingTypeSort: 基準価格 null */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:154:        // 基準価格null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:27: * 結合元明細（振向数量 > 0）の商品コードと現在の欠品点数を出力する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:32:    public const HEADER_PRODUCT_CODE = '商品コード';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:27: * 画面表示中の明細から商品コード・商品名・欠品点数を出力する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:33:        '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:27: * 画面表示中の明細から商品コード・商品名・実移動点数・差分点数を出力する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:32:        '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:36:        'product_code' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:41:        'standard_price' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:39:        'productCode' => '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:41:        'standardPrice' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:41:        'standardPrice' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Product/ProductClassStoreAction.php:62:            // セール中でない場合は販売価格の入力を無視し、基準価格を販売価格に上書きする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:45:        'standard_total_price' => '基準価格合計',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:40:        'standardPrice' => '基準価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:36:        'source_destination_standard_price_total' => '分割元・結合先商品の基準価格の合計',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:38:        'destination_source_standard_price_total' => '分割先・結合元商品の基準価格の合計',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ActionInput/StockListSearchInput.php:78:        // 詳細検索（商品一覧に準拠 + 基準価格）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:69:            // セール中でない場合は販売価格の入力を無視し、基準価格を販売価格に上書きする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:117:     * その他状態が表示不可の場合、NM状態または高額商品コードが設定されている商品クラスのみを残す
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:143:                '基準価格' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:165:                $row['基準価格'] = $ProductClass->getStandardPrice();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:284:        #[ORM\Column(name: 'high_price_code', type: Types::STRING, length: 128, nullable: true, options: ['comment' => '高額商品コード'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:290:        #[ORM\Column(name: 'standard_price', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => '基準価格'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:299:        #[ORM\Column(name: 'smaregi_product_code', type: Types::STRING, length: 128, nullable: true, options: ['comment' => 'スマレジ商品コード'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransferDetail.php:144:    #[ORM\Column(name: 'standard_total_price', type: Types::DECIMAL, precision: 12, scale: 2, options: ['comment' => '基準価格合計'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:56:     * @return BaseCsvColumn 商品コードの列定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:58:    public static function productCode(string $name = '商品コード'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:60:        return self::createStringColumn($name, '商品コード');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:76:     * @return BaseCsvColumn 在庫振替CSVの振替元商品コード列
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:78:    public static function stockTransferFromProductCode(string $name = '振替元商品コード'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:80:        return self::createStringColumn($name, '振替元商品コード');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:86:     * @return BaseCsvColumn 在庫振替CSVの振替先商品コード列
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:88:    public static function stockTransferToProductCode(string $name = '振替先商品コード'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:90:        return self::createStringColumn($name, '振替先商品コード');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:432:     * @return BaseCsvColumn 基準価格の列定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:434:    public static function standardPrice(string $name = '基準価格'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:436:        return self::createUnsignedNumericColumn($name, '基準価格', 9);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:456:     * @return BaseCsvColumn スマレジ商品コードの列定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:458:    public static function smaregiProductCode(string $name = 'スマレジ商品コード'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:460:        return self::createStringColumn($name, 'スマレジ商品コード');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveStoreAction.php:88:                // 移動分の基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:180:front.purchase.fill.col_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1104:front.product.code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1569:admin.error.not_exist_code: ": 商品コード %code%の商品が存在しないか、%name%のタグが紐づけられていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1893:admin.product.edit_bulk_update_buy_pricing: 買取・基準価格一括編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1896:admin.product.buy_sale_price_history.old_standard_price: 変更前基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1897:admin.product.buy_sale_price_history.new_standard_price: 変更後基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1904:admin.product.buy_sale_price_history.multi_search_label: 商品名(日/英)・カード名・商品コード・備考
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1905:admin.product.doubling_check: 重複商品コード確認
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1907:admin.product.doubling_code: 重複商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1908:admin.product.no_doubling_code: 重複している商品コードはありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1919:admin.product.buy_price_exceeds_standard: "ID:%productId%（%language%）の買取価格は基準価格「%standardPrice%」以下を指定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1950:# 高額商品価格変更CSV（商品コード・基準価格）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1951:admin.product.simple_high_price_csv: 高額商品価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1952:admin.product.simple_high_price_csv_upload_title: 高額商品価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1953:admin.product.simple_high_price_csv_format_title: 高額商品価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1954:admin.product.simple_high_price_csv.sale_alert: セール中商品の販売価格は変更できません。基準価格のみ更新されます。セール外の商品は基準価格・販売価格の両方を更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1955:admin.product.simple_high_price_csv.sell_price_not_updated: "%d行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1956:admin.product.simple_high_price_csv.no_matching_product_class: "%d行目: 対象の商品規格がありません。（商品公開ステータスが0かつ高額商品コードが設定された規格のみ対象です）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1958:# セール用高額商品価格変更CSV（商品コード・価格・セールフラグ等）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1962:admin.product.sale_high_price_csv.alert_off_sale_buy_only: "%d行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1973:# 基準価格変更CSV画面
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1974:admin.product.product_standard_price_csv: 基準価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1975:admin.product.product_standard_price_csv_upload_title: 基準価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1976:admin.product.product_standard_price_csv_format_title: 基準価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1978:admin.product.standard_price_csv.sale_product_sell_price_unchanged: "%d行目: セール中商品のため、販売価格は変更されません。（基準価格・買取価格は更新しました）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2036:admin.product.product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2039:admin.product.product_name_and_code: 商品名・商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2054:admin.product.multi_search_label: 商品名(日/英)・カード名(日/英)・商品ID・商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2138:admin.product.smaregi_product_code: スマレジ商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2143:admin.product.standard_price: 基準価格(円)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2147:admin.product.high_price_code: 高額商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2165:admin.product.standard_price_from: 基準価格(開始)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2166:admin.product.standard_price_to: 基準価格(終了)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2195:admin.product.standard_price_bulk_update: 買取・基準価格一括編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2239:admin.product.standard_price_nm: 基準価格(NM)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2240:admin.product.standard_price_sp: 基準価格(SP)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2241:admin.product.standard_price_mp: 基準価格(MP)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2242:admin.product.standard_price_hp: 基準価格(HP)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2277:admin.product.product_csv.product_code_col: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2335:admin.product.stock_change_csv.stock_product_code_col: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2336:admin.product.stock_change_csv.stock_product_code_description: 在庫変更対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2372:admin.csv.error.product.product_code_duplicated: "%d 行目の商品コードの値 %s は重複して登録されてるため更新できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2376:admin.csv.error.product.new_product_be_duplicate: "%d 行目の新規登録商品の商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2377:admin.csv.error.product.new_product_smaregi_product_code_duplicate: "%d 行目の新規登録商品のスマレジ商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2382:admin.csv.error.inventory_plan_detail.product_code_not_exists: "%d 行目の商品コード %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2383:admin.csv.error.inventory_plan_detail.product_stock_not_found: "%d 行目の商品コード %s は、棚卸計画で指定された店舗・在庫区分の在庫が存在しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2385:admin.csv.error.inventory_plan_detail.product_code_duplicated: "%d 行目の商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2386:admin.csv.error.inventory_plan_detail.product_code_non_unique: "%d 行目の商品コード %s が複数の商品規格に設定されているため特定できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2387:admin.csv.error.inventory_plan_detail.product_code_not_registered: "%d 行目の商品コード %s は棚卸計画に登録されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3551:tooltip.product.product_code: 自由に設定できる商品コードです。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3789:enterprise.admin.shop.multi_search_label: 商品名・商品ID・商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3979:admin.product.inventory_plan.csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3980:admin.product.inventory_plan.csv_modal.format_product_code_desc: 棚卸計画に登録する商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4000:admin.product.inventory_plan.product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4031:admin.inventory_plan.stock_reflect.product_update_lock_timeout: 商品コード %s は他の処理により更新中です。少し時間を空けてから再度更新してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4033:admin.inventory_plan.stock_reflect.minus_stock_error: 商品コード %s は棚卸結果の反映後、在庫がマイナスになってしまいます。棚卸詳細データを修正してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4515:admin.stock.move.product_name_code: 商品名 / 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4557:admin.stock.move.shortage_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4558:admin.stock.move.shortage_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4560:admin.stock.move.shortage_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4561:admin.stock.move.shortage_csv_modal.format_product_code_desc: 欠品対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4598:admin.stock.move.differential_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4599:admin.stock.move.differential_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4602:admin.stock.move.differential_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4603:admin.stock.move.differential_csv_modal.format_product_code_desc: 差分対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4680:admin.stock.list.base_price: 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4681:admin.stock.list.base_price_from: 基準価格（from）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4682:admin.stock.list.base_price_to: 基準価格（to）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4709:admin.stock.list.col.base_price: 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4740:admin.stock.transfer.product_name_code: 商品名/商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4741:admin.stock.transfer.product_code_search: 商品コード検索
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4742:admin.stock.transfer.product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4743:admin.stock.transfer.product_code_placeholder: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4751:admin.stock.transfer.dest_product_code_required: 振替先の商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4753:admin.stock.transfer.at_least_one_detail_required: 1行以上、振替先の商品コードと振替点数を入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4756:admin.stock.transfer.dest_product_code_ambiguous: 振替先の在庫が一意に特定できません。商品コードで指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4798:admin.stock.history.multi_search_label: 商品名(日/英)・カード名・商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4838:admin.stock.split_join.product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4839:admin.stock.split_join.product_code_placeholder: 商品コードで絞り込み
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4877:admin.stock.split_join.standard_price: 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4901:admin.stock.split_join.csv_product_not_found: '%line%行目: 商品コード「%code%」が同一店舗・在庫区分で見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4911:admin.stock.split_csv_modal.format_source_code: 分割元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4912:admin.stock.split_csv_modal.format_source_code_desc: 分割元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4915:admin.stock.split_csv_modal.format_target_code: 分割先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4916:admin.stock.split_csv_modal.format_target_code_desc: 分割先商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4926:admin.stock.join_csv_modal.format_destination_code: 結合先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4927:admin.stock.join_csv_modal.format_destination_code_desc: 結合先となる商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4930:admin.stock.join_csv_modal.format_source_code: 結合元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4931:admin.stock.join_csv_modal.format_source_code_desc: 結合元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4977:admin.stock.split.csv_column_invalid: 'CSVの列名が不正です。1行目に「商品コード」「分割先在庫数」が必要です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4978:admin.stock.split.csv_same_as_source: '%line%行目: 分割元と同じ商品コードは分割先に指定できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4987:admin.stock.split.new_destination_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4988:admin.stock.split.new_destination_csv_modal.format_product_code_desc: 分割先となる商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5028:admin.stock.join.new_source_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5029:admin.stock.join.new_source_csv_modal.format_product_code_desc: 結合元商品の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5051:admin.stock.join.shortage_result_line: 商品コード %code% — 欠品 %shortage% 点（結合数 %join%）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5057:admin.stock.join.shortage_csv_modal.format_product_code_desc: 商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5071:admin.stock.join.total_standard_price: 基準価格の合計
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5120:admin.stock.join.csv_column_invalid: 'CSVの列名が不正です。1行目に「商品コード」「結合元在庫数」が必要です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5226:admin.stock.move_instruction.standard_total_price: 基準価格合計
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5355:admin.stock.approval_list.line_items.product_name_code: 商品名/商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5371:admin.stock.approval_list.line_items.product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5424:admin.stock.move_transfer.csv_move_modal.col_product_code_hint: 商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5429:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code: 振替元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5430:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code: 振替先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5432:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint: 振替元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5433:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint: 振替先商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5475:admin.purchase.store.history.form.product_code.label: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5479:admin.purchase.store.history.form.standard_price.label: 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5593:admin.purchase.online.history.form.product_code.label: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5595:admin.purchase.online.history.form.standard_price.label: 基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5779:admin.order.buy_product_code: 購入商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5815:admin.search_product.product_code: 商品コード/言語/状態/基準価格/高額商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6147:admin.analysis.sales.form.multi.placeholder: 商品名(日/英)・カード名・商品コード・備考
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6174:admin.analysis.sales.result.product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:93:                    throw new \Exception(sprintf('振替先の商品コード「%s」が見つかりません', $destProductCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:102:                    throw new \Exception(sprintf('振替先の商品在庫（商品コード: %s）が見つかりません', $destProductCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockSplitJoin.php:63:    #[ORM\Column(name: 'standard_price', type: Types::DECIMAL, precision: 12, scale: 2, nullable: false, options: ['comment' => '基準価格'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPriceHistory.php:59:    #[ORM\Column(name: 'standard_price', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => '基準価格'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPriceHistory.php:62:    #[ORM\Column(name: 'old_standard_price', type: Types::INTEGER, nullable: true, options: ['default' => 0, 'unsigned' => true, 'comment' => '変更前基準価格'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:699:        #[ORM\Column(name: 'smaregi_code', type: Types::STRING, length: 20, nullable: true, options: ['comment' => 'スマレジ用商品コード'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockSplitJoinDetail.php:53:    /** 基準価格 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockSplitJoinDetail.php:54:    #[ORM\Column(name: 'standard_price', type: Types::DECIMAL, precision: 12, scale: 2, nullable: false, options: ['comment' => '基準価格'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveInstruction.php:116:    #[ORM\Column(name: 'standard_total_price', type: Types::DECIMAL, precision: 10, scale: 2, options: ['comment' => '基準価格合計'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbProductCodeMapping.php:28:    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '商品コード対応表id'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbProductCodeMapping.php:33:    #[ORM\Column(name: 'product_code', type: Types::STRING, length: 128, options: ['comment' => '商品コード'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbProductCodeMapping.php:36:    #[ORM\Column(name: 'old_product_code', type: Types::STRING, length: 128, options: ['comment' => '旧商品コード'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:30: * 1行目のヘッダーは列定義と一致し、2列目までが（商品コード・結合先在庫数）の形式であること。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:40:    /** 列: 商品コード */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:91:     * 在庫結合用CSV（商品コード・結合先在庫数）の列定義を組み立てる。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:95:        $this->productCodeColumn = ColumnDefinitions::productCode('商品コード')->setRequired(true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:107:     * 結合元商品CSV（商品コード・結合元在庫数）を解析し、ProductStock と数量の一覧を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:142:            if (!isset($rowData['商品コード'], $rowData['結合元在庫数'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:147:            $code = trim($rowData['商品コード']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportHandler.php:149:                $errors[] = trans('admin.common.csv_invalid_required', ['%line%' => $lineNum, '%name%' => '商品コード']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:47:    private const COL_SRC_CODE = '分割元商品コード';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:49:    private const COL_DEST_CODE = '分割先商品コード';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:67:    /** ファイル内で検出した分割元商品コード（1つのみ許可） */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:138:        // 分割元商品コード: 空欄→グローバル引き継ぎ、同一→許可、異なる→エラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:143:                $rowErrors[] = "{$lineNum}行目: 分割元商品コードが異なります。1ファイルに指定できる分割元は1件のみです。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:158:        // 分割先商品コード・在庫数は従来通り必須
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:160:            $rowErrors[] = "{$lineNum}行目: 分割先商品コードが空です。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:197:            // 分割元商品コード・分割数が未指定の場合はエラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:199:                $this->flashErrors[] = '分割元商品コードまたは分割数が指定されていません。いずれかの行に分割元商品コードと分割数を指定してください。';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:345:            $errors[] = sprintf('分割元商品コード「%s」が同一店舗・在庫区分で見つかりません。', $srcCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:360:                $errors[] = sprintf('分割先商品コード「%s」が同一店舗・在庫区分で見つかりません。', $destCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:379:            // ここでは基準価格は更新しないので同じ値を入れる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductShelfNumberUpdateImportHandler.php:125:     * 商品コードが dtb_product_class にちょうど1件あるか検証する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductShelfNumberUpdateImportHandler.php:126:     * 0件の場合は商品なしエラー、2件以上の場合は商品コード重複エラーで breakAll する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductShelfNumberUpdateImportHandler.php:200:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:86:                'admin.product.simple_high_price_csv.sell_price_not_updated',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:100:            'admin.product.simple_high_price_csv.no_matching_product_class',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:142:    /** 商品コードに該当する商品が存在するか検証 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:162:    /** 商品コードに該当する ProductClass が1件以下か検証（複数件ならエラー） */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:133:    /** @var CsvColumnInterface 列: 基準価格 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:161:    /** @var int スマレジ商品コードを連番で採番する為のシーケンス */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:192:        // CSV登録開始時に、次に採番するスマレジ商品コードの初期値を一度だけ取得しておく
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:466:     * @return bool 商品コードが存在する場合 true
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:503:     * 商品コードを生成する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:505:     * @param array<string, mixed> $source 商品コード生成に必要な情報
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:507:     * @return string 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:695:                // セールフラグが無効な場合は販売価格を基準価格で上書き
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:700:                    // （CSVの基準価格は standard_price のみ反映）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:730:                // update の場合、販売/買取/基準価格のいずれかが変更された場合のみ履歴を登録する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:974:     * スマレジ商品コードを決定する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:977:     * @param string|null $existingSmaregiProductCode 既存のスマレジ商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:979:     * @return string スマレジ商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:983:        // 既にスマレジ商品コードが設定されている場合は変更しない（空・空白のみは未設定扱いで再採番可）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:984:        // スマレジ連携フラグがONからOFFになったとしても、スマレジ商品コードはそのままとする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:989:        // スマレジ連携の対象でない場合は商品コードを設定しない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:996:        // 次に採番するスマレジ商品コードをインクリメントしておく
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:30: * 1行目のヘッダーは列定義と一致し、2列目までが（商品コード・分割先在庫数）の形式であること。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:38:    /** 列: 商品コード */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:94:     * 在庫分割用CSV（商品コード・分割先在庫数）の列定義を組み立てる。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:98:        $this->productCodeColumn = ColumnDefinitions::productCode('商品コード')->setRequired(true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:110:     * 分割先商品CSV（商品コード・分割先在庫数）を解析し、ProductStock と数量の一覧を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:144:            if (!isset($rowData['商品コード'], $rowData['分割先在庫数'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:149:            $code = trim($rowData['商品コード']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitCsvImportHandler.php:151:                return ['ok' => false, 'errors' => [trans('admin.common.csv_invalid_required', ['%line%' => $lineNum, '%name%' => '商品コード'])]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:24: * NM基準の基準価格・カードコンディション・割引から基準価格を算出する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:37:     * 基準価格を算出する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:39:     * - NM: 基準価格をそのまま使用する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:40:     * - SP/MP/HP: 基準価格 × 割引率 を 10円単位で切り上げする（PriceUtil::discount）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:41:     * - 割引設定が無い、または割引率が0以下の場合は基準価格をそのまま使用する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:45:     * @param int $baseStandardPrice NM基準の基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:49:        // NMは割引率に関わらず基準価格をそのまま使用する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:97:        // CSVの基準価格・買取価格はNM基準。SP/MP/HPは各規格の割引・買取条件で算出する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:117:            // 基準価格: NMはCSV値、SP/MP/HPは「商品の割引 × カードコンディション」のrateで算出
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiConditionalRequiredValidator.php:24: * スマレジ連携フラグが「1(有効)」の場合、スマレジ商品コードと部門IDを必須とするバリデーター
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiConditionalRequiredValidator.php:36:     * @param CsvColumnInterface $smaregiProductCodeColumn スマレジ商品コード列
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiConditionalRequiredValidator.php:73:        // スマレジ商品コードと部門IDが存在する場合はバリデーションを通過
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:291:     * 商品コードが重複していて更新できないエラーを追加する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:391:     * 新規登録する商品について、商品コードが重複するエラーを追加する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:394:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:410:     * 新規登録する商品について、スマレジ商品コードが重複するエラーを追加する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:413:     * @param string $smaregiProductCode スマレジ商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveCsvImportHandler.php:161:        // 移動分の基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:147:        // 今回のcsv登録では買取価格・基準価格の更新はないので一緒の値を入れる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:33: * CSV形式: 商品コード, 欠品点数（2列）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:34: * 結合元明細（振向数量 > 0）を商品コードで照合し、欠品点数をバリデーションして返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:47:    private const COL_PRODUCT_CODE = '商品コード';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:95:            $ms->addRawMessage("{$lineNum}行目: 商品コードが空です。");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:146:                    '%d行目: 商品コード「%s」がこの結合の結合元に見つかりません。',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:251:                return ['ok' => false, 'errors' => [sprintf('%d行目: 商品コード「%s」がこの結合の結合元に見つかりません。', $lineNum, $code)]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:314:     * 振向数量 > 0 の明細を商品コード→明細リストのマップとして返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:123:    /** @var CsvColumnInterface 列: 基準価格 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:132:    /** @var CsvColumnInterface 列: 商品コード */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:138:    /** @var CsvColumnInterface 列: スマレジ商品コード */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:586:            // セールフラグが無効な場合は販売価格を基準価格で上書き
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:198:     * @param string $productCode 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:31: * 結合元商品CSV（2列：商品コード・結合元在庫数）を読み込み、結合元情報をSESSIONに保存するハンドラ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:44:    private const COLUMN_PRODUCT_CODE = '商品コード';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:104:            $messageStore->addRawMessage("{$lineNum}行目: 商品コードが空です。");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:125:            $messageStore->addRawMessage("{$lineNum}行目: 商品コード「{$code}」は同一店舗・在庫区分で見つかりません。");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:215:                $errors[] = "{$lineNum}行目: 商品コードが空です。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:238:                $errors[] = "{$lineNum}行目: 商品コード「{$code}」は同一店舗・在庫区分で見つかりません。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:48:    private const COL_DEST_CODE = '結合先商品コード';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:50:    private const COL_SRC_CODE = '結合元商品コード';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:69:    /** ファイル内で検出した結合先商品コード（1つのみ許可） */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:141:        // 結合先商品コード・結合数の検証:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:149:                $rowErrors[] = "{$lineNum}行目: 結合先商品コードが異なります。1ファイルに指定できる結合先は1件のみです。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:164:            $rowErrors[] = "{$lineNum}行目: 結合元商品コードが空です。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:206:            // 結合先商品コード・結合数が未指定の場合はエラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:208:                $this->flashErrors[] = '結合先商品コードまたは結合数が指定されていません。いずれかの行に結合先商品コードと結合数を指定してください。';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:356:            $errors[] = sprintf('結合先商品コード「%s」が同一店舗・在庫区分で見つかりません。', $destCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:378:                $errors[] = sprintf('結合元商品コード「%s」（在庫区分 %s）が見つかりません。', $srcCode, $cat);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:35:        '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:200:     * 取込対象行で商品コードが重複していないことを検証する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:222:     * 商品コードが在庫移動明細に存在することを検証する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:287:     * 移動明細を商品コードごとに集計する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveDifferentialImportHandler.php:36:        '商品コード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:40:    /** @var CsvColumnInterface 列: 商品コード */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:203:                sprintf('%d行目: 商品コード「%s」が見つかりません', $row->getRowNumber(), $productCode)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:31: * 分割先商品CSV（2列：商品コード・分割先在庫数）を読み込み、分割先をSESSIONに保存するハンドラ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:48:    /** 列: 商品コード */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:119:            $messageStore->addRawMessage("{$lineNum}行目: 列数が不足しています（商品コード・分割先在庫数の2列が必要です）。");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:134:            $messageStore->addRawMessage("{$lineNum}行目: 商品コードが空です。");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:162:            $messageStore->addRawMessage("{$lineNum}行目: 商品コード「{$code}」は同一店舗・在庫区分で見つかりません。");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:246:            if (!isset($rowData['商品コード'], $rowData['分割先在庫数'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:247:                return ['ok' => false, 'errors' => ['1行目の列名を確認してください（商品コード, 分割先在庫数）。']];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:255:            $code = trim($rowData['商品コード']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:257:                $errors[] = "{$lineNum}行目: 商品コードが空です。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:266:                $errors[] = "{$lineNum}行目: 商品コード「{$code}」の分割先在庫数が不正です。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:273:                $errors[] = "{$lineNum}行目: 商品コード「{$code}」の分割先在庫数は1以上を指定してください。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:287:                $errors[] = "{$lineNum}行目: 商品コード「{$code}」は同一店舗・在庫区分で見つかりません。";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:334:        $this->productCodeColumn = ColumnDefinitions::productCode('商品コード')->setRequired(true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:87:        // 重複チェック用に登録済み商品コードを取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:103:                    $row['商品コード'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:107:                    throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.inventory_plan_detail.product_stock_not_found'), $rowIndex, $row['商品コード']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:110:                // 同じ商品コードが複数の商品規格に登録されているため特定できない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:111:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.inventory_plan_detail.product_code_non_unique'), $rowIndex, $row['商品コード']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:115:            if (in_array($row['商品コード'], $registeredCodes, true)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:116:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.inventory_plan_detail.product_code_duplicated'), $rowIndex, $row['商品コード']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:119:            $registeredCodes[] = $row['商品コード'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:175:            $productCode = $row['商品コード'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:277:            '商品コード' => $inventoryPlanDetail['productCode'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryCsv.php:100:                '商品コード' => $ProductClass->getCode(),

 succeeded in 143ms:
     1	CardCsvController.php
     2	CategoryCsvController.php
     3	CsvImportController.php
     4	GoodsCsvController.php
     5	ProductCsvController.php
     6	ProductPriceCsvController.php
     7	ProductSaleHighPriceCsvController.php
     8	ProductSectionCsvController.php
     9	ProductShelfNumberCsvController.php
    10	ProductSimpleHighPriceCsvController.php
    11	ProductStandardPriceCsvController.php
    12	ProductStatusCsvController.php
    13	ProductTagCsvController.php
    14	TagSalesAnalysisCsvController.php

 succeeded in 229ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig:205:            {{ 'front.mypage.purchase_history.detail.bulk.low_price_notice'|trans({ '%min%': b.bulkMinPrice }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig:240:                {{ 'front.mypage.purchase_history.detail.bulk.agree_low_price_all'|trans({ '%min%': b.bulkMinPrice }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:876:front.mypage.purchase_history.detail.bulk.low_price_notice: "※ まとめて買取では、%min%円未満のカードの個別のキャンセルは承っておりません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:877:front.mypage.purchase_history.detail.bulk.agree_low_price_all: "%min%円未満のカードをすべて売却する"

 succeeded in 204ms:
codex
低価格帯の固有語では実装ヒットがありませんでした。次に、設計が「基準価格変更CSV登録をベース」と書くため、既存の基準価格CSV登録がどこまで似ているかを確認し、finding 3の「2列のみ」という比較が妥当か見ます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Controller\Admin\Product\Csv;
    17	
    18	use Eccube\Controller\AbstractController;
    19	use Eccube\Entity\Master\MtbCsvImportType;
    20	use Eccube\Entity\Member;
    21	use Eccube\Form\Type\Admin\CsvImportType;
    22	use Eccube\Repository\DtbCsvImportHistoryRepository;
    23	use Eccube\Repository\DtbPriceHistoryRepository;
    24	use Eccube\Repository\ProductClassRepository;
    25	use Eccube\Repository\ProductRepository;
    26	use Eccube\Service\Csv\Importer\CsvImporter;
    27	use Eccube\Service\Csv\Importer\Event\ProductStandardPriceImportHandler;
    28	use Eccube\Service\Csv\Importer\Event\Util\DiscountBuyPriceCalculator;
    29	use Eccube\Service\Csv\Importer\Event\Util\StandardPriceCalculator;
    30	use Eccube\Service\CsvExportService;
    31	use Eccube\Service\Smaregi\SmaregiProductClassCsvImportUpsertCoordinatorFactory;
    32	use Knp\Component\Pager\PaginatorInterface;
    33	use Symfony\Component\HttpFoundation\File\UploadedFile;
    34	use Symfony\Component\HttpFoundation\RedirectResponse;
    35	use Symfony\Component\HttpFoundation\Request;
    36	use Symfony\Component\HttpFoundation\Response;
    37	use Symfony\Component\HttpFoundation\StreamedResponse;
    38	use Symfony\Component\Routing\Attribute\Route;
    39	
    40	class ProductStandardPriceCsvController extends AbstractController
    41	{
    42	    public function __construct(
    43	        private readonly ProductClassRepository $productClassRepository,
    44	        private readonly ProductRepository $productRepository,
    45	        private readonly DtbPriceHistoryRepository $dtbPriceHistoryRepository,
    46	        private readonly CsvExportService $csvExportService,
    47	        private readonly PaginatorInterface $paginator,
    48	        private readonly DtbCsvImportHistoryRepository $csvImportHistoryRepository,
    49	        private readonly SmaregiProductClassCsvImportUpsertCoordinatorFactory $smaregiProductClassCsvImportUpsertCoordinatorFactory,
    50	        private readonly StandardPriceCalculator $standardPriceCalculator,
    51	        private readonly DiscountBuyPriceCalculator $discountBuyPriceCalculator,
    52	    ) {
    53	    }
    54	
    55	    /**
    56	     * 基準価格変更CSV雛形ファイルダウンロード
    57	     *
    58	     * @return StreamedResponse
    59	     */
    60	    #[Route(path: '/%eccube_admin_route%/product/product_standard_price/csv_template', name: 'admin_product_product_standard_price_csv_template', methods: ['GET'])]
    61	    public function csvTemplate(): StreamedResponse
    62	    {
    63	        return $this->csvTemplateStreamedResponse(
    64	            $this->csvExportService,
    65	            $this->getCsvHeader(),
    66	            'product_standard_price_template.csv'
    67	        );
    68	    }
    69	
    70	    /**
    71	     * 基準価格変更CSVアップロード画面
    72	     *
    73	     * @param Request $request
    74	     *
    75	     * @return Response
    76	     */
    77	    #[Route(path: '/%eccube_admin_route%/product/product_standard_price_csv_upload', name: 'admin_product_product_standard_price_csv_upload', methods: ['GET'])]
    78	    public function csv(Request $request): Response
    79	    {
    80	        $form = $this->createForm(CsvImportType::class);
    81	        $form->handleRequest($request);
    82	
    83	        $pagination = $this->getCsvImportHistoryPaginationParams(
    84	            $request,
    85	            'admin.product.product_standard_price_csv.page_count',
    86	            'admin.product.product_standard_price_csv.page_no',
    87	        );
    88	        $pageCount = $pagination['pageCount'];
    89	        $pageNo = $pagination['pageNo'];
    90	        $pageCountOptions = $pagination['pageCountOptions'];
    91	
    92	        $qb = $this->csvImportHistoryRepository->getQueryBuilderByCsvImportType(MtbCsvImportType::PRODUCT_STANDARD_PRICE_IMPORT_CSV_ID);
    93	        $importHistoriesPagination = $this->paginator->paginate($qb, $pageNo, $pageCount);
    94	
    95	        $headers = $this->getCsvHeader();
    96	
    97	        return $this->render('@admin/Product/csv_product_standard_price.twig', [
    98	            'form' => $form->createView(),
    99	            'headers' => $headers,
   100	            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
   101	            'csv_box_title' => 'admin.product.product_standard_price_csv_upload_title',
   102	            'csv_format_title' => 'admin.product.product_standard_price_csv_format_title',
   103	            'form_action_route' => 'admin_product_product_standard_price_import',
   104	            'template_download_route' => 'admin_product_product_standard_price_csv_template',
   105	            'import_histories_pagination' => $importHistoriesPagination,
   106	            'history_page_route' => 'admin_product_product_standard_price_csv_upload',
   107	            'page_no' => $pageNo,
   108	            'page_count' => $pageCount,
   109	            'pageMax' => $pageCountOptions,
   110	        ]);
   111	    }
   112	
   113	    /**
   114	     * 基準価格変更CSV取込
   115	     *
   116	     * @param Request $request
   117	     *
   118	     * @return RedirectResponse
   119	     */
   120	    #[Route(path: '/%eccube_admin_route%/product/product_standard_price/import', name: 'admin_product_product_standard_price_import', methods: ['POST'])]
   121	    public function import(Request $request): RedirectResponse
   122	    {
   123	        /** @var Member $Member */
   124	        $Member = $this->getUser();
   125	
   126	        $form = $this->formFactory->createBuilder(CsvImportType::class)->getForm();
   127	        $form->handleRequest($request);
   128	
   129	        if (!$form->isValid()) {
   130	            foreach ($form->getErrors() as $error) {
   131	                $this->addError($error->getMessage(), 'admin');
   132	            }
   133	
   134	            return $this->redirectToRoute('admin_product_product_standard_price_csv_upload');
   135	        }
   136	        /** @var UploadedFile|null $formFile */
   137	        $formFile = $form['import_file']->getData();
   138	
   139	        if ($formFile === null) {
   140	            $this->addError('admin.common.csv_invalid_format', 'admin');
   141	
   142	            return $this->redirectToRoute('admin_product_product_standard_price_csv_upload');
   143	        }
   144	
   145	        if ($this->countCsvRows($formFile) >= static::ADMIN_CSV_IMPORT_MAX_ROWS) {
   146	            $this->addError($this->getCsvImportMaxRowsExceededMessage(), 'admin');
   147	
   148	            return $this->redirectToRoute('admin_product_product_standard_price_csv_upload');
   149	        }
   150	
   151	        log_info('基準価格変更CSV登録開始');
   152	
   153	        $handler = new ProductStandardPriceImportHandler(
   154	            $this->productRepository,
   155	            $this->productClassRepository,
   156	            $this->dtbPriceHistoryRepository,
   157	            $this->smaregiProductClassCsvImportUpsertCoordinatorFactory->create('基準価格変更CSVインポート後'),
   158	            $this->standardPriceCalculator,
   159	            $this->discountBuyPriceCalculator,
   160	        );
   161	        $importer = new CsvImporter(
   162	            $this->entityManager,
   163	            $this->translator,
   164	            $this->eccubeConfig,
   165	            $handler,
   166	            $Member
   167	        );
   168	        $result = $importer->import($formFile);
   169	
   170	        if ($result->hasError()) {
   171	            log_info('基準価格変更CSV登録 異常終了');
   172	            foreach ($result->getErrors() as $error) {
   173	                $this->addError($error['message'], 'admin');
   174	            }
   175	        } else {
   176	            $this->addSuccess('admin.register.complete', 'admin');
   177	            log_info('基準価格変更CSV登録完了', ['count' => $result->getCount()]);
   178	            foreach ($result->getInfos() as $info) {
   179	                $this->addWarning($info['message'], 'admin');
   180	            }
   181	            $this->csvImportHistoryRepository->insertCsvImportHistory(
   182	                MtbCsvImportType::PRODUCT_STANDARD_PRICE_IMPORT_CSV_ID,
   183	                $formFile->getClientOriginalName(),
   184	                $Member->getId()
   185	            );
   186	        }
   187	
   188	        return $this->redirectToRoute('admin_product_product_standard_price_csv_upload');
   189	    }
   190	
   191	    /**
   192	     * 基準価格変更CSVヘッダー定義
   193	     *
   194	     * @return array<string, string>
   195	     */
   196	    private function getCsvHeader(): array
   197	    {
   198	        return [
   199	            '商品ID' => '',
   200	            '言語ID' => '',
   201	            '基準価格' => '',
   202	            '買取価格' => '',
   203	        ];
   204	    }
   205	
   206	    /**
   207	     * 基準価格変更CSV必須ヘッダー定義
   208	     *
   209	     * @return array<string, string>
   210	     */
   211	    private function getRequiredCsvHeader(): array
   212	    {
   213	        return [
   214	            '商品ID' => '商品ID',
   215	            '言語ID' => '言語ID',
   216	            '基準価格' => '基準価格',
   217	            '買取価格' => '買取価格',
   218	        ];
   219	    }
   220	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "getCsvHeader|原価単価|現行基準価格|現行買取価格|新基準価格|新買取価格|標準価格|基準価格変更CSV|ProductStandardPrice|StandardPrice" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Controller\Admin\Product\Csv;
    17	
    18	use Eccube\Controller\AbstractController;
    19	use Eccube\Entity\Master\MtbCsvImportType;
    20	use Eccube\Entity\Member;
    21	use Eccube\Form\Type\Admin\CsvImportType;
    22	use Eccube\Repository\DtbCsvImportHistoryRepository;
    23	use Eccube\Repository\DtbPriceHistoryRepository;
    24	use Eccube\Repository\ProductClassRepository;
    25	use Eccube\Repository\ProductRepository;
    26	use Eccube\Service\Csv\Importer\CsvImporter;
    27	use Eccube\Service\Csv\Importer\Event\ProductPriceImportHandler;
    28	use Eccube\Service\Csv\Importer\Event\Util\DiscountBuyPriceCalculator;
    29	use Eccube\Service\CsvExportService;
    30	use Eccube\Service\Smaregi\SmaregiProductClassCsvImportUpsertCoordinatorFactory;
    31	use Knp\Component\Pager\PaginatorInterface;
    32	use Symfony\Component\HttpFoundation\File\UploadedFile;
    33	use Symfony\Component\HttpFoundation\RedirectResponse;
    34	use Symfony\Component\HttpFoundation\Request;
    35	use Symfony\Component\HttpFoundation\Response;
    36	use Symfony\Component\HttpFoundation\StreamedResponse;
    37	use Symfony\Component\Routing\Attribute\Route;
    38	
    39	class ProductPriceCsvController extends AbstractController
    40	{
    41	    public function __construct(
    42	        private readonly ProductClassRepository $productClassRepository,
    43	        private readonly ProductRepository $productRepository,
    44	        private readonly CsvExportService $csvExportService,
    45	        private readonly PaginatorInterface $paginator,
    46	        private readonly DtbCsvImportHistoryRepository $csvImportHistoryRepository,
    47	        private readonly DtbPriceHistoryRepository $priceHistoryRepository,
    48	        private readonly SmaregiProductClassCsvImportUpsertCoordinatorFactory $smaregiProductClassCsvImportUpsertCoordinatorFactory,
    49	        private readonly DiscountBuyPriceCalculator $discountBuyPriceCalculator,
    50	    ) {
    51	    }
    52	
    53	    /**
    54	     * 商品価格CSV雛形ファイルダウンロード
    55	     *
    56	     * @return StreamedResponse
    57	     */
    58	    #[Route(path: '/%eccube_admin_route%/product/product_price/csv_template', name: 'admin_product_product_price_csv_template', methods: ['GET'])]
    59	    public function csvTemplate(): StreamedResponse
    60	    {
    61	        return $this->csvTemplateStreamedResponse(
    62	            $this->csvExportService,
    63	            $this->getCsvHeader(),
    64	            'product_price_template.csv'
    65	        );
    66	    }
    67	
    68	    /**
    69	     * 商品価格CSVアップロード画面
    70	     *
    71	     * @param Request $request
    72	     *
    73	     * @return Response
    74	     */
    75	    #[Route(path: '/%eccube_admin_route%/product/product_price/product_price_csv_upload', name: 'admin_product_product_price_csv_upload', methods: ['GET'])]
    76	    public function csv(Request $request): Response
    77	    {
    78	        $form = $this->createForm(CsvImportType::class);
    79	        $form->handleRequest($request);
    80	
    81	        $pagination = $this->getCsvImportHistoryPaginationParams(
    82	            $request,
    83	            'admin.product.product_price_csv.page_count',
    84	            'admin.product.product_price_csv.page_no',
    85	            50,
    86	        );
    87	        $pageCount = $pagination['pageCount'];
    88	        $pageNo = $pagination['pageNo'];
    89	        $pageCountOptions = $pagination['pageCountOptions'];
    90	
    91	        $qb = $this->csvImportHistoryRepository->getQueryBuilderByCsvImportType(MtbCsvImportType::PRODUCT_PRICE_IMPORT_CSV_ID);
    92	        $importHistoriesPagination = $this->paginator->paginate($qb, $pageNo, $pageCount);
    93	
    94	        $headers = $this->getCsvHeader();
    95	
    96	        return $this->render('@admin/Product/csv_product_price.twig', [
    97	            'form' => $form->createView(),
    98	            'headers' => $headers,
    99	            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
   100	            'csv_box_title' => 'admin.product.product_price_csv_upload_title',
   101	            'csv_format_title' => 'admin.product.product_price_csv_format_title',
   102	            'form_action_route' => 'admin_product_product_price_import',
   103	            'template_download_route' => 'admin_product_product_price_csv_template',
   104	            'import_histories_pagination' => $importHistoriesPagination,
   105	            'history_page_route' => 'admin_product_product_price_csv_upload',
   106	            'page_no' => $pageNo,
   107	            'page_count' => $pageCount,
   108	            'pageMax' => $pageCountOptions,
   109	        ]);
   110	    }
   111	
   112	    /**
   113	     * 商品価格CSV取込
   114	     *
   115	     * @param Request $request
   116	     *
   117	     * @return RedirectResponse
   118	     */
   119	    #[Route(path: '/%eccube_admin_route%/product/product_price/import', name: 'admin_product_product_price_import', methods: ['POST'])]
   120	    public function import(Request $request): RedirectResponse
   121	    {
   122	        /** @var Member $Member */
   123	        $Member = $this->getUser();
   124	
   125	        $form = $this->formFactory->createBuilder(CsvImportType::class)->getForm();
   126	        $form->handleRequest($request);
   127	
   128	        if (!$form->isValid()) {
   129	            foreach ($form->getErrors() as $error) {
   130	                $this->addError($error->getMessage(), 'admin');
   131	            }
   132	
   133	            return $this->redirectToRoute('admin_product_product_price_csv_upload');
   134	        }
   135	        /** @var UploadedFile|null $formFile */
   136	        $formFile = $form['import_file']->getData();
   137	
   138	        // nullになることもあるので追加
   139	        if ($formFile === null) {
   140	            $this->addError('admin.common.csv_invalid_format', 'admin');
   141	
   142	            return $this->redirectToRoute('admin_product_product_price_csv_upload');
   143	        }
   144	
   145	        if ($this->countCsvRows($formFile) >= static::ADMIN_CSV_IMPORT_MAX_ROWS) {
   146	            $this->addError($this->getCsvImportMaxRowsExceededMessage(), 'admin');
   147	
   148	            return $this->redirectToRoute('admin_product_product_price_csv_upload');
   149	        }
   150	
   151	        log_info('セール用価格変更CSV登録開始');
   152	
   153	        $handler = new ProductPriceImportHandler(
   154	            $this->entityManager,
   155	            $this->productRepository,
   156	            $this->productClassRepository,
   157	            $this->priceHistoryRepository,
   158	            $this->smaregiProductClassCsvImportUpsertCoordinatorFactory->create('セール用価格変更CSVインポート後'),
   159	            $this->discountBuyPriceCalculator,
   160	        );
   161	        $importer = new CsvImporter(
   162	            $this->entityManager,
   163	            $this->translator,
   164	            $this->eccubeConfig,
   165	            $handler,
   166	            $Member
   167	        );
   168	        $result = $importer->import($formFile);
   169	
   170	        if ($result->hasError()) {
   171	            log_info('セール用価格変更CSV登録 異常終了');
   172	            foreach ($result->getErrors() as $error) {
   173	                $this->addError($error['message'], 'admin');
   174	            }
   175	        } else {
   176	            $this->addSuccess('admin.register.complete', 'admin');
   177	            log_info('セール用価格変更CSV登録完了', ['count' => $result->getCount()]);
   178	            $this->csvImportHistoryRepository->insertCsvImportHistory(
   179	                MtbCsvImportType::PRODUCT_PRICE_IMPORT_CSV_ID,
   180	                $formFile->getClientOriginalName(),
   181	                $Member->getId()
   182	            );
   183	        }
   184	
   185	        return $this->redirectToRoute('admin_product_product_price_csv_upload');
   186	    }
   187	
   188	    /**
   189	     * 商品価格CSVヘッダー定義
   190	     *
   191	     * @return array<string, string>
   192	     */
   193	    private function getCsvHeader(): array
   194	    {
   195	        return [
   196	            '商品ID' => '',
   197	            '言語(ID)' => '',
   198	            '販売価格' => '',
   199	            '買取価格' => '',
   200	            'セールフラグ' => '0: セールではない, 1: セールあり',
   201	            '帯URL' => '',
   202	            'タグ(ID)' => 'カンマ区切りで複数指定可能',
   203	        ];
   204	    }
   205	
   206	    /**
   207	     * 商品価格CSV必須ヘッダー定義
   208	     *
   209	     * @return array<string, string>
   210	     */
   211	    private function getRequiredCsvHeader(): array
   212	    {
   213	        return [
   214	            '商品ID' => '商品ID',
   215	            '言語(ID)' => '言語(ID)',
   216	            '販売価格' => '販売価格',
   217	            '買取価格' => '買取価格',
   218	            'セールフラグ' => 'セールフラグ',
   219	        ];
   220	    }
   221	}

 succeeded in 1ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1896:     * @param array<string, int|string> $conditionStandardPrices
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1898:    public function updateBuyPriceForAllConditions(int $productClassId, int $nmPrice, int $standardPrice, array $buyDiscountRateArray = [], array $conditionProductClassIds = [], array $conditionStandardPrices = []): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1906:        $standardPriceSp = (int) ($conditionStandardPrices['SP'] ?? $standardPrice);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1907:        $standardPriceMp = (int) ($conditionStandardPrices['MP'] ?? $standardPrice);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1908:        $standardPriceHp = (int) ($conditionStandardPrices['HP'] ?? $standardPrice);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2248:    public function replaceStandardPriceOnly(string $productCode, int $standardPrice): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2280:    public function replaceStandardPriceAndPrice02(string $productCode, int $standardPrice): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2690:     * 基準価格変更CSV用。取得済みの商品規格行ごとに価格・原価単価を更新する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2692:     * 各行の sale_flg（{@see findProductClassesForStandardPriceUpdate} と同一形状）に応じて分岐する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2698:     * @param array<int, array<string, mixed>> $productClasses {@see findProductClassesForStandardPriceUpdate} の結果
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2701:     * 基準価格変更CSVの1規格分の更新を行う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2710:    public function updateProductClassForStandardPriceCsv(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2967:     * 基準価格変更CSV用。商品ID・言語IDに該当する高額商品コードなしの商品規格を取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2971:    public function findProductClassesForStandardPriceUpdate(int $productId, int $languageId): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryCsv.php:116:                '変更前原価単価' => $StockHistory->getUnitCostPriceBefore(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryCsv.php:117:                '変更後原価単価' => $StockHistory->getUnitCostPriceAfter(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:88:     * @param BaseInfo|null $mainBaseInfo 本店BaseInfo（原価単価は本店EC在庫の total_cost/stock を四捨五入）。null の場合は内部で解決する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:146:                '原価単価' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:165:                $row['基準価格'] = $ProductClass->getStandardPrice();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:168:                $row['原価単価'] = $ProductClass->getMainEccubeUnitCost($mainBaseInfo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:63:    public static function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:106:     * 必須列キー（表示順）。ラベルは getCsvHeader() のみを正とする。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:120:     * @throws \LogicException 必須キーが getCsvHeader に存在しないとき
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:124:        $all = self::getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:128:                throw new \LogicException('カードCSV必須キー '.$key.' が getCsvHeader にありません。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:192:            csvHeader: self::getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:55:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:85:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:176:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:86:     * @param BaseInfo|null $mainBaseInfo 本店BaseInfo（原価単価は本店EC在庫の total_cost/stock を四捨五入）。null の場合は内部で解決する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:149:                '原価単価' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:163:                $row['基準価格'] = $ProductClass->getStandardPrice();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:166:                $row['原価単価'] = $ProductClass->getMainEccubeUnitCost($mainBaseInfo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:67:            $this->getCsvHeaderForTemplateDownload(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:97:        $headers = $this->getCsvHeaderForTemplateDownload();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:194:    private function getCsvHeaderForTemplateDownload(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:197:        foreach ($this->getCsvHeader() as $label => $def) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:210:        foreach ($this->getCsvHeader() as $label => $def) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:222:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:355:            '原価単価' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:55:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:86:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:184:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php:55:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php:85:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php:179:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:57:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:87:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:181:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:324:            '原価単価' => '原価単価',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:388:            '原価単価' => '原価単価',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:431:            '原価単価' => "原価単価\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:59:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:89:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:183:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:54:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:97:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:188:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:57:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:83:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:178:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:78:     * @param BaseInfo|null $mainBaseInfo 本店BaseInfo（原価単価は本店EC在庫の total_cost/stock を四捨五入）。null の場合は内部で解決する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:103:                    $ProductClass->getStandardPrice(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:635:     * @return BaseCsvColumn 原価単価の列定義（出力フォーマット互換用。インポート時は更新しない）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:637:    public static function costUnitPrice(string $name = '原価単価'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:639:        return self::dummyColumn($name, '原価単価');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:27:use Eccube\Service\Csv\Importer\Event\ProductStandardPriceImportHandler;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:29:use Eccube\Service\Csv\Importer\Event\Util\StandardPriceCalculator;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:40:class ProductStandardPriceCsvController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:50:        private readonly StandardPriceCalculator $standardPriceCalculator,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:56:     * 基準価格変更CSV雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:65:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:71:     * 基準価格変更CSVアップロード画面
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:95:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:114:     * 基準価格変更CSV取込
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:151:        log_info('基準価格変更CSV登録開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:153:        $handler = new ProductStandardPriceImportHandler(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:157:            $this->smaregiProductClassCsvImportUpsertCoordinatorFactory->create('基準価格変更CSVインポート後'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:171:            log_info('基準価格変更CSV登録 異常終了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:177:            log_info('基準価格変更CSV登録完了', ['count' => $result->getCount()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:192:     * 基準価格変更CSVヘッダー定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:196:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:207:     * 基準価格変更CSV必須ヘッダー定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:33:use Eccube\Service\Csv\Importer\Event\Util\StandardPriceCalculator;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:63:        private readonly StandardPriceCalculator $standardPriceCalculator,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:75:            $this->getCsvHeaderForDisplay(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:110:            'headers' => $this->getCsvHeaderForDisplay(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:348:            '原価単価' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:374:    private function getCsvHeaderForDisplay(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:63:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:94:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:193:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:57:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:88:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:179:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveCsvImportHandler.php:162:        $standardPrice = $ProductClass->getStandardPrice();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:84:            $this->productClassRepository->replaceStandardPriceOnly($productCode, $standardPrice);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:94:            $this->productClassRepository->replaceStandardPriceAndPrice02($productCode, $standardPrice);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:41:use Eccube\Service\Csv\Importer\Event\Util\StandardPriceCalculator;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:142:    /** @var CsvColumnInterface 列: 原価単価（出力フォーマット互換用。インポート時は更新しない） */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:177:        private readonly StandardPriceCalculator $standardPriceCalculator,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:681:            $newStandardPrice = $this->standardPriceCalculator->calculate(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:697:                    $sellPrice = $newStandardPrice;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:710:                        'standardPrice' => $newStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:733:                $oldStandardPrice = (int) ($productCardCondition['standardPrice'] ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:734:                if ($sellPrice !== $oldSellPrice || $buyPrice !== $oldBuyPrice || $newStandardPrice !== $oldStandardPrice) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:744:                    $PriceHistory->setStandardPrice($newStandardPrice);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:745:                    $PriceHistory->setOldStandardPrice($oldStandardPrice);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:761:                            'standardPrice' => $newStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvRowFormatter.php:53:            'standardPrice' => $this->formatStandardPrice($standardPrice),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvRowFormatter.php:107:    private function formatStandardPrice(?int $standardPrice): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:29:class StandardPriceCalculator
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:45:     * @param int $baseStandardPrice NM基準の基準価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:47:    public function calculate(?int $discountId, int $cardConditionId, int $baseStandardPrice): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:51:            return $baseStandardPrice;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:55:            return $baseStandardPrice;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:63:            return $baseStandardPrice;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:68:            return $baseStandardPrice;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:71:        return PriceUtil::discount($baseStandardPrice, $rate);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:219:        $standardPrice = $FromProductClass->getStandardPrice();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:380:            $oldStandardPrice = (int) bcfloor((string) ($productClass['standardPrice'] ?? '0'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:381:            $newStandardPrice = (int) bcfloor((string) ($productClass['standardPrice'] ?? '0'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:393:                $oldStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:396:                $newStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:109:        $oldStandardPrice = (int) ($ProductClass->getStandardPrice() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:129:            $newSellPrice = $oldStandardPrice;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:153:            $oldStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:156:            $oldStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:23:use Eccube\Service\Csv\Importer\Event\Util\StandardPriceCalculator;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:29:class ProductStandardPriceImportHandler extends BaseCsvImportHandler
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:44:        private readonly StandardPriceCalculator $standardPriceCalculator,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:98:        $csvStandardPrice = (int) bcfloor((string) $this->standardPriceColumn->getValue($row));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:101:        $ProductClasses = $this->productClassRepository->findProductClassesForStandardPriceUpdate($productId, $languageId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:119:            $newStandardPrice = $this->standardPriceCalculator->calculate(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:122:                $csvStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:135:            $this->productClassRepository->updateProductClassForStandardPriceCsv(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:137:                $newStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:144:            $oldStandardPrice = (int) bcfloor((string) ($pcRow['standardPrice'] ?? '0'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:156:                    $oldStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:159:                    $newStandardPrice
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:162:                // updateProductClassesForStandardPriceCsv で price02 を newStandardPrice に更新する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:168:                    $oldStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:169:                    $newStandardPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:171:                    $newStandardPrice
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:248:        $productClasses = $this->productClassRepository->findProductClassesForStandardPriceUpdate($productId, $languageId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:114:    /** @var CsvColumnInterface 列: 原価単価（出力フォーマット互換用。インポート時は更新しない） */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:45:        'unit_cost' => '原価単価',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:182:                'standard_price' => (string) ($pc->getStandardPrice() ?? ''),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:120:            $sourceDestStandardTotal = (int) round((float) $splitJoin->getStandardPrice() * $sourceDestQuantity);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:127:                $standardPrice = (int) $detail->getStandardPrice();

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php | sed -n '300,350p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSalesQuantity.php | sed -n '95,125p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   300	        private ?string $smaregiProductCode = null;
   301	
   302	        #[ORM\Column(name: 'memo', type: Types::TEXT, length: 16777215, nullable: true, options: ['comment' => '備考'])]
   303	        private ?string $memo = null;
   304	
   305	        #[ORM\JoinColumn(name: 'product_status_id', referencedColumnName: 'id', options: ['default' => 1])]
   306	        #[ORM\ManyToOne(targetEntity: ProductStatus::class)]
   307	        private ?ProductStatus $Status = null;
   308	
   309	        #[ORM\Column(name: 'card_condition_name', type: Types::STRING, length: 255, nullable: true, options: ['comment' => '状態名'])]
   310	        private ?string $cardConditionName = null;
   311	
   312	        /**
   313	         * @var Collection<int, DtbPriceHistory>
   314	         */
   315	        #[ORM\OneToMany(targetEntity: DtbPriceHistory::class, mappedBy: 'ProductClass', cascade: ['remove'])]
   316	        private Collection $PriceHistories;
   317	
   318	        /**
   319	         * @var Collection<int, DtbProductClassImage>
   320	         */
   321	        #[ORM\OneToMany(targetEntity: DtbProductClassImage::class, mappedBy: 'ProductClass', cascade: ['persist', 'remove'])]
   322	        #[ORM\OrderBy(['rank' => 'ASC'])]
   323	        private Collection $ProductClassImages;
   324	
   325	        #[ORM\Column(name: 'order_quantity_01', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '当日販売数'])]
   326	        private int $order_quantity_01 = 0;
   327	
   328	        #[ORM\Column(name: 'order_quantity_02', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '昨日販売数'])]
   329	        private int $order_quantity_02 = 0;
   330	
   331	        #[ORM\Column(name: 'order_quantity_03', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '3日間販売数'])]
   332	        private int $order_quantity_03 = 0;
   333	
   334	        #[ORM\Column(name: 'order_quantity_04', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '1週間販売数'])]
   335	        private int $order_quantity_04 = 0;
   336	
   337	        #[ORM\Column(name: 'order_quantity_05', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '1ヶ月販売数'])]
   338	        private int $order_quantity_05 = 0;
   339	
   340	        #[ORM\Column(name: 'order_quantity_06', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '90日間販売数'])]
   341	        private int $order_quantity_06 = 0;
   342	
   343	        #[ORM\Column(name: 'order_quantity_07', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '180日間販売数'])]
   344	        private int $order_quantity_07 = 0;
   345	
   346	        #[ORM\Column(name: 'order_quantity_08', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '365日間販売数'])]
   347	        private int $order_quantity_08 = 0;
   348	
   349	        #[ORM\JoinColumn(name: 'section_id', referencedColumnName: 'id')]
   350	        #[ORM\ManyToOne(targetEntity: MtbSection::class, inversedBy: 'ProductClasses')]
    95	        return $this;
    96	    }
    97	
    98	    #[ORM\Column(name: 'sales_quantity_03', type: Types::INTEGER, options: ['unsigned' => true, 'default' => 0, 'comment' => '3日間販売数'])]
    99	    private int $sales_quantity_03 = 0;
   100	
   101	    public function getSalesQuantity_03(): int
   102	    {
   103	        return $this->sales_quantity_03;
   104	    }
   105	
   106	    public function setSalesQuantity_03(int $sales_quantity_03): DtbSalesQuantity
   107	    {
   108	        $this->sales_quantity_03 = $sales_quantity_03;
   109	
   110	        return $this;
   111	    }
   112	
   113	    #[ORM\Column(name: 'sales_quantity_04', type: Types::INTEGER, options: ['unsigned' => true, 'default' => 0, 'comment' => '1週間販売数'])]
   114	    private int $sales_quantity_04 = 0;
   115	
   116	    public function getSalesQuantity_04(): int
   117	    {
   118	        return $this->sales_quantity_04;
   119	    }
   120	
   121	    public function setSalesQuantity_04(int $sales_quantity_04): DtbSalesQuantity
   122	    {
   123	        $this->sales_quantity_04 = $sales_quantity_04;
   124	
   125	        return $this;

codex
「週間販売数」フィールド自体は存在しますが、確認できた計算器はカード状態割引用で、低価格帯のランク階段とは別物です。最後にその周辺だけ引用可能な行で押さえます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php | sed -n '1,90p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Service\Csv\Importer\Event\Util;
    17	
    18	use Eccube\Entity\DtbDiscountCardCondition;
    19	use Eccube\Entity\Master\MtbCardCondition;
    20	use Eccube\Repository\DtbDiscountCardConditionRepository;
    21	use Eccube\Util\PriceUtil;
    22	
    23	/**
    24	 * NM基準の基準価格・カードコンディション・割引から基準価格を算出する。
    25	 *
    26	 * 計算ロジックを Repository に持たせず、テストしやすいよう独立した Util クラスに切り出している。
    27	 * 割引率の取得は Repository に委譲する。
    28	 */
    29	class StandardPriceCalculator
    30	{
    31	    public function __construct(
    32	        private readonly DtbDiscountCardConditionRepository $dtbDiscountCardConditionRepository,
    33	    ) {
    34	    }
    35	
    36	    /**
    37	     * 基準価格を算出する。
    38	     *
    39	     * - NM: 基準価格をそのまま使用する
    40	     * - SP/MP/HP: 基準価格 × 割引率 を 10円単位で切り上げする（PriceUtil::discount）
    41	     * - 割引設定が無い、または割引率が0以下の場合は基準価格をそのまま使用する
    42	     *
    43	     * @param int|null $discountId 商品の割引ID（未設定の場合は null）
    44	     * @param int $cardConditionId カードコンディションID
    45	     * @param int $baseStandardPrice NM基準の基準価格
    46	     */
    47	    public function calculate(?int $discountId, int $cardConditionId, int $baseStandardPrice): int
    48	    {
    49	        // NMは割引率に関わらず基準価格をそのまま使用する
    50	        if ($cardConditionId === MtbCardCondition::NM) {
    51	            return $baseStandardPrice;
    52	        }
    53	
    54	        if ($discountId === null || $discountId <= 0) {
    55	            return $baseStandardPrice;
    56	        }
    57	
    58	        $DiscountCardCondition = $this->dtbDiscountCardConditionRepository->findOneBy([
    59	            'discount_id' => $discountId,
    60	            'card_condition_id' => $cardConditionId,
    61	        ]);
    62	        if (!$DiscountCardCondition instanceof DtbDiscountCardCondition) {
    63	            return $baseStandardPrice;
    64	        }
    65	
    66	        $rate = $DiscountCardCondition->getRate();
    67	        if ($rate <= 0.0) {
    68	            return $baseStandardPrice;
    69	        }
    70	
    71	        return PriceUtil::discount($baseStandardPrice, $rate);
    72	    }
    73	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php | sed -n '80,180p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    80	
    81	        if (!$this->validateProductClassExists($event)) {
    82	            $event->breakAll();
    83	        }
    84	    }
    85	
    86	    /**
    87	     * CSVデータ1行を取り込む。
    88	     *
    89	     * @return bool 読み込みに成功した場合 true
    90	     */
    91	    public function onReadRow(ReadCsvRowEvent $event): bool
    92	    {
    93	        $row = $event->getRow();
    94	        $productId = (int) $this->productIdColumn->getValue($row);
    95	        $languageId = (int) $this->languageIdColumn->getValue($row);
    96	
    97	        // CSVの基準価格・買取価格はNM基準。SP/MP/HPは各規格の割引・買取条件で算出する。
    98	        $csvStandardPrice = (int) bcfloor((string) $this->standardPriceColumn->getValue($row));
    99	        $csvBuyPrice = (int) bcfloor((string) $this->buyPriceColumn->getValue($row));
   100	
   101	        $ProductClasses = $this->productClassRepository->findProductClassesForStandardPriceUpdate($productId, $languageId);
   102	        $memberId = $event->getUpdateUser()->getId();
   103	
   104	        $addedSaleInfo = false;
   105	        foreach ($ProductClasses as $pcRow) {
   106	            $productClassId = (int) $pcRow['productClassId'];
   107	            $cardConditionId = (int) $pcRow['cardConditionId'];
   108	            $isSale = ((int) ($pcRow['saleFlg'] ?? 0)) === 1;
   109	            if ($isSale && !$addedSaleInfo) {
   110	                $event->getMessageStore()->addInfo(
   111	                    'admin.product.standard_price_csv.sale_product_sell_price_unchanged',
   112	                    $row->getRowNumber()
   113	                );
   114	                $addedSaleInfo = true;
   115	            }
   116	
   117	            // 基準価格: NMはCSV値、SP/MP/HPは「商品の割引 × カードコンディション」のrateで算出
   118	            $discountId = isset($pcRow['discountId']) ? (int) $pcRow['discountId'] : null;
   119	            $newStandardPrice = $this->standardPriceCalculator->calculate(
   120	                $discountId,
   121	                $cardConditionId,
   122	                $csvStandardPrice,
   123	            );
   124	
   125	            // 買取価格: NMはCSV値、SP/MP/HPは買取減額率・買取価格表・既定率から算出（NM特例・減額率取得はメソッド内で処理）
   126	            $buyDiscountId = isset($pcRow['buyDiscountId']) ? (int) $pcRow['buyDiscountId'] : null;
   127	            $specialFlg = (int) ($pcRow['specialFlg'] ?? 0);
   128	            $newBuyPrice = $this->discountBuyPriceCalculator->calculate(
   129	                $csvBuyPrice,
   130	                $cardConditionId,
   131	                $specialFlg,
   132	                $buyDiscountId,
   133	            );
   134	
   135	            $this->productClassRepository->updateProductClassForStandardPriceCsv(
   136	                $productClassId,
   137	                $newStandardPrice,
   138	                $newBuyPrice,
   139	                $isSale,
   140	            );
   141	
   142	            $oldSellPrice = (int) ($pcRow['sellPrice'] ?? 0);
   143	            $oldBuyPrice = (int) ($pcRow['buyPrice'] ?? 0);
   144	            $oldStandardPrice = (int) bcfloor((string) ($pcRow['standardPrice'] ?? '0'));
   145	            $productClassEntity = $this->productClassRepository->getEntityManager()->getReference(
   146	                ProductClass::class,
   147	                $productClassId
   148	            );
   149	            if ($isSale) {
   150	                // セール中: price02 は更新しないため履歴の販売価格は変更なし
   151	                $this->dtbPriceHistoryRepository->addSellBuyPriceHistoryIfChanged(
   152	                    $productClassEntity,
   153	                    $memberId,
   154	                    $oldSellPrice,
   155	                    $oldBuyPrice,
   156	                    $oldStandardPrice,
   157	                    $oldSellPrice,
   158	                    $newBuyPrice,
   159	                    $newStandardPrice
   160	                );
   161	            } else {
   162	                // updateProductClassesForStandardPriceCsv で price02 を newStandardPrice に更新する
   163	                $this->dtbPriceHistoryRepository->addSellBuyPriceHistoryIfChanged(
   164	                    $productClassEntity,
   165	                    $memberId,
   166	                    $oldSellPrice,
   167	                    $oldBuyPrice,
   168	                    $oldStandardPrice,
   169	                    $newStandardPrice,
   170	                    $newBuyPrice,
   171	                    $newStandardPrice
   172	                );
   173	            }
   174	
   175	            $alignment = (int) ($pcRow['smaregiAlignmentFlg'] ?? 0);
   176	            $smaregiCode = $pcRow['smaregiProductCode'] ?? null;
   177	            $this->smaregiCsvImportUpsertCoordinator->deferIfEligible(
   178	                $productClassId,
   179	                $alignment,
   180	                \is_string($smaregiCode) ? $smaregiCode : null,

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php | sed -n '2960,3015p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  2960	
  2961	        $count = (int) $qb->getQuery()->getSingleScalarResult();
  2962	
  2963	        return $count > 0;
  2964	    }
  2965	
  2966	    /**
  2967	     * 基準価格変更CSV用。商品ID・言語IDに該当する高額商品コードなしの商品規格を取得する。
  2968	     *
  2969	     * @return array<array<string, mixed>>
  2970	     */
  2971	    public function findProductClassesForStandardPriceUpdate(int $productId, int $languageId): array
  2972	    {
  2973	        $sql = <<<EOT
  2974	SELECT
  2975	    pc.id as product_class_id,
  2976	    pc.price02,
  2977	    pc.buy_price,
  2978	    pc.belt_url,
  2979	    pc.card_condition_id,
  2980	    pc.sale_limit,
  2981	    pc.standard_price,
  2982	    pc.language_id,
  2983	    pc.high_price_code,
  2984	    pc.wholesale_price,
  2985	    pc.memo,
  2986	    pc.smaregi_product_code,
  2987	    pc.section_id,
  2988	    (pc.sale_flg IS TRUE)::int AS sale_flg,
  2989	    pc.smaregi_alignment_flg,
  2990	    p.discount_id AS discount_id,
  2991	    p.buy_discount_id AS buy_discount_id,
  2992	    CASE WHEN cd.foil_flg = 1 OR cd.promotion_flg IS TRUE THEN 1 ELSE 0 END AS special_flg
  2993	FROM
  2994	    dtb_product_class pc
  2995	    INNER JOIN dtb_product p ON pc.product_id = p.id
  2996	    LEFT JOIN mtb_card_detail cd ON p.card_detail_id = cd.id
  2997	WHERE
  2998	    pc.product_id = :productId
  2999	    AND pc.language_id = :languageId
  3000	    AND (pc.high_price_code IS NULL OR pc.high_price_code = '')
  3001	EOT;
  3002	
  3003	        $rsm = new ResultSetMapping();
  3004	        $rsm->addScalarResult('product_class_id', 'productClassId', Types::INTEGER)
  3005	            ->addScalarResult('price02', 'sellPrice', Types::STRING)
  3006	            ->addScalarResult('buy_price', 'buyPrice', Types::INTEGER)
  3007	            ->addScalarResult('belt_url', 'beltUrl', Types::STRING)
  3008	            ->addScalarResult('card_condition_id', 'cardConditionId', Types::INTEGER)
  3009	            ->addScalarResult('sale_limit', 'saleLimit', Types::INTEGER)
  3010	            ->addScalarResult('standard_price', 'standardPrice', Types::STRING)
  3011	            ->addScalarResult('language_id', 'languageId', Types::INTEGER)
  3012	            ->addScalarResult('high_price_code', 'highPriceCode', Types::STRING)
  3013	            ->addScalarResult('wholesale_price', 'wholesalePrice', Types::STRING)
  3014	            ->addScalarResult('memo', 'memo', Types::STRING)
  3015	            ->addScalarResult('smaregi_product_code', 'smaregiProductCode', Types::STRING)

exec
/bin/bash -lc "rg -n \"300|250|200|150|100|80|50|30|order_quantity_04|sales_quantity_04|週間販売|全店在庫\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository --glob '"'!vendor/**'"'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:328:    )::NUMERIC / 100) * 100,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockHistoryRepository.php:347:    public function findLatestByProductStockId(int $productStockId, int $limit = 30): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:75:     * 表示件数: 10,50,100,300,500,1000,2000,10000,12000（デフォルト10は eccube_default_page_count）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:81:        $choices = [10, 50, 100, 300, 500, 1000, 2000, 10000, 12000];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/QrCodeService.php:32:    private const CART_SIZE = 130;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php:204:    public function findTopAdoptedCards(int $formatId, int $baseInfoId, int $limit = 30): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php:292:                   (SELECT COALESCE(SUM(sq.sales_quantity_04), 0)::int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:261:                    usleep(100000);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:315:        $batchSize = $maxProductId > 0 ? (int) ($maxProductId / 50) : 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:324:            for ($i = 0; $i <= 50; $i++) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:421:            if ($count % 1000 === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:77:            50,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:38:    protected const ADMIN_CSV_IMPORT_MAX_ROWS = 110000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:235:    pc.order_quantity_04 AS orderQuantity04,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:287:    pc.id, pc.high_price_code, pc.order_quantity_04, pc.product_code, pc.memo, pc.price02, pc.sale_limit, pc.stock,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:342:     * 設計書 0301 §2 SALE 中の商品の条件:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2056:    (SELECT COALESCE(SUM(pc2.order_quantity_04), 0)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2246:    (SELECT COALESCE(SUM(pc2.order_quantity_04), 0)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2325:    (SELECT COALESCE(SUM(pc2.order_quantity_04), 0)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2401:    (SELECT COALESCE(SUM(pc2.order_quantity_04), 0)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:298:        return $statusCode >= 200 && $statusCode < 300;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:37:    private const PAGE_COUNT_OPTIONS = [10, 50, 100, 300, 500, 1000, 2000, 10000, 12000];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:38:    private const CSV_IMPORT_MAX = 5010;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:43:    private const PAGE_COUNT_OPTIONS = [10, 50, 100, 300, 500, 1000, 2000, 10000, 12000];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:41:    private const PAGE_LIMIT = 1000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:44:    private const MAX_PAGES = 1000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:121:            if ($statusCode < 200 || $statusCode >= 300) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:183:            if ($statusCode < 200 || $statusCode >= 300) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MessengerJobRepository.php:37:    public function findAllOrderByCreatedAtDesc(int $limit = 100): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:81:            // スマレジ側に該当 productCode の商品が無い (200 だが該当なし = 連携先で既に消えている可能性)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:143:        return $statusCode >= 200 && $statusCode < 300;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:47:    private const PAGE_COUNT_OPTIONS = [10, 50, 100, 300, 500, 1000, 2000, 10000, 12000];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:85:            50,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:290:        return $statusCode >= 200 && $statusCode < 300;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:79:            50,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerResolver.php:110:        if ($statusCode < 200 || $statusCode >= 300) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php:31:    public const MAX_RETRY_COUNT = 100;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:257:            $terms = preg_split('/[\s,\x{3000}]+/u', $multi, -1, PREG_SPLIT_NO_EMPTY) ?: [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbInventoryPlanRepository.php:126:     * 正の $timeout では pg_try_advisory_lock を約 50ms 間隔で繰り返し、期限までに取得できなければ false。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbInventoryPlanRepository.php:162:            usleep(50_000);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:73:                    :stock_up_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:86:                    stock_up_quantity_07 = :stock_up_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:123:     *     stock_up_180day: int,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:144:            ->addScalarResult('stock_up_180day', 'stock_up_180day', 'integer')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:168:                SUM(CASE WHEN sh.create_date >= :create_date_ts::timestamptz - INTERVAL '180 days'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:169:                    THEN GREATEST(sh.stock - sh.old_stock, 0) ELSE 0 END) AS stock_up_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:226:                    :stock_up_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:241:                    stock_up_quantity_07 = :stock_up_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:270:                COALESCE(SUM(stock_up_quantity_04), 0) AS order_quantity_04,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:291:                'orderQuantity04' => (int) ($row['order_quantity_04'] ?? 0),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSynchronisationUpdateRepository.php:101:     * デフォルトで20分~30分の更新情報を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:48:    public const RANKING_LIMIT = 1000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1109:            LIMIT 100
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1280:                pc2.order_quantity_04 AS order_quantity_1week,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockChangeHistoryListBuilder.php:29:    private const DISPLAY_LIMIT = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php:31:    public const MAX_RETRY_COUNT = 100;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:70:        $lock = $factory->createLock('payment-status-check', 300); // 5分TTL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:78:            $EventEntries = $this->eventEntryRepository->getBeforeMinutesEntry(30);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:260:            if ($statusCode < 200 || $statusCode >= 300) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:261:                $logFields['responseBody'] = mb_substr($body, 0, 1000);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:414:            if ($statusCode < 200 || $statusCode >= 300) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:415:                $logFields['responseBody'] = mb_substr($body, 0, 1000);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:783:    public function findOtcOrdersAwaitingSmaregiSync(int $limit = 100): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:867:    public function getDeleteSmaregiProduct(int $limit = 100): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:957:     * 正の $timeout では pg_try_advisory_lock を約 50ms 間隔で繰り返し、期限までに取得できなければ false。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:993:            usleep(50_000);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiAccessTokenService.php:132:        if ($statusCode !== 200) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiAccessTokenService.php:152:        $ttl = max(60, $expiresIn - 300); // 5分バッファ（最低60秒）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:63:            'timeout' => 30.0,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:121:            return $code === 429 || ($code >= 500 && $code < 600);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:132:                return $code === 429 || ($code >= 500 && $code < 600);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:151:                return min($fromHeader, 300_000);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:171:            return (int) $value * 1000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:177:        $waitMs = ($ts - time()) * 1000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EventBannerStorageService.php:28:    private const MAX_UPLOAD_BYTES = 520000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EventBannerStorageService.php:218:        return array_slice($rawFiles, 0, 2000);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:84:              <timeout>10000</timeout>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:92:                  <rectangle x1="0" y1="0" x2="511" y2="200" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:95:                  <rectangle x1="0" y1="0" x2="511" y2="200" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:96:                  <position x="200" y="150"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:98:                  <rectangle x1="0" y1="200" x2="511" y2="400" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:99:                  <rectangle x1="0" y1="200" x2="175" y2="400" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:104:                  <position x="179" y="230"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:106:                  <rectangle x1="0" y1="400" x2="210" y2="450" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:109:                  <rectangle x1="210" y1="400" x2="511" y2="450" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:112:                  <rectangle x1="0" y1="450" x2="210" y2="500" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:115:                  <rectangle x1="210" y1="450" x2="511" y2="500" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:118:                  <rectangle x1="0" y1="500" x2="210" y2="550" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:121:                  <rectangle x1="210" y1="500" x2="511" y2="550" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:124:                  <rectangle x1="0" y1="550" x2="210" y2="600" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:127:                  <rectangle x1="210" y1="550" x2="511" y2="600" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:130:                  <rectangle x1="0" y1="600" x2="210" y2="650" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:133:                  <rectangle x1="210" y1="600" x2="511" y2="650" style="thin"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:135:                  <barcode type="jan13" hri="below" font="font_b" width="2" height="50">{$smaregiCode}</barcode>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:55:    public const RESULT_CACHING_TIME = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:500:            pc.order_quantity_04 AS weekly_sales,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1107:    //     //                   order_quantity_04 = :sales_weekly,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1110:    //     //                   order_quantity_07 = :sales_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1132:    //     //             stock_up_quantity_07 = :stock_up_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1982:)::NUMERIC / 100) * 100,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2043:            $discountedPrice = bcdiv(bcmul((string) $nmPrice, (string) $buyDiscountRate, 4), '100', 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2044:            $roundedPrice = bcmul(bcceil($discountedPrice), '100', 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2055:                        $discountedPrice = bcdiv(bcmul((string) $nmPrice, (string) MtbBuyPriceList::ORVER_PRICE_SPECIAL_SP_RATE, 4), '100', 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2056:                        $roundedPrice = bcmul(bcceil($discountedPrice), '100', 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2060:                        $discountedPrice = bcdiv(bcmul((string) $nmPrice, (string) MtbBuyPriceList::ORVER_PRICE_SPECIAL_MP_RATE, 4), '100', 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2061:                        $roundedPrice = bcmul(bcceil($discountedPrice), '100', 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2065:                        $discountedPrice = bcdiv(bcmul((string) $nmPrice, (string) MtbBuyPriceList::ORVER_PRICE_SPECIAL_HP_RATE, 4), '100', 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2066:                        $roundedPrice = bcmul(bcceil($discountedPrice), '100', 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2076:                    $discountedPrice = bcdiv(bcmul((string) $nmPrice, (string) MtbBuyPriceList::ORVER_PRICE_NOMAL_SP_RATE, 4), '100', 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2077:                    $roundedPrice = bcmul(bcceil($discountedPrice), '100', 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2081:                    $discountedPrice = bcdiv(bcmul((string) $nmPrice, (string) MtbBuyPriceList::ORVER_PRICE_NOMAL_MP_RATE, 4), '100', 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2082:                    $roundedPrice = bcmul(bcceil($discountedPrice), '100', 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2086:                    $discountedPrice = bcdiv(bcmul((string) $nmPrice, (string) MtbBuyPriceList::ORVER_PRICE_NOMAL_HP_RATE, 4), '100', 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2087:                    $roundedPrice = bcmul(bcceil($discountedPrice), '100', 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2491:    //                 , psc.order_quantity_04 AS order_quantity_04
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2501:    //                 0 < psc.order_quantity_04
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2509:    //             ->addScalarResult('order_quantity_04', 'order_quantity_04')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2519:    //                 $result['order_quantity_04'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:42:    public const RECOMMEND_BULK_QUANTITY = 1000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:59:     * 商品規格IDをキーに、本店ベース集計（BaseInfo IS NULL または BaseInfo = POPULAR_PRODUCT_RECOMMEND_SHOP_ID）の週間販売数を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:63:     * @return array<int, int> productClassId => 週間販売数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:72:            ->select('pc.id AS productClassId', 'SUM(sq.sales_quantity_04) AS weeklySales')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:120:                    sales_quantity_04,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:135:                    :sales_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:145:                    sales_quantity_04 = :sales_weekly,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:148:                    sales_quantity_07 = :sales_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:159:    public function getPopularProductRecommend(int $currentBaseInfoId, int $limit = 30): mixed
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:200:        // 在庫があるもののうち、上位30件を表示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:210:                'SUM(sqs.sales_quantity_04) AS sum',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:226:            ->orderBy('SUM(sqs.sales_quantity_04)', 'DESC')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:232:     * 指定支店(base_info_id) の週間販売数 (sales_quantity_04) 上位の ProductClass を取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:241:            ->addSelect('SUM(sq.sales_quantity_04) AS HIDDEN weeklyQuantity')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:253:            ->andWhere('sq.sales_quantity_04 > 0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:407:     *     sales_180day: int,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:426:            ->addScalarResult('sales_180day', 'sales_180day', 'integer')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:444:                SUM(CASE WHEN o.order_date >= :order_date_ts::timestamptz - INTERVAL '180 days' THEN oi.quantity::int ELSE 0 END) AS sales_180day,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:521:                COALESCE(SUM(sq.sales_quantity_04), 0) AS order_quantity_04,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:540:                'orderQuantity04' => (int) ($row['order_quantity_04'] ?? 0),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:175:            200,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockHttpClientFactory.php:44:            'timeout' => 30.0,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/SectionMockResponse.php:26: * - PATCH  /pos/categories/{id}              : リクエストボディをエコー (200)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/SectionMockResponse.php:38:        return self::json(200, $items);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/SectionMockResponse.php:60:        return self::json(200, array_merge($requestBody, ['categoryId' => $smaregiCategoryId]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/CustomerMockResponse.php:44:        return self::json(200, []);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/CustomerMockResponse.php:54:        return self::json(200, []);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/CustomerMockResponse.php:59:        return self::json(200, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/AccessTokenMockResponse.php:40:            200,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/ProductMockResponse.php:26: * - PATCH  /pos/products/{id}              : リクエストボディをエコー (200)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/ProductMockResponse.php:39:        return self::json(200, $items);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/ProductMockResponse.php:61:        return self::json(200, array_merge($requestBody, ['productId' => $smaregiProductId]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:430:    private const MAX_PER_PAGE = 100;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbLatestEventDeckRepository.php:48:    private const RECENT_EVENTS_CACHE_TTL_SECONDS = 1800;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:33: *   - 例) 在庫A(qty:5→3, subtotal:1000) → subtotal:1000 のまま（単価200→333）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:34: *   - 例) 在庫A(qty:3→0, subtotal:600), 在庫B(qty:5, subtotal:1000)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:40: *   - 例) 在庫A(qty:3→5, subtotal:600) → subtotal:600 のまま（単価200→120）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:46: *   - 例) 在庫A(qty:5→3, subtotal:1000, unitCost:200) → 移動額=200×2=400, subtotal=600
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:47: *         在庫B(qty:2→5, subtotal:500) → 400を受け取り → subtotal=900
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:180:     * 例) 在庫A(newQty:0, currentSub:600), 在庫B(newQty:3, currentSub:1000), 在庫C(newQty:2, currentSub:800)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:181:     *     → 在庫Aの600を在庫B・Cに按分: 600÷2=300ずつ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:182:     *     → 在庫B: 1000+300=1300, 在庫C: 800+300=1100
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:246:     * 例) 在庫A(currentQty:3, newQty:5, currentSub:600) → subtotal:600（単価200→120）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:283:     * 例) 在庫A(currentQty:5, newQty:3, currentSub:1000, unitCost:200)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:284:     *     → 移動額 = 200 × (5-3) = 400, 新sub = 1000 - 400 = 600
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:285:     *     在庫B(currentQty:2, newQty:5, currentSub:500), 新規在庫C(currentQty:0, newQty:1)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:286:     *     → 移動額400を2明細に按分: 200ずつ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:287:     *     → 在庫B: 500+200=700, 在庫C: 0+200=200
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:24:    public const BATCH_SIZE = 20000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:407:            "/(?:\xE2\x80\x8B|\xEF\xBB\xBF)+/u",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:61:            $normalizedMemo = trim(preg_replace('/[\x{3000}\x{00A0}]/u', ' ', $input->rejectedMemo) ?? $input->rejectedMemo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StorageCodeCsv.php:124:                if ($rowIndex % 100 === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/FileManager.php:132:            if (is_array($headers) && str_contains((string) $headers[0], 'HTTP/1.1 200') === true) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderPdfService.php:292:        $this->lfText(121, 63, "\u{3012}".' '.mb_substr((string) $this->baseInfoRepository->getPostalCode(), 0, 3).' - '.mb_substr((string) $this->baseInfoRepository->getPostalCode(), 3, 4), 8);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderPdfService.php:405:        // 購入者郵便番号(3012は郵便マークのUTFコード)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderPdfService.php:408:            $text = "\u{3012}".' '.mb_substr($postalCode, 0, 3).' - '.mb_substr($postalCode, 3, 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3AccessService.php:52:            $fileName = $this->s3Directory.uniqid().rand(100, 999).$suffix.'.'.strtolower($fileInfo['extension']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3AccessService.php:75:            $fileName = $this->s3Directory.uniqid().rand(100, 999).$suffix.'.'.strtolower((string) $fileInfo['extension']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:38:    private const CSV_IMPORT_MAX_RECORDS = 20000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/InventoryReflectService.php:99:                if ($i % 100 === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/RestockedBlockPayloadBuilder.php:27:    private const MAX_PRODUCT_COUNT = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/LatestArticlesBlockPayloadBuilder.php:32:    private const CACHE_TTL_SECONDS = 300;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CreateLatestArticleListAction.php:67:        if ($statusCode !== 200) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:31:    private const MAX_PRODUCT_COUNT = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/FrontTopBlockProductViewService.php:84:     * 表示中の ProductClass について、商品カードに表示する週間販売数のマップを返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/FrontTopBlockProductViewService.php:88:     * @return array<int, int> productClassId => 週間販売数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:47:    private const CSV_STREAM_BATCH_SIZE = 200;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:48:    private const ADMIN_PC_ID_IN_CHUNK_SIZE = 500;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:392:            'label' => '1週間販売数',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:394:            'column' => 'pc.order_quantity_04 as order_quantity_1week',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:406:        'order_quantity_180days' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:407:            'label' => '180日間販売数',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:408:            'labelEn' => 'order_quantity_180days',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:409:            'column' => 'pc.order_quantity_07 as order_quantity_180days',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:456:        'stock_up_quantity_180days' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:457:            'label' => '180日間入庫数',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:458:            'labelEn' => 'stock_up_quantity_180days',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:459:            'column' => 'MAX(suq.stock_up_quantity_07) as stock_up_quantity_180days',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:1961:        $rawColumns = explode(',', (string) ($query['columns'] ?? ''), 100);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/SaleBlockPayloadBuilder.php:27:    private const MAX_PRODUCT_COUNT = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/RankingBlockPayloadBuilder.php:29:    private const RANKING_LIMIT = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/HareruyaChannelBlockPayloadBuilder.php:31:    private const CACHE_TTL_SECONDS = 300;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TaxRuleService.php:96:        // tax = price * taxRate / 100
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TaxRuleService.php:97:        $tax = bcdiv(bcmul($price, $taxRate, 4), '100', 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TaxRuleService.php:115:        // tax = (price - taxAdjust) * taxRate / (100 + taxRate)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TaxRuleService.php:117:        $divisor = bcadd('100', $taxRate, 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/PriceDownBlockPayloadBuilder.php:27:    private const MAX_PRODUCT_COUNT = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:193:        $limit = 100;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/FavoritesBlockPayloadBuilder.php:29:    private const MAX_DISPLAY_COUNT = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductList/ProductListDetailedSearchBreadcrumbBuilder.php:237:     * PHP の trim() は全角スペース（U+3000 等）を除かないため、Unicode の区切り空白も削る。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckBulkCartBuilder.php:31:    private const CONDITION_DISPLAY_MIN_PRICE = 100;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Data/TopBannerFileListAction.php:23:    private const MAX_LIST_COUNT = 2000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Pdf/Exporter/StockMoveTransferListPdfFormatter.php:55:    public const MAX_PAGE_ROWS = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/CsvImporter.php:39:    public const DEFAULT_FLUSH_PER_LINES = 100;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/CsvImporter.php:45:    public const MAX_LOCK_TIMEOUT = 30;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:38:        'order_quantity_1week' => '1週間販売数',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:164:     * 50 -> 100 : 50
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:165:     * 100 -> 50 : -50
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:249:        return $pointTarget > 0 ? (int) floor($pointTarget * $pointPercentage / 100) : 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:70:                    $pointCalc = bcmul(bcmul((string) $item->getPrice(), bcdiv((string) $pointRate, '100', 2), 2), $item->getQuantity(), 2);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:75:                    $pointCalc = bcmul(bcmul((string) $item->getPrice(), bcdiv((string) $pointRate, '100', 2), 2), $item->getQuantity(), 2);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:78:                    $pointCalc = bcmul(bcmul((string) $item->getPrice(), bcdiv((string) $pointRate, '100', 2), 2), $item->getQuantity(), 2);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:51:        '週間販売数',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:145:                COALESCE(MAX(dsq.sales_quantity_04), 0)      AS weekly_sales,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:50:        'one_week_sales' => '1週間販売数',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:31:    public const PICKING_TYPE_SORT_NULL_STANDARD_PRICE = 50;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:171:        // 閾値 [980, 4800] なら sort=1→最安帯, 2→中間帯, 3→最高帯
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:266:            CURLOPT_TIMEOUT_MS => 5000,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:279:        if ($info['http_code'] !== 200 || $result === false) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:34:    private const EXPORT_CHUNK_SIZE = 100;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:39:     * pf-apiにあわせて、最大件数を100件にして返却
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:46:    public function build(array $products, int $maxCount = 100): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:45:    public const MAX_ROWS = 2000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:619:            // TODO:スマレジ連携状態の確認後、更新するか決める（https://joolen.slack.com/archives/C086TQW7VTK/p1777341428022289）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:677:            // TODO:スマレジ連携状態の確認後、更新するか決める（https://joolen.slack.com/archives/C086TQW7VTK/p1777341428022289）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:169:            $this->redisService->set($redisKey, $json, 1800);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventSearchInput.php:24:    public const PER_PAGE = 100;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:46:    public const MAX_ROWS = 2000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:44:    public const MAX_ROWS = 2000;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:43:     * - 買取減額率が設定されている場合: ceil(nmPrice * rate / 100) * 100
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:45:     * - それ以外（表に記載なし）: カードコンディション別の既定率で ceil(nmPrice * rate / 100) * 100
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:62:            return (int) (ceil($nmPrice * $buyDiscountRate / 100) * 100);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:83:        return (int) (ceil($nmPrice * $rate / 100) * 100);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:944:        // 販売価格が300円以上、かつ状態がNM以外の場合はスマレジ連携フラグを有効にする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:945:        if ($sellPrice >= 300 && $cardConditionId !== MtbCardCondition::NM) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CustomerAddressCsvImportHandler.php:317:            ->addValidator(new StringMaxLengthValidator(50));

codex
監査結果: 大筋では「低価格帯カード価格変更CSV出力は実装不在」というfindingは妥当です。誤検知は確認できませんでした。ただし、根拠の置き方に弱い箇所があります。

- WEAK_EVIDENCE | ①ルート/HTTPメソッド | designRef `:198` は機能目的であり、URL/route名/HTTPメソッドの根拠ではありません。設計書自身も「実装で確認できるURLは未特定のため断定しない」としているため、`admin_product_simple_low_price_csv_export` というroute想定は確認不能です。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:198`, `:208` | dimensionを「機能不在」または「画面/CSV出力機能不在」に変更し、route名断定は削除する。

- WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | implRef が `ProductSimpleHighPriceCsvController.php:184` になっていますが、これは高額商品のCSVアップロード/雛形であり、対象機能そのものではありません。比較対象としては参考になるが、低価格帯CSV出力の直接根拠ではありません。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:184`, `:186` | 「近似実装との比較」と明記し、主根拠は対象名検索0件、Controller一覧、`MtbCsvImportType`に低価格帯定数なしへ寄せる。

- WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | 「CsvExportService経由stream出力」は設計書の該当CSV列定義からは確認できません。設計で確認できるのは9列フォーマットと新/現行価格・原価単価の出力要件です。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:314`, `:318`, `:322` | 実装方式の断定を削り、「9列フォーマットの出力実装が確認できない」に留める。

- SEVERITY | ①ルート/HTTPメソッド | severity high は「機能丸ごと不在」としては妥当ですが、dimension がルート/HTTPメソッドのままだとhighは過大に見えます。設計はURL未特定で、HTTPメソッド仕様もありません。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:195`, `:208`; `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28` | severityは維持可。ただしdimensionを機能不在に修正する。

確認できた補強根拠:
- 設計は低価格帯20円から300円以下、週間販売/全店在庫によるランク変動、ランク `300,250,200,150,100,80,50,30` を要求しています。根拠: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:259`, `:263`
- 既存の基準価格CSV登録はCSV値とカード状態割引から算出する処理で、低価格帯ランク変動ではありません。根拠: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:97`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:39`
- CSV import type 定数にも低価格帯相当は確認できず、既存は `SIMPLE_HIGH_PRICE_IMPORT_CSV_ID` などまでです。根拠: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28`

VERDICT: false_positive=0, missed=0, weak_evidence=3, 総合=要修正
tokens used
111,035
監査結果: 大筋では「低価格帯カード価格変更CSV出力は実装不在」というfindingは妥当です。誤検知は確認できませんでした。ただし、根拠の置き方に弱い箇所があります。

- WEAK_EVIDENCE | ①ルート/HTTPメソッド | designRef `:198` は機能目的であり、URL/route名/HTTPメソッドの根拠ではありません。設計書自身も「実装で確認できるURLは未特定のため断定しない」としているため、`admin_product_simple_low_price_csv_export` というroute想定は確認不能です。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:198`, `:208` | dimensionを「機能不在」または「画面/CSV出力機能不在」に変更し、route名断定は削除する。

- WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | implRef が `ProductSimpleHighPriceCsvController.php:184` になっていますが、これは高額商品のCSVアップロード/雛形であり、対象機能そのものではありません。比較対象としては参考になるが、低価格帯CSV出力の直接根拠ではありません。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:184`, `:186` | 「近似実装との比較」と明記し、主根拠は対象名検索0件、Controller一覧、`MtbCsvImportType`に低価格帯定数なしへ寄せる。

- WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | 「CsvExportService経由stream出力」は設計書の該当CSV列定義からは確認できません。設計で確認できるのは9列フォーマットと新/現行価格・原価単価の出力要件です。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:314`, `:318`, `:322` | 実装方式の断定を削り、「9列フォーマットの出力実装が確認できない」に留める。

- SEVERITY | ①ルート/HTTPメソッド | severity high は「機能丸ごと不在」としては妥当ですが、dimension がルート/HTTPメソッドのままだとhighは過大に見えます。設計はURL未特定で、HTTPメソッド仕様もありません。 | `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:195`, `:208`; `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28` | severityは維持可。ただしdimensionを機能不在に修正する。

確認できた補強根拠:
- 設計は低価格帯20円から300円以下、週間販売/全店在庫によるランク変動、ランク `300,250,200,150,100,80,50,30` を要求しています。根拠: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/admin_product_simple_low_price_csv_export.html:259`, `:263`
- 既存の基準価格CSV登録はCSV値とカード状態割引から算出する処理で、低価格帯ランク変動ではありません。根拠: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:97`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/StandardPriceCalculator.php:39`
- CSV import type 定数にも低価格帯相当は確認できず、既存は `SIMPLE_HIGH_PRICE_IMPORT_CSV_ID` などまでです。根拠: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28`

VERDICT: false_positive=0, missed=0, weak_evidence=3, 総合=要修正
