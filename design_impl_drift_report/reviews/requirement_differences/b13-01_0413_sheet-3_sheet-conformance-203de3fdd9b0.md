# b13-01_0413_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b13-01_0413_sheet-3_sheet.json#b13-01_0413_sheet-3_sheet-conformance-203de3fdd9b0`
- 機能: B13-01 B13-01 決済処理中チェックバッチ
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は想定外エラーを重複排除して1つにまとめ管理者へ一括通知することを要求するが、実装は申込みごとの catch で即時に個別通知メールを送信しており、集約・重複排除・ループ後一括通知が無い。

## 判定理由
設計書（0413_基本設計仕様書 sheet-3, B13-01）は処理フロー(936行)・業務ルール(942行)・エラー処理(962行)で『取引不在・未完了以外の想定外エラーは1つにまとめ／重複を除いてまとめ、管理者へ通知する』ことを明確に要求している。実装 PaymentStatusCheckAction.php の foreach 内 164-172行の catch (\Throwable $e) 節では、その場で $this->mailService->sendEventPaymentErrorAlertMail($EventEntry, $e->getMessage()) を呼び出して申込みごとに即時送信し $cntError++ しているだけである。grep でファイル全体を確認したが、エラーメッセージを蓄積する配列・array_unique 等の重複排除・ループ後にまとめて送信する処理は一切存在しない（167行の内側 catch は $mailException のログ用で集約ではない、176-177行は件数集計のみ）。よって同一の想定外エラーが対象申込みの数だけ重複通知され得るため、設計と実装が異なる『実装違い』として事実確認できる。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html:936-942` — 設計要求

```html
          <ol><li>申込みステータスが設定時間（処理中とみなす分数）以上「決済中」のイベント申込を抽出する。</li><li>対象が0件の場合は、対象が無い旨を返して終了する。</li><li>申込みごとに決済サービスへ取引を照会し、結果のメッセージと新ステータスを得る。</li><li>取引が存在しない場合は当該申込みの記録を取り除く。取引が成立している場合は新ステータスへ更新する。</li><li>直前と同じ決済番号の申込みは、前回の照会結果に従って同様の処理を行う。</li><li>取引不在・未完了以外の想定外エラーは1つにまとめ、管理者へ通知メールを送信する。</li><li>申込履歴を記録し、更新を確定する。</li></ol>
          <hr>
          <h2 id="function-design-b13-01-b13-01_batch_event_event_check_processing_payment-集計条件">集計条件</h2>
          <div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>抽出対象</td><td>申込みステータスが設定時間以上「決済中」のイベント申込。</td></tr><tr><td>照会単位</td><td>申込みごと。同一決済番号は前回結果を流用する。</td></tr></tbody></table></div>
          <hr>
          <h2 id="function-design-b13-01-b13-01_batch_event_event_check_processing_payment-業務ルール・計算">業務ルール・計算</h2>
          <div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>ステータス整合</td><td>照会結果に応じて、更新・記録除去・エラー通知のいずれかを行う。</td></tr><tr><td>エラー集約</td><td>取引不在・未完了以外のエラーは重複を除いてまとめ、管理者へ通知する。</td></tr><tr><td>履歴記録</td><td>処理した申込みについて申込履歴を記録する。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
foreach 内の申込みごとの catch 節で即時に個別メール送信し cntError を加算。集約・重複排除・一括送信は無い。
`ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:164-172` — 実装

```php
                } catch (\Throwable $e) {
                    try {
                        $this->mailService->sendEventPaymentErrorAlertMail($EventEntry, $e->getMessage());
                    } catch (\Throwable $mailException) {
                        log_error('イベント決済確認エラー通知メール送信失敗: '.$mailException->getMessage(), ['exception' => $mailException]);
                    }
                    log_error('決済処理中チェックでエラー発生: '.$e->getMessage(), ['exception' => $e]);
                    $cntError++;
                }
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を複数試みたが全て失敗し、指摘は維持。(1)別実装の探索: rg で sendEventPaymentErrorAlertMail の呼び出しは PaymentStatusCheckAction.php:166 の1箇所のみ。array_unique / errorMessages / errorList / implode / 集約用配列は Payment 配下・Command・MailService いずれにも存在しない。呼出元 PaymentStatusCheckCommand.php も handle() を1回呼ぶだけで集約処理は無い。(2)引用検証: 実装 PaymentStatusCheckAction.php の foreach(88-173行)内、164-172行の catch(\Throwable $e) は申込みごとに即時 sendEventPaymentErrorAlertMail($EventEntry, $e->getMessage()) を呼び $cntError++ するのみで、引用は正確。MailService::sendEventPaymentErrorAlertMail(1642行) は単一 DtbEventEntry と単一 message を受け取りテンプレートに entry/message を1件だけ渡す設計で、配列集約を受け付けない。(3)設計側除外の確認: 対象外リスト(920行)はメール本文・宛先設定を対象外とするのみで、エラー集約ロジックは除外していない。リニューアル移行時の扱い(923-925行)もバッチ起動方式を要確認とするだけ。Ph2/現行踏襲/実装しない等の注記は集約要件に付いていない。(4)要求の読み違いの確認: 設計は処理フロー936行『想定外エラーは1つにまとめ、管理者へ通知メールを送信する』、業務ルール942行『重複を除いてまとめ、管理者へ通知する』、エラー処理962行『想定外エラー: 重複を除いてまとめ、管理者へ通知する』と3箇所で一貫して集約・重複排除・一括通知を要求しており誤読の余地なし。実装は申込み単位の即時個別送信で真逆。加えて getApiResponse(191-196行)が常に LogicException(API未実装) を throw するため、全対象申込みが 164行の catch に落ち同一メッセージのメールを対象件数だけ重複送信する構造で、設計が防ごうとした重複通知がまさに発生する。よって実装違いは事実として確定。
