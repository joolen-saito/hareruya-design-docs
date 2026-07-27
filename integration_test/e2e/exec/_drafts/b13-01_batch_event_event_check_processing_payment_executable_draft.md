# B1候補: b13-01 バッチ イベント管理 — 決済処理中チェックバッチ — 実行可能グレード候補（母集合21全量踏破）

> 2026-07-26 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> **カスタマイズ区分=現行踏襲（T2＝excel-primary）**。オラクル（期待値の正）は設計書md
> `functions/pf-eccube3/b13-01_batch_event_event_check_processing_payment.md`＋観点表＋基本設計。**ee実ソースはL1出典にしない**
> （照合補助＝コマンド起動口/セレクタ源/観測対象テーブル特定/踏襲確認のみ）。SUT/オラクル不変・母集合期待は改変しない。
> source_class=excel-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。fixture_version は全て `@TBD-D5`。
> **O5合格・承認済み草案・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。出力隔離: 本md＝`_drafts/`。
> 先例（形式踏襲）=`_drafts/f04-04_front_cart_shopping_complete_executable_draft.md`。
>
> **本機能はコンソールバッチ（HTTP画面なし・md:11）**。両レイヤ網羅の方針: (A)バッチ起動＝コンソールコマンドの
> **API/統合レイヤ（＝HTTP APIの意でなく「コマンド起動口を叩く統合実行レイヤ」）**（コマンド実行→終了コード＋標準出力の処理件数）で観測。(B)副作用（申込ステータス更新・記録除去・
> 申込履歴記録・エラー通知メール）を**DBアサーション＋メール隔離**で観測。管理画面UI観測は本バッチに固有画面が無く該当なし。
>
> **重大所見（ee照合・§0/§9）**: ①ee は本バッチを実装済み＝コマンド`eccube:payment-status-check`（ee照合:
> `PaymentStatusCheckCommand.php:35`）。設計md（pf現行）のコマンド名`entry:batch checkProssesingPayment`（md:49,69）
> とは**名称が異なる**が、設計md自身が「バッチ起動方式は移行先で要確認」（md:49）とし ee で確認できる＝**bound（起動口実在）**。
> ②ee `getApiResponse()`は**SP.LINKS取引照会API未実装で無条件に`LogicException`をthrow**（ee照合:
> `PaymentStatusCheckAction.php:191-196`）。このため「取引成功→ステータス更新／取引不在→記録除去」の**正常経路は現ee到達不能**で、
> 対象申込が1件でもあると全て想定外エラー分岐（`cntError++`・FAILURE・エラー通知メール送信）へ流れる＝**部分実装のEEドリフト**。
> 対象0件のときのみ成功終了（既存テスト実装`PaymentStatusCheckCommandTest.php:testExecute`が存在＝実走可能な設計。本セッションで実行ログは未取得）。
>
> **母集合21の会計（差分0）**: bound成功**9**（§4.1・C-01/C-02/C-03＝現eeでコマンド実行→終了コード＋処理件数を観測可）
> ＋partial**1**（§4.2・C-P1＝副作用行。エラー通知メール送信試行=bound枝／外部SMTP送達=要実機枝／ステータス更新・記録除去・
> 履歴記録=EEドリフト枝〔API未実装で到達不能・md:141内部矛盾〕）＋要実機**1**（§4.3・C-R1＝エラー通知メールの外部SMTP送達）
> ＋excluded**10**（§4.6・エラー通知メールの件名/本文/ヘッダ/添付＝本バッチにreferent〔入力/編集フォーム・添付機能〕が構造的に無い〔第一根拠〕・本文/宛先は補助的にmd:32委譲）。
> **9+1+1+10=21・差分0**（§8で機械実証・python検算で重複0/欠番0/1..21全被覆）。TBD=0（起動方式はeeで確認済＝bound）。

---

## §0 版固定・判定原則・外部依存の切り分け

- **設計書正本（オラクル）**: `functions/pf-eccube3/b13-01_batch_event_event_check_processing_payment.md`（本repo・186行。以下「md:行」）。
  md:9「カスタマイズ区分は現行踏襲であり、挙動の確認はpf-eccube3を参照し、DB関連の記述はec-cube-enterpriseを正とする」
  →**挙動＝pf現行踏襲spec（設計md）がオラクル、DB永続化先名称のみee**。
- **観点表**: `integration_test/integration-test-viewpoints.md`（IT-11/IT-12/IT-28/IT-30の生成器由来ラベルは判定に用いず期待テキストで判定）。
- **ee実ソース（照合補助＝L1出典にしない）**: `/home/y-saito/Developments/ec-cube-enterprise`（作業ツリー実測・版固定D5/D6）。
  コマンド起動口・観測対象テーブル特定・踏襲確認にのみ用いる。
  - Command = `src/Eccube/Command/PaymentStatusCheckCommand.php`
    - `#[AsCommand(name: 'eccube:payment-status-check', …)]`（:35）。`execute()`（:45-66）: `handle()`結果を受け、
      `$result['error']>0`または例外時に`$io->error(…)`＋`Command::FAILURE`（:52-60）、正常時`$io->success('決済処理中チェックが
      完了しました。'.$result['detail'])`＋`Command::SUCCESS`（:63-65）。**detailに処理件数文字列**を含む。
  - Action = `src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php`
    - `handle()`（:65-184）: FlockStore二重起動防止ロック（:68-73）／`getBeforeMinutesEntry(30)`で対象抽出（:78）／
      申込ごとにENTERED履歴重複チェック（:90-97）→`getApiResponse($paymentNo)`（:105）→OK時ステータスをENTEREDへ更新＋
      履歴INSERT＋クレジット決済完了メール（:108-147）／pendingコード時は保留（:150-153）／それ以外は論理削除
      `setDeletedAt`（:155-162）／`catch`で`sendEventPaymentErrorAlertMail`＋`cntError++`（:164-172）／
      結果`['error'=>$cntError,'detail'=>'対象：…件、更新：…件、保留：…件、削除：…件、エラー：…件']`（:175-178）。
    - `getApiResponse()`（:191-196）: **`throw new \LogicException('SP.LINKS取引照会API未実装…')`＝無条件throw（未実装）**。
  - Repo = `src/Eccube/Repository/DtbEventEntryRepository.php:261-281` `getBeforeMinutesEntry`＝
    `EntryStatus=PROCESSING_PAYMENT(1)` かつ `createDate<=now-N分` かつ `paymentNo IS NOT NULL` かつ `deletedAt IS NULL`。
  - Entity = `src/Eccube/Entity/DtbEventEntry.php`（`entry_status_id`:39-41／`payment_no`:50-51／`deleted_at`:66-67／`PayingCustomer`:58）・
    `DtbEntryHistory.php`／`Master/MtbEntryStatus.php`（`PROCESSING_PAYMENT=1`:29・`ENTERED=4`:33）。
  - Mail = `src/Eccube/Service/MailService.php`（`sendEventPaymentErrorAlertMail`:1642-1690〔`$this->mailer->send`:1678＝外部SMTP・
    alert宛先=`MtbOption::ALERT_CHECK_PAYMENT_ERROR_MAIL_ADDRESS`・テンプレ`MailTemplate::EVENTENTRY_CREDIT_ERROR`〕・
    `sendCreditPaymentCompleteMail`:1595）。`mailer.yaml:2` `env(MAILER_DSN): 'null://null'`（既定＝そのままなら非送達）。
  - 既存テスト = `tests/Eccube/Tests/Command/PaymentStatusCheckCommandTest.php`（`CommandTester`でコマンド実行→
    exit 0＋`[OK]`を検証＝**対象0件経路の実走可能な実装が存在**（本セッションで実行ログは未取得）。照合補助＝L1出典にしない）。
