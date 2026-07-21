# b06-02_0406_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b06-02_0406_sheet-4_sheet.json#b06-02_0406_sheet-4_sheet-conformance-7350f356752e`
- 機能: B06-02 B06-02 買取集計バッチ
- 観点: ⑦要求網羅・実装違い

## 要旨
部門未設定商品一覧を取得する getNoSectionProducts() の SQL が WHERE 直後に AND を置く構文不正で、部門未設定商品通知メールが正常に生成できない。

## 判定理由
設計は集計日の店頭買取から部門未設定商品の一覧を取得し、その商品名・商品コードを本文に載せた通知メールを送ることを要求している（処理フローstep6 / 通知本文 / 入出力）。実装 BatchAggregateSummaryAction::handle() は getNoSectionProducts() の戻り値が空でなければ sendNoSectionAlertMail() を呼ぶ流れ（DtbOtcBuyOrderRepository.php:50-52）を持つが、getNoSectionProducts() のネイティブ SQL は本体・UNION 側の両方で `WHERE` 直後に `AND obo.complete_date >= :from` が続いており（956-958行・969-971行）、SQL 構文として実行不能。対象日に店頭買取データが存在すると createNativeQuery 実行時に構文エラーで例外となり、handle() の catch により通知は送られず集計エラーメールに転じるため、部門未設定商品一覧の取得・通知本文生成に到達しない。加えて同 SQL には集計対象ステータス条件（設計: 完了・ダブルチェック済み・入力済みに限定）が無く、complete_date 範囲のみで判定している。実装違いを確認した。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:1094-1094` — 設計要求

```html
          <p>集計結果はファイルではなく買取集計テーブル（<code>dtb_otc_buy_order_summary</code>）へ登録する。部門未設定商品の通知メールには商品名・商品コードの一覧を本文に載せる。</p>
```

## ec-cube-enterprise 実装
getNoSectionProducts() の SQL。WHERE 直後に AND が続き実行不能。UNION 側の 969-971 行も同様。
`ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:956-958` — 実装(構文不正SQL)

```php
            WHERE
                AND obo.complete_date >= :from
                AND obo.complete_date <= :to
```

戻り値が空でなければ通知メールを送る流れ。SQL が例外化すると catch に落ちて通知は送られない。
`ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:50-53` — 呼び出し元

```php
            $noSectionProducts = $this->otcBuyOrderRepository->getNoSectionProducts($summaryDate);
            if (!empty($noSectionProducts)) {
                $this->mailService->sendNoSectionAlertMail($noSectionProducts);
            }
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を複数試みたが全て失敗し指摘は維持。(1)引用の正確性: DtbOtcBuyOrderRepository.php:956-958 と 969-971 を実際に開くと確かに `WHERE` の直後に `AND obo.complete_date >= :from` が続いており、先頭条件を欠いた dangling AND となっている。同ファイルの正常動作する集計SQL(850-853行)は `WHERE obo.otc_buy_order_status_id IN (...) AND obo.complete_date >= ?` と先頭に条件があるのと対照的で、getNoSectionProducts だけが `WHERE AND` 構文不正。これは全主要RDBMSでシンタックスエラーとなり createNativeQuery 実行時に例外化する。(2)別実装の存在: `rg 'getNoSectionProducts|NoSection|部門未設定'` を全リポジトリ横断したが、当該メソッドの実装は DtbOtcBuyOrderRepository.php:935 の1箇所のみで、呼び出しも BatchAggregateSummaryAction.php:50 の唯一経路。代替ルート/別Repository/別Serviceは存在しない。(3)テストによる救済なし: BatchAggregateSummaryActionTest はいずれも getNoSectionProducts を mock (line 78/100/139) しており実SQLは一度も実行されないため、構文不正はテストで捕捉されない。(4)設計側の除外なし: 0406設計書は step6『集計日の店頭買取の中から部門未設定商品の一覧を取得する』『部門未設定商品があれば管理者へ通知メールを送る』を本書『扱うこと』に明記し、入出力にも『部門未設定商品の通知メールには商品名・商品コードの一覧を本文に載せる』と要求。Ph2/現行踏襲/対象外の除外注記は当該要求に無い。(5)要求の読み違いなし: 要求はまさにこのバッチの部門未設定通知に掛かっており誤読ではない。加えて設計『対象ステータス: 完了・ダブルチェック済み・入力済みに限定』に対し当SQLは otc_buy_order_status_id 条件を完全に欠く点も指摘通り(集計SQL 851/866行にはあるが本メソッドには無い)。以上より実装は要求を満たしておらず、論破できない。
