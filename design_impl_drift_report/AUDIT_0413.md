# 実装乖離監査 — 0413_基本設計仕様書(バッチ_イベント).html

- 正本: `excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **89要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 2 | ○ |
| 実装違い | 実装はあるが設計と違う | 2 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 36 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 48 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 1 | — |
| **合計** | | **89** | |

## 不具合 3件（P1 1 / P2 1 / P3 1）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 1件は重複として代表へ折り畳んだ（判定そのものは 4件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-3-R005 | 決済処理中チェックバッチ | 未実装 | ふるまい | P1 | 決済中のまま残っているイベント申込について決済サービスへ取引照会が行われ、その結果に応じて申込済みへの更新・保留・論理削除のいずれかが実際に行われる |
| sheet-3-R054 | 決済処理中チェックバッチ | 未実装 | ふるまい | P2 | 申込みを削除したとき、その申込みに紐づく参加プレイヤーの記録も削除済みになり、以後その申込みの参加者として扱われない |
| sheet-3-R049 | 決済処理中チェックバッチ | 実装違い | IO | P3 | うまく処理できなかった申込みが、どの決済番号のものかが分かる形で結果メッセージに1件ずつ並ぶ |

### sheet-3-R005 決済処理中チェックバッチ — 未実装／ふるまい／P1

- 正本: sheet-3（決済処理中チェックバッチ） HTML行 1024 付近
- 正本引用: 「SP.LINKSに取引照会を行い、照会結果に応じた処理を行う」
- 設計期待値: 決済中のまま残っているイベント申込について決済サービスへ取引照会が行われ、その結果に応じて申込済みへの更新・保留・論理削除のいずれかが実際に行われる
- 画像確認: sheet-3 は画像0枚（images/ に sheet-3_img*.png は存在しない）。レイアウト図はなく、判定は本文のみで行った
- 実装参照: `src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:105;src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:191-196`
- 実装実態: 照会結果を返す getApiResponse が「SP.LINKS取引照会API未実装のため、決済処理中チェックはまだ実行できません。」という例外を無条件に投げるだけで（src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:193-195）、照会は1件も行われない。対象申込は全件が src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:164-172 の例外処理へ落ち、エラー通知メールが送られたうえで src/Eccube/Command/PaymentStatusCheckCommand.php:57-61 が異常終了になる。申込済みへの更新・保留・論理削除はどれも起こらない
- 判定根拠: 照会を行う唯一の入口が例外で固定されており（src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:193）、照会結果に応じた処理（src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:108-163）は現状どの経路でも到達しない。決済画面から離脱した申込は決済中のまま滞留し続ける
- 確信度: high

### sheet-3-R054 決済処理中チェックバッチ — 未実装／ふるまい／P2

- 正本: sheet-3（決済処理中チェックバッチ） HTML行 1080 付近
- 正本引用: 「申込みを削除するとき、その申込みに紐づく参加プレイヤーの記録も併せて削除する」
- 設計期待値: 申込みを削除したとき、その申込みに紐づく参加プレイヤーの記録も削除済みになり、以後その申込みの参加者として扱われない
- 画像確認: sheet-3 は画像0枚（images/ に sheet-3_img*.png は存在しない）。レイアウト図はなく、判定は本文のみで行った
- 実装参照: `src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:156-160;src/Eccube/Entity/DtbEntryPlayer.php:53-54`
- 実装実態: 削除は申込みの削除日時を入れるだけで（src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:158）、参加プレイヤーの記録には手を付けない。参加プレイヤーは削除日時の項目を持つが（src/Eccube/Entity/DtbEntryPlayer.php:53-54）、ee 全体で参加プレイヤーの削除日時を設定する箇所は1つも無く、参加プレイヤーを取り出す検索も削除済みかどうかを見ずに申込みIDだけで引く（src/Eccube/Repository/DtbEntryPlayerRepository.php:76-90、src/Eccube/Repository/DtbEntryPlayerRepository.php:96-105）
- 判定根拠: 削除処理（src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:156-160）に参加プレイヤーを消す処理が無い。参加プレイヤーは削除日時で消す作りになっているのに設定されないため、削除した申込みの参加者の記録が残り続ける。申込みの重複判定は参加プレイヤーをたどって行われ、そこでは申込みの削除日時も見ていないため（src/Eccube/Repository/DtbEventEntryRepository.php:333-353）、削除された申込みの参加者が同じイベントへ申し込めない状態になり得る
- 確信度: high

### sheet-3-R049 決済処理中チェックバッチ — 実装違い／IO／P3

- 正本: sheet-3（決済処理中チェックバッチ） HTML行 1074 付近
- 正本引用: 「終了コードは異常。取引が不在・未完了・取引エラーとなった申込みについて、決済番号を添えたメッセージを結果メッセージに列挙する」
- 設計期待値: うまく処理できなかった申込みが、どの決済番号のものかが分かる形で結果メッセージに1件ずつ並ぶ
- 画像確認: sheet-3 は画像0枚（images/ に sheet-3_img*.png は存在しない）。レイアウト図はなく、判定は本文のみで行った
- 実装参照: `src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:175-178;src/Eccube/Command/PaymentStatusCheckCommand.php:57-63`
- 実装実態: 結果メッセージは「対象：n件、更新：n件、保留：n件、削除：n件、エラー：n件」という件数だけで（src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:177）、決済番号は1件も載らない。保留になった申込の決済番号は運用記録側にしか出ない（src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:151）
- 同じ実装実態でまとまる要求: sheet-3-R050（決済処理中チェックバッチ / 実装参照 `src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:175-178;src/Eccube/Command/PaymentStatusCheckCommand.php:58-63`）
- 判定根拠: 結果メッセージを組み立てているのは src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:175-178 だけで、決済番号を並べる処理が無い。src/Eccube/Command/PaymentStatusCheckCommand.php:58 と src/Eccube/Command/PaymentStatusCheckCommand.php:63 もこの文字列をそのまま出しているため、どの申込が処理できなかったかを結果メッセージから特定できない
- 確信度: med

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 4 | 0 | 0 | 0 | 4 |
| sheet-3 | 決済処理中チェックバッチ | 56 | 2 | 2 | 0 | 52 |
| sheet-4 | コンビニ支払チェックバッチ | 23 | 0 | 0 | 0 | 23 |

