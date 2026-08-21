# 敵対レビュー観点: メッセージ一覧の物理名→論理名 置換

あなたはレビュアーである。著者ではない。以下の成果物を批判的に検証せよ。

## 正本（オラクル）

- 実装の正本: `/home/y-saito/Developments/ec-cube-enterprise`（ee 実ソース）
- 論理名規約の正本: `/home/y-saito/Developments/hareruya-design-docs/.cursor/skills/logical-naming/SKILL.md`
- 論理名対応表: `/home/y-saito/Developments/hareruya-design-docs/e2e/config/logical-names.tsv`

## 成果物（レビュー対象）

1. 置換内容の一覧（54セル）:
   `/home/y-saito/Developments/hareruya-design-docs/message_inventory/logical_naming_review/changes.tsv`
   列は `メッセージID / 列 / 変更前 / 変更後 / 画面上の文言 / 根拠(file:line)`。
2. 反映先の正本: `/home/y-saito/Developments/hareruya-design-docs/message_inventory/message_inventory.tsv`
3. 生成物: 同ディレクトリの `MESSAGE_LIST.tsv` / `MESSAGE_LIST.md`
4. 置換スクリプト（置換表を内蔵）:
   `/home/y-saito/Developments/hareruya-design-docs/.codex/skills/hareruya-message-inventory/scripts/apply_logical_names_msglist.py`
5. 再混入ゲート（ALLOW リストを内蔵）:
   `/home/y-saito/Developments/hareruya-design-docs/.codex/skills/hareruya-message-inventory/scripts/check_logical_naming_msglist.py`
6. 対応表へ追記した19行: `e2e/config/logical-names.tsv` のうち種別が
   フラッシュキー/Twig描画関数/ルート名/DBテーブル/フォーム項目/リクエストパラメータ/定数/画面変数/検索応答フィールド の行。

## 前提（ユーザー決定 2026-08-19。指摘対象外）

次は**意図的に物理名のまま残している**。「置換漏れ」として指摘しないこと。

- `メッセージ内容` / `メッセージ内容(英語)` 列: 画面に出る表示文字列そのものの逐語記録。
  ロケール未定義でキー文字列が画面に出る46件も、その事実の記録なので逐語のまま残す。
- `根拠(file:line)` 列: 出典。実ソース追跡と捏造ゼロ検証の再実行性を担保するため残す。
- `画面` / `要素` / `要素(表示)` 列: MESSAGE_LIST に出力されない正本内部の作業列。今回の対象外。
- `EE-*` で始まる行: 機能未割当の退避バケット。MESSAGE_LIST に出力されないので対象外。
- 設計書 `functions/**/*.md` の『表示メッセージ』表: 今回は同期しない（ユーザー決定）。
- 規約の「対象外」に該当するもの: HTTPパス・HTTPメソッド・APIレスポンスの契約フィールド名
  (`errors` `code` `success` `redirectUrl` 等)・HTMLセレクタ/要素id/class・ブラウザ標準API名
  (`window.confirm`)・ホスト名 (`admin.hareruyamtg.com`)・言語キーワード (`null`)。

## 重点観点

1. **論理名の捏造**: `変更後` に書かれた業務名が、実ソース（画面ラベル・ロケール yaml の文言・
   DBカラムの `comment`・Entity や定数のコメント・Repository のメソッドコメント）に根拠を持つか。
   根拠が無い、または根拠と違う語を当てているものを挙げよ。`file:line` で示すこと。
2. **意味の改変**: `変更前` と `変更後` で、表示条件・表示位置・後続処理の**意味が変わっていない**か。
   条件を一般化しすぎ／限定しすぎ／別の条件にすり替えたものを挙げよ。実装を読んで判定すること。
3. **誤った同定**: 物理名の指す実体を取り違えていないか。特に次を実装で確認せよ。
   - `DtbBuyOrder` → 「ネット買取受注」（店頭買取 `DtbOtcBuyOrder` と取り違えていないか）
   - `Member` → 「管理者アカウント」（会員 `Customer` と取り違えていないか）
   - `MtbBuyOrderStatus` → 「買取注文ステータスマスタ」
   - `stockOrder` → 「数量マイナスの商品明細を含まない受注」
   - `fallback` → 「検索応答に補正語が含まれている」
   - `register=1 / =2 / ENTRY_SUCCESS` → 「会員登録結果が『登録成功』/『登録失敗』」
   - `import_file` → 「CSVファイル」
   - `identification` → 「証明書ID」／`status` → 「ステータスID」／`free_comment` → 「コメント」
   - `admin_stock_change_csv_pre_validate` → 「在庫変更CSV事前検証」
   - `shopping_error` → 「購入エラー画面」／`eccube.front.error` → 「フロント向けエラーフラッシュ」
   - `getAnalysisSummary()` → 「分析集計結果」／`pagination.totalItemCount` → 「検索結果の総件数」
