# a01-02_0501_sheet-4_webhook 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a01-02_0501_sheet-4_webhook.json#a01-02_0501_sheet-4_webhook-conformance-a1ee892cf844`
- 機能: A01-02 A01-02 スマレジwebhook連携エラー再連携
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は在庫変動履歴を『取引更新時間 バッチ駆動時間(X)からY時間前(X-Y hours、★1では5時間前)』の時間幅で取得するよう要求しているが、再連携バッチは日付単位(target_date)でしか取得しておらず、時間幅の計算・指定が存在しない。

## 判定理由
設計HTML 1384行の★1『APIでバッチ駆動時間から5時間前までの間のスマレジの在庫変動履歴データを取得する』および1403行の入力データ検索条件『スマレジ在庫変動履歴データ.取引更新時間 バッチ駆動時間(X)からバッチ駆動時間よりY時間前(X-Y hours)の間』が、時間幅(開始時刻〜終了時刻)ベースの取得を要求している。実装側は SmaregiStockBackfillCommand が引数 target-date(日付、未指定時は駆動日)のみを受け取り(44行)、SmaregiStockBackfillAction.handle は target_date を Y-m-d 日付として扱い(67-69行)、listStockChanges クエリに target_date/page/limit のみを渡す(169-179行)。SmaregiStockApiClient.listStockChanges もクエリをそのまま透過するだけ(158-183行)で、from/to 時刻や hours 幅のパラメータは無い。src/Eccube/Service/Smaregi 配下および Command を rg で hours|DateInterval|PT5H|modify|updated_from|target_time 等で走査したが、時間幅を計算・指定する箇所は皆無。取得範囲が日付単位に留まり、設計の X-Y hours 時間幅・5時間前という検索条件を満たしていないため実装違いと判定。バッチ機構自体は存在するため実装漏れではなく実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html:1384-1403` — 設計要求(★1 処理概要 と 入力データ検索条件)

```html
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">★</span><span>1. APIでバッチ駆動時間から5時間前までの間のスマレジの在庫変動履歴データを取得する</span></div>
            <p class="doc-p" style="--lv:3">そのデータの中で、在庫変動区分が「02:取引」もしくは「12:返品」でかつ、その在庫変動履歴IDがECCUBE側の在庫変動履歴に保存されているかを検索し、保存されていないIDを抽出</p>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">★</span><span>2. スマレジ在庫と連携されていないデータを再連携処理する</span></div>
            <h3 class="doc-h doc-h-section doc-h-spec" id="sheet-4-spec-2" style="--lv:3"><span class="spec-badge">機能仕様</span>処理内容は、スマレジ連携処理と処理概要1-2と同様の処理を実行する</h3>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">★</span><span>3. バッチの実行時間を閉店時間などを見て可変的に実行する運用に変更する</span></div>
            <p class="doc-p" style="--lv:3">取得する期間は可変で実装し、実行タイミング(1時間あたりの実行回数)やバッチの実行時間、APIでのエラー発生率、テスト結果等を踏まえて検討する</p>
            <p class="doc-p" style="--lv:3">全店舗閉店後はスマレジが稼働しないので、バッチ処理は閉店後1回のみとする</p>
            <p class="doc-p" style="--lv:3">念の為、取引のスマレジ再連携バッチと処理時間が被らないように設定する</p>
            <h3 class="doc-h doc-h-section" style="--lv:0">実行トリガー　スケジュール起動(Step Functions)　実行タイミング　毎時16分</h3>
            <h3 class="doc-h doc-h-section" style="--lv:0">入力データ元　スマレジプラットフォームAPI　出力先(フォーマット)　DB</h3>
            <h3 class="doc-h doc-h-section" style="--lv:0">入力データ詳細</h3>
            <h4 class="doc-h doc-h-sub" style="--lv:1">Webhookが何らかの理由で失敗したスマレジ取引情報</h4>
            <p class="doc-p" style="--lv:2">スマレジ側のwebhookにはリトライ処理が実装されていないので、在庫変動履歴が連携済みか確認が必要</p>
            <p class="doc-p" style="--lv:3">以下の条件下でwebhookに失敗している場合、再連携処理を実行</p>
            <div class="doc-bullet" style="--lv:3"><span class="doc-marker">・</span><span>スマレジ在庫変動履歴IDがECCUBE側に登録されているかどうかを検索し、保存されていないIDを抽出</span></div>
            <div class="doc-bullet" style="--lv:3"><span class="doc-marker">・</span><span>在庫変動区分が「02:取引」もしくは「12:返品」</span></div>
            <div class="doc-bullet" style="--lv:3"><span class="doc-marker">・</span><span>店頭受取のデータではない</span></div>
            <h3 class="doc-h doc-h-section" style="--lv:0">入力データ検索条件</h3>
            <h3 class="doc-h doc-h-section" style="--lv:0">項目名　条件　備考</h3>
            <p class="doc-p" style="--lv:0">スマレジ在庫変動履歴データ.取引更新時間　バッチ駆動時間(X)からバッチ駆動時間よりY時間前(X-Y hours)の間</p>