- **母集合**: `…_mother_slice.tsv` の全**21行**（-001〜-021）。
- **判定原則**: 母集合の観点ラベル（IT-11/12/28/30・実行結果/件名/本文/ヘッダ/JSON形式/レスポンス/公開・締切）は**生成器ノイズ**。
  bindは各行の**「期待結果／レスポンス」実テキスト**で判定する（§8に全21行併記）。
- **外部依存の切り分け（T2ルーティング）**:
  - **要実機＝真の外部送達/実応答のみ**: ①エラー通知メールの外部SMTP実送達（`sendEventPaymentErrorAlertMail`の
    「指定宛先への送信・転送が正常終了」）、②SP.LINKS取引照会APIの実応答（`getApiResponse`＝現ee未実装）。
  - **bound＝自社DB/コンソール出力で観測可能**: コマンド実行の終了コード（SUCCESS/FAILURE）・処理件数文字列（detail）・
    エラー表示（`$io->error`）・申込ステータス/論理削除/履歴のDBアサーション。破壊的でも隔離テストDB＋seed＋S0復元で観測可＝要実機でない。
  - **partial＝1行の期待テキストが自社DB観測部分（bound枝）と外部送達部分（要実機枝）と現ee未到達部分（ドリフト枝）を混在**（§4.2）。
  - **excluded＝メール件名・本文・宛先・添付**（md:32「エラー通知メールの本文・宛先設定はメール設定・テンプレート管理を正とする」＝別機能委譲）。

---

## §1 L1原子オラクル表（**出典=設計書md／観点表。ee実ソースはL1出典にしない**）

全14 claim。LS（locale_sensitive）は本機能に画面文言が無く該当なし（コンソール出力文言は実装値で仕様未確定＝期待化しない）。

| oracle_id | 観点 | claim（現行踏襲spec＝設計mdが正） | 根拠(md:line) | 外部依存 |
|---|---|---|---|---|
| L1-B1301-001 | route/entry | 起動はコンソールのバッチコマンド。**コマンド名が一致しない場合は処理を行わずに終了する**。バッチ起動方式（コマンド名・実行基盤）は移行先で要確認 | md:11,49,69-71 | 否（ee照合: コマンド実在=eccube:payment-status-check・`PaymentStatusCheckCommand.php:35`） |
| L1-B1301-002 | extract | 申込ステータスが**設定時間以上「決済中」**のイベント申込を抽出する | md:79,93,136 | 否（自社DB検索・seedで到達） |
| L1-B1301-003 | zero_target | 対象が0件の場合は、対象が無い旨を返して**何もせず終了する** | md:80,112,163 | 否（コンソール出力＋終了コードで観測） |
| L1-B1301-004 | query_per_entry | 申込みごとに決済サービスへ取引を照会し、結果メッセージと新ステータスを得る | md:81,94,113 | **要（SP.LINKS実応答・現ee未実装）** |
| L1-B1301-005 | outcome | 取引が存在しない場合は当該申込みの記録を取り除く。取引が成立している場合は新ステータスへ更新する | md:82,102,153 | 否（DBアサーション。ただし現eeはAPI未実装で経路未到達＝§4.1/§9ドリフト） |
| L1-B1301-006 | payment_no_reuse | 直前と同じ決済番号の申込みは、前回の照会結果に従って同様の処理を行う | md:83,94 | 否（自社ロジック。現eeに流用実装見当たらず＝§9ドリフト） |
| L1-B1301-007 | error_aggregate | 取引不在・未完了以外の想定外エラーは**重複を除いて1つにまとめ**、管理者へ通知メールを送信する | md:84,103,165 | 否（集約はDB/ログで観測可）／**要（通知メール外部SMTP送達）** |
| L1-B1301-008 | history | 処理した申込みについて**申込履歴を記録**し、更新を確定する | md:85,104,124,137,154 | 否（`dtb_entry_history`をDBアサーション） |
| L1-B1301-009 | side_effects | 成功時出力/副作用＝申込ステータス更新・記録除去・申込履歴記録・想定外エラーの管理者通知（エラー通知メール） | md:122,124 | 否（DB）／要（メール送達）＝混在 |
| L1-B1301-010 | db_read_only | DB操作は参照系（検索）で `dtb_entry_history`/`dtb_event_entry` を抽出。**登録・更新・削除は行わない** | md:141,143-145 | 否／**設計md内部矛盾**（md:82,124は更新/記録除去を規定・§9 BC-DRAFT②） |
| L1-B1301-011 | job_result | バッチ入力はコマンド名。成功時は対象申込みのステータスを整合させ、対象0件なら何もせず完了する（実行結果に終了状態・件数） | md:112,121 | 否（終了コード＋detail件数で観測） |
| L1-B1301-012 | no_screen | 本機能はHTTPで届く画面を持たない（コンソールコマンドのみ） | md:11,71 | 否 |
| L1-B1301-013 | mail_delegated | エラー通知メールの**本文・宛先設定はメール設定・テンプレート管理を正とする**（別機能・本書では仕様確定しない） | md:32 | — |
| L1-B1301-014 | schedule_delegated | バッチの起動スケジュールは運用・ジョブ設定を正とする（別機能・本書では仕様確定しない） | md:33 | — |

---

## §2 SEED三段参照設計・破壊系S0

三段参照: **期待の正=L1オラクルID（§1・設計md） → 前提状態=SEEDセットID → 観測=実値（コンソール終了コード/detail・db.ts）**。

