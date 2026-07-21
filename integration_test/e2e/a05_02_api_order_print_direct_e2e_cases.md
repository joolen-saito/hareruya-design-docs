# A05-02（受注_直接印刷） E2Eテストケース

元設計md（正本一次）: `functions/pf-api/a05-02_api_order_print_direct.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a05_02_api_order_print_direct_it_cases.md`（母集合 計90観点行）

本機能は画面を伴わない機能仕様（受注の直接印刷API。`ConnectionType`で2系統に分岐＝`GetRequest`:印刷情報XML送信／`SetResponse`:印刷済み＝ピック中へのステータス更新）であり、**両レイヤで網羅**する。API/統合レイヤ＝Playwright `request` でエンドポイントへ送信し、**HTTPステータス・Content-Type・応答本体の有無（XML本体／空本文）・印刷情報生成や印刷ログファイル書き出しの発火・更新の確定有無**で判定する。UIレイヤ＝`SetResponse`の結果が管理画面（受注のステータス＝ピック中表示・ブラウザ印刷フラグの消込）に現れる範囲をブラウザで観測して判定する。

**印刷情報XML（スタック用紙）の印字レイアウト・印字項目値の厳密検査は帳票内容の厳密検査として `手動`**（原則「PDF/帳票出力のHTTPステータス・Content-Type・発火はAPI/統合、内容は手動」）。

