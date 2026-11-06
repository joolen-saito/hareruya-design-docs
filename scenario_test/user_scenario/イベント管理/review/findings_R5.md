主張: `scenario_list.md:23` の UEV-08 と `matrix_UEV-08/README.md:13-14` は、店舗都合の中止で「お客様に中止を連絡し、有料の申込は返金する」を手順・期待値として確定している。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:41-48` の連絡・返金は、お客様の「キャンセル申込」を起点とする工程。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Entry/EntryStatusBulkUpdateAction.php:46-63` は申込状況と履歴を更新するだけで、店舗都合の中止時の連絡・返金を定めない。
判定: 根拠の捏造
修正案: UEV-08 の連絡・返金を確定した期待値から外し、店舗都合の中止で必要な対応として判断待ちに置く。

主張: `scenario_list.md:105` の判断待ち2は、申込済みの申込がある UEV-08 について「日程を非公開にするか削除するか」は決まらないとしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html:1404` は「申込されている日程の削除はできない」。`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/ScheduleController.php:205-208` も、日程に申込があれば削除を拒む。
判定: 事実の誤り
修正案: UEV-08 の対象では削除を選択肢から外し、判断待ちは正本から決まらない連絡・返金と決済中の扱いに絞る。

主張: `matrix_UEV-02/exceptions.tsv:2` の EX1 は、決済画面で中止するか結果が正常でなければ、申込が取り消されマイイベントに載らないとしている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventPaymentSettleService.php:79-84` は取引照会の保留結果で申込を更新せず、`src/Eccube/Controller/Front/Event/EventEntryController.php:292-302` はその場合もキャンセル画面を表示する。`src/Eccube/Repository/DtbEventEntryRepository.php:291-304` は「決済中」をマイイベントの取得対象から除いていない。
判定: 事実の誤り
修正案: EX1 の取消・一覧非表示は取引照会で不成立が確定した場合に限り、保留時は「決済中のまま一覧に残る」と分ける。

主張: `matrix_UEV-03/exceptions.tsv:5` の EX4 は差し込み条件を A2 に限り、未入力項目を「お問い合わせ内容」としている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:73-81` が A1 で事前入力するのはイベント情報まで。`src/Eccube/Resource/template/default/Block/js/contact_js.twig:25-28` は A1・A2 とも未入力の `questionnaire` で送信を止め、`src/Eccube/Resource/locale/messages.ja.yaml:399-402` の画面名は「アンケート」である。
判定: 事実の誤り
修正案: EX4 を A1・A2 の両方に差し込める条件にし、未入力項目を「アンケート」と記す。