| SEEDセットID | 目的 | 内容（要点・ee照合で観測対象特定） |
|---|---|---|
| SEED-B1301-EMPTY | 対象0件（成功終了） | `EntryStatus=PROCESSING_PAYMENT(1)`・`createDate<=now-30分`・`payment_no NOT NULL`・`deleted_at NULL` を満たす申込を**用意しない**（既存の該当行があればseed窓外へ退避）。コマンド実行→exit SUCCESS＋detail「対象：0件…」（既存テスト実装`PaymentStatusCheckCommandTest.php`が存在＝実走可能・本セッションで実行ログ未取得） |
| SEED-B1301-TARGET1 | 抽出対象1件（現eeでは想定外エラー分岐＝EEドリフト） | `dtb_event_entry`（`entry_status_id=1`・`payment_no`非NULL・`create_date`を30分より前・`deleted_at NULL`・`PayingCustomer`設定）＋親（`dtb_event`・`dtb_event_detail`・`dtb_customer`）。ENTERED履歴（`entry_status_id=4`）は無いこと（ee照合: `PaymentStatusCheckAction.php:90-97`の重複チェックで除外されないため） |
| SEED-B1301-ENTERED-HIST | 抽出はされるがENTERED履歴済で件数から除外 | 上記＋`dtb_entry_history`に`entry_status_id=4`行あり（`cntEntries--`・continue＝ee照合`:90-97`） |
| SEED-B1301-MAILCONF | エラー通知メール送信の前提（**C-P1のbound枝＝`dtb_mail_history`観測の必須前提**） | `MtbOption ALERT_CHECK_PAYMENT_ERROR_MAIL_ADDRESS`（option_key=`check_payment_error_mail_address`）に宛先・`MailTemplate` id=210（`EVENTENTRY_CREDIT_ERROR`）テンプレを用意。**未設定時は`mailer->send`前にLogicException＝`dtb_mail_history`行は生成されず履歴観測不能**（ee照合`MailService.php:1650-1666`）。FAILURE到達自体（cntError++）はテンプレ/宛先の有無に関わらず不変（catch内でlog+計上・`PaymentStatusCheckAction.php:164-172`） |

### 破壊系S0スナップショット・復元設計（対象・順序を特定）

**重要（ee実測）**: 現ee は `getApiResponse()`が無条件throw（`PaymentStatusCheckAction.php:191-196`）のため、対象申込があっても
**OK分岐のステータス更新/履歴INSERT（:108-147）・else分岐の論理削除（:155-162）はいずれも到達しない**（throwは:105で発生し:164のcatchへ）。
よって**現eeで対象申込を投入してもコマンドは`dtb_event_entry`/`dtb_entry_history`を書き換えない**（副作用は`cntError++`＋エラー通知メール送信のみ）。
それでも将来のAPI実装時（および設計md正本の副作用）に備え、破壊系S0対象・順序を特定し afterEach 復元を設計する。

| 対象 | スナップショット項目 | 復元方法（raw SQL・FK子→親順） |
|---|---|---|
| `dtb_entry_history`（子） | seed投入した履歴ID／バッチが追加し得る行 | `DELETE FROM dtb_entry_history WHERE event_entry_id = $1`（seed対象申込ID）。※現eeでは追加0件だが将来INSERT分を掃除 |
| `dtb_event_entry`（申込） | `entry_status_id`・`deleted_at`（S0値） | 使い捨てseedは`DELETE FROM dtb_event_entry WHERE id = $1`。既存行を使う場合は`UPDATE dtb_event_entry SET entry_status_id=$1, deleted_at=$2 WHERE id=$3`でS0復元 |
| `dtb_event_detail`/`dtb_event`/`dtb_customer`（親） | seed投入分 | 使い捨てseedをFK順で`DELETE`（申込→履歴削除後に親削除） |
| メール送信 | `mailer.yaml:2` null transport（codeception環境は`smtp://mailcatcher`＝ローカルcatcher） | 外部非送達/ローカルcatcher（真の外部SMTPには出ない・S0対象外）。`dtb_mail_history`にsave（`MailService.php:1682`）＝seed窓内の追加行を掃除。相関キー=`template_id`（MailHistoryEntityManager saveは`$MailTemplate`＝id=210を保存）＋`send_date`がseed窓内、で識別。復元SQL骨子=`DELETE FROM dtb_mail_history WHERE template_id = 210 AND send_date >= :seedWindowStart`（正確な列名の実配線のみ`@TBD-D5`。ee照合: `src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:33-68`＝`setMailTemplate`/`setSendDate`実在） |
| メール前提マスタ | `MtbOption ALERT_CHECK_PAYMENT_ERROR_MAIL_ADDRESS`（option_key=`check_payment_error_mail_address`・ee照合`MtbOption.php:92`）／`MailTemplate` id=210（`EVENTENTRY_CREDIT_ERROR`・ee照合`MailTemplate.php:84`） | SEED-B1301-MAILCONFで投入。既存行があればoption_value（宛先）のS0値を退避し`UPDATE mtb_option SET option_value=:s0 WHERE option_key='check_payment_error_mail_address'`で復元。テンプレは既存id=210を使う場合スナップショット不要（読取のみ）・使い捨て投入時はFK順で`DELETE`（配線`@TBD-D5`） |

- **raw SQLで復元**（ORM/Doctrineを経由せず`update_date`等を確実に元値へ戻す。f04-04/f06-19のS0設計踏襲）。
  **db.tsの実配線のみ`@TBD-D5`**（対象・順序は本§で特定済み）。**冪等性担保**: 各SEEDは使い捨て・独立・afterEach復元。
- **戻せない副作用（安全境界）**: FlockStoreロックは`finally`で解放（`PaymentStatusCheckAction.php:179-181`）＝残留しない。
  ログ出力（`log_error`）は掃除対象外（業務影響なし）。

### 外部副作用の隔離ハーネス設計（checkout系T2と共有・現状ee整備状況を実測明示）

