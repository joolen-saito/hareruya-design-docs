主張: `外部連携/scenario_list.md:68-72、111` は PointGranter の受信・中継を USM-23・UEX-13 に割り当てるが、ポイント増減が0の経路がどちらのL3にも無い。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterRelayService.php:66-72` は「増減ポイントが 0 のためスマレジ連携をスキップ」とし、履歴を作らず成功を返す。`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:1753-1762` は端末販売を「スマレジへデータを転送する」と定めており、この差も記録されていない。
判定: 事実の欠落
修正案: 増減0で中継・履歴登録をせず成功を返す経路をL3と連携の網羅に加え、設計書との食い違いを記録する。

主張: `外部連携/scenario_list.md:52、105` と `matrix_UEX-07/fl_table.tsv:2-13` はデッキ検索 A15-13 を UEX-07 で扱うとするが、L3は公開範囲・見る人・入口・下書きの有無だけである。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0515_基本設計仕様書(API_デッキビルダー).html:657-661` は「大会デッキを含めるかとユーザーデッキを含めるか」を個別指定し、両方除外なら空の一覧と総件数0を返すほか、フォーマット・順位・採用カード等で絞り込み、件数とページで結果を変えると定める。この検索結果の分岐を通る行が無い。
判定: 事実の欠落
修正案: A15-13 の検索対象・主要な絞り込み・件数とページの分岐を、検索を扱うシナリオのL3に加える。

主張: `外部連携/scenario_list.md:106` の UEX-08 は「編集」を起点に、下書き保存・確定保存・削除を一つのL2にまとめ、終点にも保存結果と削除結果を併記している。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0515_基本設計仕様書(API_デッキビルダー).html:572` は更新の結果を下書きまたは確定保存とし、同ファイル`:597-602` は別の削除要求で論理削除すると定める。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:11-14` の単位は「起点の業務イベントから、業務として完了した状態になるまで」である。
判定: 切り方の誤り
修正案: 下書きから確定保存までを UEX-08 とし、後からデッキを削除する業務イベントを別のL2に分ける。