4. **対応表19行の出典**: `e2e/config/logical-names.tsv` に追記した行の `出典` の file:line が実在し、
   その行が論理名の根拠になっているか。実在しない・根拠にならない行を挙げよ。
5. **ALLOW リストの妥当性**: `check_logical_naming_msglist.py` の `ALLOW` に、
   本来は論理名化すべき内部識別子が紛れていないか。
6. **置換漏れ**: 上記「前提」の対象外を除いて、`種別` / `どこに` / `トリガー（条件）` / `後続処理` の
   4列に、まだ内部識別子や DB 物理名が残っていないか（`EE-*` 行を除く）。

## 出力形式

指摘が無ければ `NONE` の1語だけを出力せよ。
指摘があるときは1件ごとに次の4行で書け。推測を断定として書かないこと。

```
主張: <何が誤りか>
実際: <file:line と実ソースの内容>
判定: <捏造 / 意味改変 / 誤同定 / 出典不備 / 置換漏れ>
修正案: <結論から書く。1文>
```

---

## R1 の指摘への対応（R2 はこれを踏まえて検証すること）

反映済み:

- 対応表 `e2e/config/logical-names.tsv` へ12行追加（status / NotBlank /
  MtbStockSplitJoinStatus::JOIN_SOURCE_REGISTERED / MtbBoard::BOARD_ID_COMMAND / getUser() /
  MyDecks / entirePeriodSummary / daysSummary / pagination.totalItemCount /
  getAnalysisSummary() / prepend / Mail）。
- `register` / `dtb_customer` / `dtb_product_class` / `dtb_member` の出典を、論理名を実際に
  記述している行へ差し替え。
- `M04-17-MSG-001` の `prepend` を除去（「…の先頭）」）。ゲートの ALLOW からも削除。
- `M10-08-MSG-003` の `Mail` を「対象のメールテンプレート」へ置換。ゲートの COMMON から
  `Mail` と `Template` を削除。
- 置換表の出典（MyDecks / entirePeriodSummary / daysSummary / getAnalysisSummary()）を
  条件・変数を直接示す行へ差し替え。

**却下（再提示しないこと）**: 「`admin_order*` 6行の出典 `pf-eccube3` が非正本」。
`pf-eccube3` は現行踏襲機能の現行実装であり、正本である（`functions/SOURCE-ATTRIBUTION-README.md`）。
当該6行は M05-01 用に ee 側と別物として意図的に登録したもので、今回の変更対象でもない。

## R2 の指摘への対応（R3 はこれを踏まえて検証すること）

すべて反映済み（いずれも出典文字列の是正で、置換内容そのものは不変）。

- `free_comment` の出典を `BuyOrderController.php:96-98` へ（対応表・置換スクリプトの両方）。
- 置換スクリプトの `ProductClass` / `Customer` / `Member` / `Member+getUser()` の出典を、
  R1 で確定した論理名記述行（`ProductClass.php:55-58` / `messages.ja.yaml:2743-2751` /
  `Member.php:55-62` + `LoginController.php:40-43`）へ同期。
- `pagination.totalItemCount` の置換ルールを機能ごとに分割し、それぞれのテンプレート
  `file:line`（`OtcBuyOrder/index.twig:155-161` / `OtcBuyOrder/history.twig:160-166` /
  `Purchase/history.twig:192-198` / `Purchase/index.twig:157-161`）を出典に設定。
- `JOIN_SOURCE_REGISTERED` / `command` の出典を実ソース
  （`MtbStockSplitJoinStatus.php:29-30` + `messages.ja.yaml:5109` /
  `MtbBoard.php:36` + `messages.ja.yaml:4321-4338`）へ差し替え。

R3 では、上記が実際に反映されているかと、まだ確証のある事実誤りが残っていないかだけを見よ。
既出の指摘の再提示はしないこと。