**期待結果は仕様（正本md・観点表・基本設計）由来**とし、実装（pf-api／ec-cube-enterprise）のレスポンス形・HTTPライブラリ既定値・Form制約を期待値に流用しない（オラクル独立性）。pf-apiリバースは基本設計・観点表を上位オラクルとし、刷新先（ec-cube-enterprise）実装との乖離は付帯表4に出す。実装からは位置情報（APIパス・メソッド・Content-Type・更新先カラム）のみを `file:line` 根拠で取得し、取れないものは `要実機確認`。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報はTSV後の付帯表に分離する。Playwright は本リポジトリでは実行しない（構造参考のみ）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-09 | `GetRequest`/`SetResponse`の正常受信のHTTPステータス・Content-Type・実行結果・リクエスト正常 |
| IT-32 | `ConnectionType`分岐（資格情報＝認証なしで実行可／不一致・想定外項目で更新確定しない／`ResponseFile`受信検証） |
| IT-16 | 実行結果・エラー（`ResponseFile`解析失敗・直接印刷結果偽・要素なし・例外500相当・取得と更新の非同一トランザクション） |
| IT-17 | 受注が見つからない要素のスキップ（処理継続） |
| IT-27 | ファイル出力（印刷ログファイルの書き出し発火・配置先 `var/log/print_logs/`）。削除・移動・コピー・JSONは本機能に非該当で対象外 |
| IT-24 | 出力内容・フォーマット定義（印刷情報XMLの印字項目値＝主に手動。発火・抽出はAPI/統合） |
| IT-18 | 帳票フォーマット定義（XMLレイアウト・スキーマ＝手動） |
| IT-33 | 更新結果・対象機能・参照系機能（`SetResponse`でピック中更新／ブラウザ印刷フラグ消込／`GetRequest`は非更新） |
| IT-19 | 同時実行数の制限（設計にレート制限・同時実行制限の記載が無く対象外） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-001	IT-09	リクエスト	P1	GetRequestの正常受信で印刷情報XML本体が返る	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE	ConnectionType＝GetRequest（印刷対象受注が1件以上ある状態）	"1. エンドポイントへConnectionType=GetRequestで送信する
2. HTTPステータスと応答本体を確認する"	HTTPステータス200で、スタック用紙の印刷情報XML（PrintRequestInfoルート）が応答本体としてストリーム返却されること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-002	IT-09	HTTPステータス	P1	GetRequestで印刷対象が無い場合は空のデータを返す	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-NONE	ConnectionType＝GetRequest（印刷対象受注が0件の状態）	"1. ConnectionType=GetRequestで送信する
2. HTTPステータスと応答本体を確認する"	HTTPステータス200で、XML本体を持たない空のデータが返ること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-003	IT-09	実行結果	P2	GetRequest応答のContent-Typeがapplication/octet-streamである	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE	ConnectionType＝GetRequest	"1. ConnectionType=GetRequestで送信する
2. 応答ヘッダのContent-Typeを確認する"	応答のContent-Typeがapplication/octet-streamであること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-004	IT-27	ファイル出力	P2	生成した印刷情報が空でない場合に印刷ログファイルが書き出される	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE	ConnectionType＝GetRequest（印刷対象1件以上）	"1. ConnectionType=GetRequestで送信する
2. ログ保存ディレクトリ var/log/print_logs/ 配下を確認する"	印刷情報のXMLが var/log/print_logs/ 配下にタイムスタンプ付きの一意名で書き出されること（実装は当該処理が無効化されており付帯表4#4で乖離記録）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-005	IT-27	ファイル出力	P2	GetRequestで対象が無い場合は印刷ログファイルを書き出さない	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-NONE	ConnectionType＝GetRequest（印刷対象0件）	"1. ConnectionType=GetRequestで送信する
2. ログ保存ディレクトリ配下を確認する"	印刷情報が空のため印刷ログファイルが新規に書き出されないこと。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-006	IT-16	実行結果	P3	印刷対象受注の抽出が最大10件で打ち切られる	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE（抽出条件該当を11件以上投入）	ConnectionType＝GetRequest	"1. 抽出条件に該当する受注を11件以上用意する
2. ConnectionType=GetRequestで送信する
3. 応答XMLのePOSPrint要素数を確認する"	応答XMLに含まれる受注分（ePOSPrint要素）が最大10件までに打ち切られること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-007	IT-09	リクエスト	P2	GETメソッドのGetRequest受理可否（設計はGET・POST双方から取得・メソッド乖離検出）	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE	HTTPメソッド＝GET／ConnectionType＝GetRequest（設計エンドポイント /order/print/direct を使用）	"1. GETメソッドで /order/print/direct へConnectionType=GetRequestを送信する
2. HTTPステータスと応答本体を確認する"	設計はConnectionTypeをGET・POST双方のリクエストから取得する仕様のため、GETのGetRequestが受理されHTTPステータス200で印刷情報XML（対象なしは空データ）が返ること（実装はPOSTのみ許可・GET未対応のため本ケースは落ちてメソッド乖離を検出＝付帯表4#2）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-010	IT-09	実行結果	P1	SetResponseの正常受信で空本文とtext/xmlが返る	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET／SEED-A05-02-RESPONSEFILE	ConnectionType＝SetResponse／ResponseFile＝直接印刷結果が真・印刷結果要素に対象受注IDを含むXML	"1. ConnectionType=SetResponse・ResponseFileを付与して送信する
2. HTTPステータス・Content-Type・本文長を確認する"	HTTPステータス200・Content-Type text/xml; charset=utf-8 で、本文長0の空本文が返ること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-020	IT-16	エラー	P1	ResponseFileの解析失敗時は更新せず空本文を返す	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET	ConnectionType＝SetResponse／ResponseFile＝XMLとして解析不能な文字列	"1. 解析不能なResponseFileで送信する
2. HTTPステータスと対象受注のステータスを確認する"	更新を行わずHTTPステータス200・空本文が返り、対象受注のステータスがピック中へ変化しないこと。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-021	IT-16	実行結果	P1	直接印刷結果が偽の場合は更新せず戻る	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET	ConnectionType＝SetResponse／ResponseFile＝直接印刷結果が偽（false）のXML	"1. 直接印刷結果が偽のResponseFileで送信する
2. HTTPステータスと対象受注のステータスを確認する"	更新を行わず200・空本文が返り、対象受注のステータスが変化しないこと。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-022	IT-16	実行結果	P2	印刷結果要素が0件の場合は更新せず戻る	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET	ConnectionType＝SetResponse／ResponseFile＝直接印刷結果は真だが印刷結果要素を1件も持たないXML	"1. 印刷結果要素なしのResponseFileで送信する
2. HTTPステータスと対象受注のステータスを確認する"	更新を行わず200・空本文が返り、対象受注のステータスが変化しないこと。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-023	IT-17	実行結果	P2	受注が見つからない印刷結果要素はスキップし応答は空本文	SEED-A05-02-BASEINFO	ConnectionType＝SetResponse／ResponseFile＝存在しない受注IDのみを印刷ジョブIDに持つXML	"1. 存在しない受注IDのResponseFileで送信する
2. HTTPステータスを確認する"	該当受注IDの要素がスキップされ、エラーで停止せずHTTPステータス200・空本文が返ること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-024	IT-33	更新結果	P2	一部受注が見つからなくても存在する受注は更新が継続される	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET	ConnectionType＝SetResponse／ResponseFile＝存在する受注IDと存在しない受注IDの印刷結果要素を混在させたXML	"1. 存在・不存在の受注IDを混在させたResponseFileで送信する
2. 存在する対象受注のステータスを確認する"	存在しない要素はスキップされ、存在する受注のステータスがピック中へ更新されること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-030	IT-32	リクエスト	P1	ConnectionTypeが想定値に一致しない場合は本文を返さない	SEED-A05-02-BASEINFO	ConnectionType＝GetRequest・SetResponseいずれにも一致しない値	"1. 想定外のConnectionType値で送信する
2. 応答本体を確認する"	応答を組み立てず本文を返さないこと（実装はHTTP400・text/plain空本文を返すため付帯表4#3で乖離記録）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-031	IT-32	リクエスト	P3	ConnectionType未指定・想定外項目付与でも更新が確定しない	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET	ConnectionType未指定、または正常リクエストに想定外の項目（項目名と値のセット）を追加	"1. ConnectionType未指定または想定外項目付きで送信する
2. 対象受注のステータスを確認する"	いずれの分岐も発火せず、対象受注のステータスが変化しないこと。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-040	IT-32	資格情報	P2	認証なしでGetRequestを実行でき401を返さない	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE	jwt-tokenヘッダ無し／管理ログイン無しのConnectionType＝GetRequest	"1. 認証情報を付与せずConnectionType=GetRequestで送信する
2. HTTPステータスを確認する"	未認証でも処理が実行され、認証拒否（HTTP401）が返らないこと（認証判定を持たない仕様）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-041	IT-09	リクエスト	P3	その他のクライアントも到達できればSetResponseを実行できる	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET／SEED-A05-02-RESPONSEFILE	店頭プリンタ以外のクライアントからのConnectionType＝SetResponse	"1. 印刷クライアント以外からSetResponseで送信する
2. HTTPステータスと対象受注のステータスを確認する"	アプリケーション層の利用者照合が無いため到達すれば実行され、200・空本文が返り対象受注が更新されること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-050	IT-33	更新結果	P1	SetResponse後に受注ステータスがピック中で表示される	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET／SEED-A05-02-RESPONSEFILE／SEED-M05-ADMIN	ConnectionType＝SetResponse／ResponseFileに対象受注IDを含む（ブラウザ印刷フラグOFF）	"1. SetResponseで送信する
2. 管理画面で対象受注を開きステータスを確認する"	管理画面で対象受注のステータスがピック中（印刷済み相当）として表示されること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-051	IT-33	対象機能	P2	ブラウザ印刷フラグが立つ受注はフラグが消えステータスは不変	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-BROWSERFLG／SEED-A05-02-RESPONSEFILE／SEED-M05-ADMIN	ConnectionType＝SetResponse／ResponseFileにブラウザ印刷フラグONの受注IDを含む	"1. SetResponseで送信する
2. 管理画面で対象受注のステータスとブラウザ印刷フラグを確認する"	ブラウザ印刷フラグが倒れ（消込）、受注ステータスはピック中へ更新されないこと。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-052	IT-33	参照系機能	P2	GetRequestのみでは受注ステータスが更新されない	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE／SEED-M05-ADMIN	ConnectionType＝GetRequest	"1. ConnectionType=GetRequestのみ送信する
2. 管理画面で対象受注のステータスを確認する"	GetRequestは印刷情報を返すのみで、対象受注のステータスが更新前のまま（未印刷）であること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-053	IT-33	更新結果	P3	SetResponse更新時に確定日時またはピック開始日が設定される	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET／SEED-A05-02-RESPONSEFILE／SEED-M05-ADMIN	ConnectionType＝SetResponse／ResponseFileに対象受注IDを含む	"1. SetResponseで送信する
2. 対象受注の確定日時／ピック開始日を確認する"	ステータス更新と併せて補助情報の確定日時（または店舗区分に応じたピック開始日）に現在時刻が設定されること。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-054	IT-33	更新結果	P2	SetResponse更新後の再GetRequestで当該受注が抽出対象から外れる（DB更新の間接確認）	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-TARGET／SEED-A05-02-RESPONSEFILE	ConnectionType＝SetResponseで対象受注を更新後、同一条件でConnectionType＝GetRequestを実行	"1. SetResponseで対象受注をピック中へ更新する
2. 続けてGetRequestを実行し応答XMLに当該受注IDのePOSPrint要素が含まれるか確認する"	SetResponseで受注ステータスがピック中・確定日時設定へ更新された結果、未確定を要件とする再GetRequestの抽出対象から当該受注が外れ応答XMLに含まれないこと（DB更新をUI非依存で間接確認＝IT-23/IT-26相当・母集合外補完）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-060	IT-18	フォーマット定義	P2	印刷情報XMLのレイアウト・スキーマが帳票定義どおり	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE	ConnectionType＝GetRequest	"1. ConnectionType=GetRequestで送信する
2. 応答XMLの要素構成・レイアウトを帳票定義と目視照合する"	応答XMLがPrintRequestInfo/ePOSPrint/PrintDataの構造とスタック用紙レイアウト（帳票定義）どおりであること（帳票内容の厳密検査は手動）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-061	IT-24	出力内容	P2	印刷情報XMLの各印字項目値が受注データと一致する	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE（既知の注文日・注文番号・氏名・合計金額・スマレジコード・店頭注文番号）	ConnectionType＝GetRequest	"1. ConnectionType=GetRequestで送信する
2. 応答XMLの注文日・注文番号・お客様名・合計金額・スマレジコード・店頭注文番号欄を受注データと照合する"	各印字項目値が対象受注のデータと一致すること（帳票内容の厳密検査は手動）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-062	IT-24	出力内容	P2	スムーズ店頭受取の受注は合計金額欄が文言置換される	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-SMOOTH	ConnectionType＝GetRequest（配送方法がスムーズ店頭受取の受注を含む）	"1. ConnectionType=GetRequestで送信する
2. 応答XMLの当該受注の合計金額欄を確認する"	スムーズ店頭受取の受注の合計金額欄が金額ではなく「スムーズ店頭受取」の文言に置換されること（手動）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-063	IT-24	出力内容	P3	お客様名欄はカナ優先・無ければ氏名で出力される	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE（氏名カナ有り／無しの2受注）	ConnectionType＝GetRequest	"1. ConnectionType=GetRequestで送信する
2. 応答XMLのお客様名欄を確認する"	お客様名欄がカナを優先し、カナが無い受注は氏名で出力されること（手動）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-070	IT-16	実行結果	P3	印刷情報生成・データ取得・ファイル書出中の例外で500相当となる	SEED-A05-02-BASEINFO	印刷情報生成・データ取得・ファイル書き出し中に例外を誘発する状態	"1. 例外を誘発する状態でConnectionType=GetRequestで送信する
2. HTTPステータスを確認する"	共通例外処理に委ねられHTTP500相当となり、未定義例外で停止しないこと（例外の実誘発は要実機確認のため手動）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-071	IT-16	実行結果	P3	GetRequest抽出集合とSetResponse更新集合の一致は同一トランザクションで保証されない	SEED-A05-02-BASEINFO／SEED-A05-02-ORDER-PRINTABLE	GetRequestとSetResponseを別リクエストで実行し、間に受注を変化させる	"1. GetRequestで印刷情報を取得する
2. 間に対象受注を変化させる
3. SetResponseを送信する
4. 抽出集合と更新集合の差を確認する"	GetRequestで抽出した受注集合とSetResponseで更新される受注集合が同一トランザクションで保証されず、間の受注変化を許容する仕様であること（手動／要確認）。				
a05-02_api_order_print_direct（API_受注_直接印刷）	E2E-A05-02-072	IT-16	エラー	P3	SetResponse異常時に内容とエラーがログに記録される	SEED-A05-02-BASEINFO	ConnectionType＝SetResponse／解析失敗・直接印刷結果偽・要素なし・受注なしの各ResponseFile	"1. 各異常系ResponseFileで送信する
2. サーバログの該当エントリを確認する"	解析失敗・直接印刷結果偽・印刷結果要素なし・受注なしの各ケースで内容とエラーがログに記録されること（サーバログ実観測のため手動・母集合外補完）。				
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

