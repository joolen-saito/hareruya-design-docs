# M07-01 不合格の調べ（2026-11-18・齋藤以外の行）
- IT-M07-01-026（一覧 IT-M07-01-021）: 不合格。/admin/purchase/page/2 を保持条件なしで開くと一覧10件とページ送りが出る。設計書（現行仕様 業務ロジック 初期表示と再検索 0206 html:1179-1180）は保持が無ければ一覧なしの初期表示。ee は PurchaseController.php:153-166 から SearchControllerTrait.php:181-188 へ渡るが一覧が出る。pf は SearchControllerTrait.php:162-172 で初期表示へ戻す。既存課題に同論点なし（3052/2615 は別画面）。実装乖離・P3で起票下書き IT-M07-01-026.md。