| 外部副作用 | 隔離設計 | ee現状（実測） | 整備状態 |
|---|---|---|---|
| エラー通知/決済完了メール（SMTP） | `MAILER_DSN`をnull transport（`null://null`）に固定し外部非送達。送信試行は`dtb_mail_history`/mail collectorで観測 | `mailer.yaml:2`で既定`env(MAILER_DSN): 'null://null'`＝実在。**ただしテスト用環境`.env.docker_codeception:10`で`MAILER_DSN="smtp://mailcatcher:1025"`に上書きされる（ee実測）**＝codeception実行時はmailcatcher（ローカルcatcher・真の外部でない）へTCP送信される。null transport下では非送達だがcodeception環境下ではmailcatcherが捕捉（いずれも真の外部SMTPへは出ない） | **未整備**（起動時に実効`MAILER_DSN`を検査し`null://null`または`smtp://mailcatcher:...`以外を失敗させる検査が必要。既定値だけでは隔離を保証できない） |
| SP.LINKS取引照会API（外部応答） | 現eeは`getApiResponse`が未実装throw＝**そもそも外部通信しない**。将来実装時はサンドボックス/スタブ差替が必要 | `PaymentStatusCheckAction.php:191-196`が無条件`LogicException` | 外部通信なし（現状）。将来API実装後は`@TBD(ハーネス)` |
| 起動時検査 | テスト起動時に外部hostへ出ない構成（MAILER_DSN=null系）をアサート | 未実装 | **未整備（@TBD(ハーネス)）** |

- 結論の言い方（統一）: bound（コマンド実行→終了コード/件数/DBアサーション）は**「（メール隔離ハーネス整備＝起動時DSN検査を前提に）
  bound観測可能。対象0件経路は既存テスト実装（`PaymentStatusCheckCommandTest.php`）が存在し実走可能な設計だが本セッションで実行ログは未取得、
  対象1件経路は終了コード=FAILURE＋detailで観測可（ただしFAILUREは設計期待でなく現eeのAPI未実装例外に依存＝EEドリフト再現ケース・§9③）」**。
  外部送達の成否（C-R1）はアサーションに含めない。

- **メール送信の前提依存（ee実測・C-P1のbound枝に影響）**: `sendEventPaymentErrorAlertMail`は**MailTemplate(id=210)がnull または alert宛先が空 のとき`mailer->send`前に`LogicException`をthrow**（ee照合: `MailService.php:1649-1666`）。
  `dtb_mail_history`へのsaveは`mailer->send`成功後（`MailService.php:1678-1683`）に限られる。したがって**SEED-B1301-MAILCONF（テンプレ+宛先）が無いとメール送信は履歴save前にthrowし`dtb_mail_history`行は生成されない**＝C-P1の「`dtb_mail_history` save観測可（bound枝）」は**SEED-B1301-MAILCONFが必須前提**。未整備時はFAILURE（cntError++は不変）のみ観測可で履歴行は観測不能。テンプレ/宛先の欠如でも最終的にcatch内でlog+cntError++＝FAILURE到達は不変（`PaymentStatusCheckAction.php:164-172`）。

---

## §3 画面項目マトリクス（本機能は画面なし）

本バッチは**HTTPで届く画面を持たない**（md:11,71）。三値比較（設計md／eeフォーム／eeDB）の対象となる入力項目は存在しない。
これが母集合のバリデーション/メール系テンプレ（件名/本文/ヘッダ/添付＝IT-28由来）が本機能に対応実挙動を持たない根本理由で、
§4.6の excluded 根拠（メール設定・テンプレート管理へ委譲＝別機能）として扱う。実行結果（終了コード・件数）はC-01〜C-03、
副作用はC-P1、外部送達はC-R1で扱う。

---

## §4 実行可能グレード候補（自己完結＝全候補ケースを実体掲載）

記法: 期待結果セルは `…実値… [L1:<oracle_id>]`。**T2ルーティング**により期待値は設計md由来。ee参照は「（ee照合: file:line）」＝
**起動口/観測対象特定/踏襲確認のみ**（L1出典にしない）。

### §4.1 母集合対応・bound成功（現eeでコマンド実行→終了コード＋処理件数＋エラー表示を観測可能。C-01〜C-03＝3 C-ID・9母集合行）

**オラクル境界の明示（codex R1 Blocker①対応・T2汚染回避）**: 期待値の**核**は母集合期待テキスト「（ジョブ）終了状態と処理件数が実行結果に記録される」＋設計md:80,112「対象0件なら何もせず完了・成功時は整合」であり、これが正。
`exit code（SUCCESS/FAILURE）`・`detail文字列フォーマット`・コンソール文言は**ee固有の観測手段**であって仕様の正ではない（§5で逐語文言は非期待化）。特に「対象1件→FAILURE」は**設計期待でなく現eeのAPI未実装例外に依存するEEドリフト観測**（§9③）で、設計上の正常期待（対象1件→照会→整合）とは別物。アサーションは「終了状態が記録される（構造）」「処理件数がdetailに含まれる（構造）」に限定し、SUCCESS/FAILUREの具体値・detail逐語は`@TBD-D5`。C-02/C-03のFAILURE記載は「現ee実測の観測結果（ドリフト再現）」であって設計期待値ではない。

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 外部依存の観測対象 | 対応母集合 |
|---|---|---|---|---|---|
| C-01 | バッチ起動（起動方式） | SEED-B1301-EMPTYで`bin/console eccube:payment-status-check`（またはCommandTester）を実行 | コマンドが起動し実行結果（終了状態＝正常終了／処理件数＝対象0件が記録）が実行結果に記録される `[L1:B1301-001,011]`（期待核＝母集合期待テキスト「終了状態と処理件数が記録される」＋md:80,112「対象0件なら何もせず完了」。観測手段＝ee照合: コマンド実在`PaymentStatusCheckCommand.php:35`／0件経路のexit 0＋`[OK]`は既存テスト実装`PaymentStatusCheckCommandTest.php`が存在＝実走可能な設計〔本セッションで実行ログは未取得〕。SUCCESS/detail逐語は`@TBD-D5`） | なし（コンソール実行・0件経路は外部通信を伴わない） | -002（バッチ起動方式・読替） |
| C-02 | 実行結果の終了状態＋処理件数記録 | SEED-B1301-EMPTY（成功系）／SEED-B1301-TARGET1（対象1件系）でコマンド実行 | 実行結果に**ジョブ終了状態と処理件数が記録される**。対象0件＝exit SUCCESS＋detail「対象：0件…」／対象1件＝現eeではAPI未実装により想定外エラー分岐でexit FAILURE＋detail「対象：1件、…、エラー：1件」 `[L1:B1301-011,003]`（ee照合: `execute()`のexit SUCCESS/FAILURE＝`PaymentStatusCheckCommand.php:57-65`・detail＝`PaymentStatusCheckAction.php:175-178`） | **対象0件系＝なし。対象1件系＝メール送信試行あり（`sendEventPaymentErrorAlertMail`→`mailer->send`到達＝隔離必須・DSN allowlist検査を前提）**。終了コード＋detail文字列は自社側で観測 | -003,-004,-005,-006,-008,-009,-010（読替・注1／-008/-010は注1-b未裁定） |
| C-03 | エラー時の実行結果表示・未完了 | SEED-B1301-TARGET1でコマンド実行 | 実行結果でエラーが表示され、対象処理が完了しない（exit FAILURE＋`$io->error('決済処理中チェックでエラーが発生しました。…')`） `[L1:B1301-007,011]`（ee照合: `execute()`:52-60・現eeでは`getApiResponse`未実装throw`PaymentStatusCheckAction.php:191-196`により対象1件で必ずエラー分岐へ） | **メール送信試行あり（対象1件でcatch→`sendEventPaymentErrorAlertMail`→`mailer->send`到達＝隔離必須・DSN allowlist検査を前提）**。終了コード＋エラー表示は自社側で観測 | -001（実行結果でエラー表示・完了しない） |

