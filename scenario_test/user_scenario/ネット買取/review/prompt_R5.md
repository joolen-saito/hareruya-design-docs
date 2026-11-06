# レビュー依頼：ネット買取のシナリオ一覧（R5）

あなたは独立したレビュアーです。著者は別人です。成果物を読み、正本と照らして誤りと抜けを指摘してください。ファイルは書き換えないでください（読み取り専用）。

## 成果物（レビュー対象）

1. `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ネット買取/scenario_list.md`：ネット買取のシナリオ一覧（L2）、業務フローパターンの網羅、対象外、状態の遷移の網羅、実装と設計書で確かめたこと、設計書との食い違い
2. 組み合わせテストマトリクス
   - `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ネット買取/matrix_UNK-01/`（README.md・fl_table.tsv・prohibitions.tsv・exceptions.tsv・matrix.md）
   - `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ネット買取/matrix_UNK-02/`（README.md・fl_table.tsv・prohibitions.tsv・exceptions.tsv・matrix.md）
   - `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/ネット買取/matrix_UNK-04/`（README.md・fl_table.tsv・prohibitions.tsv・exceptions.tsv・matrix.md）

作り方の決まりは `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md` にある（シナリオの単位、節の順、正本、判断の決まり）。同じ形の見本として通販（`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/`）があり、codexのレビューを3巡済ませている。

## 今回の変更（R4 から新しい回）

R1〜R3 でいったん閉じたあと、依頼者の指示「買取の場合は本人確認証明が必要です」を受けて、本人確認の証明を金額によらない必須条件として扱い直した。今回はこの変更に関わる部分だけを見る。
- UNK-01 のマトリクスに因子K（会員の本人確認の状態）、UNK-02 の問題ありを2つに分けた、UNK-04 の例外E4（1万円未満でも身分証明書が未登録なら振込依頼済みにできない）とE6（期限切れのバッチ後）、UNK-07・各READMEの前提
- 実装と設計書で確かめたこと・判断待ち（身分証明書の欄の登録方法など）・設計書の不足を足した
確かめること：本人確認の証明が必須になっている場所・なっていない場所の結論が、設計書（0305・0206・0306・0207・0408）・新実装・現行 pf-eccube3 から言えるか。抜けている条件・例外は無いか。

## 追加の変更（R5）

依頼者の指示「種類別のフローや処理が変わらないならまとめて」（`AUTHORING.md` 末尾「水準のまとめ方」）を受けて、`matrix_UNK-01`（口座種別・申込時の本人確認の状態）・`matrix_UNK-02`（身分証の種類をマイナンバーカードとそれ以外に、問題ありを1つに）・`matrix_UNK-04`（確認済みの2種を1つに）をまとめた（各 README の `## まとめた水準`）。R4の指摘で UNK-14（身分証の期限切れのバッチ）を足した。まとめの根拠が正本から言えるか（流れ・処理・表示・期待値が本当に変わらないか）も確かめること。

## 前の巡の扱い

指摘と扱いは `review/` の `dispositions_R1.md`〜`dispositions_R4.md` にある。却下したものは繰り返さない。前の巡で直したところを特に確かめること。新しい事実の指摘だけを書く。

## シナリオの単位の決まり（成果物の制約）

- シナリオ1本は「起点の業務イベントから、業務として完了した状態になるまで」。担当者が替わっても切らない
- 日をまたぎ、システムの状態が何かを待つもの（入荷待ち、発売日まで保管、期限切れ、後日の処理）は別の1本にする。ただし、日をまたぐのがシステムの外の作業だけで、システムの状態が何も待たないときは分けない
- L1 業務領域 → L2 シナリオ → L3 バリエーション（組み合わせテストマトリクスで絞る）→ L4 ステップ。今回はL2の一覧とL3まで。L4（手順と期待値）はまだ無くてよい
- 前提データ（マスタ）はシナリオから外す。システムを触らない作業は「システムの外」と書く
- フェーズ2見送り・廃止の機能は入れない（`/home/y-saito/Developments/hareruya-design-docs/functions/phase2_specs.json`・`phase2_candidates.tsv`）
- 設計書の不備は記録するだけで起票しない

## 正本（オラクル）

- 業務フロー：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/` の 14_ネット買取.md
- 観点の物差し：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/シナリオテスト観点.md` 第1部（IPAなどの公開資料から作った SV-01〜SV-20）
- ほかの業務のシナリオ一覧：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/*/scenario_list.md`（参照しているIDの照合用）
- 今のシナリオ（もとのシナリオ欄の照合用）：`/home/y-saito/Developments/hareruya-design-docs/scenario_test/scenario/SCN-ONLINE-KAITORI-*.md`
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
