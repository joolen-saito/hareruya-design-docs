# レビュー依頼：業務周期のシナリオ一覧（R3）

あなたは独立したレビュアーです。著者は別人です。成果物を読み、正本と照らして誤りと抜けを指摘してください。ファイルは書き換えないでください（読み取り専用）。

## 成果物（レビュー対象）

1. `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務周期/scenario_list.md`：業務周期のシナリオ一覧（L2）、業務フローパターンの網羅、対象外、状態の遷移の網羅、実装と設計書で確かめたこと、設計書との食い違い
2. 組み合わせテストマトリクス
   - （マトリクスは無い）

作り方の決まりは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md` にある（シナリオの単位、節の順、正本、判断の決まり）。同じ形の見本として通販（`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/`）があり、codexのレビューを3巡済ませている。

## 前の巡の扱い

指摘と扱いは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務周期/review/` の `dispositions_R1.md`・`dispositions_R2.md` にある。却下したものは繰り返さない。前の巡で直したところを特に確かめること。新しい事実の指摘だけを書く。今回が最後の巡。

## シナリオの単位の決まり（成果物の制約）

- シナリオ1本は「起点の業務イベントから、業務として完了した状態になるまで」。担当者が替わっても切らない
- 日をまたぎ、システムの状態が何かを待つもの（入荷待ち、発売日まで保管、期限切れ、後日の処理）は別の1本にする。ただし、日をまたぐのがシステムの外の作業だけで、システムの状態が何も待たないときは分けない
- L1 業務領域 → L2 シナリオ → L3 バリエーション（組み合わせテストマトリクスで絞る）→ L4 ステップ。今回はL2の一覧とL3まで。L4（手順と期待値）はまだ無くてよい
- 前提データ（マスタ）はシナリオから外す。システムを触らない作業は「システムの外」と書く
- フェーズ2見送り・廃止の機能は入れない（`/home/y-saito/Developments/hareruya-design-docs/functions/phase2_specs.json`・`phase2_candidates.tsv`）
- 設計書の不備は記録するだけで起票しない

## 正本（オラクル）

- 業務フロー：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/` の 全業務の業務フロー（05〜18）
- 観点の物差し：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/シナリオテスト観点.md` 第1部（IPAなどの公開資料から作った SV-01〜SV-20）
- ほかの業務のシナリオ一覧：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/*/scenario_list.md`（参照しているIDの照合用）
- 今のシナリオ（もとのシナリオ欄の照合用）：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/scenario/SCN-*.md`
- 設計書HTML（Excel由来の部分を優先）：`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/*.html`。巨大なので grep で引用文を探すこと
- 現行の実装：本店EC `/home/y-saito/Developments/pf-eccube3/`、支店EC `/home/y-saito/Developments/ec-cube/app/Customize/`、API `/home/y-saito/Developments/pf-api/`、デッキ `/home/y-saito/Developments/deck-api/`、買取端末アプリ `/home/y-saito/Developments/front-application/MTGBuyer/`
- 新実装：`/home/y-saito/Developments/ec-cube-enterprise/`
- 開発環境の設定：`/home/y-saito/Developments/ec-cube-enterprise/eccube_db_20260907.sql.gz`（zcat と sed/grep で該当表の COPY 部分だけ読む。認証情報・個人情報は出力に絶対に書かない。書くのは必要な項目名と値だけ）
- 依頼者の裁定：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md`

## 重点観点

1. **業務フローパターンの網羅**：全パターンが表にあり、割り当てたシナリオが本当にそのパターンの工程を通るか。対象外の理由が正しいか（システムを本当に触らないか、フェーズ2見送りか）
2. **シナリオの切り方**：上の決まりどおりか。状態が待つところで分けているか。担当の替わり目で切っていないか
3. **起点・終点・通る状態**：正本どおりか。状態名が正本の名前か。一部の処理で状態が変わると書き過ぎていないか
4. **抜け**：業務フロー・設計書・今のシナリオにある範囲内の業務・分岐・例外で、どのシナリオにも入っていないもの
5. **状態の遷移の網羅**：範囲内の遷移で、どのシナリオも通らないものは無いか
6. **実装と設計書で確かめたこと・設計書との食い違い**：根拠のコード・設定・引用文が実在し、結論がそこから言えるか。引用文が別のシートや別の機能の記述ではないか
7. **マトリクス**：因子・水準の根拠が実在するか。禁則が正本どおりか（起こりうる組を誤って禁じていないか、ありえない組が行に残っていないか）。例外の差し込み先の条件が例外の成立に必要十分か
8. **周期の網羅**：全業務の全シナリオが周期の表に載り、周期（随時・日次・週次・月次・期末・年次・特定日）の割り当てが正本（業務フロー・バッチの実行タイミング）どおりか。締め・日付の切り替え・月末月初・受付時間の境界など、周期の境目で起きるシナリオに抜けが無いか（SV-03）

## 指摘しないもの

- 物理名（テーブル名・内部の識別子）を成果物に足す提案
- 文体・言い回しの好み
- L4（画面操作の手順と期待値）が無いこと
- 他業務の範囲（その業務のシナリオ一覧で扱うもの）
- 非機能（性能・障害回復・運用・セキュリティ・使用性。SV-11〜SV-15）、データ移行（SV-18）、現行との比較（SV-17）。依頼者の決定でシナリオテストの範囲外

## 出力形式

指摘が無ければ `NONE` の1語だけを出力する。
指摘があるときは、指摘ごとに次の4行を書く（各行は行頭から）。

主張: 成果物のどこが何と言っているか（ファイル名と行・シナリオID・因子ID/禁則ID）
実際: 正本ではどうか（ファイルパス:行番号 と引用文。DBダンプは表名と該当行の必要な列だけ）
判定: 事実の誤り / 根拠の捏造 / 事実の欠落 / 切り方の誤り / 禁則の誤り のいずれか
修正案: 結論を先に1文で