正本mdの利用者視点の入口は `GET /order/print/direct`（`ConnectionType`=GetRequest）／`POST /order/print/direct`（`ConnectionType`=SetResponse）で、挙動の参照リポは pf-api（`config/routes.yaml`・注文印刷処理）を正とする。**刷新先 ec-cube-enterprise の実装は `#[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', methods: ['POST'])]`（`src/Eccube/Controller/App/OrderController.php:43`）で、GET未対応・`/api`プレフィクス・複数形`prints`・`base_info_id`パスパラメータを持つ点が設計と乖離する（付帯表4#1/#2）。** `GetRequest`分岐は `OrderDirectPrintAction::handle`（`OrderDirectPrintAction.php:37`）で印刷対象抽出（本店=`getPrintOrderListMainShop`／支店=`getDirectPrintOrderList`、`OrderDirectPrintAction.php:45,47`）→XML生成（`getXmlData`/`getPrintData`、`OrderDirectPrintAction.php:159,71`）、応答Content-Type=`application/octet-stream`（`OrderController.php:73`）。`SetResponse`分岐は `UpdatePrintedOrderStatusAction::handle`（`UpdatePrintedOrderStatusAction.php:44`）で、`ServerDirectPrint=='false'`または`ePOSPrint`要素0件で更新せず戻り（`UpdatePrintedOrderStatusAction.php:55`）、印刷ジョブID先頭部から受注ID抽出（`explode('_', printjobid)[0]`、`UpdatePrintedOrderStatusAction.php:79`）、ブラウザ印刷フラグONはフラグ消込のみ（`:87-88`）、OFFはステータスをPICKINGへ更新＋本店=`setConfirmDate`／支店=`setPickingDate`（`:90-97`）、応答Content-Type=`text/xml; charset=utf-8`・空本文（`OrderController.php:84-86`）。**期待値はいずれも正本md／観点表由来**で、実装の現挙動（HTTP400・JSON/text 等）を期待値に固定しない。区分の `要実機確認` は4区分の修飾子。**送信先パスは実装の実効パス（`POST /api/order/prints/direct/{base_info_id}`）に統一し、設計⇔実装の乖離は付帯表4で管理する。例外は E2E-A05-02-007 のみで、これは「設計仕様のGET/POST双方からConnectionTypeを受理するか」を検証するための乖離検出ケースとして設計パス `GET /order/print/direct` へ送信する（GET未対応で落ちれば付帯表4#2を検出）。**

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A05-02-001/002/003 | E2E自動化(API/統合) | `POST /api/order/prints/direct/{base_info_id}`＋ConnectionType=GetRequest（OrderController.php:43,48／OrderDirectPrintAction.php:37）／octet-stream（OrderController.php:73） | 利用者視点の入口・処理フロー(GetRequest)1-6・レスポンス(成功)／IT-09 | IT-A05-02-...-012,013,020,023,030,050,085 |
| E2E-A05-02-004/005 | E2E自動化(API/統合)（要実機確認: 実装はログ出力処理が無効化） | 印刷ログ書出 `var/log/print_logs/`（OrderController.php:58-67＝コメントアウト） | 副作用「印刷ログファイルの書き出し」・処理フロー(GetRequest)5／IT-27 | IT-A05-02-...-029,056,083 |
| E2E-A05-02-006 | E2E自動化(API/統合) | 抽出最大10件（OrderDirectPrintAction.php:45,47／件数上限は pf-api 抽出処理＝要実機確認） | 処理フロー(GetRequest)2「最大10件」／IT-16 | IT-A05-02-...-018,020 |
| E2E-A05-02-007 | E2E自動化(API/統合)（メソッド乖離検出・本ケースのみ設計GETへ送信） | 設計パス `GET /order/print/direct`＋ConnectionType=GetRequest（利用者視点の入口）。実装は `methods: ['POST']` のみでGET未対応（OrderController.php:43） | 利用者視点の入口「ConnectionTypeはGET・POSTいずれからも取得」・入出力(ConnectionType)／IT-09 | （母集合外・設計書補完＝メソッド乖離検出） |
| E2E-A05-02-010 | E2E自動化(API/統合) | ConnectionType=SetResponse（OrderController.php:76）／text/xml; charset=utf-8・空本文（OrderController.php:84-86） | レスポンス(成功)SetResponse・処理フロー(SetResponse)7／IT-09 | IT-A05-02-...-031,063,085 |
| E2E-A05-02-020 | E2E自動化(API/統合) | XML解析失敗で戻る（UpdatePrintedOrderStatusAction.php:48-54） | 処理フロー(SetResponse)2・エラー処理「解析失敗」／IT-16 | IT-A05-02-...-011,024,051,078 |
| E2E-A05-02-021/022 | E2E自動化(API/統合) | 直接印刷結果偽／要素0件で戻る（UpdatePrintedOrderStatusAction.php:55-59） | 処理フロー(SetResponse)3・エラー処理／IT-16 | IT-A05-02-...-025,052,079 |
| E2E-A05-02-023/024 | E2E自動化(API/統合) | 受注不存在はスキップ・継続（UpdatePrintedOrderStatusAction.php:81-86） | 処理フロー(SetResponse)4・エラー処理「受注が見つからない」／IT-17 | IT-A05-02-...-017,026,053,080 |
| E2E-A05-02-030/031 | E2E自動化(API/統合) | ConnectionType不一致分岐（OrderController.php:91-96＝HTTP400 text/plain＝乖離） | 入出力(ConnectionType)・エラー処理「想定値に一致しない」・バリデーション／IT-32 | IT-A05-02-...-010,037,064,088,089 |
| E2E-A05-02-040/041 | E2E自動化(API/統合)（要実機確認: 経路・firewall制御） | 認証なし（正本md 認証・認可）／App配下ルートのfirewallは要実機確認 | 認証・認可「認証処理を行わない・401返さない」・権限認可／IT-32,IT-09 | IT-A05-02-...-021,022,032,049,059,086 |
| E2E-A05-02-050 | E2E自動化(UI) | 受注ステータス＝PICKING更新（UpdatePrintedOrderStatusAction.php:62,90／OrderStatus::PICKING）。管理画面の受注ステータス表示セルは要実機確認 | 副作用「ステータス更新」・処理フロー(SetResponse)5・DBカラム order_status_id／IT-33 | IT-A05-02-...-033,055,058,087 |
| E2E-A05-02-051 | E2E自動化(UI) | ブラウザ印刷フラグ消込（UpdatePrintedOrderStatusAction.php:87-88／Order::isBrowserPrintFlg・setBrowserPrintFlg） | 処理フロー(SetResponse)5「フラグを倒すだけ」・DBカラム browser_print_flg／IT-33 | IT-A05-02-...-075 |
| E2E-A05-02-052 | E2E自動化(UI) | GetRequestは非更新（OrderDirectPrintAction はステータス更新を持たない） | データ整合性「GetRequestは更新しない」・印刷とステータスの関係／IT-33 | IT-A05-02-...-014,068,070 |
| E2E-A05-02-053 | E2E自動化(UI)（要実機確認: 表示箇所） | 確定日時/ピック開始日（UpdatePrintedOrderStatusAction.php:91-97／setConfirmDate・setPickingDate） | 副作用「補助情報の確定日時に現在時刻」・DBカラム confirm_date/picking_date／IT-33 | IT-A05-02-...-007 |
| E2E-A05-02-054 | E2E自動化(API/統合)（間接・DB更新確認） | SetResponse更新（UpdatePrintedOrderStatusAction.php:90-97）→再GetRequest抽出（OrderDirectPrintAction.php:45,47／抽出条件＝未確定）で対象が外れることを観測 | 副作用「ステータス更新・確定日時」・データ整合性「更新の有無」・DB操作(更新)／IT-23/IT-26相当 | （母集合外・設計書補完＝DB更新の間接確認） |
| E2E-A05-02-060 | 手動（帳票内容の厳密検査） | 応答XML構造 PrintRequestInfo/ePOSPrint/PrintData（OrderDirectPrintAction.php:80-168） | レスポンス(成功)XML構造・サンプルレスポンス・帳票フォーマット／IT-18 | IT-A05-02-...-001〜006,039,084 |
| E2E-A05-02-061/063 | 手動（帳票内容の厳密検査） | 印字項目（注文日/注文番号/お客様名(カナ優先)/合計金額/スマレジコード）（OrderDirectPrintAction.php:73-78,97-135） | レスポンス(成功)PrintData項目・DBカラム各列／IT-24 | IT-A05-02-...-040,044,045,046,048,057,066 |
| E2E-A05-02-062 | 手動（帳票内容の厳密検査） | スムーズ店頭受取の合計金額欄置換（pf-api 印刷情報生成＝要実機確認。ec-cube実装は要確認） | 処理フロー(GetRequest)3「合計金額欄をスムーズ店頭受取とする」／IT-24 | IT-A05-02-...-040〜070の出力内容群 |
| E2E-A05-02-070 | 手動（要実機確認: 例外実誘発） | 共通例外処理（OrderController.php／pf-api 共通例外＝要実機確認） | レスポンス(失敗)500・エラー処理「例外」／IT-16 | IT-A05-02-...-027,054 |
| E2E-A05-02-071 | 手動（要確認: 非同一トランザクション） | GetRequest/SetResponseは別リクエスト・別トランザクション（排他制御・トランザクション節） | データ整合性「同一トランザクションで保証されない」／IT-16 | IT-A05-02-...-015,042,069 |
| E2E-A05-02-072 | 手動（サーバログ実観測・母集合外補完） | ログ記録 `$logger->error(...)`（UpdatePrintedOrderStatusAction.php:50,51,56,65,71,83） | ログ・監査「内容やエラーをログへ記録」／（母集合外・設計書補完） | （母集合外・設計書補完） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象画面でファイル処理を実行する」等の汎用文）で、機能固有のシナリオを持たない。本E2Eは正本md本文（処理フロー・入出力・副作用・エラー処理・データ整合性）とec-cube-enterprise実装の位置情報を一次情報源として両レイヤを網羅した。`元ITケースID` は `IT-A05-02-API-ORDER-PRINT-DIRECT-NNN` の `NNN` を示す。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `a05_02_api_order_print_direct_it_cases.md` の関連ID件数（IT-18=6／IT-16=12／IT-27=15／IT-32=3／IT-24=41／IT-17=3／IT-33=6／IT-09=3／IT-19=1＝計90）。`自動化(UI)` と `自動化(API/統合)` を分けて集計する。付帯表2・2bの `自動化(UI)`／`自動化(API/統合)` は付帯表1の `E2E自動化(UI)`／`E2E自動化(API/統合)` と同一区分の略記であり、`要実機確認`・`間接` は区分本体ではなく修飾子である。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-18 | 6 | 0 | 0 | 6 | 0 | 帳票フォーマット定義＝印刷情報XMLのレイアウト・スキーマで帳票内容の厳密検査のため手動 |
| IT-16 | 12 | 3 | 7 | 2 | 0 | 実行結果・エラーはHTTPステータス/更新確定有無で観測可（UI=更新の有無/印刷とステータスの関係/更新方法の3行）。取得と更新の非同一トランザクション・出力内容の一部は手動 |
| IT-27 | 15 | 1 | 6 | 2 | 6 | 印刷ログファイル書出の発火・配置先はAPI/統合。削除・移動/リネーム・コピー・JSON入出力は本機能に非該当で対象外 |
| IT-32 | 3 | 0 | 3 | 0 | 0 | ConnectionType分岐・想定外項目・資格情報（認証なしで実行可）はHTTPステータス/更新確定で観測可 |
| IT-24 | 41 | 8 | 20 | 11 | 2 | 出力内容＝XML印字項目値は手動が中心。抽出・発火・応答ステータス・更新確認はUI/API。計算処理は再計算なしで対象外 |
| IT-17 | 3 | 1 | 1 | 1 | 0 | 受注なしスキップはAPI/統合、ピック中更新はUI、例外は手動 |
| IT-33 | 6 | 2 | 4 | 0 | 0 | 更新結果・参照系非更新・対象機能識別。値変更なし観測と更新確定（登録相当の書き込み）はUI |
| IT-09 | 3 | 0 | 3 | 0 | 0 | 応答ステータス・HTTPステータス・リクエスト正常 |
| IT-19 | 1 | 0 | 0 | 0 | 1 | 同時実行数の制限＝設計にレート制限・同時実行制限の記載が無く対象外（理由付き） |
| 合計 | 90 | 15 | 44 | 22 | 9 | **未分類 0** |