**注1（読替・C-02）**: -003/-004/-005/-006/-008/-009/-010 は母集合期待テキストがいずれも「〔観点ラベル〕のジョブ終了状態と
処理件数が実行結果に記録されること」で、§0判定原則により**bindは母集合期待テキストで判定**（観点ラベルは生成器プレフィックス）。共通の観測可能事象＝
**コマンド実行→終了状態（exit code）＋処理件数（detail）記録**へ写像しC-02へ集約。

**注1-b（codex R1 Blocker②に対する保守的明示・観点表原義との齟齬フラグ）**: 生成器の**元観点表**（`integration-test-viewpoints.md`）では
-008 JSON形式=「取り込むJSONのルート要素が配列形式でない場合の入力形式エラー異常終了」（:448）、-009 レスポンス=「外部取得/ファイル読込結果が
空本文の場合の分岐」（:449）、-010 公開・締切=「時刻境界での公開・締切・集計対象の切替（取りこぼし/二重計上なし）」（:523）と、
母集合の平坦テキストより**豊かな原義**を持つ。§0判定原則（T2＝母集合期待テキストが正・ラベルは生成器ノイズ・f04-04で確立）に従い本候補は平坦テキストで
bound読替したが、**原義を尊重する立場では判定が変わり得る**: (a)-008は本バッチがJSON入力を持たない（コマンド名のみ）ため原義referent無し→
excluded相当、(b)-009の「空本文分岐」はSP.LINKS照会の空応答＝`getApiResponse`経路（現ee未実装throw）でありbound単純化でなくEEドリフト/要実機領域、
(c)-010の「抽出時刻境界」は`createDate<=now-30分`境界（`getBeforeMinutesEntry`）としてseedで検証可能な**独立bound観点**になり得る（単なる件数畳込でない）。
**本候補は§0原則優先で現状の会計（bound成功9）を維持するが、この原義齟齬は会計の意味的成立を左右する未解決論点＝コーディネータ裁定に委ねる**
（自己判断で会計を書換えない・open_findingsへ逐語記録）。仮に原義優先なら bound成功8／excluded11（-008移動）等へ再集計の要あり。

### §4.2 母集合対応・partial（1 test_id内に bound枝／要実機枝／ドリフト枝 を混在。1 C-ID・1母集合行）

| C-ID | 前提/手順 | bound枝（現eeで観測可・成功） | 要実機枝（外部送達・観測不能） | ドリフト枝（現eeに到達実装なし・失敗期待） | 対応母集合 |
|---|---|---|---|---|---|
| C-P1 | 副作用の確認 | SEED-B1301-TARGET1でコマンド実行→**想定外エラー分岐でエラー通知メール送信が試行され`cntError`計上＝FAILURE**、`dtb_mail_history`へのsave（`MailService.php:1682`）はseed+隔離で観測可 `[L1:B1301-007,009]` | **エラー通知メールの外部SMTP実送達**（指定宛先への到達・転送成功）`[L1:B1301-007]` | **申込ステータス更新（ENTERED）・記録除去（論理削除）・申込履歴記録は、`getApiResponse`未実装throwにより現ee到達不能＝失敗期待**（EEドリフト）。加えて設計md:141「参照系でDB登録・更新・削除を行わない」と md:124「副作用=ステータス更新・記録除去・履歴記録」の**設計md内部矛盾**（§9 BC-DRAFT②）。「自社DBで更新を観測可（成功）」とは書かない `[L1:B1301-005,008,009]` | -007（副作用=申込ステータス更新・記録除去・申込履歴記録・エラー通知メール） |

### §4.3 母集合対応・要実機（真の外部送達のみ。1 C-ID・1母集合行）

| C-ID | 前提/手順 | 期待結果（三段参照） | 外部依存の観測対象（観測不能な最終値） | 対応母集合 |
|---|---|---|---|---|
| C-R1 | 指定宛先へのメール送信・転送を確認 | エラー通知メール（`sendEventPaymentErrorAlertMail`）が指定宛先（`MtbOption ALERT_CHECK_PAYMENT_ERROR_MAIL_ADDRESS`）へ送信・（転送）され正常終了する `[L1:B1301-007]`（ee照合: `MailService.php:1668-1678` `$this->mailer->send`＝外部SMTP）。**注（codex R1 Minor）**: 「転送」は母集合期待テキスト(-011)の逐語だが、ee実装はTo/Bcc/Reply-To/Return-Path設定＋send のみで**明示的な転送処理のreferentは無い**（`MailService.php:1668-1678`）。実質は「指定宛先へのSMTP受理・送達」に狭めて解する。 | **外部SMTPホストへのメール実送達完了**（null transport下では非送達／codeception環境ではmailcatcher捕捉＝真の外部への送達成否は自社側で確定できない） | -011（指定した宛先への送信、転送が正常終了すること） |

### §4.6 母集合対応・excluded（10母集合行・per-ID実引き・過剰除外禁止）

いずれもエラー通知メールの**件名/本文/ヘッダ/添付**に関する観点（元観点表IT-28「メール処理・メール編集」由来＝
`integration-test-viewpoints.md:218-255`）。

