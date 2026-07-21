# b05-03_0405_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-03_0405_sheet-5_sheet.json#b05-03_0405_sheet-5_sheet-conformance-2f037235dc00`
- 機能: B05-03 B05-03 店頭注文番号初期化
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は例外を捕捉せずコンソールへ伝播すると明記するが、実装は Command 層で Throwable を捕捉し独自エラーメッセージを出力して Command::FAILURE を返す。

## 判定理由
設計書は line 1342（API・バッチ結果）で『本バッチは例外捕捉や通知を行わない』、line 1345（入出力）で『例外発生時はコンソールへ例外が伝播する。本バッチ独自のログ・通知は行わない』、line 1360（エラー処理）で『例外を捕捉せず処理を中断し、コンソールへ伝播する』と一貫して非捕捉伝播を求めている。一方 TruncateWaitingNumberCommand::execute() は line 42 で catch (\Throwable $e) により action の例外を捕捉し、line 43 の $io->error() で『店舗注文番号初期化処理でエラーが発生しました』と例外メッセージを出力、line 48 で Command::FAILURE を返す。例外を捕捉して終了コードへ変換し独自メッセージも出力しており、設計の非捕捉伝播と異なる実装違いが事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1342-1360` — 設計要求（API・バッチ結果/入出力/エラー処理）

```html
          <div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>コマンド名。引数は使用しない。</td></tr><tr><td>実行条件</td><td>特になし。対象が0件でも実行できる。</td></tr><tr><td>成功結果</td><td>店頭注文番号テーブルが空になり、採番カウンタが1へ戻る。</td></tr><tr><td>失敗結果</td><td>削除またはカウンタ初期化の途中で例外が発生した場合は処理が中断する。本バッチは例外捕捉や通知を行わない。</td></tr><tr><td>再実行時</td><td>何度実行しても結果は同一（空テーブル・カウンタ1）になる。冪等である。</td></tr></tbody></table></div>
          <hr>
          <h2 id="function-design-b05-03-b05-03_batch_order_order_store_call_number_initialize-入出力">入出力</h2>
          <div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>コマンド名。</td></tr><tr><td>成功時出力</td><td>店頭注文番号テーブルの全削除と採番カウンタの初期化。</td></tr><tr><td>失敗時出力</td><td>例外発生時はコンソールへ例外が伝播する。本バッチ独自のログ・通知は行わない。</td></tr><tr><td>副作用</td><td>店頭注文番号テーブルのレコード消失と採番カウンタのリセット。</td></tr></tbody></table></div>
          <p>このバッチは破壊的であり、テーブル内の店頭注文番号と紐づく受注IDの対応はすべて失われる。実行後は過去に提示済みの整理番号を本テーブルから参照できなくなり、採番は最初の番号から再開する。実行タイミングの妥当性は運用を正とする。</p>
          <hr>
          <h2 id="function-design-b05-03-b05-03_batch_order_order_store_call_number_initialize-データ整合性">データ整合性</h2>
          <div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>多重実行</td><td>ロックを持たない。複数同時実行でも結果は空テーブル・カウンタ1で同一になる。</td></tr><tr><td>途中失敗・再実行</td><td>削除と採番カウンタ初期化は別の文として順に実行する。削除のみ成功してカウンタ初期化前に中断した場合でも、再実行で空テーブル・カウンタ1に収束する。</td></tr><tr><td>参照時点</td><td>実行時点の店頭注文番号テーブルの全レコードを対象とする。</td></tr><tr><td>データ消失</td><td>削除した店頭注文番号と受注IDの対応は復元しない。整理番号モニタ等の参照先は実行後に空となる。</td></tr></tbody></table></div>
          <hr>
          <h2 id="function-design-b05-03-b05-03_batch_order_order_store_call_number_initialize-DBカラム">DBカラム</h2>
          <p>機能に直接関係する列のみ記載する。型や一覧の細部はスキーマを参照する。</p>
          <p>テーブル・列名はec-cube-enterpriseを正とする。現行（pf-eccube3）と異なる場合は移行先名を主とし現行名を括弧で添える。</p>
          <div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_waiting_number</code></td><td><code>waiting_number</code></td><td>店頭注文番号。現行は自動採番値で初期化時にAUTO_INCREMENTを1へ戻す。</td></tr><tr><td><code>dtb_waiting_number</code></td><td><code>order_id</code></td><td>紐づく受注ID。全レコード削除の対象。</td></tr><tr><td><code>dtb_waiting_number_counter</code></td><td><code>current_value</code></td><td>移行先の採番カウンタ（現行はテーブルのAUTO_INCREMENTで代替。初期化対象はこの列となる見込み、ec-cube-enterprise実装で要確認）。</td></tr></tbody></table></div>
          <h3 id="function-design-b05-03-b05-03_batch_order_order_store_call_number_initialize-DB操作">DB操作</h3>
          <p>永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。</p>
          <div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>登録/更新</td><td>dtb_waiting_number / dtb_waiting_number_counter</td><td>当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。</td></tr></tbody></table></div>
          <hr>
          <h2 id="function-design-b05-03-b05-03_batch_order_order_store_call_number_initialize-エラー処理">エラー処理</h2>
          <div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>コマンド名が未指定・不一致</td><td>処理を行わずに終了する。</td></tr><tr><td>対象が0件</td><td>削除文と採番カウンタ初期化を実行し、空テーブル・カウンタ1で完了する。</td></tr><tr><td>削除・初期化中の例外</td><td>例外を捕捉せず処理を中断し、コンソールへ伝播する。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:42-48` — 実装（Throwable 捕捉と FAILURE 変換）

```php
        } catch (\Throwable $e) {
            $io->error([
                '店舗注文番号初期化処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず指摘は維持。実装は TruncateWaitingNumberCommand::execute の line 42 で `catch (\Throwable $e)` により Action の例外を捕捉し、line 43-46 で $io->error(['店舗注文番号初期化処理でエラーが発生しました', ...]) を出力、line 48 で return Command::FAILURE と終了コードへ変換しており、例外はコンソールへ再スロー/伝播されない。設計は line 1342『本バッチは例外捕捉や通知を行わない』、line 1345『例外発生時はコンソールへ例外が伝播する。本バッチ独自のログ・通知は行わない』、line 1360『例外を捕捉せず処理を中断し、コンソールへ伝播する』と3箇所で一貫して非捕捉伝播を要求。rg で truncate-waiting-number を処理する Command は本ファイルのみ(別ルート・別Subscriber・通知経路なし)。designQuote は該当行に実在。実装違いは事実。