注1: 対象外9件の内訳＝IT-27の削除/移動・リネーム/コピー/JSON/入力JSON（6件＝本機能はDBへの登録・更新・削除やJSON入出力を持たず、応答はXML/空・入力はXML `ResponseFile`）＋IT-24の計算処理（2件＝本APIで金額・税・ポイント・在庫の再計算を行わない）＋IT-19の同時実行制限（1件＝設計にレート制限記載なし）。いずれも理由付きで放置ではない。

注2（母集合外・設計書補完）: 母集合90行に対応行を持たない補完ケースを別管理する（母集合集計には算入しない）。E2E-A05-02-007（GETメソッドのGetRequest受理可否＝メソッド乖離検出。利用者視点の入口・入出力(ConnectionType)由来）／E2E-A05-02-054（SetResponseのDB更新の間接確認＝IT-23/IT-26相当。副作用・DB操作節由来）／E2E-A05-02-072（SetResponse異常時のログ記録・手動。ログ・監査由来）。設計書のDB操作節が「参照系で更新なし」と記す一方、処理フロー・副作用はSetResponseの更新を明記する自己矛盾は付帯表4#5で要確認とし、本E2EはSetResponseが更新する前提でDB更新観点（050/051/053/054）を写像する。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-18 | フォーマット定義 | 手動 | 060（帳票レイアウト厳密検査） |
| 002 | IT-18 | フォーマット定義 | 手動 | 060 |
| 003 | IT-18 | フォーマット定義 | 手動 | 060 |
| 004 | IT-18 | フォーマット定義 | 手動 | 060 |
| 005 | IT-18 | フォーマット定義 | 手動 | 060 |
| 006 | IT-18 | フォーマット定義 | 手動 | 060 |
| 007 | IT-16 | 実行結果 | 自動化(UI) | 053（更新方法＝確定日時/ピック開始日） |
| 008 | IT-27 | 実行結果 | 対象外 | 計算処理＝本APIで再計算を行わないため |
| 009 | IT-27 | 出力失敗 | 自動化(API/統合) | 010（応答値＝空本文応答） |
| 010 | IT-32 | 資格情報 | 自動化(API/統合) | 030（ConnectionType分岐） |
| 011 | IT-16 | 実行結果 | 自動化(API/統合) | 020（ResponseFile解析） |
| 012 | IT-16 | 実行結果 | 自動化(API/統合) | 001（GetRequest） |
| 013 | IT-16 | 実行結果 | 自動化(API/統合) | 001（参照時点） |
| 014 | IT-16 | 実行結果 | 自動化(UI) | 052（更新の有無＝GetRequest非更新） |
| 015 | IT-16 | 実行結果 | 手動 | 071（取得と更新の一致＝非同一トランザクション・要確認） |
| 016 | IT-16 | 実行結果 | 自動化(UI) | 052（印刷とステータスの関係） |
| 017 | IT-16 | 実行結果 | 自動化(API/統合) | 023（受注特定） |
| 018 | IT-16 | 実行結果 | 自動化(API/統合) | 006（受注抽出・最大10件） |
| 019 | IT-16 | 実行結果 | 手動 | 061（出力内容） |
| 020 | IT-16 | 実行結果 | 自動化(API/統合) | 001（検索＝印刷対象抽出） |
| 021 | IT-24 | 実行結果 | 自動化(API/統合) | 040（店頭プリンタ認可＝認証なし実行） |
| 022 | IT-24 | 実行結果 | 自動化(API/統合) | 041（その他クライアント） |
| 023 | IT-24 | 実行結果 | 自動化(API/統合) | 002（GetRequest対象なし） |
| 024 | IT-16 | エラー | 自動化(API/統合) | 020（ResponseFile解析失敗） |
| 025 | IT-24 | フォーマット定義 | 自動化(API/統合) | 021/022（直接印刷結果偽・要素なし） |
| 026 | IT-17 | フォーマット定義 | 自動化(API/統合) | 023（受注が見つからない） |
| 027 | IT-17 | フォーマット定義 | 手動 | 070（例外＝500相当・実誘発要実機） |
| 028 | IT-17 | フォーマット定義 | 自動化(UI) | 050（ピック中更新） |
| 029 | IT-27 | 実行結果 | 自動化(API/統合) | 004（印刷ログファイル発火） |
| 030 | IT-27 | 実行結果 | 自動化(API/統合) | 001（GetRequest A05-01） |
| 031 | IT-27 | 実行結果 | 自動化(API/統合) | 010（SetResponse A05-02） |
| 032 | IT-24 | 実行結果 | 自動化(API/統合) | 040（認可） |
| 033 | IT-27 | 実行結果 | 自動化(UI) | 050（更新対象） |
| 034 | IT-27 | エラー | 自動化(API/統合) | 023（更新方法・受注特定エラー） |
| 035 | IT-24 | フォーマット定義 | 対象外 | 計算処理＝再計算なしのため |
| 036 | IT-24 | フォーマット定義 | 自動化(API/統合) | 010（応答値） |
| 037 | IT-24 | フォーマット定義 | 自動化(API/統合) | 030（ConnectionType） |
| 038 | IT-24 | フォーマット定義 | 自動化(API/統合) | 020（ResponseFile） |
| 039 | IT-24 | フォーマット定義 | 手動 | 060（GetRequest出力レイアウト） |
| 040 | IT-24 | 出力内容 | 手動 | 061（参照時点の出力内容） |
| 041 | IT-24 | 出力内容 | 自動化(UI) | 052（更新の有無） |
| 042 | IT-24 | 出力内容 | 手動 | 071（取得と更新の一致・要確認） |
| 043 | IT-24 | 出力内容 | 自動化(UI) | 052（印刷とステータスの関係） |
| 044 | IT-24 | 出力内容 | 手動 | 061（受注dtb_order項目） |
| 045 | IT-24 | 出力内容 | 手動 | 061 |
| 046 | IT-24 | 出力内容 | 手動 | 061 |
| 047 | IT-24 | 出力内容 | 自動化(API/統合) | 001（検索＝抽出） |
| 048 | IT-24 | 出力内容 | 手動 | 061（店頭プリンタ向け出力項目） |
| 049 | IT-24 | 出力内容 | 自動化(API/統合) | 041（その他クライアント） |
| 050 | IT-24 | 出力内容 | 自動化(API/統合) | 002（GetRequest対象なし） |
| 051 | IT-24 | 出力内容 | 自動化(API/統合) | 020（解析失敗） |
| 052 | IT-24 | 出力内容 | 自動化(API/統合) | 021（直接印刷結果偽・要素なし） |
| 053 | IT-24 | 出力内容 | 自動化(API/統合) | 023（受注が見つからない） |
| 054 | IT-24 | 出力内容 | 手動 | 070（例外） |
| 055 | IT-24 | 出力内容 | 自動化(UI) | 050（ピック中更新） |
| 056 | IT-24 | 出力内容 | 自動化(API/統合) | 004（印刷ログファイル発火） |
| 057 | IT-24 | 出力内容 | 手動 | 061（GetRequest出力項目） |
| 058 | IT-24 | 出力内容 | 自動化(UI) | 050（SetResponse更新） |
| 059 | IT-24 | 出力内容 | 自動化(API/統合) | 040（認可） |
| 060 | IT-24 | 出力内容 | 自動化(UI) | 050（更新対象） |
| 061 | IT-24 | 出力内容 | 自動化(UI) | 051（更新方法＝ブラウザ印刷フラグ消込） |
| 062 | IT-24 | 出力内容 | 対象外 | 計算処理＝再計算なしのため |
| 063 | IT-24 | 出力内容 | 自動化(API/統合) | 010（応答値） |
| 064 | IT-24 | 出力内容 | 自動化(API/統合) | 030（ConnectionType） |
| 065 | IT-24 | 出力内容 | 自動化(API/統合) | 020（ResponseFile） |
| 066 | IT-24 | 出力内容 | 手動 | 061（GetRequest出力項目） |
| 067 | IT-24 | 出力内容 | 自動化(API/統合) | 001（参照時点＝抽出） |
| 068 | IT-24 | 出力内容 | 自動化(UI) | 052（更新の有無） |
| 069 | IT-24 | 出力内容 | 手動 | 071（取得と更新の一致・要確認） |
| 070 | IT-24 | 出力内容 | 自動化(UI) | 052（印刷とステータスの関係） |
| 071 | IT-27 | 削除 | 対象外 | 本機能にレコード/ファイル削除処理がないため |
| 072 | IT-27 | 移動・リネーム | 対象外 | 本機能にファイル移動・リネーム処理がないため |
| 073 | IT-27 | コピー | 対象外 | 本機能にファイルコピー処理がないため |
| 074 | IT-33 | 対象機能 | 自動化(API/統合) | 001（印刷対象抽出＝参照系） |
| 075 | IT-33 | 対象機能 | 自動化(UI) | 052（対象レコードの値が変更されない＝GetRequest非更新） |
| 076 | IT-33 | 更新結果 | 自動化(API/統合) | 041（その他クライアント） |
| 077 | IT-33 | ファイル登録 | 自動化(UI) | 050（受注更新の確定＝SetResponseによるDB更新確認。登録相当の書き込み） |
| 078 | IT-33 | 参照系機能 | 自動化(API/統合) | 020（解析失敗） |
| 079 | IT-33 | ファイル出力 | 自動化(API/統合) | 021（直接印刷結果偽） |
| 080 | IT-27 | JSON | 対象外 | 本APIはJSON応答を持たない（応答はXML/空）ため |
| 081 | IT-27 | 同名ファイル | 手動 | 004（ログファイル名一意性・同名衝突は要実機確認） |
| 082 | IT-27 | 入力JSON | 対象外 | 本APIの入力はXML `ResponseFile` でJSON入力非該当のため |
| 083 | IT-27 | 配置先 | 自動化(API/統合) | 004（ログ配置先 var/log/print_logs/） |
| 084 | IT-27 | スキーマ | 手動 | 060（XMLスキーマ PrintRequestInfo 構造） |
| 085 | IT-09 | 実行結果 | 自動化(API/統合) | 010（SetResponse応答） |
| 086 | IT-09 | HTTPステータス | 自動化(API/統合) | 040（認可・認証なし応答） |
| 087 | IT-09 | リクエスト | 自動化(API/統合) | 010（正常パラメータ実行） |
| 088 | IT-32 | リクエスト | 自動化(API/統合) | 030/031（異常パラメータ） |
| 089 | IT-32 | リクエスト | 自動化(API/統合) | 031（想定外項目） |
| 090 | IT-19 | 同時実行数の制限 | 対象外 | 設計にレート制限・同時実行制限の記載が無いため |