**除外根拠の優先順位（codex R1 Major対応・md:32だけに依存しない補強）**: **第一根拠＝referent不在**。IT-28の件名/本文/ヘッダ/添付観点は
いずれも**メール編集（送信者が件名/本文/ヘッダ/添付を編集・設定する）フォームの存在を前提**とするが、本バッチはHTTP画面もメール編集フォームも
持たず（md:11・§3画面なし）、エラー通知メールは`MailTemplate` id=210の固定テンプレをレンダするのみ（利用者入力の件名/本文/添付の投入口が無い＝
ee照合`MailService.php:1646-1662`にテンプレ固定・添付なし）。よって件名/本文/ヘッダ/添付の肯定/否定/エンコード各観点に**観測対象（referent）が構造的に存在しない**。
**第二根拠＝md:32**「エラー通知メールの本文・宛先設定はメール設定・テンプレート管理を正とする」による本文/宛先の別機能委譲（ただしmd:32は本文・宛先に限定＝
件名/ヘッダ/添付はmd:32の文言外なので**第一根拠（referent不在）を主根拠とする**）。この二段でmd:32の射程を超える件名/ヘッダ/添付も除外を正当化。

| test_id | 期待テキスト要旨（観点） | 除外理由（一次資料実引き） |
|---|---|---|
| -012 | 件名に改行・タブ・メタキャラクタが含まれても送信/転送が正常終了 | **第一＝referent不在**（本バッチに件名編集フォーム無し・テンプレ固定）。件名仕様はメール設定・テンプレート管理へ委譲（md:32は本文/宛先限定＝件名は第一根拠で除外）。送信/転送成否はC-R1（要実機）で別途扱う |
| -013 | 本文に改行・タブ・メタキャラクタが含まれても送信/転送が正常終了 | 本文＝別機能委譲（md:32） |
| -014 | ヘッダがエンコードされること | **第一＝referent不在**（本バッチにヘッダ編集フォーム無し・テンプレ固定送信）。ヘッダエンコードはメール送信基盤/テンプレート管理へ委譲（md:32は本文/宛先限定のためヘッダは第一根拠で除外）＝別機能 |
| -015 | 件名でエラーが表示され、対象処理が完了しないこと | **第一＝referent不在**（本バッチに件名入力フォームなし・画面なし・md:11＝肯定側 referent なし）。件名仕様は補助的にメール設定・テンプレート管理へ委譲（md:32は本文/宛先限定） |
| -016 | 件名でエラーが表示されず、対象処理を継続できること | 同上（件名別機能・否定側も観測対象なし） |
| -017 | 件名に含まれる改行/タブ/メタキャラクタがエンコーディング/サニタイジングされること | **第一＝referent不在**（本バッチに件名入力の投入口なし・テンプレ固定）。件名の値加工は補助的にメール送信基盤/テンプレート管理へ委譲（md:32は本文/宛先限定＝件名は第一根拠で除外） |
| -018 | 本文でエラーが表示され、対象処理が完了しないこと | 本文＝別機能委譲（md:32）・本文入力フォームなし＝referent なし |
| -019 | 本文でエラーが表示されず、対象処理を継続できること | 同上（本文別機能・否定側も観測対象なし） |
| -020 | 本文に含まれる改行/タブ/メタキャラクタがエンコーディング/サニタイジングされること | 本文の値加工＝別機能委譲（md:32） |
| -021 | ファイルを添付する場合、指定したファイルが添付されること | **第一＝referent不在**：本バッチのエラー通知メールは添付を持たない（ee照合: `MailService.php:1668-1678`の`Email`構築に`attach*`呼出なし＝添付機能そのものが無い）。添付仕様はメール設定・テンプレート管理へ委譲（md:32は本文/宛先限定のため添付は第一根拠で除外）＝別機能 |

**過剰除外でないことの傍証**: excluded 10件はいずれもメール件名/本文/ヘッダ/添付の観点で、**第一根拠＝本バッチに当該入力・編集のreferent（フォーム/投入口/添付機能）が構造的に無い**（画面なし・テンプレ固定・添付なし）。
本文/宛先については補助的にmd:32（メール設定・テンプレート管理へ委譲）が重なるが、件名/ヘッダ/添付はmd:32の文言外ゆえreferent不在を主根拠とする。本バッチの実挙動（申込抽出・照会・ステータス整合・エラー通知メール**送信**・実行結果記録）は C-01/C-02/C-03/C-P1/C-R1 で
bound/partial/要実機として担保済み＝偽陰性なし。メール送信の**送達**（件名/本文でなく送信そのもの）はC-R1で要実機として別掲。

---

## §5 locale/文言（本機能は画面文言なし・コンソール出力は実装値で仕様未確定）

本バッチはHTTP画面文言を持たず（md:11）、コンソール出力（`$io->success('決済処理中チェックが完了しました。…')`・
`$io->error('決済処理中チェックでエラーが発生しました。…')`・detail「対象：…件、更新：…件…」）は**ee実装値**であり
設計mdに文言仕様の記載が無い。よって出力**文言の逐語一致は期待化しない**（実装値を仕様の正としない＝T2規律）。
C-01〜C-03のアサーションは**終了コード（SUCCESS/FAILURE）・件数の構造（detailに件数が含まれる）・エラー表示の有無**に限定し、
逐語文言は`@TBD-D5`（設計/観点で確定後にL1化）。エラー通知メールの件名/本文はメール設定・テンプレート管理（別機能・md:32）を正とする。

---

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- コマンド起動: `bin/console eccube:payment-status-check`（引数なし。ee照合: `PaymentStatusCheckCommand.php:35`）。
  結合レイヤの実走は`CommandTester`で終了コード＋`getDisplay()`を検証（既存`PaymentStatusCheckCommandTest.php`の様式を踏襲）。
  **バッチ起動口はee実在＝要実機に逃がさずAPI/統合レイヤでbound**（起動口が叩ける）。
- 期待値は`o("L1-B1301-xxx")`（L1解決器）経由・リテラル直書き禁止。終了コード/件数はexit code＋detail正規表現で観測。
- db.ts（`e2e/helpers/db.ts`）: `dtb_event_entry`（`entry_status_id`・`deleted_at`）／`dtb_entry_history`／`dtb_mail_history`の
  S0取得・アサーション・raw SQL復元の専用便宜関数は**未実装**（実装waveで追加。S0の対象・順序は§2で特定済み＝配線のみ`@TBD-D5`）。
- 破壊系afterEach（C-P1・将来のAPI実装時のC-02対象1件系）: §2のS0対象・FK順序・復元SQLに従いraw SQLで復元。
  現eeでは対象申込投入でも書込0件（`getApiResponse`未実装throw）だが、seedは使い捨て・独立でafterEach掃除。
- **オラクル独立性（T2規律）**: 期待値はすべて設計md（§1 L1）由来。eeのコマンド名・実装挙動・出力文言・翻訳訳語は
  起動口／観測対象特定にのみ用い、期待値の根拠にしない（特にコマンド名`eccube:payment-status-check`は起動口特定であって
  仕様の正はmd:49「移行先で要確認」）。