```

## ec-cube-enterprise 実装
取得条件は target-date 日付のみで時間幅指定が無い
`ec-cube-enterprise/src/Eccube/Command/SmaregiStockBackfillCommand.php:44-44` — バッチ引数は日付のみ

```php
        $this->addArgument('target-date', InputArgument::OPTIONAL, '取得対象日 (未指定時は駆動日)', '');
```

取引更新時間の X-Y hours 範囲条件がクエリに存在しない
`ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:175-179` — APIクエリは target_date/page/limit のみ

```php
                [
                    'target_date' => $targetDate,
                    'page' => (string) $page,
                    'limit' => (string) self::PAGE_LIMIT,
                ],
```

未指定時は当日 Y-m-d。時間幅ではなく日付単位。
`ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:66-69` — target_date は日付として整形

```php
    {
        $targetDate = ($targetDate === null || $targetDate === '')
            ? (new \DateTime())->format('Y-m-d')
            : $targetDate;
```

## 不在確認コマンド

- `rg -n 'hours|hour|PT5H|DateInterval|modify\(|sub\(|target_time|from_time|to_time|updated_from|updated_to' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiStockBackfillCommand.php`
- `rg -rn 'target_date|targetDate' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/`

## 反証結果

反証を試みた結果、指摘は覆らなかった。破壊を目的に最有力の反証4系統を試みたが全て崩れ、指摘は維持される。まず引用検証: SmaregiStockBackfillCommand:44 は addArgument(target-date, OPTIONAL) のみで時間幅引数なし。SmaregiStockBackfillAction:66-69 は targetDate を new DateTime()->format(Y-m-d) と日付単位に整形し、:175-179 で listStockChanges に target_date/page/limit のみを渡す。SmaregiStockApiClient:158-183 もクエリを透過するだけで from/to/hours パラメータは無い。引用は全て正確に該当行へ実在する。反証1(別実装): src/Eccube/Service/Smaregi 配下・Command・Message・config を hours|PT5H|DateInterval|modify|sub(|target_time|from_time|to_time|updated_from|updated_to|時間前|5時間|X-Y で横断しても時間幅を計算・指定する箇所は皆無で、再連携バッチは本1系統のみ。別ルート・別Service・config値による時刻レンジ指定は存在しない。反証2(可変だから許容/除外): ★3(1389行)の『取得する期間は可変で実装し』は取得期間長を可変に実装せよという要求そのものであり除外ではない。実装は窓を常に暦日1日に固定し期間長の引数も設定値も持たないため、可変期間の要求は満たされていない。反証3(日単位取得は5時間窓の上位集合だから機能的に十分): 成立しない。バッチ駆動時刻が早朝や毎時(1392行『毎時16分』)の場合、X-Yhours窓が日跨ぎ(例 00:16起点の5時間前は前日19:16)になると target_date=当日 では前日側を取りこぼす。日付粒度は時刻レンジの厳密な上位集合ではなく、設計の取引更新時間レンジ検索を代替できない。反証4(埋め込み詳細設計1428行が取得期間の可変化を実装/運用へ委譲): 当該文はHTML埋め込みのリバース詳細設計であり、正典であるExcel由来基本設計(★1・入力データ検索条件)を上書きしない。正のExcelは『取引更新時間 バッチ駆動時間(X)からY時間前(X-Y hours)の間』と時刻レンジ検索を明示要求している。なお★1の中核である未保存ID抽出は enqueueIfUnsaved/existsBySmaregiStockChangeId(:228-243)で正しく実装済みで、バッチ機構自体は在る。よって欠落しているのは取得窓の時刻レンジ計算・可変期間長という一点で、これは実在の実装違いであり反証不能。