集計（付帯表2と一致）: 自動化(UI) 15（007,014,016,028,033,041,043,055,058,060,061,068,070,075,077）／自動化(API/統合) 44（009,010,011,012,013,017,018,020,021,022,023,024,025,026,029,030,031,032,034,036,037,038,047,049,050,051,052,053,056,059,063,064,065,067,074,076,078,079,083,085,086,087,088,089）／手動 22（001,002,003,004,005,006,015,019,027,039,040,042,044,045,046,048,054,057,066,069,081,084）／対象外 9（008,035,062,071,072,073,080,082,090）。**未分類 0**（母集合90行）。母集合外の設計書補完ケース E2E-A05-02-007・054・072 は別管理。

注: UI 15行＝007,014,016,028,033,041,043,055,058,060,061,068,070,075,077。行単位の区分は上表のとおりで、合計は付帯表2（UI15／API44／手動22／対象外9＝90）と一致する。IT-ID別の内訳は UI＝IT-16:3／IT-17:1／IT-24:8／IT-27:1／IT-33:2、API＝IT-09:3／IT-16:7／IT-17:1／IT-24:20／IT-27:6／IT-32:3／IT-33:4。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A05-02-BASEINFO | 店舗基本情報 dtb_base_info（base_info_id） | 本店/支店を判別できる base_info_id 1件（本店=isMainShop真／支店=偽）。確定日時更新先の分岐確認に用いる | fixture | 専用設定・撤去不要 | 全API/統合・UIケース |
| SEED-A05-02-ORDER-PRINTABLE | 受注 dtb_order／配送 dtb_shipping／店頭注文番号 dtb_order_number | 印刷対象抽出条件に該当する受注（店頭受取で注文受領、または所定条件のスムーズ店頭受取、またはブラウザ印刷フラグ受注）。注文番号あり・スマレジコードあり・確定日時未設定。注文日/氏名カナ/合計金額が既知 | fixture／migration | 抽出条件成立状態へ復元してべき等化。境界用に11件以上の派生を持つ | 001,003,004,006,007,040,052,060,061,063 |
| SEED-A05-02-ORDER-NONE | 受注 dtb_order | 印刷対象抽出条件に該当する受注が0件の状態 | fixture | 対象0件状態へ復元 | 002,005 |
| SEED-A05-02-ORDER-TARGET | 受注 dtb_order | SetResponse更新対象の受注1件（ブラウザ印刷フラグOFF・ステータス未確定・受注IDが既知）。印刷ジョブIDの先頭部＝受注ID | fixture／synthetic | 各テスト前に未確定ステータスへリセットしべき等化 | 010,020,021,022,024,031,041,050,053,054 |
| SEED-A05-02-ORDER-BROWSERFLG | 受注 dtb_order | ブラウザ印刷フラグONの受注1件（SetResponseでフラグ消込・ステータス不変を確認） | fixture／synthetic | フラグON状態へリセット | 051 |
| SEED-A05-02-ORDER-SMOOTH | 受注 dtb_order／配送 dtb_shipping | 配送方法がスムーズ店頭受取の受注1件（合計金額欄の文言置換を確認） | fixture | 専用受注・撤去可 | 062 |
| SEED-A05-02-RESPONSEFILE | 印刷結果XML（synthetic） | 正常＝直接印刷結果が真・印刷結果要素（印刷ジョブID＝受注ID）を1件以上持つXML。異常＝解析不能XML／直接印刷結果が偽／印刷結果要素0件／存在しない受注ID／存在・不存在混在。具体のXMLキー名・属性・受注ID抽出規則は実装由来で固定せず要実機確認/仕様補足 | synthetic（正本md レスポンス仕様由来。XMLの具体キー名は実装位置情報を参照しつつ期待値は正本md由来） | テスト内生成・後始末不要 | 010,020,021,022,023,024,041,050,051,053,054,072 |
| SEED-M05-ADMIN | dtb_member（管理者） | 受注一覧/詳細でステータス・ブラウザ印刷フラグ・確定日時を確認する有効な管理者1（ID/PWは config 既定・2FA OFF） | fixture（config既定） | 既存利用・撤去不要 | 050,051,052,053（UI観測） |