**_drafts/隔離lint証跡**: (1)正式消費側（`oracle.ts`/`db.ts`/既存spec/pages）に本書`_drafts`参照は作成していない。
(2)正式パス`e2e/fixtures/oracle/`直下・`integration_test/e2e/exec/`直下に本機能ファイルは作成していない。
(3)本md出力先は`_drafts/`配下のみ。

---

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-01 | request+CommandTester | CLI（HTTP APIでなくコンソール起動口） | コマンド起動・0件経路SUCCESS（既存テスト実装が存在＝実走可能・実行ログ未取得） |
| C-02 | request+CommandTester+db.ts | CLI+DB | 終了状態＋件数記録（0件=SUCCESS／1件=FAILURE）。detail正規表現 |
| C-03 | request+CommandTester | CLI | エラー表示・FAILURE（対象1件・API未実装分岐） |
| C-P1 | bound枝=CommandTester+db.ts（メール隔離前提）／要実機枝=外部送達／ドリフト枝=失敗期待 | CLI+DB+外部 | 副作用。ステータス更新/記録除去/履歴はEEドリフト（§4.2） |
| C-R1 | 要実機（外部SMTP送信先/スタブ） | 外部SMTP | エラー通知メールの実送達 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定）。

---

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則）。参照先の全候補行は§4に実体掲載済み。

### 集計（21 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound成功** | **9** | コマンド実行→終了状態（exit code）＋処理件数（detail）＋エラー表示を現eeで観測可能（C-01〜C-03） |
| **partial** | **1** | 副作用行。エラー通知メール送信試行=bound枝／外部SMTP送達=要実機枝／ステータス更新・記録除去・履歴記録=EEドリフト枝（API未実装・md:141内部矛盾）（C-P1） |
| **要実機** | **1** | エラー通知メールの外部SMTP実送達（C-R1） |
| **excluded** | **10** | メール件名/本文/ヘッダ/添付＝本バッチにreferent（入力/編集フォーム・添付機能）が構造的に無い（第一根拠）。本文/宛先は補助的にmd:32委譲。件名/ヘッダ/添付はmd:32文言外＝referent不在で除外 |
| 合計 | **21** | 欠落0・理由なし重複0 |

9+1+1+10=21（**差分0＝ID数の機械的全被覆〔001..021重複0/欠番0〕に限定**）。**意味的会計の確定ではない**: codex R2 Blockerにより
(i)-008/-009/-010の観点表原義齟齬（注1-b・未裁定）、(ii)対象1件系のC-02/C-03が設計準拠boundでなくEEドリフト再現観測である可能性、
の2点が未解決＝**bound成功9の意味的確定はコーディネータ裁定待ち**。仮に原義優先/ドリフト分離を採ると bound成功はこれより減り別区分（TBD/ドリフト再現）へ移る。

### 21対応表（No→期待テキスト要旨→会計→候補）

| No | 期待テキスト要旨 | 会計 | 対応候補 |
|---|---|---|---|
| 001 | 実行結果でエラーが表示され、対象処理が完了しないこと | bound成功 | C-03 |
| 002 | 入力データのジョブ終了状態と処理件数が実行結果に記録されること（バッチ起動方式） | bound成功 | C-01 |
| 003 | エラーのジョブ終了状態と処理件数が実行結果に記録されること | bound成功 | C-02 |
| 004 | エラーのジョブ終了状態と処理件数が実行結果に記録されること（エラー集約） | bound成功 | C-02 |
| 005 | エラーのジョブ終了状態と処理件数が実行結果に記録されること（成功時出力） | bound成功 | C-02 |
| 006 | エラーのジョブ終了状態と処理件数が実行結果に記録されること（失敗時出力） | bound成功 | C-02 |
| 007 | 申込みステータス更新、記録除去、申込履歴記録、エラー通知メールであること | partial | C-P1 |
| 008 | JSON形式のジョブ終了状態と処理件数が実行結果に記録されること | bound成功 | C-02 |
| 009 | レスポンスのジョブ終了状態と処理件数が実行結果に記録されること | bound成功 | C-02 |
| 010 | 公開・締切のジョブ終了状態と処理件数が実行結果に記録されること | bound成功 | C-02 |
| 011 | 指定した宛先（メールアドレス）への送信、転送が正常終了すること | 要実機 | C-R1 |
| 012 | 件名に改行・タブ・メタキャラクタが含まれても送信/転送が正常終了 | excluded | — |
| 013 | 本文に改行・タブ・メタキャラクタが含まれても送信/転送が正常終了 | excluded | — |
| 014 | ヘッダがエンコードされること | excluded | — |
| 015 | 件名でエラーが表示され、対象処理が完了しないこと | excluded | — |
| 016 | 件名でエラーが表示されず、対象処理を継続できること | excluded | — |
| 017 | 件名に含まれる改行/タブ/メタキャラクタがエンコーディング/サニタイジング | excluded | — |
| 018 | 本文でエラーが表示され、対象処理が完了しないこと | excluded | — |
| 019 | 本文でエラーが表示されず、対象処理を継続できること | excluded | — |
| 020 | 本文に含まれる改行/タブ/メタキャラクタがエンコーディング/サニタイジング | excluded | — |
| 021 | ファイルを添付する場合、指定したファイルが添付されること | excluded | — |

### 会計内訳（機械実証・再現用）

- bound成功（9）: 001,002,003,004,005,006,008,009,010
- partial（1）: 007
- 要実機（1）: 011
- excluded（10）: 012,013,014,015,016,017,018,019,020,021
- 9+1+1+10=21・差分0（001..021連番を全被覆・重複なし）

---

## §9 TBD・要実機・partial・excluded・BC-DRAFT（正直な分離）

### 要実機（母集合対応・1 test_id）
-011（C-R1）: エラー通知メールの指定宛先への外部SMTP実送達・転送成功（md:84,124。ee照合: `MailService.php:1678`
`$this->mailer->send`）。**外部ホストへの実送達が観測対象**で自社側で最終送達を確定できない（null transport下では非送達）。
送信試行（`mailer->send`呼出・`dtb_mail_history`save）は観測可能だが「送信/転送が正常終了する」の逐語は外部送達を主張＝要実機。

### partial（母集合対応・1 test_id・§4.2）
-007（C-P1）: 副作用の列挙（ステータス更新・記録除去・履歴記録・エラー通知メール）。bound枝（エラー通知メール送信試行・
FAILURE計上）／要実機枝（外部SMTP送達）／**ドリフト枝（ステータス更新・記録除去・履歴記録は`getApiResponse`未実装throwにより
現ee到達不能＝失敗期待。加えてmd:141〔参照系no-write〕とmd:124〔更新/記録除去〕の設計md内部矛盾）**。partial判定（1 test_id=1会計）を維持し
内訳表記のみ正確化（ドリフト枝を「自社DBで更新観測可＝成功」と誤記しない）。