注: `ResponseFile` は正本md記載のフィールド（直接印刷結果の真偽・印刷結果要素・印刷ジョブID）のみで最小構成し、プリンタ実機は使わない。解析キー名（`ServerDirectPrint`・`ePOSPrint`・`printjobid`）と受注ID抽出規則（`printjobid` 先頭部）は実装 `UpdatePrintedOrderStatusAction.php:48-79` を位置情報として参照するが、期待値は正本md由来とする。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（`dtb_order`・`dtb_order_number`・`dtb_shipping`）に従う。共通ログインは `config/default_login_information.json`／`config/default.config.ts` を流用。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `GET /order/print/direct`・`POST /order/print/direct`（同一パスをGET/POSTで割当・利用者視点の入口） | `#[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', methods: ['POST'])]`（OrderController.php:43） | **設計パス `/order/print/direct` と実装パス `/api/order/prints/direct/{base_info_id}` が不一致**（`/api`プレフィクス・複数形`prints`・`base_info_id`パスパラメータ）。テストは実装の実効パスへ送信し本差異を記録 | 全API/統合・UIケース | 不具合候補(パス乖離) |
| 2 | `GetRequest`はGETで受け付ける（利用者視点の入口・入出力「ConnectionTypeはGET・POSTいずれからも取得」） | `methods: ['POST']` のみ（OrderController.php:43） | **実装はPOSTのみ許可しGET未対応**。GETの`GetRequest`は到達不可。E2E-A05-02-007を専用の検出ケースとし、設計パスへGETで送信して「GETが受理されるか」を判定する（GET未対応なら落ちて本乖離を検出）。他の本体ケースは送信先を実装の実効パス（POST）へ統一し差異を記録 | 007（検出ケース）,001,002,003,040,052 | 不具合候補(メソッド乖離) |
| 3 | `ConnectionType`が想定値に一致しない場合は応答を組み立てず本文を返さない（エラー処理・レスポンス(失敗)） | HTTP400・Content-Type text/plain・空本文を返す（OrderController.php:91-96） | **実装は400を明示的に返す**。設計は「応答を組み立てず本文を返さない」。テストは仕様の意味（分岐が発火せず更新が確定しない）で判定し、ステータス値は実装値に固定しない | 030,031 | 要確認(不一致時応答) |
| 4 | `GetRequest`で生成した印刷情報が空でない場合、印刷情報XMLを `var/log/print_logs/` 配下へ書き出す（副作用・処理フロー(GetRequest)5・ログ・監査） | 当該書き出し処理がコメントアウト `// TODO :後ほど対応`（OrderController.php:57-67） | **実装は印刷ログファイル書き出しが無効化されており未実装**。テストは仕様どおり「空でなければ書き出し／空なら書き出さない」を期待し、実装が違えば落ちて検出する | 004,005 | 不具合候補(副作用未実装) |
| 5 | 「DBカラム>DB操作」節が「本機能は参照系でありDBへの登録・更新・削除を行わない」と記載 | 同md処理フロー(SetResponse)5・6・副作用は受注ステータス更新と確定日時設定を明記。実装 `UpdatePrintedOrderStatusAction.php:90-100` も更新する | **正本md内で自己矛盾**（DB操作節＝非更新 vs 処理フロー/副作用＝更新）。`SetResponse`は更新を行う前提でテストし、DB操作節は要確認 | 050,051,053 | 要確認(設計書内矛盾) |
| 6 | `SetResponse`のステータス更新時に補助情報の確定日時（confirm_date）へ現在時刻を設定。DBカラムは `picking_date`・`pick_finish_date`・`confirm_date` を列挙 | 本店=`setConfirmDate`／支店=`setPickingDate` の条件分岐（UpdatePrintedOrderStatusAction.php:91-97）。`pick_finish_date` は未設定 | **本店/支店で更新先日時列が分岐し、`pick_finish_date` は実装で更新されない**。確定日時の更新先列は要実機確認 | 053 | 要確認(更新先カラム) |
| 7 | 本エンドポイントは認証処理を行わず未認証で実行でき、401を返さない（認証・認可） | App配下ルート（`Controller/App/OrderController.php`）。firewall/IP制御は要実機確認 | **認証なしの実行可否・到達制御（経路/firewall）は実機確認が必要**。テストは仕様どおり「未認証で実行可・401を返さない」を期待 | 040,041 | 要確認(認証・経路制御) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（GET=GetRequest／POST=SetResponse） | 各分岐の到達・応答・GETメソッド受理可否 | 001,007,010,030 | カバー（GETメソッド受理は007で乖離検出。パス/メソッド乖離は付帯表4#1/#2） |
| 認証・認可（認証なし・401返さない・利用者照合なし） | 未認証で実行可・その他クライアント実行可 | 040,041 | カバー（経路制御は要実機・付帯表4#7） |
| 処理フロー GetRequest 1-6（判定→抽出→XML生成→空文字→ログ書出→ストリーム送信） | 正常XML応答・対象なし空データ・最大10件・octet-stream・ログ書出 | 001,002,003,004,006 | カバー（ログ書出は付帯表4#4で未実装） |
| 処理フロー SetResponse 1-7（判定→解析→偽/要素なし→受注特定→フラグ/ステータス更新→反映→空本文） | 正常空本文・解析失敗・偽・要素なし・受注なし・フラグ消込・ピック中更新 | 010,020,021,022,023,050,051 | カバー |
| 入出力 ConnectionType／ResponseFile | 分岐値・不一致・想定外項目・解析対象 | 001,010,030,031,020 | カバー |
| レスポンス(成功)（GetRequest=octet-stream XML／SetResponse=text/xml空本文） | Content-Type・本文有無 | 003,010 | カバー |
| レスポンス(成功) XML構造・サンプルレスポンス | XMLレイアウト・印字項目値・スキーマ | 060,061,063 | カバー（手動・帳票内容） |
| 処理フロー(GetRequest)3 合計金額欄置換（スムーズ店頭受取） | 合計金額欄の文言置換 | 062 | カバー（手動） |
| レスポンス(失敗)（対象なし200／解析失敗等200／不一致応答なし／例外500） | 各失敗分岐の応答 | 002,020,021,022,030,070 | カバー（例外は手動/要実機） |
| 副作用（印刷ログファイル書出／ステータス更新） | ログ書出発火・配置先・ステータス更新・確定日時 | 004,005,050,053 | カバー（ログ書出は付帯表4#4） |
| バリデーション（ConnectionType想定値・ResponseFile解析） | 想定値外で発火せず・解析失敗で更新せず | 030,031,020 | カバー |
| データ整合性（参照時点・更新の有無・取得と更新の一致・印刷とステータスの関係） | GetRequest非更新・SetResponse更新・非同一トランザクション | 052,050,071 | カバー（一致は手動/要確認） |
| DBカラム（order_status_id・picking_date・confirm_date・browser_print_flg・order_number・smaregi_code・value） | ステータス・フラグ・確定日時の更新／印字項目 | 050,051,053,061 | カバー（更新先カラムは付帯表4#6） |
| DB操作・DB更新（SetResponseによる受注ステータス＝ピック中・確定日時設定・ブラウザ印刷フラグ消込のDB反映／IT-23・IT-26相当） | ピック中更新・確定日時設定・フラグ消込のDB書き込み（管理画面UI観測＋再GetRequestでの抽出外れによる間接確認） | 050,051,053,054 | カバー（UI観測050/051/053＋UI非依存の間接確認054。設計DB操作節の「参照系で更新なし」は処理フロー/副作用の更新記述と矛盾し付帯表4#5で要確認。IT-23/IT-26は母集合90行外のため054は別管理） |
| エラー処理（不一致・対象なし・解析失敗・偽/要素なし・受注なし・例外） | 各エラー分岐 | 030,002,020,021,022,023,070 | カバー |
| ログ・監査（異常時の内容・エラー記録） | SetResponse異常時のログ記録 | 072 | 手動（サーバログ実観測・母集合外補完） |
| 排他制御・トランザクション（明示的ロックなし・別トランザクション） | 抽出集合と更新集合の非同一性 | 071 | カバー（手動/要確認） |
| 業務ルール・計算（再計算を行わない） | 金額・税・在庫の再計算なし | （対象外） | 対象外（本APIで再計算なし・付帯表2b 008,035,062） |
| 同時実行数の制限（IT-19・設計に記載なし） | レート制限 | （対象外） | 対象外（設計にレート制限・同時実行制限の記載なし） |

未カバーはいずれも理由（再計算なし・レート制限記載なし・例外/認証経路は要実機・ログはサーバ実観測）を明記済みで放置ではない。正本mdの各節を両レイヤ（API/統合＋UI観測）へ写像し、正常×異常の対（GetRequest正常001↔対象なし002／SetResponse正常010・050↔解析失敗020・偽021・要素なし022・受注なし023／ConnectionType一致001・010↔不一致030／ログ書出あり004↔なし005／ブラウザフラグ無→ピック中050↔フラグ有→消込051／GetRequest非更新052↔SetResponse更新050）を揃えた。帳票内容（XML印字レイアウト・項目値）は原則どおり手動に分類した。