### excluded（10件・§4.6で詳述・per-ID実引き）
-012〜-021。メール件名/本文/ヘッダ/添付。**第一根拠＝本バッチに件名/本文/ヘッダ/添付のreferent（入力・編集フォーム/投入口・添付機能）が構造的に無い**（画面なし・md:11・テンプレ固定・添付なし）。本文/宛先は補助的にmd:32委譲（件名/ヘッダ/添付はmd:32文言外）。実挙動は他候補でbound/partial/要実機化済み＝偽陰性なし。

### TBD（0件）
設計md:49「バッチ起動方式（コマンド名・実行基盤）は移行先で要確認」は**ee で確認できた**（コマンド`eccube:payment-status-check`
実在・`PaymentStatusCheckCommand.php:35`）ため、起動方式を理由とするTBDは生じない。母集合21件にTBD該当行なし。

### BC-DRAFT / DOC-DRAFT（設計md〔pf現行踏襲spec〕と ee実装の乖離候補・**断定回避**）

**T2規律**: オラクルは設計md。以下はeeを照合補助として観察した乖離候補で、**テストは設計mdどおりに書き**、乖離は不具合候補として別掲する。

| # | 設計md（オラクル） | ee観察（照合補助） | 乖離候補・区分 |
|---|---|---|---|
| ① | 起動コマンド名＝`entry:batch checkProssesingPayment`（md:49,69）。起動方式は移行先で要確認（md:49） | eeコマンド名＝`eccube:payment-status-check`（`PaymentStatusCheckCommand.php:35`）。プラグイン`entry:batch`は見当たらない | コマンド名差異。設計md自身が「移行先で要確認」＝**ee確認済（起動口実在）**。名称差はDOC-DRAFT（設計md更新候補）。断定回避 |
| ② | 副作用＝申込ステータス更新・記録除去・申込履歴記録（md:82,124）。一方 DB操作表は「参照系（検索）で登録・更新・削除を行わない」（md:141） | ee `PaymentStatusCheckAction.php`はOK分岐でステータス更新+履歴INSERT（:108-147）・else分岐で論理削除（:155-162）＝**書込を行う設計**。DB操作表の「参照系no-write」と齟齬 | **設計md内部矛盾**（md:124 副作用 vs md:141 DB操作）。実装は書込側と整合。DOC-DRAFT（md:141の是正候補）。テストは副作用側（md:124）で書きつつ矛盾を別掲 |
| ③ | 申込みごとに決済サービスへ取引照会し結果でステータス整合（md:81,102） | ee `getApiResponse()`が**SP.LINKS取引照会API未実装で無条件throw**（`PaymentStatusCheckAction.php:191-196`）。対象申込があると全て想定外エラー分岐（`cntError++`・FAILURE・エラー通知メール）へ | **部分実装のEEドリフト**（現ee本丸）。OK→更新・不在→削除・pending→保留 の正常経路が現ee到達不能。C-P1のドリフト枝の一次根拠。断定回避（後続PRで実装予定と実測コメント:193,195） |
| ④ | 想定外エラーは**重複を除いて1つにまとめ**、管理者へ通知（md:84,103,165） | ee はループ内で申込ごとに`sendEventPaymentErrorAlertMail`を個別送信（`PaymentStatusCheckAction.php:166`）＝**集約・重複除去なし**（1エラー1メール） | エラー集約仕様のEEドリフト。テストは設計md（集約）で書き乖離を別掲。断定回避 |
| ⑤ | 直前と同じ決済番号は前回照会結果に従い同様処理（md:83） | ee は`orderBy('ee.paymentNo')`で並べるが、handle内に前回結果流用ロジックが**見当たらない**（申込ごとに`getApiResponse`呼出） | 前回結果流用のEEドリフト（未実装の可能性）。断定回避（`getApiResponse`未実装のため現時点では検証不能） |
| ⑥ | 抽出は「設定時間（処理中とみなす分数）以上」決済中の申込（md:79） | ee は`getBeforeMinutesEntry(30)`＝**30分ハードコード**（`PaymentStatusCheckAction.php:78`）で設定値化されていない | 設定時間の外部化差異（軽微）。抽出条件自体は踏襲。DOC/BC-DRAFT。断定回避 |

候補規律: 全行 `@TBD-D5`・O5未確定・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

---

## 付録: 作業実測

- 参照物: 設計mdオラクル 1（186行）／母集合 1（21行）／観点表 1／先例 1（f04-04）／
  ee照合補助 9（`PaymentStatusCheckCommand.php`・`PaymentStatusCheckAction.php`・`DtbEventEntryRepository.php`・
  `DtbEventEntry.php`・`DtbEntryHistory.php`・`Master/MtbEntryStatus.php`・`MailService.php`・`mailer.yaml`・
  既存テスト`PaymentStatusCheckCommandTest.php`）。
- L1 claim数: **14確定・TBD 0**。候補ケース**5**（bound成功3〔C-01〜C-03〕・partial 1〔C-P1〕・要実機1〔C-R1〕）。
  母集合対応=bound成功9・partial 1・要実機1・excluded 10（差分0）。
- 両レイヤ分類: (A)API/統合レイヤ＝コマンド起動口`eccube:payment-status-check`実在で終了コード＋件数を観測（C-01/C-02/C-03・
  bound）。(B)副作用DB＋メール＝C-P1（partial）・C-R1（要実機）。管理画面UI観測は本バッチに固有画面なく該当なし（md:11）。
- 主根拠: **要実機**=エラー通知メールの外部SMTP実送達（`MailService.php:1678`）。**EEドリフト**=SP.LINKS取引照会API未実装
  （`PaymentStatusCheckAction.php:191-196`が無条件throw）で正常経路（更新/削除）到達不能＋設計md内部矛盾（md:124 vs md:141）。
- **未検証事項（codexレビュー/実機で要確認）**: BC-DRAFT①〜⑥（特に③API未実装の後続PR実装状況・②設計md内部矛盾の正解・
  ④エラー集約仕様）、破壊系S0・メール隔離の実配線（@TBD-D5）、コンソール出力文言の仕様確定（@TBD-D5）。
  過剰主張なし・数値は実測・grep0件/未実装は「見当たらない/現時点未実装（断定回避）」として記載。
